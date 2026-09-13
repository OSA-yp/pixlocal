type FaqItem = { q: string; a: string };

export function Faq({ items }: { items: FaqItem[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <section className="mx-auto mt-16 w-full max-w-3xl px-4 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h2
        className="text-3xl text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display), serif" }}
      >
        Вопросы
      </h2>
      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <details
            key={item.q}
            className="group rounded-2xl border border-[var(--line)] bg-white/55 px-4 py-3 open:bg-white/80"
          >
            <summary className="cursor-pointer list-none font-medium marker:content-none">
              {item.q}
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
