import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("supportTickets").collect();
    },
});

export const create = mutation({
    args: {
        userId: v.string(),
        issue: v.string(),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("supportTickets", args);
    },
});

export const updateStatus = mutation({
    args: {
        id: v.id("supportTickets"),
        status: v.optional(v.string()),
        adminNotes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
    },
});

export const remove = mutation({
    args: { id: v.id("supportTickets") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
