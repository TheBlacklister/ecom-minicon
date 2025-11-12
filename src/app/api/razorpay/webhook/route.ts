import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

// Create a service role Supabase client for webhook operations
const supabaseService = createSupabaseServerClient(process.env.SUPABASE_SERVICE_KEY!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('Webhook signature verification failed');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);

    console.log('Razorpay webhook event:', event.event);

    // Handle different webhook events
    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity);
        break;

      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity);
        break;

      case 'order.paid':
        await handleOrderPaid(event.payload.order.entity);
        break;

      default:
        console.log(`Unhandled webhook event: ${event.event}`);
    }

    return NextResponse.json({ status: 'ok' });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentCaptured(payment: any) {
  try {
    console.log('Payment captured:', payment.id);

    // Update order status in database (using order_number which contains payment_id)
    const { error } = await supabaseService
      .from('orders')
      .update({
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .like('order_number', `%${payment.id}`);

    if (error) {
      console.error('Error updating order status:', error);
    }

  } catch (error) {
    console.error('Error handling payment captured:', error);
  }
}

async function handlePaymentFailed(payment: any) {
  try {
    console.log('Payment failed:', payment.id);

    // Update order status in database (using order_number which contains payment_id)
    const { error } = await supabaseService
      .from('orders')
      .update({
        status: 'payment_failed',
        updated_at: new Date().toISOString()
      })
      .like('order_number', `%${payment.id}`);

    if (error) {
      console.error('Error updating failed payment status:', error);
    }

  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

async function handleOrderPaid(order: any) {
  try {
    console.log('Order paid:', order.id);

    // Additional processing for paid orders
    // You can add custom logic here like sending emails, updating inventory, etc.

  } catch (error) {
    console.error('Error handling order paid:', error);
  }
}