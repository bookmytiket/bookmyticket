"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from '@/components/AuthContext';
import { 
    Video, Calendar, Clock, Ticket, Users, Shield, 
    Image as ImageIcon, Layout, ArrowRight, ArrowLeft,
    CheckCircle2, Plus, Trash2, Sparkles, Globe, Link as LinkIcon,
    Monitor, Mic, Presentation, Zap, Info, ShieldCheck
} from "lucide-react";
import CalendarPicker from "./CalendarPicker";
import TimePicker from "./TimePicker";
import CustomSelect from "./CustomSelect";

const renderInput = (label, value, onChange, type = "text", placeholder = "", fullWidth = false) => (
    <div className={`space-y-3 ${fullWidth ? 'md:col-span-2' : ''}`}>
        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">{label}</label>
        {type === "date" ? (
            <CalendarPicker 
                value={value || ""} 
                onChange={onChange}
                placeholder={placeholder || "dd/mm/yyyy"}
            />
        ) : type === "time" ? (
            <TimePicker 
                value={value || ""} 
                onChange={onChange}
                placeholder={placeholder || "--:--"}
            />
        ) : (
            <input 
                type={type}
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-100 text-slate-900 text-sm font-bold px-6 py-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-200 transition-all placeholder:text-slate-400"
                placeholder={placeholder}
            />
        )}
    </div>
);

