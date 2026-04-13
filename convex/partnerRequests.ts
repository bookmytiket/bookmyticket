import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { hashPassword } from "./utils";

const generatePartnerEmailHTML = (firstName: string, lastName: string, category: string, role: string, brandLogo: string, siteUrl: string) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
            .header { background: linear-gradient(135deg, #f43f5e, #a855f7); padding: 40px 20px; text-align: center; }
            .logo { max-width: 150px; margin-bottom: 20px; }
            .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
            .content { padding: 40px 30px; }
            .greeting { font-size: 20px; color: #1e293b; font-weight: 700; margin-bottom: 16px; }
            .message { font-size: 16px; color: #475569; line-height: 1.6; margin-bottom: 24px; }
            .details-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 30px; }
            .detail-row { display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; }
            .detail-row:last-child { margin-bottom: 0; border-bottom: none; padding-bottom: 0; }
            .label { font-size: 14px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
            .value { font-size: 15px; font-weight: 700; color: #0f172a; }
            .footer { background-color: #1e293b; padding: 30px 20px; text-align: center; }
            .footer-text { color: #94a3b8; font-size: 14px; margin-bottom: 16px; }
            .support-link { color: #38bdf8; text-decoration: none; font-weight: 600; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="${brandLogo}" alt="Logo" class="logo" onerror="this.style.display='none'">
                <h1>Partner Request Received</h1>
            </div>
            <div class="content">
                <div class="greeting">Hi ${firstName} ${lastName},</div>
                <div class="message">
                    Thank you for applying to become a Partner! Your request has been successfully submitted and is currently under review by our administration team.
                    We aim to process all applications rapidly and will reach out to you within 24-48 hours.
                </div>
                
                <div class="details-box">
                    <div class="detail-row">
                        <span class="label">Category</span>
                        <span class="value">${category}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Role Type</span>
                        <span class="value">${role}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Status</span>
                        <span class="value" style="color: #f59e0b;">Under Review</span>
                    </div>
                </div>
                
                <div class="message">
                    If you have any immediate questions, feel free to contact our partner support team. We look forward to working with you!
                </div>
            </div>
            <div class="footer">
                <div class="footer-text">
                    Need help? Contact our <a href="${siteUrl}/support" class="support-link">Partner Support</a>
                </div>
                <div class="footer-text" style="margin-bottom: 0; font-size: 12px;">
                    &copy; ${new Date().getFullYear()} All rights reserved.
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
};

export const submitRequest = mutation({
    args: {
        type: v.string(), // "organiser" | "professional_service"
        firstName: v.string(),
        lastName: v.string(),
        email: v.string(),
        phone: v.string(),
        category: v.string(),
        role: v.string(),
        remarks: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        // 1. Insert into Database
        const requestId = await ctx.db.insert("partnerRequests", {
            type: args.type,
            firstName: args.firstName,
            lastName: args.lastName,
            email: args.email.toLowerCase(),
            phone: args.phone,
            category: args.category,
            role: args.role,
            remarks: args.remarks || "",
            status: "Pending",
            createdAt: Date.now(),
        });

        const branding = await ctx.db.query("siteBranding").first();
        const rawSiteUrl = branding?.siteUrl || "https://bookmyticket.net";
        const siteUrl = (rawSiteUrl.includes("localhost") || rawSiteUrl.includes("vercel.app")) ? "https://bookmyticket.net" : rawSiteUrl;
        let brandLogo = branding?.logoUrl || "/logo.png";
        if (brandLogo.startsWith("/")) {
            brandLogo = `${siteUrl}${brandLogo}`;
        }
        
        const adminEmail = "bookmytiket.io@gmail.com";

        // 2. Notify the Admin asynchronously
        const adminHtmlContent = `
            <h3>New Partner Request</h3>
            <p><strong>Name:</strong> ${args.firstName} ${args.lastName}</p>
            <p><strong>Email:</strong> ${args.email.toLowerCase()}</p>
            <p><strong>Phone:</strong> ${args.phone}</p>
            <p><strong>Category:</strong> ${args.category}</p>
            <p><strong>Role:</strong> ${args.role}</p>
            <p><strong>Remarks:</strong> ${args.remarks || "None"}</p>
            <br/>
            <p><a href="${siteUrl}/admin" style="padding: 10px 15px; background: #3b82f6; color: #fff; text-decoration: none; border-radius: 5px;">Review in Admin Panel</a></p>
        `;
        
        await ctx.scheduler.runAfter(0, api.emailActions.sendEmail, {
            to: adminEmail, // Admin Email
            subject: `New Partner Request: ${args.firstName} ${args.lastName}`,
            html: adminHtmlContent
        });

        // 3. Schedule Email Notification to the User asynchronously
        const htmlContent = generatePartnerEmailHTML(
            args.firstName, 
            args.lastName, 
            args.category, 
            args.role, 
            brandLogo, 
            siteUrl
        );
        
        await ctx.scheduler.runAfter(0, api.emailActions.sendEmail, {
            to: args.email.toLowerCase(),
            subject: "Your Partner Request is Under Review",
            html: htmlContent
        });

        return requestId;
    }
});

// Admin Queries
export const getAll = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("partnerRequests")
            .order("desc")
            .collect();
    }
});

export const getByEmail = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const all = await ctx.db
            .query("partnerRequests")
            .order("desc")
            .collect();
        return all.filter(r =>
            r.email?.toLowerCase() === args.email.toLowerCase() ||
            r.phone?.toLowerCase() === args.email.toLowerCase()
        );
    }
});

export const updateStatus = mutation({
    args: {
        id: v.id("partnerRequests"),
        status: v.string(), // "Approved" | "Rejected"
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            status: args.status
        });
        return true;
    }
});

export const remove = mutation({
    args: { id: v.id("partnerRequests") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
        return true;
    }
});

export const approve = mutation({
    args: { 
        id: v.id("partnerRequests"),
        password: v.string()
    },
    handler: async (ctx, args) => {
        const { id, password } = args;
        const request = await ctx.db.get(id);
        if (!request) throw new Error("Request not found");
        if (request.status !== "Pending") throw new Error("Request is not pending or already processed");

        // Hash the manual password
        const hashedPassword = await hashPassword(password);

        // 1. Create Organiser Account
        await ctx.db.insert("organisers", {
            userId: request.email,
            password: hashedPassword,
            name: `${request.firstName} ${request.lastName}`,
            firstName: request.firstName,
            lastName: request.lastName,
            kycStatus: "KYC Pending",
            walletBalance: 0,
        });

        // 2. Update Request Status
        await ctx.db.patch(id, {
            status: "Approved",
        });

        // 3. Schedule Credentials Delivery (Email + SMS)
        await ctx.scheduler.runAfter(0, api.notificationActions.sendPartnerApprovalCredentials, {
            email: request.email,
            firstName: request.firstName,
            password: password, // Sending plain password to notification action for the email/sms
            phone: request.phone,
        });

        return { success: true };
    },
});
