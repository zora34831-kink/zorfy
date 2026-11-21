
import './styles/main.css';

/* =========================================
   ZORFY MUSIC PLAYER
   Trending + TikTok Discovery + Lyrics
========================================= */

const API = 'https://api.audius.co/v1';
const LYRICS_API = 'https://lrclib.net/api';
const APP_NAME = 'ZORFY';

const FAVORITES_KEY = 'zorfy_favorites';
const LYRICS_KEY = 'zorfy_lyrics';
const LYRICS_PROVIDER_KEY = 'zorfy_lyrics_provider';

const indonesiaQueries = [
  'pop indonesia',
  'lagu indonesia populer',
  'lagu indonesia terbaru',
  'lagu viral indonesia',
  'lagu tiktok indonesia',
  'lagu galau indonesia',
  'lagu romantis indonesia',
  'indonesian indie',
  'indonesian rock',
  'lagu nostalgia indonesia',
  'lagu band indonesia',
  'lagu akustik indonesia',
  'lagu jawa populer',
  'dangdut koplo indonesia',
  'Wali',
  'Nenekku Pahlawanku Wali',
  'Hingga Tua Bersama Rizky Febian',
  'Sempurna Andra and The Backbone',
  'Komang Raim Laode',
  'Tulus',
  'Afgan',
  'Raisa',
  'Isyana Sarasvati',
  'Rossa',
  'Yura Yunita',
  'Mahalini',
  'Tiara Andini',
  'Lyodra',
  'Ziva Magnolya',
  'Judika',
  'Virgoun',
  'Last Child',
  'Armada',
  'Repvblik',
  'D Masiv',
  'ST12',
  'Kangen Band',
  'Hindia',
  'Feast',
  'Nadin Amizah',
  'Sal Priadi',
  'Fiersa Besari',
  'Feby Putri',
  'Fourtwnty',
  'Dewa 19',
  'NOAH',
  'Peterpan',
  'Sheila On 7',
  'Ungu',
  'Padi',
  'Nidji',
  'Kotak',
  'Geisha',
  'Denny Caknan',
  'NDX AKA',
  'Guyon Waton',
  'Happy Asmara',
  'Nella Kharisma',
  'Via Vallen',
  'Gilga Sahid',
  'RAN',
  'Maliq D Essentials',
  'Kunto Aji',
  'Pamungkas',
  'Juicy Luicy',
  'Bernadya',
  'Budi Doremi',
  'Anji',
  'Ari Lasso',
  'Glenn Fredly',
  'Chrisye',
  'Iwan Fals',
  'Kerispatih',
  'Samsons'
];

const globalQueries = [
  'global pop',
  'pop hits',
  'viral global music',
  'TikTok viral songs',
  'indie pop',
  'alternative rock',
  'acoustic songs',
  'rnb',
  'hip hop',
  'electronic music',
  'jazz',
  'lofi',
  'rock classics',
  'Taylor Swift',
  'The Weeknd',
  'Ed Sheeran',
  'Bruno Mars',
  'Adele',
  'Coldplay',
  'Imagine Dragons',
  'One Direction',
  'Justin Bieber',
  'Billie Eilish',
  'Lana Del Rey'
];

/*
 * Kata kunci pencarian penemuan lagu TikTok.
 * Ini bukan data chart resmi TikTok.
 * Hasil hanya lagu yang ditemukan di Audius.
 */
const tiktokQueries = [
  'TikTok viral Indonesia',
  'lagu TikTok viral',
  'sound TikTok Indonesia',
  'TikTok slow reverb',
  'TikTok sped up',
  'TikTok remix Indonesia',
  'TikTok DJ Indonesia',
  'lagu galau TikTok',
  'lagu jedag jedug',
  'TikTok viral 2026',
  'viral Indonesian song',
  'viral TikTok remix',
  'TikTok trending music',
  'TikTok viral pop',
  'TikTok acoustic viral',
  'TikTok phonk',
  'TikTok dance song',
  'TikTok nostalgia song',
  'TikTok love song',
  'TikTok edit audio'
];

/* =========================================
   AUDIO ENGINE
========================================= */

const audio = new Audio();

audio.preload = 'metadata';
audio.setAttribute('playsinline', '');
audio.crossOrigin = 'anonymous';

let songs = [];
let queue = [];
let currentTrack = null;
let currentPage = 'home';

let shuffle = false;
let repeat = false;

let searchTimer = null;
let toastTimer = null;

let currentLyrics = [];
let currentLyricsMode = 'none';
let activeLyricIndex = -1;

let lyricsRequestToken = 0;
let requestToken = 0;

let activeLyricsProvider =
  localStorage.getItem(LYRICS_PROVIDER_KEY) || 'automatic';

let activeLyricsProviderName = 'Otomatis';

const $ = selector => document.querySelector(selector);
const app = $('#app');

/* =========================================
   UTILITIES
========================================= */

function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function normalizeText(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function icon(name) {
  const paths = {
    home: '<path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/>',
    search: '<circle cx="10.8" cy="10.8" r="7"/><path d="m16 16 5 5"/>',
    library: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 4v16M12 9h5M12 13h5M12 17h3"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.6-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.5-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.5.9l1.7-.6 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.8Z"/>',
    play: '<path d="m8 5 11 7-11 7z"/>',
    pause: '<path d="M8 5h3v14H8zM15 5h3v14h-3z"/>'
  };

  return `
    <svg viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true">
      ${paths[name] || ''}
    </svg>
  `;
}

function safeStorageGet(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function safeStorageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    showToast('Penyimpanan perangkat tidak tersedia.');
  }
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }

  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);

  return `${min}:${String(sec).padStart(2, '0')}`;
}

function externalSearchLinks(song) {
  const query = encodeURIComponent(
    `${song.title} ${song.artist}`
  );

  return {
    spotify: `https://open.spotify.com/search/${query}`,
    youtube: `https://music.youtube.com/search?q=${query}`
  };
}

/* =========================================
   AUDIUS API
========================================= */

function artwork(track) {
  return (
    track?.artwork?.['480x480'] ||
    track?.artwork?.['150x150'] ||
    track?.user?.profile_picture?.['150x150'] ||
    ''
  );
}

