"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Search, Eye, Tag, Plus, X, Upload, CheckCircle2, Pencil, Trash2, Star, ImagePlus } from "lucide-react";
import Image from "next/image";
import { db, storage } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { products as staticProducts } from "@/data/products";

export type Product = {
  id: string;
  name: string;
  price: number;
  images: string[];
  category: string;
  description: string;
  features: string[];
  colors: string[];
  featured: boolean;
  stockCode?: string;
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2 }).format(price);

type FormData = {
  name: string;
  price: string;
  stockCode: string;
  description: string;
  category: string;
  features: string;
  colors: string;
};

const emptyForm: FormData = {
  name: "",
  price: "",
  stockCode: "",
  description: "",
  category: "TV Üniteleri",
  features: "",
  colors: "",
};

const MAX_IMAGES = 3;

export default function AdminUrunlerPage() {
  const [products, setProducts]     = useState<Product[]>([]);
  const [loading, setLoading]       = useState(true);
  const [searchQuery, setSearchQuery]       = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tümü");

  // Modal states
  const [isFormOpen, setIsFormOpen]       = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [detailProduct, setDetailProduct]   = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm]   = useState<string | null>(null);

  // Toast
  const [toastMsg, setToastMsg]   = useState("");
  const [toastType, setToastType] = useState<"success" | "warning">("success");
  const [showToast, setShowToast] = useState(false);

  // Form
  const [formData, setFormData]     = useState<FormData>(emptyForm);
  const [dragActive, setDragActive] = useState(false);

  // ── Çoklu görsel state ──────────────────────────────────────
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls]     = useState<string[]>([]);
  const previewUrlsRef = useRef<string[]>([]);
  // previewUrlsRef her zaman güncel listeyi tutar (URL revoke için)
  useEffect(() => { previewUrlsRef.current = previewUrls; }, [previewUrls]);
  // ────────────────────────────────────────────────────────────

  const [isSeeding, setIsSeeding] = useState(false);
  const [mounted, setMounted]     = useState(false);

  useEffect(() => {
    setMounted(true);
    const unsubscribe = onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        setProducts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Product[]);
        setLoading(false);
      },
      (error) => { console.error("Firestore okuma hatası:", error); setLoading(false); }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  useEffect(() => {
    document.body.style.overflow = (isFormOpen || !!detailProduct) ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isFormOpen, detailProduct]);

  const categories = useMemo(
    () => ["Tümü", ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "Tümü" || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, products]);

  const fireToast = (msg: string, type: "success" | "warning" = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setShowToast(true);
  };

  // Revoke mevcut preview URL'lerini temizle (memory leak önlemi)
  const revokeAllPreviews = useCallback(() => {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const resetAndCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingProduct(null);
    setFormData(emptyForm);
    setUploadedFiles([]);
    revokeAllPreviews();
    setPreviewUrls([]);
  }, [revokeAllPreviews]);

  const openAddForm = () => {
    setEditingProduct(null);
    const nums = products
      .map((p) => parseInt(p.stockCode || ""))
      .filter((n) => !isNaN(n) && n > 0);
    const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : products.length + 1;
    setFormData({ ...emptyForm, stockCode: String(nextNum) });
    setUploadedFiles([]);
    revokeAllPreviews();
    setPreviewUrls([]);
    setIsFormOpen(true);
  };

  const openEditForm = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name:        product.name,
      price:       String(product.price),
      stockCode:   product.stockCode || product.id,
      description: product.description,
      category:    product.category,
      features:    product.features?.join(", ") || "",
      colors:      product.colors?.join(", ")   || "",
    });
    setUploadedFiles([]);
    revokeAllPreviews();
    setPreviewUrls([]);
    setDetailProduct(null);
    setIsFormOpen(true);
  };

  // ── Dosya işleme yardımcıları ────────────────────────────────
  const handleFiles = useCallback(
    (incoming: File[]) => {
      const imageFiles = incoming.filter((f) => f.type.startsWith("image/"));
      const merged = [...uploadedFiles, ...imageFiles];

      if (merged.length > MAX_IMAGES) {
        fireToast(`En fazla ${MAX_IMAGES} görsel yükleyebilirsiniz. İlk ${MAX_IMAGES} seçildi.`, "warning");
      }

      const limited = merged.slice(0, MAX_IMAGES);

      // Eski URL'leri temizle
      previewUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));

      setUploadedFiles(limited);
      const urls = limited.map((f) => URL.createObjectURL(f));
      setPreviewUrls(urls);
      previewUrlsRef.current = urls;
    },
    [uploadedFiles]
  );

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    const newUrls  = previewUrls.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    setPreviewUrls(newUrls);
    previewUrlsRef.current = newUrls;
  };
  // ────────────────────────────────────────────────────────────

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const featuresArr = formData.features.split(",").map((f) => f.trim()).filter(Boolean);
    const colorsArr   = formData.colors.split(",").map((c) => c.trim()).filter(Boolean);

    // ── Çoklu görsel yükleme (Promise.all) ──────────────────
    let imageUrls: string[] = [];

    if (uploadedFiles.length > 0) {
      try {
        const uploadTasks = uploadedFiles.map((file) => {
          const storageRef = ref(
            storage,
            `products/${Date.now()}_${Math.random().toString(36).slice(2)}_${file.name}`
          );
          return uploadBytes(storageRef, file).then((snap) => getDownloadURL(snap.ref));
        });
        imageUrls = await Promise.all(uploadTasks);
      } catch (uploadError) {
        console.error("Görsel yüklenemedi:", uploadError);
        fireToast("Görseller yüklenirken hata oluştu.", "warning");
        return;
      }
    }
    // ────────────────────────────────────────────────────────

    if (editingProduct) {
      try {
        const updateData: Record<string, unknown> = {
          name:        formData.name,
          price:       Number(formData.price),
          description: formData.description,
          category:    formData.category,
          features:    featuresArr.length > 0 ? featuresArr : editingProduct.features,
          colors:      colorsArr.length   > 0 ? colorsArr   : editingProduct.colors,
        };
        // Yeni görsel seçildiyse güncelle, seçilmediyse mevcut kalsın
        if (imageUrls.length > 0) updateData.images = imageUrls;

        await updateDoc(doc(db, "products", editingProduct.id), updateData);
        fireToast("Ürün başarıyla güncellendi");
      } catch (error) {
        console.error("Ürün güncellenemedi:", error);
        fireToast("Ürün güncellenirken hata oluştu.", "warning");
      }
    } else {
      const newProduct = {
        stockCode:   formData.stockCode,
        name:        formData.name,
        price:       Number(formData.price),
        images:      imageUrls.length > 0 ? imageUrls : [],
        category:    formData.category,
        description: formData.description || "Henüz açıklama eklenmedi.",
        features:    featuresArr.length > 0 ? featuresArr : ["Yeni Ürün"],
        colors:      colorsArr.length   > 0 ? colorsArr   : ["Standart"],
        featured:    false,
      };
      try {
        await addDoc(collection(db, "products"), newProduct);
        fireToast("Ürün başarıyla eklendi");
      } catch (error) {
        console.error("Ürün eklenemedi:", error);
        fireToast("Ürün eklenirken hata oluştu.", "warning");
      }
    }

    resetAndCloseForm();
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "products", id));
      setDeleteConfirm(null);
      setDetailProduct(null);
      fireToast("Ürün silindi");
    } catch (error) {
      console.error("Ürün silinemedi:", error);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(Array.from(e.target.files ?? []));
    e.target.value = ""; // Aynı dosyayı tekrar seçebilmek için input'u sıfırla
  };

  const featuredProducts = products.filter((p) => p.featured);

  const handleToggleFeatured = async (product: Product) => {
    if (!product.featured && featuredProducts.length >= 4) {
      fireToast("Öne çıkan alanda en fazla 4 ürün olabilir.", "warning");
      return;
    }
    try {
      await updateDoc(doc(db, "products", product.id), { featured: !product.featured });
    } catch (err) {
      console.error("Featured güncelleme hatası:", err);
    }
  };

  const handleSeedProducts = async () => {
    const snap = await getDocs(collection(db, "products"));
    if (!snap.empty) {
      fireToast("Firebase'de zaten ürün var, yükleme atlandı.", "warning");
      return;
    }
    setIsSeeding(true);
    try {
      for (const p of staticProducts) {
        const { id: _id, ...rest } = p;
        await addDoc(collection(db, "products"), rest);
      }
      fireToast(`${staticProducts.length} ürün Firebase'e yüklendi!`);
    } catch (err) {
      console.error("Seed hatası:", err);
    } finally {
      setIsSeeding(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="w-full relative">

      {/* ═══ Toast ═══ */}
      <div
        className={`fixed top-4 left-4 right-4 sm:top-6 sm:left-auto sm:right-6 sm:max-w-sm z-[200] flex items-center gap-3 border shadow-xl rounded-2xl px-5 py-4 sm:px-6 transition-all duration-500 ${
          showToast ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"
        } ${
          toastType === "warning"
            ? "bg-amber-50 border-amber-200"
            : "bg-white border-green-200"
        }`}
      >
        <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${toastType === "warning" ? "text-amber-500" : "text-green-500"}`} />
        <span className="text-sm font-medium text-zinc-900 min-w-0">{toastMsg}</span>
      </div>

      {/* ═══ Başlık ═══ */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">Ürün Yönetimi</h1>
          <p className="text-zinc-500 mt-2 font-light">
            Mağazanızdaki {products.length} ürünü buradan yönetebilirsiniz.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto self-start md:self-auto flex-wrap">
          {!loading && products.length === 0 && (
            <button
              onClick={handleSeedProducts}
              disabled={isSeeding}
              className="flex flex-1 md:flex-none items-center justify-center gap-2 bg-blue-600 text-white px-5 sm:px-6 py-3.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-200 shadow-md disabled:opacity-60"
            >
              <Upload className="w-4 h-4 flex-shrink-0" />
              {isSeeding ? "Yükleniyor..." : "Varsayılan Ürünleri Yükle"}
            </button>
          )}
          <button
            onClick={openAddForm}
            className="flex flex-1 md:flex-none items-center justify-center gap-2 bg-zinc-900 text-white px-5 sm:px-6 py-3.5 rounded-xl font-semibold text-sm hover:bg-black transition-colors focus:outline-none focus:ring-4 focus:ring-zinc-300 shadow-md"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            Yeni Ürün Ekle
          </button>
        </div>
      </div>

      {/* ═══ Filtreler ═══ */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative w-full md:flex-1 md:max-w-md">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          {/* text-base: iOS Safari'nin 16px altı inputlarda otomatik zoom yapmasını önler */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ürün adı veya ID ile ara..."
            className="w-full bg-zinc-50 border border-zinc-100 outline-none focus:ring-2 focus:ring-blue-200 pl-11 pr-4 py-3 rounded-xl text-base lg:text-sm text-zinc-900 transition-all placeholder:text-zinc-400"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                selectedCategory === cat
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100 border border-zinc-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-zinc-400 mb-4 font-light">
        {filteredProducts.length} ürün gösteriliyor
      </p>

      {/* ═══ Öne Çıkan Ürünler Paneli ═══ */}
      <div className="mb-8 bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />
            <h2 className="text-xs sm:text-sm font-bold text-amber-900 uppercase tracking-wider truncate">Öne Çıkan Ürünler</h2>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ${featuredProducts.length >= 4 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
            {featuredProducts.length} / 4
          </span>
        </div>
        {featuredProducts.length === 0 ? (
          <p className="text-sm text-amber-600 font-light">Henüz öne çıkan ürün yok. Tablodan ★ butonuna tıklayarak ekleyin.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {featuredProducts.map((p) => (
              <div key={p.id} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-amber-200 shadow-sm">
                <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 relative bg-zinc-100">
                  <Image src={p.images?.[0] || "/zenna.png"} alt={p.name} fill className="object-cover" />
                </div>
                <span className="text-xs font-medium text-zinc-800 truncate">{p.name}</span>
                <button
                  onClick={() => handleToggleFeatured(p)}
                  className="ml-auto -mr-1.5 flex-shrink-0 p-2.5 rounded-lg text-amber-400 hover:text-red-400 hover:bg-red-50 transition-colors"
                  title="Öne çıkandan kaldır"
                  aria-label={`${p.name} ürününü öne çıkandan kaldır`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {Array.from({ length: 4 - featuredProducts.length }).map((_, i) => (
              <div key={`empty-${i}`} className="flex items-center justify-center h-12 rounded-xl border-2 border-dashed border-amber-200">
                <span className="text-xs text-amber-300">Boş slot</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ Ürün Listesi — mobilde kart, md+ tablo ═══ */}

      {/* Dokunmatik kart görünümü (< lg) — tablette 2 kolon */}
      <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-zinc-100 rounded-2xl shadow-sm p-4 flex gap-4 animate-pulse">
              <div className="w-16 h-16 rounded-xl bg-zinc-100 flex-shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-4 bg-zinc-200 rounded w-3/4" />
                <div className="h-3 bg-zinc-100 rounded w-1/3" />
                <div className="h-6 bg-zinc-50 rounded-full w-1/2" />
              </div>
            </div>
          ))
        ) : products.length === 0 ? (
          <div className="md:col-span-2 bg-white border border-zinc-100 rounded-2xl shadow-sm px-5 py-12 text-center">
            <p className="text-zinc-400 font-light mb-4">Firebase&apos;de henüz ürün yok.</p>
            <button
              onClick={handleSeedProducts}
              disabled={isSeeding}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              <Upload className="w-4 h-4" />
              {isSeeding ? "Yükleniyor..." : "Varsayılan Ürünleri Yükle"}
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="md:col-span-2 bg-white border border-zinc-100 rounded-2xl shadow-sm px-5 py-12 text-center text-sm text-zinc-400 font-light">
            Bu filtreyle eşleşen ürün bulunamadı.
          </div>
        ) : (
          filteredProducts.map((product) => (
            <article key={product.id} className="bg-white border border-zinc-100 rounded-2xl shadow-sm p-4">
              <div className="flex gap-4">
                <div className="relative w-16 h-16 flex-shrink-0">
                  <div className="w-16 h-16 rounded-xl bg-zinc-100 overflow-hidden relative">
                    <Image src={product.images?.[0] || "/zenna.png"} alt={product.name} fill sizes="64px" className="object-cover" />
                  </div>
                  {(product.images?.length ?? 0) > 1 && (
                    <span className="absolute -bottom-1 -right-1 text-[9px] font-bold bg-zinc-900 text-white rounded-full w-4 h-4 flex items-center justify-center">
                      {product.images.length}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-900 leading-snug break-words">{product.name}</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5 font-mono truncate">{product.stockCode || product.id}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-[11px] bg-zinc-50 text-zinc-600 px-2.5 py-1 rounded-full border border-zinc-100 font-medium">
                      {product.category}
                    </span>
                    <span className="text-sm font-bold text-zinc-900">₺{formatPrice(product.price)}</span>
                    {product.featured && (
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        Öne Çıkan
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Aksiyonlar — dokunma alanları min 44px */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-50">
                <button
                  onClick={() => setDetailProduct(product)}
                  className="flex-1 min-w-0 h-11 rounded-xl text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-4 h-4 flex-shrink-0" />
                  Detay
                </button>
                <button
                  onClick={() => openEditForm(product)}
                  className="flex-1 min-w-0 h-11 rounded-xl text-[11px] font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Pencil className="w-4 h-4 flex-shrink-0" />
                  Düzenle
                </button>
                <button
                  onClick={() => handleToggleFeatured(product)}
                  aria-label={product.featured ? "Öne çıkandan kaldır" : "Öne çıkan yap"}
                  className={`w-11 h-11 flex-shrink-0 rounded-xl flex items-center justify-center transition-colors ${
                    product.featured
                      ? "text-amber-500 bg-amber-50 hover:bg-amber-100"
                      : "text-zinc-400 bg-zinc-50 hover:text-amber-500 hover:bg-amber-50"
                  }`}
                >
                  <Star className={`w-4 h-4 ${product.featured ? "fill-amber-500" : ""}`} />
                </button>
                <button
                  onClick={() => setDeleteConfirm(product.id)}
                  aria-label="Ürünü sil"
                  className="w-11 h-11 flex-shrink-0 rounded-xl flex items-center justify-center text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Masaüstü tablo (lg+) — taşma olursa yalnız tablo container'ı kayar */}
      <div className="hidden lg:block bg-white border border-zinc-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-zinc-100 text-left">
              <th className="px-6 py-5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Ürün</th>
              <th className="px-6 py-5 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">Kategori</th>
              <th className="px-6 py-5 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden xl:table-cell">Özellikler</th>
              <th className="px-6 py-5 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Fiyat</th>
              <th className="px-6 py-5 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-center hidden md:table-cell">Öne Çıkan</th>
              <th className="px-6 py-5 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-center">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-zinc-100" />
                      <div className="space-y-2">
                        <div className="h-4 bg-zinc-200 rounded w-24" />
                        <div className="h-3 bg-zinc-100 rounded w-16" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell"><div className="h-6 bg-zinc-100 rounded-full w-20" /></td>
                  <td className="px-6 py-4 hidden xl:table-cell"><div className="flex gap-1.5"><div className="w-12 h-5 bg-zinc-100 rounded-full" /><div className="w-12 h-5 bg-zinc-100 rounded-full" /></div></td>
                  <td className="px-6 py-4 text-right"><div className="h-5 bg-zinc-200 rounded w-16 ml-auto" /></td>
                  <td className="px-6 py-4"><div className="flex items-center justify-center gap-2"><div className="w-8 h-8 bg-zinc-100 rounded-lg" /><div className="w-8 h-8 bg-zinc-100 rounded-lg" /><div className="w-8 h-8 bg-zinc-100 rounded-lg" /></div></td>
                </tr>
              ))
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center">
                  <p className="text-zinc-400 font-light mb-4">Firebase&apos;de henüz ürün yok.</p>
                  <button
                    onClick={handleSeedProducts}
                    disabled={isSeeding}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-60"
                  >
                    <Upload className="w-4 h-4" />
                    {isSeeding ? "Yükleniyor..." : "Varsayılan Ürünleri Firebase'e Yükle"}
                  </button>
                </td>
              </tr>
            ) : filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-zinc-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    {/* Ürün küçük resmi — birden fazla görsel varsa sağda "+" badge */}
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-zinc-100 overflow-hidden relative">
                        <Image src={product.images?.[0] || "/zenna.png"} alt={product.name} fill className="object-cover" />
                      </div>
                      {(product.images?.length ?? 0) > 1 && (
                        <span className="absolute -bottom-1 -right-1 text-[9px] font-bold bg-zinc-900 text-white rounded-full w-4 h-4 flex items-center justify-center">
                          {product.images.length}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">{product.name}</p>
                      <p className="text-xs text-zinc-400 mt-0.5 font-mono">{product.stockCode || product.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <span className="text-xs bg-zinc-50 text-zinc-600 px-3 py-1.5 rounded-full border border-zinc-100 font-medium">
                    {product.category}
                  </span>
                </td>
                <td className="px-6 py-4 hidden xl:table-cell">
                  <div className="flex gap-1.5 flex-wrap">
                    {product.features?.slice(0, 2).map((f) => (
                      <span key={f} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">{f}</span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm font-bold text-zinc-900">₺{formatPrice(product.price)}</span>
                </td>
                <td className="px-6 py-4 text-center hidden md:table-cell">
                  <button
                    onClick={() => handleToggleFeatured(product)}
                    title={product.featured ? "Öne çıkandan kaldır" : featuredProducts.length >= 4 ? "Maksimum 4 ürün" : "Öne çıkan yap"}
                    className={`p-1.5 rounded-lg transition-all ${
                      product.featured
                        ? "text-amber-500 hover:text-amber-600 bg-amber-50 hover:bg-amber-100"
                        : "text-zinc-300 hover:text-amber-400 hover:bg-amber-50"
                    }`}
                  >
                    <Star className={`w-4 h-4 ${product.featured ? "fill-amber-500" : ""}`} />
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => setDetailProduct(product)} className="text-xs text-blue-600 font-medium hover:text-blue-700 transition-colors px-2 py-1.5 rounded-lg hover:bg-blue-50">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => openEditForm(product)} className="text-xs text-amber-600 font-medium hover:text-amber-700 transition-colors px-2 py-1.5 rounded-lg hover:bg-amber-50">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteConfirm(product.id)} className="text-xs text-red-500 font-medium hover:text-red-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* ═══ Silme Onay Modalı ═══ */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-sm max-h-[90vh] overflow-y-auto text-center space-y-4">
            <Trash2 className="w-10 h-10 text-red-400 mx-auto" />
            <h3 className="text-base sm:text-lg font-bold text-zinc-900">Ürünü Silmek İstediğinize Emin Misiniz?</h3>
            <p className="text-sm text-zinc-500 font-light">Bu işlem geri alınamaz.</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3.5 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-50 border border-zinc-200 transition-colors">
                Vazgeç
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-3.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors">
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Detay Modalı ═══ */}
      {detailProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDetailProduct(null)} />
          <div className="relative bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl">
            {/* Kapatma — modal kaydırılsa bile erişilebilir kalsın diye sabit köşede */}
            <button
              onClick={() => setDetailProduct(null)}
              aria-label="Kapat"
              className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            {/* Görsel carousel — birden fazla resim varsa yan yana scroll */}
            <div className="flex overflow-x-auto gap-0 snap-x snap-mandatory rounded-t-3xl">
              {(detailProduct.images?.length > 0 ? detailProduct.images : ["/zenna.png"]).map((src, i) => (
                <div key={i} className="relative w-full flex-shrink-0 h-56 sm:h-64 bg-zinc-100 snap-start">
                  <Image src={src} alt={`${detailProduct.name} ${i + 1}`} fill className="object-cover" />
                  {detailProduct.images?.length > 1 && (
                    <span className="absolute bottom-3 right-3 text-[10px] font-bold bg-black/50 text-white px-2 py-0.5 rounded-full">
                      {i + 1} / {detailProduct.images.length}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="p-5 sm:p-8 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-zinc-900 break-words">{detailProduct.name}</h2>
                  <p className="text-xs text-zinc-400 font-mono mt-1 truncate">{detailProduct.stockCode || detailProduct.id}</p>
                </div>
                <span className="text-lg font-bold text-zinc-900 flex-shrink-0 whitespace-nowrap">₺{formatPrice(detailProduct.price)}</span>
              </div>
              <p className="text-sm text-zinc-500 font-light leading-relaxed">{detailProduct.description}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                {detailProduct.features?.map((f) => (
                  <span key={f} className="text-xs bg-zinc-50 text-zinc-600 px-3 py-1.5 rounded-full border border-zinc-100 font-medium flex items-center gap-1.5">
                    <Tag className="w-3 h-3" />{f}
                  </span>
                ))}
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => openEditForm(detailProduct)} className="flex-1 min-w-0 bg-zinc-900 text-white py-3.5 rounded-xl font-medium text-sm hover:bg-black transition-colors flex items-center justify-center gap-2">
                  <Pencil className="w-4 h-4 flex-shrink-0" />
                  Düzenle
                </button>
                <button onClick={() => setDetailProduct(null)} className="px-5 sm:px-6 py-3.5 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-50 border border-zinc-200 transition-colors flex-shrink-0">
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Ekle / Düzenle Drawer ═══ */}
      <div
        className={`fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isFormOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={resetAndCloseForm}
      />
      <div
        className={`fixed top-0 right-0 bottom-0 z-[160] w-full max-w-[520px] bg-white shadow-2xl flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isFormOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 sm:px-8 sm:py-6 border-b border-zinc-100 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight truncate min-w-0">
            {editingProduct ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}
          </h2>
          <button
            onClick={resetAndCloseForm}
            aria-label="Kapat"
            className="w-11 h-11 flex-shrink-0 rounded-full hover:bg-zinc-100 flex items-center justify-center text-zinc-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="product-form" onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8 space-y-6">

          {/* ── Çoklu Görsel Yükleme ─────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-zinc-700">
                Ürün Görselleri
              </label>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                uploadedFiles.length >= MAX_IMAGES
                  ? "bg-red-100 text-red-600"
                  : "bg-zinc-100 text-zinc-500"
              }`}>
                {uploadedFiles.length} / {MAX_IMAGES}
              </span>
            </div>

            {/* Düzenleme modunda mevcut görseller (yeni seçim yoksa göster) */}
            {editingProduct && (editingProduct.images?.length ?? 0) > 0 && uploadedFiles.length === 0 && (
              <div className="mb-4">
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold mb-2">
                  Mevcut Görseller
                </p>
                <div className="flex gap-2 flex-wrap">
                  {editingProduct.images.map((url, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100">
                      <Image src={url} alt={`Görsel ${i + 1}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-400 mt-2">
                  Yeni görsel yüklerseniz mevcut görseller değiştirilir.
                </p>
              </div>
            )}

            {/* Seçilen yeni görsellerin önizlemesi */}
            {previewUrls.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-3">
                {previewUrls.map((url, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-blue-200 bg-zinc-100 group">
                    <Image src={url} alt={`Yeni ${i + 1}`} fill className="object-cover" />
                    {/* Kaldır butonu */}
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                    <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-black/50 text-white px-1 rounded">
                      {i + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Drop zone — slot dolmamışsa göster */}
            {uploadedFiles.length < MAX_IMAGES && (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative w-full h-36 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                  dragActive
                    ? "border-blue-400 bg-blue-50/50"
                    : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-zinc-100/50"
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <ImagePlus className={`w-6 h-6 ${dragActive ? "text-blue-500" : "text-zinc-400"}`} />
                <span className="text-sm text-zinc-500 font-medium">
                  {uploadedFiles.length === 0 ? "Görsel Sürükle veya Seç" : "Daha fazla görsel ekle"}
                </span>
                <span className="text-xs text-zinc-400">
                  PNG, JPG, WEBP — Maks {MAX_IMAGES - uploadedFiles.length} görsel daha
                </span>
              </div>
            )}
          </div>
          {/* ─────────────────────────────────────────────────────── */}

          {/* Ürün Adı */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Ürün Adı</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Decoroys Premium TV Ünitesi"
              className="w-full bg-zinc-50 border border-zinc-100 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 px-5 py-4 rounded-xl text-zinc-900 transition-all placeholder:text-zinc-400"
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Kategori</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-zinc-50 border border-zinc-100 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 px-5 py-4 rounded-xl text-zinc-900 transition-all appearance-none cursor-pointer"
            >
              <option value="TV Üniteleri">Tv Üniteleri</option>
              <option value="Kahve Dolapları">Kahve Dolapları</option>
              <option value="Tv Panelleri">Tv Panelleri</option>
            </select>
          </div>

          {/* Fiyat & Stok Kodu — dar ekranda tek kolon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">Fiyat (₺)</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="9200"
                className="w-full bg-zinc-50 border border-zinc-100 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 px-5 py-4 rounded-xl text-zinc-900 transition-all placeholder:text-zinc-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">Stok No</label>
              <div className="w-full bg-zinc-100 border border-zinc-200 px-5 py-4 rounded-xl text-zinc-500 text-sm font-mono select-all">
                #{formData.stockCode}
              </div>
            </div>
          </div>

          {/* Özellikler */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Özellikler <span className="text-zinc-400 font-light">(virgülle ayırın)</span>
            </label>
            <input
              type="text"
              value={formData.features}
              onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              placeholder="200x45 cm, Mat Yüzey, Geniş Depolama"
              className="w-full bg-zinc-50 border border-zinc-100 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 px-5 py-4 rounded-xl text-zinc-900 transition-all placeholder:text-zinc-400"
            />
          </div>

          {/* Renkler */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Renkler <span className="text-zinc-400 font-light">(virgülle ayırın)</span>
            </label>
            <input
              type="text"
              value={formData.colors}
              onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
              placeholder="Premium Siyah, Doğal Ahşap"
              className="w-full bg-zinc-50 border border-zinc-100 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 px-5 py-4 rounded-xl text-zinc-900 transition-all placeholder:text-zinc-400"
            />
          </div>

          {/* Açıklama */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Ürün Açıklaması</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Modern yaşam alanları için tasarlanmış premium TV ünitesi..."
              className="w-full bg-zinc-50 border border-zinc-100 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 px-5 py-4 rounded-xl text-zinc-900 transition-all placeholder:text-zinc-400 resize-none"
            />
          </div>
        </form>

        <div className="px-5 py-4 sm:px-8 sm:py-6 border-t border-zinc-100 flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <button
            type="button"
            onClick={resetAndCloseForm}
            className="px-4 sm:px-6 py-4 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors flex-shrink-0"
          >
            Vazgeç
          </button>
          <button
            type="submit"
            form="product-form"
            className="flex-1 min-w-0 bg-zinc-900 text-white py-4 rounded-xl font-semibold text-sm sm:text-base hover:bg-black transition-colors focus:outline-none focus:ring-4 focus:ring-zinc-300 shadow-md"
          >
            {editingProduct ? "Değişiklikleri Kaydet" : "Ürünü Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}
