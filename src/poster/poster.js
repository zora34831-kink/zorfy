
const STORAGE_KEY = 'zorfy_saved_posters';

export function renderPoster() {
  return `
    <section class="poster-studio">
      <div class="poster-header">
        <span>CREATIVE STUDIO / ZORFY</span>
        <h1>Poster Studio</h1>
        <p>Buat artwork playlist milikmu.</p>
      </div>

      <div class="poster-preview">
        <div class="poster-art" id="posterArt">
          <div class="poster-top">
            <span>ZORFY.</span>
            <span>PLAYLIST COLLECTION</span>
          </div>

          <div class="poster-cover">
            <img id="posterCover"
              src="https://placehold.co/600x600/292929/ffffff?text=ZORFY"
              alt="Cover playlist">
          </div>

          <div class="poster-bottom">
            <span>YOUR PERSONAL SOUNDTRACK</span>
            <h2 id="posterTitle">My Favorite Songs</h2>
            <p id="posterArtist">Wali · Rizky Febian · Raim Laode</p>
          </div>

          <div class="poster-footer">
            <span>ZORFY ORIGINAL</span>
            <span>VOL. 001</span>
          </div>
        </div>
      </div>

      <div class="poster-controls">
        <label>Nama playlist</label>
        <input id="editTitle" value="My Favorite Songs">

        <label>Nama artis</label>
        <input id="editArtist"
          value="Wali · Rizky Febian · Raim Laode">

        <label>Foto cover</label>
        <input id="editCover" type="file" accept="image/*">

        <label>Tema poster</label>
        <div class="theme-options">
          <button data-theme="dark">Dark</button>
          <button data-theme="silver">Silver</button>
          <button data-theme="glass">Glass</button>
        </div>

        <button class="export-button" id="exportPoster">
          EKSPOR POSTER PNG
        </button>

        <button class="save-button" id="savePoster">
          SIMPAN KE PUSTAKA
        </button>
      </div>

      <div class="saved-section">
        <h2>Poster tersimpan</h2>
        <div id="savedPosters"></div>
      </div>
    </section>
  `;
}

export function initPoster() {
  const title = document.querySelector('#editTitle');
  const artist = document.querySelector('#editArtist');
  const cover = document.querySelector('#editCover');

  if (!title) return;

  title.addEventListener('input', () => {
    document.querySelector('#posterTitle').textContent =
      title.value || 'Untitled Playlist';
  });

  artist.addEventListener('input', () => {
    document.querySelector('#posterArtist').textContent =
      artist.value || 'Unknown Artist';
  });

  cover.addEventListener('change', () => {
    const file = cover.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      document.querySelector('#posterCover').src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  document.querySelectorAll('[data-theme]').forEach(button => {
    button.addEventListener('click', () => {
      const poster = document.querySelector('#posterArt');
      poster.dataset.theme = button.dataset.theme;
    });
  });

  document.querySelector('#exportPoster')
    .addEventListener('click', exportPoster);

  document.querySelector('#savePoster')
    .addEventListener('click', savePoster);

  showSavedPosters();
}

async function createPosterBlob() {
  const poster = document.querySelector('#posterArt');

  const canvas = await html2canvas(poster, {
    scale: 2,
    useCORS: true,
    backgroundColor: null
  });

  return new Promise(resolve => {
    canvas.toBlob(resolve, 'image/png');
  });
}

async function exportPoster() {
  const blob = await createPosterBlob();
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = 'ZORFY-POSTER.png';
  link.click();

  URL.revokeObjectURL(url);
}

async function savePoster() {
  try {
    const blob = await createPosterBlob();
    if (!blob) throw new Error('Gagal membuat poster');

    const data = await blobToDataURL(blob);

    const posters = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '[]'
    );

    posters.unshift({
      id: crypto.randomUUID(),
      title: document.querySelector('#editTitle').value,
      image: data,
      createdAt: new Date().toISOString()
    });

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(posters.slice(0, 10))
    );

    showSavedPosters();
    alert('Poster berhasil disimpan!');
  } catch (error) {
    alert('Penyimpanan gagal: ' + error.message);
  }
}

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function showSavedPosters() {
  const container = document.querySelector('#savedPosters');
  if (!container) return;

  const posters = JSON.parse(
    localStorage.getItem(STORAGE_KEY) || '[]'
  );

  container.innerHTML = posters.map(poster => `
    <div class="saved-poster">
      <img src="${poster.image}" alt="Poster tersimpan">
      <div>
        <strong>${escapeHTML(poster.title)}</strong>
        <button data-delete="${poster.id}">Hapus</button>
      </div>
    </div>
  `).join('') || '<p>Belum ada poster tersimpan.</p>';

  container.querySelectorAll('[data-delete]').forEach(button => {
    button.addEventListener('click', () => {
      const updated = posters.filter(
        p => p.id !== button.dataset.delete
      );

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      showSavedPosters();
    });
  });
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}