function normalizeTrack(track) {
  if (!track?.id) return null;

  return {
    id: String(track.id),
    title: track.title || 'Unknown Track',
    artist: track.user?.name || 'Unknown Artist',
    cover: artwork(track),
    duration: Number(track.duration) || 0,

    stream: `${API}/tracks/${encodeURIComponent(track.id)}/stream?app_name=${APP_NAME}`,

    permalink: track.permalink
      ? `https://audius.co${track.permalink}`
      : 'https://audius.co'
  };
}

async function api(path) {
  const response = await fetch(`${API}${path}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Audius error ${response.status}`);
  }

  const json = await response.json();
  return json?.data;
}

async function searchTracks(query, limit = 20) {
  const params = new URLSearchParams({
    query,
    limit: String(limit),
    app_name: APP_NAME
  });

  const result = await api(
    `/tracks/search?${params.toString()}`
  );

  return (Array.isArray(result) ? result : [])
    .map(normalizeTrack)
    .filter(Boolean);
}

async function getTrendingTracks(limit = 40) {
  const params = new URLSearchParams({
    time: 'week',
    limit: String(limit),
    app_name: APP_NAME
  });

  const result = await api(
    `/tracks/trending?${params.toString()}`
  );

  return (Array.isArray(result) ? result : [])
    .map(normalizeTrack)
    .filter(Boolean);
}

/* =========================================
   DEDUPLICATION
========================================= */

function deduplicateTracks(list) {
  const ids = new Set();
  const names = new Set();
  const result = [];

  for (const song of list) {
    if (!song?.id) continue;

    const id = String(song.id);
    const identity =
      `${normalizeText(song.title)}::${normalizeText(song.artist)}`;

    if (ids.has(id) || names.has(identity)) {
      continue;
    }

    ids.add(id);
    names.add(identity);
    result.push(song);
  }

  return result;
}

/* =========================================
   FAVORITES
========================================= */

function getFavorites() {
  const value = safeStorageGet(FAVORITES_KEY, []);
  return Array.isArray(value) ? value : [];
}

function toggleFavorite(song) {
  if (!song) return false;

  const favorites = getFavorites();

  const exists = favorites.some(
    item => String(item.id) === String(song.id)
  );

  const updated = exists
    ? favorites.filter(
        item => String(item.id) !== String(song.id)
      )
    : [...favorites, song];

  safeStorageSet(FAVORITES_KEY, updated);
  return !exists;
}

/* =========================================
   LYRICS STORAGE + PARSING
========================================= */

function getLyricsMap() {
  const value = safeStorageGet(LYRICS_KEY, {});
  return value && typeof value === 'object' ? value : {};
}

function parseLRC(text) {
  const lines = [];

  for (const raw of String(text).split(/\r?\n/)) {
    const matches = [
      ...raw.matchAll(/\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g)
    ];

    if (!matches.length) continue;

    const lyricText = raw
      .replace(/\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g, '')
      .trim();

    for (const match of matches) {
      const fraction = match[3]
        ? Number(`0.${match[3]}`)
        : 0;

      lines.push({
        time:
          Number(match[1]) * 60 +
          Number(match[2]) +
          fraction,
        text: lyricText
      });
    }
  }

  return lines
    .filter(line => line.text)
    .sort((a, b) => a.time - b.time);
}

function plainLyricsToLines(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(text => ({
      time: -1,
      text
    }));
}

function parseTimestamp(value) {
  if (!value) return NaN;

  const raw = String(value).trim();

  if (/^\d+(\.\d+)?s$/.test(raw)) {
    return Number(raw.slice(0, -1));
  }

  const parts = raw.split(':');

  if (parts.length === 3) {
    return (
      Number(parts[0]) * 3600 +
      Number(parts[1]) * 60 +
      Number(parts[2])
    );
  }

  if (parts.length === 2) {
    return Number(parts[0]) * 60 + Number(parts[1]);
  }

  return NaN;
}

function parseTTML(ttml) {
  if (!ttml || typeof DOMParser === 'undefined') {
    return [];
  }

  try {
    const doc = new DOMParser().parseFromString(
      ttml,
      'application/xml'
    );

    if (doc.querySelector('parsererror')) return [];

    return [...doc.getElementsByTagNameNS('*', 'p')]
      .map(paragraph => ({
        time: parseTimestamp(
          paragraph.getAttribute('begin') ||
          paragraph.getAttribute('start')
        ),
        text: (paragraph.textContent || '')
          .replace(/\s+/g, ' ')
          .trim()
      }))
      .filter(line =>
        Number.isFinite(line.time) && line.text
      )
      .sort((a, b) => a.time - b.time);
  } catch (error) {
    console.warn('TTML parse:', error);
    return [];
  }
}

/* =========================================
   LYRICS PROVIDERS
========================================= */

