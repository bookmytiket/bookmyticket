"use client";
import React, { useState } from "react";
import { 
    Star, MessageSquare, ThumbsUp, Filter, 
    Search, ChevronRight, BarChart3, TrendingUp,
    Shield, CheckCircle2, XCircle, AlertCircle
} from "lucide-react";
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { useAuth } from "@/components/AuthContext";

export default function ReviewsPage() {
    const { user } = useAuth();
    const [statusFilter, setStatusFilter] = useState("all");

    const { data: reviews = [], reload: reloadReviews } = useSupabaseQuery('turf_reviews', (q) => 
        q.order('created_at', { ascending: false })
    , [user?.id]);

    const averageRating = (reviews.reduce((acc, curr) => acc + curr.rating, 0) / (reviews.length || 1)).toFixed(1);

    return (
        <div className="space-y-12 animate-in slide-in-from-right-8 duration-1000">
            {/* Header / Analytics Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 px-4">
                <div className="lg:col-span-1 bg-[#1A1C2E] rounded-[4rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center text-amber-400">
                                <Star size={24} fill="currentColor" />
                            </div>
                            <h3 className="text-xl font-black uppercase italic tracking-tighter">TURF SCORE</h3>
                        </div>
                        <div>
                            <p className="text-6xl font-black tracking-tighter italic">{averageRating}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">GLOBAL SATISFACTION INDEX</p>
                        </div>
                        <div className="flex gap-1.5 pt-2">
                            {[1, 2, 3, 4, 5].map(i => (
                                <Star key={i} size={14} fill={i <= Math.round(averageRating) ? "#fbbf24" : "transparent"} className={i <= Math.round(averageRating) ? "text-amber-400" : "text-slate-600"} />
                            ))}
                        </div>
                    </div>
                    <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                </div>

                <div className="lg:col-span-3 bg-white rounded-[4rem] border border-slate-50 p-10 flex flex-col md:flex-row items-center gap-12 shadow-sm">
                    <div className="flex-1 space-y-6 w-full">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">RATING DISTRIBUTION</h4>
                        <div className="space-y-4">
                            {[5, 4, 3, 2, 1].map((star) => {
                                const count = reviews.filter(r => r.rating === star).length;
                                const pct = (count / (reviews.length || 1)) * 100;
                                return (
                                    <div key={star} className="flex items-center gap-4">
                                        <span className="text-[9px] font-black text-[#1A1C2E] w-4">{star}★</span>
                                        <div className="flex-1 h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#f84464] rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className="text-[9px] font-black text-slate-300 w-8">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="w-full md:w-64 space-y-8">
                        <div className="p-6 bg-slate-50 rounded-[2.2rem] border border-slate-100">
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2">TOTAL REVIEWS</p>
                            <p className="text-3xl font-black text-[#1A1C2E] tracking-tighter italic">{reviews.length}</p>
                        </div>
                        <div className="p-6 bg-emerald-50 rounded-[2.2rem] border border-emerald-100">
                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2">RESPONSE RATE</p>
                            <p className="text-3xl font-black text-emerald-600 tracking-tighter italic">92%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex justify-between items-center px-6">
                <div className="flex bg-slate-50 p-1.5 rounded-[1.8rem] border border-slate-100 shadow-sm">
                    {['all', 'positive', 'critical', 'pending'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setStatusFilter(tab)}
                            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                statusFilter === tab ? 'bg-[#1A1C2E] text-white shadow-xl' : 'text-slate-300 hover:text-[#1A1C2E]'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-4">
                    <button className="p-4 bg-white border border-slate-50 text-slate-300 rounded-2xl hover:text-[#1A1C2E] transition-all shadow-sm">
                        <Search size={20} />
                    </button>
                    <button className="p-4 bg-white border border-slate-50 text-slate-300 rounded-2xl hover:text-[#1A1C2E] transition-all shadow-sm">
                        <Filter size={20} />
                    </button>
                </div>
            </div>

            {/* Review List */}
            <div className="space-y-8">
                {reviews.map((review) => (
                    <div key={review.id} className="bg-white rounded-[4rem] border border-slate-50 p-12 shadow-sm hover:shadow-2xl hover:border-pink-50 transition-all group">
                        <div className="flex flex-col md:flex-row gap-12">
                            <div className="w-full md:w-80 shrink-0 space-y-6">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center text-slate-300 font-black text-xl italic group-hover:bg-[#1A1C2E] group-hover:text-pink-400 transition-all">
                                        {review.customer_name?.[0] || 'U'}
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-[#1A1C2E] uppercase italic tracking-tighter leading-none">{review.customer_name || 'GUEST USER'}</h4>
                                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em] mt-2">{review.created_at?.split('T')[0]}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <Star key={i} size={16} fill={i <= review.rating ? "#fbbf24" : "transparent"} className={i <= review.rating ? "text-amber-400" : "text-slate-100"} />
                                    ))}
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <span className="px-4 py-1.5 bg-slate-50 rounded-full text-[9px] font-black uppercase text-slate-400 border border-slate-100">VERIFIED</span>
                                    <span className="px-4 py-1.5 bg-slate-50 rounded-full text-[9px] font-black uppercase text-slate-400 border border-slate-100">FOOTBALL</span>
                                </div>
                            </div>

                            <div className="flex-1 space-y-8">
                                <div className="relative">
                                    <MessageSquare size={48} className="absolute -top-6 -left-6 text-slate-50 -z-10" />
                                    <p className="text-xl font-bold text-slate-600 leading-relaxed italic">
                                        "{review.comment}"
                                    </p>
                                </div>

                                <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <button className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-[#f84464] transition-colors">
                                            <ThumbsUp size={16} /> HELP-FUL (12)
                                        </button>
                                        <button className="text-[10px] font-black text-[#f84464] uppercase tracking-[0.3em] hover:opacity-70 transition-all">
                                            REPLY TO REVIEW
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button className="p-3 text-slate-200 hover:text-red-500 transition-colors">
                                            <AlertCircle size={18} />
                                        </button>
                                        <button className="p-3 text-slate-200 hover:text-[#1A1C2E] transition-colors">
                                            <Shield size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {reviews.length === 0 && (
                    <div className="bg-white rounded-[4rem] p-32 text-center space-y-10 border border-slate-50">
                        <MessageSquare size={64} className="mx-auto text-slate-100" />
                        <h3 className="text-3xl font-black text-[#1A1C2E] uppercase italic tracking-tighter">NO FEEDBACK DETECTED</h3>
                    </div>
                )}
            </div>
        </div>
    );
}
