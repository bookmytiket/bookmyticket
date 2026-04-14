import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
const crypto = (globalThis as any).crypto;

async function hashPassword(password: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const list = query({
    args: { category: v.optional(v.string()) },
    handler: async (ctx, args) => {
        let q = ctx.db.query("organisers");
        const results = await q.collect();
        if (args.category) {
            return results.filter(org => org.category === args.category);
        }
        return results;
    },
});

export const listApprovedByServiceCategory = query({
    args: { category: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("organisers")
            .filter((q) => 
                q.and(
                    q.eq(q.field("kycStatus"), "Active"),
                    q.eq(q.field("category"), args.category)
                )
            )
            .collect();
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
        category: v.optional(v.string()),
        kycStatus: v.optional(v.string()), // 'Pending', 'Active', 'Banned', 'Rejected'
        walletBalance: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const userId = args.userId.trim().toLowerCase();
        // Check if organiser already exists
        const existing = await ctx.db
            .query("organisers")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .unique();
        if (existing) {
            return existing._id;
        }
        const hashedPassword = args.password ? await hashPassword(args.password) : undefined;
        const id = await ctx.db.insert("organisers", { ...args, password: hashedPassword });
        return id;
    },
});

export const patch = mutation({
    args: {
        id: v.id("organisers"),
        name: v.optional(v.string()),
        password: v.optional(v.string()),
        kycStatus: v.optional(v.string()),
        category: v.optional(v.string()),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        lat: v.optional(v.number()),
        lng: v.optional(v.number()),
        walletBalance: v.optional(v.number()),
        kycDetails: v.optional(
            v.object({
                aadharFile: v.string(),
                accountNumber: v.string(),
                accountType: v.string(),
                address: v.string(),
                agreementAccepted: v.boolean(),
                alternateNumber: v.optional(v.string()),
                bankName: v.string(),
                beneficiaryName: v.string(),
                category: v.string(),
                chequeFile: v.string(),
                city: v.string(),
                designation: v.string(),
                email: v.string(),
                fullName: v.string(),
                gstin: v.optional(v.string()),
                hasITR: v.boolean(),
                hasOSTIN: v.boolean(),
                ifscCode: v.string(),
                mobile: v.string(),
                panFile: v.string(),
                panNumber: v.string(),
                socialMediaLink: v.optional(v.string()),
                websiteLink: v.optional(v.string()),
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
        lat: v.optional(v.number()),
        lng: v.optional(v.number()),
        kycDetails: v.object({
            category: v.optional(v.string()),
            panNumber: v.optional(v.string()),
            socialMediaLink: v.optional(v.string()),
            hasITR: v.optional(v.boolean()),
            fullName: v.optional(v.string()),
            email: v.optional(v.string()),
            mobile: v.optional(v.string()),
            alternateNumber: v.optional(v.string()),
            designation: v.optional(v.string()),
            city: v.optional(v.string()),
            address: v.optional(v.string()),
            websiteLink: v.optional(v.string()),
            hasOSTIN: v.optional(v.boolean()),
            gstin: v.optional(v.string()),
            panFile: v.optional(v.string()),
            chequeFile: v.optional(v.string()),
            aadharFile: v.optional(v.string()),
            beneficiaryName: v.optional(v.string()),
            accountType: v.optional(v.string()),
            bankName: v.optional(v.string()),
            accountNumber: v.optional(v.string()),
            ifscCode: v.optional(v.string()),
            agreementAccepted: v.boolean(),
        }),
    },
    handler: async (ctx, args) => {
        const { id, lat, lng, kycDetails } = args;
        await ctx.db.patch(id, {
            kycStatus: "Submitted", // Moves to "Under Review" / "KYC Verified" tab
            lat,
            lng,
            kycDetails: kycDetails,
        });
    },
});

export const listByStage = query({
    args: { category: v.string(), stage: v.string() }, // stage: 'requests', 'pending', 'review', 'active', 'banned'
    handler: async (ctx, args) => {
        const { category, stage } = args;
        const query = ctx.db.query("organisers");
        
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



export const verifyCredentials = query({
    args: { identifier: v.string(), password: v.string() },
    handler: async (ctx, args) => {
        const identifier = args.identifier.trim().toLowerCase();
        const organiser = await ctx.db
            .query("organisers")
            .withIndex("by_userId", (q) => q.eq("userId", identifier))
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
            (org) => org.name === identifier && org.password === args.password
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

export const verifyVendorCredentials = query({
    args: { identifier: v.string(), password: v.string() },
    handler: async (ctx, args) => {
        const identifier = args.identifier.trim().toLowerCase();
        const provider = await ctx.db
            .query("serviceProviders")
            .withIndex("by_userId", (q) => q.eq("userId", identifier))
            .unique();

        if (provider && provider.password === args.password) {
            if (provider.kycStatus === "Banned" || provider.kycStatus === "Rejected") {
                return { success: false, error: "Account is restricted." };
            }
            return { success: true, organiser: provider };
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

export const fixSriharini = mutation({
    args: {},
    handler: async (ctx) => {
        const org = await ctx.db
            .query("organisers")
            .withIndex("by_userId", (q) => q.eq("userId", "sriharini15501@gmail.com"))
            .unique();
        if (org) {
            await ctx.db.patch(org._id, { 
                category: "Mehendi Artist",
                kycStatus: "KYC Pending" 
            });
            return "Fixed";
        }
        return "Not found";
    },
});

export const removeSpecificUsers = mutation({
    args: {},
    handler: async (ctx) => {
        const emailsToDelete = [
            "sriharini15501@gmail.com",
            "mehendi@bookmyticket.com",
            "test@gmail.com",
            "madhu662008@gmail.com"
        ];
        let count = 0;
        for (const email of emailsToDelete) {
            const org = await ctx.db
                .query("organisers")
                .withIndex("by_userId", (q) => q.eq("userId", email))
                .unique();
            if (org) {
                await ctx.db.delete(org._id);
                count++;
            }
        }
        return { deleted: count };
    },
});

export const normalizeExistingOrganisers = mutation({
    args: {},
    handler: async (ctx) => {
        const organisers = await ctx.db.query("organisers").collect();
        const serviceKeywords = ["mehandi", "mehendi", "photograph", "makeup", "artist", "personal service", "studio", "decorator", "catering", "turf"];
        
        let count = 0;
        for (const org of organisers) {
            if (!org.type) {
                const cat = (org.category || org.kycDetails?.category || "").toLowerCase();
                const type = serviceKeywords.some(k => cat.includes(k)) 
                    ? "professional_service" 
                    : "event_organiser";
                
                await ctx.db.patch(org._id, { type });
                count++;
            }
        }
        return { normalized: count };
    },
});