async function requestJSON(url, headers = {}) {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...headers
    }
  });

  if (response.status === 404) return null;

  if (response.status === 429) {
    throw new Error('Rate limit penyedia lirik.');
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

async function fetchLRCLIB(song) {
  const params = new URLSearchParams({
    track_name: song.title,
    artist_name: song.artist
  });

  if (song.duration > 0 && song.duration <= 3600) {
    params.set('duration', String(Math.round(song.duration)));
  }

  let record = await requestJSON(
    `${LYRICS_API}/get?${params}`
  );

  if (record) return record;

  params.delete('duration');

  record = await requestJSON(
    `${LYRICS_API}/get?${params}`
  );

  if (record) return record;

  const results = await requestJSON(
    `${LYRICS_API}/search?${params}`
  );

  if (!Array.isArray(results)) return null;

  const title = normalizeText(song.title);
  const artist = normalizeText(song.artist);

  return results.find(item =>
    normalizeText(item.trackName) === title &&
    normalizeText(item.artistName) === artist
  ) || null;
}

async function fetchBetterLyrics(song, provider = 'ttml') {
  const params = new URLSearchParams({
    s: song.title,
    a: song.artist,
    al: song.album || '',
    d: String(Math.max(0, Math.round(song.duration || 0)))
  });

  const endpoint = provider === 'kugou'
    ? 'kugou/getLyrics'
    : 'getLyrics';

  const response = await fetch(
    `https://api.betterlyrics.org/${endpoint}?${params}`,
    {
      headers: {
        Accept: 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`BetterLyrics ${response.status}`);
  }

  const data = await response.json();

  if (provider === 'kugou') {
    const lines = parseLRC(data.lyrics || '');

    return lines.length
      ? {
          lines,
          mode: 'synced',
          provider: 'Kugou via BetterLyrics'
        }
      : null;
  }

  const lines = parseTTML(
    data.ttml || data.lyrics || ''
  );

  return lines.length
    ? {
        lines,
        mode: 'synced',
        provider: 'BetterLyrics'
      }
    : null;
}

async function fetchLrcRed(song) {
  const params = new URLSearchParams({
    q: `${song.title} ${song.artist}`
  });

  const response = await fetch(
    `https://lrc.red/search.json?${params}`,
    {
      headers: {
        Accept: 'application/json',
        'X-Client-ID': 'ZORFY Music Player'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`lrc.red ${response.status}`);
  }

  const data = await response.json();
  const hits = Array.isArray(data.hits) ? data.hits : [];

  const title = normalizeText(song.title);
  const artist = normalizeText(song.artist);

  const hit = hits.find(item =>
    normalizeText(item.title) === title &&
    normalizeText(item.artist) === artist
  );

  if (!hit?.isrc) return null;

  const trackResponse = await fetch(
    `https://lrc.red/s/${encodeURIComponent(hit.isrc)}.json`
  );

  if (!trackResponse.ok) return null;

  const track = await trackResponse.json();

  if (track.files?.lrc) {
    const lrcResponse = await fetch(track.files.lrc);

    if (lrcResponse.ok) {
      const lines = parseLRC(await lrcResponse.text());

      if (lines.length) {
        return {
          lines,
          mode: 'synced',
          provider: 'lrc.red'
        };
      }
    }
  }

  if (track.files?.ttml) {
    const ttmlResponse = await fetch(track.files.ttml);

    if (ttmlResponse.ok) {
      const lines = parseTTML(await ttmlResponse.text());

      if (lines.length) {
        return {
          lines,
          mode: 'synced',
          provider: 'lrc.red TTML'
        };
      }
    }
  }

  return null;
}

async function fetchLyricsFromProvider(song, provider) {
  if (provider === 'lrclib') {
    const record = await fetchLRCLIB(song);

    if (!record || record.instrumental) return null;

    if (record.syncedLyrics) {
      const lines = parseLRC(record.syncedLyrics);

      if (lines.length) {
        return {
          lines,
          mode: 'synced',
          provider: 'LRCLIB'
        };
      }
    }

    if (record.plainLyrics) {
      const lines = plainLyricsToLines(record.plainLyrics);

      if (lines.length) {
        return {
          lines,
          mode: 'plain',
          provider: 'LRCLIB'
        };
      }
    }

    return null;
  }

  if (provider === 'better') {
    return fetchBetterLyrics(song, 'ttml');
  }

  if (provider === 'kugou') {
    return fetchBetterLyrics(song, 'kugou');
  }

  if (provider === 'lrc-red') {
    return fetchLrcRed(song);
  }

  return null;
}

async function fetchLyricsRecord(song, provider = 'automatic') {
  const order = provider === 'automatic'
    ? ['lrclib', 'better', 'kugou', 'lrc-red']
    : [provider];

  for (const source of order) {
    try {
      const result = await fetchLyricsFromProvider(
        song,
        source
      );

      if (result?.lines?.length) {
        return result;
      }
    } catch (error) {
      console.warn(`Lyrics ${source}:`, error);
    }
  }

  return null;
}

function applyLyricsRecord(record) {
  if (!record?.lines?.length) {
    currentLyrics = [];
    currentLyricsMode = 'none';
    activeLyricsProviderName = 'Tidak ditemukan';
  } else {
    currentLyrics = record.lines;
    currentLyricsMode = record.mode || 'none';
    activeLyricsProviderName = record.provider || 'Sumber lirik';
  }

  activeLyricIndex = -1;
  renderLyrics();
  updateLyricsSourcePanel();
}

/* =========================================
   LYRICS LOADER
========================================= */

async function loadAutomaticLyrics(
  song,
  provider = activeLyricsProvider
) {
  if (!song) return;

  const token = ++lyricsRequestToken;
  const cache = getLyricsMap()[song.id];

  if (provider === 'automatic' && Array.isArray(cache) && cache.length) {
    currentLyrics = cache;

    currentLyricsMode = cache.some(
      line => Number(line.time) >= 0
    ) ? 'synced' : 'plain';

    activeLyricsProviderName = 'Tersimpan di perangkat';
    activeLyricIndex = -1;

    renderLyrics();
    updateLyricsStatus();
    updateLyricsSourcePanel();
    return;
  }

  currentLyrics = [];
  currentLyricsMode = 'loading';
  activeLyricsProviderName = 'Sedang mencari';

  activeLyricIndex = -1;

  renderLyrics();
  updateLyricsStatus();
  updateLyricsSourcePanel();

  const result = await fetchLyricsRecord(song, provider);

  if (
    token !== lyricsRequestToken ||
    currentTrack?.id !== song.id
  ) {
    return;
  }

  applyLyricsRecord(result);

  if (currentLyrics.length) {
    const map = getLyricsMap();
    map[song.id] = currentLyrics;
    safeStorageSet(LYRICS_KEY, map);
  }

  updateLyricsStatus();
  updateLyricsSourcePanel();

  if (!currentLyrics.length) {
    showToast('Lirik tidak ditemukan dari sumber yang tersedia.');
  }
}

/* =========================================
   SONG COMPONENT
========================================= */

function songRow(song) {
  return `
    <button class="song-item"
      data-song="${escapeHTML(song.id)}">

      <img
        src="${escapeHTML(song.cover)}"
        alt=""
        loading="lazy"
        onerror="this.style.opacity='0'">

      <span class="song-details">
        <strong>${escapeHTML(song.title)}</strong>
        <span>${escapeHTML(song.artist)}</span>
      </span>

      <span class="song-play">
        ${icon('play')}
      </span>
    </button>
  `;
}

function sectionMarkup(label, title, id, source) {
  return `
    <section class="section">
      <div class="section-heading">
        <div>
          <span class="overline">${label}</span>
          <h2>${title}</h2>
        </div>
        <span class="section-count">${source}</span>
      </div>

      <div class="song-list" id="${id}">
        <div class="loading-line">Memuat lagu...</div>
      </div>
    </section>
  `;
}

/* =========================================
   PAGE SHELL
========================================= */

function shell(content) {
  return `
    <div class="app-shell">

      <header class="topbar">
        <a class="brand" href="#" id="brandHome">
          ZORFY<span>.</span>
        </a>

        <span class="top-caption">
          MUSIC PLAYER
        </span>
      </header>

      <main id="pageContent">
        ${content}
      </main>

      <div class="mini-player" id="miniPlayer">
        <button class="mini-player-main"
          id="miniPlayerOpen"
          aria-label="Buka pemutar musik">

          <img id="miniCover" src="" alt="">

          <span class="mini-player-info">
            <strong id="miniTitle">ZORFY</strong>
            <small id="miniArtist">Pilih musik untuk mulai</small>
          </span>
        </button>

        <button class="mini-player-control"
          id="miniPlay"
          aria-label="Putar atau jeda">
          ${icon('play')}
        </button>
      </div>

      <nav class="bottom-nav" aria-label="Navigasi utama">
        <button data-page="home" class="active">
          ${icon('home')}
          <span>Beranda</span>
        </button>

        <button data-page="search">
          ${icon('search')}
          <span>Cari</span>
        </button>

        <button data-page="library">
          ${icon('library')}
          <span>Pustaka</span>
        </button>

        <button data-page="settings">
          ${icon('settings')}
          <span>Settings</span>
        </button>
      </nav>

      <div id="playerModal" class="player-modal"></div>
      <div id="toast" class="toast"></div>
    </div>
  `;
}

/* =========================================
   HOME PAGE
========================================= */

function homePage() {
  return `
    <section class="hero">
      <span class="overline">YOUR SOUND. YOUR SPACE.</span>

      <h1>
        Every moment<br>
        <span>has a soundtrack.</span>
      </h1>

      <p>Temukan musik yang cocok dengan suasana lu.</p>
    </section>

    ${sectionMarkup(
      'INDONESIA CHART',
      'Trending Indonesia',
      'indonesiaTrending',
      'AUDIUS'
    )}

    ${sectionMarkup(
      'TIKTOK DISCOVERY',
      'TikTok Viral',
      'tiktokTrending',
      'DISCOVERY'
    )}

    ${sectionMarkup(
      'WORLDWIDE',
      'Trending Global',
      'globalTrending',
      'AUDIUS'
    )}

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
          <small id="favoriteCount">
            ${getFavorites().length} lagu tersimpan
          </small>
        </span>

        <span class="collection-arrow">↗</span>
      </button>
    </section>

    <p class="source-note">
      AUDIO CATALOG POWERED BY AUDIUS
    </p>
  `;
}

/* =========================================
   SEARCH PAGE
========================================= */

function searchPage() {
  return `
    <section class="page-heading">
      <span class="overline">DISCOVER SOMETHING NEW</span>
      <h1>Search<span>.</span></h1>
      <p>Cari lagu dari katalog musik yang tersedia.</p>
    </section>

    <div class="search-wrap">
      ${icon('search')}

      <input
        id="searchInput"
        placeholder="Judul lagu atau nama artis..."
        autocomplete="off">
    </div>

    <div class="category-switch">
      <button class="selected" data-category="indonesia">
        Indonesia
      </button>

      <button data-category="global">
        Global
      </button>

      <button data-category="tiktok">
        TikTok
      </button>
    </div>

    <div class="search-meta" id="searchMeta">
      PILIH KATEGORI ATAU CARI LAGU
    </div>

    <div class="song-list" id="searchResults">
      <div class="empty-state">
        Pilih kategori atau ketik judul lagu.
      </div>
    </div>
  `;
}

/* =========================================
   LIBRARY PAGE
========================================= */

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
      <div class="section-heading">
        <h2>Lagu favorit</h2>
      </div>

      <div class="song-list">
        ${
          favorites.length
            ? favorites.map(songRow).join('')
            : `
              <div class="empty-state">
                Belum ada lagu favorit.
                Cari lagu lalu simpan.
              </div>
            `
        }
      </div>
    </section>
  `;
}

/* =========================================
   SETTINGS PAGE
========================================= */

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
        <strong>Lirik otomatis</strong>
        <p>
          Mencari lirik dari beberapa penyedia.
        </p>

        <small id="lyricsStatus">
          Putar lagu untuk mencari lirik.
        </small>

        <label class="settings-upload">
          Pilih file LRC

          <input
            type="file"
            id="lyricsUpload"
            accept=".lrc,text/plain">
        </label>
      </div>
    </section>

    <section class="settings-group">
      <div class="settings-heading">MUSIC SERVICES</div>

      <div class="settings-card">
        <strong>Spotify</strong>
        <p>
          Buka pencarian Spotify untuk lagu yang sedang dipilih.
        </p>
        <button class="service-button" id="openSpotify">
          Buka Spotify
        </button>
      </div>

      <div class="settings-card">
        <strong>YouTube Music</strong>
        <p>
          Buka pencarian YouTube Music untuk lagu yang sedang dipilih.
        </p>
        <button class="service-button" id="openYouTubeMusic">
          Buka YouTube Music
        </button>
      </div>

      <div class="settings-card">
        <strong>Auralys</strong>
        <p>
          Pemutaran langsung atau kontrol Auralys memerlukan dukungan integrasi dari aplikasi tersebut.
        </p>
        <small>
          Belum ada koneksi resmi yang dikonfigurasi.
        </small>
      </div>
    </section>

    <section class="settings-group">
      <div class="settings-heading">PLAYBACK</div>

      <div class="settings-card">
        <strong>Kontrol layar kunci</strong>
        <p>
          Metadata dan kontrol media menggunakan Media Session browser.
          Tampilan akhirnya mengikuti dukungan Android.
        </p>
        <span class="settings-state">MEDIA SESSION</span>
      </div>
    </section>

    <section class="settings-group">
      <div class="settings-heading">ABOUT</div>

      <div class="settings-card settings-row">
        <div>
          <strong>ZORFY Music</strong>
          <p>Version 3.0 · Your Music, Your Space</p>
        </div>
        <span class="settings-state">ZORFY</span>
      </div>
    </section>
  `;
}

/* =========================================
   NAVIGATION
========================================= */

function navigate(page) {
  currentPage = page;

  document.querySelectorAll(
    '.bottom-nav [data-page]'
  ).forEach(button => {
    const active = button.dataset.page === page;

    button.classList.toggle('active', active);

    button.setAttribute(
      'aria-current',
      active ? 'page' : 'false'
    );
  });

  const content = $('#pageContent');
  if (!content) return;

  if (page === 'home') content.innerHTML = homePage();
  if (page === 'search') content.innerHTML = searchPage();
  if (page === 'library') content.innerHTML = libraryPage();
  if (page === 'settings') content.innerHTML = settingsPage();

  bindPageEvents();

  if (page === 'home') loadFeatured();
  if (page === 'settings') updateLyricsStatus();
}

/* =========================================
   CATALOG DISCOVERY
========================================= */

async function discoverCatalog(queries, maxResults = 60) {
  const collected = [];
  const batchSize = 3;

  for (let i = 0; i < queries.length; i += batchSize) {
    const batch = queries.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map(query => searchTracks(query, 20))
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        collected.push(...result.value);
      }
    }

    const unique = deduplicateTracks(collected);

    if (unique.length >= maxResults) {
      return unique.slice(0, maxResults);
    }
  }

  return deduplicateTracks(collected).slice(0, maxResults);
}

