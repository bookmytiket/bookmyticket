import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function getServerSession() {
  const cookieStore = cookies();
  const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
    },
  });

  // Extract token from cookies (assuming standard Supabase cookie name)
  // This is a simplified version; in a real app, you'd use the Supabase Auth Helpers
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) return null;

  return user;
}

export async function validateRole(user, allowedRoles) {
  if (!user) return { authorized: false, error: 'Unauthorized' };

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !profile) return { authorized: false, error: 'Profile not found' };

  const authorized = allowedRoles.includes(profile.role);
  return { authorized, role: profile.role, user };
}

export function getScopedQuery(supabaseClient, table, userId, ownershipColumn = 'user_id') {
  return supabaseClient.from(table).select('*').eq(ownershipColumn, userId);
}
