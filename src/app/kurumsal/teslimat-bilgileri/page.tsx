import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Teslimat Bilgileri",
  description:
    "Decoroys siparişlerinde kargo, teslimat süresi ve teslimat koşulları hakkında bilgilendirme.",
  alternates: { canonical: "/kurumsal/teslimat-bilgileri" },
};

export default function TeslimatKoşulları() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 tracking-tight mb-8 border-b border-zinc-100 pb-6">
          Ödeme ve Teslimat Koşulları
        </h1>
        <div className="prose prose-zinc prose-a:text-blue-600 hover:prose-a:text-blue-700 max-w-none text-zinc-600 font-light leading-relaxed">
          <p>
            Ödeme ve Teslimat

            1) Banka Havalesi veya EFT (Elektronik Fon Transferi) yaparak

            TR77 0001 0000 3058 0781 4150 01

            Yavuz Selim Bülbül adına (decoroys.com)



            2) Sitemiz üzerinden kredi kartlarınız ile

            Her türlü kredi kartınıza online tek ödeme yada taksit imkânlarımızdan yararlanabilirsiniz. Online ödemelerinizde siparişiniz sonunda kredi kartınızdan tutar çekim işlemi gerçekleşecektir. Muhtemel sipariş iptali veya stok sorunları nedeniyle sipariş iptallerinde kredi kartınıza para iadesi 3 iş günü içerisinde yapılacaktır.



            3) Sipariş Bedeli İadesi

            Siparişlerinizin olası sebeplerle iptali durumunda; DECOROSY.COM  üç iş günü içerisinde ürün bedelini hesabınıza ve/veya kredi kartınıza iade eder. Ancak, banka hesap bilgilerinizi ve/veya kredi kartı bilgilerinizi doğru ve eksiksiz olarak şirketimiz finans yetkililerine bildirmeniz gerekmektedir.



            4) Teslimat

            Sipariş etmiş olduğunuz ürünleri aynı gün kargoya teslim etmeye gayret ediyoruz. Temini zaman alan ürünler için kargo teslim süresi ürün detayında belirtildiği gibi 1 iş günüdür. Gecikmesi muhtemel teslimat durumunda size bilgi verilecektir.

            Talepleriniz sipariş sonunda belirlemiş olduğunuz teslimat tipine göre hazırlanmak üzere işleme alınacaktır. Çorum merkezli şirketimizden ürünler anlaşmalı kargo firmasıyla gönderilecektir. Siparişleriniz onaylandıktan sonra en geç 1 (bir) iş günü sonunda Kargo firmasına teslim edilir.

            Müşteri temsilcimize danışarak değişik teslimat şartları konusunda görüşebilirsiniz. Ayrıca kargo teslimatları sadece Türkiye için geçerlidir



            5) Ödeme Takibi

            Söz konusu sistem herhangi bir sorun nedeni ile işlemi gerçekleştiremiyorsa ödeme sayfası sonucunda ziyaretçimiz bu durumdan haberdar edilmektedir.

            Belirtilen adreste herhangi bir hata durumunda teslimatı gerçekleşemeyen sipariş ile ilgili olarak siparişi veren ile bağlantı kurulmaktadır.

            Ziyaretçimiz tarafından belirtilen e-posta adresinin geçerliliği siparişin aktarılmasını takiben gönderilen otomatik e-posta ile teyit edilmektedir.

            Teslimatın gerçekleşmesi konusunda müşteri kadar kredi kartı sistemini kullandığımız bankaya karşı da sorumluluğumuz söz konusudur.



            Lütfen dikkat ediniz!



            Sevkiyat sırasında zarar gördüğünü düşündüğünüz paketleri, teslim aldığınız firma yetkilisi önünde açıp kontrol ediniz. Eğer üründe herhangi bir zarar olduğunu düşünüyorsanız kargo firmasına tutanak tutturularak ürünü teslim almayınız.



            Ürün teslim alındıktan sonra kargo firmasının görevini tam olarak yerine getirdiği kabul edilmektedir.

            Ürün hasarlı ise: Hazırlamış olduğunuz tutanağı en kısa zamanda info@decoeoys.com  gönderin ve durumu bildirin.

            Bu işlemleri gerçekleştirdiğiniz takdirde paketinizle ilgili çalışmalara başlayarak, en kısa zamanda teslimatın tekrarlanmasını sağlayacağız.


          </p>
        </div>
      </div>
    </div>
  );
}
