import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getScans = query({
    args: {},
    handler: async (ctx) => {
        const scans = await ctx.db.query("pwaScans").collect();
        return Promise.all(
            scans.map(async (scan) => {
                const booking = await ctx.db.get(scan.bookingId);
                const event = await ctx.db.get(scan.eventId);
                return {
                    ...scan,
                    eventName: event ? event.title : "Unknown Event",
                    customerEmail: booking ? booking.userId : "Unknown",
                    ticketCount: booking ? booking.ticketCount : 0,
                };
            })
        );
    },
});

export const getScansByOrganiser = query({
    args: { organiserId: v.string() },
    handler: async (ctx, args) => {
        const scans = await ctx.db
            .query("pwaScans")
            .withIndex("by_organiserId", (q) => q.eq("organiserId", args.organiserId))
            .collect();
        return Promise.all(
            scans.map(async (scan) => {
                const booking = await ctx.db.get(scan.bookingId);
                const event = await ctx.db.get(scan.eventId);
                return {
                    ...scan,
                    eventName: event ? event.title : "Unknown Event",
                    customerEmail: booking ? booking.userId : "Unknown",
                    userName: booking?.customerDetails?.name || "Guest User",
                    ticketCount: booking ? booking.ticketCount : 0,
                };
            })
        );
    },
});

export const logScan = mutation({
    args: {
        bookingId: v.id("bookings"),
        eventId: v.id("events"),
        organiserId: v.string(),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("pwaScans", {
            ...args,
            scannedAt: Date.now(),
        });
    },
});
