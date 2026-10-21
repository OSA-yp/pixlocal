"use client";

import {
  defaultLocale,
  localeNativeName,
  localeShortCode,
  type Locale,
  locales,
} from "@/i18n/config";
import { writeStoredLocale } from "@/i18n/detect";
import { pageKeyFromPathname, pagePath } from "@/i18n/paths";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";

function toPublicPathname(pathname: string, locale: Locale): string {
  const raw = pathname.replace(/\/$/, "") || "/";
  if (locale === defaultLocale) {
    if (raw === `/${defaultLocale}`) return "/";
    if (raw.startsWith(`/${defaultLocale}/`)) {
      return raw.slice(defaultLocale.length + 1) || "/";
    }
  }
  return raw.startsWith("/") ? raw : `/${raw}`;
}

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("common");

  const onChange = (next: Locale) => {
    writeStoredLocale(next);
    const publicPath = toPublicPathname(pathname, locale);
    const parsed = pageKeyFromPathname(
      locale === defaultLocale ? publicPath : pathname,
    );
    const key = parsed?.key ?? { type: "home" as const };
    router.push(pagePath(next, key));
  };

  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{t("language")}</span>
      <select
        className="max-w-[10.5rem] cursor-pointer appearance-none rounded-full border border-[var(--line)] bg-white/70 py-1.5 pl-3 pr-7 text-xs text-[var(--ink-soft)] hover:border-[var(--brand)]/40 hover:text-[var(--ink)]"
        value={locale}
        onChange={(e) => onChange(e.target.value as Locale)}
        aria-label={t("language")}
      >
        {locales.map((code) => (
          <option key={code} value={code}>
            {localeNativeName[code]} · {localeShortCode[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
