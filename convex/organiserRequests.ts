import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
    args: {
        firstName: v.string(),
        lastName: v.string(),
        email: v.string(),
        phone: v.string(),
        category: v.string(),
        role: v.string(),
        remarks: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("organiserRequests", {
            ...args,
            status: "Pending",
            createdAt: Date.now(),
        });
    },
});

export const list = query({
    handler: async (ctx) => {
        return await ctx.db.query("organiserRequests").order("desc").collect();
    },
});

export const updateStatus = mutation({
    args: {
        id: v.id("organiserRequests"),
        status: v.string(), // "Approved" or "Rejected"
    },
    handler: async (ctx, args) => {
        return await ctx.db.patch(args.id, { status: args.status });
    },
});
