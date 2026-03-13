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
        country: v.optional(v.string()),
        state: v.optional(v.string()),
        district: v.optional(v.string()),
        city: v.optional(v.string()),
        featured: v.optional(v.boolean()),
        trending: v.optional(v.boolean()),
        spotlight: v.optional(v.boolean()),
        exclusive: v.optional(v.boolean()),
        status: v.optional(v.string()),
        environment: v.optional(v.string()), // 'Indoor' or 'Outdoor'
        description: v.optional(v.string()),
        meetingUrl: v.optional(v.string()),
        rows: v.optional(v.number()),
        cols: v.optional(v.number()),
        normalTicketCapacity: v.optional(v.number()),
        normalTicketPrice: v.optional(v.number()),
        virtual: v.optional(v.boolean()),
        seatCategories: v.optional(v.array(v.object({
            name: v.string(),
            price: v.number(),
            rows: v.number(),
            isFree: v.optional(v.boolean()),
        }))),
        dateSlots: v.optional(v.array(v.object({
            date: v.string(),
            time: v.string(),
        }))),
        layoutType: v.optional(v.string()), // 'stage', 'ground', 'rate'
    }),

    bookings: defineTable({
        eventId: v.string(),
        userId: v.string(),
        tickets: v.optional(v.number()),
        ticketCount: v.number(),
        totalPrice: v.number(),
        customerDetails: v.optional(v.object({
            name: v.string(),
            email: v.string(),
            phone: v.string(),
        })),
        status: v.string(),
        paymentIntentId: v.optional(v.string()),
        scanned: v.optional(v.boolean()),
        scannedAt: v.optional(v.number()),
    }).index("by_eventId", ["eventId"]).index("by_userId", ["userId"]),

    pwaScans: defineTable({
        bookingId: v.id("bookings"),
        eventId: v.string(),
        organiserId: v.string(),
        scannedAt: v.number(),
        status: v.string(), // "valid", "already_used", "invalid"
    }).index("by_organiserId", ["organiserId"]).index("by_bookingId", ["bookingId"]),

    eventBookings: defineTable({
        bookingId: v.id("bookings"),
        eventId: v.string(),
        organiserId: v.string(),
        customerName: v.string(),
        customerEmail: v.string(),
        ticketCount: v.number(),
        totalAmount: v.number(),
        status: v.string(),
        createdAt: v.number(),
    }).index("by_organiserId", ["organiserId"]).index("by_eventId", ["eventId"]),

    organisers: defineTable({
        userId: v.string(), // acts as email/username
        password: v.optional(v.string()),
        name: v.string(),
        kycStatus: v.optional(v.string()),
        walletBalance: v.optional(v.number()),
        kycDetails: v.optional(
            v.object({
                category: v.string(),
                panNumber: v.string(),
                socialMediaLink: v.optional(v.string()),
                hasITR: v.boolean(),
                fullName: v.string(),
                email: v.string(),
                mobile: v.string(),
                alternateNumber: v.optional(v.string()),
                designation: v.string(),
                city: v.string(),
                websiteLink: v.optional(v.string()),
                hasOSTIN: v.boolean(),
                panFile: v.string(),
                chequeFile: v.string(),
                aadharFile: v.string(),
                agreementAccepted: v.boolean(),
            })
        ),
    }).index("by_userId", ["userId"]),

    organiserRequests: defineTable({
        firstName: v.string(),
        lastName: v.string(),
        email: v.string(),
        phone: v.string(),
        category: v.string(),
        role: v.string(),
        remarks: v.optional(v.string()),
        status: v.string(), // "Pending", "Approved", "Rejected"
        createdAt: v.number(),
    }).index("by_status", ["status"]),

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
        username: v.optional(v.string()),
        password: v.string(),
        role: v.string(), // 'user'
        createdAt: v.string(),
    }).index("by_email", ["email"]).index("by_username", ["username"]),

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
    }).index("by_identifier", ["identifier"]),

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

    memories: defineTable({
        imageUrl: v.string(),
        altText: v.string(),
        createdAt: v.number(),
    }),

    bannerPackages: defineTable({
        name: v.string(), // "Weekly", "Monthly", "Yearly"
        price: v.number(),
        durationDays: v.number(),
        type: v.string(), // e.g., "hero"
    }),

    heroBanners: defineTable({
        userId: v.optional(v.string()), // Optional if admin uploads directly
        packageId: v.optional(v.id("bannerPackages")), // Optional if admin uploads
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        imageStorageId: v.optional(v.string()), // For temporary upload placeholder or reference
        imageUrl: v.optional(v.string()), // Set upon approval/upload
        link: v.optional(v.string()),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
        status: v.string(), // "pending", "approved", "expired"
        createdAt: v.number(),
    }).index("by_status", ["status"]),
    staff: defineTable({
        email: v.string(), // acts as username
        password: v.string(),
        name: v.string(),
        organiserId: v.string(), // ID or email of the organiser who created this staff
        createdAt: v.number(),
    }).index("by_email", ["email"]).index("by_organiserId", ["organiserId"]),
});
