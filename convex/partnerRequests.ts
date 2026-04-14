import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { hashPassword } from "./utils";
import {
    partnerRequestReceivedTemplate,
    adminNotificationTemplate,
    kycInvitationTemplate,
    kycCompletedNotificationTemplate,
    partnerApprovalTemplate,
} from "./emailTemplates";

const REQUEST_TYPE = {
    PROFESSIONAL_SERVICE: "professional_service",
    EVENT_ORGANISER: "event_organiser",
} as const;

const REQUEST_STATUS = {
    PENDING: "Pending",
    KYC_PENDING: "KYC Pending",
    KYC_COMPLETED: "KYC Completed",
    APPROVED: "Approved",
    ACCESS_GRANTED: "Access Granted",
    REJECTED: "Rejected",
} as const;

/**
 * Robust helper to identify professional service providers based on their category.
 */
function isServiceProvider(category: string | undefined): boolean {
    if (!category) return false;
    const c = category.trim().toLowerCase();
    return (
        c.includes("mehandi") ||
        c.includes("mehendi") ||
        c.includes("photograph") ||
        c.includes("makeup") ||
        c.includes("artist") ||
        c.includes("studio") ||
        c.includes("turf") ||
        c.includes("service") ||
        c.includes("expert") ||
        c.includes("vendor")
    );
}

/**
 * Normalizes the partner request record, ensuring the 'type' is consistent
 * with the business logic (Category-based detection takes precedence).
 */
function normalizeRequest(row: any) {
    if (!row) return null;
    
    // Determine the true type
    let type = row.type;
    const category = row.category || "";
    
    // Overwrite type if it matches service provider patterns
    if (isServiceProvider(category)) {
        type = REQUEST_TYPE.PROFESSIONAL_SERVICE;
    } else if (type !== REQUEST_TYPE.PROFESSIONAL_SERVICE) {
        // Fallback for everything else
        type = REQUEST_TYPE.EVENT_ORGANISER;
    }

    return {
        ...row,
        type,
        kycStatus: row.kycStatus || (type === REQUEST_TYPE.EVENT_ORGANISER ? "Not Started" : "Not Required"),
    };
}

function buildRequestFromAccount(account: any, type: "professional_service" | "event_organiser") {
    if (!account?.userId) return null;

    const firstName = account.firstName || account.name?.split(" ")?.[0] || "Partner";
    const lastName =
        account.lastName ||
        (account.name?.split(" ").slice(1).join(" ") || "");
    const fallbackPhone =
        account.kycDetails?.mobile ||
        account.kycDetails?.alternateNumber ||
        "";

    return normalizeRequest({
        type,
        firstName,
        lastName,
        email: account.userId,
        phone: fallbackPhone,
        category: account.category || (type === REQUEST_TYPE.PROFESSIONAL_SERVICE ? "Professional Service" : "Event Organiser"),
        role: "Individual",
        status: account.isApproved ? REQUEST_STATUS.ACCESS_GRANTED : REQUEST_STATUS.PENDING,
        kycStatus:
            account.kycStatus ||
            (type === REQUEST_TYPE.EVENT_ORGANISER ? "Not Started" : "Not Required"),
        createdAt: account._creationTime || Date.now(),
        approvedAt: account._creationTime,
        accessGrantedAt: account._creationTime,
        passwordCreated: Boolean(account.password),
    });
}

