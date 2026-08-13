"use client";

import { useProductStore } from "@/store/useProductStore";
import { useCartStore } from "@/store/useCartStore";
import { useDrawerStore } from "@/store/useDrawerStore";
import { Truck, ShieldCheck, Sparkles } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { productSize, productColor } from "@/lib/product-pricing";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2 }).format(price);

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/decoroys\s+/g, "")
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i")
    .replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const COLOR_HEX: Record<string, string> = {
  "Beyaz": "#F5F5F0",
  "Antrasit": "#3D3D3D",
  "Siyah": "#1A1A1A",
  "Premium Siyah": "#111111",
  "Fildişi": "#F4F0E6",
  "Altın": "#C9A84C",
  "Doğal Ahşap": "#9E7A4A",
  "Gri": "#9E9E9E",
  "Standart": "#A8A8A8",
  "Kahverengi": "#6B4226",
  "Meşe": "#B8935A",
  "Ceviz": "#7B4B2A",
  "Krem": "#F5F0E8",
  "Lacivert": "#1B2A4A",
};

const LIGHT_COLORS = new Set(["Beyaz", "Fildişi", "Krem"]);
const EASE = [0.22, 0.6, 0.22, 1] as const;

interface Props {
  id: string;
}

export default function UrunClient({ id }: Props) {
  const { products, loading } = useProductStore();
  const { addItem } = useCartStore();
  const { openDrawer } = useDrawerStore();
  const [activeIndex, setActiveIndex]     = useState(0);

  if (loading) {
    return (
      <div className="bg-white min-h-screen py-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="aspect-[4/5] w-full bg-zinc-100 rounded-3xl animate-pulse" />
          <div className="flex flex-col gap-6 pt-4">
            <div className="h-10 bg-zinc-200 rounded-xl w-3/4 animate-pulse" />
            <div className="h-8 bg-zinc-100 rounded-xl w-1/3 animate-pulse" />
            <div className="space-y-3 mt-4">
              <div className="h-4 bg-zinc-100 rounded w-full animate-pulse" />
              <div className="h-4 bg-zinc-100 rounded w-5/6 animate-pulse" />
              <div className="h-4 bg-zinc-100 rounded w-4/6 animate-pulse" />
            </div>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3].map((i) => <div key={i} className="w-20 h-9 bg-zinc-100 rounded-full animate-pulse" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const product = products.find((p) => p.id === id || toSlug(p.name) === id);
  if (!product) notFound();

  // ── Geriye dönük uyumluluk: eski 'image: string' veya boş dizi ──
  const imageList: string[] = (() => {
    if (Array.isArray(product.images) && product.images.some(Boolean)) {
      return product.images.filter(Boolean);
    }
    const legacy = (product as unknown as Record<string, unknown>)["image"];
    if (typeof legacy === "string" && legacy) return [legacy];
    return ["/images/logo.png"];
  })();

  /**
   * 1 ÜRÜN = 1 FİYAT + 1 ÖLÇÜ + 1 RENK.
   * Seçim yoktur: ölçü, renk ve fiyat doğrudan ürün dokümanından okunur.
   * `features` yalnız genel özelliktir; ölçü kaynağı DEĞİLDİR.
   */
  const size = productSize(product);
  const color = productColor(product);
  const price = product.price;

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price,
      quantity: 1,
      image: product.images[0],
      color: color ?? undefined,
      size: size ?? undefined,
      stockCode: product.stockCode,
    });
    openDrawer("cart");
  };

  return (
    <div className="bg-white min-h-screen py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

        {/* ── Sol: Galeri ── */}
        <motion.div
          initial={{ opacity: 0, x: -48, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.75, ease: EASE }}
          className="flex flex-col gap-4"
        >
          {/* Ana görsel */}
          <div className="relative aspect-[4/5] w-full bg-zinc-50 rounded-3xl overflow-hidden shadow-2xl">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <Image
                  src={imageList[activeIndex]}
                  alt={`${product.name} — görsel ${activeIndex + 1}`}
                  fill
                  className="object-cover"
                  priority={activeIndex === 0}
                />
              </motion.div>
            </AnimatePresence>

            {/* Alt gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />

            {/* Kategori etiketi */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45, ease: EASE }}
              className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs font-bold text-zinc-600 uppercase tracking-widest shadow-sm"
            >
              {product.category}
            </motion.div>

            {/* Görsel sayacı — birden fazla görsel varsa */}
            {imageList.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-[11px] font-semibold text-white">
                {activeIndex + 1} / {imageList.length}
              </div>
            )}
          </div>

          {/* Thumbnail şeridi — yalnızca 1'den fazla görsel varsa */}
          {imageList.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.55, ease: EASE }}
              className="flex gap-3"
            >
              {imageList.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  aria-label={`Görsel ${i + 1}`}
                  className={`relative flex-1 aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 focus:outline-none ${
                    i === activeIndex
                      ? "border-zinc-900 shadow-md scale-100 opacity-100"
                      : "border-zinc-200 opacity-50 scale-95 hover:opacity-80 hover:border-zinc-400"
                  }`}
                >
                  <Image
                    src={src}
                    alt={`${product.name} thumbnail ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                  {/* Seçili overlay halkası */}
                  {i === activeIndex && (
                    <motion.div
                      layoutId="gallery-active-ring"
                      className="absolute inset-0 rounded-[10px] border-2 border-zinc-900 pointer-events-none"
                    />
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* ── Sağ: İçerik ── */}
        <div className="flex flex-col gap-7 lg:sticky lg:top-28">

          {/* Başlık & Rozetler */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
            className="space-y-4"
          >
            <h1 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tight leading-tight">
              {product.name}
            </h1>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3.5 py-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs text-amber-700 font-bold tracking-wide">Premium Koleksiyon</span>
              </span>
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-3.5 py-1.5">
                <Truck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs text-emerald-700 font-bold">Zarif Dokunuşlar</span>
              </span>
              <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-full px-3.5 py-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs text-blue-700 font-bold">2 Yıl Garanti</span>
              </span>
            </div>
          </motion.div>

          {/* Fiyat */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18, ease: EASE }}
            className="flex items-end gap-2"
          >
            <span className="text-4xl font-black text-zinc-900 tabular-nums">
              {formatPrice(price)}
            </span>
            <span className="text-2xl font-bold text-amber-500 pb-0.5">₺</span>
          </motion.div>

          {/* Ölçü & Renk — SEÇİM DEĞİL, ürünün sabit bilgisi.
              Girilmemiş alanın satırı hiç gösterilmez (uydurma yapılmaz). */}
          {(size || color) && (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.22, ease: EASE }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-zinc-100 pt-6"
            >
              {size && (
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 px-4 py-3">
                  <span className="block text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                    Ölçü
                  </span>
                  <span className="block text-sm font-semibold text-zinc-900 mt-1">{size}</span>
                </div>
              )}
              {color && (
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 px-4 py-3">
                  <span className="block text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                    Renk
                  </span>
                  <span className="flex items-center gap-2 mt-1">
                    <span
                      className={`w-4 h-4 rounded-full flex-shrink-0 ${
                        LIGHT_COLORS.has(color) ? "border border-zinc-300" : ""
                      }`}
                      style={{ background: COLOR_HEX[color] ?? "#A8A8A8" }}
                    />
                    <span className="text-sm font-semibold text-zinc-900">{color}</span>
                  </span>
                </div>
              )}
            </motion.div>
          )}

          {/* Açıklama */}
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.26, ease: EASE }}
            className="text-base text-zinc-600 leading-relaxed border-t border-zinc-100 pt-6"
          >
            {product.description}
          </motion.p>

          {/* Özellikler */}
          {product.features && product.features.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.42, ease: EASE }}
              className="space-y-3"
            >
              <span className="text-xs font-bold text-zinc-800 uppercase tracking-widest block">Ürün Özellikleri</span>
              <div className="grid grid-cols-2 gap-2">
                {product.features.map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.48 + idx * 0.07, ease: EASE }}
                    className="flex items-center gap-2.5 bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-2.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                    <span className="text-sm text-zinc-700 font-medium">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Sepete Ekle */}
          <motion.button
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.54, ease: EASE }}
            whileHover={{ scale: 1.02, boxShadow: "0 24px 48px rgba(0,0,0,0.2)" }}
            whileTap={{ scale: 0.97 }}
            onClick={handleAddToCart}
            className="w-full bg-zinc-900 text-white py-5 rounded-2xl text-lg font-semibold focus:outline-none focus:ring-4 focus:ring-zinc-300 shadow-xl"
          >
            Sepete Ekle
            {size && <span className="ml-2 text-zinc-400 text-base font-normal">— {size}</span>}
            {color && <span className="ml-2 text-zinc-400 text-base font-normal">— {color}</span>}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
