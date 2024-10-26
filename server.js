const express = require('express'); 
const http = require('http');
const socketIo = require('socket.io');
const { ExpressPeerServer } = require('peer');
const { v4: uuidV4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  transports: ['websocket', 'polling'], // Use WebSocket with polling as a fallback
});

const peerServer = ExpressPeerServer(server, {
  debug: true
});

// Middleware and static file serving
app.use('/peerjs', peerServer);
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`);
});

app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);

  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', userId);

    // Message handling within room
    socket.on('message', (message) => {
      io.to(roomId).emit('createMessage', message);
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      socket.to(roomId).emit('user-disconnected', userId);
    });
  });
});

// Dynamic Port Configuration for Heroku
const PORT = process.env.PORT || 3000; // Default to 3000 for local testing
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
