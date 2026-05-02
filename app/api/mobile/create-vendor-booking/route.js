import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin is not configured" }, { status: 500 });
    }

    const { vendorId, userId, bookingDate, serviceType, customerDetails, remarks } = await request.json();
    if (!vendorId || !userId || !bookingDate || !customerDetails?.name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: provider, error: providerError } = await supabaseAdmin
      .from("service_providers")
      .select("id,category")
      .eq("id", vendorId)
      .maybeSingle();

    if (providerError) throw providerError;
    if (!provider) {
      return NextResponse.json({ error: "Service provider not found" }, { status: 404 });
    }

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("vendor_bookings")
      .insert({
        vendor_id: vendorId,
        user_id: userId,
        service_type: serviceType || provider.category || "Professional Service",
        booking_date: bookingDate,
        total_amount: 0,
        customer_details: customerDetails,
        remarks: remarks || null,
        status: "Pending"
      })
      .select("id")
      .single();

    if (bookingError) throw bookingError;
    return NextResponse.json({ success: true, bookingId: booking.id });
  } catch (error) {
    console.error("Create mobile vendor booking failed:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
