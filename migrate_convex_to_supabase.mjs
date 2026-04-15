import { ConvexHttpClient } from "convex/browser";
import { createClient } from "@supabase/supabase-js";
import { api } from "./convex/_generated/api.js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const CONVEX_URL = "https://fantastic-sardine-160.convex.cloud"; // Production URL
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; 

if (!CONVEX_URL || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Missing environment variables.");
    process.exit(1);
}

const convex = new ConvexHttpClient(CONVEX_URL);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const idMapping = {
    users: {}, // convexEmail -> supabaseId
    events: {}, // convexId -> supabaseId
};

async function ensureAllUsers() {
    console.log("Collecting all unique emails...");
    const emails = new Set();
    
    try {
        const users = await convex.query(api.users.list);
        users.forEach(u => emails.add(u.email.toLowerCase().trim()));
        
        const organisers = await convex.query(api.organisers.list, {});
        organisers.forEach(o => emails.add(o.userId.toLowerCase().trim()));
        
        const events = await convex.query(api.events.getActiveEvents, { isAdmin: true });
        events.forEach(e => emails.add(e.organiserId.toLowerCase().trim()));
        
        console.log(`Found ${emails.size} unique emails to process.`);
        
        const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
        
        for (const email of emails) {
            console.log(`Processing user: ${email}`);
            let supabaseId;
            const existing = authUsers.find(u => u.email === email);
            
            if (existing) {
                supabaseId = existing.id;
            } else {
                const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
                    email: email,
                    password: "Welcome123!",
                    email_confirm: true
                });
                if (authError) {
                    console.error(`Error creating auth user ${email}:`, authError.message);
                    continue;
                }
                supabaseId = authUser.user.id;
            }
            
            idMapping.users[email] = supabaseId;

            const convexUser = users.find(u => u.email.toLowerCase().trim() === email) || 
                               organisers.find(o => o.userId.toLowerCase().trim() === email);
                               
            const { error: profileError } = await supabase.from('profiles').upsert({
                id: supabaseId,
                email: email,
                full_name: convexUser?.name || convexUser?.fullName || email.split('@')[0],
                role: convexUser?.role || (organisers.some(o => o.userId.toLowerCase().trim() === email) ? 'organiser' : 'user'),
                status: 'Active'
            });
            if (profileError) console.error(`Profile error for ${email}:`, profileError.message);
        }
    } catch (e) {
        console.error("Error in ensureAllUsers:", e.message);
    }
}

async function migrateOrganisers() {
    console.log("Migrating organisers...");
    try {
        const organisers = await convex.query(api.organisers.list, {});
        for (const org of organisers) {
            const email = org.userId.toLowerCase().trim();
            const supabaseId = idMapping.users[email];
            if (!supabaseId) continue;

            const { error } = await supabase.from('organiser_details').upsert({
                id: supabaseId,
                business_name: org.name,
                category: org.category,
                type: org.type || 'event_organiser',
                kyc_status: org.kycStatus,
                is_approved: org.isApproved,
                wallet_balance: org.walletBalance,
                kyc_details: org.kycDetails,
                lat: org.lat,
                lng: org.lng
            });
            if (error) console.error(`Error migrating organiser ${email}:`, error.message);
        }
    } catch (e) {
        console.error("Error in migrateOrganisers:", e.message);
    }
}

async function migrateEvents() {
    console.log("Migrating events...");
    try {
        const events = await convex.query(api.events.getActiveEvents, { isAdmin: true });
        for (const event of events) {
            const email = event.organiserId.toLowerCase().trim();
            const organiserId = idMapping.users[email];
            
            const { data: newEvent, error } = await supabase.from('events').insert({
                organiser_id: organiserId,
                title: event.title,
                category: event.category,
                type: event.type,
                date: event.date,
                time: event.time,
                img: event.img,
                banner_preview: event.bannerPreview,
                seating_enabled: event.seatingEnabled,
                total_seats: event.totalSeats,
                price: event.price,
                location: event.location,
                venue: event.venue,
                address: event.address,
                city: event.city,
                featured: event.featured,
                trending: event.trending,
                spotlight: event.spotlight,
                exclusive: event.exclusive,
                status: (event.status === 'published' || !event.status) ? 'Active' : event.status,
                description: event.description,
                meeting_url: event.meetingUrl,
                virtual: event.virtual,
                seat_categories: event.seatCategories,
                date_slots: event.dateSlots,
                end_date_time: event.endDateTime
            }).select().single();

            if (error) {
                console.error(`Error migrating event ${event.title}:`, error.message);
            } else {
                idMapping.events[event._id] = newEvent.id;
            }
        }
    } catch (e) {
        console.error("Error in migrateEvents:", e.message);
    }
}

