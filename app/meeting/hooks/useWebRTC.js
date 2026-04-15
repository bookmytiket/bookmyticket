"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSupabaseQuery, useSupabaseMutation } from "@/hooks/useSupabase";

const STUN_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" },
    ],
};

export function useWebRTC(meetingId, userId, name) {
    const [localStream, setLocalStream] = useState(null);
    const [mediaError, setMediaError] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState({}); // { userId: { stream: MediaStream, name: string } }
    const pcs = useRef({}); // { userId: RTCPeerConnection }
    const iceQueues = useRef({}); // { userId: RTCIceCandidate[] }
    const processedSignals = useRef(new Set());
    const [peerCount, setPeerCount] = useState(0);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [connectionStates, setConnectionStates] = useState({}); // { userId: connectionState }
    const screenStreamRef = useRef(null);

    // 0. Persistence & Self-Healing Refs
    const lastSignalTimestamp = useRef(0);
    const retryCount = useRef({}); // { userId: number }
    const pcStates = useRef({}); // { userId: string }
    const sessionStartTime = useRef(Date.now());
    
    // Standard WebRTC State Machine (Prevents Glare/Blinking)
    const makingOffer = useRef({}); // { userId: boolean }
    const isSettingRemoteDescription = useRef({}); // { userId: boolean }
    const ignoreOffer = useRef({}); // { userId: boolean }

    const [sendSignal] = useSupabaseMutation("signals", "insert");
    const { data: signals } = useSupabaseQuery(
        "signals",
        (q) => q.eq("meeting_id", meetingId).eq("receiver_id", userId),
        [meetingId, userId]
    );
    const { data: activeParticipants } = useSupabaseQuery(
        "meeting_participants",
        (q) => q.eq("meeting_id", meetingId).eq("status", "joined"),
        [meetingId]
    );

    const localStreamRef = useRef(null);
    const isAcquiring = useRef(false);

    const setStream = useCallback((stream) => {
        localStreamRef.current = stream;
        setLocalStream(stream);
    }, []);

    // 1. Initialize Local Stream with Smart Fallback
    const getMedia = useCallback(async (isRetry = false) => {
        if (isAcquiring.current) return null;
        isAcquiring.current = true;

        try {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
                setStream(null);
            }

            if (isRetry) await new Promise(r => setTimeout(r, 1200));

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                });
                setStream(stream);
                setMediaError(null);
                return stream;
            } catch (err) {
                console.error("Primary media attempt failed:", err);
                if (err.name === "NotReadableError" || err.name === "NotFoundError" || err.name === "NotAllowedError") {
                    // Fallback to audio-only if camera is blocked/busy
                    try {
                        const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
                            video: false,
                            audio: true,
                        });
                        setStream(audioOnlyStream);
                        setMediaError("camera_busy_audio_only");
                        return audioOnlyStream;
                    } catch (audioErr) {
                        setMediaError("hardware_blocked_all");
                        setStream(null);
                        return null;
                    }
                }
                setMediaError(err.name);
                return null;
            }
        } finally {
            isAcquiring.current = false;
        }
    }, [setStream]);

    useEffect(() => {
        getMedia();
        return () => {
            localStreamRef.current?.getTracks().forEach(track => track.stop());
            Object.values(pcs.current).forEach(pc => pc.close());
        };
    }, []);

    // 1.5. Clean Identity Switch (Fixes Mobile Black Screen)
    // When userId changes (lobby -> joined), reset all connections to avoid stale signaling
    useEffect(() => {
        if (!userId) return;
        
        console.log("Switching identity or re-initializing with ID:", userId);
        
        // Close all existing PeerConnections
        Object.keys(pcs.current).forEach(id => {
            pcs.current[id].close();
            delete pcs.current[id];
        });
        
        // Clear remote streams/queues to force fresh handshake
        setRemoteStreams({});
        setPeerCount(0);
        iceQueues.current = {};
        processedSignals.current = new Set();
        
    }, [userId]);

    // Helper: Drain ICE Candidate Queue
    const drainIceQueue = useCallback(async (remoteUserId) => {
        const pc = pcs.current[remoteUserId];
        const queue = iceQueues.current[remoteUserId];
        if (!pc || !queue || pc.remoteDescription === null) return;

        while (queue.length > 0) {
            const candidate = queue.shift();
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
                console.log(`Successfully added buffered ICE candidate for ${remoteUserId}`);
            } catch (err) {
                console.error(`Error adding buffered ICE candidate for ${remoteUserId}:`, err);
            }
        }
    }, []);

    const createPeerConnection = useCallback((remoteUserId, remoteName, isInitiator) => {
        if (pcs.current[remoteUserId]) return pcs.current[remoteUserId];

        console.log(`Creating Hardened PeerConnection for ${remoteName} (${remoteUserId}), initiator: ${isInitiator}`);
        const pc = new RTCPeerConnection(STUN_SERVERS);
        pcs.current[remoteUserId] = pc;
        iceQueues.current[remoteUserId] = [];
        
        // Initialize state machine for this participant
        makingOffer.current[remoteUserId] = false;
        isSettingRemoteDescription.current[remoteUserId] = false;
        ignoreOffer.current[remoteUserId] = false;

        // Add local tracks BEFORE creating offer
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current);
            });
        }

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                sendSignal({
                    meeting_id: meetingId,
                    sender_id: userId,
                    receiver_id: remoteUserId,
                    type: "ice-candidate",
                    data: JSON.stringify(event.candidate),
                    timestamp: new Date().toISOString()
                });
            }
        };

        pc.ontrack = (event) => {
            console.log(`Received track from ${remoteName}:`, event.track.kind);
            const stream = event.streams[0] || new MediaStream([event.track]);
            
            // Anti-Flicker: Only update if the stream or principal track has changed
            setRemoteStreams(prev => {
                const current = prev[remoteUserId];
                if (current && current.stream.id === stream.id) return prev;
                return {
                    ...prev,
                    [remoteUserId]: { stream, name: remoteName }
                };
            });
            setPeerCount(Object.keys(pcs.current).length);
        };

        pc.onconnectionstatechange = () => {
            const state = pc.connectionState;
            console.log(`[Hardened Connection] ${remoteName}: ${state}`);
            pcStates.current[remoteUserId] = state;
            
            setConnectionStates(prev => ({
                ...prev,
                [remoteUserId]: state
            }));

            // Self-Healing: Trigger ICE Restart if connection stays failed/disconnected
            if (state === 'failed' || (state === 'disconnected' && !isInitiator)) {
                const count = (retryCount.current[remoteUserId] || 0) + 1;
                retryCount.current[remoteUserId] = count;
                
                if (count <= 3) {
                    console.warn(`Attempting ICE Restart for ${remoteName} (Attempt ${count})`);
                    pc.restartIce();
                }
            }

            if (state === 'connected') {
                retryCount.current[remoteUserId] = 0;
            }

            if (state === 'closed') {
                setRemoteStreams(prev => {
                    const next = { ...prev };
                    delete next[remoteUserId];
                    return next;
                });
                setPeerCount(prev => Math.max(0, prev - 1));
            }
        };

        pc.onnegotiationneeded = async () => {
            try {
                makingOffer.current[remoteUserId] = true;
                const offer = await pc.createOffer();
                if (pc.signalingState !== "stable") return;
                await pc.setLocalDescription(offer);
                sendSignal({
                    meeting_id: meetingId,
                    sender_id: userId,
                    receiver_id: remoteUserId,
                    type: "offer",
                    data: JSON.stringify(pc.localDescription),
                    timestamp: new Date().toISOString()
                });
            } catch (err) {
                console.error("Negotiation failed:", err);
            } finally {
                makingOffer.current[remoteUserId] = false;
            }
        };

        return pc;
    }, [meetingId, userId, sendSignal]);

    // 2. Sync with Participants
    useEffect(() => {
        if (!activeParticipants || !localStream || !userId) return;

        activeParticipants.forEach(participant => {
            // Using participant.user_id or participant.id for uniqueness
            const pId = participant.user_id || participant.id;
            if (pId !== userId && !pcs.current[pId]) {
                // Determine initiator based on ID comparison (Lexicographical)
                const isInitiator = userId < pId;
                createPeerConnection(pId, participant.name, isInitiator);
            }
        });

        // Cleanup stale connections
        Object.keys(pcs.current).forEach(pId => {
            if (!activeParticipants.find(p => (p.user_id || p.id) === pId)) {
                pcs.current[pId].close();
                delete pcs.current[pId];
                delete iceQueues.current[pId];
                setRemoteStreams(prev => {
                    const next = { ...prev };
                    delete next[pId];
                    return next;
                });
                setPeerCount(prev => Math.max(0, prev - 1));
            }
        });
    }, [activeParticipants, localStream, userId, createPeerConnection]);

    // 3. Robust Signaling Loop
    useEffect(() => {
        if (!signals || !localStream || !userId) return;

        // Sort signals by timestamp to ensure correct order (Offer -> Answer -> ICE)
        const sortedSignals = [...signals].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        sortedSignals.forEach(async (signal) => {
            const { sender_id: senderId, type, data, timestamp } = signal;
            const signalTimestamp = new Date(timestamp).getTime();
            
            // 0. SIGNAL SYNC GUARD (Fixes Zombie Handshakes & Flickering)
            // Ignore signals older than the session start or the last processed signal
            if (signalTimestamp < sessionStartTime.current || signalTimestamp <= lastSignalTimestamp.current) {
                console.log(`Skipping stale signal from ${senderId}`);
                return;
            }
            lastSignalTimestamp.current = signalTimestamp;

            const remoteParticipant = activeParticipants?.find(p => (p.user_id || p.id) === senderId);
            const remoteName = remoteParticipant?.name || "Guest";
            
            let pc = pcs.current[senderId];
            if (!pc && (type === "offer" || type === "ice-candidate")) {
                // Initiator logic based on ID comparison
                const isInitiator = userId < senderId;
                pc = createPeerConnection(senderId, remoteName, isInitiator);
            }

            if (!pc) return;

            try {
                if (type === "offer") {
                    const offer = JSON.parse(data);
                    const offerCollision = makingOffer.current[senderId] || pc.signalingState !== "stable";
                    
                    // initiator in this context is the side with the higher ID
                    const isInitiator = userId < senderId;
                    ignoreOffer.current[senderId] = !isInitiator && offerCollision;
                    if (ignoreOffer.current[senderId]) {
                        console.log(`Ignoring offer collision from ${remoteName}`);
                        return;
                    }

                    isSettingRemoteDescription.current[senderId] = true;
                    await pc.setRemoteDescription(new RTCSessionDescription(offer));
                    isSettingRemoteDescription.current[senderId] = false;

                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    
                    sendSignal({
                        meeting_id: meetingId,
                        sender_id: userId,
                        receiver_id: senderId,
                        type: "answer",
                        data: JSON.stringify(pc.localDescription),
                        timestamp: new Date().toISOString()
                    });
                    await drainIceQueue(senderId);
                } else if (type === "answer") {
                    const answer = JSON.parse(data);
                    if (pc.signalingState === "have-local-offer") {
                        await pc.setRemoteDescription(new RTCSessionDescription(answer));
                        await drainIceQueue(senderId);
                    }
                } else if (type === "ice-candidate") {
                    const candidate = JSON.parse(data);
                    try {
                        if (pc.remoteDescription && pc.remoteDescription.type) {
                            await pc.addIceCandidate(new RTCIceCandidate(candidate));
                        } else {
                            iceQueues.current[senderId].push(candidate);
                        }
                    } catch (err) {
                        if (!ignoreOffer.current[senderId]) {
                            console.warn("ICE candidate failed but not ignored:", err);
                        }
                    }
                }
            } catch (err) {
                console.error(`Error processing signal from ${senderId}:`, err);
            }
        });
    }, [signals, localStream, activeParticipants, createPeerConnection, meetingId, userId, sendSignal, drainIceQueue]);


    // 4. Exposed controls
    const toggleAudio = useCallback(() => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                return audioTrack.enabled;
            }
        }
        return false;
    }, [localStream]);

    const toggleVideo = useCallback(async () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                return videoTrack.enabled;
            } else {
                // If we're in Audio-Only mode, try to get the camera again
                console.log("No video track found. Attempting hardware recovery...");
                const newStream = await getMedia(true);
                return !!(newStream && newStream.getVideoTracks().length > 0);
            }
        }
        return false;
    }, [localStream, getMedia]);

    const toggleScreenShare = useCallback(async () => {
        if (!localStream) return false;

        if (isScreenSharing && screenStreamRef.current) {
            // Stop screen share
            screenStreamRef.current.getTracks().forEach(t => t.stop());
            screenStreamRef.current = null;
            
            // Revert back to camera track for all peers
            const videoTrack = localStream.getVideoTracks()[0];
            Object.values(pcs.current).forEach(pc => {
                const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                if (sender && videoTrack) {
                    sender.replaceTrack(videoTrack).catch(console.error);
                }
            });
            setIsScreenSharing(false);
            return false;
        }

        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            screenStreamRef.current = screenStream;
            
            const screenTrack = screenStream.getVideoTracks()[0];
            
            // Listen to browser's native "Stop Sharing" button
            screenTrack.onended = () => {
                screenStreamRef.current = null;
                const videoTrack = localStream?.getVideoTracks()[0];
                if (videoTrack) {
                    Object.values(pcs.current).forEach(pc => {
                        const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                        if (sender) {
                            sender.replaceTrack(videoTrack).catch(console.error);
                        }
                    });
                }
                setIsScreenSharing(false);
            };

            // Replace track for all existing connections
            Object.values(pcs.current).forEach(pc => {
                const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                if (sender) {
                    sender.replaceTrack(screenTrack).catch(console.error);
                }
            });
            
            setIsScreenSharing(true);
            return true;
        } catch (err) {
            console.error("Screen share error:", err);
            return false;
        }
    }, [localStream, isScreenSharing]);

    return {
        localStream,
        remoteStreams,
        toggleAudio,
        toggleVideo,
        toggleScreenShare,
        isScreenSharing,
        screenStream: screenStreamRef.current,
        mediaError,
        peerCount: Object.keys(remoteStreams).length,
        connectionStates,
        retryMedia: getMedia
    };
}
