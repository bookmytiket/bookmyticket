"use client";
import React, { useState } from "react";
import { 
    Plus, MapPin, Camera, Trash2, Edit3, 
    Settings2, Info, CheckCircle2, X,
    LayoutGrid, List, ChevronRight, Globe,
    Activity, Shield, Zap, Coffee, Video,
    FileText, ParkingCircle, Lightbulb, Package,
    UserCircle, Clock, Save, XCircle, ArrowLeft
} from "lucide-react";
import { useSupabaseQuery, useSupabaseMutation } from "@/hooks/useSupabase";
import { useAuth } from "@/components/AuthContext";
import { useToast } from "@/context/ToastContext";

const AMENITIES = [
    { id: 'parking', name: 'Parking', icon: <ParkingCircle size={20} /> },
    { id: 'changing_room', name: 'Changing Room', icon: <UserCircle size={20} /> },
    { id: 'lighting', name: 'Floodlights', icon: <Lightbulb size={20} /> },
    { id: 'washroom', name: 'Washroom', icon: <Activity size={20} /> },
    { id: 'cafe', name: 'Cafe/Snacks', icon: <Coffee size={20} /> },
    { id: 'equipment', name: 'Equipment Hire', icon: <Package size={20} /> },
    { id: 'water', name: 'Drinking Water', icon: <Zap size={20} /> },
    { id: 'seating', name: 'Spectator Seating', icon: <LayoutGrid size={20} /> },
];

const SPORTS = [
    'Football', 'Cricket', 'Badminton', 'Tennis', 'Basketball', 'Swimming', 'Volleyball'
];

