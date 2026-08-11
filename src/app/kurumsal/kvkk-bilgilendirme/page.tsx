import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KVKK Bilgilendirme",
  description:
    "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında Decoroys aydınlatma metni.",
  alternates: { canonical: "/kurumsal/kvkk-bilgilendirme" },
};

export default function KvkkBilgilendirme() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 tracking-tight mb-8 border-b border-zinc-100 pb-6">
          Kişisel Verilerin Korunması Hakkında Bilgilendirme
        </h1>
        <div className="prose prose-zinc prose-a:text-blue-600 hover:prose-a:text-blue-700 max-w-none text-zinc-600 font-light leading-relaxed">
          <p>
            Decoroys Kişisel Verilerin Korunması ve İşlenmesi Aydınlatma Metni
            1. Veri Sorumlusunun Kimliği 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kişisel verileriniz veri sorumlusu sıfatıyla DECOROYS MOBİLYA tarafından aşağıda açıklanan kapsamda işlenebilecektir.
            2. İşlenen Kişisel Verileriniz Decoroys web sitesi üzerinden sunulan hizmetlerden faydalanabilmeniz amacıyla aşağıdaki kişisel verileriniz işlenmektedir:
            * Kimlik Bilgileri: Ad, soyad.
            * İletişim Bilgileri: E-posta adresi, telefon numarası, teslimat ve fatura adresi.
            * İşlem Güvenliği Bilgileri: IP adresi, uygulama/site giriş-çıkış bilgileri, benzersiz cihaz kimliği (Device ID), şifre bilgileri.
            * Müşteri İşlem Bilgileri: Sipariş geçmişi, sepet bilgileri, uygulama içi tercihler, talep ve şikayet kayıtları.
            3. Kişisel Verilerin İşlenme Amacı Toplanan kişisel verileriniz, KVKK’nın 5. ve 6. maddelerinde belirtilen şartlara uygun olarak aşağıdaki amaçlarla işlenmektedir:
            * Decoroys üzerindeki kullanıcı kayıtlarının oluşturulması ve hesap yönetimi,
            * Sipariş süreçlerinin yürütülmesi, ürünlerin teslimatı ve faturalandırma işlemlerinin yapılması,
            * Uygulama performansının optimize edilmesi, kullanıcı deneyiminin iyileştirilmesi ve teknik hataların tespiti,
            * Müşteri ilişkileri süreçlerinin yürütülmesi, destek taleplerinin yanıtlanması,
            * Yetkili kişi, kurum ve kuruluşlara bilgi verilmesi ile hukuki yükümlülüklerin yerine getirilmesi.
            4. İşlenen Kişisel Verilerin Aktarılması ve Yurt Dışına Aktarım Kişisel verileriniz, yukarıda belirtilen amaçların gerçekleştirilmesi doğrultusunda;
            * Siparişlerin teslim edilebilmesi amacıyla kargo ve lojistik firmalarına,
            * Ödeme işlemlerinin güvenli bir şekilde tamamlanabilmesi amacıyla anlaşmalı ödeme kuruluşlarına,
            * Veri saklama, veri tabanı yönetimi, bulut bilişim ve uygulama altyapı hizmetlerinin güvenli bir şekilde sağlanabilmesi amacıyla altyapı sağlayıcımız olan Google LLC (Firebase) bünyesindeki sunuculara aktarılmaktadır. Firebase altyapısına ait sunucuların yurt dışında bulunması sebebiyle, kişisel verileriniz KVKK’nın 9. maddesinde belirtilen kurallara ve yasal mekanizmalara uygun olarak yurt dışına aktarılmış sayılmaktadır.
            * Hukuki uyuşmazlıkların giderilmesi veya ilgili mevzuat gereği talep edilmesi halinde yetkili kamu kurum ve kuruluşları ile adli makamlara aktarılabilecektir.
            5. Kişisel Veri Toplama Yöntemi ve Hukuki Sebebi Kişisel verileriniz, Decoroys mobil uygulaması ve web sitesi üzerinden, tamamen veya kısmen otomatik olan elektronik yöntemlerle (Firebase SDK'ları ve veri tabanı sistemleri aracılığıyla) toplanmaktadır. Verileriniz, KVKK Madde 5/2 uyarınca;
            * "Bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması kaydıyla sözleşmenin taraflarına ait kişisel verilerin işlenmesinin gerekli olması",
            * "Veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi için zorunlu olması",
            * "İlgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla, veri sorumlusunun meşru menfaatleri için veri işlenmesinin zorunlu olması" hukuki sebeplerine dayanılarak işlenmektedir.
            * Yurt dışı veri aktarımı (Firebase kullanımı) için mevzuatın öngördüğü taahhütname/yeterlilik kararı mekanizmaları veya kullanıcılardan alınacak açık rıza hukuki sebebine dayanılmaktadır. 
6. Kişisel Veri Sahibinin Hakları (KVKK Madde 11) Kanun’un 11. maddesi uyarınca veri sahipleri olarak aşağıdaki haklara sahipsiniz:
* Kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme,
            * Verilerin işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,
            * Yurt içinde veya yurt dışında verilerin aktarıldığı üçüncü kişileri bilme,
            * Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme,
            * KVKK Madde 7 çerçevesinde verilerin silinmesini veya yok edilmesini isteme,
            * Münhasıran otomatik sistemler vasıtasıyla analiz edilen veriler neticesinde aleyhinize bir sonucun ortaya çıkmasına itiraz etme,
            * Kanuna aykırı işleme sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme.
            Haklarınızı kullanmak için taleplerinizi yazılı olarak Şeyhcui, Poyraz Sk. No:11/A, 05100 Amasya Merkez/Amasya adresine gönderebilir veya sistemde kayıtlı e-posta adresiniz üzerinden roysdekors@gmail.com adresine iletebilirsiniz.
                      </p>
                    </div>
      </div>
    </div>
  );
}
