import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { getVariants, findVariantById } from "@/lib/product-pricing";
import type { ProductVariant } from "@/data/products";
import {
  PAYTR_TOKEN_URL,
  getPaytrCredentials,
  getTokenHash,
  tlToKurus,
} from "@/lib/paytr";

/**
 * Ödeme başlatma — SUNUCU TARAFI TEK GİRİŞ NOKTASI.
 *
 * Mimari kural: bu route `orders` koleksiyonuna ASLA yazmaz.
 * Yalnızca `payment_attempts/{id}` (geçici ödeme denemesi) oluşturur.
 * Gerçek sipariş SADECE doğrulanmış PayTR success callback'inde yaratılır.
 *
 * Güvenlik: client'tan gelen fiyat/tutar bilgisine GÜVENİLMEZ. Ürün fiyatları
 * Firestore'dan sunucu tarafında okunur ve toplam burada yeniden hesaplanır.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface IncomingItem {
  id: string;
  quantity: number;
  color?: string | null;
  size?: string | null;
  /** Seçilen ölçü varyantının kimliği — fiyat SUNUCUDA bununla bulunur. */
  variantId?: string | null;
}

interface CheckoutBody {
  items: IncomingItem[];
  clientTotal: number;
  email: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  district?: string;
  uid?: string | null;
}

const MAX_ITEMS = 50;
const MAX_QTY = 99;
/** Kuruş yuvarlamalarına tolerans (1 kuruş). */
const AMOUNT_EPSILON = 0.01;

