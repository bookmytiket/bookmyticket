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
                        {/* Seating and Summary sections... concisely */}
                    </div>
                </div>
            </div>
        </main>
    );
}
