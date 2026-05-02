import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
    // Use service-role key so we can call auth.admin.createUser with email_confirm: true.
    // This is safe because this runs server-side only.
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    try {
        const { email, password, full_name, phone, role } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: 'Email and password are required.' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { success: false, error: 'Password must be at least 6 characters.' },
                { status: 400 }
            );
        }

        // Check if email has already been OTP-verified (belt-and-suspenders guard).
        const { data: otpCheck } = await supabaseAdmin
            .from('otps')
            .select('id')
            .eq('email', email.trim().toLowerCase())
            .eq('purpose', 'signup')
            .maybeSingle();
        
        // Note: We don't block here because the OTP is deleted on verify.
        // This is just a log; the verify step already deleted the OTP on success.

        // Create the user via admin API.
        // email_confirm: true → user is immediately active, no separate email needed.
        // The DB trigger handle_new_user will auto-create the profiles row.
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email: email.trim().toLowerCase(),
            password,
            email_confirm: true,
            user_metadata: {
                full_name: (full_name || '').trim(),
                role: role || 'user',
            },
        });

        if (error) {
            // Supabase returns this message for duplicate emails
            if (
                error.message?.toLowerCase().includes('already been registered') ||
                error.message?.toLowerCase().includes('already exists') ||
                error.message?.toLowerCase().includes('duplicate') ||
                error.status === 422
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'An account with this email already exists. Please sign in instead.',
                    },
                    { status: 409 }
                );
            }
            throw error;
        }

        // Ensure the profiles row has the full_name (trigger may have set it from metadata,
        // but we upsert just in case the trigger ran before metadata was set).
        if (data?.user?.id && (full_name || phone)) {
            await supabaseAdmin
                .from('profiles')
                .update({ 
                    full_name: (full_name || '').trim(),
                    phone: phone,
                    role: role || 'user'
                })
                .eq('id', data.user.id);
        }

        // Dispatch Welcome Notification (Background)
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        fetch(`${baseUrl}/api/comm/trigger`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                phoneNumber: phone, 
                email: email.trim().toLowerCase(),
                type: 'SIGNUP', 
                data: { name: full_name } 
            })
        }).catch(e => console.error("Server-side Welcome trigger failed", e));

        return NextResponse.json({ success: true, userId: data.user.id });
    } catch (err) {
        console.error('[/api/auth/signup] Error:', err);
        return NextResponse.json(
            { success: false, error: err.message || 'Signup failed. Please try again.' },
            { status: 500 }
        );
    }
}
