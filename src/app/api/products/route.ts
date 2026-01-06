import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET() {
  const { data, error } = await supabase
    .from('products')
    .select('*')

  if (error) {
    console.error('Products API error:', error)
    return NextResponse.json(
      { products: [] },
      { status: 500 }
    )
  }

  return NextResponse.json({
    products: data ?? [],
  })
}
