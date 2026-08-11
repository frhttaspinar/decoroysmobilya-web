import type { Metadata } from "next";
import UrunClient from "./UrunClient";

/**
 * Ürün verisi Firestore'dan client tarafında geldiği için başlık/açıklama
 * burada üretilemez; self-referencing canonical yine de tanımlanır, böylece
 * takip/kampanya parametreli varyantlar (?utm_...) kopya sayılmaz.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    alternates: { canonical: `/urun/${id}` },
  };
}

export default async function UrunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <UrunClient id={id} />;
}
