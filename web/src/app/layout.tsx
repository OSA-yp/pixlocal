import type { Metadata } from "next";
import { Manrope, Unbounded } from "next/font/google";
import { Analytics } from "@/components/Analytics";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { analyticsConfig, siteConfig } from "@/lib/config";
import "./globals.css";

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

const siteUrl = siteConfig.url;
const { yandexVerification, googleVerification } = analyticsConfig;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ПиксЛокал — сжать и конвертировать фото в браузере",
    template: "%s · ПиксЛокал",
  },
  description:
    "Сжимайте и конвертируйте JPG, PNG, WebP и HEIC онлайн бесплатно. Файлы обрабатываются локально и не загружаются на сервер.",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "ПиксЛокал",
    title: "ПиксЛокал — сжать фото онлайн в браузере",
    description:
      "Приватное сжатие и конвертация изображений без регистрации. HEIC, WebP, PNG, JPG.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ПиксЛокал — сжать фото онлайн в браузере",
    description:
      "Приватное сжатие и конвертация изображений без регистрации. HEIC, WebP, PNG, JPG.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  ...(yandexVerification || googleVerification
    ? {
        verification: {
          ...(yandexVerification ? { yandex: yandexVerification } : {}),
          ...(googleVerification ? { google: googleVerification } : {}),
        },
      }
    : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <div className="grain" aria-hidden />
        <div className="site-shell">
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </div>
        <Analytics />
      </body>
    </html>
  );
}
