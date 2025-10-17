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
