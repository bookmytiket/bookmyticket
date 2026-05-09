import React from 'react';
import EventDetailClient from '../components/EventDetailClient';
import DynamicEventClient from '../components/DynamicEventClient';
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';

export async function generateMetadata({ searchParams }) {
    const params = await searchParams;
    const id = params?.id;
    if (!id) return {};

    try {
        const { data: event } = await supabase
            .from('events')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (!event) return { title: 'Event Not Found | BookMyTicket' };

        const title = `${event.title} Tickets | ${event.city || event.location} | BookMyTicket`;
        const description = `Book tickets for ${event.title} in ${event.city || event.location}. ${event.description?.slice(0, 150)}... Book online at the best prices on BookMyTicket.`;

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                images: [event.img || '/og-image.png'],
                type: 'article',
            },
            alternates: {
                canonical: `https://bookmyticket.net/events/detail?id=${id}`,
            }
        };
    } catch (e) {
        return { title: 'Event Details | BookMyTicket' };
    }
}

export default async function EventDetailPage({ searchParams }) {
    const params = await searchParams;
    const id = params?.id;
    
    if (!id) notFound();

    // Fetch event for schema and type checking
    const { data: event } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (!event) notFound();

    const isDynamic = event.type === 'Dynamic' || event.type === 'Marathon';

    return (
        <>
            {event && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "Event",
                            "name": event.title,
                            "startDate": event.date,
                            "endDate": event.date,
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
                            "image": [event.img],
                            "description": event.description,
                            "offers": {
                                "@type": "Offer",
                                "url": `https://bookmyticket.net/events/detail?id=${id}`,
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
            )}
            {isDynamic ? (
                <DynamicEventClient event={event} />
            ) : (
                <EventDetailClient id={id} />
            )}
        </>
    );
}
