import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

// Create a new booking
export const create = mutation({
    args: {
        turfId: v.id("turfs"),
        userId: v.string(),
        date: v.string(),
        startTime: v.string(),
        endTime: v.string(),
        totalAmount: v.number(),
        advancePaid: v.number(),
        paymentType: v.string(),
        customerDetails: v.object({
            name: v.string(),
            email: v.string(),
            phone: v.string(),
        }),
    },
    handler: async (ctx, args) => {
        // Double-check availability first
        const existing = await ctx.db
            .query("turfBookings")
            .withIndex("by_turfId", (q) => q.eq("turfId", args.turfId))
            .filter((q) => 
                q.and(
                    q.eq(q.field("date"), args.date),
                    q.eq(q.field("startTime"), args.startTime),
                    q.neq(q.field("bookingStatus"), "cancelled")
                )
            )
            .first();

        const blocked = await ctx.db
            .query("turfManualBlocks")
            .withIndex("by_turfId", (q) => q.eq("turfId", args.turfId))
            .filter((q) => 
                q.and(
                    q.eq(q.field("date"), args.date),
                    q.eq(q.field("startTime"), args.startTime)
                )
            )
            .first();

        if (existing || blocked) {
            throw new Error("This slot is already booked or manually blocked.");
        }

        const bookingId = await ctx.db.insert("turfBookings", {
            ...args,
            paymentStatus: "pending",
            bookingStatus: "pending",
            createdAt: Date.now(),
        });

        // Initialize a chat room for communication if needed or send notification
        // For now, return the ID
        return bookingId;
    },
});

// Update payment and booking status
export const confirmPayment = mutation({
    args: {
        bookingId: v.id("turfBookings"),
        paymentIntentId: v.optional(v.string()),
        paymentStatus: v.string(), // "advance_paid" | "fully_paid"
    },
    handler: async (ctx, args) => {
        const booking = await ctx.db.get(args.bookingId);
        if (!booking) throw new Error("Booking not found");

        await ctx.db.patch(args.bookingId, {
            paymentStatus: args.paymentStatus,
            paymentIntentId: args.paymentIntentId,
            bookingStatus: "confirmed", // Auto-confirm on payment
        });

        // Update vendor wallet if fully paid or logic dictates
        if (args.paymentStatus === "fully_paid" || args.paymentStatus === "advance_paid") {
            const turf = await ctx.db.get(booking.turfId);
            if (turf) {
                const organiser = await ctx.db
                    .query("organisers")
                    .withIndex("by_userId", (q) => q.eq("userId", turf.organiserId))
                    .unique();
                
                if (organiser) {
                    const creditAmount = args.paymentStatus === "fully_paid" ? booking.totalAmount : booking.advancePaid;
                    await ctx.db.patch(organiser._id, {
                        walletBalance: (organiser.walletBalance || 0) + creditAmount,
                    });
                }
            }
        }
    },
});

// Get bookings for a vendor
export const listByVendor = query({
    args: { organiserId: v.string() },
    handler: async (ctx, args) => {
        const turfs = await ctx.db
            .query("turfs")
            .withIndex("by_organiserId", (q) => q.eq("organiserId", args.organiserId))
            .collect();
        
        const turfIds = turfs.map((t) => t._id);
        const allBookings = await ctx.db.query("turfBookings").collect();

        // Filter and join turf info
        return allBookings
            .filter((b) => turfIds.includes(b.turfId))
            .map((b) => {
                const turf = turfs.find((t) => t._id === b.turfId);
                return { ...b, turfName: turf?.name || "Unknown Turf" };
            });
    },
});

// Get upcoming bookings for a vendor
export const getUpcomingByVendor = query({
    args: { organiserId: v.string() },
    handler: async (ctx, args) => {
        const turfs = await ctx.db
            .query("turfs")
            .withIndex("by_organiserId", (q) => q.eq("organiserId", args.organiserId))
            .collect();
        
        const turfIds = turfs.map((t) => t._id);
        const now = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

        return await ctx.db
            .query("turfBookings")
            .filter((q) => 
                q.and(
                    q.gte(q.field("date"), now),
                    q.eq(q.field("bookingStatus"), "confirmed")
                )
            )
            .collect();
    },
});

// Check availability for a turf on a specific date
export const checkAvailability = query({
    args: { turfId: v.id("turfs"), date: v.string() },
    handler: async (ctx, args) => {
        const bookings = await ctx.db
            .query("turfBookings")
            .withIndex("by_turfId", (q) => q.eq("turfId", args.turfId))
            .filter((q) => q.and(q.eq(q.field("date"), args.date), q.neq(q.field("bookingStatus"), "cancelled")))
            .collect();
        
        const slots = await ctx.db
            .query("turfSlots")
            .withIndex("by_turfId", (q) => q.eq("turfId", args.turfId))
            .collect();
        
        const manualBlocks = await ctx.db
            .query("turfManualBlocks")
            .withIndex("by_turfId", (q) => q.eq("turfId", args.turfId))
            .filter((q) => q.eq(q.field("date"), args.date))
            .collect();
        
        // Return slots with availability status (booked or manually blocked)
        return slots.map((s) => ({
            ...s,
            isBooked: bookings.some((b) => b.startTime === s.startTime),
            isBlocked: manualBlocks.some((mb) => mb.startTime === s.startTime),
        }));
    },
});

