'use client';
import { useEffect, useState } from 'react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name?: string;
  description: string;
  order_id: string;
  image?: string;
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

export const useRazorpay = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if Razorpay is already loaded (from layout.tsx script)
    const checkRazorpayLoaded = () => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        setIsLoaded(true);
        return true;
      }
      return false;
    };

    if (checkRazorpayLoaded()) {
      return;
    }

    // If not loaded immediately, check periodically for a short time
    const interval = setInterval(() => {
      if (checkRazorpayLoaded()) {
        clearInterval(interval);
      }
    }, 100);

    // Clear interval after 5 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!window.Razorpay) {
        console.error('Razorpay script failed to load');
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const createOrder = async (amount: number, orderDetails?: any) => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // Get session token for API call - import supabase directly
      const { supabase } = await import('@/lib/supabaseClient');
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to paise
          currency: 'INR',
          orderDetails
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create order');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw error;
    }
  };

  const openPaymentModal = (options: RazorpayOptions) => {
    if (!isLoaded || !window.Razorpay) {
      throw new Error('Razorpay script not loaded');
    }

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  const verifyPayment = async (paymentData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    orderDetails?: any;
  }) => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // Get session token for API call - import supabase directly
      const { supabase } = await import('@/lib/supabaseClient');
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/razorpay/verify-payment', {
        method: 'POST',
        headers,
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Payment verification failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  };

  return {
    isLoaded,
    createOrder,
    openPaymentModal,
    verifyPayment
  };
};