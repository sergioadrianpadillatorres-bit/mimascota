document.addEventListener("DOMContentLoaded", () => {
  const DEFAULT_AVATAR = "imagenes/d33c06ed8d607c70de9dc22b8c9b3830.jpg";
  let mascotas = JSON.parse(localStorage.getItem("mascotas")) || [];

  const params = new URLSearchParams(window.location.search);
  const idx = params.get("pet");

  const avatarImg = document.getElementById("avatarMascota");
  const avatarInput = document.getElementById("avatarInput");
  const btnGuardar = document.getElementById("btnGuardar");
  const btnEliminar = document.getElementById("btnEliminar");
  const btnQR = document.getElementById("btnQR");
  const qrContainer = document.getElementById("qrContainer");

  const nombreInput = document.getElementById("nombre");
  const edadInput = document.getElementById("edad");
  const direccionInput = document.getElementById("direccion");
  const celular1Input = document.getElementById("celular1");
  const celular2Input = document.getElementById("celular2");
  const vacunasInput = document.getElementById("vacunas");

  // --- Mostrar datos existentes ---
  if (mascotas[idx]) {
    const m = mascotas[idx];
    avatarImg.src = m.avatar || DEFAULT_AVATAR;
    nombreInput.value = m.nombre || "";
    edadInput.value = m.edad || "";
    direccionInput.value = m.direccion || "";
    celular1Input.value = m.celular1 || "";
    celular2Input.value = m.celular2 || "";
    vacunasInput.value = m.vacunas || "";
  } else {
    avatarImg.src = DEFAULT_AVATAR;
  }

  // --- Cambiar avatar ---
  avatarInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (!mascotas[idx]) mascotas[idx] = {};
      mascotas[idx].avatar = ev.target.result;
      localStorage.setItem("mascotas", JSON.stringify(mascotas));
      avatarImg.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  // --- Guardar / Modificar perfil ---
  btnGuardar.addEventListener("click", () => {
    const nombre = nombreInput.value.trim();
    const edad = edadInput.value.trim();
    const direccion = direccionInput.value.trim();
    const celular1 = celular1Input.value.trim();
    const celular2 = celular2Input.value.trim();
    const vacunas = vacunasInput.value.trim();

    if (!nombre || !direccion || !celular1) {
      alert("Por favor completa los campos obligatorios (nombre, dirección, celular).");
      return;
    }

    const mascota = {
      nombre,
      edad,
      direccion,
      celular1,
      celular2,
      vacunas,
      avatar: mascotas[idx]?.avatar || DEFAULT_AVATAR,
    };

    if (idx !== null && idx < mascotas.length) {
      mascotas[idx] = mascota;
    } else {
      mascotas.push(mascota);
    }

    localStorage.setItem("mascotas", JSON.stringify(mascotas));
    alert("✅ Perfil guardado correctamente.");
    window.location.href = "index.html";
  });

  // --- Eliminar perfil ---
  btnEliminar.addEventListener("click", () => {
    if (confirm("¿Seguro que deseas eliminar este perfil?")) {
      mascotas.splice(idx, 1);
      localStorage.setItem("mascotas", JSON.stringify(mascotas));
      alert("Perfil eliminado correctamente.");
      window.location.href = "index.html";
    }
  });

  // --- Generar QR ---
  btnQR.addEventListener("click", () => {
    const mascota = mascotas[idx];
    if (!mascota) {
      alert("No hay datos de la mascota para generar el QR.");
      return;
    }

    const qrData = `
      Nombre: ${mascota.nombre}
      Edad: ${mascota.edad}
      Dirección: ${mascota.direccion}
      Celular 1: ${mascota.celular1}
      Celular 2: ${mascota.celular2}
      Vacunas: ${mascota.vacunas}
    `;

    const qrImg = document.createElement("img");
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrData)}&size=200x200`;
    qrImg.alt = "QR de la mascota";

    qrContainer.innerHTML = "";
    qrContainer.appendChild(qrImg);
  });
});
