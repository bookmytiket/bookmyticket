import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seed() {
  console.log("Seeding Supabase settings tables...");

  // 1. Fee Settings
  const { data: feeExists } = await supabase.from('fee_settings').select('id').limit(1);
  if (!feeExists || feeExists.length === 0) {
    await supabase.from('fee_settings').insert({
      convenience_fee_type: "percent",
      convenience_fee_value: 5,
      gst_percent: 18
    });
    console.log("Added default fee settings.");
  }

  // 2. Ticket Settings
  const { data: ticketExists } = await supabase.from('ticket_settings').select('id').limit(1);
  if (!ticketExists || ticketExists.length === 0) {
    await supabase.from('ticket_settings').insert({
      company_name: "book my ticket",
      important_info: "We are book my ticket and we are dedicated to selling tickets for the best events. book my ticket is not the event organizer and is not responsible for event conditions, safety, rescheduling, or cancellations. Present this ticket (printed or on your phone) with a valid ID at the venue. Do not share this ticket with others.",
      support_url: "https://bookmyticket.net",
      send_via_email: true,
      send_via_sms: true,
      send_pdf_whatsapp: true,
      auto_approve: true,
      notify_organiser: true,
      notify_user: true,
      invoice_prefix: "BMT-"
    });
    console.log("Added default ticket settings.");
  }

  // 3. Email Settings
  const { data: emailExists } = await supabase.from('email_settings').select('id').limit(1);
  if (!emailExists || emailExists.length === 0) {
    await supabase.from('email_settings').insert({
      host: "smtp.gmail.com",
      port: 587,
      user_name: "v.raja2mail@gmail.com",
      pass: "",
      from_email: "v.raja2mail@gmail.com",
      from_name: "BookMyTicket",
      encryption: "TLS",
      auth_method: "App Password"
    });
    console.log("Added default email settings.");
  }

  // 4. SEO Settings
  const { data: seoExists } = await supabase.from('seo_settings').select('id').limit(1);
  if (!seoExists || seoExists.length === 0) {
    await supabase.from('seo_settings').insert({
      global_title: "BookMyTicket - Best Event Ticketing Platform",
      global_keywords: "tickets, events, concerts, sports, theater",
      global_description: "Book tickets for your favorite events, concerts, movies and more."
    });
    console.log("Added default SEO settings.");
  }

  // 5. Policies
  const { data: policyExists } = await supabase.from('policies').select('id').limit(1);
  if (!policyExists || policyExists.length === 0) {
    await supabase.from('policies').insert({
      booking_header: "Disclaimer: All ticket bookings are final. Please review event details, date, and venue carefully before payment.",
      payment_terms: "By proceeding with the payment, you agree to our Terms of Service and Privacy Policy.",
      event_disclaimer: "Organizers are solely responsible for event content and management.",
      cancellation_policy: "Refunds are subject to individual event organizer policies."
    });
    console.log("Added default policies.");
  }

  // 6. Email Templates
  const { data: templatesExist } = await supabase.from('email_templates').select('id').limit(1);
  if (!templatesExist || templatesExist.length === 0) {
    const defaults = [
      { identifier: "booking", name: "Ticket Booking Confirmation", subject: "Your Tickets for {{event_name}}", body: "Hello {{user_name}},\n\nYour tickets for {{event_name}} are confirmed.\n\nDate: {{event_date}}\nVenue: {{event_venue}}\n\nDownload your ticket here: {{ticket_url}}\n\nThank you for booking with us!", auto_send: true },
      { identifier: "canceled", name: "Ticket Booking Canceled", subject: "Booking Canceled: {{event_name}}", body: "Hello {{user_name}},\n\nYour booking for {{event_name}} has been canceled.\n\nRefund details: {{refund_info}}\n\nWe hope to see you again soon.", auto_send: true },
      { identifier: "registration", name: "User Registration", subject: "Welcome to BookMyTicket!", body: "Welcome to BookMyTicket!\n\nYour account has been successfully created.\n\nStart exploring events here: {{site_url}}", auto_send: true },
      { identifier: "otp", name: "OTP Verification", subject: "{{otp}} is your verification code", body: "Your verification code is: {{otp}}\n\nDo not share this code with anyone.", auto_send: true },
    ];
    await supabase.from('email_templates').insert(defaults);
    console.log("Added default email templates.");
  }

  // 7. Pages
  const { data: pagesExist } = await supabase.from('pages').select('id').limit(1);
  if (!pagesExist || pagesExist.length === 0) {
    const defaults = [
      { title: "About Us", slug: "about-us", content: "<h1>About Us</h1><p>Welcome to BookMyTicket.</p>", show_in_footer: true, sort_order: 0 },
      { title: "Privacy Policy", slug: "privacy-policy", content: "<h1>Privacy Policy</h1><p>Your privacy is important to us.</p>", show_in_footer: true, sort_order: 1 },
      { title: "Terms of Service", slug: "terms-of-service", content: "<h1>Terms of Service</h1><p>By using our service, you agree to these terms.</p>", show_in_footer: true, sort_order: 2 },
    ];
    await supabase.from('pages').insert(defaults);
    console.log("Added default pages.");
  }

  console.log("Seeding complete!");
}

seed().catch(console.error);
