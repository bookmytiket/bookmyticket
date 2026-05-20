import { createClient } from "@supabase/supabase-js";
import { handlePaymentSuccess } from "@/app/utils/paymentUtils";
import { unlockPartnerReward } from "@/lib/partnerRewards";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Queues a background job in Supabase, with an in-memory/direct fallback
 * if the background_jobs table has not been created yet.
 */
export async function queueJob({ jobType, bookingId, payload = {} }) {
    console.log(`[QueueJob] Queueing ${jobType} for Booking: ${bookingId}`);
    
    let jobId = null;
    let tableExists = true;

    try {
        const { data, error } = await supabaseAdmin
            .from("background_jobs")
            .insert({
                job_type: jobType,
                booking_id: bookingId,
                status: "pending",
                attempts: 0,
                payload
            })
            .select("id")
            .single();

        if (error) {
            // Check if error is because table does not exist
            if (error.code === "PGRST205" || error.message.includes("relation") || error.message.includes("cache")) {
                tableExists = false;
            } else {
                throw error;
            }
        } else {
            jobId = data.id;
        }
    } catch (err) {
        console.warn(`[QueueJob] Table insert failed, falling back to direct background processing:`, err.message);
        tableExists = false;
    }

    return { jobId, tableExists };
}

/**
 * Processes a single background job by ID or run directly as a fallback.
 */
export async function executeJob({ jobId, jobType, bookingId, payload = {}, origin = "" }) {
    console.log(`[ExecuteJob] Processing jobType: ${jobType}, Booking: ${bookingId}, JobID: ${jobId || "FALLBACK"}`);

    if (jobId) {
        // Mark job as processing
        await supabaseAdmin
            .from("background_jobs")
            .update({ 
                status: "processing",
                attempts: 1 // or increment if retry logic is added later
            })
            .eq("id", jobId);
    }

    let success = false;
    let errorMsg = null;

    try {
        if (jobType === "settlement") {
            // Run financial settlements
            const res = await handlePaymentSuccess({
                paymentId: payload.paymentId,
                type: 'event',
                referenceId: bookingId,
                totalAmount: payload.totalAmount,
                baseAmount: payload.baseAmount,
                platformFee: payload.platformFee,
                gstAmount: payload.gstAmount,
                providerId: payload.providerId,
                eventId: payload.eventId,
                description: payload.description
            });
            success = res.success;
            if (!res.success) errorMsg = res.error || "Settlement failed";
        } else if (jobType === "rewards") {
            // Run post-payment reward evaluation
            const res = await unlockPartnerReward(bookingId, payload.userId, payload.eventId);
            success = res.success;
            if (!res.success) errorMsg = res.error || res.message || "Reward unlocking failed";
        } else if (jobType === "notifications") {
            // Run email/SMS/WhatsApp notifications
            if (payload.phoneNumber || payload.email) {
                const targetOrigin = origin || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
                const res = await fetch(`${targetOrigin}/api/comm/trigger`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        phoneNumber: payload.phoneNumber,
                        email: payload.email,
                        type: "BOOKING",
                        data: {
                            name: payload.name || "Customer",
                            eventName: payload.eventName || "Event",
                            date: payload.date || "TBA",
                            bookingId: bookingId,
                            ticketNumber: payload.ticketNumber
                        }
                    })
                });
                success = res.ok;
                if (!res.ok) {
                    const text = await res.text();
                    errorMsg = `Notification API status ${res.status}: ${text}`;
                }
            } else {
                success = true; // No contact info to notify
            }
        } else {
            throw new Error(`Unknown job type: ${jobType}`);
        }
    } catch (err) {
        console.error(`[ExecuteJob] Error executing ${jobType}:`, err);
        success = false;
        errorMsg = err.message || JSON.stringify(err);
    }

    if (jobId) {
        // Update database job status
        await supabaseAdmin
            .from("background_jobs")
            .update({
                status: success ? "completed" : "failed",
                error_message: errorMsg,
                completed_at: success ? new Date().toISOString() : null
            })
            .eq("id", jobId);
    }

    console.log(`[ExecuteJob] Finished ${jobType} - Success: ${success}`);
    return { success, error: errorMsg };
}
