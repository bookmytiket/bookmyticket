import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
    try {
        const { sessionToken, quantity, participantData } = await request.json();

        if (!sessionToken) {
            return NextResponse.json({ error: "Session token is required" }, { status: 400 });
        }

        // Fetch current session
        const { data: session, error: fetchErr } = await supabaseAdmin
            .from("booking_sessions")
            .select("*")
            .eq("id", sessionToken)
            .maybeSingle();

        if (fetchErr || !session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        const newParticipantData = {
            ...(session.participant_data || {}),
            ...(participantData || {})
        };

        if (quantity !== undefined) {
            newParticipantData.quantity = quantity;
        }

        const { data: updatedSession, error: updateErr } = await supabaseAdmin
            .from("booking_sessions")
            .update({
                participant_data: newParticipantData
            })
            .eq("id", sessionToken)
            .select()
            .single();

        if (updateErr) throw updateErr;

        return NextResponse.json({ success: true, session: updatedSession });
    } catch (err) {
        console.error("Update Session Error:", err);
        return NextResponse.json({ error: err.message || "Failed to update session" }, { status: 500 });
    }
}
