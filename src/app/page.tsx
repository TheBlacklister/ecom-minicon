'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { keyframes } from '@mui/system';
import { Box, Typography, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { GridLegacy as Grid } from '@mui/material';
import { ProductCard } from './components/productCard';
import { useAuth } from './components/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import type { Product } from '@/types';
import CategoryCards from './components/categoryCards';
import { useRouter } from 'next/navigation';

// Define types for API responses
interface WishlistItem {
  product: Product;
}

interface CartItem {
  product: Product;
  quantity: number;
}

const marqueeImages = [
  '/products/Regular Fit Tshirt/Aesthetics Bloom/2Minicon Asthetic 2.png',
  '/products/Regular Fit Tshirt/Aesthetic Outgrown/1Minicon Asthetic 3.png',
  '/products/Regular Fit Tshirt/Aesthetics Royal Blue/5 Minicon Asthetic.png',
  '/products/Regular Fit Tshirt/AstroBuddy/2 AstroBuddy.png',
  '/products/Regular Fit Tshirt/Hedgehog/2Hedgehog Regular fit.png',
  '/products/Regular Fit Tshirt/Hoot Pepar/3Hoot Pepar.png',
] as const;

const scroll = keyframes`
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
`;

export default function Home() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [products, setProducts] = useState<Product[]>([]);
  const { user } = useAuth();
  const [wishedIds, setWishedIds] = useState<Set<number>>(new Set());
  const [showAllProducts, setShowAllProducts] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        console.log('Products from Supabase:', data);
        setProducts(data);
        if (typeof window !== 'undefined') {
          localStorage.setItem('allProducts', JSON.stringify(data));
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    }
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!user) {
      setWishedIds(new Set());
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      const headers: Record<string, string> = {};
      if (session) headers['Authorization'] = `Bearer ${session.access_token}`;
      fetch('/api/wishlist', { headers })
        .then(res => res.ok ? res.json() : [])
        .then((data: WishlistItem[]) => setWishedIds(new Set(data.map((w) => w.product.id))));
      fetch('/api/cart', { headers })
        .then(res => res.ok ? res.json() : [])
        .then((data: CartItem[]) => {
          const map = new Map<number, number>();
          data.forEach((c) => map.set(c.product.id, c.quantity));
        });
    });
  }, [user]);

  // Get products to display based on showAllProducts state
  const displayProducts = showAllProducts ? products : products.slice(0, 16);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'hidden',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
        backgroundColor: '#fff'
      }}
    >
      {/* Hero section replaced with looping video */}
      <Box
        sx={{
          width: '100%',
          mb: { xs: 4, sm: 1 },
          display: 'flex',
          justifyContent: 'center',
          height: {
            xs: '100vh',
            sm: 'auto'
          }
          
        }}
      >
        <video
          src={isMobile ? "/gifs/BannerMobile.mp4" : "/gifs/Banner.mp4"}
          autoPlay
          loop
          muted
          playsInline
          style={{
            width: '100%',
            height: isMobile ? '100%' : 'auto',
            objectFit: 'cover'
          }}
        />
      </Box>

      <Typography variant="h4"
        align="center"
        sx={{
          margin: {
            xs: 1,  // Reduced from 2vh/5vh to fixed pixels
            sm: 1  // Reduced from 5vh/10vh to fixed pixels
          },
          fontWeight: 600
        }}
        color="black">
        TOP PICKS OF THE WEEK
      </Typography>

      {/* Horizontally scrolling marquee with border radius */}
      <Box
        component="section"
        sx={{
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          background: '#fff',
          mb: { xs: 4, sm: 1 },
          py: { xs: 2, sm: 3 } // Add vertical padding instead of fixed height
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            whiteSpace: 'nowrap',
            width: 'max-content',
            animation: `${scroll} ${isMobile ? 20 : 30}s linear infinite`,
            gap: { xs: 1, sm: 1.5 },
          }}
        >
          {/* First set of images */}
          {marqueeImages.map((src, i) => (
            <Box
              key={`${src}-1-${i}`}
              sx={{
                position: 'relative',
                display: 'inline-block',
                borderRadius: { xs: 2, sm: 3 },
                overflow: 'hidden',
                flexShrink: 0,
                // Scale images responsively
                width: {
                  xs: 'auto',
                  sm: 'auto'
                },
                height: {
                  xs: '300px', // Base height for mobile
                  sm: '400px', // Base height for desktop
                  md: '450px'
                },
                '& img': {
                  height: '100%',
                  width: 'auto',
                  maxWidth: 'none'
                }
              }}
            >
              <Image
                src={src}
                alt={`Marquee ${i + 1}`}
                width={0}
                height={0}
                sizes="100vw"
                style={{
                  width: 'auto',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />
            </Box>
          ))}
          {/* Duplicate set for seamless loop */}
          {marqueeImages.map((src, i) => (
            <Box
              key={`${src}-2-${i}`}
              sx={{
                position: 'relative',
                display: 'inline-block',
                borderRadius: { xs: 2, sm: 3 },
                overflow: 'hidden',
                flexShrink: 0,
                // Scale images responsively
                width: {
                  xs: 'auto',
                  sm: 'auto'
                },
                height: {
                  xs: '300px', // Base height for mobile
                  sm: '400px', // Base height for desktop
                  md: '450px'
                },
                '& img': {
                  height: '100%',
                  width: 'auto',
                  maxWidth: 'none'
                }
              }}
            >
              <Image
                src={src}
                alt={`Marquee duplicate ${i + 1}`}
                width={0}
                height={0}
                sizes="100vw"
                style={{
                  width: 'auto',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />
            </Box>
          ))}
        </Box>
      </Box>
      <Typography variant="h4"
        align="center"
        sx={{
          mb: {
            xs: 1,  // Reduced margin bottom
            sm: 1,
            md: 3,
            lg: 3
          },
          fontWeight: 600
        }}
        color="black">
        TRENDING CATEGORY
      </Typography>
      <CategoryCards />
      {/* Product grid section with minimal spacing */}
      <Box sx={{
        padding: {
          xs: '0 8px 0 0',    // Minimal padding on mobile
          sm: '0 16px 0 0',   // Small padding on tablets
          md: '0 24px 0 0'    // Moderate padding on desktop
        },
        mb: 6
      }}>
        <Typography variant="h4"
          align="center"
          sx={{
            mb: {
              xs: 1,  // Reduced margin bottom
              sm: 1
            },
            fontWeight: 600
          }}
          color="black">
          NEW ARRIVALS
        </Typography>

        <Grid container spacing={{ xs: 0.5, sm: 1, md: 1 }} justifyContent="center">
          {displayProducts.map((p) => (
            <Grid item xs={6} sm={4} md={1.5} key={p.id}>
              <ProductCard
                product={p}
                initialIsWished={wishedIds.has(p.id)}
              />
            </Grid>
          ))}
        </Grid>

        {/* Show More Button */}
        {!showAllProducts && products.length > 16 && (
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            mt: { xs: 3, sm: 4 }
          }}>
            <Button
              variant="contained"
              onClick={() => router.push('/categories/shop-by/new-arrivals')}
              sx={{
                backgroundColor: '#000',
                color: '#fff',
                padding: { xs: '12px 24px', sm: '16px 32px' },
                fontSize: { xs: '14px', sm: '16px' },
                fontWeight: 600,
                borderRadius: '8px',
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: '#333',
                },
                '&:active': {
                  backgroundColor: '#555',
                }
              }}
            >
              Show More ({products.length - 16} more items)
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}