"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock } from "lucide-react";

export default function CustomTimePicker({
    value = "10:00",
    onChange,
    label = ""
}) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const hourRef = useRef(null);
    const minuteRef = useRef(null);

    const [hour, setHour] = useState("10");
    const [minute, setMinute] = useState("00");

    useEffect(() => {
        if (value && value.includes(":")) {
            const [h, m] = value.split(":");
            setHour(h.padStart(2, "0"));
            setMinute(m.padStart(2, "0"));
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

    // Scroll selected time into view when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                if (hourRef.current) {
                    const selectedHour = hourRef.current.querySelector('.selected-hour');
                    if (selectedHour) selectedHour.scrollIntoView({ block: 'center' });
                }
                if (minuteRef.current) {
                    const selectedMinute = minuteRef.current.querySelector('.selected-minute');
                    if (selectedMinute) selectedMinute.scrollIntoView({ block: 'center' });
                }
            }, 50);
        }
    }, [isOpen]);

    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
    // Providing options for every minute, but mostly intervals of 5 or 10 are used. For total control we list all 60.
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

    const handleTimeChange = (type, val) => {
        let newHour = hour;
        let newMinute = minute;
        
        if (type === "hour") {
            newHour = val;
            setHour(val);
        } else {
            newMinute = val;
            setMinute(val);
        }
        
        if (onChange) {
            onChange(`${newHour}:${newMinute}`);
        }
    };

    return (
        <div className="relative w-full space-y-3" ref={containerRef}>
            {label && (
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">
                    {label}
                </label>
            )}
            
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-slate-50 border ${isOpen ? 'border-blue-300 ring-4 ring-blue-500/10' : 'border-slate-100'} text-slate-900 text-sm font-bold px-6 py-4 rounded-2xl flex items-center justify-between cursor-pointer hover:border-blue-200 transition-all`}
            >
                <span>{hour}:{minute}</span>
                <Clock size={16} className={`transition-colors ${isOpen ? 'text-blue-500' : 'text-slate-400'}`} />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 4, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute left-0 top-full mt-2 z-[110] w-full max-w-[200px] bg-white border border-slate-100 rounded-[1.5rem] shadow-2xl overflow-hidden flex"
                    >
                        {/* Hours */}
                        <div className="flex-1 h-[250px] overflow-y-auto custom-scrollbar border-r border-slate-50 relative" ref={hourRef}>
                            <div className="text-center sticky top-0 bg-slate-50/90 backdrop-blur border-b border-slate-100 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest z-10">Hr</div>
                            <div className="py-1">
                                {hours.map(h => (
                                    <button
                                        key={`h-${h}`}
                                        onClick={() => handleTimeChange("hour", h)}
                                        className={`w-full text-center py-2.5 text-xs font-bold transition-all ${
                                            hour === h 
                                            ? "bg-blue-600 text-white selected-hour" 
                                            : "text-slate-600 hover:bg-slate-100"
                                        }`}
                                    >
                                        {h}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        {/* Minutes */}
                        <div className="flex-1 h-[250px] overflow-y-auto custom-scrollbar relative" ref={minuteRef}>
                            <div className="text-center sticky top-0 bg-slate-50/90 backdrop-blur border-b border-slate-100 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest z-10">Min</div>
                            <div className="py-1">
                                {minutes.map(m => (
                                    <button
                                        key={`m-${m}`}
                                        onClick={() => handleTimeChange("minute", m)}
                                        className={`w-full text-center py-2.5 text-xs font-bold transition-all ${
                                            minute === m 
                                            ? "bg-blue-600 text-white selected-minute" 
                                            : "text-slate-600 hover:bg-slate-100"
                                        }`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
