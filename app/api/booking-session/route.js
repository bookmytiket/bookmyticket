import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Create a new booking session
export async function POST(request) {
    try {
        const body = await request.json();
        const { eventId, packageId, quantity, participantData, pricingSnapshot, userId } = body;

        if (!eventId || !userId) {
            return NextResponse.json({ error: "Missing required fields eventId or userId" }, { status: 400 });
        }

        // Set session expiration to 20 minutes from now
        const expiresAt = new Date(Date.now() + 20 * 60 * 1000).toISOString();

        const { data: session, error } = await supabaseAdmin
            .from("booking_sessions")
            .insert({
                user_id: userId,
                event_id: eventId,
                package_id: packageId || null,
                participant_data: {
                    quantity: quantity || 1,
                    ...participantData
                },
                pricing_snapshot: pricingSnapshot || {},
                status: "pending",
                expires_at: expiresAt
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            sessionToken: session.id,
            expiresAt: session.expires_at,
            session
        });
    } catch (err) {
        console.error("Create Booking Session Error:", err);
        return NextResponse.json({ error: err.message || "Failed to create booking session" }, { status: 500 });
    }
}

// Get and validate booking session
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionToken = searchParams.get("sessionToken");

        if (!sessionToken) {
            return NextResponse.json({ error: "Session token is required" }, { status: 400 });
        }

        const { data: session, error } = await supabaseAdmin
            .from("booking_sessions")
            .select("*, events(*)")
            .eq("id", sessionToken)
            .maybeSingle();

        if (error) throw error;

        if (!session) {
            return NextResponse.json({ valid: false, error: "Session not found" }, { status: 404 });
        }

        // Check if session is expired
        const now = new Date();
        const expiresAt = new Date(session.expires_at);
        if (expiresAt < now) {
            // Update session status to expired
            await supabaseAdmin
                .from("booking_sessions")
                .update({ status: "expired" })
                .eq("id", sessionToken);

            return NextResponse.json({ valid: false, error: "Session has expired" });
        }

        if (session.status !== "pending") {
            return NextResponse.json({ valid: false, error: `Session is already ${session.status}` });
        }

        return NextResponse.json({ valid: true, session });
    } catch (err) {
        console.error("Validate Booking Session Error:", err);
        return NextResponse.json({ error: err.message || "Failed to validate session" }, { status: 500 });
    }
}
