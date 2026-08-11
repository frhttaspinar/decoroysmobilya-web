import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * sitemap.xml — yalnızca indekslenmesi gereken, canonical ve 200 dönen sayfalar.
 *
 * Kapsam DIŞI (bilinçli):
 *  - /admin, /odeme, /profil, /api  → robots.txt ile de engelli
 *  - /urun/[id]                     → ürün listesi Firestore'dan client tarafında
 *                                     geliyor; build anında güvenilir biçimde
 *                                     numaralandırılamadığı için sitemap'e
 *                                     404 riski taşıyan URL eklenmiyor.
 *  - eski /index.php URL'leri       → kalıcı yönlendirme hedefleri zaten burada
 *
 * Blog slug'ları src/app/blog/[slug]/page.tsx içindeki `posts` dizisiyle,
 * kategori slug'ları src/app/kategori/[slug]/page.tsx içindeki
 * SLUG_TO_CATEGORY haritasıyla birebir aynı olmalıdır.
 */

const BLOG_POSTS: { slug: string; lastModified: string }[] = [
  {
    slug: "minimalist-salonlar-icin-ideal-tv-unitesi-secimi",
    lastModified: "2026-07-02T09:00:00+03:00",
  },
  {
    slug: "kablolara-veda-akilli-depolama-cozumleriyle-sikligi-yakalayin",
    lastModified: "2026-06-20T09:00:00+03:00",
  },
  {
    slug: "modern-mobilyalarda-renk-uyumu-ve-dekorasyon-sirlari",
    lastModified: "2026-06-05T09:00:00+03:00",
  },
];

const CATEGORY_SLUGS = ["tv-uniteleri", "kahve-dolaplari", "tv-panelleri"];

const CORPORATE_SLUGS = [
  "iletisim",
  "teslimat-bilgileri",
  "iptal-ve-iade-kosullari",
  "mesafeli-satis-sozlesmesi",
  "gizlilik-politikasi",
  "kvkk-bilgilendirme",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/urunler`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...CATEGORY_SLUGS.map((slug) => ({
      url: `${SITE_URL}/kategori/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    {
      url: `${SITE_URL}/blog`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    ...BLOG_POSTS.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.lastModified),
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),
    ...CORPORATE_SLUGS.map((slug) => ({
      url: `${SITE_URL}/kurumsal/${slug}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: slug === "iletisim" ? 0.5 : 0.3,
    })),
  ];
}
