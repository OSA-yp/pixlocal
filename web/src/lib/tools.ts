import type { OutputFormat } from "@/lib/image";
import type { Locale } from "@/i18n/config";
import { locales } from "@/i18n/config";

export const IMAGE_TOOL_IDS = [
  "heic-v-jpg",
  "webp-v-jpg",
  "png-v-jpg",
  "jpg-v-png",
  "jpg-v-webp",
  "png-v-webp",
  "webp-v-png",
  "izmenit-razmer",
  "szhat-do-100kb",
  "szhat-png",
  "szhat-jpg",
  "udalit-exif",
  "skryt-oblast",
] as const;

export const PDF_TOOL_IDS = [
  "compress-pdf",
  "merge-pdf",
  "pdf-sanitize",
  "split-pdf",
  "rotate-pdf",
  "organize-pdf",
  "jpg-to-pdf",
  "pdf-to-jpg",
  "watermark-pdf",
  "page-numbers-pdf",
  "crop-pdf",
  "protect-pdf",
  "unlock-pdf",
] as const;

export const TOOL_IDS = [...IMAGE_TOOL_IDS, ...PDF_TOOL_IDS] as const;

export type ImageToolId = (typeof IMAGE_TOOL_IDS)[number];
export type PdfToolId = (typeof PDF_TOOL_IDS)[number];
export type ToolId = (typeof TOOL_IDS)[number];

export function isPdfTool(id: ToolId | undefined): id is PdfToolId {
  return !!id && (PDF_TOOL_IDS as readonly string[]).includes(id);
}

export function isImageTool(id: ToolId | undefined): id is ImageToolId {
  return !!id && (IMAGE_TOOL_IDS as readonly string[]).includes(id);
}

/** Display order for hub grid: privacy tools first, then the rest. */
export const TOOL_LINK_ORDER: ToolId[] = [
  "udalit-exif",
  "skryt-oblast",
  "heic-v-jpg",
  "szhat-do-100kb",
  "szhat-jpg",
  "szhat-png",
  "webp-v-jpg",
  "png-v-jpg",
  "jpg-v-webp",
  "png-v-webp",
  "jpg-v-png",
  "webp-v-png",
  "izmenit-razmer",
  ...PDF_TOOL_IDS,
];

export const PDF_LINK_ORDER: PdfToolId[] = [...PDF_TOOL_IDS];

export type ToolPresetBase = {
  mode: "compress" | "convert" | "resize" | "pdf";
  accept: string;
  defaultOutput: OutputFormat;
  lockOutput?: boolean;
  defaultQuality?: number;
  defaultMaxSide?: number;
  defaultTargetKb?: number;
  /** When true, user may uncheck metadata strip if no re-encode is required. */
  allowKeepMetadata?: boolean;
};

