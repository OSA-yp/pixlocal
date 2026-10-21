# PixLocal web app

See the [root README](../README.md) for product overview and stack.

## Commands

```bash
npm ci
npm run dev    # http://localhost:3000
npm run build  # static site → out/ (+ sw.js, PWA icons)
```

## Offline / PWA

- UI: header **Offline** → [`src/components/OfflineFeature.tsx`](src/components/OfflineFeature.tsx)
- Pack / clear: [`src/lib/offline-pack.ts`](src/lib/offline-pack.ts) (current locale only)
- Service worker: [`src/sw.ts`](src/sw.ts), built by [`scripts/build-sw.mjs`](scripts/build-sw.mjs)
- Icons: [`scripts/generate-pwa-icons.mjs`](scripts/generate-pwa-icons.mjs) → `public/icons/` (letter **P** + maskable variants)
- Manifest: [`public/manifest.webmanifest`](public/manifest.webmanifest)

Deploy: push `web/**` to `main` (or run the Deploy workflow). Yandex sync sets short cache for `sw.js`.
