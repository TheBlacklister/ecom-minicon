'use client';

import { useState, useEffect,useRef  } from 'react';
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
import { getFormattedOptimizedImageSrc } from '@/lib/imageOptimizer';

// Define types for API responses
interface WishlistItem {
  product: Product;
}

interface CartItem {
  product: Product;
  quantity: number;
}

const marqueeImages = [
  '/products/regular-fit-tshirt/bloom_asthestic/2minicon-asthetic-2.webp',
  '/products/regular-fit-tshirt/aesthetic-outgrown_asthestic/1minicon-asthetic-3.webp',
  '/products/regular-fit-tshirt/royal-blue_asthestic/5-minicon-asthetic.webp',
  '/products/regular-fit-tshirt/astrobuddy_printed/2-astrobuddy.webp',
  '/products/regular-fit-tshirt/hedgehog_printed-and-streetwear/2hedgehog-regular-fit.webp',
  '/products/regular-fit-tshirt/hoot-pepar_asthestic/3hoot-pepar.webp',
].map(getFormattedOptimizedImageSrc);

// Put near marqueeImages (reuse your optimizer helper if you like)
const mobileHeroImages = [
  '/Bannerformobile/Baner1.png',
  '/Bannerformobile/Baner2.png',
  '/Bannerformobile/Baner3.png',
  '/Bannerformobile/Baner4.png',
  '/Bannerformobile/Baner5.png'
].map(getFormattedOptimizedImageSrc);

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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const [products, setProducts] = useState<Product[]>([]);
  const { user } = useAuth();
  const [wishedIds, setWishedIds] = useState<Set<number>>(new Set());
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [slide, setSlide] = useState(0);
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
  const dragging = useRef(false);
  const autoSlideTimer = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products')
  
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
  
        const json = await res.json()
  
        const safeProducts = Array.isArray(json.products)
          ? json.products
          : []
  
        setProducts(safeProducts)
  
        localStorage.setItem(
          'allProducts',
          JSON.stringify(safeProducts)
        )
      } catch (err) {
        console.error('Error fetching products:', err)
        setProducts([])
      }
    }
  
    fetchProducts()
  }, []);
  
  

  useEffect(() => {
    if (!isMobile || mobileHeroImages.length < 2) return;
    const id = setInterval(() => {
      setSlide((s) => (s + 1) % mobileHeroImages.length);
    }, 5000);
    return () => clearInterval(id);
  }, [isMobile]);

  useEffect(() => {
    const video = videoRef.current;
    if (video && isMobile) {
      // Try to play the video programmatically
      const playPromise = video.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Video started playing');
          })
          .catch((error) => {
            console.log('Autoplay prevented:', error);
          });
      }
    }
  }, [isMobile]);
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
  const displayProducts = Array.isArray(products)
  ? products.slice(0, 16)
  : [];

  // Restart auto-slide timer
const restartAutoSlide = () => {
  if (autoSlideTimer.current) clearInterval(autoSlideTimer.current);
  autoSlideTimer.current = setInterval(() => {
    setSlide((s) => (s + 1) % mobileHeroImages.length);
  }, 5000); // slow slideshow
};

// Handle swipe start
const onTouchStart = (e: any) => {
  dragging.current = true;
  touchStartX.current = e.touches[0].clientX;
  touchCurrentX.current = touchStartX.current;
  if (autoSlideTimer.current) clearInterval(autoSlideTimer.current);
};

// Handle swipe move
const onTouchMove = (e: any) => {
  if (!dragging.current) return;
  touchCurrentX.current = e.touches[0].clientX;
};

// Handle swipe end
const onTouchEnd = () => {
  if (!dragging.current) return;
  dragging.current = false;

  const diff = touchCurrentX.current - touchStartX.current;

  // Threshold for slide change
  if (Math.abs(diff) > 50) {
    if (diff < 0) {
      // Swipe left → next
      setSlide((s) => (s + 1) % mobileHeroImages.length);
    } else {
      // Swipe right → prev
      setSlide((s) =>
        s === 0 ? mobileHeroImages.length - 1 : s - 1
      );
    }
  }

  restartAutoSlide();
};

