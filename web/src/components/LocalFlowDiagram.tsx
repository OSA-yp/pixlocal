"use client";

import { useTranslations } from "next-intl";

export type TrustVariant = "image" | "pdf";

function PhotoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="10" r="1.5" />
      <path d="M3 16l5-4 4 3 3-2 6 5" />
    </svg>
  );
}

function DocIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z" />
      <path d="M14 3v6h6" />
      <path d="M9 13h6M9 17h4" />
    </svg>
  );
}

function DeviceIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M10 18h4" />
    </svg>
  );
}

function ResultIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z" />
      <path d="M14 3v6h6" />
      <path d="M9 14h6M9 17h4" />
    </svg>
  );
}

function CloudBlockedIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7.5 18a4.5 4.5 0 0 1-.4-9 5.5 5.5 0 0 1 10.6 1.5A3.5 3.5 0 0 1 18 18H7.5z" />
      <path d="M5 5l14 14" />
    </svg>
  );
}

function Arrow({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M2 8h11M9 4l4 4-4 4" />
    </svg>
  );
}

export function LocalFlowDiagram({
  variant = "image",
}: {
  variant?: TrustVariant;
}) {
  const ns =
    variant === "pdf" ? "common.trustPdf.flow" : "common.trust.flow";
  const t = useTranslations(ns);
  const FileIcon = variant === "pdf" ? DocIcon : PhotoIcon;

  const fileLabel = variant === "pdf" ? t("file") : t("photo");
  const steps = [
    { key: "file", label: fileLabel, Icon: FileIcon },
    { key: "device", label: t("device"), Icon: DeviceIcon },
    { key: "result", label: t("result"), Icon: ResultIcon },
  ] as const;

  return (
    <div
      className="mb-4 flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-[var(--line)] bg-[rgba(15,107,92,0.04)] px-3 py-4 sm:gap-3 sm:px-5"
      aria-label={t("aria")}
    >
      {steps.map((step, index) => (
        <div key={step.key} className="flex items-center gap-2 sm:gap-3">
          {index > 0 ? (
            <Arrow className="h-3.5 w-3.5 shrink-0 text-[var(--brand)] opacity-70" />
          ) : null}
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-[var(--brand)] ring-1 ring-[var(--line)]">
              <step.Icon className="h-5 w-5" />
            </span>
            <span className="max-w-[5.5rem] text-[11px] leading-tight text-[var(--ink-soft)] sm:max-w-none sm:text-xs">
              {step.label}
            </span>
          </div>
        </div>
      ))}

      <div className="mx-1 hidden h-8 w-px bg-[var(--line)] sm:block" aria-hidden />

      <div className="flex flex-col items-center gap-1 text-center">
        <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/60 text-[var(--ink-soft)] opacity-70 ring-1 ring-[var(--line)]">
          <CloudBlockedIcon className="h-5 w-5" />
        </span>
        <span className="max-w-[5.5rem] text-[11px] leading-tight text-[var(--ink-soft)] sm:max-w-none sm:text-xs">
          {t("noCloud")}
        </span>
      </div>
    </div>
  );
}
