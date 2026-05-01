'use client';

import React, { useState, useEffect } from 'react';
import { 
    Ticket, 
    Plus, 
    Trash2, 
    Calendar, 
    Tag, 
    Percent, 
    DollarSign, 
    CheckCircle2, 
    XCircle,
    Info,
    ArrowRight,
    Search,
    X,
    Filter,
    Clock
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function CouponManagement({ user }) {
    const [coupons, setCoupons] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [newCoupon, setNewCoupon] = useState({
        code: '',
        type: 'percent',
        value: '',
        min_tickets: 1,
        max_tickets: '',
        usage_limit_per_user: 1,
        global_usage_limit: '',
        expiry_date: '',
        applicable_events: []
    });

    useEffect(() => {
        if (user?.id) {
            fetchData();
        }
    }, [user?.id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Organiser's Events
            const { data: eventData } = await supabase
                .from('events')
                .select('id, title')
                .eq('organiser_id', user.id);
            
            setEvents(eventData || []);

            // Fetch Coupons
            // Note: Since 'coupons' table doesn't have an 'organiser_id', 
            // we might need to filter by those that are applicable to the organiser's events
            // OR the migration should have included organiser_id.
            // Looking back at the migration, it didn't have organiser_id.
            // Let's assume for now organisers can see coupons where they are in applicable_events 
            // or we might need to update the schema.
            
            // Actually, if an organiser creates a coupon, it should be linked to them.
            // Let's check the migration again. 
            // It had: CREATE TABLE IF NOT EXISTS public.coupons ( ... applicable_events UUID[] ... );
            
            const { data: couponData } = await supabase
                .from('coupons')
                .select('*')
                .order('created_at', { ascending: false });
            
            // Filter coupons that are either global (null applicable_events) or belong to organiser's events
            const eventIds = (eventData || []).map(e => e.id);
            const filteredCoupons = (couponData || []).filter(c => {
                if (!c.applicable_events || c.applicable_events.length === 0) return true; // Global
                return c.applicable_events.some(id => eventIds.includes(id));
            });

            setCoupons(filteredCoupons);
        } catch (err) {
            console.error("Fetch Data Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCoupon = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            const couponData = {
                code: newCoupon.code.toUpperCase().trim(),
                type: newCoupon.type,
                value: parseFloat(newCoupon.value),
                min_tickets: parseInt(newCoupon.min_tickets),
                max_tickets: newCoupon.max_tickets ? parseInt(newCoupon.max_tickets) : null,
                usage_limit_per_user: parseInt(newCoupon.usage_limit_per_user),
                global_usage_limit: newCoupon.global_usage_limit ? parseInt(newCoupon.global_usage_limit) : null,
                expiry_date: newCoupon.expiry_date || null,
                applicable_events: newCoupon.applicable_events.length > 0 ? newCoupon.applicable_events : null,
                is_active: true
            };

            const { error } = await supabase.from('coupons').insert([couponData]);
            
            if (error) throw error;

            setShowCreateModal(false);
            setNewCoupon({
                code: '',
                type: 'percent',
                value: '',
                min_tickets: 1,
                max_tickets: '',
                usage_limit_per_user: 1,
                global_usage_limit: '',
                expiry_date: '',
                applicable_events: []
            });
            fetchData();
            alert("Coupon created successfully!");
        } catch (err) {
            alert(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleCouponStatus = async (id, currentStatus) => {
        const { error } = await supabase
            .from('coupons')
            .update({ is_active: !currentStatus })
            .eq('id', id);
        
        if (!error) fetchData();
    };

    const deleteCoupon = async (id) => {
        if (!confirm("Are you sure you want to delete this coupon?")) return;
        
        const { error } = await supabase
            .from('coupons')
            .delete()
            .eq('id', id);
        
        if (!error) fetchData();
    };

    const filteredCoupons = coupons.filter(c => 
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <div className="w-12 h-12 border-4 border-pink-100 border-t-pink-500 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-8 font-['Inter'] animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Coupon Management</h2>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Create and manage discount offers</p>
                </div>
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-pink-500 transition-all shadow-xl shadow-slate-200"
                >
                    <Plus size={18} />
                    Create Coupon
                </button>
            </div>

            {/* Search & Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search coupons by code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-[2rem] text-sm font-bold focus:ring-4 focus:ring-pink-500/10 outline-none shadow-sm transition-all"
                    />
                </div>
                <div className="bg-white px-8 py-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Coupons</p>
                        <p className="text-2xl font-black text-slate-900">{coupons.filter(c => c.is_active).length}</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                        <CheckCircle2 size={24} />
                    </div>
                </div>
            </div>

            {/* Coupon Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCoupons.length === 0 ? (
                    <div className="md:col-span-2 lg:col-span-3 py-20 text-center space-y-4">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto">
                            <Ticket size={40} />
                        </div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No coupons found</p>
                    </div>
                ) : filteredCoupons.map(coupon => (
                    <div key={coupon.id} className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-300">
                        <div className="p-8 space-y-6">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase">{coupon.code}</h3>
                                        <button 
                                            onClick={() => toggleCouponStatus(coupon.id, coupon.is_active)}
                                            className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-colors ${coupon.is_active ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}
                                        >
                                            {coupon.is_active ? 'Active' : 'Inactive'}
                                        </button>
                                    </div>
                                    <p className="text-[11px] font-black text-pink-500 uppercase tracking-widest">
                                        {coupon.type === 'percent' ? `${coupon.value}% Discount` : `₹${coupon.value} OFF`}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => deleteCoupon(coupon.id)}
                                    className="p-3 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 py-6 border-y border-slate-50">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Usage Limit</p>
                                    <p className="text-xs font-bold text-slate-900">{coupon.global_usage_limit || 'Unlimited'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Min Tickets</p>
                                    <p className="text-xs font-bold text-slate-900">{coupon.min_tickets}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Max Tickets</p>
                                    <p className="text-xs font-bold text-slate-900">{coupon.max_tickets || 'Unlimited'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Per User</p>
                                    <p className="text-xs font-bold text-slate-900">{coupon.usage_limit_per_user}</p>
                                </div>
                                <div className="space-y-1 text-rose-500">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Expiry</p>
                                    <p className="text-xs font-bold">{coupon.expiry_date ? new Date(coupon.expiry_date).toLocaleDateString() : 'Never'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                <Tag size={12} className="text-pink-500" />
                                {coupon.applicable_events && coupon.applicable_events.length > 0 
                                    ? `${coupon.applicable_events.length} Specific Events` 
                                    : 'All Your Events'}
                            </div>
                        </div>
                    </div>
                ))}\
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Create <span className="text-pink-500">Coupon</span></h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Setup new discount offer</p>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} className="p-4 hover:bg-white rounded-full transition-all text-slate-400">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreateCoupon} className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Coupon Code</label>
                                    <input 
                                        required
                                        type="text" 
                                        placeholder="E.g. SUMMER10"
                                        value={newCoupon.code}
                                        onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value})}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black focus:ring-4 focus:ring-pink-500/10 outline-none transition-all uppercase"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Discount Type</label>
                                    <select 
                                        value={newCoupon.type}
                                        onChange={(e) => setNewCoupon({...newCoupon, type: e.target.value})}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black focus:ring-4 focus:ring-pink-500/10 outline-none transition-all"
                                    >
                                        <option value="percent">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (₹)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                        {newCoupon.type === 'percent' ? 'Discount Percentage' : 'Discount Amount'}
                                    </label>
                                    <input 
                                        required
                                        type="number" 
                                        placeholder={newCoupon.type === 'percent' ? 'e.g. 10' : 'e.g. 100'}
                                        value={newCoupon.value}
                                        onChange={(e) => setNewCoupon({...newCoupon, value: e.target.value})}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black focus:ring-4 focus:ring-pink-500/10 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Min Tickets Required</label>
                                    <input 
                                        type="number" 
                                        value={newCoupon.min_tickets}
                                        onChange={(e) => setNewCoupon({...newCoupon, min_tickets: e.target.value})}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black focus:ring-4 focus:ring-pink-500/10 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Max Tickets Allowed (Optional)</label>
                                    <input 
                                        type="number" 
                                        placeholder="No limit if empty"
                                        value={newCoupon.max_tickets}
                                        onChange={(e) => setNewCoupon({...newCoupon, max_tickets: e.target.value})}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black focus:ring-4 focus:ring-pink-500/10 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Limit Per User</label>
                                    <input 
                                        type="number" 
                                        value={newCoupon.usage_limit_per_user}
                                        onChange={(e) => setNewCoupon({...newCoupon, usage_limit_per_user: e.target.value})}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black focus:ring-4 focus:ring-pink-500/10 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Usage Limit (Optional)</label>
                                    <input 
                                        type="number" 
                                        placeholder="Unlimited if empty"
                                        value={newCoupon.global_usage_limit}
                                        onChange={(e) => setNewCoupon({...newCoupon, global_usage_limit: e.target.value})}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black focus:ring-4 focus:ring-pink-500/10 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expiry Date (Optional)</label>
                                    <input 
                                        type="date" 
                                        value={newCoupon.expiry_date}
                                        onChange={(e) => setNewCoupon({...newCoupon, expiry_date: e.target.value})}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black focus:ring-4 focus:ring-pink-500/10 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Applicable Events (Select none for all your events)</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-4 bg-slate-50 rounded-3xl border border-slate-100">
                                    {events.map(event => (
                                        <label key={event.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 cursor-pointer hover:border-pink-200 transition-all">
                                            <input 
                                                type="checkbox" 
                                                checked={newCoupon.applicable_events.includes(event.id)}
                                                onChange={(e) => {
                                                    const updated = e.target.checked 
                                                        ? [...newCoupon.applicable_events, event.id]
                                                        : newCoupon.applicable_events.filter(id => id !== event.id);
                                                    setNewCoupon({...newCoupon, applicable_events: updated});
                                                }}
                                                className="w-4 h-4 rounded text-pink-500 focus:ring-pink-500"
                                            />
                                            <span className="text-xs font-bold text-slate-700 truncate">{event.title}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6">
                                <button 
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.2em] hover:bg-pink-600 disabled:opacity-50 shadow-2xl shadow-pink-100/50 transition-all transform active:scale-95 flex items-center justify-center gap-3"
                                >
                                    {isSubmitting ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Ticket size={20} />
                                            Activate Coupon
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