/** Localized URL slugs (ASCII) per tool */
export const toolSlugs: Record<ToolId, Record<Locale, string>> = {
  "heic-v-jpg": {
    ru: "heic-v-jpg",
    en: "heic-to-jpg",
    zh: "heic-to-jpg",
    hi: "heic-to-jpg",
    es: "heic-a-jpg",
    ar: "heic-to-jpg",
    fr: "heic-en-jpg",
    bn: "heic-to-jpg",
    pt: "heic-para-jpg",
    id: "heic-ke-jpg",
  },
  "webp-v-jpg": {
    ru: "webp-v-jpg",
    en: "webp-to-jpg",
    zh: "webp-to-jpg",
    hi: "webp-to-jpg",
    es: "webp-a-jpg",
    ar: "webp-to-jpg",
    fr: "webp-en-jpg",
    bn: "webp-to-jpg",
    pt: "webp-para-jpg",
    id: "webp-ke-jpg",
  },
  "png-v-jpg": {
    ru: "png-v-jpg",
    en: "png-to-jpg",
    zh: "png-to-jpg",
    hi: "png-to-jpg",
    es: "png-a-jpg",
    ar: "png-to-jpg",
    fr: "png-en-jpg",
    bn: "png-to-jpg",
    pt: "png-para-jpg",
    id: "png-ke-jpg",
  },
  "jpg-v-png": {
    ru: "jpg-v-png",
    en: "jpg-to-png",
    zh: "jpg-to-png",
    hi: "jpg-to-png",
    es: "jpg-a-png",
    ar: "jpg-to-png",
    fr: "jpg-en-png",
    bn: "jpg-to-png",
    pt: "jpg-para-png",
    id: "jpg-ke-png",
  },
  "jpg-v-webp": {
    ru: "jpg-v-webp",
    en: "jpg-to-webp",
    zh: "jpg-to-webp",
    hi: "jpg-to-webp",
    es: "jpg-a-webp",
    ar: "jpg-to-webp",
    fr: "jpg-en-webp",
    bn: "jpg-to-webp",
    pt: "jpg-para-webp",
    id: "jpg-ke-webp",
  },
  "png-v-webp": {
    ru: "png-v-webp",
    en: "png-to-webp",
    zh: "png-to-webp",
    hi: "png-to-webp",
    es: "png-a-webp",
    ar: "png-to-webp",
    fr: "png-en-webp",
    bn: "png-to-webp",
    pt: "png-para-webp",
    id: "png-ke-webp",
  },
  "webp-v-png": {
    ru: "webp-v-png",
    en: "webp-to-png",
    zh: "webp-to-png",
    hi: "webp-to-png",
    es: "webp-a-png",
    ar: "webp-to-png",
    fr: "webp-en-png",
    bn: "webp-to-png",
    pt: "webp-para-png",
    id: "webp-ke-png",
  },
  "izmenit-razmer": {
    ru: "izmenit-razmer",
    en: "resize-image",
    zh: "resize-image",
    hi: "resize-image",
    es: "redimensionar-imagen",
    ar: "resize-image",
    fr: "redimensionner-image",
    bn: "resize-image",
    pt: "redimensionar-imagem",
    id: "ubah-ukuran-gambar",
  },
  "szhat-do-100kb": {
    ru: "szhat-do-100kb",
    en: "compress-to-100kb",
    zh: "compress-to-100kb",
    hi: "compress-to-100kb",
    es: "comprimir-a-100kb",
    ar: "compress-to-100kb",
    fr: "compresser-a-100ko",
    bn: "compress-to-100kb",
    pt: "comprimir-para-100kb",
    id: "kompres-ke-100kb",
  },
  "szhat-png": {
    ru: "szhat-png",
    en: "compress-png",
    zh: "compress-png",
    hi: "compress-png",
    es: "comprimir-png",
    ar: "compress-png",
    fr: "compresser-png",
    bn: "compress-png",
    pt: "comprimir-png",
    id: "kompres-png",
  },
  "szhat-jpg": {
    ru: "szhat-jpg",
    en: "compress-jpg",
    zh: "compress-jpg",
    hi: "compress-jpg",
    es: "comprimir-jpg",
    ar: "compress-jpg",
    fr: "compresser-jpg",
    bn: "compress-jpg",
    pt: "comprimir-jpg",
    id: "kompres-jpg",
  },
  "udalit-exif": {
    ru: "udalit-exif",
    en: "remove-exif",
    zh: "remove-exif",
    hi: "remove-exif",
    es: "eliminar-exif",
    ar: "remove-exif",
    fr: "supprimer-exif",
    bn: "remove-exif",
    pt: "remover-exif",
    id: "hapus-exif",
  },
  "skryt-oblast": {
    ru: "skryt-oblast",
    en: "blur-redact",
    zh: "blur-redact",
    hi: "blur-redact",
    es: "difuminar-area",
    ar: "blur-redact",
    fr: "flouter-zone",
    bn: "blur-redact",
    pt: "borrar-area",
    id: "samarkan-area",
  },
  "compress-pdf": {
    ru: "szhat-pdf",
    en: "compress-pdf",
    zh: "compress-pdf",
    hi: "compress-pdf",
    es: "comprimir-pdf",
    ar: "compress-pdf",
    fr: "compresser-pdf",
    bn: "compress-pdf",
    pt: "comprimir-pdf",
    id: "kompres-pdf",
  },
  "merge-pdf": {
    ru: "obedinit-pdf",
    en: "merge-pdf",
    zh: "merge-pdf",
    hi: "merge-pdf",
    es: "unir-pdf",
    ar: "merge-pdf",
    fr: "fusionner-pdf",
    bn: "merge-pdf",
    pt: "juntar-pdf",
    id: "gabung-pdf",
  },
  "pdf-sanitize": {
    ru: "udalit-dannye-pdf",
    en: "remove-pdf-metadata",
    zh: "remove-pdf-metadata",
    hi: "remove-pdf-metadata",
    es: "eliminar-metadatos-pdf",
    ar: "remove-pdf-metadata",
    fr: "supprimer-metadonnees-pdf",
    bn: "remove-pdf-metadata",
    pt: "remover-metadados-pdf",
    id: "hapus-metadata-pdf",
  },
  "split-pdf": {
    ru: "razdelit-pdf",
    en: "split-pdf",
    zh: "split-pdf",
    hi: "split-pdf",
    es: "dividir-pdf",
    ar: "split-pdf",
    fr: "diviser-pdf",
    bn: "split-pdf",
    pt: "separar-pdf",
    id: "pisah-pdf",
  },
  "rotate-pdf": {
    ru: "povernut-pdf",
    en: "rotate-pdf",
    zh: "rotate-pdf",
    hi: "rotate-pdf",
    es: "rotar-pdf",
    ar: "rotate-pdf",
    fr: "pivoter-pdf",
    bn: "rotate-pdf",
    pt: "girar-pdf",
    id: "putar-pdf",
  },
  "organize-pdf": {
    ru: "organizovat-pdf",
    en: "organize-pdf",
    zh: "organize-pdf",
    hi: "organize-pdf",
    es: "organizar-pdf",
    ar: "organize-pdf",
    fr: "organiser-pdf",
    bn: "organize-pdf",
    pt: "organizar-pdf",
    id: "atur-pdf",
  },
  "jpg-to-pdf": {
    ru: "jpg-v-pdf",
    en: "jpg-to-pdf",
    zh: "jpg-to-pdf",
    hi: "jpg-to-pdf",
    es: "jpg-a-pdf",
    ar: "jpg-to-pdf",
    fr: "jpg-en-pdf",
    bn: "jpg-to-pdf",
    pt: "jpg-para-pdf",
    id: "jpg-ke-pdf",
  },
  "pdf-to-jpg": {
    ru: "pdf-v-jpg",
    en: "pdf-to-jpg",
    zh: "pdf-to-jpg",
    hi: "pdf-to-jpg",
    es: "pdf-a-jpg",
    ar: "pdf-to-jpg",
    fr: "pdf-en-jpg",
    bn: "pdf-to-jpg",
    pt: "pdf-para-jpg",
    id: "pdf-ke-jpg",
  },
  "watermark-pdf": {
    ru: "vodnyy-znak-pdf",
    en: "watermark-pdf",
    zh: "watermark-pdf",
    hi: "watermark-pdf",
    es: "marca-agua-pdf",
    ar: "watermark-pdf",
    fr: "filigrane-pdf",
    bn: "watermark-pdf",
    pt: "marca-dagua-pdf",
    id: "watermark-pdf",
  },
  "page-numbers-pdf": {
    ru: "nomera-stranits-pdf",
    en: "page-numbers-pdf",
    zh: "page-numbers-pdf",
    hi: "page-numbers-pdf",
    es: "numeros-pagina-pdf",
    ar: "page-numbers-pdf",
    fr: "numeros-page-pdf",
    bn: "page-numbers-pdf",
    pt: "numeros-pagina-pdf",
    id: "nomor-halaman-pdf",
  },
  "crop-pdf": {
    ru: "obrezat-pdf",
    en: "crop-pdf",
    zh: "crop-pdf",
    hi: "crop-pdf",
    es: "recortar-pdf",
    ar: "crop-pdf",
    fr: "recadrer-pdf",
    bn: "crop-pdf",
    pt: "recortar-pdf",
    id: "potong-pdf",
  },
  "protect-pdf": {
    ru: "zashchitit-pdf",
    en: "protect-pdf",
    zh: "protect-pdf",
    hi: "protect-pdf",
    es: "proteger-pdf",
    ar: "protect-pdf",
    fr: "proteger-pdf",
    bn: "protect-pdf",
    pt: "proteger-pdf",
    id: "lindungi-pdf",
  },
  "unlock-pdf": {
    ru: "razblokirovat-pdf",
    en: "unlock-pdf",
    zh: "unlock-pdf",
    hi: "unlock-pdf",
    es: "desbloquear-pdf",
    ar: "unlock-pdf",
    fr: "deverrouiller-pdf",
    bn: "unlock-pdf",
    pt: "desbloquear-pdf",
    id: "buka-pdf",
  },
};

