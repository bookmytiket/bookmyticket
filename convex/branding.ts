import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

// --- Queries ---

export const getSteps = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("brandJourneySteps")
      .withIndex("by_order", (q) => q.gt("order", -1))
      .collect();
  },
});

export const getHeroContent = query({
  args: {},
  handler: async (ctx) => {
    const configs = await ctx.db.query("brandingPageConfig").collect();
    const content: Record<string, any> = {};
    configs.forEach((c) => {
      content[c.key] = c.value;
    });
    return content;
  },
});

export const getMarqueeLogos = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("eventPartners")
      .withIndex("by_order", (q) => q.gt("order", -1))
      .collect();
  },
});

export const getCoupons = query({
  args: { brandId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.brandId) return [];
    return await ctx.db
      .query("coupons")
      .withIndex("by_brandId", (q) => q.eq("brandId", args.brandId!))
      .collect();
  },
});

export const getStores = query({
  args: { brandId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.brandId) return [];
    return await ctx.db
      .query("brandStores")
      .withIndex("by_brandId", (q) => q.eq("brandId", args.brandId!))
      .collect();
  },
});

export const getKYC = query({
  args: { brandId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.brandId) return null;
    return await ctx.db
      .query("brandKYC")
      .withIndex("by_brandId", (q) => q.eq("brandId", args.brandId!))
      .unique();
  },
});

// --- Mutations ---

export const seedBrandingData = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Seed Steps if empty
    const existingSteps = await ctx.db.query("brandJourneySteps").collect();
    if (existingSteps.length === 0) {
      const steps = [
        {
          id: "setup",
          number: "STEP 1",
          title: "Setup",
          subtitle: "Brand Onboarding",
          description: "Launch your brand presence in minutes.",
          icon: "Settings",
          bgColor: "bg-[#F3E8FF]",
          tabColor: "text-brand-pink",
          borderColor: "border-purple-200/50",
          image: "👩‍💻",
          order: 1,
          features: [
            { 
              name: "Create Your Brand Profile", 
              icon: "Settings",
              desc: "Build your brand profile to showcase your identity and create lasting connections."
            },
            { 
              name: "Verify KYC & Go Live", 
              icon: "ShieldCheck",
              desc: "Set up your KYC verification and instantly connect your brand to a world of event-goers."
            },
          ],
        },
        {
          id: "create",
          number: "STEP 2",
          title: "Create",
          subtitle: "Design Digital Coupons",
          description: "Craft perfect offers for your audience.",
          icon: "Plus",
          bgColor: "bg-[#FFF1F2]",
          tabColor: "text-brand-pink",
          borderColor: "border-rose-200/50",
          image: "✨",
          order: 2,
          features: [
            { 
              name: "Design Digital Coupon", 
              icon: "Ticket",
              desc: "Design and launch digital coupons that match your brand customize offers and visuals."
            },
            { 
              name: "Distribute across Channels", 
              icon: "Zap",
              desc: "Distribute your brand's coupons via Website, e-mail and whatsapp for maximum visibility."
            },
          ],
        },
        {
          id: "track",
          number: "STEP 3",
          title: "Track",
          subtitle: "Reach Customers",
          description: "Measure every interaction in real-time.",
          icon: "BarChart3",
          bgColor: "bg-[#F0FDF4]",
          tabColor: "text-emerald-600",
          borderColor: "border-emerald-200/50",
          image: "📊",
          order: 3,
          features: [
            { 
              name: "Real time analytics", 
              icon: "BarChart3",
              desc: "Monitor and optimize coupon and event performance in real-time on the dashboard."
            },
            { 
              name: "Live Coupon Status", 
              icon: "BarChart3",
              desc: "Instantly see how many people have availed and redeemed your coupons on the dashboard."
            },
          ],
        },
        {
          id: "repeat",
          number: "STEP 4",
          title: "Repeat",
          subtitle: "Coupon Refinement & Retention",
          description: "Scale your reach with smart automation.",
          icon: "RotateCw",
          bgColor: "bg-[#FEFCE8]",
          tabColor: "text-yellow-700",
          borderColor: "border-yellow-200/50",
          image: "🚀",
          order: 4,
          features: [
            { 
              name: "Adjust targeting", 
              icon: "RotateCw",
              desc: "Target the right customers with tailored coupons to maximize redemptions and ROI."
            },
            { 
              name: "Customer Retention", 
              icon: "RotateCw",
              desc: "Keep customers coming back with tailored interactions, ensuring long-term loyalty."
            },
          ],
        },
      ];

      for (const step of steps) {
        await ctx.db.insert("brandJourneySteps", step);
      }
    }

    // 2. Seed Hero Content if empty
    const existingConfig = await ctx.db.query("brandingPageConfig").collect();
    if (existingConfig.length === 0) {
      const configs = [
        { key: "hero_badge", value: "Premium Event Partnerships" },
        { key: "hero_title_part1", value: "Maximize Your" },
        { key: "hero_title_accent", value: "Brand Impact" },
        { key: "hero_description", value: "Connect with thousands of engaged event-goers. Our digital-first branding ecosystem puts your message front and center when it matters most." },
        { key: "hero_stat_text", value: "Powering 1,000+ Brand Campaigns Annually" },
      ];

      for (const config of configs) {
        await ctx.db.insert("brandingPageConfig", config);
      }
    }

    // 3. Seed Partners if empty (Marquee)
    const existingPartners = await ctx.db.query("eventPartners").collect();
    if (existingPartners.length === 0) {
      const now = Date.now();
      const partners = [
        { name: "Global Brands", logo: "", order: 1, updatedAt: now },
        { name: "Tech Innovators", logo: "", order: 2, updatedAt: now },
        { name: "Lifestyle Co", logo: "", order: 3, updatedAt: now },
        { name: "Eco Solutions", logo: "", order: 4, updatedAt: now },
        { name: "Future Finance", logo: "", order: 5, updatedAt: now },
        { name: "Pure Health", logo: "", order: 6, updatedAt: now },
        { name: "Urban style", logo: "", order: 7, updatedAt: now },
        { name: "Next Gen", logo: "", order: 8, updatedAt: now },
      ];

      for (const partner of partners) {
        await ctx.db.insert("eventPartners", partner);
      }
    }
  },
});

