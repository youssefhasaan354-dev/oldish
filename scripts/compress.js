import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const IMAGES_DIR = path.resolve('public/images');

async function processImages() {
  const files = fs.readdirSync(IMAGES_DIR).filter(f => f.endsWith('.jpg'));
  console.log(`Found ${files.length} images to compress in ${IMAGES_DIR}`);

  for (const file of files) {
    const inputPath = path.join(IMAGES_DIR, file);
    const baseName = path.basename(file, '.jpg');
    const webpPath = path.join(IMAGES_DIR, `${baseName}.webp`);
    const tempJpgPath = path.join(IMAGES_DIR, `${baseName}.temp.jpg`);

    const originalStats = fs.statSync(inputPath);
    const originalKB = (originalStats.size / 1024).toFixed(1);

    // 1. Create optimized WebP (max width 1600px, quality 80)
    await sharp(inputPath)
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 80, effort: 6 })
      .toFile(webpPath);
    const webpStats = fs.statSync(webpPath);
    const webpKB = (webpStats.size / 1024).toFixed(1);

    // 2. Compress the original JPG in-place (max width 1600px, quality 75)
    await sharp(inputPath)
      .resize({ width: 1600, withoutEnlargement: true })
      .jpeg({ quality: 75, mozjpeg: true })
      .toFile(tempJpgPath);
    
    fs.unlinkSync(inputPath);
    fs.renameSync(tempJpgPath, inputPath);

    const newJpgStats = fs.statSync(inputPath);
    const newJpgKB = (newJpgStats.size / 1024).toFixed(1);

    console.log(`- ${file}: Original: ${originalKB} KB -> JPG: ${newJpgKB} KB | WebP: ${webpKB} KB`);
  }
  console.log('Image compression completed successfully!');
}

processImages().catch(err => {
  console.error('Error during image processing:', err);
  process.exit(1);
});
