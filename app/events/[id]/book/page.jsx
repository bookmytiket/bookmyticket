"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Calendar, MapPin } from 'lucide-react';
import { HOME_EVENTS } from '@/app/data/homeEvents';
import { getFeeBreakdown, DEFAULT_FEE_SETTINGS } from '@/app/utils/feeBreakdown';
import { useQuery } from "convex/react";
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

export default function EventBookPage({ params }) {
    const { id } = React.use(params);
    const convexEvents = useQuery(api.events.getActiveEvents) || [];
    const rawFeeSettings = useQuery(api.systemConfig.getConfig, { key: "admin_fee_settings" });
    const [storageLoaded, setStorageLoaded] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [feeSettings, setFeeSettings] = useState(DEFAULT_FEE_SETTINGS);

    useEffect(() => {
        if (rawFeeSettings !== undefined) {
            try {
                const parsed = typeof rawFeeSettings === "string" ? JSON.parse(rawFeeSettings) : rawFeeSettings;
                if (parsed) setFeeSettings(prev => ({ ...prev, ...parsed }));
            } catch (_) { }
            setStorageLoaded(true);
        } else if (rawFeeSettings === null) {
            // Null means config key doesn't exist yet, just use defaults
            setStorageLoaded(true);
        }
    }, [rawFeeSettings]);

    const event = useMemo(() => getEventById(id, convexEvents), [id, convexEvents]);

    if (!event) {
        if (!storageLoaded) {
            return (
                <main style={{ backgroundColor: '#f9fafb', minHeight: '100vh', paddingTop: '150px', textAlign: 'center' }}>
                    <div className="container">
                        <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>Loading…</p>
                    </div>
                </main>
            );
        }
        return (
            <main style={{ backgroundColor: '#f9fafb', minHeight: '100vh', paddingTop: '150px', textAlign: 'center' }}>
                <div className="container">
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>Event not found</h2>
                    <Link href="/" style={{ display: 'inline-block', marginTop: '16px', color: '#F43F5E', fontWeight: 600 }}>Back to Home</Link>
                </div>
            </main>
        );
    }

    const ticketPrice = event.price ?? 499;
    const ticketName = event.ticketName ?? 'General Admission';
    const baseAmount = ticketPrice * quantity;
    const { convenienceFee, gst, total } = getFeeBreakdown(baseAmount, feeSettings);

    return (
        <main style={{ backgroundColor: '#f9fafb', minHeight: '100vh', paddingTop: '102px', paddingBottom: '60px' }}>
            <div className="container" style={{ padding: '24px 0', maxWidth: '900px' }}>
                <Link href={`/events/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '14px', marginBottom: '24px', textDecoration: 'none' }}>
                    ← Back to event
                </Link>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px', alignItems: 'start' }}>
                    <div>
                        <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', margin: '0 0 12px 0' }}>{event.title}</h1>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', color: '#4b5563', fontSize: '14px' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={16} /> {event.date}{event.time ? `, ${event.time}` : ''}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={16} /> {event.location}</span>
                            </div>
                        </div>

                        <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '16px', color: '#111827' }}>Select tickets</h2>
                            <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                                <div>
                                    <p style={{ fontWeight: 700, margin: '0 0 4px 0', color: '#111827' }}>{ticketName}</p>
                                    <p style={{ margin: 0, fontSize: '14px', color: '#4b5563' }}>First Come First Serve</p>
                                    <p style={{ margin: '8px 0 0', fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>₹ {ticketPrice}</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                        style={{ width: '36px', height: '36px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#fff', fontSize: '18px', cursor: 'pointer' }}
                                        aria-label="Decrease"
                                    >
                                        −
                                    </button>
                                    <span style={{ minWidth: '28px', textAlign: 'center', fontWeight: 700 }}>{quantity}</span>
                                    <button
                                        type="button"
                                        onClick={() => setQuantity(q => q + 1)}
                                        style={{ width: '36px', height: '36px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#fff', fontSize: '18px', cursor: 'pointer' }}
                                        aria-label="Increase"
                                    >
                                        +
                                    </button>
                                    <Link href={`/events/${id}/book/checkout${quantity > 1 ? `?qty=${quantity}` : ''}`} style={{ textDecoration: 'none' }}>
                                        <button type="button" style={{ padding: '12px 24px', background: '#F43F5E', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
                                            Add & Continue
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ position: 'sticky', top: '110px' }}>
                        <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                            <div style={{ width: '100%', height: '140px', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
                                <img src={event.img} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <p style={{ fontWeight: 700, margin: '0 0 8px 0', color: '#111827' }}>{event.title}</p>
                            <p style={{ fontSize: '14px', color: '#4b5563', margin: 0 }}>{event.date}{event.time ? ` · ${event.time}` : ''}</p>
                            <p style={{ fontSize: '14px', color: '#4b5563', margin: '4px 0 0' }}>{event.location}</p>
                        </div>
                        <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginTop: '20px' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px 0', color: '#111827' }}>Order summary</h4>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ fontSize: '14px', color: '#4b5563' }}>{ticketName}</span>
                                <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>Qty: {quantity}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <span style={{ fontSize: '14px', color: '#4b5563' }}>Ticket (₹ {ticketPrice} × {quantity})</span>
                                <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>₹ {baseAmount.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <span style={{ fontSize: '14px', color: '#4b5563' }}>Convenience Fee</span>
                                <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>₹ {convenienceFee.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ fontSize: '14px', color: '#4b5563' }}>GST</span>
                                <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>₹ {gst.toFixed(2)}</span>
                            </div>
                            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>Total</span>
                                <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#111827' }}>₹ {total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
