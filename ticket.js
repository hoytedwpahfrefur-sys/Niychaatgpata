const socket = io();
const profile = JSON.parse(localStorage.getItem('clanProfile') || '{}');
const box = document.getElementById('ticketMessages');
const list = document.getElementById('ticketList');
let activeTicketId = null;

function renderThread(ticket) {
  if (!ticket) return;
  activeTicketId = ticket.id;
  document.getElementById('ticketThreadWrap').classList.remove('hidden');
  document.getElementById('threadTitle').textContent = `Ticket ${ticket.id} • ${ticket.username}`;
  box.innerHTML = '';
  ticket.messages.forEach((m) => {
    const d = document.createElement('div');
    d.className = 'msg';
    d.innerHTML = `<img class="pfp" src="${m.pfp || 'https://placehold.co/40x40/red/white?text=A'}"><div><div class='name'>${m.displayName}</div><div>${m.text}</div></div>`;
    box.appendChild(d);
  });
  box.scrollTop = box.scrollHeight;
}

socket.on('ticketThread', renderThread);

socket.on('ticketsUpdated', (tickets) => {
  list.innerHTML = '';
  tickets.forEach((t, idx) => {
    const firstMessage = t.messages[0]?.text || '(no message yet)';
    const row = document.createElement('div');
    row.className = 'ticket-card';
    row.innerHTML = `<div><strong>Ticket ${idx + 1}</strong><div class="ticket-meta">User - ${t.username}</div><div class="ticket-meta">First message - ${firstMessage}</div></div>`;
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = 'Open';
    btn.onclick = () => socket.emit('getTicketThread', t.id);
    row.appendChild(btn);
    list.appendChild(row);
  });
});

document.getElementById('ticketForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const t = document.getElementById('ticketText');
  const text = t.value.trim();
  if (!text || !activeTicketId) return;
  socket.emit('ticketMessage', {
    ticketId: activeTicketId,
    displayName: 'Admin',
    pfp: profile.pfp || '',
    text,
    username: profile.username || 'Admin',
    fromAdmin: true
  });
  t.value = '';
  socket.emit('getTicketThread', activeTicketId);
});

socket.on('ticketMessage', (msg) => {
  if (!activeTicketId || msg.ticketId !== activeTicketId) return;
  const d = document.createElement('div');
  d.className = 'msg';
  d.innerHTML = `<img class="pfp" src="${msg.pfp || 'https://placehold.co/40x40/red/white?text=A'}"><div><div class='name'>${msg.displayName}</div><div>${msg.text}</div></div>`;
  box.appendChild(d);
  box.scrollTop = box.scrollHeight;
});

socket.emit('getTickets');
