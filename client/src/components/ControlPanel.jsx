import { Mic, MicOff, PhoneOff, Video, VideoOff, Monitor, MonitorOff, MessageSquare, Settings, VolumeX, Volume2 } from 'lucide-react';

export default function ControlPanel({
    isMuted, isDeafened, isCamOn, isScreenSharing,
    onToggleMute, onToggleDeafen, onToggleCamera, onToggleScreenShare,
    onToggleChat, onOpenSettings, onLeave, unreadCount,
}) {
    return (
        <div className="glass animate-slide-up" style={{
            position: 'fixed', bottom: '1rem', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.5rem 0.75rem', borderRadius: '0.5rem', zIndex: 50,
            background: 'rgba(3,3,3,0.9)', border: '1px solid var(--border)',
            backdropFilter: 'blur(12px)',
        }}>
            {/* Mute */}
            <CtrlBtn active={isMuted} danger={isMuted} onClick={onToggleMute}
                title={isMuted ? 'Unmute' : 'Mute'}
                icon={isMuted ? <MicOff size={16} /> : <Mic size={16} />} />

            {/* Deafen */}
            <CtrlBtn active={isDeafened} danger={isDeafened} onClick={onToggleDeafen}
                title={isDeafened ? 'Undeafen' : 'Deafen'}
                icon={isDeafened ? <VolumeX size={16} /> : <Volume2 size={16} />} />

            <Divider />

            {/* Camera */}
            <CtrlBtn active={isCamOn} onClick={onToggleCamera}
                title={isCamOn ? 'Stop Camera' : 'Camera'}
                icon={isCamOn ? <Video size={16} /> : <VideoOff size={16} />} />

            {/* Screen Share */}
            <CtrlBtn active={isScreenSharing} onClick={onToggleScreenShare}
                title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
                icon={isScreenSharing ? <Monitor size={16} /> : <MonitorOff size={16} />} />

            <Divider />

            {/* Chat */}
            <div style={{ position: 'relative' }}>
                <CtrlBtn onClick={onToggleChat} title="Chat" icon={<MessageSquare size={16} />} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: -3, right: -3,
                        minWidth: 14, height: 14, borderRadius: '2px',
                        background: 'var(--danger)', color: '#fff',
                        fontSize: '0.5rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '0 3px', fontFamily: 'inherit',
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </div>

            {/* Settings */}
            <CtrlBtn onClick={onOpenSettings} title="Settings" icon={<Settings size={16} />} />

            <Divider />

            {/* Leave */}
            <button
                className="btn btn-icon btn-danger"
                onClick={onLeave}
                title="Disconnect"
                style={{ width: '2.5rem', height: '2.5rem' }}
            >
                <PhoneOff size={16} />
            </button>
        </div>
    );
}

function CtrlBtn({ active, danger, onClick, title, icon }) {
    const isDanger = danger;
    const isActive = active && !danger;

    let bg = 'transparent';
    let border = '1px solid var(--border)';
    let color = 'var(--text-dim)';
    let shadow = 'none';

    if (isDanger) {
        bg = 'rgba(255, 0, 51, 0.1)';
        border = '1px solid rgba(255, 0, 51, 0.3)';
        color = 'var(--danger)';
        shadow = '0 0 10px var(--danger-glow)';
    } else if (isActive) {
        bg = 'rgba(0, 255, 65, 0.06)';
        border = '1px solid rgba(0, 255, 65, 0.2)';
        color = 'var(--accent)';
        shadow = '0 0 10px var(--accent-glow)';
    }

    return (
        <button
            className="btn btn-icon"
            onClick={onClick}
            title={title}
            style={{
                width: '2.5rem', height: '2.5rem',
                background: bg, border, color, boxShadow: shadow,
                transition: 'all 0.2s ease',
            }}
        >
            {icon}
        </button>
    );
}

function Divider() {
    return <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 0.125rem' }} />;
}
