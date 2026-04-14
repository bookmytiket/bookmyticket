import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
    args: { category: v.optional(v.string()) },
    handler: async (ctx, args) => {
        let q = ctx.db.query("serviceProviders");
        const results = await q.collect();
        if (args.category) {
            return results.filter(sp => sp.category === args.category);
        }
        return results;
    },
});

export const get = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("serviceProviders")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .unique();
    },
});

export const patch = mutation({
    args: {
        id: v.id("serviceProviders"),
        name: v.optional(v.string()),
        password: v.optional(v.string()),
        kycStatus: v.optional(v.string()),
        category: v.optional(v.string()),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        lat: v.optional(v.number()),
        lng: v.optional(v.number()),
        walletBalance: v.optional(v.number()),
        kycDetails: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, updates);
    },
});

export const listByStage = query({
    args: { category: v.string(), stage: v.string() }, // stage: 'requests', 'pending', 'review', 'active', 'banned'
    handler: async (ctx, args) => {
        const { category, stage } = args;
        const query = ctx.db.query("serviceProviders");
        
        if (stage === 'pending') {
            return await query
                .withIndex("by_kycStatus", (q) => q.eq("kycStatus", "KYC Pending"))
                .filter((q) => q.eq(q.field("category"), category))
                .collect();
        }
        if (stage === 'review') {
            return await query
                .withIndex("by_kycStatus", (q) => q.eq("kycStatus", "Submitted"))
                .filter((q) => q.eq(q.field("category"), category))
                .collect();
        }
        if (stage === 'active') {
            return await query
                .withIndex("by_kycStatus", (q) => q.eq("kycStatus", "KYC Completed"))
                .filter((q) => q.eq(q.field("category"), category))
                .collect();
        }
        if (stage === 'banned') {
            return await query
                .withIndex("by_kycStatus", (q) => q.eq("kycStatus", "Banned"))
                .filter((q) => q.eq(q.field("category"), category))
                .collect();
        }
        return await query.withIndex("by_category", (q) => q.eq("category", category)).collect();
    },
});

export const remove = mutation({
    args: { id: v.id("serviceProviders") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
