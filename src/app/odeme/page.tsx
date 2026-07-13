"use client";

import { useCartStore } from "@/store/useCartStore";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { ShieldCheck, CreditCard, Loader2, Lock, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Step = "form" | "payment";

export default function CheckoutPage() {
  const { items } = useCartStore();
  const [isMounted, setIsMounted]       = useState(false);
  const [currentUser, setCurrentUser]   = useState<User | null>(null);

  // Form state
  const [fullName, setFullName]   = useState("");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");
  const [address, setAddress]     = useState("");
  const [city, setCity]           = useState("");
  const [district, setDistrict]   = useState("");

  // Akış state
  const [step, setStep]             = useState<Step>("form");
  const [paytrToken, setPaytrToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user?.email)       setEmail(user.email);
      if (user?.displayName) setFullName(user.displayName);
    });
    return () => unsubscribe();
  }, []);

  if (!isMounted) return null;

  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleStartPayment = async () => {
    if (!fullName.trim() || !email.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      setError("Lütfen Ad Soyad, E-posta, Telefon, Açık Adres ve İl alanlarını doldurun.");
      return;
    }
    if (items.length === 0) {
      setError("Sepetiniz boş.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // 1. Firebase'e siparişi kaydet — ödeme bekleniyor durumunda
      const orderData = {
        customerInfo: {
          name:     fullName.trim(),
          email:    email.trim(),
          phone:    phone.trim(),
          address:  address.trim(),
          city:     city.trim(),
          district: district.trim() || null,
        },
        items: items.map((item) => ({
          id:       item.id,
          name:     item.name,
          price:    item.price,
          quantity: item.quantity,
          image:    item.image    ?? null,
          color:    item.color    ?? null,
          size:     item.size     ?? null,
        })),
        total,
        status:    "Beklemede",
        uid:       currentUser ? currentUser.uid : null,
        isGuest:   !currentUser,
        createdAt: serverTimestamp(),
      };

      const docRef   = await addDoc(collection(db, "orders"), orderData);
      const newOrdId = docRef.id;

      // 2. PayTR token al — hata varsa iFrame ASLA açılmaz
      const res = await fetch("/api/payment/paytr", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId:     newOrdId,
          items:       orderData.items,
          totalAmount: total,
          email:       email.trim(),
          fullName:    fullName.trim(),
          phone:       phone.trim(),
          address:     address.trim(),
          city:        city.trim(),
          district:    district.trim(),
        }),
      });

      const data = await res.json() as { token?: string; error?: string };
      if (!res.ok || !data.token) {
        throw new Error("Ödeme sistemi başlatılamadı, lütfen daha sonra tekrar deneyin.");
      }

      setPaytrToken(data.token);
      setStep("payment");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Bir hata oluştu.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* ════════════════════════════════════════
          PayTR iFrame Overlay
      ════════════════════════════════════════ */}
      {step === "payment" && paytrToken && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          {/* Başlık çubuğu */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-zinc-100 shadow-sm">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-green-500" />
              <span className="text-sm font-semibold text-zinc-800">Güvenli Ödeme</span>
              <span className="hidden sm:inline text-xs text-zinc-400 font-medium bg-zinc-100 px-2 py-0.5 rounded-full">
                PayTR ile korunmaktadır
              </span>
            </div>
            <button
              onClick={() => {
                setStep("form");
                setPaytrToken(null);
              }}
              aria-label="Ödeme ekranını kapat"
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-100"
            >
              <X className="w-3.5 h-3.5" />
              Geri Dön
            </button>
          </div>

          {/* PayTR iFrame */}
          <iframe
            src={`https://www.paytr.com/odeme/guvenli/${paytrToken}`}
            className="flex-1 w-full border-0"
            allow="payment"
            title="PayTR Güvenli Ödeme"
            style={{ minHeight: 0 }}
          />
        </div>
      )}

      {/* ════════════════════════════════════════
          Ana Checkout Sayfası
      ════════════════════════════════════════ */}
      <div className="min-h-screen bg-white flex flex-col items-center pb-24">
        <header className="w-full max-w-6xl mx-auto px-6 h-20 md:h-28 flex items-center justify-between border-b border-zinc-100">
          <Link href="/" className="flex items-center">
            <img
              src="/images/logo.png"
              alt="Decoroys"
              className="h-20 md:h-28 w-auto object-contain transform scale-[1.3] md:scale-[1.5] origin-left"
            />
          </Link>
          <div className="flex items-center gap-2 text-zinc-500 font-light text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Güvenli Ödeme</span>
          </div>
        </header>

        {currentUser && (
          <div className="w-full bg-zinc-50 border-b border-zinc-100">
            <div className="max-w-6xl mx-auto px-6 py-3 text-sm text-zinc-500 font-light">
              <span className="text-green-600 font-medium">●</span>{" "}
              {currentUser.email} olarak giriş yaptınız
            </div>
          </div>
        )}

        <main className="w-full max-w-6xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-16">
          {/* Sol: Teslimat Bilgileri */}
          <div className="flex-1 space-y-8">
            <div>
              <h2 className="text-2xl font-light text-zinc-900 mb-6">Teslimat ve Fatura Adresi</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Ad Soyad *</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ad Soyad"
                      className="w-full bg-zinc-100 border-none outline-none focus:ring-2 focus:ring-blue-200 px-4 py-3.5 rounded-lg text-zinc-900 placeholder:text-zinc-400 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">E-posta *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ornek@mail.com"
                      className="w-full bg-zinc-100 border-none outline-none focus:ring-2 focus:ring-blue-200 px-4 py-3.5 rounded-lg text-zinc-900 placeholder:text-zinc-400 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Telefon *</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="05xx xxx xx xx"
                      className="w-full bg-zinc-100 border-none outline-none focus:ring-2 focus:ring-blue-200 px-4 py-3.5 rounded-lg text-zinc-900 placeholder:text-zinc-400 transition-all"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Açık Adres *</label>
                    <textarea
                      rows={3}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Mahalle, Sokak, No..."
                      className="w-full bg-zinc-100 border-none outline-none focus:ring-2 focus:ring-blue-200 px-4 py-3.5 rounded-lg text-zinc-900 placeholder:text-zinc-400 transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">İl *</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="İstanbul"
                      className="w-full bg-zinc-100 border-none outline-none focus:ring-2 focus:ring-blue-200 px-4 py-3.5 rounded-lg text-zinc-900 placeholder:text-zinc-400 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">İlçe</label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="Kadıköy"
                      className="w-full bg-zinc-100 border-none outline-none focus:ring-2 focus:ring-blue-200 px-4 py-3.5 rounded-lg text-zinc-900 placeholder:text-zinc-400 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* PayTR bilgi bandı */}
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-5 py-4">
              <CreditCard className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700 font-light leading-relaxed">
                Kart bilgilerinizi bir sonraki adımda{" "}
                <span className="font-semibold">PayTR</span> güvenli ödeme ekranında gireceksiniz.
                Bilgileriniz hiçbir zaman sitemizde saklanmaz.
              </div>
            </div>
          </div>

          {/* Sağ: Sipariş Özeti */}
          <div className="w-full lg:w-[420px] flex-shrink-0 flex flex-col gap-10">
            <div>
              <h3 className="text-xl font-light text-zinc-900 mb-6">Sipariş Özeti</h3>
              <div className="space-y-4 mb-6">
                {items.length === 0 ? (
                  <p className="text-sm text-zinc-500 font-light">Sepetiniz boş.</p>
                ) : (
                  items.map((item) => (
                    <div
                      key={`${item.id}-${item.color}-${item.size}`}
                      className="flex gap-4 items-center"
                    >
                      <div className="w-16 h-16 bg-zinc-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-zinc-900 line-clamp-1">
                          {item.name}
                        </p>
                        <p className="text-xs text-zinc-500 font-light mt-0.5">
                          {item.quantity} adet
                        </p>
                      </div>
                      <div className="text-right font-medium text-sm">
                        {(item.price * item.quantity).toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        ₺
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-zinc-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-zinc-500">
                  <span>Ara Toplam</span>
                  <span>
                    {total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                  </span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Kargo</span>
                  <span>Ücretsiz</span>
                </div>
                <div className="flex justify-between text-lg font-medium pt-3 text-zinc-900">
                  <span>Toplam</span>
                  <span>
                    {total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              onClick={handleStartPayment}
              disabled={isSubmitting || items.length === 0}
              className="w-full bg-zinc-900 text-white py-4 mt-2 rounded-xl font-medium text-lg flex items-center justify-center gap-2 hover:bg-black transition-colors focus:outline-none focus:ring-4 focus:ring-blue-200 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Ödeme Hazırlanıyor...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Ödemeye Geç
                </>
              )}
            </button>

            {!currentUser && (
              <p className="text-xs text-zinc-400 text-center font-light -mt-6">
                Üye olmadan devam ediyorsunuz.{" "}
                <Link href="/giris" className="underline hover:text-zinc-700 transition-colors">
                  Giriş yapmak ister misiniz?
                </Link>
              </p>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
