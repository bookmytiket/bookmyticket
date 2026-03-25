import { v } from "convex/values";
import { mutation, query, action, MutationCtx } from "./_generated/server";
import { api } from "./_generated/api";

export const forgotPassword = mutation({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const email = args.email.trim().toLowerCase();
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", email))
            .unique();

        // Also check organisers if not found in users
        const organiser = user ? null : await ctx.db
            .query("organisers")
            .filter((q) => q.eq(q.field("userId"), args.email))
            .unique();

        if (!user && !organiser) {
            // We don't want to reveal if an email exists or not for security, 
            // but for this app's context, let's just return null if not found.
            return null;
        }

        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const expires = Date.now() + 1800000; // 30 minutes

        await ctx.db.insert("passwordResetTokens", {
            email: args.email,
            token,
            expires,
        });

        const branding = await ctx.db.query("siteBranding").first();
        const siteUrl = branding?.siteUrl || "https://bookmyticket.vercel.app";
        let brandLogo = branding?.logoUrl || "/logo.png";
        if (brandLogo.startsWith("/")) {
            brandLogo = `${siteUrl}${brandLogo}`;
        }
        const brandNameDisplay = branding?.name || "BookMyTicket";

        const resetLink = `${siteUrl}/reset-password?token=${token}&email=${args.email}`;

        // Trigger the email action
        await ctx.scheduler.runAfter(0, api.emailActions.sendEmail, {
            to: args.email,
            subject: `Reset Your ${brandNameDisplay} Password`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 40px 20px; border: 1px solid #eee; border-radius: 12px; text-align: center;">
                    <img src="${brandLogo}" alt="${brandNameDisplay}" style="max-height: 70px; width: auto; margin-bottom: 25px; color: #333; font-size: 24px; font-weight: bold;">
                    <h2 style="color: #333; margin-bottom: 20px;">Password Reset</h2>
                    <p style="color: #555; font-size: 16px; margin-bottom: 30px;">You recently requested a password reset for your ${brandNameDisplay} account. Please click the button below to proceed:</p>
                    <a href="${resetLink}" style="display: inline-block; background-color: #ff007f; background: linear-gradient(to right, #ff007f, #8000ff); color: white; padding: 14px 30px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 10px rgba(255, 0, 127, 0.2);">Reset Password</a>
                    <p style="color: #999; font-size: 14px; margin-top: 35px;">If you did not request a password reset, you can safely ignore this email. This link is valid for 30 minutes.</p>
                </div>
            `,
        });

        // Store it in systemConfig for backward compatibility with testing if needed
        await ctx.db.insert("systemConfig", {
            key: `reset_link_${args.email}`,
            value: resetLink,
        });

        return true;
    },
});

export const verifyResetToken = query({
    args: { token: v.string(), email: v.string() },
    handler: async (ctx, args) => {
        const resetEntry = await ctx.db
            .query("passwordResetTokens")
            .withIndex("by_token", (q) => q.eq("token", args.token))
            .unique();

        if (!resetEntry || resetEntry.email !== args.email || resetEntry.expires < Date.now()) {
            return false;
        }
        return true;
    },
});

export const resetPassword = mutation({
    args: { token: v.string(), email: v.string(), newPassword: v.string() },
    handler: async (ctx, args) => {
        const resetEntry = await ctx.db
            .query("passwordResetTokens")
            .withIndex("by_token", (q) => q.eq("token", args.token))
            .unique();

        if (!resetEntry || resetEntry.email !== args.email || resetEntry.expires < Date.now()) {
            throw new Error("Invalid or expired reset token");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();

        if (user) {
            await ctx.db.patch(user._id, { password: args.newPassword });
        } else {
            const organiser = await ctx.db
                .query("organisers")
                .filter((q) => q.eq(q.field("userId"), args.email))
                .unique();
            if (organiser) {
                await ctx.db.patch(organiser._id, { password: args.newPassword });
            } else {
                throw new Error("User not found");
            }
        }

        // Cleanup token
        await ctx.db.delete(resetEntry._id);

        // Cleanup debug link
        const debugLink = await ctx.db.query("systemConfig").filter(q => q.eq(q.field("key"), `reset_link_${args.email}`)).first();
        if (debugLink) await ctx.db.delete(debugLink._id);

        return true;
    },
});

// Internal helper for OTP generation and delivery
async function internalSendOTP(ctx: MutationCtx, rawEmail: string, purpose: string) {
    const email = rawEmail.trim().toLowerCase();
    // Generate a strictly 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString().padStart(6, '0');
    const expires = Date.now() + 600000; // 10 minutes

    const existing = await ctx.db
        .query("otps")
        .withIndex("by_email", (q) => q.eq("email", email))
        .filter((q) => q.eq(q.field("purpose"), purpose))
        .collect();
    for (const doc of existing) await ctx.db.delete(doc._id);

    await ctx.db.insert("otps", { email, code: otp, expires, purpose });
    
    // Store in systemConfig for backward compatibility and easier debugging if email fails
    const configKey = `last_otp_${email}`;
    const existingConfig = await ctx.db.query("systemConfig").withIndex("by_key", q => q.eq("key", configKey)).first();
    if (existingConfig) {
        await ctx.db.patch(existingConfig._id, { value: otp });
    } else {
        await ctx.db.insert("systemConfig", { key: configKey, value: otp });
    }

    console.log("=================================================");
    console.log(`🎟️ [OTP DEBUG] Purpose: ${purpose}`);
    console.log(`🎟️ [OTP DEBUG] Email: ${email}`);
    console.log(`🎟️ [OTP DEBUG] Generated OTP: ${otp} (Length: ${otp.length})`);
    console.log(`🎟️ [OTP DEBUG] Stored in systemConfig as: ${configKey}`);
    console.log("=================================================");

    const branding = await ctx.db.query("siteBranding").first();
    const siteUrl = branding?.siteUrl || "https://bookmyticket.vercel.app";
    let brandLogo = branding?.logoUrl || "/logo.png";
    if (brandLogo.startsWith("/")) {
        brandLogo = `${siteUrl}${brandLogo}`;
    }
    const brandNameDisplay = branding?.name || "BookMyTicket";
    
    // Check for SMTP settings to avoid silent failure
    const settings = await ctx.db.query("emailSettings").first();
    if (!settings || !settings.host || !settings.user || !settings.pass) {
        console.error("🎟️ [OTP ERROR] SMTP settings are not configured. Cannot send email.");
        console.log(`🎟️ [OTP DEBUG] OTP ${otp} is available in systemConfig for key: ${configKey}`);
        throw new Error("Email service not configured. Admin: Please set SMTP in Admin Panel > Email Settings.");
    }

    await ctx.scheduler.runAfter(0, api.emailActions.sendEmail, {
        to: email,
        subject: `${otp} is your ${brandNameDisplay} verification code`,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 40px auto; padding: 40px 20px; border: 1px solid #e2e8f0; border-radius: 16px; text-align: center; color: #1e293b; background-color: #ffffff;">
                <div style="margin-bottom: 30px;">
                    <img src="${brandLogo}" alt="${brandNameDisplay}" style="max-height: 60px; width: auto; display: block; margin: 0 auto;">
                </div>
                
                <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 16px; color: #0f172a;">Verify your email</h1>
                <p style="font-size: 16px; line-height: 24px; color: #475569; margin-bottom: 32px;">
                    Hello! To complete your ${purpose === 'signup' ? 'registration' : 'login'} on ${brandNameDisplay}, please use the verification code below:
                </p>
                
                <div style="display: inline-block; padding: 16px 32px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 32px;">
                    <span style="font-family: monospace; font-size: 36px; font-weight: 700; letter-spacing: 6px; color: #be185d;">${otp}</span>
                </div>
                
                <p style="font-size: 14px; color: #64748b; margin-top: 24px;">
                    This code will expire in <strong>10 minutes</strong>. If you did not request this code, you can safely ignore this email.
                </p>
                
                <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; line-height: 18px;">
                    <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${brandNameDisplay}. All rights reserved.</p>
                    <p style="margin: 4px 0;">This is an automated message from <a href="${siteUrl}" style="color: #6366f1; text-decoration: none;">${brandNameDisplay}</a></p>
                    <p style="margin: 12px 0 0 0;">Don't want to receive these? Please contact support via our website.</p>
                </div>
            </div>
        `,
    });
}

export const sendOTP = mutation({
    args: { email: v.string(), purpose: v.string() }, // "signup" | "login"
    handler: async (ctx, args) => {
        const email = args.email.trim().toLowerCase();
        await internalSendOTP(ctx, email, args.purpose);
        return true;
    },
});

export const testOTP = mutation({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        await internalSendOTP(ctx, args.email, "test");
        return "Check the Convex dashboard or terminal logs for the 6-digit OTP.";
    },
});

