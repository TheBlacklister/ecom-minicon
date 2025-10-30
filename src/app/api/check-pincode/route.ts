// src/app/api/check-pincode/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE env vars for check-pincode route');
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

const memCache = new Map<string, any>();
const CACHE_TTL_MS = 1000 * 60 * 5;
const cacheTimestamps = new Map<string, number>();
function setCache(k: string, v: any) { memCache.set(k, v); cacheTimestamps.set(k, Date.now()); }
function getCache(k: string) {
  const t = cacheTimestamps.get(k); if (!t) return null;
  if (Date.now() - t > CACHE_TTL_MS) { memCache.delete(k); cacheTimestamps.delete(k); return null; }
  return memCache.get(k);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(()=>({}));
    const pincodeRaw = (body?.pincode ?? '').toString().trim();
    const paymentType = (body?.paymentType ?? 'any').toString().toLowerCase();
    const includeCouriers = !!body?.includeCouriers;

    if (!pincodeRaw || !/^\d{3,6}$/.test(pincodeRaw)) {
      return NextResponse.json({ deliverable: false, message: 'Invalid pincode' }, { status: 400 });
    }
    const pincode = pincodeRaw.replace(/\s+/g, '');
    const cacheKey = `${pincode}:${paymentType}:${includeCouriers?1:0}`;
    const cached = getCache(cacheKey);
    if (cached) return NextResponse.json(cached);

    const { data: agg, error } = await sb
      .from('pincodes_agg')
      .select('pincode,city,state,cod_delivery,prepaid_delivery,pickup,reverse_pickup,couriers_count,couriers')
      .eq('pincode', pincode)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('supabase agg query error', error);
      return NextResponse.json({ deliverable: false, message: 'DB error' }, { status: 500 });
    }
    if (!agg) {
      const res = { deliverable: false, reason: 'not_found' };
      setCache(cacheKey, res);
      return NextResponse.json(res);
    }

    const codOk = !!agg.cod_delivery;
    const prepaidOk = !!agg.prepaid_delivery;
    let deliverable = false;
    if (paymentType === 'prepaid') deliverable = prepaidOk;
    else if (paymentType === 'cod') deliverable = codOk;
    else deliverable = prepaidOk || codOk;

    const result: any = {
      deliverable,
      pincode,
      city: agg.city,
      state: agg.state,
      couriers_count: agg.couriers_count,
      message: deliverable ? 'Deliverable' : 'Not deliverable'
    };
    if (includeCouriers) result.couriers = agg.couriers ?? [];

    setCache(cacheKey, result);
    return NextResponse.json(result);
  } catch (err) {
    console.error('check-pincode POST error', err);
    return NextResponse.json({ deliverable: false, message: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
    try {
      // ask Supabase for head/count only
      const { count, error } = await sb
        .from('pincodes_agg')
        .select('pincode', { head: true, count: 'exact' });
  
      if (error) {
        console.warn('health query error', error);
        return NextResponse.json({ ok: true, message: 'check-pincode (healthy, but count unknown)' });
      }
  
      return NextResponse.json({ ok: true, count });
    } catch (err) {
      console.error('check-pincode GET error', err);
      return NextResponse.json({ ok: false, message: 'error' }, { status: 500 });
    }
  }
  
