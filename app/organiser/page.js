"use client";
import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  Component,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSupabaseQuery, useSupabaseMutation } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthContext";
import { isServiceProvider } from "@/app/data/serviceCategories";
import { Country, State, City } from "country-state-city";
import { Html5Qrcode } from "html5-qrcode";
import BlockMapDesigner from "./components/BlockMapDesigner";
import CalendarPicker from "./components/CalendarPicker";
import TimePicker from "./components/TimePicker";
import CustomSelect from "./components/CustomSelect";
import BookingAnalytics from "./components/BookingAnalytics";
import {
  INDIAN_STATES,
  getIndianDistricts,
  getIndianCities,
} from "@/app/data/indianLocations";
import { COUNTRIES } from "@/app/data/locationData";
import PromoteModal from "@/components/PromoteModal";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";
import { motion, AnimatePresence } from "framer-motion";
import SportsEventForm from "./components/SportsEventForm";
import UniversalEventForm from "./components/UniversalEventForm";
import CompetitionEventForm from "./components/CompetitionEventForm";
import PhysicalEventForm from "./components/PhysicalEventForm";
import UnifiedEventForm from "./components/UnifiedEventForm";
import VirtualEventForm from "./components/VirtualEventForm";
import MarathonEventForm from "./components/MarathonEventForm";
import TournamentEventForm from "./components/TournamentEventForm";
import WalletDashboard from "./components/WalletDashboard";
import SubscriptionManager from "./components/SubscriptionManager";
import CouponManagement from "./components/CouponManagement";
import PayoutRequestPanel from "@/components/PayoutRequestPanel";
import GoogleInlineMap from "./components/GoogleInlineMap";
import { reverseGeocode, geocode } from "@/lib/googleMaps";
import TransactionHistory from "./components/TransactionHistory";

class OrganiserErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("OrganiserPanel error:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: "100vh",
            padding: "40px",
            background: "#f8fafc",
            color: "#0f172a",
            fontFamily: "'Figtree', sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: "600px",
              margin: "0 auto",
              padding: "40px",
              backgroundColor: "#ffffff",
              borderRadius: "24px",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              border: "1px solid #e2e8f0",
            }}
          >
            <h2
              style={{
                color: "#ec4899",
                fontWeight: 700,
                fontSize: "24px",
                marginBottom: "16px",
                textTransform: "uppercase",
                letterSpacing: "-0.5px",
              }}
            >
              Organiser Portal Error
            </h2>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                background: "#f1f5f9",
                padding: "20px",
                borderRadius: "12px",
                fontSize: "12px",
                border: "1px solid #e2e8f0",
                color: "#475569",
              }}
            >
              {this.state.error?.message || String(this.state.error)}
            </pre>
            <button
              onClick={() => this.setState({ error: null })}
              style={{
                marginTop: "24px",
                padding: "12px 24px",
                background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                color: "white",
                borderRadius: "12px",
                border: "none",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
import {
  LayoutDashboard,
  Settings,
  Video,
  Image as ImageIcon,
  Sparkles,
  CheckCircle,
  Ticket,
  Users,
  Menu,
  Bell,
  Save,
  X,
  Plus,
  Minus,
  Trash2,
  Mail,
  Lock,
  Code,
  Globe,
  Shield,
  Wallet,
  ArrowRight,
  FileText,
  Calendar,
  Clock,
  MapPin,
  Building,
  Grid,
  Tag,
  CloudUpload,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Monitor,
  ArrowLeftRight,
  Home,
  LogOut,
  Camera,
  AlertCircle,
  QrCode,
  BarChart3,
  Search,
  XCircle,
  UserCheck,
  Check,
  ExternalLink,
  ArrowLeft,
  LifeBuoy,
  Briefcase,
  Package,
  IndianRupee,
  Activity,
  TrendingUp,
  PieChart,
  BarChart,
  Info,
  Share,
  ShieldCheck,
  Zap,
  FileCheck2,
  Armchair,
  CheckCircle2,
  Landmark,
  Languages,
  Navigation,
  UserPlus,
  Trophy,
  Goal,
  Timer,
  Dribbble,
  Target,
} from "lucide-react";

const ACCENT_PINK = "#ec4899";
const ACCENT_PURPLE = "#a855f7";
const ACCENT_BLUE = "#ec4899"; // Rebranded primary to pink
const ACCENT_GRADIENT = `linear-gradient(135deg, ${ACCENT_PINK} 0%, ${ACCENT_PURPLE} 100%)`;
const ACCENT_SOFT_PINK = "#fdf2f8";
const ACCENT_BORDER_PINK = "#fbcfe8";

function LocationPickerModal({
  t,
  theme,
  tempLocation,
  setTempLocation,
  postEvent,
  setPostEvent,
  setShowMapModal,
  isGeoLoading,
  setIsGeoLoading,
  geoError,
  setGeoError,
  mapRef,
  markerRef,
}) {
  const mapContainerRef = useRef(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
    link.crossOrigin = "";
    document.head.appendChild(link);
    return () => {
      if (link.parentNode) link.parentNode.removeChild(link);
    };
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    const L = require("leaflet");
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
    const map = L.map(mapContainerRef.current).setView(
      [tempLocation.lat, tempLocation.lng],
      12,
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);
    const marker = L.marker([tempLocation.lat, tempLocation.lng], {
      draggable: true,
    }).addTo(map);
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
    mapRef.current.setView(
      [tempLocation.lat, tempLocation.lng],
      mapRef.current.getZoom(),
    );
  }, [tempLocation.lat, tempLocation.lng]);

  const handleUseLocation = async () => {
    try {
      setIsGeoLoading(true);
      setGeoError("");
      const geocoded = await reverseGeocode(tempLocation.lat, tempLocation.lng);
      setPostEvent((pe) => ({
        ...pe,
        latitude: String(tempLocation.lat),
        longitude: String(tempLocation.lng),
        address: geocoded.fullAddress || pe.address,
        country: geocoded.country || pe.country,
        countryCode: geocoded.countryCode || pe.countryCode,
        state: geocoded.state || pe.state,
        stateCode: geocoded.stateCode || pe.stateCode,
        city: geocoded.city || pe.city,
        zipCode: geocoded.pincode || pe.zipCode,
      }));
      setShowMapModal(false);
    } catch (err) {
      setGeoError(
        "Unable to fetch address. You can still save lat/long manually.",
      );
    } finally {
      setIsGeoLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1200] flex items-center justify-center p-4 sm:p-6 md:p-10 backdrop-blur-md bg-black/40"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="w-full max-w-[1000px] h-[90vh] max-h-[700px] bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-white/20"
      >
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between bg-white">
          <div>
            <h3 className="text-xl font-bold text-slate-900 leading-tight uppercase tracking-tight">
              Location Picker
            </h3>
            <p className="text-[10px] font-bold tracking-widest text-slate-600 uppercase">
              Interactive Map Selection
            </p>
          </div>
          <button
            onClick={() => setShowMapModal(false)}
            className="w-10 h-10 rounded-full bg-slate-50 hover:bg-pink-50 text-slate-600 hover:text-pink-500 flex items-center justify-center transition-all border border-slate-100 hover:border-pink-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Map Content */}
          <div className="flex-[2.5] relative">
            <div
              ref={mapContainerRef}
              className="absolute inset-0 z-0 h-full w-full"
            />
            {/* Coordinates Badge Glass */}
            <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white shadow-lg flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                  Latitude
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {tempLocation.lat.toFixed(6)}
                </span>
              </div>
              <div className="w-[1px] h-6 bg-slate-200" />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                  Longitude
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {tempLocation.lng.toFixed(6)}
                </span>
              </div>
            </div>
          </div>

          {/* Controls Sidebar */}
          <div className="flex-1 min-w-[320px] bg-slate-50/50 border-l border-slate-100 p-8 flex flex-col gap-6 overflow-y-auto">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-50 shadow-sm flex flex-col gap-4">
              <p className="text-[11px] font-bold text-slate-700 leading-relaxed uppercase tracking-tight italic">
                Precisely position the marker on the map to autofill address
                details.
              </p>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-900 uppercase tracking-widest mb-2 pl-1">
                    Manual Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={tempLocation.lat}
                    onChange={(e) =>
                      setTempLocation((p) => ({
                        ...p,
                        lat: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full bg-slate-50 border border-slate-100 text-slate-900 text-sm font-semibold px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-300 transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-900 uppercase tracking-widest mb-2 pl-1">
                    Manual Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={tempLocation.lng}
                    onChange={(e) =>
                      setTempLocation((p) => ({
                        ...p,
                        lng: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full bg-slate-50 border border-slate-100 text-slate-900 text-sm font-semibold px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-300 transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            {geoError && (
              <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-[11px] font-bold border border-red-100 flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{geoError}</span>
              </div>
            )}

            <div className="mt-auto space-y-3">
              <button
                onClick={handleUseLocation}
                disabled={isGeoLoading}
                className="w-full py-4 rounded-2xl bg-[#ec4899] text-white text-[13px] font-bold tracking-widest uppercase shadow-xl shadow-pink-200 hover:shadow-pink-300 transition-all flex items-center justify-center gap-2 group"
                style={{ background: ACCENT_GRADIENT }}
              >
                {isGeoLoading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <MapPin
                      size={18}
                      className="group-hover:scale-110 transition-transform"
                    />
                    Use Location & Autofill
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setPostEvent((pe) => ({
                    ...pe,
                    latitude: String(tempLocation.lat),
                    longitude: String(tempLocation.lng),
                  }));
                  setShowMapModal(false);
                }}
                className="w-full py-4 rounded-2xl bg-white border border-slate-100 text-slate-600 hover:text-slate-600 text-[11px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2"
              >
                Set Lat/Long Only
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function KYCLocationStep({
  t,
  theme,
  kycFormData,
  setKycFormData,
  kycErrors,
  setKycErrors,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [isGeoLoading, setIsGeoLoading] = useState(false);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    return () => {
      if (link.parentNode) link.parentNode.removeChild(link);
    };
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    const L = require("leaflet");

    // Fix Leaflet marker icon issue
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    const initialLat = kycFormData.lat || 11.0168;
    const initialLng = kycFormData.lng || 76.9558;

    const map = L.map(mapContainerRef.current).setView(
      [initialLat, initialLng],
      13,
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    const marker = L.marker([initialLat, initialLng], {
      draggable: true,
    }).addTo(map);
    mapRef.current = map;
    markerRef.current = marker;

    marker.on("moveend", () => {
      const latlng = marker.getLatLng();
      setKycFormData((prev) => ({ ...prev, lat: latlng.lat, lng: latlng.lng }));
    });

    map.on("click", (e) => {
      marker.setLatLng(e.latlng);
      setKycFormData((prev) => ({
        ...prev,
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      }));
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  const handleFetchAddress = async () => {
    try {
      setIsGeoLoading(true);
      const geocoded = await reverseGeocode(kycFormData.lat, kycFormData.lng);
      if (geocoded.fullAddress) {
        setKycFormData((prev) => ({
          ...prev,
          address: geocoded.fullAddress,
          country: geocoded.country,
          countryCode: geocoded.countryCode,
          state: geocoded.state,
          stateCode: geocoded.stateCode,
          city: geocoded.city,
        }));
        setKycErrors((prev) => prev.filter((f) => f !== "address"));
      }
    } catch (err) {
      console.error("Fetch address error:", err);
    } finally {
      setIsGeoLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "32px",
          borderRadius: "12px",
          border: `1px solid #e2e8f0`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            padding: "0 0 20px",
            borderBottom: "4px solid #3b82f6",
            display: "inline-block",
            marginBottom: "24px",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: 800,
              color: "#0f172a",
            }}
          >
            Service Location
          </h3>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
            marginBottom: "24px",
          }}
        >
          <div style={{ gridColumn: "span 2" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                color: "#334155",
                marginBottom: "8px",
                fontWeight: 600,
              }}
            >
              Business/Service Address{" "}
              <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <textarea
                placeholder="Enter your full business address..."
                value={kycFormData.address}
                onChange={(e) => {
                  setKycFormData({ ...kycFormData, address: e.target.value });
                  setKycErrors((prev) => prev.filter((f) => f !== "address"));
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "6px",
                  border: kycErrors.includes("address")
                    ? "1.5px solid #ef4444"
                    : `1px solid #e2e8f0`,
                  color: "#1e293b",
                  backgroundColor: "#fff",
                  outline: "none",
                  fontSize: "14px",
                  minHeight: "80px",
                }}
              />
              <button
                onClick={handleFetchAddress}
                disabled={isGeoLoading}
                style={{
                  position: "absolute",
                  right: "8px",
                  bottom: "8px",
                  backgroundColor: "#3b82f6",
                  color: "#fff",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {isGeoLoading ? "Fetching..." : "Fetch from Map"}
              </button>
            </div>
            {kycErrors.includes("address") && (
              <p
                style={{ color: "#ef4444", fontSize: "10px", marginTop: "4px" }}
              >
                Address is required
              </p>
            )}
          </div>
        </div>

        <div
          style={{
            borderRadius: "12px",
            overflow: "hidden",
            border: "1px solid #e2e8f0",
            backgroundColor: "#f8fafc",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "#fff",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <span
                style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b" }}
              >
                Set Map Pin
              </span>
              <p style={{ margin: 0, fontSize: "10px", color: "#334155" }}>
                Drag the marker to your exact location for customers to find
                you.
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <div
                style={{
                  fontSize: "10px",
                  backgroundColor: "#f1f5f9",
                  padding: "4px 8px",
                  borderRadius: "4px",
                }}
              >
                Lat: {kycFormData.lat.toFixed(4)}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  backgroundColor: "#f1f5f9",
                  padding: "4px 8px",
                  borderRadius: "4px",
                }}
              >
                Lng: {kycFormData.lng.toFixed(4)}
              </div>
            </div>
          </div>
          <div
            ref={mapContainerRef}
            style={{ height: "350px", width: "100%", zIndex: 1 }}
          />
        </div>
      </div>
    </div>
  );
}

const EMPTY_ARRAY = [];

function OrganiserPanel() {
  const { user, loading, logout, selectedCity, locationHierarchy } = useAuth();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const router = useRouter();

  const isProfService = (cat, type) => {
    return type === "professional_service" || isServiceProvider(cat);
  };

  // IMMEDIATE GUARD: If the session already knows this is a professional service, redirect NOW.
  // Note: Organisers who are also service providers should be allowed to stay in the organiser panel.
  if (!loading && user && user.role !== 'organiser' && isProfService(user.category, user.type)) {
    if (typeof window !== "undefined") {
      router.replace("/vendor/dashboard");
    }
    return null;
  }

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (loading || !mounted) return;

    const checkAuth = async () => {
      if (!user) {
        const params = new URLSearchParams(window.location.search);
        if (params.get("editId")) {
          console.log(
            "OrganiserPanel: editId detected, but no user. Waiting for auth state to stabilize...",
          );
          return;
        }
        router.push(
          "/signin?redirect=" +
            encodeURIComponent(
              window.location.pathname + window.location.search,
            ),
        );
      } else {
        const role = user.role?.toLowerCase();
        if (role === "staff") {
          router.push("/pwa-scan");
        } else if (
          role !== "organiser" &&
          role !== "admin" &&
          role !== "super_admin" &&
          role !== "system_admin"
        ) {
          // If a regular user tries to access organiser panel, redirect to profile
          console.log(
            "OrganiserPanel: unauthorized role",
            role,
            "- redirecting to profile",
          );
          router.push("/profile");
        }
      }
    };

    checkAuth();
  }, [user, loading, router, mounted]);

  // Loading State UI Component
  const renderLoadingView = () => (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
      <div className="w-16 h-16 border-4 border-slate-200 border-t-pink-500 rounded-full animate-spin mb-6" />
      <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight italic">
        Initializing Portal
      </h2>
      <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mt-2">
        Connecting to Secure Gateway...
      </p>
    </div>
  );

  // Stages: mfa, kyc_docs, kyc_form, pending, approved
  const [currentStage, setCurrentStage] = useState("loading");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [eventSubTab, setEventSubTab] = useState("active");
  const [viewingBookingDetails, setViewingBookingDetails] = useState(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dropdownRef = React.useRef(null);
  const handleLogout = () => {
    setProfileDropdownOpen(false);
    logout();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── DATA FETCHING (Moved Up to Prevent TDZ Errors) ───────────────────────
  const {
    data: organiserData,
    loading: isOrgLoading,
    error: orgError,
    refresh: refreshOrganiserData,
  } = useSupabaseQuery(
    "organisers",
    (q) => q.eq("id", user?.id).maybeSingle(),
    [user?.id],
  );

  const { data: userProfile, refresh: refreshProfile } = useSupabaseQuery(
    "profiles",
    (q) => q.eq("id", user?.id).maybeSingle(),
    [user?.id],
  );

  const { data: supportTicketsData = [], refresh: refreshTickets } =
    useSupabaseQuery(
      "support_tickets",
      (q) =>
        q.eq("user_id", user?.id).order("created_at", { ascending: false }),
      [user?.id],
    );

  useEffect(() => {
    if (!supportTicketsData) return;
    const mapped = supportTicketsData
      .filter((t) => t.user_id === user?.id)
      .map((t) => ({
        id: t.id,
        ticketId: t.id.slice(-6),
        email: t.user_id,
        subject: t.subject || "No Subject",
        description: t.message,
        status: t.status,
        createdAt: t.created_at,
        updatedAt: t.updated_at || t.created_at,
        adminNotes: t.admin_notes || "",
        replies: Array.isArray(t.replies) ? t.replies : [],
      }));
    setSupportTicketsList((prev) => {
      const currentString = JSON.stringify(prev);
      const nextString = JSON.stringify(mapped);
      return currentString === nextString ? prev : mapped;
    });
  }, [supportTicketsData, user?.id]);

  const [createTicketMutation] = useSupabaseMutation(
    "support_tickets",
    "insert",
  );
  const [updateTicketMutation] = useSupabaseMutation(
    "support_tickets",
    "update",
    (q, p) => q.eq("id", p.id),
  );

  const [createMarathonConfig] = useSupabaseMutation(
    "marathon_config",
    "insert",
  );
  const [createTournamentConfig] = useSupabaseMutation(
    "tournament_config",
    "insert",
  );
  const [createTournamentEventMutation] = useSupabaseMutation(
    "tournament_events",
    "insert",
  );
  const [updateTournamentEventMutation] = useSupabaseMutation(
    "tournament_events",
    "update",
    (q, p) => q.eq("id", p.id),
  );
  const [createCoachingConfig] = useSupabaseMutation(
    "coaching_config",
    "insert",
  );

  // ── SECURE EVENTS FETCH ─────────────────────────────────────────────────
  // Uses server-side API route that ALWAYS filters by organiser_id = auth.uid()
  // This guarantees isolation even without DB-level RLS policies.
  const [eventsData, setEventsData] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalBookings: 0,
    revenue: 0,
    expiredEvents: 0
  });
  const eventsAbortRef = useRef(null);

  const refreshEvents = useCallback(async () => {
    if (!user?.id) return;
    // Cancel any in-flight request
    if (eventsAbortRef.current) eventsAbortRef.current.abort();
    const controller = new AbortController();
    eventsAbortRef.current = controller;

    setEventsLoading(true);
    try {
      // Get current session JWT for server-side auth verification
      const { data: sessionData } = await supabase.auth.getSession();
      const jwt = sessionData?.session?.access_token;
      if (!jwt) {
        console.warn("OrganiserPanel: No JWT available for events fetch");
        setEventsLoading(false);
        return;
      }

      const res = await fetch("/api/organiser/events", {
        headers: { Authorization: `Bearer ${jwt}` },
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.error("OrganiserPanel: events API error:", res.status, errBody);
        setEventsLoading(false);
        return;
      }

      const payload = await res.json();
      console.log(`OrganiserPanel: Fetched ${payload.count} events for organiser ${payload.organiser_id}`);
      setEventsData(payload.events || []);

      // ── FETCH DASHBOARD SUMMARY ──
      const statsRes = await fetch("/api/organiser/dashboard/summary", {
        headers: { Authorization: `Bearer ${jwt}` },
        signal: controller.signal,
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setDashboardStats(statsData.stats);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("OrganiserPanel: events fetch failed:", err);
      }
    } finally {
      setEventsLoading(false);
    }
  }, [user?.id]);

  // Fetch events when user is ready; re-fetch on user change
  useEffect(() => {
    if (!user?.id) return;
    refreshEvents();

    // Realtime: re-fetch when events table changes (inserts, updates, deletes)
    const channel = supabase
      .channel(`organiser_events_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        refreshEvents();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_events' }, () => {
        refreshEvents();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marathon_config' }, () => {
        refreshEvents();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        refreshEvents();
      })
      .subscribe();

    return () => {
      if (eventsAbortRef.current) eventsAbortRef.current.abort();
      supabase.removeChannel(channel);
    };
  }, [user?.id, refreshEvents]);

  const { data: bookingsData = [] } = useSupabaseQuery(
    "bookings",
    (q) =>
      q.in(
        "event_id",
        eventsData.map((e) => String(e.id)),
      ),
    [eventsData],
    { enabled: eventsData.length > 0 },
  );

  const { data: staffAccounts = [], refresh: refetchStaff } = useSupabaseQuery(
    "staff",
    (q) => q.eq("organiser_id", user?.id),
    [user?.id],
  );

  const { data: staffPackages = [] } = useSupabaseQuery("staff_packages", (q) =>
    q.order("monthly_price", { ascending: true }),
  );
  const { data: organiserSub, refresh: refreshSub } = useSupabaseQuery(
    "organiser_subscriptions",
    (q) =>
      q
        .eq("organiser_id", user?.id)
        .eq("subscription_status", "active")
        .maybeSingle(),
    [user?.id],
  );

  const currentPackage = useMemo(() => {
    if (!organiserSub)
      return (
        staffPackages.find((p) => p.package_name === "Free Plan") || {
          staff_limit: 3,
          package_name: "Free Plan",
        }
      );
    return (
      staffPackages.find((p) => p.id === organiserSub.package_id) || {
        staff_limit: 3,
        package_name: "Free Plan",
      }
    );
  }, [organiserSub, staffPackages]);

  const staffLimitReached =
    staffAccounts.length >= (currentPackage.staff_limit || 3);

  const { data: paymentGateways = [] } = useSupabaseQuery(
    "payment_gateways",
    (q) => q.eq("is_enabled", true),
  );

  const handleUpgrade = async (pkg) => {
    setUpgradingPackage(pkg.id);
    try {
      // Load Razorpay
      const loadRazorpay = () => {
        return new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };

      const isLoaded = await loadRazorpay();
      if (!isLoaded) throw new Error("Razorpay SDK failed to load.");

      // Create Order
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: pkg.id,
          amount: pkg.monthly_price,
          type: "subscription",
        }),
      });
      const order = await res.json();
      if (order.error) throw new Error(order.error);

      const rzpKey =
        paymentGateways.find((g) => g.name === "Razorpay")?.config?.keyId ||
        "rzp_live_SkQ5MQO9dB5LuI";

      const options = {
        key: rzpKey,
        amount: order.amount,
        currency: order.currency,
        name: "BookMyTicket",
        description: `Upgrade to ${pkg.package_name}`,
        image: "/logo.png",
        order_id: order.id,
        handler: async function (response) {
          try {
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                id: pkg.id,
                type: "subscription",
                organiserId: user.id,
              }),
            });
            const verifyResult = await verifyRes.json();
            if (verifyResult.success) {
              showToast("Plan upgraded successfully!", "success");
              setShowUpgradeModal(false);
              refreshSub();
            } else {
              throw new Error(verifyResult.error || "Verification failed");
            }
          } catch (err) {
            showToast(err.message, "error");
          }
        },
        prefill: {
          name: user.full_name || "",
          email: user.email || "",
        },
        theme: { color: "#3b82f6" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setUpgradingPackage(null);
    }
  };

  const { data: systemConfigs = [] } = useSupabaseQuery(
    "system_config",
    (q) => q,
    [],
    { realtime: false },
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get("editId");

    if (editId && eventsData && eventsData.length > 0) {
      const ev = eventsData.find((e) => String(e.id) === String(editId));
      if (ev) {
        console.log("OrganiserPanel: Found event to edit:", ev.title);
        if (ev.type === "Marathon") {
          // Route marathon events to the dedicated marathon form
          setEditingMarathonId(ev.id);
          setEditingEvent(ev);
          setActiveTab("marathon_publish");
        } else {
          setEditingEvent(ev);
          setPostEvent({
            ...getInitialPostEvent(),
            ...ev,
            id: ev.id,
            zipCode: ev.pincode || ev.zipCode || "",
            ticketType: ev.event_type || 'reserved',
            bannerPreview: ev.img || ev.banner_preview || ev.bannerPreview,
            seatingEnabled: ev.seating_enabled !== false,
            isFeature: ev.is_featured ? "Yes" : "No",
            isExclusive: ev.is_exclusive ? "Yes" : "No",
            endDate: ev.end_date || ev.endDate || "",
            endTime: ev.end_time || ev.endTime || "",
            expiryDate: ev.expiry_date || ev.expiryDate || "",
            eventStatus: ev.status || "published",
            organiser_name: ev.dynamic_config?.organiser_name || ev.organiser_name || "",
            // Hydrate Tournament specific data
            registrationEndDate:
              ev.tournament_events?.[0]?.registration_end_at ||
              ev.tournament_events?.registration_end_at ||
              "",
            registrationFee:
              ev.tournament_events?.[0]?.registration_fee ||
              ev.tournament_events?.registration_fee ||
              0,
            minTeamSize:
              ev.tournament_events?.[0]?.min_team_size ||
              ev.tournament_events?.min_team_size ||
              1,
            maxTeamSize:
              ev.tournament_events?.[0]?.max_team_size ||
              ev.tournament_events?.max_team_size ||
              20,
            audienceFreeAccess:
              ev.tournament_events?.[0]?.audience_free_access ?? true,
            tournamentFormat:
              ev.tournament_events?.[0]?.tournament_format || "Knockout",
            sportType: ev.tournament_events?.[0]?.sport_type || "General",
            categories: (ev.tournament_categories || []).map((c) => ({
              id: c.id,
              name: c.category_name,
              fee: c.category_fee,
              maxTeams: c.max_teams,
            })),
          });
          setActiveTab("post_event");
          setAddEventStep("form");
        }
      } else {
        console.warn(
          "OrganiserPanel: editId present but event not found in current dataset.",
        );
      }
    } else if (params.get("sport") === "true") {
      setPostEvent((pe) => ({ ...pe, type: "Sports" }));
      setAddEventStep("sports_type");
      setActiveTab("post_event");
    } else if (params.get("tab")) {
      setActiveTab(params.get("tab"));
    }
  }, [eventsData, user?.role]);
  const [theme, setTheme] = useState("light");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState({
    eventManagement: true,
    eventBookings: false,
    supportTickets: false,
  });
  const [menuSearch, setMenuSearch] = useState("");
  const [eventBookingsTab, setEventBookingsTab] = useState("all");
  const [supportTab, setSupportTab] = useState("all_tickets");
  const [pwaScanInput, setPwaScanInput] = useState("");
  const [pwaScanResult, setPwaScanResult] = useState(null);
  const [pwaCameraOpen, setPwaCameraOpen] = useState(false);
  const [supportTicketsList, setSupportTicketsList] = useState([]);
  const [supportTicketForm, setSupportTicketForm] = useState({
    email: "",
    subject: "",
    description: "",
    attachmentFileName: "",
  });
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradingPackage, setUpgradingPackage] = useState(null);
  const [staffFormData, setStaffFormData] = useState({
    name: "",
    email: "",
    password: "",
    mobile: "",
    assignedEventId: "",
    expiryDate: "",
    gateName: "",
  });
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [postLoading, setPostLoading] = useState(false);
  const [deletingStaffId, setDeletingStaffId] = useState(null);
  const [supportTicketSearchId, setSupportTicketSearchId] = useState("");
  const [selectedTicketIds, setSelectedTicketIds] = useState([]);
  const [supportTicketSelectOpen, setSupportTicketSelectOpen] = useState(null);
  const [supportTicketDetailId, setSupportTicketDetailId] = useState(null);
  const [supportTicketReplyMessage, setSupportTicketReplyMessage] =
    useState("");
  const [showGstModal, setShowGstModal] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [agreedToVendor, setAgreedToVendor] = useState(false);

  const effectiveEmail =
    user?.role === "staff"
      ? user.organiserId
      : user?.identifier || "hello@bookmyticket.net";
  const isStaff = user?.role === "staff";

  // KYC Wizard State
  const [kycStep, setKycStep] = useState(1);
  const [kycFormData, setKycFormData] = useState({
    category: "Individual",
    name: "",
    firstName: "",
    lastName: "",
    panCard: "",
    website: "",
    socialLink: "",
    ostin: "No",
    gstin: "",
    itr: "No",
    fullName: effectiveEmail,
    email: effectiveEmail,
    mobile: "",
    altContact: "",
    designation: "",
    city: "",
    address: "",
    lat: 0,
    lng: 0,
    beneficiaryName: "",
    accountType: "Savings account",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branchName: "",
    branchAddress: "",
  });
  const [kycFiles, setKycFiles] = useState({
    pan: null,
    cheque: null,
    aadhar: null,
  });
  const [kycErrors, setKycErrors] = useState([]);
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    orgType: "Individual",
    email: "",
    phone: "",
    kycStatus: "Pending",
    avatar_url: "",
  });

  const equaliser = (a, b) =>
    String(a).toLowerCase() === String(b).toLowerCase();

  const INDIAN_BANKS = [
    "State Bank of India",
    "HDFC Bank",
    "ICICI Bank",
    "Axis Bank",
    "Punjab National Bank",
    "Bank of Baroda",
    "Canara Bank",
    "Union Bank of India",
    "Bank of India",
    "Indian Bank",
    "Central Bank of India",
    "Indian Overseas Bank",
    "UCO Bank",
    "Bank of Maharashtra",
    "IDBI Bank",
    "Kotak Mahindra Bank",
    "IndusInd Bank",
    "Federal Bank",
    "South Indian Bank",
    "Bandhan Bank",
    "Standard Chartered Bank",
    "HSBC Bank",
    "Citibank",
    "DBS Bank",
    "Punjab & Sind Bank",
    "Yes Bank",
    "IDFC First Bank",
    "Karnataka Bank",
    "Karur Vysya Bank",
    "RBL Bank",
    "Tamilnad Mercantile Bank",
    "City Union Bank",
    "Paytm Payments Bank",
    "Airtel Payments Bank",
    "Jio Payments Bank",
    "Equitas Small Finance Bank",
    "AU Small Finance Bank",
  ].sort();

  // Wallet: loaded from Convex (organisers table)
  const [wallet, setWallet] = useState({
    balance: 0,
    currency: "₹",
    transactions: [],
  });

  const [submitKycMutation] = useSupabaseMutation("organisers", "update", (q) =>
    q.eq("id", user?.id),
  );

  const isProfessionalService = useMemo(() => {
    return isProfService(
      organiserData?.category ||
        organiserData?.kyc_details?.category ||
        user?.category,
      organiserData?.type || user?.type,
    );
  }, [
    organiserData?.category,
    organiserData?.kyc_details?.category,
    user?.category,
    organiserData?.type,
    user?.type,
  ]);

  const handleIfscChange = async (ifsc) => {
    setKycFormData((prev) => ({ ...prev, ifscCode: ifsc.toUpperCase() }));
    if (ifsc.length === 11) {
      try {
        const response = await fetch(
          `https://ifsc.razorpay.com/${ifsc.toUpperCase()}`,
        );
        if (response.ok) {
          const data = await response.json();
          setKycFormData((prev) => ({
            ...prev,
            bankName: data.BANK,
            branchName: data.BRANCH,
            branchAddress: data.ADDRESS,
          }));
        } else {
          setKycFormData((prev) => ({
            ...prev,
            bankName: "",
            branchName: "",
            branchAddress: "",
          }));
        }
      } catch (error) {
        console.error("IFSC check failed:", error);
        setKycFormData((prev) => ({
          ...prev,
          bankName: "",
          branchName: "",
          branchAddress: "",
        }));
      }
    } else {
      setKycFormData((prev) => ({
        ...prev,
        bankName: "",
        branchName: "",
        branchAddress: "",
      }));
    }
  };

  useEffect(() => {
    if (organiserData) {
      setWallet((prev) => ({
        ...prev,
        balance: organiserData.wallet_balance || 0,
      }));
      const mappedStatus =
        organiserData.kyc_status === "Active"
          ? "KYC Approved"
          : organiserData.kyc_status || "Pending";
      setProfile((prev) => ({
        ...prev,
        kycStatus: mappedStatus,
        email:
          userProfile?.email ||
          organiserData.kyc_details?.email ||
          user?.email ||
          "No Email",
        firstName:
          userProfile?.full_name?.split(" ")[0] ||
          (organiserData.business_name || "").split(" ")[0] ||
          "Organiser",
        lastName:
          userProfile?.full_name?.split(" ").slice(1).join(" ") ||
          (organiserData.business_name || "").split(" ")[1] ||
          "",
        phone: userProfile?.phone || "",
        avatar_url: userProfile?.avatar_url || "",
      }));

      if (organiserData.kyc_details) {
        const kd = organiserData.kyc_details;
        setKycFormData({
          category: kd.category || "Individual",
          name: organiserData.business_name || "",
          panCard: kd.panNumber || "",
          website: kd.websiteLink || "",
          socialLink: kd.socialMediaLink || "",
          ostin: kd.hasOSTIN ? "Yes" : "No",
          gstin: kd.gstin || "",
          itr: kd.hasITR ? "Yes" : "No",
          fullName: kd.fullName || "",
          email: kd.email || "",
          mobile: kd.mobile || "",
          altContact: kd.alternateNumber || "",
          designation: kd.designation || "",
          city: kd.city || "",
          address: kd.address || "",
          beneficiaryName: kd.beneficiaryName || "",
          accountType: kd.accountType || "Savings account",
          bankName: kd.bankName || "",
          accountNumber: kd.accountNumber || "",
          ifscCode: kd.ifscCode || "",
        });
        setKycFiles({
          pan: kd.panFile || null,
          cheque: kd.chequeFile || null,
          aadhar: kd.aadharFile || null,
        });
      }
    }
  }, [organiserData, userProfile, user]);

  useEffect(() => {
    const evaluateState = () => {
      // Priority 1: Auth or Profile still physically loading from network
      if (loading || isOrgLoading) {
        setCurrentStage("loading");
        return;
      }

      // Priority 2: If we expect an organiser but data is null and no error, it might be a split-second React state gap.
      // Wait for it. (orgError will be populated if it actually failed to find a row).
      if (user?.id && (user?.role === "admin" || user?.role === "organiser") && !organiserData && !orgError) {
          // It's likely about to start loading, just wait.
          setCurrentStage("loading");
          return;
      }

      evaluateStateImpl(false);
    };

    const evaluateStateImpl = (isFallback) => {
      // 1. Staff and Admins bypass onboarding
      if (isStaff || user?.role === "admin") {
        setCurrentStage("approved");
        return;
      }

      // 2. Determine effective data (use local query data with Context data as fallback)
      const effectiveOrgData =
        organiserData || (user?.role === "organiser" ? user : null);

      if (!effectiveOrgData) {
        // No record yet, start KYC
        console.log("OrganiserPanel: No organiser record found.");
        setCurrentStage("kyc_start");
        return;
      }

      if (user?.role !== 'organiser' && isProfessionalService) {
        // Already approved as a pro-service
        setCurrentStage("approved");
        router.replace("/vendor/dashboard");
        return;
      }

      // 3. Status Evaluation
      const status = (effectiveOrgData.kyc_status || "").toLowerCase();
      const isApprovedRecord =
        effectiveOrgData.is_approved === true ||
        effectiveOrgData.isApproved === true;

      if (
        status === "active" ||
        status === "kyc verified" ||
        isApprovedRecord
      ) {
        setCurrentStage("approved");
      } else if (
        status === "submitted" ||
        status === "under review" ||
        status === "pending" ||
        status === "approved"
      ) {
        setCurrentStage("pending");
      } else {
        // Any other status (e.g. "rejected", "incomplete") or missing status goes to onboarding
        setCurrentStage("kyc_start");
      }
    };

    evaluateState();
  }, [
    organiserData,
    isOrgLoading,
    isStaff,
    loading,
    isProfessionalService,
    router,
    orgError,
    user,
  ]);

  const [createEventMutation] = useSupabaseMutation("events", "insert");
  const [updateEventMutation] = useSupabaseMutation(
    "events",
    "update",
    (q, p) => q.eq("id", p.id),
  );
  const [createMeetingForEvent] = useSupabaseMutation("meetings", "insert");
  const [deleteEventMutation] = useSupabaseMutation(
    "events",
    "delete",
    (q, p) => q.eq("id", p.id),
  );

  const convexBookings = useMemo(() => bookingsData || [], [bookingsData]);
  const [updateBookingMutation] = useSupabaseMutation(
    "bookings",
    "update",
    (q, p) => q.eq("id", p.id),
  );
  const [createStaffMutation] = useSupabaseMutation("profiles", "insert"); // Staff are entries in profiles with role 'staff'
  const [updateStaffMutation] = useSupabaseMutation(
    "profiles",
    "update",
    (q, p) => q.eq("id", p.id),
  );
  const [deleteStaffMutation] = useSupabaseMutation(
    "profiles",
    "delete",
    (q, p) => q.eq("id", p.id),
  );
  const [updateProfileMutation] = useSupabaseMutation(
    "profiles",
    "update",
    (q, p) => q.eq("id", p.id),
  );
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingLogo(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `organiser_logos/${user.id}_${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("branding")
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("branding").getPublicUrl(fileName);

      setProfile((prev) => ({ ...prev, avatar_url: publicUrl }));
      showToast("Logo uploaded successfully!", "success");
    } catch (err) {
      console.error("Logo upload error:", err);
      showToast("Failed to upload logo. Please try again.", "error");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleDeleteEvent = async (event) => {
    if (
      !confirm(
        `Are you sure you want to delete "${event.title}"? This action cannot be undone.`,
      )
    )
      return;

    try {
      // 0. Manual Cascade: Delete dependent bookings/registrations to avoid FK constraints
      if (event.type === "Marathon") {
        await supabase
          .from("marathon_registrations")
          .delete()
          .eq("marathon_id", event.id);
        await supabase
          .from("marathon_categories")
          .delete()
          .eq("marathon_id", event.id);
      }
      await supabase.from("bookings").delete().eq("event_id", event.id);

      // 1. Delete from specialized tables
      if (event.type === "Marathon") {
        await supabase.from("marathon_config").delete().eq("id", event.id);
      }
      if (["Tournament Event", "Tournament", "Sports Tournament"].includes(event.type)) {
        await supabase.from("tournament_events").delete().eq("id", event.id);
        await supabase.from("tournament_categories").delete().eq("event_id", event.id);
        await supabase.from("tournament_teams").delete().eq("tournament_event_id", event.id);
      }

      // 2. Delete from shadow events table
      await deleteEventMutation({ id: event.id });

      showToast("Event deleted successfully", "success");
      refreshEvents();
    } catch (err) {
      console.error("Delete error:", err);
      showToast(
        "Failed to delete event: " + (err.message || "Unknown error"),
        "error",
      );
    }
  };

  const internalMeetingPortalEnabled = useMemo(() => {
    const cfg = systemConfigs.find(
      (c) => c.key === "internal_meeting_portal_enabled",
    );
    return cfg
      ? typeof cfg.value === "string"
        ? JSON.parse(cfg.value)
        : cfg.value
      : true;
  }, [systemConfigs]);

  const [validateAndLogScanMutation] = useSupabaseMutation(
    "pwa_scans",
    "insert",
  );

  const [events, setEvents] = useState([]);
  useEffect(() => {
    if (eventsData) {
      console.log("Processing Events Data:", eventsData.length, "items");
      const now = new Date();
      const processed = eventsData.map((e) => {
        // Use new status fields if available, otherwise fallback to legacy logic
        const pStatus = e.publish_status || (e.status === 'draft' ? 'draft' : 'published');
        const lStatus = e.listing_status || (e.status === 'archived' ? 'archived' : 'active');
        
        // Use explicit timestamp columns if available, otherwise parse from date/time strings
        let startAt = e.event_start_at ? new Date(e.event_start_at) : null;
        let endAt = e.event_end_at ? new Date(e.event_end_at) : null;

        if (!startAt || !endAt) {
          const configBasic = e.dynamic_config?.basicInfo || {};
          const startDateStr = e.date || e.startDate || configBasic.startDate;
          const startTimeStr = e.time || e.startTime || configBasic.startTime || "00:00";
          const endDateStr = e.end_date || e.endDate || configBasic.endDate || startDateStr;
          const endTimeStr = e.end_time || e.endTime || configBasic.endTime || "23:59";

          const parseDate = (d, t) => {
            if (!d) return null;
            let formattedD = d;
            if (typeof d === "string" && (d.includes("/") || d.includes("-"))) {
                const separator = d.includes("/") ? "/" : "-";
                const parts = d.split(separator);
                if (parts[0].length <= 2) { // DD-MM-YYYY
                    const [day, month, year] = parts;
                    formattedD = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
                }
            }
            const dt = new Date(`${formattedD}T${t || "00:00"}`);
            return isNaN(dt.getTime()) ? null : dt;
          };

          if (!startAt) startAt = parseDate(startDateStr, startTimeStr);
          if (!endAt) endAt = parseDate(endDateStr, endTimeStr);
        }

        // Determine effective UI status for grouping
        let uiStatus = "active";
        if (lStatus === "archived") {
          uiStatus = "archived";
        } else if (lStatus === "cancelled") {
          uiStatus = "cancelled";
        } else if (lStatus === "completed") {
          uiStatus = "completed";
        } else if (pStatus === "draft") {
          uiStatus = "draft";
        } else if (endAt && endAt < now) {
          uiStatus = "expired";
        } else {
          uiStatus = "active";
        }

        return { ...e, uiStatus, status: uiStatus, startAt, endAt };
      });

      setEvents((prev) => {
        const currentStr = JSON.stringify(prev);
        const nextStr = JSON.stringify(processed);
        return currentStr === nextStr ? prev : processed;
      });
    }
  }, [eventsData]);

  const writeQueueRef = useRef([]);
  const isWritingRef = useRef(false);
  const eventsDebounceRef = useRef(null);
  const draftDebounceRef = useRef(null);
  const skipInitialDraftWriteRef = useRef(true);

  // Editing state must be declared before effects that reference it
  const [editingEvent, setEditingEvent] = useState(null);
  const [editingMarathonId, setEditingMarathonId] = useState(null);

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
      } catch (_) {
        /* skip failed serialize */
      } finally {
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
    return () => {
      if (eventsDebounceRef.current) clearTimeout(eventsDebounceRef.current);
    };
  }, [events, scheduleWrite]);

  // When opening Add Event tab, show type selection (Online / Venue) first.
  // If we're editing an existing event, keep the form open.
  useEffect(() => {
    if (activeTab !== "post_event") return;
    if (editingEvent) return;
    setAddEventStep("select_type");
  }, [activeTab, editingEvent]);

  // Tab navigation: single state update per key (Arrow Up/Down), no repeat; ignore when focus is in input/textarea/select
  const TAB_IDS = [
    "dashboard",
    "post_event",
    "manage_events",
    "venue_events",
    "online_events",
    "seat_map",
    "event_bookings",
    "withdraw",
    "transactions",
    "pwa_scanner",
    "support_tickets",
    "edit_profile",
    "change_password",
  ];
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.repeat || (e.key !== "ArrowDown" && e.key !== "ArrowUp")) return;
      const el = document.activeElement;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.tagName === "SELECT")
      )
        return;
      e.preventDefault();
      const i = TAB_IDS.indexOf(activeTab);
      const next =
        e.key === "ArrowDown"
          ? (i + 1) % TAB_IDS.length
          : (i - 1 + TAB_IDS.length) % TAB_IDS.length;
      setActiveTab(TAB_IDS[next]);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeTab]);

  // State for Modals
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [showBankUpdateModal, setShowBankUpdateModal] = useState(false);

  const handleBankUpdate = async () => {
    if (
      !kycFormData.bankName ||
      !kycFormData.accountNumber ||
      !kycFormData.ifscCode
    ) {
      showToast("Please fill all bank details", "warning");
      return;
    }

    // CRITICAL: Ensure no legacy 'sports_details' column is present in the payload
    // We use dynamic_config for all schema-agnostic data now.
    delete payload.sports_details;

    const { data, error } = await supabase
      .from("events")
      .update({
        ...payload,
        // Preserve status if not explicitly changing
        publish_status:
          postEvent.publish_status || postEvent.eventStatus || "published",
        status: postEvent.status || postEvent.eventStatus || "published",
      })
      .eq("id", editingEvent.id)
      .select();

    setPostLoading(true);
    try {
      const { error } = await supabase
        .from("organisers")
        .update({
          kyc_details: {
            ...organiserData?.kyc_details,
            bankName: kycFormData.bankName,
            accountNumber: kycFormData.accountNumber,
            ifscCode: kycFormData.ifscCode,
            beneficiaryName: kycFormData.beneficiaryName,
            accountType: kycFormData.accountType,
          },
        })
        .eq("id", user.id);

      if (error) throw error;

      await refreshOrganiserData();
      showToast("Settlement account updated successfully!", "success");
      setShowBankUpdateModal(false);
      // Optionally refetch organiser data here if needed,
      // but kycFormData is already updated locally.
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setPostLoading(false);
    }
  };

  const handlePayoutRequest = async () => {
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast("Please enter a valid amount", "warning");
      return;
    }
    if (amount > (wallet?.balance || 0)) {
      showToast("Insufficient balance", "error");
      return;
    }

    setPostLoading(true);
    try {
      const providerType = isProfessionalService ? "service" : "organiser";
      const walletTable =
        providerType === "organiser" ? "organiser_wallet" : "provider_wallet";
      const idColumn =
        providerType === "organiser" ? "organiser_id" : "service_provider_id";

      // 1. Insert Request
      const { error: reqErr } = await supabase
        .from("withdraw_requests")
        .insert([
          {
            [idColumn]: user.id,
            amount: amount,
            status: "pending",
          },
        ]);
      if (reqErr) throw reqErr;

      // 2. Update Balance
      const { error: wallErr } = await supabase
        .from(walletTable)
        .update({
          balance: wallet.balance - amount,
          updated_at: new Date().toISOString(),
        })
        .eq(idColumn, user.id);
      if (wallErr) throw wallErr;

      // 3. Record Transaction
      await supabase.from("wallet_transactions").insert([
        {
          provider_id: user.id,
          amount: amount,
          type: "debit",
          description: "Withdrawal Request (Pending)",
          provider_type: providerType,
          reference_id: (
            await supabase
              .from("withdraw_requests")
              .select("id")
              .eq(idColumn, user.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .single()
          ).data?.id,
        },
      ]);

      // 4. Legacy Sync (Update organisers table if organiser)
      if (providerType === "organiser") {
        try {
          await supabase
            .from("organisers")
            .update({ wallet_balance: wallet.balance - amount })
            .eq("id", user.id);
        } catch (e) {
          console.warn("Legacy balance sync failed:", e);
        }
      }

      // Update local state and refresh
      setWallet((prev) => ({ ...prev, balance: prev.balance - amount }));
      refreshOrganiserData();

      showToast("Payout request submitted and balance debited.", "success");
      setShowPayoutModal(false);
      setPayoutAmount("");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setPostLoading(false);
    }
  };
  const [selectedEventForSeatMap, setSelectedEventForSeatMap] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    type: "Venue",
    venue: "",
    slots: [{ date: "", time: "" }],
  });

  // Add Event: first step is choosing Online vs Venue (image format)
  const [addEventStep, setAddEventStep] = useState("select_type"); // 'select_type' | 'form'
  const [promoteEventModal, setPromoteEventModal] = useState(null);

  const [showMapModal, setShowMapModal] = useState(false);
  const [tempLocation, setTempLocation] = useState({
    lat: 28.6139,
    lng: 77.209,
  });
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const thumbnailInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const validateBookingId = useCallback(
    async (id) => {
      const rawId = String(id).trim();
      if (!rawId) return;

      // Use the centralized robust validation mutation
      const result = await validateAndLogScanMutation({
        booking_id: rawId,
        event_id: "manual_or_scan",
        venue_id: user?.id,
      });

      if (result.success) {
        setPwaScanResult({ status: "valid", message: result.message });
        setPwaScanInput("");
      } else {
        setPwaScanResult({
          status: result.message.includes("already") ? "already_used" : "error",
          message: result.message,
        });
      }
    },
    [effectiveEmail, validateAndLogScanMutation],
  );

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
          },
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
  const DEFAULT_EVENT_CATEGORY_NAMES = [
    "Concert",
    "Sports",
    "Comedy",
    "Theatre",
    "Music",
    "Workshop",
    "Festival",
    "Live Shows",
    "Conference",
    "Exhibition",
    "Marathon",
    "Others",
  ];
  const [eventCategoryNames, setEventCategoryNames] = useState(
    DEFAULT_EVENT_CATEGORY_NAMES,
  );

  // ── Seat-based Event Posting State ───────────────────────────────────────
  const DEFAULT_SEAT_CATEGORIES = [
    { name: "VIP", color: "#f59e0b", rowStart: 1, rowEnd: 2, price: 2500 },
    { name: "Premium", color: "#6366f1", rowStart: 3, rowEnd: 4, price: 1500 },
    { name: "General", color: "#22c55e", rowStart: 5, rowEnd: 6, price: 800 },
  ];
  const getInitialPostEvent = () => ({
    title: "",
    organiser_name: "",
    subtitle: "",
    category: "Concert",
    type: "Physical Event",
    venue: "",
    date: "",
    time: "",
    dateType: "single",
    countdownStatus: "active",
    description: "",
    banner: null,
    bannerPreview: null,
    galleryImages: [],
    galleryPreviews: [],
    address: "",
    latitude: "",
    longitude: "",
    country: "",
    state: "",
    district: "",
    city: "",
    zipCode: "",
    countryCode: "",
    stateCode: "",
    ticketType: 'reserved',
    seatingEnabled: true,
    environment: "Indoor",
    normalTicketCapacity: "",
    normalTicketPrice: "",
    rows: 10,
    cols: 10,
    categories: [
      {
        id: Date.now(),
        name: "Standard Entry",
        price: 500,
        totalSlots: 100,
        isFree: false,
      },
    ],
    // Tournament Specifics
    tournamentFormat: "Knockout",
    audienceFreeAccess: true,
    minTeamSize: 1,
    maxTeamSize: 20,
    registrationFee: 0,
    sportType: "Other",
    rulesRegulations: "",
    termsConditions: "",
    // Advanced Information & Features
    ageLimit: "All ages",
    language: "English",
    duration: "2-3 Hours",
    safetyMeasures: true,
    parking: true,
    washroom: true,
    food: true,
    security: true,
    wifi: false,
    seatingType: "FCFS",
    mandatoryCheckin: true,

    // Sports/Physical specifics
    parkingDetails: "",
    entryGate: "",
    emergencyExit: "",
    videoTrailerUrl: "",

    // Online Event Specific Fields
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    dateSlots: [{ date: "", time: "" }],
    eventStatus: "published",
    isFeature: "No",
    isExclusive: "No",
    ticketLimitType: "unlimited",
    totalTickets: "",
    price: "",
    ticketsAreFree: false,
    blocks: [],
    categories: [
      {
        id: 1,
        name: "General Admission",
        price: 500,
        totalSlots: 100,
        color: "#6366f1",
      },
    ],

    // Sports Event Specific Fields
    sportType: "Tournament",
    distance: "5K",
    ageCategory: "All ages",
    tShirtSize: "M",
    routeMap: "",
    prizeDetails: "",
    teamsCount: "",
    matchSchedule: "",
    tournamentType: "Knockout",
    rules: "",
    trainerDetails: "",
    sessionSlots: "",
    capacity: "",
    meetingUrl: "",
    meetingType: "internal",
    externalMeetingUrl: "",
    earlyBirdDiscount: "disable",
    layoutType: "stage",
    country: "India",
    countryCode: "IN",
    state: "",
    stateCode: "",
    district: "",
    city: "",
    zipCode: "",
  });
  const [postEvent, setPostEvent] = useState(getInitialPostEvent());
  const [lastZipEdit, setLastZipEdit] = useState(0);

  // Auto-fetch address from Lat/Lng (Map Pin)
  useEffect(() => {
    if (postEvent.latitude && postEvent.longitude) {
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${postEvent.latitude}&lon=${postEvent.longitude}`,
          );
          const data = await res.json();
          const addr = data.address || {};
          let fetchedZip =
            addr.postcode || addr["addr:postcode"] || addr.postal_code;

          // Fallback: Extract from display_name if address object is incomplete
          if (!fetchedZip && data.display_name) {
            const zipMatch = data.display_name.match(/\b\d{6}\b/);
            if (zipMatch) fetchedZip = zipMatch[0];
          }

          // Don't override zip if user edited it in the last 10 seconds
          const shouldUpdateZip =
            fetchedZip && Date.now() - lastZipEdit > 10000;

          setPostEvent((prev) => ({
            ...prev,
            address: data.display_name || prev.address,
            city:
              addr.city ||
              addr.town ||
              addr.village ||
              addr.suburb ||
              prev.city,
            zipCode: shouldUpdateZip ? fetchedZip : prev.zipCode || "",
            district: addr.state_district || addr.county || prev.district,
            state: addr.state || prev.state,
            country: addr.country || prev.country,
          }));

          if (shouldUpdateZip)
            showToast(`Address Resolved: ${fetchedZip}`, "success");
        } catch (err) {
          console.error("Reverse geocoding error:", err);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [postEvent.latitude, postEvent.longitude]);
  // Legacy Pincode auto-fetch removed as per user request to eliminate unreliable dependencies.
  // Location is now primarily handled by the map picker and geocoding utility.
  const [publishError, setPublishError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("admin_categories");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const names = parsed
            .map((c) => (c && c.name ? String(c.name).trim() : ""))
            .filter(Boolean);
          if (names.length > 0) {
            setEventCategoryNames(names);
            setPostEvent((prev) =>
              prev.category && names.includes(prev.category)
                ? prev
                : { ...prev, category: names[0] },
            );
          }
        }
      }
    } catch (_) {
      /* ignore */
    }
  }, []);

  // Load persisted data on mount; defer draft load so it doesn't overwrite first keystroke
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      // Optional local storage fallback
      const saved = localStorage.getItem("organiser_events");
      if (saved && events.length === 0) setEvents(JSON.parse(saved));
    } catch (_) {
      /* ignore */
    }
    const loadDraft = () => {
      try {
        const draft = localStorage.getItem("organiser_draft");
        if (!draft) return;
        const parsed = JSON.parse(draft);
        if (!parsed || typeof parsed !== "object") return;
        const defaultCategories = [
          {
            name: "VIP",
            color: "#f59e0b",
            rowStart: 1,
            rowEnd: 2,
            price: 2500,
          },
          {
            name: "Premium",
            color: "#6366f1",
            rowStart: 3,
            rowEnd: 4,
            price: 1500,
          },
          {
            name: "General",
            color: "#22c55e",
            rowStart: 5,
            rowEnd: 6,
            price: 800,
          },
        ];
        const merged = {
          ...getInitialPostEvent(),
          ...parsed,
        };
        setPostEvent(merged);
      } catch (_) {
        /* ignore */
      }
    };
    const t = setTimeout(loadDraft, 0);
    return () => clearTimeout(t);
  }, []);

  // Write 2: Add Event draft — after postEvent is defined; debounced, skip first run
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (skipInitialDraftWriteRef.current) {
      skipInitialDraftWriteRef.current = false;
      return;
    }
    if (draftDebounceRef.current) clearTimeout(draftDebounceRef.current);
    draftDebounceRef.current = setTimeout(() => {
      try {
        scheduleWrite("organiser_draft", postEvent);
      } catch (_) {
        /* ignore */
      }
      draftDebounceRef.current = null;
    }, 300);
    return () => {
      if (draftDebounceRef.current) clearTimeout(draftDebounceRef.current);
    };
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
        return {
          ...cat,
          color:
            cat.name === "VIP"
              ? "#f59e0b"
              : cat.name === "Gold"
                ? "#6366f1"
                : "#22c55e",
        };
      }
      currentRow = nextMax;
    }
    return { name: "General", color: "#475569", price: 0 };
  };

  // Mock booked seats for existing events (for the Seat Map view)
  const mockBookedSeats = useMemo(() => {
    const booked = {};
    events.forEach((ev) => {
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

  const statesOfSelectedCountry = useMemo(() => {
    if (!postEvent.countryCode) return [];
    return State.getStatesOfCountry(postEvent.countryCode).map((s) => ({
      label: s.name,
      value: s.name,
    }));
  }, [postEvent.countryCode]);

  const districtsOfSelectedState = useMemo(() => {
    if (!postEvent.state || postEvent.country !== "India") return [];
    return getIndianDistricts(postEvent.state).map((d) => ({
      label: d,
      value: d,
    }));
  }, [postEvent.state, postEvent.country]);

  const citiesOfSelectedDistrict = useMemo(() => {
    if (!postEvent.district || postEvent.country !== "India") return [];
    return getIndianCities(postEvent.district).map((c) => ({
      label: c,
      value: c,
    }));
  }, [postEvent.district, postEvent.country]);

  const citiesOfSelectedState = useMemo(() => {
    if (
      !postEvent.stateCode ||
      !postEvent.countryCode ||
      postEvent.country === "India"
    )
      return [];
    return City.getCitiesOfState(
      postEvent.countryCode,
      postEvent.stateCode,
    ).map((c) => ({ label: c.name, value: c.name }));
  }, [postEvent.stateCode, postEvent.countryCode, postEvent.country]);

  const handleBannerChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () =>
      setPostEvent((pe) => ({
        ...pe,
        banner: file,
        bannerPreview: reader.result,
      }));
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const addGalleryFromFiles = (fileList) => {
    const files = Array.from(fileList || []).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (files.length === 0) return;
    const previews = new Array(files.length);
    let loaded = 0;
    files.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        previews[idx] = reader.result;
        loaded++;
        if (loaded === files.length) {
          setPostEvent((pe) => ({
            ...pe,
            galleryImages: [...(pe.galleryImages || []), ...files],
            galleryPreviews: [...(pe.galleryPreviews || []), ...previews],
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
    setPostEvent((pe) => ({
      ...pe,
      galleryImages: (pe.galleryImages || []).filter((_, i) => i !== idx),
      galleryPreviews: (pe.galleryPreviews || []).filter((_, i) => i !== idx),
    }));
  };

  const publishSeatEvent = () => {
    const isOnline = postEvent.type === "Online";
    const isMultiple = (postEvent.dateType || "single") === "multiple";
    const today = new Date().toISOString().split("T")[0];

    // Core validation — use toast-style state, not alert()
    if (!postEvent.title?.trim()) {
      showToast("Please fill in Event Title.", "error");
      return;
    }
    setPublishError("");

    // Date/Time Mapping — default to today if not set
    const startDate = postEvent.startDate || today;
    const startTime = postEvent.startTime || "";

    const effectiveSlots = isMultiple
      ? (postEvent.dateSlots || []).filter((s) => s.date)
      : [{ date: startDate, time: startTime }];

    const isSeating = !isOnline && (postEvent.ticketType === 'reserved' || postEvent.isReservedSeating);
    const categories = (postEvent.categories || []).map(c => ({
        ...c,
        price: postEvent.ticketMode === 'free' ? 0 : c.price,
        isFree: postEvent.ticketMode === 'free' ? true : !!c.isFree
    }));

    // Total Capacity
    let totalSeats = 100;
    if (isOnline) {
      totalSeats =
        postEvent.ticketLimitType === "limited"
          ? parseInt(postEvent.totalTickets, 10) || 100
          : 999999;
    } else {
      if (isSeating) {
        totalSeats =
          categories.reduce(
            (sum, cat) => sum + Number(cat.rows) * Number(postEvent.cols || 10),
            0,
          ) || 100;
      } else {
        // Support both normalTicketCapacity and the newer totalTickets field used in Sports
        totalSeats =
          parseInt(
            postEvent.totalTickets || postEvent.normalTicketCapacity,
            10,
          ) || 100;
      }
    }

    // Price (minimum across categories and their age-based rates)
    let finalPrice = 0;
    if (isOnline) {
      finalPrice = postEvent.ticketsAreFree ? 0 : Number(postEvent.price) || 0;
    } else if (
      (isSeating ||
        postEvent.type === "Dynamic" ||
        postEvent.type === "Sports" ||
        postEvent.type === "Tournament" ||
        postEvent.type === "Tournament Event") &&
      categories.length > 0
    ) {
      const prices = categories.flatMap((c) => {
        if (c.isFree) return [0];

        // Check for age-based pricing inside category
        const ageRates =
          c.agePricing || c.ageRates || c.age_pricing || c.age_rates || [];
        if (Array.isArray(ageRates) && ageRates.length > 0) {
          return ageRates.map((r) => Number(r.price) || 0);
        }

        return [Number(c.price || c.fee) || 0];
      });
      finalPrice =
        prices.length > 0
          ? Math.min(...prices)
          : Number(
              (postEvent.type === "Tournament" || postEvent.type === "Tournament Event" ? postEvent.registrationFee : undefined) ||
              postEvent.price ||
                postEvent.normalTicketPrice ||
                postEvent.registrationFee,
            ) || 0;
    } else {
      // Support both price and normalTicketPrice
      finalPrice = Number(postEvent.price || postEvent.normalTicketPrice) || 0;
    }

    const imgUrl =
      typeof postEvent.bannerPreview === "string" &&
      postEvent.bannerPreview.startsWith("data:")
        ? postEvent.bannerPreview
        : postEvent.img ||
          postEvent.image_url ||
          "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80";

    // Build payload with ONLY fields accepted by Convex
    if (
      !isOnline &&
      postEvent.type !== "Sports" &&
      postEvent.type !== "Dynamic" &&
      postEvent.type !== "Tournament Event"
    ) {
      if (!postEvent.country) {
        setPublishError("Please select a Country.");
        return;
      }
      if (!postEvent.state) {
        setPublishError("Please select a State.");
        return;
      }
      if (!postEvent.district) {
        setPublishError("Please select a District.");
        return;
      }
      if (!postEvent.city) {
        setPublishError("Please select a City.");
        return;
      }
    }

    const payload = {
      organiser_id: user?.id,
      title: (postEvent.title || "Untitled Event").trim(),
      category: postEvent.category || undefined,
      type: postEvent.type || "Physical Event",
      event_type: postEvent.type || "Physical Event",
      subtitle: postEvent.subtitle || undefined,
      date: firstSlot.date || today,
      expiry_date: postEvent.expiryDate || null,
      end_date: postEvent.endDate || postEvent.end_date || null,
      end_time: postEvent.endTime || postEvent.end_time || null,
      time: firstSlot.time || "TBA",
      img: imgUrl,
      banner_preview:
        typeof postEvent.bannerPreview === "string"
          ? postEvent.bannerPreview
          : undefined,
      event_type: postEvent.ticketType || 'reserved',
      seating_enabled: isSeating,
      total_seats: totalSeats,
      price: finalPrice,
      location: postEvent.location || undefined,
      venue: isOnline ? "Online / Virtual" : postEvent.venue || undefined,
      address: isOnline ? postEvent.meetingUrl : postEvent.address || undefined,
      country: !isOnline ? postEvent.country : undefined,
      state: !isOnline ? postEvent.state : undefined,
      district: !isOnline
        ? postEvent.district || postEvent.dynamic_config?.location?.district
        : undefined,
      city: !isOnline
        ? postEvent.city || postEvent.dynamic_config?.location?.city
        : undefined,
      pincode: !isOnline
        ? postEvent.zipCode || postEvent.location?.pincode
        : undefined,
      latitude: postEvent.latitude
        ? parseFloat(postEvent.latitude)
        : postEvent.dynamic_config?.location?.coordinates?.lat
          ? parseFloat(postEvent.dynamic_config.location.coordinates.lat)
          : undefined,
      longitude: postEvent.longitude
        ? parseFloat(postEvent.longitude)
        : postEvent.dynamic_config?.location?.coordinates?.lng
          ? parseFloat(postEvent.dynamic_config.location.coordinates.lng)
          : undefined,
      environment: isOnline ? "Virtual" : postEvent.environment || undefined,
      meeting_url: isOnline
        ? postEvent.meetingUrl || editingEvent?.meeting_url || undefined
        : undefined,
      featured: postEvent.isFeature === "Yes" ? true : false,
      exclusive: postEvent.isExclusive === "Yes" ? true : false,
      entity_type: "event",
      publish_status: "published",
      visibility_status: "public",
      approval_status: "approved",
      listing_status: "active",
      status: (() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Compare against start of today

        // Prioritize End Date, then Expiry Date, then Start Date
        const configBasic = postEvent.dynamic_config?.basicInfo || {};
        const configExpiry = configBasic.expiryDate || postEvent.expiryDate;
        let dateStr =
          postEvent.endDate ||
          configBasic.endDate ||
          configExpiry ||
          firstSlot.date ||
          today;

        // Handle DD/MM/YYYY or DD-MM-YYYY format for robustness
        if (
          typeof dateStr === "string" &&
          (dateStr.includes("/") || dateStr.includes("-"))
        ) {
          const separator = dateStr.includes("/") ? "/" : "-";
          const parts = dateStr.split(separator);
          if (parts[0].length <= 2) {
            const [d, m, y] = parts;
            dateStr = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
          }
        }

        const timeStr =
          postEvent.endTime || configBasic.endTime || firstSlot.time || "23:59";
        const eventDateTime = new Date(`${dateStr}T${timeStr}`);

        if (postEvent.eventStatus === "draft") return "draft";
        // Only expire if the date is strictly in the past (before today)
        if (!isNaN(eventDateTime.getTime())) {
          const checkDate = new Date(eventDateTime);
          checkDate.setHours(0, 0, 0, 0);
          if (checkDate < now) return "expired";
        }
        return "published";
      })(),
      meeting_type: postEvent.meetingType || "internal",
      external_meeting_url: postEvent.externalMeetingUrl || undefined,
      description: postEvent.description || undefined,
      rows: isSeating
        ? categories.reduce((sum, c) => sum + (Number(c.rows) || 0), 0)
        : undefined,
      cols: isSeating ? Number(postEvent.cols) || 10 : undefined,
      normal_ticket_capacity:
        !isSeating && !isOnline
          ? Number(postEvent.normalTicketCapacity) || undefined
          : undefined,
      normal_ticket_price:
        !isSeating && !isOnline
          ? Number(postEvent.normalTicketPrice) || undefined
          : undefined,
      virtual: isOnline ? true : false,
      seat_categories:
        isSeating && categories.length > 0
          ? categories.map((c) => ({
              name: c.name || "General",
              price: Number(c.price) || 0,
              rows: Number(c.rows) || 0,
              isFree: !!c.isFree,
            }))
          : undefined,
      date_slots:
        isMultiple && effectiveSlots.length > 0
          ? effectiveSlots.map((s) => ({ date: s.date, time: s.time || "" }))
          : undefined,
      layout_type:
        postEvent.blocks?.length > 0
          ? "block"
          : postEvent.layoutType || "stage",
      seat_map_background_url: postEvent.seatMapBackgroundUrl || undefined,
      blocks:
        postEvent.blocks?.length > 0
          ? postEvent.blocks?.map((b) => ({
              id: b.id,
              name: b.name,
              x: b.x !== undefined && b.x !== null ? Number(b.x) : undefined,
              y: b.y !== undefined && b.y !== null ? Number(b.y) : undefined,
              width: b.width !== undefined && b.width !== null ? Number(b.width) : undefined,
              height: b.height !== undefined && b.height !== null ? Number(b.height) : undefined,
              rows: Number(b.rows),
              cols: Number(b.cols),
              category: String(b.category),
              color: String(b.color),
              rowNaming: b.rowNaming || "alphabetic",
              startNumber: Number(b.startNumber) || 1,
              numberingDirection: b.numberingDirection || "ltr",
              price: Number(b.basePrice || b.price) || 0,
              basePrice: Number(b.basePrice || b.price) || 0,
              isGeneral: !!b.isGeneral,
              capacity: Number(b.capacity) || 0,
            }))
          : undefined,
      // Advanced Details
      age_limit: postEvent.ageLimit || "All ages",
      age_restriction: postEvent.ageLimit || "All ages",
      language: postEvent.language || "English",
      duration: postEvent.duration || "2-3 Hours",
      safety_measures: !!postEvent.safetyMeasures,
      seating_type: postEvent.seatingType || "FCFS",
      mandatory_checkin: !!postEvent.mandatoryCheckin,
      gallery: postEvent.galleryPreviews || [],
      gallery_images: postEvent.galleryPreviews || [],
      parking_details: postEvent.parkingDetails || undefined,
      entry_gate: postEvent.entryGate || undefined,
      emergency_exit: postEvent.emergencyExit || undefined,
      video_trailer_url: postEvent.videoTrailerUrl || undefined,
      dynamic_config: {
        ...(postEvent.dynamic_config || {}),
        basicInfo: {
          ...(postEvent.dynamic_config?.basicInfo || {}),
          isFree: postEvent.ticketMode === 'free',
          ticketMode: postEvent.ticketMode || 'paid',
        },
        organiser_name: postEvent.organiser_name || (postEvent.dynamic_config && postEvent.dynamic_config.organiser_name) || undefined,
        marathonCategories: postEvent.marathonCategories || [],
        seatingSections: postEvent.seatingSections || [],
        seatingBoxes: postEvent.seatingBoxes || [],
        form_fields:
          postEvent.dynamic_config?.form_fields ||
          (postEvent.dynamic_config || {}).form_fields ||
          [],
        virtualConfig: isOnline
          ? {
              chatEnabled: !!postEvent.chatEnabled,
              recordingEnabled: !!postEvent.recordingEnabled,
              qaEnabled: !!postEvent.qaEnabled,
              hdEnabled: !!postEvent.hdEnabled,
              allowMic: !!postEvent.allowMic,
              allowVideo: !!postEvent.allowVideo,
              allowScreen: !!postEvent.allowScreen,
              meetingPassword: postEvent.meetingPassword || "",
              visibility: postEvent.visibility || "public",
            }
          : undefined,
        amenities: {
          ambulance: !!postEvent.ambulance,
          cash_prize: !!postEvent.cash_prize,
          trophy: !!postEvent.trophy,
          medal: !!postEvent.medal,
          certificate: !!postEvent.certificate,
          tshirt: !!postEvent.tshirt,
          bib: !!postEvent.bib,
          breakfast: !!postEvent.breakfast,
          refreshments: !!postEvent.refreshments,
          first_aid: !!postEvent.first_aid,
          washroom: !!postEvent.washroom,
          parking: !!postEvent.parking,
          security: !!postEvent.security,
          physio: !!postEvent.physio,
          baggage: !!postEvent.baggage,
          photography: !!postEvent.photography,
          wifi: !!postEvent.wifi,
          charging: !!postEvent.charging,
          water: !!postEvent.water,
          vip_lounge: !!postEvent.vip_lounge,
          smoking_zone: !!postEvent.smoking_zone,
          kids_area: !!postEvent.kids_area,
          wheelchair: !!postEvent.wheelchair,
          lost_found: !!postEvent.lost_found,
        },
        sports_details: [
          "Tournament Event",
          "Tournament",
          "Sports Tournament",
          "Sports",
          "Sports Event",
        ].includes(postEvent.type)
          ? {
              tournament_type: postEvent.tournamentType,
              tournament_format: postEvent.tournamentFormat,
              sport_name: postEvent.sportName,
              registration_fee: postEvent.registrationFee,
              min_team_size: postEvent.minTeamSize,
              max_team_size: postEvent.maxTeamSize,
              rules_regulations: postEvent.rulesRegulations,
              terms_conditions: postEvent.termsConditions,
              prize_pool: postEvent.prizePool,
              contact_email: postEvent.contactEmail,
              contact_phone: postEvent.contactPhone,
              sport_type: postEvent.sportType,
              age_category: postEvent.ageCategory || postEvent.ageGroup,
              t_shirt_size: postEvent.tShirtSize,
              route_map: postEvent.routeMap,
              prize_details: postEvent.prizeDetails,
              teams_count: postEvent.teamsCount,
              match_schedule: postEvent.matchSchedule,
              trainer_details: postEvent.trainerDetails,
              session_slots: postEvent.sessionSlots,
            }
          : undefined,
      },
      seo_title: postEvent.dynamic_config?.seo?.title || undefined,
      seo_description: postEvent.dynamic_config?.seo?.description || undefined,
      slug: postEvent.dynamic_config?.seo?.slug || undefined,
      tags: postEvent.dynamic_config?.seo?.keywords
        ? postEvent.dynamic_config.seo.keywords.split(",").map((t) => t.trim())
        : undefined,
    }; // Remove undefined keys
    Object.keys(payload).forEach(
      (k) => payload[k] === undefined && delete payload[k],
    );

    if (editingEvent) {
      const { organiser_id, ...updatePayload } = payload;
      supabase.rpc("update_event_transaction", { p_event_id: editingEvent.id, p_update_payload: updatePayload })
        .then(async ({ error }) => {
            if (error) throw error;
            try {
              const isTournament = ["Tournament Event", "Tournament", "Sports Tournament"].includes(postEvent.type);
              const isMarathon = ["Marathon", "Marathon Event"].includes(postEvent.type);

              if (isTournament) {
                const tourneyPayload = {
                  id: editingEvent.id,
                  organiser_id: user?.id,
                  event_name: (postEvent.title || "").trim(),
                  sport_type: postEvent.sportType || postEvent.category || "General",
                  tournament_format: postEvent.tournamentFormat || "Knockout",
                  registration_fee: Number(postEvent.registrationFee) || 0,
                  registration_end_at: postEvent.registrationEndDate || null,
                  min_team_size: Number(postEvent.minTeamSize) || 1,
                  max_team_size: Number(postEvent.maxTeamSize) || 20,
                  audience_free_access: !!postEvent.audienceFreeAccess,
                  status: postEvent.eventStatus === "draft" ? "draft" : "published",
                  metadata: {
                    prizePool: postEvent.prizePool || "TBA",
                    contactEmail: postEvent.contactEmail,
                    contactPhone: postEvent.contactPhone,
                  },
                };
                await supabase.from("tournament_events").upsert(tourneyPayload);
              }

              if (isMarathon) {
                const marathonPayload = {
                  id: editingEvent.id,
                  organiser_id: user?.id,
                  title: (postEvent.title || "").trim(),
                  status: postEvent.eventStatus === "draft" ? "draft" : "published",
                };
                await supabase.from("marathon_config").upsert(marathonPayload);
              }

              const isCompetition = ["Competition", "Competition Event", "Marathon", "E-Sports"].includes(postEvent.type);
              if (isCompetition) {
                try {
                  const dc = postEvent.dynamic_config || {};
                  if (dc.competitionCategories?.length > 0) {
                    await supabase.from("competition_categories").delete().eq("event_id", editingEvent.id);
                    await supabase.from("competition_categories").insert(dc.competitionCategories.map(c => ({
                      event_id: editingEvent.id, category_name: c.name, min_age: c.minAge, max_age: c.maxAge, gender: c.gender
                    })));
                  }
                  if (dc.competitionEvents?.length > 0) {
                    await supabase.from("competition_events").delete().eq("event_id", editingEvent.id);
                    await supabase.from("competition_events").insert(dc.competitionEvents.map(e => ({
                      event_id: editingEvent.id, event_name: e.name, distance: e.distance, fee: e.fee, gender: e.gender
                    })));
                  }
                } catch (e) {
                  console.error("Competition sync failed:", e);
                }
              }

              if (postEvent.type === "Sports Event") {
                try {
                  const dc = postEvent.dynamic_config || {};
                  
                  // Upsert sports_events
                  const { data: sportsEvent, error: seErr } = await supabase.from("sports_events").upsert({
                    event_id: editingEvent.id,
                    sport_type: dc.sport_type || "Generic",
                    competition_format: dc.competition_format || "Knockout",
                    team_enabled: dc.team_enabled ?? true
                  }).select().single();

                  if (sportsEvent && !seErr) {
                    // Sync categories
                    if (dc.sports_categories?.length > 0) {
                      await supabase.from("sports_categories").delete().eq("sports_event_id", sportsEvent.id);
                      await supabase.from("sports_categories").insert(dc.sports_categories.map(c => ({
                        sports_event_id: sportsEvent.id, category_name: c.category_name, min_age: c.min_age, max_age: c.max_age, gender: c.gender
                      })));
                    }
                    // Sync match types
                    if (dc.sports_match_types?.length > 0) {
                      await supabase.from("sports_match_types").delete().eq("sports_event_id", sportsEvent.id);
                      await supabase.from("sports_match_types").insert(dc.sports_match_types.map(m => ({
                        sports_event_id: sportsEvent.id, match_type: m.match_type, entry_mode: m.entry_mode, team_size: m.team_size, price: m.price
                      })));
                    }
                  }
                } catch (e) {
                  console.error("Sports Event sync failed:", e);
                }
              }

              // Sync Categories
              if (postEvent.categories?.length > 0) {
                await supabase
                  .from("tournament_categories")
                  .delete()
                  .eq("event_id", editingEvent.id);
                const cats = postEvent.categories.map((c) => ({
                  event_id: editingEvent.id,
                  category_name: c.name,
                  category_fee: Number(c.fee) || 0,
                  max_teams: Number(c.maxTeams) || 16,
                  active: true,
                }));
                await supabase.from("tournament_categories").insert(cats);
              }
            } catch (err) {
              console.error("Relational update failed:", err);
            }

            // Sync General Admission Categories & Inventory
            if (postEvent.ticketType === 'general' && categories.length > 0) {
              try {
                // To keep it simple and safe, we can upsert or recreate.
                // For safety with existing bookings, it's better to update, but since we are replacing categories,
                // let's just make sure they exist in event_ticket_categories.
                for (const c of categories) {
                  // We'll check if the category exists by name for this event.
                  const { data: existingCat } = await supabase.from('event_ticket_categories')
                    .select('id')
                    .eq('event_id', editingEvent.id)
                    .eq('ticket_name', c.name)
                    .maybeSingle();

                  let ticketCatId = existingCat?.id;

                  if (!existingCat) {
                    const { data: newCat } = await supabase.from('event_ticket_categories').insert({
                      event_id: editingEvent.id,
                      ticket_name: c.name,
                      ticket_type: 'general',
                      price: c.price,
                      capacity: c.totalSlots || 0,
                      remaining_count: c.totalSlots || 0
                    }).select().single();
                    ticketCatId = newCat?.id;

                    if (ticketCatId) {
                      await supabase.from('general_inventory').insert({
                        event_id: editingEvent.id,
                        ticket_category_id: ticketCatId,
                        total_capacity: c.totalSlots || 0,
                        remaining_count: c.totalSlots || 0
                      });
                    }
                  } else {
                    // Update capacity if it exists
                    await supabase.from('event_ticket_categories')
                      .update({ price: c.price, capacity: c.totalSlots || 0 })
                      .eq('id', ticketCatId);
                    await supabase.from('general_inventory')
                      .update({ total_capacity: c.totalSlots || 0 })
                      .eq('ticket_category_id', ticketCatId);
                  }
                }
              } catch (err) {
                console.error("Failed to update general categories:", err);
              }
            }

          // Relational Seating Logic
          if (isSeating && postEvent.blocks?.length > 0) {
            try {
              const { data: layout, error: lError } = await supabase
                .from("venue_layouts")
                .insert({
                  event_id: editingEvent.id,
                  layout_name: postEvent.title,
                  image_url: postEvent.seatMapBackgroundUrl,
                  layout_type: postEvent.layoutType || "stadium",
                })
                .select()
                .single();

              if (layout) {
                for (const b of postEvent.blocks) {
                  const { data: block, error: bError } = await supabase
                    .from("seat_blocks")
                    .insert({
                      venue_layout_id: layout.id,
                      block_name: b.name,
                      block_type: b.category,
                      color_code: b.color,
                      base_price:
                        categories.find((c) => c.name === b.category)?.price ||
                        0,
                      x_pos: b.x,
                      y_pos: b.y,
                      width: b.width,
                      height: b.height,
                      rows_count: b.rows,
                      cols_count: b.cols,
                    })
                    .select()
                    .single();

                  if (block) {
                    const seatsBatch = [];
                    for (let r = 0; r < b.rows; r++) {
                      for (let c = 0; c < b.cols; c++) {
                        const rowLabel =
                          b.rowNaming === "alphabetic"
                            ? String.fromCharCode(65 + r)
                            : Number(b.startNumber || 1) + r;
                        const colLabel =
                          b.numberingDirection === "ltr" ? c + 1 : b.cols - c;
                        seatsBatch.push({
                          block_id: block.id,
                          row_name: String(rowLabel),
                          seat_number: String(colLabel),
                          status: "available",
                        });
                      }
                    }
                    if (seatsBatch.length > 0) {
                      await supabase.from("seats").insert(seatsBatch);
                    }
                  }
                }
              }
            } catch (err) {
              console.error("Seating sync failed:", err);
            }
          }
          setPostEvent(getInitialPostEvent());
          setEditingEvent(null);
          setAddEventStep("select_type");
          try {
            localStorage.removeItem("organiser_draft");
          } catch (_) {}
          setActiveTab("manage_events");
          showToast("Event updated successfully", "success");
          refreshEvents();
        })
        .catch((err) => {
          console.error("Error updating event:", err);
          showToast(
            "Failed to update: " + (err?.message || "Unknown error"),
            "error",
          );
        });
    } else {
      createEventMutation(payload)
        .then(async (mutationResult) => {
          const newEvent = mutationResult?.data?.[0];
          // Create Specialized records for Sports
          const isTournament = ["Tournament Event", "Tournament", "Sports Tournament"].includes(postEvent.type);
          const isMarathon = ["Marathon", "Marathon Event"].includes(postEvent.type);

          if (isTournament && newEvent?.id) {
            try {
              await supabase.from("tournament_events").insert({
                id: newEvent.id,
                organiser_id: user?.id,
                event_name: (postEvent.title || "").trim(),
                sport_type: postEvent.sportType || postEvent.category || "General",
                tournament_format: postEvent.tournamentFormat || "Knockout",
                registration_fee: Number(postEvent.registrationFee) || 0,
                registration_end_at: postEvent.registrationEndDate || null,
                min_team_size: Number(postEvent.minTeamSize) || 1,
                max_team_size: Number(postEvent.maxTeamSize) || 20,
                audience_free_access: !!postEvent.audienceFreeAccess,
                status: "published",
                metadata: {
                  prizePool: postEvent.prizePool || "TBA",
                  contactEmail: postEvent.contactEmail,
                  contactPhone: postEvent.contactPhone,
                },
              });

              if (postEvent.categories?.length > 0) {
                const cats = postEvent.categories.map((c) => ({
                  event_id: newEvent.id,
                  category_name: c.name,
                  category_fee: Number(c.fee) || 0,
                  max_teams: Number(c.maxTeams) || 16,
                  active: true,
                }));
                await supabase.from("tournament_categories").insert(cats);
              }
            } catch (err) {
              console.error("Tournament sync failed:", err);
            }
          }

          if (isMarathon && newEvent?.id) {
            try {
              await supabase.from("marathon_config").insert({
                id: newEvent.id,
                organiser_id: user?.id,
                title: (postEvent.title || "").trim(),
                status: "published",
              });
            } catch (err) {
              console.error("Marathon sync failed:", err);
            }
          }

          const isCompetition = ["Competition", "Competition Event", "Marathon", "E-Sports"].includes(postEvent.type);
          if (isCompetition && newEvent?.id) {
            try {
              const dc = postEvent.dynamic_config || {};
              if (dc.competitionCategories?.length > 0) {
                await supabase.from("competition_categories").insert(dc.competitionCategories.map(c => ({
                  event_id: newEvent.id, category_name: c.name, min_age: c.minAge, max_age: c.maxAge, gender: c.gender
                })));
              }
              if (dc.competitionEvents?.length > 0) {
                await supabase.from("competition_events").insert(dc.competitionEvents.map(e => ({
                  event_id: newEvent.id, event_name: e.name, distance: e.distance, fee: e.fee, gender: e.gender
                })));
              }
            } catch (err) {
              console.error("Competition sync failed:", err);
            }
          }

          if (postEvent.type === "Sports Event" && newEvent?.id) {
            try {
              const dc = postEvent.dynamic_config || {};
              const { data: sportsEvent, error: seErr } = await supabase.from("sports_events").insert({
                event_id: newEvent.id,
                sport_type: dc.sport_type || "Generic",
                competition_format: dc.competition_format || "Knockout",
                team_enabled: dc.team_enabled ?? true
              }).select().single();

              if (sportsEvent && !seErr) {
                if (dc.sports_categories?.length > 0) {
                  await supabase.from("sports_categories").insert(dc.sports_categories.map(c => ({
                    sports_event_id: sportsEvent.id, category_name: c.category_name, min_age: c.min_age, max_age: c.max_age, gender: c.gender
                  })));
                }
                if (dc.sports_match_types?.length > 0) {
                  await supabase.from("sports_match_types").insert(dc.sports_match_types.map(m => ({
                    sports_event_id: sportsEvent.id, match_type: m.match_type, entry_mode: m.entry_mode, team_size: m.team_size, price: m.price
                  })));
                }
              }
            } catch (err) {
              console.error("Sports Event creation failed:", err);
            }
          }

          if (postEvent.ticketType === 'general' && categories.length > 0 && newEvent?.id) {
            try {
              for (const c of categories) {
                const { data: ticketCat } = await supabase.from('event_ticket_categories').insert({
                  event_id: newEvent.id,
                  ticket_name: c.name,
                  ticket_type: 'general',
                  price: c.price,
                  capacity: c.totalSlots || 0,
                  remaining_count: c.totalSlots || 0
                }).select().single();

                if (ticketCat) {
                  await supabase.from('general_inventory').insert({
                    event_id: newEvent.id,
                    ticket_category_id: ticketCat.id,
                    total_capacity: ticketCat.capacity,
                    remaining_count: ticketCat.capacity
                  });
                }
              }
            } catch (err) {
              console.error("Failed to save general categories:", err);
            }
          }

          // Relational Seating Logic for New Event
          if (isSeating && postEvent.blocks?.length > 0 && newEvent?.id) {
            try {
              const { data: layout } = await supabase
                .from("venue_layouts")
                .insert({
                  event_id: newEvent.id,
                  layout_name: postEvent.title,
                  image_url: postEvent.seatMapBackgroundUrl,
                  layout_type: postEvent.layoutType || "stadium",
                })
                .select()
                .single();

              if (layout) {
                for (const b of postEvent.blocks) {
                  const { data: block } = await supabase
                    .from("seat_blocks")
                    .insert({
                      venue_layout_id: layout.id,
                      block_name: b.name,
                      block_type: b.category,
                      color_code: b.color,
                      base_price:
                        categories.find((c) => c.name === b.category)?.price ||
                        0,
                      x_pos: b.x,
                      y_pos: b.y,
                      width: b.width,
                      height: b.height,
                      rows_count: b.rows,
                      cols_count: b.cols,
                    })
                    .select()
                    .single();

                  if (block) {
                    const seatsBatch = [];
                    for (let r = 0; r < b.rows; r++) {
                      for (let c = 0; c < b.cols; c++) {
                        const rowLabel =
                          b.rowNaming === "alphabetic"
                            ? String.fromCharCode(65 + r)
                            : Number(b.startNumber || 1) + r;
                        const colLabel =
                          b.numberingDirection === "ltr" ? c + 1 : b.cols - c;
                        seatsBatch.push({
                          block_id: block.id,
                          row_name: String(rowLabel),
                          seat_number: String(colLabel),
                          status: "available",
                        });
                      }
                    }
                    if (seatsBatch.length > 0)
                      await supabase.from("seats").insert(seatsBatch);
                  }
                }
              }
            } catch (err) {
              console.error("New event seating sync failed:", err);
            }
          }
          const eventId = newEvent.data?.[0]?.id || newEvent.id;
          if (isOnline) {
            try {
              await createMeetingForEvent({
                event_id: eventId,
                title: payload.title,
                creator_id: user?.id,
                description: payload.description,
              });
            } catch (meetErr) {
              console.error("Failed to auto-create meeting:", meetErr);
            }
          }

          // Sports Config Insertion
          if (postEvent.type === "Sports") {
            const sportType = postEvent.sportType?.toLowerCase();
            if (sportType === "marathon") {
              await createMarathonConfig({
                event_id: eventId,
                distance_options: postEvent.distanceOptions || [],
                age_min: parseInt(postEvent.ageMin) || 0,
                age_max: parseInt(postEvent.ageMax) || 100,
                tshirt_enabled: (postEvent.tshirtSizes || []).length > 0,
                tshirt_sizes: postEvent.tshirtSizes || [],
                route_map_url: postEvent.routeMapUrl || "",
                prize_details: postEvent.prizeDetails || "",
                hydration_support: !!postEvent.hydrationSupport,
                medical_support: !!postEvent.medicalSupport,
                amenities: postEvent.amenities || [],
                distance_pricing: postEvent.distancePricing || {},
                age_pricing: postEvent.agePricing || {},
                category_configs: postEvent.categoryConfigs || {},
              });
            } else if (sportType === "tournament") {
              await createTournamentConfig({
                event_id: eventId,
                teams_count: parseInt(postEvent.teamsCount) || 0,
                match_type: postEvent.matchType || "Knockout",
                rules: postEvent.rules || "",
                venue_details: postEvent.venueDetails || "",
                schedule_json: postEvent.scheduleJson || [],
              });
            } else if (sportType === "coaching") {
              await createCoachingConfig({
                event_id: eventId,
                trainer_name: postEvent.trainerName || "",
                trainer_bio: postEvent.trainerBio || "",
                capacity: parseInt(postEvent.capacity) || 0,
                slot_duration: postEvent.slotDuration || "1 Hour",
                sessions_json: postEvent.sessionsJson || [],
              });
            }
          }

          // Handled above in specialized records section
          setPostEvent(getInitialPostEvent());
          setAddEventStep("select_type");
          try {
            localStorage.removeItem("organiser_draft");
          } catch (_) {}
          setActiveTab("manage_events");
          showToast("Event published successfully!", "success");
          refreshEvents();
        })
        .catch((err) => {
          console.error("Error publishing event:", err);
          showToast(
            "Failed to publish: " + (err?.message || "Check your input"),
            "error",
          );
        });
    }
  };

  const addDateSlot = () => {
    setNewEvent({
      ...newEvent,
      slots: [...newEvent.slots, { date: "", time: "" }],
    });
  };

  const removeDateSlot = (index) => {
    const updated = newEvent.slots.filter((_, i) => i !== index);
    setNewEvent({ ...newEvent, slots: updated });
  };

  const colors = {
    light: {
      bg: "#f8fafc",
      sidebar: "#ffffff",
      header: "#ffffff",
      textMain: "#020617",
      textSub: "#475569",
      cardBg: "#ffffff",
      border: "#e2e8f0",
      activeLink: "#f1f5f9",
      activeText: "#020617",
      sidebarBorder: "#e2e8f0",
    },
    dark: {
      bg: "#f8fafc",
      sidebar: "#ffffff",
      header: "#ffffff",
      textMain: "#020617",
      textSub: "#475569",
      cardBg: "#ffffff",
      border: "#e2e8f0",
      activeLink: "#f1f5f9",
      activeText: "#020617",
      sidebarBorder: "#e2e8f0",
    },
  };

  const t = colors[theme] || colors.light;
  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const renderEngagementMap = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = [];
    const totalDays = daysInMonth(year, month);
    const startingDay = firstDayOfMonth(year, month);

    for (let i = 0; i < startingDay; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          style={{
            height: "40px",
            backgroundColor: t.bg,
            border: `1px solid ${t.border}`,
            opacity: 0.1,
          }}
        ></div>,
      );
    }

    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day);
      const isSelected = selectedDate.toDateString() === date.toDateString();
      const isToday = new Date().toDateString() === date.toDateString();

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(date)}
          style={{
            height: "40px",
            border: `1px solid ${t.border}`,
            padding: "4px",
            cursor: "pointer",
            position: "relative",
            backgroundColor: isSelected ? "#3b82f615" : t.cardBg,
            transition: "0.2s",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                fontWeight: 800,
                color: isSelected
                  ? "#3b82f6"
                  : isToday
                    ? "#ec4899"
                    : t.textMain,
              }}
            >
              {day}
            </span>
          </div>
        </div>,
      );
    }
    return days;
  };

  const styles = (
    <style>{`
            .admin-container { 
                display: flex; 
                min-height: 100vh; 
                background: linear-gradient(135deg, #06b6d4 0%, #2563eb 40%, #1e1b4b 100%); 
                color: #ffffff;
                -webkit-font-smoothing: antialiased;
            }
            .sidebar {
                width: 280px;
                background-color: rgba(2, 6, 23, 0.3);
                backdrop-filter: blur(30px);
                color: rgba(255, 255, 255, 0.6);
                display: flex;
                flex-direction: column;
                position: fixed;
                height: 100vh;
                left: 0;
                top: 0;
                z-index: 100;
                border-right: 1px solid rgba(255, 255, 255, 0.05);
                box-shadow: 20px 0 50px rgba(0, 0, 0, 0.2);
            }
            .sidebar-logo {
                padding: 24px 30px;
                display: flex;
                align-items: center;
                gap: 12px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                filter: brightness(0) invert(1);
            }
            .sidebar-category {
                padding: 24px 30px 12px;
                font-size: 11px;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 0.25em;
                color: ${t.textSub};
            }
            .sidebar-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 14px 20px;
                margin: 4px 15px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                color: ${t.textSub};
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                border: none;
                background: none;
                text-align: left;
                border-radius: 18px;
                letter-spacing: -0.01em;
            }
            .sidebar-item:hover {
                background-color: ${t.activeLink};
                color: ${t.textMain};
                transform: translateX(6px);
            }
            .sidebar-item.active {
                background: linear-gradient(90deg, rgba(236, 72, 153, 0.1), rgba(219, 39, 119, 0.05));
                color: #ec4899;
                border: 1px solid rgba(236, 72, 153, 0.2);
                box-shadow: 0 4px 12px rgba(236, 72, 153, 0.05);
            }
            .sidebar-dropdown-item {
                display: flex;
                align-items: center;
                padding: 14px 24px 14px 56px;
                font-size: 13px;
                font-weight: 700;
                color: ${t.textSub};
                transition: all 0.3s;
                border: none;
                background: none;
                width: 100%;
                text-align: left;
                cursor: pointer;
                border-radius: 14px;
                margin: 4px 15px;
                width: calc(100% - 30px);
            }
            .sidebar-dropdown-item:hover {
                color: #ec4899;
                background-color: #fff1f2;
            }
            .sidebar-dropdown-item.active {
                color: #ec4899;
                font-weight: 800;
            }
            .main-content {
                margin-left: 260px;
                flex: 1;
                display: flex;
                flex-direction: column;
                min-width: 0;
                position: relative;
                background: transparent;
            }
            .top-header {
                height: 48px;
                background-color: rgba(255, 255, 255, 0.05);
                backdrop-filter: blur(20px);
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 24px;
                position: sticky;
                top: 0;
                z-index: 50;
            }
            .top-header-search {
                display: flex;
                align-items: center;
                background-color: rgba(255, 255, 255, 0.05);
                border-radius: 16px;
                padding: 10px 20px;
                width: 320px;
                gap: 12px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                transition: all 0.3s;
            }
            .top-header-search:focus-within {
                border-color: #facc15;
                background-color: rgba(255, 255, 255, 0.1);
                box-shadow: 0 0 0 4px rgba(250, 204, 21, 0.1);
            }
            .top-header-search input {
                background: none;
                border: none;
                outline: none;
                color: #0f172a;
                font-size: 13px;
                font-weight: 600;
                width: 100%;
            }
            .dashboard-overview-grid {
                display: grid;
                grid-template-columns: repeat(5, 1fr);
                gap: 20px;
                margin-bottom: 32px;
            }
            @media (max-width: 1400px) {
                .dashboard-overview-grid { grid-template-columns: repeat(5, 1fr); }
            }
            @media (max-width: 768px) {
                .dashboard-overview-grid { grid-template-columns: repeat(2, 1fr); }
            }
            .dashboard-charts-grid {
                display: grid;
                grid-template-columns: 1.5fr 1fr;
                gap: 24px;
            }
            @media (max-width: 1024px) {
                .dashboard-charts-grid { grid-template-columns: 1fr; }
            }
            .form-grid-4 {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 16px;
            }
            @media (max-width: 1024px) {
                .form-grid-4 { grid-template-columns: repeat(2, 1fr); }
            }
            @media (max-width: 640px) {
                .form-grid-4 { grid-template-columns: 1fr; }
            }
            .form-grid-2 {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
            }
            @media (max-width: 640px) {
                .form-grid-2 { grid-template-columns: 1fr; }
            }
            .form-grid-5 {
                display: grid;
                grid-template-columns: repeat(5, 1fr);
                gap: 10px;
            }
            @media (max-width: 1200px) {
                .form-grid-5 { grid-template-columns: repeat(3, 1fr); }
            }
            @media (max-width: 768px) {
                .form-grid-5 { grid-template-columns: repeat(2, 1fr); }
            }
            @media (max-width: 480px) {
                .form-grid-5 { grid-template-columns: 1fr; }
            }
            .detail-grid {
                display: grid;
                grid-template-columns: 1fr 400px;
                gap: 24px;
            }
            @media (max-width: 1200px) {
                .detail-grid { grid-template-columns: 1fr; }
            }
            .overview-card {
                background-color: rgba(255, 255, 255, 0.05);
                backdrop-filter: blur(10px);
                padding: 16px 20px;
                border-radius: 20px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
            }
            .overview-card:hover {
                transform: translateY(-8px);
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 0 20px rgba(250, 204, 21, 0.2);
                border-color: rgba(250, 204, 21, 0.4);
            }
            .overview-card-icon {
                width: 44px;
                height: 44px;
                border-radius: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 12px;
                box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
            }
            .welcome-banner {
                background-color: rgba(255, 255, 255, 0.05);
                backdrop-filter: blur(10px);
                border-radius: 28px;
                padding: 32px;
                margin-bottom: 32px;
                display: flex;
                align-items: center;
                gap: 24px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                position: relative;
                overflow: hidden;
            }
            .welcome-banner::after {
                content: '';
                position: absolute;
                top: 0;
                right: 0;
                width: 200px;
                height: 200px;
                background: linear-gradient(135deg, #ec489910 0%, #3b82f610 100%);
                border-radius: 100px;
                margin-top: -100px;
                margin-right: -100px;
            }
            .welcome-avatar {
                width: 72px;
                height: 72px;
                border-radius: 20px;
                border: 3px solid #f8fafc;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }
            .welcome-text h2 {
                margin: 0;
                font-size: 24px;
                font-weight: 900;
                color: #0f172a;
                letter-spacing: -0.03em;
                font-style: italic;
                text-transform: uppercase;
            }
            .welcome-text p {
                margin: 6px 0 0;
                font-size: 11px;
                font-weight: 800;
                color: #475569;
                text-transform: uppercase;
                letter-spacing: 0.2em;
            }
            .chart-card {
                background-color: #ffffff;
                border-radius: 24px;
                padding: 32px;
                border: 1px solid #e2e8f0;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            }
            .breadcrumb {
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 10px;
                font-weight: 900;
                color: #475569;
                margin-bottom: 32px;
                text-transform: uppercase;
                letter-spacing: 0.1em;
            }
            .breadcrumb-item {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .breadcrumb-item:after {
                content: '/';
                margin-left: 4px;
                opacity: 0.3;
            }
            .breadcrumb-item:last-child:after {
                content: none;
            }
            .breadcrumb-item:last-child {
                color: #ec4899;
            }
            @media (max-width: 1024px) {
                .sidebar { transform: translateX(-100%); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .sidebar.open { transform: translateX(0); }
                .main-content { margin-left: 0; }
            }
            .mobile-header {
                display: none;
                height: 70px;
                background-color: #ffffff;
                border-bottom: 1px solid #e2e8f0;
                align-items: center;
                justify-content: space-between;
                padding: 0 24px;
                position: sticky;
                top: 0;
                z-index: 90;
            }
            .bottom-nav {
                display: none;
                position: fixed;
                bottom: 24px;
                left: 24px;
                right: 24px;
                height: 70px;
                background-color: rgba(15, 23, 42, 0.95);
                backdrop-filter: blur(10px);
                border-radius: 24px;
                display: flex;
                justify-content: space-around;
                align-items: center;
                z-index: 1000;
                padding: 0 12px;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
            }
            .bottom-nav-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
                color: #475569;
                font-size: 10px;
                font-weight: 800;
                text-decoration: none;
                border: none;
                background: none;
                cursor: pointer;
                transition: all 0.3s;
                padding: 10px;
                border-radius: 16px;
                text-transform: uppercase;
            }
            .bottom-nav-item.active {
                color: #ffffff;
                background-color: #ec4899;
            }
            .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #e2e8f0;
                border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #cbd5e1;
            }
            @keyframes dropdownFade {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .dropdown-hover:hover {
                background-color: #f1f5f9;
            }
            .dropdown-hover-red:hover {
                background-color: #fef2f2;
            }
        `}</style>
  );

  // MFA View Component
  const renderMFAView = () => (
    <div
      style={{
        maxWidth: "480px",
        margin: "40px auto",
        textAlign: "center",
        backgroundColor: "#ffffff",
        padding: "40px",
        borderRadius: "24px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div
        style={{
          backgroundColor: "#fdf2f8",
          width: "64px",
          height: "64px",
          borderRadius: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
        }}
      >
        <Shield size={32} color="#ec4899" />
      </div>
      <h2
        style={{
          fontSize: "24px",
          fontWeight: 900,
          marginBottom: "8px",
          color: "#0f172a",
        }}
      >
        Two-Factor Security
      </h2>
      <p
        style={{
          color: "#334155",
          fontSize: "14px",
          fontWeight: 600,
          marginBottom: "32px",
        }}
      >
        Scan the QR code below to setup MFA
      </p>

      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "16px",
          borderRadius: "20px",
          width: "200px",
          height: "200px",
          margin: "0 auto 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            width: "168px",
            height: "168px",
            backgroundImage:
              "url('https://api.qrserver.com/v1/create-qr-code/?size=168x168&data=BookMyTicketOrganizerMFA')",
            backgroundSize: "cover",
          }}
        ></div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <input
          type="text"
          placeholder="Enter 6-digit code"
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            border: "1.5px solid #e2e8f0",
            textAlign: "center",
            fontWeight: "800",
            fontSize: "18px",
          }}
        />
        <button
          onClick={() => setCurrentStage("kyc_start")}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #0f172a, #334155)",
            color: "#fff",
            border: "none",
            fontWeight: 800,
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Verify & Continue
        </button>
      </div>
    </div>
  );

  // KYC Start View (Banner & Features)
  const renderKYCStartView = () => (
    <div
      style={{
        maxWidth: "1000px",
        margin: "30px auto",
        backgroundColor: "#ffffff",
        borderRadius: "24px",
        border: "1px solid #e2e8f0",
        overflow: "hidden",
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a, #1e293b)",
          padding: "40px",
          color: "#fff",
        }}
      >
        <span
          style={{
            backgroundColor: "#ec4899",
            color: "#fff",
            padding: "4px 12px",
            borderRadius: "100px",
            fontSize: "12px",
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Onboarding Stage 1
        </span>
        <h1 style={{ margin: "16px 0 8px", fontSize: "32px", fontWeight: 900 }}>
          Complete Your Profile
        </h1>
        <p
          style={{ margin: 0, opacity: 0.8, fontSize: "16px", fontWeight: 500 }}
        >
          Verify your account to start hosting professional events
        </p>
      </div>

      <div
        style={{
          display: "flex",
          padding: "40px",
          gap: "40px",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "100px",
            height: "100px",
            borderRadius: "24px",
            backgroundColor: "#fdf2f8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <ShieldCheck size={48} color="#ec4899" />
        </div>
        <div style={{ flex: 1 }}>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 900,
              color: "#0f172a",
              marginBottom: "8px",
            }}
          >
            Professional Organiser Verification
          </h2>
          <p
            style={{
              color: "#334155",
              fontSize: "15px",
              lineHeight: 1.6,
              marginBottom: "24px",
            }}
          >
            To ensure the highest quality of events on our platform, we require
            all organisers to complete a one-time KYC verification. This helps
            us maintain trust and security for all attendees. process.
          </p>
          <button
            onClick={() => setCurrentStage("kyc_wizard")}
            style={{
              backgroundColor: "#0f172a",
              color: "#fff",
              padding: "14px 32px",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: 900,
              border: "none",
              cursor: "pointer",
              transition: "transform 0.2s",
            }}
            className="hover:scale-105"
          >
            START VERIFICATION
          </button>
        </div>
      </div>
    </div>
  );

  // KYC Wizard View (3 steps)
  const renderKYCWizardView = () => (
    <div
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        height: "calc(100vh - 120px)",
        display: "flex",
        backgroundColor: "#ffffff",
        borderRadius: "24px",
        border: "1px solid #e2e8f0",
        overflow: "hidden",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.05)",
      }}
    >
      {/* Left Sidebar Tracker */}
      <div
        style={{
          width: "240px",
          position: "relative",
          flexShrink: 0,
          padding: "30px 24px",
          borderRight: "1px solid #f1f5f9",
          backgroundColor: "#fcfdfe",
        }}
      >
        <h2
          style={{
            fontSize: "12px",
            fontWeight: 900,
            color: "#475569",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            marginBottom: "24px",
          }}
        >
          Onboarding Progress
        </h2>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            position: "relative",
          }}
        >
          {[
            { num: 1, label: "Business Profile", desc: "Basic information" },
            { num: 2, label: "Document Assets", desc: "KYC verification" },
            { num: 3, label: "Final Consensus", desc: "Terms & Agreement" },
          ].map((step, idx) => {
            const isActive = kycStep === step.num;
            const isCompleted = kycStep > step.num;
            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "16px",
                  zIndex: 2,
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontWeight: 900,
                    fontSize: "16px",
                    backgroundColor: isCompleted
                      ? "#22c55e"
                      : isActive
                        ? "#0f172a"
                        : "#f8fafc",
                    color: isActive || isCompleted ? "#fff" : "#475569",
                    border:
                      isActive || isCompleted ? "none" : "1.5px solid #f1f5f9",
                    transition: "all 0.4s ease",
                    boxShadow: isActive
                      ? "0 10px 15px -3px rgba(15, 23, 42, 0.1)"
                      : "none",
                  }}
                >
                  {isCompleted ? <Check size={20} strokeWidth={3} /> : step.num}
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 800,
                      color: isActive || isCompleted ? "#0f172a" : "#475569",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {step.label}
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#475569",
                      marginTop: "2px",
                      fontWeight: 600,
                    }}
                  >
                    {step.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "30px 24px",
            scrollbarWidth: "thin",
          }}
        >
          {kycStep === 1 && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              <div
                style={{
                  backgroundColor: "#f8fafc",
                  padding: "24px",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "20px",
                  }}
                >
                  <div
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      paddingBottom: "20px",
                      display: "none",
                    }}
                  >
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        color: "#334155",
                        marginBottom: "8px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Category *
                    </label>
                    <select
                      value={kycFormData.category}
                      onChange={(e) =>
                        setKycFormData({
                          ...kycFormData,
                          category: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "1.5px solid #e2e8f0",
                        fontSize: "14px",
                        fontWeight: 600,
                        backgroundColor: "#fff",
                      }}
                    >
                      <option value="Individual">Individual</option>
                      <option value="Company">Company</option>
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        color: "#334155",
                        marginBottom: "8px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Full Legal Name *
                    </label>
                    <input
                      type="text"
                      placeholder="As per Government ID"
                      value={kycFormData.name}
                      onChange={(e) =>
                        setKycFormData({ ...kycFormData, name: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "1.5px solid #e2e8f0",
                        fontSize: "14px",
                        fontWeight: 600,
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        color: "#334155",
                        marginBottom: "8px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      PAN Card Number *
                    </label>
                    <input
                      type="text"
                      placeholder="ABCDE1234F"
                      value={kycFormData.panCard}
                      onChange={(e) =>
                        setKycFormData({
                          ...kycFormData,
                          panCard: e.target.value.toUpperCase(),
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "1.5px solid #e2e8f0",
                        fontSize: "14px",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                      }}
                    />
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        color: "#334155",
                        marginBottom: "8px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Registered Address *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter full address for communications"
                      value={kycFormData.address}
                      onChange={(e) =>
                        setKycFormData({
                          ...kycFormData,
                          address: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "1.5px solid #e2e8f0",
                        fontSize: "14px",
                        fontWeight: 600,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#fdf2f8",
                  padding: "24px",
                  borderRadius: "16px",
                  border: "1px solid #fbcfe8",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "20px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        color: "#334155",
                        marginBottom: "8px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Business Email *
                    </label>
                    <input
                      type="email"
                      value={kycFormData.email}
                      onChange={(e) =>
                        setKycFormData({
                          ...kycFormData,
                          email: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "1.5px solid #e2e8f0",
                        fontSize: "14px",
                        fontWeight: 600,
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        color: "#334155",
                        marginBottom: "8px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Contact Number *
                    </label>
                    <input
                      type="text"
                      value={kycFormData.mobile}
                      onChange={(e) =>
                        setKycFormData({
                          ...kycFormData,
                          mobile: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "1.5px solid #e2e8f0",
                        fontSize: "14px",
                        fontWeight: 600,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#eff6ff",
                  padding: "24px",
                  borderRadius: "16px",
                  border: "1px solid #dbeafe",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        color: "#334155",
                        marginBottom: "8px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Beneficiary Name
                    </label>
                    <input
                      type="text"
                      placeholder="Account Holder Name"
                      value={kycFormData.beneficiaryName}
                      onChange={(e) =>
                        setKycFormData({
                          ...kycFormData,
                          beneficiaryName: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "1.5px solid #e2e8f0",
                        fontSize: "14px",
                        fontWeight: 600,
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        color: "#334155",
                        marginBottom: "8px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      placeholder="HDFC0001234"
                      value={kycFormData.ifscCode}
                      onChange={(e) => handleIfscChange(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "1.5px solid #e2e8f0",
                        fontSize: "14px",
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        color: "#334155",
                        marginBottom: "8px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Account No
                    </label>
                    <input
                      type="text"
                      placeholder="0000 0000 0000"
                      value={kycFormData.accountNumber}
                      onChange={(e) =>
                        setKycFormData({
                          ...kycFormData,
                          accountNumber: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "1.5px solid #e2e8f0",
                        fontSize: "14px",
                        fontWeight: 700,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {kycStep === 2 && (
            <div style={{ padding: "30px", textAlign: "center" }}>
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  justifyContent: "center",
                }}
              >
                {["pan", "cheque", "aadhar"].map((id) => (
                  <div
                    key={id}
                    style={{
                      border: "2px dashed #cbd5e1",
                      padding: "24px",
                      borderRadius: "16px",
                      flex: 1,
                      cursor: "pointer",
                      transition: "all 0.3s",
                    }}
                    className="hover:border-blue-500 hover:bg-blue-50"
                  >
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "12px",
                        backgroundColor: "#f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 16px",
                        color: "#334155",
                      }}
                    >
                      <Building size={24} />
                    </div>
                    <label
                      style={{
                        fontSize: "14px",
                        fontWeight: 800,
                        color: "#0f172a",
                        display: "block",
                        marginBottom: "8px",
                        textTransform: "uppercase",
                      }}
                    >
                      {id.toUpperCase()}
                    </label>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#475569",
                        marginBottom: "16px",
                      }}
                    >
                      Upload clear photo or PDF
                    </p>
                    <input
                      type="file"
                      onChange={(e) =>
                        setKycFiles({
                          ...kycFiles,
                          [id]: e.target.files?.[0]?.name,
                        })
                      }
                      style={{ fontSize: "12px", width: "100%" }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {kycStep === 3 && (
            <div style={{ padding: "60px", textAlign: "center" }}>
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "20px",
                  backgroundColor: "#ec489910",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 32px",
                  color: "#ec4899",
                }}
              >
                <FileCheck2 size={40} />
              </div>
              <h3
                style={{
                  fontSize: "24px",
                  fontWeight: 900,
                  color: "#0f172a",
                  marginBottom: "12px",
                }}
              >
                Final Consensus
              </h3>
              <p
                style={{
                  color: "#334155",
                  fontSize: "16px",
                  marginBottom: "40px",
                  maxWidth: "480px",
                  margin: "0 auto 40px",
                }}
              >
                By clicking submit, you agree to the BookMyTicket Partner Terms
                of Service and Business Operating Guidelines.
              </p>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  justifyContent: "center",
                  fontSize: "16px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={agreedToVendor}
                  onChange={(e) => setAgreedToVendor(e.target.checked)}
                  style={{ width: "20px", height: "20px" }}
                />
                I accept the Partner Agreement
              </label>
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "16px 30px",
            borderTop: "1.5px solid #f1f5f9",
            backgroundColor: "#ffffff",
          }}
        >
          <button
            onClick={() => setKycStep(kycStep - 1)}
            disabled={kycStep === 1}
            style={{
              padding: "10px 24px",
              borderRadius: "10px",
              border: "1.5px solid #0f172a",
              background: "none",
              color: "#0f172a",
              fontWeight: 800,
              fontSize: "13px",
              cursor: kycStep === 1 ? "default" : "pointer",
              opacity: kycStep === 1 ? 0.3 : 1,
            }}
          >
            Back
          </button>
          <button
            onClick={() => {
              if (kycStep === 3) {
                if (!agreedToVendor) {
                  showToast("Please agree to terms", "error");
                  return;
                }
                if (organiserData?.id) {
                  const kycPayload = {
                    id: organiserData.id,
                    kyc_status: "Submitted",
                    kyc_details: {
                      ...kycFormData,
                      agreementAccepted: agreedToVendor,
                    },
                  };
                  submitKycMutation(kycPayload).then(async (res) => {
                    if (res.success) {
                      // Sync with partner_requests table
                      await supabase
                        .from("partner_requests")
                        .update({ status: "KYC Completed" })
                        .eq("id", organiserData.id);

                      refreshOrganiserData().then(() => {
                        setCurrentStage("pending");
                        setProfile((prev) => ({
                          ...prev,
                          kycStatus: "Submitted",
                        }));
                        showToast("KYC submitted for review", "success");
                      });
                    } else {
                      showToast(
                        "Failed to submit verification: " +
                          (res.error?.message || "Unknown error"),
                        "error",
                      );
                    }
                  });
                }
              } else {
                setKycStep(kycStep + 1);
              }
            }}
            style={{
              padding: "10px 32px",
              borderRadius: "10px",
              backgroundColor: "#0f172a",
              color: "#fff",
              border: "none",
              fontWeight: 800,
              fontSize: "13px",
              cursor: "pointer",
              boxShadow: "0 10px 15px -3px rgba(15, 23, 42, 0.2)",
            }}
          >
            {kycStep === 3 ? "Submit Verification" : "Next Step"}
          </button>
        </div>
      </div>
    </div>
  );

  // Pending View
  const renderPendingView = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div
        style={{
          fontSize: "20px",
          fontWeight: 700,
          color: t.textMain,
          marginBottom: "8px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            padding: "4px",
            backgroundColor: ACCENT_PINK,
            borderRadius: "4px",
            color: "#fff",
            display: "flex",
          }}
        >
          <ArrowRight size={16} style={{ transform: "rotate(180deg)" }} />
        </div>
        Organizer KYC
      </div>

      <div
        style={{
          backgroundColor: t.cardBg,
          borderRadius: "12px",
          border: `1px solid ${t.border}`,
          padding: "20px",
        }}
      >
        {organiserData?.kyc_status === 'Approved' && (
          <div className="mb-6 p-6 bg-indigo-50 border border-indigo-100 rounded-2xl">
             <div className="flex items-center gap-3 mb-3">
               <div className="p-2 bg-indigo-600 rounded-lg text-white">
                 <Sparkles size={20} />
               </div>
               <h3 className="text-lg font-black text-indigo-900 tracking-tight uppercase italic">Identity Verified!</h3>
             </div>
             <p className="text-sm font-medium text-indigo-700 leading-relaxed mb-4">
               Great news! Your KYC documents have been reviewed and approved by our team. Your account is now in the final stage of activation.
             </p>
             <div className="flex items-center gap-2 px-4 py-2 bg-white/50 rounded-xl border border-indigo-200 w-fit">
               <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
               <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Awaiting Platform Activation</span>
             </div>
          </div>
        )}
        {/* Status Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            border: `1px solid ${t.border}`,
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: t.bg,
                border: `2px solid ${t.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: t.textSub,
              }}
            >
              <CheckCircle size={16} />
            </div>
            <span
              style={{ fontSize: "12px", fontWeight: 600, color: t.textMain }}
            >
              KYC Verified
            </span>
          </div>

          <div
            style={{
              flex: 1,
              height: "2px",
              backgroundColor: t.border,
              margin: "0 24px",
            }}
          ></div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: "#fff",
                border: `4px solid ${ACCENT_PURPLE}`,
                background: ACCENT_GRADIENT,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <Clock size={20} />
            </div>
            <span
              style={{ fontSize: "12px", fontWeight: 600, color: t.textMain }}
            >
              Verification Pending
            </span>
          </div>
        </div>

        {/* Profile Contact Summary */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px",
            borderRadius: "12px",
            backgroundColor: theme === "light" ? "#f8fafc" : "#0f172a",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "8px",
                backgroundColor: "#fdf2f8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: ACCENT_PINK,
              }}
            >
              <Building size={24} />
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: 700,
                  color: t.textMain,
                }}
              >
                {profile.firstName}
              </h3>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  color: t.textMain,
                  fontWeight: 600,
                  marginTop: "4px",
                }}
              >
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: "#22c55e",
                  }}
                ></div>
                Active Business Profile
              </div>
            </div>
          </div>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              backgroundColor: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
            }}
          >
            <ImageIcon size={20} />
          </div>
        </div>

        {/* Details Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              padding: "16px",
              borderRadius: "12px",
              border: `1px solid ${t.border}`,
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                padding: "8px",
                borderRadius: "8px",
                backgroundColor: "#3b82f610",
                color: "#3b82f6",
              }}
            >
              <Mail size={18} />
            </div>
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: t.textSub,
                  marginBottom: "2px",
                }}
              >
                Email Address
              </div>
              <div
                style={{ fontSize: "12px", fontWeight: 600, color: t.textMain }}
              >
                {profile.email}
              </div>
            </div>
          </div>
          <div
            style={{
              padding: "16px",
              borderRadius: "12px",
              border: `1px solid ${t.border}`,
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                padding: "8px",
                borderRadius: "8px",
                backgroundColor: "#22c55e10",
                color: "#22c55e",
              }}
            >
              <AlertCircle size={18} />
            </div>
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: t.textSub,
                  marginBottom: "2px",
                }}
              >
                Phone Number
              </div>
              <div
                style={{ fontSize: "12px", fontWeight: 600, color: t.textMain }}
              >
                {kycFormData.mobile || "+918344442221"}
              </div>
            </div>
          </div>
          <div
            style={{
              padding: "16px",
              borderRadius: "12px",
              border: `1px solid ${t.border}`,
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                padding: "8px",
                borderRadius: "8px",
                backgroundColor: "#a855f710",
                color: "#a855f7",
              }}
            >
              <MapPin size={18} />
            </div>
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: t.textSub,
                  marginBottom: "2px",
                }}
              >
                Location
              </div>
              <div
                style={{ fontSize: "12px", fontWeight: 600, color: t.textMain }}
              >
                {kycFormData.city || "Pollachi"}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}
        >
          <div
            style={{
              width: "32%",
              padding: "16px",
              borderRadius: "12px",
              border: `1px solid #f59e0b50`,
              backgroundColor: "#f59e0b05",
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                padding: "8px",
                borderRadius: "8px",
                backgroundColor: "#f59e0b10",
                color: "#f59e0b",
              }}
            >
              <Calendar size={18} />
            </div>
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: t.textSub,
                  marginBottom: "2px",
                }}
              >
                Active Since
              </div>
              <div
                style={{ fontSize: "12px", fontWeight: 600, color: t.textMain }}
              >
                {new Date().toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ fontSize: "12px", color: t.textSub, marginTop: "8px" }}>
        If you need to make any changes or have queries, please contact us on{" "}
        <a href="mailto:admin@bookmyticket.io" style={{ color: "#3b82f6" }}>
          admin@bookmyticket.io
        </a>
      </div>
    </div>
  );

  // Meetings Tab Component
  const MeetingsTab = ({ t, effectiveEmail, router }) => {
    const { data: meetings, loading } = useSupabaseQuery(
      "meetings",
      (q) =>
        q
          .eq("creatorId", effectiveEmail)
          .order("created_at", { ascending: false }),
      [effectiveEmail],
    );
    const { mutate: createMeetingMutate } = useSupabaseMutation(
      async (supabase, data) => await supabase.from("meetings").insert(data),
    );
    const { mutate: deleteMeetingMutate } = useSupabaseMutation(
      async (supabase, { meetingId }) =>
        await supabase.from("meetings").delete().eq("id", meetingId),
    );

    const [isCreating, setIsCreating] = useState(false);
    const [newMeeting, setNewMeeting] = useState({
      title: "",
      description: "",
    });

    const handleCreate = async (e) => {
      e.preventDefault();
      if (!newMeeting.title.trim()) return;
      try {
        await createMeetingMutate({
          creatorId: effectiveEmail,
          title: newMeeting.title,
          description: newMeeting.description,
          settings: {
            lobby: false,
            muteOnJoin: false,
            videoOffOnJoin: false,
            chatEnabled: true,
            screenShareEnabled: true,
          },
          status: "scheduled",
          meetingLink: Math.random().toString(36).substring(2, 10), // mock virtual room code
        });
        setIsCreating(false);
        setNewMeeting({ title: "", description: "" });
      } catch (err) {
        alert("Failed to create meeting: " + err.message);
      }
    };

    const copyLink = (link) => {
      const url = `${window.location.origin}/${link}`;
      navigator.clipboard.writeText(url);
      alert("Meeting link copied to clipboard!");
    };

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight uppercase text-slate-900 leading-none">
              Meeting Hub
            </h2>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] mt-2">
              Manage your virtual sessions and video calls
            </p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="px-6 py-3.5 bg-black text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xl shadow-slate-200"
          >
            <Plus size={16} strokeWidth={3} /> New Meeting
          </button>
        </div>

        {isCreating && (
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100    ">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-bold uppercase tracking-widest text-pink-500">
                Configure Session
              </h3>
              <button
                onClick={() => setIsCreating(false)}
                className="p-2 hover:bg-slate-50 rounded-xl text-slate-600 transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2 px-1">
                  Meeting Title
                </label>
                <input
                  type="text"
                  required
                  value={newMeeting.title}
                  onChange={(e) =>
                    setNewMeeting({ ...newMeeting, title: e.target.value })
                  }
                  placeholder="Enter a descriptive title..."
                  className="w-full bg-slate-50 border border-slate-100 px-5 py-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all font-bold placeholder:text-slate-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2 px-1">
                  Description (Optional)
                </label>
                <textarea
                  value={newMeeting.description}
                  onChange={(e) =>
                    setNewMeeting({
                      ...newMeeting,
                      description: e.target.value,
                    })
                  }
                  placeholder="Brief agenda or instructions..."
                  className="w-full bg-slate-50 border border-slate-100 px-5 py-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all font-bold placeholder:text-slate-500 min-h-[100px]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-6 py-4 rounded-2xl font-bold text-[11px] uppercase tracking-widest text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                >
                  Initialize Meeting
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meetings?.length === 0 && !isCreating ? (
            <div className="col-span-full py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-500 mb-6">
                <Video size={40} />
              </div>
              <h4 className="text-lg font-bold tracking-tight uppercase text-slate-600">
                No Meetings Planned
              </h4>
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mt-2">
                Start by creating your first virtual event
              </p>
            </div>
          ) : (
            meetings?.map((meeting) => (
              <div
                key={meeting.id}
                className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div
                    className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                      meeting.status === "live"
                        ? "bg-emerald-50 text-emerald-600"
                        : meeting.status === "scheduled"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-slate-50 text-slate-700"
                    }`}
                  >
                    {meeting.status}
                  </div>
                  {!meeting.eventId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          confirm(
                            "Are you sure you want to delete this meeting? All history will be lost.",
                          )
                        ) {
                          deleteMeetingMutate({ meetingId: meeting.id }).catch(
                            (err) => alert("Failed to delete: " + err.message),
                          );
                        }
                      }}
                      className="p-2 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <h4 className="text-xl font-bold tracking-tight uppercase text-slate-900 mb-2 truncate">
                  {meeting.title}
                </h4>
                <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-8 line-clamp-2">
                  {meeting.description || "No description provided."}
                </p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      const url =
                        meeting.meetingLink &&
                        meeting.meetingLink.startsWith("http")
                          ? meeting.meetingLink
                          : `/${meeting.meetingLink}`;
                      window.open(url, "_blank");
                    }}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                  >
                    <Video size={16} /> Start / Join Meeting
                  </button>
                  <button
                    onClick={() => copyLink(meeting.meetingLink)}
                    className="w-full py-4 border border-slate-100 text-slate-600 rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Share size={16} /> Copy Invitation Link
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // Main Dashboard View (Approved)
  const renderDashboardView = () => {
    const renderTabContent = () => {
      const renderToggle = (label, field, options) => (
        <div className="mb-6">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-3 pl-1">
            {label}
            {label.endsWith("*") ? "" : "*"}
          </label>
          <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-inner">
            {options.map((opt) => {
              const isActive = postEvent[field] === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setPostEvent((prev) => ({ ...prev, [field]: opt.value }))
                  }
                  className={`flex-1 py-2.5 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all  ${
                    isActive
                      ? "bg-white text-pink-500 shadow-md shadow-slate-200/50 scale-[1.02] border border-slate-100"
                      : "text-slate-600 hover:text-slate-600 hover:bg-slate-100/50 border border-transparent"
                  }`}
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
        const categories =
          eventData.seatCategories || eventData.categories || [];

        // Helper to get category for a row
        const getRowCategory = (rIdx) => {
          let currentRowSum = 0;
          for (const cat of categories) {
            const catRows = Math.max(0, Math.floor(Number(cat.rows) || 0));
            if (rIdx < currentRowSum + catRows) {
              let color = "#22c55e"; // default green
              if (cat.name === "VIP")
                color = "#f59e0b"; // gold
              else if (cat.name === "Gold" || cat.name === "Premium")
                color = "#6366f1"; // purple
              return { ...cat, color };
            }
            currentRowSum += catRows;
          }
          return { name: "General", color: "#22c55e", price: 0 };
        };

        const totalCalculatedRows = categories.reduce(
          (sum, c) => sum + Math.max(0, Math.floor(Number(c.rows) || 0)),
          0,
        );
        const effectiveRows = Math.min(
          100,
          isPreview ? totalCalculatedRows : rows || totalCalculatedRows,
        );
        const effectiveCols = Math.min(100, cols);

        let currentCategoryName = null;

        return (
          <div
            className={`flex flex-col items-center bg-white ${isPreview ? "p-4" : "p-8"} rounded-3xl overflow-x-auto min-w-[600px] w-full border ${isPreview ? "border-dashed border-slate-200" : "border-slate-100 shadow-sm"}`}
          >
            <div className="flex flex-col gap-2.5 w-full max-w-5xl mx-auto pt-4">
              {[...Array(effectiveRows)].map((_, rIdx) => {
                const rowLabel = ROW_LABELS[rIdx] || `R${rIdx + 1}`;
                const cat = getRowCategory(rIdx);
                const isNewCategory = cat.name !== currentCategoryName;
                if (isNewCategory) currentCategoryName = cat.name;

                return (
                  <React.Fragment key={`row-wrap-${rIdx}`}>
                    {/* Category Price Divider */}
                    {isNewCategory && layout === "rate" && (
                      <div className="w-full flex items-center justify-center relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative bg-white px-4 text-[11px] font-bold tracking-widest text-slate-700 uppercase flex items-center gap-2">
                          <span>₹{cat.price}</span>
                          <span className="text-slate-900">{cat.name}</span>
                        </div>
                      </div>
                    )}
                    {/* Row */}
                    <div
                      className={`flex items-center justify-center gap-1 ${layout === "ground" && (rIdx + 1) % 3 === 0 ? "mb-6" : "mb-1"}`}
                    >
                      <div className="w-8 flex-shrink-0 text-right pr-4 font-bold text-[11px] text-slate-700 uppercase">
                        {rowLabel}
                      </div>
                      <div className="flex gap-2 justify-center">
                        {[...Array(effectiveCols)].map((_, cIdx) => {
                          const seatId = `${rowLabel}${cIdx + 1}`;
                          const isBooked =
                            !isPreview &&
                            mockBookedSeats[eventData.id]?.has(seatId);
                          const isAisle =
                            layout === "ground" &&
                            (cIdx + 1) % 4 === 1 &&
                            cIdx !== 0;

                          return (
                            <React.Fragment key={`seat-${cIdx}`}>
                              {isAisle && <div className="w-6" />}
                              <div
                                title={`${seatId} (${cat.name} - ₹${cat.price})`}
                                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center text-[10px] font-semibold transition-all cursor-pointer shadow-sm ${
                                  isBooked
                                    ? "bg-slate-200 text-transparent border-slate-200 shadow-none pointer-events-none"
                                    : "bg-white border hover:bg-green-50"
                                }`}
                                style={{
                                  borderColor: isBooked ? "#e2e8f0" : cat.color,
                                  color: isBooked ? "transparent" : cat.color,
                                }}
                              >
                                {(cIdx + 1).toString().padStart(2, "0")}
                              </div>
                            </React.Fragment>
                          );
                        })}
                      </div>
                      <div className="w-8 flex-shrink-0" />{" "}
                      {/* Right alignment balance */}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Stage Bottom UI */}
            {(layout === "stage" || layout === "rate") && (
              <div className="mt-20 mb-10 w-full flex flex-col items-center">
                <div
                  className="w-3/4 max-w-xl h-10 border-t-2 border-l-2 border-r-2 border-blue-200/50 rounded-t-2xl bg-gradient-to-t from-blue-50/30 to-white"
                  style={{ transform: "perspective(150px) rotateX(10deg)" }}
                ></div>
                <p className="text-[11px] font-medium text-slate-700 mt-4 tracking-wide">
                  All eyes this way please
                </p>
              </div>
            )}
            {layout === "ground" && (
              <div className="mt-16 mb-8 px-12 py-3 border-2 border-dashed border-slate-300 rounded-full text-slate-600 text-[11px] font-bold uppercase tracking-widest">
                Main Entrance / Exit
              </div>
            )}

            {!isPreview && (
              <div className="mt-auto border-t border-slate-100 w-full pt-6 pb-2 flex justify-center gap-10">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded border border-[#22c55e] bg-white"></div>
                  <span className="text-[11px] font-bold tracking-widest uppercase text-slate-700">
                    Available
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-[#22c55e]"></div>
                  <span className="text-[11px] font-bold tracking-widest uppercase text-slate-700">
                    Selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-slate-200"></div>
                  <span className="text-[11px] font-bold tracking-widest uppercase text-slate-700">
                    Sold
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      };

      const renderInput = (
        label,
        field,
        type = "text",
        placeholder = "",
        fullWidth = false,
      ) => (
        <div className={`mb-6 ${fullWidth ? "col-span-2" : "col-span-1"}`}>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-3 pl-1">
            {label}
            {label.endsWith("*") ? "" : "*"}
          </label>
          <div className="relative flex items-center">
            {type === "date" ? (
              <CalendarPicker
                value={postEvent[field] || ""}
                onChange={(val) =>
                  setPostEvent((prev) => ({ ...prev, [field]: val }))
                }
                placeholder={placeholder || "dd/mm/yyyy"}
              />
            ) : type === "time" ? (
              <TimePicker
                value={postEvent[field] || ""}
                onChange={(val) =>
                  setPostEvent((prev) => ({ ...prev, [field]: val }))
                }
                placeholder={placeholder || "--:--"}
              />
            ) : (
              <input
                type={type}
                value={postEvent[field] || ""}
                onChange={(e) =>
                  setPostEvent((prev) => ({ ...prev, [field]: e.target.value }))
                }
                placeholder={placeholder}
                className="w-full bg-slate-50 border border-slate-100 text-slate-900 text-sm font-semibold px-4 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-300 transition-all placeholder:text-slate-500 placeholder:font-medium shadow-inner"
              />
            )}
          </div>
        </div>
      );

      const renderSelect = (label, field, options) => {
        const isLocationField = [
          "country",
          "state",
          "city",
          "district",
        ].includes(field);

        const handleSelectChange = (val) => {
          const updates = { [field]: val };

          // Cascading Reset Logic
          if (field === "country") {
            updates.state = "";
            updates.district = "";
            updates.city = "";
            updates.zipCode = "";
            const countryData = COUNTRIES.find(
              (c) => c.label === (typeof val === "string" ? val : val.label),
            );
            const code = countryData?.code || "IN";

            // Approximate center for countries
            const centers = {
              IN: { lat: 20.5937, lng: 78.9629 },
              AE: { lat: 23.4241, lng: 53.8478 },
              SG: { lat: 1.3521, lng: 103.8198 },
              MY: { lat: 4.2105, lng: 101.9758 },
              TH: { lat: 15.87, lng: 100.9925 },
              DE: { lat: 51.1657, lng: 10.4515 },
              US: { lat: 37.0902, lng: -95.7129 },
            };

            updates.countryCode = code;
            updates.latitude = centers[code]?.lat || prev.latitude;
            updates.longitude = centers[code]?.lng || prev.longitude;
          } else if (field === "state") {
            updates.district = "";
            updates.city = "";
            updates.zipCode = "";
            const stateName = typeof val === "string" ? val : val.label;
            const stateObj = State.getStatesOfCountry(
              postEvent.countryCode,
            ).find((s) => s.name === stateName);
            updates.stateCode = stateObj?.isoCode || "";
          } else if (field === "district") {
            updates.city = "";
            updates.zipCode = "";
          } else if (field === "city") {
            // Auto-fetch Pincode from location_master for Indian cities
            const cityName = typeof val === "string" ? val : val.label;
            if (postEvent.country === "India") {
              supabase
                .from("location_master")
                .select("pincode")
                .eq("city", cityName)
                .limit(1)
                .then(({ data }) => {
                  if (data && data.length > 0) {
                    setPostEvent((prev) => ({
                      ...prev,
                      zipCode: data[0].pincode,
                    }));
                  }
                });
            }
          }

          setPostEvent((prev) => ({ ...prev, ...updates }));
        };

        return (
          <div className="mb-6 col-span-1">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-3 pl-1">
              {label}*
            </label>
            <CustomSelect
              value={postEvent[field] || ""}
              options={options.map((opt) =>
                typeof opt === "string"
                  ? opt
                  : {
                      label: opt.name || opt.label || String(opt),
                      value: opt.value || opt.name || opt.label || String(opt),
                    },
              )}
              onChange={handleSelectChange}
              placeholder={`Select ${label}...`}
              isLoading={
                isLocationField &&
                field !== "country" &&
                !options.length &&
                (field !== "city" || postEvent.country === "India")
              }
            />
          </div>
        );
      };
      switch (activeTab) {
        case "marathon_publish":
          return (
            <MarathonEventForm
              marathonId={editingMarathonId}
              onCancel={() => {
                setEditingMarathonId(null);
                setEditingEvent(null);
                setActiveTab("dashboard");
              }}
              onPublish={() => {
                setEditingMarathonId(null);
                setEditingEvent(null);
                refreshEvents();
                setActiveTab("manage_events");
              }}
            />
          );
        case "dashboard":
          return (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "24px" }}
            >
              {/* Stats Grid */}
              <div className="dashboard-overview-grid">
                <div
                  className="overview-card"
                  style={{ borderTop: "4px solid #f59e0b", cursor: "pointer" }}
                  onClick={() => setActiveTab("manage_events")}
                >
                  <div
                    className="overview-card-icon"
                    style={{
                      backgroundColor: "rgba(245, 158, 11, 0.1)",
                      color: "#f59e0b",
                      width: "56px",
                      height: "56px",
                    }}
                  >
                    <IndianRupee size={28} />
                  </div>
                  <p
                    style={{
                      fontSize: "28px",
                      fontWeight: 800,
                      margin: "0 0 4px",
                      color: t.textMain,
                    }}
                  >
                    ₹{Number(dashboardStats.revenue).toLocaleString()}
                  </p>
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#f59e0b",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Total Revenue
                  </p>
                </div>
                <div
                  className="overview-card"
                  style={{ borderTop: "4px solid #3b82f6", cursor: "pointer" }}
                  onClick={() => { setEventSubTab("all"); setActiveTab("manage_events"); }}
                >
                  <div
                    className="overview-card-icon"
                    style={{
                      backgroundColor: "rgba(59, 130, 246, 0.1)",
                      color: "#3b82f6",
                      width: "56px",
                      height: "56px",
                    }}
                  >
                    <Ticket size={28} />
                  </div>
                  <p
                    style={{
                      fontSize: "28px",
                      fontWeight: 800,
                      margin: "0 0 4px",
                      color: t.textMain,
                    }}
                  >
                    {Number(dashboardStats.totalEvents).toLocaleString()}
                  </p>
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#3b82f6",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Total Events
                  </p>
                </div>
                <div
                  className="overview-card"
                  style={{ borderTop: "4px solid #8b5cf6", cursor: "pointer" }}
                  onClick={() => setActiveTab("manage_events")}
                >
                  <div
                    className="overview-card-icon"
                    style={{
                      backgroundColor: "rgba(139, 92, 246, 0.1)",
                      color: "#8b5cf6",
                      width: "56px",
                      height: "56px",
                    }}
                  >
                    <Users size={28} />
                  </div>
                  <p
                    style={{
                      fontSize: "28px",
                      fontWeight: 800,
                      margin: "0 0 4px",
                      color: t.textMain,
                    }}
                  >
                    {Number(dashboardStats.totalBookings).toLocaleString()}
                  </p>
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#8b5cf6",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Total Bookings
                  </p>
                </div>
                <div
                  className="overview-card"
                  style={{ borderTop: "4px solid #10b981", cursor: "pointer" }}
                  onClick={() => { setEventSubTab("active"); setActiveTab("manage_events"); }}
                >
                  <div
                    className="overview-card-icon"
                    style={{
                      backgroundColor: "rgba(16, 185, 129, 0.1)",
                      color: "#10b981",
                      width: "56px",
                      height: "56px",
                    }}
                  >
                    <Activity size={28} />
                  </div>
                  <p
                    style={{
                      fontSize: "28px",
                      fontWeight: 800,
                      margin: "0 0 4px",
                      color: t.textMain,
                    }}
                  >
                    {Number(dashboardStats.activeEvents).toLocaleString()}
                  </p>
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#10b981",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Active Events
                  </p>
                </div>
                <div
                  className="overview-card"
                  style={{ borderTop: "4px solid #64748b", cursor: "pointer" }}
                  onClick={() => { setEventSubTab("expired"); setActiveTab("manage_events"); }}
                >
                  <div
                    className="overview-card-icon"
                    style={{
                      backgroundColor: "rgba(100, 116, 139, 0.1)",
                      color: "#64748b",
                      width: "56px",
                      height: "56px",
                    }}
                  >
                    <Clock size={28} />
                  </div>
                  <p
                    style={{
                      fontSize: "28px",
                      fontWeight: 800,
                      margin: "0 0 4px",
                      color: t.textMain,
                    }}
                  >
                    {Number(dashboardStats.expiredEvents || 0).toLocaleString()}
                  </p>
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Expired Events
                  </p>
                </div>

              </div>

              {/* V2 Specialized Publishing Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div
                  onClick={() => setActiveTab("marathon_publish")}
                  className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[2.5rem] text-white cursor-pointer group hover:shadow-2xl hover:shadow-indigo-500/30 transition-all duration-500"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <Trophy size={120} />
                  </div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-6">
                      <Activity size={24} className="text-indigo-200" />
                    </div>
                    <h3 className="text-3xl font-black uppercase tracking-tighter leading-none mb-2">
                      Publish Marathon
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200/80">
                      New V2 Image-Driven Infrastructure
                    </p>
                    <div className="mt-8 flex items-center gap-2 text-xs font-bold text-white bg-white/10 w-fit px-4 py-2 rounded-full backdrop-blur-sm group-hover:bg-indigo-400/30 transition-colors">
                      Launch System <ChevronRight size={14} />
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("post_event")}
                  className="relative overflow-hidden bg-gradient-to-br from-pink-500 to-rose-600 p-8 rounded-[2.5rem] text-white cursor-pointer group hover:shadow-2xl hover:shadow-rose-500/30 transition-all duration-500"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <Sparkles size={120} />
                  </div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-6">
                      <Ticket size={24} className="text-rose-200" />
                    </div>
                    <h3 className="text-3xl font-black uppercase tracking-tighter leading-none mb-2">
                      Regular Event
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-200/80">
                      Standard Ticketing & Seating System
                    </p>
                    <div className="mt-8 flex items-center gap-2 text-xs font-bold text-white bg-white/10 w-fit px-4 py-2 rounded-full backdrop-blur-sm group-hover:bg-rose-400/30 transition-colors">
                      Create Now <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Section - Compact Grid */}
              <div className="dashboard-charts-grid">
                {/* Revenue Flow Card */}
                <div
                  style={{
                    backgroundColor: t.cardBg,
                    padding: "32px",
                    borderRadius: "16px",
                    border: `1px solid ${t.border}`,
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "32px",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "18px",
                          fontWeight: 800,
                          color: t.textMain,
                        }}
                      >
                        Revenue Flow
                      </h3>
                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: "13px",
                          color: t.textSub,
                        }}
                      >
                        Current performance overview
                      </p>
                    </div>
                    <select
                      style={{
                        backgroundColor: t.bg,
                        border: `1px solid ${t.border}`,
                        borderRadius: "8px",
                        color: t.textSub,
                        fontSize: "12px",
                        padding: "6px 12px",
                        outline: "none",
                      }}
                    >
                      <option>Last 7 Days</option>
                      <option>Last 30 Days</option>
                    </select>
                  </div>
                  <div
                    style={{
                      height: "240px",
                      width: "100%",
                      position: "relative",
                    }}
                  >
                    <svg
                      viewBox="0 0 1000 300"
                      style={{ width: "100%", height: "100%" }}
                    >
                      <defs>
                        <linearGradient
                          id="grad1"
                          x1="0%"
                          y1="0%"
                          x2="0%"
                          y2="100%"
                        >
                          <stop
                            offset="0%"
                            style={{ stopColor: "#3b82f6", stopOpacity: 0.2 }}
                          />
                          <stop
                            offset="100%"
                            style={{ stopColor: "#3b82f6", stopOpacity: 0 }}
                          />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0,250 Q125,200 250,230 T500,120 T750,180 T1000,50 L1000,300 L0,300 Z"
                        fill="url(#grad1)"
                      />
                      <path
                        d="M0,250 Q125,200 250,230 T500,120 T750,180 T1000,50"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                      {[0, 1, 2, 3].map((i) => (
                        <line
                          key={i}
                          x1="0"
                          y1={i * 100}
                          x2="1000"
                          y2={i * 100}
                          stroke={t.border}
                          strokeWidth="1"
                          strokeDasharray="4"
                          opacity="0.3"
                        />
                      ))}
                    </svg>
                  </div>
                </div>

                {/* Compact Engagement Map Card */}
                <div
                  style={{
                    backgroundColor: t.cardBg,
                    padding: "32px",
                    borderRadius: "16px",
                    border: `1px solid ${t.border}`,
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "24px",
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "18px",
                        fontWeight: 800,
                        color: t.textMain,
                      }}
                    >
                      Engagement Map
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <button
                        onClick={() =>
                          setCurrentDate(
                            new Date(
                              currentDate.setMonth(currentDate.getMonth() - 1),
                            ),
                          )
                        }
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: t.textSub,
                          display: "flex",
                        }}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 800,
                          color: t.textMain,
                          width: "100px",
                          textAlign: "center",
                        }}
                      >
                        {currentDate.toLocaleString("default", {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <button
                        onClick={() =>
                          setCurrentDate(
                            new Date(
                              currentDate.setMonth(currentDate.getMonth() + 1),
                            ),
                          )
                        }
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: t.textSub,
                          display: "flex",
                        }}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                  <div
                    style={{
                      border: `1px solid ${t.border}`,
                      borderRadius: "12px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(7, 1fr)",
                        backgroundColor: t.bg,
                        borderBottom: `1px solid ${t.border}`,
                      }}
                    >
                      {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                        <div
                          key={i}
                          style={{
                            textAlign: "center",
                            padding: "8px 0",
                            fontSize: "10px",
                            fontWeight: 900,
                            color: t.textSub,
                          }}
                        >
                          {day}
                        </div>
                      ))}
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(7, 1fr)",
                      }}
                    >
                      {renderEngagementMap()}
                    </div>
                  </div>
                  <div
                    style={{
                      marginTop: "20px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px",
                      borderRadius: "12px",
                      border: `1px solid ${t.border}`,
                      backgroundColor: t.bg + "50",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        backgroundColor: "#ec489910",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#ec4899",
                      }}
                    >
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "11px",
                          color: t.textSub,
                          fontWeight: 700,
                        }}
                      >
                        Pulse Check
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "12px",
                          fontWeight: 800,
                          color: t.textMain,
                        }}
                      >
                        High Activity Expected
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        case "manage_events": {
          const Breadcrumb = ({ title }) => (
            <div
              className="breadcrumb"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "24px",
                fontSize: "14px",
                color: t.textSub,
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
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
              <div
                style={{
                  backgroundColor: t.cardBg,
                  padding: "32px",
                  borderRadius: "16px",
                  border: `1px solid ${t.border}`,
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "32px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "24px",
                      fontWeight: 800,
                      color: t.textMain,
                      margin: 0,
                    }}
                  >
                    {eventSubTab.charAt(0).toUpperCase() + eventSubTab.slice(1)} Events
                  </h3>
                  <button
                    onClick={() => {
                      setEditingEvent(null);
                      setPostEvent(getInitialPostEvent());
                      setAddEventStep("select_type");
                      setActiveTab("post_event");
                    }}
                    style={{
                      padding: "12px 24px",
                      background: ACCENT_GRADIENT,
                      backgroundColor: ACCENT_PINK,
                      color: "#fff",
                      border: "none",
                      borderRadius: "10px",
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                      transition: "0.2s",
                      boxShadow: "0 10px 24px rgba(236,72,153,0.25)",
                    }}
                  >
                    <Plus size={18} /> Post New Event
                  </button>
                </div>
                {/* Sub-tabs for Event Status */}
                <div 
                  style={{ 
                    display: "flex", 
                    gap: "12px", 
                    marginBottom: "32px",
                    padding: "4px",
                    backgroundColor: "#f8fafc",
                    borderRadius: "14px",
                    width: "fit-content"
                  }}
                >
                  {[
                    { id: "all", label: "All", color: "#3b82f6" },
                    { id: "active", label: "Active", color: "#10b981" },
                    { id: "completed", label: "Completed", color: "#14b8a6" },
                    { id: "draft", label: "Drafts", color: "#f59e0b" },
                    { id: "expired", label: "Expired", color: "#64748b" },
                    { id: "cancelled", label: "Cancelled", color: "#ef4444" },
                    { id: "archived", label: "Archived", color: "#475569" }
                  ].map((tab) => {
                    const isActive = eventSubTab === tab.id;
                    const count = tab.id === "all" ? events.length : events.filter(e => e.uiStatus === tab.id).length;
                    
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setEventSubTab(tab.id)}
                        style={{
                          padding: "10px 20px",
                          borderRadius: "10px",
                          fontSize: "12px",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          transition: "0.2s",
                          backgroundColor: isActive ? "#fff" : "transparent",
                          color: isActive ? tab.color : "#64748b",
                          boxShadow: isActive ? "0 4px 6px -1px rgba(0,0,0,0.05)" : "none",
                          border: isActive ? `1px solid ${tab.color}20` : "1px solid transparent",
                          cursor: "pointer"
                        }}
                      >
                        {tab.label}
                        <span 
                          style={{ 
                            padding: "2px 6px", 
                            borderRadius: "6px", 
                            backgroundColor: isActive ? `${tab.color}15` : "#f1f5f9",
                            fontSize: "10px",
                            fontWeight: 900
                          }}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div>
                  {(() => {
                    const filteredMappableEvents = eventSubTab === "all" ? events : events.filter((ev) => ev.uiStatus === eventSubTab);
                    const isExpiredSection = eventSubTab === "expired";

                    return (
                      <div
                        key={eventSubTab}
                        style={{ marginBottom: "0px" }}
                      >
                        <div style={{ overflowX: "auto" }}>
                          <table
                            style={{
                              width: "100%",
                              borderCollapse: "separate",
                              borderSpacing: "0 8px",
                            }}
                          >
                            <thead>
                              <tr style={{ textAlign: "left" }}>
                                <th
                                  style={{
                                    padding: "12px 16px",
                                    color: t.textSub,
                                    fontSize: "13px",
                                    fontWeight: 700,
                                  }}
                                >
                                  Event Details
                                </th>
                                <th
                                  style={{
                                    padding: "12px 16px",
                                    color: t.textSub,
                                    fontSize: "13px",
                                    fontWeight: 700,
                                  }}
                                >
                                  Date & Time
                                </th>
                                <th
                                  style={{
                                    padding: "12px 16px",
                                    color: t.textSub,
                                    fontSize: "13px",
                                    fontWeight: 700,
                                  }}
                                >
                                  Tickets Analytics
                                </th>
                                <th
                                  style={{
                                    padding: "12px 16px",
                                    color: t.textSub,
                                    fontSize: "13px",
                                    fontWeight: 700,
                                  }}
                                >
                                  Status
                                </th>
                                <th
                                  style={{
                                    padding: "12px 16px",
                                    color: t.textSub,
                                    fontSize: "13px",
                                    fontWeight: 700,
                                  }}
                                >
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredMappableEvents.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={5}
                                    style={{
                                      textAlign: "center",
                                      padding: "84px",
                                      color: t.textSub,
                                    }}
                                  >
                                    <div style={{ marginBottom: "16px", opacity: 0.5 }}>
                                      <Calendar size={48} style={{ margin: "0 auto" }} />
                                    </div>
                                    <p style={{ fontWeight: 800, fontSize: "16px", color: t.textMain, marginBottom: "4px" }}>
                                      No {eventSubTab} events found
                                    </p>
                                    <p style={{ fontSize: "12px" }}>
                                      Your {eventSubTab} events will appear here once they are available.
                                    </p>
                                  </td>
                                </tr>
                              ) : (
                                filteredMappableEvents.map((ev) => (
                                  <tr
                                    key={ev.id}
                                    style={{
                                      backgroundColor: t.bg,
                                      borderRadius: "12px",
                                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                      opacity: isExpiredSection ? 0.7 : 1,
                                    }}
                                  >
                                    <td
                                      style={{
                                        padding: "16px",
                                        borderRadius: "12px 0 0 12px",
                                      }}
                                    >
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "12px",
                                        }}
                                      >
                                        <div
                                          style={{
                                            width: "48px",
                                            height: "48px",
                                            borderRadius: "10px",
                                            backgroundColor:
                                              (ev.type === "Online"
                                                ? "#22c55e"
                                                : ev.type === "Sports"
                                                  ? "#3b82f6"
                                                  : "#f97316") +
                                              (isExpiredSection ? "10" : "20"),
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                          }}
                                        >
                                          {ev.type === "Online" ? (
                                            <CloudUpload
                                              size={24}
                                              color="#22c55e"
                                            />
                                          ) : ev.type === "Sports" ? (
                                            <Trophy size={24} color="#3b82f6" />
                                          ) : (
                                            <MapPin size={24} color="#f97316" />
                                          )}
                                        </div>
                                        <div>
                                          <p
                                            style={{
                                              fontWeight: 800,
                                              margin: 0,
                                              fontSize: "15px",
                                              color: t.textMain,
                                            }}
                                          >
                                            {ev.title}
                                          </p>
                                          <div
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: "8px",
                                              marginTop: "2px",
                                            }}
                                          >
                                            <p
                                              style={{
                                                fontSize: "12px",
                                                color: t.textSub,
                                                margin: 0,
                                              }}
                                            >
                                              {ev.venue || "Online"}
                                            </p>
                                            {ev.type === "Online" &&
                                              ev.meetingUrl && (
                                                <div
                                                  style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "4px",
                                                    backgroundColor: "#f1f5f9",
                                                    padding: "2px 6px",
                                                    borderRadius: "4px",
                                                    border: "1px solid #e2e8f0",
                                                  }}
                                                >
                                                  <span
                                                    style={{
                                                      fontSize: "9px",
                                                      fontWeight: 800,
                                                      color: "#334155",
                                                      textTransform:
                                                        "uppercase",
                                                    }}
                                                  >
                                                    Code:
                                                  </span>
                                                  <span
                                                    style={{
                                                      fontSize: "10px",
                                                      fontWeight: 700,
                                                      color: "#0f172a",
                                                      fontFamily: "monospace",
                                                    }}
                                                  >
                                                    {ev.meetingUrl}
                                                  </span>
                                                </div>
                                              )}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td style={{ padding: "16px" }}>
                                      <div
                                        style={{
                                          fontSize: "14px",
                                          fontWeight: 700,
                                          color: t.textMain,
                                        }}
                                      >
                                        {ev.date ||
                                          ev.startDate ||
                                          ev.dynamic_config?.basicInfo
                                            ?.regEnd ||
                                          "TBA"}
                                        {ev.end_date &&
                                        ev.end_date !==
                                          (ev.date || ev.startDate)
                                          ? ` - ${ev.end_date}`
                                          : ""}
                                      </div>
                                      <div
                                        style={{
                                          fontSize: "12px",
                                          color: t.textSub,
                                          marginTop: "2px",
                                        }}
                                      >
                                        {ev.time || ev.startTime || "TBA"}
                                        {ev.end_time ? ` - ${ev.end_time}` : ""}
                                      </div>
                                    </td>
                                    <td style={{ padding: "16px" }}>
                                      {ev.total_seats || ev.totalSeats ? (
                                        <div style={{ minWidth: "140px" }}>
                                          <div
                                            style={{
                                              display: "flex",
                                              justifyContent: "space-between",
                                              marginBottom: "6px",
                                            }}
                                          >
                                            <span
                                              style={{
                                                fontSize: "12px",
                                                fontWeight: 700,
                                                color: t.textMain,
                                              }}
                                            >
                                              {(ev.total_seats ||
                                                ev.totalSeats) -
                                                (ev.booked_seats ||
                                                  ev.bookedSeats ||
                                                  0)}{" "}
                                              <span
                                                style={{
                                                  color: t.textSub,
                                                  fontWeight: 400,
                                                }}
                                              >
                                                Available
                                              </span>
                                            </span>
                                            <span
                                              style={{
                                                fontSize: "11px",
                                                fontWeight: 700,
                                                color: "#3b82f6",
                                              }}
                                            >
                                              {Math.round(
                                                ((ev.booked_seats ||
                                                  ev.bookedSeats ||
                                                  0) /
                                                  (ev.total_seats ||
                                                    ev.totalSeats)) *
                                                  100,
                                              )}
                                              %
                                            </span>
                                          </div>
                                          <div
                                            style={{
                                              height: 6,
                                              borderRadius: 10,
                                              background: t.border,
                                              overflow: "hidden",
                                            }}
                                          >
                                            <div
                                              style={{
                                                height: "100%",
                                                width: `${Math.min(100, ((ev.booked_seats || ev.bookedSeats || 0) / (ev.total_seats || ev.totalSeats)) * 100)}%`,
                                                background:
                                                  "linear-gradient(90deg, #3b82f6, #6366f1)",
                                                borderRadius: 10,
                                              }}
                                            />
                                          </div>
                                        </div>
                                      ) : (
                                        <span
                                          style={{
                                            color: t.textSub,
                                            fontSize: 13,
                                          }}
                                        >
                                          Standard Admission
                                        </span>
                                      )}
                                    </td>
                                    <td style={{ padding: "16px" }}>
                                      <span
                                        style={{
                                          padding: "6px 14px",
                                          borderRadius: "100px",
                                          fontSize: "11px",
                                          fontWeight: 800,
                                          backgroundColor:
                                            ev.status === "published"
                                              ? "#22c55e20"
                                              : ev.status === "expired"
                                                ? "#ef444420"
                                                : "#f9731620",
                                          color:
                                            ev.status === "published"
                                              ? "#22c55e"
                                              : ev.status === "expired"
                                                ? "#ef4444"
                                                : "#f97316",
                                          textTransform: "uppercase",
                                        }}
                                      >
                                        {ev.status || "draft"}
                                      </span>
                                    </td>
                                    <td
                                      style={{
                                        padding: "16px",
                                        borderRadius: "0 12px 12px 0",
                                      }}
                                    >
                                      <div
                                        style={{ display: "flex", gap: "8px" }}
                                      >
                                        <button
                                          onClick={() => {
                                            setEditingEvent(ev);
                                            setPostEvent({
                                              ...getInitialPostEvent(),
                                              ...ev,
                                              zipCode: ev.pincode || ev.zipCode || "",
                                              // Map snake_case from Convex to camelCase for form state
                                              ticketType:
                                                ev.event_type || 'reserved',
                                              seatingEnabled:
                                                ev.seating_enabled !== undefined
                                                  ? ev.seating_enabled
                                                  : ev.seatingEnabled,
                                              totalSeats:
                                                ev.total_seats || ev.totalSeats,
                                              normalTicketCapacity:
                                                ev.normal_ticket_capacity ||
                                                ev.normalTicketCapacity,
                                              normalTicketPrice:
                                                ev.normal_ticket_price ||
                                                ev.normalTicketPrice,
                                              categories:
                                                ev.seat_categories ||
                                                ev.seatCategories ||
                                                ev.categories ||
                                                getInitialPostEvent()
                                                  .categories,
                                              dateSlots:
                                                ev.date_slots || ev.dateSlots,
                                              meetingUrl:
                                                ev.meeting_url || ev.meetingUrl,
                                              meetingType:
                                                ev.meeting_type ||
                                                ev.meetingType,
                                              externalMeetingUrl:
                                                ev.external_meeting_url ||
                                                ev.externalMeetingUrl,

                                              ...(ev.sports_details ||
                                                ev.dynamic_config
                                                  ?.sports_details ||
                                                {}),
                                              sportType:
                                                ev.sports_details?.sport_type ||
                                                ev.dynamic_config
                                                  ?.sports_details
                                                  ?.sport_type ||
                                                ev.sportType,
                                              seatingSections:
                                                ev.dynamic_config?.seatingSections ||
                                                (ev.blocks?.length > 0 ? (ev.blocks || []).filter(b => b.category !== 'Box' && b.category !== 'box').map(b => {
                                                    const isGen = !!b.isGeneral;
                                                    let newSeats = [];
                                                    if (!isGen && b.rows > 0 && b.cols > 0) {
                                                        for (let r = 0; r < b.rows; r++) {
                                                            const rowLabel = String.fromCharCode(65 + r);
                                                            for (let s = 1; s <= b.cols; s++) {
                                                                newSeats.push({
                                                                    id: `seat-${Date.now()}-${b.id}-${rowLabel}${s}`,
                                                                    rowLabel: rowLabel,
                                                                    seatNumber: s,
                                                                    seatLabel: `${rowLabel}${s}`,
                                                                    seatType: (b.category || 'general').toLowerCase(),
                                                                    status: 'available',
                                                                    isAisle: false
                                                                });
                                                            }
                                                        }
                                                    }
                                                    return {
                                                        id: b.id || `sec-${Date.now()}-${Math.random()}`,
                                                        name: b.name,
                                                        basePrice: b.basePrice || b.price || 0,
                                                        seats: newSeats,
                                                        rows: b.rows || 0,
                                                        cols: b.cols || 0,
                                                        isGeneral: isGen,
                                                        capacity: b.capacity || 0
                                                    };
                                                }) : []),
                                              seatingBoxes:
                                                ev.dynamic_config?.seatingBoxes ||
                                                (ev.blocks?.length > 0 ? (ev.blocks || []).filter(b => b.category === 'Box' || b.category === 'box').map(b => ({
                                                    id: b.id || `box-${Date.now()}-${Math.random()}`,
                                                    name: b.name,
                                                    seatCount: b.cols || 6,
                                                    price: b.basePrice || b.price || 0,
                                                    type: 'VIP'
                                                })) : []),
                                              ageCategory:
                                                ev.sports_details
                                                  ?.age_category ||
                                                ev.dynamic_config
                                                  ?.sports_details
                                                  ?.age_category ||
                                                ev.ageCategory,
                                              tShirtSize:
                                                ev.sports_details
                                                  ?.t_shirt_size ||
                                                ev.dynamic_config
                                                  ?.sports_details
                                                  ?.t_shirt_size ||
                                                ev.tShirtSize,
                                              routeMap:
                                                ev.sports_details?.route_map ||
                                                ev.dynamic_config
                                                  ?.sports_details?.route_map ||
                                                ev.routeMap,
                                              prizeDetails:
                                                ev.sports_details
                                                  ?.prize_details ||
                                                ev.dynamic_config
                                                  ?.sports_details
                                                  ?.prize_details ||
                                                ev.prizeDetails,
                                              teamsCount:
                                                ev.sports_details
                                                  ?.teams_count ||
                                                ev.dynamic_config
                                                  ?.sports_details
                                                  ?.teams_count ||
                                                ev.teamsCount,
                                              matchSchedule:
                                                ev.sports_details
                                                  ?.match_schedule ||
                                                ev.dynamic_config
                                                  ?.sports_details
                                                  ?.match_schedule ||
                                                ev.matchSchedule,
                                              tournamentType:
                                                ev.sports_details
                                                  ?.tournament_type ||
                                                ev.dynamic_config
                                                  ?.sports_details
                                                  ?.tournament_type ||
                                                ev.tournamentType,
                                              tournamentFormat:
                                                ev.sports_details
                                                  ?.tournament_format ||
                                                ev.dynamic_config
                                                  ?.sports_details
                                                  ?.tournament_format ||
                                                ev.tournamentFormat,
                                              registrationFee:
                                                ev.sports_details
                                                  ?.registration_fee ||
                                                ev.dynamic_config
                                                  ?.sports_details
                                                  ?.registration_fee ||
                                                ev.registration_fee ||
                                                ev.registrationFee,
                                              minTeamSize:
                                                ev.sports_details
                                                  ?.min_team_size ||
                                                ev.dynamic_config
                                                  ?.sports_details
                                                  ?.min_team_size ||
                                                ev.min_team_size ||
                                                ev.minTeamSize,
                                              maxTeamSize:
                                                ev.sports_details
                                                  ?.max_team_size ||
                                                ev.dynamic_config
                                                  ?.sports_details
                                                  ?.max_team_size ||
                                                ev.max_team_size ||
                                                ev.maxTeamSize,
                                              sportName:
                                                ev.sports_details?.sport_name ||
                                                ev.dynamic_config
                                                  ?.sports_details
                                                  ?.sport_name ||
                                                ev.sports_details?.sport_type ||
                                                ev.dynamic_config
                                                  ?.sports_details
                                                  ?.sport_type ||
                                                ev.sportName,
                                              audienceAccess:
                                                ev.sports_details
                                                  ?.audience_access ||
                                                ev.dynamic_config
                                                  ?.sports_details
                                                  ?.audience_access ||
                                                (ev.sports_details
                                                  ?.audience_free_access ===
                                                  false ||
                                                ev.dynamic_config
                                                  ?.sports_details
                                                  ?.audience_free_access ===
                                                  false
                                                  ? "Paid"
                                                  : "Free"),
                                              rulesRegulations:
                                                ev.sports_details
                                                  ?.rules_regulations ||
                                                ev.dynamic_config
                                                  ?.sports_details
                                                  ?.rules_regulations ||
                                                ev.rulesRegulations,
                                              termsConditions:
                                                ev.sports_details
                                                  ?.terms_conditions ||
                                                ev.dynamic_config
                                                  ?.sports_details
                                                  ?.terms_conditions ||
                                                ev.termsConditions,
                                              prizePool:
                                                ev.sports_details?.prize_pool ||
                                                ev.dynamic_config
                                                  ?.sports_details
                                                  ?.prize_pool ||
                                                ev.prizePool,
                                              contactEmail:
                                                ev.sports_details
                                                  ?.contact_email ||
                                                ev.dynamic_config
                                                  ?.sports_details
                                                  ?.contact_email ||
                                                ev.contactEmail,
                                              contactPhone:
                                                ev.sports_details
                                                  ?.contact_phone ||
                                                ev.dynamic_config
                                                  ?.sports_details
                                                  ?.contact_phone ||
                                                ev.contactPhone,
                                              trainerDetails:
                                                ev.sports_details
                                                  ?.trainer_details ||
                                                ev.dynamic_config
                                                  ?.sports_details
                                                  ?.trainer_details ||
                                                ev.trainerDetails,
                                              sessionSlots:
                                                ev.sports_details
                                                  ?.session_slots ||
                                                ev.dynamic_config
                                                  ?.sports_details
                                                  ?.session_slots ||
                                                ev.sessionSlots,
                                              isFeature:
                                                ev.featured === true ||
                                                ev.isFeature === "Yes"
                                                  ? "Yes"
                                                  : "No",
                                              isExclusive:
                                                ev.exclusive === true ||
                                                ev.isExclusive === "Yes"
                                                  ? "Yes"
                                                  : "No",
                                              eventStatus:
                                                ev.status || "published",
                                              dateType:
                                                ev.date_slots || ev.dateSlots
                                                  ? "multiple"
                                                  : "single",
                                              startDate:
                                                ev.date || ev.startDate,
                                              startTime:
                                                ev.time || ev.startTime,
                                              endDate:
                                                ev.end_date || ev.endDate,
                                              endTime:
                                                ev.end_time || ev.endTime,
                                              expiryDate:
                                                ev.expiry_date || ev.expiryDate,
                                              bannerPreview:
                                                ev.banner_preview ||
                                                ev.bannerPreview ||
                                                ev.img,
                                              image_url:
                                                ev.banner_preview ||
                                                ev.bannerPreview ||
                                                ev.img, // Used by Sports/Universal forms
                                              organiser_name:
                                                ev.dynamic_config?.organiser_name ||
                                                ev.organiser_name || "",
                                            });
                                            if (ev.type === "Marathon") {
                                              setEditingMarathonId(ev.id);
                                              setEditingEvent(ev);
                                              setActiveTab("marathon_publish");
                                            } else {
                                              setAddEventStep("form");
                                              setActiveTab("post_event");
                                            }
                                          }}
                                          style={{
                                            border: `1px solid ${t.border}`,
                                            background: t.cardBg,
                                            color: "#3b82f6",
                                            padding: "8px",
                                            borderRadius: "8px",
                                            cursor: "pointer",
                                          }}
                                        >
                                          <Settings size={16} />
                                        </button>
                                        {ev.seating_enabled !== false &&
                                          ev.seatingEnabled !== false && (
                                            <button
                                              onClick={() => {
                                                setSelectedEventForSeatMap(ev);
                                                setActiveTab("seat_map");
                                              }}
                                              style={{
                                                border: "none",
                                                background: "#6366f120",
                                                color: "#6366f1",
                                                padding: "8px 14px",
                                                borderRadius: "8px",
                                                fontSize: "12px",
                                                fontWeight: 700,
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "6px",
                                              }}
                                            >
                                              <Grid size={14} /> Map
                                            </button>
                                          )}
                                        {ev.uiStatus !== 'expired' && ev.uiStatus !== 'archived' && (
                                          <button
                                            title="Promote Event"
                                            onClick={() =>
                                              setPromoteEventModal(ev)
                                            }
                                            style={{
                                              border: `1px solid ${t.border}`,
                                              background: t.cardBg,
                                              color: "#10b981",
                                              padding: "8px",
                                              borderRadius: "8px",
                                              cursor: "pointer",
                                            }}
                                          >
                                            <Share size={16} />
                                          </button>
                                        )}
                                        <button
                                          onClick={() => handleDeleteEvent(ev)}
                                          style={{
                                            border: `1px solid ${t.border}`,
                                            background: t.cardBg,
                                            color: "#ef4444",
                                            padding: "8px",
                                            borderRadius: "8px",
                                            cursor: "pointer",
                                          }}
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ); 
                  })()}
                  </div>
              </div>
            </div>
          );
        }
        case "meetings": {
          return (
            <MeetingsTab
              t={t}
              effectiveEmail={effectiveEmail}
              router={router}
            />
          );
        }
        case "post_event":
          // Step 1: Choose Category (Physical, Virtual, Sports)
          if (addEventStep === "select_type") {
            return (
              <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-12 space-y-4">
                  <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-pink-50/50 border border-pink-100 text-[10px] font-black uppercase tracking-[0.2em] text-pink-600 mb-2">
                    <Sparkles size={14} />{" "}
                    {editingEvent
                      ? "Calibration Matrix"
                      : "Intelligence Matrix"}
                  </div>
                  <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                    {editingEvent ? "Update Event" : "Initialize Creation"}
                  </h2>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                    {editingEvent
                      ? "Modify the core architecture of your existing experience"
                      : "Select the architectural framework for your experience"}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
                  <button
                    onClick={() => {
                      setPostEvent((pe) => ({ ...pe, type: "Physical Event" }));
                      setAddEventStep("form");
                    }}
                    className="group relative bg-white border border-slate-100 rounded-[3rem] p-12 flex flex-col items-center gap-8 cursor-pointer overflow-hidden transition-all duration-500 hover:shadow-[0_40px_80px_-20px_rgba(236,72,153,0.15)] hover:border-pink-200 hover:-translate-y-2"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-orange-400 to-rose-600 flex items-center justify-center shadow-2xl shadow-rose-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                      <MapPin
                        size={48}
                        className="text-white"
                        strokeWidth={1.5}
                      />
                    </div>
                    <div className="text-center space-y-3 z-10">
                      <span className="block text-2xl font-black text-slate-900 tracking-tighter uppercase italic group-hover:text-pink-600 transition-colors">
                        Physical Event
                      </span>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                        Venue-based offline events & gatherings
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setPostEvent((pe) => ({ ...pe, type: "Virtual Event" }));
                      setAddEventStep("form");
                    }}
                    className="group relative bg-white border border-slate-100 rounded-[3rem] p-12 flex flex-col items-center gap-8 cursor-pointer overflow-hidden transition-all duration-500 hover:shadow-[0_40px_80px_-20px_rgba(59,130,246,0.15)] hover:border-blue-200 hover:-translate-y-2"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/30 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500">
                      <CloudUpload
                        size={48}
                        className="text-white"
                        strokeWidth={1.5}
                      />
                    </div>
                    <div className="text-center space-y-3 z-10">
                      <span className="block text-2xl font-black text-slate-900 tracking-tighter uppercase italic group-hover:text-blue-600 transition-colors">
                        Virtual Event
                      </span>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                        Online webinar, streaming & workshops
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setPostEvent((pe) => ({
                        ...pe,
                        type: "Sports Event",
                        category: "Sports",
                        seatingEnabled: false,
                      }));
                      setAddEventStep("sports_type");
                    }}
                    className="group relative bg-white border border-slate-100 rounded-[3rem] p-12 flex flex-col items-center gap-8 cursor-pointer overflow-hidden transition-all duration-500 hover:shadow-[0_40px_80px_-20px_rgba(139,92,246,0.15)] hover:border-purple-200 hover:-translate-y-2"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-purple-500 to-indigo-700 flex items-center justify-center shadow-2xl shadow-purple-500/30 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                      <Trophy
                        size={48}
                        className="text-white"
                        strokeWidth={1.5}
                      />
                    </div>
                    <div className="text-center space-y-3 z-10">
                      <span className="block text-2xl font-black text-slate-900 tracking-tighter uppercase italic group-hover:text-purple-600 transition-colors">
                        Sports Event
                      </span>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                        Marathon, Cricket, Football & Turf
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            );
          }
          if (addEventStep === "sports_type") {
            const sportsTypes = [
              {
                id: "Marathon",
                label: "Marathon",
                sub: "Running & Athletics",
                icon: Activity,
                color: "from-blue-500 to-indigo-600",
              },
              {
                id: "Tournament",
                label: "Tournament",
                sub: "Competitions & Leagues",
                icon: Trophy,
                color: "from-orange-500 to-red-600",
              },
              {
                id: "Coaching",
                label: "Coaching Session",
                sub: "Training & Sessions",
                icon: Target,
                color: "from-purple-500 to-pink-600",
              },
              {
                id: "Competition",
                label: "Competition",
                sub: "Swimming, Athletics & Races",
                icon: Goal,
                color: "from-teal-500 to-emerald-600",
              },
            ];

            return (
              <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-16 space-y-4">
                  <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-blue-50/50 border border-blue-100 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-2">
                    <Trophy size={14} /> Athletics Module
                  </div>
                  <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                    Sports Category
                  </h2>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                    Define the discipline for your sporting event
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-7xl">
                  {sportsTypes.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => {
                        if (st.id === "Marathon") {
                          setPostEvent((pe) => ({
                            ...pe,
                            type: "Marathon",
                            sportType: "Marathon",
                          }));
                          setAddEventStep("form");
                        } else if (st.id === "Tournament") {
                          setPostEvent((pe) => ({
                            ...pe,
                            type: "Tournament",
                            sportType: "Tournament",
                          }));
                          setAddEventStep("form");
                        } else if (st.id === "Competition") {
                          setPostEvent((pe) => ({
                            ...pe,
                            type: "Competition",
                            sportType: "Competition",
                          }));
                          setAddEventStep("form");
                        } else {
                          setPostEvent((pe) => ({ ...pe, sportType: st.id }));
                          setAddEventStep("form");
                        }
                      }}
                      className="group relative bg-white border border-slate-100 rounded-[2.5rem] p-10 flex flex-col items-center gap-6 cursor-pointer overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2"
                    >
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${st.color} opacity-0 group-hover:opacity-5 transition-opacity`}
                      />
                      <div
                        className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${st.color} flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}
                      >
                        <st.icon
                          size={36}
                          className="text-white"
                          strokeWidth={1.5}
                        />
                      </div>
                      <div className="text-center space-y-2 z-10">
                        <span className="block text-xl font-black text-slate-900 tracking-tighter uppercase italic group-hover:text-blue-600 transition-colors">
                          {st.label}
                        </span>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                          {st.sub}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setAddEventStep("select_type")}
                  className="mt-16 flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black uppercase tracking-widest text-[10px] transition-colors"
                >
                  <ArrowLeft size={14} /> Back to Frameworks
                </button>
              </div>
            );
          }
          // Step 2: Form Dispatcher
          if (addEventStep === "form") {
            if (postEvent.type === "Physical Event") {
              return (
                <UnifiedEventForm
                  postEvent={postEvent}
                  setPostEvent={setPostEvent}
                  onCancel={() => {
                    setPostEvent(getInitialPostEvent());
                    setAddEventStep("select_type");
                  }}
                  onPublish={publishSeatEvent}
                  isEditing={!!editingEvent}
                />
              );
            }
            if (postEvent.type === "Virtual Event") {
              return (
                <VirtualEventForm
                  postEvent={postEvent}
                  setPostEvent={setPostEvent}
                  onCancel={() => {
                    setPostEvent(getInitialPostEvent());
                    setAddEventStep("select_type");
                  }}
                  onPublish={publishSeatEvent}
                  isEditing={!!editingEvent}
                />
              );
            }
            if (
              postEvent.type === "Sports Event" ||
              postEvent.type === "Sports"
            ) {
              return (
                <SportsEventForm
                  postEvent={postEvent}
                  setPostEvent={setPostEvent}
                  onCancel={() => {
                    setPostEvent(getInitialPostEvent());
                    setAddEventStep("select_type");
                  }}
                  onPublish={publishSeatEvent}
                  isEditing={!!editingEvent}
                />
              );
            }
            if (
              postEvent.type === "Tournament" ||
              postEvent.type === "Tournament Event"
            ) {
              return (
                <TournamentEventForm
                  postEvent={postEvent}
                  setPostEvent={setPostEvent}
                  onCancel={() => {
                    setPostEvent(getInitialPostEvent());
                    setAddEventStep("select_type");
                  }}
                  onPublish={publishSeatEvent}
                  isEditing={!!editingEvent}
                />
              );
            }
            if (
              postEvent.type === "Competition" ||
              postEvent.type === "Competition Event" ||
              postEvent.type === "E-Sports"
            ) {
              return (
                <CompetitionEventForm
                  postEvent={postEvent}
                  setPostEvent={setPostEvent}
                  onCancel={() => {
                    setPostEvent(getInitialPostEvent());
                    setAddEventStep("select_type");
                  }}
                  onPublish={publishSeatEvent}
                  isEditing={!!editingEvent}
                />
              );
            }
            if (
              postEvent.type === "Marathon"
            ) {
              return (
                <MarathonEventForm
                  marathonId={editingEvent?.id}
                  onCancel={() => {
                    setPostEvent(getInitialPostEvent());
                    setAddEventStep("select_type");
                  }}
                  onPublish={() => {
                    setAddEventStep("success");
                  }}
                />
              );
            }
            // Fallback to Universal for Dynamic/Other
            return (
              <UniversalEventForm
                postEvent={postEvent}
                setPostEvent={setPostEvent}
                onCancel={() => {
                  setPostEvent(getInitialPostEvent());
                  setAddEventStep("select_type");
                }}
                onPublish={publishSeatEvent}
                isEditing={!!editingEvent}
              />
            );
          }
          return null;
          return null;
        case "seat_map":
          return (
            <div
              style={{
                backgroundColor: t.cardBg,
                padding: "32px",
                borderRadius: "20px",
                border: `1px solid ${t.border}`,
              }}
            >
              {!selectedEventForSeatMap ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <p style={{ color: t.textSub }}>
                    Please select an event from 'Manage Events' to view its seat
                    map.
                  </p>
                  <button
                    onClick={() => setActiveTab("manage_events")}
                    style={{
                      color: "#3b82f6",
                      background: "none",
                      border: "none",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Go to Manage Events
                  </button>
                </div>
              ) : selectedEventForSeatMap.seatingEnabled === false ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <p style={{ color: t.textSub }}>
                    This event uses Normal Ticketing (no seat selection). Seat
                    map is not available.
                  </p>
                  <button
                    onClick={() => setActiveTab("manage_events")}
                    style={{
                      color: "#3b82f6",
                      background: "none",
                      border: "none",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Back to Manage Events
                  </button>
                </div>
              ) : (
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "32px",
                    }}
                  >
                    <div>
                      <h3
                        style={{ fontSize: "20px", fontWeight: 800, margin: 0 }}
                      >
                        {selectedEventForSeatMap.title} — Real-time Seat Map
                      </h3>
                      <p
                        style={{
                          fontSize: "14px",
                          color: t.textSub,
                          margin: "4px 0 0",
                        }}
                      >
                        {selectedEventForSeatMap.venue} |{" "}
                        {selectedEventForSeatMap.date}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "16px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <div
                          style={{
                            width: "12px",
                            height: "12px",
                            borderRadius: "3px",
                            backgroundColor: "#3b82f6",
                          }}
                        ></div>
                        <span style={{ fontSize: "12px" }}>Available</span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <div
                          style={{
                            width: "12px",
                            height: "12px",
                            borderRadius: "3px",
                            backgroundColor: "#f84464",
                          }}
                        ></div>
                        <span style={{ fontSize: "12px" }}>Booked</span>
                      </div>
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
            <div className="detail-grid">
              <div
                style={{
                  backgroundColor: t.cardBg,
                  padding: "32px",
                  borderRadius: "20px",
                  border: `1px solid ${t.border}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "32px",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: "14px",
                        color: t.textSub,
                        marginBottom: "4px",
                      }}
                    >
                      Available Balance
                    </p>
                    <h1 style={{ fontSize: "42px", fontWeight: 900 }}>
                      {wallet.currency}
                      {wallet.balance.toLocaleString()}
                    </h1>
                  </div>
                  <button
                    onClick={() => setShowPayoutModal(true)}
                    style={{
                      backgroundColor: "#3b82f6",
                      color: "#fff",
                      border: "none",
                      padding: "14px 28px",
                      borderRadius: "12px",
                      fontSize: "15px",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "0.2s",
                    }}
                  >
                    Request Amount
                  </button>
                </div>

                <h4
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    marginBottom: "20px",
                  }}
                >
                  Transaction History
                </h4>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {wallet.transactions.map((tx) => (
                    <div
                      key={tx.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "16px",
                        borderRadius: "12px",
                        backgroundColor:
                          theme === "light" ? "#f8fafc" : "#0f172a",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                        }}
                      >
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "10px",
                            backgroundColor:
                              tx.amount > 0 ? "#22c55e15" : "#3b82f615",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {tx.amount > 0 ? (
                            <Plus size={18} color="#22c55e" />
                          ) : (
                            <Wallet size={18} color="#3b82f6" />
                          )}
                        </div>
                        <div>
                          <p
                            style={{
                              margin: 0,
                              fontWeight: 700,
                              fontSize: "14px",
                            }}
                          >
                            {tx.type}
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "12px",
                              color: t.textSub,
                            }}
                          >
                            {tx.date}
                          </p>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p
                          style={{
                            margin: 0,
                            fontWeight: 800,
                            color: tx.amount > 0 ? "#22c55e" : t.textMain,
                          }}
                        >
                          {tx.amount > 0 ? "+" : ""}
                          {wallet.currency}
                          {Math.abs(tx.amount).toLocaleString()}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "10px",
                            fontWeight: 700,
                            color:
                              tx.status === "Completed" ? "#22c55e" : "#f97316",
                          }}
                        >
                          {tx.status.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#3b82f610",
                    padding: "24px",
                    borderRadius: "20px",
                    border: "1px dashed #3b82f6",
                    position: "relative",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "#3b82f6",
                      marginBottom: "12px",
                    }}
                  >
                    Settlement Info
                  </h4>
                  <p
                    style={{
                      fontSize: "12px",
                      color: t.textSub,
                      lineHeight: "1.5",
                    }}
                  >
                    Settlements are processed every Monday. Minimum withdrawal
                    amount is ₹1,000.
                  </p>
                </div>
                <div
                  style={{
                    backgroundColor: t.cardBg,
                    padding: "24px",
                    borderRadius: "20px",
                    border: `1px solid ${t.border}`,
                  }}
                >
                  <h4
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      marginBottom: "16px",
                    }}
                  >
                    Linked Bank Account
                  </h4>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        padding: "10px",
                        backgroundColor: t.bg,
                        borderRadius: "8px",
                      }}
                    >
                      <Building size={20} />
                    </div>
                    <div>
                      <p
                        style={{ margin: 0, fontSize: "13px", fontWeight: 700 }}
                      >
                        {organiserData?.kycDetails?.bankName ||
                          "No Bank Linked"}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "11px",
                          color: t.textSub,
                        }}
                      >
                        {organiserData?.kycDetails?.accountNumber
                          ? `**** ${organiserData.kycDetails.accountNumber.slice(-4)}`
                          : "Verify KYC to link"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        case "venue_events": {
          const venueEvents = events.filter(
            (ev) => (ev.type || "Venue") === "Venue",
          );
          const Breadcrumb = ({ title }) => (
            <div
              className="breadcrumb"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "24px",
                fontSize: "14px",
                color: t.textSub,
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
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
              <div
                style={{
                  backgroundColor: t.cardBg,
                  padding: "32px",
                  borderRadius: "16px",
                  border: `1px solid ${t.border}`,
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "32px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "24px",
                      fontWeight: 800,
                      color: t.textMain,
                      margin: 0,
                    }}
                  >
                    Venue Base Events
                  </h3>
                  <div
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      backgroundColor: "#f9731615",
                      border: "1px solid #f9731630",
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#f97316",
                    }}
                  >
                    Total: {venueEvents.length}
                  </div>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "separate",
                      borderSpacing: "0 8px",
                    }}
                  >
                    <thead>
                      <tr style={{ textAlign: "left" }}>
                        <th
                          style={{
                            padding: "12px 16px",
                            color: t.textSub,
                            fontSize: "13px",
                            fontWeight: 700,
                          }}
                        >
                          Venue Details
                        </th>
                        <th
                          style={{
                            padding: "12px 16px",
                            color: t.textSub,
                            fontSize: "13px",
                            fontWeight: 700,
                          }}
                        >
                          Schedule
                        </th>
                        <th
                          style={{
                            padding: "12px 16px",
                            color: t.textSub,
                            fontSize: "13px",
                            fontWeight: 700,
                          }}
                        >
                          Capacity
                        </th>
                        <th
                          style={{
                            padding: "12px 16px",
                            color: t.textSub,
                            fontSize: "13px",
                            fontWeight: 700,
                          }}
                        >
                          Status
                        </th>
                        <th
                          style={{
                            padding: "12px 16px",
                            color: t.textSub,
                            fontSize: "13px",
                            fontWeight: 700,
                          }}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {venueEvents.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            style={{
                              textAlign: "center",
                              padding: "64px",
                              color: t.textSub,
                            }}
                          >
                            No venue events found. Choose &quot;Venue
                            Event&quot; when posting.
                          </td>
                        </tr>
                      ) : (
                        venueEvents.map((ev) => (
                          <tr
                            key={ev.id}
                            style={{
                              backgroundColor: t.bg,
                              borderRadius: "12px",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                            }}
                          >
                            <td
                              style={{
                                padding: "16px",
                                borderRadius: "12px 0 0 12px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "12px",
                                }}
                              >
                                <div
                                  style={{
                                    width: "48px",
                                    height: "48px",
                                    borderRadius: "10px",
                                    backgroundColor: "#f9731620",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <MapPin size={24} color="#f97316" />
                                </div>
                                <div>
                                  <p
                                    style={{
                                      fontWeight: 800,
                                      margin: 0,
                                      fontSize: "15px",
                                      color: t.textMain,
                                    }}
                                  >
                                    {ev.title}
                                  </p>
                                  <p
                                    style={{
                                      fontSize: "12px",
                                      color: t.textSub,
                                      margin: "2px 0 0",
                                    }}
                                  >
                                    {ev.venue || "—"}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "16px" }}>
                              <div
                                style={{
                                  fontSize: "14px",
                                  fontWeight: 700,
                                  color: t.textMain,
                                }}
                              >
                                {ev.dateSlots?.length > 1
                                  ? `${ev.dateSlots.length} Dates`
                                  : ev.date || "—"}
                              </div>
                              <div
                                style={{ fontSize: "12px", color: t.textSub }}
                              >
                                {ev.dateSlots?.length > 1
                                  ? "Multiple Slots"
                                  : ev.time || "—"}
                              </div>
                            </td>
                            <td style={{ padding: "16px" }}>
                              <div
                                style={{
                                  fontSize: "14px",
                                  fontWeight: 700,
                                  color: t.textMain,
                                }}
                              >
                                {ev.totalSeats || "N/A"}
                              </div>
                              <div
                                style={{ fontSize: "11px", color: t.textSub }}
                              >
                                Total Capacity
                              </div>
                            </td>
                            <td style={{ padding: "16px" }}>
                              <span
                                style={{
                                  padding: "6px 14px",
                                  borderRadius: "100px",
                                  fontSize: "11px",
                                  fontWeight: 800,
                                  backgroundColor:
                                    ev.status === "published"
                                      ? "#22c55e20"
                                      : ev.status === "expired"
                                        ? "#ef444420"
                                        : "#f9731620",
                                  color:
                                    ev.status === "published"
                                      ? "#22c55e"
                                      : ev.status === "expired"
                                        ? "#ef4444"
                                        : "#f97316",
                                  textTransform: "uppercase",
                                }}
                              >
                                {ev.status || "draft"}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: "16px",
                                borderRadius: "0 12px 12px 0",
                              }}
                            >
                              <div style={{ display: "flex", gap: "8px" }}>
                                {ev.seating_enabled !== false && (
                                  <button
                                    onClick={() => {
                                      setSelectedEventForSeatMap(ev);
                                      setActiveTab("seat_map");
                                    }}
                                    style={{
                                      border: "none",
                                      background: "#6366f120",
                                      color: "#6366f1",
                                      padding: "8px 14px",
                                      borderRadius: "8px",
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      cursor: "pointer",
                                    }}
                                  >
                                    Seat Map
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteEvent(ev)}
                                  style={{
                                    border: `1px solid ${t.border}`,
                                    background: t.cardBg,
                                    color: "#ef4444",
                                    padding: "8px",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                  }}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        }
        case "online_events": {
          const onlineEvents = events.filter((ev) => ev.type === "Online");
          const Breadcrumb = ({ title }) => (
            <div
              className="breadcrumb"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "24px",
                fontSize: "14px",
                color: t.textSub,
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
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
              <div
                style={{
                  backgroundColor: t.cardBg,
                  padding: "32px",
                  borderRadius: "16px",
                  border: `1px solid ${t.border}`,
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "32px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "24px",
                      fontWeight: 800,
                      color: t.textMain,
                      margin: 0,
                    }}
                  >
                    Online & Virtual Events
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                    }}
                  >
                    <button
                      onClick={() => {
                        setEditingEvent(null);
                        setPostEvent(getInitialPostEvent());
                        setAddEventStep("select_type");
                        setActiveTab("post_event");
                      }}
                      style={{
                        padding: "10px 24px",
                        borderRadius: "12px",
                        backgroundColor: ACCENT_PINK,
                        color: "white",
                        fontSize: "13px",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        boxShadow: `0 10px 20px -5px ${ACCENT_PINK}40`,
                      }}
                    >
                      <Plus size={16} strokeWidth={3} /> Create Online Event
                    </button>
                    <div
                      style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        backgroundColor: "#22c55e15",
                        border: "1px solid #22c55e30",
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#22c55e",
                      }}
                    >
                      Total: {onlineEvents.length}
                    </div>
                  </div>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "separate",
                      borderSpacing: "0 8px",
                    }}
                  >
                    <thead>
                      <tr style={{ textAlign: "left" }}>
                        <th
                          style={{
                            padding: "12px 16px",
                            color: t.textSub,
                            fontSize: "13px",
                            fontWeight: 700,
                          }}
                        >
                          Stream Details
                        </th>
                        <th
                          style={{
                            padding: "12px 16px",
                            color: t.textSub,
                            fontSize: "13px",
                            fontWeight: 700,
                          }}
                        >
                          Broadcasting
                        </th>
                        <th
                          style={{
                            padding: "12px 16px",
                            color: t.textSub,
                            fontSize: "13px",
                            fontWeight: 700,
                          }}
                        >
                          Attendees
                        </th>
                        <th
                          style={{
                            padding: "12px 16px",
                            color: t.textSub,
                            fontSize: "13px",
                            fontWeight: 700,
                          }}
                        >
                          Status
                        </th>
                        <th
                          style={{
                            padding: "12px 16px",
                            color: t.textSub,
                            fontSize: "13px",
                            fontWeight: 700,
                          }}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {onlineEvents.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            style={{
                              textAlign: "center",
                              padding: "64px",
                              color: t.textSub,
                            }}
                          >
                            No online events found. Select &quot;Online
                            Event&quot; when posting.
                          </td>
                        </tr>
                      ) : (
                        onlineEvents.map((ev) => (
                          <tr
                            key={ev.id}
                            style={{
                              backgroundColor: t.bg,
                              borderRadius: "12px",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                            }}
                          >
                            <td
                              style={{
                                padding: "16px",
                                borderRadius: "12px 0 0 12px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "12px",
                                }}
                              >
                                <div
                                  style={{
                                    width: "48px",
                                    height: "48px",
                                    borderRadius: "10px",
                                    backgroundColor: "#22c55e20",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <CloudUpload size={24} color="#22c55e" />
                                </div>
                                <div>
                                  <p
                                    style={{
                                      fontWeight: 800,
                                      margin: 0,
                                      fontSize: "15px",
                                      color: t.textMain,
                                    }}
                                  >
                                    {ev.title}
                                  </p>
                                  <p
                                    style={{
                                      fontSize: "12px",
                                      color: t.textSub,
                                      margin: "2px 0 0",
                                    }}
                                  >
                                    Virtual Platform
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "16px" }}>
                              <div
                                style={{
                                  fontSize: "14px",
                                  fontWeight: 700,
                                  color: t.textMain,
                                }}
                              >
                                {ev.dateSlots?.length > 1
                                  ? `${ev.dateSlots.length} Dates`
                                  : ev.date || "—"}
                              </div>
                              <div
                                style={{ fontSize: "12px", color: t.textSub }}
                              >
                                {ev.dateSlots?.length > 1
                                  ? "Multiple Slots"
                                  : ev.time || "—"}
                              </div>
                            </td>
                            <td style={{ padding: "16px" }}>
                              <div
                                style={{
                                  fontSize: "14px",
                                  fontWeight: 700,
                                  color: t.textMain,
                                }}
                              >
                                {ev.bookedSeats || 0}
                              </div>
                              <div
                                style={{ fontSize: "11px", color: t.textSub }}
                              >
                                Registered Users
                              </div>
                            </td>
                            <td style={{ padding: "16px" }}>
                              <span
                                style={{
                                  padding: "6px 14px",
                                  borderRadius: "100px",
                                  fontSize: "11px",
                                  fontWeight: 800,
                                  backgroundColor:
                                    ev.status === "published"
                                      ? "#22c55e20"
                                      : ev.status === "expired"
                                        ? "#ef444420"
                                        : "#f9731620",
                                  color:
                                    ev.status === "published"
                                      ? "#22c55e"
                                      : ev.status === "expired"
                                        ? "#ef4444"
                                        : "#f97316",
                                  textTransform: "uppercase",
                                }}
                              >
                                {ev.status || "draft"}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: "16px",
                                borderRadius: "0 12px 12px 0",
                              }}
                            >
                              <div style={{ display: "flex", gap: "8px" }}>
                                <button
                                  style={{
                                    border: "none",
                                    background: "#3b82f620",
                                    color: "#3b82f6",
                                    padding: "8px 14px",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                  }}
                                >
                                  Manage Link
                                </button>
                                <button
                                  onClick={() => handleDeleteEvent(ev)}
                                  style={{
                                    border: `1px solid ${t.border}`,
                                    background: t.cardBg,
                                    color: "#ef4444",
                                    padding: "8px",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                  }}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
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
            activeTab === "completed_bookings"
              ? "Confirmed"
              : activeTab === "pending_bookings"
                ? "Pending"
                : activeTab === "rejected_bookings"
                  ? "Cancelled"
                  : "all";

          const myEventIds = new Set(events.map((e) => String(e.id)));
          const myBookings = convexBookings.filter((b) =>
            myEventIds.has(String(b.event_id)) && b.status !== "Pending"
          );
          const filtered =
            statusFilter === "all" ||
            activeTab === "all_bookings" ||
            activeTab === "event_bookings"
              ? myBookings
              : myBookings.filter((b) => b.status === statusFilter);

          const viewTitle =
            activeTab === "completed_bookings"
              ? "Completed Bookings"
              : activeTab === "pending_bookings"
                ? "Pending Bookings"
                : activeTab === "rejected_bookings"
                  ? "Rejected Bookings"
                  : activeTab === "booking_report"
                    ? "Booking Report"
                    : "All Bookings";

          const Breadcrumb = ({ title }) => (
            <div
              className="breadcrumb"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "24px",
                fontSize: "14px",
                color: t.textSub,
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <Home size={14} />
                <span>Bookings</span>
              </div>
              <ChevronDown size={14} style={{ transform: "rotate(-90deg)" }} />
              <div style={{ color: "#3b82f6", fontWeight: 700 }}>{title}</div>
            </div>
          );

          return (
            <div>
              {/* Production Diagnostic: Show warning if Supabase is disconnected */}
              {!supabase && (
                <div
                  style={{
                    margin: "20px auto",
                    padding: "16px",
                    background: "#fef2f2",
                    border: "1px solid #fee2e2",
                    borderRadius: "12px",
                    color: "#b91c1c",
                    fontSize: "14px",
                    fontWeight: 700,
                    textAlign: "center",
                    maxWidth: "600px",
                  }}
                >
                  ⚠️ Warning: Authentication & Database System Disconnected.{" "}
                  <br />
                  <span style={{ fontWeight: 400, fontSize: "12px" }}>
                    Please ensure NEXT_PUBLIC_SUPABASE_URL and NON_ANON_KEY are
                    set in Vercel.
                  </span>
                </div>
              )}

              <Breadcrumb title={viewTitle} />
              <div
                style={{
                  backgroundColor: t.cardBg,
                  padding: "32px",
                  borderRadius: "16px",
                  border: `1px solid ${t.border}`,
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "32px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "24px",
                      fontWeight: 800,
                      color: t.textMain,
                      margin: 0,
                    }}
                  >
                    {viewTitle}
                  </h3>
                  {activeTab !== "booking_report" && (
                    <div style={{ display: "flex", gap: "12px" }}>
                      <div
                        style={{
                          padding: "8px 16px",
                          borderRadius: "8px",
                          backgroundColor: t.bg,
                          border: `1px solid ${t.border}`,
                          fontSize: "14px",
                          color: t.textSub,
                        }}
                      >
                        Total Bookings:{" "}
                        <span style={{ fontWeight: 800, color: t.textMain }}>
                          {filtered.length}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {activeTab === "booking_report" ? (
                  <BookingAnalytics
                    events={eventsData}
                    bookings={bookingsData}
                    theme={theme}
                  />
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "separate",
                        borderSpacing: "0 8px",
                      }}
                    >
                      <thead>
                        <tr style={{ textAlign: "left" }}>
                          <th
                            style={{
                              padding: "12px 16px",
                              color: t.textSub,
                              fontSize: "13px",
                              fontWeight: 700,
                            }}
                          >
                            Order ID
                          </th>
                          <th
                            style={{
                              padding: "12px 16px",
                              color: t.textSub,
                              fontSize: "13px",
                              fontWeight: 700,
                            }}
                          >
                            Event Name
                          </th>
                          <th
                            style={{
                              padding: "12px 16px",
                              color: t.textSub,
                              fontSize: "13px",
                              fontWeight: 700,
                            }}
                          >
                            Customer Details
                          </th>
                          <th
                            style={{
                              padding: "12px 16px",
                              color: t.textSub,
                              fontSize: "13px",
                              fontWeight: 700,
                            }}
                          >
                            Tickets
                          </th>
                          <th
                            style={{
                              padding: "12px 16px",
                              color: t.textSub,
                              fontSize: "13px",
                              fontWeight: 700,
                            }}
                          >
                            Amount
                          </th>
                          <th
                            style={{
                              padding: "12px 16px",
                              color: t.textSub,
                              fontSize: "13px",
                              fontWeight: 700,
                            }}
                          >
                            Status
                          </th>
                          <th
                            style={{
                              padding: "12px 16px",
                              color: t.textSub,
                              fontSize: "13px",
                              fontWeight: 700,
                            }}
                          >
                            Details
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              style={{
                                textAlign: "center",
                                padding: "64px",
                                color: t.textSub,
                              }}
                            >
                              No {statusFilter.toLowerCase()} bookings found.
                            </td>
                          </tr>
                        ) : (
                          filtered.map((b) => (
                            <tr
                              key={b.id}
                              style={{
                                backgroundColor: t.bg,
                                borderRadius: "12px",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                              }}
                            >
                              <td
                                style={{
                                  padding: "20px 16px",
                                  borderRadius: "12px 0 0 12px",
                                  fontSize: "13px",
                                  fontWeight: 800,
                                  color: t.textMain,
                                }}
                              >
                                #{b.id.slice(-8).toUpperCase()}
                              </td>
                              <td
                                style={{
                                  padding: "20px 16px",
                                  fontSize: "14px",
                                  fontWeight: 600,
                                  color: t.textMain,
                                }}
                              >
                                {b.event_name || b.eventName || "—"}
                              </td>
                              <td style={{ padding: "20px 16px" }}>
                                <div
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    color: t.textMain,
                                  }}
                                >
                                  {b.user_name ||
                                    b.userName ||
                                    b.customer_details?.name ||
                                    "Guest User"}
                                </div>
                                <div
                                  style={{ fontSize: "12px", color: t.textSub }}
                                >
                                  {b.customer_details?.email ||
                                    b.user_id ||
                                    b.userId}
                                </div>
                              </td>
                              <td
                                style={{
                                  padding: "20px 16px",
                                  fontSize: "14px",
                                  fontWeight: 700,
                                }}
                              >
                                {b.ticket_count || b.ticketCount}
                              </td>
                              <td
                                style={{
                                  padding: "20px 16px",
                                  fontSize: "15px",
                                  fontWeight: 800,
                                  color: "#22c55e",
                                }}
                              >
                                ₹
                                {(
                                  b.total_price ||
                                  b.totalPrice ||
                                  0
                                ).toLocaleString()}
                              </td>
                              <td
                                style={{
                                  padding: "20px 16px",
                                  borderRadius: "0 12px 12px 0",
                                }}
                              >
                                <div style={{ display: "flex", gap: "8px" }}>
                                  <span
                                    style={{
                                      padding: "6px 14px",
                                      borderRadius: "100px",
                                      fontSize: "11px",
                                      fontWeight: 800,
                                      backgroundColor:
                                        b.status === "Confirmed"
                                          ? "#22c55e20"
                                          : b.status === "Scanned"
                                            ? "#22c55e20"
                                            : b.status === "Pending"
                                              ? "#f59e0b20"
                                              : "#ef444420",
                                      color:
                                        b.status === "Confirmed"
                                          ? "#22c55e"
                                          : b.status === "Scanned"
                                            ? "#22c55e"
                                            : b.status === "Pending"
                                              ? "#f59e0b"
                                              : "#ef4444",
                                    }}
                                  >
                                    {b.status === "Scanned"
                                      ? "CHECKED IN"
                                      : b.status
                                        ? b.status.toUpperCase()
                                        : "UNKNOWN"}
                                  </span>
                                  <button
                                    onClick={() => setViewingBookingDetails(b)}
                                    style={{
                                      padding: "6px 12px",
                                      borderRadius: "8px",
                                      border: `1px solid ${t.border}`,
                                      background: t.cardBg,
                                      color: t.textMain,
                                      fontSize: "10px",
                                      fontWeight: 800,
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "4px",
                                    }}
                                  >
                                    <Info size={12} /> INFO
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
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
            <div
              className="breadcrumb"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "24px",
                fontSize: "14px",
                color: t.textSub,
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
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
              <div
                style={{
                  backgroundColor: t.cardBg,
                  padding: "32px",
                  borderRadius: "16px",
                  border: `1px solid ${t.border}`,
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                }}
              >
                <div style={{ marginBottom: "32px" }}>
                  <h3
                    style={{
                      fontSize: "24px",
                      fontWeight: 800,
                      color: t.textMain,
                      margin: 0,
                    }}
                  >
                    Funds Withdrawal
                  </h3>
                  <p
                    style={{
                      fontSize: "14px",
                      color: t.textSub,
                      marginTop: "4px",
                    }}
                  >
                    Request withdrawals to your linked bank account. Minimum
                    balance Required: ₹500.
                  </p>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "32px",
                  }}
                >
                  <div
                    style={{
                      padding: "32px",
                      borderRadius: "20px",
                      background:
                        "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
                      color: "#fff",
                      boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "24px",
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: "15px",
                          fontWeight: 600,
                          opacity: 0.9,
                        }}
                      >
                        Available for Withdrawal
                      </p>
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "10px",
                          backgroundColor: "rgba(255,255,255,0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Wallet size={24} />
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: "42px", fontWeight: 900 }}>
                      ₹{wallet.balance.toLocaleString()}
                    </p>
                    <button
                      onClick={() => setShowPayoutModal(true)}
                      style={{
                        marginTop: "32px",
                        width: "100%",
                        padding: "16px",
                        borderRadius: "12px",
                        border: "none",
                        backgroundColor: "#fff",
                        color: "#3b82f6",
                        fontWeight: 800,
                        cursor: "pointer",
                        fontSize: "15px",
                        transition: "0.2s",
                      }}
                    >
                      Request Payout
                    </button>
                  </div>
                  <div
                    style={{
                      padding: "32px",
                      borderRadius: "20px",
                      border: `1px solid ${t.border}`,
                      backgroundColor: t.bg,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "24px",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "16px",
                          fontWeight: 800,
                          color: t.textMain,
                          margin: 0,
                        }}
                      >
                        Linked Bank Account
                      </h4>
                      <div
                        style={{
                          padding: "6px 12px",
                          borderRadius: "100px",
                          backgroundColor: "#22c55e20",
                          color: "#22c55e",
                          fontSize: "11px",
                          fontWeight: 800,
                        }}
                      >
                        PRIMARY
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        padding: "20px",
                        backgroundColor: t.cardBg,
                        borderRadius: "12px",
                        border: `1px solid ${t.border}`,
                      }}
                    >
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "12px",
                          backgroundColor:
                            theme === "light" ? "#f1f5f9" : "#1e293b",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Building size={24} style={{ color: t.textSub }} />
                      </div>
                      <div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "15px",
                            fontWeight: 700,
                            color: t.textMain,
                          }}
                        >
                          {kycFormData.bankName || "No Bank Linked"} ····{" "}
                          {kycFormData.accountNumber?.slice(-4) || "0000"}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "12px",
                            color: t.textSub,
                          }}
                        >
                          Account{" "}
                          {kycFormData.bankName ? "Linked" : "Not Linked"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowBankUpdateModal(true)}
                      style={{
                        marginTop: "24px",
                        width: "100%",
                        border: `1px solid ${t.border}`,
                        background: t.cardBg,
                        color: t.textMain,
                        padding: "12px",
                        borderRadius: "10px",
                        fontSize: "13px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Change Settlement Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        case "transactions":
        case "financials":
          return <TransactionHistory user={user} theme={theme} />;

        case "pwa_scanner": {
          const Breadcrumb = ({ title }) => (
            <div
              className="breadcrumb"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "24px",
                fontSize: "14px",
                color: t.textSub,
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <Home size={14} />
                <span>Tools</span>
              </div>
              <ChevronDown size={14} style={{ transform: "rotate(-90deg)" }} />
              <div style={{ color: "#3b82f6", fontWeight: 700 }}>{title}</div>
            </div>
          );

          const myEventIds = new Set(events.map((e) => String(e.id)));
          const myBookings = convexBookings.filter((b) =>
            myEventIds.has(String(b.event_id)),
          );
          const recentScans = myBookings
            .filter((b) => b.checked_in)
            .sort(
              (a, b) =>
                new Date(b.scanned_at || b.created_at).getTime() -
                new Date(a.scanned_at || a.created_at).getTime(),
            )
            .reverse();

          return (
            <div>
              <div style={{ padding: isStaff ? "0 16px" : "0" }}>
                {!isStaff && <Breadcrumb title="PWA Ticket Scanner" />}
                <div className="pwa-scanner-grid">
                  <div
                    style={{
                      backgroundColor: t.cardBg,
                      padding: "32px",
                      borderRadius: "16px",
                      border: `1px solid ${t.border}`,
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                    }}
                  >
                    <div style={{ marginBottom: "32px" }}>
                      <h3
                        style={{
                          fontSize: "24px",
                          fontWeight: 800,
                          color: t.textMain,
                          margin: 0,
                        }}
                      >
                        Ticket Validation
                      </h3>
                      <p
                        style={{
                          fontSize: "14px",
                          color: t.textSub,
                          marginTop: "4px",
                        }}
                      >
                        Scan QR code or enter Booking ID manually to check-in
                        attendees.
                      </p>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "24px",
                      }}
                    >
                      <div
                        style={{
                          padding: "24px",
                          borderRadius: "12px",
                          backgroundColor: "#3b82f610",
                          border: "1px dashed #3b82f640",
                          textAlign: "center",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setPwaCameraOpen(true)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "16px 28px",
                            borderRadius: "12px",
                            border: "none",
                            backgroundColor: "#3b82f6",
                            color: "#fff",
                            fontWeight: 800,
                            cursor: "pointer",
                            fontSize: "15px",
                            boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                          }}
                        >
                          <Camera size={22} /> Launch Camera Scanner
                        </button>
                      </div>

                      {pwaCameraOpen && (
                        <div
                          style={{
                            padding: "24px",
                            borderRadius: "16px",
                            backgroundColor:
                              theme === "light" ? "#f8fafc" : "#0f172a",
                            border: `2px solid #3b82f6`,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "16px",
                            }}
                          >
                            <p
                              style={{
                                margin: 0,
                                fontSize: "14px",
                                fontWeight: 700,
                                color: t.textMain,
                              }}
                            >
                              Scanner Active
                            </p>
                            <button
                              type="button"
                              onClick={() => setPwaCameraOpen(false)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#ef4444",
                                fontWeight: 700,
                                cursor: "pointer",
                                fontSize: "13px",
                              }}
                            >
                              Close Camera
                            </button>
                          </div>
                          <div
                            id="pwa-qr-reader"
                            style={{
                              width: "100%",
                              maxWidth: "400px",
                              margin: "0 auto",
                              borderRadius: "12px",
                              overflow: "hidden",
                              backgroundColor: "#000",
                            }}
                          ></div>
                        </div>
                      )}

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "13px",
                            fontWeight: 800,
                            color: t.textSub,
                            marginBottom: "8px",
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                          }}
                        >
                          Manual Validation
                        </label>
                        <div
                          className="manual-validation-box"
                          style={{ display: "flex", gap: "12px" }}
                        >
                          <input
                            type="text"
                            placeholder="Enter Booking ID (e.g. ORD-123456...)"
                            value={pwaScanInput}
                            onChange={(e) => {
                              setPwaScanInput(e.target.value);
                              setPwaScanResult(null);
                            }}
                            style={{
                              flex: 1,
                              padding: "14px 16px",
                              borderRadius: "10px",
                              border: `1px solid ${t.border}`,
                              backgroundColor: t.bg,
                              color: t.textMain,
                              fontSize: "15px",
                              outline: "none",
                              fontWeight: 600,
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => validateBookingId(pwaScanInput)}
                            style={{
                              padding: "14px 24px",
                              borderRadius: "10px",
                              border: "none",
                              backgroundColor: "#3b82f6",
                              color: "#fff",
                              fontWeight: 800,
                              cursor: "pointer",
                              fontSize: "14px",
                            }}
                          >
                            Validate
                          </button>
                        </div>
                      </div>

                      {pwaScanResult && (
                        <div
                          style={{
                            padding: "24px",
                            borderRadius: "16px",
                            border: "1px solid",
                            backgroundColor:
                              pwaScanResult.status === "valid"
                                ? "#22c55e10"
                                : pwaScanResult.status === "already_used"
                                  ? "#f59e0b10"
                                  : "#ef444410",
                            borderColor:
                              pwaScanResult.status === "valid"
                                ? "#22c55e40"
                                : pwaScanResult.status === "already_used"
                                  ? "#f59e0b40"
                                  : "#ef444440",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              marginBottom: "12px",
                            }}
                          >
                            <div
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "10px",
                                backgroundColor:
                                  pwaScanResult.status === "valid"
                                    ? "#22c55e20"
                                    : pwaScanResult.status === "already_used"
                                      ? "#f59e0b20"
                                      : "#ef444420",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {pwaScanResult.status === "valid" ? (
                                <CheckCircle size={24} color="#22c55e" />
                              ) : pwaScanResult.status === "already_used" ? (
                                <AlertCircle size={24} color="#f59e0b" />
                              ) : (
                                <XCircle size={24} color="#ef4444" />
                              )}
                            </div>
                            <div>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: "16px",
                                  fontWeight: 800,
                                  color:
                                    pwaScanResult.status === "valid"
                                      ? "#22c55e"
                                      : pwaScanResult.status === "already_used"
                                        ? "#f59e0b"
                                        : "#ef4444",
                                }}
                              >
                                {pwaScanResult.status === "valid"
                                  ? "Verified Successfully"
                                  : pwaScanResult.status === "already_used"
                                    ? "Already Checked In"
                                    : "Invalid Ticket ID"}
                              </p>
                              <p
                                style={{
                                  margin: "2px 0 0",
                                  fontSize: "13px",
                                  color: t.textSub,
                                }}
                              >
                                {pwaScanResult.status === "valid"
                                  ? "Attendee can proceed"
                                  : "Access Denied"}
                              </p>
                            </div>
                          </div>
                          {pwaScanResult.booking && (
                            <div
                              style={{
                                padding: "16px",
                                backgroundColor: t.cardBg,
                                borderRadius: "12px",
                                border: `1px solid ${t.border}`,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "14px",
                                  fontWeight: 800,
                                  color: t.textMain,
                                }}
                              >
                                {pwaScanResult.booking.event_name ||
                                  pwaScanResult.booking.eventName}
                              </div>
                              <div
                                style={{
                                  fontSize: "12px",
                                  color: t.textSub,
                                  marginTop: "4px",
                                }}
                              >
                                Attendee ID:{" "}
                                {pwaScanResult.booking.user_id ||
                                  pwaScanResult.booking.userId}
                              </div>
                              <div
                                style={{ fontSize: "12px", color: t.textSub }}
                              >
                                Quantity:{" "}
                                {pwaScanResult.booking.ticket_count ||
                                  pwaScanResult.booking.ticketCount}{" "}
                                Ticket(s)
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      backgroundColor: t.cardBg,
                      padding: "32px",
                      borderRadius: "16px",
                      border: `1px solid ${t.border}`,
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                    }}
                  >
                    <h4
                      style={{
                        fontSize: "16px",
                        fontWeight: 800,
                        marginBottom: "20px",
                        color: t.textMain,
                      }}
                    >
                      Check-in Guide
                    </h4>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "20px",
                      }}
                    >
                      {[
                        {
                          icon: <QrCode size={18} />,
                          title: "Digital Tickets",
                          desc: "Attendees should show the QR code from their mobile app.",
                        },
                        {
                          icon: <Search size={18} />,
                          title: "Manual Search",
                          desc: "If camera fails, enter the Booking ID found below the QR code.",
                        },
                        {
                          icon: <UserCheck size={18} />,
                          title: "Single Entry",
                          desc: "Tickets are invalidated immediately after successful scan.",
                        },
                      ].map((item, i) => (
                        <div key={i} style={{ display: "flex", gap: "16px" }}>
                          <div style={{ color: "#3b82f6" }}>{item.icon}</div>
                          <div>
                            <p
                              style={{
                                margin: 0,
                                fontSize: "14px",
                                fontWeight: 700,
                                color: t.textMain,
                              }}
                            >
                              {item.title}
                            </p>
                            <p
                              style={{
                                margin: "4px 0 0",
                                fontSize: "12px",
                                color: t.textSub,
                                lineHeight: 1.5,
                              }}
                            >
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: t.cardBg,
                    padding: "32px",
                    borderRadius: "16px",
                    border: `1px solid ${t.border}`,
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "24px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "20px",
                        fontWeight: 800,
                        color: t.textMain,
                        margin: 0,
                      }}
                    >
                      Recent Scans
                    </h3>
                    <div
                      style={{
                        padding: "6px 16px",
                        borderRadius: "100px",
                        backgroundColor: "#22c55e20",
                        color: "#22c55e",
                        fontSize: "13px",
                        fontWeight: 700,
                      }}
                    >
                      {recentScans.length} Checked-In
                    </div>
                  </div>

                  <div
                    className="scan-table-desktop"
                    style={{ overflowX: "auto" }}
                  >
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "separate",
                        borderSpacing: "0 8px",
                      }}
                    >
                      <thead>
                        <tr style={{ textAlign: "left" }}>
                          <th
                            style={{
                              padding: "12px 16px",
                              color: t.textSub,
                              fontSize: "13px",
                              fontWeight: 700,
                            }}
                          >
                            Ticket ID
                          </th>
                          <th
                            style={{
                              padding: "12px 16px",
                              color: t.textSub,
                              fontSize: "13px",
                              fontWeight: 700,
                            }}
                          >
                            Event
                          </th>
                          <th
                            style={{
                              padding: "12px 16px",
                              color: t.textSub,
                              fontSize: "13px",
                              fontWeight: 700,
                            }}
                          >
                            Attendee
                          </th>
                          <th
                            style={{
                              padding: "12px 16px",
                              color: t.textSub,
                              fontSize: "13px",
                              fontWeight: 700,
                            }}
                          >
                            Status
                          </th>
                          <th
                            style={{
                              padding: "12px 16px",
                              color: t.textSub,
                              fontSize: "13px",
                              fontWeight: 700,
                            }}
                          >
                            Details
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentScans.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              style={{
                                textAlign: "center",
                                padding: "48px",
                                color: t.textSub,
                              }}
                            >
                              No tickets scanned yet.
                            </td>
                          </tr>
                        ) : (
                          recentScans.map((b) => (
                            <tr
                              key={b.id}
                              style={{
                                backgroundColor: t.bg,
                                borderRadius: "12px",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                              }}
                            >
                              <td
                                style={{
                                  padding: "16px",
                                  borderRadius: "12px 0 0 12px",
                                  fontSize: "13px",
                                  fontWeight: 700,
                                  color: t.textSub,
                                }}
                              >
                                #{b.id.slice(-8).toUpperCase()}
                              </td>
                              <td
                                style={{
                                  padding: "16px",
                                  fontSize: "14px",
                                  fontWeight: 600,
                                }}
                              >
                                {b.event_name || b.eventName || "—"}
                              </td>
                              <td style={{ padding: "16px" }}>
                                <div
                                  style={{ fontSize: "14px", fontWeight: 600 }}
                                >
                                  {b.user_name ||
                                    b.userName ||
                                    b.customer_details?.name ||
                                    "Guest User"}
                                </div>
                                <div
                                  style={{ fontSize: "12px", color: t.textSub }}
                                >
                                  {b.customer_details?.email ||
                                    b.customer_email ||
                                    b.user_id ||
                                    b.userId}
                                </div>
                              </td>
                              <td style={{ padding: "16px" }}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    color: "#22c55e",
                                    fontSize: "13px",
                                    fontWeight: 700,
                                  }}
                                >
                                  <CheckCircle size={16} /> Authenticated
                                </div>
                              </td>
                              <td
                                style={{
                                  padding: "16px",
                                  borderRadius: "0 12px 12px 0",
                                }}
                              >
                                <button
                                  onClick={() => setViewingBookingDetails(b)}
                                  style={{
                                    padding: "6px 12px",
                                    borderRadius: "8px",
                                    border: `1px solid ${t.border}`,
                                    background: t.cardBg,
                                    color: t.textMain,
                                    fontSize: "10px",
                                    fontWeight: 800,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  <Info size={12} /> INFO
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div
                    className="scan-cards-mobile"
                    style={{ display: "none" }}
                  >
                    {recentScans.length === 0 ? (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "32px",
                          color: t.textSub,
                        }}
                      >
                        No scans yet
                      </div>
                    ) : (
                      recentScans.map((b) => (
                        <div
                          key={b.id}
                          style={{
                            backgroundColor: t.bg,
                            padding: "16px",
                            borderRadius: "16px",
                            border: `1px solid ${t.border}`,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: "12px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: 800,
                                color: t.textSub,
                                backgroundColor: t.cardBg,
                                padding: "4px 8px",
                                borderRadius: "6px",
                              }}
                            >
                              #{b.id.slice(-8).toUpperCase()}
                            </span>
                            <div
                              style={{
                                color: "#22c55e",
                                fontSize: "12px",
                                fontWeight: 800,
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <CheckCircle size={14} /> Valid
                            </div>
                          </div>
                          <div
                            style={{
                              fontSize: "15px",
                              fontWeight: 800,
                              color: t.textMain,
                              marginBottom: "4px",
                            }}
                          >
                            {b.event_name || b.eventName || "—"}
                          </div>
                          <div
                            style={{
                              fontSize: "13px",
                              fontWeight: 600,
                              color: t.textSub,
                            }}
                          >
                            {b.user_name ||
                              b.userName ||
                              b.customer_details?.name ||
                              "Guest User"}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: t.textSub,
                              opacity: 0.7,
                              marginTop: "8px",
                            }}
                          >
                            {new Date(
                              b.scanned_at || b.created_at || 0,
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        }
        case "subscriptions":
          return <SubscriptionManager user={user} theme={theme} t={t} />;
        case "support_tickets": {
          const TICKET_STATUSES = [
            "Open",
            "Pending",
            "On-Hold",
            "In-Progress",
            "Resolved",
            "Closed",
          ];
          const statusColor = (s) =>
            ({
              Open: "#22c55e",
              Pending: "#7dd3fc",
              "On-Hold": "#8b5cf6",
              "In-Progress": "#06b6d4",
              Resolved: "#22c55e",
              Closed: "#ef4444",
            })[s] || "#334155";
          const filteredTickets = supportTicketSearchId.trim()
            ? supportTicketsList.filter((t) =>
                String(t.ticketId || t.id || "")
                  .toLowerCase()
                  .includes(supportTicketSearchId.trim().toLowerCase()),
              )
            : supportTicketsList;
          const toggleTicketSelect = (id) =>
            setSelectedTicketIds((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
            );
          const toggleSelectAll = () => {
            if (selectedTicketIds.length >= filteredTickets.length)
              setSelectedTicketIds([]);
            else setSelectedTicketIds(filteredTickets.map((t) => t.id));
          };
          const viewedTicket = supportTicketDetailId
            ? supportTicketsList.find((t) => t.id === supportTicketDetailId)
            : null;
          const addReplyToTicket = (ticketId, message) => {
            const list = supportTicketsList.map((t) =>
              t.id !== ticketId
                ? t
                : {
                    ...t,
                    replies: [
                      ...(Array.isArray(t.replies) ? t.replies : []),
                      {
                        from: "organiser",
                        message: (message || "").trim(),
                        at: new Date().toISOString(),
                      },
                    ],
                    updatedAt: new Date().toISOString(),
                  },
            );
            setSupportTicketsList(list);
            setSupportTicketReplyMessage("");
          };

          const Breadcrumb = ({ title }) => (
            <div className="breadcrumb">
              <div className="breadcrumb-item">
                <Home size={14} />
                <span>Support Tickets</span>
              </div>
              <div
                className="breadcrumb-item"
                style={{ color: "#3b82f6", fontWeight: 700 }}
              >
                {title}
              </div>
            </div>
          );

          return (
            <div>
              <Breadcrumb
                title={
                  supportTab === "all_tickets" ? "All Tickets" : "Add Ticket"
                }
              />
              <div
                style={{
                  backgroundColor: t.cardBg,
                  padding: "32px",
                  borderRadius: "16px",
                  border: `1px solid ${t.border}`,
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "32px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "24px",
                      fontWeight: 800,
                      color: t.textMain,
                      margin: 0,
                    }}
                  >
                    {supportTab === "all_tickets"
                      ? "All Tickets"
                      : "Add Ticket"}
                  </h3>
                </div>

                {supportTab === "add_ticket" && (
                  <div style={{ maxWidth: "800px" }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "24px",
                        marginBottom: "24px",
                      }}
                    >
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: 700,
                            color: t.textMain,
                            marginBottom: "8px",
                          }}
                        >
                          Email <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                          type="email"
                          value={
                            supportTicketForm.email || profile?.email || ""
                          }
                          onChange={(e) =>
                            setSupportTicketForm((f) => ({
                              ...f,
                              email: e.target.value,
                            }))
                          }
                          placeholder="Enter Email"
                          style={{
                            width: "100%",
                            padding: "14px",
                            borderRadius: "10px",
                            border: `1px solid ${t.border}`,
                            backgroundColor: t.bg,
                            color: t.textMain,
                            fontSize: "14px",
                            outline: "none",
                          }}
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: 700,
                            color: t.textMain,
                            marginBottom: "8px",
                          }}
                        >
                          Subject <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Enter Subject"
                          value={supportTicketForm.subject}
                          onChange={(e) =>
                            setSupportTicketForm((f) => ({
                              ...f,
                              subject: e.target.value,
                            }))
                          }
                          style={{
                            width: "100%",
                            padding: "14px",
                            borderRadius: "10px",
                            border: `1px solid ${t.border}`,
                            backgroundColor: t.bg,
                            color: t.textMain,
                            fontSize: "14px",
                            outline: "none",
                          }}
                        />
                      </div>
                      <div style={{ gridColumn: "span 2" }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: 700,
                            color: t.textMain,
                            marginBottom: "8px",
                          }}
                        >
                          Description
                        </label>
                        <textarea
                          placeholder="Enter Description"
                          value={supportTicketForm.description}
                          onChange={(e) =>
                            setSupportTicketForm((f) => ({
                              ...f,
                              description: e.target.value,
                            }))
                          }
                          rows={6}
                          style={{
                            width: "100%",
                            padding: "14px",
                            borderRadius: "10px",
                            border: `1px solid ${t.border}`,
                            backgroundColor: t.bg,
                            color: t.textMain,
                            fontSize: "14px",
                            resize: "vertical",
                            outline: "none",
                          }}
                        />
                      </div>
                      <div style={{ gridColumn: "span 2" }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: 700,
                            color: t.textMain,
                            marginBottom: "12px",
                          }}
                        >
                          Attachment
                        </label>
                        <div
                          style={{
                            padding: "32px",
                            border: `2px dashed ${t.border}`,
                            borderRadius: "12px",
                            textAlign: "center",
                            cursor: "pointer",
                            position: "relative",
                          }}
                        >
                          <CloudUpload
                            size={32}
                            style={{ color: t.textSub, marginBottom: "12px" }}
                          />
                          <p
                            style={{
                              margin: 0,
                              fontSize: "14px",
                              color: t.textMain,
                              fontWeight: 600,
                            }}
                          >
                            Click to upload or drag & drop
                          </p>
                          <p
                            style={{
                              margin: "4px 0 0",
                              fontSize: "12px",
                              color: t.textSub,
                            }}
                          >
                            Upload only ZIP Files, Max File Size is 20 MB
                          </p>
                          <input
                            type="file"
                            accept=".zip"
                            style={{
                              position: "absolute",
                              inset: 0,
                              opacity: 0,
                              cursor: "pointer",
                            }}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              setSupportTicketForm((prev) => ({
                                ...prev,
                                attachmentFileName: f.name,
                              }));
                            }}
                          />
                          {supportTicketForm.attachmentFileName && (
                            <p
                              style={{
                                marginTop: "12px",
                                fontSize: "13px",
                                color: "#3b82f6",
                                fontWeight: 700,
                              }}
                            >
                              {supportTicketForm.attachmentFileName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <button
                        type="button"
                        onClick={async () => {
                          const sub = (supportTicketForm.subject || "").trim();
                          const desc = (
                            supportTicketForm.description || ""
                          ).trim();
                          if (!sub) {
                            alert("Please fill in subject.");
                            return;
                          }
                          await createTicketMutation({
                            user_id: user?.id,
                            subject: sub,
                            message: desc,
                            status: "Open",
                          });
                          setSupportTicketForm({
                            email: "",
                            subject: "",
                            description: "",
                            attachmentFileName: "",
                          });
                          setSupportTab("all_tickets");
                        }}
                        style={{
                          padding: "14px 32px",
                          borderRadius: "10px",
                          border: "none",
                          backgroundColor: "#22c55e",
                          color: "#fff",
                          fontWeight: 700,
                          cursor: "pointer",
                          fontSize: "15px",
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setSupportTab("all_tickets")}
                        style={{
                          padding: "14px 32px",
                          borderRadius: "10px",
                          border: `1px solid ${t.border}`,
                          backgroundColor: "transparent",
                          color: t.textMain,
                          fontWeight: 700,
                          cursor: "pointer",
                          fontSize: "15px",
                        }}
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
                        <button
                          type="button"
                          onClick={() => {
                            setSupportTicketDetailId(null);
                            setSupportTicketReplyMessage("");
                          }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "24px",
                            padding: "10px 18px",
                            borderRadius: "10px",
                            border: `1px solid ${t.border}`,
                            backgroundColor: t.bg,
                            color: t.textMain,
                            fontSize: "14px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          <ArrowRight
                            size={18}
                            style={{ transform: "rotate(180deg)" }}
                          />{" "}
                          Back to list
                        </button>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "24px",
                            marginBottom: "24px",
                          }}
                        >
                          <div
                            style={{
                              backgroundColor: t.bg,
                              padding: "24px",
                              borderRadius: "16px",
                              border: `1px solid ${t.border}`,
                            }}
                          >
                            <h4
                              style={{
                                fontSize: "18px",
                                fontWeight: 800,
                                marginBottom: "20px",
                              }}
                            >
                              Ticket Info
                            </h4>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "16px",
                              }}
                            >
                              <div>
                                <span
                                  style={{
                                    fontSize: "12px",
                                    color: t.textSub,
                                    fontWeight: 600,
                                  }}
                                >
                                  TICKET ID
                                </span>
                                <div
                                  style={{ fontSize: "15px", fontWeight: 700 }}
                                >
                                  #
                                  {viewedTicket.ticketId ||
                                    viewedTicket.id.slice(-6).toUpperCase()}
                                </div>
                              </div>
                              <div>
                                <span
                                  style={{
                                    fontSize: "12px",
                                    color: t.textSub,
                                    fontWeight: 600,
                                  }}
                                >
                                  SUBJECT
                                </span>
                                <div
                                  style={{ fontSize: "15px", fontWeight: 700 }}
                                >
                                  {viewedTicket.subject}
                                </div>
                              </div>
                              <div>
                                <span
                                  style={{
                                    fontSize: "12px",
                                    color: t.textSub,
                                    fontWeight: 600,
                                  }}
                                >
                                  STATUS
                                </span>
                                <div>
                                  <span
                                    style={{
                                      padding: "6px 14px",
                                      borderRadius: "100px",
                                      fontSize: "12px",
                                      fontWeight: 800,
                                      backgroundColor:
                                        (statusColor(viewedTicket.status) ||
                                          "#334155") + "20",
                                      color: statusColor(viewedTicket.status),
                                    }}
                                  >
                                    {(
                                      viewedTicket.status || "Open"
                                    ).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <span
                                  style={{
                                    fontSize: "12px",
                                    color: t.textSub,
                                    fontWeight: 600,
                                  }}
                                >
                                  CREATED AT
                                </span>
                                <div
                                  style={{ fontSize: "14px", fontWeight: 600 }}
                                >
                                  {new Date(
                                    viewedTicket.createdAt,
                                  ).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div
                            style={{
                              backgroundColor: t.bg,
                              padding: "24px",
                              borderRadius: "16px",
                              border: `1px solid ${t.border}`,
                            }}
                          >
                            <h4
                              style={{
                                fontSize: "18px",
                                fontWeight: 800,
                                marginBottom: "20px",
                              }}
                            >
                              Ticket Body
                            </h4>
                            <p
                              style={{
                                margin: 0,
                                fontSize: "14px",
                                color: t.textMain,
                                lineHeight: 1.6,
                              }}
                            >
                              {viewedTicket.description ||
                                "No description provided."}
                            </p>
                          </div>
                        </div>
                        <div
                          style={{
                            backgroundColor: t.bg,
                            padding: "24px",
                            borderRadius: "16px",
                            border: `1px solid ${t.border}`,
                          }}
                        >
                          <h4
                            style={{
                              fontSize: "18px",
                              fontWeight: 800,
                              marginBottom: "20px",
                            }}
                          >
                            Reply History
                          </h4>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "16px",
                              marginBottom: "32px",
                            }}
                          >
                            {viewedTicket.replies?.length > 0 ? (
                              viewedTicket.replies.map((r, i) => (
                                <div
                                  key={i}
                                  style={{
                                    display: "flex",
                                    gap: "16px",
                                    padding: "20px",
                                    borderRadius: "12px",
                                    backgroundColor:
                                      r.from === "organiser"
                                        ? "#3b82f610"
                                        : "#f1f5f9",
                                    borderLeft: `4px solid ${r.from === "organiser" ? "#3b82f6" : "#334155"}`,
                                  }}
                                >
                                  <div style={{ flex: 1 }}>
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        marginBottom: "8px",
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontWeight: 800,
                                          fontSize: "14px",
                                          textTransform: "capitalize",
                                        }}
                                      >
                                        {r.from}
                                      </span>
                                      <span
                                        style={{
                                          fontSize: "12px",
                                          color: t.textSub,
                                        }}
                                      >
                                        {new Date(r.at).toLocaleString()}
                                      </span>
                                    </div>
                                    <p
                                      style={{
                                        margin: 0,
                                        fontSize: "14px",
                                        color: t.textMain,
                                      }}
                                    >
                                      {r.message}
                                    </p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div
                                style={{
                                  textAlign: "center",
                                  padding: "32px",
                                  color: t.textSub,
                                }}
                              >
                                No replies yet.
                              </div>
                            )}
                          </div>
                          <div
                            style={{
                              borderTop: `1px solid ${t.border}`,
                              paddingTop: "24px",
                            }}
                          >
                            <label
                              style={{
                                display: "block",
                                fontSize: "14px",
                                fontWeight: 700,
                                marginBottom: "12px",
                              }}
                            >
                              Add New Reply
                            </label>
                            <textarea
                              value={supportTicketReplyMessage}
                              onChange={(e) =>
                                setSupportTicketReplyMessage(e.target.value)
                              }
                              placeholder="Type your message here..."
                              rows={4}
                              style={{
                                width: "100%",
                                padding: "16px",
                                borderRadius: "12px",
                                border: `1px solid ${t.border}`,
                                backgroundColor: t.cardBg,
                                color: t.textMain,
                                fontSize: "14px",
                                outline: "none",
                                marginBottom: "16px",
                              }}
                            />
                            <button
                              onClick={() => {
                                if (!supportTicketReplyMessage.trim()) return;
                                addReplyToTicket(
                                  viewedTicket.id,
                                  supportTicketReplyMessage,
                                );
                              }}
                              style={{
                                padding: "12px 28px",
                                borderRadius: "10px",
                                backgroundColor: "#3b82f6",
                                color: "#fff",
                                border: "none",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              Send Reply
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "24px",
                            gap: "16px",
                            flexWrap: "wrap",
                          }}
                        >
                          <div
                            style={{
                              position: "relative",
                              flex: 1,
                              minWidth: "250px",
                            }}
                          >
                            <input
                              type="text"
                              placeholder="Search by Ticket ID"
                              value={supportTicketSearchId}
                              onChange={(e) =>
                                setSupportTicketSearchId(e.target.value)
                              }
                              style={{
                                width: "100%",
                                padding: "12px 16px",
                                borderRadius: "8px",
                                border: `1px solid ${t.border}`,
                                backgroundColor: t.bg,
                                color: t.textMain,
                                fontSize: "14px",
                                outline: "none",
                              }}
                            />
                          </div>
                          <button
                            onClick={() => setSupportTab("add_ticket")}
                            style={{
                              padding: "12px 24px",
                              borderRadius: "8px",
                              backgroundColor: "#3b82f6",
                              color: "#fff",
                              border: "none",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <Plus size={18} /> Add Ticket
                          </button>
                        </div>
                        <div style={{ overflowX: "auto" }}>
                          <table
                            style={{
                              width: "100%",
                              borderCollapse: "separate",
                              borderSpacing: "0 8px",
                            }}
                          >
                            <thead>
                              <tr style={{ textAlign: "left" }}>
                                <th
                                  style={{
                                    padding: "12px 16px",
                                    color: t.textSub,
                                    fontSize: "13px",
                                    fontWeight: 700,
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={
                                      filteredTickets.length > 0 &&
                                      selectedTicketIds.length ===
                                        filteredTickets.length
                                    }
                                    onChange={toggleSelectAll}
                                  />
                                </th>
                                <th
                                  style={{
                                    padding: "12px 16px",
                                    color: t.textSub,
                                    fontSize: "13px",
                                    fontWeight: 700,
                                  }}
                                >
                                  Ticket ID
                                </th>
                                <th
                                  style={{
                                    padding: "12px 16px",
                                    color: t.textSub,
                                    fontSize: "13px",
                                    fontWeight: 700,
                                  }}
                                >
                                  Email
                                </th>
                                <th
                                  style={{
                                    padding: "12px 16px",
                                    color: t.textSub,
                                    fontSize: "13px",
                                    fontWeight: 700,
                                  }}
                                >
                                  Subject
                                </th>
                                <th
                                  style={{
                                    padding: "12px 16px",
                                    color: t.textSub,
                                    fontSize: "13px",
                                    fontWeight: 700,
                                  }}
                                >
                                  Status
                                </th>
                                <th
                                  style={{
                                    padding: "12px 16px",
                                    color: t.textSub,
                                    fontSize: "13px",
                                    fontWeight: 700,
                                  }}
                                >
                                  Action
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredTickets.map((ticket) => (
                                <tr
                                  key={ticket.id}
                                  style={{
                                    backgroundColor: t.bg,
                                    borderRadius: "12px",
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                  }}
                                >
                                  <td
                                    style={{
                                      padding: "16px",
                                      borderRadius: "12px 0 0 12px",
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selectedTicketIds.includes(
                                        ticket.id,
                                      )}
                                      onChange={() =>
                                        toggleTicketSelect(ticket.id)
                                      }
                                    />
                                  </td>
                                  <td
                                    style={{
                                      padding: "16px",
                                      fontSize: "14px",
                                      fontWeight: 700,
                                    }}
                                  >
                                    #
                                    {ticket.ticketId ||
                                      ticket.id.slice(-6).toUpperCase()}
                                  </td>
                                  <td
                                    style={{
                                      padding: "16px",
                                      fontSize: "14px",
                                      color: t.textSub,
                                    }}
                                  >
                                    {ticket.email || "—"}
                                  </td>
                                  <td
                                    style={{
                                      padding: "16px",
                                      fontSize: "14px",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {ticket.subject}
                                  </td>
                                  <td style={{ padding: "16px" }}>
                                    <span
                                      style={{
                                        padding: "6px 12px",
                                        borderRadius: "100px",
                                        fontSize: "11px",
                                        fontWeight: 800,
                                        backgroundColor:
                                          (statusColor(ticket.status) ||
                                            "#334155") + "20",
                                        color: statusColor(ticket.status),
                                      }}
                                    >
                                      {ticket.status.toUpperCase()}
                                    </span>
                                  </td>
                                  <td
                                    style={{
                                      padding: "16px",
                                      borderRadius: "0 12px 12px 0",
                                    }}
                                  >
                                    <select
                                      onChange={(e) => {
                                        if (e.target.value === "view")
                                          setSupportTicketDetailId(ticket.id);
                                        if (e.target.value === "reply") {
                                          setSupportTicketDetailId(ticket.id);
                                          setSupportTicketReplyMessage("");
                                        }
                                        e.target.value = "select";
                                      }}
                                      style={{
                                        padding: "6px 12px",
                                        borderRadius: "6px",
                                        border: `1px solid ${t.border}`,
                                        backgroundColor: t.cardBg,
                                        color: t.textMain,
                                        fontSize: "12px",
                                        outline: "none",
                                        cursor: "pointer",
                                      }}
                                    >
                                      <option value="select">Select</option>
                                      <option value="view">View</option>
                                      <option value="reply">Reply</option>
                                    </select>
                                  </td>
                                </tr>
                              ))}
                              {filteredTickets.length === 0 && (
                                <tr>
                                  <td
                                    colSpan={6}
                                    style={{
                                      textAlign: "center",
                                      padding: "48px",
                                      color: t.textSub,
                                    }}
                                  >
                                    No support tickets found.
                                  </td>
                                </tr>
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
          const orgTypeOptions = [
            "Individual",
            "Event Organiser",
            "Pvt Ltd",
            "Others",
          ];
          const Breadcrumb = ({ title }) => (
            <div
              className="breadcrumb"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "24px",
                fontSize: "14px",
                color: t.textSub,
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
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
              <div
                style={{
                  backgroundColor: t.cardBg,
                  padding: "32px",
                  borderRadius: "16px",
                  border: `1px solid ${t.border}`,
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  maxWidth: "800px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "24px",
                    marginBottom: "40px",
                    padding: "24px",
                    backgroundColor: theme === "light" ? "#f8fafc" : "#0f172a",
                    borderRadius: "20px",
                    border: `1px solid ${t.border}`,
                  }}
                >
                  <div style={{ position: "relative" }}>
                    <div
                      style={{
                        width: "100px",
                        height: "100px",
                        borderRadius: "50%",
                        backgroundColor: t.bg,
                        border: `4px solid ${t.cardBg}`,
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="Logo"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectCover: "cover",
                          }}
                        />
                      ) : (
                        <ImageIcon size={40} color={t.textSub} />
                      )}
                    </div>
                    {isUploadingLogo && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          backgroundColor: "rgba(0,0,0,0.4)",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <div
                          className="animate-spin"
                          style={{
                            width: "24px",
                            height: "24px",
                            border: "3px solid #fff",
                            borderTopColor: "transparent",
                            borderRadius: "50%",
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4
                      style={{
                        fontSize: "18px",
                        fontWeight: 800,
                        color: t.textMain,
                        margin: "0 0 4px",
                      }}
                    >
                      Organiser Logo
                    </h4>
                    <p
                      style={{
                        fontSize: "13px",
                        color: t.textSub,
                        margin: "0 0 16px",
                      }}
                    >
                      Upload your brand logo for event pages (Min 400x400px).
                    </p>
                    <input
                      type="file"
                      id="logo-upload"
                      hidden
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={isUploadingLogo}
                    />
                    <label
                      htmlFor="logo-upload"
                      style={{
                        padding: "10px 20px",
                        borderRadius: "10px",
                        backgroundColor: "#fff",
                        color: "#3b82f6",
                        border: "2px solid #3b82f6",
                        fontSize: "14px",
                        fontWeight: 800,
                        cursor: isUploadingLogo ? "not-allowed" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        transition: "0.2s",
                      }}
                    >
                      <Camera size={16} />
                      {isUploadingLogo ? "Uploading..." : "Upload New Logo"}
                    </label>
                  </div>
                </div>

                <div style={{ marginBottom: "32px" }}>
                  <h3
                    style={{
                      fontSize: "24px",
                      fontWeight: 800,
                      color: t.textMain,
                      margin: 0,
                    }}
                  >
                    Profile Details
                  </h3>
                  <p
                    style={{
                      fontSize: "14px",
                      color: t.textSub,
                      marginTop: "4px",
                    }}
                  >
                    Update your organiser profile information and public
                    details.
                  </p>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "24px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: 800,
                        color: t.textSub,
                        marginBottom: "8px",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                      }}
                    >
                      First Name
                    </label>
                    <input
                      type="text"
                      value={profile.firstName}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, firstName: e.target.value }))
                      }
                      placeholder="First name"
                      style={{
                        width: "100%",
                        padding: "14px",
                        borderRadius: "10px",
                        border: `1px solid ${t.border}`,
                        backgroundColor: t.bg,
                        color: t.textMain,
                        fontSize: "15px",
                        fontWeight: 600,
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: 800,
                        color: t.textSub,
                        marginBottom: "8px",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                      }}
                    >
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profile.lastName}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, lastName: e.target.value }))
                      }
                      placeholder="Last name"
                      style={{
                        width: "100%",
                        padding: "14px",
                        borderRadius: "10px",
                        border: `1px solid ${t.border}`,
                        backgroundColor: t.bg,
                        color: t.textMain,
                        fontSize: "15px",
                        fontWeight: 600,
                      }}
                    />
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: 800,
                        color: t.textSub,
                        marginBottom: "8px",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                      }}
                    >
                      Organiser Type
                    </label>
                    <div
                      style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}
                    >
                      {orgTypeOptions.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setProfile((p) => ({ ...p, orgType: opt }))
                          }
                          style={{
                            padding: "10px 20px",
                            borderRadius: "10px",
                            border: `2px solid ${profile.orgType === opt ? "#3b82f6" : t.border}`,
                            backgroundColor:
                              profile.orgType === opt
                                ? "#3b82f615"
                                : "transparent",
                            color:
                              profile.orgType === opt ? "#3b82f6" : t.textSub,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontSize: "14px",
                            transition: "0.2s",
                          }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: 800,
                        color: t.textSub,
                        marginBottom: "8px",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                      }}
                    >
                      Email address
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, email: e.target.value }))
                      }
                      placeholder="organizer@example.com"
                      style={{
                        width: "100%",
                        padding: "14px",
                        borderRadius: "10px",
                        border: `1px solid ${t.border}`,
                        backgroundColor: t.bg,
                        color: t.textMain,
                        fontSize: "15px",
                        fontWeight: 600,
                      }}
                    />
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: 800,
                        color: t.textSub,
                        marginBottom: "8px",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                      }}
                    >
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, phone: e.target.value }))
                      }
                      placeholder="+91 98765 43210"
                      style={{
                        width: "100%",
                        padding: "14px",
                        borderRadius: "10px",
                        border: `1px solid ${t.border}`,
                        backgroundColor: t.bg,
                        color: t.textMain,
                        fontSize: "15px",
                        fontWeight: 600,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      gridColumn: "span 2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px",
                      backgroundColor:
                        theme === "light" ? "#f8fafc" : "#0f172a",
                      borderRadius: "12px",
                      border: `1px solid ${t.border}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "10px",
                          backgroundColor:
                            profile.kycStatus === "KYC Approved"
                              ? "#22c55e20"
                              : "#f59e0b20",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {profile.kycStatus === "KYC Approved" ? (
                          <CheckCircle size={24} color="#22c55e" />
                        ) : (
                          <AlertCircle size={24} color="#f59e0b" />
                        )}
                      </div>
                      <div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "14px",
                            fontWeight: 700,
                            color: t.textMain,
                          }}
                        >
                          KYC Verification Status
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "12px",
                            color: t.textSub,
                          }}
                        >
                          {profile.kycStatus}
                        </p>
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "6px 12px",
                        borderRadius: "100px",
                        fontSize: "11px",
                        fontWeight: 800,
                        backgroundColor:
                          profile.kycStatus === "KYC Approved"
                            ? "#22c55e20"
                            : "#f59e0b20",
                        color:
                          profile.kycStatus === "KYC Approved"
                            ? "#22c55e"
                            : "#f59e0b",
                      }}
                    >
                      {profile.kycStatus.toUpperCase()}
                    </div>
                  </div>

                  {/* 💰 Platform Fee Transparency */}
                  <div
                    style={{
                      gridColumn: "span 2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "20px",
                      backgroundColor: "#fdf2f8",
                      borderRadius: "16px",
                      border: "1px solid #fce7f3",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "10px",
                          backgroundColor: "#fbcfe8",
                          color: "#db2777",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Wallet size={20} />
                      </div>
                      <div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "14px",
                            fontWeight: 800,
                            color: "#9d174d",
                          }}
                        >
                          Your Platform Fee Structure
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "12px",
                            color: "#db2777",
                            fontWeight: 600,
                          }}
                        >
                          {organiserData?.fee_config?.override_global
                            ? `${organiserData.fee_config.fee_type === "percentage" ? organiserData.fee_config.fee_value + "%" : "₹" + organiserData.fee_config.fee_value} per ticket`
                            : "Standard Global Fees Apply"}
                          {organiserData?.fee_config?.apply_gst &&
                            ` (+ ${organiserData.fee_config.gst_percent}% GST)`}
                        </p>
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: "10px",
                        fontWeight: 800,
                        color: "#db2777",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        backgroundColor: "#fff",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        border: "1px solid #fce7f3",
                      }}
                    >
                      {organiserData?.fee_config?.override_global
                        ? "Custom Plan"
                        : "Standard"}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "32px",
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    type="button"
                    disabled={isUpdatingProfile}
                    onClick={async () => {
                      try {
                        setIsUpdatingProfile(true);
                        const { error } = await updateProfileMutation({
                          id: user.id,
                          full_name: `${profile.firstName} ${profile.lastName}`,
                          phone: profile.phone,
                          avatar_url: profile.avatar_url,
                        });
                        if (error) throw error;
                        await refreshProfile();
                        showToast("Profile updated successfully!", "success");
                      } catch (err) {
                        console.error("Profile update error:", err);
                        showToast("Failed to update profile.", "error");
                      } finally {
                        setIsUpdatingProfile(false);
                      }
                    }}
                    style={{
                      padding: "16px 32px",
                      borderRadius: "12px",
                      border: "none",
                      backgroundColor: isUpdatingProfile
                        ? "#cbd5e1"
                        : "#3b82f6",
                      color: "#fff",
                      fontWeight: 800,
                      cursor: isUpdatingProfile ? "not-allowed" : "pointer",
                      fontSize: "15px",
                      boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                    }}
                  >
                    {isUpdatingProfile ? "Saving..." : "Save Profile Changes"}
                  </button>
                </div>
              </div>
            </div>
          );
        }

        case "change_password": {
          const Breadcrumb = ({ title }) => (
            <div
              className="breadcrumb"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "24px",
                fontSize: "14px",
                color: t.textSub,
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
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
              <div
                style={{
                  backgroundColor: t.cardBg,
                  padding: "32px",
                  borderRadius: "16px",
                  border: `1px solid ${t.border}`,
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  maxWidth: "560px",
                }}
              >
                <div style={{ marginBottom: "32px" }}>
                  <h3
                    style={{
                      fontSize: "24px",
                      fontWeight: 800,
                      color: t.textMain,
                      margin: 0,
                    }}
                  >
                    Security Settings
                  </h3>
                  <p
                    style={{
                      fontSize: "14px",
                      color: t.textSub,
                      marginTop: "4px",
                    }}
                  >
                    Update your account password to keep it secure.
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: 800,
                        color: t.textSub,
                        marginBottom: "8px",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                      }}
                    >
                      Current Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      style={{
                        width: "100%",
                        padding: "14px",
                        borderRadius: "10px",
                        border: `1px solid ${t.border}`,
                        backgroundColor: t.bg,
                        color: t.textMain,
                        fontSize: "15px",
                        fontWeight: 600,
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: 800,
                        color: t.textSub,
                        marginBottom: "8px",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                      }}
                    >
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      style={{
                        width: "100%",
                        padding: "14px",
                        borderRadius: "10px",
                        border: `1px solid ${t.border}`,
                        backgroundColor: t.bg,
                        color: t.textMain,
                        fontSize: "15px",
                        fontWeight: 600,
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: 800,
                        color: t.textSub,
                        marginBottom: "8px",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                      }}
                    >
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      style={{
                        width: "100%",
                        padding: "14px",
                        borderRadius: "10px",
                        border: `1px solid ${t.border}`,
                        backgroundColor: t.bg,
                        color: t.textMain,
                        fontSize: "15px",
                        fontWeight: 600,
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: "32px" }}>
                  <button
                    disabled
                    style={{
                      width: "100%",
                      padding: "16px",
                      borderRadius: "12px",
                      border: "none",
                      backgroundColor: "#3b82f6",
                      color: "#fff",
                      fontWeight: 800,
                      cursor: "not-allowed",
                      opacity: 0.7,
                      fontSize: "15px",
                    }}
                  >
                    Update Security Password
                  </button>
                </div>
              </div>
            </div>
          );
        }
        case "ticket_bookings": {
          const Breadcrumb = ({ title }) => (
            <div
              className="breadcrumb"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "24px",
                fontSize: "14px",
                color: t.textSub,
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
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
              <div
                style={{
                  backgroundColor: t.cardBg,
                  padding: "32px",
                  borderRadius: "16px",
                  border: `1px solid ${t.border}`,
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                }}
              >
                <div style={{ marginBottom: "32px" }}>
                  <h3
                    style={{
                      fontSize: "24px",
                      fontWeight: 800,
                      color: t.textMain,
                      margin: 0,
                    }}
                  >
                    Booking Archive
                  </h3>
                  <p
                    style={{
                      fontSize: "14px",
                      color: t.textSub,
                      marginTop: "4px",
                    }}
                  >
                    Access historical ticket booking records for all your
                    published events.
                  </p>
                </div>
                <div
                  style={{
                    padding: "64px 32px",
                    textAlign: "center",
                    backgroundColor: t.bg,
                    borderRadius: "20px",
                    border: `2px dashed ${t.border}`,
                  }}
                >
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "20px",
                      backgroundColor: "#3b82f610",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 20px",
                    }}
                  >
                    <Monitor size={32} color="#3b82f6" />
                  </div>
                  <h4
                    style={{
                      fontSize: "18px",
                      fontWeight: 800,
                      color: t.textMain,
                      margin: "0 0 8px",
                    }}
                  >
                    No Booking History
                  </h4>
                  <p
                    style={{
                      fontSize: "14px",
                      color: t.textSub,
                      maxWidth: "320px",
                      margin: "0 auto",
                      lineHeight: 1.5,
                    }}
                  >
                    When customers book tickets for your events, the details
                    will appear here automatically.
                  </p>
                </div>
              </div>
            </div>
          );
        }

        case "refund_status": {
          const Breadcrumb = ({ title }) => (
            <div
              className="breadcrumb"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "24px",
                fontSize: "14px",
                color: t.textSub,
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
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
              <div
                style={{
                  backgroundColor: t.cardBg,
                  padding: "32px",
                  borderRadius: "16px",
                  border: `1px solid ${t.border}`,
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                }}
              >
                <div style={{ marginBottom: "32px" }}>
                  <h3
                    style={{
                      fontSize: "24px",
                      fontWeight: 800,
                      color: t.textMain,
                      margin: 0,
                    }}
                  >
                    Refund Management
                  </h3>
                  <p
                    style={{
                      fontSize: "14px",
                      color: t.textSub,
                      marginTop: "4px",
                    }}
                  >
                    Track and manage ticket refund requests initiated by
                    attendees.
                  </p>
                </div>
                <div
                  style={{
                    padding: "64px 32px",
                    textAlign: "center",
                    backgroundColor: t.bg,
                    borderRadius: "20px",
                    border: `2px dashed ${t.border}`,
                  }}
                >
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "20px",
                      backgroundColor: "#3b82f610",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 20px",
                    }}
                  >
                    <ArrowLeftRight size={32} color="#3b82f6" />
                  </div>
                  <h4
                    style={{
                      fontSize: "18px",
                      fontWeight: 800,
                      color: t.textMain,
                      margin: "0 0 8px",
                    }}
                  >
                    All Clear
                  </h4>
                  <p
                    style={{
                      fontSize: "14px",
                      color: t.textSub,
                      maxWidth: "320px",
                      margin: "0 auto",
                      lineHeight: 1.5,
                    }}
                  >
                    There are no pending or active refund requests at the
                    moment.
                  </p>
                </div>
              </div>
            </div>
          );
        }

        case "ticket_details": {
          const Breadcrumb = ({ title }) => (
            <div
              className="breadcrumb"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "24px",
                fontSize: "14px",
                color: t.textSub,
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
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
              <div
                style={{
                  backgroundColor: t.cardBg,
                  padding: "32px",
                  borderRadius: "16px",
                  border: `1px solid ${t.border}`,
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                }}
              >
                <div style={{ marginBottom: "32px" }}>
                  <h3
                    style={{
                      fontSize: "24px",
                      fontWeight: 800,
                      color: t.textMain,
                      margin: 0,
                    }}
                  >
                    Ticket Details
                  </h3>
                  <p
                    style={{
                      fontSize: "14px",
                      color: t.textSub,
                      marginTop: "4px",
                    }}
                  >
                    Detailed inventory and management of all individual tickets
                    for your events.
                  </p>
                </div>
                <div
                  style={{
                    padding: "64px 32px",
                    textAlign: "center",
                    backgroundColor: t.bg,
                    borderRadius: "20px",
                    border: `2px dashed ${t.border}`,
                  }}
                >
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "20px",
                      backgroundColor: "#3b82f610",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 20px",
                    }}
                  >
                    <Ticket size={32} color="#3b82f6" />
                  </div>
                  <h4
                    style={{
                      fontSize: "18px",
                      fontWeight: 800,
                      color: t.textMain,
                      margin: "0 0 8px",
                    }}
                  >
                    Select an Event
                  </h4>
                  <p
                    style={{
                      fontSize: "14px",
                      color: t.textSub,
                      maxWidth: "320px",
                      margin: "0 auto",
                      lineHeight: 1.5,
                    }}
                  >
                    Go to Event Management and select an event to view its
                    detailed ticket inventory here.
                  </p>
                </div>
              </div>
            </div>
          );
        }

        case "staff_accounts": {
          const Breadcrumb = ({ title }) => (
            <div
              className="breadcrumb"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "24px",
                fontSize: "14px",
                color: t.textSub,
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
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
              <div
                style={{
                  backgroundColor: t.cardBg,
                  padding: "32px",
                  borderRadius: "16px",
                  border: `1px solid ${t.border}`,
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "32px",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontSize: "24px",
                        fontWeight: 800,
                        color: t.textMain,
                        margin: 0,
                      }}
                    >
                      Staff Management
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginTop: "4px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "14px",
                          color: t.textSub,
                          margin: 0,
                        }}
                      >
                        Manage staff access for the mobile scanner application.
                      </p>
                      <div
                        style={{
                          backgroundColor: `${ACCENT_PINK}15`,
                          color: ACCENT_PINK,
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "10px",
                          fontWeight: 800,
                          textTransform: "uppercase",
                        }}
                      >
                        {currentPackage.package_name} ({staffAccounts.length}/
                        {currentPackage.staff_limit || 3})
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button
                      onClick={() => setShowUpgradeModal(true)}
                      style={{
                        background: "none",
                        color: ACCENT_PINK,
                        padding: "12px 24px",
                        borderRadius: "10px",
                        border: `1px solid ${ACCENT_PINK}40`,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Sparkles size={18} /> Upgrade Plan
                    </button>
                    <button
                      onClick={() => {
                        if (staffLimitReached) {
                          setShowUpgradeModal(true);
                          showToast(
                            "Staff limit reached for your current plan",
                            "error",
                          );
                          return;
                        }
                        setEditingStaffId(null);
                        setStaffFormData({
                          name: "",
                          email: "",
                          password: "",
                          mobile: "",
                          assignedEventId: "",
                          expiryDate: "",
                          gateName: "",
                        });
                        setShowStaffModal(true);
                      }}
                      style={{
                        background: staffLimitReached
                          ? "#94a3b8"
                          : ACCENT_GRADIENT,
                        color: "#fff",
                        padding: "12px 24px",
                        borderRadius: "10px",
                        border: "none",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        boxShadow: staffLimitReached
                          ? "none"
                          : `0 4px 14px ${ACCENT_PINK}40`,
                      }}
                    >
                      <Plus size={20} /> Add Staff
                    </button>
                  </div>
                </div>

                {staffAccounts.length === 0 ? (
                  <div
                    style={{
                      padding: "64px 32px",
                      textAlign: "center",
                      backgroundColor: t.bg,
                      borderRadius: "20px",
                      border: `2px dashed ${t.border}`,
                    }}
                  >
                    <div
                      style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "20px",
                        backgroundColor: `${ACCENT_PINK}15`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 20px",
                      }}
                    >
                      <Users size={32} color={ACCENT_PINK} />
                    </div>
                    <h4
                      style={{
                        fontSize: "18px",
                        fontWeight: 800,
                        color: t.textMain,
                        margin: "0 0 8px",
                      }}
                    >
                      No Staff Accounts
                    </h4>
                    <p
                      style={{
                        fontSize: "14px",
                        color: t.textSub,
                        maxWidth: "320px",
                        margin: "0 auto",
                        lineHeight: 1.5,
                      }}
                    >
                      Create staff accounts to allow your team to scan tickets
                      using the mobile app.
                    </p>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{ width: "100%", borderCollapse: "collapse" }}
                    >
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                          <th
                            style={{
                              textAlign: "left",
                              padding: "16px",
                              color: t.textSub,
                              fontSize: "13px",
                              fontWeight: 800,
                              textTransform: "uppercase",
                            }}
                          >
                            Staff Member
                          </th>
                          <th
                            style={{
                              textAlign: "left",
                              padding: "16px",
                              color: t.textSub,
                              fontSize: "13px",
                              fontWeight: 800,
                              textTransform: "uppercase",
                            }}
                          >
                            Contact
                          </th>
                          <th
                            style={{
                              textAlign: "left",
                              padding: "16px",
                              color: t.textSub,
                              fontSize: "13px",
                              fontWeight: 800,
                              textTransform: "uppercase",
                            }}
                          >
                            Assigned Event
                          </th>
                          <th
                            style={{
                              textAlign: "left",
                              padding: "16px",
                              color: t.textSub,
                              fontSize: "13px",
                              fontWeight: 800,
                              textTransform: "uppercase",
                            }}
                          >
                            Active
                          </th>
                          <th
                            style={{
                              textAlign: "right",
                              padding: "16px",
                              color: t.textSub,
                              fontSize: "13px",
                              fontWeight: 800,
                              textTransform: "uppercase",
                            }}
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffAccounts.map((s) => (
                          <tr
                            key={s.id}
                            style={{ borderBottom: `1px solid ${t.border}` }}
                          >
                            <td style={{ padding: "16px" }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "12px",
                                }}
                              >
                                <div
                                  style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "50%",
                                    backgroundColor: `${ACCENT_PINK}15`,
                                    color: ACCENT_PINK,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 800,
                                  }}
                                >
                                  {(s.name || "S").charAt(0)}
                                </div>
                                <span
                                  style={{ fontWeight: 700, color: t.textMain }}
                                >
                                  {s.name}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: "16px" }}>
                              <div
                                style={{ fontWeight: 600, color: t.textMain }}
                              >
                                {s.email}
                              </div>
                              <div
                                style={{ fontSize: "11px", color: t.textSub }}
                              >
                                {s.mobile || "No Mobile"}
                              </div>
                            </td>
                            <td style={{ padding: "16px" }}>
                              <div
                                style={{
                                  display: "inline-block",
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  backgroundColor: s.assigned_event_id
                                    ? `${ACCENT_PINK}10`
                                    : "#f1f5f9",
                                  color: s.assigned_event_id
                                    ? ACCENT_PINK
                                    : t.textSub,
                                  fontSize: "11px",
                                  fontWeight: 700,
                                }}
                              >
                                {s.assigned_event_id
                                  ? eventsData.find(
                                      (e) => e.id === s.assigned_event_id,
                                    )?.title || "Event Assigned"
                                  : "Global Access"}
                                {s.gate_name && (
                                  <span
                                    style={{ marginLeft: "6px", opacity: 0.7 }}
                                  >
                                    • {s.gate_name}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: "16px" }}>
                              <div
                                onClick={async () => {
                                  const newStatus = !s.is_active;
                                  try {
                                    const res = await fetch(
                                      "/api/organiser/staff",
                                      {
                                        method: "PATCH",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                          id: s.id,
                                          is_active: newStatus,
                                        }),
                                      },
                                    );
                                    if (!res.ok)
                                      throw new Error(
                                        "Failed to toggle status",
                                      );
                                    refetchStaff();
                                  } catch (err) {
                                    alert(err.message);
                                  }
                                }}
                                className={`w-10 h-5 rounded-full p-1 cursor-pointer transition-all duration-300 ${s.is_active ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]"}`}
                              >
                                <div
                                  className={`w-3 h-3 bg-white rounded-full transition-transform  ${s.is_active ? "translate-x-5" : "translate-x-0"}`}
                                />
                              </div>
                            </td>

                            <td style={{ padding: "16px", textAlign: "right" }}>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "flex-end",
                                  gap: "10px",
                                  paddingRight: "8px",
                                }}
                              >
                                <button
                                  onClick={() => {
                                    setEditingStaffId(s.id);
                                    setStaffFormData({
                                      name: s.name,
                                      email: s.email,
                                      password: s.password,
                                      mobile: s.mobile || "",
                                      assignedEventId:
                                        s.assigned_event_id || "",
                                      expiryDate: s.expiry_date || "",
                                      gateName: s.gate_name || "",
                                    });
                                    setShowStaffModal(true);
                                  }}
                                  style={{
                                    border: "none",
                                    background: `${ACCENT_PINK}15`,
                                    color: ACCENT_PINK,
                                    padding: "10px",
                                    borderRadius: "10px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                  title="Edit Staff"
                                >
                                  <Settings size={18} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDeletingStaffId(s.id);
                                  }}
                                  style={{
                                    border: "none",
                                    background: "#ef444415",
                                    color: "#ef4444",
                                    padding: "10px",
                                    borderRadius: "10px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
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
                <div
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.8)",
                    backdropFilter: "blur(4px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1100,
                    padding: "20px",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: t.cardBg,
                      padding: "32px",
                      borderRadius: "24px",
                      width: "100%",
                      maxWidth: "400px",
                      border: `1px solid ${t.border}`,
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "20px",
                        backgroundColor: "#ef444410",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 20px",
                      }}
                    >
                      <Trash2 size={32} color="#ef4444" />
                    </div>
                    <h3
                      style={{
                        fontSize: "20px",
                        fontWeight: 800,
                        color: t.textMain,
                        margin: "0 0 8px",
                      }}
                    >
                      Delete Staff Account?
                    </h3>
                    <p
                      style={{
                        fontSize: "14px",
                        color: t.textSub,
                        margin: "0 0 24px",
                        lineHeight: 1.5,
                      }}
                    >
                      This action cannot be undone. The staff member will lose
                      access to the scanner app.
                    </p>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <button
                        onClick={() => setDeletingStaffId(null)}
                        style={{
                          flex: 1,
                          padding: "12px",
                          borderRadius: "10px",
                          border: `1px solid ${t.border}`,
                          background: "none",
                          color: t.textMain,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const idToDelete = deletingStaffId;
                            const staff = staffAccounts.find(
                              (s) => s.id === idToDelete,
                            );
                            setDeletingStaffId(null);

                            const res = await fetch("/api/organiser/staff", {
                              method: "DELETE",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                id: idToDelete,
                                auth_user_id: staff.auth_user_id,
                              }),
                            });

                            if (!res.ok) {
                              const data = await res.json();
                              throw new Error(data.error || "Failed to delete");
                            }

                            refetchStaff();
                            toast.success("Staff account removed successfully");
                          } catch (err) {
                            alert(
                              "Failed to delete staff account: " + err.message,
                            );
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: "12px",
                          borderRadius: "10px",
                          backgroundColor: "#ef4444",
                          color: "#fff",
                          border: "none",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
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
        case "withdraw":
        case "transactions":
        case "payout":
          return (
            <div style={{ padding: "24px 0" }}>
              <WalletDashboard user={user} />
              <div style={{ marginTop: "32px" }}>
                <PayoutRequestPanel requesterType="organiser" />
              </div>
            </div>
          );
        case "coupons":
          return <CouponManagement user={user} />;
        default:
          return <div>Coming Soon</div>;
      }
    };

    return (
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, #06b6d4 0%, #2563eb 40%, #1e1b4b 100%)",
          fontFamily: "'Figtree', sans-serif",
          WebkitFontSmoothing: "antialiased",
          color: "#ffffff",
        }}
      >
        {styles}
        {/* Create Event Modal */}
        {showCreateEvent && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "20px",
            }}
          >
            <div
              style={{
                backgroundColor: t.cardBg,
                padding: "32px",
                borderRadius: "24px",
                width: "100%",
                maxWidth: "800px",
                border: `1px solid ${t.border}`,
                maxHeight: "90vh",
                overflowY: "auto",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "32px",
                }}
              >
                <h2
                  style={{
                    fontSize: "24px",
                    fontWeight: 800,
                    color: t.textMain,
                  }}
                >
                  Create New Event
                </h2>
                <button
                  onClick={() => setShowCreateEvent(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: t.textSub,
                    cursor: "pointer",
                  }}
                >
                  <X size={24} />
                </button>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "24px",
                }}
              >
                <div style={{ gridColumn: "span 2" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 600,
                      marginBottom: "8px",
                      color: t.textMain,
                    }}
                  >
                    Event Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Annual Music Festival"
                    value={newEvent.title}
                    onChange={(e) =>
                      setNewEvent((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "10px",
                      border: `1.5px solid ${t.border}`,
                      backgroundColor: t.bg,
                      color: t.textMain,
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 600,
                      marginBottom: "8px",
                      color: t.textMain,
                    }}
                  >
                    Event Type
                  </label>
                  <select
                    value={newEvent.type}
                    onChange={(e) =>
                      setNewEvent((prev) => ({ ...prev, type: e.target.value }))
                    }
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "10px",
                      border: `1.5px solid ${t.border}`,
                      backgroundColor: t.bg,
                      color: t.textMain,
                    }}
                  >
                    <option value="Venue">Venue Event</option>
                    <option value="Virtual">Virtual Event</option>
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 600,
                      marginBottom: "8px",
                      color: t.textMain,
                    }}
                  >
                    Venue / Meeting Link
                  </label>
                  <input
                    type="text"
                    placeholder="Enter address or URL"
                    value={newEvent.venue}
                    onChange={(e) =>
                      setNewEvent((prev) => ({
                        ...prev,
                        venue: e.target.value,
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "10px",
                      border: `1.5px solid ${t.border}`,
                      backgroundColor: t.bg,
                      color: t.textMain,
                    }}
                  />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: t.textMain,
                      }}
                    >
                      Schedule (Multi-Date & Time)
                    </label>
                    <button
                      onClick={addDateSlot}
                      style={{
                        fontSize: "12px",
                        color: t.activeText,
                        background: "none",
                        border: "none",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Plus size={14} /> Add Slot
                    </button>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    {newEvent.slots.map((slot, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          gap: "12px",
                          alignItems: "center",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <CalendarPicker
                            value={slot.date}
                            onChange={(val) => {
                              const newSlots = [...newEvent.slots];
                              newSlots[idx].date = val;
                              setNewEvent((prev) => ({
                                ...prev,
                                slots: newSlots,
                              }));
                            }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <TimePicker
                            value={slot.time}
                            onChange={(val) => {
                              const newSlots = [...newEvent.slots];
                              newSlots[idx].time = val;
                              setNewEvent((prev) => ({
                                ...prev,
                                slots: newSlots,
                              }));
                            }}
                          />
                        </div>
                        {newEvent.slots.length > 1 && (
                          <button
                            onClick={() => removeDateSlot(idx)}
                            style={{
                              color: "#ef4444",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ gridColumn: "span 2", marginTop: "12px" }}>
                  <button
                    onClick={async () => {
                      try {
                        if (!newEvent.title.trim()) {
                          alert("Please enter event title.");
                          return;
                        }
                        const firstSlot = newEvent.slots[0];
                        await createEventMutation({
                          organiser_id: effectiveEmail,
                          title: newEvent.title,
                          type: newEvent.type,
                          venue: newEvent.venue,
                          date: firstSlot?.date || "TBA",
                          time: firstSlot?.time || "TBA",
                          img: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
                          city:
                            selectedCity && selectedCity !== "All Cities"
                              ? selectedCity
                              : locationHierarchy?.city || undefined,
                          district: locationHierarchy?.district || undefined,
                          state: locationHierarchy?.state || undefined,
                          country: locationHierarchy?.country || undefined,
                          featured: true,
                          trending: true,
                          status: "Active",
                          virtual: newEvent.type === "Online",
                        });
                        setShowCreateEvent(false);
                        setNewEvent({
                          title: "",
                          type: "Venue",
                          venue: "",
                          slots: [{ date: "", time: "" }],
                        });
                      } catch (err) {
                        console.error("Failed to create event:", err);
                        alert(
                          "Failed to create event. Check console for details.",
                        );
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "16px",
                      borderRadius: "12px",
                      backgroundColor: "#3b82f6",
                      color: "#fff",
                      border: "none",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Publish Event
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Staff Modal */}
        {showStaffModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "20px",
            }}
          >
            <div
              style={{
                backgroundColor: t.cardBg,
                padding: "24px",
                borderRadius: "24px",
                width: "100%",
                maxWidth: "520px",
                border: `1px solid ${t.border}`,
                maxHeight: "90vh",
                overflowY: "auto",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: 800,
                    color: t.textMain,
                  }}
                >
                  {editingStaffId ? "Edit Staff Account" : "Add Staff Account"}
                </h2>
                <button
                  onClick={() => setShowStaffModal(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: t.textSub,
                    cursor: "pointer",
                  }}
                >
                  <X size={24} />
                </button>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "14px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: 600,
                        marginBottom: "4px",
                        color: t.textMain,
                      }}
                    >
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter staff name"
                      value={staffFormData.name}
                      onChange={(e) =>
                        setStaffFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "10px",
                        border: `1.5px solid ${t.border}`,
                        backgroundColor: t.bg,
                        color: t.textMain,
                        fontSize: "14px",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: 600,
                        marginBottom: "4px",
                        color: t.textMain,
                      }}
                    >
                      Username / Email
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. staff_john"
                      value={staffFormData.email}
                      onChange={(e) =>
                        setStaffFormData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "10px",
                        border: `1.5px solid ${t.border}`,
                        backgroundColor: t.bg,
                        color: t.textMain,
                        fontSize: "14px",
                      }}
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "14px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: 600,
                        marginBottom: "4px",
                        color: t.textMain,
                      }}
                    >
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 987..."
                      value={staffFormData.mobile}
                      onChange={(e) =>
                        setStaffFormData((prev) => ({
                          ...prev,
                          mobile: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "10px",
                        border: `1.5px solid ${t.border}`,
                        backgroundColor: t.bg,
                        color: t.textMain,
                        fontSize: "14px",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: 600,
                        marginBottom: "4px",
                        color: t.textMain,
                      }}
                    >
                      Access Expiry Date
                    </label>
                    <CalendarPicker
                      value={staffFormData.expiryDate}
                      onChange={(val) =>
                        setStaffFormData((prev) => ({
                          ...prev,
                          expiryDate: val,
                        }))
                      }
                      placeholder="dd/mm/yyyy"
                    />
                  </div>
                </div>
                <div>
                  <CustomSelect
                    label="Assigned Event (Restricted Access)"
                    value={staffFormData.assignedEventId}
                    onChange={(val) =>
                      setStaffFormData((prev) => ({
                        ...prev,
                        assignedEventId: val,
                      }))
                    }
                    placeholder="All Events (Global Scanner)"
                    options={[
                      { label: "All Events (Global Scanner)", value: "" },
                      ...eventsData.map((ev) => ({
                        label: ev.title,
                        value: ev.id,
                      })),
                    ]}
                  />
                </div>
                {currentPackage.features?.multi_gate && (
                  <div>
                    <CustomSelect
                      label="Gate Assignment (Multi-Gate Access)"
                      value={staffFormData.gateName}
                      onChange={(val) =>
                        setStaffFormData((prev) => ({ ...prev, gateName: val }))
                      }
                      placeholder="Select or type a gate name..."
                      options={[
                        "Main Gate",
                        "VIP Entrance",
                        "Staff Entry",
                        "Media Gate",
                        "Backstage Access",
                        "Gate A",
                        "Gate B",
                        "Exit Only",
                      ]}
                    />
                    <p
                      style={{
                        fontSize: "10px",
                        color: t.textSub,
                        marginTop: "4px",
                      }}
                    >
                      Assign this staff member to a specific entry point.
                    </p>
                  </div>
                )}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 600,
                      marginBottom: "4px",
                      color: t.textMain,
                    }}
                  >
                    Password {editingStaffId && "(Leave blank to keep current)"}
                  </label>
                  <input
                    type="password"
                    placeholder="Set access password"
                    value={staffFormData.password}
                    onChange={(e) =>
                      setStaffFormData((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "10px",
                      border: `1.5px solid ${t.border}`,
                      backgroundColor: t.bg,
                      color: t.textMain,
                      fontSize: "14px",
                    }}
                  />
                </div>
                <button
                  onClick={async () => {
                    try {
                      if (
                        !staffFormData.name ||
                        !staffFormData.email ||
                        (!editingStaffId && !staffFormData.password)
                      ) {
                        toast.error("Please fill all required fields");
                        return;
                      }

                      setPostLoading(true);

                      // Call our custom Admin API
                      const method = editingStaffId ? "PUT" : "POST";
                      const body = editingStaffId
                        ? {
                            id: editingStaffId,
                            auth_user_id: staffAccounts.find(
                              (s) => s.id === editingStaffId,
                            )?.auth_user_id,
                            ...staffFormData,
                          }
                        : { ...staffFormData, organiserId: user.id };

                      const res = await fetch("/api/organiser/staff", {
                        method,
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(body),
                      });

                      const data = await res.json();
                      if (!res.ok)
                        throw new Error(data.error || "Operation failed");

                      setShowStaffModal(false);
                      setStaffFormData({ name: "", email: "", password: "" });
                      setEditingStaffId(null);
                      refetchStaff();
                      showToast(
                        editingStaffId
                          ? "Password updated"
                          : "Staff account created",
                        "success",
                      );
                    } catch (err) {
                      showToast(
                        err.message || "Failed to save staff account",
                        "error",
                      );
                    } finally {
                      setPostLoading(false);
                    }
                  }}
                  disabled={postLoading}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "12px",
                    background: ACCENT_GRADIENT,
                    color: "#fff",
                    border: "none",
                    fontWeight: 700,
                    cursor: "pointer",
                    marginTop: "4px",
                    opacity: postLoading ? 0.7 : 1,
                    boxShadow: `0 4px 14px ${ACCENT_PINK}40`,
                  }}
                >
                  {postLoading
                    ? "Processing..."
                    : editingStaffId
                      ? "Update Password"
                      : "Create Account"}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Payout Modal */}
        {showPayoutModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                backgroundColor: t.cardBg,
                padding: "32px",
                borderRadius: "24px",
                width: "400px",
                border: `1px solid ${t.border}`,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  backgroundColor: "#3b82f615",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <Wallet color="#3b82f6" size={28} />
              </div>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: 800,
                  marginBottom: "8px",
                  color: t.textMain,
                }}
              >
                Request Amount
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: t.textSub,
                  marginBottom: "24px",
                }}
              >
                Enter the amount you wish to withdraw to your linked bank
                account.
              </p>
              <div style={{ position: "relative", marginBottom: "24px" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontWeight: 800,
                    fontSize: "18px",
                    color: t.textMain,
                  }}
                >
                  ₹
                </span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 14px 14px 40px",
                    borderRadius: "12px",
                    border: `1.5px solid ${t.border}`,
                    backgroundColor: t.bg,
                    color: t.textMain,
                    fontSize: "20px",
                    fontWeight: 900,
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => setShowPayoutModal(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "10px",
                    border: `1px solid ${t.border}`,
                    background: "none",
                    color: t.textMain,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayoutRequest}
                  disabled={postLoading}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "10px",
                    backgroundColor: "#3b82f6",
                    color: "#fff",
                    border: "none",
                    fontWeight: 700,
                    cursor: "pointer",
                    opacity: postLoading ? 0.7 : 1,
                  }}
                >
                  {postLoading ? "Processing..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bank Update Modal */}
        {showBankUpdateModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                backgroundColor: t.cardBg,
                padding: "32px",
                borderRadius: "24px",
                width: "500px",
                border: `1px solid ${t.border}`,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: "20px",
                      fontWeight: 800,
                      color: t.textMain,
                      margin: 0,
                    }}
                  >
                    Update Settlement Account
                  </h3>
                  <p
                    style={{
                      fontSize: "14px",
                      color: t.textSub,
                      margin: "4px 0 0",
                    }}
                  >
                    Change your bank details for future payouts.
                  </p>
                </div>
                <button
                  onClick={() => setShowBankUpdateModal(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: t.textSub,
                    cursor: "pointer",
                  }}
                >
                  <X size={24} />
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      color: t.textSub,
                      marginBottom: "6px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Beneficiary Name
                  </label>
                  <input
                    type="text"
                    value={kycFormData.beneficiaryName}
                    onChange={(e) =>
                      setKycFormData({
                        ...kycFormData,
                        beneficiaryName: e.target.value,
                      })
                    }
                    placeholder="Account holder name"
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "10px",
                      border: `1px solid ${t.border}`,
                      backgroundColor: t.bg,
                      color: t.textMain,
                      fontWeight: 600,
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        color: t.textSub,
                        marginBottom: "6px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      value={kycFormData.ifscCode}
                      onChange={(e) => handleIfscChange(e.target.value)}
                      placeholder="HDFC0001234"
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "10px",
                        border: `1px solid ${t.border}`,
                        backgroundColor: t.bg,
                        color: t.textMain,
                        fontWeight: 700,
                        letterSpacing: "1px",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        color: t.textSub,
                        marginBottom: "6px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={kycFormData.bankName}
                      onChange={(e) =>
                        setKycFormData({
                          ...kycFormData,
                          bankName: e.target.value,
                        })
                      }
                      placeholder="Auto-filled from IFSC"
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "10px",
                        border: `1px solid ${t.border}`,
                        backgroundColor: t.bg,
                        color: t.textMain,
                        fontWeight: 600,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      color: t.textSub,
                      marginBottom: "6px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={kycFormData.accountNumber}
                    onChange={(e) =>
                      setKycFormData({
                        ...kycFormData,
                        accountNumber: e.target.value,
                      })
                    }
                    placeholder="Enter bank account number"
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "10px",
                      border: `1px solid ${t.border}`,
                      backgroundColor: t.bg,
                      color: t.textMain,
                      fontWeight: 700,
                      letterSpacing: "1px",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
                <button
                  onClick={() => setShowBankUpdateModal(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "10px",
                    border: `1px solid ${t.border}`,
                    background: "none",
                    color: t.textMain,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBankUpdate}
                  disabled={postLoading}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "10px",
                    backgroundColor: "#3b82f6",
                    color: "#fff",
                    border: "none",
                    fontWeight: 700,
                    cursor: "pointer",
                    opacity: postLoading ? 0.7 : 1,
                    transition: "0.2s",
                  }}
                >
                  {postLoading ? "Saving..." : "Update Account"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Registration Details Modal */}
        {viewingBookingDetails && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1100,
            }}
          >
            <div
              style={{
                backgroundColor: t.cardBg,
                padding: "32px",
                borderRadius: "32px",
                width: "100%",
                maxWidth: "550px",
                border: `1px solid ${t.border}`,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "6px",
                  background: "linear-gradient(90deg, #ec4899, #8b5cf6)",
                }}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "24px",
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: "22px",
                      fontWeight: 900,
                      color: t.textMain,
                      margin: 0,
                      textTransform: "uppercase",
                      letterSpacing: "-0.5px",
                    }}
                  >
                    Registration Details
                  </h3>
                  <p
                    style={{
                      fontSize: "12px",
                      color: t.textSub,
                      margin: "4px 0 0",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    Order #{viewingBookingDetails.id.slice(-8).toUpperCase()}
                  </p>
                </div>
                <button
                  onClick={() => setViewingBookingDetails(null)}
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "12px",
                    background: t.bg,
                    border: `1px solid ${t.border}`,
                    color: t.textSub,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <div
                style={{
                  backgroundColor: t.bg,
                  borderRadius: "20px",
                  padding: "24px",
                  border: `1px solid ${t.border}`,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                  maxHeight: "60vh",
                  overflowY: "auto",
                }}
              >
                <div
                  style={{
                    gridColumn: "span 2",
                    paddingBottom: "12px",
                    borderBottom: `1px dashed ${t.border}`,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: "10px",
                      fontWeight: 800,
                      color: "#ec4899",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      marginBottom: "4px",
                    }}
                  >
                    Event Name
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "15px",
                      fontWeight: 800,
                      color: t.textMain,
                    }}
                  >
                    {viewingBookingDetails.event_name ||
                      viewingBookingDetails.eventName}
                  </p>
                </div>

                {Object.entries(
                  viewingBookingDetails.customer_details || {},
                ).map(([key, value]) => {
                  if (!value) return null;
                  const label =
                    key.charAt(0).toUpperCase() +
                    key.slice(1).replace(/_/g, " ");
                  return (
                    <div key={key}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "10px",
                          fontWeight: 800,
                          color: t.textSub,
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                          marginBottom: "4px",
                        }}
                      >
                        {label}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "14px",
                          fontWeight: 700,
                          color: t.textMain,
                          wordBreak: "break-word",
                        }}
                      >
                        {String(value)}
                      </p>
                    </div>
                  );
                })}

                {viewingBookingDetails.selected_seats &&
                  viewingBookingDetails.selected_seats.length > 0 && (
                    <div
                      style={{
                        gridColumn: "span 2",
                        marginTop: "12px",
                        paddingTop: "12px",
                        borderTop: `1px dashed ${t.border}`,
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: "10px",
                          fontWeight: 800,
                          color: t.textSub,
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                          marginBottom: "8px",
                        }}
                      >
                        Selected Seats
                      </p>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "8px",
                        }}
                      >
                        {viewingBookingDetails.selected_seats.map(
                          (seat, idx) => (
                            <span
                              key={idx}
                              style={{
                                padding: "4px 10px",
                                backgroundColor: "#ec489915",
                                color: "#ec4899",
                                borderRadius: "8px",
                                fontSize: "11px",
                                fontWeight: 800,
                                border: "1px solid #ec489930",
                              }}
                            >
                              {seat.id} ({seat.catName})
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  )}
              </div>

              <div style={{ marginTop: "32px" }}>
                <button
                  onClick={() => setViewingBookingDetails(null)}
                  style={{
                    width: "100%",
                    padding: "16px",
                    borderRadius: "16px",
                    backgroundColor: t.textMain,
                    color: t.cardBg,
                    border: "none",
                    fontWeight: 900,
                    fontSize: "13px",
                    textTransform: "uppercase",
                    letterSpacing: "2px",
                    cursor: "pointer",
                    transition: "0.2s shadow",
                    boxShadow: `0 10px 20px -10px ${t.textMain}60`,
                  }}
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}

        <PromoteModal
          isOpen={!!promoteEventModal}
          onClose={() => setPromoteEventModal(null)}
          title={promoteEventModal?.title || ""}
          imageUrl={
            promoteEventModal?.img || promoteEventModal?.bannerPreview || ""
          }
          date={promoteEventModal?.date || "TBA"}
          location={promoteEventModal?.venue || "Online"}
          bookingUrl={
            typeof window !== "undefined" && promoteEventModal
              ? `${window.location.origin}/events/detail?id=${promoteEventModal.id}`
              : ""
          }
          type="Event"
        />

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
        {/* Mobile Overlay */}
        {typeof sidebarOpen === "boolean" && sidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed md:sticky md:top-0 md:h-screen inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transition-transform  ${typeof sidebarOpen === "boolean" && sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 shadow-2xl shadow-slate-200/50 flex flex-col flex-shrink-0`}
        >
          <div className="h-20 flex items-center justify-center border-b border-slate-50 bg-white">
            <div
              className="flex items-center cursor-pointer"
              onClick={() => setActiveTab("dashboard")}
            >
              <img src="/logo.png" alt="BookMyTicket" className="h-14 w-auto" />
            </div>
          </div>
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.3em] mb-1">
              {isStaff ? "Staff Portal" : "Organiser Console"}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-900 uppercase tracking-[0.2em] italic">
                {profile.firstName || "Verified Partner"}
              </span>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", paddingBottom: "24px" }}>
            {!isStaff && (
              <>
                <div className="sidebar-category">Home</div>
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`sidebar-item ${activeTab === "dashboard" ? "active" : ""}`}
                  style={{ width: "calc(100% - 30px)" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <LayoutDashboard size={18} />
                    <span>Dashboard</span>
                  </div>
                </button>


                <div className="sidebar-category">Management</div>
                <button
                  onClick={() =>
                    setSidebarOpen((prev) => ({
                      ...prev,
                      eventManagement: !prev.eventManagement,
                    }))
                  }
                  className="sidebar-item"
                  style={{
                    color: [
                      "post_event",
                      "manage_events",
                      "venue_events",
                      "online_events",
                    ].includes(activeTab)
                      ? t.textMain
                      : t.textSub,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <Grid size={18} />
                    <span>Events</span>
                  </div>
                  {sidebarOpen.eventManagement ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </button>
                {sidebarOpen.eventManagement && (
                  <div style={{ marginBottom: "8px" }}>
                    <button
                      onClick={() => {
                        setEditingEvent(null);
                        setPostEvent(getInitialPostEvent());
                        setAddEventStep("select_type");
                        setActiveTab("post_event");
                      }}
                      className={`sidebar-dropdown-item ${activeTab === "post_event" ? "active" : ""}`}
                    >
                      Create Event
                    </button>
                    <button
                      onClick={() => setActiveTab("manage_events")}
                      className={`sidebar-dropdown-item ${activeTab === "manage_events" ? "active" : ""}`}
                    >
                      Manage Events
                    </button>
                    <button
                      onClick={() => setActiveTab("venue_events")}
                      className={`sidebar-dropdown-item ${activeTab === "venue_events" ? "active" : ""}`}
                    >
                      Venue Events
                    </button>
                    <button
                      onClick={() => setActiveTab("online_events")}
                      className={`sidebar-dropdown-item ${activeTab === "online_events" ? "active" : ""}`}
                    >
                      Online Events
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setActiveTab("meetings")}
                  className={`sidebar-item ${activeTab === "meetings" ? "active" : ""}`}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <Video size={18} />
                    <span>Meetings</span>
                  </div>
                </button>
              </>
            )}

            <div className="sidebar-category">Bookings</div>
            {!isStaff && (
              <>
                <button
                  onClick={() =>
                    setSidebarOpen((prev) => ({
                      ...prev,
                      eventBookings: !prev.eventBookings,
                    }))
                  }
                  className="sidebar-item"
                  style={{
                    color:
                      activeTab === "all_bookings" ||
                      activeTab === "completed_bookings"
                        ? t.textMain
                        : t.textSub,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <Users size={18} />
                    <span>Sales</span>
                  </div>
                  {sidebarOpen.eventBookings ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </button>
                {sidebarOpen.eventBookings && (
                  <div style={{ marginBottom: "8px" }}>
                    <button
                      onClick={() => setActiveTab("all_bookings")}
                      className={`sidebar-dropdown-item ${activeTab === "all_bookings" ? "active" : ""}`}
                    >
                      All Bookings
                    </button>
                    <button
                      onClick={() => setActiveTab("completed_bookings")}
                      className={`sidebar-dropdown-item ${activeTab === "completed_bookings" ? "active" : ""}`}
                    >
                      Completed
                    </button>
                    <button
                      onClick={() => setActiveTab("booking_report")}
                      className={`sidebar-dropdown-item ${activeTab === "booking_report" ? "active" : ""}`}
                    >
                      Analytics Dashboard
                    </button>
                  </div>
                )}
              </>
            )}

            {!isStaff && (
              <>
                <div className="sidebar-category">Finance</div>
                <button
                  onClick={() => setActiveTab("withdraw")}
                  className={`sidebar-item ${activeTab === "withdraw" ? "active" : ""}`}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <Wallet size={18} />
                    <span>Withdraw</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("transactions")}
                  className={`sidebar-item ${activeTab === "transactions" ? "active" : ""}`}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <ArrowLeftRight size={18} />
                    <span>Transactions</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("coupons")}
                  className={`sidebar-item ${activeTab === "coupons" ? "active" : ""}`}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <Ticket size={18} />
                    <span>Coupons</span>
                  </div>
                </button>
              </>
            )}

            <div className="sidebar-category">Tools</div>
            <button
              onClick={() => setActiveTab("pwa_scanner")}
              className={`sidebar-item ${activeTab === "pwa_scanner" ? "active" : ""}`}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <Monitor size={18} />
                <span>Pwa Scanner</span>
              </div>
            </button>

            {!isStaff && (
              <>
                <div className="sidebar-category">Support</div>
                <button
                  onClick={() => setActiveTab("support_tickets")}
                  className={`sidebar-item ${activeTab === "support_tickets" ? "active" : ""}`}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <FileText size={18} />
                    <span>Tickets</span>
                  </div>
                </button>
              </>
            )}

            {!isStaff && (
              <>
                <div className="sidebar-category">Settings</div>
                <button
                  onClick={() => setActiveTab("staff_accounts")}
                  className={`sidebar-item ${activeTab === "staff_accounts" ? "active" : ""}`}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <UserPlus size={18} />
                    <span>Staff Management</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("subscriptions")}
                  className={`sidebar-item ${activeTab === "subscriptions" ? "active" : ""}`}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <Zap size={18} />
                    <span>Subscriptions</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("edit_profile")}
                  className={`sidebar-item ${activeTab === "edit_profile" ? "active" : ""}`}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <Users size={18} />
                    <span>Profile</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("change_password")}
                  className={`sidebar-item ${activeTab === "change_password" ? "active" : ""}`}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <Lock size={18} />
                    <span>Security</span>
                  </div>
                </button>
              </>
            )}

            <div style={{ padding: "12px 12px 0" }}>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  router.push("/signin");
                  setTimeout(() => logout(), 100);
                }}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-[1rem] bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:scale-[1.02] transition-all  shadow-xl shadow-pink-500/20 group"
                style={{ marginBottom: "12px" }}
              >
                <LogOut size={14} strokeWidth={3} className="text-white" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                  Sign Out
                </span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-[#f8fafc]">
          {isStaff && (
            <div className="mobile-header">
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    backgroundColor: "#3b82f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <QrCode size={18} color="#fff" />
                </div>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: "16px",
                    color: t.textMain,
                  }}
                >
                  Staff Portal
                </span>
              </div>
              <button
                onClick={logout}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ef4444",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
          <header className="h-20 bg-white/80 backdrop-blur-2xl sticky top-0 z-40 border-b border-slate-100 flex items-center justify-between px-4 md:px-6 lg:px-10">
            <div className="flex items-center gap-4 md:gap-6">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2.5 rounded-xl bg-slate-50 text-slate-600 md:hidden hover:bg-slate-100 transition-all border border-slate-100 shadow-sm"
              >
                <Menu size={20} />
              </button>
              <div className="hidden md:flex items-center bg-slate-50 rounded-full px-4 py-2 border border-slate-100">
                <Search size={16} className="text-slate-600" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent border-none outline-none pl-2 text-[12px] font-bold text-slate-600 placeholder:text-slate-600"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 lg:gap-6">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center hover:bg-pink-50 hover:text-pink-500 transition-all border border-slate-100"
              >
                {theme === "light" ? (
                  <Clock size={20} />
                ) : (
                  <Sparkles size={20} />
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center hover:bg-pink-50 hover:text-pink-500 transition-all border border-slate-100 relative"
              >
                <Bell size={20} />
                <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-pink-500 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
              </motion.button>

              <div className="w-[1px] h-8 bg-slate-200 mx-2 hidden md:block" />

              <div className="relative" ref={dropdownRef}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-2xl hover:bg-slate-50 transition-all group"
                >
                  <div className="p-[2px] rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 shadow-md">
                    {profile.avatar ? (
                      <img
                        src={profile.avatar}
                        alt="User"
                        className="w-9 h-9 rounded-full border-2 border-white object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full border-2 border-white bg-slate-900 flex items-center justify-center text-white font-black text-xs uppercase italic">
                        {(
                          profile.firstName ||
                          profile.name ||
                          profile.email ||
                          "U"
                        ).charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="hidden lg:flex flex-col items-start mr-1">
                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">
                      {profile.firstName || "Admin"}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      {isStaff ? "Staff Account" : "Organiser"}
                    </span>
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-slate-400 transition-transform duration-300 ${profileDropdownOpen ? "rotate-180" : ""}`}
                  />
                </motion.button>

                {profileDropdownOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "120%",
                      right: 0,
                      width: "220px",
                      backgroundColor: t.cardBg,
                      borderRadius: "16px",
                      border: `1px solid ${t.border}`,
                      boxShadow:
                        "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
                      zIndex: 1000,
                      padding: "8px",
                      overflow: "hidden",
                      animation: "dropdownFade 0.2s ease-out",
                    }}
                  >
                    <div
                      style={{
                        padding: "12px",
                        borderBottom: `1px solid ${t.border}`,
                        marginBottom: "4px",
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: "14px",
                          fontWeight: 800,
                          color: t.textMain,
                        }}
                      >
                        {profile.firstName} {profile.lastName}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "12px",
                          color: t.textSub,
                          textOverflow: "ellipsis",
                          overflow: "hidden",
                        }}
                      >
                        {profile.email}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab("change_password");
                        setProfileDropdownOpen(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        border: "none",
                        background: "none",
                        color: t.textMain,
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                      className="dropdown-hover"
                    >
                      <Lock size={16} color={t.textSub} /> Change Password
                    </button>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        border: "none",
                        background: "none",
                        color: "#ef4444",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                      className="dropdown-hover-red"
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-10 relative z-0 flex flex-col">
            <div className="flex-1">{renderTabContent()}</div>
            <footer className="mt-8 pt-6 border-t border-slate-100 text-center text-[10px] font-bold uppercase tracking-widest text-slate-600">
              Copyright ©2026. All Rights Reserved.
            </footer>
          </main>

          {isStaff && (
            <div className="bottom-nav">
              <button
                className={`bottom-nav-item ${activeTab === "pwa_scanner" ? "active" : ""}`}
                onClick={() => setActiveTab("pwa_scanner")}
                style={{ width: "100%" }}
              >
                <Camera size={24} />
                <span>Scanner</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Restricted Sidebar for Stages (MFA/KYC/Pending)
  const renderRestrictedSidebar = (children) => (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background:
          "linear-gradient(135deg, #06b6d4 0%, #2563eb 40%, #1e1b4b 100%)",
        fontFamily: "'Figtree', sans-serif",
        WebkitFontSmoothing: "antialiased",
        overflow: "hidden",
        color: "#ffffff",
      }}
    >
      {styles}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img
            src="/logo.png"
            alt="BookMyTicket Logo"
            style={{ height: "45px", width: "auto", display: "block" }}
          />
        </div>

        <nav style={{ flex: 1, paddingBottom: "24px", opacity: 0.5 }}>
          <div className="sidebar-category">Home</div>
          <div className="sidebar-item">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <LayoutDashboard size={18} /> Dashboard (Locked)
            </div>
          </div>


          <div className="sidebar-category">
            {isProfessionalService ? "Portfolio" : "Events"}
          </div>
          <div className="sidebar-item">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Grid size={18} />{" "}
              {isProfessionalService ? "Service Setup" : "Management"} (Locked)
            </div>
          </div>
        </nav>

        <div style={{ padding: "12px" }}>
          <button
            onClick={(e) => {
              e.preventDefault();
              router.push("/signin");
              setTimeout(() => logout(), 100);
            }}
            className="sidebar-item"
            style={{
              color: "#ef4444",
              borderTop: `1px solid ${t.border}`,
              paddingTop: "12px",
              marginBottom: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <LogOut size={18} />
              <span>Logout</span>
            </div>
          </button>
        </div>

        <div style={{ padding: "16px", marginTop: "auto" }}>
          <div
            style={{
              padding: "16px",
              backgroundColor: theme === "light" ? "#f1f5f9" : "#1e293b",
              borderRadius: "12px",
              border: `1px solid ${t.border}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#f97316",
                }}
              ></div>
              <span
                style={{ fontSize: "11px", fontWeight: 700, color: t.textMain }}
              >
                Safety Mode
              </span>
            </div>
            <p
              style={{
                fontSize: "10px",
                color: t.textSub,
                marginTop: "4px",
                margin: 0,
              }}
            >
              Verification required
            </p>
          </div>
        </div>
      </aside>
      <main className="main-content">
        <header className="top-header">
          <div>
            <h1
              style={{
                fontSize: "20px",
                fontWeight: 800,
                color: t.textMain,
                margin: 0,
              }}
            >
              {isProfessionalService
                ? `${organiserData?.category || "Service"} Onboarding`
                : "Organiser Onboarding"}
            </h1>
          </div>
          <div
            style={{ display: "flex", alignItems: "center", gap: "12px" }}
          ></div>
        </header>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );

  // Show loading screen until mounted AND auth state is resolved
  if (!mounted || loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          color: "#475569",
        }}
      >
        Loading…
      </div>
    );
  }

  // If not logged in, redirect (useEffect handles this, show nothing in the meantime)
  if (!user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          color: "#475569",
        }}
      >
        Redirecting to sign in…
      </div>
    );
  }

  const renderModals = () => (
    <>
      {showUpgradeModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(8px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: t.bg,
              width: "100%",
              maxWidth: "900px",
              borderRadius: "24px",
              overflow: "hidden",
              border: `1px solid ${t.border}`,
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                padding: "32px",
                borderBottom: `1px solid ${t.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "28px",
                    fontWeight: 800,
                    color: t.textMain,
                    margin: 0,
                    fontStyle: "italic",
                  }}
                >
                  Upgrade Your{" "}
                  <span style={{ color: "#3b82f6" }}>Staff Package</span>
                </h2>
                <p
                  style={{
                    color: t.textSub,
                    margin: "4px 0 0",
                    fontSize: "14px",
                  }}
                >
                  Select a plan that fits your event's scale
                </p>
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: t.textSub,
                  cursor: "pointer",
                }}
              >
                <X size={24} />
              </button>
            </div>
            <div
              style={{
                padding: "32px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "20px",
              }}
            >
              {staffPackages
                .filter((p) => p.monthly_price > 0)
                .map((pkg) => (
                  <div
                    key={pkg.id}
                    style={{
                      padding: "24px",
                      borderRadius: "20px",
                      backgroundColor: t.cardBg,
                      border:
                        currentPackage.id === pkg.id
                          ? "2px solid #3b82f6"
                          : `1px solid ${t.border}`,
                      display: "flex",
                      flexDirection: "column",
                      transition: "transform 0.2s",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 800,
                        color: "#3b82f6",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        marginBottom: "8px",
                      }}
                    >
                      {pkg.package_name}
                    </div>
                    <div
                      style={{
                        fontSize: "32px",
                        fontWeight: 800,
                        color: t.textMain,
                        marginBottom: "16px",
                      }}
                    >
                      ₹{pkg.monthly_price}
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: 400,
                          color: t.textSub,
                        }}
                      >
                        /mo
                      </span>
                    </div>
                    <div style={{ flex: 1, marginBottom: "24px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "12px",
                          fontSize: "13px",
                          color: t.textMain,
                        }}
                      >
                        <CheckCircle size={16} color="#10b981" />{" "}
                        {pkg.staff_limit} Staff Accounts
                      </div>
                      {pkg.features?.offline_scan && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "12px",
                            fontSize: "13px",
                            color: t.textMain,
                          }}
                        >
                          <CheckCircle size={16} color="#10b981" /> Offline
                          Validation
                        </div>
                      )}
                      {pkg.features?.multi_gate && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "12px",
                            fontSize: "13px",
                            color: t.textMain,
                          }}
                        >
                          <CheckCircle size={16} color="#10b981" /> Multi-Gate
                          Access
                        </div>
                      )}
                      {pkg.features?.analytics && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "12px",
                            fontSize: "13px",
                            color: t.textMain,
                          }}
                        >
                          <CheckCircle size={16} color="#10b981" /> Advanced
                          Analytics
                        </div>
                      )}
                    </div>
                    <button
                      disabled={
                        currentPackage.id === pkg.id ||
                        upgradingPackage === pkg.id
                      }
                      onClick={() => handleUpgrade(pkg)}
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "12px",
                        border: "none",
                        backgroundColor:
                          currentPackage.id === pkg.id ? "#10b981" : "#3b82f6",
                        color: "#fff",
                        fontWeight: 700,
                        cursor: "pointer",
                        opacity: upgradingPackage === pkg.id ? 0.7 : 1,
                      }}
                    >
                      {currentPackage.id === pkg.id
                        ? "Current Plan"
                        : upgradingPackage === pkg.id
                          ? "Processing..."
                          : "Select Plan"}
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
      {showGstModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "8px",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                padding: "20px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                GST Declaration
              </h2>
            </div>
            <div
              style={{
                padding: "20px",
                overflowY: "auto",
                fontSize: "13px",
                color: "#475569",
                lineHeight: "1.6",
              }}
            >
              <p>
                I/We, the undersigned Organizer, hereby confirm and acknowledge
                that As per Section 24(1X) of the CGST Act, 2017, I am/We
                operate as a supplier rendering services through an e- ticketing
                platform. I/We further confirm that I/We are not registered
                under the GST Act, since our annual turnover is below the
                threshold limit of Rs. 20 Lakhs (supplier supply only services).
              </p>
              <p>
                I/We hereby affirm that any applicable taxes collected on the
                Tickets booked through{" "}
                <a
                  href="https://www.bookmyticket.io"
                  style={{ color: "#3b82f6" }}
                >
                  www.bookmyticket.io
                </a>
                , and/or its mobile application and/ or any application that is
                to be part of BookMyTicket Event Tech Pvt. Ltd, are our
                liability and shall be properly discharged by us.
              </p>
              <p>
                I/We acknowledge that the information provided above is true to
                the best of my/our knowledge, and I/We consent to be bound by
                any legal actions of the duly appointed attorney. If any of the
                information provided above is later found to be incorrect, I
                understand that my membership with your platform will be
                terminated, and any outstanding payments or unprocessed bills
                will be withheld by you based on the information provided.
              </p>
              <p>
                Additionally, I/We shall indemnify and hold harmless you and
                your officers, representatives, affiliates, successors, and
                assigns against all costs, penalties, damages, or losses, or any
                other charges, penalties, or liabilities incurred in relation to
                any claim raised pursuant to the following:
              </p>
              <ul style={{ paddingLeft: "20px", margin: "10px 0" }}>
                <li>
                  Breach, violation, or non-compliance of any of the provisions
                  contained in this declaration.
                </li>
                <li>
                  Any act of omission or commission pursuant to which any of the
                  representations given become untrue.
                </li>
                <li>Violation of any applicable law, including GST laws.</li>
                <li>Non-compliance with GST laws.</li>
                <li>
                  Any investigations, inquiries, summons, or inspections
                  conducted by any authority.
                </li>
              </ul>
              <p>
                Furthermore, I/We commit to informing you of any subsequent
                changes in the structure or operations of our business entity
                that holds membership with your platform. Any such changes
                affecting the accuracy of the answers given herein will be
                promptly communicated to you.
              </p>
            </div>
            <div
              style={{
                padding: "16px",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowGstModal(false)}
                style={{
                  padding: "8px 24px",
                  background: "#f43f5e",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showVendorModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "8px",
              maxWidth: "800px",
              width: "100%",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                padding: "20px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                USER AGREEMENT
              </h2>
            </div>
            <div
              style={{
                padding: "20px",
                overflowY: "auto",
                fontSize: "12px",
                color: "#334155",
                lineHeight: "1.6",
              }}
            >
              <h3>1. SELLER T&C</h3>
              <p>
                This agreement is made on this 8 day of March, 2026 between,
                BookMyTicket Tech Event Private Ltd, a company incorporated
                under the Indian Companies Act, 2013 having its registered
                office located at Coimbatore (hereinafter referred to as
                'BookMyTicket', which expression shall unless repugnant to the
                context or meaning thereof be deemed to include a reference to
                its successors and permitted assigns);
              </p>
              <p>
                And Raja Vasudevan, a Company incorporated under the the
                Companies Act 2013 or an individual having its registered office
                located at Pollachi PAN:DPIPR3985B/ GST: - (hereinafter referred
                to as 'Event Manager' which expression shall unless repugnant to
                the context or meaning thereof be deemed to include a reference
                to its successors and permitted assigns);
              </p>
              <p>
                BookMyTicket and Event Manager shall hereinafter be individually
                referred to as a 'Party' and collectively as the 'Parties'.
              </p>

              <h4>Recitals:</h4>
              <p>
                The Event (as defined below) is the property of Event Manager
                and Event Manager has been appointed to organize the Event.
                BookMyTicket is engaged in the business of rendering ticket
                booking services through online platform channels of
                BookMyTicket, which enable customers to reserve / book tickets
                to various entertainment events without accessing physical
                points of booking / sale of the tickets to such events.
              </p>
              <p>
                The Parties are entering into this Agreement in order to record
                the terms and conditions based on which, BookMyTicket shall
                facilitate remote booking of tickets for the Event (as defined
                below) being organized by the Event Manager and other matters in
                connection therewith.
              </p>

              <h4>1. DEFINITIONS:</h4>
              <p>
                The following capitalized words and expressions, whenever used
                in this Agreement, unless repugnant to the meaning or context
                thereof, shall have the respective meanings set forth below:
                'Confidential Information' shall include, but is not limited to
                inventions, ideas, concepts, know-how, techniques, processes,
                designs, specifications, drawings, patterns, diagrams,
                flowcharts, data, Intellectual Property Rights, manufacturing
                techniques, computer software, methods, procedures, materials,
                operations, reports, studies, and all other technical and
                business information in oral, written, electronic, digital or
                physical form that is disclosed by either Party and its
                directors, employees, advisors and consultants and vice versa
                under this Agreement and any other agreements/documents and/or
                transactions contemplated between the Parties under this
                Agreement; 'Customers' shall mean the customers who have booked
                Tickets through a Platform; 'Event' shall mean all events done
                by the organizer at the Venue; 'Event Date' shall mean all dates
                of the event; 'Intellectual Property Rights' shall mean all
                rights and interests, vested or arising out of any industrial or
                intellectual property, whether protected at common law or under
                statute, which includes (without limitation) any rights and
                interests in formats of inventions, copyrights, designs,
                trademarks, trade-names, knowhow, business names, logos,
                processes, developments, licenses, trade secrets, goodwill,
                manufacturing techniques, specifications, patterns, drawings,
                computer software, technical information, research data,
                concepts, methods, procedures, designs and any other knowledge
                of any nature whatsoever throughout the world, and including all
                applications made for the aforesaid, rights to apply in future
                and any amendments/modifications, renewals, continuations and
                extensions in any state, country or jurisdiction and all other
                intellectual property rights whether available at this time
                and/or in future; 'Losses' means all liabilities, obligations,
                losses, damages, penalties, actions, judgments, suits,
                proceedings, costs, expenses and disbursements of any kind or
                nature whatsoever (including all reasonable costs and expenses
                of attorneys and the defense, appeal and settlement of any and
                all suits, actions or proceedings instituted or threatened) and
                all costs of investigation in connection therewith; 'Ticket'
                shall mean a ticket or reservation (whether in physical or
                electronic form, as permitted under law) that allows the holder
                thereof access to the Event, on the Event date, time and venue
                identified in such ticket or reservation; Privileged and
                Confidential 'Venue' shall mean all venues at which the event
                will take place.
              </p>

              <h4>2. APPOINTMENT AND SERVICES:</h4>
              <p>
                2.1. hereby appoints BookMyTicket for providing the Services (as
                defined hereinafter). BookMyTicket hereby agrees and undertakes
                that it shall (a) facilitate the booking of Tickets through the
                Platforms (as defined hereinbelow); and It is clarified that:
              </p>
              <p>
                2.2. BookMyTicket is a service provider and the sale of Tickets
                shall at all times be concluded between the Event Manager and
                the Customer. Accordingly, the Ticket issued to Customers shall
                be on behalf of the Event Manager; and
              </p>
              <p>
                2.3. BookMyTicket is not responsible for booking or sale of
                Tickets through any medium or at any location (such as the Venue
                or other any physical points of sale) other than the following
                platforms ('Platforms'):
              </p>
              <ul style={{ paddingLeft: "20px" }}>
                <li>
                  i. websites owned or controlled by BookMyTicket (including
                  'www.bookmyticket.io') accessible through computers or WAP or
                  GPRS enabled mobile phones;
                </li>
                <li>ii. mobile applications of BookMyTicket;</li>
                <li>
                  iii. voice and data channels (including IVRs) to be
                  facilitated by BookMyTicket;
                </li>
                <li>
                  iv. any platforms owned and/or operated by third party(ies)
                  associated with BookMyTicket; and
                </li>
                <li>
                  v. any other booking medium that BookMyTicket may introduce in
                  future.
                </li>
              </ul>

              <h4>3. DUTIES OF EVENT MANAGER:</h4>
              <p>
                3.1. The Event Manager shall:
                <br />
                (a) notify BookMyTicket of all discounts, schemes and benefits
                that it intends to offer in relation to Tickets at online itself
                at event manager convenience and in case of totally taking care
                by BookMyTicket for marketing and sale such cases ;<br />
                (b) obtain all necessary approvals, permissions, licenses,
                no-objections, clearances etc. from the relevant governmental
                authorities as may be required to hold the Event in accordance
                with law and availing the Services, at its sole expense and
                cost;
                <br />
                (c) comply with all laws applicable to the Event in all
                respects;
                <br />
                (d) immediately notify BookMyTicket, if it discontinues or
                modifies any aspects of the Event (including any services /
                facilities associated with the Event) and/or Facilities;
                <br />
                (e) ensure the safety of Customers throughout the Event and
                undertake necessary measures and actions for such purpose and be
                solely responsible for any loss, damage or injury caused to
                Customers without any recourse to BookMyTicket;
                <br />
                (f) promptly notify BookMyTicket of any delay, postponement or
                cancellation of the Event or any events, facts, circumstances or
                developments that may be reasonably likely to result in any
                delay, postponement or cancellation of the Event;
                <br />
                (g) defend at its cost, any suit, claim or action brought
                against BookMyTicket in connection with the Services or the
                Event having regard to the expense and effort that the Event
                Manager would have reasonably invested as if the said suit,
                claim or action has been brought against it;
                <br />
                (h) it will provide such information as BookMyTicket reasonably
                requests and shall otherwise cooperate with BookMyTicket in
                order to give full effect to the provisions/terms of this
                Agreement;
                <br />
                (i) engage the services of a reputed security agency to provide
                external physical security at the Venue on the Event Date;
                <br />
                (j) reimburse the full cost and expense of any loss, damage or
                injury caused to property or personnel (whether owned or
                contracted) made available by BookMyTicket at the Venue, for the
                purpose of the Event.
              </p>
              <p>
                3.2. Without prejudice to any rights of BookMyTicket, Event
                Manager shall promptly notify BookMyTicket if it is unable to
                fulfill its obligations mentioned above, whether or not on
                account of reasons attributable to it.
              </p>

              <h4>4. DUTIES OF BOOKMYTICKET:</h4>
              <p>
                4.1. BookMyTicket shall render the Services in a professional
                and competent manner.
              </p>

              <h4>5. REPRESENTATIONS AND WARRANTIES:</h4>
              <p>
                Each Party represents and warrants to the other that:
                <br />
                5.1. It is duly organized, validly constituted under the laws
                applicable to it and is in good standing and that it has full
                authority and necessary approvals as required under law,
                contract and its charter documents to enter into this Agreement
                and to perform its obligations hereunder according to the terms
                hereof; and
                <br />
                5.2. That execution and delivery of this Agreement and the
                performance by it of its obligations under this Agreement have
                been duly and validly authorized by all necessary corporate or
                other action as may be required by it. This Agreement
                constitutes legal, valid, and binding obligation of such Party,
                enforceable against it in accordance with the terms hereof.
              </p>

              <h4>6. CONSIDERATION AND PAYMENT TERMS:</h4>
              <p>
                6.1. BookMyTicket will charge a fixed commission fee of 4%
                calculable on total Ticketing revenue as consideration towards
                provision of Services ('Commission Fee').
                <br />
                6.2. BookMyTicket is entitled to charge a booking fee to the
                Customers transacting on its Platforms.
                <br />
                6.3. The following terms shall be applicable to payments to be
                made under this Agreement:
                <br />
                (a) BookMyTicket shall release the amount collected by it on
                account of booking of Tickets through the Platforms to Event
                Manager on the date or within such time as mentioned in Schedule
                2 of this Agreement post deduction of its Commission Fee and/or
                Consideration.
                <br />
                (b) Upon completion of the Event, BookMyTicket shall raise an
                invoice on the Event Manager for the amount of Consideration.
              </p>

              <h4>7. CANCELLATION OF EVENT:</h4>
              <p>
                7.1. If due to any reason whatsoever (other than due a force
                majeure event) whether or not attributable to the Event Manager,
                the Event is canceled, not held at the time or venue originally
                publicized or delayed past the Event Date or if there is any
                material change to the Event that entitles customers to seek
                refunds for the Tickets booked through the Platforms,
                BookMyTicket shall charge an amount as mentioned in Schedule 2
                of this Agreement as a cancellation charge ('Cancellation
                Charge').
                <br />
                7.2. In the event any refund of the Ticket price and any other
                costs ('Refund Amount') are required to be processed by
                BookMyTicket, the Event Manager shall remit to BookMyTicket an
                amount equivalent to the Refund Amount within five (5) working
                days of being notified by BookMyTicket in this regard. In the
                event that the Event Manager fails to refund the Refund Amount
                to BookMyTicket within such five (5) working days, then without
                prejudice to its other rights, BookMyTicket shall be entitled to
                adjust the same against the Advance Amount and amounts pending
                release to the Event Manager under this Agreement, if any.
              </p>

              <h4>8. LIMITATION OF LIABILITY OF BOOKMYTICKET:</h4>
              <p>
                8.1. In no event shall BookMyTicket, nor any employee, officer,
                affiliate, director, shareholder, agent or sub- contractor
                acting on behalf of BookMyTicket be liable to any third party
                for any direct, indirect, incidental, special, punitive, or
                consequential damages, or lost profits, earnings, or business
                opportunities, or expenses or costs, even if advised of the
                possibility thereof, resulting directly or indirectly from, or
                otherwise arising (however arising, including negligence) out of
                the performance of this Agreement, including, but not limited
                to, damages resulting from or arising out of the omissions,
                interruptions, errors, defects, delays in operation,
                non-deliveries, mis-deliveries, transmissions by third parties,
                resulting in any failure of the performance of BookMyTicket.
                BookMyTicket shall have no liability whatsoever to or any third
                party in any circumstances. Event Manager shall be solely
                responsible for the accuracy of all information relating to the
                Event including validity of the Ticket prices and any other
                charges and/or other information relating to the Services. Other
                than as expressly provided in this Agreement, BookMyTicket shall
                not be responsible for any delivery, after-sales service,
                payment, invoicing or collection, Customer enquiries (not
                limited to sales enquiries), technical support maintenance
                services and/or any other obligations relating to or in respect
                of the Services unless it is directly related to the Services.
                Such services shall be the sole responsibility of the Event
                Manager and the Event Manager shall bear any and all expenses
                and/or costs relating thereto.
              </p>

              <h4>9. INTELLECTUAL PROPERTY RIGHTS:</h4>
              <p>
                9.1. Subject to Clause 9.2., each Party agrees and acknowledges
                that all the copyrights, trademarks, proprietary and/or licensed
                software, service marks and trade secrets ('Intellectual
                Property') of each Party while conducting the business
                contemplated under this Agreement shall always belong to such
                respective Party.
                <br />
                9.2. A Party shall be permitted to display the name and / or
                trademark of the other Party solely on advertisements,
                promotional material or collateral relating to the Event issued
                by or on its behalf the Party and for no other purpose. In
                respect of BookMyTicket's proprietary marks, Event Manager shall
                obtain prior written permission to use BookMyTicket's display
                the name and / or trademark and shall only utilize approved
                logos.
                <br />
                9.3. Each Party agrees that it shall not do or commit any acts
                of commission or omission, which would impair and/or adversely
                affect the other Party's rights, ownership and title in its
                Intellectual Property or the reputation / goodwill attached to
                its trademarks, trade names and corporate name.
                <br />
                9.4. Nothing stated herein shall constitute an agreement to
                transfer, assign or license or to grant any Intellectual
                Property of any Party to the other Party. Neither Party shall
                use the Intellectual Property of the other Party other than in
                accordance with Clause 9.2, without the prior written consent of
                the other Party.
              </p>

              <h4>10. TERM:</h4>
              <p>
                10.1. Unless extended mutually in writing by the Parties, this
                Agreement shall be valid for the period mentioned in Schedule II
                of this Agreement.
                <br />
                10.2. A Party may terminate this Agreement immediately by
                notice, if despite notice of breach from the non- defaulting
                Party, the defaulting Party has not cured the breach within a
                period of 10 (ten) working days of being notified of the breach
                as aforesaid.
                <br />
                10.3. Either Party may terminate this Agreement at any time by
                providing the other Party with a thirty (30) days' prior written
                notice.
                <br />
                10.4. Upon receipt of a termination notice from the Event
                Manager, BookMyTicket shall be entitled to immediately
                discontinue the display of advertisements relating to the Event
                displayed on its Platforms, if any.
                <br />
                10.5. Termination of this Agreement shall be without prejudice
                to any rights accrued by Parties prior to termination hereof.
              </p>

              <h4>11. LIABILITY:</h4>
              <p>
                Any delay or failure in the performance by BookMyTicket under
                this Agreement shall be excused and shall be without liability
                if and to the extent caused by a technical or other failure of
                any of the Platforms for reasons that are beyond the reasonable
                anticipation or control of BookMyTicket, despite BookMyTicket's
                reasonable efforts to prevent, avoid, delay or mitigate the
                effect of such occurrence.
              </p>

              <h4>12. INDEMNITY AND LIABILITY:</h4>
              <p>
                12.1. It is hereby clarified that the Platforms are only a
                medium through which the Event Manager has chosen to promote the
                Event and any dispute or claim of the customers regarding the
                organization of the Event shall be resolved directly by the
                Event Manager, with the customers, without any reference to
                BookMyTicket, except for the purpose of processing any refunds
                to customers who have made bookings using a Platform provided
                that the Event Manager shall have reimbursed to BookMyTicket the
                relevant amount to be refunded in advance.
                <br />
                12.2. In the event any suit, claim or action is brought against
                BookMyTicket in connection with the Event, such suit, claim or
                action shall be defended by the Event Manager at its cost having
                regard to the cost and effort that the Event Manager would bear
                the cost of the said suit, claim or action brought against it.
                <br />
                12.3. Each Party agrees to indemnify and hold harmless the other
                for any losses caused / suffered to such other due to any breach
                of the representations, warranties and covenants of such Party.
                No Party shall be liable for any losses of the other Party that
                are indirect or remote.
                <br />
                12.4. This Clause shall survive and continue even after the
                termination of this Agreement.
              </p>

              <h4>13. CONFIDENTIALITY:</h4>
              <p>
                13.1. In connection with this Agreement, the Parties may
                exchange proprietary / confidential information / Intellectual
                Property (the 'Confidential Information'). Each Party agrees
                that during the Term of this Agreement it will:
                <br />
                (i) only disclose Confidential Information to its employees,
                officers, directors, agents and contractors (collectively
                'Representatives') on a need to know basis, provided, the
                receiving Party ensures that such Representatives are aware of
                and comply with the obligations of confidentiality prior to such
                disclosure;
                <br />
                (ii) not disclose any Confidential Information to any person
                other than as permitted under (iii), without the prior written
                consent of the disclosing Party.
                <br />
                Provided that the aforesaid shall not be applicable and shall
                impose no obligation on a Party with respect to any portion of
                Confidential Information which was either at the time received
                or which thereafter becomes, through no act or failure on the
                part of such Party, generally known or available to the public;
                and/or has been disclosed pursuant to the requirements of any
                statute/ law or a court/ tribunal order. All customer data
                collected by BookMyTicket or in the possession of BookMyTicket
                shall be retained by BookMyTicket and Event Manager shall not
                claim any right, title, interest whatsoever over such property.
                <br />
                13.2. This Clause 13 shall survive and continue even after the
                termination of this Agreement.
              </p>

              <h4>14. Force Majeure:</h4>
              <p>
                14.1. Neither Party will be liable for failure to perform the
                obligations directly as a consequence of an unforeseeable event
                which is beyond the reasonable control of the affected Party,
                such as an act of God, natural disasters, riots, warfare, change
                in law, administrative or executive order, judicial order,
                government restrictions, lock downs, change in law and any event
                of like nature, outbreak of disease including but not limited to
                epidemic, pandemic and which essentially suspends the
                performance of the Agreement ('Force Majeure').
                <br />
                14.2. In the event a Force Majeure scenario shall continue
                unabated for a period of 30 days, the Party suffering such Force
                Majeure event hereto shall have the right to terminate this
                Agreement by furnishing written notice to the other with
                immediate effect, OR, the Parties may mutually decide to extend
                the Agreement on mutually agreed terms
              </p>

              <h4>15. TAXES:</h4>
              <p>
                15.1. Each Party shall be responsible for payment of its
                respective income tax(es) or other applicable tax(es), including
                and not restricting Goods Service Tax ('GST'), if applicable, to
                the extent based upon income derived from performance of this
                Agreement and as per the applicable tax laws. In case Party is
                under an obligation to deduct tax at source and/or any levy/tax,
                the deducting Party shall issue a requisite certificate to the
                other Party evidencing such deduction of tax.
                <br />
                15.2. As per GST regulations, BookMyTicket shall collect Tax at
                source (TCS) on the monthly value of supplies made through the
                Platforms from the date to be notified by the Government. In
                case the input tax credit including credit of TCS as mentioned,
                is not allowed to Event Manager due to its non-provision of the
                correct details to BookMyTicket or due to own non-compliance,
                BookMyTicket shall not be responsible for such non allowance to
                Event Manager. Event Manager shall be required to provide the
                relevant GST registration numbers or any other relevant
                information that may be required in this relation.
                <br />
                15.3. In case the tax authorities try to recover from
                BookMyTicket any sum including but not restricted to tax,
                interest, penalty etc. due to any non-compliance by Event
                Manager with respect to sale of Tickets through BookMyTicket,
                BookMyTicket holds right to deduct an amount equivalent to the
                demand from the payments to be made to Event Manager. In case
                there are no payments to be made by BookMyTicket, Event Manager
                shall immediately reimburse to BookMyTicket the demand amounts
                (including associated litigation cost) if any upon notification
                by BookMyTicket.
              </p>

              <h4>16. GOVERNING LAW & DISPUTE RESOLUTION:</h4>
              <p>
                16.1. The terms of this Agreement shall be construed and
                interpreted in accordance with the laws of India.
                <br />
                16.2. Any disputes arising out of or in connection with this
                Agreement, during its subsistence and after its termination in
                any manner whatsoever, including the validity of this Agreement
                shall be referred to arbitration of a sole arbitrator mutually
                appointed by the Parties hereto. The Arbitration proceedings
                shall be conducted in accordance with the provisions contained
                in the Arbitration and Conciliation Act, 1996. The place of
                Arbitration shall be Mumbai and the language of Arbitration
                shall be English. All fees and costs associated with the
                arbitral proceedings shall be borne by the Parties equally.
                <br />
                16.3. The Parties hereby agree that the courts of Mumbai shall
                have exclusive jurisdiction to enforce the arbitral award.
              </p>

              <h4>17. BINDING EFFECT:</h4>
              <p>
                17.1. Notwithstanding anything contained herein, this Agreement
                shall be legally binding on the Parties and shall be enforceable
                against them.
              </p>

              <h4>18. AMENDMENTS:</h4>
              <p>
                18.1. Subject to the terms of this Agreement, no modification of
                this Agreement shall be binding upon the Parties unless the same
                is in writing and signed by an authorized representative of each
                Party. Part performance shall not be deemed a waiver of this
                requirement.
              </p>

              <h4>19. COUNTERPARTS:</h4>
              <p>
                19.1. This Agreement may consist of more than 1 (one) copy, each
                signed by the Parties to the Agreement. If so, the signed copies
                are treated as making up the one document and the date on which
                the last counterpart is executed is the Signing Date.
              </p>

              <h4>20. SEVERABILITY:</h4>
              <p>
                20.1. If any provision or part thereof of this Agreement shall
                be held void or becomes void or unenforceable at any time, then
                the rest of the terms of this Agreement shall be given effect to
                as if such provision or part thereof does not exist in this
                Agreement. The Parties agree that such an event shall not in any
                manner affect the validity and the enforceability of the rest of
                the Agreement. No delay or omission by BookMyTicket in enforcing
                or performing any of the terms or conditions of this Agreement
                shall be construed as or constitute a waiver of obligations of
                Evet Manager under this Agreement.
              </p>

              <h4>21. ENTIRE UNDERSTANDING AND SET OFF:</h4>
              <p>
                21.1. This Agreement contains the entire arrangement, agreement
                and understanding of the Parties that relates to the subject
                matter. If any cost, loss, damage, expense, liability, claim,
                amount or obligation is incurred/fulfilled by BookMyTicket on
                behalf of the Event Manager, BookMyTicket shall have the right,
                and in addition to any other actions permitted by law, to offset
                the amount of any such cost, loss, damage, expense, liability,
                obligation or claim or monies against amounts due from Event
                Manager to BookMyTicket, including the right to offset any
                payment due from the Event Manager to BookMyTicket under this
                Agreement or any other agreement. This Agreement shall supersede
                all prior agreements executed between the Parties.
              </p>

              <h4>22. NOTICES:</h4>
              <p>
                Any notices, requests, demands or other communication required
                or permitted to be given under this Agreement shall be written
                in English and shall be delivered in any of the following modes
                of communication, these being: deliveries in person, or email
                (in PDF format) and properly addressed as follows:
              </p>
              <p>
                In the case of notices to BookMyTicket, to:
                <br />
                Attention: Santhoshkumar Premraj
                <br />
                Email: support@bookmyticket.io
                <br />
                Address: 28/78 Gothavari Street Gurusamy Nagar Vadavalli
                Bharathiyar University Coimbatore North Coimbatore TN 641046 IN
              </p>
              <p>
                In the case of notices to Event Manager, to:
                <br />
                Attention: Raja Vasudevan
                <br />
                Email: message2myemail@gmail.com
                <br />
                Exclusivity (if applicable as per Clause 2.2 of Agreement):
                YES/NO
              </p>
              <p>
                IN WITNESS WHEREOF the authorized representative of the parties
                hereto have set their respective hands on 8 day of March 2026
                first hereinabove written.
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "20px",
                }}
              >
                <div>
                  <b>For BookMyTicket</b>
                  <br />
                  Authorized Signatory
                  <br />
                  Name: ThangaPandian
                  <br />
                  Designation: Grievance Officer
                  <br />
                  Date: 08/03/2026
                </div>
                <div>
                  <b>For Raja Vasudevan</b>
                  <br />
                  Authorized Signatory
                  <br />
                  Name: Raja Vasudevan
                  <br />
                  Designation: System Admin
                  <br />
                  Date: 08/03/2026
                </div>
              </div>
            </div>
            <div
              style={{
                padding: "16px",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => {
                  setAgreedToVendor(true);
                  setShowVendorModal(false);
                }}
                style={{
                  padding: "8px 24px",
                  background: "linear-gradient(135deg, #f43f5e, #f97316)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // GUARD: If global auth or local organiser data is loading, show loading UI
  if (loading || isOrgLoading) return renderLoadingView();

  // GUARD: If unauthorized role trying to access (should be caught by useEffect, but this prevents blank screen)
  if (
    user &&
    user.role !== "organiser" &&
    user.role !== "admin" &&
    user.role !== "super_admin" &&
    user.role !== "system_admin" &&
    user.role !== "staff"
  ) {
    return renderLoadingView(); // Will redirect soon
  }

  // Professional Services should never see the Organiser KYC/Onboarding screens.
  if (isProfessionalService) return renderLoadingView(); // Wait for redirect to /vendor/dashboard

  // Main Stage Dispatcher
  switch (currentStage) {
    case "loading":
      return renderLoadingView();
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
      return (
        <>
          {renderModals()}
          {renderRestrictedSidebar(renderPendingView())}
        </>
      );
    case "approved":
      return (
        <>
          {renderModals()}
          {renderDashboardView()}
        </>
      );
    default:
      return (
        <>
          {renderModals()}
          {renderDashboardView()}
        </>
      );
  }
}

export default function OrganiserPage() {
  return (
    <OrganiserErrorBoundary>
      <OrganiserPanel />
    </OrganiserErrorBoundary>
  );
}
