const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');

const images = [
  'oldish_courtyard_hero.webp',
  'oldish_courtyard_evening.webp',
  'egyptian_breakfast_spread.webp',
  'oldish_vintage_interior.webp'
];

async function run() {
  for (const img of images) {
    const input = path.join(IMAGES_DIR, img);
    const base = img.replace('.webp', '');
    
    // 800w
    const out800 = path.join(IMAGES_DIR, `${base}-800.webp`);
    await sharp(input)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 72, effort: 6 })
      .toFile(out800);
    console.log(`Generated ${base}-800.webp: ${(fs.statSync(out800).size/1024).toFixed(1)} KB`);

    // Optimize 1024w to quality 70
    const out1024 = path.join(IMAGES_DIR, `${base}-1024.webp`);
    await sharp(input)
      .resize({ width: 1024, withoutEnlargement: true })
      .webp({ quality: 70, effort: 6 })
      .toFile(out1024);
    console.log(`Optimized ${base}-1024.webp: ${(fs.statSync(out1024).size/1024).toFixed(1)} KB`);
  }
}

run().catch(console.error);
