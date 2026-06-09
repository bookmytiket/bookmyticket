"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Check, X, Eye, FileEdit, Clock, Calendar, MapPin, IndianRupee, ShieldAlert, RefreshCw, AlertCircle, CheckCircle, Info } from 'lucide-react';

// Inline Toast Component
function Toast({ toasts, onDismiss }) {
    return (
        <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '12px', pointerEvents: 'none' }}>
            {toasts.map(t => (
                <div key={t.id} style={{
                    pointerEvents: 'all',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    background: t.type === 'success' ? '#10b981' : t.type === 'error' ? '#ef4444' : '#6366f1',
                    color: '#fff',
                    padding: '14px 20px',
                    borderRadius: '14px',
                    fontSize: '13px',
                    fontWeight: 700,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                    minWidth: '280px',
                    maxWidth: '400px',
                    animation: 'slideIn 0.3s ease',
                }}>
                    {t.type === 'success' ? <CheckCircle size={16} /> : t.type === 'error' ? <AlertCircle size={16} /> : <Info size={16} />}
                    <span style={{ flex: 1 }}>{t.message}</span>
                    <button onClick={() => onDismiss(t.id)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.7, padding: 0 }}>
                        <X size={14} />
                    </button>
                </div>
            ))}
        </div>
    );
}

