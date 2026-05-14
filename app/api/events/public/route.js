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
        // Support both old (id = event_id) and new (event_id column) schemas
        const [tournamentsRes, marathonsRes] = await Promise.all([
            supabase.from('tournament_events').select('*').in('event_id', eventIds),
            supabase.from('marathon_events').select('*').in('event_id', eventIds)
        ]);

        // Fallback for tables using shared UUID as PK (id = event_id)
        let tournaments = tournamentsRes.data || [];
        if (tournaments.length === 0) {
            const { data } = await supabase.from('tournament_events').select('*').in('id', eventIds);
            if (data) tournaments = data;
        }

        let marathons = marathonsRes.data || [];
        if (marathons.length === 0) {
            const { data } = await supabase.from('marathon_events').select('*').in('id', eventIds);
            if (data) marathons = data;
        }

        // 3. Strict mapping
        const enrichedEvents = organiserEvents.map(event => {
            const tournament = tournaments.find(t => (t.event_id === event.id || t.id === event.id)) || null;
            const marathon = marathons.find(m => (m.event_id === event.id || m.id === event.id)) || null;

            // Hydration: prioritize specific table data for price/banner if parent is generic
            let price = event.price || 0;
            let img = event.img;
            let venue = event.venue;

            if (tournament) {
                price = tournament.registration_fee || price;
                img = tournament.banner_image || img;
                venue = tournament.venue || venue;
            } else if (marathon) {
                // Marathon pricing is often in dynamic_config.marathonCategories
                const mConfig = (typeof event.dynamic_config === 'string' ? JSON.parse(event.dynamic_config) : event.dynamic_config) || {};
                const cats = mConfig.marathonCategories || mConfig.categories || [];
                if (cats.length > 0) {
                    price = Math.min(...cats.map(c => Number(c.price) || 0));
                }
                img = marathon.banner_image || img;
                venue = marathon.venue || venue;
            }

            const eventType = String(event.type || '').toLowerCase();
            const isTournament = eventType.includes('tournament') || !!tournament;
            const isMarathon = eventType.includes('marathon') || !!marathon;

            return {
                ...event,
                tournament_data: tournament,
                marathon_data: marathon,
                img,
                price,
                venue,
                city: event.city || tournament?.city || marathon?.city,
                district: event.district || tournament?.district || marathon?.district,
                category: event.category || (isTournament ? 'Tournament' : (isMarathon ? 'Marathon' : event.category))
            };
        });

        return NextResponse.json(enrichedEvents, {
            headers: {
                'Cache-Control': 'no-store, max-age=0, must-revalidate',
                'X-Data-Source': 'Unified-Discovery-API'
            }
        });

    } catch (error) {
        console.error('Public Events API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
