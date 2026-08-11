/**
 * Next.js 16 Proxy — Admin Route Güvenlik Katmanı + Eski URL Yönlendirmeleri
 *
 * Next.js 16'da middleware yerine proxy.ts kullanılır.
 * Bu dosya projedeki TEK güvenlik duvarı katmanıdır (edge seviyesinde).
 *
 * Firebase Auth token'ı client-side localStorage'da tutulur (cookie değil),
 * bu yüzden edge katmanında tam token doğrulaması yapılamaz.
 * İleride HttpOnly session cookie entegrasyonu için genişletilebilir.
 *
 * Asıl güvenlik kapısı: src/app/admin/layout.tsx → onAuthStateChanged + ADMIN_EMAIL kontrolü
 *
 * ⚠️  ÖNEMLİ: /admin/auth-callback rotası burada KESİNLİKLE serbest bırakılır.
 *     Magic Link ile giriş tamamlanırken Firebase token URL query string'inde taşınır.
 *     Bu rotaya herhangi bir redirect veya engelleme uygulanırsa yönlendirme döngüsü (redirect loop) oluşur.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Eski OpenCart URL'lerinin kalıcı karşılıkları.
 *
 * Eski sistemde rota bilgisi path'te değil `?route=` query parametresinde
 * taşınıyordu; bu yüzden eşleşme query üzerinden yapılır.
 * SADECE yeni sistemde kesin karşılığı olan rotalar buraya eklenir.
 * Karşılığı belirsiz olanlar (ör. `product/product&product_id=...`) bilerek
 * listelenmez ve 404 döner — rastgele ürüne ya da ana sayfaya yönlendirilmez.
 */
const LEGACY_OPENCART_ROUTES: Record<string, string> = {
  "information/contact": "/kurumsal/iletisim",
  "blog/home": "/blog",
  "common/home": "/",
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Eski OpenCart /index.php URL'leri ───
  // next.config redirects() proxy'den ÖNCE çalıştığı ve hedefe eski query
  // string'ini eklediği için yönlendirme burada yapılır; böylece hedef URL
  // temiz kalır ve tek adımda (308) doğru sayfaya ulaşılır.
  if (pathname === "/index.php") {
    const route = request.nextUrl.searchParams.get("route");
    // route parametresi hiç yoksa: eski OpenCart ana sayfası.
    const destination = route === null ? "/" : LEGACY_OPENCART_ROUTES[route];

    if (destination) {
      const url = request.nextUrl.clone();
      url.pathname = destination;
      url.search = ""; // eski route/product_id parametreleri taşınmaz
      return NextResponse.redirect(url, 308);
    }

    // Bilinen bir karşılığı yok → yönlendirme yok, 404 olarak kalır.
    return NextResponse.next();
  }

  // ─── Magic Link Auth Callback — KESİNLİKLE engelleme ───
  // Firebase token URL'de taşınır; bu rotaya redirect/rewrite yapılırsa
  // token kaybolur ve sonsuz döngü başlar.
  if (pathname.startsWith("/admin/auth-callback")) {
    return NextResponse.next();
  }

  // ─── Diğer Admin Rotaları ───
  // Şimdilik geçiriyor; layout.tsx'teki onAuthStateChanged + ADMIN_EMAIL
  // guard'ı client tarafında koruma sağlıyor.
  // İleride: session cookie kontrolü eklenebilir (aşağıya)
  //
  // Örnek gelecek implementasyonu:
  // const sessionCookie = request.cookies.get("__session")?.value;
  // if (!sessionCookie) {
  //   return NextResponse.redirect(new URL("/admin", request.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/index.php"],
};
