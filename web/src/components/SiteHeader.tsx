"use client";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
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
    <header className="relative z-30 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
      <Link
        href={pagePath(locale, { type: "home" })}
        prefetch={false}
        className="group flex items-baseline gap-2"
      >
        <span
          className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)] sm:text-3xl"
          style={{ fontFamily: "var(--font-display), serif" }}
        >
          {brandName[locale]}
        </span>
        <span className="hidden text-xs uppercase tracking-[0.18em] text-[var(--ink-soft)] sm:inline">
          {t("brandTagline")}
        </span>
      </Link>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <nav className="flex flex-wrap items-center justify-end gap-1 text-sm sm:gap-2">
          <Link
            href={homeHref.endsWith("/") || homeHref === "/" ? homeHref : `${homeHref}/`}
            prefetch={false}
            className={`rounded-full px-3 py-1.5 transition ${
              homeActive
                ? "bg-[var(--brand)] text-white"
                : "text-[var(--ink-soft)] hover:bg-white/60 hover:text-[var(--ink)]"
            }`}
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
