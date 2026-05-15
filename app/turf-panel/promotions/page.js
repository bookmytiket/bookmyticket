"use client";
import React, { useState } from "react";
import { 
    Sparkles, Plus, Trash2, Edit3, 
    Zap, Calendar, Percent, Ticket,
    ChevronRight, Tag, Clock, Globe
} from "lucide-react";
import { useSupabaseQuery, useSupabaseMutation } from "@/hooks/useSupabase";
import { useAuth } from "@/components/AuthContext";
import { useToast } from "@/context/ToastContext";

const PROMO_TYPES = [
    { id: "fixed", label: "FIXED DISCOUNT", icon: IndianRupee },
    { id: "percentage", label: "PERCENTAGE", icon: Percent },
    { id: "seasonal", label: "SEASONAL FLOW", icon: Globe },
    { id: "peak", label: "PEAK SURGE OFF", icon: Zap },
];

export default function PromotionsPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPromo, setSelectedPromo] = useState(null);

    const { data: promotions = [], reload: reloadPromos } = useSupabaseQuery('turf_promotions', (q) => 
        q.order('created_at', { ascending: false })
    , [user?.id]);

    const [createPromo] = useSupabaseMutation('turf_promotions', 'insert');
    const [updatePromo] = useSupabaseMutation('turf_promotions', 'update', (q, p) => q.eq('id', p.id));
    const [deletePromo] = useSupabaseMutation('turf_promotions', 'delete', (q, p) => q.eq('id', p.id));

    const initialForm = {
        code: "",
        description: "",
        discount_type: "percentage",
        discount_value: 0,
        min_booking_amount: 0,
        max_discount: 0,
        start_date: new Date().toISOString().split('T')[0],
        end_date: "",
        is_active: true
    };

    const [formData, setFormData] = useState(initialForm);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (selectedPromo) {
                await updatePromo({ ...formData, id: selectedPromo.id });
                showToast("Campaign synchronized", "success");
            } else {
                await createPromo({ ...formData, partner_id: user.id });
                showToast("Promotion deployed", "success");
            }
            setIsModalOpen(false);
            reloadPromos();
        } catch (err) {
            showToast(err.message, "error");
        }
    };

    return (
        <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-1000">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 px-4">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[1.8rem] bg-pink-500 flex items-center justify-center text-white shadow-xl shadow-pink-100 shrink-0">
                        <Sparkles size={28} />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-[#1A1C2E] tracking-tighter uppercase italic leading-none">MARKETING HUB</h2>
                        <p className="text-slate-400 font-bold text-sm mt-2 uppercase tracking-widest">Growth and discount engine</p>
                    </div>
                </div>
                
                <button 
                    onClick={() => { setFormData(initialForm); setSelectedPromo(null); setIsModalOpen(true); }}
                    className="px-10 py-5 bg-[#0F1115] text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-slate-200"
                >
                    <Plus size={20} strokeWidth={3} />
                    INITIALIZE CAMPAIGN
                </button>
            </div>

            {/* Campaign Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {promotions.map((promo) => (
                    <div key={promo.id} className="bg-white rounded-[4rem] border border-slate-50 p-10 shadow-sm hover:shadow-2xl hover:border-pink-50 transition-all group relative overflow-hidden">
                        <div className="relative z-10 space-y-8">
                            <div className="flex justify-between items-start">
                                <div className="w-16 h-16 rounded-[1.5rem] bg-pink-50 text-[#f84464] flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm">
                                    <Tag size={30} />
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => { setSelectedPromo(promo); setFormData(promo); setIsModalOpen(true); }} className="p-3 bg-slate-50 text-slate-300 rounded-2xl hover:bg-[#1A1C2E] hover:text-white transition-all shadow-sm">
                                        <Edit3 size={18} />
                                    </button>
                                    <button onClick={() => { if(confirm("Terminate this campaign?")) deletePromo({ id: promo.id }).then(reloadPromos); }} className="p-3 bg-slate-50 text-red-300 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-3xl font-black text-[#1A1C2E] uppercase italic tracking-tighter">{promo.code}</h3>
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{promo.description}</p>
                            </div>

                            <div className="p-8 bg-slate-50 rounded-[2.5rem] space-y-6">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">YIELD OFFSET</span>
                                    <span className="text-base font-black text-[#f84464] italic">
                                        {promo.discount_type === 'percentage' ? `-${promo.discount_value}%` : `-₹${promo.discount_value}`}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">STATUS</span>
                                    <span className={`text-[10px] font-black uppercase tracking-tighter ${promo.is_active ? 'text-emerald-500' : 'text-slate-300'}`}>
                                        {promo.is_active ? 'OPERATIONAL' : 'DORMANT'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between px-2 pt-2">
                                <div className="flex items-center gap-3 text-slate-400">
                                    <Calendar size={14} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">{promo.start_date} · {promo.end_date || 'FOREVER'}</span>
                                </div>
                                <div className="text-[9px] font-black text-slate-200 uppercase tracking-[0.3em]">
                                    GLOBAL
                                </div>
                            </div>
                        </div>
                        <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-pink-500 opacity-5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                    </div>
                ))}

                {promotions.length === 0 && (
                    <div className="bg-white rounded-[4rem] border-2 border-dashed border-slate-100 p-32 text-center space-y-10 col-span-full">
                        <div className="w-28 h-28 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                            <Sparkles size={56} />
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-3xl font-black text-[#1A1C2E] uppercase italic tracking-tighter">NO CAMPAIGNS ACTIVE</h3>
                            <p className="text-slate-300 font-bold uppercase text-[10px] tracking-[0.3em]">Deploy your first offer to stimulate business</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-[#1A1C2E]/60 backdrop-blur-md overflow-y-auto">
                    <div className="bg-white rounded-[4rem] w-full max-w-4xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-10 right-10 p-4 bg-slate-50 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all z-20">
                            <XCircle size={24} />
                        </button>
                        
                        <div className="p-16 md:p-24 space-y-16">
                            <div className="space-y-4">
                                <h3 className="text-4xl font-black text-[#1A1C2E] uppercase italic tracking-tighter leading-none">CAMPAIGN CONFIG</h3>
                                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">Define your marketing parameters</p>
                            </div>

                            <form onSubmit={handleSave} className="space-y-12">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] ml-2">PROMO CODE</label>
                                        <input 
                                            required
                                            className="w-full bg-slate-50 p-6 rounded-[1.8rem] text-sm font-black border-none focus:ring-4 focus:ring-pink-500/5 transition-all uppercase italic"
                                            value={formData.code}
                                            onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                            placeholder="e.g. SUMMER2024"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] ml-2">DISCOUNT TYPE</label>
                                        <select 
                                            className="w-full bg-slate-50 p-6 rounded-[1.8rem] text-sm font-black border-none focus:ring-4 focus:ring-pink-500/5 transition-all uppercase italic"
                                            value={formData.discount_type}
                                            onChange={(e) => setFormData({...formData, discount_type: e.target.value})}
                                        >
                                            <option value="percentage">PERCENTAGE (%)</option>
                                            <option value="fixed">FIXED AMOUNT (₹)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] ml-2">VALUE</label>
                                        <input 
                                            type="number"
                                            required
                                            className="w-full bg-slate-50 p-6 rounded-[1.8rem] text-sm font-black border-none focus:ring-4 focus:ring-pink-500/5 transition-all uppercase italic"
                                            value={formData.discount_value}
                                            onChange={(e) => setFormData({...formData, discount_value: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] ml-2">END DATE</label>
                                        <input 
                                            type="date"
                                            className="w-full bg-slate-50 p-6 rounded-[1.8rem] text-sm font-black border-none focus:ring-4 focus:ring-pink-500/5 transition-all uppercase italic"
                                            value={formData.end_date}
                                            onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-4">
                                        <label className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] ml-2">CAMPAIGN DESCRIPTION</label>
                                        <input 
                                            className="w-full bg-slate-50 p-6 rounded-[1.8rem] text-sm font-black border-none focus:ring-4 focus:ring-pink-500/5 transition-all uppercase italic"
                                            value={formData.description}
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                            placeholder="BRIEF OVERVIEW OF THIS OFFER"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-6 pt-10">
                                    <button 
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-12 py-6 bg-slate-50 text-slate-400 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                                    >
                                        ABORT
                                    </button>
                                    <button 
                                        type="submit"
                                        className="px-16 py-6 bg-[#1A1C2E] text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-black transition-all"
                                    >
                                        DEPLOY CAMPAIGN
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
