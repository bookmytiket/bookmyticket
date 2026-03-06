import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("paymentGateways").collect();
    },
});

export const add = mutation({
    args: {
        name: v.string(),
        isEnabled: v.boolean(),
        config: v.any(),
        testMode: v.boolean(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("paymentGateways", {
            name: args.name,
            isEnabled: args.isEnabled,
            config: args.config,
            testMode: args.testMode,
        });
    },
});

export const patch = mutation({
    args: {
        id: v.id("paymentGateways"),
        isEnabled: v.optional(v.boolean()),
        config: v.optional(v.any()),
        testMode: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const { id, ...fields } = args;
        return await ctx.db.patch(id, fields);
    },
});

export const remove = mutation({
    args: {
        id: v.id("paymentGateways"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.delete(args.id);
    },
});
