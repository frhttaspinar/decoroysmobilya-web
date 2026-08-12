import crypto from "crypto";

/**
 * PayTR sözleşme katmanı — tek kaynak.
 *
 * Üç ayrı imza şeması vardır ve BİRBİRİNE KARIŞTIRILMAMALIDIR:
 *
 *  1) get-token   : merchant_id + user_ip + merchant_oid + email + payment_amount +
 *                   user_basket + no_installment + max_installment + currency +
 *                   test_mode + merchant_salt
 *  2) callback    : merchant_oid + merchant_salt + status + total_amount
 *  3) durum-sorgu : merchant_id + merchant_oid + merchant_salt
 *
 * Hepsinde: base64( HMAC-SHA256( <mesaj>, key = merchant_key ) )
 *
 * merchant_key / merchant_salt HİÇBİR ZAMAN POST gövdesine konmaz, yalnız
 * imza üretiminde kullanılır.
 */

export const PAYTR_TOKEN_URL = "https://www.paytr.com/odeme/api/get-token";
export const PAYTR_STATUS_URL = "https://www.paytr.com/odeme/durum-sorgu";

export interface PaytrCredentials {
  merchantId: string;
  merchantKey: string;
  merchantSalt: string;
}

/** Ortam değişkenlerinden PayTR kimliklerini okur; eksikse hata fırlatır. */
export function getPaytrCredentials(): PaytrCredentials {
  const merchantId = process.env.PAYTR_MERCHANT_ID;
  const merchantKey = process.env.PAYTR_MERCHANT_KEY;
  const merchantSalt = process.env.PAYTR_MERCHANT_SALT;

  if (!merchantId || !merchantKey || !merchantSalt) {
    throw new Error("PAYTR_MERCHANT_ID / KEY / SALT ortam değişkenleri eksik");
  }
  return { merchantId, merchantKey, merchantSalt };
}

function sign(message: string, merchantKey: string): string {
  return crypto.createHmac("sha256", merchantKey).update(message).digest("base64");
}

/** Şema 2 — PayTR bildirim (callback) hash'i. */
export function callbackHash(
  c: PaytrCredentials,
  merchantOid: string,
  status: string,
  totalAmount: string
): string {
  return sign(merchantOid + c.merchantSalt + status + totalAmount, c.merchantKey);
}

/** Şema 3 — Durum Sorgu paytr_token'ı. */
export function statusInquiryToken(c: PaytrCredentials, merchantOid: string): string {
  return sign(c.merchantId + merchantOid + c.merchantSalt, c.merchantKey);
}

/** Şema 1 — get-token paytr_token'ı. */
export function getTokenHash(
  c: PaytrCredentials,
  parts: {
    userIp: string;
    merchantOid: string;
    email: string;
    paymentAmount: string;
    userBasket: string;
    noInstallment: string;
    maxInstallment: string;
    currency: string;
    testMode: string;
  }
): string {
  const message =
    c.merchantId +
    parts.userIp +
    parts.merchantOid +
    parts.email +
    parts.paymentAmount +
    parts.userBasket +
    parts.noInstallment +
    parts.maxInstallment +
    parts.currency +
    parts.testMode +
    c.merchantSalt;
  return sign(message, c.merchantKey);
}

/**
 * Sabit zamanlı hash karşılaştırma.
 * `===` uzunluk/karakter farkında erken çıkar ve teorik olarak zamanlama sızıntısı yaratır.
 */
export function safeHashEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a ?? "", "utf8");
  const bufB = Buffer.from(b ?? "", "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export interface PaytrStatusResult {
  status: string;
  err_no?: string;
  err_msg?: string;
  payment_amount?: string;
  payment_total?: string;
  payment_date?: string;
  currency?: string;
  taksit?: string;
  kart_marka?: string;
  masked_pan?: string;
  auth_code?: string;
  odeme_tipi?: string;
  test_mode?: string;
  returns?: unknown[];
  [key: string]: unknown;
}

/**
 * Durum Sorgu — SALT OKUNUR. PayTR'de hiçbir değişiklik yapmaz.
 * Ödeme gerçeğinin sunucu tarafında yeniden doğrulanması için kullanılır.
 */
export async function queryPaymentStatus(merchantOid: string): Promise<PaytrStatusResult> {
  const c = getPaytrCredentials();
  const body = new URLSearchParams({
    merchant_id: c.merchantId,
    merchant_oid: merchantOid,
    paytr_token: statusInquiryToken(c, merchantOid),
  });

  const res = await fetch(PAYTR_STATUS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  const raw = await res.text();
  try {
    return JSON.parse(raw) as PaytrStatusResult;
  } catch {
    throw new Error(`PayTR durum-sorgu geçersiz yanıt (HTTP ${res.status})`);
  }
}

/** PayTR tutarları kuruş cinsindendir (34.56 TL => "3456"). */
export function kurusToTl(kurus: string | number): number {
  const n = typeof kurus === "number" ? kurus : parseInt(kurus, 10);
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n) / 100;
}

/** TL tutarını PayTR'nin beklediği kuruş string'ine çevirir. */
export function tlToKurus(tl: number): string {
  return String(Math.round(tl * 100));
}
