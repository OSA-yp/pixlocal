#!/usr/bin/env node
/**
 * Static export emits default locale under /en/. Move it to site root
 * so English URLs have no prefix (localePrefix: as-needed).
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "out");
const EN = join(OUT, "en");

if (!existsSync(EN)) {
  console.log("flatten-default-locale: no out/en — skip");
  process.exit(0);
}

function mergeMove(srcDir, destDir) {
  mkdirSync(destDir, { recursive: true });
  for (const name of readdirSync(srcDir)) {
    const from = join(srcDir, name);
    const to = join(destDir, name);
    if (statSync(from).isDirectory()) {
      mergeMove(from, to);
    } else {
      cpSync(from, to);
    }
  }
}

mergeMove(EN, OUT);
rmSync(EN, { recursive: true, force: true });
console.log("flatten-default-locale: moved out/en → out/");
