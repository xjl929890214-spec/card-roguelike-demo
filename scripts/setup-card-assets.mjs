import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CARDS = path.join(ROOT, 'assets/cards');
const CURSOR = path.join(process.env.HOME, '.cursor/projects/Users-xiejiling-Desktop/assets');

for (const t of ['joker', 'planet', 'tarot', 'voucher']) {
  fs.mkdirSync(path.join(CARDS, t), { recursive: true });
}

if (fs.existsSync(CURSOR)) {
  for (const f of fs.readdirSync(CURSOR)) {
    if (/^j_.*\.png$/i.test(f)) {
      fs.copyFileSync(path.join(CURSOR, f), path.join(CARDS, 'joker', f));
      console.log('joker', f);
    }
  }
}
console.log('dirs ready at', CARDS);
