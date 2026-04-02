import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listAll = query({
    handler: async (ctx) => {
        return await ctx.db.query("checkoutFooters").withIndex("by_order").collect();
    },
});

export const listActive = query({
    handler: async (ctx) => {
        return await ctx.db.query("checkoutFooters")
            .withIndex("by_isActive", (q) => q.eq("isActive", true))
            .collect()
            .then(items => items.sort((a, b) => a.order - b.order));
    },
});

export const add = mutation({
    args: {
        title: v.string(),
        description: v.string(),
        iconName: v.string(),
        redirectUrl: v.optional(v.string()),
        actionType: v.string(),
        modalContent: v.optional(v.string()),
        isActive: v.boolean(),
        order: v.number(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("checkoutFooters", args);
    },
});

export const update = mutation({
    args: {
        id: v.id("checkoutFooters"),
        title: v.string(),
        description: v.string(),
        iconName: v.string(),
        redirectUrl: v.optional(v.string()),
        actionType: v.string(),
        modalContent: v.optional(v.string()),
        isActive: v.boolean(),
        order: v.number(),
    },
    handler: async (ctx, args) => {
        const { id, ...rest } = args;
        await ctx.db.patch(id, rest);
    },
});

export const remove = mutation({
    args: { id: v.id("checkoutFooters") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const toggleActive = mutation({
    args: { id: v.id("checkoutFooters"), isActive: v.boolean() },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { isActive: args.isActive });
    },
});
