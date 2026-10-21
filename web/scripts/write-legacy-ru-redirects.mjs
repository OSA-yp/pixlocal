#!/usr/bin/env node
/**
 * After EN became default at `/`, old bookmark URLs that were Russian
 * (no locale prefix) would 404 or show English. Emit static HTML redirects
 * from each RU tool slug + legal pages at site root → `/ru/...`.
 */
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(root, "out");
const toolsSrc = readFileSync(join(root, "src/lib/tools.ts"), "utf8");

const block = toolsSrc.match(
  /export const toolSlugs[^=]*=\s*(\{[\s\S]*?\n\});/,
);
if (!block) {
  console.error("write-legacy-ru-redirects: could not parse toolSlugs");
  process.exit(1);
}
/** @type {Record<string, Record<string, string>>} */
const toolSlugs = new Function(`return (${block[1]})`)();

const targets = new Set(["privacy", "terms", "contacts"]);
for (const map of Object.values(toolSlugs)) {
  if (map.ru) targets.add(map.ru);
}

function redirectHtml(toPath) {
  const href = toPath.endsWith("/") ? toPath : `${toPath}/`;
  return `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"/><meta http-equiv="refresh" content="0;url=${href}"/><link rel="canonical" href="${href}"/><title>Redirect</title></head><body><p><a href="${href}">PixLocal</a></p></body></html>\n`;
}

let n = 0;
for (const slug of targets) {
  // Do not overwrite English pages that share the same slug (privacy/terms/contacts)
  if (slug === "privacy" || slug === "terms" || slug === "contacts") {
    // EN and RU legal slugs are identical — root stays EN; RU is only under /ru/
    continue;
  }
  const dir = join(OUT, slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), redirectHtml(`/ru/${slug}/`));
  n += 1;
}

console.log(`write-legacy-ru-redirects: ${n} redirects → /ru/…`);
