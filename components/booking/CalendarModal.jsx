"use client";
import React, { useState, useMemo } from "react";
import { 
    ChevronLeft, ChevronRight, X, Calendar as CalendarIcon,
    ChevronDown, CheckCircle2
} from "lucide-react";

export default function CalendarModal({ 
    isOpen, 
    onClose, 
    onSelect, 
    selectedDate,
    availableDates = [], // If empty, all future dates are available
    blockedDates = [],
    highlightToday = true
}) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const daysInMonth = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const date = new Date(year, month, 1);
        const days = [];
        
        // Fill leading blanks
        const firstDay = date.getDay();
        for (let i = 0; i < firstDay; i++) {
            days.push({ day: null, date: null });
        }
        
        // Fill days
        while (date.getMonth() === month) {
            days.push({
                day: date.getDate(),
                date: new Date(date),
                isToday: new Date().toDateString() === date.toDateString(),
                isPast: new Date(new Date().setHours(0,0,0,0)) > date
            });
            date.setDate(date.getDate() + 1);
        }
        
        return days;
    }, [currentMonth]);

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return [currentYear, currentYear + 1, currentYear + 2];
    }, []);

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80" onClick={onClose} />
            
            <div className="relative bg-white rounded-[40px] w-full max-w-[440px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Header Section */}
                <div className="p-8 pb-4">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Select Date</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Real-time Availability</span>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex gap-3 mb-8">
                        {/* Month Selector */}
                        <div className="relative flex-1">
                            <select 
                                value={currentMonth.getMonth()}
                                onChange={(e) => setCurrentMonth(new Date(currentMonth.setMonth(parseInt(e.target.value))))}
                                className="w-full appearance-none bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-black uppercase italic tracking-tighter text-slate-900 outline-none cursor-pointer hover:border-orange-500/30 transition-all"
                            >
                                {months.map((m, i) => (
                                    <option key={i} value={i}>{m}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        </div>

                        {/* Year Selector */}
                        <div className="relative w-32">
                            <select 
                                value={currentMonth.getFullYear()}
                                onChange={(e) => setCurrentMonth(new Date(currentMonth.setFullYear(parseInt(e.target.value))))}
                                className="w-full appearance-none bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-black uppercase italic tracking-tighter text-slate-900 outline-none cursor-pointer hover:border-orange-500/30 transition-all"
                            >
                                {years.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        </div>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="px-8 pb-8">
                    <div className="grid grid-cols-7 mb-4">
                        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(d => (
                            <div key={d} className="text-[10px] font-black text-slate-400 text-center tracking-widest">{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {daysInMonth.map((dayObj, i) => {
                            const isSelected = selectedDate && dayObj.date && selectedDate.toDateString() === dayObj.date.toDateString();
                            const isBlocked = dayObj.date && (
                                dayObj.isPast || 
                                blockedDates.some(d => new Date(d).toDateString() === dayObj.date.toDateString()) ||
                                (availableDates.length > 0 && !availableDates.some(d => new Date(d).toDateString() === dayObj.date.toDateString()))
                            );

                            return (
                                <button
                                    key={i}
                                    disabled={!dayObj.day || isBlocked}
                                    onClick={() => dayObj.date && onSelect(dayObj.date)}
                                    className={`
                                        aspect-square flex flex-col items-center justify-center rounded-2xl text-sm font-black transition-all relative group
                                        ${!dayObj.day ? "pointer-events-none" : ""}
                                        ${isSelected ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-110 z-10" : "text-slate-900 hover:bg-orange-50/50"}
                                        ${isBlocked ? "opacity-20 cursor-not-allowed grayscale" : "cursor-pointer"}
                                        ${dayObj.isToday && !isSelected ? "text-orange-500" : ""}
                                    `}
                                >
                                    {dayObj.day}
                                    {dayObj.isToday && !isSelected && (
                                        <div className="w-1 h-1 bg-orange-500 rounded-full mt-0.5" />
                                    )}
                                    {isSelected && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                            <CheckCircle2 size={10} className="text-orange-500" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 pt-0 flex gap-4">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-100 transition-all"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onClose}
                        className="flex-1 py-4 bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
                    >
                        Confirm
                    </button>
                </div>
                
                {/* Decorative Element */}
                <div className="absolute top-8 right-8 w-16 h-16 bg-orange-500/10 rounded-3xl -z-10 rotate-12" />
            </div>
        </div>
    );
}
