const socket = io();
const profile = JSON.parse(localStorage.getItem('clanProfile') || '{}');
const username = profile.username || profile.displayName || 'Guest';
const topPfp = document.getElementById('topPfp');
topPfp.src = profile.pfp || 'https://placehold.co/60x60/red/white?text=U';

document.getElementById('topPfp').onclick = () => document.getElementById('profileDropdown').classList.toggle('hidden');
document.getElementById('closeDropdown').onclick = () => document.getElementById('profileDropdown').classList.add('hidden');
document.getElementById('menuBtn').onclick = () => document.getElementById('sideMenu').classList.toggle('hidden-left');
document.getElementById('chatOpen').onclick = () => document.getElementById('dashChat').classList.remove('hidden');
document.getElementById('closeChat').onclick = () => document.getElementById('dashChat').classList.add('hidden');

function renderStats(stats={}) {
  document.getElementById('killsVal').textContent = stats.kills ?? 'Pending';
  document.getElementById('pointsVal').textContent = stats.points ?? 'Pending';
  document.getElementById('roleVal').textContent = stats.role || 'Pending';
}
socket.emit('getUserData', username);
socket.on('userData', renderStats);

const lb = document.getElementById('leaderboard');
function renderLeaderboard(users, type) {
  lb.innerHTML = '';
  [...users].sort((a,b)=>(b[type]||0)-(a[type]||0)).slice(0,10).forEach((u)=>{
    const li = document.createElement('li');
    li.textContent = `${u.username}: ${u[type]||0}`;
    lb.appendChild(li);
  });
}
function requestLeaderboard(){
  const type = document.querySelector('input[name="boardType"]:checked').value;
  socket.emit('leaderboard', type);
}
document.querySelectorAll('input[name="boardType"]').forEach(r => r.addEventListener('change', requestLeaderboard));
socket.on('leaderboardData', ({users,type}) => renderLeaderboard(users,type));
requestLeaderboard();

const messages = document.getElementById('dashMessages');
function addMsg(m){
  const div = document.createElement('div');div.className='msg';
  div.innerHTML = `<img class="pfp" src="${m.pfp}"><div><div class="name">${m.displayName}</div><div>${m.text}</div></div>`;
  messages.appendChild(div);messages.scrollTop = messages.scrollHeight;
}
socket.on('ticketMessage', addMsg);
document.getElementById('dashChatForm').addEventListener('submit',(e)=>{
  e.preventDefault();
  const input = document.getElementById('dashMsg');
  socket.emit('ticketMessage',{displayName: profile.displayName||username, pfp: profile.pfp||'', text: input.value, username});
  input.value='';
});
