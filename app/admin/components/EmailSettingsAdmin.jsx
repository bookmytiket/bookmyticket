"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { Save, Mail, Shield, CheckCircle2, Server, Key } from "lucide-react";

export default function EmailSettingsAdmin({ theme, t }) {
    const [settings, setSettings] = useState({
        provider: 'MICROSOFT_365',
        host: '',
        port: 465,
        user_name: '',
        pass: '', // Basic SMTP or App Password
        from_email: '',
        from_name: 'BookMyTicket',
        encryption: 'TLS',
        auth_method: 'OAuth2', // Basic Authentication, OAuth2
        microsoft_365: {
            clientId: '',
            tenantId: '',
            clientSecret: ''
        }
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/email-settings');
            const { data } = await res.json();
            
            if (data) {
                setSettings({
                    id: data.id,
                    provider: data.provider || 'MICROSOFT_365',
                    host: data.host || '',
                    port: data.port || 465,
                    user_name: data.user_name || '',
                    pass: data.pass || '',
                    from_email: data.from_email || '',
                    from_name: data.from_name || '',
                    encryption: data.encryption || 'TLS',
                    auth_method: data.auth_method || 'OAuth2',
                    microsoft_365: data.microsoft_365 || { clientId: '', tenantId: '', clientSecret: '' }
                });
            }
        } catch (err) {
            console.error("Failed to fetch settings:", err);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        const payload = { ...settings };
        
        try {
            const res = await fetch('/api/admin/email-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();

            if (result.error) throw new Error(result.error);
            toast.success("Email settings saved successfully!");
            fetchSettings();
        } catch (error) {
            console.error("Save error:", error);
            toast.error("Failed to save email settings.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center p-10">Loading settings...</div>;

    return (
        <div className="space-y-8 max-w-4xl">
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-8">
                <div className="space-y-6">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Mail className="text-pink-500" size={16} /> Sender Identity
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sender Name</label>
                            <input 
                                type="text" 
                                value={settings.from_name} 
                                onChange={e => setSettings({...settings, from_name: e.target.value})} 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                                placeholder="e.g. BookMyTicket Notifications"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sender Email</label>
                            <input 
                                type="email" 
                                value={settings.from_email} 
                                onChange={e => setSettings({...settings, from_email: e.target.value})} 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                                placeholder="e.g. hello@bookmyticket.net"
                            />
                        </div>
                        {settings.auth_method !== 'OAuth2' && (
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Account Username / Email</label>
                                <input 
                                    type="email" 
                                    value={settings.user_name} 
                                    onChange={e => setSettings({...settings, user_name: e.target.value})} 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                                    placeholder="The email address used to authenticate"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {settings.auth_method === 'OAuth2' ? (
                    <div className="space-y-6 pt-6 border-t border-slate-100">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <Key className="text-pink-500" size={16} /> OAuth2 Credentials
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Application (Client) ID</label>
                                <input 
                                    type="text" 
                                    value={settings.microsoft_365?.clientId || ''} 
                                    onChange={e => setSettings({...settings, microsoft_365: { ...settings.microsoft_365, clientId: e.target.value }})} 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-pink-500 transition-all"
                                    placeholder="Your OAuth2 Client ID"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Directory (Tenant) ID</label>
                                <input 
                                    type="text" 
                                    value={settings.microsoft_365?.tenantId || ''} 
                                    onChange={e => setSettings({...settings, microsoft_365: { ...settings.microsoft_365, tenantId: e.target.value }})} 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-pink-500 transition-all"
                                    placeholder="Your Azure AD Tenant ID"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Client Secret</label>
                                <input 
                                    type="password" 
                                    value={settings.microsoft_365?.clientSecret || ''} 
                                    onChange={e => setSettings({...settings, microsoft_365: { ...settings.microsoft_365, clientSecret: e.target.value }})} 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-pink-500 transition-all"
                                    placeholder="Your OAuth2 Client Secret Value"
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 pt-6 border-t border-slate-100">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <Server className="text-blue-500" size={16} /> SMTP Connection Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">SMTP Host</label>
                                <input 
                                    type="text" 
                                    value={settings.host} 
                                    onChange={e => setSettings({...settings, host: e.target.value})} 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-all"
                                    placeholder="e.g. smtp.gmail.com"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">SMTP Port</label>
                                <input 
                                    type="number" 
                                    value={settings.port} 
                                    onChange={e => setSettings({...settings, port: parseInt(e.target.value)})} 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-all"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">SMTP Password / App Password</label>
                                <input 
                                    type="password" 
                                    value={settings.pass} 
                                    onChange={e => setSettings({...settings, pass: e.target.value})} 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-all"
                                    placeholder="Enter App Password for Gmail, or SMTP Password"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="pt-6 border-t border-slate-100 flex justify-end">
                    <button 
                        onClick={handleSave} 
                        disabled={saving}
                        className="flex items-center gap-2 px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all disabled:opacity-50"
                    >
                        {saving ? <span className="animate-spin text-white">⟳</span> : <Save size={16} />}
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
}
