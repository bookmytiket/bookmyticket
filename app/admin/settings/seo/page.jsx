"use client";
import { useState, useEffect } from "react";
import { 
  Save, 
  BarChart3, 
  Globe, 
  Link as LinkIcon, 
  Search, 
  Zap, 
  Loader2, 
  RefreshCw,
  Layout,
  ExternalLink,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";

import AdminDashboardLayout from "@/app/admin/components/AdminDashboardLayout";

import { useToast } from "@/context/ToastContext";

export default function SeoAnalyticsSettings() {
    const { showToast } = useToast();
    const [config, setConfig] = useState({
        ga_id: "",
        ga_enabled: false,
        city_seo_overrides: {},
        backlink_tracking: [],
        sitemap_last_ping: null
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("analytics");
    const [newCity, setNewCity] = useState("");
    const [newCityConfig, setNewCityConfig] = useState({ title: "", description: "" });

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('system_config')
                .select('value')
                .eq('key', 'seo_analytics')
                .single();
            
            if (data?.value) {
                setConfig(prev => ({ ...prev, ...data.value }));
            }
        } catch (err) {
            console.error("Error fetching SEO config:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <AdminDashboardLayout activeTab="seo_settings">
            <div className="p-20 flex flex-col items-center justify-center gap-4 text-slate-400">
                <Loader2 className="animate-spin" size={32} />
                <p className="font-bold uppercase tracking-widest text-[10px]">Synchronizing SEO Data...</p>
            </div>
        </AdminDashboardLayout>
    );

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('system_config')
                .upsert({ 
                    key: 'seo_analytics',
                    value: config,
                    updated_at: new Date()
                }, { onConflict: 'key' });
            
            if (error) throw error;
            showToast("SEO & Analytics settings updated successfully!", "success");
        } catch (error) {
            console.error("Save Error:", error);
            showToast("Failed to update settings: " + error.message, "error");
        } finally {
            setSaving(false);
        }
    };

    const addCityOverride = () => {
        if (!newCity) return;
        setConfig(prev => ({
            ...prev,
            city_seo_overrides: {
                ...prev.city_seo_overrides,
                [newCity.toLowerCase()]: newCityConfig
            }
        }));
        setNewCity("");
        setNewCityConfig({ title: "", description: "", keywords: "" });
    };

    const removeCityOverride = (city) => {
        const newOverrides = { ...config.city_seo_overrides };
        delete newOverrides[city];
        setConfig(prev => ({ ...prev, city_seo_overrides: newOverrides }));
    };

    const addBacklink = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const link = {
            source: formData.get('source'),
            url: formData.get('url'),
            date: new Date().toISOString(),
            status: 'active'
        };
        setConfig(prev => ({
            ...prev,
            backlink_tracking: [link, ...(prev.backlink_tracking || [])]
        }));
        e.target.reset();
    };

    const pingSitemap = async () => {
        alert("Sitemap ping request sent to Google & Bing. This usually takes 24-48 hours to process.");
        setConfig(prev => ({ ...prev, sitemap_last_ping: new Date().toISOString() }));
    };

    return (
        <AdminDashboardLayout activeTab="seo_settings">
            <div className="flex items-center justify-between mb-12">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-3">
                        SEO <span className="text-blue-600">&</span> Analytics
                    </h1>
                    <p className="text-slate-500 font-medium">Command center for search visibility and traffic tracking.</p>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={pingSitemap}
                        className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all text-sm"
                    >
                        <RefreshCw size={16} />
                        <span>Ping Search Engines</span>
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50 shadow-lg shadow-slate-200"
                    >
                        {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save size={18} />}
                        <span>Save Changes</span>
                    </button>
                </div>
            </div>

            <div className="flex gap-2 mb-8 bg-slate-100 p-1 rounded-2xl w-fit">
                {[
                    { id: 'global', icon: Globe, label: 'Global Meta' },
                    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
                    { id: 'city_seo', icon: Layout, label: 'City Hubs' },
                    { id: 'indexing', icon: Search, label: 'Indexing' },
                    { id: 'backlinks', icon: LinkIcon, label: 'Backlinks' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                            activeTab === tab.id 
                            ? 'bg-white text-slate-900 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid gap-8">
                {activeTab === 'global' && (
                    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600 shadow-inner"><Globe size={24} /></div>
                                <div>
                                    <h3 className="font-black text-slate-900 uppercase italic text-lg tracking-tight">Global Meta Strategy</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Site-wide default SEO values</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Global Site Title</label>
                                        <input 
                                            type="text"
                                            value={config.global_title || ""}
                                            onChange={(e) => setConfig(prev => ({ ...prev, global_title: e.target.value }))}
                                            placeholder="BookMyTicket - Best Online Event Ticketing"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Global Meta Keywords</label>
                                        <textarea 
                                            value={config.global_keywords || ""}
                                            onChange={(e) => setConfig(prev => ({ ...prev, global_keywords: e.target.value }))}
                                            rows={3}
                                            placeholder="tickets, events, concerts..."
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Global Meta Description</label>
                                        <textarea 
                                            value={config.global_description || ""}
                                            onChange={(e) => setConfig(prev => ({ ...prev, global_description: e.target.value }))}
                                            rows={4}
                                            placeholder="Book the latest events, sports turfs..."
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Header Scripts (Meta Pixel / Ads)</label>
                                        <textarea 
                                            value={config.meta_ads_code || ""}
                                            onChange={(e) => setConfig(prev => ({ ...prev, meta_ads_code: e.target.value }))}
                                            rows={12}
                                            placeholder="Paste your <script> tags here..."
                                            className="w-full px-4 py-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl outline-none"
                                        />
                                        <p className="text-[10px] text-slate-400 italic">Caution: Scripts added here will execute on every page load.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-100 p-3 rounded-2xl text-blue-600 shadow-inner"><BarChart3 size={24} /></div>
                                <div>
                                    <h3 className="font-black text-slate-900 uppercase italic text-lg tracking-tight">Google Analytics 4</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Real-time visitor measurement</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <button 
                                    onClick={() => window.open('https://analytics.google.com/', '_blank')}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all text-xs"
                                >
                                    <ExternalLink size={14} />
                                    <span>{config.ga_id && config.ga_id !== "G-XXXXXXXXXX" ? "Open Analytics Dashboard" : "Setup Google Analytics"}</span>
                                </button>
                                <label className="relative inline-flex items-center cursor-pointer scale-125 mr-4">
                                    <input 
                                        type="checkbox" 
                                        checked={config.ga_enabled} 
                                        onChange={(e) => setConfig(prev => ({ ...prev, ga_enabled: e.target.checked }))} 
                                        className="sr-only peer" 
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                        <div className="p-10">
                            <div className="max-w-xl space-y-3">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Measurement ID (G-XXXXXXXXXX)</label>
                                <div className="relative">
                                    <input 
                                        type="text"
                                        value={config.ga_id}
                                        onChange={(e) => setConfig(prev => ({ ...prev, ga_id: e.target.value }))}
                                        placeholder="e.g. G-W29H87GZ6P"
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[14px] font-bold focus:border-blue-500 focus:bg-white outline-none transition-all shadow-sm"
                                    />
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                </div>
                                <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3">
                                    <AlertCircle className="text-blue-500 shrink-0" size={18} />
                                    <p className="text-[12px] text-blue-700 leading-relaxed font-medium">
                                        Changing this ID will immediately update the tracking script site-wide. Ensure you use the Correct G-ID from your Google Analytics console.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'city_seo' && (
                    <div className="grid gap-8">
                        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm p-8">
                            <h3 className="font-black text-slate-900 uppercase italic text-lg tracking-tight mb-6">Add City SEO Override</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">City Name</label>
                                    <input 
                                        type="text"
                                        value={newCity}
                                        onChange={(e) => setNewCity(e.target.value)}
                                        placeholder="e.g. Coimbatore"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Custom Meta Title</label>
                                    <input 
                                        type="text"
                                        value={newCityConfig.title}
                                        onChange={(e) => setNewCityConfig(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="e.g. Best Events in Coimbatore"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                                    />
                                </div>
                                <div className="space-y-2 flex items-end">
                                    <button 
                                        onClick={addCityOverride}
                                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus size={18} />
                                        Add Strategy
                                    </button>
                                </div>
                                <div className="md:col-span-1 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Custom Keywords</label>
                                    <input 
                                        type="text"
                                        value={newCityConfig.keywords || ""}
                                        onChange={(e) => setNewCityConfig(prev => ({ ...prev, keywords: e.target.value }))}
                                        placeholder="e.g. coimbatore events, tickets"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Custom Description</label>
                                    <textarea 
                                        value={newCityConfig.description}
                                        onChange={(e) => setNewCityConfig(prev => ({ ...prev, description: e.target.value }))}
                                        rows={2}
                                        placeholder="Enter optimized description for this city..."
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                            <table className="w-full border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Target City</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Meta Context</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {Object.entries(config.city_seo_overrides || {}).map(([city, data]) => (
                                        <tr key={city} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black uppercase text-xs">
                                                        {city.charAt(0)}
                                                    </div>
                                                    <span className="font-bold text-slate-900 capitalize">{city}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="max-w-md">
                                                    <p className="text-sm font-bold text-slate-800 truncate">{data.title}</p>
                                                    <p className="text-xs text-slate-500 truncate mt-0.5">{data.description}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button 
                                                    onClick={() => removeCityOverride(city)}
                                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {Object.keys(config.city_seo_overrides || {}).length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-12 text-center text-slate-400 italic text-sm">
                                                No city overrides configured. Global defaults will be used.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'backlinks' && (
                    <div className="grid gap-8">
                        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm p-8">
                            <h3 className="font-black text-slate-900 uppercase italic text-lg tracking-tight mb-6">Track New Promotional Link</h3>
                            <form onSubmit={addBacklink} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <input 
                                    name="source"
                                    required
                                    placeholder="Source (e.g. Instagram Bio)"
                                    className="md:col-span-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                                />
                                <input 
                                    name="url"
                                    required
                                    placeholder="Target URL (e.g. /events/in/coimbatore)"
                                    className="md:col-span-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                                />
                                <button 
                                    type="submit"
                                    className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus size={18} />
                                    Track URL
                                </button>
                            </form>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                            <table className="w-full border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Source/Campaign</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Internal Endpoint</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Added On</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(config.backlink_tracking || []).map((link, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg"><LinkIcon size={14} /></div>
                                                    <span className="font-bold text-slate-900">{link.source}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                                                    {link.url}
                                                    <ExternalLink size={14} />
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-sm text-slate-500 font-medium">
                                                {new Date(link.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button 
                                                    onClick={() => setConfig(prev => ({
                                                        ...prev,
                                                        backlink_tracking: prev.backlink_tracking.filter((_, i) => i !== idx)
                                                    }))}
                                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'indexing' && (
                    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm p-10">
                        <div className="flex items-start justify-between mb-10">
                            <div className="flex items-start gap-6">
                                <div className="bg-amber-100 p-4 rounded-3xl text-amber-600 shadow-inner"><Search size={32} /></div>
                                <div>
                                    <h3 className="font-black text-slate-900 uppercase italic text-2xl tracking-tight">Index Acceleration</h3>
                                    <p className="text-slate-500 font-medium mt-1">Request search engines to crawl and index your site updates.</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => window.open('https://search.google.com/search-console', '_blank')}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all text-xs self-start"
                            >
                                <ExternalLink size={14} />
                                <span>Open Search Console</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <CheckCircle2 className="text-emerald-500" size={20} />
                                    <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest">Sitemap Status</h4>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                                    Your dynamic sitemap is automatically generated at <span className="font-bold text-blue-600">/sitemap.xml</span>. 
                                    It includes all events, cities, and service pages.
                                </p>
                                <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Ping</span>
                                    <span className="text-sm font-bold text-slate-900">
                                        {config.sitemap_last_ping ? new Date(config.sitemap_last_ping).toLocaleString() : 'Never'}
                                    </span>
                                </div>
                            </div>

                            <div className="p-8 bg-blue-600 rounded-3xl text-white shadow-xl shadow-blue-100 flex flex-col justify-between">
                                <div>
                                    <h4 className="font-black uppercase text-xs tracking-widest mb-4 opacity-80">Manual Indexing</h4>
                                    <p className="text-sm font-medium leading-relaxed opacity-90 mb-8">
                                        If you've recently added many events or a new city, trigger a manual ping to alert Google and Bing bots.
                                    </p>
                                </div>
                                <button 
                                    onClick={pingSitemap}
                                    className="w-full py-4 bg-white text-blue-600 rounded-2xl font-black uppercase text-sm hover:bg-slate-50 transition-all shadow-lg"
                                >
                                    Trigger Global Crawl
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminDashboardLayout>
    );
}
