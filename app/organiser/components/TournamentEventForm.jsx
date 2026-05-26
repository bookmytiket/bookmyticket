"use client";
import React, { useState, useEffect } from "react";
import { 
    Trophy, Activity, Goal, Users, ArrowLeft, ArrowRight, Settings, 
    Calendar, Clock, MapPin, DollarSign, Shield, CheckCircle2,
    ChevronRight, Info, HeartPulse, GraduationCap, Briefcase, Timer, Target,
    Bike, Award, Utensils, Shirt, Coffee, Car, Smile, Camera, Home, FileText,
    TrendingUp, Trash2, Trash, Zap, Wallet, Sparkles, Search, Monitor, ShieldCheck,
    Dribbble, Sword, Flag, Medal, Footprints, Plus, Image as ImageIcon,
    Users2, UserPlus, ClipboardList, Layout, FileCheck, Grid
} from "lucide-react";
import CalendarPicker from "./CalendarPicker";
import TimePicker from "./TimePicker";
import { useAuth } from '@/components/AuthContext';
import LocationSelectionModal from "@/components/LocationSelectionModal";
import GoogleInlineMap from "./GoogleInlineMap";
import { geocode, reverseGeocode } from "@/lib/googleMaps";
import { COUNTRIES } from "@/app/data/locationData";
import { State, City } from 'country-state-city';
import { INDIAN_STATES, getIndianDistricts, getIndianCities } from "@/app/data/indianLocations";
import { supabase } from "@/lib/supabase";
import CustomSelect from "./CustomSelect";

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
                className="w-full bg-slate-50/50 border border-slate-100 text-slate-900 text-sm font-bold px-6 py-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-200 transition-all placeholder:text-slate-500"
                placeholder={placeholder}
            />
        )}
    </div>
);

const today = new Date().toISOString().split('T')[0];

