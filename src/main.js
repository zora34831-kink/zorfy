
import './styles/main.css';
import './poster/poster.css';
import { renderPoster, initPoster } from './poster/poster.js';

const API = 'https://api.audius.co/v1';
const APP_NAME = 'ZORFY';

const featuredQueries = [
  { title: 'Nenekku Pahlawanku', artist: 'Wali' },
  { title: 'Hingga Tua Bersama', artist: 'Rizky Febian' },
  { title: 'Sempurna', artist: 'Andra & The Backbone' },
  { title: 'Komang', artist: 'Raim Laode' }
];

const audio = new Audio();
audio.preload = 'metadata';

let songs = [];
let currentTrack = null;
let currentPage = 'home';
let shuffle = false;
let repeat = false;
let searchTimer;

const $ = selector => document.querySelector(selector);
const app = $('#app');

function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#39;'
  })[char]);
}

function artwork(track) {
  return track?.artwork?.['480x480']
    || track?.artwork?.['150x150']
    || track?.user?.profile_picture?.['150x150']
    || '';
}

function normalizeTrack(track) {
  return {
    id: String(track.id),
    title: track.title || 'Unknown Track',
    artist: track.user?.name || track.artist || 'Unknown Artist',
    cover: artwork(track),
    duration: track.duration || 0,
    stream: `${API}/tracks/${track.id}/stream?app_name=${APP_NAME}`,
    permalink: track.permalink
      ? `https://audius.co${track.permalink}`
      : 'https://audius.co'
  };
}

async function api(path) {
  const response = await fetch(`${API}${path}`);
  if (!response.ok) throw new Error(`Audius error ${response.status}`);
  const json = await response.json();
  return json.data;
}

