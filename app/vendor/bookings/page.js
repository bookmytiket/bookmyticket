import { useSupabaseQuery, useSupabaseMutation } from "@/hooks/useSupabase";
import { useAuth } from "@/components/AuthContext";
import { getVendorAccountKey } from "@/lib/vendorAccount";
import { 
    Search, 
    Filter, 
    MoreVertical, 
    CheckCircle, 
    XCircle, 
    Calendar as CalendarIcon, 
    Clock, 
    MapPin, 
    Phone, 
    Mail,
    ChevronRight,
    MessageSquare,
    AlertCircle
} from "lucide-react";

export default function BookingsPage() {
    const { user } = useAuth();
    const vendorId = getVendorAccountKey(user);

    const { data: profileArr = [] } = useSupabaseQuery('service_providers', (q) => 
        q.eq('organiser_id', vendorId).single()
    , [vendorId]);
    const profile = profileArr && !Array.isArray(profileArr) ? profileArr : null;

    const isTurfVendor = user?.role === "turf_organiser" || profile?.category?.toLowerCase().includes("turf");

    if (isTurfVendor) {
        return <TurfBookingRegistry user={user} vendorId={vendorId} />;
    }

    return <ArtistBookingRegistry user={user} vendorId={vendorId} profile={profile} />;
}

