"use client";

import { ShieldIcon } from "@/components/TrustIcons";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

type Mode = "pixel" | "blur";
type Rect = { x: number; y: number; w: number; h: number };

function strengthToBlock(strength: number, w: number, h: number) {
  const base = Math.round(6 + (strength / 100) * 90); // 6…96
  const fromSize = Math.floor(Math.min(w, h) * 0.12 * (strength / 100));
  return Math.max(2, Math.max(base, fromSize));
}

function strengthToBlurPx(strength: number) {
  return Math.round(8 + (strength / 100) * 64); // 8…72
}

function blurPasses(strength: number) {
  if (strength >= 100) return 3;
  if (strength >= 85) return 2;
  return 1;
}

function normalizeRect(r: Rect) {
  const x = Math.round(Math.min(r.x, r.x + r.w));
  const y = Math.round(Math.min(r.y, r.y + r.h));
  const w = Math.round(Math.abs(r.w));
  const h = Math.round(Math.abs(r.h));
  return { x, y, w, h };
}

function rectsOverlap(a: Rect, b: Rect) {
  const A = normalizeRect(a);
  const B = normalizeRect(b);
  return !(
    A.x + A.w <= B.x ||
    B.x + B.w <= A.x ||
    A.y + A.h <= B.y ||
    B.y + B.h <= A.y
  );
}

async function loadBitmap(file: File): Promise<ImageBitmap> {
  const opts: ImageBitmapOptions = { imageOrientation: "from-image" };
  const lower = file.name.toLowerCase();
  const heic =
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    lower.endsWith(".heic") ||
    lower.endsWith(".heif");
  if (heic) {
    try {
      return await createImageBitmap(file, opts);
    } catch {
      const { heicTo } = await import("heic-to");
      return heicTo({ blob: file, type: "bitmap" });
    }
  }
  try {
    return await createImageBitmap(file, opts);
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = url;
      });
      return await createImageBitmap(img, opts);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function pixelateRect(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  block: number,
) {
  if (sw < 1 || sh < 1) return;
  const tw = Math.max(1, Math.floor(sw / block));
  const th = Math.max(1, Math.floor(sh / block));
  const tmp = document.createElement("canvas");
  tmp.width = tw;
  tmp.height = th;
  const tctx = tmp.getContext("2d");
  if (!tctx) return;
  tctx.imageSmoothingEnabled = false;
  tctx.drawImage(ctx.canvas, sx, sy, sw, sh, 0, 0, tw, th);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tmp, 0, 0, tw, th, sx, sy, sw, sh);
  ctx.imageSmoothingEnabled = true;
}

function blurRect(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  blurPx: number,
) {
  if (sw < 1 || sh < 1) return;
  const pad = Math.ceil(blurPx * 2);
  const tmp = document.createElement("canvas");
  tmp.width = sw + pad * 2;
  tmp.height = sh + pad * 2;
  const tctx = tmp.getContext("2d");
  if (!tctx) return;
  tctx.filter = `blur(${blurPx}px)`;
  tctx.drawImage(
    ctx.canvas,
    sx - pad,
    sy - pad,
    sw + pad * 2,
    sh + pad * 2,
    0,
    0,
    sw + pad * 2,
    sh + pad * 2,
  );
  ctx.drawImage(tmp, pad, pad, sw, sh, sx, sy, sw, sh);
}

function applyRects(
  ctx: CanvasRenderingContext2D,
  rects: Rect[],
  mode: Mode,
  strength: number,
) {
  const applied: Rect[] = [];
  for (const r of rects) {
    const { x, y, w, h } = normalizeRect(r);
    if (w < 2 || h < 2) continue;
    const overlapCount = applied.filter((prev) => rectsOverlap(prev, r)).length;
    const effective = Math.min(100, strength + 15 * overlapCount);
    if (mode === "pixel") {
      const block = strengthToBlock(effective, w, h);
      pixelateRect(ctx, x, y, w, h, block);
    } else {
      const blurPx = strengthToBlurPx(effective);
      const passes = blurPasses(effective);
      for (let i = 0; i < passes; i++) {
        blurRect(ctx, x, y, w, h, blurPx);
      }
    }
    applied.push(r);
  }
}

function strokeSelection(
  ctx: CanvasRenderingContext2D,
  rects: Rect[],
  imageWidth: number,
) {
  const cssPx = Math.max(3, Math.round(imageWidth / 400));
  for (const r of rects) {
    const { x, y, w, h } = normalizeRect(r);
    if (w < 1 || h < 1) continue;
    ctx.setLineDash([]);
    ctx.lineWidth = cssPx + 2;
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.strokeRect(x, y, w, h);
    ctx.lineWidth = cssPx;
    ctx.strokeStyle = "rgba(15,107,92,1)";
    ctx.setLineDash([Math.max(4, cssPx * 2), Math.max(3, cssPx)]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);
  }
}

