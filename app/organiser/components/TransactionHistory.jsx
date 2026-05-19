"use client";
import React, { useState, useMemo } from "react";
import { 
    History, Search, Filter, Download, 
    ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, XCircle 
} from "lucide-react";
import { useSupabaseQuery } from "@/hooks/useSupabase";

export default function TransactionHistory({ user, theme: t }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterType, setFilterType] = useState("all");

    const { data: transactions = [], loading } = useSupabaseQuery(
        'wallet_transactions', 
        q => q
            .or(`organiser_id.eq.${user?.id},provider_id.eq.${user?.id}`)
            .order('created_at', { ascending: false }),
        [user?.id]
    );

    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            const matchesSearch = (tx.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 (tx.reference_id || "").toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = filterType === 'all' || tx.type === filterType;
            return matchesSearch && matchesType;
        });
    }, [transactions, searchTerm, filterType]);

    const stats = useMemo(() => {
        const credit = transactions.filter(tx => tx.type === 'credit').reduce((acc, tx) => acc + (tx.amount || 0), 0);
        const debit = transactions.filter(tx => tx.type === 'debit').reduce((acc, tx) => acc + (tx.amount || 0), 0);
        return { credit, debit, count: transactions.length };
    }, [transactions]);

    const exportToCSV = () => {
        const headers = ["Reference", "Date", "Type", "Description", "Amount", "Status"];
        const rows = filteredTransactions.map(tx => [
            tx.id,
            new Date(tx.created_at).toLocaleString(),
            tx.type.toUpperCase(),
            tx.description,
            tx.amount,
            tx.status || 'Success'
        ]);

        const content = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([content], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${new Date().getTime()}.csv`;
        a.click();
    };

    if (loading) return <div className="p-20 text-center text-slate-400">Loading history...</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">Transaction Ledger</h3>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Comprehensive history of all earnings and payouts</p>
                </div>
                <div className="flex gap-4">
                    <div className="text-right px-4 border-r border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Earnings</p>
                        <p className="text-lg font-black text-emerald-500">₹{stats.credit.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Payouts</p>
                        <p className="text-lg font-black text-rose-500">₹{stats.debit.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by reference or description..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-4 focus:ring-pink-500/10 outline-none transition-all"
                    />
                </div>
                <select 
                    value={filterType} 
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-black uppercase tracking-widest outline-none cursor-pointer"
                >
                    <option value="all">All Types</option>
                    <option value="credit">Earnings (Credit)</option>
                    <option value="debit">Payouts (Debit)</option>
                </select>
                <button 
                    onClick={exportToCSV}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-pink-600 transition-all active:scale-95 shadow-xl shadow-slate-200"
                >
                    <Download size={14} /> Export CSV
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Reference</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Date & Time</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Type</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Description</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 text-slate-300">
                                            <History size={48} strokeWidth={1} />
                                            <p className="font-black uppercase tracking-widest text-xs">No transactions found matching your filters</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredTransactions.map(tx => (
                                <tr key={tx.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === 'credit' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                                                {tx.type === 'credit' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-mono font-bold text-slate-400">#{tx.id.slice(0, 8).toUpperCase()}</p>
                                                {tx.reference_id && <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tight">Ref: {tx.reference_id.slice(0, 12)}</p>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-sm font-bold text-slate-900">{new Date(tx.created_at).toLocaleDateString()}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                            tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                        }`}>
                                            {tx.type === 'credit' ? 'Earnings' : 'Payout'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-sm font-black text-slate-700 tracking-tight">{tx.description || 'System Transaction'}</p>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <p className={`text-lg font-black ${tx.type === 'credit' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {tx.type === 'credit' ? '+' : '-'} ₹{tx.amount.toLocaleString()}
                                        </p>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
