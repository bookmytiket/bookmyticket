"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
    Zap, Clock, ShoppingCart, Percent, 
    ArrowRight, Tag, Save, Plus, Trash2,
    Calendar, Sparkles
} from 'lucide-react';

export default function FlashAdmin({ t }) {
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [events, setEvents] = useState([]);
    const [formData, setFormData] = useState({
        event_id: '',
        discount_type: 'percent',
        discount_value: '',
        starts_at: '',
        ends_at: '',
        quantity_limit: 50,
        is_active: true
    });

    useEffect(() => {
        const fetchData = async () => {
            const [dealsRes, eventsRes] = await Promise.all([
                supabase.from('flash_deals').select('*, events(title)').order('created_at', { ascending: false }),
                supabase.from('events').select('id, title').eq('publish_status', 'published')
            ]);
            setDeals(dealsRes.data || []);
            setEvents(eventsRes.data || []);
            setLoading(false);
        };
        fetchData();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        const { error } = await supabase.from('flash_deals').insert(formData);
        if (!error) {
            setShowForm(false);
            setFormData({ event_id: '', discount_type: 'percent', discount_value: '', starts_at: '', ends_at: '', quantity_limit: 50, is_active: true });
            // Refresh
            const { data } = await supabase.from('flash_deals').select('*, events(title)').order('created_at', { ascending: false });
            setDeals(data || []);
        }
    };

    if (loading) return <div className="p-20 text-center text-slate-400">Igniting flash deals...</div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none flex items-center gap-4">
                        Flash Sales Engine <Zap className="text-orange-500" />
                    </h2>

                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">Manage limited-time velocity offers</p>
                </div>
                <button 
                    onClick={() => setShowForm(true)}
                    className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:scale-105 transition-all flex items-center gap-3"
                >
                    <Plus size={18} /> New Campaign
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {deals.map(deal => (
                    <div key={deal.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                        <div className="flex items-center justify-between mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center">
                                <Zap size={24} />
                            </div>
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${deal.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                {deal.is_active ? 'Active' : 'Expired'}
                            </span>
                        </div>
                        <h4 className="text-sm font-black text-slate-900 uppercase italic mb-2">{deal.events?.title || 'Unknown Event'}</h4>
                        <div className="flex items-center gap-4 mb-6">
                            <span className="text-2xl font-black text-orange-500">
                                {deal.discount_type === 'percent' ? `${deal.discount_value}% OFF` : `₹${deal.discount_value} OFF`}
                            </span>
                            <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-full text-[10px] font-black uppercase">{deal.quantity_limit} Left</span>
                        </div>
                        <div className="space-y-3 pt-6 border-t border-slate-50">
                            <div className="flex items-center gap-3 text-slate-400">
                                <Clock size={12} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Expires: {new Date(deal.ends_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showForm && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/20 backdrop-blur-xl p-6">
                    <div className="bg-white w-full max-w-xl rounded-[3rem] p-12 shadow-2xl border border-white">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-2xl font-black text-slate-900 uppercase italic">Configure Campaign</h3>
                            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-900"><Trash2 size={24} /></button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Target Event</label>
                                <select 
                                    className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-black text-slate-900 outline-none"
                                    value={formData.event_id}
                                    onChange={e => setFormData({...formData, event_id: e.target.value})}
                                    required
                                >
                                    <option value="">Select Event</option>
                                    {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Discount Type</label>
                                    <select 
                                        className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-black text-slate-900 outline-none"
                                        value={formData.discount_type}
                                        onChange={e => setFormData({...formData, discount_type: e.target.value})}
                                    >
                                        <option value="percent">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (₹)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Value</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-black text-slate-900 outline-none"
                                        value={formData.discount_value}
                                        onChange={e => setFormData({...formData, discount_value: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>
                            <button 
                                type="submit"
                                className="w-full py-5 bg-orange-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[12px] shadow-2xl shadow-orange-500/20 hover:scale-[1.02] transition-all"
                            >
                                Deploy Flash Sale
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
