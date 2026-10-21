export type ImageMetaSummary = {
  fileName: string;
  hasMeta: boolean;
  hasGps: boolean;
  gps?: { lat: number; lng: number };
  camera?: string;
  date?: string;
  software?: string;
  orientation?: number | string;
  lines: { key: string; value: string; risk?: boolean }[];
};

function fmtCoord(n: number) {
  return n.toFixed(5);
}

/**
 * Inspect EXIF / GPS / camera tags in the browser (lazy-loads exifr).
 * Parse failures → empty summary, never throws to the UI.
 */
export async function inspectImageMeta(file: File): Promise<ImageMetaSummary> {
  const empty: ImageMetaSummary = {
    fileName: file.name,
    hasMeta: false,
    hasGps: false,
    lines: [],
  };

  try {
    const exifr = await import("exifr");
    const data = await exifr.parse(file, {
      gps: true,
      exif: true,
      mergeOutput: true,
      pick: [
        "latitude",
        "longitude",
        "Make",
        "Model",
        "DateTimeOriginal",
        "CreateDate",
        "ModifyDate",
        "DateTime",
        "Software",
        "CreatorTool",
        "Orientation",
      ],
    });
    if (!data || typeof data !== "object") return empty;

    const lat = typeof data.latitude === "number" ? data.latitude : undefined;
    const lng = typeof data.longitude === "number" ? data.longitude : undefined;
    const hasGps = lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);

    const make = typeof data.Make === "string" ? data.Make : "";
    const model = typeof data.Model === "string" ? data.Model : "";
    const camera = [make, model].filter(Boolean).join(" ").trim() || undefined;

    const dateRaw =
      data.DateTimeOriginal ?? data.CreateDate ?? data.ModifyDate ?? data.DateTime;
    const date =
      dateRaw instanceof Date
        ? dateRaw.toISOString()
        : typeof dateRaw === "string"
          ? dateRaw
          : undefined;

    const software =
      typeof data.Software === "string"
        ? data.Software
        : typeof data.CreatorTool === "string"
          ? data.CreatorTool
          : undefined;

    const orientation = data.Orientation ?? data.orientation;

    const lines: ImageMetaSummary["lines"] = [];
    if (hasGps && lat != null && lng != null) {
      lines.push({
        key: "gps",
        value: `${fmtCoord(lat)}, ${fmtCoord(lng)}`,
        risk: true,
      });
    }
    if (camera) lines.push({ key: "camera", value: camera });
    if (date) lines.push({ key: "date", value: date });
    if (software) lines.push({ key: "software", value: software });
    if (orientation != null && orientation !== "" && orientation !== 1) {
      lines.push({ key: "orientation", value: String(orientation) });
    }

    return {
      fileName: file.name,
      hasMeta: lines.length > 0,
      hasGps,
      gps: hasGps && lat != null && lng != null ? { lat, lng } : undefined,
      camera,
      date,
      software,
      orientation,
      lines,
    };
  } catch {
    return empty;
  }
}

export async function inspectImageMetas(
  files: File[],
): Promise<ImageMetaSummary[]> {
  const out: ImageMetaSummary[] = [];
  for (const file of files) {
    out.push(await inspectImageMeta(file));
  }
  return out;
}
