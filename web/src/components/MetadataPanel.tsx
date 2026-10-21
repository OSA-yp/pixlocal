"use client";

import { TechDetails } from "@/components/TechDetails";
import type { ImageMetaSummary } from "@/lib/exif";
import { useTranslations } from "next-intl";

type Props = {
  summaries: ImageMetaSummary[];
  stripped: boolean;
};

export function MetadataPanel({ summaries, stripped }: Props) {
  const t = useTranslations("common.meta");
  if (!summaries.length && !stripped) return null;

  const anyGps = summaries.some((s) => s.hasGps);
  const anyMeta = summaries.some((s) => s.hasMeta);

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white/60 px-4 py-3 text-sm">
      <p className="font-medium text-[var(--ink)]">{t("title")}</p>
      <p className="mt-1 text-xs text-[var(--ink-soft)]">{t("localNote")}</p>

      {stripped ? (
        <p className="mt-3 font-medium text-[var(--brand)]">{t("stripped")}</p>
      ) : null}

      {!stripped && anyGps ? (
        <p className="mt-3 font-medium text-[var(--brand-hot)]">{t("gpsWarn")}</p>
      ) : null}

      {!anyMeta && summaries.length ? (
        <p className="mt-3 text-[var(--ink-soft)]">{t("noneFound")}</p>
      ) : null}

      {anyMeta
        ? summaries.map((s) =>
            s.lines.length ? (
              <div key={s.fileName} className="mt-3 border-t border-[var(--line)] pt-3">
                {summaries.length > 1 ? (
                  <p className="text-xs font-medium text-[var(--ink)]">
                    {s.fileName}
                    {stripped ? (
                      <span className="ml-2 text-[var(--brand)]">
                        → {t("cleared")}
                      </span>
                    ) : null}
                  </p>
                ) : null}
                <ul className="mt-1 space-y-1">
                  {s.lines.map((line) => (
                    <li
                      key={`${s.fileName}-${line.key}`}
                      className={
                        line.risk
                          ? "text-[var(--brand-hot)]"
                          : "text-[var(--ink-soft)]"
                      }
                    >
                      <span className="font-medium">{t(`keys.${line.key}`)}:</span>{" "}
                      <span className={stripped ? "line-through opacity-60" : ""}>
                        {line.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null,
          )
        : null}

      {!stripped ? (
        <p className="mt-3 text-xs text-[var(--ink-soft)]">
          {anyGps ? t("hintGps") : t("hintClean")}
        </p>
      ) : null}

      <TechDetails />
    </div>
  );
}
