import { isLocale, type Locale } from "@/i18n/config";
import { pagePath } from "@/i18n/paths";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return {};
  const t = await getTranslations({ locale: raw, namespace: "common.offline" });
  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
    robots: { index: false, follow: false },
  };
}

export default async function OfflinePage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  setRequestLocale(raw);
  const locale = raw as Locale;
  const t = await getTranslations({ locale, namespace: "common.offline" });
  const homeHref = pagePath(locale, { type: "home" });

  return (
    <article className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
      <h1
        className="text-3xl text-[var(--ink)] sm:text-4xl"
        style={{ fontFamily: "var(--font-display), serif" }}
      >
        {t("pageTitle")}
      </h1>
      <p className="mt-4 text-[var(--ink-soft)] leading-relaxed">
        {t("pageBody")}
      </p>
      <Link
        href={homeHref}
        prefetch={false}
        className="mt-8 inline-flex rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-medium text-white"
      >
        {t("pageHome")}
      </Link>
    </article>
  );
}
