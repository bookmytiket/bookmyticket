"use client";
import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/AuthContext";
import { getVendorAccountKey } from "@/lib/vendorAccount";
import { 
    Calendar as CalendarIcon, 
    ChevronLeft, 
    ChevronRight, 
    Clock, 
    MapPin, 
    User, 
    CheckCircle,
    Info,
    CalendarDays,
    Settings,
    MoreVertical,
    CheckCircle2,
    X,
    Plus
} from "lucide-react";

export default function CalendarPage() {
    const { user } = useAuth();
    const vendorId = getVendorAccountKey(user);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const bookings = useQuery(
        api.vendorBookings.list,
        vendorId ? { vendorId } : "skip"
    ) || [];

    const stats = useQuery(
        api.vendors.getStats,
        vendorId ? { vendorId } : "skip"
    );

    const availability = useQuery(
        api.vendorCalendar.getAvailability,
        vendorId ? { vendorId } : "skip"
    );

    const toggleBlockDate = useMutation(api.vendorCalendar.toggleBlockDate);

    const blockedDates = availability?.blockedDates || [];

    const handleToggleBlockDate = async () => {
        if (!vendorId || !selectedDate) return;
        const dateStr = selectedDate.toISOString().split("T")[0];
        try {
            await toggleBlockDate({ vendorId, date: dateStr });
        } catch (error) {
            console.error("Failed to toggle block date:", error);
        }
    };

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const days = [];
        const totalDays = daysInMonth(year, month);
        const startingDay = firstDayOfMonth(year, month);

        // Previous month days placeholders
        for (let i = 0; i < startingDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-28 md:h-32 bg-slate-50/30 border border-slate-50 opacity-20"></div>);
        }

        // Current month days
        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(year, month, day);
            const isSelected = selectedDate.toDateString() === date.toDateString();
            const isToday = new Date().toDateString() === date.toDateString();
            
            const dayBookings = bookings.filter(b => {
                const bDate = new Date(b.date);
                return bDate.toDateString() === date.toDateString();
            });
            const dateStrForBlock = date.toISOString().split("T")[0];
            const isBlocked = blockedDates.includes(dateStrForBlock);

            days.push(
                <div 
                    key={day} 
                    onClick={() => setSelectedDate(date)}
                    className={`h-28 md:h-32 border border-slate-50 p-4 transition-all cursor-pointer relative group overflow-hidden ${
                        isSelected ? 'bg-pink-50 ring-2 ring-pink-500/20 z-10' : 'bg-white hover:bg-slate-50'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className={`text-sm font-black ${
                            isSelected ? 'text-pink-600' : isBlocked ? 'text-red-500 line-through decoration-2' : isToday ? 'text-pink-500' : 'text-slate-900'
                        }`}>
                            {day}
                        </span>
                        {dayBookings.length > 0 ? (
                            <span className="w-2 h-2 rounded-full bg-pink-500 shadow-xl shadow-pink-500/50 animate-pulse"></span>
                        ) : isBlocked ? (
                            <span className="w-2 h-2 rounded-full bg-red-500 shadow-xl shadow-red-500/50"></span>
                        ) : null}
                    </div>
                    <div className="mt-3 space-y-1.5">
                        {dayBookings.slice(0, 2).map((b, i) => (
                            <div key={i} className="text-[8px] font-black uppercase tracking-tighter truncate bg-slate-900 text-white px-2 py-1 rounded-md shadow-lg italic">
                                {b.customerDetails?.name || "Job"}
                            </div>
                        ))}
                        {isBlocked && dayBookings.length === 0 && (
                            <div className="text-[8px] font-black uppercase tracking-tighter truncate bg-red-100 text-red-600 px-2 py-1 rounded-md shadow-sm italic">
                                Blocked
                            </div>
                        )}
                        {dayBookings.length > 2 && (
                            <div className="text-[8px] font-black text-pink-500 uppercase tracking-widest pl-1 mt-1">
                                + {dayBookings.length - 2} more
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return days;
    };

    const selectedDayBookings = bookings.filter(b => {
        const bDate = new Date(b.date);
        return bDate.toDateString() === selectedDate.toDateString();
    });

    const selectedDateStrForBlock = selectedDate.toISOString().split("T")[0];
    const isSelectedDateBlocked = blockedDates.includes(selectedDateStrForBlock);

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-slate-200">
                <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white p-3 shadow-2xl shadow-pink-500/30">
                            <CalendarDays size={28} />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-pink-500">Logistics</span>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase underline decoration-pink-500/20 underline-offset-8">Engagement Map</h2>
                        </div>
                    </div>
                    <p className="text-slate-500 text-sm max-w-xl font-medium leading-relaxed">Systematically coordinate your upcoming assignments. Precision timing ensures premium service delivery.</p>
                </div>
                <div className="flex items-center space-x-3 bg-slate-50 p-2 rounded-2xl border border-slate-100 shadow-inner">
                    <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-3 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100 hover:shadow-xl hover:shadow-slate-900/5">
                        <ChevronLeft size={20} className="text-slate-900" />
                    </button>
                    <span className="px-8 text-xs font-black uppercase tracking-[0.4em] text-slate-900 italic">
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-3 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100 hover:shadow-xl hover:shadow-slate-900/5">
                        <ChevronRight size={20} className="text-slate-900" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                {/* Calendar Grid */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-200/50">
                        <div className="grid grid-cols-7 bg-slate-50/50 border-b border-slate-50 py-6">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">{day}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7">
                            {renderCalendar()}
                        </div>
                    </div>
                </div>

                {/* Day Details Sidebar */}
                <div className="space-y-10">
                    <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/40 space-y-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 text-pink-500/5 opacity-50">
                            <Clock size={100} />
                        </div>
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black text-pink-500 uppercase tracking-[0.4em]">Assignments</h4>
                                <span className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest italic">{selectedDate.toDateString() === new Date().toDateString() ? 'Reality' : 'Manifested'}</span>
                            </div>
                            <div className="space-y-1 text-center py-4 border-y border-slate-50">
                                <p className="text-5xl font-black text-slate-900 tracking-tighter italic">{selectedDate.getDate()}</p>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.6em]">{selectedDate.toLocaleString('default', { month: 'long' })}</p>
                            </div>
                        </div>

                        <div className="space-y-6 relative z-10 pt-4">
                            {selectedDayBookings.length > 0 ? selectedDayBookings.map((b, i) => (
                                <div key={i} className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-3 group hover:bg-pink-50 hover:border-pink-200 transition-all cursor-pointer shadow-inner">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-black text-slate-900 uppercase italic tracking-tight group-hover:text-pink-600 transition-colors">{b.customerDetails?.name || "Client"}</p>
                                        <Clock size={14} className="text-slate-300 group-hover:text-pink-400" />
                                    </div>
                                    <div className="flex items-center space-x-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                        <Clock size={12} />
                                        <span>{b.time || "10:00 AM"}</span>
                                    </div>
                                    <div className="flex items-center space-x-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">
                                        <MapPin size={12} />
                                        <span>{b.location || "On-site"}</span>
                                    </div>
                                </div>
                            )) : isSelectedDateBlocked ? (
                                <div className="py-20 text-center space-y-6 border-2 border-dashed border-red-200 rounded-[2rem] bg-red-50/50">
                                    <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-500 mx-auto">
                                        <X size={32} />
                                    </div>
                                    <p className="text-red-600 text-[10px] font-black uppercase tracking-widest leading-relaxed px-6">Date is currently blocked</p>
                                </div>
                            ) : (
                                <div className="py-20 text-center space-y-6 border-2 border-dashed border-slate-100 rounded-[2rem]">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto">
                                        <CalendarIcon size={32} />
                                    </div>
                                    <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest leading-relaxed px-6">Empty space discovered in your schedule</p>
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={handleToggleBlockDate}
                            className={`w-full py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] shadow-3xl transition-all italic relative z-10 ${
                                isSelectedDateBlocked 
                                    ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 shadow-red-500/10' 
                                    : 'bg-slate-900 text-white shadow-slate-900/20 hover:bg-pink-500 hover:shadow-pink-500/30'
                            }`}
                        >
                            {isSelectedDateBlocked ? 'Unblock Date' : 'Block Date'}
                        </button>
                    </div>

                    <div className="bg-gradient-to-br from-pink-50/50 to-white p-10 rounded-[2.5rem] border border-pink-100 shadow-xl shadow-slate-200/20 flex flex-col items-center text-center space-y-6">
                        <div className="w-16 h-16 rounded-3xl bg-white border border-pink-100 text-pink-500 flex items-center justify-center shadow-inner">
                            <Info size={32} />
                        </div>
                        <div className="space-y-2">
                            <h5 className="font-black text-slate-900 text-xs italic uppercase tracking-[0.2em]">Efficiency Protocol</h5>
                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed uppercase tracking-tighter">Maintain clear buffers between jobs to ensure the highest fidelity artist experience for every client.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