async function loadHomeSection(id, queries, limit = 30, chart = false) {
  const container = $(`#${id}`);
  if (!container) return [];

  const token = requestToken;

  container.innerHTML = `
    <div class="loading-line">
      Mengumpulkan lagu...
    </div>
  `;

  let tracks = [];

  try {
    if (chart) {
      tracks = await getTrendingTracks(limit);
    } else {
      tracks = await discoverCatalog(queries, limit);
    }

    if (
      token !== requestToken ||
      !container.isConnected
    ) {
      return [];
    }

    tracks = deduplicateTracks(tracks);

    container.innerHTML = tracks.length
      ? tracks.map(songRow).join('')
      : `
        <div class="empty-state">
          Belum ada lagu yang tersedia di katalog Audius.
        </div>
      `;

    bindSongButtons();
    return tracks;

  } catch (error) {
    console.warn(`Home section ${id}:`, error);

    if (container.isConnected) {
      container.innerHTML = `
        <div class="empty-state">
          Gagal memuat lagu. Periksa koneksi internet.
        </div>
      `;
    }

    return [];
  }
}

/* =========================================
   HOME CATALOG
========================================= */

async function loadFeatured() {
  const token = ++requestToken;

  const favoriteCount = $('#favoriteCount');

  if (favoriteCount) {
    favoriteCount.textContent =
      `${getFavorites().length} lagu tersimpan`;
  }

  /*
   * Tampilkan setiap kategori secara terpisah.
   * Tidak menunggu semua kategori selesai.
   */
  const jobs = [
    loadHomeSection(
      'indonesiaTrending',
      indonesiaQueries,
      35,
      true
    ),

    loadHomeSection(
      'tiktokTrending',
      tiktokQueries,
      40,
      false
    ),

    loadHomeSection(
      'globalTrending',
      globalQueries,
      35,
      false
    )
  ];

  const results = await Promise.allSettled(jobs);

  if (token !== requestToken) return;

  const allTracks = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allTracks.push(...result.value);
    }
  }

  songs = deduplicateTracks(allTracks);
  queue = songs;
}

