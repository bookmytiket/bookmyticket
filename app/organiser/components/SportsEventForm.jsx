"use strict";
"use client";
import React, { useState, useEffect } from "react";
import { 
    Trophy, MapPin, Calendar, Users, DollarSign, FileText, CheckCircle2,
    ArrowRight, ArrowLeft, Plus, Trash, Image as ImageIcon, Camera, Layout
} from "lucide-react";
import CalendarPicker from "./CalendarPicker";
import TimePicker from "./TimePicker";
import CustomSelect from "./CustomSelect";
import GoogleInlineMap from "./GoogleInlineMap";
import LocationSelectionModal from "@/components/LocationSelectionModal";
import { reverseGeocode, geocode } from "@/lib/googleMaps";
import { COUNTRIES } from "@/app/data/locationData";
import { State, City } from 'country-state-city';
import { getIndianDistricts, getIndianCities } from "@/app/data/indianLocations";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/context/ToastContext";

const renderInput = (label, value, onChange, type = "text", placeholder = "", fullWidth = false) => (
    <div className={`space-y-3 ${fullWidth ? 'md:col-span-2' : ''}`}>
        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">{label}</label>
        {type === "date" ? (
            <CalendarPicker 
                value={value || ""} 
                onChange={onChange}
                placeholder={placeholder || "dd/mm/yyyy"}
            />
        ) : type === "time" ? (
            <TimePicker 
                value={value || ""} 
                onChange={onChange}
                placeholder={placeholder || "--:--"}
            />
        ) : (
            <input 
                type={type}
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-100 text-slate-900 text-sm font-bold px-6 py-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-200 transition-all placeholder:text-slate-400"
                placeholder={placeholder}
            />
        )}
    </div>
);

