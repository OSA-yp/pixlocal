"use client";

import { type Locale } from "@/i18n/config";
import { pagePath } from "@/i18n/paths";
import {
  IMAGE_TOOL_IDS,
  PDF_TOOL_IDS,
  TOOL_LINK_ORDER,
  getToolIdBySlug,
  isPdfTool,
  type ToolId,
} from "@/lib/tools";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";

type Tab = "photo" | "pdf";

export function ToolsMenu() {
  const locale = useLocale() as Locale;
  const t = useTranslations("common");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const onPdfPage = useMemo(() => {
    const parts = (pathname ?? "").split("/").filter(Boolean);
    const slug = parts[parts.length - 1] ?? "";
    if (!slug) return false;
    const toolId = getToolIdBySlug(locale, slug);
    return isPdfTool(toolId ?? undefined);
  }, [locale, pathname]);

  const [tab, setTab] = useState<Tab>(onPdfPage ? "pdf" : "photo");

  useEffect(() => {
    if (open) setTab(onPdfPage ? "pdf" : "photo");
  }, [open, onPdfPage]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    if (window.matchMedia("(max-width: 639px)").matches) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const photoIds = TOOL_LINK_ORDER.filter((id) =>
    (IMAGE_TOOL_IDS as readonly string[]).includes(id),
  );

  const photoItems: { href: string; title: string; text: string }[] = [
    {
      href: pagePath(locale, { type: "home" }),
      title: t("homeLink.title"),
      text: t("homeLink.text"),
    },
    ...photoIds.map((id: ToolId) => ({
      href: pagePath(locale, { type: "tool", toolId: id }),
      title: t(`toolLinks.${id}.title`),
      text: t(`toolLinks.${id}.text`),
    })),
  ];

  const pdfItems = PDF_TOOL_IDS.map((id) => ({
    href: pagePath(locale, { type: "tool", toolId: id }),
    title: t(`toolLinks.${id}.title`),
    text: t(`toolLinks.${id}.text`),
  }));

  const isActive = (href: string) => {
    const p = pathname?.replace(/\/$/, "") || "";
    const h = href.replace(/\/$/, "") || "";
    return p === h;
  };

  const linkClass = (href: string) =>
    `block rounded-xl border px-3 py-3 transition ${
      isActive(href)
        ? "border-[var(--brand)] bg-[#eef5ef]"
        : "border-[var(--line)] bg-white hover:border-[var(--brand)]/40 hover:bg-[#eef5ef]"
    }`;

  const renderList = (
    items: { href: string; title: string; text: string }[],
  ) => (
    <ul className="mt-3 grid gap-2 sm:grid-cols-1">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            prefetch={false}
            onClick={() => setOpen(false)}
            className={linkClass(item.href)}
          >
            <span className="block text-sm font-medium text-[var(--ink)]">
              {item.title}
            </span>
            <span className="mt-0.5 block text-xs text-[var(--ink-soft)]">
              {item.text}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <div ref={rootRef} className="relative z-40 shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={() => setOpen((v) => !v)}
        className={`cursor-pointer rounded-full px-3 py-1.5 text-sm transition ${
          open
            ? "bg-[var(--brand)] text-white"
            : "text-[var(--ink-soft)] hover:bg-white/60 hover:text-[var(--ink)]"
        }`}
      >
        {t("toolsMenu.trigger")}
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-[rgba(20,32,26,0.4)]"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div
            id={panelId}
            role="dialog"
            aria-label={t("toolsMenu.trigger")}
            className="fixed inset-x-0 bottom-0 top-14 z-50 flex max-h-[calc(100dvh-3.5rem)] flex-col overflow-hidden rounded-t-3xl border border-[var(--line)] bg-[#f7faf6] shadow-[0_24px_80px_rgba(20,32,26,0.22)] sm:absolute sm:inset-auto sm:end-0 sm:top-full sm:mt-2 sm:max-h-[min(70vh,560px)] sm:w-[min(92vw,42rem)] sm:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3 sm:hidden">
              <p
                className="text-lg text-[var(--ink)]"
                style={{ fontFamily: "var(--font-display), serif" }}
              >
                {t("toolsMenu.trigger")}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="cursor-pointer rounded-full px-3 py-1 text-sm text-[var(--ink-soft)] hover:bg-white/60 hover:text-[var(--ink)]"
              >
                {t("toolsMenu.close")}
              </button>
            </div>

            <p className="border-b border-[var(--line)] px-4 py-2.5 text-center text-xs text-[var(--ink-soft)] sm:px-5">
              {t("toolsMenu.localNote")}
            </p>

            <div className="flex gap-1 border-b border-[var(--line)] px-4 py-2 sm:hidden">
              {(["photo", "pdf"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`flex-1 cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    tab === key
                      ? "bg-[var(--brand)] text-white"
                      : "text-[var(--ink-soft)] hover:bg-white/60 hover:text-[var(--ink)]"
                  }`}
                >
                  {t(`toolsMenu.${key}`)}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
              <div className="hidden sm:grid sm:grid-cols-2 sm:gap-6">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--brand)]">
                    {t("toolsMenu.photo")}
                  </p>
                  {renderList(photoItems)}
                </div>
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--brand)]">
                    {t("toolsMenu.pdf")}
                  </p>
                  {renderList(pdfItems)}
                </div>
              </div>

              <div className="sm:hidden">
                {tab === "photo" ? (
                  <>
                    <p className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--brand)]">
                      {t("toolsMenu.photo")}
                    </p>
                    {renderList(photoItems)}
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--brand)]">
                      {t("toolsMenu.pdf")}
                    </p>
                    {renderList(pdfItems)}
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
