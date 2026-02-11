# 🎧 OneRoom

> **Private voice rooms. No accounts. No logs. Just connect and talk.**

OneRoom is a privacy-first, ephemeral voice chat application built with WebRTC peer-to-peer technology. All audio is encrypted end-to-end (DTLS/SRTP) — the server never hears your conversations.

---

## ✨ Features

- 🔐 **End-to-End Encrypted** — WebRTC DTLS/SRTP encryption by default
- 👤 **Anonymous Identity** — Random animal names, no login required
- 🗑️ **Auto-Destruct Rooms** — Empty rooms are permanently deleted from memory
- 🎤 **Audio Visualizer** — Real-time frequency bars show who's speaking
- 📱 **Responsive** — Works on desktop and mobile browsers
- 🚫 **No Database** — All state lives in RAM; server restart = clean slate
- 🔒 **Input Sanitization** — Room codes are sanitized against XSS
- 👥 **Max 4 Users** per room

## 🛠️ Tech Stack

| Layer       | Technology                           |
|-------------|--------------------------------------|
| Frontend    | React (Vite) + Tailwind CSS v4       |
| Icons       | Lucide React                         |
| WebRTC      | simple-peer                          |
| Signaling   | Socket.io                            |
| Backend     | Node.js + Express (stateless)        |

## 📁 Project Structure

```
oneroom/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AudioDevice.jsx      # Audio visualizer per peer
│   │   │   ├── JoinRoom.jsx         # Room code input & generator
│   │   │   └── ControlPanel.jsx     # Mute/Unmute & Leave
│   │   ├── hooks/
│   │   │   └── useWebRTC.js         # Core P2P logic
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── package.json
├── server/
│   ├── index.js                     # Signaling server
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+

### 1. Install Dependencies

```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

### 2. Run the App

```bash
# Terminal 1 — Start signaling server
cd server
npm run dev

# Terminal 2 — Start frontend
cd client
npm run dev
```

- **Server**: `http://localhost:5000`
- **Client**: `http://localhost:3000`

### 3. Connect

1. Open `http://localhost:3000` in two browser tabs
2. Click **Generate Code** in one tab
3. Copy the code and paste it in the other tab
4. Click **Join Room** in both — you're connected! 🎉

## 🔒 Privacy Model

| Feature | Detail |
|---------|--------|
| Identity | Random anonymous names (e.g., "Anonymous Fox #42") |
| Logging | No IP or activity logs |
| Encryption | WebRTC DTLS/SRTP (end-to-end) |
| Persistence | Zero — RAM only, destroyed on disconnect |
| Room Cleanup | Auto-deleted when last user leaves |

## 🌐 Deployment

- **Backend** → [Railway](https://railway.app) or [Render](https://render.com)
- **Frontend** → [Vercel](https://vercel.com) or [Netlify](https://netlify.com)
- Set `VITE_SIGNAL_SERVER` env variable to your deployed server URL

---

Built with 💜 by veecodes
