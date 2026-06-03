"use client";
import React, { useState, useEffect } from "react";
import { 
    Trophy, Users, MapPin, ClipboardList, Zap, ArrowLeft, ArrowRight,
    Trash2, Plus, Image as ImageIcon, CheckCircle2, FileCheck, Target,
    Award, Shield, Camera, UploadCloud, DollarSign, Activity, Calendar
} from "lucide-react";
import CalendarPicker from "./CalendarPicker";
import TimePicker from "./TimePicker";
import GoogleInlineMap from "./GoogleInlineMap";
import CustomSelect from "./CustomSelect";
import { reverseGeocode, geocode } from "@/lib/googleMaps";
import { COUNTRIES } from "@/app/data/locationData";
import { State, City } from 'country-state-city';
import { getIndianDistricts, getIndianCities } from "@/app/data/indianLocations";
import { supabase } from "@/lib/supabase";

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
        ) : type === "textarea" ? (
            <textarea 
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-100 text-slate-900 text-sm font-bold px-6 py-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-200 transition-all min-h-[120px]"
                placeholder={placeholder}
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

const SPORT_TYPES = ["Badminton", "Cricket", "Football", "Basketball", "Volleyball", "Tennis", "Chess", "Swimming", "Athletics", "Marathon", "Kabaddi", "Table Tennis", "Hockey"];
const FORMATS = ["Singles", "Doubles", "Team Event", "Relay Event", "League", "Knockout", "League + Knockout"];
const SPONSOR_TYPES = ["Title Sponsor", "Gold Sponsor", "Silver Sponsor", "Associate Sponsor", "Media Partner"];

const TournamentEventForm = ({ postEvent, setPostEvent, onCancel, onPublish, isEditing }) => {
    const [currentStep, setCurrentStep] = useState(1);

    useEffect(() => {
        if (!postEvent.sportType) {
            setPostEvent(prev => ({ 
                ...prev, 
                type: "Tournament", 
                category: "Sports",
                categories: prev.categories || [],
                sponsors: prev.sponsors || [],
                reqAadhaar: prev.reqAadhaar || false,
                reqSchoolId: prev.reqSchoolId || false,
                reqPassport: prev.reqPassport || false,
                reqAgeProof: prev.reqAgeProof || false,
                reqMedicalCert: prev.reqMedicalCert || false,
                hasTrophy: prev.hasTrophy || false,
                hasMedal: prev.hasMedal || false,
                hasCertificate: prev.hasCertificate || false,
                hasParticipationKit: prev.hasParticipationKit || false,
                participationType: prev.participationType || "Individual",
                registrationType: prev.registrationType || "Paid",
                country: prev.country || "India",
                countryCode: prev.countryCode || "IN"
            }));
        } else {
            // Hydrate stateCode if missing
            if (postEvent.state && !postEvent.stateCode && (postEvent.countryCode || "IN")) {
                const stateObj = State.getStatesOfCountry(postEvent.countryCode || "IN").find(s => s.name === postEvent.state);
                if (stateObj) {
                    setPostEvent(prev => ({ ...prev, stateCode: stateObj.isoCode }));
                }
            }
            if (postEvent.country && !postEvent.countryCode) {
                const countryData = COUNTRIES.find(c => (c.label || c) === postEvent.country);
                if (countryData) {
                    setPostEvent(prev => ({ ...prev, countryCode: countryData.code }));
                }
            }
        }
    }, [postEvent.state, postEvent.country, postEvent.sportType]);

    const steps = [
        { id: 1, title: "Basic Info", icon: Trophy },
        { id: 2, title: "Config", icon: Target },
        { id: 3, title: "Categories", icon: Users },
        { id: 4, title: "Schedule", icon: Calendar },
        { id: 5, title: "Awards", icon: Award },
        { id: 6, title: "Requirements", icon: FileCheck },
        { id: 7, title: "Sponsors", icon: DollarSign },
        { id: 8, title: "Review", icon: CheckCircle2 }
    ];

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const renderImageUpload = (key, label, recommendation) => (
        <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">{label}</label>
            <div className="relative group h-48 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden hover:border-pink-300 transition-all flex items-center justify-center">
                {postEvent[key] ? (
                    <>
                        <img src={postEvent[key]} className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button onClick={() => setPostEvent(p => ({ ...p, [key]: "" }))} className="p-3 bg-white/20 backdrop-blur-xl rounded-2xl text-white hover:bg-red-500 transition-all">
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </>
                ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-3">
                        <ImageIcon size={24} className="text-slate-400 group-hover:text-pink-500 transition-colors" />
                        <span className="text-[10px] font-black uppercase text-slate-500">Upload {label}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase">{recommendation}</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => setPostEvent(p => ({ ...p, [key]: ev.target.result }));
                                reader.readAsDataURL(file);
                            }
                        }} />
                    </label>
                )}
            </div>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto py-12 px-6">
            {/* Steps Header */}
            <div className="flex items-center justify-between mb-12 overflow-x-auto pb-4 scrollbar-hide">
                {steps.map((s, idx) => (
                    <React.Fragment key={s.id}>
                        <div className="flex flex-col items-center gap-2 shrink-0 cursor-pointer" onClick={() => currentStep > s.id && setCurrentStep(s.id)}>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${currentStep >= s.id ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                                <s.icon size={20} />
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${currentStep >= s.id ? 'text-pink-600' : 'text-slate-400'}`}>{s.title}</span>
                        </div>
                        {idx < steps.length - 1 && <div className={`w-full h-1 mx-2 rounded-full ${currentStep > s.id ? 'bg-pink-500' : 'bg-slate-100'}`} />}
                    </React.Fragment>
                ))}
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] p-10 animate-in fade-in duration-500">
                {/* Step 1: Basic Info */}
                {currentStep === 1 && (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-black uppercase italic text-slate-900">1. Basic Event Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {renderInput("Tournament Name", postEvent.title, (v) => setPostEvent(p => ({ ...p, title: v })), "text", "e.g. National Championship", true)}
                            {renderImageUpload("bannerPreview", "Event Banner", "1200x600")}
                            {renderImageUpload("posterPreview", "Event Poster", "800x1200")}
                            {renderInput("Organizer Name", postEvent.organiser_name, (v) => setPostEvent(p => ({ ...p, organiser_name: v })))}
                            {renderImageUpload("organizerLogo", "Organizer Logo", "400x400")}
                            
                            <div className="md:col-span-2 space-y-4 pt-4">
                                <h3 className="text-lg font-black uppercase text-slate-800">Venue Details</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Country</label>
                                        <CustomSelect
                                            value={postEvent.country || "India"}
                                            options={COUNTRIES.map(c => c.label || c)}
                                            onChange={(v) => {
                                                const countryData = COUNTRIES.find(c => (c.label || c) === v);
                                                const code = countryData?.code || "IN";
                                                setPostEvent(prev => ({
                                                    ...prev,
                                                    country: v,
                                                    countryCode: code,
                                                    state: "", stateCode: "", district: "", city: ""
                                                }));
                                            }}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">State / Province</label>
                                        <CustomSelect
                                            value={postEvent.state || ""}
                                            options={State.getStatesOfCountry(postEvent.countryCode || "IN").map(s => s.name)}
                                            onChange={(v) => {
                                                const stateObj = State.getStatesOfCountry(postEvent.countryCode || "IN").find(s => s.name === v);
                                                setPostEvent(prev => ({
                                                    ...prev,
                                                    state: v,
                                                    stateCode: stateObj?.isoCode || "",
                                                    district: "", city: ""
                                                }));
                                            }}
                                        />
                                    </div>

                                    {(postEvent.countryCode || "IN") === "IN" ? (
                                        <div className="space-y-3">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">District</label>
                                            <CustomSelect
                                                value={postEvent.district || ""}
                                                options={postEvent.state ? getIndianDistricts(postEvent.state) : []}
                                                onChange={(v) => setPostEvent(prev => ({ ...prev, district: v, city: "" }))}
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">City</label>
                                            <CustomSelect
                                                value={postEvent.city || ""}
                                                options={City.getCitiesOfState(postEvent.countryCode || "IN", postEvent.stateCode || "").map(c => c.name)}
                                                onChange={(v) => setPostEvent(prev => ({ ...prev, city: v }))}
                                            />
                                        </div>
                                    )}

                                    {(postEvent.countryCode || "IN") === "IN" && (
                                        <div className="space-y-3">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">City</label>
                                            <CustomSelect
                                                value={postEvent.city || ""}
                                                options={postEvent.district ? getIndianCities(postEvent.state, postEvent.district) : []}
                                                onChange={(v) => setPostEvent(prev => ({ ...prev, city: v }))}
                                            />
                                        </div>
                                    )}
                                </div>
                                
                                <div className="space-y-3 mb-6 max-w-sm">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Pincode / Zip Code</label>
                                    <input 
                                        type="text"
                                        value={postEvent.zipCode || ""}
                                        onChange={(e) => setPostEvent(prev => ({ ...prev, zipCode: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 shadow-inner"
                                        placeholder=""
                                    />
                                </div>

                                <div className="h-[400px] w-full rounded-[2rem] overflow-hidden border border-slate-200 shadow-2xl relative mb-6">
                                    <GoogleInlineMap 
                                        lat={postEvent.latitude || 20.5937} 
                                        lng={postEvent.longitude || 78.9629}
                                        onLocationSelect={async (lat, lng) => {
                                            setPostEvent(prev => ({
                                                ...prev,
                                                latitude: lat,
                                                longitude: lng
                                            }));
                                            // Auto-reverse geocode not fully implemented here but can be added if needed
                                        }}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {renderInput("Venue Name", postEvent.venue, (v) => setPostEvent(p => ({ ...p, venue: v })))}
                                    {renderInput("Google Map Link", postEvent.googleMapUrl, (v) => setPostEvent(p => ({ ...p, googleMapUrl: v })), "url", "https://maps.app.goo.gl/...")}
                                    {renderInput("Full Address", postEvent.address, (v) => setPostEvent(p => ({ ...p, address: v })), "text", "", true)}
                                </div>
                            </div>
                            
                            {renderInput("Event Description", postEvent.description, (v) => setPostEvent(p => ({ ...p, description: v })), "textarea", "Full details...", true)}
                            {renderInput("Terms & Conditions", postEvent.termsConditions, (v) => setPostEvent(p => ({ ...p, termsConditions: v })), "textarea", "Rules...", true)}
                        </div>
                    </div>
                )}

                {/* Step 2: Config */}
                {currentStep === 2 && (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-black uppercase italic text-slate-900">2. Tournament Configuration</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Sport Type</label>
                                <CustomSelect value={postEvent.sportType} options={SPORT_TYPES} onChange={(v) => setPostEvent(p => ({ ...p, sportType: v }))} />
                            </div>
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Tournament Format</label>
                                <CustomSelect value={postEvent.tournamentFormat} options={FORMATS} onChange={(v) => setPostEvent(p => ({ ...p, tournamentFormat: v }))} />
                            </div>
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Participation Type</label>
                                <CustomSelect value={postEvent.participationType} options={["Individual", "Team"]} onChange={(v) => setPostEvent(p => ({ ...p, participationType: v }))} />
                            </div>
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Registration Type</label>
                                <CustomSelect value={postEvent.registrationType} options={["Paid", "Free"]} onChange={(v) => setPostEvent(p => ({ ...p, registrationType: v }))} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Categories */}
                {currentStep === 3 && (
                    <div className="space-y-8">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-black uppercase italic text-slate-900">3. Categories</h2>
                            <button onClick={() => {
                                setPostEvent(p => ({ ...p, categories: [...(p.categories || []), { id: Date.now(), title: "", ageGroup: "", gender: "Any", fee: 0, capacity: 64, prize: "", description: "" }] }));
                            }} className="px-6 py-3 bg-pink-100 text-pink-600 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <Plus size={16} /> Add Category
                            </button>
                        </div>
                        <div className="space-y-6">
                            {(postEvent.categories || []).map((cat, idx) => (
                                <div key={cat.id || idx} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl relative">
                                    <button onClick={() => setPostEvent(p => ({ ...p, categories: p.categories.filter((_, i) => i !== idx) }))} className="absolute top-4 right-4 text-red-400 hover:text-red-600">
                                        <Trash2 size={20} />
                                    </button>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
                                        <div className="col-span-2 md:col-span-4 space-y-2">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Category Title</label>
                                            <input className="w-full bg-white px-4 py-3 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20" placeholder="e.g. U-19 Boys Singles" value={cat.title} onChange={e => { const c = [...postEvent.categories]; c[idx].title = e.target.value; setPostEvent(p => ({ ...p, categories: c })); }} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Age Group</label>
                                            <div className="w-full">
                                                <CustomSelect 
                                                    value={cat.ageGroup} 
                                                    options={["U-9", "U-11", "U-13", "U-15", "U-17", "U-19", "Men's Open", "Women's Open", "35+", "45+", "Open"]} 
                                                    placeholder="Select or Type..."
                                                    onChange={v => { const c = [...postEvent.categories]; c[idx].ageGroup = v; setPostEvent(p => ({ ...p, categories: c })); }} 
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Gender</label>
                                            <div className="w-full">
                                                <CustomSelect 
                                                    value={cat.gender} 
                                                    options={["Boys", "Girls", "Men", "Women", "Mixed", "Open"]} 
                                                    placeholder="Select..."
                                                    onChange={v => { const c = [...postEvent.categories]; c[idx].gender = v; setPostEvent(p => ({ ...p, categories: c })); }} 
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Fee (₹)</label>
                                            <input className="w-full bg-white px-4 py-3 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20" placeholder="0" type="number" value={cat.fee} onChange={e => { const c = [...postEvent.categories]; c[idx].fee = e.target.value; setPostEvent(p => ({ ...p, categories: c })); }} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Capacity</label>
                                            <input className="w-full bg-white px-4 py-3 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20" placeholder="Max slots" type="number" value={cat.capacity} onChange={e => { const c = [...postEvent.categories]; c[idx].capacity = e.target.value; setPostEvent(p => ({ ...p, categories: c })); }} />
                                        </div>
                                        <div className="col-span-2 md:col-span-4 space-y-2">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Prize Details</label>
                                            <input className="w-full bg-white px-4 py-3 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20" placeholder="e.g. ₹5000 + Trophy" value={cat.prize} onChange={e => { const c = [...postEvent.categories]; c[idx].prize = e.target.value; setPostEvent(p => ({ ...p, categories: c })); }} />
                                        </div>
                                        <div className="col-span-2 md:col-span-4 space-y-2">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Description</label>
                                            <textarea className="w-full bg-white px-4 py-3 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20" placeholder="Additional details..." value={cat.description} onChange={e => { const c = [...postEvent.categories]; c[idx].description = e.target.value; setPostEvent(p => ({ ...p, categories: c })); }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 4: Schedule */}
                {currentStep === 4 && (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-black uppercase italic text-slate-900">4. Tournament Schedule</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {renderInput("Registration Open Date", postEvent.registrationStartDate, (v) => setPostEvent(p => ({ ...p, registrationStartDate: v })), "date")}
                            {renderInput("Registration Close Date", postEvent.registrationEndDate, (v) => setPostEvent(p => ({ ...p, registrationEndDate: v })), "date")}
                            {renderInput("Tournament Start Date", postEvent.startDate, (v) => setPostEvent(p => ({ ...p, startDate: v })), "date")}
                            {renderInput("Reporting Time", postEvent.reportingTime, (v) => setPostEvent(p => ({ ...p, reportingTime: v })), "time")}
                            {renderInput("Start Time", postEvent.startTime, (v) => setPostEvent(p => ({ ...p, startTime: v })), "time")}
                        </div>
                    </div>
                )}

                {/* Step 5: Awards */}
                {currentStep === 5 && (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-black uppercase italic text-slate-900">5. Awards & Prizes</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {renderInput("Winner Prize", postEvent.winnerPrize, (v) => setPostEvent(p => ({ ...p, winnerPrize: v })))}
                            {renderInput("Runner-Up Prize", postEvent.runnerUpPrize, (v) => setPostEvent(p => ({ ...p, runnerUpPrize: v })))}
                            {renderInput("Semi-Final Prize", postEvent.semiFinalPrize, (v) => setPostEvent(p => ({ ...p, semiFinalPrize: v })))}
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            {[
                                { k: "hasTrophy", l: "Trophy" },
                                { k: "hasMedal", l: "Medal" },
                                { k: "hasCertificate", l: "Certificate" },
                                { k: "hasParticipationKit", l: "Participation Kit" }
                            ].map(item => (
                                <label key={item.k} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer">
                                    <input type="checkbox" checked={postEvent[item.k]} onChange={e => setPostEvent(p => ({ ...p, [item.k]: e.target.checked }))} className="w-5 h-5 rounded text-pink-500" />
                                    <span className="text-sm font-bold uppercase tracking-wide text-slate-800">{item.l}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 6: Requirements */}
                {currentStep === 6 && (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-black uppercase italic text-slate-900">6. Participant Requirements</h2>
                        <p className="text-sm font-bold text-slate-500">Select documents required from participants during registration.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { k: "reqAadhaar", l: "Aadhaar Upload" },
                                { k: "reqSchoolId", l: "School ID Upload" },
                                { k: "reqPassport", l: "Passport Upload" },
                                { k: "reqAgeProof", l: "Age Proof" },
                                { k: "reqMedicalCert", l: "Medical Certificate" }
                            ].map(item => (
                                <label key={item.k} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer border border-slate-100 hover:border-pink-200">
                                    <input type="checkbox" checked={postEvent[item.k]} onChange={e => setPostEvent(p => ({ ...p, [item.k]: e.target.checked }))} className="w-5 h-5 rounded text-pink-500" />
                                    <span className="text-sm font-bold uppercase tracking-wide text-slate-800">{item.l}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 7: Sponsors */}
                {currentStep === 7 && (
                    <div className="space-y-8">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-black uppercase italic text-slate-900">7. Sponsor Management</h2>
                            <button onClick={() => {
                                setPostEvent(p => ({ ...p, sponsors: [...(p.sponsors || []), { id: Date.now(), type: "Gold Sponsor", name: "", logo: "" }] }));
                            }} className="px-6 py-3 bg-pink-100 text-pink-600 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <Plus size={16} /> Add Sponsor
                            </button>
                        </div>
                        <div className="space-y-6">
                            {(postEvent.sponsors || []).map((spon, idx) => (
                                <div key={spon.id || idx} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl relative grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <button onClick={() => setPostEvent(p => ({ ...p, sponsors: p.sponsors.filter((_, i) => i !== idx) }))} className="absolute top-4 right-4 text-red-400 hover:text-red-600">
                                        <Trash2 size={20} />
                                    </button>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sponsor Type</label>
                                        <div className="w-full">
                                            <CustomSelect 
                                                value={spon.type} 
                                                options={SPONSOR_TYPES} 
                                                placeholder="Select Type..."
                                                onChange={v => { const s = [...postEvent.sponsors]; s[idx].type = v; setPostEvent(p => ({ ...p, sponsors: s })); }} 
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sponsor Name</label>
                                        <input className="w-full bg-white px-4 py-3 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 border border-slate-200 outline-none focus:ring-2 focus:ring-pink-500/20" placeholder="e.g. Acme Corp" value={spon.name} onChange={e => { const s = [...postEvent.sponsors]; s[idx].name = e.target.value; setPostEvent(p => ({ ...p, sponsors: s })); }} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Logo</label>
                                        {spon.logo ? (
                                            <div className="relative h-12 w-full rounded-xl overflow-hidden bg-white border border-slate-200 flex items-center justify-center">
                                                <img src={spon.logo} className="h-full object-contain" />
                                                <button onClick={() => { const s = [...postEvent.sponsors]; s[idx].logo = ""; setPostEvent(p => ({ ...p, sponsors: s })); }} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                                            </div>
                                        ) : (
                                            <label className="flex items-center justify-center gap-2 w-full h-12 bg-white hover:bg-pink-50 border border-slate-200 hover:border-pink-200 text-slate-500 hover:text-pink-600 transition-colors text-xs font-bold py-2 px-4 rounded-xl cursor-pointer">
                                                <UploadCloud size={16} />
                                                <span>Upload Logo</span>
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onload = (ev) => { const s = [...postEvent.sponsors]; s[idx].logo = ev.target.result; setPostEvent(p => ({ ...p, sponsors: s })); };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }} />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {/* Step 8: Review & Publish */}
                {currentStep === 8 && (
                    <div className="space-y-8">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-black uppercase italic text-slate-900">8. Review & Publish</h2>
                        </div>
                        <div className="p-8 bg-slate-50 border border-slate-100 rounded-3xl space-y-8">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Tournament Name</p>
                                    <p className="text-sm font-bold text-slate-900">{postEvent.tournamentName || "Not Provided"}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Sport Type</p>
                                    <p className="text-sm font-bold text-slate-900">{postEvent.sportType || "Not Selected"}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Venue</p>
                                    <p className="text-sm font-bold text-slate-900">{postEvent.venue || "Not Provided"}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Categories</p>
                                    <p className="text-sm font-bold text-slate-900">{postEvent.categories?.length || 0} Categories</p>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-200">
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">Readiness Checklist</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 size={18} className={postEvent.tournamentName ? "text-green-500" : "text-slate-300"} />
                                        <span className={`text-xs font-bold ${postEvent.tournamentName ? "text-slate-700" : "text-slate-400"}`}>Basic Details Complete</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 size={18} className={postEvent.categories?.length > 0 ? "text-green-500" : "text-slate-300"} />
                                        <span className={`text-xs font-bold ${postEvent.categories?.length > 0 ? "text-slate-700" : "text-slate-400"}`}>Categories Added</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 size={18} className={postEvent.startDate && postEvent.registrationEndDate ? "text-green-500" : "text-slate-300"} />
                                        <span className={`text-xs font-bold ${postEvent.startDate && postEvent.registrationEndDate ? "text-slate-700" : "text-slate-400"}`}>Schedule Confirmed</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 size={18} className={postEvent.banner ? "text-green-500" : "text-slate-300"} />
                                        <span className={`text-xs font-bold ${postEvent.banner ? "text-slate-700" : "text-slate-400"}`}>Media Uploaded</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* Footer Controls */}
                <div className="flex justify-between items-center mt-12 pt-8 border-t border-slate-100">
                    <button onClick={currentStep === 1 ? onCancel : prevStep} className="px-8 py-4 text-slate-500 hover:text-slate-900 font-black uppercase tracking-widest text-xs flex items-center gap-3">
                        {currentStep === 1 ? "Cancel" : <><ArrowLeft size={16} /> Back</>}
                    </button>
                    {currentStep < steps.length ? (
                        <button onClick={nextStep} className="px-10 py-4 bg-slate-900 hover:bg-pink-600 text-white rounded-full font-black uppercase tracking-widest text-xs flex items-center gap-3 transition-colors">
                            Next <ArrowRight size={16} />
                        </button>
                    ) : (
                        <button onClick={() => onPublish("pending_approval")} className="px-12 py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:scale-105 text-white rounded-full font-black uppercase tracking-widest text-xs flex items-center gap-3 transition-transform shadow-xl shadow-pink-500/30">
                            {isEditing ? "Update Details" : "Submit For Approval"} <CheckCircle2 size={18} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TournamentEventForm;
