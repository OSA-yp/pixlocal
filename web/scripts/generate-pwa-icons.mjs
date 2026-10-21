#!/usr/bin/env node
/**
 * PWA icons: brand tile + letter "P" (Android was installing a blank square
 * because the previous generator only filled solid color).
 * Also writes maskable variants with extra safe-zone padding.
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public", "icons");

const BG = [0x0f, 0x6b, 0x5c];
const FG = [0xf3, 0xf6, 0xf2];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
    }
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function pngRgb(size, paint) {
  const raw = Buffer.alloc((1 + size * 3) * size);
  for (let y = 0; y < size; y++) {
    const row = y * (1 + size * 3);
    raw[row] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b] = paint(x, y);
      const i = row + 1 + x * 3;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Bold "P" in unit square [0,1]² (y down). */
function inLetterP(u, v) {
  // Stem
  if (u >= 0.18 && u <= 0.38 && v >= 0.14 && v <= 0.86) return true;
  // Bowl outer
  const inBowlBox = u >= 0.18 && u <= 0.78 && v >= 0.14 && v <= 0.56;
  if (!inBowlBox) return false;
  // Inner cutout of bowl
  const inHole = u >= 0.38 && u <= 0.62 && v >= 0.28 && v <= 0.44;
  if (inHole) return false;
  // Round the outer right of the bowl roughly
  if (u > 0.62) {
    const cx = 0.62;
    const cy = 0.35;
    const rx = 0.16;
    const ry = 0.21;
    const nx = (u - cx) / rx;
    const ny = (v - cy) / ry;
    return nx * nx + ny * ny <= 1;
  }
  return true;
}

function makeIcon(size, { maskable }) {
  // Maskable safe zone ≈ center 80%; any icons can use a slightly larger glyph.
  const pad = maskable ? 0.18 : 0.1;
  return pngRgb(size, (x, y) => {
    const u = (x + 0.5) / size;
    const v = (y + 0.5) / size;
    const lu = (u - pad) / (1 - 2 * pad);
    const lv = (v - pad) / (1 - 2 * pad);
    if (lu >= 0 && lu <= 1 && lv >= 0 && lv <= 1 && inLetterP(lu, lv)) {
      return FG;
    }
    return BG;
  });
}

mkdirSync(OUT_DIR, { recursive: true });
for (const size of [192, 512]) {
  const anyPath = join(OUT_DIR, `icon-${size}.png`);
  writeFileSync(anyPath, makeIcon(size, { maskable: false }));
  console.log("wrote", anyPath);

  const maskPath = join(OUT_DIR, `icon-${size}-maskable.png`);
  writeFileSync(maskPath, makeIcon(size, { maskable: true }));
  console.log("wrote", maskPath);
}
