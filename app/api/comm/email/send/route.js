import { NextResponse } from "next/server";
import { sendTemplatedEmail } from "@/lib/emailService";

export async function POST(req) {
  try {
    const { templateIdentifier, to, variables } = await req.json();

    if (!templateIdentifier || !to) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const result = await sendTemplatedEmail({
      templateIdentifier,
      to,
      variables: {
        ...variables,
        site_url: process.env.NEXT_PUBLIC_BASE_URL || 'https://bookmyticket.net'
      }
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Email Send API Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
