"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { CheckCircle, ChevronRight, ArrowLeft, Shield, Clock, FileText } from "lucide-react";

/* ─── Default content (shown if no backend data) ─── */
const DEFAULT_SECTIONS = [
  {
    id: "s1",
    title: "Acceptance of Terms",
    content:
      "By accessing and using BookMyTicket, you agree to be bound by these Terms & Conditions and our Privacy Policy. If you do not agree with any part of these terms, please discontinue use of our platform immediately.",
    bullets: [
      "You must be at least 18 years of age to use this service.",
      "You agree to provide accurate and complete information during registration.",
      "You are responsible for maintaining the confidentiality of your account credentials.",
      "You agree to follow all local laws and venue regulations when attending events.",
    ],
    image: null,
  },
  {
    id: "s2",
    title: "Booking & Ticketing Policy",
    content:
      "All bookings made through BookMyTicket are subject to availability. Ticket prices are set by Event Organisers and may vary. A platform convenience fee is applied to each transaction.",
    bullets: [
      "Tickets are non-transferable unless explicitly permitted by the Event Organiser.",
      "BookMyTicket acts solely as a ticketing platform and is not responsible for event operations.",
      "All bookings are confirmed only upon successful payment verification.",
      "Duplicate bookings may be cancelled without prior notice.",
    ],
    image: null,
  },
  {
    id: "s3",
    title: "Refund & Cancellation Policy",
    content:
      "Refund and cancellation decisions rest entirely with the Event Organiser. BookMyTicket facilitates the process but does not guarantee refunds in all circumstances.",
    bullets: [
      "Refund requests must be submitted within the window defined by the Event Organiser.",
      "Platform convenience fees are non-refundable.",
      "Refunds will be credited to the original payment method within 7–10 business days.",
      "Events cancelled by organisers will trigger automatic refund processing.",
    ],
    image: null,
  },
  {
    id: "s4",
    title: "User Responsibilities",
    content:
      "You are solely responsible for your conduct on the platform and at events you attend through BookMyTicket.",
    bullets: [
      "Do not share login credentials with third parties.",
      "Provide accurate billing and contact information at all times.",
      "Comply with venue rules and local laws when attending events.",
      "Report any fraudulent activity to our support team immediately.",
    ],
    image: null,
  },
  {
    id: "s5",
    title: "Intellectual Property",
    content:
      "All content on BookMyTicket — including logos, graphics, event listings, and software — is the intellectual property of BookMyTicket or its licensors.",
    bullets: [
      "You may not reproduce or distribute platform content without written consent.",
      "Event banners and images remain the property of the respective Event Organisers.",
      "BookMyTicket's trademarks may not be used without explicit permission.",
    ],
    image: null,
  },
  {
    id: "s6",
    title: "Disclaimer of Liability",
    content:
      "BookMyTicket is a ticketing platform assisting Event Organisers with registrations only. BookMyTicket is not responsible for event operations, postponement, cancellation, or refunds. All such decisions rest solely with the Event Organiser.",
    bullets: [
      "We do not guarantee the accuracy of event information provided by organisers.",
      "BookMyTicket shall not be liable for indirect or consequential losses.",
      "Maximum liability is limited to the amount paid for the relevant booking.",
    ],
    image: null,
  },
  {
    id: "s7",
    title: "Privacy & Data Protection",
    content:
      "We are committed to protecting your personal data. All information collected is handled in accordance with applicable data protection laws.",
    bullets: [
      "We collect only the data necessary to process your bookings.",
      "Your data is never sold to third parties.",
      "You may request data deletion at any time by contacting support.",
    ],
    image: null,
  },
  {
    id: "s8",
    title: "Governing Law",
    content:
      "These Terms & Conditions are governed by the laws of India. Any disputes arising shall be subject to the exclusive jurisdiction of courts in Tamil Nadu, India.",
    bullets: [],
    image: null,
  },
];

