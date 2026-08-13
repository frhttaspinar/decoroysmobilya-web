import { adminDb } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { ensureAdminNotified } from "@/lib/admin-notify";

/**
 * Ödemesi doğrulanmış siparişin TEK finalizasyon noktası — SUNUCU-ONLY.
 *
 * İki çağıran vardır ve ikisi de aynı garantileri alır:
 *   1) PayTR bildirim (callback) webhook'u        — birincil yol
 *   2) PayTR Durum Sorgu ile reconciliation       — callback gelmezse yedek yol
 *
 * DEĞİŞMEZ KURALLAR
 *  - Ödeme kanıtı ÇAĞIRANIN sorumluluğundadır: bu fonksiyon yalnız
 *    "PayTR bu tutarı gerçekten tahsil etti" bilgisi doğrulanmış olarak çağrılır.
 *  - Tutar, payment_attempt.expectedTotal ile burada TEKRAR karşılaştırılır.
 *  - orders/{merchantOid} idempotenttir: transaction içinde tekrar kontrol edilir,
 *    duplicate sipariş oluşmaz.
 *  - Admin maili idempotenttir (ensureAdminNotified claim mekanizması).
 */

/** Kuruş yuvarlamalarına tolerans. */
const AMOUNT_EPSILON = 0.01;

export type FinalizeSource = "webhook" | "reconcile";

export interface FinalizeInput {
  merchantOid: string;
  /** PayTR'nin onayladığı SİPARİŞ tutarı (TL) — expectedTotal ile eşleşmeli. */
  orderAmountTl: number;
  /** Fiilen tahsil edilen toplam (TL). Taksitte sipariş tutarından yüksek olabilir. */
  chargedTotalTl?: number | null;
  currency?: string | null;
  paymentType?: string | null;
  /** PayTR'den yalnız tarih geliyorsa (ör. "12.08.2026") burada saklanır. */
  paymentDate?: string | null;
  testMode?: boolean | null;
  source: FinalizeSource;
}

export type FinalizeResult =
  | { ok: true; outcome: "created" | "already_confirmed" }
  | { ok: false; reason: "attempt_not_found" | "amount_mismatch" | "invalid_amount"; detail?: string };

export async function finalizePaidOrder(input: FinalizeInput): Promise<FinalizeResult> {
  const {
    merchantOid, orderAmountTl, chargedTotalTl, currency,
    paymentType, paymentDate, testMode, source,
  } = input;

  const orderRef = adminDb.collection("orders").doc(merchantOid);
  const attemptRef = adminDb.collection("payment_attempts").doc(merchantOid);

  if (!Number.isFinite(orderAmountTl) || orderAmountTl <= 0) {
    return { ok: false, reason: "invalid_amount", detail: String(orderAmountTl) };
  }

  const [orderSnap, attemptSnap] = await Promise.all([orderRef.get(), attemptRef.get()]);

  // ── Idempotency: zaten onaylanmışsa hiçbir şey yaratma ──
  if (orderSnap.exists && orderSnap.get("paymentStatus") === "success") {
    // Mail yazıldıktan sonra çökmüş olabilir; bildirimi güvenle tamamla.
    await ensureAdminNotified(merchantOid);
    return { ok: true, outcome: "already_confirmed" };
  }

  // ── Beklenen tutar: attempt (yeni akış) → yoksa legacy order ──
  let expectedTotal: number | null = null;
  let isLegacy = false;

  if (attemptSnap.exists) {
    expectedTotal = Number(attemptSnap.get("expectedTotal"));
  } else if (orderSnap.exists) {
    isLegacy = true;
    expectedTotal = Number(orderSnap.get("total"));
  }

  if (expectedTotal === null || !Number.isFinite(expectedTotal)) {
    return { ok: false, reason: "attempt_not_found" };
  }

  // ── Tutar doğrulaması (çağırandan bağımsız, burada da yapılır) ──
  if (Math.abs(orderAmountTl - expectedTotal) > AMOUNT_EPSILON) {
    const mismatch = {
      paymentStatus: "review_required",
      paymentMismatch: {
        expectedTotal,
        paytrOrderAmount: orderAmountTl,
        paytrChargedTotal: Number.isFinite(Number(chargedTotalTl)) ? Number(chargedTotalTl) : null,
        comparedField: "payment_amount",
        source,
        detectedAt: Timestamp.now(),
      },
      reviewRequiredAt: FieldValue.serverTimestamp(),
    };
    if (attemptSnap.exists) await attemptRef.update(mismatch);
    else await orderRef.update(mismatch);

    console.error(
      `[finalize:${source}] TUTAR UYUŞMAZLIĞI — oid=${merchantOid} beklenen=${expectedTotal} paytr=${orderAmountTl} — sipariş OLUŞTURULMADI`
    );
    return { ok: false, reason: "amount_mismatch", detail: `expected=${expectedTotal} paytr=${orderAmountTl}` };
  }

  const paymentFields = {
    paymentStatus: "success" as const,
    paidAt: FieldValue.serverTimestamp(),
    paytrPaymentAmount: orderAmountTl,
    paytrChargedTotal: Number.isFinite(Number(chargedTotalTl)) ? Number(chargedTotalTl) : orderAmountTl,
    paytrCurrency: currency ?? "TL",
    paytrPaymentType: paymentType ?? null,
    paytrPaymentDate: paymentDate ?? null,
    paytrTestMode: testMode ?? false,
    paymentConfirmedVia: source,
    merchantOid,
    adminNotificationStatus: "pending" as const,
  };

  // ── Transaction: eşzamanlı webhook + reconcile yarışında tek sipariş ──
  const created = await adminDb.runTransaction(async (tx) => {
    const fresh = await tx.get(orderRef);
    if (fresh.exists && fresh.get("paymentStatus") === "success") return false;

    if (isLegacy) {
      const legacyFulfillment = fresh.get("fulfillmentStatus") ?? "beklemede";
      tx.update(orderRef, { ...paymentFields, fulfillmentStatus: legacyFulfillment });
    } else {
      const attempt = await tx.get(attemptRef);
      tx.set(orderRef, {
        customerInfo: attempt.get("customerInfo"),
        items: attempt.get("items") ?? [],
        total: expectedTotal,
        uid: attempt.get("uid") ?? null,
        isGuest: attempt.get("isGuest") ?? true,
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
    await ensureAdminNotified(merchantOid);
    return { ok: true, outcome: "already_confirmed" };
  }

  console.log(
    `[finalize:${source}] sipariş oluşturuldu — oid=${merchantOid} tutar=${orderAmountTl}`
  );

  // Mail: idempotent, ASLA ödemeyi bozmaz.
  await ensureAdminNotified(merchantOid, { paidAtFallback: new Date() });

  return { ok: true, outcome: "created" };
}