export const submitRequest = mutation({
    args: {
        type: v.union(v.literal("event_organiser"), v.literal("professional_service")),
        firstName: v.string(),
        lastName: v.string(),
        email: v.string(),
        phone: v.string(),
        category: v.string(),
        role: v.string(),
        remarks: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const normalizedEmail = args.email.toLowerCase();
        const normalizedPhone = args.phone.trim();

        // 1. Check for existing approved account (check both tables)
        const existingOrganiser = await ctx.db
            .query("organisers")
            .withIndex("by_userId", (q) => q.eq("userId", normalizedEmail))
            .first();
        
        const existingServiceProvider = !existingOrganiser ? await ctx.db
            .query("serviceProviders")
            .withIndex("by_userId", (q) => q.eq("userId", normalizedEmail))
            .first() : null;
        
        if (existingOrganiser || existingServiceProvider) {
            throw new Error(`Account already exists for ${normalizedEmail}. Please sign in instead.`);
        }

        // 2. Check for duplicate pending/active request (excluding Rejected)
        const emailRequest = await ctx.db
            .query("partnerRequests")
            .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
            .filter((q) => q.neq(q.field("status"), REQUEST_STATUS.REJECTED))
            .first();

        if (emailRequest) {
            throw new Error(`A request with email ${normalizedEmail} is already being processed.`);
        }

        const phoneRequest = await ctx.db
            .query("partnerRequests")
            .withIndex("by_phone", (q) => q.eq("phone", normalizedPhone))
            .filter((q) => q.neq(q.field("status"), REQUEST_STATUS.REJECTED))
            .first();

        if (phoneRequest) {
            throw new Error(`A request with phone number ${normalizedPhone} is already being processed.`);
        }

        // Apply normalization before insertion to ensure data integrity
        const normalized = normalizeRequest({ 
            type: args.type, 
            category: args.category 
        })!;
        
        const requestId = await ctx.db.insert("partnerRequests", {
            type: normalized.type,
            firstName: args.firstName,
            lastName: args.lastName,
            email: args.email.toLowerCase(),
            phone: args.phone,
            category: args.category,
            role: args.role,
            remarks: args.remarks || "",
            status: REQUEST_STATUS.PENDING,
            kycStatus: normalized.kycStatus,
            approvedAt: undefined,
            accessGrantedAt: undefined,
            createdAt: Date.now(),
        });

        const branding = await ctx.db.query("siteBranding").first();
        const adminEmail = "hello@bookmyticket.net";

        // Notify Admin
        await ctx.scheduler.runAfter(0, api.emailActions.sendEmail, {
            to: adminEmail,
            subject: `New Partner Request: ${args.firstName} ${args.lastName}`,
            html: adminNotificationTemplate({
                title: "New Partner Application",
                fields: [
                    { label: "Type", value: normalized.type === "event_organiser" ? "Event Organiser" : "Professional Service" },
                    { label: "Name", value: `${args.firstName} ${args.lastName}` },
                    { label: "Email", value: args.email.toLowerCase() },
                    { label: "Phone", value: args.phone },
                    { label: "Category", value: args.category },
                ],
                actionText: "Review in Admin Panel"
            }, branding)
        });

        // Notify User
        await ctx.scheduler.runAfter(0, api.emailActions.sendEmail, {
            to: args.email.toLowerCase(),
            subject: "Your Partner Request is Under Review",
            html: partnerRequestReceivedTemplate({
                firstName: args.firstName,
                lastName: args.lastName,
                category: args.category,
                role: args.role
            }, branding)
        });

        return requestId;
    }
});

export const getById = query({
    args: { id: v.id("partnerRequests") },
    handler: async (ctx, args) => {
        const row = await ctx.db.get(args.id);
        return normalizeRequest(row);
    }
});

export const getAll = query({
    args: {},
    handler: async (ctx) => {
        const rows = await ctx.db.query("partnerRequests").order("desc").collect();
        const normalizedRows = rows.map(normalizeRequest).filter(Boolean);

        const existingEmails = new Set(
            normalizedRows.map((row: any) => String(row.email || "").toLowerCase())
        );

        const [serviceProviders, organisers] = await Promise.all([
            ctx.db.query("serviceProviders").collect(),
            ctx.db.query("organisers").collect(),
        ]);

        const inferredFromAccounts = [
            ...serviceProviders
                .map((sp) => buildRequestFromAccount(sp, REQUEST_TYPE.PROFESSIONAL_SERVICE))
                .filter((row) => row && !existingEmails.has(String(row.email).toLowerCase())),
            ...organisers
                .map((org) => buildRequestFromAccount(org, REQUEST_TYPE.EVENT_ORGANISER))
                .filter((row) => row && !existingEmails.has(String(row.email).toLowerCase())),
        ];

        return [...normalizedRows, ...inferredFromAccounts].sort(
            (a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0)
        );
    }
});

export const getByEmail = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const normalizedEmail = args.email.toLowerCase();
        const rows = await ctx.db
            .query("partnerRequests")
            .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
            .order("desc")
            .collect();
        return rows.map(normalizeRequest);
    }
});

export const getByType = query({
    args: { type: v.union(v.literal("event_organiser"), v.literal("professional_service")) },
    handler: async (ctx, args) => {
        const rows = await ctx.db
            .query("partnerRequests")
            .withIndex("by_type", (q) => q.eq("type", args.type))
            .order("desc")
            .collect();
        return rows.map(normalizeRequest);
    }
});

