import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

export const list = query({
    args: { vendorId: v.string(), status: v.optional(v.string()) },
    handler: async (ctx, args) => {
        let q = ctx.db
            .query("vendorBookings")
            .withIndex("by_vendorId", (q) => q.eq("vendorId", args.vendorId));
        
        const results = await q.collect();

        if (args.status && args.status !== "all") {
            return results.filter(b => b.status === args.status);
        }

        return results;
    },
});

export const create = mutation({
    args: {
        vendorId: v.string(),
        userId: v.string(),
        serviceType: v.string(),
        bookingDate: v.string(),
        bookingTime: v.optional(v.string()),
        totalAmount: v.number(),
        customerDetails: v.object({
            name: v.string(),
            phone: v.string(),
            email: v.string(),
            address: v.optional(v.string()),
        }),
        remarks: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("vendorBookings", {
            ...args,
            status: "pending",
            createdAt: Date.now(),
        });

        // Initialize a chat room for this booking
        await ctx.db.insert("chatRooms", {
            participants: [args.vendorId, args.userId],
            lastMessage: "Booking request sent",
            lastMessageAt: Date.now(),
            bookingId: id,
        });

        // Send confirmation email to customer (non-blocking)
        const refId = id.slice(-8).toUpperCase();
        const customerEmail = args.customerDetails.email;
        const customerName = args.customerDetails.name;

        if (customerEmail) {
            const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#f84464 0%,#a855f7 100%);padding:32px 28px 24px;text-align:center;">
      <div style="width:64px;height:64px;background:rgba(255,255,255,0.2);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
        <span style="font-size:32px;">✅</span>
      </div>
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:900;letter-spacing:-0.5px;">Booking Request Received!</h1>
      <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:13px;">Hi ${customerName}, your request has been sent successfully.</p>
    </div>
    <!-- Ref Badge -->
    <div style="background:#fafbfc;border-bottom:1px solid #f1f5f9;padding:14px 28px;display:flex;align-items:center;justify-content:space-between;">
      <span style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Booking Reference</span>
      <span style="font-size:14px;font-weight:900;color:#0f172a;font-family:monospace;">#${refId}</span>
    </div>
    <!-- Details -->
    <div style="padding:24px 28px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:10px 0;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Service</td>
          <td style="padding:10px 0;font-size:13px;font-weight:700;color:#1e293b;text-align:right;">${args.serviceType}</td>
        </tr>
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:10px 0;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Date</td>
          <td style="padding:10px 0;font-size:13px;font-weight:700;color:#1e293b;text-align:right;">${args.bookingDate}${args.bookingTime ? " · " + args.bookingTime : ""}</td>
        </tr>
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:10px 0;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Customer</td>
          <td style="padding:10px 0;font-size:13px;font-weight:700;color:#1e293b;text-align:right;">${customerName}</td>
        </tr>
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:10px 0;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Status</td>
          <td style="padding:10px 0;text-align:right;"><span style="background:#fef3c7;color:#92400e;font-size:11px;font-weight:900;padding:3px 10px;border-radius:20px;text-transform:uppercase;letter-spacing:0.5px;">Pending Review</span></td>
        </tr>
        <tr>
          <td style="padding:14px 0 0;font-size:14px;font-weight:900;color:#0f172a;">Total Amount</td>
          <td style="padding:14px 0 0;font-size:16px;font-weight:900;color:#f84464;text-align:right;">₹${args.totalAmount}</td>
        </tr>
      </table>
    </div>
    <!-- Info Box -->
    <div style="margin:0 28px 24px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:14px 16px;">
      <p style="margin:0;font-size:12px;color:#166534;line-height:1.6;">
        <strong>What's next?</strong> The professional will review your request and confirm within 24 hours. 
        You will receive another email once your booking is confirmed. No payment is required until confirmation.
      </p>
    </div>
    <!-- Footer -->
    <div style="border-top:1px solid #f1f5f9;padding:16px 28px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#94a3b8;">This email was sent by <strong>BookMyTicket</strong> · No payment required until confirmed</p>
    </div>
  </div>
</body>
</html>`;

            await ctx.scheduler.runAfter(0, api.emailActions.sendEmail, {
                to: customerEmail,
                subject: `Booking Request Confirmed – Ref #${refId} | BookMyTicket`,
                html: emailHtml,
            });
        }

        return id;
    },
});


export const updateStatus = mutation({
    args: { id: v.id("vendorBookings"), status: v.string() },
    handler: async (ctx, args) => {
        const booking = await ctx.db.get(args.id);
        if (!booking) throw new Error("Booking not found");

        await ctx.db.patch(args.id, { status: args.status });

        // If completed, update vendor wallet
        if (args.status === "completed") {
            const organiser = await ctx.db
                .query("organisers")
                .withIndex("by_userId", (q) => q.eq("userId", booking.vendorId))
                .unique();
            
            if (organiser) {
                await ctx.db.patch(organiser._id, {
                    walletBalance: (organiser.walletBalance || 0) + booking.totalAmount,
                });
            }
        }
    },
});

export const reschedule = mutation({
    args: { id: v.id("vendorBookings"), newDate: v.string(), newTime: v.optional(v.string()) },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            bookingDate: args.newDate,
            bookingTime: args.newTime,
            status: "pending", // Reset to pending for vendor to re-confirm
            rescheduleDate: args.newDate,
        });
    },
});

export const getUpcoming = query({
    args: { vendorId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("vendorBookings")
            .withIndex("by_vendorId", (q) => q.eq("vendorId", args.vendorId))
            .filter((q) => q.eq(q.field("status"), "confirmed"))
            .collect();
    },
});

export const getByUser = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        const bookings = await ctx.db
            .query("vendorBookings")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .collect();

        return Promise.all(
            bookings.map(async (booking) => {
                const vendor = await ctx.db
                    .query("organisers")
                    .withIndex("by_userId", (q) => q.eq("userId", booking.vendorId))
                    .unique();

                return {
                    ...booking,
                    eventName: `${vendor?.name || "Service Professional"} Booking`,
                    ticketCount: 1, 
                    totalPrice: booking.totalAmount,
                    bookingDate: booking.bookingDate,
                    status: booking.status.charAt(0).toUpperCase() + booking.status.slice(1),
                    isVendorBooking: true,
                };
            })
        );
    },
});
