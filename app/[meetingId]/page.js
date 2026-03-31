"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/AuthContext";
import { useWebRTC } from "@/app/meeting/hooks/useWebRTC";
import { 
    Mic, MicOff, Video, VideoOff, ScreenShare, Share, 
    MessageSquare, Users, PhoneOff, Settings, MoreVertical, 
    Maximize, Shield, Lock, Send, X, ChevronRight, Layout
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MeetingRoom() {
    const { meetingId: meetingLink } = useParams();
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const meeting = useQuery(api.meetings.getByLink, { meetingLink: meetingLink });
    const joinMeeting = useMutation(api.meetings.join);
    const leaveMeeting = useMutation(api.meetings.leave);
    const sendMessage = useMutation(api.meetings.sendMessage);
    const messages = useQuery(api.meetings.getMessages, meeting?._id ? { meetingId: meeting._id } : "skip");
    const participants = useQuery(api.meetings.getParticipants, meeting?._id ? { meetingId: meeting._id } : "skip");

    const [isJoined, setIsJoined] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);
    const [name, setName] = useState(user?.fullName || user?.name || "Guest");
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [activeSidebar, setActiveSidebar] = useState(null); // 'chat' or 'participants'
    const [chatInput, setChatInput] = useState("");
    const [elapsed, setElapsed] = useState(0); // seconds
    const chatEndRef = useRef(null);
    const screenStreamRef = useRef(null);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const guestId = React.useMemo(() => `guest-${Math.random().toString(36).substr(2, 5)}`, []);
    const userId = user?.email || guestId;

    const { localStream, remoteStreams, toggleAudio, toggleVideo, peerCount, mediaError, retryMedia } = useWebRTC(
        meeting?._id, 
        userId,
        name
    );

    const localVideoRef = useRef(null);
    const hasVideo = localStream?.getVideoTracks().length > 0;

    // Sync local stream with video element
    useEffect(() => {
        if (localVideoRef.current && localStream && videoEnabled && hasVideo) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream, videoEnabled, isJoined, hasVideo]);

    useEffect(() => {
        if (activeSidebar === 'chat') {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, activeSidebar]);

    // Real meeting timer
    useEffect(() => {
        if (!isJoined) return;
        const interval = setInterval(() => setElapsed(s => s + 1), 1000);
        return () => clearInterval(interval);
    }, [isJoined]);

    const formatElapsed = (secs) => {
        const h = Math.floor(secs / 3600).toString().padStart(2, '0');
        const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    const handleScreenShare = async () => {
        if (isScreenSharing) {
            screenStreamRef.current?.getTracks().forEach(t => t.stop());
            screenStreamRef.current = null;
            setIsScreenSharing(false);
            return;
        }
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            screenStreamRef.current = screenStream;
            screenStream.getVideoTracks()[0].onended = () => setIsScreenSharing(false);
            setIsScreenSharing(true);
        } catch (err) {
            console.error("Screen share error:", err);
        }
    };

    const handleJoin = async () => {
        if (!meeting) return;
        
        // Resume AudioContext on user interaction to unblock audio playback
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                const ctx = new AudioContext();
                if (ctx.state === 'suspended') await ctx.resume();
            }
        } catch (e) {
            console.warn("Could not resume AudioContext:", e);
        }

        await joinMeeting({
            meetingId: meeting._id,
            userId: userId, // Use the stable userId computed at line 40
            name,
            // role: strictly compare creatorId. If creatorId is missing or doesn't match, it's a participant.
            role: (meeting.creatorId && user?.email && meeting.creatorId === user?.email) ? "host" : "participant",
        });
        setIsJoined(true);
    };

    const handleRetry = async () => {
        setIsRetrying(true);
        try {
            await retryMedia(true);
        } finally {
            setIsRetrying(false);
        }
    };

    const handleToggleVideo = async () => {
        if (!localStream?.getVideoTracks()[0]) {
            setIsRetrying(true);
            try {
                const success = await toggleVideo();
                if (success) setVideoEnabled(true);
            } finally {
                setIsRetrying(false);
            }
        } else {
            const newState = !videoEnabled;
            setVideoEnabled(newState);
            toggleVideo();
        }
    };

    const handleLeave = async () => {
        if (meeting) {
            await leaveMeeting({
                meetingId: meeting._id,
                userId: userId,
            });
        }
        // Redirect bases on role
        if (user?.role === "organiser" || user?.role === "admin") {
            router.push("/organiser");
        } else {
            router.push("/profile");
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!chatInput.trim() || !meeting) return;
        await sendMessage({
            meetingId: meeting._id,
            senderId: userId,
            senderName: name,
            text: chatInput,
        });
        setChatInput("");
    };

    if (authLoading || meeting === undefined) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!meeting) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 text-center" style={{ fontFamily: "'Figtree', 'Inter', sans-serif" }}>
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 21-4.3-4.3"/><path d="M9.5 15.5 18 7"/><path d="M4.5 9a5.5 5.5 0 1 0 11 0 5.5 5.5 0 1 0-11 0Z"/></svg>
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Meeting Not Found</h1>
                <p className="text-slate-600 mb-8 max-w-sm">The meeting code <strong>{meetingLink}</strong> is invalid or the meeting has ended.</p>
                <Link href="/" className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                    Back to Home
                </Link>
            </div>
        );
    }

    if (!isJoined) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4" style={{ fontFamily: "'Figtree', 'Inter', sans-serif" }}>
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/80 border border-slate-100 overflow-hidden"
                >
                    <div className="flex flex-col lg:flex-row">
                        {/* Left: Video Preview */}
                        <div className="flex-1 bg-slate-50 p-8 lg:p-10 flex flex-col gap-6">
                            {/* Camera Preview */}
                            <div className="aspect-video bg-slate-900 rounded-2xl overflow-hidden relative shadow-inner">
                                {videoEnabled && localStream && hasVideo ? (
                                    <video 
                                        autoPlay 
                                        muted 
                                        playsInline
                                        ref={(el) => {
                                            localVideoRef.current = el;
                                            if (el && localStream) {
                                                el.srcObject = localStream;
                                                el.play().catch(() => {});
                                            }
                                        }}
                                        className="w-full h-full object-cover scale-x-[-1]"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center relative">
                                            <VideoOff size={28} className="text-white/40" />
                                            {mediaError && (
                                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center ring-2 ring-slate-900">
                                                    <Shield size={10} className="text-white" />
                                                </div>
                                            )}
                                        </div>
                                        {mediaError ? (
                                            <div className="text-center px-6 space-y-2">
                                                <p className={`text-sm font-bold ${mediaError === 'camera_busy_audio_only' ? 'text-amber-400' : 'text-red-400'}`}>
                                                    {mediaError === 'camera_busy_audio_only' ? '🎧 Audio Only Mode' : '🚫 Camera Blocked'}
                                                </p>
                                                <p className="text-white/40 text-xs leading-relaxed max-w-[220px] mx-auto">
                                                    Close other browser tabs using the camera, then click the camera button below.
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-white/20 text-xs font-semibold uppercase tracking-widest">Camera Off</p>
                                        )}
                                    </div>
                                )}
                                {/* Name tag overlay */}
                                {name && (
                                    <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/10">
                                        {name}
                                    </div>
                                )}
                            </div>

                            {/* Media Controls */}
                            <div className="flex items-center justify-center gap-3">
                                <button 
                                    onClick={() => { setAudioEnabled(!audioEnabled); toggleAudio(); }}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm border ${
                                        audioEnabled 
                                            ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50' 
                                            : 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-200'
                                    }`}
                                >
                                    {audioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                                </button>
                                <button 
                                    onClick={handleToggleVideo}
                                    disabled={isRetrying}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm border ${
                                        videoEnabled && hasVideo
                                            ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                            : 'bg-slate-800 border-slate-700 text-white/60'
                                    }`}
                                >
                                    {isRetrying ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        videoEnabled && hasVideo ? <Video size={20} /> : <VideoOff size={20} />
                                    )}
                                </button>
                                {mediaError && (
                                    <button
                                        onClick={handleRetry}
                                        disabled={isRetrying}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                                    >
                                        {isRetrying ? (
                                            <><div className="w-3 h-3 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" /> Searching...</>
                                        ) : (
                                            <><Shield size={14} /> Retry Camera</>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Right: Meeting Info & Controls */}
                        <div className="w-full lg:w-[380px] p-8 lg:p-10 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-100">
                            <div>
                                {/* Header */}
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                                        <Video size={22} className="text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-black text-slate-900 leading-tight tracking-tight">Join Meeting</h1>
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest truncate max-w-[200px]">{meeting.title}</p>
                                    </div>
                                </div>

                                {/* Meeting Info Cards */}
                                <div className="space-y-3 mb-8">
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <Users size={16} className="text-slate-400 shrink-0" />
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Participants</p>
                                            <p className="text-sm font-bold text-slate-700">{peerCount} already inside</p>
                                        </div>
                                    </div>
                                    {meeting.description && (
                                        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <MessageSquare size={16} className="text-slate-400 shrink-0 mt-0.5" />
                                            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{meeting.description}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Guest Name Input */}
                                {!user && (
                                    <div className="mb-6">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Your display name</label>
                                        <input 
                                            type="text" 
                                            value={name} 
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Enter your name..."
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 transition-all text-sm font-semibold placeholder:text-slate-300"
                                        />
                                    </div>
                                )}

                                {/* Hardware Warning */}
                                {mediaError && (
                                    <div className={`p-4 rounded-2xl border mb-6 flex gap-3 ${
                                        mediaError === 'camera_busy_audio_only' 
                                            ? 'bg-amber-50 border-amber-200' 
                                            : 'bg-red-50 border-red-200'
                                    }`}>
                                        <Shield size={16} className={`shrink-0 mt-0.5 ${mediaError === 'camera_busy_audio_only' ? 'text-amber-500' : 'text-red-500'}`} />
                                        <div>
                                            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${mediaError === 'camera_busy_audio_only' ? 'text-amber-600' : 'text-red-600'}`}>
                                                {mediaError === 'camera_busy_audio_only' ? 'Camera Busy' : 'Hardware Blocked'}
                                            </p>
                                            <p className="text-xs text-slate-500 leading-relaxed">
                                                {mediaError === 'camera_busy_audio_only'
                                                    ? 'Another tab is using your camera. Close it and click "Retry Camera".'
                                                    : 'All camera access is blocked. Close camera apps and try again.'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Join Button */}
                            <button 
                                onClick={handleJoin}
                                className="w-full py-5 rounded-2xl text-white text-sm font-black tracking-widest uppercase transition-all active:scale-[0.98] hover:opacity-90"
                                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', boxShadow: '0 20px 40px -12px rgba(99,102,241,0.4)' }}
                            >
                                Join Now
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-black text-white flex flex-col overflow-hidden selection:bg-blue-500/30">
            {mediaError && (
                <div className={`${mediaError === 'camera_busy_audio_only' ? 'bg-amber-600' : 'bg-red-600'} text-white text-[10px] font-black uppercase tracking-[0.2em] py-2 text-center relative z-50 flex items-center justify-center gap-4`}>
                    {mediaError === 'camera_busy_audio_only' ? 'Audio-only: Close other tabs using your camera, then click the camera icon' : 'Spectator Mode: All camera access blocked'}
                    <button 
                        onClick={handleRetry}
                        disabled={isRetrying}
                        className={`px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-[8px] border border-white/20 transition-all font-black uppercase tracking-widest flex items-center gap-2 ${
                            isRetrying ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        {isRetrying ? 'Searching...' : 'Retry Hardware'}
                    </button>
                </div>
            )}
            {/* Header */}
            <div className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <Video size={18} strokeWidth={3} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black italic tracking-tighter uppercase leading-none">{meeting.title}</h2>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{peerCount + 1} Participants</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-tighter">Live Connection</span>
                    </div>
                    <button className="p-2.5 rounded-xl hover:bg-white/5 text-slate-400 transition-all">
                        <Maximize size={20} />
                    </button>
                    <button className="p-2.5 rounded-xl hover:bg-white/5 text-slate-400 transition-all">
                        <Settings size={20} />
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 relative bg-black p-1 flex items-center justify-center">
                    <div className={`grid gap-2 w-full h-full transition-all duration-500 ${
                        Object.keys(remoteStreams).length === 0 ? 'grid-cols-1' :
                        Object.keys(remoteStreams).length === 1 ? 'grid-cols-2' :
                        Object.keys(remoteStreams).length <= 4 ? 'grid-cols-2 grid-rows-2' :
                        'grid-cols-3'
                    }`}>
                         {/* Local Video */}
                         <div className="relative group bg-slate-900/40 rounded-xl border border-white/5 overflow-hidden ring-4 ring-transparent hover:ring-blue-500/30 transition-all shadow-2xl">
                             {(videoEnabled || isScreenSharing) && localStream && hasVideo ? (
                                 <video 
                                     autoPlay 
                                     muted 
                                     playsInline
                                     ref={localVideoRef}
                                     className="w-full h-full object-cover scale-x-[-1]"
                                 />
                             ) : (
                                 <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-slate-500 bg-slate-950">
                                     <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                                         <VideoOff className="opacity-40" />
                                     </div>
                                     <span className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">
                                         {mediaError === 'camera_busy_audio_only' ? 'Audio-only Mode' : 'Video Disabled'}
                                     </span>
                                 </div>
                             )}
                             <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                             <div className="absolute bottom-6 left-6 flex items-center gap-3">
                                 <span className="bg-black/60 backdrop-blur-md text-white text-[11px] font-black italic uppercase tracking-widest px-4 py-2 rounded-xl border border-white/10">
                                     You ({meeting.creatorId && user?.email && meeting.creatorId === user?.email ? "Host" : "Participant"})
                                 </span>
                                 {!audioEnabled && (
                                    <motion.div 
                                        initial={{ scale: 0 }} 
                                        animate={{ scale: 1 }} 
                                        className="p-2 rounded-full bg-red-500/80 backdrop-blur-sm text-white shadow-lg"
                                    >
                                        <MicOff size={14} />
                                    </motion.div>
                                 )}
                             </div>
                         </div>

                        {/* Remote Videos */}
                        {Object.entries(remoteStreams).map(([peerId, { stream, name }]) => (
                            <div key={peerId} className="relative group bg-slate-900/40 rounded-xl border border-white/5 overflow-hidden ring-4 ring-transparent hover:ring-blue-500/30 transition-all shadow-2xl">
                                <video 
                                    autoPlay 
                                    playsInline
                                    ref={el => { 
                                        if(el && stream) {
                                            el.srcObject = stream;
                                            // Handle potential browser autoplay blocks
                                            el.play().catch(err => {
                                                console.warn(`Audio/Video play failed for ${name}:`, err);
                                            });
                                        }
                                    }}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                                <div className="absolute bottom-6 left-6 flex items-center gap-3">
                                    <span className="bg-black/60 backdrop-blur-md text-white text-[11px] font-black italic uppercase tracking-widest px-4 py-2 rounded-xl border border-white/10">
                                        {name} {meeting.creatorId && peerId === meeting.creatorId ? "(Host)" : ""}
                                    </span>
                                    {/* Muted indicator for remote participant */}
                                    {stream && stream.getAudioTracks()?.length > 0 && !stream.getAudioTracks()[0].enabled && (
                                        <div className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-red-500 shadow-lg border border-red-500/20">
                                            <MicOff size={14} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebars */}
                <AnimatePresence>
                    {activeSidebar && (
                        <motion.div 
                            initial={{ x: 400 }}
                            animate={{ x: 0 }}
                            exit={{ x: 400 }}
                            className="w-[400px] border-l border-white/5 bg-slate-950/80 backdrop-blur-2xl z-20 flex flex-col"
                        >
                            <div className="h-16 px-6 border-b border-white/5 flex items-center justify-between">
                                <h3 className="text-sm font-black italic uppercase tracking-widest text-blue-400">
                                    {activeSidebar === 'chat' ? 'Meeting Chat' : 'Participants'}
                                </h3>
                                <button onClick={() => setActiveSidebar(null)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-500"><X size={20} /></button>
                            </div>

                            {activeSidebar === 'chat' && (
                                <>
                                    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
                                        {messages?.map((msg) => (
                                            <div key={msg._id} className={`flex flex-col ${msg.senderId === user?.email ? 'items-end' : 'items-start'}`}>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 px-1">
                                                    {msg.senderId === user?.email ? 'You' : msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <div className={`max-w-[85%] px-5 py-3 rounded-2xl text-sm font-bold ${
                                                    msg.senderId === user?.email 
                                                    ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-500/10' 
                                                    : 'bg-white/5 text-slate-200 border border-white/5 rounded-tl-none'
                                                }`}>
                                                    {msg.text}
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={chatEndRef} />
                                    </div>
                                    <form onSubmit={handleSendMessage} className="p-6 bg-black/40 border-t border-white/5">
                                        <div className="relative group">
                                            <input 
                                                type="text" 
                                                value={chatInput}
                                                onChange={(e) => setChatInput(e.target.value)}
                                                placeholder="Type a message..."
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-sm font-bold placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                                            />
                                            <button 
                                                type="submit"
                                                className="absolute right-3 top-3 w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-500 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                                            >
                                                <Send size={16} fill="white" />
                                            </button>
                                        </div>
                                    </form>
                                </>
                            )}

                            {activeSidebar === 'participants' && (
                                <div className="flex-1 overflow-y-auto p-6">
                                    <div className="space-y-4">
                                        {participants?.map((p) => (
                                            <div key={p._id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center font-black italic text-lg shadow-lg">
                                                        {p.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black italic tracking-tighter uppercase leading-none mb-1">{p.name}</h4>
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{p.role}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button className="p-2 hover:bg-red-500/20 text-slate-500 hover:text-red-500 rounded-xl transition-all"><X size={16} /></button>
                                                    <button className="p-2 hover:bg-blue-500/20 text-slate-500 hover:text-blue-500 rounded-xl transition-all"><MicOff size={16} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Controls */}
            <div className="h-24 bg-black/80 backdrop-blur-3xl border-t border-white/5 flex items-center justify-between px-10 z-30">
                <div className="hidden lg:flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Time Elapsed</span>
                        <span className="text-sm font-black font-mono tracking-widest italic">00:42:15</span>
                    </div>
                </div>

                <div className="flex items-center gap-4 md:gap-6">
                    {/* Media Toggles */}
                    <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-[2rem] border border-white/5">
                        <button 
                            onClick={() => { setAudioEnabled(!audioEnabled); toggleAudio(); }}
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${audioEnabled ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-red-500 text-white shadow-lg shadow-red-500/20 ring-4 ring-red-500/10'}`}
                        >
                            {audioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
                        </button>
                        <button 
                            onClick={handleToggleVideo}
                            disabled={isRetrying}
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all relative ${videoEnabled ? 'bg-white text-black shadow-white/20 ring-4 ring-white/10' : 'bg-white/5 hover:bg-white/10 text-white'}`}
                        >
                            {isRetrying ? (
                                <div className="w-5 h-5 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
                            ) : (
                                videoEnabled ? <Video size={24} /> : <VideoOff size={24} />
                            )}
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <button className="w-14 h-14 bg-white/5 border border-white/10 hover:bg-white/10 rounded-full flex items-center justify-center transition-all group">
                            <ScreenShare size={24} className="text-slate-300 group-hover:text-white" />
                        </button>
                        <button 
                            onClick={() => setActiveSidebar(activeSidebar === 'chat' ? null : 'chat')}
                            className={`w-14 h-14 border rounded-full flex items-center justify-center transition-all relative ${activeSidebar === 'chat' ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}
                        >
                            <MessageSquare size={24} />
                            {activeSidebar !== 'chat' && <div className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full ring-2 ring-black" />}
                        </button>
                        <button 
                            onClick={() => setActiveSidebar(activeSidebar === 'participants' ? null : 'participants')}
                            className={`w-14 h-14 border rounded-full flex items-center justify-center transition-all ${activeSidebar === 'participants' ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}
                        >
                            <Users size={24} />
                        </button>
                    </div>

                    <div className="w-[1px] h-10 bg-white/10 mx-2" />

                    <button 
                        onClick={handleLeave}
                        className="h-14 px-8 bg-red-600 hover:bg-red-500 text-white rounded-[1.5rem] flex items-center justify-center gap-3 transition-all font-black tracking-widest uppercase shadow-xl shadow-red-500/20"
                    >
                        <PhoneOff size={20} />
                        <span className="hidden sm:inline">End Meeting</span>
                    </button>
                </div>

                <div className="hidden lg:flex items-center gap-6">
                   <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Signal Quality</span>
                        <div className="flex gap-1">
                            {[1,2,3,4].map(i => <div key={i} className={`w-1.5 h-3 rounded-full ${i <= 3 ? 'bg-emerald-500' : 'bg-white/10'}`} />)}
                        </div>
                   </div>
                </div>
            </div>
        </div>
    );
}
