"use client";
import { useState, useEffect } from "react";
import { X, ChevronRight, Shield, CheckCircle, ScrollText } from "lucide-react";
import { supabase } from "@/lib/supabase";

/* ─── Fallback sections ─── */
const FALLBACK = [
  {
    id: "s1", title: "Acceptance of Terms",
    content: "By completing this booking, you agree to be bound by BookMyTicket's Terms & Conditions and Privacy Policy.",
    bullets: ["You must be at least 18 years old.", "Accurate information must be provided at checkout.", "Tickets are non-transferable unless stated otherwise."],
    image: null,
  },
  {
    id: "s2", title: "Booking & Payment Policy",
    content: "All bookings are confirmed upon successful payment. Platform convenience fees are non-refundable.",
    bullets: ["Prices are set by Event Organisers and may vary.", "A convenience fee is charged per transaction.", "Duplicate bookings may be cancelled automatically."],
    image: null,
  },
  {
    id: "s3", title: "Refund & Cancellation",
    content: "Refund decisions rest with the Event Organiser. BookMyTicket facilitates the process but does not guarantee refunds.",
    bullets: ["Refund requests must be raised within the window set by the organiser.", "Platform fees are non-refundable.", "Refunds are credited within 7–10 business days."],
    image: null,
  },
  {
    id: "s4", title: "Disclaimer",
    content: "BookMyTicket is a ticketing platform assisting Event Organisers with registrations only. We are not responsible for event operations, postponement, cancellation, or refunds.",
    bullets: [],
    image: null,
  },
];

/**
 * TermsModal
 * Props:
 *   isOpen    {boolean}  — controls visibility
 *   onClose   {fn}       — called when modal closes
 *   onAccept  {fn}       — called when user accepts
 *   type      {string}   — "event" | "service"
 */
export default function TermsModal({ isOpen, onClose, onAccept, type = "event" }) {
  const [sections, setSections] = useState(FALLBACK);
  const [meta, setMeta] = useState({});
  const [scrolled, setScrolled] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [accepted, setAccepted] = useState(false);

  /* ── Fetch backend content ── */
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      const { data } = await supabase
        .from("system_config")
        .select("value")
        .eq("key", "terms_and_conditions")
        .maybeSingle();
      if (data?.value?.sections?.length > 0) {
        setSections(data.value.sections);
        setMeta({ lastUpdated: data.value.lastUpdated, effectiveDate: data.value.effectiveDate });
      }
    })();
  }, [isOpen]);

  /* ── Lock body scroll when open ── */
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleAccept = () => {
    setAccepted(true);
    setTimeout(() => {
      setAccepted(false);
      if (onAccept) onAccept();
      if (onClose) onClose();
    }, 900);
  };

  if (!isOpen) return null;

  const isService = type === "service";

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(15,23,42,0.7)", backdropFilter: "blur(8px)",
        padding: "16px",
      }}
      onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}
    >
      <div style={{
        background: "#fff", borderRadius: "28px",
        width: "100%", maxWidth: "780px",
        maxHeight: "90vh",
        display: "flex", flexDirection: "column",
        boxShadow: "0 40px 80px rgba(0,0,0,0.3)",
        overflow: "hidden",
        animation: "modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1)",
      }}>

        {/* ── Gradient header ── */}
        <div style={{
          background: "linear-gradient(135deg, #f844a4 0%, #9333ea 55%, #6366f1 100%)",
          padding: "24px 28px",
          position: "relative",
          flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: "16px", right: "16px",
              width: "36px", height: "36px", borderRadius: "12px",
              background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#fff", transition: "0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.3)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
          >
            <X size={18} />
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ScrollText size={24} color="#fff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
                Terms &amp; Conditions
              </h2>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontSize: "12px", fontWeight: 600 }}>
                {isService ? "Service Booking Agreement" : "Event Booking Agreement"} · {meta.lastUpdated || "2026"}
              </p>
            </div>
          </div>

          {/* Section pills */}
          <div style={{ display: "flex", gap: "8px", marginTop: "16px", overflowX: "auto", paddingBottom: "4px" }}>
            {sections.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setActiveIdx(i)}
                style={{
                  padding: "5px 14px", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.3)",
                  background: activeIdx === i ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.15)",
                  color: activeIdx === i ? "#9333ea" : "rgba(255,255,255,0.9)",
                  fontSize: "11px", fontWeight: 800, cursor: "pointer",
                  whiteSpace: "nowrap", transition: "0.2s",
                  flexShrink: 0,
                }}
              >
                {i + 1}. {s.title}
              </button>
            ))}
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div
          style={{ flex: 1, overflowY: "auto", padding: "0" }}
          onScroll={(e) => setScrolled(e.target.scrollTop > 50)}
        >
          {sections.map((s, i) => (
            <div
              key={s.id}
              id={`modal-${s.id}`}
              style={{
                padding: "24px 28px",
                borderBottom: i < sections.length - 1 ? "1px solid #f1f5f9" : "none",
                background: activeIdx === i ? "linear-gradient(135deg,#fdf2f8,#f5f3ff)" : "#fff",
                transition: "background 0.3s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "8px", flexShrink: 0,
                  background: "linear-gradient(135deg,#f844a4,#9333ea)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: "11px", fontWeight: 900,
                }}>{i + 1}</div>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>{s.title}</h3>
              </div>

              {s.image && (
                <div style={{ marginBottom: "14px", borderRadius: "12px", overflow: "hidden", maxHeight: "180px" }}>
                  <img src={s.image} alt={s.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}

              {s.content && (
                <p style={{ margin: "0 0 12px", fontSize: "13px", color: "#475569", lineHeight: 1.75, fontWeight: 500 }}>
                  {s.content}
                </p>
              )}

              {s.bullets?.length > 0 && (
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {s.bullets.map((b, bi) => (
                    <li key={bi} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                      <ChevronRight size={14} style={{ color: "#f844a4", marginTop: "3px", flexShrink: 0 }} />
                      <span style={{ fontSize: "13px", color: "#475569", lineHeight: 1.65, fontWeight: 500 }}>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* ── Footer action ── */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid #f1f5f9",
          background: "#fff",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: "12px", flexWrap: "wrap",
          flexShrink: 0,
          boxShadow: "0 -8px 20px rgba(0,0,0,0.04)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
            <Shield size={14} style={{ color: "#9333ea" }} />
            <span>BookMyTicket · Secure Platform</span>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={onClose}
              style={{
                padding: "10px 20px", borderRadius: "12px",
                border: "2px solid #e2e8f0", background: "transparent",
                color: "#64748b", fontWeight: 700, fontSize: "13px", cursor: "pointer",
                transition: "0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              disabled={accepted}
              style={{
                padding: "10px 28px", borderRadius: "12px", border: "none",
                background: accepted
                  ? "linear-gradient(135deg,#22c55e,#16a34a)"
                  : "linear-gradient(135deg,#f844a4,#9333ea)",
                color: "#fff", fontWeight: 800, fontSize: "13px", cursor: accepted ? "default" : "pointer",
                boxShadow: accepted ? "0 4px 12px rgba(34,197,94,0.3)" : "0 4px 16px rgba(248,68,164,0.35)",
                transition: "all 0.3s",
                display: "flex", alignItems: "center", gap: "8px",
              }}
            >
              {accepted ? <><CheckCircle size={16} /> Accepted!</> : "Accept Terms"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.92) translateY(24px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
