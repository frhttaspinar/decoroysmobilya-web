import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * robots.txt — arama motoru tarama kuralları.
 *
 * Engellenenler yalnızca indekslenmemesi gereken işlevsel alanlardır:
 * yönetim paneli, ödeme akışı, kullanıcı profili ve API uçları.
 * Ürün/kategori/blog/kurumsal sayfaları tamamen serbesttir.
 *
 * Googlebot için ayrı/gevşek bir kural TANIMLANMAZ — tüm istemciler
 * aynı kuralları görür.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/odeme", "/profil"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
