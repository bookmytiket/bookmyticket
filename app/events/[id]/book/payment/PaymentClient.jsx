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
    const [paymentStatus, setPaymentStatus] = useState('idle');
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
                    <p style={{ color: '#64748b', marginBottom: '24px' }}>No booking information found.</p>
                    <Link href="/" style={{ display: 'block', width: '100%', padding: '14px', background: '#111827', color: '#fff', borderRadius: '12px', textDecoration: 'none', fontWeight: 700 }}>Back to Home</Link>
                </div>
            </div>
        );
    }

    if (!booking) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading payment details...</div>;

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', paddingTop: '100px', paddingBottom: '60px' }}>
            <div style={{ maxWidth: '500px', margin: '0 auto', padding: '0 20px' }}>
                <Link href={`/events/${eventId}/book/checkout`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', fontSize: '14px', marginBottom: '24px', fontWeight: 600 }}>
                    <ArrowLeft size={16} /> Back to Checkout
                </Link>
                {/* ... existing UI ... */}
                <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
                    <div style={{ background: '#111827', padding: '32px 24px', textAlign: 'center', color: '#fff' }}>
                        <CreditCard size={32} color="#fff" style={{ margin: '0 auto 16px' }} />
                        <h1 style={{ fontSize: '20px', fontWeight: 800 }}>Secure Checkout</h1>
                        <p style={{ margin: 0 }}>Booking ID: #{bookingId.slice(-6).toUpperCase()}</p>
                    </div>
                    <div style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <span>{booking.eventName} (x{booking.ticketCount})</span>
                            <span style={{ fontWeight: 700 }}>₹{booking.totalPrice.toFixed(2)}</span>
                        </div>
                        <button onClick={handleSimulatedPayNow} disabled={isPaying} style={{ width: '100%', padding: '16px', background: '#F43F5E', color: '#fff', borderRadius: '16px', fontWeight: 800 }}>Pay Now</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
