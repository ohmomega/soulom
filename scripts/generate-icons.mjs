import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const publicDirectory = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

const NIGHT = [0x12, 0x12, 0x14];
const CREAM = [0xe4, 0xe4, 0xe7];
const EMBER = [0xd4, 0xa3, 0x73];
const SUPERSAMPLES = 4;

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, checksum]);
}

function encodePng(size, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.set([8, 6, 0, 0, 0], 8);

  const scanlines = Buffer.alloc(size * (size * 4 + 1));
  for (let row = 0; row < size; row += 1) {
    scanlines[row * (size * 4 + 1)] = 0;
    rgba.copy(scanlines, row * (size * 4 + 1) + 1, row * size * 4, (row + 1) * size * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(scanlines, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function insideRoundedSquare(x, y, cornerRadius) {
  if (cornerRadius === 0) return true;
  const nearestX = Math.min(Math.max(x, cornerRadius), 1 - cornerRadius);
  const nearestY = Math.min(Math.max(y, cornerRadius), 1 - cornerRadius);
  return (x - nearestX) ** 2 + (y - nearestY) ** 2 <= cornerRadius ** 2;
}

function sampleMoon(x, y, { cornerRadius, scale }) {
  if (!insideRoundedSquare(x, y, cornerRadius)) return null;
  const toArt = (value) => (value - 0.5) / scale + 0.5;
  const artX = toArt(x);
  const artY = toArt(y);

  if ((artX - 0.699) ** 2 + (artY - 0.32) ** 2 <= 0.0293 ** 2) return EMBER;
  const insideMoon = (artX - 0.5) ** 2 + (artY - 0.5) ** 2 <= 0.26 ** 2;
  const insideShadow = (artX - 0.6) ** 2 + (artY - 0.42) ** 2 <= 0.2207 ** 2;
  if (insideMoon && !insideShadow) return CREAM;
  return NIGHT;
}

function renderIcon(size, options) {
  const pixels = Buffer.alloc(size * size * 4);
  const totalSamples = SUPERSAMPLES * SUPERSAMPLES;

  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      const sum = [0, 0, 0];
      let coverage = 0;
      for (let subRow = 0; subRow < SUPERSAMPLES; subRow += 1) {
        for (let subColumn = 0; subColumn < SUPERSAMPLES; subColumn += 1) {
          const x = (column + (subColumn + 0.5) / SUPERSAMPLES) / size;
          const y = (row + (subRow + 0.5) / SUPERSAMPLES) / size;
          const color = sampleMoon(x, y, options);
          if (!color) continue;
          coverage += 1;
          sum[0] += color[0];
          sum[1] += color[1];
          sum[2] += color[2];
        }
      }
      const offset = (row * size + column) * 4;
      if (coverage > 0) {
        pixels[offset] = Math.round(sum[0] / coverage);
        pixels[offset + 1] = Math.round(sum[1] / coverage);
        pixels[offset + 2] = Math.round(sum[2] / coverage);
      }
      pixels[offset + 3] = Math.round((coverage / totalSamples) * 255);
    }
  }
  return encodePng(size, pixels);
}

function renderPromptPayPlaceholder(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const frameInset = Math.round(size * 0.18);
  const cornerLength = Math.round(size * 0.14);
  const stroke = Math.max(3, Math.round(size * 0.022));

  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      const nearLeft = column >= frameInset && column < frameInset + stroke;
      const nearRight = column <= size - frameInset && column > size - frameInset - stroke;
      const nearTop = row >= frameInset && row < frameInset + stroke;
      const nearBottom = row <= size - frameInset && row > size - frameInset - stroke;
      const withinTopBand = row >= frameInset && row < frameInset + cornerLength;
      const withinBottomBand = row <= size - frameInset && row > size - frameInset - cornerLength;
      const withinLeftBand = column >= frameInset && column < frameInset + cornerLength;
      const withinRightBand = column <= size - frameInset && column > size - frameInset - cornerLength;

      const isCornerMark =
        ((nearLeft || nearRight) && (withinTopBand || withinBottomBand)) ||
        ((nearTop || nearBottom) && (withinLeftBand || withinRightBand));

      const color = isCornerMark ? [0x8d, 0x8d, 0x94] : CREAM;
      const offset = (row * size + column) * 4;
      pixels[offset] = color[0];
      pixels[offset + 1] = color[1];
      pixels[offset + 2] = color[2];
      pixels[offset + 3] = 255;
    }
  }
  return encodePng(size, pixels);
}

const outputs = [
  ["icons/icon-192.png", renderIcon(192, { cornerRadius: 0.22, scale: 1 })],
  ["icons/icon-512.png", renderIcon(512, { cornerRadius: 0.22, scale: 1 })],
  ["icons/icon-maskable-512.png", renderIcon(512, { cornerRadius: 0, scale: 0.78 })],
  ["icons/apple-touch-icon.png", renderIcon(180, { cornerRadius: 0, scale: 0.9 })],
];

if (process.argv.includes("--with-qr-placeholder")) {
  outputs.push(["promptpay-qr.png", renderPromptPayPlaceholder(480)]);
}

for (const [relativePath, contents] of outputs) {
  const destination = join(publicDirectory, relativePath);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, contents);
  console.log(`wrote public/${relativePath} (${contents.length} bytes)`);
}
