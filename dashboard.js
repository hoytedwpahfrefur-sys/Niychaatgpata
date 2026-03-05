const socket = io();
const profile = JSON.parse(localStorage.getItem('clanProfile') || '{}');
const username = profile.username || profile.displayName || 'Guest';
const topPfp = document.getElementById('topPfp');
const dashChat = document.getElementById('dashChat');
const defaultPfp = 'https://placehold.co/60x60/red/white?text=U';
let activeTicketId = null;

topPfp.src = profile.pfp || defaultPfp;
document.getElementById('greeting').textContent = `Hey ${profile.displayName || username} !`;

document.getElementById('topPfp').onclick = () => document.getElementById('profileDropdown').classList.toggle('hidden');
document.getElementById('closeDropdown').onclick = () => document.getElementById('profileDropdown').classList.add('hidden');
document.getElementById('menuBtn').onclick = () => document.getElementById('sideMenu').classList.toggle('hidden-left');
document.getElementById('chatOpen').onclick = () => {
  window.location.href = 'chat.html';
};
document.getElementById('closeChat').onclick = () => dashChat.classList.add('hidden');

function renderStats(stats = {}) {
  document.getElementById('killsVal').textContent = stats.kills ?? 'Pending';
  document.getElementById('pointsVal').textContent = stats.points ?? 'Pending';
  document.getElementById('roleVal').textContent = stats.role || 'Pending';
}

socket.emit('getUserData', username);
socket.on('userData', renderStats);

const lb = document.getElementById('leaderboard');
function renderLeaderboard(users, type) {
  lb.classList.add('lb-switching');
  setTimeout(() => {
    lb.innerHTML = '';
    [...users]
      .sort((a, b) => (b[type] || 0) - (a[type] || 0))
      .slice(0, 10)
      .forEach((u) => {
        const li = document.createElement('li');
        li.className = 'lb-item';
        li.innerHTML = `<span style="display:flex;align-items:center;gap:.5rem;"><img class="pfp" src="${u.pfp || 'https://placehold.co/34x34/red/white?text=U'}"><span>${u.username}</span></span><strong>${u[type] || 0}</strong>`;
        lb.appendChild(li);
      });
    lb.classList.remove('lb-switching');
  }, 140);
}

function requestLeaderboard() {
  const type = document.querySelector('input[name="boardType"]:checked').value;
  socket.emit('leaderboard', type);
}

document.querySelectorAll('input[name="boardType"]').forEach((r) => r.addEventListener('change', requestLeaderboard));
socket.on('leaderboardData', ({ users, type }) => renderLeaderboard(users, type));
requestLeaderboard();

const messages = document.getElementById('dashMessages');
function addMsg(m) {
  if (m.username !== username && !m.fromAdmin) return;
  if (m.ticketId) activeTicketId = m.ticketId;
  const div = document.createElement('div');
  div.className = 'msg';
  div.innerHTML = `<img class="pfp" src="${m.pfp || defaultPfp}"><div><div class="name">${m.displayName}</div><div>${m.text}</div></div>`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

socket.on('ticketMessage', addMsg);
document.getElementById('dashChatForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('dashMsg');
  const text = input.value.trim();
  if (!text) return;
  socket.emit('ticketMessage', {
    ticketId: activeTicketId,
    displayName: profile.displayName || username,
    pfp: profile.pfp || defaultPfp,
    text,
    username,
    fromAdmin: false
  });
  input.value = '';
  input.focus();
  messages.scrollTop = messages.scrollHeight;
});

window.addEventListener('resize', () => {
  if (!dashChat.classList.contains('hidden')) {
    messages.scrollTop = messages.scrollHeight;
    document.getElementById('dashMsg').focus();
  }
});