async function migrateBookings() {
    console.log("Migrating bookings...");
    try {
        const bookings = await convex.query(api.bookings.getBookings, {});
        for (const booking of bookings) {
            const email = booking.userId.toLowerCase().trim();
            const userId = idMapping.users[email];
            const eventId = idMapping.events[booking.eventId];
            
            if (!eventId) continue;

            const { error } = await supabase.from('bookings').insert({
                event_id: eventId,
                user_id: userId,
                ticket_count: booking.ticketCount,
                total_price: booking.totalPrice,
                customer_details: booking.customerDetails,
                status: booking.status,
                payment_intent_id: booking.paymentIntentId,
                scanned: booking.scanned,
                scanned_at: booking.scannedAt ? new Date(booking.scannedAt).toISOString() : null,
                selected_seats: booking.selectedSeats,
                taxable_amount: booking.taxableAmount,
                gst_amount: booking.gstAmount,
                gst_breakdown: booking.gstBreakdown,
                invoice_number: booking.invoiceNumber,
                is_gst_applied: booking.isGstApplied,
                invoice_date: booking.invoiceDate ? new Date(booking.invoiceDate).toISOString() : null
            });
            if (error) console.error(`Error migrating booking ${booking._id}:`, error.message);
        }
    } catch (e) {
        console.error("Error in migrateBookings:", e.message);
    }
}

async function migrateSystemConfigs() {
    console.log("Migrating system configs...");
    try {
        const configs = await convex.query(api.systemConfig.getAllConfig, {});
        for (const [key, value] of Object.entries(configs)) {
            await supabase.from('system_config').upsert({ key, value }, { onConflict: 'key' });
        }
    } catch (e) {
        console.error("Error in migrateSystemConfigs:", e.message);
    }
}

async function migrateCategories() {
    console.log("Migrating categories...");
    try {
        const categories = await convex.query(api.homeSettings.getCategories, {});
        for (const cat of categories) {
            // Upsert to main categories
            const { error: catErr } = await supabase.from('categories').upsert({
                name: cat.name,
                slug: cat.slug,
                icon: cat.icon,
                count: cat.count || 0,
                sort_order: cat.order || 0
            }, { onConflict: 'slug' });
            if (catErr) console.error(`Cat error ${cat.name}:`, catErr.message);

            // Upsert to home categories
            const { error: homeErr } = await supabase.from('home_categories').upsert({
                label: cat.name,
                icon: cat.icon,
                "order": cat.order || 0
            });
            if (homeErr) console.error(`Home cat error ${cat.name}:`, homeErr.message);
        }
    } catch (e) {
        console.error("Error in migrateCategories:", e.message);
    }
}

async function migrateBanners() {
    console.log("Migrating banners...");
    try {
        const slides = await convex.query(api.homeSettings.getBannerSlides, {});
        for (const slide of slides) {
            const { error } = await supabase.from('branding_banners').upsert({
                img: slide.img,
                title: slide.title,
                subtitle: slide.sub,
                status: 'Active'
            });
            if (error) console.error(`Banner error ${slide.title}:`, error.message);
        }
    } catch (e) {
        console.error("Error in migrateBanners:", e.message);
    }
}

async function run() {
    try {
        await ensureAllUsers();
        await migrateOrganisers();
        await migrateCategories();
        await migrateBanners();
        await migrateEvents();
        await migrateBookings();
        await migrateSystemConfigs();
        console.log("Migration completed successfully!");
    } catch (e) {
        console.error("Migration failed:", e);
    }
}

run();
