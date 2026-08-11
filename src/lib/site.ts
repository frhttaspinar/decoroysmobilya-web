/**
 * Sitenin tek kanonik host'u.
 *
 * Projede halihazırda kullanılan production standardı www'lu adrestir
 * (layout.tsx metadata/JSON-LD, blog JSON-LD, PayTR callback fallback).
 * Canonical, robots ve sitemap çıktılarının tek bir host üretmesi için
 * bu sabit tek kaynak olarak kullanılır. DEĞİŞTİRME — www/non-www mimarisi
 * DNS ve domain yapılandırmasına bağlıdır.
 */
export const SITE_URL = "https://www.decoroys.com";

/** Verilen path için mutlak canonical URL üretir. */
export function canonicalUrl(path: string): string {
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}
