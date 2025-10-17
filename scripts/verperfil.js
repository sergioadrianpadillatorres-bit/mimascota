// scripts/verPerfil.js
document.addEventListener('DOMContentLoaded', () => {
  const DEFAULT_AVATAR = 'imagenes/d33c06ed8d607c70de9dc22b8c9b3830.jpg';
  const FALLBACK = 'https://i.imgur.com/6oKQZqV.png';

  function readMascotas(){ try { return JSON.parse(localStorage.getItem('mascotas')) || []; } catch { return []; } }

  const params = new URLSearchParams(window.location.search);
  const petParam = params.get('pet');
  let idx = null;
  if (petParam !== null && petParam !== '') {
    const n = Number(petParam);
    idx = Number.isNaN(n) ? petParam : n;
  } else {
    const pa = localStorage.getItem('perfilActivo');
    if (pa !== null) {
      const n = Number(pa);
      idx = Number.isNaN(n) ? pa : n;
    }
  }

  const mascotas = readMascotas();
  const perfilCard = document.getElementById('perfilCard');
  const notFound = document.getElementById('notFound');
  const avatarPublic = document.getElementById('avatarPublic');
  const nombrePublic = document.getElementById('nombrePublic');
  const edadPublic = document.getElementById('edadPublic');
  const direccionPublic = document.getElementById('direccionPublic');
  const c1Public = document.getElementById('celular1Public');
  const c2Public = document.getElementById('celular2Public');
  const vacPublic = document.getElementById('vacunasPublic');

  if (idx === null || mascotas[idx] === undefined) {
    if (perfilCard) perfilCard.style.display = 'none';
    if (notFound) notFound.style.display = 'block';
    return;
  }

  const m = mascotas[idx];

  nombrePublic.textContent = m.nombre || 'Sin nombre';
  edadPublic.textContent = m.edad || '';
  direccionPublic.textContent = m.direccion || 'No indicada';
  c1Public.textContent = m.celular1 || 'No indicado';
  c2Public.textContent = m.celular2 || '';
  vacPublic.textContent = m.vacunas || 'No registra';

  (async function setAvatar(){
    try {
      if (m.avatar && typeof m.avatar === 'string' && m.avatar.startsWith('data:image')) { avatarPublic.src = m.avatar; avatarPublic.onerror = () => avatarPublic.src = FALLBACK; return; }
      if (m.avatar && m.avatar.trim() !== '') {
        const ok = await testImage(m.avatar);
        if (ok) { avatarPublic.src = m.avatar; avatarPublic.onerror = () => avatarPublic.src = FALLBACK; return; }
      }
      if (m.defaultAvatar && m.defaultAvatar.trim() !== '') {
        const ok2 = await testImage(m.defaultAvatar);
        if (ok2) { avatarPublic.src = m.defaultAvatar; avatarPublic.onerror = () => avatarPublic.src = FALLBACK; return; }
      }
      // probar local default
      const candidates = [DEFAULT_AVATAR, './' + DEFAULT_AVATAR, '/' + DEFAULT_AVATAR, window.location.origin + '/' + DEFAULT_AVATAR];
      for (const c of candidates) {
        const absolute = (new URL(c, window.location.href)).href;
        const ok = await testImage(absolute);
        if (ok) { avatarPublic.src = absolute; avatarPublic.onerror = () => avatarPublic.src = FALLBACK; return; }
      }
      avatarPublic.src = FALLBACK;
    } catch(e) {
      avatarPublic.src = FALLBACK;
    }
  }());

  function testImage(url, timeout=3000){
    return new Promise((resolve) => {
      if (!url) return resolve(false);
      const img = new Image();
      let done = false;
      const t = setTimeout(()=>{ if (!done){ done = true; img.onload = img.onerror = null; resolve(false); } }, timeout);
      img.onload = () => { if (done) return; done = true; clearTimeout(t); resolve(true); };
      img.onerror = () => { if (done) return; done = true; clearTimeout(t); resolve(false); };
      try { img.src = url; } catch(e){ clearTimeout(t); resolve(false); }
    });
  }
});
