#!/usr/bin/env node
/**
 * Пинг IndexNow (Яндекс / Bing) по URL из sitemap.
 *
 *   node scripts/indexnow.mjs              # live sitemap с продакшена
 *   node scripts/indexnow.mjs --dry-run    # проверить out/sitemap.xml без отправки
 *   node scripts/indexnow.mjs --file=out/sitemap.xml --dry-run
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const HOST = process.env.INDEXNOW_HOST || "pixlocal.app";
const KEY = "7f3a9c2e4b18d056a91c4e8f02b7d3c5";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINTS = [
  "https://yandex.com/indexnow",
  "https://api.indexnow.org/indexnow",
];

const dryRun = process.argv.includes("--dry-run");
const fileArg = process.argv.find((a) => a.startsWith("--file="));
const localFile = fileArg
  ? fileArg.slice("--file=".length)
  : dryRun
    ? join(process.cwd(), "out/sitemap.xml")
    : null;

function parseSitemap(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

async function loadSitemapXml() {
  if (localFile) {
    if (!existsSync(localFile)) {
      throw new Error(`Нет файла sitemap: ${localFile} (сначала npm run build)`);
    }
    return readFileSync(localFile, "utf8");
  }
  const sitemapRes = await fetch(`https://${HOST}/sitemap.xml`);
  if (!sitemapRes.ok) {
    throw new Error(`sitemap.xml HTTP ${sitemapRes.status}`);
  }
  return sitemapRes.text();
}

async function main() {
  const xml = await loadSitemapXml();
  const urlList = parseSitemap(xml);
  if (!urlList.length) {
    throw new Error("sitemap.xml не содержит <loc>");
  }

  const locales = new Set(
    urlList.map((u) => {
      try {
        const { pathname } = new URL(u);
        const m = pathname.match(/^\/([a-z]{2})\//);
        return m ? m[1] : "en";
      } catch {
        return "en";
      }
    }),
  );
  const hreflang = xml.includes('hreflang="x-default"');

  console.log(`Источник: ${localFile ?? `https://${HOST}/sitemap.xml`}`);
  console.log(`URL: ${urlList.length}`);
  console.log(`Локали в sitemap: ${[...locales].sort().join(", ")}`);
  console.log(`x-default hreflang: ${hreflang ? "yes" : "no"}`);

  if (dryRun) {
    if (urlList.length < 100) {
      throw new Error(
        `Ожидалось ≥100 URL (10 локалей), получено ${urlList.length}`,
      );
    }
    if (!hreflang) {
      throw new Error("В sitemap нет hreflang=x-default");
    }
    if (locales.size < 10) {
      throw new Error(`Ожидалось 10 локалей, получено ${locales.size}`);
    }
    console.log("dry-run: OK, отправка пропущена");
    return;
  }

  const body = JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList,
  });

  for (const endpoint of ENDPOINTS) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body,
    });
    const text = await res.text();
    console.log(`${endpoint} → ${res.status} ${text.slice(0, 200)}`);
  }
  console.log(`Отправлено URL: ${urlList.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
