"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSupabaseQuery } from '@/hooks/useSupabase';
import { supabase } from '@/lib/supabase';
import { CreditCard, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { triggerNotification } from "@/lib/notificationHelper";
import { load } from "@cashfreepayments/cashfree-js";

export default function PaymentClient({ id: eventId, bookingId: propBookingId }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const bookingId = propBookingId || searchParams.get('bookingId');
    const [isPaying, setIsPaying] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, processing, success, fail
    const [paypalClientId, setPaypalClientId] = useState("");
    const [cashfree, setCashfree] = useState(null);

    const { data: booking } = useSupabaseQuery('bookings', (q) => 
        q.eq('id', bookingId).single(),
        [bookingId],
        { enabled: !!bookingId }
    );
    const { data: gateways } = useSupabaseQuery('payment_gateways', (q) => q, []);

    useEffect(() => {
        // Handle return from Cashfree
        const status = searchParams.get('status');
        if (status === 'PAID' || status === 'SUCCESS') {
            setPaymentStatus('success');
            setTimeout(() => {
                router.push(`/events/book/success?bookingId=${bookingId}&id=${eventId}`);
            }, 1500);
        } else if (status === 'FAILED') {
            setPaymentStatus('fail');
            triggerNotification({
                type: "ERROR",
                data: { message: "Payment was declined by your bank." }
            });
        }

        if (gateways) {
            const paypalConfig = gateways.find(g => g.name === "PayPal" && g.is_enabled);
            if (paypalConfig && paypalConfig.config && paypalConfig.config.apiKey) {
                setPaypalClientId(paypalConfig.config.apiKey);
            }
        }
        
        // Initialize Cashfree
        const initCashfree = async () => {
            const cf = await load({
                mode: process.env.NEXT_PUBLIC_CASHFREE_ENV === "PRODUCTION" ? "production" : "sandbox"
            });
            setCashfree(cf);
        };
        initCashfree();
    }, [gateways]);

    const handleCashfree = async () => {
        if (!bookingId || !cashfree) return;
        setIsPaying(true);
        setPaymentStatus('processing');

        try {
            // 1. Create Order via API
            const response = await fetch('/api/cashfree/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId,
                    amount: booking.total_price,
                    customerName: booking.customer_details?.name || 'Customer',
                    customerEmail: booking.customer_details?.email || 'customer@example.com',
                    customerPhone: booking.customer_details?.phone || '9999999999',
                    eventName: booking.event_name
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.details || data.error);

            // 2. Open Cashfree Checkout in Modal for better UX
            const checkoutOptions = {
                paymentSessionId: data.payment_session_id,
                redirectTarget: "_modal", 
            };

            console.log("Opening Cashfree checkout...");
            await cashfree.checkout(checkoutOptions).then((result) => {
                if (result.error) {
                    throw new Error(result.error.message);
                }
                if (result.redirect) {
                    console.log("Redirecting to payment page...");
                }
            });
            
        } catch (err) {
            console.error("Cashfree Payment Error:", err);
            setPaymentStatus('fail');
            setIsPaying(false);
            alert("Payment Initialization Failed: " + err.message);
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
                <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', fontSize: '14px', marginBottom: '24px', fontWeight: 600 }}>
                    <ArrowLeft size={16} /> Cancel & Exit
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
                                <span style={{ color: '#475569', fontSize: '15px' }}>{booking.event_name || 'Event'} (x{booking.ticket_count})</span>
                                <span style={{ fontWeight: 700, color: '#111827' }}>₹{(booking.total_price || 0).toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                                <span style={{ fontWeight: 800, color: '#111827', fontSize: '18px' }}>Total Amount</span>
                                <span style={{ fontWeight: 900, color: '#111827', fontSize: '20px' }}>₹{(booking.total_price || 0).toFixed(2)}</span>
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
                                                    const { error } = await supabase
                                                        .from('bookings')
                                                        .update({ status: 'Confirmed' })
                                                        .eq('id', bookingId);
                                                    if (error) throw error;

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
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <button
                                        onClick={handleCashfree}
                                        style={{ 
                                            width: '100%', 
                                            padding: '18px', 
                                            background: '#111827', 
                                            color: '#fff', 
                                            border: 'none', 
                                            borderRadius: '16px', 
                                            fontSize: '15px', 
                                            fontWeight: 900, 
                                            cursor: 'pointer', 
                                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)', 
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '10px'
                                        }}
                                        disabled={isPaying || !cashfree}
                                    >
                                        Pay with Cashfree
                                    </button>
                                    
                                    <div style={{ textAlign: 'center', marginTop: '12px' }}>
                                        <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Supported Methods</p>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '8px', opacity: 0.6 }}>
                                            <span style={{ fontSize: '10px', fontWeight: 800 }}>UPI</span>
                                            <span style={{ fontSize: '10px', fontWeight: 800 }}>CARDS</span>
                                            <span style={{ fontSize: '10px', fontWeight: 800 }}>NETBANKING</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        ) : null}
                    </div>
                </div>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
