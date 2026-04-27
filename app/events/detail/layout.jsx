import { supabase } from '@/lib/supabase';
import Script from 'next/script';
import { notFound } from 'next/navigation';

export async function generateMetadata({ searchParams }) {
    const { id } = await searchParams;
    if (!id) return { title: 'Event Details' };
    
    const { data: event } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (!event) return { title: 'Event Not Found' };

    const title = `${event.title} - Book Tickets Online | BookMyTicket`;
    const description = `Book your tickets for ${event.title}. Happening at ${event.venue || 'TBA'}, ${event.city || ''}. Find best prices on BookMyTicket.`;
    
    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: [event.img || '/og-image.png'],
        },
    };
}

export default async function EventDetailLayout({ children, searchParams }) {
    const { id } = await searchParams;
    if (!id) notFound();
    
    const { data: event } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (!event) notFound();

    const jsonLd = event ? {
        "@context": "https://schema.org",
        "@type": "Event",
        "name": event.title,
        "description": event.description,
        "startDate": event.date,
        "location": {
            "@type": "Place",
            "name": event.venue || 'Venue',
            "address": {
                "@type": "PostalAddress",
                "addressLocality": event.city || 'India',
                "addressCountry": "IN"
            }
        },
        "image": event.img || "https://bookmyticket.net/og-image.png",
        "offers": {
            "@type": "Offer",
            "url": `https://bookmyticket.net/events/detail?id=${event.id}`,
            "price": event.price || "0",
            "priceCurrency": "INR",
            "availability": "https://schema.org/InStock"
        },
        "organizer": {
            "@type": "Organization",
            "name": "BookMyTicket",
            "url": "https://bookmyticket.net"
        }
    } : null;

    return (
        <>
            {jsonLd && (
                <Script
                    id="event-jsonld"
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            {children}
        </>
    );
}
