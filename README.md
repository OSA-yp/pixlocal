# PixLocal

Private, on-device tools for images and PDFs. Processing runs in your browser — file contents are not uploaded to a server.

Live sites: [pixlocal.app](https://pixlocal.app) · [pixlocal.ru](https://pixlocal.ru)

## Features

- **Images** — compress and convert JPG, PNG, WebP, and HEIC; resize; target file size; strip EXIF/metadata; blur/redact regions
- **PDF** — compress, merge, split, rotate, organize, crop, watermark, page numbers, protect/unlock, JPG ↔ PDF
- **Privacy** — no ads, no accounts, no cloud processing of your files
- **Offline (PWA)** — header button **Offline** packs **only the current language** on demand (tool pages + HEIC/PDF engines), with a visible progress checklist; refresh or **remove** the pack anytime; installable with brand icons (any + maskable)
- **i18n** — ten locales with locale-aware routing and SEO metadata

## Tech stack

- Next.js 15 (App Router) with static `output: "export"`
- React 19, TypeScript, Tailwind CSS 4, next-intl
- Images: browser Canvas API, [heic-to](https://github.com/hoppergee/heic-to) (libheif)
- PDF: pdf-lib, pdf.js, @pdfsmaller encrypt/decrypt helpers
- ZIP downloads: jszip
- PWA: Serwist service worker (`web/src/sw.ts`), manifest + icons under `web/public/`
- Analytics: Google Analytics 4 (optional; Measurement ID chosen by hostname)

## Develop

```bash
cd web
cp .env.example .env.local
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Offline pack / service worker run in **production builds** only (`npm run build` + static host). In `next dev` the Offline control shows as unsupported.

## Build

```bash
cd web
npm ci
npm run build
```

`prebuild` copies the PDF.js worker and regenerates PWA icons. After Next export, `scripts/build-sw.mjs` writes `out/sw.js`.

Static output is `web/out/`. One build deploys to both hosts (GitHub Pages for `.app`, Yandex Object Storage for `.ru`) via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

Optional public env vars (also as GitHub Actions Variables):

- `NEXT_PUBLIC_GA4_ID` — GA4 for pixlocal.app
- `NEXT_PUBLIC_GA4_ID_RU` — GA4 for pixlocal.ru
- `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_SITE_URL_RU` — canonical hosts
- verification tokens for Search Console / Webmaster (if not set via DNS)

Serve the export locally with `npx serve out` (not `next start`).

## License notices

Third-party notices for Canvas, heic-to/libheif (LGPL-3.0), jszip, and related libraries: [web/LICENSES.md](web/LICENSES.md).
