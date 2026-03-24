import { v } from "convex/values";
import { mutation, query, action, MutationCtx } from "./_generated/server";
import { api } from "./_generated/api";

export const forgotPassword = mutation({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
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

        const brandLogo = "https://bookmyticket-nu.vercel.app/logo.png";
        const brandNameDisplay = "BookMyTicket";

        const resetLink = `http://localhost:3000/reset-password?token=${token}&email=${args.email}`;

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
async function internalSendOTP(ctx: MutationCtx, email: string, purpose: string) {
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

    console.log("=================================================");
    console.log(`🎟️ [OTP DEBUG] Purpose: ${purpose}`);
    console.log(`🎟️ [OTP DEBUG] Email: ${email}`);
    console.log(`🎟️ [OTP DEBUG] Generated OTP: ${otp} (Length: ${otp.length})`);
    console.log("=================================================");

    const brandLogo = "https://bookmyticket-nu.vercel.app/logo.png";
    const brandNameDisplay = "BookMyTicket";

    await ctx.scheduler.runAfter(0, api.emailActions.sendEmail, {
        to: email,
        subject: `${otp} is your ${brandNameDisplay} verification code`,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 40px 20px; border: 1px solid #eee; border-radius: 12px; text-align: center;">
                <img src="${brandLogo}" alt="${brandNameDisplay}" style="max-height: 70px; width: auto; margin-bottom: 25px; color: #333; font-size: 24px; font-weight: bold;">
                <h2 style="color: #333; margin-bottom: 20px;">Verification Code</h2>
                <p style="color: #555; font-size: 16px; margin-bottom: 30px;">Your verification code for ${purpose === 'signup' ? 'creating an account' : 'logging in'} is:</p>
                <div style="font-size: 32px; font-weight: 800; color: #ff007f; letter-spacing: 4px; margin-bottom: 30px; padding: 10px; background: #fdf2f8; border-radius: 8px; display: inline-block;">
                    ${otp}
                </div>
                <p style="color: #999; font-size: 14px; margin-top: 35px;">This code will expire in 10 minutes. Please do not share this code with anyone.</p>
            </div>
        `,
    });
}

export const sendOTP = mutation({
    args: { email: v.string(), purpose: v.string() }, // "signup" | "login"
    handler: async (ctx, args) => {
        await internalSendOTP(ctx, args.email, args.purpose);
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
        const otpEntry = await ctx.db
            .query("otps")
            .withIndex("by_email", (q) => q.eq("email", args.email))
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
        const otpEntry = await ctx.db
            .query("otps")
            .withIndex("by_email", (q) => q.eq("email", args.email))
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
        return await ctx.db.insert("users", {
            fullName: args.fullName,
            username: args.username,
            email: args.email,
            password: args.password, // Frontend should hash this before sending
            role: "user",
            status: "Active",
            createdAt: Date.now(),
        });
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
            return { success: true, role: "admin_team", data: teamMember };
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


