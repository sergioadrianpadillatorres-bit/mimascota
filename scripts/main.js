// scripts/main.js
const DEFAULT_AVATAR = 'imagenes/d33c06ed8d607c70de9dc22b8c9b3830.jpg';

function readMascotas() {
  try { return JSON.parse(localStorage.getItem('mascotas')) || []; }
  catch { return []; }
}
function saveMascotas(list) { localStorage.setItem('mascotas', JSON.stringify(list)); }

function createCard(m, i) {
  const card = document.createElement('div');
  card.className = 'profile-card';
  card.style.width = '220px';
  card.style.padding = '12px';
  card.style.borderRadius = '10px';
  card.style.background = '#fff';
  card.style.boxShadow = '0 6px 18px rgba(0,0,0,0.06)';
  card.style.display = 'flex';
  card.style.flexDirection = 'column';
  card.style.alignItems = 'center';
  card.style.gap = '8px';

  const img = document.createElement('img');
  img.src = m.avatar || m.defaultAvatar || DEFAULT_AVATAR;
  img.alt = m.nombre || 'Mascota';
  img.style.width = '96px';
  img.style.height = '96px';
  img.style.objectFit = 'cover';
  img.style.borderRadius = '50%';
  card.appendChild(img);

  const name = document.createElement('div');
  name.textContent = m.nombre || 'Sin nombre';
  name.style.fontWeight = '700';
  name.style.color = '#4c0788';
  card.appendChild(name);

  const mini = document.createElement('div');
  mini.innerHTML = `<small>${m.direccion || ''}</small><br/><small>${m.celular1 || ''}</small>`;
  mini.style.textAlign = 'center';
  mini.style.fontSize = '12px';
  card.appendChild(mini);

  const btns = document.createElement('div');
  btns.style.display = 'flex';
  btns.style.gap = '6px';

  const edit = document.createElement('button');
  edit.className = 'btn ghost';
  edit.textContent = 'Editar';
  edit.onclick = (e) => {
    e.stopPropagation();
    // abrir perfil con ?pet=index
    window.location.href = `perfil.html?pet=${i}`;
  };

  const view = document.createElement('button');
  view.className = 'btn ghost';
  view.textContent = 'Ver';
  view.onclick = (e) => {
    e.stopPropagation();
    window.open(`verPerfil.html?pet=${i}`, '_blank');
  };

  const del = document.createElement('button');
  del.className = 'btn danger';
  del.textContent = 'Eliminar';
  del.onclick = (e) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar este perfil?')) return;
    const arr = readMascotas();
    arr.splice(i,1);
    saveMascotas(arr);
    loadProfiles();
  };

  btns.appendChild(edit);
  btns.appendChild(view);
  btns.appendChild(del);
  card.appendChild(btns);

  return card;
}

function loadProfiles(){
  const container = document.getElementById('profiles');
  if (!container) return;
  container.innerHTML = '';
  const list = readMascotas();
  if (list.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'No hay mascotas. Crea una nueva.';
    p.style.textAlign = 'center';
    container.appendChild(p);
    return;
  }
  const grid = document.createElement('div');
  grid.style.display = 'flex';
  grid.style.flexWrap = 'wrap';
  grid.style.gap = '12px';
  grid.style.justifyContent = 'center';
  list.forEach((m,i) => {
    grid.appendChild(createCard(m,i));
  });
  container.appendChild(grid);
}

document.addEventListener('DOMContentLoaded', () => {
  loadProfiles();
  const addBtn = document.getElementById('addProfileBtn');
  const clearBtn = document.getElementById('clearAllBtn');

  addBtn.addEventListener('click', () => {
    const list = readMascotas();
    const nuevo = {
      nombre: 'Nueva mascotas',
      edad: '',
      direccion: '',
      celular1: '',
      celular2: '',
      vacunas: '',
      avatar: '',
      defaultAvatar: DEFAULT_AVATAR
    };
    list.push(nuevo);
    saveMascotas(list);
    const newIndex = list.length - 1;
    // abrir edición del nuevo
    window.location.href = `perfil.html?pet=${newIndex}`;
  });

  clearBtn.addEventListener('click', () => {
    if (!confirm('Eliminar todos los perfiles?')) return;
    localStorage.removeItem('mascotas');
    loadProfiles();
  });
});
