import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const get = query({
    handler: async (ctx) => {
        return await ctx.db.query("emailSettings").first();
    },
});

export const update = mutation({
    args: {
        id: v.optional(v.id("emailSettings")),
        host: v.string(),
        port: v.number(),
        user: v.string(),
        pass: v.string(),
        from: v.string(),
    },
    handler: async (ctx, args) => {
        const { id, ...settings } = args;
        if (id) {
            await ctx.db.patch(id, { ...settings, updatedAt: Date.now() });
        } else {
            const existing = await ctx.db.query("emailSettings").first();
            if (existing) {
                await ctx.db.patch(existing._id, { ...settings, updatedAt: Date.now() });
            } else {
                await ctx.db.insert("emailSettings", { ...settings, updatedAt: Date.now() });
            }
        }
    },
});
