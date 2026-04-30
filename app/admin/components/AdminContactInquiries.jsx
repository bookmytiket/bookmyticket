"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import { useSupabaseQuery, useSupabaseMutation } from "@/hooks/useSupabase";
import { Mail, Phone, MessageSquare, Clock, User, Trash2, CheckCircle, AlertCircle, Search, Filter, Globe, Shield } from "lucide-react";
import { useToast } from "@/context/ToastContext";

const AdminContactInquiries = ({ t, theme }) => {
    const { data: inquiries = [], loading, refresh } = useSupabaseQuery('contact_inquiries', (q) => q.order('created_at', { ascending: false }));
    const [updateInquiry] = useSupabaseMutation('contact_inquiries', 'update', (q, p) => q.eq('id', p.id));
    const [deleteInquiry] = useSupabaseMutation('contact_inquiries', 'delete', (q, p) => q.eq('id', p.id));
    const { showToast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const filteredInquiries = inquiries.filter(item => {
        const matchesSearch = 
            item.first_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            item.last_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.message.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = statusFilter === "all" || item.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const handleStatusChange = async (id, newStatus) => {
        try {
            await updateInquiry({ id, status: newStatus });
            showToast(`Inquiry marked as ${newStatus}`, "success");
            refresh();
        } catch (err) {
            showToast("Failed to update status", "error");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this inquiry?")) return;
        try {
            await deleteInquiry({ id });
            showToast("Inquiry deleted", "success");
            refresh();
        } catch (err) {
            showToast("Failed to delete inquiry", "error");
        }
    };

    if (loading) return <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Loading Inquiries...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black italic tracking-tighter uppercase text-slate-900 flex items-center gap-3">
                        <MessageSquare className="text-pink-500" />
                        Support Inquiries
                    </h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Manage and respond to user messages from the contact portal</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input 
                            type="text" 
                            placeholder="SEARCH INQUIRIES..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-pink-500/10 w-64"
                        />
                    </div>
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-pink-500/10"
                    >
                        <option value="all">ALL STATUS</option>
                        <option value="pending">PENDING</option>
                        <option value="resolved">RESOLVED</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredInquiries.length === 0 ? (
                    <div className="p-20 text-center bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm">
                            <Mail size={32} />
                        </div>
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No inquiries found</p>
                    </div>
                ) : (
                    filteredInquiries.map((inquiry) => (
                        <div key={inquiry.id} className="bg-white/70 backdrop-blur-md rounded-[24px] border border-white/20 p-6 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-pink-500/10 transition-all duration-300">
                            <div className="flex flex-col lg:flex-row gap-6">
                                <div className="lg:w-1/3 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 uppercase tracking-tight">{inquiry.first_name} {inquiry.last_name}</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{inquiry.company || 'Individual'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                                            <Mail size={14} className="text-pink-500" />
                                            {inquiry.email}
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                                            <Phone size={14} className="text-pink-500" />
                                            {inquiry.phone}
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                                            <Shield size={14} className="text-pink-500" />
                                            {inquiry.query_type}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        <Clock size={12} />
                                        {new Date(inquiry.created_at).toLocaleString()}
                                    </div>
                                </div>

                                <div className="lg:flex-1 bg-slate-50 rounded-2xl p-5 relative">
                                    <div className="absolute top-4 right-4">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                            inquiry.status === 'resolved' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                                        }`}>
                                            {inquiry.status}
                                        </span>
                                    </div>
                                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Message</h4>
                                    <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
                                        "{inquiry.message}"
                                    </p>
                                </div>

                                <div className="lg:w-48 flex lg:flex-col gap-2 justify-center">
                                    {inquiry.status !== 'resolved' && (
                                        <button 
                                            onClick={() => handleStatusChange(inquiry.id, 'resolved')}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20"
                                        >
                                            <CheckCircle size={14} /> Resolve
                                        </button>
                                    )}
                                    {inquiry.status === 'resolved' && (
                                        <button 
                                            onClick={() => handleStatusChange(inquiry.id, 'pending')}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
                                        >
                                            <AlertCircle size={14} /> Reopen
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => handleDelete(inquiry.id)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors border border-red-100"
                                    >
                                        <Trash2 size={14} /> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminContactInquiries;
