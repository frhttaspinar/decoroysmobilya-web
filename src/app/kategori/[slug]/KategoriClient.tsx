"use client";

import { Product } from "@/data/products";
import { productSize, productColor } from "@/lib/product-pricing";
import { useProductStore } from "@/store/useProductStore";
import { useCartStore } from "@/store/useCartStore";
import { useDrawerStore } from "@/store/useDrawerStore";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2 }).format(price);

interface Props {
  slug: string;
  categoryName: string;
}

export default function KategoriClient({ slug: _slug, categoryName }: Props) {
  const { products, loading } = useProductStore();
  const { addItem } = useCartStore();
  const { openDrawer } = useDrawerStore();

  const filtered = products.filter(
    (p) => p.category.toLowerCase() === categoryName.toLowerCase()
  );

  // Her ürün tek fiyat + tek ölçü + tek renk taşır; seçim gerekmez.
  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.images[0],
      color: productColor(product) ?? undefined,
      size: productSize(product) ?? undefined,
      stockCode: product.stockCode,
    });
    openDrawer("cart");
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-10">
        <nav className="flex items-center gap-2 text-xs text-zinc-400 mb-6 font-light">
          <Link href="/" className="hover:text-zinc-600 transition-colors">Ana Sayfa</Link>
          <span>/</span>
          <Link href="/urunler" className="hover:text-zinc-600 transition-colors">Tüm Ürünler</Link>
          <span>/</span>
          <span className="text-zinc-600">{categoryName}</span>
        </nav>

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900">
          {categoryName}
        </h1>
        <p className="mt-4 text-lg text-zinc-500 font-light max-w-2xl">
          Decoroys {categoryName} koleksiyonunu keşfedin. Her biri özenle
          tasarlanmış, modern yaşam alanlarınız için.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <span className="text-sm text-zinc-400 font-light">
            {loading ? "Yükleniyor..." : `${filtered.length} ürün listeleniyor`}
          </span>
        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-white border border-zinc-100 animate-pulse">
                <div className="aspect-square w-full bg-zinc-100" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-zinc-100 rounded w-1/2" />
                  <div className="h-4 bg-zinc-200 rounded w-3/4" />
                  <div className="h-5 bg-zinc-200 rounded w-1/3 mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center">
              <ShoppingBag className="w-7 h-7 text-zinc-400" />
            </div>
            <p className="text-lg font-medium text-zinc-500">
              Bu kategoride henüz ürün bulunmuyor.
            </p>
            <Link
              href="/urunler"
              className="mt-2 text-sm text-zinc-400 underline underline-offset-4 hover:text-zinc-900 transition-colors"
            >
              Tüm ürünlere göz at
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filtered.map((product) => (
              <Link
                href={`/urun/${product.id}`}
                key={product.id}
                className="group flex flex-col rounded-2xl overflow-hidden bg-white border border-zinc-100 hover:border-zinc-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-2"
              >
                <div className="aspect-square w-full bg-zinc-50 overflow-hidden relative">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <button
                    onClick={(e) => handleAddToCart(product, e)}
                    className="absolute bottom-4 left-4 right-4 bg-zinc-900/90 backdrop-blur-sm text-white py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-zinc-800"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Sepete Ekle
                  </button>
                </div>

                <div className="p-5 flex flex-col gap-2 flex-1">
                  <span className="text-[11px] uppercase tracking-widest text-zinc-400 font-medium">
                    {product.category}
                  </span>
                  <h3 className="text-sm font-medium text-zinc-900 leading-snug line-clamp-2">
                    {product.name}
                  </h3>
                  <span className="text-[11px] text-blue-500 font-semibold tracking-wide">
                    Sınırlı Koleksiyon
                  </span>
                  <p className="text-xs text-zinc-500 font-light line-clamp-2 mt-0.5">
                    {product.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {product.features.slice(0, 2).map((feature) => (
                      <span
                        key={feature}
                        className="text-[10px] bg-zinc-50 text-zinc-500 px-2.5 py-1 rounded-full border border-zinc-100"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto pt-4 border-t border-zinc-50">
                    <span className="text-base font-bold text-zinc-900">
                      {formatPrice(product.price)} ₺
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
