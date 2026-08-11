"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { auth, ADMIN_EMAIL } from "@/lib/firebase";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const completeSignIn = async () => {
      // Mevcut URL gerçekten bir email link mi?
      if (!isSignInWithEmailLink(auth, window.location.href)) {
        setStatus("error");
        setMessage("Geçersiz veya süresi dolmuş giriş bağlantısı.");
        return;
      }

      // localStorage'dan e-postayı al (aynı cihazdan açıldıysa)
      let emailForSignIn = window.localStorage.getItem("emailForSignIn");

      if (!emailForSignIn) {
        // Farklı cihazdan açılmış olabilir — e-postayı sor
        emailForSignIn = window.prompt("Güvenlik için lütfen e-posta adresinizi tekrar girin:");
      }

      if (!emailForSignIn) {
        setStatus("error");
        setMessage("E-posta adresi alınamadı.");
        return;
      }

      // Admin kontrolü
      if (emailForSignIn.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        setStatus("error");
        setMessage("Bu e-posta adresi yönetici paneline erişim yetkisine sahip değil.");
        return;
      }

      try {
        await signInWithEmailLink(auth, emailForSignIn, window.location.href);
        window.localStorage.removeItem("emailForSignIn");
        setStatus("success");
        setMessage("Giriş başarılı! Yönetim paneline yönlendiriliyorsunuz...");
        // router.push — history stack'e ekler, geri düğmesi token URL'ine döndürmez
        setTimeout(() => router.push("/admin"), 1500);
      } catch (err: any) {
        console.error("Auth callback hatası:", err);
        setStatus("error");
        setMessage(
          err.code === "auth/invalid-action-code"
            ? "Bu bağlantı daha önce kullanılmış veya süresi dolmuş. Lütfen yeni bir bağlantı isteyin."
            : "Oturum açılırken bir hata oluştu. Lütfen tekrar deneyin."
        );
      }
    };

    completeSignIn();
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl shadow-zinc-200/60 border border-zinc-100 p-6 sm:p-10 flex flex-col items-center text-center gap-6">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 text-zinc-400 animate-spin" />
            <div>
              <h2 className="text-xl font-bold text-zinc-900 mb-2">Oturum Açılıyor</h2>
              <p className="text-sm text-zinc-500 font-light">Kimliğiniz doğrulanıyor, lütfen bekleyin...</p>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 mb-2">Hoş Geldiniz!</h2>
              <p className="text-sm text-zinc-500 font-light">{message}</p>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 mb-2">Giriş Başarısız</h2>
              <p className="text-sm text-zinc-500 font-light">{message}</p>
            </div>
            <button
              onClick={() => router.replace("/admin")}
              className="w-full bg-zinc-900 text-white py-3.5 rounded-2xl font-semibold hover:bg-black transition-colors text-sm"
            >
              Giriş Sayfasına Dön
            </button>
          </>
        )}
      </div>
    </div>
  );
}
