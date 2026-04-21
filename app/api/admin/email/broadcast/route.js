import { createClient } from '@supabase/supabase-js';
import { sendTemplatedEmail } from '@/lib/emailService';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { templateIdentifier, target, category, customSubject, customBody } = await req.json();

    // 1. Verify Admin (simplified for this example, usually handled by middleware or auth checks)
    // In a real app, you'd check the session/JWT
    
    let query = supabaseAdmin.from('profiles').select('email, full_name');

    if (target === 'subscribers') {
      query = supabaseAdmin.from('subscribers').select('email, full_name');
    } else if (target === 'filtered' && category) {
      // Assuming 'category' is a field in profiles or related to user activity
      // For now, let's say we filter profiles by a metadata field or similar
      // Adjust based on actual schema
      query = query.filter('metadata->>category', 'eq', category);
    }

    const { data: recipients, error: fetchError } = await query;

    if (fetchError) throw fetchError;
    if (!recipients || recipients.length === 0) {
      return NextResponse.json({ success: false, error: 'No recipients found' }, { status: 400 });
    }

    const results = {
      total: recipients.length,
      sent: 0,
      failed: 0,
      errors: []
    };

    // 2. Broadcast
    for (const recipient of recipients) {
      try {
        const res = await sendTemplatedEmail({
          templateIdentifier,
          to: recipient.email,
          variables: {
            name: recipient.full_name || 'User',
            ... (customSubject ? { subject: customSubject } : {}),
            ... (customBody ? { body: customBody } : {})
          },
          metadata: { broadcast: true, target }
        });

        if (res.success) {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push({ email: recipient.email, error: res.error });
        }
      } catch (err) {
        results.failed++;
        results.errors.push({ email: recipient.email, error: err.message });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err) {
    console.error("Broadcast Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
