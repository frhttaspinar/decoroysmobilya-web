"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import GlobalDrawer from "@/components/GlobalDrawer";
import HeaderActions from "@/components/HeaderActions";
import { initProductStore } from "@/store/useProductStore";
import Link from "next/link";
import { motion } from "motion/react";

export default function MainLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    return initProductStore();
  }, []);
  const isCheckout = pathname.startsWith("/odeme");
  const isAdmin = pathname.startsWith("/admin");

  if (isCheckout || isAdmin) {
    return <main className="flex-1 flex flex-col relative w-full h-full">{children}</main>;
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200/50">
        <nav className="max-w-7xl mx-auto px-4 md:px-6 h-20 md:h-24 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            {/* Marka yazısı */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.75, delay: 0.15, ease: [0.22, 0.6, 0.22, 1] }}
              className="flex flex-col leading-none"
            >
              <motion.span
                className="text-base md:text-lg font-black tracking-tight"
                style={{
                  background: "linear-gradient(90deg, #f97316, #ec4899, #8b5cf6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                Decoroys
              </motion.span>
              <motion.span
                className="text-[10px] md:text-xs font-semibold tracking-[0.2em] uppercase text-zinc-400"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35 }}
              >
                Mobilya
              </motion.span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -28, scale: 0.85 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.75, ease: [0.22, 0.6, 0.22, 1] }}
              whileHover={{ scale: 1.06, rotate: -1 }}
              whileTap={{ scale: 0.95 }}
              className="origin-left"
            >
              <img src="/images/logo.png" alt="Decoroys" className="h-12 md:h-16 w-auto object-contain" />
            </motion.div>
          </Link>

          {/* Kategori Navigasyonu — her link kendi marka renginde */}
          <div className="hidden md:flex items-center gap-1.5">
            <motion.div
              initial={{ opacity: 0, y: -18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.13, ease: [0.22, 0.6, 0.22, 1] }}
              whileHover={{ y: -4, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/kategori/tv-uniteleri"
                className="group relative text-sm font-medium px-4 py-2 rounded-full transition-all duration-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800 block"
              >
                <span className="relative z-10 flex items-center gap-1.5">
                  <span className="text-xs opacity-70 group-hover:opacity-100 transition-opacity">📺</span>
                  Tv Üniteleri
                </span>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.21, ease: [0.22, 0.6, 0.22, 1] }}
              whileHover={{ y: -4, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/kategori/kahve-dolaplari"
                className="group relative text-sm font-medium px-4 py-2 rounded-full transition-all duration-300 text-orange-700 hover:bg-orange-50 hover:text-orange-800 block"
              >
                <span className="relative z-10 flex items-center gap-1.5">
                  <span className="text-xs opacity-70 group-hover:opacity-100 transition-opacity">☕</span>
                  Kahve Dolapları
                </span>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.29, ease: [0.22, 0.6, 0.22, 1] }}
              whileHover={{ y: -4, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/kategori/tv-panelleri"
                className="group relative text-sm font-medium px-4 py-2 rounded-full transition-all duration-300 text-violet-700 hover:bg-violet-50 hover:text-violet-800 block"
              >
                <span className="relative z-10 flex items-center gap-1.5">
                  <span className="text-xs opacity-70 group-hover:opacity-100 transition-opacity">🖥️</span>
                  Tv Panelleri
                </span>
              </Link>
            </motion.div>
          </div>

          <div className="flex items-center gap-6 text-base font-bold text-zinc-700">
            <motion.div
              className="hidden md:block"
              initial={{ opacity: 0, y: -18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.37, ease: [0.22, 0.6, 0.22, 1] }}
              whileHover={{ y: -4, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="/urunler" className="text-sm font-medium text-zinc-700 hover:text-zinc-900 transition-colors tracking-wide">Tüm Ürünler</Link>
            </motion.div>
            <HeaderActions />
          </div>
        </nav>
      </header>
      <main className="flex-1 flex flex-col relative w-full h-full">
        {children}
      </main>

      <GlobalDrawer />

      {/* Footer */}
      <footer className="w-full bg-white border-t border-zinc-100 py-16 mt-auto">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {/* Marka */}
          <div className="flex flex-col items-start gap-6">
            <Link href="/" className="inline-block">
              <img src="/images/logo.png" alt="Decoroys" className="h-10 md:h-12 w-auto opacity-90 object-contain" />
            </Link>
            <p className="text-sm text-zinc-500 font-light max-w-xs">
              Modern yaşam alanları için premium mobilya çözümleri.
            </p>
          </div>

          {/* Hızlı Linkler */}
          <div className="flex flex-col gap-4 md:pl-8">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Hızlı Linkler</h3>
            <div className="flex flex-col gap-3 text-sm font-medium text-zinc-500">
              <Link href="/kategori/tv-uniteleri" className="hover:text-black transition-colors w-fit">TV Üniteleri</Link>
              <Link href="/kategori/kahve-dolaplari" className="hover:text-black transition-colors w-fit">Kahve Dolapları</Link>
              <Link href="/kategori/tv-panelleri" className="hover:text-black transition-colors w-fit">TV Panelleri</Link>
              <Link href="/urunler" className="hover:text-black transition-colors w-fit">Tüm Ürünler</Link>
              <Link href="/blog" className="hover:text-black transition-colors w-fit">Blog</Link>
            </div>
          </div>

          {/* Müşteri Hizmetleri */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Müşteri Hizmetleri</h3>
            <div className="flex flex-col gap-3 text-sm font-medium text-zinc-500">
              <Link href="/kurumsal/mesafeli-satis-sozlesmesi" className="hover:text-black transition-colors w-fit">Mesafeli Satış Sözleşmesi</Link>
              <Link href="/kurumsal/iptal-ve-iade-kosullari" className="hover:text-black transition-colors w-fit">İptal ve İade Koşulları</Link>
              <Link href="/kurumsal/teslimat-bilgileri" className="hover:text-black transition-colors w-fit">Ödeme ve Teslimat Bilgileri</Link>
              <Link href="/kurumsal/gizlilik-politikasi" className="hover:text-black transition-colors w-fit">Gizlilik Politikası</Link>
              <Link href="/kurumsal/kvkk-bilgilendirme" className="hover:text-black transition-colors w-fit">Kişisel Verilerin Korunması</Link>
              <Link href="/kurumsal/iletisim" className="hover:text-black transition-colors w-fit">İletişim</Link>
            </div>
          </div>
        </div>

        {/* Alt Bilgi */}
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-zinc-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-400 font-light">
            &copy; {new Date().getFullYear()} Decoroys. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>

      {/* ── WhatsApp Butonu ── */}
      <motion.a
        href="https://wa.me/905011561818"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp ile iletişime geç"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 1.2, ease: [0.22, 0.6, 0.22, 1] }}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.93 }}
        className="fixed bottom-6 right-6 z-[200] flex items-center justify-center w-14 h-14 rounded-full shadow-lg shadow-green-500/30"
        style={{ background: "#25D366" }}
      >
        {/* Pulse halkası */}
        <span className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ background: "#25D366" }} />
        {/* WhatsApp SVG */}
        <svg viewBox="0 0 32 32" className="w-7 h-7 fill-white relative z-10" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 2C8.268 2 2 8.268 2 16c0 2.49.655 4.82 1.8 6.84L2 30l7.36-1.78A13.93 13.93 0 0 0 16 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.5a11.44 11.44 0 0 1-5.82-1.59l-.42-.25-4.36 1.05 1.08-4.24-.27-.44A11.47 11.47 0 0 1 4.5 16C4.5 9.648 9.648 4.5 16 4.5S27.5 9.648 27.5 16 22.352 27.5 16 27.5zm6.29-8.6c-.34-.17-2.02-1-2.34-1.11-.31-.11-.54-.17-.77.17-.23.34-.88 1.11-1.08 1.34-.2.23-.4.26-.74.09-.34-.17-1.44-.53-2.74-1.69-1.01-.9-1.7-2.01-1.9-2.35-.2-.34-.02-.52.15-.69.15-.15.34-.4.51-.59.17-.2.23-.34.34-.57.11-.23.06-.43-.03-.6-.09-.17-.77-1.86-1.06-2.55-.28-.67-.56-.58-.77-.59h-.66c-.23 0-.6.09-.91.43s-1.2 1.17-1.2 2.86 1.23 3.32 1.4 3.55c.17.23 2.42 3.7 5.87 5.19.82.35 1.46.56 1.96.72.82.26 1.57.22 2.16.13.66-.1 2.02-.83 2.31-1.62.29-.8.29-1.48.2-1.62-.08-.14-.31-.23-.65-.4z" />
        </svg>
      </motion.a>
    </>
  );
}
