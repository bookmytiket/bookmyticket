import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const categories = [
      { name: "Mehendi Artist", slug: "mehendi-artist", icon: "🌸", count: 0, order: 1 },
      { name: "Photographer", slug: "photographer", icon: "📸", count: 0, order: 2 },
      { name: "Makeup Artist", slug: "makeup-artist", icon: "✨", count: 0, order: 3 },
    ];

    for (const cat of categories) {
      const existing = await ctx.db
        .query("categories")
        .filter((q) => q.eq(q.field("slug"), cat.slug))
        .unique();
      if (!existing) {
        await ctx.db.insert("categories", { ...cat, updatedAt: Date.now() });
      }
    }

    // Add some sample vendors if they don't exist
    const sampleVendors = [
      {
        email: "artist1@example.com",
        name: "Creative Canvas Mehendi",
        category: "Mehendi Artist",
        bio: "Specializing in exquisite traditional and modern henna designs.",
        portfolio: [
          { url: "https://images.unsplash.com/photo-1766100465798-c323de2860c7?q=80&w=800&auto=format&fit=crop", type: "image" }
        ],
        price: 5000
      },
      {
        email: "photo1@example.com",
        name: "Dreamy Stills",
        category: "Photographer",
        bio: "Professional wedding and event photographer with 10 years experience.",
        portfolio: [
          { url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800", type: "image" }
        ],
        price: 15000
      },
      {
        email: "makeup1@example.com",
        name: "Glow Up Studio",
        category: "Makeup Artist",
        bio: "Bridal makeup expert specializing in HD and Airbrush techniques.",
        portfolio: [
          { url: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800", type: "image" }
        ],
        price: 8000
      }
    ];

    for (const v of sampleVendors) {
      const existingOrg = await ctx.db
        .query("organisers")
        .withIndex("by_userId", (q) => q.eq("userId", v.email))
        .unique();
      
      let orgId = v.email;
      if (!existingOrg) {
        await ctx.db.insert("organisers", {
          userId: v.email,
          name: v.name,
          category: v.category,
          kycStatus: "Verified",
          kycDetails: {
            agreementAccepted: true
          }
        });
      }

      const existingProfile = await ctx.db
        .query("vendorProfiles")
        .withIndex("by_organiserId", (q) => q.eq("organiserId", orgId))
        .unique();

      if (!existingProfile) {
        await ctx.db.insert("vendorProfiles", {
          organiserId: orgId,
          category: v.category,
          bio: v.bio,
          portfolio: v.portfolio,
          pricing: [{ name: "Starter Package", price: v.price }],
          updatedAt: Date.now()
        });
      }
    }
  },
});
