import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin is not configured" }, { status: 500 });
    }

    const { eventId, userId, ticketCount, totalPrice, customerDetails } = await request.json();
    if (!eventId || !userId || !ticketCount || totalPrice == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: eventRow, error: eventError } = await supabaseAdmin
      .from("events")
      .select("id,title,location")
      .eq("id", String(eventId))
      .maybeSingle();

    if (eventError) throw eventError;
    if (!eventRow) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .insert([
        {
          event_id: String(eventId),
          user_id: userId,
          ticket_count: Number(ticketCount),
          base_amount: Number(totalPrice),
          platform_charge: 0,
          gst_amount: 0,
          gst_percent: 0,
          partner_bonus: 0,
          platform_revenue: 0,
          partner_total: Number(totalPrice),
          discount_amount: 0,
          total_price: Number(totalPrice),
          status: "Pending",
          scanned: false,
          selected_seats: [],
          event_name: eventRow.title || "Event",
          location: eventRow.location || "Venue",
          customer_details: customerDetails || {}
        }
      ])
      .select("id")
      .single();

    if (bookingError) throw bookingError;
    return NextResponse.json({ success: true, bookingId: booking.id });
  } catch (error) {
    console.error("Create mobile booking failed:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
