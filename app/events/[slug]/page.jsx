import React from 'react';
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import EventDetailClient from '../components/EventDetailClient';
import DynamicEventClient from '../components/DynamicEventClient';

/**
 * Generate Metadata for SEO based on event details.
 * Supports dynamic titles and descriptions for organic growth.
 */
export async function generateMetadata({ params }) {
    const { slug } = await params;
    
    console.log('[SlugEventPage] Metadata requested for slug:', slug);

    if (!supabase) {
        return { title: 'BookMyTicket | Event' };
    }

    // Fetch by slug first (preferred for SEO)
    let { data: event, error: slugError } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

    if (slugError) console.error('[SlugEventPage] Slug fetch error:', slugError);

    // If not found by slug, try by ID fallback (only if slug is a valid UUID)
    if (!event && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)) {
        const { data: byId, error: idError } = await supabase
            .from('events')
            .select('*')
            .eq('id', slug)
            .maybeSingle();
        if (idError) console.error('[SlugEventPage] ID fetch error:', idError);
        event = byId;
    }

    if (!event) {
        return { title: 'Event Not Found | BookMyTicket' };
    }

    const title = `${event.title} Tickets | ${event.city || event.location} | BookMyTicket`;
    const description = `Book tickets for ${event.title} in ${event.city || event.location}. ${event.description?.slice(0, 150)}... Official ticketing partner BookMyTicket.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: [event.img || '/og-image.png'],
            type: 'article',
            url: `https://bookmyticket.net/events/${event.slug || event.id}`,
        },
        alternates: {
            canonical: `https://bookmyticket.net/events/${event.slug || event.id}`,
        }
    };
}

/**
 * Dynamic Event Page for Organic SEO Growth.
 * Supports clean URLs like /events/marathon-2026.
 */

export default async function SlugEventPage({ params }) {
    const { slug } = await params;
    
    console.log('[SlugEventPage] RECEIVED params slug:', slug);

    console.log('[SlugEventPage] RECEIVED params slug:', slug);

    if (!supabase) {
        notFound();
    }

        // Fetch by slug first
        let { data: event, error: slugError } = await supabase
            .from('events')
            .select('*')
            .eq('slug', slug)
            .maybeSingle();
        
        if (slugError) {
            console.error('[SlugEventPage] Slug fetch error:', slugError);
        }

        // Fallback by ID
        if (!event && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)) {
            const { data: byId, error: idError } = await supabase
                .from('events')
                .select('*')
                .eq('id', slug)
                .maybeSingle();
            if (idError) console.error('[SlugEventPage] ID fetch error:', idError);
            event = byId;
        }

        if (!event) {
            notFound();
        }

        console.log('[SlugEventPage] SUCCESS: Found event:', event.id, '-', event.title);
        const isDynamic = event.type === 'Dynamic' || event.event_type === 'marathon' || event.title?.toLowerCase().includes('marathon');

        return (
            <>
                {/* Structured Data (JSON-LD) for Google Rich Results */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "Event",
                            "name": event.title,
                            "startDate": event.date,
                            "endDate": event.date,
                            "description": event.description,
                            "image": [event.img],
                            "eventAttendanceMode": event.virtual ? "https://schema.org/OnlineEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode",
                            "eventStatus": "https://schema.org/EventScheduled",
                            "location": {
                                "@type": event.virtual ? "VirtualLocation" : "Place",
                                "name": event.venue || event.location,
                                "address": {
                                    "@type": "PostalAddress",
                                    "addressLocality": event.city || event.location,
                                    "addressRegion": "IN",
                                    "addressCountry": "IN"
                                }
                            },
                            "offers": {
                                "@type": "Offer",
                                "url": `https://bookmyticket.net/events/${event.slug || event.id}`,
                                "price": event.price || 0,
                                "priceCurrency": "INR",
                                "availability": "https://schema.org/InStock",
                                "validFrom": event.created_at
                            },
                            "organizer": {
                                "@type": "Organization",
                                "name": "BookMyTicket",
                                "url": "https://bookmyticket.net"
                            }
                        })
                    }}
                />

                {isDynamic ? (
                    <DynamicEventClient event={event} />
                ) : (
                    <EventDetailClient id={event.id} />
                )}
            </>
        );
}
