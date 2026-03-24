'use client';

import { useState, useEffect,useRef  } from 'react';
import Image from 'next/image';
import { keyframes } from '@mui/system';
import { Box, Typography, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { GridLegacy as Grid } from '@mui/material';
import { ProductCard } from './components/productCard';
//import { useAuth } from './components/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import type { Product } from '@/types';
import CategoryCards from './components/categoryCards';
import { useRouter } from 'next/navigation';
//import { getFormattedOptimizedImageSrc } from '@/lib/imageOptimizer';

// Define types for API responses
/*interface WishlistItem {
  product: Product;
}

interface CartItem {
  product: Product;
  quantity: number;
}*/
{/*
const marqueeImages = [
  { src: '/products/regular-fit-tshirt/bloom_asthestic/2minicon-asthetic-2.webp', id: 29 },
  { src: '/products/regular-fit-tshirt/aesthetic-outgrown_asthestic/1minicon-asthetic-3.webp', id: 34 },
  { src: '/products/regular-fit-tshirt/royal-blue_asthestic/5-minicon-asthetic.webp', id: 36 },
  { src: '/products/regular-fit-tshirt/astrobuddy_printed/2-astrobuddy.webp', id: 39 },
  { src: '/products/regular-fit-tshirt/hedgehog_printed-and-streetwear/2hedgehog-regular-fit.webp', id: 41 },
  { src: '/products/regular-fit-tshirt/hoot-pepar_asthestic/3hoot-pepar.webp', id: 38 },
];*/}

// Put near marqueeImages (reuse your optimizer helper if you like)

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
  const [banner, setBanner] = useState<any>(null);
  const mobileBanner = banner?.mobile_urls;
  const desktopBanner = banner?.desktop_url;

  const mobileType = mobileBanner?.type;
  const mobileValue = mobileBanner?.value;

  const desktopType = desktopBanner?.type;
  const desktopValue = desktopBanner?.value;

  const [topPicks, setTopPicks] = useState<any[]>([]);
  //const { user } = useAuth();
  //const [wishedIds, setWishedIds] = useState<Set<number>>(new Set());
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [slide, setSlide] = useState(0);
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
  const dragging = useRef(false);
  const autoSlideTimer = useRef<NodeJS.Timeout | null>(null);
  const [desktopSlide, setDesktopSlide] = useState(0);


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
  
    fetchProducts()
  }, []);
  
  useEffect(() => {
    let active = true;
  
    async function fetchBanner() {
      const { data, error } = await supabase
        .from("hero_banner")
        .select("*")
        .eq("id", "main")
        .single();
  
      if (!active) return;
  
      if (error) {
        console.error(error);
        return;
      }
  
      setBanner(data);
    }
  
    fetchBanner();
  
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isMobile || mobileType !== "images" || !Array.isArray(mobileValue)) return;
  
    const id = setInterval(() => {
      setSlide((s) => (s + 1) % mobileValue.length);
    }, 5000);
  
    return () => clearInterval(id);
  }, [isMobile, mobileType, mobileValue]);

  useEffect(() => {
    if (isMobile || desktopType !== "images" || !Array.isArray(desktopValue)) return;
  
    const id = setInterval(() => {
      setDesktopSlide((s) => (s + 1) % desktopValue.length);
    }, 5000);
  
    return () => clearInterval(id);
  }, [isMobile, desktopType, desktopValue]);

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
    async function fetchTopPicks() {
      const { data } = await supabase
        .from("top_picks")
        .select("*")
        .eq("id", "main")
        .single();
  
      if (data?.products) {
        setTopPicks(data.products);
      }
    }
  
    fetchTopPicks();
  }, []);
  

  // Get products to display based on showAllProducts state
  const displayProducts = Array.isArray(products)
  ? products.slice(0, 16)
  : [];

  // Restart auto-slide timer
