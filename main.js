const API_BASE_URL = 'https://anime-api-v1-1-0.onrender.com/api';
const animeContainer = document.getElementById('animeContainer');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const alertBox = document.getElementById('alertBox');
const searchInput = document.getElementById('searchInput');
const totalCount = document.getElementById('totalCount');
const modalBackdrop = document.getElementById('modalBackdrop');
const animeModal = document.getElementById('animeModal');
const detailsModal = document.getElementById('detailsModal');
const modalTitle = document.getElementById('modalTitle');
const animeForm = document.getElementById('animeForm');
const fileNote = document.getElementById('fileNote');
const formTitle = document.getElementById('title');
const formEpisodes = document.getElementById('episodios');
const formStartDate = document.getElementById('fecha_ini');
const formEndDate = document.getElementById('fecha_fin');
const formImageUrl = document.getElementById('image_url');
const formImageFile = document.getElementById('imageFile');
const detailsTitle = document.getElementById('detailsTitle');
const detailsContent = document.getElementById('detailsContent');
const detailsActions = document.getElementById('detailsActions');

let animes = [];
let editingId = null;
let currentDetailId = null;

window.addEventListener('DOMContentLoaded', () => {
  loadAnimes();
  setEventListeners();
});

function setEventListeners() {
  document.getElementById('openAddBtn').addEventListener('click', openAddModal);
  document.getElementById('clearSearchBtn').addEventListener('click', clearSearch);
  document.getElementById('refreshBtn').addEventListener('click', loadAnimes);
  searchInput.addEventListener('input', filterAnimes);
  animeForm.addEventListener('submit', handleFormSubmit);
  formImageUrl.addEventListener('input', () => {
    if (formImageUrl.value) {
      formImageFile.value = '';
      fileNote.textContent = 'Se usará la URL de la imagen al guardar.';
    }
  });
  formImageFile.addEventListener('change', () => {
    const file = formImageFile.files[0];
    fileNote.textContent = file ? `Archivo seleccionado: ${file.name}` : 'Arrastra o selecciona una imagen para cargar.';
    if (file) {
      formImageUrl.value = '';
    }
  });
  document.querySelectorAll('.close-modal').forEach(button => {
    button.addEventListener('click', closeModals);
  });
  modalBackdrop.addEventListener('click', closeModals);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeModals();
  });
}

