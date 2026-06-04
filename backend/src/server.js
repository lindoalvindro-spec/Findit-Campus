const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for dev
    methods: ['GET', 'POST']
  }
});

// Real-time communication via Socket.io
io.on('connection', (socket) => {
  console.log('User connected to socket:', socket.id);

  // User joins their own personal room based on their userId
  socket.on('join_user_room', (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`Socket ${socket.id} joined personal room: ${userId}`);
    }
  });

  // Handle message sending (broadcasting to the receiver)
  socket.on('send_message', (message) => {
    // message structure contains receiver_id, sender_id, content, etc.
    const { receiver_id } = message;
    if (receiver_id) {
      io.to(receiver_id).emit('receive_message', message);
      console.log(`Message from ${message.sender_id} forwarded to receiver room: ${receiver_id}`);
    }
  });

  // Handle typing indicator
  socket.on('typing', ({ sender_id, receiver_id }) => {
    if (receiver_id) {
      io.to(receiver_id).emit('typing', { sender_id });
    }
  });

  // Handle stop typing indicator
  socket.on('stop_typing', ({ sender_id, receiver_id }) => {
    if (receiver_id) {
      io.to(receiver_id).emit('stop_typing', { sender_id });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected from socket:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

