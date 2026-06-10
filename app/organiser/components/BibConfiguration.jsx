"use client";
import React from "react";
import { Hash, Settings2, ToggleLeft, ToggleRight, Info } from "lucide-react";

export default function BibConfiguration({ config, onChange }) {
    if (!config) return null;

    const toggleBib = () => onChange({ ...config, bib_enabled: !config.bib_enabled });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500">
                            <Hash size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 uppercase">BIB Configuration</h2>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Assign BIB numbers to participants</p>
                        </div>
                    </div>
                    <button 
                        onClick={toggleBib}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                            config.bib_enabled ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'
                        }`}
                    >
                        {config.bib_enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                        <span className="text-xs font-black uppercase">{config.bib_enabled ? 'Enabled' : 'Disabled'}</span>
                    </button>
                </div>

                {config.bib_enabled && (
                    <div className="space-y-6 mt-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    BIB Prefix <Info size={12} className="text-slate-300" />
                                </label>
                                <input
                                    type="text"
                                    className="w-full bg-white border border-slate-200 text-sm font-bold text-slate-900 p-4 rounded-xl focus:outline-none focus:border-purple-500 uppercase"
                                    placeholder="e.g. RUN, MAR, KRC"
                                    value={config.bib_prefix || ""}
                                    onChange={e => onChange({ ...config, bib_prefix: e.target.value.toUpperCase() })}
                                />
                                <p className="text-[9px] text-slate-400">Optional text before the number.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Starting Number*
                                </label>
                                <input
                                    type="number"
                                    className="w-full bg-white border border-slate-200 text-sm font-bold text-slate-900 p-4 rounded-xl focus:outline-none focus:border-purple-500"
                                    placeholder="e.g. 1001"
                                    value={config.bib_start_number || ""}
                                    onChange={e => onChange({ ...config, bib_start_number: parseInt(e.target.value) || 0 })}
                                />
                                <p className="text-[9px] text-slate-400">The first BIB number to generate.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Padding Length
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    className="w-full bg-white border border-slate-200 text-sm font-bold text-slate-900 p-4 rounded-xl focus:outline-none focus:border-purple-500"
                                    placeholder="e.g. 4 (0001)"
                                    value={config.bib_padding || 4}
                                    onChange={e => onChange({ ...config, bib_padding: parseInt(e.target.value) || 4 })}
                                />
                                <p className="text-[9px] text-slate-400">Total digits (pads with zeroes).</p>
                            </div>
                        </div>

                        <div className="border-t border-slate-200 pt-6 mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="flex items-center gap-3 cursor-pointer p-4 bg-white rounded-xl border border-slate-200 hover:border-purple-300 transition-colors">
                                <input 
                                    type="checkbox" 
                                    className="w-5 h-5 rounded text-purple-500 focus:ring-purple-500"
                                    checked={config.bib_per_category || false}
                                    onChange={e => onChange({ ...config, bib_per_category: e.target.checked })}
                                />
                                <div>
                                    <span className="text-sm font-bold text-slate-900 block">Reset Per Category</span>
                                    <span className="text-[10px] text-slate-500">Restart number sequence for each category</span>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer p-4 bg-white rounded-xl border border-slate-200 hover:border-purple-300 transition-colors">
                                <input 
                                    type="checkbox" 
                                    className="w-5 h-5 rounded text-purple-500 focus:ring-purple-500"
                                    checked={config.bib_display_on_ticket !== false}
                                    onChange={e => onChange({ ...config, bib_display_on_ticket: e.target.checked })}
                                />
                                <div>
                                    <span className="text-sm font-bold text-slate-900 block">Display on E-Ticket</span>
                                    <span className="text-[10px] text-slate-500">Show BIB number on PDF and QR tickets</span>
                                </div>
                            </label>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
