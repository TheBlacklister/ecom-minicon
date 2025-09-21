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
      .from('cart')
      .select('id, quantity, selected_size, product:products(*)')
      .eq('user_id', user.id)
      .eq('product_id', Number(productId))
      .maybeSingle()
    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }
    return NextResponse.json(data)
  }

  const { data, error: dbError } = await supabase
    .from('cart')
    .select('quantity, selected_size, product:products(*)')
    .eq('user_id', user.id)

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const { user, supabase, error } = await getUser(request)
  if (error || !user) {
    return NextResponse.json({ error: error?.message ?? 'Not authenticated' }, { status: 401 })
  }

  const { product_id, quantity = 1, selected_size } = await request.json()
  const buyNow = request.nextUrl.searchParams.get('buyNow') === 'true'

  const { data: existing, error: fetchError } = await supabase
    .from('cart')
    .select('id, quantity, selected_size')
    .eq('user_id', user.id)
    .eq('product_id', product_id)
    .eq('selected_size', selected_size || null)
    .maybeSingle()

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  let data, dbError
  if (existing) {
    if (buyNow) {
      // For "Buy Now" - set quantity to the passed quantity (not always 1)
      ;({ data, error: dbError } = await supabase
        .from('cart')
        .update({ quantity: quantity })
        .eq('id', existing.id)
        .select()
        .single())
    } else {
      // Regular add to cart - add to existing quantity
      ;({ data, error: dbError } = await supabase
        .from('cart')
        .update({ quantity: existing.quantity + quantity })
        .eq('id', existing.id)
        .select()
        .single())
    }
  } else {
    ;({ data, error: dbError } = await supabase
      .from('cart')
      .insert({ user_id: user.id, product_id, quantity, selected_size })
      .select()
      .single())
  }

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest) {
  const { user, supabase, error } = await getUser(request)
  if (error || !user) {
    return NextResponse.json({ error: error?.message ?? 'Not authenticated' }, { status: 401 })
  }

  const { product_id, quantity, selected_size } = await request.json()

  const { data, error: dbError } = await supabase
    .from('cart')
    .update({ quantity })
    .eq('user_id', user.id)
    .eq('product_id', product_id)
    .eq('selected_size', selected_size || null)
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

  const { product_id, selected_size, clear_all } = await request.json()

  let deleteQuery = supabase
    .from('cart')
    .delete()
    .eq('user_id', user.id)

  // If clear_all is true, delete all cart items for the user
  if (clear_all) {
    // No additional conditions needed, will delete all cart items for the user
  } else {
    // Delete specific item
    deleteQuery = deleteQuery.eq('product_id', product_id)

    // If selected_size is provided, include it in the delete condition
    if (selected_size !== undefined) {
      deleteQuery = deleteQuery.eq('selected_size', selected_size)
    }
  }

  const { error: dbError } = await deleteQuery

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
