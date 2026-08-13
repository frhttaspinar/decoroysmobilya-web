"use client";

import { useDrawerStore } from "@/store/useDrawerStore";
import { useCartStore } from "@/store/useCartStore";
import { X, Minus, Plus, ShoppingBag, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { auth, googleProvider, db } from "@/lib/firebase";
import { signInWithPopup, User as FirebaseUser, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, collection as fsCollection, query, where, getDocs } from "firebase/firestore";

export default function GlobalDrawer() {
  const { isOpen, view, closeDrawer } = useDrawerStore();
  const { items, updateQuantity, removeItem } = useCartStore();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const [authError, setAuthError] = useState<string | null>(null);

  type OrderItem = { name: string; quantity: number; price: number; image?: string | null };
  type UserOrder = { id: string; status: string; total: number; createdAt: any; items: OrderItem[] };
  const [userOrders, setUserOrders] = useState<UserOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsLoadingAuth(false);
      if (user) {
        setIsLoadingOrders(true);
        try {
          const q = query(
            fsCollection(db, "orders"),
            where("uid", "==", user.uid)
          );
          const snap = await getDocs(q);
          const fetched = snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserOrder));
          fetched.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
          setUserOrders(fetched);
        } catch {
          setUserOrders([]);
        } finally {
          setIsLoadingOrders(false);
        }
      } else {
        setUserOrders([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const getErrorMessage = (code: string): string => {
    switch (code) {
      case "auth/user-not-found": return "Bu e-posta adresiyle kayıtlı bir hesap bulunamadı.";
      case "auth/wrong-password": return "Şifre hatalı. Lütfen tekrar deneyin.";
      case "auth/invalid-credential": return "E-posta veya şifre hatalı.";
      case "auth/email-already-in-use": return "Bu e-posta adresi zaten kullanımda.";
      case "auth/weak-password": return "Şifre en az 6 karakter olmalıdır.";
      case "auth/invalid-email": return "Geçerli bir e-posta adresi girin.";
      case "auth/too-many-requests": return "Çok fazla başarısız deneme. Lütfen biraz bekleyin.";
      case "auth/popup-closed-by-user": return "Google girişi iptal edildi.";
      case "auth/popup-blocked": return "Açılır pencere engellendi. Lütfen tarayıcı ayarlarını kontrol edin.";
      default: return "Bir hata oluştu. Lütfen tekrar deneyin.";
    }
  };

  const handleGuestCheckout = () => {
    closeDrawer();
    router.push("/odeme");
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          createdAt: new Date(),
        });
      }
    } catch (error: any) {
      setAuthError(getErrorMessage(error.code));
    }
  };

  if (!isMounted) return null;

  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Profile / Auth View
  const renderProfileView = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between p-4 border-b border-zinc-100">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-zinc-900">
          <User className="w-5 h-5" />
          {currentUser ? 'Hesabım' : 'Giriş Yap'}
        </h2>
        <button
          onClick={closeDrawer}
          className="p-2 hover:bg-zinc-50 rounded-full transition-colors text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center">
        {isLoadingAuth ? (
          <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin"></div>
        ) : currentUser?.email === "roysdekors@gmail.com" ? (
          <div className="w-full flex flex-col items-center gap-6 py-8 text-center">
            <div className="w-14 h-14 bg-zinc-900 text-white rounded-full flex items-center justify-center text-lg font-bold">A</div>
            <div>
              <p className="font-semibold text-zinc-900">Yönetici Hesabı</p>
              <p className="text-xs text-zinc-400 mt-1">Müşteri olarak alışveriş yapmak için çıkış yapın.</p>
            </div>
            <button
              onClick={() => signOut(auth)}
              className="px-6 py-2.5 rounded-2xl border border-zinc-200 text-zinc-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors font-medium text-sm"
            >
              Çıkış Yap
            </button>
          </div>
        ) : currentUser ? (
          <div className="w-full flex flex-col gap-6">
            {/* Kullanıcı Bilgisi */}
            <div className="flex flex-col items-center text-center gap-2 pt-2">
              <div className="w-16 h-16 bg-zinc-900 text-white rounded-full flex items-center justify-center text-xl font-bold">
                {currentUser.displayName?.charAt(0)?.toUpperCase() || currentUser.email?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900">{currentUser.displayName || "Kullanıcı"}</h3>
                <p className="text-xs text-zinc-400">{currentUser.email}</p>
              </div>
            </div>

            {/* Siparişlerim */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Siparişlerim</h4>
              {isLoadingOrders ? (
                <div className="flex justify-center py-6">
                  <span className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-600 rounded-full animate-spin" />
                </div>
              ) : userOrders.length === 0 ? (
                <div className="bg-zinc-50 rounded-2xl px-4 py-6 text-center">
                  <p className="text-sm text-zinc-400 font-light">Henüz siparişiniz bulunmuyor.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {userOrders.map((order) => {
                    const statusMap: Record<string, { label: string; cls: string }> = {
                      beklemede: { label: "Beklemede", cls: "bg-amber-50 text-amber-700" },
                      hazirlaniyor: { label: "Hazırlanıyor", cls: "bg-blue-50 text-blue-700" },
                      kargoda: { label: "Kargoda", cls: "bg-violet-50 text-violet-700" },
                      "teslim-edildi": { label: "Teslim Edildi", cls: "bg-green-50 text-green-700" },
                      iptal: { label: "İptal Edildi", cls: "bg-red-50 text-red-700" },
                    };
                    const st = statusMap[order.status] ?? { label: order.status, cls: "bg-zinc-100 text-zinc-600" };
                    const date = order.createdAt?.toDate?.()
                      ? order.createdAt.toDate().toLocaleDateString("tr-TR")
                      : "—";
                    return (
                      <div key={order.id} className="bg-zinc-50 rounded-2xl p-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-zinc-400 font-mono">#{order.id.slice(-6).toUpperCase()}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                        </div>
                        <div className="text-xs text-zinc-500">{date}</div>
                        <div className="text-xs text-zinc-500 line-clamp-1">
                          {order.items?.map((i) => `${i.name} ×${i.quantity}`).join(", ")}
                        </div>
                        <div className="text-sm font-semibold text-zinc-900">
                          {order.total?.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Çıkış */}
            <button
              onClick={() => signOut(auth)}
              className="w-full py-3 rounded-2xl border border-zinc-200 text-zinc-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors font-medium text-sm"
            >
              Çıkış Yap
            </button>
          </div>
        ) : (
          <motion.div
            className="w-full flex flex-col gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
          >
            {/* Başlık */}
            <motion.div
              className="text-center pt-2 pb-1"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 0.6, 0.22, 1] }}
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200/60"
                style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)" }}>
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </div>
              <h3
                className="text-2xl font-black bg-clip-text text-transparent mb-1.5"
                style={{
                  backgroundImage: "linear-gradient(90deg, #f97316, #ec4899, #8b5cf6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Hoş Geldiniz
              </h3>
              <p className="text-sm text-zinc-500 font-light leading-relaxed">
                Siparişlerinizi takip etmek için giriş yapın<br />ya da üye olmadan devam edin.
              </p>
            </motion.div>

            {/* Google Butonu */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 0.6, 0.22, 1] }}
              whileHover={{ scale: 1.025, boxShadow: "0 8px 28px rgba(66,133,244,0.18)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setAuthError(null); handleGoogleLogin(); }}
              type="button"
              className="w-full bg-white border-2 border-zinc-200 text-zinc-900 py-4 rounded-2xl font-semibold flex items-center justify-center gap-3 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span className="text-base">Google ile Giriş Yap</span>
            </motion.button>

            {authError && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-xl text-center"
              >
                {authError}
              </motion.p>
            )}

            {/* Ayırıcı */}
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-zinc-100" />
              <span className="text-xs text-zinc-400 font-light">veya</span>
              <div className="flex-1 border-t border-zinc-100" />
            </div>

            {/* Misafir Butonu */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25, ease: [0.22, 0.6, 0.22, 1] }}
              whileHover={{ scale: 1.025, boxShadow: "0 12px 36px rgba(249,115,22,0.30)" }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={handleGuestCheckout}
              className="w-full relative overflow-hidden rounded-2xl py-5 px-5 flex items-center gap-4 text-white focus:outline-none focus:ring-4 focus:ring-orange-300/40 shadow-lg shadow-orange-200"
              style={{ background: "linear-gradient(135deg, #f59e0b 0%, #f97316 55%, #ef4444 100%)" }}
            >
              {/* parlaklık süpürme efekti */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.22) 50%, transparent 65%)" }}
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.8, ease: "easeInOut" }}
              />
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </div>
              <div className="text-left flex-1">
                <p className="font-bold text-base leading-tight">Üye Olmadan Devam Et</p>
                <p className="text-xs text-orange-100 mt-0.5 font-light">Hızlıca sipariş ver, kayıt gerekmez</p>
              </div>
              <motion.svg
                className="w-5 h-5 text-white/80 flex-shrink-0"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </motion.svg>
            </motion.button>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center text-xs text-zinc-400 font-light leading-relaxed"
            >
              Giriş yaparak siparişlerinizi takip<br />edebilir ve hızlıca tekrar sipariş verebilirsiniz.
            </motion.p>
          </motion.div>
        )}
      </div>
    </div>
  );

  // Cart View
  const renderCartView = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between p-4 border-b border-zinc-100">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-zinc-900">
          <ShoppingBag className="w-5 h-5" />
          Sepetim ({items.length})
        </h2>
        <button
          onClick={closeDrawer}
          className="p-2 hover:bg-zinc-50 rounded-full transition-colors text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <ShoppingBag strokeWidth={1} className="w-16 h-16 mb-4 text-zinc-300" />
            <p className="text-zinc-500 font-light">Sepetiniz şu an boş.</p>
            <button
              onClick={closeDrawer}
              className="mt-6 px-6 py-2.5 rounded-full border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              Alışverişe Başla
            </button>
          </div>
        ) : (
          items.map((item) => (
            <div key={`${item.id}-${item.size ?? ""}-${item.color ?? ""}`} className="flex gap-4 border-b border-zinc-100 pb-4">
              <div className="w-20 h-20 bg-zinc-100 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <ShoppingBag strokeWidth={1.5} className="w-6 h-6 text-zinc-300" />
                )}
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-medium text-zinc-900 line-clamp-2 leading-tight">{item.name}</h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    {item.size && <span>Ölçü: {item.size}</span>}
                    {item.color && item.size && <span> · </span>}
                    {item.color && <span>Renk: {item.color}</span>}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Birim: {item.price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                  </p>
                  <p className="font-medium text-zinc-900 mt-0.5">
                    {(item.price * item.quantity).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                  </p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1, item.color, item.size)}
                      className="p-1 hover:bg-zinc-100 text-zinc-600 transition-colors focus:outline-none rounded-md"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-3 text-sm font-medium w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1, item.color, item.size)}
                      className="p-1 hover:bg-zinc-100 text-zinc-600 transition-colors focus:outline-none rounded-md"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id, item.color, item.size)}
                    className="text-xs text-zinc-400 hover:text-red-500 font-medium transition-colors underline"
                  >
                    Kaldır
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {items.length > 0 && (
        <div className="p-5 border-t border-zinc-100 bg-white pb-safe">
          <div className="flex items-center justify-between mb-4">
            <span className="text-zinc-500 font-medium">Toplam</span>
            <span className="text-xl font-medium text-zinc-900">{total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</span>
          </div>
          <Link
            href="/odeme"
            onClick={closeDrawer}
            className="w-full bg-zinc-900 text-white py-3.5 rounded-lg font-medium flex items-center justify-center hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-200 shadow-sm"
          >
            Ödeme Adımına Geç
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <div
        className={`fixed z-50 flex flex-col bg-white shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
          bottom-0 left-0 right-0 h-[85vh] rounded-t-3xl transform ${isOpen ? "translate-y-0" : "translate-y-full"}
          md:top-0 md:bottom-0 md:right-0 md:left-auto md:w-[400px] md:h-full md:rounded-none ${isOpen ? "md:translate-x-0 md:translate-y-0" : "md:translate-x-full md:translate-y-0"}
        `}
      >
        {view === 'cart' && renderCartView()}
        {view === 'profile' && renderProfileView()}
      </div>
    </>
  );
}