export const verifyOTPOnly = mutation({
    args: { email: v.string(), code: v.string(), purpose: v.string() },
    handler: async (ctx, args) => {
        const email = args.email.trim().toLowerCase();
        const otpEntry = await ctx.db
            .query("otps")
            .withIndex("by_email", (q) => q.eq("email", email))
            .filter((q) => q.eq(q.field("code"), args.code))
            .filter((q) => q.eq(q.field("purpose"), args.purpose))
            .unique();

        if (!otpEntry || otpEntry.expires < Date.now()) {
            throw new Error("Invalid or expired code.");
        }
        return true;
    },
});

export const verifyOTPAndCreateAccount = mutation({
    args: { 
        email: v.string(), 
        code: v.string(), 
        password: v.string(),
        fullName: v.string(),
        username: v.string(),
    },
    handler: async (ctx, args) => {
        const email = args.email.trim().toLowerCase();
        const otpEntry = await ctx.db
            .query("otps")
            .withIndex("by_email", (q) => q.eq("email", email))
            .filter((q) => q.eq(q.field("code"), args.code))
            .filter((q) => q.eq(q.field("purpose"), "signup"))
            .unique();

        if (!otpEntry || otpEntry.expires < Date.now()) {
            throw new Error("Invalid or expired OTP");
        }

        // Cleanup OTP
        await ctx.db.delete(otpEntry._id);

        // Check if user already exists
        const existing = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", args.email)).first();
        if (existing) throw new Error("Email already registered");

        // Create User
        const userId = await ctx.db.insert("users", {
            fullName: args.fullName,
            username: args.username,
            email: args.email,
            password: args.password, // Frontend should hash this before sending
            role: "user",
            status: "Active",
            createdAt: Date.now(),
        });

        await ctx.scheduler.runAfter(0, api.notificationActions.sendSignupGreeting, {
            email: args.email,
            fullName: args.fullName,
        });

        return userId;
    },
});

