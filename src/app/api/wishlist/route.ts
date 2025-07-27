import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

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
  const { user, supabase, error } = await getUser(request)
  if (error || !user) {
    return NextResponse.json({ error: error?.message ?? 'Not authenticated' }, { status: 401 })
  }

  const productId = request.nextUrl.searchParams.get('productId')
  if (productId) {
    const { data, error: dbError } = await supabase
      .from('wishlist')
      .select('product_id')
      .eq('user_id', user.id)
      .eq('product_id', Number(productId))
      .maybeSingle()
    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }
    // Return isWished status for the ProductCard component
    return NextResponse.json({ isWished: !!data })
  }

  const { data, error: dbError } = await supabase
    .from('wishlist')
    .select('product_id, product:products(*)')
    .eq('user_id', user.id)

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }
  
  // Filter out any items where product is null
  const validWishlistItems = data?.filter(item => item.product !== null) || []
  
  return NextResponse.json(validWishlistItems)
}

export async function POST(request: NextRequest) {
  const { user, supabase, error } = await getUser(request)
  if (error || !user) {
    return NextResponse.json({ error: error?.message ?? 'Not authenticated' }, { status: 401 })
  }

  const { productId } = await request.json()

  const { data, error: dbError } = await supabase
    .from('wishlist')
    .insert({ user_id: user.id, product_id: productId })
    .select()
    .single()

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const { user, supabase, error } = await getUser(request)
  if (error || !user) {
    return NextResponse.json({ error: error?.message ?? 'Not authenticated' }, { status: 401 })
  }

  const { productId } = await request.json()

  const { error: dbError } = await supabase
    .from('wishlist')
    .delete()
    .eq('user_id', user.id)
    .eq('product_id', productId)

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}