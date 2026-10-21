/**
 * Smoke-check: language switch keeps the same logical page (tool/legal/home).
 * Parses toolSlugs from tools.ts; mirrors pageKeyFromPathname + pagePath.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const toolsSrc = readFileSync(join(root, "src/lib/tools.ts"), "utf8");

const locales = [
  "en",
  "ru",
  "zh",
  "hi",
  "es",
  "ar",
  "fr",
  "bn",
  "pt",
  "id",
];
const defaultLocale = "en";
const LEGAL = new Set(["privacy", "terms", "contacts"]);

const block = toolsSrc.match(
  /export const toolSlugs[^=]*=\s*(\{[\s\S]*?\n\});/,
);
if (!block) {
  console.error("Could not parse toolSlugs from tools.ts");
  process.exit(1);
}
/** @type {Record<string, Record<string, string>>} */
const toolSlugs = new Function(`return (${block[1]})`)();

function canonicalPath(path) {
  if (path === "" || path === "/") return "/";
  return path.endsWith("/") ? path : `${path}/`;
}

function getToolSlug(toolId, locale) {
  return toolSlugs[toolId][locale];
}

function getToolIdBySlug(locale, slug) {
  for (const [id, map] of Object.entries(toolSlugs)) {
    if (map[locale] === slug) return id;
  }
  return null;
}

function pagePath(locale, key) {
  const prefix = locale === defaultLocale ? "" : `/${locale}`;
  if (key.type === "home") return canonicalPath(prefix || "/");
  if (key.type === "legal") return canonicalPath(`${prefix}/${key.page}`);
  return canonicalPath(`${prefix}/${getToolSlug(key.toolId, locale)}`);
}

function parsePageKey(locale, slug) {
  if (!slug) return { type: "home" };
  if (LEGAL.has(slug)) return { type: "legal", page: slug };
  const toolId = getToolIdBySlug(locale, slug);
  if (toolId) return { type: "tool", toolId };
  return null;
}

function pageKeyFromPathname(pathname) {
  const clean = pathname.replace(/\/$/, "") || "/";
  const parts = clean.split("/").filter(Boolean);
  if (parts.length === 0) {
    return { locale: defaultLocale, key: { type: "home" } };
  }
  if (locales.includes(parts[0]) && parts[0] !== defaultLocale) {
    const locale = parts[0];
    if (parts.length === 1) return { locale, key: { type: "home" } };
    const key = parsePageKey(locale, parts[1]);
    if (!key || (key.type === "tool" && parts.length > 2)) return null;
    return { locale, key };
  }
  const key = parsePageKey(defaultLocale, parts[0]);
  if (!key || parts.length > 1) return null;
  return { locale: defaultLocale, key };
}

const cases = [
  ["/", "ru", "/ru/"],
  ["/compress-jpg/", "ru", "/ru/szhat-jpg/"],
  ["/ru/szhat-jpg/", "en", "/compress-jpg/"],
  ["/compress-jpg/", "es", "/es/comprimir-jpg/"],
  ["/privacy/", "ru", "/ru/privacy/"],
  ["/heic-to-jpg/", "pt", "/pt/heic-para-jpg/"],
];

let failed = 0;
for (const [from, next, expect] of cases) {
  const parsed = pageKeyFromPathname(from);
  if (!parsed) {
    console.error("FAIL parse", from);
    failed++;
    continue;
  }
  const dest = pagePath(next, parsed.key);
  if (dest !== expect) {
    console.error("FAIL", from, "->", next, "got", dest, "want", expect);
    failed++;
  } else {
    console.log("OK", from, "->", next, dest);
  }
}

process.exit(failed ? 1 : 0);
