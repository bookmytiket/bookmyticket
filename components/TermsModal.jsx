"use client";
import { useState, useEffect } from "react";
import { X, ChevronRight, Shield, CheckCircle, ScrollText, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";

const FALLBACK = [
  {
    id: "s1", title: "Acceptance of Terms",
    content: "By using our platform, you agree to be bound by these Terms & Conditions. We facilitate bookings but are not the event organisers.",
    bullets: ["Minimum age of 18 required.", "Accurate profile information is mandatory.", "Agreement to follow local and venue regulations."],
  },
  {
    id: "s2", title: "Partner Obligations",
    content: "As a partner, you are responsible for the accuracy of your event listings and the quality of services provided.",
    bullets: ["Transparent pricing is mandatory.", "Timely updates for cancellations or rescheduling.", "Compliance with tax and local business laws."],
  },
  {
    id: "s3", title: "Payout & Refunds",
    content: "Payouts are processed based on the event's completion status. BookMyTicket acts as an intermediary for secure transactions.",
    bullets: ["Standard platform fees apply per transaction.", "Refunds are processed as per the organiser's policy.", "Payout cycle: 7-10 business days post-event."],
  },
  {
    id: "s4", title: "Privacy & Security",
    content: "We prioritize your data security and use enterprise-grade encryption for all sensitive information.",
    bullets: ["Data is encrypted at rest and in transit.", "No third-party sharing without consent.", "Regular security audits and updates."],
  },
];

export default function TermsModal({ isOpen, onClose, onAccept, type = "event" }) {
  const [sections, setSections] = useState(FALLBACK);
  const [meta, setMeta] = useState({});
  const [activeIdx, setActiveIdx] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
        setMeta({ lastUpdated: data.value.lastUpdated });
      }
    })();
  }, [isOpen]);

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
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 transition-all duration-500 bg-slate-950/80 backdrop-blur-xl animate-in fade-in">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl shadow-purple-500/20 overflow-hidden flex flex-col max-h-[90vh] border border-white/20 scale-100 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Purple/Pink Gradient */}
        <div className="relative shrink-0 p-6 sm:p-8 bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 overflow-hidden">
          {/* Abstract Background Shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-400/20 rounded-full -ml-10 -mb-10 blur-2xl" />
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 flex items-center justify-center text-white transition-all cursor-pointer z-10"
          >
            <X size={20} />
          </button>

          <div className="relative flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shrink-0">
              <ScrollText size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black italic tracking-tighter text-white uppercase leading-none mb-2">
                Terms of <span className="text-pink-200">Service</span>
              </h2>
              <div className="flex items-center gap-2 text-white/70 text-[10px] font-bold uppercase tracking-widest">
                <Shield size={12} />
                <span>Last Updated: {meta.lastUpdated || "April 2026"}</span>
                <span className="mx-1">•</span>
                <span>Secure Verification</span>
              </div>
            </div>
          </div>

          {/* Quick Navigation Pills */}
          <div className="flex gap-2 mt-8 overflow-x-auto pb-2 no-scrollbar">
            {sections.map((s, i) => (
              <button
                key={s.id}
                onClick={() => {
                  setActiveIdx(i);
                  document.getElementById(`section-${s.id}`).scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer ${
                  activeIdx === i 
                    ? 'bg-white text-purple-600 shadow-lg' 
                    : 'bg-white/10 text-white/80 border border-white/20 hover:bg-white/20'
                }`}
              >
                {i + 1}. {s.title}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body - Scrollable */}
        <div 
          className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 scroll-smooth"
          onScroll={(e) => {
            const currentScroll = e.target.scrollTop;
            setScrolled(currentScroll > 20);
          }}
        >
          {sections.map((s, i) => (
            <div 
              key={s.id} 
              id={`section-${s.id}`}
              className={`p-6 rounded-3xl transition-all duration-500 border ${
                activeIdx === i 
                  ? 'bg-purple-50/50 border-purple-100 shadow-sm' 
                  : 'bg-transparent border-transparent'
              }`}
              onMouseEnter={() => setActiveIdx(i)}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs transition-colors ${
                  activeIdx === i ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  {i + 1}
                </div>
                <h3 className="text-lg font-black italic tracking-tight uppercase text-slate-900">{s.title}</h3>
              </div>
              
              <p className="text-slate-600 text-sm leading-relaxed font-medium mb-6">
                {s.content}
              </p>

              {s.bullets?.length > 0 && (
                <div className="grid grid-cols-1 gap-3">
                  {s.bullets.map((bullet, bIdx) => (
                    <div key={bIdx} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                      <div className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-pink-500" />
                      <span className="text-xs font-semibold text-slate-700 leading-tight">{bullet}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Security Banner */}
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-6">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-purple-500" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-1">Important Notice</h4>
              <p className="text-[11px] font-medium text-slate-500 leading-tight">
                Please read carefully. By clicking accept, you acknowledge full legal compliance with our partner protocols.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={`shrink-0 p-6 sm:px-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white transition-all ${scrolled ? 'shadow-[0_-8px_20px_rgba(0,0,0,0.03)]' : ''}`}>
          <div className="flex items-center gap-3">
            <CheckCircle size={16} className={accepted ? "text-green-500" : "text-slate-300"} />
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
              Protocol v4.0.2 Secure
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={onClose}
              className="flex-1 sm:flex-none px-8 py-3.5 rounded-xl border-2 border-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer"
            >
              Decline
            </button>
            <button 
              onClick={handleAccept}
              disabled={accepted}
              className={`flex-1 sm:flex-none px-10 py-3.5 rounded-xl text-white text-[11px] font-black uppercase tracking-widest italic transition-all shadow-xl cursor-pointer flex items-center justify-center gap-2 ${
                accepted 
                  ? 'bg-green-500 shadow-green-500/20 scale-95' 
                  : 'bg-gradient-to-r from-pink-500 to-purple-600 shadow-purple-500/20 hover:scale-105 active:scale-95'
              }`}
            >
              {accepted ? (
                <>
                  <CheckCircle size={16} />
                  Accepted
                </>
              ) : (
                "Accept Terms"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