const VirtualEventForm = ({ postEvent, setPostEvent, onCancel, onPublish, isEditing }) => {
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);

    useEffect(() => {
        if (!postEvent.type) {
            setPostEvent(prev => ({ ...prev, type: "Virtual Event" }));
        }
    }, []);

    const steps = [
        { id: 1, title: "Identity", icon: Info },
        { id: 2, title: "Broadcast", icon: Video },
        { id: 3, title: "Access", icon: ShieldCheck },
        { id: 4, title: "Tickets", icon: Ticket },
        { id: 5, title: isEditing ? "Update" : "Finalize", icon: Zap }
    ];

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    return (
        <div className="max-w-5xl mx-auto py-12 px-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-between mb-16 overflow-x-auto pb-4 scrollbar-hide">
                {steps.map((s, idx) => (
                    <React.Fragment key={s.id}>
                        <div className="flex flex-col items-center gap-4 shrink-0">
                            <div 
                                onClick={() => currentStep > s.id && setCurrentStep(s.id)}
                                className={`w-14 h-14 rounded-[2rem] flex items-center justify-center transition-all duration-500 border-2 cursor-pointer ${
                                    currentStep >= s.id 
                                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 border-transparent text-white shadow-xl shadow-blue-500/20 scale-110' 
                                    : 'bg-white border-slate-100 text-slate-400'
                                }`}
                            >
                                <s.icon size={22} strokeWidth={2.5} />
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${currentStep >= s.id ? 'text-blue-600' : 'text-slate-400'}`}>
                                {s.title}
                            </span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={`w-full h-[2px] mx-4 rounded-full transition-all duration-700 ${currentStep > s.id ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-slate-100'}`} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Step 1: Identity */}
            {currentStep === 1 && (
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] p-12 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                            <Sparkles size={32} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Virtual Identity</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Digital presence & presentation matrix</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {renderInput("Event Name*", postEvent.title, (v) => setPostEvent(p => ({ ...p, title: v })), "text", "Enter digital event name", true)}
                        {renderInput("Subtitle / Tagline", postEvent.subtitle, (v) => setPostEvent(p => ({ ...p, subtitle: v })), "text", "Short catchphrase")}
                        {renderInput("Category*", postEvent.category, (v) => setPostEvent(p => ({ ...p, category: v })), "text", "Webinar, Live Stream, etc.")}
                        
                        <div className="md:col-span-2 space-y-3">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Digital Banner (16:9)</label>
                            <div 
                                className="group relative h-72 rounded-[3rem] border-2 border-dashed border-slate-200 bg-slate-50/50 overflow-hidden hover:border-blue-300 transition-all flex items-center justify-center cursor-pointer shadow-inner"
                                onClick={() => document.getElementById('banner-upload').click()}
                            >
                                {postEvent.bannerPreview ? (
                                    <img src={postEvent.bannerPreview} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                ) : (
                                    <div className="flex flex-col items-center gap-4 text-slate-400 group-hover:text-blue-500 transition-colors">
                                        <div className="w-20 h-20 rounded-[2rem] bg-white shadow-sm flex items-center justify-center group-hover:shadow-blue-100 transition-all">
                                            <ImageIcon size={32} strokeWidth={1.5} />
                                        </div>
                                        <span className="text-[11px] font-black uppercase tracking-widest">Digital Asset Visualization</span>
                                    </div>
                                )}
                                <input id="banner-upload" type="file" className="hidden" onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (ev) => setPostEvent(p => ({ ...p, banner: file, bannerPreview: ev.target.result }));
                                        reader.readAsDataURL(file);
                                    }
                                }} />
                            </div>
                        </div>

                        {renderInput("Start Date*", postEvent.startDate, (v) => setPostEvent(p => ({ ...p, startDate: v })), "date")}
                        {renderInput("Start Time*", postEvent.startTime, (v) => setPostEvent(p => ({ ...p, startTime: v })), "time")}
                    </div>

                    <div className="pt-10 flex justify-end">
                        <button 
                            onClick={nextStep}
                            disabled={!postEvent.title || !postEvent.startDate}
                            className="group px-12 py-5 bg-slate-900 text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:bg-blue-600 transition-all shadow-2xl disabled:opacity-50 disabled:pointer-events-none"
                        >
                            Next: Broadcast Config <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Broadcast */}
            {currentStep === 2 && (
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] p-12 space-y-12 animate-in fade-in slide-in-from-right-8 duration-700">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                            <Video size={32} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Broadcast Configuration</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Platform integration & streaming parameters</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <CustomSelect 
                            label="Streaming Platform"
                            value={postEvent.meetingType || "external"}
                            options={[
                                { label: "Zoom Integration", value: "zoom" },
                                { label: "Google Meet", value: "meet" },
                                { label: "YouTube Live", value: "youtube" },
                                { label: "Custom RTMP", value: "rtmp" },
                                { label: "External Link", value: "external" }
                            ]}
                            onChange={(v) => setPostEvent(p => ({ ...p, meetingType: v }))}
                        />
                        {renderInput("Streaming / Meeting URL*", postEvent.externalMeetingUrl, (v) => setPostEvent(p => ({ ...p, externalMeetingUrl: v })), "url", "e.g. https://zoom.us/j/...", true)}
                        
                        <div className="md:col-span-2 space-y-6">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Interactive Features</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                {[
                                    { id: 'chatEnabled', label: 'Live Chat', icon: Mic },
                                    { id: 'recordingEnabled', label: 'Cloud Recording', icon: Monitor },
                                    { id: 'qaEnabled', label: 'Q&A Session', icon: Presentation },
                                    { id: 'hdEnabled', label: '4K Ultra HD', icon: Zap },
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setPostEvent(p => ({ ...p, [item.id]: !p[item.id] }))}
                                        className={`flex flex-col items-center gap-4 p-8 rounded-[2.5rem] border-2 transition-all duration-500 ${
                                            postEvent[item.id] 
                                            ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-xl shadow-blue-500/10 scale-105' 
                                            : 'bg-slate-50/50 border-slate-100 text-slate-400 grayscale'
                                        }`}
                                    >
                                        <item.icon size={28} strokeWidth={postEvent[item.id] ? 2.5 : 1.5} />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-center">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 flex justify-between">
                        <button onClick={prevStep} className="px-10 py-5 text-slate-400 font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:text-slate-900 transition-colors"><ArrowLeft size={18} /> Identity Return</button>
                        <button onClick={nextStep} className="px-12 py-5 bg-slate-900 text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:bg-blue-600 transition-all shadow-2xl">Next: Access Protocol <ArrowRight size={18} /></button>
                    </div>
                </div>
            )}

            {/* Step 3: Access */}
            {currentStep === 3 && (
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] p-12 space-y-12 animate-in fade-in slide-in-from-right-8 duration-700">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                            <ShieldCheck size={32} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Access Protocol</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Authentication & session security parameters</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <CustomSelect 
                            label="Session Visibility"
                            value={postEvent.visibility || "public"}
                            options={[
                                { label: "Public Discovery", value: "public" },
                                { label: "Private (Invite Only)", value: "private" },
                                { label: "Unlisted (Link Only)", value: "unlisted" }
                            ]}
                            onChange={(v) => setPostEvent(p => ({ ...p, visibility: v }))}
                        />
                        {renderInput("Access Password (Optional)", postEvent.meetingPassword, (v) => setPostEvent(p => ({ ...p, meetingPassword: v })), "text", "Set for extra security")}
                        
                        <div className="md:col-span-2 space-y-6">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">Participant Permissions</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                {[
                                    { id: 'allowMic', label: 'Audio Access', icon: Mic },
                                    { id: 'allowVideo', label: 'Video Access', icon: Video },
                                    { id: 'allowScreen', label: 'Screen Share', icon: Monitor },
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setPostEvent(p => ({ ...p, [item.id]: !p[item.id] }))}
                                        className={`flex items-center gap-4 p-6 rounded-2xl border-2 transition-all duration-500 ${
                                            postEvent[item.id] 
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-lg shadow-indigo-500/10' 
                                            : 'bg-slate-50/50 border-slate-100 text-slate-400'
                                        }`}
                                    >
                                        <item.icon size={20} strokeWidth={2.5} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 flex justify-between">
                        <button onClick={prevStep} className="px-10 py-5 text-slate-400 font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:text-slate-900 transition-colors"><ArrowLeft size={18} /> Broadcast Return</button>
                        <button onClick={nextStep} className="px-12 py-5 bg-slate-900 text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:bg-indigo-600 transition-all shadow-2xl">Next: Digital Tickets <ArrowRight size={18} /></button>
                    </div>
                </div>
            )}

            {/* Step 4: Tickets */}
            {currentStep === 4 && (
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] p-12 space-y-12 animate-in fade-in slide-in-from-right-8 duration-700">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                            <Ticket size={32} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Digital Inventory</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Virtual pass tiers & availability control</p>
                        </div>
                        <button 
                            onClick={() => {
                                const newCats = [...(postEvent.categories || [])];
                                newCats.push({ id: Date.now(), name: "Standard Access", price: 199, totalSlots: 500, color: "#3b82f6" });
                                setPostEvent(p => ({ ...p, categories: newCats }));
                            }}
                            className="flex items-center gap-3 px-8 py-4 bg-blue-50 text-blue-600 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100 group"
                        >
                            <Plus size={16} strokeWidth={2.5} />
                            Add Virtual Tier
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {(postEvent.categories || []).map((cat, idx) => (
                            <div key={cat.id} className="group relative bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 hover:border-blue-200 transition-all shadow-sm">
                                <button 
                                    onClick={() => {
                                        const newCats = postEvent.categories.filter((_, i) => i !== idx);
                                        setPostEvent(p => ({ ...p, categories: newCats }));
                                    }}
                                    className="absolute -top-3 -right-3 w-10 h-10 bg-white text-slate-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-slate-100 shadow-lg hover:text-red-500"
                                >
                                    <Trash2 size={16} />
                                </button>
                                
                                <div className="space-y-6">
                                    <input 
                                        className="bg-transparent text-lg font-black text-slate-900 uppercase tracking-tight w-full focus:outline-none border-b border-transparent focus:border-blue-200 pb-1"
                                        value={cat.name}
                                        onChange={e => {
                                            const next = [...postEvent.categories];
                                            next[idx].name = e.target.value;
                                            setPostEvent(p => ({ ...p, categories: next }));
                                        }}
                                    />
                                    
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Pass Price (₹)</label>
                                            <input 
                                                type="number"
                                                className="w-full bg-white border border-slate-100 text-sm font-black p-4 rounded-2xl text-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                                                value={cat.price}
                                                onChange={e => {
                                                    const next = [...postEvent.categories];
                                                    next[idx].price = parseFloat(e.target.value) || 0;
                                                    setPostEvent(p => ({ ...p, categories: next }));
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Max Passes</label>
                                            <input 
                                                type="number"
                                                className="w-full bg-white border border-slate-100 text-sm font-black p-4 rounded-2xl text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-500/10"
                                                value={cat.totalSlots}
                                                onChange={e => {
                                                    const next = [...postEvent.categories];
                                                    next[idx].totalSlots = parseInt(e.target.value) || 0;
                                                    setPostEvent(p => ({ ...p, categories: next }));
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-10 flex justify-between">
                        <button onClick={prevStep} className="px-10 py-5 text-slate-400 font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:text-slate-900 transition-colors"><ArrowLeft size={18} /> Protocol Return</button>
                        <button onClick={nextStep} className="px-12 py-5 bg-slate-900 text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:bg-blue-600 transition-all shadow-2xl">Next: Finalize Broadcast <ArrowRight size={18} /></button>
                    </div>
                </div>
            )}

            {/* Step 5: Finalize */}
            {currentStep === 5 && (
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] p-12 space-y-12 animate-in zoom-in duration-700">
                    <div className="flex flex-col items-center text-center space-y-8">
                        <div className="w-24 h-24 rounded-[3rem] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-blue-500/20 animate-pulse">
                            <Zap size={48} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">{isEditing ? "Ready to Update" : "Digital Launch Ready"}</h2>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-4">Global broadcast parameters have been synchronized</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-2xl pt-8">
                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Platform</span>
                                <span className="text-[10px] font-black text-slate-900 uppercase truncate block">{postEvent.meetingType || 'External'}</span>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Format</span>
                                <span className="text-[10px] font-black text-slate-900 uppercase block">Virtual</span>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Tiers</span>
                                <span className="text-[10px] font-black text-slate-900 uppercase block">{(postEvent.categories || []).length}</span>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Visibility</span>
                                <span className="text-[10px] font-black text-slate-900 uppercase block">{postEvent.visibility || 'Public'}</span>
                            </div>
                        </div>

                        <button 
                            onClick={onPublish}
                            className="mt-12 px-20 py-8 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 text-white rounded-[4rem] text-sm font-black uppercase tracking-[0.4em] shadow-2xl shadow-blue-500/40 hover:scale-105 transition-all group relative overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center gap-4">
                                <ShieldCheck size={24} strokeWidth={2.5} />
                                {isEditing ? "Update Digital Event" : "Execute Digital Launch"}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        </button>

                        <button onClick={prevStep} className="text-slate-400 hover:text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] transition-colors py-4">Return to Access Audit</button>
                    </div>
                </div>
            )}

            {/* Cancel Button */}
            <div className="mt-12 flex justify-center">
                <button onClick={onCancel} className="text-slate-400 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.2em] transition-colors py-4">
                    {isEditing ? "Cancel Update & Return" : "Abort Digital Broadcast & Discard"}
                </button>
            </div>
        </div>
    );
};

export default VirtualEventForm;
