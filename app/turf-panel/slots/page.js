"use client";
import React, { useState, useEffect } from "react";
import { 
    Clock, Calendar, Plus, Trash2, Edit3, 
    Zap, Shield, AlertTriangle, CheckCircle2,
    Lock, Unlock, RefreshCw, ChevronLeft, ChevronRight,
    MapPin, Activity, Filter, Info
} from "lucide-react";
import { useSupabaseQuery, useSupabaseMutation } from "@/hooks/useSupabase";
import { useAuth } from "@/components/AuthContext";
import { useToast } from "@/context/ToastContext";
import { supabase } from "@/lib/supabase";

export default function SlotsPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    
    const [selectedTurf, setSelectedTurf] = useState(null);
    const [selectedCourt, setSelectedCourt] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

    // Fetch Turfs
    const { data: turfs = [] } = useSupabaseQuery('turfs', (q) => 
        q.eq('partner_id', user?.id)
    , [user?.id]);

    // Fetch Courts
    const { data: courts = [] } = useSupabaseQuery('turf_courts', (q) => 
        q.eq('turf_id', selectedTurf?.id)
    , [selectedTurf?.id]);

    // Fetch Slots
    const { data: slots = [], reload: reloadSlots } = useSupabaseQuery('turf_slots', (q) => 
        q.eq('court_id', selectedCourt?.id).eq('date', selectedDate).order('start_time', { ascending: true })
    , [selectedCourt?.id, selectedDate]);

    const [updateSlot] = useSupabaseMutation('turf_slots', 'update', (q, p) => q.eq('id', p.id));
    const [createSlots] = useSupabaseMutation('turf_slots', 'insert');

    useEffect(() => {
        if (turfs.length > 0 && !selectedTurf) setSelectedTurf(turfs[0]);
    }, [turfs]);

    useEffect(() => {
        if (courts.length > 0 && !selectedCourt) setSelectedCourt(courts[0]);
    }, [courts]);

    const handleToggleBlock = async (slot) => {
        const newStatus = slot.status === 'blocked' ? 'available' : 'blocked';
        await updateSlot({ id: slot.id, status: newStatus });
        showToast(`Inventory ${newStatus === 'blocked' ? 'locked' : 'released'}`, "info");
        reloadSlots();
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-1000">
            {/* Control Bar */}
            <div className="bg-white p-10 rounded-[4rem] border border-slate-50 shadow-sm flex flex-col lg:flex-row items-center gap-10">
                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Turf Select */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-1">VENUE CONTEXT</label>
                        <select 
                            className="w-full bg-slate-50 p-5 rounded-[1.5rem] text-sm font-black border-none focus:ring-2 focus:ring-pink-500/10 transition-all uppercase italic"
                            value={selectedTurf?.id || ""}
                            onChange={(e) => setSelectedTurf(turfs.find(t => t.id === e.target.value))}
                        >
                            {turfs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>

                    {/* Court Select */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-1">DEPLOYMENT UNIT</label>
                        <select 
                            className="w-full bg-slate-50 p-5 rounded-[1.5rem] text-sm font-black border-none focus:ring-2 focus:ring-pink-500/10 transition-all uppercase italic"
                            value={selectedCourt?.id || ""}
                            onChange={(e) => setSelectedCourt(courts.find(c => c.id === e.target.value))}
                        >
                            {courts.map(c => <option key={c.id} value={c.id}>{c.name} ({c.sport_type})</option>)}
                            {courts.length === 0 && <option value="">NO UNITS DETECTED</option>}
                        </select>
                    </div>

                    {/* Date Select */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-1">TEMPORAL WINDOW</label>
                        <div className="flex items-center bg-slate-50 rounded-[1.5rem]">
                            <button onClick={() => {
                                const d = new Date(selectedDate);
                                d.setDate(d.getDate() - 1);
                                setSelectedDate(d.toISOString().split('T')[0]);
                            }} className="p-5 text-slate-300 hover:text-[#1A1C2E]"><ChevronLeft size={20} /></button>
                            <input 
                                type="date"
                                className="flex-1 bg-transparent p-5 text-sm font-black border-none text-center uppercase"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            />
                            <button onClick={() => {
                                const d = new Date(selectedDate);
                                d.setDate(d.getDate() + 1);
                                setSelectedDate(d.toISOString().split('T')[0]);
                            }} className="p-5 text-slate-300 hover:text-[#1A1C2E]"><ChevronRight size={20} /></button>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={() => setIsGenerateModalOpen(true)}
                    className="w-full lg:w-auto px-12 py-6 bg-[#0F1115] text-white rounded-[2.2rem] text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-4 hover:scale-[1.02] transition-all shadow-2xl shadow-slate-200"
                >
                    <Plus size={20} strokeWidth={3} /> GENERATE SLOTS
                </button>
            </div>

            {/* Inventory Grid */}
            <div className="space-y-10">
                <div className="flex items-center justify-between px-4">
                    <h3 className="text-3xl font-black text-[#1A1C2E] uppercase italic tracking-tighter leading-none">INVENTORY MATRIX</h3>
                    <div className="flex items-center gap-6">
                        {[
                            { label: 'Available', color: 'bg-emerald-500' },
                            { label: 'Booked', color: 'bg-pink-500' },
                            { label: 'Blocked', color: 'bg-slate-200' },
                        ].map(item => (
                            <div key={item.label} className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {!selectedCourt ? (
                    <div className="bg-white rounded-[4rem] border-2 border-dashed border-slate-100 p-32 text-center space-y-8">
                        <div className="w-28 h-28 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                            <Shield size={56} />
                        </div>
                        <h4 className="text-3xl font-black text-[#1A1C2E] uppercase italic tracking-tighter">SELECT DEPLOYMENT UNIT</h4>
                    </div>
                ) : slots.length === 0 ? (
                    <div className="bg-white rounded-[4rem] border-2 border-dashed border-slate-100 p-32 text-center space-y-10">
                        <div className="w-28 h-28 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                            <Clock size={56} />
                        </div>
                        <div className="space-y-3">
                            <h4 className="text-3xl font-black text-[#1A1C2E] uppercase italic tracking-tighter">INVENTORY VACUUM</h4>
                            <p className="text-slate-300 font-bold uppercase text-[10px] tracking-[0.3em]">No slots detected for this window</p>
                        </div>
                        <button onClick={() => setIsGenerateModalOpen(true)} className="px-10 py-5 bg-[#f84464] text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-pink-100">
                            INITIALIZE GENERATOR
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-8">
                        {slots.map((slot) => (
                            <div key={slot.id} className={`p-10 rounded-[3.5rem] border-2 transition-all relative group shadow-sm ${
                                slot.status === 'booked' ? 'bg-pink-50 border-pink-100 text-[#f84464]' : 
                                slot.status === 'blocked' ? 'bg-slate-50 border-slate-100 text-slate-300' : 
                                'bg-white border-slate-50 hover:border-pink-500 hover:shadow-2xl'
                            }`}>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">WINDOW</p>
                                    <p className="text-xl font-black tracking-tighter italic uppercase">{slot.start_time} - {slot.end_time}</p>
                                </div>
                                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                                    <p className="text-base font-black">₹{slot.price}</p>
                                    {slot.status !== 'booked' && (
                                        <button 
                                            onClick={() => handleToggleBlock(slot)}
                                            className={`p-3.5 rounded-[1.2rem] transition-all ${
                                                slot.status === 'blocked' ? 'bg-[#1A1C2E] text-white' : 'bg-slate-50 text-slate-300 hover:bg-[#1A1C2E] hover:text-white'
                                            }`}
                                        >
                                            {slot.status === 'blocked' ? <Unlock size={16} /> : <Lock size={16} />}
                                        </button>
                                    )}
                                    {slot.status === 'booked' && <Zap size={18} className="text-[#f84464] animate-pulse" />}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>


            {/* Generate Modal */}
            {isGenerateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
                    <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-300">
                        <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Slot Generator</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Automate your inventory creation</p>
                            </div>
                            <button onClick={() => setIsGenerateModalOpen(false)} className="w-12 h-12 bg-white text-slate-900 rounded-2xl flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>

                        <form onSubmit={generateSlots} className="p-10 space-y-10">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Shift Start</label>
                                    <input name="startTime" type="time" defaultValue="06:00" className="w-full bg-slate-50 p-5 rounded-[1.5rem] text-sm font-black border-none" required />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Shift End</label>
                                    <input name="endTime" type="time" defaultValue="23:00" className="w-full bg-slate-50 p-5 rounded-[1.5rem] text-sm font-black border-none" required />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Slot Duration (Min)</label>
                                    <select name="duration" className="w-full bg-slate-50 p-5 rounded-[1.5rem] text-sm font-black border-none">
                                        <option value="60">60 Minutes</option>
                                        <option value="90">90 Minutes</option>
                                        <option value="120">120 Minutes</option>
                                        <option value="30">30 Minutes</option>
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Base Price (₹)</label>
                                    <input name="price" type="number" defaultValue="1000" className="w-full bg-slate-50 p-5 rounded-[1.5rem] text-sm font-black border-none" required />
                                </div>
                            </div>

                            <div className="p-8 bg-slate-50 rounded-[2rem] space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-xs font-black uppercase text-slate-900 tracking-tight">Recurring Deployment</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Apply to multiple upcoming days</p>
                                    </div>
                                    <input name="recurring" type="checkbox" className="w-6 h-6 rounded-lg border-slate-200 text-slate-900 focus:ring-slate-900/10" />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Deployment Range (Days)</label>
                                    <input name="days" type="number" defaultValue="7" className="w-full bg-white p-4 rounded-xl text-sm font-black border-none shadow-sm" />
                                </div>
                            </div>

                            <div className="pt-6 flex justify-end gap-6 border-t border-slate-50">
                                <button type="button" onClick={() => setIsGenerateModalOpen(false)} className="px-10 py-5 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-900 transition-colors">Cancel</button>
                                <button type="submit" className="px-16 py-5 bg-slate-900 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-black hover:scale-[1.02] active:scale-95 transition-all">
                                    Commit Generation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
