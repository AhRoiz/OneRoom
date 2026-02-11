import { X, Mic, Speaker, Video } from 'lucide-react';

export default function SettingsModal({ devices, selectedDevices, onChangeAudioInput, onChangeAudioOutput, onChangeVideoInput, onClose }) {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.8)',
        }} onClick={onClose}>
            <div className="glass animate-fade-in" style={{
                width: '100%', maxWidth: '24rem', padding: '1.25rem',
            }} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{
                        fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.1em', color: 'var(--text-dim)',
                    }}>
                        <span style={{ color: 'var(--accent)' }}>$</span> device_config
                    </h3>
                    <button onClick={onClose} className="btn btn-icon btn-ghost" style={{ width: '1.75rem', height: '1.75rem' }}>
                        <X size={14} />
                    </button>
                </div>

                <DeviceSelect icon={<Mic size={12} />} label="input_device" devices={devices.audioInput} selected={selectedDevices.audioInput} onChange={onChangeAudioInput} />
                <DeviceSelect icon={<Speaker size={12} />} label="output_device" devices={devices.audioOutput} selected={selectedDevices.audioOutput} onChange={onChangeAudioOutput} />
                <DeviceSelect icon={<Video size={12} />} label="video_device" devices={devices.videoInput} selected={selectedDevices.videoInput} onChange={onChangeVideoInput} />
            </div>
        </div>
    );
}

function DeviceSelect({ icon, label, devices, selected, onChange }) {
    return (
        <div style={{ marginBottom: '0.875rem' }}>
            <label style={{
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-dim)',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem',
            }}>
                {icon} {label}
            </label>
            <select
                value={selected}
                onChange={(e) => onChange(e.target.value)}
                className="input"
                style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
            >
                <option value="">default</option>
                {devices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `device_${d.deviceId.slice(0, 8)}`}
                    </option>
                ))}
            </select>
        </div>
    );
}
