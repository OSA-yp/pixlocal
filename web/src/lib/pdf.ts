import {
  PDFDocument,
  PDFName,
  degrees,
  rgb,
  StandardFonts,
  type PDFPage,
} from "pdf-lib";

export type PdfCompressLevel = "light" | "balanced" | "strong";

/**
 * Soft warnings only for page count — no hard page cap (browser may still OOM
 * on huge rasterize jobs; we warn, user decides).
 * Hard block remains only for extreme file size.
 */
export const PDF_LIMITS = {
  warnBytes: 25 * 1024 * 1024,
  maxBytes: 100 * 1024 * 1024,
  warnPages: 100,
} as const;

export type PdfLimitReport = {
  bytes: number;
  pages: number | null;
  warn: boolean;
  blocked: boolean;
  reason: "ok" | "warnSize" | "warnPages" | "tooLarge";
};

export async function inspectPdfLimits(file: File): Promise<PdfLimitReport> {
  const bytes = file.size;
  if (bytes > PDF_LIMITS.maxBytes) {
    return {
      bytes,
      pages: null,
      warn: true,
      blocked: true,
      reason: "tooLarge",
    };
  }
  let pages: number | null = null;
  try {
    const doc = await loadDoc(await readBytes(file));
    pages = doc.getPageCount();
  } catch {
    pages = null;
  }
  if (bytes > PDF_LIMITS.warnBytes) {
    return { bytes, pages, warn: true, blocked: false, reason: "warnSize" };
  }
  if (pages !== null && pages > PDF_LIMITS.warnPages) {
    return { bytes, pages, warn: true, blocked: false, reason: "warnPages" };
  }
  return { bytes, pages, warn: false, blocked: false, reason: "ok" };
}

export type PdfProgress = (done: number, total: number) => void;

export type ProcessedPdf = {
  id: string;
  name: string;
  originalName: string;
  originalSize: number;
  resultSize: number;
  blob: Blob;
  url: string;
  grew: boolean;
};

export type PdfPageThumb = {
  index: number;
  width: number;
  height: number;
  dataUrl: string;
  rotation: number;
};

export const PDF_ERROR = {
  encrypted: "pdfEncrypted",
  loadFailed: "pdfLoadFailed",
  empty: "pdfEmpty",
  canvasUnavailable: "canvasUnavailable",
  encodeFailed: "encodeFailed",
  badPassword: "pdfBadPassword",
  notEncrypted: "pdfNotEncrypted",
  needPassword: "pdfNeedPassword",
  noImages: "pdfNoImages",
} as const;

export type PdfErrorCode = (typeof PDF_ERROR)[keyof typeof PDF_ERROR];

export function isPdfErrorCode(value: string): value is PdfErrorCode {
  return (Object.values(PDF_ERROR) as string[]).includes(value);
}

export function isPdfFile(file: File): boolean {
  const type = (file.type || "").toLowerCase();
  const name = file.name.toLowerCase();
  return type === "application/pdf" || name.endsWith(".pdf");
}

export function isImageForPdf(file: File): boolean {
  const type = (file.type || "").toLowerCase();
  const name = file.name.toLowerCase();
  if (type.startsWith("image/")) {
    return (
      type === "image/jpeg" ||
      type === "image/jpg" ||
      type === "image/png" ||
      type === "image/webp" ||
      /\.(jpe?g|png|webp)$/i.test(name)
    );
  }
  return /\.(jpe?g|png|webp)$/i.test(name);
}

function baseName(name: string) {
  return name.replace(/\.[^.]+$/, "");
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function toBlob(bytes: Uint8Array, type = "application/pdf"): Blob {
  // Copy into a fresh ArrayBuffer — avoids SharedArrayBuffer typing issues
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy.buffer], { type });
}

function resultFromBytes(
  bytes: Uint8Array,
  name: string,
  originalName: string,
  originalSize: number,
): ProcessedPdf {
  const blob = toBlob(bytes);
  return {
    id: uid(name),
    name,
    originalName,
    originalSize,
    resultSize: blob.size,
    blob,
    url: URL.createObjectURL(blob),
    grew: blob.size > originalSize,
  };
}

async function readBytes(file: File): Promise<Uint8Array> {
  return new Uint8Array(await file.arrayBuffer());
}

