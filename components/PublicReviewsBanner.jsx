"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Star, MessageSquareQuote } from 'lucide-react';
import Link from 'next/link';

export default function PublicReviewsBanner() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        async function fetchReviews() {
            try {
                // Fetch latest 10 reviews
                const { data: reviewsData, error: reviewsError } = await supabase
                    .from('vendor_reviews')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (reviewsError) throw reviewsError;
                if (!isMounted) return;

                if (!reviewsData || reviewsData.length === 0) {
                    setLoading(false);
                    return;
                }

                // Fetch profiles for these reviews
                const userIds = [...new Set(reviewsData.map(r => r.user_id))];
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, full_name, username')
                    .in('id', userIds);

                if (profilesError) throw profilesError;
                if (!isMounted) return;

                // Merge data
                const merged = reviewsData.map(r => ({
                    ...r,
                    profiles: profilesData?.find(p => p.id === r.user_id)
                }));

                setReviews(merged);
            } catch (err) {
                console.error("Error fetching public reviews:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchReviews();
        return () => { isMounted = false; };
    }, []);

    if (loading || reviews.length === 0) return null;

    return (
        <section style={{ 
            width: '100%', 
            background: '#ffffff', 
            borderBottom: '1px solid #f1f5f9', 
            overflow: 'hidden',
            height: '52px',
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            zIndex: 40
        }}>
            <div style={{ maxWidth: '1240px', margin: '0 auto', width: '100%', padding: '0 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px', paddingRight: '24px', borderRight: '2px solid #f1f5f9', height: '28px', background: '#fff', zIndex: 5 }}>
                        <div className="pulse-icon" style={{ 
                            background: '#fdf2f8', 
                            padding: '6px', 
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1.5px solid #fce7f3',
                            boxShadow: '0 0 10px rgba(248, 68, 100, 0.1)'
                        }}>
                            <MessageSquareQuote size={14} className="text-[#f84464]" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: '#0f172a', letterSpacing: '1px', lineHeight: 1 }}>Feedback</span>
                            <span className="blink-text" style={{ fontSize: '7px', fontWeight: 900, color: '#f84464', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>Live Pulse</span>
                        </div>
                    </div>
                    
                    <div className="reviews-scroll-container" style={{ flex: 1, overflow: 'hidden', position: 'relative', height: '100%' }}>
                        <div className="reviews-marquee" style={{ 
                            display: 'flex', 
                            gap: '60px', 
                            animation: 'marquee 50s linear infinite',
                            width: 'max-content',
                            paddingRight: '60px'
                        }}>
                            {[...reviews, ...reviews].map((review, idx) => (
                                <Link 
                                    key={idx} 
                                    href={`/services/${review.vendor_id}`}
                                    style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', transition: 'opacity 0.2s' }}
                                    className="review-item"
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#111827' }}>
                                            {review.profiles?.full_name || review.profiles?.username || 'Verified User'}
                                        </span>
                                        <div style={{ display: 'flex', color: '#fbbf24' }}>
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={11} fill={i < review.rating ? 'currentColor' : 'none'} strokeWidth={3} />
                                            ))}
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '13px', color: '#475569', fontStyle: 'italic', fontWeight: 500 }}>
                                        "{review.comment?.length > 70 ? review.comment.substring(0, 67) + '...' : review.comment}"
                                    </span>
                                    <div style={{ 
                                        fontSize: '10px', 
                                        fontWeight: 900, 
                                        color: '#f84464', 
                                        background: 'linear-gradient(135deg, #fdf2f8 0%, #fae8ff 100%)', 
                                        padding: '3px 10px', 
                                        borderRadius: '8px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.8px',
                                        border: '1px solid #fce7f3'
                                    }}>
                                        Artist Review
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
                .pulse-icon {
                    animation: pulse 2s ease-in-out infinite;
                }
                .blink-text {
                    animation: blink 1.5s ease-in-out infinite;
                }
                .reviews-marquee:hover {
                    animation-play-state: paused;
                }
                .review-item:hover {
                    opacity: 0.7;
                }
                .reviews-scroll-container::before,
                .reviews-scroll-container::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    width: 80px;
                    height: 100%;
                    z-index: 2;
                    pointer-events: none;
                }
                .reviews-scroll-container::before {
                    left: 0;
                    background: linear-gradient(to right, #fff, transparent);
                }
                .reviews-scroll-container::after {
                    right: 0;
                    background: linear-gradient(to left, #fff, transparent);
                }
            `}</style>
        </section>
    );
}
