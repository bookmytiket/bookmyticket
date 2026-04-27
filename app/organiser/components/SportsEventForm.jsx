"use client";
import React, { useState } from "react";
import { 
    Trophy, Activity, Goal, Users, ArrowLeft, ArrowRight, Settings, 
    Calendar, Clock, MapPin, DollarSign, Shield, CheckCircle2,
    ChevronRight, Info, HeartPulse, GraduationCap, Briefcase, Timer, Target
} from "lucide-react";
import CalendarPicker from "./CalendarPicker";
import TimePicker from "./TimePicker";

const SportsEventForm = ({ postEvent, setPostEvent, onCancel, onPublish, isEditing }) => {
    const [currentStep, setCurrentStep] = useState(1);
    
    const steps = [
        { id: 1, title: "Sport Specifics", icon: Settings },
        { id: 2, title: "Event Details", icon: Info },
        { id: 3, title: "Pricing & Review", icon: DollarSign }
    ];

    const sportType = postEvent.sportType?.toLowerCase();

    const updateField = (field, value) => {
        setPostEvent(prev => ({ ...prev, [field]: value }));
    };

    const renderInput = (label, field, type = "text", placeholder = "", required = true) => (
        <div className="space-y-2">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {type === "date" ? (
                <CalendarPicker 
                    value={postEvent[field] || ""} 
                    onChange={(val) => updateField(field, val)}
                    placeholder={placeholder || "Select Date"}
                />
            ) : type === "time" ? (
                <TimePicker 
                    value={postEvent[field] || ""} 
                    onChange={(val) => updateField(field, val)}
                    placeholder={placeholder || "Select Time"}
                />
            ) : (
                <input
                    type={type}
                    value={postEvent[field] || ""}
                    onChange={(e) => updateField(field, e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-slate-50 border border-slate-100 text-slate-900 text-sm font-semibold px-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all shadow-inner"
                />
            )}
        </div>
    );

    const renderToggle = (label, field, Icon) => (
        <label className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:border-blue-200 transition-all group">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors shadow-sm">
                    {Icon && <Icon size={16} />}
                </div>
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">{label}</span>
            </div>
            <div className="relative">
                <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={!!postEvent[field]} 
                    onChange={(e) => updateField(field, e.target.checked)} 
                />
                <div className={`w-10 h-5 rounded-full transition-colors ${postEvent[field] ? 'bg-blue-500' : 'bg-slate-200'}`}>
                    <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${postEvent[field] ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
            </div>
        </label>
    );

    const renderMultiSelect = (label, field, options) => (
        <div className="space-y-3">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">{label}</label>
            <div className="flex flex-wrap gap-2">
                {options.map(opt => {
                    const isSelected = (postEvent[field] || []).includes(opt);
                    return (
                        <button
                            key={opt}
                            type="button"
                            onClick={() => {
                                const current = postEvent[field] || [];
                                updateField(field, isSelected ? current.filter(i => i !== opt) : [...current, opt]);
                            }}
                            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                                isSelected 
                                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                                : 'bg-white text-slate-500 border border-slate-100 hover:border-blue-200'
                            }`}
                        >
                            {opt}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Stepper Header */}
            <div className="flex items-center justify-between mb-12 px-4">
                {steps.map((s, idx) => (
                    <React.Fragment key={s.id}>
                        <div className="flex flex-col items-center gap-3">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                                currentStep >= s.id ? 'bg-blue-500 text-white shadow-xl shadow-blue-500/20' : 'bg-slate-100 text-slate-400'
                            }`}>
                                <s.icon size={20} />
                            </div>
                            <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${currentStep >= s.id ? 'text-blue-500' : 'text-slate-400'}`}>
                                {s.title}
                            </span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={`flex-1 h-0.5 max-w-[60px] mx-4 transition-colors duration-500 ${currentStep > s.id ? 'bg-blue-500' : 'bg-slate-100'}`} />
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
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tailor the fields for your {postEvent.sportType}</p>
                        </div>
                    </div>

                    {sportType === "marathon" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            {renderMultiSelect("Distance Categories", "distanceOptions", ["2K", "5K", "10K", "Half Marathon", "Full Marathon"])}
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
                        </div>
                    )}

                    {sportType === "tournament" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {renderInput("Number of Teams", "teamsCount", "number", "e.g. 16")}
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Match Type</label>
                                    <select 
                                        value={postEvent.matchType || ""} 
                                        onChange={(e) => updateField("matchType", e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 text-slate-900 text-sm font-semibold px-4 py-3.5 rounded-2xl focus:outline-none"
                                    >
                                        <option value="">Select Type</option>
                                        <option value="Knockout">Knockout</option>
                                        <option value="League">League</option>
                                        <option value="Hybrid">Hybrid</option>
                                    </select>
                                </div>
                            </div>
                            {renderInput("Venue / Ground Selection", "venueDetails", "text", "e.g. Central Park Ground No. 2")}
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Rules (Rich Content)</label>
                                <textarea 
                                    value={postEvent.rules || ""} 
                                    onChange={(e) => updateField("rules", e.target.value)} 
                                    rows={4} 
                                    placeholder="Outline the match rules..."
                                    className="w-full bg-slate-50 border border-slate-100 text-slate-900 text-sm font-semibold px-6 py-4 rounded-[1.5rem] focus:outline-none shadow-inner"
                                />
                            </div>
                        </div>
                    )}

                    {sportType === "coaching" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-6">
                                <div className="flex items-center gap-3">
                                    <Target className="text-blue-500" size={18} />
                                    <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">Trainer Information</h4>
                                </div>
                                {renderInput("Trainer Name", "trainerName", "text", "e.g. Coach Rahul")}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {renderInput("Experience", "trainerExperience", "text", "e.g. 10 Years")}
                                    {renderInput("Certification", "trainerCertification", "text", "e.g. AFC A-License")}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {renderInput("Max Participants", "capacity", "number", "e.g. 20")}
                                {renderInput("Duration", "duration", "text", "e.g. 1 hr / 2 hr")}
                            </div>
                            {renderInput("Session Fees (Per Session)", "sessionPrice", "number", "e.g. 500")}
                        </div>
                    )}

                    <div className="pt-8 flex justify-between">
                        <button onClick={onCancel} className="px-8 py-3.5 text-slate-400 hover:text-slate-900 font-bold uppercase tracking-widest text-[10px] transition-colors">Cancel</button>
                        <button 
                            onClick={() => setCurrentStep(2)} 
                            className="px-10 py-3.5 bg-blue-500 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-blue-500/20 hover:bg-blue-600 transition-all"
                        >
                            Next Step <ChevronRight size={14} />
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
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Basic information about the event</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {renderInput("Event Title", "title", "text", "e.g. Monsoon Marathon 2024")}
                        <div className="grid grid-cols-2 gap-4">
                            {renderInput("Start Date", "startDate", "date")}
                            {renderInput("Start Time", "startTime", "time")}
                        </div>
                        <div className="md:col-span-2">
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
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Set your prices and participant limits</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">Base Ticket Price</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                    <input 
                                        type="number" 
                                        value={postEvent.price || ""} 
                                        onChange={(e) => updateField("price", e.target.value)}
                                        className="w-full bg-white border border-slate-100 text-slate-900 text-2xl font-bold pl-10 pr-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                                        placeholder="0.00"
                                    />
                                </div>
                                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase cursor-pointer">
                                    <input type="checkbox" checked={postEvent.price === "0"} onChange={(e) => updateField("price", e.target.checked ? "0" : "")} /> This is a free event
                                </label>
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
                                    <span className="text-xs text-slate-400">Date</span>
                                    <span className="text-sm font-bold">{postEvent.startDate || "TBA"}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-400">Price</span>
                                    <span className="text-xl font-bold">₹{postEvent.price || "0"}</span>
                                </div>
                            </div>
                            <div className="pt-4 flex items-center gap-3 text-emerald-400">
                                <CheckCircle2 size={16} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Ready to Publish</span>
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
                            Publish Event Now
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SportsEventForm;
