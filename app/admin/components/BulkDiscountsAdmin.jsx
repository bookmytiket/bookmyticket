'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Tag, Percent, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BulkDiscountsAdmin() {
    const [discounts, setDiscounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const [formData, setFormData] = useState({
        min_tickets: 5,
        discount_type: 'percentage',
        discount_value: 10
    });

    useEffect(() => {
        fetchDiscounts();
    }, []);

    const fetchDiscounts = async () => {
        try {
            const res = await fetch('/api/admin/bulk-discounts');
            const data = await res.json();
            if (data.success) {
                setDiscounts(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch bulk discounts', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/admin/bulk-discounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setShowModal(false);
                fetchDiscounts();
                setFormData({
                    min_tickets: 5,
                    discount_type: 'percentage',
                    discount_value: 10
                });
            }
        } catch (error) {
            console.error('Failed to create discount', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this rule?')) return;
        try {
            await fetch(`/api/admin/bulk-discounts?id=${id}`, { method: 'DELETE' });
            fetchDiscounts();
        } catch (error) {
            console.error('Failed to delete discount', error);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500 font-bold tracking-widest uppercase text-xs">Loading...</div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Bulk Booking Discounts</h2>
                    <p className="text-slate-500 font-medium">Manage auto-applied discounts for large group bookings.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-xl shadow-slate-900/20"
                >
                    <Plus size={16} /> Create Rule
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {discounts.map((discount) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={discount.id}
                        className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group"
                    >
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-pink-50 rounded-full blur-3xl opacity-50 group-hover:bg-pink-100 transition-colors" />
                        
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                                    <Tag size={24} />
                                </div>
                                <button
                                    onClick={() => handleDelete(discount.id)}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            
                            <h3 className="text-xl font-black text-slate-900 tracking-tighter mb-1">
                                {discount.type === 'percent' ? `${discount.value}% OFF` : `₹${discount.value} OFF`}
                            </h3>
                            <p className="text-slate-500 font-medium text-sm mb-6">
                                Applicable for {discount.min_tickets}+ tickets
                            </p>
                            
                            <div className="mt-auto flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Discount Type</span>
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest bg-white px-3 py-1 rounded-lg shadow-sm">
                                    {discount.type === 'percent' ? 'Percentage' : 'Flat Amount'}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {discounts.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white rounded-[3rem] border border-slate-100 border-dashed">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                            <Percent size={32} />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest mb-2">No Bulk Rules Found</h3>
                        <p className="text-slate-500 font-medium max-w-md text-center">Create a bulk discount rule to automatically reward large group bookings.</p>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl relative"
                        >
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-6">Create Bulk Rule</h3>
                            
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Minimum Tickets Required</label>
                                    <input
                                        type="number"
                                        min="2"
                                        value={formData.min_tickets}
                                        onChange={(e) => setFormData({...formData, min_tickets: parseInt(e.target.value)})}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Discount Type</label>
                                    <select
                                        value={formData.discount_type}
                                        onChange={(e) => setFormData({...formData, discount_type: e.target.value})}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:border-pink-500 transition-all appearance-none"
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Flat Amount (₹)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Discount Value</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.discount_value}
                                        onChange={(e) => setFormData({...formData, discount_value: parseFloat(e.target.value)})}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                                        required
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? 'Saving...' : 'Save Rule'} <ArrowRight size={14} />
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
