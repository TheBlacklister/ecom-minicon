/**
 * Image optimization utility for handling WebP conversion across the codebase
 * Converts PNG/JPG paths to optimized WebP versions
 */

// Convert image path to optimized WebP version
export const getOptimizedImageSrc = (originalPath: string): string => {
  if (!originalPath) return '';

  // Check if it's a product image path
  if (originalPath.includes('/products/')) {
    // Special case: keep JPG files as is (they weren't converted to WebP)
    if (originalPath.toLowerCase().endsWith('.jpg') || originalPath.toLowerCase().endsWith('.jpeg')) {
      return originalPath;
    }
    // Convert PNG to WebP (images are replaced in same location)
    return originalPath.replace(/\.(png)$/i, '.webp');
  }

  // Return original path for non-product images (like icons, logos)
  return originalPath;
};

// Format image paths by replacing backslashes with forward slashes
export const formatImagePath = (path: string): string => {
  if (!path) return '';

  let formatted = path.replace(/\\/g, '/');
  formatted = formatted.replace(/^public\//i, '/');
  formatted = formatted.replace(/\/+/g, '/');

  if (!formatted.startsWith('/')) {
    formatted = '/' + formatted;
  }

  return formatted;
};

// Combined function to format and optimize image paths
export const getFormattedOptimizedImageSrc = (originalPath: string): string => {
  const formatted = formatImagePath(originalPath);
  return getOptimizedImageSrc(formatted);
};

// Check if an image is a product image
export const isProductImage = (imagePath: string): boolean => {
  return imagePath.includes('/products/');
};

// Get fallback image for error states
export const getFallbackImage = (imagePath: string): string => {
  if (isProductImage(imagePath)) {
    // Fallback to original format if WebP fails
    return imagePath.replace(/\.webp$/i, '.png');
  }
  return imagePath;
};