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
        provider: v.optional(v.string()),
        host: v.optional(v.string()),
        port: v.optional(v.number()),
        user: v.optional(v.string()),
        pass: v.optional(v.string()),
        from: v.string(),
        fromName: v.optional(v.string()),
        encryption: v.optional(v.string()),
        authMethod: v.optional(v.string()),
        microsoft365: v.optional(v.object({
            clientId: v.string(),
            tenantId: v.string(),
            clientSecret: v.string(),
            status: v.optional(v.string()),
        })),
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
