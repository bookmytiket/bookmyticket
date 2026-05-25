"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Mail, CheckCircle2, XCircle, Clock, RefreshCw, Eye, Search } from "lucide-react";
import toast from "react-hot-toast";

export default function EmailDashboard({ theme, t }) {
  const [stats, setStats] = useState({ sent: 0, failed: 0, pending: 0, total: 0 });
  const [logs, setLogs] = useState([]);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("queue"); // queue | logs

  const fetchEmailData = async () => {
    setLoading(true);
    try {
      // Get Queue
      const { data: queueData, error: qErr } = await supabase
        .from('notification_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (qErr) throw qErr;

      // Get Logs
      const { data: logData, error: lErr } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (lErr) throw lErr;

      setQueue(queueData || []);
      setLogs(logData || []);

      // Calculate stats
      const pending = queueData?.filter(q => q.status === 'pending').length || 0;
      const failed = logData?.filter(l => l.status === 'failed').length || 0;
      const sent = logData?.filter(l => l.status === 'delivered').length || 0;

      setStats({
        pending,
        failed,
        sent,
        total: sent + failed + pending
      });

    } catch (error) {
      console.error("Error fetching email data:", error);
      toast.error("Failed to load email monitoring data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmailData();
  }, []);

  const handleProcessQueue = async () => {
    toast.promise(
      fetch('/api/cron/process-emails').then(res => res.json()),
      {
        loading: 'Processing email queue...',
        success: (data) => {
          fetchEmailData();
          return `Processed ${data.processed || 0} emails`;
        },
        error: 'Failed to process queue'
      }
    );
  };

  const handleResend = async (jobId) => {
    // A real implementation might have a specific API for resending a failed job
    // For now we just reset the status in the DB so the cron can pick it up again
    try {
      const { error } = await supabase
        .from('notification_queue')
        .update({ status: 'pending', retry_count: 0 })
        .eq('id', jobId);
        
      if (error) throw error;
      toast.success("Job re-queued successfully");
      fetchEmailData();
    } catch (err) {
      toast.error("Failed to re-queue job");
    }
  };

  const filteredData = activeTab === 'queue' 
    ? queue.filter(q => q.payload?.to?.includes(search) || q.event_type.includes(search))
    : logs.filter(l => l.recipient_email?.includes(search) || l.template_key?.includes(search));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header and Stats */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-1.5">Email Notification Engine</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Monitor delivery & queue health</p>
        </div>
        <button 
          onClick={handleProcessQueue}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Trigger Queue Processor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Sent", value: stats.sent, icon: Mail, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Pending in Queue", value: stats.pending, icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
          { label: "Delivery Failed", value: stats.failed, icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
          { label: "Success Rate", value: stats.total > 0 ? `${Math.round((stats.sent / stats.total) * 100)}%` : "0%", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{stat.value}</p>
            </div>
            <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
              <stat.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs and Search */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex gap-2 w-full sm:w-auto p-1 bg-slate-50 rounded-xl">
          <button 
            onClick={() => setActiveTab("queue")}
            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${activeTab === "queue" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Pending Queue
          </button>
          <button 
            onClick={() => setActiveTab("logs")}
            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${activeTab === "logs" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Delivery Logs
          </button>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search email or template..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">ID / Type</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Recipient</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Date</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-sm text-slate-400">Loading tracking data...</td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-sm text-slate-400">No records found matching your criteria.</td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <p className="text-xs font-bold text-slate-900">{activeTab === 'queue' ? row.event_type : row.template_key}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{row.id.split('-')[0]}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-slate-700">{activeTab === 'queue' ? row.payload?.to : row.recipient_email}</p>
                      <p className="text-[10px] text-slate-400 truncate w-48">{activeTab === 'queue' ? row.payload?.subject : row.subject}</p>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        row.status === 'delivered' || row.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                        row.status === 'pending' || row.status === 'processing' ? 'bg-amber-50 text-amber-600' :
                        'bg-red-50 text-red-600'
                      }`}>
                        {row.status}
                        {row.retry_count > 0 && <span className="ml-1 opacity-70">(Retry: {row.retry_count})</span>}
                      </span>
                      {row.error_message && <p className="text-[10px] text-red-500 mt-1 max-w-[200px] truncate" title={row.error_message}>{row.error_message}</p>}
                    </td>
                    <td className="p-4 text-xs text-slate-500">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="View Payload">
                          <Eye className="w-4 h-4" />
                        </button>
                        {(row.status === 'failed' || row.status === 'dead_letter') && activeTab === 'queue' && (
                          <button 
                            onClick={() => handleResend(row.id)}
                            className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" 
                            title="Re-queue Job"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
