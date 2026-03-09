(function(){
  if (typeof io === 'undefined') return;
  const socket = io();
  const profile = JSON.parse(localStorage.getItem('clanProfile') || '{}');
  const username = profile.username || profile.displayName || 'Guest';
  const pfp = profile.pfp || '';
  let activePeer = null;

  function fmt(ts){ const d=new Date(ts||Date.now()); return d.toTimeString().slice(0,5); }
  function dlabel(ts){ const d=new Date(ts||Date.now()); return d.toDateString()===new Date().toDateString()?'TODAY':d.toLocaleDateString(); }
  function upsertConversation(row){
    const idx = DMS.findIndex((x)=>x.id===row.username);
    const base = { id:row.username, name:row.displayName||row.username, initials:(row.displayName||row.username).slice(0,2).toUpperCase(), status:'online', role:'MEMBER', kills:'0', points:'0', preview:row.lastText||'', time:'now', unread:0, messages:[] };
    if (idx >= 0) DMS[idx] = { ...DMS[idx], ...base, preview:row.lastText||DMS[idx].preview };
    else DMS.push(base);
  }

  const oldOpen = window.openDm;
  window.openDm = function(id){ activePeer = id==='admin' ? null : id; oldOpen(id); if (activePeer) socket.emit('getDirectMessages', { a: username, b: activePeer }); };

  window.send = function(text,img=null){
    if(!window.activeDm || (!text.trim() && !img)) return;
    if(window.activeDm==='admin'){
      socket.emit('ticketMessage',{ displayName: profile.displayName || username, pfp, text:text.trim()||'[image]', username, fromAdmin:false });
      return;
    }
    socket.emit('sendDirectMessage', { from: username, to: window.activeDm, displayName: profile.displayName || username, pfp, text: text.trim() || '[image]' });
    document.getElementById('msgInput').value='';
  };

  socket.on('userConversations', (rows=[])=>{ rows.forEach(upsertConversation); buildList(document.getElementById('searchInput')?.value || ''); });
  socket.on('directMessages', (msgs=[])=>{
    if (!activePeer) return;
    const conv = DMS.find((x)=>x.id===activePeer); if(!conv) return;
    conv.messages = msgs.map((m,i)=>({ id:i+1, from:m.from===username?'me':m.from, text:m.text, ts:fmt(m.createdAt), date:dlabel(m.createdAt) }));
    if (window.activeDm===activePeer) renderMsgs(conv.messages, false, conv);
  });
  socket.on('directMessage', (m)=>{
    if (![m.from,m.to].includes(username)) return;
    socket.emit('getUserConversations', username);
    if (activePeer && [m.from,m.to].includes(activePeer)) socket.emit('getDirectMessages', { a: username, b: activePeer });
  });
  socket.on('ticketMessage', (m)=>{
    if (m.username !== username && !m.fromAdmin) return;
    ADMIN.messages.push({ id:Date.now(), from:m.fromAdmin?'admin':'me', text:m.text, ts:fmt(m.createdAt), date:dlabel(m.createdAt) });
    if (window.activeDm==='admin') renderMsgs(ADMIN.messages, true, ADMIN);
  });

  socket.emit('getUserConversations', username);
})();
