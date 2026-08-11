import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

/* ═══════════════════════════════════════════════
   Blog yazısı veri katmanı
   (İleride gerçek bir CMS/MDX ile değiştirilebilir)
═══════════════════════════════════════════════ */
interface Post {
  slug: string;
  title: string;
  description: string;
  author: string;
  datePublished: string;       // ISO 8601
  datePublishedDisplay: string;
  readTime: string;
  category: string;
  gradient: string;
  content: string;             // Saf HTML (prose ile işlenir)
}

const posts: Post[] = [
  {
    slug: "minimalist-salonlar-icin-ideal-tv-unitesi-secimi",
    title: "Minimalist Salonlar İçin İdeal TV Ünitesi Seçimi",
    description:
      "Salon tasarımında sadelik ile işlevsellik arasındaki dengeyi kurmak sanatın ta kendisidir. Doğru TV ünitesi seçimiyle yaşam alanınızı nasıl dönüştürebileceğinizi keşfedin.",
    author: "Decoroys Editörü",
    datePublished: "2026-07-02T09:00:00+03:00",
    datePublishedDisplay: "2 Temmuz 2026",
    readTime: "5 dk okuma",
    category: "Tasarım",
    gradient: "from-amber-400 to-orange-500",
    content: `
      <p>Minimalist bir salonun en baskın öğesi TV ünitesidir. Doğru seçim yapıldığında oda olduğundan büyük, sakin ve özgün hissettirirken yanlış bir tercih tüm dengeyi bozabilir.</p>

      <h2>Boyut ve Orantı</h2>
      <p>TV ünitesinin genişliği, duvara oranla %60–70 arasında olmalıdır. Bu kural odanın nefes almasını sağlar. Çok büyük bir ünite boğucu, çok küçük bir ünite ise "unutulmuş" bir izlenim yaratır.</p>
      <p>Yükseklik konusunda altın kural şudur: TV ekranının ortası, oturma pozisyonundaki göz hizasına gelmelidir. Bu genellikle yerden 100–110 cm arasına denk gelir.</p>

      <h2>Malzeme Seçimi</h2>
      <p>Minimalist estetik için en iyi materyaller şunlardır:</p>
      <ul>
        <li><strong>Mat MDF:</strong> Parmak izi bırakmaz, ışığı yumuşak dağıtır.</li>
        <li><strong>Doğal ahşap kaplamalı yüzeyler:</strong> Organik sıcaklık katar, soğuk bir görünümün önüne geçer.</li>
        <li><strong>Açık renkli boyalı yüzeyler:</strong> Mekanı büyütür, ışığı yansıtır.</li>
      </ul>

      <h2>Gizli Depolama: Minimalizmin Sırrı</h2>
      <p>Gerçek minimalizm "eşya saklama" üzerine kuruludur. İyi bir TV ünitesi, kablo kanallarına, set üstü kutularına ve oyun konsollarına yer açarken dışarıdan sadece temiz bir yüzey gösterir.</p>
      <p>Depolama alanlarının kapak sistemi tercihlerinizde push-to-open mekanizması kullanmak hem görsel temizliği korur hem de pratik bir deneyim sunar.</p>

      <h2>Renk Uyumu</h2>
      <p>TV ünitesinin rengi, zemin ve duvar arasında köprü kurmalıdır. Açık renkli bir zemin üzerine orta ton (greige, warm grey) bir ünite ideal dengeyi sağlar. Aksesuar olarak tek bir vurgu rengi — bir vazo, bir kitap sırası ya da bir küçük heykel — yeterlidir.</p>

      <blockquote>
        <p>"Az şeyin daha fazla anlam taşıdığı bir mekanda, her obje kasıtlı ve sevgili olmalıdır." — Decoroys Tasarım Felsefesi</p>
      </blockquote>

      <h2>Sonuç</h2>
      <p>Minimalist salon için TV ünitesi seçerken boyut/orantı, malzeme kalitesi ve gizli depolama kapasitesini birlikte değerlendirin. Bu üç kriter doğru seçildiğinde geri kalan her şey kendiliğinden yerine oturur.</p>
    `,
  },
  {
    slug: "kablolara-veda-akilli-depolama-cozumleriyle-sikligi-yakalayin",
    title: "Kablolara Veda: Akıllı Depolama Çözümleriyle Şıklığı Yakalayın",
    description:
      "Dağınık kablolar ve gizlenemeyen elektronik cihazlar, en güzel salonun bile havasını bozabilir. Gizli depolama sistemleriyle hem düzen hem estetik elde edin.",
    author: "Decoroys Editörü",
    datePublished: "2026-06-20T09:00:00+03:00",
    datePublishedDisplay: "20 Haziran 2026",
    readTime: "4 dk okuma",
    category: "Pratik İpuçları",
    gradient: "from-rose-400 to-pink-500",
    content: `
      <p>Salonunuzdaki en büyük düşman nedir? Uzun vadeli bir partner aramıyorsanız büyük ihtimalle kablolar ve onları takip eden kaos. Ama bu sorunun çok zarif bir çözümü var.</p>

      <h2>Neden Kablolar Bu Kadar Rahatsız Edici?</h2>
      <p>İnsan gözü doğal olarak düzensizliği stres kaynağı olarak algılar. Bir araştırmaya göre dağınık görsel alanlar kortizol seviyesini artırabilir. Yani kablolar sadece "çirkin" değil, fiziksel olarak stres yaratıyor.</p>

      <h2>3 Temel Çözüm Stratejisi</h2>

      <h3>1. Kablo Kanalı Entegrasyonu</h3>
      <p>Mobilya içine entegre kablo kanalları, tüm kabloları TV ünitesinin arkasından geçirerek tamamen görünmez kılar. Decoroys TV ünitelerinin tamamında bu sistem standarttır.</p>

      <h3>2. Güç Merkezi Gizleme</h3>
      <p>Çoklu priz gruplarını TV ünitesinin arka bölmesine yerleştirin. Böylece tüm cihazların tek bir noktaya bağlandığı düzenli bir güç merkezi oluşur; dışarıdan yalnızca tek bir kablo duvara gider.</p>

      <h3>3. Kablosuz Teknoloji Entegrasyonu</h3>
      <p>Mümkün olan her yerde Bluetooth hoparlör, kablosuz şarj standları ve Wi-Fi bağlantılı cihazlar tercih edin. Fiziksel kablo sayısı düştükçe gizleme sorunu da küçülür.</p>

      <h2>Depolama Kapasitesini Doğru Boyutlandırın</h2>
      <p>Bugünkü ihtiyacınız için değil, <em>3 yıl sonraki</em> ihtiyacınız için plan yapın. Akıllı ev sistemleri, yeni nesil oyun konsolları ve akış cihazlarının sayısı artmaya devam ediyor. Gizli depolama bölmeleriniz bu büyümeye yer açabilmeli.</p>

      <blockquote>
        <p>"Düzen bir varış noktası değil, süregelen bir pratiktir. Mobilyanız bu pratiği kolaylaştırmalıdır." — Decoroys</p>
      </blockquote>

      <h2>Pratik Kontrol Listesi</h2>
      <ul>
        <li>TV arka panelinde kablo kanalı var mı?</li>
        <li>Güç prizleri gizlenmiş mi?</li>
        <li>Görünür kabloların hepsi kablo klipsleriyle düzenlenmiş mi?</li>
        <li>Set üstü kutusu / modem gizli bir bölmede mi?</li>
      </ul>

      <p>Bu dört sorunun tamamına "evet" diyebiliyorsanız salonunuz gerçek anlamda kablo-temiz hale gelmiştir.</p>
    `,
  },
  {
    slug: "modern-mobilyalarda-renk-uyumu-ve-dekorasyon-sirlari",
    title: "Modern Mobilyalarda Renk Uyumu ve Dekorasyon Sırları",
    description:
      "Doğru renk paleti, bir odayı iki katı büyük ve iki katı huzurlu hissettirebilir. Nötr tonları ve vurgu renklerini ustaca birleştirmenin formülünü öğrenin.",
    author: "Decoroys Editörü",
    datePublished: "2026-06-05T09:00:00+03:00",
    datePublishedDisplay: "5 Haziran 2026",
    readTime: "6 dk okuma",
    category: "Renk & Stil",
    gradient: "from-violet-400 to-purple-500",
    content: `
      <p>Renk, mobilyadan duvardan zemine kadar bir odanın duygusal tonunu belirleyen en güçlü araçtır. Ve bu araç, sandığınızdan çok daha az karmaşık bir mantığa sahiptir.</p>

      <h2>60-30-10 Kuralı</h2>
      <p>İç tasarımın evrensel renk dengesi formülü üç sayıdan oluşur:</p>
      <ul>
        <li><strong>%60 Baskın Renk:</strong> Duvarlar ve büyük mobilyalar (beyaz, bej, gri).</li>
        <li><strong>%30 İkincil Renk:</strong> Kanepe, halı veya perdeler gibi orta ölçekli öğeler.</li>
        <li><strong>%10 Vurgu Rengi:</strong> Yastıklar, vazo, sanat eseri gibi küçük aksesuarlar.</li>
      </ul>
      <p>Bu oranı korduğunuz sürece seçtiğiniz renkler neredeyse her zaman uyumlu görünür.</p>

      <h2>Modern Mobilya İçin Nötr Palet</h2>
      <p>Modern mobilyalarda en başarılı baskın renkler şunlardır:</p>
      <ul>
        <li><strong>Warm White (#F5F2ED):</strong> Soğuk beyazdan farklı olarak organik bir sıcaklık taşır.</li>
        <li><strong>Greige (Gri + Bej):</strong> Her tona uyum sağlayan nötr bir kahraman.</li>
        <li><strong>Charcoal (#36454F):</strong> Koyu ama agresif değil; derinlik katar.</li>
      </ul>

      <h2>Ahşap Tonları: Renk Değil Doku</h2>
      <p>Ahşap yüzeyler teknik olarak "renk" sayılmasa da paletteki yerlerini bilmek gerekir. Açık meşe, beyaz ve gri tonlarla mükemmel uyum sağlar. Ceviz ve koyu ahşaplar ise sıcak bej ve toprak tonlarını tercih eder.</p>

      <h2>Vurgu Rengini Nasıl Seçersiniz?</h2>
      <p>Tek bir pratik yöntem: Odanızın baskın renginin renk tekerleğindeki tam karşısındaki (complementary) rengi seçin. Gri baskın bir odada vurgu için turuncu veya amber; bej bir odada için kobalt mavi veya derin yeşil işe yarar.</p>

      <blockquote>
        <p>"Renk, mekana kişilik verir. Ama kişiliğin kendisi denge üzerine kuruludur." — Decoroys Tasarım Ekibi</p>
      </blockquote>

      <h2>Sık Yapılan Hatalar</h2>
      <ul>
        <li>Çok fazla vurgu rengi kullanmak (ikiden fazla renk "vurgu" olmaktan çıkar, kaos olur).</li>
        <li>Ahşap tonlarını göz ardı etmek (sarımsı ve kırmızımsı ahşaplar birbirine karışınca çatışır).</li>
        <li>Mobilya ve duvarı aynı renge boyamak (yüzeyler kaybolur, oda düzleşir).</li>
      </ul>

      <p>Renk uyumunu bir kez kavradıktan sonra her yeni mobilya alışverişi çok daha kolay ve tatmin edici hale gelecektir.</p>
    `,
  },
];

