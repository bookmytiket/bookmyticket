"use client";
import Footer from "@/components/Footer";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar, MapPin, Video, CheckCircle2, Ticket, 
    ShieldCheck, CreditCard, ChevronLeft, Info, 
    ArrowRight, Mail, Phone, User, ExternalLink,
    Star, Sparkles, Download, Home, MessageSquare, X, Plus, Minus, ChevronDown
} from 'lucide-react';

import { HOME_EVENTS } from '@/app/data/homeEvents';
import { getFeeBreakdown, DEFAULT_FEE_SETTINGS, resolveFeeSettings } from '@/app/utils/feeBreakdown';
import DigitalTicket from '@/components/DigitalTicket';
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthContext";
import { triggerNotification } from "@/lib/notificationHelper";
import TermsModal from "@/components/TermsModal";
import { isFreeEvent } from '@/app/utils/eventUtils';

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=600&fit=crop';

const loadScript = (src) => {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

function getEventById(id, convexEvents) {
    const sid = String(id);
    const fromHome = (Array.isArray(HOME_EVENTS) ? HOME_EVENTS : []).find(e => String(e.id) === sid);
    const fromConvex = (Array.isArray(convexEvents) ? convexEvents : []).find(e => String(e.id) === sid);
    const raw = fromHome || fromConvex;
    if (!raw) return null;
    return {
        ...raw,
        id: raw.id,
        img: raw.image_url || raw.img || raw.bannerPreview || DEFAULT_IMG,
        title: raw.title || 'Event',
        date: raw.date || 'TBA',
        time: raw.time || '',
        location: raw.location || raw.venue || raw.address || 'Venue',
    };
}

function parseCampaignOffer(campaign) {
    const title = campaign.offer_title || "";
    let discountType = "fixed";
    let discountValue = 0;
    let minOrder = 0;

    // Parse discount value (e.g. Flat Rs.100 OFF, Flat 10% OFF, Save 15%)
    const percentMatch = title.match(/(\d+)%/);
    if (percentMatch) {
        discountType = "percent";
        discountValue = parseFloat(percentMatch[1]);
    } else {
        const rsMatch = title.match(/Rs\.?\s*(\d+)/i) || title.match(/(\d+)\s*OFF/i);
        if (rsMatch) {
            discountType = "fixed";
            discountValue = parseFloat(rsMatch[1]);
        }
    }

    // Parse minimum order value (e.g. on above ordder Rs.399, above 399, order 399)
    const minMatch = title.match(/above\s+(?:ordder|order|value)?\s*(?:Rs\.?)?\s*(\d+)/i) || title.match(/>\s*(?:Rs\.?)?\s*(\d+)/i);
    if (minMatch) {
        minOrder = parseFloat(minMatch[1]);
    }

    return {
        id: campaign.id,
        code: campaign.campaign_name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase(),
        displayName: campaign.campaign_name,
        type: discountType,
        value: discountValue,
        min_order: minOrder,
        isCampaign: true,
        campaign: campaign
    };
}

export default function CheckoutClient({ id: propId, sessionToken }) {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [eventId, setEventId] = useState(propId);
    const id = eventId;
    const [rawEvent, setRawEvent] = useState(null);
    const [eventLoading, setEventLoading] = useState(true);
    const [sessionLoading, setSessionLoading] = useState(!!sessionToken);
    const [sessionErrorMsg, setSessionErrorMsg] = useState('');
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 150);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const [qty, setQty] = useState(1);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [selectedPackageName, setSelectedPackageName] = useState('');
    const [regDataParam, setRegDataParam] = useState('');
    const [rsvpAnswers, setRsvpAnswers] = useState({});
    const [participantParam, setParticipantParam] = useState('');
    const [teamParam, setTeamParam] = useState('');
    const [bookingType, setBookingType] = useState('standard');
    const [ticketPrice, setTicketPrice] = useState(499);
    const [session, setSession] = useState(null);

    useEffect(() => {
        if (!sessionToken) return;

        const fetchSession = async () => {
            setSessionLoading(true);
            try {
                const res = await fetch(`/api/booking-session?sessionToken=${sessionToken}`);
                const data = await res.json();
                if (!res.ok || !data.valid) {
                    throw new Error(data.error || "Invalid booking session");
                }
                const sessionData = data.session;
                setSession(sessionData);
                const session = sessionData;
                const participantData = session.participant_data || {};

                setQty(participantData.quantity || 1);
                setTermsAccepted(!!participantData.termsAccepted);
                setEventId(session.event_id);
                setSelectedSeats(participantData.selectedSeats || []);
                setSelectedPackageName(session.package_id || '');
                setBookingType(participantData.bookingType || 'standard');
                setTicketPrice(
                    isFreeEvent(session.events) ? 0 : (participantData.price !== undefined 
                        ? Number(participantData.price) 
                        : (session.events?.price !== undefined ? Number(session.events.price) : 499))
                );

                if (participantData.participant) {
                    setParticipantParam(JSON.stringify(participantData.participant));
                }
                if (participantData.team) {
                    setTeamParam(JSON.stringify(participantData.team));
                }
                
                const currentSnapshot = session.pricing_snapshot || {};
                if (currentSnapshot.appliedCouponCode) {
                    setAppliedCoupon({
                        code: currentSnapshot.appliedCouponCode,
                        id: currentSnapshot.appliedCouponId,
                        campaignId: currentSnapshot.appliedCampaignId,
                        campaignCode: currentSnapshot.appliedCampaignCode,
                        isCampaign: !!currentSnapshot.appliedCampaignId,
                        value: Number(currentSnapshot.discountAmount) || 0,
                        type: 'fixed'
                    });
                }
                
                if (session.events) {
                    setRawEvent(session.events);
                    setEventLoading(false);
                }
                
                // Force sync/recalculate pricing snapshot in database
                const pricingRes = await fetch(`/api/booking-session/pricing?sessionToken=${sessionToken}`);
                const pricingData = await pricingRes.json();
                if (pricingData.success && pricingData.pricing) {
                    setSession(prev => prev ? { ...prev, pricing_snapshot: pricingData.pricing } : { pricing_snapshot: pricingData.pricing });
                }
            } catch (err) {
                console.error("Failed to load booking session:", err);
                setSessionErrorMsg(err.message || "Your booking session has expired or is invalid. Please start again.");
            } finally {
                setSessionLoading(false);
            }
        };

        const channel = supabase
            .channel(`session_updates_${sessionToken}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'booking_sessions', filter: `id=eq.${sessionToken}` },
                (payload) => {
                    const session = payload.new;
                    const participantData = session.participant_data || {};
                    setQty(participantData.quantity || 1);
                    setTermsAccepted(!!participantData.termsAccepted);
                    
                    const currentSnapshot = session.pricing_snapshot || {};
                    if (currentSnapshot.appliedCouponCode) {
                        setAppliedCoupon({
                            code: currentSnapshot.appliedCouponCode,
                            id: currentSnapshot.appliedCouponId,
                            campaignId: currentSnapshot.appliedCampaignId,
                            campaignCode: currentSnapshot.appliedCampaignCode,
                            isCampaign: !!currentSnapshot.appliedCampaignId,
                            value: Number(currentSnapshot.discountAmount) || 0,
                            type: 'fixed'
                        });
                    } else {
                        setAppliedCoupon(null);
                    }
                }
            )
            .subscribe();

        fetchSession();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sessionToken]);

    useEffect(() => {
        if (sessionToken) return; // Loaded via session
        const seatsP = searchParams.get('seats');
        if (seatsP) {
            try { setSelectedSeats(JSON.parse(seatsP)); } catch {}
        }
        setQty(Math.max(1, parseInt(searchParams.get('qty') || '1', 10) || 1));
        setSelectedPackageName(searchParams.get('package') || '');
        setRegDataParam(searchParams.get('regData') || '');
        setParticipantParam(searchParams.get('participant') || '');
        setTeamParam(searchParams.get('team') || '');
        setBookingType(searchParams.get('type') || 'standard');
        setTicketPrice(
            searchParams.get('price') !== null 
                ? parseFloat(searchParams.get('price')) 
                : 499
        );
    }, [searchParams, sessionToken]);

    useEffect(() => {
        if (!eventId || sessionToken) return;
        setEventLoading(true);
        fetch(`/api/events/detail?id=${eventId}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch event');
                return res.json();
            })
            .then(data => {
                setRawEvent(data);
                setEventLoading(false);
            })
            .catch(err => {
                console.error('Error fetching event detail:', err);
                setEventLoading(false);
            });
    }, [eventId, sessionToken]);

    const { data: rawFeeSettings } = useSupabaseQuery('fee_settings', (q) => q.limit(1).maybeSingle(), []);
    const [siteBranding, setSiteBranding] = useState(null);

    useEffect(() => {
        fetch('/api/branding')
            .then(res => res.json())
            .then(data => { if (data && !data.error) setSiteBranding(data); });
    }, []);

    const { data: availableCoupons } = useSupabaseQuery('coupons', (q) => 
        q.select('*').eq('is_active', true).order('created_at', { ascending: false }),
        []
    );

    const { data: mappedCampaigns } = useSupabaseQuery(
        'event_coupon_mapping',
        (q) => q.eq('event_id', id).eq('is_enabled', true),
        [id],
        { select: '*, partner_campaigns(*, partners(*))' }
    );
    const [storageLoaded, setStorageLoaded] = useState(false);
    const [feeSettings, setFeeSettings] = useState(DEFAULT_FEE_SETTINGS);
    const [bookingDone, setBookingDone] = useState(false);
    const [lastBooking, setLastBooking] = useState(null);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [notification, setNotification] = useState(null);
    const [couponCode, setCouponCode] = useState('');
    const [couponError, setCouponError] = useState('');
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
    const [showCouponsModal, setShowCouponsModal] = useState(false);
    const [showFeesDropdown, setShowFeesDropdown] = useState(false);

    
    const event = useMemo(() => {
        if (!rawEvent) return null;
        return {
            ...rawEvent,
            id: rawEvent.id,
            img: rawEvent.image_url || rawEvent.img || rawEvent.bannerPreview || DEFAULT_IMG,
            title: rawEvent.title || 'Event',
            date: rawEvent.date || 'TBA',
            time: rawEvent.time || '',
            location: rawEvent.location || rawEvent.venue || rawEvent.address || 'Venue',
        };
    }, [rawEvent]);
    

    const baseAmount = useMemo(() => {
        if (sessionToken && session?.pricing_snapshot) {
            const snap = session.pricing_snapshot;
            if (snap.baseAmount !== undefined && snap.baseAmount !== null) {
                return Number(snap.baseAmount) || 0;
            }
        }
        if (selectedSeats.length > 0) {
            return selectedSeats.reduce((s, seat) => s + (seat.isFree ? 0 : Number(seat.price) || 0), 0);
        }
        return ticketPrice * qty;
    }, [selectedSeats, ticketPrice, qty, session, sessionToken]);

    const validCoupons = useMemo(() => {
        const list = [];
        
        // 1. Add standard coupons from coupons table
        if (availableCoupons) {
            availableCoupons.forEach(c => {
                if (c.expiry_date && new Date(c.expiry_date) < new Date()) return;
                if (c.applicable_events && c.applicable_events.length > 0) {
                    if (!c.applicable_events.includes(id)) return;
                }
                if (qty < (c.min_tickets || 1)) return;
                if (c.max_tickets && qty > c.max_tickets) return;
                
                list.push({
                    id: c.id,
                    code: c.code,
                    type: c.type,
                    value: c.value,
                    min_tickets: c.min_tickets,
                    max_tickets: c.max_tickets,
                    isCampaign: false
                });
            });
        }

        // 2. Add mapped campaigns
        if (mappedCampaigns) {
            mappedCampaigns.forEach(map => {
                const pc = map.partner_campaigns;
                if (!pc || !pc.is_active) return;
                
                const today = new Date().toISOString().split('T')[0];
                if (pc.start_date && pc.start_date > today) return;
                if (pc.end_date && pc.end_date < today) return;

                // Parse campaign offer details
                const parsed = parseCampaignOffer(pc);
                
                // Enforce minimum order value
                if (baseAmount < parsed.min_order) return;

                list.push({
                    id: pc.id,
                    code: parsed.code,
                    displayName: parsed.displayName,
                    type: parsed.type,
                    value: parsed.value,
                    min_order: parsed.min_order,
                    isCampaign: true,
                    offerTitle: pc.offer_title,
                    partnerName: pc.partners?.name || '',
                    partnerLogo: pc.partners?.logo_url || ''
                });
            });
        }
        
        return list;
    }, [availableCoupons, mappedCampaigns, id, qty, baseAmount]);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);



    const bookingIdFromUrl = searchParams.get('bookingId');
    const isSuccess = searchParams.get('success') === 'true';

    const { data: existingBooking } = useSupabaseQuery('bookings', (q) => 
        q.eq('id', bookingIdFromUrl).single(),
        [bookingIdFromUrl],
        { enabled: !!bookingIdFromUrl }
    );

    useEffect(() => {
        if (rawFeeSettings) {
            setFeeSettings(prev => ({ ...prev, ...rawFeeSettings }));
            setStorageLoaded(true);
        } else if (rawFeeSettings === null) {
            setStorageLoaded(true);
        }
    }, [rawFeeSettings]);
    
    useEffect(() => {
        if (appliedCoupon) {
            if (appliedCoupon.isCampaign) {
                if (baseAmount < (appliedCoupon.min_order || 0)) {
                    setAppliedCoupon(null);
                    setCouponError(`Minimum order value ₹${appliedCoupon.min_order} required for this offer`);
                    setNotification({ message: `Offer removed: Minimum order value ₹${appliedCoupon.min_order} required`, type: 'info' });
                }
            } else {
                if (qty < (appliedCoupon.min_tickets || 1)) {
                    setAppliedCoupon(null);
                    setCouponError(`Minimum ${appliedCoupon.min_tickets} tickets required for this coupon`);
                    setNotification({ message: `Coupon removed: Minimum ${appliedCoupon.min_tickets} tickets required`, type: 'info' });
                } else if (appliedCoupon.max_tickets && qty > appliedCoupon.max_tickets) {
                    setAppliedCoupon(null);
                    setCouponError(`Maximum ${appliedCoupon.max_tickets} tickets allowed for this coupon`);
                    setNotification({ message: `Coupon removed: Maximum ${appliedCoupon.max_tickets} tickets allowed`, type: 'info' });
                }
            }
        }
    }, [qty, baseAmount, appliedCoupon]);

    // Auto-apply best bulk discount
    useEffect(() => {
        if (!validCoupons) return;
        
        // Find all applicable bulk auto coupons
        const applicableBulkCoupons = validCoupons.filter(c => c.code.startsWith('BULK_AUTO_'));
        
        if (applicableBulkCoupons.length > 0) {
            // Find the one that gives the maximum discount
            let bestCoupon = null;
            let maxDiscount = 0;
            
            applicableBulkCoupons.forEach(coupon => {
                let currentDiscount = 0;
                if (coupon.type === 'percent') {
                    currentDiscount = (baseAmount * coupon.value) / 100;
                } else {
                    currentDiscount = coupon.value;
                }
                
                if (currentDiscount > maxDiscount) {
                    maxDiscount = currentDiscount;
                    bestCoupon = coupon;
                }
            });
            
            if (bestCoupon) {
                // Only override if no coupon is applied OR if the currently applied coupon is a worse bulk coupon
                if (!appliedCoupon || (appliedCoupon.code.startsWith('BULK_AUTO_') && appliedCoupon.id !== bestCoupon.id)) {
                    setAppliedCoupon({...bestCoupon, displayName: bestCoupon.displayName || 'Bulk Booking Discount'});
                    setNotification({ message: `Bulk Discount Applied Successfully!`, type: 'success' });
                }
            }
        } else {
            // If qty decreased and a bulk discount is no longer valid, we should remove it
            if (appliedCoupon && appliedCoupon.code.startsWith('BULK_AUTO_')) {
                setAppliedCoupon(null);
                setNotification({ message: `Bulk Discount removed as requirements are no longer met`, type: 'info' });
            }
        }
    }, [validCoupons, baseAmount, qty]);

    useEffect(() => {
        if (isSuccess && existingBooking && existingBooking.status === "Confirmed") {
            setLastBooking({
                id: existingBooking.id,
                eventId: existingBooking.event_id,
                eventName: existingBooking.event_name,
                amount: existingBooking.total_price,
                baseAmount: existingBooking.total_price,
                convenienceFee: 0,
                gst: 0,
                tickets: existingBooking.ticket_count,
                status: 'Confirmed',
                date: new Date(existingBooking.created_at).toISOString().split('T')[0],
                ticketType: 'General Admission',
                paymentMethod: 'Online',
                location: existingBooking.location || event?.location,
                meetingUrl: existingBooking.customer_details?.meeting_url || event?.meetingUrl,
            });
            setBookingDone(true);
        }
    }, [isSuccess, existingBooking, event]);


    const { data: organiserData } = useSupabaseQuery('organisers', (q) => q.eq('id', event?.organiser_id || event?.organiserId).single(), [event?.organiser_id, event?.organiserId]);

    const resolvedFeeSettings = useMemo(() => {
        return resolveFeeSettings(
            feeSettings,
            organiserData?.fee_config,
            event?.fee_config
        );
    }, [feeSettings, organiserData?.fee_config, event?.fee_config]);

    const discountAmount = useMemo(() => {
        if (sessionToken && session?.pricing_snapshot) {
            const snap = session.pricing_snapshot;
            if (snap.discountAmount !== undefined && snap.discountAmount !== null) {
                return Number(snap.discountAmount) || 0;
            }
        }
        if (!appliedCoupon) return 0;
        if (appliedCoupon.type === 'percent') {
            return (baseAmount * appliedCoupon.value) / 100;
        } else {
            return Math.min(baseAmount, appliedCoupon.value);
        }
    }, [baseAmount, appliedCoupon, session, sessionToken]);

    const { convenienceFee, gst, total, gstPercent } = useMemo(() => {
        if (sessionToken && session?.pricing_snapshot) {
            const snap = session.pricing_snapshot;
            if (snap.totalPrice !== undefined && snap.totalPrice !== null) {
                return {
                    convenienceFee: Number(snap.convenienceFee) || 0,
                    gst: Number(snap.gst) || 0,
                    total: Number(snap.totalPrice) || 0,
                    gstPercent: Number(snap.gstPercent) || 0
                };
            }
        }
        const discountedBase = Math.max(0, baseAmount - discountAmount);
        return getFeeBreakdown(discountedBase, resolvedFeeSettings);
    }, [baseAmount, discountAmount, resolvedFeeSettings, session, sessionToken]);

    const isFree = total === 0;

    const handleQtyChange = async (newQty) => {
        if (newQty < 1) return;
        setQty(newQty);
        if (sessionToken) {
            try {
                await fetch('/api/booking-session/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionToken, quantity: newQty })
                });
                const pricingRes = await fetch(`/api/booking-session/pricing?sessionToken=${sessionToken}`);
                const pricingData = await pricingRes.json();
                if (pricingData.success && pricingData.pricing) {
                    setSession(prev => prev ? { ...prev, pricing_snapshot: pricingData.pricing } : null);
                }
            } catch (err) {
                console.error("Failed to update quantity in session:", err);
            }
        }
    };

    const handleApplyCoupon = async (directCode = null) => {
        const codeToUse = (typeof directCode === 'string' ? directCode : couponCode).trim().toUpperCase();
        if (!codeToUse || !user || !event) return;
        
        setIsValidatingCoupon(true);
        setCouponError('');

        if (sessionToken) {
            try {
                const res = await fetch('/api/booking-session/apply-coupon', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionToken, code: codeToUse })
                });
                const data = await res.json();
                if (data.success && data.pricing) {
                    const pricing = data.pricing;
                    setSession(prev => prev ? { ...prev, pricing_snapshot: pricing } : null);
                    setAppliedCoupon({
                        code: pricing.appliedCouponCode,
                        id: pricing.appliedCouponId,
                        campaignId: pricing.appliedCampaignId,
                        campaignCode: pricing.appliedCampaignCode,
                        isCampaign: !!pricing.appliedCampaignId,
                        value: Number(pricing.discountAmount) || 0,
                        type: 'fixed'
                    });
                    setNotification({ message: `Coupon applied successfully!`, type: 'success' });
                } else {
                    setCouponError(data.message || "Invalid coupon code");
                    setAppliedCoupon(null);
                }
            } catch (err) {
                console.error("Failed to apply coupon:", err);
                setCouponError("Failed to validate coupon");
            } finally {
                setIsValidatingCoupon(false);
            }
            return;
        }
        
        // 1. Check if there is a matching campaign in the valid campaigns list
        const campaignCoupon = validCoupons.find(c => c.isCampaign && c.code === codeToUse);
        if (campaignCoupon) {
            setAppliedCoupon(campaignCoupon);
            setNotification({ message: `Campaign "${campaignCoupon.displayName}" applied successfully!`, type: 'success' });
            setIsValidatingCoupon(false);
            return;
        }
        
        // 2. Otherwise, validate via API (legacy support)
        try {
            const res = await fetch('/api/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: codeToUse,
                    userId: user.id,
                    ticketCount: qty,
                    eventId: event.id
                })
            });
            const data = await res.json();
            if (data.valid) {
                setAppliedCoupon(data.coupon);
                setNotification({ message: `Coupon ${data.coupon.code} applied successfully!`, type: 'success' });
            } else {
                setCouponError(data.message || "Invalid coupon");
                setAppliedCoupon(null);
            }
        } catch (err) {
            setCouponError("Failed to validate coupon");
        } finally {
            setIsValidatingCoupon(false);
        }
    };

    const removeCoupon = async () => {
        if (sessionToken) {
            setIsValidatingCoupon(true);
            try {
                await fetch('/api/booking-session/apply-coupon', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionToken, code: null })
                });
                setAppliedCoupon(null);
                setCouponCode('');
                setCouponError('');
                setNotification({ message: `Coupon removed`, type: 'info' });
            } catch (err) {
                console.error("Failed to remove coupon:", err);
            } finally {
                setIsValidatingCoupon(false);
            }
        } else {
            setAppliedCoupon(null);
            setCouponCode('');
            setCouponError('');
        }
    };

    const handleConfirmPay = async () => {
        if (!event || !user || !termsAccepted || isProcessing) return;
        
        if (event?.rsvpFields?.length > 0) {
            const missing = event.rsvpFields.filter(f => !rsvpAnswers[f]);
            if (missing.length > 0) {
                setNotification({ message: `Please fill out all required RSVP fields: ${missing.join(', ')}`, type: 'error' });
                return;
            }
        }

        setIsProcessing(true);
        try {
            if (sessionToken) {
                // Update participantData with RSVP answers in the session before confirming
                if (event?.rsvpFields?.length > 0) {
                    await fetch('/api/booking-session/update-participant', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sessionToken, extraDetails: rsvpAnswers })
                    }).catch(() => {});
                }

                // 1. Accept terms on session
                await fetch('/api/booking-session/accept-terms', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionToken, termsAccepted: true })
                });

                // 2. Create the order / booking row
                const orderRes = await fetch('/api/booking-session/create-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionToken })
                });
                const orderData = await orderRes.json();
                if (!orderRes.ok || !orderData.success) {
                    throw new Error(orderData.error || "Order creation failed");
                }
                const bookingId = orderData.bookingId;

                // 3. Handle free vs paid
                if (isFree) {
                    const verifyRes = await fetch('/api/booking-session/verify-payment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sessionToken, gateway: 'Free' })
                    });
                    const verifyData = await verifyRes.json();
                    if (!verifyRes.ok || !verifyData.success) {
                        throw new Error(verifyData.error || "Payment verification failed");
                    }

                    setLastBooking({
                        id: bookingId,
                        eventId: String(event.id),
                        eventName: event.title,
                        amount: 0,
                        baseAmount: 0,
                        convenienceFee: 0,
                        gst: 0,
                        tickets: qty,
                        status: 'Confirmed',
                        date: new Date().toISOString().split('T')[0],
                        ticketType: selectedPackageName || 'General Admission',
                        paymentMethod: 'Free',
                        location: event.location,
                        meetingUrl: event.meetingUrl,
                    });
                    setBookingDone(true);
                } else {
                    const resScript = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
                    if (!resScript) throw new Error("Razorpay SDK failed to load.");

                    const paymentRes = await fetch('/api/booking-session/create-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sessionToken, gateway: 'Razorpay' })
                    });
                    const paymentData = await paymentRes.json();
                    if (!paymentRes.ok || !paymentData.success) {
                        throw new Error(paymentData.error || "Razorpay order creation failed");
                    }

                    const { order, keyId } = paymentData;

                    const options = {
                        key: keyId,
                        amount: order.amount,
                        currency: order.currency,
                        name: "BookMyTicket",
                        description: `Payment for ${event.title}`,
                        image: "/logo.png",
                        order_id: order.id,
                        handler: async function (response) {
                            try {
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
                                    router.push(`/events/book/success?bookingId=${bookingId}&id=${id}&sessionToken=${sessionToken}`);
                                } else {
                                    throw new Error(verifyData.error || "Verification failed");
                                }
                            } catch (err) {
                                console.error("Razorpay verification failed:", err);
                                alert("Payment verification failed: " + err.message);
                                setIsProcessing(false);
                            }
                        },
                        modal: {
                            ondismiss: function () {
                                setIsProcessing(false);
                            }
                        },
                        prefill: {
                            name: user.name || "Guest User",
                            email: user.identifier || user.email || "",
                            contact: user.phone || ""
                        },
                        theme: {
                            color: "#FF1CF7"
                        }
                    };

                    const rzp = new window.Razorpay(options);
                    rzp.open();
                }
                return;
            }

            // Legacy non-session booking flow
            const breakdown = getFeeBreakdown(baseAmount, resolvedFeeSettings);
            let regData = {};
            if (regDataParam) {
                try { regData = JSON.parse(regDataParam); } catch { }
            }

            const { data: booking, error } = await supabase
                .from('bookings')
                .insert([{
                    event_id: String(event.id),
                    user_id: user.id,
                    ticket_count: qty,
                    base_amount: breakdown.baseAmount,
                    platform_charge: breakdown.convenienceFee,
                    gst_amount: breakdown.gst,
                    gst_percent: breakdown.gstPercent,
                    partner_bonus: breakdown.partnerBonus,
                    platform_revenue: breakdown.platformRevenue,
                    partner_total: breakdown.partnerTotal,
                    discount_amount: discountAmount,
                    coupon_id: (!appliedCoupon || appliedCoupon.isCampaign) ? null : appliedCoupon.id,
                    total_price: total,
                    status: isFree ? 'Confirmed' : 'Pending',
                    scanned: false,
                    selected_seats: selectedSeats,
                    event_name: event.title,
                    location: event.location,
                    customer_details: {
                        name: user.name || "Guest User",
                        email: user.identifier || user.email || "",
                        phone: user.phone || "",
                        applied_campaign_id: appliedCoupon?.isCampaign ? appliedCoupon.id : null,
                        applied_campaign_code: appliedCoupon?.isCampaign ? appliedCoupon.code : null,
                        ...regData
                    }
                }])
                .select()
                .single();

            if (error) throw error;

            try {
                if (participantParam) {
                    const participantData = JSON.parse(participantParam);
                    await fetch('/api/runner-registration', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            eventId:       String(event.id),
                            bookingId:     booking.id,
                            userId:        user.id,
                            identity: {
                                fullName: participantData.fullName || user.name || '',
                                email:    participantData.email || user.identifier || user.email || '',
                                phone:    participantData.phone || user.phone || '',
                                dob:      participantData.dob || '',
                            },
                            details:       participantData,
                            category:      selectedPackageName || '',
                            paymentStatus: isFree ? 'paid' : 'pending',
                        })
                    });
                }
            } catch (regErr) {
                console.warn('[runner-registration] Save failed (non-critical):', regErr);
            }

            try {
                if (teamParam) {
                    const teamData = JSON.parse(teamParam);
                    const { data: team, error: teamError } = await supabase
                        .from('tournament_teams')
                        .insert({
                            tournament_event_id: String(event.id),
                            booking_id: booking.id,
                            team_name: teamData.teamName,
                            captain_name: teamData.captainName,
                            captain_mobile: teamData.captainMobile,
                            captain_email: teamData.captainEmail || user.email || "",
                            registration_status: 'pending_approval',
                            payment_status: isFree ? 'paid' : 'pending',
                            metadata: { category: selectedPackageName, city: teamData.city }
                        })
                        .select()
                        .single();

                    if (teamError) throw teamError;

                    if (teamData.members && teamData.members.length > 0) {
                        const membersToInsert = teamData.members.map(m => ({
                            team_id: team.id,
                            member_name: m.name,
                            role: m.role,
                            jersey_number: m.jerseyNumber
                        }));
                        await supabase.from('tournament_team_members').insert(membersToInsert);
                    }
                }
            } catch (tourneyErr) {
                console.warn('[tournament-registration] Save failed (non-critical):', tourneyErr);
            }

            if (isFree) {
                setLastBooking({
                    id: booking.id,
                    eventId: String(event.id),
                    eventName: event.title,
                    amount: 0,
                    baseAmount: 0,
                    convenienceFee: 0,
                    gst: 0,
                    tickets: qty,
                    status: 'Confirmed',
                    date: new Date().toISOString().split('T')[0],
                    ticketType: selectedPackageName || 'General Admission',
                    paymentMethod: 'Free',
                    location: event.location,
                    meetingUrl: event.meetingUrl,
                });
                
                if (user?.phone) {
                    triggerNotification({
                        phoneNumber: user.phone,
                        type: "BOOKING",
                        data: {
                            eventName: event.title,
                            date: event.date,
                            bookingId: booking.id
                        }
                    });
                }

                setBookingDone(true);
            } else {
                const resScript = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
                if (!resScript) throw new Error("Razorpay SDK failed to load.");

                const rzpOrderRes = await fetch('/api/razorpay/create-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: booking.id,
                        amount: booking.total_price,
                        type: "booking"
                    })
                });

                const order = await rzpOrderRes.json();
                if (order.error) throw new Error(order.error);

                // Fetch gateways configs to get Key ID
                const gRes = await fetch('/api/payment/gateways');
                const gateways = await gRes.json();
                const rzpConfig = gateways?.find(g => g.name === "Razorpay")?.config;
                const key_id = rzpConfig?.keyId || rzpConfig?.apiKey || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

                if (!key_id) throw new Error("Razorpay Key ID is not configured.");

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
                            const verifyRes = await fetch('/api/razorpay/verify', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    id: booking.id,
                                    type: "booking"
                                })
                            });
                            const verifyData = await verifyRes.json();
                            if (verifyData.success) {
                                router.push(`/events/book/success?bookingId=${booking.id}&id=${id}`);
                            } else {
                                throw new Error(verifyData.error || "Verification failed");
                            }
                        } catch (err) {
                            console.error("Razorpay verification failed:", err);
                            alert("Payment verification failed: " + err.message);
                            setIsProcessing(false);
                        }
                    },
                    modal: {
                        ondismiss: function () {
                            setIsProcessing(false);
                        }
                    },
                    prefill: {
                        name: user.name || "Guest User",
                        email: user.identifier || user.email || "",
                        contact: user.phone || ""
                    },
                    theme: {
                        color: "#FF1CF7"
                    }
                };

                const rzp = new window.Razorpay(options);
                rzp.open();
            }
        } catch (error) {
            console.error("Booking failed:", error);
            const errorMsg = error.message || "Booking failed. Please check your connection and try again.";
            setNotification({ message: errorMsg, type: "error" });
        } finally {
            setIsProcessing(false);
        }
    };

    if (sessionLoading) {
        return (
            <main className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px]">Loading Secure Session...</p>
                </div>
            </main>
        );
    }

    if (sessionErrorMsg) {
        return (
            <main className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
                <div className="bg-white p-12 rounded-[3rem] shadow-xl text-center space-y-6 max-w-md">
                    <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto">
                        <Info size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Session Error</h2>
                    <p className="text-slate-500 font-medium">{sessionErrorMsg}</p>
                    <button 
                        onClick={() => router.push(`/events/book?id=${id || propId}`)}
                        className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all"
                    >
                        Restart Booking
                    </button>
                </div>
            </main>
        );
    }

    if (eventLoading || !storageLoaded) {
        return (
            <main className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px]">Validating Checkout...</p>
                </div>
            </main>
        );
    }

    if (!event && !eventLoading) {
        return (
            <main className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
                <div className="bg-white p-12 rounded-[3rem] shadow-xl text-center space-y-6">
                    <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto">
                        <Info size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Event Not Found</h2>
                    <p className="text-slate-500 font-medium">The event you are looking for might have been removed or is no longer available.</p>
                    <button 
                        onClick={() => router.push('/events')}
                        className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all"
                    >
                        Browse Other Events
                    </button>
                </div>
            </main>
        );
    }

    if (bookingDone) {
        return (
            <main className="min-h-screen bg-[#FDFCFB]">
                <div className="max-w-[800px] mx-auto px-6 py-20 text-center">
                    <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", damping: 20 }}
                        className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white mx-auto mb-10 shadow-2xl shadow-emerald-500/20"
                    >
                        <CheckCircle2 size={48} />
                    </motion.div>
                    
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter mb-4">Booking Confirmed!</h1>
                        <p className="text-slate-500 font-medium text-lg mb-12">You're all set for <span className="text-slate-900 font-bold">{event.title}</span>. Your ticket is ready below.</p>
                        
                        <div className="inline-flex items-center gap-3 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 text-sm font-black uppercase tracking-widest mb-12">
                            Order ID: #{lastBooking?.id?.slice(-8).toUpperCase()}
                        </div>

                        <div className="max-w-4xl mx-auto mb-16 transform hover:scale-[1.02] transition-transform">
                            <DigitalTicket 
                                booking={{
                                    ...lastBooking,
                                    id: lastBooking.id
                                }}
                                event={{ 
                                    ...event, 
                                    img: event.img,
                                    virtual: event.virtual,
                                    meetingUrl: event.meetingUrl
                                }} 
                                showDownload={true}
                                branding={siteBranding}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Link href="/" className="flex flex-col items-center gap-3 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                    <Home size={24} />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest">Go Home</span>
                            </Link>
                            <button onClick={() => window.print()} className="flex flex-col items-center gap-3 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-pink-500 group-hover:text-white transition-all">
                                    <Download size={24} />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest">Print Ticket</span>
                            </button>
                            <Link href="/support" className="flex flex-col items-center gap-3 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                    <MessageSquare size={24} />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest">Need Help?</span>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#FDFCFB]">
            <AnimatePresence>
                {notification && (
                    <motion.div 
                        initial={{ opacity: 0, y: -50, x: '-50%' }}
                        animate={{ opacity: 1, y: 30, x: '-50%' }}
                        exit={{ opacity: 0, y: -50, x: '-50%' }}
                        className="fixed top-0 left-1/2 z-[100] w-full max-w-md px-4"
                    >
                        <div className="bg-white/80 backdrop-blur-xl border border-rose-100 shadow-[0_20px_50px_rgba(236,72,153,0.15)] p-5 rounded-[2rem] flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ec4899] to-[#8b5cf6] flex items-center justify-center text-white shrink-0 shadow-lg">
                                <Info size={24} />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-[#ec4899] uppercase tracking-widest mb-1">Attention Required</p>
                                <p className="text-sm font-black text-slate-900 leading-tight">{notification.message}</p>
                            </div>
                            <button onClick={() => setNotification(null)} className="w-8 h-8 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {event && (
                <div 
                    className={`fixed top-0 left-0 right-0 z-[100] bg-white border-b border-slate-200 shadow-sm transition-transform duration-300 flex items-center justify-between px-4 sm:px-8 py-3 ${scrolled ? 'translate-y-0' : '-translate-y-full'}`}
                >
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => router.back()}
                            className="p-2 -ml-2 text-slate-600 hover:text-pink-500 transition-colors"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div className="flex flex-col">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight truncate max-w-[200px] sm:max-w-[600px]">
                                {event.title}
                            </h2>
                            <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500 mt-1">
                                <div className="flex items-center gap-1">
                                    <Calendar size={12} className="text-emerald-500" />
                                    <span>{event.date}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <MapPin size={12} className="text-rose-500" />
                                    <span className="truncate max-w-[100px] sm:max-w-[200px]">{event.venue || event.location || 'TBA'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full px-4 md:px-12 py-2 space-y-2">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <button 
                            onClick={() => router.back()}
                            className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                        >
                            <ChevronLeft size={16} /> Back
                        </button>
                        <div className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                            Step 1 of 2
                        </div>
                    </div>

                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl overflow-hidden">
                        <div className="flex flex-col lg:flex-row gap-0">
                            <div className="w-full lg:w-[35%] relative shrink-0 overflow-hidden bg-slate-900 flex items-center justify-center">
                                <div className="h-48 md:h-56 lg:h-full w-full relative flex flex-col justify-center">
                                    <img src={event.img} alt="" className="w-full h-full object-cover lg:object-contain opacity-80 p-0 lg:p-8" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                                    <div className="absolute bottom-6 left-6 right-6 lg:bottom-10 lg:left-10 lg:right-10">
                                        <h3 className="text-2xl lg:text-3xl font-black text-white uppercase tracking-tight leading-tight mb-2 lg:mb-3 drop-shadow-xl">{event.title}</h3>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-white/90 uppercase tracking-[0.2em]">
                                            <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                                <Calendar size={14} className="text-pink-400" />
                                            </div>
                                            {event.date}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 p-4 md:p-6 lg:p-8 bg-white flex flex-col items-center justify-center">
                                <div className="max-w-[550px] w-full space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                            <div className="space-y-1">
                                                <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.2em]">{isFree ? 'RSVP Registration' : 'Ticket Details'}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Review your selection</p>
                                            </div>
                                            <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest bg-pink-50 px-4 py-2 rounded-full border border-pink-100/50">{isFree ? 'Free Registration' : 'Secure Checkout'}</span>
                                        </div>

                                        {selectedSeats.length > 0 ? (
                                            <div className="flex flex-wrap gap-4">
                                                {selectedSeats.map(seat => (
                                                    <div key={seat.id} className="px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
                                                        <span className="text-[14px] font-black text-slate-900 uppercase tracking-tight">Seat {seat.id}</span>
                                                        <div className="w-1.5 h-6 bg-pink-500 rounded-full" />
                                                        <span className="text-[14px] font-black text-pink-500">₹{seat.price}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="bg-slate-50 p-3 md:p-4 rounded-[1.5rem] border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between shadow-inner gap-3 sm:gap-0">
                                                <div className="space-y-1.5 text-center sm:text-left">
                                                    <span className="text-[14px] md:text-[16px] font-black text-slate-900 uppercase tracking-tight leading-none block break-words">{selectedPackageName || "Ticket"}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base Category</span>
                                                </div>
                                                <div className="flex items-center justify-between sm:justify-end gap-4 md:gap-6 w-full sm:w-auto">
                                                    <div className="flex items-center gap-2 md:gap-4 bg-white border border-slate-200 rounded-xl px-2 md:px-4 py-2 shadow-sm shrink-0">
                                                        <button onClick={() => handleQtyChange(Math.max(1, qty - 1))} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-pink-500 transition-colors bg-slate-50 rounded-lg"><Minus size={12} /></button>
                                                        <span className="text-sm text-slate-900 font-black min-w-[20px] text-center">{qty}</span>
                                                        <button onClick={() => handleQtyChange(qty + 1)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-pink-500 transition-colors bg-slate-50 rounded-lg"><Plus size={12} /></button>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <span className="text-[16px] md:text-xl font-black text-slate-900 tracking-tighter">{isFree ? 'FREE' : `₹${baseAmount.toFixed(2)}`}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        {!isFree && !appliedCoupon ? (
                                            <div className="space-y-3 relative">
                                                <div className="flex gap-2">
                                                    <input 
                                                        type="text" 
                                                        value={couponCode}
                                                        onChange={(e) => setCouponCode(e.target.value)}
                                                        placeholder="Coupon Code"
                                                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold outline-none uppercase focus:ring-1 focus:ring-pink-500 transition-all w-full min-w-0"
                                                    />
                                                    <button 
                                                        onClick={handleApplyCoupon}
                                                        disabled={isValidatingCoupon || !couponCode}
                                                        className="px-4 md:px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 transition-all shadow-lg shrink-0"
                                                    >
                                                        Apply
                                                    </button>
                                                </div>
                                                {validCoupons.length > 0 && (
                                                    <button 
                                                        onClick={() => setShowCouponsModal(!showCouponsModal)}
                                                        className="text-[10px] font-black text-pink-500 uppercase tracking-widest hover:underline w-full text-left pl-1 flex items-center gap-1"
                                                    >
                                                        View All Offers <ChevronDown size={12} className={`transition-transform ${showCouponsModal ? 'rotate-180' : ''}`} />
                                                    </button>
                                                )}
                                                
                                                <AnimatePresence>
                                                    {showCouponsModal && validCoupons.length > 0 && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: -5 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -5 }}
                                                            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden"
                                                        >
                                                            <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 space-y-2">
                                                                {validCoupons.map((coupon) => (
                                                                    <button
                                                                        key={coupon.id}
                                                                        onClick={() => {
                                                                            setCouponCode(coupon.code);
                                                                            setShowCouponsModal(false);
                                                                            handleApplyCoupon(coupon.code);
                                                                        }}
                                                                        className="w-full text-left p-3 bg-slate-50 hover:bg-pink-50 rounded-xl border border-slate-100 hover:border-pink-200 transition-all flex items-center justify-between group"
                                                                    >
                                                                        <div className="flex-1 min-w-0 pr-2">
                                                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                                <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest bg-white px-2 py-0.5 rounded-md border border-slate-200 group-hover:border-pink-200 transition-colors">
                                                                                    {coupon.code.startsWith('BULK_AUTO_') ? 'Bulk Offer' : coupon.code}
                                                                                </span>
                                                                                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">
                                                                                    {coupon.isCampaign ? 'Brand Offer' : coupon.code.startsWith('BULK_AUTO_') ? 'Auto Applied' : 'Active'}
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-[11px] font-bold text-slate-500 line-clamp-2">
                                                                                {coupon.offerTitle || (coupon.type === 'percent' ? `Save ${coupon.value}% on tickets` : `Save ₹${coupon.value} on total value`)}
                                                                            </p>
                                                                            <div className="flex items-center gap-2 mt-1">
                                                                                {coupon.partnerLogo ? (
                                                                                    <img src={coupon.partnerLogo} alt={coupon.partnerName} className="h-5 object-contain rounded" />
                                                                                ) : coupon.partnerName ? (
                                                                                    <p className="text-[9px] font-bold text-pink-500 uppercase tracking-wider">
                                                                                        Partner: {coupon.partnerName}
                                                                                    </p>
                                                                                ) : null}
                                                                            </div>
                                                                        </div>
                                                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-300 group-hover:text-pink-500 transition-colors shrink-0">
                                                                            <ArrowRight size={14} />
                                                                        </div>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        ) : !isFree && appliedCoupon ? (
                                            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100 border-dashed">
                                                <div className="flex items-center gap-2 text-emerald-600">
                                                    <Sparkles size={14} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{appliedCoupon.code.startsWith('BULK_AUTO_') ? 'Bulk Discount' : appliedCoupon.code} Applied</span>
                                                </div>
                                                <button onClick={removeCoupon} className="text-slate-400 hover:text-rose-500 transition-colors">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="space-y-0 pt-4 mt-2">
                                        {/* Ticket Price */}
                                        <div className="flex justify-between items-center text-[13px] font-medium text-slate-700 py-1.5">
                                            <span>{isFree ? 'Registration Fee' : 'Ticket(s) price'}</span>
                                            <span>{isFree ? 'FREE' : `₹${baseAmount.toFixed(2)}`}</span>
                                        </div>

                                        {!isFree && (
                                            <>
                                                {/* Convenience Fees */}
                                                <div className="flex flex-col text-[13px] text-slate-700 py-1.5 w-full">
                                                    <div 
                                                        className="flex justify-between items-start cursor-pointer font-medium text-slate-700 hover:text-slate-900 transition-colors" 
                                                        onClick={() => setShowFeesDropdown(!showFeesDropdown)}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            <span>Convenience fees</span>
                                                            <ChevronDown size={14} className={`transition-transform text-slate-400 ${showFeesDropdown ? 'rotate-180' : ''}`} />
                                                        </div>
                                                        <span className="font-medium shrink-0">₹{(convenienceFee + gst).toFixed(2)}</span>
                                                    </div>
                                                    {showFeesDropdown && (
                                                        <div className="text-[11px] text-slate-500 mt-2 space-y-1.5 font-medium pb-2">
                                                            <div className="flex justify-between">
                                                                <span>Base Amount</span>
                                                                <span>₹{convenienceFee.toFixed(2)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span>Integrated GST (IGST) @ {gstPercent}%</span>
                                                                <span>₹{gst.toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Discount */}
                                                {appliedCoupon && (
                                                    <div className="flex justify-between items-center text-[13px] font-medium text-emerald-600 mt-3 pt-3 border-t border-slate-100">
                                                        <span>Discount Applied</span>
                                                        <span>- ₹{discountAmount.toFixed(2)}</span>
                                                    </div>
                                                )}

                                                {/* Separator */}
                                                <div className="border-t border-dashed border-slate-300 my-4"></div>

                                                <div className="flex justify-between items-center mb-6">
                                                    <span className="text-[15px] font-black text-slate-900">Order total</span>
                                                    <span className="text-lg font-black text-slate-900">₹{total.toFixed(2)}</span>
                                                </div>
                                            </>
                                        )}


                                        <div className="bg-white p-3 rounded-2xl border-2 border-slate-100 shadow-sm transition-all hover:border-pink-100 mb-4">
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={termsAccepted}
                                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                                    className="w-4 h-4 rounded border-slate-200 text-pink-500 focus:ring-pink-500 transition-all cursor-pointer bg-slate-50 shrink-0"
                                                />
                                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-tight mt-0.5">
                                                    I agree to the <button type="button" onClick={() => setShowTermsModal(true)} className="text-slate-900 font-black hover:text-pink-500 transition-colors border-b-2 border-slate-200 hover:border-pink-200 pb-0.5">Event Terms & Conditions</button>
                                                </span>
                                            </label>
                                        </div>

                                        <button 
                                            onClick={handleConfirmPay}
                                            disabled={!termsAccepted || isProcessing}
                                            className={`
                                                w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] transition-all flex items-center justify-center gap-3
                                                ${termsAccepted && !isProcessing
                                                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-[0_20px_40px_-15px_rgba(236,72,153,0.3)] hover:scale-[1.02] active:scale-95' 
                                                    : 'bg-slate-50 text-slate-400 border-2 border-slate-100 cursor-not-allowed shadow-none'}
                                            `}
                                        >
                                            {isProcessing ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-4 h-4 border-[3px] border-white/20 border-t-white rounded-full animate-spin" />
                                                    Processing...
                                                </div>
                                            ) : (
                                                <>{isFree ? 'Confirm RSVP' : 'Proceed to Payment'} <ArrowRight size={16} /></>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-white rounded-[40px] p-8 md:p-12 border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Confirmation</h2>
                            <div className="px-4 py-2 bg-amber-400 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-400/20">
                                Step 2 of 2
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4 text-[11px] font-black text-pink-500 uppercase tracking-widest">
                                <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center">
                                    <User size={16} />
                                </div>
                                Attendee Details
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Full Name</label>
                                    <input 
                                        type="text"
                                        value={user?.name || ""}
                                        readOnly
                                        className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-bold text-slate-900 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Email Address</label>
                                    <input 
                                        type="email"
                                        value={user?.identifier || user?.email || ""}
                                        readOnly
                                        className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-bold text-slate-900 outline-none"
                                    />
                                </div>
                                {isFree && event?.rsvpFields?.map((field) => (
                                    <div key={field} className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{field}</label>
                                        <input 
                                            type="text"
                                            value={rsvpAnswers[field] || ""}
                                            onChange={(e) => setRsvpAnswers(prev => ({...prev, [field]: e.target.value}))}
                                            placeholder={`Enter your ${field.toLowerCase()}`}
                                            className="w-full px-8 py-5 bg-white border border-slate-100 focus:border-pink-200 focus:ring-4 focus:ring-pink-500/10 rounded-[2rem] text-sm font-bold text-slate-900 outline-none transition-all"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 px-4">
                        <div className="flex-1" />
                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                <ShieldCheck size={14} className="text-emerald-500" /> Instant Delivery
                            </div>
                            <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                <CreditCard size={14} className="text-blue-500" /> SSL Secured
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <TermsModal
                isOpen={showTermsModal}
                onClose={() => setShowTermsModal(false)}
                onAccept={() => setTermsAccepted(true)}
                type="event"
            />


            <Footer />
        </main>
    );
}
