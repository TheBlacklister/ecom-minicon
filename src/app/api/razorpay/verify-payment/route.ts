import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

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
    const { user, supabase, error } = await getUser(request);
    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderDetails
    } = await request.json();

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing payment verification parameters' },
        { status: 400 }
      );
    }

    // Verify payment signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error('Payment signature verification failed:', {
        expected: expectedSignature,
        received: razorpay_signature
      });
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Payment verified successfully
    console.log('Payment verified successfully:', {
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      user_id: user.id
    });

    // Here you can:
    // 1. Save payment details to your database
    // 2. Update order status
    // 3. Send confirmation emails
    // 4. Clear cart

    if (orderDetails) {
      try {
        // Save order to database (compatible with current schema)
        const orderData: any = {
          user_id: user.id,
          order_number: orderDetails.orderId || `RZP_${Date.now()}`,
          status: 'paid',
          payment_mode: 'razorpay',
          total_amount: orderDetails.total,
          subtotal: orderDetails.subtotal,
          shipping: orderDetails.shipping || 0,
          taxes: orderDetails.taxes || 0,
          coupon_discount: orderDetails.couponDiscount || 0,
          coupon_code: orderDetails.selectedCoupon?.code || null,
          shipping_address: orderDetails.selectedAddress
        };

        // Only add Razorpay fields if columns exist (check will be added later)
        // For now, we'll store them in the order_number as a reference
        orderData.order_number = `${orderDetails.orderId}_${razorpay_payment_id}`;

        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert(orderData)
          .select()
          .single();

        if (orderError) {
          console.error('Error saving order:', orderError);
          // Payment was successful but order save failed
          // You should handle this case appropriately
        } else {
          // Create order items
          if (orderDetails.cartItems && orderDetails.cartItems.length > 0) {
            const orderItems = orderDetails.cartItems.map((item: any) => ({
              order_id: order.id,
              product_id: item.product.id,
              quantity: item.quantity,
              price: item.product.price_after,
              selected_size: item.selected_size
            }));

            await supabase.from('order_items').insert(orderItems);
          }

          // Clear cart after successful order
          await supabase
            .from('cart')
            .delete()
            .eq('user_id', user.id);
        }
      } catch (dbError) {
        console.error('Database error after payment verification:', dbError);
        // Payment was successful but database operations failed
        // Log this for manual intervention
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      payment: {
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id
      }
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}