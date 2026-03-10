const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json({ limit: '5mb' }));
app.use(express.static(__dirname));

app.get('/x_dashboard.html', (_req, res) => res.sendFile(path.join(__dirname, 'x_Dashboard.html')));
app.get('/x_Dashboard.html', (_req, res) => res.sendFile(path.join(__dirname, 'x_Dashboard.html')));
app.get('/x_server-main.html', (_req, res) => res.sendFile(path.join(__dirname, 'x_server-main.html')));
app.get('/x_chat-main.html', (_req, res) => res.sendFile(path.join(__dirname, 'x_chat-main.html')));
app.get('/x_r1jqu46st.html', (_req, res) => res.sendFile(path.join(__dirname, 'x_r1jqu46st.html')));
app.get('/x_declined.html', (_req, res) => res.sendFile(path.join(__dirname, 'x_declined.html')));
app.get('/x_admin.html', (_req, res) => res.sendFile(path.join(__dirname, 'x_hahahaiamafmjnyourbad6677.html')));
app.get('/x_ticket.html', (_req, res) => res.sendFile(path.join(__dirname, 'x_t1c€Tp0n@l.html')));

const users = new Map();
const channels = new Map();
const tickets = new Map();
const directMessages = new Map();
const applications = new Map();
const readonly = new Set(['rules', 'announcement', 'sub_announcement', 'giveaway', 'main_lineup', 'sub_lineup', 'tryouts', 'tryouts_result']);

function getUser(username) {
  if (!users.has(username)) {
    users.set(username, { username, displayName: username, pfp: '', pronoun: '', description: '', kills: 0, points: 0, role: 'Pending', banned: false, allowReadonlyPosting: false });
  }
  return users.get(username);
}




app.post('/api/applications', (req, res) => {
  const { username, kills, skills, mainCharacter, submittedAt, proofImage, proofName, formData } = req.body || {};
  if (!username) return res.status(400).json({ error: 'username required' });
  applications.set(username, { username, kills: Number(kills || 0), skills: skills || '', mainCharacter: mainCharacter || '', proofImage: proofImage || '', proofName: proofName || '', formData: formData || {}, submittedAt: submittedAt || Date.now(), status: 'pending' });
  const user = getUser(username);
  users.set(username, { ...user, role: 'Pending' });
  res.json({ ok: true });
});

app.get('/api/applications', (_req, res) => res.json([...applications.values()]));

app.get('/api/applications/:username', (req, res) => {
  const appReq = applications.get(req.params.username);
  if (!appReq) return res.json({ status: 'none' });
  res.json(appReq);
});

app.post('/api/applications/:username/decision', (req, res) => {
  const { status } = req.body || {};
  if (!['accepted', 'declined', 'pending'].includes(status)) return res.status(400).json({ error: 'invalid status' });
  const username = req.params.username;
  const current = applications.get(username) || { username };
  applications.set(username, { ...current, status, decidedAt: Date.now() });
  const user = getUser(username);
  users.set(username, { ...user, role: status === 'accepted' ? 'Member' : 'Pending' });
  res.json({ ok: true });
});

function getDmKey(a, b) {
  return [a, b].sort().join('::');
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
  socket.on('getUsers', () => socket.emit('usersData', [...users.values()].sort((a,b)=>a.username.localeCompare(b.username))));

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
    users.set(message.username, { ...u, displayName: message.displayName || u.displayName, pfp: message.pfp || u.pfp, pronoun: message.pronoun || u.pronoun, description: message.description || u.description });
    if (u.banned) return socket.emit('channelError', 'You are banned.');
    if (readonly.has(channel) && !u.allowReadonlyPosting) return socket.emit('channelError', 'This is read-only.');
    const arr = channels.get(channel) || [];
    arr.push(message);
    channels.set(channel, arr);
    io.emit('channelMessage', { channel, message });
  });

  socket.on('ticketMessage', (msg) => {
    if (!msg?.username || !msg?.text) return;
    const tu = getUser(msg.username);
    users.set(msg.username, { ...tu, displayName: msg.displayName || tu.displayName, pfp: msg.pfp || tu.pfp });
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



  socket.on('sendDirectMessage', (msg) => {
    if (!msg?.from || !msg?.to || !msg?.text) return;
    const fu = getUser(msg.from);
    users.set(msg.from, { ...fu, displayName: msg.displayName || fu.displayName, pfp: msg.pfp || fu.pfp });
    getUser(msg.to);
    const key = getDmKey(msg.from, msg.to);
    const arr = directMessages.get(key) || [];
    const toUser = users.get(msg.to) || {};
    const out = { ...msg, toDisplayName: toUser.displayName || msg.to, toPfp: toUser.pfp || '', createdAt: Date.now() };
    arr.push(out);
    directMessages.set(key, arr);
    io.emit('directMessage', out);
  });

  socket.on('getDirectMessages', ({ a, b }) => {
    if (!a || !b) return;
    const key = getDmKey(a, b);
    socket.emit('directMessages', directMessages.get(key) || []);
  });

  socket.on('getUserConversations', (who) => {
    if (!who) return;
    const out = [];
    for (const msgs of directMessages.values()) {
      const last = msgs[msgs.length - 1];
      if (!last) continue;
      if (last.from !== who && last.to !== who) continue;
      const peer = last.from === who ? last.to : last.from;
      out.push({
        username: peer,
        displayName: last.from === who ? (last.toDisplayName || peer) : (last.displayName || peer),
        pfp: last.from === who ? (last.toPfp || '') : (last.pfp || ''),
        lastText: last.text,
        updatedAt: last.createdAt || 0
      });
    }
    out.sort((a,b)=>b.updatedAt-a.updatedAt);
    socket.emit('userConversations', out);
  });

  socket.on('getTickets', () => socket.emit('ticketsUpdated', [...tickets.values()]));
  socket.on('getTicketThread', (ticketId) => {
    const ticket = tickets.get(ticketId);
    socket.emit('ticketThread', ticket || null);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Clan app running on http://localhost:${PORT}`));

app.get('/x_72&#72--6.html', (_req, res) => res.sendFile(path.join(__dirname, 'x_hahahaiamafmjnyourbad6677.html')));
