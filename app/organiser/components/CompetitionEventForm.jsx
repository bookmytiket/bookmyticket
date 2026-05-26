"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from '@/components/AuthContext';
import { 
    Trophy, Users, Activity, MapPin, DollarSign, Calendar, Clock, 
    ShieldCheck, ArrowRight, ArrowLeft, Plus, Trash2, Camera, FileText
} from "lucide-react";
import CalendarPicker from "./CalendarPicker";
import TimePicker from "./TimePicker";
import CustomSelect from "./CustomSelect";
import { useToast } from "@/context/ToastContext";
import GoogleInlineMap from "./GoogleInlineMap";
import { COUNTRIES } from "@/app/data/locationData";
import { State, City } from 'country-state-city';
import { geocode, reverseGeocode } from "@/lib/googleMaps";
import { INDIAN_STATES, getIndianDistricts, getIndianCities } from "@/app/data/indianLocations";
import { supabase } from "@/lib/supabase";

const renderInput = (label, value, onChange, type = "text", placeholder = "") => (
    <div className="space-y-2">
        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest pl-1">{label}</label>
        {type === "date" ? (
            <CalendarPicker value={value || ""} onChange={onChange} placeholder={placeholder || "dd/mm/yyyy"} />
        ) : type === "time" ? (
            <TimePicker value={value || ""} onChange={onChange} placeholder={placeholder || "--:--"} />
        ) : (
            <input 
                type={type} value={value || ""} onChange={(e) => onChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                placeholder={placeholder}
            />
        )}
    </div>
);

const CompetitionEventForm = ({ postEvent, setPostEvent, onCancel, onPublish, isEditing }) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [currentStep, setCurrentStep] = useState(1);
    
    const [dbDistricts, setDbDistricts] = useState([]);
    const [dbCities, setDbCities] = useState([]);
    const [distLoading, setDistLoading] = useState(false);
    const [cityLoading, setCityLoading] = useState(false);
    const [competitionTypes, setCompetitionTypes] = useState([]);
    const [typesLoading, setTypesLoading] = useState(true);

    useEffect(() => {
        const fetchCompetitionTypes = async () => {
            setTypesLoading(true);
            try {
                const { data, error } = await supabase.from('competition_types').select('name').order('name');
                if (error) throw error;
                if (data && data.length > 0) {
                    setCompetitionTypes(data.map(d => ({ label: d.name, value: d.name })));
                } else {
                    throw new Error("Empty or missing table");
                }
            } catch (err) {
                console.log("Using fallback competition types, table might not be migrated yet.");
                setCompetitionTypes([
                    { label: "Swimming Competition", value: "Swimming Competition" },
                    { label: "Marathon", value: "Marathon" },
                    { label: "Cycling Race", value: "Cycling Race" },
                    { label: "Athletics Meet", value: "Athletics Meet" },
                    { label: "Cricket Tournament", value: "Cricket Tournament" },
                    { label: "Football Tournament", value: "Football Tournament" },
                    { label: "Badminton Championship", value: "Badminton Championship" },
                    { label: "Chess Tournament", value: "Chess Tournament" },
                    { label: "Dance Competition", value: "Dance Competition" },
                    { label: "Talent Show", value: "Talent Show" },
                    { label: "School Sports Meet", value: "School Sports Meet" },
                    { label: "College Championship", value: "College Championship" },
                    { label: "Kids Competition", value: "Kids Competition" },
                    { label: "Open Championship", value: "Open Championship" },
                    { label: "State/National Competition", value: "State/National Competition" },
                    { label: "Other", value: "Other" }
                ]);
            } finally {
                setTypesLoading(false);
            }
        };
        fetchCompetitionTypes();
    }, []);

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

    const updateConfig = (key, value) => {
        setPostEvent(prev => ({
            ...prev,
            dynamic_config: {
                ...prev.dynamic_config,
                [key]: typeof value === 'function' ? value(prev.dynamic_config?.[key]) : value
            }
        }));
    };

    const config = postEvent.dynamic_config || {
        registrationMode: 'Individual', // Individual, Relay, Both
        competitionCategories: [
            { id: 1, name: "U-15", minAge: 13, maxAge: 15, gender: "All", isCustom: false }
        ],
        competitionEvents: [
            { id: 1, name: "50M Freestyle", distance: "50M", fee: 249, gender: "All" }
        ],
        documents: [
            { type: "Aadhaar Card", mandatory: true },
            { type: "Birth Certificate", mandatory: true }
        ],
        rules: "1. Referee decision is final.\n2. No protests allowed."
    };

    const steps = [
        { id: 1, title: "Basic Details", icon: FileText },
        { id: 2, title: "Venue", icon: MapPin },
        { id: 3, title: "Date & Time", icon: Calendar },
        { id: 4, title: "Categories & Events", icon: Trophy },
        { id: 5, title: "Rules & Publish", icon: ShieldCheck }
    ];

    return (
        <div className="max-w-5xl mx-auto py-8">
            <div className="flex items-center justify-between mb-12 px-6 overflow-x-auto pb-4 scrollbar-hide">
                {steps.map((s, idx) => (
                    <React.Fragment key={s.id}>
                        <div className="flex flex-col items-center gap-3 shrink-0">
                            <div className={`w-14 h-14 rounded-[2rem] flex items-center justify-center transition-all border-2 ${
                                currentStep >= s.id ? 'bg-[#ec4899] border-[#ec4899] text-white' : 'bg-white border-slate-100 text-slate-800'
                            }`}>
                                <s.icon size={22} />
                            </div>
                            <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${currentStep >= s.id ? 'text-[#ec4899]' : 'text-slate-800'}`}>
                                {s.title}
                            </span>
                        </div>
                        {idx < steps.length - 1 && <div className={`w-12 h-0.5 mx-2 ${currentStep > s.id ? 'bg-[#ec4899]' : 'bg-slate-100'}`} />}
                    </React.Fragment>
                ))}
            </div>

            {currentStep === 1 && (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl p-5 md:p-14 space-y-8">
                    <h2 className="text-2xl font-black text-slate-900 uppercase">Event Basic Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2">
                            <CustomSelect 
                                label="Competition Type"
                                value={config.competitionType || ""}
                                onChange={v => updateConfig('competitionType', v)}
                                options={competitionTypes}
                                isLoading={typesLoading}
                                placeholder="Select Competition Type..."
                            />
                        </div>
                        <div className="md:col-span-2">
                            {renderInput("Event Title", postEvent.title, (v) => setPostEvent(p => ({ ...p, title: v })), "text", "e.g., State Level Swimming Competition")}
                        </div>
                        <div className="md:col-span-2">
                            {renderInput("Subtitle", config.subtitle, (v) => updateConfig('subtitle', v), "text", "e.g., Open to all schools")}
                        </div>
                        <div className="md:col-span-2 space-y-4">
                            <label className="block text-[11px] font-bold text-slate-700 uppercase">Event Poster / Banner</label>
                            {postEvent.image_url ? (
                                <div className="relative h-40 rounded-2xl overflow-hidden border">
                                    <img src={postEvent.image_url} className="w-full h-full object-cover" />
                                    <button onClick={() => setPostEvent(p => ({ ...p, image_url: "" }))} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg"><Trash2 size={16} /></button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-pink-300 rounded-2xl cursor-pointer bg-pink-50">
                                    <Camera size={24} className="text-pink-500 mb-2" />
                                    <span className="text-[10px] font-bold text-pink-600 uppercase">Upload Poster</span>
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
                        {renderInput("Organizer Name", config.organiser_name, (v) => updateConfig('organiser_name', v))}
                        {renderInput("Contact Email", config.supportEmail, (v) => updateConfig('supportEmail', v))}
                    </div>
                    <div className="pt-10 flex justify-end">
                        <button onClick={() => setCurrentStep(2)} className="px-12 py-4 bg-slate-900 text-white rounded-full text-xs font-bold uppercase flex items-center gap-2">Next <ArrowRight size={16} /></button>
                    </div>
                </div>
            )}

            {currentStep === 2 && (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl p-5 md:p-14 space-y-8">
                    <h2 className="text-2xl font-black text-slate-900 uppercase">Venue Configuration</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2">
                            {renderInput("Venue Name", postEvent.venue, (v) => setPostEvent(p => ({ ...p, venue: v })))}
                        </div>
                        <div className="md:col-span-2">
                            {renderInput("Address", postEvent.address, (v) => setPostEvent(p => ({ ...p, address: v })))}
                        </div>
                        
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

                        <div className="space-y-2">
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest pl-1">Pincode</label>
                            <input 
                                type="text"
                                value={postEvent.zipCode || ""}
                                onChange={(e) => setPostEvent(prev => ({ ...prev, zipCode: e.target.value }))}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                                placeholder="Enter Pincode"
                            />
                        </div>

                        <div className="md:col-span-2 h-[350px] rounded-[2rem] overflow-hidden border border-slate-100 shadow-2xl relative">
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
                        <button onClick={() => setCurrentStep(1)} className="px-10 py-4 text-slate-800 font-bold uppercase text-[10px] flex items-center gap-2"><ArrowLeft size={16} /> Back</button>
                        <button onClick={() => setCurrentStep(3)} className="px-12 py-4 bg-slate-900 text-white rounded-full text-xs font-bold uppercase flex items-center gap-2">Next <ArrowRight size={16} /></button>
                    </div>
                </div>
            )}

            {currentStep === 3 && (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl p-5 md:p-14 space-y-8">
                    <h2 className="text-2xl font-black text-slate-900 uppercase">Date & Time</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {renderInput("Event Date", postEvent.startDate, (v) => setPostEvent(p => ({ ...p, startDate: v })), "date")}
                        {renderInput("Registration Close Date", config.regCloseDate, (v) => updateConfig('regCloseDate', v), "date")}
                        {renderInput("Reporting Time", config.reportingTime, (v) => updateConfig('reportingTime', v), "time")}
                        {renderInput("Start Time", postEvent.startTime, (v) => setPostEvent(p => ({ ...p, startTime: v })), "time")}
                    </div>
                    <div className="pt-10 flex justify-between">
                        <button onClick={() => setCurrentStep(2)} className="px-10 py-4 text-slate-800 font-bold uppercase text-[10px] flex items-center gap-2"><ArrowLeft size={16} /> Back</button>
                        <button onClick={() => setCurrentStep(4)} className="px-12 py-4 bg-slate-900 text-white rounded-full text-xs font-bold uppercase flex items-center gap-2">Next <ArrowRight size={16} /></button>
                    </div>
                </div>
            )}

            {currentStep === 4 && (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl p-5 md:p-14 space-y-8">
                    <h2 className="text-2xl font-black text-slate-900 uppercase">Categories & Events</h2>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-bold uppercase">Age Categories</h3>
                            <button onClick={() => {
                                const cats = [...config.competitionCategories];
                                cats.push({ id: Date.now(), name: "", minAge: 0, maxAge: 0, gender: "All" });
                                updateConfig('competitionCategories', cats);
                            }} className="text-pink-500 text-[10px] font-bold uppercase border border-pink-500 px-3 py-1 rounded-full">+ Add Category</button>
                        </div>
                        {config.competitionCategories?.map((cat, idx) => (
                            <div key={idx} className="grid grid-cols-5 gap-4 bg-slate-50 p-4 rounded-xl items-end">
                                <div className="col-span-2">
                                    <label className="text-[10px] font-bold uppercase">Category Name</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 min-w-[150px]">
                                            <CustomSelect 
                                                value={cat.isCustom ? "Custom" : cat.name} 
                                                onChange={val => {
                                                    const c = [...config.competitionCategories];
                                                    if (val === "Custom") {
                                                        c[idx].isCustom = true;
                                                        c[idx].name = "";
                                                    } else {
                                                        c[idx].isCustom = false;
                                                        c[idx].name = val;
                                                        // Auto-fill typical age ranges if possible
                                                        if (val.startsWith("U-")) {
                                                            const age = parseInt(val.split("-")[1]);
                                                            if (!isNaN(age)) {
                                                                c[idx].maxAge = age;
                                                                c[idx].minAge = Math.max(0, age - 2);
                                                            }
                                                        } else if (val === "Open") {
                                                            c[idx].minAge = 0; c[idx].maxAge = 99;
                                                        } else if (val === "Senior" || val === "Masters") {
                                                            c[idx].minAge = 35; c[idx].maxAge = 99;
                                                        }
                                                    }
                                                    updateConfig('competitionCategories', c);
                                                }}
                                                options={[
                                                    "U-6", "U-7", "U-8", "U-9", "U-10", "U-11", 
                                                    "U-13", "U-15", "U-17", "U-19", "Open", "Senior", "Masters", "Custom"
                                                ]}
                                            />
                                        </div>
                                        {cat.isCustom && (
                                            <input 
                                                value={cat.name} 
                                                onChange={e => {
                                                    const c = [...config.competitionCategories];
                                                    c[idx].name = e.target.value;
                                                    updateConfig('competitionCategories', c);
                                                }} 
                                                className="w-full p-2 text-sm border rounded-lg" 
                                                placeholder="e.g. Under-21" 
                                            />
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase">Min Age</label>
                                    <input type="number" value={cat.minAge} onChange={e => {
                                        const c = [...config.competitionCategories];
                                        c[idx].minAge = parseInt(e.target.value) || 0;
                                        updateConfig('competitionCategories', c);
                                    }} className="w-full p-2 text-sm border rounded-lg" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase">Max Age</label>
                                    <input type="number" value={cat.maxAge} onChange={e => {
                                        const c = [...config.competitionCategories];
                                        c[idx].maxAge = parseInt(e.target.value) || 0;
                                        updateConfig('competitionCategories', c);
                                    }} className="w-full p-2 text-sm border rounded-lg" />
                                </div>
                                <button onClick={() => {
                                    const c = [...config.competitionCategories];
                                    c.splice(idx, 1);
                                    updateConfig('competitionCategories', c);
                                }} className="p-2 text-red-500"><Trash2 size={18} /></button>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4 pt-6 border-t border-slate-100">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-bold uppercase">Competition Events / Races</h3>
                            <button onClick={() => {
                                const evts = [...config.competitionEvents];
                                evts.push({ id: Date.now(), name: "", distance: "", fee: 0, gender: "All" });
                                updateConfig('competitionEvents', evts);
                            }} className="text-pink-500 text-[10px] font-bold uppercase border border-pink-500 px-3 py-1 rounded-full">+ Add Event</button>
                        </div>
                        {config.competitionEvents?.map((evt, idx) => (
                            <div key={idx} className="grid grid-cols-5 gap-4 bg-slate-50 p-4 rounded-xl items-end">
                                <div className="col-span-2">
                                    <label className="text-[10px] font-bold uppercase">Event Name</label>
                                    <input value={evt.name} onChange={e => {
                                        const c = [...config.competitionEvents];
                                        c[idx].name = e.target.value;
                                        updateConfig('competitionEvents', c);
                                    }} className="w-full p-2 text-sm border rounded-lg" placeholder="50M Freestyle" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase">Distance</label>
                                    <input value={evt.distance} onChange={e => {
                                        const c = [...config.competitionEvents];
                                        c[idx].distance = e.target.value;
                                        updateConfig('competitionEvents', c);
                                    }} className="w-full p-2 text-sm border rounded-lg" placeholder="50M" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase">Reg Fee (₹)</label>
                                    <input type="number" value={evt.fee} onChange={e => {
                                        const c = [...config.competitionEvents];
                                        c[idx].fee = parseInt(e.target.value) || 0;
                                        updateConfig('competitionEvents', c);
                                    }} className="w-full p-2 text-sm border rounded-lg" />
                                </div>
                                <button onClick={() => {
                                    const c = [...config.competitionEvents];
                                    c.splice(idx, 1);
                                    updateConfig('competitionEvents', c);
                                }} className="p-2 text-red-500"><Trash2 size={18} /></button>
                            </div>
                        ))}
                    </div>

                    <div className="pt-10 flex justify-between">
                        <button onClick={() => setCurrentStep(3)} className="px-10 py-4 text-slate-800 font-bold uppercase text-[10px] flex items-center gap-2"><ArrowLeft size={16} /> Back</button>
                        <button onClick={() => setCurrentStep(5)} className="px-12 py-4 bg-slate-900 text-white rounded-full text-xs font-bold uppercase flex items-center gap-2">Next <ArrowRight size={16} /></button>
                    </div>
                </div>
            )}

            {currentStep === 5 && (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl p-5 md:p-14 space-y-8">
                    <h2 className="text-2xl font-black text-slate-900 uppercase">Documents & Rules</h2>
                    
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase">Required Documents</h3>
                        {config.documents?.map((doc, idx) => (
                            <div key={idx} className="flex gap-4 bg-slate-50 p-4 rounded-xl items-center">
                                <input value={doc.type} onChange={e => {
                                    const d = [...config.documents];
                                    d[idx].type = e.target.value;
                                    updateConfig('documents', d);
                                }} className="flex-1 p-2 text-sm border rounded-lg" placeholder="Document Name (e.g. Aadhaar)" />
                                <label className="flex items-center gap-2 text-xs font-bold">
                                    <input type="checkbox" checked={doc.mandatory} onChange={e => {
                                        const d = [...config.documents];
                                        d[idx].mandatory = e.target.checked;
                                        updateConfig('documents', d);
                                    }} /> Mandatory
                                </label>
                                <button onClick={() => {
                                    const d = [...config.documents];
                                    d.splice(idx, 1);
                                    updateConfig('documents', d);
                                }} className="p-2 text-red-500"><Trash2 size={18} /></button>
                            </div>
                        ))}
                        <button onClick={() => {
                            const d = [...config.documents];
                            d.push({ type: "", mandatory: false });
                            updateConfig('documents', d);
                        }} className="text-pink-500 text-[10px] font-bold uppercase">+ Add Document</button>
                    </div>

                    <div className="space-y-2 pt-6">
                        <label className="text-[11px] font-bold uppercase">Competition Rules & Terms</label>
                        <textarea value={config.rules} onChange={e => updateConfig('rules', e.target.value)} rows={5} className="w-full p-4 border rounded-xl text-sm" />
                    </div>

                    <div className="pt-10 flex justify-between">
                        <button onClick={() => setCurrentStep(4)} className="px-10 py-4 text-slate-800 font-bold uppercase text-[10px] flex items-center gap-2"><ArrowLeft size={16} /> Back</button>
                        <button onClick={onPublish} className="px-12 py-4 bg-pink-500 hover:bg-pink-600 text-white rounded-full text-xs font-bold uppercase flex items-center gap-2">Publish Competition</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompetitionEventForm;
