export const locales = [
  "en",
  "ru",
  "zh",
  "hi",
  "es",
  "ar",
  "fr",
  "bn",
  "pt",
  "id",
] as const;

export type Locale = (typeof locales)[number];

/** English at site root (`/`); Russian lives under `/ru/`. */
export const defaultLocale: Locale = "en";

export const rtlLocales: readonly Locale[] = ["ar"];

export function isRtl(locale: string): boolean {
  return (rtlLocales as readonly string[]).includes(locale);
}

/** Open Graph locale tags */
export const ogLocale: Record<Locale, string> = {
  ru: "ru_RU",
  en: "en_US",
  zh: "zh_CN",
  hi: "hi_IN",
  es: "es_ES",
  ar: "ar_SA",
  fr: "fr_FR",
  bn: "bn_BD",
  pt: "pt_BR",
  id: "id_ID",
};

export const brandName: Record<Locale, string> = {
  ru: "PixLocal",
  en: "PixLocal",
  zh: "PixLocal",
  hi: "PixLocal",
  es: "PixLocal",
  ar: "PixLocal",
  fr: "PixLocal",
  bn: "PixLocal",
  pt: "PixLocal",
  id: "PixLocal",
};

/** Native labels for the language switcher */
export const localeNativeName: Record<Locale, string> = {
  ru: "Русский",
  en: "English",
  zh: "中文",
  hi: "हिन्दी",
  es: "Español",
  ar: "العربية",
  fr: "Français",
  bn: "বাংলা",
  pt: "Português",
  id: "Indonesia",
};

/** Short codes shown next to native names in the language switcher */
export const localeShortCode: Record<Locale, string> = {
  ru: "RU",
  en: "EN",
  zh: "ZH",
  hi: "HI",
  es: "ES",
  ar: "AR",
  fr: "FR",
  bn: "BN",
  pt: "PT",
  id: "ID",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
