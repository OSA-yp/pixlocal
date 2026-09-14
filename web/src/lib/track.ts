import { analyticsConfig } from "@/lib/config";

export const TRACK_GOALS = {
  fileSelect: "file_select",
  download: "download",
  zipDownload: "zip_download",
} as const;

export type TrackParams = Record<string, string | number | boolean | undefined>;

/** Цели Метрики / события GA4. Не передавать имена файлов и содержимое. */
export function track(name: string, params: TrackParams = {}) {
  if (typeof window === "undefined") return;

  const payload: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) payload[key] = value;
  }

  const { yandexMetrikaId, ga4Id } = analyticsConfig;

  if (yandexMetrikaId && typeof window.ym === "function") {
    window.ym(yandexMetrikaId, "reachGoal", name, payload);
  }

  if (ga4Id && typeof window.gtag === "function") {
    window.gtag("event", name, payload);
  }
}
