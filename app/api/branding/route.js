import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  console.log("Branding API route called.");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Branding API: Credentials missing", { url: !!supabaseUrl, key: !!supabaseServiceKey });
    return NextResponse.json({ error: "Supabase credentials missing" }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { data, error } = await supabaseAdmin.from('site_branding').select('*').limit(1).single();
    if (error) {
      // If table is empty, return default
      if (error.code === 'PGRST116') {
        return NextResponse.json({ powered_by_logo_url: "/logo.png", powered_by_link: "https://www.bookmyticket.net" });
      }
      throw error;
    }
    const response = NextResponse.json(data);
    response.headers.set('X-Branding-API', 'hit');
    return response;
  } catch (error) {
    console.error("Error fetching branding:", error);
    return NextResponse.json({ powered_by_logo_url: "/logo.png" }, { status: 200 }); // Graceful fallback
  }
}