/* =========================================
   CATEGORY SEARCH
========================================= */

async function loadCategory(category) {
  const results = $('#searchResults');
  const meta = $('#searchMeta');

  if (!results || !meta) return;

  const token = ++requestToken;

  results.innerHTML = `
    <div class="loading-line">
      Mengumpulkan katalog musik...
    </div>
  `;

  meta.textContent = 'MENGUMPULKAN LAGU';

  const queryMap = {
    indonesia: indonesiaQueries,
    global: globalQueries,
    tiktok: tiktokQueries
  };

  try {
    const tracks = await discoverCatalog(
      queryMap[category] || indonesiaQueries,
      100
    );

    if (
      token !== requestToken ||
      !results.isConnected
    ) {
      return;
    }

    songs = tracks;
    queue = tracks;

    results.innerHTML = tracks.length
      ? tracks.map(songRow).join('')
      : `
        <div class="empty-state">
          Belum ada lagu yang cocok di katalog Audius.
        </div>
      `;

    meta.textContent =
      `${tracks.length} LAGU DITEMUKAN · AUDIUS`;

    bindSongButtons();

  } catch (error) {
    console.warn('Category catalog:', error);

    if (results.isConnected) {
      results.innerHTML = `
        <div class="empty-state">
          Katalog gagal dimuat. Periksa koneksi internet.
        </div>
      `;

      meta.textContent = 'CONNECTION ERROR';
    }
  }
}

/* =========================================
   SEARCH
========================================= */

async function runSearch(query) {
  const results = $('#searchResults');
  const meta = $('#searchMeta');

  if (!results || !meta) return;

  const token = ++requestToken;

  if (!query.trim()) {
    results.innerHTML = `
      <div class="empty-state">
        Ketik judul lagu atau nama artis.
      </div>
    `;

    meta.textContent = 'SEARCH';
    return;
  }

  results.innerHTML = `
    <div class="loading-line">Mencari musik...</div>
  `;

  meta.textContent = 'SEARCHING';

  try {
    const tracks = deduplicateTracks(
      await searchTracks(query, 50)
    );

    if (
      token !== requestToken ||
      !results.isConnected
    ) {
      return;
    }

    songs = tracks;
    queue = tracks;

    results.innerHTML = tracks.length
      ? tracks.map(songRow).join('')
      : `
        <div class="empty-state">
          Tidak ada hasil di katalog Audius.
          Coba pencarian lain.
        </div>
      `;

    meta.textContent =
      `${tracks.length} HASIL DITEMUKAN`;

    bindSongButtons();

  } catch (error) {
    console.warn('Search:', error);

    if (results.isConnected) {
      results.innerHTML = `
        <div class="empty-state">
          Pencarian gagal. Periksa koneksi internet.
        </div>
      `;

      meta.textContent = 'CONNECTION ERROR';
    }
  }
}