const imagePresets: Record<ImageToolId, ToolPresetBase> = {
  "heic-v-jpg": {
    mode: "convert",
    accept: ".heic,.heif,image/heic,image/heif,image/*",
    defaultOutput: "image/jpeg",
    lockOutput: true,
    defaultQuality: 0.75,
    defaultMaxSide: 2560,
  },
  "webp-v-jpg": {
    mode: "convert",
    accept: "image/webp,.webp",
    defaultOutput: "image/jpeg",
    lockOutput: true,
    defaultQuality: 0.8,
    defaultMaxSide: 2560,
  },
  "png-v-jpg": {
    mode: "convert",
    accept: "image/png,.png",
    defaultOutput: "image/jpeg",
    lockOutput: true,
    defaultQuality: 0.8,
    defaultMaxSide: 2560,
  },
  "jpg-v-png": {
    mode: "convert",
    accept: "image/jpeg,.jpg,.jpeg",
    defaultOutput: "image/png",
    lockOutput: true,
    defaultQuality: 0.92,
  },
  "jpg-v-webp": {
    mode: "convert",
    accept: "image/jpeg,.jpg,.jpeg",
    defaultOutput: "image/webp",
    lockOutput: true,
    defaultQuality: 0.8,
  },
  "png-v-webp": {
    mode: "convert",
    accept: "image/png,.png",
    defaultOutput: "image/webp",
    lockOutput: true,
    defaultQuality: 0.8,
  },
  "webp-v-png": {
    mode: "convert",
    accept: "image/webp,.webp",
    defaultOutput: "image/png",
    lockOutput: true,
    defaultQuality: 0.92,
  },
  "izmenit-razmer": {
    mode: "resize",
    accept: "image/*",
    defaultOutput: "image/jpeg",
    defaultQuality: 0.85,
    defaultMaxSide: 1920,
  },
  "szhat-do-100kb": {
    mode: "compress",
    accept: "image/*",
    defaultOutput: "image/jpeg",
    defaultQuality: 0.7,
    defaultTargetKb: 100,
    defaultMaxSide: 1600,
  },
  "szhat-png": {
    mode: "compress",
    accept: "image/png,.png",
    defaultOutput: "image/webp",
    defaultQuality: 0.8,
  },
  "szhat-jpg": {
    mode: "compress",
    accept: "image/jpeg,.jpg,.jpeg",
    defaultOutput: "image/jpeg",
    lockOutput: true,
    defaultQuality: 0.75,
  },
  "udalit-exif": {
    mode: "compress",
    accept: "image/jpeg,image/png,image/webp,.heic,.heif,image/heic,image/heif",
    defaultOutput: "image/jpeg",
    defaultQuality: 0.9,
    defaultMaxSide: 0,
    allowKeepMetadata: true,
  },
  "skryt-oblast": {
    mode: "compress",
    accept: "image/*",
    defaultOutput: "image/jpeg",
    lockOutput: true,
    defaultQuality: 0.92,
  },
};

