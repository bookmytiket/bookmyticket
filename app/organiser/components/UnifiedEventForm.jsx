"use client";
import React, { useState, useEffect } from "react";
import { 
    Calendar, MapPin, Camera, IndianRupee, Zap, Ticket, Users, 
    Video, ShieldCheck, CheckCircle2, FileText, ArrowRight, ArrowLeft,
    Clock, List, Plus, Trash2, Shield
} from "lucide-react";
import CalendarPicker from "./CalendarPicker";
import TimePicker from "./TimePicker";
import CustomSelect from "./CustomSelect";
import GoogleInlineMap from "./GoogleInlineMap";
import BlockMapDesigner from "./BlockMapDesigner";
import { geocode, reverseGeocode } from "@/lib/googleMaps";
import { COUNTRIES } from "@/app/data/locationData";
import { State, City } from 'country-state-city';
import { getIndianDistricts, getIndianCities } from "@/app/data/indianLocations";
import { supabase } from "@/lib/supabase";

const renderInput = (label, value, onChange, type = "text", placeholder = "", fullWidth = false) => (
    <div className={`space-y-3 ${fullWidth ? 'md:col-span-2' : ''}`}>
        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">{label}</label>
        {type === "date" ? (
            <CalendarPicker value={value || ""} onChange={onChange} placeholder={placeholder || "dd/mm/yyyy"} />
        ) : type === "time" ? (
            <TimePicker value={value || ""} onChange={onChange} placeholder={placeholder || "--:--"} />
        ) : type === "textarea" ? (
            <textarea
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                rows={4}
                className="w-full bg-slate-50/50 border border-slate-100 text-slate-900 text-sm font-bold px-6 py-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-200 transition-all placeholder:text-slate-400"
                placeholder={placeholder}
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

export default function UnifiedEventForm({ postEvent, setPostEvent, onCancel, onPublish, isEditing }) {
    const [currentStep, setCurrentStep] = useState(1);
    
    // Internal mappings for the 11-step process
    const steps = [
        { id: 1, title: "Event Type", icon: List },
        { id: 2, title: "Pricing Model", icon: IndianRupee },
        { id: 3, title: "Ticketing Format", icon: Ticket },
        { id: 4, title: "Event Details", icon: FileText },
        { id: 5, title: "Date & Time", icon: Clock },
        { id: 6, title: "Venue", icon: MapPin },
        { id: 7, title: "Media", icon: Camera },
        { id: 8, title: "Pricing", icon: IndianRupee },
        { id: 9, title: "Capacity", icon: Users },
        { id: 10, title: "Terms", icon: Shield },
        { id: 11, title: isEditing ? "Update" : "Publish", icon: Zap }
    ];

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    // Handle initial state setup
    useEffect(() => {
        if (!postEvent.ticketMode) {
            setPostEvent(prev => ({
                ...prev,
                ticketMode: 'paid', // 'free' or 'paid'
                eventFormat: 'venue', // 'venue' or 'online'
                isReservedSeating: false,
                country: prev.country || "India",
                countryCode: prev.countryCode || "IN"
            }));
        }
    }, []);

    const [dbDistricts, setDbDistricts] = useState([]);
    const [dbCities, setDbCities] = useState([]);

    useEffect(() => {
        const fetchDistricts = async () => {
            if (!postEvent.state || postEvent.country !== "India") return;
            try {
                const { data: stateData } = await supabase.from('states').select('id').eq('name', postEvent.state).maybeSingle();
                if (stateData) {
                    const { data: dists } = await supabase.from('districts').select('name').eq('state_id', stateData.id).order('name');
                    setDbDistricts(dists?.map(d => d.name) || []);
                }
            } catch (err) {}
        };
        fetchDistricts();
    }, [postEvent.state, postEvent.country]);

    useEffect(() => {
        const fetchCities = async () => {
            if (!postEvent.district || postEvent.country !== "India") return;
            try {
                const { data: distData } = await supabase.from('districts').select('id').eq('name', postEvent.district).maybeSingle();
                if (distData) {
                    const { data: cts } = await supabase.from('cities').select('name').eq('district_id', distData.id).order('name');
                    setDbCities(cts?.map(c => c.name) || []);
                }
            } catch (err) {}
        };
        fetchCities();
    }, [postEvent.district, postEvent.country]);

    return (
        <div className="max-w-6xl mx-auto py-12 px-6">
            {/* Horizontal Scrollable Steps Indicator */}
            <div className="flex items-center gap-4 mb-16 overflow-x-auto pb-6 scrollbar-hide">
                {steps.map((s, idx) => (
                    <React.Fragment key={s.id}>
                        <div 
                            onClick={() => currentStep > s.id && setCurrentStep(s.id)}
                            className={`flex flex-col items-center shrink-0 cursor-pointer transition-all duration-300 ${currentStep >= s.id ? 'opacity-100' : 'opacity-40 grayscale'}`}
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${currentStep === s.id ? 'bg-blue-600 shadow-lg shadow-blue-500/30 scale-110' : 'bg-slate-300'}`}>
                                <s.icon size={20} strokeWidth={2} />
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest mt-3 ${currentStep === s.id ? 'text-blue-600' : 'text-slate-500'}`}>{s.title}</span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={`h-1 w-8 shrink-0 rounded-full ${currentStep > s.id ? 'bg-blue-600' : 'bg-slate-100'}`} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] p-12">
                
                {/* Step 1: Event Type */}
                {currentStep === 1 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">1. Event Category & Format</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Classify your event accurately</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <CustomSelect 
                                label="Event Category"
                                value={postEvent.category}
                                options={["Concert", "Marathon", "Cinema", "Sports", "Circus", "Comedy Show", "Conference", "Workshop", "Meetup", "Festival", "Kids Event", "Religious Event", "Exhibition", "College Event", "Corporate Event"]}
                                onChange={(v) => setPostEvent(p => ({ ...p, category: v }))}
                            />
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Event Format</label>
                                <div className="w-full bg-slate-50/50 border border-slate-100 text-slate-900 text-sm font-bold px-6 py-4 rounded-2xl cursor-not-allowed opacity-70">
                                    Venue Event
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end pt-10">
                            <button onClick={nextStep} className="px-10 py-4 bg-blue-600 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest flex items-center gap-3">Next Step <ArrowRight size={16} /></button>
                        </div>
                    </div>
                )}

                {/* Step 2: Pricing Model */}
                {currentStep === 2 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-8">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">2. Pricing Model</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Free or Paid</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <button 
                                onClick={() => setPostEvent(p => ({ ...p, ticketMode: 'free' }))}
                                className={`p-8 rounded-[2rem] border-2 text-left transition-all ${postEvent.ticketMode === 'free' ? 'border-emerald-500 bg-emerald-50 scale-[1.02]' : 'border-slate-100 hover:border-emerald-200 grayscale hover:grayscale-0'}`}
                            >
                                <div className="text-emerald-500 mb-4"><CheckCircle2 size={32} /></div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">FREE EVENT</h3>
                                <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed">No payment gateway required. Direct RSVP / registration.</p>
                            </button>
                            <button 
                                onClick={() => setPostEvent(p => ({ ...p, ticketMode: 'paid' }))}
                                className={`p-8 rounded-[2rem] border-2 text-left transition-all ${postEvent.ticketMode === 'paid' ? 'border-blue-500 bg-blue-50 scale-[1.02]' : 'border-slate-100 hover:border-blue-200 grayscale hover:grayscale-0'}`}
                            >
                                <div className="text-blue-500 mb-4"><IndianRupee size={32} /></div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">PAID EVENT</h3>
                                <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed">Payment required. Gateway integration and invoice generation.</p>
                            </button>
                        </div>
                        <div className="flex justify-between pt-10">
                            <button onClick={prevStep} className="px-8 py-4 text-slate-400 font-bold uppercase text-[10px]"><ArrowLeft size={16} className="inline mr-2" /> Back</button>
                            <button onClick={nextStep} className="px-10 py-4 bg-blue-600 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest flex items-center gap-3">Next Step <ArrowRight size={16} /></button>
                        </div>
                    </div>
                )}

                {/* Step 3: Ticketing Format */}
                {currentStep === 3 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-8">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">3. Ticketing Format</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">GA vs Reserved Seating</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <button 
                                onClick={() => setPostEvent(p => ({ ...p, isReservedSeating: false }))}
                                className={`p-8 rounded-[2rem] border-2 text-left transition-all ${!postEvent.isReservedSeating ? 'border-purple-500 bg-purple-50 scale-[1.02]' : 'border-slate-100 hover:border-purple-200 grayscale hover:grayscale-0'}`}
                            >
                                <div className="text-purple-500 mb-4"><Users size={32} /></div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">GENERAL ADMISSION</h3>
                                <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed">No seat map required. Ticket quantity based booking with capacity limits.</p>
                            </button>
                            <button 
                                onClick={() => setPostEvent(p => ({ ...p, isReservedSeating: true }))}
                                className={`p-8 rounded-[2rem] border-2 text-left transition-all ${postEvent.isReservedSeating ? 'border-orange-500 bg-orange-50 scale-[1.02]' : 'border-slate-100 hover:border-orange-200 grayscale hover:grayscale-0'}`}
                            >
                                <div className="text-orange-500 mb-4"><Ticket size={32} /></div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">RESERVED SEATING</h3>
                                <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed">Seat map required. Dynamic seat selection, locking, and section pricing.</p>
                            </button>
                        </div>
                        <div className="flex justify-between pt-10">
                            <button onClick={prevStep} className="px-8 py-4 text-slate-400 font-bold uppercase text-[10px]"><ArrowLeft size={16} className="inline mr-2" /> Back</button>
                            <button onClick={nextStep} className="px-10 py-4 bg-blue-600 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest flex items-center gap-3">Next Step <ArrowRight size={16} /></button>
                        </div>
                    </div>
                )}

                {/* Step 4: Event Details */}
                {currentStep === 4 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-8">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">4. Event Details</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Core information</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {renderInput("Event Name*", postEvent.title, (v) => setPostEvent(p => ({ ...p, title: v })), "text", "Full title of the event")}
                            {renderInput("Short Title", postEvent.shortTitle, (v) => setPostEvent(p => ({ ...p, shortTitle: v })))}
                            {renderInput("Event Subtitle", postEvent.subtitle, (v) => setPostEvent(p => ({ ...p, subtitle: v })), "text", "Optional catchy subtitle", true)}
                            {renderInput("Description", postEvent.description, (v) => setPostEvent(p => ({ ...p, description: v })), "textarea", "Detailed description...", true)}
                            {renderInput("Language", postEvent.language, (v) => setPostEvent(p => ({ ...p, language: v })))}
                            {renderInput("Age Restriction", postEvent.ageRestriction, (v) => setPostEvent(p => ({ ...p, ageRestriction: v })), "text", "e.g. 18+")}
                        </div>
                        <div className="flex justify-between pt-10">
                            <button onClick={prevStep} className="px-8 py-4 text-slate-400 font-bold uppercase text-[10px]"><ArrowLeft size={16} className="inline mr-2" /> Back</button>
                            <button onClick={nextStep} className="px-10 py-4 bg-blue-600 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest flex items-center gap-3">Next Step <ArrowRight size={16} /></button>
                        </div>
                    </div>
                )}

                {/* Step 5: Date & Time */}
                {currentStep === 5 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-8">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">5. Schedule</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Timeline configuration</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {renderInput("Start Date*", postEvent.startDate, (v) => setPostEvent(p => ({ ...p, startDate: v })), "date")}
                            {renderInput("End Date", postEvent.endDate, (v) => setPostEvent(p => ({ ...p, endDate: v })), "date")}
                            {renderInput("Start Time*", postEvent.startTime, (v) => setPostEvent(p => ({ ...p, startTime: v })), "time")}
                            {renderInput("End Time", postEvent.endTime, (v) => setPostEvent(p => ({ ...p, endTime: v })), "time")}
                        </div>
                        <div className="flex justify-between pt-10">
                            <button onClick={prevStep} className="px-8 py-4 text-slate-400 font-bold uppercase text-[10px]"><ArrowLeft size={16} className="inline mr-2" /> Back</button>
                            <button onClick={nextStep} className="px-10 py-4 bg-blue-600 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest flex items-center gap-3">Next Step <ArrowRight size={16} /></button>
                        </div>
                    </div>
                )}

                {/* Step 6: Venue */}
                {currentStep === 6 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-8">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">6. Venue Details</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Geospatial positioning</p>
                        </div>
                        {postEvent.eventFormat !== 'online' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {renderInput("Venue Name*", postEvent.venue, (v) => setPostEvent(p => ({ ...p, venue: v })), "text", "", true)}
                                {renderInput("Address*", postEvent.address, (v) => setPostEvent(p => ({ ...p, address: v })), "text", "", true)}
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
                                    label="State"
                                    value={postEvent.state}
                                    options={State.getStatesOfCountry(postEvent.countryCode || 'IN').map(s => s.name)}
                                    onChange={(v) => {
                                        const stateObj = State.getStatesOfCountry(postEvent.countryCode || 'IN').find(s => s.name === v);
                                        setPostEvent(p => ({ ...p, state: v, stateCode: stateObj?.isoCode || "", district: "", city: "" }));
                                    }}
                                />
                                {(postEvent.countryCode === "IN" || postEvent.country === "India") && (
                                    <>
                                        <CustomSelect 
                                            label="District"
                                            value={postEvent.district}
                                            options={Array.from(new Set([...dbDistricts, ...getIndianDistricts(postEvent.state)])).sort()}
                                            onChange={(v) => setPostEvent(prev => ({ ...prev, district: v, city: "", zipCode: "" }))}
                                        />
                                        <CustomSelect 
                                            label="City"
                                            value={postEvent.city}
                                            options={Array.from(new Set([...dbCities, ...getIndianCities(postEvent.district)])).sort()}
                                            onChange={async (v) => {
                                                setPostEvent(prev => ({ ...prev, city: v }));
                                                try {
                                                    const coords = await geocode(`${v}, ${postEvent.state}, ${postEvent.country}`);
                                                    if (coords) setPostEvent(prev => ({ ...prev, latitude: coords.lat, longitude: coords.lng }));
                                                } catch (err) {}
                                            }}
                                        />
                                    </>
                                )}
                                {renderInput("Pincode / Zip Code", postEvent.zipCode, (v) => setPostEvent(p => ({ ...p, zipCode: v })))}
                                
                                <div className="md:col-span-2 h-[300px] rounded-3xl overflow-hidden border border-slate-100 shadow-inner">
                                    <GoogleInlineMap 
                                        lat={postEvent.latitude || 20.5937} 
                                        lng={postEvent.longitude || 78.9629}
                                        onLocationSelect={async (lat, lng) => {
                                            setPostEvent(p => ({ ...p, latitude: lat, longitude: lng }));
                                            try {
                                                const geo = await reverseGeocode(lat, lng);
                                                if (geo) {
                                                    setPostEvent(p => ({ 
                                                        ...p, address: geo.fullAddress, city: geo.city, state: geo.state, country: geo.country, zipCode: geo.pincode
                                                    }));
                                                }
                                            } catch (err) {}
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                        {postEvent.eventFormat === 'online' && (
                            <div className="grid grid-cols-1 gap-8">
                                {renderInput("Meeting Link", postEvent.meetingUrl, (v) => setPostEvent(p => ({ ...p, meetingUrl: v })), "url", "https://...")}
                            </div>
                        )}
                        
                        {postEvent.isReservedSeating && (
                            <div className="pt-8">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Arena Seating Designer</label>
                                <BlockMapDesigner postEvent={postEvent} setPostEvent={setPostEvent} />
                            </div>
                        )}
                        
                        <div className="flex justify-between pt-10">
                            <button onClick={prevStep} className="px-8 py-4 text-slate-400 font-bold uppercase text-[10px]"><ArrowLeft size={16} className="inline mr-2" /> Back</button>
                            <button onClick={nextStep} className="px-10 py-4 bg-blue-600 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest flex items-center gap-3">Next Step <ArrowRight size={16} /></button>
                        </div>
                    </div>
                )}

                {/* Step 7: Media */}
                {currentStep === 7 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-8">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">7. Media Upload</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Banners & Branding</p>
                        </div>
                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Event Banner (1200x600)*</label>
                                <input type="file" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                            </div>
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Event Poster (800x1200)</label>
                                <input type="file" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                            </div>
                            {renderInput("Promo Video URL", postEvent.promoVideoUrl, (v) => setPostEvent(p => ({ ...p, promoVideoUrl: v })), "url", "YouTube / Vimeo link")}
                        </div>
                        <div className="flex justify-between pt-10">
                            <button onClick={prevStep} className="px-8 py-4 text-slate-400 font-bold uppercase text-[10px]"><ArrowLeft size={16} className="inline mr-2" /> Back</button>
                            <button onClick={nextStep} className="px-10 py-4 bg-blue-600 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest flex items-center gap-3">Next Step <ArrowRight size={16} /></button>
                        </div>
                    </div>
                )}

                {/* Step 8 & 9 Combined: Pricing & Capacity */}
                {currentStep === 8 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-8">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">8. Pricing & Capacity</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{postEvent.ticketMode === 'free' ? 'Free Event Limits' : 'Ticket Tiers'}</p>
                        </div>
                        <div className="space-y-6">
                            {(postEvent.categories || []).map((cat, idx) => (
                                <div key={idx} className="flex flex-col md:flex-row gap-4 p-6 border border-slate-100 rounded-2xl items-end relative">
                                    <button 
                                        onClick={() => {
                                            const next = postEvent.categories.filter((_, i) => i !== idx);
                                            setPostEvent(p => ({ ...p, categories: next }));
                                        }}
                                        className="absolute top-4 right-4 text-slate-300 hover:text-red-500"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <div className="flex-1 w-full">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Category Name</label>
                                        <input className="w-full bg-slate-50 p-3 rounded-xl border-none focus:ring-2 focus:ring-blue-100 font-bold text-sm text-slate-900" value={cat.name} onChange={e => {
                                            const c = [...postEvent.categories]; c[idx].name = e.target.value; setPostEvent(p => ({ ...p, categories: c }));
                                        }} />
                                    </div>
                                    {postEvent.ticketMode !== 'free' && (
                                        <div className="w-full md:w-1/4">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Price (₹)</label>
                                            <input type="number" className="w-full bg-slate-50 p-3 rounded-xl border-none focus:ring-2 focus:ring-blue-100 font-bold text-sm text-slate-900" value={cat.price} onChange={e => {
                                                const c = [...postEvent.categories]; c[idx].price = e.target.value; setPostEvent(p => ({ ...p, categories: c }));
                                            }} />
                                        </div>
                                    )}
                                    <div className="w-full md:w-1/4">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Capacity</label>
                                        <input type="number" className="w-full bg-slate-50 p-3 rounded-xl border-none focus:ring-2 focus:ring-blue-100 font-bold text-sm text-slate-900" value={cat.totalSlots} onChange={e => {
                                            const c = [...postEvent.categories]; c[idx].totalSlots = e.target.value; setPostEvent(p => ({ ...p, categories: c }));
                                        }} />
                                    </div>
                                </div>
                            ))}
                            <button 
                                onClick={() => {
                                    setPostEvent(p => ({ ...p, categories: [...(p.categories || []), { name: "Standard", price: postEvent.ticketMode === 'free' ? 0 : 500, totalSlots: 100 }] }));
                                }}
                                className="w-full py-4 border-2 border-dashed border-slate-200 text-slate-500 rounded-2xl font-bold text-xs uppercase tracking-widest hover:border-blue-300 hover:text-blue-500 transition-colors flex justify-center gap-2"
                            >
                                <Plus size={16} /> Add Ticket Category
                            </button>
                        </div>
                        <div className="flex justify-between pt-10">
                            <button onClick={prevStep} className="px-8 py-4 text-slate-400 font-bold uppercase text-[10px]"><ArrowLeft size={16} className="inline mr-2" /> Back</button>
                            <button onClick={(e) => { nextStep(); nextStep(); }} className="px-10 py-4 bg-blue-600 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest flex items-center gap-3">Next Step <ArrowRight size={16} /></button>
                        </div>
                    </div>
                )}

                {/* Step 10: Terms */}
                {currentStep === 10 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-8">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">10. Terms & Policies</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Rules for attendees</p>
                        </div>
                        <div className="grid grid-cols-1 gap-8">
                            {renderInput("Refund Policy", postEvent.refundPolicy, (v) => setPostEvent(p => ({ ...p, refundPolicy: v })), "textarea", "Cancellation and refund rules...")}
                            {renderInput("Entry Rules", postEvent.entryRules, (v) => setPostEvent(p => ({ ...p, entryRules: v })), "textarea", "What to bring, gate closing times...")}
                        </div>
                        <div className="flex justify-between pt-10">
                            <button onClick={() => { prevStep(); prevStep(); }} className="px-8 py-4 text-slate-400 font-bold uppercase text-[10px]"><ArrowLeft size={16} className="inline mr-2" /> Back</button>
                            <button onClick={nextStep} className="px-10 py-4 bg-blue-600 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest flex items-center gap-3">Final Review <ArrowRight size={16} /></button>
                        </div>
                    </div>
                )}

                {/* Step 11: Publish */}
                {currentStep === 11 && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-right-8 text-center py-10">
                        <div className="w-24 h-24 rounded-[3rem] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-blue-500/20 mx-auto">
                            <Zap size={48} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">
                                {postEvent.status === 'approved' ? "Event Approved" : (postEvent.status === 'pending_review' ? "Pending Review" : "Event Configuration")}
                            </h2>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-4">
                                {postEvent.status === 'approved' ? "Ready to publish to the public" : "Save as draft or submit for admin review"}
                            </p>
                        </div>
                        
                        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-8">
                            {(!postEvent.status || postEvent.status === 'draft' || postEvent.status === 'changes_requested' || postEvent.status === 'rejected') && (
                                <>
                                    <button 
                                        onClick={() => { setPostEvent(p => ({ ...p, eventStatus: 'draft' })); onPublish('draft'); }}
                                        className="px-12 py-6 bg-slate-100 text-slate-600 border border-slate-200 rounded-[4rem] text-sm font-black uppercase tracking-[0.2em] shadow-sm hover:bg-slate-200 transition-all"
                                    >
                                        Save Draft
                                    </button>
                                    <button 
                                        onClick={() => { setPostEvent(p => ({ ...p, eventStatus: 'pending_review' })); onPublish('pending_review'); }}
                                        className="px-12 py-6 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-[4rem] text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-orange-500/30 hover:scale-105 transition-all"
                                    >
                                        Submit for Review
                                    </button>
                                </>
                            )}

                            {postEvent.status === 'pending_review' && (
                                <button 
                                    disabled
                                    className="px-12 py-6 bg-amber-100 text-amber-700 border border-amber-200 rounded-[4rem] text-sm font-black uppercase tracking-[0.2em] shadow-sm cursor-not-allowed"
                                >
                                    Under Admin Review
                                </button>
                            )}

                            {postEvent.status === 'approved' && (
                                <button 
                                    onClick={() => { setPostEvent(p => ({ ...p, eventStatus: 'published' })); onPublish('published'); }}
                                    className="px-12 py-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-[4rem] text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/30 hover:scale-105 transition-all"
                                >
                                    Publish Event
                                </button>
                            )}
                        </div>
                        <div>
                            <button onClick={prevStep} className="text-slate-400 hover:text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] transition-colors">Return to Edit</button>
                        </div>
                    </div>
                )}

            </div>
            
            <div className="mt-12 flex justify-center">
                <button onClick={onCancel} className="text-slate-400 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.2em] transition-colors py-4">
                    {isEditing ? "Cancel Update" : "Discard Event"}
                </button>
            </div>
        </div>
    );
}
