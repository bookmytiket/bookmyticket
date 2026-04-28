"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock } from "lucide-react";

export default function TimePicker({ value, onChange, placeholder = "--:--" }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    
    // Parse initial value (expecting HH:mm format)
    const [selectedHour, setSelectedHour] = useState(value ? value.split(':')[0] : "12");
    const [selectedMinute, setSelectedMinute] = useState(value ? value.split(':')[1] : "00");

    const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

    useEffect(() => {
        if (value) {
            const [h, m] = value.split(':');
            setSelectedHour(h || "12");
            setSelectedMinute(m || "00");
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleConfirm = (h, m) => {
        onChange(`${h}:${m}`);
        setIsOpen(false);
    };

    const handleClear = () => {
        onChange("");
        setSelectedHour("12");
        setSelectedMinute("00");
        setIsOpen(false);
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            {/* Input Trigger */}
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-slate-50 border border-slate-100 text-slate-900 text-sm font-semibold px-4 py-3.5 rounded-2xl flex items-center justify-between cursor-pointer hover:border-pink-300 transition-all shadow-inner"
            >
                <span className={value ? "text-slate-900" : "text-slate-300 font-medium"}>
                    {value || placeholder}
                </span>
                <Clock size={16} className="text-slate-400" />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 4, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute left-0 top-full z-[100] w-[280px] bg-white/95 backdrop-blur-xl border border-slate-100 rounded-[2rem] shadow-2xl p-4 select-none overflow-hidden"
                    >
                        <div className="flex justify-between items-center mb-4 px-2">
                            <span className="text-[13px] font-black text-slate-900 uppercase tracking-widest">Select Time</span>
                        </div>

                        <div className="flex gap-2 h-48 mb-4 px-1">
                            {/* Hours Column */}
                            <div className="flex-1 overflow-y-auto no-scrollbar rounded-xl bg-slate-50/50 border border-slate-100 scroll-smooth snap-y snap-mandatory">
                                <div className="py-[76px]">
                                    {hours.map(h => (
                                        <div 
                                            key={h}
                                            onClick={() => setSelectedHour(h)}
                                            className={`h-10 flex items-center justify-center font-bold text-sm cursor-pointer transition-all snap-center ${
                                                h === selectedHour 
                                                    ? 'bg-blue-600 text-white rounded-lg scale-105 shadow-sm transform mx-2' 
                                                    : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100 mx-1 rounded-lg'
                                            }`}
                                        >
                                            {h}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-center font-black text-slate-300 text-xl">:</div>

                            {/* Minutes Column */}
                            <div className="flex-1 overflow-y-auto no-scrollbar rounded-xl bg-slate-50/50 border border-slate-100 scroll-smooth snap-y snap-mandatory">
                                <div className="py-[76px]">
                                    {minutes.map(m => (
                                        <div 
                                            key={m}
                                            onClick={() => setSelectedMinute(m)}
                                            className={`h-10 flex items-center justify-center font-bold text-sm cursor-pointer transition-all snap-center ${
                                                m === selectedMinute 
                                                    ? 'bg-blue-600 text-white rounded-lg scale-105 shadow-sm transform mx-2' 
                                                    : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100 mx-1 rounded-lg'
                                            }`}
                                        >
                                            {m}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                            <button 
                                onClick={handleClear}
                                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors px-2 py-1"
                            >
                                Clear
                            </button>
                            <button 
                                onClick={() => handleConfirm(selectedHour, selectedMinute)}
                                className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all border border-transparent hover:border-blue-100"
                            >
                                Confirm
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