const pdfAccept = "application/pdf,.pdf";
const imageAccept = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

const pdfPresets: Record<PdfToolId, ToolPresetBase> = {
  "compress-pdf": {
    mode: "pdf",
    accept: pdfAccept,
    defaultOutput: "image/jpeg",
  },
  "merge-pdf": {
    mode: "pdf",
    accept: pdfAccept,
    defaultOutput: "image/jpeg",
  },
  "pdf-sanitize": {
    mode: "pdf",
    accept: pdfAccept,
    defaultOutput: "image/jpeg",
  },
  "split-pdf": {
    mode: "pdf",
    accept: pdfAccept,
    defaultOutput: "image/jpeg",
  },
  "rotate-pdf": {
    mode: "pdf",
    accept: pdfAccept,
    defaultOutput: "image/jpeg",
  },
  "organize-pdf": {
    mode: "pdf",
    accept: pdfAccept,
    defaultOutput: "image/jpeg",
  },
  "jpg-to-pdf": {
    mode: "pdf",
    accept: imageAccept,
    defaultOutput: "image/jpeg",
  },
  "pdf-to-jpg": {
    mode: "pdf",
    accept: pdfAccept,
    defaultOutput: "image/jpeg",
  },
  "watermark-pdf": {
    mode: "pdf",
    accept: pdfAccept,
    defaultOutput: "image/jpeg",
  },
  "page-numbers-pdf": {
    mode: "pdf",
    accept: pdfAccept,
    defaultOutput: "image/jpeg",
  },
  "crop-pdf": {
    mode: "pdf",
    accept: pdfAccept,
    defaultOutput: "image/jpeg",
  },
  "protect-pdf": {
    mode: "pdf",
    accept: pdfAccept,
    defaultOutput: "image/jpeg",
  },
  "unlock-pdf": {
    mode: "pdf",
    accept: pdfAccept,
    defaultOutput: "image/jpeg",
  },
};

