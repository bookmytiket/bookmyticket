import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/runner-registration
 * Save runner identity + custom field responses to runner_registrations table.
 *
 * Body: {
 *   eventId, bookingId, userId,
 *   identity: { fullName, email, phone, dob },     // Step 2 data
 *   details: { "T-Shirt": "M", "Gender": "Male" }, // Step 3 custom fields (formData)
 *   category: "3KM Run",                           // selected marathon category
 *   paymentStatus: "paid" | "pending"
 * }
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { eventId, bookingId, userId, identity, details, category, paymentStatus } = body;

        if (!eventId) {
            return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
        }

        // Normalize field names from details (custom_fields)
        // details is a flat object: { "T-Shirt": "M", "Gender": "Male", ... }
        const customFields = { ...(details || {}) };

        // Extract known fields from details if not in identity
        const gender    = identity?.gender   || customFields?.Gender    || customFields?.gender    || null;
        const tshirt    = identity?.tshirt   || customFields?.['T-Shirt'] || customFields?.tshirt  || null;

        // Remove extracted known fields from custom_fields to avoid duplication
        delete customFields.Gender;
        delete customFields.gender;
        delete customFields['T-Shirt'];
        delete customFields.tshirt;

        const registrationRow = {
            event_id:       eventId,
            booking_id:     bookingId || null,
            user_id:        userId    || null,

            // Runner Identity (Step 2)
            full_name:      identity?.fullName || identity?.full_name || identity?.name || null,
            email:          identity?.email    || null,
            phone:          identity?.phone    || null,
            dob:            identity?.dob      || null,
            gender:         gender,

            // Event details
            category:       category || null,
            tshirt_size:    tshirt,

            // Remaining dynamic custom fields
            custom_fields:  customFields,

            status:         'confirmed',
            payment_status: paymentStatus || 'paid',
        };

        const { data, error } = await supabase
            .from('runner_registrations')
            .insert(registrationRow)
            .select()
            .single();

        if (error) {
            console.error('[runner-registration] Insert error:', error);
            // If table doesn't exist yet, store in bookings customer_details as fallback
            if (error.message?.includes('does not exist')) {
                return NextResponse.json({
                    success: false,
                    fallback: true,
                    message: 'runner_registrations table not yet created. Run migration SQL first.',
                    row: registrationRow
                }, { status: 202 });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, registration: data });

    } catch (err) {
        console.error('[runner-registration] Unexpected error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/**
 * GET /api/runner-registration?eventId=xxx
 * Fetch all registrations for an event (organiser view).
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const eventId  = searchParams.get('eventId');
    const bookingId = searchParams.get('bookingId');

    if (!eventId && !bookingId) {
        return NextResponse.json({ error: 'eventId or bookingId required' }, { status: 400 });
    }

    let query = supabase.from('runner_registrations').select('*').order('created_at', { ascending: false });

    if (eventId)   query = query.eq('event_id', eventId);
    if (bookingId) query = query.eq('booking_id', bookingId);

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message, data: [] }, { status: 200 });
    }

    return NextResponse.json({ registrations: data });
}
