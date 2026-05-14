"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  Camera, Star, Wallet, Calendar, MessageSquare, Settings,
  Package, BarChart3, ArrowUpRight, TrendingUp, CheckCircle2,
  Clock, XCircle, User, Phone, Mail, MapPin, Edit3, Plus,
  Loader2, AlertCircle, LogOut, Bell, ChevronRight, Eye,
  IndianRupee, Users, Save
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import PayoutRequestPanel from "@/components/PayoutRequestPanel";

// ─── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, bg, trend }) {
  return (
    <div style={{ background: "#fff", borderRadius: "16px", padding: "20px", border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: bg, display: "flex", alignItems: "center", justifyContent: "center", color }}>
          <Icon size={18} />
        </div>
        {trend && <span style={{ fontSize: "11px", fontWeight: 800, color: "#22c55e", background: "#f0fdf4", padding: "3px 8px", borderRadius: "50px" }}>+{trend}%</span>}
      </div>
      <p style={{ margin: 0, fontSize: "26px", fontWeight: 900, color: "#0f172a" }}>{value}</p>
      <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
    </div>
  );
}

// ─── Booking Row ────────────────────────────────────────────────────────────
const STATUS = {
  pending:    { color: "#f97316", bg: "#fff7ed", label: "Pending"    },
  confirmed:  { color: "#3b82f6", bg: "#eff6ff", label: "Confirmed"  },
  completed:  { color: "#22c55e", bg: "#f0fdf4", label: "Completed"  },
  cancelled:  { color: "#ef4444", bg: "#fef2f2", label: "Cancelled"  },
  in_progress:{ color: "#a855f7", bg: "#faf5ff", label: "In Progress"},
};

