"use client";

import type { Locale } from "@/i18n/config";
import {
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
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
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

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
        className={`rounded-full px-3 py-1.5 text-sm transition ${
          state === "ready"
            ? "bg-[var(--brand)] text-white"
            : state === "working"
              ? "bg-[rgba(15,107,92,0.18)] text-[var(--brand)]"
              : "text-[var(--ink-soft)] ring-1 ring-[var(--line)] hover:bg-white/60 hover:text-[var(--ink)]"
        }`}
      >
        {buttonLabel}
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label={t("navLabel")}
          className="absolute end-0 top-full z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-lg backdrop-blur-md"
        >
          <p className="text-sm leading-relaxed text-[var(--ink-soft)]">
            {t("panelLead")}
          </p>
          <p className="mt-1 text-xs text-[var(--ink-soft)]">{t("sizeHint")}</p>

          {state === "unsupported" ? (
            <p className="mt-3 text-sm text-[var(--brand-hot)]">
              {t("unsupported")}
            </p>
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
                    className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                  >
                    {state === "error" ? t("retry") : t("start")}
                  </button>
                ) : null}
                {state === "ready" ? (
                  <button
                    type="button"
                    onClick={startPack}
                    className="rounded-full px-3 py-1.5 text-xs text-[var(--ink-soft)] ring-1 ring-[var(--line)] hover:bg-white/60"
                  >
                    {t("refresh")}
                  </button>
                ) : null}
                {state === "ready" && installEvent ? (
                  <button
                    type="button"
                    onClick={install}
                    className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white"
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
                <p className="mt-3 text-xs text-[var(--ink-soft)]">
                  {t("workingHint")}
                </p>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