/* =========================================
   SONG BUTTONS
========================================= */

function bindSongButtons() {
  document.querySelectorAll('[data-song]').forEach(button => {
    button.onclick = () => {
      const id = button.dataset.song;

      const song = [
        ...songs,
        ...queue,
        ...getFavorites()
      ].find(item => String(item.id) === String(id));

      if (song) playSong(song);
    };
  });
}

/* =========================================
   TOAST
========================================= */

function showToast(message) {
  const toast = $('#toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('visible');

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove('visible');
  }, 2400);
}

/* =========================================
   MINI PLAYER
========================================= */

function updateIsland() {
  const player = $('#miniPlayer');
  const cover = $('#miniCover');
  const title = $('#miniTitle');
  const artist = $('#miniArtist');
  const play = $('#miniPlay');

  if (!player) return;

  if (!currentTrack) {
    player.classList.remove('visible');
    return;
  }

  player.classList.add('visible');

  if (cover) cover.src = currentTrack.cover || '';
  if (title) title.textContent = currentTrack.title;
  if (artist) artist.textContent = currentTrack.artist;

  if (play) {
    play.innerHTML = audio.paused
      ? icon('play')
      : icon('pause');
  }

  player.classList.toggle(
    'is-playing',
    !audio.paused
  );
}

/* =========================================
   ANDROID MEDIA SESSION
========================================= */

function syncMediaSession() {
  try {
    if (
      !currentTrack ||
      !('mediaSession' in navigator)
    ) {
      return;
    }

    if (typeof MediaMetadata !== 'undefined') {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: 'ZORFY',

        artwork: currentTrack.cover
          ? [{
              src: currentTrack.cover,
              sizes: '512x512',
              type: 'image/jpeg'
            }]
          : []
      });
    }

    navigator.mediaSession.playbackState =
      audio.paused ? 'paused' : 'playing';

    if (
      Number.isFinite(audio.duration) &&
      audio.duration > 0 &&
      typeof navigator.mediaSession.setPositionState === 'function'
    ) {
      navigator.mediaSession.setPositionState({
        duration: audio.duration,
        playbackRate: 1,
        position: Math.min(
          audio.currentTime,
          audio.duration
        )
      });
    }

  } catch (error) {
    console.warn('Media Session:', error);
  }
}

function setupMediaSession() {
  try {
    if (!('mediaSession' in navigator)) return;

    const actions = {
      play: () => {
        audio.play().catch(() => {});
      },

      pause: () => {
        audio.pause();
      },

      nexttrack: () => nextSong(),
      previoustrack: () => previousSong(),

      seekto: details => {
        if (
          Number.isFinite(details?.seekTime) &&
          Number.isFinite(audio.duration)
        ) {
          audio.currentTime = Math.max(
            0,
            Math.min(details.seekTime, audio.duration)
          );
        }
      }
    };

    for (const [action, handler] of Object.entries(actions)) {
      try {
        navigator.mediaSession.setActionHandler(
          action,
          handler
        );
      } catch (error) {
        console.warn(`Media action ${action}:`, error);
      }
    }

  } catch (error) {
    console.warn('Media Session unavailable:', error);
  }
}

/* =========================================
   PLAY SONG
========================================= */

async function playSong(song) {
  if (!song?.stream) {
    showToast('Sumber audio tidak tersedia.');
    return;
  }

  currentTrack = song;

  if (!queue.some(item => item.id === song.id)) {
    queue = [song, ...queue];
  }

  lyricsRequestToken++;

  currentLyrics = [];
  currentLyricsMode = 'loading';
  activeLyricIndex = -1;

  try {
    audio.pause();

    audio.src = song.stream;
    audio.load();

    openPlayer();
    updateIsland();
    syncMediaSession();

    loadAutomaticLyrics(song);

    await audio.play();

  } catch (error) {
    console.warn('Audio playback failed:', error);

    showToast(
      'Lagu gagal diputar. Coba lagu lain atau periksa koneksi.'
    );

    updatePlayerUI();
  }
}

/* =========================================
   PLAYER MODAL
========================================= */

function openPlayer() {
  if (!currentTrack) return;

  const song = currentTrack;
  const modal = $('#playerModal');

  if (!modal) return;

  const links = externalSearchLinks(song);

  modal.innerHTML = `
    <div class="player-content">

      <div class="player-topline">
        <button class="close-player"
          id="closePlayer"
          aria-label="Tutup">↓</button>

        <span>NOW PLAYING</span>

        <button class="favorite-button"
          id="favoriteButton"
          aria-label="Favorit">♡</button>
      </div>

      <div class="album-frame">
        <img
          class="large-cover"
          src="${escapeHTML(song.cover)}"
          alt="">
      </div>

      <div class="player-track-info">
        <span class="overline">ZORFY PLAYER</span>
        <h2>${escapeHTML(song.title)}</h2>
        <p>${escapeHTML(song.artist)}</p>
      </div>

      <div class="lyrics-panel" id="lyricsPanel">
        <span class="lyrics-label">LYRICS</span>

        <div id="lyricsLines" class="lyrics-lines">
          <p class="lyrics-empty">Mencari lirik...</p>
        </div>
      </div>

      <section class="lyrics-source-box">
        <button class="lyrics-source-toggle"
          id="lyricsSourceToggle">

          <span>
            <small>SUMBER LIRIK</small>
            <strong id="lyricsSourceCurrent">
              Otomatis · mencoba sumber
            </strong>
          </span>

          <span>⌄</span>
        </button>

        <div class="lyrics-source-list" id="lyricsSourceList">
          <button data-lyrics-source="automatic">
            <span>Otomatis</span>
            <small>LRCLIB → BetterLyrics → Kugou → lrc.red</small>
          </button>

          <button data-lyrics-source="lrclib">
            <span>LRCLIB</span>
            <small>Sinkron per baris atau lirik biasa</small>
          </button>

          <button data-lyrics-source="better">
            <span>BetterLyrics</span>
            <small>TTML jika tersedia</small>
          </button>

          <button data-lyrics-source="kugou">
            <span>Kugou via BetterLyrics</span>
            <small>Sinkron per baris jika tersedia</small>
          </button>

          <button data-lyrics-source="lrc-red">
            <span>lrc.red</span>
            <small>LRC / TTML jika tersedia</small>
          </button>
        </div>
      </section>

      <input
        type="range"
        id="seekBar"
        min="0"
        max="100"
        value="0">

      <div class="player-times">
        <span id="currentTime">0:00</span>
        <span id="totalTime">${formatTime(song.duration)}</span>
      </div>

      <div class="player-controls">
        <button id="shuffleButton" aria-label="Acak">⇄</button>
        <button id="previousButton" aria-label="Sebelumnya">|◀</button>
        <button id="mainPlay" aria-label="Putar">
          ${icon('play')}
        </button>
        <button id="nextButton" aria-label="Berikutnya">▶|</button>
        <button id="repeatButton" aria-label="Ulang">↻</button>
      </div>

      <a class="audius-link"
        href="${escapeHTML(song.permalink)}"
        target="_blank"
        rel="noopener">
        BUKA TRACK DI AUDIUS ↗
      </a>

      <div class="player-service-links">
        <a href="${links.spotify}" target="_blank" rel="noopener">
          SPOTIFY ↗
        </a>

        <a href="${links.youtube}" target="_blank" rel="noopener">
          YOUTUBE MUSIC ↗
        </a>
      </div>

    </div>
  `;

  modal.classList.add('visible');

  bindPlayerEvents();
  renderLyrics();
  updateLyricsSourcePanel();
  updatePlayerUI();
}

