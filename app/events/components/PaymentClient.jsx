"use client";
import Footer from "@/components/Footer";

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
    const [event, setEvent] = useState(null);

    useEffect(() => {
        if (!eventId) return;
        fetch(`/api/events/detail?id=${eventId}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch event');
                return res.json();
            })
            .then(data => {
                setEvent(data);
            })
            .catch(err => {
                console.error('Error fetching event details:', err);
            });
    }, [eventId]);
    const [gateways, setGateways] = useState([]);

    useEffect(() => {
        fetch('/api/payment/gateways')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch payment gateways');
                return res.json();
            })
            .then(data => {
                setGateways(data);
            })
            .catch(err => {
                console.error('Error fetching payment gateways:', err);
            });
    }, []);

    useEffect(() => {
        if (!bookingId) return;

        // Real-time subscription to detect payment status changes via webhooks
        const channel = supabase
            .channel(`booking_status_${bookingId}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `id=eq.${bookingId}` },
                (payload) => {
                    const newStatus = payload.new.status;
                    const paymentStatus = payload.new.payment_status;
                    if (newStatus === 'Confirmed' || paymentStatus === 'paid' || paymentStatus === 'SUCCESS') {
                        setPaymentStatus('success');
                        setTimeout(() => {
                            router.push(`/events/book/success?bookingId=${bookingId}&id=${eventId}`);
                        }, 1500);
                    }
                }
            )
            .subscribe();

        // Handle return from Cashfree via URL parameters (fallback)
        const status = searchParams.get('status');
        if (status === 'PAID' || status === 'SUCCESS') {
            setPaymentStatus('success');
            setTimeout(() => {
                router.push(`/events/book/success?bookingId=${bookingId}&id=${eventId}`);
            }, 1500);
        } else if (status === 'FAILED') {
            setPaymentStatus('fail');
            setIsPaying(false);
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

        return () => {
            supabase.removeChannel(channel);
        };
    }, [bookingId, gateways, searchParams]);

    const sessionToken = searchParams.get('sessionToken');

    const handleCashfree = async () => {
        if (!bookingId || !cashfree) return;
        setIsPaying(true);
        setPaymentStatus('processing');

        try {
            let paymentSessionId = "";
            let cfOrderId = "";

            if (sessionToken) {
                // 1. Create Gateway Order via Booking Session API
                const response = await fetch('/api/booking-session/create-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionToken,
                        gateway: "Cashfree"
                    })
                });

                const data = await response.json();
                if (!response.ok || !data.success) {
                    throw new Error(data.error || "Cashfree order creation failed");
                }
                paymentSessionId = data.payment_session_id;
                cfOrderId = data.cfOrderId || bookingId;
            } else {
                // Legacy non-session flow
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
                paymentSessionId = data.payment_session_id;
                cfOrderId = bookingId;
            }

            // 2. Open Cashfree Checkout in Modal
            const checkoutOptions = {
                paymentSessionId: paymentSessionId,
                redirectTarget: "_modal", 
            };

            console.log("Opening Cashfree checkout...");
            await cashfree.checkout(checkoutOptions).then(async (result) => {
                if (result.error) {
                    throw new Error(result.error.message);
                }
                
                // For modal redirect, handle success
                if (sessionToken) {
                    const verifyRes = await fetch('/api/booking-session/verify-payment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            sessionToken,
                            gateway: "Cashfree",
                            cashfree_order_id: cfOrderId,
                            cashfree_status: "SUCCESS"
                        })
                    });
                    const verifyData = await verifyRes.json();
                    if (verifyRes.ok && verifyData.success) {
                        setPaymentStatus('success');
                        setTimeout(() => {
                            router.push(`/events/book/success?bookingId=${bookingId}&id=${eventId}&sessionToken=${sessionToken}`);
                        }, 1500);
                    }
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
            const resScript = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
            if (!resScript) throw new Error("Razorpay SDK failed to load.");

            let key_id = "";
            let order = null;

            if (sessionToken) {
                // Create Gateway Order via Booking Session API
                const response = await fetch('/api/booking-session/create-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionToken,
                        gateway: "Razorpay"
                    })
                });

                const data = await response.json();
                if (!response.ok || !data.success) {
                    throw new Error(data.error || "Razorpay order creation failed");
                }
                order = data.order;
                key_id = data.keyId;
            } else {
                // Legacy non-session flow
                const response = await fetch('/api/razorpay/create-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: bookingId,
                        amount: booking.total_price,
                        type: "booking"
                    })
                });

                order = await response.json();
                if (order.error) throw new Error(order.error);

                const rzpConfig = gateways?.find(g => g.name === "Razorpay")?.config;
                key_id = rzpConfig?.keyId || rzpConfig?.apiKey || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
            }

            if (!key_id) throw new Error("Razorpay Key ID is not configured. Please add it to Vercel or your Admin panel.");

            const options = {
                key: key_id,
                amount: order.amount,
                currency: order.currency,
                name: "BookMyTicket",
                description: `Payment for ${booking.event_name || event?.title}`,
                image: "/logo.png",
                order_id: order.id,
                handler: async function (response) {
                    try {
                        // 4. Verify Payment
                        if (sessionToken) {
                            const verifyRes = await fetch('/api/booking-session/verify-payment', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    sessionToken,
                                    gateway: "Razorpay",
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature
                                })
                            });

                            const verifyData = await verifyRes.json();
                            if (verifyData.success) {
                                setPaymentStatus('success');
                                setTimeout(() => {
                                    router.push(`/events/book/success?bookingId=${bookingId}&id=${eventId}&sessionToken=${sessionToken}`);
                                }, 1500);
                            } else {
                                throw new Error(verifyData.error || "Verification failed");
                            }
                        } else {
                            // Legacy verification
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
                        }
                    } catch (verifyErr) {
                        console.error("Verification Error:", verifyErr);
                        setPaymentStatus('fail');
                        setIsPaying(false);
                        alert("Payment verification failed: " + verifyErr.message);
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

            console.log("RAZORPAY OPTIONS:", options);
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
            background: '#FAF9F6', 
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'inherit',
            position: 'relative',
            overflow: 'hidden',
            color: '#111827'
        }}>
            {/* Premium Mesh Background */}
            <div style={{ 
                position: 'absolute', 
                top: 0, left: 0, right: 0, bottom: 0, 
                zIndex: 0,
                background: `
                    radial-gradient(at 0% 0%, rgba(255, 28, 247, 0.03) 0px, transparent 50%),
                    radial-gradient(at 100% 0%, rgba(0, 224, 255, 0.03) 0px, transparent 50%),
                    radial-gradient(at 100% 100%, rgba(255, 28, 247, 0.03) 0px, transparent 50%)
                `,
                filter: 'blur(100px)',
            }}></div>

            {/* Header / Navbar style */}
            <div style={{ 
                height: '70px',
                padding: '0 32px', 
                borderBottom: '1px solid rgba(0, 0, 0, 0.04)', 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 1000,
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(20px)',
                flexShrink: 0,
                position: 'relative'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button 
                        onClick={() => router.back()}
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px', 
                            color: '#475569', 
                            background: '#fff',
                            border: '1px solid rgba(0,0,0,0.06)',
                            padding: '8px 16px',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 700,
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.transform = 'translateX(-2px)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateX(0)'; }}
                    >
                        <ArrowLeft size={16} />
                        Back
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                            width: '36px', 
                            height: '36px', 
                            background: 'linear-gradient(135deg, #FF1CF7 0%, #b249f8 100%)', 
                            borderRadius: '10px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(255, 28, 247, 0.15)',
                        }}>
                            <CreditCard size={18} color="#fff" />
                        </div>
                        <div>
                            <h1 className="shimmer-text" style={{ fontSize: '16px', fontWeight: 900, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>Secure Checkout</h1>
                            <p style={{ fontSize: '9px', color: '#64748b', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ref: <span style={{ color: '#b249f8' }}>#{bookingId.slice(-6).toUpperCase()}</span></p>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.8 }}>
                    <ShieldCheck size={16} color="#22c55e" />
                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, letterSpacing: '0.05em' }}>SECURE 256-BIT SSL</span>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:grid lg:grid-cols-[1fr_400px] z-10 relative min-h-0 overflow-y-auto lg:overflow-y-hidden">
                {/* Main Payment Section */}
                <div className="p-6 lg:p-[48px_64px] overflow-y-visible lg:overflow-y-auto flex flex-col justify-center">
                    <div style={{ maxWidth: '560px', margin: '0 auto', width: '100%' }}>
                        <div style={{ marginBottom: '32px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 900, color: '#FF1CF7', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Payment Gateway</span>
                            <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#111827', marginTop: '4px', marginBottom: '8px', letterSpacing: '-0.03em', lineHeight: '1.2' }}>Complete Your Payment</h2>
                            <p style={{ color: '#64748b', fontSize: '15px', fontWeight: 500 }}>Choose your payment option below to secure your event pass.</p>
                        </div>

                        {/* Interactive Payment Card */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.8)',
                            border: '1px solid rgba(0, 0, 0, 0.05)',
                            borderRadius: '24px',
                            padding: '32px',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.03)',
                            backdropFilter: 'blur(20px)',
                            marginBottom: '32px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', borderBottom: '1px solid rgba(0,0,0,0.05)', marginBottom: '24px' }}>
                                <span style={{ fontSize: '14px', fontWeight: 700, color: '#64748b' }}>TOTAL AMOUNT DUE</span>
                                <span style={{ fontSize: '28px', fontWeight: 900, color: '#111827', letterSpacing: '-0.02em' }}>₹{(booking?.total_price || 0).toFixed(2)}</span>
                            </div>

                            {paymentStatus === 'processing' && (
                                <div style={{ background: 'rgba(59, 130, 246, 0.04)', border: '1px solid rgba(59, 130, 246, 0.08)', padding: '24px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div className="spinner" style={{ width: '28px', height: '28px', border: '3px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '15px', color: '#1e40af', fontWeight: 800 }}>Initializing Transaction...</p>
                                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#3b82f6', fontWeight: 600 }}>Please do not close this window</p>
                                    </div>
                                </div>
                            )}

                            {paymentStatus === 'success' && (
                                <div style={{ background: 'rgba(34, 197, 94, 0.04)', border: '1px solid rgba(34, 197, 94, 0.08)', padding: '24px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <ShieldCheck size={36} color="#22c55e" />
                                    <div>
                                        <p style={{ margin: 0, fontSize: '16px', color: '#15803d', fontWeight: 800 }}>Payment Successful!</p>
                                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#22c55e', fontWeight: 600 }}>Redirecting to confirmation...</p>
                                    </div>
                                </div>
                            )}

                            {(paymentStatus === 'idle' || paymentStatus === 'fail') && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {/* Razorpay Gateway */}
                                    {gateways?.find(g => g.name === "Razorpay" && g.is_enabled) && (
                                        <button
                                            onClick={handleRazorpay}
                                            className="premium-pay-button"
                                            style={{ 
                                                width: '100%', 
                                                padding: '18px 24px', 
                                                background: 'linear-gradient(135deg, #e012be 0%, #901ef0 100%)', 
                                                color: '#fff', 
                                                border: 'none', 
                                                borderRadius: '16px', 
                                                fontSize: '16px', 
                                                fontWeight: 800, 
                                                cursor: 'pointer', 
                                                boxShadow: '0 8px 25px rgba(144, 30, 240, 0.25)', 
                                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '12px',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}
                                            disabled={isPaying}
                                        >
                                            <ShieldCheck size={20} color="#fff" />
                                            <span>PROCEED TO SECURE PAYMENT</span>
                                        </button>
                                    )}

                                    {/* PayPal Gateway */}
                                    {paypalClientId && (
                                        <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)', background: '#fff', padding: '10px' }}>
                                            <PayPalScriptProvider options={{ "client-id": paypalClientId, currency: "USD" }}>
                                                <PayPalButtons
                                                    style={{ layout: "vertical", shape: "rect", height: 50 }}
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
                                                                if (sessionToken) {
                                                                    const verifyRes = await fetch('/api/booking-session/verify-payment', {
                                                                        method: 'POST',
                                                                        headers: { 'Content-Type': 'application/json' },
                                                                        body: JSON.stringify({
                                                                            sessionToken,
                                                                            gateway: "PayPal",
                                                                            paypal_order_id: details.id,
                                                                            paypal_status: details.status
                                                                        })
                                                                    });
                                                                    const verifyData = await verifyRes.json();
                                                                    if (verifyRes.ok && verifyData.success) {
                                                                        setPaymentStatus('success');
                                                                        setTimeout(() => router.push(`/events/book/success?bookingId=${bookingId}&id=${eventId}&sessionToken=${sessionToken}`), 1500);
                                                                    } else {
                                                                        throw new Error(verifyData.error || "Verification failed");
                                                                    }
                                                                } else {
                                                                    const { error } = await supabase
                                                                        .from('bookings')
                                                                        .update({ status: 'Confirmed' })
                                                                        .eq('id', bookingId);
                                                                    if (error) throw error;
                                                                    
                                                                    // Update seat_inventory for legacy paypal
                                                                    if (booking.selected_seats && booking.selected_seats.length > 0) {
                                                                        for (const seat of booking.selected_seats) {
                                                                            const seatId = seat.id;
                                                                            const { data: existingSeat } = await supabase.from('seat_inventory').select('id').eq('event_id', eventId).eq('seat_number', seatId).maybeSingle();
                                                                            if (existingSeat) {
                                                                                await supabase.from('seat_inventory').update({ status: 'sold' }).eq('id', existingSeat.id);
                                                                            } else {
                                                                                await supabase.from('seat_inventory').insert({ event_id: eventId, seat_number: seatId, status: 'sold' });
                                                                            }
                                                                        }
                                                                    }

                                                                    setPaymentStatus('success');
                                                                    setTimeout(() => router.push(`/events/book/success?bookingId=${bookingId}&id=${eventId}`), 1500);
                                                                }
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

                                    {/* Cashfree Gateway */}
                                    {gateways?.find(g => g.name === "Cashfree" && g.is_enabled) && (
                                        <button
                                            onClick={handleCashfree}
                                            style={{ 
                                                width: '100%', 
                                                padding: '16px 20px', 
                                                background: '#fff', 
                                                color: '#475569', 
                                                border: '1px solid rgba(0,0,0,0.08)', 
                                                borderRadius: '16px', 
                                                fontSize: '15px', 
                                                fontWeight: 700, 
                                                cursor: 'pointer', 
                                                transition: 'all 0.2s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '10px',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                                            }}
                                            disabled={isPaying || !cashfree}
                                            onMouseOver={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'; }}
                                            onMouseOut={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'; }}
                                        >
                                            <img src="https://www.cashfree.com/favicon.ico" style={{ width: '18px', height: '18px' }} alt="" />
                                            Pay with Cashfree
                                        </button>
                                    )}

                                    {/* No Gateways Warning */}
                                    {!paypalClientId && 
                                     !gateways?.find(g => g.name === "Razorpay" && g.is_enabled) && 
                                     !gateways?.find(g => g.name === "Cashfree" && g.is_enabled) && (
                                        <div style={{ padding: '24px', background: 'rgba(239, 68, 68, 0.02)', border: '1px solid rgba(239, 68, 68, 0.06)', borderRadius: '16px', textAlign: 'center' }}>
                                            <AlertCircle size={36} color="#ef4444" style={{ marginBottom: '12px', margin: '0 auto' }} />
                                            <p style={{ margin: 0, fontSize: '15px', color: '#991b1b', fontWeight: 800 }}>No Active Gateways</p>
                                            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#ef4444', fontWeight: 500 }}>Please contact support to complete your booking.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', opacity: 0.5 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <ShieldCheck size={14} color="#64748b" />
                                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 800 }}>SSL ENCRYPTED</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <CreditCard size={14} color="#64748b" />
                                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 800 }}>PCI COMPLIANT</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Order Summary */}
                <div className="bg-[#FFFDF9] p-6 lg:p-[40px_40px] flex flex-col border-t lg:border-t-0 lg:border-l border-black/5 backdrop-blur-md">
                    <h3 style={{ fontSize: '10px', fontWeight: 950, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '24px' }}>Transaction Overview</h3>
                    
                    {(event?.bannerPreview || event?.img) && (
                        <div style={{ width: '100%', height: '140px', borderRadius: '18px', overflow: 'hidden', marginBottom: '24px', boxShadow: '0 8px 20px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.03)' }}>
                            <img src={event.img || event.bannerPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                        </div>
                    )}

                    <div style={{ marginBottom: '24px', position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '-16px', top: '0', bottom: '0', width: '3px', background: 'linear-gradient(to bottom, #FF1CF7, #b249f8)', borderRadius: '2px' }}></div>
                        <p style={{ fontSize: '18px', fontWeight: 900, color: '#111827', margin: '0 0 4px 0', letterSpacing: '-0.02em', lineHeight: '1.3' }}>{booking.event_name || event?.title || 'Event Ticket'}</p>
                        <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: 600 }}>{booking.ticket_count}x Official Registration</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', borderBottom: '1px dashed rgba(0,0,0,0.06)', paddingBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '14px', fontWeight: 600 }}>
                            <span>Standard Rate</span>
                            <span>₹{(booking?.base_amount || 0).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '14px', fontWeight: 600 }}>
                            <span>Platform Fee</span>
                            <span>₹{(booking?.platform_charge || 0).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '14px', fontWeight: 600 }}>
                            <span>GST ({booking?.gst_percent || 0}%)</span>
                            <span>₹{(booking?.gst_amount || 0).toFixed(2)}</span>
                        </div>
                    </div>

                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'baseline',
                        marginTop: 'auto'
                    }}>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>Total Payable</span>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '28px', fontWeight: 900, color: '#111827', letterSpacing: '-0.03em' }}>₹{(booking.total_price || 0).toFixed(2)}</span>
                            <p style={{ fontSize: '9px', color: '#FF1CF7', margin: '0', fontWeight: 900, letterSpacing: '0.05em' }}>INR</p>
                        </div>
                    </div>

                    <div style={{ paddingTop: '20px' }}>
                        <p style={{ fontSize: '9px', color: '#94a3b8', lineHeight: '1.6', fontWeight: 600 }}>
                            Secure encrypted transaction. By proceeding, you agree to our platform terms.
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .shimmer-text {
                    background: linear-gradient(90deg, #111827 0%, #4b5563 50%, #111827 100%);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: shimmer 3s linear infinite;
                }
                @keyframes shimmer { to { background-position: 200% center; } }
                
                .premium-pay-button {
                    position: relative;
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .premium-pay-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 30px rgba(144, 30, 240, 0.35) !important;
                    background: linear-gradient(135deg, #f014cc 0%, #a028fa 100%) !important;
                }
                .premium-pay-button:active {
                    transform: translateY(0);
                    box-shadow: 0 4px 10px rgba(144, 30, 240, 0.2) !important;
                }
                .premium-pay-button::after {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: linear-gradient(45deg, transparent, rgba(255,255,255,0.15), transparent);
                    transform: rotate(45deg);
                    transition: 0.5s;
                    animation: glossyShine 4s infinite;
                }
                @keyframes glossyShine {
                    0% { left: -100%; }
                    50%, 100% { left: 100%; }
                }
                body { margin: 0; padding: 0; overflow: hidden; background: #FAF9F6; }
            `}</style>
        </div>
    );
}





