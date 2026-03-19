"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import nodemailer from "nodemailer";

export const sendEmail = action({
    args: {
        to: v.string(),
        subject: v.string(),
        html: v.string(),
        settings: v.optional(v.object({
            host: v.string(),
            port: v.number(),
            user: v.string(),
            pass: v.string(),
            from: v.string(),
            fromName: v.optional(v.string()),
            encryption: v.optional(v.string()),
            authMethod: v.optional(v.string()),
        })),
    },
    handler: async (ctx, args) => {
        let settings = args.settings;
        if (!settings) {
            settings = await ctx.runQuery(api.emailSettings.get) as any;
        }
        
        if (!settings || !settings.host || !settings.user || !settings.pass) {
            console.error("SMTP settings are not fully configured in the admin panel.");
            return { success: false, error: "SMTP settings not configured." };
        }

        const isSecure = settings.encryption === "SSL" || settings.port === 465;
        const auth = settings.authMethod === "None" ? undefined : {
            user: settings.user,
            pass: settings.pass,
        };

        const transporter = nodemailer.createTransport({
            host: settings.host,
            port: settings.port,
            secure: isSecure,
            auth: auth,
            // For TLS/STARTTLS (usually port 587), nodemailer does it by default if secure is false.
            // But we can be explicit if needed.
            tls: {
                rejectUnauthorized: false // Often needed for some SMTP servers
            }
        });

        try {
            const fromName = settings.fromName || "Ticketing Tool";
            const fromEmail = settings.from || settings.user;
            
            await transporter.sendMail({
                from: `"${fromName}" <${fromEmail}>`,
                to: args.to,
                subject: args.subject,
                html: args.html,
            });
            console.log("Email sent successfully to:", args.to);
            return { success: true };
        } catch (error) {
            console.error("Error sending email to", args.to, ":", error);
            return { success: false, error: String(error) };
        }
    },
});
