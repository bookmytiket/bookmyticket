/* eslint-disable */
'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, Plus, CheckCircle, Edit, Trash2 } from 'lucide-react';

export default function AdminEventPublishing() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        event_name: '',
        category: 'Concerts',
        organizer_type: 'Admin',
        publish_status: 'Draft'
    });

    

    const fetchEvents = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('admin_events').select('*').order('created_at', { ascending: false });
        if (data) setEvents(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        const { data, error } = await supabase.from('admin_events').insert([formData]);
        if (!error) {
            setShowForm(false);
            fetchEvents();
        }
    };

    const handlePublish = async (id) => {
        await supabase.from('admin_events').update({ publish_status: 'Published' }).eq('id', id);
        fetchEvents();
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <Calendar className="text-pink-500" />
                        Admin Event Publishing
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Directly create and publish events bypassing organizer workflow.</p>
                </div>
                <button 
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-pink-500 text-white font-bold rounded-lg hover:bg-pink-600 text-sm flex items-center gap-2">
                    <Plus size={16} /> Create Event
                </button>
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">New Admin Event</h3>
                    <form onSubmit={handleCreate} className="space-y-4 max-w-2xl">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Event Name</label>
                            <input 
                                required
                                type="text"
                                className="w-full p-2 border border-slate-200 rounded-lg"
                                value={formData.event_name}
                                onChange={e => setFormData({...formData, event_name: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Category</label>
                            <select 
                                className="w-full p-2 border border-slate-200 rounded-lg"
                                value={formData.category}
                                onChange={e => setFormData({...formData, category: e.target.value})}
                            >
                                <option>Concerts</option>
                                <option>Sports Events</option>
                                <option>Marathon</option>
                                <option>Tournament</option>
                                <option>Workshops</option>
                                <option>Exhibitions</option>
                            </select>
                        </div>
                        <button type="submit" className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800">
                            Save Draft
                        </button>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-100">
                            <th className="p-4 font-bold">Event Name</th>
                            <th className="p-4 font-bold">Category</th>
                            <th className="p-4 font-bold">Status</th>
                            <th className="p-4 font-bold">Date Created</th>
                            <th className="p-4 font-bold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.map(ev => (
                            <tr key={ev.id} className="border-b border-slate-50">
                                <td className="p-4 font-bold text-slate-800">{ev.event_name}</td>
                                <td className="p-4 text-slate-600">{ev.category}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 text-[10px] font-black uppercase rounded-full ${ev.publish_status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                                        {ev.publish_status}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-slate-500">{new Date(ev.created_at).toLocaleDateString()}</td>
                                <td className="p-4">
                                    {ev.publish_status !== 'Published' && (
                                        <button onClick={() => handlePublish(ev.id)} className="text-xs font-bold text-pink-500 hover:text-pink-600 flex items-center gap-1">
                                            <CheckCircle size={14} /> Publish
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
