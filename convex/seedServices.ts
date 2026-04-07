import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const categories = [
      { name: "Mehendi Artist", slug: "mehendi-artist", icon: "🌸", count: 0, order: 1 },
      { name: "Photographer/Studio", slug: "photographer-studio", icon: "📸", count: 0, order: 2 },
      { name: "Makeup Artist", slug: "makeup-artist", icon: "✨", count: 0, order: 3 },
      { name: "Turf Booking", slug: "turf-booking", icon: "⚽", count: 0, order: 4 },
    ];

    for (const cat of categories) {
      const existing = await ctx.db
        .query("categories")
        .withIndex("by_slug", (q) => q.eq("slug", cat.slug))
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
        category: "Photographer/Studio",
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
      },
      {
        email: "turf1@example.com",
        name: "Arena One Sports",
        category: "Turf Booking",
        bio: "Five-a-side football and box cricket arena with professional FIFA-grade turf.",
        portfolio: [
          { url: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800", type: "image" }
        ],
        price: 1200
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
          pricing: [{ name: "Standard Hour", price: v.price }],
          updatedAt: Date.now()
        });
      }

      // If it's a turf, seed a sample turf entry as well
      if (v.category === "Turf Booking") {
        const existingTurf = await ctx.db
          .query("turfs")
          .withIndex("by_organiserId", (q) => q.eq("organiserId", orgId))
          .unique();
        
        if (!existingTurf) {
           const turfId = await ctx.db.insert("turfs", {
            organiserId: orgId,
            name: v.name,
            description: v.bio,
            location: "Koramangala, Bangalore",
            address: "4th Block, Koramangala, Opposite BDA Complex",
            pricePerHour: v.price,
            advanceAmount: 300,
            status: "active",
            createdAt: Date.now(),
            updatedAt: Date.now()
          });

          // Add some slots (Monday)
          for (let h = 6; h <= 22; h++) {
            await ctx.db.insert("turfSlots", {
              turfId,
              dayOfWeek: 1, // Monday
              startTime: `${String(h).padStart(2, '0')}:00`,
              endTime: `${String((h+1)%24).padStart(2, '0')}:00`,
              isActive: true
            });
          }
        }
      }
    }
  },
});
