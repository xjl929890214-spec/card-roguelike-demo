/**
 * Trim dark outer padding from card PNGs (logo/hand art).
 */
import { Jimp } from 'jimp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = process.argv[2] || path.join(__dirname, '../assets/cards/ace_spades.png');
const OUT_W = 360;
const OUT_H = 500;

const img = await Jimp.read(file);
const { width, height } = img.bitmap;
const TH = 48;

let minX = width, minY = height, maxX = 0, maxY = 0;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) << 2;
    const r = img.bitmap.data[idx];
    const g = img.bitmap.data[idx + 1];
    const b = img.bitmap.data[idx + 2];
    if (r > TH || g > TH || b > TH) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
}

const pad = 2;
minX = Math.max(0, minX - pad);
minY = Math.max(0, minY - pad);
maxX = Math.min(width - 1, maxX + pad);
maxY = Math.min(height - 1, maxY + pad);

const cw = maxX - minX + 1;
const ch = maxY - minY + 1;
console.log('crop', minX, minY, cw, ch, 'from', width, height);

const cropped = img.clone().crop({ x: minX, y: minY, w: cw, h: ch });
cropped.cover({ w: OUT_W, h: OUT_H });
await cropped.write(file);
console.log('saved', file, OUT_W, 'x', OUT_H);
