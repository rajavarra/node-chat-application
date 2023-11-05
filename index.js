const {
  app: { port },
} = require('./configuration/config');
const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const path = require('path');
const {
  newUser,
  getIndividualRoomUsers,
  formatMessage,
  getActiveUser,
  exitRoom,
} = require('./helper/helper');
const PORT = process.env.PORT || port;

const app = express();
const server = http.createServer(app);
const io = socketio(server);
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = newUser(socket.id, username, room);
    console.log('created new user');

    socket.join(user.room);

    socket.emit(
      'message',
      formatMessage('Admin', 'Messages are limited to this room')
    );

    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage('Admin', `${user.username} has joined the room`)
      );

    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getIndividualRoomUsers(user.room),
    });
  });

  socket.on('chatMessage', (msg) => {
    const user = getActiveUser(socket.id);
    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  socket.on('disconnect', () => {
    const user = exitRoom(socket.id);

    io.to(user.room).emit(
      'message',
      formatMessage('Admin', `${user.username} has left the room`)
    );

    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getIndividualRoomUsers(user.room),
    });
  });
});

server.listen(PORT, (error) => {
  if (!error) {
    console.log(`Server running on port: ${PORT}`);
  } else {
    console.log(`Server Failed To Start. error: ${error}`);
  }
});
