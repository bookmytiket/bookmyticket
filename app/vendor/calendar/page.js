"use client";
import { useState, useEffect } from "react";
import { useSupabaseQuery, useSupabaseMutation } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthContext";
import { getVendorAccountKey } from "@/lib/vendorAccount";
import { 
    Calendar as CalendarIcon, 
    ChevronLeft, 
    ChevronRight, 
    Clock, 
    MapPin, 
    User, 
    CheckCircle,
    Info,
    CalendarDays,
    Settings,
    MoreVertical,
    CheckCircle2,
    X,
    Plus 
} from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function CalendarPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const vendorId = getVendorAccountKey(user);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    // 1. Fetch Vendor Details from service_providers
    const { data: providerArr = [] } = useSupabaseQuery('service_providers', (q) => 
        q.or(`id.eq.${vendorId},organiser_id.eq.${vendorId}`).maybeSingle()
    , [vendorId]);
    const provider = providerArr && !Array.isArray(providerArr) ? providerArr : null;
    const isTurf = provider?.category?.toLowerCase() === 'turf';

    // 2. Fetch Bookings
    const { data: turfBookings = [] } = useSupabaseQuery('turf_bookings', (q) => 
        q.eq('turf_id', provider?.id)
    , [provider?.id, isTurf]);

    const { data: artistBookings = [] } = useSupabaseQuery('vendor_bookings', (q) => 
        q.eq('vendor_id', provider?.id || vendorId)
    , [provider?.id, vendorId, !isTurf]);

    const bookings = isTurf ? turfBookings : artistBookings;

    // 3. Fetch Blocked Dates
    const { data: turfBlocks = [] } = useSupabaseQuery('turf_manual_blocks', (q) => 
        q.eq('turf_id', provider?.id)
    , [provider?.id, isTurf]);

    const [updateProvider] = useSupabaseMutation('service_providers', 'update', (q, p) => q.eq('id', p.id));
    const [createTurfBlock] = useSupabaseMutation('turf_manual_blocks', 'insert');
    const [deleteTurfBlock] = useSupabaseMutation('turf_manual_blocks', 'delete', (q, d) => q.eq('turf_id', provider?.id).eq('block_date', d.block_date));

    const blockedDates = isTurf 
        ? turfBlocks.map(b => b.block_date) 
        : (provider?.advanced_settings?.blocked_dates || []);

    const handleToggleBlockDate = async () => {
        const targetProviderId = provider?.id || vendorId;
        if (!targetProviderId || !selectedDate) {
            console.log("Missing target ID or date:", { targetProviderId, selectedDate: !!selectedDate });
            return;
        }

        const pad = (n) => String(n).padStart(2, '0');
        const dateStr = `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(selectedDate.getDate())}`;
        
        try {
            // 1. If provider record is missing, initialize it first
            if (!provider) {
                console.log("Calendar: Initializing missing service_provider record for blocking...");
                const { data: newProvider, error: insertError } = await supabase
                    .from('service_providers')
                    .insert({
                        id: targetProviderId,
                        organiser_id: targetProviderId,
                        business_name: user?.name || "Service Partner",
                        category: "Professional Service",
                        status: 'active',
                        advanced_settings: { blocked_dates: [dateStr] }
                    })
                    .select()
                    .single();
                
                if (insertError) throw insertError;
                showToast("Profile initialized and date blocked!", "success");
                // The page will re-fetch and provider will be populated
                return;
            }

            // 2. Existing provider logic
            if (isTurf) {
                const isBlocked = blockedDates.includes(dateStr);
                if (isBlocked) {
                    await deleteTurfBlock({ block_date: dateStr });
                    showToast("Date unblocked successfully", "info");
                } else {
                    await createTurfBlock({ turf_id: provider.id, block_date: dateStr, reason: 'Manual Block' });
                    showToast("Date blocked successfully", "success");
                }
            } else {
                const currentBlocks = Array.isArray(blockedDates) ? [...blockedDates] : [];
                const index = currentBlocks.indexOf(dateStr);
                const isBlocking = index === -1;

                if (index > -1) {
                    currentBlocks.splice(index, 1);
                } else {
                    currentBlocks.push(dateStr);
                }

                await updateProvider({ 
                    id: provider.id, 
                    advanced_settings: {
                        ...(provider.advanced_settings || {}),
                        blocked_dates: currentBlocks
                    }
                });
                showToast(isBlocking ? "Date blocked successfully" : "Date unblocked successfully", "success");
            }
        } catch (error) {
            console.error("Failed to toggle block date:", error);
            showToast(error.message || "Failed to update availability", "error");
        }
    };

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const days = [];
        const totalDays = daysInMonth(year, month);
        const startingDay = firstDayOfMonth(year, month);

        for (let i = 0; i < startingDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-12 md:h-14 bg-slate-50/30 border border-slate-50 opacity-20"></div>);
        }

        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(year, month, day);
            const isSelected = selectedDate.toDateString() === date.toDateString();
            const isToday = new Date().toDateString() === date.toDateString();
            
            const dayBookings = bookings.filter(b => {
                const bDate = new Date(b.booking_date || b.date);
                return bDate.toDateString() === date.toDateString();
            });
            const pad = (n) => String(n).padStart(2, '0');
            const dateStrForBlock = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
            const isBlocked = blockedDates.includes(dateStrForBlock);

            days.push(
                <div 
                    key={day} 
                    onClick={() => setSelectedDate(date)}
                    className={`h-12 md:h-14 border border-slate-50 p-1.5 md:p-2 transition-all cursor-pointer relative group overflow-hidden ${
                        isSelected ? 'bg-pink-50 ring-2 ring-pink-500/20 z-10' : 'bg-white hover:bg-slate-50'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className={`text-[11px] md:text-sm font-black ${
                            isSelected ? 'text-pink-600' : isBlocked ? 'text-red-500 line-through decoration-2' : isToday ? 'text-pink-500' : 'text-slate-900'
                        }`}>
                            {day}
                        </span>
                        {dayBookings.length > 0 ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shadow-xl shadow-pink-500/50 animate-pulse"></span>
                        ) : isBlocked ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-xl shadow-red-500/50"></span>
                        ) : null}
                    </div>
                    <div className="mt-2 space-y-1">
                        {dayBookings.slice(0, 1).map((b, i) => (
                            <div key={i} className="text-[7px] font-black uppercase tracking-tighter truncate bg-slate-900 text-white px-1.5 py-0.5 rounded shadow-lg italic">
                                {b.customer_details?.name || "Job"}
                            </div>
                        ))}
                        {isBlocked && dayBookings.length === 0 && (
                            <div className="text-[7px] font-black uppercase tracking-tighter truncate bg-red-100 text-red-600 px-1.5 py-0.5 rounded shadow-sm italic">
                                Blocked
                            </div>
                        )}
                        {dayBookings.length > 1 && (
                            <div className="text-[7px] font-black text-pink-500 uppercase tracking-widest pl-0.5">
                                + {dayBookings.length - 1} more
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return days;
    };

    const selectedDayBookings = bookings.filter(b => {
        const bDate = new Date(b.booking_date || b.date);
        return bDate.toDateString() === selectedDate.toDateString();
    });

    const pad = (n) => String(n).padStart(2, '0');
    const selectedDateStrForBlock = `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(selectedDate.getDate())}`;
    const isSelectedDateBlocked = blockedDates.includes(selectedDateStrForBlock);

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-3 border-b border-slate-200">
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white p-2 shadow-xl shadow-pink-500/20">
                            <CalendarDays size={20} />
                        </div>
                        <div>
                            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-pink-500">Logistics</span>
                            <h2 className="text-xl font-black text-slate-900 tracking-tighter italic uppercase underline decoration-pink-500/20 underline-offset-4">Engagement Map</h2>
                        </div>
                    </div>
                    <p className="text-slate-500 text-[10px] max-w-lg font-medium leading-relaxed">Systematically coordinate your upcoming assignments and buffer times.</p>
                </div>
                <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100 shadow-inner">
                    <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-2 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-100 hover:shadow-lg hover:shadow-slate-900/5">
                        <ChevronLeft size={16} className="text-slate-900" />
                    </button>
                    <span className="px-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 italic">
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-2 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-100 hover:shadow-lg hover:shadow-slate-900/5">
                        <ChevronRight size={16} className="text-slate-900" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Calendar Grid */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/50">
                        <div className="grid grid-cols-7 bg-slate-50/50 border-b border-slate-50 py-4">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">{day}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7">
                            {renderCalendar()}
                        </div>
                    </div>
                </div>

                {/* Day Details Sidebar */}
                <div className="space-y-8">
                    <div className="bg-white rounded-[1.5rem] p-4 border border-slate-100 shadow-xl shadow-slate-200/40 space-y-4 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 text-pink-500/5 opacity-50">
                            <Clock size={60} />
                        </div>
                        <div className="relative z-10 space-y-2">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[8px] font-black text-pink-500 uppercase tracking-[0.4em]">Assignments</h4>
                                <span className="px-2 py-0.5 bg-slate-900 text-white rounded-md text-[7px] font-black uppercase tracking-widest italic">{selectedDate.toDateString() === new Date().toDateString() ? 'Reality' : 'Manifested'}</span>
                            </div>
                            <div className="space-y-0.5 text-center py-2 border-y border-slate-50">
                                <p className="text-2xl font-black text-slate-900 tracking-tighter italic">{selectedDate.getDate()}</p>
                                <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.5em]">{selectedDate.toLocaleString('default', { month: 'long' })}</p>
                            </div>
                        </div>

                        <div className="space-y-4 relative z-10 pt-2">
                            {selectedDayBookings.length > 0 ? selectedDayBookings.map((b, i) => (
                                <div key={i} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 group hover:bg-pink-50 hover:border-pink-200 transition-all cursor-pointer shadow-inner">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-black text-slate-900 uppercase italic tracking-tight group-hover:text-pink-600 transition-colors">{b.customer_details?.name || "Client"}</p>
                                        <Clock size={12} className="text-slate-300 group-hover:text-pink-400" />
                                    </div>
                                    <div className="flex items-center space-x-2 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                                        <Clock size={10} />
                                        <span>{b.time || b.start_time || "10:00 AM"}</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate">
                                        <MapPin size={10} />
                                        <span>{b.location || b.address || "On-site"}</span>
                                    </div>
                                </div>
                            )) : isSelectedDateBlocked ? (
                                <div className="py-12 text-center space-y-4 border-2 border-dashed border-red-200 rounded-[2rem] bg-red-50/50">
                                    <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-500 mx-auto">
                                        <X size={24} />
                                    </div>
                                    <p className="text-red-600 text-[10px] font-black uppercase tracking-widest leading-relaxed px-6">Date is currently blocked</p>
                                </div>
                            ) : (
                                <div className="py-12 text-center space-y-4 border-2 border-dashed border-slate-100 rounded-[2rem]">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto">
                                        <CalendarIcon size={24} />
                                    </div>
                                    <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest leading-relaxed px-6">Empty space discovered in your schedule</p>
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={handleToggleBlockDate}
                            className={`w-full py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.4em] shadow-3xl transition-all italic relative z-10 ${
                                isSelectedDateBlocked 
                                    ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 shadow-red-500/10' 
                                    : 'bg-slate-900 text-white shadow-slate-900/20 hover:bg-pink-500 hover:shadow-pink-500/30'
                            }`}
                        >
                            {isSelectedDateBlocked ? 'Unblock Date' : 'Block Date'}
                        </button>
                    </div>

                    <div className="bg-gradient-to-br from-pink-50/50 to-white p-4 rounded-[1.5rem] border border-pink-100 shadow-xl shadow-slate-200/20 flex flex-col items-center text-center space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-pink-100 text-pink-500 flex items-center justify-center shadow-inner">
                            <Info size={18} />
                        </div>
                        <div className="space-y-1">
                            <h5 className="font-black text-slate-900 text-[10px] italic uppercase tracking-[0.2em]">Efficiency Protocol</h5>
                            <p className="text-[8px] text-slate-400 font-medium leading-relaxed uppercase tracking-tighter">Maintain buffers between jobs for a premium artist experience.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
