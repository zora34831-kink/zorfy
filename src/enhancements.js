
import './styles/enhancements.css';

const API = 'https://api.audius.co/v1';
const APP = 'ZORFY';

const audio = new Audio();
audio.preload = 'metadata';

let queue = [];
let queueIndex = -1;
let current = null;
let shuffleOn = false;
let repeatOn = false;
let searchDelay;

const cache = new Map();

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

function toast(message) {
  let node = $('#zorfyToast');

  if (!node) {
    node = document.createElement('div');
    node.id = 'zorfyToast';
    node.className = 'toast-message';
    document.body.append(node);
  }

  node.textContent = message;
  node.classList.add('show');

  clearTimeout(node._timer);
  node._timer = setTimeout(
    () => node.classList.remove('show'),
    2300
  );
}

function cleanTrack(t) {
  return {
    id: String(t.id),
    title: t.title || 'Untitled',
    artist: t.user?.name || 'Unknown artist',
    cover: t.artwork?.['480x480'] || t.artwork?.['150x150'] || '',
    duration: Number(t.duration) || 0,
    stream: `${API}/tracks/${encodeURIComponent(t.id)}/stream?app_name=${APP}`,
    permalink: t.permalink
      ? `https://audius.co${t.permalink}`
      : 'https://audius.co'
  };
}

async function searchCatalog(query, limit = 20) {
  const params = new URLSearchParams({
    query,
    limit: String(limit),
    app_name: APP
  });

  const response = await fetch(`${API}/tracks/search?${params}`);

  if (!response.ok) {
    throw new Error('Catalog request failed');
  }

  const json = await response.json();
  const tracks = (json.data || []).map(cleanTrack);

  tracks.forEach(track => cache.set(track.id, track));

  return tracks;
}

function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function rowHTML(track) {
  return `
    <button class="song-item" data-song="${escapeHTML(track.id)}">
      <img src="${escapeHTML(track.cover)}" alt="">
      <span class="song-details">
        <strong>${escapeHTML(track.title)}</strong>
        <span>${escapeHTML(track.artist)}</span>
      </span>
      <span class="song-arrow">•••</span>
    </button>
  `;
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';

  return Math.floor(seconds / 60) + ':' +
    String(Math.floor(seconds % 60)).padStart(2, '0');
}

function getFavorites() {
  try {
    return JSON.parse(
      localStorage.getItem('zorfy_favorites') || '[]'
    );
  } catch {
    return [];
  }
}

function saveFavorite(track) {
  const old = getFavorites();
  const exists = old.some(item => String(item.id) === track.id);

  const updated = exists
    ? old.filter(item => String(item.id) !== track.id)
    : [...old, track];

  localStorage.setItem('zorfy_favorites', JSON.stringify(updated));

  return !exists;
}

function setQueue(list, track) {
  queue = list.slice();
  queueIndex = queue.findIndex(
    item => String(item.id) === String(track.id)
  );

  if (queueIndex < 0) {
    queue.unshift(track);
    queueIndex = 0;
  }
}

async function playTrack(track, list) {
  if (!track) return;

  current = track;

  if (list) {
    setQueue(list, track);
  } else if (!queue.some(item => item.id === track.id)) {
    setQueue([track], track);
  }

  const mini = $('#miniPlayer');
  if (mini) mini.classList.add('has-track');

  $('#miniCover').src = track.cover || '';
  $('#miniTitle').textContent = track.title;
  $('#miniArtist').textContent = track.artist;

  renderPlayer();

  audio.src = track.stream;
  audio.load();

  try {
    await audio.play();
  } catch {
    toast('Track belum bisa diputar. Coba lagu lain.');
  }
}

function renderPlayer() {
  const modal = $('#playerModal');
  if (!modal || !current) return;

  const liked = getFavorites().some(
    item => String(item.id) === current.id
  );

  modal.innerHTML = `
    <div class="player-content">
      <div class="player-topline">
        <button class="close-player" id="closePlayer">↓</button>
        <span>NOW PLAYING</span>
        <button class="favorite-button ${liked ? 'selected' : ''}"
          id="favoriteButton">${liked ? '♥' : '♡'}</button>
      </div>

      <div class="album-frame">
        <img class="large-cover" src="${escapeHTML(current.cover)}" alt="">
      </div>

      <div class="player-track-info">
        <span class="overline">PLAYING FROM AUDIUS</span>
        <h2>${escapeHTML(current.title)}</h2>
        <p>${escapeHTML(current.artist)}</p>
      </div>

      <input type="range" id="seekBar" min="0" max="100" value="0">

      <div class="player-times">
        <span id="currentTime">0:00</span>
        <span id="totalTime">${formatTime(current.duration)}</span>
      </div>

      <div class="player-controls">
        <button id="shuffleButton">⇄</button>
        <button id="previousButton">|◀</button>
        <button id="mainPlay">▶</button>
        <button id="nextButton">▶|</button>
        <button id="repeatButton">↻</button>
      </div>

      <a class="audius-link" href="${escapeHTML(current.permalink)}"
        target="_blank" rel="noopener">BUKA TRACK DI AUDIUS ↗</a>
    </div>
  `;

  modal.classList.add('visible');
  updatePlayButtons();
}