export function RedactTool() {
  const t = useTranslations("common.redact");
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bitmapRef = useRef<ImageBitmap | null>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const draftRef = useRef<Rect | null>(null);

  const [mode, setMode] = useState<Mode>("pixel");
  const [strength, setStrength] = useState(75);
  const [rects, setRects] = useState<Rect[]>([]);
  const [draft, setDraft] = useState<Rect | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasImage, setHasImage] = useState(false);
  const [fileName, setFileName] = useState("redacted.jpg");
  const [status, setStatus] = useState<string | null>(null);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const bmp = bitmapRef.current;
    if (!canvas || !bmp) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = bmp.width;
    canvas.height = bmp.height;
    ctx.drawImage(bmp, 0, 0);
    const live = draft ? [...rects, draft] : rects;
    applyRects(ctx, live, mode, strength);
    strokeSelection(ctx, live, bmp.width);
  }, [draft, rects, mode, strength]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const toCanvasPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const onFile = async (file: File) => {
    setError(null);
    setStatus(null);
    setBusy(true);
    try {
      bitmapRef.current?.close();
      const bmp = await loadBitmap(file);
      bitmapRef.current = bmp;
      setFileName(file.name.replace(/\.[^.]+$/, "") + "-redacted.jpg");
      setRects([]);
      setDraft(null);
      draftRef.current = null;
      setHasImage(true);
      setStatus(t("fileInMemory"));
    } catch {
      setError(t("error"));
      setHasImage(false);
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    const bmp = bitmapRef.current;
    if (!bmp || !rects.length) return;
    setBusy(true);
    setError(null);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = bmp.width;
      canvas.height = bmp.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas");
      ctx.drawImage(bmp, 0, 0);
      applyRects(ctx, rects, mode, strength);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("blob"))),
          "image/jpeg",
          0.92,
        );
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      setStatus(t("savedLocally"));
    } catch {
      setError(t("error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <div
        className={`rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[0_20px_60px_rgba(20,32,26,0.08)] backdrop-blur-md sm:p-8 ${
          busy ? "opacity-90" : ""
        }`}
        aria-busy={busy}
      >
        {!hasImage ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="group flex min-h-[220px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--brand)]/40 bg-[rgba(15,107,92,0.04)] px-6 py-10 text-center transition hover:border-[var(--brand)] hover:bg-[rgba(15,107,92,0.08)] disabled:pointer-events-none disabled:opacity-60"
          >
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
              {t("hint")}
            </span>
            <span className="mt-6 rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-medium text-white">
              {t("chooseFiles")}
            </span>
          </button>
        ) : null}
        {!hasImage && busy ? (
          <div
            className="mt-4 flex items-center justify-center gap-2"
            role="status"
            aria-live="polite"
          >
            <span
              className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[var(--brand)]/25 border-t-[var(--brand)]"
              aria-hidden
            />
            <p className="text-sm font-medium text-[var(--brand)]">
              {t("processing")}
            </p>
          </div>
        ) : null}
        {hasImage ? (
          <div className="space-y-4">
            <p className="text-sm text-[var(--ink-soft)]">{t("hint")}</p>
            {status ? (
              <p className="text-xs font-medium text-[var(--brand)]">{status}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setMode("pixel")}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  mode === "pixel"
                    ? "bg-[var(--brand)] text-white"
                    : "border border-[var(--line)] bg-white/70 text-[var(--ink-soft)]"
                }`}
              >
                {t("modePixel")}
              </button>
              <button
                type="button"
                onClick={() => setMode("blur")}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  mode === "blur"
                    ? "bg-[var(--brand)] text-white"
                    : "border border-[var(--line)] bg-white/70 text-[var(--ink-soft)]"
                }`}
              >
                {t("modeBlur")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setRects([]);
                  setDraft(null);
                  draftRef.current = null;
                }}
                className="rounded-full border border-[var(--line)] bg-white/70 px-3 py-1.5 text-xs text-[var(--ink-soft)]"
              >
                {t("clear")}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
                className="rounded-full border border-[var(--line)] bg-white/70 px-3 py-1.5 text-xs text-[var(--ink-soft)] disabled:opacity-40"
              >
                {t("replace")}
              </button>
            </div>

            <label className="block text-sm text-[var(--ink-soft)]">
              {t("strength", { percent: strength })}
              <input
                type="range"
                min={10}
                max={100}
                step={1}
                value={strength}
                onChange={(e) => setStrength(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--brand)]"
              />
            </label>

            <div className="overflow-auto rounded-2xl border border-[var(--line)] bg-black/5">
              <canvas
                ref={canvasRef}
                className="mx-auto max-h-[70vh] max-w-full cursor-crosshair touch-none"
                onPointerDown={(e) => {
                  const p = toCanvasPoint(e.clientX, e.clientY);
                  dragRef.current = p;
                  const next = { x: p.x, y: p.y, w: 0, h: 0 };
                  draftRef.current = next;
                  setDraft(next);
                  (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  if (!dragRef.current) return;
                  const p = toCanvasPoint(e.clientX, e.clientY);
                  const next = {
                    x: dragRef.current.x,
                    y: dragRef.current.y,
                    w: p.x - dragRef.current.x,
                    h: p.y - dragRef.current.y,
                  };
                  draftRef.current = next;
                  setDraft(next);
                }}
                onPointerUp={() => {
                  const d = draftRef.current;
                  if (d && Math.abs(d.w) > 4 && Math.abs(d.h) > 4) {
                    setRects((prev) => [...prev, d]);
                  }
                  setDraft(null);
                  draftRef.current = null;
                  dragRef.current = null;
                }}
              />
            </div>

            <button
              type="button"
              disabled={busy || !rects.length}
              onClick={() => void download()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-medium text-white disabled:opacity-40 sm:w-auto"
            >
              {busy ? (
                <span
                  className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white"
                  aria-hidden
                />
              ) : null}
              {busy ? t("processing") : t("download")}
            </button>
          </div>
        ) : null}

        <input
          ref={inputRef}
          type="file"
          accept="image/*,.heic,.heif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
          }}
        />
        {error ? (
          <p className="mt-3 text-sm text-[var(--brand-hot)]">{error}</p>
        ) : null}
      </div>
    </section>
  );
}
