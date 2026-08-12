import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { sendPaidOrderNotification } from "@/lib/order-notification";

/**
 * Admin sipariş bildirimi gönderim katmanı — SUNUCU-ONLY.
 *
 * Hem PayTR webhook'u (otomatik) hem de admin "tekrar gönder" aksiyonu (manuel)
 * bu modülü kullanır. Böylece idempotency ve yarış koruması tek yerde tanımlıdır.
 *
 * DEĞİŞMEZ KURAL: bu modüldeki hiçbir yol `paymentStatus` alanına dokunmaz.
 * Mail başarısızlığı ödeme gerçeğini asla değiştirmez.
 */

/**
 * Eşzamanlı iki gönderim girişimini ayırmak için "claim" penceresi.
 * PayTR başarısız bildirimi ~1 dk sonra tekrar dener; bu süre serverless
 * invocation ömründen uzun tutulur ki çökmüş bir gönderim takılı kalmasın.
 */
const NOTIFY_CLAIM_STALE_MS = 3 * 60 * 1000;

export type NotifyOutcome =
  | "sent"
  | "already_sent"
  | "in_progress"
  | "failed"
  | "not_payable";

/** Hata mesajını güvenli, kısa bir özete indirger (secret sızdırmaz). */
function safeErrorSummary(msg: string): string {
  return String(msg).replace(/\s+/g, " ").slice(0, 200);
}

/**
 * Bildirimi EN AZ BİR KEZ, EN FAZLA BİR KEZ göndermeye çalışır.
 *
 * @param force  Manuel admin aksiyonu için true — "sent" durumunda bile yeniden gönderir.
 *               Otomatik webhook yolunda daima false.
 */
export async function ensureAdminNotified(
  merchantOid: string,
  opts: { force?: boolean; paidAtFallback?: Date } = {}
): Promise<NotifyOutcome> {
  const { force = false, paidAtFallback } = opts;
  const orderRef = adminDb.collection("orders").doc(merchantOid);

  try {
    // 1) Gönderim hakkını atomik olarak üstlen.
    const claim = await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(orderRef);
      if (!snap.exists) return "not_payable" as const;
      // Ödemesi doğrulanmamış siparişe ASLA mail gönderilmez.
      if (snap.get("paymentStatus") !== "success") return "not_payable" as const;

      const state = snap.get("adminNotificationStatus");

      if (!force) {
        if (state === "sent") return "already_sent" as const;
        // Legacy backfill kayıtları geçmişe dönük mail almaz.
        if (state === "skipped_legacy_backfill") return "already_sent" as const;
      }

      if (state === "sending") {
        const ms = snap.get("adminNotificationClaimedAt")?.toMillis?.();
        // Taze bir gönderim sürüyorsa karışma; bayatsa devral.
        if (ms && Date.now() - ms < NOTIFY_CLAIM_STALE_MS) return "in_progress" as const;
      }

      tx.update(orderRef, {
        adminNotificationStatus: "sending",
        adminNotificationClaimedAt: FieldValue.serverTimestamp(),
      });
      return "claimed" as const;
    });

    if (claim !== "claimed") return claim;

    // 2) Maili gönder.
    const snap = await orderRef.get();
    const paidAt: Date = snap.get("paidAt")?.toDate?.() ?? paidAtFallback ?? new Date();

    const notify = await sendPaidOrderNotification({
      orderId: merchantOid,
      customerInfo: snap.get("customerInfo"),
      items: snap.get("items") ?? [],
      total: Number(snap.get("total")),
      paidAt,
      paymentType: snap.get("paytrPaymentType") ?? null,
      currency: snap.get("paytrCurrency") ?? null,
    });

    // 3) Sonucu yaz — paymentStatus'a DOKUNULMAZ.
    if (notify.ok) {
      await orderRef.update({
        adminNotificationStatus: "sent",
        adminNotifiedAt: FieldValue.serverTimestamp(),
        adminNotificationLastAttemptAt: FieldValue.serverTimestamp(),
        adminNotificationError: FieldValue.delete(),
      });
      console.log(`[notify] admin bildirimi gönderildi — oid=${merchantOid}`);
      return "sent";
    }

    await orderRef.update({
      adminNotificationStatus: "failed",
      adminNotificationError: safeErrorSummary(notify.error),
      adminNotificationLastAttemptAt: FieldValue.serverTimestamp(),
    });
    console.error(`[notify] admin bildirimi gönderilemedi — oid=${merchantOid}: ${notify.error}`);
    return "failed";
  } catch (err) {
    // Mail yolundaki hiçbir hata ödemeyi bozmaz, siparişi silmez.
    const msg = err instanceof Error ? err.message : "Bilinmeyen bildirim hatası";
    console.error(`[notify] bildirim istisnası — oid=${merchantOid}:`, msg);
    await orderRef
      .update({
        adminNotificationStatus: "failed",
        adminNotificationError: safeErrorSummary(msg),
        adminNotificationLastAttemptAt: FieldValue.serverTimestamp(),
      })
      .catch(() => undefined);
    return "failed";
  }
}
