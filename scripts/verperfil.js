document.addEventListener("DOMContentLoaded", () => {
  const DEFAULT_AVATAR = "imagenes/d33c06ed8d607c70de9dc22b8c9b3830.jpg";
  const mascotas = JSON.parse(localStorage.getItem("mascotas")) || [];

  const params = new URLSearchParams(window.location.search);
  const idx = parseInt(params.get("pet"), 10) || 0;

  const avatar = document.getElementById("verAvatar");
  const nombre = document.getElementById("verNombre");
  const edad = document.getElementById("verEdad");
  const direccion = document.getElementById("verDireccion");
  const celular1 = document.getElementById("verCelular1");
  const celular2 = document.getElementById("verCelular2");
  const vacunas = document.getElementById("verVacunas");

  const editarPerfilBtn = document.getElementById("editarPerfilBtn");
  const regresarBtn = document.getElementById("regresarBtn");
  const registrarBtn = document.getElementById("registrarBtn");
  const noPerfil = document.getElementById("noPerfil");

  // --- Si hay datos guardados ---
  if (mascotas.length > 0 && mascotas[idx]) {
    const m = mascotas[idx];

    avatar.src = m.avatar || DEFAULT_AVATAR;
    nombre.textContent = m.nombre || "—";
    edad.textContent = m.edad || "—";
    direccion.textContent = m.direccion || "—";
    celular1.textContent = m.celular1 || "—";
    celular2.textContent = m.celular2 || "—";
    vacunas.textContent = m.vacunas || "—";

    noPerfil.classList.add("hidden");
  } else {
    // No hay perfil
    document.getElementById("perfilInfo").style.display = "none";
    document.querySelector(".verperfil-botones").style.display = "none";
    noPerfil.classList.remove("hidden");
  }

  // --- Botones ---
  editarPerfilBtn.addEventListener("click", () => {
    window.location.href = `perfil.html?pet=${idx}`;
  });

  regresarBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  registrarBtn.addEventListener("click", () => {
    window.location.href = "perfil.html";
  });
});


// Al cargar verperfil.html: leer hash ? mostrar perfil si viene 'p='
document.addEventListener("DOMContentLoaded", () => {
  function parseHash() {
    const hash = location.hash.substring(1); // quitar '#'
    if (!hash) return null;
    const params = new URLSearchParams(hash.replace(/\?/,''));
    const p = params.get('p');
    if (!p) return null;
    try {
      const json = decodeURIComponent(escape(atob(p)));
      return JSON.parse(json);
    } catch (e) {
      console.error("Error decoding profile from hash", e);
      return null;
    }
  }

  const profile = parseHash();
  if (!profile) {
    // no hay perfil en la URL: tu comportamiento normal (por ejemplo, buscar por pet query param)
    return;
  }

  // Aquí ya tienes el objeto profile con thumb y campos
  // Ahora muéstralo en tu HTML. Ajusta selectores según tu verperfil.html
  const avatarEl = document.getElementById('avatarView'); // <img id="avatarView">
  const nombreEl = document.getElementById('nombreView'); // elementos donde mostrar
  const edadEl = document.getElementById('edadView');
  const direccionEl = document.getElementById('direccionView');
  const cel1El = document.getElementById('cel1View');
  const cel2El = document.getElementById('cel2View');
  const vacunasEl = document.getElementById('vacunasView');

  // fallback: crear elementos si no existen (por seguridad)
  if (!avatarEl) {
    const img = document.createElement('img');
    img.id = 'avatarView';
    img.style.width = '180px';
    img.style.height = '180px';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '8px';
    document.body.prepend(img);
  }

  document.getElementById('avatarView').src = profile.thumb || profile.avatar || 'imagenes/d33c06ed8d607c70de9dc22b8c9b3830.jpg';
  if (nombreEl) nombreEl.textContent = profile.nombre || '';
  if (edadEl) edadEl.textContent = profile.edad || '';
  if (direccionEl) direccionEl.textContent = profile.direccion || '';
  if (cel1El) cel1El.textContent = profile.celular1 || '';
  if (cel2El) cel2El.textContent = profile.celular2 || '';
  if (vacunasEl) vacunasEl.textContent = profile.vacunas || '';
});
