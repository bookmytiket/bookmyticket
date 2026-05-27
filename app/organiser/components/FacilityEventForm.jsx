"use strict";
"use client";
import React, { useState, useEffect } from "react";
import { 
    MapPin, Calendar, CheckCircle2, ArrowRight, ArrowLeft, 
    Plus, Trash, Camera, Activity, Clock
} from "lucide-react";
import CalendarPicker from "./CalendarPicker";
import CustomSelect from "./CustomSelect";
import CustomTimePicker from "./CustomTimePicker";
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
        ) : (
            <input 
                type={type}
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-100 text-slate-900 text-sm font-bold px-6 py-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-200 transition-all placeholder:text-slate-400"
                placeholder={placeholder}
            />
        )}
    </div>
);

const FacilityEventForm = ({ postEvent, setPostEvent, onCancel, onPublish, isEditing }) => {
    const { showToast } = useToast();
    const [currentStep, setCurrentStep] = useState(1);
    
    // Config State mimicking the new DB schema for Facility / Karting
    const [config, setConfig] = useState(() => {
        const base = postEvent.dynamic_config || {};
        return {
            ...base,
            facility_type: base.facility_type || "Karting Track",
            location: {
                venueName: "", address: "", city: "", pincode: "",
                ...(base.location || {})
            },
            schedule: base.schedule || {
                openDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                openTime: "10:00",
                closeTime: "22:00",
                slotDurationMinutes: 15
            },
            packages: base.packages || [
                { id: Date.now(), group: "5 MINUTE SESSIONS", name: "Level 1", price: 600, isWeekendMode: false },
                { id: Date.now()+1, group: "5 MINUTE SESSIONS", name: "Level 2", price: 900, isWeekendMode: false },
                { id: Date.now()+2, group: "5 MINUTE SESSIONS", name: "PRO Kart", price: 900, isWeekendMode: false },
                { id: Date.now()+3, group: "5 MINUTE SESSIONS", name: "Kids Kart", price: 600, isWeekendMode: false },
                { id: Date.now()+4, group: "5 MINUTE SESSIONS", name: "Twin Seater", price: 1000, isWeekendMode: false },
                { id: Date.now()+5, group: "5 MINUTE SESSIONS", name: "ROTAX (33 bhp)", price: 1800, isWeekendMode: false },
                { id: Date.now()+6, group: "10 MINUTE SESSIONS", name: "Level 1", price: 900, isWeekendMode: false },
                { id: Date.now()+7, group: "10 MINUTE SESSIONS", name: "Level 2", price: 1300, isWeekendMode: false },
                { id: Date.now()+8, group: "10 MINUTE SESSIONS", name: "PRO Kart", price: 1300, isWeekendMode: false },
                { id: Date.now()+9, group: "10 MINUTE SESSIONS", name: "Kids Kart", price: 900, isWeekendMode: false },
                { id: Date.now()+10, group: "10 MINUTE SESSIONS", name: "Twin Seater", price: 1400, isWeekendMode: false },
                { id: Date.now()+11, group: "10 MINUTE SESSIONS", name: "ROTAX (33 bhp)", price: 2500, isWeekendMode: false },
            ]
        };
    });

    useEffect(() => {
        setPostEvent(prev => ({ 
            ...prev, 
            dynamic_config: config,
            type: "Facility",
            sportName: config.facility_type,
            city: config.location?.city || prev.city,
            venue: config.location?.venueName || prev.venue,
        }));
    }, [config]);

    const steps = [
        { id: 1, title: "Facility Info", icon: Activity },
        { id: 2, title: "Schedule", icon: Clock },
        { id: 3, title: "Tariff & Packages", icon: Calendar },
        { id: 4, title: "Publish", icon: CheckCircle2 }
    ];

    const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    return (
        <div className="max-w-5xl mx-auto py-8">
            <div className="flex items-center justify-between mb-12 px-6 overflow-x-auto pb-4 scrollbar-hide">
                {steps.map((s, idx) => (
                    <React.Fragment key={s.id}>
                        <div className="flex flex-col items-center gap-3 shrink-0">
                            <div className={`w-14 h-14 rounded-[2rem] flex items-center justify-center transition-all border-2 ${
                                currentStep >= s.id ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-200' : 'bg-white border-slate-100 text-slate-800'
                            }`}>
                                <s.icon size={22} />
                            </div>
                            <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${currentStep >= s.id ? 'text-blue-600' : 'text-slate-800'}`}>
                                {s.title}
                            </span>
                        </div>
                        {idx < steps.length - 1 && <div className={`w-12 h-0.5 mx-2 ${currentStep > s.id ? 'bg-blue-600' : 'bg-slate-100'}`} />}
                    </React.Fragment>
                ))}
            </div>

            {currentStep === 1 && (
                <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] border border-slate-100 shadow-2xl p-5 md:p-14 space-y-8 md:space-y-10">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <Activity size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Facility Details</h2>
                            <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Setup your Attraction / Turf / Karting</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2 space-y-4">
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest pl-1">Facility Banner Image*</label>
                            <div className="relative group h-40 rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden hover:border-blue-300 transition-all flex items-center justify-center">
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
                        <div className="md:col-span-2">
                            {renderInput("Facility Name*", postEvent.title, (v) => setPostEvent(p => ({ ...p, title: v })), "text", "e.g. CoASTT KARTMANIA")}
                        </div>
                        
                        {renderInput("Venue / Location Name*", config.location.venueName, (v) => setConfig({ ...config, location: { ...config.location, venueName: v } }), "text", "e.g. SF 763, Karumathampatti", true)}
                        {renderInput("City*", config.location.city, (v) => setConfig({ ...config, location: { ...config.location, city: v } }), "text", "e.g. Coimbatore")}
                        {renderInput("Pincode*", config.location.pincode, (v) => setConfig({ ...config, location: { ...config.location, pincode: v } }), "text", "")}
                    </div>

                    <div className="pt-10 flex justify-end">
                        <button onClick={() => setCurrentStep(2)} className="px-12 py-4 bg-slate-900 text-white rounded-[2rem] text-xs font-bold uppercase tracking-widest flex items-center gap-3">Next: Schedule <ArrowRight size={18} /></button>
                    </div>
                </div>
            )}

            {currentStep === 2 && (
                <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] border border-slate-100 shadow-2xl p-5 md:p-14 space-y-8 md:space-y-10">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <Clock size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Operating Schedule</h2>
                            <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Define working days & hours to generate time slots</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Operating Days</label>
                            <div className="flex flex-wrap gap-3">
                                {DAYS.map(day => {
                                    const isActive = config.schedule.openDays.includes(day);
                                    return (
                                        <button 
                                            key={day}
                                            onClick={() => {
                                                const newDays = isActive 
                                                    ? config.schedule.openDays.filter(d => d !== day)
                                                    : [...config.schedule.openDays, day];
                                                setConfig({ ...config, schedule: { ...config.schedule, openDays: newDays } });
                                            }}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                                isActive ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-blue-300'
                                            }`}
                                        >
                                            {day}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <CustomTimePicker 
                                    label="Opening Time"
                                    value={config.schedule.openTime}
                                    onChange={(v) => setConfig({ ...config, schedule: { ...config.schedule, openTime: v } })}
                                />
                            </div>
                            <div className="space-y-3">
                                <CustomTimePicker 
                                    label="Closing Time"
                                    value={config.schedule.closeTime}
                                    onChange={(v) => setConfig({ ...config, schedule: { ...config.schedule, closeTime: v } })}
                                />
                            </div>
                            <div className="space-y-3 md:col-span-2">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Booking Slot Interval (Minutes)</label>
                                <input 
                                    type="number" 
                                    value={config.schedule.slotDurationMinutes}
                                    onChange={(e) => setConfig({ ...config, schedule: { ...config.schedule, slotDurationMinutes: parseInt(e.target.value)||15 } })}
                                    className="w-full bg-slate-50 border border-slate-100 text-slate-900 text-sm font-bold px-6 py-4 rounded-2xl"
                                    placeholder="e.g. 15 or 30"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 flex justify-between">
                        <button onClick={() => setCurrentStep(1)} className="px-10 py-4 text-slate-800 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2"><ArrowLeft size={16} /> Back</button>
                        <button onClick={() => setCurrentStep(3)} className="px-12 py-4 bg-slate-900 text-white rounded-[2rem] text-xs font-bold uppercase tracking-widest flex items-center gap-3">Next: Tariffs <ArrowRight size={18} /></button>
                    </div>
                </div>
            )}

            {currentStep === 3 && (
                <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] border border-slate-100 shadow-2xl p-5 md:p-14 space-y-8">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <Calendar size={24} />
                        </div>
                        <div className="flex-1 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Tariff & Packages</h2>
                                <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Pricing for sessions, e.g. 5 Min Sessions</p>
                            </div>
                            <button 
                                onClick={() => {
                                    setConfig({ ...config, packages: [...config.packages, { id: Date.now(), group: "NEW GROUP", name: "New Package", price: 0, isWeekendMode: false }] });
                                }}
                                className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {config.packages.map((pkg, idx) => (
                            <div key={pkg.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-center group relative">
                                <button 
                                    onClick={() => {
                                        const np = [...config.packages]; np.splice(idx, 1); setConfig({ ...config, packages: np });
                                    }}
                                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-50 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-red-100"
                                >
                                    <Trash size={14} />
                                </button>
                                <div className="md:col-span-4">
                                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Group / Category</label>
                                    <input className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400" value={pkg.group} placeholder="e.g. 5 MINUTE SESSIONS" onChange={e => { const np = [...config.packages]; np[idx].group = e.target.value.toUpperCase(); setConfig({ ...config, packages: np }); }} />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Package Name</label>
                                    <input className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400" value={pkg.name} placeholder="e.g. Level 1" onChange={e => { const np = [...config.packages]; np[idx].name = e.target.value; setConfig({ ...config, packages: np }); }} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Type</label>
                                    <CustomSelect 
                                        value={pkg.isWeekendMode ? "Weekend Only" : "Standard"}
                                        options={["Standard", "Weekend Only"]}
                                        onChange={v => { const np = [...config.packages]; np[idx].isWeekendMode = v === "Weekend Only"; setConfig({ ...config, packages: np }); }}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="text-[10px] font-bold text-blue-600 uppercase block mb-1">Price (₹)</label>
                                    <input type="number" className="w-full bg-blue-50 border border-blue-100 p-3 rounded-xl text-sm font-black text-blue-600" value={pkg.price} onChange={e => { const np = [...config.packages]; np[idx].price = parseInt(e.target.value)||0; setConfig({ ...config, packages: np }); }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-10 flex justify-between">
                        <button onClick={() => setCurrentStep(2)} className="px-10 py-4 text-slate-800 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2"><ArrowLeft size={16} /> Back</button>
                        <button onClick={() => setCurrentStep(4)} className="px-12 py-4 bg-slate-900 text-white rounded-[2rem] text-xs font-bold uppercase tracking-widest flex items-center gap-3">Next: Review <ArrowRight size={18} /></button>
                    </div>
                </div>
            )}

            {currentStep === 4 && (
                <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] border border-slate-100 shadow-2xl p-5 md:p-14 space-y-8">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Ready to Publish</h2>
                            <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Review your Facility Configuration</p>
                        </div>
                    </div>

                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
                        <div>
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">{postEvent.title || "Untitled Facility"}</h3>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">{config.facility_type} • {config.location.city || "No Venue"}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-200">
                            <div>
                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Schedule</h4>
                                <p className="text-xs font-bold text-slate-700">{config.schedule.openTime} to {config.schedule.closeTime}</p>
                                <p className="text-[10px] font-bold text-slate-500 mt-1">{config.schedule.openDays.join(", ")}</p>
                            </div>
                            <div>
                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Packages ({config.packages.length})</h4>
                                <div className="flex flex-wrap gap-2">
                                    {config.packages.slice(0, 3).map(p => (
                                        <span key={p.id} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-bold text-slate-700">{p.name}</span>
                                    ))}
                                    {config.packages.length > 3 && <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-bold text-slate-700">+{config.packages.length - 3} more</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 flex justify-between">
                        <button onClick={() => setCurrentStep(3)} className="px-10 py-4 text-slate-800 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2"><ArrowLeft size={16} /> Back</button>
                        <div className="flex gap-4">
                            <button onClick={onCancel} className="px-10 py-4 bg-slate-100 text-slate-900 rounded-[2rem] text-xs font-bold uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                            <button onClick={onPublish} className="px-12 py-4 bg-blue-600 text-white rounded-[2rem] text-xs font-bold uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center gap-3">
                                {isEditing ? "Update Facility" : "Publish to Platform"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacilityEventForm;
