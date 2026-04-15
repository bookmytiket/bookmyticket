import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Uses service-role key (server-side only) to bypass RLS for public newsletter sign-ups
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('subscribers')
      .insert({ email, status: 'Active' });

    if (error) {
      // Duplicate email is a graceful case — treat as already subscribed
      if (error.code === '23505') {
        return NextResponse.json({ success: true, message: 'Already subscribed.' });
      }
      console.error('Subscribe error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Subscribe route error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
