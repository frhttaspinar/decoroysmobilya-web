import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "İletişim",
  description:
    "Decoroys ile iletişime geçin: adres, telefon ve e-posta bilgileri.",
  alternates: { canonical: "/kurumsal/iletisim" },
};

export default function Iletisim() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 tracking-tight mb-8 border-b border-zinc-100 pb-6">
          İletişim
        </h1>
        <div className="prose prose-zinc prose-a:text-blue-600 hover:prose-a:text-blue-700 max-w-none text-zinc-600 font-light leading-relaxed">
          <p>
            Adres: Şeyhcui, Poyraz Sk. No:11/A, 05100 Amasya Merkez/Amasya
            Telefon: +90 544 344 05 20
            E-posta: roysdekors@gmail.com
          </p>
        </div>
      </div>
    </div>
  );
}
