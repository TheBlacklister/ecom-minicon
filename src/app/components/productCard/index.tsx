'use client';

import Image from 'next/image';
import { Box, Typography, IconButton, CircularProgress } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useRouter } from 'next/navigation';
import React, { useMemo, useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '../AuthProvider';
import type { Product } from '@/types';

export const ProductCard: React.FC<{
  product: Product;
  initialIsWished?: boolean;
}> = ({ product, initialIsWished }) => {
  const router = useRouter();
  const { user } = useAuth();
  const [isWished, setIsWished] = useState(initialIsWished ?? false);
  const [titleFontSize, setTitleFontSize] = useState('1rem');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const titleRef = useRef<HTMLSpanElement>(null);
  
  // Touch handling refs
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Format image paths by replacing backslashes with forward slashes
  const formatImagePath = (path: string): string => {
    let formatted = path.replace(/\\/g, '/');
    formatted = formatted.replace(/^public\//i, '/');
    formatted = formatted.replace(/\/+/g, '/');
    if (!formatted.startsWith('/')) {
      formatted = '/' + formatted;
    }
    return formatted;
  };

  // Get formatted images array
  const formattedImages = useMemo(
    () => product.images?.map(formatImagePath) || [],
    [product.images]
  );

  useEffect(() => {
    if (!user) return;
    if (initialIsWished !== undefined) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      const headers: Record<string, string> = {};
      if (session) headers['Authorization'] = `Bearer ${session.access_token}`;
      fetch(`/api/wishlist?productId=${product.id}`, { headers })
        .then(res => res.ok ? res.json() : null)
        .then(data => setIsWished(!!data));
    });
  }, [user, product.id, initialIsWished]);

  useEffect(() => {
    if (initialIsWished !== undefined) setIsWished(initialIsWished);
  }, [initialIsWished]);

  // Dynamic font size adjustment for title
  useEffect(() => {
    const adjustTitleFontSize = () => {
      if (!titleRef.current) return;
      
      const container = titleRef.current.parentElement;
      if (!container) return;
      
      const containerWidth = container.clientWidth - 16;
      titleRef.current.style.fontSize = '1rem';
      titleRef.current.style.whiteSpace = 'nowrap';
      
      let fontSize = 16;
      
      while (titleRef.current.scrollWidth > containerWidth && fontSize > 10) {
        fontSize -= 0.5;
        titleRef.current.style.fontSize = `${fontSize}px`;
      }
      
      setTitleFontSize(`${fontSize}px`);
    };

    const timer = setTimeout(adjustTitleFontSize, 100);
    window.addEventListener('resize', adjustTitleFontSize);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', adjustTitleFontSize);
    };
  }, [product.title]);

  const handleWishlistToggle = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!user) {
      router.push('/login');
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session) headers['Authorization'] = `Bearer ${session.access_token}`;
    if (isWished) {
      await fetch('/api/wishlist', { method: 'DELETE', headers, body: JSON.stringify({ product_id: product.id }) });
      setIsWished(false);
    } else {
      await fetch('/api/wishlist', { method: 'POST', headers, body: JSON.stringify({ product_id: product.id }) });
      setIsWished(true);
    }
  };

  // Touch handlers for swipe functionality
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation(); // Prevent card click on swipe
    if (!touchStartX.current || !touchEndX.current) return;

    const swipeThreshold = 50; // Minimum swipe distance
    const swipeDistance = touchStartX.current - touchEndX.current;

    if (Math.abs(swipeDistance) > swipeThreshold) {
      if (swipeDistance > 0 && formattedImages.length > 1) {
        // Swiped left - next image
        setImageLoading(true);
        setCurrentImageIndex((prev) => 
          prev === formattedImages.length - 1 ? 0 : prev + 1
        );
      } else if (swipeDistance < 0 && formattedImages.length > 1) {
        // Swiped right - previous image
        setImageLoading(true);
        setCurrentImageIndex((prev) => 
          prev === 0 ? formattedImages.length - 1 : prev - 1
        );
      }
    }

    // Reset values
    touchStartX.current = 0;
    touchEndX.current = 0;
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
          touchAction: 'pan-y', // Allow vertical scrolling but handle horizontal swipes
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Loading Spinner */}
        {imageLoading && (
          <Box
            sx={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              zIndex: 3,
            }}
          >
            <CircularProgress size={40} />
          </Box>
        )}

        {formattedImages.length > 0 ? (
          <>
            {/* Only render the current image */}
            <Box
              sx={{
                position: 'absolute',
                width: '100%',
                height: '100%',
              }}
            >
              <Image
  src={formattedImages[currentImageIndex]}
  alt={`${product.title} - Image ${currentImageIndex + 1}`}
  fill
  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
  style={{ objectFit: 'cover' }}
  quality={60} // You can try 60-70 for PNG sources as they compress better
  onLoad={() => setImageLoading(false)}
  onError={() => setImageLoading(false)}
  placeholder="blur"
  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
  priority={currentImageIndex === 0}
  loading={currentImageIndex === 0 ? "eager" : "lazy"}
/>

            </Box>
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

        {/* Image Dots Indicator - Always visible when more than 1 image */}
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
                  setImageLoading(true);
                  setCurrentImageIndex(index);
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
            color: isWished ? 'red' : 'white',
            zIndex: 2,
            bgcolor: 'rgba(0, 0, 0, 0.2)',
            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.35)' }
          }}
        >
          <FavoriteIcon sx={{ fontSize: '1.7rem' }} />
        </IconButton>
      </Box>

      {/* Bottom Info Row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          px: 1,
          py: 1.1,
          height: '15%',
          bgcolor: 'rgba(255,255,255,0.98)',
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8,
        }}
      >
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {/* Title Row */}
          <Box sx={{ width: '100%' }}>
            <Typography
              variant="subtitle1"
              fontWeight={530}
              color="black"
              sx={{
                fontFamily: 'sans-serif',
                fontSize: titleFontSize,
                whiteSpace: 'nowrap',
                overflow: 'visible',
                textOverflow: 'clip',
              }}
            >
              <span ref={titleRef}>{product.title}</span>
            </Typography>
          </Box>
          
          {/* Price Row */}
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Typography
              variant="subtitle2"
              fontWeight={550}
              fontSize={20}
              color="black"
              sx={{
                fontFamily: '"Montserrat", sans-serif ',
                fontSize: { xs: '0.92rem', sm: '1rem' },
                whiteSpace: 'nowrap',
              }}
            >
              ₹{product.price_after}
            </Typography>
            <Typography
              variant="body2"
              fontWeight={400}
              color="text.secondary"
              sx={{
                textDecoration: 'line-through',
                fontFamily: '"Montserrat", sans-serif ',
                fontSize: { xs: '0.7rem', sm: '0.82rem' },
                whiteSpace: 'nowrap',
              }}
            >
              ₹{product.price_before ?? product.price_after}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};