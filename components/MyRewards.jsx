import React, { useState, useEffect } from 'react';
import { Gift, Copy, CheckCircle, ExternalLink, Ticket, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import Image from 'next/image';

export default function MyRewards({ user, t }) {
    const [rewards, setRewards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null);
    const { showToast } = useToast();

    useEffect(() => {
        if (!user?.id) return;
        fetchRewards();
    }, [user?.id]);

    const fetchRewards = async () => {
        try {
            // Join user_rewards with reward_vouchers and reward_campaigns
            const { data, error } = await supabase
                .from('user_rewards')
                .select(`
                    id,
                    status,
                    assigned_at,
                    reward_vouchers (
                        voucher_code,
                        expiry_date,
                        reward_campaigns (
                            campaign_name,
                            campaign_type,
                            sponsor_name,
                            reward_value
                        )
                    )
                `)
                .eq('user_id', user.id)
                .order('assigned_at', { ascending: false });

            if (error) throw error;
            setRewards(data || []);
        } catch (error) {
            console.error('Error fetching rewards:', error);
            showToast('Failed to load rewards', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (code, id) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        showToast('Code copied to clipboard!', 'success');
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (loading) {
        return <div className="p-10 text-center animate-pulse text-pink-500 font-bold">Loading your rewards...</div>;
    }

    return (
        <div style={{ backgroundColor: t.cardBg, padding: "24px", borderRadius: "16px", border: `1px solid ${t.border}` }}>
            <div style={{ marginBottom: "24px" }}>
                <h3 className="text-xl font-black text-slate-900 italic tracking-tighter uppercase flex items-center gap-2">
                    <Gift className="text-pink-500" fill="currentColor" size={24} /> My Rewards
                </h3>
                <p className="text-sm text-slate-500 font-medium">Your earned discount coupons and gift e-cards.</p>
            </div>

            {rewards.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {rewards.map((reward) => {
                        const voucher = reward.reward_vouchers;
                        const campaign = voucher?.reward_campaigns;
                        if (!voucher || !campaign) return null;

                        const isGiftCard = campaign.campaign_type === 'gift_card';

                        return (
                            <div key={reward.id} className="relative overflow-hidden rounded-2xl border border-pink-100 bg-gradient-to-br from-white to-pink-50 shadow-sm hover:shadow-md transition-all duration-300 group">
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-2xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl -z-10 transform -translate-x-1/2 translate-y-1/2"></div>
                                
                                <div className="p-5 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-pink-100 text-[10px] font-black uppercase tracking-widest text-pink-600 mb-2 shadow-sm">
                                                {isGiftCard ? <Gift size={12} /> : <Ticket size={12} />}
                                                {isGiftCard ? 'Gift E-Card' : 'Discount Coupon'}
                                            </div>
                                            <h4 className="text-lg font-black text-slate-800 leading-tight">
                                                {campaign.campaign_name}
                                            </h4>
                                            {campaign.sponsor_name && (
                                                <div className="text-xs font-bold text-slate-500 mt-1">Sponsored by {campaign.sponsor_name}</div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
                                                {campaign.reward_value}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-pink-100/50">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex-1 bg-white border border-dashed border-pink-200 rounded-lg p-2.5 flex items-center justify-center font-mono font-bold text-slate-700 text-sm tracking-wider">
                                                {voucher.voucher_code}
                                            </div>
                                            <button 
                                                onClick={() => handleCopy(voucher.voucher_code, reward.id)}
                                                className={`p-2.5 rounded-lg border transition-all ${
                                                    copiedId === reward.id 
                                                        ? 'bg-green-50 border-green-200 text-green-600' 
                                                        : 'bg-white border-pink-200 text-pink-500 hover:bg-pink-50'
                                                }`}
                                            >
                                                {copiedId === reward.id ? <CheckCircle size={18} /> : <Copy size={18} />}
                                            </button>
                                        </div>
                                        {voucher.expiry_date && (
                                            <div className="text-[10px] text-center font-semibold text-slate-400 mt-3 uppercase tracking-wider">
                                                Valid until {new Date(voucher.expiry_date).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div style={{ padding: "60px 24px", textAlign: "center", color: t.textSub, border: `1px dashed ${t.border}`, borderRadius: "12px" }}>
                    <Sparkles size={40} className="mx-auto text-slate-300 mb-4" />
                    <p style={{ fontSize: "16px", fontWeight: "600", color: t.textMain, margin: "0 0 8px" }}>
                        No Rewards Yet
                    </p>
                    <p style={{ fontSize: "13px", margin: "0 0 20px" }}>
                        Book tickets to events and earn exciting rewards, discount coupons, and gift cards!
                    </p>
                </div>
            )}
        </div>
    );
}
