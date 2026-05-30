import { Jimp } from 'jimp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CARDS = path.join(ROOT, 'assets/cards');
const CURSOR = path.join(process.env.HOME, '.cursor/projects/Users-xiejiling-Desktop/assets');
const W = 400;
const H = 600;

const MAP = {
  joker: /^j_.*\.png$/i,
  planet: /^pl_.*\.png$/i,
  tarot: /^t_.*\.png$/i,
  voucher: /^v_.*\.png$/i,
};

for (const type of Object.keys(MAP)) {
  fs.mkdirSync(path.join(CARDS, type), { recursive: true });
}

let n = 0;
for (const f of fs.readdirSync(CURSOR)) {
  if (!f.endsWith('.png')) continue;
  let type = null;
  for (const [t, re] of Object.entries(MAP)) {
    if (re.test(f)) { type = t; break; }
  }
  if (!type) continue;
  const src = path.join(CURSOR, f);
  const dest = path.join(CARDS, type, f);
  const img = await Jimp.read(src);
  img.cover({ w: W, h: H });
  await img.write(dest);
  console.log('✓', type, f);
  n++;
}
const JOKER_MIRROR = path.join(ROOT, 'assets/jokers');
fs.mkdirSync(JOKER_MIRROR, { recursive: true });
let mirrored = 0;
for (const f of fs.readdirSync(path.join(CARDS, 'joker'))) {
  if (!/^j_[a-z0-9_]+\.png$/i.test(f)) continue;
  fs.copyFileSync(path.join(CARDS, 'joker', f), path.join(JOKER_MIRROR, f));
  mirrored++;
}
console.log(`Mirrored ${mirrored} jokers → assets/jokers/ (title / legacy)`);
console.log(`\nInstalled ${n} cards → assets/cards/`);
