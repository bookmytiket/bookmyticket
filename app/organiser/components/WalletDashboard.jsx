'use client';

import React, { useState, useEffect } from 'react';
import { 
    Wallet, 
    ArrowUpRight, 
    ArrowDownLeft, 
    Clock, 
    CheckCircle2, 
    XCircle, 
    Landmark,
    TrendingUp,
    History,
    AlertCircle,
    ChevronRight,
    Search
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';

export default function WalletDashboard({ user, providerType = 'organiser' }) {
    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [withdrawRequests, setWithdrawRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawNotes, setWithdrawNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        if (user?.id) {
            fetchWalletData();

            // Real-time sync for wallet balance
            const walletTable = providerType === 'organiser' ? 'organiser_wallet' : 'provider_wallet';
            const idColumn = providerType === 'organiser' ? 'organiser_id' : 'service_provider_id';

            const channel = supabase
                .channel(`wallet_realtime_${user.id}`)
                .on('postgres_changes', { 
                    event: '*', 
                    table: walletTable, 
                    filter: `${idColumn}=eq.${user.id}` 
                }, (payload) => {
                    if (payload.new) setWallet(payload.new);
                })
                .on('postgres_changes', {
                    event: 'INSERT',
                    table: 'wallet_transactions',
                    filter: `provider_id=eq.${user.id}`
                }, () => {
                    fetchWalletData(); // Refresh all data on new transaction
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user?.id, providerType]);

    const fetchWalletData = async () => {
        setLoading(true);
        try {
            const walletTable = providerType === 'organiser' ? 'organiser_wallet' : 'provider_wallet';
            const idColumn = providerType === 'organiser' ? 'organiser_id' : 'service_provider_id';

            // Fetch Wallet
            const { data: walletData } = await supabase
                .from(walletTable)
                .select('*')
                .eq(idColumn, user.id)
                .maybeSingle();
            
            if (walletData) setWallet(walletData);

            // Fetch Transactions
            const { data: txData } = await supabase
                .from('wallet_transactions')
                .select('*')
                .eq('provider_id', user.id)
                .order('created_at', { ascending: false });
            
            setTransactions(txData || []);

            // Fetch Withdraw Requests
            const { data: wrData } = await supabase
                .from('withdraw_requests')
                .select('*')
                .eq(idColumn, user.id)
                .order('created_at', { ascending: false });
            
            setWithdrawRequests(wrData || []);
        } catch (err) {
            console.error("Wallet Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleWithdrawRequest = async (e) => {
        e.preventDefault();
        const amount = parseFloat(withdrawAmount);
        if (isNaN(amount) || amount <= 0) {
            showToast("Please enter a valid amount", "warning");
            return;
        }
        if (amount > wallet.balance) {
            showToast("Insufficient balance", "error");
            return;
        }

        setIsSubmitting(true);
        const idColumn = providerType === 'organiser' ? 'organiser_id' : 'service_provider_id';
        const walletTable = providerType === 'organiser' ? 'organiser_wallet' : 'provider_wallet';

        try {
            // 1. Insert Withdraw Request
            const { error: requestErr } = await supabase.from('withdraw_requests').insert([{
                [idColumn]: user.id,
                amount: amount,
                payout_details: { notes: withdrawNotes },
                status: 'pending'
            }]);

            if (requestErr) throw requestErr;

            // 2. Update Wallet Balance (Debit Immediately)
            const newBalance = wallet.balance - amount;
            const { error: walletErr } = await supabase
                .from(walletTable)
                .update({ balance: newBalance, updated_at: new Date().toISOString() })
                .eq(idColumn, user.id);
            
            if (walletErr) throw walletErr;

            // 3. Record Transaction
            await supabase.from('wallet_transactions').insert([{
                provider_id: user.id,
                amount: amount,
                type: 'debit',
                description: 'Withdrawal Request (Pending)',
                provider_type: providerType
            }]);

            // 4. Legacy Sync (Update organisers table if organiser)
            if (providerType === 'organiser') {
                try {
                    await supabase.from('organisers')
                        .update({ wallet_balance: newBalance })
                        .eq('id', user.id);
                } catch (e) {
                    console.warn("Legacy balance sync failed:", e);
                }
            }

            setWithdrawAmount('');
            setWithdrawNotes('');
            setShowWithdrawModal(false);
            fetchWalletData();
            showToast("Withdrawal request submitted and balance debited.", "success");
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <div className="w-12 h-12 border-4 border-pink-100 border-t-pink-500 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-8 font-['Inter'] animate-in fade-in duration-500">
            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-200">
                    <div className="absolute top-0 right-0 p-12 opacity-10">
                        <Wallet size={160} />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Available Balance</p>
                            <h2 className="text-6xl font-black tracking-tighter">
                                <span className="text-pink-500 mr-2">₹</span>
                                {wallet?.balance?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                            </h2>
                        </div>
                        <div className="mt-12 flex flex-wrap gap-4">
                            <button 
                                onClick={() => setShowWithdrawModal(true)}
                                className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-pink-500 hover:text-white transition-all shadow-xl shadow-black/20"
                            >
                                Request Payout
                            </button>
                            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10">
                                <TrendingUp className="text-emerald-400" size={20} />
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Monthly Growth</p>
                                    <p className="text-sm font-bold">+12.5%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 mb-6">
                            <Clock size={24} />
                        </div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Pending Payouts</p>
                        <h3 className="text-2xl font-black text-slate-900">
                            ₹{withdrawRequests.filter(r => r.status === 'pending').reduce((acc, r) => acc + r.amount, 0).toLocaleString('en-IN')}
                        </h3>
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-50">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                            <span>Last Withdrawal</span>
                            <span>{withdrawRequests.length > 0 ? new Date(withdrawRequests[0].created_at).toLocaleDateString() : 'None'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Transaction History */}
                <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                                <History size={20} />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Recent Earnings</h3>
                        </div>
                    </div>
                    <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
                        {transactions.length === 0 ? (
                            <div className="p-12 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">No transactions yet</div>
                        ) : transactions.map(tx => (
                            <div key={tx.id} className="p-6 hover:bg-slate-50/50 transition-colors flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'credit' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                                        {tx.type === 'credit' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900">{tx.description || 'Earnings'}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(tx.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className={`text-sm font-black ${tx.type === 'credit' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {tx.type === 'credit' ? '+' : '-'} ₹{tx.amount.toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Withdrawal Status */}
                <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                                <Landmark size={20} />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Payout Requests</h3>
                        </div>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {withdrawRequests.length === 0 ? (
                            <div className="p-12 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">No payout requests</div>
                        ) : withdrawRequests.map(req => (
                            <div key={req.id} className="p-6 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-black text-slate-900">₹{req.amount.toLocaleString()}</span>
                                        <StatusBadge status={req.status} />
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Requested {new Date(req.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Payout</p>
                                    <p className="text-[11px] font-bold text-slate-900">Primary Bank A/C</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Withdraw Modal */}
            {showWithdrawModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-300">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Request <span className="text-pink-500">Payout</span></h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Withdraw funds to your bank</p>
                            </div>
                            <button onClick={() => setShowWithdrawModal(false)} className="p-4 hover:bg-white rounded-full transition-all text-slate-400">
                                <XCircle size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleWithdrawRequest} className="p-10 space-y-8">
                            <div className="space-y-2 text-center py-6 bg-slate-50 rounded-[32px] border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Current Balance</p>
                                <p className="text-4xl font-black text-slate-900">₹{wallet?.balance?.toLocaleString() || '0'}</p>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Withdrawal Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-black text-slate-400">₹</span>
                                        <input 
                                            required
                                            type="number" 
                                            placeholder="Enter amount"
                                            value={withdrawAmount}
                                            onChange={(e) => setWithdrawAmount(e.target.value)}
                                            className="w-full pl-12 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-lg font-black focus:ring-4 focus:ring-pink-500/10 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Transfer Notes (Optional)</label>
                                    <textarea 
                                        placeholder="E.g. Monthly withdrawal"
                                        value={withdrawNotes}
                                        onChange={(e) => setWithdrawNotes(e.target.value)}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-pink-500/10 outline-none h-24 resize-none"
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={isSubmitting || !withdrawAmount || parseFloat(withdrawAmount) > wallet?.balance}
                                className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.2em] hover:bg-pink-600 disabled:opacity-50 shadow-2xl shadow-pink-100/50 transition-all transform active:scale-95"
                            >
                                {isSubmitting ? 'Processing...' : 'Confirm Withdrawal'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }) {
    const configs = {
        pending: { label: 'Pending', class: 'bg-amber-50 text-amber-600', icon: <Clock size={12} /> },
        approved: { label: 'Approved', class: 'bg-indigo-50 text-indigo-600', icon: <CheckCircle2 size={12} /> },
        processed: { label: 'Processed', class: 'bg-emerald-50 text-emerald-600', icon: <CheckCircle2 size={12} /> },
        rejected: { label: 'Rejected', class: 'bg-rose-50 text-rose-600', icon: <XCircle size={12} /> }
    };
    const config = configs[status] || configs.pending;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${config.class}`}>
            {config.icon}
            {config.label}
        </span>
    );
}
