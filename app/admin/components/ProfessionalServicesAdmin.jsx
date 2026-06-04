/* eslint-disable */
'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Briefcase, Plus, CheckCircle } from 'lucide-react';

export default function ProfessionalServicesAdmin() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        service_name: '',
        category: 'Photographer',
        provider_name: '',
        phone: '',
        email: '',
        pricing: 0,
        status: 'Pending'
    });

    

    const fetchServices = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('professional_services').select('*').order('created_at', { ascending: false });
        if (data) setServices(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        const { data, error } = await supabase.from('professional_services').insert([formData]);
        if (!error) {
            setShowForm(false);
            fetchServices();
        }
    };

    const handlePublish = async (id) => {
        await supabase.from('professional_services').update({ status: 'Published' }).eq('id', id);
        fetchServices();
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <Briefcase className="text-blue-500" />
                        Professional Services
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Directly onboard and manage professional service providers.</p>
                </div>
                <button 
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 text-sm flex items-center gap-2">
                    <Plus size={16} /> Onboard Service
                </button>
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Onboard New Provider</h3>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Business/Service Name</label>
                            <input required type="text" className="w-full p-2 border border-slate-200 rounded-lg" value={formData.service_name} onChange={e => setFormData({...formData, service_name: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Category</label>
                            <select className="w-full p-2 border border-slate-200 rounded-lg" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                <option>Photographer</option>
                                <option>Videographer</option>
                                <option>Makeup Artist</option>
                                <option>Mehendi Artist</option>
                                <option>DJ Services</option>
                                <option>Turf Booking</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Provider Name</label>
                            <input required type="text" className="w-full p-2 border border-slate-200 rounded-lg" value={formData.provider_name} onChange={e => setFormData({...formData, provider_name: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Pricing (Starting At)</label>
                            <input required type="number" className="w-full p-2 border border-slate-200 rounded-lg" value={formData.pricing} onChange={e => setFormData({...formData, pricing: e.target.value})} />
                        </div>
                        <div className="md:col-span-2">
                            <button type="submit" className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800">
                                Save Profile
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-100">
                            <th className="p-4 font-bold">Service</th>
                            <th className="p-4 font-bold">Provider</th>
                            <th className="p-4 font-bold">Category</th>
                            <th className="p-4 font-bold">Pricing</th>
                            <th className="p-4 font-bold">Status</th>
                            <th className="p-4 font-bold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {services.map(srv => (
                            <tr key={srv.id} className="border-b border-slate-50">
                                <td className="p-4 font-bold text-slate-800">{srv.service_name}</td>
                                <td className="p-4 text-slate-600">{srv.provider_name}</td>
                                <td className="p-4 text-slate-600">{srv.category}</td>
                                <td className="p-4 font-bold text-slate-800">₹{srv.pricing}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 text-[10px] font-black uppercase rounded-full ${srv.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                                        {srv.status}
                                    </span>
                                </td>
                                <td className="p-4">
                                    {srv.status !== 'Published' && (
                                        <button onClick={() => handlePublish(srv.id)} className="text-xs font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1">
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
