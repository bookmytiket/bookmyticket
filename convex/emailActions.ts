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
            provider: v.optional(v.string()), // "SMTP" | "MICROSOFT_365"
            host: v.optional(v.string()),
            port: v.optional(v.number()),
            user: v.optional(v.string()),
            pass: v.optional(v.string()),
            from: v.string(),
            fromName: v.optional(v.string()),
            encryption: v.optional(v.string()),
            authMethod: v.optional(v.string()),
            microsoft365: v.optional(v.object({
                clientId: v.string(),
                tenantId: v.string(),
                clientSecret: v.string(),
                status: v.optional(v.string()),
            })),
        })),
    },
    handler: async (ctx, args) => {
        let settings = args.settings;
        if (!settings) {
            settings = await ctx.runQuery(api.emailSettings.get) as any;
        }
        
        if (!settings) {
            console.error("Email settings are not configured in the admin panel.");
            return { success: false, error: "Email settings not configured." };
        }

        const provider = settings.provider || "SMTP";

        if (provider === "MICROSOFT_365" && settings.microsoft365) {
            const { clientId, tenantId, clientSecret } = settings.microsoft365;
            const fromEmail = settings.from;

            try {
                console.log(`Attempting to send email via Microsoft 365 (Graph API) to ${args.to}...`);
                
                // 1. Get Access Token (Client Credentials Flow)
                const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        grant_type: 'client_credentials',
                        client_id: clientId,
                        client_secret: clientSecret,
                        scope: 'https://graph.microsoft.com/.default'
                    })
                });

                if (!tokenResponse.ok) {
                    const error = await tokenResponse.json();
                    throw new Error(`Failed to get access token: ${error.error_description || error.error}`);
                }

                const tokenData = await tokenResponse.json();
                const accessToken = tokenData.access_token;

                // 2. Send Email
                const sendMailResponse = await fetch(`https://graph.microsoft.com/v1.0/users/${fromEmail}/sendMail`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: {
                            subject: args.subject,
                            body: {
                                contentType: 'HTML',
                                content: args.html
                            },
                            toRecipients: [
                                { emailAddress: { address: args.to } }
                            ]
                        },
                        saveToSentItems: 'true'
                    })
                });

                if (!sendMailResponse.ok) {
                    const error = await sendMailResponse.json();
                    throw new Error(`Graph API sendMail failed: ${error.error?.message || JSON.stringify(error)}`);
                }

                console.log("✅ Email sent successfully via Microsoft 365.");
                return { success: true };

            } catch (error: any) {
                console.error("❌ Microsoft 365 Error:", error);
                return { success: false, error: String(error.message || error) };
            }
        }

        // Fallback to SMTP
        if (!settings.host || !settings.user || !settings.pass) {
            console.error("SMTP settings are not fully configured.");
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
            requireTLS: settings.port === 587,
            tls: {
                ciphers: 'SSLv3',
                rejectUnauthorized: false
            }
        });

        try {
            const fromName = settings.fromName || "BookMyTicket";
            const fromEmail = settings.from || "hello@bookmyticket.net";
            const toEmail = args.to.trim().toLowerCase();
            
            console.log(`Attempting to send email to ${toEmail} via SMTP (${settings.host})...`);
            
            await transporter.verify();

            const info = await transporter.sendMail({
                from: `"${fromName}" <${fromEmail}>`,
                to: toEmail,
                subject: args.subject,
                html: args.html,
                headers: {
                    "X-Entity-Ref-ID": `${Date.now()}-${toEmail}`,
                    "X-Auto-Response-Suppress": "OOF, AutoReply",
                }
            });
            console.log("✅ Email sent successfully via SMTP.");
            
            return { success: true, messageId: info.messageId };
        } catch (error: any) {
            console.error("❌ SMTP Error:", error);
            return { success: false, error: String(error?.message || error) };
        }
    },
});
