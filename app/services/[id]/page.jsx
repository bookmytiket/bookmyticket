import React from "react";
import { supabase } from "@/lib/supabase";
import ArtistProfileClient from "./ArtistProfileClient";

export async function generateMetadata({ params }) {
    const { id: rawId } = await params;
    const id = decodeURIComponent(rawId);
    if (!id) return {};

    try {
        const { data: rawService } = await supabase
            .from('service_providers')
            .select('*, profiles:service_providers_id_fkey(selected_city, full_name, email, phone)')
            .eq('id', id)
            .maybeSingle();

        if (!rawService) return { title: 'Artist Profile | BookMyTicket' };

        const service = {
            ...rawService,
            business_name: rawService.business_name || rawService.profiles?.full_name,
            name: rawService.profiles?.full_name || rawService.business_name,
            bio: rawService.bio || rawService.description || "Premium professional services.",
            city: rawService.profiles?.selected_city || rawService.advanced_settings?.city || rawService.city || "",
            portfolio: rawService.image_url ? [{ url: rawService.image_url }] : []
        };

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
    
    const { data: rawService, error } = await supabase
        .from('service_providers')
        .select('*, profiles:service_providers_id_fkey(selected_city, full_name, email, phone)')
        .eq('id', vendorId)
        .maybeSingle();

    if (error) {
        return <div>Debug Query Error: {error.message}</div>;
    }

    const service = rawService ? {
        ...rawService,
        business_name: rawService.business_name || rawService.profiles?.full_name,
        name: rawService.profiles?.full_name || rawService.business_name,
        bio: rawService.bio || rawService.description || "Premium professional services.",
        city: rawService.profiles?.selected_city || rawService.advanced_settings?.city || rawService.city || "",
        portfolio: rawService.image_url ? [{ url: rawService.image_url }] : []
    } : null;

    return (
        <>
            <h1>{service.business_name || service.name}</h1>
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
