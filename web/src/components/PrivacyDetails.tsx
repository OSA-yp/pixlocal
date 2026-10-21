"use client";

import type { TrustVariant } from "@/components/LocalFlowDiagram";
import { useTranslations } from "next-intl";

export function PrivacyDetails({
  className = "",
  variant = "image",
}: {
  className?: string;
  variant?: TrustVariant;
}) {
  const ns =
    variant === "pdf" ? "common.privacyDetailsPdf" : "common.privacyDetails";
  const t = useTranslations(ns);
  return (
    <details
      className={`group mx-auto mt-3 max-w-6xl rounded-xl border border-[var(--line)] bg-white/40 px-3 py-2 text-xs text-[var(--ink-soft)] ${className}`}
    >
      <summary className="cursor-pointer font-medium text-[var(--ink)] marker:content-none list-none [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="text-[var(--brand)] transition group-open:rotate-90"
            aria-hidden
          >
            ▸
          </span>
          {t("title")}
        </span>
      </summary>
      <p className="mt-2 leading-relaxed">{t("body")}</p>
    </details>
  );
}
