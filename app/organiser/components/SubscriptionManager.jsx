"use client";
import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { useToast } from "@/context/ToastContext";
import { 
    Zap, CheckCircle, Clock, Shield, Users, ArrowRight, 
    CreditCard, Activity, HelpCircle, AlertTriangle, 
    BarChart3, Smartphone, ShieldCheck, ZapOff
} from "lucide-react";

export default function SubscriptionManager({ user, theme, t }) {
    const { data: packages = [], loading: loadingPkgs } = useSupabaseQuery('staff_packages', q => q.eq('is_active', true).order('monthly_price', { ascending: true }));
    const { data: subscription, refresh: refreshSub } = useSupabaseQuery('organiser_subscriptions', q => q.eq('organiser_id', user?.id).maybeSingle(), [user?.id]);
    const { data: staffCountData = [] } = useSupabaseQuery('staff', q => q.eq('organiser_id', user?.id), [user?.id]);
    const { data: payments = [] } = useSupabaseQuery('subscription_payments', q => q.eq('organiser_id', user?.id).order('created_at', { ascending: false }), [user?.id]);
    const { showToast } = useToast();
    const [upgradingId, setUpgradingId] = useState(null);

    const currentPackage = useMemo(() => {
        if (!subscription || subscription.subscription_status !== 'active') {
            return packages.find(p => p.monthly_price === 0) || { package_name: "Free Plan", staff_limit: 3, monthly_price: 0, features: {} };
        }
        return packages.find(p => p.id === subscription.package_id) || { package_name: "Premium Plan", staff_limit: 10, monthly_price: 0, features: {} };
    }, [subscription, packages]);

    const isExpiringSoon = useMemo(() => {
        if (!subscription?.active_until) return false;
        const expiry = new Date(subscription.active_until);
        const now = new Date();
        const diff = expiry.getTime() - now.getTime();
        return diff > 0 && diff < (5 * 24 * 60 * 60 * 1000); // 5 days
    }, [subscription]);

    const handleUpgrade = async (pkg) => {
        setUpgradingId(pkg.id);
        try {
            // Check if Razorpay is needed
            if (pkg.monthly_price === 0) {
                // Downgrade to free or already on free logic
                showToast("You are already on the Free Plan or cannot downgrade automatically yet.", "info");
                return;
            }

            const loadRazorpay = () => {
                return new Promise((resolve) => {
                    const script = document.createElement("script");
                    script.src = "https://checkout.razorpay.com/v1/checkout.js";
                    script.onload = () => resolve(true);
                    script.onerror = () => resolve(false);
                    document.body.appendChild(script);
                });
            };

            const isLoaded = await loadRazorpay();
            if (!isLoaded) throw new Error("Razorpay SDK failed to load.");

            // Calculate total with GST
            const basePrice = pkg.monthly_price || 0;
            const discount = basePrice * ((pkg.discount_percentage || 0) / 100);
            const priceAfterDiscount = basePrice - discount;
            const gst = priceAfterDiscount * ((pkg.gst_percentage || 18) / 100);
            const finalAmount = Math.round((priceAfterDiscount + gst) * 100) / 100;

            const res = await fetch("/api/razorpay/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: pkg.id,
                    amount: finalAmount,
                    type: "subscription",
                    organiserId: user?.id
                })
            });
            const order = await res.json();
            if (order.error) throw new Error(order.error);

            // Fetch key from supabase or use fallback
            const { data: gateway } = await supabase.from('payment_gateways').select('config').eq('name', 'Razorpay').eq('is_enabled', true).maybeSingle();
            const rzpKey = gateway?.config?.keyId || "rzp_live_SkQ5MQO9dB5LuI";

            const options = {
                key: rzpKey,
                amount: order.amount,
                currency: order.currency,
                name: "BookMyTicket Premium",
                description: `Upgrade to ${pkg.package_name}`,
                image: "/logo.png",
                order_id: order.id,
                handler: async function (response) {
                    try {
                        const verifyRes = await fetch("/api/razorpay/verify", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                id: pkg.id,
                                type: "subscription",
                                organiserId: user.id
                            })
                        });
                        const verifyResult = await verifyRes.json();
                        if (verifyResult.success) {
                            showToast("Subscription activated! Enjoy premium features.", "success");
                            refreshSub();
                        } else {
                            throw new Error(verifyResult.error || "Verification failed");
                        }
                    } catch (err) {
                        showToast(err.message, "error");
                    }
                },
                prefill: {
                    name: user.full_name || "",
                    email: user.email || ""
                },
                theme: { color: "#ec4899" }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setUpgradingId(null);
        }
    };

    const ACCENT_GRADIENT = `linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)`;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Current Status Banner */}
            <div className="relative overflow-hidden bg-slate-900 rounded-[1.5rem] p-6 text-white border border-white/10 shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/20 blur-[100px] -mr-48 -mt-48" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[80px] -ml-32 -mb-32" />
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest text-pink-400">
                            <Zap size={14} fill="currentColor" /> Active Subscription
                        </div>
                        <h2 className="text-2xl font-black tracking-tight italic uppercase">{currentPackage.package_name}</h2>
                        <div className="flex flex-wrap gap-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-pink-400">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Staff Limit</p>
                                    <p className="text-base font-black">{staffCountData.length} / {currentPackage.staff_limit}</p>
                                </div>
                            </div>
                            {subscription?.active_until && (
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-400">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Valid Until</p>
                                        <p className="text-base font-black">{new Date(subscription.active_until).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Status</p>
                            <span className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest ${
                                subscription?.subscription_status === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
                                'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                            }`}>
                                {subscription?.subscription_status || 'Free Tier'}
                            </span>
                        </div>
                        {isExpiringSoon && (
                            <div className="flex items-center gap-2 text-amber-400 font-black text-[10px] uppercase tracking-widest animate-pulse">
                                <AlertTriangle size={14} /> Expiring Soon
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="space-y-6">
                <div className="flex items-end justify-between px-2">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight dark:text-white">Upgrade Your Workforce</h3>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Unlock premium scanning & multi-device control</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {packages.map((pkg) => {
                        const isCurrent = pkg.id === subscription?.package_id || (pkg.monthly_price === 0 && (!subscription || subscription.subscription_status !== 'active'));
                        return (
                            <div key={pkg.id} className={`group relative bg-white rounded-3xl p-6 border-2 transition-all duration-500 hover:-translate-y-2 ${
                                isCurrent ? 'border-pink-500 shadow-2xl shadow-pink-500/10' : 'border-slate-100 hover:border-pink-200 shadow-xl shadow-slate-200/50'
                            } dark:bg-slate-800 dark:border-slate-700`}>
                                {pkg.monthly_price > 0 && !isCurrent && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-pink-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">Recommended</div>
                                )}
                                
                                <div className="space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div className={`p-3 rounded-2xl ${isCurrent ? 'bg-pink-500 text-white' : 'bg-slate-100 text-slate-400 dark:bg-slate-700'}`}>
                                            <Zap size={20} fill={isCurrent ? "currentColor" : "none"} />
                                        </div>
                                        {isCurrent && <CheckCircle size={20} className="text-green-500" />}
                                    </div>

                                    <div>
                                        <h4 className="text-lg font-black text-slate-900 dark:text-white italic uppercase tracking-tight">{pkg.package_name}</h4>
                                        <div className="flex flex-col mt-1">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-black text-slate-900 dark:text-white">₹{pkg.monthly_price}</span>
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">/mo</span>
                                            </div>
                                            {pkg.gst_percentage > 0 && (
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                    + {pkg.gst_percentage}% GST (₹{(pkg.monthly_price * (pkg.gst_percentage / 100)).toFixed(2)})
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3 border-t border-slate-50 pt-4 dark:border-slate-700">
                                        <div className="flex items-center gap-3 text-[13px] font-bold text-slate-600 dark:text-slate-300">
                                            <Users size={16} className="text-pink-500" />
                                            {pkg.staff_limit} Staff Accounts
                                        </div>
                                        <div className="flex items-center gap-3 text-[13px] font-bold text-slate-600 dark:text-slate-300">
                                            <Smartphone size={16} className="text-blue-500" />
                                            Device Restriction Control
                                        </div>
                                        {Object.entries(pkg.features || {}).map(([key, val]) => (
                                            <div key={key} className={`flex items-center gap-3 text-[13px] font-bold ${val ? 'text-slate-600 dark:text-slate-300' : 'text-slate-300 line-through dark:text-slate-600'}`}>
                                                <CheckCircle size={16} className={val ? "text-green-500" : "text-slate-200 dark:text-slate-700"} />
                                                {key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                            </div>
                                        ))}
                                    </div>

                                    <button 
                                        disabled={isCurrent || upgradingId}
                                        onClick={() => handleUpgrade(pkg)}
                                        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs italic transition-all ${
                                            isCurrent ? 'bg-slate-100 text-slate-400 cursor-default dark:bg-slate-700' : 
                                            'bg-slate-900 text-white shadow-xl hover:scale-[1.02] active:scale-95 hover:bg-pink-600 dark:bg-pink-600'
                                        }`}
                                    >
                                        {upgradingId === pkg.id ? 'Processing...' : isCurrent ? 'Active Plan' : 'Select Plan'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Transaction History Section */}
            {payments.length > 0 && (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden dark:bg-slate-800 dark:border-slate-700">
                    <div className="p-6 border-b border-slate-50 flex justify-between items-center dark:border-slate-700">
                        <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight italic">Payment History</h4>
                        <CreditCard size={18} className="text-slate-300" />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/50">
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Transaction</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map(pay => (
                                    <tr key={pay.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors dark:border-slate-700 dark:hover:bg-slate-900/20">
                                        <td className="px-8 py-5">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{pay.transaction_id || 'Staff Subscription'}</p>
                                            <p className="text-[10px] font-mono text-slate-400">{pay.id.slice(0, 12)}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="text-sm font-black text-slate-900 dark:text-white">₹{pay.paid_amount}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                pay.payment_status === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-500/10' : 'bg-amber-100 text-amber-600 dark:bg-amber-500/10'
                                            }`}>
                                                {pay.payment_status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-sm font-bold text-slate-500">{new Date(pay.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
