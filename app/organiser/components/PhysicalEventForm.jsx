"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from '@/components/AuthContext';
import { 
    MapPin, Calendar, Clock, Ticket, Users, Shield, 
    Image as ImageIcon, Layout, ArrowRight, ArrowLeft,
    CheckCircle2, Plus, Trash2, Sparkles, Search, Video, RefreshCcw,
    Car, DoorOpen, Siren, ChevronRight, Zap, Info, ShieldCheck,
    DollarSign, FileCheck2, Bike, HeartPulse, Home, Coffee, Award, Tag, Globe, 
    Utensils, Camera, Baby, Trophy, Shirt, Bath, Hash
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import CalendarPicker from "./CalendarPicker";
import TimePicker from "./TimePicker";
import CustomSelect from "./CustomSelect";
import LocationSelectionModal from "@/components/LocationSelectionModal";
import { useToast } from "@/context/ToastContext";
import GoogleInlineMap from "./GoogleInlineMap";
import { geocode, reverseGeocode } from "@/lib/googleMaps";
import { COUNTRIES } from "@/app/data/locationData";
import { State, City } from 'country-state-city';
import BlockMapDesigner from "./BlockMapDesigner";
import BibConfiguration from "./BibConfiguration";

const EVENT_CATEGORIES = [
    "Music & Concerts", "Workshops & Training", "Sports & Fitness", 
    "Tech & Hackathons", "Business & Networking", "Food & Drinks", 
    "Arts & Culture", "Marathon & Running", "Gaming & eSports", "Others"
];

const AGE_RESTRICTIONS = [
    "All ages", "5+", "13+", "16+", "18+", "21+", "Family only", "Kids only"
];
import { INDIAN_STATES, getIndianDistricts, getIndianCities } from "@/app/data/indianLocations";

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
                className="w-full bg-slate-50/50 border border-slate-100 text-slate-900 text-sm font-bold px-6 py-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-200 transition-all placeholder:text-slate-400"
                placeholder={placeholder}
            />
        )}
    </div>
);

