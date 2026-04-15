"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthContext";
import { 
    Plus, 
    Trash2, 
    Edit3, 
    Clock, 
    MapPin, 
    Info, 
    CheckCircle, 
    XCircle,
    ChevronRight,
    Search,
    Filter,
    Activity,
    Settings,
    LayoutDashboard,
    PlusCircle,
    Copy,
    Users,
    DollarSign,
    Settings2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function ManageTurfs() {
    const { user } = useAuth();
    const vendorId = user?.userId || user?.identifier;

    const [turfs, setTurfs] = useState([]);
    const refreshTurfs = () => supabase.from('turfs').select('*').eq('organiser_id', vendorId || '')
        .then(({ data }) => setTurfs(data || []));
    useEffect(() => { if (vendorId) refreshTurfs(); }, [vendorId]);
    
    const [selectedTurf, setSelectedTurf] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        location: "",
        address: "",
        lat: null,
        lng: null,
        pricePerHour: 1000,
        advanceAmount: 200,
        
        // New Pricing Fields
        pricingType: "flat", // "flat", "per_person", "tiered"
        maxCapacity: 20,
        pricePerPerson: 0,
        pricingTiers: [
            { min: 1, max: 5, price: 1000 },
            { min: 6, max: 10, price: 1800 }
        ],

        status: "active"
    });

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (selectedTurf?.id) {
                await supabase.from('turfs').update({ ...formData, organiser_id: vendorId }).eq('id', selectedTurf.id);
            } else {
                await supabase.from('turfs').insert({ ...formData, organiser_id: vendorId });
            }
            setShowAddModal(false);
            setFormData({ name: '', description: '', location: '', address: '', lat: null, lng: null, pricePerHour: 1000, advanceAmount: 200, status: 'active' });
            setSelectedTurf(null);
            refreshTurfs();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this turf?')) {
            await supabase.from('turfs').delete().eq('id', id);
            refreshTurfs();
        }
    };

    const openEdit = (turf) => {
        setSelectedTurf(turf);
        setFormData({
            name: turf.name,
            description: turf.description || "",
            location: turf.location || "",
            address: turf.address || "",
            lat: turf.lat || null,
            lng: turf.lng || null,
            pricePerHour: turf.pricePerHour,
            advanceAmount: turf.advanceAmount || 0,
            
            // New Pricing Fields
            pricingType: turf.pricingType || "flat",
            maxCapacity: turf.maxCapacity || 20,
            pricePerPerson: turf.pricePerPerson || 0,
            pricingTiers: turf.pricingTiers || [],

            status: turf.status
        });
        setShowAddModal(true);
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-500">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
                        Facility Management
                    </h2>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
                        Configure your turfs and define booking availability
                    </p>
                </div>
                
                <button 
                    onClick={() => { setSelectedTurf(null); setShowAddModal(true); }}
                    className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] shadow-xl shadow-blue-500/20 hover:scale-105 transition-all flex items-center gap-3 uppercase tracking-widest"
                >
                    <PlusCircle size={16} />
                    Establish New Facility
                </button>
            </div>

            {/* Turf List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {turfs?.map((turf) => (
                    <motion.div 
                        key={turf._id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden group hover:border-blue-500/20 transition-all hover:translate-y-[-4px]"
                    >
                        <div className="h-48 bg-slate-100 relative overflow-hidden">
                             {turf.images?.[0] ? (
                                <img src={turf.images[0]} alt={turf.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                             ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <Activity size={64} strokeWidth={1} />
                                </div>
                             )}
                             <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[9px] font-black text-blue-600 uppercase tracking-widest shadow-sm">
                                {turf.status}
                             </div>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-1">
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">{turf.name}</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <MapPin size={12} className="text-blue-500" />
                                    {turf.location || "Location not set"}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pricing Model</p>
                                    <p className="text-[10px] font-black text-blue-600 uppercase italic leading-tight">
                                        {turf.pricingType === 'per_person' ? 'Per Person' : turf.pricingType === 'tiered' ? 'Tiered' : 'Flat Rate'}
                                    </p>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 text-center">
                                    <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Base Rate</p>
                                    <p className="text-sm font-black text-blue-600 tracking-tighter">₹{turf.pricePerHour}/hr</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Capacity</p>
                                    <p className="text-[10px] font-black text-slate-900 uppercase">{turf.maxCapacity || 'N/A'} PAX</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Advance</p>
                                    <p className="text-[10px] font-black text-slate-900 uppercase">₹{turf.advanceAmount}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
                                <button 
                                    onClick={() => openEdit(turf)}
                                    className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                >
                                    <Edit3 size={14} />
                                    Edit Core
                                </button>
                                <Link 
                                    href={`/organiser/turf/manage/slots?turfId=${turf._id}`}
                                    className="flex-[1.5] py-3 bg-blue-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                                >
                                    <Clock size={14} />
                                    Define Slots
                                </Link>
                                <button 
                                    onClick={() => handleDelete(turf._id)}
                                    className="p-3 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {turfs?.length === 0 && (
                    <div className="col-span-full py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center space-y-6 shadow-sm">
                         <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-slate-200">
                            <Plus size={48} strokeWidth={1} />
                         </div>
                         <div className="space-y-2">
                             <h4 className="text-2xl font-black text-slate-900 uppercase italic">Empty Portfolio</h4>
                             <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest max-w-xs">Establish your first sport facility to start receiving bookings.</p>
                         </div>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md"
                            onClick={() => setShowAddModal(false)}
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl relative z-10 overflow-hidden"
                        >
                            <form onSubmit={handleSave} className="p-10 space-y-8">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
                                        {selectedTurf ? "Modify Facility" : "Establish New Facility"}
                                    </h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configure your turf&apos;s identity and pricing</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 col-span-full">
                                        <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest px-2">Turf Name</label>
                                        <input 
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-300 transition-all font-figtree"
                                            placeholder="e.g. Premium Wembley Arena"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest px-2">Base Price (Per Hour)</label>
                                        <input 
                                            required
                                            type="number"
                                            value={formData.pricePerHour}
                                            onChange={(e) => setFormData({...formData, pricePerHour: parseInt(e.target.value)})}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-300 transition-all font-figtree"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest px-2">Advance Payment</label>
                                        <input 
                                            required
                                            type="number"
                                            value={formData.advanceAmount}
                                            onChange={(e) => setFormData({...formData, advanceAmount: parseInt(e.target.value)})}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-300 transition-all font-figtree"
                                        />
                                    </div>
                                    <div className="space-y-4 col-span-full">
                                        <div className="flex items-center justify-between px-2">
                                            <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Precise Location Mapping</label>
                                            <span className="text-[9px] font-bold text-slate-400">Click map to auto-fill</span>
                                        </div>
                                        <MapPicker 
                                          lat={formData.lat} 
                                          lng={formData.lng} 
                                          onLocationSelect={(data) => {
                                              setFormData({...formData, lat: data.lat, lng: data.lng, location: data.address || formData.location });
                                          }} 
                                        />
                                        <input 
                                            required
                                            value={formData.location}
                                            onChange={(e) => setFormData({...formData, location: e.target.value})}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-300 transition-all font-figtree"
                                            placeholder="Extracted Display Name (Or manually type)"
                                        />
                                    </div>
                                    <div className="space-y-4 col-span-full border-t border-slate-50 pt-6">
                                        <div className="flex items-center gap-3">
                                            <Settings2 size={16} className="text-blue-500" />
                                            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Pricing Strategy</h4>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest px-2">Pricing Model</label>
                                                <select 
                                                    value={formData.pricingType}
                                                    onChange={(e) => setFormData({...formData, pricingType: e.target.value})}
                                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
                                                >
                                                    <option value="flat">Standard Flat Rate</option>
                                                    <option value="per_person">Per User Pricing</option>
                                                    <option value="tiered">Tiered Group Pricing</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest px-2">Maximum Capacity</label>
                                                <input 
                                                    type="number"
                                                    value={formData.maxCapacity}
                                                    onChange={(e) => setFormData({...formData, maxCapacity: parseInt(e.target.value)})}
                                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                                                    placeholder="e.g. 20"
                                                />
                                            </div>

                                            {formData.pricingType === "per_person" && (
                                                <div className="space-y-2 col-span-full animate-in fade-in slide-in-from-top-2">
                                                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-2">Price Per Person (₹)</label>
                                                    <input 
                                                        type="number"
                                                        value={formData.pricePerPerson}
                                                        onChange={(e) => setFormData({...formData, pricePerPerson: parseInt(e.target.value)})}
                                                        className="w-full px-6 py-4 bg-blue-50 border border-blue-100 rounded-2xl text-sm font-black text-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-figtree"
                                                    />
                                                </div>
                                            )}

                                            {formData.pricingType === "tiered" && (
                                                <div className="col-span-full space-y-4 animate-in fade-in slide-in-from-top-2">
                                                    <div className="flex items-center justify-between px-2">
                                                        <label className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Pricing Tiers/Groups</label>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setFormData({...formData, pricingTiers: [...(formData.pricingTiers || []), { min: 1, max: 10, price: 1000 }]})}
                                                            className="text-[9px] font-black text-purple-600 uppercase tracking-widest hover:underline"
                                                        >
                                                            + Add Tier
                                                        </button>
                                                    </div>
                                                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                                        {(formData.pricingTiers || []).map((tier, idx) => (
                                                            <div key={idx} className="p-4 bg-purple-50/30 rounded-2xl border border-purple-100 flex items-end gap-3 group relative">
                                                                <div className="flex-1 space-y-1">
                                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pax Range</span>
                                                                    <div className="flex items-center gap-1">
                                                                        <input type="number" value={tier.min} onChange={(e) => {
                                                                            const t = [...formData.pricingTiers];
                                                                            t[idx].min = parseInt(e.target.value);
                                                                            setFormData({...formData, pricingTiers: t});
                                                                        }} className="w-full p-2 bg-white rounded-lg text-xs font-black text-center border border-purple-100" />
                                                                        <span className="text-purple-300">-</span>
                                                                        <input type="number" value={tier.max} onChange={(e) => {
                                                                            const t = [...formData.pricingTiers];
                                                                            t[idx].max = parseInt(e.target.value);
                                                                            setFormData({...formData, pricingTiers: t});
                                                                        }} className="w-full p-2 bg-white rounded-lg text-xs font-black text-center border border-purple-100" />
                                                                    </div>
                                                                </div>
                                                                <div className="flex-1 space-y-1">
                                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Price (₹)</span>
                                                                    <input type="number" value={tier.price} onChange={(e) => {
                                                                        const t = [...formData.pricingTiers];
                                                                        t[idx].price = parseInt(e.target.value);
                                                                        setFormData({...formData, pricingTiers: t});
                                                                    }} className="w-full p-2 bg-white rounded-lg text-xs font-black text-purple-600 text-center border border-purple-100" />
                                                                </div>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => setFormData({...formData, pricingTiers: formData.pricingTiers.filter((_, i) => i !== idx)})}
                                                                    className="p-2 text-slate-300 hover:text-red-500 transition-all"
                                                                >
                                                                    <DollarSign size={16} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                                    <button 
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 py-4 bg-slate-50 text-slate-500 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-[2] py-4 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10"
                                    >
                                        Save Configuration
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
