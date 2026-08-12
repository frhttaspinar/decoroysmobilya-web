import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getPaytrCredentials, callbackHash, safeHashEqual, kurusToTl } from "@/lib/paytr";
import { ensureAdminNotified } from "@/lib/admin-notify";

/**
 * PayTR bildirim (callback) — ÖDEMENİN TEK GERÇEK KAYNAĞI.
 *
 * Gerçek sipariş (orders/{merchantOid}) YALNIZCA burada, şu üçü birlikte
 * doğrulandıktan sonra oluşturulur:
 *   1) PayTR hash'i geçerli (sabit zamanlı karşılaştırma)
 *   2) merchant_oid bizim tarafımızda tanınıyor (payment_attempt veya legacy order)
 *   3) tahsil edilen tutar, sunucuda hesaplanmış beklenen tutarla eşleşiyor
 *
 * ACK kuralı: "OK" yanıtı SADECE gerekli veritabanı yazımı tamamlandıysa döner.
 * Veritabanı hatasında bilerek non-OK dönülür ki PayTR bildirimi tekrar denesin.
 *
 * Hash sözleşmesi (resmi doküman):
 *   hash = base64( HMAC-SHA256( merchant_oid + merchant_salt + status + total_amount,
 *                               key = merchant_key ) )
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OK = () =>
  new Response("OK", { status: 200, headers: { "Content-Type": "text/plain" } });

/** PayTR "OK" görmezse ~1 dk sonra tekrar dener — geçici hatalarda istediğimiz budur. */
const RETRY = (reason: string, status = 500) =>
  new Response(`RETRY: ${reason}`, { status, headers: { "Content-Type": "text/plain" } });

const REJECT = (reason: string) =>
  new Response(`REJECTED: ${reason}`, { status: 403, headers: { "Content-Type": "text/plain" } });

/** Kuruş yuvarlamalarına tolerans. */
const AMOUNT_EPSILON = 0.01;

interface AttemptData {
  customerInfo: Record<string, unknown>;
  items: Array<{ name: string; price: number; quantity: number; color?: string | null; size?: string | null }>;
  expectedTotal: number;
  uid?: string | null;
  isGuest?: boolean;
}

