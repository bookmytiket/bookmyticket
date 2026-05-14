import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for strict data fetching if needed, or anon key if RLS allows

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const district = searchParams.get('district');
    const city = searchParams.get('city');
    const type = searchParams.get('type');
    const featured = searchParams.get('featured') === 'true';

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // 1. Fetch active events
        // Strict filtering: entity_type must be 'event'
        // Supported event types for public discovery
        const supportedEventTypes = [
            'Physical Event', 'Virtual Event', 'Sports Event', 'Tournament Event', 
            'Marathon Event', 'Concert Event', 'Theatre Event', 'Conference Event', 
            'Workshop Event', 'Custom Event', 'Tournament', 'Marathon', 'Sports'
        ];

        let eventsQuery = supabase
            .from('events')
            .select('*')
            .or('publish_status.eq.published,status.eq.published')
            .eq('visibility_status', 'public')
            .eq('approval_status', 'approved')
            .eq('listing_status', 'active')
            .eq('entity_type', 'event');

        // Apply District Filter (Highest Priority)
        if (district && district !== 'All' && district !== 'India') {
            eventsQuery = eventsQuery.ilike('district', `%${district}%`);
        } else if (city && city !== 'All Cities' && city !== 'India') {
            eventsQuery = eventsQuery.ilike('city', `%${city}%`);
        }

        if (type) {
            eventsQuery = eventsQuery.eq('type', type);
        }
        
        if (featured) {
            eventsQuery = eventsQuery.or('featured.eq.true,is_spotlight.eq.true,is_exclusive.eq.true');
        }

        const { data: events, error: eventsError } = await eventsQuery.order('created_at', { ascending: false });
        if (eventsError) throw eventsError;

        if (!events || events.length === 0) {
            return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } });
        }

        // Filter by supported event types (client-side for robustness if needed, but here we keep all organiser events)
        const organiserEvents = events.filter(e => {
            const t = e.type || e.event_type;
            // Exclude services/vendors strictly
            if (e.entity_type === 'service' || e.entity_type === 'vendor') return false;
            return true;
        });

        const eventIds = organiserEvents.map(e => e.id);

        // 2. Fetch related data in parallel
        const [tournamentsRes, marathonsRes] = await Promise.all([
            supabase.from('tournament_events').select('*').in('id', eventIds),
            supabase.from('marathon_events').select('*').in('id', eventIds)
        ]);

        const tournaments = tournamentsRes.data || [];
        const marathons = marathonsRes.data || [];

        // 3. Strict mapping
        const enrichedEvents = organiserEvents.map(event => {
            const tournament = tournaments.find(t => t.id === event.id) || null;
            const marathon = marathons.find(m => m.id === event.id) || null;

            // Ensure isolation: only use data belonging to this specific event_id
            return {
                ...event,
                tournament_data: tournament,
                marathon_data: marathon,
                // Hydration: prioritize specific table data for price/banner if parent is generic
                img: event.img || tournament?.banner_image || marathon?.banner_image,
                price: event.price || tournament?.registration_fee || marathon?.price || 0,
                venue: event.venue || tournament?.venue || marathon?.venue,
                city: event.city || tournament?.city || marathon?.city,
                district: event.district || tournament?.district || marathon?.district,
                category: event.category || (tournament ? 'Tournament' : (marathon ? 'Marathon' : event.category))
            };
        });

        return NextResponse.json(enrichedEvents, {
            headers: {
                'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
                'X-Data-Source': 'Unified-Discovery-API'
            }
        });

    } catch (error) {
        console.error('Public Events API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
