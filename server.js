const socket = io();
const profile = JSON.parse(localStorage.getItem('clanProfile') || '{}');
const username = profile.username || profile.displayName || 'Guest';
const readonly = new Set(['rules','announcement','sub_announcement','giveaway','main_lineup','sub_lineup','tryouts','tryouts_result']);
let currentChannel = 'rules';
const container = document.getElementById('channelMessages');

function renderMsg(m){
  const div=document.createElement('div');div.className='msg';
  div.innerHTML=`<img class='pfp' src='${m.pfp||"https://placehold.co/40x40/red/white?text=U"}'><div><div class='name'>${m.displayName}</div><div>${m.text||''}</div>${m.image?`<img src='${m.image}' style='max-width:200px;border-radius:8px;margin-top:6px'>`:''}</div>`;
  container.appendChild(div); container.scrollTop=container.scrollHeight;
}

function openChannel(ch){
  currentChannel = ch;
  document.getElementById('currentChannel').textContent = `# ${ch}`;
  container.innerHTML='';
  socket.emit('getChannelMessages', ch);
}
document.querySelectorAll('.channel').forEach(btn => btn.onclick = ()=>openChannel(btn.dataset.channel));
socket.on('channelMessages',(msgs)=>{container.innerHTML='';msgs.forEach(renderMsg)});
socket.on('channelMessage',(p)=>{if(p.channel===currentChannel) renderMsg(p.message)});

async function fileToData(file){return await new Promise(res=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.readAsDataURL(file);});}

document.getElementById('channelForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const text = document.getElementById('channelText').value.trim();
  const imageFile = document.getElementById('channelImage').files?.[0];
  const image = imageFile ? await fileToData(imageFile) : '';
  if (!text && !image) return;
  socket.emit('sendChannelMessage', {
    channel: currentChannel,
    message: {username, displayName: profile.displayName||username, pfp: profile.pfp||'', text, image}
  });
  document.getElementById('channelText').value='';
  document.getElementById('channelImage').value='';
});

socket.on('channelError', (msg) => alert(msg));
openChannel(currentChannel);
