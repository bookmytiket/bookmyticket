"use client";
import React, { useState, useEffect } from "react";
import { useSupabaseQuery, useSupabaseMutation } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthContext";
import { getVendorAccountKey } from "@/lib/vendorAccount";
import { 
    Plus, Trash2, Save, Info, Camera, Sparkles, 
    DollarSign, Clock, CheckCircle2, Settings2, 
    Package, X, Share, MapPin, Search, Edit3, 
    LayoutGrid, List, Globe, ArrowLeft, TrendingUp
} from "lucide-react";
import PromoteModal from "@/components/PromoteModal";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import UniversalServiceForm from "./components/UniversalServiceForm";

export default function ServicesPage() {
    const { user } = useAuth();
    const vendorId = getVendorAccountKey(user);
    const { showToast } = useToast();
    
    const [view, setView] = useState("list"); // "list", "create", "edit"
    const [editingService, setEditingService] = useState(null);

    // Get full profile from service_providers
    const { data: profileArr = [] } = useSupabaseQuery('service_providers', (q) => 
        q.or(`id.eq.${vendorId},organiser_id.eq.${vendorId}`).maybeSingle()
    , [vendorId]);

    const profile = profileArr && !Array.isArray(profileArr) ? profileArr : null;

    // Fetch unified services
    const { data: services = [], reload: reloadServices } = useSupabaseQuery('services', (q) => 
        q.eq('provider_id', user?.id).order('created_at', { ascending: false })
    , [user?.id]);

    const isTurfVendor = user?.role === "turf_organiser" || 
                         user?.category?.toLowerCase().includes("turf") || 
                         profile?.category?.toLowerCase().includes("turf");

    if (isTurfVendor) {
        return <TurfServiceManagement user={user} vendorId={vendorId} profile={profile} />;
    }

    if (view === "create" || view === "edit") {
        return (
            <div className="min-h-screen bg-slate-50/30">
                <div className="max-w-5xl mx-auto px-6 py-8">
                    <button 
                        onClick={() => { setView("list"); setEditingService(null); }}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold uppercase text-[10px] tracking-widest transition-colors mb-8"
                    >
                        <ArrowLeft size={14} /> Back to Dashboard
                    </button>
                    <UniversalServiceForm 
                        initialData={editingService || {}} 
                        onSave={() => {
                            reloadServices();
                            setView("list");
                            setEditingService(null);
                        }}
                        onCancel={() => {
                            setView("list");
                            setEditingService(null);
                        }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/30 p-6 md:p-10">
            <div className="max-w-6xl mx-auto space-y-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-200">
                                <Sparkles size={24} />
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">Service Hub</h1>
                        </div>
                        <p className="text-slate-500 text-sm font-medium pl-1">Manage your professional listings and packages</p>
                    </div>
                    <button 
                        onClick={() => setView("create")}
                        className="px-8 py-4 bg-slate-900 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest flex items-center gap-3 hover:bg-black hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-slate-200"
                    >
                        <Plus size={18} />
                        Publish New Service
                    </button>
                </div>

                {/* Stats / Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { label: "Active Services", value: services.length, icon: Globe, color: "text-blue-600", bg: "bg-blue-50" },
                        { label: "Total Bookings", value: "0", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
                        { label: "Profile Views", value: "1.2k", icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5">
                            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                                <stat.icon size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Listings Grid */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">My Listings</h2>
                        <div className="flex bg-white p-1 rounded-xl border border-slate-100">
                            <button className="p-2 bg-slate-50 text-slate-900 rounded-lg"><LayoutGrid size={16} /></button>
                            <button className="p-2 text-slate-400"><List size={16} /></button>
                        </div>
                    </div>

                    {services.length === 0 ? (
                        <div className="bg-white rounded-[3rem] border border-dashed border-slate-200 p-20 text-center space-y-6">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                <Package size={40} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">No services published yet</h3>
                                <p className="text-slate-500 text-sm font-medium">Start by creating your first professional service listing.</p>
                            </div>
                            <button 
                                onClick={() => setView("create")}
                                className="px-8 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest"
                            >
                                Get Started
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {services.map((service) => (
                                <div key={service.id} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group">
                                    <div className="aspect-video bg-slate-100 relative overflow-hidden">
                                        {service.images?.[0] ? (
                                            <img src={service.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300"><Camera size={40} /></div>
                                        )}
                                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-900 shadow-sm">
                                            {service.status}
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{service.category}</p>
                                            <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase truncate">{service.service_name}</h3>
                                        </div>
                                        <div className="flex items-center gap-4 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                                            <div className="flex items-center gap-1"><MapPin size={12} /> {service.city || "All Cities"}</div>
                                            <div className="flex items-center gap-1"><DollarSign size={12} /> {service.price}</div>
                                        </div>
                                        <div className="pt-4 border-t border-slate-50 flex items-center gap-2">
                                            <button 
                                                onClick={() => { setEditingService(service); setView("edit"); }}
                                                className="flex-1 py-3 bg-slate-50 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                            >
                                                <Edit3 size={14} /> Edit
                                            </button>
                                            <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function TurfServiceManagement({ user, vendorId, profile }) {
    const { showToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTurf, setSelectedTurf] = useState(null);
    const [view, setView] = useState("grid");
    const [activeTab, setActiveTab] = useState("basic");

    const { data: turfs = [], reload: reloadTurfs } = useSupabaseQuery('turfs', (q) => 
        q.eq('partner_id', user?.id).order('created_at', { ascending: false })
    , [user?.id]);

    const [createTurf] = useSupabaseMutation('turfs', 'insert');
    const [updateTurf] = useSupabaseMutation('turfs', 'update', (q, p) => q.eq('id', p.id));
    const [deleteTurf] = useSupabaseMutation('turfs', 'delete', (q, p) => q.eq('id', p.id));

    const initialForm = {
        name: "",
        description: "",
        address: "",
        city: "",
        sports_supported: [],
        amenities: [],
        opening_time: "06:00",
        closing_time: "23:00",
        images: [""],
        promo_video_url: "",
        rules_and_policies: "",
        parking_details: "",
        status: "active"
    };

    const [formData, setFormData] = useState(initialForm);

    const handleOpenModal = (turf = null) => {
        setActiveTab("basic");
        if (turf) {
            setSelectedTurf(turf);
            setFormData({ ...initialForm, ...turf, images: turf.images?.length > 0 ? [...turf.images] : [""] });
        } else {
            setSelectedTurf(null);
            setFormData(initialForm);
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, partner_id: user.id, images: formData.images.filter(img => img.trim() !== "") };
            if (selectedTurf) {
                await updateTurf({ ...payload, id: selectedTurf.id });
                showToast("Configuration synchronized", "success");
            } else {
                await createTurf(payload);
                showToast("Facility deployed", "success");
            }
            setIsModalOpen(false);
            reloadTurfs();
        } catch (err) {
            showToast(err.message, "error");
        }
    };

    return (
        <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-1000">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[1.8rem] bg-[#1A1C2E] flex items-center justify-center text-white shadow-xl shadow-slate-200 shrink-0">
                        <LayoutGrid size={28} />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-[#1A1C2E] tracking-tighter uppercase italic leading-none">TURF MANAGER</h2>
                        <p className="text-slate-400 font-bold text-sm mt-2 uppercase tracking-widest">Architectural management hub</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => handleOpenModal()}
                        className="px-10 py-5 bg-gradient-to-r from-[#f84464] to-[#c026d3] text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-pink-100"
                    >
                        <Plus size={20} strokeWidth={3} />
                        DEPLOY NEW FACILITY
                    </button>
                </div>
            </div>

            {/* List Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12">
                {turfs.map((turf) => (
                    <div key={turf.id} className="bg-white rounded-[3.5rem] border border-slate-50 overflow-hidden shadow-sm hover:shadow-2xl hover:border-pink-50 transition-all group">
                        <div className="aspect-[4/3] w-full bg-slate-50 relative overflow-hidden shrink-0 rounded-[2.5rem]">
                            {turf.images?.[0] ? <img src={turf.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" /> : <div className="w-full h-full flex items-center justify-center text-slate-200"><Camera size={48} /></div>}
                        </div>
                        <div className="p-10 space-y-8 flex-1">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-black text-[#1A1C2E] tracking-tighter uppercase italic truncate">{turf.name}</h3>
                                <div className="flex gap-3">
                                    <button onClick={() => handleOpenModal(turf)} className="p-3 bg-slate-50 text-slate-300 rounded-2xl hover:bg-[#1A1C2E] hover:text-white transition-all shadow-sm"><Edit3 size={18} /></button>
                                    <button onClick={() => { if(confirm("Terminate this facility?")) deleteTurf({ id: turf.id }).then(reloadTurfs); }} className="p-3 bg-slate-50 text-red-200 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 size={18} /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-[#1A1C2E]/60 backdrop-blur-md overflow-y-auto">
                    <div className="bg-white w-full max-w-5xl rounded-[4rem] shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-300 relative">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-10 right-10 p-4 bg-slate-50 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all z-20"><X size={24} /></button>
                        <div className="flex">
                            <div className="w-64 bg-slate-50 p-10 space-y-3 hidden lg:block">
                                {["basic", "media", "policies", "amenities"].map((tab) => (
                                    <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#1A1C2E] text-white shadow-xl' : 'text-slate-300 hover:text-[#1A1C2E]'}`}>{tab.toUpperCase()}</button>
                                ))}
                            </div>
                            <div className="flex-1 p-16 md:p-24 space-y-12">
                                <form onSubmit={handleSave} className="space-y-12 h-[50vh] overflow-y-auto scrollbar-hide px-2">
                                    {activeTab === 'basic' && (
                                        <div className="space-y-10">
                                            <div className="grid grid-cols-2 gap-10">
                                                <input className="w-full bg-slate-50 p-6 rounded-[1.8rem] text-sm font-black border-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="FACILITY NAME" required />
                                                <input className="w-full bg-slate-50 p-6 rounded-[1.8rem] text-sm font-black border-none" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="CITY HUB" required />
                                            </div>
                                            <textarea className="w-full bg-slate-50 p-6 rounded-[1.8rem] text-sm font-black border-none" rows={3} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="FULL ADDRESS" required />
                                        </div>
                                    )}
                                    <div className="pt-12 flex justify-end gap-6">
                                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-12 py-6 bg-slate-50 text-slate-300 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:text-slate-900 transition-all">ABORT</button>
                                        <button type="submit" className="px-20 py-6 bg-[#1A1C2E] text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-black transition-all">COMMIT DEPLOYMENT</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
