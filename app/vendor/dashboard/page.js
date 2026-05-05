"use client";
import React from "react";
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { useAuth } from "@/components/AuthContext";
import { getVendorAccountKey } from "@/lib/vendorAccount";
import { 
    CheckCircle, 
    Clock, 
    DollarSign, 
    Star, 
    TrendingUp, 
    Users, 
    Calendar as CalendarIcon,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Filter,
    Sparkles,
    Image as ImageIcon,
    LayoutDashboard,
    Briefcase,
    Share,
    Package,
    Plus,
    Waves
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PromoteModal from "@/components/PromoteModal";

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const vendorId = getVendorAccountKey(user);
    const [mounted, setMounted] = React.useState(false);
    const [promoteProfileModal, setPromoteProfileModal] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    React.useEffect(() => {
        if (!loading && !user && mounted) {
            router.push("/signin?redirect=/vendor/dashboard");
        }
    }, [user, loading, router, mounted]);

    const isTurfVendor = user?.category?.toLowerCase().includes("turf");
    const isPoolVendor = user?.category?.toLowerCase().includes("swimming");

    // Common Profile Query
    const { data: profileArr = [], loading: profileLoading } = useSupabaseQuery('service_providers', (q) => 
        q.eq('organiser_id', vendorId).single()
    , [vendorId]);

    const profile = profileArr && !Array.isArray(profileArr) ? profileArr : null;

    if (!mounted) return null;

    if (isTurfVendor) {
        return <TurfDashboardContent user={user} vendorId={vendorId} promoteProfileModal={promoteProfileModal} setPromoteProfileModal={setPromoteProfileModal} />;
    }

    if (isPoolVendor) {
        return <PoolDashboardContent user={user} vendorId={vendorId} promoteProfileModal={promoteProfileModal} setPromoteProfileModal={setPromoteProfileModal} />;
    }

    return <ArtistDashboardContent user={user} vendorId={vendorId} profile={profile} promoteProfileModal={promoteProfileModal} setPromoteProfileModal={setPromoteProfileModal} />;
}

