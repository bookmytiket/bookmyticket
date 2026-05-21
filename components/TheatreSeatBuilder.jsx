"use client";
import React, { useState, useMemo } from 'react';
import { 
    Settings, Plus, Save, Layout, Building2, Armchair, 
    MousePointer2, Eraser, Ticket, IndianRupee, Columns, Rows, Trash2
} from 'lucide-react';

const THEATRE_SEAT_TYPES = {
    standard: { label: 'Standard', color: '#cbd5e1', textColor: '#475569' },
    premium: { label: 'Premium', color: '#fbbf24', textColor: '#b45309' },
    vip: { label: 'VIP', color: '#c084fc', textColor: '#6b21a8' },
    recliner: { label: 'Recliner', color: '#fca5a5', textColor: '#b91c1c' },
    blocked: { label: 'Blocked', color: '#ef4444', textColor: '#ffffff' },
    maintenance: { label: 'Maintenance', color: '#64748b', textColor: '#ffffff' }
};

export default function TheatreSeatBuilder() {
    const [layoutConfig, setLayoutConfig] = useState({
        layoutName: 'Evening Show Layout',
        venueType: 'Theatre',
        screenLabel: 'SCREEN THIS SIDE'
    });

    const [sections, setSections] = useState([]);
    const [activeSectionId, setActiveSectionId] = useState(null);
    const [activeTool, setActiveTool] = useState('select'); // select, toggle-blocked, make-aisle
    const [boxes, setBoxes] = useState([]);

    // Generator UI State
    const [genSectionName, setGenSectionName] = useState('');
    const [genBasePrice, setGenBasePrice] = useState(250);
    const [genSeatType, setGenSeatType] = useState('standard');
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
        <div className="flex h-[85vh] bg-[#f8fafc] rounded-3xl overflow-hidden border border-slate-200 shadow-2xl font-sans">
            
            {/* LEFT: LAYOUT BUILDER PANEL */}
            <div className="w-[380px] bg-white border-r border-slate-200 flex flex-col h-full overflow-y-auto">
                <div className="p-6 border-b border-slate-100 bg-slate-900 text-white">
                    <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                        <Layout className="text-pink-500" size={24} /> Layout Builder
                    </h2>
                    <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-widest">Configuration Tools</p>
                </div>

                <div className="p-6 space-y-8">
                    {/* Event Seating Type */}
                    <div>
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Building2 size={14} /> Basic Layout</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Layout Name</label>
                                <input type="text" value={layoutConfig.layoutName} onChange={e => setLayoutConfig({...layoutConfig, layoutName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-pink-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Venue Type</label>
                                    <select value={layoutConfig.venueType} onChange={e => setLayoutConfig({...layoutConfig, venueType: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-pink-500">
                                        <option>Theatre</option>
                                        <option>Cinema</option>
                                        <option>Auditorium</option>
                                        <option>Concert</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Screen Label</label>
                                    <input type="text" value={layoutConfig.screenLabel} onChange={e => setLayoutConfig({...layoutConfig, screenLabel: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-pink-500" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section Generator */}
                    <div className="bg-pink-50/50 p-4 rounded-2xl border border-pink-100">
                        <h3 className="text-xs font-black text-pink-600 uppercase tracking-widest mb-4 flex items-center gap-2"><Rows size={14} /> Section Generator</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Section Name</label>
                                    <input type="text" placeholder="e.g. VIP, Balcony" value={genSectionName} onChange={e => setGenSectionName(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-pink-500" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Seat Type</label>
                                    <select value={genSeatType} onChange={e => setGenSeatType(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-pink-500">
                                        <option value="standard">Standard</option>
                                        <option value="premium">Premium</option>
                                        <option value="vip">VIP</option>
                                        <option value="recliner">Recliner</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Start Row</label>
                                    <input type="text" maxLength={1} value={genStartRow} onChange={e => setGenStartRow(e.target.value.toUpperCase())} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 text-center" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">End Row</label>
                                    <input type="text" maxLength={1} value={genEndRow} onChange={e => setGenEndRow(e.target.value.toUpperCase())} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 text-center" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Seats/Row</label>
                                    <input type="number" min="1" max="100" value={genSeatsPerRow} onChange={e => setGenSeatsPerRow(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 text-center" />
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Base Price (₹)</label>
                                <input type="number" value={genBasePrice} onChange={e => setGenBasePrice(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800" />
                            </div>

                            <button onClick={handleGenerateSection} disabled={!genSectionName} className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                                <Plus size={16} /> Generate Section
                            </button>
                        </div>
                    </div>

                    {/* Box Seating Builder */}
                    <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
                        <h3 className="text-xs font-black text-purple-600 uppercase tracking-widest mb-4 flex items-center gap-2"><Armchair size={14} /> Create Box Seating</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Box Name</label>
                                <input type="text" placeholder="e.g. VIP BOX A" value={boxName} onChange={e => setBoxName(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Seats</label>
                                    <input type="number" value={boxSeats} onChange={e => setBoxSeats(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Price/Seat (₹)</label>
                                    <input type="number" value={boxPrice} onChange={e => setBoxPrice(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800" />
                                </div>
                            </div>
                            <button onClick={handleCreateBox} disabled={!boxName} className="w-full bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                                <Plus size={16} /> Create Box
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {/* MIDDLE: MAIN CANVAS */}
            <div className="flex-1 flex flex-col relative overflow-hidden bg-[#e2e8f0]">
                {/* Top Toolbar */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white flex items-center gap-2 z-10">
                    <button onClick={() => setActiveTool('select')} className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTool === 'select' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                        <MousePointer2 size={14} /> Select
                    </button>
                    <button onClick={() => setActiveTool('toggle-blocked')} className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTool === 'toggle-blocked' ? 'bg-red-500 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                        <Ticket size={14} /> Block Seats
                    </button>
                    <button onClick={() => setActiveTool('make-aisle')} className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTool === 'make-aisle' ? 'bg-blue-500 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                        <Columns size={14} /> Aisle Builder
                    </button>
                </div>

                {/* Canvas Scroll Area */}
                <div className="flex-1 overflow-auto p-12 flex flex-col items-center">
                    
                    {/* Screen Indicator */}
                    <div className="w-[600px] h-12 bg-gradient-to-b from-slate-800 to-slate-700 rounded-b-[3rem] shadow-2xl flex items-center justify-center mb-16 relative">
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white/10 to-transparent rounded-b-[3rem]"></div>
                        <span className="text-white text-xs font-black tracking-[0.5em] uppercase">{layoutConfig.screenLabel}</span>
                    </div>

                    {sections.length === 0 && boxes.length === 0 ? (
                        <div className="text-slate-400 font-medium text-sm tracking-widest uppercase mt-20 flex flex-col items-center gap-4">
                            <Layout size={48} className="opacity-20" />
                            Canvas is empty. Generate sections or boxes.
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-12 pb-32">
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
                                        className={`p-8 rounded-3xl transition-all relative group ${activeSectionId === section.id ? 'bg-white shadow-xl ring-2 ring-pink-500' : 'bg-white/50 hover:bg-white/80'}`}
                                        onClick={() => setActiveSectionId(section.id)}
                                    >
                                        <div className="absolute top-4 left-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">{section.name} (₹{section.basePrice})</div>
                                        
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }}
                                            className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={16} />
                                        </button>

                                        <div className="mt-6 flex flex-col gap-2">
                                            {Object.entries(rowsMap).map(([rowLabel, rowSeats]) => (
                                                <div key={rowLabel} className="flex items-center gap-4">
                                                    <div className="w-6 font-bold text-xs text-slate-400 text-center">{rowLabel}</div>
                                                    <div className="flex gap-1.5">
                                                        {rowSeats.map(seat => {
                                                            if (seat.isAisle) {
                                                                return (
                                                                    <div key={seat.id} onClick={(e) => { e.stopPropagation(); handleSeatClick(section.id, seat.id); }} className="w-8 h-8 rounded-lg cursor-crosshair border border-dashed border-slate-300 hover:bg-slate-200 transition-colors flex items-center justify-center">
                                                                        <span className="text-[8px] opacity-0 hover:opacity-100">AISLE</span>
                                                                    </div>
                                                                );
                                                            }

                                                            const theme = THEATRE_SEAT_TYPES[seat.status === 'blocked' ? 'blocked' : seat.seatType] || THEATRE_SEAT_TYPES.standard;
                                                            
                                                            return (
                                                                <div 
                                                                    key={seat.id} 
                                                                    onClick={(e) => { e.stopPropagation(); handleSeatClick(section.id, seat.id); }}
                                                                    className={`w-8 h-8 rounded-t-lg rounded-b-sm flex items-center justify-center text-[10px] font-bold cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md`}
                                                                    style={{ backgroundColor: theme.color, color: theme.textColor }}
                                                                    title={`${seat.seatLabel} - ₹${section.basePrice}`}
                                                                >
                                                                    {seat.seatNumber}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    <div className="w-6 font-bold text-xs text-slate-400 text-center">{rowLabel}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Render Boxes */}
                            {boxes.length > 0 && (
                                <div className="grid grid-cols-2 gap-8 w-full max-w-4xl">
                                    {boxes.map(box => (
                                        <div key={box.id} className="bg-gradient-to-br from-purple-900 to-slate-900 rounded-3xl p-6 shadow-xl relative border border-purple-500/30 group">
                                            <button 
                                                onClick={() => deleteBox(box.id)}
                                                className="absolute top-4 right-4 text-purple-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <h4 className="text-white font-black tracking-widest uppercase text-sm mb-1">{box.name}</h4>
                                            <p className="text-purple-300 text-xs font-medium mb-6">₹{box.price} / seat • {box.seatCount} Seats</p>
                                            
                                            <div className="flex flex-wrap gap-3">
                                                {Array.from({length: box.seatCount}).map((_, i) => (
                                                    <div key={i} className="w-10 h-10 rounded-t-xl rounded-b-md bg-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-inner border-t border-purple-400">
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

            {/* RIGHT: PROPERTIES & OVERVIEW */}
            <div className="w-[320px] bg-white border-l border-slate-200 flex flex-col">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                        <Settings size={20} className="text-slate-400" /> Properties
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Event Stats */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Capacity</div>
                        <div className="text-3xl font-black text-slate-900">{totalCapacity}</div>
                        <div className="text-xs font-medium text-slate-500 mt-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Available for sale
                        </div>
                    </div>

                    {/* Legends */}
                    <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Seat Types Legend</h3>
                        <div className="space-y-3">
                            {Object.entries(THEATRE_SEAT_TYPES).map(([key, type]) => (
                                <div key={key} className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-t-md rounded-b-sm border" style={{ backgroundColor: type.color, borderColor: 'rgba(0,0,0,0.1)' }}></div>
                                    <span className="text-sm font-bold text-slate-600">{type.label}</span>
                                </div>
                            ))}
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-md border border-dashed border-slate-300 bg-slate-50"></div>
                                <span className="text-sm font-bold text-slate-600">Aisle / Walkway</span>
                            </div>
                        </div>
                    </div>

                    {/* Active Section Info */}
                    {activeSection && (
                        <div className="pt-6 border-t border-slate-100">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Selected Section</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Section Name</label>
                                    <input 
                                        type="text" 
                                        value={activeSection.name} 
                                        onChange={e => {
                                            setSections(sections.map(s => s.id === activeSection.id ? {...s, name: e.target.value} : s));
                                        }}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800" 
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Base Price (₹)</label>
                                    <input 
                                        type="number" 
                                        value={activeSection.basePrice} 
                                        onChange={e => {
                                            setSections(sections.map(s => s.id === activeSection.id ? {...s, basePrice: Number(e.target.value)} : s));
                                        }}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800" 
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50">
                    <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2">
                        <Save size={18} /> Publish Layout
                    </button>
                    <p className="text-[10px] font-bold text-center text-slate-400 mt-4 uppercase tracking-wider">Syncs to Supabase Seating Engine</p>
                </div>
            </div>

        </div>
    );
}
