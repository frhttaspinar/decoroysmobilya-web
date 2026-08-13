import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { getPaytrCredentials, callbackHash, safeHashEqual, kurusToTl } from "@/lib/paytr";
import { ensureAdminNotified } from "@/lib/admin-notify";
import { finalizePaidOrder } from "@/lib/finalize-paid-order";

/**
 * PayTR bildirim (callback) — ödemenin BİRİNCİL gerçek kaynağı.
 *
 * Gerçek sipariş yalnızca hash + tanınan merchant_oid + tutar doğrulandıktan
 * sonra, ortak finalizePaidOrder() üzerinden oluşturulur. Aynı fonksiyonu
 * /api/payment/reconcile yedek yolu da kullanır; böylece iki yol arasında
 * davranış farkı oluşamaz.
 *
 * ACK kuralı: "OK" SADECE gerekli veritabanı yazımı tamamlandıysa döner.
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
      // Yapılandırma eksik — GEÇİCİ sunucu sorunu, tekrar denenmeli.
      console.error("[webhook] PayTR ortam değişkenleri eksik — bildirim işlenemedi");
      return RETRY("paytr env missing");
    }

    const expected = callbackHash(creds, merchantOid, status, totalAmount);
    if (!safeHashEqual(expected, hash)) {
      console.error(`[webhook] hash eşleşmedi — oid=${merchantOid}`);
      return REJECT("invalid hash");
    }

    const orderRef = adminDb.collection("orders").doc(merchantOid);
    const attemptRef = adminDb.collection("payment_attempts").doc(merchantOid);

    /* ── 2. GÖZLEMLENEBİLİRLİK ──────────────────────────────────────────
     * Hash doğrulandıktan SONRA, işleme sonucundan bağımsız olarak
     * "bu bildirim gerçekten geldi mi?" sorusunun cevabını Firestore'a bırak.
     * Hash/secret ASLA saklanmaz.
     * ------------------------------------------------------------------ */
    const attemptSnapEarly = await attemptRef.get();
    if (attemptSnapEarly.exists) {
      await attemptRef.update({
        lastCallbackReceivedAt: FieldValue.serverTimestamp(),
        lastCallbackStatus: status,
        lastCallbackPaymentAmount: paymentAmount || null,
        lastCallbackTotalAmount: totalAmount || null,
      }).catch(() => undefined);
    }

    /* ── 3. Idempotency: sipariş zaten onaylanmış mı? ───────────────── */
    const orderSnap = await orderRef.get();
    if (orderSnap.exists && orderSnap.get("paymentStatus") === "success") {
      // Duplicate: yeni sipariş yaratılmaz, fulfillment bozulmaz.
      // Ancak mail "sent" değilse (yazımdan sonra çökmüş olabilir) yeniden denenir.
      console.log(`[webhook] duplicate success bildirimi — oid=${merchantOid}`);
      await ensureAdminNotified(merchantOid);
      return OK();
    }

    /* ── 4. Başarısız ödeme ─────────────────────────────────────────── */
    if (status !== "success") {
      const failFields = {
        paymentStatus: "failed",
        failedAt: FieldValue.serverTimestamp(),
        failedReasonCode: failedReasonCode ?? null,
        failedReasonMsg: failedReasonMsg ?? null,
      };
      if (attemptSnapEarly.exists) await attemptRef.update(failFields);
      else if (orderSnap.exists) await orderRef.update(failFields);
      else {
        await adminDb.collection("payment_callbacks_unmatched").doc(merchantOid).set({
          merchantOid, status, totalAmount, paymentAmount, paymentType, currency, testMode,
          failedReasonCode, failedReasonMsg,
          receivedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
      }
      console.log(`[webhook] ödeme başarısız işlendi — oid=${merchantOid}`);
      return OK();
    }

    /* ── 5. Tutar semantiği ─────────────────────────────────────────────
     *   payment_amount : STEP 1'de PayTR'ye gönderdiğimiz SİPARİŞ tutarı (×100)
     *   total_amount   : müşteriden FİİLEN TAHSİL EDİLEN toplam (×100),
     *                    taksit/vade farkında daha yüksek olabilir.
     * Doğrulama YALNIZCA payment_amount ile yapılır; total_amount'a fallback YOK.
     * ------------------------------------------------------------------ */
    if (!paymentAmount) {
      console.error(`[webhook] success bildiriminde payment_amount YOK — oid=${merchantOid}`);
      return RETRY("missing payment_amount on success");
    }
    const orderAmountTl = kurusToTl(paymentAmount);
    if (!Number.isFinite(orderAmountTl) || orderAmountTl <= 0) {
      console.error(`[webhook] payment_amount geçersiz ("${paymentAmount}") — oid=${merchantOid}`);
      return RETRY("invalid payment_amount on success");
    }

    /* ── 6. Ortak finalizasyon ──────────────────────────────────────── */
    const result = await finalizePaidOrder({
      merchantOid,
      orderAmountTl,
      chargedTotalTl: kurusToTl(totalAmount),
      currency,
      paymentType,
      testMode: testMode === "1",
      source: "webhook",
    });

    if (!result.ok && result.reason === "attempt_not_found") {
      // Tanınmayan merchant_oid — kaybetmemek için kalıcı kaydet.
      // Tekrar denemenin faydası olmadığı için OK döneriz.
      await adminDb.collection("payment_callbacks_unmatched").doc(merchantOid).set({
        merchantOid, status, totalAmount, paymentAmount, paymentType, currency, testMode,
        receivedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      console.error(`[webhook] eşleşmeyen merchant_oid kaydedildi — oid=${merchantOid}`);
      return OK();
    }

    // amount_mismatch / invalid_amount: durum kalıcı yazıldı, tekrar denemek fayda etmez.
    return OK();
  } catch (err: unknown) {
    // Veritabanı/beklenmeyen hata: "OK" DÖNME — PayTR tekrar denesin.
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    console.error(`[webhook] işlenemedi — oid=${merchantOid}:`, message);
    return RETRY("processing error");
  }
}
