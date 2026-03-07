"use client";
import React, { useState, useEffect, useMemo, useRef, useCallback, Component } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/AuthContext";

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
    CloudUpload, ChevronDown, ChevronRight, Monitor, ArrowLeftRight, Home, LogOut, Camera, AlertCircle, QrCode, BarChart3, Search, XCircle, UserCheck
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
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/signin");
        }
    }, [user, loading, router]);

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

    const effectiveEmail = user?.identifier || "organiser@bookmyticket.com";
    const equaliser = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();

    const organiserData = useQuery(api.organisers.get, { userId: effectiveEmail });

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
        if (convexSupportTickets.length >= 0) {
            const filtered = convexSupportTickets.filter(t => equaliser(t.userId, effectiveEmail));
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
                replies: []
            })));
        }
    }, [convexSupportTickets, effectiveEmail]);

    const convexEvents = useQuery(api.events.getOrganiserEvents, { organiserId: effectiveEmail });
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
        // Search in Convex bookings (exact or short ID match)
        const booking = convexBookings.find(b =>
            String(b._id) === rawId ||
            String(b.id) === rawId ||
            (rawId.length >= 6 && String(b._id).toUpperCase().includes(rawId.toUpperCase()))
        );
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
        // Latitude/Longitude is optional for convenience in dashboard testing
        const lat = postEvent.latitude || "0";
        const lng = postEvent.longitude || "0";
        const isSeating = postEvent.seatingEnabled !== false;
        const totalSeats = isSeating ? postEvent.rows * postEvent.cols : (parseInt(postEvent.normalTicketCapacity, 10) || 0);
        if (totalSeats <= 0) {
            alert(isSeating ? "Please set at least 1 row and 1 seat per row." : "Please set Total Capacity for normal ticketing.");
            return;
        }
        const ev = {
            ...postEvent,
            organiserId: effectiveEmail,
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
            .sidebar-logo {
                padding: 24px 16px;
                display: flex;
                align-items: center;
                gap: 12px;
                border-bottom: 1px solid ${t.sidebarBorder};
            }
            .sidebar-profile {
                padding: 16px;
                display: flex;
                align-items: center;
                gap: 12px;
                background-color: ${theme === 'light' ? '#f8fafc' : '#1f2937'};
                margin: 16px;
                border-radius: 12px;
                border: 1px solid ${t.border};
            }
            .sidebar-profile-img {
                width: 44px;
                height: 44px;
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid #3b82f6;
            }
            .sidebar-profile-info {
                flex: 1;
                min-width: 0;
            }
            .sidebar-profile-name {
                margin: 0;
                font-size: 14px;
                font-weight: 700;
                color: ${t.textMain};
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .sidebar-profile-role {
                margin: 0;
                font-size: 12px;
                color: ${t.textSub};
                font-weight: 500;
            }
            .sidebar-search {
                padding: 0 16px 16px;
            }
            .sidebar-search-input {
                width: 100%;
                padding: 10px 12px 10px 36px;
                border-radius: 8px;
                border: 1px solid ${t.border};
                background-color: ${t.bg};
                color: ${t.textMain};
                font-size: 13px;
                outline: none;
                transition: border-color 0.2s;
            }
            .sidebar-search-input:focus {
                border-color: #3b82f6;
            }
            .main-content {
                margin-left: 250px;
                flex: 1;
                display: flex;
                flex-direction: column;
                min-width: 0;
                position: relative;
            }
            .top-header {
                height: 70px;
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
                justify-content: space-between;
                padding: 12px 16px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                color: ${t.textSub};
                transition: all 0.2s;
                border: none;
                background: none;
                width: 100%;
                text-align: left;
            }
            .sidebar-item:hover {
                background-color: ${theme === 'light' ? '#f1f5f9' : '#1e293b'};
                color: ${t.textMain};
            }
            .sidebar-item.active {
                background-color: #3b82f6!important;
                color: #fff!important;
                font-weight: 600;
            }
            .sidebar-dropdown-item {
                display: flex;
                align-items: center;
                padding: 10px 16px 10px 48px;
                font-size: 13px;
                color: ${t.textSub};
                transition: all 0.2s;
                border: none;
                background: none;
                width: 100%;
                text-align: left;
                cursor: pointer;
                position: relative;
            }
            .sidebar-dropdown-item:before {
                content: '';
                position: absolute;
                left: 32px;
                top: 50%;
                width: 4px;
                height: 4px;
                background-color: ${t.border};
                border-radius: 50%;
                transform: translateY(-50%);
            }
            .sidebar-dropdown-item:hover {
                color: #3b82f6;
            }
            .sidebar-dropdown-item.active {
                color: #3b82f6;
                font-weight: 600;
                background-color: ${theme === 'light' ? '#f0f7ff' : '#1e293b'};
            }
            .stat-card {
                background-color: ${t.cardBg};
                padding: 24px;
                border-radius: 12px;
                border: 1px solid ${t.border};
                display: flex;
                flex-direction: column;
                position: relative;
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            }
            .breadcrumb {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 12px;
                color: ${t.textSub};
                margin-bottom: 24px;
            }
            .breadcrumb-item {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .breadcrumb-item:after {
                content: '>';
                margin-left: 8px;
                opacity: 0.5;
            }
            .breadcrumb-item:last-child:after {
                content: none;
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
                case "manage_events": {
                    const Breadcrumb = ({ title }) => (
                        <div className="breadcrumb" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", fontSize: "14px", color: t.textSub }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <Home size={14} />
                                <span>Events</span>
                            </div>
                            <ChevronDown size={14} style={{ transform: "rotate(-90deg)" }} />
                            <div style={{ color: "#3b82f6", fontWeight: 700 }}>{title}</div>
                        </div>
                    );

                    return (
                        <div>
                            <Breadcrumb title="All Events" />
                            <div style={{ backgroundColor: t.cardBg, padding: "32px", borderRadius: "16px", border: `1px solid ${t.border}`, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                                    <h3 style={{ fontSize: "24px", fontWeight: 800, color: t.textMain, margin: 0 }}>Active Events</h3>
                                    <button onClick={() => setActiveTab("post_event")} style={{ padding: "12px 24px", backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", transition: "0.2s" }}>
                                        <Plus size={18} /> Post New Event
                                    </button>
                                </div>
                                <div style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
                                        <thead>
                                            <tr style={{ textAlign: "left" }}>
                                                <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Event Details</th>
                                                <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Date & Time</th>
                                                <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Tickets Analytics</th>
                                                <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Status</th>
                                                <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {events.length === 0 ? (
                                                <tr><td colSpan={5} style={{ textAlign: "center", padding: "64px", color: t.textSub }}>No events found. Start by posting your first event.</td></tr>
                                            ) : events.map(ev => (
                                                <tr key={ev.id} style={{ backgroundColor: t.bg, borderRadius: "12px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                                                    <td style={{ padding: "16px", borderRadius: "12px 0 0 12px" }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                            <div style={{ width: "48px", height: "48px", borderRadius: "10px", backgroundColor: (ev.type === "Online" ? "#22c55e" : "#f97316") + "20", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                                {ev.type === "Online" ? <CloudUpload size={24} color="#22c55e" /> : <MapPin size={24} color="#f97316" />}
                                                            </div>
                                                            <div>
                                                                <p style={{ fontWeight: 800, margin: 0, fontSize: "15px", color: t.textMain }}>{ev.title}</p>
                                                                <p style={{ fontSize: "12px", color: t.textSub, margin: "2px 0 0" }}>{ev.venue || "Online"}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: "16px" }}>
                                                        <div style={{ fontSize: "14px", fontWeight: 700, color: t.textMain }}>{ev.date}</div>
                                                        <div style={{ fontSize: "12px", color: t.textSub, marginTop: "2px" }}>{ev.time}</div>
                                                    </td>
                                                    <td style={{ padding: "16px" }}>
                                                        {ev.totalSeats ? (
                                                            <div style={{ minWidth: "140px" }}>
                                                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                                                    <span style={{ fontSize: "12px", fontWeight: 700, color: t.textMain }}>{ev.totalSeats - (ev.bookedSeats || 0)} <span style={{ color: t.textSub, fontWeight: 400 }}>Available</span></span>
                                                                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#3b82f6" }}>{Math.round(((ev.bookedSeats || 0) / ev.totalSeats) * 100)}%</span>
                                                                </div>
                                                                <div style={{ height: 6, borderRadius: 10, background: t.border, overflow: "hidden" }}>
                                                                    <div style={{ height: "100%", width: `${Math.min(100, ((ev.bookedSeats || 0) / ev.totalSeats) * 100)}%`, background: "linear-gradient(90deg, #3b82f6, #6366f1)", borderRadius: 10 }} />
                                                                </div>
                                                            </div>
                                                        ) : <span style={{ color: t.textSub, fontSize: 13 }}>Standard Admission</span>}
                                                    </td>
                                                    <td style={{ padding: "16px" }}>
                                                        <span style={{ padding: "6px 14px", borderRadius: "100px", fontSize: "11px", fontWeight: 800, backgroundColor: "#22c55e20", color: "#22c55e" }}>ACTIVE</span>
                                                    </td>
                                                    <td style={{ padding: "16px", borderRadius: "0 12px 12px 0" }}>
                                                        <div style={{ display: "flex", gap: "8px" }}>
                                                            {ev.seatingEnabled !== false && (
                                                                <button onClick={() => { setSelectedEventForSeatMap(ev); setActiveTab("seat_map"); }} style={{ border: "none", background: "#6366f120", color: "#6366f1", padding: "8px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                                                                    <Grid size={14} /> Map
                                                                </button>
                                                            )}
                                                            <button onClick={() => { if (confirm("Delete this event?")) deleteEventMutation({ id: ev.id }).catch(e => console.error(e)); }} style={{ border: `1px solid ${t.border}`, background: t.cardBg, color: "#ef4444", padding: "8px", borderRadius: "8px", cursor: "pointer" }}>
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    );
                }
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
                    const Breadcrumb = ({ title }) => (
                        <div className="breadcrumb" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", fontSize: "14px", color: t.textSub }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <Home size={14} />
                                <span>Events</span>
                            </div>
                            <ChevronDown size={14} style={{ transform: "rotate(-90deg)" }} />
                            <div style={{ color: "#3b82f6", fontWeight: 700 }}>{title}</div>
                        </div>
                    );

                    return (
                        <div>
                            <Breadcrumb title="Venue Events" />
                            <div style={{ backgroundColor: t.cardBg, padding: "32px", borderRadius: "16px", border: `1px solid ${t.border}`, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                                    <h3 style={{ fontSize: "24px", fontWeight: 800, color: t.textMain, margin: 0 }}>Venue Base Events</h3>
                                    <div style={{ padding: "8px 16px", borderRadius: "8px", backgroundColor: "#f9731615", border: "1px solid #f9731630", fontSize: "14px", fontWeight: 700, color: "#f97316" }}>
                                        Total: {venueEvents.length}
                                    </div>
                                </div>
                                <div style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
                                        <thead>
                                            <tr style={{ textAlign: "left" }}>
                                                <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Venue Details</th>
                                                <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Schedule</th>
                                                <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Capacity</th>
                                                <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Status</th>
                                                <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {venueEvents.length === 0 ? (
                                                <tr><td colSpan={5} style={{ textAlign: "center", padding: "64px", color: t.textSub }}>No venue events found. Choose &quot;Venue Event&quot; when posting.</td></tr>
                                            ) : venueEvents.map(ev => (
                                                <tr key={ev.id} style={{ backgroundColor: t.bg, borderRadius: "12px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                                                    <td style={{ padding: "16px", borderRadius: "12px 0 0 12px" }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                            <div style={{ width: "48px", height: "48px", borderRadius: "10px", backgroundColor: "#f9731620", display: "flex", alignItems: "center", justifyContent: "center" }}><MapPin size={24} color="#f97316" /></div>
                                                            <div>
                                                                <p style={{ fontWeight: 800, margin: 0, fontSize: "15px", color: t.textMain }}>{ev.title}</p>
                                                                <p style={{ fontSize: "12px", color: t.textSub, margin: "2px 0 0" }}>{ev.venue || "—"}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: "16px" }}>
                                                        <div style={{ fontSize: "14px", fontWeight: 700, color: t.textMain }}>{ev.date || "—"}</div>
                                                        <div style={{ fontSize: "12px", color: t.textSub }}>{ev.time || "—"}</div>
                                                    </td>
                                                    <td style={{ padding: "16px" }}>
                                                        <div style={{ fontSize: "14px", fontWeight: 700, color: t.textMain }}>{ev.totalSeats || "N/A"}</div>
                                                        <div style={{ fontSize: "11px", color: t.textSub }}>Total Capacity</div>
                                                    </td>
                                                    <td style={{ padding: "16px" }}>
                                                        <span style={{ padding: "6px 14px", borderRadius: "100px", fontSize: "11px", fontWeight: 800, backgroundColor: "#22c55e20", color: "#22c55e" }}>ACTIVE</span>
                                                    </td>
                                                    <td style={{ padding: "16px", borderRadius: "0 12px 12px 0" }}>
                                                        <div style={{ display: "flex", gap: "8px" }}>
                                                            {ev.seatingEnabled !== false && (
                                                                <button onClick={() => { setSelectedEventForSeatMap(ev); setActiveTab("seat_map"); }} style={{ border: "none", background: "#6366f120", color: "#6366f1", padding: "8px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Seat Map</button>
                                                            )}
                                                            <button onClick={() => { if (confirm("Delete?")) deleteEventMutation({ id: ev.id }); }} style={{ border: `1px solid ${t.border}`, background: t.cardBg, color: "#ef4444", padding: "8px", borderRadius: "8px", cursor: "pointer" }}><Trash2 size={16} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    );
                }
                case "online_events": {
                    const onlineEvents = events.filter(ev => ev.type === "Online");
                    const Breadcrumb = ({ title }) => (
                        <div className="breadcrumb" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", fontSize: "14px", color: t.textSub }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <Home size={14} />
                                <span>Events</span>
                            </div>
                            <ChevronDown size={14} style={{ transform: "rotate(-90deg)" }} />
                            <div style={{ color: "#3b82f6", fontWeight: 700 }}>{title}</div>
                        </div>
                    );

                    return (
                        <div>
                            <Breadcrumb title="Online Events" />
                            <div style={{ backgroundColor: t.cardBg, padding: "32px", borderRadius: "16px", border: `1px solid ${t.border}`, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                                    <h3 style={{ fontSize: "24px", fontWeight: 800, color: t.textMain, margin: 0 }}>Online & Virtual Events</h3>
                                    <div style={{ padding: "8px 16px", borderRadius: "8px", backgroundColor: "#22c55e15", border: "1px solid #22c55e30", fontSize: "14px", fontWeight: 700, color: "#22c55e" }}>
                                        Total: {onlineEvents.length}
                                    </div>
                                </div>
                                <div style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
                                        <thead>
                                            <tr style={{ textAlign: "left" }}>
                                                <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Stream Details</th>
                                                <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Broadcasting</th>
                                                <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Attendees</th>
                                                <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Status</th>
                                                <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {onlineEvents.length === 0 ? (
                                                <tr><td colSpan={5} style={{ textAlign: "center", padding: "64px", color: t.textSub }}>No online events found. Select &quot;Online Event&quot; when posting.</td></tr>
                                            ) : onlineEvents.map(ev => (
                                                <tr key={ev.id} style={{ backgroundColor: t.bg, borderRadius: "12px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                                                    <td style={{ padding: "16px", borderRadius: "12px 0 0 12px" }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                            <div style={{ width: "48px", height: "48px", borderRadius: "10px", backgroundColor: "#22c55e20", display: "flex", alignItems: "center", justifyContent: "center" }}><CloudUpload size={24} color="#22c55e" /></div>
                                                            <div>
                                                                <p style={{ fontWeight: 800, margin: 0, fontSize: "15px", color: t.textMain }}>{ev.title}</p>
                                                                <p style={{ fontSize: "12px", color: t.textSub, margin: "2px 0 0" }}>Virtual Platform</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: "16px" }}>
                                                        <div style={{ fontSize: "14px", fontWeight: 700, color: t.textMain }}>{ev.date || "—"}</div>
                                                        <div style={{ fontSize: "12px", color: t.textSub }}>{ev.time || "—"}</div>
                                                    </td>
                                                    <td style={{ padding: "16px" }}>
                                                        <div style={{ fontSize: "14px", fontWeight: 700, color: t.textMain }}>{ev.bookedSeats || 0}</div>
                                                        <div style={{ fontSize: "11px", color: t.textSub }}>Registered Users</div>
                                                    </td>
                                                    <td style={{ padding: "16px" }}>
                                                        <span style={{ padding: "6px 14px", borderRadius: "100px", fontSize: "11px", fontWeight: 800, backgroundColor: "#3b82f620", color: "#3b82f6" }}>STREAMING SOON</span>
                                                    </td>
                                                    <td style={{ padding: "16px", borderRadius: "0 12px 12px 0" }}>
                                                        <div style={{ display: "flex", gap: "8px" }}>
                                                            <button style={{ border: "none", background: "#3b82f620", color: "#3b82f6", padding: "8px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Manage Link</button>
                                                            <button onClick={() => { if (confirm("Delete?")) deleteEventMutation({ id: ev.id }); }} style={{ border: `1px solid ${t.border}`, background: t.cardBg, color: "#ef4444", padding: "8px", borderRadius: "8px", cursor: "pointer" }}><Trash2 size={16} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    );
                }
                case "all_bookings":
                case "completed_bookings":
                case "pending_bookings":
                case "rejected_bookings":
                case "booking_report":
                case "event_bookings": {
                    const statusFilter =
                        activeTab === "completed_bookings" ? "Confirmed" :
                            activeTab === "pending_bookings" ? "Pending" :
                                activeTab === "rejected_bookings" ? "Cancelled" :
                                    "all";

                    const myEventIds = new Set(events.map(e => String(e.id)));
                    const myBookings = convexBookings.filter(b => myEventIds.has(String(b.eventId)));
                    const filtered = (statusFilter === "all" || activeTab === "all_bookings" || activeTab === "event_bookings") ? myBookings : myBookings.filter(b => b.status === statusFilter);

                    const viewTitle =
                        activeTab === "completed_bookings" ? "Completed Bookings" :
                            activeTab === "pending_bookings" ? "Pending Bookings" :
                                activeTab === "rejected_bookings" ? "Rejected Bookings" :
                                    activeTab === "booking_report" ? "Booking Report" :
                                        "All Bookings";

                    const Breadcrumb = ({ title }) => (
                        <div className="breadcrumb" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", fontSize: "14px", color: t.textSub }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <Home size={14} />
                                <span>Bookings</span>
                            </div>
                            <ChevronDown size={14} style={{ transform: "rotate(-90deg)" }} />
                            <div style={{ color: "#3b82f6", fontWeight: 700 }}>{title}</div>
                        </div>
                    );

                    return (
                        <div>
                            <Breadcrumb title={viewTitle} />
                            <div style={{ backgroundColor: t.cardBg, padding: "32px", borderRadius: "16px", border: `1px solid ${t.border}`, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                                    <h3 style={{ fontSize: "24px", fontWeight: 800, color: t.textMain, margin: 0 }}>{viewTitle}</h3>
                                    {activeTab !== "booking_report" && (
                                        <div style={{ display: "flex", gap: "12px" }}>
                                            <div style={{ padding: "8px 16px", borderRadius: "8px", backgroundColor: t.bg, border: `1px solid ${t.border}`, fontSize: "14px", color: t.textSub }}>
                                                Total Bookings: <span style={{ fontWeight: 800, color: t.textMain }}>{filtered.length}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {activeTab === "booking_report" ? (
                                    <div style={{ padding: "64px 32px", textAlign: "center", backgroundColor: t.bg, borderRadius: "12px", border: `1px dashed ${t.border}` }}>
                                        <BarChart3 size={64} style={{ marginBottom: "24px", color: "#3b82f6", opacity: 0.8 }} />
                                        <h4 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "12px" }}>Detailed Booking Analytics</h4>
                                        <p style={{ color: t.textSub, maxWidth: "400px", margin: "0 auto", lineHeight: 1.6 }}>Track your ticket sales performance, peak booking hours, and customer demographics with our advanced reporting tools.</p>
                                        <button style={{ marginTop: "32px", padding: "12px 24px", borderRadius: "10px", backgroundColor: "#3b82f6", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>Generate Full Report</button>
                                    </div>
                                ) : (
                                    <div style={{ overflowX: "auto" }}>
                                        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
                                            <thead>
                                                <tr style={{ textAlign: "left" }}>
                                                    <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Order ID</th>
                                                    <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Event Name</th>
                                                    <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Customer Details</th>
                                                    <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Tickets</th>
                                                    <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Amount</th>
                                                    <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filtered.length === 0 ? (
                                                    <tr><td colSpan={6} style={{ textAlign: "center", padding: "64px", color: t.textSub }}>No {statusFilter.toLowerCase()} bookings found.</td></tr>
                                                ) : filtered.map(b => (
                                                    <tr key={b._id} style={{ backgroundColor: t.bg, borderRadius: "12px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                                                        <td style={{ padding: "20px 16px", borderRadius: "12px 0 0 12px", fontSize: "13px", fontWeight: 800 }}>#{b._id.slice(-8).toUpperCase()}</td>
                                                        <td style={{ padding: "20px 16px", fontSize: "14px", fontWeight: 600 }}>{b.eventName || "—"}</td>
                                                        <td style={{ padding: "20px 16px" }}>
                                                            <div style={{ fontSize: "14px", fontWeight: 600 }}>{b.userName || "Guest User"}</div>
                                                            <div style={{ fontSize: "12px", color: t.textSub }}>{b.userId}</div>
                                                        </td>
                                                        <td style={{ padding: "20px 16px", fontSize: "14px", fontWeight: 700 }}>{b.ticketCount}</td>
                                                        <td style={{ padding: "20px 16px", fontSize: "15px", fontWeight: 800, color: "#22c55e" }}>₹{b.totalPrice.toLocaleString()}</td>
                                                        <td style={{ padding: "20px 16px", borderRadius: "0 12px 12px 0" }}>
                                                            <span style={{
                                                                padding: "6px 14px",
                                                                borderRadius: "100px",
                                                                fontSize: "11px",
                                                                fontWeight: 800,
                                                                backgroundColor: b.status === "Confirmed" ? "#22c55e20" : b.status === "Pending" ? "#f59e0b20" : "#ef444420",
                                                                color: b.status === "Confirmed" ? "#22c55e" : b.status === "Pending" ? "#f59e0b" : "#ef4444"
                                                            }}>
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
                        </div>
                    );
                }
                case "withdraw": {
                    const Breadcrumb = ({ title }) => (
                        <div className="breadcrumb" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", fontSize: "14px", color: t.textSub }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <Home size={14} />
                                <span>Wallet</span>
                            </div>
                            <ChevronDown size={14} style={{ transform: "rotate(-90deg)" }} />
                            <div style={{ color: "#3b82f6", fontWeight: 700 }}>{title}</div>
                        </div>
                    );

                    return (
                        <div>
                            <Breadcrumb title="Withdrawal" />
                            <div style={{ backgroundColor: t.cardBg, padding: "32px", borderRadius: "16px", border: `1px solid ${t.border}`, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
                                <div style={{ marginBottom: "32px" }}>
                                    <h3 style={{ fontSize: "24px", fontWeight: 800, color: t.textMain, margin: 0 }}>Funds Withdrawal</h3>
                                    <p style={{ fontSize: "14px", color: t.textSub, marginTop: "4px" }}>Request withdrawals to your linked bank account. Minimum balance Required: ₹500.</p>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
                                    <div style={{ padding: "32px", borderRadius: "20px", background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)", color: "#fff", boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3)" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                            <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, opacity: 0.9 }}>Available for Withdrawal</p>
                                            <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}><Wallet size={24} /></div>
                                        </div>
                                        <p style={{ margin: 0, fontSize: "42px", fontWeight: 900 }}>₹{wallet.balance.toLocaleString()}</p>
                                        <button onClick={() => setShowPayoutModal(true)} style={{ marginTop: "32px", width: "100%", padding: "16px", borderRadius: "12px", border: "none", backgroundColor: "#fff", color: "#3b82f6", fontWeight: 800, cursor: "pointer", fontSize: "15px", transition: "0.2s" }}>Request Payout</button>
                                    </div>
                                    <div style={{ padding: "32px", borderRadius: "20px", border: `1px solid ${t.border}`, backgroundColor: t.bg }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                            <h4 style={{ fontSize: "16px", fontWeight: 800, color: t.textMain, margin: 0 }}>Linked Bank Account</h4>
                                            <div style={{ padding: "6px 12px", borderRadius: "100px", backgroundColor: "#22c55e20", color: "#22c55e", fontSize: "11px", fontWeight: 800 }}>PRIMARY</div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "20px", backgroundColor: t.cardBg, borderRadius: "12px", border: `1px solid ${t.border}` }}>
                                            <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: theme === "light" ? "#f1f5f9" : "#1e293b", display: "flex", alignItems: "center", justifyContent: "center" }}><Building size={24} style={{ color: t.textSub }} /></div>
                                            <div>
                                                <p style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: t.textMain }}>HDFC Bank ···· 4242</p>
                                                <p style={{ margin: 0, fontSize: "12px", color: t.textSub }}>Account Verified by Admin</p>
                                            </div>
                                        </div>
                                        <button style={{ marginTop: "24px", width: "100%", border: `1px solid ${t.border}`, background: t.cardBg, color: t.textMain, padding: "12px", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>Change Settlement Account</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }
                case "transactions": {
                    const myEventIds = new Set(events.map(e => String(e.id)));
                    const myBookings = convexBookings.filter(b => myEventIds.has(String(b.eventId)));
                    const Breadcrumb = ({ title }) => (
                        <div className="breadcrumb" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", fontSize: "14px", color: t.textSub }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <Home size={14} />
                                <span>Wallet</span>
                            </div>
                            <ChevronDown size={14} style={{ transform: "rotate(-90deg)" }} />
                            <div style={{ color: "#3b82f6", fontWeight: 700 }}>{title}</div>
                        </div>
                    );

                    return (
                        <div>
                            <Breadcrumb title="Transaction History" />
                            <div style={{ backgroundColor: t.cardBg, padding: "32px", borderRadius: "16px", border: `1px solid ${t.border}`, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                                    <div>
                                        <h3 style={{ fontSize: "24px", fontWeight: 800, color: t.textMain, margin: 0 }}>Transactions</h3>
                                        <p style={{ fontSize: "14px", color: t.textSub, marginTop: "4px" }}>View your earnings and payout history.</p>
                                    </div>
                                    <div style={{ padding: "8px 16px", borderRadius: "8px", backgroundColor: "#3b82f615", border: "1px solid #3b82f630", fontSize: "14px", fontWeight: 700, color: "#3b82f6" }}>
                                        Total: {myBookings.length}
                                    </div>
                                </div>

                                <div style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
                                        <thead>
                                            <tr style={{ textAlign: "left" }}>
                                                <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Reference</th>
                                                <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Date</th>
                                                <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Type</th>
                                                <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Description</th>
                                                <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Amount</th>
                                                <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {myBookings.length === 0 ? (
                                                <tr><td colSpan={6} style={{ textAlign: "center", padding: "64px", color: t.textSub }}>No transactions yet.</td></tr>
                                            ) : myBookings.sort((a, b) => b._creationTime - a._creationTime).map(b => (
                                                <tr key={b._id} style={{ backgroundColor: t.bg, borderRadius: "12px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                                                    <td style={{ padding: "16px", borderRadius: "12px 0 0 12px", fontSize: "13px", fontWeight: 700, color: t.textSub }}>#{b._id.slice(-8).toUpperCase()}</td>
                                                    <td style={{ padding: "16px", fontSize: "14px" }}>{new Date(b._creationTime).toLocaleDateString()}</td>
                                                    <td style={{ padding: "16px" }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                            <div style={{ width: "24px", height: "24px", borderRadius: "6px", backgroundColor: "#22c55e20", display: "flex", alignItems: "center", justifyContent: "center" }}><Ticket size={14} color="#22c55e" /></div>
                                                            <span style={{ fontSize: "14px", fontWeight: 600 }}>Ticket Sale</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: "16px", fontSize: "14px", color: t.textMain, fontWeight: 600 }}>{b.eventName || "Event Ticket"} <span style={{ color: t.textSub, fontWeight: 400 }}>(x{b.ticketCount})</span></td>
                                                    <td style={{ padding: "16px", fontSize: "15px", fontWeight: 800, color: "#22c55e" }}>+₹{b.totalPrice.toLocaleString()}</td>
                                                    <td style={{ padding: "16px", borderRadius: "0 12px 12px 0" }}>
                                                        <span style={{ padding: "6px 14px", borderRadius: "100px", fontSize: "11px", fontWeight: 800, backgroundColor: "#22c55e20", color: "#22c55e" }}>COMPLETED</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    );
                }
                case "pwa_scanner": {
                    const Breadcrumb = ({ title }) => (
                        <div className="breadcrumb" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", fontSize: "14px", color: t.textSub }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <Home size={14} />
                                <span>Tools</span>
                            </div>
                            <ChevronDown size={14} style={{ transform: "rotate(-90deg)" }} />
                            <div style={{ color: "#3b82f6", fontWeight: 700 }}>{title}</div>
                        </div>
                    );

                    const myEventIds = new Set(events.map(e => String(e.id)));
                    const myBookings = convexBookings.filter(b => myEventIds.has(String(b.eventId)));
                    const recentScans = myBookings.filter(b => b.scanned).sort((a, b) => new Date(b.scannedAt || b._creationTime).getTime() - new Date(a.scannedAt || a._creationTime).getTime()).reverse();

                    return (
                        <div>
                            <Breadcrumb title="PWA Ticket Scanner" />
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "32px", alignItems: "start", marginBottom: "32px" }}>
                                <div style={{ backgroundColor: t.cardBg, padding: "32px", borderRadius: "16px", border: `1px solid ${t.border}`, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
                                    <div style={{ marginBottom: "32px" }}>
                                        <h3 style={{ fontSize: "24px", fontWeight: 800, color: t.textMain, margin: 0 }}>Ticket Validation</h3>
                                        <p style={{ fontSize: "14px", color: t.textSub, marginTop: "4px" }}>Scan QR code or enter Booking ID manually to check-in attendees.</p>
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                                        <div style={{ padding: "24px", borderRadius: "12px", backgroundColor: "#3b82f610", border: "1px dashed #3b82f640", textAlign: "center" }}>
                                            <button
                                                type="button"
                                                onClick={() => setPwaCameraOpen(true)}
                                                style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "16px 28px", borderRadius: "12px", border: "none", backgroundColor: "#3b82f6", color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: "15px", boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)" }}
                                            >
                                                <Camera size={22} /> Launch Camera Scanner
                                            </button>
                                            {typeof window !== "undefined" && typeof BarcodeDetector === "undefined" && (
                                                <p style={{ fontSize: "12px", color: t.textSub, margin: "12px 0 0" }}>Native scanner requires Chrome (Android/Desktop). Use manual entry if unavailable.</p>
                                            )}
                                        </div>

                                        {pwaCameraOpen && (
                                            <div style={{ padding: "24px", borderRadius: "16px", backgroundColor: theme === "light" ? "#f8fafc" : "#0f172a", border: `2px solid #3b82f6` }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                                    <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: t.textMain }}>Scanner Active</p>
                                                    <button type="button" onClick={() => setPwaCameraOpen(false)} style={{ background: "none", border: "none", color: "#ef4444", fontWeight: 700, cursor: "pointer", fontSize: "13px" }}>Close Camera</button>
                                                </div>
                                                <div style={{ position: "relative", width: "100%", maxWidth: "400px", margin: "0 auto", borderRadius: "12px", overflow: "hidden", backgroundColor: "#000", aspectRatio: "1", boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.2)" }}>
                                                    <video ref={pwaVideoRef} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
                                                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "70%", height: "70%", border: "2px solid #3b82f6", borderRadius: "20px", boxShadow: "0 0 0 4000px rgba(0,0,0,0.5)" }}></div>
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <label style={{ display: "block", fontSize: "13px", fontWeight: 800, color: t.textSub, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>Manual Validation</label>
                                            <div style={{ display: "flex", gap: "12px" }}>
                                                <input
                                                    type="text"
                                                    placeholder="Enter Booking ID (e.g. ORD-123456...)"
                                                    value={pwaScanInput}
                                                    onChange={(e) => { setPwaScanInput(e.target.value); setPwaScanResult(null); }}
                                                    style={{ flex: 1, padding: "14px 16px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: "15px", outline: "none", fontWeight: 600 }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => validateBookingId(pwaScanInput)}
                                                    style={{ padding: "14px 24px", borderRadius: "10px", border: "none", backgroundColor: "#3b82f6", color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: "14px" }}
                                                >
                                                    Validate
                                                </button>
                                            </div>
                                        </div>

                                        {pwaScanResult && (
                                            <div style={{ padding: "24px", borderRadius: "16px", border: "1px solid", backgroundColor: pwaScanResult.status === "valid" ? "#22c55e10" : pwaScanResult.status === "already_used" ? "#f59e0b10" : "#ef444410", borderColor: pwaScanResult.status === "valid" ? "#22c55e40" : pwaScanResult.status === "already_used" ? "#f59e0b40" : "#ef444440" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                                                    <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: pwaScanResult.status === "valid" ? "#22c55e20" : pwaScanResult.status === "already_used" ? "#f59e0b20" : "#ef444420", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        {pwaScanResult.status === "valid" ? <CheckCircle size={24} color="#22c55e" /> : pwaScanResult.status === "already_used" ? <AlertCircle size={24} color="#f59e0b" /> : <XCircle size={24} color="#ef4444" />}
                                                    </div>
                                                    <div>
                                                        <p style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: pwaScanResult.status === "valid" ? "#22c55e" : pwaScanResult.status === "already_used" ? "#f59e0b" : "#ef4444" }}>
                                                            {pwaScanResult.status === "valid" ? "Verified Successfully" : pwaScanResult.status === "already_used" ? "Already Checked In" : "Invalid Ticket ID"}
                                                        </p>
                                                        <p style={{ margin: "2px 0 0", fontSize: "13px", color: t.textSub }}>{pwaScanResult.status === "valid" ? "Attendee can proceed" : "Access Denied"}</p>
                                                    </div>
                                                </div>
                                                {pwaScanResult.booking && (
                                                    <div style={{ padding: "16px", backgroundColor: t.cardBg, borderRadius: "12px", border: `1px solid ${t.border}` }}>
                                                        <div style={{ fontSize: "14px", fontWeight: 800, color: t.textMain }}>{pwaScanResult.booking.eventName}</div>
                                                        <div style={{ fontSize: "12px", color: t.textSub, marginTop: "4px" }}>Attendee ID: {pwaScanResult.booking.userId}</div>
                                                        <div style={{ fontSize: "12px", color: t.textSub }}>Quantity: {pwaScanResult.booking.ticketCount} Ticket(s)</div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ backgroundColor: t.cardBg, padding: "32px", borderRadius: "16px", border: `1px solid ${t.border}`, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
                                    <h4 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "20px", color: t.textMain }}>Check-in Guide</h4>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                        {[
                                            { icon: <QrCode size={18} />, title: "Digital Tickets", desc: "Attendees should show the QR code from their mobile app." },
                                            { icon: <Search size={18} />, title: "Manual Search", desc: "If camera fails, enter the Booking ID found below the QR code." },
                                            { icon: <UserCheck size={18} />, title: "Single Entry", desc: "Tickets are invalidated immediately after successful scan." }
                                        ].map((item, i) => (
                                            <div key={i} style={{ display: "flex", gap: "16px" }}>
                                                <div style={{ color: "#3b82f6" }}>{item.icon}</div>
                                                <div>
                                                    <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: t.textMain }}>{item.title}</p>
                                                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: t.textSub, lineHeight: 1.5 }}>{item.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div style={{ backgroundColor: t.cardBg, padding: "32px", borderRadius: "16px", border: `1px solid ${t.border}`, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                    <h3 style={{ fontSize: "20px", fontWeight: 800, color: t.textMain, margin: 0 }}>Recent Scans</h3>
                                    <div style={{ padding: "6px 16px", borderRadius: "100px", backgroundColor: "#22c55e20", color: "#22c55e", fontSize: "13px", fontWeight: 700 }}>
                                        {recentScans.length} Checked-In
                                    </div>
                                </div>

                                <div style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
                                        <thead>
                                            <tr style={{ textAlign: "left" }}>
                                                <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Ticket ID</th>
                                                <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Event</th>
                                                <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Attendee</th>
                                                <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentScans.length === 0 ? (
                                                <tr><td colSpan={4} style={{ textAlign: "center", padding: "48px", color: t.textSub }}>No tickets scanned yet.</td></tr>
                                            ) : recentScans.map(b => (
                                                <tr key={b._id} style={{ backgroundColor: t.bg, borderRadius: "12px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                                                    <td style={{ padding: "16px", borderRadius: "12px 0 0 12px", fontSize: "13px", fontWeight: 700, color: t.textSub }}>#{b._id.slice(-8).toUpperCase()}</td>
                                                    <td style={{ padding: "16px", fontSize: "14px", fontWeight: 600 }}>{b.eventName || "—"}</td>
                                                    <td style={{ padding: "16px" }}>
                                                        <div style={{ fontSize: "14px", fontWeight: 600 }}>{b.userName || "Guest User"}</div>
                                                        <div style={{ fontSize: "12px", color: t.textSub }}>{b.customerEmail || b.userId}</div>
                                                    </td>
                                                    <td style={{ padding: "16px", borderRadius: "0 12px 12px 0" }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#22c55e", fontSize: "13px", fontWeight: 700 }}>
                                                            <CheckCircle size={16} /> Authenticated
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    );
                }
                case "support_tickets": {
                    const TICKET_STATUSES = ["Open", "Pending", "On-Hold", "In-Progress", "Resolved", "Closed"];
                    const statusColor = (s) => ({ Open: "#22c55e", Pending: "#7dd3fc", "On-Hold": "#8b5cf6", "In-Progress": "#06b6d4", Resolved: "#22c55e", Closed: "#ef4444" }[s] || "#64748b");
                    const filteredTickets = supportTicketSearchId.trim() ? supportTicketsList.filter(t => String(t.ticketId || t.id || "").toLowerCase().includes(supportTicketSearchId.trim().toLowerCase())) : supportTicketsList;
                    const toggleTicketSelect = (id) => setSelectedTicketIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
                    const toggleSelectAll = () => { if (selectedTicketIds.length >= filteredTickets.length) setSelectedTicketIds([]); else setSelectedTicketIds(filteredTickets.map(t => t.id)); };
                    const viewedTicket = supportTicketDetailId ? supportTicketsList.find(t => t.id === supportTicketDetailId) : null;
                    const addReplyToTicket = (ticketId, message) => {
                        const list = supportTicketsList.map(t => t.id !== ticketId ? t : { ...t, replies: [...(Array.isArray(t.replies) ? t.replies : []), { from: "organiser", message: (message || "").trim(), at: new Date().toISOString() }], updatedAt: new Date().toISOString() });
                        setSupportTicketsList(list);
                        setSupportTicketReplyMessage("");
                    };

                    const Breadcrumb = ({ title }) => (
                        <div className="breadcrumb">
                            <div className="breadcrumb-item">
                                <Home size={14} />
                                <span>Support Tickets</span>
                            </div>
                            <div className="breadcrumb-item" style={{ color: "#3b82f6", fontWeight: 700 }}>{title}</div>
                        </div>
                    );

                    return (
                        <div>
                            <Breadcrumb title={supportTab === "all_tickets" ? "All Tickets" : "Add Ticket"} />
                            <div style={{ backgroundColor: t.cardBg, padding: "32px", borderRadius: "16px", border: `1px solid ${t.border}`, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                                    <h3 style={{ fontSize: "24px", fontWeight: 800, color: t.textMain, margin: 0 }}>{supportTab === "all_tickets" ? "All Tickets" : "Add Ticket"}</h3>
                                </div>

                                {supportTab === "add_ticket" && (
                                    <div style={{ maxWidth: "800px" }}>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
                                            <div>
                                                <label style={{ display: "block", fontSize: "14px", fontWeight: 700, color: t.textMain, marginBottom: "8px" }}>Email <span style={{ color: "#ef4444" }}>*</span></label>
                                                <input type="email" value={supportTicketForm.email || profile?.email || ""} onChange={(e) => setSupportTicketForm(f => ({ ...f, email: e.target.value }))} placeholder="Enter Email" style={{ width: "100%", padding: "14px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: "14px", outline: "none" }} />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "14px", fontWeight: 700, color: t.textMain, marginBottom: "8px" }}>Subject <span style={{ color: "#ef4444" }}>*</span></label>
                                                <input type="text" placeholder="Enter Subject" value={supportTicketForm.subject} onChange={(e) => setSupportTicketForm(f => ({ ...f, subject: e.target.value }))} style={{ width: "100%", padding: "14px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: "14px", outline: "none" }} />
                                            </div>
                                            <div style={{ gridColumn: "span 2" }}>
                                                <label style={{ display: "block", fontSize: "14px", fontWeight: 700, color: t.textMain, marginBottom: "8px" }}>Description</label>
                                                <textarea placeholder="Enter Description" value={supportTicketForm.description} onChange={(e) => setSupportTicketForm(f => ({ ...f, description: e.target.value }))} rows={6} style={{ width: "100%", padding: "14px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: "14px", resize: "vertical", outline: "none" }} />
                                            </div>
                                            <div style={{ gridColumn: "span 2" }}>
                                                <label style={{ display: "block", fontSize: "14px", fontWeight: 700, color: t.textMain, marginBottom: "12px" }}>Attachment</label>
                                                <div style={{ padding: "32px", border: `2px dashed ${t.border}`, borderRadius: "12px", textAlign: "center", cursor: "pointer", position: "relative" }}>
                                                    <Upload size={32} style={{ color: t.textSub, marginBottom: "12px" }} />
                                                    <p style={{ margin: 0, fontSize: "14px", color: t.textMain, fontWeight: 600 }}>Click to upload or drag & drop</p>
                                                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: t.textSub }}>Upload only ZIP Files, Max File Size is 20 MB</p>
                                                    <input type="file" accept=".zip" style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; setSupportTicketForm(prev => ({ ...prev, attachmentFileName: f.name })); }} />
                                                    {supportTicketForm.attachmentFileName && <p style={{ marginTop: "12px", fontSize: "13px", color: "#3b82f6", fontWeight: 700 }}>{supportTicketForm.attachmentFileName}</p>}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: "12px" }}>
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    const sub = (supportTicketForm.subject || "").trim();
                                                    const desc = (supportTicketForm.description || "").trim();
                                                    if (!sub) {
                                                        alert("Please fill in subject.");
                                                        return;
                                                    }
                                                    await createTicketMutation({
                                                        userId: effectiveEmail,
                                                        issue: sub + (desc ? "\n" + desc : ""),
                                                        status: "Open"
                                                    });
                                                    setSupportTicketForm({ email: "", subject: "", description: "", attachmentFileName: "" });
                                                    setSupportTab("all_tickets");
                                                }}
                                                style={{ padding: "14px 32px", borderRadius: "10px", border: "none", backgroundColor: "#22c55e", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "15px" }}
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => setSupportTab("all_tickets")}
                                                style={{ padding: "14px 32px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: "transparent", color: t.textMain, fontWeight: 700, cursor: "pointer", fontSize: "15px" }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {supportTab === "all_tickets" && (
                                    <>
                                        {viewedTicket ? (
                                            <div>
                                                <button type="button" onClick={() => { setSupportTicketDetailId(null); setSupportTicketReplyMessage(""); }} style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "24px", padding: "10px 18px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: "14px", fontWeight: 700, cursor: "pointer" }}><ArrowRight size={18} style={{ transform: "rotate(180deg)" }} /> Back to list</button>
                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
                                                    <div style={{ backgroundColor: t.bg, padding: "24px", borderRadius: "16px", border: `1px solid ${t.border}` }}>
                                                        <h4 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "20px" }}>Ticket Info</h4>
                                                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                                            <div><span style={{ fontSize: "12px", color: t.textSub, fontWeight: 600 }}>TICKET ID</span><div style={{ fontSize: "15px", fontWeight: 700 }}>#{viewedTicket.ticketId || viewedTicket.id.slice(-6).toUpperCase()}</div></div>
                                                            <div><span style={{ fontSize: "12px", color: t.textSub, fontWeight: 600 }}>SUBJECT</span><div style={{ fontSize: "15px", fontWeight: 700 }}>{viewedTicket.subject}</div></div>
                                                            <div><span style={{ fontSize: "12px", color: t.textSub, fontWeight: 600 }}>STATUS</span><div><span style={{ padding: "6px 14px", borderRadius: "100px", fontSize: "12px", fontWeight: 800, backgroundColor: (statusColor(viewedTicket.status) || "#64748b") + "20", color: statusColor(viewedTicket.status) }}>{viewedTicket.status.toUpperCase()}</span></div></div>
                                                            <div><span style={{ fontSize: "12px", color: t.textSub, fontWeight: 600 }}>CREATED AT</span><div style={{ fontSize: "14px", fontWeight: 600 }}>{new Date(viewedTicket.createdAt).toLocaleString()}</div></div>
                                                        </div>
                                                    </div>
                                                    <div style={{ backgroundColor: t.bg, padding: "24px", borderRadius: "16px", border: `1px solid ${t.border}` }}>
                                                        <h4 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "20px" }}>Ticket Body</h4>
                                                        <p style={{ margin: 0, fontSize: "14px", color: t.textMain, lineHeight: 1.6 }}>{viewedTicket.description || "No description provided."}</p>
                                                    </div>
                                                </div>
                                                <div style={{ backgroundColor: t.bg, padding: "24px", borderRadius: "16px", border: `1px solid ${t.border}` }}>
                                                    <h4 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "20px" }}>Reply History</h4>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px" }}>
                                                        {viewedTicket.replies?.length > 0 ? viewedTicket.replies.map((r, i) => (
                                                            <div key={i} style={{ display: "flex", gap: "16px", padding: "20px", borderRadius: "12px", backgroundColor: r.from === 'organiser' ? "#3b82f610" : "#f1f5f9", borderLeft: `4px solid ${r.from === 'organiser' ? "#3b82f6" : "#64748b"}` }}>
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                                                        <span style={{ fontWeight: 800, fontSize: "14px", textTransform: "capitalize" }}>{r.from}</span>
                                                                        <span style={{ fontSize: "12px", color: t.textSub }}>{new Date(r.at).toLocaleString()}</span>
                                                                    </div>
                                                                    <p style={{ margin: 0, fontSize: "14px", color: t.textMain }}>{r.message}</p>
                                                                </div>
                                                            </div>
                                                        )) : <div style={{ textAlign: "center", padding: "32px", color: t.textSub }}>No replies yet.</div>}
                                                    </div>
                                                    <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: "24px" }}>
                                                        <label style={{ display: "block", fontSize: "14px", fontWeight: 700, marginBottom: "12px" }}>Add New Reply</label>
                                                        <textarea value={supportTicketReplyMessage} onChange={(e) => setSupportTicketReplyMessage(e.target.value)} placeholder="Type your message here..." rows={4} style={{ width: "100%", padding: "16px", borderRadius: "12px", border: `1px solid ${t.border}`, backgroundColor: t.cardBg, color: t.textMain, fontSize: "14px", outline: "none", marginBottom: "16px" }} />
                                                        <button onClick={() => { if (!supportTicketReplyMessage.trim()) return; addReplyToTicket(viewedTicket.id, supportTicketReplyMessage); }} style={{ padding: "12px 28px", borderRadius: "10px", backgroundColor: "#3b82f6", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>Send Reply</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", gap: "16px", flexWrap: "wrap" }}>
                                                    <div style={{ position: "relative", flex: 1, minWidth: "250px" }}>
                                                        <input type="text" placeholder="Search by Ticket ID" value={supportTicketSearchId} onChange={(e) => setSupportTicketSearchId(e.target.value)} style={{ width: "100%", padding: "12px 16px", borderRadius: "8px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: "14px", outline: "none" }} />
                                                    </div>
                                                    <button onClick={() => setSupportTab("add_ticket")} style={{ padding: "12px 24px", borderRadius: "8px", backgroundColor: "#3b82f6", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}><Plus size={18} /> Add Ticket</button>
                                                </div>
                                                <div style={{ overflowX: "auto" }}>
                                                    <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
                                                        <thead>
                                                            <tr style={{ textAlign: "left" }}>
                                                                <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}><input type="checkbox" checked={filteredTickets.length > 0 && selectedTicketIds.length === filteredTickets.length} onChange={toggleSelectAll} /></th>
                                                                <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Ticket ID</th>
                                                                <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Email</th>
                                                                <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Subject</th>
                                                                <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Status</th>
                                                                <th style={{ padding: "12px 16px", color: t.textSub, fontSize: "13px", fontWeight: 700 }}>Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {filteredTickets.map((ticket) => (
                                                                <tr key={ticket.id} style={{ backgroundColor: t.bg, borderRadius: "12px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                                                                    <td style={{ padding: "16px", borderRadius: "12px 0 0 12px" }}>
                                                                        <input type="checkbox" checked={selectedTicketIds.includes(ticket.id)} onChange={() => toggleTicketSelect(ticket.id)} />
                                                                    </td>
                                                                    <td style={{ padding: "16px", fontSize: "14px", fontWeight: 700 }}>#{ticket.ticketId || ticket.id.slice(-6).toUpperCase()}</td>
                                                                    <td style={{ padding: "16px", fontSize: "14px", color: t.textSub }}>{ticket.email || "—"}</td>
                                                                    <td style={{ padding: "16px", fontSize: "14px", fontWeight: 600 }}>{ticket.subject}</td>
                                                                    <td style={{ padding: "16px" }}>
                                                                        <span style={{ padding: "6px 12px", borderRadius: "100px", fontSize: "11px", fontWeight: 800, backgroundColor: (statusColor(ticket.status) || "#64748b") + "20", color: statusColor(ticket.status) }}>{ticket.status.toUpperCase()}</span>
                                                                    </td>
                                                                    <td style={{ padding: "16px", borderRadius: "0 12px 12px 0" }}>
                                                                        <select
                                                                            onChange={(e) => {
                                                                                if (e.target.value === "view") setSupportTicketDetailId(ticket.id);
                                                                                if (e.target.value === "reply") { setSupportTicketDetailId(ticket.id); setSupportTicketReplyMessage(""); }
                                                                                e.target.value = "select";
                                                                            }}
                                                                            style={{ padding: "6px 12px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: t.cardBg, color: t.textMain, fontSize: "12px", outline: "none", cursor: "pointer" }}
                                                                        >
                                                                            <option value="select">Select</option>
                                                                            <option value="view">View</option>
                                                                            <option value="reply">Reply</option>
                                                                        </select>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            {filteredTickets.length === 0 && (
                                                                <tr><td colSpan={6} style={{ textAlign: "center", padding: "48px", color: t.textSub }}>No support tickets found.</td></tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    );
                }

                case "edit_profile": {
                    const orgTypeOptions = ["Individual", "Event Organiser", "Pvt Ltd", "Others"];
                    const Breadcrumb = ({ title }) => (
                        <div className="breadcrumb" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", fontSize: "14px", color: t.textSub }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <Home size={14} />
                                <span>Settings</span>
                            </div>
                            <ChevronDown size={14} style={{ transform: "rotate(-90deg)" }} />
                            <div style={{ color: "#3b82f6", fontWeight: 700 }}>{title}</div>
                        </div>
                    );

                    return (
                        <div>
                            <Breadcrumb title="Edit Profile" />
                            <div style={{ backgroundColor: t.cardBg, padding: "32px", borderRadius: "16px", border: `1px solid ${t.border}`, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", maxWidth: "800px" }}>
                                <div style={{ marginBottom: "32px" }}>
                                    <h3 style={{ fontSize: "24px", fontWeight: 800, color: t.textMain, margin: 0 }}>Profile Details</h3>
                                    <p style={{ fontSize: "14px", color: t.textSub, marginTop: "4px" }}>Update your organiser profile information and public details.</p>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "13px", fontWeight: 800, color: t.textSub, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>First Name</label>
                                        <input type="text" value={profile.firstName} onChange={(e) => setProfile(p => ({ ...p, firstName: e.target.value }))} placeholder="First name" style={{ width: "100%", padding: "14px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: "15px", fontWeight: 600 }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "13px", fontWeight: 800, color: t.textSub, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>Last Name</label>
                                        <input type="text" value={profile.lastName} onChange={(e) => setProfile(p => ({ ...p, lastName: e.target.value }))} placeholder="Last name" style={{ width: "100%", padding: "14px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: "15px", fontWeight: 600 }} />
                                    </div>
                                    <div style={{ gridColumn: "span 2" }}>
                                        <label style={{ display: "block", fontSize: "13px", fontWeight: 800, color: t.textSub, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>Organiser Type</label>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                                            {orgTypeOptions.map(opt => (
                                                <button key={opt} type="button" onClick={() => setProfile(p => ({ ...p, orgType: opt }))} style={{ padding: "10px 20px", borderRadius: "10px", border: `2px solid ${profile.orgType === opt ? "#3b82f6" : t.border}`, backgroundColor: profile.orgType === opt ? "#3b82f615" : "transparent", color: profile.orgType === opt ? "#3b82f6" : t.textSub, fontWeight: 700, cursor: "pointer", fontSize: "14px", transition: "0.2s" }}>{opt}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ gridColumn: "span 2" }}>
                                        <label style={{ display: "block", fontSize: "13px", fontWeight: 800, color: t.textSub, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>Email address</label>
                                        <input type="email" value={profile.email} onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))} placeholder="organizer@example.com" style={{ width: "100%", padding: "14px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: "15px", fontWeight: 600 }} />
                                    </div>
                                    <div style={{ gridColumn: "span 2" }}>
                                        <label style={{ display: "block", fontSize: "13px", fontWeight: 800, color: t.textSub, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>Phone Number</label>
                                        <input type="tel" value={profile.phone} onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+91 98765 43210" style={{ width: "100%", padding: "14px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: "15px", fontWeight: 600 }} />
                                    </div>
                                    <div style={{ gridColumn: "span 2", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", backgroundColor: theme === "light" ? "#f8fafc" : "#0f172a", borderRadius: "12px", border: `1px solid ${t.border}` }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: profile.kycStatus === "KYC Approved" ? "#22c55e20" : "#f59e0b20", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                {profile.kycStatus === "KYC Approved" ? <CheckCircle size={24} color="#22c55e" /> : <AlertCircle size={24} color="#f59e0b" />}
                                            </div>
                                            <div>
                                                <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: t.textMain }}>KYC Verification Status</p>
                                                <p style={{ margin: 0, fontSize: "12px", color: t.textSub }}>{profile.kycStatus}</p>
                                            </div>
                                        </div>
                                        <div style={{ padding: "6px 12px", borderRadius: "100px", fontSize: "11px", fontWeight: 800, backgroundColor: profile.kycStatus === "KYC Approved" ? "#22c55e20" : "#f59e0b20", color: profile.kycStatus === "KYC Approved" ? "#22c55e" : "#f59e0b" }}>{profile.kycStatus.toUpperCase()}</div>
                                    </div>
                                </div>

                                <div style={{ marginTop: "32px", display: "flex", justifyContent: "flex-end" }}>
                                    <button type="button" onClick={() => { alert("Profile updates are currently disabled. Please contact support to change profile details."); }} style={{ padding: "16px 32px", borderRadius: "12px", border: "none", backgroundColor: "#3b82f6", color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: "15px", boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)" }}>Save Profile Changes</button>
                                </div>
                            </div>
                        </div>
                    );
                }

                case "change_password": {
                    const Breadcrumb = ({ title }) => (
                        <div className="breadcrumb" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", fontSize: "14px", color: t.textSub }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <Home size={14} />
                                <span>Settings</span>
                            </div>
                            <ChevronDown size={14} style={{ transform: "rotate(-90deg)" }} />
                            <div style={{ color: "#3b82f6", fontWeight: 700 }}>{title}</div>
                        </div>
                    );

                    return (
                        <div>
                            <Breadcrumb title="Change Password" />
                            <div style={{ backgroundColor: t.cardBg, padding: "32px", borderRadius: "16px", border: `1px solid ${t.border}`, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", maxWidth: "560px" }}>
                                <div style={{ marginBottom: "32px" }}>
                                    <h3 style={{ fontSize: "24px", fontWeight: 800, color: t.textMain, margin: 0 }}>Security Settings</h3>
                                    <p style={{ fontSize: "14px", color: t.textSub, marginTop: "4px" }}>Update your account password to keep it secure.</p>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "13px", fontWeight: 800, color: t.textSub, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>Current Password</label>
                                        <input type="password" placeholder="••••••••" style={{ width: "100%", padding: "14px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: "15px", fontWeight: 600 }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "13px", fontWeight: 800, color: t.textSub, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>New Password</label>
                                        <input type="password" placeholder="••••••••" style={{ width: "100%", padding: "14px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: "15px", fontWeight: 600 }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "13px", fontWeight: 800, color: t.textSub, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>Confirm New Password</label>
                                        <input type="password" placeholder="••••••••" style={{ width: "100%", padding: "14px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: "15px", fontWeight: 600 }} />
                                    </div>
                                </div>

                                <div style={{ marginTop: "32px" }}>
                                    <button disabled style={{ width: "100%", padding: "16px", borderRadius: "12px", border: "none", backgroundColor: "#3b82f6", color: "#fff", fontWeight: 800, cursor: "not-allowed", opacity: 0.7, fontSize: "15px" }}>Update Security Password</button>
                                </div>
                            </div>
                        </div>
                    );
                }
                case "ticket_bookings": {
                    const Breadcrumb = ({ title }) => (
                        <div className="breadcrumb" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", fontSize: "14px", color: t.textSub }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <Home size={14} />
                                <span>Settings</span>
                            </div>
                            <ChevronDown size={14} style={{ transform: "rotate(-90deg)" }} />
                            <div style={{ color: "#3b82f6", fontWeight: 700 }}>{title}</div>
                        </div>
                    );

                    return (
                        <div>
                            <Breadcrumb title="Ticket Bookings" />
                            <div style={{ backgroundColor: t.cardBg, padding: "32px", borderRadius: "16px", border: `1px solid ${t.border}`, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
                                <div style={{ marginBottom: "32px" }}>
                                    <h3 style={{ fontSize: "24px", fontWeight: 800, color: t.textMain, margin: 0 }}>Booking Archive</h3>
                                    <p style={{ fontSize: "14px", color: t.textSub, marginTop: "4px" }}>Access historical ticket booking records for all your published events.</p>
                                </div>
                                <div style={{ padding: "64px 32px", textAlign: "center", backgroundColor: t.bg, borderRadius: "20px", border: `2px dashed ${t.border}` }}>
                                    <div style={{ width: "64px", height: "64px", borderRadius: "20px", backgroundColor: "#3b82f610", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                                        <Monitor size={32} color="#3b82f6" />
                                    </div>
                                    <h4 style={{ fontSize: "18px", fontWeight: 800, color: t.textMain, margin: "0 0 8px" }}>No Booking History</h4>
                                    <p style={{ fontSize: "14px", color: t.textSub, maxWidth: "320px", margin: "0 auto", lineHeight: 1.5 }}>When customers book tickets for your events, the details will appear here automatically.</p>
                                </div>
                            </div>
                        </div>
                    );
                }

                case "refund_status": {
                    const Breadcrumb = ({ title }) => (
                        <div className="breadcrumb" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", fontSize: "14px", color: t.textSub }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <Home size={14} />
                                <span>Settings</span>
                            </div>
                            <ChevronDown size={14} style={{ transform: "rotate(-90deg)" }} />
                            <div style={{ color: "#3b82f6", fontWeight: 700 }}>{title}</div>
                        </div>
                    );

                    return (
                        <div>
                            <Breadcrumb title="Refund Status" />
                            <div style={{ backgroundColor: t.cardBg, padding: "32px", borderRadius: "16px", border: `1px solid ${t.border}`, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
                                <div style={{ marginBottom: "32px" }}>
                                    <h3 style={{ fontSize: "24px", fontWeight: 800, color: t.textMain, margin: 0 }}>Refund Management</h3>
                                    <p style={{ fontSize: "14px", color: t.textSub, marginTop: "4px" }}>Track and manage ticket refund requests initiated by attendees.</p>
                                </div>
                                <div style={{ padding: "64px 32px", textAlign: "center", backgroundColor: t.bg, borderRadius: "20px", border: `2px dashed ${t.border}` }}>
                                    <div style={{ width: "64px", height: "64px", borderRadius: "20px", backgroundColor: "#3b82f610", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                                        <ArrowLeftRight size={32} color="#3b82f6" />
                                    </div>
                                    <h4 style={{ fontSize: "18px", fontWeight: 800, color: t.textMain, margin: "0 0 8px" }}>All Clear</h4>
                                    <p style={{ fontSize: "14px", color: t.textSub, maxWidth: "320px", margin: "0 auto", lineHeight: 1.5 }}>There are no pending or active refund requests at the moment.</p>
                                </div>
                            </div>
                        </div>
                    );
                }

                case "ticket_details": {
                    const Breadcrumb = ({ title }) => (
                        <div className="breadcrumb" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", fontSize: "14px", color: t.textSub }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <Home size={14} />
                                <span>Settings</span>
                            </div>
                            <ChevronDown size={14} style={{ transform: "rotate(-90deg)" }} />
                            <div style={{ color: "#3b82f6", fontWeight: 700 }}>{title}</div>
                        </div>
                    );

                    return (
                        <div>
                            <Breadcrumb title="Ticket Inventory" />
                            <div style={{ backgroundColor: t.cardBg, padding: "32px", borderRadius: "16px", border: `1px solid ${t.border}`, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
                                <div style={{ marginBottom: "32px" }}>
                                    <h3 style={{ fontSize: "24px", fontWeight: 800, color: t.textMain, margin: 0 }}>Ticket Details</h3>
                                    <p style={{ fontSize: "14px", color: t.textSub, marginTop: "4px" }}>Detailed inventory and management of all individual tickets for your events.</p>
                                </div>
                                <div style={{ padding: "64px 32px", textAlign: "center", backgroundColor: t.bg, borderRadius: "20px", border: `2px dashed ${t.border}` }}>
                                    <div style={{ width: "64px", height: "64px", borderRadius: "20px", backgroundColor: "#3b82f610", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                                        <Ticket size={32} color="#3b82f6" />
                                    </div>
                                    <h4 style={{ fontSize: "18px", fontWeight: 800, color: t.textMain, margin: "0 0 8px" }}>Select an Event</h4>
                                    <p style={{ fontSize: "14px", color: t.textSub, maxWidth: "320px", margin: "0 auto", lineHeight: 1.5 }}>Go to Event Management and select an event to view its detailed ticket inventory here.</p>
                                </div>
                            </div>
                        </div>
                    );
                }
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
                                    <input
                                        type="text"
                                        placeholder="e.g. Annual Music Festival"
                                        value={newEvent.title}
                                        onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                                        style={{ width: "100%", padding: "14px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: t.textMain }}>Event Type</label>
                                    <select
                                        value={newEvent.type}
                                        onChange={(e) => setNewEvent(prev => ({ ...prev, type: e.target.value }))}
                                        style={{ width: "100%", padding: "14px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }}
                                    >
                                        <option value="Venue">Venue Event</option>
                                        <option value="Virtual">Virtual Event</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: t.textMain }}>Venue / Meeting Link</label>
                                    <input
                                        type="text"
                                        placeholder="Enter address or URL"
                                        value={newEvent.venue}
                                        onChange={(e) => setNewEvent(prev => ({ ...prev, venue: e.target.value }))}
                                        style={{ width: "100%", padding: "14px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }}
                                    />
                                </div>
                                <div style={{ gridColumn: "span 2" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                        <label style={{ fontSize: "14px", fontWeight: 700, color: t.textMain }}>Schedule (Multi-Date & Time)</label>
                                        <button onClick={addDateSlot} style={{ fontSize: "12px", color: t.activeText, background: "none", border: "none", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}><Plus size={14} /> Add Slot</button>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                        {newEvent.slots.map((slot, idx) => (
                                            <div key={idx} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                                <input
                                                    type="date"
                                                    value={slot.date}
                                                    onChange={(e) => {
                                                        const newSlots = [...newEvent.slots];
                                                        newSlots[idx].date = e.target.value;
                                                        setNewEvent(prev => ({ ...prev, slots: newSlots }));
                                                    }}
                                                    style={{ flex: 1, padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }}
                                                />
                                                <input
                                                    type="time"
                                                    value={slot.time}
                                                    onChange={(e) => {
                                                        const newSlots = [...newEvent.slots];
                                                        newSlots[idx].time = e.target.value;
                                                        setNewEvent(prev => ({ ...prev, slots: newSlots }));
                                                    }}
                                                    style={{ flex: 1, padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }}
                                                />
                                                {newEvent.slots.length > 1 && <button onClick={() => removeDateSlot(idx)} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}><Trash2 size={18} /></button>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ gridColumn: "span 2", marginTop: "12px" }}>
                                    <button onClick={async () => {
                                        try {
                                            if (!newEvent.title.trim()) { alert("Please enter event title."); return; }
                                            const firstSlot = newEvent.slots[0];
                                            await createEventMutation({
                                                organiserId: effectiveEmail,
                                                title: newEvent.title,
                                                type: newEvent.type,
                                                venue: newEvent.venue,
                                                date: firstSlot?.date || "TBA",
                                                time: firstSlot?.time || "TBA",
                                                img: "https://images.unsplash.com/photo-1540575861501-7ad058c647a0?w=500&h=650&fit=crop",
                                                status: "Active"
                                            });
                                            setShowCreateEvent(false);
                                            setNewEvent({ title: "", type: "Venue", venue: "", slots: [{ date: "", time: "" }] });
                                        } catch (err) {
                                            console.error("Failed to create event:", err);
                                            alert("Failed to create event. Check console for details.");
                                        }
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
                    <div className="sidebar-logo">
                        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
                            <img src="/logo.png" alt="Logo" style={{ height: "36px", objectFit: "contain", filter: theme === 'dark' ? 'invert(1) brightness(2)' : 'none' }} />
                        </Link>
                    </div>

                    <div className="sidebar-profile">
                        <img
                            src={profile.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"}
                            alt="Profile"
                            className="sidebar-profile-img"
                        />
                        <div className="sidebar-profile-info">
                            <p className="sidebar-profile-name">{profile.firstName || 'Organizer'} {profile.lastName}</p>
                            <p className="sidebar-profile-role">Organizer</p>
                        </div>
                    </div>

                    <div className="sidebar-search">
                        <div style={{ position: "relative" }}>
                            <Menu size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: t.textSub }} />
                            <input
                                type="text"
                                placeholder="Search Menu Here..."
                                className="sidebar-search-input"
                                value={menuSearch}
                                onChange={e => setMenuSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <nav style={{ flex: 1, overflowY: "auto", paddingBottom: "24px" }}>
                        <button
                            onClick={() => setActiveTab("dashboard")}
                            className={`sidebar-item ${activeTab === "dashboard" ? "active" : ""}`}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <LayoutDashboard size={20} />
                                <span>Dashboard</span>
                            </div>
                        </button>

                        <div>
                            <button
                                onClick={() => setSidebarOpen(prev => ({ ...prev, eventManagement: !prev.eventManagement }))}
                                className="sidebar-item"
                                style={{ color: (activeTab === "post_event" || activeTab === "manage_events" || activeTab === "venue_events" || activeTab === "online_events") ? t.textMain : t.textSub }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <Grid size={20} />
                                    <span>Event Management</span>
                                </div>
                                {sidebarOpen.eventManagement ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                            {sidebarOpen.eventManagement && (
                                <div style={{ backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)' }}>
                                    <button onClick={() => setActiveTab("post_event")} className={`sidebar-dropdown-item ${activeTab === "post_event" ? "active" : ""}`}>Add Event</button>
                                    <button onClick={() => setActiveTab("manage_events")} className={`sidebar-dropdown-item ${activeTab === "manage_events" ? "active" : ""}`}>All Events</button>
                                    <button onClick={() => setActiveTab("venue_events")} className={`sidebar-dropdown-item ${activeTab === "venue_events" ? "active" : ""}`}>Venue Events</button>
                                    <button onClick={() => setActiveTab("online_events")} className={`sidebar-dropdown-item ${activeTab === "online_events" ? "active" : ""}`}>Online Events</button>
                                </div>
                            )}
                        </div>

                        <div>
                            <button
                                onClick={() => setSidebarOpen(prev => ({ ...prev, eventBookings: !prev.eventBookings }))}
                                className="sidebar-item"
                                style={{ color: (activeTab === "all_bookings" || activeTab === "completed_bookings" || activeTab === "pending_bookings" || activeTab === "rejected_bookings" || activeTab === "booking_report") ? t.textMain : t.textSub }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <Users size={20} />
                                    <span>Event Bookings</span>
                                </div>
                                {sidebarOpen.eventBookings ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                            {sidebarOpen.eventBookings && (
                                <div style={{ backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)' }}>
                                    <button onClick={() => setActiveTab("all_bookings")} className={`sidebar-dropdown-item ${activeTab === "all_bookings" ? "active" : ""}`}>All Bookings</button>
                                    <button onClick={() => setActiveTab("completed_bookings")} className={`sidebar-dropdown-item ${activeTab === "completed_bookings" ? "active" : ""}`}>Completed Bookings</button>
                                    <button onClick={() => setActiveTab("pending_bookings")} className={`sidebar-dropdown-item ${activeTab === "pending_bookings" ? "active" : ""}`}>Pending Bookings</button>
                                    <button onClick={() => setActiveTab("rejected_bookings")} className={`sidebar-dropdown-item ${activeTab === "rejected_bookings" ? "active" : ""}`}>Rejected Bookings</button>
                                    <button onClick={() => setActiveTab("booking_report")} className={`sidebar-dropdown-item ${activeTab === "booking_report" ? "active" : ""}`}>Report</button>
                                </div>
                            )}
                        </div>

                        <button onClick={() => setActiveTab("withdraw")} className={`sidebar-item ${activeTab === "withdraw" ? "active" : ""}`}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <Wallet size={20} />
                                <span>Withdraw</span>
                            </div>
                        </button>

                        <button onClick={() => setActiveTab("transactions")} className={`sidebar-item ${activeTab === "transactions" ? "active" : ""}`}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <ArrowLeftRight size={20} />
                                <span>Transactions</span>
                            </div>
                        </button>

                        <button onClick={() => setActiveTab("pwa_scanner")} className={`sidebar-item ${activeTab === "pwa_scanner" ? "active" : ""}`}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <Monitor size={20} />
                                <span>Pwa Scanner</span>
                            </div>
                        </button>

                        <div>
                            <button
                                onClick={() => setSidebarOpen(prev => ({ ...prev, supportTickets: !prev.supportTickets }))}
                                className="sidebar-item"
                                style={{ color: activeTab === "support_tickets" ? t.textMain : t.textSub }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <FileText size={20} />
                                    <span>Support Tickets</span>
                                </div>
                                {sidebarOpen.supportTickets ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                            {sidebarOpen.supportTickets && (
                                <div style={{ backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)' }}>
                                    <button onClick={() => { setActiveTab("support_tickets"); setSupportTab("all_tickets"); }} className={`sidebar-dropdown-item ${activeTab === "support_tickets" && supportTab === "all_tickets" ? "active" : ""}`}>All Tickets</button>
                                    <button onClick={() => { setActiveTab("support_tickets"); setSupportTab("add_ticket"); }} className={`sidebar-dropdown-item ${activeTab === "support_tickets" && supportTab === "add_ticket" ? "active" : ""}`}>Add Ticket</button>
                                </div>
                            )}
                        </div>

                        <button onClick={() => setActiveTab("edit_profile")} className={`sidebar-item ${activeTab === "edit_profile" ? "active" : ""}`}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <Users size={20} />
                                <span>Edit Profile</span>
                            </div>
                        </button>

                        <button onClick={() => setActiveTab("change_password")} className={`sidebar-item ${activeTab === "change_password" ? "active" : ""}`}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <Lock size={20} />
                                <span>Change Password</span>
                            </div>
                        </button>

                        <button
                            onClick={() => { if (confirm("Are you sure you want to logout?")) { logout(); } }}
                            className="sidebar-item"
                            style={{ color: "#ef4444" }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <LogOut size={20} />
                                <span>Logout</span>
                            </div>
                        </button>
                    </nav>
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

                <button
                    onClick={() => { if (confirm("Are you sure you want to logout?")) { logout(); } }}
                    className="sidebar-item"
                    style={{ color: "#ef4444", borderTop: `1px solid ${t.border}`, marginTop: "8px" }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <LogOut size={20} />
                        <span>Logout</span>
                    </div>
                </button>

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

    // Show loading screen until mounted AND auth state is resolved
    if (!mounted || loading) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", color: "#94a3b8" }}>
                Loading…
            </div>
        );
    }

    // If not logged in, redirect (useEffect handles this, show nothing in the meantime)
    if (!user) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", color: "#94a3b8" }}>
                Redirecting to sign in…
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
