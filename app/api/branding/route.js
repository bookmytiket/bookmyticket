import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [{ data: sponsors }, { data: partners }] = await Promise.all([
      supabase.from('sponsors').select('*').eq('status', 'active').order('display_order', { ascending: true }),
      supabase.from('partners').select('*').eq('status', 'active').order('display_order', { ascending: true })
    ]);

    return NextResponse.json({
      logo_url: "/logo.png",
      powered_by_logo_url: "/logo.png",
      powered_by_link: "https://www.bookmyticket.net",
      sponsors: sponsors || [],
      partners: partners || []
    });
  } catch (err) {
    return NextResponse.json({
      logo_url: "/logo.png",
      powered_by_logo_url: "/logo.png",
      powered_by_link: "https://www.bookmyticket.net",
      sponsors: [],
      partners: []
    });
  }
}
