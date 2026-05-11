"use client";
import React, { useState, useEffect, useRef } from "react";
import { 
    Trophy, MapPin, Calendar, Clock, Image as ImageIcon, Plus, Trash2, 
    ChevronRight, ChevronLeft, Save, Sparkles, Award, Utensils, Shirt, 
    Coffee, HeartPulse, ShieldCheck, Gift, Camera, Search, Target,
    CheckCircle2, Info, Timer, Users, Mail, Phone, Globe, Star, CloudUpload, X
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthContext";
import { useToast } from "@/context/ToastContext";
import CustomSelect from "./CustomSelect";
import GoogleInlineMap from "./GoogleInlineMap";
import CalendarPicker from "./CalendarPicker";
import TimePicker from "./TimePicker";
import { Country, State, City } from 'country-state-city';
import { INDIAN_STATES, getIndianDistricts, getIndianCities } from "@/app/data/indianLocations";
import { COUNTRIES } from "@/app/data/locationData";
import { reverseGeocode, geocode } from "@/lib/googleMaps";
import LocationSelectionModal from "@/components/LocationSelectionModal";

const BENEFIT_ICONS = [
    { key: "ambulance", icon: HeartPulse, label: "Ambulance" },
    { key: "medical", icon: ShieldCheck, label: "First Aid" },
    { key: "certificate", icon: ShieldCheck, label: "Certificate" },
    { key: "medal", icon: Award, label: "Medal" },
    { key: "tshirt", icon: Shirt, label: "T-Shirt" },
    { key: "breakfast", icon: Coffee, label: "Breakfast" },
    { key: "refreshment", icon: Utensils, label: "Refreshments" },
    { key: "accommodation", icon: Globe, label: "Accommodation" },
    { key: "parking", icon: MapPin, label: "Parking" },
    { key: "safety", icon: ShieldCheck, label: "Safety Measures" },
    { key: "family", icon: Users, label: "Family Friendly" },
    { key: "prize", icon: Gift, label: "Cash Prize" },
    { key: "trophy", icon: Trophy, label: "Trophy" },
    { key: "timer", icon: Timer, label: "Timing Bib" },
    { key: "selfie", icon: Camera, label: "Selfie Spot" },
    { key: "washroom", icon: Info, label: "Washroom" }
];

const SPONSOR_TYPES = ["Title", "Powered By", "Associate", "Partner", "Media", "Hydration", "Medical"];

export default function MarathonEventForm({ marathonId, onCancel, onPublish }) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form State
    const [eventData, setEventData] = useState({
        title: "",
        subtitle: "",
        awareness_text: "",
        description: "",
        banner_image: "",
        event_date: "",
        event_time: "",
        event_end_date: "",
        event_end_time: "",
        reg_start_date: "",
        reg_end_date: "",
        expiry_date: "",
        venue: "",
        country: "India",
        countryCode: "IN",
        state: "",
        stateCode: "",
        district: "",
        zipCode: "",
        map_location: { lat: 11.0168, lng: 76.9558, address: "" },
        starting_point: "",
        whatsapp_link: "",
        support_number: "",
        terms: "",
        status: "Draft"
    });

    const [faqs, setFaqs] = useState([
        { question: "Is parking available?", answer: "Yes, free parking is available at the venue." }
    ]);

    const [customFields, setCustomFields] = useState([
        { id: 1, label: "Full Name", type: "text", required: true },
        { id: 2, label: "Email Address", type: "email", required: true },
        { id: 3, label: "Phone Number", type: "phone", required: true }
    ]);

    const [categories, setCategories] = useState([]);

    const [sponsors, setSponsors] = useState([]);
    const [benefits, setBenefits] = useState([
        { benefit_name: "T-Shirts", icon_key: "tshirt" },
        { benefit_name: "Medals", icon_key: "medal" }
    ]);

    // Load existing data if marathonId provided
    useEffect(() => {
        if (marathonId) {
            fetchMarathonDetails();
        }
    }, [marathonId]);

    const [dbDistricts, setDbDistricts] = useState([]);
    const [dbCities, setDbCities] = useState([]);
    const [distLoading, setDistLoading] = useState(false);
    const [cityLoading, setCityLoading] = useState(false);
    const [showLocationModal, setShowLocationModal] = useState(false);

    // Default category for NEW events
    useEffect(() => {
        if (!marathonId && categories.length === 0) {
            setCategories([{ category_name: "10KM Run", distance_km: 10, age_group: "Open", price: 500, slots_total: 500, gender_category: "All" }]);
        }
    }, [marathonId]);

    // Database Location Fetching
    useEffect(() => {
        const fetchDistricts = async () => {
            if (!eventData.state) {
                setDbDistricts([]);
                return;
            }
            const isIndia = eventData.country === "India" || !eventData.country;
            if (!isIndia) {
                setDbDistricts([]);
                return;
            }
            setDistLoading(true);
            try {
                const { data: stateData } = await supabase.from('states').select('id').ilike('name', eventData.state).maybeSingle();
                if (stateData) {
                    const { data: dists } = await supabase.from('districts').select('name').eq('state_id', stateData.id).order('name');
                    setDbDistricts(dists?.map(d => d.name) || []);
                }
            } catch (err) { console.error(err); } finally { setDistLoading(false); }
        };
        fetchDistricts();
    }, [eventData.state, eventData.country]);

    useEffect(() => {
        const fetchCities = async () => {
            if (!eventData.district || eventData.country !== "India") {
                setDbCities([]);
                return;
            }
            setCityLoading(true);
            try {
                const { data: distData } = await supabase.from('districts').select('id').ilike('name', eventData.district).maybeSingle();
                if (distData) {
                    const { data: cts } = await supabase.from('cities').select('name').eq('district_id', distData.id).order('name');
                    setDbCities(cts?.map(c => c.name) || []);
                }
            } catch (err) { console.error(err); } finally { setCityLoading(false); }
        };
        fetchCities();
    }, [eventData.district, eventData.country]);

    const fetchMarathonDetails = async () => {
        setLoading(true);
        try {
            // Fetch from both tables to ensure full data coverage
            const [cRes, mRes, eRes] = await Promise.all([
                supabase.from('marathon_categories').select('*').eq('marathon_id', marathonId).order('distance_km', { ascending: true }),
                supabase.from('marathon_events').select('*').eq('id', marathonId).maybeSingle(),
                supabase.from('events').select('*').eq('id', marathonId).maybeSingle()
            ]);

            let catData = cRes.data || [];
            const mEvent = mRes.data;
            const eventsRow = eRes.data;

            const source = mEvent || eventsRow;
            if (!source) {
                console.error("[MarathonForm] No data found for ID:", marathonId);
                setLoading(false);
                return;
            }

            // Parse dynamic_config from either table (usually in 'events' shadow record)
            const dynCfg = (() => {
                const configSource = eventsRow?.dynamic_config || mEvent?.dynamic_config;
                if (!configSource) return {};
                try {
                    return typeof configSource === 'string'
                        ? JSON.parse(configSource)
                        : configSource;
                } catch { return {}; }
            })();

            // ── Populate form state ───────────────────────────────────────────────
            setEventData({
                title: source.title || "",
                subtitle: source.subtitle || dynCfg.subtitle || "",
                awareness_text: source.awareness_text || dynCfg.awareness_text || "",
                description: source.description || "",
                banner_image: source.banner_image || source.img || "",
                event_date: source.event_date || source.date || source.start_date || "",
                event_time: source.event_time || source.time || source.start_time || "",
                event_end_date: source.event_end_date || source.end_date || "",
                event_end_time: source.event_end_time || source.end_time || "",
                reg_start_date: source.reg_start_date || dynCfg.reg_dates?.start || "",
                reg_end_date: source.reg_end_date || dynCfg.reg_dates?.end || "",
                expiry_date: source.expiry_date || source.expiry || "",
                venue: source.venue || "",
                city: source.city || "",
                state: source.state || "",
                country: source.country || "India",
                countryCode: source.countryCode || "IN",
                district: source.district || "",
                zipCode: source.zipCode || source.zip_code || source.pincode || "",
                map_location: source.map_location || (source.latitude ? { lat: source.latitude, lng: source.longitude, address: source.address || "" } : { lat: 11.0168, lng: 76.9558, address: "" }),
                route_map_image: source.route_map_image || "",
                starting_point: source.starting_point || dynCfg.starting_point || "",
                whatsapp_link: source.whatsapp_link || "",
                support_number: source.support_number || "",
                terms: source.terms || dynCfg.terms || "",
                status: source.status || "Draft"
            });

            // ── Fetch categories (handles both FK column names for backward compatibility) ────────
            if (catData.length === 0) {
                const { data: catsFallback } = await supabase
                    .from('marathon_categories')
                    .select('*')
                    .eq('event_id', marathonId)
                    .order('distance_km', { ascending: true });
                if (catsFallback && catsFallback.length > 0) {
                    catData.push(...catsFallback);
                }
            }

            // ── Final categories merging & fallback ──────────────────────────────
            let finalCategories = [];
            if (catData && catData.length > 0) {
                console.log("[MarathonForm] Using categories from marathon_categories table");
                finalCategories = catData.map((c, i) => ({
                    id: c.id || i,
                    category_name: c.category_name || "Category",
                    distance_km: Number(c.distance_km) || 0,
                    age_group: c.age_group || "Open",
                    gender_category: c.gender_category || "All",
                    price: Number(c.price) || 0,
                    slots_total: Number(c.slots_total) || 100,
                }));
            } else if (dynCfg.marathon_categories && dynCfg.marathon_categories.length > 0) {
                console.log("[MarathonForm] Using categories from dynamic_config.marathon_categories");
                finalCategories = dynCfg.marathon_categories.map((c, i) => ({
                    id: i,
                    category_name: c.category_name || "Category",
                    distance_km: Number(c.distance_km) || 0,
                    age_group: c.age_group || "Open",
                    gender_category: c.gender_category || "All",
                    price: Number(c.price) || 0,
                    slots_total: Number(c.slots_total) || 100,
                }));
            } else if (dynCfg.categories && dynCfg.categories.length > 0) {
                console.log("[MarathonForm] Using categories from dynamic_config.categories");
                finalCategories = dynCfg.categories.map((c, i) => ({
                    id: i,
                    category_name: c.name || c.category_name || "Category",
                    distance_km: Number(c.distance_km) || 0,
                    age_group: c.age_group || "Open",
                    gender_category: c.gender_category || "All",
                    price: Number(c.price) || 0,
                    slots_total: Number(c.slots_total) || 100,
                }));
            }

            if (finalCategories.length > 0) {
                setCategories(finalCategories);
            } else {
                console.warn("[MarathonForm] No categories found anywhere for", marathonId);
            }

            // ── Fetch sponsors & benefits ─────────────────────────────────────────
            const { data: spons } = await supabase
                .from('marathon_sponsors')
                .select('*')
                .eq('marathon_id', marathonId);
            if (spons && spons.length > 0) setSponsors(spons);

            const { data: bens } = await supabase
                .from('marathon_benefits')
                .select('*')
                .eq('marathon_id', marathonId);
            if (bens && bens.length > 0) setBenefits(bens);

            // ── Custom form fields from dynamic_config ────────────────────────────
            if (dynCfg.form_fields && dynCfg.form_fields.length > 0) {
                setCustomFields(dynCfg.form_fields);
            }
            if (dynCfg.faqs && dynCfg.faqs.length > 0) {
                setFaqs(dynCfg.faqs);
            }

            console.log("[MarathonForm] Data loaded successfully");
        } catch (err) {
            console.error("[MarathonForm] fetchMarathonDetails error:", err);
            showToast("Could not load event data: " + (err.message || "Unknown error"), "error");
        } finally {
            setLoading(false);
        }
    };


    const handleImageUpload = async (file, type = 'banner') => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `marathons/${type}/${fileName}`;

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

    const saveMarathon = async (newStatus = 'Draft') => {
        setLoading(true);
        try {
            // 0. Validation
            if (!eventData.title) throw new Error("Event Title is required");
            if (!eventData.event_date) throw new Error("Event Date is required");
            if (!eventData.event_time) throw new Error("Event Time is required");
            if (!eventData.venue) throw new Error("Venue Name is required");
            if (!eventData.banner_image) throw new Error("Event Poster/Banner is required");
            if (categories.length === 0) throw new Error("At least one Run Category is required");

            // 1. Sync with primary 'events' table first to maintain global visibility
            const eventPayload = {
                title: eventData.title,
                img: eventData.banner_image,
                date: eventData.event_date,
                time: eventData.event_time,
                venue: eventData.venue,
                city: eventData.city,
                state: eventData.state,
                country: eventData.country,
                pincode: eventData.zipCode,
                status: newStatus === 'Published' ? 'published' : 'draft',
                type: 'Marathon',
                organiser_id: user.id,
                latitude: Number(eventData.map_location.lat),
                longitude: Number(eventData.map_location.lng),
                address: eventData.map_location.address,
                description: eventData.description,
                end_date: eventData.event_end_date || null,
                end_time: eventData.event_end_time || null,
                expiry_date: eventData.expiry_date || null,
                price: categories.length > 0 ? Math.min(...categories.map(c => Number(c.price) || 0)) : 0,
                dynamic_config: {
                    // Simplified categories for booking sidebar price display
                    categories: categories.map(c => ({
                        id: c.id || Math.random().toString(36).substr(2, 9),
                        title: `${c.category_name} (${c.distance_km}KM)`,
                        name: `${c.category_name} (${c.distance_km}KM)`,
                        price: Number(c.price) || 0,
                        distance_km: Number(c.distance_km) || 0,
                        age_group: c.age_group || 'Open',
                        gender_category: c.gender_category || 'All',
                        slots_total: Number(c.slots_total) || 100
                    })),
                    form_fields: customFields.map(f => ({
                        ...f,
                        options: Array.isArray(f.options) ? f.options.filter(Boolean) : f.options
                    })),
                    registrationForm: customFields.map(f => ({ // keep for legacy backwards compatibility
                        ...f,
                        options: Array.isArray(f.options) ? f.options.filter(Boolean) : f.options
                    })),
                    marathonCategories: categories.map(c => ({
                        id: c.id || Math.random().toString(36).substr(2, 9),
                        category_name: c.category_name,
                        distance_km: Number(c.distance_km) || 0,
                        age_group: c.age_group || 'Open',
                        gender_category: c.gender_category || 'All',
                        price: Number(c.price) || 0,
                        slots: Number(c.slots_total) || 100,
                        totalSlots: Number(c.slots_total) || 100,
                        ageRates: c.pricing || c.ageRates || [] // Preserve age-based pricing
                    })),
                    subtitle: eventData.subtitle,
                    awareness_text: eventData.awareness_text,
                    sponsors: sponsors,
                    benefits: benefits,
                    amenities: benefits.map(b => b.benefit_name),
                    registrationEnd: eventData.reg_end_date, // For countdown timer
                    faqs: faqs,
                    terms: eventData.terms,
                    reg_dates: {
                        start: eventData.reg_start_date,
                        end: eventData.reg_end_date
                    },
                    communication: {
                        whatsapp: eventData.whatsapp_link,
                        support: eventData.support_number
                    }
                }
            };

            let marathon_id = marathonId;

            if (marathonId) {
                // Update shadow record in events table
                await supabase.from('events').update(eventPayload).eq('id', marathonId);
            } else {
                // Create shadow record in events table
                const { data, error } = await supabase.from('events').insert(eventPayload).select().single();
                if (error) throw error;
                marathon_id = data.id;
            }
            
            // 2. Upsert into 'marathon_events' (creates or updates in one operation)
            const marathonPayload = {
                id: marathon_id,
                organiser_id: user.id,
                title: eventData.title,
                subtitle: eventData.subtitle,
                awareness_text: eventData.awareness_text,
                description: eventData.description,
                banner_image: eventData.banner_image,
                event_date: eventData.event_date,
                event_time: eventData.event_time,
                event_end_date: eventData.event_end_date || null,
                event_end_time: eventData.event_end_time || null,
                venue: eventData.venue,
                city: eventData.city,
                state: eventData.state,
                country: eventData.country,
                map_location: eventData.map_location,
                route_map_image: eventData.route_map_image || null,
                starting_point: eventData.starting_point,
                reg_start_date: eventData.reg_start_date || null,
                reg_end_date: eventData.reg_end_date || null,
                expiry_date: eventData.expiry_date || null,
                whatsapp_link: eventData.whatsapp_link,
                support_number: eventData.support_number,
                terms: eventData.terms,
                status: newStatus,
                updated_at: new Date().toISOString()
            };

            const { error: mError } = await supabase
                .from('marathon_events')
                .upsert(marathonPayload, { onConflict: 'id' });
            if (mError) {
                console.warn("[MarathonForm] marathon_events upsert error:", mError.message);
                // Don't throw — events table update is the primary record
            }

            // 3. Sync Categories — relational table (legacy/compatibility)
            try {
                await supabase.from('marathon_categories').delete().eq('marathon_id', marathon_id);
                await supabase.from('marathon_categories').delete().eq('event_id', marathon_id);
                
                if (categories.length > 0) {
                    // Try to insert core fields only. 
                    // Note: Full data is already safe in dynamic_config JSON.
                    const { error: catInsertError } = await supabase.from('marathon_categories').insert(
                        categories.map(c => ({ 
                            category_name: c.category_name,
                            distance_km: Number(c.distance_km) || 0,
                            price: Number(c.price) || 0,
                            slots_total: Number(c.slots_total) || 0,
                            marathon_id: marathon_id,
                            event_id: marathon_id 
                        }))
                    );
                    if (catInsertError) console.warn("[MarathonForm] Categories table sync failed (likely schema mismatch), but JSON config is safe:", catInsertError.message);
                    else console.log("[MarathonForm] Successfully synced", categories.length, "categories to table");
                }
            } catch (catErr) {
                console.warn("[MarathonForm] Categories sync error:", catErr.message);
            }


            // 4. Sync Sponsors
            await supabase.from('marathon_sponsors').delete().eq('marathon_id', marathon_id);
            if (sponsors.length > 0) {
                await supabase.from('marathon_sponsors').insert(
                    sponsors.map(s => ({ 
                        sponsor_name: s.sponsor_name,
                        logo_url: s.logo_url,
                        sponsor_type: s.sponsor_type,
                        marathon_id 
                    }))
                );
            }

            // 5. Sync Benefits
            await supabase.from('marathon_benefits').delete().eq('marathon_id', marathon_id);
            if (benefits.length > 0) {
                await supabase.from('marathon_benefits').insert(
                    benefits.map(b => ({ 
                        benefit_name: b.benefit_name,
                        icon_key: b.icon_key,
                        marathon_id 
                    }))
                );
            }

            // 6. Sync Registration Fields
            try {
                // Delete existing active fields to replace them
                await supabase.from('registration_fields').delete().eq('event_id', marathon_id);
                if (customFields.length > 0) {
                    await supabase.from('registration_fields').insert(
                        customFields.map((f, i) => ({
                            event_id: marathon_id,
                            field_key: f.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
                            label: f.label,
                            field_type: f.type || 'text',
                            options: Array.isArray(f.options) ? f.options.filter(Boolean) : (f.options ? f.options.split(',').map(s => s.trim()) : null),
                            is_required: !!f.required,
                            sort_order: i,
                            is_active: true
                        }))
                    );
                }
            } catch (regErr) {
                console.warn("[MarathonForm] Registration fields sync error:", regErr.message);
                // Safe to ignore if table doesn't exist yet
            }

            showToast(`Marathon ${newStatus === 'Published' ? 'Published' : 'Saved'}!`, "success");
            if (onPublish) onPublish();
        } catch (err) {
            console.error("Save error:", err);
            showToast(err.message || "Failed to save marathon", "error");
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { id: 1, title: "Event Info", icon: Info },
        { id: 2, title: "Categories", icon: Trophy },
        { id: 3, title: "Pricing & Rules", icon: Timer },
        { id: 4, title: "Form Builder", icon: CheckCircle2 },
        { id: 5, title: "Content & FAQs", icon: Star },
        { id: 6, title: "Location", icon: MapPin }
    ];

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{marathonId ? "Update" : "Publish"} Marathon</h1>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{marathonId ? "Update existing marathon details" : "Create and publish a new marathon event"}</p>
            </div>
            {/* Steps Progress */}
            <div className="flex items-center justify-between mb-12 px-4">
                {steps.map((s, idx) => (
                    <React.Fragment key={s.id}>
                        <div className="flex flex-col items-center gap-3">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                                currentStep >= s.id ? 'bg-[#ec4899] text-white shadow-lg shadow-pink-200' : 'bg-slate-100 text-slate-400'
                            }`}>
                                <s.icon size={20} />
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${currentStep >= s.id ? 'text-[#ec4899]' : 'text-slate-400'}`}>
                                {s.title}
                            </span>
                        </div>
                        {idx < steps.length - 1 && <div className={`flex-1 h-0.5 mx-4 ${currentStep > s.id ? 'bg-[#ec4899]' : 'bg-slate-100'}`} />}
                    </React.Fragment>
                ))}
            </div>

            {/* Step 1: Core Info */}
            {currentStep === 1 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-[#ec4899]">
                                <ImageIcon size={20} />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 uppercase">Event Poster</h2>
                        </div>

                        <div className="relative group h-64 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden hover:border-pink-300 transition-all flex items-center justify-center">
                            {eventData.banner_image ? (
                                <>
                                    <img src={eventData.banner_image} className="absolute inset-0 w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button 
                                            onClick={() => setEventData(p => ({ ...p, banner_image: "" }))} 
                                            className="bg-white p-3 rounded-full text-red-500 shadow-xl transform scale-75 group-hover:scale-100 transition-transform"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <label className="cursor-pointer flex flex-col items-center gap-3">
                                    <Camera size={32} className="text-slate-400" />
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-slate-900">Upload Marathon Poster</p>
                                        <p className="text-xs text-slate-500">JPG, PNG or WEBP (Recommended: 1200x1600)</p>
                                    </div>
                                    <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                        const f = e.target.files?.[0];
                                        if(f) {
                                            const url = await handleImageUpload(f, 'posters');
                                            if(url) setEventData(p => ({ ...p, banner_image: url }));
                                        }
                                    }} />
                                </label>
                            )}
                        </div>

                        {/* Route Map Upload */}
                        <div className="flex items-center gap-4 mt-6">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                                <MapPin size={20} />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 uppercase">Route Map Image</h2>
                        </div>

                        <div className="relative group h-48 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden hover:border-blue-300 transition-all flex items-center justify-center mt-4">
                            {eventData.route_map_image ? (
                                <>
                                    <img src={eventData.route_map_image} className="absolute inset-0 w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button 
                                            onClick={() => setEventData(p => ({ ...p, route_map_image: "" }))} 
                                            className="bg-white p-3 rounded-full text-red-500 shadow-xl transform scale-75 group-hover:scale-100 transition-transform"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <label className="cursor-pointer flex flex-col items-center gap-3">
                                    <CloudUpload size={24} className="text-slate-400" />
                                    <div className="text-center">
                                        <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">Upload Route Map</p>
                                    </div>
                                    <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                        const f = e.target.files?.[0];
                                        if(f) {
                                            const url = await handleImageUpload(f, 'route_maps');
                                            if(url) setEventData(p => ({ ...p, route_map_image: url }));
                                        }
                                    }} />
                                </label>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-2 pl-1">Marathon Title*</label>
                            <input 
                                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-black text-slate-900 placeholder:text-slate-400"
                                placeholder="e.g. Beyond Heights Vadavalli Marathon 2026"
                                value={eventData.title}
                                onChange={e => setEventData(p => ({ ...p, title: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-2 pl-1">Awareness Campaign / Subtitle</label>
                            <input 
                                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-black text-slate-900 placeholder:text-slate-400"
                                placeholder="e.g. Autism Awareness Marathon"
                                value={eventData.awareness_text}
                                onChange={e => setEventData(p => ({ ...p, awareness_text: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-2 pl-1">Secondary Subtitle</label>
                            <input 
                                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-black text-slate-900 placeholder:text-slate-400"
                                placeholder="e.g. Run For A Cause"
                                value={eventData.subtitle}
                                onChange={e => setEventData(p => ({ ...p, subtitle: e.target.value }))}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4 md:col-span-2">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-2 pl-1">Event Start Date*</label>
                                <CalendarPicker 
                                    value={eventData.event_date} 
                                    onChange={val => setEventData(p => ({ ...p, event_date: val }))}
                                    placeholder="dd/mm/yyyy"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-2 pl-1">Event Start Time*</label>
                                <TimePicker 
                                    value={eventData.event_time} 
                                    onChange={val => setEventData(p => ({ ...p, event_time: val }))}
                                    placeholder="09:00"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-2 pl-1">Event End Date*</label>
                                <CalendarPicker 
                                    value={eventData.event_end_date} 
                                    onChange={val => setEventData(p => ({ ...p, event_end_date: val }))}
                                    placeholder="dd/mm/yyyy"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-2 pl-1">Event End Time*</label>
                                <TimePicker 
                                    value={eventData.event_end_time} 
                                    onChange={val => setEventData(p => ({ ...p, event_end_time: val }))}
                                    placeholder="18:00"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-2 pl-1">Registration Starts</label>
                                <CalendarPicker 
                                    value={eventData.reg_start_date} 
                                    onChange={val => setEventData(p => ({ ...p, reg_start_date: val }))}
                                    placeholder="dd/mm/yyyy"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-2 pl-1">Registration Ends</label>
                                <CalendarPicker 
                                    value={eventData.reg_end_date} 
                                    onChange={val => setEventData(p => ({ ...p, reg_end_date: val }))}
                                    placeholder="dd/mm/yyyy"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-2 pl-1">Event Expiry Date</label>
                                <CalendarPicker 
                                    value={eventData.expiry_date} 
                                    onChange={val => setEventData(p => ({ ...p, expiry_date: val }))}
                                    placeholder="dd/mm/yyyy"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4">
                        <button onClick={onCancel} className="px-8 py-4 text-slate-500 font-bold uppercase tracking-widest text-xs">Cancel</button>
                        <button onClick={() => setCurrentStep(2)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl flex items-center gap-2">Next <ChevronRight size={16} /></button>
                    </div>
                </div>
            )}

            {/* Step 2: Categories */}
            {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase">Run Categories</h2>
                            <p className="text-xs text-slate-500 font-bold uppercase">Define distance, age groups and pricing</p>
                        </div>
                        <button 
                            onClick={() => setCategories([...categories, { category_name: "New Run", distance_km: 5, age_group: "Open", price: 0, slots_total: 100, gender_category: "All" }])}
                            className="bg-pink-50 text-[#ec4899] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-pink-100"
                        >
                            <Plus size={14} /> Add Category
                        </button>
                    </div>

                    <div className="space-y-4">
                        {categories.map((cat, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg relative group">
                                <button 
                                    onClick={() => setCategories(categories.filter((_, i) => i !== idx))}
                                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-50 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-red-100"
                                >
                                    <Trash2 size={14} />
                                </button>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2">Category Title</label>
                                        <input className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-black text-sm text-slate-900 placeholder:text-slate-400" value={cat.category_name} onChange={e => {
                                            const nc = [...categories]; nc[idx].category_name = e.target.value; setCategories(nc);
                                        }} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2">Distance (KM)</label>
                                        <input type="number" step="0.1" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-black text-sm text-slate-900" value={cat.distance_km} onChange={e => {
                                            const nc = [...categories]; nc[idx].distance_km = e.target.value; setCategories(nc);
                                        }} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2">Age Group</label>
                                        <input className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-black text-sm text-slate-900" value={cat.age_group} onChange={e => {
                                            const nc = [...categories]; nc[idx].age_group = e.target.value; setCategories(nc);
                                        }} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-[#ec4899] uppercase tracking-widest block mb-2">Registration Fee (₹)</label>
                                        <input type="number" step="any" className="w-full bg-pink-50 border border-pink-100 p-3 rounded-xl font-black text-sm text-[#ec4899]" value={cat.price} onChange={e => {
                                            const nc = [...categories]; nc[idx].price = e.target.value; setCategories(nc);
                                        }} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2">Total Slots</label>
                                        <input type="number" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-black text-sm text-slate-900" value={cat.slots_total} onChange={e => {
                                            const nc = [...categories]; nc[idx].slots_total = e.target.value; setCategories(nc);
                                        }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between mt-8">
                        <button onClick={() => setCurrentStep(1)} className="px-10 py-4 text-slate-800 font-bold uppercase tracking-widest text-xs flex items-center gap-2"><ChevronLeft size={16} /> Back</button>
                        <button onClick={() => setCurrentStep(3)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl flex items-center gap-2">Next <ChevronRight size={16} /></button>
                    </div>
                </div>
            )}

            {/* Step 3: Pricing & Rules */}
            {currentStep === 3 && (
                <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                    <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-[#ec4899]">
                                <Timer size={20} />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 uppercase">Pricing & Rules</h2>
                        </div>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-2 pl-1">WhatsApp Channel Link</label>
                                <input 
                                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-black text-slate-900 placeholder:text-slate-400"
                                    placeholder="https://whatsapp.com/channel/..."
                                    value={eventData.whatsapp_link}
                                    onChange={e => setEventData(p => ({ ...p, whatsapp_link: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-2 pl-1">Support Contact Number</label>
                                <input 
                                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-black text-slate-900 placeholder:text-slate-400"
                                    placeholder="+91 XXXXX XXXXX"
                                    value={eventData.support_number}
                                    onChange={e => setEventData(p => ({ ...p, support_number: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="mt-8">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-black text-slate-900 uppercase">Benefits & Sponsors</h3>
                                <button 
                                    onClick={() => setSponsors([...sponsors, { sponsor_name: "", logo_url: "", sponsor_type: "Partner" }])}
                                    className="text-[10px] font-black uppercase text-pink-500 hover:underline"
                                >
                                    + Add Sponsor
                                </button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {BENEFIT_ICONS.map(b => {
                                    const active = benefits.find(ben => ben.icon_key === b.key);
                                    return (
                                        <button 
                                            key={b.key}
                                            onClick={() => {
                                                if(active) setBenefits(benefits.filter(ben => ben.icon_key !== b.key));
                                                else setBenefits([...benefits, { benefit_name: b.label, icon_key: b.key }]);
                                            }}
                                            className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                                                active ? 'bg-pink-50 border-[#ec4899] text-[#ec4899]' : 'bg-slate-50 border-slate-100 text-slate-400'
                                            }`}
                                        >
                                            <b.icon size={18} />
                                            <span className="text-[9px] font-black uppercase text-center leading-tight">{b.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Added Sponsors List */}
                            {sponsors.length > 0 && (
                                <div className="mt-6 space-y-3">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manage Sponsors</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {sponsors.map((s, idx) => (
                                            <div key={idx} className="bg-slate-50 p-4 rounded-[2rem] border border-slate-100 relative group">
                                                <button 
                                                    onClick={() => setSponsors(sponsors.filter((_, i) => i !== idx))}
                                                    className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full shadow-md text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                >
                                                    <X size={12} />
                                                </button>
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden">
                                                            {s.logo_url ? <img src={s.logo_url} className="w-full h-full object-contain" /> : <Star size={20} className="text-slate-200" />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <input 
                                                                className="w-full bg-transparent border-b border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-pink-500 pb-1"
                                                                placeholder="Sponsor Name"
                                                                value={s.sponsor_name}
                                                                onChange={e => {
                                                                    const ns = [...sponsors];
                                                                    ns[idx].sponsor_name = e.target.value;
                                                                    setSponsors(ns);
                                                                }}
                                                            />
                                                            <select 
                                                                className="w-full bg-transparent text-[10px] text-slate-500 font-bold uppercase mt-1 focus:outline-none"
                                                                value={s.sponsor_type}
                                                                onChange={e => {
                                                                    const ns = [...sponsors];
                                                                    ns[idx].sponsor_type = e.target.value;
                                                                    setSponsors(ns);
                                                                }}
                                                            >
                                                                <option>Title Sponsor</option>
                                                                <option>Powered By</option>
                                                                <option>Associate Partner</option>
                                                                <option>Partner</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="relative">
                                                        <input 
                                                            className="w-full bg-white border border-slate-100 p-2 rounded-xl text-[10px] font-medium text-slate-600 truncate pr-8"
                                                            placeholder="Paste Logo URL"
                                                            value={s.logo_url}
                                                            onChange={e => {
                                                                const ns = [...sponsors];
                                                                ns[idx].logo_url = e.target.value;
                                                                setSponsors(ns);
                                                            }}
                                                        />
                                                        <label className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-pink-500">
                                                            <CloudUpload size={14} />
                                                            <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                                                const f = e.target.files?.[0];
                                                                if(f) {
                                                                    const url = await handleImageUpload(f, 'sponsors');
                                                                    if(url) {
                                                                        const ns = [...sponsors];
                                                                        ns[idx].logo_url = url;
                                                                        setSponsors(ns);
                                                                    }
                                                                }
                                                            }} />
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    <div className="flex justify-between mt-8">
                        <button onClick={() => setCurrentStep(2)} className="px-10 py-4 text-slate-800 font-bold uppercase tracking-widest text-xs flex items-center gap-2"><ChevronLeft size={16} /> Back</button>
                        <button onClick={() => setCurrentStep(4)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl flex items-center gap-2">Next <ChevronRight size={16} /></button>
                    </div>
                </div>
            )}

            {/* Step 4: Form Builder */}
            {currentStep === 4 && (
                <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                    <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-[#ec4899]">
                                    <CheckCircle2 size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 uppercase">Form Builder</h2>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Customize registration fields</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setCustomFields([...customFields, { id: Date.now(), label: "New Field", type: "text", required: false }])}
                                className="w-10 h-10 bg-pink-50 text-[#ec4899] rounded-xl flex items-center justify-center"
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {customFields.map((field, idx) => (
                                <div key={field.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center gap-6">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400">
                                        <Info size={18} />
                                    </div>
                                    <div className="flex-1 grid grid-cols-2 gap-4">
                                        <input 
                                            className="bg-transparent border-b border-slate-200 p-2 text-sm font-black text-slate-900 outline-none focus:border-pink-500 transition-all"
                                            value={field.label}
                                            onChange={e => {
                                                const nf = [...customFields]; nf[idx].label = e.target.value; setCustomFields(nf);
                                            }}
                                        />
                                        <div className="flex items-center gap-4">
                                            <select 
                                                className="bg-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase text-slate-600 border border-slate-100"
                                                value={field.type}
                                                onChange={e => {
                                                    const nf = [...customFields]; nf[idx].type = e.target.value; setCustomFields(nf);
                                                }}
                                            >
                                                <option value="text">Text Input</option>
                                                <option value="email">Email</option>
                                                <option value="phone">Phone</option>
                                                <option value="select">Dropdown</option>
                                            </select>
                                            {field.type === 'select' && (
                                                <input 
                                                    className="bg-white px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-600 border border-slate-100 min-w-[150px]"
                                                    placeholder="Options (comma separated)"
                                                    value={field.options ? field.options.join(', ') : ''}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        const nf = [...customFields];
                                                        // Allow empty strings while typing to maintain comma position
                                                        nf[idx].options = val.split(',').map(o => o.trim());
                                                        setCustomFields(nf);
                                                    }}
                                                />
                                            )}
                                        </div>
                                            <button 
                                                onClick={() => {
                                                    const nf = [...customFields]; nf[idx].required = !nf[idx].required; setCustomFields(nf);
                                                }}
                                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                                    field.required ? 'bg-[#ec4899] text-white' : 'bg-slate-200 text-slate-400'
                                                }`}
                                            >
                                                Required
                                            </button>
                                        </div>
                                    <button 
                                        onClick={() => setCustomFields(customFields.filter(f => f.id !== field.id))}
                                        className="text-slate-300 hover:text-red-500"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>

                    <div className="flex justify-between mt-8">
                        <button onClick={() => setCurrentStep(3)} className="px-10 py-4 text-slate-800 font-bold uppercase tracking-widest text-xs flex items-center gap-2"><ChevronLeft size={16} /> Back</button>
                        <button onClick={() => setCurrentStep(5)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl flex items-center gap-2">Next <ChevronRight size={16} /></button>
                    </div>
                </div>
            )}

            {/* Step 5: Content & FAQs */}
            {currentStep === 5 && (
                <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                    <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-[#ec4899]">
                                    <Star size={20} />
                                </div>
                                <h2 className="text-xl font-black text-slate-900 uppercase">Content & FAQs</h2>
                            </div>
                            <button 
                                onClick={() => setFaqs([...faqs, { question: "", answer: "" }])}
                                className="text-[10px] font-black uppercase text-pink-500 hover:underline"
                            >
                                + Add FAQ
                            </button>
                        </div>

                        <div className="space-y-6">
                            {faqs.map((f, idx) => (
                                <div key={idx} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4 relative group">
                                    <input 
                                        className="w-full bg-transparent font-black text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                                        placeholder="Question"
                                        value={f.question}
                                        onChange={e => {
                                            const nf = [...faqs]; nf[idx].question = e.target.value; setFaqs(nf);
                                        }}
                                    />
                                    <textarea 
                                        className="w-full bg-transparent text-xs font-medium text-slate-600 placeholder:text-slate-400 outline-none resize-none"
                                        rows={2}
                                        placeholder="Answer"
                                        value={f.answer}
                                        onChange={e => {
                                            const nf = [...faqs]; nf[idx].answer = e.target.value; setFaqs(nf);
                                        }}
                                    />
                                    <button 
                                        onClick={() => setFaqs(faqs.filter((_, i) => i !== idx))}
                                        className="absolute top-4 right-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-all hover:text-red-500"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="pt-8 border-t border-slate-100">
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-4 pl-1">Terms & Conditions</label>
                            <textarea 
                                className="w-full bg-slate-50 border border-slate-200 p-6 rounded-[2rem] text-xs font-medium text-slate-600 outline-none focus:border-pink-300 transition-all"
                                rows={8}
                                placeholder="Enter event rules, refund policy, etc."
                                value={eventData.terms}
                                onChange={e => setEventData(p => ({ ...p, terms: e.target.value }))}
                            />
                        </div>
                    </section>

                    <div className="flex justify-between mt-8">
                        <button onClick={() => setCurrentStep(4)} className="px-10 py-4 text-slate-800 font-bold uppercase tracking-widest text-xs flex items-center gap-2"><ChevronLeft size={16} /> Back</button>
                        <button onClick={() => setCurrentStep(6)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl flex items-center gap-2">Next <ChevronRight size={16} /></button>
                    </div>
                </div>
            )}

            {/* Step 6: Location */}
            {currentStep === 6 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <MapPin size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 uppercase">Venue & Routes</h2>
                                <p className="text-xs text-slate-500 font-bold uppercase">Pin the starting point on map</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-2 pl-1">Full Venue Name / Starting Point</label>
                                <input 
                                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-black text-slate-900 placeholder:text-slate-400"
                                    placeholder="e.g. RPM school, Vadavalli, Coimbatore"
                                    value={eventData.venue}
                                    onChange={e => setEventData(p => ({ ...p, venue: e.target.value, starting_point: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-2 pl-1">Country</label>
                                <CustomSelect 
                                    value={eventData.country}
                                    options={COUNTRIES}
                                    onChange={(v) => {
                                        const countryData = COUNTRIES.find(c => (c.label || c) === v);
                                        const code = countryData?.code || "IN";
                                        setEventData(p => ({
                                            ...p,
                                            country: v,
                                            countryCode: code,
                                            state: "", stateCode: "", district: "", city: "", zipCode: ""
                                        }));
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-2 pl-1">State / Province</label>
                                <CustomSelect 
                                    value={eventData.state}
                                    options={State.getStatesOfCountry(eventData.countryCode).map(s => s.name)}
                                    onChange={(v) => {
                                        const stateObj = State.getStatesOfCountry(eventData.countryCode).find(s => s.name === v);
                                        setEventData(p => ({
                                            ...p,
                                            state: v,
                                            stateCode: stateObj?.isoCode || "",
                                            district: "", city: ""
                                        }));
                                    }}
                                />
                            </div>
                            {(eventData.country === "India" || !eventData.country) ? (
                                <>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-2 pl-1">District</label>
                                        <CustomSelect 
                                            value={eventData.district}
                                            options={[...new Set([...dbDistricts, ...getIndianDistricts(eventData.state)])].filter(Boolean)}
                                            isLoading={distLoading}
                                            onChange={(v) => setEventData(p => ({ ...p, district: v, city: "", zipCode: "" }))}
                                        />
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-6">
                                        <div className="flex-1">
                                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-2 pl-1">City / Town</label>
                                            <CustomSelect 
                                                value={eventData.city}
                                                options={dbCities.length > 0 ? dbCities : getIndianCities(eventData.district)}
                                                isLoading={cityLoading}
                                                onChange={async (v) => {
                                                    setEventData(p => ({ ...p, city: v }));
                                                    try {
                                                        const coords = await geocode(`${v}, ${eventData.state}, ${eventData.country}`);
                                                        if (coords) setEventData(p => ({ ...p, map_location: { ...p.map_location, lat: coords.lat, lng: coords.lng } }));
                                                    } catch (err) {}
                                                }}
                                            />
                                        </div>
                                        <div className="sm:w-[140px]">
                                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-2 pl-1">Pincode</label>
                                            <input 
                                                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-black text-slate-900 placeholder:text-slate-400 shadow-inner"
                                                placeholder="Pincode"
                                                value={eventData.zipCode}
                                                onChange={e => setEventData(p => ({ ...p, zipCode: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                    <div className="flex flex-col sm:flex-row gap-6">
                                        <div className="flex-1">
                                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-2 pl-1">City / Town</label>
                                            <CustomSelect 
                                                value={eventData.city}
                                                options={City.getCitiesOfState(eventData.countryCode, eventData.stateCode).map(c => c.name)}
                                                onChange={async (v) => {
                                                    setEventData(p => ({ ...p, city: v }));
                                                    try {
                                                        const coords = await geocode(`${v}, ${eventData.state}, ${eventData.country}`);
                                                        if (coords) setEventData(p => ({ ...p, map_location: { ...p.map_location, lat: coords.lat, lng: coords.lng } }));
                                                    } catch (err) {}
                                                }}
                                            />
                                        </div>
                                        <div className="sm:w-[140px]">
                                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-2 pl-1">Zip Code</label>
                                            <input 
                                                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-black text-slate-900 placeholder:text-slate-400 shadow-inner"
                                                placeholder="Zip"
                                                value={eventData.zipCode}
                                                onChange={e => setEventData(p => ({ ...p, zipCode: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                )}
                        </div>

                        <div className="h-[400px] rounded-[2rem] overflow-hidden border border-slate-200 relative group shadow-inner">
                            <GoogleInlineMap 
                                lat={eventData.map_location.lat} 
                                lng={eventData.map_location.lng}
                                showAutocomplete={false}
                                onLocationSelect={async (lat, lng) => {
                                    const geo = await reverseGeocode(lat, lng);
                                    if (geo) {
                                        setEventData(p => ({
                                            ...p,
                                            map_location: { lat, lng, address: geo.fullAddress || "" },
                                            city: geo.city || p.city,
                                            district: geo.district || p.district,
                                            state: geo.state || p.state,
                                            country: geo.country || p.country,
                                            zipCode: geo.zipCode || p.zipCode
                                        }));
                                    }
                                }}
                            />
                            <div className="absolute top-4 left-4 right-4 bg-white/80 backdrop-blur-md p-3 rounded-2xl border border-white shadow-xl flex items-center gap-3">
                                <Target size={18} className="text-indigo-500" />
                                <span className="text-[10px] font-black uppercase text-slate-900 truncate flex-1">{eventData.map_location.address || "Pin Starting Point"}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between mt-8">
                        <button onClick={() => setCurrentStep(5)} className="px-10 py-4 text-slate-800 font-bold uppercase tracking-widest text-xs flex items-center gap-2"><ChevronLeft size={16} /> Back</button>
                        <div className="flex gap-4">
                            <button onClick={() => saveMarathon('Draft')} disabled={loading} className="px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-slate-50 transition-all">Save Draft</button>
                            <button onClick={() => saveMarathon('Published')} disabled={loading} className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl flex items-center gap-2">
                                {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                                {marathonId ? "Update Event" : "Go Live & Publish"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
