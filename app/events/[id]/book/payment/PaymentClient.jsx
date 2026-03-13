"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { CreditCard, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

export default function PaymentClient({ eventId }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const bookingId = searchParams.get('bookingId');
    const [isPaying, setIsPaying] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, processing, success, fail
    const [paypalClientId, setPaypalClientId] = useState("");

    const booking = useQuery(api.bookings.getBookingById, bookingId ? { id: bookingId } : "skip");
    const confirmBooking = useMutation(api.bookings.confirmBooking);
    const gateways = useQuery(api.paymentGateways.list);

    useEffect(() => {
        if (gateways) {
            const paypalConfig = gateways.find(g => g.name === "PayPal" && g.isEnabled);
            if (paypalConfig && paypalConfig.config && paypalConfig.config.apiKey) {
                setPaypalClientId(paypalConfig.config.apiKey);
            }
        }
    }, [gateways]);

    const handleSimulatedPayNow = async () => {
        if (!bookingId) return;
        setIsPaying(true);
        setPaymentStatus('processing');

        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            await confirmBooking({ id: bookingId });
            setPaymentStatus('success');
            setTimeout(() => {
                router.push(`/events/${eventId}/book/checkout?bookingId=${bookingId}&success=true`);
            }, 1500);
        } catch (err) {
            console.error("Payment confirmation failed:", err);
            setPaymentStatus('fail');
            setIsPaying(false);
        }
    };

    if (!bookingId) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '20px' }}>
                <div style={{ textAlign: 'center', background: '#fff', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', maxWidth: '400px' }}>
                    <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '20px' }} />
                    <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '12px' }}>Invalid Session</h2>
                    <p style={{ color: '#64748b', marginBottom: '24px' }}>No booking information found. Please start your booking again from the event page.</p>
                    <Link href="/" style={{ display: 'block', width: '100%', padding: '14px', background: '#111827', color: '#fff', borderRadius: '12px', textDecoration: 'none', fontWeight: 700 }}>Back to Home</Link>
                </div>
            </div>
        );
    }

    if (!booking && bookingId) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading payment details...</div>;
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', paddingTop: '100px', paddingBottom: '60px' }}>
            <div style={{ maxWidth: '500px', margin: '0 auto', padding: '0 20px' }}>
                <Link href={`/events/${eventId}/book/checkout`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', fontSize: '14px', marginBottom: '24px', fontWeight: 600 }}>
                    <ArrowLeft size={16} /> Back to Checkout
                </Link>

                <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
                    <div style={{ background: '#111827', padding: '32px 24px', textAlign: 'center', color: '#fff' }}>
                        <div style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <CreditCard size={32} color="#fff" />
                        </div>
                        <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0' }}>Secure Checkout</h1>
                        <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>Booking ID: #{bookingId.slice(-6).toUpperCase()}</p>
                    </div>

                    <div style={{ padding: '24px' }}>
                        <div style={{ marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Payment Summary</h2>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ color: '#475569', fontSize: '15px' }}>{booking.eventName} (x{booking.ticketCount})</span>
                                <span style={{ fontWeight: 700, color: '#111827' }}>₹{booking.totalPrice.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                                <span style={{ fontWeight: 800, color: '#111827', fontSize: '18px' }}>Total Amount</span>
                                <span style={{ fontWeight: 900, color: '#111827', fontSize: '20px' }}>₹{booking.totalPrice.toFixed(2)}</span>
                            </div>
                        </div>

                        {paymentStatus === 'processing' && (
                            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '16px', borderRadius: '12px', marginBottom: '24px', textAlign: 'center' }}>
                                <div className="spinner" style={{ width: '24px', height: '24px', border: '3px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}></div>
                                <p style={{ margin: 0, fontSize: '14px', color: '#1e40af', fontWeight: 600 }}>Processing your payment securely...</p>
                            </div>
                        )}

                        {paymentStatus === 'success' && (
                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '16px', borderRadius: '12px', marginBottom: '24px', textAlign: 'center' }}>
                                <ShieldCheck size={32} color="#22c55e" style={{ marginBottom: '8px' }} />
                                <p style={{ margin: 0, fontSize: '14px', color: '#15803d', fontWeight: 700 }}>Payment Successful!</p>
                            </div>
                        )}

                        {paymentStatus === 'idle' || paymentStatus === 'fail' ? (
                            paypalClientId ? (
                                <PayPalScriptProvider options={{ "client-id": paypalClientId, currency: "USD" }}>
                                    <PayPalButtons
                                        style={{ layout: "vertical" }}
                                        createOrder={(data, actions) => {
                                            return actions.order.create({
                                                purchase_units: [{ amount: { value: booking.totalPrice.toFixed(2) } }],
                                            });
                                        }}
                                        onApprove={async (data, actions) => {
                                            setIsPaying(true);
                                            setPaymentStatus('processing');
                                            try {
                                                const details = await actions.order.capture();
                                                if (details.status === "COMPLETED") {
                                                    await confirmBooking({ id: bookingId });
                                                    setPaymentStatus('success');
                                                    setTimeout(() => router.push(`/events/${eventId}/book/checkout?bookingId=${bookingId}&success=true`), 1500);
                                                } else {
                                                    setPaymentStatus('fail');
                                                }
                                            } catch (error) {
                                                setPaymentStatus('fail');
                                            } finally {
                                                setIsPaying(false);
                                            }
                                        }}
                                        onError={() => setPaymentStatus('fail')}
                                    />
                                </PayPalScriptProvider>
                            ) : (
                                <button
                                    onClick={handleSimulatedPayNow}
                                    style={{ width: '100%', padding: '16px', background: '#F43F5E', color: '#fff', border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 20px rgba(244, 63, 94, 0.25)', transition: 'all 0.2s' }}
                                    disabled={isPaying}
                                >
                                    Pay Now (Simulated Fallback)
                                </button>
                            )
                        ) : null}
                    </div>
                </div>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
