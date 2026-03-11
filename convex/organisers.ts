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
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
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
        // Check if organiser already exists
        const existing = await ctx.db
            .query("organisers")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .unique();
        if (existing) {
            return existing._id;
        }
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

export const approveRequest = mutation({
    args: { id: v.id("organiserRequests"), password: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const request = await ctx.db.get(args.id);
        if (!request) throw new Error("Request not found");
        if (request.status !== "Pending") throw new Error("Request is not pending");

        // Check if organiser already exists
        const existing = await ctx.db
            .query("organisers")
            .withIndex("by_userId", (q) => q.eq("userId", request.email))
            .unique();
        if (existing) {
            await ctx.db.patch(args.id, { status: "Approved" });
            return "Already Approved";
        }

        // Generate a random 8-character temporary password if none provided
        let tempPassword = args.password;
        if (!tempPassword) {
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
            tempPassword = "";
            for (let i = 0; i < 8; i++) {
                tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
            }
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

export const verifyCredentials = query({
    args: { identifier: v.string(), password: v.string() },
    handler: async (ctx, args) => {
        const trimmedIdentifier = args.identifier.trim();
        const organiser = await ctx.db
            .query("organisers")
            .withIndex("by_userId", (q) => q.eq("userId", trimmedIdentifier))
            .unique();

        if (organiser && organiser.password === args.password) {
            if (organiser.kycStatus === "Banned" || organiser.kycStatus === "Rejected") {
                return { success: false, error: "Account is restricted." };
            }
            return { success: true, organiser };
        }

        // Check by name if ID didn't match (logic from AuthContext)
        const allOrganisers = await ctx.db.query("organisers").collect();
        const nameMatch = allOrganisers.find(
            (org) => org.name === trimmedIdentifier && org.password === args.password
        );

        if (nameMatch) {
            if (nameMatch.kycStatus === "Banned" || nameMatch.kycStatus === "Rejected") {
                return { success: false, error: "Account is restricted." };
            }
            return { success: true, organiser: nameMatch };
        }

        return { success: false, error: "Invalid email/username or password." };
    },
});

export const cleanupDuplicates = mutation({
    args: {},
    handler: async (ctx) => {
        const organisers = await ctx.db.query("organisers").collect();
        const seen = new Set();
        const toDelete = [];
        for (const org of organisers) {
            if (seen.has(org.userId)) {
                toDelete.push(org._id);
            } else {
                seen.add(org.userId);
            }
        }
        for (const id of toDelete) {
            await ctx.db.delete(id);
        }
        return { deleted: toDelete.length };
    },
});