export const toolPresets: Record<ToolId, ToolPresetBase> = {
  ...imagePresets,
  ...pdfPresets,
};

/** Nav order (subset; kept for any legacy callers) */
export const headerToolIds: ToolId[] = [
  "heic-v-jpg",
  "szhat-do-100kb",
  "udalit-exif",
  "szhat-jpg",
  "webp-v-jpg",
];

/** @deprecated Use PDF_TOOL_IDS — kept empty so old imports don't list “soon”. */
export const PDF_SOON_IDS = [] as const;

export type PdfSoonId = never;

export const TOOL_MENU_GROUPS = {
  photo: ["home", ...IMAGE_TOOL_IDS] as const,
  pdf: PDF_TOOL_IDS,
};

const slugIndex: Partial<Record<Locale, Map<string, ToolId>>> = {};

function indexFor(locale: Locale): Map<string, ToolId> {
  if (!slugIndex[locale]) {
    const map = new Map<string, ToolId>();
    for (const id of TOOL_IDS) {
      map.set(toolSlugs[id][locale], id);
    }
    slugIndex[locale] = map;
  }
  return slugIndex[locale]!;
}

export function getToolSlug(toolId: ToolId, locale: Locale): string {
  return toolSlugs[toolId][locale];
}

export function getToolIdBySlug(locale: Locale, slug: string): ToolId | null {
  return indexFor(locale).get(slug) ?? null;
}

export function assertUniqueSlugs(): void {
  for (const locale of locales) {
    const seen = new Set<string>();
    for (const id of TOOL_IDS) {
      const slug = toolSlugs[id][locale];
      if (seen.has(slug)) {
        throw new Error(`Duplicate slug "${slug}" for locale ${locale}`);
      }
      seen.add(slug);
    }
  }
}
