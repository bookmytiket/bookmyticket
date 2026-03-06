import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const get = query({
    handler: async (ctx) => {
        return await ctx.db.query("policies").first();
    },
});

export const update = mutation({
    args: {
        id: v.optional(v.id("policies")),
        bookingHeader: v.string(),
        paymentTerms: v.string(),
        eventDisclaimer: v.string(),
        cancellationPolicy: v.string(),
    },
    handler: async (ctx, args) => {
        const { id, ...settings } = args;
        if (id) {
            await ctx.db.patch(id, { ...settings, updatedAt: Date.now() });
        } else {
            const existing = await ctx.db.query("policies").first();
            if (existing) {
                await ctx.db.patch(existing._id, { ...settings, updatedAt: Date.now() });
            } else {
                await ctx.db.insert("policies", { ...settings, updatedAt: Date.now() });
            }
        }
    },
});
