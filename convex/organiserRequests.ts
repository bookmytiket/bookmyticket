import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Mutation to handle organiser requests

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

export const approve = mutation({
    args: { id: v.id("organiserRequests") },
    handler: async (ctx, args) => {
        const request = await ctx.db.get(args.id);
        if (!request) throw new Error("Request not found");
        if (request.status !== "Pending") throw new Error("Request is not pending");

        // Generate a random 8-character temporary password
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
        let tempPassword = "";
        for (let i = 0; i < 8; i++) {
            tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // Create the organiser account
        await ctx.db.insert("organisers", {
            userId: request.email,
            password: tempPassword,
            name: `${request.firstName} ${request.lastName}`,
            kycStatus: "Start Onboarding",
            walletBalance: 0,
        });

        // Update the request status
        await ctx.db.patch(args.id, { status: "Approved" });

        return tempPassword;
    },
});
