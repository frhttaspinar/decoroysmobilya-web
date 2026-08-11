import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Dekorasyon ve Mobilya İlhamı",
  description:
    "Minimalist salon tasarımından akıllı depolama çözümlerine, renk uyumundan modern mobilya seçimine kadar tüm ilham ve ipuçları Decoroys Blog'da.",
  alternates: { canonical: "/blog" },
};

interface Post {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  gradient: string;
}

const posts: Post[] = [
  {
    slug: "minimalist-salonlar-icin-ideal-tv-unitesi-secimi",
    title: "Minimalist Salonlar İçin İdeal TV Ünitesi Seçimi",
    excerpt:
      "Salon tasarımında sadelik ile işlevsellik arasındaki dengeyi kurmak sanatın ta kendisidir. Doğru TV ünitesi seçimiyle yaşam alanınızı nasıl dönüştürebileceğinizi keşfedin.",
    date: "2 Temmuz 2026",
    readTime: "5 dk okuma",
    category: "Tasarım",
    gradient: "from-amber-400 to-orange-500",
  },
  {
    slug: "kablolara-veda-akilli-depolama-cozumleriyle-sikligi-yakalayin",
    title: "Kablolara Veda: Akıllı Depolama Çözümleriyle Şıklığı Yakalayın",
    excerpt:
      "Dağınık kablolar ve gizlenemeyen elektronik cihazlar, en güzel salonun bile havasını bozabilir. Gizli depolama sistemleriyle hem düzen hem estetik elde edin.",
    date: "20 Haziran 2026",
    readTime: "4 dk okuma",
    category: "Pratik İpuçları",
    gradient: "from-rose-400 to-pink-500",
  },
  {
    slug: "modern-mobilyalarda-renk-uyumu-ve-dekorasyon-sirlari",
    title: "Modern Mobilyalarda Renk Uyumu ve Dekorasyon Sırları",
    excerpt:
      "Doğru renk paleti, bir odayı iki katı büyük ve iki katı huzurlu hissettirebilir. Nötr tonları ve vurgu renklerini ustaca birleştirmenin formülünü öğrenin.",
    date: "5 Haziran 2026",
    readTime: "6 dk okuma",
    category: "Renk & Stil",
    gradient: "from-violet-400 to-purple-500",
  },
];

export default function BlogPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">

      {/* Sayfa başlığı */}
      <div className="mb-16 md:mb-20">
        <p className="text-[10px] font-bold tracking-[0.35em] uppercase text-zinc-400 mb-4">
          Decoroys / Blog
        </p>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-zinc-900 leading-tight tracking-tight max-w-2xl">
          Dekorasyon
          <br />
          <span
            style={{
              background: "linear-gradient(90deg, #f97316, #ec4899, #8b5cf6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            ilhamı burada.
          </span>
        </h1>
        <p className="mt-6 text-base md:text-lg text-zinc-500 font-light max-w-xl leading-relaxed">
          Minimalist tasarım, akıllı depolama ve renk uyumu üzerine yazılar, ipuçları ve ilham verici içerikler.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
        {posts.map((post) => (
          <article key={post.slug} className="group flex flex-col">

            {/* Görsel alanı */}
            <div
              className={`relative w-full aspect-[16/10] rounded-2xl bg-gradient-to-br ${post.gradient} overflow-hidden mb-6`}
            >
              {/* Dekoratif desen */}
              <div className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 30% 50%, white 1px, transparent 1px), radial-gradient(circle at 70% 80%, white 1px, transparent 1px)",
                  backgroundSize: "28px 28px",
                }}
              />
              {/* Kategori etiketi */}
              <span className="absolute top-4 left-4 text-[10px] font-bold tracking-[0.25em] uppercase text-white/80 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full">
                {post.category}
              </span>
            </div>

            {/* Meta */}
            <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-medium mb-3">
              <span>{post.date}</span>
              <span className="w-1 h-1 rounded-full bg-zinc-300" />
              <span>{post.readTime}</span>
            </div>

            {/* Başlık */}
            <h2 className="text-lg md:text-xl font-bold text-zinc-900 leading-snug mb-3 group-hover:text-zinc-600 transition-colors">
              {post.title}
            </h2>

            {/* Özet */}
            <p className="text-sm text-zinc-500 font-light leading-relaxed flex-1 mb-6">
              {post.excerpt}
            </p>

            {/* Devamını Oku */}
            <Link
              href={`/blog/${post.slug}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900 hover:gap-3 transition-all duration-200 w-fit"
            >
              Devamını Oku
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
