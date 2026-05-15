import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function proxy(request) {
  return await middleware(request);
}

export async function middleware(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  console.log(`[Proxy] Incoming Request: ${path}`);

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const cookieStore = request.cookies.getAll();
  console.log(`[Proxy] Cookies Present: ${cookieStore.length}`);
  // Uncomment to see cookie names:
  // console.log(`[Proxy] Cookie Names: ${cookieStore.map(c => c.name).join(', ')}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // 1. Redirect unauthenticated users to signin if accessing protected routes
  const protectedRoutes = ['/user', '/organiser', '/provider', '/vendor', '/admin', '/profile'];
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));

  if (!user && isProtectedRoute) {
    console.log(`[Proxy] Blocking Unauthenticated Access to: ${path}`);
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  if (user) {
    console.log(`[Proxy] Authenticated: ${user.email} -> ${path}`);
    
    // 2. Fetch user role and identity resolution
    // We use a robust lookup to determine the user's primary operational role
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    const { data: admin } = await supabase.from('platform_admins').select('id').eq('id', user.id).maybeSingle();
    const { data: organiser } = await supabase.from('organisers').select('id, kyc_status, is_approved').eq('id', user.id).maybeSingle();
    const { data: staff } = await supabase.from('staff').select('id, organiser_id').eq('id', user.id).maybeSingle();
    const { data: vendor } = await supabase.from('vendors').select('id').eq('id', user.id).maybeSingle();

    let role = (profile?.role || 'user').toLowerCase();
    if (admin) {
        role = 'admin';
    } else if (organiser) {
        role = 'organiser';
    } else if (staff) {
        role = 'staff';
    } else if (vendor) {
        role = 'vendor';
    }

    console.log(`[Proxy] Verified Identity: ${user.email} | Role: ${role}`);

    // 3. STRICT PATH ENFORCEMENT
    const pathAccess = {
        '/admin': ['admin', 'super_admin', 'system_admin'],
        '/organiser': ['organiser', 'staff', 'admin'],
        '/vendor': ['vendor', 'admin'],
        '/provider': ['provider', 'professional_service', 'admin'],
    };

    for (const [basePath, allowedRoles] of Object.entries(pathAccess)) {
        if (path.startsWith(basePath) && !allowedRoles.includes(role)) {
            console.log(`[Proxy] Access Denied: Role ${role} cannot access ${path}`);
            return NextResponse.redirect(new URL('/signin', request.url));
        }
    }

    // 4. ONBOARDING & APPROVAL GUARDS
    if (role === 'organiser' && !organiser?.is_approved && path !== '/onboarding' && !path.startsWith('/api')) {
        // If organiser is not approved and not an admin, force to onboarding
        console.log(`[Proxy] Redirecting Unapproved Organiser to Onboarding`);
        return NextResponse.redirect(new URL('/onboarding', request.url));
    }

    // 5. LOGIN REDIRECTION (Auto-Dashboard)
    if (path === '/signin' || path === '/signup') {
        const dashboardMap = {
            admin: '/admin',
            organiser: '/organiser',
            staff: '/organiser',
            vendor: '/vendor',
            user: '/profile'
        };
        const target = dashboardMap[role] || '/profile';
        console.log(`[Proxy] Logged-in redirect to: ${target}`);
        return NextResponse.redirect(new URL(target, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/user/:path*',
    '/organiser/:path*',
    '/provider/:path*',
    '/vendor/:path*',
    '/admin/:path*',
    '/profile/:path*',
    '/signin',
    '/signup'
  ],
};
