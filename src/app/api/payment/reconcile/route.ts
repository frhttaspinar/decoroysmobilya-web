import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { queryPaymentStatus } from "@/lib/paytr";
import { finalizePaidOrder } from "@/lib/finalize-paid-order";

/**
 * PayTR Durum Sorgu ile ÖDEME MUTABAKATI — callback yedeği.
 *
 * Neden var: PayTR bildirimi gecikebilir, yanlış URL'e gidebilir veya hiç
 * ulaşmayabilir. Bu durumda müşteri parayı ödemiş olmasına rağmen sipariş
 * oluşmaz. Bu uç nokta, ödemenin gerçekliğini PayTR'nin resmi Durum Sorgu
 * API'sinden SUNUCU TARAFINDA teyit ederek siparişi güvenle tamamlar.
 *
 * ⚠️ ÖDEME KANITI = yalnızca PayTR Durum Sorgu yanıtıdır.
 *    "merchant_ok_url ziyaret edildi" ASLA kanıt sayılmaz. Client'tan fiyat,
 *    tutar veya paymentStatus KABUL EDİLMEZ; sadece merchantOid alınır.
 *    merchant_key / merchant_salt / paytr_token tarayıcıya asla çıkmaz.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Firestore auto-ID biçimi: 20 karakter, harf+rakam. */
const OID_RE = /^[A-Za-z0-9_-]{6,128}$/;

/**
 * PayTR Durum Sorgu tutarları TL cinsindedir (callback'ten farklı olarak ×100 DEĞİL).
 * "2.999,00" / "2999.00" / "2999" gibi biçimleri güvenle sayıya çevirir.
 */
export function parseTlAmount(raw: unknown): number {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : NaN;
  if (typeof raw !== "string") return NaN;

  let s = raw.trim().replace(/[^\d.,-]/g, "");
  if (!s) return NaN;

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");

  if (lastComma > -1 && lastDot > -1) {
    // İki ayraç da var: sondaki ondalık ayraçtır, diğeri binlik.
    if (lastComma > lastDot) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (lastComma > -1) {
    // Yalnız virgül: 3 haneli grup ise binlik, değilse ondalık.
    const after = s.length - lastComma - 1;
    s = after === 3 ? s.replace(/,/g, "") : s.replace(",", ".");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

export async function POST(req: NextRequest) {
  let merchantOid = "";
  try {
    const body = (await req.json().catch(() => ({}))) as { merchantOid?: string };
    merchantOid = (body.merchantOid ?? "").trim();
  } catch {
    return NextResponse.json({ status: "invalid_request" }, { status: 400 });
  }

  if (!OID_RE.test(merchantOid)) {
    return NextResponse.json({ status: "invalid_request" }, { status: 400 });
  }

  try {
    // 1) Zaten onaylanmışsa PayTR'yi hiç yorma.
    const orderSnap = await adminDb.collection("orders").doc(merchantOid).get();
    if (orderSnap.exists && orderSnap.get("paymentStatus") === "success") {
      return NextResponse.json({ status: "confirmed", alreadyConfirmed: true });
    }

    // 2) Tanınan bir ödeme denemesi yoksa ASLA sipariş oluşturma.
    //    (Rastgele merchantOid ile sipariş üretilmesini engeller.)
    const attemptSnap = await adminDb.collection("payment_attempts").doc(merchantOid).get();
    if (!attemptSnap.exists) {
      return NextResponse.json({ status: "unknown_order" }, { status: 404 });
    }

    // 3) Ödeme gerçeğini PayTR'den SUNUCU TARAFINDA sor.
    const q = await queryPaymentStatus(merchantOid);

    if (q.status !== "success") {
      // Henüz başarılı ödeme yok — sipariş OLUŞTURULMAZ.
      return NextResponse.json({
        status: "not_paid",
        errNo: q.err_no ?? null,
      });
    }

    // 4) Tutarı güvenle parse et (Durum Sorgu TL döner).
    const orderAmountTl = parseTlAmount(q.payment_amount);
    const chargedTotalTl = parseTlAmount(q.payment_total);
    if (!Number.isFinite(orderAmountTl) || orderAmountTl <= 0) {
      console.error(`[reconcile] payment_amount parse edilemedi — oid=${merchantOid}`);
      return NextResponse.json({ status: "amount_unreadable" }, { status: 502 });
    }

    // 5) Ortak finalizasyon — tutar burada da expectedTotal ile karşılaştırılır.
    const result = await finalizePaidOrder({
      merchantOid,
      orderAmountTl,
      chargedTotalTl: Number.isFinite(chargedTotalTl) ? chargedTotalTl : orderAmountTl,
      currency: q.currency ?? "TL",
      paymentType: q.odeme_tipi ?? null,
      paymentDate: q.payment_date ?? null,
      testMode: String(q.test_mode) === "1",
      source: "reconcile",
    });

    if (result.ok) {
      return NextResponse.json({
        status: "confirmed",
        alreadyConfirmed: result.outcome === "already_confirmed",
      });
    }

    if (result.reason === "amount_mismatch") {
      return NextResponse.json({ status: "review_required" }, { status: 409 });
    }
    return NextResponse.json({ status: "unknown_order" }, { status: 404 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    console.error(`[reconcile] hata — oid=${merchantOid}:`, message);
    return NextResponse.json({ status: "error" }, { status: 502 });
  }
}
