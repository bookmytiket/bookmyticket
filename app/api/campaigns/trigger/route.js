import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// HTML Template Engine for Events
const generateEventEmailHTML = (event, baseUrl) => {
  const eventName = event.title || event.name || 'New Event';
  const category = event.category || 'Event';
  const location = event.location || event.city || 'TBA';
  const price = event.price ? `₹${event.price}` : 'Free';
  const date = event.date || event.start_date || 'TBA';
  const heroImage = event.img || event.banner_url || 'https://via.placeholder.com/600x300?text=BookMyTicket';
  const eventUrl = `${baseUrl}/events/detail?id=${event.id}`;

  return `
    <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #f1f5f9;">
      <!-- Hero Banner -->
      <div style="width: 100%; height: 250px; background-image: url('${heroImage}'); background-size: cover; background-position: center;"></div>
      
      <!-- Content Body -->
      <div style="padding: 40px 30px;">
        <div style="display: inline-block; padding: 6px 12px; background-color: #fce7f3; color: #db2777; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; border-radius: 20px; margin-bottom: 16px;">
          ${category}
        </div>
        
        <h1 style="margin: 0 0 12px 0; color: #0f172a; font-size: 28px; font-weight: 900; line-height: 1.2;">
          ${eventName}
        </h1>
        
        <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.5;">
          A new experience is now live on BookMyTicket! Grab your tickets before they sell out.
        </p>

        <!-- Event Details Grid -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
            <span style="color: #64748b; font-size: 14px; font-weight: 600;">Date & Time</span>
            <span style="color: #0f172a; font-size: 14px; font-weight: 800;">${date}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
            <span style="color: #64748b; font-size: 14px; font-weight: 600;">Location</span>
            <span style="color: #0f172a; font-size: 14px; font-weight: 800;">${location}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b; font-size: 14px; font-weight: 600;">Starting Price</span>
            <span style="color: #db2777; font-size: 16px; font-weight: 900;">${price}</span>
          </div>
        </div>

        <!-- CTA -->
        <div style="text-align: center;">
          <a href="${eventUrl}" style="display: inline-block; background: linear-gradient(135deg, #f84464 0%, #db2777 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 800; padding: 16px 40px; border-radius: 30px; box-shadow: 0 10px 20px -10px rgba(219,39,119,0.5); text-transform: uppercase; letter-spacing: 1px;">
            Book Tickets Now
          </a>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="background-color: #0f172a; padding: 30px; text-align: center;">
        <h3 style="color: #ffffff; margin: 0 0 10px 0; font-size: 18px; font-weight: 800;">BookMyTicket</h3>
        <p style="color: #94a3b8; font-size: 12px; margin: 0 0 20px 0;">Your ultimate destination for live experiences.</p>
        <div style="border-top: 1px solid #1e293b; padding-top: 20px;">
          <a href="${baseUrl}/unsubscribe" style="color: #64748b; font-size: 11px; text-decoration: underline;">Unsubscribe from event alerts</a>
        </div>
      </div>
    </div>
  `;
};

// WhatsApp Template Generator
const generateWhatsAppTemplate = (event, baseUrl) => {
  const eventName = event.title || event.name || 'New Event';
  const location = event.location || event.city || 'TBA';
  const price = event.price ? `₹${event.price}` : 'Free';
  const date = event.date || event.start_date || 'TBA';
  const eventUrl = `${baseUrl}/events/detail?id=${event.id}`;

  return `🎉 *New Event Just Dropped!*\n\n*${eventName}* is now live on BookMyTicket.\n\n📍 *Venue:* ${location}\n📅 *Date:* ${date}\n💰 *Price:* Starting from ${price}\n\nBook your tickets now before they sell out!\n\n👉 *Book Now:* ${eventUrl}`;
};

