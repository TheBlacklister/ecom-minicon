'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '../AuthProvider';

interface CountContextType {
  cartCount: number;
  wishlistCount: number;
  updateCartCount: () => Promise<void>;
  updateWishlistCount: () => Promise<void>;
  incrementCartCount: () => void;
  decrementCartCount: () => void;
  incrementWishlistCount: () => void;
  decrementWishlistCount: () => void;
}

const CountContext = createContext<CountContextType | undefined>(undefined);

export function CountProvider({ children }: { children: ReactNode }) {
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const { user } = useAuth();

  // Fetch cart count from API
  const updateCartCount = useCallback(async () => {
    if (!user) {
      setCartCount(0);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session) headers['Authorization'] = `Bearer ${session.access_token}`;

      const response = await fetch('/api/cart', { headers });
      if (response.ok) {
        const cartItems = await response.json();
        const totalCount = cartItems.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
        setCartCount(totalCount);
      }
    } catch (error) {
      console.error('Error fetching cart count:', error);
      setCartCount(0);
    }
  }, [user]);

  // Fetch wishlist count from API
  const updateWishlistCount = useCallback(async () => {
    if (!user) {
      setWishlistCount(0);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session) headers['Authorization'] = `Bearer ${session.access_token}`;

      const response = await fetch('/api/wishlist', { headers });
      if (response.ok) {
        const wishlistItems = await response.json();
        setWishlistCount(wishlistItems.length);
      }
    } catch (error) {
      console.error('Error fetching wishlist count:', error);
      setWishlistCount(0);
    }
  }, [user]);

  // Optimistic updates for better UX
  const incrementCartCount = () => setCartCount(prev => prev + 1);
  const decrementCartCount = () => setCartCount(prev => Math.max(0, prev - 1));
  const incrementWishlistCount = () => setWishlistCount(prev => prev + 1);
  const decrementWishlistCount = () => setWishlistCount(prev => Math.max(0, prev - 1));

  // Update counts when user changes
  useEffect(() => {
    if (user) {
      updateCartCount();
      updateWishlistCount();
    } else {
      setCartCount(0);
      setWishlistCount(0);
    }
  }, [user, updateCartCount, updateWishlistCount]);

  const value = {
    cartCount,
    wishlistCount,
    updateCartCount,
    updateWishlistCount,
    incrementCartCount,
    decrementCartCount,
    incrementWishlistCount,
    decrementWishlistCount,
  };

  return (
    <CountContext.Provider value={value}>
      {children}
    </CountContext.Provider>
  );
}

export function useCount() {
  const context = useContext(CountContext);
  if (context === undefined) {
    throw new Error('useCount must be used within a CountProvider');
  }
  return context;
}