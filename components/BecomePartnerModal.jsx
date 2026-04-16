"use client";
import React, { useState, useEffect, useRef } from "react";
import { X, Loader2, ArrowRight, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

const PARTNER_TYPES = [
    { value: "event_organiser", label: "Event Organiser" },
    { value: "professional_service", label: "Professional Service" }
];

const CATEGORIES_BY_TYPE = {
    event_organiser: ["Sports", "Comedy", "Music", "Festival", "Corporate Events", "Workshops"],
    professional_service: ["Mehendi Artist", "Photographer", "Makeup Artist", "Turf Partner", "Decorator", "Catering Service"]
};


const GlassDropdown = ({ label, value, options, onChange, name, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
        };
        window.addEventListener("mousedown", handler);
        return () => window.removeEventListener("mousedown", handler);
    }, []);

    const toggleDropdown = () => {
        if (!disabled) setIsOpen(!isOpen);
    };

    return (
        <div ref={dropdownRef} style={{ position: "relative", width: "100%", opacity: disabled ? 0.6 : 1 }}>
            <label className="partner-label">{label} <span style={{color:"#f84464"}}>*</span></label>
            <div 
                onClick={toggleDropdown}
                className="partner-input"
                style={{ 
                    cursor: disabled ? "not-allowed" : "pointer", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "space-between",
                    background: isOpen ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.05)",
                    border: disabled ? "1.5px solid rgba(255, 255, 255, 0.1)" : "1.5px solid rgba(15, 23, 42, 0.08)"
                }}
            >
                <span style={{ color: value ? "#fff" : "rgba(255, 255, 255, 0.4)" }}>
                    {options.find(o => (typeof o === 'string' ? o : o.value) === value)?.label || 
                     (typeof options[0] === 'string' ? value : options.find(o => o.value === value)?.label) || 
                     (disabled ? "Select type first" : `Select ${label}`)}
                </span>
                {!disabled && <ChevronDown size={16} style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.3s" }} />}
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 5, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            background: "rgba(15, 23, 42, 0.95)",
                            backdropFilter: "blur(20px)",
                            borderRadius: "16px",
                            padding: "8px",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                            zIndex: 100,
                            maxHeight: "240px",
                            overflowY: "auto"
                        }}
                    >
                        {options.map((opt) => {
                            const optVal = typeof opt === 'string' ? opt : opt.value;
                            const optLabel = typeof opt === 'string' ? opt : opt.label;
                            return (
                                <div 
                                    key={optVal}
                                    onClick={() => {
                                        onChange({ target: { name, value: optVal } });
                                        setIsOpen(false);
                                    }}
                                    style={{
                                        padding: "10px 16px",
                                        borderRadius: "10px",
                                        color: "#fff",
                                        fontSize: "14px",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        transition: "all 0.2s",
                                        background: value === optVal ? "rgba(248, 68, 100, 0.2)" : "transparent"
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = value === optVal ? "rgba(248, 68, 100, 0.3)" : "rgba(255, 255, 255, 0.1)"}
                                    onMouseLeave={e => e.currentTarget.style.background = value === optVal ? "rgba(248, 68, 100, 0.2)" : "transparent"}
                                >
                                    {optLabel}
                                </div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function BecomePartnerModal({ isOpen, onClose }) {

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        type: "",
        category: "",
        role: "Individual",
        remarks: ""
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [openDropdown, setOpenDropdown] = useState(null); // 'type' | 'category' | null

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === "type") {
            // Reset category when type changes
            setForm(prev => ({ ...prev, type: value, category: "" }));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");

        if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.type || !form.category) {
            setErrorMsg("Please fill in all required fields.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/partner/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Submission failed");
            
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                onClose();
                setForm({ firstName: "", lastName: "", email: "", phone: "", category: "", type: "", role: "Individual", remarks: "" });
            }, 3000);
        } catch (err) {
            setErrorMsg(err.message || "Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.4)", zIndex: 9999, // Darker tint for glass contrast
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px",
            backdropFilter: "blur(8px)"
        }}>
            <div style={{
                background: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(40px) saturate(150%)",
                WebkitBackdropFilter: "blur(40px) saturate(150%)",
                borderRadius: "32px",
                width: "100%", maxWidth: "550px",
                position: "relative",
                boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                animation: "liquidIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
            }}>
                <style>{`
                    @keyframes liquidIn { 
                        from { opacity: 0; transform: scale(0.9) translateY(20px); filter: blur(10px); } 
                        to { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); } 
                    }
                    .partner-input { 
                        width: 100%; 
                        border: 1.5px solid rgba(15, 23, 42, 0.08); 
                        border-radius: 12px; 
                        padding: 8px 14px; 
                        font-size: 15px; 
                        background: rgba(255, 255, 255, 0.05); 
                        outline: none; 
                        transition: all 0.3s ease; 
                        margin-top: 6px; 
                        color: #fff; 
                        font-weight: 500;
                        backdrop-filter: blur(10px);
                    }
                    .partner-input::placeholder {
                        color: rgba(255, 255, 255, 0.4);
                    }
                    .partner-input:focus { 
                        border-color: rgba(255, 255, 255, 0.5); 
                        background: rgba(255, 255, 255, 0.2);
                        box-shadow: 0 0 15px rgba(255, 255, 255, 0.1); 
                        transform: translateY(-1px);
                    }
                    .partner-label { 
                        font-size: 12px; 
                        font-weight: 800; 
                        color: #fff; 
                        text-transform: uppercase; 
                        letter-spacing: 0.05em; 
                        margin-bottom: 0px; 
                        display: block; 
                        font-family: 'Space Grotesk', sans-serif;
                    }
                `}</style>
                
                {/* Header Section */}
                <div style={{ padding: "20px 40px 10px" }}>
                    <button onClick={onClose} style={{
                        position: "absolute", top: "24px", right: "24px",
                        background: "rgba(255, 255, 255, 0.2)", border: "1px solid rgba(255, 255, 255, 0.3)", borderRadius: "14px",
                        width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", color: "#fff", transition: "all 0.3s ease"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'rotate(180deg)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'rotate(0deg)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; }}
                    >
                        <X size={20} />
                    </button>
                    <h2 style={{ 
                        margin: "0 0 8px 0", 
                        fontSize: "28px", 
                        fontWeight: "900", 
                        color: "#fff", 
                        letterSpacing: "-0.03em",
                        fontFamily: "'Space Grotesk', sans-serif"
                    }}>
                        Request to Become a <span style={{
                            background: "linear-gradient(135deg, #f84464 0%, #c026d3 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent"
                        }}>Partner</span>
                    </h2>
                    <p style={{ margin: 0, color: "rgba(255, 255, 255, 0.6)", fontSize: "14px", fontWeight: "500", lineHeight: 1.4 }}>
                        Fill in your details — we'll reach out within 24 hours.
                    </p>
                </div>

                {success ? (
                    <div style={{ padding: "70px 40px", textAlign: "center" }}>
                        <div style={{ 
                            width: "72px", height: "72px", 
                            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", 
                            borderRadius: "20px", 
                            display: "flex", alignItems: "center", justifyContent: "center", 
                            margin: "0 auto 28px",
                            boxShadow: "0 10px 20px rgba(16, 185, 129, 0.3)",
                            animation: "liquidIn 0.5s ease"
                        }}>
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <h3 style={{ fontSize: "22px", fontWeight: "900", color: "#1e293b", margin: "0 0 10px", fontFamily: "'Space Grotesk', sans-serif" }}>Request Submitted!</h3>
                        <p style={{ color: "#64748b", fontSize: "16px", fontWeight: "600" }}>We've sent a confirmation email to you. We'll be in touch soon.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ padding: "8px 40px 24px" }}>
                        {errorMsg && (
                            <div style={{ 
                                background: "rgba(254, 242, 242, 0.8)", 
                                color: "#dc2626", 
                                padding: "10px 16px", 
                                borderRadius: "12px", 
                                marginBottom: "16px", 
                                fontSize: "14px", 
                                fontWeight: "700", 
                                border: "1.5px solid rgba(239, 68, 68, 0.2)",
                                display: "flex",
                                alignItems: "center",
                                gap: "10px"
                            }}>
                                <span style={{ fontSize: "18px" }}>⚠️</span> {errorMsg}
                            </div>
                        )}
                        
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                            <div>
                                <label className="partner-label">First Name <span style={{color:"#f84464"}}>*</span></label>
                                <input name="firstName" value={form.firstName} onChange={handleChange} className="partner-input" placeholder="John" required />
                            </div>
                            <div>
                                <label className="partner-label">Last Name <span style={{color:"#f84464"}}>*</span></label>
                                <input name="lastName" value={form.lastName} onChange={handleChange} className="partner-input" placeholder="Doe" required />
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                            <div>
                                <label className="partner-label">Email Address <span style={{color:"#f84464"}}>*</span></label>
                                <input type="email" name="email" value={form.email} onChange={handleChange} className="partner-input" placeholder="john@example.com" required />
                            </div>
                            <div>
                                <label className="partner-label">Contact Number <span style={{color:"#f84464"}}>*</span></label>
                                <input type="tel" name="phone" value={form.phone} onChange={handleChange} className="partner-input" placeholder="+91 98765 43210" required />
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                            <GlassDropdown 
                                label="Type"
                                value={form.type}
                                options={PARTNER_TYPES}
                                name="type"
                                onChange={handleChange}
                            />
                            <GlassDropdown 
                                label="Category"
                                value={form.category}
                                options={form.type ? CATEGORIES_BY_TYPE[form.type] : []}
                                name="category"
                                onChange={handleChange}
                                disabled={!form.type}
                            />
                        </div>

                        <div style={{ marginBottom: "12px" }}>
                            <label className="partner-label">Remarks</label>
                            <textarea name="remarks" value={form.remarks} onChange={handleChange} className="partner-input" placeholder="Tell us about your services or events..." rows={2} style={{ resize: "none" }} />
                        </div>

                        <button type="submit" disabled={isSubmitting} style={{
                            background: "linear-gradient(135deg, #f84464 0%, #c026d3 100%)", 
                            color: "#fff",
                            border: "none", 
                            borderRadius: "14px",
                            padding: "12px 32px",
                            fontSize: "16px", 
                            fontWeight: "800",
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center",
                            gap: "10px",
                            cursor: isSubmitting ? "not-allowed" : "pointer",
                            opacity: isSubmitting ? 0.8 : 1,
                            transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                            boxShadow: "0 10px 20px rgba(248, 68, 100, 0.3)",
                            width: "100%"
                        }}
                        onMouseEnter={e => { if (!isSubmitting) { e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(248, 68, 100, 0.4)'; } }}
                        onMouseLeave={e => { if (!isSubmitting) { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(248, 68, 100, 0.3)'; } }}
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Submit Request"}
                            {!isSubmitting && <ArrowRight size={20} />}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
