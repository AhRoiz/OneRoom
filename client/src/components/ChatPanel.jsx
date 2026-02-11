import { useState, useRef, useEffect } from 'react';
import { Send, X } from 'lucide-react';

export default function ChatPanel({ messages, onSend, mySocketId, onClose }) {
    const [text, setText] = useState('');
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSend(text.trim());
        setText('');
    };

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', height: '100%',
            background: 'var(--bg-deep)', borderLeft: '1px solid var(--border)',
        }}>
            {/* Header */}
            <div style={{
                padding: '0.75rem 1rem', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', borderBottom: '1px solid var(--border)',
            }}>
                <h3 style={{
                    fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.1em', color: 'var(--text-dim)',
                }}>
                    <span style={{ color: 'var(--accent)' }}>#</span> encrypted_chat
                </h3>
                <button onClick={onClose} className="btn btn-icon btn-ghost"
                    style={{ width: '1.75rem', height: '1.75rem' }}>
                    <X size={12} />
                </button>
            </div>

            {/* Messages */}
            <div style={{
                flex: 1, overflowY: 'auto', padding: '0.625rem',
                display: 'flex', flexDirection: 'column', gap: '0.375rem',
            }}>
                {messages.length === 0 && (
                    <p style={{
                        color: 'var(--text-dim)', fontSize: '0.65rem', textAlign: 'center',
                        marginTop: '2rem', fontStyle: 'italic',
                    }}>
                        {'// channel is silent...'}
                    </p>
                )}
                {messages.map((msg, i) => {
                    const isMe = msg.id === mySocketId;
                    return (
                        <div key={i} style={{
                            display: 'flex', flexDirection: 'column',
                            alignItems: isMe ? 'flex-end' : 'flex-start',
                        }}>
                            <span style={{
                                fontSize: '0.55rem', color: 'var(--text-dim)',
                                marginBottom: 1, fontWeight: 600, letterSpacing: '0.03em',
                            }}>
                                {isMe ? 'you' : msg.displayName}
                                <span style={{ marginLeft: 4, opacity: 0.5 }}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </span>
                            <div style={{
                                maxWidth: '85%', padding: '0.375rem 0.625rem',
                                borderRadius: '0.25rem',
                                background: isMe ? 'rgba(0,255,65,0.08)' : 'rgba(255,255,255,0.02)',
                                border: isMe ? '1px solid rgba(0,255,65,0.15)' : '1px solid var(--border)',
                                fontSize: '0.75rem', lineHeight: 1.4, wordBreak: 'break-word',
                                color: isMe ? 'var(--accent)' : 'var(--text-primary)',
                            }}>
                                {msg.text}
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} style={{
                padding: '0.625rem', borderTop: '1px solid var(--border)',
                display: 'flex', gap: '0.375rem',
            }}>
                <input
                    type="text"
                    className="input"
                    placeholder="> type message..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={500}
                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}
                />
                <button type="submit" className="btn btn-primary btn-icon"
                    style={{ width: '2.25rem', height: '2.25rem', flexShrink: 0 }}
                    disabled={!text.trim()}>
                    <Send size={12} />
                </button>
            </form>
        </div>
    );
}
