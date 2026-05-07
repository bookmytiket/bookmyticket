"use client";
import React, { useState, useEffect } from "react";
import { 
    Trophy, Activity, Goal, Users, ArrowLeft, ArrowRight, Settings, 
    Calendar, Clock, MapPin, DollarSign, Shield, CheckCircle2,
    ChevronRight, Info, HeartPulse, GraduationCap, Briefcase, Timer, Target,
    Bike, Award, Utensils, Shirt, Coffee, Car, Smile, Camera, Home, FileText,
    TrendingUp, Trash2, Trash, Zap, Wallet, Sparkles
} from "lucide-react";
import CalendarPicker from "./CalendarPicker";
import TimePicker from "./TimePicker";
import { useAuth } from '@/components/AuthContext';
import LocationSelectionModal from "@/components/LocationSelectionModal";
import { Search } from "lucide-react";

const SportsEventForm = ({ postEvent, setPostEvent, onCancel, onPublish, isEditing }) => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [currentStep, setCurrentStep] = useState(1);
    const [showLocationModal, setShowLocationModal] = useState(false);
    
    // Ensure correct type and seating defaults on mount
    useEffect(() => {
        if (postEvent.type !== "Sports" || postEvent.category !== "Sports" || postEvent.seatingEnabled !== false) {
            setPostEvent(prev => ({ 
                ...prev, 
                type: "Sports", 
                category: "Sports", 
                seatingEnabled: false 
            }));
        }
    }, []);

    const steps = [
        { id: 1, title: "Sport Specs", icon: Trophy },
        { id: 2, title: "Details", icon: Settings },
        { id: 3, title: "Pricing", icon: DollarSign }
    ];

    const sportType = postEvent.sportType?.toLowerCase() || "marathon";

    const updateField = (field, value) => {
        setPostEvent(prev => ({ ...prev, [field]: value }));
    };

    const renderInput = (label, field, type = "text", placeholder = "") => (
        <div className="space-y-2">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest pl-1">{label}</label>
            {type === "date" ? (
                <CalendarPicker 
                    value={postEvent[field] || ""} 
                    onChange={(val) => updateField(field, val)}
                    placeholder={placeholder || "dd/mm/yyyy"}
                />
            ) : type === "time" ? (
                <TimePicker 
                    value={postEvent[field] || ""} 
                    onChange={(val) => updateField(field, val)}
                    placeholder={placeholder || "--:--"}
                />
            ) : (
                <input 
                    type={type}
                    value={postEvent[field] || ""}
                    onChange={(e) => updateField(field, e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-inner transition-all placeholder:text-slate-400"
                    placeholder={placeholder}
                />
            )}
        </div>
    );

    const renderMultiSelect = (label, field, options) => {
        const selected = postEvent[field] || [];
        const toggleOption = (opt) => {
            const newSelected = selected.includes(opt) 
                ? selected.filter(o => o !== opt) 
                : [...selected, opt];
            updateField(field, newSelected);
        };

        return (
            <div className="space-y-3">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest pl-1">{label}</label>
                <div className="flex flex-wrap gap-2">
                    {options.map(opt => (
                        <button
                            key={opt}
                            onClick={() => toggleOption(opt)}
                            className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                                selected.includes(opt) 
                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' 
                                : 'bg-white border-slate-200 text-slate-600 hover:border-blue-200'
                            }`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    const renderToggle = (label, field, Icon) => (
        <button
            onClick={() => updateField(field, !postEvent[field])}
            className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                postEvent[field] 
                ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm' 
                : 'bg-white border-slate-100 text-slate-400 opacity-60'
            }`}
        >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${postEvent[field] ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                <Icon size={16} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
        </button>
    );

    const KM_BADGE_STYLE = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 transition-all ";

    const DistanceBadge = ({ opt, isSelected, onClick }) => {
        const isKM = opt.includes('K') || opt.includes('KM') || !isNaN(opt.charAt(0));
        return (
            <button 
                onClick={onClick}
                className={`${KM_BADGE_STYLE} ${
                    isSelected 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-[0_10px_20px_-5px_rgba(37,99,235,0.4)]' 
                    : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200 hover:text-slate-600'
                }`}
            >
                {isKM ? (
                    <>
                        <span className="text-sm font-bold">{opt.replace(/K|KM/g, '')}</span>
                        <span className={`px-1.5 py-0.5 rounded-lg text-[8px] font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>KM</span>
                    </>
                ) : (
                    <span className="text-[10px] font-bold uppercase tracking-widest">{opt}</span>
                )}

            </button>
        );
    };

    return (
        <div className="max-w-4xl mx-auto    ">
            {/* Stepper Header */}
            <div className="flex items-center justify-between mb-12 px-4">
                {steps.map((s, idx) => (
                    <React.Fragment key={s.id}>
                        <div className="flex flex-col items-center gap-3">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all  ${
                                currentStep >= s.id ? 'bg-blue-500 text-white shadow-xl shadow-blue-500/20' : 'bg-slate-100 text-slate-400'
                            }`}>
                                <s.icon size={20} />
                            </div>
                            <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${currentStep >= s.id ? 'text-blue-500' : 'text-slate-400'}`}>
                                {s.title}
                            </span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={`flex-1 h-0.5 max-w-[60px] mx-4 transition-colors  ${currentStep > s.id ? 'bg-blue-500' : 'bg-slate-100'}`} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Step 1: Sport Specifics */}
            {currentStep === 1 && (
                <div className="space-y-8 p-8 md:p-12 bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/40">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                            <Activity size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 uppercase">Sport Configuration</h3>
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Tailor the fields for your {postEvent.sportType}</p>
                        </div>
                    </div>

                    {sportType === "marathon" && (
                        <div className="space-y-8    ">
                            <div className="space-y-3">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Distance Categories</label>
                                <div className="flex flex-wrap gap-3">
                                    {["2K", "5K", "10K", "21K", "42K", "Half Marathon", "Full Marathon"].map(opt => (
                                        <DistanceBadge 
                                            key={opt}
                                            opt={opt}
                                            isSelected={(postEvent.distanceOptions || []).includes(opt)}
                                            onClick={() => {
                                                const selected = postEvent.distanceOptions || [];
                                                const newSelected = selected.includes(opt) ? selected.filter(o => o !== opt) : [...selected, opt];
                                                updateField("distanceOptions", newSelected);
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {renderInput("Minimum Age", "ageMin", "number", "e.g. 18")}
                                {renderInput("Maximum Age", "ageMax", "number", "e.g. 60")}
                            </div>
                            {renderMultiSelect("T-Shirt Sizes Available", "tshirtSizes", ["XS", "S", "M", "L", "XL", "XXL"])}
                            {renderInput("Google Map Picker / Route URL", "routeMapUrl", "url", "Paste link here")}
                            {renderInput("Prize Details", "prizeDetails", "text", "e.g. Cash Prize, Medal, Certificate")}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderToggle("Hydration Support", "hydrationSupport", Activity)}
                                {renderToggle("Medical Support", "medicalSupport", HeartPulse)}
                            </div>

                            <div className="space-y-6 pt-4 border-t border-slate-50">
                                <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-[0.2em]">Amenities & Participant Benefits</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {[
                                        { id: 'Ambulance', label: 'Ambulance', icon: Activity },
                                        { id: 'Cash Prize', label: 'Cash Prize', icon: DollarSign },
                                        { id: 'Certificate', label: 'Certificate', icon: FileText },
                                        { id: 'Cycle', label: 'Cycle', icon: Bike },
                                        { id: 'Family-Friendly', label: 'Family-Friendly', icon: Users },
                                        { id: 'Fast Check-In', label: 'Fast Check-In', icon: Zap },
                                        { id: 'First Aid', label: 'First Aid', icon: HeartPulse },
                                        { id: 'Free Accommodation', label: 'Accommodation', icon: Home },
                                        { id: 'Free Breakfast', label: 'Breakfast', icon: Coffee },
                                        { id: 'Medal', label: 'Medal', icon: Award },
                                        { id: 'Parking', label: 'Parking', icon: Car },
                                        { id: 'Refreshments', label: 'Refreshments', icon: Utensils },
                                        { id: 'T-Shirt', label: 'T-Shirt', icon: Shirt },
                                        { id: 'Video & Photos', label: 'Video/Photos', icon: Camera }
                                    ].map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                const selected = postEvent.amenities || [];
                                                const newSelected = selected.includes(item.id) ? selected.filter(i => i !== item.id) : [...selected, item.id];
                                                updateField("amenities", newSelected);
                                            }}
                                            className={`flex flex-col items-center gap-3 p-5 rounded-[2rem] border transition-all ${
                                                (postEvent.amenities || []).includes(item.id)
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
                                                : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200'
                                            }`}
                                        >
                                            <item.icon size={20} />
                                            <span className="text-[9px] font-bold uppercase tracking-widest">{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {sportType === "tournament" && (
                        <div className="space-y-6    ">
                            {renderInput("Number of Teams", "teamsCount", "number", "e.g. 16")}
                            <div className="space-y-3">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">Match Type</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {["Knockout", "League", "Hybrid"].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => updateField("matchType", type)}
                                            className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                                                postEvent.matchType === type ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-100 text-slate-400'
                                            }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {renderInput("Rules & Regulations", "rules", "text", "Enter rules here")}
                            {renderInput("Ground / Venue Details", "venueDetails", "text", "e.g. Court 1, Main Stadium")}
                        </div>
                    )}

                    {sportType === "coaching" && (
                        <div className="space-y-6    ">
                            {renderInput("Trainer Name", "trainerName", "text", "Enter name")}
                            {renderInput("Training Capacity", "capacity", "number", "e.g. 20")}
                            {renderInput("Session Slots", "sessionSlots", "text", "e.g. Morning 6-8 AM")}
                        </div>
                    )}

                    <div className="pt-8 flex justify-end">
                        <button 
                            onClick={() => setCurrentStep(2)} 
                            className="px-10 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-xl hover:shadow-slate-500/20 transition-all"
                        >
                            Continue <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Basic Event Details */}
            {currentStep === 2 && (
                <div className="space-y-8 p-8 md:p-12 bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/40">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                            <Info size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 uppercase">Event Logistics</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Basic information and branding</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2 space-y-4">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Marathon Poster / Banner</label>
                            <div className="relative group">
                                {postEvent.image_url ? (
                                    <div className="relative w-full h-48 rounded-[2.5rem] overflow-hidden border-2 border-blue-100 shadow-lg">
                                        <img src={postEvent.image_url} className="w-full h-full object-cover" alt="Poster Preview" />
                                        <button 
                                            onClick={() => updateField('image_url', '')}
                                            className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur shadow-xl rounded-xl text-red-500 hover:scale-110 transition-all"
                                        >
                                            <Trash size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-200 cursor-pointer transition-all group">
                                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-400 group-hover:text-blue-500 shadow-sm mb-3 transition-colors">
                                            <Camera size={24} />
                                        </div>
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-blue-600 transition-colors">Upload Event Poster</span>
                                        <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold">16:9 Aspect Ratio recommended</p>
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = (ev) => updateField('image_url', ev.target.result);
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                    </label>
                                )}
                            </div>
                        </div>

                        {renderInput("Event Title", "title", "text", "e.g. Monsoon Marathon 2024")}
                        <div className="grid grid-cols-2 gap-4">
                            {renderInput("Start Date", "startDate", "date")}
                            {renderInput("Start Time", "startTime", "time")}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {renderInput("End Date", "endDate", "date")}
                            {renderInput("End Time", "endTime", "time")}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {renderInput("Event Expiry Date", "expiryDate", "date")}
                            <div />
                        </div>
                        <div className="md:col-span-2 space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Venue & Location</label>
                                <button 
                                    onClick={() => setShowLocationModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100 group"
                                >
                                    <Search size={12} className="group-hover:scale-125 transition-transform" />
                                    Search Global Location
                                </button>
                            </div>
                            
                            <LocationSelectionModal 
                                isOpen={showLocationModal}
                                onClose={() => setShowLocationModal(false)}
                                selectedCity={postEvent.city}
                                updateCity={(cityName, details) => {
                                    if (details) {
                                        setPostEvent(prev => ({
                                            ...prev,
                                            city: details.city || cityName,
                                            address: details.address || details.fullAddress || prev.address,
                                            state: details.state || prev.state,
                                            country: details.country || prev.country,
                                            zipCode: details.pincode || details.zipCode || prev.zipCode,
                                            latitude: details.lat || prev.latitude,
                                            longitude: details.lng || prev.longitude
                                        }));
                                    }
                                }}
                            />
                            
                            {renderInput("Venue Full Address", "address", "text", "Full searchable address")}
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 pl-1">Description</label>
                            <textarea 
                                value={postEvent.description || ""} 
                                onChange={(e) => updateField("description", e.target.value)} 
                                rows={6} 
                                className="w-full bg-slate-50 border border-slate-100 text-slate-900 text-sm font-semibold px-6 py-4 rounded-[2rem] focus:outline-none shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="pt-8 flex justify-between">
                        <button onClick={() => setCurrentStep(1)} className="px-8 py-3.5 text-slate-400 hover:text-slate-900 font-bold uppercase tracking-widest text-[10px] transition-colors flex items-center gap-2">
                            <ArrowLeft size={14} /> Back
                        </button>
                        <button 
                            onClick={() => setCurrentStep(3)} 
                            className="px-10 py-3.5 bg-blue-500 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-blue-500/20 hover:bg-blue-600 transition-all"
                        >
                            Continue <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Pricing & Review */}
            {currentStep === 3 && (
                <div className="space-y-8 p-8 md:p-12 bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/40">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                            <DollarSign size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 uppercase">Ticketing & Capacity</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unified Pricing and participant limits</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            {/* 💰 Event-Specific Fee Overrides */}
                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                            <Shield size={16} />
                                        </div>
                                        <div>
                                            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Admin Controls</h3>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Exclusive & Featured Options</p>
                                        </div>
                                    </div>
                                    {!isAdmin && <div className="px-3 py-1 bg-slate-100 rounded-lg text-[8px] font-bold text-slate-400 uppercase">Admin Only</div>}
                                </div>

                                {isAdmin && (
                                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200/50">
                                        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <Sparkles size={14} className="text-amber-500" />
                                                <span className="text-[10px] font-bold uppercase text-slate-700">Exclusive</span>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer scale-75">
                                                <input 
                                                    type="checkbox" 
                                                    className="sr-only peer"
                                                    checked={postEvent.is_exclusive || false}
                                                    onChange={e => updateField('is_exclusive', e.target.checked)}
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                                            </label>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <Zap size={14} className="text-blue-500" />
                                                <span className="text-[10px] font-bold uppercase text-slate-700">Spotlight</span>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer scale-75">
                                                <input 
                                                    type="checkbox" 
                                                    className="sr-only peer"
                                                    checked={postEvent.is_spotlight || false}
                                                    onChange={e => updateField('is_spotlight', e.target.checked)}
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                                            </label>
                                        </div>
                                    </div>
                                )}

                            {/* Advanced Marathon Category Manager */}
                            <div className="p-8 bg-slate-900 rounded-[3rem] space-y-8 shadow-2xl shadow-slate-300">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                                                <TrendingUp size={16} />
                                            </div>
                                            <h4 className="text-[11px] font-bold text-white uppercase tracking-widest">Marathon Pricing Logic</h4>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                const newCats = [...(postEvent.marathonCategories || [])];
                                                newCats.push({ id: Date.now(), title: "New Category", distance_km: 5, min_age: 18, max_age: 60, price: 499, slots: 100 });
                                                updateField("marathonCategories", newCats);
                                            }}
                                            className="px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all"
                                        >
                                            + Add Category
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {(postEvent.marathonCategories || []).map((cat, idx) => (
                                            <div key={cat.id} className="bg-white/5 backdrop-blur-sm p-6 rounded-[2rem] border border-white/10 space-y-6 group hover:border-blue-500/50 transition-all">
                                                <div className="flex items-center justify-between">
                                                    <input 
                                                        className="bg-transparent border-none text-sm font-black text-white placeholder:text-white/20 focus:ring-0 p-0 w-2/3"
                                                        placeholder="Category Title (e.g. 5KM Adults)"
                                                        value={cat.title}
                                                        onChange={e => {
                                                            const next = [...postEvent.marathonCategories];
                                                            next[idx].title = e.target.value;
                                                            updateField("marathonCategories", next);
                                                        }}
                                                    />
                                                    <button 
                                                        onClick={() => {
                                                            const next = postEvent.marathonCategories.filter((_, i) => i !== idx);
                                                            updateField("marathonCategories", next);
                                                        }}
                                                        className="p-2 text-white/20 hover:text-rose-500 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Distance (KM)</label>
                                                        <input 
                                                            type="number"
                                                            className="w-full bg-white/10 border-none text-white text-xs font-bold p-3 rounded-xl focus:ring-1 focus:ring-blue-500/50"
                                                            value={cat.distance_km}
                                                            onChange={e => {
                                                                const next = [...postEvent.marathonCategories];
                                                                next[idx].distance_km = parseFloat(e.target.value) || 0;
                                                                updateField("marathonCategories", next);
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[8px] font-black text-purple-400 uppercase tracking-widest">Age Range</label>
                                                        <div className="flex items-center gap-1">
                                                            <input 
                                                                type="number"
                                                                className="w-full bg-white/10 border-none text-white text-xs font-bold p-3 rounded-xl focus:ring-1 focus:ring-purple-500/50"
                                                                placeholder="Min"
                                                                value={cat.min_age}
                                                                onChange={e => {
                                                                    const next = [...postEvent.marathonCategories];
                                                                    next[idx].min_age = parseInt(e.target.value) || 0;
                                                                    updateField("marathonCategories", next);
                                                                }}
                                                            />
                                                            <input 
                                                                type="number"
                                                                className="w-full bg-white/10 border-none text-white text-xs font-bold p-3 rounded-xl focus:ring-1 focus:ring-purple-500/50"
                                                                placeholder="Max"
                                                                value={cat.max_age}
                                                                onChange={e => {
                                                                    const next = [...postEvent.marathonCategories];
                                                                    next[idx].max_age = parseInt(e.target.value) || 0;
                                                                    updateField("marathonCategories", next);
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Price (₹)</label>
                                                        <input 
                                                            type="number"
                                                            className="w-full bg-white/10 border-none text-white text-xs font-bold p-3 rounded-xl focus:ring-1 focus:ring-emerald-500/50"
                                                            value={cat.price}
                                                            onChange={e => {
                                                                const next = [...postEvent.marathonCategories];
                                                                next[idx].price = parseFloat(e.target.value) || 0;
                                                                updateField("marathonCategories", next);
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[8px] font-black text-amber-400 uppercase tracking-widest">Slots</label>
                                                        <input 
                                                            type="number"
                                                            className="w-full bg-white/10 border-none text-white text-xs font-bold p-3 rounded-xl focus:ring-1 focus:ring-amber-500/50"
                                                            value={cat.slots}
                                                            onChange={e => {
                                                                const next = [...postEvent.marathonCategories];
                                                                next[idx].slots = parseInt(e.target.value) || 0;
                                                                updateField("marathonCategories", next);
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {(postEvent.marathonCategories || []).length === 0 && (
                                            <div className="text-center py-10 border-2 border-dashed border-white/5 rounded-[2rem]">
                                                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic">No categories added. Click "+ Add Category" to start.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {renderInput("Total Participant Capacity", "totalTickets", "number", "e.g. 500")}
                        </div>

                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Quick Review</h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                    <span className="text-xs text-slate-400">Event Type</span>
                                    <span className="text-sm font-bold uppercase">{postEvent.sportType}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                    <span className="text-xs text-slate-400">Categories</span>
                                    <span className="text-sm font-bold">{(postEvent.marathonCategories || []).length} Tiers</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-400">Starting From</span>
                                    <span className="text-xl font-bold">
                                        ₹{Math.min(...(postEvent.marathonCategories || [{price: 0}]).map(c => c.price))}
                                    </span>
                                </div>
                            </div>
                            <div className="pt-4 flex items-center gap-3 text-emerald-400">
                                <CheckCircle2 size={16} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Ready to Publish</span>
                            </div>
                        </div>
                    </div>
                </div>

                    <div className="pt-12 flex justify-between">
                        <button onClick={() => setCurrentStep(2)} className="px-8 py-3.5 text-slate-400 hover:text-slate-900 font-bold uppercase tracking-widest text-[10px] transition-colors flex items-center gap-2">
                            <ArrowLeft size={14} /> Back
                        </button>
                        <button 
                            onClick={onPublish} 
                            className="px-12 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-2xl shadow-blue-500/40 hover:scale-105 transition-all"
                        >
                            {isEditing ? "Update Changes" : "Publish Event Now"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SportsEventForm;
