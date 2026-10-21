import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  brandName,
  ogLocale,
  type Locale,
  locales,
} from "@/i18n/config";
import {
  absolutePageUrl,
  languageAlternates,
  type PageKey,
} from "@/i18n/paths";
import { analyticsConfig, siteConfig } from "@/lib/config";

type ToolMessages = {
  title: string;
  description: string;
  h1: string;
  lead: string;
  body: string[];
  faq: { q: string; a: string }[];
};

export async function buildPageMetadata(
  locale: Locale,
  key: PageKey,
): Promise<Metadata> {
  const brand = brandName[locale];
  const languages = languageAlternates(key);
  const { yandexVerification, googleVerification } = analyticsConfig;

  let title: string;
  let description: string;

  if (key.type === "home") {
    const t = await getTranslations({ locale, namespace: "home" });
    title = t("title");
    description = t("description");
  } else if (key.type === "legal") {
    const t = await getTranslations({ locale, namespace: "legal" });
    title = t(`${key.page}.title`);
    description = t(`${key.page}.description`);
  } else {
    const t = await getTranslations({ locale, namespace: "tools" });
    const raw = t.raw(key.toolId) as ToolMessages;
    title = raw.title;
    description = raw.description;
  }

  const ogLocales = locales
    .filter((l) => l !== locale)
    .map((l) => ogLocale[l]);

  return {
    title,
    description,
    alternates: {
      // Absolute: relative paths resolve against metadataBase (.app) and break ru → .ru
      canonical: absolutePageUrl(locale, key),
      languages,
    },
    openGraph: {
      title,
      description,
      url: absolutePageUrl(locale, key),
      locale: ogLocale[locale],
      alternateLocale: ogLocales,
      siteName: brand,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: { index: true, follow: true },
    ...(yandexVerification || googleVerification
      ? {
          verification: {
            ...(yandexVerification ? { yandex: yandexVerification } : {}),
            ...(googleVerification ? { google: googleVerification } : {}),
          },
        }
      : {}),
  };
}

export async function rootLayoutMetadata(locale: Locale): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "common" });
  const brand = brandName[locale];
  return {
    metadataBase: new URL(
      locale === "ru" ? siteConfig.urlRu : siteConfig.url,
    ),
    title: {
      default: t("layout.titleDefault"),
      template: t("layout.titleTemplate"),
    },
    description: t("layout.description"),
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: brand,
    },
    openGraph: {
      type: "website",
      locale: ogLocale[locale],
      siteName: brand,
      title: t("layout.ogTitle"),
      description: t("layout.ogDescription"),
    },
    twitter: {
      card: "summary_large_image",
      title: t("layout.ogTitle"),
      description: t("layout.ogDescription"),
    },
    robots: { index: true, follow: true },
  };
}
