import type { Metadata } from "next";
import { notFound } from "next/navigation";
import KategoriClient from "./KategoriClient";

const SLUG_TO_CATEGORY: Record<string, string> = {
  "tv-uniteleri": "TV Üniteleri",
  "kahve-dolaplari": "Kahve Dolapları",
  "tv-panelleri": "Tv Panelleri",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categoryName = SLUG_TO_CATEGORY[slug];
  if (!categoryName) return { title: "Kategori Bulunamadı" };

  return {
    title: categoryName,
    description: `Decoroys ${categoryName} koleksiyonu — premium malzeme, minimalist tasarım ve Türkiye geneli hızlı kargo.`,
    alternates: { canonical: `/kategori/${slug}` },
  };
}

export default async function KategoriPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categoryName = SLUG_TO_CATEGORY[slug];

  // Tanımsız slug'lar daha önce ham slug ile filtrelenip her zaman boş bir
  // kategori sayfası (soft 404) üretiyordu. Artık gerçek 404 döner.
  if (!categoryName) notFound();

  return <KategoriClient slug={slug} categoryName={categoryName} />;
}