const SportsEventForm = ({ postEvent, setPostEvent, onCancel, onPublish, isEditing }) => {
    const { showToast } = useToast();
    const [currentStep, setCurrentStep] = useState(1);
    
    // Config State mimicking the new DB schema
    const [config, setConfig] = useState(() => {
        const base = postEvent.dynamic_config || {};
        return {
            ...base,
            sport_type: base.sport_type || "Badminton Championship",
            competition_format: base.competition_format || "Knockout",
            team_enabled: base.team_enabled ?? true,
            location: {
                venueName: "", address: "", city: "", pincode: "", coordinates: { lat: 11.0168, lng: 76.9558 },
                ...(base.location || {})
            },
            sports_categories: base.sports_categories || [
                { id: Date.now(), category_name: "U-15", min_age: 10, max_age: 15, gender: "All" },
                { id: Date.now()+1, category_name: "Open", min_age: 16, max_age: 99, gender: "All" }
            ],
            sports_match_types: base.sports_match_types || [
                { id: Date.now(), match_type: "Men Singles", entry_mode: "Individual", team_size: 1, price: 299 },
                { id: Date.now()+1, match_type: "Men Doubles", entry_mode: "Doubles", team_size: 2, price: 599 },
                { id: Date.now()+2, match_type: "Team Tournament", entry_mode: "Team", team_size: 5, price: 2499 }
            ],
            required_documents: base.required_documents || ["Aadhaar", "Age Proof"]
        };
    });

    useEffect(() => {
        setPostEvent(prev => ({ 
            ...prev, 
            dynamic_config: config,
            type: "Sports Event",
            sportName: config.sport_type,
            city: config.location?.city || prev.city,
            venue: config.location?.venueName || prev.venue,
            latitude: config.location?.coordinates?.lat || prev.latitude,
            longitude: config.location?.coordinates?.lng || prev.longitude,
        }));
    }, [config]);

    const steps = [
        { id: 1, title: "Event Info", icon: Trophy },
        { id: 2, title: "Venue", icon: MapPin },
        { id: 3, title: "Age Categories", icon: Users },
        { id: 4, title: "Match Types", icon: Layout },
        { id: 5, title: "Documents", icon: FileText },
        { id: 6, title: "Publish", icon: CheckCircle2 }
    ];

    const AVAILABLE_SPORTS = [
        "Badminton Championship", "Cricket Tournament", "Football Tournament", 
        "Swimming Competition", "Tennis Championship", "Kabaddi Tournament", 
        "Volleyball League", "Chess Tournament", "Athletics Meet", "Table Tennis Championship"
    ];

    const DOC_TYPES = ["Aadhaar", "Age Proof", "School ID", "Club ID", "Medical Fitness Certificate", "Passport Photo", "Parent Consent (minor)"];

    return (
        <div className="max-w-5xl mx-auto py-8">
            <div className="flex items-center justify-between mb-12 px-6 overflow-x-auto pb-4 scrollbar-hide">
                {steps.map((s, idx) => (
                    <React.Fragment key={s.id}>
                        <div className="flex flex-col items-center gap-3 shrink-0">
                            <div className={`w-14 h-14 rounded-[2rem] flex items-center justify-center transition-all border-2 ${
                                currentStep >= s.id ? 'bg-orange-500 border-orange-500 text-white shadow-xl shadow-orange-200' : 'bg-white border-slate-100 text-slate-800'
                            }`}>
                                <s.icon size={22} />
                            </div>
                            <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${currentStep >= s.id ? 'text-orange-500' : 'text-slate-800'}`}>
                                {s.title}
                            </span>
                        </div>
                        {idx < steps.length - 1 && <div className={`w-12 h-0.5 mx-2 ${currentStep > s.id ? 'bg-orange-500' : 'bg-slate-100'}`} />}
                    </React.Fragment>
                ))}
            </div>

            {currentStep === 1 && (
                <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] border border-slate-100 shadow-2xl p-5 md:p-14 space-y-8 md:space-y-10">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
                            <Trophy size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Sports Event Setup</h2>
                            <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Select sport and basic details</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2">
                            <CustomSelect 
                                label="Sport Type*"
                                value={config.sport_type}
                                options={AVAILABLE_SPORTS}
                                onChange={(v) => setConfig({ ...config, sport_type: v })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            {renderInput("Event Title*", postEvent.title, (v) => setPostEvent(p => ({ ...p, title: v })), "text", "e.g. Tamil Nadu State Badminton Championship")}
                        </div>
                        <div className="md:col-span-2 space-y-4">
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest pl-1">Event Banner</label>
                            <div className="relative group h-40 rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden hover:border-orange-300 transition-all flex items-center justify-center">
                                {postEvent.image_url ? (
                                    <>
                                        <img src={postEvent.image_url} className="absolute inset-0 w-full h-full object-cover" />
                                        <button onClick={() => setPostEvent(p => ({ ...p, image_url: "" }))} className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-xl text-red-500 shadow-lg"><Trash size={16} /></button>
                                    </>
                                ) : (
                                    <label className="cursor-pointer flex flex-col items-center gap-2">
                                        <Camera size={24} className="text-slate-800" />
                                        <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Upload Banner</span>
                                        <input type="file" className="hidden" onChange={(e) => {
                                            const f = e.target.files[0];
                                            if(f) {
                                                const reader = new FileReader();
                                                reader.onload = (ev) => setPostEvent(p => ({ ...p, image_url: ev.target.result }));
                                                reader.readAsDataURL(f);
                                            }
                                        }} />
                                    </label>
                                )}
                            </div>
                        </div>
                        {renderInput("Event Start Date*", postEvent.startDate, (v) => setPostEvent(p => ({ ...p, startDate: v })), "date")}
                        {renderInput("Registration Closes*", postEvent.endDate, (v) => setPostEvent(p => ({ ...p, endDate: v })), "date")}
                        
                        {renderInput("Organised By (Name)", postEvent.organiser_name, (v) => setPostEvent(p => ({ ...p, organiser_name: v })), "text", "e.g. Partner Name", true)}
                    </div>

                    <div className="pt-10 flex justify-end">
                        <button onClick={() => setCurrentStep(2)} className="px-12 py-4 bg-slate-900 text-white rounded-[2rem] text-xs font-bold uppercase tracking-widest flex items-center gap-3">Next: Venue <ArrowRight size={18} /></button>
                    </div>
                </div>
            )}

            {currentStep === 2 && (
                <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] border border-slate-100 shadow-2xl p-5 md:p-14 space-y-8 md:space-y-10">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
                            <MapPin size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Venue Details</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {renderInput("Venue Name*", config.location.venueName, (v) => setConfig({ ...config, location: { ...config.location, venueName: v } }), "text", "e.g. Indoor Sports Arena, Chennai", true)}
                        {renderInput("City*", config.location.city, (v) => setConfig({ ...config, location: { ...config.location, city: v } }), "text", "e.g. Chennai")}
                        {renderInput("Reporting Time*", postEvent.startTime, (v) => setPostEvent(p => ({ ...p, startTime: v })), "time")}
                    </div>

                    <div className="pt-10 flex justify-between">
                        <button onClick={() => setCurrentStep(1)} className="px-10 py-4 text-slate-800 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2"><ArrowLeft size={16} /> Back</button>
                        <button onClick={() => setCurrentStep(3)} className="px-12 py-4 bg-slate-900 text-white rounded-[2rem] text-xs font-bold uppercase tracking-widest flex items-center gap-3">Next: Categories <ArrowRight size={18} /></button>
                    </div>
                </div>
            )}

            {currentStep === 3 && (
                <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] border border-slate-100 shadow-2xl p-5 md:p-14 space-y-8">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
                            <Users size={24} />
                        </div>
                        <div className="flex-1 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Age Categories</h2>
                                <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Define age limits (e.g. U-15, Senior)</p>
                            </div>
                            <button 
                                onClick={() => {
                                    setConfig({ ...config, sports_categories: [...config.sports_categories, { id: Date.now(), category_name: "New Category", min_age: 0, max_age: 99, gender: "All" }] });
                                }}
                                className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {config.sports_categories.map((cat, idx) => (
                            <div key={cat.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-center group relative">
                                <button 
                                    onClick={() => {
                                        const nc = [...config.sports_categories]; nc.splice(idx, 1); setConfig({ ...config, sports_categories: nc });
                                    }}
                                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-50 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-red-100"
                                >
                                    <Trash size={14} />
                                </button>
                                <div className="md:col-span-4">
                                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Category Name</label>
                                    <input className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold" value={cat.category_name} onChange={e => { const nc = [...config.sports_categories]; nc[idx].category_name = e.target.value; setConfig({ ...config, sports_categories: nc }); }} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Min Age</label>
                                    <input type="number" className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold" value={cat.min_age} onChange={e => { const nc = [...config.sports_categories]; nc[idx].min_age = parseInt(e.target.value)||0; setConfig({ ...config, sports_categories: nc }); }} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Max Age</label>
                                    <input type="number" className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold" value={cat.max_age} onChange={e => { const nc = [...config.sports_categories]; nc[idx].max_age = parseInt(e.target.value)||0; setConfig({ ...config, sports_categories: nc }); }} />
                                </div>
                                <div className="md:col-span-4">
                                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Gender Restriction</label>
                                    <CustomSelect 
                                        value={cat.gender}
                                        options={["All", "Male", "Female"]}
                                        onChange={v => { const nc = [...config.sports_categories]; nc[idx].gender = v; setConfig({ ...config, sports_categories: nc }); }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-10 flex justify-between">
                        <button onClick={() => setCurrentStep(2)} className="px-10 py-4 text-slate-800 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2"><ArrowLeft size={16} /> Back</button>
                        <button onClick={() => setCurrentStep(4)} className="px-12 py-4 bg-slate-900 text-white rounded-[2rem] text-xs font-bold uppercase tracking-widest flex items-center gap-3">Next: Match Types <ArrowRight size={18} /></button>
                    </div>
                </div>
            )}

            {currentStep === 4 && (
                <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] border border-slate-100 shadow-2xl p-5 md:p-14 space-y-8">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
                            <Layout size={24} />
                        </div>
                        <div className="flex-1 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Match Types & Pricing</h2>
                                <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Singles, Doubles, Team pricing</p>
                            </div>
                            <button 
                                onClick={() => {
                                    setConfig({ ...config, sports_match_types: [...config.sports_match_types, { id: Date.now(), match_type: "New Match", entry_mode: "Individual", team_size: 1, price: 0 }] });
                                }}
                                className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {config.sports_match_types.map((match, idx) => (
                            <div key={match.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-center group relative">
                                <button 
                                    onClick={() => {
                                        const nm = [...config.sports_match_types]; nm.splice(idx, 1); setConfig({ ...config, sports_match_types: nm });
                                    }}
                                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-50 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-red-100"
                                >
                                    <Trash size={14} />
                                </button>
                                <div className="md:col-span-4">
                                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Match Type</label>
                                    <input className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold" value={match.match_type} placeholder="e.g. Men Singles" onChange={e => { const nm = [...config.sports_match_types]; nm[idx].match_type = e.target.value; setConfig({ ...config, sports_match_types: nm }); }} />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Entry Mode</label>
                                    <CustomSelect 
                                        value={match.entry_mode}
                                        options={["Individual", "Doubles", "Team"]}
                                        onChange={v => { 
                                            const nm = [...config.sports_match_types]; 
                                            nm[idx].entry_mode = v; 
                                            nm[idx].team_size = v === "Individual" ? 1 : v === "Doubles" ? 2 : 5;
                                            setConfig({ ...config, sports_match_types: nm }); 
                                        }}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Team Size</label>
                                    <input type="number" disabled={match.entry_mode !== "Team"} className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold disabled:bg-slate-100" value={match.team_size} onChange={e => { const nm = [...config.sports_match_types]; nm[idx].team_size = parseInt(e.target.value)||1; setConfig({ ...config, sports_match_types: nm }); }} />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="text-[10px] font-bold text-[#f97316] uppercase block mb-1">Entry Fee (₹)</label>
                                    <input type="number" className="w-full bg-orange-50 border border-orange-100 p-3 rounded-xl text-sm font-black text-[#f97316]" value={match.price} onChange={e => { const nm = [...config.sports_match_types]; nm[idx].price = parseInt(e.target.value)||0; setConfig({ ...config, sports_match_types: nm }); }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-10 flex justify-between">
                        <button onClick={() => setCurrentStep(3)} className="px-10 py-4 text-slate-800 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2"><ArrowLeft size={16} /> Back</button>
                        <button onClick={() => setCurrentStep(5)} className="px-12 py-4 bg-slate-900 text-white rounded-[2rem] text-xs font-bold uppercase tracking-widest flex items-center gap-3">Next: Documents <ArrowRight size={18} /></button>
                    </div>
                </div>
            )}

            {currentStep === 5 && (
                <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] border border-slate-100 shadow-2xl p-5 md:p-14 space-y-8">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Required Documents</h2>
                            <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Select mandatory participant uploads</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {DOC_TYPES.map(doc => {
                            const isActive = config.required_documents.includes(doc);
                            return (
                                <button 
                                    key={doc}
                                    onClick={() => {
                                        const nd = isActive ? config.required_documents.filter(d => d !== doc) : [...config.required_documents, doc];
                                        setConfig({ ...config, required_documents: nd });
                                    }}
                                    className={`p-4 rounded-[1.5rem] border flex items-center justify-center gap-3 transition-all ${
                                        isActive ? 'bg-orange-50 border-orange-500 text-orange-600 font-black' : 'bg-white border-slate-200 text-slate-500 font-bold'
                                    }`}
                                >
                                    {isActive ? <CheckCircle2 size={16} /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200" />}
                                    <span className="text-[10px] uppercase">{doc}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="pt-10 flex justify-between">
                        <button onClick={() => setCurrentStep(4)} className="px-10 py-4 text-slate-800 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2"><ArrowLeft size={16} /> Back</button>
                        <button onClick={() => setCurrentStep(6)} className="px-12 py-4 bg-slate-900 text-white rounded-[2rem] text-xs font-bold uppercase tracking-widest flex items-center gap-3">Review & Publish <ArrowRight size={18} /></button>
                    </div>
                </div>
            )}

            {currentStep === 6 && (
                <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] border border-slate-100 shadow-2xl p-5 md:p-14 space-y-8">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Ready to Publish</h2>
                            <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Review your Sports Event Configuration</p>
                        </div>
                    </div>

                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
                        <div>
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">{postEvent.title || "Untitled Event"}</h3>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">{config.sport_type} • {config.location.city || "No Venue"}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-200">
                            <div>
                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Age Categories</h4>
                                <div className="flex flex-wrap gap-2">
                                    {config.sports_categories.map(c => (
                                        <span key={c.id} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-bold text-slate-700">{c.category_name}</span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Match Types</h4>
                                <div className="flex flex-wrap gap-2">
                                    {config.sports_match_types.map(m => (
                                        <span key={m.id} className="px-3 py-1 bg-orange-50 border border-orange-100 rounded-lg text-[9px] font-bold text-orange-600">{m.match_type} (₹{m.price})</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 flex justify-between">
                        <button onClick={() => setCurrentStep(5)} className="px-10 py-4 text-slate-800 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2"><ArrowLeft size={16} /> Back</button>
                        <div className="flex gap-4">
                            <button onClick={onCancel} className="px-10 py-4 bg-slate-100 text-slate-900 rounded-[2rem] text-xs font-bold uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                            <button onClick={onPublish} className="px-12 py-4 bg-orange-500 text-white rounded-[2rem] text-xs font-bold uppercase tracking-widest hover:bg-orange-600 shadow-xl shadow-orange-200 transition-all flex items-center gap-3">
                                {isEditing ? "Update Sports Event" : "Publish to Platform"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SportsEventForm;
