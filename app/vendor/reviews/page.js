"use client";
import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/AuthContext";
import { getVendorAccountKey } from "@/lib/vendorAccount";
import { 
    Star, 
    MessageSquare, 
    ChevronRight, 
    Filter, 
    TrendingUp, 
    ArrowUpRight,
    Search,
    User,
    CheckCircle,
    Calendar,
    Send,
    X,
    MessageCircle
} from "lucide-react";

// Use the local helper if needed, but getVendorAccountKey should be consistent
const getVendorKey = (user) => {
    if (!user) return null;
    return user.id || user.userId || user.organiserId || user.email; // Fallback logic
};

export default function ReviewsPage() {
    const { user } = useAuth();
    // Use the actual helper from the project
    const vendorId = user?.organiserId || user?.userId || (user?.email ? user.email.replace(/[@.]/g, '_') : null);
    
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState("");

    const reviews = useQuery(
        api.vendorReviews.getVendorReviews,
        vendorId ? { vendorId } : "skip"
    ) || [];
    const respondToReview = useMutation(api.vendorReviews.respondToReview);

    const stats = {
        avg: reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : 0,
        total: reviews.length,
        fiveStar: reviews.filter(r => r.rating === 5).length,
        fourStar: reviews.filter(r => r.rating === 4).length,
        threeStar: reviews.filter(r => r.rating === 3).length,
        twoStar: reviews.filter(r => r.rating === 2).length,
        oneStar: reviews.filter(r => r.rating === 1).length,
    };

    const handleReply = async (id) => {
        if (!replyText.trim()) return;
        try {
            await respondToReview({ id, response: replyText });
            setReplyingTo(null);
            setReplyText("");
        } catch (error) {
            console.error("Failed to respond:", error);
        }
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200">
                <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white p-3 shadow-2xl shadow-yellow-500/30">
                            <Star size={28} fill="currentColor" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Reputation</span>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">Feedback & Ratings</h2>
                        </div>
                    </div>
                    <p className="text-slate-500 text-sm max-w-xl font-medium">Build trust through active engagement. Verified artist reviews are your strongest currency.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="bg-slate-50 p-1.5 rounded-2xl border border-slate-100 flex shadow-inner">
                        <button className="px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white text-slate-900 shadow-sm border border-slate-100">All Time</button>
                        <button className="px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">By Month</button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Stats Sidebar */}
                <div className="space-y-8">
                    <div className="bg-gradient-to-br from-white to-slate-50/50 rounded-[2.5rem] p-12 border border-slate-100 shadow-2xl relative overflow-hidden text-center shadow-slate-200/50">
                        <div className="absolute top-0 right-0 p-6 text-orange-500/5 rotate-12">
                            <Star size={120} fill="currentColor" />
                        </div>
                        <div className="relative z-10 space-y-6">
                            <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em]">Aggregate Rating</h4>
                            <div className="text-8xl font-black text-slate-900 tracking-tighter italic">{stats.avg}</div>
                            <div className="flex items-center justify-center space-x-2">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <Star key={s} size={24} className={s <= Math.round(stats.avg) ? 'text-yellow-400' : 'text-slate-100'} fill={s <= Math.round(stats.avg) ? 'currentColor' : 'none'} />
                                ))}
                            </div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Validated by {stats.total} clients</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 space-y-8 shadow-xl shadow-slate-200/40">
                        <h5 className="text-slate-900 font-black text-sm flex items-center space-x-3 italic uppercase tracking-widest">
                            <TrendingUp size={20} className="text-green-500" />
                            <span>Rating Distribution</span>
                        </h5>
                        <div className="space-y-6">
                            {[5, 4, 3, 2, 1].map(s => {
                                const count = stats[`${['zero','one','two','three','four','five'][s]}Star`];
                                const percent = stats.total > 0 ? (count / stats.total) * 100 : 0;
                                return (
                                    <div key={s} className="space-y-2 group">
                                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-slate-400 group-hover:text-slate-900 transition-colors">{s} Stars</span>
                                            <span className="text-slate-900">{count}</span>
                                        </div>
                                        <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                                            <div 
                                                className={`h-full bg-gradient-to-r ${s >= 4 ? 'from-green-500 to-emerald-400' : s === 3 ? 'from-yellow-400 to-orange-400' : 'from-red-500 to-rose-400'} transition-all duration-1000 shadow-xl`}
                                                style={{ width: `${percent}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Reviews List */}
                <div className="lg:col-span-2 space-y-10">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-slate-900 flex items-center space-x-4 italic uppercase tracking-tighter">
                            <div className="w-1.5 h-6 bg-orange-500 rounded-full"></div>
                            <span>Public Feedback</span>
                        </h3>
                        <div className="relative group">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Search comments..." 
                                className="bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-6 text-xs text-slate-900 outline-none focus:border-orange-500/50 transition-all font-bold placeholder:text-slate-200" 
                            />
                        </div>
                    </div>

                    <div className="space-y-10">
                        {reviews.length > 0 ? reviews.map((review, i) => (
                            <div 
                                key={review._id} 
                                className="bg-white rounded-[2.5rem] border border-slate-100 p-10 space-y-8 animate-in slide-in-from-right-10 duration-500 shadow-xl shadow-slate-200/40"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-6">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 text-slate-900 border border-slate-100 flex items-center justify-center font-black text-2xl shadow-inner italic">
                                            {review.userId.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black text-slate-900 tracking-tight italic uppercase">{review.userId}</h4>
                                            <div className="flex items-center space-x-4 mt-2">
                                                <div className="flex items-center space-x-0.5">
                                                    {[1, 2, 3, 4, 5].map(s => (
                                                        <Star key={s} size={14} className={s <= review.rating ? 'text-yellow-400' : 'text-slate-100'} fill={s <= review.rating ? 'currentColor' : 'none'} />
                                                    ))}
                                                </div>
                                                <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center space-x-1.5">
                                                    <Calendar size={12} />
                                                    <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-green-50 text-green-500 border border-green-100 shadow-sm">
                                        <CheckCircle size={22} />
                                    </div>
                                </div>

                                <p className="text-slate-600 text-sm leading-relaxed font-bold italic bg-slate-50/50 p-6 rounded-[1.5rem] border border-slate-50">
                                    "{review.comment}"
                                </p>

                                {review.response ? (
                                    <div className="bg-white border-l-4 border-orange-500 rounded-2xl p-8 space-y-4 group shadow-lg shadow-slate-100 relative overflow-hidden">
                                         <div className="absolute top-0 right-0 p-4 opacity-5">
                                            <MessageCircle size={80} className="text-orange-500" />
                                        </div>
                                        <div className="flex items-center justify-between relative z-10">
                                            <p className="text-[10px] text-orange-500 font-black uppercase tracking-[0.4em] italic">Artist Response</p>
                                            <button className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 hover:text-orange-500 transition-all font-black uppercase tracking-widest">Edit Entry</button>
                                        </div>
                                        <p className="text-xs text-slate-900 font-bold italic relative z-10 leading-relaxed">
                                            {review.response}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="pt-4">
                                        {replyingTo === review._id ? (
                                            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-400">
                                                <div className="relative">
                                                    <textarea 
                                                        autoFocus
                                                        value={replyText}
                                                        onChange={(e) => setReplyText(e.target.value)}
                                                        placeholder="Draft a public response..."
                                                        className="w-full bg-slate-50 border border-slate-100 rounded-[1.8rem] p-6 text-sm text-slate-900 font-bold italic outline-none focus:bg-white focus:border-orange-500/50 transition-all min-h-[140px] resize-none shadow-inner"
                                                    />
                                                    <button 
                                                        onClick={() => setReplyingTo(null)}
                                                        className="absolute top-4 right-4 p-2 text-slate-300 hover:text-slate-900 transition-colors bg-white rounded-xl shadow-sm"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                                <div className="flex justify-end space-x-4">
                                                    <button 
                                                        onClick={() => setReplyingTo(null)}
                                                        className="px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button 
                                                        onClick={() => handleReply(review._id)}
                                                        className="bg-gradient-to-r from-orange-500 to-yellow-400 px-10 py-3.5 rounded-2xl text-white font-black text-[10px] flex items-center space-x-3 shadow-2xl shadow-orange-500/30 hover:scale-[1.05] transition-all uppercase tracking-[0.2em]"
                                                    >
                                                        <Send size={16} />
                                                        <span>Post Reflection</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => setReplyingTo(review._id)}
                                                className="flex items-center space-x-4 text-orange-500 hover:text-orange-600 transition-all group"
                                            >
                                                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all shadow-sm border border-orange-100">
                                                    <MessageCircle size={20} />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Reply as Artist</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )) : (
                            <div className="py-40 flex flex-col items-center justify-center text-center space-y-8 bg-white rounded-[4rem] border-2 border-dashed border-slate-100 shadow-inner">
                                <div className="w-28 h-28 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-slate-200 group">
                                    <Star size={56} className="group-hover:text-orange-500 transition-all duration-700" />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Silencing Silence</h3>
                                    <p className="text-slate-400 max-w-xs mx-auto text-sm font-medium">As you fulfill more service requests, your clients' reflections will materialize here.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
