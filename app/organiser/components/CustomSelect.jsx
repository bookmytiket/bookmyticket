"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search, Check, X } from "lucide-react";

export default function CustomSelect({ 
    value, 
    onChange, 
    options = [], 
    placeholder = "Select...", 
    isLoading = false,
    searchable = true,
    label = ""
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const containerRef = useRef(null);

    // Normalize options to [{ label, value }]
    const normalizedOptions = options.map(opt => {
        if (typeof opt === 'string') return { label: opt, value: opt };
        return opt;
    });

    const filteredOptions = normalizedOptions.filter(opt =>
        (opt.label || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedOption = normalizedOptions.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (val) => {
        onChange(val);
        setIsOpen(false);
        setSearchTerm("");
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            {/* Trigger */}
            <div 
                onClick={() => !isLoading && setIsOpen(!isOpen)}
                className={`w-full bg-white border border-slate-200 text-slate-900 text-sm font-semibold px-4 py-3.5 rounded-2xl flex items-center justify-between cursor-pointer hover:border-pink-300 transition-all shadow-inner ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <span className={selectedOption ? "text-slate-900" : "text-slate-500 font-bold truncate mr-2"}>
                    {isLoading ? "Loading..." : (selectedOption ? selectedOption.label : placeholder)}
                </span>
                <ChevronDown size={16} className={`text-slate-600 transition-transform  ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 4, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute left-0 top-full z-[110] w-full min-w-[200px] bg-white border border-slate-100 rounded-[2rem] shadow-2xl p-2 select-none overflow-hidden"
                    >
                        {searchable && (
                            <div className="relative mb-2 px-2 pt-2">
                                <Search size={14} className="absolute left-5 top-5 text-slate-400" />
                                <input 
                                    autoFocus
                                    className="w-full bg-slate-50 border-none text-[11px] font-bold text-slate-700 pl-8 pr-4 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-pink-200"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        )}

                        <div className="max-h-[240px] overflow-y-auto custom-scrollbar px-1 py-1">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((opt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSelect(opt.value)}
                                        className={`w-full text-left px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-between group ${
                                            value === opt.value 
                                                ? "bg-blue-50 text-blue-600" 
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        }`}
                                    >
                                        <span className="truncate mr-2">{opt.label}</span>
                                        {value === opt.value && <Check size={14} className="text-blue-500 shrink-0" />}
                                    </button>
                                ))
                            ) : (
                                <div className="py-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    No results found
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
