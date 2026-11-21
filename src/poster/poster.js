
const KEY = 'zorfy_posters';

export function renderPoster() {
  return `
    <section class="poster-studio">
      <div class="page-heading">
        <span>CREATIVE STUDIO</span>
        <h1>Poster Studio.</h1>
        <p>Buat artwork playlist milikmu.</p>
      </div>

      <div class="poster-preview">
        <div class="poster-art" id="posterArt">
          <div class="poster-top">
            <strong>ZORFY.</strong>
            <span>PLAYLIST COLLECTION</span>
          </div>

          <div class="poster-cover">
            <img id="posterCover"
              src="https://placehold.co/600x600/292929/ffffff?text=ZORFY">
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
        <input id="editArtist" value="Wali · Rizky Febian · Raim Laode">

        <label>Cover playlist</label>
        <input id="editCover" type="file" accept="image/*">

        <label>Tema</label>
        <div class="theme-options">
          <button data-theme="dark">Dark</button>
          <button data-theme="silver">Silver</button>
          <button data-theme="glass">Glass</button>
        </div>

        <button class="export-button" id="exportPoster">
          EKSPOR PNG
        </button>

        <button class="save-button" id="savePoster">
          SIMPAN POSTER
        </button>
      </div>

      <section class="saved-section">
        <h2>Poster tersimpan</h2>
        <div id="savedPosters"></div>
      </section>
    </section>
  `;
}

export function initPoster() {
  const title = document.querySelector('#editTitle');
  const artist = document.querySelector('#editArtist');
  const cover = document.querySelector('#editCover');

  title.oninput = () => {
    document.querySelector('#posterTitle').textContent =
      title.value || 'Untitled';
  };

  artist.oninput = () => {
    document.querySelector('#posterArtist').textContent =
      artist.value || 'Unknown Artist';
  };

  cover.onchange = () => {
    const file = cover.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran gambar maksimal 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      document.querySelector('#posterCover').src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  document.querySelectorAll('[data-theme]').forEach(button => {
    button.onclick = () => {
      document.querySelector('#posterArt').dataset.theme =
        button.dataset.theme;
    };
  });

  document.querySelector('#exportPoster').onclick = exportPoster;
  document.querySelector('#savePoster').onclick = savePoster;

  showSavedPosters();
}

async function makeBlob() {
  if (!window.html2canvas) {
    throw new Error('Library ekspor poster belum tersedia.');
  }

  const canvas = await html2canvas(
    document.querySelector('#posterArt'),
    { scale: 2, useCORS: true, backgroundColor: null }
  );

  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

async function exportPoster() {
  try {
    const blob = await makeBlob();
    if (!blob) throw new Error('Gagal membuat PNG.');

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'ZORFY-POSTER.png';
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    alert(error.message);
  }
}

async function savePoster() {
  try {
    const blob = await makeBlob();
    if (!blob) throw new Error('Poster gagal dibuat.');

    const image = await blobToDataURL(blob);
    const posters = JSON.parse(localStorage.getItem(KEY) || '[]');

    posters.unshift({
      id: crypto.randomUUID(),
      title: document.querySelector('#editTitle').value,
      image,
      date: new Date().toISOString()
    });

    const updated = posters.slice(0, 5);

    try {
      localStorage.setItem(KEY, JSON.stringify(updated));
    } catch {
      throw new Error('Penyimpanan penuh. Hapus poster lama.');
    }

    showSavedPosters();
    alert('Poster berhasil disimpan.');
  } catch (error) {
    alert(error.message);
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

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function showSavedPosters() {
  const container = document.querySelector('#savedPosters');
  if (!container) return;

  const posters = JSON.parse(localStorage.getItem(KEY) || '[]');

  container.innerHTML = posters.map(poster => `
    <div class="saved-poster">
      <img src="${poster.image}" alt="">
      <div>
        <strong>${escapeHTML(poster.title)}</strong>
        <button data-delete="${poster.id}">Hapus poster</button>
      </div>
    </div>
  `).join('') || '<p>Belum ada poster tersimpan.</p>';

  container.querySelectorAll('[data-delete]').forEach(button => {
    button.onclick = () => {
      const updated = posters.filter(
        poster => poster.id !== button.dataset.delete
      );

      localStorage.setItem(KEY, JSON.stringify(updated));
      showSavedPosters();
    };
  });
}
