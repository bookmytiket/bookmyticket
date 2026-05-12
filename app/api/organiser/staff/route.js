import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// We need a server-side client to verify the organiser's session
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request) {
  try {
    const { name, email, password, organiserId, mobile, assignedEventId, expiryDate, gateName } = await request.json();

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase Admin client not configured' }, { status: 500 });
    }

    // 0. CHECK STAFF LIMIT
    // A. Get current staff count
    const { count: currentStaffCount } = await supabaseAdmin
      .from('staff')
      .select('*', { count: 'exact', head: true })
      .eq('organiser_id', organiserId);

    // B. Get active subscription
    const { data: subscription } = await supabaseAdmin
      .from('organiser_subscriptions')
      .select('package_id, staff_packages(staff_limit)')
      .eq('organiser_id', organiserId)
      .eq('payment_status', 'active')
      .maybeSingle();

    const staffLimit = subscription?.staff_packages?.staff_limit || 3;

    if ((currentStaffCount || 0) >= staffLimit) {
      return NextResponse.json({ 
        error: `Staff limit reached (${staffLimit} accounts). Please upgrade your plan to add more staff.` 
      }, { status: 403 });
    }

    // 1. Create the Auth User
    let userId;
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name, role: 'staff', assigned_event_id: assignedEventId }
    });

    if (authError) {
      if (authError.message.toLowerCase().includes('already been registered') || authError.status === 422) {
        // User exists, find them
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw listError;
        
        const existingUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
        if (!existingUser) throw new Error("Could not find registered user");
        userId = existingUser.id;
        
        // Update metadata/password to match the new intent
        await supabaseAdmin.auth.admin.updateUserById(userId, {
            password,
            user_metadata: { full_name: name, role: 'staff', assigned_event_id: assignedEventId }
        });
      } else {
        throw authError;
      }
    } else {
      userId = authUser.user.id;
    }

    // 2. Create Profile (Upsert)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email,
        full_name: name,
        role: 'staff',
        status: 'Active'
      });

    if (profileError) throw profileError;

    // 3. Create Staff Entry
    const staffPayload = {
        id: userId,
        auth_user_id: userId,
        organiser_id: organiserId,
        name,
        email,
        mobile,
        assigned_event_id: assignedEventId,
        expiry_date: expiryDate,
        gate_name: gateName,
        role: 'staff',
        is_active: true,
        permissions: []
    };

    const { data: staffData, error: staffError } = await supabaseAdmin
      .from('staff')
      .upsert(staffPayload)
      .select()
      .single();

    if (staffError) throw staffError;

    return NextResponse.json({ success: true, staff: staffData });
  } catch (error) {
    console.error('Staff creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PATCH(request) {
  try {
    const { id, is_active, auth_user_id } = await request.json();

    if (!supabaseAdmin) throw new Error('Admin client missing');

    // Toggle active status in DB
    const { error: dbError } = await supabaseAdmin
      .from('staff')
      .update({ is_active })
      .eq('id', id);

    if (dbError) throw dbError;

    // If deactivating, we could also ban the user in Auth
    // const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
    //   auth_user_id,
    //   { ban_duration: is_active ? 'none' : '1000h' }
    // );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(request) {
    try {
      const { id, auth_user_id, password, name, mobile, assignedEventId, expiryDate, gateName } = await request.json();
  
      if (!supabaseAdmin) throw new Error('Admin client missing');
  
      // 1. Update Auth User if password or metadata changed
      const authUpdates = {};
      if (password) authUpdates.password = password;
      if (name || assignedEventId || gateName) {
          authUpdates.user_metadata = { 
              full_name: name, 
              assigned_event_id: assignedEventId,
              gate_name: gateName
          };
      }

      if (Object.keys(authUpdates).length > 0) {
          const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
            auth_user_id,
            authUpdates
          );
          if (authError) throw authError;
      }
  
      // 2. Update staff table
      const { error: dbError } = await supabaseAdmin
        .from('staff')
        .update({ 
            name, 
            mobile, 
            assigned_event_id: assignedEventId, 
            expiry_date: expiryDate,
            gate_name: gateName
        })
        .eq('id', id);

      if (dbError) throw dbError;

      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

export async function DELETE(request) {
  try {
    const { auth_user_id, id } = await request.json();

    if (!supabaseAdmin) throw new Error('Admin client missing');

    // Delete from staff table
    await supabaseAdmin.from('staff').delete().eq('id', id);
    
    // Delete from profiles
    await supabaseAdmin.from('profiles').delete().eq('id', auth_user_id);

    // Delete from Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(auth_user_id);
    if (authError) throw authError;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
