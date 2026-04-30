"use client";
import React, { useRef, useEffect, useState } from 'react';
import { Download, X, Share2, Check, Copy, Instagram, Linkedin, MessageCircle, ExternalLink } from "lucide-react";

const JobPosterModal = ({ job, onClose, t }) => {
    const canvasRef = useRef(null);
    const [generating, setGenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    const posterConfigs = {
        instagram: { width: 1080, height: 1080, name: "Instagram Square" },
        linkedin: { width: 1200, height: 627, name: "LinkedIn Landscape" },
        whatsapp: { width: 1080, height: 1920, name: "WhatsApp Status" }
    };

    const drawPoster = (config) => {
        return new Promise((resolve) => {
            const canvas = canvasRef.current;
            if (!canvas) return resolve();
            const ctx = canvas.getContext('2d');
            const { width, height } = config;
            const isLandscape = width > height;
            const isPortrait = height > width * 1.5;
            
            canvas.width = width;
            canvas.height = height;

            // --- THEME COLORS ---
            const primary = '#6d28d9';
            const background = '#fefaf6';
            const textDark = '#1e1b4b';
            const textGray = '#4b5563';

            // 1. Background
            ctx.fillStyle = background;
            ctx.fillRect(0, 0, width, height);

            // 2. Decorative Side Panel (Only in Landscape)
            if (isLandscape) {
                ctx.fillStyle = '#f5f3ff';
                ctx.fillRect(width * 0.7, 0, width * 0.3, height);
            }

            // 3. Load Assets
            const applyUrl = `${window.location.origin}/careers?job=${job.id}`;
            const logo = new Image();
            const qrCode = new Image();
            let assetsLoaded = 0;
            const onAssetLoad = () => {
                assetsLoaded++;
                if (assetsLoaded === 2) finishDrawing();
            };
            logo.crossOrigin = "anonymous";
            logo.src = "/logo.png";
            logo.onload = onAssetLoad;
            logo.onerror = onAssetLoad;
            qrCode.crossOrigin = "anonymous";
            qrCode.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(applyUrl)}`;
            qrCode.onload = onAssetLoad;
            qrCode.onerror = onAssetLoad;

            function finishDrawing() {
                const margin = width * 0.08;
                const contentWidth = isLandscape ? width * 0.65 : width * 0.84;
                
                // A. Logo (Moved to TOP RIGHT to avoid overlap)
                const logoW = width * (isLandscape ? 0.18 : 0.25);
                const logoH = logoW * (logo.height / logo.width);
                ctx.drawImage(logo, width - margin - logoW, margin * 0.6, logoW, logoH);

                // B. Headline
                let currentY = isPortrait ? height * 0.22 : height * 0.08;
                ctx.textAlign = 'left';
                ctx.fillStyle = textDark;
                const headSize = width * (isLandscape ? 0.05 : (isPortrait ? 0.11 : 0.07));
                ctx.font = `900 ${headSize}px system-ui, sans-serif`;
                ctx.fillText("WE ARE", margin, currentY);
                currentY += headSize * 1.1;
                ctx.fillStyle = primary;
                ctx.fillText("LOOKING FOR", margin, currentY);
                currentY += height * (isPortrait ? 0.06 : 0.035);

                // C. Job Title Pill
                const titleText = job.title.toUpperCase();
                const titleSize = width * (isLandscape ? 0.022 : (isPortrait ? 0.05 : 0.04));
                ctx.font = `800 ${titleSize}px system-ui, sans-serif`;
                const titleMetrics = ctx.measureText(titleText);
                const pillW = Math.min(titleMetrics.width + 60, contentWidth);
                const pillH = titleSize * 2.2;
                ctx.fillStyle = primary;
                ctx.roundRect(margin, currentY, pillW, pillH, 12);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.fillText(titleText, margin + 30, currentY + pillH/2 + (titleSize * 0.35), pillW - 60);
                currentY += pillH + (height * (isPortrait ? 0.08 : 0.05));

                // D. Roles & Responsibilities
                ctx.fillStyle = textDark;
                const sectionHeadSize = width * (isLandscape ? 0.022 : (isPortrait ? 0.035 : 0.025));
                ctx.font = `900 ${sectionHeadSize}px system-ui, sans-serif`;
                ctx.fillText("ROLES & RESPONSIBILITIES:", margin, currentY);
                currentY += sectionHeadSize * 2.5;

                const itemSize = width * (isLandscape ? 0.017 : (isPortrait ? 0.035 : 0.028));
                ctx.font = `600 ${itemSize}px system-ui, sans-serif`;
                const contentLines = (job.qualifications || "").split('\n').filter(q => q.trim()).slice(0, isPortrait ? 10 : 7);
                
                contentLines.forEach((line, i) => {
                    const itemY = currentY + (i * itemSize * 2.2);
                    ctx.fillStyle = primary;
                    ctx.beginPath(); ctx.arc(margin + 5, itemY - (itemSize * 0.4), 4, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = textGray;
                    ctx.fillText(line.trim(), margin + 25, itemY, contentWidth - 40);
                });

                // E. Footer & CTA (Landscape vs Portrait logic)
                if (isLandscape) {
                    // --- LANDSCAPE (LinkedIn) ---
                    const qrSize = width * 0.11;
                    const qrX = width * 0.7 + (width * 0.3 - qrSize) / 2;
                    const qrY = height * 0.38;
                    
                    ctx.fillStyle = '#ffffff';
                    ctx.shadowColor = 'rgba(0,0,0,0.05)'; ctx.shadowBlur = 10;
                    ctx.roundRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 16); ctx.fill();
                    ctx.shadowBlur = 0;
                    if (qrCode.complete) ctx.drawImage(qrCode, qrX, qrY, qrSize, qrSize);
                    
                    ctx.textAlign = 'center'; ctx.fillStyle = textDark;
                    ctx.font = `900 ${width * 0.015}px system-ui, sans-serif`;
                    ctx.fillText("SCAN TO APPLY", qrX + qrSize/2, qrY + qrSize + 30);

                    ctx.fillStyle = primary;
                    ctx.font = `800 ${width * 0.015}px system-ui, sans-serif`;
                    ctx.fillText("WWW.BOOKMYTICKET.NET/CAREERS", width * 0.85, height * 0.88);
                } else {
                    // --- PORTRAIT/SQUARE (WhatsApp/Instagram) ---
                    const footerY = height - margin - (height * 0.03);
                    
                    // 1. QR Code (Spread out from content)
                    const qrSize = width * 0.22;
                    const qrX = width - margin - qrSize;
                    const qrY = height - margin - qrSize - 60;
                    
                    ctx.fillStyle = '#ffffff';
                    ctx.shadowColor = 'rgba(0,0,0,0.05)'; ctx.shadowBlur = 10;
                    ctx.roundRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 16); ctx.fill();
                    ctx.shadowBlur = 0;
                    if (qrCode.complete) ctx.drawImage(qrCode, qrX, qrY, qrSize, qrSize);
                    
                    ctx.textAlign = 'center'; ctx.fillStyle = textDark;
                    ctx.font = `900 ${width * 0.025}px system-ui, sans-serif`;
                    ctx.fillText("SCAN TO APPLY", qrX + qrSize/2, qrY + qrSize + 30);

                    // 2. Website Link
                    ctx.textAlign = 'left';
                    ctx.fillStyle = primary;
                    ctx.font = `800 ${width * 0.025}px system-ui, sans-serif`;
                    ctx.fillText("WWW.BOOKMYTICKET.NET/CAREERS", margin, footerY);
                }
                
                resolve();
            }
        });
    };

    const downloadPoster = async (format) => {
        setGenerating(true);
        const config = posterConfigs[format];
        await drawPoster(config);
        
        const link = document.createElement('a');
        link.download = `JobPost_${job.title.replace(/\s+/g, '_')}_${format}.png`;
        link.href = canvasRef.current.toDataURL('image/png');
        link.click();
        setGenerating(false);
    };

    const copyLink = () => {
        const url = `https://bookmyticket.net/careers?job=${job.id}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const openApplyPage = () => {
        window.open(`https://bookmyticket.net/careers?job=${job.id}`, '_blank');
    };

    return (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 6000, padding: "20px" }}>
            <div style={{ backgroundColor: t.cardBg, width: "100%", maxWidth: "500px", borderRadius: "32px", border: `1px solid ${t.border}`, padding: "32px", boxShadow: "0 50px 100px -20px rgba(0,0,0,0.5)", textAlign: "center" }}>
                <div style={{ width: "64px", height: "64px", backgroundColor: "#22c55e15", color: "#22c55e", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                    <Check size={32} />
                </div>
                
                <h2 style={{ fontSize: "24px", fontWeight: 900, color: t.textMain, marginBottom: "8px" }}>Job Posted Successfully! 🎉</h2>
                <p style={{ fontSize: "14px", color: t.textSub, marginBottom: "32px" }}>Your job opening is now live. Generate and share posters to attract candidates.</p>

                <div style={{ display: "grid", gap: "12px", marginBottom: "32px" }}>
                    <button 
                        onClick={() => downloadPoster('instagram')}
                        style={{ padding: "16px", borderRadius: "16px", background: "#f8fafc", border: `1px solid ${t.border}`, color: "#1e293b", fontWeight: 800, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px", transition: "0.2s" }}
                        onMouseOver={e => e.currentTarget.style.background = "#fff"}
                        onMouseOut={e => e.currentTarget.style.background = "#f8fafc"}
                    >
                        <Instagram size={20} color="#e1306c" /> Download Instagram Post (Square)
                        <Download size={16} style={{ marginLeft: "auto", opacity: 0.4 }} />
                    </button>
                    <button 
                        onClick={() => downloadPoster('linkedin')}
                        style={{ padding: "16px", borderRadius: "16px", background: "#f8fafc", border: `1px solid ${t.border}`, color: "#1e293b", fontWeight: 800, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px", transition: "0.2s" }}
                        onMouseOver={e => e.currentTarget.style.background = "#fff"}
                        onMouseOut={e => e.currentTarget.style.background = "#f8fafc"}
                    >
                        <Linkedin size={20} color="#0077b5" /> Download LinkedIn Post (Landscape)
                        <Download size={16} style={{ marginLeft: "auto", opacity: 0.4 }} />
                    </button>
                    <button 
                        onClick={() => downloadPoster('whatsapp')}
                        style={{ padding: "16px", borderRadius: "16px", background: "#f8fafc", border: `1px solid ${t.border}`, color: "#1e293b", fontWeight: 800, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px", transition: "0.2s" }}
                        onMouseOver={e => e.currentTarget.style.background = "#fff"}
                        onMouseOut={e => e.currentTarget.style.background = "#f8fafc"}
                    >
                        <MessageCircle size={20} color="#25d366" /> Download WhatsApp Status (Portrait)
                        <Download size={16} style={{ marginLeft: "auto", opacity: 0.4 }} />
                    </button>
                </div>

                <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                    <button 
                        onClick={copyLink}
                        style={{ flex: 1, padding: "14px", borderRadius: "16px", background: copied ? "#22c55e" : "#1e293b", border: "none", color: "white", fontWeight: 800, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "0.3s" }}
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                        {copied ? "Link Copied!" : "Copy Apply Link"}
                    </button>
                    <button 
                        onClick={openApplyPage}
                        style={{ flex: 1, padding: "14px", borderRadius: "16px", background: "#f1f5f9", border: `1px solid ${t.border}`, color: "#1e293b", fontWeight: 800, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                    >
                        <ExternalLink size={18} />
                        View Live
                    </button>
                </div>

                <button 
                    onClick={onClose}
                    style={{ width: "100%", padding: "14px 24px", borderRadius: "16px", background: "transparent", border: `1px solid ${t.border}`, color: t.textMain, fontWeight: 800, fontSize: "14px", cursor: "pointer" }}
                >
                    Close
                </button>

                {/* Hidden Canvas for Drawing */}
                <canvas ref={canvasRef} style={{ display: "none" }} />
            </div>
        </div>
    );
};

export default JobPosterModal;
