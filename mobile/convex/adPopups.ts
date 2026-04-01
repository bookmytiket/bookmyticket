import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ── Queries ──────────────────────────────────────────────────────────────────

/** Returns all active ad popups for display on web and mobile */
export const getActiveAdPopups = query({
  args: {},
  handler: async (ctx) => {
    const popups = await ctx.db
      .query("adPopups")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    return await Promise.all(popups.map(async (p) => {
      if (p.imageUrl && !p.imageUrl.startsWith("http")) {
        const url = await ctx.storage.getUrl(p.imageUrl);
        return { ...p, imageUrl: url || p.imageUrl };
      }
      return p;
    }));
  },
});

/** Returns all ad popups (for admin management) */
export const getAllAdPopups = query({
  args: {},
  handler: async (ctx) => {
    const popups = await ctx.db.query("adPopups").order("desc").collect();
    return await Promise.all(popups.map(async (p) => {
      if (p.imageUrl && !p.imageUrl.startsWith("http")) {
        const url = await ctx.storage.getUrl(p.imageUrl);
        return { ...p, imageUrl: url || p.imageUrl, storageId: p.imageUrl };
      }
      return p;
    }));
  },
});

// ── Mutations ─────────────────────────────────────────────────────────────────

/** Admin creates a new ad popup */
export const createAdPopup = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    redirectUrl: v.optional(v.string()),
    ctaText: v.optional(v.string()),
    bgColor: v.optional(v.string()),
    badgeText: v.optional(v.string()),
    isActive: v.boolean(),
    showEveryMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("adPopups", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

/** Admin updates an existing ad popup */
export const updateAdPopup = mutation({
  args: {
    id: v.id("adPopups"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    redirectUrl: v.optional(v.string()),
    ctaText: v.optional(v.string()),
    bgColor: v.optional(v.string()),
    badgeText: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    showEveryMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
    return id;
  },
});

/** Toggle active status */
export const toggleAdPopup = mutation({
  args: { id: v.id("adPopups"), isActive: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isActive: args.isActive });
  },
});

/** Admin deletes a popup */
export const deleteAdPopup = mutation({
  args: { id: v.id("adPopups") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

/** Generate a storage upload URL for popup images */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
