import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("promotions").collect();
    },
});

export const create = mutation({
    args: {
        code: v.string(),
        type: v.string(),
        value: v.string(),
        bogo: v.optional(v.boolean()),
        validUntil: v.optional(v.string()),
        usage: v.optional(v.number()),
        active: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("promotions", { ...args, usage: args.usage ?? 0, active: args.active ?? true });
    },
});

export const remove = mutation({
    args: { id: v.id("promotions") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const patch = mutation({
    args: {
        id: v.id("promotions"),
        active: v.optional(v.boolean()),
        usage: v.optional(v.number()),
        validUntil: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, updates);
    },
});
