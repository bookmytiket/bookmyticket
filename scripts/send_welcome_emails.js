const nodemailer = require('nodemailer');

const config = {
  host: "smtp.gmail.com",
  port: 587,
  auth: {
    user: "hello@bookmyticket.net",
    pass: "ekdt upgc ursb jplk"
  }
};

const brandName = "bookmyticket";
const siteUrl = "https://bookmyticket.net";
const brandLogo = "https://bookmyticket.net/logo.png";

// VERIFIED SMALL LOGO (Base64) - This ensures the logo displays even without a public URL
const logoBase64 = "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";

const subscribers = [
  "thirumalairaja67@gmail.com",
  "v.raja2mail@gmail.com",
  "v.rajadece@gmail.com",
  "kloudinfotech.in@gmail.com"
];

async function sendWelcome(email) {
  const transporter = nodemailer.createTransport(config);

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background-color: #ffffff; padding: 30px; text-align: center; border-bottom: 1px solid #f1f5f9;">
            <!-- EMBEDDED LOGO -->
            <img src="data:image/png;base64,${logoBase64}" alt="${brandName}" style="max-height: 50px; width: auto;">
        </div>
        <div style="padding: 40px; color: #1e293b; line-height: 1.6; text-align: center;">
            <h2 style="color: #0f172a; margin-top: 0; font-size: 24px;">Welcome to ${brandName}!</h2>
            <p style="font-size: 16px;">Thank you for subscribing to our newsletter.</p>
            <p style="font-size: 16px; margin-bottom: 30px;">We're excited to have you in our community. You'll be the first to know about the most exciting events near you.</p>
            
            <a href="${siteUrl}/events" style="background-color: #f844a4; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 10px rgba(248, 68, 164, 0.2);">Browse Events Now</a>
            
            <div style="margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 30px;">
                <p style="font-size: 14px; color: #64748b; margin: 0;">Join our network as a partner:</p>
                <a href="${siteUrl}/signup" style="color: #f844a4; font-weight: 600; text-decoration: none;">Become a Partner →</a>
                <p style="font-size: 14px; color: #64748b; margin-top: 10px;">Visit us at <a href="${siteUrl}" style="color: #64748b; text-decoration: underline;">bookmyticket.net</a></p>
            </div>
        </div>
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9;">
            © 2026 ${brandName}. All rights reserved.
        </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"${brandName}" <hello@bookmyticket.net>`,
      to: email,
      subject: `Welcome to ${brandName}`,
      html: html
    });
    console.log(`✅ Sent to ${email}: ${info.messageId}`);
  } catch (err) {
    console.error(`❌ Failed for ${email}: ${err.message}`);
  }
}

async function main() {
  console.log(`Starting final manual email send with EMBEDDED LOGO...`);
  for (const email of subscribers) {
    await sendWelcome(email);
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log("Done.");
}

main();
