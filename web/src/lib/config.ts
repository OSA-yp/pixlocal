export const siteConfig = {
  /** Primary international canonical host (GitHub Pages). */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://pixlocal.app",
  /** Runet host (Yandex Object Storage) — preferred for `ru` hreflang. */
  urlRu: process.env.NEXT_PUBLIC_SITE_URL_RU ?? "https://pixlocal.ru",
  name: "PixLocal",
  contactEmail: "sergey.xdr@gmail.com",
  githubUrl: "https://github.com/OSA-yp/pixlocal",
  /** Дата смыслового обновления контента — для sitemap lastmod, не «сейчас». */
  contentUpdated: "2026-10-20",
  indexNowKey: "7f3a9c2e4b18d056a91c4e8f02b7d3c5",
};

/** Канонический путь под `trailingSlash: true` (статика в Object Storage). */
export function canonicalPath(path: string): string {
  if (path === "" || path === "/") return "/";
  return path.endsWith("/") ? path : `${path}/`;
}

export const analyticsConfig = {
  /** pixlocal.app (и прочие не-ru хосты). */
  ga4Id: process.env.NEXT_PUBLIC_GA4_ID ?? "",
  /** pixlocal.ru — отдельный поток GA4. */
  ga4IdRu: process.env.NEXT_PUBLIC_GA4_ID_RU ?? "",
  yandexVerification:
    process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || "75ecea8009b278fe",
  googleVerification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "",
};
