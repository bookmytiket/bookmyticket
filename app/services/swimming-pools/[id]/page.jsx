import React from "react";
import { supabase } from "@/lib/supabase";
import PoolDetailClient from "./PoolDetailClient";

export async function generateMetadata({ params }) {
    const id = decodeURIComponent(params.id);
    if (!id) return {};

    try {
        const { data: pool } = await supabase
            .from('swimming_pools')
            .select('*')
            .eq('id', id)
            .single();

        if (!pool) return { title: 'Swimming Pool | BookMyTicket' };

        const title = `${pool.name} | Premium Swimming Pool in ${pool.city} | BookMyTicket`;
        const description = `Book slots at ${pool.name}, a premium swimming facility in ${pool.city}. Real-time availability, professional trainers, and top-notch amenities. Book online through BookMyTicket.`;

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                images: [pool.images?.[0] || '/og-image.png'],
            }
        };
    } catch (e) {
        return { title: 'Swimming Pool Facility | BookMyTicket' };
    }
}

export default function PoolDetailPage({ params }) {
    const poolId = decodeURIComponent(params.id);

    return (
        <>
            <PoolDetailClient id={poolId} />
        </>
    );
}
