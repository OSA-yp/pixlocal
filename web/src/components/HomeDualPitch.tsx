import { type Locale } from "@/i18n/config";
import { pagePath } from "@/i18n/paths";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";

/** Contextual photo + PDF intro on the home page only — not a nav menu. */
export async function HomeDualPitch() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("home");
  const pdfHref = pagePath(locale, { type: "tool", toolId: "compress-pdf" });
  const homeHref = pagePath(locale, { type: "home" });

  return (
    <aside className="mx-auto mt-10 max-w-3xl px-4 text-center sm:px-6">
      <p className="text-base leading-relaxed text-[var(--ink-soft)] sm:text-lg">
        {t("dualPitch")}
      </p>
      <p className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
        <Link
          href={homeHref}
          prefetch={false}
          className="font-medium text-[var(--brand)] underline-offset-4 hover:underline"
        >
          {t("dualPitchPhoto")}
        </Link>
        <span className="text-[var(--ink-soft)]" aria-hidden>
          ·
        </span>
        <Link
          href={pdfHref}
          prefetch={false}
          className="font-medium text-[var(--brand)] underline-offset-4 hover:underline"
        >
          {t("dualPitchPdf")}
        </Link>
      </p>
    </aside>
  );
}