/* =========================================
   PLAYER UI
========================================= */

function updatePlayerUI() {
  const main = $('#mainPlay');

  if (main) {
    main.innerHTML = audio.paused
      ? icon('play')
      : icon('pause');
  }

  updateIsland();
  syncMediaSession();
}

function updateLyricsSourcePanel() {
  const current = $('#lyricsSourceCurrent');
  const list = $('#lyricsSourceList');

  const labels = {
    automatic: 'Otomatis',
    lrclib: 'LRCLIB',
    better: 'BetterLyrics',
    kugou: 'Kugou via BetterLyrics',
    'lrc-red': 'lrc.red'
  };

  if (current) {
    const name = labels[activeLyricsProvider] || 'Otomatis';

    current.textContent =
      activeLyricsProvider === 'automatic'
        ? `Otomatis · ${activeLyricsProviderName}`
        : name;
  }

  if (list) {
    list.querySelectorAll('[data-lyrics-source]').forEach(button => {
      button.classList.toggle(
        'selected',
        button.dataset.lyricsSource === activeLyricsProvider
      );
    });
  }
}

function bindPlayerEvents() {
  $('#closePlayer')?.addEventListener('click', () => {
    $('#playerModal')?.classList.remove('visible');
  });

  $('#mainPlay')?.addEventListener('click', togglePlay);
  $('#previousButton')?.addEventListener('click', previousSong);
  $('#nextButton')?.addEventListener('click', nextSong);

  $('#shuffleButton')?.addEventListener('click', event => {
    shuffle = !shuffle;
    event.currentTarget.classList.toggle('selected', shuffle);
  });

  $('#repeatButton')?.addEventListener('click', event => {
    repeat = !repeat;
    event.currentTarget.classList.toggle('selected', repeat);
  });

  const favoriteButton = $('#favoriteButton');

  if (favoriteButton) {
    const isFavorite = getFavorites().some(
      item => item.id === currentTrack?.id
    );

    favoriteButton.textContent = isFavorite ? '♥' : '♡';
    favoriteButton.classList.toggle('selected', isFavorite);

    favoriteButton.onclick = event => {
      const added = toggleFavorite(currentTrack);

      event.currentTarget.textContent = added ? '♥' : '♡';
      event.currentTarget.classList.toggle('selected', added);

      showToast(
        added
          ? 'Ditambahkan ke favorit'
          : 'Dihapus dari favorit'
      );
    };
  }

  const seek = $('#seekBar');

  if (seek) {
    seek.oninput = event => {
      if (
        Number.isFinite(audio.duration) &&
        audio.duration > 0
      ) {
        audio.currentTime =
          audio.duration * Number(event.target.value) / 100;
      }
    };
  }

  const sourceToggle = $('#lyricsSourceToggle');
  const sourceList = $('#lyricsSourceList');

  if (sourceToggle && sourceList) {
    sourceToggle.onclick = () => {
      sourceList.classList.toggle('open');
    };

    sourceList.querySelectorAll('[data-lyrics-source]').forEach(button => {
      button.onclick = () => {
        activeLyricsProvider = button.dataset.lyricsSource;

        try {
          localStorage.setItem(
            LYRICS_PROVIDER_KEY,
            activeLyricsProvider
          );
        } catch {}

        sourceList.classList.remove('open');

        if (currentTrack) {
          loadAutomaticLyrics(
            currentTrack,
            activeLyricsProvider
          );
        }
      };
    });
  }
}

/* =========================================
   PLAYBACK CONTROLS
========================================= */

function togglePlay() {
  if (!audio.src) {
    showToast('Pilih lagu terlebih dahulu.');
    return;
  }

  if (audio.paused) {
    audio.play().catch(error => {
      console.warn('Resume failed:', error);
      showToast('Audio tidak dapat dilanjutkan.');
    });
  } else {
    audio.pause();
  }
}

function nextSong() {
  if (!queue.length) return;

  const currentIndex = queue.findIndex(
    song => song.id === currentTrack?.id
  );

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

  const currentIndex = queue.findIndex(
    song => song.id === currentTrack?.id
  );

  const index =
    (currentIndex - 1 + queue.length) % queue.length;

  playSong(queue[index]);
}

/* =========================================
   LYRICS RENDERING
========================================= */

