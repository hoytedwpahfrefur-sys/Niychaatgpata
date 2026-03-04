const socket = io();
const profile = JSON.parse(localStorage.getItem('clanProfile') || '{}');
const username = profile.username || 'Admin';
const box = document.getElementById('ticketMessages');
function render(m){
  const d=document.createElement('div');d.className='msg';
  d.innerHTML = `<img class="pfp" src="${m.pfp||'https://placehold.co/40x40/red/white?text=A'}"><div><div class='name'>${m.displayName}</div><div>${m.text}</div></div>`;
  box.appendChild(d);box.scrollTop=box.scrollHeight;
}
socket.on('ticketMessage', render);
document.getElementById('ticketForm').addEventListener('submit',(e)=>{
  e.preventDefault();
  const t = document.getElementById('ticketText');
  socket.emit('ticketMessage',{displayName:'Admin',pfp:profile.pfp||'',text:t.value,username});
  t.value='';
});
