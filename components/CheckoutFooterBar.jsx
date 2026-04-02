"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import * as LucideIcons from "lucide-react";

export default function CheckoutFooterBar() {
    const footers = useQuery(api.checkoutFooters.listActive);
    const router = useRouter();
    
    const [modalData, setModalData] = useState(null);

    if (footers === undefined) return null; // Loading state
    if (footers.length === 0) return null;

    const handleItemClick = (item) => {
        if (item.actionType === "redirect" && item.redirectUrl) {
            router.push(item.redirectUrl);
        } else if (item.actionType === "modal") {
            setModalData(item);
        }
    };

    return (
        <>
            {/* Sticky Bottom Bar */}
            <div style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: "#fff",
                borderTop: "1px solid #e2e8f0",
                boxShadow: "0 -4px 12px rgba(0,0,0,0.05)",
                display: "flex",
                justifyContent: "center",
                padding: "8px 16px",
                paddingBottom: "max(8px, env(safe-area-inset-bottom))",
                zIndex: 100
            }}>
                <div style={{ 
                    display: "flex", 
                    width: "100%", 
                    maxWidth: "1100px", 
                    justifyContent: "space-around",
                    alignItems: "center"
                }}>
                    {footers.map((item) => {
                        const Icon = LucideIcons[item.iconName] || LucideIcons.Info;
                        return (
                            <div 
                                key={item._id}
                                onClick={() => handleItemClick(item)}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flex: 1,
                                    cursor: "pointer",
                                    padding: "6px 4px",
                                    transition: "all 0.2s"
                                }}
                                className="group hover:bg-slate-50 rounded-xl"
                            >
                                <Icon size={22} className="text-slate-600 group-hover:text-[#f84464] transition-colors mb-1" />
                                <span style={{ fontSize: "11px", fontWeight: 700, color: "#1e293b", textAlign: "center", marginBottom: "2px" }}>
                                    {item.title}
                                </span>
                                <span style={{ fontSize: "10px", color: "#64748b", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "90%" }}>
                                    {item.description}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal Overlay */}
            {modalData && (
                <div 
                    style={{
                        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        backdropFilter: "blur(4px)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        zIndex: 1000, padding: 20
                    }}
                    onClick={() => setModalData(null)}
                >
                    <div 
                        style={{
                            background: "#fff",
                            borderRadius: "20px",
                            width: "100%",
                            maxWidth: "400px",
                            padding: "24px",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
                            animation: "slideIn 0.3s ease-out forwards"
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                {(() => {
                                    const Icon = LucideIcons[modalData.iconName] || LucideIcons.Info;
                                    return <Icon size={24} className="text-[#f84464]" />;
                                })()}
                                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                                    {modalData.title}
                                </h3>
                            </div>
                            <button 
                                onClick={() => setModalData(null)}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
                            >
                                <LucideIcons.X size={20} />
                            </button>
                        </div>
                        <div style={{ 
                            fontSize: "14px", 
                            color: "#475569", 
                            lineHeight: 1.6,
                            whiteSpace: "pre-wrap"
                        }}>
                            {modalData.modalContent || "No detailed information provided."}
                        </div>
                        <button
                            onClick={() => setModalData(null)}
                            style={{
                                width: "100%",
                                padding: "12px",
                                marginTop: "24px",
                                background: "#f1f5f9",
                                color: "#0f172a",
                                border: "none",
                                borderRadius: "12px",
                                fontWeight: 700,
                                cursor: "pointer",
                                transition: "bg 0.2s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "#e2e8f0"}
                            onMouseLeave={e => e.currentTarget.style.background = "#f1f5f9"}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
            <style jsx global>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </>
    );
}
