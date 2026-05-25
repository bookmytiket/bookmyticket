"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Calendar, Clock, Save, Edit3, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ShowtimeManager({ eventId, onUpdate }) {
    const [showtimes, setShowtimes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [bookingMode, setBookingMode] = useState('single_show');
    const [isEditing, setIsEditing] = useState(false);
    const [newShow, setNewShow] = useState({
        show_name: '',
        show_date: '',
        start_time: '',
        status: 'active'
    });

    useEffect(() => {
        if (!eventId) return;
        fetchData();
    }, [eventId]);

    const fetchData = async () => {
        setLoading(true);
        // Get event mode
        const { data: eventData } = await supabase
            .from('events')
            .select('booking_mode')
            .eq('id', eventId)
            .single();

        if (eventData) setBookingMode(eventData.booking_mode || 'single_show');

        // Get showtimes
        const { data: shows } = await supabase
            .from('event_showtimes')
            .select('*')
            .eq('event_id', eventId)
            .order('show_date', { ascending: true })
            .order('start_time', { ascending: true });

        if (shows) setShowtimes(shows);
        setLoading(false);
    };

    const toggleMode = async (mode) => {
        setSaving(true);
        await supabase.from('events').update({ booking_mode: mode }).eq('id', eventId);
        setBookingMode(mode);
        setSaving(false);
        if (onUpdate) onUpdate();
    };

    const handleAddShowtime = async () => {
        if (!newShow.show_date || !newShow.start_time) return alert("Date and Time are required.");
        
        setSaving(true);
        const { data, error } = await supabase.from('event_showtimes').insert({
            event_id: eventId,
            show_name: newShow.show_name,
            show_date: newShow.show_date,
            start_time: newShow.start_time,
            status: newShow.status
        }).select().single();

        if (error) {
            console.error(error);
            alert("Failed to add showtime.");
        } else if (data) {
            setShowtimes([...showtimes, data].sort((a,b) => new Date(a.show_date) - new Date(b.show_date)));
            setNewShow({ show_name: '', show_date: '', start_time: '', status: 'active' });
        }
        setSaving(false);
    };

    const handleDeleteShowtime = async (id) => {
        if (!confirm("Are you sure you want to delete this showtime? This might affect existing bookings.")) return;
        setSaving(true);
        await supabase.from('event_showtimes').delete().eq('id', id);
        setShowtimes(showtimes.filter(s => s.id !== id));
        setSaving(false);
    };

    if (loading) {
        return <div className="flex items-center justify-center p-8"><Loader2 className="animate-spin text-pink-500" /></div>;
    }

    return (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Event Showtimes</h3>
                    <p className="text-xs font-bold text-slate-400">Manage multiple timings and inventory for this event</p>
                </div>
                
                <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200">
                    <button 
                        onClick={() => toggleMode('single_show')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${bookingMode === 'single_show' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Single Show
                    </button>
                    <button 
                        onClick={() => toggleMode('multi_show')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${bookingMode === 'multi_show' ? 'bg-pink-500 text-white shadow-sm shadow-pink-200 border border-pink-600' : 'text-slate-400 hover:text-pink-500'}`}
                    >
                        Multi Showtime
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {bookingMode === 'multi_show' && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-6 overflow-hidden"
                    >
                        <div className="bg-pink-50/50 p-6 rounded-2xl border border-pink-100/50 space-y-4">
                            <h4 className="text-xs font-black text-pink-600 uppercase tracking-widest flex items-center gap-2"><Plus size={14}/> Add New Showtime</h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Show Name (Optional)</label>
                                    <input 
                                        type="text" 
                                        value={newShow.show_name} 
                                        onChange={e => setNewShow({...newShow, show_name: e.target.value})}
                                        placeholder="e.g. Morning Matinee" 
                                        className="w-full mt-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-pink-500 outline-none font-bold" 
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Date</label>
                                    <input 
                                        type="date" 
                                        value={newShow.show_date} 
                                        onChange={e => setNewShow({...newShow, show_date: e.target.value})}
                                        className="w-full mt-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-pink-500 outline-none font-bold text-slate-700" 
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Start Time</label>
                                    <input 
                                        type="time" 
                                        value={newShow.start_time} 
                                        onChange={e => setNewShow({...newShow, start_time: e.target.value})}
                                        className="w-full mt-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-pink-500 outline-none font-bold text-slate-700" 
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button 
                                        onClick={handleAddShowtime}
                                        disabled={saving}
                                        className="w-full h-[46px] bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Add
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {showtimes.length === 0 ? (
                                <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl">
                                    <Calendar className="mx-auto text-slate-300 mb-2" size={32} />
                                    <p className="text-slate-400 font-bold text-sm">No showtimes added yet.</p>
                                </div>
                            ) : (
                                showtimes.map(show => (
                                    <div key={show.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-pink-200 transition-colors group">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center text-pink-500">
                                                <Clock size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 uppercase">
                                                    {new Date(show.show_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                                <p className="text-xs font-bold text-slate-500 mt-0.5">
                                                    {new Date(`2000-01-01T${show.start_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                                    {show.show_name && <span className="ml-2 px-2 py-0.5 bg-slate-100 rounded text-[9px] uppercase tracking-widest">{show.show_name}</span>}
                                                </p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteShowtime(show.id)}
                                            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
