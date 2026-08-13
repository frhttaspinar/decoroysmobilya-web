"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Package, MapPin, Printer, Trash2, ShieldCheck, Mail } from "lucide-react";
import Image from "next/image";
import { db, auth } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, query, orderBy, deleteDoc } from "firebase/firestore";

export type FulfillmentStatus =
  | "beklemede" | "hazirlaniyor" | "kargoda" | "teslim-edildi" | "iptal";

export type Order = {
  id: string;
  customerInfo: {
    name: string;
    email: string | null;
    phone: string | null;
    address: string;
    city: string;
    district: string | null;
  };
  items: any[];
  total: number;
  /** Ödeme gerçeği — SADECE PayTR webhook'u yazar, admin değiştiremez. */
  paymentStatus?: "success" | "pending" | "failed" | "review_required";
  /** Operasyon durumu — admin yalnızca bunu değiştirir. */
  fulfillmentStatus?: FulfillmentStatus;
  /** Eski kayıtlarda operasyon durumu burada tutuluyordu. */
  status?: string;
  paidAt?: any;
  /** Sipariş tutarı — PayTR payment_amount ile doğrulanan değer. */
  paytrPaymentAmount?: number;
  /** Fiilen tahsil edilen toplam — taksitte sipariş tutarından yüksek olabilir. */
  paytrChargedTotal?: number;
  /** Legacy alan adı (eski kayıtlarda tahsil edilen toplam). */
  paytrTotal?: number;
  paytrPaymentDate?: string;
  paytrCurrency?: string;
  adminNotificationStatus?:
    | "pending" | "sending" | "sent" | "failed" | "skipped_legacy_backfill";
  adminNotificationError?: string;
  paytrPaymentType?: string | null;
  merchantOid?: string;
  createdAt: any;
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2 }).format(price);

/**
 * Operasyon durumunu normalize eder.
 * Eski kayıtlarda "Beklemede" / "beklemede" / "Ödendi" karışıklığı vardı;
 * burada tek bir küçük harfli sözlüğe indirgenir. Veri SİLİNMEZ, yalnız okunurken eşlenir.
 */
function normalizeFulfillment(o: Order): FulfillmentStatus {
  const raw = String(o.fulfillmentStatus ?? o.status ?? "beklemede").toLowerCase().trim();
  const map: Record<string, FulfillmentStatus> = {
    "beklemede": "beklemede",
    "ödendi": "beklemede",       // eski ödeme etiketi → operasyonel olarak yeni sipariş
    "odendi": "beklemede",
    "hazirlaniyor": "hazirlaniyor",
    "hazırlanıyor": "hazirlaniyor",
    "kargoda": "kargoda",
    "teslim-edildi": "teslim-edildi",
    "teslim edildi": "teslim-edildi",
    "iptal": "iptal",
  };
  return map[raw] ?? "beklemede";
}

/** Mail bildirim durumunun kullanıcıya gösterilecek karşılığı. */
const NOTIFICATION_LABELS: Record<string, { label: string; cls: string }> = {
  sent: { label: "Gönderildi", cls: "text-green-700 bg-green-50 border-green-200" },
  failed: { label: "Gönderilemedi", cls: "text-red-700 bg-red-50 border-red-200" },
  sending: { label: "Gönderiliyor", cls: "text-blue-700 bg-blue-50 border-blue-200" },
  pending: { label: "Bekliyor", cls: "text-amber-700 bg-amber-50 border-amber-200" },
  skipped_legacy_backfill: {
    label: "Legacy — gönderilmedi",
    cls: "text-zinc-600 bg-zinc-50 border-zinc-200",
  },
};

const statusOptions: { value: FulfillmentStatus; label: string }[] = [
  { value: "beklemede", label: "Beklemede" },
  { value: "hazirlaniyor", label: "Hazırlanıyor" },
  { value: "kargoda", label: "Kargoda" },
  { value: "teslim-edildi", label: "Teslim Edildi" },
  { value: "iptal", label: "İptal" },
];

const statusColors: Record<string, string> = {
  beklemede: "text-amber-700 bg-amber-50 border-amber-200",
  hazirlaniyor: "text-blue-700 bg-blue-50 border-blue-200",
  kargoda: "text-purple-700 bg-purple-50 border-purple-200",
  "teslim-edildi": "text-green-700 bg-green-50 border-green-200",
  iptal: "text-red-700 bg-red-50 border-red-200",
};

