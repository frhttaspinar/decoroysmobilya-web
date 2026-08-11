"use client";

import { Product } from "@/data/products";
import { useProductStore } from "@/store/useProductStore";
import { useCartStore } from "@/store/useCartStore";
import { useDrawerStore } from "@/store/useDrawerStore";
import BentoFeatures from "@/components/BentoFeatures";
import HeroSlider from "@/components/HeroSlider";
import ScrollVideo from "@/components/ScrollVideo";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2 }).format(price);

const STATS = [
  { target: 18000, suffix: "+", unit: "", label: "Mutlu Müşteri", sub: "Türkiye genelinde" },
  { target: 50, suffix: "+", unit: "", label: "Benzersiz Tasarım", sub: "Her zevke uygun" },
  { target: 5, suffix: "", unit: "Yıldır", label: "Doğayı Koruyan Üretim", sub: "Uzun ömürlü kalite" },
];

const REVIEWS = [
  { name: "Çiğdem B.", city: "İstanbul", initials: "ÇB", color: "bg-amber-500", text: "TV ünitemiz geldiğinde gerçekten etkilendik. Fotoğraflarda güzeldi ama elinize alınca kalite bambaşka bir his veriyor. Montaj da çok kolaydı, yarım saatte bitti.", product: "TV Ünitesi" },
  { name: "Mehmet T.", city: "Ankara", initials: "MT", color: "bg-rose-500", text: "Minimalist çizgileri ve doğal ahşap dokusuyla tam aradığım mobilyayı buldum. Oturma odamızın karakterini tamamen değiştirdi. Kesinlikle tavsiye ederim.", product: "TV Ünitesi" },
  { name: "Selin A.", city: "İzmir", initials: "SA", color: "bg-emerald-500", text: "3 yıldır Decoroys müşterisiyim. Her ürün bir öncekinden daha iyi. Müşteri hizmetleri de süper ilgili. Ev taşıdım ve tüm mobilyalarımı yeniledim.", product: "TV Ünitesi" },
  { name: "Fatma Y.", city: "Bursa", initials: "FY", color: "bg-violet-500", text: "Oturma odamı tamamen yeniledim, Decoroys mobilyaları olmadan düşünemiyorum artık. Tasarım detayları muhteşem, her misafirim soruyor.", product: "TV Ünitesi" },
  { name: "Can Ö.", city: "Antalya", initials: "CÖ", color: "bg-sky-500", text: "Siparişim 4 günde kapımda. Paketleme de çok özenli, hiçbir çizik yok. Kaliteye para ödenmeye değer.", product: "TV Ünitesi" },
  { name: "Zeynep B.", city: "Eskişehir", initials: "ZB", color: "bg-teal-500", text: "Fiyat kalite dengesi inanılmaz. Aynı kalitede başka markalarda 3 katı ödeyecektim. Decoroys'u bulduğuma çok sevindim.", product: "TV Ünitesi" },
  { name: "Hasan K.", city: "Konya", initials: "HK", color: "bg-orange-500", text: "İki haftada sipariş verdim ve kapımda. Hem hızlı hem de ürün beklentimin üzerinde. Tavsiye ediyorum.", product: "TV Ünitesi" },
  { name: "Merve Ş.", city: "Adana", initials: "MŞ", color: "bg-pink-500", text: "Ahşap işçiliği gerçekten el emeği göz nuru. Fabrika ürünü gibi değil, özel yapılmış hissi veriyor. Çevremdekiler de çok beğendi.", product: "TV Ünitesi" },
  { name: "Ali D.", city: "Gaziantep", initials: "AD", color: "bg-indigo-500", text: "Ürün soruları için mesaj attım, çok hızlı ve nazikçe yanıtladılar. Satın alma sonrası destek de harika.", product: "TV Ünitesi" },
  { name: "Elif N.", city: "Trabzon", initials: "EN", color: "bg-lime-600", text: "Doğal malzeme kullanımı çok belli. Evimde bir doğa parçası var gibi hissettiriyor. Renk tonları da müthiş seçilmiş.", product: "TV Ünitesi" },
  { name: "Serkan M.", city: "Kayseri", initials: "SM", color: "bg-cyan-500", text: "İlk alışverişimden sonra ikinci siparişimi hemen verdim. Bu sefer iki ürün aldım, ikisi de harika çıktı.", product: "TV Ünitesi" },
  { name: "Derya C.", city: "Samsun", initials: "DC", color: "bg-fuchsia-500", text: "Hediye olarak aldım, çok beğenildi. Kutusu bile özel, armağan paketi gibi geldi. Markanın detay hassasiyeti var.", product: "TV Ünitesi" },
  { name: "Burak T.", city: "Diyarbakır", initials: "BT", color: "bg-amber-600", text: "Ahşap kalitesinden şüphe etmiyorum. Yıllarca kullanacak bir mobilya aldım. Paranın değerini fazlasıyla karşılıyor.", product: "TV Ünitesi" },
  { name: "Neslihan A.", city: "Kocaeli", initials: "NA", color: "bg-rose-600", text: "Yeni evimize taşındık ve tüm mobilyaları Decoroys'tan aldık. Her biri birbirini tamamlıyor, çok uyumlu bir koleksiyon.", product: "TV Ünitesi" },
  { name: "Okan Y.", city: "Mersin", initials: "OY", color: "bg-emerald-600", text: "Çocuk odası için aldık. Sağlam ve güvenli malzeme. Küçüğümüz de çok sevdi, her gün övünüyor.", product: "TV Ünitesi" },
  { name: "Gülşen P.", city: "Malatya", initials: "GP", color: "bg-violet-600", text: "Renk seçenekleri çok geniş. Tam istediğim tona ulaştım. Evimin duvarlarıyla mükemmel uyum sağladı.", product: "TV Ünitesi" },
  { name: "Tolga R.", city: "Denizli", initials: "TR", color: "bg-sky-600", text: "3 yıldır düzenli alışveriş yapıyorum. Kalite hiç düşmedi, aksine her yeni üründe daha da ileri gitmişler.", product: "TV Ünitesi" },
  { name: "Hande K.", city: "Sivas", initials: "HK", color: "bg-orange-600", text: "Sipariş verdikten 3 gün sonra geldi. Bu hız beni şaşırttı. Ürün de harika, sökülüp takılabilir.", product: "TV Ünitesi" },
  { name: "Yusuf S.", city: "Erzurum", initials: "YS", color: "bg-teal-600", text: "5 yıl garanti veriyorlar ve buna güveniyorlar. Kaliteli ürün satan firma garanti verir, Decoroys öyle bir firma.", product: "TV Ünitesi" },
  { name: "Reyhan E.", city: "Sakarya", initials: "RE", color: "bg-pink-600", text: "İlk ürünü çok beğendim, 3 ay içinde 4 ürün daha aldım. Artık tüm mobilya ihtiyacımı Decoroys'tan karşılıyorum.", product: "TV Ünitesi" },
];

