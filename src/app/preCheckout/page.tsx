"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Product } from '@/types';
import Image from "next/image";
import { Typography, Button, Box, Accordion, AccordionSummary, AccordionDetails, IconButton, Dialog, DialogContent, CircularProgress, Skeleton, Snackbar, Alert, Container } from "@mui/material";
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '../components/AuthProvider';
import { useCount } from '../components/CountProvider';
import { ProductCard } from '../components/productCard';


const PreCheckout = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { incrementCartCount, incrementWishlistCount, decrementWishlistCount } = useCount();
  const id = searchParams.get("id");
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isWished, setIsWished] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  const [mainImageLoading, setMainImageLoading] = useState(true);
  const [thumbnailsLoaded, setThumbnailsLoaded] = useState<boolean[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  const [suggestedLoading, setSuggestedLoading] = useState(false);
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

  useEffect(() => {
    async function fetchProduct() {
      if (!id) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const res = await fetch('/api/products');
        const data: Product[] = await res.json();
        const prod = data.find(p => p.id === Number(id)) || null;
        setProduct(prod);
        if (prod) {
          setSelectedSize(prod.available_sizes[0] || '');
          // Initialize thumbnails loaded state
          setThumbnailsLoaded(new Array(prod.images?.length || 0).fill(false));
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  // Check initial wishlist status
  useEffect(() => {
    if (!product || !user) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      const headers: Record<string, string> = {};
      if (session) headers['Authorization'] = `Bearer ${session.access_token}`;
      fetch(`/api/wishlist?productId=${product.id}`, { headers })
        .then(res => res.ok ? res.json() : null)
        .then(data => setIsWished(data?.isWished || false));
    });
  }, [user, product]);

  // Fetch suggested products based on matching collections
  useEffect(() => {
    if (!product) return;
    
    setSuggestedLoading(true);
    fetch('/api/products')
      .then(res => res.ok ? res.json() : [])
      .then((allProducts: Product[]) => {
        // Filter products with matching collections, excluding current product
        const matchingProducts = allProducts.filter(p => 
          p.id !== product.id && // Exclude current product
          p.is_active !== false && // Only active products
          p.collections && p.collections.length > 0 && // Has collections
          product.collections && product.collections.length > 0 && // Current product has collections
          p.collections.some(collection => 
            product.collections.includes(collection)
          )
        ).slice(0, 8); // Limit to 8 products
        
        setSuggestedProducts(matchingProducts);
      })
      .catch(error => {
        console.error('Error fetching suggested products:', error);
        setSuggestedProducts([]);
      })
      .finally(() => {
        setSuggestedLoading(false);
      });
  }, [product]);

  // Show loading screen while fetching data
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          width: '100vw',
          bgcolor: 'white',
        }}
      >
        <CircularProgress 
          size={60} 
          thickness={4}
          sx={{ 
            color: '#e53935',
            mb: 3 
          }} 
        />
        <Typography 
          variant="h6" 
          sx={{ 
            fontFamily: '"Montserrat", sans-serif',
            color: '#666',
            fontWeight: 500 
          }}
        >
          Loading product details...
        </Typography>
      </Box>
    );
  }

  // Show error message if product not found after loading
  if (!product) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          width: '100vw',
          bgcolor: 'white',
        }}
      >
        <Typography 
          variant="h5" 
          color="error"
          sx={{ 
            fontFamily: '"Montserrat", sans-serif',
            fontWeight: 600,
            mb: 2
          }}
        >
          Product not found
        </Typography>
        <Button
          variant="contained"
          onClick={() => router.push('/')}
          sx={{
            fontFamily: '"Montserrat", sans-serif',
            fontWeight: 600,
            textTransform: 'none',
          }}
        >
          Go back to home
        </Button>
      </Box>
    );
  }

  // Get formatted images array
  const formattedImages = product.images?.map(formatImagePath) || [];

  // Handlers
  const handleWishlistToggle = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session) headers['Authorization'] = `Bearer ${session.access_token}`;
    if (isWished) {
      const response = await fetch('/api/wishlist', { method: 'DELETE', headers, body: JSON.stringify({ productId: product.id }) });
      if (response.ok) {
        setIsWished(false);
        decrementWishlistCount();
      }
    } else {
      const response = await fetch('/api/wishlist', { method: 'POST', headers, body: JSON.stringify({ productId: product.id }) });
      if (response.ok) {
        setIsWished(true);
        incrementWishlistCount();
      }
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session) headers['Authorization'] = `Bearer ${session.access_token}`;
    const res = await fetch('/api/cart', {
      method: 'POST',
      headers,
      body: JSON.stringify({ product_id: product.id, quantity: quantity })
    });
    if (res.ok) {
      await res.json();
      // Update cart count optimistically
      incrementCartCount();
      // Show success notification
      setShowNotification(true);
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session) headers['Authorization'] = `Bearer ${session.access_token}`;
    
    const response = await fetch('/api/cart?buyNow=true', {
      method: 'POST',
      headers,
      body: JSON.stringify({ product_id: product.id, quantity: quantity })
    });
    
    if (response.ok) {
      // Update cart count optimistically
      incrementCartCount();
      router.push(`/cart?buyNow=${product.id}`);
    }
  };

  const handlePrevImage = () => {
    setMainImageLoading(true);
    setCurrentImageIndex((prev) => 
      prev === 0 ? formattedImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setMainImageLoading(true);
    setCurrentImageIndex((prev) => 
      prev === formattedImages.length - 1 ? 0 : prev + 1
    );
  };

  const handleThumbnailClick = (index: number) => {
    if (index !== currentImageIndex) {
      setMainImageLoading(true);
      setCurrentImageIndex(index);
    }
  };

  const handleSizeChartOpen = () => {
    setSizeChartOpen(true);
  };

  const handleSizeChartClose = () => {
    setSizeChartOpen(false);
  };

  const handleThumbnailLoad = (index: number) => {
    setThumbnailsLoaded(prev => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
  };

  return (
    <>
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        gap: { xs: 0, md: 6 },
        padding: { xs: "0", md: "5vh 7vw" },
        bgcolor: "white",
        minHeight: "100vh",
        width: "100%",
        maxWidth: "100vw",
        overflowX: "hidden",
        boxSizing: "border-box"
      }}
    >
      {/* Product Image with carousel */}
      <Box
        sx={{
          width: { xs: '100vw', md: '38vw' },
          minWidth: {  md: 220 },
          flexShrink: 0,
          alignSelf: { md: 'flex-start' },
          mb: { xs: 2, md: 0 },
          ml: { sm: 0, md: 0 },
          mr: { sm: 0, md: 0 },
          px: { xs: 0, md: 0 },
        }}
      >
        {/* Main Image with Navigation */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            aspectRatio: '4/5',
            bgcolor: 'white',
            borderRadius: { xs: 0, md: 3 },
            overflow: 'hidden',
            mb: 2,
          }}
          onMouseEnter={() => setIsHoveringImage(true)}
          onMouseLeave={() => setIsHoveringImage(false)}
        >
          {/* Loading skeleton for main image */}
          {mainImageLoading && (
            <Box
              sx={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                zIndex: 2,
                bgcolor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CircularProgress size={40} />
            </Box>
          )}

          {formattedImages.length > 0 ? (
            <Box
              sx={{
                position: 'absolute',
                width: '100%',
                height: '100%',
              }}
            >
              <Image
                key={currentImageIndex}
                src={formattedImages[currentImageIndex]}
                alt={`${product.title} - Image ${currentImageIndex + 1}`}
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 600px) 100vw, 40vw"
                quality={75}
                onLoad={() => setMainImageLoading(false)}
                onError={() => setMainImageLoading(false)}
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
              />
            </Box>
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

          {/* Navigation Arrows - Only show on hover and if more than 1 image */}
          {formattedImages.length > 1 && isHoveringImage && (
            <>
              <IconButton
                onClick={handlePrevImage}
                sx={{
                  position: 'absolute',
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 1)' },
                  zIndex: 3,
                  boxShadow: 1,
                }}
              >
                <ChevronLeftIcon />
              </IconButton>
              <IconButton
                onClick={handleNextImage}
                sx={{
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 1)' },
                  zIndex: 3,
                  boxShadow: 1,
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
                bottom: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 1,
                zIndex: 2,
              }}
            >
              {formattedImages.map((_, index) => (
                <Box
                  key={index}
                  onClick={() => handleThumbnailClick(index)}
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: index === currentImageIndex ? 'grey.800' : 'rgba(0, 0, 0, 0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: 'grey.700',
                      transform: 'scale(1.2)',
                    }
                  }}
                />
              ))}
            </Box>
          )}
        </Box>

        {/* Thumbnail Gallery with Progressive Loading */}
        {formattedImages.length > 1 && (
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              overflowX: 'auto',
              pb: 1,
              px: { xs: 2, md: 0 },
              '&::-webkit-scrollbar': {
                height: 6,
              },
              '&::-webkit-scrollbar-track': {
                bgcolor: 'grey.200',
                borderRadius: 3,
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: 'grey.400',
                borderRadius: 3,
                '&:hover': {
                  bgcolor: 'grey.500',
                },
              },
            }}
          >
            {formattedImages.map((image, index) => (
              <Box
                key={index}
                onClick={() => handleThumbnailClick(index)}
                sx={{
                  position: 'relative',
                  width: 80,
                  height: 100,
                  flexShrink: 0,
                  borderRadius: 1,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: index === currentImageIndex ? '2px solid' : '1px solid',
                  borderColor: index === currentImageIndex ? 'primary.main' : 'grey.300',
                  transition: 'all 0.3s ease',
                  bgcolor: 'grey.100',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'scale(1.05)',
                  },
                }}
              >
                {/* Skeleton loader for thumbnail */}
                {!thumbnailsLoaded[index] && (
                  <Skeleton
                    variant="rectangular"
                    width={80}
                    height={100}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                    }}
                  />
                )}
                <Image
                  src={image}
                  alt={`${product.title} - Thumbnail ${index + 1}`}
                  fill
                  style={{ 
                    objectFit: 'cover',
                    opacity: thumbnailsLoaded[index] ? 1 : 0,
                    transition: 'opacity 0.3s ease'
                  }}
                  sizes="80px"
                  quality={40} // Lower quality for thumbnails
                  onLoad={() => handleThumbnailLoad(index)}
                  placeholder="blur"
                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
                />
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Product Details */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          color: "black",
          pl: { md: 2 },
          px: { xs: '4vw', md: 0 },
          pt: { xs: 2, md: 0 },
        }}
      >
        {/* Title with Favorite Icon */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
          <Typography sx={{ fontSize: "2.1rem", fontWeight: 700, fontFamily: '"Montserrat", sans-serif ' }}>
            {product.title}
          </Typography>
          <IconButton
            aria-label="add to wishlist"
            onClick={handleWishlistToggle}
            sx={{ 
              color: isWished ? 'error.main' : 'action.disabled',
              padding: 1,
              '&:hover': {
                color: 'error.main',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <FavoriteIcon sx={{ fontSize: '1.8rem' }} />
          </IconButton>
        </Box>
        <Typography sx={{ fontSize: "1.2rem", mb: 1, fontFamily: '"Montserrat", sans-serif ', color: '#555' }}>
          {product.subtitle}
        </Typography>
        
        {/* Price and Quantity */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Typography sx={{ fontSize: "1.6rem", fontWeight: 600, fontFamily: '"Montserrat", sans-serif ', color: '#222' }}>
            ₹{product.price_after}
          </Typography>
          {product.price_before && product.price_before > product.price_after && (
            <Typography 
              sx={{ 
                fontSize: "1.2rem", 
                textDecoration: 'line-through', 
                color: 'grey.600',
                fontFamily: '"Montserrat", sans-serif ' 
              }}
            >
              ₹{product.price_before}
            </Typography>
          )}
          <Select
            value={quantity}
            onChange={e => setQuantity(Number(e.target.value))}
            size="small"
            sx={{ minWidth: 60, fontFamily: '"Montserrat", sans-serif ', fontWeight: 500 }}
          >
            {[...Array(10)].map((_, i) => (
              <MenuItem key={i + 1} value={i + 1}>{i + 1}</MenuItem>
            ))}
          </Select>
        </Box>
        
        {/* Size Buttons */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, maxWidth: 'fit-content' }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ fontFamily: '"Montserrat", sans-serif ', mr: 3 }}>
              Select size
            </Typography>
            <Typography 
              variant="body2" 
              onClick={handleSizeChartOpen}
              sx={{ 
                color: '#1976d2', 
                fontFamily: '"Montserrat", sans-serif ', 
                cursor: 'pointer',
                textDecoration: 'underline',
                '&:hover': {
                  color: '#1565c0',
                }
              }}
            >
              Size Chart
            </Typography>
          </Box>
          <Box>
            {product.available_sizes.map((s) => (
              <Button
                key={s}
                onClick={() => setSelectedSize(s)}
                sx={{
                  border: selectedSize === s ? '2px solid #e53935' : '1px solid',
                  borderRadius: 1,
                  px: 1.5,
                  py: 0.5,
                  fontSize: 14,
                  color: selectedSize === s ? '#e53935' : 'black',
                  margin: '1vh 0.5vw',
                  textTransform: 'none',
                  fontWeight: selectedSize === s ? 700 : 400,
                  fontFamily: '"Montserrat", sans-serif ',
                  bgcolor: selectedSize === s ? '#ffeaea' : 'white',
                  boxShadow: selectedSize === s ? 2 : 0,
                }}
              >
                {s}
              </Button>
            ))}
          </Box>
        </Box>
        
        {/* Action Buttons - Updated to vertical layout */}
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          mb: 2,
          maxWidth: { xs: '100%', sm: 320 },
        }}>
          <Button
            variant="contained"
            onClick={handleBuyNow}
            sx={{
              width: '100%',
              height: 54,
              fontWeight: 700,
              fontFamily: '"Montserrat", sans-serif ',
              fontSize: 17,
              textTransform: 'none',
              borderRadius: 2,
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              backgroundColor: '#000000',
              color: 'white',
              '&:hover': {
                backgroundColor: '#333333',
                boxShadow: '0 6px 8px rgba(0, 0, 0, 0.15)',
              }
            }}
          >
            Buy Now
          </Button>
          <Button
            variant="outlined"
            onClick={handleAddToCart}
            sx={{
              width: '100%',
              height: 54,
              fontWeight: 700,
              fontFamily: '"Montserrat", sans-serif ',
              fontSize: 17,
              textTransform: 'none',
              borderRadius: 2,
              border: '2px solid #000000',
              color: '#000000',
              bgcolor: 'white',
              '&:hover': {
                border: '2px solid #000000',
                bgcolor: '#f5f5f5',
                color: '#000000',
              }
            }}
          >
            Add to Cart
          </Button>
        </Box>
        
        {/* Social Share Icons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="body2" sx={{ fontFamily: '"Montserrat", sans-serif ', color: '#888' }}>Share</Typography>
          <WhatsAppIcon sx={{ color: '#25D366', cursor: 'pointer' }} />
          <FacebookIcon sx={{ color: '#4267B2', cursor: 'pointer' }} />
          <InstagramIcon sx={{ color: '#C13584', cursor: 'pointer' }} />
        </Box>
        
       
        
        {/* Description Section */}
        <Box sx={{ mt: 2 }}>
          <Accordion 
            sx={{ 
              boxShadow: 'none',
              '&:before': {
                display: 'none',
              },
              border: '1px solid #e0e0e0',
              borderRadius: '8px !important',
              '&.Mui-expanded': {
                margin: '0',
              }
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                '& .MuiAccordionSummary-content': {
                  margin: '12px 0',
                },
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                }
              }}
            >
              <Typography variant="subtitle1" fontWeight={700} sx={{ fontFamily: '"Montserrat", sans-serif ' }}>
                DESCRIPTION
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {product.description?.split('\\n').map((line, idx) => (
                  <li key={idx} style={{ marginBottom: 3 }}>
                    <Typography variant="body2" color="black" sx={{ fontFamily: '"Montserrat", sans-serif ' }}>
                      {line}
                    </Typography>
                  </li>
                ))}
              </ul>
              <Typography variant="body2" color="black" sx={{ fontFamily: '"Montserrat", sans-serif ', mt: 2 }}>
                <strong>NOTE:</strong> Please note that due to varying lighting conditions, the colors and textures shown in our product images may differ slightly from the actual garment. We make every effort to ensure accurate representation, but subtle variations may occur.
              </Typography>
              <Typography variant="body2" color="black" sx={{ fontFamily: '"Montserrat", sans-serif ', mt: 1 }}>
                Each Minicon piece is custom-crafted and print placements may vary—enhancing the individuality and uniqueness of your garment. We appreciate your understanding and thank you for celebrating the distinct character of every creation.
              </Typography>
            </AccordionDetails>
          </Accordion>

          {/* Wash Care Section */}
          <Accordion 
            sx={{ 
              boxShadow: 'none',
              '&:before': {
                display: 'none',
              },
              border: '1px solid #e0e0e0',
              borderRadius: '8px !important',
              marginTop: 2,
              '&.Mui-expanded': {
                margin: '16px 0 0 0',
              }
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                '& .MuiAccordionSummary-content': {
                  margin: '12px 0',
                },
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                }
              }}
            >
              <Typography variant="subtitle1" fontWeight={700} sx={{ fontFamily: '"Montserrat", sans-serif ' }}>
                WASH CARE
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {product.wash_care?.split('\\n').map((line, idx) => (
                  <li key={idx} style={{ marginBottom: 3 }}>
                    <Typography variant="body2" color="black" sx={{ fontFamily: '"Montserrat", sans-serif ' }}>
                      {line}
                    </Typography>
                  </li>
                ))}
              </ul>
            </AccordionDetails>
          </Accordion>

          {/* Made in India - Added below wash care */}
          <Typography 
            variant="body1" 
            sx={{ 
              mt: 3,
              fontFamily: '"Montserrat", sans-serif',
              fontWeight: 600,
              color: '#333',
              textAlign: 'center',
            }}
          >
            Made in India
          </Typography>
        </Box>

        {/* Size Chart Modal */}
        <Dialog
          open={sizeChartOpen}
          onClose={handleSizeChartClose}
          maxWidth="md"
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              borderRadius: 2,
            }
          }}
        >
          <Box sx={{ position: 'relative' }}>
            <IconButton
              onClick={handleSizeChartClose}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                zIndex: 1,
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 1)',
                }
              }}
            >
              <CloseIcon />
            </IconButton>
            <DialogContent sx={{ p: 0 }}>
              {product.size_chart_image && (
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: 'auto',
                    minHeight: 400,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'white',
                  }}
                >
                  <Image
                    src={formatImagePath(product.size_chart_image)}
                    alt="Size Chart"
                    width={800}
                    height={600}
                    style={{
                      width: '100%',
                      height: 'auto',
                      objectFit: 'contain',
                    }}
                    quality={70}
                  />
                </Box>
              )}
            </DialogContent>
          </Box>
        </Dialog>


        {/* Success Notification */}
        <Snackbar
          open={showNotification}
          autoHideDuration={3000}
          onClose={() => setShowNotification(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          sx={{ mb: 2 }}
        >
          <Alert 
            onClose={() => setShowNotification(false)} 
            severity="success" 
            variant="filled"
            sx={{
              fontFamily: '"Montserrat", sans-serif',
              fontWeight: 500,
              '& .MuiAlert-message': {
                padding: '4px 0',
              }
            }}
          >
            Item added to cart successfully
          </Alert>
        </Snackbar>
      </Box>
    </Box>

    {/* Suggested Products Section - Full Width at Bottom */}
    {!loading && product && (suggestedProducts.length > 0 || suggestedLoading) && (
      <Box sx={{ width: '100%', bgcolor: '#f9f9f9', py: 6 }}>
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontFamily: '"Montserrat", sans-serif', 
              fontWeight: 700, 
              textAlign: 'center', 
              mb: 4,
              color: '#222'
            }}
          >
            Suggested for you
          </Typography>
          
          {suggestedLoading ? (
            <Box 
              sx={{ 
                display: 'flex', 
                gap: 3, 
                overflowX: 'auto',
                pb: 2,
                '&::-webkit-scrollbar': {
                  height: 8,
                },
                '&::-webkit-scrollbar-track': {
                  bgcolor: 'grey.200',
                  borderRadius: 4,
                },
                '&::-webkit-scrollbar-thumb': {
                  bgcolor: 'grey.400',
                  borderRadius: 4,
                  '&:hover': {
                    bgcolor: 'grey.500',
                  },
                },
              }}
            >
              {[...Array(6)].map((_, index) => (
                <Box key={index} sx={{ minWidth: { xs: 280, sm: 300, md: 320 }, height: 400 }}>
                  <Skeleton 
                    variant="rectangular" 
                    width="100%" 
                    height="85%" 
                    sx={{ borderRadius: 2, mb: 1 }} 
                  />
                  <Skeleton variant="text" width="80%" height={24} />
                  <Skeleton variant="text" width="60%" height={20} />
                </Box>
              ))}
            </Box>
          ) : (
            <Box 
              sx={{ 
                display: 'flex', 
                gap: 3, 
                overflowX: 'auto',
                pb: 2,
                '&::-webkit-scrollbar': {
                  height: 8,
                },
                '&::-webkit-scrollbar-track': {
                  bgcolor: 'grey.200',
                  borderRadius: 4,
                },
                '&::-webkit-scrollbar-thumb': {
                  bgcolor: 'grey.400',
                  borderRadius: 4,
                  '&:hover': {
                    bgcolor: 'grey.500',
                  },
                },
              }}
            >
              {suggestedProducts.map((suggestedProduct) => (
                <Box 
                  key={suggestedProduct.id}
                  sx={{ 
                    minWidth: { xs: 280, sm: 300, md: 320 },
                    flexShrink: 0
                  }}
                >
                  <ProductCard 
                    product={suggestedProduct}
                    onWishlistChange={(productId, isWished) => {
                      // Update suggested products wishlist state if needed
                      setSuggestedProducts(prev => 
                        prev.map(p => p.id === productId ? {...p, isWished} : p)
                      );
                    }}
                  />
                </Box>
              ))}
            </Box>
          )}
        </Container>
      </Box>
    )}
  </>
  );
};

export default function PreCheckoutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PreCheckout />
    </Suspense>
  );
}