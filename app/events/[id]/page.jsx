"use client";

import React from 'react';
import Link from 'next/link';
import {
    Calendar,
    MapPin,
    Clock,
    Users,
    Languages,
    ShieldCheck,
    Armchair,
    CheckCircle,
    Warehouse,
    Info,
    ChevronDown,
    Star,
    Share2,
    Heart
} from 'lucide-react';

const MOCK_EVENTS = {};

export default function EventDetailPage({ params }) {
    const { id } = React.use(params);
    const event = MOCK_EVENTS[id];

    if (!event) {
        return (
            <main style={{ backgroundColor: '#f9fafb', minHeight: '100vh', paddingTop: '150px', textAlign: 'center' }}>
                <div className="container">
                    <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#111827' }}>Event Not Found</h2>
                    <p style={{ color: '#6b7280', marginTop: '10px' }}>The event you are looking for does not exist or has been removed.</p>
                    <Link href="/">
                        <button style={{ marginTop: '20px', padding: '12px 24px', background: '#F43F5E', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>
                            Back to Home
                        </button>
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main style={{ backgroundColor: '#f9fafb', minHeight: '100vh', paddingTop: '102px' }}>

            {/* ── Banner Section ── */}
            <div style={{ position: 'relative', width: '100%', height: '400px', backgroundColor: '#000' }}>
                <img
                    src={event.img}
                    alt={event.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
                />
                <div style={{
                    position: 'absolute',
                    bottom: '0',
                    left: '0',
                    width: '100%',
                    padding: '40px 0',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)'
                }}>
                    <div className="container">
                        <h1 style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 800, margin: '0 0 10px 0' }}>{event.title}</h1>
                        <div style={{ display: 'flex', gap: '20px', color: '#fff' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Calendar size={18} /> {event.date}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><MapPin size={18} /> {event.location}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container" style={{ padding: '40px 0', display: 'flex', gap: '30px' }}>

                {/* ── Left Column ── */}
                <div style={{ flex: '1' }}>

                    {/* Main Card (Title & Info Area) */}
                    <div style={{ background: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', marginBottom: '30px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                            <div>
                                <span style={{ background: '#F43F5E', color: '#fff', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 700 }}>{event.category}</span>
                                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '15px', color: '#111827' }}>{event.title}</h2>
                            </div>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <button style={{ border: '1px solid #e5e7eb', padding: '8px', borderRadius: '50%', background: '#fff' }}><Heart size={20} color="#6b7280" /></button>
                                <button style={{ border: '1px solid #e5e7eb', padding: '8px', borderRadius: '50%', background: '#fff' }}><Share2 size={20} color="#6b7280" /></button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginTop: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#4b5563' }}>
                                <Calendar className="text-orange-500" size={20} />
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>{event.date}</p>
                                    <p style={{ fontSize: '12px', margin: 0 }}>{event.time}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#4b5563' }}>
                                <MapPin className="text-orange-500" size={20} />
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>{event.venue}</p>
                                    <p style={{ fontSize: '12px', margin: 0 }}>{event.city}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Event Information */}
                    <div style={{ background: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px' }}>Event Information</h3>
                        <div style={{ display: 'flex', gap: '30px', marginBottom: '25px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 15px', background: '#f8fafc', borderRadius: '8px' }}>
                                <Users size={20} className="text-orange-500" />
                                <span style={{ fontSize: '14px', fontWeight: 600 }}>{event.ageLimit}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 15px', background: '#f8fafc', borderRadius: '8px' }}>
                                <Languages size={20} className="text-orange-500" />
                                <span style={{ fontSize: '14px', fontWeight: 600 }}>{event.language}</span>
                            </div>
                        </div>
                        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '20px' }}>
                            <p style={{ whiteSpace: 'pre-line', color: '#4b5563', lineHeight: '1.8' }}>{event.description}</p>
                        </div>
                    </div>

                    {/* Event Comforts & Features */}
                    <div style={{ background: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px' }}>Event Comforts & Features</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                            {event.features.map((f, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#4b5563' }}>
                                    <span className="text-orange-500">{f.icon}</span>
                                    <span style={{ fontSize: '14px', fontWeight: 600 }}>{f.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Event Location */}
                    <div style={{ background: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px' }}>Event Location</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <p style={{ fontWeight: 600, color: '#4b5563', margin: '0 0 5px 0' }}>Venue: {event.venue}</p>
                                <p style={{ fontWeight: 600, color: '#4b5563' }}>City: {event.city}</p>
                            </div>
                            <div style={{ width: '250px', height: '150px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                                <img src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=300&h=200&fit=crop" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Venue Map" />
                            </div>
                        </div>
                    </div>

                    {/* Things to know */}
                    <div style={{ background: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px' }}>Things to know</h3>

                        <div style={{ marginBottom: '20px' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>Special Note</h4>
                            <p style={{ fontSize: '14px', color: '#4b5563', paddingLeft: '28px' }}>• {event.parking}</p>
                        </div>

                        <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '15px' }}>Cancellation & Refunds</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {event.refundPolicy.map((rule, idx) => (
                                <div key={idx} style={{ padding: '12px 15px', border: '1px solid #f3f4f6', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '14px', color: '#4b5563' }}>{rule}</span>
                                    <ChevronDown size={16} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Reviews */}
                    <div style={{ background: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px' }}>Reviews</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '20px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600, marginRight: '10px' }}>Rating</span>
                            {[1, 2, 3, 4, 5].map(s => <Star key={s} size={18} fill="#e5e7eb" stroke="#e5e7eb" />)}
                        </div>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <input type="text" placeholder="Name" style={{ flex: 1, padding: '12px 15px', border: '1px solid #e5e7eb', borderRadius: '100px', fontSize: '14px' }} />
                            <div style={{ flex: 2, position: 'relative' }}>
                                <input type="text" placeholder="Share your thoughts ..." style={{ width: '100%', padding: '12px 45px 12px 20px', border: '1px solid #e5e7eb', borderRadius: '100px', fontSize: '14px' }} />
                                <button style={{ position: 'absolute', right: '5px', top: '5px', width: '34px', height: '34px', background: '#F43F5E', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>→</button>
                            </div>
                        </div>
                    </div>

                </div>

                {/* ── Right Column (Booking Side) ── */}
                <div style={{ width: '320px' }}>
                    <div style={{ position: 'sticky', top: '130px' }}>
                        <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', textAlign: 'center' }}>
                            <button style={{
                                width: '100%',
                                padding: '16px',
                                background: '#F43F5E',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '16px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                boxShadow: '0 4px 6px -1px rgba(244, 63, 94, 0.3)'
                            }}>
                                Book Now
                            </button>
                        </div>

                        <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', marginTop: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <h4 style={{ fontWeight: 700, marginBottom: '15px' }}>Tags</h4>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                {event.tags.map(tag => (
                                    <span key={tag} style={{ padding: '6px 15px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', color: '#4b5563' }}>{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <div style={{ height: '50px' }}></div>
        </main>
    );
}
