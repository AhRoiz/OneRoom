const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  maxHttpBufferSize: 1e6,
});

const rooms = {};

const animals = [
  'Fox', 'Wolf', 'Owl', 'Bear', 'Hawk', 'Lynx', 'Puma', 'Deer',
  'Hare', 'Crow', 'Dove', 'Swan', 'Seal', 'Crab', 'Frog', 'Moth',
];
function randomAnimalName() {
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const num = Math.floor(Math.random() * 1000);
  return `Anonymous ${animal} #${num}`;
}

const MAX_ROOM_SIZE = 5;

io.on('connection', (socket) => {
  console.log(`[+] ${socket.id}`);
  socket.displayName = randomAnimalName();

  socket.on('join-room', (roomID) => {
    const sanitized = String(roomID).replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 20);
    if (!sanitized) {
      socket.emit('error-msg', 'Invalid room code.');
      return;
    }

    if (!rooms[sanitized]) rooms[sanitized] = [];

    if (rooms[sanitized].length >= MAX_ROOM_SIZE) {
      socket.emit('room-full');
      return;
    }

    const otherUsers = rooms[sanitized].map((id) => ({
      id,
      displayName: io.sockets.sockets.get(id)?.displayName || 'Unknown',
    }));
    socket.emit('all-users', { users: otherUsers, yourName: socket.displayName });

    rooms[sanitized].push(socket.id);
    socket.join(sanitized);
    socket.roomID = sanitized;

    console.log(`[join] ${socket.displayName} -> [${sanitized}] (${rooms[sanitized].length}/${MAX_ROOM_SIZE})`);
  });

  // ── Initial WebRTC signaling ──
  socket.on('sending-signal', (payload) => {
    io.to(payload.userToSignal).emit('user-joined', {
      signal: payload.signal,
      callerID: payload.callerID,
      callerName: socket.displayName,
    });
  });

  socket.on('returning-signal', (payload) => {
    io.to(payload.callerID).emit('receiving-returned-signal', {
      signal: payload.signal,
      id: socket.id,
      displayName: socket.displayName,
    });
  });

  // ── Renegotiation signaling (for adding/removing tracks) ──
  socket.on('renegotiate', (payload) => {
    io.to(payload.targetID).emit('renegotiate', {
      signal: payload.signal,
      callerID: socket.id,
    });
  });

  socket.on('renegotiate-answer', (payload) => {
    io.to(payload.targetID).emit('renegotiate-answer', {
      signal: payload.signal,
      callerID: socket.id,
    });
  });

  // ── Name change ──
  socket.on('change-name', (newName) => {
    const sanitized = String(newName).replace(/[<>]/g, '').trim().slice(0, 30);
    if (!sanitized) return;
    socket.displayName = sanitized;
    if (socket.roomID) {
      io.to(socket.roomID).emit('user-name-changed', {
        id: socket.id,
        newName: sanitized,
      });
    }
  });

  // ── Chat ──
  socket.on('chat-message', (text) => {
    if (!socket.roomID) return;
    const sanitizedText = String(text).replace(/[<>]/g, '').trim().slice(0, 500);
    if (!sanitizedText) return;
    io.to(socket.roomID).emit('chat-message', {
      id: socket.id,
      displayName: socket.displayName,
      text: sanitizedText,
      timestamp: Date.now(),
    });
  });

  // ── Disconnect ──
  socket.on('disconnect', () => {
    console.log(`[-] ${socket.displayName} (${socket.id})`);
    for (const roomID in rooms) {
      rooms[roomID] = rooms[roomID].filter((id) => id !== socket.id);
      io.to(roomID).emit('user-left', socket.id);
      if (rooms[roomID].length === 0) {
        delete rooms[roomID];
        console.log(`[destroy] [${roomID}]`);
      }
    }
  });
});

app.get('/', (req, res) => {
  res.json({ status: 'OneRoom Signaling Server', maxRoomSize: MAX_ROOM_SIZE });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\nOneRoom Signal Server :: port ${PORT}\n`);
});
