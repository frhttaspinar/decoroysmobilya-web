"use client";

import { useEffect, useRef, useState } from "react";
import { useCartStore } from "@/store/useCartStore";
import { motion } from "motion/react";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";

/**
 * ⚠️ Bu sayfa ödeme gerçeğinin KAYNAĞI DEĞİLDİR.
 *
 * Sayfa hiçbir sipariş yazmaz. Yalnızca /api/payment/reconcile uç noktasına
 * merchantOid taşır; ödemenin gerçekliğine SUNUCU, PayTR Durum Sorgu API'siyle
 * karar verir. Bu URL'yi elle açmak sipariş oluşturamaz: reconcile yalnız
 * (a) tanınan bir payment_attempt varsa ve (b) PayTR gerçekten success dönerse
 * sipariş yaratır.
 *
 * Webhook normal çalıştıysa reconcile "already confirmed" görüp idempotent biter.
 */

type Phase = "verifying" | "confirmed" | "pending" | "unknown";

const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 2500;

/**
 * Ödemeyi sunucuda doğrular ve nihai aşamayı DÖNER.
 * Bilinçli olarak saf: hiçbir React state'ine dokunmaz. Böylece effect
 * gövdesinden senkron setState çağrılmaz; tüm güncellemeler promise
 * callback'inde yapılır.
 */
async function runVerification(merchantOid: string): Promise<Phase> {
  if (!merchantOid) return "unknown";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch("/api/payment/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantOid }),
      });
      const data = (await res.json().catch(() => ({}))) as { status?: string };

      if (data.status === "confirmed") return "confirmed";
      if (data.status === "unknown_order" || data.status === "invalid_request") return "unknown";
      // not_paid / review_required / error → PayTR henüz yansıtmamış olabilir.
    } catch {
      // ağ hatası — sınırlı sayıda tekrar denenir
    }
    if (attempt < MAX_ATTEMPTS) await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
  }
  return "pending";
}

export default function PaymentSuccessPage() {
  const clearCart = useCartStore((s) => s.clearCart);
  const [phase, setPhase] = useState<Phase>("verifying");
  const startedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || startedRef.current) return;

    // PayTR iFrame içinde yüklendiyse üst pencereye çık — orderId korunur.
    if (window.top !== window.self) {
      window.top!.location.href = `/odeme/basarili${window.location.search}`;
      return;
    }
    startedRef.current = true;

    const merchantOid =
      new URLSearchParams(window.location.search).get("orderId")?.trim() ?? "";

    let cancelled = false;
    // Tüm durum güncellemeleri promise callback'inde — effect gövdesinde değil.
    void runVerification(merchantOid).then(
      (next) => {
        if (cancelled) return;
        setPhase(next);
        if (next !== "pending") clearCart();
      },
      () => {
        if (!cancelled) setPhase("pending");
      }
    );

    return () => { cancelled = true; };
  }, [clearCart]);

  /* ═══════ Doğrulanıyor ═══════ */
  if (phase === "verifying") {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <div className="max-w-md w-full flex flex-col items-center text-center gap-6">
          <Loader2 className="w-12 h-12 text-zinc-400 animate-spin" />
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">
              Ödemeniz doğrulanıyor...
            </h1>
            <p className="text-zinc-500 font-light leading-relaxed">
              Bankanızdan gelen onay kontrol ediliyor. Lütfen bu sayfayı kapatmayın.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════ Doğrulanamadı / beklemede ═══════ */
  if (phase === "pending" || phase === "unknown") {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <div className="max-w-md w-full flex flex-col items-center text-center gap-6">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">
              Ödemeniz işleniyor
            </h1>
            <p className="text-zinc-500 font-light leading-relaxed">
              Ödemeniz alındıysa siparişiniz kısa süre içinde otomatik olarak
              oluşturulacak ve e-posta ile bilgilendirileceksiniz.
              <br />
              Sorunuz olursa WhatsApp hattımızdan bize ulaşabilirsiniz.
            </p>
          </div>
          <Link
            href="/"
            className="w-full bg-zinc-900 text-white py-4 rounded-xl font-medium text-base hover:bg-black transition-colors text-center"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  /* ═══════ Onaylandı ═══════ */

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
            Siparişiniz Onaylandı
          </h1>
          <p className="text-zinc-500 font-light leading-relaxed">
            Ödemeniz doğrulandı ve siparişiniz oluşturuldu.
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
