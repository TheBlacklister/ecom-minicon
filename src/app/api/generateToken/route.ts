// app/api/qikink/create-order/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Receive and console the payload from cart page
    const cartPayload = await request.json();
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
    console.log('📦 CART PAYLOAD RECEIVED:', cartPayload);

    const tokenData = await tokenResponse.json();
    console.log("TOKEN RESPONSE", tokenData);
    
    // Split the name by first whitespace to get first and last name
    const fullName = cartPayload.selectedAddress.name;
    const nameParts = fullName.split(' ', 2); // Split by first whitespace, limit to 2 parts
    const firstName = nameParts[0] || '';
    const lastName = nameParts[1] || '';
    // Transform cartItems to line_items format
    const line_items = cartPayload.cartItems.flatMap((item: any) =>
        Array.from({ length: item.quantity }, () => ({
            search_from_my_products: 1,
            quantity: "1",
            price: item.product.price_after.toString(),
            sku: item.product.sku[item.selected_size],
        }))
    );
    console.log('line_items',line_items)

    // Create order with proper typing and structure
    const orderPayload ={
    "order_number": cartPayload.orderId,
    "qikink_shipping": "1",
    "gateway": "COD",
    "total_order_value": cartPayload.total,
    "line_items": line_items,
  //   "add_ons":[
  //     {
  //         "box_packing":1,
  //         "gift_wrap":0,
  //         "rush_order":1,
  //     }
  // ],
   
    "shipping_address": {
        "first_name": firstName,
        "last_name": lastName,
        "address1": cartPayload.selectedAddress.line1,
        "phone":cartPayload.selectedAddress.phone,
        "email": cartPayload.userEmail,
        "city":cartPayload.selectedAddress.city,
        "zip":cartPayload.selectedAddress.pincode,
        "province":cartPayload.selectedAddress.state,
        "country_code":"IN"
    }}
console.log("PAYLOADDDD",orderPayload)
    const orderResponse = await fetch(`${cleanBaseUrl}/api/order/create`, {
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