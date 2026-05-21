"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { 
    Settings, Plus, Save, Layout, Building2, Armchair, 
    MousePointer2, Eraser, Ticket, IndianRupee, Columns, Rows, Trash2, Edit2
} from 'lucide-react';
import CustomSelect from './CustomSelect';

const THEATRE_SEAT_TYPES = {
    vip: { label: 'VIP', color: '#c084fc', textColor: '#6b21a8' },
    platinum: { label: 'Platinum', color: '#94a3b8', textColor: '#334155' },
    gold: { label: 'Gold', color: '#fbbf24', textColor: '#b45309' },
    silver: { label: 'Silver', color: '#cbd5e1', textColor: '#475569' },
    bronze: { label: 'Bronze', color: '#d97706', textColor: '#78350f' },
    general: { label: 'General', color: '#60a5fa', textColor: '#1e3a8a' },
    balcony: { label: 'Balcony', color: '#2dd4bf', textColor: '#134e4a' },
    box: { label: 'Box', color: '#818cf8', textColor: '#3730a3' },
    blocked: { label: 'Blocked', color: '#ef4444', textColor: '#ffffff' }
};

export default function BlockMapDesigner({ postEvent, setPostEvent }) {
    const [layoutConfig, setLayoutConfig] = useState(postEvent.layoutConfig || {
        layoutName: 'Main Layout',
        venueType: 'Theatre',
        screenLabel: 'STAGE / SCREEN'
    });

    const [sections, setSections] = useState(postEvent.seatingSections || []);
    const [boxes, setBoxes] = useState(postEvent.seatingBoxes || []);
    
    const [activeSectionId, setActiveSectionId] = useState(null);
    const [activeTool, setActiveTool] = useState('select'); // select, toggle-blocked, make-aisle

    // Sync state up
    useEffect(() => {
        setPostEvent(prev => ({
            ...prev,
            layoutConfig,
            seatingSections: sections,
            seatingBoxes: boxes,
            blocks: [] // clear old blocks
        }));
    }, [layoutConfig, sections, boxes, setPostEvent]);

    // Generator UI State
    const [genSectionName, setGenSectionName] = useState('');
    const [genBasePrice, setGenBasePrice] = useState(250);
    const [genSeatType, setGenSeatType] = useState('general');
    const [genStartRow, setGenStartRow] = useState('A');
    const [genEndRow, setGenEndRow] = useState('J');
    const [genSeatsPerRow, setGenSeatsPerRow] = useState(20);

    const [boxName, setBoxName] = useState('');
    const [boxSeats, setBoxSeats] = useState(6);
    const [boxPrice, setBoxPrice] = useState(1200);

    const handleGenerateSection = () => {
        if (!genSectionName || !genStartRow || !genEndRow) return;

        const startCharCode = genStartRow.charCodeAt(0);
        const endCharCode = genEndRow.charCodeAt(0);
        
        let newSeats = [];
        for (let r = startCharCode; r <= endCharCode; r++) {
            const rowLabel = String.fromCharCode(r);
            for (let s = 1; s <= genSeatsPerRow; s++) {
                newSeats.push({
                    id: `seat-${Date.now()}-${rowLabel}${s}`,
                    rowLabel: rowLabel,
                    seatNumber: s,
                    seatLabel: `${rowLabel}${s}`,
                    seatType: genSeatType,
                    status: 'available',
                    isAisle: false
                });
            }
        }

        const newSection = {
            id: `sec-${Date.now()}`,
            name: genSectionName,
            basePrice: genBasePrice,
            seats: newSeats,
            rows: endCharCode - startCharCode + 1,
            cols: genSeatsPerRow
        };

        setSections([...sections, newSection]);
        setActiveSectionId(newSection.id);
        
        // Reset generator
        setGenSectionName('');
        setGenStartRow('A');
        setGenEndRow('J');
        setGenSeatsPerRow(20);
    };

    const handleCreateBox = () => {
        if (!boxName) return;
        
        const newBox = {
            id: `box-${Date.now()}`,
            name: boxName,
            seatCount: boxSeats,
            price: boxPrice,
            type: 'VIP'
        };
        
        setBoxes([...boxes, newBox]);
        setBoxName('');
        setBoxSeats(6);
        setBoxPrice(1200);
    };

    const handleSeatClick = (sectionId, seatId) => {
        if (activeTool === 'select') return;

        setSections(sections.map(sec => {
            if (sec.id !== sectionId) return sec;
            return {
                ...sec,
                seats: sec.seats.map(s => {
                    if (s.id !== seatId) return s;
                    
                    if (activeTool === 'toggle-blocked') {
                        return { ...s, status: s.status === 'blocked' ? 'available' : 'blocked' };
                    }
                    if (activeTool === 'make-aisle') {
                        return { ...s, isAisle: !s.isAisle };
                    }
                    return s;
                })
            };
        }));
    };

    const deleteSection = (sectionId) => {
        setSections(sections.filter(s => s.id !== sectionId));
        if (activeSectionId === sectionId) setActiveSectionId(null);
    };

    const deleteBox = (boxId) => {
        setBoxes(boxes.filter(b => b.id !== boxId));
    };

    const totalCapacity = useMemo(() => {
        let capacity = 0;
        sections.forEach(sec => {
            capacity += sec.seats.filter(s => !s.isAisle && s.status !== 'blocked').length;
        });
        boxes.forEach(box => {
            capacity += box.seatCount;
        });
        return capacity;
    }, [sections, boxes]);

    const activeSection = sections.find(s => s.id === activeSectionId);

    return (
        <div className="flex flex-col gap-8 font-sans">
            {/* HEADER */}
            <div className="flex items-center gap-4 px-10 py-8 bg-slate-900 rounded-[2.5rem] border border-white/5 shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white">
                    <Layout size={32} />
                </div>
                <div>
                    <h2 className="text-3xl font-[900] text-white uppercase tracking-tighter italic leading-none">Theatre Seat Builder</h2>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mt-2 italic">Manual Generation Engine V2</p>
                </div>
            </div>

            {/* MAIN CANVAS - LANDSCAPE */}
            <div className="w-full h-[400px] flex flex-col relative overflow-hidden bg-slate-100 rounded-[3rem] border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
                {/* Top Toolbar */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-2 py-1.5 rounded-full shadow-lg border border-slate-100 flex items-center gap-1 z-10">
                    <button onClick={() => setActiveTool('select')} className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTool === 'select' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}>
                        <MousePointer2 size={12} /> Select
                    </button>
                    <button onClick={() => setActiveTool('toggle-blocked')} className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTool === 'toggle-blocked' ? 'bg-red-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}>
                        <Ticket size={12} /> Block
                    </button>
                    <button onClick={() => setActiveTool('make-aisle')} className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTool === 'make-aisle' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}>
                        <Columns size={12} /> Aisle
                    </button>
                </div>

                {/* Canvas Scroll Area */}
                <div className="flex-1 overflow-auto p-12 pt-24 flex flex-col items-center">
                    {/* Screen Indicator */}
                    <div className="w-[600px] h-12 bg-gradient-to-b from-slate-800 to-slate-700 rounded-b-[2.5rem] shadow-2xl flex items-center justify-center mb-20 relative">
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white/10 to-transparent rounded-b-[2.5rem]"></div>
                        <span className="text-white text-[11px] font-black tracking-[0.6em] uppercase">{layoutConfig.screenLabel}</span>
                    </div>

                    {sections.length === 0 && boxes.length === 0 ? (
                        <div className="text-slate-400 font-medium text-xs tracking-widest uppercase mt-20 flex flex-col items-center gap-4">
                            <Layout size={48} className="opacity-20" />
                            Canvas is empty. Use the builder panel below.
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-16 pb-32">
                            {/* Render Sections */}
                            {sections.map(section => {
                                // Group seats by row
                                const rowsMap = section.seats.reduce((acc, seat) => {
                                    if (!acc[seat.rowLabel]) acc[seat.rowLabel] = [];
                                    acc[seat.rowLabel].push(seat);
                                    return acc;
                                }, {});

                                return (
                                    <div 
                                        key={section.id} 
                                        className={`p-10 rounded-[2.5rem] transition-all relative group cursor-pointer ${activeSectionId === section.id ? 'bg-white shadow-2xl ring-2 ring-pink-500' : 'bg-white/60 hover:bg-white/90 border border-slate-200 shadow-sm'}`}
                                        onClick={() => setActiveSectionId(section.id)}
                                    >
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white px-6 py-2 rounded-full border border-slate-100 shadow-sm text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            {section.name} (₹{section.basePrice})
                                        </div>
                                        
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }}
                                            className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-2 shadow-sm"
                                        >
                                            <Trash2 size={14} />
                                        </button>

                                        <div className="mt-4 flex flex-col gap-2">
                                            {Object.entries(rowsMap).map(([rowLabel, rowSeats]) => (
                                                <div key={rowLabel} className="flex items-center gap-4">
                                                    <div className="w-6 font-black text-[10px] text-slate-400 text-center">{rowLabel}</div>
                                                    <div className="flex gap-2">
                                                        {rowSeats.map(seat => {
                                                            if (seat.isAisle) {
                                                                return (
                                                                    <div key={seat.id} onClick={(e) => { e.stopPropagation(); handleSeatClick(section.id, seat.id); }} className="w-8 h-8 rounded-lg cursor-crosshair border-2 border-dashed border-slate-300 hover:bg-slate-200 transition-colors flex items-center justify-center">
                                                                        <span className="text-[7px] opacity-0 hover:opacity-100 font-bold text-slate-400">GAP</span>
                                                                    </div>
                                                                );
                                                            }

                                                            const theme = THEATRE_SEAT_TYPES[seat.status === 'blocked' ? 'blocked' : seat.seatType] || THEATRE_SEAT_TYPES.standard;
                                                            
                                                            return (
                                                                <div 
                                                                    key={seat.id} 
                                                                    onClick={(e) => { e.stopPropagation(); handleSeatClick(section.id, seat.id); }}
                                                                    className="w-8 h-8 rounded-t-lg rounded-b-[3px] flex items-center justify-center text-[9px] font-black cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md"
                                                                    style={{ backgroundColor: theme.color, color: theme.textColor }}
                                                                    title={`${seat.seatLabel} - ₹${section.basePrice}`}
                                                                >
                                                                    {seat.seatNumber}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    <div className="w-6 font-black text-[10px] text-slate-400 text-center">{rowLabel}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Render Boxes */}
                            {boxes.length > 0 && (
                                <div className="flex flex-wrap justify-center gap-8 w-full max-w-5xl mt-8">
                                    {boxes.map(box => (
                                        <div key={box.id} className="bg-gradient-to-br from-purple-900 to-slate-900 rounded-[2.5rem] p-8 shadow-2xl relative border border-purple-500/30 group min-w-[250px]">
                                            <button 
                                                onClick={() => deleteBox(box.id)}
                                                className="absolute top-6 right-6 text-purple-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <h4 className="text-white font-black tracking-widest uppercase text-sm mb-1">{box.name}</h4>
                                            <p className="text-purple-300 text-[11px] font-bold mb-6">₹{box.price} / seat • {box.seatCount} Seats</p>
                                            
                                            <div className="flex flex-wrap gap-3">
                                                {Array.from({length: box.seatCount}).map((_, i) => (
                                                    <div key={i} className="w-10 h-10 rounded-t-xl rounded-b-md bg-purple-500 flex items-center justify-center text-white text-[10px] font-black shadow-inner border-t border-purple-400 hover:-translate-y-1 transition-transform">
                                                        B{i+1}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* BOTTOM PANELS: CONTROLS & PROPERTIES */}
            <div className="flex flex-col gap-8">
                
                {/* BUILDER CONTROLS */}
                <div className="w-full bg-white rounded-[3rem] border border-slate-200 shadow-[0_10px_40px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-sm font-black tracking-widest uppercase flex items-center gap-3 text-slate-900">
                            <Settings className="text-pink-500" size={18} /> Configuration Tools
                        </h2>
                    </div>

                    <div className="p-8 flex flex-col gap-10">
                        {/* Basic Layout (Horizontal Landscape) */}
                        <div className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-200/50">
                            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2"><Building2 size={14} /> Basic Layout</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Layout Name</label>
                                    <input type="text" value={layoutConfig.layoutName} onChange={e => setLayoutConfig({...layoutConfig, layoutName: e.target.value})} className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-400/10 transition-all" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Venue Type</label>
                                    <CustomSelect 
                                        value={layoutConfig.venueType} 
                                        onChange={v => setLayoutConfig({...layoutConfig, venueType: v})}
                                        options={['Theatre', 'Cinema', 'Auditorium', 'Concert']}
                                        searchable={false}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Screen Label</label>
                                    <input type="text" value={layoutConfig.screenLabel} onChange={e => setLayoutConfig({...layoutConfig, screenLabel: e.target.value})} className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-400/10 transition-all" />
                                </div>
                            </div>
                        </div>

                        {/* Section Generator (Primary Action - Landscape) */}
                        <div className="bg-pink-50/50 p-8 rounded-[2.5rem] border border-pink-100/50">
                            <h3 className="text-[11px] font-black text-pink-600 uppercase tracking-widest mb-6 flex items-center gap-2"><Rows size={14} /> Section Generator</h3>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Section Name</label>
                                        <CustomSelect 
                                            value={genSectionName}
                                            onChange={v => setGenSectionName(v)}
                                            options={['VIP', 'Platinum', 'Gold', 'Silver', 'Bronze', 'Balcony', 'General', 'Box', 'Front Row']}
                                            placeholder="Select seating category..."
                                            searchable={true}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Seat Type</label>
                                        <CustomSelect 
                                            value={genSeatType} 
                                            onChange={v => setGenSeatType(v)}
                                            options={[
                                                { label: 'VIP', value: 'vip' },
                                                { label: 'Platinum', value: 'platinum' },
                                                { label: 'Gold', value: 'gold' },
                                                { label: 'Silver', value: 'silver' },
                                                { label: 'Bronze', value: 'bronze' },
                                                { label: 'General', value: 'general' },
                                                { label: 'Balcony', value: 'balcony' },
                                                { label: 'Box', value: 'box' }
                                            ]}
                                            searchable={false}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-5 gap-6 items-end">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Start Row</label>
                                        <input type="text" maxLength={1} value={genStartRow} onChange={e => setGenStartRow(e.target.value.toUpperCase())} className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 text-center focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition-all" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">End Row</label>
                                        <input type="text" maxLength={1} value={genEndRow} onChange={e => setGenEndRow(e.target.value.toUpperCase())} className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 text-center focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition-all" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Seats/Row</label>
                                        <input type="number" min="1" max="100" value={genSeatsPerRow} onChange={e => setGenSeatsPerRow(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 text-center focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition-all" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Base Price (₹)</label>
                                        <input type="number" value={genBasePrice} onChange={e => setGenBasePrice(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition-all" />
                                    </div>
                                    <div className="md:col-span-1 col-span-2">
                                        <button onClick={handleGenerateSection} disabled={!genSectionName} className="w-full h-[52px] bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-500/30">
                                            <Plus size={16} /> Generate
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Box Seating Builder (Landscape) */}
                        <div className="bg-purple-50/50 p-8 rounded-[2.5rem] border border-purple-100/50">
                            <h3 className="text-[11px] font-black text-purple-600 uppercase tracking-widest mb-6 flex items-center gap-2"><Armchair size={14} /> Create Box Seating</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Box Name</label>
                                    <input type="text" placeholder="e.g. VIP BOX A" value={boxName} onChange={e => setBoxName(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Seats</label>
                                    <input type="number" value={boxSeats} onChange={e => setBoxSeats(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Price/Seat (₹)</label>
                                    <input type="number" value={boxPrice} onChange={e => setBoxPrice(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all" />
                                </div>
                                <div>
                                    <button onClick={handleCreateBox} disabled={!boxName} className="w-full h-[52px] bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30">
                                        <Plus size={16} /> Add Box
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* PROPERTIES PANEL */}
                <div className="w-full bg-white rounded-[3rem] border border-slate-200 shadow-[0_10px_40px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-sm font-black tracking-widest uppercase flex items-center gap-3 text-slate-900">
                            <Settings size={18} className="text-slate-400" /> Layout Properties & Active Editing
                        </h2>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-10">
                        {/* Event Stats */}
                        <div className="bg-emerald-50/50 p-8 rounded-[2.5rem] border border-emerald-100 flex flex-col justify-center">
                            <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Total Capacity</div>
                            <div className="text-5xl font-black text-emerald-900 italic tracking-tighter">{totalCapacity}</div>
                            <div className="text-[11px] font-bold text-emerald-700 mt-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Available Seats
                            </div>
                        </div>

                        {/* Legends */}
                        <div className="p-4">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">Seat Types Legend</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {Object.entries(THEATRE_SEAT_TYPES).map(([key, type]) => (
                                    <div key={key} className="flex items-center gap-4">
                                        <div className="w-6 h-6 rounded-t-lg rounded-b-[3px] border shadow-sm" style={{ backgroundColor: type.color, borderColor: 'rgba(0,0,0,0.1)' }}></div>
                                        <span className="text-sm font-bold text-slate-600">{type.label}</span>
                                    </div>
                                ))}
                                <div className="flex items-center gap-4">
                                    <div className="w-6 h-6 rounded-md border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-300"><Columns size={12} /></div>
                                    <span className="text-sm font-bold text-slate-600">Aisle / Walkway</span>
                                </div>
                            </div>
                        </div>

                        {/* Active Section Info */}
                        <div className="p-4 border-l border-slate-100">
                            {activeSection ? (
                                <div>
                                    <h3 className="text-[10px] font-black text-pink-500 uppercase tracking-widest mb-5 flex items-center gap-2">
                                        <Edit2 size={14} /> Editing: {activeSection.name}
                                    </h3>
                                    <div className="space-y-5">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Section Name</label>
                                            <input 
                                                type="text" 
                                                value={activeSection.name} 
                                                onChange={e => {
                                                    setSections(sections.map(s => s.id === activeSection.id ? {...s, name: e.target.value} : s));
                                                }}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-pink-500 transition-all" 
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Base Price (₹)</label>
                                            <input 
                                                type="number" 
                                                value={activeSection.basePrice} 
                                                onChange={e => {
                                                    setSections(sections.map(s => s.id === activeSection.id ? {...s, basePrice: Number(e.target.value)} : s));
                                                }}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-pink-500 transition-all" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50 space-y-3">
                                    <MousePointer2 size={32} />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-center">Click a section<br/>on the canvas to edit</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