export const login = mutation({
    args: { identifier: v.string(), password: v.string() }, // password is hashed
    handler: async (ctx, args) => {
        const identifier = args.identifier.trim().toLowerCase();
        
        // 1. Check Users table
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identifier))
            .unique() || 
            await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", identifier))
            .unique();

        if (user && user.password === args.password) {
            if (user.status === "Banned" || user.status === "Inactive") {
                throw new Error("Account is restricted.");
            }
            // Trigger login OTP using helper
            await internalSendOTP(ctx, user.email, "login");
            return { success: true, needsOtp: true, email: user.email };
        }

        // 2. Check Admins table (Team Management) — by username OR email
        const teamMemberByUsername = await ctx.db
            .query("admins")
            .withIndex("by_username", (q) => q.eq("username", identifier))
            .unique();
        
        const teamMemberByEmail = !teamMemberByUsername ? await ctx.db
            .query("admins")
            .withIndex("by_email", (q) => q.eq("email", identifier))
            .unique() : null;

        const teamMember = teamMemberByUsername || teamMemberByEmail;

        if (teamMember && teamMember.password === args.password) {
            if (teamMember.status === "Inactive") {
                throw new Error("Account is inactive.");
            }
            await ctx.db.patch(teamMember._id, { lastLogin: Date.now() });
            // Return 'admin' role if the database role is 'Admin', otherwise 'admin_team'
            const activeRole = teamMember.role === "Admin" ? "admin" : "admin_team";
            return { success: true, role: activeRole, data: teamMember };
        }

        // 3. Check Staff table
        const staff = await ctx.db
            .query("staff")
            .withIndex("by_email", (q) => q.eq("email", identifier))
            .unique();

        if (staff && staff.password === args.password) {
            return { success: true, role: "staff", data: staff };
        }

        // 3. Check Organisers table
        const organiser = await ctx.db
            .query("organisers")
            .withIndex("by_userId", (q) => q.eq("userId", identifier))
            .unique();

        if (organiser && organiser.password === args.password) {
            if (organiser.kycStatus === "Banned" || organiser.kycStatus === "Rejected") {
                return { success: false, error: "Account is restricted." };
            }
            return { success: true, role: "organiser", data: organiser };
        }

        return { success: false, error: "Invalid username / email or password." };
    },
});

export const verifyLoginOTP = mutation({
    args: { email: v.string(), code: v.string() },
    handler: async (ctx, args) => {
        const otpEntry = await ctx.db
            .query("otps")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .filter((q) => q.eq(q.field("code"), args.code))
            .filter((q) => q.eq(q.field("purpose"), "login"))
            .unique();

        if (!otpEntry || otpEntry.expires < Date.now()) {
            throw new Error("Invalid or expired OTP");
        }

        // Cleanup OTP
        await ctx.db.delete(otpEntry._id);

        // Check Users table
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();

        if (user) {
            await ctx.db.patch(user._id, { lastLogin: Date.now() });
            
            // Even if found in users, check if they are an active organiser
            const organiser = await ctx.db
                .query("organisers")
                .withIndex("by_userId", (q) => q.eq("userId", args.email))
                .unique();
            
            if (organiser && organiser.kycStatus !== "Banned" && organiser.kycStatus !== "Rejected") {
                return { success: true, role: "organiser", data: organiser };
            }

            return { success: true, role: "user", data: user };
        }

        // If not in users, check Organisers table specifically
        const organiserOnly = await ctx.db
            .query("organisers")
            .withIndex("by_userId", (q) => q.eq("userId", args.email))
            .unique();

        if (organiserOnly) {
            if (organiserOnly.kycStatus === "Banned" || organiserOnly.kycStatus === "Rejected") {
                throw new Error("Account is restricted.");
            }
            return { success: true, role: "organiser", data: organiserOnly };
        }

        throw new Error("User not found");
    },
});


