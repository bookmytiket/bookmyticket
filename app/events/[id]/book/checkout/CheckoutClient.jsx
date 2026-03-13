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
            console.error("Booking failed:", error);
            alert("Unexpected error. Please try again.");
        }
    }, [id, event, total, qty, createBookingMutation, router]);

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
        return (<main style={{ paddingTop: '150px', textAlign: 'center' }}><h2>Event not found</h2><Link href="/">Back to Home</Link></main>);
    }

    if (bookingDone) {
        return (
            <main style={{ backgroundColor: '#f9fafb', minHeight: '100vh', paddingTop: 'var(--header-h)', paddingBottom: '60px' }}>
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
                        <button type="button" onClick={handleDownloadPdf} style={{ padding: '12px 20px', background: '#F43F5E', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>Download ticket (PDF)</button>
                        <button type="button" onClick={handleSendEmail} style={{ padding: '12px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>Send ticket to Email</button>
                        <button type="button" onClick={handleSendSms} style={{ padding: '12px 20px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>Send SMS</button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main style={{ backgroundColor: '#f9fafb', minHeight: '100vh', paddingTop: 'var(--header-h)', paddingBottom: '60px' }}>
            <div className="container" style={{ padding: '24px 0', maxWidth: '900px' }}>
                <Link href={`/events/${id}/book`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '14px', marginBottom: '24px', textDecoration: 'none' }}>← Back to tickets</Link>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px', color: '#111827' }}>Booking confirmation</h1>

                <div className="event-detail-layout" style={{ alignItems: 'start', paddingTop: 0 }}>
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '16px' }}>Name, email, and payment will be collected on the next step.</p>
                        <p style={{ fontWeight: 600, color: '#111827' }}>Event: {event.title}</p>
                        <p style={{ fontSize: '14px', color: '#4b5563', marginTop: '8px' }}>{qty} ticket{qty !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="event-detail-right-col" style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
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
                        <button type="button" onClick={handleConfirmPay} style={{ width: '100%', marginTop: '16px', padding: '14px', background: '#F43F5E', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>
                            {total > 0 ? "Confirm & Pay" : "Confirm Booking"}
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
