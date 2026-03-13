"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, CheckCircle } from 'lucide-react';
import { HOME_EVENTS } from '@/app/data/homeEvents';
import { getFeeBreakdown, DEFAULT_FEE_SETTINGS } from '@/app/utils/feeBreakdown';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from '@/components/AuthContext';

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=600&fit=crop';
const ROW_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

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

function getCategoryForRow(categories, rIdx) {
    let sum = 0;
    for (const cat of categories) {
        const rows = Math.max(0, Math.floor(Number(cat.rows) || 0));
        if (rIdx < sum + rows) return cat;
        sum += rows;
    }
    return categories[categories.length - 1] || null;
}

function getCatColor(name) {
    const n = (name || '').toLowerCase();
    if (n === 'vip') return '#f59e0b';
    if (n === 'gold') return '#a855f7';
    if (n === 'premium') return '#6366f1';
    if (n === 'silver') return '#22c55e';
    if (n === 'general') return '#0ea5e9';
    const COLORS = ['#0ea5e9', '#a855f7', '#22c55e', '#f97316', '#f43f5e', '#06b6d4', '#6366f1'];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return COLORS[Math.abs(hash) % COLORS.length];
}

export default function EventBookClient({ id }) {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const convexEvents = useQuery(api.events.getActiveEvents) || [];
    const [storageLoaded, setStorageLoaded] = useState(false);
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        setStorageLoaded(true);
    }, []);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push(`/signin?redirect=/events/${id}/book`);
        }
    }, [user, authLoading, id, router]);

    const feeSettings = useQuery(api.feeSettings.get) || DEFAULT_FEE_SETTINGS;
    const [selectedSeats, setSelectedSeats] = useState([]);

    const event = useMemo(() => getEventById(id, convexEvents), [id, convexEvents]);

    const isSeating = useMemo(() => {
        return event &&
            event.seatingEnabled !== false &&
            Array.isArray(event.seatCategories) &&
            event.seatCategories.length > 0 &&
            Number(event.cols) > 0;
    }, [event]);

    const totalRows = useMemo(() => {
        if (!isSeating) return 0;
        return event.seatCategories.reduce((s, c) => s + Math.max(0, Math.floor(Number(c.rows) || 0)), 0);
    }, [isSeating, event]);

    const cols = useMemo(() => Math.min(30, Math.max(0, Math.floor(Number(event?.cols) || 0))), [event]);
    const layout = event?.layoutType || 'stage';

    const toggleSeat = (seatId, cat) => {
        setSelectedSeats(prev => {
            const idx = prev.findIndex(s => s.id === seatId);
            if (idx >= 0) return prev.filter(s => s.id !== seatId);
            return [...prev, { id: seatId, catName: cat.name, price: Number(cat.price) || 0, isFree: !!cat.isFree }];
        });
    };

    const totalSeatPrice = selectedSeats.reduce((s, seat) => s + (seat.isFree ? 0 : seat.price), 0);
    const ticketPrice = isSeating
        ? (selectedSeats.length > 0 ? totalSeatPrice : 0)
        : (event?.price ?? 499);
    const baseAmount = isSeating ? totalSeatPrice : ticketPrice * quantity;
    const { convenienceFee, gst, total } = getFeeBreakdown(baseAmount, feeSettings);

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

    const ticketName = event.ticketName ?? 'General Admission';

    const handleContinue = () => {
        if (isSeating && selectedSeats.length === 0) return;
        const seatParam = selectedSeats.length > 0
            ? `&seats=${encodeURIComponent(JSON.stringify(selectedSeats))}`
            : '';
        const qtyParam = !isSeating && quantity > 1 ? `?qty=${quantity}` : '?';
        router.push(`/events/${id}/book/checkout${qtyParam}${seatParam}`);
    };

    return (
        <main style={{ backgroundColor: '#f9fafb', minHeight: '100vh', paddingTop: 'var(--header-h)', paddingBottom: '60px' }}>
            <div className="container" style={{ padding: '24px 0', maxWidth: '1100px' }}>
                <Link href={`/events/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '14px', marginBottom: '24px', textDecoration: 'none' }}>
                    ← Back to event
                </Link>

                <div className="event-detail-layout" style={{ alignItems: 'start', paddingTop: 0 }}>
                    <div style={{ flex: '1', minWidth: 0 }}>
                        <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', margin: '0 0 12px 0' }}>{event.title}</h1>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', color: '#4b5563', fontSize: '14px' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={16} /> {event.date}{event.time ? `, ${event.time}` : ''}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={16} /> {event.location}</span>
                            </div>
                        </div>

                        {isSeating ? (
                            <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', margin: 0 }}>Select Your Seats</h2>
                                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                        {event.seatCategories.map(cat => (
                                            <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: getCatColor(cat.name) }} />
                                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#4b5563' }}>{cat.name} {cat.isFree ? '(Free)' : `₹${cat.price}`}</span>
                                            </div>
                                        ))}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#f84464' }} />
                                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#4b5563' }}>Selected</span>
                                        </div>
                                    </div>
                                </div>

                                {selectedSeats.length > 0 && (
                                    <div style={{ marginBottom: '16px', padding: '10px 14px', backgroundColor: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <CheckCircle size={16} color="#22c55e" />
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#15803d' }}>
                                            {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''} selected: {selectedSeats.map(s => s.id).join(', ')}
                                        </span>
                                    </div>
                                )}

                                <div style={{ overflowX: 'auto', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    {(layout === 'stage' || layout === 'rate') && (
                                        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                                            <div style={{ height: '6px', backgroundColor: '#3b82f6', borderRadius: '3px', marginBottom: '8px', boxShadow: '0 0 15px rgba(59,130,246,0.5)', width: '60%', margin: '0 auto 8px' }} />
                                            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '3px', color: '#64748b', margin: 0, fontWeight: 800 }}>STAGE / PERFORMANCE AREA</p>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                                        {[...Array(totalRows)].map((_, rIdx) => {
                                            const rowLabel = ROW_LABELS[rIdx] || `${rIdx + 1}`;
                                            const cat = getCategoryForRow(event.seatCategories, rIdx);
                                            const color = cat ? getCatColor(cat.name) : '#3b82f6';
                                            return (
                                                <div key={rIdx} style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                                    <span style={{ width: '50px', textAlign: 'right', fontWeight: 800, fontSize: '10px', color, marginRight: '8px' }}>{rowLabel}</span>
                                                    {[...Array(cols)].map((_, cIdx) => {
                                                        const seatId = `${rowLabel}${cIdx + 1}`;
                                                        const isSelected = selectedSeats.some(s => s.id === seatId);
                                                        return (
                                                            <button
                                                                key={cIdx}
                                                                type="button"
                                                                onClick={() => cat && toggleSeat(seatId, cat)}
                                                                style={{
                                                                    width: '26px', height: '26px',
                                                                    borderRadius: '5px',
                                                                    backgroundColor: isSelected ? '#f84464' : `${color}18`,
                                                                    border: `2px solid ${isSelected ? '#f84464' : color}`,
                                                                    cursor: 'pointer',
                                                                    fontSize: '7px', fontWeight: 800,
                                                                    color: isSelected ? '#fff' : color,
                                                                    transition: 'all 0.15s ease'
                                                                }}
                                                            >
                                                                {cIdx + 1}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    disabled={selectedSeats.length === 0}
                                    onClick={handleContinue}
                                    style={{
                                        marginTop: '20px', width: '100%', padding: '14px',
                                        background: selectedSeats.length > 0 ? '#F43F5E' : '#e5e7eb',
                                        color: selectedSeats.length > 0 ? '#fff' : '#9ca3af',
                                        border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '15px',
                                        cursor: selectedSeats.length > 0 ? 'pointer' : 'not-allowed'
                                    }}
                                >
                                    {selectedSeats.length > 0 ? `Continue with ${selectedSeats.length} seat${selectedSeats.length > 1 ? 's' : ''} →` : 'Select at least one seat'}
                                </button>
                            </div>
                        ) : (
                            <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '16px', color: '#111827' }}>Select tickets</h2>
                                <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                                    <div>
                                        <p style={{ fontWeight: 700, margin: '0 0 4px 0', color: '#111827' }}>{ticketName}</p>
                                        <p style={{ margin: 0, fontSize: '14px', color: '#4b5563' }}>First Come First Serve</p>
                                        <p style={{ margin: '8px 0 0', fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>₹ {ticketPrice}</p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ width: '36px', height: '36px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#fff', fontSize: '18px', cursor: 'pointer' }}>−</button>
                                        <span style={{ minWidth: '28px', textAlign: 'center', fontWeight: 700 }}>{quantity}</span>
                                        <button type="button" onClick={() => setQuantity(q => q + 1)} style={{ width: '36px', height: '36px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#fff', fontSize: '18px', cursor: 'pointer' }}>+</button>
                                        <button type="button" onClick={handleContinue} style={{ padding: '12px 24px', background: '#F43F5E', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
                                            Add & Continue
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Order Summary */}
                    <div className="event-detail-right-col" style={{ position: 'sticky', top: '110px' }}>
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

                            {isSeating && selectedSeats.length > 0 ? (
                                <div style={{ marginBottom: '12px' }}>
                                    {selectedSeats.map(seat => (
                                        <div key={seat.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '13px', color: '#4b5563' }}>Seat {seat.id} ({seat.catName})</span>
                                            <span style={{ fontSize: '13px', fontWeight: 600 }}>{seat.isFree ? 'Free' : `₹ ${seat.price}`}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : !isSeating && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '14px', color: '#4b5563' }}>Ticket (₹ {ticketPrice} × {quantity})</span>
                                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>₹ {baseAmount.toFixed(2)}</span>
                                </div>
                            )}

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
