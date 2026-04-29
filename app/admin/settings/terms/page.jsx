"use client";
import { useState, useEffect } from "react";
import {
  Save, Plus, Trash2, Image, AlignLeft, List,
  Loader2, CheckCircle2, Eye, ExternalLink,
  ChevronDown, ChevronUp, FileText, Zap,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminDashboardLayout from "@/app/admin/components/AdminDashboardLayout";
import Link from "next/link";

/* ─── Predefined BookMyTicket template ─── */
const BMT_TEMPLATE = [
  {
    id: "t1", title: "🎟️ General Terms",
    content: "BookMyTicket – Powered by Nexvant Technologies. By booking a ticket through BookMyTicket, you agree to the following Terms & Conditions.",
    bullets: [
      "A valid e-ticket or QR code must be presented at the venue for entry.",
      "A valid government-issued ID proof must be carried and shown if required.",
      "Entry may be denied if proper identification or ticket is not presented.",
      "BookMyTicket acts only as a ticketing platform and does not organize or manage events.",
      "The event organizer is solely responsible for event execution, scheduling, and changes.",
    ], image: "",
  },
  {
    id: "t2", title: "🚪 Entry & Participation Rules",
    content: "Entry to the event is subject to the following rules and the organizer's discretion.",
    bullets: [
      "Entry is subject to the organizer's discretion.",
      "Late arrivals may be denied entry without refund.",
      "Individuals under the influence of alcohol or drugs may be refused entry.",
      "Security checks, including frisking, may be conducted at the venue.",
      "Venue rules must be strictly followed at all times.",
    ], image: "",
  },
  {
    id: "t3", title: "🚫 Prohibited Items",
    content: "Dangerous or restricted items are not allowed inside the venue, including but not limited to:",
    bullets: [
      "Weapons, knives, firearms.",
      "Fireworks or explosives.",
      "Helmets, laser devices.",
      "Bottles or outside food (if restricted by venue).",
      "Musical instruments (unless permitted by organizer).",
      "Such items may be confiscated, and entry may be denied.",
    ], image: "",
  },
  {
    id: "t4", title: "💰 Cancellation & Refund Policy",
    content: "All cancellation, refund, or rescheduling requests are subject to the event organizer's policies.",
    bullets: [
      "Tickets once booked are non-refundable, unless the event is cancelled by the organizer.",
      "In case of event cancellation, refunds (if applicable) will be processed as per the organizer's decision.",
      "No refunds will be provided for no-shows, late arrivals, or denied entry due to rule violations.",
      "Convenience fees and platform charges are non-refundable.",
    ], image: "",
  },
  {
    id: "t5", title: "🔄 Rescheduling Policy",
    content: "If an event is postponed or rescheduled, the following conditions apply.",
    bullets: [
      "Tickets may remain valid for the new date.",
      "Refunds (if any) will depend on the organizer's policy.",
    ], image: "",
  },
  {
    id: "t6", title: "📢 Communication Consent",
    content: "By booking a ticket, you agree to receive communications from BookMyTicket via SMS, Email, WhatsApp, and other digital channels.",
    bullets: [
      "Communications may include booking confirmations, event updates, and promotional messages.",
      "You may opt out of promotional communications at any time.",
    ], image: "",
  },
  {
    id: "t7", title: "⚖️ Disclaimer",
    content: "BookMyTicket (Nexvant Technologies) is not liable for any of the following.",
    bullets: [
      "Event cancellations, delays, or changes.",
      "Any loss, injury, or damage during the event.",
      "Theft or loss of personal belongings at the venue.",
      "The organizer, sponsors, and partners are responsible for event safety and execution.",
      "Participation in the event is at your own risk.",
    ], image: "",
  },
  {
    id: "t8", title: "🏛️ Liability & Jurisdiction",
    content: "All legal matters arising from bookings or events are governed as follows.",
    bullets: [
      "Any disputes arising from the booking or event shall be resolved directly with the event organizer.",
      "BookMyTicket shall not be held responsible for organizer-related disputes.",
      "All legal matters shall fall under the jurisdiction of courts in Tamil Nadu, India.",
    ], image: "",
  },
  {
    id: "t9", title: "📌 Additional Terms",
    content: "The following additional terms apply to all bookings made on the platform.",
    bullets: [
      "Tickets are non-transferable unless explicitly allowed by the organizer.",
      "Duplicate or tampered tickets will not be accepted.",
      "The organizer reserves the right to modify event details without prior notice.",
    ], image: "",
  },
  {
    id: "t10", title: "📩 Support & Acceptance",
    content: "For any queries or support, contact us at support@bookmyticket.com. By completing a booking, you acknowledge that you have read, understood, and agreed to all the above Terms & Conditions.",
    bullets: [], image: "",
  },
];

/* ─── Simple image-style disclaimer template ─── */
const SIMPLE_TEMPLATE = [
  {
    id: "s1", title: "Disclaimer:",
    content: "BookMyTicket is a ticketing platform assisting the Event Organiser with event registrations only. BookMyTicket is not responsible for event operations, postponement, cancellation, or refunds. All such decisions and refund processing rest solely with the Event Organiser.",
    bullets: [], image: "",
  },
  {
    id: "s2", title: "Liability Notice",
    content: "By completing this booking, you acknowledge and accept that BookMyTicket acts solely as an intermediary platform. The Event Organiser assumes full responsibility for the event, including any changes, cancellations, or issues arising on the day of the event.",
    bullets: [
      "Tickets are issued subject to the Event Organiser's terms.",
      "BookMyTicket is not liable for any loss, injury, or inconvenience at the venue.",
      "For refund or cancellation queries, contact the Event Organiser directly.",
    ], image: "",
  },
  {
    id: "s3", title: "Acceptance",
    content: "Proceeding with the booking constitutes your full acceptance of the above disclaimer and all applicable terms set by the Event Organiser.",
    bullets: [], image: "",
  },
];

const DEFAULT_SECTION = () => ({
  id: `s${Date.now()}`,
  title: "", content: "", bullets: [], image: "",
});

export default function TermsAdminPage() {
  const [sections, setSections] = useState([]);
  const [meta, setMeta] = useState({ lastUpdated: "", effectiveDate: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [showTemplate, setShowTemplate] = useState(false);
  const [templateApplied, setTemplateApplied] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("system_config").select("value")
        .eq("key", "terms_and_conditions").maybeSingle();
      if (data?.value?.sections?.length > 0) {
        setSections(data.value.sections);
        setMeta({ lastUpdated: data.value.lastUpdated || "", effectiveDate: data.value.effectiveDate || "" });
        setExpanded(data.value.sections[0]?.id || null);
      } else {
        const blank = DEFAULT_SECTION();
        setSections([blank]);
        setExpanded(blank.id);
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      lastUpdated: new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }),
      effectiveDate: meta.effectiveDate,
      sections,
    };
    const { data: existing } = await supabase.from("system_config").select("id").eq("key", "terms_and_conditions").maybeSingle();
    if (existing) {
      await supabase.from("system_config").update({ value: payload, updated_at: new Date() }).eq("key", "terms_and_conditions");
    } else {
      await supabase.from("system_config").insert([{ key: "terms_and_conditions", value: payload }]);
    }
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const applyTemplate = (tpl) => {
    const stamped = tpl.map(s => ({ ...s, id: `t${Date.now()}_${s.id}` }));
    setSections(stamped);
    setExpanded(stamped[0].id);
    setTemplateApplied(true);
    setShowTemplate(false);
    setTimeout(() => setTemplateApplied(false), 3000);
  };

  const addSection = () => { const s = DEFAULT_SECTION(); setSections(p => [...p, s]); setExpanded(s.id); };
  const removeSection = (id) => { setSections(p => p.filter(s => s.id !== id)); if (expanded === id) setExpanded(null); };
  const updateSection = (id, field, value) => setSections(p => p.map(s => s.id === id ? { ...s, [field]: value } : s));
  const addBullet = (id) => setSections(p => p.map(s => s.id === id ? { ...s, bullets: [...s.bullets, ""] } : s));
  const updateBullet = (secId, bIdx, val) => setSections(p => p.map(s => { if (s.id !== secId) return s; const b = [...s.bullets]; b[bIdx] = val; return { ...s, bullets: b }; }));
  const removeBullet = (secId, bIdx) => setSections(p => p.map(s => s.id !== secId ? s : { ...s, bullets: s.bullets.filter((_, i) => i !== bIdx) }));
  const moveSection = (idx, dir) => { const arr = [...sections]; const to = idx + dir; if (to < 0 || to >= arr.length) return; [arr[idx], arr[to]] = [arr[to], arr[idx]]; setSections(arr); };

  if (loading) return (
    <AdminDashboardLayout activeTab="terms_settings">
      <div style={{ display: "flex", justifyContent: "center", padding: "80px" }}>
        <Loader2 size={40} style={{ animation: "spin 1s linear infinite", color: "#9333ea" }} />
      </div>
    </AdminDashboardLayout>
  );

  return (
    <AdminDashboardLayout activeTab="terms_settings">
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.03em", textTransform: "uppercase", fontStyle: "italic", margin: 0 }}>
            Terms &amp; Conditions
          </h1>
          <p style={{ color: "#64748b", fontSize: "13px", fontWeight: 500, margin: "4px 0 0" }}>
            Manage content shown on the public T&amp;C page and booking modals.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Link href="/terms" target="_blank" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 18px", borderRadius: "12px", border: "2px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: "13px", fontWeight: 700, textDecoration: "none" }}>
            <Eye size={15} /> Preview <ExternalLink size={12} />
          </Link>
          <button onClick={handleSave} disabled={saving} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 22px", borderRadius: "12px", border: "none", background: saved ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#f844a4,#9333ea)", color: "#fff", fontWeight: 800, fontSize: "13px", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.8 : 1 }}>
            {saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
            {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Document Settings */}
      <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid #f1f5f9", padding: "24px", marginBottom: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <p style={{ fontSize: "10px", fontWeight: 900, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "16px" }}>Document Settings</p>
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>Effective Date</label>
          <input type="text" value={meta.effectiveDate} onChange={e => setMeta(m => ({ ...m, effectiveDate: e.target.value }))} placeholder="e.g. January 1, 2025"
            style={{ padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #e2e8f0", fontSize: "13px", fontWeight: 600, outline: "none", width: "280px", boxSizing: "border-box" }} />
        </div>
      </div>

      {/* ── Predefined Templates ── */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "linear-gradient(135deg,#f844a4,#9333ea)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FileText size={16} color="#fff" />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 900, fontSize: "15px", color: "#0f172a" }}>Predefined Templates</p>
            <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>Choose a template to load into the editor — you can edit it before saving</p>
          </div>
          {templateApplied && (
            <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: "6px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", borderRadius: "100px", padding: "5px 14px", fontSize: "12px", fontWeight: 700 }}>
              <CheckCircle2 size={13} /> Applied! Click Save to publish.
            </span>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

          {/* ── Card 1 — Full Terms & Conditions ── */}
          <div style={{ background: "#fff", borderRadius: "20px", border: "1.5px solid #e9d5ff", overflow: "hidden", boxShadow: "0 4px 20px rgba(147,51,234,0.08)" }}>
            {/* Header */}
            <div style={{ background: "linear-gradient(135deg,#7c3aed,#9333ea)", padding: "20px 22px" }}>
              <p style={{ margin: 0, fontWeight: 900, fontSize: "15px", color: "#fff" }}>📜 Full Terms &amp; Conditions</p>
              <p style={{ margin: "4px 0 0", fontSize: "11px", color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>{BMT_TEMPLATE.length} structured sections · Comprehensive legal coverage</p>
            </div>

            {/* Booking Highlights */}
            <div style={{ background: "#f5f3ff", borderBottom: "1px solid #e9d5ff", padding: "12px 22px" }}>
              <p style={{ margin: "0 0 8px", fontSize: "9px", fontWeight: 900, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.15em" }}>Best For</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {[
                  { label: "🎟️ Event Booking", bg: "#ede9fe", color: "#6d28d9", border: "#c4b5fd" },
                  { label: "🎭 Ticket Checkout", bg: "#fdf4ff", color: "#a21caf", border: "#e879f9" },
                  { label: "🎪 All Event Types", bg: "#eff6ff", color: "#1d4ed8", border: "#93c5fd" },
                  { label: "📅 Multi-slot Events", bg: "#f0fdf4", color: "#15803d", border: "#86efac" },
                  { label: "🏆 Sports Booking", bg: "#fff7ed", color: "#c2410c", border: "#fdba74" },
                ].map(b => (
                  <span key={b.label} style={{ background: b.bg, border: `1px solid ${b.border}`, color: b.color, borderRadius: "100px", padding: "4px 10px", fontSize: "10px", fontWeight: 800 }}>{b.label}</span>
                ))}
              </div>
            </div>

            {/* Section pills */}
            <div style={{ padding: "14px 22px 6px" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "14px" }}>
                {BMT_TEMPLATE.map((s, i) => (
                  <span key={s.id} style={{ background: "#f5f3ff", border: "1px solid #e9d5ff", borderRadius: "100px", padding: "3px 9px", fontSize: "10px", fontWeight: 700, color: "#7c3aed" }}>
                    {i + 1}. {s.title}
                  </span>
                ))}
              </div>
              <button
                onClick={() => applyTemplate(BMT_TEMPLATE)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "11px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#7c3aed,#9333ea)", color: "#fff", fontWeight: 800, fontSize: "13px", cursor: "pointer", marginBottom: "16px" }}
              >
                <Zap size={14} /> Use Full Template
              </button>
            </div>
          </div>

          {/* ── Card 2 — Simple Disclaimer ── */}
          <div style={{ background: "#fff", borderRadius: "20px", border: "1.5px solid #fecdd3", overflow: "hidden", boxShadow: "0 4px 20px rgba(239,68,68,0.07)" }}>
            {/* Header */}
            <div style={{ background: "linear-gradient(135deg,#dc2626,#f97316)", padding: "20px 22px" }}>
              <p style={{ margin: 0, fontWeight: 900, fontSize: "15px", color: "#fff" }}>⚠️ Simple Disclaimer</p>
              <p style={{ margin: "4px 0 0", fontSize: "11px", color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>{SIMPLE_TEMPLATE.length} sections · Concise organiser disclaimer</p>
            </div>

            {/* Booking Highlights */}
            <div style={{ background: "#fff5f5", borderBottom: "1px solid #fecdd3", padding: "12px 22px" }}>
              <p style={{ margin: "0 0 8px", fontSize: "9px", fontWeight: 900, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.15em" }}>Best For</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {[
                  { label: "🎫 Quick Booking", bg: "#fef2f2", color: "#b91c1c", border: "#fca5a5" },
                  { label: "🎤 Artist Booking", bg: "#fff7ed", color: "#c2410c", border: "#fdba74" },
                  { label: "🛎️ Service Booking", bg: "#f0fdf4", color: "#15803d", border: "#86efac" },
                  { label: "🏟️ Venue Hire", bg: "#eff6ff", color: "#1d4ed8", border: "#93c5fd" },
                  { label: "📋 Registration", bg: "#fdf4ff", color: "#a21caf", border: "#e879f9" },
                ].map(b => (
                  <span key={b.label} style={{ background: b.bg, border: `1px solid ${b.border}`, color: b.color, borderRadius: "100px", padding: "4px 10px", fontSize: "10px", fontWeight: 800 }}>{b.label}</span>
                ))}
              </div>
            </div>

            {/* Preview + button */}
            <div style={{ padding: "14px 22px 16px" }}>
              <div style={{ background: "#fff5f5", border: "2px solid #fca5a5", borderLeft: "4px solid #dc2626", borderRadius: "10px", padding: "12px 14px", marginBottom: "14px" }}>
                <p style={{ margin: "0 0 5px", fontWeight: 900, fontSize: "12px", color: "#dc2626", fontStyle: "italic" }}>Disclaimer:</p>
                <p style={{ margin: 0, fontSize: "11px", color: "#dc2626", fontStyle: "italic", fontWeight: 600, lineHeight: 1.6 }}>
                  BookMyTicket is a ticketing platform assisting the Event Organiser with event registrations only. Not responsible for event operations, postponement, cancellation, or refunds.
                </p>
              </div>
              <button
                onClick={() => applyTemplate(SIMPLE_TEMPLATE)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "11px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#dc2626,#f97316)", color: "#fff", fontWeight: 800, fontSize: "13px", cursor: "pointer" }}
              >
                <Zap size={14} /> Use Simple Template
              </button>
            </div>
          </div>

        </div>
        <p style={{ margin: "10px 0 0", fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>⚠️ Applying a template replaces all current sections. Click "Save Changes" after to publish.</p>
      </div>

      {/* ── Sections editor ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {sections.map((s, i) => (
          <div key={s.id} style={{ background: "#fff", borderRadius: "20px", border: "1.5px solid", borderColor: expanded === s.id ? "#e9d5ff" : "#f1f5f9", boxShadow: expanded === s.id ? "0 4px 20px rgba(147,51,234,0.08)" : "0 2px 8px rgba(0,0,0,0.03)", overflow: "hidden" }}>
            {/* Row header */}
            <div
              style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px", cursor: "pointer", background: expanded === s.id ? "linear-gradient(135deg,#fdf2f8,#f5f3ff)" : "#fff" }}
              onClick={() => setExpanded(expanded === s.id ? null : s.id)}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <button onClick={e => { e.stopPropagation(); moveSection(i, -1); }} disabled={i === 0} style={{ background: "none", border: "none", cursor: i === 0 ? "default" : "pointer", color: "#94a3b8", padding: 0, lineHeight: 1 }}><ChevronUp size={14} /></button>
                <button onClick={e => { e.stopPropagation(); moveSection(i, 1); }} disabled={i === sections.length - 1} style={{ background: "none", border: "none", cursor: i === sections.length - 1 ? "default" : "pointer", color: "#94a3b8", padding: 0, lineHeight: 1 }}><ChevronDown size={14} /></button>
              </div>
              <div style={{ width: "32px", height: "32px", borderRadius: "10px", flexShrink: 0, background: "linear-gradient(135deg,#f844a4,#9333ea)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "12px", fontWeight: 900 }}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 800, fontSize: "14px", color: "#0f172a" }}>{s.title || <span style={{ color: "#94a3b8", fontStyle: "italic" }}>Untitled Section</span>}</p>
                <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>{s.bullets?.length || 0} bullets · {s.content?.length || 0} chars</p>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button onClick={e => { e.stopPropagation(); removeSection(s.id); }} style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#ef4444", borderRadius: "8px", padding: "6px", cursor: "pointer", display: "flex" }}><Trash2 size={14} /></button>
                {expanded === s.id ? <ChevronUp size={18} style={{ color: "#9333ea" }} /> : <ChevronDown size={18} style={{ color: "#94a3b8" }} />}
              </div>
            </div>

            {/* Expanded editor */}
            {expanded === s.id && (
              <div style={{ padding: "0 20px 24px", display: "flex", flexDirection: "column", gap: "18px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "10px", fontWeight: 900, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "6px" }}>Section Title *</label>
                  <input type="text" value={s.title} onChange={e => updateSection(s.id, "title", e.target.value)} placeholder="e.g. General Terms"
                    style={{ width: "100%", padding: "11px 14px", borderRadius: "12px", border: "1.5px solid #e2e8f0", fontSize: "14px", fontWeight: 700, outline: "none", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = "#c084fc"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
                </div>

                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", fontWeight: 900, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "6px" }}>
                    <AlignLeft size={12} /> Body Text
                  </label>
                  <textarea value={s.content} onChange={e => updateSection(s.id, "content", e.target.value)} placeholder="Main paragraph for this section…" rows={3}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: "12px", border: "1.5px solid #e2e8f0", fontSize: "13px", lineHeight: 1.7, resize: "vertical", outline: "none", boxSizing: "border-box", fontFamily: "inherit", color: "#334155" }}
                    onFocus={e => e.target.style.borderColor = "#c084fc"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
                </div>

                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", fontWeight: 900, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "6px" }}>
                    <Image size={12} /> Image URL <span style={{ color: "#cbd5e1", fontWeight: 600, textTransform: "none" }}>(optional)</span>
                  </label>
                  <input type="url" value={s.image || ""} onChange={e => updateSection(s.id, "image", e.target.value)} placeholder="https://example.com/image.jpg"
                    style={{ width: "100%", padding: "11px 14px", borderRadius: "12px", border: "1.5px solid #e2e8f0", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = "#c084fc"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
                  {s.image && <img src={s.image} alt="preview" onError={e => e.currentTarget.style.display = "none"} style={{ marginTop: "10px", height: "100px", borderRadius: "10px", objectFit: "cover", border: "1px solid #e2e8f0" }} />}
                </div>

                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", fontWeight: 900, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "10px" }}>
                    <List size={12} /> Bullet Points
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {s.bullets.map((b, bi) => (
                      <div key={bi} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "linear-gradient(135deg,#f844a4,#9333ea)", flexShrink: 0 }} />
                        <input type="text" value={b} onChange={e => updateBullet(s.id, bi, e.target.value)} placeholder={`Bullet ${bi + 1}…`}
                          style={{ flex: 1, padding: "9px 12px", borderRadius: "10px", border: "1.5px solid #e2e8f0", fontSize: "13px", outline: "none" }}
                          onFocus={e => e.target.style.borderColor = "#c084fc"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
                        <button onClick={() => removeBullet(s.id, bi)} style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#ef4444", borderRadius: "8px", padding: "7px", cursor: "pointer", display: "flex", flexShrink: 0 }}><Trash2 size={13} /></button>
                      </div>
                    ))}
                    <button onClick={() => addBullet(s.id)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 14px", borderRadius: "10px", border: "1.5px dashed #c084fc", background: "#fdf4ff", color: "#9333ea", fontSize: "12px", fontWeight: 700, cursor: "pointer", width: "fit-content" }}>
                      <Plus size={14} /> Add Bullet Point
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        <button onClick={addSection}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", padding: "16px", borderRadius: "20px", border: "2px dashed #c084fc", background: "linear-gradient(135deg,#fdf4ff,#eff6ff)", color: "#9333ea", fontSize: "14px", fontWeight: 800, cursor: "pointer" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#f5f3ff"; e.currentTarget.style.borderColor = "#9333ea"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg,#fdf4ff,#eff6ff)"; e.currentTarget.style.borderColor = "#c084fc"; }}>
          <Plus size={20} /> Add New Section
        </button>
      </div>
    </AdminDashboardLayout>
  );
}
