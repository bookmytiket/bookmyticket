"use client";
import React, { useState, useEffect } from "react";
import { 
    Trophy, Activity, Goal, Users, ArrowLeft, ArrowRight, Settings, 
    Calendar, Clock, MapPin, DollarSign, Shield, CheckCircle2,
    ChevronRight, Info, HeartPulse, GraduationCap, Briefcase, Timer, Target,
    Bike, Award, Utensils, Shirt, Coffee, Car, Smile, Camera, Home, FileText,
    TrendingUp, Trash2, Trash, Zap, Wallet, Sparkles, Search, Monitor, ShieldCheck,
    Dribbble, Sword, Flag, Medal, Footprints
} from "lucide-react";
import CalendarPicker from "./CalendarPicker";
import TimePicker from "./TimePicker";
import { useAuth } from '@/components/AuthContext';
import LocationSelectionModal from "@/components/LocationSelectionModal";
import BlockMapDesigner from "./BlockMapDesigner";
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
                className="w-full bg-slate-50/50 border border-slate-100 text-slate-900 text-sm font-bold px-6 py-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-200 transition-all placeholder:text-slate-400"
                placeholder={placeholder}
            />
        )}
    </div>
);

const SportsEventForm = ({ postEvent, setPostEvent, onCancel, onPublish, isEditing }) => {
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [showLocationModal, setShowLocationModal] = useState(false);

    useEffect(() => {
        if (!postEvent.sportType) {
            setPostEvent(prev => ({ 
                ...prev, 
                type: "Sports Event", 
                sportType: "Tournament",
                categories: prev.categories || []
            }));
        }
    }, []);

    const steps = [
        { id: 1, title: "Category", icon: Trophy },
        { id: 2, title: "Grounds", icon: MapPin },
        { id: 3, title: "Schedule", icon: Timer },
        { id: 4, title: "Ticketing", icon: DollarSign },
        { id: 5, title: "Deploy", icon: Zap }
    ];

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const sportModes = [
        { id: 'Tournament', label: 'Tournament', desc: 'League or Knockout matches', icon: Trophy, color: 'orange' },
        { id: 'Marathon', label: 'Marathon', desc: 'Running & Endurance races', icon: Footprints, color: 'blue' },
        { id: 'Coaching', label: 'Academy/Camp', desc: 'Training & Skill workshops', icon: GraduationCap, color: 'emerald' },
        { id: 'E-Sports', label: 'E-Sports', desc: 'Gaming & Digital tournaments', icon: Monitor, color: 'indigo' }
    ];

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
                                    ? 'bg-gradient-to-br from-orange-500 to-red-600 border-transparent text-white shadow-xl shadow-orange-500/20 scale-110' 
                                    : 'bg-white border-slate-100 text-slate-400'
                                }`}
                            >
                                <s.icon size={22} strokeWidth={2.5} />
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${currentStep >= s.id ? 'text-orange-600' : 'text-slate-400'}`}>
                                {s.title}
                            </span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={`w-full h-[2px] mx-4 rounded-full transition-all duration-700 ${currentStep > s.id ? 'bg-gradient-to-r from-orange-500 to-red-600' : 'bg-slate-100'}`} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Step 1: Sport Category */}
            {currentStep === 1 && (
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] p-12 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-3xl bg-orange-50 flex items-center justify-center text-orange-600 shadow-inner">
                            <Trophy size={32} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Sporting Format</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Select the blueprint for your competition</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {sportModes.map((mode) => (
                            <button
                                key={mode.id}
                                onClick={() => setPostEvent(p => ({ ...p, sportType: mode.id }))}
                                className={`flex items-start gap-6 p-8 rounded-[2.5rem] border-2 text-left transition-all duration-500 ${
                                    postEvent.sportType === mode.id 
                                    ? 'bg-orange-50 border-orange-200 shadow-2xl shadow-orange-500/10 scale-[1.02]' 
                                    : 'bg-slate-50/50 border-slate-100 grayscale hover:grayscale-0 hover:border-orange-100'
                                }`}
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                                    postEvent.sportType === mode.id ? 'bg-orange-500 text-white' : 'bg-white text-slate-400 shadow-sm'
                                }`}>
                                    <mode.icon size={28} strokeWidth={1.5} />
                                </div>
                                <div className="space-y-1">
                                    <span className="block text-[11px] font-black uppercase tracking-widest text-slate-900">{mode.label}</span>
                                    <span className="block text-[9px] font-bold text-slate-400 uppercase leading-relaxed">{mode.desc}</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-6">
                        {renderInput("Event Name*", postEvent.title, (v) => setPostEvent(p => ({ ...p, title: v })), "text", "e.g. Pro Cricket League 2026", true)}
                        {renderInput("Sport Name*", postEvent.sportName, (v) => setPostEvent(p => ({ ...p, sportName: v })), "text", "e.g. Cricket, Football")}
                        {renderInput("Age Category", postEvent.ageGroup, (v) => setPostEvent(p => ({ ...p, ageGroup: v })), "text", "e.g. U-19, Open")}
                    </div>

                    <div className="pt-10 flex justify-end">
                        <button onClick={nextStep} className="px-12 py-5 bg-slate-900 text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:bg-orange-600 transition-all shadow-2xl">Next: Ground Selection <ArrowRight size={18} /></button>
                    </div>
                </div>
            )}

            {/* Step 2: Grounds */}
            {currentStep === 2 && (
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] p-12 space-y-12 animate-in fade-in slide-in-from-right-8 duration-700">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                            <MapPin size={32} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Arena Selection</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Geospatial positioning & stadium mapping</p>
                        </div>
                        {/* Locate Ground button removed */}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {renderInput("Stadium/Ground Name*", postEvent.venue, (v) => setPostEvent(p => ({ ...p, venue: v })), "text", "e.g. Chinnaswamy Stadium", true)}
                        {renderInput("Address*", postEvent.address, (v) => setPostEvent(p => ({ ...p, address: v })), "text", "Full venue location", true)}
                    </div>

                    <div className="space-y-6 pt-6">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Arena Seating Designer (Optional)</label>
                        <BlockMapDesigner postEvent={postEvent} setPostEvent={setPostEvent} />
                    </div>

                    <div className="pt-10 flex justify-between">
                        <button onClick={prevStep} className="px-10 py-5 text-slate-400 font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:text-slate-900 transition-colors"><ArrowLeft size={18} /> Category Return</button>
                        <button onClick={nextStep} className="px-12 py-5 bg-slate-900 text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:bg-orange-600 transition-all shadow-2xl">Next: Match Schedule <ArrowRight size={18} /></button>
                    </div>
                </div>
            )}

            {/* Step 3: Schedule */}
            {currentStep === 3 && (
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] p-12 space-y-12 animate-in fade-in slide-in-from-right-8 duration-700">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                            <Timer size={32} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Match Scheduling</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Temporal parameters & fixture timeline</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {renderInput("Registration Start*", postEvent.startDate, (v) => setPostEvent(p => ({ ...p, startDate: v })), "date")}
                        {renderInput("Tournament Start*", postEvent.tournamentStartDate, (v) => setPostEvent(p => ({ ...p, tournamentStartDate: v })), "date")}
                        {renderInput("Reporting Time*", postEvent.startTime, (v) => setPostEvent(p => ({ ...p, startTime: v })), "time")}
                        {renderInput("Estimated End Time", postEvent.endTime, (v) => setPostEvent(p => ({ ...p, endTime: v })), "time")}
                        {renderInput("Video Trailer URL", postEvent.videoTrailerUrl, (v) => setPostEvent(p => ({ ...p, videoTrailerUrl: v })), "url", "YouTube/Vimeo link", true)}
                        
                        <div className="md:col-span-2 space-y-6">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Sporting Visuals (Gallery)</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {(postEvent.galleryPreviews || []).map((img, idx) => (
                                    <div key={idx} className="group relative h-32 rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
                                        <img src={img} className="w-full h-full object-cover" />
                                        <button 
                                            onClick={() => {
                                                const next = postEvent.galleryPreviews.filter((_, i) => i !== idx);
                                                setPostEvent(p => ({ ...p, galleryPreviews: next }));
                                            }}
                                            className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur rounded-xl text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                <button 
                                    onClick={() => document.getElementById('sports-gallery-upload').click()}
                                    className="h-32 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-orange-300 hover:text-orange-500 transition-all bg-slate-50/50"
                                >
                                    <Plus size={24} strokeWidth={1.5} />
                                    <span className="text-[8px] font-black uppercase tracking-widest">Add Action</span>
                                </button>
                                <input 
                                    id="sports-gallery-upload" 
                                    type="file" 
                                    multiple 
                                    className="hidden" 
                                    onChange={(e) => {
                                        const files = Array.from(e.target.files);
                                        files.forEach(file => {
                                            const reader = new FileReader();
                                            reader.onload = (ev) => {
                                                setPostEvent(p => ({ 
                                                    ...p, 
                                                    galleryPreviews: [...(p.galleryPreviews || []), ev.target.result] 
                                                }));
                                            };
                                            reader.readAsDataURL(file);
                                        });
                                    }} 
                                />
                            </div>
                        </div>
                        
                        <div className="md:col-span-2 space-y-6">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Operational Windows</label>
                            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-orange-600">
                                        <ShieldCheck size={18} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Medical Coverage</span>
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed">Paramedic teams & ambulance presence duration</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-indigo-600">
                                        <Monitor size={18} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Live Telecast</span>
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed">Broadcast team setup and transmission windows</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 flex justify-between">
                        <button onClick={prevStep} className="px-10 py-5 text-slate-400 font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:text-slate-900 transition-colors"><ArrowLeft size={18} /> Arena Return</button>
                        <button onClick={nextStep} className="px-12 py-5 bg-slate-900 text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:bg-orange-600 transition-all shadow-2xl">Next: Ticketing <ArrowRight size={18} /></button>
                    </div>
                </div>
            )}

            {/* Step 4: Ticketing */}
            {currentStep === 4 && (
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] p-12 space-y-12 animate-in fade-in slide-in-from-right-8 duration-700">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-3xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
                            <DollarSign size={32} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Inventory Control</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Registration tiers & participation fees</p>
                        </div>
                        <button 
                            onClick={() => {
                                const next = [...(postEvent.categories || [])];
                                next.push({ id: Date.now(), name: "Standard Entry", price: 500, totalSlots: 200, color: "#f97316" });
                                setPostEvent(p => ({ ...p, categories: next }));
                            }}
                            className="flex items-center gap-3 px-8 py-4 bg-emerald-50 text-emerald-600 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100"
                        >
                            <Plus size={16} /> Add Category
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {(postEvent.categories || []).map((cat, idx) => (
                            <div key={cat.id} className="group relative bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 hover:border-emerald-200 transition-all shadow-sm">
                                <button 
                                    onClick={() => {
                                        const next = postEvent.categories.filter((_, i) => i !== idx);
                                        setPostEvent(p => ({ ...p, categories: next }));
                                    }}
                                    className="absolute -top-3 -right-3 w-10 h-10 bg-white text-slate-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-slate-100 shadow-lg hover:text-red-500"
                                >
                                    <Trash2 size={16} />
                                </button>
                                
                                <div className="space-y-6">
                                    <input 
                                        className="bg-transparent text-lg font-black text-slate-900 uppercase tracking-tight w-full focus:outline-none border-b border-transparent focus:border-emerald-200 pb-1"
                                        value={cat.name}
                                        onChange={e => {
                                            const next = [...postEvent.categories];
                                            next[idx].name = e.target.value;
                                            setPostEvent(p => ({ ...p, categories: next }));
                                        }}
                                    />
                                    
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Entry Fee (₹)</label>
                                            <input 
                                                type="number"
                                                className="w-full bg-white border border-slate-100 text-sm font-black p-4 rounded-2xl text-emerald-600 focus:outline-none"
                                                value={cat.price}
                                                onChange={e => {
                                                    const next = [...postEvent.categories];
                                                    next[idx].price = parseFloat(e.target.value) || 0;
                                                    setPostEvent(p => ({ ...p, categories: next }));
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Team/Slot Limit</label>
                                            <input 
                                                type="number"
                                                className="w-full bg-white border border-slate-100 text-sm font-black p-4 rounded-2xl text-slate-900 focus:outline-none"
                                                value={cat.totalSlots}
                                                onChange={e => {
                                                    const next = [...postEvent.categories];
                                                    next[idx].totalSlots = parseInt(e.target.value) || 0;
                                                    setPostEvent(p => ({ ...p, categories: next }));
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-10 flex justify-between">
                        <button onClick={prevStep} className="px-10 py-5 text-slate-400 font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:text-slate-900 transition-colors"><ArrowLeft size={18} /> Schedule Return</button>
                        <button onClick={nextStep} className="px-12 py-5 bg-slate-900 text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:bg-orange-600 transition-all shadow-2xl">Next: Deploy Launch <ArrowRight size={18} /></button>
                    </div>
                </div>
            )}

            {/* Step 5: Deploy */}
            {currentStep === 5 && (
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] p-12 space-y-12 animate-in zoom-in duration-700">
                    <div className="flex flex-col items-center text-center space-y-8">
                        <div className="w-24 h-24 rounded-[3rem] bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white shadow-2xl shadow-orange-500/20 animate-pulse">
                            <Zap size={48} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Sporting Arena Ready</h2>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-4">All match parameters have been verified and locked</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-2xl pt-8">
                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Sport</span>
                                <span className="text-[10px] font-black text-slate-900 uppercase truncate block">{postEvent.sportName || 'Generic'}</span>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Arena</span>
                                <span className="text-[10px] font-black text-slate-900 uppercase truncate block">{postEvent.venue || 'TBD'}</span>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Categories</span>
                                <span className="text-[10px] font-black text-slate-900 uppercase block">{(postEvent.categories || []).length}</span>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</span>
                                <span className="text-[10px] font-black text-orange-600 uppercase block">Operational</span>
                            </div>
                        </div>

                        <button 
                            onClick={onPublish}
                            className="mt-12 px-20 py-8 bg-gradient-to-r from-orange-500 via-red-600 to-pink-600 text-white rounded-[4rem] text-sm font-black uppercase tracking-[0.4em] shadow-2xl shadow-orange-500/40 hover:scale-105 transition-all group relative overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center gap-4">
                                <ShieldCheck size={24} strokeWidth={2.5} />
                                Execute Event Launch
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-red-600 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        </button>

                        <button onClick={prevStep} className="text-slate-400 hover:text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] transition-colors py-4">Verification Audit: Return to Previous Modules</button>
                    </div>
                </div>
            )}

            {/* Cancel Button */}
            <div className="mt-12 flex justify-center">
                <button onClick={onCancel} className="text-slate-400 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.2em] transition-colors py-4">Discard & Terminate Creation</button>
            </div>

            <LocationSelectionModal 
                isOpen={showLocationModal}
                onClose={() => setShowLocationModal(false)}
                selectedCity={postEvent.city}
                updateCity={(cityName, details) => {
                    if (details) {
                        setPostEvent(p => ({
                            ...p,
                            country: details.country || p.country,
                            state: details.state || p.state,
                            city: details.city || cityName,
                            address: details.address || details.fullAddress || p.address,
                            zipCode: details.pincode || details.zipCode || p.zipCode,
                            latitude: details.lat || p.latitude,
                            longitude: details.lng || p.longitude
                        }));
                    }
                }}
            />
        </div>
    );
};

export default SportsEventForm;
