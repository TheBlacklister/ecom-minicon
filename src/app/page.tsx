'use client';

import { useState, useEffect, useRef } from 'react';
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

interface WishlistItem {
  product: Product;
}

interface CartItem {
  product: Product;
  quantity: number;
}

/* ========================= */
/*  MARQUEE PRODUCTS (FIXED) */
/* ========================= */

const marqueeProducts = [
  { src: '/products/regular-fit-tshirt/bloom_asthestic/2minicon-asthetic-2.webp', id: 29 },
  { src: '/products/regular-fit-tshirt/aesthetic-outgrown_asthestic/1minicon-asthetic-3.webp', id: 34 },
  { src: '/products/regular-fit-tshirt/royal-blue_asthestic/5-minicon-asthetic.webp', id: 36 },
  { src: '/products/regular-fit-tshirt/astrobuddy_printed/2-astrobuddy.webp', id: 39 },
  { src: '/products/regular-fit-tshirt/hedgehog_printed-and-streetwear/2hedgehog-regular-fit.webp', id: 41 },
  { src: '/products/regular-fit-tshirt/hoot-pepar_asthestic/3hoot-pepar.webp', id: 38 },
];

/* ========================= */
/*  MOBILE HERO PRODUCTS     */
/* ========================= */

const mobileHeroProducts = [
  { src: '/Bannerformobile/Baner1.png', productId: 12 },
  { src: '/Bannerformobile/Baner2.png', productId: 17 },
  { src: '/Bannerformobile/Baner3.png', productId: 6 },
  { src: '/Bannerformobile/Baner4.png', productId: 35 },
  { src: '/Bannerformobile/Baner5.png', productId: 29 },
];

const scroll = keyframes`
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
`;

export default function Home() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });

  const [products, setProducts] = useState<Product[]>([]);
  const { user } = useAuth();
  const [wishedIds, setWishedIds] = useState<Set<number>>(new Set());
  const router = useRouter();

  const [slide, setSlide] = useState(0);
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
  const dragging = useRef(false);
  const autoSlideTimer = useRef<NodeJS.Timeout | null>(null);

  /* ========================= */
  /* FETCH PRODUCTS            */
  /* ========================= */

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products');
        const json = await res.json();
        setProducts(Array.isArray(json.products) ? json.products : []);
      } catch (err) {
        console.error(err);
      }
    }
    fetchProducts();
  }, []);

  /* ========================= */
  /* HERO AUTO SLIDE           */
  /* ========================= */

  useEffect(() => {
    if (!isMobile || mobileHeroProducts.length < 2) return;
    const id = setInterval(() => {
      setSlide((s) => (s + 1) % mobileHeroProducts.length);
    }, 5000);
    return () => clearInterval(id);
  }, [isMobile]);

  const restartAutoSlide = () => {
    if (autoSlideTimer.current) clearInterval(autoSlideTimer.current);
    autoSlideTimer.current = setInterval(() => {
      setSlide((s) => (s + 1) % mobileHeroProducts.length);
    }, 5000);
  };

  const onTouchStart = (e: any) => {
    dragging.current = true;
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = touchStartX.current;
  };

  const onTouchMove = (e: any) => {
    if (!dragging.current) return;
    touchCurrentX.current = e.touches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!dragging.current) return;
    dragging.current = false;
    const diff = touchCurrentX.current - touchStartX.current;
    if (Math.abs(diff) > 50) {
      if (diff < 0) {
        setSlide((s) => (s + 1) % mobileHeroProducts.length);
      } else {
        setSlide((s) =>
          s === 0 ? mobileHeroProducts.length - 1 : s - 1
        );
      }
    }
    restartAutoSlide();
  };

  const displayProducts = products.slice(0, 16);

  return (
    <Box sx={{ overflowX: 'hidden', background: '#fff' }}>
      
      {/* ========================= */}
      {/* HERO SECTION              */}
      {/* ========================= */}

      {isMobile ? (
        <Box
          sx={{ position: "relative", width: "100vw", height: "65vh", overflow: "hidden" }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {mobileHeroProducts.map((item, i) => (
            <Box
              key={item.src}
              onClick={() => router.push(`/preCheckout?id=${item.productId}`)}
              sx={{
                position: "absolute",
                inset: 0,
                opacity: i === slide ? 1 : 0,
                transform: `translateX(${(i - slide) * 100}%)`,
                transition: "all 0.6s cubic-bezier(.4,0,.2,1)",
                cursor: "pointer",
              }}
            >
              <Image
                src={item.src}
                alt="Hero"
                fill
                style={{ objectFit: "contain" }}
              />
            </Box>
          ))}
        </Box>
      ) : (
        <video
          src="/gifs/Banner 2.0 (DESKTOP Video).mp4"
          autoPlay
          loop
          muted
          playsInline
          style={{ width: "100%", objectFit: "cover" }}
        />
      )}

      {/* ========================= */}
      {/* TOP PICKS                 */}
      {/* ========================= */}

      <Typography align="center" sx={{ mt: 2, fontWeight: 600 }}>
        TOP PICKS OF THE WEEK
      </Typography>

      <Box
        sx={{
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          py: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            whiteSpace: "nowrap",
            animation: `${scroll} 30s linear infinite`,
            gap: 2,
          }}
        >
          {[...marqueeProducts, ...marqueeProducts].map((item, i) => (
            <Box
              key={i}
              onClick={() => router.push(`/preCheckout?id=${item.id}`)}
              sx={{
                position: "relative",
                height: { xs: 300, sm: 400 },
                cursor: "pointer",
              }}
            >
              <Image
                src={item.src}
                alt="Marquee"
                width={300}
                height={400}
                style={{ objectFit: "contain" }}
              />
            </Box>
          ))}
        </Box>
      </Box>

      {/* ========================= */}
      {/* CATEGORY + PRODUCTS       */}
      {/* ========================= */}

      <Typography align="center" sx={{ fontWeight: 600 }}>
        TRENDING CATEGORY
      </Typography>

      <CategoryCards />

      <Typography align="center" sx={{ fontWeight: 600, mt: 3 }}>
        NEW ARRIVALS
      </Typography>

      <Grid container spacing={1} justifyContent="center">
        {displayProducts.map((p) => (
          <Grid item xs={6} sm={4} md={2} key={p.id}>
            <ProductCard
              product={p}
              initialIsWished={wishedIds.has(p.id)}
            />
          </Grid>
        ))}
      </Grid>

      {products.length > 16 && (
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Button
            variant="contained"
            onClick={() => router.push('/categories/shop-by/new-arrivals')}
            sx={{ background: "#000" }}
          >
            Show More
          </Button>
        </Box>
      )}
    </Box>
  );
}
