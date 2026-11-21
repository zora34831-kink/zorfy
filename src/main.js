
import './styles/main.css';
import { MediaSession } from '@jofr/capacitor-media-session';

const API = 'https://api.audius.co/v1';
const APP_NAME = 'ZORFY';
const FAVORITES_KEY = 'zorfy_favorites';
const LYRICS_KEY = 'zorfy_lyrics';

const featuredQueries = [
  'Nenekku Pahlawanku Wali',
  'Hingga Tua Bersama Rizky Febian',
  'Sempurna Andra The Backbone',
  'Komang Raim Laode'
];

const audio = new Audio();
audio.preload = 'metadata';

let songs = [];
let queue = [];
let currentTrack = null;
let currentPage = 'home';
let shuffle = false;
let repeat = false;
let searchTimer;
let currentLyrics = [];
let activeLyricIndex = -1;

const $ = selector => document.querySelector(selector);
const app = $('#app');

function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function icon(name) {
  const paths = {
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    library: '<path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.6-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.5-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.5.9l1.7-.6 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.8Z"/>',
    play: '<path d="m8 5 11 7-11 7z"/>',
    pause: '<path d="M8 5h3v14H8zM15 5h3v14h-3z"/>'
  };

  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || ''}</svg>`;
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
    artist: track.user?.name || 'Unknown Artist',
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

async function searchTracks(query, limit = 20) {
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

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  } catch {
    return [];
  }
}

function toggleFavorite(song) {
  const favorites = getFavorites();
  const exists = favorites.some(item => item.id === song.id);

  const updated = exists
    ? favorites.filter(item => item.id !== song.id)
    : [...favorites, song];

  localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  return !exists;
}

function getLyricsMap() {
  try {
    return JSON.parse(localStorage.getItem(LYRICS_KEY) || '{}');
  } catch {
    return {};
  }
}

function parseLRC(text) {
  const lines = [];

  for (const raw of text.split(/\r?\n/)) {
    const match = raw.match(/^\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\](.*)$/);
    if (!match) continue;

    const minutes = Number(match[1]);
    const seconds = Number(match[2]);
    const fraction = Number(`0.${match[3] || '0'}`);
    lines.push({
      time: minutes * 60 + seconds + fraction,
      text: match[4].trim()
    });
  }

  return lines.sort((a, b) => a.time - b.time);
}

function songRow(song) {
  return `
    <button class="song-item" data-song="${escapeHTML(song.id)}">
      <img src="${escapeHTML(song.cover)}" alt=""
        onerror="this.style.opacity='0'">
      <span class="song-details">
        <strong>${escapeHTML(song.title)}</strong>
        <span>${escapeHTML(song.artist)}</span>
      </span>
      <span class="song-play">${icon('play')}</span>
    </button>
  `;
}

function shell(content) {
  return `
    <div class="app-shell">
      <header class="topbar">
        <a class="brand" href="#" id="brandHome">ZORFY<span>.</span></a>
        <span class="top-caption">MUSIC PLAYER</span>
      </header>

      <main id="pageContent">${content}</main>

      <button class="dynamic-island" id="dynamicIsland" aria-label="Buka pemutar">
        <span class="island-art"><img id="islandCover" alt=""></span>
        <span class="island-info">
          <strong id="islandTitle">ZORFY</strong>
          <small id="islandArtist">Pilih musik untuk mulai</small>
        </span>
        <span class="island-action" id="islandPlay">${icon('play')}</span>
      </button>

      <nav class="bottom-nav">
        <button data-page="home" class="active">
          ${icon('home')}<span>Beranda</span>
        </button>
        <button data-page="search">
          ${icon('search')}<span>Cari</span>
        </button>
        <button data-page="library">
          ${icon('library')}<span>Pustaka</span>
        </button>
        <button data-page="settings">
          ${icon('settings')}<span>Settings</span>
        </button>
      </nav>

      <div id="playerModal" class="player-modal"></div>
      <div id="toast" class="toast"></div>
    </div>
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
      <span class="feature-index">01 / DISCOVER</span>
    </section>

    <section class="section">
      <div class="section-heading">
        <div>
          <span class="overline">PILIHAN AWAL</span>
          <h2>Rekomendasi lagu</h2>
        </div>
        <span class="section-count">AUDIUS</span>
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
      <button class="collection-card" id="openLibrary">
        <span class="collection-art">Z.</span>
        <span class="collection-copy">
          <strong>My Favorite Songs</strong>
          <small id="favoriteCount">Memuat koleksi...</small>
        </span>
        <span class="collection-arrow">↗</span>
      </button>
    </section>
    <p class="source-note">MUSIC CATALOG POWERED BY AUDIUS</p>
  `;
}

function searchPage() {
  return `
    <section class="page-heading">
      <span class="overline">DISCOVER SOMETHING NEW</span>
      <h1>Search<span>.</span></h1>
      <p>Cari musik dari katalog yang tersedia.</p>
    </section>

    <div class="search-wrap">
      ${icon('search')}
      <input id="searchInput" placeholder="Judul lagu atau nama artis..."
        autocomplete="off">
    </div>

    <div class="category-switch">
      <button class="selected" data-category="indonesia">Indonesia</button>
      <button data-category="global">Global</button>
    </div>

    <div class="search-meta" id="searchMeta">PILIH KATEGORI ATAU CARI LAGU</div>
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
      <span class="collection-art">Z.</span>
      <span class="collection-copy">
        <strong>My Favorite Songs</strong>
        <small>${favorites.length} lagu tersimpan</small>
      </span>
    </div>

    <section class="section">
      <div class="section-heading"><h2>Lagu favorit</h2></div>
      <div class="song-list">
        ${favorites.length
          ? favorites.map(songRow).join('')
          : '<div class="empty-state">Belum ada lagu favorit. Cari lagu lalu simpan.</div>'}
      </div>
    </section>
  `;
}

function settingsPage() {
  return `
    <section class="page-heading">
      <span class="overline">PERSONAL PREFERENCES</span>
      <h1>Settings<span>.</span></h1>
      <p>Atur pengalaman mendengarkan musik.</p>
    </section>

    <section class="settings-group">
      <div class="settings-heading">LYRICS</div>
      <div class="settings-card">
        <div>
          <strong>Impor lirik tersinkron</strong>
          <p>Pilih file .LRC untuk lagu yang sedang diputar.</p>
        </div>
        <label class="settings-upload">
          Pilih file LRC
          <input type="file" id="lyricsUpload" accept=".lrc,text/plain">
        </label>
        <small id="lyricsStatus">Belum ada lirik untuk lagu aktif.</small>
      </div>
    </section>

    <section class="settings-group">
      <div class="settings-heading">PLAYBACK</div>
      <div class="settings-card settings-row">
        <div>
          <strong>Kontrol layar kunci</strong>
          <p>Metadata dan kontrol media Android.</p>
        </div>
        <span class="settings-state">MEDIA SESSION</span>
      </div>
      <div class="settings-card settings-row">
        <div>
          <strong>Pemutaran latar</strong>
          <p>Musik tetap berjalan saat aplikasi diminimalkan.</p>
        </div>
        <span class="settings-state">ANDROID</span>
      </div>
    </section>

    <section class="settings-group">
      <div class="settings-heading">ABOUT</div>
      <div class="settings-card settings-row">
        <div>
          <strong>ZORFY Music</strong>
          <p>Version 2.0 · Your Music, Your Moment</p>
        </div>
        <span class="settings-state">ZORFY</span>
      </div>
    </section>
  `;
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
  if (page === 'settings') content.innerHTML = settingsPage();

  bindPageEvents();

  if (page === 'home') loadFeatured();
  if (page === 'settings') updateLyricsStatus();
}

async function loadFeatured() {
  const container = $('#featuredSongs');
  if (!container) return;

  const results = await Promise.allSettled(
    featuredQueries.map(query => searchTracks(query, 8))
  );

  const found = [];

  results.forEach((result, index) => {
    if (result.status !== 'fulfilled') return;

    const expected = featuredQueries[index].split(' ')[0].toLowerCase();
    const match = result.value.find(track =>
      track.title.toLowerCase().includes(expected)
    );

    if (match) found.push(match);
  });

  songs = found;
  queue = found;

  if (!container.isConnected) return;

  container.innerHTML = found.length
    ? found.map(songRow).join('')
    : '<div class="empty-state">Rekomendasi belum tersedia. Coba cari musik.</div>';

  $('#favoriteCount').textContent = `${getFavorites().length} lagu tersimpan`;
  bindSongButtons();
}

async function runSearch(query) {
  const results = $('#searchResults');
  const meta = $('#searchMeta');
  if (!results || !meta) return;

  if (!query.trim()) {
    results.innerHTML = '<div class="empty-state">Ketik judul lagu atau artis.</div>';
    meta.textContent = 'PILIH KATEGORI ATAU CARI LAGU';
    return;
  }

  results.innerHTML = '<div class="loading-line">Mencari musik...</div>';
  meta.textContent = 'SEARCHING';

  try {
    const tracks = await searchTracks(query, 25);
    if (!results.isConnected) return;

    songs = tracks;
    queue = tracks;

    results.innerHTML = tracks.length
      ? tracks.map(songRow).join('')
      : '<div class="empty-state">Tidak ada hasil yang cocok.</div>';

    meta.textContent = `${tracks.length} HASIL DITEMUKAN`;
    bindSongButtons();
  } catch {
    results.innerHTML = '<div class="empty-state">Katalog gagal dimuat. Periksa koneksi internet.</div>';
    meta.textContent = 'CONNECTION ERROR';
  }
}

function bindSongButtons() {
  document.querySelectorAll('[data-song]').forEach(button => {
    button.onclick = () => {
      const id = button.dataset.song;
      const song = [...songs, ...getFavorites()]
        .find(item => item.id === id);

      if (song) playSong(song);
    };
  });
}

function showToast(message) {
  const toast = $('#toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('visible'), 2300);
}

function updateIsland() {
  if (!currentTrack) return;

  $('#islandCover').src = currentTrack.cover || '';
  $('#islandTitle').textContent = currentTrack.title;
  $('#islandArtist').textContent = currentTrack.artist;
  $('#islandPlay').innerHTML = audio.paused ? icon('play') : icon('pause');

  $('#dynamicIsland').classList.add('has-track');
  $('#dynamicIsland').classList.toggle('is-playing', !audio.paused);
}

async function syncMediaSession() {
  if (!currentTrack) return;

  try {
    await MediaSession.setMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: 'ZORFY',
      artwork: currentTrack.cover ? [{
        src: currentTrack.cover,
        sizes: '512x512',
        type: 'image/jpeg'
      }] : []
    });

    await MediaSession.setPlaybackState({
      playbackState: audio.paused ? 'paused' : 'playing'
    });

    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      await MediaSession.setPositionState({
        duration: audio.duration,
        playbackRate: 1,
        position: Math.min(audio.currentTime, audio.duration)
      });
    }
  } catch (error) {
    console.warn('Media Session:', error);
  }
}

function setupMediaSession() {
  const actions = {
    play: () => audio.play().catch(() => {}),
    pause: () => audio.pause(),
    nexttrack: () => nextSong(),
    previoustrack: () => previousSong(),
    seekto: details => {
      if (Number.isFinite(details?.seekTime)) {
        audio.currentTime = details.seekTime;
      }
    }
  };

  Object.entries(actions).forEach(([action, handler]) => {
    MediaSession.setActionHandler({ action }, handler).catch(() => {});
  });
}

async function playSong(song) {
  if (!song?.stream) return;

  currentTrack = song;

  if (!queue.some(item => item.id === song.id)) {
    queue = [song, ...queue];
  }

  audio.src = song.stream;
  audio.load();

  currentLyrics = getLyricsMap()[song.id] || [];
  activeLyricIndex = -1;

  openPlayer();
  updateIsland();

  try {
    await audio.play();
  } catch {
    showToast('Track tidak bisa diputar. Coba lagu lain.');
  }
}

function openPlayer() {
  if (!currentTrack) return;

  const song = currentTrack;
  const modal = $('#playerModal');

  modal.innerHTML = `
    <div class="player-content">
      <div class="player-topline">
        <button class="close-player" id="closePlayer" aria-label="Tutup">↓</button>
        <span>NOW PLAYING</span>
        <button class="favorite-button" id="favoriteButton" aria-label="Favorit">♡</button>
      </div>

      <div class="album-frame">
        <img class="large-cover" src="${escapeHTML(song.cover)}" alt="">
      </div>

      <div class="player-track-info">
        <span class="overline">ZORFY PLAYER</span>
        <h2>${escapeHTML(song.title)}</h2>
        <p>${escapeHTML(song.artist)}</p>
      </div>

      <div class="lyrics-panel" id="lyricsPanel">
        <span class="lyrics-label">LYRICS</span>
        <div id="lyricsLines" class="lyrics-lines">
          <p class="lyrics-empty">Impor file .LRC di Settings untuk melihat lirik sinkron.</p>
        </div>
      </div>

      <input type="range" id="seekBar" min="0" max="100" value="0">
      <div class="player-times">
        <span id="currentTime">0:00</span>
        <span id="totalTime">${formatTime(song.duration)}</span>
      </div>

      <div class="player-controls">
        <button id="shuffleButton" aria-label="Acak">⇄</button>
        <button id="previousButton" aria-label="Sebelumnya">|◀</button>
        <button id="mainPlay" aria-label="Putar">${icon('play')}</button>
        <button id="nextButton" aria-label="Berikutnya">▶|</button>
        <button id="repeatButton" aria-label="Ulang">↻</button>
      </div>

      <a class="audius-link" href="${escapeHTML(song.permalink)}"
        target="_blank" rel="noopener">BUKA TRACK DI AUDIUS ↗</a>
    </div>
  `;

  modal.classList.add('visible');
  bindPlayerEvents();
  renderLyrics();
  updatePlayerUI();
}

function updatePlayerUI() {
  const playing = !audio.paused;
  const main = $('#mainPlay');

  if (main) main.innerHTML = playing ? icon('pause') : icon('play');

  updateIsland();
  syncMediaSession();
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
    const added = toggleFavorite(currentTrack);
    event.currentTarget.textContent = added ? '♥' : '♡';
    event.currentTarget.classList.toggle('selected', added);
    showToast(added ? 'Ditambahkan ke favorit' : 'Dihapus dari favorit');
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
    audio.play().catch(() => showToast('Audio tidak dapat diputar.'));
  } else {
    audio.pause();
  }
}

function nextSong() {
  if (!queue.length) return;

  const currentIndex = queue.findIndex(song => song.id === currentTrack?.id);
  const index = shuffle
    ? Math.floor(Math.random() * queue.length)
    : (currentIndex + 1 + queue.length) % queue.length;

  playSong(queue[index]);
}

function previousSong() {
  if (!queue.length) return;

  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }

  const currentIndex = queue.findIndex(song => song.id === currentTrack?.id);
  const index = (currentIndex - 1 + queue.length) % queue.length;
  playSong(queue[index]);
}

function renderLyrics() {
  const container = $('#lyricsLines');
  if (!container) return;

  if (!currentLyrics.length) {
    container.innerHTML = '<p class="lyrics-empty">Belum ada lirik. Impor file .LRC melalui Settings.</p>';
    return;
  }

  container.innerHTML = currentLyrics.map((line, index) => `
    <p class="lyric-line" data-lyric="${index}">${escapeHTML(line.text || '♪')}</p>
  `).join('');
}

function updateLyrics() {
  if (!currentLyrics.length) return;

  let index = -1;

  for (let i = 0; i < currentLyrics.length; i++) {
    if (audio.currentTime >= currentLyrics[i].time) index = i;
    else break;
  }

  if (index === activeLyricIndex) return;
  activeLyricIndex = index;

  document.querySelectorAll('.lyric-line').forEach((line, i) => {
    line.classList.toggle('active', i === index);
  });

  const active = document.querySelector(`[data-lyric="${index}"]`);
  active?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function updateLyricsStatus() {
  const status = $('#lyricsStatus');
  if (!status) return;

  if (!currentTrack) {
    status.textContent = 'Putar lagu terlebih dahulu.';
    return;
  }

  const hasLyrics = (getLyricsMap()[currentTrack.id] || []).length > 0;
  status.textContent = hasLyrics
    ? `Lirik tersedia untuk: ${currentTrack.title}`
    : `Belum ada lirik untuk: ${currentTrack.title}`;
}

function importLyrics(file) {
  if (!file || !currentTrack) {
    showToast('Putar lagu sebelum mengimpor lirik.');
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    const parsed = parseLRC(String(reader.result || ''));

    if (!parsed.length) {
      showToast('Format LRC tidak valid.');
      return;
    }

    const map = getLyricsMap();
    map[currentTrack.id] = parsed;
    localStorage.setItem(LYRICS_KEY, JSON.stringify(map));

    currentLyrics = parsed;
    activeLyricIndex = -1;

    renderLyrics();
    updateLyricsStatus();
    showToast('Lirik berhasil dimuat.');
  };

  reader.onerror = () => showToast('File lirik gagal dibaca.');
  reader.readAsText(file);
}

function bindPageEvents() {
  bindSongButtons();

  const search = $('#searchInput');

  if (search) {
    search.addEventListener('input', () => {
      clearTimeout(searchTimer);
      const query = search.value.trim();
      searchTimer = setTimeout(() => runSearch(query), 400);
    });
  }

  document.querySelectorAll('[data-category]').forEach(button => {
    button.onclick = () => {
      document.querySelectorAll('[data-category]').forEach(item =>
        item.classList.toggle('selected', item === button)
      );

      const category = button.dataset.category;
      runSearch(category === 'indonesia' ? 'indonesian pop' : 'global pop');
    };
  });

  const discover = $('#discoverButton');
  if (discover) discover.onclick = () => navigate('search');

  const openLibrary = $('#openLibrary');
  if (openLibrary) openLibrary.onclick = () => navigate('library');

  const upload = $('#lyricsUpload');
  if (upload) {
    upload.onchange = () => {
      importLyrics(upload.files?.[0]);
      upload.value = '';
    };
  }
}

app.innerHTML = shell(homePage());

document.querySelectorAll('[data-page]').forEach(button => {
  button.addEventListener('click', () => navigate(button.dataset.page));
});

$('#brandHome').addEventListener('click', event => {
  event.preventDefault();
  navigate('home');
});

$('#dynamicIsland').addEventListener('click', () => {
  if (!currentTrack) return;
  openPlayer();
});

$('#islandPlay').addEventListener('click', event => {
  event.stopPropagation();
  togglePlay();
});

audio.addEventListener('timeupdate', () => {
  const seek = $('#seekBar');

  if (seek && audio.duration) {
    seek.value = audio.currentTime / audio.duration * 100;
    $('#currentTime').textContent = formatTime(audio.currentTime);
  }

  updateLyrics();
  syncMediaSession();
});

audio.addEventListener('loadedmetadata', () => {
  const total = $('#totalTime');
  if (total) total.textContent = formatTime(audio.duration);
  syncMediaSession();
});

audio.addEventListener('play', updatePlayerUI);
audio.addEventListener('pause', updatePlayerUI);

audio.addEventListener('ended', () => {
  if (repeat) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } else {
    nextSong();
  }
});

setupMediaSession();
bindPageEvents();
loadFeatured();
