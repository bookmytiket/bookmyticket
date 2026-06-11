import { NextResponse } from "next/server";
import { sendBookingConfirmationEmail } from "@/lib/emailTriggers";
import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
    try {
        const { bookingId } = await request.json();

        if (!bookingId) {
            return NextResponse.json({ success: false, error: "Booking ID is required" }, { status: 400 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        const { data: booking, error } = await supabase
            .from('bookings')
            .select('id')
            .eq('id', bookingId)
            .single();

        if (error || !booking) {
            return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
        }

        const result = await sendBookingConfirmationEmail(bookingId);

        if (!result.success) {
            return NextResponse.json({ success: false, error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Email resent successfully" });
    } catch (err) {
        console.error("Resend Email API Error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
