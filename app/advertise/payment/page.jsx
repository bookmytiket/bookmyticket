"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { CreditCard, ShieldCheck, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

function PaymentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const bannerId = searchParams.get('id');
    const [isPaying, setIsPaying] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, processing, success

    const allBanners = useQuery(api.banners.getAllBanners);
    const finalizePayment = useMutation(api.banners.finalizePayment);

    const banner = allBanners?.find(b => b._id === bannerId);
    const pkg = useQuery(api.banners.getPackages)?.find(p => p._id === banner?.packageId);

    const handlePayNow = async () => {
        if (!bannerId) return;
        setIsPaying(true);
        setPaymentStatus('processing');

        // Simulate network delay for "Gateway" processing
        await new Promise(resolve => setTimeout(resolve, 2500));

        try {
            await finalizePayment({ id: bannerId });
            setPaymentStatus('success');

            // Redirect back to advertise page after a short delay showing success
            setTimeout(() => {
                router.push('/advertise?success=true');
            }, 2000);
        } catch (err) {
            console.error("Payment finalization failed:", err);
            setPaymentStatus('idle');
            setIsPaying(false);
            alert("Payment failed. Please try again.");
        }
    };

    if (!bannerId) {
        return (
            <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', background: '#fff', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', maxWidth: '400px' }}>
                    <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '20px' }} />
                    <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '12px' }}>Session Expired</h2>
                    <p style={{ color: '#64748b', marginBottom: '24px' }}>We couldn't find your advertisement request. Please try again from the advertise page.</p>
                    <Link href="/advertise" style={{ display: 'block', width: '100%', padding: '14px', background: '#111827', color: '#fff', borderRadius: '12px', textDecoration: 'none', fontWeight: 700 }}>Back to Advertise</Link>
                </div>
            </div>
        );
    }

    if (!banner || !pkg) {
        return <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Secure Portal...</div>;
    }

    return (
        <div style={{ maxWidth: '500px', margin: '40px auto', padding: '0 20px' }}>
            <div style={{ background: '#fff', borderRadius: '32px', border: '1px solid #e2e8f0', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                {/* Brand Header */}
                <div style={{ background: 'linear-gradient(135deg, #f84464 0%, #c026d3 100%)', padding: '40px 24px', textAlign: 'center', color: '#fff' }}>
                    <div style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', backdropFilter: 'blur(10px)' }}>
                        <CreditCard size={32} color="#fff" />
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>Secure Advertise Payment</h1>
                    <p style={{ margin: 0, fontSize: '14px', opacity: 0.9, fontWeight: 500 }}>Billed to: {banner.firstName} {banner.lastName}</p>
                </div>

                {/* Summary Section */}
                <div style={{ padding: '32px' }}>
                    <div style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Order Summary</h2>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <span style={{ color: '#475569', fontSize: '16px', fontWeight: 500 }}>{pkg.name} Hero Banner Package</span>
                            <span style={{ fontWeight: 700, color: '#111827' }}>₹{pkg.price.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <span style={{ color: '#475569', fontSize: '14px' }}>Duration</span>
                            <span style={{ fontWeight: 600, color: '#64748b', fontSize: '14px' }}>{pkg.durationDays} Days</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '20px', borderTop: '1px solid #f1f5f9', marginTop: '10px' }}>
                            <span style={{ fontWeight: 800, color: '#111827', fontSize: '18px' }}>Total Amount</span>
                            <span style={{ fontWeight: 900, color: '#f84464', fontSize: '22px' }}>₹{pkg.price.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Interactive States */}
                    {paymentStatus === 'idle' && (
                        <button
                            onClick={handlePayNow}
                            disabled={isPaying}
                            style={{
                                width: '100%',
                                padding: '18px',
                                background: '#111',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '16px',
                                fontSize: '16px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px'
                            }}
                        >
                            <ShieldCheck size={20} />
                            {isPaying ? "Connecting..." : "Pay Now with Secure Gateway"}
                        </button>
                    )}

                    {paymentStatus === 'processing' && (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <div className="gateway-spinner" style={{
                                width: '40px', height: '40px',
                                border: '4px solid #f1f5f9',
                                borderTopColor: '#f84464',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto 20px'
                            }}></div>
                            <p style={{ fontWeight: 700, color: '#111', margin: 0 }}>Redirecting to Payment Provider...</p>
                            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>Please do not refresh or close this window.</p>
                            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                        </div>
                    )}

                    {paymentStatus === 'success' && (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <div style={{
                                width: '60px', height: '60px',
                                background: '#f0fdf4',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px'
                            }}>
                                <CheckCircle2 size={40} color="#22c55e" />
                            </div>
                            <p style={{ fontWeight: 900, color: '#15803d', fontSize: '20px', margin: 0 }}>Payment Captured!</p>
                            <p style={{ fontSize: '14px', color: '#166534', marginTop: '8px' }}>Success! Redirecting back to your dashboard.</p>
                        </div>
                    )}

                    <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center', gap: '24px', opacity: 0.5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700 }}>
                            <ShieldCheck size={14} /> 256-BIT SSL
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700 }}>
                            <ShieldCheck size={14} /> PCI-DSS READY
                        </div>
                    </div>
                </div>
            </div>

            <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: '#94a3b8', lineHeight: 1.6 }}>
                By clicking Pay Now, you agree to our Advertising Terms. This is a simulated checkout page provided for testing the end-to-end integration.
            </p>
        </div>
    );
}

export default function AdvertisePaymentPage() {
    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'var(--font-body)' }}>
            <Navbar />
            <Suspense fallback={<div>Initializing Payment Portal...</div>}>
                <PaymentContent />
            </Suspense>
        </div>
    );
}
