"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSupabaseQuery, useSupabaseMutation } from "@/hooks/useSupabase";
import { useAuth } from "@/components/AuthContext";
import { useWebRTC } from "@/app/meeting/hooks/useWebRTC";
import { 
    Mic, MicOff, Video, VideoOff, ScreenShare, Share, 
    MessageSquare, Users, PhoneOff, Settings, MoreVertical, 
    Maximize, Shield, Lock, Send, X, ChevronRight, Layout,
    Volume2, Cpu, Zap, Radio, Palette,
    LayoutDashboard, Calendar, Search, Clock, Bell, ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const THEMES = {
    organiser: "from-blue-600 via-indigo-900/80 to-slate-950",
    slate: "from-slate-900 via-slate-800/20 to-black",
    forest: "from-emerald-950 via-teal-900/10 to-slate-950",
    sunset: "from-slate-950 via-rose-900/10 to-orange-950/20"
};

export default function MeetingRoom() {
    const { meetingId: meetingLink } = useParams();
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const { data: meetingData, loading: meetingLoading } = useSupabaseQuery(
        "meetings",
        (q) => q.eq("meeting_link", meetingLink).single(),
        [meetingLink]
    );
    const meeting = meetingData;

    const [joinMeeting] = useSupabaseMutation("meeting_participants", "upsert");
    const [leaveMeeting] = useSupabaseMutation("meeting_participants", "update", (q) => q.eq("meeting_id", meeting?.id).eq("user_id", user?.id));
    const [sendMessage] = useSupabaseMutation("meeting_messages", "insert");

    const { data: messages } = useSupabaseQuery(
        "meeting_messages",
        (q) => q.eq("meeting_id", meeting?.id).order("timestamp", { ascending: true }),
        [meeting?.id]
    );

    const { data: participants } = useSupabaseQuery(
        "meeting_participants",
        (q) => q.eq("meeting_id", meeting?.id).eq("status", "joined"),
        [meeting?.id]
    );

    const [isJoined, setIsJoined] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);
    const [name, setName] = useState(user?.fullName || user?.name || "");
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [activeSidebar, setActiveSidebar] = useState(null); 
    const [chatInput, setChatInput] = useState("");
    const [elapsed, setElapsed] = useState(0); 
    const [myParticipantId, setMyParticipantId] = useState(null);
    const chatEndRef = useRef(null);

    const guestId = React.useMemo(() => `guest-${Math.random().toString(36).substr(2, 5)}`, []);
    const userId = user?.email || guestId;

    const { 
        localStream, remoteStreams, toggleAudio, toggleVideo, 
        toggleScreenShare, isScreenSharing, screenStream,
        peerCount, mediaError, connectionStates, retryMedia 
    } = useWebRTC(
        meeting?.id, 
        isJoined ? myParticipantId : null,
        name || "Guest"
    );

    const localVideoRef = useRef(null);
    const hasVideo = localStream?.getVideoTracks().length > 0;

    const [mainStageId, setMainStageId] = useState(null);
    const [theme, setTheme] = useState("organiser");
    const [showThemeSelector, setShowThemeSelector] = useState(false);

    // Sync local video
    useEffect(() => {
        if (localVideoRef.current && (localStream || screenStream) && hasVideo) {
            localVideoRef.current.srcObject = isScreenSharing && screenStream ? screenStream : localStream;
        }
    }, [localStream, videoEnabled, isJoined, hasVideo, isScreenSharing, screenStream]);

    useEffect(() => {
        if (activeSidebar === 'chat') {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, activeSidebar]);

    useEffect(() => {
        if (!isJoined) return;
        const interval = setInterval(() => setElapsed(s => s + 1), 1000);
        return () => clearInterval(interval);
    }, [isJoined]);

    // Auto switch main stage to the first remote user when they join, if you're currently staring at yourself
    useEffect(() => {
        const myId = myParticipantId || userId;
        if ((!mainStageId || mainStageId === myId) && !isScreenSharing && Object.keys(remoteStreams).length > 0) {
           setMainStageId(Object.keys(remoteStreams)[0]);
        } else if (mainStageId && mainStageId !== myId && !remoteStreams[mainStageId]) {
           setMainStageId(myId);
        } else if (!mainStageId) {
           setMainStageId(myId);
        }
    }, [remoteStreams, isScreenSharing, userId, mainStageId, myParticipantId]);

    const formatElapsed = (secs) => {
        const h = Math.floor(secs / 3600).toString().padStart(2, '0');
        const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    // Global Audio Context Auto-Resume on first interaction
    useEffect(() => {
        const resumeAudio = () => {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                const ctx = new AudioContext();
                if (ctx.state === 'suspended') ctx.resume();
            }
            window.removeEventListener('click', resumeAudio);
            window.removeEventListener('touchstart', resumeAudio);
        };
        window.addEventListener('click', resumeAudio);
        window.addEventListener('touchstart', resumeAudio);
        return () => {
            window.removeEventListener('click', resumeAudio);
            window.removeEventListener('touchstart', resumeAudio);
        };
    }, []);

    const handleJoin = async () => {
        if (!meeting) return;
        if (!name.trim()) setName("Guest");
        
        try {
            // Aggressive Safari Audio Recovery
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                const ctx = new AudioContext();
                if (ctx.state === 'suspended') await ctx.resume();
            }
            // Explicitly unmute all audio elements
            document.querySelectorAll('video').forEach(v => {
                v.muted = false;
                v.play().catch(() => {});
            });
        } catch (e) {
            console.warn("Could not resume AudioContext:", e);
        }

        const payload = {
            meeting_id: meeting.id,
            user_id: user?.id || userId, 
            name: name || "Guest",
            role: (meeting.creator_id && user?.email && meeting.creator_id === user?.email) ? "host" : "participant",
            status: "joined",
            joined_at: new Date().toISOString()
        };

        const result = await joinMeeting(payload);
        if (result.success) {
            setMyParticipantId(user?.id || userId);
            setIsJoined(true);
        }
    };

    const handleRetry = async () => {
        setIsRetrying(true);
        try {
            await retryMedia(true);
        } finally {
            setIsRetrying(false);
        }
    };

    const handleToggleAudio = () => {
        const newState = toggleAudio();
        setAudioEnabled(newState);
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
            const newState = toggleVideo();
            setVideoEnabled(newState);
        }
    };

    const handleToggleScreenShare = async () => {
        const isNowSharing = await toggleScreenShare();
        if (isNowSharing) {
            setMainStageId(userId); // Focus on yourself to see the screen share
        }
    };

    const handleLeave = async () => {
        if (meeting) {
            await leaveMeeting({ 
                status: "left", 
                left_at: new Date().toISOString() 
            });
        }
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
            meeting_id: meeting.id,
            sender_id: user?.id || userId,
            sender_name: name || "Guest",
            text: chatInput,
            timestamp: new Date().toISOString()
        });
        setChatInput("");
    };

    // ----------------------------------------------------
    // STABLE VIDEO COMPONENT (Fixes Blinking & Mobile Auto-Play Bug)
    // ----------------------------------------------------
    const StableVideo = ({ stream, isLocal, isScreenSharing, isBackdrop = false, className = "", videoClasses = "" }) => {
        const videoRef = useRef(null);
        // Force remote video to start muted for Mobile Auto-Play compliance.
        const [isMuted, setIsMuted] = useState(true);

        useEffect(() => {
            // Local video doesn't need to be muted by browser policy, but we might want it for feedback
            setIsMuted(isLocal || isBackdrop || !isLocal);
        }, [isLocal, isBackdrop]);

        useEffect(() => {
            if (videoRef.current && stream) {
                const video = videoRef.current;
                if (video.srcObject !== stream) {
                    video.srcObject = stream;
                    video.load();
                }
                
                const playVideo = () => {
                    video.play().catch(e => {
                        console.warn("Retrying video play...", e);
                        setTimeout(playVideo, 1500);
                    });
                };
                playVideo();

                // Playback Watchdog: Fixes "Black Screen" on mobile if video gets stuck
                let lastTime = 0;
                let stuckCount = 0;
                const checkStatus = setInterval(() => {
                    if (video.paused) {
                        video.play().catch(() => {});
                    } else if (video.currentTime === lastTime && video.currentTime > 0) {
                        stuckCount++;
                        if (stuckCount > 3) { // Stuck for ~3 seconds
                            console.warn("Video watchdog detected stuck stream. Reloading...");
                            video.load();
                            video.play().catch(() => {});
                            stuckCount = 0;
                        }
                    } else {
                        lastTime = video.currentTime;
                        stuckCount = 0;
                    }
                }, 1000);

                return () => clearInterval(checkStatus);
            }
        }, [stream]);

        const handleClick = (e) => {
            // Attempt to resume audio context on any video click
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                const ctx = new AudioContext();
                if (ctx.state === 'suspended') ctx.resume();
            }

            if (!isLocal && isMuted) {
                setIsMuted(false);
            }
        };

        return (
            <div className={`relative overflow-hidden ${className}`} onClick={handleClick}>
                <video 
                    ref={videoRef}
                    autoPlay 
                    playsInline
                    muted={isMuted}
                    className={`w-full h-full ${videoClasses || 'object-contain'}`}
                    style={{ transform: (isLocal && !isScreenSharing) ? 'scaleX(-1)' : 'none' }}
                />
                {!isLocal && isMuted && !isBackdrop && (
                    <button className="absolute inset-0 flex items-center justify-center bg-black/40 text-white gap-2 pointer-events-none group-hover:pointer-events-auto">
                        <Volume2 size={24} />
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-[10px] font-black uppercase tracking-widest bg-black px-3 py-1.5 rounded-full border border-white/20">Tap to Unmute</span>
                        </div>
                    </button>
                )}
            </div>
        );
    };

    // Generic Video Element Renderer
    const renderVideoElement = (stream, isLocal, extraClasses = "") => {
        return (
            <div className={`relative w-full h-full overflow-hidden flex items-center justify-center ${extraClasses}`}>
                {/* Cinematic Ambient Backdrop */}
                <StableVideo 
                    stream={stream}
                    isLocal={isLocal}
                    isScreenSharing={isScreenSharing}
                    isBackdrop={true}
                    className="absolute inset-0 w-full h-full object-cover filter blur-3xl opacity-40 scale-125 saturate-200 pointer-events-none"
                />
                
                {/* Foreground crisp video */}
                <StableVideo 
                    stream={stream}
                    isLocal={isLocal}
                    isScreenSharing={isScreenSharing}
                    className="relative z-10 w-full h-full drop-shadow-2xl"
                    videoClasses="object-cover md:object-contain"
                />
            </div>
        );
    };

    if (authLoading || meetingLoading || meeting === undefined) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!meeting || meeting.isExpired) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
                <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-[2rem] flex items-center justify-center mb-8 border border-amber-500/20 shadow-2xl">
                    <Clock size={40} className="animate-pulse" />
                </div>
                <h1 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase italic">Event Concluded</h1>
                <p className="text-slate-400 mb-10 max-w-sm font-bold text-sm uppercase tracking-widest leading-relaxed">
                    {!meeting ? `The meeting code ${meetingLink} is invalid.` : `The virtual event "${meeting.title}" has successfully concluded.`}
                </p>
                <Link href="/" className="px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:scale-105 transition-all shadow-2xl shadow-blue-500/30 active:scale-95 border border-white/10">
                    Explore Other Events
                </Link>
            </div>
        );
    }

    // ----------------------------------------------------
    // EXTERNAL MEETING REDIRECTOR
    // ----------------------------------------------------
    if (meeting.meetingType === "external" && !isJoined) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-lg bg-slate-50 border border-slate-200 rounded-[3rem] p-12 shadow-2xl"
                >
                    <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl rotate-3">
                        <Radio size={40} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 mb-2 uppercase italic tracking-tighter">{meeting.title}</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-8">External Virtual Experience</p>
                    
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-10 text-left">
                        <div className="flex items-center gap-3 mb-4">
                            <Shield size={18} className="text-emerald-500" />
                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-700">Safe Access Protocol</span>
                        </div>
                        <p className="text-slate-400 text-xs font-medium leading-relaxed">You are about to join an external meeting platform (Zoom/Teams/Meet). Please ensure you have the necessary application installed.</p>
                    </div>

                    <a 
                        href={meeting.externalMeetingUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-[0.3em] text-xs hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                    >
                        Launch External App
                    </a>
                    
                    <button 
                        onClick={() => router.push("/")}
                        className="mt-6 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        Cancel and Return
                    </button>
                </motion.div>
            </div>
        );
    }

    // ----------------------------------------------------
    // PRE-JOIN SCREEN (Streamlined Entry)
    // ----------------------------------------------------
    if (!isJoined) {
        return (
            <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-[#f8fafc]">
                {/* Background Video Blur Layer */}
                <div className="absolute inset-0 opacity-[0.05] filter blur-3xl scale-110 pointer-events-none">
                     {(videoEnabled || isScreenSharing) && localStream && hasVideo && renderVideoElement(isScreenSharing ? screenStream : localStream, true)}
                </div>
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="relative z-10 w-full max-w-4xl bg-white border border-slate-200 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col md:flex-row"
                >
                    {/* Left side: Standard Square Video Feed */}
                    <div className="flex-[1.2] p-6 md:p-10">
                        <div className="w-full aspect-square md:aspect-video rounded-[2rem] bg-slate-100 border border-slate-200 overflow-hidden relative shadow-2xl group">
                             {videoEnabled && localStream && hasVideo ? (
                                 <StableVideo 
                                    stream={localStream}
                                    isLocal={true}
                                    isScreenSharing={isScreenSharing}
                                    className="w-full h-full"
                                    videoClasses="object-cover"
                                 />
                             ) : (
                                 <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50">
                                     <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl">
                                         <VideoOff size={32} className="text-slate-200" />
                                     </div>
                                     <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Camera Off</span>
                                 </div>
                             )}

                             <div className="absolute bottom-6 left-0 right-0 flex gap-4 justify-center pointer-events-none">
                                <button 
                                    onClick={handleToggleAudio}
                                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg border pointer-events-auto backdrop-blur-md ${
                                        audioEnabled 
                                            ? 'bg-black/50 border-white/10 hover:bg-black/70 text-white' 
                                            : 'bg-red-500 border-red-500 hover:bg-red-600 text-white shadow-xl'
                                    }`}
                                >
                                    {audioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
                                </button>
                                <button 
                                    onClick={handleToggleVideo}
                                    disabled={isRetrying}
                                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg border pointer-events-auto backdrop-blur-md ${
                                        videoEnabled && hasVideo
                                            ? 'bg-black/50 border-white/10 hover:bg-black/70 text-white'
                                            : 'bg-red-500 border-red-500 hover:bg-red-600 text-white'
                                    }`}
                                >
                                    {isRetrying ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        videoEnabled && hasVideo ? <Video size={24} /> : <VideoOff size={24} />
                                    )}
                                </button>
                             </div>
                        </div>
                    </div>

                    {/* Right side: Event details & Join Meeting */}
                    <div className="w-full md:w-[380px] p-6 md:p-10 md:pl-6 flex flex-col items-center justify-center">
                        <Link href="/">
                            <img 
                                src="/logo.png" 
                                alt="BookMyTicket" 
                                className="h-16 md:h-20 object-contain mb-8 hover:scale-105 transition-transform" 
                            />
                        </Link>
                        <h1 className="text-2xl font-black text-slate-900 text-center mb-1">{meeting.title}</h1>
                        <p className="text-sm text-slate-500 font-semibold mb-8 text-center">{peerCount} joining</p>

                        <input 
                            type="text" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your display name"
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 mb-8 text-sm font-bold transition-all text-center placeholder:text-slate-400"
                        />

                        <button 
                            onClick={handleJoin}
                            className="w-full py-4 text-white rounded-[1.25rem] font-black uppercase tracking-widest text-sm transition-all shadow-[0_10px_30px_-10px_rgba(59,130,246,0.5)] active:scale-[0.98] hover:shadow-[0_10px_30px_-10px_rgba(59,130,246,0.7)] mt-auto md:mt-0"
                            style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' }}
                        >
                            Join Meeting
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // ----------------------------------------------------
    // IN-MEETING SCREEN (Dashboard UI Mode)
    // ----------------------------------------------------
    // IN-MEETING SCREEN (Dashboard UI Mode - Organiser Panel Style)
    // ----------------------------------------------------
    return (
        <div 
            onClick={() => {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) {
                    const ctx = new AudioContext();
                    if (ctx.state === 'suspended') ctx.resume();
                }
            }}
            className={`flex h-[100dvh] bg-gradient-to-br transition-all duration-1000 ${THEMES[theme]} font-sans text-slate-800 selection:bg-blue-500/20 overflow-hidden relative`}
        >
            {/* MAIN CONTENT AREA (Now Entirely Clean with Dynamic Background) */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* DASHBOARD BODY (Meeting Logic) */}
                <div className="flex-1 lg:p-10 overflow-hidden flex flex-col lg:flex-row gap-8 items-stretch relative">
                    
                    {/* PRIMARY WHITE CARD: Meeting Stage (Immersive on Mobile) */}
                    <div className="flex-[3] bg-transparent lg:bg-white lg:rounded-3xl lg:border lg:border-slate-200/50 lg:shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-0 lg:p-8 flex flex-col relative overflow-hidden group lg:backdrop-blur-sm">
                        <div className="hidden lg:flex items-center justify-between mb-6 shrink-0">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">{meeting.title}</h2>
                                    <div className="px-3 py-1 bg-slate-50 border border-slate-200 text-slate-500 rounded-lg text-xs font-semibold shadow-sm">
                                        Active • {formatElapsed(elapsed)}
                                    </div>
                                </div>
                                <p className="text-[13px] font-medium text-slate-400 mt-1 uppercase tracking-widest">Virtual Environment Management</p>
                            </div>
                        </div>

                        {/* Standard Meeting Grid (Zoom/Teams/Meet Style Mobile Redesign) */}
                        <div className="flex-1 lg:rounded-2xl overflow-hidden bg-slate-950 flex flex-col relative min-h-0">
                            {/* The Dynamic Grid Container - ALWAYS includes local + remotes */}
                            <div className={`flex-1 grid gap-1 sm:gap-2 p-1 sm:p-2 ${
                                (Object.keys(remoteStreams).length + 1) <= 1 ? 'grid-cols-1' :
                                (Object.keys(remoteStreams).length + 1) === 2 ? 'grid-cols-1 grid-rows-2 sm:grid-cols-2 sm:grid-rows-1' :
                                'grid-cols-2'
                            } auto-rows-fr overflow-y-auto custom-scrollbar`}>
                                
                                {/* 0. Screen Share Tile (Priority full width if active) */}
                                {isScreenSharing && screenStream && (
                                    <div className="col-span-full relative rounded-xl sm:rounded-2xl overflow-hidden bg-slate-900 border-2 border-blue-500 shadow-2xl aspect-video sm:aspect-auto">
                                        <StableVideo 
                                            stream={screenStream}
                                            isLocal={true}
                                            isScreenSharing={true}
                                            className="w-full h-full"
                                            videoClasses="object-contain"
                                        />
                                        <div className="absolute top-2 left-2 bg-blue-600 backdrop-blur-md px-2 py-1 rounded-lg text-[8px] font-black uppercase text-white tracking-widest border border-white/20">
                                            Your Screen
                                        </div>
                                    </div>
                                )}

                                {/* 1. Your Camera Tile (ALWAYS PRESENT TO MAINTAIN GRID STABILITY) */}
                                <div className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-slate-900 border border-white/5 shadow-2xl aspect-square sm:aspect-auto group">
                                    {videoEnabled && localStream && hasVideo ? (
                                        <StableVideo 
                                            stream={localStream}
                                            isLocal={true}
                                            isScreenSharing={isScreenSharing}
                                            className="w-full h-full"
                                            videoClasses="object-cover"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-700/40 rounded-full flex items-center justify-center text-slate-400 mb-3 border border-slate-600/30 shadow-inner">
                                                <Users size={32} />
                                            </div>
                                            <span className="text-[10px] sm:text-xs font-black uppercase text-slate-500 tracking-[0.2em]">You</span>
                                        </div>
                                    )}
                                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-white flex items-center border border-white/10 shadow-lg">
                                        You {!audioEnabled && <MicOff size={11} className="text-red-400 ml-2" />}
                                    </div>
                                </div>

                                {/* 2. Remote Tiles */}
                                {Object.entries(remoteStreams).map(([peerId, { stream, name }]) => (
                                    <div key={peerId} className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-slate-900 border border-white/5 shadow-2xl aspect-square sm:aspect-auto">
                                        <StableVideo 
                                            stream={stream}
                                            isLocal={false}
                                            isScreenSharing={false}
                                            className="w-full h-full"
                                            videoClasses="object-cover"
                                        />
                                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-white flex items-center border border-white/10 max-w-[85%] shadow-lg">
                                            <span className="truncate uppercase tracking-wider">{name}</span>
                                            {stream.getAudioTracks()?.length > 0 && !stream.getAudioTracks()[0].enabled && <MicOff size={11} className="text-red-400 ml-2 shrink-0" />}
                                        </div>
                                        {connectionStates[peerId] && (connectionStates[peerId] === 'failed' || connectionStates[peerId] === 'disconnected') && (
                                            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-4 text-center">
                                                <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-3" />
                                                <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest animate-pulse">Recovering Connection...</span>
                                            </div>
                                        )}
                                        {connectionStates[peerId] && connectionStates[peerId] !== 'connected' && connectionStates[peerId] !== 'failed' && connectionStates[peerId] !== 'disconnected' && (
                                            <div className="absolute top-2 right-2 bg-slate-900/60 backdrop-blur-md px-2 py-1 rounded-lg text-[8px] font-black text-white uppercase tracking-tighter shadow-xl border border-white/20">
                                                {connectionStates[peerId]}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Dashboard Controls (Hidden on Mobile, replaced by floating bar) */}
                        <div className="hidden lg:flex mt-8 justify-between items-center bg-transparent relative">
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => { setAudioEnabled(!audioEnabled); toggleAudio(); }}
                                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all border shadow-sm ${
                                        audioEnabled ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-blue-300' : 'bg-red-500 border-red-500 text-white shadow-red-200'
                                    }`}
                                >
                                    {audioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                                </button>
                                <button 
                                    onClick={handleToggleVideo}
                                    disabled={isRetrying}
                                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all border shadow-sm ${
                                        videoEnabled && hasVideo ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-blue-300' : 'bg-red-500 border-red-500 text-white shadow-red-200'
                                    }`}
                                >
                                    {isRetrying ? (
                                        <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                                    ) : (
                                        videoEnabled && hasVideo ? <Video size={20} /> : <VideoOff size={20} />
                                    )}
                                </button>
                                <div className="w-px h-8 bg-slate-200 my-auto mx-2" />
                                <button 
                                    onClick={() => setActiveSidebar(activeSidebar === 'chat' ? null : 'chat')}
                                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all border shadow-sm ${
                                        activeSidebar === 'chat' ? 'bg-blue-600 border-blue-600 text-white shadow-blue-200' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-blue-300'
                                    }`}
                                >
                                    <MessageSquare size={20} />
                                </button>
                                <button 
                                    onClick={() => setActiveSidebar(activeSidebar === 'participants' ? null : 'participants')}
                                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all border shadow-sm ${
                                        activeSidebar === 'participants' ? 'bg-blue-600 border-blue-600 text-white shadow-blue-200' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-blue-300'
                                    }`}
                                >
                                    <Users size={20} />
                                </button>
                                <div className="w-px h-8 bg-slate-200 my-auto mx-2" />
                                <button 
                                    onClick={handleToggleScreenShare}
                                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all border shadow-sm ${
                                        isScreenSharing ? 'bg-gradient-to-br from-blue-500 to-purple-600 border-transparent text-white shadow-blue-200' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-blue-300'
                                    }`}
                                >
                                    <ScreenShare size={20} />
                                </button>
                                
                                {/* Theme Switcher Button */}
                                <div className="relative">
                                    <button 
                                        onClick={() => setShowThemeSelector(!showThemeSelector)}
                                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all border bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-blue-300 shadow-sm`}
                                    >
                                        <Palette size={20} />
                                    </button>
                                    <AnimatePresence>
                                        {showThemeSelector && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute bottom-full mb-4 left-0 bg-white border border-slate-200 rounded-2xl p-2 shadow-2xl z-50 min-w-[140px]"
                                            >
                                                {Object.keys(THEMES).map(t => (
                                                    <button 
                                                        key={t} 
                                                        onClick={() => { setTheme(t); setShowThemeSelector(false); }} 
                                                        className={`w-full px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.1em] rounded-xl transition-all text-left ${theme === t ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                                                    >
                                                        {t}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <button 
                                onClick={handleLeave}
                                className="h-12 sm:h-14 px-6 sm:px-8 bg-red-600 hover:bg-red-700 text-white rounded-2xl flex items-center justify-center gap-3 transition-all font-black tracking-widest uppercase text-xs shadow-lg shadow-red-600/20 active:scale-95"
                            >
                                <PhoneOff size={18} />
                                Leave
                            </button>
                        </div>
                    </div>                     <div className="lg:hidden fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-900/60 backdrop-blur-2xl px-6 py-3 rounded-full border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-50">
                        <button 
                            onClick={handleToggleAudio}
                            className={`p-3 rounded-full transition-all ${
                                audioEnabled ? 'text-white' : 'bg-red-500 text-white shadow-md shadow-red-500/30'
                            }`}
                        >
                            {audioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                        </button>
                        <button 
                            onClick={handleToggleVideo}
                            disabled={isRetrying}
                            className={`p-3 rounded-full transition-all ${
                                videoEnabled && hasVideo ? 'text-white' : 'bg-red-500 text-white shadow-md shadow-red-500/30'
                            }`}
                        >
                            {isRetrying ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                videoEnabled && hasVideo ? <Video size={20} /> : <VideoOff size={20} />
                            )}
                        </button>
                        <div className="w-px h-6 bg-white/10 mx-1" />
                        <button 
                            onClick={() => setActiveSidebar(activeSidebar === 'chat' ? null : 'chat')}
                            className={`p-3 rounded-full transition-all ${
                                activeSidebar === 'chat' ? 'text-blue-400' : 'text-white'
                            }`}
                        >
                            <MessageSquare size={20} />
                        </button>
                        <button 
                            onClick={() => setActiveSidebar(activeSidebar === 'participants' ? null : 'participants')}
                            className={`p-3 rounded-full transition-all ${
                                activeSidebar === 'participants' ? 'text-blue-400' : 'text-white'
                            }`}
                        >
                            <Users size={20} />
                        </button>
                        <div className="w-px h-6 bg-white/10 mx-1" />
                        <button 
                            onClick={handleLeave}
                            className="p-3 bg-red-600 text-white rounded-full shadow-lg active:scale-95 transition-transform"
                        >
                            <PhoneOff size={20} />
                        </button>
                    </div>

                    {/* TOGGLEABLE INTERACTION PANEL CARD */}
                    <AnimatePresence mode="wait">
                        {activeSidebar && (
                            <motion.div 
                                initial={{ opacity: 0, x: 20, width: 0 }}
                                animate={{ opacity: 1, x: 0, width: "100%", maxWidth: "400px" }}
                                exit={{ opacity: 0, x: 20, width: 0 }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="fixed lg:relative inset-x-4 bottom-28 lg:inset-auto lg:flex-1 lg:min-w-[320px] lg:max-w-[400px] bg-white lg:bg-white/80 rounded-3xl border border-slate-200 shadow-2xl lg:shadow-none flex flex-col h-[450px] lg:h-auto overflow-hidden p-6 gap-6 backdrop-blur-xl lg:backdrop-blur-sm relative z-40"
                            >
                                {activeSidebar === 'participants' ? (
                                    <>
                                        <div className="flex items-center justify-between shrink-0">
                                            <h3 className="text-[17px] font-bold text-slate-800 tracking-tight">Active Participants</h3>
                                            <div className="flex items-center gap-2">
                                                <div className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest">{peerCount + 1} LIVE</div>
                                                <Users size={16} className="text-slate-400" />
                                            </div>
                                        </div>

                                        {/* Participants List */}
                                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                                            {/* Local User - Restored so it shows when sharing */}
                                            {(mainStageId !== (myParticipantId || userId) || isScreenSharing) && (
                                                <div 
                                                    onClick={() => setMainStageId(myParticipantId || userId)}
                                                    className="w-full aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 hover:border-blue-300 cursor-pointer transition-all relative group shadow-sm bg-slate-900"
                                                >
                                                    {videoEnabled && localStream && hasVideo ? (
                                                            <StableVideo 
                                                                stream={localStream}
                                                                isLocal={true}
                                                                isScreenSharing={false}
                                                                className="w-full h-full object-cover"
                                                            />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300"><VideoOff size={24} /></div>
                                                    )}
                                                    <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-bold text-slate-700 flex items-center border border-slate-100 shadow-sm">
                                                        You {!audioEnabled && <MicOff size={10} className="text-red-500 ml-1.5" />}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Remote Users */}
                                            <AnimatePresence>
                                                {Object.entries(remoteStreams).filter(([id]) => id !== mainStageId).map(([peerId, { stream, name }]) => (
                                                    <div
                                                        key={peerId}
                                                        onClick={() => setMainStageId(peerId)}
                                                        className="w-full aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 hover:border-blue-300 cursor-pointer transition-all relative group shadow-sm"
                                                    >
                                                        {renderVideoElement(stream, false)}
                                                        <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-bold text-slate-700 flex items-center max-w-[90%] border border-slate-100 shadow-sm">
                                                            <span className="truncate uppercase tracking-wider">{name}</span>
                                                            {stream.getAudioTracks()?.length > 0 && !stream.getAudioTracks()[0].enabled && <MicOff size={10} className="text-red-500 ml-1.5 shrink-0" />}
                                                        </div>
                                                    </div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    </>
                                ) : (
                                    /* Chat Strip */
                                    <div className="flex flex-col h-full shrink-0 overflow-hidden">
                                        <div className="pb-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-500 flex items-center justify-center border border-pink-100">
                                                    <MessageSquare size={14} />
                                                </div>
                                                <div>
                                                    <h3 className="text-xs font-bold text-slate-800 tracking-tight">Team Chat</h3>
                                                    <p className="text-[10px] font-semibold text-slate-500 tracking-wider">Live interaction mode</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto py-4 space-y-4 bg-transparent min-h-0 custom-scrollbar">
                                            {messages?.map((msg) => (
                                                <div key={msg.id} className={`flex flex-col ${msg.sender_id === (user?.id || userId) ? 'items-end' : 'items-start'}`}>
                                                    <div className={`max-w-[95%] px-3.5 py-2.5 rounded-2xl text-[13px] font-medium leading-relaxed border shadow-sm ${
                                                        msg.sender_id === (user?.id || userId) 
                                                        ? 'bg-blue-600 text-white rounded-tr-sm border-transparent' 
                                                        : 'bg-white border-slate-200 text-slate-700 rounded-tl-sm'
                                                    }`}>
                                                        {msg.text}
                                                    </div>
                                                    <span className={`text-[9px] font-bold text-slate-400 mt-1 px-1 ${msg.sender_id === (user?.id || userId) ? 'text-right' : 'text-left'}`}>
                                                        {msg.sender_id === (user?.id || userId) ? 'You' : msg.sender_name} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            ))}
                                            <div ref={chatEndRef} />
                                        </div>
                                        <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-100 shrink-0">
                                            <div className="relative flex items-center">
                                                <input 
                                                    type="text" 
                                                    value={chatInput}
                                                    onChange={(e) => setChatInput(e.target.value)}
                                                    placeholder="Type something..."
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-4 pr-10 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                                                />
                                                <button 
                                                    type="submit"
                                                    className="absolute right-1.5 w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-all shadow-sm"
                                                >
                                                    <Send size={12} fill="white" />
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #e2e8f0;
                    border-radius: 4px;
                }
            `}</style>
        </div>
    );
}