const PhysicalEventForm = ({ postEvent, setPostEvent, onCancel, onPublish, isEditing }) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [currentStep, setCurrentStep] = useState(1);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [dbDistricts, setDbDistricts] = useState([]);
    const [dbCities, setDbCities] = useState([]);
    const [distLoading, setDistLoading] = useState(false);
    const [cityLoading, setCityLoading] = useState(false);

    // Initial state setup based on postEvent
    useEffect(() => {
        if (!postEvent.type) {
            setPostEvent(prev => ({ 
                ...prev, 
                type: "Physical Event",
                country: prev.country || "India",
                countryCode: prev.countryCode || "IN",
                seating_type: prev.seating_type || "FCFS",
                ticketType: prev.ticketType || "paid"
            }));
        }
    }, []);

    const steps = [
        { id: 1, title: "Identity", icon: Info },
        { id: 2, title: "Venue", icon: MapPin },
        { id: 3, title: "Logistics", icon: Car },
        { id: 4, title: "Seating", icon: Layout },
        { id: 5, title: "Tickets", icon: Ticket },
        { id: 6, title: "BIB Config", icon: Hash },
        { id: 7, title: isEditing ? "Update" : "Finalize", icon: Zap }
    ];

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

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

    // AUTO-SYNC CATEGORIES FROM SEAT MAP BLOCKS
    const syncCategoriesFromBlocks = () => {
        if (!postEvent.blocks || postEvent.blocks.length === 0) return;
        
        const blockCategories = {};
        postEvent.blocks.forEach(block => {
            const catName = block.category || "General Admission";
            const slots = block.isGeneral ? (block.capacity || 0) : ((parseInt(block.rows) || 0) * (parseInt(block.cols) || 0));
            if (!blockCategories[catName]) {
                blockCategories[catName] = { slots: 0, color: block.color, basePrice: block.basePrice };
            }
            blockCategories[catName].slots += slots;
        });

        const newCategories = Object.keys(blockCategories).map(name => {
            const existing = (postEvent.categories || []).find(c => c.name === name);
            return {
                id: existing?.id || `cat_${Date.now()}_${name}`,
                name: name,
                price: existing?.price || blockCategories[name].basePrice || (name === "VIP" ? 2000 : name === "Platinum" ? 1500 : name === "Gold" ? 1000 : 500),
                totalSlots: blockCategories[name].slots,
                color: existing?.color || blockCategories[name].color || "#ec4899"
            };
        });

        setPostEvent(prev => ({ ...prev, categories: newCategories }));
        showToast("Synchronized categories from Seat Map", "success");
    };

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
                                    ? 'bg-gradient-to-br from-pink-500 to-purple-600 border-transparent text-white shadow-xl shadow-pink-500/20 scale-110' 
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

            {/* Step 1: Identity */}
            {currentStep === 1 && (
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] p-12 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-3xl bg-pink-50 flex items-center justify-center text-pink-600 shadow-inner">
                            <Sparkles size={32} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Event Identity</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">The face of your premium experience</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {renderInput("Event Name*", postEvent.title, (v) => setPostEvent(p => ({ ...p, title: v })), "text", "Enter high-impact name", true)}
                        {renderInput("Subtitle / Tagline", postEvent.subtitle, (v) => setPostEvent(p => ({ ...p, subtitle: v })), "text", "Short catchphrase")}
                        {renderInput("Organised By (Name)", postEvent.organiser_name, (v) => setPostEvent(p => ({ ...p, organiser_name: v })), "text", "e.g., Partner Name")}
                        <CustomSelect 
                            label="Category*"
                            value={postEvent.category}
                            options={EVENT_CATEGORIES}
                            onChange={(v) => setPostEvent(p => ({ ...p, category: v }))}
                        />
                        
                        <div className="md:col-span-2 space-y-3">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Primary Banner (16:9)</label>
                            <div 
                                className="group relative h-72 rounded-[3rem] border-2 border-dashed border-slate-200 bg-slate-50/50 overflow-hidden hover:border-pink-300 transition-all flex items-center justify-center cursor-pointer shadow-inner"
                                onClick={() => document.getElementById('banner-upload').click()}
                            >
                                {postEvent.bannerPreview ? (
                                    <img src={postEvent.bannerPreview} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                ) : (
                                    <div className="flex flex-col items-center gap-4 text-slate-400 group-hover:text-pink-500 transition-colors">
                                        <div className="w-20 h-20 rounded-[2rem] bg-white shadow-sm flex items-center justify-center group-hover:shadow-pink-100 transition-all">
                                            <ImageIcon size={32} strokeWidth={1.5} />
                                        </div>
                                        <span className="text-[11px] font-black uppercase tracking-widest">Architectural Visualization</span>
                                    </div>
                                )}
                                <input id="banner-upload" type="file" className="hidden" onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (ev) => setPostEvent(p => ({ ...p, banner: file, bannerPreview: ev.target.result }));
                                        reader.readAsDataURL(file);
                                    }
                                }} />
                            </div>
                        </div>

                        {renderInput("Start Date*", postEvent.startDate, (v) => setPostEvent(p => ({ ...p, startDate: v })), "date")}
                        {renderInput("Start Time*", postEvent.startTime, (v) => setPostEvent(p => ({ ...p, startTime: v })), "time")}
                        {renderInput("End Date", postEvent.endDate, (v) => setPostEvent(p => ({ ...p, endDate: v })), "date")}
                        {renderInput("End Time", postEvent.endTime, (v) => setPostEvent(p => ({ ...p, endTime: v })), "time")}
                    </div>

                    <div className="pt-10 flex justify-end">
                        <button 
                            onClick={nextStep}
                            disabled={!postEvent.title || !postEvent.startDate}
                            className="group px-12 py-5 bg-slate-900 text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:bg-pink-600 transition-all shadow-2xl shadow-slate-200 disabled:opacity-50 disabled:pointer-events-none"
                        >
                            Next: Venue Framework <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Venue */}
            {currentStep === 2 && (
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] p-12 space-y-12 animate-in fade-in slide-in-from-right-8 duration-700">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                            <MapPin size={32} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Venue Framework</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Geospatial positioning & address resolution</p>
                        </div>
                        {/* Global Discovery button removed */}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {renderInput("Venue Name*", postEvent.venue, (v) => setPostEvent(p => ({ ...p, venue: v })), "text", "e.g. Palace Grounds", true)}
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
                            options={State.getStatesOfCountry(postEvent.countryCode).map(s => s.name)}
                            onChange={(v) => {
                                const stateObj = State.getStatesOfCountry(postEvent.countryCode).find(s => s.name === v);
                                setPostEvent(p => ({ ...p, state: v, stateCode: stateObj?.isoCode || "", district: "", city: "" }));
                            }}
                        />

                        {(postEvent.countryCode === "IN" || postEvent.country === "India") ? (
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
                                options={City.getCitiesOfState(postEvent.countryCode, postEvent.stateCode).map(c => c.name)}
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
                                className="w-full bg-slate-50/50 border border-slate-100 text-slate-900 text-sm font-bold px-6 py-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-200 transition-all placeholder:text-slate-400"
                                placeholder="Enter Pincode"
                            />
                        </div>

                        <div className="md:col-span-2 h-[400px] rounded-[3rem] overflow-hidden border border-slate-100 shadow-2xl relative">
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
                        <button onClick={prevStep} className="px-10 py-5 text-slate-400 font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:text-slate-900 transition-colors"><ArrowLeft size={18} /> Protocol Return</button>
                        <button onClick={nextStep} className="px-12 py-5 bg-slate-900 text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:bg-blue-600 transition-all shadow-2xl">Next: Logistics <ArrowRight size={18} /></button>
                    </div>
                </div>
            )}

            {/* Step 3: Logistics */}
            {currentStep === 3 && (
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] p-12 space-y-12 animate-in fade-in slide-in-from-right-8 duration-700">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-3xl bg-orange-50 flex items-center justify-center text-orange-600 shadow-inner">
                            <Car size={32} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Operational Logistics</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Entry, exit, parking and safety protocols</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {renderInput("Parking Details", postEvent.parkingDetails, (v) => setPostEvent(p => ({ ...p, parkingDetails: v })), "text", "Describe parking capacity & locations", true)}
                        {renderInput("Entry Gate Info", postEvent.entryGate, (v) => setPostEvent(p => ({ ...p, entryGate: v })), "text", "Gate numbers or directions")}
                        {renderInput("Emergency Exits", postEvent.emergencyExit, (v) => setPostEvent(p => ({ ...p, emergencyExit: v })), "text", "Safety exit locations")}
                        {renderInput("Language", postEvent.language, (v) => setPostEvent(p => ({ ...p, language: v })), "text", "Primary event language")}
                        <CustomSelect 
                            label="Age Restriction"
                            value={postEvent.ageLimit}
                            options={AGE_RESTRICTIONS}
                            onChange={(v) => setPostEvent(p => ({ ...p, ageLimit: v }))}
                        />
                        {renderInput("Video Trailer URL", postEvent.videoTrailerUrl, (v) => setPostEvent(p => ({ ...p, videoTrailerUrl: v })), "url", "YouTube/Vimeo link")}
                        
                        <div className="md:col-span-2 space-y-6">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Gallery Visualizer</label>
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
                                    onClick={() => document.getElementById('gallery-upload').click()}
                                    className="h-32 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-pink-300 hover:text-pink-500 transition-all bg-slate-50/50"
                                >
                                    <Plus size={24} strokeWidth={1.5} />
                                    <span className="text-[8px] font-black uppercase tracking-widest">Add Image</span>
                                </button>
                                <input 
                                    id="gallery-upload" 
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
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Amenities Matrix</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                {[
                                    { id: 'ambulance', label: 'Ambulance', icon: Siren },
                                    { id: 'cash_prize', label: 'Cash Prize', icon: DollarSign },
                                    { id: 'certificate', label: 'Certificate', icon: FileCheck2 },
                                    { id: 'cycle', label: 'Cycle', icon: Bike },
                                    { id: 'family', label: 'Family-Friendly', icon: Users },
                                    { id: 'checkin', label: 'Fast Check-In', icon: Zap },
                                    { id: 'first_aid', label: 'First Aid', icon: HeartPulse },
                                    { id: 'accommodation', label: 'Free Accommodation', icon: Home },
                                    { id: 'breakfast', label: 'Free Breakfast', icon: Coffee },
                                    { id: 'medal', label: 'Medal', icon: Award },
                                    { id: 'bib', label: 'Non Timed BIB', icon: Tag },
                                    { id: 'outdoor', label: 'Outdoor Event', icon: Globe },
                                    { id: 'parking_fcfs', label: 'Parking Available (FCFS)', icon: Car },
                                    { id: 'refreshments', label: 'Refreshments', icon: Utensils },
                                    { id: 'safety_enabled', label: 'Safety measures enabled', icon: ShieldCheck },
                                    { id: 'selfie', label: 'Selfie Spot', icon: Camera },
                                    { id: 'shield', label: 'Shield', icon: Shield },
                                    { id: 'suitable_all', label: 'Suitable for all ages', icon: Baby },
                                    { id: 'trophy', label: 'Trophy', icon: Trophy },
                                    { id: 'tshirt', label: 'TShirt', icon: Shirt },
                                    { id: 'wash_room', label: 'Wash Room', icon: Bath },
                                    { id: 'valet', label: 'Valet Parking', icon: Car },
                                    { id: 'wifi', label: 'High-Speed Wifi', icon: Zap },
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setPostEvent(p => ({ ...p, [item.id]: !p[item.id] }))}
                                        className={`flex flex-col items-center gap-4 p-8 rounded-[2.5rem] border-2 transition-all duration-500 ${
                                            postEvent[item.id] 
                                            ? 'bg-pink-50 border-pink-200 text-pink-600 shadow-xl shadow-pink-500/10 scale-105' 
                                            : 'bg-slate-50/50 border-slate-100 text-slate-400 grayscale'
                                        }`}
                                    >
                                        <item.icon size={28} strokeWidth={postEvent[item.id] ? 2.5 : 1.5} />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-center">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 flex justify-between">
                        <button onClick={prevStep} className="px-10 py-5 text-slate-400 font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:text-slate-900 transition-colors"><ArrowLeft size={18} /> Protocol Return</button>
                        <button onClick={nextStep} className="px-12 py-5 bg-slate-900 text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:bg-orange-600 transition-all shadow-2xl">Next: Seating Layout <ArrowRight size={18} /></button>
                    </div>
                </div>
            )}

            {/* Step 4: Seating Blueprint & Mapping */}
            {currentStep === 4 && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-700 space-y-6">
                    {/* Ticketing Format Toggle */}
                    <div className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] mb-6">
                        <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 shadow-inner">
                                    <Layout size={28} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Ticketing Format</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Select General Admission vs Reserved Seating</p>
                                </div>
                            </div>
                            <div className="flex bg-slate-100 p-1.5 rounded-full shadow-inner">
                                <button 
                                    onClick={() => setPostEvent(p => ({ ...p, ticketType: 'general' }))}
                                    className={`px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${postEvent.ticketType === 'general' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-500 hover:text-slate-900'}`}
                                >
                                    General Admission
                                </button>
                                <button 
                                    onClick={() => setPostEvent(p => ({ ...p, ticketType: 'reserved' }))}
                                    className={`px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${postEvent.ticketType === 'reserved' ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30' : 'text-slate-500 hover:text-slate-900'}`}
                                >
                                    Reserved Seating
                                </button>
                            </div>
                        </div>

                        {postEvent.ticketType === 'general' && (
                            <div className="mt-10 pt-10 border-t border-slate-100 animate-in fade-in slide-in-from-top-4 flex flex-col items-center justify-center py-12">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100 shadow-inner">
                                    <Ticket size={24} className="text-emerald-500" />
                                </div>
                                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">No Seat Map Required</h4>
                                <p className="text-[11px] font-medium text-slate-500 mt-2 max-w-md text-center leading-relaxed">
                                    General Admission events do not require a physical seating layout. You can configure your ticket categories, pricing, and capacity in the next step.
                                </p>
                            </div>
                        )}
                    </div>

                    {postEvent.ticketType === 'reserved' && (
                        <BlockMapDesigner 
                            postEvent={postEvent}
                            setPostEvent={setPostEvent}
                        />
                    )}

                    <div className="pt-10 flex justify-between bg-white rounded-[3rem] p-12 border border-slate-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)]">
                        <button onClick={prevStep} className="px-10 py-5 text-slate-400 font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:text-slate-900 transition-colors"><ArrowLeft size={18} /> Logistics Return</button>
                        <button onClick={nextStep} className="px-12 py-5 bg-slate-900 text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:bg-pink-600 transition-all shadow-2xl">Next: Ticket Inventory <ArrowRight size={18} /></button>
                    </div>
                </div>
            )}

            {/* Step 5: Ticket Categories */}
            {currentStep === 5 && (
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] p-12 space-y-12 animate-in fade-in slide-in-from-right-8 duration-700">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-3xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
                            <Ticket size={32} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Ticket Inventory</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Dynamic pricing tiers & availability control</p>
                        </div>
                        <div className="flex gap-4">
                            {postEvent.blocks?.length > 0 && (
                                <button 
                                    onClick={syncCategoriesFromBlocks}
                                    className="flex items-center gap-3 px-8 py-4 bg-pink-50 text-pink-600 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-pink-600 hover:text-white transition-all shadow-sm border border-pink-100 group"
                                >
                                    <RefreshCcw size={16} strokeWidth={2.5} className="group-hover:rotate-180 transition-transform duration-700" />
                                    Sync from Seat Map
                                </button>
                            )}
                            <button 
                                onClick={() => {
                                    const newCats = [...(postEvent.categories || [])];
                                    newCats.push({ id: Date.now(), name: "VIP Experience", price: 999, totalSlots: 100, color: "#ec4899" });
                                    setPostEvent(p => ({ ...p, categories: newCats }));
                                }}
                                className="flex items-center gap-3 px-8 py-4 bg-emerald-50 text-emerald-600 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100 group"
                            >
                                <Plus size={16} strokeWidth={2.5} />
                                Add Tier
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {(postEvent.categories || []).map((cat, idx) => (
                            <div key={cat.id} className="group relative bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 hover:border-emerald-200 transition-all shadow-sm">
                                <button 
                                    onClick={() => {
                                        const newCats = postEvent.categories.filter((_, i) => i !== idx);
                                        setPostEvent(p => ({ ...p, categories: newCats }));
                                    }}
                                    className="absolute -top-3 -right-3 w-10 h-10 bg-white text-slate-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-slate-100 shadow-lg hover:text-red-500 hover:scale-110"
                                >
                                    <Trash2 size={16} />
                                </button>
                                
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                                        <input 
                                            className="bg-transparent text-lg font-black text-slate-900 uppercase tracking-tight w-full focus:outline-none border-b border-transparent focus:border-emerald-200 pb-1"
                                            value={cat.name}
                                            onChange={e => {
                                                const next = [...postEvent.categories];
                                                next[idx].name = e.target.value;
                                                setPostEvent(p => ({ ...p, categories: next }));
                                            }}
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Base Price (₹)</label>
                                            <input 
                                                type="number"
                                                className="w-full bg-white border border-slate-100 text-sm font-black p-4 rounded-2xl text-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                                                value={cat.price}
                                                onChange={e => {
                                                    const next = [...postEvent.categories];
                                                    next[idx].price = parseFloat(e.target.value) || 0;
                                                    setPostEvent(p => ({ ...p, categories: next }));
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Total Slots</label>
                                            <input 
                                                type="number"
                                                className="w-full bg-white border border-slate-100 text-sm font-black p-4 rounded-2xl text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-500/10"
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
                        
                        {(postEvent.categories || []).length === 0 && (
                            <div className="md:col-span-2 py-20 flex flex-col items-center justify-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200 text-slate-400">
                                <Ticket size={48} strokeWidth={1} className="mb-4 opacity-20" />
                                <p className="text-[11px] font-black uppercase tracking-widest">No tiers defined yet</p>
                            </div>
                        )}
                    </div>

                    <div className="pt-10 flex justify-between">
                        <button onClick={prevStep} className="px-10 py-5 text-slate-400 font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:text-slate-900 transition-colors"><ArrowLeft size={18} /> Blueprint Return</button>
                        <button onClick={nextStep} className="px-12 py-5 bg-slate-900 text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:bg-emerald-600 transition-all shadow-2xl">Next: BIB Configuration <ArrowRight size={18} /></button>
                    </div>
                </div>
            )}

            {/* Step 6: BIB Config */}
            {currentStep === 6 && (
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] p-12 space-y-12 animate-in fade-in slide-in-from-right-8 duration-700">
                    <BibConfiguration 
                        config={postEvent.bibConfig || {
                            bib_enabled: false,
                            bib_prefix: "",
                            bib_start_number: 1001,
                            bib_padding: 4,
                            bib_per_category: false,
                            bib_display_on_ticket: true
                        }} 
                        onChange={cfg => setPostEvent(p => ({ ...p, bibConfig: cfg }))} 
                    />
                    <div className="pt-10 flex justify-between">
                        <button onClick={prevStep} className="px-10 py-5 text-slate-400 font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:text-slate-900 transition-colors"><ArrowLeft size={18} /> Ticket Return</button>
                        <button onClick={nextStep} className="px-12 py-5 bg-slate-900 text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:bg-emerald-600 transition-all shadow-2xl">Next: Finalize Launch <ArrowRight size={18} /></button>
                    </div>
                </div>
            )}

            {/* Step 7: Finalize */}
            {currentStep === 7 && (
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] p-12 space-y-12 animate-in zoom-in duration-700">
                    <div className="flex flex-col items-center text-center space-y-8">
                        <div className="w-24 h-24 rounded-[3rem] bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-2xl shadow-pink-500/20 animate-pulse">
                            <Zap size={48} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">{isEditing ? "Ready to Update" : "Initialization Complete"}</h2>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-4">All architectural parameters are within nominal ranges</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-2xl pt-8">
                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Venue</span>
                                <span className="text-[10px] font-black text-slate-900 uppercase truncate block">{postEvent.venue || 'TBD'}</span>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Format</span>
                                <span className="text-[10px] font-black text-slate-900 uppercase block">Physical</span>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Blocks</span>
                                <span className="text-[10px] font-black text-slate-900 uppercase block">{(postEvent.blocks || []).length}</span>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Tiers</span>
                                <span className="text-[10px] font-black text-slate-900 uppercase block">{(postEvent.categories || []).length}</span>
                            </div>
                        </div>

                        <button 
                            onClick={onPublish}
                            className="mt-12 px-20 py-8 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white rounded-[4rem] text-sm font-black uppercase tracking-[0.4em] shadow-2xl shadow-pink-500/40 hover:scale-105 transition-all group relative overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center gap-4">
                                <ShieldCheck size={24} strokeWidth={2.5} />
                                {isEditing ? "Update Event" : "Execute Deployment Sequence"}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        </button>

                        <button onClick={prevStep} className="text-slate-400 hover:text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] transition-colors py-4">Verification Audit: Return to Previous Modules</button>
                    </div>
                </div>
            )}

            {/* Cancel Button */}
            <div className="mt-12 flex justify-center">
                <button onClick={onCancel} className="text-slate-400 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.2em] transition-colors py-4">
                    {isEditing ? "Cancel Update & Return" : "Terminate Initialization & Discard Changes"}
                </button>
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

export default PhysicalEventForm;
