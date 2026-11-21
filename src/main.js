
import './styles/main.css';
import './poster/poster.css';

import { renderPoster, initPoster } from './poster/poster.js';

const songs = [
  {
    id: 1,
    title: 'Nenekku Pahlawanku',
    artist: 'Wali',
    cover: 'https://placehold.co/500x500/252525/ffffff?text=WALI',
    url: '',
    duration: '03:45'
  },
  {
    id: 2,
    title: 'Hingga Tua Bersama',
    artist: 'Rizky Febian',
    cover: 'https://placehold.co/500x500/343434/ffffff?text=RIZKY',
    url: '',
    duration: '04:12'
  },
  {
    id: 3,
    title: 'Sempurna',
    artist: 'Andra & The Backbone',
    cover: 'https://placehold.co/500x500/202020/ffffff?text=SEMPURNA',
    url: '',
    duration: '04:01'
  },
  {
    id: 4,
    title: 'Komang',
    artist: 'Raim Laode',
    cover: 'https://placehold.co/500x500/303030/ffffff?text=KOMANG',
    url: '',
    duration: '03:55'
  }
];

const audio = new Audio();
audio.preload = 'metadata';

let currentIndex = 0;
let shuffle = false;
let repeat = false;
let currentPage = 'home';

const app = document.querySelector('#app');

function shell(content) {
  return `
    <div class="app-shell">
      <header class="topbar">
        <div class="brand">ZORFY<span>.</span></div>
        <button class="profile-button" id="profileButton">Z</button>
      </header>

      <main id="pageContent">${content}</main>

      <div class="mini-player" id="miniPlayer">
        <img id="miniCover" src="${songs[0].cover}">
        <div class="mini-info">
          <strong id="miniTitle">${songs[0].title}</strong>
          <span id="miniArtist">${songs[0].artist}</span>
        </div>
        <button id="miniPlay">▶</button>
      </div>

      <nav class="bottom-nav">
        <button data-page="home" class="active">⌂<span>Beranda</span></button>
        <button data-page="search">⌕<span>Cari</span></button>
        <button data-page="library">▤<span>Pustaka</span></button>
        <button data-page="poster">▧<span>Poster</span></button>
      </nav>

      <div id="playerModal" class="player-modal"></div>
    </div>
  `;
}

function homePage() {
  return `
    <section class="greeting">
      <p>YOUR MUSIC SPACE</p>
      <h1>Musik untuk<br>setiap momen.</h1>
    </section>

    <section class="featured">
      <div>
        <span class="eyebrow">FEATURED PLAYLIST</span>
        <h2>Late Night<br>Memories</h2>
        <p>Temani malam dengan musik favoritmu.</p>
        <button class="primary-button" id="featuredPlay">Putar playlist →</button>
      </div>
      <div class="featured-art">Z.</div>
    </section>

    <section class="section">
      <div class="section-heading">
        <h2>Rekomendasi</h2>
        <span>UNTUK KAMU</span>
      </div>
      <div class="song-list">
        ${songs.map(songRow).join('')}
      </div>
    </section>

    <section class="section">
      <div class="section-heading">
        <h2>Playlist kamu</h2>
      </div>
      <div class="playlist-card">
        <div class="playlist-art">ZORFY</div>
        <div>
          <strong>My Favorite Songs</strong>
          <p>4 lagu · Playlist pribadi</p>
        </div>
      </div>
    </section>
  `;
}

function songRow(song) {
  return `
    <button class="song-item" data-song="${song.id}">
      <img src="${song.cover}" alt="">
      <div class="song-details">
        <strong>${song.title}</strong>
        <span>${song.artist}</span>
      </div>
      <span class="song-duration">${song.duration}</span>
    </button>
  `;
}

function searchPage() {
  return `
    <section class="page-heading">
      <span>DISCOVER</span>
      <h1>Cari musik.</h1>
    </section>

    <input class="search-input" id="searchInput"
      placeholder="Cari judul lagu atau artis...">

    <div class="song-list" id="searchResults">
      ${songs.map(songRow).join('')}
    </div>
  `;
}

function libraryPage() {
  return `
    <section class="page-heading">
      <span>YOUR COLLECTION</span>
      <h1>Pustaka.</h1>
    </section>

    <div class="playlist-card">
      <div class="playlist-art">ZORFY</div>
      <div>
        <strong>My Favorite Songs</strong>
        <p>${songs.length} lagu</p>
      </div>
    </div>

    <section class="section">
      <h2>Semua lagu</h2>
      <div class="song-list">
        ${songs.map(songRow).join('')}
      </div>
    </section>

    <section class="section">
      <h2>Poster tersimpan</h2>
      <div id="libraryPosters"></div>
    </section>
  `;
}

