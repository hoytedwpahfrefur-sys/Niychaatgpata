const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

const users = new Map();
const channels = new Map();
const readonly = new Set(['rules','announcement','sub_announcement','giveaway','main_lineup','sub_lineup','tryouts','tryouts_result']);

function getUser(username) {
  if (!users.has(username)) {
    users.set(username, { username, kills: 0, points: 0, role: 'Pending', banned: false, allowReadonlyPosting: false });
  }
  return users.get(username);
}

io.on('connection', (socket) => {
  socket.on('getUserData', (username) => socket.emit('userData', getUser(username)));
  socket.on('leaderboard', (type) => socket.emit('leaderboardData', { users: [...users.values()], type }));

  socket.on('adminUpdateUser', (payload) => {
    if (!payload.username) return;
    users.set(payload.username, { ...getUser(payload.username), ...payload });
    io.emit('adminAck', users.get(payload.username));
  });

  socket.on('getChannelMessages', (channel) => {
    socket.emit('channelMessages', channels.get(channel) || []);
  });

  socket.on('sendChannelMessage', ({ channel, message }) => {
    const u = getUser(message.username);
    if (u.banned) return socket.emit('channelError', 'You are banned.');
    if (readonly.has(channel) && !u.allowReadonlyPosting) return socket.emit('channelError', 'This is read-only.');
    const arr = channels.get(channel) || [];
    arr.push(message);
    channels.set(channel, arr);
    io.emit('channelMessage', { channel, message });
  });

  socket.on('ticketMessage', (msg) => io.emit('ticketMessage', msg));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Clan app running on http://localhost:${PORT}`));
