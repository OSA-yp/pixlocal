#!/usr/bin/env node
/**
 * After flatten moves EN from out/en/ → out/, recreate out/en/* as
 * static HTML redirects so old /en/... URLs do not 404.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(root, "out");

/** Locale prefixes that are not English-at-root content. */
const OTHER_LOCALE_DIRS = new Set([
  "ru",
  "zh",
  "hi",
  "es",
  "ar",
  "fr",
  "bn",
  "pt",
  "id",
  "en", // do not recurse into redirects we create
]);

function redirectHtml(toPath) {
  const href = toPath.endsWith("/") ? toPath : `${toPath}/`;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta http-equiv="refresh" content="0;url=${href}"/><link rel="canonical" href="${href}"/><title>Redirect</title></head><body><p><a href="${href}">PixLocal</a></p></body></html>\n`;
}

/** Collect relative dirs (posix-style) that contain index.html under EN root. */
function collectEnDirs(dir, rel = "") {
  /** @type {string[]} */
  const found = [];
  if (!existsSync(dir)) return found;

  const indexPath = join(dir, "index.html");
  if (existsSync(indexPath) && statSync(indexPath).isFile()) {
    found.push(rel);
  }

  for (const name of readdirSync(dir)) {
    if (name.startsWith("_") || name === "404.html") continue;
    const full = join(dir, name);
    if (!statSync(full).isDirectory()) continue;
    // Only skip other locales at the top level of out/
    if (rel === "" && OTHER_LOCALE_DIRS.has(name)) continue;
    const nextRel = rel ? `${rel}/${name}` : name;
    found.push(...collectEnDirs(full, nextRel));
  }
  return found;
}

if (!existsSync(join(OUT, "index.html"))) {
  console.log("write-en-prefix-redirects: no out/index.html — skip");
  process.exit(0);
}

const dirs = collectEnDirs(OUT);
let n = 0;
for (const rel of dirs) {
  const publicPath = rel === "" ? "/" : `/${rel}/`;
  const enDir = rel === "" ? join(OUT, "en") : join(OUT, "en", ...rel.split("/"));
  mkdirSync(enDir, { recursive: true });
  writeFileSync(join(enDir, "index.html"), redirectHtml(publicPath));
  n += 1;
}

console.log(`write-en-prefix-redirects: ${n} redirects out/en/… → public EN paths`);
