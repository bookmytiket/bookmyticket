import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getScans = query({
    args: {},
    handler: async (ctx) => {
        const scans = await ctx.db.query("pwaScans").collect();
        return Promise.all(
            scans.map(async (scan) => {
                const booking = (await ctx.db.get(scan.bookingId)) as any;
                const validEventId = ctx.db.normalizeId("events", scan.eventId);
                const event = validEventId !== null ? (await ctx.db.get(validEventId)) as any : null;
                return {
                    ...scan,
                    eventName: event && event.title ? event.title : "Static Event",
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
                const booking = (await ctx.db.get(scan.bookingId)) as any;
                const validEventId = ctx.db.normalizeId("events", scan.eventId);
                const event = validEventId !== null ? (await ctx.db.get(validEventId)) as any : null;
                return {
                    ...scan,
                    eventName: event && event.title ? event.title : "Static Event",
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
        eventId: v.string(), // relaxed from v.id("events")
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

export const validateAndLogScan = mutation({
    args: {
        bookingId: v.id("bookings"),
        eventId: v.string(),
        organiserId: v.string(),
    },
    handler: async (ctx, args) => {
        const booking = await ctx.db.get(args.bookingId);

        if (!booking) {
            await ctx.db.insert("pwaScans", { ...args, status: "invalid", scannedAt: Date.now() });
            return { success: false, message: "Ticket not found" };
        }

        if (args.eventId !== "manual_or_scan" && booking.eventId !== args.eventId) {
            await ctx.db.insert("pwaScans", { ...args, status: "invalid", scannedAt: Date.now() });
            return { success: false, message: "Ticket is for a different event" };
        }

        if (booking.scanned) {
            await ctx.db.insert("pwaScans", { ...args, status: "already_used", scannedAt: Date.now() });
            return { success: false, message: "Ticket already used" };
        }

        await ctx.db.patch(args.bookingId, { scanned: true, scannedAt: Date.now() });
        await ctx.db.insert("pwaScans", { ...args, status: "valid", scannedAt: Date.now() });

        return { success: true, message: "Ticket validated successfully! Checked in." };
    }
});
