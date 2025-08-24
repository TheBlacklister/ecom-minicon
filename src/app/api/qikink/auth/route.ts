import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for server-side auth verification
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Rate limiting: Qikink allows 30 requests per minute
let lastTokenRequest = 0;
let cachedToken: { token: string; expiresAt: number } | null = null;
const RATE_LIMIT_DELAY = 2000; // 2 seconds between requests

interface QikinkTokenResponse {
  ClientId: string;
  Accesstoken: string;
  expires_in: number;
}

async function getQikinkToken(): Promise<string> {
  console.log('🔑 Getting Qikink token...');
  
  // Check if we have a valid cached token
  const now = Date.now();
  if (cachedToken && now < cachedToken.expiresAt) {
    console.log('✅ Using cached token');
    return cachedToken.token;
  }
  
  // Enforce rate limiting
  const timeSinceLastRequest = now - lastTokenRequest;
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
  }
  lastTokenRequest = Date.now();
  
  const clientId = process.env.QIKINK_CLIENT_ID;
  const clientSecret = process.env.QIKINK_CLIENT_SECRET;
  const baseUrl = process.env.QIKINK_BASE_URL;
  
  console.log('📋 Environment variables:', {
    clientId: clientId ? `${clientId.substring(0, 4)}***` : 'MISSING',
    clientSecret: clientSecret ? `${clientSecret.substring(0, 4)}***` : 'MISSING',
    baseUrl: baseUrl || 'MISSING'
  });

  if (!clientId || !clientSecret || !baseUrl) {
    throw new Error('Missing required environment variables: QIKINK_CLIENT_ID, QIKINK_CLIENT_SECRET, or QIKINK_BASE_URL');
  }

  const params = new URLSearchParams({ ClientId: clientId, client_secret: clientSecret });
  const tokenUrl = `${baseUrl}/api/token`;
  
  console.log('🌐 Making token request to:', tokenUrl);

  const tokenRes = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });
  
  console.log('📥 Token response status:', tokenRes.status);
  
  const data: QikinkTokenResponse = await tokenRes.json();
  console.log('📥 Token response data:', { ClientId: data.ClientId, expires_in: data.expires_in });
  
  if (!tokenRes.ok) {
    console.error('❌ Token request failed:', data);
    throw new Error((data as any).error || `Failed to get Qikink token. Status: ${tokenRes.status}`);
  }
  
  // Cache the token (expires_in is in seconds)
  cachedToken = {
    token: data.Accesstoken,
    expiresAt: Date.now() + (data.expires_in * 1000) - 60000 // Refresh 1 minute early
  };
  
  console.log('✅ Token obtained and cached successfully');
  return data.Accesstoken;
}

export async function POST(req: NextRequest) {
  console.log('🚀 Getting Qikink access token...');
  
  try {
    // Verify authentication - only authenticated users can get tokens
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('🔒 Authentication failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.email);
    
    const accessToken = await getQikinkToken();
    
    return NextResponse.json({ 
      success: true,
      token: accessToken,
      message: 'Qikink access token retrieved successfully'
    });
    
  } catch (error) {
    console.error('💥 Qikink token error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to get Qikink token',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }, 
      { status: 500 }
    );
  }
}