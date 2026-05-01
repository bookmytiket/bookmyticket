'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
    Plus, 
    Search, 
    Trash2, 
    Edit, 
    Ticket, 
    Calendar, 
    Users, 
    Zap,
    X,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';



export default function CouponManagement() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        type: 'percent',
        value: '',
        min_tickets: 1,
        usage_limit_per_user: 1,
        global_usage_limit: '',
        expiry_date: '',
        is_active: true
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (!error) setCoupons(data);
        setLoading(false);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const dataToSave = {
            ...formData,
            code: formData.code.toUpperCase(),
            value: parseFloat(formData.value),
            min_tickets: parseInt(formData.min_tickets),
            usage_limit_per_user: parseInt(formData.usage_limit_per_user),
            global_usage_limit: formData.global_usage_limit ? parseInt(formData.global_usage_limit) : null,
            expiry_date: formData.expiry_date || null
        };

        let error;
        if (editingCoupon) {
            ({ error } = await supabase.from('coupons').update(dataToSave).eq('id', editingCoupon.id));
        } else {
            ({ error } = await supabase.from('coupons').insert([dataToSave]));
        }

        if (!error) {
            setShowModal(false);
            setEditingCoupon(null);
            setFormData({
                code: '',
                type: 'percent',
                value: '',
                min_tickets: 1,
                usage_limit_per_user: 1,
                global_usage_limit: '',
                expiry_date: '',
                is_active: true
            });
            fetchCoupons();
        } else {
            alert(error.message);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this coupon?')) {
            const { error } = await supabase.from('coupons').delete().eq('id', id);
            if (!error) fetchCoupons();
        }
    };

    const openEdit = (coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            min_tickets: coupon.min_tickets,
            usage_limit_per_user: coupon.usage_limit_per_user,
            global_usage_limit: coupon.global_usage_limit || '',
            expiry_date: coupon.expiry_date ? new Date(coupon.expiry_date).toISOString().split('T')[0] : '',
            is_active: coupon.is_active
        });
        setShowModal(true);
    };

    const filteredCoupons = coupons.filter(c => 
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 p-8 font-['Inter']">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
                            Coupon <span className="text-pink-500">Master</span>
                        </h1>
                        <p className="text-slate-500 font-medium">Manage promotional codes and bulk booking discounts</p>
                    </div>
                    <button 
                        onClick={() => { setEditingCoupon(null); setShowModal(true); }}
                        className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-pink-600 transition-all shadow-xl shadow-slate-200"
                    >
                        <Plus size={20} />
                        Create New Coupon
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    <StatCard icon={<Ticket className="text-pink-500" />} label="Total Coupons" value={coupons.length} />
                    <StatCard icon={<Zap className="text-amber-500" />} label="Active Now" value={coupons.filter(c => c.is_active).length} />
                    <StatCard icon={<Users className="text-indigo-500" />} label="Bulk Rules" value={coupons.filter(c => c.min_tickets > 1).length} />
                    <StatCard icon={<Calendar className="text-emerald-500" />} label="Expiring Soon" value={coupons.filter(c => c.expiry_date && new Date(c.expiry_date) < new Date(Date.now() + 7*24*60*60*1000)).length} />
                </div>

                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row gap-6 items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search coupon code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-pink-500/10 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Coupon Details</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Type & Value</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Conditions</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan="5" className="p-12 text-center text-slate-400 font-bold">Loading coupons...</td></tr>
                                ) : filteredCoupons.length === 0 ? (
                                    <tr><td colSpan="5" className="p-12 text-center text-slate-400 font-bold">No coupons found</td></tr>
                                ) : filteredCoupons.map((coupon) => (
                                    <tr key={coupon.id} className="hover:bg-slate-50/30 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-900">{coupon.code}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Created {new Date(coupon.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className="px-3 py-1 bg-pink-50 text-pink-600 rounded-lg text-[10px] font-black uppercase">
                                                    {coupon.type === 'percent' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                                                    <Users size={12} className="text-indigo-500" />
                                                    Min Tickets: {coupon.min_tickets}
                                                </div>
                                                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                                                    <Calendar size={12} className="text-rose-500" />
                                                    {coupon.expiry_date ? `Expires: ${new Date(coupon.expiry_date).toLocaleDateString()}` : 'No Expiry'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${coupon.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${coupon.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                                {coupon.is_active ? 'Active' : 'Paused'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => openEdit(coupon)} className="p-3 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all">
                                                    <Edit size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(coupon.id)} className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-300">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                    {editingCoupon ? 'Edit' : 'New'} <span className="text-pink-500">Coupon</span>
                                </h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Define discount rules</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-4 hover:bg-white rounded-full transition-all text-slate-400">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-10 space-y-8">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Coupon Code</label>
                                    <input 
                                        required
                                        type="text" 
                                        placeholder="E.G. SAVE20"
                                        value={formData.code}
                                        onChange={(e) => setFormData({...formData, code: e.target.value})}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-pink-500/10 outline-none uppercase"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Discount Type</label>
                                    <select 
                                        value={formData.type}
                                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-pink-500/10 outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="percent">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (₹)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Value</label>
                                    <input 
                                        required
                                        type="number" 
                                        placeholder="0"
                                        value={formData.value}
                                        onChange={(e) => setFormData({...formData, value: e.target.value})}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-pink-500/10 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Min Tickets Required</label>
                                    <input 
                                        required
                                        type="number" 
                                        value={formData.min_tickets}
                                        onChange={(e) => setFormData({...formData, min_tickets: e.target.value})}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-pink-500/10 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expiry Date</label>
                                    <input 
                                        type="date" 
                                        value={formData.expiry_date}
                                        onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-pink-500/10 outline-none"
                                    />
                                </div>
                                <div className="space-y-2 flex flex-col justify-end">
                                    <label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 transition-all">
                                        <input 
                                            type="checkbox" 
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                                            className="w-5 h-5 rounded-lg accent-pink-500"
                                        />
                                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Active Coupon</span>
                                    </label>
                                </div>
                            </div>

                            <button 
                                type="submit"
                                className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.2em] hover:bg-pink-600 shadow-2xl shadow-pink-100/50 transition-all transform active:scale-95"
                            >
                                {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon, label, value }) {
    return (
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center">
                {React.cloneElement(icon, { size: 28 })}
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-3xl font-black text-slate-900">{value}</p>
            </div>
        </div>
    );
}