function TurfDashboardContent({ user, vendorId, promoteProfileModal, setPromoteProfileModal }) {
    const { data: turfs = [] } = useSupabaseQuery('turfs', (q) => q.eq('organiser_id', vendorId || ""), [vendorId]);
    const { data: bookings = [] } = useSupabaseQuery('turf_bookings', (q) => q.eq('organiser_id', vendorId || ""), [vendorId]);
    
    const now = new Date();
    const currentMonth = now.toISOString().split("-").slice(0, 2).join("-"); // YYYY-MM

    const stats = {
        totalTurfs: turfs?.length || 0,
        totalBookings: bookings.length,
        totalEarnings: bookings
            .filter(b => b.booking_status === "confirmed" || b.booking_status === "completed")
            .reduce((acc, b) => acc + b.total_amount, 0),
        pendingBookings: bookings.filter(b => b.booking_status === "pending").length,
        mtdEarnings: bookings
            .filter(b => b.date.startsWith(currentMonth))
            .reduce((acc, b) => acc + b.total_amount, 0),
        occupancyRate: Math.min(100, Math.round((bookings.length / ((turfs?.length || 1) * 30 || 1)) * 100)) // Heuristic: 1 booking per day per turf
    };

    const statCards = [
        { name: "Total Revenue", value: `₹${stats.totalEarnings}`, icon: DollarSign, color: "text-blue-500", bg: "bg-blue-50", trend: `₹${stats.mtdEarnings} MTD`, trendUp: true },
        { name: "Active Facilities", value: stats.totalTurfs, icon: Package, color: "text-emerald-500", bg: "bg-emerald-50", trend: "Inventory Live", trendUp: true },
        { name: "Occupancy Rate", value: `${stats.occupancyRate}%`, icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-50", trend: "High Utilization", trendUp: true },
        { name: "Pending Tasks", value: stats.pendingBookings, icon: Clock, color: "text-amber-500", bg: "bg-amber-50", trend: "Immediate Action", trendUp: false },
    ];

    return (
        <div className="space-y-6     pb-12">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/20">
                            <LayoutDashboard size={20} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
                            Turf Operations
                        </h2>
                    </div>
                    <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.3em] ml-1">
                        Performance overview of your facilities
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setPromoteProfileModal(true)}
                        className="group bg-blue-50 border border-blue-200 px-6 py-2.5 rounded-xl text-blue-600 font-black text-[9px] shadow-sm hover:shadow-xl hover:bg-blue-100 transition-all flex items-center gap-2 uppercase tracking-widest"
                    >
                        <Share size={14} />
                        Promote
                    </button>
                    <Link 
                        href="/vendor/services"
                        className="group bg-slate-900 border border-slate-800 px-6 py-2.5 rounded-xl text-white font-black text-[9px] shadow-sm hover:shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2 uppercase tracking-widest"
                    >
                        <Plus size={14} className="text-blue-600 group-hover:rotate-90 transition-transform" />
                        Manager
                    </Link>
                </div>
            </div>

            {/* Stat Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, i) => (
                    <div 
                        key={stat.name}
                        className="group relative bg-white rounded-2xl p-4 border border-slate-100 hover:border-blue-500/20 transition-all  shadow-xl shadow-slate-200/40 overflow-hidden"
                    >
                        <div className="flex items-center justify-between relative z-10">
                            <div className={`p-3 rounded-xl bg-slate-50 border border-slate-100 ${stat.color} shadow-inner group-hover:bg-white transition-colors`}>
                                <stat.icon size={18} strokeWidth={2.5} />
                            </div>
                            <div className={`text-[8px] font-black tracking-widest px-2.5 py-1 rounded-full border uppercase ${stat.trendUp ? 'text-emerald-500 bg-emerald-50 border-emerald-100' : 'text-amber-500 bg-amber-50 border-amber-100'}`}>
                                {stat.trend}
                            </div>
                        </div>

                        <div className="mt-4 relative z-10">
                            <h3 className="text-slate-600 text-[8px] font-black uppercase tracking-widest">{stat.name}</h3>
                            <div className="text-2xl font-black text-slate-900 mt-1 tracking-tighter italic">
                                {stat.value}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Recent Bookings */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                            <h3 className="text-lg font-black text-slate-900 italic tracking-tighter uppercase">Recent Reservations</h3>
                        </div>
                        <span className="text-[8px] font-black text-white bg-slate-900 px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-slate-900/10">
                            {bookings.length} Hits
                        </span>
                    </div>

                    <div className="space-y-3">
                        {bookings.length > 0 ? bookings.slice(0, 5).map((booking) => (
                            <div 
                                key={booking.id}
                                className="group bg-white rounded-2xl p-4 border border-slate-100 hover:border-blue-500/20 transition-all flex flex-col md:flex-row md:items-center justify-between shadow-xl shadow-slate-200/30 relative overflow-hidden"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-slate-50 text-blue-600 border border-slate-100 flex items-center justify-center text-lg font-black italic shadow-inner transform group-hover:scale-105 transition-transform  shrink-0">
                                        {booking.customer_details?.name?.charAt(0) || "U"}
                                    </div>
                                    
                                    <div className="space-y-0.5">
                                        <h4 className="text-lg font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors truncate">
                                            {booking.customer_details?.name || "Player Cluster"}
                                        </h4>
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center gap-1.5 text-[8px] font-black text-slate-600 uppercase tracking-widest">
                                                <CalendarIcon size={10} className="text-blue-500" />
                                                {booking.date}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-[8px] font-black text-slate-600 uppercase tracking-widest">
                                                <Clock size={10} className="text-emerald-500" />
                                                {booking.start_time} - {booking.end_time}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 mt-4 md:mt-0">
                                    <div className="text-right mr-2 text-slate-900 italic font-black text-base tracking-tighter shrink-0">
                                        ₹{booking.total_amount}
                                    </div>
                                    <Link 
                                        href="/vendor/bookings"
                                        className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 hover:scale-105 active:scale-95 transition-all text-center"
                                    >
                                        Inspect
                                    </Link>
                                </div>
                            </div>
                        )) : (
                            <div className="bg-white rounded-[2rem] p-16 border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
                                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shadow-inner">
                                    <CheckCircle size={32} strokeWidth={1} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Empty Grid</h4>
                                    <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.2em] max-w-xs">No active reservations detected.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Facility Roadmap */}
                <div className="space-y-6">
                    <div className="group relative p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-2xl overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform  scale-150">
                            <TrendingUp size={80} className="text-blue-500" />
                        </div>
                        
                        <div className="relative z-10 space-y-6">
                            <div className="space-y-1">
                                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-blue-600">Projected Yield</p>
                                <h4 className="text-2xl font-black text-white tracking-tighter italic">₹{stats.totalEarnings}</h4>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-3 rounded-xl">
                                    <p className="text-[7px] font-black text-white/40 uppercase tracking-widest mb-0.5">Status</p>
                                    <p className="text-sm font-black text-emerald-600 italic">ACTIVE</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-3 rounded-xl">
                                    <p className="text-[7px] font-black text-white/40 uppercase tracking-widest mb-0.5">Efficiency</p>
                                    <p className="text-sm font-black text-white italic">94%</p>
                                </div>
                            </div>

                            <button className="w-full bg-blue-600 text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] shadow-xl shadow-blue-600/20 hover:bg-white hover:text-black transition-all">
                                Settlement
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/30 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
                            <h3 className="text-base font-black text-slate-900 uppercase italic tracking-tighter">Facility Overview</h3>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest italic">Active Turfs</span>
                                <span className="text-base font-black text-slate-900 italic">{stats.totalTurfs}</span>
                            </div>
                            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest italic">Confirmed</span>
                                <span className="text-base font-black text-slate-900 italic">{stats.totalBookings}</span>
                            </div>
                        </div>

                        <Link href="/vendor/services" className="block w-full text-center text-[9px] font-black text-blue-600 hover:text-slate-900 transition-all uppercase tracking-[0.3em] pt-4 border-t border-slate-100">
                            Configure Pitches
                        </Link>
                    </div>
                </div>
            </div>

            {/* Promote Modal */}
            <PromoteModal
                isOpen={promoteProfileModal}
                onClose={() => setPromoteProfileModal(false)}
                title={user?.name || "Turf Facility"}
                imageUrl=""
                type="Service"
                bookingUrl={typeof window !== "undefined" && vendorId ? `${window.location.origin}/services/${vendorId}` : ""}
            />
        </div>
    );
}

function PoolDashboardContent({ user, vendorId, promoteProfileModal, setPromoteProfileModal }) {
    const { data: pools = [] } = useSupabaseQuery('swimming_pools', (q) => q.eq('vendor_id', vendorId || ""), [vendorId]);
    const { data: bookings = [] } = useSupabaseQuery('pool_bookings', (q) => q.eq('pool_id', pools?.[0]?.id || "").order('created_at', { ascending: false }), [pools]);
    
    const stats = {
        totalPools: pools?.length || 0,
        totalRequests: bookings.length,
        approvedRequests: bookings.filter(b => b.status === "Approved" || b.status === "Completed").length,
        pendingRequests: bookings.filter(b => b.status === "Pending").length,
    };

    const statCards = [
        { name: "Total Pools", value: stats.totalPools, icon: Waves, color: "text-sky-500", bg: "bg-sky-50", trend: "Inventory Live", trendUp: true },
        { name: "Total Requests", value: stats.totalRequests, icon: Clock, color: "text-blue-500", bg: "bg-blue-50", trend: "Customer Leads", trendUp: true },
        { name: "Approved", value: stats.approvedRequests, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50", trend: "Revenue Source", trendUp: true },
        { name: "Pending Approval", value: stats.pendingRequests, icon: Star, color: "text-amber-500", bg: "bg-amber-50", trend: "Needs Attention", trendUp: false },
    ];

    return (
        <div className="space-y-6     pb-12">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-sky-500 rounded-xl text-white shadow-lg shadow-sky-500/20">
                            <Waves size={20} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
                            Pool Operations
                        </h2>
                    </div>
                    <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.3em] ml-1">
                        Management hub for your swimming facilities
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setPromoteProfileModal(true)}
                        className="group bg-sky-50 border border-sky-200 px-6 py-2.5 rounded-xl text-sky-600 font-black text-[9px] shadow-sm hover:shadow-xl hover:bg-sky-100 transition-all flex items-center gap-2 uppercase tracking-widest"
                    >
                        <Share size={14} />
                        Promote
                    </button>
                    <Link 
                        href="/vendor/swimming-pool"
                        className="group bg-slate-900 border border-slate-800 px-6 py-2.5 rounded-xl text-white font-black text-[9px] shadow-sm hover:shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2 uppercase tracking-widest"
                    >
                        <Plus size={14} className="text-sky-600 group-hover:rotate-90 transition-transform" />
                        Pool Manager
                    </Link>
                </div>
            </div>

            {/* Stat Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, i) => (
                    <div 
                        key={stat.name}
                        className="group relative bg-white rounded-2xl p-4 border border-slate-100 hover:border-sky-500/20 transition-all  shadow-xl shadow-slate-200/40 overflow-hidden"
                    >
                        <div className="flex items-center justify-between relative z-10">
                            <div className={`p-3 rounded-xl bg-slate-50 border border-slate-100 ${stat.color} shadow-inner group-hover:bg-white transition-colors`}>
                                <stat.icon size={18} strokeWidth={2.5} />
                            </div>
                            <div className={`text-[8px] font-black tracking-widest px-2.5 py-1 rounded-full border uppercase ${stat.trendUp ? 'text-emerald-500 bg-emerald-50 border-emerald-100' : 'text-amber-500 bg-amber-50 border-amber-100'}`}>
                                {stat.trend}
                            </div>
                        </div>

                        <div className="mt-4 relative z-10">
                            <h3 className="text-slate-600 text-[8px] font-black uppercase tracking-widest">{stat.name}</h3>
                            <div className="text-2xl font-black text-slate-900 mt-1 tracking-tighter italic">
                                {stat.value}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Recent Bookings */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-5 bg-sky-600 rounded-full"></div>
                            <h3 className="text-lg font-black text-slate-900 italic tracking-tighter uppercase">Recent Inquiries</h3>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {bookings.length > 0 ? bookings.slice(0, 5).map((booking) => (
                            <div 
                                key={booking.id}
                                className="group bg-white rounded-2xl p-4 border border-slate-100 hover:border-sky-500/20 transition-all flex flex-col md:flex-row md:items-center justify-between shadow-xl shadow-slate-200/30 relative overflow-hidden"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-slate-50 text-sky-600 border border-slate-100 flex items-center justify-center text-lg font-black italic shadow-inner transform group-hover:scale-105 transition-transform  shrink-0">
                                        P
                                    </div>
                                    
                                    <div className="space-y-0.5">
                                        <h4 className="text-lg font-black text-slate-900 tracking-tight group-hover:text-sky-600 transition-colors truncate">
                                            Request for {booking.booking_date}
                                        </h4>
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center gap-1.5 text-[8px] font-black text-slate-600 uppercase tracking-widest">
                                                <CalendarIcon size={10} className="text-sky-500" />
                                                {booking.booking_date}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-[8px] font-black text-slate-600 uppercase tracking-widest">
                                                <Clock size={10} className="text-emerald-500" />
                                                {booking.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 mt-4 md:mt-0">
                                    <Link 
                                        href="/vendor/swimming-pool"
                                        className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 hover:scale-105 active:scale-95 transition-all text-center"
                                    >
                                        Manage
                                    </Link>
                                </div>
                            </div>
                        )) : (
                            <div className="bg-white rounded-[2rem] p-16 border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
                                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shadow-inner">
                                    <CheckCircle size={32} strokeWidth={1} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">No Requests</h4>
                                    <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.2em] max-w-xs">No active inquiries detected.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pool Overview */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/30 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-5 bg-sky-500 rounded-full"></div>
                            <h3 className="text-base font-black text-slate-900 uppercase italic tracking-tighter">Facility Overview</h3>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest italic">Active Pools</span>
                                <span className="text-base font-black text-slate-900 italic">{stats.totalPools}</span>
                            </div>
                            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest italic">Pending Leads</span>
                                <span className="text-base font-black text-slate-900 italic">{stats.pendingRequests}</span>
                            </div>
                        </div>

                        <Link href="/vendor/swimming-pool" className="block w-full text-center text-[9px] font-black text-sky-600 hover:text-slate-900 transition-all uppercase tracking-[0.3em] pt-4 border-t border-slate-100">
                            Configure Pools
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ArtistDashboardContent({ user, vendorId, profile, promoteProfileModal, setPromoteProfileModal }) {
    const { data: bookingsRaw = [] } = useSupabaseQuery('vendor_bookings', (q) => 
        q.eq('vendor_id', vendorId).eq('status', 'Pending')
    , [vendorId]);

    const bookings = React.useMemo(() => {
        return bookingsRaw.filter(b => {
            const diff = Date.now() - new Date(b.created_at).getTime();
            return diff < (24 * 60 * 60 * 1000);
        });
    }, [bookingsRaw]);

    const { data: allBookings = [] } = useSupabaseQuery('vendor_bookings', (q) => 
        q.eq('vendor_id', vendorId)
    , [vendorId]);

    const { data: reviews = [] } = useSupabaseQuery('service_reviews', (q) => 
        q.eq('vendor_id', vendorId)
    , [vendorId]);

    const stats = React.useMemo(() => {
        const confirmed = allBookings.filter(b => b.status === 'Confirmed' || b.status === 'Completed');
        return {
            totalBookings: allBookings.length,
            totalEarnings: confirmed.reduce((acc, b) => acc + (b.total_amount || 0), 0),
            upcomingJobs: confirmed.filter(b => new Date(b.booking_date) >= new Date()).length,
            avgRating: reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0
        };
    }, [allBookings, reviews]);

    const upcoming = React.useMemo(() => {
        return allBookings
            .filter(b => b.status === 'Confirmed' && new Date(b.booking_date) >= new Date())
            .sort((a, b) => new Date(a.booking_date) - new Date(b.booking_date));
    }, [allBookings]);

    const portfolioCount = profile?.portfolio?.length || 0;

    const statCards = [
        { name: "Total Earnings", value: `₹${stats.totalEarnings}`, icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-50", trend: "+12.5%", trendUp: true },
        { name: "Confirmed Jobs", value: stats.upcomingJobs, icon: Clock, color: "text-amber-500", bg: "bg-amber-50", trend: "+3 this week", trendUp: true },
        { name: "Portfolio Arts", value: portfolioCount, icon: ImageIcon, color: "text-indigo-500", bg: "bg-indigo-50", trend: "Ready to show", trendUp: true },
        { name: "Client Rating", value: Number(stats?.avgRating) > 0 ? Number(stats.avgRating).toFixed(1) : "N/A", icon: Star, color: "text-pink-500", bg: "bg-pink-50", trend: "Top Rated", trendUp: true },
    ];

    return (
        <div className="space-y-6     pb-12">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-pink-500 rounded-xl text-white shadow-lg shadow-pink-500/20">
                            <LayoutDashboard size={20} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
                            Artist Center
                        </h2>
                    </div>
                    <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.3em] ml-1">
                        Operational Hub for your Boutique
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setPromoteProfileModal(true)}
                        className="group bg-pink-50 border border-pink-200 px-6 py-2.5 rounded-xl text-pink-500 font-black text-[9px] shadow-sm hover:shadow-xl hover:bg-pink-100 transition-all flex items-center gap-2 uppercase tracking-widest"
                    >
                        <Share size={14} className="text-pink-500" />
                        Promote
                    </button>
                    <Link 
                        href="/vendor/services"
                        className="group bg-white border border-slate-200 px-6 py-2.5 rounded-xl text-slate-900 font-black text-[9px] shadow-sm hover:shadow-xl hover:border-pink-500/30 transition-all flex items-center gap-2 uppercase tracking-widest"
                    >
                        <Sparkles size={14} className="text-pink-500 group-hover:" />
                        Expand
                    </Link>
                </div>
            </div>

            {/* Promote Modal */}
            <PromoteModal
                isOpen={promoteProfileModal}
                onClose={() => setPromoteProfileModal(false)}
                title={profile?.name || "Professional Services"}
                imageUrl={profile?.portfolio?.[0]?.url || ""}
                type="Service"
                bookingUrl={typeof window !== "undefined" && vendorId ? `${window.location.origin}/services/${vendorId}` : ""}
            />

            {/* Stat Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, i) => (
                    <div 
                        key={stat.name}
                        className="group relative bg-white rounded-2xl p-4 border border-slate-100 hover:border-pink-500/20 transition-all  shadow-xl shadow-slate-200/40 overflow-hidden"
                    >
                        <div className="flex items-center justify-between relative z-10">
                            <div className={`p-3 rounded-xl bg-slate-50 border border-slate-100 ${stat.color} shadow-inner group-hover:bg-white transition-colors`}>
                                <stat.icon size={18} strokeWidth={2.5} />
                            </div>
                            <div className="text-[8px] font-black tracking-widest text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100 uppercase">
                                {stat.trend}
                            </div>
                        </div>

                        <div className="mt-4 relative z-10">
                            <h3 className="text-slate-600 text-[8px] font-black uppercase tracking-[0.2em]">{stat.name}</h3>
                            <div className="text-2xl font-black text-slate-900 mt-1 group-hover:text-pink-600 transition-colors tracking-tighter italic">
                                {stat.value}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Pending Requests */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-5 bg-yellow-400 rounded-full"></div>
                            <h3 className="text-lg font-black text-slate-900 italic tracking-tighter uppercase">Incoming Requests</h3>
                        </div>
                        <span className="text-[8px] font-black text-white bg-slate-900 px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-slate-900/10">
                            {bookings.length} Leads
                        </span>
                    </div>

                    <div className="space-y-3">
                        {bookings.length > 0 ? bookings.map((booking) => (
                            <div 
                                key={booking.id}
                                className="group bg-white rounded-2xl p-4 border border-slate-100 hover:border-pink-500/20 transition-all flex flex-col md:flex-row md:items-center justify-between shadow-xl shadow-slate-200/30 relative overflow-hidden"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-slate-50 text-pink-500 border border-slate-100 flex items-center justify-center text-lg font-black italic shadow-inner transform group-hover:scale-105 transition-transform  shrink-0">
                                        {booking.customer_details?.name?.charAt(0) || "U"}
                                    </div>
                                    
                                    <div className="space-y-0.5">
                                        <h4 className="text-lg font-black text-slate-900 tracking-tight group-hover:text-pink-600 transition-colors truncate">
                                            {booking.customer_details?.name || "Premium Client"}
                                        </h4>
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center gap-1.5 text-[8px] font-black text-slate-600 uppercase tracking-widest">
                                                <CalendarIcon size={10} className="text-yellow-500" />
                                                {booking.booking_date}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-[8px] font-black text-slate-600 uppercase tracking-widest">
                                                <Clock size={10} className="text-pink-500" />
                                                {booking.booking_time || "Flexi"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2.5 mt-4 md:mt-0">
                                    <button className="flex-1 md:flex-none px-6 py-2.5 rounded-xl bg-slate-50 text-slate-700 text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 hover:text-slate-900 transition-all border border-slate-200/50">
                                        Details
                                    </button>
                                    <button className="flex-1 md:flex-none px-6 py-2.5 rounded-xl bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 hover:scale-105 active:scale-95 transition-all">
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="bg-white rounded-[2rem] p-16 border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
                                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shadow-inner">
                                    <CheckCircle size={32} strokeWidth={1} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Agenda Zero</h4>
                                    <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.2em] max-w-xs">All queues are cleared.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Earning Overview Section */}
                <div className="space-y-6">
                    {/* Premium Earnings Card */}
                    <div className="group relative p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-2xl overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform  scale-150">
                            <Sparkles size={80} className="text-pink-500" />
                        </div>
                        
                        <div className="relative z-10 space-y-6">
                            <div className="space-y-1">
                                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-pink-600">Portfolio Yield</p>
                                <h4 className="text-2xl font-black text-white tracking-tighter italic">₹{stats.totalEarnings}</h4>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-3 rounded-xl">
                                    <p className="text-[7px] font-black text-white/40 uppercase tracking-widest mb-0.5">Score</p>
                                    <p className="text-sm font-black text-white italic">9.8/10</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-3 rounded-xl">
                                    <p className="text-[7px] font-black text-white/40 uppercase tracking-widest mb-0.5">status</p>
                                    <p className="text-sm font-black text-emerald-600 italic">LIVE</p>
                                </div>
                            </div>

                            <button className="w-full bg-pink-600 text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] shadow-xl shadow-pink-600/20 hover:bg-white hover:text-black transition-all">
                                Settlement
                            </button>
                        </div>
                    </div>

                    {/* Upcoming Jobs */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/30 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
                            <h3 className="text-base font-black text-slate-900 uppercase italic tracking-tighter">Immediate Roadmap</h3>
                        </div>

                        {upcoming.length > 0 ? (
                            <div className="space-y-4">
                                {upcoming.slice(0, 3).map((job, i) => (
                                    <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 p-2 -mx-2 rounded-xl transition-all border border-transparent hover:border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-emerald-500 border border-slate-100 shadow-inner shrink-0">
                                                <Briefcase size={16} strokeWidth={2.5} />
                                            </div>
                                            <div className="space-y-0">
                                                <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight italic">{job.customer_details?.name || "Client"}</p>
                                                <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">{job.booking_date}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-emerald-600 tracking-tight italic">₹{job.total_amount}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 space-y-3">
                                <div className="text-slate-700">
                                    <Clock size={32} strokeWidth={1} />
                                </div>
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Roadmap Clear</p>
                            </div>
                        )}
                        
                        <Link href="/vendor/calendar" className="block w-full text-center text-[9px] font-black text-pink-500 hover:text-slate-900 transition-all uppercase tracking-[0.3em] pt-4 border-t border-slate-100">
                            Schedule
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
