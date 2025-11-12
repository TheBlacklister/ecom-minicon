import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

async function getUser(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return { user: null, supabase: null, error: new Error('Auth session missing!') };
  }
  const supabase = createSupabaseServerClient(token);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { user: null, supabase: null, error };
  }
  return { user: data.user, supabase, error: null };
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getUser(request);
    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const {
      amount,
      currency = 'INR',
      orderDetails
    } = await request.json();

    // Validate amount (minimum ₹1)
    if (!amount || amount < 100) {
      return NextResponse.json(
        { error: 'Invalid amount. Minimum amount is ₹1' },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(amount), // Amount in paise
      currency,
      receipt: `order_${Date.now()}_${user.id.slice(-8)}`,
      notes: {
        user_id: user.id,
        user_email: user.email || '',
        order_source: 'minicon_cart',
        ...(orderDetails && { order_details: JSON.stringify(orderDetails) })
      }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
        status: razorpayOrder.status
      }
    });

  } catch (error) {
    console.error('Razorpay order creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}