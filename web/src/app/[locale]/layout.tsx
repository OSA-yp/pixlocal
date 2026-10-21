import { Analytics } from "@/components/Analytics";
import { ProductHuntBanner } from "@/components/ProductHuntBanner";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import {
  brandName,
  isLocale,
  isRtl,
  type Locale,
} from "@/i18n/config";
import { routing } from "@/i18n/routing";
import { rootLayoutMetadata } from "@/lib/metadata";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import {
  Manrope,
  Noto_Sans_Arabic,
  Noto_Sans_Bengali,
  Noto_Sans_Devanagari,
  Noto_Sans_SC,
  Unbounded,
} from "next/font/google";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

const display = Unbounded({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
  weight: "600",
  preload: true,
});

const body = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
  weight: ["400", "600"],
  preload: false,
});

const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-script",
  weight: ["400", "600"],
  preload: false,
});

const notoSc = Noto_Sans_SC({
  subsets: ["latin"],
  variable: "--font-script",
  weight: ["400", "600"],
  preload: false,
});

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-script",
  weight: ["400", "600"],
  preload: false,
});

const notoBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  variable: "--font-script",
  weight: ["400", "600"],
  preload: false,
});

function scriptFontClass(locale: Locale): string {
  switch (locale) {
    case "ar":
      return notoArabic.variable;
    case "zh":
      return notoSc.variable;
    case "hi":
      return notoDevanagari.variable;
    case "bn":
      return notoBengali.variable;
    default:
      return "";
  }
}

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return {};
  return rootLayoutMetadata(raw);
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale: raw } = await params;
  if (!hasLocale(routing.locales, raw) || !isLocale(raw)) {
    notFound();
  }
  const locale = raw;
  setRequestLocale(locale);

  const messages = await getMessages();
  const dir = isRtl(locale) ? "rtl" : "ltr";
  const script = scriptFontClass(locale);
  const useScriptBody = Boolean(script);

  return (
    <html lang={locale} dir={dir}>
      <head>
        <Analytics />
      </head>
      <body
        className={`${display.variable} ${body.variable} ${script} antialiased${
          useScriptBody ? " font-script" : ""
        }`}
        style={
          useScriptBody
            ? {
                fontFamily:
                  "var(--font-script), var(--font-body), system-ui, sans-serif",
              }
            : undefined
        }
        data-brand={brandName[locale]}
      >
        <NextIntlClientProvider messages={messages}>
          <ServiceWorkerRegister />
          <div className="grain" aria-hidden />
          <div className="site-shell">
            <ProductHuntBanner />
            <SiteHeader />
            <main>{children}</main>
            <SiteFooter />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
