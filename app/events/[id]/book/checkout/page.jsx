"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Calendar, MapPin } from 'lucide-react';
import { HOME_EVENTS } from '@/app/data/homeEvents';
import { getFeeBreakdown, DEFAULT_FEE_SETTINGS } from '@/app/utils/feeBreakdown';
import TicketTemplate from '@/components/TicketTemplate';

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=600&fit=crop';

function getEventById(id, organiserEvents) {
    const sid = String(id);
    const fromHome = (Array.isArray(HOME_EVENTS) ? HOME_EVENTS : []).find(e => String(e.id) === sid);
    const fromOrg = (Array.isArray(organiserEvents) ? organiserEvents : []).find(e => String(e.id) === sid);
    const raw = fromHome || fromOrg;
    if (!raw) return null;
    return {
        ...raw,
        img: raw.img || raw.bannerPreview || DEFAULT_IMG,
        title: raw.title || 'Event',
        date: raw.date || 'TBA',
        time: raw.time || '',
        location: raw.location || raw.venue || raw.address || 'Venue',
    };
}

export default function EventCheckoutPage({ params }) {
    const { id } = React.use(params);
    const searchParams = useSearchParams();
    const [organiserEvents, setOrganiserEvents] = useState([]);
    const [storageLoaded, setStorageLoaded] = useState(false);
    const [feeSettings, setFeeSettings] = useState(DEFAULT_FEE_SETTINGS);
    const [bookingDone, setBookingDone] = useState(false);
    const [lastBooking, setLastBooking] = useState(null);
    const [ticketSettings, setTicketSettings] = useState({});

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const raw = localStorage.getItem('organiser_events');
            setOrganiserEvents(raw ? JSON.parse(raw) : []);
            const fees = localStorage.getItem('admin_fee_settings');
            if (fees) setFeeSettings(prev => ({ ...prev, ...JSON.parse(fees) }));
            const ticket = localStorage.getItem('admin_ticket_settings');
            if (ticket) setTicketSettings(JSON.parse(ticket));
        } catch (_) { setOrganiserEvents([]); }
        setStorageLoaded(true);
    }, []);

    const event = useMemo(() => getEventById(id, organiserEvents), [id, organiserEvents]);

    const ticketPrice = event?.price ?? 499;
    const qty = Math.max(1, parseInt(searchParams.get('qty') || '1', 10) || 1);
    const baseAmount = ticketPrice * qty;
    const feeBreakdown = useMemo(() => getFeeBreakdown(baseAmount, feeSettings), [baseAmount, feeSettings]);
    const { convenienceFee, gst, total } = feeBreakdown;

    const handleConfirmPay = useCallback(() => {
        if (!event) return;
        const orderId = 'ORD-' + Date.now();
        const booking = {
            id: orderId,
            eventId: id,
            eventName: event.title,
            amount: total,
            baseAmount,
            convenienceFee,
            gst,
            tickets: qty,
            status: 'Confirmed',
            date: new Date().toISOString().split('T')[0],
        };
        try {
            const saved = localStorage.getItem('admin_bookings');
            const list = saved ? JSON.parse(saved) : [];
            list.push(booking);
            localStorage.setItem('admin_bookings', JSON.stringify(list));
        } catch (_) {}

        try {
            const walletRaw = localStorage.getItem('organiser_wallet');
            const wallet = walletRaw ? JSON.parse(walletRaw) : { balance: 0, currency: '₹', transactions: [] };
            wallet.balance = (Number(wallet.balance) || 0) + baseAmount;
            wallet.transactions = wallet.transactions || [];
            wallet.transactions.unshift({
                id: 'tx-' + Date.now(),
                type: 'Ticket sale',
                amount: baseAmount,
                date: new Date().toISOString().split('T')[0],
                status: 'Completed',
                eventName: event.title,
            });
            localStorage.setItem('organiser_wallet', JSON.stringify(wallet));
        } catch (_) {}

        setLastBooking({
            id: orderId,
            eventId: id,
            eventName: event.title,
            amount: total,
            baseAmount,
            convenienceFee,
            gst,
            tickets: qty,
            status: 'Confirmed',
            date: new Date().toISOString().split('T')[0],
            ticketType: 'General Admission',
            paymentMethod: 'Online',
            location: event.location,
        });
        setBookingDone(true);
    }, [id, event, total, baseAmount, convenienceFee, gst, qty]);

    const onConfirmClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleConfirmPay();
    };

    const handleDownloadPdf = useCallback(() => {
        if (!event) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        const ticketHtml = document.getElementById('ticket-print-area');
        if (!ticketHtml) return;
        printWindow.document.write(`
          <!DOCTYPE html><html><head><title>Ticket - ${event.title}</title></head>
          <body style="margin:16px;background:#f1f5f9;">${ticketHtml.outerHTML}</body></html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
    }, [event]);

    const handleSendEmail = useCallback(() => {
        if (!event) return;
        const subject = encodeURIComponent(`Your ticket for ${event.title}`);
        const body = encodeURIComponent(`Booking confirmed.\nEvent: ${event.title}\nBooking ID: ${lastBooking?.id}\n\nDownload your ticket from the link we sent, or open the attachment.`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }, [event, lastBooking?.id]);

    const handleSendSms = useCallback(() => {
        if (!event) return;
        const msg = encodeURIComponent(`BookMyTicket: Your booking for "${event.title}" is confirmed. ID: ${lastBooking?.id}. Show this at the venue.`);
        window.location.href = `sms:?body=${msg}`;
    }, [event, lastBooking?.id]);

    if (!event) {
        if (!storageLoaded) return (<main style={{ paddingTop: '150px', textAlign: 'center' }}><p>Loading…</p></main>);
        return (
            <main style={{ paddingTop: '150px', textAlign: 'center' }}>
                <h2>Event not found</h2>
                <Link href="/">Back to Home</Link>
            </main>
        );
    }

    if (bookingDone) {
        return (
            <main style={{ backgroundColor: '#f9fafb', minHeight: '100vh', paddingTop: '102px', paddingBottom: '60px' }}>
                <div className="container" style={{ padding: '24px 0', maxWidth: '680px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '8px' }}>✓</div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px', color: '#111827' }}>Booking confirmed</h1>
                        <p style={{ fontSize: '14px', color: '#4b5563', margin: 0 }}>{event.title} — {qty} ticket{qty !== 1 ? 's' : ''}.</p>
                    </div>

                    <div style={{ marginBottom: '24px', background: '#fff', padding: '16px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <TicketTemplate booking={lastBooking} event={{ ...event, img: event.img, location: event.location, date: event.date, time: event.time }} settings={ticketSettings} />
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
                        <button type="button" onClick={handleDownloadPdf} style={{ padding: '12px 20px', background: '#F43F5E', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
                            Download ticket (PDF)
                        </button>
                        <button type="button" onClick={handleSendEmail} style={{ padding: '12px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
                            Send ticket to Email
                        </button>
                        <button type="button" onClick={handleSendSms} style={{ padding: '12px 20px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
                            Send SMS
                        </button>
                    </div>
                    <p style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', marginBottom: '16px' }}>Share the downloaded PDF to WhatsApp or save to your phone.</p>
                    <div style={{ textAlign: 'center' }}>
                        <Link href="/" style={{ display: 'inline-block', padding: '12px 24px', background: '#111827', color: '#fff', borderRadius: '12px', fontWeight: 700, textDecoration: 'none' }}>Back to Home</Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main style={{ backgroundColor: '#f9fafb', minHeight: '100vh', paddingTop: '102px', paddingBottom: '60px' }}>
            <div className="container" style={{ padding: '24px 0', maxWidth: '900px' }}>
                <Link href={`/events/${id}/book`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '14px', marginBottom: '24px', textDecoration: 'none' }}>
                    ← Back to tickets
                </Link>

                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px', color: '#111827' }}>Booking confirmation</h1>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px', alignItems: 'start' }}>
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '16px' }}>Name, email, and payment will be collected on the next step.</p>
                        <p style={{ fontWeight: 600, color: '#111827' }}>Event: {event.title}</p>
                        <p style={{ fontSize: '14px', color: '#4b5563', marginTop: '8px' }}>{qty} ticket{qty !== 1 ? 's' : ''}</p>
                    </div>
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ width: '100%', height: '120px', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px' }}>
                            <img src={event.img} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <p style={{ fontWeight: 700, margin: '0 0 4px 0', fontSize: '14px' }}>{event.title}</p>
                        <p style={{ fontSize: '13px', color: '#4b5563', margin: 0 }}><Calendar size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> {event.date}</p>
                        <p style={{ fontSize: '13px', color: '#4b5563', margin: '4px 0 12px' }}><MapPin size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> {event.location}</p>
                        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', marginTop: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                                <span style={{ color: '#4b5563' }}>Ticket (₹ {ticketPrice} × {qty})</span>
                                <span style={{ fontWeight: 600 }}>₹ {baseAmount.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                                <span style={{ color: '#4b5563' }}>Convenience Fee</span>
                                <span style={{ fontWeight: 600 }}>₹ {convenienceFee.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                                <span style={{ color: '#4b5563' }}>GST</span>
                                <span style={{ fontWeight: 600 }}>₹ {gst.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                                <span style={{ fontWeight: 700, fontSize: '15px' }}>Total</span>
                                <span style={{ fontSize: '1.125rem', fontWeight: 800 }}>₹ {total.toFixed(2)}</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onConfirmClick}
                            style={{ width: '100%', marginTop: '16px', padding: '14px', background: '#F43F5E', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
                            aria-label="Confirm and pay"
                        >
                            Confirm & Pay
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
