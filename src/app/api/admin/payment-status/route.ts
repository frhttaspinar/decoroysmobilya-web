import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import "@/lib/firebase-admin"; // Admin SDK singleton init
import { queryPaymentStatus } from "@/lib/paytr";

/**
 * Admin-only PayTR Durum Sorgu — TEŞHİS AMAÇLI, SALT OKUNUR.
 *
 * Güvenlik:
 *  - Firebase ID token Authorization: Bearer <token> ile gelir ve SUNUCUDA doğrulanır.
 *  - Token'ın e-postası ADMIN_EMAIL ile eşleşmeli ve doğrulanmış olmalı.
 *  - PayTR merchant_key / merchant_salt tarayıcıya ASLA gönderilmez; imza
 *    yalnızca sunucuda üretilir.
 *  - Bu endpoint hiçbir Firestore kaydını DEĞİŞTİRMEZ; yalnız PayTR'nin
 *    gerçeğini olduğu gibi döner. Sipariş durumu buradan güncellenmez.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Uygulamanın mevcut admin sözleşmesiyle AYNI env — yeni env icat edilmez.
// src/lib/firebase.ts içindeki ADMIN_EMAIL ile birebir aynı ifade.
// Not: bu değerin public olması yetkilendirmenin kendisi DEĞİLDİR; yetki,
// sunucuda doğrulanan Firebase ID token + e-posta eşleşmesiyle verilir.
const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "roysdekors@gmail.com").toLowerCase();

export async function POST(req: NextRequest) {
  // ── Kimlik doğrulama ──────────────────────────────────────────────
  const authHeader = req.headers.get("authorization") ?? "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

  if (!idToken) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

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
    console.error(`[admin/payment-status] yetkisiz erişim denemesi: ${email}`);
    return NextResponse.json({ error: "Bu işlem için yetkiniz yok" }, { status: 403 });
  }

  // ── Sorgu ─────────────────────────────────────────────────────────
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

  try {
    const result = await queryPaymentStatus(merchantOid);
    // Yanıt olduğu gibi döner — hiçbir secret içermez.
    return NextResponse.json({ merchantOid, paytr: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Sorgu başarısız";
    console.error("[admin/payment-status] hata:", message);
    return NextResponse.json({ error: "PayTR sorgusu başarısız" }, { status: 502 });
  }
}
