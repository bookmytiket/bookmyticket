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
    X
} from "lucide-react";

export default function ServicesPage() {
    const { user } = useAuth();
    const vendorId = getVendorAccountKey(user);
    
    // Get full profile to know category
    const profile = useQuery(
        api.vendors.getByOrganiserId,
        vendorId ? { organiserId: vendorId } : "skip"
    );
    const updateProfile = useMutation(api.vendors.updateProfile);

    const [pricing, setPricing] = useState([]);
    const [advancedSettings, setAdvancedSettings] = useState({});
    const [isSaving, setIsSaving] = useState(false);

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
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center space-x-3 bg-gradient-to-r from-pink-500 to-purple-600 px-10 py-4 rounded-2xl text-white font-black text-sm shadow-2xl shadow-pink-500/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest"
                >
                    {isSaving ? <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Save size={18} />}
                    <span>Save Packages</span>
                </button>
            </div>

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
