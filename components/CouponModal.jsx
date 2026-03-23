"use client";

import React, { useState } from "react";
import { 
    Copy, Check, Ticket, Calendar, ShieldCheck, 
    Gift, AlertTriangle, ChevronDown, ExternalLink, X
} from "lucide-react";

const AccordionItem = ({ title, icon: Icon, iconColor, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="accordion-item">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="accordion-header"
            >
                <div className="accordion-title">
                    <Icon size={16} color={iconColor} />
                    <span>{title}</span>
                </div>
                <ChevronDown 
                    size={16} 
                    color="#94a3b8" 
                    className={`accordion-icon ${isOpen ? "open" : ""}`}
                />
            </button>
            <div className={`accordion-content ${isOpen ? "open" : ""}`}>
                <p>
                    {children}
                </p>
            </div>
        </div>
    );
};

export default function CouponModal({ coupon, onClose }) {
    const [isRevealed, setIsRevealed] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [showModal, setShowModal] = useState(false);

    if (!coupon) return null;

    const handleGetCode = () => {
        setIsRevealed(true);
        setShowModal(true);
    };

    const handleCopy = () => {
        const code = "WELCOME" + coupon.discountValue;
        navigator.clipboard.writeText(code);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleRedeem = () => {
        const url = coupon.redirectUrl || coupon.link || coupon.url || `https://www.google.com/search?q=${encodeURIComponent(coupon.brandName + " coupon")}`;
        window.open(url, '_blank');
    };

    const handleBackdropClick = (e) => {
        if (e.target.id === "modal-backdrop") {
            onClose();
        }
    };

    return (
        <div id="modal-backdrop" onClick={handleBackdropClick} className="coupon-overlay">
            <style>{`
                .coupon-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 2000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: rgba(0, 0, 0, 0.6);
                    padding: 16px;
                    font-family: var(--font-body, "Inter", sans-serif);
                    backdrop-filter: blur(4px);
                }
                .coupon-container {
                    background: #fff;
                    border-radius: 24px;
                    overflow-y: auto;
                    box-shadow: 0 20px 60px -15px rgba(0,0,0,0.4);
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    max-width: 900px;
                    position: relative;
                    max-height: 90vh;
                }
                .coupon-left, .coupon-right {
                    padding: 32px;
                    display: flex;
                    flex-direction: column;
                }
                .coupon-banner {
                    width: 100%;
                    height: 180px;
                    border-radius: 12px;
                    overflow: hidden;
                    margin-bottom: 24px;
                    background: #f1f5f9;
                }
                .coupon-banner img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .coupon-brand {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .coupon-logo {
                    width: 48px;
                    height: 48px;
                    border-radius: 8px;
                    border: 1px solid #f1f5f9;
                    background: #fff;
                    padding: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                }
                .coupon-logo img {
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                }
                .coupon-details {
                    margin-top: 24px;
                }
                .coupon-title {
                    font-size: 22px;
                    font-weight: 800;
                    color: #1e293b;
                    margin: 12px 0 8px;
                    line-height: 1.3;
                }
                .coupon-desc {
                    color: #64748b;
                    font-size: 14px;
                    line-height: 1.6;
                    margin: 0 0 24px;
                }
                .coupon-expiry {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: #ef4444;
                    font-size: 12px;
                    font-weight: 700;
                    margin-top: auto;
                }
                
                /* Action Box UI matching 2nd image */
                .coupon-action-box {
                    background: #f8fafc;
                    border: none;
                    border-radius: 12px;
                    padding: 24px 20px;
                    margin-bottom: 24px;
                }
                
                @media (min-width: 768px) {
                    .coupon-container { flex-direction: row; align-items: stretch; overflow: hidden; }
                    .coupon-left, .coupon-right { width: 50%; overflow-y: auto; }
                    .coupon-right { border-left: 1px solid #f1f5f9; }
                }

                .close-btn {
                    position: absolute;
                    right: 16px;
                    top: 16px;
                    z-index: 20;
                    width: 36px;
                    height: 36px;
                    background: #f1f5f9;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #94a3b8;
                    border: none;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .close-btn:hover { background: #e2e8f0; color: #1e293b; }

                /* Accordion Styles */
                .accordion-item { border-bottom: 1px solid #f1f5f9; }
                .accordion-header {
                    width: 100%;
                    padding: 16px 0;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    color: #334155;
                    background: none;
                    border: none;
                    cursor: pointer;
                    outline: none;
                }
                .accordion-title { display: flex; align-items: center; gap: 12px; font-weight: 700; font-size: 14px; }
                .accordion-icon { transition: transform 0.3s ease; }
                .accordion-icon.open { transform: rotate(180deg); }
                .accordion-content {
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.3s ease, padding 0.3s ease;
                }
                .accordion-content.open { max-height: 160px; padding-bottom: 16px; }
                .accordion-content p { font-size: 14px; color: #64748b; line-height: 1.6; padding-left: 28px; margin: 0; }

                /* Action Styles */
                .action-unrevealed-text {
                    display: flex; align-items: center; justify-content: center;
                    background: #e2e8f0; color: #94a3b8; padding: 10px 24px; border-radius: 9999px;
                    font-weight: 900; letter-spacing: 0.2em; font-size: 16px;
                }
                .action-revealed-text {
                    display: flex; align-items: center; justify-content: center;
                    background: #e2e8f0; color: #1e3a8a; padding: 10px 24px; border-radius: 9999px;
                    font-weight: 800; font-size: 16px; border: none; letter-spacing: 0.05em;
                }
                .action-btn-get, .action-btn-copy {
                    background: #2563eb; color: #fff; border-radius: 9999px; padding: 10px 20px; font-size: 13px;
                    font-weight: 700; border: none; cursor: pointer; white-space: nowrap; display: flex; align-items: center; gap: 6px;
                }
                /* Confetti Animation */
                .confetti-container {
                    position: absolute;
                    top: -100px; left: -50px; right: -50px; bottom: 0;
                    overflow: visible;
                    pointer-events: none;
                    z-index: 3100;
                }
                .confetti-piece {
                    position: absolute;
                    width: 8px; height: 16px;
                    top: -20px;
                    opacity: 0;
                    animation-name: fall;
                    animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
                    animation-fill-mode: forwards;
                }
                .confetti-piece.p0 { background-color: #f43f5e; width: 10px; height: 10px; border-radius: 50%; }
                .confetti-piece.p1 { background-color: #f97316; }
                .confetti-piece.p2 { background-color: #3b82f6; width: 8px; height: 8px; border-radius: 50%; }
                .confetti-piece.p3 { background-color: #10b981; }
                .confetti-piece.p4 { background-color: #fce7f3; }
                .confetti-piece.p5 { background-color: #eab308; width: 6px; height: 6px; border-radius: 50%; }

                @keyframes fall {
                    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(350px) rotate(360deg); opacity: 0; }
                }

                .party-popper {
                    position: absolute;
                    top: -45px;
                    left: 50%;
                    font-size: 72px;
                    line-height: 1;
                    filter: drop-shadow(0 10px 15px rgba(0,0,0,0.15));
                    animation: popHover 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                    transform-origin: bottom center;
                    z-index: 3200;
                }

                @keyframes popHover {
                    0% { transform: translateX(-50%) translateY(40px) scale(0) rotate(-30deg); opacity: 0; }
                    50% { transform: translateX(-50%) translateY(-10px) scale(1.1) rotate(10deg); opacity: 1; }
                    100% { transform: translateX(-50%) translateY(0) scale(1) rotate(0deg); opacity: 1; }
                }

                /* Redesigned Success Modal */
                .success-modal {
                    background: #fff;
                    border-radius: 12px;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.35);
                    padding: 40px 32px 32px;
                    max-width: 400px;
                    width: 100%;
                    position: relative;
                    border-top: 6px solid #f43f5e;
                    border-image: linear-gradient(to right, #f43f5e, #f97316) 1;
                }
                .success-coupon-box {
                    border: 1px solid #fecdd3; /* pink border */
                    background: #fff;
                    border-radius: 8px;
                    padding: 16px 20px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 24px;
                }
                .success-btn {
                    width: 100%;
                    padding: 14px 0;
                    background: linear-gradient(to right, #f43f5e, #f97316);
                    color: #fff;
                    font-weight: 700;
                    border-radius: 8px;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-size: 15px;
                    transition: transform 0.2s, box-shadow 0.2s;
                    box-shadow: 0 8px 20px -6px rgba(244, 63, 94, 0.5);
                }
                .success-btn:active { transform: translateY(2px); }
            `}</style>
            
            {showModal && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 3000,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    backgroundColor: "rgba(0, 0, 0, 0.65)", padding: "16px", backdropFilter: "blur(6px)"
                }}>
                    <div className="confetti-container">
                        {[...Array(60)].map((_, i) => (
                            <div key={i} className={`confetti-piece p${i % 6}`} style={{
                                left: `${10 + Math.random() * 80}%`,
                                animationDelay: `${Math.random() * 1.5}s`,
                                animationDuration: `${1.5 + Math.random() * 2}s`
                            }}></div>
                        ))}
                    </div>

                    <div className="success-modal">
                        <div className="party-popper">🎉</div>
                        
                        <button onClick={() => setShowModal(false)} className="close-btn" style={{ background: "transparent", top: "12px", right: "12px" }}>
                            <X size={20} color="#94a3b8" />
                        </button>
                        
                        <h2 style={{ fontSize: "24px", fontWeight: 800, textAlign: "center", color: "#0f172a", marginBottom: "8px", marginTop: "12px", letterSpacing: "-0.5px" }}>
                            Purchase Successful!
                        </h2>
                        <p style={{ fontSize: "14px", color: "#64748b", textAlign: "center", marginBottom: "28px", marginTop: 0 }}>
                            Your coupon is ready to use.
                        </p>
                        
                        <div className="success-coupon-box">
                            <div>
                                <div style={{ fontSize: "10px", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", marginBottom: "4px", letterSpacing: "0.5px" }}>
                                    COUPON CODE
                                </div>
                                <div style={{ fontSize: "20px", fontWeight: 800, color: "#f43f5e", letterSpacing: "0.05em" }}>
                                    WELCOME{coupon.discountValue}
                                </div>
                            </div>
                            <button onClick={handleCopy} style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, fontSize: "13px", color: "#f43f5e", background: "none", border: "none", cursor: "pointer" }}>
                                {isCopied ? <Check size={16} /> : <Copy size={16} />} 
                                {isCopied ? "Copied" : "Copy"}
                            </button>
                        </div>
                        
                        <button onClick={handleRedeem} className="success-btn">
                            Redeem Now <ExternalLink size={18} style={{ marginLeft: "4px", opacity: 0.9 }} />
                        </button>
                    </div>
                </div>
            )}

            <div className="coupon-container">
                <button onClick={onClose} className="close-btn">
                    <X size={20} />
                </button>

                {/* Left Section (Images & Details) */}
                <div className="coupon-left">
                    {coupon.bannerUrl && (
                        <div className="coupon-banner">
                            <img src={coupon.bannerUrl} alt={coupon.brandName} />
                        </div>
                    )}
                    
                    <div className="coupon-brand" style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            {coupon.logoUrl && (
                                <div className="coupon-logo">
                                    <img src={coupon.logoUrl} alt={coupon.brandName} />
                                </div>
                            )}
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                                    {coupon.brandName}
                                </h1>
                                <p style={{ color: "#10b981", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px", margin: "2px 0 0" }}>
                                    <ShieldCheck size={12} color="#10b981" /> verified partner
                                </p>
                            </div>
                        </div>
                        <div style={{ color: "#94a3b8", fontSize: "11px", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                            <Calendar size={12} /> 15 days left
                        </div>
                    </div>

                    <div className="coupon-details">
                        <h2 className="coupon-title">{coupon.title}</h2>
                        <p className="coupon-desc">{coupon.description}</p>
                    </div>
                    
                    <div className="coupon-expiry">
                        <Calendar size={14} />
                        <span>Expires on: <span style={{ color: "#334155" }}>7 April 2026 at 05:37 pm</span></span>
                    </div>
                </div>

                {/* Right Section (Code & Instructions) */}
                <div className="coupon-right">
                    <div className="coupon-action-box">
                        <h3 style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "16px", margin: "0 0 16px", paddingLeft: "4px" }}>
                            Avail Your coupon code
                        </h3>
                        
                        {!isRevealed ? (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                                <div className="action-unrevealed-text">********</div>
                                <button onClick={handleGetCode} className="action-btn-get">
                                    <Copy size={14} /> Get Code
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                                <div className="action-revealed-text">WELCOME{coupon.discountValue}</div>
                                <button onClick={handleCopy} className="action-btn-copy" style={{ background: isCopied ? "#10b981" : "#2563eb" }}>
                                    {isCopied ? <Check size={16} /> : <Copy size={16} />} {isCopied ? "Copied" : "Copy"}
                                </button>
                            </div>
                        )}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <AccordionItem title="Description" icon={Gift} iconColor="#ef4444">
                            Exclusive partner discount available for BookMyTicket users. Valid on all category products.
                        </AccordionItem>
                        <AccordionItem title="How To Redeem" icon={Ticket} iconColor="#ef4444">
                            1. Copy the code above.<br/>2. Visit the brand's official website.<br/>3. Add products to cart and apply code at checkout.
                        </AccordionItem>
                        <AccordionItem title="Terms & Conditions" icon={AlertTriangle} iconColor="#f59e0b">
                            Valid till 7th April. Cannot be combined with other offers. Minimum purchase may apply.
                        </AccordionItem>
                    </div>
                </div>
            </div>
        </div>
    );
}