// Get user bookings
export const getByUser = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        const bookings = await ctx.db
            .query("turfBookings")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .collect();
        
        return Promise.all(bookings.map(async (b) => {
            const turf = await ctx.db.get(b.turfId);
            return {
                ...b,
                turfName: turf?.name || "Turf",
                location: turf?.location,
            };
        }));
    },
});

// User-facing reservation flow
export const reserveSlot = mutation({
    args: {
        turfId: v.id("turfs"),
        slotId: v.id("turfSlots"),
        userId: v.string(),
        date: v.string(),
        participantCount: v.optional(v.number()),
        paymentType: v.string(), // "advance" | "full"
        customerDetails: v.object({
            name: v.string(),
            email: v.string(),
            phone: v.string(),
        }),
    },
    handler: async (ctx, args) => {
        const turf = await ctx.db.get(args.turfId);
        const slot = await ctx.db.get(args.slotId);

        if (!turf || !slot) throw new Error("Invalid facility or slot configuration.");

        const participants = args.participantCount || 1;

        // Capacity Check
        if (turf.maxCapacity && participants > turf.maxCapacity) {
            throw new Error(`Participant count exceeds facility capacity of ${turf.maxCapacity}.`);
        }

        // Double check availability
        const existing = await ctx.db
            .query("turfBookings")
            .withIndex("by_turfId", (q) => q.eq("turfId", args.turfId))
            .filter((q) => 
                q.and(
                    q.eq(q.field("date"), args.date),
                    q.eq(q.field("startTime"), slot.startTime),
                    q.neq(q.field("bookingStatus"), "cancelled")
                )
            )
            .first();

        const blocked = await ctx.db
            .query("turfManualBlocks")
            .withIndex("by_turfId", (q) => q.eq("turfId", args.turfId))
            .filter((q) => 
                q.and(
                    q.eq(q.field("date"), args.date),
                    q.eq(q.field("startTime"), slot.startTime)
                )
            )
            .first();

        if (existing || blocked) throw new Error("This slot is already occupied or manually blocked.");

        // Pricing Calculation
        let totalAmount = slot.priceOverride || turf.pricePerHour;

        if (turf.pricingType === "per_person") {
            const pricePer = turf.pricePerPerson || turf.pricePerHour;
            totalAmount = pricePer * participants;
        } else if (turf.pricingType === "tiered" && turf.pricingTiers) {
            const tier = turf.pricingTiers.find(t => participants >= t.min && participants <= t.max);
            if (tier) {
                totalAmount = tier.price;
            } else {
                // Fallback to highest tier if above max, or use base price
                const sortedTiers = [...turf.pricingTiers].sort((a, b) => b.max - a.max);
                if (participants > sortedTiers[0].max) {
                    totalAmount = sortedTiers[0].price;
                }
            }
        }

        // Calculate dynamic advance amount for split payment
        // We use (total / participants) for user-based split if paymentType is "advance"
        const advanceRequired = args.paymentType === "advance" 
            ? Math.ceil(totalAmount / participants) 
            : totalAmount;

        const bookingId = await ctx.db.insert("turfBookings", {
            turfId: args.turfId,
            userId: args.userId,
            date: args.date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            totalAmount,
            advancePaid: advanceRequired, // The amount the user is paying NOW
            participantCount: participants,
            paymentType: args.paymentType,
            paymentStatus: "pending",
            bookingStatus: "pending",
            customerDetails: args.customerDetails,
            createdAt: Date.now(),
        });

        return bookingId;
    },
});

// Admin: List all turf bookings across the platform
export const listAll = query({
    args: {},
    handler: async (ctx) => {
        const bookings = await ctx.db.query("turfBookings").collect();
        return Promise.all(
            bookings.map(async (b) => {
                const turf = await ctx.db.get(b.turfId);
                return {
                    ...b,
                    turfName: turf?.name || "Deleted Turf",
                    location: turf?.location || "N/A",
                };
            })
        );
    },
});

// Vendor/Admin: Cancel a booking
export const cancel = mutation({
    args: { bookingId: v.id("turfBookings"), reason: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const booking = await ctx.db.get(args.bookingId);
        if (!booking) throw new Error("Booking not found");

        await ctx.db.patch(args.bookingId, {
            bookingStatus: "cancelled",
            cancellationReason: args.reason,
        });

        // Optional: Refund logic would go here if integrated with a payment gateway
    },
});

// Vendor/Admin: Update booking status manually
export const updateStatus = mutation({
    args: { 
        bookingId: v.id("turfBookings"), 
        status: v.string(), // "pending" | "confirmed" | "completed" | "cancelled"
    },
    handler: async (ctx, args) => {
        const booking = await ctx.db.get(args.bookingId);
        if (!booking) throw new Error("Booking not found");

        await ctx.db.patch(args.bookingId, {
            bookingStatus: args.status,
        });
    },
});
