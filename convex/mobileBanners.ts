import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Generate upload URL for video or image files
export const generateUploadUrl = mutation(async (ctx) => {
    return await ctx.storage.generateUploadUrl();
});

// Admin: Get all banners
export const getAll = query({
    args: {},
    handler: async (ctx) => {
        const banners = await ctx.db.query("mobileVideoBanners").order("desc").collect();
        // Sort by order ascending
        return banners.sort((a, b) => a.order - b.order);
    },
});

// Mobile App: Get active banners
export const getActive = query({
    args: {},
    handler: async (ctx) => {
        const banners = await ctx.db
            .query("mobileVideoBanners")
            .withIndex("by_isActive", (q) => q.eq("isActive", true))
            .collect();
        const sorted = banners.sort((a, b) => a.order - b.order);
        
        return Promise.all(
            sorted.map(async (banner) => {
                if (banner.storageId) {
                    const url = await ctx.storage.getUrl(banner.storageId);
                    return { ...banner, resolvedUrl: url };
                }
                return { ...banner, resolvedUrl: banner.mediaUrl };
            })
        );
    },
});

export const create = mutation({
    args: {
        type: v.string(), // "video" | "image"
        mediaUrl: v.string(),
        storageId: v.optional(v.id("_storage")),
        title: v.optional(v.string()),
        order: v.number(),
        isActive: v.boolean(),
    },
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("mobileVideoBanners", {
            ...args,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        return id;
    },
});

export const update = mutation({
    args: {
        id: v.id("mobileVideoBanners"),
        type: v.string(),
        mediaUrl: v.string(),
        storageId: v.optional(v.id("_storage")),
        title: v.optional(v.string()),
        order: v.number(),
        isActive: v.boolean(),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, {
            ...updates,
            updatedAt: Date.now(),
        });
        return true;
    },
});

export const remove = mutation({
    args: { id: v.id("mobileVideoBanners") },
    handler: async (ctx, args) => {
        const banner = await ctx.db.get(args.id);
        if (!banner) return false;
        
        // Delete associated storage if it exists
        if (banner.storageId) {
            await ctx.storage.delete(banner.storageId);
        }
        
        await ctx.db.delete(args.id);
        return true;
    },
});

export const toggleStatus = mutation({
    args: { id: v.id("mobileVideoBanners"), isActive: v.boolean() },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            isActive: args.isActive,
            updatedAt: Date.now(),
        });
        return true;
    },
});

export const reorder = mutation({
    args: {
        items: v.array(
            v.object({
                id: v.id("mobileVideoBanners"),
                order: v.number(),
            })
        ),
    },
    handler: async (ctx, args) => {
        for (const item of args.items) {
            await ctx.db.patch(item.id, {
                order: item.order,
                updatedAt: Date.now(),
            });
        }
        return true;
    },
});
