/**
 * Ürün alan okuyucuları — client ve server ortak.
 *
 * VERİ MODELİ: 1 ÜRÜN = 1 FİYAT + 1 ÖLÇÜ + 1 RENK.
 * Farklı ölçü veya renk satılacaksa admin AYRI bir ürün oluşturur.
 *
 *   Fiyat  → YALNIZ product.price
 *   Ölçü   → YALNIZ product.size
 *   Renk   → YALNIZ product.color
 *
 * `features` bir ölçü kaynağı DEĞİLDİR; genel ürün özelliğidir
 * (Dolaplı, MDF, Duvara Monte...). `features.find(f => f.includes("cm"))`
 * benzeri ölçü çıkarma hack'i KULLANILMAZ.
 *
 * Legacy `variants` ve `colors` alanları eski dokümanlarda durabilir ama
 * mağaza iş kuralına GİRMEZ: okunmazlar. Ölçü/renk boşsa UYDURULMAZ —
 * admin panelinden girilene kadar boş kalır ve ilgili satır gizlenir.
 */

export interface ProductFields {
  size?: string | null;
  color?: string | null;
}

/** Boş/boşluk-only değerleri null'a indirger. */
const clean = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed === "" ? null : trimmed;
};

/** Ürünün tek ölçüsü. Tanımlı değilse null (tahmin edilmez). */
export function productSize(p: ProductFields): string | null {
  return clean(p.size);
}

/** Ürünün tek rengi. Tanımlı değilse null (tahmin edilmez). */
export function productColor(p: ProductFields): string | null {
  return clean(p.color);
}

/**
 * Sepet satırı kimliği: ürün + ölçü + renk.
 *
 * Artık her ürün tek ölçü/renk taşıdığı için pratikte `id` belirleyicidir;
 * ölçü ve renk, ürün sepetteyken admin tarafından değiştirilirse eski ve
 * yeni satırların birbirine karışmaması için kimliğe dahil edilir.
 */
export function cartLineKey(parts: {
  id: string;
  size?: string | null;
  color?: string | null;
}): string {
  return [parts.id, parts.size ?? "", parts.color ?? ""].join("|");
}
