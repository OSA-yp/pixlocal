import { siteConfig } from "@/lib/config";
import { isLocale, locales, type Locale } from "./config";

export const LOCALE_STORAGE_KEY = "pixlocal-locale";
export const LOCALE_REDIRECT_GUARD_KEY = "pixlocal-locale-redirected";

const BOT_RE =
  /bot|crawl|spider|slurp|facebookexternalhit|embedly|quora|pinterest|redditbot|baiduspider|yandex(?:bot|images)|bingpreview|google(?:bot|other)|duckduckbot|applebot|semrush|ahrefs|mj12bot|dotbot|petalbot|bytespider/i;

export function isLikelyBot(ua: string = typeof navigator !== "undefined" ? navigator.userAgent : ""): boolean {
  return BOT_RE.test(ua);
}

export function readStoredLocale(): Locale | null {
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (raw && isLocale(raw)) return raw;
  } catch {
    /* private mode */
  }
  return null;
}

export function writeStoredLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
}

/** Map BCP-47 tags to a supported locale, or null if none match. */
export function matchSupportedLocale(tags: readonly string[]): Locale | null {
  for (const tag of tags) {
    const normalized = tag.trim().toLowerCase().replace(/_/g, "-");
    if (!normalized) continue;
    if (isLocale(normalized)) return normalized;
    const base = normalized.split("-")[0];
    if (isLocale(base)) return base;
    // zh-Hans / zh-Hant → zh
    if (base === "zh" && (locales as readonly string[]).includes("zh")) {
      return "zh";
    }
  }
  return null;
}

function browserLanguageTags(): string[] {
  const list: string[] = [];
  if (typeof navigator === "undefined") return list;
  if (Array.isArray(navigator.languages)) {
    list.push(...navigator.languages);
  }
  if (navigator.language) list.push(navigator.language);
  return list;
}

function ruHostnames(): Set<string> {
  const hosts = new Set<string>(["pixlocal.ru", "www.pixlocal.ru"]);
  try {
    const fromEnv = new URL(siteConfig.urlRu).hostname;
    if (fromEnv) {
      hosts.add(fromEnv);
      if (!fromEnv.startsWith("www.")) hosts.add(`www.${fromEnv}`);
    }
  } catch {
    /* ignore */
  }
  return hosts;
}

/** True when serving the Runet host (static build shared with .app). */
export function isRuHost(
  hostname: string = typeof window !== "undefined" ? window.location.hostname : "",
): boolean {
  if (!hostname) return false;
  return ruHostnames().has(hostname.toLowerCase());
}

/**
 * Resolve visitor locale for soft-redirect from EN home:
 * - On pixlocal.ru: prefer Russian unless user explicitly stored another locale.
 * - Elsewhere: storage → browser match → English fallback.
 */
export function resolveVisitorLocale(): Locale {
  const stored = readStoredLocale();

  if (isRuHost()) {
    if (stored && stored !== "ru") return stored;
    return "ru";
  }

  if (stored) return stored;

  const matched = matchSupportedLocale(browserLanguageTags());
  if (matched) return matched;

  return "en";
}
