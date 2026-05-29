import { ok } from "@/lib/shared/contracts";
import { jsonError, jsonOk, getBearerUser } from "@/lib/shared/supabaseServer";

export async function GET(request, { params }) {
  const { supabase, user, error } = await getBearerUser(request);
  if (error) return error;

  try {
    const { id } = await params;

    const { data: draft, error: fetchError } = await supabase
      .from("event_drafts")
      .select("*")
      .eq("event_id", id)
      .single();

    // Check ownership by joining events implicitly or via RLS (handled by DB)
    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (!draft) {
      return jsonError("Draft not found", 404, "draft_not_found");
    }

    return jsonOk(ok(draft, { resource: "event_draft" }));
  } catch (err) {
    console.error("[api/v1/events/:id/draft] failed:", err);
    return jsonError(err.message || "Unable to load draft");
  }
}

export async function POST(request, { params }) {
  const { supabase, user, error } = await getBearerUser(request);
  if (error) return error;

  try {
    const { id } = await params;
    const { draft_json, completion_percentage } = await request.json();

    // The RLS policy requires that the organizer owns the event.
    // If the event does not exist yet, they should create it via the main POST /events first with status='draft'.

    const { data: eventCheck, error: eventError } = await supabase
       .from("events")
       .select("organiser_id")
       .eq("id", id)
       .single();
       
    if (eventError || !eventCheck) {
       return jsonError("Event not found before creating draft", 404);
    }
    
    if (eventCheck.organiser_id !== user.id) {
       return jsonError("Unauthorized to update this draft", 403);
    }

    const { data: existingDraft } = await supabase
      .from("event_drafts")
      .select("id")
      .eq("event_id", id)
      .maybeSingle();

    let result;
    if (existingDraft) {
      const { data, error: updateError } = await supabase
        .from("event_drafts")
        .update({
          draft_json,
          completion_percentage: completion_percentage || 0,
          last_saved_at: new Date().toISOString()
        })
        .eq("event_id", id)
        .select()
        .single();
      if (updateError) throw updateError;
      result = data;
    } else {
      const { data, error: insertError } = await supabase
        .from("event_drafts")
        .insert({
          event_id: id,
          draft_json,
          completion_percentage: completion_percentage || 0,
          last_saved_at: new Date().toISOString()
        })
        .select()
        .single();
      if (insertError) throw insertError;
      result = data;
    }

    return jsonOk(ok(result, { resource: "event_draft" }));
  } catch (err) {
    console.error("[api/v1/events/:id/draft] failed:", err);
    return jsonError(err.message || "Failed to save draft");
  }
}
