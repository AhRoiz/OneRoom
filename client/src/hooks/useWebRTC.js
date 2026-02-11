import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';

const SIGNAL_SERVER = import.meta.env.VITE_SIGNAL_SERVER || 'http://localhost:5000';

const ICE_CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        // [TIP] Add your TURN server here for 100% reliability
        // { urls: 'turn:your-turn-server.com', username: 'user', credential: 'password' }
    ],
};

export default function useWebRTC() {
    const [roomID, setRoomID] = useState(null);
    const [peers, setPeers] = useState([]);
    const [myName, setMyName] = useState('');
    const [isMuted, setIsMuted] = useState(false);
    const [isDeafened, setIsDeafened] = useState(false);
    const [isCamOn, setIsCamOn] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const [roomFull, setRoomFull] = useState(false);
    const [messages, setMessages] = useState([]);
    const [devices, setDevices] = useState({ audioInput: [], audioOutput: [], videoInput: [] });
    const [selectedDevices, setSelectedDevices] = useState({ audioInput: '', audioOutput: '', videoInput: '' });

    const socketRef = useRef(null);
    const localAudioStream = useRef(null);
    const peersRef = useRef([]);

    const refreshDevices = useCallback(async () => {
        try {
            const list = await navigator.mediaDevices.enumerateDevices();
            setDevices({
                audioInput: list.filter((d) => d.kind === 'audioinput'),
                audioOutput: list.filter((d) => d.kind === 'audiooutput'),
                videoInput: list.filter((d) => d.kind === 'videoinput'),
            });
        } catch (e) { /* ignore */ }
    }, []);

    // ── Socket init ──
    useEffect(() => {
        const socket = io(SIGNAL_SERVER, { transports: ['websocket', 'polling'] });
        socketRef.current = socket;
        socket.on('connect', () => setIsConnected(true));
        socket.on('disconnect', () => setIsConnected(false));
        socket.on('error-msg', (msg) => setError(msg));
        return () => { socket.disconnect(); };
    }, []);

    // ── Join Room ──
    const joinRoom = useCallback(async (code) => {
        setError(null);
        setRoomFull(false);

        // Get audio only — NO video at connection time
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
                video: false,
            });
            localAudioStream.current = stream;
            await refreshDevices();
        } catch (err) {
            setError('Microphone access denied.');
            return;
        }

        const socket = socketRef.current;
        if (!socket) return;

        socket.emit('join-room', code);

        socket.on('room-full', () => {
            setRoomFull(true);
            localAudioStream.current?.getTracks().forEach((t) => t.stop());
        });

        socket.on('all-users', ({ users, yourName }) => {
            setMyName(yourName);
            setRoomID(code);
            const newPeers = [];
            users.forEach((user) => {
                const peer = createPeer(user.id, socket.id, localAudioStream.current, socket);
                const peerObj = { peerID: user.id, peer, displayName: user.displayName };
                peersRef.current.push(peerObj);
                newPeers.push(peerObj);
            });
            setPeers(newPeers);
        });

        socket.on('user-joined', (payload) => {
            // CRITICAL: if peer already exists, just signal it (renegotiation)
            const existing = peersRef.current.find((p) => p.peerID === payload.callerID);
            if (existing) {
                existing.peer.signal(payload.signal);
                return;
            }
            const peer = addPeer(payload.signal, payload.callerID, localAudioStream.current, socket);
            const peerObj = { peerID: payload.callerID, peer, displayName: payload.callerName };
            peersRef.current.push(peerObj);
            setPeers((prev) => [...prev, peerObj]);
        });

        socket.on('receiving-returned-signal', (payload) => {
            const item = peersRef.current.find((p) => p.peerID === payload.id);
            if (item) {
                item.peer.signal(payload.signal);
                item.displayName = payload.displayName;
            }
        });

        socket.on('user-left', (id) => {
            const peerObj = peersRef.current.find((p) => p.peerID === id);
            if (peerObj) peerObj.peer.destroy();
            peersRef.current = peersRef.current.filter((p) => p.peerID !== id);
            setPeers((prev) => prev.filter((p) => p.peerID !== id));
        });

        socket.on('user-name-changed', ({ id, newName }) => {
            const item = peersRef.current.find((p) => p.peerID === id);
            if (item) item.displayName = newName;
            setPeers((prev) => prev.map((p) => p.peerID === id ? { ...p, displayName: newName } : p));
            if (id === socket.id) setMyName(newName);
        });

        socket.on('renegotiate', (payload) => {
            const item = peersRef.current.find((p) => p.peerID === payload.callerID);
            if (item) {
                item.peer.signal(payload.signal);
            }
        });

        socket.on('renegotiate-answer', (payload) => {
            const item = peersRef.current.find((p) => p.peerID === payload.callerID);
            if (item) {
                item.peer.signal(payload.signal);
            }
        });

        socket.on('chat-message', (msg) => {
            setMessages((prev) => [...prev, msg]);
        });
    }, [refreshDevices]);

    // ── Leave Room ──
    const leaveRoom = useCallback(() => {
        localAudioStream.current?.getTracks().forEach((t) => t.stop());
        peersRef.current.forEach((p) => p.peer.destroy());
        peersRef.current = [];
        setPeers([]);
        setRoomID(null);
        setMyName('');
        setMessages([]);
        setError(null);
        setRoomFull(false);
        setIsMuted(false);
        setIsDeafened(false);
        setIsCamOn(false);
        setIsScreenSharing(false);

        // Disconnect and create a fresh socket
        const oldSocket = socketRef.current;
        if (oldSocket) {
            oldSocket.removeAllListeners();
            oldSocket.disconnect();
        }
        const socket = io(SIGNAL_SERVER, { transports: ['websocket', 'polling'] });
        socketRef.current = socket;
        socket.on('connect', () => setIsConnected(true));
        socket.on('disconnect', () => setIsConnected(false));
        socket.on('error-msg', (msg) => setError(msg));
    }, []);

    // ── Toggle Mute ──
    const toggleMute = useCallback(() => {
        if (localAudioStream.current) {
            const track = localAudioStream.current.getAudioTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                setIsMuted(!track.enabled);
            }
        }
    }, []);

    // ── Toggle Deafen ──
    const toggleDeafen = useCallback(() => {
        setIsDeafened((prev) => !prev);
    }, []);

    // ── Toggle Camera ──
    const toggleCamera = useCallback(async () => {
        if (isCamOn) {
            // Remove video track from all peers
            peersRef.current.forEach(({ peer }) => {
                try {
                    const senders = peer._pc?.getSenders() || [];
                    const videoSender = senders.find((s) => s.track?.kind === 'video');
                    if (videoSender) {
                        peer._pc.removeTrack(videoSender);
                        // Trigger renegotiation
                        peer.negotiate();
                    }
                } catch (e) { /* ignore */ }
            });
            setIsCamOn(false);
        } else {
            try {
                const constraints = selectedDevices.videoInput
                    ? { video: { deviceId: { exact: selectedDevices.videoInput } } }
                    : { video: true };
                const camStream = await navigator.mediaDevices.getUserMedia(constraints);
                const camTrack = camStream.getVideoTracks()[0];

                // Add video track to all peers
                peersRef.current.forEach(({ peer }) => {
                    try {
                        peer._pc.addTrack(camTrack, camStream);
                        peer.negotiate();
                    } catch (e) { /* ignore */ }
                });

                // Clean up when track is stopped externally
                camTrack.onended = () => setIsCamOn(false);

                setIsCamOn(true);
                setIsScreenSharing(false);
            } catch (err) {
                setError('Camera access denied.');
            }
        }
    }, [isCamOn, selectedDevices.videoInput]);

    // ── Toggle Screen Share ──
    const toggleScreenShare = useCallback(async () => {
        if (isScreenSharing) {
            peersRef.current.forEach(({ peer }) => {
                try {
                    const senders = peer._pc?.getSenders() || [];
                    const videoSender = senders.find((s) => s.track?.kind === 'video');
                    if (videoSender) {
                        peer._pc.removeTrack(videoSender);
                        peer.negotiate();
                    }
                } catch (e) { /* ignore */ }
            });
            setIsScreenSharing(false);
        } else {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
                const screenTrack = screenStream.getVideoTracks()[0];

                screenTrack.onended = () => {
                    peersRef.current.forEach(({ peer }) => {
                        try {
                            const senders = peer._pc?.getSenders() || [];
                            const videoSender = senders.find((s) => s.track?.kind === 'video');
                            if (videoSender) {
                                peer._pc.removeTrack(videoSender);
                                peer.negotiate();
                            }
                        } catch (e) { /* ignore */ }
                    });
                    setIsScreenSharing(false);
                };

                peersRef.current.forEach(({ peer }) => {
                    try {
                        peer._pc.addTrack(screenTrack, screenStream);
                        peer.negotiate();
                    } catch (e) { /* ignore */ }
                });

                setIsScreenSharing(true);
                setIsCamOn(false);
            } catch (err) {
                // User cancelled picker
            }
        }
    }, [isScreenSharing]);

    // ── Change Name ──
    const changeName = useCallback((newName) => {
        socketRef.current?.emit('change-name', newName);
        setMyName(newName);
    }, []);

    // ── Chat ──
    const sendMessage = useCallback((text) => {
        socketRef.current?.emit('chat-message', text);
    }, []);

    // ── Device switching ──
    const changeAudioInput = useCallback(async (deviceId) => {
        setSelectedDevices((prev) => ({ ...prev, audioInput: deviceId }));
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { deviceId: { exact: deviceId }, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            });
            const newTrack = stream.getAudioTracks()[0];
            const oldTrack = localAudioStream.current?.getAudioTracks()[0];

            peersRef.current.forEach(({ peer }) => {
                try {
                    const sender = peer._pc?.getSenders().find((s) => s.track?.kind === 'audio');
                    if (sender) sender.replaceTrack(newTrack);
                } catch (e) { /* ignore */ }
            });

            if (oldTrack) { oldTrack.stop(); localAudioStream.current.removeTrack(oldTrack); }
            localAudioStream.current?.addTrack(newTrack);
            newTrack.enabled = !isMuted;
        } catch (err) {
            setError('Could not switch microphone.');
        }
    }, [isMuted]);

    const changeAudioOutput = useCallback((deviceId) => {
        setSelectedDevices((prev) => ({ ...prev, audioOutput: deviceId }));
    }, []);

    const changeVideoInput = useCallback((deviceId) => {
        setSelectedDevices((prev) => ({ ...prev, videoInput: deviceId }));
    }, []);

    return {
        roomID, peers, myName, isMuted, isDeafened, isCamOn, isScreenSharing,
        isConnected, error, roomFull, messages, devices, selectedDevices,
        joinRoom, leaveRoom, toggleMute, toggleDeafen, toggleCamera, toggleScreenShare,
        changeName, sendMessage, changeAudioInput, changeAudioOutput, changeVideoInput,
        refreshDevices,
    };
}

