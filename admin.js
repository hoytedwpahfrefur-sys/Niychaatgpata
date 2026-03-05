const socket = io();
const memberList = document.getElementById('memberList');

function memberCard(user) {
  const row = document.createElement('div');
  row.className = 'ticket-card member-card';
  row.innerHTML = `
    <div class="member-main">
      <strong>${user.username}</strong>
      <div class="ticket-meta">Role: ${user.role || 'Pending'} | Kills: ${user.kills || 0} | Points: ${user.points || 0}</div>
      <div class="member-controls">
        <input class="m-kills" type="number" placeholder="Kills" value="${user.kills || 0}">
        <input class="m-points" type="number" placeholder="Points" value="${user.points || 0}">
        <input class="m-role" type="text" placeholder="Role" value="${user.role || ''}">
      </div>
      <div class="member-controls">
        <button class="btn m-save">Save</button>
        <button class="btn m-ban">${user.banned ? 'Unban' : 'Ban'}</button>
        <button class="btn m-readonly">${user.allowReadonlyPosting ? 'Disable RO Chat' : 'Allow RO Chat'}</button>
      </div>
    </div>
  `;

  row.querySelector('.m-save').addEventListener('click', () => {
    socket.emit('adminUpdateUser', {
      username: user.username,
      kills: Number(row.querySelector('.m-kills').value || 0),
      points: Number(row.querySelector('.m-points').value || 0),
      role: row.querySelector('.m-role').value.trim() || 'Pending',
      banned: user.banned,
      allowReadonlyPosting: user.allowReadonlyPosting,
    });
  });

  row.querySelector('.m-ban').addEventListener('click', () => {
    socket.emit('adminUpdateUser', {
      username: user.username,
      kills: Number(row.querySelector('.m-kills').value || 0),
      points: Number(row.querySelector('.m-points').value || 0),
      role: row.querySelector('.m-role').value.trim() || 'Pending',
      banned: !user.banned,
      allowReadonlyPosting: user.allowReadonlyPosting,
    });
  });

  row.querySelector('.m-readonly').addEventListener('click', () => {
    socket.emit('adminUpdateUser', {
      username: user.username,
      kills: Number(row.querySelector('.m-kills').value || 0),
      points: Number(row.querySelector('.m-points').value || 0),
      role: row.querySelector('.m-role').value.trim() || 'Pending',
      banned: user.banned,
      allowReadonlyPosting: !user.allowReadonlyPosting,
    });
  });

  return row;
}

function renderUsers(users = []) {
  memberList.innerHTML = '';
  users.sort((a, b) => a.username.localeCompare(b.username)).forEach((u) => memberList.appendChild(memberCard(u)));
}

socket.on('usersData', renderUsers);
socket.on('adminAck', () => socket.emit('getUsers'));
socket.emit('getUsers');