function BookingRow({ booking, onAction, onViewChat }) {
  const cfg = STATUS[booking.status] || STATUS.pending;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #f8fafc", flexWrap: "wrap", gap: "12px", background: booking.conflict_flag ? "#fff1f2" : "transparent" }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: "14px", color: "#0f172a" }}>{booking.event_name || "Service Booking"}</p>
          {booking.conflict_flag && (
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: 900, color: "#ef4444", background: "#fee2e2", padding: "2px 6px", borderRadius: "4px" }}>
              <AlertCircle size={10} /> CONFLICT
            </span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
          {booking.event_date} · {booking.customer_name || "Customer"} · ₹{booking.total_amount?.toLocaleString("en-IN")}
        </p>
      </div>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <button onClick={() => onViewChat(booking)} style={{ padding: "8px", background: "#f1f5f9", border: "none", borderRadius: "8px", cursor: "pointer", color: "#64748b" }}>
          <MessageSquare size={16} />
        </button>
        <span style={{ padding: "4px 10px", background: cfg.bg, color: cfg.color, borderRadius: "50px", fontSize: "11px", fontWeight: 900, textTransform: "uppercase" }}>{cfg.label}</span>
        {booking.status === "pending" && (
          <div style={{ display: "flex", gap: "6px" }}>
            <button onClick={() => onAction(booking.id, "confirmed")} style={{ padding: "6px 12px", background: "#22c55e", color: "#fff", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Accept</button>
            <button onClick={() => onAction(booking.id, "cancelled")} style={{ padding: "6px 12px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Decline</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────
export default function ProviderDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState("overview");
  const [provider, setProvider] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [saving, setSaving] = useState(false);
  
  // Service Modal State
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceForm, setServiceForm] = useState({});
  const [categories, setCategories] = useState([]);
  
  // Availability State
  const [availability, setAvailability] = useState([]);

  // Chat/Details State
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const fetchAll = async () => {
    if (!user?.id) return;
    setLoading(true);

    // Provider profile
    const { data: prov } = await supabase
      .from("service_providers")
      .select("*")
      .eq("organiser_id", user.id)
      .maybeSingle();

    if (!prov) { router.push("/partner"); return; }
    setProvider(prov);
    setProfileForm(prov);

    // Bookings
    const { data: bks } = await supabase
      .from("service_bookings")
      .select("*, provider_services(title)")
      .eq("provider_id", prov.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setBookings(bks || []);

    // Services
    const { data: svcs } = await supabase
      .from("provider_services")
      .select("*, service_categories(name)")
      .eq("provider_id", prov.id)
      .order("created_at", { ascending: false });
    setServices(svcs || []);

    // Categories
    const { data: cats } = await supabase.from("service_categories").select("*").eq("is_active", true);
    setCategories(cats || []);

    // Availability
    const { data: avail } = await supabase.from("provider_availability").select("*").eq("provider_id", prov.id);
    setAvailability(avail || []);

    // Wallet
    const { data: w } = await supabase
      .from("provider_wallets")
      .select("*")
      .eq("provider_id", prov.id)
      .maybeSingle();
    setWallet(w);

    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [user?.id]);

  const stats = useMemo(() => ({
    total: bookings.length,
    pending: bookings.filter(b => b.status === "pending").length,
    completed: bookings.filter(b => b.status === "completed").length,
    revenue: bookings.filter(b => b.status === "completed").reduce((s, b) => s + (b.total_amount || 0), 0),
  }), [bookings]);

  const handleBookingAction = async (id, status) => {
    await supabase.from("service_bookings").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  const openChat = async (booking) => {
    setSelectedBooking(booking);
    setShowChat(true);
    
    // Fetch or create thread
    const { data: thread } = await supabase
      .from("chat_threads")
      .select("*")
      .eq("booking_id", booking.id)
      .maybeSingle();

    let threadId = thread?.id;
    if (!thread) {
      const { data: newThread } = await supabase
        .from("chat_threads")
        .insert({
          booking_id: booking.id,
          customer_id: booking.customer_id,
          provider_id: provider.id,
        })
        .select()
        .single();
      threadId = newThread?.id;
    }

    // Subscribe to messages
    const { data: msgs } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });
    setMessages(msgs || []);

    const channel = supabase
      .channel(`chat:${threadId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `thread_id=eq.${threadId}` }, payload => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedBooking) return;

    const { data: thread } = await supabase.from("chat_threads").select("id").eq("booking_id", selectedBooking.id).single();
    if (!thread) return;

    await supabase.from("chat_messages").insert({
      thread_id: thread.id,
      sender_id: user.id,
      message_text: newMessage,
    });
    setNewMessage("");
  };

  const saveProfile = async () => {
    setSaving(true);
    await supabase.from("service_providers").update({
      business_name: profileForm.business_name,
      description: profileForm.description,
      phone: profileForm.phone,
      city: profileForm.city,
      state: profileForm.state,
      website: profileForm.website,
      updated_at: new Date().toISOString(),
    }).eq("id", provider.id);
    setProvider(prev => ({ ...prev, ...profileForm }));
    setEditProfile(false);
    setSaving(false);
  };

  const saveService = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...serviceForm, provider_id: provider.id, updated_at: new Date().toISOString() };
    if (serviceForm.id) {
      await supabase.from("provider_services").update(payload).eq("id", serviceForm.id);
      setServices(prev => prev.map(s => s.id === serviceForm.id ? { ...s, ...payload } : s));
    } else {
      const { data } = await supabase.from("provider_services").insert(payload).select().single();
      if (data) setServices([data, ...services]);
    }
    setShowServiceModal(false);
    setSaving(false);
  };

  const toggleAvailability = async (dateStr) => {
    const existing = availability.find(a => a.date === dateStr);
    if (existing) {
      const { data } = await supabase.from("provider_availability").update({ is_available: !existing.is_available }).eq("id", existing.id).select().single();
      setAvailability(prev => prev.map(a => a.id === existing.id ? data : a));
    } else {
      const { data } = await supabase.from("provider_availability").insert({ provider_id: provider.id, date: dateStr, is_available: false }).select().single();
      setAvailability([...availability, data]);
    }
  };

  const NAV = [
    { id: "overview",    label: "Overview",     icon: BarChart3  },
    { id: "bookings",    label: "Bookings",     icon: Calendar   },
    { id: "services",    label: "Services",     icon: Package    },
    { id: "availability",label: "Availability", icon: Clock      },
    { id: "wallet",      label: "Wallet",       icon: Wallet     },
    { id: "profile",     label: "Profile",      icon: User       },
  ];

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
      <Loader2 size={32} className="animate-spin" style={{ color: "#f84464" }} />
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex" }}>

      {/* Sidebar */}
      <aside style={{ width: "240px", background: "#fff", borderRight: "1px solid #f1f5f9", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100, padding: "24px 0" }}>
        <div style={{ padding: "0 20px 24px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "linear-gradient(135deg, #f84464, #c026d3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: "20px", marginBottom: "12px" }}>
            {(provider?.business_name || "P")[0].toUpperCase()}
          </div>
          <p style={{ margin: 0, fontWeight: 900, fontSize: "14px", color: "#0f172a" }}>{provider?.business_name || "My Business"}</p>
          <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>{provider?.category || "Service Provider"}</p>
          <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: provider?.status === "approved" ? "#22c55e" : "#f97316" }} />
            <span style={{ fontSize: "11px", fontWeight: 700, color: provider?.status === "approved" ? "#22c55e" : "#f97316", textTransform: "capitalize" }}>
              {provider?.status || "pending"}
            </span>
          </div>
        </div>

        <nav style={{ padding: "12px 12px", flex: 1 }}>
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} style={{
              width: "100%", padding: "10px 14px", background: tab === id ? "linear-gradient(135deg, #fdf2f8, #f5f3ff)" : "transparent",
              border: "none", borderRadius: "10px", display: "flex", alignItems: "center", gap: "10px",
              cursor: "pointer", color: tab === id ? "#c026d3" : "#64748b", fontWeight: tab === id ? 800 : 600,
              fontSize: "14px", marginBottom: "4px", textAlign: "left", transition: "all 0.2s",
            }}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>

        <div style={{ padding: "12px 12px", borderTop: "1px solid #f1f5f9" }}>
          <button onClick={logout} style={{ width: "100%", padding: "10px 14px", background: "transparent", border: "none", borderRadius: "10px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", color: "#ef4444", fontWeight: 600, fontSize: "14px" }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: "240px", flex: 1, padding: "32px", minWidth: 0 }}>

        {/* ── OVERVIEW ────────────────────────────────────── */}
        {tab === "overview" && (
          <>
            <h1 style={{ margin: "0 0 6px", fontWeight: 900, fontSize: "28px", color: "#0f172a" }}>Welcome back 👋</h1>
            <p style={{ margin: "0 0 28px", color: "#94a3b8", fontWeight: 600 }}>Here's what's happening with your business today.</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "32px" }}>
              <StatCard label="Total Bookings" value={stats.total} icon={Calendar} color="#3b82f6" bg="#eff6ff" />
              <StatCard label="Pending"        value={stats.pending} icon={Clock} color="#f97316" bg="#fff7ed" />
              <StatCard label="Completed"      value={stats.completed} icon={CheckCircle2} color="#22c55e" bg="#f0fdf4" />
              <StatCard label="Revenue Earned" value={`₹${stats.revenue.toLocaleString("en-IN")}`} icon={IndianRupee} color="#a855f7" bg="#faf5ff" />
            </div>

            {/* Recent Bookings */}
            <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", overflow: "hidden" }}>
              <div style={{ padding: "18px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontWeight: 900, fontSize: "16px", color: "#0f172a" }}>Recent Bookings</h3>
                <button onClick={() => setTab("bookings")} style={{ background: "none", border: "none", color: "#f84464", fontWeight: 800, fontSize: "12px", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em" }}>View All</button>
              </div>
              {bookings.slice(0, 5).map(b => <BookingRow key={b.id} booking={b} onAction={handleBookingAction} onViewChat={openChat} />)}
              {bookings.length === 0 && (
                <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                  <Calendar size={32} style={{ marginBottom: "8px", opacity: 0.4 }} />
                  <p style={{ margin: 0, fontWeight: 700 }}>No bookings yet</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── BOOKINGS ────────────────────────────────────── */}
        {tab === "bookings" && (
          <>
            <h2 style={{ margin: "0 0 24px", fontWeight: 900, fontSize: "24px", color: "#0f172a" }}>All Bookings</h2>
            <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", overflow: "hidden" }}>
              {bookings.length === 0 ? (
                <div style={{ padding: "60px", textAlign: "center", color: "#94a3b8" }}>
                  <Calendar size={40} style={{ marginBottom: "12px", opacity: 0.3 }} />
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "16px" }}>No bookings yet</p>
                  <p style={{ margin: "4px 0 0", fontSize: "13px" }}>Share your profile to start receiving bookings</p>
                </div>
              ) : bookings.map(b => <BookingRow key={b.id} booking={b} onAction={handleBookingAction} onViewChat={openChat} />)}
            </div>
          </>
        )}

        {/* ── SERVICES ────────────────────────────────────── */}
        {tab === "services" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ margin: 0, fontWeight: 900, fontSize: "24px", color: "#0f172a" }}>My Services</h2>
              <button onClick={() => { setServiceForm({ title: "", description: "", base_price: "", price_unit: "per_event", is_active: true }); setShowServiceModal(true); }} style={{ padding: "10px 20px", background: "linear-gradient(135deg, #f84464, #c026d3)", color: "#fff", border: "none", borderRadius: "12px", fontWeight: 800, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                <Plus size={16} /> Add Service
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
              {services.map(svc => (
                <div key={svc.id} style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                  <div style={{ padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                      <h4 style={{ margin: 0, fontWeight: 800, fontSize: "15px", color: "#0f172a" }}>{svc.title}</h4>
                      <span style={{ padding: "3px 10px", background: svc.is_active ? "#f0fdf4" : "#f8fafc", color: svc.is_active ? "#22c55e" : "#94a3b8", borderRadius: "50px", fontSize: "10px", fontWeight: 900 }}>
                        {svc.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p style={{ margin: "0 0 12px", fontSize: "13px", color: "#64748b", lineHeight: 1.5 }}>{svc.description?.slice(0, 80) || "No description"}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <p style={{ margin: 0, fontWeight: 900, fontSize: "16px", color: "#f84464" }}>₹{svc.base_price?.toLocaleString("en-IN")}<span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>/{svc.price_unit?.replace("_", " ")}</span></p>
                      <button onClick={() => { setServiceForm(svc); setShowServiceModal(true); }} style={{ padding: "6px 14px", background: "#f8fafc", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: 700, color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Edit3 size={12} /> Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {services.length === 0 && (
                <div style={{ gridColumn: "1/-1", padding: "60px", textAlign: "center", border: "1px dashed #e2e8f0", borderRadius: "16px", color: "#94a3b8" }}>
                  <Package size={40} style={{ marginBottom: "12px", opacity: 0.3 }} />
                  <p style={{ margin: "0 0 8px", fontWeight: 700 }}>No services added yet</p>
                  <button onClick={() => { setServiceForm({ title: "", description: "", base_price: "", price_unit: "per_event", is_active: true }); setShowServiceModal(true); }} style={{ padding: "10px 20px", background: "linear-gradient(135deg, #f84464, #c026d3)", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 800, cursor: "pointer" }}>Add Your First Service</button>
                </div>
              )}
            </div>
          </>
        )}
        {/* ── AVAILABILITY ──────────────────────────────────── */}
        {tab === "availability" && (
          <>
            <h2 style={{ margin: "0 0 6px", fontWeight: 900, fontSize: "24px", color: "#0f172a" }}>Availability Calendar</h2>
            <p style={{ margin: "0 0 24px", color: "#64748b", fontSize: "14px" }}>Select dates you are <strong>UNAVAILABLE</strong> to block bookings.</p>
            
            <div style={{ background: "#fff", padding: "24px", borderRadius: "20px", border: "1px solid #f1f5f9" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px", maxWidth: "600px" }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} style={{ textAlign: "center", fontSize: "12px", fontWeight: 800, color: "#94a3b8", paddingBottom: "10px" }}>{d}</div>
                ))}
                
                {/* Simple 30-day view from today */}
                {Array.from({ length: 30 }).map((_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() + i);
                  const dateStr = d.toISOString().split("T")[0];
                  const isBlocked = availability.find(a => a.date === dateStr)?.is_available === false;
                  
                  // Offset the first day
                  const styleOffset = i === 0 ? { gridColumnStart: d.getDay() + 1 } : {};
                  
                  return (
                    <button key={dateStr} onClick={() => toggleAvailability(dateStr)} style={{
                      ...styleOffset,
                      aspectRatio: "1", padding: "10px", borderRadius: "12px", fontWeight: 700, fontSize: "14px", cursor: "pointer", transition: "all 0.2s",
                      border: isBlocked ? "2px solid #ef4444" : "1px solid #f1f5f9",
                      background: isBlocked ? "#fef2f2" : "#fff",
                      color: isBlocked ? "#ef4444" : "#0f172a",
                    }}>
                      {d.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
        {/* ── WALLET ──────────────────────────────────────── */}
        {tab === "wallet" && (
          <>
            <h2 style={{ margin: "0 0 24px", fontWeight: 900, fontSize: "24px", color: "#0f172a" }}>Earnings & Payouts</h2>
            <PayoutRequestPanel requesterType="provider" />
          </>
        )}

        {/* ── PROFILE ─────────────────────────────────────── */}
        {tab === "profile" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ margin: 0, fontWeight: 900, fontSize: "24px", color: "#0f172a" }}>Business Profile</h2>
              {!editProfile ? (
                <button onClick={() => setEditProfile(true)} style={{ padding: "10px 20px", background: "#f1f5f9", border: "none", borderRadius: "12px", fontWeight: 700, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", color: "#64748b" }}>
                  <Edit3 size={14} /> Edit Profile
                </button>
              ) : (
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={saveProfile} disabled={saving} style={{ padding: "10px 20px", background: "linear-gradient(135deg, #f84464, #c026d3)", color: "#fff", border: "none", borderRadius: "12px", fontWeight: 800, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Save
                  </button>
                  <button onClick={() => { setEditProfile(false); setProfileForm(provider); }} style={{ padding: "10px 16px", background: "#f1f5f9", border: "none", borderRadius: "12px", fontWeight: 700, cursor: "pointer", color: "#64748b" }}>Cancel</button>
                </div>
              )}
            </div>

            <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid #f1f5f9", padding: "32px", maxWidth: "640px" }}>
              {[
                { label: "Business Name", key: "business_name", icon: User },
                { label: "Phone",         key: "phone",          icon: Phone },
                { label: "City",          key: "city",           icon: MapPin },
                { label: "State",         key: "state",          icon: MapPin },
                { label: "Website",       key: "website",        icon: ArrowUpRight },
              ].map(({ label, key, icon: Icon }) => (
                <div key={key} style={{ marginBottom: "20px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 900, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
                    <Icon size={12} /> {label}
                  </label>
                  {editProfile ? (
                    <input value={profileForm[key] || ""} onChange={e => setProfileForm(f => ({ ...f, [key]: e.target.value }))}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "14px", fontWeight: 600, outline: "none", boxSizing: "border-box" }} />
                  ) : (
                    <p style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: provider?.[key] ? "#0f172a" : "#cbd5e1" }}>{provider?.[key] || "Not set"}</p>
                  )}
                </div>
              ))}

              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "11px", fontWeight: 900, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px", display: "block" }}>About / Description</label>
                {editProfile ? (
                  <textarea value={profileForm.description || ""} onChange={e => setProfileForm(f => ({ ...f, description: e.target.value }))} rows={4}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "14px", fontWeight: 500, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
                ) : (
                  <p style={{ margin: 0, fontSize: "14px", color: "#64748b", lineHeight: 1.6 }}>{provider?.description || "No description added"}</p>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Chat Modal */}
      {showChat && selectedBooking && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#fff", borderRadius: "24px", width: "90%", maxWidth: "500px", height: "80vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}>
            <div style={{ padding: "20px 24px", background: "#fff", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 900 }}>Chat with {selectedBooking.customer_name || "Customer"}</h3>
                <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>Booking: {selectedBooking.event_name}</p>
              </div>
              <button onClick={() => setShowChat(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8" }}><XCircle size={24} /></button>
            </div>

            <div style={{ flex: 1, padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", background: "#f8fafc" }}>
              {messages.map(m => (
                <div key={m.id} style={{
                  alignSelf: m.sender_id === user.id ? "flex-end" : "flex-start",
                  background: m.sender_id === user.id ? "linear-gradient(135deg, #f84464, #c026d3)" : "#fff",
                  color: m.sender_id === user.id ? "#fff" : "#0f172a",
                  padding: "10px 16px", borderRadius: "16px", borderTopRightRadius: m.sender_id === user.id ? "4px" : "16px", borderTopLeftRadius: m.sender_id === user.id ? "16px" : "4px",
                  maxWidth: "80%", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", fontSize: "14px", fontWeight: 500
                }}>
                  {m.message_text}
                </div>
              ))}
            </div>

            <form onSubmit={sendMessage} style={{ padding: "20px", background: "#fff", borderTop: "1px solid #f1f5f9", display: "flex", gap: "12px" }}>
              <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." style={{ flex: 1, padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", outline: "none", fontWeight: 600 }} />
              <button type="submit" style={{ padding: "12px 20px", background: "linear-gradient(135deg, #f84464, #c026d3)", color: "#fff", border: "none", borderRadius: "12px", fontWeight: 900, cursor: "pointer" }}>Send</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