export default function AdminEventApprovalQueue() {
    const [pendingEvents, setPendingEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [rejectReason, setRejectReason] = useState("");
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [fetchError, setFetchError] = useState(null);
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }, []);

    const dismissToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    useEffect(() => {
        fetchPendingEvents();
    }, []);

    const fetchPendingEvents = async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const res = await fetch(`/api/admin/events/pending?t=${Date.now()}`, { cache: 'no-store' });
            const json = await res.json();
            if (json.success) {
                setPendingEvents(json.data || []);
            } else {
                setFetchError(json.error || 'Failed to load events');
            }
        } catch (err) {
            setFetchError('Network error: ' + err.message);
        }
        setLoading(false);
    };

    const handleApprove = async (eventId, eventTitle) => {
        setProcessingId(eventId);
        try {
            const res = await fetch('/api/admin/events/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event_id: eventId })
            });
            const data = await res.json();
            if (data.success) {
                setPendingEvents(prev => prev.filter(e => e.id !== eventId));
                showToast(`✅ "${eventTitle}" approved! Organiser notified.`, 'success');
            } else {
                showToast('Approval failed: ' + (data.error || 'Unknown error'), 'error');
            }
        } catch (err) {
            showToast('Network error. Please try again.', 'error');
        }
        setProcessingId(null);
    };

    const handleReject = async (eventId, eventTitle) => {
        if (!rejectReason.trim()) {
            showToast('Please enter a reason for rejection.', 'error');
            return;
        }
        setProcessingId(eventId);
        try {
            const res = await fetch('/api/admin/events/reject', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event_id: eventId, reason: rejectReason })
            });
            const data = await res.json();
            if (data.success) {
                setPendingEvents(prev => prev.filter(e => e.id !== eventId));
                setSelectedEventId(null);
                setRejectReason("");
                showToast(`"${eventTitle}" rejected. Organiser notified.`, 'info');
            } else {
                showToast('Rejection failed: ' + (data.error || 'Unknown error'), 'error');
            }
        } catch (err) {
            showToast('Network error. Please try again.', 'error');
        }
        setProcessingId(null);
    };

    const handleRequestChanges = async (eventId, eventTitle) => {
        if (!rejectReason.trim()) {
            showToast('Please enter notes for the organiser.', 'error');
            return;
        }
        setProcessingId(eventId);
        try {
            const res = await fetch('/api/admin/events/request-changes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event_id: eventId, notes: rejectReason })
            });
            const data = await res.json();
            if (data.success) {
                setPendingEvents(prev => prev.filter(e => e.id !== eventId));
                setSelectedEventId(null);
                setRejectReason("");
                showToast(`Changes requested for "${eventTitle}". Organiser notified.`, 'info');
            } else {
                showToast('Request failed: ' + (data.error || 'Unknown error'), 'error');
            }
        } catch (err) {
            showToast('Network error. Please try again.', 'error');
        }
        setProcessingId(null);
    };

    if (loading) {
        return (
            <div className="p-12 text-center">
                <div className="inline-flex items-center gap-3 text-slate-400 font-bold uppercase tracking-widest text-xs">
                    <RefreshCw size={16} className="animate-spin" /> Loading queue...
                </div>
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="p-12 text-center">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md mx-auto">
                    <AlertCircle className="text-red-500 mx-auto mb-4" size={32} />
                    <p className="text-red-600 font-bold text-sm mb-4">{fetchError}</p>
                    <button onClick={fetchPendingEvents} className="px-6 py-3 bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <Toast toasts={toasts} onDismiss={dismissToast} />
            <style>{`@keyframes slideIn { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>

            <div className="px-8 py-6 max-w-6xl mx-auto">
                <div className="mb-8 flex items-start justify-between">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-3">
                            <ShieldAlert className="text-orange-500" size={32} />
                            Event Approval Queue
                        </h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">
                            Review and authorize pending events before public listing
                        </p>
                    </div>
                    <button
                        onClick={fetchPendingEvents}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                        <RefreshCw size={12} /> Refresh
                    </button>
                </div>

                {pendingEvents.length > 0 && (
                    <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-full">
                        <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                        <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">
                            {pendingEvents.length} Event{pendingEvents.length !== 1 ? 's' : ''} Awaiting Review
                        </span>
                    </div>
                )}

                {pendingEvents.length === 0 ? (
                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-16 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                            <Check size={32} className="text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">All Caught Up!</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-sm leading-relaxed">
                            There are no events pending review at the moment.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {pendingEvents.map(ev => (
                            <div key={ev.id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex flex-col gap-6 hover:shadow-xl transition-all">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-50 pb-6">
                                    <div className="flex items-center gap-4">
                                        {/* Event thumbnail */}
                                        <div className="w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 flex-shrink-0">
                                            {(ev.img || ev.banner_preview) ? (
                                                <img
                                                    src={ev.img || ev.banner_preview}
                                                    alt={ev.title}
                                                    className="w-full h-full object-cover"
                                                    onError={e => { e.target.style.display = 'none'; }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Calendar className="text-slate-400" size={28} />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1">{ev.title}</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 flex-wrap">
                                                <span>{ev.profiles?.full_name || 'Unknown Organiser'}</span>
                                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                <span>{ev.profiles?.email || 'No Email'}</span>
                                                {ev.profiles?.phone && (
                                                    <>
                                                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                        <span>{ev.profiles.phone}</span>
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 w-full md:w-auto">
                                        <button
                                            onClick={() => handleApprove(ev.id, ev.title)}
                                            disabled={processingId === ev.id}
                                            className="flex-1 md:flex-none px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:scale-100"
                                        >
                                            <Check size={14} />
                                            {processingId === ev.id ? 'Processing...' : 'Approve'}
                                        </button>
                                        <button
                                            onClick={() => setSelectedEventId(selectedEventId === ev.id ? null : ev.id)}
                                            disabled={processingId === ev.id}
                                            className="flex-1 md:flex-none px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                                        >
                                            <FileEdit size={14} /> Review
                                        </button>
                                    </div>
                                </div>

                                {/* Event Details Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 pb-2">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Date &amp; Time</p>
                                        <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                            <Clock size={12} className="text-blue-500" />
                                            {new Date(ev.event_start_at || ev.date || ev.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Location</p>
                                        <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                            <MapPin size={12} className="text-rose-500" />
                                            {ev.city || ev.location || 'Online / TBD'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pricing</p>
                                        <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                            <IndianRupee size={12} className={ev.ticket_mode === 'free' || ev.is_free ? 'text-emerald-500' : 'text-blue-500'} />
                                            {ev.ticket_mode === 'free' || ev.is_free ? 'Free Event' : ev.price ? `₹${ev.price}` : 'Paid Ticket'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Submitted</p>
                                        <p className="text-xs font-bold text-slate-700">
                                            {new Date(ev.updated_at || ev.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>

                                {/* Rejection / Changes Panel */}
                                {selectedEventId === ev.id && (
                                    <div className="mt-2 p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Eye size={14} className="text-blue-500" /> Admin Action Panel
                                        </h4>
                                        <textarea
                                            className="w-full bg-white p-4 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 outline-none resize-none mb-4 text-slate-700"
                                            placeholder="Enter reason for rejection or notes for requested changes..."
                                            rows="3"
                                            value={rejectReason}
                                            onChange={e => setRejectReason(e.target.value)}
                                        ></textarea>
                                        <div className="flex gap-3 flex-wrap">
                                            <button
                                                onClick={() => handleRequestChanges(ev.id, ev.title)}
                                                disabled={processingId === ev.id}
                                                className="px-6 py-3 bg-orange-100 text-orange-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-200 transition-all flex items-center gap-2 disabled:opacity-60"
                                            >
                                                Request Changes
                                            </button>
                                            <button
                                                onClick={() => handleReject(ev.id, ev.title)}
                                                disabled={processingId === ev.id}
                                                className="px-6 py-3 bg-red-100 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-200 transition-all flex items-center gap-2 disabled:opacity-60"
                                            >
                                                <X size={14} /> Reject Event
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
