"use client";

import { useTranslations } from "next-intl";

export function TechDetails({
  className = "",
  bodyKey = "techBody",
}: {
  className?: string;
  bodyKey?: "techBody" | "techBodyPdfCompress" | "techBodyPdfSanitize";
}) {
  const t = useTranslations("common.meta");
  return (
    <details
      className={`group mt-3 rounded-xl border border-[var(--line)] bg-white/40 px-3 py-2 text-xs text-[var(--ink-soft)] ${className}`}
    >
      <summary className="cursor-pointer font-medium text-[var(--ink)] marker:content-none list-none [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="text-[var(--brand)] transition group-open:rotate-90"
            aria-hidden
          >
            ▸
          </span>
          {t("techTitle")}
        </span>
      </summary>
      <p className="mt-2 leading-relaxed">{t(bodyKey)}</p>
    </details>
  );
}