// Mouse drag support (desktop)
const onMouseDown = (e: any) => {
  dragging.current = true;
  touchStartX.current = e.clientX;
  touchCurrentX.current = e.clientX;
  if (autoSlideTimer.current) clearInterval(autoSlideTimer.current);
};

const onMouseMove = (e: any) => {
  if (!dragging.current) return;
  touchCurrentX.current = e.clientX;
};

const onMouseUp = () => {
  if (!dragging.current) return;
  dragging.current = false;

  const diff = touchCurrentX.current - touchStartX.current;
  if (Math.abs(diff) > 60) {
    if (diff < 0) {
      setSlide((s) => (s + 1) % mobileHeroImages.length);
    } else {
      setSlide((s) =>
        s === 0 ? mobileHeroImages.length - 1 : s - 1
      );
    }
  }

  restartAutoSlide();
};



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
            mb: 0,                 // ← REMOVE WHITE GAP
            p: 0,
            height: 'auto',
          }}
      >
    {isMobile ? (
  <Box
    sx={{
      position: "relative",
      width: "100vw",
      height: "65vh",
      overflow: "hidden",
      mb: 0,
      touchAction: "pan-y",
    }}
    onTouchStart={onTouchStart}
    onTouchMove={onTouchMove}
    onTouchEnd={onTouchEnd}
    onMouseDown={onMouseDown}
    onMouseMove={onMouseMove}
    onMouseUp={onMouseUp}
  >
    {/* Slides */}
    {mobileHeroImages.map((src, i) => (
      <Box
        key={src}
        sx={{
          position: "absolute",
          inset: 0,
          opacity: i === slide ? 1 : 0,
          transform: `translateX(${(i - slide) * 100}%)`,
          transition: dragging.current
            ? "none"
            : "all 0.6s cubic-bezier(.4,0,.2,1)",
        }}
      >
        <Image
          src={src}
          alt={`Slide ${i + 1}`}
          fill
          style={{
            objectFit: "contain",
            width: "100%",
            height: "100%",
            userSelect: "none",
            touchAction: "none",
          }}
          draggable="false"
        />
      </Box>
    ))}

    {/* Left Arrow */}
    <Box
  onClick={() => {
    setSlide((s) => (s === 0 ? mobileHeroImages.length - 1 : s - 1));
    restartAutoSlide();
  }}
  sx={{
    position: "absolute",
    top: "50%",
    left: 12,
    transform: "translateY(-50%)",
    width: 34,
    height: 34,
    borderRadius: "50%",
    backgroundColor: "#fff",
    boxShadow: "0px 2px 8px rgba(0,0,0,0.25)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    cursor: "pointer",
  }}
>
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="black"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
</Box>


    {/* Right Arrow */}
    <Box
  onClick={() => {
    setSlide((s) => (s + 1) % mobileHeroImages.length);
    restartAutoSlide();
  }}
  sx={{
    position: "absolute",
    top: "50%",
    right: 12,
    transform: "translateY(-50%)",
    width: 34,
    height: 34,
    borderRadius: "50%",
    backgroundColor: "#fff",
    boxShadow: "0px 2px 8px rgba(0,0,0,0.25)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    cursor: "pointer",
  }}
>
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="black"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 6 15 12 9 18" />
  </svg>
</Box>


    {/* Dots */}
    <Box
      sx={{
        position: "absolute",
        bottom: 12,
        width: "100%",
        display: "flex",
        justifyContent: "center",
        gap: 1.2,
        zIndex: 15,
      }}
    >
      {mobileHeroImages.map((_, i) => (
        <Box
          key={i}
          onClick={() => {
            setSlide(i);
            restartAutoSlide();
          }}
          sx={{
            width: i === slide ? 10 : 8,
            height: i === slide ? 10 : 8,
            borderRadius: "50%",
            backgroundColor: i === slide ? "#027c80" : "#d6d6d6",
            transition: "all 0.25s ease",
            cursor: "pointer",
          }}
        />
      ))}
    </Box>
  </Box>
) : (
  <video
    src="/gifs/Banner 2.0 (DESKTOP Video).mp4"
    autoPlay
    loop
    muted
    playsInline
    style={{
      width: "100%",
      height: "auto",
      objectFit: "cover",
    }}
  />
)}


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
        { products.length > 16 && (
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
              Show More 
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}