const bad = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<CheckoutBody>;

    const {
      items,
      clientTotal,
      email,
      fullName,
      phone,
      address,
      city,
      district,
      uid,
    } = body;

    /* ── 1. Girdi doğrulama ─────────────────────────────────────────── */
    if (!Array.isArray(items) || items.length === 0) return bad("Sepet boş.");
    if (items.length > MAX_ITEMS) return bad("Sepette çok fazla ürün var.");
    if (!email?.trim() || !fullName?.trim() || !phone?.trim() || !address?.trim() || !city?.trim()) {
      return bad("Zorunlu müşteri alanları eksik.");
    }
    for (const it of items) {
      if (!it?.id || typeof it.id !== "string") return bad("Geçersiz ürün kimliği.");
      if (!Number.isInteger(it.quantity) || it.quantity < 1 || it.quantity > MAX_QTY) {
        return bad("Geçersiz ürün adedi.");
      }
    }

    /* ── 2. SUNUCU TARAFI FİYAT DOĞRULAMA ───────────────────────────── */
    // Ürün fiyatları YALNIZCA Firestore'dan okunur. Client'ın gönderdiği
    // price / total değerleri hesaplamada kullanılmaz, sadece karşılaştırılır.
    const uniqueIds = Array.from(new Set(items.map((i) => i.id)));
    const snapshots = await adminDb.getAll(
      ...uniqueIds.map((id) => adminDb.collection("products").doc(id))
    );

    interface ServerProduct {
      price: number;
      name: string;
      variants: ProductVariant[];
      images: string[];
      stockCode: string | null;
    }

    const productById = new Map<string, ServerProduct>();
    for (const snap of snapshots) {
      if (!snap.exists) return bad(`Ürün bulunamadı: ${snap.id}`);
      const data = (snap.data() ?? {}) as Record<string, unknown>;
      const price = Number(data.price);
      const variants = getVariants({
        price,
        variants: Array.isArray(data.variants) ? (data.variants as ProductVariant[]) : null,
      });

      // Varyantı olmayan üründe taban fiyat geçerli olmak ZORUNDA.
      if (variants.length === 0 && (!Number.isFinite(price) || price <= 0)) {
        return bad(`Ürün fiyatı geçersiz: ${snap.id}`);
      }

      productById.set(snap.id, {
        price,
        name: String(data.name ?? "Ürün"),
        variants,
        images: Array.isArray(data.images) ? (data.images as string[]) : [],
        stockCode: data.stockCode ? String(data.stockCode) : null,
      });
    }

    /**
     * Fiyat KAYNAĞI yalnızca sunucudaki ürün dokümanıdır.
     *  - variants varsa: variantId ile EXACT varyant bulunur, variant.price kullanılır.
     *  - birden fazla varyant varken variantId yoksa → ödeme başlatılmaz.
     *  - client'ın gönderdiği size, sunucudaki variant.size ile uyuşmalı.
     *  - variants yoksa: legacy product.price kullanılır (eski davranış korunur).
     */
    const validatedItems = [];
    for (const it of items) {
      const p = productById.get(it.id)!;

      if (p.variants.length > 0) {
        if (!it.variantId) {
          return bad(`"${p.name}" için ölçü seçimi gerekli.`);
        }
        const variant = findVariantById({ price: p.price, variants: p.variants }, it.variantId);
        if (!variant) {
          return bad(`"${p.name}" için seçilen ölçü bulunamadı.`);
        }
        if (it.size && String(it.size).trim() !== variant.size) {
          return bad(`"${p.name}" için seçilen ölçü doğrulanamadı.`);
        }
        validatedItems.push({
          id: it.id,
          name: p.name,
          price: Number(variant.price),      // AUTHORITATIVE
          quantity: it.quantity,
          color: it.color ?? null,
          size: variant.size,                 // sunucudaki ölçü etiketi
          variantId: variant.id,
          image: p.images[0] ?? null,
          stockCode: p.stockCode,
        });
      } else {
        validatedItems.push({
          id: it.id,
          name: p.name,
          price: p.price,                     // legacy tek fiyat
          quantity: it.quantity,
          color: it.color ?? null,
          size: it.size ?? null,
          variantId: null,
          image: p.images[0] ?? null,
          stockCode: p.stockCode,
        });
      }
    }

    const serverTotal = Number(
      validatedItems.reduce((acc, i) => acc + i.price * i.quantity, 0).toFixed(2)
    );

    if (serverTotal <= 0) return bad("Geçersiz sipariş tutarı.");

    // Client toplamı ile sunucu toplamı uyuşmuyorsa ödeme BAŞLATILMAZ.
    if (
      typeof clientTotal === "number" &&
      Math.abs(clientTotal - serverTotal) > AMOUNT_EPSILON
    ) {
      console.error(
        `[paytr] Tutar uyuşmazlığı — client=${clientTotal} server=${serverTotal}; ödeme reddedildi`
      );
      return bad("Sepet tutarı doğrulanamadı. Lütfen sepetinizi yenileyip tekrar deneyin.");
    }

    /* ── 3. payment_attempt oluştur (orders'a DEĞİL) ─────────────────── */
    const attemptRef = adminDb.collection("payment_attempts").doc();
    const merchantOid = attemptRef.id; // merchant_oid = attempt doc ID

    const customerInfo = {
      name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      district: district?.trim() || null,
    };

    await attemptRef.set({
      merchantOid,
      customerInfo,
      items: validatedItems,
      expectedTotal: serverTotal,
      uid: uid ?? null,
      isGuest: !uid,
      paymentStatus: "pending",
      createdAt: FieldValue.serverTimestamp(),
    });

    /* ── 4. PayTR token ─────────────────────────────────────────────── */
    const creds = getPaytrCredentials();

    const userIp =
      (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "1.2.3.4";

    const paymentAmount = tlToKurus(serverTotal); // SADECE sunucu tutarından
    // PayTR sepet açıklaması: "Ürün adı — 200x30 cm — Bej"
    // Fiyat yine SUNUCU authoritative varyant fiyatıdır.
    const basket = validatedItems.map((item) => {
      const label = [item.name, item.size, item.color].filter(Boolean).join(" — ");
      return [label.substring(0, 100), item.price.toFixed(2), String(item.quantity)];
    });
    const userBasket = Buffer.from(JSON.stringify(basket)).toString("base64");

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.decoroys.com";
    const noInstallment = "0";
    const maxInstallment = "0";
    const currency = "TL";
    const testMode = process.env.PAYTR_TEST_MODE === "1" ? "1" : "0";

    const paytrToken = getTokenHash(creds, {
      userIp,
      merchantOid,
      email: customerInfo.email,
      paymentAmount,
      userBasket,
      noInstallment,
      maxInstallment,
      currency,
      testMode,
    });

    const params = new URLSearchParams({
      merchant_id: creds.merchantId,
      user_ip: userIp,
      merchant_oid: merchantOid,
      email: customerInfo.email,
      payment_amount: paymentAmount,
      paytr_token: paytrToken,
      user_basket: userBasket,
      debug_on: "0",
      no_installment: noInstallment,
      max_installment: maxInstallment,
      user_name: customerInfo.name,
      user_address: `${customerInfo.address}${customerInfo.district ? ", " + customerInfo.district : ""}, ${customerInfo.city}`.slice(0, 255),
      user_phone: customerInfo.phone,
      // Başarı sayfası ödeme gerçeğinin kaynağı DEĞİLDİR; orderId yalnız
      // "işleniyor" ekranının doğru kaydı sorgulayabilmesi için taşınır.
      merchant_ok_url: `${appUrl}/odeme/basarili?orderId=${merchantOid}`,
      merchant_fail_url: `${appUrl}/odeme/basarisiz?orderId=${merchantOid}`,
      currency,
      test_mode: testMode,
      lang: "tr",
    });

    const paytrRes = await fetch(PAYTR_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
      cache: "no-store",
    });

    const paytrData = (await paytrRes.json()) as {
      status: string;
      token?: string;
      reason?: string;
    };

    if (paytrData.status !== "success" || !paytrData.token) {
      console.error("[paytr] token alınamadı:", paytrData.reason ?? paytrData);
      await attemptRef.update({
        paymentStatus: "token_failed",
        tokenError: paytrData.reason ?? "PayTR token alınamadı",
        tokenFailedAt: FieldValue.serverTimestamp(),
      });
      return bad(paytrData.reason ?? "PayTR token alınamadı");
    }

    return NextResponse.json({ token: paytrData.token, merchantOid });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Sunucu hatası";
    console.error("[paytr] route hatası:", message);
    return NextResponse.json({ error: "Ödeme başlatılamadı." }, { status: 500 });
  }
}
