import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

// Orders API route for managing user orders
async function getUser(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) {
    return { user: null, supabase: null, error: new Error('Auth session missing!') }
  }
  const supabase = createSupabaseServerClient(token)
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    return { user: null, supabase: null, error }
  }
  return { user: data.user, supabase, error: null }
}

export async function POST(request: NextRequest) {
  try {
    const { user, supabase, error } = await getUser(request)
    if (error || !user) {
      return NextResponse.json({ error: error?.message ?? 'Not authenticated' }, { status: 401 })
    }

    const {
      qikink_order_id,
      order_number,
      payment_mode,
      total_amount,
      subtotal,
      shipping,
      taxes,
      coupon_discount,
      coupon_code,
      shipping_address,
      cart_items
    } = await request.json();

    // Validate required fields
    if (!qikink_order_id || !order_number || !total_amount || !cart_items || cart_items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        qikink_order_id,
        order_number,
        status: 'pending',
        payment_mode,
        total_amount,
        subtotal,
        shipping: shipping || 0,
        taxes: taxes || 0,
        coupon_discount: coupon_discount || 0,
        coupon_code,
        shipping_address
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // Create order items
    const orderItems = cart_items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      price: item.product.price_after,
      selected_size: item.selected_size
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Delete the order if items creation failed
      await supabase.from('orders').delete().eq('id', order.id);
      return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        qikink_order_id: order.qikink_order_id,
        order_number: order.order_number,
        status: order.status,
        total_amount: order.total_amount
      }
    });

  } catch (error) {
    console.error('Error in orders API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user, supabase, error } = await getUser(request)
    if (error || !user) {
      return NextResponse.json({ error: error?.message ?? 'Not authenticated' }, { status: 401 })
    }

    // Get user's orders with order items and product details
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          product:products (*)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    return NextResponse.json(orders);

  } catch (error) {
    console.error('Error in orders API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}