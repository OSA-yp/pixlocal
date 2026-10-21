export type OutputFormat = "image/jpeg" | "image/png" | "image/webp";

export type ProcessMode = "compress" | "convert" | "resize";

export type ToolOptions = {
  mode: ProcessMode;
  quality: number; // 0.1–1
  maxWidthOrHeight?: number;
  targetBytes?: number;
  outputType: OutputFormat;
  /** Default true. When false and no re-encode is required, original bytes are kept. */
  stripMetadata?: boolean;
};

export type ProcessedFile = {
  id: string;
  name: string;
  originalName: string;
  originalSize: number;
  resultSize: number;
  blob: Blob;
  previewUrl: string;
  outputExt: string;
  grew: boolean;
  /** True after Canvas re-encode (EXIF/GPS/XMP not copied) or intentional strip. */
  metaStripped: boolean;
};

function mimeMatchesOutput(file: File, outputType: OutputFormat): boolean {
  const type = (file.type || "").toLowerCase();
  const name = file.name.toLowerCase();
  if (outputType === "image/jpeg") {
    return type === "image/jpeg" || type === "image/jpg" || /\.jpe?g$/.test(name);
  }
  if (outputType === "image/png") {
    return type === "image/png" || name.endsWith(".png");
  }
  if (outputType === "image/webp") {
    return type === "image/webp" || name.endsWith(".webp");
  }
  return false;
}

/** True when settings/file force a re-encode (metadata cannot be kept). */
export function needsReencode(file: File, options: ToolOptions): boolean {
  if (isHeicFile(file)) return true;
  if (options.maxWidthOrHeight && options.maxWidthOrHeight > 0) return true;
  if (options.targetBytes && options.targetBytes > 0) return true;
  if (!mimeMatchesOutput(file, options.outputType)) return true;
  return false;
}

const BITMAP_OPTS: ImageBitmapOptions = { imageOrientation: "from-image" };

function extFor(type: OutputFormat) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

function baseName(name: string) {
  return name.replace(/\.[^.]+$/, "");
}

export function isHeicFile(file: File) {
  const lower = file.name.toLowerCase();
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    lower.endsWith(".heic") ||
    lower.endsWith(".heif")
  );
}

/** Stable codes mapped to `common.tool.*` in the UI (never localized here). */
export const PROCESS_ERROR = {
  heicDecode: "heicDecode",
  canvasUnavailable: "canvasUnavailable",
  encodeFailed: "encodeFailed",
} as const;

export type ProcessErrorCode =
  (typeof PROCESS_ERROR)[keyof typeof PROCESS_ERROR];

export function isProcessErrorCode(value: string): value is ProcessErrorCode {
  return (
    value === PROCESS_ERROR.heicDecode ||
    value === PROCESS_ERROR.canvasUnavailable ||
    value === PROCESS_ERROR.encodeFailed
  );
}

async function loadHeicAsBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, BITMAP_OPTS);
  } catch {
    // Chrome/Firefox: no native HEIC — fall through to WASM decoder
  }

  try {
    const { heicTo } = await import("heic-to");
    return await heicTo({
      blob: file,
      type: "bitmap",
    });
  } catch {
    throw new Error(PROCESS_ERROR.heicDecode);
  }
}

async function fileToBitmap(file: File): Promise<ImageBitmap> {
  if (isHeicFile(file)) {
    return loadHeicAsBitmap(file);
  }

  try {
    return await createImageBitmap(file, BITMAP_OPTS);
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = url;
      });
      return await createImageBitmap(img, BITMAP_OPTS);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function drawToCanvas(
  bitmap: ImageBitmap,
  maxSide?: number,
): HTMLCanvasElement {
  let { width, height } = bitmap;
  if (maxSide && Math.max(width, height) > maxSide) {
    const scale = maxSide / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error(PROCESS_ERROR.canvasUnavailable);
  if (bitmap.width !== width || bitmap.height !== height) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: OutputFormat,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error(PROCESS_ERROR.encodeFailed)),
      type,
      type === "image/png" ? undefined : quality,
    );
  });
}

async function encodeWithTarget(
  canvas: HTMLCanvasElement,
  type: OutputFormat,
  quality: number,
  targetBytes?: number,
): Promise<Blob> {
  if (!targetBytes || type === "image/png") {
    return canvasToBlob(canvas, type, quality);
  }

  let q = quality;
  let blob = await canvasToBlob(canvas, type, q);
  let guard = 0;
  while (blob.size > targetBytes && q > 0.12 && guard < 10) {
    q = Math.max(0.12, q - 0.08);
    blob = await canvasToBlob(canvas, type, q);
    guard += 1;
  }
  return blob;
}

