import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("organisers").collect();
    },
});

export const get = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("organisers")
            .filter((q) => q.eq(q.field("userId"), args.userId))
            .unique();
    },
});

export const create = mutation({
    args: {
        userId: v.string(), // acts as email/username
        password: v.optional(v.string()), // password for login
        name: v.string(),
        kycStatus: v.optional(v.string()), // 'Pending', 'Active', 'Banned', 'Rejected'
        walletBalance: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("organisers", args);
        return id;
    },
});

export const patch = mutation({
    args: {
        id: v.id("organisers"),
        name: v.optional(v.string()),
        password: v.optional(v.string()),
        kycStatus: v.optional(v.string()),
        walletBalance: v.optional(v.number()),
        kycDetails: v.optional(
            v.object({
                category: v.string(),
                panNumber: v.string(),
                socialMediaLink: v.optional(v.string()),
                hasITR: v.boolean(),
                fullName: v.string(),
                email: v.string(),
                mobile: v.string(),
                alternateNumber: v.optional(v.string()),
                designation: v.string(),
                city: v.string(),
                websiteLink: v.optional(v.string()),
                hasOSTIN: v.boolean(),
                panFile: v.string(),
                chequeFile: v.string(),
                aadharFile: v.string(),
                agreementAccepted: v.boolean(),
            })
        ),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, updates);
    },
});

export const remove = mutation({
    args: { id: v.id("organisers") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const submitKyc = mutation({
    args: {
        id: v.id("organisers"),
        kycDetails: v.object({
            category: v.string(),
            panNumber: v.string(),
            socialMediaLink: v.optional(v.string()),
            hasITR: v.boolean(),
            fullName: v.string(),
            email: v.string(),
            mobile: v.string(),
            alternateNumber: v.optional(v.string()),
            designation: v.string(),
            city: v.string(),
            websiteLink: v.optional(v.string()),
            hasOSTIN: v.boolean(),
            panFile: v.string(),
            chequeFile: v.string(),
            aadharFile: v.string(),
            agreementAccepted: v.boolean(),
        }),
    },
    handler: async (ctx, args) => {
        const { id, kycDetails } = args;
        await ctx.db.patch(id, {
            kycStatus: "KYC Pending",
            kycDetails: kycDetails,
        });
    },
});
