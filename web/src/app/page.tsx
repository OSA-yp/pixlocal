import { defaultLocale } from "@/i18n/config";

/**
 * Fallback when visiting `/` before flatten (e.g. `next dev`).
 * Production `out/index.html` is replaced by the EN home via flatten script.
 */
export default function RootRedirect() {
  const href = `/${defaultLocale}/`;
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="refresh" content={`0;url=${href}`} />
        <link rel="canonical" href={href} />
      </head>
      <body>
        <p>
          <a href={href}>PixLocal</a>
        </p>
      </body>
    </html>
  );
}
