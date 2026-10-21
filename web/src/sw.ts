/// <reference lib="esnext" />
/// <reference lib="webworker" />
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import {
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  Serwist,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const OFFLINE_FALLBACK = "/offline/";
/** Same cache as NetworkFirst navigations so packed locale pages work offline. */
const RUNTIME_CACHE = "pixlocal-runtime-v1";

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: [
    {
      matcher: ({ url }) =>
        url.hostname === "www.googletagmanager.com" ||
        url.hostname === "www.google-analytics.com",
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ request, url }) =>
        request.destination === "script" ||
        request.destination === "style" ||
        url.pathname.startsWith("/_next/static/"),
      handler: new CacheFirst({
        cacheName: "pixlocal-static-v1",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 80,
            maxAgeSeconds: 60 * 60 * 24 * 365,
          }),
        ],
      }),
    },
    {
      matcher: ({ url }) => url.pathname === "/pdf.worker.min.mjs",
      handler: new CacheFirst({
        cacheName: "pixlocal-worker-v1",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 4,
            maxAgeSeconds: 60 * 60 * 24 * 365,
          }),
        ],
      }),
    },
    {
      matcher: ({ request }) => request.mode === "navigate",
      handler: new NetworkFirst({
        cacheName: RUNTIME_CACHE,
        networkTimeoutSeconds: 4,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 64,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          }),
        ],
      }),
    },
  ],
  fallbacks: {
    entries: [
      {
        url: OFFLINE_FALLBACK,
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

type PrecacheMessage = {
  type: "PRECACHE_URLS";
  requestId: string;
  urls: string[];
};

type ProgressMessage = {
  type: "PRECACHE_PROGRESS";
  requestId: string;
  done: number;
  total: number;
};

type DoneMessage = {
  type: "PRECACHE_DONE";
  requestId: string;
  ok: number;
  failed: number;
};

type ErrorMessage = {
  type: "PRECACHE_ERROR";
  requestId: string;
  message: string;
};

async function precacheUrls(
  urls: string[],
  requestId: string,
  client: Client | null,
) {
  const cache = await caches.open(RUNTIME_CACHE);
  let done = 0;
  let ok = 0;
  let failed = 0;
  const total = urls.length;

  const report = (msg: ProgressMessage | DoneMessage | ErrorMessage) => {
    client?.postMessage(msg);
  };

  for (const url of urls) {
    try {
      const res = await fetch(url, { credentials: "same-origin" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await cache.put(url, res.clone());
      ok += 1;
    } catch {
      failed += 1;
    }
    done += 1;
    report({ type: "PRECACHE_PROGRESS", requestId, done, total });
  }

  report({ type: "PRECACHE_DONE", requestId, ok, failed });
}

self.addEventListener("message", (event: ExtendableMessageEvent) => {
  const data = event.data as PrecacheMessage | undefined;
  if (!data || data.type !== "PRECACHE_URLS" || !Array.isArray(data.urls)) {
    return;
  }
  const client = event.source as Client | null;
  event.waitUntil(precacheUrls(data.urls, data.requestId, client));
});
