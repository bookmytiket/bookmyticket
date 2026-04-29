import React from "react";
import { supabase } from "@/lib/supabase";
import TurfProfileClient from "./TurfProfileClient";

export async function generateMetadata({ params }) {
    const { id } = await params;
    if (!id) return {};

    try {
        const { data: turf } = await supabase
            .from('turfs')
            .select('*')
            .eq('id', id)
            .single();

        if (!turf) return { title: 'Turf Not Found | BookMyTicket' };

        const title = `${turf.name} Booking | Sports Turf in ${turf.location} | BookMyTicket`;
        const description = `Book ${turf.name} for cricket, football, or badminton in ${turf.location}. check availability, prices, and amenities. Instant online booking on BookMyTicket.`;

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                images: [turf.images?.[0] || '/og-image.png'],
            },
            alternates: {
                canonical: `https://bookmyticket.net/turfs/${id}`,
            }
        };
    } catch (e) {
        return { title: 'Turf Booking | BookMyTicket' };
    }
}

export default async function TurfProfilePage({ params }) {
    const { id: turfId } = await params;

    const { data: turf } = await supabase.from('turfs').select('*').eq('id', turfId).maybeSingle();

    return (
        <>
            <h1>{turf.name}</h1>
            {turf && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "SportsActivityLocation",
                            "name": turf.name,
                            "image": turf.images || [],
                            "address": {
                                "@type": "PostalAddress",
                                "addressLocality": turf.location,
                                "addressCountry": "IN"
                            },
                            "geo": {
                                "@type": "GeoCoordinates",
                                "latitude": turf.lat,
                                "longitude": turf.lng
                            },
                            "url": `https://bookmyticket.net/turfs/${turfId}`,
                            "telephone": turf.phone,
                            "priceRange": `₹${turf.pricePerHour || 0}`,
                            "description": turf.description
                        })
                    }}
                />
            )}
            <TurfProfileClient id={turfId} />
        </>
    );
}
