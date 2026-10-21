import { isLocale } from "@/i18n/config";
import { siteConfig } from "@/lib/config";
import { buildPageMetadata } from "@/lib/metadata";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildPageMetadata(locale, { type: "legal", page: "terms" });
}

export default async function TermsPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  setRequestLocale(raw);
  const t = await getTranslations("legal");
  const body = t.raw("terms.body") as string[];
  const githubUrl = siteConfig.githubUrl;

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1
        className="text-4xl text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display), serif" }}
      >
        {t("terms.h1")}
      </h1>
      <div className="mt-6 space-y-4 text-[var(--ink-soft)] leading-relaxed">
        {body.map((p) => (
          <p key={p.slice(0, 32)}>{p}</p>
        ))}
        <p>
          <a
            className="text-[var(--brand)] underline-offset-2 hover:underline"
            href={githubUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            {t("terms.github")}
          </a>
        </p>
      </div>
    </article>
  );
}
