"use client";
import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSupabaseQuery, useSupabaseMutation } from "@/hooks/useSupabase";
import { 
    Plus, 
    Trash2, 
    Clock, 
    ArrowLeft, 
    CheckCircle, 
    PlusCircle,
    Calendar,
    ChevronRight,
    Activity,
    Save
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function SlotManager() {
    const searchParams = useSearchParams();
    const turfId = searchParams.get("turfId");
    
    const { data: turfArr = [] } = useSupabaseQuery('turfs', (q) => 
        q.eq('id', turfId).single()
    , [turfId]);
    const turf = turfArr && !Array.isArray(turfArr) ? turfArr : null;

    const { data: slots = [] } = useSupabaseQuery('turf_slots', (q) => 
        q.eq('turf_id', turfId)
    , [turfId]);

    const { data: manualBlocks = [] } = useSupabaseQuery('turf_manual_blocks', (q) => 
        q.eq('turf_id', turfId).order('date', { ascending: true })
    , [turfId]);
    
    const [createSlot] = useSupabaseMutation('turf_slots', 'insert');
    const [deleteSlot] = useSupabaseMutation('turf_slots', 'delete', (q, p) => q.eq('id', p.id));
    const [createBlock] = useSupabaseMutation('turf_manual_blocks', 'insert');
    const [deleteBlock] = useSupabaseMutation('turf_manual_blocks', 'delete', (q, p) => q.eq('id', p.id));

    const [newSlot, setNewSlot] = useState({
        day_of_week: 1,
        start_time: "06:00",
        end_time: "07:00",
        price_override: null
    });

    const [blockForm, setBlockForm] = useState({
        date: new Date().toISOString().split("T")[0],
        start_time: "06:00",
        end_time: "07:00",
        reason: "Maintenance"
    });

    const handleAddSlot = async () => {
        if (!turfId) return;
        try {
            await createSlot({ ...newSlot, turf_id: turfId, is_active: true });
            const [h, m] = newSlot.end_time.split(":").map(Number);
            const nextH = String((h + 1) % 24).padStart(2, "0");
            setNewSlot({ ...newSlot, start_time: newSlot.end_time, end_time: `${nextH}:${String(m).padStart(2, "0")}` });
        } catch (err) {
            alert(err.message);
        }
    };

    const handleCreateBlock = async () => {
        if (!turfId) return;
        try {
            await createBlock({ ...blockForm, turf_id: turfId });
            alert("Slot blocked successfully for " + blockForm.date);
        } catch (err) {
            alert(err.message);
        }
    };

    if (!turfId) return <div className="p-12 text-center font-black uppercase tracking-widest text-slate-400">Invalid Turf ID</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-20 px-4">
            {/* Header */}
            <div className="flex items-center gap-6 pb-8 border-b border-slate-100">
                <Link 
                    href="/vendor/services"
                    className="p-4 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
                        Availability Control
                    </h2>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
                        Managing <span className="text-blue-500">{turf?.name || "Loading..."}</span> Operations
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                {/* Sidebar Controls */}
                <div className="lg:col-span-1 space-y-10">
                    {/* Recurring Pattern Form */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-8">
                        <div className="flex items-center gap-3">
                             <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                <Plus size={18} strokeWidth={3} />
                             </div>
                             <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Recurring Pattern</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Day of Week</label>
                                <select 
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all"
                                    value={newSlot.day_of_week}
                                    onChange={(e) => setNewSlot({...newSlot, day_of_week: parseInt(e.target.value)})}
                                >
                                    {DAYS.map((day, i) => <option key={i} value={i}>{day}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Start</label>
                                    <input 
                                        type="time"
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all"
                                        value={newSlot.start_time}
                                        onChange={(e) => setNewSlot({...newSlot, start_time: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">End</label>
                                    <input 
                                        type="time"
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all"
                                        value={newSlot.end_time}
                                        onChange={(e) => setNewSlot({...newSlot, end_time: e.target.value})}
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={handleAddSlot}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                <Save size={16} className="text-blue-400" />
                                Add Pattern
                            </button>
                        </div>
                    </div>

                    {/* Manual Block Form */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-8">
                         <div className="flex items-center gap-3">
                             <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
                                <PlusCircle size={18} strokeWidth={3} />
                             </div>
                             <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Manual Block</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Specific Date</label>
                                <input 
                                    type="date"
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-4 focus:ring-red-500/10 focus:outline-none transition-all"
                                    value={blockForm.date}
                                    onChange={(e) => setBlockForm({...blockForm, date: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Start</label>
                                    <input 
                                        type="time"
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-4 focus:ring-red-500/10 focus:outline-none transition-all"
                                        value={blockForm.start_time}
                                        onChange={(e) => setBlockForm({...blockForm, start_time: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">End</label>
                                    <input 
                                        type="time"
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-4 focus:ring-red-500/10 focus:outline-none transition-all"
                                        value={blockForm.end_time}
                                        onChange={(e) => setBlockForm({...blockForm, end_time: e.target.value})}
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={handleCreateBlock}
                                className="w-full py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-900/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                <Trash2 size={16} className="text-white" />
                                Block Slot
                            </button>
                        </div>
                    </div>
                </div>

                {/* Listing Area */}
                <div className="lg:col-span-3 space-y-12">
                     {/* Manual Overrides Display */}
                     {manualBlocks.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 px-2">
                                <h4 className="text-lg font-black text-red-600 uppercase italic tracking-tighter">Active Overrides</h4>
                                <div className="h-[1px] flex-1 bg-red-50"></div>
                                <span className="text-[9px] font-black text-red-300 uppercase tracking-widest">{manualBlocks.length} Manual Blocks</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {manualBlocks.map(block => (
                                    <div key={block.id} className="bg-red-50/50 p-6 rounded-3xl border border-red-100 flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-white border border-red-100 flex items-center justify-center text-red-500">
                                                <Calendar size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">{block.date}</p>
                                                <p className="text-sm font-black text-slate-900">{block.start_time} - {block.end_time}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => deleteBlock({ id: block.id })}
                                            className="p-3 bg-white text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                     )}

                    {/* Recurring Pattern Display */}
                    <div className="space-y-8">
                        {DAYS.map((dayName, dayIndex) => {
                            const daySlots = slots.filter(s => s.day_of_week === dayIndex).sort((a,b) => a.start_time.localeCompare(b.start_time));
                            return (
                                <div key={dayName} className="space-y-4">
                                    <div className="flex items-center gap-4 px-2">
                                        <h4 className="text-lg font-black text-slate-900 uppercase italic tracking-tighter">{dayName}</h4>
                                        <div className="h-[1px] flex-1 bg-slate-100"></div>
                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{daySlots.length} Slots</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {daySlots.map((slot) => (
                                            <div 
                                                key={slot.id}
                                                className="group bg-white p-5 rounded-3xl border border-slate-100 hover:border-blue-500/20 transition-all flex items-center justify-between shadow-sm hover:shadow-xl"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-blue-600 border border-slate-100 group-hover:bg-white transition-colors">
                                                        <Clock size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-slate-900">{slot.start_time} - {slot.end_time}</p>
                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                                            {slot.price_override ? `₹${slot.price_override}` : `Base Yield`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => deleteSlot({ id: slot.id })}
                                                    className="p-2.5 bg-red-50 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SlotManagementPage() {
    return (
        <Suspense fallback={<div>Loading Operations...</div>}>
            <SlotManager />
        </Suspense>
    );
}
