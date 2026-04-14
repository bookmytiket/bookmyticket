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
        const targetCat = args.category.trim();
        let organisers;
        
        if (targetCat === "" || targetCat === "All Services") {
            organisers = await ctx.db.query("serviceProviders").collect();
        } else {
            organisers = await ctx.db
                .query("serviceProviders")
                .withIndex("by_category", (q) => q.eq("category", targetCat))
                .collect();
        }
            
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
                    id: org.userId, 
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

// Paginated version: returns { vendors, total } for a given category + page
export const listByCategoryPaginated = query({
    args: {
        category: v.string(),
        page: v.number(),      // 1-based
        pageSize: v.number(),  // items per page, e.g. 16
    },
    handler: async (ctx, args) => {
        const targetCat = args.category.trim();
        let organisers;

        if (targetCat === "" || targetCat === "All Services") {
            organisers = await ctx.db.query("serviceProviders").collect();
        } else {
            organisers = await ctx.db
                .query("serviceProviders")
                .withIndex("by_category", (q) => q.eq("category", targetCat))
                .collect();
        }

        const total = organisers.length;
        const start = (args.page - 1) * args.pageSize;
        const pageOrgs = organisers.slice(start, start + args.pageSize);

        const vendors = [];
        for (const org of pageOrgs) {
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

            vendors.push({
                id: org.userId,
                name: org.name,
                category: profile?.category || org.category || "",
                bio: profile?.bio || "",
                portfolio: profile?.portfolio || [],
                pricing: profile?.pricing || [],
                advancedSettings: profile?.advancedSettings || {},
                rating: avgRating,
                reviewsCount: reviews.length,
            });
        }

        return { vendors, total };
    },
});

export const getFullProfile = query({
    args: { organiserId: v.string() },
    handler: async (ctx, args) => {
        const organiser = await ctx.db
            .query("serviceProviders")
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
        } else {
            await ctx.db.insert("vendorProfiles", {
                organiserId,
                ...updates,
                updatedAt: Date.now(),
            });
        }

        // Sync category to serviceProviders table to maintain single source of truth for filtering
        const org = await ctx.db
            .query("serviceProviders")
            .withIndex("by_userId", (q) => q.eq("userId", organiserId))
            .unique();
        if (org) {
            await ctx.db.patch(org._id, { category: updates.category });
        }
        
        return organiserId;
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

export const getActiveVendors = query({
    args: {},
    handler: async (ctx) => {
        const vendorProfiles = await ctx.db.query("vendorProfiles").collect();
        const results = [];
        for (const profile of vendorProfiles) {
            const org = await ctx.db
                .query("serviceProviders")
                .withIndex("by_userId", (q) => q.eq("userId", profile.organiserId))
                .unique();
            
            if (org) {
                const reviews = await ctx.db
                    .query("vendorReviews")
                    .withIndex("by_vendorId", (q) => q.eq("vendorId", profile.organiserId))
                    .collect();
                    
                const avgRating = reviews.length > 0
                    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
                    : 0;

                results.push({
                    id: org.userId,
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
