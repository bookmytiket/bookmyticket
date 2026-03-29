import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByOrganiserId = query({
    args: { organiserId: v.string() },
    handler: async (ctx, args) => {
        const profile = await ctx.db
            .query("vendorProfiles")
            .withIndex("by_organiserId", (q) => q.eq("organiserId", args.organiserId))
            .unique();
        return profile;
    },
});

export const listByCategory = query({
    args: { category: v.string() },
    handler: async (ctx, args) => {
        const organisers = await ctx.db
            .query("organisers")
            .filter((q) => q.eq(q.field("category"), args.category))
            .collect();
            
        const results = [];
        for (const org of organisers) {
            const profile = await ctx.db
                .query("vendorProfiles")
                .withIndex("by_organiserId", (q) => q.eq("organiserId", org.userId))
                .unique();
            
            const reviews = await ctx.db
                .query("vendorReviews")
                .withIndex("by_vendorId", (q) => q.eq("vendorId", org.userId))
                .collect();
                
            const avgRating = reviews.length > 0
                ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
                : 0;

            if (profile) {
                results.push({
                    id: org.userId, // We use the email/userId as the public ID for now
                    name: org.name,
                    category: profile.category,
                    bio: profile.bio || "",
                    portfolio: profile.portfolio || [],
                    pricing: profile.pricing || [],
                    advancedSettings: profile.advancedSettings || {},
                    rating: avgRating,
                    reviewsCount: reviews.length
                });
            }
        }
        return results;
    }
});

export const getFullProfile = query({
    args: { organiserId: v.string() },
    handler: async (ctx, args) => {
        const organiser = await ctx.db
            .query("organisers")
            .withIndex("by_userId", (q) => q.eq("userId", args.organiserId))
            .unique();
        
        if (!organiser) return null;

        const vendorProfile = await ctx.db
            .query("vendorProfiles")
            .withIndex("by_organiserId", (q) => q.eq("organiserId", args.organiserId))
            .unique();

        return {
            organiser,
            vendorProfile,
        };
    },
});

export const updateProfile = mutation({
    args: {
        organiserId: v.string(),
        category: v.string(),
        bio: v.optional(v.string()),
        portfolio: v.optional(v.array(v.object({
            url: v.string(),
            type: v.string(),
            category: v.optional(v.string()),
            beforeAfter: v.optional(v.boolean()),
            tags: v.optional(v.array(v.string())),
            isTopDesign: v.optional(v.boolean()),
        }))),
        pricing: v.optional(v.any()),
        availability: v.optional(v.any()),
        blockedDates: v.optional(v.array(v.string())),
        advancedSettings: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const { organiserId, ...updates } = args;
        const existing = await ctx.db
            .query("vendorProfiles")
            .withIndex("by_organiserId", (q) => q.eq("organiserId", organiserId))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, {
                ...updates,
                updatedAt: Date.now(),
            });
            return existing._id;
        } else {
            const id = await ctx.db.insert("vendorProfiles", {
                organiserId,
                ...updates,
                updatedAt: Date.now(),
            });
            return id;
        }
    },
});

export const getStats = query({
    args: { vendorId: v.string() },
    handler: async (ctx, args) => {
        const bookings = await ctx.db
            .query("vendorBookings")
            .withIndex("by_vendorId", (q) => q.eq("vendorId", args.vendorId))
            .collect();
        
        const reviews = await ctx.db
            .query("vendorReviews")
            .withIndex("by_vendorId", (q) => q.eq("vendorId", args.vendorId))
            .collect();

        const totalBookings = bookings.length;
        const totalEarnings = bookings
            .filter(b => b.status === "completed")
            .reduce((acc, b) => acc + b.totalAmount, 0);
        
        const upcomingJobs = bookings.filter(b => b.status === "confirmed").length;
        
        const avgRating = reviews.length > 0
            ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
            : 0;

        return {
            totalBookings,
            totalEarnings,
            upcomingJobs,
            avgRating,
        };
    },
});
