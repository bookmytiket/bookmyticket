"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useSupabaseQuery, useSupabaseMutation } from "@/hooks/useSupabase";
import { useToast } from "@/context/ToastContext";
import { 
    Zap, Plus, Trash2, Edit, Save, X, CheckCircle, 
    AlertTriangle, Shield, CreditCard, Users, Layout,
    ArrowRight, Info, Settings, Clock, BarChart3,
    Smartphone, Search, Filter, Mail, Bell, Activity,
    History, DollarSign
} from "lucide-react";

export default function SubscriptionPackagesAdmin({ theme, t }) {
    const { data: packages = [], loading, refresh } = useSupabaseQuery('staff_packages');
    const { data: payments = [], loading: loadingPayments } = useSupabaseQuery('subscription_payments', (q) => q.order('created_at', { ascending: false }));
    const { data: logs = [], loading: loadingLogs } = useSupabaseQuery('subscription_logs', (q) => q.order('created_at', { ascending: false }));
    const [upsertPackage] = useSupabaseMutation('staff_packages', 'upsert');
    const [deletePackage] = useSupabaseMutation('staff_packages', 'delete', (q, p) => q.eq('id', p.id));
    const { showToast } = useToast();

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [view, setView] = useState('packages'); // 'packages', 'payments', 'logs'
    const [formData, setFormData] = useState({
        package_name: "",
        monthly_price: 0,
        staff_limit: 3,
        gst_percentage: 18,
        discount_percentage: 0,
        duration_days: 30,
        trial_days: 0,
        features: {
            offline_scan: false,
            multi_gate: false,
            analytics: false,
            duplicate_validation: true,
            device_monitoring: false
        },
        is_active: true
    });

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            if (editingId) payload.id = editingId;
            
            await upsertPackage(payload);
            showToast(`Package ${editingId ? 'updated' : 'created'} successfully`, "success");
            setShowModal(false);
            setEditingId(null);
            refresh();
        } catch (err) {
            showToast("Error saving package: " + err.message, "error");
        }
    };

    const handleEdit = (pkg) => {
        setFormData({
            package_name: pkg.package_name,
            monthly_price: pkg.monthly_price || 0,
            staff_limit: pkg.staff_limit,
            gst_percentage: pkg.gst_percentage || 18,
            discount_percentage: pkg.discount_percentage || 0,
            duration_days: pkg.duration_days || 30,
            trial_days: pkg.trial_days || 0,
            features: pkg.features || {},
            is_active: pkg.is_active !== false
        });
        setEditingId(pkg.id);
        setShowModal(true);
    };

    const toggleFeature = (feature) => {
        setFormData(prev => ({
            ...prev,
            features: {
                ...prev.features,
                [feature]: !prev.features[feature]
            }
        }));
    };

    const ACCENT_GRADIENT = `linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)`;

    return (
        <div className="space-y-6">
            {/* Header Tabs */}
            <div className="flex items-center gap-4 border-b pb-4 mb-6" style={{ borderColor: t.border }}>
                <button 
                    onClick={() => setView('packages')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'packages' ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    Subscription Packages
                </button>
                <button 
                    onClick={() => setView('payments')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'payments' ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    Payment History
                </button>
                <button 
                    onClick={() => setView('logs')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'logs' ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    System Logs
                </button>
            </div>

            {view === 'packages' && (
                <>
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight dark:text-white">Dynamic Pricing Control</h2>
                            <p className="text-sm text-slate-500 font-medium">Manage monthly staff subscription plans and feature limits</p>
                        </div>
                        <button 
                            onClick={() => {
                                setEditingId(null);
                                setFormData({
                                    package_name: "",
                                    monthly_price: 0,
                                    staff_limit: 3,
                                    gst_percentage: 18,
                                    discount_percentage: 0,
                                    duration_days: 30,
                                    trial_days: 0,
                                    features: { offline_scan: false, multi_gate: false, analytics: false, duplicate_validation: true, device_monitoring: false },
                                    is_active: true
                                });
                                setShowModal(true);
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl hover:scale-105 active:scale-95 transition-all dark:bg-pink-600"
                        >
                            <Plus size={18} /> Create New Plan
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {packages.map((pkg) => (
                            <div key={pkg.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col dark:bg-slate-800 dark:border-slate-700 dark:shadow-none">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-2xl ${pkg.monthly_price === 0 ? 'bg-slate-100 text-slate-500' : 'bg-pink-100 text-pink-500'}`}>
                                        <Zap size={24} fill={pkg.monthly_price > 0 ? "currentColor" : "none"} />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(pkg)} className="p-2 text-slate-400 hover:text-pink-500 transition-colors"><Edit size={16} /></button>
                                        <button onClick={() => { if(confirm("Delete this package?")) deletePackage({id: pkg.id}).then(refresh) }} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                                
                                <h3 className="text-xl font-black text-slate-900 mb-1 dark:text-white">{pkg.package_name}</h3>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-3xl font-black text-slate-900 dark:text-white">₹{pkg.monthly_price}</span>
                                    <span className="text-sm text-slate-400 font-bold uppercase tracking-widest">/month</span>
                                </div>

                                <div className="space-y-3 mb-6 flex-1">
                                    <div className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-400">
                                        <Users size={16} className="text-pink-500" />
                                        Up to {pkg.staff_limit} Staff Accounts
                                    </div>
                                    {Object.entries(pkg.features || {}).map(([key, val]) => (
                                        <div key={key} className={`flex items-center gap-3 text-sm font-bold ${val ? 'text-slate-600 dark:text-slate-400' : 'text-slate-300 dark:text-slate-600'}`}>
                                            <CheckCircle size={16} className={val ? "text-green-500" : "text-slate-200 dark:text-slate-700"} />
                                            {key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-4 border-t border-slate-50 dark:border-slate-700">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        <span>GST: {pkg.gst_percentage}%</span>
                                        <span>Disc: {pkg.discount_percentage}%</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {view === 'payments' && (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden dark:bg-slate-800 dark:border-slate-700">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 dark:bg-slate-900/50 dark:border-slate-700">
                                <th className="p-6 text-[11px] font-black uppercase tracking-widest text-slate-400">Transaction ID</th>
                                <th className="p-6 text-[11px] font-black uppercase tracking-widest text-slate-400">Organiser</th>
                                <th className="p-6 text-[11px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                                <th className="p-6 text-[11px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                <th className="p-6 text-[11px] font-black uppercase tracking-widest text-slate-400">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map(pay => (
                                <tr key={pay.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors dark:border-slate-700 dark:hover:bg-slate-900/20">
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-blue-50 text-blue-500 dark:bg-blue-500/10">
                                                <CreditCard size={14} />
                                            </div>
                                            <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300">{pay.transaction_id}</span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="text-sm font-bold text-slate-900 dark:text-white">{pay.organiser_id?.slice(0, 8)}...</div>
                                    </td>
                                    <td className="p-6">
                                        <div className="text-sm font-black text-slate-900 dark:text-white">₹{pay.paid_amount}</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Incl. GST: ₹{pay.gst_amount}</div>
                                    </td>
                                    <td className="p-6">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            pay.payment_status === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-500/10' : 
                                            pay.payment_status === 'failed' ? 'bg-red-100 text-red-600 dark:bg-red-500/10' : 
                                            'bg-amber-100 text-amber-600 dark:bg-amber-500/10'
                                        }`}>
                                            {pay.payment_status}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400">{new Date(pay.created_at).toLocaleString()}</div>
                                    </td>
                                </tr>
                            ))}
                            {payments.length === 0 && !loadingPayments && (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center text-slate-400 font-bold">No transactions found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {view === 'logs' && (
                <div className="space-y-4">
                    {logs.map(log => (
                        <div key={log.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 dark:bg-slate-800 dark:border-slate-700">
                            <div className={`p-3 rounded-2xl ${
                                log.action_type === 'activation' ? 'bg-green-100 text-green-500' :
                                log.action_type === 'expiry' ? 'bg-amber-100 text-amber-500' :
                                'bg-slate-100 text-slate-500'
                            }`}>
                                {log.action_type === 'activation' ? <CheckCircle size={20} /> : <Clock size={20} />}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-pink-500">{log.action_type}</span>
                                    <span className="text-xs text-slate-400">•</span>
                                    <span className="text-xs font-bold text-slate-500">{new Date(log.created_at).toLocaleString()}</span>
                                </div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                                    {log.action_type === 'activation' ? 'Subscription activated for Organiser' : 'Subscription expired / updated'}
                                </p>
                                <div className="flex gap-4 mt-2">
                                    {log.details?.package_id && (
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {log.details.package_id.slice(0,8)}</span>
                                    )}
                                    {log.details?.active_until && (
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valid Until: {new Date(log.details.active_until).toLocaleDateString()}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {logs.length === 0 && !loadingLogs && (
                        <div className="p-12 text-center text-slate-400 font-bold bg-white rounded-3xl border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                            No system logs found
                        </div>
                    )}
                </div>
            )}

            {/* Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
                    <div className="bg-white w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 dark:bg-slate-900 max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center dark:border-slate-800">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white">{editingId ? 'Edit Package' : 'Create Package'}</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Configure plan parameters & pricing</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors dark:hover:bg-slate-800">
                                <X size={24} className="text-slate-400" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Package Name</label>
                                    <input 
                                        required 
                                        value={formData.package_name} 
                                        onChange={e => setFormData({...formData, package_name: e.target.value})}
                                        className="w-full p-3 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-pink-500/20 transition-all"
                                        placeholder="e.g. Professional Plan"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Monthly Price (₹)</label>
                                    <input 
                                        required 
                                        type="number" 
                                        value={formData.monthly_price} 
                                        onChange={e => {
                                            const val = parseFloat(e.target.value);
                                            setFormData({...formData, monthly_price: isNaN(val) ? 0 : val});
                                        }}
                                        className="w-full p-3 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-pink-500/20 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Staff Limit</label>
                                    <input 
                                        required 
                                        type="number" 
                                        value={formData.staff_limit} 
                                        onChange={e => {
                                            const val = parseInt(e.target.value);
                                            setFormData({...formData, staff_limit: isNaN(val) ? 0 : val});
                                        }}
                                        className="w-full p-3 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 dark:bg-slate-800 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">GST %</label>
                                    <input 
                                        required 
                                        type="number" 
                                        value={formData.gst_percentage} 
                                        onChange={e => {
                                            const val = parseFloat(e.target.value);
                                            setFormData({...formData, gst_percentage: isNaN(val) ? 0 : val});
                                        }}
                                        className="w-full p-3 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 dark:bg-slate-800 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Discount %</label>
                                    <input 
                                        required 
                                        type="number" 
                                        value={formData.discount_percentage} 
                                        onChange={e => {
                                            const val = parseFloat(e.target.value);
                                            setFormData({...formData, discount_percentage: isNaN(val) ? 0 : val});
                                        }}
                                        className="w-full p-3 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 dark:bg-slate-800 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-4">Premium Features</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {Object.keys(formData.features).map(feature => (
                                        <label key={feature} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors dark:bg-slate-800 dark:hover:bg-slate-700">
                                            <input 
                                                type="checkbox" 
                                                checked={formData.features[feature]} 
                                                onChange={() => toggleFeature(feature)}
                                                className="w-5 h-5 rounded-md border-slate-300 text-pink-500 focus:ring-pink-500"
                                            />
                                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                                                {feature.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs italic shadow-2xl hover:scale-[1.02] active:scale-95 transition-all dark:bg-pink-600"
                            >
                                {editingId ? 'Synchronize Package Data' : 'Initialize New Subscription Plan'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
