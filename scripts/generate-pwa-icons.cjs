const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generatePwaIcons() {
  const publicDir = path.resolve(__dirname, '../public');
  const iconsDir = path.join(publicDir, 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  const svgPath = path.join(publicDir, 'favicon.svg');
  const svgContent = fs.readFileSync(svgPath, 'utf8');

  // 1. Regular icon 192x192
  await sharp(Buffer.from(svgContent))
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, 'icon-192.png'));
  console.log('✓ Generated public/icons/icon-192.png');

  // 2. Regular icon 512x512
  await sharp(Buffer.from(svgContent))
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'icon-512.png'));
  console.log('✓ Generated public/icons/icon-512.png');

  // 3. Apple Touch Icon 180x180
  await sharp(Buffer.from(svgContent))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  await sharp(Buffer.from(svgContent))
    .resize(180, 180)
    .png()
    .toFile(path.join(iconsDir, 'apple-touch-icon.png'));
  console.log('✓ Generated public/apple-touch-icon.png');

  // 4. Maskable 512x512: Full bleed solid #222222 background and artwork within 80% safe zone
  const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#222222"/>
  <circle cx="32" cy="32" r="20" fill="none" stroke="#886E42" stroke-width="2.2"/>
  <text x="32" y="41" font-family="'Playfair Display', Georgia, serif" font-size="26" font-weight="700" fill="#886E42" text-anchor="middle">O</text>
</svg>`;

  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'icon-512-maskable.png'));
  console.log('✓ Generated public/icons/icon-512-maskable.png');
}

generatePwaIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
