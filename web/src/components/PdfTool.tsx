"use client";

import { ShieldIcon } from "@/components/TrustIcons";
import { canShareFiles, formatBytes } from "@/lib/image";
import {
  addPageNumbers,
  compressPdf,
  cropPdf,
  imagesToPdf,
  inspectPdfLimits,
  isImageForPdf,
  isPdfErrorCode,
  isPdfFile,
  mergePdfs,
  organizePdf,
  pdfToJpg,
  protectPdf,
  renderPageThumbs,
  revokeProcessed,
  rotateAllPages,
  sanitizePdf,
  splitPdf,
  unlockPdf,
  WATERMARK_DEFAULT_COLOR,
  watermarkPdf,
  type PdfCompressLevel,
  type PdfLimitReport,
  type PdfPageThumb,
  type ProcessedPdf,
} from "@/lib/pdf";

const WATERMARK_PRESETS = [
  WATERMARK_DEFAULT_COLOR,
  "#1a1a1a",
  "#ffffff",
  "#0f6b5c",
  "#b91c1c",
] as const;
import type { PdfToolId } from "@/lib/tools";
import { TRACK_GOALS, track } from "@/lib/track";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Props = { toolId: PdfToolId };

type FileSlot = { id: string; file: File };

function slotId(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`;
}

export function PdfTool({ toolId }: Props) {
  const t = useTranslations("common.pdfTool");
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [slots, setSlots] = useState<FileSlot[]>([]);
  const [items, setItems] = useState<ProcessedPdf[]>([]);
  const [shareOk, setShareOk] = useState(false);
  const scrollAfter = useRef(false);

  // Tool-specific settings
  const [compressLevel, setCompressLevel] =
    useState<PdfCompressLevel>("balanced");
  const [splitMode, setSplitMode] = useState<"each" | "ranges">("each");
  const [rangesText, setRangesText] = useState("1-1");
  const [rotateAngle, setRotateAngle] = useState<90 | 180 | 270>(90);
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.25);
  const [watermarkColor, setWatermarkColor] = useState(WATERMARK_DEFAULT_COLOR);
  const [pageNumFormat, setPageNumFormat] = useState<"n" | "n-of-N">("n-of-N");
  const [cropMargin, setCropMargin] = useState(5);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [thumbs, setThumbs] = useState<PdfPageThumb[]>([]);
  const [dragThumb, setDragThumb] = useState<number | null>(null);
  const [limitNote, setLimitNote] = useState<string | null>(null);
  const [limitBlocked, setLimitBlocked] = useState(false);

  const multiple =
    toolId === "merge-pdf" || toolId === "jpg-to-pdf";
  const acceptsImages = toolId === "jpg-to-pdf";
  const accept = acceptsImages
    ? "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
    : "application/pdf,.pdf";

  const formatLimit = useCallback(
    (report: PdfLimitReport): string | null => {
      if (report.reason === "ok") return null;
      if (report.reason === "tooLarge") {
        return t("tooLarge", { size: formatBytes(report.bytes) });
      }
      if (report.reason === "warnSize") {
        return t("warnSize", { size: formatBytes(report.bytes) });
      }
      if (report.reason === "warnPages") {
        return t("warnPages", { pages: report.pages ?? 0 });
      }
      return null;
    },
    [t],
  );

  useEffect(() => {
    setShareOk(canShareFiles());
  }, []);

  useEffect(() => {
    if (!scrollAfter.current || items.length === 0) return;
    scrollAfter.current = false;
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [items]);

  useEffect(() => {
    return () => revokeProcessed(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatError = useCallback(
    (err: unknown): string => {
      const raw =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : null;
      if (typeof raw === "string" && isPdfErrorCode(raw)) return t(raw);
      return t("processError");
    },
    [t],
  );

  const onProgress = useCallback((done: number, total: number) => {
    setProgress({ done, total });
  }, []);

  const clearResults = useCallback(() => {
    setItems((prev) => {
      revokeProcessed(prev);
      return [];
    });
  }, []);

  const loadFiles = useCallback(
    async (list: File[]) => {
      const filtered = list.filter((f) =>
        acceptsImages ? isImageForPdf(f) : isPdfFile(f),
      );
      if (!filtered.length) {
        setError(acceptsImages ? t("addImages") : t("addPdfs"));
        return;
      }
      setError(null);
      clearResults();
      setThumbs([]);
      setLimitNote(null);
      setLimitBlocked(false);

      if (!acceptsImages) {
        let blocked = false;
        let note: string | null = null;
        for (const file of filtered) {
          const report = await inspectPdfLimits(file);
          const msg = formatLimit(report);
          if (report.blocked) {
            blocked = true;
            note = msg;
            break;
          }
          if (msg && !note) note = msg;
        }
        setLimitNote(note);
        setLimitBlocked(blocked);
        if (blocked) {
          setError(note);
          return;
        }
      }

      if (multiple) {
        setSlots((prev) => [
          ...prev,
          ...filtered.map((file) => ({ id: slotId(file), file })),
        ]);
      } else {
        setSlots([{ id: slotId(filtered[0]), file: filtered[0] }]);
      }

      track(TRACK_GOALS.fileSelect, {
        mode: toolId,
        files: filtered.length,
      });

      if (
        (toolId === "organize-pdf" || toolId === "crop-pdf") &&
        filtered[0]
      ) {
        setBusy(true);
        try {
          const next = await renderPageThumbs(
            filtered[0],
            toolId === "crop-pdf" ? 220 : 140,
            onProgress,
            toolId === "crop-pdf" ? 3 : undefined,
          );
          setThumbs(next);
        } catch (e) {
          setError(formatError(e));
        } finally {
          setBusy(false);
          setProgress(null);
        }
      }
    },
    [
      acceptsImages,
      clearResults,
      formatError,
      formatLimit,
      multiple,
      onProgress,
      t,
      toolId,
    ],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) {
      void loadFiles(Array.from(e.dataTransfer.files));
    }
  };

  const moveSlot = (from: number, to: number) => {
    setSlots((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const removeSlot = (id: string) => {
    setSlots((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (next.length === 0) {
        setThumbs([]);
        clearResults();
        setLimitNote(null);
        setLimitBlocked(false);
        setError(null);
      }
      return next;
    });
  };

  const moveThumb = (from: number, to: number) => {
    setThumbs((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const rotateThumb = (index: number) => {
    setThumbs((prev) =>
      prev.map((th, i) =>
        i === index
          ? { ...th, rotation: (th.rotation + 90) % 360 }
          : th,
      ),
    );
  };

  const removeThumb = (index: number) => {
    setThumbs((prev) => prev.filter((_, i) => i !== index));
  };

  const run = async () => {
    if (!slots.length && toolId !== "organize-pdf") {
      setError(acceptsImages ? t("addImages") : t("addPdfs"));
      return;
    }
    if (toolId === "protect-pdf" || toolId === "unlock-pdf") {
      if (!password) {
        setError(t("pdfNeedPassword"));
        return;
      }
    }
    if (toolId === "protect-pdf" && password !== passwordConfirm) {
      setError(t("passwordMismatch"));
      return;
    }

    setBusy(true);
    setError(null);
    setProgress(null);
    clearResults();

    try {
      const files = slots.map((s) => s.file);
      let next: ProcessedPdf[] = [];

      switch (toolId) {
        case "merge-pdf":
          next = [await mergePdfs(files, onProgress)];
          break;
        case "compress-pdf":
          next = [await compressPdf(files[0], compressLevel, onProgress)];
          break;
        case "pdf-sanitize":
          next = [await sanitizePdf(files[0], onProgress)];
          break;
        case "split-pdf":
          next = await splitPdf(files[0], splitMode, rangesText, onProgress);
          break;
        case "rotate-pdf":
          next = [await rotateAllPages(files[0], rotateAngle, onProgress)];
          break;
        case "organize-pdf": {
          if (!thumbs.length) throw new Error("pdfEmpty");
          next = [
            await organizePdf(
              files[0],
              thumbs.map((th) => ({
                sourceIndex: th.index,
                rotation: th.rotation,
              })),
              onProgress,
            ),
          ];
          break;
        }
        case "jpg-to-pdf":
          next = [await imagesToPdf(files, onProgress)];
          break;
        case "pdf-to-jpg":
          next = await pdfToJpg(files[0], 0.85, 2, onProgress);
          break;
        case "watermark-pdf":
          next = [
            await watermarkPdf(
              files[0],
              watermarkText,
              watermarkOpacity,
              onProgress,
              watermarkColor,
            ),
          ];
          break;
        case "page-numbers-pdf":
          next = [await addPageNumbers(files[0], pageNumFormat, onProgress)];
          break;
        case "crop-pdf":
          next = [await cropPdf(files[0], cropMargin, onProgress)];
          break;
        case "protect-pdf":
          next = [await protectPdf(files[0], password, onProgress)];
          break;
        case "unlock-pdf":
          next = [await unlockPdf(files[0], password, onProgress)];
          break;
      }

      setItems(next);
      scrollAfter.current = true;
    } catch (e) {
      setError(formatError(e));
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const downloadOne = (item: ProcessedPdf) => {
    track(TRACK_GOALS.download, { mode: toolId, method: "download" });
    const a = document.createElement("a");
    a.href = item.url;
    a.download = item.name;
    a.click();
  };

  const shareOne = async (item: ProcessedPdf) => {
    try {
      const file = new File([item.blob], item.name, {
        type: item.blob.type || "application/pdf",
      });
      if (!navigator.share) {
        downloadOne(item);
        return;
      }
      await navigator.share({ files: [file], title: item.name });
      track(TRACK_GOALS.download, { mode: toolId, method: "share" });
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
    a.download = "pixlocal-pdf.zip";
    a.click();
    URL.revokeObjectURL(url);
    track(TRACK_GOALS.zipDownload, { mode: toolId, files: items.length });
  };

  const totals = useMemo(() => {
    const original = items.reduce((s, i) => s + i.originalSize, 0);
    const result = items.reduce((s, i) => s + i.resultSize, 0);
    return { original, result };
  }, [items]);

  const hasFiles = slots.length > 0;
  const hasResults = items.length > 0;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <div
        className={`rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[0_20px_60px_rgba(20,32,26,0.08)] backdrop-blur-md sm:p-8 ${
          dragging ? "dropzone-active" : ""
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={
              hasFiles
                ? "group flex w-full items-center justify-between gap-3 rounded-2xl border border-dashed border-[var(--brand)]/40 bg-[rgba(15,107,92,0.04)] px-4 py-3 text-left transition hover:border-[var(--brand)] lg:flex-1 lg:flex-col lg:items-center lg:justify-center lg:px-6 lg:py-8 lg:text-center"
                : "group flex min-h-[200px] w-full flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--brand)]/40 bg-[rgba(15,107,92,0.04)] px-6 py-10 text-center transition hover:border-[var(--brand)]"
            }
          >
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[rgba(15,107,92,0.12)] px-2.5 py-1 text-xs font-medium text-[var(--brand)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)]" aria-hidden />
              <ShieldIcon className="h-3.5 w-3.5" />
              {t("localBadge")}
            </span>
            <span
              className="text-xl text-[var(--brand)] sm:text-2xl"
              style={{ fontFamily: "var(--font-display), serif" }}
            >
              {hasFiles ? t("addOrReplace") : t("dropHere")}
            </span>
            <span className="mt-2 max-w-md text-sm text-[var(--ink-soft)]">
              {t("localOnly")}
            </span>
            <span className="mt-5 rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-medium text-white">
              {t("chooseFiles")}
            </span>
          </button>

          <div className="w-full space-y-4 lg:w-80 lg:shrink-0">
            {toolId === "compress-pdf" && (
              <label className="block text-sm text-[var(--ink-soft)]">
                {t("compressLevel")}
                <select
                  className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-[var(--ink)]"
                  value={compressLevel}
                  onChange={(e) =>
                    setCompressLevel(e.target.value as PdfCompressLevel)
                  }
                >
                  <option value="light">{t("levelLight")}</option>
                  <option value="balanced">{t("levelBalanced")}</option>
                  <option value="strong">{t("levelStrong")}</option>
                </select>
                <span className="mt-1 block text-xs">{t("compressHint")}</span>
              </label>
            )}

            {toolId === "split-pdf" && (
              <>
                <fieldset className="text-sm text-[var(--ink-soft)]">
                  <legend className="mb-1">{t("splitMode")}</legend>
                  <label className="mr-4 inline-flex items-center gap-1.5">
                    <input
                      type="radio"
                      checked={splitMode === "each"}
                      onChange={() => setSplitMode("each")}
                    />
                    {t("splitEach")}
                  </label>
                  <label className="inline-flex items-center gap-1.5">
                    <input
                      type="radio"
                      checked={splitMode === "ranges"}
                      onChange={() => setSplitMode("ranges")}
                    />
                    {t("splitRanges")}
                  </label>
                </fieldset>
                {splitMode === "ranges" && (
                  <label className="block text-sm text-[var(--ink-soft)]">
                    {t("rangesLabel")}
                    <input
                      className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-[var(--ink)]"
                      value={rangesText}
                      onChange={(e) => setRangesText(e.target.value)}
                      placeholder="1-3,5,8-9"
                    />
                  </label>
                )}
              </>
            )}

            {toolId === "rotate-pdf" && (
              <fieldset className="text-sm text-[var(--ink-soft)]">
                <legend className="mb-2">{t("rotateAngle")}</legend>
                <div className="flex gap-2">
                  <button
                    type="button"
                    aria-label={t("rotateCcw")}
                    aria-pressed={rotateAngle === 270}
                    onClick={() => setRotateAngle(270)}
                    className={`flex flex-1 flex-col items-center gap-1 rounded-xl border px-3 py-3 transition ${
                      rotateAngle === 270
                        ? "border-[var(--brand)] bg-[rgba(15,107,92,0.1)] text-[var(--brand)]"
                        : "border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--brand)]/40"
                    }`}
                  >
                    <span className="text-2xl leading-none" aria-hidden>
                      ↺
                    </span>
                    <span className="text-xs">90°</span>
                  </button>
                  <button
                    type="button"
                    aria-label={t("rotateCw")}
                    aria-pressed={rotateAngle === 90}
                    onClick={() => setRotateAngle(90)}
                    className={`flex flex-1 flex-col items-center gap-1 rounded-xl border px-3 py-3 transition ${
                      rotateAngle === 90
                        ? "border-[var(--brand)] bg-[rgba(15,107,92,0.1)] text-[var(--brand)]"
                        : "border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--brand)]/40"
                    }`}
                  >
                    <span className="text-2xl leading-none" aria-hidden>
                      ↻
                    </span>
                    <span className="text-xs">90°</span>
                  </button>
                </div>
              </fieldset>
            )}

            {toolId === "watermark-pdf" && (
              <>
                <label className="block text-sm text-[var(--ink-soft)]">
                  {t("watermarkText")}
                  <input
                    className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-[var(--ink)]"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                  />
                </label>
                <div className="text-sm text-[var(--ink-soft)]">
                  <p className="mb-1.5">{t("watermarkColor")}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="color"
                      value={watermarkColor}
                      onChange={(e) => setWatermarkColor(e.target.value)}
                      className="h-9 w-12 cursor-pointer rounded border border-[var(--line)] bg-white p-0.5"
                      aria-label={t("watermarkColor")}
                    />
                    {WATERMARK_PRESETS.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        aria-label={hex}
                        aria-pressed={watermarkColor.toLowerCase() === hex}
                        onClick={() => setWatermarkColor(hex)}
                        className={`h-8 w-8 rounded-full border-2 ${
                          watermarkColor.toLowerCase() === hex
                            ? "border-[var(--brand)]"
                            : "border-[var(--line)]"
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>
                <label className="block text-sm text-[var(--ink-soft)]">
                  {t("opacity")}: {Math.round(watermarkOpacity * 100)}%
                  <input
                    type="range"
                    min={0.08}
                    max={0.6}
                    step={0.01}
                    value={watermarkOpacity}
                    onChange={(e) =>
                      setWatermarkOpacity(Number(e.target.value))
                    }
                    className="mt-1 w-full"
                  />
                </label>
              </>
            )}

            {toolId === "page-numbers-pdf" && (
              <label className="block text-sm text-[var(--ink-soft)]">
                {t("pageNumFormat")}
                <select
                  className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-[var(--ink)]"
                  value={pageNumFormat}
                  onChange={(e) =>
                    setPageNumFormat(e.target.value as "n" | "n-of-N")
                  }
                >
                  <option value="n-of-N">{t("formatNofN")}</option>
                  <option value="n">{t("formatN")}</option>
                </select>
              </label>
            )}

            {toolId === "crop-pdf" && (
              <label className="block text-sm text-[var(--ink-soft)]">
                {t("cropMargin")}: {cropMargin}%
                <input
                  type="range"
                  min={0}
                  max={25}
                  step={1}
                  value={cropMargin}
                  onChange={(e) => setCropMargin(Number(e.target.value))}
                  className="mt-1 w-full"
                />
              </label>
            )}

            {(toolId === "protect-pdf" || toolId === "unlock-pdf") && (
              <>
                <label className="block text-sm text-[var(--ink-soft)]">
                  {t("password")}
                  <input
                    type="password"
                    autoComplete="new-password"
                    className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-[var(--ink)]"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
                {toolId === "protect-pdf" && (
                  <label className="block text-sm text-[var(--ink-soft)]">
                    {t("passwordConfirm")}
                    <input
                      type="password"
                      autoComplete="new-password"
                      className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-[var(--ink)]"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                    />
                  </label>
                )}
              </>
            )}

            <button
              type="button"
              disabled={
                busy ||
                limitBlocked ||
                (!hasFiles && toolId !== "organize-pdf")
              }
              onClick={() => void run()}
              className="w-full rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {busy ? t("processing") : t("run")}
            </button>

            {busy && progress && (
              <p className="text-xs text-[var(--ink-soft)]">
                {t("progress", {
                  done: progress.done,
                  total: progress.total,
                })}
              </p>
            )}
            {busy && (
              <p className="text-xs text-[var(--ink-soft)]">{t("processingHint")}</p>
            )}
            {limitNote && !error && (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {limitNote}
              </p>
            )}
            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
          </div>
        </div>

        {hasFiles && (
          <ul className="mt-6 space-y-2">
            {slots.map((slot, index) => (
              <li
                key={slot.id}
                draggable={multiple}
                onDragStart={() => setDragThumb(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragThumb !== null && dragThumb !== index) {
                    moveSlot(dragThumb, index);
                  }
                  setDragThumb(null);
                }}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-white/70 px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate text-[var(--ink)]">
                  {multiple && (
                    <span className="mr-2 text-[var(--ink-soft)]">⋮⋮</span>
                  )}
                  {slot.file.name}{" "}
                  <span className="text-[var(--ink-soft)]">
                    ({formatBytes(slot.file.size)})
                  </span>
                </span>
                <button
                  type="button"
                  className="shrink-0 text-xs text-[var(--ink-soft)] hover:text-[var(--ink)]"
                  onClick={() => removeSlot(slot.id)}
                >
                  {t("remove")}
                </button>
              </li>
            ))}
          </ul>
        )}

        {toolId === "organize-pdf" && thumbs.length > 0 && (
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {thumbs.map((th, index) => (
              <li
                key={`${th.index}-${index}`}
                draggable
                onDragStart={() => setDragThumb(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragThumb !== null && dragThumb !== index) {
                    moveThumb(dragThumb, index);
                  }
                  setDragThumb(null);
                }}
                className="rounded-xl border border-[var(--line)] bg-white p-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={th.dataUrl}
                  alt=""
                  className="mx-auto max-h-36 w-auto rounded"
                  style={{ transform: `rotate(${th.rotation}deg)` }}
                />
                <div className="mt-2 flex items-center justify-between gap-1 text-xs">
                  <span className="text-[var(--ink-soft)]">
                    {t("pageLabel", { n: th.index + 1 })}
                  </span>
                  <span className="flex gap-1">
                    <button
                      type="button"
                      className="rounded bg-[rgba(15,107,92,0.1)] px-1.5 py-0.5 text-[var(--brand)]"
                      onClick={() => rotateThumb(index)}
                    >
                      ↻
                    </button>
                    <button
                      type="button"
                      className="rounded bg-red-50 px-1.5 py-0.5 text-red-700"
                      onClick={() => removeThumb(index)}
                    >
                      ×
                    </button>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}

        {toolId === "crop-pdf" && thumbs.length > 0 && (
          <div className="mt-6">
            <p className="mb-3 text-sm text-[var(--ink-soft)]">
              {t("cropPreviewHint")}
            </p>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {thumbs.map((th) => (
                <li
                  key={`crop-${th.index}`}
                  className="rounded-xl border border-[var(--line)] bg-white p-2"
                >
                  <div className="relative mx-auto inline-block max-w-full overflow-hidden rounded">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={th.dataUrl}
                      alt=""
                      className="block max-h-64 w-auto max-w-full"
                    />
                    <div
                      className="pointer-events-none absolute inset-0"
                      aria-hidden
                    >
                      <div
                        className="absolute inset-x-0 top-0 bg-black/45"
                        style={{ height: `${cropMargin}%` }}
                      />
                      <div
                        className="absolute inset-x-0 bottom-0 bg-black/45"
                        style={{ height: `${cropMargin}%` }}
                      />
                      <div
                        className="absolute bg-black/45"
                        style={{
                          top: `${cropMargin}%`,
                          bottom: `${cropMargin}%`,
                          left: 0,
                          width: `${cropMargin}%`,
                        }}
                      />
                      <div
                        className="absolute bg-black/45"
                        style={{
                          top: `${cropMargin}%`,
                          bottom: `${cropMargin}%`,
                          right: 0,
                          width: `${cropMargin}%`,
                        }}
                      />
                      <div
                        className="absolute box-border border-2 border-[var(--brand)]"
                        style={{
                          inset: `${cropMargin}%`,
                        }}
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-center text-xs text-[var(--ink-soft)]">
                    {t("pageLabel", { n: th.index + 1 })}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) {
              void loadFiles(Array.from(e.target.files));
            }
            e.target.value = "";
          }}
        />
      </div>

      {hasResults && (
        <div ref={resultsRef} className="mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[var(--ink-soft)]">
              {t("total")}: {formatBytes(totals.original)} →{" "}
              {formatBytes(totals.result)}
            </p>
            <div className="flex flex-wrap gap-2">
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => void downloadZip()}
                  className="rounded-full border border-[var(--brand)] px-4 py-1.5 text-sm text-[var(--brand)]"
                >
                  {t("downloadZip")}
                </button>
              )}
            </div>
          </div>
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-white/60 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--ink)]">
                    {item.name}
                  </p>
                  <p className="text-xs text-[var(--ink-soft)]">
                    {formatBytes(item.originalSize)} →{" "}
                    {formatBytes(item.resultSize)}
                    {item.grew ? ` · ${t("grew")}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  {shareOk && (
                    <button
                      type="button"
                      onClick={() => void shareOne(item)}
                      className="rounded-full border border-[var(--line)] px-3 py-1.5 text-sm"
                    >
                      {t("share")}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => downloadOne(item)}
                    className="rounded-full bg-[var(--brand)] px-3 py-1.5 text-sm text-white"
                  >
                    {t("download")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-[var(--ink-soft)]">
            {t("savedLocally")}
          </p>
        </div>
      )}
    </section>
  );
}