function updatePlayButtons() {
  const playing = !audio.paused;

  if ($('#miniPlay')) {
    $('#miniPlay').textContent = playing ? 'Ⅱ' : '▶';
  }

  if ($('#mainPlay')) {
    $('#mainPlay').textContent = playing ? 'Ⅱ' : '▶';
  }
}

function toggleAudio() {
  if (!current) {
    toast('Pilih lagu dulu.');
    return;
  }

  if (audio.paused) {
    audio.play().catch(() => toast('Audio gagal diputar.'));
  } else {
    audio.pause();
  }
}

async function playFromRow(button) {
  const id = String(button.dataset.song);
  let track = cache.get(id);

  const rows = $$('.song-item', button.parentElement);
  let list = rows.map(row => cache.get(String(row.dataset.song)))
    .filter(Boolean);

  if (!track) {
    const title = $('strong', button)?.textContent || '';
    const artist = $('.song-details span', button)?.textContent || '';

    try {
      const found = await searchCatalog(`${title} ${artist}`, 10);

      track = found.find(item =>
        item.title.toLowerCase() === title.toLowerCase()
      ) || found[0];

      if (!track) throw new Error('Not found');

      // Ambil lagu lain yang tampil agar Next/Previous punya antrean.
      const others = await Promise.all(
        rows.filter(row => row !== button).map(async row => {
          const t = cache.get(String(row.dataset.song));
          if (t) return t;

          const name = $('strong', row)?.textContent || '';
          const by = $('.song-details span', row)?.textContent || '';

          try {
            const results = await searchCatalog(`${name} ${by}`, 5);
            return results.find(x =>
              x.title.toLowerCase() === name.toLowerCase()
            ) || results[0];
          } catch {
            return null;
          }
        })
      );

      list = [track, ...others.filter(Boolean)];
    } catch {
      toast('Track tidak ditemukan di katalog.');
      return;
    }
  }

  await playTrack(track, list.length ? list : [track]);
}

function nextTrack() {
  if (!queue.length) return;

  if (shuffleOn && queue.length > 1) {
    let next = queueIndex;

    while (next === queueIndex) {
      next = Math.floor(Math.random() * queue.length);
    }

    queueIndex = next;
  } else {
    queueIndex = (queueIndex + 1) % queue.length;
  }

  playTrack(queue[queueIndex], queue);
}

function previousTrack() {
  if (!queue.length) return;

  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }

  queueIndex = (queueIndex - 1 + queue.length) % queue.length;
  playTrack(queue[queueIndex], queue);
}

async function categorySearch(category) {
  const box = $('#searchResults');
  const meta = $('#searchMeta');

  if (!box) return;

  const terms = category === 'indonesia'
    ? ['indonesia pop', 'indonesian indie', 'musik indonesia']
    : ['global pop', 'hip hop', 'r&b electronic'];

  box.innerHTML =
    '<div class="loading-line">Memuat katalog musik...</div>';

  if (meta) {
    meta.textContent = category.toUpperCase() + ' MUSIC';
  }

  try {
    const groups = await Promise.all(
      terms.map(term => searchCatalog(term, 12).catch(() => []))
    );

    const unique = new Map();

    groups.flat().forEach(track => unique.set(track.id, track));

    const tracks = [...unique.values()];

    box.innerHTML = tracks.length
      ? tracks.map(rowHTML).join('')
      : '<div class="empty-state">Belum ada hasil kategori ini.</div>';
  } catch {
    box.innerHTML =
      '<div class="empty-state">Katalog gagal dimuat. Periksa koneksi.</div>';
  }
}

