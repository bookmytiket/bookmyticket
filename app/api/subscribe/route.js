import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail, sendTemplatedEmail } from '@/lib/emailService';

export async function POST(request) {
  // Uses service-role key (server-side only) to bypass RLS for public newsletter sign-ups
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('subscribers')
      .insert({ email, status: 'Active' });

    if (error && error.code !== '23505') {
      console.error('Subscribe error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send Welcome Email
    try {
      const emailResult = await sendTemplatedEmail({
        templateIdentifier: 'welcome_registration',
        to: email,
        variables: {
          name: 'Subscriber',
          site_url: 'https://bookmyticket.net'
        }
      });
    if (emailResult.success) {
      console.log(`Welcome email successfully sent to ${email} via ${emailResult.provider}`);
    } else {
      console.error(`Welcome email failed for ${email}:`, emailResult.error);
    }
  } catch (mailErr) {
      console.error('Welcome email dispatch failed:', mailErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Subscribe route error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
