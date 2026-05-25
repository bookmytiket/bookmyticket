import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: "Supabase credentials missing" }, { status: 500 });
    }
    const { data, error } = await supabaseAdmin
      .from("email_templates")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) throw error;
    
    const mappedData = data.map(t => ({
      id: t.id,
      identifier: t.template_key || "",
      name: t.name || t.template_name || "",
      subject: t.subject_template || "",
      body: t.html_content || "",
      category: t.category || "Notification",
      auto_send: t.auto_send || false
    }));
    
    return NextResponse.json({ success: true, data: mappedData });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { id, identifier, name, subject, body: templateBody, category, auto_send } = body;

    const payload = {
      template_key: identifier,
      name,
      subject_template: subject,
      html_content: templateBody,
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
    
    const savedData = result.data[0];
    const mappedResult = {
      id: savedData.id,
      identifier: savedData.template_key,
      name: savedData.name,
      subject: savedData.subject_template,
      body: savedData.html_content,
      category: savedData.category,
      auto_send: savedData.auto_send
    };
    
    return NextResponse.json({ success: true, data: mappedResult });
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
