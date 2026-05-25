"use client";
import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { 
    ZoomIn, ZoomOut, Move, RefreshCcw, Maximize2, Clock, CheckCircle2, ShoppingCart, Zap, CreditCard, ChevronRight, X, Heart
} from 'lucide-react';

export default function VisualSeatPicker({ 
    blocks = [], 
    categories = [], 
    bookedSeats = [], 
    blockedSeats = [], 
    reservedSeats = [], 
    selectedSeats = [], 
    onToggleSeat,
    backgroundUrl 
}) {
    const [scale, setScale] = useState(1);
    const containerRef = useRef(null);

    // Pan & Zoom values
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const springX = useSpring(x, { stiffness: 300, damping: 30 });
    const springY = useSpring(y, { stiffness: 300, damping: 30 });

    const getSeatStatus = (seatId) => {
        if (selectedSeats.some(s => s.id === seatId)) return 'selected';
        if (bookedSeats.includes(seatId)) return 'sold';
        if (blockedSeats.includes(seatId)) return 'blocked';
        if (reservedSeats.includes(seatId)) return 'sold'; 
        
        // Find if this seat belongs to a bestseller block (optional logic)
        // For now, we'll return 'available', but we can add 'bestseller' if needed
        return 'available';
    };

    const getRowLabel = (index, rowNaming) => {
        if (rowNaming === 'numeric') return String(index + 1);
        let label = '';
        let n = index;
        while (n >= 0) {
            label = String.fromCharCode((n % 26) + 65) + label;
            n = Math.floor(n / 26) - 1;
        }
        return label;
    };

    const handleZoom = (delta) => {
        setScale(prev => Math.max(0.4, Math.min(prev + delta, 3)));
    };

    const handleReset = () => {
        setScale(1);
        x.set(0);
        y.set(0);
    };

    // Check if blocks have coordinates
    const isSpatial = blocks.some(b => b.x !== undefined && b.x !== null && b.y !== undefined && b.y !== null);

    return (
        <div className="w-full bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm flex flex-col relative font-sans">
            
            {/* FLOATING ZOOM CONTROLS */}
            <div className="absolute bottom-32 right-8 z-[70] flex flex-col gap-3">
                <div className="flex flex-col bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                    <button onClick={() => handleZoom(0.2)} className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-pink-600 hover:bg-slate-50 transition-all">
                        <ZoomIn size={18} />
                    </button>
                    <div className="h-px bg-slate-100 mx-2" />
                    <button onClick={() => handleZoom(-0.2)} className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-pink-600 hover:bg-slate-50 transition-all">
                        <ZoomOut size={18} />
                    </button>
                </div>
                <button onClick={handleReset} className="w-10 h-10 bg-white rounded-xl shadow-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:text-pink-600 hover:bg-slate-50 transition-all">
                    <RefreshCcw size={16} />
                </button>
            </div>

            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-4 bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-xl border border-slate-100 font-medium text-xs text-slate-600 tracking-wide">
                <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-lg bg-blue-50 border border-blue-200 shadow-sm flex items-center justify-center"></div>Available</div>
                <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-lg bg-gradient-to-br from-red-500 to-red-600 shadow-sm flex items-center justify-center relative"><Heart size={16} fill="white" className="absolute text-white"/><span className="relative z-10 text-[8px] font-black text-red-600">S</span></div>Selected</div>
                <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-lg bg-green-100 border border-green-300 text-green-700 flex items-center justify-center"><X size={12} strokeWidth={3} /></div>Sold Out</div>
            </div>

            {/* MAIN CANVAS CONTAINER */}
            <div className="h-[600px] md:h-[750px] w-full relative bg-[#f8f9fa] overflow-hidden flex items-center justify-center" ref={containerRef}>
                {backgroundUrl && (
                    <img src={backgroundUrl} className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none" alt="Background Map" />
                )}

                {/* THE INTERACTIVE STAGE */}
                <motion.div 
                    style={{ x: springX, y: springY, scale }}
                    drag
                    dragConstraints={containerRef}
                    className="w-max h-max min-w-full min-h-full cursor-grab active:cursor-grabbing flex shrink-0"
                >
                    <div className={`m-auto p-4 md:p-8 transition-all duration-300 relative w-max ${isSpatial ? 'w-[2000px] h-[2000px]' : 'flex flex-col items-center gap-8'}`}>
                        {blocks.map((block, bIdx) => {
                            const blockPrice = categories.find(c => c.name === block.category)?.price || block.price || block.ticket_price || 0;
                            
                            return (
                                <div 
                                    key={block.id || bIdx}
                                    className={`w-max ${isSpatial ? 'absolute' : 'relative flex flex-col items-center'}`}
                                    style={isSpatial ? { left: block.x, top: block.y } : {}}
                                >
                                    {/* SECTION PRICING LABEL */}
                                    <div className="flex flex-col items-center mb-4 pointer-events-none">
                                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest bg-white/80 px-4 py-1 rounded-full shadow-sm border border-slate-100">
                                            ₹{blockPrice} {block.name}
                                        </h4>
                                    </div>

                                    <div className="w-max flex gap-4 md:gap-6 items-start bg-gradient-to-b from-white/95 to-white/70 p-6 md:p-8 rounded-[2.5rem] border border-white backdrop-blur-xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.02)]">
                                        {/* ROW LABELS */}
                                        <div className="flex flex-col gap-2 pt-1 pointer-events-none">
                                            {Array.from({ length: block.rows || 0 }).map((_, rIdx) => (
                                                <div key={rIdx} className="h-10 flex items-center justify-center text-xs font-bold text-slate-500 uppercase">
                                                    {getRowLabel(rIdx, block.rowNaming)}
                                                </div>
                                            ))}
                                        </div>

                                        {/* SEAT GRID */}
                                        <div className="flex flex-col gap-2">
                                            {Array.from({ length: block.rows || 0 }).map((_, rIdx) => {
                                                const rowLabel = getRowLabel(rIdx, block.rowNaming);
                                                return (
                                                    <div key={rIdx} className="flex gap-2">
                                                        {Array.from({ length: block.cols || 0 }).map((_, cIdx) => {
                                                            const seatNum = block.numberingDirection === 'ltr' ? (cIdx + (block.startNumber || 1)) : ((block.cols || 0) - cIdx + (block.startNumber || 1) - 1);
                                                            const seatId = `${block.name}-${rowLabel}-${seatNum}`;
                                                            const status = getSeatStatus(seatId);
                                                            
                                                            let seatStyles = "w-10 h-10 rounded-[14px] flex shrink-0 items-center justify-center text-[12px] font-black transition-all border cursor-pointer relative overflow-hidden ";
                                                            
                                                            if (status === 'sold' || status === 'blocked') {
                                                                seatStyles += "bg-green-100 border-green-300 text-green-700 cursor-not-allowed shadow-inner opacity-90";
                                                            } else if (status === 'selected') {
                                                                seatStyles += "bg-gradient-to-br from-red-500 via-red-600 to-red-700 border-red-500 text-white shadow-xl shadow-red-500/40 ring-4 ring-red-200 hover:scale-105 active:scale-95 animate-pulse";
                                                            } else {
                                                                seatStyles += "bg-blue-50 border-blue-200 text-blue-700 shadow-[0_4px_12px_rgba(59,130,246,0.12)] hover:border-blue-400 hover:shadow-[0_8px_20px_rgba(59,130,246,0.25)] hover:-translate-y-1.5 active:scale-95";
                                                            }

                                                            return (
                                                                <button
                                                                    key={cIdx}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (status === 'available' || status === 'selected') {
                                                                            const cat = categories.find(c => c.name === block.category) || { name: block.name, price: blockPrice };
                                                                            onToggleSeat(seatId, cat);
                                                                        }
                                                                    }}
                                                                    className={seatStyles}
                                                                    title={`Row ${rowLabel} - Seat ${seatNum} (₹${blockPrice})`}
                                                                >
                                                                    {status === 'selected' ? (
                                                                        <div className="relative flex items-center justify-center w-full h-full">
                                                                            <Heart size={26} fill="white" className="absolute text-white animate-pulse" strokeWidth={0} />
                                                                            <span className="relative z-10 text-[11px] font-black text-red-600 pb-[1px]">{seatNum}</span>
                                                                        </div>
                                                                    ) : (status === 'sold' || status === 'blocked' ? <X size={18} strokeWidth={4} /> : seatNum)}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        
                        {/* STAGE SCREEN */}
                        {!isSpatial && blocks.length > 0 && (
                            <div className="w-full max-w-md mx-auto mt-12 mb-8 relative pointer-events-none">
                                <div className="h-2 w-full bg-slate-300 rounded-t-[100%] opacity-50 shadow-[0_10px_20px_rgba(0,0,0,0.1)]"></div>
                                <p className="text-center text-[10px] font-bold text-slate-400 tracking-[0.5em] mt-4 uppercase">All eyes this way</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* BOTTOM STATUS LEGEND */}
            <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-center gap-8 z-[80]">
                {[
                    { label: 'Available', color: 'border-blue-500', bg: 'bg-blue-50' },
                    { label: 'Selected', color: 'border-red-600', bg: 'bg-red-600' },
                    { label: 'Sold', color: 'border-green-400', bg: 'bg-green-100' },
                ].map(item => (
                    <div key={item.label} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border ${item.color} ${item.bg}`} />
                        <span className="text-[11px] font-semibold text-slate-600 uppercase">{item.label}</span>
                    </div>
                ))}
            </div>
            
        </div>
    );
}
