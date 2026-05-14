"use client";
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { 
    X, Check, Users, Layout, Map, Info, 
    ChevronRight, ArrowLeft, ZoomIn, ZoomOut, 
    MousePointer2, Maximize2, Move, Star, Zap,
    ShieldCheck, AlertCircle, RefreshCcw, Search, Target,
    CreditCard, Receipt, Clock
} from 'lucide-react';

export default function VisualSeatPicker({ 
    blocks = [], 
    categories = [], 
    bookedSeats = [], // Array of seat IDs that are sold
    blockedSeats = [], // Array of seat IDs blocked by admin
    reservedSeats = [], // Array of seat IDs temporarily held
    selectedSeats = [], 
    onToggleSeat,
    backgroundUrl 
}) {
    const [viewMode, setViewMode] = useState('venue'); // 'venue' or 'block'
    const [zoomBlock, setZoomBlock] = useState(null);
    const [scale, setScale] = useState(1);
    const containerRef = useRef(null);

    // Pan & Zoom values
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const springX = useSpring(x, { stiffness: 300, damping: 30 });
    const springY = useSpring(y, { stiffness: 300, damping: 30 });

    const getSeatStatus = (seatId) => {
        if (bookedSeats.includes(seatId)) return 'sold';
        if (blockedSeats.includes(seatId)) return 'blocked';
        if (reservedSeats.includes(seatId)) return 'temp_locked'; // Maps to others' locks
        if (selectedSeats.some(s => s.id === seatId)) return 'selected';
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

    const handleBlockClick = (block) => {
        setZoomBlock(block);
        setViewMode('block');
        x.set(0);
        y.set(0);
        setScale(1);
    };

    const handleBackToVenue = () => {
        setViewMode('venue');
        setZoomBlock(null);
        setScale(1);
        x.set(0);
        y.set(0);
    };

    const handleZoom = (delta) => {
        setScale(prev => Math.max(0.5, Math.min(prev + delta, 4)));
    };

    const handleReset = () => {
        setScale(1);
        x.set(0);
        y.set(0);
    };

    // PRICE CALCULATION
    const subtotal = selectedSeats.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
    const platformFee = selectedSeats.length > 0 ? (selectedSeats.length * 20) : 0;
    const gst = Math.round(subtotal * 0.18);
    const totalAmount = subtotal + platformFee + gst;

    const blockPrice = useMemo(() => {
        if (!zoomBlock) return 0;
        return categories.find(c => c.name === zoomBlock.category)?.price || 0;
    }, [zoomBlock, categories]);

    return (
        <div className="w-full h-[850px] bg-slate-50 rounded-[3rem] overflow-hidden border border-slate-200 shadow-[0_30px_100px_rgba(0,0,0,0.1)] flex flex-col relative group/picker font-sans">
            
            {/* TOP BAR: SEARCH & CONTEXT */}
            <div className="h-24 px-12 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-xl z-[60]">
                <div className="flex items-center gap-8">
                    {viewMode === 'block' ? (
                        <button 
                            onClick={handleBackToVenue}
                            className="flex items-center gap-4 text-slate-400 hover:text-pink-600 transition-all group/back"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover/back:bg-pink-50 group-hover/back:scale-110 transition-all">
                                <ArrowLeft size={20} />
                            </div>
                            <div className="text-left">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter italic leading-none">{zoomBlock?.name}</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Back to Overview</p>
                            </div>
                        </button>
                    ) : (
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-pink-500/20">
                                <Target size={28} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-[900] text-slate-900 uppercase tracking-tighter italic leading-none">Select Your Spot</h3>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 italic flex items-center gap-2">
                                    <Zap size={12} className="text-pink-500" />
                                    Live Stadium Inventory
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-8">
                    {/* REALTIME INDICATOR */}
                    <div className="flex items-center gap-3 px-6 py-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Real-time Active</span>
                    </div>
                </div>
            </div>

            {/* MAIN CANVAS CONTAINER */}
            <div className="flex-1 relative bg-[#F8FAFC] overflow-hidden" ref={containerRef}>
                
                {/* FLOATING ZOOM CONTROLS (Right Side) */}
                <div className="absolute top-1/2 -translate-y-1/2 right-10 z-[70] flex flex-col gap-4">
                    <div className="flex flex-col bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white overflow-hidden p-2 gap-1">
                        <button onClick={() => handleZoom(0.3)} className="w-14 h-14 flex items-center justify-center text-slate-400 hover:text-pink-600 hover:bg-pink-50 rounded-2xl transition-all">
                            <ZoomIn size={24} />
                        </button>
                        <div className="h-px bg-slate-100 mx-3" />
                        <button onClick={() => handleZoom(-0.3)} className="w-14 h-14 flex items-center justify-center text-slate-400 hover:text-pink-600 hover:bg-pink-50 rounded-2xl transition-all">
                            <ZoomOut size={24} />
                        </button>
                    </div>
                    <button onClick={handleReset} className="w-14 h-14 bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-2xl border border-white flex items-center justify-center text-slate-400 hover:text-pink-600 hover:bg-pink-50 transition-all">
                        <RefreshCcw size={20} />
                    </button>
                </div>

                {/* ZOOM TIP */}
                <AnimatePresence>
                    {viewMode === 'block' && (
                        <motion.div 
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="absolute bottom-10 left-10 z-[70]"
                        >
                            <div className="bg-slate-900/90 backdrop-blur-xl text-white px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-6 border border-white/10">
                                <div className="flex -space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-pink-500 border-4 border-slate-900 flex items-center justify-center"><Move size={16} /></div>
                                    <div className="w-10 h-10 rounded-full bg-purple-600 border-4 border-slate-900 flex items-center justify-center"><Maximize2 size={16} /></div>
                                </div>
                                <p className="text-[11px] font-black uppercase tracking-[0.2em] italic">Drag to Pan • Pinch to Zoom</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* THE INTERACTIVE STAGE */}
                <motion.div 
                    style={{ x: springX, y: springY, scale }}
                    drag
                    dragConstraints={containerRef}
                    className="absolute inset-0 flex items-center justify-center p-32"
                >
                    <AnimatePresence mode="wait">
                        {viewMode === 'venue' ? (
                            <motion.div 
                                key="venue"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.1 }}
                                className="relative w-full h-full max-w-[1200px] max-h-[800px]"
                            >
                                {backgroundUrl ? (
                                    <img src={backgroundUrl} className="w-full h-full object-contain filter drop-shadow-[0_40px_80px_rgba(0,0,0,0.15)]" alt="Stadium" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center border-4 border-dashed border-slate-200 rounded-[5rem] bg-white/50 shadow-inner">
                                        <div className="text-center space-y-4">
                                            <Target size={64} className="text-slate-200 mx-auto" />
                                            <p className="text-[12px] font-black text-slate-300 uppercase tracking-[0.6em]">Arena Blueprint View</p>
                                        </div>
                                    </div>
                                )}

                                {/* BLOCKS OVERLAY */}
                                {blocks.map((block) => (
                                    <motion.button
                                        key={block.id}
                                        whileHover={{ scale: 1.05, y: -10, zIndex: 100 }}
                                        onClick={() => handleBlockClick(block)}
                                        className="absolute group rounded-[1.5rem] border-2 transition-all flex flex-col items-center justify-center shadow-2xl overflow-hidden backdrop-blur-sm"
                                        style={{
                                            left: `${block.x}%`,
                                            top: `${block.y}%`,
                                            width: `${block.width}%`,
                                            height: `${block.height}%`,
                                            borderColor: block.color,
                                            backgroundColor: `${block.color}15`,
                                        }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="relative z-10 flex flex-col items-center gap-3">
                                            <div className="px-6 py-2 bg-white shadow-2xl rounded-full border border-slate-100 scale-90 group-hover:scale-110 transition-transform">
                                                <span className="text-slate-900 text-[11px] font-black uppercase tracking-tighter italic">{block.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-1 bg-white/50 rounded-full">
                                                <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest leading-none">Starts ₹{categories.find(c => c.name === block.category)?.price || '0'}</p>
                                            </div>
                                        </div>
                                    </motion.button>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="block"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.1 }}
                                className="w-full h-full flex flex-col items-center justify-center p-20"
                            >
                                <div className="flex flex-col gap-12 bg-white p-20 rounded-[4rem] shadow-2xl border border-slate-100">
                                    {/* SECTION HEADER */}
                                    <div className="w-full flex flex-col items-center mb-10">
                                        <div className="flex items-center gap-6 mb-6">
                                            <div className="w-16 h-16 rounded-3xl bg-pink-50 flex items-center justify-center text-pink-500 shadow-xl shadow-pink-500/10">
                                                <Zap size={32} />
                                            </div>
                                            <div className="text-left">
                                                <h4 className="text-5xl font-[900] text-slate-900 uppercase tracking-tighter italic leading-none">{zoomBlock?.name}</h4>
                                                <div className="flex items-center gap-3 mt-3">
                                                    <span className="px-4 py-1.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-black uppercase tracking-widest">{zoomBlock?.category} SECTION</span>
                                                    <span className="text-2xl font-black text-slate-900 italic">₹{blockPrice}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="h-[2px] w-full bg-slate-100 rounded-full relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 w-1/3" />
                                        </div>
                                    </div>

                                    <div className="flex gap-12">
                                        {/* ROW LABELS */}
                                        <div className="flex flex-col gap-3">
                                            {Array.from({ length: zoomBlock?.rows || 0 }).map((_, rIdx) => (
                                                <div key={rIdx} className="w-12 h-12 flex items-center justify-center text-[14px] font-black text-slate-300 uppercase italic">
                                                    {getRowLabel(rIdx, zoomBlock?.rowNaming)}
                                                </div>
                                            ))}
                                        </div>

                                        {/* SEAT GRID */}
                                        <div className="flex flex-col gap-3">
                                            {Array.from({ length: zoomBlock?.rows || 0 }).map((_, rIdx) => {
                                                const rowLabel = getRowLabel(rIdx, zoomBlock?.rowNaming);
                                                return (
                                                    <div key={rIdx} className="flex gap-3">
                                                        {Array.from({ length: zoomBlock?.cols || 0 }).map((_, cIdx) => {
                                                            const seatNum = zoomBlock?.numberingDirection === 'ltr' ? (cIdx + zoomBlock?.startNumber) : (zoomBlock?.cols - cIdx + zoomBlock?.startNumber - 1);
                                                            const seatId = `${zoomBlock?.name}-${rowLabel}-${seatNum}`;
                                                            const status = getSeatStatus(seatId);
                                                            
                                                            return (
                                                                <motion.button
                                                                    key={cIdx}
                                                                    whileHover={status === 'available' ? { scale: 1.15, zIndex: 10 } : {}}
                                                                    whileTap={status === 'available' ? { scale: 0.9 } : {}}
                                                                    onClick={() => {
                                                                        if (status === 'available' || status === 'selected') {
                                                                            const cat = categories.find(c => c.name === zoomBlock.category) || { name: 'General', price: 0 };
                                                                            onToggleSeat(seatId, cat);
                                                                        }
                                                                    }}
                                                                    className={`w-12 h-12 rounded-[1rem] transition-all flex items-center justify-center text-[11px] font-black border-2 ${
                                                                        status === 'sold' 
                                                                        ? 'bg-slate-100 border-slate-100 text-slate-300 cursor-not-allowed shadow-inner' 
                                                                        : status === 'blocked'
                                                                        ? 'bg-red-50 border-red-200 text-red-500 cursor-not-allowed'
                                                                        : status === 'temp_locked'
                                                                        ? 'bg-amber-50 border-amber-200 text-amber-500 cursor-wait animate-pulse'
                                                                        : status === 'selected'
                                                                        ? 'bg-pink-500 border-pink-500 text-white shadow-xl shadow-pink-500/30'
                                                                        : 'bg-white border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:shadow-xl'
                                                                    }`}
                                                                >
                                                                    {status === 'temp_locked' ? <Clock size={14} /> : seatNum}
                                                                </motion.button>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* STAGE/SCREEN */}
                                    <div className="mt-16 w-full max-w-xl mx-auto py-8 border-2 border-slate-100 rounded-2xl text-center bg-slate-50 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <p className="text-[12px] font-black text-slate-300 uppercase tracking-[1em] italic">Arena Stage Area</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* SELECTION LEGEND & STATUS */}
            <div className="px-16 py-8 bg-white border-t border-slate-100 flex items-center justify-between z-[80]">
                <div className="flex items-center gap-10">
                    {[
                        { label: 'Available', color: 'border-emerald-500', bg: 'bg-white' },
                        { label: 'Selected', color: 'border-pink-500', bg: 'bg-pink-500 shadow-pink-500/20 shadow-lg' },
                        { label: 'Sold', color: 'border-slate-100', bg: 'bg-slate-100' },
                        { label: 'Blocked', color: 'border-red-200', bg: 'bg-red-50' },
                        { label: 'Temp Locked', color: 'border-amber-200', bg: 'bg-amber-50 animate-pulse' },
                    ].map(item => (
                        <div key={item.label} className="flex items-center gap-4">
                            <div className={`w-6 h-6 rounded-xl border-2 ${item.color} ${item.bg}`} />
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-6">
                    <Clock size={16} className="text-pink-500" />
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Seats auto-release in 10:00</span>
                </div>
            </div>

            {/* FINAL CHECKOUT & SUMMARY PANEL */}
            <div className="p-12 bg-slate-950 flex flex-col md:flex-row items-center justify-between gap-12 z-[90]">
                <div className="flex flex-col md:flex-row items-center gap-12">
                    {/* SEAT AVATARS */}
                    <div className="flex -space-x-5">
                        {selectedSeats.length === 0 ? (
                            <div className="w-16 h-16 rounded-[1.5rem] bg-slate-900 border-4 border-slate-950 flex items-center justify-center text-slate-700 shadow-2xl">
                                <MousePointer2 size={28} />
                            </div>
                        ) : (
                            selectedSeats.slice(0, 5).map((s, idx) => (
                                <motion.div 
                                    key={s.id}
                                    initial={{ scale: 0, x: -30 }}
                                    animate={{ scale: 1, x: 0 }}
                                    className="w-16 h-16 rounded-[1.5rem] bg-pink-500 border-4 border-slate-950 flex flex-col items-center justify-center shadow-[0_15px_40px_rgba(236,72,153,0.3)]"
                                >
                                    <p className="text-[10px] font-black text-white leading-none mb-1 uppercase italic">{s.id.split('-')[1]}</p>
                                    <p className="text-[14px] font-black text-white leading-none italic">{s.id.split('-').pop()}</p>
                                </motion.div>
                            ))
                        )}
                        {selectedSeats.length > 5 && (
                            <div className="w-16 h-16 rounded-[1.5rem] bg-slate-800 border-4 border-slate-950 flex items-center justify-center text-[14px] font-black text-white shadow-2xl">
                                +{selectedSeats.length - 5}
                            </div>
                        )}
                    </div>

                    <div className="text-left space-y-2">
                        <div className="flex items-center gap-3">
                            <h4 className="text-3xl font-[900] text-white tracking-tighter italic leading-none">{selectedSeats.length || '0'} Seats</h4>
                            <span className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black text-pink-400 uppercase tracking-widest">Selected</span>
                        </div>
                        <div className="flex items-center gap-4 opacity-40">
                            <Receipt size={14} className="text-white" />
                            <p className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Summary: ₹{subtotal} + Fees</p>
                        </div>
                    </div>
                </div>

                {/* DETAILED PRICE PANEL */}
                <div className="flex flex-col md:flex-row items-center gap-16">
                    <div className="grid grid-cols-2 gap-x-12 gap-y-1 text-right">
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Base Amount</p>
                        <p className="text-[12px] font-black text-white/60">₹{subtotal}</p>
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Platform & GST</p>
                        <p className="text-[12px] font-black text-pink-400">₹{platformFee + gst}</p>
                        <div className="col-span-2 h-px bg-white/10 my-2" />
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Grand Total</p>
                        <p className="text-4xl font-[900] text-white tracking-tighter italic leading-none">₹{totalAmount}</p>
                    </div>

                    <button 
                        disabled={selectedSeats.length === 0}
                        className={`px-16 py-7 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-[13px] italic transition-all flex items-center gap-4 ${
                            selectedSeats.length > 0 
                            ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(236,72,153,0.4)]' 
                            : 'bg-slate-900 text-slate-700 border border-white/5 cursor-not-allowed'
                        }`}
                    >
                        Secure Checkout <ChevronRight size={20} strokeWidth={3} />
                    </button>
                </div>
            </div>
        </div>
    );
}