async function loadDoc(bytes: Uint8Array, ignoreEncryption = false) {
  try {
    return await PDFDocument.load(bytes, {
      ignoreEncryption,
      updateMetadata: false,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/encrypt|password/i.test(msg)) {
      throw new Error(PDF_ERROR.encrypted);
    }
    throw new Error(PDF_ERROR.loadFailed);
  }
}

let pdfjsReady: Promise<typeof import("pdfjs-dist")> | null = null;

async function getPdfjs() {
  if (!pdfjsReady) {
    pdfjsReady = (async () => {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      return pdfjs;
    })();
  }
  return pdfjsReady;
}

async function openWithPdfjs(bytes: Uint8Array) {
  const pdfjs = await getPdfjs();
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  try {
    return await pdfjs.getDocument({ data: copy }).promise;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/password|encrypt/i.test(msg)) {
      throw new Error(PDF_ERROR.encrypted);
    }
    throw new Error(PDF_ERROR.loadFailed);
  }
}

function compressParams(level: PdfCompressLevel): {
  scale: number;
  quality: number;
} {
  if (level === "strong") return { scale: 1, quality: 0.45 };
  if (level === "light") return { scale: 1.5, quality: 0.85 };
  return { scale: 1.25, quality: 0.65 };
}

async function canvasToJpeg(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Uint8Array> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error(PDF_ERROR.encodeFailed))),
      "image/jpeg",
      quality,
    );
  });
  return new Uint8Array(await blob.arrayBuffer());
}

export async function mergePdfs(
  files: File[],
  onProgress?: PdfProgress,
): Promise<ProcessedPdf> {
  if (!files.length) throw new Error(PDF_ERROR.empty);
  const out = await PDFDocument.create();
  let originalSize = 0;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    originalSize += file.size;
    const doc = await loadDoc(await readBytes(file));
    const pages = await out.copyPages(doc, doc.getPageIndices());
    for (const page of pages) out.addPage(page);
    onProgress?.(i + 1, files.length);
  }
  const bytes = await out.save({ useObjectStreams: true });
  const name = files.length === 1
    ? `${baseName(files[0].name)}-merged.pdf`
    : "merged.pdf";
  return resultFromBytes(bytes, name, files[0].name, originalSize);
}

function clearDocumentMetadata(doc: PDFDocument) {
  doc.setTitle("");
  doc.setAuthor("");
  doc.setSubject("");
  doc.setKeywords([]);
  doc.setProducer("");
  doc.setCreator("");
  try {
    doc.setCreationDate(new Date(0));
    doc.setModificationDate(new Date(0));
  } catch {
    /* ignore */
  }
  // Drop XMP Metadata stream on the catalog if present
  try {
    doc.catalog.delete(PDFName.of("Metadata"));
  } catch {
    /* ignore */
  }
}

export async function sanitizePdf(
  file: File,
  onProgress?: PdfProgress,
): Promise<ProcessedPdf> {
  const srcBytes = await readBytes(file);
  const src = await loadDoc(srcBytes);
  onProgress?.(1, 3);

  // Fresh document: page content only — Info/XMP from the source are not copied
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, src.getPageIndices());
  for (const page of pages) out.addPage(page);
  onProgress?.(2, 3);

  clearDocumentMetadata(out);
  // Also strip Metadata on the source catalog path in case anything was linked
  try {
    src.catalog.delete(PDFName.of("Metadata"));
  } catch {
    /* ignore */
  }

  const bytes = await out.save({ useObjectStreams: true });
  onProgress?.(3, 3);
  return resultFromBytes(
    bytes,
    `${baseName(file.name)}-clean.pdf`,
    file.name,
    file.size,
  );
}

export async function compressPdf(
  file: File,
  level: PdfCompressLevel = "balanced",
  onProgress?: PdfProgress,
): Promise<ProcessedPdf> {
  const srcBytes = await readBytes(file);
  const pdf = await openWithPdfjs(srcBytes);
  const { scale, quality } = compressParams(level);
  const out = await PDFDocument.create();
  const total = pdf.numPages;

  for (let i = 1; i <= total; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error(PDF_ERROR.canvasUnavailable);
    await page.render({ canvasContext: ctx, canvas, viewport }).promise;
    const jpg = await canvasToJpeg(canvas, quality);
    const image = await out.embedJpg(jpg);
    const pdfPage = out.addPage([image.width, image.height]);
    pdfPage.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
    onProgress?.(i, total);
  }

  const bytes = await out.save({ useObjectStreams: true });
  return resultFromBytes(
    bytes,
    `${baseName(file.name)}-compressed.pdf`,
    file.name,
    file.size,
  );
}

