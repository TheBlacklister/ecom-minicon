const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const INPUT_DIR = './public/products';
const BACKUP_DIR = './public/products-backup';

async function createBackup() {
  console.log('Creating backup of original images...');
  try {
    await fs.access(BACKUP_DIR);
    console.log('Backup already exists, skipping...');
  } catch {
    await fs.cp(INPUT_DIR, BACKUP_DIR, { recursive: true });
    console.log('Backup created successfully!');
  }
}

async function optimizeAndReplace(filePath, relativePath) {
  const originalSize = (await fs.stat(filePath)).size;

  if (originalSize < 500 * 1024) { // Skip files smaller than 500KB
    console.log(`Skipping ${relativePath} (already small: ${Math.round(originalSize/1024)}KB)`);
    return;
  }

  console.log(`Optimizing ${relativePath} (${Math.round(originalSize/1024/1024)}MB)...`);

  const tempPath = filePath + '.temp';

  try {
    // Convert to WebP with good compression
    await sharp(filePath)
      .webp({
        quality: 80,
        effort: 6
      })
      .resize({
        width: 1200, // Max width for product images
        height: 1200,
        fit: 'inside',
        withoutEnlargement: true
      })
      .toFile(tempPath);

    // Replace original with optimized version
    await fs.unlink(filePath);
    await fs.rename(tempPath, filePath.replace(/\.(png|jpg|jpeg)$/i, '.webp'));

    const newSize = (await fs.stat(filePath.replace(/\.(png|jpg|jpeg)$/i, '.webp'))).size;
    const reduction = Math.round((1 - newSize/originalSize) * 100);

    console.log(`  ✓ ${Math.round(originalSize/1024/1024)}MB -> ${Math.round(newSize/1024)}KB (${reduction}% smaller)`);

  } catch (error) {
    console.error(`Error optimizing ${relativePath}:`, error.message);
    // Clean up temp file if it exists
    try {
      await fs.unlink(tempPath);
    } catch {}
  }
}

async function processDirectory(dir, relativeDir = '') {
  const items = await fs.readdir(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    const relativePath = path.join(relativeDir, item.name);

    if (item.isDirectory()) {
      await processDirectory(fullPath, relativePath);
    } else if (item.isFile() && /\.(png|jpg|jpeg)$/i.test(item.name)) {
      await optimizeAndReplace(fullPath, relativePath);
    }
  }
}

async function updateImageReferences() {
  console.log('\nUpdating image references to .webp...');

  // You might need to update database or other references here
  // For now, we'll just log what needs to be updated
  console.log('Note: Update your database image paths to use .webp extensions');
}

async function main() {
  try {
    console.log('=== IMAGE REPLACEMENT OPTIMIZATION ===');
    console.log('This will replace your original images with optimized versions');
    console.log('Original images will be backed up to /public/products-backup\n');

    // Create backup first
    await createBackup();

    // Process all images
    console.log('Starting optimization...');
    await processDirectory(INPUT_DIR);

    await updateImageReferences();

    console.log('\n✅ Optimization complete!');
    console.log('Your images are now optimized and ready for instant loading');
    console.log('Original images backed up to: ./public/products-backup');

  } catch (error) {
    console.error('❌ Error during optimization:', error);
  }
}

main();