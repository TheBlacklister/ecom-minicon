import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
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
    console.log("tokenUrl", tokenUrl);

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

    // Get query parameters for filtering orders
    const { searchParams } = new URL(request.url);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const id = searchParams.get('id');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const fromDate = searchParams.get('from_date');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const toDate = searchParams.get('to_date');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const pageNo = searchParams.get('page_no');

    // Build orders API URL with query parameters
    // Start with base URL without any parameters to avoid SQL errors
    const ordersUrl = `${cleanBaseUrl}/api/order`;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const queryParams = [];

   
    console.log("ordersUrl", ordersUrl);

    // Fetch orders from Qikink API
    const ordersResponse = await fetch(ordersUrl, {
      method: 'GET',
      headers: {
        'ClientId': tokenData.ClientId,
        'Accesstoken': tokenData.Accesstoken,
        'Content-Type': 'application/json'
      }
    });

    if (!ordersResponse.ok) {
      const errorData = await ordersResponse.json();
      console.error('❌ Orders fetch failed:', errorData);
      return NextResponse.json(
        { error: errorData.error || 'Orders fetch failed' },
        { status: 500 }
      );
    }

    const ordersResult = await ordersResponse.json();
    console.log("ORDERS FETCHED:", ordersResult);

    return NextResponse.json({
      success: true,
      token: tokenData,
      orders: ordersResult
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}