"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/context/ToastContext";
import { Save, Edit, Settings, Layout, Mail, FileText, CheckCircle } from "lucide-react";

export default function ComplianceCMS() {
    const { showToast } = useToast();
    const [activeSection, setActiveSection] = useState("pages"); // 'pages', 'contact_form', 'settings'
    const [pages, setPages] = useState([]);
    const [enquiries, setEnquiries] = useState([]);
    const [companySettings, setCompanySettings] = useState({ company_name: "", support_email: "", support_phone: "", office_address: "", website_url: "" });
    
    const [editingPage, setEditingPage] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch CMS Pages
            const { data: pData } = await supabase.from("cms_pages").select("*").order("page_title");
            if (pData) setPages(pData);

            // Fetch Enquiries
            const { data: eData } = await supabase.from("contact_enquiries").select("*").order("created_at", { ascending: false });
            if (eData) setEnquiries(eData);

            // Fetch Settings
            const { data: sData } = await supabase.from("company_settings").select("*").maybeSingle();
            if (sData) setCompanySettings(sData);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSavePage = async () => {
        try {
            const { error } = await supabase.from("cms_pages").update({ 
                page_title: editingPage.page_title, 
                page_content: editingPage.page_content,
                status: editingPage.status,
                updated_at: new Date()
            }).eq("id", editingPage.id);

            if (error) throw error;
            showToast("Page updated successfully", "success");
            setEditingPage(null);
            fetchData();
        } catch (e) {
            showToast("Failed to update page", "error");
        }
    };

    const handleSaveSettings = async () => {
        try {
            const payload = { ...companySettings, updated_at: new Date() };
            let error;
            if (companySettings.id) {
                const { error: e } = await supabase.from("company_settings").update(payload).eq("id", companySettings.id);
                error = e;
            } else {
                const { error: e } = await supabase.from("company_settings").insert([payload]);
                error = e;
            }

            if (error) throw error;
            showToast("Company settings updated successfully", "success");
            fetchData();
        } catch (e) {
            showToast("Failed to update settings", "error");
        }
    };

    const handleUpdateEnquiryStatus = async (id, status) => {
        try {
            const { error } = await supabase.from("contact_enquiries").update({ status }).eq("id", id);
            if (error) throw error;
            showToast("Enquiry status updated", "success");
            fetchData();
        } catch (e) {
            showToast("Failed to update status", "error");
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-500 font-medium">Loading Compliance Module...</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 lg:p-0">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Compliance & CMS</h2>
                <p className="text-sm text-slate-500 font-medium">Manage legal pages, public contact information, and incoming support enquiries.</p>
            </div>

            {/* Sub Nav */}
            <div className="flex gap-4 border-b border-slate-200 pb-4">
                <button onClick={() => setActiveSection("pages")} className={`px-4 py-2 font-black uppercase text-xs rounded-xl transition-all ${activeSection === 'pages' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Legal & Info Pages</button>
                <button onClick={() => setActiveSection("settings")} className={`px-4 py-2 font-black uppercase text-xs rounded-xl transition-all ${activeSection === 'settings' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Company Profile</button>
                <button onClick={() => setActiveSection("contact_form")} className={`px-4 py-2 font-black uppercase text-xs rounded-xl transition-all ${activeSection === 'contact_form' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Contact Enquiries</button>
            </div>

            {/* Pages Section */}
            {activeSection === "pages" && (
                <div className="grid grid-cols-1 gap-6">
                    {!editingPage ? (
                        pages.map(page => (
                            <div key={page.id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 tracking-tight">{page.page_title}</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Slug: /{page.page_key} | Status: {page.status}</p>
                                    </div>
                                </div>
                                <button onClick={() => setEditingPage(page)} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all">
                                    <Edit size={14} /> Edit Content
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                <h3 className="text-xl font-black text-slate-900 uppercase">Edit: {editingPage.page_title}</h3>
                                <button onClick={() => setEditingPage(null)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">Cancel</button>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Page Title</label>
                                    <input value={editingPage.page_title} onChange={e => setEditingPage({...editingPage, page_title: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Content (Paragraphs separated by new lines)</label>
                                    <textarea rows={12} value={editingPage.page_content} onChange={e => setEditingPage({...editingPage, page_content: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all resize-none" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Status</label>
                                    <select value={editingPage.status} onChange={e => setEditingPage({...editingPage, status: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all">
                                        <option value="published">Published</option>
                                        <option value="draft">Draft</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex justify-end">
                                <button onClick={handleSavePage} className="px-8 py-4 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-black uppercase text-xs tracking-widest flex items-center gap-2 transition-colors shadow-lg shadow-pink-500/30">
                                    <Save size={16} /> Save Changes
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Settings Section */}
            {activeSection === "settings" && (
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-8">
                    <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                        <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                            <Settings size={28} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Public Company Profile</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">This information appears on the Contact Us page and footer</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Company Name</label>
                            <input value={companySettings?.company_name || ""} onChange={e => setCompanySettings({...companySettings, company_name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Support Email</label>
                            <input value={companySettings?.support_email || ""} onChange={e => setCompanySettings({...companySettings, support_email: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Support Phone</label>
                            <input value={companySettings?.support_phone || ""} onChange={e => setCompanySettings({...companySettings, support_phone: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Website URL</label>
                            <input value={companySettings?.website_url || ""} onChange={e => setCompanySettings({...companySettings, website_url: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Office Address</label>
                            <textarea rows={3} value={companySettings?.office_address || ""} onChange={e => setCompanySettings({...companySettings, office_address: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 resize-none" />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex justify-end">
                        <button onClick={handleSaveSettings} className="px-8 py-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest flex items-center gap-2 transition-colors shadow-lg shadow-slate-900/20">
                            <Save size={16} /> Save Company Settings
                        </button>
                    </div>
                </div>
            )}

            {/* Contact Enquiries */}
            {activeSection === "contact_form" && (
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                            <Mail size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Support Enquiries</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Messages submitted via the Contact Us page</p>
                        </div>
                    </div>
                    
                    <div className="divide-y divide-slate-100">
                        {enquiries.length === 0 ? (
                            <div className="p-12 text-center text-slate-500 font-medium">No enquiries received yet.</div>
                        ) : enquiries.map(enquiry => (
                            <div key={enquiry.id} className="p-6 md:p-8 hover:bg-slate-50 transition-colors flex flex-col md:flex-row gap-6 justify-between">
                                <div className="space-y-3 flex-1">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${enquiry.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {enquiry.status}
                                        </span>
                                        <span className="text-xs text-slate-400 font-medium">{new Date(enquiry.created_at).toLocaleString()}</span>
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-slate-900">{enquiry.subject}</h4>
                                        <p className="text-sm font-medium text-slate-500 mt-1">{enquiry.name} • <a href={`mailto:${enquiry.email}`} className="text-pink-600 hover:underline">{enquiry.email}</a> • {enquiry.mobile}</p>
                                    </div>
                                    <div className="p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 leading-relaxed font-medium">
                                        {enquiry.message}
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    {enquiry.status !== 'resolved' && (
                                        <button onClick={() => handleUpdateEnquiryStatus(enquiry.id, 'resolved')} className="px-6 py-3 bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 transition-all">
                                            <CheckCircle size={14} /> Mark Resolved
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
}
