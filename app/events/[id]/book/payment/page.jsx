import { HOME_EVENTS } from '@/app/data/homeEvents';
import PaymentClient from './PaymentClient';
import React from 'react';

export async function generateStaticParams() {
    return (HOME_EVENTS || []).map((e) => ({
        id: String(e.id),
    }));
}

export default function Page({ params }) {
    const { id: eventId } = React.use(params);
    return <PaymentClient eventId={eventId} />;
}
