import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

// Authentication helper function
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

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { user, supabase, error: authError } = await getUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError?.message ?? 'Not authenticated' }, { status: 401 });
    }

    // Fetch user's qikink_order_id values from Supabase orders table
    const { data: orders, error: dbError } = await supabase
      .from('orders')
      .select('qikink_order_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('❌ Database query failed:', dbError);
      return NextResponse.json(
        { error: 'Failed to fetch user orders' },
        { status: 500 }
      );
    }

    // Extract qikink_order_id values into an array
    const qikinkOrderIds = orders
      .map(order => order.qikink_order_id)
      .filter(id => id !== null && id !== undefined);

    console.log(`Found ${qikinkOrderIds.length} orders for user ${user.id}:`, qikinkOrderIds);

    return NextResponse.json({
      success: true,
      qikinkOrderIds: qikinkOrderIds,
      count: qikinkOrderIds.length
    });

  } catch (error) {
    console.error('❌ Unexpected error in getMyOrders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}