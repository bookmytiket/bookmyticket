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

    useEffect(() => {
        const config = postEvent.dynamic_config;
        if (config?.categories?.length > 0) {
            const minPrice = Math.min(...config.categories.map(c => c.price || 0));
            if (postEvent.price !== minPrice) {
                setPostEvent(prev => ({ ...prev, price: minPrice }));
            }
        }
    }, [postEvent.dynamic_config?.categories]);

    const handleImageUpload = async (file) => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `competitions/${fileName}`;

            let { error: uploadError } = await supabase.storage
                .from('event-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('event-images').getPublicUrl(filePath);
            return data.publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            showToast(`Upload failed: ${error.message || 'Unknown error'}`, "error");
            return null;
        }
    };

    const updateConfig = (key, value) => {
        setPostEvent(prev => ({
            ...prev,
            dynamic_config: {
                ...prev.dynamic_config,
                [key]: typeof value === 'function' ? value(prev.dynamic_config?.[key]) : value
            }
        }));
    };

    // Ensure defaults are pushed to the parent's postEvent immediately so onPublish has the correct data
    useEffect(() => {
        if (!postEvent.dynamic_config || !postEvent.dynamic_config.competitionAgeGroups) {
            setPostEvent(prev => ({
                ...prev,
                dynamic_config: {
                    ...(prev.dynamic_config || {}),
                    competitionType: 'Swimming Competition',
                    organiser_name: "",
                    supportEmail: "",
                    supportPhone: "",
                    subtitle: "",
                    categories: [
                        { id: 1, name: "Individual Event", price: 249, totalSlots: 500, description: "Entry fee for individual races" },
                        { id: 2, name: "Relay Event", price: 599, totalSlots: 100, description: "Entry fee for relay races" }
                    ],
                    competitionAgeGroups: [
                        { id: 1, name: "U-8", minAge: 0, maxAge: 7, distances: "25M, 4x50M" },
                        { id: 2, name: "U-10", minAge: 8, maxAge: 9, distances: "50M, 100M, 4x50M" },
                        { id: 3, name: "U-12", minAge: 10, maxAge: 11, distances: "50M, 100M, 4x50M" },
                        { id: 4, name: "U-15", minAge: 12, maxAge: 14, distances: "50M, 100M, 4x50M" },
                        { id: 5, name: "U-17", minAge: 15, maxAge: 16, distances: "50M, 100M, 4x50M" },
                        { id: 6, name: "U-19", minAge: 17, maxAge: 18, distances: "50M, 100M, 4x50M" },
                        { id: 7, name: "Senior", minAge: 19, maxAge: 34, distances: "50M, 100M, 4x50M" },
                        { id: 8, name: "Veterans", minAge: 35, maxAge: 99, distances: "50M, 100M, 4x50M" },
                        { id: 9, name: "Open", minAge: 0, maxAge: 99, distances: "50M, 100M, 4x50M" }
                    ],
                    competitionStrokes: "FR, BR, BAK, FLY, IM, OPEN",
                    registrationForm: [
                        { id: 1, label: "Full Name", type: "text", required: true, isDefault: true },
                        { id: 2, label: "Date of Birth", type: "date", required: true, isDefault: true },
                        { id: 3, label: "Email Address", type: "email", required: true, isDefault: true },
                        { id: 4, label: "Phone Number", type: "tel", required: true, isDefault: true },
                        { id: 5, label: "Age Category", type: "select", options: ["U-8", "U-10", "U-12", "U-15", "U-17", "U-19", "Senior", "Veterans", "Open"], required: true },
                        { id: 6, label: "Event/Stroke", type: "select", options: ["FR", "BR", "BAK", "FLY", "IM", "OPEN"], required: true },
                        { id: 7, label: "Distance", type: "select", options: ["25M", "50M", "100M", "4x50M"], required: true }
                    ],
                    documents: [
                        { type: "School ID / Govt ID", mandatory: true },
                        { type: "Aadhaar Card", mandatory: true }
                    ],
                    rules: "1. Time trials basis\n2. Referee's Decision is Final\n3. No Protests Allowed\n4. Valid ID required for Age verification.",
                    baseYear: new Date().getFullYear()
                }
            }));
        }
    }, [postEvent.dynamic_config?.competitionAgeGroups]);

    const baseConfig = postEvent.dynamic_config || {};
    const config = {
        ...baseConfig,
        competitionType: baseConfig.competitionType || 'Swimming Competition',
        organiser_name: baseConfig.organiser_name || "",
        supportEmail: baseConfig.supportEmail || "",
        supportPhone: baseConfig.supportPhone || "",
        subtitle: baseConfig.subtitle || "",
        categories: baseConfig.categories || [
            { id: 1, name: "Individual Event", price: 249, totalSlots: 500, description: "Entry fee for individual races" },
            { id: 2, name: "Relay Event", price: 599, totalSlots: 100, description: "Entry fee for relay races" }
        ],
        competitionAgeGroups: baseConfig.competitionAgeGroups || [
            { id: 1, name: "U-8", minAge: 0, maxAge: 7, distances: "25M, 4x50M" },
            { id: 2, name: "U-10", minAge: 8, maxAge: 9, distances: "50M, 100M, 4x50M" },
            { id: 3, name: "U-12", minAge: 10, maxAge: 11, distances: "50M, 100M, 4x50M" },
            { id: 4, name: "U-15", minAge: 12, maxAge: 14, distances: "50M, 100M, 4x50M" },
            { id: 5, name: "U-17", minAge: 15, maxAge: 16, distances: "50M, 100M, 4x50M" },
            { id: 6, name: "U-19", minAge: 17, maxAge: 18, distances: "50M, 100M, 4x50M" },
            { id: 7, name: "Senior", minAge: 19, maxAge: 34, distances: "50M, 100M, 4x50M" },
            { id: 8, name: "Veterans", minAge: 35, maxAge: 99, distances: "50M, 100M, 4x50M" },
            { id: 9, name: "Open", minAge: 0, maxAge: 99, distances: "50M, 100M, 4x50M" }
        ],
        competitionStrokes: baseConfig.competitionStrokes || "FR, BR, BAK, FLY, IM, OPEN",
        registrationForm: baseConfig.registrationForm || [
            { id: 1, label: "Full Name", type: "text", required: true, isDefault: true },
            { id: 2, label: "Date of Birth", type: "date", required: true, isDefault: true },
            { id: 3, label: "Email Address", type: "email", required: true, isDefault: true },
            { id: 4, label: "Phone Number", type: "tel", required: true, isDefault: true },
            { id: 5, label: "Age Category", type: "select", options: ["U-8", "U-10", "U-12", "U-15", "U-17", "U-19", "Senior", "Veterans", "Open"], required: true },
            { id: 6, label: "Event/Stroke", type: "select", options: ["FR", "BR", "BAK", "FLY", "IM", "OPEN"], required: true },
            { id: 7, label: "Distance", type: "select", options: ["25M", "50M", "100M", "4x50M"], required: true }
        ],
        documents: baseConfig.documents || [
            { type: "School ID / Govt ID", mandatory: true },
            { type: "Aadhaar Card", mandatory: true }
        ],
        rules: baseConfig.rules || "1. Time trials basis\n2. Referee's Decision is Final\n3. No Protests Allowed\n4. Valid ID required for Age verification.",
        baseYear: baseConfig.baseYear || new Date().getFullYear()
    };

    const steps = [
        { id: 1, title: "Basic Details", icon: FileText },
        { id: 2, title: "Venue", icon: MapPin },
        { id: 3, title: "Date & Time", icon: Calendar },
        { id: 4, title: "Categories & Pricing", icon: Trophy },
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
                                    <input type="file" className="hidden" onChange={async (e) => {
                                        const f = e.target.files[0];
                                        if(f) {
                                            const url = await handleImageUpload(f);
                                            if (url) {
                                                setPostEvent(p => ({ ...p, image_url: url }));
                                            }
                                        }
                                    }} />
                                </label>
                            )}
                        </div>
                        {renderInput("Organizer Name", config.organiser_name, (v) => updateConfig('organiser_name', v))}
                        <div className="grid grid-cols-2 gap-4 md:col-span-2">
                            {renderInput("Contact Phone", config.supportPhone, (v) => updateConfig('supportPhone', v), "text", "e.g., 9787286909")}
                            {renderInput("Contact Email", config.supportEmail, (v) => updateConfig('supportEmail', v))}
                        </div>
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
                    <h2 className="text-2xl font-black text-slate-900 uppercase">Categories & Pricing</h2>
                    
                    {/* PRICING TIERS */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-bold uppercase text-[#ec4899]">Registration Fees (Tickets)</h3>
                            <button onClick={() => {
                                const cats = [...(config.categories || [])];
                                cats.push({ id: Date.now(), name: "New Event", price: 0, totalSlots: 100, description: "" });
                                updateConfig('categories', cats);
                            }} className="text-pink-500 text-[10px] font-bold uppercase border border-pink-500 px-3 py-1 rounded-full">+ Add Fee Tier</button>
                        </div>
                        {config.categories?.map((cat, idx) => (
                            <div key={idx} className="grid grid-cols-5 gap-4 bg-pink-50/50 p-4 rounded-xl border border-pink-100 items-end">
                                <div className="col-span-2">
                                    <label className="text-[10px] font-bold uppercase text-slate-700">Ticket / Event Type</label>
                                    <input value={cat.name} onChange={e => {
                                        const c = [...(config.categories || [])];
                                        c[idx].name = e.target.value;
                                        updateConfig('categories', c);
                                    }} className="w-full p-2 text-sm border rounded-lg bg-white text-slate-900" placeholder="Individual Event" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-slate-700">Price (₹)</label>
                                    <input type="number" value={cat.price} onChange={e => {
                                        const c = [...(config.categories || [])];
                                        c[idx].price = parseInt(e.target.value) || 0;
                                        updateConfig('categories', c);
                                    }} className="w-full p-2 text-sm border rounded-lg bg-white text-slate-900" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-slate-700">Total Slots</label>
                                    <input type="number" value={cat.totalSlots} onChange={e => {
                                        const c = [...(config.categories || [])];
                                        c[idx].totalSlots = parseInt(e.target.value) || 0;
                                        updateConfig('categories', c);
                                    }} className="w-full p-2 text-sm border rounded-lg bg-white text-slate-900" />
                                </div>
                                <button onClick={() => {
                                    const c = [...(config.categories || [])];
                                    c.splice(idx, 1);
                                    updateConfig('categories', c);
                                }} className="p-2 text-red-500"><Trash2 size={18} /></button>
                            </div>
                        ))}
                    </div>

                    {/* AGE GROUPS */}
                    <div className="space-y-4 pt-6 border-t border-slate-100">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-sm font-bold uppercase text-slate-900">Age Categories & Validation</h3>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Configure age cutoff calculation (e.g. Base Year {config.baseYear})</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <label className="text-[10px] font-bold uppercase text-slate-700">Base Year:</label>
                                    <input type="number" value={config.baseYear} onChange={e => updateConfig('baseYear', parseInt(e.target.value) || new Date().getFullYear())} className="w-20 p-2 text-sm border rounded-lg bg-white text-slate-900" />
                                </div>
                                <button onClick={() => {
                                    const ags = [...(config.competitionAgeGroups || [])];
                                    ags.push({ id: Date.now(), name: "", minAge: 0, maxAge: 99, distances: "" });
                                    updateConfig('competitionAgeGroups', ags);
                                    
                                    // Auto-update registration form
                                    const newOpts = [...ags].map(a => a.name).filter(Boolean);
                                    const form = [...(config.registrationForm || [])];
                                    const ageField = form.find(f => f.label === "Age Category");
                                    if (ageField) ageField.options = newOpts;
                                    updateConfig('registrationForm', form);
                                    
                                }} className="text-slate-500 text-[10px] font-bold uppercase border border-slate-300 px-3 py-1 rounded-full">+ Add Age Group</button>
                            </div>
                        </div>
                        {config.competitionAgeGroups?.map((ag, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-4 bg-slate-50 p-4 rounded-xl items-end border border-slate-100">
                                <div className="col-span-12 md:col-span-3">
                                    <label className="text-[10px] font-bold uppercase text-slate-700">Category Name</label>
                                    <input value={ag.name} onChange={e => {
                                        const a = [...(config.competitionAgeGroups || [])];
                                        a[idx].name = e.target.value;
                                        updateConfig('competitionAgeGroups', a);
                                        
                                        // Auto-update registration form
                                        const newOpts = [...a].map(x => x.name).filter(Boolean);
                                        const form = [...(config.registrationForm || [])];
                                        const ageField = form.find(f => f.label === "Age Category");
                                        if (ageField) ageField.options = newOpts;
                                        updateConfig('registrationForm', form);
                                        
                                    }} className="w-full p-2 text-sm border rounded-lg bg-white text-slate-900" placeholder="e.g. U-12" />
                                </div>
                                <div className="col-span-6 md:col-span-2">
                                    <label className="text-[10px] font-bold uppercase text-slate-700">Min Age</label>
                                    <input type="number" value={ag.minAge} onChange={e => {
                                        const a = [...(config.competitionAgeGroups || [])];
                                        a[idx].minAge = parseInt(e.target.value) || 0;
                                        updateConfig('competitionAgeGroups', a);
                                    }} className="w-full p-2 text-sm border rounded-lg bg-white text-slate-900" placeholder="0" />
                                </div>
                                <div className="col-span-6 md:col-span-2">
                                    <label className="text-[10px] font-bold uppercase text-slate-700">Max Age</label>
                                    <input type="number" value={ag.maxAge} onChange={e => {
                                        const a = [...(config.competitionAgeGroups || [])];
                                        a[idx].maxAge = parseInt(e.target.value) || 0;
                                        updateConfig('competitionAgeGroups', a);
                                    }} className="w-full p-2 text-sm border rounded-lg bg-white text-slate-900" placeholder="12" />
                                </div>
                                <div className="col-span-10 md:col-span-4">
                                    <label className="text-[10px] font-bold uppercase text-slate-700">Distances (comma separated)</label>
                                    <input value={ag.distances} onChange={e => {
                                        const a = [...(config.competitionAgeGroups || [])];
                                        a[idx].distances = e.target.value;
                                        updateConfig('competitionAgeGroups', a);
                                        
                                        // Collect all unique distances to update distance dropdown
                                        const allDistances = new Set();
                                        a.forEach(grp => {
                                            if (grp.distances) {
                                                grp.distances.split(',').forEach(d => allDistances.add(d.trim()));
                                            }
                                        });
                                        const form = [...(config.registrationForm || [])];
                                        const distField = form.find(f => f.label === "Distance");
                                        if (distField) distField.options = Array.from(allDistances).filter(Boolean);
                                        updateConfig('registrationForm', form);
                                        
                                    }} className="w-full p-2 text-sm border rounded-lg bg-white text-slate-900" placeholder="25M, 50M" />
                                </div>
                                <div className="col-span-2 md:col-span-1 flex justify-end">
                                    <button onClick={() => {
                                        const a = [...(config.competitionAgeGroups || [])];
                                        a.splice(idx, 1);
                                        updateConfig('competitionAgeGroups', a);
                                    }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* STROKES / EVENTS */}
                    <div className="space-y-4 pt-6 border-t border-slate-100">
                        <label className="text-[11px] font-bold uppercase text-slate-900">Events / Strokes (comma separated)</label>
                        <input value={config.competitionStrokes} onChange={e => {
                            updateConfig('competitionStrokes', e.target.value);
                            
                            // Auto-update registration form
                            const options = e.target.value.split(/[,/&]/).map(s => s.trim()).filter(Boolean);
                            const form = [...(config.registrationForm || [])];
                            const strokeField = form.find(f => f.label === "Event/Stroke");
                            if (strokeField) strokeField.options = options;
                            updateConfig('registrationForm', form);
                            
                        }} className="w-full p-4 border rounded-xl text-sm bg-white text-slate-900" placeholder="FR, BR, BAK, FLY, IM, OPEN" />
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
                            <div key={idx} className="flex gap-4 bg-slate-50 p-4 rounded-xl items-center border border-slate-100">
                                <input value={doc.type} onChange={e => {
                                    const d = [...(config.documents || [])];
                                    d[idx].type = e.target.value;
                                    updateConfig('documents', d);
                                }} className="flex-1 p-2 text-sm border rounded-lg bg-white text-slate-900" placeholder="Document Name (e.g. Aadhaar)" />
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                    <input type="checkbox" checked={doc.mandatory} onChange={e => {
                                        const d = [...(config.documents || [])];
                                        d[idx].mandatory = e.target.checked;
                                        updateConfig('documents', d);
                                    }} className="w-4 h-4 rounded text-pink-500" /> Mandatory
                                </label>
                                <button onClick={() => {
                                    const d = [...(config.documents || [])];
                                    d.splice(idx, 1);
                                    updateConfig('documents', d);
                                }} className="p-2 text-red-500"><Trash2 size={18} /></button>
                            </div>
                        ))}
                        <button onClick={() => {
                            const d = [...(config.documents || [])];
                            d.push({ type: "", mandatory: false });
                            updateConfig('documents', d);
                        }} className="text-pink-500 text-[10px] font-bold uppercase">+ Add Document</button>
                    </div>

                    <div className="space-y-2 pt-6">
                        <label className="text-[11px] font-bold uppercase text-slate-700">Competition Rules & Terms</label>
                        <textarea value={config.rules} onChange={e => updateConfig('rules', e.target.value)} rows={5} className="w-full p-4 border rounded-xl text-sm bg-white text-slate-900" />
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
