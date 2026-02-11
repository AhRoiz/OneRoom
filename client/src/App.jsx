import { useState, useRef, useEffect } from 'react';
import { Terminal, Users, Lock, Edit2, Check, X, Skull } from 'lucide-react';
import useWebRTC from './hooks/useWebRTC';
import JoinRoom from './components/JoinRoom';
import PeerCard from './components/PeerCard';
import ControlPanel from './components/ControlPanel';
import ChatPanel from './components/ChatPanel';
import SettingsModal from './components/SettingsModal';

export default function App() {
  const {
    roomID, peers, myName, isMuted, isDeafened, isCamOn, isScreenSharing,
    isConnected, error, roomFull, messages, devices, selectedDevices,
    joinRoom, leaveRoom, toggleMute, toggleDeafen, toggleCamera, toggleScreenShare,
    changeName, sendMessage, changeAudioInput, changeAudioOutput, changeVideoInput,
    refreshDevices,
  } = useWebRTC();

  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const prevMsgCount = useRef(0);

  // Track unread messages
  useEffect(() => {
    if (messages.length > prevMsgCount.current && !showChat) {
      setUnreadCount((c) => c + (messages.length - prevMsgCount.current));
    }
    prevMsgCount.current = messages.length;
  }, [messages, showChat]);

  useEffect(() => {
    if (showChat) setUnreadCount(0);
  }, [showChat]);

  // ── Join Screen ──
  if (!roomID) {
    return <JoinRoom onJoin={joinRoom} isConnected={isConnected} error={error} roomFull={roomFull} />;
  }

  const handleNameSave = () => {
    if (nameInput.trim() && nameInput.trim() !== myName) {
      changeName(nameInput.trim());
    }
    setEditingName(false);
  };

  // ── Room Screen ──
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Background grid */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(0,255,65,0.015) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,255,65,0.015) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />

      {/* Header */}
      <header className="glass" style={{
        margin: '0.5rem 0.5rem 0', padding: '0.625rem 1rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: '1.75rem', height: '1.75rem', borderRadius: '0.25rem',
            border: '1px solid var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 10px var(--accent-glow)',
            background: 'rgba(0,255,65,0.03)',
          }}>
            <Terminal size={12} color="var(--accent)" />
          </div>
          <h2 style={{
            fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}>
            <span style={{ color: 'var(--accent)', textShadow: '0 0 8px var(--accent-glow)' }}>One</span>
            <span style={{ color: 'var(--text-dim)' }}>Room</span>
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          {/* Room code */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.25rem',
            background: 'rgba(0,0,0,0.4)', padding: '0.25rem 0.5rem',
            borderRadius: '0.25rem', border: '1px solid var(--border)',
            fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em',
            color: 'var(--accent)',
          }}>
            <Lock size={8} /> {roomID}
          </div>
          {/* User count */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.25rem',
            fontSize: '0.6rem', color: 'var(--text-dim)', letterSpacing: '0.05em',
          }}>
            <Skull size={10} /> {peers.length + 1}/5
          </div>
        </div>
      </header>

      {/* Main + Chat sidebar */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        <main style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '1.25rem 1rem 5rem', overflow: 'auto',
        }}>
          {/* My identity card */}
          <div className="glass animate-fade-in" style={{
            padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
            marginBottom: '1.5rem', border: '1px solid rgba(0,255,65,0.12)',
          }}>
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: isMuted ? 'var(--danger)' : 'var(--accent)',
              boxShadow: isMuted ? '0 0 6px var(--danger)' : '0 0 6px var(--accent)',
            }} />
            <div style={{ minWidth: 0 }}>
              {editingName ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    autoFocus
                    className="input"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleNameSave();
                      if (e.key === 'Escape') setEditingName(false);
                    }}
                    maxLength={30}
                    style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', width: '9rem' }}
                  />
                  <button onClick={handleNameSave} style={{
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', padding: 2,
                  }}>
                    <Check size={10} />
                  </button>
                  <button onClick={() => setEditingName(false)} style={{
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 2,
                  }}>
                    <X size={10} />
                  </button>
                </div>
              ) : (
                <p style={{
                  fontSize: '0.7rem', fontWeight: 600, display: 'flex',
                  alignItems: 'center', gap: 4, cursor: 'pointer',
                  color: 'var(--text-bright)',
                }} onClick={() => { setNameInput(myName); setEditingName(true); }}>
                  <span style={{ color: 'var(--accent)' }}>{'>'}</span> {myName}
                  <Edit2 size={8} style={{ opacity: 0.3 }} />
                </p>
              )}
              <p style={{ fontSize: '0.55rem', color: 'var(--text-dim)', letterSpacing: '0.03em' }}>
                {isMuted ? 'mic:off' : 'mic:on'}
                {isDeafened ? ' | deaf:on' : ''}
                {isCamOn ? ' | cam:on' : ''}
                {isScreenSharing ? ' | screen:on' : ''}
              </p>
            </div>
          </div>

          {/* Peers Grid */}
          {peers.length === 0 ? (
            <div className="animate-fade-in" style={{
              textAlign: 'center', color: 'var(--text-dim)', marginTop: '1rem',
            }}>
              <div className="animate-float" style={{ marginBottom: '0.75rem' }}>
                <Users size={40} style={{ opacity: 0.15, color: 'var(--accent)' }} />
              </div>
              <p className="cursor-blink" style={{
                fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)',
              }}>
                waiting for connections
              </p>
              <p style={{ fontSize: '0.65rem', marginTop: '0.375rem' }}>
                share access code: <span style={{
                  color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.15em',
                  textShadow: '0 0 6px var(--accent-glow)',
                }}>{roomID}</span>
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(auto-fit, minmax(${peers.length <= 2 ? '13rem' : '10rem'}, 1fr))`,
              gap: '0.75rem', width: '100%', maxWidth: '48rem',
            }}>
              {peers.map((p, i) => (
                <PeerCard
                  key={p.peerID}
                  peer={p.peer}
                  displayName={p.displayName}
                  index={i}
                  isDeafened={isDeafened}
                  audioOutputId={selectedDevices.audioOutput}
                />
              ))}
            </div>
          )}
        </main>

        {/* Chat sidebar */}
        {showChat && (
          <div style={{ width: '18rem', flexShrink: 0, height: 'calc(100vh - 3rem)' }}
            className="animate-fade-in">
            <ChatPanel
              messages={messages}
              onSend={sendMessage}
              mySocketId={null}
              onClose={() => setShowChat(false)}
            />
          </div>
        )}
      </div>

      {/* Controls */}
      <ControlPanel
        isMuted={isMuted} isDeafened={isDeafened}
        isCamOn={isCamOn} isScreenSharing={isScreenSharing}
        onToggleMute={toggleMute} onToggleDeafen={toggleDeafen}
        onToggleCamera={toggleCamera} onToggleScreenShare={toggleScreenShare}
        onToggleChat={() => setShowChat((p) => !p)}
        onOpenSettings={() => { refreshDevices(); setShowSettings(true); }}
        onLeave={leaveRoom} unreadCount={unreadCount}
      />

      {/* Settings */}
      {showSettings && (
        <SettingsModal
          devices={devices} selectedDevices={selectedDevices}
          onChangeAudioInput={changeAudioInput}
          onChangeAudioOutput={changeAudioOutput}
          onChangeVideoInput={changeVideoInput}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
