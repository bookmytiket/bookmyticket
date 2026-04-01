"use client";
import React from "react";
import { 
    Mic, MicOff, Video, VideoOff, ScreenShare, 
    MessageSquare, Users, PhoneOff, Settings, 
    Maximize, MoreVertical 
} from "lucide-react";
import { motion } from "framer-motion";

export default function MeetingControls({ 
    audioEnabled, toggleAudio, 
    videoEnabled, toggleVideo, 
    isScreenSharing, handleScreenShare, 
    activeSidebar, setActiveSidebar, 
    handleLeave, isRetrying,
    peerCount
}) {
    return (
        <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-8 py-4 cinema-glass rounded-[2rem] cinema-glow"
        >
            {/* Audio Toggle */}
            <button 
                onClick={toggleAudio}
                className={`group relative w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    audioEnabled 
                    ? 'bg-white/5 hover:bg-white/10 text-slate-300' 
                    : 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                }`}
            >
                {audioEnabled ? <Mic size={22} /> : <MicOff size={22} />}
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {audioEnabled ? 'Mute' : 'Unmute'}
                </span>
            </button>

            {/* Video Toggle */}
            <button 
                onClick={toggleVideo}
                disabled={isRetrying}
                className={`group relative w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    videoEnabled 
                    ? 'bg-white text-slate-900 shadow-xl' 
                    : 'bg-white/5 hover:bg-white/10 text-slate-300'
                }`}
            >
                {isRetrying ? (
                    <div className="w-5 h-5 border-2 border-slate-400/30 border-t-slate-600 rounded-full animate-spin" />
                ) : (
                    videoEnabled ? <Video size={22} /> : <VideoOff size={22} />
                )}
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {videoEnabled ? 'Stop Video' : 'Start Video'}
                </span>
            </button>

            <div className="w-[1px] h-8 bg-white/10 mx-2" />

            {/* Screen Share */}
            <button 
                onClick={handleScreenShare}
                className={`group relative w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    isScreenSharing 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                    : 'bg-white/5 hover:bg-white/10 text-slate-300'
                }`}
            >
                <ScreenShare size={22} />
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Share Screen
                </span>
            </button>

            {/* Chat Toggle */}
            <button 
                onClick={() => setActiveSidebar(activeSidebar === 'chat' ? null : 'chat')}
                className={`group relative w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    activeSidebar === 'chat' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                    : 'bg-white/5 hover:bg-white/10 text-slate-300'
                }`}
            >
                <MessageSquare size={22} />
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Chat
                </span>
            </button>

            {/* Participants Toggle */}
            <button 
                onClick={() => setActiveSidebar(activeSidebar === 'participants' ? null : 'participants')}
                className={`group relative w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    activeSidebar === 'participants' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                    : 'bg-white/5 hover:bg-white/10 text-slate-300'
                }`}
            >
                <Users size={22} />
                <div className="absolute top-3 right-3 bg-blue-400 w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#1e293b]">
                    <span className="text-[8px] font-black text-slate-900">{peerCount + 1}</span>
                </div>
            </button>

            <div className="w-[1px] h-8 bg-white/10 mx-2" />

            {/* End Meeting */}
            <button 
                onClick={handleLeave}
                className="group relative h-14 px-8 bg-red-500 hover:bg-red-600 text-white rounded-[1.5rem] flex items-center justify-center gap-3 transition-all font-black tracking-widest uppercase shadow-xl shadow-red-500/30"
            >
                <PhoneOff size={20} />
                <span className="hidden md:inline text-xs">End</span>
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Leave Room
                </span>
            </button>
        </motion.div>
    );
}
