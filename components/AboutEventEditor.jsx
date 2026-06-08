"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Save, Plus, Trash2, ChevronDown, ChevronUp,
    Sparkles, BookOpen, Star, Shield, FileText,
    HelpCircle, AlertTriangle, Loader2, CheckCircle2, X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ─────────────────────────────────
// Default emoji icons for highlights
// ─────────────────────────────────
const QUICK_ICONS = ['🏅', '🎖', '🏆', '🎁', '🍽', '💧', '🚑', '📸', '🅿️', '🎵', '📚', '🤝', '☕', '🛡️', '⚡', '🎯', '✅', '🌟', '👕', '📋'];

// ─────────────────────────────────
// Section Wrapper
// ─────────────────────────────────
function EditorSection({ icon: Icon, title, children, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                type="button"
                className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white">
                        <Icon size={15} />
                    </div>
                    <span className="text-sm font-black text-slate-800 uppercase tracking-wide">{title}</span>
                </div>
                {open ? <ChevronUp size={18} className="text-pink-500" /> : <ChevronDown size={18} className="text-slate-400" />}
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <div className="p-5 bg-white border-t border-slate-100 space-y-4">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─────────────────────────────────
// Textarea Field
// ─────────────────────────────────
function TextareaField({ label, value, onChange, placeholder, rows = 4, hint }) {
    return (
        <div className="space-y-1.5">
            {label && <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>}
            {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
            <textarea
                value={value || ''}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-300 transition-all resize-none placeholder:text-slate-300"
            />
        </div>
    );
}

// ─────────────────────────────────
// Main AboutEventEditor Component
// ─────────────────────────────────
export default function AboutEventEditor({ eventId, eventType }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [form, setForm] = useState({
        overview: '', special_note: '', rules: '', terms: '',
        benefits: [], important_info: [], highlights: [], schedule: [],
    });
    const [highlights, setHighlights] = useState([]);
    const [faqs, setFaqs] = useState([]);

    // Load existing data
    useEffect(() => {
        if (!eventId) return;
        const load = async () => {
            try {
                const [descRes, hlRes, faqRes] = await Promise.all([
                    supabase.from('event_descriptions').select('*').eq('event_id', eventId).maybeSingle(),
                    supabase.from('event_highlights').select('*').eq('event_id', eventId).order('display_order'),
                    supabase.from('event_faqs').select('*').eq('event_id', eventId).order('display_order'),
                ]);
                if (descRes.data) {
                    setForm({
                        overview: descRes.data.overview || '',
                        special_note: descRes.data.special_note || '',
                        rules: descRes.data.rules || '',
                        terms: descRes.data.terms || '',
                        benefits: safeArray(descRes.data.benefits),
                        important_info: safeArray(descRes.data.important_info),
                        highlights: safeArray(descRes.data.highlights),
                        schedule: safeArray(descRes.data.schedule),
                    });
                }
                setHighlights(hlRes.data?.length > 0 ? hlRes.data : [{ icon: '🏅', title: '' }]);
                setFaqs(faqRes.data?.length > 0 ? faqRes.data : [{ question: '', answer: '' }]);
            } catch (e) {
                console.error('Load error:', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [eventId]);

    const safeArray = (v) => {
        if (!v) return [];
        if (Array.isArray(v)) return v;
        try { return JSON.parse(v); } catch { return []; }
    };

    const handleSave = async () => {
        if (!eventId) return;
        setSaving(true);
        try {
            // Upsert event_descriptions
            const descPayload = {
                event_id: eventId,
                overview: form.overview,
                special_note: form.special_note,
                rules: form.rules,
                terms: form.terms,
                benefits: form.benefits,
                important_info: form.important_info,
                highlights: form.highlights,
                schedule: form.schedule,
            };
            const { error: descErr } = await supabase
                .from('event_descriptions')
                .upsert(descPayload, { onConflict: 'event_id' });
            if (descErr) throw descErr;

            // Replace highlights
            await supabase.from('event_highlights').delete().eq('event_id', eventId);
            const validHighlights = highlights.filter(h => h.title?.trim());
            if (validHighlights.length > 0) {
                await supabase.from('event_highlights').insert(
                    validHighlights.map((h, i) => ({ event_id: eventId, icon: h.icon || '🎖', title: h.title, display_order: i }))
                );
            }

            // Replace FAQs
            await supabase.from('event_faqs').delete().eq('event_id', eventId);
            const validFaqs = faqs.filter(f => f.question?.trim() && f.answer?.trim());
            if (validFaqs.length > 0) {
                await supabase.from('event_faqs').insert(
                    validFaqs.map((f, i) => ({ event_id: eventId, question: f.question, answer: f.answer, display_order: i }))
                );
            }

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            console.error('Save error:', e);
            alert('Error saving. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const updateHighlight = (i, field, val) => {
        setHighlights(prev => prev.map((h, idx) => idx === i ? { ...h, [field]: val } : h));
    };
    const addHighlight = () => setHighlights(prev => [...prev, { icon: '🎖', title: '' }]);
    const removeHighlight = (i) => setHighlights(prev => prev.filter((_, idx) => idx !== i));

    const updateFaq = (i, field, val) => {
        setFaqs(prev => prev.map((f, idx) => idx === i ? { ...f, [field]: val } : f));
    };
    const addFaq = () => setFaqs(prev => [...prev, { question: '', answer: '' }]);
    const removeFaq = (i) => setFaqs(prev => prev.filter((_, idx) => idx !== i));

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-pink-500" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-black text-slate-900">About Event Content</h3>
                    <p className="text-xs text-slate-400 mt-1">Provide rich information to help attendees understand your event</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wide transition-all ${
                        saved
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:scale-105 shadow-lg shadow-pink-200'
                    } disabled:opacity-60`}
                >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                    {saving ? 'Saving...' : saved ? 'Saved!' : 'Save All'}
                </button>
            </div>

            {/* 1. Event Overview */}
            <EditorSection icon={BookOpen} title="Event Overview" defaultOpen={true}>
                <TextareaField
                    label="Event Description"
                    value={form.overview}
                    onChange={v => setForm(f => ({ ...f, overview: v }))}
                    placeholder={`Describe your event in detail. Include what participants can expect, who should attend, and why this event is special.`}
                    rows={6}
                />
                <TextareaField
                    label="Special Note / Awareness Text"
                    value={form.special_note}
                    onChange={v => setForm(f => ({ ...f, special_note: v }))}
                    placeholder="Any special instructions, awareness message, or key highlight for attendees..."
                    rows={2}
                />
            </EditorSection>

            {/* 2. Highlights */}
            <EditorSection icon={Star} title="Event Highlights">
                <p className="text-xs text-slate-400 mb-3">Add emoji icons with a short title to showcase key features of your event</p>
                <div className="space-y-2">
                    {highlights.map((h, i) => (
                        <div key={i} className="flex items-center gap-2">
                            {/* Icon picker */}
                            <select
                                value={h.icon}
                                onChange={e => updateHighlight(i, 'icon', e.target.value)}
                                className="w-16 text-center bg-slate-50 border border-slate-200 rounded-xl py-2 text-lg focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                            >
                                {QUICK_ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                            </select>
                            <input
                                value={h.title}
                                onChange={e => updateHighlight(i, 'title', e.target.value)}
                                placeholder="e.g. Medal for All Finishers"
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                            />
                            <button onClick={() => removeHighlight(i)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>
                <button
                    onClick={addHighlight}
                    className="mt-3 flex items-center gap-2 text-pink-500 hover:text-pink-700 font-bold text-xs uppercase tracking-widest"
                >
                    <Plus size={14} /> Add Highlight
                </button>
            </EditorSection>

            {/* 3. Rules & Regulations */}
            <EditorSection icon={Shield} title="Rules & Regulations">
                <TextareaField
                    value={form.rules}
                    onChange={v => setForm(f => ({ ...f, rules: v }))}
                    placeholder={`List the rules for your event. Each rule on a new line.\n\n• Participants must carry valid ID\n• Report 30 minutes before start\n• Follow organizer instructions...`}
                    rows={6}
                />
            </EditorSection>

            {/* 4. Terms & Conditions */}
            <EditorSection icon={FileText} title="Terms & Conditions">
                <TextareaField
                    value={form.terms}
                    onChange={v => setForm(f => ({ ...f, terms: v }))}
                    placeholder={`Enter your event terms & conditions.\n\n• Registration fee is non-refundable\n• Organizer reserves the right to change event details\n• Participants attend at their own risk...`}
                    rows={6}
                />
            </EditorSection>

            {/* 5. Important Information */}
            <EditorSection icon={AlertTriangle} title="Important Information">
                <p className="text-xs text-slate-400">One item per line. Use emojis for visual impact (e.g. 🪪 Age Proof Mandatory)</p>
                <TextareaField
                    value={(form.important_info || []).join('\n')}
                    onChange={v => setForm(f => ({ ...f, important_info: v.split('\n').filter(Boolean) }))}
                    placeholder={`🪪 Age Proof Mandatory\n⏰ Report 30 minutes before\n🚫 No Spot Registration\n💳 Non-Refundable Registration`}
                    rows={5}
                />
            </EditorSection>

            {/* 6. FAQs */}
            <EditorSection icon={HelpCircle} title="Frequently Asked Questions">
                <div className="space-y-4">
                    {faqs.map((f, i) => (
                        <div key={i} className="bg-slate-50 rounded-2xl p-4 space-y-2 relative">
                            <button
                                onClick={() => removeFaq(i)}
                                className="absolute top-3 right-3 p-1 text-rose-400 hover:text-rose-600 transition-colors"
                            >
                                <X size={14} />
                            </button>
                            <input
                                value={f.question}
                                onChange={e => updateFaq(i, 'question', e.target.value)}
                                placeholder="Question: e.g. What time should I report?"
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500/20 pr-8"
                            />
                            <textarea
                                value={f.answer}
                                onChange={e => updateFaq(i, 'answer', e.target.value)}
                                placeholder="Answer: Provide a clear and helpful answer..."
                                rows={2}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-pink-500/20 resize-none"
                            />
                        </div>
                    ))}
                </div>
                <button
                    onClick={addFaq}
                    className="mt-3 flex items-center gap-2 text-pink-500 hover:text-pink-700 font-bold text-xs uppercase tracking-widest"
                >
                    <Plus size={14} /> Add FAQ
                </button>
            </EditorSection>
        </div>
    );
}
