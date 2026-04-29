"use client";
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Calendar, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function NewEventPublishedBanner() {
    const [items, setItems] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLatestData() {
            try {
                // Fetch latest event
                const { data: events } = await supabase
                    .from('events')
                    .select('id, title, date')
                    .order('created_at', { ascending: false })
                    .limit(1);

                // Fetch latest professional service (vendor)
                const { data: vendors } = await supabase
                    .from('vendors')
                    .select('id, business_name, category')
                    .eq('is_approved', true)
                    .order('created_at', { ascending: false })
                    .limit(1);

                const combined = [];
                if (events && events.length > 0) {
                    const eventData = events[0];
                    combined.push({
                        type: 'EVENT',
                        label: 'New Event Published',
                        title: eventData.title,
                        meta: new Date(eventData.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
                        url: `/events/detail?id=${eventData.id}`,
                        btnText: 'Book Tickets Now'
                    });
                }
                
                if (vendors && vendors.length > 0) {
                    const serviceData = vendors[0];
                    combined.push({
                        type: 'SERVICE',
                        label: 'New Professional Service',
                        title: serviceData.business_name,
                        meta: serviceData.category,
                        url: `/services/${serviceData.id}`,
                        btnText: 'Hire Expert Now'
                    });
                }
                setItems(combined);
            } catch (err) {
                console.error("Error fetching latest data:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchLatestData();
    }, []);

    useEffect(() => {
        if (items.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % items.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [items.length]);

    if (loading || items.length === 0) return null;

    const currentItem = items[currentIndex];

    return (
        <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            transition={{ duration: 0.6, ease: "circOut" }}
            style={{ 
                width: '100%', 
                background: currentItem.type === 'EVENT' 
                    ? 'linear-gradient(90deg, #1e1b4b 0%, #4c1d95 50%, #831843 100%)'
                    : 'linear-gradient(90deg, #1e1b4b 0%, #7c3aed 50%, #db2777 100%)',
                color: '#fff',
                overflow: 'hidden',
                position: 'relative',
                zIndex: 50,
                transition: 'background 0.8s ease'
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
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={currentIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.5 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
                    >
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
                            <Sparkles size={14} className={currentItem.type === 'EVENT' ? "text-pink-400" : "text-yellow-400"} />
                            {currentItem.label}
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                                {currentItem.title}
                            </span>
                            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {currentItem.type === 'EVENT' ? <Calendar size={12} /> : <Sparkles size={12} />}
                                {currentItem.meta}
                            </span>
                        </div>
                    </motion.div>
                </AnimatePresence>

                <motion.div
                    key={`btn-${currentIndex}`}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <Link 
                        href={currentItem.url}
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
                        {currentItem.btnText}
                        <ArrowRight size={14} />
                    </Link>
                </motion.div>
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