function navigate(page) {
  currentPage = page;

  document.querySelectorAll('[data-page]').forEach(button => {
    button.classList.toggle('active', button.dataset.page === page);
  });

  const content = document.querySelector('#pageContent');

  if (page === 'home') content.innerHTML = homePage();
  if (page === 'search') content.innerHTML = searchPage();
  if (page === 'library') content.innerHTML = libraryPage();

  if (page === 'poster') {
    content.innerHTML = renderPoster();
    initPoster();
  }

  bindPageEvents();
}

function playSong(index) {
  currentIndex = index;
  const song = songs[index];

  document.querySelector('#miniCover').src = song.cover;
  document.querySelector('#miniTitle').textContent = song.title;
  document.querySelector('#miniArtist').textContent = song.artist;

  if (song.url) {
    audio.src = song.url;
    audio.play().catch(() => {
      alert('Audio tidak dapat diputar. Periksa sumber audio.');
    });
  } else {
    alert('Sumber audio lagu ini belum ditambahkan.');
  }

  updatePlayerUI();
  openPlayer();
}

function updatePlayerUI() {
  document.querySelector('#miniPlay').textContent =
    audio.paused ? '▶' : 'Ⅱ';
}

function openPlayer() {
  const song = songs[currentIndex];
  const modal = document.querySelector('#playerModal');

  modal.innerHTML = `
    <div class="player-content">
      <button class="close-player" id="closePlayer">↓</button>
      <img class="large-cover" src="${song.cover}">
      <h2>${song.title}</h2>
      <p>${song.artist}</p>

      <input type="range" id="seekBar" min="0" max="100" value="0">

      <div class="player-times">
        <span id="currentTime">0:00</span>
        <span id="totalTime">0:00</span>
      </div>

      <div class="player-controls">
        <button id="shuffleButton">⇄</button>
        <button id="previousButton">|◀</button>
        <button id="mainPlay">▶</button>
        <button id="nextButton">▶|</button>
        <button id="repeatButton">↻</button>
      </div>
    </div>
  `;

  modal.classList.add('visible');
  bindPlayerEvents();
  updatePlayerUI();
}

function bindPlayerEvents() {
  document.querySelector('#closePlayer').onclick = () => {
    document.querySelector('#playerModal').classList.remove('visible');
  };

  document.querySelector('#mainPlay').onclick = togglePlay;
  document.querySelector('#previousButton').onclick = previousSong;
  document.querySelector('#nextButton').onclick = nextSong;

  document.querySelector('#shuffleButton').onclick = event => {
    shuffle = !shuffle;
    event.currentTarget.classList.toggle('selected', shuffle);
  };

  document.querySelector('#repeatButton').onclick = event => {
    repeat = !repeat;
    event.currentTarget.classList.toggle('selected', repeat);
  };

  document.querySelector('#seekBar').oninput = event => {
    if (audio.duration) {
      audio.currentTime = audio.duration * event.target.value / 100;
    }
  };
}

function togglePlay() {
  if (!audio.src) {
    alert('Tambahkan sumber audio terlebih dahulu.');
    return;
  }

  if (audio.paused) audio.play();
  else audio.pause();

  updatePlayerUI();
}

function nextSong() {
  const index = shuffle
    ? Math.floor(Math.random() * songs.length)
    : (currentIndex + 1) % songs.length;

  playSong(index);
}

function previousSong() {
  playSong((currentIndex - 1 + songs.length) % songs.length);
}

function bindPageEvents() {
  document.querySelectorAll('[data-song]').forEach(button => {
    button.onclick = () => {
      const index = songs.findIndex(
        song => song.id === Number(button.dataset.song)
      );
      if (index >= 0) playSong(index);
    };
  });

  const search = document.querySelector('#searchInput');

  if (search) {
    search.addEventListener('input', () => {
      const query = search.value.toLowerCase();

      document.querySelector('#searchResults').innerHTML =
        songs.filter(song =>
          `${song.title} ${song.artist}`.toLowerCase().includes(query)
        ).map(songRow).join('');

      bindPageEvents();
    });
  }

  const featured = document.querySelector('#featuredPlay');
  if (featured) featured.onclick = () => playSong(0);
}

document.querySelector('#app').innerHTML = shell(homePage());

document.querySelectorAll('[data-page]').forEach(button => {
  button.addEventListener('click', () => navigate(button.dataset.page));
});

document.querySelector('#miniPlay').addEventListener('click', togglePlay);

audio.addEventListener('timeupdate', () => {
  const seek = document.querySelector('#seekBar');
  if (seek && audio.duration) {
    seek.value = audio.currentTime / audio.duration * 100;
    document.querySelector('#currentTime').textContent =
      formatTime(audio.currentTime);
  }
});

audio.addEventListener('loadedmetadata', () => {
  const total = document.querySelector('#totalTime');
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

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${minutes}:${String(remaining).padStart(2, '0')}`;
}

bindPageEvents();
