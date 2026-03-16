import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("feeSettings").order("desc").first();
    },
});

export const update = mutation({
    args: {
        convenienceFeeType: v.string(),
        convenienceFeeValue: v.number(),
        gstPercent: v.number(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db.query("feeSettings").first();
        if (existing) {
            await ctx.db.patch(existing._id, { ...args, updatedAt: Date.now() });
        } else {
            await ctx.db.insert("feeSettings", { ...args, updatedAt: Date.now() });
        }
    },
});