function renderLyrics() {
  const container = $('#lyricsLines');
  if (!container) return;

  if (currentLyricsMode === 'loading') {
    container.innerHTML = `
      <p class="lyrics-empty">
        Mencari lirik dari beberapa sumber...
      </p>
    `;
    return;
  }

  if (!currentLyrics.length) {
    container.innerHTML = `
      <p class="lyrics-empty">
        Lirik belum ditemukan.
        Lu masih bisa impor file LRC.
      </p>
    `;
    return;
  }

  container.innerHTML = currentLyrics.map(
    (line, index) => `
      <p class="lyric-line" data-lyric="${index}">
        ${escapeHTML(line.text || '♪')}
      </p>
    `
  ).join('');

  if (currentLyricsMode === 'plain') {
    container.insertAdjacentHTML(
      'afterbegin',
      `
        <p class="lyrics-empty">
          Lirik tersedia, tetapi belum tersinkron.
        </p>
      `
    );
  }
}

/* =========================================
   SYNCED LYRICS
========================================= */

function updateLyrics() {
  if (
    currentLyricsMode !== 'synced' ||
    !currentLyrics.length
  ) {
    return;
  }

  let index = -1;

  for (let i = 0; i < currentLyrics.length; i++) {
    if (audio.currentTime >= currentLyrics[i].time) {
      index = i;
    } else {
      break;
    }
  }

  if (index === activeLyricIndex) return;

  activeLyricIndex = index;

  document.querySelectorAll('.lyric-line').forEach((line, i) => {
    line.classList.toggle('active', i === index);
  });

  if (index >= 0) {
    document.querySelector(`[data-lyric="${index}"]`)
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
  }
}

/* =========================================
   LYRICS STATUS
========================================= */

function updateLyricsStatus() {
  const status = $('#lyricsStatus');
  if (!status) return;

  if (!currentTrack) {
    status.textContent = 'Putar lagu terlebih dahulu.';
    return;
  }

  if (currentLyricsMode === 'loading') {
    status.textContent = 'Sedang mencari lirik otomatis...';
  } else if (currentLyricsMode === 'synced') {
    status.textContent =
      `Lirik tersinkron tersedia · ${activeLyricsProviderName}`;
  } else if (currentLyricsMode === 'plain') {
    status.textContent =
      `Lirik tersedia, belum tersinkron · ${activeLyricsProviderName}`;
  } else {
    status.textContent =
      `Lirik belum ditemukan untuk: ${currentTrack.title}`;
  }
}

/* =========================================
   IMPORT LRC
========================================= */

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

    lyricsRequestToken++;

    const map = getLyricsMap();
    map[currentTrack.id] = parsed;

    safeStorageSet(LYRICS_KEY, map);

    currentLyrics = parsed;
    currentLyricsMode = 'synced';
    activeLyricsProviderName = 'File LRC';
    activeLyricIndex = -1;

    renderLyrics();
    updateLyricsStatus();
    updateLyricsSourcePanel();

    showToast('Lirik LRC berhasil dimuat.');
  };

  reader.onerror = () => {
    showToast('File lirik gagal dibaca.');
  };

  reader.readAsText(file);
}

/* =========================================
   PAGE EVENTS
========================================= */

function bindPageEvents() {
  bindSongButtons();

  const search = $('#searchInput');

  if (search) {
    search.addEventListener('input', () => {
      clearTimeout(searchTimer);

      const query = search.value.trim();

      searchTimer = setTimeout(() => {
        runSearch(query);
      }, 450);
    });
  }

  document.querySelectorAll('[data-category]').forEach(button => {
    button.onclick = () => {
      document.querySelectorAll('[data-category]').forEach(item => {
        item.classList.toggle(
          'selected',
          item === button
        );
      });

      loadCategory(button.dataset.category);
    };
  });

  $('#openLibrary')?.addEventListener('click', () => {
    navigate('library');
  });

  const upload = $('#lyricsUpload');

  if (upload) {
    upload.onchange = () => {
      importLyrics(upload.files?.[0]);
      upload.value = '';
    };
  }

  $('#openSpotify')?.addEventListener('click', () => {
    if (!currentTrack) {
      showToast('Putar atau pilih lagu terlebih dahulu.');
      return;
    }

    window.open(
      externalSearchLinks(currentTrack).spotify,
      '_blank',
      'noopener'
    );
  });

  $('#openYouTubeMusic')?.addEventListener('click', () => {
    if (!currentTrack) {
      showToast('Putar atau pilih lagu terlebih dahulu.');
      return;
    }

    window.open(
      externalSearchLinks(currentTrack).youtube,
      '_blank',
      'noopener'
    );
  });
}

/* =========================================
   APP INITIALIZATION
========================================= */

if (!app) {
  throw new Error(
    'Elemen #app tidak ditemukan di index.html'
  );
}

app.innerHTML = shell(homePage());

document.querySelectorAll(
  '.bottom-nav [data-page]'
).forEach(button => {
  button.addEventListener('click', () => {
    navigate(button.dataset.page);
  });
});

$('#brandHome')?.addEventListener('click', event => {
  event.preventDefault();
  navigate('home');
});

$('#miniPlayerOpen')?.addEventListener('click', () => {
  if (currentTrack) openPlayer();
});

$('#miniPlay')?.addEventListener('click', event => {
  event.stopPropagation();
  togglePlay();
});

/* =========================================
   AUDIO EVENTS
========================================= */

audio.addEventListener('timeupdate', () => {
  const seek = $('#seekBar');

  if (
    seek &&
    Number.isFinite(audio.duration) &&
    audio.duration > 0
  ) {
    seek.value = String(
      audio.currentTime / audio.duration * 100
    );

    const current = $('#currentTime');

    if (current) {
      current.textContent = formatTime(audio.currentTime);
    }
  }

  updateLyrics();
  syncMediaSession();
});

audio.addEventListener('loadedmetadata', () => {
  const total = $('#totalTime');

  if (total) {
    total.textContent = formatTime(audio.duration);
  }

  syncMediaSession();
});

audio.addEventListener('play', updatePlayerUI);
audio.addEventListener('pause', updatePlayerUI);

audio.addEventListener('error', () => {
  showToast(
    'Sumber audio gagal dimuat. Pilih lagu lain.'
  );

  updatePlayerUI();
});

audio.addEventListener('ended', () => {
  if (repeat) {
    audio.currentTime = 0;

    audio.play().catch(error => {
      console.warn('Repeat failed:', error);
    });
  } else {
    nextSong();
  }
});

/* =========================================
   START
========================================= */

setupMediaSession();
bindPageEvents();
loadFeatured();
