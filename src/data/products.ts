/**
 * Ölçü bazlı fiyat varyantı.
 * Örn: aynı ürünün 180x30 cm ve 200x30 cm ölçüleri farklı fiyatlı olabilir.
 */
export interface ProductVariant {
  /** Ürün içinde stabil kimlik — sipariş anında snapshot'a yazılır. */
  id: string;
  /** Görünen ölçü etiketi, ör. "200x30 cm". */
  size: string;
  /** Bu ölçünün gerçek satış fiyatı (TL). */
  price: number;
}

export interface Product {
  id: string;
  name: string;
  /**
   * Taban/liste fiyatı. GERİYE UYUMLULUK için korunur:
   * `variants` tanımlı DEĞİLSE gerçek satış fiyatı budur.
   * `variants` varsa gerçek fiyat seçilen variant.price'tır.
   */
  price: number;
  /** Ölçü seçenekleri. Tanımsız veya boşsa ürün tek fiyatlıdır (eski davranış). */
  variants?: ProductVariant[];
  images: string[];
  category: string;
  description: string;
  features: string[];
  colors: string[];
  featured?: boolean;
}

export const products: Product[] = [
  {
    id: "zenna-tv-unitesi",
    name: "Decoroys Zenna TV Ünitesi",
    price: 8500,
    images: ["/zenna.png"],
    category: "TV Üniteleri",
    description: "Zarif tasarımı ve geniş depolama alanıyla modern yaşam alanları için ideal TV ünitesi.",
    features: ["180x40 cm", "Geniş Depolama", "Mat Yüzey"],
    colors: ["Antrasit", "Beyaz"],
    featured: true,
  },
  {
    id: "begonia-tv-unitesi",
    name: "Decoroys Begonia TV Ünitesi",
    price: 9200,
    images: ["/zenna.png"],
    category: "TV Üniteleri",
    description: "Minimalist çizgiler ve negatif boşlukların mükemmel uyumu.",
    features: ["200x45 cm", "Geniş Depolama", "Mat Yüzey"],
    colors: ["Premium Siyah", "Doğal Ahşap"],
    featured: true,
  },
  {
    id: "benjamin-tv-unitesi",
    name: "Decoroys Benjamin TV Ünitesi",
    price: 7800,
    images: ["/zenna.png"],
    category: "TV Üniteleri",
    description: "Kompakt tasarımıyla küçük alanlara uyum sağlayan şık TV ünitesi.",
    features: ["160x35 cm", "Kapalı Depolama", "Parlak Yüzey"],
    colors: ["Beyaz", "Antrasit"],
    featured: true,
  },
  {
    id: "bleck-way-tv-unitesi",
    name: "Decoroys Bleck Way TV Ünitesi",
    price: 11500,
    images: ["/zenna.png"],
    category: "TV Üniteleri",
    description: "Modern çizgileriyle yaşam alanlarına estetik ve işlevsellik katan TV ünitesi.",
    features: ["220x50 cm", "LED Aydınlatma", "Cam Detay"],
    colors: ["Siyah", "Gri"],
  },
  {
    id: "bleckberry-tv-unitesi",
    name: "Decoroys Bleckberry TV Ünitesi",
    price: 10200,
    images: ["/zenna.png"],
    category: "TV Üniteleri",
    description: "Geometrik çizgilere sahip modern ve etkileyici TV ünitesi.",
    features: ["200x42 cm", "Sürgülü Kapak", "Metal Ayak"],
    colors: ["Siyah", "Ceviz"],
  },
  {
    id: "caracus-tv-unitesi",
    name: "Decoroys Caracus TV Ünitesi",
    price: 8900,
    images: ["/zenna.png"],
    category: "TV Üniteleri",
    description: "Dengeli ve sakin tasarımıyla ev ortamına huzur katan TV ünitesi.",
    features: ["180x38 cm", "Doğal Ahşap", "Minimalist"],
    colors: ["Doğal Meşe"],
  },
  {
    id: "casprice-tv-unitesi",
    name: "Decoroys Casprice TV Ünitesi",
    price: 12800,
    images: ["/zenna.png"],
    category: "TV Üniteleri",
    description: "Geniş ve görkemli yapısıyla büyük salonlar için tasarlandı.",
    features: ["250x55 cm", "Çekmeceli", "Mermer Detay"],
    colors: ["Beyaz Mermer", "Siyah"],
  },
  {
    id: "esse-tv-unitesi",
    name: "Decoroys Esse TV Ünitesi",
    price: 9600,
    images: ["/zenna.png"],
    category: "TV Üniteleri",
    description: "Keskin ve modern hatlarıyla dikkat çeken şık TV ünitesi.",
    features: ["190x40 cm", "Geometrik Desen", "Push-Open"],
    colors: ["Antrasit", "Altın Detay"],
  },
  {
    id: "florya-tv-unitesi",
    name: "Decoroys Florya TV Ünitesi",
    price: 7500,
    images: ["/zenna.png"],
    category: "TV Üniteleri",
    description: "Organik formlarıyla huzur ve sıcaklık veren TV ünitesi.",
    features: ["170x36 cm", "Yumuşak Hatlar", "Doğal Doku"],
    colors: ["Yeşil Ahşap", "Krem"],
  },
  {
    id: "joseph-tv-unitesi",
    name: "Decoroys Joseph TV Ünitesi",
    price: 13500,
    images: ["/zenna.png"],
    category: "TV Üniteleri",
    description: "Lüks ve premium malzemeleriyle öne çıkan zarif TV ünitesi.",
    features: ["230x48 cm", "Gizli Depolama", "Premium Yüzey"],
    colors: ["Onyx Siyah"],
  },
  {
    id: "mdf-yeni-valens",
    name: "Decoroys MDF Yeni Valens",
    price: 8200,
    images: ["/zenna.png"],
    category: "TV Üniteleri",
    description: "MDF malzemenin üstün kalitesiyle tasarlanmış modern TV ünitesi.",
    features: ["185x40 cm", "Açık Raf", "İnce Profil"],
    colors: ["Beyaz", "Açık Meşe"],
  },
  {
    id: "mezza-tv-unitesi",
    name: "Decoroys Mezza TV Ünitesi",
    price: 10800,
    images: ["/zenna.png"],
    category: "TV Üniteleri",
    description: "Modern ve endüstriyel çizgileriyle dikkat çeken TV ünitesi.",
    features: ["200x44 cm", "Metal Detay", "Geniş Depolama"],
    colors: ["Antrasit", "Gümüş"],
  },
  {
    id: "muson-tv-unitesi",
    name: "Decoroys Muson TV Ünitesi",
    price: 9800,
    images: ["/zenna.png"],
    category: "TV Üniteleri",
    description: "Zarif ve zamansız tasarımıyla her mekana uyum sağlayan TV ünitesi.",
    features: ["195x42 cm", "Yumuşak Kapanış", "Cam Raf"],
    colors: ["Fildişi", "Altın"],
  },
  {
    id: "palmia-tv-unitesi",
    name: "Decoroys Palmia TV Ünitesi",
    price: 8700,
    images: ["/zenna.png"],
    category: "TV Üniteleri",
    description: "Saf ve temiz görünümüyle mekana ferahlık katan TV ünitesi.",
    features: ["180x38 cm", "Parlak Yüzey", "Minimalist"],
    colors: ["Beyaz", "Açık Gri"],
  },
  {
    id: "peter-tv-unitesi",
    name: "Decoroys Peter TV Ünitesi",
    price: 11200,
    images: ["/zenna.png"],
    category: "TV Üniteleri",
    description: "Sıcak tonlarıyla mekana enerji ve karakter katan TV ünitesi.",
    features: ["210x46 cm", "LED Şerit", "Geniş Depolama"],
    colors: ["Koyu Ceviz", "Bordo Detay"],
  },
  {
    id: "petra-tv-unitesi",
    name: "Decoroys Petra TV Ünitesi",
    price: 7900,
    images: ["/zenna.png"],
    category: "TV Üniteleri",
    description: "İşlevsel ve estetik tasarımıyla modern yaşam alanları için TV ünitesi.",
    features: ["175x40 cm", "Kablo Yönetimi", "Pratik Raf"],
    colors: ["Gri", "Lacivert"],
  },
  {
    id: "roman-tv-unitesi",
    name: "Decoroys Roman TV Ünitesi",
    price: 14500,
    images: ["/zenna.png"],
    category: "TV Üniteleri",
    description: "Geniş ve yatay profiliyle büyük salonlara özel premium TV ünitesi.",
    features: ["260x52 cm", "Motorlu Kapak", "Premium Ahşap"],
    colors: ["Ceviz", "Siyah"],
  },
  {
    id: "royal-tv-unitesi",
    name: "Decoroys Royal TV Ünitesi",
    price: 9400,
    images: ["/zenna.png"],
    category: "TV Üniteleri",
    description: "Doğal dokusuyla dayanıklı ve şık görünüm sunan TV ünitesi.",
    features: ["190x42 cm", "Doğal Doku", "Güçlendirilmiş Yapı"],
    colors: ["Gri", "Siyah"],
  },
  {
    id: "roys-tv-unitesi",
    name: "Decoroys Roys TV Ünitesi",
    price: 10500,
    images: ["/zenna.png"],
    category: "TV Üniteleri",
    description: "Pürüzsüz yüzeyleri ve şık tasarımıyla öne çıkan TV ünitesi.",
    features: ["205x44 cm", "Saten Finish", "Sürgülü Kapak"],
    colors: ["Şampanya", "Gümüş"],
  },
  {
    id: "sare-tv-unitesi",
    name: "Decoroys Sare TV Ünitesi",
    price: 8100,
    images: ["/zenna.png"],
    category: "TV Üniteleri",
    description: "Ahşabın sıcaklığını modern formlarla buluşturan TV ünitesi.",
    features: ["180x40 cm", "Masif Ahşap", "El Yapımı"],
    colors: ["Doğal Ahşap", "Koyu Ceviz"],
  },
  {
    id: "sunrise-tv-unitesi",
    name: "Decoroys Sunrise TV Ünitesi",
    price: 15800,
    images: ["/zenna.png"],
    category: "TV Üniteleri",
    description: "Cam detaylarıyla ışığı yansıtan lüks ve gösterişli TV ünitesi.",
    features: ["240x50 cm", "Cam Detay", "LED Ambiyans"],
    colors: ["Şeffaf", "Siyah"],
  },
  {
    id: "tiflis-tivi-unitesi",
    name: "Decoroys Tiflis Tivi Ünitesi",
    price: 9900,
    images: ["/zenna.png"],
    category: "TV Üniteleri",
    description: "Akıcı ve dinamik hatlarıyla ilgi çekici modern TV ünitesi.",
    features: ["195x42 cm", "Yumuşak Kapanış", "Özel Desen"],
    colors: ["Mavi", "Beyaz"],
  },
  {
    id: "valens-tv-unitesi",
    name: "Decoroys Valens TV Ünitesi",
    price: 16200,
    images: ["/zenna.png"],
    category: "TV Üniteleri",
    description: "Zamansız lüksü yaşatan ve kalitesiyle öne çıkan premium TV ünitesi.",
    features: ["220x48 cm", "Premium Malzeme", "Paslanmaz Çelik"],
    colors: ["Beyaz", "Siyah"],
  },
  {
    id: "victory-tv-unitesi",
    name: "Decoroys Victory TV Ünitesi",
    price: 8400,
    images: ["/zenna.png"],
    category: "TV Üniteleri",
    description: "Şık ve işlevsel tasarımıyla her mekana uyum sağlayan TV ünitesi.",
    features: ["185x40 cm", "Buzlu Cam", "Gizli Menteşe"],
    colors: ["Gri", "Beyaz"],
  },
  {
    id: "viva-tv-unitesi",
    name: "Decoroys Viva TV Ünitesi",
    price: 13200,
    images: ["/zenna.png"],
    category: "TV Üniteleri",
    description: "En üst düzey malzeme ve işçilikle üretilmiş premium TV ünitesi.",
    features: ["230x50 cm", "Premium Finish", "Entegre Soundbar"],
    colors: ["Titanium", "Siyah"],
  },
  {
    id: "antrasit-tv-unitesi",
    name: "Decoroys Antrasit TV Ünitesi",
    price: 11800,
    images: ["/zenna.png"],
    category: "TV Üniteleri",
    description: "Antrasit tonlarının güçlü estetiğiyle modern yaşam alanları için TV ünitesi.",
    features: ["210x46 cm", "Mat Antrasit Yüzey", "Gizli Depolama"],
    colors: ["Antrasit", "Siyah"],
  },
];
