"use client";
import React, { useState, useEffect, useMemo, useRef, useCallback, Component } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

class OrganiserErrorBoundary extends Component {
    state = { error: null };
    static getDerivedStateFromError(error) { return { error }; }
    componentDidCatch(error, info) {
        console.error("OrganiserPanel error:", error, info);
    }
    render() {
        if (this.state.error) {
            return (
                <div style={{ minHeight: "100vh", padding: "24px", background: "#0f172a", color: "#e2e8f0", fontFamily: "monospace" }}>
                    <h2 style={{ color: "#f87171" }}>Organiser panel error</h2>
                    <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{this.state.error?.message || String(this.state.error)}</pre>
                    <button onClick={() => this.setState({ error: null })} style={{ marginTop: "16px", padding: "8px 16px", cursor: "pointer" }}>Try again</button>
                </div>
            );
        }
        return this.props.children;
    }
}
import {
    LayoutDashboard, Settings, Video, Image as ImageIcon, Sparkles,
    CheckCircle, Ticket, Users, Menu, Bell, Save, X, Plus, Trash2,
    Mail, Lock, CreditCard, Code, Globe, Shield, Wallet, Upload,
    ArrowRight, FileText, Calendar, Clock, MapPin, Building, Grid, Tag,
    CloudUpload, ChevronDown, ChevronRight, Monitor, ArrowLeftRight, Home
} from "lucide-react";

