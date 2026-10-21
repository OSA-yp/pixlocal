import { defaultLocale, type Locale } from "@/i18n/config";
import { pagePath } from "@/i18n/paths";
import { canonicalPath } from "@/lib/config";
import { TOOL_IDS } from "@/lib/tools";

function offlinePagePath(locale: Locale): string {
  const prefix = locale === defaultLocale ? "" : `/${locale}`;
  return canonicalPath(prefix ? `${prefix}/offline` : "/offline");
}

/** HTML URLs for one locale only (home + tools + privacy + offline). */
export function offlineLocaleUrls(locale: Locale): string[] {
  return [
    pagePath(locale, { type: "home" }),
    ...TOOL_IDS.map((toolId) => pagePath(locale, { type: "tool", toolId })),
    pagePath(locale, { type: "legal", page: "privacy" }),
    offlinePagePath(locale),
  ];
}

export function offlineReadyStorageKey(locale: Locale): string {
  return `pixlocal-offline-ready:${locale}`;
}

export function isOfflineReady(locale: Locale): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(offlineReadyStorageKey(locale)) === "1";
  } catch {
    return false;
  }
}

export function setOfflineReady(locale: Locale, ready: boolean): void {
  if (typeof window === "undefined") return;
  try {
    const key = offlineReadyStorageKey(locale);
    if (ready) window.localStorage.setItem(key, "1");
    else window.localStorage.removeItem(key);
  } catch {
    /* ignore quota / private mode */
  }
}