// ── Peer creation helpers ──

function attachICERestart(peer, label) {
    let restartAttempts = 0;
    const MAX_RESTARTS = 3;

    if (!peer._pc) return;

    peer._pc.oniceconnectionstatechange = () => {
        const state = peer._pc?.iceConnectionState;
        console.log(`[ICE ${label}] ${state}`);

        if (state === 'connected' || state === 'completed') {
            restartAttempts = 0; // reset on success
            console.log(`[ICE ${label}] ✅ Connected!`);
        }

        if ((state === 'failed' || state === 'disconnected') && restartAttempts < MAX_RESTARTS) {
            restartAttempts++;
            console.warn(`[ICE ${label}] ⚠️ ${state} — restarting ICE (attempt ${restartAttempts}/${MAX_RESTARTS})`);
            try {
                // simple-peer exposes negotiate() which triggers a new offer
                peer._pc.restartIce();
                peer.negotiate();
            } catch (e) {
                console.error(`[ICE ${label}] restart failed:`, e);
            }
        }
    };

    peer.on('connect', () => {
        console.log(`[Peer ${label}] ✅ Data channel open`);
    });

    peer.on('error', (err) => {
        console.error(`[Peer ${label}] ❌ Error:`, err.message || err);
    });

    peer.on('close', () => {
        console.log(`[Peer ${label}] 🔌 Closed`);
    });
}

function createPeer(userToSignal, callerID, stream, socket) {
    const peer = new Peer({
        initiator: true,
        trickle: true,
        stream,
        config: ICE_CONFIG,
    });
    peer.on('signal', (signal) => {
        if (signal.renegotiate) {
            socket.emit('renegotiate', { targetID: userToSignal, signal });
        } else {
            socket.emit('sending-signal', { userToSignal, callerID, signal });
        }
    });

    attachICERestart(peer, `-> ${userToSignal.slice(-4)}`);
    return peer;
}

function addPeer(incomingSignal, callerID, stream, socket) {
    const peer = new Peer({
        initiator: false,
        trickle: true,
        stream,
        config: ICE_CONFIG,
    });
    peer.on('signal', (signal) => {
        if (signal.renegotiate) {
            socket.emit('renegotiate-answer', { targetID: callerID, signal });
        } else {
            socket.emit('returning-signal', { signal, callerID });
        }
    });

    attachICERestart(peer, `<- ${callerID.slice(-4)}`);
    peer.signal(incomingSignal);
    return peer;
}
