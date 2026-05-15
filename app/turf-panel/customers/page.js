"use client";
import React, { useState } from "react";
import { 
    Users, Search, Filter, Mail, Phone, 
    Calendar, History, ChevronRight, Star,
    MoreVertical, UserCheck, UserX, MessageSquare
} from "lucide-react";
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { useAuth } from "@/components/AuthContext";

export default function CustomersPage() {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    // Fetch unique customers from bookings
    const { data: bookings = [] } = useSupabaseQuery('turf_bookings', (q) => 
        q.order('created_at', { ascending: false })
    , [user?.id]);

    // Derived customer list
    const customersMap = bookings.reduce((acc, b) => {
        const id = b.customer_id || b.customer_details?.phone;
        if (!acc[id]) {
            acc[id] = {
                id,
                name: b.customer_details?.name || "GUEST USER",
                phone: b.customer_details?.phone || "N/A",
                email: b.customer_details?.email || "N/A",
                total_bookings: 0,
                total_spent: 0,
                last_booking: b.booking_date,
                bookings: []
            };
        }
        acc[id].total_bookings += 1;
        acc[id].total_spent += Number(b.total_amount || 0);
        acc[id].bookings.push(b);
        return acc;
    }, {});

    const customerList = Object.values(customersMap).filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery)
    );

    return (
        <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-1000">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 px-4">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[1.8rem] bg-indigo-500 flex items-center justify-center text-white shadow-xl shadow-indigo-100 shrink-0">
                        <Users size={28} />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-[#1A1C2E] tracking-tighter uppercase italic leading-none">CUSTOMER RELATIONSHIP</h2>
                        <p className="text-slate-400 font-bold text-sm mt-2 uppercase tracking-widest">Insights and loyalty management</p>
                    </div>
                </div>
                
                <div className="relative w-full lg:w-96 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1A1C2E] transition-colors" size={18} />
                    <input 
                        type="text"
                        placeholder="SEARCH BY IDENTITY..."
                        className="w-full bg-white border border-slate-50 pl-16 pr-8 py-5 rounded-[1.8rem] text-sm font-black focus:ring-4 focus:ring-pink-500/5 transition-all shadow-sm italic uppercase"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* List Area */}
                <div className="lg:col-span-2 space-y-6">
                    {customerList.map((customer) => (
                        <div 
                            key={customer.id}
                            onClick={() => setSelectedCustomer(customer)}
                            className={`p-8 bg-white rounded-[3.5rem] border transition-all cursor-pointer group flex items-center gap-8 ${
                                selectedCustomer?.id === customer.id ? 'border-pink-500 shadow-2xl scale-[1.01]' : 'border-slate-50 shadow-sm hover:border-pink-200'
                            }`}
                        >
                            <div className="w-20 h-20 rounded-[2.2rem] bg-slate-50 flex items-center justify-center text-slate-300 font-black text-2xl uppercase shadow-inner shrink-0 group-hover:bg-[#1A1C2E] group-hover:text-pink-400 transition-all italic">
                                {customer.name[0]}
                            </div>
                            
                            <div className="flex-1 min-w-0 space-y-2">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-xl font-black text-[#1A1C2E] uppercase italic tracking-tighter truncate">{customer.name}</h3>
                                    {customer.total_bookings >= 5 && (
                                        <span className="px-4 py-1 bg-amber-50 text-amber-500 text-[9px] font-black uppercase tracking-widest rounded-full flex items-center gap-2">
                                            <Star size={10} fill="currentColor" /> ELITE CUSTOMER
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-6 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                    <span className="flex items-center gap-2"><Phone size={12} className="text-[#f84464]" /> {customer.phone}</span>
                                    <span className="flex items-center gap-2"><History size={12} className="text-[#c026d3]" /> {customer.total_bookings} RESERVATIONS</span>
                                </div>
                            </div>

                            <div className="text-right shrink-0">
                                <p className="text-lg font-black text-[#1A1C2E] tracking-tighter">₹{customer.total_spent.toLocaleString()}</p>
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">LIFETIME YIELD</p>
                            </div>
                            
                            <ChevronRight size={24} className="text-slate-100 group-hover:text-[#1A1C2E] transition-colors" />
                        </div>
                    ))}
                    
                    {customerList.length === 0 && (
                        <div className="bg-white rounded-[4rem] p-32 text-center space-y-10 border border-slate-50">
                            <Users size={64} className="mx-auto text-slate-100" />
                            <h3 className="text-3xl font-black text-[#1A1C2E] uppercase italic tracking-tighter">NO CLIENTS DETECTED</h3>
                        </div>
                    )}
                </div>

                {/* Profile Detail / Insight Area */}
                <div className="space-y-10">
                    {selectedCustomer ? (
                        <div className="bg-[#1A1C2E] rounded-[4rem] p-10 text-white shadow-2xl relative overflow-hidden animate-in slide-in-from-right-8 duration-500">
                            <div className="relative z-10 space-y-12">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-white/10 flex items-center justify-center text-pink-400 font-black text-2xl italic">
                                        {selectedCustomer.name[0]}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black uppercase italic tracking-tighter">{selectedCustomer.name}</h3>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">CLIENT SINCE {selectedCustomer.bookings[selectedCustomer.bookings.length-1].booking_date}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">RESERVATION RATE</p>
                                        <p className="text-2xl font-black italic">HIGH</p>
                                    </div>
                                    <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">CANCEL RATE</p>
                                        <p className="text-2xl font-black italic text-pink-500">2%</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">RECENT ACTIVITY</h4>
                                    <div className="space-y-4">
                                        {selectedCustomer.bookings.slice(0, 3).map((b, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <Calendar size={14} className="text-pink-500" />
                                                    <span className="text-[10px] font-black uppercase tracking-tight">{b.booking_date}</span>
                                                </div>
                                                <span className="text-[10px] font-black text-emerald-400 uppercase">₹{b.total_amount}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button className="flex-1 py-5 bg-white/10 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10">
                                        SEND MESSAGE
                                    </button>
                                    <button className="p-5 bg-pink-500 rounded-[1.5rem] text-white hover:scale-105 transition-all shadow-xl shadow-pink-500/20">
                                        <MoreVertical size={18} />
                                    </button>
                                </div>
                            </div>
                            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl" />
                        </div>
                    ) : (
                        <div className="bg-white rounded-[4rem] p-20 border border-dashed border-slate-200 text-center space-y-6 opacity-60">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                                <Search size={32} />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">SELECT IDENTITY TO VIEW INSIGHTS</p>
                        </div>
                    )}

                    <div className="bg-white rounded-[4rem] p-10 border border-slate-50 shadow-sm space-y-10">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-[#1A1C2E] uppercase italic tracking-tighter">LOYALTY STATS</h3>
                            <Zap size={20} className="text-amber-500" />
                        </div>
                        <div className="space-y-8">
                            {[
                                { label: "NEW USERS (30D)", val: 12, color: "bg-blue-500" },
                                { label: "ACTIVE MEMBERS", val: 45, color: "bg-emerald-500" },
                                { label: "CHURNED USERS", val: 3, color: "bg-pink-500" },
                            ].map((stat, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-300">
                                        <span>{stat.label}</span>
                                        <span className="text-[#1A1C2E]">{stat.val}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                        <div className={`h-full ${stat.color} rounded-full`} style={{ width: `${(stat.val/60)*100}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
