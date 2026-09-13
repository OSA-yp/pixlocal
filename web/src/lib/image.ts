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
};

function extFor(type: OutputFormat) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

function baseName(name: string) {
  return name.replace(/\.[^.]+$/, "");
}

async function loadHeicAsBitmap(file: File): Promise<ImageBitmap> {
  const heic2any = (await import("heic2any")).default;
  const converted = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.95,
  });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  return createImageBitmap(blob as Blob);
}

async function fileToBitmap(file: File): Promise<ImageBitmap> {
  const lower = file.name.toLowerCase();
  const isHeic =
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    lower.endsWith(".heic") ||
    lower.endsWith(".heif");

  if (isHeic) {
    return loadHeicAsBitmap(file);
  }

  try {
    return await createImageBitmap(file);
  } catch {
    // fallback via object URL
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
): { canvas: HTMLCanvasElement; width: number; height: number } {
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
  return { canvas, width, height };
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

export async function processImageFile(
  file: File,
  options: ToolOptions,
): Promise<ProcessedFile> {
  const bitmap = await fileToBitmap(file);
  try {
    const maxSide =
      options.mode === "resize"
        ? options.maxWidthOrHeight
        : options.maxWidthOrHeight;

    const { canvas } = drawToCanvas(bitmap, maxSide);
    const blob = await encodeWithTarget(
      canvas,
      options.outputType,
      options.quality,
      options.targetBytes,
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
  return Math.max(0, Math.round((1 - result / original) * 100));
}
