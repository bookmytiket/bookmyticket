"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { CloudUpload, Plus, Trash2, Edit2, Check, Move, Maximize2, X } from "lucide-react";

export default function BlockMapDesigner({ postEvent, setPostEvent }) {
    const containerRef = useRef(null);
    const [selectedBlockId, setSelectedBlockId] = useState(null);
    
    // Ensure blocks array exists
    const blocks = postEvent.blocks || [];
    const categories = postEvent.categories || [];

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
        const defaultCategory = categories[0] || { name: "General", color: "#22c55e" };
        const newBlock = {
            id: `block_${Date.now()}`,
            name: `Block ${String.fromCharCode(65 + blocks.length)}`, // Block A, Block B
            x: 10, // percentages
            y: 10,
            width: 15,
            height: 15,
            rows: 5,
            cols: 10,
            category: defaultCategory.name,
            color: defaultCategory.color || "#3b82f6",
            rowNaming: 'alphabetic',
            startNumber: 1,
            numberingDirection: 'ltr'
        };
        setPostEvent(prev => ({ ...prev, blocks: [...(prev.blocks || []), newBlock] }));
        setSelectedBlockId(newBlock.id);
    };

    const updateBlock = (id, updates) => {
        setPostEvent(prev => ({
            ...prev,
            blocks: prev.blocks.map(b => b.id === id ? { ...b, ...updates } : b)
        }));
    };

    const removeBlock = (id) => {
        setPostEvent(prev => ({
            ...prev,
            blocks: prev.blocks.filter(b => b.id !== id)
        }));
        if (selectedBlockId === id) setSelectedBlockId(null);
    };

    const handleDragEnd = (e, info, block) => {
        if (!containerRef.current) return;
        const bounds = containerRef.current.getBoundingClientRect();
        
        // Calculate new X/Y in percentages based on the drag translation
        // Actually, frame-motion's drag updates transform directly.
        // To save it permanently as percentage left/top:
        const blockEl = document.getElementById(`block-el-${block.id}`);
        if (!blockEl) return;
        
        const blockBounds = blockEl.getBoundingClientRect();
        const newLeftPx = blockBounds.left - bounds.left;
        const newTopPx = blockBounds.top - bounds.top;
        
        let newX = (newLeftPx / bounds.width) * 100;
        let newY = (newTopPx / bounds.height) * 100;

        // clamps
        newX = Math.max(0, Math.min(newX, 100 - block.width));
        newY = Math.max(0, Math.min(newY, 100 - block.height));

        updateBlock(block.id, { x: newX, y: newY });
    };

    const selectedBlock = blocks.find(b => b.id === selectedBlockId);

    return (
        <div className="flex flex-col gap-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6">
                
                {/* Tools Panel */}
                <div className="w-full md:w-80 flex flex-col gap-6 border-r border-slate-100 pr-0 md:pr-6">
                    <div>
                        <p className="text-[11px] font-black tracking-widest text-slate-900 uppercase mb-3">Background Map</p>
                        {!postEvent.seatMapBackgroundUrl ? (
                            <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors group text-center px-4">
                                <CloudUpload size={24} className="text-slate-400 group-hover:text-pink-500 mb-2 transition-colors" />
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Upload Stadium/Ground</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            </label>
                        ) : (
                            <div className="relative h-32 rounded-2xl overflow-hidden border border-slate-200 group">
                                <img src={postEvent.seatMapBackgroundUrl} alt="Map" className="w-full h-full object-cover opacity-80" />
                                <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm">Change Image</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                </label>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-slate-100 pt-6">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[11px] font-black tracking-widest text-slate-900 uppercase">Seating Blocks</p>
                            <button onClick={addBlock} disabled={!postEvent.seatMapBackgroundUrl} className="text-[10px] font-bold text-pink-600 bg-pink-50 hover:bg-pink-100 px-3 py-1.5 rounded-xl uppercase tracking-widest transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed">
                                <Plus size={14} /> Add
                            </button>
                        </div>
                        
                        <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                            {blocks.map(block => (
                                <button 
                                    key={block.id} 
                                    onClick={() => setSelectedBlockId(block.id)}
                                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${selectedBlockId === block.id ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: block.color }} />
                                        <span className="text-xs font-bold text-slate-700">{block.name}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">{block.category}</span>
                                </button>
                            ))}
                            {blocks.length === 0 && (
                                <p className="text-[10px] font-bold text-slate-400 text-center py-4 uppercase tracking-widest border border-dashed border-slate-200 rounded-xl">No blocks added</p>
                            )}
                        </div>
                    </div>

                    {selectedBlock && (
                        <div className="border-t border-slate-100 pt-6   ">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-[11px] font-black tracking-widest text-indigo-600 uppercase">Edit {selectedBlock.name}</p>
                                <button onClick={() => removeBlock(selectedBlock.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1 bg-slate-50 hover:bg-red-50 rounded-lg">
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Block Name</label>
                                    <input value={selectedBlock.name} onChange={e => updateBlock(selectedBlock.id, { name: e.target.value })} className="w-full bg-slate-50 text-xs font-bold text-slate-800 px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-300" />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Category</label>
                                    <select value={selectedBlock.category} onChange={e => {
                                        const cat = categories.find(c => c.name === e.target.value);
                                        updateBlock(selectedBlock.id, { category: e.target.value, color: cat ? cat.color || "#3b82f6" : selectedBlock.color });
                                    }} className="w-full bg-slate-50 text-xs font-bold text-slate-800 px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-300">
                                        {categories.map(c => <option key={c.name} value={c.name}>{c.name} (₹{c.price})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Rows</label>
                                    <input type="number" min="1" value={selectedBlock.rows} onChange={e => updateBlock(selectedBlock.id, { rows: parseInt(e.target.value) || 1 })} className="w-full bg-slate-50 text-xs font-bold text-slate-800 px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-300" />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Cols</label>
                                    <input type="number" min="1" value={selectedBlock.cols} onChange={e => updateBlock(selectedBlock.id, { cols: parseInt(e.target.value) || 1 })} className="w-full bg-slate-50 text-xs font-bold text-slate-800 px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-300" />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Width (%)</label>
                                    <input type="number" value={Math.round(selectedBlock.width)} onChange={e => updateBlock(selectedBlock.id, { width: parseInt(e.target.value) || 10 })} className="w-full bg-slate-50 text-xs font-bold text-slate-800 px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-300" />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Height (%)</label>
                                    <input type="number" value={Math.round(selectedBlock.height)} onChange={e => updateBlock(selectedBlock.id, { height: parseInt(e.target.value) || 10 })} className="w-full bg-slate-50 text-xs font-bold text-slate-800 px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-300" />
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col gap-4">
                                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Seat Numbering</p>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-1">
                                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Row Naming</label>
                                        <select value={selectedBlock.rowNaming || 'alphabetic'} onChange={e => updateBlock(selectedBlock.id, { rowNaming: e.target.value })} className="w-full bg-slate-50 text-[10px] font-bold text-slate-800 px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-300">
                                            <option value="alphabetic">A, B, C...</option>
                                            <option value="numeric">1, 2, 3...</option>
                                        </select>
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Start No.</label>
                                        <input type="number" value={selectedBlock.startNumber || 1} onChange={e => updateBlock(selectedBlock.id, { startNumber: parseInt(e.target.value) || 1 })} className="w-full bg-slate-50 text-[10px] font-bold text-slate-800 px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-300" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Numbering Direction</label>
                                        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                                            {[
                                                { label: 'Left → Right', value: 'ltr' },
                                                { label: 'Right → Left', value: 'rtl' }
                                            ].map(opt => (
                                                <button 
                                                    key={opt.value}
                                                    onClick={() => updateBlock(selectedBlock.id, { numberingDirection: opt.value })}
                                                    className={`flex-1 py-1.5 px-2 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all ${
                                                        (selectedBlock.numberingDirection || 'ltr') === opt.value ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                                    }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Canvas Area */}
                <div className="flex-1 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 relative overflow-hidden flex items-center justify-center min-h-[500px]" ref={containerRef}>
                    {!postEvent.seatMapBackgroundUrl ? (
                        <div className="text-center p-8 max-w-sm">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4">
                                <Maximize2 size={24} className="text-slate-300" />
                            </div>
                            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-2">Empty Canvas</h3>
                            <p className="text-xs font-medium text-slate-400 leading-relaxed">Please upload a stadium or ground layout map image from the left panel to start designing blocks.</p>
                        </div>
                    ) : (
                        <div className="w-full h-full relative">
                            {/* Background Map */}
                            <img src={postEvent.seatMapBackgroundUrl} alt="Seat Map Ground" className="w-full h-full object-contain select-none pointer-events-none" />
                            
                            {/* Draggable Blocks */}
                            {blocks.map(block => {
                                const isSelected = selectedBlockId === block.id;
                                return (
                                    <motion.div
                                        key={block.id}
                                        id={`block-el-${block.id}`}
                                        drag
                                        dragMomentum={false}
                                        dragConstraints={containerRef}
                                        onDragEnd={(e, info) => handleDragEnd(e, info, block)}
                                        onClick={() => setSelectedBlockId(block.id)}
                                        style={{
                                            position: 'absolute',
                                            left: `${block.x}%`,
                                            top: `${block.y}%`,
                                            width: `${block.width}%`,
                                            height: `${block.height}%`,
                                            backgroundColor: `${block.color}CC`, // semi-transparent
                                            // Reset transform added by framer-motion during render to avoid coordinate drift, framer motion handles visually via internal state, but here we force style position.
                                        }}
                                        className={`rounded-lg cursor-grab active:cursor-grabbing border-2 backdrop-blur-[2px] shadow-lg flex flex-col items-center justify-center transition-shadow ${isSelected ? 'border-white ring-4 ring-indigo-500/30' : 'border-transparent hover:border-white/50'}`}
                                        initial={false}
                                    >
                                        <span className="text-white text-[10px] md:text-xs font-black drop-shadow-md px-1 text-center leading-tight">
                                            {block.name}
                                        </span>
                                        <span className="text-white/80 text-[8px] font-bold drop-shadow-md">
                                            {block.rows}x{block.cols}
                                        </span>
                                        
                                        {/* Visualization Grid overlay (just tiny dots to make it look like seats) */}
                                        <div className="absolute inset-1 pointer-events-none opacity-30 flex flex-col justify-between">
                                            {Array.from({ length: Math.min(block.rows, 5) }).map((_, rIdx) => (
                                                <div key={rIdx} className="w-full flex justify-between">
                                                    {Array.from({ length: Math.min(block.cols, 8) }).map((_, cIdx) => (
                                                        <div key={cIdx} className="w-[3px] h-[3px] bg-white rounded-full"></div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
