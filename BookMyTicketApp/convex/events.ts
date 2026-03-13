import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getActiveEvents = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("events").collect();
    },
});

export const getOrganiserEvents = query({
    args: { organiserId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("events")
            .filter((q) => q.eq(q.field("organiserId"), args.organiserId))
            .collect();
    },
});

export const createEvent = mutation({
    args: {
        organiserId: v.string(),
        title: v.string(),
        category: v.optional(v.string()),
        type: v.optional(v.string()),
        date: v.optional(v.string()),
        time: v.optional(v.string()),
        img: v.optional(v.string()),
        bannerPreview: v.optional(v.string()),
        seatingEnabled: v.optional(v.boolean()),
        totalSeats: v.optional(v.number()),
        price: v.optional(v.number()),
        location: v.optional(v.string()),
        venue: v.optional(v.string()),
        address: v.optional(v.string()),
        featured: v.optional(v.boolean()),
        trending: v.optional(v.boolean()),
        spotlight: v.optional(v.boolean()),
        exclusive: v.optional(v.boolean()),
        environment: v.optional(v.string()),
        description: v.optional(v.string()),
        meetingUrl: v.optional(v.string()),
        rows: v.optional(v.number()),
        cols: v.optional(v.number()),
        normalTicketCapacity: v.optional(v.number()),
        normalTicketPrice: v.optional(v.number()),
        virtual: v.optional(v.boolean()),
        seatCategories: v.optional(v.array(v.object({
            name: v.string(),
            price: v.number(),
            rows: v.number(),
            isFree: v.optional(v.boolean()),
        }))),
        dateSlots: v.optional(v.array(v.object({
            date: v.string(),
            time: v.string(),
        }))),
        layoutType: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("events", args);
    },
});

export const deleteEvent = mutation({
    args: { id: v.id("events") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const updateEvent = mutation({
    args: {
        id: v.id("events"),
        title: v.optional(v.string()),
        category: v.optional(v.string()),
        type: v.optional(v.string()),
        date: v.optional(v.string()),
        time: v.optional(v.string()),
        img: v.optional(v.string()),
        bannerPreview: v.optional(v.string()),
        seatingEnabled: v.optional(v.boolean()),
        totalSeats: v.optional(v.number()),
        price: v.optional(v.number()),
        location: v.optional(v.string()),
        venue: v.optional(v.string()),
        address: v.optional(v.string()),
        status: v.optional(v.string()),
        environment: v.optional(v.string()),
        description: v.optional(v.string()),
        meetingUrl: v.optional(v.string()),
        rows: v.optional(v.number()),
        cols: v.optional(v.number()),
        normalTicketCapacity: v.optional(v.number()),
        normalTicketPrice: v.optional(v.number()),
        virtual: v.optional(v.boolean()),
        seatCategories: v.optional(v.array(v.object({
            name: v.string(),
            price: v.number(),
            rows: v.number(),
            isFree: v.optional(v.boolean()),
        }))),
        dateSlots: v.optional(v.array(v.object({
            date: v.string(),
            time: v.string(),
        }))),
        layoutType: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, updates);
    },
});
