#!/usr/bin/env node
/** Пинг IndexNow (Яндекс / Bing) по URL из sitemap. */

const HOST = "pixlocal.ru";
const KEY = "7f3a9c2e4b18d056a91c4e8f02b7d3c5";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINTS = [
  "https://yandex.com/indexnow",
  "https://api.indexnow.org/indexnow",
];

function parseSitemap(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

async function main() {
  const sitemapRes = await fetch(`https://${HOST}/sitemap.xml`);
  if (!sitemapRes.ok) {
    throw new Error(`sitemap.xml HTTP ${sitemapRes.status}`);
  }
  const urlList = parseSitemap(await sitemapRes.text());
  if (!urlList.length) {
    throw new Error("sitemap.xml не содержит <loc>");
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
