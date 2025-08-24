// app/api/qikink/create-order/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  console.log('🚀 Starting Qikink order creation process...');
  
  try {
    // Step 1: Get the authentication token
    console.log('🔑 Step 1: Retrieving authentication token...');
    
    const clientId = process.env.QIKINK_CLIENT_ID!;
    const clientSecret = process.env.QIKINK_CLIENT_SECRET!;
    const baseUrl = process.env.QIKINK_BASE_URL!;
    
    console.log('📋 Environment variables check:', {
      clientId: clientId ? `${clientId.substring(0, 4)}***` : 'MISSING',
      clientSecret: clientSecret ? `${clientSecret.substring(0, 4)}***` : 'MISSING',
      baseUrl: baseUrl || 'MISSING'
    });

    if (!clientId || !clientSecret || !baseUrl) {
      console.error('❌ Missing required environment variables');
      return NextResponse.json(
        { error: 'Server configuration error: Missing required environment variables' }, 
        { status: 500 }
      );
    }
    
    const tokenParams = new URLSearchParams({ 
      ClientId: clientId, 
      client_secret: clientSecret 
    });

    // Remove trailing slash from baseUrl to avoid double slashes
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const tokenUrl = `${cleanBaseUrl}/api/token`;
    console.log('🌐 Making token request to:', tokenUrl);
    console.log('📤 Token request params:', { ClientId: clientId });

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams
    });
    
    console.log('📥 Token response status:', tokenResponse.status);
    console.log('📥 Token response headers:', Object.fromEntries(tokenResponse.headers.entries()));
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('❌ Token request failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorData
      });
      return NextResponse.json(
        { error: errorData.error || 'Authentication failed' }, 
        { status: 500 }
      );
    }
    
    const tokenData = await tokenResponse.json();
    console.log('📥 Token response data:', { 
      ...tokenData, 
      token: tokenData.token ? `${tokenData.token.substring(0, 10)}***` : 'MISSING' 
    });
    
    const accessToken = tokenData.token || tokenData.Accesstoken;
    
    if (!accessToken) {
      console.error('❌ No access token found in response');
      return NextResponse.json(
        { error: 'Authentication failed: No token received' }, 
        { status: 500 }
      );
    }
    
    console.log('✅ Step 1 completed: Token obtained successfully');
    
    // Step 2: Use the token to create the order
    console.log('📦 Step 2: Creating order with Qikink...');
    
    const orderPayload = await req.json();
    console.log('📤 Order payload received:', JSON.stringify(orderPayload, null, 2));
    
    // Step 2.5: Try different approaches to get valid SKU
    console.log('🔍 Step 2.5: Attempting to find valid SKU format...');
    
    // Option 1: Try with search_from_my_products=0 first to test standard SKUs
    if (orderPayload.line_items && orderPayload.line_items[0]) {
      const testItem = { ...orderPayload.line_items[0] };
      testItem.search_from_my_products = 0;
      testItem.sku = "UOsMRnHs-Wh-S"; // Standard Qikink SKU
      testItem.designs = [{
        "design_url": "https://example.com/design.png",
        "position": "front"
      }];
      
      console.log('🧪 Testing with standard Qikink SKU and search_from_my_products=0:', testItem);
      
      const testPayload = {
        ...orderPayload,
        line_items: [testItem],
        order_number: orderPayload.order_number + "_test"
      };
      
      try {
        console.log('🌐 Making test order request...');
        const testResponse = await axios.post(`${cleanBaseUrl}/api/order/create`, testPayload, { 
          headers: { 
            'ClientId': clientId, 
            'Accesstoken': accessToken,
            'Content-Type': 'application/json' 
          }
        });
        console.log('✅ Test order succeeded! Standard SKU format works');
        console.log('📥 Test response:', testResponse.data);
      } catch (testError: any) {
        console.log('❌ Test order failed with standard SKU');
        if (testError.response) {
          console.log('❌ Test error:', testError.response.data);
        }
      }
    }

    // Validate and fix line items
    if (orderPayload.line_items && orderPayload.line_items.length > 0) {
      console.log('🔍 Validating and fixing line items...');
      orderPayload.line_items.forEach((item: any, index: number) => {
        console.log(`📦 Line item ${index + 1} BEFORE fixes:`, JSON.stringify(item, null, 2));
        
        // Fix common issues
        if (typeof item.quantity === 'string') {
          item.quantity = parseInt(item.quantity);
          console.log(`🔧 Fixed quantity to number: ${item.quantity}`);
        }
        
        if (typeof item.price === 'string') {
          item.price = parseFloat(item.price);
          console.log(`🔧 Fixed price to number: ${item.price}`);
        }
        
        // Ensure search_from_my_products is number
        if (typeof item.search_from_my_products === 'string') {
          item.search_from_my_products = parseInt(item.search_from_my_products);
          console.log(`🔧 Fixed search_from_my_products to number: ${item.search_from_my_products}`);
        }
        
        // For search_from_my_products=1, remove any design fields that might conflict
        if (item.search_from_my_products === 1) {
          console.log(`ℹ️ Line item ${index + 1} uses pre-saved product from Qikink account`);
          console.log(`🔍 SKU being used: "${item.sku}" (length: ${item.sku.length})`);
          
          // Remove conflicting fields for pre-saved products
          delete item.designs;
          delete item.design_url;
          delete item.front_design;
          delete item.back_design;
          console.log(`🔧 Removed design fields for pre-saved product`);
        }
        
        console.log(`📦 Line item ${index + 1} AFTER fixes:`, JSON.stringify(item, null, 2));
      });
      
      // Fix other payload issues
      if (typeof orderPayload.qikink_shipping === 'string') {
        orderPayload.qikink_shipping = parseInt(orderPayload.qikink_shipping);
        console.log(`🔧 Fixed qikink_shipping to number: ${orderPayload.qikink_shipping}`);
      }
      
      if (typeof orderPayload.total_order_value === 'string') {
        orderPayload.total_order_value = parseFloat(orderPayload.total_order_value);
        console.log(`🔧 Fixed total_order_value to number: ${orderPayload.total_order_value}`);
      }
      
      console.log('📤 FINAL ORDER PAYLOAD:', JSON.stringify(orderPayload, null, 2));
    }
    
    const orderUrl = `${cleanBaseUrl}/api/order/create`;
    const headers = { 
      'ClientId': clientId, 
      'Accesstoken': accessToken,
      'Content-Type': 'application/json' 
    };
    
    console.log('🌐 Making order request to:', orderUrl);
    console.log('📤 Order request headers:', { 
      ...headers, 
      Accesstoken: `${accessToken.substring(0, 10)}***` 
    });
    
    const orderResponse = await axios.post(orderUrl, orderPayload, { headers });
    
    console.log('📥 Order response status:', orderResponse.status);
    console.log('📥 Order response data:', orderResponse.data);
    console.log('✅ Step 2 completed: Order created successfully');
    
    const response = { 
      success: true, 
      order: orderResponse.data 
    };
    
    console.log('🎉 Qikink order creation completed successfully');
    console.log('📤 Final response:', JSON.stringify(response, null, 2));
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('💥 Qikink order creation error occurred:');
    console.error('Error name:', error?.constructor?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    
    if (error.response) {
      console.error('HTTP Error Response:');
      console.error('- Status:', error.response.status);
      console.error('- Status Text:', error.response.statusText);
      console.error('- Headers:', error.response.headers);
      console.error('- Data:', error.response.data);
    }
    
    if (error.request) {
      console.error('Request Error:');
      console.error('- Request:', error.request);
    }
    
    console.error('Full error object:', error);
    
    const errorData = error.response?.data;
    let errorMessage = 'Failed to create order';
    let helpMessage = '';
    
    if (errorData?.error === 'Invalid SKU') {
      errorMessage = 'Invalid SKU provided';
      helpMessage = 'The SKU you provided is not valid in Qikink. Please check: 1) If search_from_my_products=1, ensure the SKU exists in your Qikink account. 2) If search_from_my_products=0, use a valid Qikink product SKU and provide design information. 3) Common valid SKUs: TSHIRT-BLK-S, HOODIE-WHT-M, etc.';
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorData || error.message,
        help: helpMessage || undefined,
        timestamp: new Date().toISOString()
      }, 
      { status: error.response?.status || 500 }
    );
  }
}