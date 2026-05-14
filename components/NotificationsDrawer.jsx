"use client";
import React, { useState, useEffect, useRef } from "react";
import { Bell, X, CheckCheck, Info, Ticket, CreditCard, Zap, Tag, Calendar, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthContext";
import Link from "next/link";

const TYPE_CONFIG = {
  booking:  { icon: Ticket,    bg: "#fdf2f8", color: "#c026d3", label: "Booking" },
  payment:  { icon: CreditCard, bg: "#eff6ff", color: "#3b82f6", label: "Payment" },
  alert:    { icon: Zap,       bg: "#fff7ed", color: "#f97316", label: "Alert"   },
  promo:    { icon: Tag,       bg: "#f0fdf4", color: "#22c55e", label: "Promo"   },
  event:    { icon: Calendar,  bg: "#faf5ff", color: "#a855f7", label: "Event"   },
  info:     { icon: Info,      bg: "#f8fafc", color: "#64748b", label: "Info"    },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationsDrawer() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const drawerRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const fetchNotifications = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setNotifications(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!user?.id) return;
    fetchNotifications();

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user?.id]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const markRead = async (id) => {
    await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    if (!user?.id) return;
    await supabase.from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("is_read", false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  if (!user) return null;

  return (
    <div style={{ position: "relative" }} ref={drawerRef}>
      {/* Bell Button */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifications(); }}
        style={{
          position: "relative",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "8px",
          borderRadius: "10px",
          color: "#64748b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s",
        }}
        aria-label="Notifications"
      >
        <Bell size={20} strokeWidth={2} />
        {unreadCount > 0 && (
          <span style={{
            position: "absolute",
            top: "4px",
            right: "4px",
            width: "18px",
            height: "18px",
            background: "linear-gradient(135deg, #f84464, #c026d3)",
            borderRadius: "50%",
            fontSize: "10px",
            fontWeight: 900,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid #fff",
            lineHeight: 1,
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Drawer */}
      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 12px)",
          right: 0,
          width: "380px",
          maxHeight: "520px",
          background: "#fff",
          borderRadius: "20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 20px 60px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.06)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "slideDown 0.2s ease-out",
        }}>
          <style>{`
            @keyframes slideDown {
              from { opacity: 0; transform: translateY(-8px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* Header */}
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 900, color: "#0f172a" }}>
                Notifications
              </h3>
              {unreadCount > 0 && (
                <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>
                  {unreadCount} unread
                </p>
              )}
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: "11px", fontWeight: 800, color: "#f84464",
                    display: "flex", alignItems: "center", gap: "4px",
                    padding: "4px 8px", borderRadius: "6px",
                    textTransform: "uppercase", letterSpacing: "0.05em",
                  }}
                >
                  <CheckCheck size={14} /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "#94a3b8" }}>
                <X size={16} />
              </button>
            </div>
          </div>

          {/* List */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {loading ? (
              <div style={{ padding: "40px", textAlign: "center" }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{ display: "flex", gap: "12px", padding: "14px 20px", alignItems: "flex-start" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#f1f5f9", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: "12px", background: "#f1f5f9", borderRadius: "6px", marginBottom: "8px", width: "70%" }} />
                      <div style={{ height: "10px", background: "#f1f5f9", borderRadius: "6px", width: "90%" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: "60px 24px", textAlign: "center" }}>
                <Bell size={40} style={{ color: "#e2e8f0", marginBottom: "12px" }} />
                <p style={{ fontSize: "14px", fontWeight: 700, color: "#94a3b8", margin: 0 }}>No notifications yet</p>
                <p style={{ fontSize: "12px", color: "#cbd5e1", margin: "4px 0 0" }}>We'll notify you about bookings and events</p>
              </div>
            ) : (
              notifications.map(n => {
                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
                const Icon = cfg.icon;
                return (
                  <div
                    key={n.id}
                    onClick={() => { markRead(n.id); if (n.action_url) window.location.href = n.action_url; }}
                    style={{
                      display: "flex",
                      gap: "12px",
                      padding: "14px 20px",
                      alignItems: "flex-start",
                      cursor: n.action_url ? "pointer" : "default",
                      background: n.is_read ? "#fff" : `${cfg.bg}`,
                      borderBottom: "1px solid #f8fafc",
                      transition: "background 0.2s",
                      position: "relative",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                    onMouseLeave={e => e.currentTarget.style.background = n.is_read ? "#fff" : cfg.bg}
                  >
                    {!n.is_read && (
                      <div style={{
                        position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)",
                        width: "6px", height: "6px", borderRadius: "50%",
                        background: "linear-gradient(135deg, #f84464, #c026d3)",
                      }} />
                    )}
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "10px",
                      background: cfg.bg, border: `1px solid ${cfg.color}20`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, color: cfg.color,
                    }}>
                      <Icon size={16} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: n.is_read ? 600 : 800, color: "#0f172a", lineHeight: 1.4 }}>
                        {n.title}
                      </p>
                      <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#64748b", lineHeight: 1.5, fontWeight: 500 }}>
                        {n.body}
                      </p>
                      <p style={{ margin: "4px 0 0", fontSize: "10px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {timeAgo(n.created_at)}
                      </p>
                    </div>
                    {n.action_url && <ChevronRight size={14} style={{ color: "#cbd5e1", flexShrink: 0, marginTop: "10px" }} />}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{ padding: "12px 20px", borderTop: "1px solid #f1f5f9", textAlign: "center" }}>
              <Link href="/profile?tab=notifications" style={{ fontSize: "12px", fontWeight: 800, color: "#f84464", textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                View All Notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