export async function POST(request) {
  try {
    const { eventId, force = false } = await request.json();

    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    }

    // 1. Fetch Event Details
    const { data: event, error: eventErr } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventErr || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.publish_status !== 'published' && event.status !== 'published' && !force) {
      return NextResponse.json({ error: 'Event is not published yet. Use force=true to bypass.' }, { status: 400 });
    }

    // 2. Prevent Duplicate Campaigns
    const { data: existingCampaign } = await supabaseAdmin
      .from('event_campaigns')
      .select('id')
      .eq('event_id', eventId)
      .eq('status', 'completed')
      .maybeSingle();

    if (existingCampaign && !force) {
      return NextResponse.json({ error: 'Campaign already completed for this event' }, { status: 400 });
    }

    // 3. Create Campaign Record
    const { data: campaign, error: campaignErr } = await supabaseAdmin
      .from('event_campaigns')
      .insert({
        event_id: eventId,
        campaign_name: `Launch: ${event.title || event.name}`,
        campaign_type: 'all',
        audience_type: 'all',
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (campaignErr) {
       // Table might not exist yet if migration isn't run.
       console.error("Campaign insert error:", campaignErr);
       return NextResponse.json({ error: 'Database tables not ready. Please run the migration script first.', details: campaignErr }, { status: 500 });
    }

    const campaignId = campaign.id;

    // 4. Fetch Target Audience (All Opted-In Users)
    // First try the new notification_subscribers table
    let users = [];
    const { data: subscribers, error: subErr } = await supabaseAdmin
      .from('notification_subscribers')
      .select('user_id, email, phone, email_enabled, whatsapp_enabled, push_enabled')
      .eq('marketing_enabled', true);

    if (!subErr && subscribers?.length > 0) {
      users = subscribers;
    } else {
      // Fallback to all registered profiles if notification table is empty/unpopulated
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, email, phone')
        .not('email', 'is', null);
      
      if (profiles) {
        users = profiles.map(p => ({
          user_id: p.id,
          email: p.email,
          phone: p.phone,
          email_enabled: true,
          whatsapp_enabled: !!p.phone,
          push_enabled: true
        }));
      }
    }

    // Apply basic location matching if event has a city
    if (event.city) {
      const { data: interestProfiles } = await supabaseAdmin
        .from('user_interest_profiles')
        .select('user_id, preferred_cities');
      
      if (interestProfiles && interestProfiles.length > 0) {
        // Create a set of users who prefer this city
        const cityMatches = new Set(
          interestProfiles
            .filter(ip => ip.preferred_cities?.includes(event.city))
            .map(ip => ip.user_id)
        );
        
        // Boost priority for matched users (in a real system, we might sort or segment them)
        // For now, we will just blast everyone, but we could filter here.
      }
    }

    // 5. Generate Content
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.bookmyticket.net';
    const emailHtml = generateEventEmailHTML(event, baseUrl);
    const whatsappText = generateWhatsAppTemplate(event, baseUrl);
    const pushTitle = `🔥 New Event: ${event.title || 'Live Now'}`;
    const pushMessage = `Tickets are now available. Tap to book your spot!`;

    // 6. Queue Notifications in Batches
    const queuePayloads = [];
    
    users.forEach(user => {
      // Queue Email
      if (user.email_enabled && user.email) {
        queuePayloads.push({
          campaign_id: campaignId,
          user_id: user.user_id,
          channel: 'email',
          payload: { to: user.email, subject: `🎉 New Event in Your City: ${event.title}`, html: emailHtml }
        });
      }
      
      // Queue WhatsApp
      if (user.whatsapp_enabled && user.phone) {
        queuePayloads.push({
          campaign_id: campaignId,
          user_id: user.user_id,
          channel: 'whatsapp',
          payload: { phone: user.phone, text: whatsappText }
        });
      }

      // Queue Push
      if (user.push_enabled) {
        queuePayloads.push({
          campaign_id: campaignId,
          user_id: user.user_id,
          channel: 'push',
          payload: { title: pushTitle, body: pushMessage, deeplink: `/events/detail/${eventId}` }
        });
      }

      // Queue In-App
      queuePayloads.push({
          campaign_id: campaignId,
          user_id: user.user_id,
          channel: 'in_app',
          payload: { title: pushTitle, message: pushMessage, type: 'promo', entity_id: eventId }
      });
    });

    // Chunk array into batches of 500 for Supabase limits
    const chunkSize = 500;
    for (let i = 0; i < queuePayloads.length; i += chunkSize) {
      const chunk = queuePayloads.slice(i, i + chunkSize);
      await supabaseAdmin.from('notification_queue').insert(chunk);
    }

    // 7. Mark Campaign as Completed (In a real background worker architecture, 
    // a worker would process the queue and THEN mark completed. We do it here for brevity)
    await supabaseAdmin
      .from('event_campaigns')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', campaignId);

    return NextResponse.json({
      success: true,
      message: 'Campaign successfully generated and queued',
      stats: {
        campaign_id: campaignId,
        total_users_targeted: users.length,
        notifications_queued: queuePayloads.length
      }
    });

  } catch (error) {
    console.error('Campaign trigger error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
