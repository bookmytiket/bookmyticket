import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function generateRegistrationNumber(eventName) {
  const prefix = eventName ? eventName.substring(0, 3).toUpperCase() : 'BDM';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
}

export async function POST(req) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      eventId,
      categoryId,
      fullName,
      mobile,
      email,
      dob,
      gender,
      address,
      district,
      state,
      pincode,
      academyName,
      coachName,
      playerRanking,
      shirtSize,
      documents // Array of { type, url }
    } = body;

    // 1. Fetch category to calculate exact fees
    const { data: category, error: catErr } = await supabase
      .from('badminton_categories')
      .select('*, badminton_events(event_name)')
      .eq('id', categoryId)
      .single();

    if (catErr || !category) throw new Error('Category not found');

    const regFee = Number(category.registration_fee) || 0;
    const platformFee = Number(category.platform_fee) || 0;
    const gstPercent = Number(category.gst_percent) || 0;
    
    const subtotal = regFee + platformFee;
    const gstAmount = (subtotal * gstPercent) / 100;
    const totalAmount = subtotal + gstAmount;

    const registrationNumber = generateRegistrationNumber(category.badminton_events.event_name);

    // 2. Insert Registration
    const { data: reg, error: regErr } = await supabase
      .from('badminton_registrations')
      .insert({
        registration_number: registrationNumber,
        event_id: eventId,
        category_id: categoryId,
        user_id: user.id,
        full_name: fullName,
        mobile,
        email: email || user.email,
        dob,
        gender,
        address,
        district,
        state,
        pincode,
        academy_name: academyName,
        coach_name: coachName,
        player_ranking: playerRanking,
        shirt_size: shirtSize,
        registration_fee: regFee,
        platform_fee: platformFee,
        gst_amount: gstAmount,
        total_amount: totalAmount,
        payment_status: 'pending', // Will be updated by Razorpay webhook
        verification_status: documents?.length > 0 ? 'pending' : 'approved',
        qr_code: registrationNumber
      })
      .select('id')
      .single();

    if (regErr) throw regErr;

    // 3. Insert Documents (Age Verification)
    if (documents && documents.length > 0) {
      const docRows = documents.map(d => ({
        registration_id: reg.id,
        document_type: d.type,
        document_url: d.url,
        approval_status: 'Pending'
      }));
      const { error: docErr } = await supabase.from('badminton_player_documents').insert(docRows);
      if (docErr) console.error('Document insert error:', docErr);
    }

    // 4. Update Slots Booked
    await supabase.rpc('increment_badminton_category_slots', { cat_id: categoryId });

    return NextResponse.json({ 
      success: true, 
      registration_id: reg.id,
      registration_number: registrationNumber,
      amount: totalAmount 
    });

  } catch (err) {
    console.error('[Badminton Registration API]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
