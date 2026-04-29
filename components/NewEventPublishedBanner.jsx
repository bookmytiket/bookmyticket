"use client";
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Calendar, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function NewEventPublishedBanner() {
    const [latestEvent, setLatestEvent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLatestEvent() {
            try {
                const { data, error } = await supabase
                    .from('events')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (error) throw error;
                setLatestEvent(data);
            } catch (err) {
                console.error("Error fetching latest event:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchLatestEvent();
    }, []);

    if (loading || !latestEvent) return null;

    return (
        <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            transition={{ duration: 0.6, ease: "circOut" }}
            style={{ 
                width: '100%', 
                background: 'linear-gradient(90deg, #1e1b4b 0%, #4c1d95 50%, #831843 100%)',
                color: '#fff',
                overflow: 'hidden',
                position: 'relative',
                zIndex: 50
            }}
        >
            <div style={{ 
                maxWidth: '1240px', 
                margin: '0 auto', 
                padding: '12px 20px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ 
                        background: 'rgba(255,255,255,0.15)', 
                        padding: '6px 12px', 
                        borderRadius: '100px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                        <Sparkles size={14} className="text-pink-400" />
                        New Event Published
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                            {latestEvent.title}
                        </span>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} />
                            {new Date(latestEvent.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </span>
                    </div>
                </div>

                <Link 
                    href={`/events/detail?id=${latestEvent.id}`}
                    style={{ 
                        textDecoration: 'none',
                        background: '#fff',
                        color: '#1e1b4b',
                        padding: '8px 20px',
                        borderRadius: '50px',
                        fontSize: '13px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(255,255,255,0.2)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    }}
                >
                    Book Tickets Now
                    <ArrowRight size={14} />
                </Link>
            </div>
            
            {/* Animated Glow Effect */}
            <motion.div 
                animate={{ 
                    x: ['-100%', '200%'],
                }}
                transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    ease: "linear" 
                }}
                style={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '30%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                    pointerEvents: 'none'
                }}
            />
        </motion.div>
    );
}