export default function FacilitiesPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [viewMode, setViewMode] = useState("list"); // "list" or "config"
    const [selectedTurf, setSelectedTurf] = useState(null);
    const [displayView, setDisplayView] = useState("grid");
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

    const handleOpenConfig = (turf = null) => {
        if (turf) {
            setSelectedTurf(turf);
            setFormData({
                ...turf,
                images: turf.images?.length > 0 ? [...turf.images] : [""]
            });
        } else {
            setSelectedTurf(null);
            setFormData(initialForm);
        }
        setViewMode("config");
        setActiveTab("basic");
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            partner_id: user.id,
            images: formData.images.filter(img => img.trim() !== "")
        };

        try {
            if (selectedTurf) {
                await updateTurf({ ...payload, id: selectedTurf.id });
                showToast("Configuration synchronized", "success");
            } else {
                await createTurf(payload);
                showToast("Facility deployed", "success");
            }
            setViewMode("list");
            reloadTurfs();
        } catch (err) {
            showToast(err.message, "error");
        }
    };

    if (viewMode === "config") {
        return (
            <div className="space-y-10 animate-in slide-in-from-right-8 duration-700">
                <div className="flex items-center justify-between">
                    <button 
                        onClick={() => setViewMode("list")}
                        className="px-8 py-4 bg-slate-50 text-[#1A1C2E] rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-[#1A1C2E] hover:text-white transition-all shadow-sm"
                    >
                        <ArrowLeft size={16} strokeWidth={3} />
                        BACK TO INVENTORY
                    </button>
                    <div className="text-right">
                        <h2 className="text-4xl font-black text-[#1A1C2E] uppercase italic tracking-tighter leading-none">FACILITY CONFIG</h2>
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em] mt-2">Architectural management node</p>
                    </div>
                </div>

                <div className="bg-white rounded-[3.5rem] border border-slate-50 shadow-2xl overflow-hidden flex flex-col lg:flex-row">
                    {/* Config Sidebar */}
                    <div className="lg:w-80 bg-slate-50 p-10 space-y-3">
                        {[
                            { id: "basic", label: "IDENTITY", icon: LayoutGrid },
                            { id: "sports", label: "ATHLETICS", icon: Activity },
                            { id: "media", label: "SHOWCASE", icon: Camera },
                            { id: "policies", label: "RULES", icon: FileText },
                            { id: "amenities", label: "UTILITIES", icon: Zap },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-5 px-8 py-5 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                                    activeTab === tab.id ? 'bg-[#1A1C2E] text-white shadow-2xl' : 'text-slate-300 hover:text-[#1A1C2E] hover:bg-white/50'
                                }`}
                            >
                                <tab.icon size={18} strokeWidth={activeTab === tab.id ? 3 : 2} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Form Area */}
                    <div className="flex-1 p-8 lg:p-12">
                        <form onSubmit={handleSave} className="space-y-8">
                            <div className="space-y-2 mb-8">
                                <h3 className="text-xl font-black text-[#1A1C2E] uppercase italic tracking-tighter leading-none">MODULE: {activeTab.toUpperCase()}</h3>
                                <div className="h-1 w-20 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full" />
                            </div>

                            {activeTab === 'basic' && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">FACILITY NAME</label>
                                            <input 
                                                className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-black border-none focus:ring-4 focus:ring-pink-500/5 transition-all uppercase italic text-[#1A1C2E]" 
                                                value={formData.name} 
                                                onChange={e => setFormData({...formData, name: e.target.value})} 
                                                required 
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">CITY HUB</label>
                                            <input 
                                                className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-black border-none focus:ring-4 focus:ring-pink-500/5 transition-all uppercase italic text-[#1A1C2E]" 
                                                value={formData.city} 
                                                onChange={e => setFormData({...formData, city: e.target.value})} 
                                                required 
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">FULL ADDRESS</label>
                                        <textarea 
                                            className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-black border-none focus:ring-4 focus:ring-pink-500/5 transition-all uppercase italic text-[#1A1C2E]" 
                                            rows={3}
                                            value={formData.address} 
                                            onChange={e => setFormData({...formData, address: e.target.value})} 
                                            required 
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">OPENING</label>
                                            <input type="time" className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-black border-none text-[#1A1C2E]" value={formData.opening_time} onChange={e => setFormData({...formData, opening_time: e.target.value})} />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">CLOSING</label>
                                            <input type="time" className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-black border-none text-[#1A1C2E]" value={formData.closing_time} onChange={e => setFormData({...formData, closing_time: e.target.value})} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'sports' && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">SELECT SUPPORTED ATHLETICS</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {SPORTS.map(sport => {
                                            const isSelected = formData.sports_supported.includes(sport);
                                            return (
                                                <button 
                                                    key={sport}
                                                    type="button"
                                                    onClick={() => {
                                                        const next = isSelected 
                                                            ? formData.sports_supported.filter(s => s !== sport)
                                                            : [...formData.sports_supported, sport];
                                                        setFormData({...formData, sports_supported: next});
                                                    }}
                                                    className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                                        isSelected ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-transparent shadow-xl' : 'bg-slate-50 text-slate-400 border-transparent hover:border-pink-200'
                                                    }`}
                                                >
                                                    {sport}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'media' && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">IMAGE GALLERY (URLS)</label>
                                        {formData.images.map((img, idx) => (
                                            <div key={idx} className="flex gap-4">
                                                <input 
                                                    className="flex-1 bg-slate-50 p-4 rounded-2xl text-sm font-black border-none text-[#1A1C2E]" 
                                                    placeholder="URL..."
                                                    value={img}
                                                    onChange={e => {
                                                        const next = [...formData.images];
                                                        next[idx] = e.target.value;
                                                        setFormData({...formData, images: next});
                                                    }}
                                                />
                                                <button type="button" onClick={() => setFormData({...formData, images: formData.images.filter((_, i) => i !== idx)})} className="p-4 text-red-400 bg-red-50 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18} /></button>
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => setFormData({...formData, images: [...formData.images, ""]})} className="w-full p-4 border-2 border-dashed border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-[#1A1C2E] hover:text-[#1A1C2E] transition-all">+ ADD IMAGE SLOT</button>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">PROMO VIDEO URL</label>
                                        <input className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-black border-none text-[#1A1C2E]" value={formData.promo_video_url} onChange={e => setFormData({...formData, promo_video_url: e.target.value})} placeholder="VIMEO / YOUTUBE / MP4 LINK" />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'policies' && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">RULES & POLICIES</label>
                                        <textarea rows={6} className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-black border-none focus:ring-4 focus:ring-pink-500/5 transition-all uppercase italic text-[#1A1C2E]" value={formData.rules_and_policies} onChange={e => setFormData({...formData, rules_and_policies: e.target.value})} placeholder="e.g. NO SMOKING, STUDS NOT ALLOWED..." />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">PARKING & ACCESS</label>
                                        <textarea rows={3} className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-black border-none focus:ring-4 focus:ring-pink-500/5 transition-all uppercase italic text-[#1A1C2E]" value={formData.parking_details} onChange={e => setFormData({...formData, parking_details: e.target.value})} placeholder="e.g. 20 SLOTS AVAILABLE, VALET PARKING..." />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'amenities' && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">VENUE UTILITIES</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {AMENITIES.map(amn => {
                                            const isSelected = formData.amenities.includes(amn.id);
                                            return (
                                                <button 
                                                    key={amn.id}
                                                    type="button"
                                                    onClick={() => {
                                                        const next = isSelected 
                                                            ? formData.amenities.filter(id => id !== amn.id)
                                                            : [...formData.amenities, amn.id];
                                                        setFormData({...formData, amenities: next});
                                                    }}
                                                    className={`p-4 rounded-2xl flex items-center gap-4 transition-all border ${
                                                        isSelected ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-lg' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-white hover:border-pink-100'
                                                    }`}
                                                >
                                                    {amn.icon}
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{amn.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="pt-12 flex justify-end gap-6">
                                <button type="button" onClick={() => setViewMode("list")} className="px-12 py-6 bg-slate-50 text-slate-400 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:text-[#1A1C2E] transition-all">ABORT CONFIG</button>
                                <button type="submit" className="px-20 py-6 bg-gradient-to-r from-[#f84464] to-[#c026d3] text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-pink-100 hover:scale-105 transition-all">
                                    <Save size={18} className="inline mr-3" strokeWidth={3} /> COMMIT DEPLOYMENT
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-1000">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[1.8rem] bg-[#1A1C2E] flex items-center justify-center text-white shadow-xl shadow-slate-200 shrink-0">
                        <LayoutGrid size={28} />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-[#1A1C2E] tracking-tighter uppercase italic leading-none">FACILITY INVENTORY</h2>
                        <p className="text-slate-400 font-bold text-[10px] mt-2 uppercase tracking-[0.4em]">Architectural management hub</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-6">
                    <div className="flex bg-slate-50 p-1.5 rounded-[1.5rem] border border-slate-100">
                        <button onClick={() => setDisplayView("grid")} className={`p-3 rounded-xl transition-all ${displayView === 'grid' ? 'bg-[#1A1C2E] text-white shadow-lg' : 'text-slate-300 hover:text-[#1A1C2E]'}`}>
                            <LayoutGrid size={20} />
                        </button>
                        <button onClick={() => setDisplayView("list")} className={`p-3 rounded-xl transition-all ${displayView === 'list' ? 'bg-[#1A1C2E] text-white shadow-lg' : 'text-slate-300 hover:text-[#1A1C2E]'}`}>
                            <List size={20} />
                        </button>
                    </div>
                    <button 
                        onClick={() => handleOpenConfig()}
                        className="px-10 py-5 bg-gradient-to-r from-[#f84464] to-[#c026d3] text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-pink-100"
                    >
                        <Plus size={20} strokeWidth={3} />
                        DEPLOY NEW FACILITY
                    </button>
                </div>
            </div>

            {/* List Section */}
            {turfs.length === 0 ? (
                <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-100 p-32 text-center space-y-10">
                    <div className="w-28 h-28 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                        <Globe size={56} />
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-3xl font-black text-[#1A1C2E] uppercase italic tracking-tighter">NO FACILITIES DETECTED</h3>
                        <p className="text-slate-300 font-bold uppercase text-[10px] tracking-[0.3em]">Start your deployment journey today</p>
                    </div>
                </div>
            ) : (
                <div className={displayView === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10" : "space-y-6"}>
                    {turfs.map((turf) => (
                        <div key={turf.id} className={`bg-white rounded-[2.5rem] border border-slate-50 overflow-hidden shadow-sm hover:shadow-2xl hover:border-pink-50 transition-all group ${displayView === 'list' ? 'flex items-center p-6' : ''}`}>
                            <div className={displayView === 'grid' ? "h-64 relative overflow-hidden" : "w-48 h-32 rounded-2xl overflow-hidden shrink-0"}>
                                <img 
                                    src={turf.images?.[0] || "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800"} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                    alt={turf.name} 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute bottom-6 left-6 flex items-center gap-3">
                                    <div className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg text-[9px] font-black text-white uppercase tracking-widest italic">
                                        {turf.status}
                                    </div>
                                </div>
                            </div>

                            <div className={`p-8 space-y-6 ${displayView === 'list' ? 'flex-1' : ''}`}>
                                <div>
                                    <h4 className="text-2xl font-black text-[#1A1C2E] uppercase italic tracking-tighter group-hover:text-[#f84464] transition-colors">{turf.name}</h4>
                                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2 flex items-center gap-2">
                                        <MapPin size={12} className="text-pink-500" /> {turf.city} hub
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {turf.sports_supported?.slice(0, 3).map(s => (
                                        <span key={s} className="px-3 py-1.5 bg-slate-50 text-slate-400 rounded-lg text-[8px] font-black uppercase tracking-widest">{s}</span>
                                    ))}
                                </div>

                                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex gap-2">
                                        <button onClick={() => handleOpenConfig(turf)} className="p-3 bg-slate-50 text-slate-300 rounded-xl hover:bg-[#1A1C2E] hover:text-white transition-all"><Edit3 size={18} /></button>
                                        <button onClick={() => { if(confirm("Terminate this facility?")) deleteTurf({id: turf.id}).then(reloadTurfs); }} className="p-3 bg-slate-50 text-red-200 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18} /></button>
                                    </div>
                                    <button className="text-[10px] font-black text-[#f84464] uppercase tracking-[0.2em] hover:text-[#c026d3] flex items-center gap-2 group">
                                        COURT MANAGEMENT <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
