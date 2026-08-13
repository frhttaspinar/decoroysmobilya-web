import type { ProductVariant } from "@/data/products";

/**
 * Ölçü varyantlı fiyatlandırma yardımcıları — client ve server ortak.
 *
 * GERİYE UYUMLULUK SÖZLEŞMESİ:
 *  - `variants` yoksa/boşsa ürün tek fiyatlıdır ve `price` gerçek fiyattır.
 *  - `variants` varsa gerçek fiyat SEÇİLEN varyantın fiyatıdır; `price` yalnız
 *    listeleme/taban fiyatı olarak kullanılır.
 *
 * Bu modül fiyat UYDURMAZ: yalnızca veride ne varsa onu okur.
 */

export interface VariantAware {
  price: number;
  variants?: ProductVariant[] | null;
}

/** Ürünün geçerli (fiyatı > 0 olan) varyantlarını döner. */
export function getVariants(p: VariantAware): ProductVariant[] {
  if (!Array.isArray(p.variants)) return [];
  return p.variants.filter(
    (v) => v && typeof v.size === "string" && v.size.trim() !== "" && Number(v.price) > 0
  );
}

/** Ürün ölçü seçimi gerektiriyor mu? (birden fazla geçerli varyant) */
export function requiresVariantChoice(p: VariantAware): boolean {
  return getVariants(p).length > 1;
}

/** Listeleme fiyatı: varyant varsa en düşük varyant fiyatı, yoksa `price`. */
export function displayPrice(p: VariantAware): number {
  const vs = getVariants(p);
  if (vs.length === 0) return Number(p.price) || 0;
  return Math.min(...vs.map((v) => Number(v.price)));
}

/** Listelemede "…TL'den başlayan" ifadesi gösterilmeli mi? */
export function hasPriceRange(p: VariantAware): boolean {
  const vs = getVariants(p);
  if (vs.length < 2) return false;
  const prices = vs.map((v) => Number(v.price));
  return Math.max(...prices) - Math.min(...prices) > 0.001;
}

/** Varyantı id ile bulur. */
export function findVariantById(p: VariantAware, variantId?: string | null): ProductVariant | null {
  if (!variantId) return null;
  return getVariants(p).find((v) => v.id === variantId) ?? null;
}

/** Tek varyant varsa otomatik seçilebilecek varyantı döner. */
export function soleVariant(p: VariantAware): ProductVariant | null {
  const vs = getVariants(p);
  return vs.length === 1 ? vs[0] : null;
}

/** Sepet satırı kimliği: ürün + varyant/ölçü + renk. */
export function cartLineKey(parts: {
  id: string;
  variantId?: string | null;
  size?: string | null;
  color?: string | null;
}): string {
  return [parts.id, parts.variantId ?? "", parts.size ?? "", parts.color ?? ""].join("|");
}
