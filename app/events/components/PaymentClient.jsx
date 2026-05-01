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

// Helper to load external scripts
const loadScript = (src) => {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

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
    
    const handleRazorpay = async () => {
        if (!bookingId) return;
        setIsPaying(true);
        setPaymentStatus('processing');

        try {
            // 1. Load Razorpay Script
            const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
            if (!res) throw new Error("Razorpay SDK failed to load.");

            // 2. Create Order
            const response = await fetch('/api/razorpay/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: bookingId,
                    amount: booking.total_price,
                    type: "booking"
                })
            });

            const order = await response.json();
            if (order.error) throw new Error(order.error);

            // 3. Open Razorpay Checkout
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: "BookMyTicket",
                description: `Payment for ${booking.event_name}`,
                image: "/logo.png",
                order_id: order.id,
                handler: async function (response) {
                    // 4. Verify Payment
                    const verifyRes = await fetch('/api/razorpay/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            id: bookingId,
                            type: "booking"
                        })
                    });

                    const verifyData = await verifyRes.json();
                    if (verifyData.success) {
                        setPaymentStatus('success');
                        setTimeout(() => {
                            router.push(`/events/book/success?bookingId=${bookingId}&id=${eventId}`);
                        }, 1500);
                    } else {
                        throw new Error(verifyData.error || "Verification failed");
                    }
                },
                prefill: {
                    name: booking.customer_details?.name || "",
                    email: booking.customer_details?.email || "",
                    contact: booking.customer_details?.phone || ""
                },
                theme: {
                    color: "#111827"
                },
                modal: {
                    ondismiss: function() {
                        setIsPaying(false);
                        setPaymentStatus('idle');
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            console.error("Razorpay Error:", err);
            setPaymentStatus('fail');
            setIsPaying(false);
            alert("Payment failed: " + err.message);
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
        <div style={{ 
            height: '100vh', 
            background: '#fdfbf7', 
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'inherit',
            position: 'relative',
            overflow: 'hidden',
            color: '#111827'
        }}>
            {/* Dynamic Mesh Background */}
            <div style={{ 
                position: 'absolute', 
                top: 0, left: 0, right: 0, bottom: 0, 
                zIndex: 0,
                background: `
                    radial-gradient(at 0% 0%, rgba(255, 28, 247, 0.05) 0px, transparent 50%),
                    radial-gradient(at 100% 0%, rgba(0, 224, 255, 0.05) 0px, transparent 50%),
                    radial-gradient(at 100% 100%, rgba(255, 28, 247, 0.05) 0px, transparent 50%),
                    radial-gradient(at 0% 100%, rgba(0, 224, 255, 0.05) 0px, transparent 50%)
                `,
                filter: 'blur(80px)',
                animation: 'meshMove 15s ease-in-out infinite alternate'
            }}></div>

            {/* Header / Navbar style */}
            <div style={{ 
                height: '80px',
                padding: '0 40px', 
                borderBottom: '1px solid rgba(0, 0, 0, 0.03)', 
                display: 'flex', 
                alignItems: 'center',
                gap: '32px',
                zIndex: 1000,
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(20px)',
                flexShrink: 0,
                position: 'relative'
            }}>
                <button 
                    onClick={() => router.push('/')}
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px', 
                        color: '#111827', 
                        background: '#fff',
                        border: '1px solid rgba(0,0,0,0.08)',
                        padding: '10px 20px',
                        borderRadius: '14px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 700,
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.transform = 'translateX(-4px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.06)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)'; }}
                >
                    <ArrowLeft size={18} />
                    Back
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ 
                        width: '42px', 
                        height: '42px', 
                        background: 'linear-gradient(135deg, #FF1CF7 0%, #b249f8 100%)', 
                        borderRadius: '14px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        boxShadow: '0 8px 20px rgba(255, 28, 247, 0.2)',
                        animation: 'pulse 2s infinite'
                    }}>
                        <CreditCard size={22} color="#fff" />
                    </div>
                    <div>
                        <h1 className="shimmer-text" style={{ fontSize: '20px', fontWeight: 900, color: '#111827', margin: 0, letterSpacing: '-0.03em' }}>Secure Checkout</h1>
                        <p style={{ fontSize: '11px', color: '#64748b', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Booking Ref: <span style={{ color: '#b249f8' }}>#{bookingId.slice(-6).toUpperCase()}</span></p>
                    </div>
                </div>
            </div>

            <div style={{ 
                flex: 1, 
                display: 'grid', 
                gridTemplateColumns: '1fr 420px',
                zIndex: 10,
                position: 'relative',
                minHeight: 0
            }}>
                {/* Main Payment Section */}
                <div style={{ padding: '60px 80px', overflowY: 'auto' }}>
                    <div style={{ maxWidth: '600px' }}>
                        <div style={{ marginBottom: '48px' }}>
                            <h2 style={{ fontSize: '42px', fontWeight: 900, color: '#111827', marginBottom: '12px', letterSpacing: '-0.04em', lineHeight: '1.1' }}>Complete Your Payment</h2>
                            <p style={{ color: '#64748b', fontSize: '18px', fontWeight: 500 }}>Select your preferred payment method to secure your tickets.</p>
                        </div>

                        {paymentStatus === 'processing' && (
                            <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.1)', padding: '32px', borderRadius: '28px', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '24px', backdropFilter: 'blur(10px)' }}>
                                <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                <p style={{ margin: 0, fontSize: '18px', color: '#1e40af', fontWeight: 700 }}>Processing Transaction...</p>
                            </div>
                        )}

                        {paymentStatus === 'success' && (
                            <div style={{ background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.1)', padding: '32px', borderRadius: '28px', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '24px', backdropFilter: 'blur(10px)' }}>
                                <ShieldCheck size={48} color="#22c55e" />
                                <p style={{ margin: 0, fontSize: '18px', color: '#15803d', fontWeight: 800 }}>Payment Confirmed!</p>
                            </div>
                        )}

                        {paymentStatus === 'idle' || paymentStatus === 'fail' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {/* PayPal Gateway */}
                                {paypalClientId && (
                                    <div style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)', background: '#fff', padding: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                                        <PayPalScriptProvider options={{ "client-id": paypalClientId, currency: "USD" }}>
                                            <PayPalButtons
                                                style={{ layout: "vertical", shape: "rect", height: 60 }}
                                                createOrder={(data, actions) => {
                                                    return actions.order.create({
                                                        purchase_units: [{ amount: { value: (booking.total_price || 0).toFixed(2) } }],
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
                                                            setTimeout(() => router.push(`/events/book/success?bookingId=${bookingId}&id=${eventId}`), 1500);
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
                                    </div>
                                )}

                                {/* Razorpay Gateway */}
                                {gateways?.find(g => g.name === "Razorpay" && g.is_enabled) && (
                                    <button
                                        onClick={handleRazorpay}
                                        className="glossy-button"
                                        style={{ 
                                            width: '100%', 
                                            padding: '24px', 
                                            background: 'linear-gradient(135deg, #FF1CF7 0%, #b249f8 100%)', 
                                            color: '#fff', 
                                            border: 'none', 
                                            borderRadius: '24px', 
                                            fontSize: '18px', 
                                            fontWeight: 900, 
                                            cursor: 'pointer', 
                                            boxShadow: '0 15px 35px rgba(255, 28, 247, 0.25)', 
                                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.1em',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '16px',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}
                                        disabled={isPaying}
                                        onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 20px 45px rgba(255, 28, 247, 0.35)'; }}
                                        onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 15px 35px rgba(255, 28, 247, 0.25)'; }}
                                    >
                                        <img src="https://razorpay.com/favicon.png" style={{ width: '24px', height: '24px', filter: 'brightness(0) invert(1)' }} alt="" />
                                        Pay with Razorpay
                                    </button>
                                )}

                                {/* Cashfree Gateway */}
                                {gateways?.find(g => g.name === "Cashfree" && g.is_enabled) && (
                                    <button
                                        onClick={handleCashfree}
                                        style={{ 
                                            width: '100%', 
                                            padding: '22px', 
                                            background: '#fff', 
                                            color: '#111827', 
                                            border: '1px solid rgba(0,0,0,0.08)', 
                                            borderRadius: '24px', 
                                            fontSize: '17px', 
                                            fontWeight: 800, 
                                            cursor: 'pointer', 
                                            transition: 'all 0.4s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '16px',
                                            boxShadow: '0 8px 20px rgba(0,0,0,0.02)'
                                        }}
                                        disabled={isPaying || !cashfree}
                                        onMouseOver={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)'; }}
                                        onMouseOut={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'; }}
                                    >
                                        <div style={{ width: '26px', height: '26px', background: '#fff', borderRadius: '8px', padding: '4px', border: '1px solid rgba(0,0,0,0.05)' }}>
                                            <img src="https://www.cashfree.com/favicon.ico" style={{ width: '100%', height: '100%' }} alt="" />
                                        </div>
                                        Pay with Cashfree
                                    </button>
                                )}

                                {/* No Gateways Warning */}
                                {!paypalClientId && 
                                 !gateways?.find(g => g.name === "Razorpay" && g.is_enabled) && 
                                 !gateways?.find(g => g.name === "Cashfree" && g.is_enabled) && (
                                    <div style={{ padding: '40px', background: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239, 68, 68, 0.08)', borderRadius: '32px', textAlign: 'center', backdropFilter: 'blur(10px)' }}>
                                        <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '20px', margin: '0 auto', animation: 'bounce 2s infinite' }} />
                                        <p style={{ margin: 0, fontSize: '18px', color: '#991b1b', fontWeight: 900, letterSpacing: '-0.02em' }}>
                                            No Active Gateways
                                        </p>
                                        <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#ef4444', fontWeight: 600 }}>
                                            Please contact support to complete your booking.
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : null}

                        <div style={{ marginTop: '60px', display: 'flex', gap: '40px', opacity: 0.6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <ShieldCheck size={18} color="#22c55e" />
                                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 800, letterSpacing: '0.05em' }}>SSL SECURE</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <CreditCard size={18} color="#b249f8" />
                                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 800, letterSpacing: '0.05em' }}>PCI COMPLIANT</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Order Summary */}
                <div style={{ 
                    background: 'rgba(252, 249, 242, 0.6)', 
                    padding: '40px 48px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    overflowY: 'hidden',
                    borderLeft: '1px solid rgba(0,0,0,0.03)',
                    backdropFilter: 'blur(30px)'
                }}>
                    <h3 style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.25em', marginBottom: '32px' }}>Transaction Overview</h3>
                    
                    <div style={{ marginBottom: '32px', position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '-20px', top: '0', bottom: '0', width: '4px', background: 'linear-gradient(to bottom, #FF1CF7, #b249f8)', borderRadius: '2px' }}></div>
                        <p style={{ fontSize: '22px', fontWeight: 900, color: '#111827', margin: '0 0 6px 0', letterSpacing: '-0.03em' }}>{booking.event_name || 'Event Ticket'}</p>
                        <p style={{ fontSize: '14px', color: '#64748b', margin: 0, fontWeight: 600 }}>{booking.ticket_count}x Official Registration</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '15px', fontWeight: 600 }}>
                            <span>Standard Rate</span>
                            <span>₹{(booking?.base_amount || 0).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '15px', fontWeight: 600 }}>
                            <span>Platform Fee</span>
                            <span>₹{(booking?.platform_charge || 0).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '15px', fontWeight: 600 }}>
                            <span>GST ({booking?.gst_percent || 0}%)</span>
                            <span>₹{(booking?.gst_amount || 0).toFixed(2)}</span>
                        </div>
                    </div>

                    <div style={{ 
                        padding: '32px 0', 
                        borderTop: '2px dashed rgba(0,0,0,0.06)', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'baseline',
                        marginTop: 'auto'
                    }}>
                        <span style={{ fontSize: '17px', fontWeight: 800, color: '#111827' }}>Total Payable</span>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '36px', fontWeight: 900, color: '#111827', letterSpacing: '-0.04em' }}>₹{(booking.total_price || 0).toFixed(2)}</span>
                            <p style={{ fontSize: '11px', color: '#FF1CF7', margin: '2px 0 0', fontWeight: 900, letterSpacing: '0.1em' }}>INR</p>
                        </div>
                    </div>

                    <div style={{ paddingTop: '24px' }}>
                        <p style={{ fontSize: '10px', color: '#94a3b8', lineHeight: '1.7', fontWeight: 600 }}>
                            Secure encrypted transaction powered by global standards. By proceeding, you agree to our terms and conditions.
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
                @keyframes meshMove { 
                    0% { transform: translate(0, 0) scale(1); }
                    100% { transform: translate(20px, 20px) scale(1.1); }
                }
                @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                .shimmer-text {
                    background: linear-gradient(90deg, #111827 0%, #4b5563 50%, #111827 100%);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: shimmer 3s linear infinite;
                }
                @keyframes shimmer { to { background-position: 200% center; } }
                .glossy-button::after {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: linear-gradient(45deg, transparent, rgba(255,255,255,0.2), transparent);
                    transform: rotate(45deg);
                    animation: glossy 3s infinite;
                }
                @keyframes glossy { 0% { left: -100%; } 100% { left: 100%; } }
                body { margin: 0; padding: 0; overflow: hidden; background: #fdfbf7; }
            `}</style>
        </div>
    );
}





