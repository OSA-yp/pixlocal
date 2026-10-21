#!/usr/bin/env node
/** Scan message JSON for key parity and suspicious EN leftovers in non-EN locales. */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../src/messages");
const locales = readdirSync(root).filter((d) => !d.includes("."));
const namespaces = ["common", "home", "legal", "tools"];

function leaves(obj, prefix = "", out = []) {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    out.push([prefix, obj]);
    return out;
  }
  for (const [k, v] of Object.entries(obj)) {
    leaves(v, prefix ? `${prefix}.${k}` : k, out);
  }
  return out;
}

const en = {};
for (const ns of namespaces) {
  en[ns] = Object.fromEntries(
    leaves(JSON.parse(readFileSync(join(root, "en", `${ns}.json`), "utf8"))),
  );
}

let missing = 0;
let identical = 0;
const identicalSamples = [];
const emptyHooks = [];

for (const loc of locales) {
  for (const ns of namespaces) {
    const data = JSON.parse(readFileSync(join(root, loc, `${ns}.json`), "utf8"));
    const map = Object.fromEntries(leaves(data));
    for (const k of Object.keys(en[ns])) {
      if (!(k in map)) {
        console.log(`MISSING ${loc}/${ns} ${k}`);
        missing++;
      } else if (
        loc !== "en" &&
        typeof map[k] === "string" &&
        map[k] === en[ns][k] &&
        map[k].length > 40 &&
        !/PixLocal|JPG|PNG|WebP|HEIC|EXIF|GPS|FAQ|Canvas|DevTools/.test(map[k])
      ) {
        identical++;
        if (identicalSamples.length < 25) {
          identicalSamples.push(`${loc}/${ns}.${k}`);
        }
      }
    }
    if (loc !== "en") {
      for (const k of Object.keys(map)) {
        if (!(k in en[ns])) console.log(`EXTRA ${loc}/${ns} ${k}`);
      }
    }
  }
  const common = JSON.parse(readFileSync(join(root, loc, "common.json"), "utf8"));
  if (common?.trust?.hook === "") emptyHooks.push(loc);
}

console.log(`\nLocales: ${locales.join(", ")}`);
console.log(`Missing keys: ${missing}`);
console.log(`Long identical-to-EN strings: ${identical}`);
if (identicalSamples.length) {
  console.log("Samples:");
  for (const s of identicalSamples) console.log(`  ${s}`);
}
console.log(`Empty trust.hook: ${emptyHooks.join(", ") || "(none)"}`);
if (missing) process.exitCode = 1;
else console.log("Key parity: OK");
