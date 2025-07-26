// components/SmartImage.tsx
'use client';

import Image from 'next/image';
import React, { useState, useEffect } from 'react';

interface SmartImageProps {
  src: string; // Original PNG path
  alt: string;
  fill?: boolean;
  sizes?: string;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
  loading?: 'eager' | 'lazy';
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
}

// Helper to get screen size category
const getScreenCategory = (): 'sm' | 'md' | 'lg' | 'xl' => {
  if (typeof window === 'undefined') return 'md';
  
  const width = window.innerWidth;
  if (width < 640) return 'sm';
  if (width < 768) return 'md';
  if (width < 1024) return 'lg';
  return 'xl';
};

// Helper to get optimized image path
const getOptimizedImagePath = (originalPath: string, screenCategory: string): string => {
  // Remove file extension and add size suffix
  const pathWithoutExt = originalPath.replace(/\.[^/.]+$/, '');
  
  // Try to use pre-optimized images if they exist
  const optimizedPath = pathWithoutExt.replace('/images/', '/images/optimized/');
  
  return `${optimizedPath}_${screenCategory}`;
};

// Check if optimized image exists
const checkImageExists = async (imagePath: string): Promise<boolean> => {
  try {
    const response = await fetch(imagePath, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt,
  fill = false,
  sizes,
  className,
  style,
  priority = false,
  loading = 'lazy',
  quality,
  onLoad,
  onError
}) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [screenCategory, setScreenCategory] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const [useOptimized, setUseOptimized] = useState(false);

  // Update screen category on resize
  useEffect(() => {
    const updateScreenCategory = () => {
      setScreenCategory(getScreenCategory());
    };
    
    updateScreenCategory();
    window.addEventListener('resize', updateScreenCategory);
    return () => window.removeEventListener('resize', updateScreenCategory);
  }, []);

  // Try to use optimized image when screen category changes
  useEffect(() => {
    const tryOptimizedImage = async () => {
      if (src.includes('/images/optimized/')) {
        // Already using optimized path
        setUseOptimized(true);
        return;
      }

      const optimizedBasePath = getOptimizedImagePath(src, screenCategory);
      
      // Try AVIF first, then WebP, then fallback to original
      const formats = ['avif', 'webp'];
      
      for (const format of formats) {
        const optimizedPath = `${optimizedBasePath}.${format}`;
        const exists = await checkImageExists(optimizedPath);
        
        if (exists) {
          setImageSrc(optimizedPath);
          setUseOptimized(true);
          return;
        }
      }
      
      // Fallback to original if no optimized version exists
      setImageSrc(src);
      setUseOptimized(false);
    };

    tryOptimizedImage();
  }, [src, screenCategory]);

  // Calculate quality based on whether we're using optimized images
  const imageQuality = quality || (useOptimized ? 90 : getQualityForPng(screenCategory));

  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill={fill}
      sizes={sizes || getDefaultSizes(screenCategory)}
      className={className}
      style={style}
      priority={priority}
      loading={loading}
      quality={imageQuality}
      onLoad={onLoad}
     
      placeholder="blur"
      blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    />
  );
};

// Get quality settings for PNG sources when not using pre-optimized images
const getQualityForPng = (screenCategory: string): number => {
  switch (screenCategory) {
    case 'sm': return 20;
    case 'md': return 25;
    case 'lg': return 30;
    case 'xl': return 35;
    default: return 25;
  }
};

// Get default sizes string
const getDefaultSizes = (screenCategory: string): string => {
  switch (screenCategory) {
    case 'sm': return '(max-width: 640px) 280px';
    case 'md': return '(max-width: 768px) 250px';
    case 'lg': return '(max-width: 1024px) 220px';
    case 'xl': return '200px';
    default: return '250px';
  }
};