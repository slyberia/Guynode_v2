import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT = path.join(__dirname, '..', 'public', 'og-image.png');

const W = 1200;
const H = 630;

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#0B0D0F"/>

  <!-- Wordmark -->
  <text
    x="${W / 2}" y="258"
    text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif"
    font-size="110"
    font-weight="700"
    letter-spacing="24"
    fill="#FFFFFF"
  >GUYNODE</text>

  <!-- Horizontal rule -->
  <line x1="440" y1="300" x2="760" y2="300" stroke="#2A3530" stroke-width="1"/>

  <!-- Subtitle -->
  <text
    x="${W / 2}" y="352"
    text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif"
    font-size="24"
    font-weight="400"
    letter-spacing="4"
    fill="#7A8A82"
  >Spatial Data Archive — Guyana</text>

  <!-- Bottom-left attribution -->
  <text
    x="60" y="${H - 44}"
    text-anchor="start"
    font-family="Arial, Helvetica, sans-serif"
    font-size="15"
    font-weight="400"
    letter-spacing="2"
    fill="#7A8A82"
  >HPS GEOSPATIAL</text>
</svg>
`.trim();

const buffer = Buffer.from(svg, 'utf8');

await sharp(buffer)
  .resize(W, H)
  .png({ compressionLevel: 9, effort: 10 })
  .toFile(OUTPUT);

console.log(`✅ og-image.png written to ${OUTPUT}`);
