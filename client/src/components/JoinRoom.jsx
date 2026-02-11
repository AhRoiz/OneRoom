import { useState } from 'react';
import { ArrowRight, Copy, RefreshCw, Shield, Users, Terminal, Eye, EyeOff } from 'lucide-react';

function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}

export default function JoinRoom({ onJoin, isConnected, error, roomFull }) {
    const [code, setCode] = useState('');
    const [generatedCode, setGeneratedCode] = useState('');
    const [copied, setCopied] = useState(false);
    const [showCode, setShowCode] = useState(true);

    const handleGenerate = () => {
        const newCode = generateRoomCode();
        setGeneratedCode(newCode);
        setCode(newCode);
        setCopied(false);
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(generatedCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* clipboard API not available */ }
    };

    const handleJoin = (e) => {
        e.preventDefault();
        const sanitized = code.replace(/[^a-zA-Z0-9-_]/g, '').trim();
        if (sanitized) onJoin(sanitized);
    };

    return (
        <div className="animate-fade-in" style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: '1rem',
        }}>
            {/* Background subtle grid */}
            <div style={{
                position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
                backgroundImage: `
          linear-gradient(rgba(0,255,65,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,255,65,0.02) 1px, transparent 1px)
        `,
                backgroundSize: '40px 40px',
            }} />

            <div style={{ width: '100%', maxWidth: '26rem', position: 'relative', zIndex: 1 }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div className="animate-flicker" style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '4rem', height: '4rem', borderRadius: '0.5rem',
                        border: '1px solid var(--accent)',
                        boxShadow: '0 0 30px var(--accent-glow), inset 0 0 20px var(--accent-glow)',
                        marginBottom: '1rem', background: 'rgba(0,255,65,0.03)',
                    }}>
                        <Terminal size={28} color="var(--accent)" />
                    </div>

                    <h1 style={{
                        fontSize: '1.8rem', fontWeight: 800, letterSpacing: '0.15em',
                        color: 'var(--accent)', textShadow: '0 0 20px var(--accent-glow-strong)',
                        marginBottom: '0.5rem', textTransform: 'uppercase',
                    }}>
                        OneRoom
                    </h1>

                    <p className="cursor-blink" style={{
                        color: 'var(--text-dim)', fontSize: '0.75rem', letterSpacing: '0.05em',
                    }}>
                        {'> encrypted_channel // no_trace // no_logs'}
                    </p>
                </div>

                {/* Card */}
                <div className="glass" style={{ padding: '1.5rem' }}>
                    <form onSubmit={handleJoin}>
                        {/* Label */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.375rem',
                            fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-dim)',
                            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem',
                        }}>
                            <span style={{ color: 'var(--accent)' }}>$</span> enter_access_code
                        </div>

                        {/* Input with eye toggle */}
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showCode ? 'text' : 'password'}
                                className="input"
                                placeholder="_ _ _ _ _ _"
                                maxLength={20}
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                style={{
                                    textAlign: 'center', fontSize: '1.3rem', fontWeight: 700,
                                    letterSpacing: '0.25em', paddingRight: '2.5rem',
                                }}
                            />
                            <button type="button" onClick={() => setShowCode(!showCode)} style={{
                                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'var(--text-dim)', padding: 4,
                            }}>
                                {showCode ? <Eye size={14} /> : <EyeOff size={14} />}
                            </button>
                        </div>

                        {/* Generate & Copy */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.625rem' }}>
                            <button type="button" className="btn btn-ghost" onClick={handleGenerate}
                                style={{ flex: 1, fontSize: '0.7rem' }}>
                                <RefreshCw size={12} /> Generate
                            </button>
                            {generatedCode && (
                                <button type="button" className="btn btn-ghost" onClick={handleCopy}
                                    style={{ fontSize: '0.7rem' }}>
                                    <Copy size={12} /> {copied ? 'Copied' : 'Copy'}
                                </button>
                            )}
                        </div>

                        {/* Error states */}
                        {error && (
                            <div style={{
                                marginTop: '0.625rem', padding: '0.5rem 0.75rem', borderRadius: '0.375rem',
                                background: 'rgba(255, 0, 51, 0.05)', border: '1px solid rgba(255, 0, 51, 0.2)',
                                color: '#ff0033', fontSize: '0.7rem', fontFamily: 'inherit',
                            }}>
                                [ERROR] {error}
                            </div>
                        )}
                        {roomFull && (
                            <div style={{
                                marginTop: '0.625rem', padding: '0.5rem 0.75rem', borderRadius: '0.375rem',
                                background: 'rgba(255, 102, 0, 0.05)', border: '1px solid rgba(255, 102, 0, 0.2)',
                                color: 'var(--warn)', fontSize: '0.7rem', fontFamily: 'inherit',
                            }}>
                                [WARN] channel_full — max 5 connections
                            </div>
                        )}

                        {/* Join */}
                        <button type="submit" className="btn btn-primary" disabled={!code.trim() || !isConnected}
                            style={{ width: '100%', marginTop: '1rem', fontSize: '0.85rem', padding: '0.75rem' }}>
                            {'>'} Connect <ArrowRight size={14} />
                        </button>
                    </form>

                    {/* Connection status */}
                    <div style={{
                        marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '0.375rem', fontSize: '0.65rem', color: 'var(--text-dim)',
                    }}>
                        <span style={{
                            width: 5, height: 5, borderRadius: '50%',
                            background: isConnected ? 'var(--accent)' : 'var(--danger)',
                            boxShadow: isConnected ? '0 0 6px var(--accent)' : '0 0 6px var(--danger)',
                        }} />
                        {isConnected ? 'signal_server: connected' : 'signal_server: connecting...'}
                    </div>
                </div>

                {/* Security badges */}
                <div style={{
                    display: 'flex', justifyContent: 'center', gap: '1.25rem',
                    marginTop: '1.25rem', fontSize: '0.6rem', color: 'var(--text-dim)',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Shield size={10} color="var(--accent)" /> E2E Encrypted
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Users size={10} /> Max 5 Nodes
                    </span>
                </div>

                {/* ASCII line */}
                <div style={{
                    textAlign: 'center', marginTop: '1.5rem', fontSize: '0.55rem',
                    color: 'var(--text-dim)', opacity: 0.4, letterSpacing: '0.3em',
                }}>
                    ═══════════════════════════════
                </div>
            </div >
        </div >
    );
}
