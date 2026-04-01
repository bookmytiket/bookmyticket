import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
    handler: async (ctx) => {
        return await ctx.db.query("whatsappSettings").filter(q => q.eq(q.field("isActive"), true)).first();
    },
});

export const update = mutation({
    args: {
        provider: v.string(),
        accountSid: v.optional(v.string()),
        authToken: v.optional(v.string()),
        fromNumber: v.optional(v.string()),
        apiKey: v.optional(v.string()),
        isActive: v.boolean(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db.query("whatsappSettings").first();
        if (existing) {
            await ctx.db.patch(existing._id, { ...args, updatedAt: Date.now() });
        } else {
            await ctx.db.insert("whatsappSettings", { ...args, updatedAt: Date.now() });
        }
    },
});
