import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
    try {
        const { sessionToken, extraDetails } = await request.json();

        if (!sessionToken) {
            return NextResponse.json({ error: "Session token is required" }, { status: 400 });
        }

        const { data: session, error } = await supabaseAdmin
            .from("booking_sessions")
            .select("*")
            .eq("id", sessionToken)
            .single();

        if (error || !session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        const newParticipantData = {
            ...session.participant_data,
            ...extraDetails
        };

        const { error: updateError } = await supabaseAdmin
            .from("booking_sessions")
            .update({ participant_data: newParticipantData })
            .eq("id", sessionToken);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Update Participant Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