export default function AdminSiparislerPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("Tümü");
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];

      // ── İŞ KURALI: burada YALNIZ gerçekten ödenmiş siparişler bulunur ──
      // Yeni mimaride orders koleksiyonuna zaten sadece doğrulanmış PayTR
      // success kayıtları yazılır; bu filtre ek savunma katmanıdır ve ödemesi
      // doğrulanmamış legacy kayıtların sipariş gibi görünmesini engeller.
      setOrders(fetchedOrders.filter((o) => o.paymentStatus === "success"));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const showError = (msg: string) => {
    setActionError(msg);
    setTimeout(() => setActionError(null), 4000);
  };

  // Admin YALNIZCA operasyon durumunu değiştirir. paymentStatus'a dokunulmaz —
  // ödeme gerçeğinin tek yazarı PayTR webhook'udur.
  const updateOrderStatus = async (orderId: string, newStatus: FulfillmentStatus) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { fulfillmentStatus: newStatus });

    } catch (err) {
      console.error("Sipariş durumu güncellenirken hata:", err);
      showError("Sipariş durumu güncellenemedi. Lütfen tekrar deneyin.");
    }
  };

  /**
   * Bildirim mailini elle yeniden gönderir.
   * Yetki sunucuda doğrulanır; buradaki tek iş geçerli Firebase ID token'ı taşımaktır.
   * Ödeme durumuna dokunmaz.
   */
  const handleResendNotification = async (orderId: string) => {
    setResendingId(orderId);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Oturum bulunamadı, lütfen tekrar giriş yapın.");

      const res = await fetch("/api/admin/resend-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ merchantOid: orderId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Bildirim gönderilemedi.");
      if (data?.outcome === "in_progress") {
        showError("Bildirim şu anda gönderiliyor, lütfen birkaç saniye bekleyin.");
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Bildirim gönderilemedi.");
    } finally {
      setResendingId(null);
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    setDeleteConfirmId(orderId);
  };

  const confirmDeleteOrder = async (orderId: string) => {
    try {
      await deleteDoc(doc(db, "orders", orderId));
      if (expandedOrder === orderId) setExpandedOrder(null);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error("Sipariş silinirken hata:", err);
      setDeleteConfirmId(null);
      showError("Sipariş silinemedi. Lütfen tekrar deneyin.");
    }
  };

  if (!mounted) return null;

  const filteredOrders =
    filterStatus === "Tümü"
      ? orders
      : orders.filter((o) => normalizeFulfillment(o) === filterStatus);

  const toggleExpand = (id: string) => {
    setExpandedOrder(expandedOrder === id ? null : id);
  };

  const formatDate = (date: any) => {
    if (!date) return "";
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* ═══ Hata Toast ═══ */}
      {actionError && (
        <div className="fixed top-4 left-4 right-4 sm:top-6 sm:left-auto sm:right-6 sm:max-w-sm z-[200] flex items-center gap-3 bg-white border border-red-200 shadow-xl rounded-2xl px-5 py-4 sm:px-6 transition-all duration-300">
          <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
          <span className="text-sm font-medium text-red-700 min-w-0">{actionError}</span>
        </div>
      )}

      {/* ═══ Silme Onay Modalı ═══ */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-sm max-h-[90vh] overflow-y-auto text-center space-y-4">
            <Trash2 className="w-10 h-10 text-red-400 mx-auto" />
            <h3 className="text-base sm:text-lg font-bold text-zinc-900">Siparişi Silmek İstediğinize Emin Misiniz?</h3>
            <p className="text-sm text-zinc-500 font-light">Bu işlem geri alınamaz.</p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-3.5 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-50 border border-zinc-200 transition-colors"
              >
                Vazgeç
              </button>
              <button
                onClick={() => confirmDeleteOrder(deleteConfirmId)}
                className="flex-1 py-3.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Normal Ekran ═══ */}
      <div className="w-full print:hidden">
        {/* Başlık */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">Siparişler</h1>
          <p className="text-zinc-500 mt-2 font-light">
            Toplam {orders.length} sipariş bulunuyor.
          </p>
        </div>

        {/* Filtreler */}
        <div className="flex gap-2 flex-wrap mb-8">
          {["Tümü", ...statusOptions.map((s) => s.value)].map((status) => {
            const label =
              status === "Tümü"
                ? "Tümü"
                : statusOptions.find((s) => s.value === status)?.label || status;
            const count =
              status === "Tümü"
                ? orders.length
                : orders.filter((o) => normalizeFulfillment(o) === status).length;
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${filterStatus === status
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100 border border-zinc-100"
                  }`}
              >
                {label}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${filterStatus === status
                    ? "bg-white/20 text-white"
                    : "bg-zinc-200/50 text-zinc-500"
                    }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sipariş Listesi */}
        <div className="space-y-4">
          {loading ? (
            // Skeleton Loader
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border border-zinc-100 rounded-3xl shadow-sm p-5 sm:p-6 flex items-center gap-4 sm:gap-6 animate-pulse">
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="h-5 bg-zinc-200 rounded w-1/2 sm:w-1/4"></div>
                  <div className="h-4 bg-zinc-100 rounded w-2/3 sm:w-1/3"></div>
                </div>
                <div className="text-right space-y-2 flex-shrink-0">
                  <div className="h-6 bg-zinc-200 rounded w-20"></div>
                  <div className="h-4 bg-zinc-100 rounded w-12 ml-auto"></div>
                </div>
              </div>
            ))
          ) : filteredOrders.length === 0 ? (
            <div className="bg-zinc-50 rounded-3xl p-8 sm:p-12 text-center">
              <Package className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <p className="text-zinc-500 font-light">Bu filtreyle eşleşen sipariş bulunamadı.</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isExpanded = expandedOrder === order.id;
              const fulfillment = normalizeFulfillment(order);
              const colorCls = statusColors[fulfillment] || statusColors.beklemede;
              // Handle fallback if data was inserted via old method without customerInfo
              const customerName = order.customerInfo?.name || (order as any).customerName || "Bilinmiyor";
              const customerEmail = order.customerInfo?.email || (order as any).customerEmail || "Bilinmiyor";
              const customerPhone = order.customerInfo?.phone || (order as any).customerPhone || "Bilinmiyor";
              const customerAddress = order.customerInfo?.address || (order as any).address || "Bilinmiyor";
              const customerCity = order.customerInfo?.city || (order as any).city || "";
              const customerDistrict = order.customerInfo?.district || (order as any).district || "";

              return (
                <div
                  key={order.id}
                  className="bg-white border border-zinc-100 rounded-3xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Sipariş Başlığı */}
                  <button
                    onClick={() => toggleExpand(order.id)}
                    className="w-full px-5 py-4 sm:px-8 sm:py-6 flex items-start sm:items-center gap-3 sm:gap-6 text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-1.5">
                        <p className="font-semibold text-zinc-900 min-w-0 truncate max-w-full">{customerName}</p>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full border flex-shrink-0 whitespace-nowrap ${colorCls}`}>
                          {statusOptions.find((s) => s.value === fulfillment)?.label}
                        </span>
                        {/* Ödeme rozeti — backend paymentStatus'undan gelir, UI uydurmaz */}
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-green-200 bg-green-50 text-green-700 flex-shrink-0 whitespace-nowrap">
                          ✓ Ödendi
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-4 gap-y-1 text-xs text-zinc-400">
                        <span className="font-mono truncate max-w-[11rem] sm:max-w-none">{order.id}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="whitespace-nowrap">{formatDate(order.createdAt)}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 sm:mr-4">
                      <p className="text-base sm:text-lg font-bold text-zinc-900 whitespace-nowrap">₺{formatPrice(order.total)}</p>
                      <p className="text-xs text-zinc-400 whitespace-nowrap">{order.items?.reduce((a, i) => a + i.quantity, 0) || 0} ürün</p>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-zinc-400 flex-shrink-0 mt-1 sm:mt-0 transition-transform ${isExpanded ? "rotate-180" : ""
                        }`}
                    />
                  </button>

                  {/* Genişletilmiş Detay */}
                  {isExpanded && (
                    <div className="border-t border-zinc-100 px-5 py-5 sm:px-8 sm:py-6 bg-zinc-50/30">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                        {/* Sol: Ürünler */}
                        <div>
                          <h4 className="text-sm font-semibold text-zinc-700 mb-4 uppercase tracking-wide">
                            Sipariş Kalemleri
                          </h4>
                          <div className="space-y-3">
                            {order.items?.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-4 bg-white rounded-xl p-3 border border-zinc-100">
                                <div className="w-12 h-12 rounded-lg bg-zinc-100 overflow-hidden flex-shrink-0 relative">
                                  <Image
                                    src={item.image || "/zenna.png"}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-zinc-900 break-words">{item.name}</p>
                                  {/* Ölçü/renk yalnız varsa gösterilir — eski siparişlerle uyumlu */}
                                  {(item.size || item.color) && (
                                    <p className="text-xs text-zinc-600 mt-0.5">
                                      {item.size && <span>Ölçü: <span className="font-medium">{item.size}</span></span>}
                                      {item.size && item.color && <span className="text-zinc-300"> · </span>}
                                      {item.color && <span>Renk: <span className="font-medium">{item.color}</span></span>}
                                    </p>
                                  )}
                                  <p className="text-xs text-zinc-400 mt-0.5">
                                    Birim: ₺{formatPrice(item.price)} · Adet: {item.quantity}
                                  </p>
                                </div>
                                <span className="text-sm font-bold text-zinc-900 flex-shrink-0">
                                  ₺{formatPrice(item.price * item.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Sağ: Müşteri & Durum */}
                        <div className="space-y-6">
                          {/* ═══ Ödeme Onayı — kaynak: backend paymentStatus ═══ */}
                          <div>
                            <h4 className="text-sm font-semibold text-zinc-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-green-600" />
                              Ödeme
                            </h4>
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-1.5">
                              <p className="text-sm font-bold text-green-800">ÖDEME ONAYLANDI — PAYTR</p>
                              <div className="text-sm text-green-700 font-light space-y-0.5">
                                {(() => {
                                  const orderAmt = order.paytrPaymentAmount ?? order.total;
                                  const charged = order.paytrChargedTotal ?? order.paytrTotal ?? orderAmt;
                                  const cur = order.paytrCurrency ? ` ${order.paytrCurrency}` : "";
                                  return (
                                    <>
                                      <p>
                                        <span className="text-green-600">Sipariş Tutarı: </span>
                                        <span className="font-semibold">₺{formatPrice(orderAmt)}{cur}</span>
                                      </p>
                                      <p>
                                        <span className="text-green-600">Tahsil Edilen: </span>
                                        <span className="font-semibold">₺{formatPrice(charged)}{cur}</span>
                                        {Math.abs(charged - orderAmt) > 0.01 && (
                                          <span className="ml-1 text-xs text-green-600">
                                            (taksit farkı dahil)
                                          </span>
                                        )}
                                      </p>
                                    </>
                                  );
                                })()}
                                <p>
                                  <span className="text-green-600">Ödeme Tarihi: </span>
                                  <span className="font-semibold">
                                    {formatDate(order.paidAt) || order.paytrPaymentDate || "—"}
                                  </span>
                                </p>
                                {order.paytrPaymentType && (
                                  <p>
                                    <span className="text-green-600">Ödeme Yöntemi: </span>
                                    <span className="font-semibold uppercase">{order.paytrPaymentType}</span>
                                  </p>
                                )}
                                <p className="break-all">
                                  <span className="text-green-600">merchant_oid: </span>
                                  <span className="font-mono text-xs">{order.merchantOid ?? order.id}</span>
                                </p>
                              </div>
                            </div>

                            {/* Mail bildirim durumu + elle tekrar gönderme */}
                            {(() => {
                              const key = order.adminNotificationStatus ?? "pending";
                              const info = NOTIFICATION_LABELS[key] ?? NOTIFICATION_LABELS.pending;
                              const busy = resendingId === order.id;
                              return (
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                  <span className="text-xs text-zinc-500">Mail bildirimi:</span>
                                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${info.cls}`}>
                                    {info.label}
                                  </span>
                                  <button
                                    onClick={() => handleResendNotification(order.id)}
                                    disabled={busy}
                                    className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-60"
                                  >
                                    <Mail className="w-3.5 h-3.5" />
                                    {busy ? "Gönderiliyor..." : "Tekrar Gönder"}
                                  </button>
                                  {order.adminNotificationError && (
                                    <p className="basis-full text-xs text-red-600 font-light break-words">
                                      {order.adminNotificationError}
                                    </p>
                                  )}
                                </div>
                              );
                            })()}
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-zinc-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              Teslimat Bilgileri
                            </h4>
                            <div className="bg-white rounded-xl p-4 border border-zinc-100 text-sm text-zinc-600 space-y-1 font-light">
                              <p className="font-medium text-zinc-900">{customerName}</p>
                              <p>{customerEmail}</p>
                              <p>{customerPhone}</p>
                              <p>{customerAddress}</p>
                              <p>{customerDistrict}{customerDistrict && customerCity ? ", " : ""}{customerCity}</p>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-zinc-700 mb-3 uppercase tracking-wide">
                              İşlemler & Kargo Durumu
                            </h4>
                            <div className="flex flex-col gap-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => window.print()}
                                  className="px-4 py-3 bg-zinc-900 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-black transition-colors flex-1"
                                >
                                  <Printer className="w-4 h-4" />
                                  Kargo Fişi Yazdır
                                </button>

                                <button
                                  onClick={() => handleDeleteOrder(order.id)}
                                  className="p-3 text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-700 rounded-xl transition-colors print:hidden"
                                  title="Siparişi Sil"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {statusOptions.map((opt) => (
                                  <button
                                    key={opt.value}
                                    onClick={() => updateOrderStatus(order.id, opt.value)}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${fulfillment === opt.value
                                      ? statusColors[opt.value]
                                      : "bg-zinc-50 text-zinc-500 border-zinc-100 hover:bg-zinc-100"
                                      }`}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ═══ Yazdırma (Print) Şablonu ═══ */}
      <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8">
        {(() => {
          const order = orders.find((o) => o.id === expandedOrder);
          if (!order) return null;

          const customerName = order.customerInfo?.name || (order as any).customerName || "Bilinmiyor";
          const customerEmail = order.customerInfo?.email || (order as any).customerEmail || "Bilinmiyor";
          const customerPhone = order.customerInfo?.phone || (order as any).customerPhone || "Bilinmiyor";
          const customerAddress = order.customerInfo?.address || (order as any).address || "Bilinmiyor";
          const customerCity = order.customerInfo?.city || (order as any).city || "";
          const customerDistrict = order.customerInfo?.district || (order as any).district || "";

          return (
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-zinc-200 pb-8 mb-8">
                <div>
                  <h1 className="text-3xl font-black text-zinc-900 tracking-tighter">Decoroys<span className="text-blue-600">.</span></h1>
                  <p className="text-zinc-500 mt-1 text-sm">Kargo ve Sipariş Fişi</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-zinc-900 text-lg">Sipariş No: {order.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-zinc-500 text-sm">{formatDate(order.createdAt)}</p>
                </div>
              </div>

              {/* Müşteri Bilgileri */}
              <div className="mb-8">
                <h2 className="text-lg font-bold text-zinc-900 border-b border-zinc-200 pb-2 mb-4">Teslimat Bilgileri</h2>
                <div className="text-zinc-800 space-y-1">
                  <p className="font-bold text-xl mb-2">{customerName}</p>
                  {customerPhone && <p>{customerPhone}</p>}
                  {customerEmail && <p>{customerEmail}</p>}
                  <p className="mt-4 max-w-sm">{customerAddress}</p>
                  <p className="font-semibold">{customerDistrict}{customerDistrict && customerCity ? ", " : ""}{customerCity}</p>
                </div>
              </div>

              {/* Sipariş Kalemleri - Sadece ekranda görünür, kağıda basılmaz */}
              <div className="print:hidden">
                <h2 className="text-lg font-bold text-zinc-900 border-b border-zinc-200 pb-2 mb-4">Sipariş Edilen Ürünler</h2>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200">
                      <th className="py-3 font-semibold text-zinc-600">Ürün Adı</th>
                      <th className="py-3 font-semibold text-zinc-600 text-center">Adet</th>
                      <th className="py-3 font-semibold text-zinc-600 text-right">Birim Fiyat</th>
                      <th className="py-3 font-semibold text-zinc-600 text-right">Toplam</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {order.items?.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="py-4 text-zinc-900 font-medium">{item.name}</td>
                        <td className="py-4 text-zinc-600 text-center">{item.quantity}</td>
                        <td className="py-4 text-zinc-600 text-right">₺{formatPrice(item.price)}</td>
                        <td className="py-4 text-zinc-900 font-bold text-right">₺{formatPrice(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="py-6 text-right font-bold text-zinc-600 text-lg">Genel Toplam:</td>
                      <td className="py-6 text-right font-black text-zinc-900 text-xl">₺{formatPrice(order.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Footer */}
              <div className="mt-16 pt-8 border-t border-zinc-200 text-center text-zinc-500 text-sm">
                Bizi tercih ettiğiniz için teşekkür ederiz. - Decoroys
              </div>
            </div>
          );
        })()}
      </div>
    </>
  );
}
