import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const get = query({
    handler: async (ctx) => {
        return await ctx.db.query("seoSettings").first();
    },
});

export const update = mutation({
    args: {
        id: v.optional(v.id("seoSettings")),
        globalTitle: v.string(),
        globalKeywords: v.string(),
        globalDescription: v.string(),
        metaAdsCode: v.string(),
    },
    handler: async (ctx, args) => {
        const { id, ...settings } = args;
        if (id) {
            await ctx.db.patch(id, { ...settings, updatedAt: Date.now() });
        } else {
            const existing = await ctx.db.query("seoSettings").first();
            if (existing) {
                await ctx.db.patch(existing._id, { ...settings, updatedAt: Date.now() });
            } else {
                await ctx.db.insert("seoSettings", { ...settings, updatedAt: Date.now() });
            }
        }
    },
});
