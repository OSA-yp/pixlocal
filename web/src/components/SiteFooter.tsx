"use client";

import { brandName, type Locale } from "@/i18n/config";
import { pagePath } from "@/i18n/paths";
import { siteConfig } from "@/lib/config";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

const LICENSES_URL = `${siteConfig.githubUrl}/blob/main/web/LICENSES.md`;

export function SiteFooter() {
  const locale = useLocale() as Locale;
  const t = useTranslations("common");
  const brand = brandName[locale];

  return (
    <footer className="mx-auto mt-16 w-full max-w-6xl border-t border-[var(--line)] px-4 py-10 text-sm text-[var(--ink-soft)] sm:px-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
        <div>
          <p
            className="text-lg text-[var(--ink)]"
            style={{ fontFamily: "var(--font-display), serif" }}
          >
            {brand}
          </p>
          <p className="mt-2 max-w-sm">{t("footer.blurb")}</p>
          <p className="mt-3 max-w-md text-sm font-medium text-[var(--ink)]">
            {t("footer.zeroKnowledge")}
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link
            href={pagePath(locale, { type: "legal", page: "privacy" })}
            className="hover:text-[var(--ink)]"
          >
            {t("footer.privacy")}
          </Link>
          <Link
            href={pagePath(locale, { type: "legal", page: "terms" })}
            className="hover:text-[var(--ink)]"
          >
            {t("footer.terms")}
          </Link>
          <Link
            href={pagePath(locale, { type: "legal", page: "contacts" })}
            className="hover:text-[var(--ink)]"
          >
            {t("footer.contacts")}
          </Link>
          <a
            href={siteConfig.githubUrl}
            rel="noopener noreferrer"
            target="_blank"
            className="hover:text-[var(--ink)]"
          >
            {t("footer.github")}
          </a>
          <a
            href={LICENSES_URL}
            rel="noopener noreferrer"
            target="_blank"
            className="hover:text-[var(--ink)]"
          >
            {t("footer.licenses")}
          </a>
          <a href="/sitemap.xml" className="hover:text-[var(--ink)]">
            {t("footer.sitemap")}
          </a>
        </div>
      </div>
      <p className="mt-8 text-xs opacity-70">
        © {new Date().getFullYear()} {brand}. {t("footer.copyright")}
      </p>
      <p className="mt-2 text-xs opacity-70">
        {t("footer.maker")}{" "}
        <a
          href={siteConfig.githubUrl}
          rel="noopener noreferrer"
          target="_blank"
          className="underline-offset-2 hover:text-[var(--ink)] hover:underline"
        >
          GitHub
        </a>
      </p>
    </footer>
  );
}
