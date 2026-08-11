import type { Metadata } from "next";
import HomeClient from "./HomeClient";

/**
 * Ana sayfa yalnızca metadata (canonical) taşıyabilmek için server component
 * olarak sarmalanmıştır; tüm arayüz HomeClient içinde, değişmeden korunur.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Page() {
  return <HomeClient />;
}
