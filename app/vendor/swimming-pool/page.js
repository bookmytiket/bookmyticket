"use client";
import React, { useState } from "react";
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthContext";
import { 
    Plus, Waves, MapPin, Edit, Trash2, 
    ChevronRight, ExternalLink, Loader2,
    DollarSign, Clock, Settings
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function OrganiserPoolsPage() {
    const { user } = useAuth();
    const router = useRouter();

    const { data: pools = [], loading, refetch } = useSupabaseQuery('swimming_pools', (q) => 
        q.select('*').eq('vendor_id', user?.id)
    , [user?.id]);

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this pool listing?")) return;
        const { error } = await supabase.from('swimming_pools').delete().eq('id', id);
        if (error) alert("Error: " + error.message);
        else refetch();
    };

    if (loading) return <div style={{ padding: "40px", textAlign: "center" }}><Loader2 className="animate-spin" /></div>;

    return (
        <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
                <div>
                    <h1 style={{ fontSize: "32px", fontWeight: 900, color: "#1e293b", margin: 0 }}>Swimming Pools</h1>
                    <p style={{ color: "#64748b", marginTop: "4px" }}>Manage your pool facilities, pricing, and availability.</p>
                </div>
                <button 
                    onClick={() => router.push('/vendor/swimming-pool/manage/new')}
                    style={{ background: "#0ea5e9", color: "#fff", padding: "12px 24px", borderRadius: "12px", border: "none", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", boxShadow: "0 10px 20px rgba(14, 165, 233, 0.2)" }}
                >
                    <Plus size={18} /> Add New Pool
                </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "24px" }}>
                {pools.length === 0 ? (
                    <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "80px", background: "#fff", borderRadius: "24px", border: "1px dashed #cbd5e1" }}>
                        <div style={{ fontSize: "64px", marginBottom: "20px" }}>🏊‍♂️</div>
                        <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#1e293b" }}>No Pools Listed</h3>
                        <p style={{ color: "#64748b" }}>Start by adding your first swimming pool facility.</p>
                    </div>
                ) : (
                    pools.map(pool => (
                        <div key={pool.id} style={{ background: "#fff", borderRadius: "24px", border: "1px solid #e2e8f0", overflow: "hidden", transition: "all 0.2s" }}>
                            <div style={{ height: "180px", position: "relative" }}>
                                <img src={pool.images?.[0] || "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=600"} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={pool.name} />
                                <div style={{ position: "absolute", top: "12px", right: "12px", background: pool.status === 'active' ? "#dcfce7" : "#fee2e2", color: pool.status === 'active' ? "#166534" : "#991b1b", padding: "4px 10px", borderRadius: "8px", fontSize: "10px", fontWeight: 800, textTransform: "uppercase" }}>{pool.status}</div>
                            </div>
                            <div style={{ padding: "24px" }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#1e293b", margin: "0 0 4px" }}>{pool.name}</h3>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "13px", marginBottom: "20px" }}>
                                    <MapPin size={14} /> {pool.city}
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
                                    <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "12px" }}>
                                        <div style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>Price</div>
                                        <div style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>₹{pool.price_per_hour}/hr</div>
                                    </div>
                                    <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "12px" }}>
                                        <div style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>Rating</div>
                                        <div style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>⭐ {pool.rating || "5.0"}</div>
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: "10px" }}>
                                    <button 
                                        onClick={() => router.push(`/vendor/swimming-pool/manage/${pool.id}`)}
                                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "10px", fontWeight: 700, cursor: "pointer" }}
                                    >
                                        <Settings size={16} /> Manage
                                    </button>
                                    <button 
                                        onClick={() => window.open(`/services/swimming-pools/${pool.id}`, '_blank')}
                                        style={{ width: "42px", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "10px", cursor: "pointer" }}
                                    >
                                        <ExternalLink size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(pool.id)}
                                        style={{ width: "42px", display: "flex", alignItems: "center", justifyContent: "center", background: "#fef2f2", color: "#ef4444", border: "none", borderRadius: "10px", cursor: "pointer" }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
