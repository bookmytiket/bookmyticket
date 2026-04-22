import { supabase } from '@/lib/supabase';
import Script from 'next/script';

export async function generateMetadata({ params }) {
    const { id } = params;
    
    const { data: service } = await supabase
        .from('service_providers')
        .select('*, vendors(*)')
        .eq('id', id)
        .maybeSingle();

    if (!service) {
        return {
            title: 'Professional Service | BookMyTicket',
            description: 'Find professional artists and services on BookMyTicket.'
        };
    }

    const title = `${service.name || 'Artist'} - ${service.category || 'Professional'} | BookMyTicket`;
    const description = `Book ${service.name} for your next event. Specialized in ${service.category}. Verified artist on BookMyTicket.`;
    
    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'profile',
            images: service.portfolio ? [service.portfolio[0]] : ['/og-image.png'],
        },
    };
}

export default async function ServiceLayout({ children, params }) {
    const { id } = params;
    
    const { data: service } = await supabase
        .from('service_providers')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    const jsonLd = service ? {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": service.name,
        "description": service.about_me || service.description,
        "provider": {
            "@type": "LocalBusiness",
            "name": service.name,
            "image": service.portfolio ? service.portfolio[0] : "https://bookmyticket.net/logo.png"
        },
        "areaServed": {
            "@type": "Country",
            "name": "India"
        },
        "category": service.category
    } : null;

    return (
        <>
            {jsonLd && (
                <Script
                    id="service-jsonld"
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            {children}
        </>
    );
}
