"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin, Calendar, Clock, Users, ChevronRight, ChevronDown, ChevronUp,
  Trophy, Star, Heart, Share2, Download, Shirt, CheckCircle2,
  Timer, Award, Zap, ArrowRight, X, QrCode, Phone
} from "lucide-react";
import QRCode from "qrcode";

const SPONSOR_TYPE_ORDER = ['Title', 'Powered By', 'Associate', 'Partner', 'Hydration', 'Media', 'Medical'];

const BENEFIT_ICONS = {
  tshirt: '👕', medal: '🏅', ambulance: '🚑', medical: '🩺', certificate: '📜',
  breakfast: '☕', refreshment: '🍎', parking: '🚗', safety: '🛡', trophy: '🏆',
  timer: '⏱', selfie: '📸', washroom: '🚿', family: '👨‍👩‍👧', prize: '💰'
};

export default function MarathonEventClient({ marathon, categories, sponsors, benefits, slug }) {
  const router = useRouter();
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [qrUrl, setQrUrl] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [activeTab, setActiveTab] = useState('categories');
  const canvasRef = useRef(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://bookmyticket.net';
  const registrationUrl = `${baseUrl}/marathon/${slug}/register`;

  useEffect(() => {
    QRCode.toDataURL(registrationUrl, {
      width: 256, margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    }).then(setQrUrl).catch(console.error);
  }, [registrationUrl]);

  useEffect(() => {
    if (!marathon?.event_date) return;
    const eventDateTime = new Date(`${marathon.event_date}T${marathon.event_time || '06:00'}`);
    const interval = setInterval(() => {
      const diff = eventDateTime - new Date();
      if (diff <= 0) { clearInterval(interval); return; }
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [marathon?.event_date, marathon?.event_time]);

  const minPrice = categories.length > 0
    ? Math.min(...categories.map(c => Number(c.effective_price || c.price) || 0))
    : 0;

  const hasEarlyBird = categories.some(c => c.is_early_bird);

  const groupedSponsors = sponsors.reduce((acc, s) => {
    const type = s.sponsor_type || 'Partner';
    if (!acc[type]) acc[type] = [];
    acc[type].push(s);
    return acc;
  }, {});

  const faqs = (() => {
    if (!marathon?.dynamic_config) return [];
    try {
      const cfg = typeof marathon.dynamic_config === 'string'
        ? JSON.parse(marathon.dynamic_config) : marathon.dynamic_config;
      return cfg?.faqs || [];
    } catch { return []; }
  })();

  const handleShare = async () => {
    if (navigator.share) {
      navigator.share({ title: marathon.title, url: registrationUrl });
    } else {
      navigator.clipboard.writeText(registrationUrl);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* ── Hero ── */}
      <div className="relative h-[60vh] md:h-[75vh] overflow-hidden">
        {marathon.banner_image ? (
          <img
            src={marathon.banner_image}
            alt={marathon.title}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-pink-900 via-purple-900 to-indigo-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-black/50 to-transparent" />

        {/* Floating pills */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
          <span className="px-4 py-2 bg-pink-500/90 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest">
            🏃 Marathon
          </span>
          <div className="flex gap-3">
            <button onClick={handleShare}
              className="p-2.5 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-all">
              <Share2 size={18} />
            </button>
            <button onClick={() => setShowQrModal(true)}
              className="p-2.5 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-all">
              <QrCode size={18} />
            </button>
          </div>
        </div>

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          {marathon.awareness_text && (
            <span className="inline-block px-3 py-1 bg-yellow-400 text-black text-xs font-black uppercase rounded-full mb-3">
              {marathon.awareness_text}
            </span>
          )}
          <h1 className="text-3xl md:text-5xl font-black leading-tight mb-3">{marathon.title}</h1>
          {marathon.subtitle && (
            <p className="text-pink-300 text-sm font-semibold mb-4">{marathon.subtitle}</p>
          )}
          <div className="flex flex-wrap gap-4 text-sm text-white/80">
            <span className="flex items-center gap-2">
              <Calendar size={16} className="text-pink-400" />
              {marathon.event_date ? new Date(marathon.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
            </span>
            <span className="flex items-center gap-2">
              <Clock size={16} className="text-pink-400" />
              {marathon.event_time || 'TBA'}
              {marathon.reporting_time && ` (Reporting: ${marathon.reporting_time})`}
            </span>
            <span className="flex items-center gap-2">
              <MapPin size={16} className="text-pink-400" />
              {marathon.venue}
              {marathon.city && `, ${marathon.city}`}
            </span>
          </div>
        </div>
      </div>

      {/* ── Countdown ── */}
      {marathon.event_date && (
        <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 py-4">
          <div className="max-w-5xl mx-auto px-6 flex items-center justify-center gap-6 md:gap-12">
            {[
              { label: 'Days', value: countdown.days },
              { label: 'Hours', value: countdown.hours },
              { label: 'Mins', value: countdown.mins },
              { label: 'Secs', value: countdown.secs },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="text-2xl md:text-4xl font-black tabular-nums">{String(value).padStart(2, '0')}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">{label}</div>
              </div>
            ))}
            <div className="hidden md:block ml-6">
              <span className="text-xs font-bold uppercase opacity-80">Registration closes:</span>
              <p className="text-sm font-black">
                {marathon.reg_end_date || marathon.registration_deadline
                  ? new Date(marathon.reg_end_date || marathon.registration_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  : 'Limited Slots!'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10">
        {/* ── CTA Banner ── */}
        <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-3xl p-6 md:p-8 mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            {hasEarlyBird && (
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-400/20 border border-yellow-400/30 rounded-full text-yellow-400 text-xs font-black uppercase mb-2">
                <Zap size={12} /> Early Bird Active!
              </span>
            )}
            <p className="text-white/60 text-sm">Registration Fee Starting from</p>
            <p className="text-4xl font-black text-white">
              ₹{minPrice.toLocaleString('en-IN')}
              {hasEarlyBird && <span className="text-yellow-400 text-lg ml-2 font-bold">Early Bird</span>}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={() => setShowQrModal(true)}
              className="flex items-center justify-center gap-2 px-6 py-4 border border-white/20 text-white rounded-2xl font-bold text-sm hover:bg-white/5 transition-all"
            >
              <QrCode size={18} /> Scan QR
            </button>
            <button
              onClick={() => router.push(`/marathon/${slug}/register`)}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl font-black text-sm shadow-xl hover:scale-105 transition-all"
            >
              Register Now <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* ── Benefits strip ── */}
        {benefits.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-10">
            {benefits.map((rawB, i) => {
              let b = rawB;
              if (typeof rawB === 'string') {
                try {
                  const parsed = JSON.parse(rawB);
                  if (typeof parsed === 'object' && parsed !== null) b = parsed;
                } catch(e) {}
              }
              const label = typeof b === 'string' ? b : b.benefit_name || b.title || b.label || '';
              if (!label) return null;
              return (
              <span key={i} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-white/80">
                <span>{BENEFIT_ICONS[b.icon_key] || '✅'}</span>
                {label}
              </span>
            )})}
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex gap-1 mb-8 bg-white/5 rounded-2xl p-1.5">
          {[
            { id: 'categories', label: 'Categories' },
            { id: 'sponsors', label: 'Sponsors' },
            { id: 'about', label: 'About' },
            { id: 'faq', label: 'FAQ' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Categories Tab ── */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            {categories.length === 0 && (
              <p className="text-white/40 text-center py-10">No categories available yet.</p>
            )}
            {categories.map((cat, i) => (
              <div key={cat.id || i}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-pink-500/30 transition-all group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-400 font-black text-sm">
                        {cat.distance_km}{cat.distance_unit === 'M' ? 'M' : 'K'}
                      </div>
                      <div>
                        <h3 className="font-black text-white">{cat.category_name}</h3>
                        <p className="text-white/50 text-xs">
                          {cat.age_group && `Age: ${cat.age_group}`}
                          {cat.gender_category && cat.gender_category !== 'All' && ` · ${cat.gender_category}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-3">
                      {cat.bib_series && (
                        <span className="text-xs px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-300">
                          Bib: {cat.bib_series}
                        </span>
                      )}
                      {cat.prize_amount > 0 && (
                        <span className="text-xs px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-300">
                          🏆 Prize: ₹{Number(cat.prize_amount).toLocaleString('en-IN')}
                        </span>
                      )}
                      <span className="text-xs px-3 py-1 bg-white/5 border border-white/10 rounded-full text-white/60">
                        <Users size={10} className="inline mr-1" />
                        {(cat.available_slots ?? Math.max(0, (cat.slots_total || 100) - (cat.slots_booked || 0)))} slots left
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {cat.is_early_bird && cat.early_bird_price != null && (
                      <div>
                        <p className="text-white/40 text-xs line-through">₹{Number(cat.price).toLocaleString('en-IN')}</p>
                        <span className="text-[10px] text-yellow-400 font-bold">⚡ Early Bird</span>
                      </div>
                    )}
                    <p className="text-2xl font-black text-pink-400">
                      ₹{Number(cat.effective_price || cat.price).toLocaleString('en-IN')}
                    </p>
                    <button
                      onClick={() => router.push(`/marathon/${slug}/register?category=${cat.id}`)}
                      className="mt-2 px-4 py-2 bg-pink-500 text-white rounded-xl text-xs font-black hover:bg-pink-400 transition-all"
                    >
                      Register
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Sponsors Tab ── */}
        {activeTab === 'sponsors' && (
          <div className="space-y-8">
            {sponsors.length === 0 && <p className="text-white/40 text-center py-10">Sponsors coming soon.</p>}
            {SPONSOR_TYPE_ORDER.filter(t => groupedSponsors[t]?.length > 0).map(type => (
              <div key={type}>
                <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">{type} Sponsor</h3>
                <div className={`grid gap-4 ${type === 'Title' || type === 'Powered By' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
                  {groupedSponsors[type].map((sp, i) => (
                    <a
                      key={i}
                      href={sp.sponsor_website || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center p-6 hover:border-white/20 transition-all group ${type === 'Title' ? 'h-28' : 'h-20'}`}
                    >
                      {sp.logo_url ? (
                        <img src={sp.logo_url} alt={sp.sponsor_name} className="max-h-full max-w-full object-contain filter brightness-90 group-hover:brightness-110 transition-all" />
                      ) : (
                        <span className="text-white/60 font-bold text-sm">{sp.sponsor_name}</span>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            ))}
            {/* Extra sponsor types not in order */}
            {Object.entries(groupedSponsors)
              .filter(([type]) => !SPONSOR_TYPE_ORDER.includes(type))
              .map(([type, sps]) => (
                <div key={type}>
                  <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">{type}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {sps.map((sp, i) => (
                      <a key={i} href={sp.sponsor_website || '#'} target="_blank" rel="noopener noreferrer"
                        className="bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center p-4 h-20 hover:border-white/20 transition-all">
                        {sp.logo_url
                          ? <img src={sp.logo_url} alt={sp.sponsor_name} className="max-h-full max-w-full object-contain" />
                          : <span className="text-white/60 font-bold text-xs">{sp.sponsor_name}</span>}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* ── About Tab ── */}
        {activeTab === 'about' && (
          <div className="space-y-6">
            {marathon.description && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="font-black text-white mb-4">About This Event</h3>
                <div className="text-white/70 leading-relaxed whitespace-pre-wrap text-sm">{marathon.description}</div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h4 className="font-black text-white/60 text-xs uppercase tracking-widest mb-3">Event Schedule</h4>
                <div className="space-y-2 text-sm">
                  {marathon.reporting_time && (
                    <div className="flex justify-between">
                      <span className="text-white/50">Reporting Time</span>
                      <span className="font-bold text-white">{marathon.reporting_time}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-white/50">Flag-off / Start</span>
                    <span className="font-bold text-white">{marathon.event_time || 'TBA'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Event Date</span>
                    <span className="font-bold text-white">
                      {marathon.event_date ? new Date(marathon.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h4 className="font-black text-white/60 text-xs uppercase tracking-widest mb-3">Contact</h4>
                <div className="space-y-2 text-sm">
                  {marathon.organiser_name && (
                    <div className="flex justify-between">
                      <span className="text-white/50">Organised By</span>
                      <span className="font-bold text-white">{marathon.organiser_name}</span>
                    </div>
                  )}
                  {marathon.support_number && (
                    <a href={`tel:${marathon.support_number}`} className="flex items-center gap-2 text-pink-400 hover:text-pink-300">
                      <Phone size={14} /> {marathon.support_number}
                    </a>
                  )}
                  {marathon.whatsapp_link && (
                    <a href={marathon.whatsapp_link} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-green-400 hover:text-green-300 text-xs">
                      💬 Join WhatsApp Group
                    </a>
                  )}
                </div>
              </div>
            </div>
            {marathon.terms_conditions && (
              <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-5">
                <h4 className="font-black text-yellow-400 text-xs uppercase tracking-widest mb-3">⚠ Terms & Conditions</h4>
                <p className="text-white/60 text-xs leading-relaxed whitespace-pre-wrap">{marathon.terms_conditions}</p>
              </div>
            )}
          </div>
        )}

        {/* ── FAQ Tab ── */}
        {activeTab === 'faq' && (
          <div className="space-y-3">
            {faqs.length === 0 && <p className="text-white/40 text-center py-10">No FAQs available.</p>}
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-bold text-white text-sm">{faq.question}</span>
                  {expandedFaq === i ? <ChevronUp size={18} className="text-pink-400 shrink-0" /> : <ChevronDown size={18} className="text-white/40 shrink-0" />}
                </button>
                {expandedFaq === i && (
                  <div className="px-5 pb-5 text-white/60 text-sm leading-relaxed">{faq.answer}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Sticky Register CTA (mobile) ── */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/10 p-4 flex gap-3">
        <button
          onClick={() => setShowQrModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-3 border border-white/20 text-white rounded-xl font-bold text-sm"
        >
          <QrCode size={18} />
        </button>
        <button
          onClick={() => router.push(`/marathon/${slug}/register`)}
          className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-black text-sm"
        >
          Register Now — ₹{minPrice.toLocaleString('en-IN')}+
        </button>
      </div>
      <div className="h-20 md:hidden" />

      {/* ── QR Modal ── */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center">
            <button onClick={() => setShowQrModal(false)} className="absolute top-4 right-4 text-white/50 hover:text-white">
              <X size={24} />
            </button>
            <h3 className="font-black text-white text-lg mb-2">Scan to Register</h3>
            <p className="text-white/50 text-sm mb-6">{marathon.title}</p>
            {qrUrl && (
              <div className="bg-white rounded-2xl p-4 inline-block mb-6">
                <img src={qrUrl} alt="Registration QR Code" className="w-48 h-48" />
              </div>
            )}
            <p className="text-white/40 text-xs mb-4 break-all">{registrationUrl}</p>
            <div className="flex gap-3">
              <button
                onClick={() => { navigator.clipboard.writeText(registrationUrl); }}
                className="flex-1 py-3 border border-white/20 text-white rounded-xl font-bold text-sm hover:bg-white/5"
              >
                Copy Link
              </button>
              {qrUrl && (
                <a
                  href={qrUrl}
                  download={`${marathon.title}-QR.png`}
                  className="flex-1 py-3 bg-pink-500 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2"
                >
                  <Download size={16} /> Download
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
