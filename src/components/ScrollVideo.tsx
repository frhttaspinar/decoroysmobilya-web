"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValueEvent,
} from "motion/react";

export default function ScrollVideo() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef   = useRef<HTMLVideoElement>(null);

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start start", "end end"],
  });

  // Spring — video currentTime'ı pürüzsüz kılar; metinler hâlâ ham scroll'u takip eder
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 50,
    damping: 20,
  });

  // iOS Safari, bir play() denemesi olmadan ilk kareyi decode edip boyamaz (gri ekran);
  // React ayrıca muted prop'unu DOM attribute'una yansıtmayabildiği için burada zorluyoruz
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    const p = v.play();
    if (p) p.then(() => v.pause()).catch(() => {});
  }, []);

  useMotionValueEvent(smoothProgress, "change", (latest) => {
    if (videoRef.current && videoRef.current.readyState >= 2) {
      const videoDuration = videoRef.current.duration;
      if (!isNaN(videoDuration) && isFinite(videoDuration)) {
        videoRef.current.currentTime = latest * videoDuration;
      }
    }
  });

  // ── Text 1: Decoroys Mobilya Tasarım — %0 → %28 ──
  const t1Opacity = useTransform(scrollYProgress, [0, 0.06, 0.2, 0.3 ], [0, 1, 1, 0]);
  const t1Y       = useTransform(scrollYProgress, [0, 0.06, 0.2, 0.3 ], [52, 0, 0, -52]);

  // ── Text 3: modernlik — %64 → %96 ──
  const t3Opacity = useTransform(scrollYProgress, [0.64, 0.74, 0.88, 0.96], [0, 1, 1, 0]);
  const t3Y       = useTransform(scrollYProgress, [0.64, 0.74, 0.88, 0.96], [52, 0, 0, -52]);

  // Scroll göstergesi — ilk %5'te kayboluyor
  // smoothProgress (spring) kullanılıyor: tek başına opacity'ye bağlanan ham scroll
  // değerini framer native ScrollTimeline'a devrediyor ve yanlış aralık ölçüyor
  const indicatorOpacity = useTransform(smoothProgress, [0, 0.05], [1, 0]);

  return (
    // overflow-x-clip: yatay taşmayı keser; overflow-x-hidden kullanılmaz çünkü
    // sticky ebeveyninde overflow-hidden position:sticky'yi bozar
    <div
      ref={wrapperRef}
      className="relative w-full max-w-full overflow-x-clip h-[150dvh] md:h-[300vh] lg:h-[400vh]"
    >
      {/* ── Sticky sahne — dvh: adres çubuğu/alt bar hareketlerini tolere eder ── */}
      <div className="sticky top-0 h-screen supports-[height:100dvh]:h-dvh w-full overflow-hidden">

        {/* Video */}
        <video
          ref={videoRef}
          src="/animasyon.mp4"
          muted
          playsInline
          autoPlay
          preload="metadata"
          onLoadedData={(e) => e.currentTarget.pause()}
          className="absolute inset-0 w-full h-full object-cover transform-gpu"
        />

        {/* Karartma katmanı */}
        <div className="absolute inset-0 bg-black/48" />

        {/* Üst/alt beyaza geçiş */}
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-white to-transparent pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-white to-transparent pointer-events-none" />

        {/* ═══ Text 1: Decoroys Mobilya Tasarım ═══ */}
        <motion.div
          style={{ opacity: t1Opacity, y: t1Y }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none"
        >
          <span className="text-[10px] md:text-xs font-bold tracking-[0.35em] uppercase text-white/50 mb-4 md:mb-5">
            Premium Mobilya
          </span>
          <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.5rem] font-black text-white leading-[1.06] tracking-tight max-w-full">
            Decoroys
            <br />
            <span
              style={{
                background: "linear-gradient(90deg, #f97316, #ec4899, #8b5cf6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Mobilya Tasarım
            </span>
          </h2>
        </motion.div>

        {/* ═══ Text 3: modernlik ═══ */}
        <motion.div
          style={{ opacity: t3Opacity, y: t3Y }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 md:px-20 pointer-events-none"
        >
          <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-white leading-tight max-w-3xl">
            Evinize{" "}
            <span
              className="font-semibold"
              style={{
                background: "linear-gradient(90deg, #f97316, #ec4899)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              modernlik ve sadeliği
            </span>
            <br />
            getiriyoruz.
          </p>
        </motion.div>

        {/* ── Scroll göstergesi ── */}
        <motion.div
          style={{ opacity: indicatorOpacity }}
          className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
        >
          <span className="text-white/45 text-[9px] tracking-[0.35em] uppercase">Kaydır</span>
          <motion.div
            animate={{ y: [0, 9, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-7 bg-gradient-to-b from-white/50 to-transparent rounded-full"
          />
        </motion.div>
      </div>
    </div>
  );
}
