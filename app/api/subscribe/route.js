import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/emailService';

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
      const subject = 'Welcome to the BookMyTicket Family! 🎟️';
      const html = `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #f8fafc; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
            <!-- Header Banner -->
            <div style="background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 800; margin: 0; letter-spacing: -0.025em; text-transform: uppercase;">BookMyTicket</h1>
            </div>
            
            <div style="padding: 40px;">
              <h2 style="color: #1e293b; font-size: 22px; font-weight: 700; margin-bottom: 16px;">You're In! 🚀</h2>
              <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                Thanks for subscribing to our newsletter! You'll now be the first to know about the most exciting events, exclusive deals, and premium turf bookings happening near you.
              </p>
              
              <div style="background-color: #f1f5f9; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
                <h3 style="color: #334155; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">What to expect:</h3>
                <ul style="color: #475569; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
                  <li>Early access to popular concert tickets</li>
                  <li>Flash sales on professional services</li>
                  <li>Exclusive rewards for active members</li>
                </ul>
              </div>
              
              <div style="text-align: center;">
                <a href="https://bookmyticket.net" style="display: inline-block; background-color: #f43f5e; color: #ffffff; padding: 16px 32px; border-radius: 12px; font-weight: 700; text-decoration: none; transition: background-color 0.2s;">
                  Explore Trending Events
                </a>
              </div>
            </div>
            
            <div style="background-color: #1e293b; padding: 30px; text-align: center;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                © 2026 BookMyTicket. All rights reserved.<br/>
                Mumbai, India
              </p>
              <div style="margin-top: 16px;">
                <p style="color: #64748b; font-size: 11px; margin: 0;">
                  You received this email because you subscribed to our newsletter on our website.
                </p>
              </div>
            </div>
          </div>
        </div>
      `;

    const emailResult = await sendEmail({ to: email, subject, html });
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
