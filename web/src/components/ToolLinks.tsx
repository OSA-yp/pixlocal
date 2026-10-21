"use client";

import { type Locale } from "@/i18n/config";
import { pagePath } from "@/i18n/paths";
import {
  IMAGE_TOOL_IDS,
  PDF_TOOL_IDS,
  TOOL_LINK_ORDER,
  type ToolId,
} from "@/lib/tools";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

function LinkGrid({
  items,
}: {
  items: { href: string; title: string; text: string }[];
}) {
  return (
    <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            prefetch={false}
            className="block rounded-2xl border border-[var(--line)] bg-white/50 px-4 py-4 transition hover:border-[var(--brand)]/40 hover:bg-white/80"
          >
            <span className="font-medium text-[var(--ink)]">{item.title}</span>
            <span className="mt-1 block text-sm text-[var(--ink-soft)]">
              {item.text}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function ToolLinks({
  excludeToolId,
  excludeHome,
}: {
  excludeToolId?: ToolId;
  excludeHome?: boolean;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("common");

  const photoItems: { href: string; title: string; text: string }[] = [];

  if (!excludeHome) {
    photoItems.push({
      href: pagePath(locale, { type: "home" }),
      title: t("homeLink.title"),
      text: t("homeLink.text"),
    });
  }

  for (const id of TOOL_LINK_ORDER) {
    if (!(IMAGE_TOOL_IDS as readonly string[]).includes(id)) continue;
    if (id === excludeToolId) continue;
    photoItems.push({
      href: pagePath(locale, { type: "tool", toolId: id }),
      title: t(`toolLinks.${id}.title`),
      text: t(`toolLinks.${id}.text`),
    });
  }

  const pdfItems = PDF_TOOL_IDS.filter((id) => id !== excludeToolId).map(
    (id) => ({
      href: pagePath(locale, { type: "tool", toolId: id }),
      title: t(`toolLinks.${id}.title`),
      text: t(`toolLinks.${id}.text`),
    }),
  );

  return (
    <section className="mx-auto mt-16 w-full max-w-6xl px-4 sm:px-6">
      <h2
        className="text-3xl text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display), serif" }}
      >
        {t("toolLinksTitle")}
      </h2>

      {photoItems.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--brand)]">
            {t("toolsMenu.photo")}
          </h3>
          <LinkGrid items={photoItems} />
        </div>
      )}

      {pdfItems.length > 0 && (
        <div className="mt-10">
          <h3 className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--brand)]">
            {t("toolsMenu.pdf")}
          </h3>
          <LinkGrid items={pdfItems} />
        </div>
      )}
    </section>
  );
}
