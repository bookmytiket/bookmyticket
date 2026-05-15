import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper: Microsoft 365 Graph API Email Dispatch
const sendM365Email = async (m365Config, fromEmail, toEmail, subject, content) => {
    const client_id = m365Config.client_id || m365Config.clientId;
    const tenant_id = m365Config.tenant_id || m365Config.tenantId;
    const client_secret = m365Config.client_secret || m365Config.clientSecret;
    
    const tokenRes = await fetch(`https://login.microsoftonline.com/${tenant_id}/oauth2/v2.0/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "client_credentials",
            client_id,
            client_secret,
            scope: "https://graph.microsoft.com/.default",
        }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(tokenData.error_description || "Authentication failed.");

    const access_token = tokenData.access_token;
    const sendRes = await fetch(`https://graph.microsoft.com/v1.0/users/${fromEmail}/sendMail`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            message: {
                subject,
                body: { contentType: "HTML", content },
                toRecipients: [{ emailAddress: { address: toEmail } }],
            },
        }),
    });

    if (!sendRes.ok) throw new Error("Failed to send email via Microsoft Graph API.");
    return true;
};

export async function POST(request) {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        const { action, data } = await request.json();

        if (action === 'verify-request') {
            const { requestId, status } = data;

            // Update request status
            const { data: requestData, error: updateError } = await supabaseAdmin
                .from('partner_requests')
                .update({ 
                    status: status, 
                    approved_at: status === 'Approved' ? new Date().toISOString() : null 
                })
                .eq('id', requestId)
                .select()
                .single();

            if (updateError) throw updateError;

            // Map requestData for downstream logic (e.g. requestData.mobile -> phone)
            requestData.full_name = requestData.full_name || `${requestData.first_name} ${requestData.last_name}`;
            requestData.mobile = requestData.phone;
            requestData.service_category = requestData.category;
            requestData.description = requestData.remarks;

            // Auto-provisioning flow on 'Approved'
            if (status === 'Approved') {
                const tempPassword = Math.random().toString(36).slice(-10) + 'A1!'; // Generate a secure temp password

                // 1. Create Auth User
                const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
                    email: requestData.email,
                    password: tempPassword,
                    email_confirm: true,
                    user_metadata: {
                        role: 'provider',
                        full_name: requestData.full_name
                    }
                });

                if (authError && !authError.message.includes('User already registered')) {
                    throw authError;
                }

                // If user already exists, fetch their ID
                let userId = authUser?.user?.id;
                if (!userId) {
                    const { data: existingUser } = await supabaseAdmin.rpc('get_user_id_by_email', { email_input: requestData.email });
                    userId = existingUser;
                }

                // 2. Insert into profiles with provider role
                await supabaseAdmin
                    .from('profiles')
                    .upsert({
                        id: userId,
                        email: requestData.email,
                        full_name: requestData.full_name,
                        role: 'provider',
                        phone: requestData.mobile,
                        status: 'active'
                    });

                // 3. Create professional_service_profiles
                await supabaseAdmin
                    .from('professional_service_profiles')
                    .upsert({
                        auth_user_id: userId,
                        request_id: requestId,
                        full_name: requestData.full_name,
                        email: requestData.email,
                        business_name: requestData.business_name,
                        category: requestData.service_category,
                        service_type: requestData.service_type,
                        city: requestData.city,
                        description: requestData.description,
                        active_status: true
                    });

                // 4. Send Approval Email with credentials
                const { data: settings } = await supabaseAdmin.from('email_settings').select('*').eq('provider', 'MICROSOFT_365').single();
                if (settings && settings.microsoft_365) {
                    const fromEmail = settings.from_email || 'hello@bookmyticket.net';
                    const subject = "Welcome to BookMyTicket Partner Network!";
                    const htmlContent = `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 25px; border-radius: 12px;">
                            <h2 style="color: #8b5cf6;">Application Approved!</h2>
                            <p>Hi ${requestData.full_name},</p>
                            <p>Your request to join the BookMyTicket Partner Network as a Professional Service Provider has been approved.</p>
                            <p>You can now log in to the provider portal to manage your services and bookings.</p>
                            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <p><strong>Login URL:</strong> ${process.env.NEXT_PUBLIC_BASE_URL}/login</p>
                                <p><strong>Email:</strong> ${requestData.email}</p>
                                <p><strong>Temporary Password:</strong> ${tempPassword}</p>
                            </div>
                            <p>Please log in and change your password immediately.</p>
                        </div>
                    `;
                    try {
                        await sendM365Email(settings.microsoft_365, fromEmail, requestData.email, subject, htmlContent);
                    } catch (e) {
                        console.error("Failed to send approval email:", e);
                    }
                }
            } else if (status === 'Rejected') {
                // Send rejection email
                const { data: settings } = await supabaseAdmin.from('email_settings').select('*').eq('provider', 'MICROSOFT_365').single();
                if (settings && settings.microsoft_365) {
                    const fromEmail = settings.from_email || 'hello@bookmyticket.net';
                    const subject = "Update on your Partner Request - BookMyTicket";
                    const htmlContent = `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 25px; border-radius: 12px;">
                            <h2 style="color: #ef4444;">Application Update</h2>
                            <p>Hi ${requestData.full_name},</p>
                            <p>We have reviewed your request to join the BookMyTicket Partner Network.</p>
                            <p>Unfortunately, we are unable to approve your application at this time.</p>
                        </div>
                    `;
                    try {
                        await sendM365Email(settings.microsoft_365, fromEmail, requestData.email, subject, htmlContent);
                    } catch (e) {
                        console.error("Failed to send rejection email:", e);
                    }
                }
            }

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (err) {
        console.error("Action error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
