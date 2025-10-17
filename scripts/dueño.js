// scripts/dueno.js
document.addEventListener('DOMContentLoaded', () => {
    // Elementos
    const avatarInput = document.getElementById('avatarInput');
    const avatarPreview = document.getElementById('avatarPreview');
  
    const viewMode = document.getElementById('viewMode');
    const editMode = document.getElementById('editMode');
  
    const ownerFullName = document.getElementById('ownerFullName');
    const viewEdad = document.getElementById('viewEdad');
    const viewDireccion = document.getElementById('viewDireccion');
    const viewCorreo = document.getElementById('viewCorreo');
    const viewCelular = document.getElementById('viewCelular');
  
    const btnEditar = document.getElementById('btnEditar');
    const btnRegresar = document.getElementById('btnRegresar');
    const btnGuardar = document.getElementById('btnGuardar');
    const btnCancelar = document.getElementById('btnCancelar');
  
    // inputs del modo edición
    const inputNombre = document.getElementById('nombre');
    const inputApellido = document.getElementById('apellido');
    const inputEdad = document.getElementById('edad');
    const inputDireccion = document.getElementById('direccion');
    const inputCorreo = document.getElementById('correo');
    const inputCelular = document.getElementById('celular');
  
    const LS_KEY = 'datosDueno';
    const LS_AVATAR = 'avatarDueno';
    const DEFAULT_AVATAR = 'imagenes/1000_F_259394679_GGA8JJAEkukYJL9XXFH2JoC3nMguBPNH.jpg';
  
    // helpers: mostrar modos
    function showViewMode(data) {
      viewMode.style.display = 'block';
      editMode.style.display = 'none';
  
      ownerFullName.textContent = `${data.nombre || ''} ${data.apellido || ''}`.trim();
      viewEdad.textContent = data.edad || '-';
      viewDireccion.textContent = data.direccion || '-';
      viewCorreo.textContent = data.correo || '-';
      viewCelular.textContent = data.celular || '-';
  
      btnEditar.style.display = 'inline-block';
      btnRegresar.style.display = 'inline-block';
    }
  
    function showEditMode(data) {
      viewMode.style.display = 'none';
      editMode.style.display = 'block';
  
      inputNombre.value = data?.nombre || '';
      inputApellido.value = data?.apellido || '';
      inputEdad.value = data?.edad || '';
      inputDireccion.value = data?.direccion || '';
      inputCorreo.value = data?.correo || '';
      inputCelular.value = data?.celular || '';
  
      btnEditar.style.display = 'none';
      btnRegresar.style.display = 'none';
    }
  
    // carga inicial
    try {
      const saved = localStorage.getItem(LS_KEY);
      const savedAvatar = localStorage.getItem(LS_AVATAR) || DEFAULT_AVATAR;
      avatarPreview.src = savedAvatar;
  
      if (saved) {
        const datos = JSON.parse(saved);
        showViewMode(datos);
      } else {
        // sin datos -> abrir formulario para registrar
        showEditMode(null);
      }
    } catch (err) {
      // en caso de error de parseo, vamos a edición
      avatarPreview.src = DEFAULT_AVATAR;
      showEditMode(null);
      console.warn('dueno.js: error leyendo localStorage:', err);
    }
  
    // avatar: guardar inmediatamente cuando se seleccione
    if (avatarInput) {
      avatarInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          avatarPreview.src = reader.result;
          try { localStorage.setItem(LS_AVATAR, reader.result); } catch (e) { console.warn('No se pudo guardar avatar en localStorage', e); }
        };
        reader.readAsDataURL(file);
      });
    }
  
    // Editar desde vista -> pasar a edición
    if (btnEditar) {
      btnEditar.addEventListener('click', () => {
        const guardado = localStorage.getItem(LS_KEY);
        const datos = guardado ? JSON.parse(guardado) : null;
        showEditMode(datos);
      });
    }
  
    // Regresar (volver al index)
    if (btnRegresar) {
      btnRegresar.addEventListener('click', () => {
        window.location.href = 'index.html';
      });
    }
  
    // Cancelar edición: si hay datos guardados, volver a vista; si no, regresar al index
    if (btnCancelar) {
      btnCancelar.addEventListener('click', () => {
        const guardado = localStorage.getItem(LS_KEY);
        if (guardado) {
          showViewMode(JSON.parse(guardado));
        } else {
          window.location.href = 'index.html';
        }
      });
    }
  
    // Guardar datos (form submit)
    const editForm = document.getElementById('editMode');
    if (editForm) {
      editForm.addEventListener('submit', (ev) => {
        ev.preventDefault();
  
        const datos = {
          nombre: inputNombre.value.trim(),
          apellido: inputApellido.value.trim(),
          edad: inputEdad.value.trim(),
          direccion: inputDireccion.value.trim(),
          correo: inputCorreo.value.trim(),
          celular: inputCelular.value.trim()
        };
  
        try {
          localStorage.setItem(LS_KEY, JSON.stringify(datos));
        } catch (e) {
          console.warn('dueno.js: fallo guardando datos en localStorage', e);
        }
  
        alert('✅ Datos guardados correctamente.');
        // Redirigir al index para que actualice la vista principal
        window.location.href = 'index.html';
      });
    }
  });
  