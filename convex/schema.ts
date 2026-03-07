import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    events: defineTable({
        organiserId: v.string(),
        title: v.string(),
        category: v.optional(v.string()),
        type: v.optional(v.string()),
        date: v.optional(v.string()),
        time: v.optional(v.string()),
        img: v.optional(v.string()),
        bannerPreview: v.optional(v.string()),
        seatingEnabled: v.optional(v.boolean()),
        totalSeats: v.optional(v.number()),
        price: v.optional(v.number()),
        location: v.optional(v.string()),
        venue: v.optional(v.string()),
        address: v.optional(v.string()),
        featured: v.optional(v.boolean()),
        trending: v.optional(v.boolean()),
        spotlight: v.optional(v.boolean()),
        exclusive: v.optional(v.boolean()),
        status: v.optional(v.string()),
        environment: v.optional(v.string()), // 'Indoor' or 'Outdoor'
    }),

    bookings: defineTable({
        eventId: v.id("events"),
        userId: v.string(),
        ticketCount: v.number(),
        totalPrice: v.number(),
        status: v.string(),
        scanned: v.optional(v.boolean()),
    }),

    organisers: defineTable({
        userId: v.string(), // acts as email/username
        password: v.optional(v.string()),
        name: v.string(),
        kycStatus: v.optional(v.string()),
        walletBalance: v.optional(v.number()),
    }),

    systemConfig: defineTable({
        key: v.string(),
        value: v.any(),
    }).index("by_key", ["key"]),

    supportTickets: defineTable({
        userId: v.string(),
        issue: v.string(),
        status: v.string(),
        adminNotes: v.optional(v.string()),
        updatedAt: v.optional(v.number()),
    }),

    users: defineTable({
        name: v.string(),
        email: v.string(),
        password: v.string(),
        role: v.string(), // 'user'
        createdAt: v.string(),
    }).index("by_email", ["email"]),

    passwordResetTokens: defineTable({
        email: v.string(),
        token: v.string(),
        expires: v.number(), // timestamp
    }).index("by_token", ["token"]),

    promotions: defineTable({
        code: v.string(),
        type: v.string(),       // "percent" | "fixed"
        value: v.string(),      // discount amount or percent
        bogo: v.optional(v.boolean()),
        validUntil: v.optional(v.string()),
        usage: v.optional(v.number()),
        active: v.optional(v.boolean()),
    }),
    notifications: defineTable({
        subject: v.string(),
        message: v.string(),
        target: v.string(), // "all" | "organisers" | "users"
        timestamp: v.number(),
    }),
    apiKeys: defineTable({
        label: v.string(),
        key: v.string(),
        status: v.string(), // "Active" | "Revoked"
        createdAt: v.number(),
    }),
    paymentGateways: defineTable({
        name: v.string(), // "Stripe", "PayPal", etc.
        isEnabled: v.boolean(),
        config: v.any(), // credentials/settings
        testMode: v.boolean(),
    }),

    ticketSettings: defineTable({
        companyName: v.string(),
        logoUrl: v.string(),
        importantInfo: v.string(),
        supportUrl: v.string(),
        sendViaEmail: v.boolean(),
        sendViaSms: v.boolean(),
        sendPdfWhatsApp: v.boolean(),
        autoApprove: v.boolean(),
        notifyOrganiser: v.boolean(),
        notifyUser: v.boolean(),
        invoicePrefix: v.string(),
        updatedAt: v.number(),
    }),

    emailSettings: defineTable({
        host: v.string(),
        port: v.number(),
        user: v.string(),
        pass: v.string(), // store as string, handle encryption/security if needed
        from: v.string(),
        updatedAt: v.number(),
    }),

    seoSettings: defineTable({
        globalTitle: v.string(),
        globalKeywords: v.string(),
        globalDescription: v.string(),
        metaAdsCode: v.string(),
        updatedAt: v.number(),
    }),

    emailTemplates: defineTable({
        identifier: v.string(), // e.g. "booking", "organiser_welcome"
        name: v.string(),
        subject: v.string(),
        body: v.string(),
        autoSend: v.boolean(),
        updatedAt: v.number(),
    }),

    policies: defineTable({
        bookingHeader: v.string(),
        paymentTerms: v.string(),
        eventDisclaimer: v.string(),
        cancellationPolicy: v.string(),
        updatedAt: v.number(),
    }),

    ssoSettings: defineTable({
        facebookEnabled: v.boolean(),
        googleEnabled: v.boolean(),
        facebookConfig: v.any(),
        googleConfig: v.any(),
        updatedAt: v.number(),
    }),

    feeSettings: defineTable({
        convenienceFeeType: v.string(), // "percent" | "fixed"
        convenienceFeeValue: v.number(),
        gstPercent: v.number(),
        updatedAt: v.number(),
    }),

    siteBranding: defineTable({
        name: v.string(),
        logoColor: v.string(),
        logoUrl: v.string(),
        updatedAt: v.number(),
    }),

    homeSections: defineTable({
        order: v.array(v.string()),
        updatedAt: v.number(),
    }),

    bannerSlides: defineTable({
        img: v.string(),
        title: v.string(),
        sub: v.string(),
        alt: v.string(),
        url: v.string(),
        order: v.number(),
        updatedAt: v.number(),
    }),

    eventPartners: defineTable({
        name: v.string(),
        logo: v.string(),
        url: v.optional(v.string()),
        order: v.number(),
        updatedAt: v.number(),
    }),

    subnavItems: defineTable({
        label: v.string(),
        icon: v.string(),
        order: v.number(),
        updatedAt: v.number(),
    }),

    categories: defineTable({
        name: v.string(),
        slug: v.string(),
        icon: v.string(),
        count: v.number(),
        order: v.number(),
        updatedAt: v.number(),
    }),

    notificationsLog: defineTable({
        subject: v.string(),
        message: v.string(),
        target: v.string(), // "all" | "organisers" | "users"
        timestamp: v.number(),
    }),

    pages: defineTable({
        title: v.string(),
        slug: v.string(),
        content: v.string(),
        showInFooter: v.boolean(),
        order: v.number(),
        updatedAt: v.number(),
    }).index("by_slug", ["slug"]),
});