export async function splitPdf(
  file: File,
  mode: "each" | "ranges",
  rangesText: string,
  onProgress?: PdfProgress,
): Promise<ProcessedPdf[]> {
  const src = await loadDoc(await readBytes(file));
  const pageCount = src.getPageCount();
  if (pageCount < 1) throw new Error(PDF_ERROR.empty);

  const groups: number[][] =
    mode === "each"
      ? Array.from({ length: pageCount }, (_, i) => [i])
      : parseRanges(rangesText, pageCount);

  if (!groups.length) throw new Error(PDF_ERROR.empty);

  const results: ProcessedPdf[] = [];
  for (let g = 0; g < groups.length; g++) {
    const indices = groups[g];
    const out = await PDFDocument.create();
    const pages = await out.copyPages(src, indices);
    for (const page of pages) out.addPage(page);
    const bytes = await out.save({ useObjectStreams: true });
    const label =
      indices.length === 1
        ? `${baseName(file.name)}-p${indices[0] + 1}.pdf`
        : `${baseName(file.name)}-p${indices[0] + 1}-${indices[indices.length - 1] + 1}.pdf`;
    results.push(resultFromBytes(bytes, label, file.name, file.size));
    onProgress?.(g + 1, groups.length);
  }
  return results;
}

/** Parse "1-3,5,8-9" (1-based, inclusive) into 0-based index groups. */
export function parseRanges(text: string, pageCount: number): number[][] {
  const groups: number[][] = [];
  const parts = text.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);
  for (const part of parts) {
    const m = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(part);
    if (!m) continue;
    let a = Number(m[1]);
    let b = m[2] ? Number(m[2]) : a;
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    if (a > b) [a, b] = [b, a];
    a = Math.max(1, Math.min(pageCount, a));
    b = Math.max(1, Math.min(pageCount, b));
    const indices: number[] = [];
    for (let i = a; i <= b; i++) indices.push(i - 1);
    if (indices.length) groups.push(indices);
  }
  return groups;
}

export async function rotateAllPages(
  file: File,
  angle: 90 | 180 | 270,
  onProgress?: PdfProgress,
): Promise<ProcessedPdf> {
  const doc = await loadDoc(await readBytes(file));
  const pages = doc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + angle) % 360));
    onProgress?.(i + 1, pages.length);
  }
  const bytes = await doc.save({ useObjectStreams: true });
  return resultFromBytes(
    bytes,
    `${baseName(file.name)}-rotated.pdf`,
    file.name,
    file.size,
  );
}

export type OrganizeOp = {
  /** Original 0-based page index */
  sourceIndex: number;
  /** Extra rotation to apply (0/90/180/270) */
  rotation: number;
};

export async function organizePdf(
  file: File,
  ops: OrganizeOp[],
  onProgress?: PdfProgress,
): Promise<ProcessedPdf> {
  if (!ops.length) throw new Error(PDF_ERROR.empty);
  const src = await loadDoc(await readBytes(file));
  const out = await PDFDocument.create();
  const indices = ops.map((o) => o.sourceIndex);
  const copied = await out.copyPages(src, indices);
  for (let i = 0; i < copied.length; i++) {
    const page = copied[i];
    const rot = ops[i].rotation % 360;
    if (rot) {
      const current = page.getRotation().angle;
      page.setRotation(degrees((current + rot) % 360));
    }
    out.addPage(page);
    onProgress?.(i + 1, copied.length);
  }
  const bytes = await out.save({ useObjectStreams: true });
  return resultFromBytes(
    bytes,
    `${baseName(file.name)}-organized.pdf`,
    file.name,
    file.size,
  );
}

