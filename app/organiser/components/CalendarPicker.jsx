"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, Calendar, X } from "lucide-react";

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const DAYS_SHORT = ["M", "T", "W", "T", "F", "S", "S"];

export default function CalendarPicker({ value, onChange, placeholder = "dd/mm/yyyy" }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Default to today if no value
    const initialDate = value ? new Date(value) : new Date();
    const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
    const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());

    // Format display date: DD/MM/YYYY
    const displayValue = value ? new Date(value).toLocaleDateString("en-GB") : "";

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (month, year) => {
        const day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1; // Adjust so Monday is 0
    };

    const handleDateSelect = (day) => {
        const selectedDate = new Date(currentYear, currentMonth, day);
        // Format as YYYY-MM-DD for standard input values
        const formattedDate = selectedDate.toISOString().split("T")[0];
        onChange(formattedDate);
        setIsOpen(false);
    };

    const changeMonth = (delta) => {
        let newMonth = currentMonth + delta;
        let newYear = currentYear;
        if (newMonth > 11) {
            newMonth = 0;
            newYear++;
        } else if (newMonth < 0) {
            newMonth = 11;
            newYear--;
        }
        setCurrentMonth(newMonth);
        setCurrentYear(newYear);
    };

    const isToday = (day) => {
        const today = new Date();
        return today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
    };

    const isSelected = (day) => {
        if (!value) return false;
        const d = new Date(value);
        return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    };

    // Calculate days for the grid
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const prevMonthDays = getDaysInMonth(currentMonth - 1, currentYear);

    return (
        <div className="relative w-full" ref={containerRef}>
            {/* Input Trigger */}
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
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 4, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute left-0 top-full z-[100] w-[280px] bg-white border border-slate-100 rounded-[2rem] shadow-2xl p-6 select-none overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-1 cursor-pointer hover:bg-slate-50 px-2 py-1 rounded-lg transition-colors group">
                                <span className="text-[13px] font-black text-slate-900 uppercase tracking-widest leading-none">
                                    {MONTHS[currentMonth]} {currentYear}
                                </span>
                                <ChevronDown size={14} className="text-slate-400 group-hover:text-pink-500 transition-colors" />
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-pink-500 transition-all border border-transparent hover:border-slate-100 shadow-sm hover:shadow-none">
                                    <ChevronUp size={16} />
                                </button>
                                <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-pink-500 transition-all border border-transparent hover:border-slate-100 shadow-sm hover:shadow-none">
                                    <ChevronUp size={16} className="rotate-180" />
                                </button>
                            </div>
                        </div>

                        {/* Days Labels */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {DAYS_SHORT.map((day, i) => (
                                <div key={i} className="h-8 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {/* Previous Month Padding */}
                            {Array.from({ length: firstDay }).map((_, i) => (
                                <div key={`prev-${i}`} className="h-8 flex items-center justify-center text-[11px] font-bold text-slate-200">
                                    {prevMonthDays - firstDay + i + 1}
                                </div>
                            ))}

                            {/* Current Month Days */}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                const active = isSelected(day);
                                return (
                                    <button
                                        key={day}
                                        onClick={() => handleDateSelect(day)}
                                        className={`h-8 w-8 rounded-lg flex items-center justify-center text-[11px] font-bold transition-all relative group ${
                                            active 
                                                ? "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105 z-10" 
                                                : "text-slate-700 hover:bg-pink-50 hover:text-pink-600"
                                        }`}
                                    >
                                        {day}
                                        {isToday(day) && !active && (
                                            <div className="absolute bottom-1 w-1 h-1 bg-pink-500 rounded-full" />
                                        )}
                                    </button>
                                );
                            })}

                            {/* Next Month Padding */}
                            {Array.from({ length: 42 - (firstDay + daysInMonth) }).map((_, i) => (
                                <div key={`next-${i}`} className="h-8 flex items-center justify-center text-[11px] font-bold text-slate-200">
                                    {i + 1}
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="mt-6 pt-5 border-t border-slate-50 flex items-center justify-between">
                            <button 
                                onClick={() => { onChange(""); setIsOpen(false); }}
                                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors px-2 py-1"
                            >
                                Clear
                            </button>
                            <button 
                                onClick={() => {
                                    const today = new Date().toISOString().split("T")[0];
                                    onChange(today);
                                    setIsOpen(false);
                                }}
                                className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:bg-blue-50 px-3 py-1.5 rounded-xl transition-all border border-transparent hover:border-blue-100"
                            >
                                Today
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
