"use client";

import { HEADER_CHIP } from "@/components/headerChip";
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
    <label className="relative inline-flex shrink-0 items-center">
      <span className="sr-only">{t("language")}</span>
      <select
        className={`${HEADER_CHIP} w-[3.25rem] cursor-pointer appearance-none bg-white/70 pe-6 ps-2.5 text-[var(--ink-soft)] hover:border-[var(--brand)]/40 hover:text-[var(--ink)] sm:w-[4.25rem]`}
        value={locale}
        onChange={(e) => onChange(e.target.value as Locale)}
        aria-label={`${t("language")}: ${localeNativeName[locale]}`}
        title={localeNativeName[locale]}
      >
        {locales.map((code) => (
          <option key={code} value={code} title={localeNativeName[code]}>
            {localeShortCode[code]}
          </option>
        ))}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute end-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--ink-soft)]"
      >
        ▾
      </span>
    </label>
  );
}
