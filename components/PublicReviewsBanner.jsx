"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Star, Quote } from 'lucide-react';
import Link from 'next/link';

export default function PublicReviewsBanner() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        let isMounted = true;
        async function fetchReviews() {
            try {
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

                const userIds = [...new Set(reviewsData.map(r => r.user_id))];
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, full_name, username')
                    .in('id', userIds);

                if (profilesError) throw profilesError;
                if (!isMounted) return;

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

    useEffect(() => {
        if (reviews.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % reviews.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [reviews]);

    if (loading || reviews.length === 0) return null;

    const currentReview = reviews[currentIndex];

    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            width: '100%',
            padding: '20px 0'
        }}>
            <div style={{ 
                width: '100%',
                maxWidth: '600px',
                background: '#ffffff', 
                borderRadius: '24px',
                border: '1px solid #f1f5f9', 
                padding: '24px',
                position: 'relative',
                boxShadow: '0 20px 40px rgba(0,0,0,0.04)',
                textAlign: 'center',
                overflow: 'hidden'
            }}>
                {/* Branding Badge */}
                <div style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    background: '#fdf2f8', 
                    padding: '6px 16px', 
                    borderRadius: '100px',
                    border: '1px solid #fce7f3',
                    marginBottom: '20px'
                }}>
                    <span style={{ fontSize: '10px', fontWeight: 900, color: '#f84464', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Live Pulse Feedback</span>
                </div>

                <div style={{ position: 'relative', height: '120px' }}>
                    <div key={currentIndex} className="flip-card-content">
                        <Link 
                            href={`/services/${currentReview.vendor_id}`}
                            style={{ textDecoration: 'none', display: 'block' }}
                        >
                            <Quote size={24} style={{ color: '#f1f5f9', position: 'absolute', top: '-10px', left: '0' }} />
                            
                            <p style={{ 
                                fontSize: '18px', 
                                color: '#1e293b', 
                                fontWeight: 600, 
                                lineHeight: 1.6,
                                margin: '0 0 20px',
                                fontStyle: 'italic',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                            }}>
                                "{currentReview.comment}"
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>
                                        {currentReview.profiles?.full_name || currentReview.profiles?.username || 'Verified User'}
                                    </span>
                                    <div style={{ display: 'flex', color: '#fbbf24' }}>
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={12} fill={i < currentReview.rating ? 'currentColor' : 'none'} strokeWidth={3} />
                                        ))}
                                    </div>
                                </div>
                                <div style={{ 
                                    fontSize: '9px', 
                                    fontWeight: 900, 
                                    color: '#64748b',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    background: '#f8fafc',
                                    padding: '4px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid #f1f5f9'
                                }}>
                                    Verified Artist Review
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Progress Indicator */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '10px' }}>
                    {reviews.map((_, i) => (
                        <div key={i} style={{ 
                            width: i === currentIndex ? '20px' : '6px', 
                            height: '6px', 
                            borderRadius: '3px', 
                            background: i === currentIndex ? '#f84464' : '#e2e8f0',
                            transition: 'all 0.3s ease'
                        }}></div>
                    ))}
                </div>
            </div>

            <style jsx>{`
                @keyframes flipCardIn {
                    0% { transform: translateY(30px) rotateX(-45deg); opacity: 0; }
                    100% { transform: translateY(0) rotateX(0deg); opacity: 1; }
                }
                .flip-card-content {
                    animation: flipCardIn 0.7s cubic-bezier(0.23, 1, 0.32, 1) forwards;
                    perspective: 1000px;
                }
            `}</style>
        </div>
    );
}
