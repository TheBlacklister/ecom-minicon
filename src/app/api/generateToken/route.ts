// app/api/qikink/create-order/route.ts
import {  NextResponse } from 'next/server';

export async function POST() {
  try {
    const clientId = process.env.QIKINK_CLIENT_ID!;
    const clientSecret = process.env.QIKINK_CLIENT_SECRET!;
    const baseUrl = process.env.QIKINK_BASE_URL!;

    if (!clientId || !clientSecret || !baseUrl) {
      console.error('❌ Missing required environment variables');
      return NextResponse.json(
        { error: 'Server configuration error: Missing required environment variables' }, 
        { status: 500 }
      );
    }
    
    // Get access token
    const tokenParams = new URLSearchParams({ 
      ClientId: clientId, 
      client_secret: clientSecret 
    });

    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const tokenUrl = `${cleanBaseUrl}/api/token`;
    console.log("tokenUrl",tokenUrl)

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString()
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      return NextResponse.json(
        { error: errorData.error || 'Authentication failed' }, 
        { status: 500 }
      );
    }
    
    const tokenData = await tokenResponse.json();
    console.log("TOKEN RESPONSE", tokenData);

    // Create order with proper typing and structure
    const orderPayload ={
    "order_number": "api2",
    "qikink_shipping": "1",
    "gateway": "COD",
    "total_order_value": "1",
    "line_items": [
        {
            "search_from_my_products": 0, 
            "quantity": "1",
            "print_type_id":1,
            "price":"1",
            "sku": "USuRnHs-Lv-S",
            
        }
    ],
   
    "shipping_address": {
        "first_name": "first_name",
        "last_name": "last_name",
        "address1": "adrress_1...",
        "phone":"9876543210",
        "email": "sample@gmail.com",
        "city":"coimbatore",
        "zip":"641004",
        "province":"ABC",
        "country_code":"IN"
    }}

    const orderResponse = await fetch("https://api.qikink.com/api/order/create", {
      method: 'POST',
      headers: {
        'ClientId': tokenData.ClientId,
        'Accesstoken': tokenData.Accesstoken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderPayload)
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json();
      console.error('❌ Order creation failed:', errorData);
      return NextResponse.json(
        { error: errorData.error || 'Order creation failed' }, 
        { status: 500 }
      );
    }

    const orderResult = await orderResponse.json();
    console.log("ORDER CREATED:", orderResult);

    return NextResponse.json({
      success: true,
      token: tokenData,
      order: orderResult
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}