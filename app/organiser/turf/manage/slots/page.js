"use client";
import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
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
    const router = useRouter();

    const [turf, setTurf] = useState(null);
    const [slots, setSlots] = useState([]);

    const refreshSlots = () => {
        if (!turfId) return;
        supabase.from('turfs').select('*').eq('id', turfId).maybeSingle().then(({ data }) => setTurf(data));
        supabase.from('turf_slots').select('*').eq('turf_id', turfId).then(({ data }) => setSlots(data || []));
    };
    useEffect(() => { refreshSlots(); }, [turfId]);

    const [newSlot, setNewSlot] = useState({
        day_of_week: 1,
        start_time: "06:00",
        end_time: "07:00",
        price_override: undefined
    });

    const handleAddSlot = async () => {
        if (!turfId) return;
        try {
            await supabase.from('turf_slots').insert({ ...newSlot, turf_id: turfId, is_active: true });
            const [h, m] = newSlot.end_time.split(':').map(Number);
            const nextH = String((h + 1) % 24).padStart(2, '0');
            setNewSlot({ ...newSlot, start_time: newSlot.end_time, end_time: `${nextH}:${String(m).padStart(2, '0')}` });
            refreshSlots();
        } catch (err) { alert(err.message); }
    };

    if (!turfId) return <div className="p-12 text-center font-black uppercase tracking-widest text-slate-400">Invalid Turf ID</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-12    ">
            {/* Header */}
            <div className="flex items-center gap-6 pb-8 border-b border-slate-100">
                <Link 
                    href="/organiser/turf/manage"
                    className="p-4 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
                        Slot Configuration
                    </h2>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
                        Defining Availability for <span className="text-blue-500">{turf?.name || "Loading..."}</span>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Add Slot Sidebar */}
                <div className="space-y-8">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-8">
                        <div className="flex items-center gap-3">
                             <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                <Plus size={18} strokeWidth={3} />
                             </div>
                             <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Add Slot Pattern</h3>
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
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Start Time</label>
                                    <input 
                                        type="time"
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all"
                                        value={newSlot.start_time}
                                        onChange={(e) => setNewSlot({...newSlot, start_time: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">End Time</label>
                                    <input 
                                        type="time"
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all"
                                        value={newSlot.end_time}
                                        onChange={(e) => setNewSlot({...newSlot, end_time: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Price Override (Optional)</label>
                                <input 
                                    type="number"
                                    placeholder={`Default: ₹${turf?.pricePerHour || 0}`}
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all"
                                    value={newSlot.price_override || ""}
                                    onChange={(e) => setNewSlot({...newSlot, price_override: e.target.value ? parseInt(e.target.value) : undefined})}
                                />
                            </div>

                            <button 
                                onClick={handleAddSlot}
                                className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                <Save size={16} />
                                Append Slot
                            </button>
                        </div>
                    </div>

                    <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white space-y-4">
                         <div className="flex items-center gap-3 text-blue-400">
                            <Activity size={18} />
                            <h4 className="text-[10px] font-black uppercase tracking-widest">Auto-Management</h4>
                         </div>
                         <p className="text-[11px] font-bold text-slate-400 leading-relaxed italic">
                            Slots defined here will be available every week for this turf. Pricing overrides can be used for peak hours.
                         </p>
                    </div>
                </div>

                {/* Slot Display Area */}
                <div className="lg:col-span-2 space-y-8">
                    {DAYS.map((dayName, dayIndex) => {
                        const daySlots = slots.filter(s => s.day_of_week === dayIndex).sort((a,b) => a.start_time.localeCompare(b.start_time));
                        return (
                            <div key={dayName} className="space-y-4">
                                <div className="flex items-center gap-4 px-2">
                                    <h4 className="text-lg font-black text-slate-900 uppercase italic tracking-tighter">{dayName}</h4>
                                    <div className="h-[1px] flex-1 bg-slate-100"></div>
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{daySlots.length} Slots</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {daySlots.map((slot) => (
                                        <div 
                                            key={slot._id}
                                            className="group bg-white p-5 rounded-2xl border border-slate-100 hover:border-blue-500/20 transition-all flex items-center justify-between shadow-sm hover:shadow-xl"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-blue-600 border border-slate-100">
                                                    <Clock size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900">{slot.start_time} - {slot.end_time}</p>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                        {slot.price_override ? `₹${slot.price_override}` : `Default Rate`}
                                                    </p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={async () => { await supabase.from('turf_slots').delete().eq('id', slot.id); refreshSlots(); }}
                                                className="p-2.5 bg-red-50 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {daySlots.length === 0 && (
                                        <div className="col-span-full py-6 text-center border-2 border-dashed border-slate-50 rounded-2xl">
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No slots defined</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default function SlotManagementPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SlotManager />
        </Suspense>
    );
}
