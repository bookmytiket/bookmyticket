"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from '@/components/AuthContext';
import { 
    Trophy, Activity, Goal, Users, ArrowLeft, ArrowRight, Settings, 
    Calendar, Clock, MapPin, DollarSign, Shield, CheckCircle2,
    ChevronRight, Info, HeartPulse, GraduationCap, Briefcase, Timer, Target,
    Bike, Award, Utensils, Shirt, Coffee, Car, Smile, Camera, Home, FileText,
    TrendingUp, Trash2, Trash, Zap, Map, Layout, ListTodo, MessageCircle, 
    Save, Eye, Globe, Lock, Share2, Phone, Mail, Bell, Gift, Scissors, HelpCircle, Ticket, ShieldCheck, Plus, ChevronDown, Wallet, Sparkles, Search
} from "lucide-react";
import CalendarPicker from "./CalendarPicker";
import TimePicker from "./TimePicker";
import GoogleInlineMap from "./GoogleInlineMap";
import { Country, State, City } from 'country-state-city';
import { INDIAN_STATES, getIndianDistricts, getIndianCities } from "@/app/data/indianLocations";
import { COUNTRIES } from "@/app/data/locationData";
import CustomSelect from "./CustomSelect";
import { supabase } from "@/lib/supabase";
import { reverseGeocode, geocode } from "@/lib/googleMaps";
import { useToast } from "@/context/ToastContext";
import LocationSelectionModal from "@/components/LocationSelectionModal";

const renderInput = (label, value, onChange, type = "text", placeholder = "") => (
    <div className="space-y-2">
        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest pl-1">{label}</label>
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
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 shadow-inner transition-all placeholder:text-slate-800"
                placeholder={placeholder}
            />
        )}
    </div>
);


