"use client";
import React from 'react';
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { Video, Lock, Clock, ExternalLink, Loader2 } from "lucide-react";
import { useAuth } from './AuthContext';
import { useRouter } from 'next/navigation';

/**
 * JoinNowButton - A unified component to handle virtual meeting access.
 * 
 * @param {string} eventId - The ID of the event.
 * @param {string} className - Optional additional CSS classes.
 */
export default function JoinNowButton({ eventId, className = "" }) {
    const { user } = useAuth();
    const router = useRouter();
    const userId = user?.identifier || user?.email;
 
    const { data: event, loading: loadingEvent } = useSupabaseQuery('events', (q) => q.eq('id', eventId).single(), [eventId]);
    const { data: booking, loading: loadingBooking } = useSupabaseQuery('bookings', 
        (q) => userId ? q.eq('user_id', userId).eq('event_id', eventId).in('status', ['Confirmed', 'Paid', 'Scanned']).single() : q.eq('id', '00000000-0000-0000-0000-000000000000'), 
        [eventId, userId]
    );
 
    const loading = loadingEvent || (userId && loadingBooking);
 
    const access = React.useMemo(() => {
        if (loading) return undefined;
        if (!event) return { status: "not_found" };
 
        const isVirtual = event.virtual || 
                         event.type?.toLowerCase() === "online" || 
                         event.location?.toLowerCase().includes("online") ||
                         event.title?.toLowerCase().includes("online meeting");
 
        if (!isVirtual) return { status: "not_virtual" };
 
        const now = Date.now();
        const endTs = event.endDateTime || (event.date && event.time ? new Date(`${event.date} ${event.time}`).getTime() + (2 * 60 * 60 * 1000) : 0);
        
        if (endTs && now > endTs) {
            return { status: "expired" };
        }
 
        const isBooked = !!booking;
        return { 
            status: isBooked ? "success" : "not_booked",
            type: event.meetingType || "internal"
        };
    }, [event, booking, loading]);
 
    if (access === undefined) {
        return (
            <button 
                disabled 
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gray-100 text-gray-400 animate-pulse font-bold text-sm ${className}`}
            >
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Checking...</span>
            </button>
        );
    }

    // Don't show anything if it's not a virtual event or if the event doesn't exist
    if (access.status === "not_virtual" || access.status === "not_found") return null;

    const handleAction = (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Redirect to the new dynamic Join Now page for all virtual event interactions
        router.push(`/meeting/join/${eventId}`);
    };

    const getBtnStyles = () => {
        switch (access.status) {
            case "expired":
                return "bg-gray-200 text-gray-500 cursor-not-allowed border-transparent shadow-none";
            case "not_booked":
                return "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200 shadow-sm";
            case "success":
                return "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-xl hover:shadow-emerald-500/30 transform hover:-translate-y-0.5 transition-all duration-300 border-transparent";
            default:
                return "bg-gray-100 text-gray-600 border-gray-200";
        }
    };

    const renderContent = () => {
        switch (access.status) {
            case "expired":
                return (
                    <>
                        <Clock className="w-4 h-4" />
                        <span>Meeting Expired</span>
                    </>
                );
            case "not_booked":
                return (
                    <>
                        <Lock className="w-4 h-4" />
                        <span>Book to Join</span>
                    </>
                );
            case "success":
                return (
                    <>
                        <Video className="w-4 h-4 text-white/90" />
                        <span>Join Now</span>
                        {access.type === "external" && <ExternalLink className="w-3 h-3 opacity-60 ml-0.5" />}
                    </>
                );
            default:
                return <span>Unavailable</span>;
        }
    };

    return (
        <button
            onClick={handleAction}
            disabled={access.status === "expired"}
            className={`
                group relative flex items-center justify-center gap-2.5 px-6 py-3 
                rounded-2xl font-black text-sm tracking-tight border 
                transition-all duration-300 backdrop-blur-sm
                active:scale-95
                ${getBtnStyles()}
                ${className}
            `}
        >
            {renderContent()}
            
            {/* Subtle glow effect for success state */}
            {access.status === "success" && (
                <div className="absolute inset-0 rounded-2xl bg-emerald-400/20 blur-xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
        </button>
    );
}