function LocationPickerModal({
    t, theme, tempLocation, setTempLocation, postEvent, setPostEvent,
    setShowMapModal, isGeoLoading, setIsGeoLoading, geoError, setGeoError,
    mapRef, markerRef
}) {
    const mapContainerRef = useRef(null);

    useEffect(() => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
        link.crossOrigin = "";
        document.head.appendChild(link);
        return () => { if (link.parentNode) link.parentNode.removeChild(link); };
    }, []);

    useEffect(() => {
        if (!mapContainerRef.current) return;
        const L = require("leaflet");
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
            iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
            shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
        });
        const map = L.map(mapContainerRef.current).setView([tempLocation.lat, tempLocation.lng], 12);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(map);
        const marker = L.marker([tempLocation.lat, tempLocation.lng], { draggable: true }).addTo(map);
        mapRef.current = map;
        markerRef.current = marker;

        marker.on("moveend", () => {
            const latlng = marker.getLatLng();
            setTempLocation({ lat: latlng.lat, lng: latlng.lng });
        });
        map.on("click", (e) => {
            marker.setLatLng(e.latlng);
            setTempLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
        });

        return () => {
            map.remove();
            mapRef.current = null;
            markerRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!markerRef.current || !mapRef.current) return;
        const L = require("leaflet");
        markerRef.current.setLatLng([tempLocation.lat, tempLocation.lng]);
        mapRef.current.setView([tempLocation.lat, tempLocation.lng], mapRef.current.getZoom());
    }, [tempLocation.lat, tempLocation.lng]);

    const handleUseLocation = async () => {
        try {
            setIsGeoLoading(true);
            setGeoError("");
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${tempLocation.lat}&lon=${tempLocation.lng}`);
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            const addr = data.address || {};
            setPostEvent(pe => ({
                ...pe,
                latitude: String(tempLocation.lat),
                longitude: String(tempLocation.lng),
                address: data.display_name || pe.address,
                country: addr.country || pe.country,
                city: addr.city || addr.town || addr.village || pe.city,
                zipCode: addr.postcode || pe.zipCode
            }));
            setShowMapModal(false);
        } catch (err) {
            setGeoError("Unable to fetch address. You can still save lat/long manually.");
        } finally {
            setIsGeoLoading(false);
        }
    };

    const handleSetOnlyLatLng = () => {
        setPostEvent(pe => ({
            ...pe,
            latitude: String(tempLocation.lat),
            longitude: String(tempLocation.lng)
        }));
        setShowMapModal(false);
    };

    return (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: "20px" }}>
            <div style={{ width: "100%", maxWidth: "840px", backgroundColor: t.cardBg, borderRadius: "20px", overflow: "hidden", border: `1px solid ${t.border}` }}>
                <div style={{ padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${t.border}` }}>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Location Picker</h3>
                    <button type="button" onClick={() => setShowMapModal(false)} style={{ border: "none", background: "none", cursor: "pointer", color: t.textSub }}><X size={18} /></button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2.1fr 1fr", height: "420px" }}>
                    <div ref={mapContainerRef} style={{ height: "100%", minHeight: "320px" }} />
                    <div style={{ padding: "14px 16px", borderLeft: `1px solid ${t.border}`, display: "flex", flexDirection: "column", gap: "10px" }}>
                        <p style={{ fontSize: "12px", color: t.textSub, margin: 0 }}>Drag the map marker or click the map to set location. Adjust lat/long below if needed.</p>
                        <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>Latitude</label>
                            <input
                                type="number"
                                step="any"
                                value={tempLocation.lat}
                                onChange={e => setTempLocation(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))}
                                style={{ width: "100%", padding: "8px", borderRadius: "8px", border: `1.5px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: "12px" }}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>Longitude</label>
                            <input
                                type="number"
                                step="any"
                                value={tempLocation.lng}
                                onChange={e => setTempLocation(prev => ({ ...prev, lng: parseFloat(e.target.value) || 0 }))}
                                style={{ width: "100%", padding: "8px", borderRadius: "8px", border: `1.5px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: "12px" }}
                            />
                        </div>
                        {geoError && <p style={{ fontSize: "11px", color: "#f97316", margin: 0 }}>{geoError}</p>}
                        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                            <button type="button" disabled={isGeoLoading} onClick={handleUseLocation} style={{ padding: "9px 14px", borderRadius: "8px", border: "none", backgroundColor: "#3b82f6", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", opacity: isGeoLoading ? 0.8 : 1 }}>
                                {isGeoLoading ? "Applying…" : "Use This Location & Autofill"}
                            </button>
                            <button type="button" onClick={handleSetOnlyLatLng} style={{ padding: "8px 14px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: "transparent", color: t.textMain, fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                                Set Only Latitude & Longitude
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function OrganiserPanel() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    // Stages: mfa, kyc_docs, kyc_form, pending, approved
    const [currentStage, setCurrentStage] = useState("approved");
    const [activeTab, setActiveTab] = useState("dashboard");
    const [theme, setTheme] = useState("dark");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState({
        eventManagement: true,
        eventBookings: false,
        supportTickets: false
    });
    const [menuSearch, setMenuSearch] = useState("");
    const [eventBookingsTab, setEventBookingsTab] = useState("all");
    const [supportTab, setSupportTab] = useState("all_tickets");
    const [pwaScanInput, setPwaScanInput] = useState("");
    const [pwaScanResult, setPwaScanResult] = useState(null);
    const [pwaCameraOpen, setPwaCameraOpen] = useState(false);
    const pwaVideoRef = useRef(null);
    const pwaStreamRef = useRef(null);
    const pwaScanLoopRef = useRef(null);
    const [supportTicketsList, setSupportTicketsList] = useState([]);
    const [supportTicketForm, setSupportTicketForm] = useState({ email: "", subject: "", description: "", attachmentFileName: "" });
    const [supportTicketSearchId, setSupportTicketSearchId] = useState("");
    const [selectedTicketIds, setSelectedTicketIds] = useState([]);
    const [supportTicketSelectOpen, setSupportTicketSelectOpen] = useState(null);
    const [supportTicketDetailId, setSupportTicketDetailId] = useState(null);
    const [supportTicketReplyMessage, setSupportTicketReplyMessage] = useState("");

    // Organiser Profile State
    const [profile, setProfile] = useState({
        firstName: "",
        lastName: "",
        orgType: "Individual",
        email: "",
        phone: "",
        kycStatus: "Pending"
    });


    // Wallet: loaded from Convex (organisers table)
    const [wallet, setWallet] = useState({
        balance: 0,
        currency: "₹",
        transactions: []
    });

    const organiserData = useQuery(api.organisers.get, { userId: profile.email || "test@gmail.com" });

    useEffect(() => {
        if (organiserData) {
            setWallet(prev => ({
                ...prev,
                balance: organiserData.walletBalance || 0,
            }));
            setProfile(prev => ({
                ...prev,
                kycStatus: organiserData.kycStatus === "Active" ? "KYC Approved" : organiserData.kycStatus,
                email: organiserData.userId,
                firstName: organiserData.name.split(' ')[0] || "John",
                lastName: organiserData.name.split(' ')[1] || "Doe",
            }));
        }
    }, [organiserData]);

    const convexSupportTickets = useQuery(api.supportTickets.list) || [];
    const createTicketMutation = useMutation(api.supportTickets.create);
    const updateTicketMutation = useMutation(api.supportTickets.updateStatus);

    useEffect(() => {
        if (convexSupportTickets.length >= 0 && profile.email) {
            const filtered = convexSupportTickets.filter(t => t.userId === (profile.email || "test@gmail.com"));
            setSupportTicketsList(filtered.map(t => ({
                id: t._id,
                ticketId: t._id.slice(-6),
                email: t.userId,
                subject: t.issue.split('\n')[0],
                description: t.issue,
                status: t.status,
                createdAt: t._creationTime,
                updatedAt: t.updatedAt || t._creationTime,
                adminNotes: t.adminNotes || "",
                replies: [] // Future: add replies table mapping
            })));
        }
    }, [convexSupportTickets, profile.email]);

    const convexEvents = useQuery(api.events.getOrganiserEvents, { organiserId: profile.email || "test@gmail.com" });
    const deleteEventMutation = useMutation(api.events.deleteEvent);
    const updateEventMutation = useMutation(api.events.updateEvent);
    const createEventMutation = useMutation(api.events.createEvent);

    const convexBookings = useQuery(api.bookings.getBookings) || [];
    const updateBookingMutation = useMutation(api.bookings.updateBooking);

    const [events, setEvents] = useState([]);
    useEffect(() => {
        if (convexEvents) {
            setEvents(convexEvents.map(e => ({ ...e, id: e._id })));
        }
    }, [convexEvents]);

    const writeQueueRef = useRef([]);
    const isWritingRef = useRef(false);
    const eventsDebounceRef = useRef(null);
    const draftDebounceRef = useRef(null);
    const skipInitialDraftWriteRef = useRef(true);

    // Multiple write operation: queue of { key, value }; process one at a time to avoid concurrent writes
    const scheduleWrite = useCallback((key, value) => {
        if (typeof window === "undefined") return;
        writeQueueRef.current.push({ key, value });
        const processQueue = () => {
            if (isWritingRef.current || writeQueueRef.current.length === 0) return;
            isWritingRef.current = true;
            const { key: k, value: v } = writeQueueRef.current.shift();
            try {
                const str = typeof v === "string" ? v : JSON.stringify(v);
                if (str !== undefined) localStorage.setItem(k, str);
            } catch (_) { /* skip failed serialize */ }
            finally {
                isWritingRef.current = false;
                if (writeQueueRef.current.length > 0) setTimeout(processQueue, 0);
            }
        };
        processQueue();
    }, []);

    // Write 1: events — debounced so rapid updates queue one write per burst
    useEffect(() => {
        if (eventsDebounceRef.current) clearTimeout(eventsDebounceRef.current);
        eventsDebounceRef.current = setTimeout(() => {
            scheduleWrite("organiser_events", events);
            eventsDebounceRef.current = null;
        }, 100);
        return () => { if (eventsDebounceRef.current) clearTimeout(eventsDebounceRef.current); };
    }, [events, scheduleWrite]);

    // When opening Add Event tab, show type selection (Online / Venue) first
    useEffect(() => {
        if (activeTab === "post_event") setAddEventStep("select_type");
    }, [activeTab]);

    // Tab navigation: single state update per key (Arrow Up/Down), no repeat; ignore when focus is in input/textarea/select
    const TAB_IDS = ["dashboard", "post_event", "manage_events", "venue_events", "online_events", "seat_map", "event_bookings", "withdraw", "transactions", "pwa_scanner", "support_tickets", "edit_profile", "change_password"];
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.repeat || (e.key !== "ArrowDown" && e.key !== "ArrowUp")) return;
            const el = document.activeElement;
            if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT")) return;
            e.preventDefault();
            const i = TAB_IDS.indexOf(activeTab);
            const next = e.key === "ArrowDown" ? (i + 1) % TAB_IDS.length : (i - 1 + TAB_IDS.length) % TAB_IDS.length;
            setActiveTab(TAB_IDS[next]);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [activeTab]);

    // State for Modals
    const [showCreateEvent, setShowCreateEvent] = useState(false);
    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [selectedEventForSeatMap, setSelectedEventForSeatMap] = useState(null);
    const [newEvent, setNewEvent] = useState({
        title: "", type: "Venue", venue: "",
        slots: [{ date: "", time: "" }]
    });

    // Add Event: first step is choosing Online vs Venue (image format)
    const [addEventStep, setAddEventStep] = useState("select_type"); // 'select_type' | 'form'
    const [multiSlots, setMultiSlots] = useState([{ date: "", time: "" }]);
    const [showMapModal, setShowMapModal] = useState(false);
    const [tempLocation, setTempLocation] = useState({ lat: 28.6139, lng: 77.209 });
    const [isGeoLoading, setIsGeoLoading] = useState(false);
    const [geoError, setGeoError] = useState("");
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const thumbnailInputRef = useRef(null);
    const galleryInputRef = useRef(null);

    const validateBookingId = useCallback(async (id) => {
        const rawId = String(id).trim();
        if (!rawId) return;
        // Search in Convex bookings
        const booking = convexBookings.find(b => String(b._id) === rawId || String(b.id) === rawId);
        if (!booking) {
            setPwaScanResult({ status: "not_found", id: rawId });
            return;
        }
        if (booking.scanned) {
            setPwaScanResult({ status: "already_used", booking });
            return;
        }
        try {
            await updateBookingMutation({ id: booking._id, scanned: true });
            setPwaScanResult({ status: "valid", booking: { ...booking, scanned: true, scannedAt: new Date().toISOString() } });
            setPwaScanInput("");
        } catch (_) {
            setPwaScanResult({ status: "not_found", id: rawId });
        }
    }, [convexBookings, updateBookingMutation]);

    useEffect(() => {
        if (!pwaCameraOpen || typeof window === "undefined") return;
        let stream = null;
        const video = pwaVideoRef.current;
        if (!video) return;
        const startCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                pwaStreamRef.current = stream;
                video.srcObject = stream;
                await video.play();
                if (typeof BarcodeDetector !== "undefined") {
                    const detector = new BarcodeDetector({ formats: ["qr_code"] });
                    const scan = async () => {
                        if (!pwaCameraOpen || !video.srcObject || video.readyState < 2) return;
                        try {
                            const codes = await detector.detect(video);
                            if (codes && codes.length > 0 && codes[0].rawValue) {
                                const id = codes[0].rawValue;
                                validateBookingId(id);
                                setPwaCameraOpen(false);
                                return;
                            }
                        } catch (_) { }
                        pwaScanLoopRef.current = requestAnimationFrame(scan);
                    };
                    pwaScanLoopRef.current = requestAnimationFrame(scan);
                }
            } catch (err) {
                console.warn("Camera or BarcodeDetector not available", err);
            }
        };
        startCamera();
        return () => {
            if (pwaScanLoopRef.current) cancelAnimationFrame(pwaScanLoopRef.current);
            if (pwaStreamRef.current) { pwaStreamRef.current.getTracks().forEach(t => t.stop()); pwaStreamRef.current = null; }
            if (video && video.srcObject) video.srcObject = null;
        };
    }, [pwaCameraOpen, validateBookingId]);

    // Event categories: from Admin (localStorage admin_categories) so organiser sees same list as home/admin
    const DEFAULT_EVENT_CATEGORY_NAMES = ["Concert", "Sports", "Comedy", "Theatre", "Music", "Workshop", "Festival", "Live Shows", "Conference", "Exhibition", "Marathon", "Others"];
    const [eventCategoryNames, setEventCategoryNames] = useState(DEFAULT_EVENT_CATEGORY_NAMES);

    // ── Seat-based Event Posting State ───────────────────────────────────────
    const DEFAULT_SEAT_CATEGORIES = [
        { name: "VIP", color: "#f59e0b", rowStart: 1, rowEnd: 2, price: 2500 },
        { name: "Premium", color: "#6366f1", rowStart: 3, rowEnd: 4, price: 1500 },
        { name: "General", color: "#22c55e", rowStart: 5, rowEnd: 6, price: 800 },
    ];
    const getInitialPostEvent = () => ({
        title: "", category: "Concert", type: "Venue", venue: "", date: "", time: "",
        dateType: "single", countdownStatus: "active",
        description: "", banner: null, bannerPreview: null,
        galleryImages: [], galleryPreviews: [],
        address: "", latitude: "", longitude: "", country: "", city: "", zipCode: "",
        seatingEnabled: true,
        environment: "Indoor",
        normalTicketCapacity: "",
        normalTicketPrice: "",
        rows: 6, cols: 10,
        categories: DEFAULT_SEAT_CATEGORIES.map(c => ({ ...c })),
    });
    const [postEvent, setPostEvent] = useState(getInitialPostEvent());

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const raw = localStorage.getItem("admin_categories");
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const names = parsed.map((c) => (c && c.name) ? String(c.name).trim() : "").filter(Boolean);
                    if (names.length > 0) {
                        setEventCategoryNames(names);
                        setPostEvent((prev) => (prev.category && names.includes(prev.category) ? prev : { ...prev, category: names[0] }));
                    }
                }
            }
        } catch (_) { /* ignore */ }
    }, []);

    // Load persisted data on mount; defer draft load so it doesn't overwrite first keystroke
    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            // Optional local storage fallback 
            const saved = localStorage.getItem("organiser_events");
            if (saved && events.length === 0) setEvents(JSON.parse(saved));
        } catch (_) { /* ignore */ }
        const loadDraft = () => {
            try {
                const draft = localStorage.getItem("organiser_draft");
                if (!draft) return;
                const parsed = JSON.parse(draft);
                if (!parsed || typeof parsed !== "object") return;
                const defaultCategories = [
                    { name: "VIP", color: "#f59e0b", rowStart: 1, rowEnd: 2, price: 2500 },
                    { name: "Premium", color: "#6366f1", rowStart: 3, rowEnd: 4, price: 1500 },
                    { name: "General", color: "#22c55e", rowStart: 5, rowEnd: 6, price: 800 },
                ];
                const merged = {
                    title: "", category: "Concert", type: "Venue", venue: "", date: "", time: "",
                    dateType: "single", countdownStatus: "active",
                    description: "", banner: null, bannerPreview: null,
                    galleryImages: [], galleryPreviews: [],
                    address: "", latitude: "", longitude: "", country: "", city: "", zipCode: "",
                    seatingEnabled: true, environment: "Indoor", normalTicketCapacity: "", normalTicketPrice: "",
                    rows: 6, cols: 10,
                    categories: defaultCategories,
                    ...parsed,
                    categories: Array.isArray(parsed.categories) && parsed.categories.length > 0 ? parsed.categories : defaultCategories,
                };
                setPostEvent(merged);
            } catch (_) { /* ignore */ }
        };
        const t = setTimeout(loadDraft, 0);
        return () => clearTimeout(t);
    }, []);

    // Write 2: Add Event draft — after postEvent is defined; debounced, skip first run
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (skipInitialDraftWriteRef.current) { skipInitialDraftWriteRef.current = false; return; }
        if (draftDebounceRef.current) clearTimeout(draftDebounceRef.current);
        draftDebounceRef.current = setTimeout(() => {
            try {
                scheduleWrite("organiser_draft", postEvent);
            } catch (_) { /* ignore */ }
            draftDebounceRef.current = null;
        }, 300);
        return () => { if (draftDebounceRef.current) clearTimeout(draftDebounceRef.current); };
    }, [postEvent, scheduleWrite]);

    // Generate row labels A, B, C …
    const ROW_LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

    // Derive seat category for a given row index (0-based)
    const getSeatCategory = (rowIdx) => {
        const categories = postEvent.categories || [];
        for (const cat of categories) {
            if (rowIdx + 1 >= cat.rowStart && rowIdx + 1 <= cat.rowEnd) return cat;
        }
        return { name: "General", color: "#94a3b8", price: 0 };
    };

    // Mock booked seats for existing events (for the Seat Map view)
    const mockBookedSeats = useMemo(() => {
        const booked = {};
        events.forEach(ev => {
            booked[ev.id] = new Set();
            const count = Math.floor(Math.random() * 30) + 10;
            for (let i = 0; i < count; i++) {
                const r = String.fromCharCode(65 + Math.floor(Math.random() * 6));
                const c = Math.floor(Math.random() * 10) + 1;
                booked[ev.id].add(`${r}${c}`);
            }
        });
        return booked;
    }, [events.length]);

    const handleBannerChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setPostEvent(pe => ({ ...pe, banner: file, bannerPreview: reader.result }));
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    const addGalleryFromFiles = (fileList) => {
        const files = Array.from(fileList || []).filter(f => f.type.startsWith("image/"));
        if (files.length === 0) return;
        const previews = new Array(files.length);
        let loaded = 0;
        files.forEach((file, idx) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                previews[idx] = reader.result;
                loaded++;
                if (loaded === files.length) {
                    setPostEvent(pe => ({
                        ...pe,
                        galleryImages: [...(pe.galleryImages || []), ...files],
                        galleryPreviews: [...(pe.galleryPreviews || []), ...previews]
                    }));
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const handleGalleryChange = (e) => {
        addGalleryFromFiles(e.target.files);
        e.target.value = "";
    };

    const removeGalleryImage = (idx) => {
        setPostEvent(pe => ({
            ...pe,
            galleryImages: (pe.galleryImages || []).filter((_, i) => i !== idx),
            galleryPreviews: (pe.galleryPreviews || []).filter((_, i) => i !== idx)
        }));
    };

    const publishSeatEvent = () => {
        if (!postEvent.title || !postEvent.venue) {
            alert("Please fill in Title and Venue.");
            return;
        }
        const isMultiple = (postEvent.dateType || "single") === "multiple";
        const effectiveSlots = isMultiple ? multiSlots.filter(s => s.date) : [{ date: postEvent.date, time: postEvent.time || "" }];
        const firstSlot = effectiveSlots[0];
        if (!firstSlot || !firstSlot.date) {
            alert(isMultiple ? "Please add at least one date in Schedule (Multi-Date & Time)." : "Please fill in Date.");
            return;
        }
        if (postEvent.type === "Venue" && (!postEvent.latitude || !postEvent.longitude)) {
            alert("Please set venue location using the map (click Show Map and choose a location).");
            return;
        }
        const isSeating = postEvent.seatingEnabled !== false;
        const totalSeats = isSeating ? postEvent.rows * postEvent.cols : (parseInt(postEvent.normalTicketCapacity, 10) || 0);
        if (totalSeats <= 0) {
            alert(isSeating ? "Please set at least 1 row and 1 seat per row." : "Please set Total Capacity for normal ticketing.");
            return;
        }
        const ev = {
            ...postEvent,
            organiserId: profile.email || "organizer@gmail.com",
            date: firstSlot.date,
            time: firstSlot.time || "TBA",
            status: "Active",
            seatingEnabled: isSeating,
            totalSeats,
            img: (typeof postEvent.bannerPreview === "string" && postEvent.bannerPreview.startsWith("data:")) ? postEvent.bannerPreview : "https://images.unsplash.com/photo-1540575861501-7ad058c647a0?w=500&h=650&fit=crop",
            price: isSeating
                ? (postEvent.categories?.length ? Math.min(...postEvent.categories.map(c => Number(c.price) || 0)) : undefined)
                : (postEvent.normalTicketPrice !== "" && postEvent.normalTicketPrice != null ? Number(postEvent.normalTicketPrice) : undefined)
        };
        // Save to Convex
        createEventMutation({
            organiserId: ev.organiserId,
            title: ev.title,
            category: ev.category,
            type: ev.type,
            date: ev.date,
            time: ev.time,
            img: ev.img,
            bannerPreview: typeof postEvent.bannerPreview === "string" ? postEvent.bannerPreview : undefined,
            seatingEnabled: ev.seatingEnabled,
            totalSeats: ev.totalSeats,
            price: ev.price,
            location: ev.location,
            venue: ev.venue,
            address: ev.address,
            environment: ev.environment,
        })
            .then(() => {
                alert(isSeating ? `✅ "${ev.title}" published with ${totalSeats} seats (Seating Based)!` : `✅ "${ev.title}" published with ${totalSeats} tickets (Normal Ticketing)!`);
                setPostEvent(getInitialPostEvent());
                setAddEventStep("select_type");
                setMultiSlots([{ date: "", time: "" }]);
                try { localStorage.removeItem("organiser_draft"); } catch (_) { }
                setActiveTab("manage_events");
            })
            .catch(err => alert("Error publishing event: " + err.message));

    };

    const addDateSlot = () => {
        setNewEvent({ ...newEvent, slots: [...newEvent.slots, { date: "", time: "" }] });
    };

    const removeDateSlot = (index) => {
        const updated = newEvent.slots.filter((_, i) => i !== index);
        setNewEvent({ ...newEvent, slots: updated });
    };

    const colors = {
        light: {
            bg: "#f0f4f8",
            sidebar: "#ffffff",
            header: "#ffffff",
            textMain: "#1e293b",
            textSub: "#64748b",
            cardBg: "#ffffff",
            border: "#e2e8f0",
            activeLink: "#e0f2fe",
            activeText: "#0369a1",
            sidebarBorder: "#f1f5f9"
        },
        dark: {
            bg: "#0f172a",
            sidebar: "#111827",
            header: "#111827",
            textMain: "#ffffff",
            textSub: "#cbd5e1",
            cardBg: "#1f2937",
            border: "#374151",
            activeLink: "#0ea5e920",
            activeText: "#38bdf8",
            sidebarBorder: "#1f2937"
        }
    };

    const t = colors[theme] || colors.dark;
    const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

    const styles = (
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            .admin-container { 
                display: flex; 
                min-height: 100vh; 
                background-color: ${t.bg}; 
                color: ${t.textMain};
                font-family: 'Inter', sans-serif;
                -webkit-font-smoothing: antialiased;
                transition: all 0.3s ease;
            }
            .sidebar {
                width: 250px;
                background-color: ${t.sidebar};
                color: ${t.textSub};
                display: flex;
                flex-direction: column;
                position: fixed;
                height: 100vh;
                left: 0;
                top: 0;
                z-index: 100;
                border-right: 1px solid ${t.sidebarBorder};
                transition: transform 0.3s ease, background-color 0.3s ease;
            }
            .main-content {
                margin-left: 250px;
                flex: 1;
                display: flex;
                flex-direction: column;
                min-width: 0;
            }
            .top-header {
                height: 64px;
                background-color: ${t.header};
                border-bottom: 1px solid ${t.border};
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 24px;
                position: sticky;
                top: 0;
                z-index: 50;
            }
            .sidebar-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 10px 16px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 600;
                border-radius: 0 50px 50px 0;
                margin-right: 16px;
                transition: all 0.2s;
                border: none;
                background: none;
                width: calc(100% - 16px);
                color: ${t.textSub};
                text-align: left;
            }
            .sidebar-item.active {
                background-color: ${t.activeLink};
                color: ${t.activeText};
                font-weight: 600;
            }
            .stat-card {
                background-color: ${t.cardBg};
                padding: 20px;
                border-radius: 12px;
                border: 1px solid ${t.border};
                display: flex;
                flex-direction: column;
                position: relative;
                box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            }
            @media (max-width: 1024px) {
                .sidebar { transform: translateX(-100%); }
                .main-content { margin-left: 0; }
            }
        `}</style>
    );

    // MFA View Component
    const renderMFAView = () => (
        <div style={{ maxWidth: "450px", margin: "100px auto", textAlign: "center", backgroundColor: t.cardBg, padding: "40px", borderRadius: "20px", border: `1px solid ${t.border}`, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
            <div style={{ backgroundColor: "#3b82f615", width: "80px", height: "80px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                <Shield size={40} color="#3b82f6" />
            </div>
            <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "12px", color: t.textMain }}>Two-Factor Authentication</h2>
            <p style={{ color: t.textSub, fontSize: "14px", lineHeight: "1.6", marginBottom: "32px" }}>For your account security, please setup MFA using your preferred Authenticator App.</p>

            <div style={{ backgroundColor: "#fff", padding: "16px", borderRadius: "12px", width: "200px", height: "200px", margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${t.border}` }}>
                <div style={{ width: "160px", height: "160px", backgroundImage: "url('https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=BookMyTicketOrganizerMFA')", backgroundSize: "cover" }}></div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <input type="text" placeholder="Enter 6-digit MFA Code" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#0f172a', color: t.textMain, textAlign: "center", letterSpacing: "4px", fontWeight: "bold" }} />
                <button
                    onClick={() => setCurrentStage("kyc_docs")}
                    style={{ width: "100%", padding: "14px", borderRadius: "10px", backgroundColor: "#3b82f6", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                >
                    Verify & Continue <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );

    // KYC Document View
    const renderKYCDocsView = () => (
        <div style={{ maxWidth: "600px", margin: "60px auto", backgroundColor: t.cardBg, padding: "40px", borderRadius: "20px", border: `1px solid ${t.border}` }}>
            <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "8px" }}>Identity Verification (KYC)</h2>
            <p style={{ color: t.textSub, fontSize: "14px", marginBottom: "32px" }}>Step 1: Upload Your Documents</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {[
                    { label: "Aadhar Card (Front & Back)", icon: Shield },
                    { label: "PAN Card", icon: FileText },
                    { label: "Event Venue Booking Copy / License", icon: Building }
                ].map((doc, idx) => (
                    <div key={idx} style={{ padding: "24px", border: `2px dashed ${t.border}`, borderRadius: "12px", textAlign: "center", cursor: "pointer", transition: "0.2s" }} onMouseOver={(e) => e.currentTarget.style.borderColor = "#3b82f6"} onMouseOut={(e) => e.currentTarget.style.borderColor = t.border}>
                        <Upload size={24} color={t.textSub} style={{ marginBottom: "12px" }} />
                        <p style={{ fontSize: "14px", fontWeight: 600, margin: 0 }}>{doc.label}</p>
                        <p style={{ fontSize: "12px", color: t.textSub, marginTop: "4px" }}>Click to upload or drag & drop</p>
                    </div>
                ))}
            </div>

            <button
                onClick={() => setCurrentStage("kyc_form")}
                style={{ width: "100%", padding: "16px", borderRadius: "12px", backgroundColor: "#3b82f6", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", marginTop: "40px" }}
            >
                Start Auto-fill Process
            </button>
        </div>
    );

    // KYC Form View
    const renderKYCFormView = () => (
        <div style={{ maxWidth: "700px", margin: "50px auto", backgroundColor: t.cardBg, padding: "40px", borderRadius: "20px", border: `1px solid ${t.border}` }}>
            <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "8px" }}>Organiser Details</h2>
            <p style={{ color: t.textSub, fontSize: "14px", marginBottom: "32px" }}>Step 2: Complete Your Profile (Auto-filled from Documents)</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>First Name</label>
                    <input
                        type="text"
                        defaultValue="John"
                        onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#0f172a', color: t.textMain }}
                    />
                </div>
                <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>Last Name</label>
                    <input
                        type="text"
                        defaultValue="Doe"
                        onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#0f172a', color: t.textMain }}
                    />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>Organiser Type</label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
                        {["Individual", "Event Organiser", "Pvt Ltd", "Others"].map(opt => (
                            <button
                                key={opt}
                                onClick={() => setProfile({ ...profile, orgType: opt })}
                                style={{ padding: "12px", borderRadius: "8px", border: `2px solid ${profile.orgType === opt ? "#3b82f6" : t.border}`, backgroundColor: profile.orgType === opt ? "#3b82f615" : "transparent", color: profile.orgType === opt ? "#3b82f6" : t.textSub, fontWeight: 600, cursor: "pointer" }}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
                {profile.orgType === "Others" && (
                    <div style={{ gridColumn: "span 2" }}>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>Remarks</label>
                        <textarea style={{ width: "100%", padding: "12px", borderRadius: "8px", border: `1.5px solid ${t.border}`, backgroundColor: theme === 'light' ? '#fff' : '#0f172a', color: t.textMain }} rows={3} />
                    </div>
                )}
            </div>

            <button
                onClick={() => {
                    alert("KYC Submitted Successfully! Your details have been sent to the Admin Panel for approval.");
                    setCurrentStage("pending");
                }}
                style={{ width: "100%", padding: "16px", borderRadius: "12px", backgroundColor: "#3b82f6", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", marginTop: "40px" }}
            >
                Submit KYC for Approval
            </button>
        </div>
    );

    // Pending View
    const renderPendingView = () => (
        <div style={{ maxWidth: "550px", margin: "100px auto", textAlign: "center", backgroundColor: t.cardBg, padding: "50px 40px", borderRadius: "20px", border: `1px solid ${t.border}` }}>
            <div style={{ backgroundColor: "#f9731615", width: "90px", height: "90px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 30px" }}>
                <Clock size={45} color="#f97316" className="spin-slow" />
            </div>
            <h2 style={{ fontSize: "26px", fontWeight: 800, marginBottom: "16px" }}>KYC Process Under Review</h2>
            <p style={{ color: t.textSub, fontSize: "15px", lineHeight: "1.7", marginBottom: "40px" }}>
                Your KYC documents have been successfully submitted and are currently being reviewed by our administration team.
                <br /><br />
                <strong>Sidebar menu access is restricted</strong> until your account is approved. You will receive an email confirmation once the process is completed.
            </p>
            <div style={{ padding: "16px", backgroundColor: "#3b82f610", borderRadius: "12px", color: "#3b82f6", fontSize: "13px", fontWeight: 600 }}>
                Estimated Review Time: 12-24 Hours
            </div>

            {/* Backdoor for demo */}
            <button
                onClick={() => setCurrentStage("approved")}
                style={{ marginTop: "30px", fontSize: "12px", color: t.textSub, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
            >
                [Demo Only: Simulate Admin Approval]
            </button>
        </div>
    );

    // Main Dashboard View (Approved)
    const renderDashboardView = () => {
        const renderTabContent = () => {
            switch (activeTab) {
                case "dashboard":
                    return (
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
                                <div style={{ backgroundColor: "#3b82f6", color: "#fff", padding: "20px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "16px" }}>
                                    <div style={{ width: "48px", height: "48px", borderRadius: "10px", backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}><Wallet size={24} /></div>
                                    <div>
                                        <p style={{ margin: 0, fontSize: "12px", opacity: 0.9 }}>My Balance</p>
                                        <p style={{ margin: 0, fontSize: "22px", fontWeight: 800 }}>{wallet.currency}{Number(wallet.balance).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div style={{ backgroundColor: "#22c55e", color: "#fff", padding: "20px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "16px" }}>
                                    <div style={{ width: "48px", height: "48px", borderRadius: "10px", backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}><Calendar size={24} /></div>
                                    <div>
                                        <p style={{ margin: 0, fontSize: "12px", opacity: 0.9 }}>Events</p>
                                        <p style={{ margin: 0, fontSize: "22px", fontWeight: 800 }}>{events.length}</p>
                                    </div>
                                </div>
                                <div style={{ backgroundColor: "#ef4444", color: "#fff", padding: "20px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "16px" }}>
                                    <div style={{ width: "48px", height: "48px", borderRadius: "10px", backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}><Monitor size={24} /></div>
                                    <div>
                                        <p style={{ margin: 0, fontSize: "12px", opacity: 0.9 }}>Total Event Bookings</p>
                                        <p style={{ margin: 0, fontSize: "22px", fontWeight: 800 }}>
                                            {(() => {
                                                const myEventIds = new Set(events.map(e => String(e.id)));
                                                return convexBookings.filter(b => myEventIds.has(String(b.eventId))).length;
                                            })()}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ backgroundColor: "#8b5cf6", color: "#fff", padding: "20px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "16px" }}>
                                    <div style={{ width: "48px", height: "48px", borderRadius: "10px", backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}><ArrowLeftRight size={24} /></div>
                                    <div>
                                        <p style={{ margin: 0, fontSize: "12px", opacity: 0.9 }}>Total Transactions</p>
                                        <p style={{ margin: 0, fontSize: "22px", fontWeight: 800 }}>
                                            {(() => {
                                                const myEventIds = new Set(events.map(e => String(e.id)));
                                                return convexBookings.filter(b => myEventIds.has(String(b.eventId))).length;
                                            })()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div style={{ backgroundColor: t.cardBg, padding: "20px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                                    <p style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px" }}>Event Booking Monthly Income (2026)</p>
                                    <div style={{ height: "200px", display: "flex", alignItems: "flex-end", justifyContent: "space-around", gap: "4px", paddingBottom: "24px" }}>
                                        {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                                            <div key={m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                                                <div style={{ width: "100%", height: "60px", backgroundColor: "#3b82f620", borderRadius: "4px", border: "1px solid #3b82f640" }} />
                                                <span style={{ fontSize: "10px", color: t.textSub }}>{m}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                                        <div style={{ width: "12px", height: "12px", backgroundColor: "#3b82f6", borderRadius: "2px" }} />
                                        <span style={{ fontSize: "12px", color: t.textSub }}>Monthly Income</span>
                                    </div>
                                </div>
                                <div style={{ backgroundColor: t.cardBg, padding: "20px", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                                    <p style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px" }}>Monthly Event Bookings (2026)</p>
                                    <div style={{ height: "200px", display: "flex", alignItems: "flex-end", justifyContent: "space-around", gap: "4px", paddingBottom: "24px" }}>
                                        {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m) => (
                                            <div key={m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                                                <div style={{ width: "100%", height: "60px", backgroundColor: "#8b5cf620", borderRadius: "4px", border: "1px solid #8b5cf640" }} />
                                                <span style={{ fontSize: "10px", color: t.textSub }}>{m}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                                        <div style={{ width: "12px", height: "12px", backgroundColor: "#8b5cf6", borderRadius: "2px" }} />
                                        <span style={{ fontSize: "12px", color: t.textSub }}>Monthly Event Bookings</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                case "manage_events":
                    return (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "16px", border: `1px solid ${t.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Active Events</h3>
                                <button onClick={() => setActiveTab("post_event")} style={{ padding: "10px 20px", backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                                    <Plus size={18} /> Post New Event
                                </button>
                            </div>
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: "left" }}>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>Event Details</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>Date & Time</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>Seats</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>Status</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {events.map(ev => (
                                            <tr key={ev.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                                                <td style={{ padding: "16px" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                        <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "#3b82f620", display: "flex", alignItems: "center", justifyContent: "center" }}><Ticket size={20} color="#3b82f6" /></div>
                                                        <div>
                                                            <p style={{ fontWeight: 700, margin: 0, fontSize: "14px" }}>{ev.title}</p>
                                                            <p style={{ fontSize: "11px", color: t.textSub, margin: 0 }}>{ev.venue}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: "16px" }}>
                                                    <p style={{ fontSize: "13px", margin: 0, fontWeight: 600 }}>{ev.date}</p>
                                                    <p style={{ fontSize: "11px", color: t.textSub, margin: 0 }}>{ev.time}</p>
                                                </td>
                                                <td style={{ padding: "16px" }}>
                                                    {ev.totalSeats ? (
                                                        <div>
                                                            <p style={{ margin: 0, fontSize: "13px", fontWeight: 700 }}>{ev.totalSeats - (ev.bookedSeats || 0)} <span style={{ color: t.textSub, fontWeight: 400 }}>/ {ev.totalSeats} avail.</span></p>
                                                            <div style={{ marginTop: 6, height: 5, borderRadius: 3, background: t.border, overflow: "hidden" }}>
                                                                <div style={{ height: "100%", width: `${((ev.bookedSeats || 0) / ev.totalSeats) * 100}%`, background: "#f84464", borderRadius: 3 }} />
                                                            </div>
                                                        </div>
                                                    ) : <span style={{ color: t.textSub, fontSize: 12 }}>—</span>}
                                                </td>
                                                <td style={{ padding: "16px" }}>
                                                    <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, backgroundColor: "#22c55e15", color: "#22c55e" }}>ACTIVE</span>
                                                </td>
                                                <td style={{ padding: "16px" }}>
                                                    <div style={{ display: "flex", gap: "8px" }}>
                                                        {ev.seatingEnabled !== false ? (
                                                            <button title="View Seat Map" onClick={() => { setSelectedEventForSeatMap(ev); setActiveTab("seat_map"); }} style={{ background: "#6366f110", border: `1px solid #6366f130`, padding: "8px 12px", borderRadius: "8px", color: "#6366f1", cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                                                                <Grid size={14} /> Seat Map
                                                            </button>
                                                        ) : (
                                                            <span style={{ padding: "6px 10px", borderRadius: "8px", backgroundColor: t.bg, color: t.textSub, fontSize: 11, fontWeight: 600 }}>Normal Ticketing</span>
                                                        )}
                                                        <button title="Delete" onClick={() => { if (confirm("Delete this event?")) deleteEventMutation({ id: ev.id }).catch(e => console.error(e)); }} style={{ background: "none", border: `1px solid ${t.border}`, padding: "8px", borderRadius: "8px", color: "#ef4444", cursor: "pointer" }}><Trash2 size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                case "post_event":
                    // Step 1: Choose Online or Venue (image format)
                    if (addEventStep === "select_type") {
                        return (
                            <div style={{ backgroundColor: t.bg, minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", maxWidth: "700px", width: "100%" }}>
                                    <button
                                        onClick={() => { setPostEvent(pe => ({ ...pe, type: "Online" })); setAddEventStep("form"); }}
                                        style={{
                                            background: t.cardBg,
                                            border: `1px solid ${t.border}`,
                                            borderRadius: "16px",
                                            padding: "48px 32px",
                                            cursor: "pointer",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            gap: "16px",
                                            boxShadow: "0 4px 12px rgba(0,0,0,0.06)"
                                        }}
                                    >
                                        <div style={{ width: "80px", height: "80px", borderRadius: "12px", backgroundColor: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <CloudUpload size={40} color="#fff" />
                                        </div>
                                        <span style={{ fontSize: "16px", fontWeight: 700, color: t.textMain, letterSpacing: "0.5px" }}>ONLINE EVENT</span>
                                    </button>
                                    <button
                                        onClick={() => { setPostEvent(pe => ({ ...pe, type: "Venue" })); setAddEventStep("form"); }}
                                        style={{
                                            background: t.cardBg,
                                            border: `1px solid ${t.border}`,
                                            borderRadius: "16px",
                                            padding: "48px 32px",
                                            cursor: "pointer",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            gap: "16px",
                                            boxShadow: "0 4px 12px rgba(0,0,0,0.06)"
                                        }}
                                    >
                                        <div style={{ width: "80px", height: "80px", borderRadius: "12px", backgroundColor: "#f97316", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <MapPin size={40} color="#fff" />
                                        </div>
                                        <span style={{ fontSize: "16px", fontWeight: 700, color: t.textMain, letterSpacing: "0.5px" }}>VENUE EVENT</span>
                                    </button>
                                </div>
                            </div>
                        );
                    }
                    // Step 2: Full form (image format: Gallery, Thumbnail, Date Type, Countdown, English section, etc.)
                    return (
                        <div style={{ backgroundColor: t.cardBg, padding: "32px", borderRadius: "20px", border: `1px solid ${t.border}`, maxWidth: "900px", margin: "0 auto" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                <h3 style={{ fontSize: "20px", fontWeight: 800, margin: 0 }}>Add Event</h3>
                                <button type="button" onClick={() => setAddEventStep("select_type")} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: "#3b82f6", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                                    <ArrowRight size={16} style={{ transform: "rotate(180deg)" }} /> Back
                                </button>
                            </div>
                            {/* Gallery & Thumbnail — image format */}
                            <input type="file" ref={thumbnailInputRef} accept="image/*" onChange={handleBannerChange} style={{ display: "none" }} />
                            <input type="file" ref={galleryInputRef} accept="image/*" multiple onChange={handleGalleryChange} style={{ display: "none" }} />
                            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", marginBottom: "24px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>Gallery Images**</label>
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => galleryInputRef.current?.click()}
                                        onKeyDown={e => e.key === "Enter" && galleryInputRef.current?.click()}
                                        onDragOver={e => { e.preventDefault(); e.stopPropagation(); e.currentTarget.style.borderColor = "#3b82f6"; }}
                                        onDragLeave={e => { e.preventDefault(); e.currentTarget.style.borderColor = t.border; }}
                                        onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = t.border; addGalleryFromFiles(e.dataTransfer.files); }}
                                        style={{ border: `2px dashed ${t.border}`, borderRadius: "12px", padding: "32px", textAlign: "center", backgroundColor: t.bg, cursor: "pointer", minHeight: "100px" }}
                                    >
                                        {(postEvent.galleryPreviews || []).length > 0 ? (
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
                                                {(postEvent.galleryPreviews || []).map((src, idx) => (
                                                    <div key={idx} style={{ position: "relative" }}>
                                                        <img src={src} alt={`Gallery ${idx + 1}`} style={{ width: "80px", height: "50px", objectFit: "cover", borderRadius: "8px" }} />
                                                        <button type="button" onClick={e => { e.stopPropagation(); removeGalleryImage(idx); }} style={{ position: "absolute", top: "-6px", right: "-6px", width: "20px", height: "20px", borderRadius: "50%", border: "none", backgroundColor: "#ef4444", color: "#fff", cursor: "pointer", fontSize: "12px", lineHeight: 1 }}>×</button>
                                                    </div>
                                                ))}
                                                <button type="button" onClick={e => { e.stopPropagation(); galleryInputRef.current?.click(); }} style={{ alignSelf: "center", padding: "8px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: "12px", cursor: "pointer" }}>Add more</button>
                                            </div>
                                        ) : (
                                            <>
                                                <p style={{ margin: 0, fontSize: "14px", color: t.textSub }}>Drop files here or click to upload</p>
                                                <p style={{ margin: "8px 0 0", fontSize: "12px", color: t.textSub }}>Image Size 1170x570</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>Thumbnail Image*</label>
                                    <div style={{ border: `2px dashed ${t.border}`, borderRadius: "12px", padding: "24px", textAlign: "center", backgroundColor: t.bg, minHeight: "140px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                                        {postEvent.bannerPreview ? (
                                            <>
                                                <img src={postEvent.bannerPreview} alt="Thumbnail" style={{ maxWidth: "100%", maxHeight: "120px", objectFit: "contain", borderRadius: "8px" }} />
                                                <div style={{ marginTop: "8px", display: "flex", gap: "8px", justifyContent: "center" }}>
                                                    <button type="button" onClick={() => thumbnailInputRef.current?.click()} style={{ padding: "6px 12px", borderRadius: "8px", border: "none", backgroundColor: "#3b82f6", color: "#fff", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>Change</button>
                                                    <button type="button" onClick={() => setPostEvent(pe => ({ ...pe, banner: null, bannerPreview: null }))} style={{ padding: "6px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: "transparent", color: t.textSub, fontSize: "11px", cursor: "pointer" }}>Remove</button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <ImageIcon size={32} color={t.textSub} style={{ marginBottom: "8px" }} />
                                                <p style={{ margin: 0, fontSize: "12px", color: t.textSub }}>NO IMAGE FOUND</p>
                                                <button type="button" onClick={() => thumbnailInputRef.current?.click()} style={{ marginTop: "12px", padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: "#3b82f6", color: "#fff", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Choose Image</button>
                                            </>
                                        )}
                                        <p style={{ margin: "8px 0 0", fontSize: "11px", color: t.textSub }}>Image Size: 320x230</p>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>Event Environment*</label>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        {["Indoor", "Outdoor"].map(env => (
                                            <button key={env} type="button" onClick={() => setPostEvent(pe => ({ ...pe, environment: env }))} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", backgroundColor: (postEvent.environment || "Indoor") === env ? "#3b82f6" : t.bg, color: (postEvent.environment || "Indoor") === env ? "#fff" : t.textSub, fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>{env}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>Date Type*</label>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        {["Single", "Multiple"].map(opt => (
                                            <button key={opt} type="button" onClick={() => setPostEvent(pe => ({ ...pe, dateType: opt.toLowerCase() }))} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", backgroundColor: (postEvent.dateType || "single") === opt.toLowerCase() ? "#3b82f6" : t.bg, color: (postEvent.dateType || "single") === opt.toLowerCase() ? "#fff" : t.textSub, fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>{opt}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>Countdown Status*</label>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        {["Active", "Deactive"].map(opt => (
                                            <button key={opt} type="button" onClick={() => setPostEvent(pe => ({ ...pe, countdownStatus: opt === "Active" ? "active" : "inactive" }))} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", backgroundColor: (postEvent.countdownStatus || "active") === (opt === "Active" ? "active" : "inactive") ? "#3b82f6" : t.bg, color: (postEvent.countdownStatus || "active") === (opt === "Active" ? "active" : "inactive") ? "#fff" : t.textSub, fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>{opt}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {/* Schedule (Multi-Date & Time) — shown when Date Type is Multiple */}
                            {(postEvent.dateType || "single") === "multiple" && (
                                <div style={{ marginBottom: "24px", padding: "16px", backgroundColor: theme === "dark" ? "#1e293b" : "#f1f5f9", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "12px" }}>Schedule (Multi-Date & Time)*</label>
                                    {multiSlots.map((slot, idx) => (
                                        <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "12px", alignItems: "end", marginBottom: idx < multiSlots.length - 1 ? "12px" : 0 }}>
                                            <div>
                                                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, marginBottom: "4px", color: t.textSub }}>Date</label>
                                                <input type="date" value={slot.date} onChange={e => setMultiSlots(prev => prev.map((s, i) => i === idx ? { ...s, date: e.target.value } : s))} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1.5px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }} />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, marginBottom: "4px", color: t.textSub }}>Time</label>
                                                <input type="time" value={slot.time} onChange={e => setMultiSlots(prev => prev.map((s, i) => i === idx ? { ...s, time: e.target.value } : s))} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: `1.5px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }} />
                                            </div>
                                            <button type="button" onClick={() => setMultiSlots(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev)} style={{ padding: "10px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: "transparent", color: "#ef4444", cursor: "pointer" }} title="Remove slot"><Trash2 size={18} /></button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => setMultiSlots(prev => [...prev, { date: "", time: "" }])} style={{ marginTop: "12px", padding: "10px 16px", borderRadius: "8px", border: "none", backgroundColor: "#3b82f6", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                                        <Plus size={16} /> Add Slot
                                    </button>
                                </div>
                            )}
                            {/* English Language (Default) — purple bar */}
                            <div style={{ backgroundColor: "#5b21b6", color: "#fff", padding: "10px 18px", borderRadius: "8px", marginBottom: "20px" }}>
                                <p style={{ margin: 0, fontSize: "13px", fontWeight: 700 }}>English Language (Default)</p>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                                <div style={{ gridColumn: "span 2" }}>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>Event Title</label>
                                    <input
                                        id="organiser-event-title"
                                        type="text"
                                        value={postEvent.title ?? ""}
                                        onChange={e => {
                                            const v = e.target.value;
                                            setPostEvent(prev => ({ ...prev, title: v }));
                                        }}
                                        placeholder="e.g. Rock Concert 2026"
                                        style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }}
                                        autoComplete="off"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>Category</label>
                                    <select value={postEvent.category} onChange={e => setPostEvent(prev => ({ ...prev, category: e.target.value }))} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }}>
                                        {eventCategoryNames.map((name) => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>Venue</label>
                                    <input type="text" value={postEvent.venue} onChange={e => setPostEvent(prev => ({ ...prev, venue: e.target.value }))} placeholder="Stadium Name" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }} />
                                </div>
                                {postEvent.type === "Venue" && (
                                    <>
                                        <div style={{ gridColumn: "span 2", display: "grid", gridTemplateColumns: "1fr auto", gap: "12px", alignItems: "end" }}>
                                            <div>
                                                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>Address</label>
                                                <input type="text" value={postEvent.address} onChange={e => setPostEvent(prev => ({ ...prev, address: e.target.value }))} placeholder="Enter address" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }} />
                                            </div>
                                            <button type="button" onClick={() => { setTempLocation({ lat: parseFloat(postEvent.latitude) || 28.6139, lng: parseFloat(postEvent.longitude) || 77.209 }); setShowMapModal(true); setGeoError(""); }} style={{ padding: "12px 20px", borderRadius: "10px", border: "none", backgroundColor: "#3b82f6", color: "#fff", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                                                <MapPin size={18} /> Show Map
                                            </button>
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>Latitude</label>
                                            <input type="text" value={postEvent.latitude} onChange={e => setPostEvent(prev => ({ ...prev, latitude: e.target.value }))} placeholder="Set via map" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }} />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>Longitude</label>
                                            <input type="text" value={postEvent.longitude} onChange={e => setPostEvent(prev => ({ ...prev, longitude: e.target.value }))} placeholder="Set via map" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }} />
                                        </div>
                                        <div style={{ gridColumn: "span 2" }}>
                                            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>Country*</label>
                                            <input type="text" value={postEvent.country || ""} onChange={e => setPostEvent(prev => ({ ...prev, country: e.target.value }))} placeholder="Select a Country" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }} />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>City*</label>
                                            <input type="text" value={postEvent.city || ""} onChange={e => setPostEvent(prev => ({ ...prev, city: e.target.value }))} placeholder="Select a City" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }} />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>Zip/Post Code</label>
                                            <input type="text" value={postEvent.zipCode || ""} onChange={e => setPostEvent(prev => ({ ...prev, zipCode: e.target.value }))} placeholder="Enter Zip/Post Code" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }} />
                                        </div>
                                        <div style={{ gridColumn: "span 2" }}>
                                            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>Description*</label>
                                            <textarea value={postEvent.description} onChange={e => setPostEvent(prev => ({ ...prev, description: e.target.value }))} placeholder="Enter Event Description" rows={4} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, resize: "vertical" }} />
                                        </div>
                                    </>
                                )}
                                {/* Seating format: Enable = Seating Based, Disable = Normal Ticketing */}
                                <div style={{ gridColumn: "span 2" }}>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "10px" }}>Ticket / Seating Type</label>
                                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                                        <button
                                            type="button"
                                            onClick={() => setPostEvent(pe => ({ ...pe, seatingEnabled: true }))}
                                            style={{
                                                padding: "12px 20px",
                                                borderRadius: "10px",
                                                border: `2px solid ${postEvent.seatingEnabled !== false ? "#3b82f6" : t.border}`,
                                                backgroundColor: postEvent.seatingEnabled !== false ? "#3b82f615" : "transparent",
                                                color: postEvent.seatingEnabled !== false ? "#3b82f6" : t.textSub,
                                                fontSize: "13px",
                                                fontWeight: 700,
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px"
                                            }}
                                        >
                                            <Grid size={18} /> Seating Based (Event-Based Seating)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPostEvent(pe => ({ ...pe, seatingEnabled: false }))}
                                            style={{
                                                padding: "12px 20px",
                                                borderRadius: "10px",
                                                border: `2px solid ${postEvent.seatingEnabled === false ? "#22c55e" : t.border}`,
                                                backgroundColor: postEvent.seatingEnabled === false ? "#22c55e15" : "transparent",
                                                color: postEvent.seatingEnabled === false ? "#22c55e" : t.textSub,
                                                fontSize: "13px",
                                                fontWeight: 700,
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px"
                                            }}
                                        >
                                            <Ticket size={18} /> Normal Ticketing
                                        </button>
                                        <span style={{ fontSize: "12px", fontWeight: 600, marginLeft: "8px", padding: "6px 12px", borderRadius: "8px", backgroundColor: postEvent.seatingEnabled !== false ? "#3b82f620" : "#64748b30", color: postEvent.seatingEnabled !== false ? "#3b82f6" : t.textSub }}>
                                            Seating: {postEvent.seatingEnabled !== false ? "Enabled" : "Disabled"}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: "12px", color: t.textSub, marginTop: "8px", margin: 0 }}>
                                        {postEvent.seatingEnabled !== false ? "Seating Based: tickets are generated per seat (rows, categories). Set rates per category below." : "Normal Ticketing: sell by quantity only (no seat selection)."}
                                    </p>
                                </div>
                                {(postEvent.dateType || "single") === "single" && (
                                    <>
                                        <div>
                                            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>Date</label>
                                            <input type="date" value={postEvent.date} onChange={e => setPostEvent(prev => ({ ...prev, date: e.target.value }))} placeholder="dd/mm/yyyy" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }} />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>Time</label>
                                            <input type="time" value={postEvent.time} onChange={e => setPostEvent(prev => ({ ...prev, time: e.target.value }))} placeholder="--:--" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }} />
                                        </div>
                                    </>
                                )}
                                {postEvent.seatingEnabled === false && (
                                    <div style={{ gridColumn: "span 2", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", padding: "16px", backgroundColor: theme === "dark" ? "#0f172a" : "#f0fdf4", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>Total Capacity*</label>
                                            <input type="number" min={1} value={postEvent.normalTicketCapacity} onChange={e => setPostEvent(prev => ({ ...prev, normalTicketCapacity: e.target.value }))} placeholder="e.g. 500" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }} />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>Default Price (optional)</label>
                                            <input type="number" min={0} value={postEvent.normalTicketPrice} onChange={e => setPostEvent(prev => ({ ...prev, normalTicketPrice: e.target.value }))} placeholder="e.g. 299" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }} />
                                        </div>
                                        <p style={{ gridColumn: "span 2", margin: 0, fontSize: "12px", color: t.textSub }}>Normal ticketing: no seat map. Tickets are sold by quantity only.</p>
                                    </div>
                                )}
                                {postEvent.seatingEnabled !== false && (
                                    <div style={{ gridColumn: "span 2" }}>
                                        <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}><Grid size={16} /> Seating Layout Builder</h4>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                                            <div>
                                                <label style={{ display: "block", fontSize: "11px", color: t.textSub, marginBottom: "4px" }}>Number of Rows</label>
                                                <input type="number" min={1} value={postEvent.rows} onChange={e => setPostEvent(prev => ({ ...prev, rows: parseInt(e.target.value, 10) || 1 }))} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }} />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "11px", color: t.textSub, marginBottom: "4px" }}>Seats per Row</label>
                                                <input type="number" min={1} value={postEvent.cols} onChange={e => setPostEvent(prev => ({ ...prev, cols: parseInt(e.target.value, 10) || 1 }))} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }} />
                                            </div>
                                        </div>
                                        <div style={{ marginBottom: "20px" }}>
                                            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "10px", color: t.textMain }}>Seating categories & rates</label>
                                            <p style={{ fontSize: "11px", color: t.textSub, marginBottom: "12px", margin: 0 }}>Set name, row range, and price per category. Rows are 1-based (e.g. 1–2 = rows A–B).</p>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                                {(postEvent.categories || []).map((cat, idx) => (
                                                    <div key={idx} style={{ display: "grid", gridTemplateColumns: "minmax(80px,1fr) 60px minmax(60px,1fr) minmax(60px,1fr) 100px", gap: "10px", alignItems: "end", padding: "12px", backgroundColor: theme === "dark" ? "#1e293b" : "#f8fafc", borderRadius: "10px", border: `1px solid ${t.border}` }}>
                                                        <div>
                                                            <label style={{ fontSize: "10px", color: t.textSub, marginBottom: "2px", display: "block" }}>Name</label>
                                                            <input type="text" value={cat.name} onChange={e => setPostEvent(pe => ({ ...pe, categories: pe.categories.map((c, i) => i === idx ? { ...c, name: e.target.value } : c) }))} placeholder="e.g. VIP" style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: "12px" }} />
                                                        </div>
                                                        <div>
                                                            <label style={{ fontSize: "10px", color: t.textSub, marginBottom: "2px", display: "block" }}>Color</label>
                                                            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                                                                <input type="color" value={cat.color || "#94a3b8"} onChange={e => setPostEvent(pe => ({ ...pe, categories: pe.categories.map((c, i) => i === idx ? { ...c, color: e.target.value } : c) }))} style={{ width: "32px", height: "28px", padding: 0, border: "none", borderRadius: "4px", cursor: "pointer" }} />
                                                                <input type="text" value={cat.color || ""} onChange={e => setPostEvent(pe => ({ ...pe, categories: pe.categories.map((c, i) => i === idx ? { ...c, color: e.target.value } : c) }))} placeholder="#hex" style={{ width: "100%", padding: "6px 6px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: "11px" }} />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label style={{ fontSize: "10px", color: t.textSub, marginBottom: "2px", display: "block" }}>Row from</label>
                                                            <input type="number" min={1} value={cat.rowStart} onChange={e => setPostEvent(pe => ({ ...pe, categories: pe.categories.map((c, i) => i === idx ? { ...c, rowStart: parseInt(e.target.value, 10) || 1 } : c) }))} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: "12px" }} />
                                                        </div>
                                                        <div>
                                                            <label style={{ fontSize: "10px", color: t.textSub, marginBottom: "2px", display: "block" }}>Row to</label>
                                                            <input type="number" min={1} value={cat.rowEnd} onChange={e => setPostEvent(pe => ({ ...pe, categories: pe.categories.map((c, i) => i === idx ? { ...c, rowEnd: parseInt(e.target.value, 10) || 1 } : c) }))} style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: "12px" }} />
                                                        </div>
                                                        <div>
                                                            <label style={{ fontSize: "10px", color: t.textSub, marginBottom: "2px", display: "block" }}>Rate (₹)</label>
                                                            <input type="number" min={0} value={cat.price ?? ""} onChange={e => setPostEvent(pe => ({ ...pe, categories: pe.categories.map((c, i) => i === idx ? { ...c, price: e.target.value === "" ? 0 : parseInt(e.target.value, 10) || 0 } : c) }))} placeholder="0" style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: "12px" }} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div style={{ backgroundColor: theme === 'dark' ? '#0f172a' : '#f1f5f9', padding: "20px", borderRadius: "12px", overflowX: "auto" }}>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
                                                {[...Array(Math.max(1, postEvent.rows))].map((_, rIdx) => {
                                                    const cat = getSeatCategory(rIdx);
                                                    return (
                                                        <div key={rIdx} style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                                            <span style={{ fontSize: "10px", fontWeight: 800, width: "20px", color: t.textSub }}>{ROW_LABELS[rIdx]}</span>
                                                            {[...Array(Math.max(1, postEvent.cols))].map((_, cIdx) => (
                                                                <div key={cIdx} style={{ width: "14px", height: "14px", borderRadius: "3px", backgroundColor: cat.color, opacity: 0.8 }} />
                                                            ))}
                                                        </div>
                                                    );
                                                })}
                                                <div style={{ marginTop: "16px", width: "100%", height: "4px", backgroundColor: t.border, borderRadius: "2px" }} />
                                                <p style={{ fontSize: "10px", color: t.textSub, margin: "4px 0 0" }}>STAGE / SCREEN</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div style={{ gridColumn: "span 2" }}>
                                    <button onClick={publishSeatEvent} style={{ width: "100%", padding: "16px", backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: "12px", fontWeight: 800, cursor: "pointer" }}>
                                        {postEvent.seatingEnabled !== false ? "Publish Event & Layout" : "Publish Event (Normal Ticketing)"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                case "seat_map":
                    return (
                        <div style={{ backgroundColor: t.cardBg, padding: "32px", borderRadius: "20px", border: `1px solid ${t.border}` }}>
                            {!selectedEventForSeatMap ? (
                                <div style={{ textAlign: "center", padding: "40px" }}>
                                    <p style={{ color: t.textSub }}>Please select an event from 'Manage Events' to view its seat map.</p>
                                    <button onClick={() => setActiveTab("manage_events")} style={{ color: "#3b82f6", background: "none", border: "none", fontWeight: 700, cursor: "pointer" }}>Go to Manage Events</button>
                                </div>
                            ) : selectedEventForSeatMap.seatingEnabled === false ? (
                                <div style={{ textAlign: "center", padding: "40px" }}>
                                    <p style={{ color: t.textSub }}>This event uses Normal Ticketing (no seat selection). Seat map is not available.</p>
                                    <button onClick={() => setActiveTab("manage_events")} style={{ color: "#3b82f6", background: "none", border: "none", fontWeight: 700, cursor: "pointer" }}>Back to Manage Events</button>
                                </div>
                            ) : (
                                <div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                                        <div>
                                            <h3 style={{ fontSize: "20px", fontWeight: 800, margin: 0 }}>{selectedEventForSeatMap.title} — Real-time Seat Map</h3>
                                            <p style={{ fontSize: "14px", color: t.textSub, margin: "4px 0 0" }}>{selectedEventForSeatMap.venue} | {selectedEventForSeatMap.date}</p>
                                        </div>
                                        <div style={{ display: "flex", gap: "16px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#3b82f6" }}></div><span style={{ fontSize: "12px" }}>Available</span></div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#f84464" }}></div><span style={{ fontSize: "12px" }}>Booked</span></div>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center", backgroundColor: theme === 'dark' ? '#0f172a' : '#f1f5f9', padding: "40px", borderRadius: "16px", overflowX: "auto" }}>
                                        {[...Array(selectedEventForSeatMap.rows || 6)].map((_, rIdx) => {
                                            const rowLabel = ROW_LABELS[rIdx];
                                            return (
                                                <div key={rIdx} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                                    <span style={{ width: "24px", textAlign: "center", fontWeight: 800, fontSize: "12px", color: t.textSub }}>{rowLabel}</span>
                                                    {[...Array(selectedEventForSeatMap.cols || 10)].map((_, cIdx) => {
                                                        const seatId = `${rowLabel}${cIdx + 1}`;
                                                        const isBooked = mockBookedSeats[selectedEventForSeatMap.id]?.has(seatId);
                                                        return (
                                                            <div key={cIdx} title={seatId} style={{ width: "24px", height: "24px", borderRadius: "6px", backgroundColor: isBooked ? "#f84464" : "#3b82f630", border: `1px solid ${isBooked ? "#f84464" : "#3b82f6"}`, transition: "0.2s", cursor: "pointer" }} />
                                                        );
                                                    })}
                                                </div>
                                            )
                                        })}
                                        <div style={{ marginTop: "40px", width: "60%", height: "4px", backgroundColor: t.border, borderRadius: "2px", border: "1.5px solid #3b82f650" }} />
                                        <p style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px", color: t.textSub, marginTop: "10px" }}>STAGE / SCREEN THIS WAY</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                case "wallet":
                case "payout":
                    return (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "24px" }}>
                            <div style={{ backgroundColor: t.cardBg, padding: "32px", borderRadius: "20px", border: `1px solid ${t.border}` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
                                    <div>
                                        <p style={{ fontSize: "14px", color: t.textSub, marginBottom: "4px" }}>Available Balance</p>
                                        <h1 style={{ fontSize: "42px", fontWeight: 900 }}>{wallet.currency}{wallet.balance.toLocaleString()}</h1>
                                    </div>
                                    <button
                                        onClick={() => setShowPayoutModal(true)}
                                        style={{ backgroundColor: "#3b82f6", color: "#fff", border: "none", padding: "14px 28px", borderRadius: "12px", fontSize: "15px", fontWeight: 700, cursor: "pointer", transition: "0.2s" }}>
                                        Request Amount
                                    </button>
                                </div>

                                <h4 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "20px" }}>Transaction History</h4>
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    {wallet.transactions.map(tx => (
                                        <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderRadius: "12px", backgroundColor: theme === 'light' ? "#f8fafc" : "#0f172a" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                                <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: tx.amount > 0 ? "#22c55e15" : "#3b82f615", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    {tx.amount > 0 ? <Plus size={18} color="#22c55e" /> : <Wallet size={18} color="#3b82f6" />}
                                                </div>
                                                <div>
                                                    <p style={{ margin: 0, fontWeight: 700, fontSize: "14px" }}>{tx.type}</p>
                                                    <p style={{ margin: 0, fontSize: "12px", color: t.textSub }}>{tx.date}</p>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <p style={{ margin: 0, fontWeight: 800, color: tx.amount > 0 ? "#22c55e" : t.textMain }}>{tx.amount > 0 ? "+" : ""}{wallet.currency}{Math.abs(tx.amount).toLocaleString()}</p>
                                                <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: tx.status === 'Completed' ? '#22c55e' : '#f97316' }}>{tx.status.toUpperCase()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                                <div style={{ backgroundColor: "#3b82f610", padding: "24px", borderRadius: "20px", border: "1px dashed #3b82f6", position: "relative" }}>
                                    <h4 style={{ fontSize: "15px", fontWeight: 700, color: "#3b82f6", marginBottom: "12px" }}>Settlement Info</h4>
                                    <p style={{ fontSize: "12px", color: t.textSub, lineHeight: "1.5" }}>Settlements are processed every Monday. Minimum withdrawal amount is ₹1,000.</p>
                                </div>
                                <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "20px", border: `1px solid ${t.border}` }}>
                                    <h4 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "16px" }}>Linked Bank Account</h4>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div style={{ padding: "10px", backgroundColor: t.bg, borderRadius: "8px" }}><Building size={20} /></div>
                                        <div>
                                            <p style={{ margin: 0, fontSize: "13px", fontWeight: 700 }}>HDFC Bank Ltd</p>
                                            <p style={{ margin: 0, fontSize: "11px", color: t.textSub }}>**** 4421</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                case "venue_events": {
                    const venueEvents = events.filter(ev => (ev.type || "Venue") === "Venue");
                    return (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "16px", border: `1px solid ${t.border}` }}>
                            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px", color: t.textMain }}>Venue Events</h3>
                            <p style={{ fontSize: "13px", color: t.textSub, marginBottom: "20px" }}>List of venue-based events. Same as All Events filtered by type.</p>
                            <p style={{ fontSize: "13px", color: t.textSub, marginBottom: "16px" }}><strong>{venueEvents.length}</strong> events</p>
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: "left" }}>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>Event Details</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>Date & Time</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>Seats</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>Status</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {venueEvents.length === 0 ? (
                                            <tr><td colSpan={5} style={{ padding: "24px", textAlign: "center", color: t.textSub, fontSize: "13px" }}>No venue events yet. Add one from &quot;Add Event&quot; (choose Venue).</td></tr>
                                        ) : venueEvents.map(ev => (
                                            <tr key={ev.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                                                <td style={{ padding: "16px" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                        <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "#f9731620", display: "flex", alignItems: "center", justifyContent: "center" }}><MapPin size={20} color="#f97316" /></div>
                                                        <div>
                                                            <p style={{ fontWeight: 700, margin: 0, fontSize: "14px", color: t.textMain }}>{ev.title}</p>
                                                            <p style={{ fontSize: "11px", color: t.textSub, margin: 0 }}>{ev.venue || "—"}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: "16px" }}>
                                                    <p style={{ fontSize: "13px", margin: 0, fontWeight: 600, color: t.textMain }}>{ev.date || "—"}</p>
                                                    <p style={{ fontSize: "11px", color: t.textSub, margin: 0 }}>{ev.time || "—"}</p>
                                                </td>
                                                <td style={{ padding: "16px" }}>
                                                    {ev.totalSeats ? (
                                                        <div>
                                                            <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: t.textMain }}>{ev.totalSeats - (ev.bookedSeats || 0)} <span style={{ color: t.textSub, fontWeight: 400 }}>/ {ev.totalSeats} avail.</span></p>
                                                            <div style={{ marginTop: 6, height: 5, borderRadius: 3, background: t.border, overflow: "hidden" }}>
                                                                <div style={{ height: "100%", width: `${Math.min(100, ((ev.bookedSeats || 0) / ev.totalSeats) * 100)}%`, background: "#f84464", borderRadius: 3 }} />
                                                            </div>
                                                        </div>
                                                    ) : <span style={{ color: t.textSub, fontSize: 12 }}>—</span>}
                                                </td>
                                                <td style={{ padding: "16px" }}>
                                                    <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, backgroundColor: "#22c55e15", color: "#22c55e" }}>ACTIVE</span>
                                                </td>
                                                <td style={{ padding: "16px" }}>
                                                    <div style={{ display: "flex", gap: "8px" }}>
                                                        {ev.seatingEnabled !== false ? (
                                                            <button title="View Seat Map" onClick={() => { setSelectedEventForSeatMap(ev); setActiveTab("seat_map"); }} style={{ background: "#6366f110", border: "1px solid #6366f130", padding: "8px 12px", borderRadius: "8px", color: "#6366f1", cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                                                                <Grid size={14} /> Seat Map
                                                            </button>
                                                        ) : (
                                                            <span style={{ padding: "6px 10px", borderRadius: "8px", backgroundColor: t.bg, color: t.textSub, fontSize: 11, fontWeight: 600 }}>Normal Ticketing</span>
                                                        )}
                                                        <button title="Delete" onClick={() => { if (confirm("Delete this event?")) deleteEventMutation({ id: ev.id }).catch(e => console.error(e)); }} style={{ background: "none", border: `1px solid ${t.border}`, padding: "8px", borderRadius: "8px", color: "#ef4444", cursor: "pointer" }}><Trash2 size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                }
                case "online_events": {
                    const onlineEvents = events.filter(ev => ev.type === "Online");
                    return (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "16px", border: `1px solid ${t.border}` }}>
                            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px", color: t.textMain }}>Online Events</h3>
                            <p style={{ fontSize: "13px", color: t.textSub, marginBottom: "20px" }}>List of online events.</p>
                            <p style={{ fontSize: "13px", color: t.textSub, marginBottom: "16px" }}><strong>{onlineEvents.length}</strong> events</p>
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: "left" }}>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>Event Details</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>Date & Time</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>Seats</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>Status</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {onlineEvents.length === 0 ? (
                                            <tr><td colSpan={5} style={{ padding: "24px", textAlign: "center", color: t.textSub, fontSize: "13px" }}>No online events yet. Add one from &quot;Add Event&quot; (choose Online).</td></tr>
                                        ) : onlineEvents.map(ev => (
                                            <tr key={ev.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                                                <td style={{ padding: "16px" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                        <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "#22c55e20", display: "flex", alignItems: "center", justifyContent: "center" }}><CloudUpload size={20} color="#22c55e" /></div>
                                                        <div>
                                                            <p style={{ fontWeight: 700, margin: 0, fontSize: "14px", color: t.textMain }}>{ev.title}</p>
                                                            <p style={{ fontSize: "11px", color: t.textSub, margin: 0 }}>Online event</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: "16px" }}>
                                                    <p style={{ fontSize: "13px", margin: 0, fontWeight: 600, color: t.textMain }}>{ev.date || "—"}</p>
                                                    <p style={{ fontSize: "11px", color: t.textSub, margin: 0 }}>{ev.time || "—"}</p>
                                                </td>
                                                <td style={{ padding: "16px" }}>
                                                    {ev.totalSeats ? (
                                                        <div>
                                                            <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: t.textMain }}>{ev.totalSeats - (ev.bookedSeats || 0)} <span style={{ color: t.textSub, fontWeight: 400 }}>/ {ev.totalSeats} avail.</span></p>
                                                            <div style={{ marginTop: 6, height: 5, borderRadius: 3, background: t.border, overflow: "hidden" }}>
                                                                <div style={{ height: "100%", width: `${Math.min(100, ((ev.bookedSeats || 0) / ev.totalSeats) * 100)}%`, background: "#f84464", borderRadius: 3 }} />
                                                            </div>
                                                        </div>
                                                    ) : <span style={{ color: t.textSub, fontSize: 12 }}>—</span>}
                                                </td>
                                                <td style={{ padding: "16px" }}>
                                                    <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, backgroundColor: "#22c55e15", color: "#22c55e" }}>ACTIVE</span>
                                                </td>
                                                <td style={{ padding: "16px" }}>
                                                    <div style={{ display: "flex", gap: "8px" }}>
                                                        {ev.seatingEnabled !== false ? (
                                                            <button title="View Seat Map" onClick={() => { setSelectedEventForSeatMap(ev); setActiveTab("seat_map"); }} style={{ background: "#6366f110", border: "1px solid #6366f130", padding: "8px 12px", borderRadius: "8px", color: "#6366f1", cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                                                                <Grid size={14} /> Seat Map
                                                            </button>
                                                        ) : (
                                                            <span style={{ padding: "6px 10px", borderRadius: "8px", backgroundColor: t.bg, color: t.textSub, fontSize: 11, fontWeight: 600 }}>Normal Ticketing</span>
                                                        )}
                                                        <button title="Delete" onClick={() => { if (confirm("Delete this event?")) deleteEventMutation({ id: ev.id }).catch(e => console.error(e)); }} style={{ background: "none", border: `1px solid ${t.border}`, padding: "8px", borderRadius: "8px", color: "#ef4444", cursor: "pointer" }}><Trash2 size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                }
                case "event_bookings": {
                    const myEventIds = new Set(events.map(e => String(e.id)));
                    const myBookings = convexBookings.filter(b => myEventIds.has(String(b.eventId)));
                    const filtered = eventBookingsTab === "all" ? myBookings :
                        eventBookingsTab === "completed" ? myBookings.filter(b => b.status === "Confirmed") :
                            eventBookingsTab === "pending" ? myBookings.filter(b => b.status === "Pending") :
                                eventBookingsTab === "rejected" ? myBookings.filter(b => b.status === "Cancelled") :
                                    myBookings;

                    return (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "16px", border: `1px solid ${t.border}` }}>
                            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>Event Bookings</h3>
                            <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
                                {["all", "completed", "pending", "rejected", "report"].map(id => (
                                    <button key={id} onClick={() => setEventBookingsTab(id)} style={{ padding: "8px 14px", borderRadius: "8px", border: "none", backgroundColor: eventBookingsTab === id ? "#3b82f6" : t.bg, color: eventBookingsTab === id ? "#fff" : t.textMain, fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                                        {id === "all" ? "All Bookings" : id === "report" ? "Report" : id.charAt(0).toUpperCase() + id.slice(1) + " Bookings"}
                                    </button>
                                ))}
                            </div>
                            {eventBookingsTab === "report" ? (
                                <div style={{ padding: "40px", textAlign: "center", color: t.textSub }}>
                                    <BarChart3 size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
                                    <p>Detailed reports coming soon. View summary in Dashboard.</p>
                                </div>
                            ) : (
                                <div style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: "left" }}>
                                                <th style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>Order ID</th>
                                                <th style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>Event</th>
                                                <th style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>Customer</th>
                                                <th style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>Tickets</th>
                                                <th style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>Amount</th>
                                                <th style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtered.length === 0 ? (
                                                <tr><td colSpan={6} style={{ padding: "24px", textAlign: "center", color: t.textSub }}>No bookings found.</td></tr>
                                            ) : filtered.map(b => (
                                                <tr key={b._id} style={{ borderBottom: `1px solid ${t.border}` }}>
                                                    <td style={{ padding: "12px", fontWeight: 600, fontSize: "13px" }}>#{b._id.slice(-8).toUpperCase()}</td>
                                                    <td style={{ padding: "12px", fontSize: "13px" }}>{b.eventName || "—"}</td>
                                                    <td style={{ padding: "12px", fontSize: "13px" }}>{b.userId}</td>
                                                    <td style={{ padding: "12px", fontSize: "13px" }}>{b.ticketCount}</td>
                                                    <td style={{ padding: "12px", fontWeight: 700, fontSize: "13px" }}>₹{b.totalPrice}</td>
                                                    <td style={{ padding: "12px" }}>
                                                        <span style={{ padding: "4px 10px", borderRadius: "100px", fontSize: "11px", fontWeight: 700, backgroundColor: b.status === "Confirmed" ? "#dcfce7" : "#fee2e2", color: b.status === "Confirmed" ? "#16a34a" : "#dc2626" }}>
                                                            {b.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    );
                }
                case "withdraw":
                    return (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "16px", border: `1px solid ${t.border}` }}>
                            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>Withdrawal</h3>
                            <p style={{ fontSize: "13px", color: t.textSub, marginBottom: "24px" }}>Request withdrawals to your linked bank account. Minimum balance Required: ₹500.</p>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", maxWidth: "800px" }}>
                                <div style={{ padding: "24px", borderRadius: "16px", backgroundColor: "#3b82f6", color: "#fff" }}>
                                    <p style={{ margin: 0, fontSize: "14px", opacity: 0.9 }}>Available for Withdrawal</p>
                                    <p style={{ margin: "8px 0 0", fontSize: "32px", fontWeight: 800 }}>₹{wallet.balance.toLocaleString()}</p>
                                    <button style={{ marginTop: "24px", width: "100%", padding: "12px", borderRadius: "8px", border: "none", backgroundColor: "#fff", color: "#3b82f6", fontWeight: 700, cursor: "pointer" }}>Request Payout</button>
                                </div>
                                <div style={{ padding: "24px", borderRadius: "16px", border: `1px solid ${t.border}`, backgroundColor: t.bg }}>
                                    <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "16px" }}>Linked Bank Account</h4>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <Building size={24} style={{ color: t.textSub }} />
                                        <div>
                                            <p style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>HDFC Bank ···· 4242</p>
                                            <p style={{ margin: 0, fontSize: "12px", color: t.textSub }}>Verified · Primary</p>
                                        </div>
                                    </div>
                                    <button style={{ marginTop: "24px", border: `1px solid ${t.border}`, background: "none", color: t.textMain, padding: "8px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Manage Accounts</button>
                                </div>
                            </div>
                        </div>
                    );
                case "transactions": {
                    const myEventIds = new Set(events.map(e => String(e.id)));
                    const myBookings = convexBookings.filter(b => myEventIds.has(String(b.eventId)));

                    return (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "16px", border: `1px solid ${t.border}` }}>
                            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>Transactions</h3>
                            <p style={{ fontSize: "13px", color: t.textSub, marginBottom: "24px" }}>View your earnings and payout history.</p>

                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: "left" }}>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>Reference</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>Date</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>Type</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>Description</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>Amount</th>
                                            <th style={{ padding: "12px", color: t.textSub, fontSize: "13px" }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {myBookings.length === 0 ? (
                                            <tr><td colSpan={6} style={{ padding: "24px", textAlign: "center", color: t.textSub }}>No transactions yet.</td></tr>
                                        ) : myBookings.sort((a, b) => b._creationTime - a._creationTime).map(b => (
                                            <tr key={b._id} style={{ borderBottom: `1px solid ${t.border}` }}>
                                                <td style={{ padding: "12px", fontSize: "13px", color: t.textSub }}>#{b._id.slice(-6).toUpperCase()}</td>
                                                <td style={{ padding: "12px", fontSize: "13px" }}>{new Date(b._creationTime).toLocaleDateString()}</td>
                                                <td style={{ padding: "12px", fontSize: "13px" }}>Ticket Sale</td>
                                                <td style={{ padding: "12px", fontSize: "13px" }}>{b.eventName || "Event Ticket"} (x{b.ticketCount})</td>
                                                <td style={{ padding: "12px", fontSize: "13px", fontWeight: 700, color: "#22c55e" }}>+₹{b.totalPrice}</td>
                                                <td style={{ padding: "12px" }}>
                                                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#22c55e" }}>COMPLETED</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                }
                case "pwa_scanner":
                    return (
                        <div style={{ maxWidth: "560px" }}>
                            <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "16px", border: `1px solid ${t.border}`, marginBottom: "20px" }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px", color: t.textMain }}>PWA Scanner</h3>
                                <p style={{ fontSize: "13px", color: t.textSub, marginBottom: "20px" }}>Scan the ticket QR code with your camera or enter the Booking ID manually.</p>

                                <div style={{ marginBottom: "20px" }}>
                                    <button
                                        type="button"
                                        onClick={() => setPwaCameraOpen(true)}
                                        style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "14px 24px", borderRadius: "12px", border: "2px solid #3b82f6", backgroundColor: "#3b82f620", color: "#3b82f6", fontWeight: 700, cursor: "pointer", fontSize: "15px" }}
                                    >
                                        <Ticket size={22} /> Open camera scanner
                                    </button>
                                    {typeof window !== "undefined" && typeof BarcodeDetector === "undefined" && (
                                        <p style={{ fontSize: "12px", color: t.textSub, margin: "8px 0 0" }}>Camera scan works in Chrome (desktop or Android). Otherwise use manual entry below.</p>
                                    )}
                                </div>

                                {pwaCameraOpen && (
                                    <div style={{ marginBottom: "20px", padding: "16px", borderRadius: "12px", border: "2px solid #3b82f6", backgroundColor: theme === "light" ? "#f0f9ff" : "#0f172a" }}>
                                        <p style={{ fontSize: "13px", fontWeight: 600, marginBottom: "12px", color: t.textMain }}>Point camera at ticket QR code</p>
                                        <div style={{ position: "relative", width: "100%", maxWidth: "320px", borderRadius: "12px", overflow: "hidden", backgroundColor: "#000", aspectRatio: "1" }}>
                                            <video ref={pwaVideoRef} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
                                        </div>
                                        <button type="button" onClick={() => setPwaCameraOpen(false)} style={{ marginTop: "12px", padding: "10px 20px", borderRadius: "8px", border: "none", backgroundColor: "#64748b", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}>Stop scanner</button>
                                    </div>
                                )}

                                <p style={{ fontSize: "12px", color: t.textSub, marginBottom: "12px" }}>Or enter Booking ID manually:</p>
                                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                                    <input
                                        type="text"
                                        placeholder="Enter Booking ID (e.g. ORD-1234567890)"
                                        value={pwaScanInput}
                                        onChange={(e) => { setPwaScanInput(e.target.value); setPwaScanResult(null); }}
                                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); validateBookingId((e.target.value || pwaScanInput).trim()); } }}
                                        style={{ flex: "1", minWidth: "200px", padding: "12px 16px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: "14px" }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => validateBookingId(pwaScanInput)}
                                        style={{ padding: "12px 24px", borderRadius: "10px", border: "none", backgroundColor: "#3b82f6", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}
                                    >
                                        Validate ticket
                                    </button>
                                </div>
                                {pwaScanResult && (
                                    <div style={{ marginTop: "20px", padding: "16px", borderRadius: "12px", border: "1px solid", backgroundColor: pwaScanResult.status === "valid" ? "#dcfce7" : pwaScanResult.status === "already_used" ? "#fef3c7" : "#fee2e2", borderColor: pwaScanResult.status === "valid" ? "#22c55e" : pwaScanResult.status === "already_used" ? "#f59e0b" : "#ef4444" }}>
                                        {pwaScanResult.status === "valid" && (
                                            <>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", color: "#166534", fontWeight: 700 }}>
                                                    <CheckCircle size={20} /> Ticket valid — Checked in
                                                </div>
                                                <p style={{ margin: 0, fontSize: "13px", color: "#15803d" }}>{pwaScanResult.booking.eventName} · {pwaScanResult.booking.tickets} ticket(s). Entry confirmed.</p>
                                            </>
                                        )}
                                        {pwaScanResult.status === "already_used" && (
                                            <>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", color: "#b45309", fontWeight: 700 }}>
                                                    <Ticket size={20} /> Already used
                                                </div>
                                                <p style={{ margin: 0, fontSize: "13px", color: "#92400e" }}>This ticket was scanned at {pwaScanResult.booking.scannedAt ? new Date(pwaScanResult.booking.scannedAt).toLocaleString() : "earlier"}.</p>
                                            </>
                                        )}
                                        {pwaScanResult.status === "not_found" && (
                                            <>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", color: "#b91c1c", fontWeight: 700 }}>
                                                    <X size={20} /> Not found
                                                </div>
                                                <p style={{ margin: 0, fontSize: "13px", color: "#991b1b" }}>No booking found for this ID. Check the code or ask the attendee to show the ticket.</p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div style={{ backgroundColor: t.cardBg, padding: "20px", borderRadius: "16px", border: `1px solid ${t.border}` }}>
                                <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px", color: t.textMain }}>How it works</h4>
                                <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: t.textSub, lineHeight: 1.7 }}>
                                    <li>Attendees show the ticket QR code (on phone or print). The QR contains the Booking ID.</li>
                                    <li>Use a QR scanner app to read the code, or ask the attendee to read the Booking ID (e.g. ORD-1234567890) and enter it above.</li>
                                    <li>Tap &quot;Validate ticket&quot; to check in. Valid tickets are marked as used so they cannot be used again.</li>
                                </ul>
                            </div>
                        </div>
                    );
                case "support_tickets": {
                    const TICKET_STATUSES = ["Open", "Pending", "On-Hold", "In-Progress", "Resolved", "Closed"];
                    const statusColor = (s) => ({ Open: "#22c55e", Pending: "#7dd3fc", "On-Hold": "#8b5cf6", "In-Progress": "#06b6d4", Resolved: "#22c55e", Closed: "#ef4444" }[s] || "#64748b");
                    const saveSupportTickets = (list) => {
                        try { localStorage.setItem("support_tickets", JSON.stringify(list)); } catch (_) { }
                        setSupportTicketsList(list);
                    };
                    const filteredTickets = supportTicketSearchId.trim() ? supportTicketsList.filter(t => String(t.ticketId || t.id || "").toLowerCase().includes(supportTicketSearchId.trim().toLowerCase())) : supportTicketsList;
                    const toggleTicketSelect = (id) => setSelectedTicketIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
                    const toggleSelectAll = () => { if (selectedTicketIds.length >= filteredTickets.length) setSelectedTicketIds([]); else setSelectedTicketIds(filteredTickets.map(t => t.id)); };
                    const viewedTicket = supportTicketDetailId ? supportTicketsList.find(t => t.id === supportTicketDetailId) : null;
                    const addReplyToTicket = (ticketId, message) => {
                        const list = supportTicketsList.map(t => t.id !== ticketId ? t : { ...t, replies: [...(Array.isArray(t.replies) ? t.replies : []), { from: "organiser", message: (message || "").trim(), at: new Date().toISOString() }], updatedAt: new Date().toISOString() });
                        try { localStorage.setItem("support_tickets", JSON.stringify(list)); } catch (_) { }
                        setSupportTicketsList(list);
                        setSupportTicketReplyMessage("");
                    };
                    const Breadcrumb = ({ title, sub }) => (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: t.textSub, marginBottom: "16px" }}>
                            <Home size={14} style={{ flexShrink: 0 }} />
                            <span>Support Ticket</span>
                            <span style={{ opacity: 0.7 }}>/</span>
                            <span style={{ color: t.textMain, fontWeight: 600 }}>{title}{sub ? ` > ${sub}` : ""}</span>
                        </div>
                    );
                    return (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "16px", border: `1px solid ${t.border}` }}>
                            <Breadcrumb title={supportTab === "all_tickets" ? "All Tickets" : "Add Ticket"} sub={supportTab === "add_ticket" ? "" : undefined} />
                            <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "20px", color: t.textMain }}>{supportTab === "all_tickets" ? "All Tickets" : "Add Ticket"}</h3>
                            <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                                <button onClick={() => setSupportTab("all_tickets")} style={{ padding: "8px 14px", borderRadius: "8px", border: "none", backgroundColor: supportTab === "all_tickets" ? "#3b82f6" : t.bg, color: supportTab === "all_tickets" ? "#fff" : t.textMain, fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>All Tickets</button>
                                <button onClick={() => setSupportTab("add_ticket")} style={{ padding: "8px 14px", borderRadius: "8px", border: "none", backgroundColor: supportTab === "add_ticket" ? "#3b82f6" : t.bg, color: supportTab === "add_ticket" ? "#fff" : t.textMain, fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Add Ticket</button>
                            </div>
                            {supportTab === "add_ticket" && (
                                <div style={{ padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}`, backgroundColor: t.bg, maxWidth: "560px" }}>
                                    <div style={{ marginBottom: "16px" }}>
                                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: t.textMain, marginBottom: "6px" }}>Email <span style={{ color: "#ef4444" }}>*</span></label>
                                        <input type="email" value={supportTicketForm.email || profile?.email || "organizer@gmail.com"} onChange={(e) => setSupportTicketForm(f => ({ ...f, email: e.target.value }))} placeholder="organizer@gmail.com" style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: t.cardBg, color: t.textMain, fontSize: "14px" }} />
                                    </div>
                                    <div style={{ marginBottom: "16px" }}>
                                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: t.textMain, marginBottom: "6px" }}>Subject <span style={{ color: "#ef4444" }}>*</span></label>
                                        <input type="text" placeholder="Enter Subject" value={supportTicketForm.subject} onChange={(e) => setSupportTicketForm(f => ({ ...f, subject: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: t.cardBg, color: t.textMain, fontSize: "14px" }} />
                                    </div>
                                    <div style={{ marginBottom: "16px" }}>
                                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: t.textMain, marginBottom: "6px" }}>Description</label>
                                        <textarea placeholder="Description" value={supportTicketForm.description} onChange={(e) => setSupportTicketForm(f => ({ ...f, description: e.target.value }))} rows={4} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: t.cardBg, color: t.textMain, fontSize: "14px", resize: "vertical" }} />
                                    </div>
                                    <div style={{ marginBottom: "20px" }}>
                                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: t.textMain, marginBottom: "6px" }}>Attachment</label>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                            <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "8px", backgroundColor: theme === "dark" ? "#1e293b" : "#1e3a5f", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                                                Choose file
                                                <input type="file" accept=".zip" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; if (!f.name.toLowerCase().endsWith(".zip")) { alert("Upload only ZIP files."); return; } if (f.size > 20 * 1024 * 1024) { alert("Max file size is 20 MB."); return; } setSupportTicketForm(prev => ({ ...prev, attachmentFileName: f.name })); }} />
                                            </label>
                                            <span style={{ fontSize: "12px", color: t.textSub }}>{supportTicketForm.attachmentFileName || "No file chosen"}</span>
                                        </div>
                                        <p style={{ fontSize: "12px", color: "#b45309", marginTop: "8px", marginBottom: 0 }}>Upload only ZIP Files, Max File Size is 20 MB</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            const emailVal = (supportTicketForm.email || profile?.email || "test@gmail.com").trim();
                                            const sub = (supportTicketForm.subject || "").trim();
                                            const desc = (supportTicketForm.description || "").trim();
                                            if (!emailVal || !sub) {
                                                alert("Please fill in email and subject.");
                                                return;
                                            }
                                            await createTicketMutation({
                                                userId: emailVal,
                                                issue: sub + (desc ? "\n" + desc : ""),
                                                status: "Open"
                                            });
                                            alert("Support ticket submitted successfully!");
                                            setSupportTicketForm({ email: "", subject: "", description: "", attachmentFileName: "" });
                                            setSupportTab("all_tickets");
                                        }}
                                        style={{ padding: "12px 28px", borderRadius: "8px", border: "none", backgroundColor: "#22c55e", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}
                                    >
                                        Save
                                    </button>
                                    <p style={{ fontSize: "12px", color: t.textSub, marginTop: "12px" }}>You will receive email updates when support changes the ticket status.</p>
                                </div>
                            )}
                            {supportTab === "all_tickets" && (
                                <>
                                    {viewedTicket ? (
                                        <div style={{ marginBottom: "20px" }}>
                                            <button type="button" onClick={() => { setSupportTicketDetailId(null); setSupportTicketReplyMessage(""); }} style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "16px", padding: "8px 14px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: "13px", fontWeight: 600, cursor: "pointer" }}><ArrowRight size={16} style={{ transform: "rotate(180deg)" }} /> Back to list</button>
                                            <div style={{ padding: "20px", borderRadius: "12px", border: `1px solid ${t.border}`, backgroundColor: t.bg, marginBottom: "16px" }}>
                                                <h4 style={{ fontSize: "16px", fontWeight: 700, color: t.textMain, marginBottom: "12px" }}>Ticket #{viewedTicket.ticketId ?? viewedTicket.id}</h4>
                                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px", marginBottom: "12px" }}>
                                                    <div><span style={{ fontSize: "12px", color: t.textSub }}>Email</span><div style={{ fontSize: "14px", color: t.textMain }}>{viewedTicket.email || "—"}</div></div>
                                                    <div><span style={{ fontSize: "12px", color: t.textSub }}>Subject</span><div style={{ fontSize: "14px", color: t.textMain }}>{viewedTicket.subject}</div></div>
                                                    <div><span style={{ fontSize: "12px", color: t.textSub }}>Status</span><div><span style={{ padding: "4px 10px", borderRadius: "100px", fontSize: "12px", fontWeight: 600, backgroundColor: (statusColor(viewedTicket.status) || "#64748b") + "20", color: statusColor(viewedTicket.status) }}>{viewedTicket.status}</span></div></div>
                                                    <div><span style={{ fontSize: "12px", color: t.textSub }}>Created</span><div style={{ fontSize: "14px", color: t.textMain }}>{viewedTicket.createdAt ? new Date(viewedTicket.createdAt).toLocaleString() : "—"}</div></div>
                                                    <div><span style={{ fontSize: "12px", color: t.textSub }}>Updated</span><div style={{ fontSize: "14px", color: t.textMain }}>{viewedTicket.updatedAt ? new Date(viewedTicket.updatedAt).toLocaleString() : "—"}</div></div>
                                                </div>
                                                {viewedTicket.description && <div style={{ marginBottom: "12px" }}><span style={{ fontSize: "12px", color: t.textSub }}>Description</span><p style={{ margin: "4px 0 0", fontSize: "14px", color: t.textMain, whiteSpace: "pre-wrap" }}>{viewedTicket.description}</p></div>}
                                                {viewedTicket.adminNotes && <div style={{ marginBottom: "12px", padding: "12px", borderRadius: "8px", backgroundColor: "#f59e0b15", border: "1px solid #f59e0b40" }}><span style={{ fontSize: "12px", color: t.textSub }}>Admin notes</span><p style={{ margin: "4px 0 0", fontSize: "14px", color: t.textMain, whiteSpace: "pre-wrap" }}>{viewedTicket.adminNotes}</p></div>}
                                            </div>
                                            <div style={{ padding: "20px", borderRadius: "12px", border: `1px solid ${t.border}`, backgroundColor: t.bg, marginBottom: "16px" }}>
                                                <h5 style={{ fontSize: "14px", fontWeight: 700, color: t.textMain, marginBottom: "12px" }}>Conversation</h5>
                                                {(Array.isArray(viewedTicket.replies) && viewedTicket.replies.length > 0) ? (
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                                        {viewedTicket.replies.map((r, i) => (
                                                            <div key={i} style={{ padding: "12px", borderRadius: "8px", backgroundColor: r.from === "organiser" ? "#3b82f615" : "#f59e0b15", borderLeft: `4px solid ${r.from === "organiser" ? "#3b82f6" : "#f59e0b"}` }}>
                                                                <span style={{ fontSize: "11px", fontWeight: 600, color: t.textSub, textTransform: "capitalize" }}>{r.from}</span>
                                                                <p style={{ margin: "4px 0 0", fontSize: "14px", color: t.textMain, whiteSpace: "pre-wrap" }}>{r.message}</p>
                                                                <span style={{ fontSize: "11px", color: t.textSub }}>{r.at ? new Date(r.at).toLocaleString() : ""}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : <p style={{ fontSize: "13px", color: t.textSub, margin: 0 }}>No replies yet.</p>}
                                            </div>
                                            <div style={{ padding: "16px", borderRadius: "12px", border: `1px solid ${t.border}`, backgroundColor: t.bg }}>
                                                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: t.textMain, marginBottom: "8px" }}>Add reply</label>
                                                <textarea value={supportTicketReplyMessage} onChange={(e) => setSupportTicketReplyMessage(e.target.value)} placeholder="Type your message..." rows={3} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: t.cardBg, color: t.textMain, fontSize: "14px", resize: "vertical", marginBottom: "10px" }} />
                                                <button type="button" onClick={() => { if (!(supportTicketReplyMessage || "").trim()) return; addReplyToTicket(viewedTicket.id, supportTicketReplyMessage); }} style={{ padding: "10px 20px", borderRadius: "8px", border: "none", backgroundColor: "#8b5cf6", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}>Send reply</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                                                <h4 style={{ fontSize: "16px", fontWeight: 600, color: t.textMain, margin: 0 }}>All Tickets</h4>
                                                <input type="text" placeholder="Search by Ticket ID" value={supportTicketSearchId} onChange={(e) => setSupportTicketSearchId(e.target.value)} style={{ padding: "8px 12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: "13px", minWidth: "180px" }} />
                                            </div>
                                            <div style={{ overflowX: "auto" }}>
                                                {filteredTickets.length === 0 ? (
                                                    <p style={{ fontSize: "13px", color: t.textSub }}>No support tickets yet. Create one with &quot;Add Ticket&quot;.</p>
                                                ) : (
                                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                                        <thead>
                                                            <tr style={{ borderBottom: `2px solid ${t.border}` }}>
                                                                <th style={{ padding: "10px 8px", width: "40px" }}>
                                                                    <input type="checkbox" checked={filteredTickets.length > 0 && selectedTicketIds.length === filteredTickets.length} onChange={toggleSelectAll} style={{ cursor: "pointer" }} />
                                                                </th>
                                                                <th style={{ textAlign: "left", padding: "10px 8px", color: t.textSub, fontWeight: 600 }}>Ticket ID</th>
                                                                <th style={{ textAlign: "left", padding: "10px 8px", color: t.textSub, fontWeight: 600 }}>Email</th>
                                                                <th style={{ textAlign: "left", padding: "10px 8px", color: t.textSub, fontWeight: 600 }}>Subject</th>
                                                                <th style={{ textAlign: "left", padding: "10px 8px", color: t.textSub, fontWeight: 600 }}>Status</th>
                                                                <th style={{ textAlign: "left", padding: "10px 8px", color: t.textSub, fontWeight: 600 }}>Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {filteredTickets.map((ticket) => (
                                                                <tr key={ticket.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                                                                    <td style={{ padding: "10px 8px" }}>
                                                                        <input type="checkbox" checked={selectedTicketIds.includes(ticket.id)} onChange={() => toggleTicketSelect(ticket.id)} style={{ cursor: "pointer" }} />
                                                                    </td>
                                                                    <td style={{ padding: "10px 8px", color: t.textMain, fontWeight: 600 }}>{ticket.ticketId ?? ticket.id}</td>
                                                                    <td style={{ padding: "10px 8px", color: t.textSub }}>{ticket.email || "—"}</td>
                                                                    <td style={{ padding: "10px 8px", color: t.textMain }}>{ticket.subject}</td>
                                                                    <td style={{ padding: "10px 8px" }}>
                                                                        <span style={{ padding: "4px 12px", borderRadius: "100px", fontSize: "12px", fontWeight: 600, backgroundColor: (statusColor(ticket.status) || "#64748b") + "20", color: statusColor(ticket.status) }}>{ticket.status}</span>
                                                                    </td>
                                                                    <td style={{ padding: "10px 8px" }}>
                                                                        <div style={{ position: "relative" }}>
                                                                            <button type="button" onClick={() => setSupportTicketSelectOpen(supportTicketSelectOpen === ticket.id ? null : ticket.id)} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 14px", borderRadius: "8px", border: "none", backgroundColor: "#8b5cf6", color: "#fff", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Select <ChevronDown size={14} /></button>
                                                                            {supportTicketSelectOpen === ticket.id && (
                                                                                <div style={{ position: "absolute", top: "100%", left: 0, marginTop: "4px", backgroundColor: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 10, minWidth: "120px" }}>
                                                                                    <button type="button" onClick={() => { setSupportTicketDetailId(ticket.id); setSupportTicketSelectOpen(null); }} style={{ display: "block", width: "100%", padding: "8px 12px", textAlign: "left", border: "none", background: "none", color: t.textMain, fontSize: "13px", cursor: "pointer" }}>View</button>
                                                                                    <button type="button" onClick={() => { setSupportTicketDetailId(ticket.id); setSupportTicketSelectOpen(null); }} style={{ display: "block", width: "100%", padding: "8px 12px", textAlign: "left", border: "none", background: "none", color: t.textMain, fontSize: "13px", cursor: "pointer" }}>Reply</button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    );
                }
                case "edit_profile": {
                    const orgTypeOptions = ["Individual", "Event Organiser", "Pvt Ltd", "Others"];
                    return (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "16px", border: `1px solid ${t.border}` }}>
                            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px", color: t.textMain }}>Edit Profile</h3>
                            <p style={{ fontSize: "13px", color: t.textSub, marginBottom: "24px" }}>Update your organiser profile details.</p>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", maxWidth: "560px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "8px", color: t.textSub }}>First Name</label>
                                    <input type="text" value={profile.firstName} onChange={(e) => setProfile(p => ({ ...p, firstName: e.target.value }))} placeholder="First name" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: "14px" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "8px", color: t.textSub }}>Last Name</label>
                                    <input type="text" value={profile.lastName} onChange={(e) => setProfile(p => ({ ...p, lastName: e.target.value }))} placeholder="Last name" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: "14px" }} />
                                </div>
                                <div style={{ gridColumn: "span 2" }}>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "8px", color: t.textSub }}>Organiser Type</label>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                                        {orgTypeOptions.map(opt => (
                                            <button key={opt} type="button" onClick={() => setProfile(p => ({ ...p, orgType: opt }))} style={{ padding: "10px 16px", borderRadius: "8px", border: `2px solid ${profile.orgType === opt ? "#3b82f6" : t.border}`, backgroundColor: profile.orgType === opt ? "#3b82f615" : "transparent", color: profile.orgType === opt ? "#3b82f6" : t.textSub, fontWeight: 600, cursor: "pointer", fontSize: "13px" }}>{opt}</button>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ gridColumn: "span 2" }}>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "8px", color: t.textSub }}>Email</label>
                                    <input type="email" value={profile.email} onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))} placeholder="organizer@example.com" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: "14px" }} />
                                </div>
                                <div style={{ gridColumn: "span 2" }}>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "8px", color: t.textSub }}>Phone</label>
                                    <input type="tel" value={profile.phone} onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+91 98765 43210" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: "14px" }} />
                                </div>
                                <div style={{ gridColumn: "span 2", display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ fontSize: "12px", fontWeight: 600, color: t.textSub }}>KYC Status</span>
                                    <span style={{ padding: "4px 12px", borderRadius: "100px", fontSize: "12px", fontWeight: 600, backgroundColor: profile.kycStatus === "KYC Approved" ? "#22c55e20" : "#f59e0b20", color: profile.kycStatus === "KYC Approved" ? "#22c55e" : "#f59e0b" }}>{profile.kycStatus}</span>
                                </div>
                                <div style={{ gridColumn: "span 2", marginTop: "8px" }}>
                                    <button type="button" onClick={() => { alert("Profile updates are currently disabled. Please contact support to change profile details."); }} style={{ padding: "12px 24px", borderRadius: "8px", border: "none", backgroundColor: "#3b82f6", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>Save changes</button>
                                </div>
                            </div>
                        </div>
                    );
                }
                case "change_password":
                    return (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "16px", border: `1px solid ${t.border}` }}>
                            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>Change Password</h3>
                            <p style={{ fontSize: "13px", color: t.textSub }}>Update your account password.</p>
                        </div>
                    );
                case "ticket_bookings":
                    return (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "16px", border: `1px solid ${t.border}` }}>
                            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>Ticket Booking Details</h3>
                            <p style={{ fontSize: "13px", color: t.textSub }}>View all ticket bookings for your events here.</p>
                            <div style={{ padding: "24px", textAlign: "center", color: t.textSub, marginTop: "20px", border: `1px dashed ${t.border}`, borderRadius: "12px" }}>
                                <Monitor size={32} style={{ marginBottom: "12px", opacity: 0.5 }} />
                                <p>No bookings found yet.</p>
                            </div>
                        </div>
                    );
                case "refund_status":
                    return (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "16px", border: `1px solid ${t.border}` }}>
                            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>Refund Status</h3>
                            <p style={{ fontSize: "13px", color: t.textSub }}>Track refund requests and their current status.</p>
                            <div style={{ padding: "24px", textAlign: "center", color: t.textSub, marginTop: "20px", border: `1px dashed ${t.border}`, borderRadius: "12px" }}>
                                <ArrowLeftRight size={32} style={{ marginBottom: "12px", opacity: 0.5 }} />
                                <p>No pending refunds.</p>
                            </div>
                        </div>
                    );
                case "ticket_details":
                    return (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "16px", border: `1px solid ${t.border}` }}>
                            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>Ticket Details</h3>
                            <p style={{ fontSize: "13px", color: t.textSub }}>Manage and view detailed information about generated tickets.</p>
                            <div style={{ padding: "24px", textAlign: "center", color: t.textSub, marginTop: "20px", border: `1px dashed ${t.border}`, borderRadius: "12px" }}>
                                <Ticket size={32} style={{ marginBottom: "12px", opacity: 0.5 }} />
                                <p>Select an event to view its tickets.</p>
                            </div>
                        </div>
                    );
                default:
                    return <div>Coming Soon</div>;
            }
        };

        return (
            <div className="admin-container">
                {styles}
                {/* Create Event Modal */}
                {showCreateEvent && (
                    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
                        <div style={{ backgroundColor: t.cardBg, padding: "32px", borderRadius: "24px", width: "100%", maxWidth: "800px", border: `1px solid ${t.border}`, maxHeight: "90vh", overflowY: "auto" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                                <h2 style={{ fontSize: "24px", fontWeight: 800, color: t.textMain }}>Create New Event</h2>
                                <button onClick={() => setShowCreateEvent(false)} style={{ background: "none", border: "none", color: t.textSub, cursor: "pointer" }}><X size={24} /></button>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                                <div style={{ gridColumn: "span 2" }}>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: t.textMain }}>Event Title</label>
                                    <input type="text" placeholder="e.g. Annual Music Festival" style={{ width: "100%", padding: "14px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: t.textMain }}>Event Type</label>
                                    <select style={{ width: "100%", padding: "14px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }}>
                                        <option>Venue Event</option><option>Virtual Event</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: t.textMain }}>Venue / Meeting Link</label>
                                    <input type="text" placeholder="Enter address or URL" style={{ width: "100%", padding: "14px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }} />
                                </div>
                                <div style={{ gridColumn: "span 2" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                        <label style={{ fontSize: "14px", fontWeight: 700, color: t.textMain }}>Schedule (Multi-Date & Time)</label>
                                        <button onClick={addDateSlot} style={{ fontSize: "12px", color: t.activeText, background: "none", border: "none", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}><Plus size={14} /> Add Slot</button>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                        {newEvent.slots.map((slot, idx) => (
                                            <div key={idx} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                                <input type="date" style={{ flex: 1, padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }} />
                                                <input type="time" style={{ flex: 1, padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }} />
                                                {newEvent.slots.length > 1 && <button onClick={() => removeDateSlot(idx)} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}><Trash2 size={18} /></button>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ gridColumn: "span 2", marginTop: "12px" }}>
                                    <button onClick={() => {
                                        const eventToSave = { ...newEvent, id: Date.now(), date: newEvent.slots[0]?.date || "TBA", time: newEvent.slots[0]?.time || "TBA", status: "Active", img: "https://images.unsplash.com/photo-1540575861501-7ad058c647a0?w=500&h=650&fit=crop" };
                                        setEvents(prev => [...prev, eventToSave]);
                                        alert("Event created successfully! It will now appear on the home page.");
                                        setShowCreateEvent(false);
                                    }} style={{ width: "100%", padding: "16px", borderRadius: "12px", backgroundColor: "#3b82f6", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>
                                        Publish Event
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* Payout Modal */}
                {showPayoutModal && (
                    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                        <div style={{ backgroundColor: t.cardBg, padding: "32px", borderRadius: "24px", width: "400px", border: `1px solid ${t.border}`, textAlign: "center" }}>
                            <div style={{ width: "60px", height: "60px", backgroundColor: "#3b82f615", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}><Wallet color="#3b82f6" size={28} /></div>
                            <h3 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px", color: t.textMain }}>Request Amount</h3>
                            <p style={{ fontSize: "14px", color: t.textSub, marginBottom: "24px" }}>Enter the amount you wish to withdraw to your linked bank account.</p>
                            <div style={{ position: "relative", marginBottom: "24px" }}>
                                <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", fontWeight: 800, fontSize: "18px", color: t.textMain }}>₹</span>
                                <input type="number" placeholder="0.00" style={{ width: "100%", padding: "14px 14px 14px 40px", borderRadius: "12px", border: `1.5px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: "20px", fontWeight: 900 }} />
                            </div>
                            <div style={{ display: "flex", gap: "12px" }}>
                                <button onClick={() => setShowPayoutModal(false)} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, background: "none", color: t.textMain, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                                <button onClick={() => { alert("Payout request submitted!"); setShowPayoutModal(false); }} style={{ flex: 1, padding: "12px", borderRadius: "10px", backgroundColor: "#3b82f6", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>Confirm</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Location Picker modal — draggable map marker */}
                {showMapModal && (
                    <LocationPickerModal
                        t={t}
                        theme={theme}
                        tempLocation={tempLocation}
                        setTempLocation={setTempLocation}
                        postEvent={postEvent}
                        setPostEvent={setPostEvent}
                        setShowMapModal={setShowMapModal}
                        isGeoLoading={isGeoLoading}
                        setIsGeoLoading={setIsGeoLoading}
                        geoError={geoError}
                        setGeoError={setGeoError}
                        mapRef={mapRef}
                        markerRef={markerRef}
                    />
                )}

                {/* Sidebar — image format: Search + dropdown sections + sub-sidebar */}
                <aside className="sidebar">
                    <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                        <Link href="/" style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "10px",
                            background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                            padding: '12px 10px',
                            borderRadius: '12px',
                            border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
                            textDecoration: "none",
                            transition: 'all 0.3s ease'
                        }}>
                            <img
                                src="/logo.png"
                                alt="Logo"
                                style={{
                                    height: "44px",
                                    objectFit: "contain",
                                    maxWidth: "100%",
                                    filter: theme === 'dark' ? 'invert(1) brightness(2)' : 'none',
                                    transition: 'filter 0.3s ease'
                                }}
                            />
                        </Link>
                    </div>
                    <div style={{ padding: "16px" }}>
                        <input
                            type="text"
                            placeholder="Search Menu Here..."
                            value={menuSearch}
                            onChange={e => setMenuSearch(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px 12px",
                                borderRadius: "8px",
                                border: `1px solid ${t.border}`,
                                backgroundColor: t.bg,
                                color: t.textMain,
                                fontSize: "13px"
                            }}
                        />
                    </div>
                    <nav style={{ flex: 1, overflowY: "auto", paddingBottom: "16px" }}>
                        <button onClick={() => setActiveTab("dashboard")} className={`sidebar-item ${activeTab === "dashboard" ? "active" : ""}`} style={{ justifyContent: "flex-start" }}>
                            <Settings size={20} /> Dashboard
                        </button>

                        {/* Custom Organiser Tabs based on user request */}
                        <button onClick={() => setActiveTab("ticket_bookings")} className={`sidebar-item ${activeTab === "ticket_bookings" ? "active" : ""}`} style={{ justifyContent: "flex-start" }}>
                            <Monitor size={20} /> Ticket Booking Details
                        </button>
                        <button onClick={() => setActiveTab("refund_status")} className={`sidebar-item ${activeTab === "refund_status" ? "active" : ""}`} style={{ justifyContent: "flex-start" }}>
                            <ArrowLeftRight size={20} /> Refund status
                        </button>
                        <button onClick={() => setActiveTab("ticket_details")} className={`sidebar-item ${activeTab === "ticket_details" ? "active" : ""}`} style={{ justifyContent: "flex-start" }}>
                            <Ticket size={20} /> Ticket Details
                        </button>


                        <button onClick={() => setActiveTab("edit_profile")} className={`sidebar-item ${activeTab === "edit_profile" ? "active" : ""}`}><Users size={20} /> Edit Profile</button>
                        <button onClick={() => setActiveTab("change_password")} className={`sidebar-item ${activeTab === "change_password" ? "active" : ""}`}><Lock size={20} /> Change Password</button>
                        <button onClick={() => { try { localStorage.removeItem("user"); } catch (_) { } router.push("/signin"); }} className="sidebar-item" style={{ color: "#ef4444", textDecoration: "none", background: "none", border: "none", cursor: "pointer", width: "100%", display: "flex", alignItems: "center", gap: "8px" }}><X size={20} /> Logout</button>
                    </nav>

                    <div style={{ padding: "16px", borderTop: `1px solid ${t.sidebarBorder}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", backgroundColor: theme === 'light' ? "#f8fafc" : "#0f172a", borderRadius: "10px" }}>
                            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(45deg, #3b82f6, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "#fff", fontSize: "13px" }}>
                                {profile.firstName ? (profile.firstName.charAt(0) + (profile.lastName?.charAt(0) || "")).toUpperCase() : "O"}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: t.textMain }}>{profile.firstName} {profile.lastName}</p>
                                <p style={{ margin: 0, fontSize: "11px", color: profile.kycStatus === "KYC Approved" ? "#22c55e" : "#f59e0b", fontWeight: 600 }}>● {profile.kycStatus || "Pending Verification"}</p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="main-content">
                    <header className="top-header">
                        <div>
                            <h1 style={{ fontSize: "20px", fontWeight: 800, color: t.textMain, margin: 0 }}>{activeTab.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</h1>
                            <p style={{ fontSize: "12px", color: t.textSub, margin: 0, opacity: 0.8 }}>Welcome back, {profile.firstName || "Organiser"}! Here's what's happening today.</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <button onClick={toggleTheme} style={{ background: t.activeLink, color: t.activeText, border: "none", padding: "8px", borderRadius: "6px", cursor: "pointer" }}>
                                {theme === 'light' ? <Sparkles size={16} /> : <ImageIcon size={16} />}
                            </button>
                            <button style={{ color: t.activeText, background: t.activeLink, border: `1px solid ${t.activeText}40`, padding: "8px 12px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", position: "relative" }}>
                                <Bell size={16} />
                                <div style={{ position: "absolute", top: "6px", right: "6px", width: "7px", height: "7px", backgroundColor: "#ef4444", borderRadius: "50%", border: `2px solid ${t.header}` }}></div>
                            </button>
                        </div>
                    </header>
                    <main style={{ padding: "24px", display: "flex", flexDirection: "column", minHeight: "calc(100vh - 64px)" }}>
                        <div style={{ flex: 1 }}>{renderTabContent()}</div>
                        <footer style={{ padding: "16px 0", marginTop: "24px", textAlign: "center", fontSize: "12px", color: t.textSub, borderTop: `1px solid ${t.border}` }}>
                            Copyright ©2026. All Rights Reserved.
                        </footer>
                    </main>
                </div>
            </div>
        );
    };

    // Restricted Sidebar for Stages (MFA/KYC/Pending)
    const renderRestrictedSidebar = (children) => (
        <div className="admin-container">
            {styles}
            <aside className="sidebar">
                <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <Link href="/" style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                        padding: '12px 10px',
                        borderRadius: '12px',
                        border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
                        textDecoration: "none",
                        transition: 'all 0.3s ease'
                    }}>
                        <img
                            src="/logo.png"
                            alt="Logo"
                            style={{
                                height: "44px",
                                objectFit: "contain",
                                maxWidth: "100%",
                                filter: theme === 'dark' ? 'invert(1) brightness(2)' : 'none',
                                transition: 'filter 0.3s ease'
                            }}
                        />
                    </Link>
                </div>

                <nav style={{ flex: 1, paddingBottom: "24px", opacity: 0.5 }}>
                    <div className="sidebar-item"><LayoutDashboard size={20} /> Dashboard (Locked)</div>
                    <div className="sidebar-item"><Calendar size={20} /> Events (Locked)</div>
                    <div className="sidebar-item"><Wallet size={20} /> Wallet (Locked)</div>
                    <div className="sidebar-item"><Users size={20} /> Profile (Locked)</div>
                </nav>

                <div style={{ marginTop: "auto", padding: "16px", opacity: 0.8 }}>
                    <div style={{ padding: "16px", backgroundColor: theme === 'light' ? "#f1f5f9" : "#0f172a", borderRadius: "16px", border: `1px solid ${t.border}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#f97316" }}></div>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: t.textMain }}>Safety Mode</span>
                        </div>
                        <p style={{ fontSize: "11px", color: t.textSub, marginTop: "8px", margin: 0 }}>Verification required</p>
                    </div>
                </div>
            </aside>
            <main className="main-content">
                <header className="top-header">
                    <div>
                        <h1 style={{ fontSize: "18px", fontWeight: 800, color: t.textMain, margin: 0 }}>Organiser Onboarding</h1>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <button onClick={toggleTheme} style={{ background: t.activeLink, color: t.activeText, border: "none", padding: "8px", borderRadius: "6px", cursor: "pointer" }}>
                            {theme === 'light' ? <Sparkles size={16} /> : <ImageIcon size={16} />}
                        </button>
                    </div>
                </header>
                <div style={{ padding: "40px" }}>{children}</div>
            </main>
        </div>
    );

    // Avoid SSR/hydration issues: only render full UI after client mount
    if (!mounted) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", color: "#94a3b8" }}>
                Loading…
            </div>
        );
    }

    // Main Stage Dispatcher
    switch (currentStage) {
        case "mfa":
            return renderRestrictedSidebar(renderMFAView());
        case "kyc_docs":
            return renderRestrictedSidebar(renderKYCDocsView());
        case "kyc_form":
            return renderRestrictedSidebar(renderKYCFormView());
        case "pending":
            return renderRestrictedSidebar(renderPendingView());
        case "approved":
            return renderDashboardView();
        default:
            return renderDashboardView();
    }
}

export default function OrganiserPage() {
    return (
        <OrganiserErrorBoundary>
            <OrganiserPanel />
        </OrganiserErrorBoundary>
    );
}
