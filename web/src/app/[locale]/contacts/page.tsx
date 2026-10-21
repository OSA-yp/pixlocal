import { isLocale, type Locale } from "@/i18n/config";
import { buildPageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/config";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildPageMetadata(locale, { type: "legal", page: "contacts" });
}

export default async function ContactsPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  setRequestLocale(raw);
  const locale = raw as Locale;
  const t = await getTranslations({ locale, namespace: "legal" });
  const email = siteConfig.contactEmail;
  const githubUrl = siteConfig.githubUrl;

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1
        className="text-4xl text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display), serif" }}
      >
        {t("contacts.h1")}
      </h1>
      <div className="mt-6 space-y-4 text-[var(--ink-soft)] leading-relaxed">
        <p>{t("contacts.intro")}</p>
        <p>
          <a
            className="text-[var(--brand)] underline-offset-2 hover:underline"
            href={`mailto:${email}`}
          >
            {email}
          </a>
        </p>
        <p>
          <a
            className="text-[var(--brand)] underline-offset-2 hover:underline"
            href={githubUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            {t("contacts.github")}
          </a>
        </p>
      </div>
    </article>
  );
}
