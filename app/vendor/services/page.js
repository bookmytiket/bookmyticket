"use client";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/AuthContext";
import { getVendorAccountKey } from "@/lib/vendorAccount";
import { 
    Plus, 
    Trash2, 
    Save, 
    Info, 
    Camera, 
    Sparkles, 
    Hand,
    DollarSign,
    Users,
    Truck,
    Clock,
    CheckCircle2,
    Settings2,
    Package,
    X,
    Share,
    MapPin
} from "lucide-react";
import PromoteModal from "@/components/PromoteModal";
import Link from "next/link";

export default function ServicesPage() {
    const { user } = useAuth();
    const vendorId = getVendorAccountKey(user);
    
    // Get full profile to know category
    const profile = useQuery(
        api.vendors.getByOrganiserId,
        vendorId ? { organiserId: vendorId } : "skip"
    );

    const isTurfVendor = user?.category?.toLowerCase().includes("turf");

    if (isTurfVendor) {
        return <TurfServiceManagement user={user} vendorId={vendorId} profile={profile} />;
    }

    return <ArtistServiceManagement user={user} vendorId={vendorId} profile={profile} />;
}

function TurfServiceManagement({ user, vendorId, profile }) {
    const turfs = useQuery(api.turfs.getByOrganiserId, { organiserId: vendorId || "" });
    const saveTurf = useMutation(api.turfs.saveTurf);
    const deleteTurf = useMutation(api.turfs.deleteTurf);
    
    const [selectedTurf, setSelectedTurf] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [promoteTurf, setPromoteTurf] = useState(null);
    
    const initialForm = {
        name: "",
        description: "",
        location: "",
        address: "",
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

        images: [""],
        amenities: [],
        status: "active"
    };

    const [formData, setFormData] = useState(initialForm);

    const AMENITIES_LIST = [
        "Floodlights", "Changing Rooms", "Drinking Water", "Parking", "Washrooms", 
        "CCTV", "First Aid", "Seating Area", "Power Backup", "Refreshments"
    ];

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await saveTurf({
                ...formData,
                images: formData.images.filter(img => img.trim() !== ""),
                organiserId: vendorId,
                id: selectedTurf?._id
            });
            setShowAddModal(false);
            setFormData(initialForm);
            setSelectedTurf(null);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (confirm("Are you sure you want to delete this facility? This will also remove all scheduled patterns.")) {
            await deleteTurf({ id });
        }
    };

    const openEdit = (turf) => {
        setSelectedTurf(turf);
        setFormData({
            name: turf.name,
            description: turf.description || "",
            location: turf.location || "",
            address: turf.address || "",
            pricePerHour: turf.pricePerHour,
            advanceAmount: turf.advanceAmount || 0,
            
            // New Pricing Fields
            pricingType: turf.pricingType || "flat",
            maxCapacity: turf.maxCapacity || 20,
            pricePerPerson: turf.pricePerPerson || 0,
            pricingTiers: turf.pricingTiers || [],

            images: turf.images?.length > 0 ? [...turf.images] : [""],
            amenities: turf.amenities || [],
            status: turf.status
        });
        setShowAddModal(true);
    };

    const addImageField = () => {
        if (formData.images.length < 5) {
            setFormData({ ...formData, images: [...formData.images, ""] });
        }
    };

    const removeImageField = (index) => {
        const newImages = formData.images.filter((_, i) => i !== index);
        setFormData({ ...formData, images: newImages.length === 0 ? [""] : newImages });
    };

    const updateImageField = (index, value) => {
        const newImages = [...formData.images];
        newImages[index] = value;
        setFormData({ ...formData, images: newImages });
    };

    const toggleAmenity = (amenity) => {
        const newAmenities = formData.amenities.includes(amenity)
            ? formData.amenities.filter(a => a !== amenity)
            : [...formData.amenities, amenity];
        setFormData({ ...formData, amenities: newAmenities });
    };

    const addTier = () => {
        setFormData({
            ...formData,
            pricingTiers: [...(formData.pricingTiers || []), { min: 1, max: 10, price: 1000 }]
        });
    };

    const updateTier = (index, field, value) => {
        const newTiers = [...formData.pricingTiers];
        newTiers[index] = { ...newTiers[index], [field]: value };
        setFormData({ ...formData, pricingTiers: newTiers });
    };

    const removeTier = (index) => {
        setFormData({
            ...formData,
            pricingTiers: formData.pricingTiers.filter((_, i) => i !== index)
        });
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
            {/* Header omitted for brevity in replace, keeping the same logic */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200">
                <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-400 p-3 shadow-2xl shadow-blue-500/20">
                            <Plus size={28} />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">Facility Operations</span>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">Pitch Manager</h2>
                        </div>
                    </div>
                    <p className="text-slate-500 text-sm max-w-xl font-medium">Standardize your sports infrastructure. Define pitches and hourly yields.</p>
                </div>
                <div className="flex gap-4">
                    <button 
                         onClick={() => { setSelectedTurf(null); setFormData(initialForm); setShowAddModal(true); }}
                        className="flex items-center space-x-3 bg-slate-900 px-10 py-4 rounded-2xl text-white font-black text-sm shadow-2xl shadow-slate-900/30 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest"
                    >
                        <Plus size={18} className="text-blue-400" />
                        <span>Add Pitch</span>
                    </button>
                </div>
            </div>

            {/* Turf List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10">
                {turfs?.map((turf) => (
                    <div 
                        key={turf._id}
                        className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden group hover:border-blue-500/20 transition-all flex flex-col"
                    >
                        <div className="h-56 bg-slate-50 relative overflow-hidden">
                             {turf.images?.[0] ? (
                                <img src={turf.images[0]} alt={turf.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                             ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-200">
                                    <Package size={80} strokeWidth={1} />
                                </div>
                             )}
                             <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md px-5 py-2 rounded-full text-[10px] font-black text-blue-600 uppercase tracking-widest shadow-sm">
                                {turf.status}
                             </div>
                        </div>

                        <div className="p-10 space-y-8 flex-1 flex flex-col">
                            <div className="space-y-4">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">{turf.name}</h3>
                                <div className="flex flex-wrap gap-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <MapPin size={12} className="text-blue-500" />
                                        {turf.location || "Coordinates not set"}
                                    </p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Users size={12} className="text-purple-500" />
                                        Capacity: {turf.maxCapacity || "N/A"}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 text-center space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pricing Model</p>
                                    <p className="text-xs font-black text-slate-900 tracking-tighter uppercase italic text-blue-600">
                                        {turf.pricingType || "Flat Rate"}
                                    </p>
                                </div>
                                <div className="p-5 bg-blue-50 rounded-[2rem] border border-blue-100 text-center space-y-1">
                                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Base Rate</p>
                                    <p className="text-xl font-black text-blue-600 tracking-tighter">₹{turf.pricePerHour}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-6 border-t border-slate-50 mt-auto">
                                <button 
                                    onClick={() => openEdit(turf)}
                                    className="px-6 py-4 bg-white border border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                >
                                    <Settings2 size={16} />
                                    Edit Core
                                </button>
                                <Link 
                                    href={`/vendor/services/slots?turfId=${turf._id}`}
                                    className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 hover:bg-blue-600"
                                >
                                    <Clock size={16} className="text-blue-400" />
                                    Slot Blueprint
                                </Link>
                                <button 
                                    onClick={() => setPromoteTurf(turf)}
                                    className="p-4 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-2xl transition-all border border-blue-100/50"
                                    title="Promote Facility"
                                >
                                    <Share size={16} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(turf._id)}
                                    className="p-4 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all border border-red-100/50"
                                    title="Delete Facility"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {turfs?.length === 0 && (
                    <div className="col-span-full py-40 bg-white rounded-[4rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center space-y-8 shadow-sm">
                         <div className="w-24 h-24 rounded-[3rem] bg-slate-50 flex items-center justify-center text-slate-100 border border-slate-100 shadow-inner">
                            <Plus size={48} strokeWidth={1} />
                         </div>
                         <div className="space-y-2">
                             <h4 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Negative Inventory</h4>
                             <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] max-w-xs leading-relaxed">Establish your first facility to initialize the revenue cycle.</p>
                         </div>
                    </div>
                )}
            </div>

            {/* Modal - Landscape Redesign */}
            {showAddModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-10">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl transition-opacity animate-in fade-in duration-500" onClick={() => setShowAddModal(false)} />
                    <div className="w-full max-w-6xl bg-white rounded-[3.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
                        <form onSubmit={handleSave} className="flex flex-col h-full max-h-[90vh]">
                            {/* Modal Header */}
                            <div className="p-10 pb-6 flex items-center justify-between border-b border-slate-50">
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
                                        {selectedTurf ? "Modify Facility" : "New Installation"}
                                    </h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pitch Manager & Advanced Yield Configuration</p>
                                </div>
                                <button type="button" onClick={() => setShowAddModal(false)} className="p-4 rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Content - 3 Column Layout */}
                            <div className="flex-1 overflow-y-auto p-10 pt-6 custom-scrollbar">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                                    
                                    {/* Column 1: Core Definitions */}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-3">
                                             <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black italic">01</div>
                                             <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Facility Identity</h4>
                                        </div>
                                        
                                        <div className="space-y-6">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Designation</label>
                                                <input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 outline-none" placeholder="e.g. Arena Uno" />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Infrastructure Description</label>
                                                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium focus:ring-4 focus:ring-blue-500/10 outline-none h-32 resize-none" placeholder="Define pitch quality..." />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Operational Zone</label>
                                                <input required value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 outline-none" placeholder="e.g. Sector 12, North Side" />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Address Specifications</label>
                                                <input required value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 outline-none" placeholder="Detailed structural location" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Column 2: Assets & Imagery */}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-3">
                                             <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black italic">02</div>
                                             <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Visual Assets & Perks</h4>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between px-1">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Facility Imagery</label>
                                                    <button type="button" onClick={addImageField} className="text-[9px] font-black text-blue-600 uppercase tracking-widest">+ Add URL</button>
                                                </div>
                                                <div className="space-y-2">
                                                    {formData.images.map((img, idx) => (
                                                        <div key={idx} className="flex gap-2">
                                                            <input value={img} onChange={(e) => updateImageField(idx, e.target.value)} className="flex-1 px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-blue-600 outline-none" placeholder="Image URL" />
                                                            <button type="button" onClick={() => removeImageField(idx)} className="p-3 bg-slate-50 text-slate-300 hover:text-red-500 rounded-xl"><X size={14} /></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-3 pt-4">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Available Amenities</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {AMENITIES_LIST.map((amenity) => (
                                                        <button 
                                                            key={amenity}
                                                            type="button"
                                                            onClick={() => toggleAmenity(amenity)}
                                                            className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-tighter border transition-all ${
                                                                formData.amenities.includes(amenity) ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                                                            }`}
                                                        >
                                                            {amenity}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Column 3: Yield & Dynamic Pricing */}
                                    <div className="space-y-8 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100">
                                        <div className="flex items-center gap-3">
                                             <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black italic">03</div>
                                             <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Yield Logic</h4>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Rate (₹)</label>
                                                    <input required type="number" value={formData.pricePerHour} onChange={(e) => setFormData({...formData, pricePerHour: parseInt(e.target.value)})} className="w-full px-5 py-3 bg-white border border-slate-100 rounded-xl text-xs font-black text-slate-900 outline-none focus:ring-4 focus:ring-purple-500/10" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Advance (₹)</label>
                                                    <input required type="number" value={formData.advanceAmount} onChange={(e) => setFormData({...formData, advanceAmount: parseInt(e.target.value)})} className="w-full px-5 py-3 bg-white border border-slate-100 rounded-xl text-xs font-black text-slate-900 outline-none focus:ring-4 focus:ring-purple-500/10" />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pricing Type</label>
                                                <select value={formData.pricingType} onChange={(e) => setFormData({...formData, pricingType: e.target.value})} className="w-full px-5 py-3 bg-white border border-slate-100 rounded-xl text-xs font-black text-slate-900 outline-none">
                                                    <option value="flat">Standard Flat Rate</option>
                                                    <option value="per_person">Per User Pricing</option>
                                                    <option value="tiered">Tiered Group Pricing</option>
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Facility Capacity</label>
                                                <input type="number" value={formData.maxCapacity} onChange={(e) => setFormData({...formData, maxCapacity: parseInt(e.target.value)})} className="w-full px-5 py-3 bg-white border border-slate-100 rounded-xl text-xs font-black text-slate-900 outline-none" placeholder="Maximum participants" />
                                            </div>

                                            {/* Conditional Pricing Fields */}
                                            {formData.pricingType === "per_person" && (
                                                <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3 animate-in fade-in slide-in-from-top-2">
                                                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Rate Per Person (₹)</label>
                                                    <input type="number" value={formData.pricePerPerson} onChange={(e) => setFormData({...formData, pricePerPerson: parseInt(e.target.value)})} className="w-full px-5 py-3 bg-white border border-blue-200 rounded-xl text-xs font-black text-blue-600 outline-none" />
                                                </div>
                                            )}

                                            {formData.pricingType === "tiered" && (
                                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Groups/Tiers</label>
                                                        <button type="button" onClick={addTier} className="text-[9px] font-black text-purple-600 uppercase tracking-widest">+ New Tier</button>
                                                    </div>
                                                    <div className="space-y-3 h-48 overflow-y-auto pr-2 custom-scrollbar">
                                                        {(formData.pricingTiers || []).map((tier, idx) => (
                                                            <div key={idx} className="p-4 bg-white rounded-2xl border border-purple-100 space-y-3 relative group">
                                                                <button type="button" onClick={() => removeTier(idx)} className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><X size={12} /></button>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <div className="space-y-1">
                                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Min - Max</span>
                                                                        <div className="flex items-center gap-1">
                                                                            <input type="number" value={tier.min} onChange={(e) => updateTier(idx, 'min', parseInt(e.target.value))} className="w-full p-2 bg-slate-50 rounded-lg text-[10px] font-black text-center" />
                                                                            <span className="text-slate-300">-</span>
                                                                            <input type="number" value={tier.max} onChange={(e) => updateTier(idx, 'max', parseInt(e.target.value))} className="w-full p-2 bg-slate-50 rounded-lg text-[10px] font-black text-center" />
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Price (₹)</span>
                                                                        <input type="number" value={tier.price} onChange={(e) => updateTier(idx, 'price', parseInt(e.target.value))} className="w-full p-2 bg-purple-50 text-purple-600 rounded-lg text-xs font-black text-center border border-purple-100" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-10 pt-6 border-t border-slate-50 bg-white flex items-center gap-6">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-10 py-5 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-100 transition-all">Cancel Project</button>
                                <button type="submit" className="flex-1 py-5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-blue-600 transition-all shadow-2xl shadow-slate-900/10">Initialize Deployment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Promote Modal */}
            <PromoteModal
                isOpen={!!promoteTurf}
                onClose={() => setPromoteTurf(null)}
                title={promoteTurf?.name || ""}
                imageUrl={promoteTurf?.images?.[0] || ""}
                type="Turf Facility"
                bookingUrl={typeof window !== "undefined" && promoteTurf ? `${window.location.origin}/turfs/${promoteTurf._id}` : ""}
            />
        </div>
    );
}
function ArtistServiceManagement({ user, vendorId, profile }) {
    const updateProfile = useMutation(api.vendors.updateProfile);

    const [pricing, setPricing] = useState([]);
    const [advancedSettings, setAdvancedSettings] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [promoteProfileModal, setPromoteProfileModal] = useState(false);

    useEffect(() => {
        if (profile?.pricing) setPricing(profile.pricing);
        if (profile?.advancedSettings) setAdvancedSettings(profile.advancedSettings);
    }, [profile]);

    const handleAddPackage = () => {
        setPricing([...pricing, { 
            name: "", 
            price: 0, 
            description: "", 
            features: [""],
            type: "Bridal Package", 
            duration: "",
            allowBulkBooking: false
        }]);
    };

    const handleAddStandardTiers = () => {
        const standardTiers = [
            { name: "Basic", price: 1999, description: "Essential services for a simple look.", features: ["Single Hand", "Standard Henna", "2 Hours Service"], type: "Standard Package", duration: "2 hrs", allowBulkBooking: false },
            { name: "Silver", price: 3999, description: "Enhanced services with more details.", features: ["Both Hands (Front)", "Detailed Arabic Designs", "3 Hours Service"], type: "Premium Package", duration: "3 hrs", allowBulkBooking: false },
            { name: "Gold", price: 7999, description: "Professional-grade bridal services.", features: ["Full Hands (Front & Back)", "Rajasthani Traditional", "5 Hours Service", "Stones/Glitter Add-on"], type: "Bridal Package", duration: "5 hrs", allowBulkBooking: false },
            { name: "Platinum", price: 14999, description: "The ultimate luxury experience.", features: ["Full Hands & Feet", "Portrait Work", "Premium Organic Henna", "Full Day Coverage", "Express Drying"], type: "Bridal Package", duration: "Full Day", allowBulkBooking: false }
        ];
        setPricing([...pricing, ...standardTiers]);
    };

    const handleRemovePackage = (index) => {
        setPricing(pricing.filter((_, i) => i !== index));
    };

    const handleUpdatePackage = (index, field, value) => {
        const newPricing = [...pricing];
        newPricing[index] = { ...newPricing[index], [field]: value };
        setPricing(newPricing);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateProfile({
                organiserId: vendorId,
                category: profile?.category || "Mehendi Artist",
                pricing,
                advancedSettings
            });
        } catch (error) {
            console.error("Failed to save services:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const renderServiceSpecificFields = () => {
        const category = profile?.category || "";

        if (category.includes("Mehendi")) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center space-x-2 ml-1">
                            <Hand size={14} className="text-pink-500" />
                            <span>Style Tags</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {["Arabic", "Rajasthani", "Bridal", "Minimalist", "Portrait"].map(tag => (
                                <button 
                                    key={tag}
                                    onClick={() => {
                                        const currentTags = advancedSettings.styles || [];
                                        const newTags = currentTags.includes(tag) 
                                            ? currentTags.filter(t => t !== tag)
                                            : [...currentTags, tag];
                                        setAdvancedSettings({ ...advancedSettings, styles: newTags });
                                    }}
                                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                        (advancedSettings.styles || []).includes(tag)
                                            ? 'bg-pink-500 text-white border-pink-500 shadow-lg shadow-pink-500/20'
                                            : 'bg-white text-slate-500 border-slate-200 hover:border-pink-300 hover:text-pink-500'
                                    }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center space-x-2 ml-1">
                            <Sparkles size={14} className="text-pink-500" />
                            <span>Available Add-ons</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                { id: 'glitter', label: 'Glitter Mehendi', icon: Sparkles },
                                { id: 'colored', label: 'Colored Mehendi', icon: Sparkles },
                                { id: 'express', label: 'Express Service', icon: Clock },
                                { id: 'stones', label: 'Stone Work', icon: Sparkles }
                            ].map(addon => (
                                <button 
                                    key={addon.id}
                                    onClick={() => {
                                        const currentAddons = advancedSettings.addons || [];
                                        const newAddons = currentAddons.includes(addon.id) 
                                            ? currentAddons.filter(id => id !== addon.id)
                                            : [...currentAddons, addon.id];
                                        setAdvancedSettings({ ...advancedSettings, addons: newAddons });
                                    }}
                                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                                        (advancedSettings.addons || []).includes(addon.id)
                                            ? 'bg-pink-50/50 border-pink-500 text-pink-500'
                                            : 'bg-white border-slate-200 text-slate-500 hover:border-pink-300'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <addon.icon size={14} className={ (advancedSettings.addons || []).includes(addon.id) ? 'text-pink-500' : 'text-slate-400'} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{addon.label}</span>
                                    </div>
                                    {(advancedSettings.addons || []).includes(addon.id) ? <CheckCircle2 size={14} /> : <Plus size={14} className="opacity-0 group-hover:opacity-100" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200">
                <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white p-3 shadow-2xl shadow-pink-500/30">
                            <Settings2 size={28} />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-pink-500">{profile?.category || "Business Profile"}</span>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">Package Builder</h2>
                        </div>
                    </div>
                    <p className="text-slate-500 text-sm max-w-xl font-medium">Define your service tiers and pricing. High clarity packages lead to 2x more conversions.</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setPromoteProfileModal(true)}
                        className="flex items-center space-x-3 border border-pink-200 text-pink-500 bg-pink-50 px-8 py-4 rounded-2xl font-black text-sm hover:bg-pink-100 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest"
                    >
                        <Share size={18} />
                        <span>Promote</span>
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center space-x-3 bg-gradient-to-r from-pink-500 to-purple-600 px-10 py-4 rounded-2xl text-white font-black text-sm shadow-2xl shadow-pink-500/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest"
                    >
                        {isSaving ? <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Save size={18} />}
                        <span>Save</span>
                    </button>
                </div>
            </div>

            {/* Promote Modal */}
            <PromoteModal
                isOpen={promoteProfileModal}
                onClose={() => setPromoteProfileModal(false)}
                title={profile?.name || "Professional Services"}
                imageUrl={profile?.portfolio?.[0]?.url || ""}
                type="Service"
                bookingUrl={typeof window !== "undefined" && vendorId ? `${window.location.origin}/services/${vendorId}` : ""}
            />

            {/* General Preferences Section */}
            <div className="space-y-8 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
                <div className="flex items-center space-x-3">
                    <div className="w-1.5 h-6 bg-pink-500 rounded-full"></div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">General Preferences</h3>
                </div>
                {renderServiceSpecificFields()}
            </div>

            {/* Packages Grid Section */}
            <div className="space-y-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-1.5 h-6 bg-purple-600 rounded-full"></div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">Service Tiers</h3>
                    </div>
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={handleAddStandardTiers}
                            className="flex items-center space-x-3 text-purple-600 hover:text-purple-700 transition-all group"
                        >
                            <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm">
                                <Sparkles size={18} />
                            </div>
                            <span className="text-xs font-black uppercase tracking-[0.2em]">Add Standard Tiers</span>
                        </button>
                        <button 
                            onClick={handleAddPackage}
                            className="flex items-center space-x-3 text-pink-500 hover:text-pink-600 transition-all group"
                        >
                            <div className="w-10 h-10 rounded-2xl bg-pink-50 flex items-center justify-center group-hover:bg-pink-500 group-hover:text-white transition-all shadow-sm">
                                <Plus size={18} />
                            </div>
                            <span className="text-xs font-black uppercase tracking-[0.2em]">Add Custom Tier</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {pricing.map((pkg, i) => (
                        <div 
                            key={i}
                            className="bg-white rounded-[2.5rem] border border-slate-100 p-8 space-y-8 hover:border-pink-300 transition-all group shadow-xl shadow-slate-200/40 relative overflow-hidden animate-in zoom-in-95 duration-500"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[4rem] -z-0 opacity-50 group-hover:bg-pink-50 transition-colors"></div>
                            
                            <div className="flex items-start justify-between relative z-10">
                                <div className="space-y-4 flex-1">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-pink-500 shadow-inner group-hover:bg-white transition-colors">
                                            <Sparkles size={20} />
                                        </div>
                                        <select 
                                            value={pkg.type || "Bridal Package"}
                                            onChange={(e) => handleUpdatePackage(i, 'type', e.target.value)}
                                            className="bg-transparent text-slate-900 border-none outline-none text-[10px] font-black uppercase tracking-widest cursor-pointer focus:ring-0"
                                        >
                                            <option value="Bridal Package">Bridal Package</option>
                                            <option value="Per Hand Pricing">Per Hand Pricing</option>
                                            <option value="Add-on Service">Add-on Service</option>
                                            <option value="Premium Package">Premium Package</option>
                                            <option value="Custom">Custom Service</option>
                                        </select>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleRemovePackage(i)}
                                    className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="space-y-6 relative z-10">
                                <div className="space-y-1">
                                    <input 
                                        type="text" 
                                        placeholder="Package Name"
                                        value={pkg.name}
                                        onChange={(e) => handleUpdatePackage(i, 'name', e.target.value)}
                                        className="w-full bg-transparent text-2xl font-black text-slate-900 border-none outline-none placeholder:text-slate-200 tracking-tighter" 
                                    />
                                    <div className="h-0.5 w-12 bg-pink-500 rounded-full group-hover:w-full transition-all duration-700"></div>
                                </div>

                                <div className="relative group/price">
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 font-black text-2xl text-slate-300 group-focus-within/price:text-pink-500 transition-colors">₹</span>
                                    <input 
                                        type="number" 
                                        placeholder="0"
                                        value={pkg.price}
                                        onChange={(e) => handleUpdatePackage(i, 'price', parseInt(e.target.value))}
                                        className="w-full bg-transparent text-4xl font-black text-pink-500 border-none outline-none pl-6 placeholder:text-slate-100"
                                    />
                                </div>

                                <textarea 
                                    placeholder="Describe what's included..."
                                    value={pkg.description}
                                    onChange={(e) => handleUpdatePackage(i, 'description', e.target.value)}
                                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl p-5 text-xs text-slate-600 font-medium focus:bg-white focus:border-pink-200 outline-none placeholder:text-slate-300 h-24 resize-none transition-all"
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative group/duration">
                                        <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/duration:text-pink-500 transition-colors" />
                                        <input 
                                            type="text" 
                                            placeholder="2 hrs"
                                            value={pkg.duration || ""}
                                            onChange={(e) => handleUpdatePackage(i, 'duration', e.target.value)}
                                            className="w-full bg-slate-50/50 text-[10px] font-black text-slate-900 uppercase tracking-widest border border-slate-100 rounded-xl outline-none pl-10 pr-3 py-3 focus:bg-white focus:border-pink-200 transition-all placeholder:text-slate-300"
                                        />
                                    </div>
                                    <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100 cursor-pointer hover:bg-white hover:border-pink-200 transition-all group/bulk">
                                        <input 
                                            type="checkbox" 
                                            checked={pkg.allowBulkBooking || false}
                                            onChange={(e) => handleUpdatePackage(i, 'allowBulkBooking', e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-200 text-pink-500 focus:ring-pink-500/20"
                                        />
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover/bulk:text-pink-500 transition-colors">Bulk Job</span>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-50 relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Included Features</p>
                                <div className="space-y-3">
                                    {(pkg.features || []).map((feature, fi) => (
                                        <div key={fi} className="flex items-center space-x-3 group/feat">
                                            <div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div>
                                            <input 
                                                type="text" 
                                                value={feature}
                                                onChange={(e) => {
                                                    const newFeatures = [...pkg.features];
                                                    newFeatures[fi] = e.target.value;
                                                    handleUpdatePackage(i, 'features', newFeatures);
                                                }}
                                                className="bg-transparent text-xs font-bold text-slate-600 border-none outline-none flex-1 placeholder:text-slate-200"
                                            />
                                            <button 
                                                onClick={() => {
                                                    const newFeatures = pkg.features.filter((_, f) => f !== fi);
                                                    handleUpdatePackage(i, 'features', newFeatures);
                                                }}
                                                className="opacity-0 group-hover/feat:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    <button 
                                        onClick={() => {
                                            const newFeatures = [...(pkg.features || []), "New feature"];
                                            handleUpdatePackage(i, 'features', newFeatures);
                                        }}
                                        className="text-[10px] font-bold text-pink-500 hover:text-pink-600 transition-all flex items-center space-x-2 bg-pink-50/50 px-3 py-1.5 rounded-lg w-fit"
                                    >
                                        <Plus size={12} />
                                        <span className="uppercase tracking-widest">Add Feature</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Help Card */}
            <div className="bg-white rounded-[3rem] border border-slate-100 p-10 flex items-center space-x-8 shadow-xl shadow-slate-200/40">
                <div className="w-20 h-20 rounded-[2rem] bg-pink-50 flex items-center justify-center text-pink-500 flex-shrink-0 border border-pink-100 shadow-inner">
                    <Info size={36} />
                </div>
                <div className="space-y-2">
                    <h5 className="font-black text-slate-900 text-lg uppercase tracking-tight">Pricing Strategy & Visibility</h5>
                    <p className="text-sm text-slate-500 max-w-2xl font-medium leading-relaxed">
                        Your pricing is public. We recommend including all taxes and standard travel fees within the package cost. Transparent pricing builds client trust and leads to faster booking confirmations.
                    </p>
                </div>
            </div>
        </div>
    );
}
