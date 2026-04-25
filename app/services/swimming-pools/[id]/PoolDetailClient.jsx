"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { 
    Star, MapPin, CheckCircle2, Clock, 
    ArrowLeft, Send, Loader2, Calendar, 
    ShieldCheck, Waves, Phone, Info,
    User, MessageCircle
} from "lucide-react";

export default function PoolDetailClient({ id: poolId }) {
    const router = useRouter();
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [isBooking, setIsBooking] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [notes, setNotes] = useState("");

    // Fetch Pool Details
    const { data: pool, loading: poolLoading } = useSupabaseQuery('swimming_pools', (q) => 
        q.select('*').eq('id', poolId).single()
    , [poolId]);

    // Fetch Slots for this Pool
    const dayOfWeek = new Date(selectedDate).getDay();
    const { data: slots = [], loading: slotsLoading } = useSupabaseQuery('pool_slots', (q) => 
        q.select('*').eq('pool_id', poolId).eq('day_of_week', dayOfWeek).eq('is_active', true)
    , [poolId, dayOfWeek]);

    // Fetch Bookings for this Pool on this Date to check availability
    const { data: bookings = [], refetch: refetchBookings } = useSupabaseQuery('pool_bookings', (q) => 
        q.select('*').eq('pool_id', poolId).eq('booking_date', selectedDate).in('status', ['Pending', 'Approved'])
    , [poolId, selectedDate]);

    // Real-time listener for bookings
    useEffect(() => {
        const channel = supabase
            .channel('pool_bookings_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'pool_bookings', filter: `pool_id=eq.${poolId}` }, () => {
                refetchBookings();
            })
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [poolId]);

    const availableSlots = useMemo(() => {
        return slots.map(slot => {
            const bookedCount = bookings.filter(b => b.slot_id === slot.id).length;
            return {
                ...slot,
                remainingCapacity: slot.capacity - bookedCount,
                isFull: bookedCount >= slot.capacity
            };
        });
    }, [slots, bookings]);

    const handleBooking = async () => {
        if (!user) { router.push(`/signin?redirect=/services/swimming-pools/${poolId}`); return; }
        if (!selectedSlot) return;

        setIsBooking(true);
        try {
            const { error } = await supabase.from('pool_bookings').insert([{
                pool_id: poolId,
                user_id: user.id,
                booking_date: selectedDate,
                slot_id: selectedSlot.id,
                status: 'Pending',
                notes: notes,
                price_paid: pool.price_per_hour
            }]);

            if (error) throw error;
            setBookingSuccess(true);
        } catch (err) {
            alert("Booking failed: " + err.message);
        } finally {
            setIsBooking(false);
        }
    };

    if (poolLoading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" size={40} color="#0ea5e9" /></div>;
    if (!pool) return <div style={{ textAlign: 'center', padding: '100px' }}><h2>Pool Not Found</h2><button onClick={() => router.back()}>Go Back</button></div>;

    const mainImage = pool.images?.[0] || "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=1200&q=80";

    return (
        <main style={{ minHeight: "100vh", backgroundColor: "#f8fafc", paddingBottom: "100px" }}>
            {/* Gallery/Banner */}
            <div style={{ height: "400px", width: "100%", position: "relative", overflow: "hidden" }}>
                <img src={mainImage} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={pool.name} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)" }} />
                <div style={{ position: "absolute", bottom: "40px", left: "24px", color: "#fff" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                        <span style={{ padding: "4px 12px", background: "#0ea5e9", borderRadius: "100px", fontSize: "11px", fontWeight: 900, textTransform: "uppercase" }}>Swimming Pool</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}><Star size={14} fill="#fbbf24" color="#fbbf24" /> <span>{pool.rating || "5.0"}</span></div>
                    </div>
                    <h1 style={{ fontSize: "40px", fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>{pool.name}</h1>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", opacity: 0.8, fontSize: "15px", marginTop: "8px" }}><MapPin size={16} /> {pool.address}, {pool.city}</div>
                </div>
                <button 
                    onClick={() => router.back()}
                    style={{ position: "absolute", top: "24px", left: "24px", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", border: "none", color: "#fff", padding: "10px", borderRadius: "12px", cursor: "pointer" }}
                >
                    <ArrowLeft size={20} />
                </button>
            </div>

            <div style={{ maxWidth: "1200px", margin: "40px auto", padding: "0 24px", display: "grid", gridTemplateColumns: "1fr 400px", gap: "40px" }} className="pool-layout">
                {/* Left Column: Details */}
                <div>
                    <section style={{ background: "#fff", padding: "30px", borderRadius: "24px", border: "1px solid #e2e8f0", marginBottom: "30px" }}>
                        <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#1e293b", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                            <Info size={22} color="#0ea5e9" /> About this Facility
                        </h2>
                        <p style={{ color: "#475569", lineHeight: 1.7, fontSize: "15px" }}>{pool.description || "A premium swimming facility offering clean water, professional trainers, and a relaxing environment for both beginners and experts."}</p>
                        
                        <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#1e293b", marginTop: "30px", marginBottom: "16px" }}>Amenities</h3>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                            {(pool.amenities || []).map(amenity => (
                                <div key={amenity} style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f1f5f9", padding: "8px 16px", borderRadius: "12px", fontSize: "14px", fontWeight: 600, color: "#475569" }}>
                                    <CheckCircle2 size={16} color="#0ea5e9" /> {amenity}
                                </div>
                            ))}
                        </div>
                    </section>

                    <section style={{ background: "#fff", padding: "30px", borderRadius: "24px", border: "1px solid #e2e8f0" }}>
                        <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#1e293b", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                            <Phone size={22} color="#0ea5e9" /> Contact Information
                        </h2>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                            <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "16px" }}>
                                <div style={{ fontSize: "11px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: "4px" }}>Phone</div>
                                <div style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>{pool.contact_details || "+91 98765 43210"}</div>
                            </div>
                            <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "16px" }}>
                                <div style={{ fontSize: "11px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: "4px" }}>Pricing</div>
                                <div style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>₹{pool.price_per_hour}/hr</div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Column: Booking Widget */}
                <div style={{ position: "sticky", top: "100px", height: "fit-content" }}>
                    <div style={{ background: "#fff", padding: "30px", borderRadius: "28px", border: "1px solid #e2e8f0", boxShadow: "0 20px 40px rgba(0,0,0,0.05)" }}>
                        {bookingSuccess ? (
                            <div style={{ textAlign: "center", padding: "40px 0" }}>
                                <div style={{ width: "64px", height: "64px", background: "#dcfce7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                                    <CheckCircle2 size={32} color="#22c55e" />
                                </div>
                                <h3 style={{ fontSize: "22px", fontWeight: 800, color: "#1e293b" }}>Request Sent!</h3>
                                <p style={{ color: "#64748b", marginTop: "8px" }}>Your booking inquiry has been sent to the admin. You'll be notified once it's approved.</p>
                                <button onClick={() => setBookingSuccess(false)} style={{ marginTop: "24px", width: "100%", padding: "14px", background: "#0ea5e9", color: "#fff", border: "none", borderRadius: "14px", fontWeight: 700, cursor: "pointer" }}>Send Another</button>
                            </div>
                        ) : (
                            <>
                                <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#1e293b", marginBottom: "24px" }}>Check Availability</h3>
                                
                                <div style={{ marginBottom: "20px" }}>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px" }}>Select Date</label>
                                    <div style={{ position: "relative" }}>
                                        <Calendar size={18} style={{ position: "absolute", left: "14px", top: "14px", color: "#64748b" }} />
                                        <input 
                                            type="date" 
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            style={{ width: "100%", padding: "14px 14px 14px 44px", borderRadius: "14px", border: "1.5px solid #e2e8f0", fontSize: "14px", fontWeight: 600, color: "#1e293b" }} 
                                        />
                                    </div>
                                </div>

                                <div style={{ marginBottom: "24px" }}>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px" }}>Available Slots</label>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                        {slotsLoading ? (
                                            <div style={{ gridColumn: "span 2", textAlign: "center", padding: "20px" }}><Loader2 size={24} className="animate-spin" color="#0ea5e9" /></div>
                                        ) : availableSlots.length === 0 ? (
                                            <div style={{ gridColumn: "span 2", padding: "20px", background: "#fff1f2", color: "#e11d48", borderRadius: "12px", fontSize: "13px", fontWeight: 600 }}>No slots available for this day.</div>
                                        ) : availableSlots.map(slot => (
                                            <button
                                                key={slot.id}
                                                disabled={slot.isFull}
                                                onClick={() => setSelectedSlot(slot)}
                                                style={{
                                                    padding: "12px", borderRadius: "14px", border: selectedSlot?.id === slot.id ? "2px solid #0ea5e9" : "1.5px solid #e2e8f0",
                                                    background: selectedSlot?.id === slot.id ? "#f0f9ff" : (slot.isFull ? "#f8fafc" : "#fff"),
                                                    cursor: slot.isFull ? "not-allowed" : "pointer", textAlign: "center",
                                                    opacity: slot.isFull ? 0.5 : 1, transition: "all 0.2s"
                                                }}
                                            >
                                                <div style={{ fontSize: "13px", fontWeight: 800, color: slot.isFull ? "#94a3b8" : "#1e293b" }}>{slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}</div>
                                                <div style={{ fontSize: "10px", fontWeight: 700, color: slot.isFull ? "#ef4444" : "#0ea5e9", marginTop: "2px" }}>
                                                    {slot.isFull ? "Housefull" : `${slot.remainingCapacity} slots left`}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ marginBottom: "24px" }}>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px" }}>Inquiry Notes</label>
                                    <textarea 
                                        placeholder="E.g., Need a trainer, group booking of 5..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        style={{ width: "100%", padding: "14px", borderRadius: "14px", border: "1.5px solid #e2e8f0", minHeight: "80px", fontSize: "14px", fontWeight: 500, fontFamily: "inherit" }}
                                    />
                                </div>

                                <button 
                                    disabled={!selectedSlot || isBooking}
                                    onClick={handleBooking}
                                    style={{
                                        width: "100%", padding: "16px", borderRadius: "16px", border: "none",
                                        background: "linear-gradient(135deg, #0ea5e9, #0c4a6e)",
                                        color: "#fff", fontSize: "15px", fontWeight: 800, cursor: "pointer",
                                        boxShadow: "0 10px 20px rgba(14, 165, 233, 0.25)",
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                                        opacity: (!selectedSlot || isBooking) ? 0.6 : 1
                                    }}
                                >
                                    {isBooking ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                    {isBooking ? "Sending Request..." : "Send Booking Inquiry"}
                                </button>
                                <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "11px", marginTop: "16px", fontWeight: 600 }}>Real-time availability powered by BookMyTicket</p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                @media (max-width: 900px) {
                    .pool-layout { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </main>
    );
}
