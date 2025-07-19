'use client';

import { useEffect, useState } from 'react';
import {  Typography, Container } from '@mui/material';
import { supabase } from '@/lib/supabaseClient';
import { ProductCard } from '../productCard';
import type { Product } from '@/types';
import { GridLegacy as Grid } from '@mui/material';


interface WishlistApiItem {
  product: Product;
}

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<Product[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const headers: Record<string, string> = {};
      if (session) headers['Authorization'] = `Bearer ${session.access_token}`;
      fetch('/api/wishlist', { headers })
        .then(res => res.ok ? res.json() : [])
        .then((data: WishlistApiItem[]) => setWishlist(data.map((w) => w.product)));
    });
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 5, bgcolor: '#fff', minHeight: '100vh' }}>
      <Typography
        color="black"
        variant="h4"
        fontWeight={700}
        mb={4}
        align="center"
        fontFamily="'Montserrat', sans-serif"
      >
        Your Wishlist
      </Typography>

      {wishlist.length === 0 ? (
        <Typography align="center" color="text.secondary" fontFamily="'Montserrat', sans-serif">
          Your wishlist is empty!
        </Typography>
      ) : (
        <Grid container spacing={2} justifyContent="center">
          {wishlist.map((item) => (
            <Grid key={item.id} item xs={12} sm={6} md={4} lg={3} sx={{ display: 'flex', justifyContent: 'center' }}>
              <ProductCard product={item} initialIsWished={true} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}