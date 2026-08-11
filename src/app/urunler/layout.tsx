import type { Metadata } from "next";

/**
 * /urunler sayfası client component olduğu için metadata'yı bu layout taşır.
 */
export const metadata: Metadata = {
  title: "Tüm Ürünler",
  description:
    "Decoroys'un tüm TV üniteleri, kahve dolapları ve TV panelleri tek sayfada. Premium malzeme, minimalist tasarım, Türkiye geneli hızlı kargo.",
  alternates: { canonical: "/urunler" },
};

export default function UrunlerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
