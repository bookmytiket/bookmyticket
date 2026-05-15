"use client";
import React, { useState } from "react";
import { 
    Settings, User, Bell, Shield, CreditCard, 
    LogOut, Save, Camera, Smartphone, Globe,
    Mail, Lock, Eye, EyeOff, CheckCircle2,
    Activity, Trash2, MapPin
} from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useToast } from "@/context/ToastContext";

export default function SettingsPage() {
    const { user, logout } = useAuth();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState("profile");

    const tabs = [
        { id: "profile", label: "BUSINESS PROFILE", icon: User },
        { id: "notifications", label: "NOTIFICATIONS", icon: Bell },
        { id: "security", label: "SECURITY PROTOCOL", icon: Shield },
        { id: "billing", label: "TAX & BILLING", icon: CreditCard },
    ];

    return (
        <div className="space-y-12 animate-in slide-in-from-right-8 duration-1000">
            {/* Header */}
            <div className="px-4">
                <h2 className="text-4xl font-black text-[#1A1C2E] tracking-tighter uppercase italic leading-none">SYSTEM CONFIGURATION</h2>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">Manage your business identity, security, and preferences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                {/* Tabs Sidebar */}
                <div className="space-y-3">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-4 px-8 py-5 rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest transition-all ${
                                activeTab === tab.id ? 'bg-[#1A1C2E] text-white shadow-2xl shadow-slate-200' : 'text-slate-300 hover:bg-white hover:text-[#1A1C2E]'
                            }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                    <div className="pt-12 px-4 border-t border-slate-50 mt-12">
                        <button onClick={logout} className="w-full flex items-center gap-4 py-4 font-black uppercase text-[10px] tracking-[0.3em] text-[#f84464] hover:opacity-70 transition-all">
                            <LogOut size={18} />
                            TERMINATE SESSION
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-[4rem] border border-slate-50 p-12 md:p-20 shadow-sm min-h-[700px]">
                        {activeTab === 'profile' && (
                            <div className="space-y-16 animate-in slide-in-from-right-8 duration-700">
                                <div className="flex items-center gap-10">
                                    <div className="relative group">
                                        <div className="w-28 h-28 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-slate-200 shadow-inner group-hover:bg-[#1A1C2E] group-hover:text-pink-400 transition-all italic">
                                            <Camera size={36} />
                                        </div>
                                        <button className="absolute -bottom-3 -right-3 w-12 h-12 bg-gradient-to-r from-[#f84464] to-[#c026d3] text-white rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 transition-all border-4 border-white">
                                            <Save size={18} />
                                        </button>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black text-[#1A1C2E] uppercase italic tracking-tighter">BUSINESS IDENTITY</h3>
                                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Logo and public-facing brand information</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-6">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] ml-2">LEGAL ENTITY NAME</label>
                                        <input className="w-full bg-slate-50 p-6 rounded-[1.8rem] text-sm font-black border-none focus:ring-4 focus:ring-pink-500/5 transition-all uppercase italic" defaultValue={user.full_name} />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] ml-2">SUPPORT CHANNEL</label>
                                        <input className="w-full bg-slate-50 p-6 rounded-[1.8rem] text-sm font-black border-none focus:ring-4 focus:ring-pink-500/5 transition-all uppercase italic" defaultValue={user.email} />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] ml-2">CONTACT HOTLINE</label>
                                        <input className="w-full bg-slate-50 p-6 rounded-[1.8rem] text-sm font-black border-none focus:ring-4 focus:ring-pink-500/5 transition-all uppercase italic" placeholder="+91 XXXX XXX XXX" />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] ml-2">HEADQUARTERS</label>
                                        <input className="w-full bg-slate-50 p-6 rounded-[1.8rem] text-sm font-black border-none focus:ring-4 focus:ring-pink-500/5 transition-all uppercase italic" placeholder="e.g. CHENNAI" />
                                    </div>
                                </div>

                                <div className="pt-12 flex justify-end">
                                    <button onClick={() => showToast("Profile synchronized", "success")} className="px-16 py-6 bg-[#1A1C2E] text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-black transition-all">
                                        COMMIT CHANGES
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-16 animate-in slide-in-from-right-8 duration-700">
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-[#1A1C2E] uppercase italic tracking-tighter leading-none">NOTIFICATION LOGIC</h3>
                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Choose how you stay updated with your business</p>
                                </div>

                                <div className="space-y-6 pt-6">
                                    {[
                                        { title: "BOOKING CONFIRMATIONS", desc: "Get notified when a customer reserves a court", icon: Ticket },
                                        { title: "FINANCIAL PAYOUTS", desc: "Receive alerts for successful earnings settlements", icon: IndianRupee },
                                        { title: "SYSTEM ALERTS", desc: "Crucial maintenance and security notifications", icon: Activity },
                                        { title: "MARKETING & PROMOS", desc: "News about platform features and offers", icon: Sparkles },
                                    ].map((item, i) => (
                                        <div key={i} className="p-10 bg-slate-50 rounded-[3rem] border border-slate-50 flex items-center justify-between group hover:bg-white hover:shadow-2xl hover:border-pink-50 transition-all">
                                            <div className="flex items-center gap-8">
                                                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-slate-300 group-hover:bg-[#1A1C2E] group-hover:text-pink-400 transition-all shadow-sm">
                                                    <item.icon size={22} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-[#1A1C2E] uppercase tracking-tight italic">{item.title}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{item.desc}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-7 bg-slate-200 rounded-full relative p-1.5 cursor-pointer">
                                                    <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

