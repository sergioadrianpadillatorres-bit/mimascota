document.addEventListener("DOMContentLoaded", () => {
  const DEFAULT_AVATAR = "imagenes/d33c06ed8d607c70de9dc22b8c9b3830.jpg";
  let mascotas = JSON.parse(localStorage.getItem("mascotas")) || [];

  const params = new URLSearchParams(window.location.search);
  const idx = parseInt(params.get("pet"), 10);

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

  // 🟣 Cargar datos existentes
  if (!isNaN(idx) && mascotas[idx]) {
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

  // 🟣 Cambiar avatar (compatible con móviles)
  avatarInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const imgData = ev.target.result;

      // Verifica el tamaño antes de guardar (máx 10ñ MB)
      if (imgData.length > 100_000_000) {
        alert("La imagen es muy grande (máx 50MB). Usa una más pequeña.");
        return;
      }

      // Asegura índice válido
      if (isNaN(idx) || !mascotas[idx]) mascotas[idx] = {};

      mascotas[idx].avatar = imgData;
      localStorage.setItem("mascotas", JSON.stringify(mascotas));

      avatarImg.src = imgData;
      alert("✅ Imagen actualizada correctamente.");
    };

    reader.onerror = () => {
      alert("Error al leer la imagen. Intenta nuevamente.");
    };

    reader.readAsDataURL(file);
  });

  // 🟣 Guardar / Modificar perfil
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

    if (!isNaN(idx) && idx >= 0 && idx < mascotas.length) {
      mascotas[idx] = mascota;
    } else {
      mascotas.push(mascota);
    }

    try {
      localStorage.setItem("mascotas", JSON.stringify(mascotas));
      alert("✅ Perfil guardado correctamente.");
      window.location.href = "index.html";
    } catch (err) {
      alert("❌ Error guardando el perfil. Verifica espacio disponible.");
      console.error(err);
    }
  });

  // 🟣 Eliminar perfil
  btnEliminar.addEventListener("click", () => {
    if (confirm("¿Seguro que deseas eliminar este perfil?")) {
      mascotas.splice(idx, 1);
      localStorage.setItem("mascotas", JSON.stringify(mascotas));
      alert("Perfil eliminado correctamente.");
      window.location.href = "index.html";
    }
  });

  // 🟣 Generar QR
  btnQR.addEventListener("click", async () => {
    const mascota = mascotas[idx];
    if (!mascota) {
      alert("No hay datos de la mascota para generar el QR.");
      return;
    }

    qrContainer.innerHTML = "";
    qrContainer.style.display = "flex";
    qrContainer.style.flexDirection = "column";
    qrContainer.style.alignItems = "center";

    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    canvas.style.width = "150px";
    canvas.style.height = "150px";
    canvas.style.border = "3px solid var(--purple)";
    canvas.style.borderRadius = "8px";
    canvas.style.background = "#fff";
    qrContainer.appendChild(canvas);

    const qrText = `
      Nombre: ${mascota.nombre}
      Edad: ${mascota.edad}
      Dirección: ${mascota.direccion}
      Celular 1: ${mascota.celular1}
      Celular 2: ${mascota.celular2}
      Vacunas: ${mascota.vacunas}
    `;

    try {
      await new Promise((resolve, reject) => {
        if (window.QRCode && typeof window.QRCode.toCanvas === "function") {
          QRCode.toCanvas(canvas, qrText, { width: 300, margin: 1 }, (err) => {
            if (err) reject(err);
            else resolve();
          });
        } else reject();
      });
    } catch {
      const img = new Image();
      img.src = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrText)}&size=300x300`;
      await new Promise((resolve) => {
        img.onload = () => {
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, 300, 300);
          resolve();
        };
      });
    }

    // 🟣 Botón descargar PDF
    const btnDownload = document.createElement("button");
    btnDownload.className = "btn";
    btnDownload.textContent = "Descargar PDF";
    btnDownload.style.marginTop = "10px";
    qrContainer.appendChild(btnDownload);

    btnDownload.addEventListener("click", () => {
      if (window.jspdf && window.jspdf.jsPDF) {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ unit: "cm", format: "a4" });
        const imgData = canvas.toDataURL("image/png");

        const qrSize = 3; // cm
        const x = (21 - qrSize) / 2;
        const y = (29.7 - qrSize) / 2 - 1;

        pdf.addImage(imgData, "PNG", x, y, qrSize, qrSize);
        pdf.setFontSize(12);
        pdf.text(mascota.nombre, 10.5, y + qrSize + 1, { align: "center" });
        pdf.save(`QR_${mascota.nombre || "mascota"}.pdf`);
      } else {
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = "qr_mascota.png";
        link.click();
      }
    });
  });
});
