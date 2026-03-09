const profileForm = document.getElementById('profileForm');
const pfpInput = document.getElementById('pfpInput');
let pfpData = '';
pfpInput.addEventListener('change', async () => {
  const file = pfpInput.files?.[0];
  if (!file) return;
  pfpData = await new Promise((resolve) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.readAsDataURL(file);
  });
});
profileForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const existing = JSON.parse(localStorage.getItem('clanProfile') || '{}');
  const profile = {
    ...existing,
    displayName: document.getElementById('displayName').value.trim(),
    pronoun: document.getElementById('pronoun').value.trim(),
    description: document.getElementById('description').value.trim(),
    pfp: pfpData || existing.pfp || 'https://placehold.co/80x80/red/white?text=PFP'
  };
  localStorage.setItem('clanProfile', JSON.stringify(profile));
  window.location.href = 'x_Dashboard.html';
});
