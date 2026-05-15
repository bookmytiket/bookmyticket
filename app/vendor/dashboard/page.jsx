"use client";
import React from "react";
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { useAuth } from "@/components/AuthContext";
import { 
    CheckCircle, Clock, DollarSign, Star, 
    TrendingUp, Calendar as CalendarIcon,
    LayoutDashboard, Briefcase, Share,
    Package, Plus, Waves, Loader2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function VendorDashboard() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    // Security Guard: Redirect if not vendor or admin
    React.useEffect(() => {
        if (!loading && mounted) {
            if (!user) {
                router.replace("/signin?redirect=/vendor/dashboard");
            } else if (!['vendor', 'admin', 'super_admin'].includes(user.role)) {
                router.replace("/");
            }
        }
    }, [user, loading, router, mounted]);

    if (!mounted || loading) return (
        <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
            <Loader2 className="animate-spin" size={32} color="#f84464" />
        </div>
    );

    const isTurf = user?.category?.toLowerCase().includes("turf");
    const isPool = user?.category?.toLowerCase().includes("swimming");

    return (
        <div style={{ padding: "40px", maxWidth: "1400px", margin: "0 auto", fontFamily: "'Inter', sans-serif" }}>
            {/* Dynamic Content Based on Category */}
            {isTurf ? <TurfDashboard user={user} /> : 
             isPool ? <PoolDashboard user={user} /> : 
             <ProfessionalDashboard user={user} />}
        </div>
    );
}

function TurfDashboard({ user }) {
    // Isolated by RLS: These queries will only return the user's own data
    const { data: turfs = [] } = useSupabaseQuery('turfs');
    const { data: bookings = [] } = useSupabaseQuery('turf_bookings');

    return (
        <div className="space-y-8">
            <header style={{ marginBottom: "40px" }}>
                <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#0f172a" }}>Turf Dashboard 🏟️</h1>
                <p style={{ color: "#64748b" }}>Overview of your sports facilities and bookings.</p>
            </header>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
                <StatCard title="Total Revenue" value={`₹${bookings.reduce((s, b) => s + (b.total_amount || 0), 0)}`} icon={<DollarSign />} color="#22c55e" />
                <StatCard title="Active Turfs" value={turfs.length} icon={<Package />} color="#3b82f6" />
                <StatCard title="Confirmed" value={bookings.filter(b => b.status === 'confirmed').length} icon={<CheckCircle />} color="#6366f1" />
            </div>
            
            {/* Booking List would go here */}
        </div>
    );
}

function ProfessionalDashboard({ user }) {
    // Isolated by RLS
    const { data: profile = {} } = useSupabaseQuery('service_providers', (q) => q.single());
    const { data: bookings = [] } = useSupabaseQuery('vendor_bookings');

    return (
        <div className="space-y-8">
            <header style={{ marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#0f172a" }}>{profile?.business_name || 'Service Center'} ✨</h1>
                    <p style={{ color: "#64748b" }}>Manage your professional services and client requests.</p>
                </div>
                <button style={{ padding: "12px 24px", background: "#000", color: "#fff", borderRadius: "14px", border: "none", fontWeight: 700, cursor: "pointer" }}>
                    Promote Profile
                </button>
            </header>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", marginBottom: "40px" }}>
                <StatCard title="Earnings" value={`₹${bookings.reduce((s, b) => s + (b.total_amount || 0), 0)}`} icon={<DollarSign />} color="#22c55e" />
                <StatCard title="Requests" value={bookings.length} icon={<Clock />} color="#f59e0b" />
                <StatCard title="Rating" value={profile?.rating || '4.9'} icon={<Star />} color="#f43f5e" />
            </div>

            <div style={{ background: "#fff", borderRadius: "24px", padding: "32px", border: "1px solid #f1f5f9" }}>
                <h3 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "24px" }}>Recent Inquiries</h3>
                {bookings.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                        <Briefcase size={40} style={{ marginBottom: "12px", opacity: 0.3 }} />
                        <p>Your inbox is currently empty.</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {bookings.slice(0, 5).map(b => (
                            <div key={b.id} style={{ padding: "16px", background: "#f8fafc", borderRadius: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <p style={{ fontWeight: 700, marginBottom: "4px" }}>{b.customer_name || 'Premium Client'}</p>
                                    <p style={{ fontSize: "12px", color: "#64748b" }}>{b.booking_date} · {b.service_type || 'Custom Service'}</p>
                                </div>
                                <span style={{ padding: "6px 12px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "12px", fontWeight: 600 }}>
                                    Details
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function PoolDashboard({ user }) {
    return <div>Pool Dashboard Content</div>; // Placeholder
}

function StatCard({ title, value, icon, color }) {
    return (
        <div style={{ 
            background: "#fff", 
            padding: "24px", 
            borderRadius: "20px", 
            border: "1px solid #f1f5f9",
            boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                <div style={{ padding: "12px", background: `${color}10`, borderRadius: "12px", color: color }}>
                    {icon}
                </div>
                <TrendingUp size={16} color="#cbd5e1" />
            </div>
            <h4 style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>{title}</h4>
            <p style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a" }}>{value}</p>
        </div>
    );
}