function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}

/* ═══════════════════════════════════════════════
   Dinamik Metadata
═══════════════════════════════════════════════ */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Yazı Bulunamadı" };
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      publishedTime: post.datePublished,
      authors: [post.author],
    },
  };
}

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

/* ═══════════════════════════════════════════════
   Sayfa
═══════════════════════════════════════════════ */
export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    author: {
      "@type": "Organization",
      name: post.author,
      url: "https://www.decoroys.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Decoroys",
      logo: {
        "@type": "ImageObject",
        url: "https://www.decoroys.com/images/logo.png",
      },
    },
    datePublished: post.datePublished,
    dateModified: post.datePublished,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://www.decoroys.com/blog/${post.slug}`,
    },
    inLanguage: "tr-TR",
    isPartOf: {
      "@type": "WebSite",
      "@id": "https://www.decoroys.com/#website",
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-zinc-400 font-medium mb-12">
        <Link href="/" className="hover:text-zinc-700 transition-colors">Ana Sayfa</Link>
        <span>/</span>
        <Link href="/blog" className="hover:text-zinc-700 transition-colors">Blog</Link>
        <span>/</span>
        <span className="text-zinc-600 truncate max-w-[200px]">{post.title}</span>
      </nav>

      <div className="max-w-3xl mx-auto">

        {/* Başlık bloğu */}
        <header className="mb-12">
          <span className="inline-block text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-5">
            {post.category}
          </span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-zinc-900 leading-tight tracking-tight mb-6">
            {post.title}
          </h1>
          <div className="flex items-center gap-3 text-sm text-zinc-400 font-medium">
            <span>{post.author}</span>
            <span className="w-1 h-1 rounded-full bg-zinc-300" />
            <time dateTime={post.datePublished}>{post.datePublishedDisplay}</time>
            <span className="w-1 h-1 rounded-full bg-zinc-300" />
            <span>{post.readTime}</span>
          </div>
        </header>

        {/* Kapak gradient alanı */}
        <div
          className={`w-full aspect-[16/8] rounded-2xl bg-gradient-to-br ${post.gradient} mb-14 overflow-hidden relative`}
        >
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                "radial-gradient(circle at 25% 60%, white 1px, transparent 1px), radial-gradient(circle at 75% 30%, white 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        {/* İçerik — Tailwind Typography */}
        <article
          className="prose prose-lg prose-zinc max-w-none
            prose-headings:font-bold prose-headings:tracking-tight
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-zinc-600 prose-p:leading-relaxed prose-p:font-light
            prose-li:text-zinc-600 prose-li:font-light
            prose-strong:text-zinc-800 prose-strong:font-semibold
            prose-blockquote:border-l-4 prose-blockquote:border-orange-400
            prose-blockquote:pl-5 prose-blockquote:italic
            prose-blockquote:text-zinc-500 prose-blockquote:not-italic
            prose-blockquote:bg-zinc-50 prose-blockquote:py-4 prose-blockquote:rounded-r-xl"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Geri dön */}
        <div className="mt-16 pt-10 border-t border-zinc-100">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700 hover:text-zinc-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            Tüm Yazılara Dön
          </Link>
        </div>
      </div>

      {/* Article JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
