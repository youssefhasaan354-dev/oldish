const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');

const images = [
  'oldish_courtyard_hero.webp',
  'oldish_courtyard_evening.webp',
  'egyptian_breakfast_spread.webp',
  'oldish_vintage_interior.webp',
  'oldish_egyptian_tagine.webp',
  'oldish_coffee_tea.webp',
  'oldish_fresh_juices.webp'
];

async function generate() {
  console.log('Generating responsive WebP variants...');

  for (const imgName of images) {
    const inputPath = path.join(IMAGES_DIR, imgName);
    if (!fs.existsSync(inputPath)) continue;

    const baseName = imgName.replace('.webp', '');
    const meta = await sharp(inputPath).metadata();
    console.log(`\nProcessing ${imgName} (original ${meta.width}x${meta.height}, ${(fs.statSync(inputPath).size/1024).toFixed(1)} KB)`);

    // 640px variant (mobile)
    const out640 = path.join(IMAGES_DIR, `${baseName}-640.webp`);
    await sharp(inputPath)
      .resize({ width: 640, withoutEnlargement: true })
      .webp({ quality: 75, effort: 6 })
      .toFile(out640);
    console.log(`  -> 640w: ${(fs.statSync(out640).size / 1024).toFixed(1)} KB`);

    // 1024px variant (tablet / small laptop)
    const out1024 = path.join(IMAGES_DIR, `${baseName}-1024.webp`);
    await sharp(inputPath)
      .resize({ width: 1024, withoutEnlargement: true })
      .webp({ quality: 78, effort: 6 })
      .toFile(out1024);
    console.log(`  -> 1024w: ${(fs.statSync(out1024).size / 1024).toFixed(1)} KB`);
  }

  console.log('\nAll responsive variants generated successfully.');
}

generate().catch(console.error);
