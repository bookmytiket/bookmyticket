import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
