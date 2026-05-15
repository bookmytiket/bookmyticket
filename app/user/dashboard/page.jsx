"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthContext";
import { 
  Ticket, Wallet, Heart, Bell, MessageSquare, 
  Calendar, ShoppingBag, User as UserIcon,
  ChevronRight, ArrowUpRight, TrendingUp
} from "lucide-react";

export default function UserDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    bookings: 0,
    wishlist: 0,
    wallet: 0,
    notifications: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchStats() {
      setLoading(true);
      try {
        const [bookingsRes, wishlistRes, walletRes, notifRes] = await Promise.all([
          supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('user_wishlists').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('wallets').select('balance').eq('user_id', user.id).maybeSingle(),
          supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false)
        ]);

        setStats({
          bookings: bookingsRes.count || 0,
          wishlist: wishlistRes.count || 0,
          wallet: walletRes.data?.balance || 0,
          notifications: notifRes.count || 0
        });
      } catch (err) {
        console.error("Dashboard stats error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [user]);

  if (!user) return null;

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
          Welcome back, {user.full_name?.split(' ')[0] || 'User'}! 👋
        </h1>
        <p style={{ color: "#64748b", fontSize: "16px" }}>
          Here's a summary of your activity and upcoming events.
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px", marginBottom: "40px" }}>
        <StatCard title="Total Bookings" value={stats.bookings} icon={<Ticket color="#6366f1" />} color="#6366f1" />
        <StatCard title="Wallet Balance" value={`₹${stats.wallet}`} icon={<Wallet color="#22c55e" />} color="#22c55e" />
        <StatCard title="Wishlist Items" value={stats.wishlist} icon={<Heart color="#f43f5e" />} color="#f43f5e" />
        <StatCard title="Unread Alerts" value={stats.notifications} icon={<Bell color="#f59e0b" />} color="#f59e0b" />
      </div>

      {/* Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
        <ActionCard 
          title="My Tickets" 
          desc="View and download your event QR tickets" 
          icon={<Ticket />} 
          link="/user/tickets" 
          bg="linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
        />
        <ActionCard 
          title="Explore Events" 
          desc="Discover the best events happening near you" 
          icon={<Calendar />} 
          link="/events" 
          bg="linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)"
        />
        <ActionCard 
          title="Messages" 
          desc="Chat with event organisers and providers" 
          icon={<MessageSquare />} 
          link="/user/chat" 
          bg="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
        />
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
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
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

function ActionCard({ title, desc, icon, link, bg }) {
  return (
    <a href={link} style={{ 
      background: bg, 
      padding: "32px", 
      borderRadius: "24px", 
      color: "#fff", 
      textDecoration: "none",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      minHeight: "180px",
      transition: "transform 0.3s ease",
      cursor: "pointer"
    }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-5px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ padding: "12px", background: "rgba(255,255,255,0.2)", borderRadius: "16px" }}>{icon}</div>
        <ArrowUpRight />
      </div>
      <div>
        <h3 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px" }}>{title}</h3>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)", lineHeight: "1.5" }}>{desc}</p>
      </div>
    </a>
  );
}
