// components/ProgressiveImage.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Box, Skeleton } from '@mui/material';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
  fill?: boolean;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
  className?: string;
}

// LRU Cache for loaded images
class ImageCache {
  private cache: Map<string, boolean> = new Map();
  private maxSize: number = 50;

  has(key: string): boolean {
    return this.cache.has(key);
  }

  set(key: string): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, true);
  }
}

const imageCache = new ImageCache();

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  sizes = "100vw",
  priority = false,
  quality = 75,
  onLoad,
  onError,
  fill = true,
  width,
  height,
  style,
  className,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  // Check if image is already cached
  useEffect(() => {
    if (imageCache.has(src)) {
      setIsLoaded(true);
      setShowImage(true);
    }
  }, [src]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isLoaded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShowImage(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.01,
      }
    );

    const currentRef = imageRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [priority, isLoaded]);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
    imageCache.set(src);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
    onError?.();
  };

  // Generate srcSet for responsive images
  const generateSrcSet = () => {
    const basePath = src.substring(0, src.lastIndexOf('.'));
    const extension = src.substring(src.lastIndexOf('.'));
    
    return {
      srcSet: `
        ${basePath}-sm${extension} 640w,
        ${basePath}-md${extension} 1080w,
        ${basePath}-lg${extension} 1920w,
        ${basePath}-xl${extension} 3840w
      `.trim(),
    };
  };

  if (hasError) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.200',
          color: 'grey.500',
          ...style,
        }}
        className={className}
      >
        Failed to load image
      </Box>
    );
  }

  return (
    <Box
      ref={imageRef}
      sx={{
        position: 'relative',
        width: fill ? '100%' : width,
        height: fill ? '100%' : height,
        overflow: 'hidden',
      }}
      className={className}
    >
      {/* Loading skeleton */}
      {!isLoaded && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          animation="wave"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1,
          }}
        />
      )}

      {/* Progressive image */}
      {(showImage || priority) && (
        <Image
          src={src}
          alt={alt}
          fill={fill}
          width={!fill ? width : undefined}
          height={!fill ? height : undefined}
          sizes={sizes}
          quality={quality}
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            ...style,
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
          }}
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
          {...(src.includes('-sm.') || src.includes('-md.') || src.includes('-lg.') || src.includes('-xl.') 
            ? {} 
            : generateSrcSet()
          )}
        />
      )}
    </Box>
  );
};

// Hook for preloading images
export const useImagePreloader = (images: string[]) => {
  useEffect(() => {
    images.forEach((src) => {
      if (!imageCache.has(src)) {
        const img = new window.Image();
        img.src = src;
        img.onload = () => {
          imageCache.set(src);
        };
      }
    });
  }, [images]);
};