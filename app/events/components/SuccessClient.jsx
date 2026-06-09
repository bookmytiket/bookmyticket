"use client";
import Footer from "@/components/Footer";

import React, { useEffect, useState } from 'react';
import { useSupabaseQuery } from '@/hooks/useSupabase';
import { CheckCircle2, Home, Download, Share2, Ticket as TicketIcon, FileText, Gift, Copy, Check, ExternalLink, Sparkles } from 'lucide-react';
import Link from 'next/link';
import DigitalTicket from '@/components/DigitalTicket';
import DigitalInvoice from '@/components/DigitalInvoice';
import confetti from 'canvas-confetti';
import { supabase } from "@/lib/supabase";
import { useSocialLinks } from "@/hooks/useSocialLinks";

export default function SuccessClient({ eventId, bookingId }) {
    const { bookingLinks, trackClick, whatsapp, instagram } = useSocialLinks();
    const [celebrated, setCelebrated] = useState(false);
    const [showInvoice, setShowInvoice] = useState(false);
    const [rewards, setRewards] = useState([]);
    const [rewardsLoading, setRewardsLoading] = useState(true);
    const [copiedRewardId, setCopiedRewardId] = useState(null);

    const { data: booking, loading: bookingLoading } = useSupabaseQuery('bookings', (q) => 
        q.select('*, events(*)').eq('id', bookingId).single(),
        [bookingId]
    );

    const event = booking?.events;

    const { data: ticket, loading: ticketLoading } = useSupabaseQuery('tickets', (q) => 
        q.eq('booking_id', bookingId).limit(1).maybeSingle(),
        [bookingId]
    );

    const [branding, setBranding] = useState(null);
    const [brandingLoading, setBrandingLoading] = useState(true);

    useEffect(() => {
        fetch('/api/branding')
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) setBranding(data);
                setBrandingLoading(false);
            })
            .catch(() => setBrandingLoading(false));
    }, []);

    useEffect(() => {
        if (!bookingId) return;
        setRewardsLoading(true);
        supabase
            .from('user_coupon_rewards')
            .select(`
                id,
                reward_status,
                unlocked_at,
                coupon_inventory:coupon_inventory_id (
                    coupon_code,
                    expires_at,
                    partner_campaigns:campaign_id (
                        campaign_name,
                        offer_title,
                        offer_description,
                        redeem_url,
                        partners:partner_id (
                            name,
                            logo_url
                        )
                    )
                )
            `)
            .eq('booking_id', bookingId)
            .then(({ data, error }) => {
                if (!error && data) {
                    setRewards(data);
                }
                setRewardsLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching rewards:", err);
                setRewardsLoading(false);
            });
    }, [bookingId]);

    const eventLoading = false; // Placeholder if not defined

    useEffect(() => {
        if (!bookingLoading && !brandingLoading && !ticketLoading && booking && event && !celebrated) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#F43F5E', '#3B82F6', '#10B981', '#F59E0B']
            });
            setCelebrated(true);
        }
    }, [bookingLoading, brandingLoading, ticketLoading, booking, event, celebrated]);

    if (bookingLoading || brandingLoading || ticketLoading) {
        return (
            <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-8">
                <div className="w-16 h-16 border-4 border-slate-100 border-t-pink-500 rounded-full animate-spin mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Generating your E-Ticket...</p>
            </div>
        );
    }

    if (!booking || !event) {
        return (
            <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-8 text-center">
                <CheckCircle2 size={64} className="text-slate-200 mb-6" />
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Booking Confirmed</h2>
                <p className="text-slate-500 mt-2 mb-8">We found your booking, but couldn't load all details. Please check your email for the ticket.</p>
                <Link href="/" className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px]">Back to Home</Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#FDFCFB] pt-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Success Header */}
                <div className="text-center mb-12">
                    <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-emerald-500 mx-auto mb-6 shadow-xl shadow-emerald-500/10">
                        <CheckCircle2 size={40} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter mb-4 leading-none">
                        Booking Successful!
                    </h1>
                    <p className="text-slate-500 font-medium text-lg max-w-md mx-auto">
                        Your spot is secured. Your digital ticket is ready below.
                    </p>
                </div>

                {/* Ticket Display */}
                <div className="mb-12">
                    {showInvoice ? (
                        <DigitalInvoice 
                            booking={booking} 
                            event={event} 
                        />
                    ) : (
                        <DigitalTicket 
                            booking={booking} 
                            event={event} 
                            ticket={ticket}
                            branding={branding}
                            showDownload={true} 
                        />
                    )}
                </div>

                {/* View Switcher */}
                <div className="flex justify-center mb-12">
                    <button 
                        onClick={() => setShowInvoice(!showInvoice)}
                        className="flex items-center gap-2 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all"
                    >
                        {showInvoice ? <TicketIcon size={14} /> : <FileText size={14} />}
                        {showInvoice ? "View E-Ticket" : "View Tax Invoice"}
                    </button>
                </div>

                {/* Unlocked Rewards */}
                {rewards && rewards.length > 0 && (
                    <div className="mb-12 bg-gradient-to-br from-pink-500/10 via-rose-500/5 to-amber-500/5 border border-pink-500/20 rounded-[2.5rem] p-6 md:p-8 shadow-xl backdrop-blur-md relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Gift size={120} className="text-pink-500" />
                        </div>
                        
                        <div className="flex items-center gap-3 mb-6 relative">
                            <div className="w-12 h-12 bg-pink-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/30 animate-pulse">
                                <Sparkles size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Post-Payment Rewards Unlocked!</h3>
                                <p className="text-xs font-bold text-pink-600 uppercase tracking-wider">Exclusive partner benefits for booking this event</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 relative">
                            {rewards.map((reward) => {
                                const inv = reward.coupon_inventory || {};
                                const campaign = inv.partner_campaigns || {};
                                const partner = campaign.partners || {};
                                const isCopied = copiedRewardId === reward.id;

                                return (
                                    <div key={reward.id} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                        <div className="flex items-center gap-4">
                                            {partner.logo_url ? (
                                                <img src={partner.logo_url} alt={partner.name} className="w-16 h-16 rounded-2xl object-contain border border-slate-100 p-2 bg-slate-50 shrink-0" />
                                            ) : (
                                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400 font-bold shrink-0">
                                                    {partner.name?.substring(0, 2).toUpperCase() || 'P'}
                                                </div>
                                            )}
                                            <div>
                                                <span className="inline-block px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[9px] font-black uppercase tracking-widest mb-1.5 border border-rose-100">
                                                    {partner.name || 'Partner Reward'}
                                                </span>
                                                <h4 className="text-lg font-black text-slate-900 leading-tight uppercase tracking-tight">{campaign.offer_title || 'Special Discount Offer'}</h4>
                                                <p className="text-sm font-medium text-slate-500 mt-1">{campaign.offer_description || campaign.campaign_name}</p>
                                                {inv.expires_at && (
                                                    <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mt-2">
                                                        Expires: {new Date(inv.expires_at).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                                            {/* Coupon Code Copy Button */}
                                            {inv.coupon_code && (
                                                <div className="flex items-center border border-dashed border-pink-300 rounded-2xl overflow-hidden bg-pink-50/30 p-1 pl-3 shrink-0">
                                                    <code className="text-sm font-black text-pink-600 tracking-wider pr-3">{inv.coupon_code}</code>
                                                    <button 
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(inv.coupon_code);
                                                            setCopiedRewardId(reward.id);
                                                            setTimeout(() => setCopiedRewardId(null), 2000);
                                                        }}
                                                        className="px-4 py-2.5 bg-white text-slate-700 hover:text-pink-600 rounded-xl border border-slate-100 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                                                    >
                                                        {isCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                                        {isCopied ? "Copied!" : "Copy Code"}
                                                    </button>
                                                </div>
                                            )}

                                            {/* Redeem Link */}
                                            {campaign.redeem_url && (
                                                <a 
                                                    href={campaign.redeem_url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shrink-0 shadow-lg shadow-slate-900/10"
                                                >
                                                    Redeem Now <ExternalLink size={12} />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Social Community Call to Action */}
                {bookingLinks && bookingLinks.length > 0 && (
                    <div className="mb-12 bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm text-center">
                        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Share2 size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Join the Community</h3>
                        <p className="text-slate-500 font-medium mb-8 max-w-md mx-auto">
                            Don't miss out on event updates, discussions, and exclusive media. Connect with fellow attendees!
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            {whatsapp && (
                                <button
                                    onClick={() => { trackClick('whatsapp', 'booking_success'); window.open(whatsapp.url, '_blank'); }}
                                    className="flex items-center justify-center gap-2 px-8 py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all shadow-lg shadow-[#25D366]/20"
                                >
                                    🟢 Join {whatsapp.title || 'WhatsApp'} Group
                                </button>
                            )}
                            {instagram && (
                                <button
                                    onClick={() => { trackClick('instagram', 'booking_success'); window.open(instagram.url, '_blank'); }}
                                    className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] hover:opacity-90 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all shadow-lg shadow-pink-500/20"
                                >
                                    📸 Follow {instagram.title || 'Instagram'}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                    <Link href="/" className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-50 transition-all shadow-sm">
                        <Home size={16} /> Back to Dashboard
                    </Link>
                    <button 
                        onClick={() => window.print()}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:scale-105 transition-all shadow-xl shadow-slate-900/20"
                    >
                        <Download size={16} /> Print Ticket (PDF)
                    </button>
                    <button 
                        onClick={() => {
                            if (navigator.share) {
                                navigator.share({
                                    title: `My Ticket for ${event.title}`,
                                    text: `Check out my ticket for ${event.title}!`,
                                    url: window.location.href
                                });
                            }
                        }}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:scale-105 transition-all shadow-xl shadow-blue-500/20"
                    >
                        <Share2 size={16} /> Share Ticket
                    </button>
                </div>

                <div className="mt-16 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Sponsors & Partners</p>
                    <div className="flex justify-center gap-8 opacity-40">
                         <div className="flex items-center gap-2 text-[9px] font-bold text-slate-900"><TicketIcon size={12}/> Verified Ticket</div>
                         <div className="flex items-center gap-2 text-[9px] font-bold text-slate-900"><CheckCircle2 size={12}/> Entry Guaranteed</div>
                    </div>
                </div>
            </div>
            <div className="pb-24"></div>
            <Footer />
        </main>
    );
}
