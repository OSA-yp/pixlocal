import { Faq } from "@/components/Faq";
import { HomeDualPitch } from "@/components/HomeDualPitch";
import { ImageTool, type ToolPreset } from "@/components/ImageTool";
import { PdfTool } from "@/components/PdfTool";
import { RedactTool } from "@/components/RedactTool";
import { TechDetails } from "@/components/TechDetails";
import { ToolLinks } from "@/components/ToolLinks";
import { TrustStrip } from "@/components/TrustStrip";
import { brandName, type Locale } from "@/i18n/config";
import { absolutePageUrl, type PageKey } from "@/i18n/paths";
import { siteConfig } from "@/lib/config";
import { isPdfTool, type ToolId } from "@/lib/tools";
import { getLocale, getTranslations } from "next-intl/server";

type Props = {
  preset: ToolPreset;
  h1: string;
  lead: string;
  body: string[];
  faq: { q: string; a: string }[];
  pageKey: PageKey;
  toolId?: ToolId;
};

export async function ToolPage({
  preset,
  h1,
  lead,
  body,
  faq,
  pageKey,
  toolId,
}: Props) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("common");
  const brand = brandName[locale];
  const features = t.raw("schemaFeatures") as string[];

  const appLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `${brand} — ${preset.title}`,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "RUB" },
    description: lead,
    inLanguage: locale,
    featureList: features,
  };

  const homeUrl = absolutePageUrl(locale, { type: "home" });
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement:
      pageKey.type === "home"
        ? [
            {
              "@type": "ListItem",
              position: 1,
              name: brand,
              item: siteConfig.url,
            },
          ]
        : [
            {
              "@type": "ListItem",
              position: 1,
              name: t("breadcrumbHome"),
              item: homeUrl,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: h1,
              item: absolutePageUrl(locale, pageKey),
            },
          ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <section className="mx-auto max-w-6xl px-4 pb-8 pt-4 sm:px-6 sm:pt-8">
        <p className="animate-rise text-sm uppercase tracking-[0.2em] text-[var(--brand)]">
          {brand}
        </p>
        <h1
          className="animate-rise-delay mt-3 max-w-3xl text-4xl leading-[1.05] text-[var(--ink)] sm:text-6xl"
          style={{ fontFamily: "var(--font-display), serif" }}
        >
          {h1}
        </h1>
        <p className="animate-rise-delay-2 mt-4 max-w-2xl text-lg text-[var(--ink-soft)]">
          {lead}
        </p>
      </section>

      <TrustStrip variant={isPdfTool(toolId) ? "pdf" : "image"} />

      <div className="animate-rise-delay-2">
        {isPdfTool(toolId) ? (
          <PdfTool toolId={toolId} />
        ) : toolId === "skryt-oblast" ? (
          <RedactTool />
        ) : (
          <ImageTool preset={preset} toolId={toolId} />
        )}
      </div>

      {pageKey.type === "home" ? <HomeDualPitch /> : null}

      <article className="mx-auto mt-14 max-w-3xl px-4 text-[var(--ink-soft)] sm:px-6">
        {body.map((p) => (
          <p key={p.slice(0, 24)} className="mb-4 leading-relaxed">
            {p}
          </p>
        ))}
        {toolId === "udalit-exif" ||
        toolId === "skryt-oblast" ||
        toolId === "compress-pdf" ||
        toolId === "pdf-sanitize" ? (
          <TechDetails
            className="mt-6"
            bodyKey={
              toolId === "compress-pdf"
                ? "techBodyPdfCompress"
                : toolId === "pdf-sanitize"
                  ? "techBodyPdfSanitize"
                  : undefined
            }
          />
        ) : null}
      </article>

      <Faq items={faq} />
      <ToolLinks
        excludeToolId={toolId}
        excludeHome={pageKey.type === "home"}
      />
    </>
  );
}
