"use client";
import React, { useState, useEffect } from "react";
import { 
    Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
    Clock, Shield, Plus, Filter, LayoutGrid, 
    List, CalendarDays, Zap, AlertTriangle
} from "lucide-react";
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { useAuth } from "@/components/AuthContext";

export default function CalendarPage() {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState("month");

    // Fetch Bookings for the current month
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();

    const { data: bookings = [] } = useSupabaseQuery('turf_bookings', (q) => 
        q.gte('booking_date', startOfMonth.split('T')[0])
         .lte('booking_date', endOfMonth.split('T')[0])
    , [currentDate]);

    // Calendar Helper
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return (
        <div className="space-y-12 animate-in fade-in duration-1000">
            {/* Header / Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 px-4">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[1.8rem] bg-[#f84464] flex items-center justify-center text-white shadow-xl shadow-pink-100 shrink-0">
                        <CalendarIcon size={28} />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-[#1A1C2E] tracking-tighter uppercase italic leading-none">OPERATION CALENDAR</h2>
                        <p className="text-slate-400 font-bold text-sm mt-2 uppercase tracking-widest">Global inventory scheduling</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                    <div className="flex bg-slate-50 p-1.5 rounded-[1.8rem] border border-slate-100">
                        {['month', 'week', 'day'].map(v => (
                            <button 
                                key={v}
                                onClick={() => setView(v)}
                                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    view === v ? 'bg-[#1A1C2E] text-white shadow-xl' : 'text-slate-300 hover:text-[#1A1C2E]'
                                }`}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex items-center bg-white border border-slate-50 p-1.5 rounded-[1.8rem] shadow-sm">
                        <button 
                            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                            className="p-3.5 text-slate-300 hover:text-[#1A1C2E]"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="px-8 text-sm font-black text-[#1A1C2E] uppercase italic tracking-tighter">
                            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <button 
                            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                            className="p-3.5 text-slate-300 hover:text-[#1A1C2E]"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <button className="px-10 py-5 bg-[#1A1C2E] text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-slate-200">
                        <Shield size={18} strokeWidth={3} />
                        BLOCK HOLIDAYS
                    </button>
                </div>
            </div>

            {/* Calendar Matrix */}
            <div className="bg-white rounded-[4rem] border border-slate-50 p-12 shadow-sm">
                <div className="grid grid-cols-7 gap-6 mb-8">
                    {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                        <div key={d} className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] text-center">
                            {d}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-6">
                    {days.map((day, i) => {
                        if (!day) return <div key={i} className="aspect-square bg-slate-50/30 rounded-[2.5rem]" />;
                        
                        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const dayBookings = bookings.filter(b => b.booking_date === dateStr);
                        const isToday = new Date().toISOString().split('T')[0] === dateStr;

                        return (
                            <div key={i} className={`aspect-square p-8 rounded-[3rem] border transition-all relative group overflow-hidden ${
                                isToday ? 'border-pink-500 bg-pink-50/20' : 'border-slate-50 hover:border-pink-200'
                            }`}>
                                <span className={`text-xl font-black italic ${isToday ? 'text-[#f84464]' : 'text-[#1A1C2E]'}`}>
                                    {day}
                                </span>
                                
                                {dayBookings.length > 0 && (
                                    <div className="mt-4 space-y-2 relative z-10">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-[#f84464]" />
                                            <span className="text-[9px] font-black text-[#1A1C2E] uppercase">{dayBookings.length} RESERVED</span>
                                        </div>
                                        <div className="flex -space-x-2">
                                            {dayBookings.slice(0, 3).map((b, idx) => (
                                                <div key={idx} className="w-8 h-8 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center text-[9px] font-black uppercase text-slate-400 shadow-sm">
                                                    {b.customer_details?.name?.[0] || 'U'}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {day % 7 === 0 && dayBookings.length === 0 && (
                                    <div className="mt-4 flex items-center gap-2">
                                        <Zap size={14} className="text-amber-500" />
                                        <span className="text-[9px] font-black text-amber-500 uppercase">PEAK POTENTIAL</span>
                                    </div>
                                )}

                                <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-[#1A1C2E] opacity-0 group-hover:opacity-5 rounded-full blur-2xl transition-opacity" />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend / Key Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 px-4">
                <div className="bg-white rounded-[3.5rem] p-10 border border-slate-50 shadow-sm flex items-center gap-8">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-black text-[#1A1C2E] uppercase italic tracking-tighter">92% OCCUPANCY</p>
                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">OPTIMIZED YIELD FLOW</p>
                    </div>
                </div>

                <div className="bg-white rounded-[3.5rem] p-10 border border-slate-50 shadow-sm flex items-center gap-8">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-black text-[#1A1C2E] uppercase italic tracking-tighter">3 BLOCK REQUESTS</p>
                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">PENDING MAINTENANCE</p>
                    </div>
                </div>

                <div className="bg-white rounded-[3.5rem] p-10 border border-slate-50 shadow-sm flex items-center gap-8">
                    <div className="w-14 h-14 rounded-2xl bg-[#1A1C2E] text-white flex items-center justify-center">
                        <Plus size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-black text-[#1A1C2E] uppercase italic tracking-tighter">QUICK RESERVE</p>
                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">OFFLINE BOOKING PORTAL</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