/* ─── Metadata strip ─── */
function MetaStrip({ lastUpdated, effectiveDate }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center", marginTop: "20px" }}>
      {[
        { icon: <Clock size={14} />, label: "Last Updated", value: lastUpdated || "April 29, 2026" },
        { icon: <Shield size={14} />, label: "Jurisdiction", value: "India (Tamil Nadu)" },
        { icon: <FileText size={14} />, label: "Effective Date", value: effectiveDate || "January 1, 2025" },
      ].map((m, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: "8px",
          background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.25)", borderRadius: "100px",
          padding: "6px 16px", color: "#fff", fontSize: "12px", fontWeight: 600,
        }}>
          {m.icon}
          <span style={{ opacity: 0.7 }}>{m.label}:</span>
          <span>{m.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function TermsPage() {
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [meta, setMeta] = useState({});
  const [activeId, setActiveId] = useState("s1");
  const [accepted, setAccepted] = useState(false);
  const sectionRefs = useRef({});

  /* ── Fetch from backend ── */
  useEffect(() => {
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
  }, []);

  /* ── Scroll spy ── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActiveId(e.target.id); });
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) { sectionRefs.current[s.id] = el; observer.observe(el); }
    });
    return () => observer.disconnect();
  }, [sections]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main style={{ minHeight: "100vh", background: "#fafbfc", fontFamily: "'Inter','Roboto',sans-serif" }}>

      {/* ── Hero Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #f844a4 0%, #9333ea 55%, #6366f1 100%)",
        padding: "80px 24px 60px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative orbs */}
        <div style={{ position: "absolute", top: "-60px", right: "-60px", width: "300px", height: "300px", borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-40px", left: "-40px", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />

        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "rgba(255,255,255,0.75)", fontSize: "13px", fontWeight: 700, textDecoration: "none", marginBottom: "24px", background: "rgba(255,255,255,0.1)", padding: "8px 16px", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.2)" }}>
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "16px" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "16px", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={28} color="#fff" />
          </div>
        </div>
        <h1 style={{ fontSize: "clamp(28px,5vw,52px)", fontWeight: 900, color: "#fff", margin: "0 0 12px", letterSpacing: "-0.03em" }}>
          Terms &amp; Conditions
        </h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "16px", fontWeight: 500, maxWidth: "560px", margin: "0 auto", lineHeight: 1.6 }}>
          Please read these terms carefully before using our platform. By continuing, you agree to be bound by these conditions.
        </p>
        <MetaStrip {...meta} />
      </div>

      {/* ── Body ── */}
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "48px 24px", display: "flex", flexDirection: "column", gap: "32px" }}>


        {/* ── Sections content ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {sections.map((s, i) => (
            <section
              key={s.id}
              id={s.id}
              style={{
                background: "#fff", borderRadius: "24px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                border: "1px solid #f1f5f9",
                overflow: "hidden",
                scrollMarginTop: "120px",
              }}
            >
              {/* Section header */}
              <div style={{
                padding: "20px 28px", borderBottom: "1px solid #f8f9fa",
                background: "linear-gradient(135deg, #fdf2f8 0%, #f5f3ff 100%)",
                display: "flex", alignItems: "center", gap: "14px",
              }}>
                <div style={{
                  width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0,
                  background: "linear-gradient(135deg, #f844a4, #9333ea)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: "13px", fontWeight: 900,
                }}>{i + 1}</div>
                <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
                  {s.title}
                </h2>
              </div>

              <div style={{ padding: "24px 28px" }}>
                {/* Optional image */}
                {s.image && (
                  <div style={{ marginBottom: "20px", borderRadius: "16px", overflow: "hidden", maxHeight: "260px" }}>
                    <img src={s.image} alt={s.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}

                {/* Content text */}
                {s.content && (
                  <p style={{ margin: "0 0 16px", fontSize: "14px", color: "#475569", lineHeight: 1.8, fontWeight: 500 }}>
                    {s.content}
                  </p>
                )}

                {/* Bullet points */}
                {s.bullets?.length > 0 && (
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
                    {s.bullets.map((b, bi) => (
                      <li key={bi} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                        <ChevronRight size={16} style={{ color: "#f844a4", marginTop: "2px", flexShrink: 0 }} />
                        <span style={{ fontSize: "14px", color: "#475569", lineHeight: 1.7, fontWeight: 500 }}>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}

          {/* ── Accept Button ── */}
          <div style={{
            background: "linear-gradient(135deg, #fff5fb 0%, #f5f3ff 100%)",
            border: "2px solid",
            borderImage: "linear-gradient(135deg,#f844a4,#9333ea) 1",
            borderRadius: "24px",
            padding: "32px",
            textAlign: "center",
          }}>
            <div style={{ marginBottom: "12px" }}>
              <Shield size={32} style={{ color: "#9333ea" }} />
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
              Ready to proceed?
            </h3>
            <p style={{ margin: "0 0 24px", fontSize: "13px", color: "#64748b", fontWeight: 500 }}>
              By clicking Accept, you confirm that you have read, understood, and agreed to all the terms above.
            </p>
            {accepted ? (
              <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", background: "#f0fdf4", border: "2px solid #bbf7d0", borderRadius: "16px", padding: "14px 28px", color: "#16a34a", fontWeight: 800, fontSize: "15px" }}>
                <CheckCircle size={20} /> Terms Accepted — Thank you!
              </div>
            ) : (
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  onClick={() => setAccepted(true)}
                  style={{
                    padding: "14px 40px", borderRadius: "14px", border: "none",
                    background: "linear-gradient(135deg, #f844a4 0%, #9333ea 100%)",
                    color: "#fff", fontWeight: 800, fontSize: "15px", cursor: "pointer",
                    boxShadow: "0 8px 24px rgba(248,68,164,0.35)",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(248,68,164,0.45)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(248,68,164,0.35)"; }}
                >
                  ✓ Accept Terms &amp; Conditions
                </button>
                <Link
                  href="/"
                  style={{
                    padding: "14px 28px", borderRadius: "14px", textDecoration: "none",
                    background: "transparent", border: "2px solid #e2e8f0",
                    color: "#64748b", fontWeight: 700, fontSize: "14px",
                    display: "inline-flex", alignItems: "center",
                  }}
                >
                  Decline &amp; Go Back
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 600px) {
          .terms-grid { padding: 24px 16px !important; }
        }
      `}</style>
    </main>
  );
}
