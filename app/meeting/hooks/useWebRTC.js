"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

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
    const screenStreamRef = useRef(null);

    const sendSignal = useMutation(api.meetings.sendSignal);
    const signals = useQuery(
        api.meetings.getSignals,
        meetingId && userId ? { meetingId, receiverId: userId } : "skip"
    );
    const activeParticipants = useQuery(
        api.meetings.getParticipants,
        meetingId ? { meetingId } : "skip"
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

        console.log(`Creating PeerConnection for ${remoteName} (${remoteUserId}), initiator: ${isInitiator}`);
        const pc = new RTCPeerConnection(STUN_SERVERS);
        pcs.current[remoteUserId] = pc;
        iceQueues.current[remoteUserId] = [];

        // Add local tracks BEFORE creating offer
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current);
            });
        }

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                sendSignal({
                    meetingId,
                    senderId: userId,
                    receiverId: remoteUserId,
                    type: "ice-candidate",
                    data: JSON.stringify(event.candidate),
                });
            }
        };

        pc.ontrack = (event) => {
            console.log(`Received track from ${remoteName}:`, event.track.kind);
            // Ensure we have a stream, even if event.streams is empty
            const stream = event.streams[0] || new MediaStream([event.track]);
            
            setRemoteStreams(prev => ({
                ...prev,
                [remoteUserId]: { stream, name: remoteName }
            }));
            setPeerCount(Object.keys(pcs.current).length);
        };

        pc.onconnectionstatechange = () => {
            console.log(`Connection state with ${remoteName}: ${pc.connectionState}`);
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                setRemoteStreams(prev => {
                    const next = { ...prev };
                    delete next[remoteUserId];
                    return next;
                });
                setPeerCount(prev => Math.max(0, prev - 1));
            }
        };

        pc.onnegotiationneeded = async () => {
            if (isInitiator) {
                try {
                    console.log(`Negotiation needed for ${remoteName}, creating offer...`);
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    sendSignal({
                        meetingId,
                        senderId: userId, // This is our unique participantId
                        receiverId: remoteUserId, // This is their unique participantId
                        type: "offer",
                        data: JSON.stringify(offer),
                    });
                } catch (err) {
                    console.error("Error during negotiation:", err);
                }
            }
        };

        return pc;
    }, [meetingId, userId, sendSignal]);

    // 2. Sync with Participants
    useEffect(() => {
        if (!activeParticipants || !localStream) return;

        activeParticipants.forEach(participant => {
            // Using participant._id for uniqueness across devices
            if (participant._id !== userId && !pcs.current[participant._id]) {
                // Determine initiator based on ID comparison (Lexicographical)
                const isInitiator = userId < participant._id;
                createPeerConnection(participant._id, participant.name, isInitiator);
            }
        });

        // Cleanup stale connections
        Object.keys(pcs.current).forEach(pId => {
            if (!activeParticipants.find(p => p._id === pId)) {
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
        if (!signals || !localStream) return;

        // Sort signals by timestamp to ensure correct order (Offer -> Answer -> ICE)
        const sortedSignals = [...signals].sort((a, b) => a.timestamp - b.timestamp);

        sortedSignals.forEach(async (signal) => {
            if (processedSignals.current.has(signal._id)) return;
            processedSignals.current.add(signal._id);

            const { senderId, type, data } = signal;
            // Find participant by their unique _id (stored as senderId in signal)
            const remoteParticipant = activeParticipants?.find(p => p._id === senderId);
            const remoteName = remoteParticipant?.name || "Guest";
            
            let pc = pcs.current[senderId];
            if (!pc && (type === "offer" || type === "ice-candidate")) {
                pc = createPeerConnection(senderId, remoteName, false);
            }

            if (!pc) return;

            try {
                if (type === "offer") {
                    const offer = JSON.parse(data);
                    console.log(`Processing offer from ${remoteName}`);
                    await pc.setRemoteDescription(new RTCSessionDescription(offer));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    sendSignal({
                        meetingId,
                        senderId: userId,
                        receiverId: senderId,
                        type: "answer",
                        data: JSON.stringify(answer),
                    });
                    await drainIceQueue(senderId);
                } else if (type === "answer") {
                    const answer = JSON.parse(data);
                    console.log(`Processing answer from ${remoteName}`);
                    await pc.setRemoteDescription(new RTCSessionDescription(answer));
                    await drainIceQueue(senderId);
                } else if (type === "ice-candidate") {
                    const candidate = JSON.parse(data);
                    if (pc.remoteDescription) {
                        await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    } else {
                        iceQueues.current[senderId].push(candidate);
                    }
                }
            } catch (err) {
                console.error(`Error processing signal ${type} from ${senderId}:`, err);
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
        retryMedia: getMedia
    };
}
