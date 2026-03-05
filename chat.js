const socket = io();
const profile = JSON.parse(localStorage.getItem('clanProfile') || '{}');
const username = profile.username || profile.displayName || 'Guest';
const pfp = profile.pfp || 'https://placehold.co/50x50/red/white?text=U';

const adminMessages = document.getElementById('adminMessages');
const dmConversationList = document.getElementById('dmConversationList');
const dmThreadWrap = document.getElementById('dmThreadWrap');
const dmThreadMessages = document.getElementById('dmThreadMessages');
const dmThreadTitle = document.getElementById('dmThreadTitle');
let activeTicketId = null;
let activePeer = null;

function renderMsg(box, m) {
  const d = document.createElement('div');
  d.className = 'msg';
  d.innerHTML = `<img class='pfp' src='${m.pfp || pfp}'><div><div class='name'>${m.displayName}</div><div>${m.text}</div></div>`;
  box.appendChild(d);
  box.scrollTop = box.scrollHeight;
}

document.getElementById('chatMenuBtn').onclick = () => document.getElementById('chatMenu').classList.toggle('hidden-left');

socket.on('ticketMessage', (m) => {
  if (m.username !== username && !m.fromAdmin) return;
  if (m.ticketId) activeTicketId = m.ticketId;
  renderMsg(adminMessages, m);
});

socket.on('directMessage', (m) => {
  if (![m.from, m.to].includes(username)) return;
  socket.emit('getUserConversations', username);
  if (activePeer && [m.from, m.to].includes(activePeer)) renderMsg(dmThreadMessages, m);
});

socket.on('userConversations', (rows = []) => {
  dmConversationList.innerHTML = '';
  rows.forEach((r) => {
    const card = document.createElement('button');
    card.className = 'ticket-card dm-row';
    card.innerHTML = `<div style='display:flex;align-items:center;gap:.6rem;'><img class='pfp' src='${r.pfp || pfp}'><div><strong>${r.displayName}</strong><div class='ticket-meta'>@${r.username}</div></div></div><span class='ticket-meta'>Open</span>`;
    card.addEventListener('click', () => {
      activePeer = r.username;
      dmThreadWrap.classList.remove('hidden');
      dmThreadTitle.textContent = `Chat with ${r.displayName}`;
      dmThreadMessages.innerHTML = '';
      socket.emit('getDirectMessages', { a: username, b: r.username });
    });
    dmConversationList.appendChild(card);
  });
});

socket.on('directMessages', (msgs = []) => {
  dmThreadMessages.innerHTML = '';
  msgs.forEach((m) => renderMsg(dmThreadMessages, m));
});

document.getElementById('adminForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const i = document.getElementById('adminText');
  const text = i.value.trim();
  if (!text) return;
  socket.emit('ticketMessage', {
    ticketId: activeTicketId,
    displayName: profile.displayName || username,
    pfp,
    text,
    username,
    fromAdmin: false,
  });
  i.value = '';
});

document.getElementById('dmThreadForm').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!activePeer) return;
  const i = document.getElementById('dmThreadText');
  const text = i.value.trim();
  if (!text) return;
  socket.emit('sendDirectMessage', {
    from: username,
    to: activePeer,
    displayName: profile.displayName || username,
    pfp,
    text,
  });
  i.value = '';
});

socket.emit('getUserConversations', username);
