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

export function ImageTool({ preset }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    setShareOk(canShareFiles());
  }, []);

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
          track(TRACK_GOALS.fileSelect, {
            mode: preset.mode,
            files: list.length,
          });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка обработки");
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
            className="group flex min-h-[220px] flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--brand)]/40 bg-[rgba(15,107,92,0.04)] px-6 py-10 text-center transition hover:border-[var(--brand)] hover:bg-[rgba(15,107,92,0.08)]"
          >
            <span
              className="text-2xl text-[var(--brand)] sm:text-3xl"
              style={{ fontFamily: "var(--font-display), serif" }}
            >
              Перетащите фото сюда
            </span>
            <span className="mt-3 max-w-md text-sm text-[var(--ink-soft)]">
              или нажмите, чтобы выбрать файлы. Обработка идёт на этом устройстве —
              на сервер ничего не уходит.
            </span>
            <span className="mt-6 rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-medium text-white transition group-hover:translate-y-[-1px]">
              Выбрать файлы
            </span>
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

          <div className="w-full space-y-4 lg:max-w-sm">
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

            {items.length > 0 ? (
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
        </div>

        {busy ? (
          <p className="mt-6 text-sm text-[var(--brand)]">Обрабатываем локально…</p>
        ) : null}
        {error ? <p className="mt-4 text-sm text-[var(--brand-hot)]">{error}</p> : null}

        {items.length > 0 ? (
          <div className="mt-8 space-y-4">
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
                На iPhone: «Поделиться» → «Сохранить изображение», чтобы фото попало
                в галерею. «Скачать» обычно сохраняет в «Файлы».
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
                        {pct > 0 ? ` (−${pct}%)` : pct < 0 ? ` (+${Math.abs(pct)}%)` : ""}
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
    </section>
  );
}
