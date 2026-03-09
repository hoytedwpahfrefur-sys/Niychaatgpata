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
    } catch { return { status: 'none' }; }
  }
  window.__bridge = { merged, getStatus };

  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const adminPages = new Set(['r1jqu46st.html','admin.html','hahahaiamafmjnyourbad6677.html']);

  getStatus().then((data) => {
    const status = data.status || 'none';
    if (adminPages.has(page)) return;
    if (status === 'pending' && page !== 'pending.html') location.href = 'pending.html';
    if (status === 'accepted' && ['index.html','tryout.html','pending.html','declined.html'].includes(page)) location.href = 'accepted.html';
    if (status === 'declined' && page !== 'declined.html') location.href = 'declined.html';
  });

  if (page === 'tryout.html') {
    const usernameInput = document.getElementById('rblxUsername');
    if (usernameInput && merged.username && !usernameInput.value) usernameInput.value = merged.username;
    window.submitForm = async function(){
      const username = (document.getElementById('rblxUsername')?.value || '').trim();
      const kills = (document.getElementById('tsbKills')?.value || '').trim();
      const skills = (document.getElementById('skillsDesc')?.value || '').trim();
      const charVal = document.querySelector('input[name="mainChar"]:checked')?.value || '';
      const proof = document.getElementById('killProof')?.files?.[0];
      if (!username || !kills || !skills || !charVal || !proof) return alert('Please fill all required fields.');
      const proofImage = await new Promise((resolve)=>{ const fr=new FileReader(); fr.onload=()=>resolve(fr.result); fr.readAsDataURL(proof); });
      const payload = {
        username,
        kills: Number(kills),
        skills,
        mainCharacter: charVal,
        proofName: proof.name || '',
        proofImage,
        formData: { username, kills:Number(kills), skills, mainCharacter:charVal, proofName: proof.name || '' },
        submittedAt: Date.now()
      };
      const btn = document.getElementById('submitBtn'); if (btn) btn.disabled = true;
      const res = await fetch('/api/applications', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      if (!res.ok) { alert('Failed to submit request.'); if (btn) btn.disabled=false; return; }
      localStorage.setItem('clanProfile', JSON.stringify({ ...JSON.parse(localStorage.getItem('clanProfile')||'{}'), username, displayName: username }));
      location.href = 'pending.html';
    };
  }

  if (page === 'profile.html') {
    window.saveProfile = function(){
      const state = window.state || {};
      const displayName = (state.name || document.getElementById('displayName')?.value || merged.displayName || '').trim();
      if (!displayName) return;
      const profile = { ...JSON.parse(localStorage.getItem('clanProfile') || '{}'), username: merged.username || displayName, displayName, pronoun: state.pronoun || merged.pronoun || '', description: state.desc || merged.description || '', pfp: state.pfpSrc || merged.pfp || '' };
      localStorage.setItem('clanProfile', JSON.stringify(profile));
      localStorage.setItem('wraithProfile', JSON.stringify({ ...state, name: displayName }));
      location.href = 'Dashboard.html';
    };
  }

  if (page === 'accepted.html') setTimeout(()=>{ location.href='profile.html'; }, 2200);
})();
