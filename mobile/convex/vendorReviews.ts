import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getVendorReviews = query({
    args: { vendorId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("vendorReviews")
            .withIndex("by_vendorId", (q) => q.eq("vendorId", args.vendorId))
            .order("desc")
            .collect();
    },
});

export const respondToReview = mutation({
    args: { id: v.id("vendorReviews"), response: v.string() },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { response: args.response });
    },
});

export const submitReview = mutation({
    args: {
        vendorId: v.string(),
        userId: v.string(),
        rating: v.number(),
        comment: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("vendorReviews", {
            ...args,
            createdAt: Date.now(),
        });
    },
});
