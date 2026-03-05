import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getConfig = query({
    args: { key: v.string() },
    handler: async (ctx, args) => {
        const config = await ctx.db
            .query("systemConfig")
            .filter((q) => q.eq(q.field("key"), args.key))
            .first();
        return config?.value;
    },
});

export const getAllConfig = query({
    args: {},
    handler: async (ctx) => {
        const configs = await ctx.db.query("systemConfig").collect();
        const configMap: Record<string, any> = {};
        for (const config of configs) {
            configMap[config.key] = config.value;
        }
        return configMap;
    },
});

export const setConfig = mutation({
    args: { key: v.string(), value: v.any() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("systemConfig")
            .filter((q) => q.eq(q.field("key"), args.key))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, { value: args.value });
        } else {
            await ctx.db.insert("systemConfig", { key: args.key, value: args.value });
        }
    },
});
