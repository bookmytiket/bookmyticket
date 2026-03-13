"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Calendar, MapPin } from 'lucide-react';
import { HOME_EVENTS } from '@/app/data/homeEvents';
import { getFeeBreakdown, DEFAULT_FEE_SETTINGS } from '@/app/utils/feeBreakdown';
import TicketTemplate from '@/components/TicketTemplate';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=600&fit=crop';

function getEventById(id, convexEvents) {
    const sid = String(id);
    const fromHome = (Array.isArray(HOME_EVENTS) ? HOME_EVENTS : []).find(e => String(e.id) === sid);
    const fromConvex = (Array.isArray(convexEvents) ? convexEvents : []).find(e => String(e._id) === sid || String(e.id) === sid);
    const raw = fromHome || fromConvex;
    if (!raw) return null;
    return {
        ...raw,
        id: raw._id || raw.id,
        img: raw.img || raw.bannerPreview || DEFAULT_IMG,
        title: raw.title || 'Event',
        date: raw.date || 'TBA',
        time: raw.time || '',
        location: raw.location || raw.venue || raw.address || 'Venue',
    };
}

export default function CheckoutClient({ id }) {
    const searchParams = useSearchParams();
    const convexEvents = useQuery(api.events.getActiveEvents) || [];
    const rawFeeSettings = useQuery(api.systemConfig.getConfig, { key: "admin_fee_settings" });
    const rawTicketSettings = useQuery(api.systemConfig.getConfig, { key: "admin_ticket_settings" });
    const [storageLoaded, setStorageLoaded] = useState(false);
    const [feeSettings, setFeeSettings] = useState(DEFAULT_FEE_SETTINGS);
    const [bookingDone, setBookingDone] = useState(false);
    const [lastBooking, setLastBooking] = useState(null);
    const [ticketSettings, setTicketSettings] = useState({});
    const createBookingMutation = useMutation(api.bookings.createBooking);
    const router = useRouter();
    const bookingIdFromUrl = searchParams.get('bookingId');
    const isSuccess = searchParams.get('success') === 'true';
    const existingBooking = useQuery(api.bookings.getBookingById, bookingIdFromUrl ? { id: bookingIdFromUrl } : "skip");

    useEffect(() => {
        if (rawFeeSettings !== undefined && rawTicketSettings !== undefined) {
            try {
                const parsedFees = typeof rawFeeSettings === "string" ? JSON.parse(rawFeeSettings) : rawFeeSettings;
                if (parsedFees) setFeeSettings(prev => ({ ...prev, ...parsedFees }));
            } catch (_) { }
            try {
                const parsedTicket = typeof rawTicketSettings === "string" ? JSON.parse(rawTicketSettings) : rawTicketSettings;
                if (parsedTicket) setTicketSettings(parsedTicket);
            } catch (_) { }
            setStorageLoaded(true);
        } else if (rawFeeSettings === null && rawTicketSettings === null) {
            setStorageLoaded(true);
        }
    }, [rawFeeSettings, rawTicketSettings]);

    const event = useMemo(() => getEventById(id, convexEvents), [id, convexEvents]);

    useEffect(() => {
        if (isSuccess && existingBooking && existingBooking.status === "Confirmed") {
            setLastBooking({
                id: existingBooking._id,
                eventId: existingBooking.eventId,
                eventName: existingBooking.eventName,
                amount: existingBooking.totalPrice,
                baseAmount: existingBooking.totalPrice,
                convenienceFee: 0,
                gst: 0,
                tickets: existingBooking.ticketCount,
                status: 'Confirmed',
                date: new Date(existingBooking._creationTime).toISOString().split('T')[0],
                ticketType: 'General Admission',
                paymentMethod: 'Online',
                location: existingBooking.location || event?.location,
            });
            setBookingDone(true);
        }
    }, [isSuccess, existingBooking, event]);

    const ticketPrice = event?.price ?? 499;
    const qty = Math.max(1, parseInt(searchParams.get('qty') || '1', 10) || 1);
    const baseAmount = ticketPrice * qty;
    const { convenienceFee, gst, total } = useMemo(() => getFeeBreakdown(baseAmount, feeSettings), [baseAmount, feeSettings]);

    const handleConfirmPay = useCallback(async () => {
        if (!event) return;
        try {
            const bookingId = await createBookingMutation({
                eventId: String(event._id || event.id),
                userId: "customer@gmail.com",
                ticketCount: qty,
                totalPrice: total,
                status: 'Pending',
                scanned: false
            });
            router.push(`/events/${id}/book/payment?bookingId=${bookingId}`);
        } catch (error) {
            alert("Unexpected error. Please try again.");
        }
    }, [id, event, total, qty, createBookingMutation, router]);

    if (!event) {
        if (!storageLoaded) return (<main style={{ paddingTop: '150px', textAlign: 'center' }}><p>Loading…</p></main>);
        return (<main style={{ paddingTop: '150px', textAlign: 'center' }}><h2>Event not found</h2><Link href="/">Back to Home</Link></main>);
    }

    if (bookingDone) {
        return (
            <main style={{ backgroundColor: '#f9fafb', minHeight: '100vh', paddingTop: 'var(--header-h)', paddingBottom: '60px' }}>
                <div className="container" style={{ padding: '24px 0', maxWidth: '680px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '8px' }}>✓</div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>Booking confirmed</h1>
                        <p style={{ fontSize: '14px', color: '#4b5563' }}>{event.title} — {qty} ticket{qty !== 1 ? 's' : ''}.</p>
                    </div>
                    <div style={{ marginBottom: '24px', background: '#fff', padding: '16px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <TicketTemplate booking={lastBooking} event={{ ...event, img: event.img, location: event.location, date: event.date, time: event.time }} settings={ticketSettings} />
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main style={{ backgroundColor: '#f9fafb', minHeight: '100vh', paddingTop: 'var(--header-h)', paddingBottom: '60px' }}>
            <div className="container" style={{ padding: '24px 0', maxWidth: '900px' }}>
                <Link href={`/events/${id}/book`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '14px', marginBottom: '24px', textDecoration: 'none' }}>← Back to tickets</Link>
                <div className="event-detail-layout" style={{ alignItems: 'start', paddingTop: 0 }}>
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <p style={{ fontWeight: 600, color: '#111827' }}>Event: {event.title}</p>
                        <p style={{ fontSize: '14px', color: '#4b5563', marginTop: '8px' }}>{qty} ticket{qty !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="event-detail-right-col" style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <button type="button" onClick={handleConfirmPay} style={{ width: '100%', marginTop: '16px', padding: '14px', background: '#F43F5E', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>
                            {total > 0 ? "Confirm & Pay" : "Confirm Booking"}
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
