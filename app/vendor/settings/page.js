"use client";
import { useState, useEffect } from "react";
import { useSupabaseQuery, useSupabaseMutation } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthContext";
import { getVendorAccountKey } from "@/lib/vendorAccount";
import { 
    User, 
    Mail, 
    Phone, 
    Globe, 
    Instagram, 
    Twitter, 
    Facebook, 
    Shield, 
    Bell, 
    Lock, 
    Save,
    Camera,
    MapPin,
    Briefcase,
    Info,
    CheckCircle,
    ChevronRight,
    Sparkles,
    Settings
} from "lucide-react";

export default function SettingsPage() {
    const { user } = useAuth();
    const vendorId = getVendorAccountKey(user);
    
    const { data: profileArr = [], mutate: refreshProfile } = useSupabaseQuery('service_providers', (q) => 
        q.eq('organiser_id', vendorId).single()
    , [vendorId]);
    const profile = profileArr && !Array.isArray(profileArr) ? profileArr : null;

    const [updateProfile] = useSupabaseMutation('service_providers', 'update', (q, p) => q.eq('organiser_id', vendorId));

    const [formData, setFormData] = useState({
        name: "",
        bio: "",
        category: "",
        profileImage: "",
        website: "",
        instagram: "",
        facebook: "",
        phone: "",
        address: "",
        experience: "",
        serviceLocations: "",
        contactVisible: true
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (profile) {
            const adv = profile.advanced_settings || {};
            setFormData({
                name: profile.name || user?.name || "",
                bio: profile.bio || "",
                category: profile.category || "",
                profileImage: profile.image_url || adv.profileImage || "",
                website: adv.website || "",
                instagram: adv.instagram || "",
                facebook: adv.facebook || "",
                phone: adv.phone || "",
                address: adv.address || "",
                experience: adv.experience || "",
                serviceLocations: adv.serviceLocations || "",
                contactVisible: adv.contactVisible ?? true
            });
        }
    }, [profile, user]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${vendorId}/${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('vendor-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('vendor-assets')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, profileImage: publicUrl }));
            
            // Auto update image_url in DB
            await updateProfile({ image_url: publicUrl });
            refreshProfile();
        } catch (error) {
            console.error("Failed to upload image:", error);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateProfile({
                bio: formData.bio,
                name: formData.name,
                advanced_settings: {
                    ...(profile?.advanced_settings || {}),
                    profileImage: formData.profileImage,
                    website: formData.website,
                    instagram: formData.instagram,
                    facebook: formData.facebook,
                    phone: formData.phone,
                    address: formData.address,
                    experience: formData.experience,
                    serviceLocations: formData.serviceLocations,
                    contactVisible: formData.contactVisible
                }
            });
            refreshProfile();
        } catch (error) {
            console.error("Failed to save settings:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-slate-200">
                <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 rounded-3xl bg-slate-900 flex items-center justify-center text-white p-3 shadow-2xl">
                            <Settings size={28} />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Governance</span>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Business Identity</h2>
                        </div>
                    </div>
                    <p className="text-slate-500 text-sm max-w-xl font-medium leading-relaxed">Configure your public-facing operational profile. Clarity and accuracy drive client trust.</p>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center space-x-3 bg-gradient-to-r from-pink-500 to-purple-600 px-10 py-4.5 rounded-[2rem] text-white font-black text-xs shadow-3xl shadow-pink-500/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 uppercase tracking-[0.3em] italic"
                >
                    {isSaving ? <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Save size={18} />}
                    <span>Save Protocol</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Profile Photo Sidebar */}
                <div className="space-y-10">
                    <div className="flex flex-col items-center space-y-6">
                        <div className="relative group cursor-pointer" onClick={() => document.getElementById('profileImageUpload').click()}>
                            <div className="absolute inset-0 bg-pink-500 rounded-[3.5rem] blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity duration-700"></div>
                            <div className="relative w-56 h-56 rounded-[3.5rem] bg-white border-4 border-slate-50 p-1.5 transition-all duration-700 overflow-hidden shadow-2xl shadow-slate-200/50 group-hover:border-pink-500/50 group-hover:scale-[1.02]">
                                <div className="w-full h-full rounded-[2.8rem] bg-slate-50 flex items-center justify-center text-slate-200 relative group overflow-hidden shadow-inner">
                                    {formData.profileImage ? (
                                        <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <User size={80} strokeWidth={1} className="group-hover:scale-110 transition-transform duration-700" />
                                    )}
                                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center space-y-3 backdrop-blur-sm">
                                        <Camera size={36} className="text-white translate-y-6 group-hover:translate-y-0 transition-transform duration-500" />
                                        <span className="text-[10px] text-white font-black uppercase tracking-widest translate-y-6 group-hover:translate-y-0 transition-transform duration-500">Update Avatar</span>
                                    </div>
                                </div>
                            </div>
                            <input id="profileImageUpload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </div>
                        <div className="text-center space-y-1">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tighter italic uppercase">{user?.name}</h3>
                            <p className="text-pink-500 text-[10px] font-black uppercase tracking-[0.4em] italic">{profile?.category}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 space-y-6 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Shield size={100} />
                            </div>
                            <div className="flex items-center justify-between relative z-10">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reality Status</span>
                                {(formData.bio?.length > 10 && formData.experience && formData.serviceLocations) ? (
                                    <span className="px-5 py-1.5 bg-green-50 text-green-600 border border-green-100 rounded-xl text-[10px] font-black uppercase tracking-widest italic shadow-sm shadow-green-500/10">Synchronized</span>
                                ) : (
                                    <span className="px-5 py-1.5 bg-amber-50 text-amber-500 border border-amber-100 rounded-xl text-[10px] font-black uppercase tracking-widest italic shadow-sm shadow-amber-500/10">Draft Only</span>
                                )}
                            </div>
                            <div className="flex items-center justify-between relative z-10 pt-4 border-t border-slate-50">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Term</span>
                                <span className="text-xs text-slate-900 font-black italic uppercase italic tracking-tight">Active Tier</span>
                            </div>
                        </div>
                        <div className="p-8 rounded-[2.5rem] border-2 border-dashed border-slate-100 flex items-center space-x-5 group cursor-pointer hover:border-pink-500/30 transition-all hover:bg-white shadow-inner">
                             <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-pink-500 transition-colors border border-slate-50">
                                <Shield size={24} />
                             </div>
                             <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-slate-900 uppercase italic tracking-tight">Vault Security</p>
                                <p className="text-[10px] text-slate-400 font-bold truncate tracking-widest">Protocol Guard Active</p>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Main Settings Form */}
                <div className="lg:col-span-2 space-y-12">
                    {/* Basic Info */}
                    <section className="space-y-8">
                        <div className="flex items-center space-x-4">
                            <div className="w-1.5 h-6 bg-pink-500 rounded-full shadow-sm shadow-pink-500/50"></div>
                            <h3 className="text-xl font-black text-slate-900 italic tracking-tighter uppercase">Public Domain Info</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-1">Artist Reflection (Bio)</label>
                                <textarea 
                                    value={formData.bio}
                                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                                    placeholder="Communicate your essence..."
                                    className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] p-8 text-sm text-slate-900 font-bold italic focus:bg-white focus:border-pink-500/50 outline-none min-h-[220px] resize-none transition-all placeholder:text-slate-200 shadow-inner"
                                />
                                <div className="flex items-center justify-between px-2">
                                    <p className="text-[9px] text-slate-300 font-black uppercase tracking-widest italic">Character limit: 512</p>
                                    <p className="text-[9px] text-slate-300 font-black uppercase tracking-widest italic">{formData.bio?.length || 0}/512</p>
                                </div>
                            </div>
                            <div className="space-y-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-1">Temporal Mastery (Years)</label>
                                    <div className="relative group">
                                        <Briefcase size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within:text-pink-500 transition-all" />
                                        <input 
                                            type="text" 
                                            value={formData.experience}
                                            onChange={(e) => setFormData({...formData, experience: e.target.value})}
                                            placeholder="Chronicle experience..."
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4.5 pl-16 pr-8 text-xs font-black text-slate-900 transition-all outline-none focus:bg-white focus:border-pink-500/50 placeholder:text-slate-200 shadow-inner" 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-1">Geographical Domain</label>
                                    <div className="relative group">
                                        <MapPin size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within:text-pink-500 transition-all" />
                                        <input 
                                            type="text" 
                                            value={formData.serviceLocations}
                                            onChange={(e) => setFormData({...formData, serviceLocations: e.target.value})}
                                            placeholder="Define operating regions..."
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4.5 pl-16 pr-8 text-xs font-black text-slate-900 transition-all outline-none focus:bg-white focus:border-pink-500/50 placeholder:text-slate-200 shadow-inner" 
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest italic px-2">Index multiple regions with commas.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Contact Info */}
                    <section className="space-y-8">
                        <div className="flex items-center justify-between gap-8 pb-4 border-b border-slate-100">
                            <div className="flex items-center space-x-4">
                                <div className="w-1.5 h-6 bg-purple-600 rounded-full shadow-sm shadow-purple-500/50"></div>
                                <h3 className="text-xl font-black text-slate-900 italic tracking-tighter uppercase">Direct Channels</h3>
                            </div>
                            <div className="flex items-center space-x-4 bg-slate-50 p-2 rounded-2xl border border-slate-100 shadow-inner">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-3 italic">Broadcast Contact</span>
                                <button 
                                    onClick={() => setFormData({...formData, contactVisible: !formData.contactVisible})}
                                    className={`relative w-12 h-6 rounded-full transition-all duration-500 shadow-inner ${formData.contactVisible ? 'bg-pink-500' : 'bg-slate-200'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-500 shadow-md ${formData.contactVisible ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {[
                                { label: "Identification (Email)", icon: Mail, value: user?.identifier || user?.email, disabled: true },
                                { label: "Quantum Access (WhatsApp)", icon: Phone, key: "phone", placeholder: "+91 •••• •••• ••" },
                                { label: "Digital Outpost (Web)", icon: Globe, key: "website", placeholder: "https://•••" },
                                { label: "Tactical HQ (Address)", icon: MapPin, key: "address", placeholder: "Exact coordinates..." }
                            ].map((field, i) => (
                                <div key={i} className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-1">{field.label}</label>
                                    <div className="relative group">
                                        <field.icon size={18} className={`absolute left-6 top-1/2 -translate-y-1/2 ${field.disabled ? 'text-slate-100' : 'text-slate-200 group-focus-within:text-pink-500'} transition-all`} />
                                        <input 
                                            type="text" 
                                            value={field.disabled ? field.value : formData[field.key]}
                                            onChange={(e) => !field.disabled && setFormData({...formData, [field.key]: e.target.value})}
                                            disabled={field.disabled}
                                            placeholder={field.placeholder}
                                            className={`w-full bg-slate-50 border border-slate-100 rounded-2xl py-4.5 pl-16 pr-8 text-xs font-black transition-all outline-none shadow-inner ${field.disabled ? 'text-slate-200 cursor-not-allowed italic' : 'text-slate-900 focus:bg-white focus:border-pink-500/50 placeholder:text-slate-100 uppercase tracking-widest'}`} 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Meta Connections */}
                    <section className="space-y-8">
                        <div className="flex items-center space-x-4">
                            <div className="w-1.5 h-6 bg-slate-900 rounded-full"></div>
                            <h3 className="text-xl font-black text-slate-900 italic tracking-tighter uppercase">Neural Links</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {[
                                { label: "Spectrum Handle", icon: Instagram, key: "instagram", placeholder: "@username" },
                                { label: "Identity Page", icon: Facebook, key: "facebook", placeholder: "fb.com/•••" }
                            ].map((field, i) => (
                                <div key={i} className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-1">{field.label}</label>
                                    <div className="relative group">
                                        <field.icon size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within:text-pink-500 transition-all" />
                                        <input 
                                            type="text" 
                                            value={formData[field.key]}
                                            onChange={(e) => setFormData({...formData, [field.key]: e.target.value})}
                                            placeholder={field.placeholder}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4.5 pl-16 pr-8 text-xs font-black text-slate-900 transition-all outline-none focus:bg-white focus:border-pink-500/50 placeholder:text-slate-100 uppercase tracking-widest shadow-inner" 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <div className="bg-white rounded-[3rem] border border-slate-100 p-10 flex items-start space-x-8 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 text-pink-500/5 opacity-50 group-hover:scale-110 transition-transform duration-1000">
                             <Sparkles size={80} />
                        </div>
                        <div className="w-20 h-20 rounded-[2rem] bg-pink-50 flex items-center justify-center text-pink-500 flex-shrink-0 border border-pink-100 shadow-inner group-hover:bg-pink-500 group-hover:text-white transition-all duration-500">
                             <Info size={36} />
                        </div>
                        <div className="space-y-3 relative z-10">
                            <h4 className="text-slate-900 font-black text-base italic tracking-tight uppercase">High Fidelity Visibility</h4>
                            <p className="text-xs text-slate-400 leading-relaxed font-bold uppercase tracking-tighter italic">Maintaing high accuracy in your digital HQ facilitates optimal client mapping. Verified profiles index 3x higher in the discovery matrix.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
