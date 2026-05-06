"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Mail, Save, Server, Shield, Send, CheckCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function EmailSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [settings, setSettings] = useState({
    provider: "SMTP",
    host: "",
    port: 587,
    encryption: "TLS",
    user_name: "",
    pass: "",
    from_email: "hello@bookmyticket.net",
    from_name: "BookMyTicket",
  });
  const [testEmail, setTestEmail] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const { data, error } = await supabase
        .from("email_settings")
        .select("*")
        .maybeSingle();

      if (error) throw error;
      if (data) setSettings(data);
    } catch (err) {
      console.error("Fetch settings error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setStatus({ type: "", message: "" });
    try {
      const { error } = await supabase
        .from("email_settings")
        .upsert({ ...settings, updated_at: new Date().toISOString() });

      if (error) throw error;
      setStatus({ type: "success", message: "Settings saved successfully!" });
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    if (!testEmail) {
      setStatus({ type: "error", message: "Enter a test email address." });
      return;
    }
    setTesting(true);
    setStatus({ type: "info", message: "Sending test email..." });
    try {
      const res = await fetch("/api/comm/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: testEmail,
          subject: "SMTP Test - BookMyTicket",
          html: "<h1>Test Successful!</h1><p>Your SMTP settings are working correctly.</p>",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ type: "success", message: "Test email sent successfully!" });
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setStatus({ type: "error", message: `Test failed: ${err.message}` });
    } finally {
      setTesting(false);
    }
  }

  if (loading) return <div className="p-8 text-center">Loading settings...</div>;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-pink-100 rounded-2xl text-pink-600">
          <Mail size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800">Email & SMTP Settings</h1>
          <p className="text-slate-500 font-medium">Configure how the system sends OTPs and notifications.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Server size={20} className="text-slate-400" />
              SMTP Configuration
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-400">SMTP Host</label>
                <input
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 outline-none transition-all font-medium"
                  placeholder="smtp.gmail.com"
                  value={settings.host}
                  onChange={e => setSettings({ ...settings, host: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-400">Port</label>
                <input
                  type="number"
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 outline-none transition-all font-medium"
                  placeholder="587"
                  value={settings.port}
                  onChange={e => setSettings({ ...settings, port: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-400">Username</label>
                <input
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 outline-none transition-all font-medium"
                  placeholder="user@example.com"
                  value={settings.user_name}
                  onChange={e => setSettings({ ...settings, user_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-400">Password / App Key</label>
                <input
                  type="password"
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 outline-none transition-all font-medium"
                  placeholder="••••••••••••"
                  value={settings.pass}
                  onChange={e => setSettings({ ...settings, pass: e.target.value })}
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Shield size={20} className="text-slate-400" />
              Sender Identity
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-400">From Name</label>
                <input
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 outline-none transition-all font-medium"
                  placeholder="BookMyTicket"
                  value={settings.from_name}
                  onChange={e => setSettings({ ...settings, from_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-400">From Email</label>
                <input
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 outline-none transition-all font-medium"
                  placeholder="hello@bookmyticket.net"
                  value={settings.from_email}
                  onChange={e => setSettings({ ...settings, from_email: e.target.value })}
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-pink-600 text-white rounded-2xl font-black shadow-lg shadow-pink-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              <Save size={20} />
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <section className="bg-slate-800 text-white rounded-3xl p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Send size={20} className="text-pink-400" />
              Test Connection
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              Verify your SMTP settings by sending a test email to yourself.
            </p>
            
            <input
              className="w-full p-3 rounded-xl bg-slate-700 border-none text-white placeholder-slate-500 focus:ring-2 focus:ring-pink-500 outline-none mb-4 font-medium"
              placeholder="test@example.com"
              value={testEmail}
              onChange={e => setTestEmail(e.target.value)}
            />
            
            <button
              onClick={handleTest}
              disabled={testing}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-pink-50 transition-colors disabled:opacity-50"
            >
              {testing ? "Sending..." : "Send Test Email"}
            </button>
          </section>

          {status.message && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-2xl flex gap-3 ${
                status.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : 
                status.type === "error" ? "bg-rose-50 text-rose-700 border border-rose-100" :
                "bg-blue-50 text-blue-700 border border-blue-100"
              }`}
            >
              {status.type === "success" ? <CheckCircle size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
              <span className="text-sm font-bold">{status.message}</span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
