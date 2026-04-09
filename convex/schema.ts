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
        meetingType: v.optional(v.string()), // 'internal' or 'external'
        externalMeetingUrl: v.optional(v.string()), // For Zoom/Teams/etc.
        endDateTime: v.optional(v.number()), // Computed timestamp for expiration
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
        layoutType: v.optional(v.string()), // 'stage', 'ground', 'rate', 'block'
        seatMapBackgroundUrl: v.optional(v.string()),
        blocks: v.optional(v.array(v.object({
            id: v.string(),
            name: v.string(),
            x: v.number(),
            y: v.number(),
            width: v.number(),
            height: v.number(),
            rows: v.number(),
            cols: v.number(),
            category: v.string(),
            color: v.optional(v.string()),
            rowNaming: v.optional(v.string()), // 'numeric' | 'alphabetic'
            startNumber: v.optional(v.number()),
            numberingDirection: v.optional(v.string()), // 'ltr' | 'rtl'
        }))),
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
        selectedSeats: v.optional(v.array(v.object({
            id: v.string(),
            catName: v.string(),
            price: v.number(),
            isFree: v.boolean(),
        }))),
        // GST Fields
        taxableAmount: v.optional(v.number()),
        gstAmount: v.optional(v.number()),
        gstBreakdown: v.optional(v.object({
            cgst: v.number(),
            sgst: v.number(),
            igst: v.number(),
        })),
        invoiceNumber: v.optional(v.string()),
        isGstApplied: v.optional(v.boolean()),
        invoiceDate: v.optional(v.number()),
    }).index("by_eventId", ["eventId"]).index("by_userId", ["userId"]).index("by_invoiceNumber", ["invoiceNumber"]).index("by_invoiceDate", ["invoiceDate"]),

    pwaScans: defineTable({
        bookingId: v.id("bookings"),
        eventId: v.string(),
        organiserId: v.string(),
        scannedAt: v.number(),
        status: v.string(), // "valid", "already_used", "invalid"
    }).index("by_organiserId", ["organiserId"]).index("by_bookingId", ["bookingId"]).index("by_eventId", ["eventId"]),

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
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        lat: v.optional(v.number()),
        lng: v.optional(v.number()),
        category: v.optional(v.string()), // Mehendi Artist, Photographer, etc.
        kycStatus: v.optional(v.string()),
        walletBalance: v.optional(v.number()),
        kycDetails: v.optional(
            v.object({
                category: v.optional(v.string()),
                panNumber: v.optional(v.string()),
                socialMediaLink: v.optional(v.string()),
                hasITR: v.optional(v.boolean()),
                fullName: v.optional(v.string()),
                email: v.optional(v.string()),
                mobile: v.optional(v.string()),
                alternateNumber: v.optional(v.string()),
                designation: v.optional(v.string()),
                city: v.optional(v.string()),
                address: v.optional(v.string()),
                websiteLink: v.optional(v.string()),
                hasOSTIN: v.optional(v.boolean()),
                gstin: v.optional(v.string()),
                panFile: v.optional(v.string()),
                chequeFile: v.optional(v.string()),
                aadharFile: v.optional(v.string()),
                beneficiaryName: v.optional(v.string()),
                accountType: v.optional(v.string()),
                bankName: v.optional(v.string()),
                accountNumber: v.optional(v.string()),
                ifscCode: v.optional(v.string()),
                agreementAccepted: v.boolean(),
            })
        ),
    }).index("by_userId", ["userId"])
      .index("by_kycStatus", ["kycStatus"])
      .index("by_category", ["category"]),



    partnerRequests: defineTable({
        type: v.optional(v.string()), // "organiser" | "professional_service"
        firstName: v.string(),
        lastName: v.string(),
        email: v.string(),
        phone: v.string(),
        category: v.string(),
        role: v.string(), // e.g., "Individual", "Company"
        remarks: v.optional(v.string()),
        status: v.string(), // "Pending", "Approved", "Rejected"
        createdAt: v.number(),
    }).index("by_status", ["status"]).index("by_email", ["email"]).index("by_type", ["type"]),

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
        fullName: v.optional(v.string()), // Compatibility with old 'name'
        name: v.optional(v.string()),     // Compatibility with old 'name'
        email: v.string(),
        phone: v.optional(v.string()),    // Added for WhatsApp notifications
        username: v.optional(v.string()),
        password: v.string(),
        role: v.string(), // 'user'
        status: v.optional(v.string()),
        lastLogin: v.optional(v.number()),
        selectedCity: v.optional(v.string()),
        locationHierarchy: v.optional(v.object({
            country: v.optional(v.string()),
            state: v.optional(v.string()),
            district: v.optional(v.string()),
            city: v.optional(v.string()),
            lat: v.optional(v.number()),
            lng: v.optional(v.number()),
        })),
        createdAt: v.union(v.number(), v.string()),
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
        fromName: v.optional(v.string()),
        encryption: v.optional(v.string()), // "TLS", "SSL", "None"
        authMethod: v.optional(v.string()), // "App Password", "Basic Authentication", "None"
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
        siteUrl: v.optional(v.string()),
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
    }).index("by_order", ["order"]),

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
    }).index("by_slug", ["slug"]),

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

    admins: defineTable({
        fullName: v.string(),
        username: v.string(),
        password: v.string(), // store hashed
        email: v.string(),
        role: v.string(), // "Admin", "Developer", "Tester", "Support"
        status: v.string(), // "Active", "Inactive"
        lastLogin: v.optional(v.number()),
        createdAt: v.number(),
    }).index("by_username", ["username"]).index("by_email", ["email"]),

    otps: defineTable({
        email: v.string(),
        code: v.string(),
        expires: v.number(),
        purpose: v.string(), // "signup" | "login"
    }).index("by_email", ["email"]),

    brandJourneySteps: defineTable({
        id: v.string(), // e.g., "setup"
        number: v.string(), // e.g., "STEP 1"
        title: v.string(),
        subtitle: v.string(),
        description: v.string(),
        icon: v.string(), // Lucide icon name string
        bgColor: v.string(),
        tabColor: v.string(),
        borderColor: v.string(),
        image: v.string(), // Emoji or storage ID
        features: v.array(v.object({
            name: v.string(),
            icon: v.string(),
            desc: v.string(),
        })),
        order: v.number(),
    }).index("by_order", ["order"]),

    brandingPageConfig: defineTable({
        key: v.string(), // e.g., "hero_title"
        value: v.any(),
    }).index("by_key", ["key"]),

    coupons: defineTable({
        brandId: v.string(),
        title: v.string(),
        description: v.string(),
        redemptionMethod: v.string(), // "In-Store", "Online"
        discountType: v.string(), // "Percentage", "Flat"
        discountValue: v.number(),
        couponCode: v.optional(v.string()), // e.g. "PAYTMHOTEL10"
        redirectUrl: v.optional(v.string()), // Where user goes after "Redeem Now"
        howToRedeem: v.optional(v.string()),
        termsAndConditions: v.optional(v.string()),
        bannerUrl: v.optional(v.string()),
        logoUrl: v.optional(v.string()),
        brandName: v.optional(v.string()),
        startDate: v.number(),
        endDate: v.number(),
        usageLimit: v.optional(v.number()),
        status: v.string(), // "Active", "Draft", "Paused"
        createdAt: v.number(),
    }).index("by_brandId", ["brandId"]),

    brandStores: defineTable({
        brandId: v.string(),
        name: v.string(),
        address: v.string(),
        city: v.string(),
        state: v.string(),
        zip: v.string(),
        staffEmails: v.optional(v.array(v.string())),
        createdAt: v.number(),
    }).index("by_brandId", ["brandId"]),

    brandKYC: defineTable({
        brandId: v.string(),
        orgName: v.string(),
        address: v.string(),
        city: v.string(),
        state: v.string(),
        zip: v.string(),
        gstNumber: v.string(),
        panNumber: v.string(),
        orgLogoUrl: v.optional(v.string()),
        status: v.string(), // "Pending", "Verified", "Rejected"
        updatedAt: v.number(),
    }).index("by_brandId", ["brandId"]),

    brandAnalytics: defineTable({
        brandId: v.string(),
        couponId: v.optional(v.id("coupons")),
        action: v.string(), // "View", "Scan", "Redeem"
        timestamp: v.number(),
        metadata: v.optional(v.any()), // e.g., user agent, location
    }).index("by_brandId", ["brandId"]).index("by_couponId", ["couponId"]),

    brandSubscriptions: defineTable({
        brandId: v.string(),
        planType: v.string(), // "Monthly" | "Yearly"
        amountPaid: v.number(),
        startDate: v.number(),
        endDate: v.number(),
        status: v.string(), // "active" | "expired"
    }).index("by_brandId", ["brandId"]).index("by_status", ["status"]),

    brandBanners: defineTable({
        brandId: v.string(),
        imageUrl: v.string(),
        redirectUrl: v.string(),
        isActive: v.boolean(),
        createdAt: v.number(),
    }).index("by_brandId", ["brandId"]).index("by_isActive", ["isActive"]),

    subscribers: defineTable({
        email: v.string(),
        phone: v.optional(v.string()),
        status: v.string(), // "Active" | "Unsubscribed"
        createdAt: v.number(),
    }).index("by_email", ["email"]),

    whatsappSettings: defineTable({
        provider: v.string(), // e.g. "Twilio"
        accountSid: v.optional(v.string()),
        authToken: v.optional(v.string()),
        fromNumber: v.optional(v.string()), // e.g. "whatsapp:+14155238886"
        apiKey: v.optional(v.string()),     // for other providers
        isActive: v.boolean(),
        updatedAt: v.number(),
    }),

    adPopups: defineTable({
        title: v.string(),
        description: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        imageStorageId: v.optional(v.id("_storage")),
        redirectUrl: v.optional(v.string()),
        ctaText: v.optional(v.string()),       // e.g. "Shop Now", "Book Now"
        bgColor: v.optional(v.string()),        // fallback gradient color
        badgeText: v.optional(v.string()),      // e.g. "🔥 Limited Offer"
        isActive: v.boolean(),
        showEveryMinutes: v.number(),           // re-show interval (e.g. 30 = every 30 min)
        createdAt: v.number(),
    }).index("by_isActive", ["isActive"]),

    vendorProfiles: defineTable({
        organiserId: v.string(), // Reference to organiser userId (email)
        category: v.string(), // "Mehendi Artist", "Photographer/Studio", "Makeup Artist"
        bio: v.optional(v.string()),
        portfolio: v.optional(v.array(v.object({
            url: v.string(),
            type: v.string(), // "image" | "video"
            category: v.optional(v.string()),
            beforeAfter: v.optional(v.boolean()),
        }))),
        pricing: v.optional(v.any()), // Dynamic per category
        availability: v.optional(v.any()), // Calendar/Slot data
        blockedDates: v.optional(v.array(v.string())),
        advancedSettings: v.optional(v.any()), // Tags, Team, Equipment, Brands
        updatedAt: v.number(),
    }).index("by_organiserId", ["organiserId"]),

    vendorBookings: defineTable({
        vendorId: v.string(), // Reference to organiser userId
        userId: v.string(), // Reference to user email
        serviceType: v.string(), // "Bridal", "Party", "Event", etc.
        bookingDate: v.string(), // "YYYY-MM-DD"
        bookingTime: v.optional(v.string()), // "HH:MM"
        status: v.string(), // "pending", "confirmed", "completed", "cancelled"
        totalAmount: v.number(),
        customerDetails: v.object({
            name: v.string(),
            phone: v.string(),
            email: v.string(),
            address: v.optional(v.string()),
        }),
        remarks: v.optional(v.string()),
        rescheduleDate: v.optional(v.string()),
        createdAt: v.number(),
        // GST Fields
        taxableAmount: v.optional(v.number()),
        gstAmount: v.optional(v.number()),
        gstBreakdown: v.optional(v.object({
            cgst: v.number(),
            sgst: v.number(),
            igst: v.number(),
        })),
        invoiceNumber: v.optional(v.string()),
        isGstApplied: v.optional(v.boolean()),
        invoiceDate: v.optional(v.number()),
    }).index("by_vendorId", ["vendorId"]).index("by_userId", ["userId"]).index("by_status", ["status"]).index("by_invoiceNumber", ["invoiceNumber"]).index("by_invoiceDate", ["invoiceDate"]),

    chatRooms: defineTable({
        participants: v.array(v.string()), // Array of user/vendor emails
        lastMessage: v.optional(v.string()),
        lastMessageAt: v.number(),
        bookingId: v.optional(v.id("vendorBookings")),
    }).index("by_lastMessageAt", ["lastMessageAt"]),

    chatMessages: defineTable({
        roomId: v.id("chatRooms"),
        senderId: v.string(),
        text: v.string(),
        timestamp: v.number(),
    }).index("by_roomId", ["roomId"]),

    vendorReviews: defineTable({
        vendorId: v.string(),
        userId: v.string(),
        rating: v.number(), // 1-5
        comment: v.string(),
        response: v.optional(v.string()),
        createdAt: v.number(),
    }).index("by_vendorId", ["vendorId"]),

    meetings: defineTable({
        title: v.string(),
        description: v.optional(v.string()),
        creatorId: v.string(), // organiser or user email
        status: v.string(), // "scheduled", "live", "ended"
        startTime: v.optional(v.number()),
        endTime: v.optional(v.number()),
        password: v.optional(v.string()),
        meetingLink: v.string(), // unique slug/id
        eventId: v.optional(v.id("events")),
        endDateTime: v.optional(v.number()),
        settings: v.object({
            lobby: v.boolean(),
            muteOnJoin: v.boolean(),
            videoOffOnJoin: v.boolean(),
            chatEnabled: v.boolean(),
            screenShareEnabled: v.boolean(),
        }),
        createdAt: v.number(),
    }).index("by_creatorId", ["creatorId"])
      .index("by_meetingLink", ["meetingLink"])
      .index("by_eventId", ["eventId"]),

    meetingParticipants: defineTable({
        meetingId: v.id("meetings"),
        userId: v.string(), // email
        name: v.string(),
        role: v.string(), // "host", "participant"
        status: v.string(), // "waiting", "joined", "left"
        joinedAt: v.optional(v.number()),
        leftAt: v.optional(v.number()),
    }).index("by_meetingId", ["meetingId"]).index("by_userId", ["userId"]),

    signals: defineTable({
        meetingId: v.id("meetings"),
        senderId: v.string(), // participant id (email)
        receiverId: v.optional(v.string()), // target participant id (email), null for broadcast
        type: v.string(), // "offer", "answer", "ice-candidate"
        data: v.string(), // stringified JSON
        timestamp: v.number(),
    }).index("by_meetingId", ["meetingId"]).index("by_receiverId", ["receiverId"]),

    meetingMessages: defineTable({
        meetingId: v.id("meetings"),
        senderId: v.string(),
        senderName: v.string(),
        text: v.string(),
        timestamp: v.number(),
    }).index("by_meetingId", ["meetingId"]),

    checkoutFooters: defineTable({
        title: v.string(),
        description: v.string(),
        iconName: v.string(),
        redirectUrl: v.optional(v.string()),
        actionType: v.string(), // "redirect" or "modal"
        modalContent: v.optional(v.string()),
        isActive: v.boolean(),
        order: v.number(),
    }).index("by_order", ["order"]).index("by_isActive", ["isActive"]),

    failedLoginAttempts: defineTable({
        identifier: v.string(),
        ip: v.string(),
        userAgent: v.string(),
        timestamp: v.number(),
    }).index("by_identifier", ["identifier"]),

    mobileVideoBanners: defineTable({
        type: v.string(), // "video" | "image"
        mediaUrl: v.string(),
        storageId: v.optional(v.id("_storage")),
        title: v.optional(v.string()),
        order: v.number(),
        isActive: v.boolean(),
        createdAt: v.number(),
        updatedAt: v.number(),
    }).index("by_isActive", ["isActive"]).index("by_order", ["order"]),

    turfs: defineTable({
        organiserId: v.string(), // Reference to organiser userId (email)
        name: v.string(),
        description: v.optional(v.string()),
        location: v.optional(v.string()),
        address: v.optional(v.string()),
        lat: v.optional(v.number()),
        lng: v.optional(v.number()),
        images: v.optional(v.array(v.string())),
        amenities: v.optional(v.array(v.string())),
        pricePerHour: v.number(),
        advanceAmount: v.optional(v.number()), // Partial payment amount to confirm
        
        // New Pricing Fields
        pricingType: v.optional(v.string()), // "flat", "per_person", "tiered"
        maxCapacity: v.optional(v.number()),
        pricePerPerson: v.optional(v.number()),
        pricingTiers: v.optional(v.array(v.object({ 
            min: v.number(), 
            max: v.number(), 
            price: v.number() 
        }))),

        status: v.string(), // "active" | "inactive"
        createdAt: v.number(),
        updatedAt: v.number(),
    }).index("by_organiserId", ["organiserId"]),

    turfSlots: defineTable({
        turfId: v.id("turfs"),
        dayOfWeek: v.number(), // 0-6
        startTime: v.string(), // "HH:MM"
        endTime: v.string(), // "HH:MM"
        priceOverride: v.optional(v.number()),
        isActive: v.boolean(),
    }).index("by_turfId", ["turfId"]),

    turfBookings: defineTable({
        turfId: v.id("turfs"),
        userId: v.string(),
        date: v.string(), // "YYYY-MM-DD"
        startTime: v.string(), // "HH:MM"
        endTime: v.string(), // "HH:MM"
        totalAmount: v.number(),
        advancePaid: v.number(),
        participantCount: v.optional(v.number()), // New field for user count
        paymentType: v.string(), // "advance" | "full"
        paymentStatus: v.string(), // "pending", "advance_paid", "fully_paid", "failed"
        bookingStatus: v.string(), // "confirmed", "cancelled", "pending"
        customerDetails: v.object({
            name: v.string(),
            email: v.string(),
            phone: v.string(),
        }),
        cancellationReason: v.optional(v.string()),
        paymentIntentId: v.optional(v.string()),
        createdAt: v.number(),
        // GST Fields
        taxableAmount: v.optional(v.number()),
        gstAmount: v.optional(v.number()),
        gstBreakdown: v.optional(v.object({
            cgst: v.number(),
            sgst: v.number(),
            igst: v.number(),
        })),
        invoiceNumber: v.optional(v.string()),
        isGstApplied: v.optional(v.boolean()),
        invoiceDate: v.optional(v.number()),
    }).index("by_turfId", ["turfId"])
      .index("by_userId", ["userId"])
      .index("by_date", ["date"])
      .index("by_invoiceNumber", ["invoiceNumber"])
      .index("by_invoiceDate", ["invoiceDate"]),

    turfManualBlocks: defineTable({
        turfId: v.id("turfs"),
        date: v.string(), // "YYYY-MM-DD"
        startTime: v.string(), // "HH:MM"
        endTime: v.string(), // "HH:MM"
        reason: v.optional(v.string()),
        createdAt: v.number(),
    }).index("by_turfId", ["turfId"])
      .index("by_date", ["date"]),

    gstSettings: defineTable({
        businessName: v.string(),
        businessAddress: v.string(),
        gstin: v.string(),
        taxConfig: v.object({
            cgst: v.number(),
            sgst: v.number(),
            igst: v.number(),
        }),
        categoryRates: v.optional(v.object({
            events: v.object({ cgst: v.number(), sgst: v.number(), igst: v.number(), enabled: v.boolean() }),
            turf: v.object({ cgst: v.number(), sgst: v.number(), igst: v.number(), enabled: v.boolean() }),
            services: v.object({ cgst: v.number(), sgst: v.number(), igst: v.number(), enabled: v.boolean() }),
        })),
        invoicePrefix: v.string(),
        isEnabled: v.boolean(),
        pricingType: v.string(), // "inclusive" | "exclusive"
        updatedAt: v.number(),
    }),
});
