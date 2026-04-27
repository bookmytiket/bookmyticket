import React from "react";
import { supabase } from "@/lib/supabase";
import ArtistProfileClient from "./ArtistProfileClient";

export async function generateMetadata({ params }) {
    const { id: rawId } = await params;
    const id = decodeURIComponent(rawId);
    if (!id) return {};

    try {
        const { data: service } = await supabase
            .from('service_providers')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (!service) return { title: 'Artist Profile | BookMyTicket' };

        const title = `${service.business_name || service.name} | Professional ${service.category} in ${service.city} | BookMyTicket`;
        const description = `Hire ${service.business_name || service.name}, a professional ${service.category} based in ${service.city}. Browse portfolio, check pricing, and book online through BookMyTicket.`;

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                images: [service.portfolio?.[0]?.url || '/og-image.png'],
            },
            alternates: {
                canonical: `https://bookmyticket.net/services/${encodeURIComponent(id)}`,
            }
        };
    } catch (e) {
        return { title: 'Professional Service | BookMyTicket' };
    }
}

export default async function ArtistProfilePage({ params }) {
    const resolvedParams = await params;
    const vendorId = decodeURIComponent(resolvedParams?.id || "");
    
    if (!vendorId) {
         return <div>Debug: Missing Vendor ID in Page</div>;
    }
    
    const { data: service, error } = await supabase
        .from('service_providers')
        .select('*')
        .eq('id', vendorId)
        .maybeSingle();

    if (error) {
        return <div>Debug Query Error: {error.message}</div>;
    }

    return (
        <>
            {service && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "LocalBusiness",
                            "name": service.business_name || service.name,
                            "image": service.portfolio?.map(p => p.url) || [],
                            "address": {
                                "@type": "PostalAddress",
                                "addressLocality": service.city,
                                "addressCountry": "IN"
                            },
                            "url": `https://bookmyticket.net/services/${encodeURIComponent(vendorId)}`,
                            "description": service.bio,
                            "category": service.category
                        })
                    }}
                />
            )}
            <ArtistProfileClient id={vendorId} />
        </>
    );
}