async function searchTracks(query, limit = 15) {
  const params = new URLSearchParams({
    query,
    limit: String(limit),
    app_name: APP_NAME
  });

  const result = await api(`/tracks/search?${params}`);
  return (result || []).map(normalizeTrack);
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${String(sec).padStart(2, '0')}`;
}

function shell(content) {
  return `
    <div class="app-shell">
      <header class="topbar">
        <a class="brand" href="#" id="brandHome">ZORFY<span>.</span></a>
        <span class="top-caption">MUSIC PLAYER</span>
      </header>

      <main id="pageContent">${content}</main>

      <div class="mini-player" id="miniPlayer">
        <img id="miniCover" src="" alt="">
        <div class="mini-info">
          <strong id="miniTitle">Pilih sebuah lagu</strong>
          <span id="miniArtist">ZORFY PLAYER</span>
        </div>
        <button id="miniPlay" aria-label="Putar">▶</button>
      </div>

      <nav class="bottom-nav">
        <button data-page="home" class="active">
          <span class="nav-icon">⌂</span><span>Beranda</span>
        </button>
        <button data-page="search">
          <span class="nav-icon">⌕</span><span>Cari</span>
        </button>
        <button data-page="library">
          <span class="nav-icon">▤</span><span>Pustaka</span>
        </button>
        <button data-page="poster">
          <span class="nav-icon">▧</span><span>Poster</span>
        </button>
      </nav>

      <div id="playerModal" class="player-modal"></div>
    </div>
  `;
}

function songRow(song) {
  return `
    <button class="song-item" data-song="${escapeHTML(song.id)}">
      <img src="${escapeHTML(song.cover)}" alt=""
        onerror="this.style.visibility='hidden'">
      <span class="song-details">
        <strong>${escapeHTML(song.title)}</strong>
        <span>${escapeHTML(song.artist)}</span>
      </span>
      <span class="song-arrow">•••</span>
    </button>
  `;
}

function homePage() {
  return `
    <section class="hero">
      <span class="overline">YOUR SOUND. YOUR SPACE.</span>
      <h1>Every moment<br><span>has a soundtrack.</span></h1>
      <p>Temukan musik yang cocok dengan suasana lu.</p>
    </section>

    <section class="feature-panel">
      <div class="feature-copy">
        <span class="overline">ZORFY DISCOVERY</span>
        <h2>Find your<br>next favorite.</h2>
        <button class="light-button" id="discoverButton">
          Jelajahi musik <span>↗</span>
        </button>
      </div>
      <div class="feature-orb"></div>
      <div class="feature-index">01 / DISCOVER</div>
    </section>

    <section class="section">
      <div class="section-heading">
        <div>
          <span class="overline">PILIHAN AWAL</span>
          <h2>Rekomendasi lagu</h2>
        </div>
        <span class="section-count">04 TRACKS</span>
      </div>
      <div class="song-list" id="featuredSongs">
        <div class="loading-line">Memuat katalog musik...</div>
      </div>
    </section>

    <section class="section">
      <div class="section-heading">
        <div>
          <span class="overline">YOUR COLLECTION</span>
          <h2>Playlist pribadi</h2>
        </div>
      </div>
      <div class="collection-card">
        <div class="collection-art">Z.</div>
        <div>
          <strong>My Favorite Songs</strong>
          <span id="favoriteCount">Belum ada lagu tersimpan</span>
        </div>
      </div>
    </section>
    <p class="source-note">MUSIC CATALOG POWERED BY AUDIUS</p>
  `;
}

function searchPage() {
  return `
    <section class="page-heading">
      <span class="overline">DISCOVER SOMETHING NEW</span>
      <h1>Search<span>.</span></h1>
      <p>Cari lagu dan artis dari katalog Audius.</p>
    </section>

    <div class="search-wrap">
      <span>⌕</span>
      <input id="searchInput" placeholder="Judul lagu atau nama artis..."
        autocomplete="off">
    </div>
    <div class="search-meta" id="searchMeta">MULAI DENGAN PENCARIAN</div>
    <div class="song-list" id="searchResults">
      <div class="empty-state">Musik yang lu cari dimulai dari sini.</div>
    </div>
  `;
}

function libraryPage() {
  const favorites = getFavorites();

  return `
    <section class="page-heading">
      <span class="overline">YOUR COLLECTION</span>
      <h1>Library<span>.</span></h1>
      <p>Musik pilihan yang lu simpan.</p>
    </section>
    <div class="collection-card">
      <div class="collection-art">Z.</div>
      <div>
        <strong>My Favorite Songs</strong>
        <span>${favorites.length} lagu tersimpan</span>
      </div>
    </div>
    <section class="section">
      <div class="section-heading"><h2>Lagu favorit</h2></div>
      <div class="song-list" id="favoriteSongs">
        ${favorites.length
          ? favorites.map(songRow).join('')
          : '<div class="empty-state">Belum ada lagu favorit. Cari lagu lalu simpan.</div>'}
      </div>
    </section>
    <section class="section">
      <div class="section-heading"><h2>Poster tersimpan</h2></div>
      <div id="libraryPosters"></div>
    </section>
  `;
}

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem('zorfy_favorites') || '[]');
  } catch {
    return [];
  }
}

function saveFavorite(song) {
  const favorites = getFavorites();
  const exists = favorites.some(item => item.id === song.id);

  const updated = exists
    ? favorites.filter(item => item.id !== song.id)
    : [...favorites, song];

  localStorage.setItem('zorfy_favorites', JSON.stringify(updated));
  return !exists;
}

function navigate(page) {
  currentPage = page;

  document.querySelectorAll('[data-page]').forEach(button => {
    button.classList.toggle('active', button.dataset.page === page);
  });

  const content = $('#pageContent');

  if (page === 'home') content.innerHTML = homePage();
  if (page === 'search') content.innerHTML = searchPage();
  if (page === 'library') content.innerHTML = libraryPage();

  if (page === 'poster') {
    content.innerHTML = renderPoster();
    initPoster();
  }

  bindPageEvents();

  if (page === 'home') loadFeatured();
}

async function loadFeatured() {
  const container = $('#featuredSongs');
  if (!container) return;

  const results = await Promise.allSettled(
    featuredQueries.map(item =>
      searchTracks(`${item.title} ${item.artist}`, 8)
    )
  );

  const found = [];

  results.forEach((result, index) => {
    if (result.status !== 'fulfilled') return;

    const expected = featuredQueries[index];
    const match = result.value.find(track =>
      track.title.toLowerCase().includes(expected.title.toLowerCase())
    );

    if (match) found.push(match);
  });

  songs = found;

  if (!container.isConnected) return;

  container.innerHTML = found.length
    ? found.map(songRow).join('')
    : `<div class="empty-state">
        Lagu rekomendasi belum ditemukan di katalog Audius.
        Coba cari judulnya secara manual di menu Cari.
      </div>`;

  bindSongButtons();
}

async function runSearch(query) {
  const results = $('#searchResults');
  const meta = $('#searchMeta');
  if (!results || !meta) return;

  if (!query.trim()) {
    results.innerHTML = '<div class="empty-state">Ketik judul lagu atau artis.</div>';
    meta.textContent = 'MULAI DENGAN PENCARIAN';
    return;
  }

  results.innerHTML = '<div class="loading-line">Mencari musik...</div>';
  meta.textContent = 'SEARCHING';

  try {
    const tracks = await searchTracks(query, 20);

    if (!results.isConnected) return;

    results.innerHTML = tracks.length
      ? tracks.map(songRow).join('')
      : '<div class="empty-state">Tidak ada hasil. Coba kata kunci lain.</div>';

    meta.textContent = `${tracks.length} HASIL DITEMUKAN`;
    bindSongButtons();
  } catch (error) {
    results.innerHTML = `
      <div class="empty-state">
        Katalog tidak dapat dimuat. Periksa koneksi internet lalu coba lagi.
      </div>`;
    meta.textContent = 'CONNECTION ERROR';
  }
}

function bindSongButtons() {
  document.querySelectorAll('[data-song]').forEach(button => {
    button.onclick = () => {
      const id = button.dataset.song;
      const song = [
        ...songs,
        ...getFavorites()
      ].find(item => item.id === id);

      if (song) playSong(song);
      else if (currentPage === 'search') {
        const title = button.querySelector('strong')?.textContent;
        const artist = button.querySelector('.song-details span')?.textContent;
        if (title) resolveAndPlay(title, artist);
      }
    };
  });
}

async function resolveAndPlay(title, artist) {
  try {
    const tracks = await searchTracks(`${title} ${artist || ''}`, 10);
    const match = tracks.find(track =>
      track.title.toLowerCase() === title.toLowerCase()
    ) || tracks[0];

    if (match) playSong(match);
  } catch {
    alert('Lagu tidak dapat dimuat. Coba lagi.');
  }
}

async function playSong(song) {
  currentTrack = song;

  $('#miniCover').src = song.cover || '';
  $('#miniTitle').textContent = song.title;
  $('#miniArtist').textContent = song.artist;

  openPlayer();
  updatePlayerUI();

  audio.src = song.stream;
  audio.load();

  try {
    await audio.play();
  } catch {
    updatePlayerUI();
    alert('Track tidak dapat diputar. Bisa jadi track tidak tersedia atau akses streaming ditolak.');
  }
}

function openPlayer() {
  if (!currentTrack) return;

  const song = currentTrack;
  const modal = $('#playerModal');

  modal.innerHTML = `
    <div class="player-content">
      <div class="player-topline">
        <button class="close-player" id="closePlayer">↓</button>
        <span>NOW PLAYING</span>
        <button class="favorite-button" id="favoriteButton">♡</button>
      </div>

      <div class="album-frame">
        <img class="large-cover" src="${escapeHTML(song.cover)}" alt="">
      </div>

      <div class="player-track-info">
        <span class="overline">PLAYING FROM AUDIUS</span>
        <h2>${escapeHTML(song.title)}</h2>
        <p>${escapeHTML(song.artist)}</p>
      </div>

      <input type="range" id="seekBar" min="0" max="100" value="0">

      <div class="player-times">
        <span id="currentTime">0:00</span>
        <span id="totalTime">${formatTime(song.duration)}</span>
      </div>

      <div class="player-controls">
        <button id="shuffleButton" aria-label="Acak">⇄</button>
        <button id="previousButton" aria-label="Sebelumnya">|◀</button>
        <button id="mainPlay" aria-label="Putar">▶</button>
        <button id="nextButton" aria-label="Berikutnya">▶|</button>
        <button id="repeatButton" aria-label="Ulang">↻</button>
      </div>

      <a class="audius-link" href="${escapeHTML(song.permalink)}"
        target="_blank" rel="noopener">BUKA TRACK DI AUDIUS ↗</a>
    </div>
  `;

  modal.classList.add('visible');
  bindPlayerEvents();
}

function updatePlayerUI() {
  const playing = !audio.paused;
  const mini = $('#miniPlay');
  const main = $('#mainPlay');

  if (mini) mini.textContent = playing ? 'Ⅱ' : '▶';
  if (main) main.textContent = playing ? 'Ⅱ' : '▶';
}

function bindPlayerEvents() {
  $('#closePlayer').onclick = () => {
    $('#playerModal').classList.remove('visible');
  };

  $('#mainPlay').onclick = togglePlay;
  $('#previousButton').onclick = previousSong;
  $('#nextButton').onclick = nextSong;

  $('#shuffleButton').onclick = event => {
    shuffle = !shuffle;
    event.currentTarget.classList.toggle('selected', shuffle);
  };

  $('#repeatButton').onclick = event => {
    repeat = !repeat;
    event.currentTarget.classList.toggle('selected', repeat);
  };

  $('#favoriteButton').onclick = event => {
    const added = saveFavorite(currentTrack);
    event.currentTarget.textContent = added ? '♥' : '♡';
    event.currentTarget.classList.toggle('selected', added);
  };

  $('#seekBar').oninput = event => {
    if (audio.duration) {
      audio.currentTime = audio.duration * Number(event.target.value) / 100;
    }
  };
}

function togglePlay() {
  if (!audio.src) return;

  if (audio.paused) {
    audio.play().catch(() => alert('Audio tidak dapat diputar.'));
  } else {
    audio.pause();
  }

  updatePlayerUI();
}

function nextSong() {
  const list = currentPage === 'search' ? songs : songs;

  if (!list.length) return;

  const index = shuffle
    ? Math.floor(Math.random() * list.length)
    : (list.findIndex(song => song.id === currentTrack?.id) + 1) % list.length;

  playSong(list[index]);
}

function previousSong() {
  if (!songs.length) return;

  const current = songs.findIndex(song => song.id === currentTrack?.id);
  const index = (current - 1 + songs.length) % songs.length;
  playSong(songs[index]);
}

function bindPageEvents() {
  bindSongButtons();

  const search = $('#searchInput');

  if (search) {
    search.addEventListener('input', () => {
      clearTimeout(searchTimer);
      const query = search.value.trim();
      searchTimer = setTimeout(() => runSearch(query), 450);
    });
  }

  const discover = $('#discoverButton');
  if (discover) discover.onclick = () => navigate('search');
}

app.innerHTML = shell(homePage());

document.querySelectorAll('[data-page]').forEach(button => {
  button.addEventListener('click', () => navigate(button.dataset.page));
});

$('#miniPlay').addEventListener('click', togglePlay);
$('#brandHome').addEventListener('click', event => {
  event.preventDefault();
  navigate('home');
});

audio.addEventListener('timeupdate', () => {
  const seek = $('#seekBar');

  if (seek && audio.duration) {
    seek.value = audio.currentTime / audio.duration * 100;
    $('#currentTime').textContent = formatTime(audio.currentTime);
  }
});

audio.addEventListener('loadedmetadata', () => {
  const total = $('#totalTime');
  if (total) total.textContent = formatTime(audio.duration);
});

audio.addEventListener('play', updatePlayerUI);
audio.addEventListener('pause', updatePlayerUI);

audio.addEventListener('ended', () => {
  if (repeat) {
    audio.currentTime = 0;
    audio.play();
  } else {
    nextSong();
  }
});

bindPageEvents();
loadFeatured();
