const socket = io();
const profile = JSON.parse(localStorage.getItem('clanProfile') || '{}');
const username = profile.username || profile.displayName || 'Guest';
const readonly = new Set(['rules', 'announcement', 'sub_announcement', 'giveaway', 'main_lineup', 'sub_lineup', 'tryouts', 'tryouts_result']);
let currentChannel = 'rules';
let activeDmUser = null;

const container = document.getElementById('channelMessages');
const layout = document.getElementById('serverLayout');
const panel = document.getElementById('channelPanel');
const dmBox = document.getElementById('dmMessages');
const userModal = document.getElementById('userProfileModal');

function isReadonlyBlocked(channel) {
  return readonly.has(channel) && !profile.allowReadonlyPosting;
}

function updateFormVisibility(channel) {
  document.getElementById('channelForm').classList.toggle('hidden', isReadonlyBlocked(channel));
}

function renderMsg(m) {
  const div = document.createElement('div');
  div.className = 'msg';
  const meta = encodeURIComponent(JSON.stringify({
    username: m.username,
    displayName: m.displayName,
    robloxUsername: m.robloxUsername || m.username,
    pronoun: m.pronoun || 'Not set',
    description: m.description || 'No description',
    pfp: m.pfp || ''
  }));

  div.innerHTML = `<img class='pfp' src='${m.pfp || 'https://placehold.co/40x40/red/white?text=U'}'><div><button class='name profile-link' data-user='${meta}'>${m.displayName}</button><div>${m.text || ''}</div>${m.image ? `<img src='${m.image}' style='max-width:200px;border-radius:8px;margin-top:6px'>` : ''}</div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function renderDmMessage(m) {
  const div = document.createElement('div');
  div.className = 'msg';
  div.innerHTML = `<img class='pfp' src='${m.pfp || 'https://placehold.co/40x40/red/white?text=U'}'><div><div class='name'>${m.displayName}</div><div>${m.text}</div></div>`;
  dmBox.appendChild(div);
  dmBox.scrollTop = dmBox.scrollHeight;
}

function openUserModal(userData) {
  activeDmUser = userData;
  document.getElementById('modalDisplayName').textContent = userData.displayName;
  document.getElementById('modalUserMeta').textContent = `@${userData.username}`;
  document.getElementById('modalPfp').src = userData.pfp || 'https://placehold.co/70x70/red/white?text=U';
  document.getElementById('modalRoblox').textContent = userData.robloxUsername;
  document.getElementById('modalPronoun').textContent = userData.pronoun;
  document.getElementById('modalDesc').textContent = userData.description;
  dmBox.innerHTML = '';
  userModal.classList.remove('hidden');
  socket.emit('getDirectMessages', { a: username, b: userData.username });
}

function setActiveChannel(channel) {
  document.querySelectorAll('.channel').forEach((btn) => btn.classList.toggle('active', btn.dataset.channel === channel));
}

function openChannel(ch) {
  currentChannel = ch;
  document.getElementById('currentChannel').textContent = `# ${ch}`;
  container.innerHTML = '';
  setActiveChannel(ch);
  updateFormVisibility(ch);
  panel.classList.remove('hidden');
  if (window.innerWidth <= 780) layout.classList.add('mobile-channel-open');
  socket.emit('getChannelMessages', ch);
}

function closeChannel() {
  if (window.innerWidth <= 780) {
    layout.classList.remove('mobile-channel-open');
    panel.classList.add('hidden');
  }
}

document.getElementById('closeChannelView').addEventListener('click', closeChannel);
document.getElementById('serverMenuBtn').addEventListener('click', () => {
  document.getElementById('serverMiniMenu').classList.toggle('hidden-left');
});
document.getElementById('closeUserModal').addEventListener('click', () => userModal.classList.add('hidden'));

document.querySelectorAll('.channel').forEach((btn) => {
  btn.onclick = () => openChannel(btn.dataset.channel);
});

container.addEventListener('click', (e) => {
  const btn = e.target.closest('.profile-link');
  if (!btn) return;
  const userData = JSON.parse(decodeURIComponent(btn.dataset.user));
  openUserModal(userData);
});

socket.on('channelMessages', (msgs) => {
  container.innerHTML = '';
  msgs.forEach(renderMsg);
});

socket.on('channelMessage', (p) => {
  if (p.channel === currentChannel) renderMsg(p.message);
});

socket.on('directMessages', (msgs) => {
  dmBox.innerHTML = '';
  msgs.forEach(renderDmMessage);
});

socket.on('directMessage', (msg) => {
  if (!activeDmUser) return;
  const isPair = [msg.from, msg.to].includes(username) && [msg.from, msg.to].includes(activeDmUser.username);
  if (isPair) renderDmMessage(msg);
});

async function fileToData(file) {
  return await new Promise((res) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.readAsDataURL(file);
  });
}

document.getElementById('channelForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = document.getElementById('channelText').value.trim();
  const imageFile = document.getElementById('channelImage').files?.[0];
  const image = imageFile ? await fileToData(imageFile) : '';
  if (!text && !image) return;
  socket.emit('sendChannelMessage', {
    channel: currentChannel,
    message: {
      username,
      displayName: profile.displayName || username,
      pfp: profile.pfp || '',
      robloxUsername: profile.username || username,
      pronoun: profile.pronoun || 'Not set',
      description: profile.description || 'No description',
      text,
      image
    }
  });
  document.getElementById('channelText').value = '';
  document.getElementById('channelImage').value = '';
});

document.getElementById('dmForm').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!activeDmUser) return;
  const input = document.getElementById('dmText');
  const text = input.value.trim();
  if (!text) return;
  socket.emit('sendDirectMessage', {
    from: username,
    to: activeDmUser.username,
    displayName: profile.displayName || username,
    pfp: profile.pfp || '',
    text
  });
  input.value = '';
});

socket.on('channelError', (msg) => alert(msg));
if (window.innerWidth > 780) openChannel(currentChannel);
