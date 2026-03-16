import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("apiKeys").order("desc").collect();
    },
});

export const create = mutation({
    args: {
        label: v.string(),
        key: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("apiKeys", {
            label: args.label,
            key: args.key,
            status: "Active",
            createdAt: Date.now(),
        });
    },
});

export const toggleStatus = mutation({
    args: {
        id: v.id("apiKeys"),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.patch(args.id, {
            status: args.status,
        });
    },
});

export const remove = mutation({
    args: {
        id: v.id("apiKeys"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.delete(args.id);
    },
});
