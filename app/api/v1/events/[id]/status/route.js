import { ok } from "@/lib/shared/contracts";
import { jsonError, jsonOk, getBearerUser, readProfileRole } from "@/lib/shared/supabaseServer";

export async function POST(request, { params }) {
  const { user, supabase, error } = await getBearerUser(request);
  if (error) return error;

  try {
    const { id } = await params;
    const { status, publish_status, review_notes } = await request.json();

    // 1. Fetch current event
    const { data: event, error: fetchError } = await supabase
      .from("events")
      .select("id, organiser_id, status, publish_status")
      .eq("id", id)
      .single();

    if (fetchError || !event) {
      return jsonError("Event not found", 404, "event_not_found");
    }

    // 2. Determine permissions
    const userRole = await readProfileRole(supabase, user.id);
    const isOrganizer = event.organiser_id === user.id;
    const isAdmin = userRole === "admin";

    if (!isOrganizer && !isAdmin) {
      return jsonError("Unauthorized to update this event", 403, "unauthorized");
    }

    const updates = {};
    const oldStatus = event.status;

    // 3. Status Transition Logic
    if (status) {
      // Organizer Transitions
      if (isOrganizer) {
        if (status === "pending_review" && ["draft", "rejected", "changes_requested"].includes(event.status)) {
          updates.status = "pending_review";
        } else if (status === "draft" && !["approved", "published"].includes(event.status)) {
           updates.status = "draft";
        } else {
           return jsonError(`Invalid status transition for organizer: ${event.status} -> ${status}`, 400);
        }
      }
      
      // Admin Transitions
      if (isAdmin && !isOrganizer) { // Only admin can approve/reject
         if (["approved", "rejected", "changes_requested"].includes(status)) {
            updates.status = status;
            
            // Log review notes if provided
            if (review_notes || status !== "approved") {
               await supabase.from("event_reviews").insert({
                  event_id: id,
                  reviewed_by: user.id,
                  review_status: status,
                  review_notes: review_notes || null
               });
            }
         } else {
            return jsonError(`Invalid status transition for admin: ${event.status} -> ${status}`, 400);
         }
      }
    }

    if (publish_status) {
       if (isOrganizer || isAdmin) {
          if (publish_status === "published" && event.status === "approved") {
             updates.publish_status = "published";
          } else if (publish_status === "unpublished") {
             updates.publish_status = "unpublished";
          } else {
             return jsonError(`Cannot publish event with status: ${event.status}`, 400);
          }
       }
    }

    if (Object.keys(updates).length === 0) {
      return jsonError("No valid updates provided", 400);
    }

    // 4. Update the event
    const { data: updatedEvent, error: updateError } = await supabase
      .from("events")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;
    
    // Note: event_status_history is tracked by a Postgres trigger set up in migration 20260529400000

    // 5. Queue Notification
    let notificationType = null;
    if (updates.status === "pending_review") notificationType = "event_submitted";
    else if (updates.status === "approved") notificationType = "event_approved";
    else if (updates.status === "rejected") notificationType = "event_rejected";
    else if (updates.status === "changes_requested") notificationType = "event_changes_requested";
    else if (updates.publish_status === "published") notificationType = "event_published";

    if (notificationType) {
       await supabase.from("notification_queue").insert({
          user_id: event.organiser_id, // notify the organizer
          channel: "email",
          event_type: notificationType,
          payload: {
             event_id: id,
             review_notes: review_notes || ""
          }
       });
    }

    return jsonOk(ok(updatedEvent, { resource: "event_status" }));
  } catch (err) {
    console.error("[api/v1/events/:id/status] failed:", err);
    return jsonError(err.message || "Failed to update event status");
  }
}