const TournamentEventForm = ({ postEvent, setPostEvent, onCancel, onPublish, isEditing }) => {
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [dbDistricts, setDbDistricts] = useState([]);
    const [dbCities, setDbCities] = useState([]);
    const [distLoading, setDistLoading] = useState(false);
    const [cityLoading, setCityLoading] = useState(false);

    useEffect(() => {
        if (!postEvent.country) {
            setPostEvent(prev => ({ 
                ...prev, 
                country: prev.country || "India",
                countryCode: prev.countryCode || "IN"
            }));
        }
    }, []);

    useEffect(() => {
        const fetchDistricts = async () => {
            if (!postEvent.state || postEvent.country !== "India") {
                setDbDistricts([]);
                return;
            }
            setDistLoading(true);
            try {
                const { data: stateData } = await supabase.from('states').select('id').eq('name', postEvent.state).maybeSingle();
                if (stateData) {
                    const { data: dists } = await supabase.from('districts').select('name').eq('state_id', stateData.id).order('name');
                    setDbDistricts(dists?.map(d => d.name) || []);
                }
            } catch (err) { console.error(err); } finally { setDistLoading(false); }
        };
        fetchDistricts();
    }, [postEvent.state, postEvent.country]);

    useEffect(() => {
        const fetchCities = async () => {
            if (!postEvent.district || postEvent.country !== "India") {
                setDbCities([]);
                return;
            }
            setCityLoading(true);
            try {
                const { data: distData } = await supabase.from('districts').select('id').eq('name', postEvent.district).maybeSingle();
                if (distData) {
                    const { data: cts } = await supabase.from('cities').select('name').eq('district_id', distData.id).order('name');
                    setDbCities(cts?.map(c => c.name) || []);
                }
            } catch (err) { console.error(err); } finally { setCityLoading(false); }
        };
        fetchCities();
    }, [postEvent.district, postEvent.country]);

    useEffect(() => {
        if (!postEvent.tournamentType) {
            setPostEvent(prev => ({ 
                ...prev, 
                type: "Tournament Event", 
                category: "Sports",
                startDate: prev.startDate || today,
                tournamentFormat: prev.tournamentFormat || "Knockout",
                audienceFreeAccess: prev.audienceFreeAccess ?? true,
                minTeamSize: prev.minTeamSize || 1,
                maxTeamSize: prev.maxTeamSize || 20,
                registrationFee: prev.registrationFee || 0,
                categories: prev.categories || []
            }));
        }
    }, []);

    const steps = [
        { id: 1, title: "Tournament", icon: Trophy },
        { id: 2, title: "Registration", icon: UserPlus },
        { id: 3, title: "Logistics", icon: MapPin },
        { id: 4, title: "Rules & Terms", icon: ClipboardList },
        { id: 5, title: isEditing ? "Update" : "Finalize", icon: Zap }
    ];

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const tournamentFormats = [
        { id: 'Knockout', label: 'Knockout', desc: 'Direct elimination bracket', icon: Sword },
        { id: 'League', label: 'League', desc: 'Points based round-robin', icon: Layout },
        { id: 'GroupStage', label: 'Group + Knockout', desc: 'Groups followed by finals', icon: Grid },
        { id: 'Custom', label: 'Custom Bracket', desc: 'Organiser defined structure', icon: Settings }
    ];

    const sportTypes = ["Cricket", "Football", "Kabaddi", "Volleyball", "Badminton", "E-Sports", "Other"];

    return (
        <div className="max-w-5xl mx-auto py-12 px-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-between mb-16 overflow-x-auto pb-4 scrollbar-hide">
                {steps.map((s, idx) => (
                    <React.Fragment key={s.id}>
                        <div className="flex flex-col items-center gap-4 shrink-0">
                            <div 
                                onClick={() => currentStep > s.id && setCurrentStep(s.id)}
                                className={`w-14 h-14 rounded-[2rem] flex items-center justify-center transition-all duration-500 border-2 cursor-pointer ${
                                    currentStep >= s.id 
                                    ? 'bg-gradient-to-br from-[#ec4899] to-[#a855f7] border-transparent text-white shadow-xl shadow-pink-500/20 scale-110' 
                                    : 'bg-white border-slate-100 text-slate-400'
                                }`}
                            >
                                <s.icon size={22} strokeWidth={2.5} />
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${currentStep >= s.id ? 'text-pink-600' : 'text-slate-400'}`}>
                                {s.title}
                            </span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={`w-full h-[2px] mx-4 rounded-full transition-all duration-700 ${currentStep > s.id ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-slate-100'}`} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Step 1: Tournament Identity */}
            {currentStep === 1 && (
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] p-12 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-3xl bg-pink-50 flex items-center justify-center text-pink-600 shadow-inner">
                            <Trophy size={32} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Tournament Identity</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Define your competition's brand & format</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {renderInput("Tournament Name*", postEvent.title, (v) => setPostEvent(p => ({ ...p, title: v })), "text", "e.g. Champions Trophy 2026", true)}
                        {renderInput("Organised By (Name)", postEvent.organiser_name, (v) => setPostEvent(p => ({ ...p, organiser_name: v })), "text", "e.g. Partner Name", true)}
                        
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Sport Category*</label>
                            <CustomSelect 
                                value={postEvent.sportType} 
                                options={sportTypes} 
                                onChange={(v) => setPostEvent(p => ({ ...p, sportType: v }))} 
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Tournament Format*</label>
                            <div className="grid grid-cols-2 gap-4">
                                {tournamentFormats.map(fmt => (
                                    <button
                                        key={fmt.id}
                                        onClick={() => setPostEvent(p => ({ ...p, tournamentFormat: fmt.id }))}
                                        className={`p-4 rounded-2xl border-2 text-left transition-all ${
                                            postEvent.tournamentFormat === fmt.id 
                                            ? 'bg-pink-50 border-pink-200' 
                                            : 'bg-slate-50/50 border-slate-100 hover:border-pink-100'
                                        }`}
                                    >
                                        <fmt.icon size={18} className={postEvent.tournamentFormat === fmt.id ? 'text-pink-600' : 'text-slate-500'} />
                                        <span className={`block text-[10px] font-black uppercase tracking-tight mt-2 ${
                                            postEvent.tournamentFormat === fmt.id ? 'text-pink-600' : 'text-slate-900'
                                        }`}>
                                            {fmt.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-3">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Description</label>
                            <textarea 
                                value={postEvent.description || ""}
                                onChange={(e) => setPostEvent(p => ({ ...p, description: e.target.value }))}
                                className="w-full bg-slate-50/50 border border-slate-100 text-slate-900 text-sm font-bold px-6 py-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-200 transition-all min-h-[120px]"
                                placeholder="Describe the tournament highlights..."
                            />
                        </div>

                        <div className="md:col-span-2 space-y-4">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Tournament Banner*</label>
                            <div className="relative group h-64 rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden hover:border-pink-300 transition-all flex items-center justify-center">
                                {postEvent.bannerPreview ? (
                                    <>
                                        <img src={postEvent.bannerPreview} className="absolute inset-0 w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button 
                                                onClick={() => setPostEvent(p => ({ ...p, bannerPreview: "" }))}
                                                className="p-4 bg-white/20 backdrop-blur-xl rounded-2xl text-white hover:bg-red-500 transition-all"
                                            >
                                                <Trash2 size={24} />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <label className="cursor-pointer flex flex-col items-center gap-4 group/label">
                                        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover/label:text-pink-500 group-hover/label:scale-110 transition-all">
                                            <ImageIcon size={32} strokeWidth={1.5} />
                                        </div>
                                        <div className="text-center">
                                            <span className="block text-[10px] font-black text-slate-900 uppercase tracking-widest">Upload Main Banner</span>
                                            <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-tight mt-1">1200x600 recommended</span>
                                        </div>
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (ev) => setPostEvent(p => ({ ...p, bannerPreview: ev.target.result }));
                                                reader.readAsDataURL(file);
                                            }
                                        }} />
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 flex justify-end">
                        <button onClick={nextStep} className="px-12 py-5 bg-slate-900 text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:bg-pink-600 transition-all shadow-2xl">Next: Registration Rules <ArrowRight size={18} /></button>
                    </div>
                </div>
            )}

            {/* Step 2: Registration Rules */}
            {currentStep === 2 && (
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] p-12 space-y-12 animate-in fade-in slide-in-from-right-8 duration-700">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-3xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-inner">
                            <UserPlus size={32} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Registration Rules</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Set team limits & participation fees</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {renderInput("Registration Fee (₹)", postEvent.registrationFee, (v) => setPostEvent(p => ({ ...p, registrationFee: v })), "number", "0 for free")}
                        {renderInput("Registration End Date*", postEvent.registrationEndDate, (v) => setPostEvent(p => ({ ...p, registrationEndDate: v })), "date")}
                        
                        <div className="grid grid-cols-2 gap-6">
                            {renderInput("Min Players/Team", postEvent.minTeamSize, (v) => setPostEvent(p => ({ ...p, minTeamSize: v })), "number")}
                            {renderInput("Max Players/Team", postEvent.maxTeamSize, (v) => setPostEvent(p => ({ ...p, maxTeamSize: v })), "number")}
                        </div>

                        <div className="space-y-6">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Audience Access</label>
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => setPostEvent(p => ({ ...p, audienceFreeAccess: !p.audienceFreeAccess }))}
                                    className={`flex-1 p-6 rounded-[2rem] border-2 flex items-center gap-4 transition-all ${
                                        postEvent.audienceFreeAccess ? 'bg-pink-50 border-pink-200' : 'bg-slate-50 border-slate-100'
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${postEvent.audienceFreeAccess ? 'bg-pink-500 text-white' : 'bg-white text-slate-300 shadow-sm'}`}>
                                        <Users size={20} />
                                    </div>
                                    <div className="text-left">
                                        <span className={`block text-[10px] font-black uppercase tracking-tight ${postEvent.audienceFreeAccess ? 'text-pink-600' : 'text-slate-900'}`}>Free Audience Entry</span>
                                        <span className="block text-[8px] font-bold text-slate-400 uppercase">Public can visit for free</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-6">
                            <div className="flex items-center justify-between">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Tournament Tiers/Categories</label>
                                <button 
                                    onClick={() => {
                                        const next = [...(postEvent.categories || [])];
                                        next.push({ id: Date.now(), name: "Open Category", fee: postEvent.registrationFee || 0, maxTeams: 16 });
                                        setPostEvent(p => ({ ...p, categories: next }));
                                    }}
                                    className="flex items-center gap-2 text-[10px] font-black text-pink-600 uppercase tracking-widest hover:text-pink-700"
                                >
                                    <Plus size={14} /> Add Category
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {(postEvent.categories || []).map((cat, idx) => (
                                    <div key={cat.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 relative group">
                                        <button 
                                            onClick={() => {
                                                const next = postEvent.categories.filter((_, i) => i !== idx);
                                                setPostEvent(p => ({ ...p, categories: next }));
                                            }}
                                            className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <div className="space-y-4">
                                            <input 
                                                className="bg-transparent text-sm font-black text-slate-900 uppercase tracking-tight w-full focus:outline-none border-b border-transparent focus:border-pink-200"
                                                value={cat.name}
                                                placeholder="Category Name"
                                                onChange={e => {
                                                    const next = [...postEvent.categories];
                                                    next[idx].name = e.target.value;
                                                    setPostEvent(p => ({ ...p, categories: next }));
                                                }}
                                            />
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Entry Fee (₹)</span>
                                                    <input 
                                                        type="number"
                                                        className="w-full bg-white border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold"
                                                        value={cat.fee}
                                                        onChange={e => {
                                                            const next = [...postEvent.categories];
                                                            next[idx].fee = e.target.value;
                                                            setPostEvent(p => ({ ...p, categories: next }));
                                                        }}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Team Limit</span>
                                                    <input 
                                                        type="number"
                                                        className="w-full bg-white border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold"
                                                        value={cat.maxTeams}
                                                        onChange={e => {
                                                            const next = [...postEvent.categories];
                                                            next[idx].maxTeams = e.target.value;
                                                            setPostEvent(p => ({ ...p, categories: next }));
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 flex justify-between">
                        <button onClick={prevStep} className="px-10 py-5 text-slate-400 font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:text-slate-900 transition-colors"><ArrowLeft size={18} /> Tournament Info</button>
                        <button onClick={nextStep} className="px-12 py-5 bg-slate-900 text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:bg-pink-600 transition-all shadow-2xl">Next: Logistics <ArrowRight size={18} /></button>
                    </div>
                </div>
            )}

            {/* Step 3: Logistics */}
            {currentStep === 3 && (
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] p-12 space-y-12 animate-in fade-in slide-in-from-right-8 duration-700">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                            <MapPin size={32} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Arena & Schedule</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Geospatial positioning & temporal parameters</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {renderInput("Venue/Stadium Name*", postEvent.venue, (v) => setPostEvent(p => ({ ...p, venue: v })), "text", "e.g. DY Patil Stadium", true)}
                        {renderInput("Full Address*", postEvent.address, (v) => setPostEvent(p => ({ ...p, address: v })), "text", "Building, Street, Area", true)}
                        
                        <CustomSelect 
                            label="Country"
                            value={postEvent.country}
                            options={COUNTRIES}
                            onChange={(v) => {
                                const countryData = COUNTRIES.find(c => (c.label || c) === v);
                                setPostEvent(p => ({ ...p, country: v, countryCode: countryData?.code || "IN", state: "", district: "", city: "", zipCode: "" }));
                            }}
                        />
                        <CustomSelect 
                            label="State / Province"
                            value={postEvent.state}
                            options={State.getStatesOfCountry(postEvent.countryCode || 'IN').map(s => s.name)}
                            onChange={(v) => {
                                const stateObj = State.getStatesOfCountry(postEvent.countryCode || 'IN').find(s => s.name === v);
                                setPostEvent(p => ({ ...p, state: v, stateCode: stateObj?.isoCode || "", district: "", city: "" }));
                            }}
                        />

                        {postEvent.countryCode === "IN" ? (
                            <>
                                <CustomSelect 
                                    label="District"
                                    value={postEvent.district}
                                    options={Array.from(new Set([...dbDistricts, ...getIndianDistricts(postEvent.state)])).sort()}
                                    isLoading={distLoading}
                                    onChange={(v) => setPostEvent(prev => ({ ...prev, district: v, city: "", zipCode: "" }))}
                                />
                                <CustomSelect 
                                    label="City"
                                    value={postEvent.city}
                                    options={Array.from(new Set([...dbCities, ...getIndianCities(postEvent.district)])).sort()}
                                    isLoading={cityLoading}
                                    onChange={async (v) => {
                                        setPostEvent(prev => ({ ...prev, city: v }));
                                        try {
                                            const coords = await geocode(`${v}, ${postEvent.state}, ${postEvent.country}`);
                                            if (coords) setPostEvent(prev => ({ ...prev, latitude: coords.lat, longitude: coords.lng }));
                                        } catch (err) {}
                                    }}
                                />
                            </>
                        ) : (
                            <CustomSelect 
                                label="City"
                                value={postEvent.city}
                                options={City.getCitiesOfState(postEvent.countryCode || 'IN', postEvent.stateCode).map(c => c.name)}
                                onChange={async (v) => {
                                    setPostEvent(prev => ({ ...prev, city: v }));
                                    try {
                                        const coords = await geocode(`${v}, ${postEvent.state}, ${postEvent.country}`);
                                        if (coords) setPostEvent(prev => ({ ...prev, latitude: coords.lat, longitude: coords.lng }));
                                    } catch (err) {}
                                }}
                            />
                        )}

                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Pincode / Zip Code</label>
                            <input 
                                type="text"
                                value={postEvent.zipCode || ""}
                                onChange={(e) => setPostEvent(prev => ({ ...prev, zipCode: e.target.value }))}
                                className="w-full bg-slate-50/50 border border-slate-100 text-slate-900 text-sm font-bold px-6 py-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-200 transition-all placeholder:text-slate-500"
                                placeholder="Enter Pincode"
                            />
                        </div>

                        {renderInput("Tournament Start Date*", postEvent.startDate, (v) => setPostEvent(p => ({ ...p, startDate: v })), "date")}
                        {renderInput("Tournament End Date*", postEvent.endDate, (v) => setPostEvent(p => ({ ...p, endDate: v })), "date")}
                        {renderInput("Reporting Time*", postEvent.startTime, (v) => setPostEvent(p => ({ ...p, startTime: v })), "time")}
                        
                        <div className="md:col-span-2 h-[350px] rounded-[3rem] overflow-hidden border border-slate-100 shadow-2xl relative mt-4">
                            <GoogleInlineMap 
                                lat={postEvent.latitude || 20.5937} 
                                lng={postEvent.longitude || 78.9629}
                                onLocationSelect={async (lat, lng) => {
                                    setPostEvent(p => ({ ...p, latitude: lat, longitude: lng }));
                                    try {
                                        const geo = await reverseGeocode(lat, lng);
                                        if (geo) {
                                            setPostEvent(p => ({ 
                                                ...p, 
                                                address: geo.fullAddress,
                                                city: geo.city,
                                                state: geo.state,
                                                country: geo.country,
                                                zipCode: geo.pincode
                                            }));
                                        }
                                    } catch (err) {}
                                }}
                            />
                        </div>
                    </div>

                    <div className="pt-10 flex justify-between">
                        <button onClick={prevStep} className="px-10 py-5 text-slate-400 font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:text-slate-900 transition-colors"><ArrowLeft size={18} /> Registration Rules</button>
                        <button onClick={nextStep} className="px-12 py-5 bg-slate-900 text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:bg-pink-600 transition-all shadow-2xl">Next: Rules & Terms <ArrowRight size={18} /></button>
                    </div>
                </div>
            )}

            {/* Step 4: Rules & Terms */}
            {currentStep === 4 && (
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] p-12 space-y-12 animate-in fade-in slide-in-from-right-8 duration-700">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                            <ClipboardList size={32} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Operational Governance</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Rules of engagement & legal terms</p>
                        </div>
                    </div>

                    <div className="space-y-10">
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Official Rules & Regulations</label>
                            <textarea 
                                value={postEvent.rulesRegulations || ""}
                                onChange={(e) => setPostEvent(p => ({ ...p, rulesRegulations: e.target.value }))}
                                className="w-full bg-slate-50/50 border border-slate-100 text-slate-900 text-sm font-bold px-6 py-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-200 transition-all min-h-[150px]"
                                placeholder="Match rules, substitute policies, gear requirements..."
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Terms & Conditions</label>
                            <textarea 
                                value={postEvent.termsConditions || ""}
                                onChange={(e) => setPostEvent(p => ({ ...p, termsConditions: e.target.value }))}
                                className="w-full bg-slate-50/50 border border-slate-100 text-slate-900 text-sm font-bold px-6 py-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-200 transition-all min-h-[150px]"
                                placeholder="Refund policies, injury waivers, code of conduct..."
                            />
                        </div>
                    </div>

                    <div className="pt-10 flex justify-between">
                        <button onClick={prevStep} className="px-10 py-5 text-slate-400 font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:text-slate-900 transition-colors"><ArrowLeft size={18} /> Logistics</button>
                        <button onClick={nextStep} className="px-12 py-5 bg-slate-900 text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:bg-pink-600 transition-all shadow-2xl">Next: Final Review <ArrowRight size={18} /></button>
                    </div>
                </div>
            )}

            {/* Step 5: Final Review */}
            {currentStep === 5 && (
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] p-12 space-y-12 animate-in zoom-in duration-700">
                    <div className="flex flex-col items-center text-center space-y-8">
                        <div className="w-24 h-24 rounded-[3rem] bg-gradient-to-br from-[#ec4899] to-[#a855f7] flex items-center justify-center text-white shadow-2xl shadow-pink-500/20 animate-pulse">
                            <Zap size={48} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">{isEditing ? "Ready to Update" : "Tournament Ready"}</h2>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-4">Verification Audit: Parameters locked & loaded</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-2xl pt-8">
                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Sport</span>
                                <span className="text-[10px] font-black text-slate-900 uppercase truncate block">{postEvent.sportType}</span>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Format</span>
                                <span className="text-[10px] font-black text-slate-900 uppercase truncate block">{postEvent.tournamentFormat}</span>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Teams</span>
                                <span className="text-[10px] font-black text-slate-900 uppercase block">{(postEvent.categories || []).reduce((acc, c) => acc + parseInt(c.maxTeams || 0), 0) || 'Unlimited'}</span>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Audience</span>
                                <span className="text-[10px] font-black text-pink-600 uppercase block">{postEvent.audienceFreeAccess ? 'Free Entry' : 'Ticketed'}</span>
                            </div>
                        </div>

                        <button 
                            onClick={onPublish}
                            className="mt-12 px-20 py-8 bg-gradient-to-r from-[#ec4899] via-[#a855f7] to-[#3b82f6] text-white rounded-[4rem] text-sm font-black uppercase tracking-[0.4em] shadow-2xl shadow-pink-500/40 hover:scale-105 transition-all group relative overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center gap-4">
                                <ShieldCheck size={24} strokeWidth={2.5} />
                                {isEditing ? "Update Tournament" : "Launch Tournament"}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-[#3b82f6] via-[#a855f7] to-[#ec4899] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        </button>

                        <button onClick={prevStep} className="text-slate-400 hover:text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] transition-colors py-4">Return to Calibration</button>
                    </div>
                </div>
            )}

            {/* Cancel Button */}
            <div className="mt-12 flex justify-center">
                <button onClick={onCancel} className="text-slate-400 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.2em] transition-colors py-4">
                    {isEditing ? "Cancel Update & Return" : "Discard & Terminate Creation"}
                </button>
            </div>
        </div>
    );
};

export default TournamentEventForm;
