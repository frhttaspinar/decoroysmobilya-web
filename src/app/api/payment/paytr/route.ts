import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { productSize, productColor } from "@/lib/product-pricing";
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
 * Güvenlik: client'tan gelen fiyat/ölçü/renk bilgisine GÜVENİLMEZ. Bunların
 * tamamı Firestore ürün dokümanından sunucu tarafında okunur ve toplam burada
 * yeniden hesaplanır. Client yalnız ürün kimliği ve adet gönderebilir.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Client'tan kabul edilen TEK veri: ürün kimliği ve adet.
 * Gövdede price/size/color/variantId gelse bile OKUNMAZ.
 */
interface IncomingItem {
  id: string;
  quantity: number;
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

    /* ── 2. SUNUCU TARAFI ÜRÜN DOĞRULAMA ────────────────────────────── */
    // Fiyat, ölçü ve renk YALNIZCA Firestore'dan okunur. Client'ın gönderdiği
    // price / size / color değerleri hesaplamada ve snapshot'ta kullanılmaz.
    const uniqueIds = Array.from(new Set(items.map((i) => i.id)));
    const snapshots = await adminDb.getAll(
      ...uniqueIds.map((id) => adminDb.collection("products").doc(id))
    );

    interface ServerProduct {
      price: number;
      name: string;
      size: string | null;
      color: string | null;
      images: string[];
      stockCode: string | null;
    }

    const productById = new Map<string, ServerProduct>();
    for (const snap of snapshots) {
      if (!snap.exists) return bad(`Ürün bulunamadı: ${snap.id}`);
      const data = (snap.data() ?? {}) as Record<string, unknown>;
      const price = Number(data.price);

      // 1 ÜRÜN = 1 FİYAT: taban fiyat geçerli olmak ZORUNDA.
      if (!Number.isFinite(price) || price <= 0) {
        return bad(`Ürün fiyatı geçersiz: ${snap.id}`);
      }

      productById.set(snap.id, {
        price,
        name: String(data.name ?? "Ürün"),
        // Ölçü/renk uydurulmaz: ürün dokümanında yoksa null kalır.
        size: productSize({ size: data.size as string | undefined }),
        color: productColor({ color: data.color as string | undefined }),
        images: Array.isArray(data.images) ? (data.images as string[]) : [],
        stockCode: data.stockCode ? String(data.stockCode) : null,
      });
    }

    /**
     * Sipariş satırının TEK doğruluk kaynağı sunucudaki ürün dokümanıdır:
     * fiyat, ölçü, renk, ad, görsel ve stok kodu oradan alınır. Client
     * manipülasyonuyla başka fiyat/ölçü/renk gönderilmesi imkânsızdır —
     * gelen değerler hiç okunmaz.
     */
    const validatedItems = items.map((it) => {
      const p = productById.get(it.id)!;
      return {
        id: it.id,
        name: p.name,
        price: p.price,        // AUTHORITATIVE
        quantity: it.quantity,
        color: p.color,        // AUTHORITATIVE
        size: p.size,          // AUTHORITATIVE
        image: p.images[0] ?? null,
        stockCode: p.stockCode,
      };
    });

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
    // PayTR sepet açıklaması: "Ürün adı — 200x30 cm — Kahverengi"
    // Ad, ölçü, renk ve fiyat: hepsi SUNUCU authoritative ürün dokümanından.
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
