"use client";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { HEADER_CHIP } from "@/components/headerChip";
import { OfflineFeature } from "@/components/OfflineFeature";
import { ToolsMenu } from "@/components/ToolsMenu";
import { brandName, defaultLocale, type Locale } from "@/i18n/config";
import { pagePath } from "@/i18n/paths";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** Map App Router pathname (/ru/...) to public URL (/...) for default locale. */
function publicPath(pathname: string, locale: Locale): string {
  let p = pathname.replace(/\/$/, "") || "/";
  if (locale === defaultLocale) {
    if (p === `/${defaultLocale}`) return "/";
    if (p.startsWith(`/${defaultLocale}/`)) {
      p = p.slice(defaultLocale.length + 1) || "/";
    }
  }
  return p;
}

export function SiteHeader() {
  const locale = useLocale() as Locale;
  const t = useTranslations("common");
  const pathname = usePathname();
  const current = publicPath(pathname, locale);
  const homeHref = pagePath(locale, { type: "home" }).replace(/\/$/, "") || "/";
  const homeActive = current === homeHref || current === "/";

  return (
    <header className="relative z-30 mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
      <Link
        href={pagePath(locale, { type: "home" })}
        prefetch={false}
        className="group flex min-w-0 shrink items-baseline gap-2"
      >
        <span
          className="block truncate font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--ink)] sm:text-3xl"
          style={{ fontFamily: "var(--font-display), serif" }}
        >
          {brandName[locale]}
        </span>
        <span className="hidden text-xs uppercase tracking-[0.18em] text-[var(--ink-soft)] sm:inline">
          {t("brandTagline")}
        </span>
      </Link>
      <div className="flex shrink-0 flex-nowrap items-center justify-end gap-1.5">
        <nav className="flex flex-nowrap items-center gap-1.5 text-sm">
          <Link
            href={
              homeHref.endsWith("/") || homeHref === "/"
                ? homeHref
                : `${homeHref}/`
            }
            prefetch={false}
            className={
              homeActive
                ? `${HEADER_CHIP} border-transparent bg-[var(--brand)] text-white`
                : `${HEADER_CHIP} bg-white/70 text-[var(--ink-soft)] hover:border-[var(--brand)]/40 hover:text-[var(--ink)]`
            }
          >
            {t("nav.compress")}
          </Link>
          <ToolsMenu />
        </nav>
        <OfflineFeature />
        <LanguageSwitcher />
      </div>
    </header>
  );
}
