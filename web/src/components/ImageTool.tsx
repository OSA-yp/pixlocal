"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  canShareFiles,
  formatBytes,
  processImageFile,
  savingsPercent,
  type OutputFormat,
  type ProcessMode,
  type ProcessedFile,
} from "@/lib/image";
import { TRACK_GOALS, track } from "@/lib/track";

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
};

type Props = {
  preset: ToolPreset;
};

function formatProcessError(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err) return err;
  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as { message: unknown }).message;
    if (typeof msg === "string" && msg) return msg;
  }
  return "Не удалось обработать файл";
}

export function ImageTool({ preset }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const sourceFiles = useRef<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ProcessedFile[]>([]);
  const [quality, setQuality] = useState(preset.defaultQuality ?? 0.8);
  const [maxSide, setMaxSide] = useState(preset.defaultMaxSide ?? 0);
  const [targetKb, setTargetKb] = useState(preset.defaultTargetKb ?? 0);
  const [outputType, setOutputType] = useState<OutputFormat>(preset.defaultOutput);
  const [shareOk, setShareOk] = useState(false);
  const scrollAfterSelect = useRef(false);

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
        setError("Добавьте изображения (JPG, PNG, WebP, HEIC).");
        return;
      }
      sourceFiles.current = list;
      setError(null);
      setBusy(true);
      try {
        const next: ProcessedFile[] = [];
        for (const file of list) {
          const processed = await processImageFile(file, {
            mode: preset.mode,
            quality,
            maxWidthOrHeight: maxSide > 0 ? maxSide : undefined,
            targetBytes: targetKb > 0 ? targetKb * 1024 : undefined,
            outputType: preset.lockOutput ? preset.defaultOutput : outputType,
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
    [maxSide, outputType, preset, quality, targetKb],
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
          dragging ? "dropzone-active" : ""
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {/*
          Mobile order: picker → results → settings
          Desktop: picker | settings, then results full-width
        */}
        <div className="flex flex-col gap-6 lg:flex-row lg:flex-wrap lg:items-start">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={
              hasResults
                ? "group order-1 flex w-full items-center justify-between gap-3 rounded-2xl border border-dashed border-[var(--brand)]/40 bg-[rgba(15,107,92,0.04)] px-4 py-3 text-left transition hover:border-[var(--brand)] hover:bg-[rgba(15,107,92,0.08)] lg:min-h-0 lg:flex-1 lg:flex-col lg:items-center lg:justify-center lg:px-6 lg:py-6 lg:text-center"
                : "group order-1 flex min-h-[220px] w-full flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--brand)]/40 bg-[rgba(15,107,92,0.04)] px-6 py-10 text-center transition hover:border-[var(--brand)] hover:bg-[rgba(15,107,92,0.08)]"
            }
          >
            {hasResults ? (
              <>
                <span className="lg:text-center">
                  <span
                    className="block text-sm font-medium text-[var(--brand)] lg:text-2xl"
                    style={{ fontFamily: "var(--font-display), serif" }}
                  >
                    Добавить или заменить файлы
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--ink-soft)] lg:mt-3 lg:text-sm">
                    Обработка только на устройстве — на сервер и в облако ничего не
                    уходит.
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-[var(--brand)] px-3 py-1.5 text-xs font-medium text-white lg:mt-6 lg:px-5 lg:py-2 lg:text-sm">
                  Выбрать файлы
                </span>
              </>
            ) : (
              <>
                <span
                  className="text-2xl text-[var(--brand)] sm:text-3xl"
                  style={{ fontFamily: "var(--font-display), serif" }}
                >
                  <span className="lg:hidden">Выберите фото</span>
                  <span className="hidden lg:inline">Перетащите фото сюда</span>
                </span>
                <span className="mt-3 max-w-md text-sm text-[var(--ink-soft)]">
                  <span className="lg:hidden">
                    Обработка идёт на этом устройстве — на сервер и в облако ничего
                    не уходит.
                  </span>
                  <span className="hidden lg:inline">
                    или нажмите, чтобы выбрать файлы. Обработка идёт на этом
                    устройстве — на сервер и в облако ничего не уходит.
                  </span>
                </span>
                <span className="mt-6 rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-medium text-white transition group-hover:translate-y-[-1px]">
                  Выбрать файлы
                </span>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept={preset.accept}
              multiple
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
              Качество: {Math.round(quality * 100)}%
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
                Формат результата
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
              Макс. сторона (px), 0 = без ограничения
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
              Цель по размеру (КБ), 0 = выкл.
              <input
                type="number"
                min={0}
                max={10000}
                value={targetKb}
                onChange={(e) => setTargetKb(Number(e.target.value) || 0)}
                className="mt-2 w-full rounded-xl border border-[var(--line)] bg-white/80 px-3 py-2 text-[var(--ink)]"
              />
            </label>

            {hasResults ? (
              <button
                type="button"
                onClick={() => void runFiles(sourceFiles.current, "recalc")}
                className="w-full rounded-xl border border-[var(--line)] bg-white/70 px-4 py-2 text-sm hover:bg-white"
                disabled={busy}
              >
                Пересчитать с новыми настройками
              </button>
            ) : null}
          </div>

          {busy ? (
            <p className="order-2 w-full text-sm text-[var(--brand)] lg:order-3 lg:basis-full">
              Обрабатываем локально…
            </p>
          ) : null}
          {error ? (
            <p className="order-2 w-full text-sm text-[var(--brand-hot)] lg:order-3 lg:basis-full">
              {error}
            </p>
          ) : null}

          {hasResults ? (
            <div
              ref={resultsRef}
              className="order-2 w-full scroll-mt-4 space-y-4 lg:order-3 lg:basis-full lg:scroll-mt-6"
            >
              <div>
                <p className="text-sm text-[var(--ink-soft)]">Итого</p>
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
                <p className="text-xs text-[var(--ink-soft)]">
                  На iPhone: «Поделиться» → «Сохранить изображение», чтобы фото
                  попало в галерею. «Скачать» обычно сохраняет в «Файлы».
                </p>
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
                            Стал больше — снизьте качество или макс. сторону и
                            пересчитайте.
                          </p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap gap-3">
                          {shareOk ? (
                            <button
                              type="button"
                              onClick={() => void shareOne(item)}
                              className="text-sm font-medium text-[var(--brand)] underline-offset-2 hover:underline"
                            >
                              Поделиться
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => downloadOne(item)}
                            className="text-sm text-[var(--ink-soft)] underline-offset-2 hover:underline"
                          >
                            Скачать
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
                Скачать всё ZIP
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