function TurfBookingRegistry({ user, vendorId }) {
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedBooking, setSelectedBooking] = useState(null);

    const { data: bookings = [] } = useSupabaseQuery('turf_bookings', (q) => {
        let query = q.eq('organiser_id', vendorId).order('created_at', { ascending: false });
        if (statusFilter !== "all") {
            query = query.eq('status', statusFilter);
        }
        return query;
    }, [vendorId, statusFilter]);

    const [updateStatus] = useSupabaseMutation('turf_bookings', 'update', (q, p) => q.eq('id', p.id));

    const filteredBookings = (bookings || []).filter(b => {
        const matchesSearch = (b.customer_details?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                             (b.turf_name || "").toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case "pending": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
            case "confirmed": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
            case "cancelled": return "bg-red-500/10 text-red-500 border-red-500/20";
            default: return "bg-slate-500/10 text-slate-500 border-slate-500/20";
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await updateStatus({ id, status });
        } catch (error) {
            console.error("Failed to update status:", error);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/20">
                            <CalendarIcon size={20} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Reservation Ledger</h2>
                    </div>
                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.3em] ml-1">Operational Log for all activities</p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="relative group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors" size={16} />
                        <input 
                            type="text" 
                            placeholder="Find records..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-6 text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/30 transition-all w-full md:w-64 shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-4 scrollbar-hide px-1">
                {["all", "pending", "confirmed", "cancelled"].map((status) => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all duration-300 whitespace-nowrap ${
                            statusFilter === status 
                                ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/10' 
                                : 'bg-white text-slate-400 border-slate-200 hover:border-blue-500/30 hover:text-blue-500 shadow-sm'
                        }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden relative">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[13px]">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100/50 text-slate-400 font-black text-[8px] uppercase tracking-[0.2em]">
                                <th className="px-6 py-4">Lead / Player</th>
                                <th className="px-6 py-4">Facility / Pitch</th>
                                <th className="px-6 py-4">Time Slot</th>
                                <th className="px-6 py-4">Financials</th>
                                <th className="px-6 py-4 text-right">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                             {filteredBookings.length > 0 ? filteredBookings.map((booking) => (
                                <tr key={booking.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="flex items-center space-x-3">
                                            <div className="relative">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 text-blue-600 border border-slate-100 flex items-center justify-center font-black italic shadow-inner group-hover:scale-105 transition-transform shrink-0">
                                                    {booking.customer_details?.name?.charAt(0) || "U"}
                                                </div>
                                                <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${getStatusColor(booking.status).split(' ')[0]}`}></div>
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-slate-900 font-black text-[13px] tracking-tight italic uppercase truncate">{booking.customer_details?.name || "Player Cluster"}</div>
                                                <div className="text-slate-400 text-[8px] font-bold uppercase tracking-widest mt-0.5 truncate">{booking.customer_details?.phone || "Private Entry"}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-slate-800 text-[13px] font-black uppercase italic tracking-tight truncate">{booking.turf_name}</div>
                                        <div className="flex items-center gap-1.5 mt-1 text-slate-400 text-[8px] font-black uppercase tracking-widest truncate">
                                            <MapPin size={10} className="text-blue-500" />
                                            Active Field
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col space-y-0.5">
                                            <div className="flex items-center space-x-1.5 text-slate-900 font-black text-[11px] tracking-tight italic whitespace-nowrap">
                                                <CalendarIcon size={12} className="text-blue-500" />
                                                <span>{booking.date}</span>
                                            </div>
                                            <div className="flex items-center space-x-1.5 text-slate-400 text-[8px] font-black uppercase tracking-widest whitespace-nowrap">
                                                <Clock size={10} className="text-emerald-500" />
                                                <span>{booking.start_time} - {booking.end_time}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-slate-900 font-black text-[13px] tracking-tight italic whitespace-nowrap">₹{booking.total_amount}</div>
                                        <div className={`text-[7px] mt-1 font-black uppercase tracking-[0.2em] flex items-center gap-1 whitespace-nowrap ${booking.payment_status === 'fully_paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                            <div className={`w-1 h-1 rounded-full animate-pulse ${booking.payment_status === 'fully_paid' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                            {(booking.payment_status || 'pending').replace("_", " ")}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center justify-end space-x-2">
                                            {booking.status === "pending" && (
                                                <>
                                                    <button 
                                                        onClick={() => handleStatusUpdate(booking.id, "confirmed")}
                                                        className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 shadow-sm"
                                                        title="Confirm"
                                                    >
                                                        <CheckCircle size={16} strokeWidth={2.5} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleStatusUpdate(booking.id, "cancelled")}
                                                        className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-100 shadow-sm"
                                                        title="Reject"
                                                    >
                                                        <XCircle size={16} strokeWidth={2.5} />
                                                    </button>
                                                </>
                                            )}
                                            <button 
                                                onClick={() => setSelectedBooking(booking)}
                                                className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm flex items-center gap-2 group"
                                            >
                                                <ChevronRight size={16} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-6">
                                            <div className="w-24 h-24 rounded-[3rem] bg-slate-50 text-slate-100 flex items-center justify-center border border-slate-100 shadow-inner">
                                                <AlertCircle size={48} />
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="text-slate-900 font-black text-3xl tracking-tighter uppercase italic">Ledger Empty</h4>
                                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">No operational records found in this sequence.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Inspector Modal */}
            {selectedBooking && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
                    <div 
                        className="bg-white w-full max-w-xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 slide-in-from-bottom-5 duration-500"
                    >
                        <div className="p-10 space-y-10">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Booking Insight</h3>
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Record ID: {selectedBooking.id.slice(-8)}</p>
                                </div>
                                <button 
                                    onClick={() => setSelectedBooking(null)}
                                    className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:bg-slate-100 transition-all"
                                >
                                    <XCircle size={20} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Player Identity</label>
                                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black italic">
                                                {selectedBooking.customer_details?.name?.charAt(0) || "P"}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 uppercase italic tracking-tight">{selectedBooking.customer_details?.name}</p>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Verified User</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contact Grid</label>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 text-slate-600">
                                                <Phone size={14} className="text-slate-400" />
                                                <span className="text-xs font-bold">{selectedBooking.customer_details?.phone || "N/A"}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-slate-600">
                                                <Mail size={14} className="text-slate-400" />
                                                <span className="text-xs font-bold">{selectedBooking.customer_details?.email || "N/A"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Session Details</label>
                                        <div className="p-5 bg-slate-900 rounded-[2rem] text-white space-y-4">
                                            <div>
                                                <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Facility Name</p>
                                                <p className="text-base font-black italic tracking-tighter uppercase">{selectedBooking.turf_name}</p>
                                            </div>
                                            <div className="flex items-center justify-between border-t border-white/5 pt-4">
                                                <div>
                                                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-0.5">Date</p>
                                                    <p className="text-xs font-black">{selectedBooking.date}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-0.5">Slot</p>
                                                    <p className="text-xs font-black">{selectedBooking.start_time} - {selectedBooking.end_time}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Financial Summary</label>
                                        <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Net Revenue</span>
                                            <span className="text-xl font-black text-slate-900 italic">₹{selectedBooking.total_amount}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-4">
                            <button 
                                onClick={() => setSelectedBooking(null)}
                                className="px-12 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:scale-105 active:scale-95 transition-all w-full"
                            >
                                Acknowledge & Exit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ArtistBookingRegistry({ user, vendorId, profile }) {
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    const { data: bookings = [] } = useSupabaseQuery('vendor_bookings', (q) => {
        let query = q.eq('vendor_id', vendorId).order('created_at', { ascending: false });
        if (statusFilter !== "all") {
            query = query.eq('status', statusFilter);
        }
        return query;
    }, [vendorId, statusFilter]);

    const [updateStatus] = useSupabaseMutation('vendor_bookings', 'update', (q, p) => q.eq('id', p.id));

    const filteredBookings = (bookings || []).filter(b =>
        (b.customer_details?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.customer_details?.email || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleStatusUpdate = async (id, status) => {
        try {
            await updateStatus({ id, status });
        } catch (error) {
            console.error("Failed to update status:", error);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "pending": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
            case "confirmed": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
            case "completed": return "bg-green-500/10 text-green-500 border-green-500/20";
            case "cancelled": return "bg-red-500/10 text-red-500 border-red-500/20";
            default: return "bg-slate-500/10 text-slate-500 border-slate-500/20";
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-yellow-400 rounded-xl text-slate-900 shadow-lg shadow-yellow-400/20">
                            <CalendarIcon size={20} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Registry Hub</h2>
                    </div>
                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.3em] ml-1">Full Command over your professional service sessions</p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="relative group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-pink-500 transition-colors" size={16} />
                        <input 
                            type="text" 
                            placeholder="Find leads..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-6 text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-pink-500/5 focus:border-pink-500/30 transition-all w-full md:w-64 shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-4 scrollbar-hide px-1">
                {["all", "pending", "confirmed", "completed", "cancelled"].map((status) => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all duration-300 whitespace-nowrap ${
                            statusFilter === status 
                                ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/10' 
                                : 'bg-white text-slate-400 border-slate-200 hover:border-pink-500/30 hover:text-pink-500 shadow-sm'
                        }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden relative">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[13px]">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100/50 text-slate-400 font-black text-[8px] uppercase tracking-[0.2em]">
                                <th className="px-6 py-4">Customer Profile</th>
                                <th className="px-6 py-4">Session & Timeline</th>
                                <th className="px-6 py-4">Financials</th>
                                <th className="px-6 py-4">Current Status</th>
                                <th className="px-6 py-4 text-right">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredBookings.length > 0 ? filteredBookings.map((booking) => (
                                <tr key={booking.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 text-slate-900 border border-slate-200 flex items-center justify-center font-black italic shadow-inner group-hover:scale-105 transition-transform shrink-0">
                                                {booking.customer_details?.name?.charAt(0) || "U"}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-slate-900 font-black text-[13px] tracking-tight italic uppercase truncate">{booking.customer_details?.name}</div>
                                                <div className="text-slate-400 text-[8px] font-bold uppercase tracking-widest mt-0.5 truncate">{booking.customer_details?.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-slate-800 text-[13px] font-black uppercase italic tracking-tight truncate">{booking.service_type}</div>
                                        <div className="flex items-center space-x-3 mt-1.5 text-slate-400 text-[8px] font-black uppercase tracking-widest truncate">
                                            <span className="flex items-center space-x-1.5">
                                                <CalendarIcon size={12} className="text-pink-500" />
                                                <span>{booking.booking_date}</span>
                                            </span>
                                            <span className="text-slate-200">|</span>
                                            <span className="flex items-center space-x-1.5">
                                                <Clock size={12} className="text-yellow-500" />
                                                <span>{booking.booking_time || "Flexi"}</span>
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-slate-900 font-black text-[13px] tracking-tight italic whitespace-nowrap">₹{booking.total_amount}</div>
                                        <div className="text-[7px] text-emerald-500 mt-1 font-black uppercase tracking-[0.2em] flex items-center gap-1 whitespace-nowrap">
                                            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
                                            Fully Vetted
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <span className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-[0.1em] border shadow-sm ${getStatusColor(booking.status)}`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center justify-end space-x-2">
                                            {booking.status === "pending" && (
                                                <>
                                                    <button 
                                                        onClick={() => handleStatusUpdate(booking.id, "confirmed")}
                                                        className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 shadow-sm"
                                                        title="Confirm Session"
                                                    >
                                                        <CheckCircle size={16} strokeWidth={2.5} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleStatusUpdate(booking.id, "cancelled")}
                                                        className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-100 shadow-sm"
                                                        title="Decline Request"
                                                    >
                                                        <XCircle size={16} strokeWidth={2.5} />
                                                    </button>
                                                </>
                                            )}
                                            {booking.status === "confirmed" && (
                                                <button 
                                                    onClick={() => handleStatusUpdate(booking.id, "completed")}
                                                    className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-[8px] font-black hover:bg-pink-600 transition-all uppercase tracking-[0.2em] shadow-lg shadow-slate-900/10"
                                                >
                                                    Complete
                                                </button>
                                            )}
                                            <button className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm group">
                                                <MessageSquare size={16} strokeWidth={2.5} className="group-hover:animate-bounce" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-6">
                                            <div className="w-20 h-20 rounded-[2.5rem] bg-slate-50 text-slate-200 flex items-center justify-center border border-slate-100 shadow-inner">
                                                <AlertCircle size={40} />
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="text-slate-900 font-black text-2xl tracking-tighter uppercase italic">No Active Entries</h4>
                                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Our sensors found no matches for your current sweep.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