const restartAutoSlide = () => {
  if (autoSlideTimer.current) clearInterval(autoSlideTimer.current);
  autoSlideTimer.current = setInterval(() => {
    setSlide((s) => (s + 1) % (mobileValue.length || 1));
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
      setSlide((s) => (s + 1) % (mobileValue.length || 1));
    } else {
      // Swipe right → prev
      setSlide((s) =>
        s === 0 ? (mobileValue.length || 1) - 1 : s - 1
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
      setSlide((s) => (s + 1) % (mobileValue.length || 1));
    } else {
      setSlide((s) =>
        s === 0 ? (mobileValue.length || 1) - 1 : s - 1
      );
    }
  }

  restartAutoSlide();
};

const renderTopPick = (item: any, i: number, suffix: string) => {
  if (!products.length || !topPicks.length) return null;

  const product = products.find(
    (p) => Number(p.id) === Number(item.id)
  );
if (!product) return null;

  return (
    <Box
      key={`${product.id}-${suffix}-${i}`}
      onClick={() => router.push(`/preCheckout?id=${product.id}`)}
      sx={{
        position: 'relative',
        display: 'inline-block',
        borderRadius: { xs: 2, sm: 3 },
        overflow: 'hidden',
        flexShrink: 0,
        height: { xs: '300px', sm: '400px', md: '450px' },
        cursor: 'pointer',
      }}
    >
      <Image
        src={product.images?.[0] || "/products/regular-fit-tshirt/hoot-pepar_asthestic/3hoot-pepar.webp"}
        alt={product.title}
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
  );
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
  /* ================= MOBILE ================= */
  <Box
    sx={{
      position: "relative",
      width: "100vw",
      height: "65vh",
      overflow: "hidden",
      touchAction: "pan-y",
    }}
    onTouchStart={onTouchStart}
    onTouchMove={onTouchMove}
    onTouchEnd={onTouchEnd}
    onMouseDown={onMouseDown}
    onMouseMove={onMouseMove}
    onMouseUp={onMouseUp}
  >
    {/* 🔥 VIDEO */}
    {mobileType === "video" && typeof mobileValue === "string" && (
      <video
        src={mobileValue}
        autoPlay
        muted
        loop
        playsInline
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    )}

    {/* 🔥 IMAGES */}
    {mobileType === "images" &&
      Array.isArray(mobileValue) &&
      mobileValue.map((item: any, i: number) => {
        const imgUrl = item?.url;
        if (!imgUrl) return null;

        return (
          <Box
            key={i}
            onClick={async () => {
              if (!item?.product) return;

              let productId = item.product;

              if (isNaN(productId)) {
                const { data } = await supabase
                  .from("products")
                  .select("id")
                  .eq("slug", productId)
                  .single();

                if (!data) return;
                productId = data.id;
              }

              router.push(`/preCheckout?id=${productId}`);
            }}
            sx={{
              position: "absolute",
              inset: 0,
              opacity: i === slide ? 1 : 0,
              transform: `translateX(${(i - slide) * 100}%)`,
              transition: dragging.current
                ? "none"
                : "all 0.6s ease",
              cursor: "pointer",
            }}
          >
            <Image
              src={imgUrl}
              alt={`mobile-${i}`}
              fill
              priority={i === 0}
              sizes="100vw"
              style={{ objectFit: "cover" }}
            />
          </Box>
        );
      })}

    {/* 🔥 CONTROLS ONLY FOR IMAGES */}
    {mobileType === "images" && Array.isArray(mobileValue) && (
      <>
        {/* LEFT */}
        <Box
          onClick={() =>
            setSlide((s) =>
              s === 0 ? mobileValue.length - 1 : s - 1
            )
          }
          sx={arrowStyleLeft}
        >
          ‹
        </Box>

        {/* RIGHT */}
        <Box
          onClick={() =>
            setSlide((s) => (s + 1) % mobileValue.length)
          }
          sx={arrowStyleRight}
        >
          ›
        </Box>

        {/* DOTS */}
        <Box
          sx={{
            position: "absolute",
            bottom: 12,
            width: "100%",
            display: "flex",
            justifyContent: "center",
            gap: 1,
          }}
        >
          {mobileValue.map((_: any, i: number) => (
            <Box
              key={i}
              onClick={() => setSlide(i)}
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: i === slide ? "#008080" : "#ccc",
                cursor: "pointer",
              }}
            />
          ))}
        </Box>
      </>
    )}
  </Box>
) : (
  /* ================= DESKTOP ================= */
  <>
    {/* 🔥 VIDEO */}
    {desktopType === "video" && typeof desktopValue === "string" && (
      <video
        src={desktopValue}
        autoPlay
        muted
        loop
        playsInline
        style={{ width: "100%", height: "auto", objectFit: "cover" }}
      />
    )}

    {/* 🔥 IMAGES */}
    {desktopType === "images" &&
      Array.isArray(desktopValue) && (
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: "80vh",
            overflow: "hidden",
          }}
        >
          {desktopValue.map((item: any, i: number) => {
            const imgUrl = item?.url;
            if (!imgUrl) return null;

            return (
              <Box
                key={i}
                onClick={async () => {
                  if (!item?.product) return;

                  let productId = item.product;

                  if (isNaN(productId)) {
                    const { data } = await supabase
                      .from("products")
                      .select("id")
                      .eq("slug", productId)
                      .single();

                    if (!data) return;
                    productId = data.id;
                  }

                  router.push(`/preCheckout?id=${productId}`);
                }}
                sx={{
                  position: "absolute",
                  inset: 0,
                  opacity: i === desktopSlide ? 1 : 0,
                  transition: "opacity 0.6s ease",
                  cursor: "pointer",
                }}
              >
                <Image
                  src={imgUrl}
                  alt={`desktop-${i}`}
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  style={{ objectFit: "cover" }}
                />
              </Box>
            );
          })}

          {/* CONTROLS */}
          <Box
            onClick={() =>
              setDesktopSlide((s) =>
                s === 0 ? desktopValue.length - 1 : s - 1
              )
            }
            sx={arrowStyleLeft}
          >
            ‹
          </Box>

          <Box
            onClick={() =>
              setDesktopSlide((s) =>
                (s + 1) % desktopValue.length
              )
            }
            sx={arrowStyleRight}
          >
            ›
          </Box>

          {/* DOTS */}
          <Box
            sx={{
              position: "absolute",
              bottom: 12,
              width: "100%",
              display: "flex",
              justifyContent: "center",
              gap: 1,
            }}
          >
            {desktopValue.map((_: any, i: number) => (
              <Box
                key={i}
                onClick={() => setDesktopSlide(i)}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background:
                    i === desktopSlide ? "#008080" : "#ccc",
                  cursor: "pointer",
                }}
              />
            ))}
          </Box>
        </Box>
      )}
  </>
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
          {/* FIRST SET */}
          {(topPicks.length > 1 ? topPicks : [...topPicks, ...topPicks]).map((item, i) =>
  renderTopPick(item, i, "first")
)}


{/* DUPLICATE SET (IMPORTANT) */}
{(topPicks.length > 1 ? topPicks : [...topPicks, ...topPicks]).map((item, i) =>
  renderTopPick(item, i, "second")
)}
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

const arrowStyleLeft = {
  position: "absolute",
  top: "50%",
  left: 20,
  transform: "translateY(-50%)",
  background: "rgba(255,255,255,0.9)",
  borderRadius: "50%",
  width: 42,
  height: 42,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  zIndex: 5,
};

const arrowStyleRight = {
  ...arrowStyleLeft,
  left: "auto",
  right: 20,
};