export async function renderPageThumbs(
  file: File,
  maxSide = 160,
  onProgress?: PdfProgress,
  maxPages?: number,
): Promise<PdfPageThumb[]> {
  const bytes = await readBytes(file);
  const pdf = await openWithPdfjs(bytes);
  const thumbs: PdfPageThumb[] = [];
  const limit =
    maxPages !== undefined
      ? Math.min(pdf.numPages, Math.max(1, maxPages))
      : pdf.numPages;
  for (let i = 1; i <= limit; i++) {
    const page = await pdf.getPage(i);
    const base = page.getViewport({ scale: 1 });
    const scale = maxSide / Math.max(base.width, base.height);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error(PDF_ERROR.canvasUnavailable);
    await page.render({ canvasContext: ctx, canvas, viewport }).promise;
    thumbs.push({
      index: i - 1,
      width: canvas.width,
      height: canvas.height,
      dataUrl: canvas.toDataURL("image/jpeg", 0.7),
      rotation: 0,
    });
    onProgress?.(i, limit);
  }
  return thumbs;
}

export async function imagesToPdf(
  files: File[],
  onProgress?: PdfProgress,
): Promise<ProcessedPdf> {
  const list = files.filter(isImageForPdf);
  if (!list.length) throw new Error(PDF_ERROR.noImages);
  const out = await PDFDocument.create();
  let originalSize = 0;

  for (let i = 0; i < list.length; i++) {
    const file = list[i];
    originalSize += file.size;
    const bytes = await readBytes(file);
    const lower = file.name.toLowerCase();
    const isPng =
      file.type === "image/png" || lower.endsWith(".png");
    const image = isPng
      ? await out.embedPng(bytes)
      : await out.embedJpg(
          file.type === "image/webp" || lower.endsWith(".webp")
            ? await rasterToJpeg(file)
            : bytes,
        );
    const page = out.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
    onProgress?.(i + 1, list.length);
  }

  const bytes = await out.save({ useObjectStreams: true });
  return resultFromBytes(bytes, "images.pdf", list[0].name, originalSize);
}

async function rasterToJpeg(file: File): Promise<Uint8Array> {
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error(PDF_ERROR.canvasUnavailable);
    ctx.drawImage(bitmap, 0, 0);
    return canvasToJpeg(canvas, 0.92);
  } finally {
    bitmap.close();
  }
}

export async function pdfToJpg(
  file: File,
  quality = 0.85,
  scale = 2,
  onProgress?: PdfProgress,
): Promise<ProcessedPdf[]> {
  const bytes = await readBytes(file);
  const pdf = await openWithPdfjs(bytes);
  const results: ProcessedPdf[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error(PDF_ERROR.canvasUnavailable);
    await page.render({ canvasContext: ctx, canvas, viewport }).promise;
    const jpgBytes = await canvasToJpeg(canvas, quality);
    const blob = toBlob(jpgBytes, "image/jpeg");
    const name = `${baseName(file.name)}-p${i}.jpg`;
    results.push({
      id: uid(name),
      name,
      originalName: file.name,
      originalSize: file.size,
      resultSize: blob.size,
      blob,
      url: URL.createObjectURL(blob),
      grew: false,
    });
    onProgress?.(i, pdf.numPages);
  }
  return results;
}

/** Default watermark gray ≈ #737373 */
export const WATERMARK_DEFAULT_COLOR = "#737373";

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const raw = hex.replace("#", "").trim();
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    return { r: 0.45, g: 0.45, b: 0.45 };
  }
  return {
    r: parseInt(full.slice(0, 2), 16) / 255,
    g: parseInt(full.slice(2, 4), 16) / 255,
    b: parseInt(full.slice(4, 6), 16) / 255,
  };
}

export async function watermarkPdf(
  file: File,
  text: string,
  opacity = 0.25,
  onProgress?: PdfProgress,
  colorHex: string = WATERMARK_DEFAULT_COLOR,
): Promise<ProcessedPdf> {
  const doc = await loadDoc(await readBytes(file));
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const pages = doc.getPages();
  const mark = (text || "CONFIDENTIAL").slice(0, 80);
  const { r, g, b } = hexToRgb(colorHex);

  for (let i = 0; i < pages.length; i++) {
    drawWatermark(pages[i], font, mark, opacity, r, g, b);
    onProgress?.(i + 1, pages.length);
  }

  const bytes = await doc.save({ useObjectStreams: true });
  return resultFromBytes(
    bytes,
    `${baseName(file.name)}-watermark.pdf`,
    file.name,
    file.size,
  );
}

