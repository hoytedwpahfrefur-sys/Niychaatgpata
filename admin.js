const socket = io();
const out = document.getElementById('adminOutput');

document.getElementById('adminForm').addEventListener('submit',(e)=>{
  e.preventDefault();
  const payload = {
    username: document.getElementById('targetUser').value.trim(),
    kills: Number(document.getElementById('kills').value || 0),
    points: Number(document.getElementById('points').value || 0),
    role: document.getElementById('role').value.trim(),
    banned: document.getElementById('banned').checked,
    allowReadonlyPosting: document.getElementById('allowReadonlyPosting').checked,
  };
  socket.emit('adminUpdateUser', payload);
});
socket.on('adminAck', (u)=> out.textContent = `Updated: ${JSON.stringify(u, null, 2)}`);
