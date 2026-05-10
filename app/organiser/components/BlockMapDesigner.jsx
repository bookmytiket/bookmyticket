"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    CloudUpload, Plus, Trash2, Edit2, Check, Move, Maximize2, 
    X, Layout, Grid3X3, Settings2, Info, ChevronRight, ChevronDown, 
    Copy, MousePointer2, Box, Layers, RefreshCcw, 
    ArrowUpRight, Target, PenTool, Circle, Square,
    RotateCw, AlignCenter, Palette, DollarSign, Zap
} from "lucide-react";

export default function BlockMapDesigner({ postEvent, setPostEvent }) {
    const containerRef = useRef(null);
    const [selectedBlockId, setSelectedBlockId] = useState(null);
    const [isResizing, setIsResizing] = useState(false);
    const [activeTool, setActiveTool] = useState('rectangle'); 
    const [snapToGrid, setSnapToGrid] = useState(true);
    const [previewBlockId, setPreviewBlockId] = useState(null);
    const [showInventory, setShowInventory] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
    const startDimensionsRef = useRef(null);
    
    const blocks = postEvent.blocks || [];
    const categories = postEvent.categories || [];
    const GRID_SIZE = 2; 

    // THEME CONSTANTS
    const THEME_PINK = "#ec4899";
    const THEME_PURPLE = "#8b5cf6";

    const snapValue = (val) => {
        if (!snapToGrid) return val;
        return Math.round(val / GRID_SIZE) * GRID_SIZE;
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setPostEvent(prev => ({ ...prev, seatMapBackgroundUrl: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    const addBlock = () => {
        const defaultCategory = categories[0] || { name: "General", color: THEME_PINK };
        const newBlock = {
            id: `block_${Date.now()}`,
            name: `Block ${String.fromCharCode(65 + blocks.length)}`, 
            type: activeTool,
            x: 10, 
            y: 10,
            width: 25,
            height: 20,
            rows: 5,
            cols: 10,
            category: defaultCategory.name,
            color: defaultCategory.color || THEME_PINK,
            rowNaming: 'alphabetic',
            startNumber: 1,
            numberingDirection: 'ltr',
            rotation: 0,
            borderRadius: activeTool === 'circle' ? '50%' : '1rem'
        };
        setPostEvent(prev => ({ ...prev, blocks: [...(prev.blocks || []), newBlock] }));
        setSelectedBlockId(newBlock.id);
        
        if (blocks.length === 0 && !postEvent.seatMapBackgroundUrl) {
            setPostEvent(prev => ({ ...prev, seatMapBackgroundUrl: 'placeholder' }));
        }
    };

    const updateBlock = (id, updates) => {
        setPostEvent(prev => ({
            ...prev,
            blocks: prev.blocks.map(b => b.id === id ? { ...b, ...updates } : b)
        }));
    };

    const syncCategories = () => {
        const categoryMap = {};
        
        // Calculate total units per category from blocks
        blocks.forEach(block => {
            const units = (block.rows || 0) * (block.cols || 0);
            if (!categoryMap[block.category]) {
                categoryMap[block.category] = { count: 0, color: block.color };
            }
            categoryMap[block.category].count += units;
        });

        setPostEvent(prev => {
            const updatedCategories = (prev.categories || []).map(cat => {
                if (categoryMap[cat.name]) {
                    return { ...cat, totalSlots: categoryMap[cat.name].count };
                }
                return cat;
            });

            // Also add categories that might exist in blocks but not in categories list
            Object.keys(categoryMap).forEach(catName => {
                if (!updatedCategories.find(c => c.name === catName)) {
                    updatedCategories.push({
                        name: catName,
                        totalSlots: categoryMap[catName].count,
                        basePrice: 0,
                        color: categoryMap[catName].color
                    });
                }
            });

            return { ...prev, categories: updatedCategories };
        });
        
        alert("Inventory Synchronized with Seat Map!");
    };

    const removeBlock = (id) => {
        setPostEvent(prev => ({ ...prev, blocks: prev.blocks.filter(b => b.id !== id) }));
        setSelectedBlockId(null);
    };

    const duplicateBlock = (id) => {
        const block = blocks.find(b => b.id === id);
        if (!block) return;
        const newBlock = { ...block, id: `block_${Date.now()}`, x: block.x + 5, y: block.y + 5 };
        setPostEvent(prev => ({ ...prev, blocks: [...prev.blocks, newBlock] }));
        setSelectedBlockId(newBlock.id);
    };

    const handleDragEnd = (e, info, block) => {
        if (!containerRef.current || isResizing) return;
        const bounds = containerRef.current.getBoundingClientRect();
        const blockEl = document.getElementById(`block-el-${block.id}`);
        if (!blockEl) return;
        
        const blockBounds = blockEl.getBoundingClientRect();
        let finalX = ((blockBounds.left - bounds.left) / bounds.width) * 100;
        let finalY = ((blockBounds.top - bounds.top) / bounds.height) * 100;

        updateBlock(block.id, { 
            x: snapValue(Math.max(0, Math.min(finalX, 100 - block.width))), 
            y: snapValue(Math.max(0, Math.min(finalY, 100 - block.height))) 
        });
    };

    const handleResizeStart = (block) => {
        setIsResizing(true);
        startDimensionsRef.current = { width: block.width, height: block.height };
    };

    const handleResize = (e, info, block) => {
        if (!block || !startDimensionsRef.current) return;
        const bounds = containerRef.current.getBoundingClientRect();
        
        const offsetPctX = (info.offset.x / bounds.width) * 100;
        const offsetPctY = (info.offset.y / bounds.height) * 100;

        updateBlock(block.id, {
            width: snapValue(Math.max(5, Math.min(startDimensionsRef.current.width + offsetPctX, 100 - block.x))),
            height: snapValue(Math.max(5, Math.min(startDimensionsRef.current.height + offsetPctY, 100 - block.y)))
        });
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!selectedBlockId) return;
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (document.activeElement.tagName !== 'INPUT') removeBlock(selectedBlockId);
            }
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                duplicateBlock(selectedBlockId);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedBlockId, blocks]);

    const selectedBlock = blocks.find(b => b.id === selectedBlockId);
    const previewBlock = blocks.find(b => b.id === previewBlockId);

    return (
        <div className="flex flex-col gap-10">
            {/* STADIUM DESIGNER HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-12 py-10 bg-slate-900 rounded-[3.5rem] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                <div className="flex items-center gap-8">
                    <div className="w-20 h-20 rounded-[2.5rem] bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-2xl shadow-pink-500/40">
                        <Target size={36} />
                    </div>
                    <div>
                        <h2 className="text-4xl font-[900] text-white uppercase tracking-tighter italic leading-none">Arena Architect</h2>
                        <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.4em] mt-3 italic flex items-center gap-2">
                            <Zap size={12} className="text-pink-500" />
                            Spatial Mapping Engine v3.0
                        </p>
                    </div>
                </div>
                
                {/* TOOLBAR */}
                <div className="flex items-center gap-4 bg-white/5 backdrop-blur-3xl p-3 rounded-[2.5rem] border border-white/10 shadow-inner">
                    {[
                        { id: 'rectangle', icon: Square, label: 'Block' },
                        { id: 'circle', icon: Circle, label: 'Pavilion' }
                    ].map(tool => (
                        <button
                            key={tool.id}
                            onClick={() => setActiveTool(tool.id)}
                            className={`flex items-center gap-3 px-8 py-4 rounded-full transition-all duration-500 ${activeTool === tool.id ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-2xl shadow-pink-500/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                        >
                            <tool.icon size={18} />
                            <span className="text-[11px] font-black uppercase tracking-widest">{tool.label}</span>
                        </button>
                    ))}
                    <div className="w-px h-10 bg-white/10 mx-2" />
                    <button 
                        onClick={() => setSnapToGrid(!snapToGrid)}
                        className={`p-4 rounded-full transition-all ${snapToGrid ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-white/20 hover:text-white'}`}
                        title="Snap to Grid"
                    >
                        <Grid3X3 size={24} />
                    </button>
                    <button 
                        onClick={addBlock} 
                        className="p-4 bg-white text-slate-900 rounded-[1.5rem] hover:scale-105 active:scale-95 transition-all shadow-2xl"
                        title="Add New Block"
                    >
                        <Plus size={24} strokeWidth={3} />
                    </button>
                </div>
            </div>

            {/* MAIN ARCHITECTURAL CANVAS - IMAGE BASED STYLE */}
            <div className="w-full relative bg-slate-50 overflow-hidden min-h-[450px] rounded-[4rem] border-8 border-slate-100 shadow-[0_40px_100px_rgba(0,0,0,0.03)]" ref={containerRef}>
                {/* GRID OVERLAY */}
                <div 
                    className="absolute inset-0 pointer-events-none opacity-40"
                    style={{
                        backgroundImage: `radial-gradient(#94a3b8 1px, transparent 1px)`,
                        backgroundSize: '24px 24px'
                    }}
                />

                {/* THE BLUEPRINT CONTAINER */}
                <div className="absolute inset-0 p-12 flex items-center justify-center">
                    <div className="relative w-full h-full bg-white/50 rounded-[4rem] border-4 border-dashed border-slate-200 flex items-center justify-center overflow-hidden shadow-inner">
                        
                        {postEvent.seatMapBackgroundUrl ? (
                            <>
                                {postEvent.seatMapBackgroundUrl !== 'placeholder' ? (
                                    <img src={postEvent.seatMapBackgroundUrl} className="w-full h-full object-contain opacity-50 select-none pointer-events-none" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                                        <Grid3X3 size={400} strokeWidth={0.5} className="text-slate-900" />
                                    </div>
                                )}
                                {/* FLOATING CHANGE IMAGE BUTTON */}
                                <div className="absolute top-8 right-8 z-[100] flex gap-3">
                                    <label className="w-14 h-14 bg-white rounded-2xl shadow-2xl flex items-center justify-center text-slate-900 cursor-pointer hover:scale-110 active:scale-95 transition-all border border-slate-100">
                                        <RefreshCcw size={20} />
                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                    </label>
                                    <button 
                                        onClick={() => setPostEvent(prev => ({ ...prev, seatMapBackgroundUrl: null }))}
                                        className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center group p-12">
                                <label className="flex flex-col items-center justify-center h-44 w-96 border-4 border-dashed border-slate-200 rounded-[2.5rem] bg-white/80 cursor-pointer hover:bg-pink-50/50 hover:border-pink-300 transition-all shadow-2xl relative overflow-hidden group/upload mx-auto">
                                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-purple-600/5 opacity-0 group-hover/upload:opacity-100 transition-opacity" />
                                    <div className="relative z-10 text-center space-y-3">
                                        <div className="w-16 h-16 rounded-full bg-slate-900 text-white shadow-xl flex items-center justify-center mx-auto mb-2 group-hover/upload:scale-110 transition-transform">
                                            <CloudUpload size={28} />
                                        </div>
                                        <span className="block text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] italic leading-none">Upload Layout</span>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">PNG, JPG, PDF Blueprint</p>
                                    </div>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                </label>
                                <button 
                                    onClick={() => setPostEvent(p => ({ ...p, seatMapBackgroundUrl: 'placeholder' }))}
                                    className="mt-6 px-10 py-4 bg-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-pink-500 transition-all shadow-xl italic"
                                >
                                    Initialize Manual Grid
                                </button>
                            </div>
                        )}

                        {/* RENDER BLOCKS IN CUSTOMER-INSPIRED STYLE */}
                        {blocks.map((block) => (
                            <motion.div
                                id={`block-el-${block.id}`}
                                key={block.id}
                                drag={!isResizing}
                                dragMomentum={false}
                                onDragEnd={(e, info) => handleDragEnd(e, info, block)}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedBlockId(block.id);
                                }}
                                initial={false}
                                animate={{
                                    left: `${block.x}%`,
                                    top: `${block.y}%`,
                                    width: `${block.width}%`,
                                    height: `${block.height}%`,
                                    rotate: block.rotation || 0,
                                }}
                                className={`absolute group cursor-move flex flex-col items-center p-6 transition-all border-2 ${
                                    selectedBlockId === block.id 
                                    ? 'bg-white border-pink-500 shadow-[0_20px_50px_rgba(236,72,153,0.3)] z-50' 
                                    : 'bg-white/95 border-slate-200 shadow-xl z-10 hover:border-slate-400'
                                }`}
                                style={{
                                    borderRadius: block.borderRadius || '1rem'
                                }}
                            >
                                {/* BLOCK HEADER (Inspired by 2nd Image) */}
                                <div className="w-full flex flex-col items-center mb-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold text-slate-900 italic">₹{categories.find(c => c.name === block.category)?.price || '0'}</span>
                                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight italic">{block.name}</span>
                                    </div>
                                    <div className="h-[1px] w-full bg-slate-100" />
                                </div>

                                {/* SEAT GRID MINIATURE (Visual representation) */}
                                <div className="flex-1 flex flex-col gap-1 overflow-hidden opacity-60">
                                    {Array.from({ length: Math.min(block.rows || 0, 8) }).map((_, rIdx) => (
                                        <div key={rIdx} className="flex gap-1">
                                            {Array.from({ length: Math.min(block.cols || 0, 15) }).map((_, cIdx) => (
                                                <div 
                                                    key={cIdx} 
                                                    className="w-2.5 h-2.5 rounded-[2px] border border-emerald-500/40 bg-white" 
                                                />
                                            ))}
                                            {(block.cols || 0) > 15 && <div className="w-2.5 h-2.5 flex items-center justify-center text-[6px] font-black text-slate-300">...</div>}
                                        </div>
                                    ))}
                                    {(block.rows || 0) > 8 && <div className="w-full text-center text-[6px] font-black text-slate-300">...</div>}
                                </div>

                                {/* SELECTION HANDLES */}
                                {selectedBlockId === block.id && (
                                    <>
                                        <motion.div 
                                            onPanStart={() => handleResizeStart(block)}
                                            onPanEnd={() => {
                                                setIsResizing(false);
                                                startDimensionsRef.current = null;
                                            }}
                                            onPan={(e, info) => handleResize(e, info, block)}
                                            className="absolute bottom-2 right-2 w-12 h-12 bg-white border-2 border-pink-500 rounded-2xl flex items-center justify-center text-pink-500 shadow-2xl cursor-nwse-resize z-[100] hover:scale-110 active:scale-95 transition-transform"
                                        >
                                            <ArrowUpRight size={18} strokeWidth={3} />
                                        </motion.div>
                                        <div className="absolute -top-4 -left-4 w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-[11px] font-black italic shadow-2xl border-2 border-white z-[60]">
                                            {block.name.charAt(block.name.length - 1)}
                                        </div>
                                        <div className="absolute -bottom-4 -left-4 flex gap-2 z-[110]">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setPreviewBlockId(block.id); }}
                                                className="w-10 h-10 bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-2xl border-2 border-white hover:scale-110 active:scale-95 transition-transform"
                                                title="Full Screen Preview"
                                            >
                                                <Maximize2 size={16} />
                                            </button>
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
                                            className="absolute -top-4 -right-4 w-10 h-10 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-2xl border-2 border-white z-[60] hover:scale-110 active:scale-95 transition-transform"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* HORIZONTAL MULTI-CONTROL PANEL */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* 1. SECTION LIST & STATUS */}
                <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4 text-slate-900">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                                <Layers size={24} />
                            </div>
                            <div>
                                <h4 className="text-[12px] font-black uppercase tracking-widest leading-none">Mapped Sections</h4>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">{blocks.length} Total Layers</p>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-4 custom-scrollbar">
                        {blocks.map((block, idx) => (
                            <button 
                                key={block.id} 
                                onClick={() => setSelectedBlockId(block.id)}
                                className={`group flex items-center gap-5 p-5 rounded-[2.5rem] border-2 transition-all ${
                                    selectedBlockId === block.id 
                                    ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-[1.02]' 
                                    : 'bg-slate-50 border-transparent text-slate-600 hover:border-slate-200'
                                }`}
                            >
                                <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-[12px] italic shadow-inner" style={{ backgroundColor: selectedBlockId === block.id ? 'rgba(255,255,255,0.1)' : `${block.color}15`, color: selectedBlockId === block.id ? 'white' : block.color }}>
                                    {String.fromCharCode(65 + idx)}
                                </div>
                                <div className="text-left flex-1">
                                    <p className="text-[11px] font-black uppercase tracking-tighter italic leading-none truncate">{block.name}</p>
                                    <p className={`text-[8px] font-black uppercase tracking-widest mt-1 ${selectedBlockId === block.id ? 'text-white/40' : 'text-slate-400'}`}>{block.category}</p>
                                </div>
                                {selectedBlockId === block.id && <ChevronRight size={14} className="text-pink-500" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. CONFIGURATION ENGINE */}
                <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)]">
                    <AnimatePresence mode="wait">
                        {selectedBlock ? (
                            <motion.div 
                                key="config"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col gap-10"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white">
                                            <Settings2 size={24} />
                                        </div>
                                        <div className="text-left">
                                            <h4 className="text-[12px] font-black text-slate-900 uppercase italic tracking-tighter leading-none">{selectedBlock.name}</h4>
                                            <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest mt-1 italic">{selectedBlock.category}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => updateBlock(selectedBlock.id, { rotation: (selectedBlock.rotation || 0) + 45 })} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-pink-500 transition-all" title="Rotate"><RotateCw size={18} /></button>
                                        <button onClick={() => setPreviewBlockId(selectedBlock.id)} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-indigo-500 transition-all" title="Full Screen Preview"><Maximize2 size={18} /></button>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-3">Section Name</label>
                                        <input 
                                            type="text" 
                                            value={selectedBlock.name} 
                                            onChange={e => updateBlock(selectedBlock.id, { name: e.target.value })} 
                                            className="w-full bg-slate-50 text-[13px] font-black text-slate-900 px-6 py-4 rounded-[2rem] border border-transparent outline-none focus:bg-white focus:ring-2 focus:ring-pink-500/20 shadow-inner"
                                            placeholder="e.g. Premium West"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-3">Price Category</label>
                                        
                                        <div className="relative">
                                            <button 
                                                onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                                                className="w-full bg-slate-50 text-[11px] font-black text-slate-900 px-8 py-5 rounded-[2rem] border-2 border-transparent focus:border-pink-500/20 shadow-inner flex items-center justify-between group transition-all"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: selectedBlock.color || THEME_PINK }} />
                                                    <span className="uppercase tracking-widest">{selectedBlock.category} (₹{categories.find(c => c.name === selectedBlock.category)?.basePrice || 0})</span>
                                                </div>
                                                <ChevronDown size={18} className={`text-slate-400 transition-transform duration-500 ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
                                            </button>

                                            <AnimatePresence>
                                                {categoryDropdownOpen && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        className="absolute top-full left-0 right-0 mt-4 bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_30px_60px_rgba(0,0,0,0.15)] z-[200] overflow-hidden"
                                                    >
                                                        <div className="max-h-[350px] overflow-y-auto p-3 custom-scrollbar">
                                                            {/* EXISTING CATEGORIES */}
                                                            {categories.length > 0 && (
                                                                <div className="px-5 py-3 text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">Active Tiers</div>
                                                            )}
                                                            {categories.map(cat => (
                                                                <button
                                                                    key={cat.name}
                                                                    onClick={() => {
                                                                        updateBlock(selectedBlock.id, { 
                                                                            category: cat.name,
                                                                            color: cat.color || THEME_PINK
                                                                        });
                                                                        setCategoryDropdownOpen(false);
                                                                    }}
                                                                    className="w-full flex items-center justify-between p-5 rounded-2xl hover:bg-slate-50 transition-all text-left group"
                                                                >
                                                                    <div className="flex items-center gap-5">
                                                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black italic shadow-inner" style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>
                                                                            {cat.name.charAt(0)}
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest leading-none">{cat.name}</p>
                                                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Total {cat.totalSlots || 0} Slots</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-[12px] font-black text-slate-900 italic tracking-tighter">₹{cat.basePrice || 0}</p>
                                                                        {selectedBlock.category === cat.name && <div className="w-1.5 h-1.5 rounded-full bg-pink-500 ml-auto mt-1" />}
                                                                    </div>
                                                                </button>
                                                            ))}

                                                            {/* SUGGESTED PRESETS */}
                                                            <div className="px-5 py-3 mt-2 text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] border-t border-slate-50">Quick Add Tiers</div>
                                                            {[
                                                                { name: 'VIP', color: '#8b5cf6', icon: 'V' },
                                                                { name: 'Platinum', color: '#ec4899', icon: 'P' },
                                                                { name: 'Gold', color: '#f59e0b', icon: 'G' },
                                                                { name: 'Silver', color: '#94a3b8', icon: 'S' },
                                                                { name: 'Bronze', color: '#b45309', icon: 'B' }
                                                            ].filter(p => !categories.find(c => c.name === p.name)).map(preset => (
                                                                <button
                                                                    key={preset.name}
                                                                    onClick={() => {
                                                                        setPostEvent(prev => ({
                                                                            ...prev,
                                                                            categories: [...(prev.categories || []), {
                                                                                name: preset.name,
                                                                                basePrice: 0,
                                                                                totalSlots: 0,
                                                                                color: preset.color
                                                                            }]
                                                                        }));
                                                                        updateBlock(selectedBlock.id, { 
                                                                            category: preset.name,
                                                                            color: preset.color
                                                                        });
                                                                        setCategoryDropdownOpen(false);
                                                                    }}
                                                                    className="w-full flex items-center justify-between p-5 rounded-2xl hover:bg-indigo-50/50 transition-all text-left group"
                                                                >
                                                                    <div className="flex items-center gap-5">
                                                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black italic bg-white border border-slate-100 text-slate-400 group-hover:border-indigo-200 group-hover:text-indigo-500">
                                                                            {preset.icon}
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[11px] font-black text-slate-400 group-hover:text-indigo-600 transition-colors uppercase tracking-widest leading-none">{preset.name}</p>
                                                                            <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1 italic">Click to Add Section</p>
                                                                        </div>
                                                                    </div>
                                                                    <Plus size={14} className="text-slate-300 group-hover:text-indigo-500" />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-3">Grid Rows</label>
                                        <input type="number" value={selectedBlock.rows} onChange={e => updateBlock(selectedBlock.id, { rows: parseInt(e.target.value) || 1 })} className="w-full bg-slate-50 text-[13px] font-black text-slate-900 px-6 py-4 rounded-[2rem] border border-transparent outline-none focus:bg-white focus:ring-2 focus:ring-pink-500/20 shadow-inner" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-3">Grid Columns</label>
                                        <input type="number" value={selectedBlock.cols} onChange={e => updateBlock(selectedBlock.id, { cols: parseInt(e.target.value) || 1 })} className="w-full bg-slate-50 text-[13px] font-black text-slate-900 px-6 py-4 rounded-[2rem] border border-transparent outline-none focus:bg-white focus:ring-2 focus:ring-pink-500/20 shadow-inner" />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                    <div className="text-left">
                                        <p className="text-[24px] font-black text-slate-900 italic tracking-tighter leading-none">{selectedBlock.rows * selectedBlock.cols}</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Total Mapped Units</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <button onClick={() => duplicateBlock(selectedBlock.id)} className="p-4 bg-indigo-50 text-indigo-500 rounded-2xl hover:bg-indigo-500 hover:text-white transition-all shadow-sm">
                                            <Copy size={20} />
                                        </button>
                                        <button onClick={() => removeBlock(selectedBlock.id)} className="px-10 py-4 bg-red-50 text-red-500 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-10">
                                <MousePointer2 size={48} strokeWidth={1} className="text-slate-900 mb-6" />
                                <p className="text-[12px] font-black uppercase tracking-widest text-slate-900">Select Section to Edit</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* SYSTEM ANALYTICS BAR */}
            <div className="px-16 py-12 bg-slate-950 rounded-[4.5rem] border border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.4)] flex flex-wrap items-center justify-between gap-16">
                <div className="flex items-center gap-16">
                    <div className="flex items-center gap-6">
                        <div className="w-4 h-4 rounded-full bg-pink-500 shadow-[0_0_30px_#ec4899] animate-pulse" />
                        <div>
                            <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Architecture Sync</p>
                            <p className="text-[13px] font-black text-white uppercase italic tracking-tighter">Live Spatial Engine Active</p>
                        </div>
                    </div>
                    <div className="h-12 w-px bg-white/5" />
                    <div className="flex items-center gap-12">
                        <div>
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Mapped Layers</p>
                            <p className="text-4xl font-black text-white tracking-tighter italic leading-none">{blocks.length}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Total Capacity</p>
                            <p className="text-4xl font-black text-pink-500 tracking-tighter italic leading-none">{blocks.reduce((s, b) => s + (b.rows * b.cols), 0)}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <button 
                        onClick={syncCategories}
                        className="flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-slate-800 to-slate-900 text-white/70 hover:text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest transition-all border border-white/5 shadow-2xl hover:scale-105 active:scale-95"
                    >
                        <RefreshCcw size={18} className="text-pink-500 animate-spin-slow" /> Sync Inventory
                    </button>
                    <button className="flex items-center gap-4 px-16 py-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest shadow-[0_20px_50px_rgba(236,72,153,0.4)] hover:scale-105 active:scale-95 transition-all">
                        <Check size={22} strokeWidth={3} /> Finalize Architecture
                    </button>
                </div>
            </div>

            {/* INVENTORY LOG MODAL */}
            <AnimatePresence>
                {showInventory && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-slate-950/98 backdrop-blur-3xl flex items-center justify-center p-10 md:p-32">
                        <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-4xl bg-white rounded-[4rem] shadow-2xl overflow-hidden flex flex-col max-h-full">
                            <div className="p-12 border-b border-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-3xl bg-pink-500 text-white flex items-center justify-center shadow-2xl">
                                        <Layout size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Spatial Inventory</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 italic">Live Capacity Breakdown</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowInventory(false)} className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="text-left pb-6 text-[10px] font-black text-slate-300 uppercase tracking-widest">Section</th>
                                            <th className="text-left pb-6 text-[10px] font-black text-slate-300 uppercase tracking-widest">Category</th>
                                            <th className="text-right pb-6 text-[10px] font-black text-slate-300 uppercase tracking-widest">Grid</th>
                                            <th className="text-right pb-6 text-[10px] font-black text-slate-300 uppercase tracking-widest">Units</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {blocks.map((block) => (
                                            <tr key={block.id} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black italic shadow-inner" style={{ backgroundColor: `${block.color}15`, color: block.color }}>
                                                            {block.name.charAt(0)}
                                                        </div>
                                                        <span className="text-[13px] font-black text-slate-900 uppercase italic">{block.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-6">
                                                    <span className="px-4 py-1.5 bg-slate-100 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-widest">{block.category}</span>
                                                </td>
                                                <td className="py-6 text-right font-black text-slate-400 text-[11px] italic tracking-tight">{block.rows} × {block.cols}</td>
                                                <td className="py-6 text-right">
                                                    <span className="text-[14px] font-[900] text-slate-900 italic tracking-tighter">{block.rows * block.cols}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {previewBlock && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="fixed inset-0 z-[9999] bg-slate-950/98 backdrop-blur-3xl flex items-center justify-center p-10 md:p-32"
                    >
                        <motion.div initial={{ scale: 0.95, y: 50 }} animate={{ scale: 1, y: 0 }} className="w-full h-full max-w-6xl bg-white rounded-[5rem] shadow-2xl overflow-hidden flex flex-col relative">
                            <div className="absolute top-10 right-10 z-10">
                                <button onClick={() => setPreviewBlockId(null)} className="w-20 h-20 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform">
                                    <X size={32} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-auto p-12 flex flex-col items-center justify-center">
                                <div className="mb-10 text-center w-full">
                                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-pink-50 text-pink-500 shadow-lg mb-4">
                                        <Maximize2 size={24} />
                                    </div>
                                    <h3 className="text-5xl font-black text-slate-950 uppercase italic tracking-tighter leading-tight mb-2">
                                        {previewBlock.name}
                                    </h3>
                                    <div className="h-1.5 w-32 bg-gradient-to-r from-pink-500 to-purple-600 mx-auto rounded-full mb-4" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic">
                                        {previewBlock.category} SECTION • {previewBlock.rows * previewBlock.cols} UNITS
                                    </p>
                                </div>

                                <div className="flex gap-6">
                                    <div className="flex flex-col gap-2">
                                        {Array.from({ length: previewBlock.rows }).map((_, rIdx) => (
                                            <div key={rIdx} className="w-9 h-9 flex items-center justify-center text-[11px] font-black text-slate-300 italic">
                                                {String.fromCharCode(65 + rIdx)}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {Array.from({ length: previewBlock.rows }).map((_, rIdx) => (
                                            <div key={rIdx} className="flex gap-2">
                                                {Array.from({ length: previewBlock.cols }).map((_, cIdx) => (
                                                    <div key={cIdx} className="w-9 h-9 rounded-xl bg-white border-2 border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 shadow-[0_4px_10px_rgba(0,0,0,0.03)] hover:border-pink-500 hover:text-pink-500 transition-all">
                                                        {cIdx + 1}
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* STAGE INDICATOR */}
                                <div className="mt-20 w-full max-w-2xl py-6 border-t border-slate-100 text-center relative overflow-hidden">
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-4 bg-gradient-to-b from-slate-50 to-transparent opacity-50" />
                                    <p className="text-[11px] font-black text-slate-200 uppercase tracking-[0.8em]">All eyes this way</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
