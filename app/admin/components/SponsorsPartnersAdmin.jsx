"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
    Plus, Edit, Trash2, Check, X, Image as ImageIcon, Loader2, Link as LinkIcon, Handshake, Target, Settings, Building2
} from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function SponsorsPartnersAdmin() {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState("assets"); // 'assets' or 'assignment'
    const [assetType, setAssetType] = useState("sponsors"); // 'sponsors' or 'partners'
    
    // Data States
    const [sponsors, setSponsors] = useState([]);
    const [partners, setPartners] = useState([]);
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState("");
    const [eventBranding, setEventBranding] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    
    const [formData, setFormData] = useState({
        id: null,
        name: "",
        logo_url: "",
        website_url: "",
        status: "active",
        display_order: 0
    });

    useEffect(() => {
        fetchData();
        fetchEvents();
    }, []);

    useEffect(() => {
        if (selectedEventId) {
            fetchEventBranding(selectedEventId);
        } else {
            setEventBranding([]);
        }
    }, [selectedEventId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [sponsorsRes, partnersRes] = await Promise.all([
                supabase.from('sponsors').select('*').order('display_order', { ascending: true }),
                supabase.from('partners').select('*').order('display_order', { ascending: true })
            ]);
            
            if (sponsorsRes.error) throw sponsorsRes.error;
            if (partnersRes.error) throw partnersRes.error;

            setSponsors(sponsorsRes.data || []);
            setPartners(partnersRes.data || []);
        } catch (error) {
            console.error("Error fetching data:", error);
            showToast("Failed to load branding assets", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchEvents = async () => {
        try {
            const { data, error } = await supabase.from('events').select('id, title, date').order('date', { ascending: false });
            if (!error && data) setEvents(data);
        } catch (err) {
            console.error("Failed to fetch events");
        }
    };

    const fetchEventBranding = async (eventId) => {
        try {
            const { data, error } = await supabase
                .from('event_branding')
                .select('*, sponsors(*), partners(*)')
                .eq('event_id', eventId);
            if (!error && data) setEventBranding(data);
        } catch (err) {
            console.error("Failed to fetch event branding");
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${assetType}-${Date.now()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from('branding')
                .upload(fileName, file, { cacheControl: '3600', upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('branding')
                .getPublicUrl(fileName);

            setFormData(prev => ({ ...prev, logo_url: publicUrl }));
            showToast("Logo uploaded successfully!", "success");
        } catch (error) {
            console.error("Upload error:", error);
            showToast("Failed to upload logo", "error");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const table = assetType === 'sponsors' ? 'sponsors' : 'partners';
            
            if (formData.id) {
                const { error } = await supabase
                    .from(table)
                    .update({
                        name: formData.name,
                        logo_url: formData.logo_url,
                        website_url: formData.website_url,
                        status: formData.status,
                        display_order: parseInt(formData.display_order) || 0
                    })
                    .eq('id', formData.id);
                if (error) throw error;
                showToast("Updated successfully", "success");
            } else {
                const { error } = await supabase
                    .from(table)
                    .insert([{
                        name: formData.name,
                        logo_url: formData.logo_url,
                        website_url: formData.website_url,
                        status: formData.status,
                        display_order: parseInt(formData.display_order) || 0
                    }]);
                if (error) throw error;
                showToast("Added successfully", "success");
            }
            
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error("Save error:", error);
            showToast("Failed to save changes", "error");
        }
    };

    const handleDelete = async (id, table) => {
        if (!confirm("Are you sure you want to delete this record?")) return;
        try {
            const { error } = await supabase.from(table).delete().eq('id', id);
            if (error) throw error;
            showToast("Deleted successfully", "success");
            fetchData();
        } catch (error) {
            console.error("Delete error:", error);
            showToast("Failed to delete", "error");
        }
    };

    const openEditModal = (item) => {
        setFormData(item);
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        setFormData({
            id: null,
            name: "",
            logo_url: "",
            website_url: "",
            status: "active",
            display_order: 0
        });
        setIsModalOpen(true);
    };

    const assignToEvent = async (itemId, type) => {
        if (!selectedEventId) {
            showToast("Please select an event first", "error");
            return;
        }

        const isSponsor = type === 'sponsor';
        const exists = eventBranding.find(eb => isSponsor ? eb.sponsor_id === itemId : eb.partner_id === itemId);
        
        if (exists) {
            showToast("Already assigned to this event", "error");
            return;
        }

        try {
            const payload = {
                event_id: selectedEventId,
                sponsor_id: isSponsor ? itemId : null,
                partner_id: !isSponsor ? itemId : null,
                show_on_event_page: true,
                show_on_ticket: true,
                show_on_invoice: true,
                show_on_email: true,
                show_on_mobile: true
            };
            
            const { error } = await supabase.from('event_branding').insert([payload]);
            if (error) throw error;
            showToast("Assigned to event!", "success");
            fetchEventBranding(selectedEventId);
        } catch (err) {
            console.error(err);
            showToast("Failed to assign", "error");
        }
    };

    const removeAssignment = async (id) => {
        try {
            const { error } = await supabase.from('event_branding').delete().eq('id', id);
            if (error) throw error;
            fetchEventBranding(selectedEventId);
            showToast("Removed assignment", "success");
        } catch (err) {
            showToast("Failed to remove", "error");
        }
    };

    const updateVisibility = async (id, field, value) => {
        try {
            const { error } = await supabase.from('event_branding').update({ [field]: value }).eq('id', id);
            if (error) throw error;
            fetchEventBranding(selectedEventId);
        } catch (err) {
            showToast("Update failed", "error");
        }
    };

    const currentAssets = assetType === 'sponsors' ? sponsors : partners;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 font-sans overflow-hidden">
            <div className="bg-slate-900 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                        <Building2 className="text-yellow-400" />
                        Sponsors & Partners
                    </h2>
                    <p className="text-slate-400 font-medium text-sm mt-1">
                        Centralized management for event branding and partnerships.
                    </p>
                </div>
                
                <div className="flex bg-slate-800 p-1 rounded-xl">
                    <button 
                        onClick={() => setActiveTab('assets')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'assets' ? 'bg-pink-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        Asset Management
                    </button>
                    <button 
                        onClick={() => setActiveTab('assignment')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'assignment' ? 'bg-pink-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        Event Assignment
                    </button>
                </div>
            </div>

            {activeTab === 'assets' && (
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex bg-slate-100 p-1 rounded-xl w-max">
                            <button 
                                onClick={() => setAssetType('sponsors')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-colors ${assetType === 'sponsors' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                            >
                                <Target size={16} className={assetType === 'sponsors' ? 'text-pink-500' : ''} />
                                Sponsors
                            </button>
                            <button 
                                onClick={() => setAssetType('partners')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-colors ${assetType === 'partners' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                            >
                                <Handshake size={16} className={assetType === 'partners' ? 'text-yellow-500' : ''} />
                                Partners
                            </button>
                        </div>
                        <button 
                            onClick={openCreateModal}
                            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-md shadow-slate-900/20"
                        >
                            <Plus size={18} className="text-yellow-400" /> Add New {assetType === 'sponsors' ? 'Sponsor' : 'Partner'}
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-pink-500" /></div>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-100">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50">
                                        <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-400">Logo</th>
                                        <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-400">Name</th>
                                        <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-400">Website</th>
                                        <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-400">Order</th>
                                        <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-400">Status</th>
                                        <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {currentAssets.length === 0 ? (
                                        <tr><td colSpan="6" className="p-10 text-center text-slate-400 font-medium">No {assetType} found.</td></tr>
                                    ) : currentAssets.map(item => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4">
                                                <div className="w-16 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                                                    {item.logo_url ? <img src={item.logo_url} className="max-w-full max-h-full object-contain p-1" /> : <ImageIcon size={16} className="text-slate-400" />}
                                                </div>
                                            </td>
                                            <td className="p-4 font-bold text-slate-900">{item.name}</td>
                                            <td className="p-4">
                                                {item.website_url ? <a href={item.website_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-500 hover:text-blue-600 text-sm font-medium"><LinkIcon size={14} /> Link</a> : '-'}
                                            </td>
                                            <td className="p-4"><span className="px-3 py-1 bg-slate-100 rounded-lg font-mono text-sm font-bold text-slate-700">{item.display_order}</span></td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                    item.status === 'active' ? 'bg-green-100 text-green-700' : 
                                                    item.status === 'archived' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => openEditModal(item)} className="p-2 text-slate-400 hover:text-blue-500 transition-colors bg-white border border-slate-100 shadow-sm rounded-lg hover:border-blue-200"><Edit size={16} /></button>
                                                    <button onClick={() => handleDelete(item.id, assetType)} className="p-2 text-slate-400 hover:text-red-500 transition-colors bg-white border border-slate-100 shadow-sm rounded-lg hover:border-red-200"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'assignment' && (
                <div className="p-6">
                    <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Select Event to Configure Branding</label>
                        <select 
                            value={selectedEventId}
                            onChange={(e) => setSelectedEventId(e.target.value)}
                            className="w-full max-w-xl px-4 py-3 rounded-xl border border-slate-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all font-bold text-slate-900 bg-white"
                        >
                            <option value="">-- Choose an Event --</option>
                            {events.map(ev => (
                                <option key={ev.id} value={ev.id}>{ev.title} ({new Date(ev.date).toLocaleDateString()})</option>
                            ))}
                        </select>
                    </div>

                    {selectedEventId && (
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2"><Target className="text-pink-500" /> Active Event Branding</h3>
                                {eventBranding.length === 0 ? (
                                    <div className="p-10 border-2 border-dashed border-slate-200 rounded-2xl text-center">
                                        <p className="text-slate-500 font-medium">No sponsors or partners assigned to this event yet.</p>
                                        <p className="text-slate-400 text-sm mt-1">Select from the available assets below.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {eventBranding.map(eb => {
                                            const item = eb.sponsors || eb.partners;
                                            const type = eb.sponsor_id ? 'Sponsor' : 'Partner';
                                            return (
                                                <div key={eb.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm gap-4">
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 p-1 flex-shrink-0">
                                                            {item?.logo_url ? <img src={item.logo_url} className="w-full h-full object-contain" /> : <ImageIcon className="w-full h-full text-slate-300" />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-slate-900 truncate">{item?.name}</p>
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{type}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100 flex-1 md:flex-none justify-center">
                                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                                            <input type="checkbox" checked={eb.show_on_event_page} onChange={(e) => updateVisibility(eb.id, 'show_on_event_page', e.target.checked)} className="rounded text-pink-500 focus:ring-pink-500 w-4 h-4" />
                                                            <span className="text-[10px] font-bold uppercase text-slate-600">Event Page</span>
                                                        </label>
                                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                                            <input type="checkbox" checked={eb.show_on_ticket} onChange={(e) => updateVisibility(eb.id, 'show_on_ticket', e.target.checked)} className="rounded text-pink-500 focus:ring-pink-500 w-4 h-4" />
                                                            <span className="text-[10px] font-bold uppercase text-slate-600">Tickets</span>
                                                        </label>
                                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                                            <input type="checkbox" checked={eb.show_on_invoice} onChange={(e) => updateVisibility(eb.id, 'show_on_invoice', e.target.checked)} className="rounded text-pink-500 focus:ring-pink-500 w-4 h-4" />
                                                            <span className="text-[10px] font-bold uppercase text-slate-600">Invoices</span>
                                                        </label>
                                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                                            <input type="checkbox" checked={eb.show_on_email} onChange={(e) => updateVisibility(eb.id, 'show_on_email', e.target.checked)} className="rounded text-pink-500 focus:ring-pink-500 w-4 h-4" />
                                                            <span className="text-[10px] font-bold uppercase text-slate-600">Emails</span>
                                                        </label>
                                                    </div>

                                                    <button onClick={() => removeAssignment(eb.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors flex-shrink-0">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="pt-8 border-t border-slate-100">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Available Assets</h3>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {[...sponsors.map(s => ({...s, _type: 'sponsor'})), ...partners.map(p => ({...p, _type: 'partner'}))].filter(a => a.status === 'active').map(asset => {
                                        const isAssigned = eventBranding.some(eb => eb.sponsor_id === asset.id || eb.partner_id === asset.id);
                                        return (
                                            <div key={`${asset._type}-${asset.id}`} className={`p-4 rounded-xl border flex items-center justify-between ${isAssigned ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200 shadow-sm'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded bg-slate-100 p-1"><img src={asset.logo_url} className="w-full h-full object-contain" /></div>
                                                    <div>
                                                        <p className="font-bold text-sm text-slate-900 truncate max-w-[120px]">{asset.name}</p>
                                                        <p className="text-[9px] font-black uppercase text-slate-400">{asset._type}</p>
                                                    </div>
                                                </div>
                                                {!isAssigned ? (
                                                    <button onClick={() => assignToEvent(asset.id, asset._type)} className="p-1.5 bg-slate-900 text-white rounded-md hover:bg-pink-500 transition-colors"><Plus size={16} /></button>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest"><Check size={16} /></span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                                {formData.id ? <Edit size={18} className="text-pink-500" /> : <Plus size={18} className="text-pink-500" />}
                                {formData.id ? `Edit ${assetType === 'sponsors' ? 'Sponsor' : 'Partner'}` : `New ${assetType === 'sponsors' ? 'Sponsor' : 'Partner'}`}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Brand Name</label>
                                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none font-bold text-slate-900" placeholder="e.g. Nike, Red Bull" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Logo Upload (Required)</label>
                                    <div className="flex gap-4 items-center">
                                        <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 overflow-hidden shrink-0 relative group">
                                            {isUploading ? (
                                                <Loader2 size={24} className="animate-spin text-pink-500" />
                                            ) : formData.logo_url ? (
                                                <img src={formData.logo_url} className="max-w-full max-h-full object-contain p-2" />
                                            ) : (
                                                <ImageIcon size={24} className="text-slate-300 group-hover:text-pink-400 transition-colors" />
                                            )}
                                            <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-slate-600">Click the box to upload</p>
                                            <p className="text-[10px] font-medium text-slate-400 mt-1">Recommended: Square or horizontal transparent PNG, max 2MB.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Website URL</label>
                                    <input type="url" value={formData.website_url || ''} onChange={e => setFormData({...formData, website_url: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-pink-500 outline-none font-medium text-slate-900" placeholder="https://" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sort Order</label>
                                        <input type="number" value={formData.display_order} onChange={e => setFormData({...formData, display_order: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 font-mono text-slate-900 outline-none focus:border-pink-500" min="0" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</label>
                                        <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-pink-500 font-bold text-slate-900">
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="archived">Archived</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end gap-3">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
                                    <button type="submit" disabled={isUploading || !formData.logo_url} className="px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[11px] text-white bg-slate-900 hover:bg-pink-500 transition-colors shadow-lg disabled:opacity-50">
                                        {formData.id ? 'Save Changes' : 'Create Asset'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
