"use client";

import { HEADER_CHIP } from "@/components/headerChip";
import type { Locale } from "@/i18n/config";
import {
  clearOfflinePack,
  offlinePackAvailable,
  runOfflinePack,
  type OfflineStepId,
} from "@/lib/offline-pack";
import { isOfflineReady, setOfflineReady } from "@/lib/offline-urls";
import { track } from "@/lib/track";
import { useLocale, useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

type UiState = "idle" | "working" | "ready" | "unsupported" | "error";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const STEPS: OfflineStepId[] = ["pages", "images", "pdf", "done"];

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function OfflineFeature() {
  const t = useTranslations("common.offline");
  const locale = useLocale() as Locale;
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<UiState>("idle");
  const [step, setStep] = useState<OfflineStepId | null>(null);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (!offlinePackAvailable()) {
      setState("unsupported");
      return;
    }
    setState(isOfflineReady(locale) ? "ready" : "idle");
  }, [locale]);

  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    setShowIosHint(isIos());
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDoc);
      document.removeEventListener("keydown", onKey);
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

  const toggle = () => {
    setOpen((v) => {
      const next = !v;
      if (next) track("offline_panel_open", { locale });
      return next;
    });
  };

  const startPack = useCallback(async () => {
    if (state === "working" || state === "unsupported") return;
    setState("working");
    setError(null);
    setStep("pages");
    setDone(0);
    setTotal(0);
    track("offline_pack_start", { locale });

    try {
      const result = await runOfflinePack(locale, (p) => {
        setStep(p.step);
        setDone(p.done);
        setTotal(p.total);
        track("offline_pack_step", { locale, step: p.step });
      });
      if (!result.ok && result.failedPages > 0) {
        setState("error");
        setError(t("errorPartial", { failed: result.failedPages }));
        track("offline_pack_error", { locale, failed: result.failedPages });
        return;
      }
      setState("ready");
      track("offline_pack_done", { locale });
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : t("errorGeneric"));
      setOfflineReady(locale, false);
      track("offline_pack_error", { locale });
    }
  }, [locale, state, t]);

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
    track("offline_install_click", { locale });
  };

  const clearPack = async () => {
    if (state === "working") return;
    setError(null);
    try {
      await clearOfflinePack(locale);
      setState("idle");
      setStep(null);
      setDone(0);
      setTotal(0);
      track("offline_pack_clear", { locale });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorGeneric"));
      track("offline_pack_error", { locale, step: "clear" });
    }
  };

  const stepLabel = (id: OfflineStepId) => {
    switch (id) {
      case "pages":
        return t("stepPages");
      case "images":
        return t("stepImages");
      case "pdf":
        return t("stepPdf");
      case "done":
        return t("stepDone");
    }
  };

  const buttonLabel =
    state === "ready"
      ? t("readyBadge")
      : state === "working"
        ? t("workingBadge")
        : t("navLabel");

  const chipClass =
    state === "ready" || open
      ? `${HEADER_CHIP} border-transparent bg-[var(--brand)] text-white`
      : state === "working"
        ? `${HEADER_CHIP} border-transparent bg-[rgba(15,107,92,0.18)] text-[var(--brand)]`
        : `${HEADER_CHIP} bg-white/70 text-[var(--ink-soft)] hover:border-[var(--brand)]/40 hover:text-[var(--ink)]`;

  const panelBody = (
    <>
      <p className="text-sm leading-relaxed text-[var(--ink-soft)]">
        {t("panelLead")}
      </p>
      <p className="mt-1 text-xs text-[var(--ink-soft)]">{t("sizeHint")}</p>

      {state === "unsupported" ? (
        <p className="mt-3 text-sm text-[var(--brand-hot)]">{t("unsupported")}</p>
      ) : (
        <>
          <ol className="mt-3 space-y-2">
            {STEPS.map((id) => {
              const active = step === id && state === "working";
              const completed =
                state === "ready" ||
                (state === "working" &&
                  STEPS.indexOf(id) < STEPS.indexOf(step ?? "pages")) ||
                (state === "error" &&
                  STEPS.indexOf(id) < STEPS.indexOf(step ?? "pages"));
              return (
                <li
                  key={id}
                  className={`flex items-start gap-2 text-sm ${
                    active
                      ? "text-[var(--brand)]"
                      : completed
                        ? "text-[var(--ink)]"
                        : "text-[var(--ink-soft)]"
                  }`}
                >
                  <span aria-hidden className="mt-0.5 w-4 shrink-0">
                    {completed ? "✓" : active ? "…" : "○"}
                  </span>
                  <span className="min-w-0 flex-1">
                    {stepLabel(id)}
                    {active && id === "pages" && total > 0 ? (
                      <span className="ms-1 tabular-nums">
                        {done}/{total}
                      </span>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ol>

          {state === "working" && total > 0 && step === "pages" ? (
            <div
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-[rgba(15,107,92,0.12)]"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={done}
            >
              <div
                className="h-full rounded-full bg-[var(--brand)] transition-[width]"
                style={{ width: `${Math.round((done / total) * 100)}%` }}
              />
            </div>
          ) : null}

          {error ? (
            <p className="mt-3 text-sm text-[var(--brand-hot)]">{error}</p>
          ) : null}

          {state === "ready" ? (
            <p className="mt-3 text-sm font-medium text-[var(--brand)]">
              {t("readyMessage")}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            {state === "idle" || state === "error" ? (
              <button
                type="button"
                onClick={startPack}
                className="rounded-full bg-[var(--brand)] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
              >
                {state === "error" ? t("retry") : t("start")}
              </button>
            ) : null}
            {state === "ready" ? (
              <>
                <button
                  type="button"
                  onClick={startPack}
                  className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs text-[var(--ink-soft)] hover:bg-white/60"
                >
                  {t("refresh")}
                </button>
                <button
                  type="button"
                  onClick={clearPack}
                  className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs text-[var(--ink-soft)] hover:border-[var(--brand-hot)]/50 hover:text-[var(--brand-hot)]"
                >
                  {t("clear")}
                </button>
              </>
            ) : null}
            {state === "ready" && installEvent ? (
              <button
                type="button"
                onClick={install}
                className="rounded-full bg-[var(--brand)] px-4 py-2.5 text-sm font-medium text-white"
              >
                {t("install")}
              </button>
            ) : null}
          </div>

          {state === "ready" && showIosHint && !installEvent ? (
            <p className="mt-3 text-xs leading-relaxed text-[var(--ink-soft)]">
              {t("installIos")}
            </p>
          ) : null}

          {state === "working" ? (
            <p className="mt-3 text-xs text-[var(--ink-soft)]">{t("workingHint")}</p>
          ) : null}
        </>
      )}
    </>
  );

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={toggle}
          className={chipClass}
        >
          {buttonLabel}
        </button>
        {state === "ready" ? (
          <p
            className="hidden max-w-[9.5rem] text-end text-[10px] leading-tight text-[var(--brand)] sm:block"
            aria-live="polite"
          >
            <span className="me-1 inline-block h-1.5 w-1.5 rounded-full bg-[var(--brand)]" aria-hidden />
            {t("readyHint")}
          </p>
        ) : null}
      </div>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-[rgba(20,32,26,0.4)] sm:hidden"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div
            id={panelId}
            role="dialog"
            aria-label={t("navLabel")}
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[min(85dvh,36rem)] flex-col overflow-hidden rounded-t-3xl border border-[var(--line)] bg-[#f7faf6] shadow-[0_24px_80px_rgba(20,32,26,0.22)] sm:absolute sm:inset-auto sm:end-0 sm:top-full sm:mt-2 sm:max-h-[min(70vh,28rem)] sm:w-[min(22rem,calc(100vw-2rem))] sm:rounded-2xl sm:bg-[var(--surface)] sm:shadow-lg sm:backdrop-blur-md"
          >
            <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3 sm:hidden">
              <p
                className="text-lg text-[var(--ink)]"
                style={{ fontFamily: "var(--font-display), serif" }}
              >
                {t("navLabel")}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="cursor-pointer rounded-full px-3 py-1 text-sm text-[var(--ink-soft)] hover:bg-white/60 hover:text-[var(--ink)]"
              >
                {t("close")}
              </button>
            </div>
            <div className="overflow-y-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-4 sm:pb-4">
              {panelBody}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
