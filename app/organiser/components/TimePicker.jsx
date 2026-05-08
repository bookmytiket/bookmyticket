"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock } from "lucide-react";
import Portal from "./Portal";

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
                    <Portal>
                        <div className="fixed inset-0 z-[999999] overflow-hidden pointer-events-none flex items-center justify-center">
                            {/* Backdrop */}
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
                                className="relative m-auto z-[1000000] w-[90vw] max-w-[320px] bg-white border border-slate-200 rounded-[2.5rem] shadow-[0_30px_70_rgba(0,0,0,0.25)] p-6 select-none overflow-hidden pointer-events-auto"
                            >
                                <div className="flex justify-between items-center mb-6 px-1">
                                    <span className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Select Time</span>
                                </div>

                                <div className="flex gap-2 h-40 mb-6 px-1">
                                    {/* Hours Column */}
                                    <div className="flex-1 overflow-y-auto no-scrollbar rounded-2xl bg-white border border-slate-100 shadow-inner snap-y snap-mandatory py-16">
                                        {hours.map(h => (
                                            <div 
                                                key={h}
                                                onClick={() => setSelectedHour(h)}
                                                className={`h-10 flex items-center justify-center cursor-pointer transition-all snap-center px-2`}
                                            >
                                                <div className={`w-full h-8 flex items-center justify-center rounded-lg font-black text-xs transition-all ${
                                                    h === selectedHour 
                                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110' 
                                                        : 'text-slate-300 hover:text-slate-500'
                                                }`}>
                                                    {h}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div className="flex items-center justify-center font-black text-slate-200 text-lg">:</div>

                                    {/* Minutes Column */}
                                    <div className="flex-1 overflow-y-auto no-scrollbar rounded-2xl bg-white border border-slate-100 shadow-inner snap-y snap-mandatory py-16">
                                        {minutes.map(m => (
                                            <div 
                                                key={m}
                                                onClick={() => setSelectedMinute(m)}
                                                className={`h-10 flex items-center justify-center cursor-pointer transition-all snap-center px-2`}
                                            >
                                                <div className={`w-full h-8 flex items-center justify-center rounded-lg font-black text-xs transition-all ${
                                                    m === selectedMinute 
                                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110' 
                                                        : 'text-slate-300 hover:text-slate-500'
                                                }`}>
                                                    {m}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="pt-5 border-t border-slate-50 flex items-center justify-between">
                                    <button 
                                        onClick={handleClear}
                                        className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors px-2"
                                    >
                                        Clear
                                    </button>
                                    <button 
                                        onClick={() => handleConfirm(selectedHour, selectedMinute)}
                                        className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all"
                                    >
                                        Confirm
                                    </button>
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
