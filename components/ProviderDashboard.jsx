"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
    LayoutDashboard, Ticket, Package, Clock, Wallet, User,
    Plus, Search, Filter, Bell, Settings, LogOut,
    TrendingUp, Star, IndianRupee, MapPin, Edit3, Trash2,
    CheckCircle2, AlertCircle, ChevronRight, MessageSquare,
    Zap, Tag, BarChart3, Shield, UserCircle, Camera, X,
    Calendar as CalendarIcon, Loader2, ArrowLeft, Save
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import PayoutRequestPanel from "@/components/PayoutRequestPanel";
import { useToast } from "@/context/ToastContext";

export default function ProviderDashboard() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState("overview");
    const [viewMode, setViewMode] = useState("list"); // "list" or "config"
    const [loading, setLoading] = useState(true);
    const [provider, setProvider] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [services, setServices] = useState([]);
    const [wallet, setWallet] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // Form States
    const [selectedService, setSelectedService] = useState(null);
    const [serviceForm, setServiceForm] = useState({
        service_name: "",
        description: "",
        pricing: "",
        status: "Published"
    });

    const fetchAllData = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const { data: prov } = await supabase
                .from("professional_service_profiles")
                .select("*")
                .eq("auth_user_id", user.id)
                .maybeSingle();

            if (!prov) {
                router.push("/partner");
                return;
            }
            setProvider(prov);

            const { data: bks } = await supabase
                .from("provider_bookings")
                .select("*, provider_services(service_name), profiles!customer_id(full_name, phone)")
                .eq("provider_id", prov.id)
                .order("created_at", { ascending: false });

            setBookings(bks || []);

            const { data: svcs } = await supabase
                .from("provider_services")
                .select("*")
                .eq("provider_id", prov.id)
                .order("created_at", { ascending: false });
            setServices(svcs || []);

            const { data: earnings } = await supabase
                .from("provider_earnings")
                .select("*")
                .eq("provider_id", prov.id);
            setWallet(earnings || []);

        } catch (err) {
            console.error("Data fetch error:", err);
            showToast("Failed to synchronize business data", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [user?.id]);

    const stats = useMemo(() => [
        { label: "TOTAL ENGAGEMENTS", value: bookings.length, icon: Ticket, trend: "+12.4%", color: "bg-[#1A1C2E]" },
        { label: "GROSS REVENUE", value: `₹${bookings.filter(b => b.booking_status === "completed").reduce((acc, b) => acc + (b.amount || 0), 0).toLocaleString()}`, icon: IndianRupee, trend: "+8.2%", color: "bg-[#f84464]" },
        { label: "ACTIVE SERVICES", value: services.length, icon: Package, trend: "STABLE", color: "bg-[#c026d3]" },
        { label: "SUCCESS RATE", value: "98.2%", icon: TrendingUp, trend: "+2.1%", color: "bg-emerald-500" },
    ], [bookings, services]);

    const handleServiceAction = async (e) => {
        e.preventDefault();
        try {
            const payload = { 
                ...serviceForm, 
                provider_id: provider.id,
                pricing: parseFloat(serviceForm.pricing)
            };

            if (selectedService) {
                await supabase.from("provider_services").update(payload).eq("id", selectedService.id);
                showToast("Service configuration updated", "success");
            } else {
                await supabase.from("provider_services").insert(payload);
                showToast("New service deployed", "success");
            }
            setViewMode("list");
            fetchAllData();
        } catch (err) {
            showToast(err.message, "error");
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#FDFDFF] flex items-center justify-center">
            <Loader2 size={48} className="animate-spin text-[#f84464]" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FDFDFF] flex font-sans">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Modern Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 bg-[#1A1C2E] w-72 md:w-80 overflow-y-auto overflow-x-hidden shadow-2xl flex flex-col p-6 md:p-8 custom-scrollbar transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                {/* Mobile Close Button */}
                <button 
                    className="absolute top-6 right-6 text-slate-400 hover:text-white md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                >
                    <X size={24} />
                </button>
                <div className="mb-10 px-4">
                    <div className="w-12 h-12 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl italic shadow-lg">
                        {provider.business_name?.[0].toUpperCase() || "P"}
                    </div>
                    <p className="mt-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">PROFESSIONAL HUB</p>
                    <h2 className="text-sm font-black text-white uppercase italic tracking-tighter mt-2">{provider.business_name}</h2>
                </div>

                <nav className="flex-1 space-y-2">
                    {[
                        { id: "overview", label: "BUSINESS OVERVIEW", icon: LayoutDashboard },
                        { id: "bookings", label: "ENGAGEMENTS", icon: Ticket },
                        { id: "services", label: "SERVICE CATALOG", icon: Package },
                        { id: "wallet", label: "FINANCIAL HUB", icon: Wallet },
                        { id: "profile", label: "BRAND IDENTITY", icon: UserCircle },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => { setActiveTab(item.id); setViewMode("list"); setIsSidebarOpen(false); }}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] transition-all group relative ${activeTab === item.id ? 'bg-gradient-to-r from-[#f84464] to-[#c026d3] text-white shadow-xl shadow-pink-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <item.icon size={18} className={activeTab === item.id ? 'text-white' : 'group-hover:scale-110 transition-transform'} strokeWidth={activeTab === item.id ? 3 : 2} />
                            <span className={`text-[10px] tracking-[0.1em] uppercase ${activeTab === item.id ? 'font-black italic' : 'font-bold'}`}>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="mt-auto pt-8 border-t border-white/5">
                    <button onClick={logout} className="w-full py-5 bg-white/5 text-slate-400 rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-[#f84464] hover:text-white transition-all">
                        <LogOut size={16} /> EXIT SESSION
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 md:ml-80 flex flex-col w-full min-w-0">
                <header className="h-20 md:h-24 flex items-center justify-between px-6 md:px-10 sticky top-0 bg-white/80 backdrop-blur-3xl z-30 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <button 
                            className="p-2 -ml-2 text-slate-600 md:hidden hover:bg-slate-100 rounded-xl transition-colors"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                        </button>
                        <div>
                            <h1 className="text-xl md:text-3xl font-black text-[#1A1C2E] italic tracking-tighter uppercase leading-none">{viewMode === 'config' ? 'CONFIG' : activeTab.toUpperCase()}</h1>
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em] mt-3">SYSTEM NODE // PROFESSIONAL-V1</p>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="flex flex-col items-end">
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mb-1.5 italic">BUSINESS STATUS</p>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{provider.status?.toUpperCase()}</span>
                            </div>
                        </div>
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 p-0.5 shadow-xl shadow-pink-500/20">
                            <div className="w-full h-full bg-white rounded-[0.9rem] flex items-center justify-center text-[#f84464] font-black text-xl italic">
                                {user.full_name?.[0] || "P"}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="px-4 md:px-10 py-6 md:py-8 space-y-8 md:space-y-10 w-full animate-in slide-in-from-bottom-8 duration-700 max-w-[100vw]">
                    {/* CONFIG VIEW (INLINE) */}
                    {viewMode === "config" ? (
                        <div className="space-y-10 animate-in slide-in-from-right-8 duration-700">
                            <div className="flex items-center gap-6">
                                <button onClick={() => setViewMode("list")} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-[#1A1C2E] hover:text-white transition-all shadow-sm">
                                    <ArrowLeft size={24} />
                                </button>
                                <h3 className="text-3xl font-black text-[#1A1C2E] uppercase italic tracking-tighter leading-none">SERVICE CONFIGURATION</h3>
                            </div>

                            <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-50 overflow-hidden">
                                <form onSubmit={handleServiceAction} className="p-4 md:p-8 space-y-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-2">SERVICE DESIGNATION</label>
                                        <input className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-black border-none focus:ring-4 focus:ring-pink-500/5 transition-all text-[#1A1C2E]" value={serviceForm.service_name} onChange={e => setServiceForm({...serviceForm, service_name: e.target.value})} placeholder="e.g. PROFESSIONAL WEDDING PHOTOGRAPHY" required />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-2">BASE YIELD (₹)</label>
                                            <input type="number" className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-black border-none focus:ring-4 focus:ring-pink-500/5 transition-all text-[#1A1C2E]" value={serviceForm.pricing} onChange={e => setServiceForm({...serviceForm, pricing: e.target.value})} placeholder="5000" required />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-2">DEPLOYMENT STATUS</label>
                                            <select className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-black border-none focus:ring-4 focus:ring-pink-500/5 transition-all text-[#1A1C2E]" value={serviceForm.status} onChange={e => setServiceForm({...serviceForm, status: e.target.value})}>
                                                <option value="Published">PUBLISHED</option>
                                                <option value="Draft">DRAFT / HIDDEN</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-2">MISSION DESCRIPTION</label>
                                        <textarea className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-black border-none focus:ring-4 focus:ring-pink-500/5 transition-all text-[#1A1C2E]" rows={4} value={serviceForm.description} onChange={e => setServiceForm({...serviceForm, description: e.target.value})} placeholder="Outline the service scope and deliverables..." required />
                                    </div>
                                    <div className="pt-6 flex flex-col sm:flex-row justify-end gap-4 md:gap-6">
                                        <button type="button" onClick={() => setViewMode("list")} className="w-full sm:w-auto px-6 md:px-12 py-4 md:py-6 bg-slate-50 text-slate-400 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:text-slate-900 transition-all">ABORT</button>
                                        <button type="submit" className="w-full sm:w-auto px-8 md:px-20 py-4 md:py-6 bg-gradient-to-r from-[#f84464] to-[#c026d3] text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-pink-500/20 hover:scale-105 transition-all">
                                            <Save size={18} className="inline mr-2 md:mr-3" strokeWidth={3} /> COMMIT SERVICE
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* OVERVIEW TAB */}
                            {activeTab === "overview" && (
                                <div className="space-y-12">
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10">
                                        {stats.map((stat) => (
                                            <div key={stat.label} className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-50 shadow-sm hover:shadow-2xl transition-all relative overflow-hidden group">
                                                <div className="relative z-10 space-y-6">
                                                    <div className="flex items-center justify-between">
                                                        <div className={`w-14 h-14 ${stat.color} rounded-2xl flex items-center justify-center text-white shadow-xl transition-transform group-hover:rotate-12`}>
                                                            <stat.icon size={24} />
                                                        </div>
                                                        <div className="bg-emerald-50 text-emerald-500 px-3 py-1.5 rounded-full text-[9px] font-black">{stat.trend}</div>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mb-2">{stat.label}</p>
                                                        <p className="text-4xl font-black text-[#1A1C2E] italic tracking-tighter">{stat.value}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                                        <div className="lg:col-span-2 bg-white rounded-[3rem] p-10 border border-slate-50 shadow-sm">
                                            <h3 className="text-2xl font-black text-[#1A1C2E] uppercase italic tracking-tighter mb-10">RECENT ENGAGEMENTS</h3>
                                            <div className="space-y-4">
                                                {bookings.slice(0, 5).map((booking) => (
                                                    <div key={booking.id} className="p-6 bg-slate-50 rounded-[2rem] flex items-center justify-between group hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-pink-50">
                                                        <div className="flex items-center gap-6">
                                                            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-300 group-hover:bg-[#1A1C2E] group-hover:text-pink-500 transition-all shadow-sm">
                                                                <Ticket size={20} />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-[#1A1C2E] uppercase italic tracking-tighter">{booking.provider_services?.service_name}</p>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{booking.profiles?.full_name} · {new Date(booking.created_at).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-6">
                                                            <p className="text-base font-black text-[#1A1C2E]">₹{booking.amount}</p>
                                                            <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${booking.booking_status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                                {booking.booking_status}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-[#1A1C2E] rounded-[3rem] p-10 text-white shadow-2xl flex flex-col justify-between">
                                            <div>
                                                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8">
                                                    <Zap size={32} className="text-pink-500" />
                                                </div>
                                                <h3 className="text-3xl font-black tracking-tighter uppercase italic leading-tight">YIELD<br/>BOOSTER</h3>
                                                <p className="text-slate-400 text-sm font-bold mt-6 leading-relaxed italic opacity-80">AI Insight: You have high demand for "{services[0]?.service_name || "Services"}". Consider adding 3 more slots this week.</p>
                                            </div>
                                            <button className="w-full py-5 bg-gradient-to-r from-[#f84464] to-[#c026d3] rounded-[2rem] text-[11px] font-black uppercase tracking-widest shadow-xl shadow-pink-500/20 hover:scale-105 transition-all mt-12">
                                                OPTIMIZE CATALOG
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SERVICES TAB */}
                            {activeTab === "services" && (
                                <div className="space-y-10">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-3xl font-black text-[#1A1C2E] uppercase italic tracking-tighter leading-none">SERVICE CATALOG</h3>
                                        <button 
                                            onClick={() => { setServiceForm({ service_name: "", description: "", pricing: "", status: "Published" }); setSelectedService(null); setViewMode("config"); }}
                                            className="px-6 md:px-10 py-3 md:py-5 bg-[#1A1C2E] text-white rounded-[2rem] text-[10px] md:text-[11px] font-black uppercase tracking-widest flex items-center gap-2 md:gap-4 hover:scale-105 transition-all shadow-2xl"
                                        >
                                            <Plus size={16} md:size={20} strokeWidth={3} /> <span className="hidden sm:inline">ADD NEW SERVICE</span><span className="sm:hidden">ADD</span>
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                                        {services.map((svc) => (
                                            <div key={svc.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-sm hover:shadow-2xl hover:border-pink-50 transition-all group">
                                                <div className="flex items-center justify-between mb-8">
                                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-[#1A1C2E] group-hover:text-pink-500 transition-all">
                                                        <Package size={24} />
                                                    </div>
                                                    <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${svc.status === 'Published' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-400'}`}>
                                                        {svc.status}
                                                    </div>
                                                </div>
                                                <h4 className="text-2xl font-black text-[#1A1C2E] uppercase italic tracking-tighter mb-4">{svc.service_name}</h4>
                                                <p className="text-sm font-bold text-slate-400 leading-relaxed mb-10 line-clamp-2">{svc.description}</p>
                                                <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                                                    <p className="text-2xl font-black text-[#1A1C2E]">₹{svc.pricing}</p>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => { setServiceForm(svc); setSelectedService(svc); setViewMode("config"); }} className="p-3 bg-slate-50 text-slate-300 rounded-xl hover:bg-[#1A1C2E] hover:text-white transition-all"><Edit3 size={18} /></button>
                                                        <button onClick={() => { if(confirm("Terminate this service?")) supabase.from("provider_services").delete().eq("id", svc.id).then(fetchAllData); }} className="p-3 bg-slate-50 text-red-200 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18} /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* FINANCIALS TAB */}
                            {activeTab === "wallet" && (
                                <div className="space-y-12">
                                    <h3 className="text-3xl font-black text-[#1A1C2E] uppercase italic tracking-tighter leading-none">FINANCIAL HUB</h3>
                                    <div className="bg-white rounded-[3rem] p-10 border border-slate-50 shadow-sm">
                                        <PayoutRequestPanel requesterType="provider" />
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
