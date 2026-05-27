import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request) {
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // Fetch events with date and time to filter out past events
        const { data: events, error: eventsError } = await supabase
            .from('events')
            .select('id, organiser_id, date, time')
            .or('publish_status.eq.published,status.eq.published')
            .eq('visibility_status', 'public')
            .eq('approval_status', 'approved')
            .eq('listing_status', 'active')
            .eq('entity_type', 'event');

        if (eventsError) throw eventsError;

        if (!events || events.length === 0) {
            return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } });
        }

        // Count events per organiser (excluding past events)
        const eventCounts = {};
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Start of today

        events.forEach(event => {
            if (event.organiser_id) {
                let isValid = true;
                if (event.date) {
                    try {
                        const eventDate = new Date(event.date);
                        if (!isNaN(eventDate.getTime())) {
                            eventDate.setHours(0, 0, 0, 0);
                            if (eventDate < now) {
                                isValid = false;
                            }
                        }
                    } catch(e) {}
                }
                
                if (isValid) {
                    eventCounts[event.organiser_id] = (eventCounts[event.organiser_id] || 0) + 1;
                }
            }
        });

        const organiserIds = Object.keys(eventCounts);

        if (organiserIds.length === 0) {
            return NextResponse.json([]);
        }

        // 2. Fetch profile data for these organisers
        // Check `profiles` first
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, role')
            .in('id', organiserIds);

        if (profilesError) throw profilesError;

        // Optionally, check `organizer_profiles` for business name/logo
        const { data: orgProfiles, error: orgProfilesError } = await supabase
            .from('organizer_profiles')
            .select('user_id, business_name, profile_photo_url')
            .in('user_id', organiserIds);

        // Build the final response
        const organisers = (profiles || []).map(profile => {
            const orgProfile = (orgProfiles || []).find(op => op.user_id === profile.id);
            
            return {
                id: profile.id,
                name: orgProfile?.business_name || profile.full_name || 'Organizer',
                logo: orgProfile?.profile_photo_url || profile.avatar_url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
                eventsCount: eventCounts[profile.id] || 0
            };
        }).sort((a, b) => b.eventsCount - a.eventsCount); // Sort by most events

        return NextResponse.json(organisers, {
            headers: {
                'Cache-Control': 'no-store, max-age=0, must-revalidate'
            }
        });

    } catch (error) {
        console.error('Public Organisers API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
