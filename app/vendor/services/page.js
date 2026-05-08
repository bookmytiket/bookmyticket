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
    const { data: turfs = [] } = useSupabaseQuery('turfs', (q) => 
        q.eq('organiser_id', vendorId)
    , [vendorId]);

    const [createTurf] = useSupabaseMutation('turfs', 'insert');
    const [updateTurf] = useSupabaseMutation('turfs', 'update', (q, p) => q.eq('id', p.id));
    const [deleteTurf] = useSupabaseMutation('turfs', 'delete', (q, p) => q.eq('id', p.id));
    
    const [selectedTurf, setSelectedTurf] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    
    const initialForm = {
        name: "",
        description: "",
        location: "",
        city: "",
        address: "",
        price_per_hour: 1000,
        advance_amount: 200,
        pricing_type: "flat",
        max_capacity: 20,
        price_per_person: 0,
        pricing_tiers: [
            { min: 1, max: 5, price: 1000 },
            { min: 6, max: 10, price: 1800 }
        ],
        images: [""],
        amenities: [],
        status: "active"
    };

    const [formData, setFormData] = useState(initialForm);

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (e) => {
        e.preventDefault();
        if (isSaving) return;
        
        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                images: formData.images.filter(img => img.trim() !== ""),
                organiser_id: vendorId,
            };

            if (selectedTurf?.id) {
                await updateTurf({ ...payload, id: selectedTurf.id });
            } else {
                const result = await createTurf(payload);
                if (!result.success) throw result.error || new Error("Deployment failed");
            }

            setShowAddModal(false);
            setFormData(initialForm);
            setSelectedTurf(null);
            showToast(selectedTurf ? "Configuration updated!" : "Facility deployed successfully!", "success");
        } catch (err) {
            console.error("Deployment error:", err);
            showToast(err.message || "Deployment failed", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (confirm("Are you sure you want to delete this facility?")) {
            try {
                await deleteTurf({ id });
                showToast("Facility deleted", "info");
            } catch (err) {
                showToast("Failed to delete facility", "error");
            }
        }
    };

    const openEdit = (turf) => {
        setSelectedTurf(turf);
        setFormData({
            name: turf.name,
            description: turf.description || "",
            location: turf.location || "",
            city: turf.city || "",
            address: turf.address || "",
            price_per_hour: turf.price_per_hour,
            advance_amount: turf.advance_amount || 0,
            pricing_type: turf.pricing_type || "flat",
            max_capacity: turf.max_capacity || 20,
            price_per_person: turf.price_per_person || 0,
            pricing_tiers: turf.pricing_tiers || [],
            images: turf.images?.length > 0 ? [...turf.images] : [""],
            amenities: turf.amenities || [],
            status: turf.status
        });
        setShowAddModal(true);
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-xl shadow-emerald-200">
                            <MapPin size={24} />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">Turf Manager</h1>
                    </div>
                    <p className="text-slate-500 text-sm font-medium pl-15">Deploy and manage your sporting facilities</p>
                </div>
                <button 
                    onClick={() => { setFormData(initialForm); setSelectedTurf(null); setShowAddModal(true); }}
                    className="px-8 py-4 bg-slate-900 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest flex items-center gap-3 hover:bg-black transition-all shadow-2xl shadow-slate-200"
                >
                    <Plus size={18} /> Deploy New Turf
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {turfs.map((turf) => (
                    <div key={turf.id} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all">
                        <div className="aspect-video bg-slate-100 relative">
                            {turf.images?.[0] ? (
                                <img src={turf.images[0]} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300"><Camera size={40} /></div>
                            )}
                        </div>
                        <div className="p-6 space-y-4">
                            <h3 className="text-xl font-black text-slate-900 uppercase truncate">{turf.name}</h3>
                            <div className="flex items-center gap-4 text-[10px] font-black uppercase text-slate-400">
                                <span>{turf.city}</span>
                                <span>₹{turf.price_per_hour}/hr</span>
                            </div>
                            <div className="pt-4 flex items-center gap-2">
                                <button onClick={() => openEdit(turf)} className="flex-1 py-3 bg-slate-50 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all">Edit</button>
                                <button onClick={() => handleDelete(turf.id)} className="p-3 bg-slate-50 text-red-400 rounded-xl hover:bg-red-50 transition-all"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden my-auto">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-2xl font-black text-slate-900 uppercase italic">Facility Configuration</h2>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white rounded-full transition-all"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase text-slate-400">Facility Name</label>
                                    <input className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-bold border-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase text-slate-400">City</label>
                                    <input className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-bold border-none" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required />
                                </div>
                            </div>
                            <div className="flex justify-end gap-4 pt-8">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-8 py-4 text-slate-500 font-black uppercase text-[10px]">Cancel</button>
                                <button type="submit" disabled={isSaving} className="px-12 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-200">
                                    {isSaving ? "Saving..." : "Deploy Facility"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
