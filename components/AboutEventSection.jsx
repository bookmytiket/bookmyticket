"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronDown, ChevronUp, Info, AlertTriangle, Star, CheckCircle2,
    HelpCircle, Trophy, Medal, BookOpen, FileText, Calendar,
    Sparkles, Shield, Zap, Users, MapPin, Clock, Phone, Mail,
    Shirt, Coffee, Utensils, Car, Gift, Camera
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ────────────────────────────────────────────────
// Icon Mapper
// ────────────────────────────────────────────────
const AmenityIcon = ({ name, className, size = 16 }) => {
    const icons = {
        tshirt: Shirt,
        medal: Medal,
        trophy: Trophy,
        coffee: Coffee,
        food: Utensils,
        parking: Car,
        gift: Gift,
        photo: Camera,
        certificate: FileText,
        star: Star
    };
    const Icon = icons[name?.toLowerCase()] || CheckCircle2;
    return <Icon size={size} className={className} />;
};

// ────────────────────────────────────────────────
// Default highlight templates per event category
// ────────────────────────────────────────────────
const CATEGORY_HIGHLIGHTS = {
    marathon: [
        { icon: '🏅', title: 'Medal for All Finishers' },
        { icon: '🎖', title: 'Participation Certificate' },
        { icon: '💧', title: 'Hydration Points Every 2km' },
        { icon: '🚑', title: 'On-Route Medical Support' },
        { icon: '🍽', title: 'Post-Race Refreshments' },
        { icon: '📸', title: 'Professional Photography' },
    ],
    tournament: [
        { icon: '🏆', title: 'Winner Trophy & Certificate' },
        { icon: '🎖', title: 'Participation Certificate' },
        { icon: '🏅', title: 'Runner-Up Medal' },
        { icon: '📸', title: 'Professional Photography' },
        { icon: '🎁', title: 'Goodie Bag for Participants' },
        { icon: '🚑', title: 'Medical Support on Ground' },
    ],
    concert: [
        { icon: '🎵', title: 'Live Performance' },
        { icon: '🎤', title: 'Artist Interaction' },
        { icon: '🎁', title: 'Exclusive Merchandise' },
        { icon: '📸', title: 'Photo Opportunities' },
        { icon: '🅿️', title: 'Parking Available' },
        { icon: '🍽', title: 'Food & Beverages' },
    ],
    conference: [
        { icon: '🎖', title: 'Participation Certificate' },
        { icon: '📚', title: 'Study Material Provided' },
        { icon: '🤝', title: 'Networking Sessions' },
        { icon: '☕', title: 'Tea & Lunch Included' },
        { icon: '🎁', title: 'Conference Kit' },
        { icon: '📸', title: 'Group Photography' },
    ],
    default: [
        { icon: '🎖', title: 'Participation Certificate' },
        { icon: '🍽', title: 'Refreshments Included' },
        { icon: '📸', title: 'Photography Allowed' },
        { icon: '🚑', title: 'Medical Support' },
        { icon: '🅿️', title: 'Parking Available' },
        { icon: '🛡️', title: 'Secure Entry' },
    ],
};

const CATEGORY_IMPORTANT_INFO = {
    marathon: [
        '🪪 Age Proof Mandatory at Registration Desk',
        '⏰ Report at least 45 minutes before flag-off',
        '🚫 No Spot Registration',
        '💳 Registration is Non-Refundable',
        '🏃 Participants must follow the official race route',
        '🚨 Organizer rules apply at all times',
    ],
    tournament: [
        '🪪 Valid ID Proof Mandatory for all participants',
        '⏰ Report 30 minutes before your scheduled match',
        '🚫 No Late Entries or Walkins',
        '💳 Entry Fees are Non-Refundable',
        '👕 Wear proper sports attire',
        '📋 Official tournament rules will be strictly followed',
    ],
    concert: [
        '🎫 Carry valid ticket or QR code for entry',
        '🚫 Outside food & beverages not permitted',
        '📸 Professional cameras not allowed',
        '🔞 Age verification may be required at entry',
        '🚨 Security checks mandatory at venue entrance',
        '♿ Accessible entry available',
    ],
    default: [
        '🪪 Valid ID Proof required at entry',
        '⏰ Report at least 30 minutes before the event',
        '🚫 No outside food or beverages',
        '💳 Registration is Non-Refundable',
        '🚨 Organizer rules apply at all times',
        '♿ Accessible entry available',
    ],
};

