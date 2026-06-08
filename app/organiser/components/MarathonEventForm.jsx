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
import AboutEventEditor from "@/components/AboutEventEditor";

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

export default function MarathonEventForm({ marathonId, isRSVP, onCancel, onPublish }) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [localMarathonId, setLocalMarathonId] = useState(marathonId || null);

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
        organiser_name: "",
        status: "Draft",
        bulk_discount_percent: 0,
        min_bulk_tickets: 5,
        ticket_discount_percent: 0
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
        if (localMarathonId) {
            fetchMarathonDetails();
        }
    }, [localMarathonId]);

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
            const [cRes, mRes, eRes, meRes] = await Promise.all([
                supabase.from('marathon_categories').select('*').eq('marathon_id', localMarathonId).order('distance_km', { ascending: true }),
                supabase.from('marathon_config').select('*').eq('id', localMarathonId).maybeSingle(),
                supabase.from('events').select('*').eq('id', localMarathonId).maybeSingle(),
                supabase.from('marathon_events').select('*').eq('id', localMarathonId).maybeSingle()
            ]);

            let catData = cRes.data || [];
            const mEvent = mRes.data;
            const eventsRow = eRes.data;
            const meEvent = meRes.data;

            const source = { ...(eventsRow || {}), ...(meEvent || {}), ...(mEvent || {}) };
            if (!eventsRow && !mEvent && !meEvent) {
                console.error("[MarathonForm] No data found for ID:", localMarathonId);
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
                route_map_image: source.route_map_image || source.route_map_url || "",
                starting_point: source.starting_point || dynCfg.starting_point || "",
                whatsapp_link: source.whatsapp_link || dynCfg.communication?.whatsapp || "",
                support_number: source.support_number || dynCfg.communication?.support || "",
                terms: source.terms_conditions || source.terms || dynCfg.terms || "",
                organiser_name: dynCfg.organiser_name || "",
                status: source.status || "Draft",
                bulk_discount_percent: dynCfg.discounts?.bulk_percent || 0,
                min_bulk_tickets: dynCfg.discounts?.min_bulk_tickets || 5,
                ticket_discount_percent: dynCfg.discounts?.ticket_percent || 0
            });

            // ── Fetch categories (handles both FK column names for backward compatibility) ────────
            // Fallback removed because event_id column does not exist in marathon_categories.

            // ── Final categories merging & fallback ──────────────────────────────
            let finalCategories = [];
            if (catData && catData.length > 0) {
                console.log("[MarathonForm] Using categories from marathon_categories table");
                finalCategories = catData.map((c, i) => ({
                    id: c.id || i,
                    category_name: c.category_name || c.title || c.name || "Category",
                    distance_km: Number(c.distance_km) || 0,
                    age_group: c.age_group || "Open",
                    gender_category: c.gender_category || "All",
                    price: Number(c.price) || 0,
                    slots_total: Number(c.slots_total) || Number(c.total_slots) || Number(c.slots) || 100,
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
                .eq('marathon_id', localMarathonId);
            
            const dynSponsors = source.sponsor_logos || dynCfg.sponsors || dynCfg.sponsor_logos || [];
            if (spons && spons.length > 0) {
                setSponsors(spons);
            } else if (dynSponsors.length > 0) {
                setSponsors(dynSponsors.map(s => typeof s === 'string' ? { name: '', logo: s } : s));
            }

            const { data: bens } = await supabase
                .from('marathon_benefits')
                .select('*')
                .eq('marathon_id', localMarathonId);
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

    const saveMarathon = async (newStatus = 'Draft', isAutoSave = false) => {
        if (!isAutoSave) setLoading(true);
        try {
            // 0. Validation
            if (!isAutoSave) {
                if (!eventData.title) throw new Error("Event Title is required");
                if (!eventData.event_date) throw new Error("Event Date is required");
                if (!eventData.event_time) throw new Error("Event Time is required");
                if (!eventData.venue && !eventData.map_location?.address) throw new Error("Venue Name is required");
                if (!eventData.banner_image) throw new Error("Event Poster/Banner is required");
                if (categories.length === 0) throw new Error("At least one Run Category is required");
            }

            // 1. Sync with primary 'events' table first to maintain global visibility
            const eventPayload = {
                title: eventData.title || "Untitled Marathon",
                event_name: eventData.title || "Untitled Marathon",
                subtitle: eventData.subtitle,
                img: eventData.banner_image,
                date: eventData.event_date || null,
                time: eventData.event_time || null,
                venue: eventData.venue || null,
                city: eventData.city,
                state: eventData.state,
                country: eventData.country,
                district: eventData.district || null,
                pincode: eventData.zipCode,
                status: newStatus === 'Published' || eventData.status?.toLowerCase() === 'published' ? 'published' : newStatus === 'PendingReview' ? 'pending_review' : 'draft',
                publish_status: newStatus === 'Published' || eventData.status?.toLowerCase() === 'published' ? 'published' : newStatus === 'PendingReview' ? 'pending_review' : 'draft',
                visibility_status: 'public',
                approval_status: 'approved',
                listing_status: 'active',
                entity_type: 'event',
                type: 'Marathon',
                event_type: isRSVP ? 'RSVP' : 'Marathon',
                is_paid: !isRSVP,
                requires_payment: !isRSVP,
                ticket_mode: isRSVP ? 'free' : 'paid',
                organiser_id: user.id,
                latitude: Number(eventData.map_location.lat),
                longitude: Number(eventData.map_location.lng),
                address: eventData.map_location.address,
                description: eventData.description,
                terms_conditions: eventData.terms,
                sponsor_logos: sponsors.map(s => s.logo),
                event_start_at: (() => {
                    const dt = new Date(`${eventData.event_date}T${eventData.event_time || '00:00'}`);
                    return !isNaN(dt.getTime()) ? dt.toISOString() : null;
                })(),
                event_end_at: (() => {
                    if(!eventData.event_end_date) return null;
                    const dt = new Date(`${eventData.event_end_date}T${eventData.event_end_time || '23:59'}`);
                    return !isNaN(dt.getTime()) ? dt.toISOString() : null;
                })(),
                end_date: eventData.event_end_date || null,
                end_time: eventData.event_end_time || null,
                expiry_date: eventData.expiry_date || null,
                price: isRSVP ? 0 : (categories.length > 0 ? Math.min(...categories.map(c => Number(c.price) || 0)) : 0),
                dynamic_config: {
                    // Simplified categories for booking sidebar price display
                    categories: categories.map(c => ({
                        id: c.id || Math.random().toString(36).substr(2, 9),
                        title: `${c.category_name} (${c.distance_km}KM)`,
                        name: `${c.category_name} (${c.distance_km}KM)`,
                        price: isRSVP ? 0 : (Number(c.price) || 0),
                        distance_km: Number(c.distance_km) || 0,
                        age_group: c.age_group || 'Open',
                        gender_category: c.gender_category || 'All',
                        slots_total: Number(c.slots_total) || 100,
                        waitlist: c.waitlist || false,
                        autoApprove: c.autoApprove !== false
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
                        price: isRSVP ? 0 : (Number(c.price) || 0),
                        slots: Number(c.slots_total) || 100,
                        totalSlots: Number(c.slots_total) || 100,
                        waitlist: c.waitlist || false,
                        autoApprove: c.autoApprove !== false,
                        ageRates: isRSVP ? [] : (c.pricing || c.ageRates || []) // Preserve age-based pricing
                    })),
                    subtitle: eventData.subtitle,
                    awareness_text: eventData.awareness_text,
                    sponsors: sponsors,
                    benefits: benefits,
                    amenities: benefits.map(b => b.benefit_name),
                    registrationEnd: eventData.reg_end_date, // For countdown timer
                    faqs: faqs,
                    terms: eventData.terms,
                    organiser_name: eventData.organiser_name,
                    reg_dates: {
                        start: eventData.reg_start_date,
                        end: eventData.reg_end_date
                    },
                    discounts: {
                        bulk_percent: Number(eventData.bulk_discount_percent) || 0,
                        min_bulk_tickets: Number(eventData.min_bulk_tickets) || 5,
                        ticket_percent: Number(eventData.ticket_discount_percent) || 0
                    },
                    communication: {
                        whatsapp: eventData.whatsapp_link,
                        support: eventData.support_number
                    }
                }
            };

            let marathon_id = localMarathonId;

            // Construct marathon_events payload
            const marathonEventsPayload = {
                title: eventData.title || "Untitled Marathon",
                subtitle: eventData.subtitle,
                awareness_text: eventData.awareness_text,
                description: eventData.description,
                banner_image: eventData.banner_image,
                logo_url: eventData.logo_url || null,
                event_date: eventData.event_date || null,
                event_time: eventData.event_time || null,
                event_end_date: eventData.event_end_date || null,
                event_end_time: eventData.event_end_time || null,
                venue: eventData.venue || null,
                city: eventData.city,
                state: eventData.state,
                country: eventData.country,
                district: eventData.district || null,
                map_location: eventData.map_location,
                route_map_image: eventData.route_map_image || null,
                starting_point: eventData.starting_point,
                reg_start_date: eventData.reg_start_date || null,
                reg_end_date: eventData.reg_end_date || null,
                organiser_name: eventData.organiser_name || null,
                whatsapp_link: eventData.whatsapp_link,
                support_number: eventData.support_number,
                terms: eventData.terms,
                status: newStatus === 'Published' || eventData.status?.toLowerCase() === 'published' ? 'published' : newStatus === 'PendingReview' ? 'pending_review' : 'draft',
                updated_at: new Date().toISOString()
            };

            // Construct marathon_config payload
            const marathonPayload = {
                route_map_url: eventData.route_map_image || null,
                updated_at: new Date().toISOString()
            };

            // Fetch session token for secure bearer auth
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch('/api/organiser/marathon', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    localMarathonId,
                    eventPayload,
                    marathonEventsPayload,
                    marathonPayload,
                    categories,
                    sponsors,
                    benefits,
                    customFields,
                    newStatus
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to save marathon");
            }

            const { marathon_id: saved_id } = await response.json();
            marathon_id = saved_id;

            setEventData(prev => ({
                ...prev,
                status: newStatus === 'Published' || prev.status?.toLowerCase() === 'published' ? 'published' : newStatus === 'PendingReview' ? 'pending_review' : 'draft'
            }));

            if (!isAutoSave) {
                showToast(`Marathon ${newStatus === 'Published' ? 'Published' : newStatus === 'PendingReview' ? 'Submitted for Review' : 'Saved'}!`, "success");
                if (onPublish) onPublish();
            } else {
                if (!localMarathonId && marathon_id) {
                    setLocalMarathonId(marathon_id);
                }
            }
        } catch (err) {
            console.error("Save error:", err);
            if (!isAutoSave) {
                showToast(err.message || "Failed to save marathon", "error");
            }
        } finally {
            if (!isAutoSave) setLoading(false);
        }
    };

    const handleNext = async (step) => {
        // Auto-save silently before moving to next step
        await saveMarathon('Draft', true);
        setCurrentStep(step);
    };

    const steps = [
        { id: 1, title: "Event Info", icon: Info },
        { id: 2, title: isRSVP ? "RSVP Settings" : "Categories", icon: isRSVP ? Users : Trophy },
        ...(!isRSVP ? [{ id: 3, title: "Pricing & Rules", icon: Timer }] : []),
        { id: isRSVP ? 3 : 4, title: "Form Builder", icon: CheckCircle2 },
        { id: isRSVP ? 4 : 5, title: "Content & FAQs", icon: Star },
        { id: isRSVP ? 5 : 6, title: marathonId ? "Update" : "Location", icon: MapPin }
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            {/* Route Map Upload */}
                            <div>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                                        <MapPin size={20} />
                                    </div>
                                    <h2 className="text-xl font-black text-slate-900 uppercase">Route Map Image</h2>
                                </div>
                                <div className="relative group h-48 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden hover:border-blue-300 transition-all flex items-center justify-center">
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
                                        <label className="cursor-pointer flex flex-col items-center gap-3 w-full h-full justify-center">
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
                            
                            {/* Event Logo Upload */}
                            <div>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                                        <Star size={20} />
                                    </div>
                                    <h2 className="text-xl font-black text-slate-900 uppercase">Sponsor / Event Logo</h2>
                                </div>
                                <div className="relative group h-48 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden hover:border-indigo-300 transition-all flex items-center justify-center">
                                    {eventData.logo_url ? (
                                        <>
                                            <img src={eventData.logo_url} className="absolute inset-0 w-full h-full object-contain p-4" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button 
                                                    onClick={() => setEventData(p => ({ ...p, logo_url: "" }))} 
                                                    className="bg-white p-3 rounded-full text-red-500 shadow-xl transform scale-75 group-hover:scale-100 transition-transform"
                                                >
                                                    <X size={20} />
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <label className="cursor-pointer flex flex-col items-center gap-3 w-full h-full justify-center">
                                            <CloudUpload size={24} className="text-slate-400" />
                                            <div className="text-center">
                                                <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">Upload Logo</p>
                                            </div>
                                            <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                                const f = e.target.files?.[0];
                                                if(f) {
                                                    const url = await handleImageUpload(f, 'posters');
                                                    if(url) setEventData(p => ({ ...p, logo_url: url }));
                                                }
                                            }} />
                                        </label>
                                    )}
                                </div>
                            </div>
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
                        <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-2 pl-1">Organised By (Name)</label>
                            <input 
                                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-black text-slate-900 placeholder:text-slate-400"
                                placeholder="e.g. Partner Name"
                                value={eventData.organiser_name}
                                onChange={e => setEventData(p => ({ ...p, organiser_name: e.target.value }))}
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
                        <button onClick={() => handleNext(2)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl flex items-center gap-2">Next <ChevronRight size={16} /></button>
                    </div>
                </div>
            )}

            {/* Step 2: Categories */}
            {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase">{isRSVP ? "RSVP Configuration" : "Run Categories"}</h2>
                            <p className="text-xs text-slate-500 font-bold uppercase">{isRSVP ? "Define RSVP capacity and registration dates" : "Define distance, age groups and pricing"}</p>
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
                                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2">Distance</label>
                                        <div className="flex gap-2">
                                            <input type="number" step="0.1" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-black text-sm text-slate-900" value={cat.distance_km} onChange={e => {
                                                const nc = [...categories]; nc[idx].distance_km = e.target.value; setCategories(nc);
                                            }} />
                                            <div className="w-28 mt-[-12px]">
                                                <CustomSelect 
                                                    value={cat.distance_unit || "KM"} 
                                                    options={["KM", "M"]} 
                                                    onChange={val => {
                                                        const nc = [...categories]; nc[idx].distance_unit = val; setCategories(nc);
                                                    }} 
                                                    searchable={false}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2">Age Group</label>
                                        <input className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-black text-sm text-slate-900" value={cat.age_group} onChange={e => {
                                            const nc = [...categories]; nc[idx].age_group = e.target.value; setCategories(nc);
                                        }} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2">Gender</label>
                                        <div className="mt-[-12px]">
                                            <CustomSelect 
                                                value={cat.gender_category || "All"} 
                                                options={["All", "Men", "Women"]} 
                                                onChange={val => {
                                                    const nc = [...categories]; nc[idx].gender_category = val; setCategories(nc);
                                                }} 
                                                searchable={false}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2">{isRSVP ? "Maximum Capacity" : "Participant Capacity"}</label>
                                        <input type="number" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-black text-sm text-slate-900" value={cat.slots_total} onChange={e => {
                                            const nc = [...categories]; nc[idx].slots_total = e.target.value; setCategories(nc);
                                        }} />
                                    </div>
                                    {isRSVP && (
                                        <>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2">Waitlist Enabled</label>
                                                <div className="mt-[-12px]">
                                                    <CustomSelect 
                                                        value={cat.waitlist ? "Yes" : "No"} 
                                                        options={["Yes", "No"]} 
                                                        onChange={val => {
                                                            const nc = [...categories]; nc[idx].waitlist = val === "Yes"; setCategories(nc);
                                                        }} 
                                                        searchable={false}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2">Approval Mode</label>
                                                <div className="mt-[-12px]">
                                                    <CustomSelect 
                                                        value={cat.autoApprove === false ? "Manual Approve" : "Auto Approve"} 
                                                        options={["Auto Approve", "Manual Approve"]} 
                                                        onChange={val => {
                                                            const nc = [...categories]; nc[idx].autoApprove = val === "Auto Approve"; setCategories(nc);
                                                        }} 
                                                        searchable={false}
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    {!isRSVP && (
                                        <>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2">Prize Amount (₹)</label>
                                                <input type="number" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-black text-sm text-slate-900" value={cat.prize_amount || ""} onChange={e => {
                                                    const nc = [...categories]; nc[idx].prize_amount = e.target.value; setCategories(nc);
                                                }} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-[#ec4899] uppercase tracking-widest block mb-2">Registration Fee (₹)</label>
                                                <input type="number" step="any" className="w-full bg-pink-50 border border-pink-100 p-3 rounded-xl font-black text-sm text-[#ec4899]" value={cat.price} onChange={e => {
                                                    const nc = [...categories]; nc[idx].price = e.target.value; setCategories(nc);
                                                }} />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between mt-8">
                        <button onClick={() => setCurrentStep(1)} className="px-10 py-4 text-slate-800 font-bold uppercase tracking-widest text-xs flex items-center gap-2"><ChevronLeft size={16} /> Back</button>
                        <button onClick={() => handleNext(isRSVP ? 3 : 3)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl flex items-center gap-2">Next <ChevronRight size={16} /></button>
                    </div>
                </div>
            )}

            {/* Step 3: Pricing & Rules */}
            {!isRSVP && currentStep === 3 && (
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

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-2 pl-1">Ticket Discount (%)</label>
                                <input 
                                    type="number"
                                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-black text-slate-900 placeholder:text-slate-400"
                                    placeholder="e.g. 10"
                                    value={eventData.ticket_discount_percent}
                                    onChange={e => setEventData(p => ({ ...p, ticket_discount_percent: e.target.value }))}
                                />
                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 pl-1">General flat discount applied to tickets.</p>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-2 pl-1">Bulk Booking Discount (%)</label>
                                <input 
                                    type="number"
                                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-black text-slate-900 placeholder:text-slate-400"
                                    placeholder="e.g. 15"
                                    value={eventData.bulk_discount_percent}
                                    onChange={e => setEventData(p => ({ ...p, bulk_discount_percent: e.target.value }))}
                                />
                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 pl-1">Discount applied for group bookings.</p>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-2 pl-1">Min Tickets for Bulk</label>
                                <input 
                                    type="number"
                                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-black text-slate-900 placeholder:text-slate-400"
                                    placeholder="e.g. 5"
                                    value={eventData.min_bulk_tickets}
                                    onChange={e => setEventData(p => ({ ...p, min_bulk_tickets: e.target.value }))}
                                />
                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 pl-1">Minimum count to trigger bulk discount.</p>
                            </div>
                        </div>

                        <div className="mt-8">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-black text-slate-900 uppercase">Benefits & Sponsors</h3>
                                <div className="flex items-center gap-4">
                                    <label className="cursor-pointer text-[10px] font-black uppercase text-indigo-500 hover:underline flex items-center gap-1">
                                        <CloudUpload size={14} /> Batch Upload Logos
                                        <input type="file" multiple className="hidden" accept="image/*" onChange={async (e) => {
                                            const files = Array.from(e.target.files || []);
                                            if (!files.length) return;
                                            
                                            showToast(`Uploading ${files.length} sponsor logos...`, "info");
                                            const newSponsors = [...sponsors];
                                            
                                            for (const f of files) {
                                                const url = await handleImageUpload(f, 'sponsors');
                                                if (url) {
                                                    // Extract name from filename (remove extension and replace special chars)
                                                    let name = f.name.split('.').slice(0, -1).join('.');
                                                    name = name.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                                    
                                                    newSponsors.push({ 
                                                        sponsor_name: name, 
                                                        logo_url: url, 
                                                        sponsor_type: "Partner" 
                                                    });
                                                }
                                            }
                                            
                                            setSponsors(newSponsors);
                                            showToast("Sponsors uploaded successfully", "success");
                                        }} />
                                    </label>
                                    <button 
                                        onClick={() => setSponsors([...sponsors, { sponsor_name: "", logo_url: "", sponsor_type: "Partner" }])}
                                        className="text-[10px] font-black uppercase text-pink-500 hover:underline"
                                    >
                                        + Add Sponsor
                                    </button>
                                </div>
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
                                                        <label className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-pink-400 transition-colors relative group/logo">
                                                            {s.logo_url ? <img src={s.logo_url} className="w-full h-full object-contain p-2" /> : <CloudUpload size={20} className="text-slate-300" />}
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center transition-opacity">
                                                                <CloudUpload size={16} className="text-white" />
                                                            </div>
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
                                                        <div className="flex-1">
                                                            <input 
                                                                className="w-full bg-transparent border-b border-slate-200 text-sm font-black text-slate-900 focus:outline-none focus:border-pink-500 pb-1"
                                                                placeholder="Sponsor Name"
                                                                value={s.sponsor_name}
                                                                onChange={e => {
                                                                    const ns = [...sponsors];
                                                                    ns[idx].sponsor_name = e.target.value;
                                                                    setSponsors(ns);
                                                                }}
                                                            />
                                                            <div className="mt-2 relative z-50 min-w-[150px]">
                                                                <CustomSelect 
                                                                    value={s.sponsor_type}
                                                                    onChange={val => {
                                                                        const ns = [...sponsors];
                                                                        ns[idx].sponsor_type = val;
                                                                        setSponsors(ns);
                                                                    }}
                                                                    options={["Title Sponsor", "Powered By", "Associate Partner", "Partner"]}
                                                                />
                                                            </div>
                                                        </div>
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
                        <button onClick={() => handleNext(4)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl flex items-center gap-2">Next <ChevronRight size={16} /></button>
                    </div>
                </div>
            )}

            {/* Step 4: Form Builder */}
            {currentStep === (isRSVP ? 3 : 4) && (
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
                                            <div className="relative z-50 min-w-[150px]">
                                                <CustomSelect 
                                                    value={field.type}
                                                    onChange={val => {
                                                        const nf = [...customFields]; nf[idx].type = val; setCustomFields(nf);
                                                    }}
                                                    options={[
                                                        { label: "Text Input", value: "text" },
                                                        { label: "Email", value: "email" },
                                                        { label: "Phone", value: "phone" },
                                                        { label: "Dropdown", value: "select" }
                                                    ]}
                                                />
                                            </div>
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
                        <button onClick={() => setCurrentStep(isRSVP ? 2 : 3)} className="px-10 py-4 text-slate-800 font-bold uppercase tracking-widest text-xs flex items-center gap-2"><ChevronLeft size={16} /> Back</button>
                        <button onClick={() => handleNext(isRSVP ? 4 : 5)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl flex items-center gap-2">Next <ChevronRight size={16} /></button>
                    </div>
                </div>
            )}

            {/* Step 5: Content & FAQs */}
            {currentStep === (isRSVP ? 4 : 5) && (
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

                        {/* About Event Rich Editor — saves directly to Supabase */}
                        {localMarathonId && (
                            <div className="pt-8 border-t border-slate-100">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white">
                                        <Star size={15} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 uppercase">About Event — Rich Content</h3>
                                        <p className="text-[10px] text-slate-400">Highlights, FAQs, Rules & more — saved directly to event</p>
                                    </div>
                                </div>
                                <AboutEventEditor eventId={localMarathonId} eventType="marathon" />
                            </div>
                        )}
                    </section>

                    <div className="flex justify-between mt-8">
                        <button onClick={() => setCurrentStep(isRSVP ? 3 : 4)} className="px-10 py-4 text-slate-800 font-bold uppercase tracking-widest text-xs flex items-center gap-2"><ChevronLeft size={16} /> Back</button>
                        <button onClick={() => handleNext(isRSVP ? 5 : 6)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl flex items-center gap-2">Next <ChevronRight size={16} /></button>
                    </div>
                </div>
            )}

            {/* Step 6: Location */}
            {currentStep === (isRSVP ? 5 : 6) && (
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
                        <button onClick={() => setCurrentStep(isRSVP ? 4 : 5)} className="px-10 py-4 text-slate-800 font-bold uppercase tracking-widest text-xs flex items-center gap-2"><ChevronLeft size={16} /> Back</button>
                        <div className="flex gap-4">
                            <button onClick={() => saveMarathon('Draft')} disabled={loading} className="px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-slate-50 transition-all">Save Draft</button>
                            <button onClick={() => saveMarathon('PendingReview')} disabled={loading} className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl flex items-center gap-2">
                                {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                                {marathonId ? "Update Event" : "Submit to Review"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
