const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

app.get('/dashboard.html', (_req, res) => res.sendFile(path.join(__dirname, 'Dashboard.html')));
app.get('/server.html', (_req, res) => res.sendFile(path.join(__dirname, 'Server.html')));
app.get('/admin.html', (_req, res) => res.sendFile(path.join(__dirname, '72&#72--6.html')));
app.get('/ticket.html', (_req, res) => res.sendFile(path.join(__dirname, 't1c€Tp0n@l.html')));

const users = new Map();
const channels = new Map();
const tickets = new Map();
const readonly = new Set(['rules', 'announcement', 'sub_announcement', 'giveaway', 'main_lineup', 'sub_lineup', 'tryouts', 'tryouts_result']);

function getUser(username) {
  if (!users.has(username)) {
    users.set(username, { username, kills: 0, points: 0, role: 'Pending', banned: false, allowReadonlyPosting: false });
  }
  return users.get(username);
}

function ensureTicket(username, firstMessage) {
  const existing = [...tickets.values()].find((t) => t.username === username && t.status === 'open');
  if (existing) return existing;
  const id = `t-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const ticket = { id, username, status: 'open', createdAt: Date.now(), messages: firstMessage ? [firstMessage] : [] };
  tickets.set(id, ticket);
  return ticket;
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

  socket.on('ticketMessage', (msg) => {
    if (!msg?.username || !msg?.text) return;
    if (msg.fromAdmin) {
      const ticket = tickets.get(msg.ticketId);
      if (!ticket) return;
      const out = { ...msg, ticketId: ticket.id, createdAt: Date.now() };
      ticket.messages.push(out);
      io.emit('ticketMessage', out);
    } else {
      const initial = { ...msg, fromAdmin: false, createdAt: Date.now() };
      const ticket = ensureTicket(msg.username, initial);
      if (ticket.messages[ticket.messages.length - 1] !== initial) {
        ticket.messages.push(initial);
      }
      const out = { ...initial, ticketId: ticket.id };
      io.emit('ticketMessage', out);
    }
    io.emit('ticketsUpdated', [...tickets.values()]);
  });

  socket.on('getTickets', () => socket.emit('ticketsUpdated', [...tickets.values()]));
  socket.on('getTicketThread', (ticketId) => {
    const ticket = tickets.get(ticketId);
    socket.emit('ticketThread', ticket || null);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Clan app running on http://localhost:${PORT}`));
