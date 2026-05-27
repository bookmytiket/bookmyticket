import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req) {
    try {
        const { fullName, username, email, password, role } = await req.json();

        if (!email || !password || !fullName || !role) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Create User in Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
                username: username,
            }
        });

        if (authError) throw authError;

        const userId = authData.user.id;

        // 2. Insert into profiles with 'admin' role
        const { error: profileError } = await supabaseAdmin.from('profiles').insert({
            id: userId,
            email: email,
            full_name: fullName,
            username: username,
            role: 'admin'
        });

        if (profileError) throw profileError;

        // 3. Insert into admins table
        const { error: adminError } = await supabaseAdmin.from('admins').insert({
            id: userId,
            role: role,
            updated_at: new Date().toISOString()
        });

        if (adminError) throw adminError;

        return NextResponse.json({ success: true, user: authData.user });
    } catch (error) {
        console.error("Admin creation error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "Missing admin ID" }, { status: 400 });
        }

        // Deleting the user from auth automatically cascades to profiles and admins
        const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Admin deletion error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
