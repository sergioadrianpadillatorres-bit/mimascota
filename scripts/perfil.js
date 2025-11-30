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

  // Helpers IndexedDB (promesas simples)
function openDb(dbName = "myAppDB", storeName = "images") {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(storeName, { keyPath: "id", autoIncrement: true });
    };
    req.onsuccess = () => resolve({ db: req.result, storeName });
    req.onerror = () => reject(req.error);
  });
}

function idbPut(db, storeName, blob) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const request = store.add({ blob, created: Date.now() });
    request.onsuccess = () => resolve(request.result); // id
    request.onerror = () => reject(request.error);
  });
}

function idbGet(db, storeName, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Comprime imagen usando canvas. Intenta mantener dimensiones razonables y calidad.
function compressImageFile(file, maxWidth = 1600, maxHeight = 1600, targetBytes = 2 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = async () => {
      URL.revokeObjectURL(url);

      // calcular dimensiones manteniendo aspect ratio
      let { width, height } = img;
      const ratio = width / height;
      if (width > maxWidth) {
        width = maxWidth;
        height = Math.round(width / ratio);
      }
      if (height > maxHeight) {
        height = maxHeight;
        width = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      // intentar con diferentes calidades hasta caber en targetBytes
      let quality = 0.92; // start
      let blob = await new Promise(res => canvas.toBlob(res, "image/webp", quality));
      // si no webp soportado por el toBlob, intentar 'image/jpeg'
      if (!blob) blob = await new Promise(res => canvas.toBlob(res, "image/jpeg", quality));

      let attempts = 0;
      while (blob && blob.size > targetBytes && attempts < 8) {
        quality -= 0.12; // reducir calidad
        if (quality < 0.2) quality = 0.2;
        // recalculate blob
        blob = await new Promise(res => canvas.toBlob(res, "image/webp", quality));
        if (!blob) blob = await new Promise(res => canvas.toBlob(res, "image/jpeg", quality));
        attempts++;
      }

      if (!blob) {
        reject(new Error("No se pudo comprimir la imagen."));
        return;
      }

      // Si blob es pequeño lo convertimos a dataURL (para localStorage), si no devolvemos blob para IndexedDB
      if (blob.size <= targetBytes) {
        // convertir a dataURL
        const reader = new FileReader();
        reader.onload = () => resolve({ type: "dataurl", data: reader.result });
        reader.onerror = () => reject(new Error("Error convirtiendo imagen a DataURL"));
        reader.readAsDataURL(blob);
      } else {
        // demasiado grande aun así -> devolver blob para almacenarlo en IndexedDB
        resolve({ type: "blob", data: blob });
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Error cargando la imagen."));
    };
    img.src = url;
  });
}

// Función principal del listener
avatarInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    // Intentamos comprimir a un objetivo seguro para localStorage (2 MB)
    const TARGET_LOCALSTORAGE_BYTES = 2 * 1024 * 1024; // 2MB
    const compressResult = await compressImageFile(file, 1200, 1200, TARGET_LOCALSTORAGE_BYTES);

    // Asegura índice válido
    if (isNaN(idx) || !mascotas[idx]) mascotas[idx] = {};

    if (compressResult.type === "dataurl") {
      // cabe en localStorage
      mascotas[idx].avatar = compressResult.data;
      localStorage.setItem("mascotas", JSON.stringify(mascotas));
      avatarImg.src = compressResult.data;
      alert("✅ Imagen actualizada correctamente.");
    } else if (compressResult.type === "blob") {
      // fallback a IndexedDB: guardamos blob y guardamos el id en mascotas
      const { db, storeName } = await openDb();
      const id = await idbPut(db, storeName, compressResult.data);
      mascotas[idx].avatarIndexedDB = { dbName: "myAppDB", storeName, id };
      // guardamos mascotas en localStorage (la referencia)
      localStorage.setItem("mascotas", JSON.stringify(mascotas));

      // obtener blob y mostrarlo
      const rec = await idbGet(db, storeName, id);
      const blob = rec.blob;
      const objectUrl = URL.createObjectURL(blob);
      avatarImg.src = objectUrl;

      alert("✅ Imagen guardada (usando almacenamiento local avanzado).");
    } else {
      throw new Error("Resultado de compresión inesperado.");
    }
  } catch (err) {
    console.error(err);
    alert("❌ Error guardando el perfil. Intenta con otra foto o intenta subirla a un servidor.");
  }
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