const CATEGORY_FAQS = {
    marathon: [
        { question: 'What time should I report?', answer: 'All participants must report at least 45 minutes before the flag-off time. Please check your bib collection schedule.' },
        { question: 'Can I transfer my registration?', answer: 'No. Registrations are non-transferable. The bib must be worn by the registered participant only.' },
        { question: 'Is parking available at the venue?', answer: 'Yes, limited parking is available near the event venue. We recommend arriving early or using public transport.' },
        { question: 'Will certificates be provided?', answer: 'Yes! All finishers will receive a digital participation certificate within 7 working days after the event.' },
        { question: 'What happens if the event is cancelled?', answer: 'In case of event cancellation, participants will be notified and registration fees may be refunded or transferred to a future event at the organizer\'s discretion.' },
    ],
    tournament: [
        { question: 'What documents are required for participation?', answer: 'Participants must carry valid age proof and their registration confirmation for the event.' },
        { question: 'What are the match rules?', answer: 'All matches will be conducted as per the official tournament rules shared during registration. Please review them carefully.' },
        { question: 'Can I participate in multiple categories?', answer: 'Yes, you may register for multiple categories, subject to availability and scheduling. Additional fees apply.' },
        { question: 'Will certificates be provided?', answer: 'Yes! All participants will receive participation certificates. Winners will additionally receive trophies and medals.' },
        { question: 'Is the registration fee refundable?', answer: 'No. Registration fees are non-refundable once payment is confirmed.' },
    ],
    default: [
        { question: 'What time should I report?', answer: 'Please report at least 30 minutes before the event start time to allow for check-in and registration.' },
        { question: 'Is parking available?', answer: 'Limited parking is available at the venue. We recommend arriving early.' },
        { question: 'What is the refund policy?', answer: 'Registration fees are non-refundable. Please review the terms & conditions before registering.' },
        { question: 'Will I receive a confirmation email?', answer: 'Yes, you will receive a booking confirmation email with your ticket/QR code upon successful registration.' },
    ],
};

