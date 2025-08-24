import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for server-side auth verification
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Rate limiting: Qikink allows 30 requests per minute
let lastOrderRequest = 0;
const RATE_LIMIT_DELAY = 2000; // 2 seconds between requests

interface QikinkOrderRequest {
  order_number: string;
  qikink_shipping: number;
  gateway: string;
  total_order_value: string;
  line_items: Array<{
    search_from_my_products: number;
    quantity: string;
    sku: string;
    print_type_id?: number;
    designs?: Array<{
      design_code: string;
      width_inches: number;
      height_inches: number;
      placement_sku: string;
      design_link: string;
      mockup_link: string;
    }>;
  }>;
  shipping_address: {
    first_name: string;
    last_name: string;
    address1: string;
    address2?: string;
    phone: string;
    email: string;
    city: string;
    province: string;
    zip: string;
    country_code: string;
  };
  add_ons?: Array<{
    box_packing?: number;
    gift_wrap?: number;
    rush_order?: number;
    custom_letter?: string;
  }>;
}

interface QikinkOrderResponse {
  status_code: string;
  message: string;
  order_id?: number;
  order_number?: string;
  error?: string;
  details?: any;
}

async function rateLimitedFetch(url: string, options: RequestInit, retries = 3): Promise<Response> {
  // Enforce rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - lastOrderRequest;
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
  }
  lastOrderRequest = Date.now();

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // Handle rate limiting response
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
        console.log(`🚦 Rate limited. Waiting ${delay}ms before retry ${attempt}/${retries}`);
        
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      return response;
    } catch (error) {
      if (attempt === retries) throw error;
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`🔄 Request failed. Retrying in ${delay}ms. Attempt ${attempt}/${retries}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
}

async function createQikinkOrder(orderData: QikinkOrderRequest, accessToken: string): Promise<QikinkOrderResponse> {
  console.log('📦 Creating Qikink order...');
  console.log('📤 Order data:', JSON.stringify(orderData, null, 2));
  console.log('🔐 Using token:', `${accessToken.substring(0, 10)}***`);
  
  const orderUrl = `${process.env.QIKINK_BASE_URL}/api/order/create`;
  console.log('🌐 Making order request to:', orderUrl);

  const response = await rateLimitedFetch(orderUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ClientId': process.env.QIKINK_CLIENT_ID!,
      'Accesstoken': accessToken
    },
    body: JSON.stringify(orderData)
  });

  console.log('📥 Order response status:', response.status);
  console.log('📥 Order response headers:', Object.fromEntries(response.headers.entries()));

  const data: QikinkOrderResponse = await response.json();
  console.log('📥 Order response data:', data);

  if (!response.ok) {
    console.error('❌ Order creation failed:', data);
    throw new Error(data.error || `Failed to create Qikink order. Status: ${response.status}`);
  }
  
  console.log('✅ Order created successfully');
  return data;
}

export async function POST(req: NextRequest) {
  console.log('🚀 Creating Qikink order...');
  
  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const userToken = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(userToken);
    
    if (authError || !user) {
      console.error('🔒 Authentication failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.email);
    
    const body = await req.json();
    const { orderData, qikinkToken } = body;
    
    if (!orderData || !qikinkToken) {
      return NextResponse.json({ 
        error: 'Missing required fields: orderData and qikinkToken are required' 
      }, { status: 400 });
    }
    
    console.log('📦 Creating order with Qikink...');
    const orderResult = await createQikinkOrder(orderData, qikinkToken);
    
    // TODO: Save order details to Supabase orders table
    // const { data: orderRecord, error: dbError } = await supabase
    //   .from('orders')
    //   .insert({
    //     user_id: user.id,
    //     order_number: orderData.order_number,
    //     qikink_order_id: orderResult.order_id,
    //     status: 'processing',
    //     total_amount: parseFloat(orderData.total_order_value),
    //     order_data: orderData,
    //     qikink_response: orderResult
    //   })
    //   .select()
    //   .single();
    
    const response = { 
      success: true,
      message: 'Order created successfully',
      qikinkOrderId: orderResult.order_id,
      orderNumber: orderResult.order_number || orderData.order_number,
      qikinkResponse: orderResult
    };
    
    console.log('🎉 Order creation completed successfully');
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('💥 Qikink order creation error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create order',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }, 
      { status: 500 }
    );
  }
}