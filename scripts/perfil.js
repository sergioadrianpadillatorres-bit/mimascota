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

  // ---------------- IndexedDB helpers (promesas simples) ----------------
  function openDb(dbName = "myAppDB", storeName = "images") {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(dbName, 1);
      req.onupgradeneeded = () => {
        try { req.result.createObjectStore(storeName, { keyPath: "id", autoIncrement: true }); } catch(e){}
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

  // Recupera avatar desde IndexedDB si la referencia existe
  async function fetchAvatarFromIndexedDB(ref) {
    // ref esperado: { dbName, storeName, id } (tal como lo guardaste)
    if (!ref || !ref.dbName || !ref.storeName || !ref.id) return null;
    try {
      const { dbName, storeName, id } = ref;
      const { db } = await openDb(dbName, storeName);
      const rec = await idbGet(db, storeName, id);
      if (rec && rec.blob) {
        const objectUrl = URL.createObjectURL(rec.blob);
        return objectUrl;
      }
      return null;
    } catch (err) {
      console.warn("No se pudo obtener imagen de IndexedDB:", err);
      return null;
    }
  }

  // ----------------- Cargar datos existentes -----------------
  (async () => {
    if (!isNaN(idx) && mascotas[idx]) {
      const m = mascotas[idx];

      // Prioridad: avatar (dataURL) -> avatarIndexedDB -> DEFAULT_AVATAR
      if (m.avatar) {
        avatarImg.src = m.avatar;
      } else if (m.avatarIndexedDB) {
        const objUrl = await fetchAvatarFromIndexedDB(m.avatarIndexedDB);
        if (objUrl) {
          avatarImg.src = objUrl;
        } else {
          avatarImg.src = DEFAULT_AVATAR;
        }
      } else {
        avatarImg.src = DEFAULT_AVATAR;
      }

      nombreInput.value = m.nombre || "";
      edadInput.value = m.edad || "";
      direccionInput.value = m.direccion || "";
      celular1Input.value = m.celular1 || "";
      celular2Input.value = m.celular2 || "";
      vacunasInput.value = m.vacunas || "";
    } else {
      avatarImg.src = DEFAULT_AVATAR;
    }
  })();

  // ----------------- Compresión de imagen (igual que antes) -----------------
  function compressImageFile(file, maxWidth = 1600, maxHeight = 1600, targetBytes = 2 * 1024 * 1024) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = async () => {
        URL.revokeObjectURL(url);

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

        let quality = 0.92;
        let blob = await new Promise(res => canvas.toBlob(res, "image/webp", quality));
        if (!blob) blob = await new Promise(res => canvas.toBlob(res, "image/jpeg", quality));

        let attempts = 0;
        while (blob && blob.size > targetBytes && attempts < 8) {
          quality -= 0.12;
          if (quality < 0.2) quality = 0.2;
          blob = await new Promise(res => canvas.toBlob(res, "image/webp", quality));
          if (!blob) blob = await new Promise(res => canvas.toBlob(res, "image/jpeg", quality));
          attempts++;
        }

        if (!blob) {
          reject(new Error("No se pudo comprimir la imagen."));
          return;
        }

        if (blob.size <= targetBytes) {
          const reader = new FileReader();
          reader.onload = () => resolve({ type: "dataurl", data: reader.result });
          reader.onerror = () => reject(new Error("Error convirtiendo imagen a DataURL"));
          reader.readAsDataURL(blob);
        } else {
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

  // ----------------- Manejo del input avatar -----------------
  avatarInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const TARGET_LOCALSTORAGE_BYTES = 2 * 1024 * 1024; // 2MB
      const compressResult = await compressImageFile(file, 1200, 1200, TARGET_LOCALSTORAGE_BYTES);

      if (isNaN(idx) || !mascotas[idx]) mascotas[idx] = {};

      if (compressResult.type === "dataurl") {
        mascotas[idx].avatar = compressResult.data;
        // limpiar posible referencia a IndexedDB si existía
        delete mascotas[idx].avatarIndexedDB;
        localStorage.setItem("mascotas", JSON.stringify(mascotas));
        avatarImg.src = compressResult.data;
        alert("✅ Imagen actualizada correctamente.");
      } else if (compressResult.type === "blob") {
        const { db, storeName } = await openDb(); // usa db por defecto "myAppDB"
        const id = await idbPut(db, storeName, compressResult.data);
        mascotas[idx].avatarIndexedDB = { dbName: "myAppDB", storeName, id };
        // eliminamos avatar en base64 si existe
        delete mascotas[idx].avatar;
        localStorage.setItem("mascotas", JSON.stringify(mascotas));

        // mostrar preview usando objectURL
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

  // ----------------- Guardar / Modificar perfil -----------------
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
      avatar: mascotas[idx]?.avatar || undefined,
      avatarIndexedDB: mascotas[idx]?.avatarIndexedDB || undefined
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

  // ----------------- Eliminar perfil -----------------
  btnEliminar.addEventListener("click", () => {
    if (confirm("¿Seguro que deseas eliminar este perfil?")) {
      mascotas.splice(idx, 1);
      localStorage.setItem("mascotas", JSON.stringify(mascotas));
      alert("Perfil eliminado correctamente.");
      window.location.href = "index.html";
    }
  });

  // ----------------- Generar QR (solo URL a verperfil.html?pet=idx) -----------------
  btnQR.addEventListener("click", async () => {
    const mascota = mascotas[idx];
    if (!mascota) {
      alert("No hay datos de la mascota para generar el QR.");
      return;
    }

    // Construir URL absoluta hacia verperfil.html?pet=idx (funciona local y en GH Pages)
    const basePath = (() => {
      const path = location.pathname;
      // si path termina en / (carpeta), mantenerla; si no, quitar el último segmento (archivo)
      if (path.endsWith("/")) return location.origin + path;
      return location.origin + path.substring(0, path.lastIndexOf("/") + 1);
    })();
    const targetUrl = `${basePath}verPerfil.html?pet=${idx}`;

    qrContainer.innerHTML = "";
    qrContainer.style.display = "flex";
    qrContainer.style.flexDirection = "column";
    qrContainer.style.alignItems = "center";

    // Canvas más grande para mejor lectura; luego lo escalamos con CSS
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 600;
    canvas.style.width = "220px";  // mostrado en UI
    canvas.style.height = "220px";
    canvas.style.border = "3px solid var(--purple)";
    canvas.style.borderRadius = "8px";
    canvas.style.background = "#fff";
    qrContainer.appendChild(canvas);

    // Generar QR únicamente con la URL (sin datos ni imagen)
    try {
      await new Promise((resolve, reject) => {
        if (window.QRCode && typeof window.QRCode.toCanvas === "function") {
          // opciones: mayor corrección de errores para insertar logo o mejorar lectura
          QRCode.toCanvas(canvas, targetUrl, { width: 300, margin: 2, errorCorrectionLevel: "H" }, (err) => {
            if (err) reject(err);
            else resolve();
          });
        } else {
          // fallback al servicio externo (menor control pero funcional)
          reject();
        }
      });
    } catch {
      // fallback a API externa si no está la lib local
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(targetUrl)}&size=600x600&ecc=H`;
      await new Promise((resolve) => {
        img.onload = () => {
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, 600, 600);
          resolve();
        };
        img.onerror = () => {
          // último recurso: mostrar mensaje
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "#000";
          ctx.fillText("Error generando QR", 10, 50);
          resolve();
        };
      });
    }

    // Botón para descargar el QR (pdf o png)
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
        const qrSize = 4.5; // cm (un poco más grande)
        const x = (21 - qrSize) / 2;
        const y = (29.7 - qrSize) / 2 - 1;
        pdf.addImage(imgData, "PNG", x, y, qrSize, qrSize);
        pdf.setFontSize(12);
        pdf.text(mascota.nombre || "", 10.5, y + qrSize + 1, { align: "center" });
        pdf.save(`QR_${(mascota.nombre || "mascota").replace(/\s+/g, "_")}.pdf`);
      } else {
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `qr_mascota_${(mascota.nombre || "mascota").replace(/\s+/g, "_")}.png`;
        link.click();
      }

// 🟣 Generar QR (REEMPLAZAR solo este bloque)
btnQR.addEventListener("click", async () => {
  const mascota = mascotas[idx];
  if (!mascota) {
    alert("No hay datos de la mascota para generar el QR.");
    return;
  }

  // helper: obtener dataURL de avatar (si avatar es dataURL se usa, si es referencia a IndexedDB, la convertimos)
  async function getAvatarDataURL(m) {
    // ya viene como dataURL guardado en localStorage? (caso ideal)
    if (m.avatar && /^data:/.test(m.avatar)) return m.avatar;

    // si tuvieses avatarIndexedDB -> intentar recuperar blob
    if (m.avatarIndexedDB) {
      try {
        const rec = await idbGet(window.indexedDB.open(m.avatarIndexedDB.dbName).result, m.avatarIndexedDB.storeName, m.avatarIndexedDB.id);
        // en tu implementación previa usabas openDb/idbGet. Reintentaremos con openDb
      } catch (e) {
        // ignore: fallback al DEFAULT_AVATAR
      }
    }

    // fallback: usar DEFAULT_AVATAR como ruta relativa
    return mascota.avatar || DEFAULT_AVATAR;
  }

  // helper: crear thumbnail comprimido desde una dataURL o URL
  async function createThumbnail(dataOrUrl, maxWidth = 300, targetBytes = 100 * 1024) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      // permitir CORS si viene de host público
      img.crossOrigin = "anonymous";
      img.onload = async () => {
        // redimensionar manteniendo aspect ratio
        const ratio = img.width / img.height;
        let w = Math.min(img.width, maxWidth);
        let h = Math.round(w / ratio);

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);

        // intentar distintas calidades hasta targetBytes
        let quality = 0.85;
        let blob = await new Promise(res => canvas.toBlob(res, "image/jpeg", quality));
        let attempts = 0;
        while (blob && blob.size > targetBytes && attempts < 8) {
          quality -= 0.12;
          if (quality < 0.2) quality = 0.2;
          blob = await new Promise(res => canvas.toBlob(res, "image/jpeg", quality));
          attempts++;
        }

        if (!blob) {
          // fallback a dataURL con calidad por defecto
          resolve(canvas.toDataURL("image/jpeg", 0.7));
          return;
        }

        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Error creando thumbnail."));
        reader.readAsDataURL(blob);
      };
      img.onerror = () => {
        // si falló cargar (ej: ruta relativa no disponible), devolvemos DEFAULT_AVATAR (dataURL no garantizada)
        resolve(DEFAULT_AVATAR);
      };
      img.src = dataOrUrl;
    });
  }

  // 1) obtener fuente del avatar
  let avatarSrc = await getAvatarDataURL(mascota);

  // 2) crear thumbnail pequeño (ej. maxWidth 300, target ~100KB)
  const thumbDataUrl = await createThumbnail(avatarSrc, 320, 100 * 1024);

  // 3) crear payload con solo lo necesario (texto + thumbnail)
  const payload = {
    nombre: mascota.nombre || "",
    edad: mascota.edad || "",
    direccion: mascota.direccion || "",
    celular1: mascota.celular1 || "",
    celular2: mascota.celular2 || "",
    vacunas: mascota.vacunas || "",
    thumb: thumbDataUrl // dataURL (small)
  };

  // 4) convertir payload a base64 seguro para URL
  const json = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(json))); // safe for Unicode

  // 5) construir URL pública que apunte a tu verperfil.html en GitHub Pages (AJUSTA tu dominio)
  // IMPORTANTE: reemplaza originPublic por tu dominio de GitHub Pages
  const originPublic = "https://sergioadrianpadillatorres-bit.github.io/mimascota";
  const targetUrl = `${originPublic}/verperfil.html#p=${b64}`;

  // 6) generar QR con esa URL (se escaneará y abrirá verperfil.html en cualquier celular)
  qrContainer.innerHTML = "";
  qrContainer.style.display = "flex";
  qrContainer.style.flexDirection = "column";
  qrContainer.style.alignItems = "center";

  const canvas = document.createElement("canvas");
  canvas.width = 400; // aumentamos tamaño QR para mejor lectura
  canvas.height = 400;
  canvas.style.width = "200px";
  canvas.style.height = "200px";
  canvas.style.border = "3px solid var(--purple)";
  canvas.style.borderRadius = "8px";
  canvas.style.background = "#fff";
  qrContainer.appendChild(canvas);

  try {
    await new Promise((resolve, reject) => {
      if (window.QRCode && typeof window.QRCode.toCanvas === "function") {
        QRCode.toCanvas(canvas, targetUrl, { width: 400, margin: 1 }, (err) => {
          if (err) reject(err);
          else resolve();
        });
      } else reject();
    });
  } catch {
    // fallback servicio externo
    const img = new Image();
    img.src = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(targetUrl)}&size=400x400`;
    await new Promise((res) => {
      img.onload = () => {
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, 400, 400);
        res();
      };
    });
  }

  // botón descarga PDF (se conserva comportamiento pero con canvas nuevo)
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

      const qrSize = 4.5; // cm (agregado un poco más grande)
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
  });
});
