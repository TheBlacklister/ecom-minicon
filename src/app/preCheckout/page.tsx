"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Product } from '@/types';
import Image from "next/image";
import { Typography, Button, Box, Accordion, AccordionSummary, AccordionDetails, IconButton } from "@mui/material";
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import FavoriteIcon from '@mui/icons-material/Favorite';
import Input from '@mui/material/Input';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '../components/AuthProvider';

const PRODUCT_DESCRIPTION = [
  "100% Super Combed Cotton",
  "Pre Shrunk",
  "Bio Washed",
  "Lycra Ribbed Neck",
  "Oversized Fit",
  "wash care :",
  "Machine wash cold, inside-out,",
  "gentle cycle with mild detergent.",
  "Made in India"
];

const PreCheckout = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = searchParams.get("id");
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = React.useState('');
  const [quantity, setQuantity] = React.useState(1);
  const [pincode, setPincode] = React.useState("");
  const [isWished, setIsWished] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return;
      try {
        const res = await fetch('/api/products');
        const data: Product[] = await res.json();
        const prod = data.find(p => p.id === Number(id)) || null;
        setProduct(prod || null);
        if (prod) setSelectedSize(prod.available_sizes[0] || '');
      } catch (error) {
        console.error('Error fetching product:', error);
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

  if (!product) {
    return <Typography color="error">Product not found</Typography>;
  }

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
      {/* Product Image with banner */}
      <Box
        sx={{
          position: 'relative',
          width: { xs: '100%', md: '38vw' },
          minWidth: 220,
          aspectRatio: '4/5',
          bgcolor: 'white',
          borderRadius: 3,
          overflow: 'hidden',
          flexShrink: 0,
          alignSelf: { md: 'flex-start' },
          mb: { xs: 2, md: 0 },
        }}
      >
        <Image
          src={product.images[0]}
          alt={product.title}
          fill
          style={{ objectFit: 'contain' }}
          sizes="(max-width: 600px) 100vw, 50vw"
        />
        {/* Banner overlay */}
       
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
          <Typography sx={{ fontSize: "2.1rem", fontWeight: 700, fontFamily: 'Futura, sans-serif' }}>
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
        <Typography sx={{ fontSize: "1.2rem", mb: 1, fontFamily: 'Futura, sans-serif', color: '#555' }}>
          {product.subtitle}
        </Typography>
        {/* Price and Quantity */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Typography sx={{ fontSize: "1.6rem", fontWeight: 600, fontFamily: 'Futura, sans-serif', color: '#222' }}>
            ₹{product.price_after}
          </Typography>
          <Select
            value={quantity}
            onChange={e => setQuantity(Number(e.target.value))}
            size="small"
            sx={{ minWidth: 60, fontFamily: 'Futura, sans-serif', fontWeight: 500 }}
          >
            {[...Array(10)].map((_, i) => (
              <MenuItem key={i + 1} value={i + 1}>{i + 1}</MenuItem>
            ))}
          </Select>
        </Box>
        {/* Size Buttons */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} mb={1} sx={{ fontFamily: 'Futura, sans-serif' }}>
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
                fontFamily: 'Futura, sans-serif',
                bgcolor: selectedSize === s ? '#ffeaea' : 'white',
                boxShadow: selectedSize === s ? 2 : 0,
              }}
            >
              {s}
            </Button>
          ))}
          <Typography variant="body2" sx={{ ml: 1, color: '#1976d2', display: 'inline', fontFamily: 'Futura, sans-serif', cursor: 'pointer' }}>
            Notify Me
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
              fontFamily: 'Futura, sans-serif',
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
              fontFamily: 'Futura, sans-serif',
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
          <Typography variant="body2" sx={{ fontFamily: 'Futura, sans-serif', color: '#888' }}>Share</Typography>
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
            sx={{ fontFamily: 'Futura, sans-serif', fontSize: 15, width: 160 }}
          />
          <Button variant="outlined" color="primary" sx={{ fontFamily: 'Futura, sans-serif', fontWeight: 600 }}>
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
              <Typography variant="subtitle1" fontWeight={700} sx={{ fontFamily: 'Futura, sans-serif' }}>
                DESCRIPTION
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {PRODUCT_DESCRIPTION.map((line, idx) => (
                  <li key={idx} style={{ marginBottom: 3 }}>
                    <Typography variant="body2" color="black" sx={{ fontFamily: 'Futura, sans-serif' }}>
                      {line}
                    </Typography>
                  </li>
                ))}
              </ul>
            </AccordionDetails>
          </Accordion>
        </Box>
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
