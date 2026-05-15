"use client";
import React, { useState } from "react";
import { 
    CreditCard, Zap, Shield, TrendingUp, 
    Calendar, Clock, Plus, Trash2, Edit3,
    ArrowUpRight, Info, CheckCircle2, X,
    Star, Flame, Snowflake, Sparkles
} from "lucide-react";
import { useSupabaseQuery, useSupabaseMutation } from "@/hooks/useSupabase";
import { useAuth } from "@/components/AuthContext";
import { useToast } from "@/context/ToastContext";

const RULE_TYPES = [
    { id: 'weekend', name: 'Weekend Spike', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'peak', name: 'Peak Hour Premium', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'holiday', name: 'Holiday Special', icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 'promo', name: 'Discount Campaign', icon: Snowflake, color: 'text-indigo-500', bg: 'bg-indigo-50' },
];

export default function PricingPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRule, setSelectedRule] = useState(null);

    const { data: turfs = [] } = useSupabaseQuery('turfs', (q) => 
        q.eq('partner_id', user?.id)
    , [user?.id]);

    const { data: rules = [], reload: reloadRules } = useSupabaseQuery('turf_pricing_rules', (q) => 
        q.order('created_at', { ascending: false })
    , [user?.id]);

    const [createRule] = useSupabaseMutation('turf_pricing_rules', 'insert');
    const [updateRule] = useSupabaseMutation('turf_pricing_rules', 'update', (q, p) => q.eq('id', p.id));
    const [deleteRule] = useSupabaseMutation('turf_pricing_rules', 'delete', (q, p) => q.eq('id', p.id));

    const initialForm = {
        rule_name: "",
        rule_type: "peak",
        adjustment_type: "fixed",
        adjustment_value: 0,
        start_time: "18:00",
        end_time: "21:00",
        days_of_week: [],
        turf_id: "",
        is_active: true
    };

    const [formData, setFormData] = useState(initialForm);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (selectedRule) {
                await updateRule({ ...formData, id: selectedRule.id });
                showToast("Policy synchronized", "success");
            } else {
                await createRule(formData);
                showToast("Surge rule deployed", "success");
            }
            setIsModalOpen(false);
            reloadRules();
        } catch (err) {
            showToast(err.message, "error");
        }
    };

    return (
        <div className="space-y-12 animate-in slide-in-from-right-8 duration-1000">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 px-4">
                <div>
                    <h2 className="text-4xl font-black text-[#1A1C2E] tracking-tighter uppercase italic leading-none">PRICING ENGINE</h2>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">Configure dynamic yield optimization and surge pricing rules</p>
                </div>
                <button 
                    onClick={() => { setFormData({...initialForm, turf_id: turfs[0]?.id}); setSelectedRule(null); setIsModalOpen(true); }}
                    className="px-10 py-5 bg-[#0F1115] text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:scale-[1.02] transition-all shadow-2xl shadow-slate-200"
                >
                    <Plus size={20} strokeWidth={3} /> ADD SURGE RULE
                </button>
            </div>

            {/* Rules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {rules.map((rule) => {
                    const cfg = RULE_TYPES.find(t => t.id === rule.rule_type) || RULE_TYPES[1];
                    return (
                        <div key={rule.id} className="bg-white rounded-[4rem] border border-slate-50 p-10 shadow-sm hover:shadow-2xl hover:border-pink-50 transition-all group relative overflow-hidden">
                            <div className="relative z-10 space-y-8">
                                <div className="flex justify-between items-start">
                                    <div className={`w-16 h-16 rounded-[1.5rem] ${cfg.bg} ${cfg.color} flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}>
                                        <cfg.icon size={30} />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => { setSelectedRule(rule); setFormData(rule); setIsModalOpen(true); }} className="p-3 bg-slate-50 text-slate-300 rounded-2xl hover:bg-[#1A1C2E] hover:text-white transition-all shadow-sm">
                                            <Edit3 size={18} />
                                        </button>
                                        <button onClick={() => { if(confirm("Terminate this rule?")) deleteRule({ id: rule.id }).then(reloadRules); }} className="p-3 bg-slate-50 text-red-300 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-[#1A1C2E] uppercase italic tracking-tighter">{rule.rule_name}</h3>
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{cfg.name}</p>
                                </div>

                                <div className="p-8 bg-slate-50 rounded-[2.5rem] space-y-6">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">ADJUSTMENT</span>
                                        <span className="text-base font-black text-[#f84464] italic">
                                            {rule.adjustment_type === 'percentage' ? `+${rule.adjustment_value}%` : `+₹${rule.adjustment_value}`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">SCHEDULE</span>
                                        <span className="text-[10px] font-black text-[#1A1C2E] uppercase tracking-tighter">
                                            {rule.start_time} - {rule.end_time}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between px-2 pt-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2.5 h-2.5 rounded-full ${rule.is_active ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-slate-200'}`} />
                                        <span className="text-[10px] font-black text-[#1A1C2E] uppercase tracking-widest">{rule.is_active ? 'OPERATIONAL' : 'DORMANT'}</span>
                                    </div>
                                    <div className="text-[9px] font-black text-slate-200 uppercase tracking-[0.3em]">
                                        GLOBAL
                                    </div>
                                </div>
                            </div>
                            
                            <div className={`absolute -bottom-16 -right-16 w-48 h-48 ${cfg.bg} opacity-20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000`} />
                        </div>
                    );
                })}

                {rules.length === 0 && (
                    <div className="bg-white rounded-[4rem] border-2 border-dashed border-slate-100 p-32 text-center space-y-10 col-span-full">
                        <div className="w-28 h-28 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                            <CreditCard size={56} />
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-3xl font-black text-[#1A1C2E] uppercase italic tracking-tighter">STANDARD PRICING</h3>
                            <p className="text-slate-300 font-bold uppercase text-[10px] tracking-[0.3em]">No dynamic surge rules detected</p>
                        </div>
                        <button onClick={() => { setFormData({...initialForm, turf_id: turfs[0]?.id}); setSelectedRule(null); setIsModalOpen(true); }} className="px-12 py-6 bg-[#1A1C2E] text-white rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-slate-200">
                            DEPLOY SURGE POLICY
                        </button>
                    </div>
                )}
            </div>


            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
                    <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-300">
                        <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Surge Config</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Define pricing behavior for specific events</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 bg-white text-slate-900 rounded-2xl flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-10 space-y-10">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Rule Name</label>
                                <input className="w-full bg-slate-50 p-5 rounded-[1.5rem] text-sm font-black border-none" placeholder="e.g. Late Night Premium" value={formData.rule_name} onChange={e => setFormData({...formData, rule_name: e.target.value})} required />
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Rule Category</label>
                                    <select className="w-full bg-slate-50 p-5 rounded-[1.5rem] text-sm font-black border-none" value={formData.rule_type} onChange={e => setFormData({...formData, rule_type: e.target.value})}>
                                        {RULE_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Adjustment Type</label>
                                    <select className="w-full bg-slate-50 p-5 rounded-[1.5rem] text-sm font-black border-none" value={formData.adjustment_type} onChange={e => setFormData({...formData, adjustment_type: e.target.value})}>
                                        <option value="fixed">Fixed Add-on (₹)</option>
                                        <option value="percentage">Percentage Markup (%)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Adjustment Value</label>
                                    <input type="number" className="w-full bg-slate-50 p-5 rounded-[1.5rem] text-sm font-black border-none" value={formData.adjustment_value} onChange={e => setFormData({...formData, adjustment_value: e.target.value})} required />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Target Facility</label>
                                    <select className="w-full bg-slate-50 p-5 rounded-[1.5rem] text-sm font-black border-none" value={formData.turf_id} onChange={e => setFormData({...formData, turf_id: e.target.value})} required>
                                        {turfs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Window Start</label>
                                    <input type="time" className="w-full bg-slate-50 p-5 rounded-[1.5rem] text-sm font-black border-none" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Window End</label>
                                    <input type="time" className="w-full bg-slate-50 p-5 rounded-[1.5rem] text-sm font-black border-none" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} />
                                </div>
                            </div>

                            <div className="pt-6 flex justify-end gap-6 border-t border-slate-50">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-5 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-900 transition-colors">Cancel</button>
                                <button type="submit" className="px-16 py-5 bg-indigo-600 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all">
                                    {selectedRule ? "Finalize Rule" : "Deploy pricing rule"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
