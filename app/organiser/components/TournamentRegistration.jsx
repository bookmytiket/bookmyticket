"use client";
import React, { useState, useEffect } from "react";
import { 
    Users, User, Phone, Mail, MapPin, Image as ImageIcon, 
    Trash2, Plus, ArrowRight, ArrowLeft, ShieldCheck, 
    Zap, Trophy, Medal, Star, ChevronDown, Camera,
    Upload, FileText, CheckCircle2, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/context/ToastContext";

const TournamentRegistration = ({ event, onClose }) => {
    const { showToast } = useToast();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    
    const [teamData, setTeamData] = useState({
        teamName: "",
        captainName: "",
        captainMobile: "",
        captainEmail: "",
        teamLogo: null,
        teamLogoPreview: "",
        category: event.categories?.[0]?.name || "Open",
        city: "",
        members: []
    });

    const categories = event.categories || [{ name: "Open", fee: event.registrationFee || 0 }];

    const addMember = () => {
        if (teamData.members.length >= (event.maxTeamSize || 20)) {
            showToast(`Maximum ${event.maxTeamSize} players allowed`, "error");
            return;
        }
        setTeamData(prev => ({
            ...prev,
            members: [...prev.members, { 
                name: "", 
                mobile: "", 
                age: "", 
                jerseyNumber: "", 
                role: "Player",
                photo: null,
                photoPreview: ""
            }]
        }));
    };

    const removeMember = (idx) => {
        setTeamData(prev => ({
            ...prev,
            members: prev.members.filter((_, i) => i !== idx)
        }));
    };

    const updateMember = (idx, field, value) => {
        const next = [...teamData.members];
        next[idx][field] = value;
        setTeamData(prev => ({ ...prev, members: next }));
    };

    const handleFileUpload = (e, idx = -1) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            if (idx === -1) {
                setTeamData(prev => ({ ...prev, teamLogo: file, teamLogoPreview: ev.target.result }));
            } else {
                const next = [...teamData.members];
                next[idx].photo = file;
                next[idx].photoPreview = ev.target.result;
                setTeamData(prev => ({ ...prev, members: next }));
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // 1. Upload Logo if exists
            let logoUrl = "";
            if (teamData.teamLogo) {
                const fileName = `${Date.now()}_logo_${teamData.teamName.replace(/\s/g, '_')}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('tournament-assets')
                    .upload(`logos/${fileName}`, teamData.teamLogo);
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('tournament-assets').getPublicUrl(uploadData.path);
                logoUrl = publicUrl;
            }

            // 2. Create Team
            const { data: team, error: teamError } = await supabase
                .from('tournament_teams')
                .insert({
                    tournament_event_id: event.id,
                    team_name: teamData.teamName,
                    captain_name: teamData.captainName,
                    captain_mobile: teamData.captainMobile,
                    captain_email: teamData.captainEmail,
                    team_logo_url: logoUrl,
                    registration_status: 'pending_approval',
                    payment_status: (event.registrationFee > 0) ? 'pending' : 'waived',
                    metadata: { category: teamData.category, city: teamData.city }
                })
                .select()
                .single();

            if (teamError) throw teamError;

            // 3. Create Members
            if (teamData.members.length > 0) {
                const membersToInsert = teamData.members.map(m => ({
                    team_id: team.id,
                    member_name: m.name,
                    role: m.role,
                    age: parseInt(m.age) || null,
                    jersey_number: m.jerseyNumber,
                    mobile: m.mobile
                }));
                const { error: membersError } = await supabase.from('tournament_team_members').insert(membersToInsert);
                if (membersError) throw membersError;
            }

            showToast("Registration successful! Waiting for approval.", "success");
            onClose();
        } catch (err) {
            console.error(err);
            showToast(err.message || "Registration failed", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 backdrop-blur-2xl bg-black/60 overflow-y-auto">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-4xl bg-[#0f172a] rounded-[3rem] border border-white/10 shadow-[0_0_100px_rgba(236,72,153,0.1)] overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-8 border-b border-white/5 bg-gradient-to-r from-pink-500/10 to-purple-600/10 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
                            <Trophy size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Team Registration</h2>
                            <p className="text-[10px] font-bold text-pink-400 uppercase tracking-[0.2em]">{event.title}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all border border-white/10">
                        <Trash2 size={18} className="text-slate-400" />
                    </button>
                </div>

                {/* Stepper */}
                <div className="px-12 py-6 flex items-center justify-center gap-4 bg-black/20">
                    {[1, 2, 3].map(s => (
                        <React.Fragment key={s}>
                            <div className={`flex items-center gap-3 ${step >= s ? 'text-pink-500' : 'text-slate-500'}`}>
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs border-2 ${step >= s ? 'border-pink-500 bg-pink-500 text-white' : 'border-slate-800'}`}>
                                    {s}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">
                                    {s === 1 ? 'Team Info' : s === 2 ? 'Players' : 'Confirm'}
                                </span>
                            </div>
                            {s < 3 && <div className={`w-12 h-0.5 rounded-full ${step > s ? 'bg-pink-500' : 'bg-slate-800'}`} />}
                        </React.Fragment>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div 
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-10"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Team Logo</label>
                                        <div className="relative group w-32 h-32 rounded-3xl border-2 border-dashed border-slate-800 bg-slate-900/50 overflow-hidden hover:border-pink-500/50 transition-all flex items-center justify-center">
                                            {teamData.teamLogoPreview ? (
                                                <img src={teamData.teamLogoPreview} className="w-full h-full object-cover" />
                                            ) : (
                                                <label className="cursor-pointer flex flex-col items-center gap-2">
                                                    <Camera size={24} className="text-slate-600" />
                                                    <span className="text-[8px] font-bold text-slate-600 uppercase">Upload</span>
                                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-8">
                                        <div className="space-y-3">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Team Name*</label>
                                            <input 
                                                className="w-full bg-slate-900 border border-slate-800 text-white text-sm font-bold px-6 py-4 rounded-2xl focus:outline-none focus:border-pink-500 transition-all"
                                                value={teamData.teamName}
                                                onChange={e => setTeamData({...teamData, teamName: e.target.value})}
                                                placeholder="e.g. Phoenix Warriors"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Base City</label>
                                            <input 
                                                className="w-full bg-slate-900 border border-slate-800 text-white text-sm font-bold px-6 py-4 rounded-2xl focus:outline-none focus:border-pink-500 transition-all"
                                                value={teamData.city}
                                                onChange={e => setTeamData({...teamData, city: e.target.value})}
                                                placeholder="e.g. Mumbai"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-white/5">
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Captain Name*</label>
                                        <input 
                                            className="w-full bg-slate-900 border border-slate-800 text-white text-sm font-bold px-6 py-4 rounded-2xl focus:outline-none focus:border-pink-500 transition-all"
                                            value={teamData.captainName}
                                            onChange={e => setTeamData({...teamData, captainName: e.target.value})}
                                            placeholder="Enter full name"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Captain Mobile*</label>
                                        <input 
                                            className="w-full bg-slate-900 border border-slate-800 text-white text-sm font-bold px-6 py-4 rounded-2xl focus:outline-none focus:border-pink-500 transition-all"
                                            value={teamData.captainMobile}
                                            onChange={e => setTeamData({...teamData, captainMobile: e.target.value})}
                                            placeholder="10 digit number"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Tournament Category*</label>
                                        <select 
                                            className="w-full bg-slate-900 border border-slate-800 text-white text-sm font-bold px-6 py-4 rounded-2xl focus:outline-none focus:border-pink-500 transition-all appearance-none"
                                            value={teamData.category}
                                            onChange={e => setTeamData({...teamData, category: e.target.value})}
                                        >
                                            {categories.map(c => <option key={c.name} value={c.name}>{c.name} - ₹{c.fee}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div 
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-xl font-black text-white uppercase italic">Player Roster</h3>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Min: {event.minTeamSize} | Max: {event.maxTeamSize}</p>
                                    </div>
                                    <button 
                                        onClick={addMember}
                                        className="px-6 py-3 bg-pink-500/10 text-pink-500 border border-pink-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-pink-500 hover:text-white transition-all shadow-lg shadow-pink-500/5"
                                    >
                                        <Plus size={16} /> Add Player
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {teamData.members.map((m, idx) => (
                                        <div key={idx} className="p-6 bg-slate-900/50 border border-white/5 rounded-3xl flex flex-col md:flex-row gap-6 items-start group">
                                            <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-600 shrink-0 overflow-hidden relative">
                                                {m.photoPreview ? (
                                                    <img src={m.photoPreview} className="w-full h-full object-cover" />
                                                ) : (
                                                    <label className="cursor-pointer flex flex-col items-center">
                                                        <User size={24} />
                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, idx)} />
                                                    </label>
                                                )}
                                            </div>
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
                                                <div className="md:col-span-2 space-y-1">
                                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Full Name</span>
                                                    <input 
                                                        className="w-full bg-slate-800 border border-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl focus:outline-none focus:border-pink-500 transition-all"
                                                        value={m.name}
                                                        onChange={e => updateMember(idx, 'name', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Jersey #</span>
                                                    <input 
                                                        className="w-full bg-slate-800 border border-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl focus:outline-none focus:border-pink-500 transition-all"
                                                        value={m.jerseyNumber}
                                                        onChange={e => updateMember(idx, 'jerseyNumber', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Role</span>
                                                    <select 
                                                        className="w-full bg-slate-800 border border-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl focus:outline-none focus:border-pink-500 transition-all appearance-none"
                                                        value={m.role}
                                                        onChange={e => updateMember(idx, 'role', e.target.value)}
                                                    >
                                                        <option>Player</option>
                                                        <option>Captain</option>
                                                        <option>Sub</option>
                                                        <option>Coach</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => removeMember(idx)}
                                                className="p-2 text-slate-600 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                    {teamData.members.length === 0 && (
                                        <div className="py-20 border-2 border-dashed border-slate-800 rounded-[3rem] flex flex-col items-center justify-center text-slate-600 gap-4">
                                            <Users size={48} strokeWidth={1} />
                                            <p className="text-[10px] font-black uppercase tracking-widest">No players added to the roster yet</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div 
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex flex-col items-center text-center space-y-10"
                            >
                                <div className="w-24 h-24 rounded-[3rem] bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-2xl shadow-pink-500/20">
                                    <ShieldCheck size={48} />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Ready for Glory?</h3>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em]">Review your team details before submission</p>
                                </div>

                                <div className="w-full max-w-md bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                                        <span className="text-slate-500">Team</span>
                                        <span className="text-white">{teamData.teamName}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                                        <span className="text-slate-500">Captain</span>
                                        <span className="text-white">{teamData.captainName}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                                        <span className="text-slate-500">Players</span>
                                        <span className="text-white">{teamData.members.length} Members</span>
                                    </div>
                                    <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                                        <span className="text-[10px] font-black text-pink-500 uppercase tracking-[0.2em]">Registration Fee</span>
                                        <span className="text-2xl font-black text-white">₹{categories.find(c => c.name === teamData.category)?.fee || 0}</span>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-6 bg-pink-500/5 border border-pink-500/10 rounded-3xl max-w-lg text-left">
                                    <AlertCircle size={20} className="text-pink-500 shrink-0" />
                                    <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed">
                                        By submitting, you agree to the tournament rules and terms of service. Registration is subject to organiser approval.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="p-10 border-t border-white/5 bg-black/40 flex justify-between items-center">
                    <button 
                        onClick={() => step > 1 && setStep(step - 1)}
                        className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-400 hover:text-white'}`}
                    >
                        <ArrowLeft size={16} /> Previous Step
                    </button>
                    
                    {step < 3 ? (
                        <button 
                            onClick={() => setStep(step + 1)}
                            className="px-10 py-5 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-pink-500 hover:text-white transition-all shadow-xl shadow-white/5"
                        >
                            Next Step <ArrowRight size={16} />
                        </button>
                    ) : (
                        <button 
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-12 py-5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:scale-105 transition-all shadow-2xl shadow-pink-500/20 disabled:opacity-50"
                        >
                            {loading ? "Registering..." : "Confirm Registration"} <Zap size={16} />
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default TournamentRegistration;
