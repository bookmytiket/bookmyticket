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
});
