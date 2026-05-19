"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, ArrowLeft, Copy, Check, Clock, ShieldCheck, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function MyRewardsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [rewards, setRewards] = useState([]);
    const [fetching, setFetching] = useState(true);
    const [copying, setCopying] = useState(null);
    const [redeeming, setRedeeming] = useState(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/signin?redirect=/rewards");
        } else if (user) {
            fetchRewards();
        }
    }, [user, loading, router]);

    const fetchRewards = async () => {
        try {
            setFetching(true);
            const res = await fetch(`/api/rewards?userId=${user.id}`);
            const data = await res.json();
            if (data.success) {
                setRewards(data.rewards || []);
            }
        } catch (err) {
            console.error("Error fetching rewards:", err);
        } finally {
            setFetching(false);
        }
    };

    const handleCopy = (code, id) => {
        navigator.clipboard.writeText(code);
        setCopying(id);
        setTimeout(() => setCopying(null), 2000);
    };

    const handleRedeem = async (reward) => {
        try {
            setRedeeming(reward.id);
            // Log redemption
            const res = await fetch('/api/rewards/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rewardId: reward.id,
                    userId: user.id,
                    deviceInfo: navigator.userAgent
                })
            });
            const data = await res.json();
            if (data.success) {
                // Update local state status to redeemed
                setRewards(rewards.map(r => r.id === reward.id ? { ...r, status: 'redeemed', redeemedAt: new Date().toISOString() } : r));
            }
            
            // Redirect user to partner redeem URL
            if (reward.redeemUrl) {
                window.open(reward.redeemUrl, '_blank');
            }
        } catch (err) {
            console.error("Redemption error:", err);
        } finally {
            setRedeeming(null);
        }
    };

    if (loading || !user) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0f19' }}>
                <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    style={{ width: 40, height: 40, border: '4px solid #ec4899', borderTopColor: 'transparent', borderRadius: '50%' }}
                />
            </div>
        );
    }

    return (
        <div style={{ background: '#070a13', minHeight: '100vh', color: '#f8fafc' }}>
            <Navbar />
            
            <main style={{ maxWidth: 1200, margin: '0 auto', padding: '140px 24px 80px' }}>
                {/* Header Section */}
                <div style={{ marginBottom: 40 }}>
                    <motion.button 
                        whileHover={{ x: -5 }}
                        onClick={() => router.back()}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#94a3b8', fontWeight: 700, cursor: 'pointer', marginBottom: 20 }}
                    >
                        <ArrowLeft size={18} /> Back
                    </motion.button>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                        <div style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', padding: 12, borderRadius: 16 }}>
                            <Gift size={28} color="#fff" />
                        </div>
                        <h1 style={{ fontSize: '38px', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>
                            My Exclusive <span style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Rewards</span>
                        </h1>
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '16px', maxWidth: 600, marginTop: 12 }}>
                        Post-booking rewards unlocked exclusively for you after purchasing tickets on BookMyTicket. Take advantage of special rates with our partner network.
                    </p>
                </div>

                {fetching ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
                        <div style={{ width: 40, height: 40, border: '4px solid #8b5cf6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        <style jsx>{`
                            @keyframes spin {
                                to { transform: rotate(360deg); }
                            }
                        `}</style>
                    </div>
                ) : (
                    <>
                        {/* Rewards Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 28 }}>
                            {rewards.map((reward, index) => {
                                const isExpired = reward.expiresAt && new Date(reward.expiresAt) < new Date();
                                const isRedeemed = reward.status === 'redeemed';
                                
                                return (
                                    <motion.div
                                        key={reward.id}
                                        initial={{ opacity: 0, y: 24 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.08 }}
                                        whileHover={{ y: -8 }}
                                        style={{
                                            background: '#0d1325',
                                            borderRadius: '24px',
                                            border: '1px solid #1e293b',
                                            overflow: 'hidden',
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            position: 'relative'
                                        }}
                                    >
                                        {/* Status Badge */}
                                        <div style={{
                                            position: 'absolute',
                                            top: 20,
                                            right: 20,
                                            zIndex: 5,
                                            background: isRedeemed ? '#059669' : isExpired ? '#dc2626' : '#2563eb',
                                            color: '#fff',
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '11px',
                                            fontWeight: 800,
                                            textTransform: 'uppercase',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                        }}>
                                            {isRedeemed ? 'Redeemed' : isExpired ? 'Expired' : 'Unlocked'}
                                        </div>

                                        {/* Top Card Banner */}
                                        <div style={{ 
                                            height: '140px', 
                                            background: reward.partnerLogo ? `url(${reward.partnerLogo}) center/cover` : 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                                            position: 'relative',
                                            display: 'flex',
                                            alignItems: 'flex-end',
                                            padding: '20px'
                                        }}>
                                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, rgba(7,10,19,0.8))' }} />
                                            <div style={{ position: 'relative', zIndex: 2, background: 'rgba(13, 19, 37, 0.9)', border: '1px solid #334155', borderRadius: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <Gift size={16} color="#ec4899" />
                                                <span style={{ fontWeight: 800, fontSize: '13px', color: '#fff' }}>{reward.partnerName}</span>
                                            </div>
                                        </div>

                                        {/* Content details */}
                                        <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: 12, lineHeight: 1.3 }}>
                                                {reward.offerTitle}
                                            </h3>
                                            <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: 24, lineHeight: 1.5, flex: 1 }}>
                                                {reward.offerDescription || "Enjoy special partner benefits as a token of our appreciation for your booking."}
                                            </p>

                                            {/* Code Area */}
                                            <div style={{ 
                                                background: '#070a13', 
                                                borderRadius: '16px', 
                                                padding: '16px', 
                                                border: '1.5px dashed #334155',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                marginBottom: 20
                                            }}>
                                                <div>
                                                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                                                        Promo Code
                                                    </div>
                                                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff', fontFamily: 'monospace', opacity: isRedeemed ? 0.5 : 1 }}>
                                                        {reward.couponCode}
                                                    </div>
                                                </div>
                                                <motion.button
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleCopy(reward.couponCode, reward.id)}
                                                    disabled={isRedeemed || isExpired}
                                                    style={{
                                                        background: copying === reward.id ? '#10b981' : '#1e293b',
                                                        color: '#fff',
                                                        border: 'none',
                                                        padding: '10px 16px',
                                                        borderRadius: '10px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                        fontWeight: 700,
                                                        fontSize: '13px',
                                                        cursor: (isRedeemed || isExpired) ? 'not-allowed' : 'pointer',
                                                        opacity: (isRedeemed || isExpired) ? 0.5 : 1
                                                    }}
                                                >
                                                    {copying === reward.id ? <Check size={16} /> : <Copy size={16} />}
                                                    {copying === reward.id ? "Copied" : "Copy"}
                                                </motion.button>
                                            </div>

                                            {/* Redeem & Visit Partner */}
                                            <motion.button
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleRedeem(reward)}
                                                disabled={isExpired || redeeming === reward.id}
                                                style={{
                                                    background: isRedeemed ? '#1e293b' : 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                                                    color: '#fff',
                                                    border: 'none',
                                                    padding: '14px 20px',
                                                    borderRadius: '12px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: 8,
                                                    fontWeight: 800,
                                                    fontSize: '14px',
                                                    cursor: isExpired ? 'not-allowed' : 'pointer',
                                                    boxShadow: !isRedeemed && !isExpired ? '0 4px 15px rgba(236,72,153,0.3)' : 'none',
                                                    opacity: isExpired ? 0.5 : 1
                                                }}
                                            >
                                                {redeeming === reward.id ? 'Redeeming...' : isRedeemed ? 'Visit Brand Site Again' : 'Redeem & Shop Partner'}
                                                <ExternalLink size={16} />
                                            </motion.button>

                                            {/* Verification Footer */}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, paddingTop: 16, borderTop: '1px solid #1e293b' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '11px', color: '#10b981', fontWeight: 700 }}>
                                                    <ShieldCheck size={14} /> Verified Partner
                                                </div>
                                                {reward.expiresAt && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                                                        <Clock size={14} /> Expires: {new Date(reward.expiresAt).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Empty State */}
                        {rewards.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '100px 24px', background: '#0d1325', borderRadius: '32px', border: '1px solid #1e293b' }}>
                                <div style={{ fontSize: '64px', marginBottom: 24 }}>🎁</div>
                                <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: 12 }}>No rewards unlocked yet</h3>
                                <p style={{ color: '#94a3b8', maxWidth: 450, margin: '0 auto 30px', fontSize: '15px', lineHeight: 1.6 }}>
                                    Partner coupon codes are unlocked only after booking premium event passes. Complete a booking to receive unique rewards!
                                </p>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => router.push('/')}
                                    style={{
                                        background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                                        color: '#fff',
                                        border: 'none',
                                        padding: '14px 28px',
                                        borderRadius: '14px',
                                        fontWeight: 800,
                                        fontSize: '15px',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 15px rgba(236,72,153,0.3)'
                                    }}
                                >
                                    Browse Events
                                </motion.button>
                            </div>
                        )}
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
}
