import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("email_templates")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { id, identifier, name, subject, body: templateBody, category, auto_send } = body;

    const payload = {
      identifier,
      name,
      subject,
      body: templateBody,
      category,
      auto_send,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (id) {
      result = await supabaseAdmin.from("email_templates").update(payload).eq("id", id).select();
    } else {
      result = await supabaseAdmin.from("email_templates").insert([payload]).select();
    }

    if (result.error) throw result.error;
    return NextResponse.json({ success: true, data: result.data[0] });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) throw new Error("ID is required");

    const { error } = await supabaseAdmin.from("email_templates").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
