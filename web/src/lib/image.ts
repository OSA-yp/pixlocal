export type OutputFormat = "image/jpeg" | "image/png" | "image/webp";

export type ProcessMode = "compress" | "convert" | "resize";

export type ToolOptions = {
  mode: ProcessMode;
  quality: number; // 0.1–1
  maxWidthOrHeight?: number;
  targetBytes?: number;
  outputType: OutputFormat;
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
};

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

function heicErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err) return err;
  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as { message: unknown }).message;
    if (typeof msg === "string" && msg) return msg;
  }
  return "не удалось декодировать HEIC";
}

async function loadHeicAsBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    // Chrome/Firefox: no native HEIC — fall through to WASM decoder
  }

  try {
    const { heicTo } = await import("heic-to");
    return await heicTo({
      blob: file,
      type: "bitmap",
    });
  } catch (err) {
    throw new Error(`HEIC: ${heicErrorMessage(err)}`);
  }
}

async function fileToBitmap(file: File): Promise<ImageBitmap> {
  if (isHeicFile(file)) {
    return loadHeicAsBitmap(file);
  }

  try {
    return await createImageBitmap(file);
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = url;
      });
      return await createImageBitmap(img);
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
  if (!ctx) throw new Error("Canvas недоступен");
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
      (blob) => (blob ? resolve(blob) : reject(new Error("Не удалось закодировать"))),
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
    };
  } finally {
    bitmap.close();
  }
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} Б`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} КБ`;
  return `${(n / (1024 * 1024)).toFixed(2)} МБ`;
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
