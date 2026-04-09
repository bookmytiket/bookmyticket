import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { calculateGst } from "./gst";

export const getBookings = query({
    args: {},
    handler: async (ctx) => {
        const bookings = await ctx.db.query("bookings").collect();
        return Promise.all(
            bookings.map(async (booking) => {
                const validEventId = ctx.db.normalizeId("events", booking.eventId);
                const event = validEventId !== null ? (await ctx.db.get(validEventId)) as any : null;

                let userName = booking.customerDetails?.name;
                if (!userName && booking.userId) {
                    const user = await ctx.db
                        .query("users")
                        .withIndex("by_email", (q) => q.eq("email", booking.userId))
                        .unique();
                    if (user) userName = user.name;
                }

                const isVirtual = event?.virtual || 
                                 event?.type?.toLowerCase() === "online" || 
                                 event?.location?.toLowerCase().includes("online") ||
                                 event?.title?.toLowerCase().includes("online meeting");

                let resolvedUrl = event?.meetingUrl || null;

                if (validEventId && isVirtual) {
                    const meeting = await ctx.db.query("meetings")
                        .withIndex("by_eventId", (q) => q.eq("eventId", validEventId))
                        .order("desc")
                        .first();
                    if (meeting && meeting.meetingLink) {
                        resolvedUrl = meeting.meetingLink;
                    }
                }

                return {
                    ...booking,
                    eventName: event && event.title ? event.title : "Static Event",
                    eventType: event && event.type ? event.type : "Physical",
                    meetingUrl: resolvedUrl,
                    customerEmail: booking.userId, // Map userId to customerEmail for UI compatibility
                    userName: userName || "Guest User",
                    organiserId: event?.organiserId || null,
                    virtual: !!isVirtual,
                };
            })
        );
    },
});

export const getBookingById = query({
    args: { id: v.string() },
    handler: async (ctx, args) => {
        const booking = (await ctx.db.get(args.id as any)) as any;
        if (!booking || !("eventId" in booking)) return null;

        const validEventId = ctx.db.normalizeId("events", booking.eventId);
        const event = validEventId !== null ? (await ctx.db.get(validEventId)) as any : null;

        let userName = booking.customerDetails?.name;
        if (!userName && booking.userId) {
            const user = await ctx.db
                .query("users")
                .withIndex("by_email", (q) => q.eq("email", booking.userId))
                .unique();
            if (user) userName = user.name;
        }

        const isVirtual = event?.virtual || 
                        event?.type?.toLowerCase() === "online" || 
                        event?.location?.toLowerCase().includes("online") ||
                        event?.title?.toLowerCase().includes("online meeting");

        let resolvedUrl = event?.meetingUrl || null;

        if (validEventId && isVirtual) {
            const meeting = await ctx.db.query("meetings")
                .withIndex("by_eventId", (q) => q.eq("eventId", validEventId))
                .order("desc")
                .first();
            if (meeting && meeting.meetingLink) {
                resolvedUrl = meeting.meetingLink;
            }
        }

        return {
            ...booking,
            eventName: event && "title" in event ? event.title : "Static Event",
            eventType: event && "type" in event ? event.type : "Physical",
            meetingUrl: resolvedUrl,
            location: event && "location" in event ? event.location : "TBA",
            userName: userName || "Guest User",
            virtual: !!isVirtual,
        };
    },
});

export const getBookedSeatsByEvent = query({
    args: { eventId: v.string() },
    handler: async (ctx, args) => {
        const bookings = await ctx.db
            .query("bookings")
            .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
            .collect();

        // Include Confirmed and Pending bookings, ignore Failed/Cancelled
        const validStatuses = ["Confirmed", "Pending", "Scanned"];
        const validBookings = bookings.filter((b) => validStatuses.includes(b.status));

        const bookedSeatIds = new Set<string>();
        for (const booking of validBookings) {
            if (booking.selectedSeats && Array.isArray(booking.selectedSeats)) {
                for (const seat of booking.selectedSeats) {
                    if (seat && seat.id) {
                        bookedSeatIds.add(seat.id);
                    }
                }
            }
        }

        return Array.from(bookedSeatIds);
    },
});

