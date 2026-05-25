"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { Save, Mail, Shield, CheckCircle2, Server, Key } from "lucide-react";

export default function EmailSettingsAdmin({ theme, t }) {
    const [settings, setSettings] = useState({
        provider: 'GOOGLE_OAUTH2',
        host: 'smtp.gmail.com',
        port: 465,
        user_name: '',
        pass: '', // Basic SMTP or App Password
        from_email: '',
        from_name: 'BookMyTicket',
        encryption: 'TLS',
        auth_method: 'OAuth2', // Basic Authentication, OAuth2
        google_oauth2: {
            clientId: '',
            clientSecret: '',
            refreshToken: ''
        }
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('email_settings').select('*').limit(1).single();
        if (data) {
            setSettings({
                id: data.id,
                provider: data.provider || 'GOOGLE_OAUTH2',
                host: data.host || '',
                port: data.port || 465,
                user_name: data.user_name || '',
                pass: data.pass || '',
                from_email: data.from_email || '',
                from_name: data.from_name || '',
                encryption: data.encryption || 'TLS',
                auth_method: data.auth_method || 'OAuth2',
                google_oauth2: data.google_oauth2 || { clientId: '', clientSecret: '', refreshToken: '' }
            });
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        const payload = { ...settings };
        delete payload.id; // Remove ID for upsert/insert if needed

        try {
            let res;
            if (settings.id) {
                res = await supabase.from('email_settings').update(payload).eq('id', settings.id);
            } else {
                res = await supabase.from('email_settings').insert([payload]);
            }

            if (res.error) throw res.error;
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
            <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-2">Email Configuration</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Manage SMTP and OAuth2 Mail Infrastructure</p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-8">
                {/* Auth Method Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                        onClick={() => setSettings({ ...settings, auth_method: 'OAuth2', provider: 'GOOGLE_OAUTH2', host: 'smtp.gmail.com' })}
                        className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${settings.auth_method === 'OAuth2' ? 'border-pink-500 bg-pink-50/30' : 'border-slate-100 hover:border-slate-300'}`}
                    >
                        <Shield className={settings.auth_method === 'OAuth2' ? 'text-pink-500' : 'text-slate-400'} size={24} />
                        <div>
                            <h3 className="font-bold text-slate-900 mb-1">OAuth2 (Recommended)</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">Secure client ID and secret based authentication. Best for Gmail/Google Workspace to avoid App Password limits.</p>
                        </div>
                    </div>
                    
                    <div 
                        onClick={() => setSettings({ ...settings, auth_method: 'Basic Authentication' })}
                        className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${settings.auth_method === 'Basic Authentication' ? 'border-blue-500 bg-blue-50/30' : 'border-slate-100 hover:border-slate-300'}`}
                    >
                        <Server className={settings.auth_method === 'Basic Authentication' ? 'text-blue-500' : 'text-slate-400'} size={24} />
                        <div>
                            <h3 className="font-bold text-slate-900 mb-1">Basic SMTP</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">Traditional SMTP using Host, Port, Username and App Password. Works with SendGrid, Amazon SES, or custom servers.</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 pt-6 border-t border-slate-100">
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
                    </div>
                </div>

                {settings.auth_method === 'OAuth2' ? (
                    <div className="space-y-6 pt-6 border-t border-slate-100">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <Key className="text-pink-500" size={16} /> OAuth2 Credentials
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Client ID</label>
                                <input 
                                    type="text" 
                                    value={settings.google_oauth2?.clientId || ''} 
                                    onChange={e => setSettings({...settings, google_oauth2: { ...settings.google_oauth2, clientId: e.target.value }})} 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-pink-500 transition-all"
                                    placeholder="Your OAuth2 Client ID"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Client Secret</label>
                                <input 
                                    type="password" 
                                    value={settings.google_oauth2?.clientSecret || ''} 
                                    onChange={e => setSettings({...settings, google_oauth2: { ...settings.google_oauth2, clientSecret: e.target.value }})} 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-pink-500 transition-all"
                                    placeholder="Your OAuth2 Client Secret"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Refresh Token</label>
                                <input 
                                    type="password" 
                                    value={settings.google_oauth2?.refreshToken || ''} 
                                    onChange={e => setSettings({...settings, google_oauth2: { ...settings.google_oauth2, refreshToken: e.target.value }})} 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-pink-500 transition-all"
                                    placeholder="Your OAuth2 Refresh Token"
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
