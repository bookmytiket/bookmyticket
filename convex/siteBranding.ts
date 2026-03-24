import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("siteBranding").first();
    },
});

export const getUrl = query({
    args: { storageId: v.id("_storage") },
    handler: async (ctx, args) => {
        return await ctx.storage.getUrl(args.storageId);
    },
});

export const update = mutation({
    args: {
        name: v.string(),
        logoColor: v.string(),
        logoUrl: v.string(),
        siteUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db.query("siteBranding").first();
        if (existing) {
            await ctx.db.patch(existing._id, { ...args, updatedAt: Date.now() });
        } else {
            await ctx.db.insert("siteBranding", { ...args, updatedAt: Date.now() });
        }
    },
});
