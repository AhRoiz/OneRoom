import { useEffect, useRef, useState } from 'react';
import { User, Video, Wifi, WifiOff } from 'lucide-react';

export default function PeerCard({ peer, displayName, index, isDeafened, audioOutputId }) {
    const audioRef = useRef(null);
    const videoRef = useRef(null);
    const analyserRef = useRef(null);
    const animFrameRef = useRef(null);
    const [barHeights, setBarHeights] = useState(new Array(16).fill(2));
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [hasVideo, setHasVideo] = useState(false);
    const [connectionState, setConnectionState] = useState('connecting'); // connecting | connected | failed

    useEffect(() => {
        if (!peer) return;

        let audioCtx = null;

        // Track ICE connection state for this peer
        const pc = peer._pc;
        if (pc) {
            const updateState = () => {
                const state = pc.iceConnectionState;
                if (state === 'connected' || state === 'completed') setConnectionState('connected');
                else if (state === 'failed' || state === 'closed') setConnectionState('failed');
                else setConnectionState('connecting');
            };
            pc.addEventListener('iceconnectionstatechange', updateState);
            updateState(); // set initial state
        }

        const handleStream = (stream) => {
            console.log(`[PeerCard] Received stream from ${displayName}, tracks:`,
                stream.getTracks().map(t => `${t.kind}:${t.readyState}`));

            // Audio — force the audio element to use this stream
            const audio = audioRef.current;
            if (audio) {
                audio.srcObject = stream;
                audio.muted = isDeafened;

                if (audioOutputId && audio.setSinkId) {
                    audio.setSinkId(audioOutputId).catch(() => { });
                }

                // Explicitly try to play (handles autoplay policy)
                const playPromise = audio.play();
                if (playPromise) {
                    playPromise.catch((err) => {
                        console.warn(`[PeerCard] Audio play failed for ${displayName}:`, err.message);
                        // Retry on user interaction
                        const retryPlay = () => {
                            audio.play().catch(() => { });
                            document.removeEventListener('click', retryPlay);
                        };
                        document.addEventListener('click', retryPlay, { once: true });
                    });
                }
            }

            // Check for video tracks
            const videoTracks = stream.getVideoTracks();
            if (videoTracks.length > 0 && videoTracks[0].readyState === 'live') {
                setHasVideo(true);
                if (videoRef.current) videoRef.current.srcObject = stream;
            }

            // Audio analyser for visualizer
            try {
                if (audioCtx) audioCtx.close().catch(() => { });
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const source = audioCtx.createMediaStreamSource(stream);
                const analyser = audioCtx.createAnalyser();
                analyser.fftSize = 64;
                source.connect(analyser);
                // NOTE: Do NOT connect analyser to audioCtx.destination — that would cause echo
                analyserRef.current = analyser;
                const dataArray = new Uint8Array(analyser.frequencyBinCount);

                function tick() {
                    analyser.getByteFrequencyData(dataArray);
                    const bars = [];
                    const step = Math.floor(dataArray.length / 16);
                    let total = 0;
                    for (let i = 0; i < 16; i++) {
                        const v = dataArray[i * step] || 0;
                        total += v;
                        bars.push(Math.max(2, (v / 255) * 36));
                    }
                    setBarHeights(bars);
                    setIsSpeaking(total / 16 > 25);
                    animFrameRef.current = requestAnimationFrame(tick);
                }
                tick();
            } catch (e) { /* ignore */ }
        };

        peer.on('stream', handleStream);

        // Handle tracks added via renegotiation (camera/screen share)
        if (pc) {
            const origOnTrack = pc.ontrack;
            pc.ontrack = (event) => {
                if (origOnTrack) origOnTrack(event);
                if (event.track.kind === 'video') {
                    setHasVideo(true);
                    if (videoRef.current) {
                        videoRef.current.srcObject = event.streams[0] || new MediaStream([event.track]);
                    }
                    event.track.onended = () => setHasVideo(false);
                    event.track.onmute = () => setHasVideo(false);
                    event.track.onunmute = () => setHasVideo(true);
                }
            };
        }

        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            if (audioCtx) audioCtx.close().catch(() => { });
        };
    }, [peer]);

    useEffect(() => {
        if (audioRef.current) audioRef.current.muted = isDeafened;
    }, [isDeafened]);

    useEffect(() => {
        if (audioRef.current && audioOutputId && audioRef.current.setSinkId) {
            audioRef.current.setSinkId(audioOutputId).catch(() => { });
        }
    }, [audioOutputId]);

    const stateColor = connectionState === 'connected' ? 'var(--accent)'
        : connectionState === 'failed' ? 'var(--danger)'
            : '#ffaa00';
    const stateLabel = connectionState === 'connected' ? 'linked'
        : connectionState === 'failed' ? 'lost'
            : 'syncing';

    return (
        <div className={`glass peer-card ${isSpeaking ? 'speaking' : ''}`}
            style={{
                padding: '0.875rem', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '0.625rem', position: 'relative', zIndex: 1,
            }}>
            {/* Connection state badge */}
            <div style={{
                position: 'absolute', top: 6, right: 6,
                display: 'flex', alignItems: 'center', gap: 3,
                fontSize: '0.5rem', color: stateColor,
                letterSpacing: '0.05em', fontWeight: 600,
                opacity: 0.7,
            }}>
                {connectionState === 'connected' ? <Wifi size={8} /> : <WifiOff size={8} />}
                {stateLabel}
            </div>

            {/* Video or Avatar */}
            {hasVideo ? (
                <div style={{
                    width: '100%', borderRadius: '0.375rem', overflow: 'hidden',
                    aspectRatio: '16/9', background: '#000', position: 'relative',
                    border: '1px solid var(--border)',
                }}>
                    <video ref={videoRef} autoPlay playsInline muted style={{
                        width: '100%', height: '100%', objectFit: 'cover',
                    }} />
                    <div style={{
                        position: 'absolute', top: 4, left: 4,
                        background: 'rgba(0,0,0,0.7)', borderRadius: '2px',
                        padding: '1px 5px', fontSize: '0.55rem', color: 'var(--accent)',
                        display: 'flex', alignItems: 'center', gap: 3,
                        border: '1px solid rgba(0,255,65,0.15)',
                    }}>
                        <Video size={8} /> LIVE
                    </div>
                </div>
            ) : (
                <div style={{ position: 'relative' }}>
                    {isSpeaking && (
                        <div style={{
                            position: 'absolute', inset: -5, borderRadius: '0.375rem',
                            border: '1px solid var(--accent)',
                            boxShadow: '0 0 10px var(--accent-glow)',
                            opacity: 0.6,
                        }} />
                    )}
                    <div style={{
                        width: '2.75rem', height: '2.75rem', borderRadius: '0.375rem',
                        background: 'var(--bg-deep)',
                        border: `1px solid ${isSpeaking ? 'var(--accent)' : 'var(--border)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'border-color 0.3s, box-shadow 0.3s',
                        boxShadow: isSpeaking ? '0 0 15px var(--accent-glow)' : 'none',
                    }}>
                        <User size={16} color={isSpeaking ? 'var(--accent)' : 'var(--text-dim)'} />
                    </div>
                </div>
            )}

            <p style={{
                fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-primary)',
                textAlign: 'center', maxWidth: '100%', overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
                {displayName || 'unknown_node'}
            </p>

            <div style={{
                display: 'flex', alignItems: 'flex-end', gap: 1.5,
                height: 28, width: '100%', justifyContent: 'center',
            }}>
                {barHeights.map((h, i) => (
                    <div key={i} className={`visualizer-bar ${isDeafened ? 'muted' : ''}`}
                        style={{ width: 2, height: h }} />
                ))}
            </div>

            <audio ref={audioRef} autoPlay playsInline />
        </div>
    );
}
