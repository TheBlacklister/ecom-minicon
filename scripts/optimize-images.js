// scripts/optimize-images.js
// Run this script to optimize your large images before deployment
// Install sharp first: npm install --save-dev sharp

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const INPUT_DIR = './public/products';
const OUTPUT_DIR = './public/optimized-products';
const SIZES = [
  { width: 640, suffix: 'sm' },
  { width: 1080, suffix: 'md' },
  { width: 1920, suffix: 'lg' },
  { width: 3840, suffix: 'xl' }, // For retina displays
];

async function optimizeImage(inputPath, outputDir, filename) {
  const nameWithoutExt = path.basename(filename, path.extname(filename));
  
  // Create WebP versions
  for (const size of SIZES) {
    const outputPath = path.join(
      outputDir,
      `${nameWithoutExt}-${size.suffix}.webp`
    );
    
    await sharp(inputPath)
      .resize(size.width, null, {
        withoutEnlargement: true,
        fit: 'inside',
      })
      .webp({ 
        quality: 85,
        effort: 6, // Higher effort = better compression
      })
      .toFile(outputPath);
    
    console.log(`Created: ${outputPath}`);
  }
  
  // Create AVIF versions for modern browsers
  for (const size of SIZES) {
    const outputPath = path.join(
      outputDir,
      `${nameWithoutExt}-${size.suffix}.avif`
    );
    
    await sharp(inputPath)
      .resize(size.width, null, {
        withoutEnlargement: true,
        fit: 'inside',
      })
      .avif({ 
        quality: 80,
        effort: 9, // Max effort for best compression
      })
      .toFile(outputPath);
    
    console.log(`Created: ${outputPath}`);
  }
  
  // Create a low-quality placeholder
  const placeholderPath = path.join(
    outputDir,
    `${nameWithoutExt}-placeholder.jpg`
  );
  
  await sharp(inputPath)
    .resize(20) // Very small for base64 encoding
    .jpeg({ quality: 20 })
    .toFile(placeholderPath);
  
  // Generate base64 placeholder
  const placeholderBuffer = await fs.readFile(placeholderPath);
  const base64 = `data:image/jpeg;base64,${placeholderBuffer.toString('base64')}`;
  
  await fs.writeFile(
    path.join(outputDir, `${nameWithoutExt}-placeholder.txt`),
    base64
  );
  
  console.log(`Created placeholder for: ${filename}`);
}

async function processDirectory(dir, outputBaseDir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(INPUT_DIR, fullPath);
    const outputDir = path.join(outputBaseDir, path.dirname(relativePath));
    
    if (entry.isDirectory()) {
      await fs.mkdir(outputDir, { recursive: true });
      await processDirectory(fullPath, outputBaseDir);
    } else if (entry.isFile() && /\.(png|jpg|jpeg)$/i.test(entry.name)) {
      await fs.mkdir(outputDir, { recursive: true });
      await optimizeImage(fullPath, outputDir, entry.name);
    }
  }
}

async function main() {
  try {
    // Create output directory
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    
    console.log('Starting image optimization...');
    console.log(`Input directory: ${INPUT_DIR}`);
    console.log(`Output directory: ${OUTPUT_DIR}`);
    
    await processDirectory(INPUT_DIR, OUTPUT_DIR);
    
    console.log('\nOptimization complete!');
    console.log('Remember to update your image paths to use the optimized versions.');
  } catch (error) {
    console.error('Error optimizing images:', error);
  }
}

main();