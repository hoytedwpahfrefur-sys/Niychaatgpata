(function(){
  const p = JSON.parse(localStorage.getItem('clanProfile') || '{}');
  const w = JSON.parse(localStorage.getItem('wraithProfile') || '{}');
  const merged = {
    username: p.username || w.username || w.name || '',
    displayName: p.displayName || w.name || '',
    pronoun: p.pronoun || w.pronoun || '',
    description: p.description || w.desc || '',
    pfp: p.pfp || w.pfpSrc || ''
  };
  if (merged.username || merged.displayName) localStorage.setItem('clanProfile', JSON.stringify({ ...p, ...merged }));

  async function getStatus() {
    const username = merged.username || merged.displayName;
    if (!username) return { status: 'none' };
    try {
      const res = await fetch(`/api/applications/${encodeURIComponent(username)}`);
      if (!res.ok) return { status: 'none' };
      return await res.json();
    } catch {
      return { status: 'none' };
    }
  }

  window.__bridge = { merged, getStatus };

  const page = location.pathname.split('/').pop().toLowerCase() || 'index.html';
  const allowedPending = new Set(['pending.html', 'accepted.html', 'declined.html', 'index.html', 'tryout.html', 'r1jqu46st.html']);

  getStatus().then((data) => {
    const status = data.status || 'none';
    if (status === 'pending' && !allowedPending.has(page)) location.href = 'pending.html';
    if (status === 'accepted' && page === 'pending.html') location.href = 'accepted.html';
    if (status === 'declined' && page !== 'index.html') location.href = 'index.html';
  });

  if (page === 'index.html') {
    const input = document.getElementById('robloxInput') || document.getElementById('robloxUser');
    if (input && merged.username && !input.value) input.value = merged.username;
    const oldConfirm = window.confirmUsername;
    if (typeof oldConfirm === 'function') {
      window.confirmUsername = function(){
        const name = (input?.value || '').trim();
        if (!name) return oldConfirm();
        localStorage.setItem('clanProfile', JSON.stringify({ ...JSON.parse(localStorage.getItem('clanProfile')||'{}'), username:name, displayName:name }));
        oldConfirm();
      }
    }
  }

  if (page === 'tryout.html') {
    const usernameInput = document.getElementById('rblxUsername');
    if (usernameInput && merged.username && !usernameInput.value) usernameInput.value = merged.username;
    window.submitForm = async function(){
      const username = (document.getElementById('rblxUsername')?.value || '').trim();
      const kills = (document.getElementById('tsbKills')?.value || '').trim();
      const skills = (document.getElementById('skillsDesc')?.value || '').trim();
      const charVal = document.querySelector('input[name="mainChar"]:checked')?.value || '';
      if (!username || !kills || !skills || !charVal) return alert('Please fill all required fields.');
      const payload = { username, kills: Number(kills), skills, mainCharacter: charVal, submittedAt: Date.now() };
      const btn = document.getElementById('submitBtn');
      if (btn) btn.disabled = true;
      const res = await fetch('/api/applications', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      if (!res.ok) { alert('Failed to submit request.'); if (btn) btn.disabled=false; return; }
      localStorage.setItem('clanProfile', JSON.stringify({ ...JSON.parse(localStorage.getItem('clanProfile')||'{}'), username, displayName: username }));
      location.href = 'pending.html';
    }
  }

  if (page === 'profile.html') {
    window.saveProfile = function(){
      const state = window.state || {};
      const displayName = (state.name || document.getElementById('displayName')?.value || merged.displayName || '').trim();
      if (!displayName) return;
      const profile = {
        ...JSON.parse(localStorage.getItem('clanProfile') || '{}'),
        username: merged.username || displayName,
        displayName,
        pronoun: state.pronoun || merged.pronoun || '',
        description: state.desc || merged.description || '',
        pfp: state.pfpSrc || merged.pfp || ''
      };
      localStorage.setItem('clanProfile', JSON.stringify(profile));
      localStorage.setItem('wraithProfile', JSON.stringify({ ...state, name: displayName }));
      location.href = 'Dashboard.html';
    }
  }

  if (page === 'accepted.html') {
    const proceed = document.querySelector('button[onclick]');
    if (proceed) proceed.onclick = () => { location.href = 'profile.html'; };
  }
})();
