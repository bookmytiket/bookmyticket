import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const get = query({
    handler: async (ctx) => {
        return await ctx.db.query("ssoSettings").first();
    },
});

export const update = mutation({
    args: {
        id: v.optional(v.id("ssoSettings")),
        facebookEnabled: v.boolean(),
        googleEnabled: v.boolean(),
        facebookConfig: v.any(),
        googleConfig: v.any(),
    },
    handler: async (ctx, args) => {
        const { id, ...settings } = args;
        if (id) {
            await ctx.db.patch(id, { ...settings, updatedAt: Date.now() });
        } else {
            const existing = await ctx.db.query("ssoSettings").first();
            if (existing) {
                await ctx.db.patch(existing._id, { ...settings, updatedAt: Date.now() });
            } else {
                await ctx.db.insert("ssoSettings", { ...settings, updatedAt: Date.now() });
            }
        }
    },
});
