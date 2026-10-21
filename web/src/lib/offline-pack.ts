import type { Locale } from "@/i18n/config";
import { offlineLocaleUrls, setOfflineReady } from "@/lib/offline-urls";

export type OfflineStepId = "pages" | "images" | "pdf" | "done";

export type OfflinePackProgress = {
  step: OfflineStepId;
  done: number;
  total: number;
  message?: string;
};

export type OfflinePackResult = {
  ok: boolean;
  failedPages: number;
};

function requestId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function waitForSw(): Promise<ServiceWorker | null> {
  if (!("serviceWorker" in navigator)) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.active ?? navigator.serviceWorker.controller;
}

async function precacheUrlsViaSw(
  urls: string[],
  onProgress: (done: number, total: number) => void,
): Promise<{ ok: number; failed: number }> {
  const sw = await waitForSw();
  if (!sw) {
    // Fallback: fetch into Cache API from the page
    const cache = await caches.open("pixlocal-runtime-v1");
    let done = 0;
    let ok = 0;
    let failed = 0;
    for (const url of urls) {
      try {
        const res = await fetch(url, { credentials: "same-origin" });
        if (!res.ok) throw new Error(String(res.status));
        await cache.put(url, res.clone());
        ok += 1;
      } catch {
        failed += 1;
      }
      done += 1;
      onProgress(done, urls.length);
    }
    return { ok, failed };
  }

  const id = requestId();
  return new Promise((resolve, reject) => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as
        | { type: string; requestId: string; done?: number; total?: number; ok?: number; failed?: number; message?: string }
        | undefined;
      if (!data || data.requestId !== id) return;
      if (data.type === "PRECACHE_PROGRESS" && data.done != null && data.total != null) {
        onProgress(data.done, data.total);
      }
      if (data.type === "PRECACHE_DONE") {
        navigator.serviceWorker.removeEventListener("message", onMessage);
        resolve({ ok: data.ok ?? 0, failed: data.failed ?? 0 });
      }
      if (data.type === "PRECACHE_ERROR") {
        navigator.serviceWorker.removeEventListener("message", onMessage);
        reject(new Error(data.message || "precache failed"));
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    sw.postMessage({ type: "PRECACHE_URLS", requestId: id, urls });
  });
}

async function warmImport(
  label: OfflineStepId,
  loader: () => Promise<unknown>,
  onProgress: (p: OfflinePackProgress) => void,
) {
  onProgress({ step: label, done: 0, total: 1 });
  await loader();
  onProgress({ step: label, done: 1, total: 1 });
}

/** Run full offline pack for one locale. No other locales are fetched. */
export async function runOfflinePack(
  locale: Locale,
  onProgress: (p: OfflinePackProgress) => void,
): Promise<OfflinePackResult> {
  const urls = offlineLocaleUrls(locale);
  onProgress({ step: "pages", done: 0, total: urls.length });

  const pages = await precacheUrlsViaSw(urls, (done, total) => {
    onProgress({ step: "pages", done, total });
  });

  await warmImport("images", () => import("heic-to"), onProgress);
  try {
    await import("exifr");
  } catch {
    /* optional */
  }
  try {
    await import("jszip");
  } catch {
    /* optional */
  }

  await warmImport(
    "pdf",
    async () => {
      await import("pdfjs-dist");
      await fetch("/pdf.worker.min.mjs", { credentials: "same-origin" });
    },
    onProgress,
  );

  onProgress({ step: "done", done: 1, total: 1 });
  setOfflineReady(locale, true);

  return {
    ok: pages.failed === 0 || pages.ok > 0,
    failedPages: pages.failed,
  };
}

export function serviceWorkerSupported(): boolean {
  return typeof navigator !== "undefined" && "serviceWorker" in navigator;
}

/** Production-only: SW is not registered in `next dev`. */
export function offlinePackAvailable(): boolean {
  return (
    process.env.NODE_ENV === "production" && serviceWorkerSupported()
  );
}
