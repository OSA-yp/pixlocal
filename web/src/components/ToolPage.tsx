import { AdSlot } from "@/components/AdSlot";
import { Faq } from "@/components/Faq";
import { ImageTool, type ToolPreset } from "@/components/ImageTool";
import { ToolLinks } from "@/components/ToolLinks";

type Props = {
  preset: ToolPreset;
  h1: string;
  lead: string;
  body: string[];
  faq: { q: string; a: string }[];
  path: string;
};

export function ToolPage({ preset, h1, lead, body, faq, path }: Props) {
  const appLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `ПиксЛокал — ${preset.title}`,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "RUB" },
    description: lead,
    inLanguage: "ru",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }}
      />
      <section className="mx-auto max-w-6xl px-4 pb-8 pt-4 sm:px-6 sm:pt-8">
        <p className="animate-rise text-sm uppercase tracking-[0.2em] text-[var(--brand)]">
          ПиксЛокал
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

      <AdSlot placement="top" />
      <div className="animate-rise-delay-2">
        <ImageTool preset={preset} />
      </div>
      <AdSlot placement="after" />

      <article className="mx-auto mt-14 max-w-3xl px-4 text-[var(--ink-soft)] sm:px-6">
        {body.map((p) => (
          <p key={p.slice(0, 24)} className="mb-4 leading-relaxed">
            {p}
          </p>
        ))}
      </article>

      <Faq items={faq} />
      <ToolLinks exclude={path} />
    </>
  );
}
