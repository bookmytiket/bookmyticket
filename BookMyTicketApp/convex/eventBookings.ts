import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByOrganiser = query({
    args: { organiserId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("eventBookings")
            .withIndex("by_organiserId", (q) => q.eq("organiserId", args.organiserId))
            .collect();
    },
});

export const getByEvent = query({
    args: { eventId: v.id("events") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("eventBookings")
            .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
            .collect();
    },
});

export const getAll = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("eventBookings").collect();
    },
});

export const create = mutation({
    args: {
        bookingId: v.id("bookings"),
        eventId: v.id("events"),
        organiserId: v.string(),
        customerName: v.string(),
        customerEmail: v.string(),
        ticketCount: v.number(),
        totalAmount: v.number(),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("eventBookings", {
            ...args,
            createdAt: Date.now(),
        });
    },
});