function drawWatermark(
  page: PDFPage,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  text: string,
  opacity: number,
  r: number,
  g: number,
  b: number,
) {
  const { width, height } = page.getSize();
  const fontSize = Math.max(18, Math.min(width, height) * 0.08);
  const textWidth = font.widthOfTextAtSize(text, fontSize);
  page.drawText(text, {
    x: (width - textWidth) / 2,
    y: height / 2 - fontSize / 2,
    size: fontSize,
    font,
    color: rgb(r, g, b),
    opacity: Math.min(0.6, Math.max(0.08, opacity)),
    rotate: degrees(35),
  });
}

export async function addPageNumbers(
  file: File,
  format: "n" | "n-of-N" = "n-of-N",
  onProgress?: PdfProgress,
): Promise<ProcessedPdf> {
  const doc = await loadDoc(await readBytes(file));
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const total = pages.length;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width } = page.getSize();
    const label =
      format === "n" ? `${i + 1}` : `${i + 1} / ${total}`;
    const size = 10;
    const tw = font.widthOfTextAtSize(label, size);
    page.drawText(label, {
      x: (width - tw) / 2,
      y: 18,
      size,
      font,
      color: rgb(0.25, 0.25, 0.25),
    });
    onProgress?.(i + 1, total);
  }

  const bytes = await doc.save({ useObjectStreams: true });
  return resultFromBytes(
    bytes,
    `${baseName(file.name)}-numbered.pdf`,
    file.name,
    file.size,
  );
}

export async function cropPdf(
  file: File,
  marginPct: number,
  onProgress?: PdfProgress,
): Promise<ProcessedPdf> {
  const pct = Math.min(40, Math.max(0, marginPct)) / 100;
  const doc = await loadDoc(await readBytes(file));
  const pages = doc.getPages();

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    const mx = width * pct;
    const my = height * pct;
    const box = {
      x: mx,
      y: my,
      width: width - mx * 2,
      height: height - my * 2,
    };
    page.setCropBox(box.x, box.y, box.width, box.height);
    page.setMediaBox(box.x, box.y, box.width, box.height);
    onProgress?.(i + 1, pages.length);
  }

  const bytes = await doc.save({ useObjectStreams: true });
  return resultFromBytes(
    bytes,
    `${baseName(file.name)}-cropped.pdf`,
    file.name,
    file.size,
  );
}

export async function protectPdf(
  file: File,
  userPassword: string,
  onProgress?: PdfProgress,
): Promise<ProcessedPdf> {
  if (!userPassword) throw new Error(PDF_ERROR.needPassword);
  onProgress?.(1, 2);
  const { encryptPDF } = await import("@pdfsmaller/pdf-encrypt");
  const bytes = await encryptPDF(await readBytes(file), userPassword, {
    algorithm: "AES-256",
  });
  onProgress?.(2, 2);
  return resultFromBytes(
    bytes,
    `${baseName(file.name)}-protected.pdf`,
    file.name,
    file.size,
  );
}

export async function unlockPdf(
  file: File,
  password: string,
  onProgress?: PdfProgress,
): Promise<ProcessedPdf> {
  if (!password) throw new Error(PDF_ERROR.needPassword);
  onProgress?.(1, 2);
  const { decryptPDF, isEncrypted } = await import("@pdfsmaller/pdf-decrypt");
  const raw = await readBytes(file);
  const info = await isEncrypted(raw);
  if (!info.encrypted) throw new Error(PDF_ERROR.notEncrypted);
  try {
    const bytes = await decryptPDF(raw, password);
    onProgress?.(2, 2);
    return resultFromBytes(
      bytes,
      `${baseName(file.name)}-unlocked.pdf`,
      file.name,
      file.size,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/incorrect|password/i.test(msg)) {
      throw new Error(PDF_ERROR.badPassword);
    }
    throw new Error(PDF_ERROR.loadFailed);
  }
}

export function revokeProcessed(items: ProcessedPdf[]) {
  for (const item of items) {
    try {
      URL.revokeObjectURL(item.url);
    } catch {
      /* ignore */
    }
  }
}
