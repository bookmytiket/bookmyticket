"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { supabase } from "@/lib/supabase";
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { BRAND_COUPONS } from "@/app/data/homeEvents";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Ticket, ArrowLeft, Copy, Check, Clock, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function CouponsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { data: dbCoupons, loading: dbLoading } = useSupabaseQuery('branding_coupons', (q) => q, []);
    const [coupons, setCoupons] = useState([]);
    const [copying, setCopying] = useState(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/signin?redirect=/coupons");
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (dbCoupons && dbCoupons.length > 0) {
            setCoupons(dbCoupons);
        } else {
            setCoupons(BRAND_COUPONS);
        }
    }, [dbCoupons]);

    const handleCopy = (code, id) => {
        navigator.clipboard.writeText(code);
        setCopying(id);
        setTimeout(() => setCopying(null), 2000);
    };

    if (loading || !user) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    style={{ width: 40, height: 40, border: '4px solid #f84464', borderTopColor: 'transparent', borderRadius: '50%' }}
                />
            </div>
        );
    }

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
            <Navbar />
            
            <main style={{ maxWidth: 1200, margin: '0 auto', padding: '140px 24px 80px' }}>
                {/* Header Section */}
                <div style={{ marginBottom: 40 }}>
                    <motion.button 
                        whileHover={{ x: -5 }}
                        onClick={() => router.back()}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#64748b', fontWeight: 700, cursor: 'pointer', marginBottom: 20 }}
                    >
                        <ArrowLeft size={18} /> Back
                    </motion.button>
                    <h1 style={{ fontSize: '36px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 12 }}>
                        Exclusive <span style={{ background: 'linear-gradient(135deg, #f84464 0%, #c026d3 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Partner Coupons</span>
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '16px', maxWidth: 600 }}>
                        Handpicked deals and exclusive discounts from our premium branding partners. Claim your rewards today!
                    </p>
                </div>

                {/* Coupons Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                    {coupons.map((coupon, index) => {
                        const brandName = coupon.brand_name || coupon.brandName || "Partner";
                        const code = coupon.coupon_code || coupon._id?.toUpperCase().slice(-8) || "DEAL2024";
                        
                        return (
                            <motion.div
                                key={coupon.id || index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -8 }}
                                style={{
                                    background: '#fff',
                                    borderRadius: '24px',
                                    border: '1px solid #e2e8f0',
                                    overflow: 'hidden',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                            >
                                {/* Coupon Top - Visual Part */}
                                <div style={{ 
                                    height: '140px', 
                                    background: coupon.bannerUrl ? `url(${coupon.bannerUrl}) center/cover` : 'linear-gradient(135deg, #f84464 0%, #7c3aed 100%)',
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                    padding: '20px'
                                }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.4))' }} />
                                    <div style={{ position: 'relative', zIndex: 2, background: '#fff', borderRadius: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                        <Gift size={16} color="#f84464" />
                                        <span style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>{brandName}</span>
                                    </div>
                                </div>

                                {/* Coupon Bottom - Content */}
                                <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: 12, lineHeight: 1.3 }}>
                                        {coupon.title}
                                    </h3>
                                    <p style={{ fontSize: '14px', color: '#64748b', marginBottom: 24, lineHeight: 1.5, flex: 1 }}>
                                        {coupon.description || "Get exclusive access to this premium deal from our partner brand."}
                                    </p>

                                    {/* Action Area */}
                                    <div style={{ 
                                        background: '#f8fafc', 
                                        borderRadius: '16px', 
                                        padding: '16px', 
                                        border: '1.5px dashed #cbd5e1',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}>
                                        <div>
                                            <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                                                Promo Code
                                            </div>
                                            <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', fontFamily: 'monospace' }}>
                                                {code}
                                            </div>
                                        </div>
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleCopy(code, coupon.id || index)}
                                            style={{
                                                background: copying === (coupon.id || index) ? '#10b981' : '#0f172a',
                                                color: '#fff',
                                                border: 'none',
                                                padding: '10px 16px',
                                                borderRadius: '10px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                fontWeight: 700,
                                                fontSize: '13px',
                                                cursor: 'pointer',
                                                transition: 'background 0.2s'
                                            }}
                                        >
                                            {copying === (coupon.id || index) ? <Check size={16} /> : <Copy size={16} />}
                                            {copying === (coupon.id || index) ? "Copied" : "Copy"}
                                        </motion.button>
                                    </div>

                                    {/* Verification Footer */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '11px', color: '#22c55e', fontWeight: 700 }}>
                                            <ShieldCheck size={14} /> Verified
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                                            <Clock size={14} /> Limited Time
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Empty State */}
                {coupons.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '80px 0' }}>
                        <div style={{ fontSize: '48px', marginBottom: 20 }}>🎟️</div>
                        <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>No coupons available right now</h3>
                        <p style={{ color: '#64748b' }}>Check back soon for new exclusive deals from our partners!</p>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
