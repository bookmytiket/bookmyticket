"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, Calendar, Clock, X, ChevronDown } from "lucide-react";
import Portal from "./Portal";

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const DAYS_SHORT = ["M", "T", "W", "T", "F", "S", "S"];

export default function CalendarPicker({ value, onChange, placeholder = "dd/mm/yyyy", showTime = false }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const parseValue = (val) => {
        if (!val) return { date: new Date(), hours: "12", minutes: "00", ampm: "PM" };
        const parts = val.split(' ');
        const date = new Date(parts[0]);
        let timePart = parts.slice(1).join(' ') || "12:00 PM";
        
        let hours, minutes, ampm;
        if (timePart.includes("PM") || timePart.includes("AM")) {
            const [t, p] = timePart.split(' ');
            [hours, minutes] = t.split(':');
            ampm = p;
        } else {
            [hours, minutes] = timePart.split(':');
            let h = parseInt(hours);
            ampm = h >= 12 ? "PM" : "AM";
            h = h % 12;
            hours = h === 0 ? "12" : String(h).padStart(2, '0');
        }

        return { 
            date: isNaN(date.getTime()) ? new Date() : date, 
            hours: hours || "12", minutes: minutes || "00", ampm: ampm || "PM"
        };
    };

    const initial = parseValue(value);
    const [currentMonth, setCurrentMonth] = useState(initial.date.getMonth());
    const [currentYear, setCurrentYear] = useState(initial.date.getFullYear());
    const [time, setTime] = useState({ h: initial.hours, m: initial.minutes, p: initial.ampm });

    const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

    const getDisplayValue = (val) => {
        if (!val) return "";
        const parts = val.split(' ');
        const d = new Date(parts[0]);
        if (isNaN(d.getTime())) return "";
        const dateStr = d.toLocaleDateString("en-GB");
        return showTime && parts[1] ? `${dateStr} ${parts[1]} ${parts[2] || ""}`.trim() : dateStr;
    };

    const displayValue = getDisplayValue(value);

    const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (month, year) => {
        const day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1;
    };

    const handleDateSelect = (day) => {
        const selectedDate = new Date(currentYear, currentMonth, day);
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const date = String(selectedDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${date}`;
        
        if (showTime) {
            onChange(`${formattedDate} ${time.h}:${time.m} ${time.p}`);
        } else {
            onChange(formattedDate);
            setIsOpen(false);
        }
    };

    const updateTime = (newTime) => {
        setTime(newTime);
        if (value) {
            const parts = value.split(' ');
            onChange(`${parts[0]} ${newTime.h}:${newTime.m} ${newTime.p}`);
        }
    };

    const changeMonth = (delta) => {
        let newMonth = currentMonth + delta;
        let newYear = currentYear;
        if (newMonth > 11) { newMonth = 0; newYear++; }
        else if (newMonth < 0) { newMonth = 11; newYear--; }
        setCurrentMonth(newMonth);
        setCurrentYear(newYear);
    };

    const isToday = (day) => {
        const today = new Date();
        return today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
    };

    const isSelected = (day) => {
        if (!value) return false;
        const d = new Date(value.split(' ')[0]);
        return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    };

    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const prevMonthDays = getDaysInMonth(currentMonth - 1, currentYear);

    return (
        <div className="relative w-full" ref={containerRef}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-slate-50 border border-slate-100 text-slate-900 text-sm font-semibold px-4 py-3.5 rounded-2xl flex items-center justify-between cursor-pointer hover:border-pink-300 transition-all shadow-inner"
            >
                <span className={displayValue ? "text-slate-900" : "text-slate-300 font-medium"}>
                    {displayValue || placeholder}
                </span>
                <Calendar size={18} className="text-slate-400" />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <Portal>
                        <div className="fixed inset-0 z-[999999] overflow-hidden pointer-events-none flex items-center justify-center">
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsOpen(false)}
                                className="fixed inset-0 bg-slate-900/40 pointer-events-auto"
                            />
                            
                            <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                                className={`relative m-auto z-[1000000] bg-white border border-slate-200 rounded-[2rem] shadow-[0_30px_70px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col pointer-events-auto
                                    ${showTime ? "max-w-[calc(100%-32px)] md:max-w-[600px] w-full" : "max-w-[calc(100%-32px)] w-full md:max-w-[340px]"}`}
                            >
                                <div className="flex flex-col md:flex-row">
                                    {/* Calendar Section */}
                                    <div className="p-5 md:p-8 flex-1 border-b md:border-b-0 md:border-r border-slate-100">
                                        <div className="flex items-center justify-between mb-4 md:mb-6 px-1">
                                            <span className="text-[12px] md:text-[14px] font-black text-slate-900 uppercase tracking-widest">
                                                {MONTHS[currentMonth]} {currentYear}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400">
                                                    <ChevronUp size={16} />
                                                </button>
                                                <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400">
                                                    <ChevronUp size={16} className="rotate-180" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-7 gap-1 mb-1">
                                            {DAYS_SHORT.map((day, i) => (
                                                <div key={i} className="h-8 flex items-center justify-center text-[9px] font-black text-slate-400 uppercase">{day}</div>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-7 gap-1">
                                            {Array.from({ length: firstDay }).map((_, i) => (
                                                <div key={`prev-${i}`} className="h-8 flex items-center justify-center text-[11px] font-bold text-slate-100">{prevMonthDays - firstDay + i + 1}</div>
                                            ))}
                                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                                const day = i + 1;
                                                const active = isSelected(day);
                                                return (
                                                    <button
                                                        key={day}
                                                        onClick={() => handleDateSelect(day)}
                                                        className={`h-8 w-8 rounded-lg flex items-center justify-center text-[11px] font-black transition-all relative ${
                                                            active ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-50"
                                                        }`}
                                                    >
                                                        {day}
                                                        {isToday(day) && !active && <div className="absolute bottom-1 w-1 h-1 bg-pink-500 rounded-full" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Time Section */}
                                    {showTime && (
                                        <div className="p-5 md:p-8 w-full md:w-[240px] bg-slate-50/50">
                                            <div className="flex items-center gap-3 mb-4 md:mb-6">
                                                <Clock size={16} className="text-slate-400" />
                                                <span className="text-[10px] md:text-[12px] font-black text-slate-900 uppercase tracking-widest">Time</span>
                                            </div>
                                            
                                            <div className="flex items-center justify-center gap-2 mb-4 md:mb-6">
                                                {/* Hours */}
                                                <div className="flex-1 h-24 md:h-32 overflow-y-auto no-scrollbar snap-y snap-mandatory py-8 md:py-12 bg-white rounded-xl border border-slate-100">
                                                    {hours.map(h => (
                                                        <div key={h} onClick={() => updateTime({...time, h})} className={`h-8 flex items-center justify-center font-black text-xs md:text-sm cursor-pointer snap-center ${time.h === h ? 'text-blue-600 scale-110' : 'text-slate-300'}`}>{h}</div>
                                                    ))}
                                                </div>
                                                <div className="text-lg font-black text-slate-200">:</div>
                                                {/* Minutes */}
                                                <div className="flex-1 h-24 md:h-32 overflow-y-auto no-scrollbar snap-y snap-mandatory py-8 md:py-12 bg-white rounded-xl border border-slate-100">
                                                    {minutes.map(m => (
                                                        <div key={m} onClick={() => updateTime({...time, m})} className={`h-8 flex items-center justify-center font-black text-xs md:text-sm cursor-pointer snap-center ${time.m === m ? 'text-blue-600 scale-110' : 'text-slate-300'}`}>{m}</div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* AM/PM */}
                                            <div className="grid grid-cols-2 gap-2 p-1.5 bg-white rounded-xl border border-slate-100">
                                                {["AM", "PM"].map(p => (
                                                    <button key={p} onClick={() => updateTime({...time, p})} className={`py-2 rounded-lg text-[10px] font-black transition-all ${time.p === p ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300'}`}>{p}</button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="p-4 md:p-6 bg-white border-t border-slate-100 flex items-center justify-between">
                                    <button onClick={() => { onChange(""); setIsOpen(false); }} className="text-[10px] font-black uppercase text-slate-400 px-2">Clear</button>
                                    <button onClick={() => setIsOpen(false)} className="px-6 md:px-10 py-3 md:py-4 bg-slate-900 text-white rounded-xl md:rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-slate-100">Confirm</button>
                                </div>
                            </motion.div>
                        </div>
                    </Portal>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
