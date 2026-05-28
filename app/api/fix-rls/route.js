import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  // Fix RLS for organisers
  // Supabase REST API doesn't support raw SQL. But we can create an RPC.
  // Wait, I can't create an RPC via REST API either.
  
  return NextResponse.json({ message: "hello" });
}
