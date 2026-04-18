"use client";
import { useState, useEffect } from "react";
import { Save, ShieldCheck, MessageSquare, Smartphone, Zap, Loader2, Link } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function CommunicationSettings() {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        const { data } = await supabase.from('communicationSettings').select('*').order('key');
        setSettings(data || []);
        setLoading(false);
    };

    const handleUpdateChange = (key, field, value) => {
        setSettings(prev => prev.map(s => {
            if (s.key === key) {
                return { ...s, value: { ...s.value, [field]: value } };
            }
            return s;
        }));
    };

    const saveSettings = async () => {
        setSaving(true);
        try {
            for (const setting of settings) {
                await supabase.from('communicationSettings').update({ 
                    value: setting.value,
                    updated_at: new Date()
                }).eq('key', setting.key);
            }
            alert("Settings updated successfully!");
        } catch (error) {
            console.error(error);
            alert("Failed to update settings.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-slate-300" /></div>;

    const fast2sms = settings.find(s => s.key === 'fast2sms')?.value || {};
    const whatsapp = settings.find(s => s.key === 'whatsapp')?.value || {};
    const otp = settings.find(s => s.key === 'otp_settings')?.value || {};

    return (
        <div className="max-w-4xl mx-auto p-10">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Communication Hub</h1>
                    <p className="text-slate-500 font-medium">Manage SMS, WhatsApp, and OTP configurations.</p>
                </div>
                <button 
                    onClick={saveSettings}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                    {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save size={18} />}
                    <span>Save Configuration</span>
                </button>
            </div>

            <div className="grid gap-8">
                {/* Fast2SMS Section */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-50 p-2 rounded-lg text-blue-500"><Smartphone size={20} /></div>
                            <div>
                                <h3 className="font-black text-slate-900 uppercase italic text-sm tracking-tight">Fast2SMS Integration</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Global SMS Gateway</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={fast2sms.enabled} onChange={(e) => handleUpdateChange('fast2sms', 'enabled', e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    <div className="p-8 grid gap-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">API Key</label>
                                <input 
                                    type="password"
                                    value={fast2sms.apiKey}
                                    onChange={(e) => handleUpdateChange('fast2sms', 'apiKey', e.target.value)}
                                    placeholder="Enter Fast2SMS Authorization Key"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-bold focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Sender ID</label>
                                <input 
                                    type="text"
                                    value={fast2sms.senderId}
                                    onChange={(e) => handleUpdateChange('fast2sms', 'senderId', e.target.value)}
                                    placeholder="e.g. FSTSMS"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-bold focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* OTP Settings */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="bg-amber-50 p-2 rounded-lg text-amber-500"><ShieldCheck size={20} /></div>
                            <div>
                                <h3 className="font-black text-slate-900 uppercase italic text-sm tracking-tight">Security & OTP Workflow</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Two-Factor Authentication</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={otp.enabled} onChange={(e) => handleUpdateChange('otp_settings', 'enabled', e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                        </label>
                    </div>
                    <div className="p-8">
                        <div className="flex items-center gap-6">
                            <div className="flex-1 space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">OTP Expiry (seconds)</label>
                                <input 
                                    type="number"
                                    value={otp.expirySeconds}
                                    onChange={(e) => handleUpdateChange('otp_settings', 'expirySeconds', parseInt(e.target.value))}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-bold focus:border-amber-500 outline-none transition-all"
                                />
                            </div>
                            <div className="flex-[2] bg-amber-50/50 border border-amber-100 p-4 rounded-xl">
                                <p className="text-[11px] font-medium text-amber-700 leading-relaxed italic">
                                    When enabled, users must verify their phone number via a 6-digit OTP before completing registration or logging in.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* WhatsApp Section */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm opacity-60">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-50 p-2 rounded-lg text-green-500"><MessageSquare size={20} /></div>
                            <div>
                                <h3 className="font-black text-slate-900 uppercase italic text-sm tracking-tight">WhatsApp Promotions</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Marketing Automation</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-black bg-slate-200 px-2.5 py-1 rounded-full uppercase tracking-tighter">Coming Soon</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