export const createCoupon = mutation({
  args: {
    brandId: v.string(),
    title: v.string(),
    description: v.string(),
    redemptionMethod: v.string(),
    discountType: v.string(),
    discountValue: v.number(),
    couponCode: v.optional(v.string()),
    redirectUrl: v.optional(v.string()),
    howToRedeem: v.optional(v.string()),
    termsAndConditions: v.optional(v.string()),
    bannerUrl: v.optional(v.string()), // string fallback
    logoUrl: v.optional(v.string()), // string fallback
    bannerStorageId: v.optional(v.id("_storage")), // new real-file
    logoStorageId: v.optional(v.id("_storage")), // new real-file
    brandName: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.number(),
    usageLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { bannerStorageId, logoStorageId, ...rest } = args;
    
    const finalBannerUrl = bannerStorageId 
        ? await ctx.storage.getUrl(bannerStorageId) 
        : args.bannerUrl;
        
    const finalLogoUrl = logoStorageId 
        ? await ctx.storage.getUrl(logoStorageId) 
        : args.logoUrl;

    return await ctx.db.insert("coupons", {
      ...rest,
      bannerUrl: finalBannerUrl ?? undefined,
      logoUrl: finalLogoUrl ?? undefined,
      status: "Active",
      createdAt: Date.now(),
    });
  },
});

export const updateKYC = mutation({
  args: {
    brandId: v.string(),
    orgName: v.string(),
    address: v.string(),
    city: v.string(),
    state: v.string(),
    zip: v.string(),
    gstNumber: v.string(),
    panNumber: v.string(),
    orgLogoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("brandKYC")
      .withIndex("by_brandId", (q) => q.eq("brandId", args.brandId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        status: "Pending Review",
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("brandKYC", {
        ...args,
        status: "Pending Review",
        updatedAt: Date.now(),
      });
    }
  },
});

export const registerPartner = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    username: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Verify OTP
    const otpEntry = await ctx.db
      .query("otps")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) => q.eq(q.field("code"), args.code))
      .filter((q) => q.eq(q.field("purpose"), "signup"))
      .unique();

    if (!otpEntry || otpEntry.expires < Date.now()) {
      throw new Error("Invalid or expired OTP");
    }

    // 2. Cleanup OTP
    await ctx.db.delete(otpEntry._id);

    // 3. Check if user already exists
    const existing = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", args.email)).first();
    if (existing) throw new Error("Email already registered");

    // 4. Create User with branding_partner role
    const userId = await ctx.db.insert("users", {
      fullName: args.name,
      username: args.username,
      email: args.email,
      password: args.password,
      role: "branding_partner",
      status: "Active",
      createdAt: Date.now(),
    });

    // 5. Initialize Brand KYC record
    await ctx.db.insert("brandKYC", {
      brandId: userId,
      orgName: args.name,
      address: "",
      city: "",
      state: "",
      zip: "",
      gstNumber: "",
      panNumber: "",
      status: "Verification Pending", // Initial status
      updatedAt: Date.now(),
    });

    return userId;
  },
});

export const verifyKYC = mutation({
  args: {
    brandId: v.string(),
    status: v.string(), // "Verified" | "Rejected"
  },
  handler: async (ctx, args) => {
    const kyc = await ctx.db
      .query("brandKYC")
      .withIndex("by_brandId", (q) => q.eq("brandId", args.brandId))
      .unique();

    if (!kyc) throw new Error("KYC record not found");

    await ctx.db.patch(kyc._id, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return kyc._id;
  },
});

export const listAllKYC = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("brandKYC").collect();
  },
});

// --- Premium Banners Queries & Mutations ---

