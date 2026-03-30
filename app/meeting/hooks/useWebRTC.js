"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const STUN_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
    ],
};

export function useWebRTC(meetingId, userId, name) {
    const [localStream, setLocalStream] = useState(null);
    const [mediaError, setMediaError] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState({}); // { userId: { stream: MediaStream, name: string } }
    const pcs = useRef({}); // { userId: RTCPeerConnection }
    const processedSignals = useRef(new Set());

    const sendSignal = useMutation(api.meetings.sendSignal);
    const signals = useQuery(
        api.meetings.getSignals,
        meetingId && userId ? { meetingId, receiverId: userId } : "skip"
    );
    const activeParticipants = useQuery(
        api.meetings.getParticipants,
        meetingId ? { meetingId } : "skip"
    );

    // Use a ref to track the active stream — avoids stale closure in useCallback
    const localStreamRef = useRef(null);
    // Guard against concurrent getUserMedia calls
    const isAcquiring = useRef(false);

    const setStream = useCallback((stream) => {
        localStreamRef.current = stream;
        setLocalStream(stream);
    }, []);

    // 1. Initialize Local Stream with Smart Fallback & Multi-Camera Search
    // getMedia uses NO state in its deps — it reads localStreamRef.current for cleanup
    const getMedia = useCallback(async (isRetry = false) => {
        // Prevent concurrent acquisition attempts
        if (isAcquiring.current) {
            console.warn("Camera acquisition already in progress, skipping.");
            return null;
        }
        isAcquiring.current = true;

        try {
            // Hard Cleanup: Stop all existing tracks using the ref (not stale state)
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => {
                    track.stop();
                    console.log(`Stopped ${track.kind} track for hard reset.`);
                });
                setStream(null);
            }

            // Give the browser a moment to release the hardware on retries
            if (isRetry) await new Promise(r => setTimeout(r, 1200));

            // First attempt: Default Media (Video + Audio)
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

                if (
                    err.name === "NotReadableError" ||
                    err.name === "TrackStartError" ||
                    err.name === "AbortError" ||
                    err.name === "NotFoundError"
                ) {
                    console.warn("Camera busy/unavailable. Searching for alternative cameras...");

                    // List all devices and try each camera one at a time
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    const videoDevices = devices.filter(d => d.kind === "videoinput");

                    for (const device of videoDevices) {
                        try {
                            console.log(`Attempting camera: ${device.label || device.deviceId}`);
                            const altStream = await navigator.mediaDevices.getUserMedia({
                                video: { deviceId: { exact: device.deviceId } },
                                audio: true,
                            });
                            setStream(altStream);
                            setMediaError(null);
                            return altStream;
                        } catch (altErr) {
                            console.warn(`Camera ${device.deviceId} failed:`, altErr.name);
                        }
                    }

                    // All cameras failed — fall back to audio-only
                    console.warn("No cameras available, falling back to Audio Only...");
                    try {
                        const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
                            video: false,
                            audio: true,
                        });
                        setStream(audioOnlyStream);
                        setMediaError("camera_busy_audio_only");
                        return audioOnlyStream;
                    } catch (audioErr) {
                        console.error("Audio-only fallback failed:", audioErr);
                        setMediaError("hardware_blocked_all");
                        setStream(null);
                        return null;
                    }
                }

                setMediaError(err.name || "MediaError");
                setStream(null);
                return null;
            }
        } finally {
            isAcquiring.current = false;
        }
    }, [setStream]); // ← stable: only depends on setStream which is also stable

    useEffect(() => {
        getMedia();
        return () => {
            // Final cleanup on unmount using the ref
            localStreamRef.current?.getTracks().forEach(track => track.stop());
        };
    }, []); // ← runs exactly once on mount

    const createPeerConnection = useCallback((remoteUserId, remoteName, isInitiator) => {
        if (pcs.current[remoteUserId]) return pcs.current[remoteUserId];

        const pc = new RTCPeerConnection(STUN_SERVERS);
        pcs.current[remoteUserId] = pc;

        // Add local tracks
        if (localStream) {
            localStream.getTracks().forEach(track => {
                pc.addTrack(track, localStream);
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
            const [stream] = event.streams;
            setRemoteStreams(prev => ({
                ...prev,
                [remoteUserId]: { stream, name: remoteName }
            }));
        };

        pc.onnegotiationneeded = async () => {
            if (isInitiator) {
                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    sendSignal({
                        meetingId,
                        senderId: userId,
                        receiverId: remoteUserId,
                        type: "offer",
                        data: JSON.stringify(offer),
                    });
                } catch (err) {
                    console.error("Error creating offer:", err);
                }
            }
        };

        return pc;
    }, [localStream, meetingId, userId, sendSignal]);

    // 2. Handle incoming participants
    useEffect(() => {
        if (!activeParticipants || !localStream) return;

        activeParticipants.forEach(participant => {
            if (participant.userId !== userId && !pcs.current[participant.userId]) {
                // If I'm already in and someone else joined, I'll be the initiator for them
                // Strategy: Alphabetical order to decide who initiates (simple mesh strategy)
                const isInitiator = userId < participant.userId;
                createPeerConnection(participant.userId, participant.name, isInitiator);
            }
        });

        // Clean up disconnected participants
        Object.keys(pcs.current).forEach(pId => {
            if (!activeParticipants.find(p => p.userId === pId)) {
                pcs.current[pId].close();
                delete pcs.current[pId];
                setRemoteStreams(prev => {
                    const next = { ...prev };
                    delete next[pId];
                    return next;
                });
            }
        });
    }, [activeParticipants, localStream, userId, createPeerConnection]);

    // 3. Handle incoming signals
    useEffect(() => {
        if (!signals || !localStream) return;

        signals.forEach(async (signal) => {
            if (processedSignals.current.has(signal._id)) return;
            processedSignals.current.add(signal._id);

            const { senderId, type, data } = signal;
            const remoteParticipant = activeParticipants?.find(p => p.userId === senderId);
            const remoteName = remoteParticipant?.name || "Guest";

            let pc = pcs.current[senderId];
            if (!pc) {
                pc = createPeerConnection(senderId, remoteName, false);
            }

            try {
                if (type === "offer") {
                    const offer = JSON.parse(data);
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
                } else if (type === "answer") {
                    const answer = JSON.parse(data);
                    await pc.setRemoteDescription(new RTCSessionDescription(answer));
                } else if (type === "ice-candidate") {
                    const candidate = JSON.parse(data);
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                }
            } catch (err) {
                console.error("Signal handle error:", err);
            }
        });
    }, [signals, localStream, activeParticipants, createPeerConnection, meetingId, userId, sendSignal]);

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

    return {
        localStream,
        remoteStreams,
        toggleAudio,
        toggleVideo,
        mediaError,
        peerCount: Object.keys(remoteStreams).length,
        retryMedia: getMedia
    };
}
