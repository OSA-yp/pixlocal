export const siteConfig = {
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://pixlocal.ru",
  name: "ПиксЛокал",
  contactEmail: "hello@pixlocal.ru",
};

/** Рекламные слоты. Включаются только после появления стабильного трафика. */
export const adsConfig = {
  enabled: process.env.NEXT_PUBLIC_ADS_ENABLED === "true",
  yandexRtb: {
    // Пример: R-A-XXXXXX-1 — подставить после модерации РСЯ
    blockId: process.env.NEXT_PUBLIC_YANDEX_RTB_ID ?? "",
  },
  adsense: {
    client: process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "",
    slotTop: process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP ?? "",
    slotAfter: process.env.NEXT_PUBLIC_ADSENSE_SLOT_AFTER ?? "",
  },
};

export const analyticsConfig = {
  yandexMetrikaId: process.env.NEXT_PUBLIC_YM_ID || "112570778",
  ga4Id: process.env.NEXT_PUBLIC_GA4_ID ?? "",
  yandexVerification: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION ?? "",
  googleVerification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "",
};
