
import './styles/main.css';

const songs = [
  {
    title: 'Nenekku Pahlawanku',
    artist: 'Wali',
    cover: 'https://placehold.co/400x400/252525/ffffff?text=WALI',
    duration: '03:45'
  },
  {
    title: 'Hingga Tua Bersama',
    artist: 'Rizky Febian',
    cover: 'https://placehold.co/400x400/343434/ffffff?text=RIZKY',
    duration: '04:12'
  },
  {
    title: 'Sempurna',
    artist: 'Andra & The Backbone',
    cover: 'https://placehold.co/400x400/202020/ffffff?text=SEMPURNA',
    duration: '04:01'
  },
  {
    title: 'Komang',
    artist: 'Raim Laode',
    cover: 'https://placehold.co/400x400/303030/ffffff?text=KOMANG',
    duration: '03:55'
  }
];

let currentSong = 0;
let playing = false;

document.querySelector('#app').innerHTML = `
  <div class="app-shell">

    <header class="topbar">
      <div class="brand">ZORFY<span>.</span></div>
      <button class="profile-button" aria-label="Profil">Z</button>
    </header>

    <main>
      <section class="greeting">
        <p>YOUR MUSIC SPACE</p>
        <h1>Musik untuk<br>setiap momen.</h1>
      </section>

      <section class="featured">
        <div class="featured-info">
          <span class="eyebrow">FEATURED PLAYLIST</span>
          <h2>Late Night<br>Memories</h2>
          <p>Temani malam dengan musik favoritmu.</p>
          <button id="featuredPlay">Putar playlist <span>→</span></button>
        </div>
        <div class="featured-art">Z.</div>
      </section>

      <section class="section">
        <div class="section-heading">
          <h2>Baru diputar</h2>
          <button id="allSongs">Lihat semua</button>
        </div>
        <div class="song-list" id="songList"></div>
      </section>

      <section class="section">
        <div class="section-heading">
          <h2>Playlist kamu</h2>
          <button id="createPlaylist">+ Buat</button>
        </div>
        <div class="playlist-card">
          <div class="playlist-art">ZORFY</div>
          <div>
            <h3>My Favorite Songs</h3>
            <p>4 lagu · Playlist pribadi</p>
          </div>
        </div>
      </section>
    </main>

    <div class="mini-player" id="miniPlayer">
      <img id="miniCover" src="${songs[0].cover}">
      <div class="mini-info">
        <strong id="miniTitle">${songs[0].title}</strong>
        <span id="miniArtist">${songs[0].artist}</span>
      </div>
      <button id="playButton" aria-label="Putar">▶</button>
    </div>

    <nav class="bottom-nav">
      <button class="active" data-page="home">⌂<span>Beranda</span></button>
      <button data-page="search">⌕<span>Cari</span></button>
      <button data-page="library">▤<span>Pustaka</span></button>
      <button data-page="poster">▧<span>Poster</span></button>
    </nav>

  </div>
`;

const songList = document.querySelector('#songList');

songList.innerHTML = songs.map((song, index) => `
  <button class="song-item" data-song="${index}">
    <img src="${song.cover}" alt="">
    <div class="song-details">
      <strong>${song.title}</strong>
      <span>${song.artist}</span>
    </div>
    <span class="song-duration">${song.duration}</span>
  </button>
`).join('');

function selectSong(index) {
  currentSong = index;
  const song = songs[index];

  document.querySelector('#miniCover').src = song.cover;
  document.querySelector('#miniTitle').textContent = song.title;
  document.querySelector('#miniArtist').textContent = song.artist;

  playing = true;
  updatePlayButton();
}

function updatePlayButton() {
  document.querySelector('#playButton').textContent =
    playing ? 'Ⅱ' : '▶';
}

songList.addEventListener('click', event => {
  const item = event.target.closest('[data-song]');
  if (item) selectSong(Number(item.dataset.song));
});

document.querySelector('#playButton').addEventListener('click', () => {
  playing = !playing;
  updatePlayButton();
});

document.querySelector('#featuredPlay').addEventListener('click', () => {
  selectSong(0);
});

document.querySelector('#allSongs').addEventListener('click', () => {
  document.querySelector('#songList').scrollIntoView({
    behavior: 'smooth'
  });
});

document.querySelector('#createPlaylist').addEventListener('click', () => {
  alert('Fitur pembuatan playlist akan segera tersedia.');
});
