import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const token = request.headers.get("Authorization")?.split("Bearer ")[1];
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const kycStep = body.kyc_step || 1;

        // ── Step 1 / 3: Always upsert profile fields ──────────────────────────
        const profilePayload = {
            id: user.id,
            user_id: user.id,
            kyc_step: Math.min(kycStep + 1, 4), // ← advance past completed step (step 5 is auto via kyc_status)
            updated_at: new Date().toISOString(),
        };

        // Only include fields that were explicitly sent (avoids overwriting with empty strings)
        if (body.full_name   !== undefined) profilePayload.full_name   = body.full_name;
        if (body.phone       !== undefined) profilePayload.phone        = body.phone;
        if (body.dob         !== undefined) profilePayload.dob          = body.dob || null;
        if (body.business_name !== undefined) profilePayload.business_name = body.business_name;
        if (body.business_type !== undefined) profilePayload.business_type = body.business_type;
        if (body.pan_number  !== undefined) profilePayload.pan_number   = body.pan_number;
        if (body.gst_number  !== undefined) profilePayload.gst_number   = body.gst_number || null;
        if (body.company_registration_number !== undefined) profilePayload.company_registration_number = body.company_registration_number || null;
        if (body.website     !== undefined) profilePayload.website      = body.website || null;
        if (body.business_address !== undefined) profilePayload.business_address = body.business_address;
        if (body.city        !== undefined) profilePayload.city         = body.city;
        if (body.state       !== undefined) profilePayload.state        = body.state;
        if (body.pincode     !== undefined) profilePayload.pincode      = body.pincode;
        if (body.country     !== undefined) profilePayload.country      = body.country;

        const { error: profileError } = await supabaseAdmin
            .from('organizer_profiles')
            .upsert(profilePayload);

        if (profileError) throw profileError;

        // ── Step 4: Bank details — only when bank object is provided ──────────
        if (body.bank && body.bank.account_holder_name) {
            await supabaseAdmin.from('organizer_bank_details').delete().eq('organizer_id', user.id);

            const { error: bankError } = await supabaseAdmin.from('organizer_bank_details').insert({
                organizer_id: user.id,
                account_holder_name: body.bank.account_holder_name,
                bank_name: body.bank.bank_name,
                account_number_encrypted: body.bank.account_number,
                ifsc_code: body.bank.ifsc_code,
                upi_id: body.bank.upi_id || null,
                cancelled_cheque_url: body.documents?.bank || null,
            });
            if (bankError) throw bankError;
        }

        // ── Step 3: KYC Documents — only when provided ────────────────────────
        if (body.documents && Object.keys(body.documents).length > 0) {
            const docs = [];
            if (body.documents.identity) docs.push({ organizer_id: user.id, document_type: 'identity', document_name: 'Identity Proof',  document_url: body.documents.identity });
            if (body.documents.business) docs.push({ organizer_id: user.id, document_type: 'business', document_name: 'Business Proof',  document_url: body.documents.business });
            if (body.documents.address)  docs.push({ organizer_id: user.id, document_type: 'address',  document_name: 'Address Proof',   document_url: body.documents.address  });

            if (docs.length > 0) {
                await supabaseAdmin.from('organizer_kyc_documents').delete().eq('organizer_id', user.id);
                const { error: docsError } = await supabaseAdmin.from('organizer_kyc_documents').insert(docs);
                if (docsError) throw docsError;
            }
        }

        // ── Step 4 final submit: update KYC status to 'submitted' ─────────────
        if (kycStep >= 4 && body.bank?.account_holder_name) {
            const { error: statusError } = await supabaseAdmin.from('organizer_verification_status').upsert({
                organizer_id: user.id,
                kyc_status: 'submitted',
                dashboard_access: false,
                submitted_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }, { onConflict: 'organizer_id' });
            if (statusError) throw statusError;

            // Sync legacy tables for Admin Panel backwards compatibility
            await supabaseAdmin.from('organisers').update({ kyc_status: 'Submitted' }).eq('id', user.id);
            await supabaseAdmin.from('partner_requests').update({ status: 'KYC Submitted' }).eq('email', user.email);
        }

        return NextResponse.json({ success: true, step: kycStep });
    } catch (err) {
        console.error("KYC onboarding error:", err);
        // Avoid leaking raw JS TypeErrors to the UI
        const isDbError = err?.code && typeof err.code === 'string';
        const message = isDbError
            ? (err.message || 'Database error')
            : 'Failed to save your profile. Please try again.';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
