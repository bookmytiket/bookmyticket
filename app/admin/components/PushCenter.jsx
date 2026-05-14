"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
    Bell, Send, Users, Smartphone, 
    MessageSquare, History, Sparkles,
    CheckCircle, AlertCircle, Search,
    Filter, Megaphone, Zap
} from 'lucide-react';

export default function PushCenter({ t }) {
    const [tokens, setTokens] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ title: '', body: '', target: 'all' });
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const [tokensRes, historyRes] = await Promise.all([
                supabase.from('push_tokens').select('id, user_id, device_type'),
                supabase.from('notification_logs').select('*').order('created_at', { ascending: false }).limit(20)
            ]);
            setTokens(tokensRes.data || []);
            setHistory(historyRes.data || []);
            setLoading(false);
        };
        fetchData();
    }, []);

    const handleSend = async () => {
        if (!message.title || !message.body) return;
        setIsSending(true);
        
        // Log the notification
        const { error } = await supabase.from('notification_logs').insert({
            title: message.title,
            body: message.body,
            target_type: message.target,
            status: 'sent',
            sent_count: tokens.length
        });

        if (!error) {
            setMessage({ title: '', body: '', target: 'all' });
            // Refresh history
            const { data } = await supabase.from('notification_logs').select('*').order('created_at', { ascending: false }).limit(20);
            setHistory(data || []);
        }
        setIsSending(false);
    };

    if (loading) return <div className="p-20 text-center text-slate-400">Booting broadcast center...</div>;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Composer */}
                <div className="lg:col-span-7 space-y-8">
                    <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-6 mb-10">
                            <div className="w-16 h-16 rounded-3xl bg-pink-50 text-pink-500 flex items-center justify-center shadow-xl shadow-pink-500/10">
                                <Megaphone size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase italic leading-none">Campaign Composer</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Broadcast to {tokens.length} active devices</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Notification Title</label>
                                <input 
                                    className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-sm font-black text-slate-900 outline-none focus:border-pink-500"
                                    placeholder="e.g. Early Bird Tickets Live! 🎟️"
                                    value={message.title}
                                    onChange={e => setMessage({...message, title: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Message Body</label>
                                <textarea 
                                    className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-sm font-bold text-slate-600 outline-none focus:border-pink-500 min-h-[120px]"
                                    placeholder="Type your broadcast message here..."
                                    value={message.body}
                                    onChange={e => setMessage({...message, body: e.target.value})}
                                />
                            </div>
                            <button 
                                onClick={handleSend}
                                disabled={isSending}
                                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[12px] shadow-2xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
                            >
                                {isSending ? 'Transmitting...' : 'Launch Broadcast'} <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Status & History */}
                <div className="lg:col-span-5 space-y-8">
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white">
                        <h4 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-3">
                            <History size={16} className="text-pink-500" />
                            Recent Transmission Log
                        </h4>
                        <div className="space-y-4">
                            {history.map(log => (
                                <div key={log.id} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-[11px] font-black text-white uppercase italic">{log.title}</p>
                                        <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">SENT</span>
                                    </div>
                                    <p className="text-[10px] text-white/40 line-clamp-1 mb-3">{log.body}</p>
                                    <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-white/20">
                                        <span>{log.sent_count} Devices</span>
                                        <span>{new Date(log.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
