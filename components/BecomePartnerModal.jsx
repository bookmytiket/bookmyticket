"use client";
import React, { useState } from "react";
import { X, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

const SERVICE_CATEGORIES = [
    "General Event",
    "Turf Booking",
    "Mehendi Artist",
    "Makeup Artist",
    "Photographer",
    "Catering",
    "Decorator",
    "DJ / Sound Setup",
    "Transportation",
    "Security"
];

export default function BecomePartnerModal({ isOpen, onClose }) {

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        category: "Turf Booking",
        type: "event_organiser",
        role: "Individual",
        remarks: ""
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");

        if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.category || !form.role) {
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
                setForm({ firstName: "", lastName: "", email: "", phone: "", category: "Turf Booking", type: "event_organiser", role: "Individual", remarks: "" });
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
            backgroundColor: "rgba(0, 0, 0, 0.6)", zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px"
        }}>
            <div style={{
                backgroundColor: "#e7e9ed", // Match the grey background of screenshot
                borderRadius: "16px",
                width: "100%", maxWidth: "600px",
                position: "relative",
                boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
                animation: "fadeIn 0.2s ease-out"
            }}>
                <style>{`
                    @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                    .partner-input { width: 100%; border: 1px solid #d1d5db; border-radius: 8px; padding: 12px 16px; font-size: 15px; background: #fff; outline: none; transition: border 0.15s; margin-top: 6px; color: #1f2937; }
                    .partner-input:focus { border-color: #8b5cf6; box-shadow: 0 0 0 3px rgba(139,92,246,0.1); }
                    .partner-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: block; }
                `}</style>
                
                {/* Header Section Matches Design */}
                <div style={{ padding: "30px 30px 24px", borderBottom: "1px solid #d1d5db" }}>
                    <button onClick={onClose} style={{
                        position: "absolute", top: "20px", right: "20px",
                        background: "#fff", border: "none", borderRadius: "50%",
                        width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", color: "#64748b", boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                    }}>
                        <X size={18} />
                    </button>
                    <h2 style={{ margin: "0 0 8px 0", fontSize: "24px", fontWeight: "800", color: "#1e293b" }}>Request to Become a Partner</h2>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "14px", fontWeight: "500" }}>Fill in your details — our team will reach out to you within 24 hours.</p>
                </div>

                {success ? (
                    <div style={{ padding: "60px 30px", textAlign: "center" }}>
                        <div style={{ width: "64px", height: "64px", background: "#ecfdf5", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#1e293b", margin: "0 0 8px" }}>Request Submitted!</h3>
                        <p style={{ color: "#64748b", margin: 0 }}>We've sent a confirmation email to you. We'll be in touch soon.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ padding: "24px 30px 30px" }}>
                        {errorMsg && (
                            <div style={{ background: "#fef2f2", color: "#dc2626", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", fontWeight: "600", border: "1px solid #fecaca" }}>
                                {errorMsg}
                            </div>
                        )}
                        
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                            <div>
                                <label className="partner-label">FIRST NAME <span style={{color:"#ef4444"}}>*</span></label>
                                <input name="firstName" value={form.firstName} onChange={handleChange} className="partner-input" placeholder="Test" required />
                            </div>
                            <div>
                                <label className="partner-label">LAST NAME <span style={{color:"#ef4444"}}>*</span></label>
                                <input name="lastName" value={form.lastName} onChange={handleChange} className="partner-input" placeholder="Turf" required />
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                            <div>
                                <label className="partner-label">EMAIL ID <span style={{color:"#ef4444"}}>*</span></label>
                                <input type="email" name="email" value={form.email} onChange={handleChange} className="partner-input" placeholder="email@example.com" required />
                            </div>
                            <div>
                                <label className="partner-label">CONTACT NUMBER <span style={{color:"#ef4444"}}>*</span></label>
                                <input type="tel" name="phone" value={form.phone} onChange={handleChange} className="partner-input" placeholder="9876543210" required />
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                            <div>
                                <label className="partner-label">REQUEST TYPE <span style={{color:"#ef4444"}}>*</span></label>
                                <select 
                                    name="type" 
                                    value={form.type || 'event_organiser'} 
                                    onChange={handleChange} 
                                    className="partner-input" 
                                    required
                                >
                                    <option value="event_organiser">Event Organiser</option>
                                    <option value="professional_service">Professional Service</option>
                                </select>
                            </div>
                            <div>
                                <label className="partner-label">ROLE <span style={{color:"#ef4444"}}>*</span></label>
                                <select name="role" value={form.role} onChange={handleChange} className="partner-input" required>
                                    <option value="Individual">Individual</option>
                                    <option value="Company">Company</option>
                                    <option value="Agency">Agency</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ marginBottom: "30px" }}>
                            <label className="partner-label">CATEGORY <span style={{color:"#ef4444"}}>*</span></label>
                            <select name="category" value={form.category} onChange={handleChange} className="partner-input" required>
                                {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div style={{ marginBottom: "30px" }}>
                            <label className="partner-label">REMARKS</label>
                            <textarea name="remarks" value={form.remarks} onChange={handleChange} className="partner-input" placeholder="Tell us about your services..." rows={3} style={{ resize: "none" }} />
                        </div>

                        <button type="submit" disabled={isSubmitting} style={{
                            background: "#8b5cf6", color: "#fff",
                            border: "none", borderRadius: "10px",
                            padding: "14px 24px",
                            fontSize: "15px", fontWeight: "700",
                            display: "flex", alignItems: "center", gap: "8px",
                            cursor: isSubmitting ? "not-allowed" : "pointer",
                            opacity: isSubmitting ? 0.8 : 1,
                            transition: "background 0.2s"
                        }}>
                            {isSubmitting ? "Submitting..." : "Send Request"}
                            {!isSubmitting && <ArrowRight size={16} />}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