export async function POST(req: NextRequest) {
  let merchantOid = "";
  try {
    const params = new URLSearchParams(await req.text());

    merchantOid = params.get("merchant_oid") ?? "";
    const status = params.get("status") ?? "";
    const totalAmount = params.get("total_amount") ?? "";
    const hash = params.get("hash") ?? "";
    const paymentAmount = params.get("payment_amount") ?? "";
    const paymentType = params.get("payment_type");
    const currency = params.get("currency");
    const testMode = params.get("test_mode");
    const failedReasonCode = params.get("failed_reason_code");
    const failedReasonMsg = params.get("failed_reason_msg");

    if (!merchantOid || !status || !hash) {
      console.error("[webhook] zorunlu alanlar eksik");
      return REJECT("missing fields");
    }

    /* ── 1. Hash doğrulama (sabit zamanlı) ──────────────────────────── */
    let creds;
    try {
      creds = getPaytrCredentials();
    } catch {
      // Yapılandırma eksik — bu GEÇİCİ bir sunucu sorunudur, tekrar denenmeli.
      console.error("[webhook] PayTR ortam değişkenleri eksik — bildirim işlenemedi");
      return RETRY("paytr env missing");
    }

    const expected = callbackHash(creds, merchantOid, status, totalAmount);
    if (!safeHashEqual(expected, hash)) {
      console.error(`[webhook] hash eşleşmedi — oid=${merchantOid}`);
      return REJECT("invalid hash");
    }

    /* ── 2. Idempotency: sipariş zaten oluşmuş mu? ──────────────────── */
    const orderRef = adminDb.collection("orders").doc(merchantOid);
    const attemptRef = adminDb.collection("payment_attempts").doc(merchantOid);

    const [orderSnap, attemptSnap] = await Promise.all([orderRef.get(), attemptRef.get()]);

    if (orderSnap.exists && orderSnap.get("paymentStatus") === "success") {
      // Duplicate bildirim: yeni sipariş YARATILMAZ, fulfillment durumu BOZULMAZ.
      //
      // Ancak körü körüne OK dönülmez: sipariş yazıldıktan sonra ama mail
      // gönderilmeden önce invocation çökmüş olabilir. Bu durumda bildirim
      // kalıcı olarak kaybolurdu. Mail henüz "sent" değilse güvenle yeniden denenir.
      console.log(`[webhook] duplicate success bildirimi — oid=${merchantOid}, bildirim durumu kontrol ediliyor`);
      await ensureAdminNotified(merchantOid);
      return OK();
    }

    /* ── 3. Beklenen tutarı belirle ─────────────────────────────────── */
    // Öncelik: payment_attempt (yeni akış). Yoksa legacy orders kaydı (in-flight).
    let expectedTotal: number | null = null;
    let attempt: AttemptData | null = null;
    let isLegacy = false;

    if (attemptSnap.exists) {
      attempt = attemptSnap.data() as AttemptData;
      expectedTotal = Number(attempt.expectedTotal);
    } else if (orderSnap.exists) {
      // Legacy / in-flight: eski akıştan kalmış, ödeme öncesi yazılmış sipariş.
      isLegacy = true;
      expectedTotal = Number(orderSnap.get("total"));
    }

    if (expectedTotal === null || !Number.isFinite(expectedTotal)) {
      // Tanınmayan merchant_oid — kaybetmemek için kalıcı olarak kaydet.
      // Tekrar denemek fayda sağlamayacağı için OK döneriz.
      await adminDb.collection("payment_callbacks_unmatched").doc(merchantOid).set({
        merchantOid, status, totalAmount, paymentAmount, paymentType, currency, testMode,
        failedReasonCode, failedReasonMsg,
        receivedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      console.error(`[webhook] eşleşmeyen merchant_oid kaydedildi — oid=${merchantOid}`);
      return OK();
    }

    /* ── 4. Başarısız ödeme ─────────────────────────────────────────── */
    if (status !== "success") {
      if (attemptSnap.exists) {
        await attemptRef.update({
          paymentStatus: "failed",
          failedAt: FieldValue.serverTimestamp(),
          failedReasonCode: failedReasonCode ?? null,
          failedReasonMsg: failedReasonMsg ?? null,
        });
      } else if (isLegacy) {
        // Legacy kayıt: gerçek sipariş sayılmamalı.
        await orderRef.update({
          paymentStatus: "failed",
          failedAt: FieldValue.serverTimestamp(),
          failedReasonCode: failedReasonCode ?? null,
          failedReasonMsg: failedReasonMsg ?? null,
        });
      }
      console.log(`[webhook] ödeme başarısız işlendi — oid=${merchantOid}`);
      return OK(); // işlendi ve kalıcı olarak yazıldı
    }

    /* ── 5. Tutar doğrulama ─────────────────────────────────────────── */
    // PayTR callback'inde İKİ FARKLI tutar vardır ve karıştırılmamalıdır:
    //
    //   payment_amount : STEP 1'de bizim PayTR'ye gönderdiğimiz SİPARİŞ tutarı (×100)
    //   total_amount   : müşteriden FİİLEN TAHSİL EDİLEN toplam (×100).
    //                    Taksit/alternatif ödemede payment_amount'tan YÜKSEK olabilir.
    //
    // Bu yüzden "beklenen sipariş tutarı" doğrulaması YALNIZCA payment_amount ile
    // yapılır. total_amount ile karşılaştırmak taksitli ödemelerde sahte uyuşmazlık
    // üretir ve gerçek ödenmiş siparişleri review_required'a düşürürdü.
    const chargedTl = kurusToTl(totalAmount); // fiilen tahsil edilen (yalnız saklanır)

    // payment_amount, success bildiriminde PayTR sözleşmesine göre ZORUNLUDUR.
    // total_amount'a FALLBACK YAPILMAZ: taksit/vade farkında total_amount sipariş
    // tutarından yüksek olur ve fallback yanlış tutarı "doğrulanmış" sayardı.
    // Eksik/geçersizse sipariş OLUŞTURULMAZ ve non-OK dönülür.
    if (!paymentAmount) {
      console.error(
        `[webhook] success bildiriminde payment_amount YOK — oid=${merchantOid}; sipariş oluşturulmadı`
      );
      return RETRY("missing payment_amount on success");
    }

    const orderAmountTl = kurusToTl(paymentAmount);
    if (!Number.isFinite(orderAmountTl) || orderAmountTl <= 0) {
      console.error(
        `[webhook] success bildiriminde payment_amount geçersiz ("${paymentAmount}") — oid=${merchantOid}; sipariş oluşturulmadı`
      );
      return RETRY("invalid payment_amount on success");
    }

    if (Math.abs(orderAmountTl - expectedTotal) > AMOUNT_EPSILON) {
      // Sipariş tutarı bizim sunucuda hesapladığımızla uyuşmuyor.
      // GERÇEK SİPARİŞ OLUŞTURULMAZ — insan incelemesine düşer.
      const mismatch = {
        paymentStatus: "review_required",
        paymentMismatch: {
          expectedTotal,
          paytrOrderAmount: orderAmountTl,
          paytrChargedTotal: Number.isFinite(chargedTl) ? chargedTl : null,
          rawPaymentAmount: paymentAmount || null,
          rawTotalAmount: totalAmount || null,
          comparedField: "payment_amount",
          detectedAt: Timestamp.now(),
        },
        reviewRequiredAt: FieldValue.serverTimestamp(),
      };
      if (attemptSnap.exists) await attemptRef.update(mismatch);
      else await orderRef.update(mismatch);

      console.error(
        `[webhook] TUTAR UYUŞMAZLIĞI — oid=${merchantOid} beklenen=${expectedTotal} paytr_payment_amount=${orderAmountTl} — sipariş OLUŞTURULMADI`
      );
      return OK(); // durum kalıcı olarak kaydedildi; tekrar denemenin faydası yok
    }

    /* ── 6. GERÇEK SİPARİŞİ OLUŞTUR ─────────────────────────────────── */
    const paidAtDate = new Date();
    const paymentFields = {
      paymentStatus: "success" as const,
      paidAt: FieldValue.serverTimestamp(),
      /** Sipariş tutarı — expectedTotal ile doğrulanan değer. */
      paytrPaymentAmount: orderAmountTl,
      /** Fiilen tahsil edilen toplam (taksitte sipariş tutarından yüksek olabilir). */
      paytrChargedTotal: Number.isFinite(chargedTl) ? chargedTl : orderAmountTl,
      paytrCurrency: currency ?? "TL",
      paytrPaymentType: paymentType ?? null,
      paytrTestMode: testMode === "1",
      merchantOid,
      adminNotificationStatus: "pending" as const,
    };

    // Transaction: duplicate callback yarışında tek sipariş garantisi.
    const created = await adminDb.runTransaction(async (tx) => {
      const fresh = await tx.get(orderRef);
      if (fresh.exists && fresh.get("paymentStatus") === "success") return false;

      if (isLegacy) {
        // Legacy in-flight sipariş: mevcut kaydı güvenle backfill et.
        const legacyFulfillment = fresh.get("fulfillmentStatus") ?? "beklemede";
        tx.update(orderRef, { ...paymentFields, fulfillmentStatus: legacyFulfillment });
      } else {
        tx.set(orderRef, {
          customerInfo: attempt!.customerInfo,
          items: attempt!.items,
          total: expectedTotal,
          uid: attempt!.uid ?? null,
          isGuest: attempt!.isGuest ?? true,
          fulfillmentStatus: "beklemede",
          createdAt: FieldValue.serverTimestamp(),
          ...paymentFields,
        });
        tx.update(attemptRef, {
          paymentStatus: "success",
          orderCreatedAt: FieldValue.serverTimestamp(),
        });
      }
      return true;
    });

    if (!created) {
      console.log(`[webhook] yarış durumunda duplicate engellendi — oid=${merchantOid}`);
      return OK();
    }

    console.log(
      `[webhook] ödeme onaylandı, sipariş oluşturuldu — oid=${merchantOid} siparis=${orderAmountTl} tahsil=${chargedTl}`
    );

    /* ── 7. Admin bildirim maili (idempotent, ödemeyi asla bozmaz) ──── */
    await ensureAdminNotified(merchantOid, { paidAtFallback: paidAtDate });

    return OK();
  } catch (err: unknown) {
    // Veritabanı/beklenmeyen hata: "OK" DÖNME — PayTR tekrar denesin.
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    console.error(`[webhook] işlenemedi — oid=${merchantOid}:`, message);
    return RETRY("processing error");
  }
}