async function textSearch(query) {
  const box = $('#searchResults');
  const meta = $('#searchMeta');

  if (!box || !meta) return;

  if (!query.trim()) {
    box.innerHTML =
      '<div class="empty-state">Ketik judul lagu atau artis.</div>';
    meta.textContent = 'MULAI DENGAN PENCARIAN';
    return;
  }

  box.innerHTML =
    '<div class="loading-line">Mencari musik...</div>';

  meta.textContent = 'SEARCHING';

  try {
    const tracks = await searchCatalog(query, 25);

    if (!$('#searchInput')) return;

    box.innerHTML = tracks.length
      ? tracks.map(rowHTML).join('')
      : '<div class="empty-state">Tidak ada hasil.</div>';

    meta.textContent = tracks.length + ' HASIL DITEMUKAN';
  } catch {
    box.innerHTML =
      '<div class="empty-state">Katalog tidak dapat dimuat.</div>';
    meta.textContent = 'CONNECTION ERROR';
  }
}

function addCategoryControls() {
  const input = $('#searchInput');

  if (!input || $('#zorfyCategories')) return;

  const wrap = document.createElement('div');
  wrap.id = 'zorfyCategories';
  wrap.className = 'category-switch';

  wrap.innerHTML = `
    <button type="button" data-category="indonesia">
      MUSIK INDONESIA
    </button>
    <button type="button" data-category="global">
      GLOBAL MUSIC
    </button>
  `;

  input.closest('.search-wrap').insertAdjacentElement('afterend', wrap);
}

function observePage() {
  const root = $('#pageContent');
  if (!root) return;

  const observer = new MutationObserver(addCategoryControls);

  observer.observe(root, {
    childList: true,
    subtree: true
  });

  addCategoryControls();
}

document.addEventListener('click', async event => {
  const category = event.target.closest('[data-category]');

  if (category) {
    event.preventDefault();
    event.stopImmediatePropagation();

    $$('[data-category]').forEach(button => {
      button.classList.toggle('active', button === category);
    });

    await categorySearch(category.dataset.category);
    return;
  }

  const row = event.target.closest('.song-item[data-song]');

  if (row) {
    event.preventDefault();
    event.stopImmediatePropagation();
    await playFromRow(row);
    return;
  }

  const button = event.target.closest(
    '#miniPlay,#mainPlay,#nextButton,#previousButton,' +
    '#shuffleButton,#repeatButton,#favoriteButton,#closePlayer'
  );

  if (!button) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  if (button.id === 'miniPlay' || button.id === 'mainPlay') {
    toggleAudio();
  }

  if (button.id === 'nextButton') nextTrack();
  if (button.id === 'previousButton') previousTrack();

  if (button.id === 'shuffleButton') {
    shuffleOn = !shuffleOn;
    button.classList.toggle('selected', shuffleOn);
  }

  if (button.id === 'repeatButton') {
    repeatOn = !repeatOn;
    button.classList.toggle('selected', repeatOn);
  }

  if (button.id === 'favoriteButton' && current) {
    const added = saveFavorite(current);

    button.textContent = added ? '♥' : '♡';
    button.classList.toggle('selected', added);

    toast(added ? 'Ditambahkan ke favorit' : 'Dihapus dari favorit');
  }

  if (button.id === 'closePlayer') {
    $('#playerModal')?.classList.remove('visible');
  }
}, true);

document.addEventListener('input', event => {
  if (event.target.id === 'searchInput') {
    event.stopImmediatePropagation();

    clearTimeout(searchDelay);

    searchDelay = setTimeout(
      () => textSearch(event.target.value.trim()),
      350
    );
  }

  if (event.target.id === 'seekBar' && audio.duration) {
    audio.currentTime =
      audio.duration * Number(event.target.value) / 100;
  }
}, true);

audio.addEventListener('timeupdate', () => {
  const seek = $('#seekBar');
  const now = $('#currentTime');

  if (seek && audio.duration) {
    seek.value = audio.currentTime / audio.duration * 100;
  }

  if (now) now.textContent = formatTime(audio.currentTime);
});

audio.addEventListener('loadedmetadata', () => {
  if ($('#totalTime')) {
    $('#totalTime').textContent = formatTime(audio.duration);
  }
});

audio.addEventListener('play', updatePlayButtons);
audio.addEventListener('pause', updatePlayButtons);

audio.addEventListener('ended', () => {
  if (repeatOn) {
    audio.currentTime = 0;
    audio.play().catch(() => toast('Track gagal diulang'));
  } else {
    nextTrack();
  }
});

document.addEventListener('DOMContentLoaded', observePage);

if (document.readyState !== 'loading') {
  observePage();
}