const TicketCard = ({ category, index, config, updateConfig }) => (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative group hover:border-pink-200 transition-all">
        <button 
            onClick={() => {
                updateConfig('categories', prev => prev.filter((_, i) => i !== index));
            }}
            className="absolute -top-2 -right-2 w-8 h-8 bg-red-50 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-red-100"
        >
            <Trash2 size={14} />
        </button>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Category Name</label>
                <input 
                    className="w-full bg-slate-50 border border-slate-100 text-sm font-black p-3 rounded-xl text-slate-900 placeholder:text-slate-800"
                    placeholder="e.g. Standard Entry"
                    value={category.name}
                    onChange={e => {
                        const newCats = [...config.categories];
                        newCats[index].name = e.target.value;
                        updateConfig('categories', newCats);
                    }}
                />
            </div>
            <CustomSelect 
                label="Gender"
                value={category.gender}
                options={["All", "Men", "Women"]}
                onChange={v => {
                    const newCats = [...config.categories];
                    newCats[index].gender = v;
                    updateConfig('categories', newCats);
                }}
            />
            <CustomSelect 
                label="Status"
                value={category.status || "Open"}
                options={["Open", "Sold Out", "Fast Filling"]}
                onChange={v => {
                    const newCats = [...config.categories];
                    newCats[index].status = v;
                    updateConfig('categories', newCats);
                }}
            />
            {/* Category-based price removed in favor of Age-based pricing */}
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Total Slots</label>
                <input 
                    type="number"
                    className="w-full bg-slate-50 border border-slate-100 text-sm font-black p-3 rounded-xl text-slate-900 placeholder:text-slate-800"
                    placeholder="500"
                    value={category.totalSlots}
                    onChange={e => {
                        const newCats = [...config.categories];
                        newCats[index].totalSlots = parseInt(e.target.value) || 0;
                        updateConfig('categories', newCats);
                    }}
                />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#ec4899] uppercase tracking-widest">Ticket Price (₹)</label>
                <input 
                    type="number"
                    className="w-full bg-pink-50 border border-pink-100 text-sm font-black p-3 rounded-xl text-[#ec4899]"
                    value={category.price}
                    onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        const newCats = [...config.categories];
                        newCats[index].price = val;
                        updateConfig('categories', newCats);
                        // Also update the top-level config price for non-seating display
                        if (index === 0) {
                            setConfig(prev => ({ ...prev, price: val }));
                        }
                    }}
                />
            </div>
            <div className="md:col-span-2 space-y-3">
                <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Prize Distribution</label>
                    <button 
                        onClick={() => {
                            const newCats = [...config.categories];
                            if (!newCats[index].prizes) newCats[index].prizes = [];
                            newCats[index].prizes.push({ label: `${newCats[index].prizes.length + 1}${['st', 'nd', 'rd'][newCats[index].prizes.length] || 'th'} Prize`, value: "" });
                            updateConfig('categories', newCats);
                        }}
                        className="text-[10px] font-black text-pink-500 uppercase tracking-widest hover:underline"
                    >
                        + Add Prize
                    </button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                    {(category.prizes || []).map((prize, pIdx) => (
                        <div key={pIdx} className="flex gap-2 items-center group">
                            <input 
                                className="w-1/3 bg-white border border-slate-200 text-[10px] font-black uppercase p-3 rounded-xl focus:ring-2 focus:ring-pink-500/20 text-slate-900 placeholder:text-slate-800"
                                value={prize.label}
                                onChange={e => {
                                    const newCats = [...config.categories];
                                    newCats[index].prizes[pIdx].label = e.target.value;
                                    updateConfig('categories', newCats);
                                }}
                            />
                            <input 
                                className="flex-1 bg-white border border-slate-200 text-sm font-black p-3 rounded-xl focus:ring-2 focus:ring-pink-500/20 text-slate-900 placeholder:text-slate-800"
                                placeholder="e.g. ₹5,000/-"
                                value={prize.value}
                                onChange={e => {
                                    const newCats = [...config.categories];
                                    newCats[index].prizes[pIdx].value = e.target.value;
                                    updateConfig('categories', newCats);
                                }}
                            />
                            <button 
                                onClick={() => {
                                    const newCats = [...config.categories];
                                    newCats[index].prizes.splice(pIdx, 1);
                                    updateConfig('categories', newCats);
                                }}
                                className="p-3 text-slate-800 hover:text-rose-500 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            <div className="md:col-span-2 space-y-3 pt-4 border-t border-slate-50">
                <div className="flex justify-between items-center">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Age-Based Pricing</label>
                        <p className="text-[8px] font-bold text-slate-700 uppercase tracking-tight">Set different prices for age ranges (Optional)</p>
                    </div>
                    <button 
                        onClick={() => {
                            const newCats = [...config.categories];
                            if (!newCats[index].agePricing) newCats[index].agePricing = [];
                            newCats[index].agePricing.push({ minAge: "", maxAge: "", price: "" });
                            updateConfig('categories', newCats);
                        }}
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    >
                        + Add Age Range
                    </button>
                </div>
                
                <div className="space-y-3">
                    {(category.agePricing || []).map((ap, apIdx) => (
                        <div key={apIdx} className="grid grid-cols-12 gap-3 items-center   ">
                            <div className="col-span-4 flex items-center gap-2">
                                <input 
                                    type="number" placeholder="Min"
                                    className="w-full bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold text-slate-900"
                                    value={ap.minAge}
                                    onChange={e => {
                                        const newCats = [...config.categories];
                                        newCats[index].agePricing[apIdx].minAge = e.target.value;
                                        updateConfig('categories', newCats);
                                    }}
                                />
                                <span className="text-slate-800 font-bold">to</span>
                                <input 
                                    type="number" placeholder="Max"
                                    className="w-full bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold text-slate-900"
                                    value={ap.maxAge}
                                    onChange={e => {
                                        const newCats = [...config.categories];
                                        newCats[index].agePricing[apIdx].maxAge = e.target.value;
                                        updateConfig('categories', newCats);
                                    }}
                                />
                            </div>
                            <div className="col-span-1 text-slate-800 font-bold text-[10px] uppercase">Years</div>
                            <div className="col-span-5 relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-800 font-bold text-xs">₹</span>
                                <input 
                                    type="number" placeholder="Price"
                                    className="w-full bg-white border border-slate-200 pl-7 pr-4 py-3 rounded-xl text-xs font-bold text-slate-900"
                                    value={ap.price}
                                    onChange={e => {
                                        const newCats = [...config.categories];
                                        newCats[index].agePricing[apIdx].price = e.target.value;
                                        updateConfig('categories', newCats);
                                    }}
                                />
                            </div>
                            <button 
                                onClick={() => {
                                    const newCats = [...config.categories];
                                    newCats[index].agePricing.splice(apIdx, 1);
                                    updateConfig('categories', newCats);
                                }}
                                className="col-span-2 flex justify-center text-slate-800 hover:text-rose-500 transition-colors"
                            >
                                <Trash size={16} />
                            </button>
                        </div>
                    ))}
                    {category.agePricing?.length === 0 && (
                        <p className="text-[9px] font-bold text-slate-800 uppercase tracking-widest text-center italic py-2">No age ranges added. Category price will apply to everyone.</p>
                    )}
                </div>
            </div>
        </div>
    </div>
);


const RegistrationFieldItem = ({ field, idx, config, updateConfig }) => (
    <div className={`p-6 rounded-[2rem] border ${field.isDefault ? 'bg-slate-50 border-slate-100 opacity-80' : 'bg-white border-pink-100 shadow-sm'} flex flex-col gap-4 group`}>
        <div className="flex items-center gap-6">
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-800">
                {field.type === 'text' && <FileText size={18} />}
                {field.type === 'email' && <Mail size={18} />}
                {field.type === 'tel' && <Phone size={18} />}
                {field.type === 'select' && <ChevronDown size={18} />}
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <input 
                    className="bg-transparent text-sm font-bold text-slate-900 focus:outline-none"
                    value={field.label}
                    onChange={e => {
                        const newFields = [...config.registrationForm];
                        newFields[idx].label = e.target.value;
                        updateConfig('registrationForm', newFields);
                    }}
                />
                <select 
                    className="bg-transparent text-[10px] font-bold text-slate-800 uppercase tracking-widest focus:outline-none"
                    value={field.type}
                    onChange={e => {
                        const newFields = [...config.registrationForm];
                        newFields[idx].type = e.target.value;
                        updateConfig('registrationForm', newFields);
                    }}
                >
                    <option value="text">Text Input</option>
                    <option value="number">Number</option>
                    <option value="email">Email</option>
                    <option value="tel">Phone</option>
                    <option value="date">Date</option>
                    <option value="select">Dropdown</option>
                    <option value="radio">Radio Buttons</option>
                    <option value="checkbox">Checkbox</option>
                    <option value="file">File Upload</option>
                </select>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => {
                            const newFields = [...config.registrationForm];
                            newFields[idx].required = !newFields[idx].required;
                            updateConfig('registrationForm', newFields);
                        }}
                        className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${field.required ? 'bg-pink-500 text-white' : 'bg-slate-100 text-slate-800'}`}
                    >
                        {field.required ? 'Required' : 'Optional'}
                    </button>
                    {!field.isDefault && (
                        <button 
                            onClick={() => updateConfig('registrationForm', prev => prev.filter((_, i) => i !== idx))}
                            className="p-1 text-red-400 hover:text-red-600 ml-auto"
                        >
                            <Trash size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
        
        {field.type === 'select' && (
            <div className="w-full mt-2 pt-4 border-t border-slate-50">
                <input 
                    placeholder="Comma separated options (e.g. Small, Medium, Large)"
                    className="w-full text-xs font-medium text-slate-700 bg-transparent outline-none"
                    value={field.options?.join(', ') || ""}
                    onChange={e => {
                        const newFields = [...config.registrationForm];
                        newFields[idx].options = e.target.value.split(',').map(s => s.trim());
                        updateConfig('registrationForm', newFields);
                    }}
                />
            </div>
        )}
    </div>
);

const UniversalEventForm = ({ postEvent, setPostEvent, onCancel, onPublish, isEditing }) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const isAdmin = user?.role === 'admin';
    const [currentStep, setCurrentStep] = useState(1);
    const [showLocationModal, setShowLocationModal] = useState(false);
    
    // Default dynamic config structure
    const [config, setConfig] = useState(() => {
        const base = postEvent.dynamic_config || {};
        return {
            ...base,
            basicInfo: {
                eligibility: "Open to All",
                organizerContact: "",
                regStart: "",
                regEnd: "",
                expiryDate: postEvent.expiryDate || postEvent.expiry_date || "",
                endDate: postEvent.endDate || postEvent.end_date || "",
                endTime: postEvent.endTime || postEvent.end_time || "",
                ...(base.basicInfo || {})
            },
            location: {
                venueName: "",
                address: "",
                city: "",
                pincode: "",
                coordinates: { lat: 11.0168, lng: 76.9558 },
                ...(base.location || {})
            },
            amenities: base.amenities || (postEvent.sportType === "Marathon" ? ['Ambulance', 'First Aid', 'Medal', 'T-Shirt', 'Breakfast', 'Refreshments', 'Safety', 'Bib'] : []),
            categories: base.categories || (postEvent.sportType === "Marathon" ? [
                { id: 1, name: "5K Run", gender: "All", price: 0, totalSlots: 500, prizes: [{ label: "1st Prize", value: "" }, { label: "2nd Prize", value: "" }, { label: "3rd Prize", value: "" }], agePricing: [] },
                { id: 2, name: "10K Run", gender: "All", price: 0, totalSlots: 300, prizes: [{ label: "1st Prize", value: "" }, { label: "2nd Prize", value: "" }, { label: "3rd Prize", value: "" }], agePricing: [] }
            ] : [
                { id: Date.now(), name: "Standard Entry", gender: "All", price: 0, totalSlots: 100, prizes: [{ label: "1st Prize", value: "" }], agePricing: [] }
            ]),
            registrationForm: base.registrationForm || [
                { id: 1, label: "Full Name", type: "text", required: true, isDefault: true },
                { id: 2, label: "Email Address", type: "email", required: true, isDefault: true },
                { id: 3, label: "Phone Number", type: "tel", required: true, isDefault: true },
                ...(postEvent.sportType === "Marathon" ? [{ id: 4, label: "T-Shirt Size", type: "select", options: ["XS", "S", "M", "L", "XL", "XXL"], required: true }] : [])
            ],
            communication: base.communication || {
                whatsappLink: "",
                supportNumber: "",
                notifications: { email: true, sms: false }
            },
            countdown: base.countdown || {
                enabled: true,
                deadline: ""
            },
            publish: base.publish || {
                isPublic: true,
                isDraft: false
            },
            faqs: base.faqs || [
                { question: "Is parking available?", answer: "Yes, free parking is available at the venue." }
            ],
            terms: base.terms || "1. Tickets are non-refundable.\n2. Please carry a valid ID proof.\n3. Masks are mandatory.",
            country: base.country || "India",
            countryCode: base.countryCode || "IN",
            state: base.state || "",
            stateCode: base.stateCode || "",
            district: base.district || "",
            city: base.city || "",
            zipCode: base.zipCode || ""
        };
    });

    useEffect(() => {
        // Auto-detect location on mount ONLY if this is a new event (not editing)
        // and we don't have coordinates set yet.
        const hasStoredLocation = postEvent.latitude && postEvent.longitude;
        if (isEditing || hasStoredLocation) return;

        const timer = setTimeout(() => {
            if (typeof window !== "undefined" && navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(async (pos) => {
                    const { latitude: lat, longitude: lng } = pos.coords;
                    try {
                        const geo = await reverseGeocode(lat, lng);
                        if (geo) {
                            setConfig(prev => ({
                                ...prev,
                                country: geo.country || prev.country,
                                countryCode: geo.countryCode || prev.countryCode,
                                state: geo.state || prev.state,
                                stateCode: geo.stateCode || prev.stateCode,
                                district: geo.district || prev.district,
                                city: geo.city || prev.city,
                                zipCode: geo.pincode || prev.zipCode,
                                location: { 
                                    ...prev.location, 
                                    address: geo.fullAddress,
                                    city: geo.city,
                                    pincode: geo.pincode,
                                    coordinates: { lat, lng }
                                }
                            }));
                            showToast(`Auto-Located: ${geo.city || geo.district}`, "success");
                        }
                    } catch (err) {
                        console.error("Auto-location geocode error:", err);
                    }
                }, (err) => {
                    console.warn("Auto-location permission denied or failed:", err);
                    if (err.code === 1) { // PERMISSION_DENIED
                        showToast("Location access denied. Please enable it in browser settings.", "error");
                    }
                }, { enableHighAccuracy: true, timeout: 10000 });
            }
        }, 1000); // 1s delay
        
        return () => clearTimeout(timer);
    }, []);

    const [dbDistricts, setDbDistricts] = useState([]);
    const [dbCities, setDbCities] = useState([]);
    const [distLoading, setDistLoading] = useState(false);
    const [cityLoading, setCityLoading] = useState(false);

    // Fetch Districts when State changes
    useEffect(() => {
        const fetchDistricts = async () => {
            if (!config.state || config.country !== "India") {
                setDbDistricts([]);
                return;
            }
            setDistLoading(true);
            try {
                const { data: stateData } = await supabase
                    .from('states')
                    .select('id')
                    .eq('name', config.state)
                    .maybeSingle();

                if (stateData) {
                    const { data: dists } = await supabase
                        .from('districts')
                        .select('name')
                        .eq('state_id', stateData.id)
                        .order('name');
                    setDbDistricts(dists?.map(d => d.name) || []);
                } else {
                    setDbDistricts([]);
                }
            } catch (err) {
                console.error("Fetch districts error:", err);
            } finally {
                setDistLoading(false);
            }
        };
        fetchDistricts();
    }, [config.state, config.country]);

    // Fetch Cities when District changes
    useEffect(() => {
        const fetchCities = async () => {
            if (!config.district || config.country !== "India") {
                setDbCities([]);
                return;
            }
            setCityLoading(true);
            try {
                const { data: distData } = await supabase
                    .from('districts')
                    .select('id')
                    .eq('name', config.district)
                    .maybeSingle();

                if (distData) {
                    const { data: cts } = await supabase
                        .from('cities')
                        .select('name')
                        .eq('district_id', distData.id)
                        .order('name');
                    
                    if (cts && cts.length > 0) {
                        setDbCities(cts.map(c => c.name));
                    } else {
                        // If no cities for this district, check if there's a catch-all "District"
                        setDbCities([]);
                    }
                } else {
                    setDbCities([]);
                }
            } catch (err) {
                console.error("Fetch cities error:", err);
            } finally {
                setCityLoading(false);
            }
        };
        fetchCities();
    }, [config.district, config.country]);

    useEffect(() => {
        // Ensure basicInfo has regStart/regEnd defaults if missing
        if (config.basicInfo && (config.basicInfo.regStart === undefined || config.basicInfo.regEnd === undefined || config.basicInfo.expiryDate === undefined)) {
            setConfig(prev => ({
                ...prev,
                basicInfo: {
                    ...prev.basicInfo,
                    regStart: prev.basicInfo.regStart || "",
                    regEnd: prev.basicInfo.regEnd || "",
                    expiryDate: prev.basicInfo.expiryDate || ""
                }
            }));
        }

        setPostEvent(prev => ({ 
            ...prev, 
            dynamic_config: config,
            city: config.city || config.location?.city || prev.city,
            price: config.price !== undefined ? config.price : prev.price,
            country: config.country || prev.country,
            state: config.state || prev.state,
            district: config.district || prev.district,
            venue: config.location?.venueName || prev.venue,
            address: config.location?.address || prev.address,
            location: config.location?.address || prev.location,
            zipCode: config.zipCode || config.location?.pincode || prev.zipCode,
            latitude: config.location?.coordinates?.lat || prev.latitude,
            longitude: config.location?.coordinates?.lng || prev.longitude,
            endDate: config.basicInfo?.endDate || prev.endDate,
            endTime: config.basicInfo?.endTime || prev.endTime,
            expiryDate: config.basicInfo?.expiryDate || prev.expiryDate,
            type: "Dynamic",
            category: prev.category || "Event"
        }));
    }, [config]);

    const steps = [
        { id: 1, title: "Overview", icon: Info },
        { id: 2, title: "Location", icon: MapPin },
        { id: 3, title: "Amenities", icon: Gift },
        { id: 4, title: "Tickets", icon: Ticket },
        { id: 5, title: "Form Builder", icon: ListTodo },
        { id: 6, title: "Pricing & Rules", icon: DollarSign },
        { id: 7, title: "Publish", icon: Globe }
    ];

    const updateConfig = (section, data) => {
        setConfig(prev => ({
            ...prev,
            [section]: typeof data === 'function' ? data(prev[section]) : data
        }));
    };



    return (
        <div className="max-w-5xl mx-auto py-8">
            {/* Steps Indicator */}
            <div className="flex items-center justify-between mb-12 px-6 overflow-x-auto pb-4 scrollbar-hide">
                {steps.map((s, idx) => (
                    <React.Fragment key={s.id}>
                        <div className="flex flex-col items-center gap-3 shrink-0">
                            <div className={`w-14 h-14 rounded-[2rem] flex items-center justify-center transition-all  border-2 ${
                                currentStep >= s.id 
                                ? 'bg-[#ec4899] border-[#ec4899] text-white shadow-xl shadow-pink-200' 
                                : 'bg-white border-slate-100 text-slate-800'
                            }`}>
                                <s.icon size={22} />
                            </div>
                            <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${currentStep >= s.id ? 'text-[#ec4899]' : 'text-slate-800'}`}>
                                {s.title}
                            </span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={`w-12 h-0.5 mx-2 transition-colors  ${currentStep > s.id ? 'bg-[#ec4899]' : 'bg-slate-100'}`} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
                <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl p-10 md:p-14 space-y-10   ">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center text-[#ec4899]">
                            <Layout size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Event Identity</h2>
                            <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Main details and core presentation</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2">
                            {renderInput("Event Title", postEvent.title, (v) => setPostEvent(p => ({ ...p, title: v })), "text", "Enter a high-impact title")}
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-3 pl-1">Event Description</label>
                            <textarea 
                                value={postEvent.description || ""}
                                onChange={(e) => setPostEvent(p => ({ ...p, description: e.target.value }))}
                                rows={6}
                                className="w-full bg-slate-50 border border-slate-100 text-slate-900 text-sm font-semibold px-6 py-4 rounded-[2rem] focus:outline-none focus:ring-2 focus:ring-pink-500/20 shadow-inner"
                                placeholder="Describe your event in detail..."
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest pl-1">Event Banner</label>
                            <div className="relative group h-40 rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden hover:border-pink-300 transition-all flex items-center justify-center">
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
                        <div className="grid grid-cols-2 gap-4">
                            {renderInput("Event Date", postEvent.startDate, (v) => setPostEvent(p => ({ ...p, startDate: v })), "date")}
                            {renderInput("Event Time", postEvent.startTime, (v) => setPostEvent(p => ({ ...p, startTime: v })), "time")}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {renderInput("End Date*", config.basicInfo.endDate, (v) => updateConfig('basicInfo', { ...config.basicInfo, endDate: v }), "date")}
                            {renderInput("End Time*", config.basicInfo.endTime, (v) => updateConfig('basicInfo', { ...config.basicInfo, endTime: v }), "time")}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {renderInput("Registration Starts", config.basicInfo.regStart, (v) => updateConfig('basicInfo', { ...config.basicInfo, regStart: v }), "date")}
                            {renderInput("Registration Ends", config.basicInfo.regEnd, (v) => updateConfig('basicInfo', { ...config.basicInfo, regEnd: v }), "date")}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {renderInput("Event Expiry Date", config.basicInfo.expiryDate, (v) => updateConfig('basicInfo', { ...config.basicInfo, expiryDate: v }), "date")}
                            <div /> {/* Spacer */}
                        </div>
                        <CustomSelect 
                            label="Eligibility"
                            value={config.basicInfo.eligibility || "Open to All"}
                            options={["Open to All", "Tamil Nadu Only", "Students Only", "Corporate Only", "Invite Only"]}
                            onChange={(v) => updateConfig('basicInfo', { ...config.basicInfo, eligibility: v })}
                        />
                        {renderInput("Organizer Contact", config.basicInfo.organizerContact, (v) => updateConfig('basicInfo', { ...config.basicInfo, organizerContact: v }), "text", "Phone or Email")}
                    </div>

                    <div className="pt-10 flex justify-end">
                        <button 
                            onClick={() => setCurrentStep(2)}
                            className="px-12 py-4 bg-slate-900 text-white rounded-[2rem] text-xs font-bold uppercase tracking-widest flex items-center gap-3 hover:bg-black shadow-xl shadow-slate-200 transition-all"
                        >
                            Next: Location <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Location Setup */}
            {currentStep === 2 && (
                <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl p-10 md:p-14 space-y-10   ">
                    <div className="flex items-center gap-5">
                        <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Venue & Map</h2>
                                <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Where will the magic happen?</p>
                            </div>
                            <button 
                                onClick={() => setShowLocationModal(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-pink-50 text-pink-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-pink-600 hover:text-white transition-all shadow-sm border border-pink-100 self-start md:self-auto group"
                            >
                                <Search size={14} className="group-hover:scale-125 transition-transform" />
                                Search Global Location
                            </button>
                        </div>
                    </div>

                    <LocationSelectionModal 
                        isOpen={showLocationModal}
                        onClose={() => setShowLocationModal(false)}
                        selectedCity={config.city}
                        updateCity={(cityName, details) => {
                            if (details) {
                                setConfig(prev => ({
                                    ...prev,
                                    country: details.country || prev.country,
                                    state: details.state || prev.state,
                                    city: details.city || cityName,
                                    zipCode: details.pincode || details.zipCode || prev.zipCode,
                                    location: {
                                        ...prev.location,
                                        address: details.address || details.fullAddress || prev.location.address,
                                        city: details.city || cityName,
                                        pincode: details.pincode || details.zipCode || prev.location.pincode,
                                        coordinates: {
                                            lat: details.lat || prev.location.coordinates.lat,
                                            lng: details.lng || prev.location.coordinates.lng
                                        }
                                    }
                                }));
                                showToast(`Location Updated: ${cityName}`, "success");
                            }
                        }}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2">
                            {renderInput("Venue Name", config.location.venueName, (v) => updateConfig('location', { ...config.location, venueName: v }), "text", "e.g., Nehru Stadium")}
                        </div>
                        <div className="md:col-span-2">
                            {renderInput("Full Address", config.location.address, (v) => updateConfig('location', { ...config.location, address: v }), "text", "Building, Street, Area")}
                        </div>
                                    <CustomSelect 
                                        label="Country"
                                        value={config.country}
                                        options={COUNTRIES}
                                        onChange={(v) => {
                                            const countryData = COUNTRIES.find(c => (c.label || c) === v);
                                            const code = countryData?.code || "IN";
                                            
                                            const centers = {
                                                "IN": { lat: 20.5937, lng: 78.9629 },
                                                "AE": { lat: 23.4241, lng: 53.8478 },
                                                "SG": { lat: 1.3521, lng: 103.8198 },
                                                "MY": { lat: 4.2105, lng: 101.9758 },
                                                "TH": { lat: 15.8700, lng: 100.9925 },
                                                "DE": { lat: 51.1657, lng: 10.4515 },
                                                "US": { lat: 37.0902, lng: -95.7129 }
                                            };

                                            setConfig(prev => ({
                                                ...prev,
                                                country: v,
                                                countryCode: code,
                                                state: "",
                                                stateCode: "",
                                                district: "",
                                                city: "",
                                                zipCode: "",
                                                location: { 
                                                    ...prev.location, 
                                                    city: "", 
                                                    coordinates: centers[code] || prev.location.coordinates 
                                                }
                                            }));
                                        }}
                                    />
                                    <CustomSelect 
                                        label="State / Province"
                                        value={config.state}
                                        options={State.getStatesOfCountry(config.countryCode).map(s => s.name)}
                                        onChange={(v) => {
                                            const stateObj = State.getStatesOfCountry(config.countryCode).find(s => s.name === v);
                                            setConfig(prev => ({
                                                ...prev,
                                                state: v,
                                                stateCode: stateObj?.isoCode || "",
                                                district: "",
                                                city: "",
                                                zipCode: "",
                                                location: { ...prev.location, city: "" }
                                            }));
                                        }}
                                    />
                                    {config.country === "India" ? (
                                        <>
                                            <CustomSelect 
                                                label="District"
                                                value={config.district}
                                                options={dbDistricts.length > 0 ? dbDistricts : getIndianDistricts(config.state)}
                                                isLoading={distLoading}
                                                onChange={(v) => setConfig(prev => ({
                                                    ...prev,
                                                    district: v,
                                                    city: "",
                                                    zipCode: "",
                                                    location: { ...prev.location, city: "" }
                                                }))}
                                            />
                                            <CustomSelect 
                                                label="City"
                                                value={config.city}
                                                options={dbCities.length > 0 ? dbCities : getIndianCities(config.district)}
                                                onChange={async (v) => {
                                                    setConfig(prev => ({
                                                        ...prev,
                                                        city: v,
                                                        location: { ...prev.location, city: v }
                                                    }));
                                                    // Auto-geocode city to update map pin AGGRESSIVELY
                                                    try {
                                                        const coords = await geocode(`${v}, ${config.state}, ${config.country}`);
                                                        if (coords) {
                                                            setConfig(prev => ({
                                                                ...prev,
                                                                location: { ...prev.location, coordinates: { lat: coords.lat, lng: coords.lng }}
                                                            }));
                                                            // Also push directly to postEvent state to be safe
                                                            setPostEvent(prevPE => ({
                                                                ...prevPE,
                                                                city: v,
                                                                latitude: coords.lat,
                                                                longitude: coords.lng
                                                            }));
                                                        }
                                                    } catch (err) { console.error("Geocoding city error:", err); }
                                                }}
                                            />
                                        </>
                                    ) : (
                                        <CustomSelect 
                                            label="City"
                                            value={config.city}
                                            options={City.getCitiesOfState(config.countryCode, config.stateCode).map(c => c.name)}
                                            onChange={async (v) => {
                                                setConfig(prev => ({
                                                    ...prev,
                                                    city: v,
                                                    location: { ...prev.location, city: v }
                                                }));
                                                // Auto-geocode city to update map pin
                                                try {
                                                    const coords = await geocode(`${v}, ${config.state}, ${config.country}`);
                                                    if (coords) {
                                                        setConfig(prev => ({
                                                            ...prev,
                                                            location: { ...prev.location, coordinates: { lat: coords.lat, lng: coords.lng }}
                                                        }));
                                                    }
                                                } catch (err) { console.error("Geocoding city error:", err); }
                                            }}
                                        />
                                    )}

                                    <div className="space-y-2">
                                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest pl-1">Pincode / Zip Code</label>
                                        <input 
                                            type="text"
                                            value={config.location.pincode || ""}
                                            onChange={(e) => updateConfig('location', { ...config.location, pincode: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 shadow-inner transition-all placeholder:text-slate-800"
                                            placeholder="Auto-fills on City selection"
                                        />
                                    </div>

                                    <div /> {/* Replaced manual button with auto-detection */}
                        
                        {postEvent.sportType === "Marathon" && (
                            <div className="md:col-span-2 space-y-4">
                                <label className="block text-[11px] font-bold text-[#ec4899] uppercase tracking-widest pl-1">Marathon Specifics</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {renderInput("Route Map URL", config.location.routeMapUrl, (v) => updateConfig('location', { ...config.location, routeMapUrl: v }), "url", "Link to GPX or Google Maps Route")}
                                    {renderInput("Starting Point", config.location.startingPoint, (v) => updateConfig('location', { ...config.location, startingPoint: v }), "text", "e.g. Main Gate, Sector 4")}
                                </div>
                            </div>
                        )}

                        <div className="md:col-span-2 space-y-6 pt-6 border-t border-slate-50">
                            <div className="flex items-center justify-between px-1">
                                <div>
                                    <label className="block text-sm font-black text-slate-900 uppercase tracking-tight">Exact Event Location</label>
                                    <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest mt-1">Drag the pin to your specific building or venue gate</p>
                                </div>
                                <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">High Precision Active</span>
                                </div>
                            </div>
                            
                            <div className="h-[500px] rounded-[3rem] overflow-hidden border border-slate-200 shadow-2xl relative">
                                <GoogleInlineMap 
                                    lat={config.location.coordinates.lat} 
                                    lng={config.location.coordinates.lng}
                                    onLocationSelect={async (lat, lng) => {
                                        setConfig(prev => ({
                                            ...prev,
                                            location: { ...prev.location, coordinates: { lat, lng }}
                                        }));
                                        // Auto-Geocode on pin move
                                        try {
                                            const geocoded = await reverseGeocode(lat, lng);
                                            if (geocoded) {
                                                setConfig(prev => ({
                                                    ...prev,
                                                    country: geocoded.country || prev.country,
                                                    countryCode: geocoded.countryCode || prev.countryCode,
                                                    state: geocoded.state || prev.state,
                                                    stateCode: geocoded.stateCode || prev.stateCode,
                                                    district: geocoded.district || prev.district,
                                                    city: geocoded.city || prev.city,
                                                    zipCode: geocoded.pincode || prev.zipCode,
                                                    location: { 
                                                        ...prev.location, 
                                                        address: geocoded.fullAddress || prev.location.address,
                                                        city: geocoded.city || prev.location.city,
                                                        pincode: geocoded.pincode || prev.location.pincode,
                                                        coordinates: { lat, lng }
                                                    }
                                                }));
                                            }
                                        } catch (err) {
                                            console.error("Auto-geocoding error:", err);
                                        }
                                    }}
                                />
                                <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-slate-100 shadow-lg flex items-center gap-3 z-[100]">
                                    <div className="w-8 h-8 rounded-lg bg-pink-500 flex items-center justify-center text-white shrink-0">
                                        <MapPin size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[8px] font-black text-slate-800 uppercase tracking-widest leading-none mb-1">Current Selection</p>
                                        <p className="text-[10px] font-bold text-slate-900 truncate">
                                            {config.location.coordinates.lat.toFixed(4)}, {config.location.coordinates.lng.toFixed(4)}
                                        </p>
                                    </div>
                                    <div className="text-[8px] font-black text-pink-500 uppercase tracking-widest bg-pink-50 px-2 py-1 rounded-md">Live</div>
                                </div>
                            </div>
                            <p className="text-[9px] font-bold text-slate-800 uppercase tracking-widest text-center italic">Pin location on map for automatic directions on the booking page.</p>
                        </div>
                    </div>

                    <div className="pt-10 flex justify-between">
                        <button onClick={() => setCurrentStep(1)} className="px-10 py-4 text-slate-800 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2"><ArrowLeft size={16} /> Back</button>
                        <button onClick={() => setCurrentStep(3)} className="px-12 py-4 bg-slate-900 text-white rounded-[2rem] text-xs font-bold uppercase tracking-widest flex items-center gap-3">Next: Amenities <ArrowRight size={18} /></button>
                    </div>
                </div>
            )}

            {/* Step 3: Amenities & Benefits */}
            {currentStep === 3 && (
                <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl p-10 md:p-14 space-y-10   ">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center text-[#ec4899]">
                            <Gift size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Amenities & Benefits</h2>
                            <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Select what's included for participants</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {[
                            { id: 'Ambulance', label: 'Ambulance', icon: Activity },
                            { id: 'First Aid', label: 'First Aid', icon: HeartPulse },
                            { id: 'Certificate', label: 'Certificate', icon: FileText },
                            { id: 'Medal', label: 'Medal', icon: Award },
                            { id: 'T-Shirt', label: 'T-Shirt', icon: Shirt },
                            { id: 'Breakfast', label: 'Breakfast', icon: Coffee },
                            { id: 'Refreshments', label: 'Refreshments', icon: Utensils },
                            { id: 'Accommodation', label: 'Accommodation', icon: Home },
                            { id: 'Parking', label: 'Parking', icon: Car },
                            { id: 'Safety', label: 'Safety Measures', icon: ShieldCheck },
                            { id: 'Family', label: 'Family Friendly', icon: Smile },
                            { id: 'Cash Prize', label: 'Cash Prize', icon: DollarSign },
                            { id: 'Trophy', label: 'Trophy', icon: Trophy },
                            { id: 'Bib', label: 'Timing BIB', icon: Target },
                            { id: 'Selfie', label: 'Selfie Spot', icon: Camera },
                            { id: 'Washroom', label: 'Washroom', icon: CheckCircle2 }
                        ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    const newAms = config.amenities.includes(item.id)
                                        ? config.amenities.filter(a => a !== item.id)
                                        : [...config.amenities, item.id];
                                    updateConfig('amenities', newAms);
                                }}
                                className={`flex flex-col items-center gap-4 p-6 rounded-[2.5rem] border transition-all ${
                                    config.amenities.includes(item.id)
                                    ? 'bg-[#ec4899] border-[#ec4899] text-white shadow-xl shadow-pink-200'
                                    : 'bg-white border-slate-100 text-slate-800 hover:border-pink-200'
                                }`}
                            >
                                <item.icon size={24} />
                                <span className="text-[9px] font-black uppercase tracking-widest text-center">{item.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="pt-10 flex justify-between">
                        <button onClick={() => setCurrentStep(2)} className="px-10 py-4 text-slate-800 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2"><ArrowLeft size={16} /> Back</button>
                        <button onClick={() => setCurrentStep(4)} className="px-12 py-4 bg-slate-900 text-white rounded-[2rem] text-xs font-bold uppercase tracking-widest flex items-center gap-3">Next: Ticket Categories <ArrowRight size={18} /></button>
                    </div>
                </div>
            )}

            {/* Step 4: Ticket Management */}
            {currentStep === 4 && (
                <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl p-10 md:p-14 space-y-10   ">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center text-[#ec4899]">
                                <Ticket size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Categories</h2>
                                <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Define your ticket types and pricing</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => updateConfig('categories', prev => [...prev, { id: Date.now(), name: "New Category", gender: "All", price: 0, totalSlots: 100, prize: "" }])}
                            className="p-4 bg-pink-50 text-[#ec4899] rounded-2xl hover:bg-[#ec4899] hover:text-white transition-all shadow-sm"
                        >
                            <Plus size={24} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {config.categories.map((cat, idx) => (
                            <TicketCard key={cat.id} category={cat} index={idx} config={config} updateConfig={updateConfig} />
                        ))}
                    </div>

                    <div className="pt-10 flex justify-between">
                        <button onClick={() => setCurrentStep(3)} className="px-10 py-4 text-slate-800 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2"><ArrowLeft size={16} /> Back</button>
                        <button onClick={() => setCurrentStep(5)} className="px-12 py-4 bg-slate-900 text-white rounded-[2rem] text-xs font-bold uppercase tracking-widest flex items-center gap-3">Next: Form Builder <ArrowRight size={18} /></button>
                    </div>
                </div>
            )}

            {/* Step 5: Form Builder */}
            {currentStep === 5 && (
                <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl p-10 md:p-14 space-y-10   ">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center text-[#ec4899]">
                                <ListTodo size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Form Builder</h2>
                                <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Customize participant registration fields</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => updateConfig('registrationForm', prev => [...prev, { id: Date.now(), label: "New Field", type: "text", required: true, isCustom: true }])}
                            className="p-4 bg-pink-50 text-[#ec4899] rounded-2xl hover:bg-[#ec4899] hover:text-white transition-all"
                        >
                            <Plus size={24} />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                        <span className="w-full text-[10px] font-black text-slate-800 uppercase tracking-widest mb-2">Quick Add Fields:</span>
                        {[
                            { label: "Blood Group", type: "select", options: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] },
                            { label: "T-Shirt Size", type: "select", options: ["S", "M", "L", "XL", "XXL"] },
                            { label: "Emergency Contact", type: "tel" },
                            { label: "Medical Condition", type: "text" },
                            { label: "ID Proof Number", type: "text" }
                        ].map(qf => (
                            <button 
                                key={qf.label}
                                onClick={() => updateConfig('registrationForm', prev => [...prev, { id: Date.now(), ...qf, required: true }])}
                                className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-bold text-slate-700 hover:bg-[#ec4899] hover:text-white hover:border-[#ec4899] transition-all uppercase tracking-widest"
                            >
                                + {qf.label}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        {config.registrationForm.map((field, idx) => (
                            <RegistrationFieldItem key={field.id} field={field} idx={idx} config={config} updateConfig={updateConfig} />
                        ))}
                    </div>

                    <div className="pt-10 flex justify-between">
                        <button onClick={() => setCurrentStep(4)} className="px-10 py-4 text-slate-800 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2"><ArrowLeft size={16} /> Back</button>
                        <button onClick={() => setCurrentStep(6)} className="px-12 py-4 bg-slate-900 text-white rounded-[2rem] text-xs font-bold uppercase tracking-widest flex items-center gap-3">Next: Pricing & Rules <ArrowRight size={18} /></button>
                    </div>
                </div>
            )}

            {/* Step 6: Pricing & Rules */}
            {currentStep === 6 && (
                <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl p-10 md:p-14 space-y-10   ">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center text-[#ec4899]">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Pricing & Rules</h2>
                            <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Fees, deadlines, and logic</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* 🌟 Admin Special Statuses */}
                        <div className="md:col-span-2 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 shadow-inner">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                                        <Sparkles size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Admin Special Status</h3>
                                        <p className="text-[9px] font-bold text-slate-800 uppercase tracking-widest">Highlight this event on the platform</p>
                                    </div>
                                </div>
                                {!isAdmin && <div className="px-3 py-1 bg-slate-100 rounded-lg text-[8px] font-bold text-slate-800 uppercase">Admin Only</div>}
                            </div>

                            {isAdmin && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-200/50">
                                    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                                                <Award size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">Exclusive Event</p>
                                                <p className="text-[8px] font-bold text-slate-800 uppercase">Premium Badge</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer"
                                                checked={postEvent.is_exclusive || false}
                                                onChange={e => setPostEvent({ ...postEvent, is_exclusive: e.target.checked })}
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
                                                <Zap size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">Spotlight</p>
                                                <p className="text-[8px] font-bold text-slate-800 uppercase">Top of Feed</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer"
                                                checked={postEvent.is_spotlight || false}
                                                onChange={e => setPostEvent({ ...postEvent, is_spotlight: e.target.checked })}
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="md:col-span-2 py-6 border-y border-slate-50 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Timer size={20} className="text-[#ec4899]" />
                                    <span className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">Registration Countdown</span>
                                </div>
                                <button 
                                    onClick={() => updateConfig('countdown', { ...config.countdown, enabled: !config.countdown.enabled })}
                                    className={`w-12 h-6 rounded-full relative transition-all ${config.countdown.enabled ? 'bg-pink-500' : 'bg-slate-200'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${config.countdown.enabled ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>
                            {config.countdown.enabled && renderInput("Registration Deadline", config.countdown.deadline, (v) => updateConfig('countdown', { ...config.countdown, deadline: v }), "datetime-local")}
                        </div>

                        <div className="md:col-span-2 space-y-6">
                            <div className="flex items-center gap-3">
                                <MessageCircle size={20} className="text-[#ec4899]" />
                                <span className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">Communication Channels</span>
                            </div>
                            {renderInput("WhatsApp Channel Link", config.communication.whatsappLink, (v) => updateConfig('communication', { ...config.communication, whatsappLink: v }), "url", "https://whatsapp.com/channel/...")}
                            {renderInput("Support Contact Number", config.communication.supportNumber, (v) => updateConfig('communication', { ...config.communication, supportNumber: v }), "tel")}
                        </div>
                    </div>

                    <div className="pt-10 flex justify-between">
                        <button onClick={() => setCurrentStep(5)} className="px-10 py-4 text-slate-800 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2"><ArrowLeft size={16} /> Back</button>
                        <button onClick={() => setCurrentStep(7)} className="px-12 py-4 bg-slate-900 text-white rounded-[2rem] text-xs font-bold uppercase tracking-widest flex items-center gap-3">Next: Content & FAQs <ArrowRight size={18} /></button>
                    </div>
                </div>
            )}

            {/* Step 7: FAQs & Terms */}
            {currentStep === 7 && (
                <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl p-10 md:p-14 space-y-10">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <HelpCircle size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Content & FAQs</h2>
                            <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Add helpful information and event rules</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* FAQs Section */}
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Frequently Asked Questions</h3>
                                <button 
                                    onClick={() => updateConfig('faqs', [...config.faqs, { question: "", answer: "" }])}
                                    className="px-4 py-2 bg-pink-50 text-pink-500 rounded-xl text-[10px] font-black uppercase tracking-widest"
                                >
                                    + Add FAQ
                                </button>
                            </div>
                            <div className="space-y-4">
                                {config.faqs.map((faq, idx) => (
                                    <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                                        <button 
                                            onClick={() => updateConfig('faqs', config.faqs.filter((_, i) => i !== idx))}
                                            className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <div className="space-y-4">
                                            <input 
                                                className="w-full bg-transparent border-none text-sm font-black text-slate-900 placeholder:text-slate-700 focus:ring-0 p-0"
                                                placeholder="Question (e.g. Is food provided?)"
                                                value={faq.question}
                                                onChange={e => {
                                                    const next = [...config.faqs];
                                                    next[idx].question = e.target.value;
                                                    updateConfig('faqs', next);
                                                }}
                                            />
                                            <textarea 
                                                className="w-full bg-transparent border-none text-xs font-bold text-slate-800 placeholder:text-slate-700 focus:ring-0 p-0 resize-none"
                                                placeholder="Answer (e.g. Yes, breakfast will be served at 8 AM)"
                                                rows={2}
                                                value={faq.answer}
                                                onChange={e => {
                                                    const next = [...config.faqs];
                                                    next[idx].answer = e.target.value;
                                                    updateConfig('faqs', next);
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Terms Section */}
                        <div className="space-y-4 pt-8 border-t border-slate-50">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Terms & Conditions</h3>
                            <textarea 
                                className="w-full bg-slate-50 border border-slate-200 text-sm font-black text-slate-900 p-6 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 shadow-inner transition-all resize-none min-h-[150px] placeholder:text-slate-700"
                                placeholder="Enter event rules, refund policies, and safety instructions..."
                                value={config.terms}
                                onChange={e => updateConfig('terms', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="pt-10 flex justify-between">
                        <button onClick={() => setCurrentStep(6)} className="px-10 py-4 text-slate-800 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2"><ArrowLeft size={16} /> Back</button>
                        <button onClick={() => setCurrentStep(8)} className="px-12 py-4 bg-slate-900 text-white rounded-[2rem] text-xs font-bold uppercase tracking-widest flex items-center gap-3">Next: Review & Publish <ArrowRight size={18} /></button>
                    </div>
                </div>
            )}

            {/* Step 8: Final Review & Publish */}
            {currentStep === 8 && (
                <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl p-10 md:p-14 space-y-10    text-center">
                    <div className="flex flex-col items-center gap-6 py-10">
                        <div className="w-24 h-24 rounded-[3rem] bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-100 ">
                            <CheckCircle2 size={48} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Ready to Go!</h2>
                            <p className="text-[11px] font-bold text-slate-800 uppercase tracking-[0.2em] mt-2">Your dynamic event is fully configured</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                        <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 text-left space-y-4">
                            <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest italic">Summary</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold text-slate-700"><span>Title</span> <span className="text-slate-900">{postEvent.title || "Untitled"}</span></div>
                                <div className="flex justify-between text-xs font-bold text-slate-700"><span>Categories</span> <span className="text-slate-900">{config.categories.length} Types</span></div>
                                <div className="flex justify-between text-xs font-bold text-slate-700"><span>Amenities</span> <span className="text-slate-900">{config.amenities.length} Selected</span></div>
                                <div className="flex justify-between text-xs font-bold text-slate-700"><span>Form Fields</span> <span className="text-slate-900">{config.registrationForm.length} Inputs</span></div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 justify-center">
                            <button 
                                onClick={() => updateConfig('publish', { ...config.publish, isPublic: !config.publish.isPublic })}
                                className={`flex items-center justify-between p-6 rounded-[2rem] border transition-all ${config.publish.isPublic ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-800'}`}
                            >
                                <div className="flex items-center gap-3">
                                    {config.publish.isPublic ? <Globe size={20} /> : <Lock size={20} />}
                                    <span className="text-[10px] font-bold uppercase tracking-widest">{config.publish.isPublic ? 'Public Event' : 'Private Event'}</span>
                                </div>
                                <div className={`w-8 h-4 rounded-full relative ${config.publish.isPublic ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${config.publish.isPublic ? 'left-4.5' : 'left-0.5'}`} />
                                </div>
                            </button>
                            
                            <button 
                                onClick={onPublish}
                                className="w-full py-6 bg-[#ec4899] text-white rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-pink-200 hover:scale-105 active:scale-95 transition-all"
                            >
                                {isEditing ? "Update Changes" : "Publish Event"}
                            </button>
                        </div>
                    </div>

                    <div className="pt-10">
                        <button onClick={() => setCurrentStep(7)} className="px-10 py-4 text-slate-600 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 mx-auto"><ArrowLeft size={16} /> Back to Content</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UniversalEventForm;
