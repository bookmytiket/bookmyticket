"use client";
import React, { useState, useEffect, useMemo, useRef, useCallback, Component } from "react";
import Link from "next/link";
import { FileCheck2, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/AuthContext";
import { Country, State, City } from 'country-state-city';
import { Html5Qrcode } from "html5-qrcode";

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
    CheckCircle, Ticket, Users, Menu, Bell, Save, X, Plus, Minus, Trash2,
    Mail, Lock, CreditCard, Code, Globe, Shield, Wallet, Upload,
    ArrowRight, FileText, Calendar, Clock, MapPin, Building, Grid, Tag,
    CloudUpload, ChevronDown, ChevronRight, Monitor, ArrowLeftRight, Home, LogOut, Camera, AlertCircle, QrCode, BarChart3, Search, XCircle, UserCheck, Check, ExternalLink, ArrowLeft, LifeBuoy
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

const EMPTY_ARRAY = [];

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

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get("tab");
        if (tab) setActiveTab(tab);
        else if (user?.role === "staff") setActiveTab("pwa_scanner");
    }, [user]);
    const [theme, setTheme] = useState("light");
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
    const [supportTicketsList, setSupportTicketsList] = useState([]);
    const [supportTicketForm, setSupportTicketForm] = useState({ email: "", subject: "", description: "", attachmentFileName: "" });
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [staffFormData, setStaffFormData] = useState({ name: "", email: "", password: "" });
    const [editingStaffId, setEditingStaffId] = useState(null);
    const [deletingStaffId, setDeletingStaffId] = useState(null);
    const [supportTicketSearchId, setSupportTicketSearchId] = useState("");
    const [selectedTicketIds, setSelectedTicketIds] = useState([]);
    const [supportTicketSelectOpen, setSupportTicketSelectOpen] = useState(null);
    const [supportTicketDetailId, setSupportTicketDetailId] = useState(null);
    const [supportTicketReplyMessage, setSupportTicketReplyMessage] = useState("");
    const [showGstModal, setShowGstModal] = useState(false);
    const [showVendorModal, setShowVendorModal] = useState(false);
    const [agreedToVendor, setAgreedToVendor] = useState(false);

    const effectiveEmail = user?.role === "staff" ? user.organiserId : (user?.identifier || "organiser@bookmyticket.com");
    const isStaff = user?.role === "staff";

    // KYC Wizard State
    const [kycStep, setKycStep] = useState(1);
    const [kycFormData, setKycFormData] = useState({
        category: "Individual", name: "", panCard: "", website: "", socialLink: "",
        ostin: "No", itr: "No", fullName: effectiveEmail, email: effectiveEmail,
        mobile: "", altContact: "", designation: "", city: ""
    });
    const [kycFiles, setKycFiles] = useState({ pan: null, cheque: null, aadhar: null });
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

    const equaliser = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();

    const organiserData = useQuery(api.organisers.get, { userId: effectiveEmail });

    useEffect(() => {
        if (organiserData) {
            setWallet(prev => ({
                ...prev,
                balance: organiserData.walletBalance || 0,
            }));
            const mappedStatus = organiserData.kycStatus === "Active" ? "KYC Approved" : organiserData.kycStatus;
            setProfile(prev => ({
                ...prev,
                kycStatus: mappedStatus,
                email: organiserData.userId,
                firstName: organiserData.name.split(' ')[0] || "John",
                lastName: organiserData.name.split(' ')[1] || "Doe",
            }));

            if (!organiserData.kycStatus || organiserData.kycStatus === "Pending" || organiserData.kycStatus === "Start Onboarding") {
                setCurrentStage("kyc_start");
            } else if (organiserData.kycStatus === "KYC Pending" || organiserData.kycStatus === "Submitted") {
                setCurrentStage("pending");
            } else if (organiserData.kycStatus === "Active") {
                setCurrentStage("approved");
            } else {
                setCurrentStage("kyc_start");
            }
        }
    }, [organiserData]);

    const convexSupportTickets = useQuery(api.supportTickets.list) || EMPTY_ARRAY;
    const submitKycMutation = useMutation(api.organisers.submitKyc);
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

    const convexBookings = useQuery(api.bookings.getBookings) || EMPTY_ARRAY;
    const updateBookingMutation = useMutation(api.bookings.updateBooking);
    const createStaffMutation = useMutation(api.staff.createStaff);
    const updateStaffMutation = useMutation(api.staff.updateStaff);
    const deleteStaffMutation = useMutation(api.staff.deleteStaff);
    const staffAccounts = useQuery(api.staff.list, { organiserId: effectiveEmail }) || EMPTY_ARRAY;
    const validateAndLogScanMutation = useMutation(api.pwaScans.validateAndLogScan);

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

        // Use the centralized robust validation mutation
        const result = await validateAndLogScanMutation({
            bookingId: rawId,
            eventId: "manual_or_scan", // Will be validated by ID if present
            organiserId: effectiveEmail
        });

        if (result.success) {
            setPwaScanResult({ status: "valid", message: result.message });
            setPwaScanInput("");
        } else {
            setPwaScanResult({
                status: result.message.includes("already") ? "already_used" : "error",
                message: result.message
            });
        }
    }, [effectiveEmail, validateAndLogScanMutation]);

    useEffect(() => {
        if (!pwaCameraOpen || typeof window === "undefined") return;

        const scannerId = "pwa-qr-reader";
        let html5QrCode = null;

        const startScanning = async () => {
            try {
                html5QrCode = new Html5Qrcode(scannerId);
                const config = { fps: 10, qrbox: { width: 250, height: 250 } };

                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => {
                        validateBookingId(decodedText);
                        setPwaCameraOpen(false);
                        html5QrCode.stop().catch(console.error);
                    },
                    (errorMessage) => {
                        // Suppress scanning noise errors
                    }
                );
            } catch (err) {
                console.error("Scanning start error:", err);
            }
        };

        startScanning();

        return () => {
            if (html5QrCode) {
                if (html5QrCode.isScanning) {
                    html5QrCode.stop().catch(console.error);
                }
            }
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
        address: "", latitude: "", longitude: "",
        country: "", state: "", district: "", city: "", zipCode: "",
        countryCode: "", stateCode: "",
        seatingEnabled: true,
        environment: "Indoor",
        normalTicketCapacity: "",
        normalTicketPrice: "",
        rows: 10, cols: 10,
        categories: [
            { name: "VIP", price: 2000, rows: 2, isFree: false },
            { name: "Gold", price: 1000, rows: 4, isFree: false },
            { name: "Silver", price: 500, rows: 4, isFree: false },
        ],
        // Online Event Specific Fields
        startDate: "", startTime: "", endDate: "", endTime: "",
        dateSlots: [{ date: "", time: "" }],
        eventStatus: "Active", isFeature: "Yes",
        ticketLimitType: "unlimited", totalTickets: "",
        price: "", ticketsAreFree: false,
        meetingUrl: "", earlyBirdDiscount: "disable",
        layoutType: "stage",
    });
    const [postEvent, setPostEvent] = useState(getInitialPostEvent());
    const [publishError, setPublishError] = useState("");

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
                    ...getInitialPostEvent(),
                    ...parsed,
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
        let currentRow = 0;
        for (const cat of categories) {
            const nextMax = currentRow + Number(cat.rows);
            if (rowIdx + 1 > currentRow && rowIdx + 1 <= nextMax) {
                return { ...cat, color: cat.name === "VIP" ? "#f59e0b" : cat.name === "Gold" ? "#6366f1" : "#22c55e" };
            }
            currentRow = nextMax;
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
        const isOnline = postEvent.type === "Online";
        const isMultiple = (postEvent.dateType || "single") === "multiple";
        const today = new Date().toISOString().split("T")[0];

        // Core validation — use toast-style state, not alert()
        if (!postEvent.title?.trim()) {
            setPublishError("Please fill in Event Title.");
            return;
        }
        setPublishError("");

        // Date/Time Mapping — default to today if not set
        const startDate = postEvent.startDate || today;
        const startTime = postEvent.startTime || "";

        const effectiveSlots = isMultiple
            ? (postEvent.dateSlots || []).filter(s => s.date)
            : [{ date: startDate, time: startTime }];

        const firstSlot = effectiveSlots[0] || { date: today, time: "" };

        const isSeating = !isOnline && postEvent.seatingEnabled !== false;
        const categories = postEvent.categories || [];

        // Total Capacity
        let totalSeats = 100;
        if (isOnline) {
            totalSeats = postEvent.ticketLimitType === "limited" ? (parseInt(postEvent.totalTickets, 10) || 100) : 999999;
        } else {
            if (isSeating) {
                totalSeats = categories.reduce((sum, cat) => sum + (Number(cat.rows) * Number(postEvent.cols || 10)), 0) || 100;
            } else {
                totalSeats = (parseInt(postEvent.normalTicketCapacity, 10) || 100);
            }
        }

        // Price (minimum across categories)
        let finalPrice = 0;
        if (isOnline) {
            finalPrice = postEvent.ticketsAreFree ? 0 : (Number(postEvent.price) || 0);
        } else if (isSeating && categories.length > 0) {
            const prices = categories.map(c => c.isFree ? 0 : Number(c.price) || 0);
            finalPrice = Math.min(...prices);
        } else {
            finalPrice = Number(postEvent.normalTicketPrice) || 0;
        }

        const imgUrl = (typeof postEvent.bannerPreview === "string" && postEvent.bannerPreview.startsWith("data:"))
            ? postEvent.bannerPreview
            : "https://images.unsplash.com/photo-1540575861501-7ad058c647a0?w=500&h=650&fit=crop";

        // Build payload with ONLY fields accepted by Convex
        if (!isOnline) {
            if (!postEvent.country) { setPublishError("Please select a Country."); return; }
            if (!postEvent.state) { setPublishError("Please select a State."); return; }
            if (!postEvent.district) { setPublishError("Please select a District."); return; }
            if (!postEvent.city) { setPublishError("Please select a City."); return; }
        }

        const payload = {
            organiserId: effectiveEmail,
            title: (postEvent.title || "Untitled Event").trim(),
            category: postEvent.category || undefined,
            type: postEvent.type || undefined,
            date: firstSlot.date || today,
            time: firstSlot.time || "TBA",
            img: imgUrl,
            bannerPreview: typeof postEvent.bannerPreview === "string" ? postEvent.bannerPreview : undefined,
            seatingEnabled: isSeating,
            totalSeats,
            price: finalPrice,
            location: postEvent.location || undefined,
            venue: isOnline ? "Online / Virtual" : (postEvent.venue || undefined),
            address: isOnline ? postEvent.meetingUrl : (postEvent.address || undefined),
            country: !isOnline ? postEvent.country : undefined,
            state: !isOnline ? postEvent.state : undefined,
            district: !isOnline ? postEvent.district : undefined,
            city: !isOnline ? postEvent.city : undefined,
            environment: isOnline ? "Virtual" : (postEvent.environment || undefined),
            meetingUrl: isOnline ? (postEvent.meetingUrl || undefined) : undefined,
            featured: postEvent.isFeature === "Yes" ? true : false,
            description: postEvent.description || undefined,
            rows: isSeating ? categories.reduce((sum, c) => sum + (Number(c.rows) || 0), 0) : undefined,
            cols: isSeating ? (Number(postEvent.cols) || 10) : undefined,
            normalTicketCapacity: !isSeating && !isOnline ? (Number(postEvent.normalTicketCapacity) || undefined) : undefined,
            normalTicketPrice: !isSeating && !isOnline ? (Number(postEvent.normalTicketPrice) || undefined) : undefined,
            virtual: isOnline ? true : false,
            seatCategories: isSeating && categories.length > 0 ? categories.map(c => ({
                name: c.name || "General",
                price: Number(c.price) || 0,
                rows: Number(c.rows) || 0,
                isFree: !!c.isFree
            })) : undefined,
            dateSlots: isMultiple && effectiveSlots.length > 0 ? effectiveSlots.map(s => ({ date: s.date, time: s.time || "" })) : undefined,
            layoutType: isSeating ? (postEvent.layoutType || "stage") : undefined,
        };

        // Remove undefined keys (Convex may reject them in some versions)
        Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

        createEventMutation(payload)
            .then(() => {
                setPostEvent(getInitialPostEvent());
                setAddEventStep("select_type");
                try { localStorage.removeItem("organiser_draft"); } catch (_) { }
                setActiveTab("manage_events");
            })
            .catch(err => {
                console.error("Error publishing event:", err);
                setPublishError("Failed to publish: " + (err?.message || "Unknown error"));
            });
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
            .mobile-header {
                display: none;
                height: 60px;
                background-color: ${t.header};
                border-bottom: 1px solid ${t.border};
                align-items: center;
                justify-content: space-between;
                padding: 0 16px;
                position: sticky;
                top: 0;
                z-index: 90;
            }
            .bottom-nav {
                display: none;
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                height: 70px;
                background-color: ${t.header};
                border-top: 1px solid ${t.border};
                display: flex;
                justify-content: space-around;
                align-items: center;
                z-index: 1000;
                padding-bottom: env(safe-area-inset-bottom);
                backdrop-filter: blur(10px);
                background-color: ${theme === 'light' ? 'rgba(255,255,255,0.85)' : 'rgba(15,23,42,0.85)'};
            }
            .bottom-nav-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
                color: ${t.textSub};
                font-size: 11px;
                font-weight: 600;
                text-decoration: none;
                border: none;
                background: none;
                cursor: pointer;
                transition: all 0.2s;
                padding: 8px;
                border-radius: 12px;
            }
            .bottom-nav-item.active {
                color: #3b82f6;
            }
            .pwa-scanner-grid {
                display: grid; 
                grid-template-columns: 1fr 400px; 
                gap: 32px; 
                align-items: start; 
                margin-bottom: 32px;
            }
            @media (max-width: 768px) {
                .mobile-header { display: flex; }
                .bottom-nav { display: flex; }
                .main-content { padding-bottom: 80px; }
                .pwa-scanner-grid { 
                    grid-template-columns: 1fr; 
                    gap: 20px;
                }
                .manual-validation-box {
                    flex-direction: column;
                }
                .manual-validation-box button {
                    width: 100%;
                    padding: 16px!important;
                }
                .scan-table-desktop { display: none; }
                .scan-cards-mobile { display: flex; flex-direction: column; gap: 12px; }
            }
            @media (min-width: 769px) {
                .scan-cards-mobile { display: none; }
                .scan-table-desktop { display: block; }
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
                    onClick={() => setCurrentStage("kyc_start")}
                    style={{ width: "100%", padding: "14px", borderRadius: "10px", backgroundColor: "#3b82f6", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                >
                    Verify & Continue <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );

    // KYC Start View (Banner & Features)
    const renderKYCStartView = () => (
        <div style={{ maxWidth: "1000px", margin: "0 auto", backgroundColor: t.cardBg, borderRadius: "20px", border: `1px solid ${t.border}`, overflow: "hidden" }}>
            <div style={{ backgroundColor: "#1e1b4b", padding: "30px 40px", color: "#fff", position: "relative" }}>
                <div style={{ position: "absolute", left: "-20px", top: "20%" }}><img src="data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0L40 20L20 40L0 20L20 0Z' fill='white' fill-opacity='0.1'/%3E%3C/svg%3E" alt="" /></div>
                <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 900, letterSpacing: "1px" }}>START ONBOARDING</h1>
            </div>

            <div style={{ display: "flex", padding: "24px 40px", gap: "40px", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                    <div style={{ backgroundColor: "#f1f5f9", padding: "24px", borderRadius: "20px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                        <Shield size={80} color="#3b82f6" opacity={0.8} />
                    </div>
                </div>
                <div style={{ flex: 1 }}>
                    <span style={{ backgroundColor: "#22c55e", color: "#fff", padding: "4px 12px", borderRadius: "16px", fontSize: "12px", fontWeight: 700 }}>Takes 3 mins</span>
                    <h2 style={{ fontSize: "24px", fontWeight: 800, color: t.textMain, marginTop: "16px", marginBottom: "8px" }}>Host events with confidence</h2>
                    <p style={{ color: t.textSub, fontSize: "14px", marginBottom: "24px" }}>We prioritize security, trust, and seamless event experiences</p>

                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: t.textMain, marginBottom: "16px" }}>Why KYC Verification?</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px" }}>
                        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                            <div style={{ backgroundColor: "#22c55e", borderRadius: "50%", padding: "4px", color: "#fff" }}><Check size={14} /></div>
                            <div>
                                <div style={{ fontSize: "14px", fontWeight: 700, color: t.textMain }}>Seamless Event Hosting</div>
                                <div style={{ fontSize: "12px", color: t.textSub }}>Verified hosts enjoy faster and hassle-free event access.</div>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                            <div style={{ backgroundColor: "#22c55e", borderRadius: "50%", padding: "4px", color: "#fff" }}><Check size={14} /></div>
                            <div>
                                <div style={{ fontSize: "14px", fontWeight: 700, color: t.textMain }}>Regulatory Compliance</div>
                                <div style={{ fontSize: "12px", color: t.textSub }}>Ensures adherence to industry standards and policies.</div>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                            <div style={{ backgroundColor: "#22c55e", borderRadius: "50%", padding: "4px", color: "#fff" }}><Check size={14} /></div>
                            <div>
                                <div style={{ fontSize: "14px", fontWeight: 700, color: t.textMain }}>Seamless Payouts</div>
                                <div style={{ fontSize: "12px", color: t.textSub }}>Ensure smooth and timely settlements.</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                        <button onClick={() => setCurrentStage("kyc_wizard")} style={{ backgroundColor: "#1e1b4b", color: "#fff", padding: "12px 24px", borderRadius: "24px", fontWeight: 700, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>Get Started <ArrowRight size={16} /></button>
                        <a href="#" style={{ color: t.textMain, fontSize: "14px", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}>Contact Us <ExternalLink size={14} /></a>
                    </div>
                </div>
            </div>
        </div>
    );

    // KYC Wizard View (3 steps)
    const renderKYCWizardView = () => (
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", gap: "40px", backgroundColor: t.cardBg, borderRadius: "20px", border: `1px solid ${t.border}`, padding: "40px" }}>

            {/* Left Sidebar Tracker */}
            <div style={{ width: "240px", position: "relative", flexShrink: 0 }}>
                <h2 style={{ fontSize: "18px", fontWeight: 700, color: t.textMain, marginBottom: "32px", margin: 0, paddingLeft: "10px" }}>Organizer KYC</h2>

                <div style={{ display: "flex", flexDirection: "column", gap: "40px", position: "relative" }}>
                    {[
                        { num: 1, label: "Organization Details" },
                        { num: 2, label: "Upload Documents" },
                        { num: 3, label: "Agreement" }
                    ].map((step, idx) => {
                        const isActive = kycStep === step.num;
                        const isCompleted = kycStep > step.num;
                        return (
                            <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "16px", zIndex: 2 }}>
                                <div style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                    fontWeight: 700,
                                    fontSize: "14px",
                                    marginTop: "2px",
                                    backgroundColor: isCompleted ? "#22c55e" : (isActive ? "#fff" : "#fff"),
                                    backgroundImage: isActive ? "linear-gradient(135deg, #f43f5e, #f97316)" : "none",
                                    color: isActive ? "#fff" : (isCompleted ? "#fff" : "#94a3b8"),
                                    border: isCompleted ? "none" : (isActive ? "none" : `2px solid #e2e8f0`),
                                    boxShadow: isActive ? "0 4px 12px rgba(244, 63, 94, 0.3)" : "none"
                                }}>
                                    {isCompleted ? <Check size={18} /> : step.num}
                                </div>
                                <span style={{ fontSize: "13px", fontWeight: 600, color: isActive ? "#0f172a" : (isCompleted ? "#0f172a" : "#94a3b8") }}>{step.label}</span>
                            </div>
                        );
                    })}

                    <div style={{ position: "absolute", left: "18px", top: "20px", bottom: "20px", width: "2px", backgroundColor: "#e2e8f0", zIndex: 0 }}></div>
                    <div style={{ position: "absolute", left: "18px", top: "20px", height: kycStep === 1 ? "0%" : (kycStep === 2 ? "50%" : "100%"), width: "2px", backgroundColor: "#f43f5e", zIndex: 1, transition: "height 0.3s ease" }}></div>
                </div>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, borderLeft: `1px solid ${t.border}`, paddingLeft: "40px" }}>
                {kycStep === 1 && (
                    <div style={{ backgroundColor: "#ffffff", padding: "32px", borderRadius: "12px", border: `1px solid #e2e8f0`, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "8px", fontWeight: 600 }}>Category <span style={{ color: "#ef4444" }}>*</span></label>
                            <select value={kycFormData.category} onChange={e => setKycFormData({ ...kycFormData, category: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "6px", border: `1px solid #e2e8f0`, color: "#1e293b", backgroundColor: "#f8fafc", outline: "none", fontSize: "14px" }}>
                                <option value="Company">Company</option>
                                <option value="Individual">Individual</option>
                                <option value="Partnership">Partnership</option>
                                <option value="LLP">LLP</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "8px", fontWeight: 600 }}>Name <span style={{ color: "#ef4444" }}>*</span></label>
                            <input type="text" placeholder="As per PAN" value={kycFormData.name} onChange={e => setKycFormData({ ...kycFormData, name: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "6px", border: `1px solid #e2e8f0`, color: "#1e293b", backgroundColor: "#f8fafc", outline: "none", fontSize: "14px" }} />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "8px", fontWeight: 600 }}>PAN <span style={{ color: "#ef4444" }}>*</span></label>
                            <input type="text" placeholder="PAN" value={kycFormData.panCard} onChange={e => setKycFormData({ ...kycFormData, panCard: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "6px", border: `1px solid #e2e8f0`, color: "#1e293b", backgroundColor: "#f8fafc", outline: "none", fontSize: "14px" }} />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "8px", fontWeight: 600 }}>Website Link</label>
                            <input type="text" placeholder="(ex: https://www.abc.com)" value={kycFormData.website} onChange={e => setKycFormData({ ...kycFormData, website: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "6px", border: `1px solid #e2e8f0`, color: "#1e293b", backgroundColor: "#f8fafc", outline: "none", fontSize: "14px" }} />
                            <div style={{ fontSize: "11px", color: "#22c55e", marginTop: "4px" }}>This will help us to verify your KYC soon</div>
                        </div>
                        <div style={{ gridColumn: "span 2", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "8px", fontWeight: 600 }}>Social Media Link</label>
                                <input type="text" placeholder="(ex: https://www.facebook.com)" value={kycFormData.socialLink} onChange={e => setKycFormData({ ...kycFormData, socialLink: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "6px", border: `1px solid #e2e8f0`, color: "#1e293b", backgroundColor: "#f8fafc", outline: "none", fontSize: "14px" }} />
                                <div style={{ fontSize: "11px", color: "#22c55e", marginTop: "4px" }}>This will help us to verify your KYC soon</div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "8px", fontWeight: 600 }}>Do you have GSTIN number?</label>
                                <div style={{ display: "flex", gap: "24px", marginTop: "8px" }}>
                                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#1e293b", cursor: "pointer" }}>
                                        <input type="radio" name="gstin" checked={kycFormData.ostin === "Yes"} onChange={() => setKycFormData({ ...kycFormData, ostin: "Yes" })} style={{ accentColor: "#f43f5e" }} /> Yes
                                    </label>
                                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#1e293b", cursor: "pointer" }}>
                                        <input type="radio" name="gstin" checked={kycFormData.ostin === "No"} onChange={() => {
                                            setKycFormData({ ...kycFormData, ostin: "No" });
                                            setShowGstModal(true);
                                        }} style={{ accentColor: "#f43f5e" }} /> No
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "8px", fontWeight: 600 }}>Have you filled last 2 years ITR return? <span style={{ color: "#ef4444" }}>*</span></label>
                            <div style={{ display: "flex", gap: "24px", marginTop: "12px" }}>
                                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#1e293b", cursor: "pointer" }}><input type="radio" name="itr" checked={kycFormData.itr === "Yes"} onChange={() => setKycFormData({ ...kycFormData, itr: "Yes" })} style={{ accentColor: "#f43f5e" }} /> Yes</label>
                                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#1e293b", cursor: "pointer" }}><input type="radio" name="itr" checked={kycFormData.itr === "No"} onChange={() => setKycFormData({ ...kycFormData, itr: "No" })} style={{ accentColor: "#f43f5e" }} /> No</label>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "8px", fontWeight: 600 }}>Full Name <span style={{ color: "#ef4444" }}>*</span></label>
                            <input type="text" value={kycFormData.fullName} onChange={e => setKycFormData({ ...kycFormData, fullName: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "6px", border: `1px solid #e2e8f0`, color: "#1e293b", backgroundColor: "#f8fafc", outline: "none", fontSize: "14px" }} />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "8px", fontWeight: 600 }}>Mobile number <span style={{ color: "#ef4444" }}>*</span></label>
                            <input type="text" value={kycFormData.mobile} onChange={e => setKycFormData({ ...kycFormData, mobile: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "6px", border: `1px solid #e2e8f0`, color: "#1e293b", backgroundColor: "#f8fafc", outline: "none", fontSize: "14px" }} />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "8px", fontWeight: 600 }}>Alternate number <span style={{ color: "#ef4444" }}>*</span></label>
                            <input type="text" value={kycFormData.altContact} onChange={e => setKycFormData({ ...kycFormData, altContact: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "6px", border: `1px solid #e2e8f0`, color: "#1e293b", backgroundColor: "#f8fafc", outline: "none", fontSize: "14px" }} />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "8px", fontWeight: 600 }}>City <span style={{ color: "#ef4444" }}>*</span></label>
                            <input type="text" placeholder="Enter your City" value={kycFormData.city} onChange={e => setKycFormData({ ...kycFormData, city: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "6px", border: `1px solid #e2e8f0`, color: "#1e293b", backgroundColor: "#f8fafc", outline: "none", fontSize: "14px" }} />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "8px", fontWeight: 600 }}>Email address <span style={{ color: "#ef4444" }}>*</span></label>
                            <input type="text" disabled value={kycFormData.email} style={{ width: "100%", padding: "12px", borderRadius: "6px", border: `1px solid #e2e8f0`, color: "#94a3b8", backgroundColor: "#f1f5f9", outline: "none", fontSize: "14px", cursor: "not-allowed" }} />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "8px", fontWeight: 600 }}>Designation (min 3 letters) <span style={{ color: "#ef4444" }}>*</span></label>
                            <input type="text" placeholder="Enter your designation" value={kycFormData.designation} onChange={e => setKycFormData({ ...kycFormData, designation: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "6px", border: `1px solid #e2e8f0`, color: "#1e293b", backgroundColor: "#f8fafc", outline: "none", fontSize: "14px" }} />
                        </div>
                    </div>
                )}

                {kycStep === 2 && (
                    <div style={{ backgroundColor: "#ffffff", padding: "32px", borderRadius: "12px", border: `1px solid #e2e8f0`, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
                        {[
                            { id: 'pan', label: 'Upload PAN', file: kycFiles.pan },
                            { id: 'cheque', label: 'Upload Cancelled Cheque', file: kycFiles.cheque },
                            { id: 'aadhar', label: 'Upload Aadhar card', file: kycFiles.aadhar }
                        ].map((doc, idx) => (
                            <div key={doc.id} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                <label style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>{doc.label} <span style={{ color: "#ef4444" }}>*</span></label>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", backgroundColor: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                    <input
                                        type="file"
                                        id={`${doc.id}-upload`}
                                        style={{ fontSize: "12px", color: "#64748b" }}
                                        onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f) setKycFiles({ ...kycFiles, [doc.id]: f.name });
                                        }}
                                    />
                                    <button style={{ color: "#3b82f6", background: "none", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>View Sample</button>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>Max 1 MB</span>
                                        {doc.file && <span style={{ fontSize: "11px", color: "#22c55e", fontWeight: 700, maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={doc.file}>✓ {doc.file}</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {kycStep === 3 && (
                    <div style={{ backgroundColor: "#ffffff", padding: "40px", borderRadius: "12px", border: `1px solid #e2e8f0`, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                        <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", justifyContent: "center", padding: "40px" }}>
                            <input
                                type="checkbox"
                                id="vendor-agree"
                                checked={agreedToVendor}
                                onChange={(e) => setAgreedToVendor(e.target.checked)}
                                style={{ width: "20px", height: "20px", cursor: "pointer", accentColor: "#f43f5e", marginTop: "2px" }}
                            />
                            <label htmlFor="vendor-agree" style={{ fontSize: "16px", color: "#1e293b", fontWeight: 600, cursor: "pointer" }}>
                                I have read and agreed to the <span onClick={(e) => { e.preventDefault(); setShowVendorModal(true); }} style={{ color: "#3b82f6", textDecoration: "underline" }}>vendor agreement</span>
                            </label>
                        </div>
                    </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "40px" }}>
                    <button
                        onClick={() => setKycStep(kycStep - 1)}
                        disabled={kycStep === 1}
                        style={{ padding: "12px 32px", borderRadius: "100px", background: kycStep === 1 ? "#e2e8f0" : "linear-gradient(135deg, #94a3b8, #64748b)", color: "#fff", border: "none", fontWeight: 700, cursor: kycStep === 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.3s ease" }}
                    >
                        <ArrowLeft size={16} /> Prev
                    </button>
                    <button
                        onClick={() => {
                            if (kycStep === 3) {
                                if (!agreedToVendor) { alert("Please agree to the vendor agreement first."); return; }
                                if (!organiserData?._id) { alert("Organiser account not found. Please try again later."); return; }

                                submitKycMutation({
                                    id: organiserData._id,
                                    kycDetails: {
                                        category: kycFormData.category,
                                        panNumber: kycFormData.panCard,
                                        socialMediaLink: kycFormData.socialLink,
                                        hasITR: kycFormData.itr === "Yes",
                                        fullName: kycFormData.fullName,
                                        email: kycFormData.email,
                                        mobile: kycFormData.mobile,
                                        alternateNumber: kycFormData.altContact,
                                        designation: kycFormData.designation,
                                        city: kycFormData.city,
                                        websiteLink: kycFormData.website,
                                        hasOSTIN: kycFormData.ostin === "Yes",
                                        panFile: kycFiles.pan || "",
                                        chequeFile: kycFiles.cheque || "",
                                        aadharFile: kycFiles.aadhar || "",
                                        agreementAccepted: agreedToVendor
                                    }
                                }).then(() => {
                                    setCurrentStage("pending");
                                    setProfile(prev => ({ ...prev, kycStatus: "KYC Pending" }));
                                }).catch(err => {
                                    console.error("KYC Submission error:", err);
                                    alert("Submission failed: " + (err.message || "Unknown error"));
                                });
                            } else {
                                setKycStep(kycStep + 1);
                            }
                        }}
                        style={{ padding: "12px 32px", borderRadius: "100px", background: "linear-gradient(135deg, #f43f5e, #f97316)", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.3s ease", boxShadow: "0 4px 12px rgba(244, 63, 94, 0.2)" }}
                    >
                        {kycStep === 3 ? "Submit" : "Next"} <ArrowRight size={16} />
                    </button>
                </div>

                <div style={{ marginTop: "40px", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px", color: "#22c55e", fontSize: "12px", fontWeight: 700 }}>
                    <CheckCircle size={14} /> All data in transit is safe and secure, encrypted to BookMyTicket
                </div>
            </div>
        </div >
    );

    // Pending View
    const renderPendingView = () => (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ fontSize: "20px", fontWeight: 700, color: t.textMain, marginBottom: "8px", display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ padding: "4px", backgroundColor: "#f43f5e", borderRadius: "4px", color: "#fff", display: "flex" }}>
                    <ArrowRight size={16} style={{ transform: "rotate(180deg)" }} />
                </div>
                Organizer KYC
            </div>

            <div style={{ backgroundColor: t.cardBg, borderRadius: "12px", border: `1px solid ${t.border}`, padding: "20px" }}>

                {/* Status Bar */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: `1px solid ${t.border}`, borderRadius: "8px", padding: "16px", marginBottom: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: t.bg, border: `2px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: t.textSub }}>
                            <CheckCircle size={16} />
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: t.textMain }}>KYC Submitted</span>
                    </div>

                    <div style={{ flex: 1, height: "2px", backgroundColor: t.border, margin: "0 24px" }}></div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#fff", border: "4px solid #f97316", background: "linear-gradient(135deg, #f97316, #f43f5e)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                            <Clock size={20} />
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: t.textMain }}>Verification Pending</span>
                    </div>
                </div>

                {/* Profile Contact Summary */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderRadius: "12px", backgroundColor: theme === 'light' ? "#f8fafc" : "#0f172a", marginBottom: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ width: "50px", height: "50px", borderRadius: "8px", backgroundColor: "#f43f5e15", display: "flex", alignItems: "center", justifyContent: "center", color: "#f43f5e" }}>
                            <Building size={24} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: t.textMain }}>{profile.firstName}</h3>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: t.textMain, fontWeight: 600, marginTop: "4px" }}>
                                <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#22c55e" }}></div>
                                Active Business Profile
                            </div>
                        </div>
                    </div>
                    <div style={{ width: "40px", height: "40px", borderRadius: "12px", backgroundColor: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                        <ImageIcon size={20} />
                    </div>
                </div>

                {/* Details Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                    <div style={{ padding: "16px", borderRadius: "12px", border: `1px solid ${t.border}`, display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ padding: "8px", borderRadius: "8px", backgroundColor: "#3b82f610", color: "#3b82f6" }}><Mail size={18} /></div>
                        <div>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: t.textSub, marginBottom: "2px" }}>Email Address</div>
                            <div style={{ fontSize: "12px", fontWeight: 600, color: t.textMain }}>{profile.email}</div>
                        </div>
                    </div>
                    <div style={{ padding: "16px", borderRadius: "12px", border: `1px solid ${t.border}`, display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ padding: "8px", borderRadius: "8px", backgroundColor: "#22c55e10", color: "#22c55e" }}><AlertCircle size={18} /></div>
                        <div>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: t.textSub, marginBottom: "2px" }}>Phone Number</div>
                            <div style={{ fontSize: "12px", fontWeight: 600, color: t.textMain }}>{kycFormData.mobile || "+918344442221"}</div>
                        </div>
                    </div>
                    <div style={{ padding: "16px", borderRadius: "12px", border: `1px solid ${t.border}`, display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ padding: "8px", borderRadius: "8px", backgroundColor: "#a855f710", color: "#a855f7" }}><MapPin size={18} /></div>
                        <div>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: t.textSub, marginBottom: "2px" }}>Location</div>
                            <div style={{ fontSize: "12px", fontWeight: 600, color: t.textMain }}>{kycFormData.city || "Pollachi"}</div>
                        </div>
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
                    <div style={{ width: "32%", padding: "16px", borderRadius: "12px", border: `1px solid #f59e0b50`, backgroundColor: "#f59e0b05", display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ padding: "8px", borderRadius: "8px", backgroundColor: "#f59e0b10", color: "#f59e0b" }}><Calendar size={18} /></div>
                        <div>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: t.textSub, marginBottom: "2px" }}>Active Since</div>
                            <div style={{ fontSize: "12px", fontWeight: 600, color: t.textMain }}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ fontSize: "12px", color: t.textSub, marginTop: "8px" }}>
                If you need to make any changes or have queries, please contact us on <a href="mailto:admin@bookmyticket.io" style={{ color: "#3b82f6" }}>admin@bookmyticket.io</a>
            </div>

        </div>
    );

    // Main Dashboard View (Approved)
    const renderDashboardView = () => {
        const renderTabContent = () => {
            const renderToggle = (label, field, options) => (
                <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px", color: t.textMain }}>{label}{label.endsWith('*') ? '' : '*'}</label>
                    <div style={{ display: "flex", borderRadius: "4px", overflow: "hidden" }}>
                        {options.map((opt, idx) => {
                            const isActive = postEvent[field] === opt.value;
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setPostEvent(prev => ({ ...prev, [field]: opt.value }))}
                                    style={{
                                        flex: 1,
                                        padding: "10px",
                                        border: isActive ? "1px solid #3b82f6" : `1px solid ${t.border}`,
                                        borderLeft: idx !== 0 && !isActive ? "none" : (isActive ? "1px solid #3b82f6" : `1px solid ${t.border}`),
                                        backgroundColor: isActive ? "#eff6ff" : t.bg,
                                        color: isActive ? "#3b82f6" : "#9ca3af",
                                        fontWeight: 500,
                                        fontSize: "13px",
                                        cursor: "pointer",
                                        transition: "all 0.2s ease",
                                        outline: "none",
                                        zIndex: isActive ? 1 : 0
                                    }}
                                >
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            );
            const renderSeatVisualization = (eventData, isPreview = false) => {
                const rows = Math.max(0, Math.floor(Number(eventData.rows) || 0));
                const cols = Math.max(0, Math.floor(Number(eventData.cols) || 0));
                const layout = eventData.layoutType || "stage";
                const categories = eventData.seatCategories || eventData.categories || [];

                // Helper to get category for a row
                const getRowCategory = (rIdx) => {
                    let currentRowSum = 0;
                    for (const cat of categories) {
                        const catRows = Math.max(0, Math.floor(Number(cat.rows) || 0));
                        if (rIdx < currentRowSum + catRows) {
                            let color = "#3b82f6";
                            if (cat.name === "VIP") color = "#f59e0b";
                            else if (cat.name === "Gold" || cat.name === "Premium") color = "#6366f1";
                            else if (cat.name === "Silver") color = "#22c55e";
                            return { ...cat, color };
                        }
                        currentRowSum += catRows;
                    }
                    return { name: "General", color: "#94a3b8", price: 0 };
                };

                const totalCalculatedRows = categories.reduce((sum, c) => sum + Math.max(0, Math.floor(Number(c.rows) || 0)), 0);
                const effectiveRows = Math.min(100, isPreview ? totalCalculatedRows : (rows || totalCalculatedRows));
                const effectiveCols = Math.min(100, cols);

                return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center", backgroundColor: theme === 'dark' ? '#0f172a' : '#f1f5f9', padding: isPreview ? "20px" : "40px", borderRadius: "16px", overflowX: "auto", border: isPreview ? `1px dashed ${t.border}` : "none" }}>
                        {/* Stage/Entrance Indicator */}
                        {(layout === "stage" || layout === "rate") && (
                            <div style={{ marginBottom: "30px", width: "60%", textAlign: "center" }}>
                                <div style={{ height: "6px", backgroundColor: "#3b82f6", borderRadius: "3px", marginBottom: "8px", boxShadow: "0 0 15px rgba(59, 130, 246, 0.5)" }} />
                                <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "3px", color: t.textSub, margin: 0, fontWeight: 800 }}>STAGE / PERFORMANCE AREA</p>
                            </div>
                        )}
                        {layout === "ground" && (
                            <div style={{ marginBottom: "20px", padding: "8px 24px", border: `2px dashed ${t.border}`, borderRadius: "100px", color: t.textSub, fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>
                                ENTRANCE / EXIT
                            </div>
                        )}

                        {[...Array(effectiveRows)].map((_, rIdx) => {
                            const rowLabel = ROW_LABELS[rIdx] || `R${rIdx + 1}`;
                            const cat = getRowCategory(rIdx);

                            return (
                                <div key={rIdx} style={{ display: "flex", gap: isPreview ? "6px" : "10px", alignItems: "center", marginBottom: layout === "ground" && (rIdx + 1) % 3 === 0 ? "15px" : "0" }}>
                                    <span style={{ width: isPreview ? "45px" : "60px", textAlign: "right", fontWeight: 800, fontSize: "10px", color: cat.color, marginRight: "8px", display: "flex", flexDirection: "column" }}>
                                        <span>{rowLabel}</span>
                                        {layout === "rate" && <span style={{ fontSize: "8px", opacity: 0.7 }}>₹{cat.price}</span>}
                                    </span>
                                    {[...Array(effectiveCols)].map((_, cIdx) => {
                                        const seatId = `${rowLabel}${cIdx + 1}`;
                                        const isBooked = !isPreview && mockBookedSeats[eventData.id]?.has(seatId);
                                        const isAisle = layout === "ground" && (cIdx + 1) % 4 === 1 && cIdx !== 0;

                                        return (
                                            <div key={cIdx} style={{ display: "flex", alignItems: "center" }}>
                                                {isAisle && <div style={{ width: isPreview ? "12px" : "20px" }} />}
                                                <div title={`${seatId} (${cat.name} - ₹${cat.price})`} style={{
                                                    width: isPreview ? "18px" : "28px",
                                                    height: isPreview ? "18px" : "28px",
                                                    borderRadius: "4px 4px 3px 3px",
                                                    backgroundColor: isBooked ? "#f84464" : `${cat.color}15`,
                                                    border: `1.5px solid ${isBooked ? "#f84464" : cat.color}`,
                                                    position: "relative",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: isPreview ? "7px" : "9px",
                                                    fontWeight: 800,
                                                    color: isBooked ? "#fff" : cat.color
                                                }}>
                                                    <div style={{
                                                        position: "absolute", top: "-3px", left: "3px", right: "3px", height: "3px",
                                                        backgroundColor: isBooked ? "#f84464" : cat.color, borderRadius: "1px 1px 0 0", opacity: 0.6
                                                    }} />
                                                    {cIdx + 1}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )
                        })}

                        {layout === "ground" && (
                            <div style={{ marginTop: "20px", width: "70%", height: "2px", backgroundColor: t.border, borderRadius: "1px" }} />
                        )}

                        {!isPreview && (
                            <div style={{ marginTop: "32px", display: "flex", gap: "24px", padding: "16px 32px", backgroundColor: t.cardBg, borderRadius: "100px", border: `1px solid ${t.border}`, boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#f59e0b" }}></div><span style={{ fontSize: "12px", fontWeight: 700 }}>VIP</span></div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#6366f1" }}></div><span style={{ fontSize: "12px", fontWeight: 700 }}>Premium</span></div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#22c55e" }}></div><span style={{ fontSize: "12px", fontWeight: 700 }}>General</span></div>
                                <div style={{ width: "1px", height: "16px", backgroundColor: t.border }}></div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#f84464" }}></div><span style={{ fontSize: "12px", fontWeight: 700 }}>Booked</span></div>
                            </div>
                        )}
                    </div>
                );
            };

            const renderInput = (label, field, type = "text", placeholder = "", fullWidth = false) => (
                <div style={{ marginBottom: "20px", gridColumn: fullWidth ? "span 2" : "span 1" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px", color: t.textMain }}>{label}{label.endsWith('*') ? '' : '*'}</label>
                    <input
                        type={type}
                        value={postEvent[field] || ""}
                        onChange={(e) => setPostEvent(prev => ({ ...prev, [field]: e.target.value }))}
                        placeholder={placeholder}
                        style={{
                            width: "100%",
                            padding: "10px 14px",
                            borderRadius: "4px",
                            border: `1px solid ${t.border}`,
                            backgroundColor: t.bg,
                            color: t.textMain,
                            fontSize: "13px",
                            outline: "none"
                        }}
                    />
                </div>
            );

            const renderSelect = (label, field, options) => {
                const handleSelectChange = (e) => {
                    const val = e.target.value;
                    const updates = { [field]: val };

                    // Cascading Reset Logic
                    if (field === "country") {
                        updates.state = "";
                        updates.district = "";
                        updates.city = "";
                        // If selecting Country, find its code for children
                        const countryObj = Country.getAllCountries().find(c => c.name === val);
                        updates.countryCode = countryObj?.isoCode || "";
                    } else if (field === "state") {
                        updates.district = "";
                        updates.city = "";
                        // Find state code
                        const stateObj = State.getStatesOfCountry(postEvent.countryCode).find(s => s.name === val);
                        updates.stateCode = stateObj?.isoCode || "";
                    } else if (field === "district") {
                        // For world-wide data, we use 'City' as 'District' because 4 levels aren't standard globally in this lib
                        updates.city = "";
                    }

                    setPostEvent(prev => ({ ...prev, ...updates }));
                };

                return (
                    <div style={{ marginBottom: "20px" }}>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px", color: t.textMain }}>{label}{label.endsWith('*') ? '' : '*'}</label>
                        <div style={{ position: "relative" }}>
                            <select
                                value={postEvent[field] || ""}
                                onChange={handleSelectChange}
                                style={{
                                    width: "100%",
                                    padding: "10px 14px",
                                    paddingRight: "40px",
                                    borderRadius: "4px",
                                    border: `1px solid ${t.border}`,
                                    backgroundColor: t.bg,
                                    color: t.textMain,
                                    fontSize: "13px",
                                    outline: "none",
                                    appearance: "none"
                                }}
                            >
                                <option value="" disabled hidden>Select</option>
                                {options.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: t.textSub, pointerEvents: "none" }} />
                        </div>
                    </div>
                );
            };
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
                    // Step 1: Choose Online or Venue
                    if (addEventStep === "select_type") {
                        return (
                            <div style={{ backgroundColor: t.bg, minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", maxWidth: "700px", width: "100%" }}>
                                    <button
                                        onClick={() => { setPostEvent(pe => ({ ...pe, type: "Online" })); setAddEventStep("form"); }}
                                        style={{
                                            background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "48px 32px", cursor: "pointer",
                                            display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.06)"
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
                                            background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "48px 32px", cursor: "pointer",
                                            display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.06)"
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

                    // Step 2: Online Form
                    if (postEvent.type === "Online") {
                        return (
                            <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}`, maxWidth: "100%" }}>
                                <input type="file" ref={thumbnailInputRef} accept="image/*" onChange={handleBannerChange} style={{ display: "none" }} />
                                <input type="file" ref={galleryInputRef} accept="image/*" multiple onChange={handleGalleryChange} style={{ display: "none" }} />

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "20px" }}>
                                    {/* Thumbnail Image */}
                                    <div>
                                        <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px", color: t.textMain }}>Thumbnail Image*</label>
                                        <div style={{ border: `1px solid ${t.border}`, borderRadius: "8px", padding: "12px", textAlign: "center", backgroundColor: t.bg, display: "flex", alignItems: "center", gap: "16px", minHeight: "100px" }}>
                                            <div style={{ width: "120px", height: "80px", borderRadius: "4px", overflow: "hidden", backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                {postEvent.bannerPreview ? (
                                                    <img src={postEvent.bannerPreview} alt="Thumbnail" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                ) : <ImageIcon size={32} color="#94a3b8" />}
                                            </div>
                                            <div style={{ textAlign: "left" }}>
                                                <button type="button" onClick={() => thumbnailInputRef.current?.click()} style={{ padding: "6px 12px", backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: "4px", fontSize: "12px", fontWeight: 600, cursor: "pointer", marginBottom: "4px" }}>Choose Image</button>
                                                <p style={{ fontSize: "11px", color: "#f59e0b", margin: 0 }}>Size : 320x230</p>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Gallery Images Snippet */}
                                    <div>
                                        <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px", color: t.textMain }}>Gallery Images</label>
                                        <div onClick={() => galleryInputRef.current?.click()} style={{ border: `1px dashed ${t.border}`, borderRadius: "8px", padding: "12px", backgroundColor: t.bg, cursor: "pointer", minHeight: "100px", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                                            {(postEvent.galleryPreviews || []).slice(0, 3).map((src, idx) => (
                                                <img key={idx} src={src} alt="G" style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px" }} />
                                            ))}
                                            <div style={{ width: "40px", height: "40px", borderRadius: "4px", border: `1px dashed ${t.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: t.textSub }}><Plus size={16} /></div>
                                            <p style={{ fontSize: "11px", color: t.textSub, margin: 0, marginLeft: "auto" }}>1170x570</p>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px" }}>
                                    {renderToggle("Date Type*", "dateType", [{ label: "Single", value: "single" }, { label: "Multiple", value: "multiple" }])}
                                    {renderToggle("Countdown*", "countdownStatus", [{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }])}
                                    {renderSelect("Status*", "eventStatus", [{ label: "Active", value: "Active" }, { label: "Inactive", value: "Inactive" }])}
                                    {renderSelect("Is Feature*", "isFeature", [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }])}
                                </div>

                                {postEvent.dateType === "single" && (
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px" }}>
                                        {renderInput("Start Date*", "startDate", "date")}
                                        {renderInput("Start Time*", "startTime", "time")}
                                        {renderInput("End Date*", "endDate", "date")}
                                        {renderInput("End Time*", "endTime", "time")}
                                    </div>
                                )}

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", alignItems: "end" }}>
                                    {renderToggle("Tickets*", "ticketLimitType", [{ label: "Unlimited", value: "unlimited" }, { label: "Limited", value: "limited" }])}
                                    <div style={{ marginBottom: "20px" }}>
                                        <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px", color: t.textMain }}>Price (INR) *</label>
                                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                            <input type="number" value={postEvent.price || ""} onChange={(e) => setPostEvent(prev => ({ ...prev, price: e.target.value }))} disabled={postEvent.ticketsAreFree} style={{ flex: 1, padding: "8px 12px", borderRadius: "4px", border: `1px solid ${t.border}`, backgroundColor: postEvent.ticketsAreFree ? "#f1f5f9" : t.bg, color: t.textMain, fontSize: "13px" }} />
                                            <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: t.textMain, cursor: "pointer", whiteSpace: "nowrap" }}>
                                                <input type="checkbox" checked={postEvent.ticketsAreFree} onChange={e => setPostEvent(prev => ({ ...prev, ticketsAreFree: e.target.checked, price: e.target.checked ? "0" : prev.price }))} /> Free
                                            </label>
                                        </div>
                                    </div>
                                    {renderToggle("Early Bird*", "earlyBirdDiscount", [{ label: "Off", value: "disable" }, { label: "On", value: "enable" }])}
                                </div>

                                {renderInput("Meeting Url*", "meetingUrl", "url", "Enter Meeting Url", true)}

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "12px" }}>
                                    {renderInput("Event Title*", "title", "text", "Enter Event Name")}
                                    {renderSelect("Category*", "category", eventCategoryNames.map(n => ({ label: n, value: n })))}
                                </div>

                                <div style={{ marginBottom: "16px" }}>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px", color: t.textMain }}>Description*</label>
                                    <textarea value={postEvent.description} onChange={e => setPostEvent(prev => ({ ...prev, description: e.target.value }))} rows={4} style={{ width: "100%", padding: "12px", border: `1px solid ${t.border}`, borderRadius: "4px", backgroundColor: t.bg, color: t.textMain, fontSize: "13px", resize: "vertical", outline: "none" }} />
                                </div>

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ flex: 1, marginRight: "16px" }}>{renderInput("Refund Policy*", "refundPolicy", "text", "Policy Details")}</div>
                                    <button onClick={publishSeatEvent} style={{ padding: "12px 40px", backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 700, cursor: "pointer", height: "42px", marginTop: "4px" }}>Submit Online Event</button>
                                </div>
                            </div>
                        );
                    }
                    // Step 3: Venue Form
                    return (
                        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "12px", border: `1px solid ${t.border}`, maxWidth: "100%" }}>
                            <input type="file" ref={thumbnailInputRef} accept="image/*" onChange={handleBannerChange} style={{ display: "none" }} />

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "20px" }}>
                                {/* Thumbnail Image */}
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px", color: t.textMain }}>Thumbnail Image*</label>
                                    <div style={{ border: `1px solid ${t.border}`, borderRadius: "8px", padding: "12px", textAlign: "center", backgroundColor: t.bg, display: "flex", alignItems: "center", gap: "16px", minHeight: "100px" }}>
                                        <div style={{ width: "120px", height: "80px", borderRadius: "4px", overflow: "hidden", backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            {postEvent.bannerPreview ? (
                                                <img src={postEvent.bannerPreview} alt="Thumbnail" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            ) : <ImageIcon size={32} color="#94a3b8" />}
                                        </div>
                                        <div style={{ textAlign: "left" }}>
                                            <button type="button" onClick={() => thumbnailInputRef.current?.click()} style={{ padding: "6px 12px", backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: "4px", fontSize: "12px", fontWeight: 600, cursor: "pointer", marginBottom: "4px" }}>Choose Image</button>
                                            <p style={{ fontSize: "11px", color: "#f59e0b", margin: 0 }}>Size : 320x230</p>
                                        </div>
                                    </div>
                                </div>
                                {/* Basic Info */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                    {renderToggle("Date Rendering*", "dateType", [{ label: "Single", value: "single" }, { label: "Multiple", value: "multiple" }])}
                                    {renderSelect("Visibility*", "eventStatus", [{ label: "Active", value: "Active" }, { label: "Inactive", value: "Inactive" }])}
                                    {renderSelect("Featured*", "isFeature", [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }])}
                                    {renderSelect("Environment*", "environment", [{ label: "Indoor", value: "Indoor" }, { label: "Outdoor", value: "Outdoor" }])}
                                </div>
                            </div>

                            {postEvent.dateType === "single" ? (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "16px" }}>
                                    {renderInput("Start Date*", "startDate", "date")}
                                    {renderInput("Start Time*", "startTime", "time")}
                                    {renderInput("End Date*", "endDate", "date")}
                                    {renderInput("End Time*", "endTime", "time")}
                                </div>
                            ) : (
                                <div style={{ marginBottom: "20px", padding: "16px", border: `1px dashed ${t.border}`, borderRadius: "12px", backgroundColor: t.cardBg }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                        <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: t.textSub }}>Multiple Date/Time Slots</p>
                                        <button type="button" onClick={() => setPostEvent(prev => ({ ...prev, dateSlots: [...(prev.dateSlots || []), { date: "", time: "" }] }))} style={{ color: "#3b82f6", background: "none", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}><Plus size={14} /> Add Slot</button>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                        {(postEvent.dateSlots || []).length === 0 ? (
                                            <p style={{ fontSize: "12px", color: t.textSub, textAlign: "center", margin: "10px 0" }}>No slots added. Click "Add Slot" to start.</p>
                                        ) : (postEvent.dateSlots || []).map((slot, idx) => (
                                            <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "12px", alignItems: "center" }}>
                                                <input type="date" value={slot.date} onChange={e => {
                                                    const ns = [...postEvent.dateSlots]; ns[idx].date = e.target.value;
                                                    setPostEvent(prev => ({ ...prev, dateSlots: ns }));
                                                }} style={{ padding: "8px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: "13px" }} />
                                                <input type="time" value={slot.time} onChange={e => {
                                                    const ns = [...postEvent.dateSlots]; ns[idx].time = e.target.value;
                                                    setPostEvent(prev => ({ ...prev, dateSlots: ns }));
                                                }} style={{ padding: "8px", borderRadius: "6px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: "13px" }} />
                                                <button type="button" onClick={() => setPostEvent(prev => ({ ...prev, dateSlots: prev.dateSlots.filter((_, i) => i !== idx) }))} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}><Trash2 size={16} /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                {renderInput("Event Title*", "title", "text", "Name of the event")}
                                {renderSelect("Category*", "category", eventCategoryNames.map(n => ({ label: n, value: n })))}
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr auto", gap: "12px", alignItems: "end", marginBottom: "20px" }}>
                                {renderInput("Venue Address*", "venue", "text", "Venue Name / Address")}

                                {renderSelect("Country*", "country", Country.getAllCountries().map(c => ({ label: c.name, value: c.name })))}

                                {renderSelect("State*", "state", !postEvent.countryCode ? [] : State.getStatesOfCountry(postEvent.countryCode).map(s => ({ label: s.name, value: s.name })))}

                                {renderSelect("District*", "district", (!postEvent.countryCode || !postEvent.stateCode) ? [] : City.getCitiesOfState(postEvent.countryCode, postEvent.stateCode).map(c => ({ label: c.name, value: c.name })))}

                                {renderInput("City*", "city", "text", "City / Area")}

                                <button type="button" onClick={() => { setTempLocation({ lat: 28.6139, lng: 77.209 }); setShowMapModal(true); }} style={{ padding: "10px", backgroundColor: "#8b5cf6", color: "#fff", border: "none", borderRadius: "4px", fontSize: "13px", fontWeight: 700, cursor: "pointer", marginBottom: "20px" }}>Open Map</button>
                            </div>

                            <div style={{ marginBottom: "20px", border: `1px solid ${t.border}`, padding: "20px", borderRadius: "12px", backgroundColor: t.bg }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                    <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 800 }}>Ticketing & Seating</h4>
                                    <div style={{ width: "200px" }}>
                                        {renderToggle("", "seatingEnabled", [{ label: "Seats", value: true }, { label: "Standard", value: false }])}
                                    </div>
                                </div>

                                {postEvent.seatingEnabled !== false ? (
                                    <div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                                            {renderInput("Seats per Row*", "cols", "number", "e.g. 10")}
                                            {renderSelect("Seat Map Layout*", "layoutType", [
                                                { label: "Stage-Based", value: "stage" },
                                                { label: "Ground-Based", value: "ground" },
                                                { label: "Rate-Based", value: "rate" }
                                            ])}
                                            <div style={{ fontSize: "12px", color: t.textSub, marginTop: "24px" }}>
                                                Total Rows will be calculated based on categories below.
                                            </div>
                                        </div>
                                        <div style={{ backgroundColor: t.cardBg, borderRadius: "8px", padding: "16px", border: `1px solid ${t.border}` }}>
                                            <p style={{ fontSize: "12px", fontWeight: 700, marginBottom: "12px", color: t.textSub }}>SEATING CATEGORIES (VIP, GOLD, SILVER)</p>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                                {(postEvent.categories || []).map((cat, idx) => (
                                                    <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: "12px", alignItems: "center" }}>
                                                        <input value={cat.name} onChange={e => {
                                                            const nc = [...postEvent.categories]; nc[idx].name = e.target.value;
                                                            setPostEvent(prev => ({ ...prev, categories: nc }));
                                                        }} placeholder="Category Name" style={{ padding: "8px", borderRadius: "4px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: "13px" }} />
                                                        <input type="number" value={cat.rows} onChange={e => {
                                                            const nc = [...postEvent.categories]; nc[idx].rows = e.target.value;
                                                            setPostEvent(prev => ({ ...prev, categories: nc }));
                                                        }} placeholder="Rows" style={{ padding: "8px", borderRadius: "4px", border: `1px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain, fontSize: "13px" }} />
                                                        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                                                            <input type="number" value={cat.price} disabled={cat.isFree} onChange={e => {
                                                                const nc = [...postEvent.categories]; nc[idx].price = e.target.value;
                                                                setPostEvent(prev => ({ ...prev, categories: nc }));
                                                            }} placeholder="Price" style={{ width: "100%", padding: "8px", borderRadius: "4px", border: `1px solid ${t.border}`, backgroundColor: cat.isFree ? t.border : t.bg, color: t.textMain, fontSize: "13px" }} />
                                                            <label style={{ display: "flex", alignItems: "center", fontSize: "11px", color: t.textSub, cursor: "pointer" }}>
                                                                <input type="checkbox" checked={cat.isFree} onChange={e => {
                                                                    const nc = [...postEvent.categories]; nc[idx].isFree = e.target.checked;
                                                                    if (e.target.checked) nc[idx].price = 0;
                                                                    setPostEvent(prev => ({ ...prev, categories: nc }));
                                                                }} />Free
                                                            </label>
                                                        </div>
                                                        <button type="button" onClick={() => setPostEvent(prev => ({ ...prev, categories: prev.categories.filter((_, i) => i !== idx) }))} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}><Trash2 size={16} /></button>
                                                    </div>
                                                ))}
                                                <button type="button" onClick={() => setPostEvent(prev => ({ ...prev, categories: [...(prev.categories || []), { name: "Bronze", price: 200, rows: 2, isFree: false }] }))} style={{ color: "#3b82f6", background: "none", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", width: "fit-content" }}><Plus size={14} /> Add Category</button>
                                            </div>
                                        </div>

                                        {/* Live Preview Section */}
                                        <div style={{ marginTop: "24px" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                                <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: t.textSub, textTransform: "uppercase", letterSpacing: "1px" }}>Live Map Preview</p>
                                                <span style={{ fontSize: "10px", color: "#3b82f6", fontWeight: 700, backgroundColor: "#3b82f615", padding: "2px 8px", borderRadius: "100px" }}>Real-time</span>
                                            </div>
                                            {renderSeatVisualization(postEvent, true)}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                                        {renderInput("Total Capacity*", "normalTicketCapacity", "number", "e.g. 500")}
                                        <div style={{ marginBottom: "20px" }}>
                                            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px", color: t.textMain }}>Ticket Price (₹)*</label>
                                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                                <input type="number" value={postEvent.normalTicketPrice || ""} onChange={(e) => setPostEvent(prev => ({ ...prev, normalTicketPrice: e.target.value }))} disabled={postEvent.ticketsAreFree} style={{ flex: 1, padding: "8px 12px", borderRadius: "4px", border: `1px solid ${t.border}`, backgroundColor: postEvent.ticketsAreFree ? "#f1f5f9" : t.bg, color: t.textMain, fontSize: "13px" }} />
                                                <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: t.textMain, cursor: "pointer", whiteSpace: "nowrap" }}>
                                                    <input type="checkbox" checked={postEvent.ticketsAreFree} onChange={e => setPostEvent(prev => ({ ...prev, ticketsAreFree: e.target.checked, normalTicketPrice: e.target.checked ? "0" : prev.normalTicketPrice }))} /> Free
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ marginBottom: "20px" }}>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "8px", color: t.textMain }}>Event Description*</label>
                                <textarea value={postEvent.description} onChange={e => setPostEvent(prev => ({ ...prev, description: e.target.value }))} rows={4} style={{ width: "100%", padding: "12px", border: `1px solid ${t.border}`, borderRadius: "4px", backgroundColor: t.bg, color: t.textMain, fontSize: "13px", resize: "vertical", outline: "none" }} />
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-end" }}>
                                {publishError && (
                                    <div style={{ padding: "10px 16px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", fontSize: "13px", fontWeight: 600, maxWidth: "500px", width: "100%" }}>
                                        ⚠️ {publishError}
                                    </div>
                                )}
                                <button onClick={publishSeatEvent} style={{ padding: "12px 48px", backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)" }}>Publish Event</button>
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
                                    {renderSeatVisualization(selectedEventForSeatMap)}
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
                                                        <div style={{ fontSize: "14px", fontWeight: 700, color: t.textMain }}>{ev.dateSlots?.length > 1 ? `${ev.dateSlots.length} Dates` : (ev.date || "—")}</div>
                                                        <div style={{ fontSize: "12px", color: t.textSub }}>{ev.dateSlots?.length > 1 ? "Multiple Slots" : (ev.time || "—")}</div>
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
                                                        <div style={{ fontSize: "14px", fontWeight: 700, color: t.textMain }}>{ev.dateSlots?.length > 1 ? `${ev.dateSlots.length} Dates` : (ev.date || "—")}</div>
                                                        <div style={{ fontSize: "12px", color: t.textSub }}>{ev.dateSlots?.length > 1 ? "Multiple Slots" : (ev.time || "—")}</div>
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
                        <div style={{ padding: isStaff ? "0 16px" : "0" }}>
                            {!isStaff && <Breadcrumb title="PWA Ticket Scanner" />}
                            <div className="pwa-scanner-grid">
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
                                        </div>

                                        {pwaCameraOpen && (
                                            <div style={{ padding: "24px", borderRadius: "16px", backgroundColor: theme === "light" ? "#f8fafc" : "#0f172a", border: `2px solid #3b82f6` }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                                    <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: t.textMain }}>Scanner Active</p>
                                                    <button type="button" onClick={() => setPwaCameraOpen(false)} style={{ background: "none", border: "none", color: "#ef4444", fontWeight: 700, cursor: "pointer", fontSize: "13px" }}>Close Camera</button>
                                                </div>
                                                <div id="pwa-qr-reader" style={{ width: "100%", maxWidth: "400px", margin: "0 auto", borderRadius: "12px", overflow: "hidden", backgroundColor: "#000" }}></div>
                                            </div>
                                        )}

                                        <div>
                                            <label style={{ display: "block", fontSize: "13px", fontWeight: 800, color: t.textSub, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>Manual Validation</label>
                                            <div className="manual-validation-box" style={{ display: "flex", gap: "12px" }}>
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

                                <div className="scan-table-desktop" style={{ overflowX: "auto" }}>
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

                                <div className="scan-cards-mobile" style={{ display: "none" }}>
                                    {recentScans.length === 0 ? (
                                        <div style={{ textAlign: "center", padding: "32px", color: t.textSub }}>No scans yet</div>
                                    ) : (
                                        recentScans.map(b => (
                                            <div key={b._id} style={{ backgroundColor: t.bg, padding: "16px", borderRadius: "16px", border: `1px solid ${t.border}` }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                                                    <span style={{ fontSize: "12px", fontWeight: 800, color: t.textSub, backgroundColor: t.cardBg, padding: "4px 8px", borderRadius: "6px" }}>#{b._id.slice(-8).toUpperCase()}</span>
                                                    <div style={{ color: "#22c55e", fontSize: "12px", fontWeight: 800, display: "flex", alignItems: "center", gap: "4px" }}>
                                                        <CheckCircle size={14} /> Valid
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: "15px", fontWeight: 800, color: t.textMain, marginBottom: "4px" }}>{b.eventName || "—"}</div>
                                                <div style={{ fontSize: "13px", fontWeight: 600, color: t.textSub }}>{b.userName || "Guest User"}</div>
                                                <div style={{ fontSize: "12px", color: t.textSub, opacity: 0.7, marginTop: "8px" }}>{new Date(b.scannedAt || b._creationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
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

                case "staff_accounts": {
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
                            <Breadcrumb title="Staff Accounts" />
                            <div style={{ backgroundColor: t.cardBg, padding: "32px", borderRadius: "16px", border: `1px solid ${t.border}`, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                                    <div>
                                        <h3 style={{ fontSize: "24px", fontWeight: 800, color: t.textMain, margin: 0 }}>Staff Management</h3>
                                        <p style={{ fontSize: "14px", color: t.textSub, marginTop: "4px" }}>Manage staff access for the mobile scanner application.</p>
                                    </div>
                                    <button
                                        onClick={() => { setEditingStaffId(null); setStaffFormData({ name: "", email: "", password: "" }); setShowStaffModal(true); }}
                                        style={{ backgroundColor: "#3b82f6", color: "#fff", padding: "12px 24px", borderRadius: "10px", border: "none", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                                    >
                                        <Plus size={20} /> Add Staff
                                    </button>
                                </div>

                                {staffAccounts.length === 0 ? (
                                    <div style={{ padding: "64px 32px", textAlign: "center", backgroundColor: t.bg, borderRadius: "20px", border: `2px dashed ${t.border}` }}>
                                        <div style={{ width: "64px", height: "64px", borderRadius: "20px", backgroundColor: "#3b82f610", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                                            <Users size={32} color="#3b82f6" />
                                        </div>
                                        <h4 style={{ fontSize: "18px", fontWeight: 800, color: t.textMain, margin: "0 0 8px" }}>No Staff Accounts</h4>
                                        <p style={{ fontSize: "14px", color: t.textSub, maxWidth: "320px", margin: "0 auto", lineHeight: 1.5 }}>Create staff accounts to allow your team to scan tickets using the mobile app.</p>
                                    </div>
                                ) : (
                                    <div style={{ overflowX: "auto" }}>
                                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                            <thead>
                                                <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                                                    <th style={{ textAlign: "left", padding: "16px", color: t.textSub, fontSize: "13px", fontWeight: 800, textTransform: "uppercase" }}>Staff Member</th>
                                                    <th style={{ textAlign: "left", padding: "16px", color: t.textSub, fontSize: "13px", fontWeight: 800, textTransform: "uppercase" }}>Username/Email</th>
                                                    <th style={{ textAlign: "left", padding: "16px", color: t.textSub, fontSize: "13px", fontWeight: 800, textTransform: "uppercase" }}>Password</th>
                                                    <th style={{ textAlign: "left", padding: "16px", color: t.textSub, fontSize: "13px", fontWeight: 800, textTransform: "uppercase" }}>Created</th>
                                                    <th style={{ textAlign: "right", padding: "16px", color: t.textSub, fontSize: "13px", fontWeight: 800, textTransform: "uppercase" }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {staffAccounts.map((s) => (
                                                    <tr key={s._id} style={{ borderBottom: `1px solid ${t.border}` }}>
                                                        <td style={{ padding: "16px" }}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                                <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#3b82f620", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>{s.name.charAt(0)}</div>
                                                                <span style={{ fontWeight: 700, color: t.textMain }}>{s.name}</span>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: "16px", color: t.textMain, fontWeight: 600 }}>{s.email}</td>
                                                        <td style={{ padding: "16px", color: t.textMain, fontFamily: "monospace" }}>{s.password}</td>
                                                        <td style={{ padding: "16px", color: t.textSub, fontSize: "13px" }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                                                        <td style={{ padding: "16px", textAlign: "right" }}>
                                                                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingRight: "8px" }}>
                                                                        <button
                                                                            onClick={() => { setEditingStaffId(s._id); setStaffFormData({ name: s.name, email: s.email, password: s.password }); setShowStaffModal(true); }}
                                                                            style={{ border: "none", background: "#3b82f610", color: "#3b82f6", padding: "10px", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                                                                            title="Edit Staff"
                                                                        >
                                                                            <Settings size={18} />
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => { 
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                setDeletingStaffId(s._id);
                                                                            }}
                                                                            style={{ border: "none", background: "#ef444415", color: "#ef4444", padding: "10px", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                                                                            title="Delete Staff"
                                                                        >
                                                                            <Trash2 size={18} />
                                                                        </button>
                                                                    </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Custom Deletion Confirmation Modal */}
                            {deletingStaffId && (
                                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "20px" }}>
                                    <div style={{ backgroundColor: t.cardBg, padding: "32px", borderRadius: "24px", width: "100%", maxWidth: "400px", border: `1px solid ${t.border}`, textAlign: "center" }}>
                                        <div style={{ width: "64px", height: "64px", borderRadius: "20px", backgroundColor: "#ef444410", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                                            <Trash2 size={32} color="#ef4444" />
                                        </div>
                                        <h3 style={{ fontSize: "20px", fontWeight: 800, color: t.textMain, margin: "0 0 8px" }}>Delete Staff Account?</h3>
                                        <p style={{ fontSize: "14px", color: t.textSub, margin: "0 0 24px", lineHeight: 1.5 }}>This action cannot be undone. The staff member will lose access to the scanner app.</p>
                                        <div style={{ display: "flex", gap: "12px" }}>
                                            <button 
                                                onClick={() => setDeletingStaffId(null)}
                                                style={{ flex: 1, padding: "12px", borderRadius: "10px", border: `1px solid ${t.border}`, background: "none", color: t.textMain, fontWeight: 700, cursor: "pointer" }}
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={async () => {
                                                    try {
                                                        const idToDelete = deletingStaffId;
                                                        setDeletingStaffId(null);
                                                        await deleteStaffMutation({ id: idToDelete });
                                                    } catch (err) {
                                                        alert("Failed to delete staff account: " + err.message);
                                                    }
                                                }}
                                                style={{ flex: 1, padding: "12px", borderRadius: "10px", backgroundColor: "#ef4444", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}
                                            >
                                                Delete
                                            </button>
                                    </div>
                                </div>
                            </div>
                        )}
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
                {/* Staff Modal */}
                {showStaffModal && (
                    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
                        <div style={{ backgroundColor: t.cardBg, padding: "32px", borderRadius: "24px", width: "100%", maxWidth: "480px", border: `1px solid ${t.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                                <h2 style={{ fontSize: "24px", fontWeight: 800, color: t.textMain }}>{editingStaffId ? "Edit Staff Account" : "Add Staff Account"}</h2>
                                <button onClick={() => setShowStaffModal(false)} style={{ background: "none", border: "none", color: t.textSub, cursor: "pointer" }}><X size={24} /></button>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: t.textMain }}>Full Name</label>
                                    <input
                                        type="text"
                                        placeholder="Enter staff name"
                                        value={staffFormData.name}
                                        onChange={(e) => setStaffFormData(prev => ({ ...prev, name: e.target.value }))}
                                        style={{ width: "100%", padding: "14px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: t.textMain }}>Username / Email</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. staff_john"
                                        value={staffFormData.email}
                                        onChange={(e) => setStaffFormData(prev => ({ ...prev, email: e.target.value }))}
                                        style={{ width: "100%", padding: "14px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: t.textMain }}>Password</label>
                                    <input
                                        type="text"
                                        placeholder="Set access password"
                                        value={staffFormData.password}
                                        onChange={(e) => setStaffFormData(prev => ({ ...prev, password: e.target.value }))}
                                        style={{ width: "100%", padding: "14px", borderRadius: "10px", border: `1.5px solid ${t.border}`, backgroundColor: t.bg, color: t.textMain }}
                                    />
                                </div>
                                <button
                                    onClick={async () => {
                                        try {
                                            if (!staffFormData.name || !staffFormData.email || !staffFormData.password) { alert("Please fill all fields"); return; }

                                            await import("@/app/utils/hashPassword").then(async ({ hashPassword }) => {
                                                const hashedPassword = await hashPassword(staffFormData.password);
                                                if (editingStaffId) {
                                                    await updateStaffMutation({ id: editingStaffId, ...staffFormData, password: hashedPassword });
                                                } else {
                                                    await createStaffMutation({ ...staffFormData, password: hashedPassword, organiserId: effectiveEmail });
                                                }
                                                setShowStaffModal(false);
                                                setStaffFormData({ name: "", email: "", password: "" });
                                                setEditingStaffId(null);
                                            });
                                        } catch (err) {
                                            alert(err.message || "Failed to save staff account");
                                        }
                                    }}
                                    style={{ width: "100%", padding: "16px", borderRadius: "12px", backgroundColor: "#3b82f6", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", marginTop: "12px" }}
                                >
                                    {editingStaffId ? "Update Account" : "Create Account"}
                                </button>
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
                            <img src="/logo.png" alt="Logo" style={{ height: "48px", objectFit: "contain", filter: theme === 'dark' ? 'invert(1) brightness(2)' : 'none' }} />
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
                            <p className="sidebar-profile-role">{user?.role === "staff" ? "Event Staff" : "Organizer"}</p>
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
                        {!isStaff && (
                            <>
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
                            </>
                        )}

                        <button onClick={() => setActiveTab("pwa_scanner")} className={`sidebar-item ${activeTab === "pwa_scanner" ? "active" : ""}`}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <Monitor size={20} />
                                <span>Pwa Scanner</span>
                            </div>
                        </button>

                        {!isStaff && (
                            <>
                                <button onClick={() => setActiveTab("staff_accounts")} className={`sidebar-item ${activeTab === "staff_accounts" ? "active" : ""}`}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <Users size={20} />
                                        <span>Staff Accounts</span>
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
                            </>
                        )}

                        <button onClick={() => setActiveTab("change_password")} className={`sidebar-item ${activeTab === "change_password" ? "active" : ""}`}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <Lock size={20} />
                                <span>Change Password</span>
                            </div>
                        </button>

                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                router.push('/signin');
                                setTimeout(() => logout(), 100);
                            }}
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
                    {isStaff && (
                        <div className="mobile-header">
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <QrCode size={18} color="#fff" />
                                </div>
                                <span style={{ fontWeight: 800, fontSize: "16px", color: t.textMain }}>Staff Portal</span>
                            </div>
                            <button
                                onClick={logout}
                                style={{ background: "none", border: "none", color: "#ef4444", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                            >
                                <LogOut size={16} /> Logout
                            </button>
                        </div>
                    )}
                    <header className="top-header">
                        <div>
                            <h1 style={{ fontSize: "20px", fontWeight: 800, color: t.textMain, margin: 0 }}>{activeTab.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</h1>
                            <p style={{ fontSize: "12px", color: t.textSub, margin: 0, opacity: 0.8 }}>Welcome back, {profile.firstName || "Organiser"}! Here's what's happening today.</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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

                    {isStaff && (
                        <div className="bottom-nav">
                            <button 
                                className={`bottom-nav-item ${activeTab === "pwa_scanner" ? "active" : ""}`}
                                onClick={() => setActiveTab("pwa_scanner")}
                            >
                                <Camera size={24} />
                                <span>Scanner</span>
                            </button>
                            <button 
                                className={`bottom-nav-item ${activeTab === "support_tickets" ? "active" : ""}`}
                                onClick={() => setActiveTab("support_tickets")}
                            >
                                <LifeBuoy size={24} />
                                <span>Support</span>
                            </button>
                            <button 
                                className={`bottom-nav-item ${activeTab === "settings" ? "active" : ""}`}
                                onClick={() => setActiveTab("settings")}
                            >
                                <Settings size={24} />
                                <span>Settings</span>
                            </button>
                        </div>
                    )}
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
                        justifyContent: "flex-start",
                        gap: "10px",
                        padding: '10px 4px',
                        textDecoration: "none",
                        transition: 'all 0.3s ease'
                    }}>
                        <img
                            src="/logo.png"
                            alt="Logo"
                            style={{
                                height: "56px",
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
                    onClick={(e) => {
                        e.preventDefault();
                        router.push('/signin');
                        setTimeout(() => logout(), 100);
                    }}
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

    const renderModals = () => (
        <>
            {showGstModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", padding: "20px" }}>
                    <div style={{ backgroundColor: "#fff", borderRadius: "8px", maxWidth: "600px", width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
                        <div style={{ padding: "20px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>GST Declaration</h2>
                        </div>
                        <div style={{ padding: "20px", overflowY: "auto", fontSize: "13px", color: "#475569", lineHeight: "1.6" }}>
                            <p>I/We, the undersigned Organizer, hereby confirm and acknowledge that As per Section 24(1X) of the CGST Act, 2017, I am/We operate as a supplier rendering services through an e- ticketing platform. I/We further confirm that I/We are not registered under the GST Act, since our annual turnover is below the threshold limit of Rs. 20 Lakhs (supplier supply only services).</p>
                            <p>I/We hereby affirm that any applicable taxes collected on the Tickets booked through <a href="https://www.bookmyticket.io" style={{ color: "#3b82f6" }}>www.bookmyticket.io</a>, and/or its mobile application and/ or any application that is to be part of BookMyTicket Event Tech Pvt. Ltd, are our liability and shall be properly discharged by us.</p>
                            <p>I/We acknowledge that the information provided above is true to the best of my/our knowledge, and I/We consent to be bound by any legal actions of the duly appointed attorney. If any of the information provided above is later found to be incorrect, I understand that my membership with your platform will be terminated, and any outstanding payments or unprocessed bills will be withheld by you based on the information provided.</p>
                            <p>Additionally, I/We shall indemnify and hold harmless you and your officers, representatives, affiliates, successors, and assigns against all costs, penalties, damages, or losses, or any other charges, penalties, or liabilities incurred in relation to any claim raised pursuant to the following:</p>
                            <ul style={{ paddingLeft: "20px", margin: "10px 0" }}>
                                <li>Breach, violation, or non-compliance of any of the provisions contained in this declaration.</li>
                                <li>Any act of omission or commission pursuant to which any of the representations given become untrue.</li>
                                <li>Violation of any applicable law, including GST laws.</li>
                                <li>Non-compliance with GST laws.</li>
                                <li>Any investigations, inquiries, summons, or inspections conducted by any authority.</li>
                            </ul>
                            <p>Furthermore, I/We commit to informing you of any subsequent changes in the structure or operations of our business entity that holds membership with your platform. Any such changes affecting the accuracy of the answers given herein will be promptly communicated to you.</p>
                        </div>
                        <div style={{ padding: "16px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end" }}>
                            <button onClick={() => setShowGstModal(false)} style={{ padding: "8px 24px", background: "#f43f5e", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {showVendorModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", padding: "20px" }}>
                    <div style={{ backgroundColor: "#fff", borderRadius: "8px", maxWidth: "800px", width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
                        <div style={{ padding: "20px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>USER AGREEMENT</h2>
                        </div>
                        <div style={{ padding: "20px", overflowY: "auto", fontSize: "12px", color: "#334155", lineHeight: "1.6" }}>
                            <h3>1. SELLER T&C</h3>
                            <p>This agreement is made on this 8 day of March, 2026 between, BookMyTicket Tech Event Private Ltd, a company incorporated under the Indian Companies Act, 2013 having its registered office located at Coimbatore (hereinafter referred to as 'BookMyTicket', which expression shall unless repugnant to the context or meaning thereof be deemed to include a reference to its successors and permitted assigns);</p>
                            <p>And Raja Vasudevan, a Company incorporated under the the Companies Act 2013 or an individual having its registered office located at Pollachi PAN:DPIPR3985B/ GST: - (hereinafter referred to as 'Event Manager' which expression shall unless repugnant to the context or meaning thereof be deemed to include a reference to its successors and permitted assigns);</p>
                            <p>BookMyTicket and Event Manager shall hereinafter be individually referred to as a 'Party' and collectively as the 'Parties'.</p>

                            <h4>Recitals:</h4>
                            <p>The Event (as defined below) is the property of Event Manager and Event Manager has been appointed to organize the Event. BookMyTicket is engaged in the business of rendering ticket booking services through online platform channels of BookMyTicket, which enable customers to reserve / book tickets to various entertainment events without accessing physical points of booking / sale of the tickets to such events.</p>
                            <p>The Parties are entering into this Agreement in order to record the terms and conditions based on which, BookMyTicket shall facilitate remote booking of tickets for the Event (as defined below) being organized by the Event Manager and other matters in connection therewith.</p>

                            <h4>1. DEFINITIONS:</h4>
                            <p>The following capitalized words and expressions, whenever used in this Agreement, unless repugnant to the meaning or context thereof, shall have the respective meanings set forth below: 'Confidential Information' shall include, but is not limited to inventions, ideas, concepts, know-how, techniques, processes, designs, specifications, drawings, patterns, diagrams, flowcharts, data, Intellectual Property Rights, manufacturing techniques, computer software, methods, procedures, materials, operations, reports, studies, and all other technical and business information in oral, written, electronic, digital or physical form that is disclosed by either Party and its directors, employees, advisors and consultants and vice versa under this Agreement and any other agreements/documents and/or transactions contemplated between the Parties under this Agreement; 'Customers' shall mean the customers who have booked Tickets through a Platform; 'Event' shall mean all events done by the organizer at the Venue; 'Event Date' shall mean all dates of the event; 'Intellectual Property Rights' shall mean all rights and interests, vested or arising out of any industrial or intellectual property, whether protected at common law or under statute, which includes (without limitation) any rights and interests in formats of inventions, copyrights, designs, trademarks, trade-names, knowhow, business names, logos, processes, developments, licenses, trade secrets, goodwill, manufacturing techniques, specifications, patterns, drawings, computer software, technical information, research data, concepts, methods, procedures, designs and any other knowledge of any nature whatsoever throughout the world, and including all applications made for the aforesaid, rights to apply in future and any amendments/modifications, renewals, continuations and extensions in any state, country or jurisdiction and all other intellectual property rights whether available at this time and/or in future; 'Losses' means all liabilities, obligations, losses, damages, penalties, actions, judgments, suits, proceedings, costs, expenses and disbursements of any kind or nature whatsoever (including all reasonable costs and expenses of attorneys and the defense, appeal and settlement of any and all suits, actions or proceedings instituted or threatened) and all costs of investigation in connection therewith; 'Ticket' shall mean a ticket or reservation (whether in physical or electronic form, as permitted under law) that allows the holder thereof access to the Event, on the Event date, time and venue identified in such ticket or reservation; Privileged and Confidential 'Venue' shall mean all venues at which the event will take place.</p>

                            <h4>2. APPOINTMENT AND SERVICES:</h4>
                            <p>2.1. hereby appoints BookMyTicket for providing the Services (as defined hereinafter). BookMyTicket hereby agrees and undertakes that it shall (a) facilitate the booking of Tickets through the Platforms (as defined hereinbelow); and It is clarified that:</p>
                            <p>2.2. BookMyTicket is a service provider and the sale of Tickets shall at all times be concluded between the Event Manager and the Customer. Accordingly, the Ticket issued to Customers shall be on behalf of the Event Manager; and</p>
                            <p>2.3. BookMyTicket is not responsible for booking or sale of Tickets through any medium or at any location (such as the Venue or other any physical points of sale) other than the following platforms ('Platforms'):</p>
                            <ul style={{ paddingLeft: "20px" }}>
                                <li>i. websites owned or controlled by BookMyTicket (including 'www.bookmyticket.io') accessible through computers or WAP or GPRS enabled mobile phones;</li>
                                <li>ii. mobile applications of BookMyTicket;</li>
                                <li>iii. voice and data channels (including IVRs) to be facilitated by BookMyTicket;</li>
                                <li>iv. any platforms owned and/or operated by third party(ies) associated with BookMyTicket; and</li>
                                <li>v. any other booking medium that BookMyTicket may introduce in future.</li>
                            </ul>

                            <h4>3. DUTIES OF EVENT MANAGER:</h4>
                            <p>3.1. The Event Manager shall:<br />
                                (a) notify BookMyTicket of all discounts, schemes and benefits that it intends to offer in relation to Tickets at online itself at event manager convenience and in case of totally taking care by BookMyTicket for marketing and sale such cases ;<br />
                                (b) obtain all necessary approvals, permissions, licenses, no-objections, clearances etc. from the relevant governmental authorities as may be required to hold the Event in accordance with law and availing the Services, at its sole expense and cost;<br />
                                (c) comply with all laws applicable to the Event in all respects;<br />
                                (d) immediately notify BookMyTicket, if it discontinues or modifies any aspects of the Event (including any services / facilities associated with the Event) and/or Facilities;<br />
                                (e) ensure the safety of Customers throughout the Event and undertake necessary measures and actions for such purpose and be solely responsible for any loss, damage or injury caused to Customers without any recourse to BookMyTicket;<br />
                                (f) promptly notify BookMyTicket of any delay, postponement or cancellation of the Event or any events, facts, circumstances or developments that may be reasonably likely to result in any delay, postponement or cancellation of the Event;<br />
                                (g) defend at its cost, any suit, claim or action brought against BookMyTicket in connection with the Services or the Event having regard to the expense and effort that the Event Manager would have reasonably invested as if the said suit, claim or action has been brought against it;<br />
                                (h) it will provide such information as BookMyTicket reasonably requests and shall otherwise cooperate with BookMyTicket in order to give full effect to the provisions/terms of this Agreement;<br />
                                (i) engage the services of a reputed security agency to provide external physical security at the Venue on the Event Date;<br />
                                (j) reimburse the full cost and expense of any loss, damage or injury caused to property or personnel (whether owned or contracted) made available by BookMyTicket at the Venue, for the purpose of the Event.</p>
                            <p>3.2. Without prejudice to any rights of BookMyTicket, Event Manager shall promptly notify BookMyTicket if it is unable to fulfill its obligations mentioned above, whether or not on account of reasons attributable to it.</p>

                            <h4>4. DUTIES OF BOOKMYTICKET:</h4>
                            <p>4.1. BookMyTicket shall render the Services in a professional and competent manner.</p>

                            <h4>5. REPRESENTATIONS AND WARRANTIES:</h4>
                            <p>Each Party represents and warrants to the other that:<br />
                                5.1. It is duly organized, validly constituted under the laws applicable to it and is in good standing and that it has full authority and necessary approvals as required under law, contract and its charter documents to enter into this Agreement and to perform its obligations hereunder according to the terms hereof; and<br />
                                5.2. That execution and delivery of this Agreement and the performance by it of its obligations under this Agreement have been duly and validly authorized by all necessary corporate or other action as may be required by it. This Agreement constitutes legal, valid, and binding obligation of such Party, enforceable against it in accordance with the terms hereof.</p>

                            <h4>6. CONSIDERATION AND PAYMENT TERMS:</h4>
                            <p>6.1. BookMyTicket will charge a fixed commission fee of 4% calculable on total Ticketing revenue as consideration towards provision of Services ('Commission Fee').<br />
                                6.2. BookMyTicket is entitled to charge a booking fee to the Customers transacting on its Platforms.<br />
                                6.3. The following terms shall be applicable to payments to be made under this Agreement:<br />
                                (a) BookMyTicket shall release the amount collected by it on account of booking of Tickets through the Platforms to Event Manager on the date or within such time as mentioned in Schedule 2 of this Agreement post deduction of its Commission Fee and/or Consideration.<br />
                                (b) Upon completion of the Event, BookMyTicket shall raise an invoice on the Event Manager for the amount of Consideration.</p>

                            <h4>7. CANCELLATION OF EVENT:</h4>
                            <p>7.1. If due to any reason whatsoever (other than due a force majeure event) whether or not attributable to the Event Manager, the Event is canceled, not held at the time or venue originally publicized or delayed past the Event Date or if there is any material change to the Event that entitles customers to seek refunds for the Tickets booked through the Platforms, BookMyTicket shall charge an amount as mentioned in Schedule 2 of this Agreement as a cancellation charge ('Cancellation Charge').<br />
                                7.2. In the event any refund of the Ticket price and any other costs ('Refund Amount') are required to be processed by BookMyTicket, the Event Manager shall remit to BookMyTicket an amount equivalent to the Refund Amount within five (5) working days of being notified by BookMyTicket in this regard. In the event that the Event Manager fails to refund the Refund Amount to BookMyTicket within such five (5) working days, then without prejudice to its other rights, BookMyTicket shall be entitled to adjust the same against the Advance Amount and amounts pending release to the Event Manager under this Agreement, if any.</p>

                            <h4>8. LIMITATION OF LIABILITY OF BOOKMYTICKET:</h4>
                            <p>8.1. In no event shall BookMyTicket, nor any employee, officer, affiliate, director, shareholder, agent or sub- contractor acting on behalf of BookMyTicket be liable to any third party for any direct, indirect, incidental, special, punitive, or consequential damages, or lost profits, earnings, or business opportunities, or expenses or costs, even if advised of the possibility thereof, resulting directly or indirectly from, or otherwise arising (however arising, including negligence) out of the performance of this Agreement, including, but not limited to, damages resulting from or arising out of the omissions, interruptions, errors, defects, delays in operation, non-deliveries, mis-deliveries, transmissions by third parties, resulting in any failure of the performance of BookMyTicket. BookMyTicket shall have no liability whatsoever to or any third party in any circumstances. Event Manager shall be solely responsible for the accuracy of all information relating to the Event including validity of the Ticket prices and any other charges and/or other information relating to the Services. Other than as expressly provided in this Agreement, BookMyTicket shall not be responsible for any delivery, after-sales service, payment, invoicing or collection, Customer enquiries (not limited to sales enquiries), technical support maintenance services and/or any other obligations relating to or in respect of the Services unless it is directly related to the Services. Such services shall be the sole responsibility of the Event Manager and the Event Manager shall bear any and all expenses and/or costs relating thereto.</p>

                            <h4>9. INTELLECTUAL PROPERTY RIGHTS:</h4>
                            <p>9.1. Subject to Clause 9.2., each Party agrees and acknowledges that all the copyrights, trademarks, proprietary and/or licensed software, service marks and trade secrets ('Intellectual Property') of each Party while conducting the business contemplated under this Agreement shall always belong to such respective Party.<br />
                                9.2. A Party shall be permitted to display the name and / or trademark of the other Party solely on advertisements, promotional material or collateral relating to the Event issued by or on its behalf the Party and for no other purpose. In respect of BookMyTicket's proprietary marks, Event Manager shall obtain prior written permission to use BookMyTicket's display the name and / or trademark and shall only utilize approved logos.<br />
                                9.3. Each Party agrees that it shall not do or commit any acts of commission or omission, which would impair and/or adversely affect the other Party's rights, ownership and title in its Intellectual Property or the reputation / goodwill attached to its trademarks, trade names and corporate name.<br />
                                9.4. Nothing stated herein shall constitute an agreement to transfer, assign or license or to grant any Intellectual Property of any Party to the other Party. Neither Party shall use the Intellectual Property of the other Party other than in accordance with Clause 9.2, without the prior written consent of the other Party.</p>

                            <h4>10. TERM:</h4>
                            <p>10.1. Unless extended mutually in writing by the Parties, this Agreement shall be valid for the period mentioned in Schedule II of this Agreement.<br />
                                10.2. A Party may terminate this Agreement immediately by notice, if despite notice of breach from the non- defaulting Party, the defaulting Party has not cured the breach within a period of 10 (ten) working days of being notified of the breach as aforesaid.<br />
                                10.3. Either Party may terminate this Agreement at any time by providing the other Party with a thirty (30) days' prior written notice.<br />
                                10.4. Upon receipt of a termination notice from the Event Manager, BookMyTicket shall be entitled to immediately discontinue the display of advertisements relating to the Event displayed on its Platforms, if any.<br />
                                10.5. Termination of this Agreement shall be without prejudice to any rights accrued by Parties prior to termination hereof.</p>

                            <h4>11. LIABILITY:</h4>
                            <p>Any delay or failure in the performance by BookMyTicket under this Agreement shall be excused and shall be without liability if and to the extent caused by a technical or other failure of any of the Platforms for reasons that are beyond the reasonable anticipation or control of BookMyTicket, despite BookMyTicket's reasonable efforts to prevent, avoid, delay or mitigate the effect of such occurrence.</p>

                            <h4>12. INDEMNITY AND LIABILITY:</h4>
                            <p>12.1. It is hereby clarified that the Platforms are only a medium through which the Event Manager has chosen to promote the Event and any dispute or claim of the customers regarding the organization of the Event shall be resolved directly by the Event Manager, with the customers, without any reference to BookMyTicket, except for the purpose of processing any refunds to customers who have made bookings using a Platform provided that the Event Manager shall have reimbursed to BookMyTicket the relevant amount to be refunded in advance.<br />
                                12.2. In the event any suit, claim or action is brought against BookMyTicket in connection with the Event, such suit, claim or action shall be defended by the Event Manager at its cost having regard to the cost and effort that the Event Manager would bear the cost of the said suit, claim or action brought against it.<br />
                                12.3. Each Party agrees to indemnify and hold harmless the other for any losses caused / suffered to such other due to any breach of the representations, warranties and covenants of such Party. No Party shall be liable for any losses of the other Party that are indirect or remote.<br />
                                12.4. This Clause shall survive and continue even after the termination of this Agreement.</p>

                            <h4>13. CONFIDENTIALITY:</h4>
                            <p>13.1. In connection with this Agreement, the Parties may exchange proprietary / confidential information / Intellectual Property (the 'Confidential Information'). Each Party agrees that during the Term of this Agreement it will:<br />
                                (i) only disclose Confidential Information to its employees, officers, directors, agents and contractors (collectively 'Representatives') on a need to know basis, provided, the receiving Party ensures that such Representatives are aware of and comply with the obligations of confidentiality prior to such disclosure;<br />
                                (ii) not disclose any Confidential Information to any person other than as permitted under (iii), without the prior written consent of the disclosing Party.<br />
                                Provided that the aforesaid shall not be applicable and shall impose no obligation on a Party with respect to any portion of Confidential Information which was either at the time received or which thereafter becomes, through no act or failure on the part of such Party, generally known or available to the public; and/or has been disclosed pursuant to the requirements of any statute/ law or a court/ tribunal order. All customer data collected by BookMyTicket or in the possession of BookMyTicket shall be retained by BookMyTicket and Event Manager shall not claim any right, title, interest whatsoever over such property.<br />
                                13.2. This Clause 13 shall survive and continue even after the termination of this Agreement.</p>

                            <h4>14. Force Majeure:</h4>
                            <p>14.1. Neither Party will be liable for failure to perform the obligations directly as a consequence of an unforeseeable event which is beyond the reasonable control of the affected Party, such as an act of God, natural disasters, riots, warfare, change in law, administrative or executive order, judicial order, government restrictions, lock downs, change in law and any event of like nature, outbreak of disease including but not limited to epidemic, pandemic and which essentially suspends the performance of the Agreement ('Force Majeure').<br />
                                14.2. In the event a Force Majeure scenario shall continue unabated for a period of 30 days, the Party suffering such Force Majeure event hereto shall have the right to terminate this Agreement by furnishing written notice to the other with immediate effect, OR, the Parties may mutually decide to extend the Agreement on mutually agreed terms</p>

                            <h4>15. TAXES:</h4>
                            <p>15.1. Each Party shall be responsible for payment of its respective income tax(es) or other applicable tax(es), including and not restricting Goods Service Tax ('GST'), if applicable, to the extent based upon income derived from performance of this Agreement and as per the applicable tax laws. In case Party is under an obligation to deduct tax at source and/or any levy/tax, the deducting Party shall issue a requisite certificate to the other Party evidencing such deduction of tax.<br />
                                15.2. As per GST regulations, BookMyTicket shall collect Tax at source (TCS) on the monthly value of supplies made through the Platforms from the date to be notified by the Government. In case the input tax credit including credit of TCS as mentioned, is not allowed to Event Manager due to its non-provision of the correct details to BookMyTicket or due to own non-compliance, BookMyTicket shall not be responsible for such non allowance to Event Manager. Event Manager shall be required to provide the relevant GST registration numbers or any other relevant information that may be required in this relation.<br />
                                15.3. In case the tax authorities try to recover from BookMyTicket any sum including but not restricted to tax, interest, penalty etc. due to any non-compliance by Event Manager with respect to sale of Tickets through BookMyTicket, BookMyTicket holds right to deduct an amount equivalent to the demand from the payments to be made to Event Manager. In case there are no payments to be made by BookMyTicket, Event Manager shall immediately reimburse to BookMyTicket the demand amounts (including associated litigation cost) if any upon notification by BookMyTicket.</p>

                            <h4>16. GOVERNING LAW & DISPUTE RESOLUTION:</h4>
                            <p>16.1. The terms of this Agreement shall be construed and interpreted in accordance with the laws of India.<br />
                                16.2. Any disputes arising out of or in connection with this Agreement, during its subsistence and after its termination in any manner whatsoever, including the validity of this Agreement shall be referred to arbitration of a sole arbitrator mutually appointed by the Parties hereto. The Arbitration proceedings shall be conducted in accordance with the provisions contained in the Arbitration and Conciliation Act, 1996. The place of Arbitration shall be Mumbai and the language of Arbitration shall be English. All fees and costs associated with the arbitral proceedings shall be borne by the Parties equally.<br />
                                16.3. The Parties hereby agree that the courts of Mumbai shall have exclusive jurisdiction to enforce the arbitral award.</p>

                            <h4>17. BINDING EFFECT:</h4>
                            <p>17.1. Notwithstanding anything contained herein, this Agreement shall be legally binding on the Parties and shall be enforceable against them.</p>

                            <h4>18. AMENDMENTS:</h4>
                            <p>18.1. Subject to the terms of this Agreement, no modification of this Agreement shall be binding upon the Parties unless the same is in writing and signed by an authorized representative of each Party. Part performance shall not be deemed a waiver of this requirement.</p>

                            <h4>19. COUNTERPARTS:</h4>
                            <p>19.1. This Agreement may consist of more than 1 (one) copy, each signed by the Parties to the Agreement. If so, the signed copies are treated as making up the one document and the date on which the last counterpart is executed is the Signing Date.</p>

                            <h4>20. SEVERABILITY:</h4>
                            <p>20.1. If any provision or part thereof of this Agreement shall be held void or becomes void or unenforceable at any time, then the rest of the terms of this Agreement shall be given effect to as if such provision or part thereof does not exist in this Agreement. The Parties agree that such an event shall not in any manner affect the validity and the enforceability of the rest of the Agreement. No delay or omission by BookMyTicket in enforcing or performing any of the terms or conditions of this Agreement shall be construed as or constitute a waiver of obligations of Evet Manager under this Agreement.</p>

                            <h4>21. ENTIRE UNDERSTANDING AND SET OFF:</h4>
                            <p>21.1. This Agreement contains the entire arrangement, agreement and understanding of the Parties that relates to the subject matter. If any cost, loss, damage, expense, liability, claim, amount or obligation is incurred/fulfilled by BookMyTicket on behalf of the Event Manager, BookMyTicket shall have the right, and in addition to any other actions permitted by law, to offset the amount of any such cost, loss, damage, expense, liability, obligation or claim or monies against amounts due from Event Manager to BookMyTicket, including the right to offset any payment due from the Event Manager to BookMyTicket under this Agreement or any other agreement. This Agreement shall supersede all prior agreements executed between the Parties.</p>

                            <h4>22. NOTICES:</h4>
                            <p>Any notices, requests, demands or other communication required or permitted to be given under this Agreement shall be written in English and shall be delivered in any of the following modes of communication, these being: deliveries in person, or email (in PDF format) and properly addressed as follows:</p>
                            <p>In the case of notices to BookMyTicket, to:<br />
                                Attention: Santhoshkumar Premraj<br />
                                Email: support@bookmyticket.io<br />
                                Address: 28/78 Gothavari Street Gurusamy Nagar Vadavalli Bharathiyar University Coimbatore North Coimbatore TN 641046 IN</p>
                            <p>In the case of notices to Event Manager, to:<br />
                                Attention: Raja Vasudevan<br />
                                Email: message2myemail@gmail.com<br />
                                Exclusivity (if applicable as per Clause 2.2 of Agreement): YES/NO</p>
                            <p>IN WITNESS WHEREOF the authorized representative of the parties hereto have set their respective hands on 8 day of March 2026 first hereinabove written.</p>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
                                <div>
                                    <b>For BookMyTicket</b><br />
                                    Authorized Signatory<br />
                                    Name: ThangaPandian<br />
                                    Designation: Grievance Officer<br />
                                    Date: 08/03/2026
                                </div>
                                <div>
                                    <b>For Raja Vasudevan</b><br />
                                    Authorized Signatory<br />
                                    Name: Raja Vasudevan<br />
                                    Designation: System Admin<br />
                                    Date: 08/03/2026
                                </div>
                            </div>
                        </div>
                        <div style={{ padding: "16px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end" }}>
                            <button onClick={() => { setAgreedToVendor(true); setShowVendorModal(false); }} style={{ padding: "8px 24px", background: "linear-gradient(135deg, #f43f5e, #f97316)", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}>Agree</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    // Main Stage Dispatcher
    switch (currentStage) {
        case "kyc_start":
            return (
                <>
                    {renderModals()}
                    {renderRestrictedSidebar(renderKYCStartView())}
                </>
            );
        case "kyc_wizard":
            return (
                <>
                    {renderModals()}
                    {renderRestrictedSidebar(renderKYCWizardView())}
                </>
            );
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
