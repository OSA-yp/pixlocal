import { canonicalPath, siteConfig } from "@/lib/config";
import {
  TOOL_IDS,
  getToolIdBySlug,
  getToolSlug,
  type ToolId,
} from "@/lib/tools";
import {
  defaultLocale,
  isLocale,
  type Locale,
  locales,
} from "./config";

const LEGAL = ["privacy", "terms", "contacts"] as const;
export type LegalPage = (typeof LEGAL)[number];

export type PageKey =
  | { type: "home" }
  | { type: "legal"; page: LegalPage }
  | { type: "tool"; toolId: ToolId };

export function localePrefix(locale: Locale): string {
  return locale === defaultLocale ? "" : `/${locale}`;
}

/** Path with trailing slash, including locale prefix when needed. */
export function pagePath(locale: Locale, key: PageKey): string {
  const prefix = localePrefix(locale);
  if (key.type === "home") return canonicalPath(prefix || "/");
  if (key.type === "legal") return canonicalPath(`${prefix}/${key.page}`);
  const slug = getToolSlug(key.toolId, locale);
  return canonicalPath(`${prefix}/${slug}`);
}

export function absolutePageUrl(locale: Locale, key: PageKey): string {
  const base = (
    locale === "ru" ? siteConfig.urlRu : siteConfig.url
  ).replace(/\/$/, "");
  const path = pagePath(locale, key);
  return path === "/" ? `${base}/` : `${base}${path}`;
}

/** hreflang map (absolute URLs) for a logical page across all locales */
export function languageAlternates(key: PageKey): Record<string, string> {
  const map: Record<string, string> = {};
  for (const locale of locales) {
    map[locale] = absolutePageUrl(locale, key);
  }
  map["x-default"] = absolutePageUrl(defaultLocale, key);
  return map;
}

export function parsePageKey(
  locale: Locale,
  slug?: string,
): PageKey | null {
  if (!slug) return { type: "home" };
  if ((LEGAL as readonly string[]).includes(slug)) {
    return { type: "legal", page: slug as LegalPage };
  }
  const toolId = getToolIdBySlug(locale, slug);
  if (toolId) return { type: "tool", toolId };
  return null;
}

/** Resolve current page key from a pathname like /en/heic-to-jpg/ */
export function pageKeyFromPathname(pathname: string): {
  locale: Locale;
  key: PageKey;
} | null {
  const clean = pathname.replace(/\/$/, "") || "/";
  const parts = clean.split("/").filter(Boolean);

  if (parts.length === 0) {
    return { locale: defaultLocale, key: { type: "home" } };
  }

  if (isLocale(parts[0]) && parts[0] !== defaultLocale) {
    const locale = parts[0];
    if (parts.length === 1) return { locale, key: { type: "home" } };
    const key = parsePageKey(locale, parts[1]);
    if (!key || (key.type === "tool" && parts.length > 2)) return null;
    return { locale, key };
  }

  const key = parsePageKey(defaultLocale, parts[0]);
  if (!key || parts.length > 1) return null;
  return { locale: defaultLocale, key };
}

export function allToolStaticParams(): { locale: string; toolSlug: string }[] {
  const params: { locale: string; toolSlug: string }[] = [];
  for (const locale of locales) {
    for (const toolId of TOOL_IDS) {
      params.push({ locale, toolSlug: getToolSlug(toolId, locale) });
    }
  }
  return params;
}

export { LEGAL };
