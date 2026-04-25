import { supabase } from '@/lib/supabase';
import Script from 'next/script';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
    const { id } = await params;
    
    const { data: turf } = await supabase
        .from('turfs')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (!turf) {
        return {
            title: 'Turf Booking | BookMyTicket',
            description: 'Book sports turfs online on BookMyTicket.'
        };
    }

    const title = `${turf.name} - Book Turf Online in ${turf.location || 'India'} | BookMyTicket`;
    const description = `Book ${turf.name} for your next game. Located at ${turf.location}. Features: ${turf.amenities?.join(', ') || 'Best amenities'}. Fast booking on BookMyTicket.`;
    
    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: turf.images ? [turf.images[0]] : ['/og-image.png'],
        },
    };
}

export default async function TurfLayout({ children, params }) {
    const { id } = await params;
    if (!id) notFound();
    
    const { data: turf } = await supabase
        .from('turfs')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (!turf) notFound();

    const jsonLd = turf ? {
        "@context": "https://schema.org",
        "@type": "SportsActivityLocation",
        "name": turf.name,
        "description": turf.description || `Book ${turf.name} on BookMyTicket.`,
        "image": turf.images ? turf.images[0] : "https://bookmyticket.net/og-image.png",
        "address": {
            "@type": "PostalAddress",
            "addressLocality": turf.location || 'India',
            "addressCountry": "IN"
        },
        "offers": {
            "@type": "Offer",
            "price": turf.flat_price || "0",
            "priceCurrency": "INR"
        }
    } : null;

    return (
        <>
            {jsonLd && (
                <Script
                    id="turf-jsonld"
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            {children}
        </>
    );
}
