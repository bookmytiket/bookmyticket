import { HOME_EVENTS } from '@/app/data/homeEvents';
import CheckoutClient from './CheckoutClient';
import React from 'react';

export async function generateStaticParams() {
    return (HOME_EVENTS || []).map((e) => ({
        id: String(e.id),
    }));
}

export default function Page({ params }) {
    const { id } = React.use(params);
    return <CheckoutClient id={id} />;
}
