const fs = require('fs');
const path = require('path');

const dir = 'public/images/dataset-thumbnails';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

// Helper to generate a standardized SVG icon given a color and text abbreviation
function createSvg(bgColor, textColor, text) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="${bgColor}"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="20" font-weight="bold" fill="${textColor}">${text}</text>
  <!-- Decorative accent line -->
  <rect x="0" y="90" width="100" height="10" fill="${textColor}" opacity="0.5"/>
</svg>`;
}

// Format mapping to colors and text
const formats = {
  'shapefile.svg': createSvg('#e3f2fd', '#1565c0', 'SHP'),
  'geojson.svg': createSvg('#e3f2fd', '#1565c0', 'GEOJSON'),
  'geotiff.svg': createSvg('#f3e5f5', '#6a1b9a', 'TIFF'),
  'spreadsheet.svg': createSvg('#e8f5e9', '#2e7d32', 'XLSX/CSV'),
  'csv.svg': createSvg('#e8f5e9', '#2e7d32', 'CSV'),
  'pdf.svg': createSvg('#ffebee', '#c62828', 'PDF'),
  'image.svg': createSvg('#fff3e0', '#ef6c00', 'IMG'),
  'api.svg': createSvg('#eceff1', '#455a64', 'API'),
  'web-map.svg': createSvg('#e0f7fa', '#00838f', 'MAP'),
  'mixed.svg': createSvg('#fafafa', '#424242', 'MIXED'),
};

for (const [filename, content] of Object.entries(formats)) {
  fs.writeFileSync(path.join(dir, filename), content);
}

console.log('Generated thumbnail SVGs in ' + dir);
