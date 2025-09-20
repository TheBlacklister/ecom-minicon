import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createSupabaseServerClient(token?: string) {
  return createClient(supabaseUrl, supabaseKey, {
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
  })
}