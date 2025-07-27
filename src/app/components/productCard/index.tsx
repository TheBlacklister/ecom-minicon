'use client';

import Image from 'next/image';
import { Box, Typography, IconButton,Skeleton } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useRouter } from 'next/navigation';
import React, { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '../AuthProvider';
import type { Product } from '@/types';

// Custom hook for progressive image loading
const useProgressiveImage = (src: string, placeholder?: string) => {
  const [source, setSource] = useState(placeholder || '');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const img = new window.Image();
    img.src = src;
    img.onload = () => {
      setSource(src);
      setLoading(false);
    };
    img.onerror = () => {
      setLoading(false);
    };
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);
  
  return { source, loading };
};

export const ProductCard: React.FC<{
  product: Product;
  initialIsWished?: boolean;
}> = ({ product, initialIsWished }) => {
  const router = useRouter();
  const { user } = useAuth();
  const [isWished, setIsWished] = useState(initialIsWished ?? false);
  const [titleFontSize, setTitleFontSize] = useState('1rem');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const titleRef = useRef<HTMLSpanElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Touch handling refs
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Cache for loaded images
  const loadedImagesCache = useRef<Set<string>>(new Set());

  // Format image paths
  const formatImagePath = useCallback((path: string): string => {
    let formatted = path.replace(/\\/g, '/');
    formatted = formatted.replace(/^public\//i, '/');
    formatted = formatted.replace(/\/+/g, '/');
    if (!formatted.startsWith('/')) {
      formatted = '/' + formatted;
    }
    return formatted;
  }, []);

  // Get formatted images array with memoization
  const formattedImages = useMemo(
    () => product.images?.map(formatImagePath) || [],
    [product.images, formatImagePath]
  );

  // Current image with progressive loading
  const currentImage = formattedImages[currentImageIndex] || '';
  const { source: progressiveSource, loading: imageLoading } = useProgressiveImage(
    currentImage,
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
  );
console.log("IMAGE PATH",progressiveSource,currentImage)
  // Preload next image for smoother transitions
  useEffect(() => {
    if (formattedImages.length > 1) {
      const nextIndex = (currentImageIndex + 1) % formattedImages.length;
      const nextImage = formattedImages[nextIndex];
      
      if (nextImage && !loadedImagesCache.current.has(nextImage)) {
        const img = new window.Image();
        img.src = nextImage;
        img.onload = () => {
          loadedImagesCache.current.add(nextImage);
        };
      }
    }
  }, [currentImageIndex, formattedImages]);

  // Wishlist effect
  useEffect(() => {
    if (!user || initialIsWished !== undefined) return;
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      const headers: Record<string, string> = {};
      if (session) headers['Authorization'] = `Bearer ${session.access_token}`;
      
      fetch(`/api/wishlist?productId=${product.id}`, { headers })
        .then(res => res.ok ? res.json() : null)
        .then(data => setIsWished(data?.isWished || false))
        .catch(console.error);
    });
  }, [user, product.id, initialIsWished]);

  // Font size effect
  useEffect(() => {
    const updateFontSize = () => {
      if (titleRef.current) {
        const containerWidth = titleRef.current.parentElement?.offsetWidth || 0;
        if (containerWidth < 200) setTitleFontSize('0.875rem');
        else if (containerWidth < 250) setTitleFontSize('0.9375rem');
        else setTitleFontSize('1rem');
      }
    };
    
    updateFontSize();
    window.addEventListener('resize', updateFontSize);
    return () => window.removeEventListener('resize', updateFontSize);
  }, []);

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/wishlist', {
        method: isWished ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ productId: product.id }),
      });

      if (response.ok) {
        setIsWished(!isWished);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const swipeDistance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0 && formattedImages.length > 1) {
        // Swiped left - next image
        setCurrentImageIndex((prev) => 
          prev === formattedImages.length - 1 ? 0 : prev + 1
        );
      } else if (swipeDistance < 0 && formattedImages.length > 1) {
        // Swiped right - previous image
        setCurrentImageIndex((prev) => 
          prev === 0 ? formattedImages.length - 1 : prev - 1
        );
      }
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <Box
      onClick={() => router.push(`/preCheckout?id=${encodeURIComponent(product.id)}`)}
      sx={{
        width: '100%',
        height: { xs: 320, sm: 390, md: 420 },
        maxWidth: { xs: 'none', sm: 'none', md: '16vw', lg: '16vw', xl: '16vw' },
        border: '1px solid #ededed',
        borderRadius: 2,
        boxShadow: 1,
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        cursor: 'pointer',
        overflow: 'hidden',
        m: { xs: 1, sm: 1.5, md: 2 },
        transition: 'box-shadow 0.3s ease',
        '&:hover': {
          boxShadow: 3,
        }
      }}
    >
      {/* Product Image - 85% height */}
      <Box 
        ref={imageContainerRef}
        sx={{ 
          position: 'relative', 
          height: '85%',
          touchAction: 'pan-y',
          bgcolor: '#f5f5f5',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {formattedImages.length > 0 ? (
          <>
            {/* Image skeleton while loading */}
            {imageLoading && (
              <Skeleton
                variant="rectangular"
                width="100%"
                height="100%"
                animation="wave"
                sx={{ position: 'absolute', zIndex: 2 }}
              />
            )}

            {/* Optimized Image with progressive loading */}
            <Image
              ref={imageRef}
              src={progressiveSource || currentImage}
              alt={`${product.title} - Image ${currentImageIndex + 1}`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
              style={{ 
                objectFit: 'cover',
                opacity: imageLoading ? 0 : 1,
                transition: 'opacity 0.3s ease-in-out'
              }}
              quality={75}
              onError={handleImageError}
              priority={currentImageIndex === 0}
              loading={currentImageIndex === 0 ? "eager" : "lazy"}
              // Use staticBlur for better performance
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
            />

            {/* Error state */}
            {imageError && (
              <Box
                sx={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'grey.200',
                  color: 'grey.500',
                  zIndex: 3,
                }}
              >
                <Typography>Failed to load image</Typography>
              </Box>
            )}
          </>
        ) : (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'grey.200',
              color: 'grey.500',
            }}
          >
            <Typography>No image available</Typography>
          </Box>
        )}

        {/* Image Dots Indicator */}
        {formattedImages.length > 1 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 0.75,
              zIndex: 2,
              padding: '4px 8px',
              borderRadius: '16px',
              bgcolor: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(4px)',
            }}
          >
            {formattedImages.map((_, index) => (
              <Box
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  if (index !== currentImageIndex) {
                    setCurrentImageIndex(index);
                  }
                }}
                sx={{
                  width: { xs: 10, sm: 8 },
                  height: { xs: 10, sm: 8 },
                  borderRadius: '50%',
                  bgcolor: index === currentImageIndex ? 'white' : 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'white',
                    transform: 'scale(1.2)',
                  }
                }}
              />
            ))}
          </Box>
        )}

        {/* Wishlist Button */}
        <IconButton
          aria-label="add to wishlist"
          onClick={handleWishlistToggle}
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            color: isWished ? 'error.main' : 'action.disabled',
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(4px)',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              color: 'error.main',
            },
            transition: 'all 0.2s ease',
            zIndex: 2,
          }}
        >
          <FavoriteIcon />
        </IconButton>
      </Box>

      {/* Product Details - 15% height */}
      <Box
        sx={{
          height: '15%',
          px: 2,
          py: 1.5,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            ref={titleRef}
            variant="body2"
            component="span"
            sx={{
              fontWeight: 600,
              fontSize: titleFontSize,
              lineHeight: 1.2,
              display: 'block',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: 'text.primary',
            }}
          >
            {product.title}
          </Typography>
        </Box>

        <Box sx={{ flexShrink: 0, textAlign: 'right' }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '0.875rem', sm: '1rem' },
              color: 'primary.main',
            }}
          >
            ₹{product.price_after}
          </Typography>
          {product.price_before && product.price_before > product.price_after && (
            <Typography
              variant="caption"
              sx={{
                textDecoration: 'line-through',
                color: 'text.secondary',
                fontSize: { xs: '0.75rem', sm: '0.8125rem' },
              }}
            >
              ₹{product.price_before}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};