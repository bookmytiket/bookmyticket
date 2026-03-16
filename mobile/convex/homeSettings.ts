import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Home Sections
export const getHomeSections = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("homeSections").first();
    },
});

export const updateHomeSections = mutation({
    args: { order: v.array(v.string()) },
    handler: async (ctx, args) => {
        const existing = await ctx.db.query("homeSections").first();
        if (existing) {
            await ctx.db.patch(existing._id, { order: args.order, updatedAt: Date.now() });
        } else {
            await ctx.db.insert("homeSections", { order: args.order, updatedAt: Date.now() });
        }
    },
});

// Banner Slides
export const getBannerSlides = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("bannerSlides").order("asc").collect();
    },
});

export const addBannerSlide = mutation({
    args: {
        img: v.string(),
        title: v.string(),
        sub: v.string(),
        alt: v.string(),
        url: v.string(),
        order: v.number(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("bannerSlides", { ...args, updatedAt: Date.now() });
    },
});

export const updateBannerSlide = mutation({
    args: {
        id: v.id("bannerSlides"),
        img: v.optional(v.string()),
        title: v.optional(v.string()),
        sub: v.optional(v.string()),
        alt: v.optional(v.string()),
        url: v.optional(v.string()),
        order: v.optional(v.number()),
    },
    handler: async (ctx, { id, ...args }) => {
        await ctx.db.patch(id, { ...args, updatedAt: Date.now() });
    },
});

export const removeBannerSlide = mutation({
    args: { id: v.id("bannerSlides") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

// Event Partners
export const getEventPartners = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("eventPartners").order("asc").collect();
    },
});

export const addEventPartner = mutation({
    args: {
        name: v.string(),
        logo: v.string(),
        url: v.optional(v.string()),
        order: v.number(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("eventPartners", { ...args, updatedAt: Date.now() });
    },
});

export const removeEventPartner = mutation({
    args: { id: v.id("eventPartners") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const patchEventPartner = mutation({
    args: {
        id: v.id("eventPartners"),
        name: v.optional(v.string()),
        logo: v.optional(v.string()),
        url: v.optional(v.string()),
        order: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
    },
});

// Subnav Items
export const getSubnavItems = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("subnavItems").order("asc").collect();
    },
});

export const addSubnavItems = mutation({
    args: {
        label: v.string(),
        icon: v.string(),
        order: v.number(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("subnavItems", { ...args, updatedAt: Date.now() });
    },
});

export const removeSubnavItem = mutation({
    args: { id: v.id("subnavItems") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

// Categories
export const getCategories = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("categories").order("asc").collect();
    },
});

export const addCategory = mutation({
    args: {
        name: v.string(),
        slug: v.string(),
        icon: v.string(),
        count: v.number(),
        order: v.number(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("categories", { ...args, updatedAt: Date.now() });
    },
});

export const patchCategory = mutation({
    args: {
        id: v.id("categories"),
        name: v.optional(v.string()),
        slug: v.optional(v.string()),
        icon: v.optional(v.string()),
        count: v.optional(v.number()),
        order: v.optional(v.number()),
    },
    handler: async (ctx, { id, ...args }) => {
        await ctx.db.patch(id, { ...args, updatedAt: Date.now() });
    },
});

export const removeCategory = mutation({
    args: { id: v.id("categories") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
