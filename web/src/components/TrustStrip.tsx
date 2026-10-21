"use client";

import { LocalFlowDiagram, type TrustVariant } from "@/components/LocalFlowDiagram";
import { PrivacyDetails } from "@/components/PrivacyDetails";
import { TrustItemIcon } from "@/components/TrustIcons";
import { useTranslations } from "next-intl";

export function TrustStrip({ variant = "image" }: { variant?: TrustVariant }) {
  const trustNs = variant === "pdf" ? "common.trustPdf" : "common.trust";
  const t = useTranslations(trustNs);
  const items = t.raw("items") as { title: string; text: string }[];
  const hook = t.has("hook") ? t("hook").trim() : "";

  return (
    <section
      className="mx-auto max-w-6xl px-4 pb-6 sm:px-6"
      aria-label={t("aria")}
    >
      <LocalFlowDiagram variant={variant} />
      {hook ? (
        <p className="mb-3 text-center text-sm font-medium text-[var(--brand)]">
          {hook}
        </p>
      ) : null}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((fact, index) => (
          <li
            key={fact.title}
            className="rounded-2xl border border-[var(--line)] bg-[rgba(15,107,92,0.04)] px-4 py-3"
          >
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/80 text-[var(--brand)] ring-1 ring-[var(--line)]">
                <TrustItemIcon index={index} className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-[var(--brand)]">
                  {fact.title}
                </p>
                <p className="mt-1 text-sm leading-snug text-[var(--ink-soft)]">
                  {fact.text}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="px-0 sm:px-0">
        <PrivacyDetails variant={variant} className="mt-4 w-full max-w-none" />
      </div>
    </section>
  );
}
