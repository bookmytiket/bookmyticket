"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthContext";
import { 
  Camera, Package, Calendar, Wallet, Star,
  MessageSquare, Settings, ArrowUpRight,
  TrendingUp, Clock, CheckCircle2, ChevronRight,
  Loader2, Plus, Bell, User
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProviderDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    bookings: 0,
    services: 0,
    earnings: 0,
    rating: 4.8
  });

  useEffect(() => {
    if (!user) return;

    async function fetchProviderData() {
      setLoading(true);
      try {
        // Fetch provider profile - Isolated by RLS
        const { data: prov, error: provErr } = await supabase
          .from('service_providers')
          .select('*')
          .maybeSingle();

        if (!prov && !provErr) {
          // If no provider profile, they might need to complete onboarding
          router.push('/partner-onboarding');
          return;
        }

        setProvider(prov);

        // Fetch counts - Isolated by RLS
        const [bookingsRes, servicesRes, walletRes] = await Promise.all([
          supabase.from('service_bookings').select('id', { count: 'exact', head: true }),
          supabase.from('provider_services').select('id', { count: 'exact', head: true }),
          supabase.from('provider_wallets').select('balance').maybeSingle()
        ]);

        setStats({
          bookings: bookingsRes.count || 0,
          services: servicesRes.count || 0,
          earnings: walletRes.data?.balance || 0,
          rating: prov.rating || 4.8
        });

      } catch (err) {
        console.error("Provider dashboard error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProviderData();
  }, [user, router]);

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="animate-spin" size={32} color="#f84464" />
      </div>
    );
  }

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
            {provider?.business_name || 'Service Provider'} 🚀
          </h1>
          <p style={{ color: "#64748b", fontSize: "16px" }}>
            Managing your {provider?.category || 'professional'} services dashboard.
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
           <button style={{ padding: "12px 24px", background: "#f84464", color: "#fff", borderRadius: "14px", border: "none", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
             <Plus size={18} /> New Service
           </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px", marginBottom: "40px" }}>
        <StatCard title="Active Bookings" value={stats.bookings} icon={<Calendar color="#6366f1" />} color="#6366f1" />
        <StatCard title="Wallet Balance" value={`₹${stats.earnings}`} icon={<Wallet color="#22c55e" />} color="#22c55e" />
        <StatCard title="Services Listed" value={stats.services} icon={<Package color="#f43f5e" />} color="#f43f5e" />
        <StatCard title="Avg Rating" value={stats.rating} icon={<Star color="#f59e0b" />} color="#f59e0b" />
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "32px" }}>
        {/* Recent Activity */}
        <div style={{ background: "#fff", borderRadius: "24px", padding: "32px", border: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>Recent Bookings</h2>
            <button style={{ color: "#f84464", background: "none", border: "none", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>View All</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ color: "#94a3b8", textAlign: "center", padding: "40px 0" }}>No recent bookings to display.</p>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
           <div style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderRadius: "24px", padding: "32px", color: "#fff" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px" }}>Premium Status</h3>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", lineHeight: "1.6", marginBottom: "20px" }}>
                Your business is verified and visible to thousands of potential customers.
              </p>
              <button style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "12px", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
                Update Profile
              </button>
           </div>
           
           <div style={{ background: "#fff", borderRadius: "24px", padding: "24px", border: "1px solid #f1f5f9" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>Quick Links</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <QuickLink icon={<MessageSquare size={18} />} title="Messages" />
                <QuickLink icon={<Settings size={18} />} title="Service Settings" />
                <QuickLink icon={<Bell size={18} />} title="Notifications" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div style={{ 
      background: "#fff", 
      padding: "24px", 
      borderRadius: "20px", 
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
      border: "1px solid #f1f5f9"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div style={{ padding: "12px", background: `${color}10`, borderRadius: "14px" }}>{icon}</div>
        <TrendingUp size={16} color="#cbd5e1" />
      </div>
      <div>
        <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#64748b", marginBottom: "4px" }}>{title}</h3>
        <p style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a" }}>{value}</p>
      </div>
    </div>
  );
}

function QuickLink({ icon, title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", borderRadius: "12px", background: "#f8fafc", cursor: "pointer" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ color: "#64748b" }}>{icon}</div>
        <span style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{title}</span>
      </div>
      <ChevronRight size={16} color="#94a3b8" />
    </div>
  );
}
