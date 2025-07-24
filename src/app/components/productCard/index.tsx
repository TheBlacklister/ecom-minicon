'use client';

import Image from 'next/image';
import { Box, Typography, IconButton } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
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
  const titleRef = useRef<HTMLSpanElement>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Format image paths by replacing backslashes with forward slashes
  const formatImagePath = (path: string): string => {
    // Replace all backslashes with forward slashes
    let formatted = path.replace(/\\/g, '/');
    
    // Remove 'public' from the beginning of the path
    formatted = formatted.replace(/^public\//i, '/');
    
    // Replace multiple consecutive slashes with a single slash
    formatted = formatted.replace(/\/+/g, '/');
    
    // Ensure the path starts with a single forward slash
    if (!formatted.startsWith('/')) {
      formatted = '/' + formatted;
    }
    
    return formatted;
  };

  // Get formatted images array
  const formattedImages = product.images?.map(formatImagePath) || [];
  
  console.log('Product data:', product);
  console.log('Raw images array:', product.images);
  console.log('Formatted images array:', formattedImages);
  console.log('Current image being displayed:', formattedImages[currentImageIndex]);

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
      
      const containerWidth = container.clientWidth - 16; // Account for padding
      titleRef.current.style.fontSize = '1rem';
      titleRef.current.style.whiteSpace = 'nowrap';
      
      let fontSize = 16; // Start with 1rem = 16px
      
      while (titleRef.current.scrollWidth > containerWidth && fontSize > 10) {
        fontSize -= 0.5;
        titleRef.current.style.fontSize = `${fontSize}px`;
      }
      
      setTitleFontSize(`${fontSize}px`);
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(adjustTitleFontSize, 100);
    
    // Adjust on window resize
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

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === 0 ? formattedImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === formattedImages.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <Box
      onClick={() => router.push(`/preCheckout?id=${encodeURIComponent(product.id)}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        width: '100%',
        height: { xs: 320, sm: 390, md: 420 },
        minHeight: 280,
        maxHeight: 480,
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
      <Box sx={{ position: 'relative', height: '85%' }}>
        {formattedImages.length > 0 ? (
          <Image
            src={formattedImages[currentImageIndex]}
            alt={`${product.title} - Image ${currentImageIndex + 1}`}
            fill
            sizes="(max-width:600px) 90vw, (max-width:900px) 45vw, 20vw"
            style={{ objectFit: 'cover' }}
          />
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

        {/* Carousel Navigation Arrows - Only show on hover and if more than 1 image */}
        {formattedImages.length > 1 && isHovered && (
          <>
            <IconButton
              onClick={handlePrevImage}
              sx={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 1)' },
                zIndex: 2,
              }}
            >
              <ChevronLeftIcon />
            </IconButton>
            <IconButton
              onClick={handleNextImage}
              sx={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 1)' },
                zIndex: 2,
              }}
            >
              <ChevronRightIcon />
            </IconButton>
          </>
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
              gap: 0.5,
              zIndex: 2,
            }}
          >
            {formattedImages.map((_, index) => (
              <Box
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(index);
                }}
                sx={{
                  width: 8,
                  height: 8,
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
          px: 2,
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
              fontWeight={700}
              color="black"
              sx={{
                fontFamily: '"Montserrat", sans-serif ',
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
              fontWeight={700}
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