export default function Home() {
  const { products } = useProductStore();
  const { addItem } = useCartStore();
  const { openDrawer } = useDrawerStore();

  const featuredProducts = products.filter((p) => p.featured).slice(0, 4);

  const statsRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [counts, setCounts] = useState(STATS.map(() => 0));

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!statsVisible) return;
    const steps = 80;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const eased = 1 - Math.pow(1 - step / steps, 3);
      setCounts(STATS.map((s) => Math.round(s.target * eased)));
      if (step >= steps) clearInterval(timer);
    }, 1800 / steps);
    return () => clearInterval(timer);
  }, [statsVisible]);

  const scrollReviews = (dir: "left" | "right") => {
    reviewsRef.current?.scrollBy({ left: dir === "right" ? 344 : -344, behavior: "smooth" });
  };

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.images[0],
      color: product.colors[0],
      size: product.features.find((f) => f.includes("cm")) || undefined,
    });
    openDrawer("cart");
  };

  return (
    <div className="flex-1 flex flex-col w-full">

      {/* ═══════ 1. Hero Slider ═══════ */}
      <HeroSlider />

      {/* ═══════ 3. Scroll Video ═══════ */}
      <ScrollVideo />

      {/* ═══════ 4. Öne Çıkan Koleksiyonlar ═══════ */}
      <div className="w-full relative mt-10">

        {/* Sol kenar */}
        <div className="hidden xl:flex absolute left-4 2xl:left-10 top-1/2 -translate-y-1/2 flex-col items-center gap-5 z-10">
          <svg viewBox="0 0 40 60" className="w-8 opacity-20" fill="none" stroke="#9f1239" strokeWidth="1.5">
            <path d="M10 40 Q10 28 20 26 Q30 28 30 40" />
            <rect x="6" y="40" width="28" height="6" rx="2" />
            <line x1="10" y1="46" x2="8" y2="56" />
            <line x1="30" y1="46" x2="32" y2="56" />
            <line x1="20" y1="26" x2="20" y2="18" />
            <circle cx="20" cy="15" r="4" />
            <line x1="14" y1="18" x2="12" y2="14" />
            <line x1="26" y1="18" x2="28" y2="14" />
          </svg>
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-px h-10 bg-gradient-to-b from-transparent via-rose-400/50 to-transparent" />
            <div className="w-2 h-2 rounded-full bg-rose-400/70" style={{ animation: "char-float 3.5s ease-in-out infinite" }} />
            <div className="w-px h-10 bg-gradient-to-b from-rose-400/50 to-transparent" />
          </div>
          <span
            className="text-[13px] font-black tracking-[0.35em] text-rose-600 uppercase"
            style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              animation: "char-float 6.5s ease-in-out infinite, glow-pulse-rose 3.5s ease-in-out infinite",
            }}
          >
            Koleksiyonlar
          </span>
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-px h-8 bg-gradient-to-b from-transparent via-rose-400/40 to-transparent" />
            <div className="w-1.5 h-1.5 rounded-full bg-rose-300/80" style={{ animation: "char-float 4s ease-in-out infinite reverse" }} />
          </div>
        </div>

        {/* Sağ kenar */}
        <div className="hidden xl:flex absolute right-4 2xl:right-10 top-1/2 -translate-y-1/2 flex-col items-end gap-3 z-10">
          {[
            { icon: "◉", label: "Özenle Seçildi", delay: "0s", bg: "bg-rose-50", border: "border-rose-200", iconCls: "text-rose-500", textCls: "text-rose-800" },
            { icon: "✿", label: "Yeni Sezon", delay: "0.6s", bg: "bg-teal-50", border: "border-teal-200", iconCls: "text-teal-500", textCls: "text-teal-800" },
            { icon: "◈", label: "Sınırlı Koleksiyon", delay: "1.2s", bg: "bg-fuchsia-50", border: "border-fuchsia-200", iconCls: "text-fuchsia-500", textCls: "text-fuchsia-800" },
          ].map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2 ${item.bg} backdrop-blur-sm border ${item.border} rounded-full px-4 py-2 shadow-sm`}
              style={{ animation: "char-float 5s ease-in-out infinite", animationDelay: item.delay }}
            >
              <span className={`${item.iconCls} text-sm`}>{item.icon}</span>
              <span className={`text-sm font-semibold ${item.textCls} whitespace-nowrap`}>{item.label}</span>
            </div>
          ))}
          <div className="flex flex-col items-center gap-1.5 mt-2">
            <div className="w-px h-8 bg-gradient-to-b from-rose-400/50 to-transparent" />
            <div className="w-1.5 h-1.5 rounded-full bg-rose-300/80" style={{ animation: "char-float 4s ease-in-out infinite reverse" }} />
            <div className="w-px h-12 bg-gradient-to-b from-transparent via-teal-400/40 to-transparent" />
          </div>
        </div>

        <section className="w-full max-w-6xl mx-auto mb-6 px-6 relative">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-light tracking-tight text-zinc-900">
              Öne Çıkan Koleksiyonlar
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-7 lg:gap-10">
            {featuredProducts.map((product) => (
              <Link
                href={`/urun/${product.id}`}
                key={product.id}
                className="group flex flex-col gap-5 cursor-pointer relative"
              >
                {/* Product Image */}
                <div className="aspect-[4/5] w-full bg-zinc-100 rounded-2xl transition-all duration-500 ease-out group-hover:-translate-y-2 group-hover:shadow-xl overflow-hidden relative">
                  {product.images[0] && (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Product Info */}
                <div className="flex flex-col items-center gap-1.5">
                  <h3 className="text-sm font-medium text-zinc-900 text-center px-4">
                    {product.name}
                  </h3>
                  <span className="text-[11px] text-amber-600 font-semibold tracking-wide">
                    Sınırlı Koleksiyon
                  </span>
                  <p className="text-base font-bold text-zinc-900">
                    {formatPrice(product.price)} ₺
                  </p>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={(e) => handleAddToCart(product, e)}
                  className="absolute top-4 right-4 bg-white/90 backdrop-blur-md border border-zinc-200 text-zinc-900 px-4 py-2 rounded-full text-xs font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-zinc-900 hover:text-white"
                >
                  Sepete Ekle
                </button>
              </Link>
            ))}
          </div>

          {/* View All Button */}
          <div className="text-center mt-8">
            <Link
              href="/urunler"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50 transition-all duration-300 text-sm font-medium"
            >
              Tüm Ürünleri Keşfet
            </Link>
          </div>
        </section>
      </div>

      {/* ═══════ 5. Neden Decoroys? — BentoFeatures ═══════ */}
      <div className="w-full relative mt-8">

        {/* Sol kenar */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 0.6, 0.22, 1] }}
          viewport={{ once: true, amount: 0.3 }}
          className="hidden xl:flex absolute left-4 2xl:left-10 top-1/2 -translate-y-1/2 flex-col items-center gap-5 z-10"
        >
          <svg viewBox="0 0 40 60" className="w-8 opacity-20" fill="none" stroke="#b45309" strokeWidth="1.5">
            <circle cx="20" cy="12" r="8" />
            <path d="M8 28 Q20 22 32 28" />
            <rect x="6" y="30" width="28" height="20" rx="3" />
            <line x1="14" y1="50" x2="14" y2="58" />
            <line x1="26" y1="50" x2="26" y2="58" />
          </svg>
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-px h-10 bg-gradient-to-b from-transparent via-amber-400/50 to-transparent" />
            <div className="w-2 h-2 rounded-full bg-amber-400/70" style={{ animation: "char-float 3.5s ease-in-out infinite" }} />
            <div className="w-px h-10 bg-gradient-to-b from-amber-400/50 to-transparent" />
          </div>
          <span
            className="text-[13px] font-black tracking-[0.35em] text-amber-600 uppercase"
            style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              animation: "char-float 7s ease-in-out infinite reverse, glow-pulse 4s ease-in-out infinite",
            }}
          >
            Doğayı Koruyoruz
          </span>
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-px h-8 bg-gradient-to-b from-transparent via-amber-400/40 to-transparent" />
            <div className="w-1.5 h-1.5 rounded-full bg-amber-300/80" style={{ animation: "char-float 4s ease-in-out infinite" }} />
          </div>
        </motion.div>

        {/* Sağ kenar */}
        <div className="hidden xl:flex absolute right-4 2xl:right-10 top-1/2 -translate-y-1/2 flex-col items-end gap-3 z-10">
          {[
            { icon: "❋", label: "Minimalist Çizgiler", delay: 0, floatDelay: "0s", bg: "bg-violet-50", border: "border-violet-200", iconCls: "text-violet-500", textCls: "text-violet-800" },
            { icon: "⬡", label: "Sürdürülebilir Üretim", delay: 0.15, floatDelay: "0.7s", bg: "bg-emerald-50", border: "border-emerald-200", iconCls: "text-emerald-500", textCls: "text-emerald-800" },
            { icon: "◎", label: "Akıllı Kurulum", delay: 0.3, floatDelay: "1.4s", bg: "bg-blue-50", border: "border-blue-200", iconCls: "text-blue-500", textCls: "text-blue-800" },
          ].map((item) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: item.delay, ease: [0.22, 0.6, 0.22, 1] }}
              viewport={{ once: true, amount: 0.3 }}
              className={`flex items-center gap-2 ${item.bg} backdrop-blur-sm border ${item.border} rounded-full px-4 py-2 shadow-sm`}
              style={{ animation: "char-float 5.5s ease-in-out infinite", animationDelay: item.floatDelay }}
            >
              <span className={`${item.iconCls} text-sm`}>{item.icon}</span>
              <span className={`text-sm font-semibold ${item.textCls} whitespace-nowrap`}>{item.label}</span>
            </motion.div>
          ))}
          <div className="flex flex-col items-center gap-1.5 mt-1">
            <div className="w-px h-10 bg-gradient-to-b from-amber-400/50 to-transparent" />
            <div className="w-1.5 h-1.5 rounded-full bg-amber-300/80" style={{ animation: "char-float 3s ease-in-out infinite reverse" }} />
            <div className="w-px h-14 bg-gradient-to-b from-transparent via-amber-400/40 to-transparent" />
          </div>
        </div>

        <section className="w-full max-w-7xl mx-auto px-6">
          <div className="text-center mb-8 space-y-4">
            {/* Başlık — kelime kelime animasyon */}
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              {["Neden", "Decoroys?"].map((word, wi) => (
                <motion.span
                  key={wi}
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.65, delay: wi * 0.18, ease: [0.22, 0.6, 0.22, 1] }}
                  viewport={{ once: true, amount: 0.5 }}
                  className="inline-block"
                  style={wi === 1 ? {
                    background: "linear-gradient(to right, #f59e0b, #f43f5e, #7c3aed)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  } : { color: "#18181b" }}
                >
                  {word}{wi === 0 ? " " : ""}
                </motion.span>
              ))}
            </h2>

            {/* Alt yazı — kelime kelime fade */}
            <p className="text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed">
              {"Sıradanlıktan uzaklaşıp fark yaratmak isteyenler için tasarlandı.".split(" ").map((word, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.35 + i * 0.055, ease: [0.22, 0.6, 0.22, 1] }}
                  viewport={{ once: true, amount: 0.8 }}
                  className="inline-block mr-1.5"
                >
                  {word}
                </motion.span>
              ))}
            </p>

            {/* Dekoratif çizgi */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              whileInView={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 0.6, 0.22, 1] }}
              viewport={{ once: true }}
              className="mx-auto h-0.5 w-24 rounded-full bg-gradient-to-r from-amber-400 via-rose-400 to-violet-500"
              style={{ transformOrigin: "center" }}
            />
          </div>
          <BentoFeatures />
        </section>
      </div>

      {/* ═══════ 6. Sayılarla Decoroys ═══════ */}
      <section ref={statsRef} className="w-full mt-10 py-16 bg-zinc-900 overflow-hidden relative">
        {/* Arka plan desen */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
          backgroundSize: "24px 24px",
        }} />
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-10"
          style={{ background: "radial-gradient(circle, #f59e0b 0%, transparent 70%)" }}
        />

        <div className="relative w-full max-w-6xl mx-auto px-6">
          <p className="text-center text-xs font-semibold tracking-[0.4em] text-amber-500 uppercase mb-8 md:mb-14">
            Rakamlar Konuşuyor
          </p>

          {/* Sayaçlar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-zinc-700/20 lg:divide-zinc-700/60">
            {STATS.map((stat, i) => (
              <div key={i} className="flex flex-col items-center text-center px-6 py-8 group">
                <div className="flex items-end gap-1 mb-3">
                  <span
                    className="text-5xl md:text-6xl font-black text-white leading-none tabular-nums"
                    style={{ animation: `char-float ${6 + i * 0.8}s ease-in-out infinite` }}
                  >
                    {counts[i].toLocaleString("tr-TR")}{stat.suffix}
                  </span>
                  {stat.unit && (
                    <span className="text-xl font-bold text-amber-400 mb-1">{stat.unit}</span>
                  )}
                </div>
                <div className="w-8 h-0.5 bg-amber-500/60 rounded-full mb-3 group-hover:w-14 transition-all duration-500" />
                <p className="text-sm font-semibold text-white/90 tracking-wide">{stat.label}</p>
                <p className="text-xs text-zinc-500 mt-1">{stat.sub}</p>
              </div>
            ))}
            {/* 4. stat — aralık değeri, statik */}
            <div className="flex flex-col items-center text-center px-6 py-8 group">
              <div className="flex items-end gap-1 mb-3">
                <span
                  className="text-5xl md:text-6xl font-black text-white leading-none"
                  style={{ animation: "char-float 8.4s ease-in-out infinite" }}
                >
                  3-7
                </span>
                <span className="text-xl font-bold text-amber-400 mb-1">Gün</span>
              </div>
              <div className="w-8 h-0.5 bg-amber-500/60 rounded-full mb-3 group-hover:w-14 transition-all duration-500" />
              <p className="text-sm font-semibold text-white/90 tracking-wide">Kapınıza Teslimat</p>
              <p className="text-xs text-zinc-500 mt-1">Hızlı ve güvenli</p>
            </div>
          </div>

          {/* Platform Rozetleri */}
          <div className="border-t border-zinc-700/50 mt-14 pt-10">
            <p className="text-center text-xs tracking-[0.4em] text-zinc-500 uppercase mb-8">
              Satış Platformlarımız
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
              {/* Trendyol */}
              <a
                href="https://www.trendyol.com/magaza/decoroys-m-555247?channelId=1&subPathStrategy=no-subpath&sst=0&sk=1"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 bg-zinc-800 hover:bg-[#F27A1A]/10 border border-zinc-700 hover:border-[#F27A1A]/50 rounded-2xl px-6 py-4 transition-all duration-300"
              >
                <span className="text-[#F27A1A] font-black text-lg tracking-tight">trendyol</span>
                <span className="text-[10px] font-semibold text-[#F27A1A] bg-[#F27A1A]/15 rounded-full px-2.5 py-0.5 whitespace-nowrap">
                  ★ Hızlı ve Başarılı Satıcı
                </span>
              </a>
              {/* Hepsiburada */}
              <div className="flex flex-col items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-2xl px-6 py-4">
                <span className="text-[#FF6000] font-black text-lg tracking-tight">hepsiburada</span>
                <span className="text-[10px] text-zinc-500">Onaylı Satıcı</span>
              </div>
              {/* idefix */}
              <div className="flex flex-col items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-2xl px-6 py-4">
                <span className="font-black text-lg tracking-tight">
                  <span className="text-white">idea</span><span className="text-[#4f80e2]">fix</span>
                </span>
                <span className="text-[10px] text-zinc-500">Onaylı Satıcı</span>
              </div>
              {/* Amazon */}
              <div className="flex flex-col items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-2xl px-6 py-4">
                <span className="font-black text-lg tracking-tight">
                  <span className="text-white">amazon</span><span className="text-[#FF9900]">.com.tr</span>
                </span>
                <span className="text-[10px] text-zinc-500">Onaylı Satıcı</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ 7. Müşteri Yorumları ═══════ */}
      <section className="w-full mt-10 mb-4 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16 space-y-3">
            <p className="text-xs font-semibold tracking-[0.4em] text-amber-600 uppercase">Müşterilerimiz Anlatıyor</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900">
              Gerçek Deneyimler
            </h2>
            <p className="text-zinc-500 max-w-xl mx-auto">
              Decoroys ailesiyle tanışan müşterilerimizin samimi görüşleri.
            </p>
          </div>
        </div>

        <div className="relative max-w-6xl mx-auto px-10">
          {/* Sol ok */}
          <button
            onClick={() => scrollReviews("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white border border-zinc-200 rounded-full shadow-md flex items-center justify-center hover:bg-zinc-50 transition-colors"
          >
            <svg className="w-4 h-4 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Sağ ok */}
          <button
            onClick={() => scrollReviews("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white border border-zinc-200 rounded-full shadow-md flex items-center justify-center hover:bg-zinc-50 transition-colors"
          >
            <svg className="w-4 h-4 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Kartlar — yatay kaydırma */}
          <div
            ref={reviewsRef}
            className="flex gap-5 overflow-x-auto py-4"
            style={{ scrollbarWidth: "none", scrollSnapType: "x mandatory" }}
          >
            {REVIEWS.map((review, i) => (
              <div
                key={i}
                className="flex-none w-80 flex flex-col gap-4 bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                style={{ scrollSnapAlign: "start" }}
              >
                {/* Yıldızlar */}
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <svg key={s} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                {/* Yorum */}
                <p className="text-zinc-600 text-sm leading-relaxed italic flex-1">
                  &ldquo;{review.text}&rdquo;
                </p>

                {/* Ürün etiketi */}
                <span className="text-[10px] font-semibold tracking-widest text-amber-600 uppercase border border-amber-200 bg-amber-50 rounded-full px-3 py-1 w-fit">
                  {review.product}
                </span>

                {/* Müşteri */}
                <div className="flex items-center gap-3 pt-2 border-t border-zinc-100">
                  <div className={`w-9 h-9 rounded-full ${review.color} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-xs font-bold">{review.initials}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{review.name}</p>
                    <p className="text-xs text-zinc-400">{review.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alt dekor çizgisi */}
        <div className="flex items-center gap-4 mt-12 justify-center">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-300" />
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-300" />
        </div>
      </section>

      {/* ═══════ 8. Güvenli Ödeme Bölümü ═══════ */}
      <section className="w-full max-w-5xl mx-auto px-6 py-16 mb-8">
        <div className="bg-zinc-50 border border-zinc-100 rounded-3xl px-8 py-8 flex flex-col items-center gap-6">
          <div className="flex items-center gap-2 text-zinc-500">
            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Güvenli Alışveriş</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {/* PayTR */}
            <div className="flex items-center gap-2 bg-white border border-zinc-100 rounded-2xl px-5 py-3 shadow-sm">
              <div className="w-8 h-8 bg-[#0066CC] rounded-lg flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                  <path d="M3 6h18v2H3V6zm2 4h14v8H5v-8zm3 2v4h2v-4H8zm4 0v4h2v-4h-2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 leading-none">PayTR</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Güvenli Ödeme</p>
              </div>
            </div>

            {/* SSL */}
            <div className="flex items-center gap-2 bg-white border border-zinc-100 rounded-2xl px-5 py-3 shadow-sm">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 14l-3-3 1.41-1.41L11 12.17l4.59-4.58L17 9l-6 6z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 leading-none">SSL 256-bit</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Şifreli Bağlantı</p>
              </div>
            </div>

            {/* Visa */}
            <div className="flex items-center gap-2 bg-white border border-zinc-100 rounded-2xl px-5 py-3 shadow-sm">
              <svg viewBox="0 0 48 48" className="h-8 w-auto">
                <rect width="48" height="48" rx="6" fill="#1A1F71" />
                <text x="6" y="32" fontFamily="Arial" fontWeight="bold" fontSize="20" fill="white">VISA</text>
              </svg>
            </div>

            {/* Mastercard */}
            <div className="flex items-center gap-2 bg-white border border-zinc-100 rounded-2xl px-5 py-3 shadow-sm">
              <svg viewBox="0 0 48 32" className="h-8 w-auto">
                <rect width="48" height="32" rx="4" fill="white" />
                <circle cx="18" cy="16" r="10" fill="#EB001B" />
                <circle cx="30" cy="16" r="10" fill="#F79E1B" />
                <path d="M24 8.5a10 10 0 0 1 0 15 10 10 0 0 1 0-15z" fill="#FF5F00" />
              </svg>
            </div>

            {/* 3D Secure */}
            <div className="flex items-center gap-2 bg-white border border-zinc-100 rounded-2xl px-5 py-3 shadow-sm">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 leading-none">3D Secure</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Güvenli Doğrulama</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-zinc-400 text-center max-w-md">
            Tüm ödemeler PayTR altyapısı üzerinden 256-bit SSL şifreleme ile güvence altında işlenmektedir.
          </p>
        </div>
      </section>
    </div>
  );
}
