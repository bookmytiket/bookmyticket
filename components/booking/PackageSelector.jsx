"use client";
import React from "react";
import { CheckCircle2, Info, ChevronRight, Sparkles, Clock, Star } from "lucide-react";

export default function PackageSelector({ 
    packages, 
    selectedPackage, 
    onSelect,
    type = "service" // "service" | "event"
}) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                        {type === "event" || type === "marathon" || type === "tournament" ? "Select Category" : "Choose Package"}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        {type === "event" ? "Different tiers for different vibes" : 
                         type === "marathon" ? "Choose your distance" :
                         type === "tournament" ? "Pick your team tier" : "Curated service experiences"}
                    </p>
                </div>
                <div className="w-12 h-12 bg-pink-50 rounded-[1.25rem] flex items-center justify-center text-pink-500 shadow-inner">
                    <Sparkles size={20} />
                </div>
            </div>

            <div className="space-y-4">
                {packages.map((pkg) => (
                    <div 
                        key={pkg.id} 
                        onClick={() => onSelect(pkg)}
                        className={`
                            group relative p-6 rounded-[32px] border-2 transition-all duration-300 cursor-pointer overflow-hidden
                            ${selectedPackage?.id === pkg.id 
                                ? "border-pink-500 bg-pink-50/50 shadow-[0_20px_40px_-15px_rgba(236,72,153,0.15)] scale-[1.02]" 
                                : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-lg"}
                        `}
                    >
                        {/* Status Badge */}
                        {selectedPackage?.id === pkg.id && (
                            <div className="absolute top-0 right-0 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[10px] font-black uppercase tracking-widest rounded-bl-2xl flex items-center gap-2 shadow-sm">
                                <CheckCircle2 size={12} /> Selected
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-4">
                            <div className="space-y-1">
                                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight group-hover:text-pink-500 transition-colors">
                                    {pkg.title || pkg.name}
                                </h4>
                                <div className="flex items-center gap-3 mt-2">
                                    {pkg.duration && (
                                        <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase">
                                            <Clock size={12} /> {pkg.duration}
                                        </span>
                                    )}
                                    {pkg.type && (
                                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                            {pkg.type}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-black text-slate-900 tracking-tighter">
                                    ₹{pkg.price.toLocaleString()}
                                </div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    {type === "event" ? "per ticket" : 
                                     type === "marathon" ? "per runner" :
                                     type === "tournament" ? "per team" : "starting from"}
                                </div>
                            </div>
                        </div>

                        <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6 line-clamp-2">
                            {pkg.description || "Premium experience with all standard amenities included."}
                        </p>

                        <div className="flex flex-wrap gap-2 mt-4">
                            {(pkg.features || []).map((feat, fi) => (
                                <div 
                                    key={fi}
                                    className="px-3 py-1.5 bg-white border border-slate-100 rounded-xl text-[10px] font-bold text-slate-600 flex items-center gap-2 shadow-sm"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                                    {feat}
                                </div>
                            ))}
                        </div>

                        {/* Interactive Element */}
                        <div className={`
                            mt-6 pt-4 border-t border-dashed flex items-center justify-between transition-all
                            ${selectedPackage?.id === pkg.id ? "border-pink-200" : "border-slate-100"}
                        `}>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Info size={12} /> Full Details
                            </span>
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                                ${selectedPackage?.id === pkg.id ? "bg-gradient-to-br from-pink-500 to-purple-500 text-white shadow-md shadow-pink-500/20" : "bg-slate-50 text-slate-400 group-hover:bg-pink-50 group-hover:text-pink-500"}
                            `}>
                                <ChevronRight size={16} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Legend/Info */}
            <div className="p-6 bg-blue-50 rounded-[32px] border border-blue-100 flex items-start gap-4">
                <div className="p-2 bg-white rounded-xl text-blue-500 shadow-sm">
                    <Star size={18} fill="currentColor" />
                </div>
                <div>
                    <h5 className="text-[11px] font-black text-blue-900 uppercase tracking-widest mb-1">Pricing Transparency</h5>
                    <p className="text-[10px] font-medium text-blue-700/70 leading-relaxed">
                        Prices shown are inclusive of all platform fees. No hidden charges at checkout.
                    </p>
                </div>
            </div>
        </div>
    );
}