export const getConfigPrices = query({
    args: {},
    handler: async (ctx) => {
        const monthlyDoc = await ctx.db
            .query("systemConfig")
            .withIndex("by_key", (q) => q.eq("key", "brand_banner_monthly_price"))
            .first();
        const yearlyDoc = await ctx.db
            .query("systemConfig")
            .withIndex("by_key", (q) => q.eq("key", "brand_banner_yearly_price"))
            .first();

        const monthlyPrice = monthlyDoc ? Number(monthlyDoc.value) : 999;
        const yearlyPrice = yearlyDoc ? Number(yearlyDoc.value) : 9999;

        return { monthlyPrice, yearlyPrice };
    },
});

export const updatePricing = mutation({
    args: {
        monthlyPrice: v.number(),
        yearlyPrice: v.number(),
    },
    handler: async (ctx, args) => {
        const setConfig = async (key: string, value: any) => {
            const existing = await ctx.db
                .query("systemConfig")
                .withIndex("by_key", (q) => q.eq("key", key))
                .first();
            if (existing) {
                await ctx.db.patch(existing._id, { value });
            } else {
                await ctx.db.insert("systemConfig", { key, value });
            }
        };

        await setConfig("brand_banner_monthly_price", args.monthlyPrice);
        await setConfig("brand_banner_yearly_price", args.yearlyPrice);
        return { success: true };
    },
});

export const getSubscription = query({
    args: { brandId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("brandSubscriptions")
            .withIndex("by_brandId", (q) => q.eq("brandId", args.brandId))
            .filter((q) => q.eq(q.field("status"), "active"))
            .first();
    },
});

export const getBanner = query({
    args: { brandId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("brandBanners")
            .withIndex("by_brandId", (q) => q.eq("brandId", args.brandId))
            .first();
    },
});

export const processPayment = mutation({
    args: {
        brandId: v.string(),
        planType: v.string(), // "Monthly" or "Yearly"
        amountPaid: v.number(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const days = args.planType === "Yearly" ? 365 : 30;
        const endDate = now + (days * 24 * 60 * 60 * 1000);

        const existing = await ctx.db
            .query("brandSubscriptions")
            .withIndex("by_brandId", (q) => q.eq("brandId", args.brandId))
            .filter((q) => q.eq(q.field("status"), "active"))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                endDate: Math.max(existing.endDate, now) + (days * 24 * 60 * 60 * 1000),
                amountPaid: existing.amountPaid + args.amountPaid,
            });
            return existing._id;
        }

        return await ctx.db.insert("brandSubscriptions", {
            brandId: args.brandId,
            planType: args.planType,
            amountPaid: args.amountPaid,
            startDate: now,
            endDate,
            status: "active",
        });
    },
});

export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});

export const uploadBanner = mutation({
    args: {
        brandId: v.string(),
        storageId: v.string(),
        redirectUrl: v.string(),
    },
    handler: async (ctx, args) => {
        const activeSub = await ctx.db
            .query("brandSubscriptions")
            .withIndex("by_brandId", (q) => q.eq("brandId", args.brandId))
            .filter((q) => q.eq(q.field("status"), "active"))
            .first();

        if (!activeSub) throw new Error("No active premium subscription");

        const imageUrl = await ctx.storage.getUrl(args.storageId);
        if (!imageUrl) throw new Error("Failed to get image URL");

        const existing = await ctx.db
             .query("brandBanners")
             .withIndex("by_brandId", (q) => q.eq("brandId", args.brandId))
             .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                imageUrl,
                redirectUrl: args.redirectUrl,
                isActive: true
            });
            return existing._id;
        } else {
            return await ctx.db.insert("brandBanners", {
                brandId: args.brandId,
                imageUrl,
                redirectUrl: args.redirectUrl,
                isActive: true,
                createdAt: Date.now()
            });
        }
    },
});

export const removeBanner = mutation({
    args: { brandId: v.string() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("brandBanners")
            .withIndex("by_brandId", (q) => q.eq("brandId", args.brandId))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, { isActive: false });
        }
    }
});

export const getActiveBanners = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("brandBanners")
            .withIndex("by_isActive", (q) => q.eq("isActive", true))
            .collect();
    },
});

export const getHomeCoupons = query({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const all = await ctx.db.query("coupons").collect();
        return all.filter((c) => c.status === "Active" && c.endDate >= now);
    },
});

export const getBrandCoupons = query({
    args: { brandId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("coupons")
            .withIndex("by_brandId", (q) => q.eq("brandId", args.brandId))
            .order("desc")
            .collect();
    },
});export const expireSubscriptions = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const expiredSubs = await ctx.db
            .query("brandSubscriptions")
            .withIndex("by_status", (q) => q.eq("status", "active"))
            .filter((q) => q.lt(q.field("endDate"), now))
            .collect();

        for (const sub of expiredSubs) {
            await ctx.db.patch(sub._id, { status: "expired" });
            const banner = await ctx.db
                 .query("brandBanners")
                 .withIndex("by_brandId", (q) => q.eq("brandId", sub.brandId))
                 .first();
            if (banner) {
                await ctx.db.patch(banner._id, { isActive: false });
            }
        }
    },
});
