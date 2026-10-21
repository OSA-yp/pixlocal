#!/usr/bin/env node
/**
 * Bundle src/sw.ts and inject a minimal precache manifest into out/sw.js.
 * Runs after `next build` + flatten/redirect scripts (static export).
 */
import { injectManifest } from "@serwist/build";
import { build } from "esbuild";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const OUT = join(ROOT, "out");
const TMP = join(ROOT, ".sw-tmp");

if (!existsSync(join(OUT, "index.html"))) {
  console.error("build-sw: missing out/index.html — run next build first");
  process.exit(1);
}

mkdirSync(TMP, { recursive: true });
const swBundle = join(TMP, "sw.js");

await build({
  entryPoints: [join(ROOT, "src/sw.ts")],
  bundle: true,
  outfile: swBundle,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  logLevel: "warning",
});

const { count, size, warnings } = await injectManifest({
  swSrc: swBundle,
  swDest: join(OUT, "sw.js"),
  globDirectory: OUT,
  globPatterns: [
    "manifest.webmanifest",
    "icons/*.png",
    "pdf.worker.min.mjs",
    "offline/index.html",
  ],
  globIgnores: ["sw.js", "sw.js.map"],
  maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
  manifestTransforms: [
    async (entries) => {
      const manifest = entries.map((entry) => {
        let url = entry.url.replace(/\\/g, "/");
        if (url.endsWith("/index.html")) {
          url = url.slice(0, -"index.html".length);
          if (!url.startsWith("/")) url = `/${url}`;
        } else if (!url.startsWith("/")) {
          url = `/${url}`;
        }
        return { ...entry, url };
      });
      return { manifest, warnings: [] };
    },
  ],
});

rmSync(TMP, { recursive: true, force: true });

for (const w of warnings) console.warn("build-sw:", w);
console.log(`build-sw: precached ${count} files (${(size / 1024).toFixed(1)} KiB) → out/sw.js`);
