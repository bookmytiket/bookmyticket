import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request, { params }) {
  try {
    const { code } = await params;
    const ifsc = code?.toUpperCase();

    if (!ifsc || ifsc.length !== 11) {
      return NextResponse.json({ success: false, error: 'Invalid IFSC Code length' }, { status: 400 });
    }

    // 1. Check local Supabase Cache
    const { data: cached, error: cacheError } = await supabaseAdmin
      .from('ifsc_codes')
      .select('*')
      .eq('ifsc', ifsc)
      .maybeSingle();

    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }

    // 2. Fetch from public API (Razorpay IFSC API)
    const response = await fetch(`https://ifsc.razorpay.com/${ifsc}`);
    if (!response.ok) {
      return NextResponse.json({ success: false, error: 'Invalid or missing IFSC code' }, { status: 404 });
    }

    const data = await response.json();

    // 3. Save to Supabase Cache
    const newEntry = {
      ifsc: data.IFSC,
      bank: data.BANK,
      branch: data.BRANCH,
      address: data.ADDRESS,
      contact: data.CONTACT,
      city: data.CITY,
      district: data.DISTRICT,
      state: data.STATE
    };

    await supabaseAdmin.from('ifsc_codes').insert(newEntry).select();

    return NextResponse.json({ success: true, data: newEntry });

  } catch (error) {
    console.error("IFSC Lookup Error:", error);
    return NextResponse.json({ success: false, error: 'Failed to lookup IFSC code' }, { status: 500 });
  }
}
