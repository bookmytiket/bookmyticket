import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
    args: {
        type: v.string(),
        message: v.string(),
        details: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("systemLogs", {
            ...args,
            timestamp: Date.now(),
        });
    },
});

export const getLatest = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const limit = args.limit || 50;
        return await ctx.db
            .query("systemLogs")
            .withIndex("by_timestamp")
            .order("desc")
            .take(limit);
    },
});

export const getByType = query({
    args: { type: v.string(), limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const limit = args.limit || 50;
        return await ctx.db
            .query("systemLogs")
            .withIndex("by_type", (q) => q.eq("type", args.type))
            .order("desc")
            .take(limit);
    },
});
