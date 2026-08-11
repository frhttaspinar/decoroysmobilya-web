import type { Metadata } from "next";
import { Inter, Caveat } from "next/font/google";
import "./globals.css";
import MainLayoutWrapper from "@/components/MainLayoutWrapper";
import { SITE_URL } from "@/lib/site";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  weight: ["400", "700"],
});

/* ═══════════════════════════════════════════════
   Metadata — Arama Motorları & Open Graph
═══════════════════════════════════════════════ */
export const metadata: Metadata = {
  // Göreli canonical/OG URL'lerinin tek bir canonical host üzerinden
  // çözülmesini sağlar. alternates.canonical BİLEREK burada tanımlanmaz:
  // root layout'ta tanımlanırsa kendi canonical'ını belirtmeyen tüm alt
  // sayfalar "/" adresini canonical gösterirdi.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Decoroys | Premium TV Ünitesi, Kahve Dolabı ve Özgün Mobilya Tasarımları",
    template: "%s | Decoroys",
  },
  description:
    "Decoroys, minimalist çizgiler ve premium malzemelerle üretilmiş TV üniteleri, kahve dolapları ve TV panelleri sunar. Türkiye genelinde hızlı kargo, 5 yıl garanti.",
  keywords: [
    "tv ünitesi",
    "tv paneli",
    "kahve dolabı",
    "modern mobilya",
    "minimalist mobilya",
    "salon mobilyası",
    "Decoroys",
    "premium mobilya",
    "dekorasyon",
    "Türkiye mobilya",
  ],
  authors: [{ name: "Decoroys" }],
  creator: "Decoroys",
  publisher: "Decoroys",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://www.decoroys.com",
    siteName: "Decoroys",
    title: "Decoroys | Premium TV Ünitesi ve Özgün Mobilya Tasarımları",
    description:
      "Minimalist çizgiler, premium malzemeler. TV üniteleri, kahve dolapları ve TV panelleri ile evinize estetik katın.",
    images: [
      {
        url: "https://www.decoroys.com/images/logo.png",
        width: 1200,
        height: 630,
        alt: "Decoroys — Premium Mobilya",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Decoroys | Premium Mobilya Tasarımları",
    description:
      "Minimalist çizgiler ve premium malzemelerle üretilmiş TV üniteleri, kahve dolapları ve daha fazlası.",
    images: ["https://www.decoroys.com/images/logo.png"],
  },
  icons: {
    icon: "/images/favicon.png",
    apple: "/images/favicon.png",
  },
};

/* ═══════════════════════════════════════════════
   JSON-LD — Organization + WebSite + Store
   AI ajanlarının ve arama motorlarının markayı
   yapısal olarak anlaması için zorunlu şema.
═══════════════════════════════════════════════ */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.decoroys.com/#organization",
      name: "Decoroys",
      alternateName: "Decoroys Mobilya",
      url: "https://www.decoroys.com",
      logo: {
        "@type": "ImageObject",
        "@id": "https://www.decoroys.com/#logo",
        url: "https://www.decoroys.com/images/logo.png",
        contentUrl: "https://www.decoroys.com/images/logo.png",
        caption: "Decoroys Mobilya",
      },
      contactPoint: [
        {
          "@type": "ContactPoint",
          telephone: "+90-501-156-1818",
          contactType: "customer service",
          contactOption: "TollFree",
          areaServed: "TR",
          availableLanguage: "Turkish",
        },
      ],
      sameAs: [
        "https://www.trendyol.com/magaza/decoroys-m-555247",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://www.decoroys.com/#website",
      url: "https://www.decoroys.com",
      name: "Decoroys",
      description:
        "Premium TV üniteleri, kahve dolapları ve TV panelleri — Decoroys ile evinize estetik katın.",
      publisher: {
        "@id": "https://www.decoroys.com/#organization",
      },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://www.decoroys.com/urunler?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
      inLanguage: "tr-TR",
    },
    {
      "@type": "Store",
      "@id": "https://www.decoroys.com/#store",
      name: "Decoroys Mobilya",
      url: "https://www.decoroys.com",
      image: "https://www.decoroys.com/images/logo.png",
      priceRange: "₺₺₺",
      currenciesAccepted: "TRY",
      paymentAccepted: "Credit Card, Debit Card, Bank Transfer",
      areaServed: {
        "@type": "Country",
        name: "Turkey",
      },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Decoroys Ürün Kataloğu",
        itemListElement: [
          { "@type": "Offer", itemOffered: { "@type": "Product", name: "TV Üniteleri" } },
          { "@type": "Offer", itemOffered: { "@type": "Product", name: "Kahve Dolapları" } },
          { "@type": "Offer", itemOffered: { "@type": "Product", name: "TV Panelleri" } },
        ],
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" className={`${inter.variable} ${caveat.variable}`}>
      <body className="bg-zinc-50 text-zinc-900 font-sans antialiased min-h-screen flex flex-col selection:bg-black selection:text-white">
        <MainLayoutWrapper>{children}</MainLayoutWrapper>

        {/* JSON-LD — arama motorları ve AI ajanları için yapısal marka verisi */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