// ─────────────────────────────────
// Accordion Component
// ─────────────────────────────────
function Accordion({ items }) {
    const [open, setOpen] = useState(null);
    return (
        <div className="space-y-2">
            {items.map((item, i) => (
                <div key={i} className="border border-slate-100 rounded-2xl overflow-hidden">
                    <button
                        onClick={() => setOpen(open === i ? null : i)}
                        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-slate-50 transition-colors"
                    >
                        <span className="text-sm font-bold text-slate-800 pr-4">{item.question}</span>
                        <span className="shrink-0 text-pink-500">
                            {open === i ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </span>
                    </button>
                    <AnimatePresence>
                        {open === i && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="overflow-hidden"
                            >
                                <div className="px-5 pb-4 pt-2 bg-slate-50 text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                                    {item.answer}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ))}
        </div>
    );
}

// ─────────────────────────────────
// Section Header
// ─────────────────────────────────
function SectionHeader({ icon: Icon, title, subtitle }) {
    return (
        <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-pink-200">
                <Icon size={18} />
            </div>
            <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{title}</h2>
                {subtitle && <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mt-0.5">{subtitle}</p>}
            </div>
        </div>
    );
}

// ─────────────────────────────────
// Main AboutEventSection Component
// ─────────────────────────────────
export default function AboutEventSection({ event, config = {} }) {
    const [dbData, setDbData] = useState(null);
    const [dbHighlights, setDbHighlights] = useState([]);
    const [dbFaqs, setDbFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rulesOpen, setRulesOpen] = useState(false);
    const [termsOpen, setTermsOpen] = useState(false);

    // Detect event category
    const category = (() => {
        const t = (event?.event_type || event?.type || config?.event_type || '').toLowerCase();
        if (t.includes('marathon') || t.includes('run')) return 'marathon';
        if (t.includes('tournament') || t.includes('sport') || t.includes('badminton') || t.includes('cricket') || t.includes('football') || t.includes('basketball')) return 'tournament';
        if (t.includes('concert') || t.includes('music') || t.includes('show')) return 'concert';
        if (t.includes('conference') || t.includes('corporate') || t.includes('seminar')) return 'conference';
        return 'default';
    })();

    useEffect(() => {
        if (!event?.id) { setLoading(false); return; }
        const fetchData = async () => {
            try {
                const [descResult, highlightResult, faqResult] = await Promise.all([
                    supabase.from('event_descriptions').select('*').eq('event_id', event.id).maybeSingle(),
                    supabase.from('event_highlights').select('*').eq('event_id', event.id).order('display_order'),
                    supabase.from('event_faqs').select('*').eq('event_id', event.id).order('display_order'),
                ]);
                setDbData(descResult.data);
                setDbHighlights(highlightResult.data || []);
                setDbFaqs(faqResult.data || []);
            } catch (e) {
                console.error('AboutEventSection fetch error:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [event?.id]);

    // Resolve content: DB > config > defaults
    const overview = dbData?.overview || config?.overview || event?.description || config?.description || null;
    const specialNote = dbData?.special_note || config?.awareness_text || config?.special_note || null;
    const rules = dbData?.rules || config?.rules || null;
    const terms = dbData?.terms || config?.terms_conditions || config?.terms || null;
    const benefits = dbData?.benefits || config?.benefits || [];
    const importantInfo = dbData?.important_info?.length > 0
        ? dbData.important_info
        : CATEGORY_IMPORTANT_INFO[category] || CATEGORY_IMPORTANT_INFO.default;

    const highlights = dbHighlights.length > 0
        ? dbHighlights
        : (CATEGORY_HIGHLIGHTS[category] || CATEGORY_HIGHLIGHTS.default);

    const faqs = dbFaqs.length > 0
        ? dbFaqs
        : (CATEGORY_FAQS[category] || CATEGORY_FAQS.default);

    // Parse jsonb arrays safely
    const safeArray = (v) => {
        if (!v) return [];
        if (Array.isArray(v)) return v;
        try { return JSON.parse(v); } catch { return []; }
    };

    const dbHighlightsList = safeArray(dbData?.highlights);
    const benefitsList = safeArray(benefits);

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-8 bg-slate-100 rounded-xl w-1/3" />
                <div className="h-4 bg-slate-100 rounded-xl w-full" />
                <div className="h-4 bg-slate-100 rounded-xl w-5/6" />
                <div className="h-4 bg-slate-100 rounded-xl w-4/6" />
            </div>
        );
    }

    return (
        <div className="space-y-8">

            {/* ── 1. Event Overview ── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 space-y-4"
            >
                <SectionHeader icon={BookOpen} title="About Event" subtitle="Event Overview" />

                {overview ? (
                    <div className="prose prose-slate max-w-none">
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{overview}</p>
                    </div>
                ) : (
                    <p className="text-sm text-slate-400 italic">No event description provided yet.</p>
                )}

                {/* Special Note Callout */}
                {specialNote && (
                    <div className="mt-4 p-5 bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-100 rounded-2xl">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={16} className="text-pink-500" />
                            <span className="text-xs font-black text-pink-600 uppercase tracking-widest">Special Note</span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed italic">"{specialNote}"</p>
                    </div>
                )}
            </motion.div>

            {/* ── 2. Highlights ── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6"
            >
                <SectionHeader icon={Star} title="Event Highlights" subtitle="What's included" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(dbHighlightsList.length > 0 ? dbHighlightsList : highlights).map((h, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-pink-200 transition-colors">
                            <span className="text-2xl leading-none">{h.icon}</span>
                            <span className="text-xs font-bold text-slate-700 leading-tight">{h.title}</span>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* ── 3. Benefits ── */}
            {benefitsList.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6"
                >
                    <SectionHeader icon={Trophy} title="Participant Benefits" subtitle="What you get" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {benefitsList.map((rawB, i) => {
                            let b = rawB;
                            if (typeof rawB === 'string') {
                                try {
                                    const parsed = JSON.parse(rawB);
                                    if (typeof parsed === 'object' && parsed !== null) b = parsed;
                                } catch(e) {}
                            }
                            const label = typeof b === 'string' ? b : b.benefit_name || b.title || b.label || '';
                            const iconKey = typeof b === 'string' ? 'star' : b.icon_key || 'check';
                            if (!label) return null;
                            
                            return (
                                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-pink-200 transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-slate-100">
                                        <AmenityIcon name={iconKey} size={16} className="text-pink-500" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700 leading-tight">{label}</span>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* ── 4. Rules & Regulations ── */}
            {rules && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6"
                >
                    <button
                        onClick={() => setRulesOpen(!rulesOpen)}
                        className="w-full flex items-center justify-between"
                    >
                        <SectionHeader icon={Shield} title="Rules & Regulations" subtitle="Please read carefully" />
                        <span className="text-pink-500 shrink-0 mb-5">
                            {rulesOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </span>
                    </button>
                    <AnimatePresence>
                        {rulesOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap pt-2 border-t border-slate-100">
                                    {rules}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {!rulesOpen && (
                        <p className="text-xs text-slate-400 mt-1">Click to expand rules & regulations</p>
                    )}
                </motion.div>
            )}

            {/* ── 5. Terms & Conditions ── */}
            {terms && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6"
                >
                    <button
                        onClick={() => setTermsOpen(!termsOpen)}
                        className="w-full flex items-center justify-between"
                    >
                        <SectionHeader icon={FileText} title="Terms & Conditions" subtitle="Important legal information" />
                        <span className="text-pink-500 shrink-0 mb-5">
                            {termsOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </span>
                    </button>
                    <AnimatePresence>
                        {termsOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap pt-2 border-t border-slate-100">
                                    {terms}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {!termsOpen && (
                        <p className="text-xs text-slate-400 mt-1">Click to expand terms & conditions</p>
                    )}
                </motion.div>
            )}

            {/* ── 6. Important Information ── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="bg-amber-50 border border-amber-200 rounded-[24px] p-6"
            >
                <SectionHeader icon={AlertTriangle} title="Important Information" subtitle="Please note before registering" />
                <ul className="space-y-2.5">
                    {(safeArray(dbData?.important_info).length > 0 ? safeArray(dbData.important_info) : importantInfo).map((info, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-amber-900 font-medium">
                            <span className="leading-tight">{info}</span>
                        </li>
                    ))}
                </ul>
            </motion.div>

            {/* ── 7. FAQs ── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6"
            >
                <SectionHeader icon={HelpCircle} title="Frequently Asked Questions" subtitle="Common queries answered" />
                <Accordion items={faqs} />
            </motion.div>

        </div>
    );
}
