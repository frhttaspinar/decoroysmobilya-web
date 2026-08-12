import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebase-admin";
import { ensureAdminNotified } from "@/lib/admin-notify";

/**
 * Admin-only "Bildirim Mailini Tekrar Gönder" aksiyonu.
 *
 * Neden var: PayTR'ye bir kez "OK" döndükten sonra yeni bir callback geleceği
 * GARANTİ DEĞİLDİR. Duplicate callback üzerinden retry güzel bir yedek ama tek
 * mekanizma olamaz. Bu endpoint operatöre elle tetikleme imkânı verir.
 *
 * Güvenlik:
 *  - Firebase ID token SUNUCUDA doğrulanır (verifyIdToken).
 *  - E-posta, uygulamanın mevcut admin sözleşmesiyle (NEXT_PUBLIC_ADMIN_EMAIL) eşleşmeli.
 *  - Sipariş paymentStatus === "success" değilse mail GÖNDERİLEMEZ.
 *  - Gmail/SMTP gizli değerleri tarayıcıya asla çıkmaz; gönderim server-only
 *    sendPaidOrderNotification() üzerinden yapılır.
 *  - Ödeme durumuna (paymentStatus) ASLA dokunmaz.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Uygulamanın mevcut admin sözleşmesiyle AYNI env — yeni env icat edilmez.
const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "roysdekors@gmail.com").toLowerCase();

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!idToken) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  let email: string | undefined;
  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    email = decoded.email?.toLowerCase();
    if (!email || decoded.email_verified === false) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  if (email !== ADMIN_EMAIL) {
    console.error(`[admin/resend-notification] yetkisiz erişim denemesi: ${email}`);
    return NextResponse.json({ error: "Bu işlem için yetkiniz yok" }, { status: 403 });
  }

  let merchantOid: string;
  try {
    const body = (await req.json()) as { merchantOid?: string };
    merchantOid = (body.merchantOid ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }
  if (!merchantOid || merchantOid.length > 128) {
    return NextResponse.json({ error: "merchant_oid gerekli" }, { status: 400 });
  }

  // Ödemesi doğrulanmamış siparişe mail gönderilemez.
  const snap = await adminDb.collection("orders").doc(merchantOid).get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
  }
  if (snap.get("paymentStatus") !== "success") {
    return NextResponse.json(
      { error: "Bu siparişin ödemesi doğrulanmamış — bildirim gönderilemez" },
      { status: 409 }
    );
  }

  // force: operatör bilinçli olarak istedi; "sent" durumunda bile yeniden gönderilir.
  // Çift tıklama yarışı ensureAdminNotified içindeki claim ile engellenir.
  const outcome = await ensureAdminNotified(merchantOid, { force: true });

  const httpStatus = outcome === "failed" ? 502 : 200;
  return NextResponse.json({ merchantOid, outcome }, { status: httpStatus });
}