export const initiateKyc = mutation({
    args: { id: v.id("partnerRequests") },
    handler: async (ctx, args) => {
        const raw = await ctx.db.get(args.id);
        const request = normalizeRequest(raw);
        
        if (!request) throw new Error("Request not found");
        if (request.type !== REQUEST_TYPE.EVENT_ORGANISER) throw new Error("KYC only required for Event Organisers");
        if (request.status !== REQUEST_STATUS.PENDING) {
            throw new Error("KYC can only be initiated from Pending status");
        }

        await ctx.db.patch(args.id, {
            status: REQUEST_STATUS.KYC_PENDING,
            kycStatus: "Pending",
        });

        const branding = await ctx.db.query("siteBranding").first();
        const siteUrl = branding?.siteUrl || "https://bookmyticket.net";

        const kycUrl = `${siteUrl}/partner-kyc/${args.id}`;
        await ctx.scheduler.runAfter(0, api.emailActions.sendEmail, {
            to: request.email,
            subject: "Action Required: Complete Your KYC Onboarding",
            html: kycInvitationTemplate({ firstName: request.firstName, kycUrl }, branding),
        });
    }
});

export const submitKycForRequest = mutation({
    args: {
        id: v.id("partnerRequests"),
        kycDetails: v.object({
            panNumber: v.optional(v.string()),
            panFile: v.optional(v.string()),
            aadharFile: v.optional(v.string()),
            chequeFile: v.optional(v.string()),
            beneficiaryName: v.optional(v.string()),
            bankName: v.optional(v.string()),
            accountNumber: v.optional(v.string()),
            ifscCode: v.optional(v.string()),
            accountType: v.optional(v.string()),
            agreementAccepted: v.boolean(),
        })
    },
    handler: async (ctx, args) => {
        const raw = await ctx.db.get(args.id);
        const request = normalizeRequest(raw);
        
        if (!request) throw new Error("Request not found");
        if (request.type !== REQUEST_TYPE.EVENT_ORGANISER) {
            throw new Error("KYC submission is only allowed for Event Organiser requests");
        }
        if (request.status !== REQUEST_STATUS.KYC_PENDING) {
            throw new Error("KYC can only be submitted after KYC is initiated");
        }

        await ctx.db.patch(args.id, {
            status: REQUEST_STATUS.KYC_COMPLETED,
            kycStatus: "Completed",
            kycDetails: args.kycDetails
        });

        // Notify Admin of KYC completion
        const branding = await ctx.db.query("siteBranding").first();
        await ctx.scheduler.runAfter(0, api.emailActions.sendEmail, {
            to: "hello@bookmyticket.net",
            subject: `KYC Completed: ${request.firstName} ${request.lastName}`,
            html: kycCompletedNotificationTemplate({
                name: `${request.firstName} ${request.lastName}`,
                email: request.email
            }, branding)
        });

        // Notify User of KYC completion
        await ctx.scheduler.runAfter(0, api.emailActions.sendEmail, {
            to: request.email,
            subject: "Your KYC Has Been Submitted",
            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2>KYC Submitted Successfully</h2>
                    <p>Hi ${request.firstName},</p>
                    <p>Your KYC documents have been successfully received and are currently under review by our admin team.</p>
                    <p>We will notify you once your application has been approved.</p>
                </div>
            `
        });
    }
});

export const approve = mutation({
    args: { 
        id: v.id("partnerRequests"),
        password: v.string()
    },
    handler: async (ctx, args) => {
        const raw = await ctx.db.get(args.id);
        const request = normalizeRequest(raw);
        if (!request) throw new Error("Request not found");

        const existingOrganiser = await ctx.db
            .query("organisers")
            .withIndex("by_userId", (q) => q.eq("userId", request.email))
            .unique();
        
        const existingServiceProvider = await ctx.db
            .query("serviceProviders")
            .withIndex("by_userId", (q) => q.eq("userId", request.email))
            .unique();

        if (existingOrganiser || existingServiceProvider) {
            throw new Error("An account already exists for this email");
        }

        // Defensive check: If it's an Event Organiser, they must complete KYC.
        // Professional Services bypass this.
        if (request.type === REQUEST_TYPE.EVENT_ORGANISER) {
             const allowedStatuses = [REQUEST_STATUS.KYC_PENDING, REQUEST_STATUS.KYC_COMPLETED, REQUEST_STATUS.APPROVED];
             if (!allowedStatuses.includes(request.status as any)) {
                 throw new Error(`Event Organisers must be in KYC Pending or KYC Completed state for approval (Current Status: ${request.status})`);
             }
        } 
        else if (request.type === REQUEST_TYPE.PROFESSIONAL_SERVICE) {
            if (request.status !== REQUEST_STATUS.PENDING && request.status !== REQUEST_STATUS.APPROVED) {
                throw new Error(`Professional Service request must be in Pending state (Current Status: ${request.status})`);
            }
        }

        const hashedPassword = await hashPassword(args.password);

        // 1. Create Organiser/Vendor Account in correct table
        const targetTable = request.type === REQUEST_TYPE.PROFESSIONAL_SERVICE ? "serviceProviders" : "organisers";
        await ctx.db.insert(targetTable, {
            userId: request.email,
            password: hashedPassword,
            name: `${request.firstName} ${request.lastName}`,
            firstName: request.firstName,
            lastName: request.lastName,
            type: request.type,
            category: request.category,
            kycStatus: request.type === REQUEST_TYPE.EVENT_ORGANISER ? "Verified" : "Not Required",
            isApproved: true,
            walletBalance: 0,
            kycDetails: request.kycDetails as any,
            forcePasswordChange: true,
        });

        const now = Date.now();
        // 2. Update Request Status and access state
        await ctx.db.patch(args.id, {
            status: REQUEST_STATUS.ACCESS_GRANTED,
            kycStatus: request.type === REQUEST_TYPE.EVENT_ORGANISER ? "Verified" : "Not Required",
            approvedAt: now,
            accessGrantedAt: now,
            passwordCreated: true,
        });

        const branding = await ctx.db.query("siteBranding").first();
        const siteUrl = branding?.siteUrl || "https://bookmyticket.net";

        // 3. Send Emails
        await ctx.scheduler.runAfter(0, api.emailActions.sendEmail, {
            to: request.email,
            subject:
                request.type === REQUEST_TYPE.PROFESSIONAL_SERVICE
                    ? "Professional Service Approved - Vendor Panel Access Granted"
                    : "Event Organiser Approved - Organiser Panel Access Granted",
            html: partnerApprovalTemplate({
                firstName: request.firstName,
                email: request.email,
                password: args.password,
                loginUrl: `${siteUrl}/signin`,
            }, branding),
        });

        await ctx.scheduler.runAfter(0, api.notificationActions.sendPartnerApprovalCredentials, {
            email: request.email,
            firstName: request.firstName,
            password: args.password,
            phone: request.phone,
        });

        return { success: true };
    },
});

export const remove = mutation({
    args: { id: v.id("partnerRequests") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
        return true;
    }
});

export const updateStatus = mutation({
    args: {
        id: v.id("partnerRequests"),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        const raw = await ctx.db.get(args.id);
        const request = normalizeRequest(raw);
        if (!request) throw new Error("Request not found");

        if (args.status === REQUEST_STATUS.REJECTED) {
            await ctx.db.patch(args.id, { status: REQUEST_STATUS.REJECTED });
            return { success: true };
        }

        if (
            request.type === REQUEST_TYPE.EVENT_ORGANISER &&
            args.status === REQUEST_STATUS.KYC_PENDING &&
            request.status === REQUEST_STATUS.PENDING
        ) {
            await ctx.db.patch(args.id, { status: REQUEST_STATUS.KYC_PENDING, kycStatus: "Pending" });
            return { success: true };
        }

        throw new Error("Unsupported status transition");
    }
});

export const normalizeExistingRequests = mutation({
    args: {},
    handler: async (ctx) => {
        const requests = await ctx.db.query("partnerRequests").collect();
        const serviceKeywords = ["mehandi", "mehendi", "photograph", "makeup", "artist", "personal service", "studio", "decorator", "catering", "turf"];
        
        let count = 0;
        for (const req of requests) {
            // Check if type is missing or invalid
            if (!req.type || (req.type as string) === "organiser") {
                const cat = (req.category || "").toLowerCase();
                const type = serviceKeywords.some(k => cat.includes(k)) 
                    ? "professional_service" 
                    : "event_organiser";
                
                await ctx.db.patch(req._id, { type: type as any });
                count++;
            }
        }
        return { normalized: count };
    },
});
