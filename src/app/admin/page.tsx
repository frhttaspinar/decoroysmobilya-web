"use client";

import { useProductStore } from "@/store/useProductStore";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { TrendingUp, ShoppingBag, Box, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2 }).format(price);

interface FirestoreOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
  color?: string | null;
  size?: string | null;
}

interface FirestoreOrder {
  id: string; // Firestore doc ID
  customerName: string;
  customerEmail?: string | null;
  total: number;
  status: "beklemede" | "hazirlaniyor" | "kargoda" | "teslim-edildi" | "iptal";
  items: FirestoreOrderItem[];
  createdAt?: Timestamp | null;
  uid?: string | null;
  isGuest?: boolean;
}

export default function AdminDashboard() {
  const { products } = useProductStore();
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<FirestoreOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    setMounted(true);

    // Firestore'daki orders koleksiyonunu gerçek zamanlı dinle
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const firestoreOrders: FirestoreOrder[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<FirestoreOrder, "id">),
        }));
        setOrders(firestoreOrders);
        setLoadingOrders(false);
      },
      (err) => {
        console.error("Firestore dinleme hatası:", err);
        setLoadingOrders(false);
      }
    );

    return () => unsubscribe();
  }, []);

  if (!mounted) return null;

  const totalRevenue = orders
    .filter((o) => o.status !== "iptal")
    .reduce((acc, o) => acc + (o.total ?? 0), 0);

  const pendingOrders = orders.filter(
    (o) => o.status === "beklemede" || o.status === "hazirlaniyor"
  ).length;

  const stats = [
    {
      title: "Toplam Ciro",
      value: `₺${formatPrice(totalRevenue)}`,
      trend: "+12.5%",
      positive: true,
      icon: TrendingUp,
    },
    {
      title: "Bekleyen Siparişler",
      value: String(pendingOrders),
      trend: `${pendingOrders} aktif`,
      positive: false,
      icon: ShoppingBag,
    },
    {
      title: "Yayındaki Ürünler",
      value: String(products.length),
      trend: "Tam katalog",
      positive: true,
      icon: Box,
    },
  ];

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="w-full">
      {/* Başlık */}
      <div className="mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">Genel Bakış</h1>
        <p className="text-zinc-500 mt-2 font-light">
          Mağazanızın güncel durumunu buradan takip edebilirsiniz.
          {!loadingOrders && (
            <span className="ml-2 text-xs text-green-600 font-medium">● Canlı</span>
          )}
        </p>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white border border-zinc-100 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-5 sm:gap-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 font-medium text-sm tracking-wide uppercase">
                  {stat.title}
                </span>
                <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-end justify-between gap-3">
                <span className="text-3xl sm:text-4xl font-light text-zinc-900 tracking-tight min-w-0 truncate">
                  {loadingOrders && (idx === 0 || idx === 1) ? (
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
                  ) : (
                    stat.value
                  )}
                </span>
                <span
                  className={`text-xs sm:text-sm font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 flex-shrink-0 whitespace-nowrap ${
                    stat.positive
                      ? "text-green-600 bg-green-50"
                      : "text-amber-600 bg-amber-50"
                  }`}
                >
                  {stat.positive ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {stat.trend}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Son Siparişler */}
      <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-5 py-5 sm:px-8 sm:py-6 border-b border-zinc-100 flex items-center justify-between gap-3">
          <h2 className="font-semibold text-base sm:text-lg text-zinc-900 min-w-0 truncate">
            Son Siparişler
            {loadingOrders && <Loader2 className="inline ml-2 w-4 h-4 animate-spin text-zinc-300" />}
          </h2>
          <a
            href="/admin/siparisler"
            className="text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors flex-shrink-0 whitespace-nowrap -my-3 py-3"
          >
            Tümünü Gör →
          </a>
        </div>

        <div className="divide-y divide-zinc-50">
          {loadingOrders ? (
            /* İskelet yükleniyor */
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-5 py-4 sm:px-8 sm:py-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 animate-pulse">
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-zinc-100 rounded w-1/3" />
                  <div className="h-3 bg-zinc-50 rounded w-1/4" />
                </div>
                <div className="flex items-center justify-between gap-4 sm:contents">
                  <div className="space-y-2 text-left sm:text-right">
                    <div className="h-3.5 bg-zinc-100 rounded w-20 sm:ml-auto" />
                    <div className="h-3 bg-zinc-50 rounded w-12 sm:ml-auto" />
                  </div>
                  <div className="h-6 bg-zinc-100 rounded-full w-20 flex-shrink-0" />
                </div>
              </div>
            ))
          ) : recentOrders.length === 0 ? (
            <div className="px-8 py-12 text-center text-zinc-400 text-sm font-light">
              Henüz sipariş yok. Siparişler burada anlık görünecek.
            </div>
          ) : (
            recentOrders.map((order) => (
              <div key={order.id} className="px-5 py-4 sm:px-8 sm:py-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 hover:bg-zinc-50/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">{order.customerName}</p>
                  <p className="text-xs text-zinc-400 mt-0.5 font-mono truncate">#{order.id.slice(0, 10).toUpperCase()}</p>
                </div>
                <div className="flex items-center justify-between gap-4 sm:contents">
                  <div className="text-left sm:text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-zinc-900">₺{formatPrice(order.total)}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {order.items?.reduce((a, i) => a + i.quantity, 0) ?? 0} ürün
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; cls: string }> = {
    beklemede: { label: "Beklemede", cls: "text-amber-700 bg-amber-50 border-amber-200" },
    hazirlaniyor: { label: "Hazırlanıyor", cls: "text-blue-700 bg-blue-50 border-blue-200" },
    kargoda: { label: "Kargoda", cls: "text-purple-700 bg-purple-50 border-purple-200" },
    "teslim-edildi": { label: "Teslim Edildi", cls: "text-green-700 bg-green-50 border-green-200" },
    iptal: { label: "İptal", cls: "text-red-700 bg-red-50 border-red-200" },
  };
  const c = config[status] || config.beklemede;
  return (
    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border flex-shrink-0 whitespace-nowrap ${c.cls}`}>
      {c.label}
    </span>
  );
}
