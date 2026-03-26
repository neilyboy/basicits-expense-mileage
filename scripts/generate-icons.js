// Generate simple PWA icons using pure Node.js (no canvas dependency)
// Creates minimal PNG files with the "PL" branding
const fs = require('fs');
const path = require('path');

// Minimal 192x192 and 512x512 PNG icons
// Since we can't easily generate complex PNGs without canvas,
// we'll create an SVG-based icon and reference that instead

const iconSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#0f172a"/>
  <rect x="${size * 0.05}" y="${size * 0.05}" width="${size * 0.9}" height="${size * 0.9}" rx="${size * 0.15}" fill="#1e3a5f" opacity="0.3"/>
  <text x="${size / 2}" y="${size * 0.58}" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="${size * 0.35}" fill="white" text-anchor="middle" dominant-baseline="middle">PL</text>
  <text x="${size / 2}" y="${size * 0.78}" font-family="Arial, Helvetica, sans-serif" font-size="${size * 0.08}" fill="rgba(255,255,255,0.5)" text-anchor="middle">LEDGER</text>
</svg>`;

const publicDir = path.join(__dirname, '..', 'client', 'public');

// Write SVG icons (universally supported for PWA)
fs.writeFileSync(path.join(publicDir, 'icon-192.svg'), iconSvg(192));
fs.writeFileSync(path.join(publicDir, 'icon-512.svg'), iconSvg(512));

console.log('SVG icons generated successfully');
