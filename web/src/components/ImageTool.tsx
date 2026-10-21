"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  canShareFiles,
  formatBytes,
  isProcessErrorCode,
  needsReencode,
  processImageFile,
  savingsPercent,
  type OutputFormat,
  type ProcessMode,
  type ProcessedFile,
} from "@/lib/image";
import { MetadataPanel } from "@/components/MetadataPanel";
import { ShieldIcon } from "@/components/TrustIcons";
import { inspectImageMetas, type ImageMetaSummary } from "@/lib/exif";
import { pagePath } from "@/i18n/paths";
import { type Locale } from "@/i18n/config";
import { type ToolId } from "@/lib/tools";
import { TRACK_GOALS, track } from "@/lib/track";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

export type ToolPreset = {
  mode: ProcessMode;
  title: string;
  subtitle: string;
  accept: string;
  defaultOutput: OutputFormat;
  lockOutput?: boolean;
  defaultQuality?: number;
  defaultMaxSide?: number;
  defaultTargetKb?: number;
  allowKeepMetadata?: boolean;
};

type Props = {
  preset: ToolPreset;
  toolId?: ToolId;
};

export function ImageTool({ preset, toolId }: Props) {
  const t = useTranslations("common.tool");
  const tCross = useTranslations("common.crossSell");
  const locale = useLocale() as Locale;

  const formatProcessError = useCallback(
    (err: unknown): string => {
      const raw =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : err && typeof err === "object" && "message" in err
              ? (err as { message: unknown }).message
              : null;
      if (typeof raw === "string" && isProcessErrorCode(raw)) {
        return t(raw);
      }
      return t("processError");
    },
    [t],
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const sourceFiles = useRef<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ProcessedFile[]>([]);
  const [metaSummaries, setMetaSummaries] = useState<ImageMetaSummary[]>([]);
  const [quality, setQuality] = useState(preset.defaultQuality ?? 0.8);
  const [maxSide, setMaxSide] = useState(preset.defaultMaxSide ?? 0);
  const [targetKb, setTargetKb] = useState(preset.defaultTargetKb ?? 0);
  const [outputType, setOutputType] = useState<OutputFormat>(preset.defaultOutput);
  const [stripMetadata, setStripMetadata] = useState(true);
  const [shareOk, setShareOk] = useState(false);
  const scrollAfterSelect = useRef(false);

  const effectiveOutput = preset.lockOutput ? preset.defaultOutput : outputType;

  /**
   * Lock only when metadata cannot be kept for the current selection/settings
   * (format change, HEIC, target KB). Max-side alone does not lock — a smaller
   * image can still pass through with metadata if the user unchecks strip.
   */
  const stripLocked = useMemo(() => {
    if (targetKb > 0) return true;
    if (preset.mode === "convert") return true;
    const files = sourceFiles.current;
    if (!files.length) return false;
    const opts = {
      mode: preset.mode,
      quality,
      maxWidthOrHeight: maxSide > 0 ? maxSide : undefined,
      targetBytes: targetKb > 0 ? targetKb * 1024 : undefined,
      outputType: effectiveOutput,
    };
    return files.every((f) => needsReencode(f, opts));
  }, [
    preset.mode,
    maxSide,
    targetKb,
    quality,
    effectiveOutput,
    items,
  ]);

  useEffect(() => {
    if (stripLocked && !stripMetadata) setStripMetadata(true);
  }, [stripLocked, stripMetadata]);

  useEffect(() => {
    setShareOk(canShareFiles());
  }, []);

  useEffect(() => {
    if (!scrollAfterSelect.current || items.length === 0) return;
    scrollAfterSelect.current = false;
    resultsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [items]);

  const totals = useMemo(() => {
    const original = items.reduce((s, i) => s + i.originalSize, 0);
    const result = items.reduce((s, i) => s + i.resultSize, 0);
    return { original, result, saved: savingsPercent(original, result) };
  }, [items]);

  const runFiles = useCallback(
    async (files: FileList | File[], source: "select" | "recalc" = "select") => {
      const list = Array.from(files).filter(
        (f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name),
      );
      if (!list.length) {
        setError(t("addImages"));
        return;
      }
      sourceFiles.current = list;
      setError(null);
      setBusy(true);
      try {
        if (source === "select") {
          setMetaSummaries(await inspectImageMetas(list));
        }
        const out = preset.lockOutput ? preset.defaultOutput : outputType;
        const optsBase = {
          mode: preset.mode,
          quality,
          maxWidthOrHeight: maxSide > 0 ? maxSide : undefined,
          targetBytes: targetKb > 0 ? targetKb * 1024 : undefined,
          outputType: out,
        };
        const next: ProcessedFile[] = [];
        for (const file of list) {
          // Per file: forced re-encode still strips in processImageFile;
          // respect the checkbox when pass-through is possible.
          const must = needsReencode(file, optsBase);
          const processed = await processImageFile(file, {
            ...optsBase,
            stripMetadata: must || stripMetadata,
          });
          next.push(processed);
        }
        setItems((prev) => {
          prev.forEach((p) => URL.revokeObjectURL(p.previewUrl));
          return next;
        });
        if (source === "select") {
          scrollAfterSelect.current = true;
          track(TRACK_GOALS.fileSelect, {
            mode: preset.mode,
            files: list.length,
          });
        }
      } catch (e) {
        setError(formatProcessError(e));
      } finally {
        setBusy(false);
      }
    },
    [
      maxSide,
      outputType,
      preset,
      quality,
      targetKb,
      stripMetadata,
      t,
      formatProcessError,
    ],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) void runFiles(e.dataTransfer.files);
  };

  const downloadOne = (item: ProcessedFile) => {
    track(TRACK_GOALS.download, { mode: preset.mode, method: "download" });
    const a = document.createElement("a");
    a.href = item.previewUrl;
    a.download = item.name;
    a.click();
  };

  const shareOne = async (item: ProcessedFile) => {
    try {
      const file = new File([item.blob], item.name, {
        type: item.blob.type || "image/jpeg",
      });
      if (!navigator.share) {
        downloadOne(item);
        return;
      }
      await navigator.share({
        files: [file],
        title: item.name,
      });
      track(TRACK_GOALS.download, { mode: preset.mode, method: "share" });
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      downloadOne(item);
    }
  };

  const downloadZip = async () => {
    if (!items.length) return;
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    items.forEach((item) => zip.file(item.name, item.blob));
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pixlocal.zip";
    a.click();
    URL.revokeObjectURL(url);
    track(TRACK_GOALS.zipDownload, {
      mode: preset.mode,
      files: items.length,
    });
  };

  const hasResults = items.length > 0;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <div
        className={`rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[0_20px_60px_rgba(20,32,26,0.08)] backdrop-blur-md sm:p-8 ${
          dragging && !busy ? "dropzone-active" : ""
        } ${busy ? "opacity-90" : ""}`}
        aria-busy={busy}
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          if (busy) {
            e.preventDefault();
            return;
          }
          onDrop(e);
        }}
      >
        {/*
          Mobile order: picker → results → settings
          Desktop: picker | settings, then results full-width
        */}
        <div className="flex flex-col gap-6 lg:flex-row lg:flex-wrap lg:items-start">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className={
              hasResults
                ? "group order-1 flex w-full items-center justify-between gap-3 rounded-2xl border border-dashed border-[var(--brand)]/40 bg-[rgba(15,107,92,0.04)] px-4 py-3 text-left transition hover:border-[var(--brand)] hover:bg-[rgba(15,107,92,0.08)] disabled:pointer-events-none disabled:opacity-60 lg:min-h-0 lg:flex-1 lg:flex-col lg:items-center lg:justify-center lg:px-6 lg:py-6 lg:text-center"
                : "group order-1 flex min-h-[220px] w-full flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--brand)]/40 bg-[rgba(15,107,92,0.04)] px-6 py-10 text-center transition hover:border-[var(--brand)] hover:bg-[rgba(15,107,92,0.08)] disabled:pointer-events-none disabled:opacity-60"
            }
          >
            {hasResults ? (
              <>
                <span className="lg:text-center">
                  <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[rgba(15,107,92,0.12)] px-2.5 py-1 text-[11px] font-medium text-[var(--brand)] lg:mb-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)]" aria-hidden />
                    <ShieldIcon className="h-3.5 w-3.5" />
                    {t("localBadge")}
                  </span>
                  <span
                    className="block text-sm font-medium text-[var(--brand)] lg:text-2xl"
                    style={{ fontFamily: "var(--font-display), serif" }}
                  >
                    {t("addOrReplace")}
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--ink-soft)] lg:mt-3 lg:text-sm">
                    {t("localOnlyShort")}
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-[var(--brand)] px-3 py-1.5 text-xs font-medium text-white lg:mt-6 lg:px-5 lg:py-2 lg:text-sm">
                  {t("chooseFiles")}
                </span>
              </>
            ) : (
              <>
                <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[rgba(15,107,92,0.12)] px-2.5 py-1 text-xs font-medium text-[var(--brand)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)]" aria-hidden />
                  <ShieldIcon className="h-3.5 w-3.5" />
                  {t("localBadge")}
                </span>
                <span
                  className="text-2xl text-[var(--brand)] sm:text-3xl"
                  style={{ fontFamily: "var(--font-display), serif" }}
                >
                  <span className="lg:hidden">{t("choosePhoto")}</span>
                  <span className="hidden lg:inline">{t("dropHere")}</span>
                </span>
                <span className="mt-3 max-w-md text-sm text-[var(--ink-soft)]">
                  <span className="lg:hidden">{t("localOnlyMobile")}</span>
                  <span className="hidden lg:inline">{t("localOnlyDesktop")}</span>
                </span>
                <span className="mt-6 rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-medium text-white transition group-hover:translate-y-[-1px]">
                  {t("chooseFiles")}
                </span>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept={preset.accept}
              multiple
              disabled={busy}
              className="hidden"
              onChange={(e) => {
                if (e.target.files) void runFiles(e.target.files);
              }}
            />
          </button>

          <div
            className={`w-full space-y-4 lg:max-w-sm ${
              hasResults || busy ? "order-3 lg:order-2" : "order-2"
            }`}
          >
            <label className="block text-sm text-[var(--ink-soft)]">
              {t("quality", { percent: Math.round(quality * 100) })}
              <input
                type="range"
                min={0.2}
                max={0.95}
                step={0.01}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--brand)]"
              />
            </label>

            {!preset.lockOutput ? (
              <label className="block text-sm text-[var(--ink-soft)]">
                {t("outputFormat")}
                <select
                  value={outputType}
                  onChange={(e) => setOutputType(e.target.value as OutputFormat)}
                  className="mt-2 w-full rounded-xl border border-[var(--line)] bg-white/80 px-3 py-2 text-[var(--ink)]"
                >
                  <option value="image/jpeg">JPG</option>
                  <option value="image/webp">WebP</option>
                  <option value="image/png">PNG</option>
                </select>
              </label>
            ) : null}

            <label className="block text-sm text-[var(--ink-soft)]">
              {t("maxSide")}
              <input
                type="number"
                min={0}
                max={8000}
                value={maxSide}
                onChange={(e) => setMaxSide(Number(e.target.value) || 0)}
                className="mt-2 w-full rounded-xl border border-[var(--line)] bg-white/80 px-3 py-2 text-[var(--ink)]"
              />
            </label>

            <label className="block text-sm text-[var(--ink-soft)]">
              {t("targetKb")}
              <input
                type="number"
                min={0}
                max={10000}
                value={targetKb}
                onChange={(e) => setTargetKb(Number(e.target.value) || 0)}
                className="mt-2 w-full rounded-xl border border-[var(--line)] bg-white/80 px-3 py-2 text-[var(--ink)]"
              />
            </label>

            <label className="flex items-start gap-2 text-sm text-[var(--ink-soft)]">
              <input
                type="checkbox"
                checked={stripLocked ? true : stripMetadata}
                disabled={stripLocked}
                onChange={(e) => setStripMetadata(e.target.checked)}
                className="mt-0.5 accent-[var(--brand)]"
              />
              <span>
                <span className="text-[var(--ink)]">{t("stripMetadata")}</span>
                {stripLocked || maxSide > 0 ? (
                  <span className="mt-0.5 block text-xs">{t("stripMetadataHint")}</span>
                ) : null}
              </span>
            </label>

            {hasResults ? (
              <button
                type="button"
                onClick={() => void runFiles(sourceFiles.current, "recalc")}
                className="w-full rounded-xl border border-[var(--line)] bg-white/70 px-4 py-2 text-sm hover:bg-white"
                disabled={busy}
              >
                {t("recalc")}
              </button>
            ) : null}
          </div>

          {busy ? (
            <div
              className="order-2 flex w-full items-start gap-3 lg:order-3 lg:basis-full"
              role="status"
              aria-live="polite"
            >
              <span
                className="mt-0.5 inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[var(--brand)]/25 border-t-[var(--brand)]"
                aria-hidden
              />
              <div>
                <p className="text-sm font-medium text-[var(--brand)]">
                  {t("processing")}
                </p>
                <p className="mt-0.5 text-xs text-[var(--ink-soft)]">
                  {t("processingHint")}
                </p>
              </div>
            </div>
          ) : null}
          {error ? (
            <p className="order-2 w-full text-sm text-[var(--brand-hot)] lg:order-3 lg:basis-full">
              {error}
            </p>
          ) : null}

          {metaSummaries.length || hasResults ? (
            <div className="order-2 w-full lg:order-3 lg:basis-full">
              <MetadataPanel
                summaries={metaSummaries}
                stripped={hasResults && items.every((i) => i.metaStripped)}
              />
            </div>
          ) : null}

          {hasResults ? (
            <div
              ref={resultsRef}
              className="order-2 w-full scroll-mt-4 space-y-4 lg:order-3 lg:basis-full lg:scroll-mt-6"
            >
              <div>
                <p className="text-sm text-[var(--ink-soft)]">{t("total")}</p>
                <p className="text-lg text-[var(--ink)]">
                  {formatBytes(totals.original)} → {formatBytes(totals.result)}
                  {totals.saved > 0 ? (
                    <span className="ml-2 text-[var(--brand)]">−{totals.saved}%</span>
                  ) : totals.saved < 0 ? (
                    <span className="ml-2 text-[var(--brand-hot)]">
                      +{Math.abs(totals.saved)}%
                    </span>
                  ) : null}
                </p>
              </div>

              {shareOk ? (
                <p className="text-xs text-[var(--ink-soft)]">{t("shareHint")}</p>
              ) : null}

              <ul className="grid gap-3 sm:grid-cols-2">
                {items.map((item) => {
                  const pct = savingsPercent(item.originalSize, item.resultSize);
                  return (
                    <li
                      key={item.id}
                      className="flex gap-3 rounded-2xl border border-[var(--line)] bg-white/70 p-3"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.previewUrl}
                        alt={item.name}
                        className="h-20 w-20 rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.name}</p>
                        <p className="mt-1 text-xs text-[var(--ink-soft)]">
                          {formatBytes(item.originalSize)} →{" "}
                          {formatBytes(item.resultSize)}
                          {pct > 0
                            ? ` (−${pct}%)`
                            : pct < 0
                              ? ` (+${Math.abs(pct)}%)`
                              : ""}
                        </p>
                        {item.grew ? (
                          <p className="mt-1 text-xs text-[var(--brand-hot)]">
                            {t("grew")}
                          </p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap gap-3">
                          {shareOk ? (
                            <button
                              type="button"
                              onClick={() => void shareOne(item)}
                              className="text-sm font-medium text-[var(--brand)] underline-offset-2 hover:underline"
                            >
                              {t("share")}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => downloadOne(item)}
                            className="text-sm text-[var(--ink-soft)] underline-offset-2 hover:underline"
                          >
                            {t("download")}
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <button
                type="button"
                onClick={() => void downloadZip()}
                className="w-full rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-medium text-white"
              >
                {t("downloadZip")}
              </button>

              {toolId !== "udalit-exif" && toolId !== "skryt-oblast" ? (
                <div className="rounded-2xl border border-[var(--line)] bg-[rgba(15,107,92,0.06)] px-4 py-4">
                  <p className="text-sm font-medium text-[var(--ink)]">
                    {tCross("title")}
                  </p>
                  <ul className="mt-3 space-y-2">
                    <li className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="text-[var(--ink-soft)]">{tCross("exif")}</span>
                      <Link
                        href={pagePath(locale, {
                          type: "tool",
                          toolId: "udalit-exif",
                        })}
                        prefetch={false}
                        className="shrink-0 rounded-full bg-[var(--brand)] px-3 py-1.5 text-xs font-medium text-white"
                      >
                        {tCross("exifCta")}
                      </Link>
                    </li>
                    <li className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="text-[var(--ink-soft)]">{tCross("blur")}</span>
                      <Link
                        href={pagePath(locale, {
                          type: "tool",
                          toolId: "skryt-oblast",
                        })}
                        prefetch={false}
                        className="shrink-0 rounded-full border border-[var(--brand)] px-3 py-1.5 text-xs font-medium text-[var(--brand)]"
                      >
                        {tCross("blurCta")}
                      </Link>
                    </li>
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
