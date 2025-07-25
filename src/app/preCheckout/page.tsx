"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Product } from '@/types';
import Image from "next/image";
import { Typography, Button, Box, Accordion, AccordionSummary, AccordionDetails, IconButton, Dialog, DialogContent, CircularProgress } from "@mui/material";
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Input from '@mui/material/Input';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '../components/AuthProvider';

const PreCheckout = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = searchParams.get("id");
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true); // Add loading state
  const [selectedSize, setSelectedSize] = React.useState('');
  const [quantity, setQuantity] = React.useState(1);
  const [pincode, setPincode] = React.useState("");
  const [isWished, setIsWished] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);

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
        console.log("CURRENT PRODUCT", prod, product);
        if (prod) setSelectedSize(prod.available_sizes[0] || '');
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  // Check initial wishlist and cart status
  useEffect(() => {
    if (!product || !user) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      const headers: Record<string, string> = {};
      if (session) headers['Authorization'] = `Bearer ${session.access_token}`;
      fetch(`/api/wishlist?productId=${product.id}`, { headers })
        .then(res => res.ok ? res.json() : null)
        .then(data => setIsWished(!!data));
    });
  }, [user, product]);

  // Preload images when product is loaded
  useEffect(() => {
    if (!product || !product.images || product.images.length <= 1) return;

    const formattedImages = product.images.map(formatImagePath);
    const loadedState = new Array(formattedImages.length).fill(false);
    loadedState[0] = true; // First image is loaded by default
  

    // Preload all images
    formattedImages.forEach((src, index) => {
      if (index === 0) return; // Skip first image as it's already loaded
      const img = new window.Image();
      img.src = src;
      img.onload = () => {
    
      };
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
      await fetch('/api/wishlist', { method: 'DELETE', headers, body: JSON.stringify({ product_id: product.id }) });
      setIsWished(false);
    } else {
      await fetch('/api/wishlist', { method: 'POST', headers, body: JSON.stringify({ product_id: product.id }) });
      setIsWished(true);
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
    
    // Add product to cart with buyNow parameter to ensure quantity is set correctly
    await fetch('/api/cart?buyNow=true', {
      method: 'POST',
      headers,
      body: JSON.stringify({ product_id: product.id, quantity: quantity })
    });
    
    // Redirect to cart page with buyNow parameter
    router.push(`/cart?buyNow=${product.id}`);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? formattedImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === formattedImages.length - 1 ? 0 : prev + 1
    );
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentImageIndex(index);
  };

  const handleSizeChartOpen = () => {
    setSizeChartOpen(true);
  };

  const handleSizeChartClose = () => {
    setSizeChartOpen(false);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        gap: { xs: 2, md: 6 },
        padding: { xs: "3vh 4vw", md: "5vh 7vw" },
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
          width: { xs: '100%', md: '38vw' },
          minWidth: 220,
          flexShrink: 0,
          alignSelf: { md: 'flex-start' },
          mb: { xs: 2, md: 0 },
        }}
      >
        {/* Main Image with Navigation */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            aspectRatio: '4/5',
            bgcolor: 'white',
            borderRadius: 3,
            overflow: 'hidden',
            mb: 2,
          }}
          onMouseEnter={() => setIsHoveringImage(true)}
          onMouseLeave={() => setIsHoveringImage(false)}
        >
          {formattedImages.length > 0 ? (
            <>
              {/* Render all images but only show the current one */}
              {formattedImages.map((image, index) => (
                <Box
                  key={index}
                  sx={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    opacity: index === currentImageIndex ? 1 : 0,
                    transition: 'opacity 0.3s ease-in-out',
                    zIndex: index === currentImageIndex ? 1 : 0,
                    bgcolor: 'white', // White background while loading
                  }}
                >
                  <Image
                    src={image}
                    alt={`${product.title} - Image ${index + 1}`}
                    fill
                    style={{ objectFit: 'contain' }}
                    sizes="(max-width: 600px) 100vw, 50vw"
                    priority={index === 0}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    quality={85}
                    placeholder="blur"
                    blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
                  />
                </Box>
              ))}
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
                  zIndex: 2,
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
                  zIndex: 2,
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

        {/* Thumbnail Gallery */}
        {formattedImages.length > 1 && (
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              overflowX: 'auto',
              pb: 1,
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
                  bgcolor: 'white', // White background for thumbnails
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'scale(1.05)',
                  },
                }}
              >
                <Image
                  src={image}
                  alt={`${product.title} - Thumbnail ${index + 1}`}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="80px"
                  quality={70}
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
              color: isWished ? 'red' : 'grey.600',
              padding: 1
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
          <Typography variant="subtitle1" fontWeight={700} mb={1} sx={{ fontFamily: '"Montserrat", sans-serif ' }}>
            Select size
          </Typography>
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
          <Typography 
            variant="body2" 
            onClick={handleSizeChartOpen}
            sx={{ 
              ml: 1, 
              color: '#1976d2', 
              display: 'inline', 
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
        
        {/* Action Buttons */}
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 2,
          alignItems: { sm: 'center' },
        }}>
          <Button
            variant="contained"
            color="error"
            onClick={handleAddToCart}
            sx={{
              width: { xs: '100%', sm: 140 },
              height: 48,
              fontWeight: 700,
              fontFamily: '"Montserrat", sans-serif ',
              mb: { xs: 1, sm: 0 },
              fontSize: 16,
              textTransform: 'none',
              borderRadius: 2,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 'none',
              }
            }}
          >
            Add to Cart
          </Button>
          <Button
            variant="contained"
            onClick={handleBuyNow}
            sx={{
              width: { xs: '100%', sm: 140 },
              height: 48,
              fontWeight: 700,
              fontFamily: '"Montserrat", sans-serif ',
              fontSize: 16,
              textTransform: 'none',
              borderRadius: 2,
              boxShadow: 'none',
              backgroundColor: 'black',
              color: 'white',
              '&:hover': {
                backgroundColor: 'black',
                boxShadow: 'none',
              }
            }}
          >
            Buy Now
          </Button>
        </Box>
        
        {/* Social Share Icons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="body2" sx={{ fontFamily: '"Montserrat", sans-serif ', color: '#888' }}>Share</Typography>
          <WhatsAppIcon sx={{ color: '#25D366', cursor: 'pointer' }} />
          <FacebookIcon sx={{ color: '#4267B2', cursor: 'pointer' }} />
          <InstagramIcon sx={{ color: '#C13584', cursor: 'pointer' }} />
        </Box>
        
        {/* Delivery Details */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Input
            placeholder="Enter Pincode"
            value={pincode}
            onChange={e => setPincode(e.target.value)}
            sx={{ fontFamily: '"Montserrat", sans-serif ', fontSize: 15, width: 160 }}
          />
          <Button variant="outlined" color="primary" sx={{ fontFamily: '"Montserrat", sans-serif ', fontWeight: 600 }}>
            CHECK
          </Button>
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
                    bgcolor: 'white', // White background for size chart
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
                    quality={85}
                    placeholder="blur"
                    blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
                  />
                </Box>
              )}
            </DialogContent>
          </Box>
        </Dialog>
      </Box>
    </Box>
  );
};

export default function PreCheckoutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PreCheckout />
    </Suspense>
  );
}