async function loadAnimes() {
  showLoading(true);
  setEmpty(false);
  try {
    const response = await fetch(`${API_BASE_URL}/animes`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error al obtener animes');
    animes = data.animes || [];
    renderAnimes(animes);
  } catch (error) {
    showAlert(error.message, 'error');
    renderAnimes([]);
    console.error(error);
  } finally {
    showLoading(false);
  }
}

function renderAnimes(list) {
  animeContainer.innerHTML = '';
  totalCount.textContent = list.length;

  if (list.length === 0) {
    setEmpty(true);
    return;
  }

  setEmpty(false);
  const fragment = document.createDocumentFragment();

  list.forEach(anime => {
    const card = document.createElement('article');
    card.className = 'card';

    const imageContainer = document.createElement('div');
    imageContainer.className = 'card-image';
    if (anime.image_url) {
      const img = document.createElement('img');
      img.src = anime.image_url;
      img.alt = anime.title;
      imageContainer.appendChild(img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'placeholder';
      placeholder.textContent = '🎬';
      imageContainer.appendChild(placeholder);
    }

    const body = document.createElement('div');
    body.className = 'card-body';
    body.innerHTML = `
      <div>
        <h3 class="card-title">${anime.title}</h3>
        <div class="card-meta">
          ${anime.episodios ? `<span><strong>Episodios:</strong><span>${anime.episodios}</span></span>` : ''}
          ${anime.fecha_ini ? `<span><strong>Inicio:</strong><span>${formatDate(anime.fecha_ini)}</span></span>` : ''}
          ${anime.fecha_fin ? `<span><strong>Fin:</strong><span>${formatDate(anime.fecha_fin)}</span></span>` : ''}
        </div>
      </div>
      <div class="card-actions">
        <button class="btn btn-secondary btn-view" type="button">Ver</button>
        <button class="btn btn-secondary btn-edit" type="button">Editar</button>
        <button class="btn btn-danger btn-delete" type="button">Eliminar</button>
      </div>
    `;

    body.querySelector('.btn-view').addEventListener('click', () => openDetailsModal(anime.id));
    body.querySelector('.btn-edit').addEventListener('click', () => openEditModal(anime.id));
    body.querySelector('.btn-delete').addEventListener('click', () => deleteAnime(anime.id));

    card.appendChild(imageContainer);
    card.appendChild(body);
    fragment.appendChild(card);
  });

  animeContainer.appendChild(fragment);
}

function filterAnimes() {
  const term = searchInput.value.trim().toLowerCase();
  const filtered = animes.filter(item => item.title.toLowerCase().includes(term));
  renderAnimes(filtered);
}

function clearSearch() {
  searchInput.value = '';
  renderAnimes(animes);
}

function setEmpty(state) {
  emptyState.style.display = state ? 'block' : 'none';
  animeContainer.style.display = state ? 'none' : 'grid';
}

function showLoading(show) {
  loadingState.style.display = show ? 'block' : 'none';
  animeContainer.style.opacity = show ? '0.35' : '1';
}

function openAddModal() {
  editingId = null;
  modalTitle.textContent = 'Agregar anime';
  animeForm.reset();
  fileNote.textContent = 'Arrastra o selecciona una imagen para cargar.';
  openModal(animeModal);
}

async function openEditModal(id) {
  const anime = animes.find(item => item.id === id);
  if (!anime) {
    showAlert('Anime no encontrado', 'error');
    return;
  }

  editingId = id;
  modalTitle.textContent = 'Editar anime';
  formTitle.value = anime.title || '';
  formEpisodes.value = anime.episodios || '';
  formStartDate.value = anime.fecha_ini ? anime.fecha_ini.split('T')[0] : '';
  formEndDate.value = anime.fecha_fin ? anime.fecha_fin.split('T')[0] : '';
  formImageUrl.value = anime.image_url || '';
  formImageFile.value = '';
  fileNote.textContent = anime.image_url ? 'URL de imagen cargada actualmente.' : 'Arrastra o selecciona una imagen para cargar.';

  openModal(animeModal);
}

async function openDetailsModal(id) {
  currentDetailId = id;
  openModal(detailsModal);
  detailsTitle.textContent = 'Cargando detalles...';
  detailsContent.innerHTML = '<div class="spinner"></div>';
  detailsActions.innerHTML = '';

  try {
    const response = await fetch(`${API_BASE_URL}/animes/${id}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'No se pudo obtener el anime');

    const anime = data.anime;
    detailsTitle.textContent = anime.title;
    detailsContent.innerHTML = `
      <div class="details-list">
        <div class="details-item"><strong>Episodios</strong><span>${anime.episodios ?? '—'}</span></div>
        <div class="details-item"><strong>Inicio</strong><span>${anime.fecha_ini ? formatDate(anime.fecha_ini) : '—'}</span></div>
        <div class="details-item"><strong>Fin</strong><span>${anime.fecha_fin ? formatDate(anime.fecha_fin) : '—'}</span></div>
        <div class="details-item"><strong>ID</strong><span>${anime.id}</span></div>
        <div class="details-item"><strong>Creado</strong><span>${anime.createdAt ? formatDateTime(anime.createdAt) : '—'}</span></div>
        <div class="details-item"><strong>Última actualización</strong><span>${anime.updatedAt ? formatDateTime(anime.updatedAt) : '—'}</span></div>
      </div>
    `;

    const actionsFragment = document.createDocumentFragment();
    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'btn btn-primary';
    editButton.textContent = 'Editar este anime';
    editButton.addEventListener('click', () => {
      closeModals();
      openEditModal(id);
    });

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'btn btn-secondary';
    closeButton.textContent = 'Cerrar';
    closeButton.addEventListener('click', closeModals);

    actionsFragment.appendChild(editButton);
    actionsFragment.appendChild(closeButton);
    detailsActions.appendChild(actionsFragment);
  } catch (error) {
    detailsTitle.textContent = 'Error';
    detailsContent.innerHTML = `<p>${error.message}</p>`;
    detailsActions.innerHTML = '<button class="btn btn-secondary" type="button" onclick="closeModals()">Cerrar</button>';
  }
}

function openModal(modal) {
  modal.classList.add('active');
  modalBackdrop.classList.add('active');
}

function closeModals() {
  [animeModal, detailsModal].forEach(modal => modal.classList.remove('active'));
  modalBackdrop.classList.remove('active');
  animeForm.reset();
  fileNote.textContent = 'Arrastra o selecciona una imagen para cargar.';
  editingId = null;
  currentDetailId = null;
}

async function handleFormSubmit(event) {
  event.preventDefault();

  const title = formTitle.value.trim();
  const episodios = formEpisodes.value;
  const fecha_ini = formStartDate.value;
  const fecha_fin = formEndDate.value;
  const image_url = formImageUrl.value.trim();
  const imageFile = formImageFile.files[0];

  if (!title) {
    showAlert('El título es obligatorio', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('title', title);
  if (episodios) formData.append('episodios', episodios);
  if (fecha_ini) formData.append('fecha_ini', fecha_ini);
  if (fecha_fin) formData.append('fecha_fin', fecha_fin);
  if (image_url) formData.append('image_url', image_url);
  if (imageFile) formData.append('image', imageFile);

  const method = editingId ? 'PUT' : 'POST';
  const endpoint = editingId ? `${API_BASE_URL}/animes/${editingId}` : `${API_BASE_URL}/animes`;

  try {
    const response = await fetch(endpoint, { method, body: formData });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'No se pudo guardar el anime');
    }

    showAlert(editingId ? 'Anime actualizado correctamente' : 'Anime creado correctamente', 'success');
    closeModals();
    loadAnimes();
  } catch (error) {
    showAlert(error.message, 'error');
    console.error(error);
  }
}

async function deleteAnime(id) {
  const accepted = window.confirm('¿Eliminar este anime definitivamente?');
  if (!accepted) return;

  try {
    const response = await fetch(`${API_BASE_URL}/animes/${id}`, { method: 'DELETE' });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'No se pudo eliminar el anime');
    }

    showAlert('Anime eliminado correctamente', 'success');
    loadAnimes();
  } catch (error) {
    showAlert(error.message, 'error');
    console.error(error);
  }
}

function formatDate(value) {
  return new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(value) {
  return new Date(value).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function showAlert(message, type = 'success') {
  alertBox.textContent = message;
  alertBox.className = `alert ${type} visible`;

  clearTimeout(showAlert.timeout);
  showAlert.timeout = setTimeout(() => {
    alertBox.classList.remove('visible');
  }, 3200);
}