function buildSideLadder(userMax?: number): (number | undefined)[] {
  const sides: (number | undefined)[] = [];
  const seen = new Set<number | "full">();
  const push = (s: number | undefined) => {
    const key = s === undefined ? "full" : s;
    if (seen.has(key)) return;
    seen.add(key);
    sides.push(s);
  };

  if (userMax && userMax > 0) {
    push(userMax);
  } else {
    push(undefined);
  }
  for (const s of [2560, 1920, 1600]) {
    if (!userMax || userMax <= 0 || s < userMax) push(s);
  }
  return sides;
}

/**
 * Encode and, for lossy formats / compress mode, keep lowering quality
 * and long-side until the file is smaller than the original (or targetBytes).
 */
async function encodeUntilSmaller(
  bitmap: ImageBitmap,
  options: ToolOptions,
  originalSize: number,
): Promise<Blob> {
  const type = options.outputType;
  const chaseSmaller =
    type !== "image/png" &&
    (options.mode === "compress" ||
      options.mode === "convert" ||
      Boolean(options.targetBytes));

  if (!chaseSmaller) {
    const canvas = drawToCanvas(bitmap, options.maxWidthOrHeight);
    return encodeWithTarget(
      canvas,
      type,
      options.quality,
      options.targetBytes,
    );
  }

  const sides = buildSideLadder(options.maxWidthOrHeight);
  let best: Blob | null = null;

  for (const maxSide of sides) {
    let q = options.quality;
    const canvas = drawToCanvas(bitmap, maxSide);
    let blob = await encodeWithTarget(canvas, type, q, options.targetBytes);
    if (!best || blob.size < best.size) best = blob;

    let guard = 0;
    while (blob.size >= originalSize && q > 0.2 && guard < 12) {
      q = Math.max(0.2, q - 0.08);
      blob = await canvasToBlob(canvas, type, q);
      if (blob.size < best.size) best = blob;
      guard += 1;
      if (options.targetBytes && blob.size <= options.targetBytes) {
        return blob;
      }
      if (blob.size < originalSize) {
        return blob;
      }
    }

    if (options.targetBytes && blob.size <= options.targetBytes) {
      return blob;
    }
    if (blob.size < originalSize) {
      return blob;
    }
  }

  return best!;
}

export async function processImageFile(
  file: File,
  options: ToolOptions,
): Promise<ProcessedFile> {
  const stripMetadata = options.stripMetadata !== false;
  const mustReencode = needsReencode(file, options);

  if (!stripMetadata && !mustReencode) {
    const blob = file.slice(0, file.size, file.type || options.outputType);
    const ext = extFor(options.outputType);
    const name = file.name.includes(".")
      ? file.name
      : `${baseName(file.name)}.${ext}`;
    return {
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      name,
      originalName: file.name,
      originalSize: file.size,
      resultSize: blob.size,
      blob,
      previewUrl: URL.createObjectURL(blob),
      outputExt: ext,
      grew: false,
      metaStripped: false,
    };
  }

  const quality = isHeicFile(file)
    ? Math.min(options.quality, 0.8)
    : options.quality;
  const bitmap = await fileToBitmap(file);
  try {
    const blob = await encodeUntilSmaller(
      bitmap,
      { ...options, quality },
      file.size,
    );
    const ext = extFor(options.outputType);
    const name = `${baseName(file.name)}.${ext}`;
    return {
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      name,
      originalName: file.name,
      originalSize: file.size,
      resultSize: blob.size,
      blob,
      previewUrl: URL.createObjectURL(blob),
      outputExt: ext,
      grew: blob.size > file.size,
      metaStripped: true,
    };
  } finally {
    bitmap.close();
  }
}

/** Locale-neutral SI-style units (safe for all UI languages). */
export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export function savingsPercent(original: number, result: number) {
  if (original <= 0) return 0;
  return Math.round((1 - result / original) * 100);
}

export function canShareFiles() {
  if (typeof navigator === "undefined" || typeof File === "undefined") {
    return false;
  }
  try {
    return (
      typeof navigator.share === "function" &&
      (!navigator.canShare ||
        navigator.canShare({
          files: [new File([new Blob(["x"])], "t.jpg", { type: "image/jpeg" })],
        }))
    );
  } catch {
    return typeof navigator.share === "function";
  }
}
