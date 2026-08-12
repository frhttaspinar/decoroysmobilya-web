"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/useCartStore";
import { motion } from "motion/react";
import Link from "next/link";

/**
 * ⚠️ Bu sayfa ödeme gerçeğinin KAYNAĞI DEĞİLDİR.
 *
 * Hiçbir sipariş yazmaz, hiçbir Firestore kaydı oluşturmaz ve hiçbir mail
 * tetiklemez. Kullanıcı bu URL'yi elle açsa bile admin Siparişler ekranında
 * sipariş oluşmaz. Siparişin gerçekten oluşması yalnızca sunucu tarafında,
 * doğrulanmış PayTR callback'i ile gerçekleşir (/api/payment/webhook).
 *
 * Burada yapılan tek yan etki sepeti temizlemektir — bu tamamen yerel bir
 * kullanıcı arayüzü durumudur.
 */
export default function PaymentSuccessPage() {
  const clearCart = useCartStore((s) => s.clearCart);

  useEffect(() => {
    // PayTR iFrame içinde yüklendiyse üst pencereye çık — merchant_ok_url'deki
    // orderId sorgu parametresi korunur.
    if (typeof window !== "undefined" && window.top !== window.self) {
      window.top!.location.href = `/odeme/basarili${window.location.search}`;
      return;
    }
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full flex flex-col items-center text-center gap-8">

        {/* Animasyonlu yeşil tik */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
          className="relative flex items-center justify-center"
        >
          {/* Pulse halkası */}
          <motion.span
            className="absolute inset-0 rounded-full bg-green-100"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 1.2, delay: 0.4, repeat: 1, ease: "easeOut" }}
          />
          <div className="relative w-24 h-24 rounded-full bg-green-50 flex items-center justify-center">
            <svg
              viewBox="0 0 52 52"
              className="w-12 h-12"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <motion.circle
                cx="26"
                cy="26"
                r="24"
                stroke="#22c55e"
                strokeWidth="2.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.55, delay: 0.15, ease: "easeOut" }}
              />
              <motion.path
                d="M14 27l8 8 16-16"
                stroke="#22c55e"
                strokeWidth="3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: 0.6, ease: "easeOut" }}
              />
            </svg>
          </div>
        </motion.div>

        {/* Başlık ve açıklama */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.5 }}
          className="space-y-3"
        >
          <h1 className="text-3xl font-semibold text-zinc-900 tracking-tight">
            Ödemeniz Alındı
          </h1>
          <p className="text-zinc-500 font-light leading-relaxed">
            Ödemeniz bankadan onaylandı ve siparişiniz kaydediliyor.
            <br />
            Sipariş detaylarınız kayıtlı e-posta adresinize iletilecektir.
          </p>
        </motion.div>

        {/* Güven bilgi kartı */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="w-full bg-zinc-50 rounded-2xl px-6 py-5 flex flex-col gap-3 text-sm text-zinc-500"
        >
          {[
            { icon: "📦", text: "Siparişiniz 1–3 iş günü içinde kargoya verilecek." },
            { icon: "📧", text: "Kargo takip numaranız e-posta ile iletilecek." },
            { icon: "💬", text: "Sorularınız için WhatsApp hattımız 7/24 hizmetinizdedir." },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-start gap-3">
              <span className="text-base leading-snug">{icon}</span>
              <span className="font-light leading-snug">{text}</span>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.85 }}
          className="w-full flex flex-col gap-3"
        >
          <Link
            href="/urunler"
            className="w-full bg-zinc-900 text-white py-4 rounded-xl font-medium text-base hover:bg-black transition-colors text-center"
          >
            Alışverişe Devam Et
          </Link>
          <Link
            href="/"
            className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            Ana Sayfaya Dön
          </Link>
        </motion.div>

      </div>
    </div>
  );
}