export const createBooking = mutation({
    args: {
        eventId: v.string(), // changed to string to allow static events
        userId: v.string(),
        ticketCount: v.number(),
        totalPrice: v.number(),
        status: v.string(),
        scanned: v.optional(v.boolean()),
        customerDetails: v.optional(v.object({
            name: v.string(),
            email: v.string(),
            phone: v.string(),
        })),
        selectedSeats: v.optional(v.array(v.object({
            id: v.string(),
            catName: v.string(),
            price: v.number(),
            isFree: v.boolean(),
        }))),
    },
    handler: async (ctx, args) => {
        // GST Calculation
        const gstSettings = await ctx.db.query("gstSettings").first();
        let gstData = {};
        let finalTotalPrice = args.totalPrice;

        if (gstSettings && gstSettings.isEnabled) {
            // Check if events category GST is enabled specifically
            const eventRate = gstSettings.categoryRates?.events;
            const isCategoryEnabled = eventRate ? eventRate.enabled : true; // Default to true if not specified but global is enabled

            if (isCategoryEnabled) {
                const taxConfig = eventRate ? { cgst: eventRate.cgst, sgst: eventRate.sgst, igst: eventRate.igst } : gstSettings.taxConfig;
                const gstResult = calculateGst(args.totalPrice, taxConfig, gstSettings.pricingType);
                
                // If exclusive, total price increases
                if (gstSettings.pricingType === "exclusive") {
                    finalTotalPrice = args.totalPrice + gstResult.gstAmount;
                }

                // Generate Invoice Number
                const timestamp = Date.now().toString().slice(-6);
                const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
                const invoiceNumber = `${gstSettings.invoicePrefix}${timestamp}${random}`;

                gstData = {
                    taxableAmount: gstResult.taxableAmount,
                    gstAmount: gstResult.gstAmount,
                    gstBreakdown: gstResult.gstBreakdown,
                    invoiceNumber: invoiceNumber,
                    isGstApplied: true,
                    totalPrice: finalTotalPrice,
                    invoiceDate: Date.now(),
                };
            }
        }

        const bookingId = await ctx.db.insert("bookings", {
            ...args,
            ...gstData,
        });

        // Update Organiser Wallet ONLY if status is 'Confirmed'
        if (args.status === 'Confirmed') {
            const validEventId = ctx.db.normalizeId("events", args.eventId);
            const event = validEventId !== null ? (await ctx.db.get(validEventId)) as any : null;
            let eventName = "Event";
            if (event) {
                eventName = event.title || "Event";
                if (event.organiserId) {
                    const organiser = (await ctx.db
                        .query("organisers")
                        .filter((q) => q.eq(q.field("userId"), event.organiserId))
                        .unique()) as any;

                    if (organiser) {
                        await ctx.db.patch(organiser._id, {
                            walletBalance: (organiser.walletBalance || 0) + args.totalPrice,
                        });
                    }
                }
            }
            const branding = await ctx.db.query("siteBranding").first();
            const siteUrl = branding?.siteUrl || "https://bookmyticket.net";
            let brandLogo = branding?.logoUrl || "/logo.png";
            if (brandLogo.startsWith("/")) {
                brandLogo = `${siteUrl}${brandLogo}`;
            }
            const brandNameDisplay = branding?.name || "BookMyTicket";

            // Send Email Confirmation
            const targetEmail = args.customerDetails?.email || args.userId;
            await ctx.scheduler.runAfter(0, api.emailActions.sendEmail, {
                to: targetEmail,
                subject: `Booking Confirmed: ${eventName}`,
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 40px 20px; border: 1px solid #eee; border-radius: 12px; text-align: center;">
                        <img src="${brandLogo}" alt="${brandNameDisplay}" style="max-height: 70px; width: auto; margin-bottom: 25px; color: #333; font-size: 24px; font-weight: bold;">
                        <h2 style="color: #333; margin-bottom: 20px;">Tickets Confirmed! 🎉</h2>
                        <p style="color: #555; font-size: 16px; margin-bottom: 20px;">Thank you for booking with ${brandNameDisplay}. You have successfully purchased <strong>${args.ticketCount}</strong> ticket(s) for:</p>
                        <div style="font-size: 20px; font-weight: 700; color: #ff007f; margin-bottom: 20px;">${eventName}</div>
                        <p style="color: #555; margin-bottom: 30px;">Total amount paid: <strong>Rs. ${args.totalPrice}</strong></p>
                        
                        ${(event && (event as any).virtual) ? `
                        <div style="margin: 30px 0; padding: 25px; background-color: #f0fdf4; border: 2px solid #10b981; border-radius: 16px; text-align: center;">
                            <h3 style="margin: 0 0 10px; color: #065f46; font-size: 18px; font-weight: 800;">Virtual Meeting Access 🎥</h3>
                            <p style="margin: 0 0 5px; color: #059669; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Meeting Code</p>
                            <p style="margin: 0 0 20px; color: #064e3b; font-family: 'Courier New', monospace; font-size: 28px; font-weight: 900; letter-spacing: 3px;">${(event as any).meetingUrl}</p>
                            <a href="${siteUrl}/${(event as any).meetingUrl}" style="display: inline-block; padding: 14px 28px; background-color: #10b981; color: white; text-decoration: none; border-radius: 12px; font-weight: 900; font-size: 15px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">Join Meeting Now</a>
                        </div>
                        ` : ''}

                        <p style="color: #999; font-size: 14px;">You can view your tickets in your account dashboard.</p>
                    </div>
                `,
            });
        }

        return bookingId;
    },
});

export const confirmBooking = mutation({
    args: { id: v.id("bookings") },
    handler: async (ctx, args) => {
        const booking = await ctx.db.get(args.id);
        if (!booking || booking.status === "Confirmed") return;

        await ctx.db.patch(args.id, { status: "Confirmed" });

        // Update Organiser Wallet
        const validEventId = ctx.db.normalizeId("events", booking.eventId);
        let eventName = "Event";
        if (validEventId !== null) {
            const event = (await ctx.db.get(validEventId)) as any;
            if (event) {
                eventName = event.title || "Event";
                if (event.organiserId) {
                    const organiser = (await ctx.db
                        .query("organisers")
                        .filter((q) => q.eq(q.field("userId"), event.organiserId))
                        .unique()) as any;
    
                        if (organiser) {
                            await ctx.db.patch(organiser._id, {
                                walletBalance: (organiser.walletBalance || 0) + booking.totalPrice,
                            });
                        }
                }
            }
        }

        const branding = await ctx.db.query("siteBranding").first();
        const siteUrl = branding?.siteUrl || "https://bookmyticket.net";
        let brandLogo = branding?.logoUrl || "/logo.png";
        if (brandLogo.startsWith("/")) {
            brandLogo = `${siteUrl}${brandLogo}`;
        }
        const brandNameDisplay = branding?.name || "BookMyTicket";

        // Send Email Confirmation
        const targetEmail = booking.customerDetails?.email || booking.userId;
        await ctx.scheduler.runAfter(0, api.emailActions.sendEmail, {
            to: targetEmail,
            subject: `Booking Confirmed: ${eventName}`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 40px 20px; border: 1px solid #eee; border-radius: 12px; text-align: center;">
                    <img src="${brandLogo}" alt="${brandNameDisplay}" style="max-height: 70px; width: auto; margin-bottom: 25px;">
                    <h2 style="color: #333; margin-bottom: 20px;">Tickets Confirmed! 🎉</h2>
                    <p style="color: #555; font-size: 16px; margin-bottom: 20px;">Thank you for booking with ${brandNameDisplay}. You have successfully purchased <strong>${booking.ticketCount}</strong> ticket(s) for:</p>
                    <div style="font-size: 20px; font-weight: 700; color: #ff007f; margin-bottom: 20px;">${eventName}</div>
                    <p style="color: #555; margin-bottom: 30px;">Total amount paid: <strong>Rs. ${booking.totalPrice}</strong></p>
                    
                    ${(event && (event as any).virtual) ? `
                    <div style="margin: 30px 0; padding: 25px; background-color: #f0fdf4; border: 2px solid #10b981; border-radius: 16px; text-align: center;">
                        <h3 style="margin: 0 0 10px; color: #065f46; font-size: 18px; font-weight: 800;">Virtual Meeting Access 🎥</h3>
                        <p style="margin: 0 0 5px; color: #059669; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Meeting Code</p>
                        <p style="margin: 0 0 20px; color: #064e3b; font-family: 'Courier New', monospace; font-size: 28px; font-weight: 900; letter-spacing: 3px;">${(event as any).meetingUrl}</p>
                        <a href="${siteUrl}/${(event as any).meetingUrl}" style="display: inline-block; padding: 14px 28px; background-color: #10b981; color: white; text-decoration: none; border-radius: 12px; font-weight: 900; font-size: 15px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">Join Meeting Now</a>
                    </div>
                    ` : ''}

                    <p style="color: #999; font-size: 14px;">You can view your tickets in your account dashboard.</p>
                </div>
            `,
        });
    },
});

export const updateBooking = mutation({
    args: { id: v.id("bookings"), scanned: v.boolean() },
    handler: async (ctx, { id, scanned }) => {
        const patch: any = { scanned };
        if (scanned) {
            patch.status = "Scanned";
        }
        await ctx.db.patch(id, patch);
    },
});

export const getByUser = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        const bookings = await ctx.db
            .query("bookings")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .collect();

        return Promise.all(
            bookings.map(async (booking) => {
                const validEventId = ctx.db.normalizeId("events", booking.eventId);
                const event = validEventId !== null ? (await ctx.db.get(validEventId)) as any : null;

                const isVirtual = event?.virtual || 
                                 event?.type?.toLowerCase() === "online" || 
                                 event?.location?.toLowerCase().includes("online") ||
                                 event?.title?.toLowerCase().includes("online meeting");

                let resolvedUrl = event?.meetingUrl || null;

                // RESILIENCY: If meetingUrl is missing or points to organiser/admin dashboard (common misconfig),
                // attempt to find the correct 9-digit code in the meetings table.
                const isInternal = resolvedUrl?.toLowerCase().includes("organiser") || resolvedUrl?.toLowerCase().includes("admin") || resolvedUrl?.toLowerCase().includes("vendor");
                if (validEventId && (isVirtual)) {
                    const meeting = await ctx.db.query("meetings")
                        .withIndex("by_eventId", (q) => q.eq("eventId", validEventId))
                        .order("desc")
                        .first();
                    
                    // If we found a formal meeting record, always use its 9-digit code
                    // as it's the most reliable participant joining path.
                    if (meeting && meeting.meetingLink) {
                        resolvedUrl = meeting.meetingLink;
                    }
                }

                return {
                    ...booking,
                    eventName: event?.title || "Event Ticket",
                    eventType: event?.type || "Physical",
                    meetingUrl: resolvedUrl,
                    virtual: !!isVirtual,
                };
            })
        );
    },
});
