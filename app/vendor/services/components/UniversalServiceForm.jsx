"use client";
import React, { useState, useEffect } from "react";
import { 
    Plus, Trash2, Save, Info, Camera, Sparkles, 
    DollarSign, Clock, CheckCircle2, Settings2, 
    X, Share2, MapPin, ArrowLeft, ArrowRight, 
    Globe, ShieldCheck, ListTodo, Package,
    Zap, TrendingUp
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthContext";
import { useToast } from "@/context/ToastContext";

const renderInput = (label, value, onChange, type = "text", placeholder = "") => (
    <div className="space-y-2">
        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest pl-1">{label}</label>
        <input 
            type={type}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-inner transition-all placeholder:text-slate-400"
            placeholder={placeholder}
        />
    </div>
);

const PackageCard = ({ pkg, index, updatePackage, removePackage }) => (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative group hover:border-blue-200 transition-all">
        <button 
            onClick={() => removePackage(index)}
            className="absolute -top-2 -right-2 w-8 h-8 bg-red-50 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-red-100"
        >
            <Trash2 size={14} />
        </button>
        
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Package Title</label>
                    <input 
                        className="w-full bg-slate-50 border border-slate-100 text-sm font-black p-3 rounded-xl text-slate-900"
                        placeholder="e.g. Bridal Mehendi"
                        value={pkg.title}
                        onChange={e => updatePackage(index, 'title', e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Price (₹)</label>
                    <input 
                        type="number"
                        className="w-full bg-blue-50 border border-blue-100 text-sm font-black p-3 rounded-xl text-blue-600"
                        value={pkg.price}
                        onChange={e => updatePackage(index, 'price', parseFloat(e.target.value) || 0)}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Description</label>
                <textarea 
                    className="w-full bg-slate-50 border border-slate-100 text-xs font-medium p-3 rounded-xl text-slate-900 h-20 resize-none"
                    placeholder="Describe what's included..."
                    value={pkg.description}
                    onChange={e => updatePackage(index, 'description', e.target.value)}
                />
            </div>

            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Features</label>
                    <button 
                        onClick={() => {
                            const newFeatures = [...(pkg.features || []), ""];
                            updatePackage(index, 'features', newFeatures);
                        }}
                        className="text-[9px] font-black text-blue-500 uppercase tracking-widest"
                    >
                        + Add Feature
                    </button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                    {(pkg.features || []).map((feat, fIdx) => (
                        <div key={fIdx} className="flex gap-2 items-center">
                            <input 
                                className="flex-1 bg-white border border-slate-200 text-xs font-bold p-2.5 rounded-xl text-slate-900"
                                value={feat}
                                onChange={e => {
                                    const newFeatures = [...pkg.features];
                                    newFeatures[fIdx] = e.target.value;
                                    updatePackage(index, 'features', newFeatures);
                                }}
                            />
                            <button 
                                onClick={() => {
                                    const newFeatures = pkg.features.filter((_, i) => i !== fIdx);
                                    updatePackage(index, 'features', newFeatures);
                                }}
                                className="p-2 text-slate-400 hover:text-red-500"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

export default function UniversalServiceForm({ initialData = {}, onCancel, onSave }) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        service_name: initialData.service_name || "",
        category: initialData.category || user?.category || "",
        description: initialData.description || "",
        price: initialData.price || 0,
        city: initialData.city || "",
        state: initialData.state || "",
        country: initialData.country || "India",
        images: initialData.images || [],
        status: initialData.status || "Draft",
        packages: initialData.packages || [
            { title: "Standard Package", price: 0, description: "", features: ["Expert Service", "Premium Quality"], duration: "2 hrs" }
        ],
        seo: initialData.seo || { title: "", description: "", keywords: "", slug: "" },
        metadata: initialData.metadata || {}
    });

    const updateFormData = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                provider_id: user?.id,
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('services')
                .upsert(payload)
                .select();

            if (error) throw error;
            
            showToast("Service published successfully!", "success");
            if (onSave) onSave(data[0]);
        } catch (error) {
            console.error("Save error:", error);
            showToast(error.message, "error");
        } finally {
            setIsSaving(false);
        }
    };

    const steps = [
        { id: 1, title: "Identity", icon: Info },
        { id: 2, title: "Location", icon: MapPin },
        { id: 3, title: "Packages", icon: Package },
        { id: 4, title: "Media", icon: Camera },
        { id: 5, title: "SEO", icon: Globe },
        { id: 6, title: "Launch", icon: ShieldCheck }
    ];

    return (
        <div className="max-w-5xl mx-auto py-8">
            {/* Steps Indicator */}
            <div className="flex items-center justify-between mb-12 px-6 overflow-x-auto pb-4 scrollbar-hide">
                {steps.map((s, idx) => (
                    <React.Fragment key={s.id}>
                        <div className="flex flex-col items-center gap-3 shrink-0">
                            <div className={`w-14 h-14 rounded-[2rem] flex items-center justify-center transition-all border-2 ${
                                currentStep >= s.id 
                                ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-200' 
                                : 'bg-white border-slate-100 text-slate-800'
                            }`}>
                                <s.icon size={22} />
                            </div>
                            <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${currentStep >= s.id ? 'text-blue-600' : 'text-slate-800'}`}>
                                {s.title}
                            </span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={`w-12 h-0.5 mx-2 transition-colors ${currentStep > s.id ? 'bg-blue-600' : 'bg-slate-100'}`} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Step 1: Identity */}
            {currentStep === 1 && (
                <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] border border-slate-100 shadow-2xl p-5 md:p-14 space-y-8 md:space-y-10   ">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <ListTodo size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Service Identity</h2>
                            <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Define your professional offering</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2">
                            {renderInput("Service Name", formData.service_name, (v) => updateFormData('service_name', v), "text", "e.g. Premium Bridal Mehendi")}
                        </div>
                        {renderInput("Category", formData.category, (v) => updateFormData('category', v), "text", "e.g. Artist, Photographer")}
                        {renderInput("Base Price (₹)", formData.price, (v) => updateFormData('price', parseFloat(v) || 0), "number")}
                        
                        <div className="md:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-3 pl-1">Description</label>
                            <textarea 
                                value={formData.description}
                                onChange={(e) => updateFormData('description', e.target.value)}
                                rows={6}
                                className="w-full bg-slate-50 border border-slate-100 text-slate-900 text-sm font-semibold px-6 py-4 rounded-[2rem] focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-inner"
                                placeholder="Describe your expertise, experience, and what makes you unique..."
                            />
                        </div>
                    </div>

                    <div className="pt-10 flex justify-end">
                        <button 
                            onClick={() => setCurrentStep(2)}
                            className="px-12 py-4 bg-slate-900 text-white rounded-[2rem] text-xs font-bold uppercase tracking-widest flex items-center gap-3 hover:bg-black shadow-xl shadow-slate-200 transition-all"
                        >
                            Next: Location <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Location */}
            {currentStep === 2 && (
                <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] border border-slate-100 shadow-2xl p-5 md:p-14 space-y-8 md:space-y-10   ">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <MapPin size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Service Area</h2>
                            <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Where do you provide your services?</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {renderInput("Country", formData.country, (v) => updateFormData('country', v))}
                        {renderInput("State", formData.state, (v) => updateFormData('state', v))}
                        {renderInput("City / District", formData.city, (v) => updateFormData('city', v))}
                        <div className="hidden md:block" />
                    </div>

                    <div className="pt-10 flex justify-between">
                        <button onClick={() => setCurrentStep(1)} className="px-10 py-4 text-slate-800 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2"><ArrowLeft size={16} /> Back</button>
                        <button onClick={() => setCurrentStep(3)} className="px-12 py-4 bg-slate-900 text-white rounded-[2rem] text-xs font-bold uppercase tracking-widest flex items-center gap-3">Next: Packages <ArrowRight size={18} /></button>
                    </div>
                </div>
            )}

            {/* Step 3: Packages */}
            {currentStep === 3 && (
                <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] border border-slate-100 shadow-2xl p-5 md:p-14 space-y-8 md:space-y-10   ">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <Package size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Service Packages</h2>
                                <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Define different tiers for your clients</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => {
                                updateFormData('packages', [...formData.packages, { title: "New Package", price: 0, description: "", features: [""] }]);
                            }}
                            className="px-6 py-3 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-blue-100"
                        >
                            + Add Tier
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                        {formData.packages.map((pkg, idx) => (
                            <PackageCard 
                                key={idx}
                                pkg={pkg}
                                index={idx}
                                updatePackage={(i, field, val) => {
                                    const next = [...formData.packages];
                                    next[i][field] = val;
                                    updateFormData('packages', next);
                                }}
                                removePackage={(i) => {
                                    updateFormData('packages', formData.packages.filter((_, idx) => idx !== i));
                                }}
                            />
                        ))}
                    </div>

                    <div className="pt-10 flex justify-between">
                        <button onClick={() => setCurrentStep(2)} className="px-10 py-4 text-slate-800 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2"><ArrowLeft size={16} /> Back</button>
                        <button onClick={() => setCurrentStep(4)} className="px-12 py-4 bg-slate-900 text-white rounded-[2rem] text-xs font-bold uppercase tracking-widest flex items-center gap-3">Next: Media <ArrowRight size={18} /></button>
                    </div>
                </div>
            )}

            {/* Step 4: Media */}
            {currentStep === 4 && (
                <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] border border-slate-100 shadow-2xl p-5 md:p-14 space-y-8 md:space-y-10   ">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <Camera size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Portfolio & Images</h2>
                            <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Showcase your best work</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {formData.images.map((img, idx) => (
                            <div key={idx} className="relative aspect-square rounded-[2rem] overflow-hidden border border-slate-100 bg-slate-50 group">
                                <img src={img} className="w-full h-full object-cover" />
                                <button 
                                    onClick={() => updateFormData('images', formData.images.filter((_, i) => i !== idx))}
                                    className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur rounded-lg text-red-500 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                        {formData.images.length < 8 && (
                            <label className="aspect-square rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-300 transition-all">
                                <Plus size={24} className="text-slate-400" />
                                <span className="text-[9px] font-black uppercase text-slate-400">Add Image</span>
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    onChange={(e) => {
                                        const f = e.target.files[0];
                                        if (f) {
                                            const reader = new FileReader();
                                            reader.onload = (ev) => updateFormData('images', [...formData.images, ev.target.result]);
                                            reader.readAsDataURL(f);
                                        }
                                    }}
                                />
                            </label>
                        )}
                    </div>

                    <div className="pt-10 flex justify-between">
                        <button onClick={() => setCurrentStep(3)} className="px-10 py-4 text-slate-800 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2"><ArrowLeft size={16} /> Back</button>
                        <button onClick={() => setCurrentStep(5)} className="px-12 py-4 bg-slate-900 text-white rounded-[2rem] text-xs font-bold uppercase tracking-widest flex items-center gap-3">Next: SEO <ArrowRight size={18} /></button>
                    </div>
                </div>
            )}

            {/* Step 5: SEO */}
            {currentStep === 5 && (
                <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] border border-slate-100 shadow-2xl p-5 md:p-14 space-y-8 md:space-y-10   ">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <Globe size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">SEO Optimization</h2>
                            <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Help clients find your services on Google</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2 space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">Profile Slug</label>
                                <button 
                                    onClick={() => {
                                        const slug = (formData.service_name || "").toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                                        updateFormData('seo', { ...formData.seo, slug });
                                    }}
                                    className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                                >
                                    Auto-Generate
                                </button>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl shadow-inner">
                                <span className="text-slate-500 text-sm font-medium">bookmyticket.net/services/</span>
                                <input 
                                    value={formData.seo.slug}
                                    onChange={(e) => updateFormData('seo', { ...formData.seo, slug: e.target.value })}
                                    className="flex-1 bg-transparent border-none text-slate-900 text-sm font-bold focus:ring-0 p-0"
                                    placeholder="your-brand-name"
                                />
                            </div>
                        </div>

                        {renderInput("SEO Title", formData.seo.title, (v) => updateFormData('seo', { ...formData.seo, title: v }))}
                        <div className="md:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-3 pl-1">Meta Description</label>
                            <textarea 
                                value={formData.seo.description}
                                onChange={(e) => updateFormData('seo', { ...formData.seo, description: e.target.value })}
                                rows={4}
                                className="w-full bg-slate-50 border border-slate-100 text-slate-900 text-sm font-semibold px-6 py-4 rounded-[2rem] focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-inner"
                                placeholder="Summary for Google results..."
                            />
                        </div>
                    </div>

                    <div className="pt-10 flex justify-between">
                        <button onClick={() => setCurrentStep(4)} className="px-10 py-4 text-slate-800 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2"><ArrowLeft size={16} /> Back</button>
                        <button onClick={() => setCurrentStep(6)} className="px-12 py-4 bg-slate-900 text-white rounded-[2rem] text-xs font-bold uppercase tracking-widest flex items-center gap-3">Next: Review <ArrowRight size={18} /></button>
                    </div>
                </div>
            )}

            {/* Step 6: Review & Launch */}
            {currentStep === 6 && (
                <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl p-10 md:p-14 space-y-10 text-center   ">
                    <div className="flex flex-col items-center gap-6 py-10">
                        <div className="w-24 h-24 rounded-[3rem] bg-blue-50 text-blue-500 flex items-center justify-center shadow-xl shadow-blue-100 ">
                            <ShieldCheck size={48} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Ready to Deploy!</h2>
                            <p className="text-[11px] font-bold text-slate-800 uppercase tracking-[0.2em] mt-2">Your professional service is configured</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                        <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 text-left space-y-4">
                            <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest italic">Summary</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold text-slate-700"><span>Service</span> <span className="text-slate-900">{formData.service_name || "Untitled"}</span></div>
                                <div className="flex justify-between text-xs font-bold text-slate-700"><span>Category</span> <span className="text-slate-900">{formData.category}</span></div>
                                <div className="flex justify-between text-xs font-bold text-slate-700"><span>Packages</span> <span className="text-slate-900">{formData.packages.length} Tiers</span></div>
                                <div className="flex justify-between text-xs font-bold text-slate-700"><span>Location</span> <span className="text-slate-900">{formData.city || "All India"}</span></div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 justify-center">
                            <button 
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full py-6 bg-blue-600 text-white rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isSaving ? "Publishing..." : "Launch Service"}
                            </button>
                        </div>
                    </div>

                    <div className="pt-10">
                        <button onClick={() => setCurrentStep(5)} className="px-10 py-4 text-slate-600 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 mx-auto"><ArrowLeft size={16} /> Back to SEO</button>
                    </div>
                </div>
            )}
        </div>
    );
}
