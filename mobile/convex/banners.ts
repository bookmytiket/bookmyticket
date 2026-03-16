import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// --- Packages ---

export const getPackages = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("bannerPackages").collect();
    },
});

export const seedPackages = mutation({
    args: {},
    handler: async (ctx) => {
        const existing = await ctx.db.query("bannerPackages").collect();
        if (existing.length > 0) return;

        const packages = [
            { name: "Weekly", price: 500, durationDays: 7, type: "hero" },
            { name: "Monthly", price: 1500, durationDays: 30, type: "hero" },
            { name: "Yearly", price: 15000, durationDays: 365, type: "hero" },
        ];

        for (const pkg of packages) {
            await ctx.db.insert("bannerPackages", pkg);
        }
    },
});

// --- Banner Requests (User) ---

export const requestBanner = mutation({
    args: {
        userId: v.string(),
        packageId: v.id("bannerPackages"),
        firstName: v.string(),
        lastName: v.string(),
        email: v.string(),
        phone: v.string(),
        link: v.optional(v.string()), // Kept as optional for backend flexibility
        imageStorageId: v.optional(v.string()), // Base64 data from frontend
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("heroBanners", {
            ...args,
            status: "pending_payment", // Initial state
            createdAt: Date.now(),
        });
    },
});

export const finalizePayment = mutation({
    args: { id: v.id("heroBanners") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            status: "pending", // Now moves to Admin review
        });
    },
});

// --- Admin Actions ---

export const getPendingRequests = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("heroBanners")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .collect();
    },
});

export const getAllBanners = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("heroBanners").collect();
    },
});

export const approveBanner = mutation({
    args: {
        id: v.id("heroBanners"),
        imageUrl: v.string(),
        link: v.optional(v.string()),
        durationDays: v.number(),
    },
    handler: async (ctx, args) => {
        const startDate = Date.now();
        const endDate = startDate + args.durationDays * 24 * 60 * 60 * 1000;

        await ctx.db.patch(args.id, {
            imageUrl: args.imageUrl,
            link: args.link,
            startDate,
            endDate,
            status: "approved",
        });
    },
});

export const deleteBanner = mutation({
    args: { id: v.id("heroBanners") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

// --- Public Display ---

export const getActiveBanners = query({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const banners = await ctx.db
            .query("heroBanners")
            .withIndex("by_status", (q) => q.eq("status", "approved"))
            .collect();

        // Filter by date range and handle auto-expiration logic
        return banners.filter((b) => {
            if (b.endDate && b.endDate < now) {
                // Technically we could patch them to "expired" here, but Convex queries shouldn't have side effects.
                // We'll just filter them out for now.
                return false;
            }
            return true;
        });
    },
});
