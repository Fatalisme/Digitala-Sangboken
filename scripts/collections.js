// Lightweight playlist builder that fetches data/lesongs.json
(async function () {
  const SONGS_URL = 'data/lesongs.json';
  const resultsEl = document.getElementById('song-results');
  const searchEl = document.getElementById('selector-search');
  const playlistEl = document.getElementById('playlist');
  const clearBtn = document.getElementById('clear-playlist');
  const exportBtn = document.getElementById('export-print');
  const shareBtn = document.getElementById('share-playlist');
  const shareArea = document.getElementById('share-area');
  const shareUrlInput = document.getElementById('share-url');
  const copyShareBtn = document.getElementById('copy-share-url');

  let allSongs = [];
  let playlist = JSON.parse(localStorage.getItem('savedPlaylist') || '[]');

  // UTF-8 safe base64 helpers
  function base64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
      (match, p1) => String.fromCharCode('0x' + p1)));
  }
  function base64DecodeUnicode(str) {
    return decodeURIComponent(Array.prototype.map.call(atob(str), c =>
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
  }
  function encodePlaylist(p) {
    try { return base64EncodeUnicode(JSON.stringify(p)); } catch { return ''; }
  }
  function decodePlaylistParam(s) {
    try { return JSON.parse(base64DecodeUnicode(s)); } catch { return null; }
  }

  // Load playlist from URL param if present
  (function loadFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('playlist')) return;
    const decoded = decodePlaylistParam(params.get('playlist'));
    if (Array.isArray(decoded) && decoded.length) {
      playlist = decoded;
      renderPlaylist();
      saveLocal();
      shareArea.style.display = 'block';
      shareUrlInput.value = location.href;
    }
  })();

  async function loadSongs() {
    try {
      const res = await fetch(SONGS_URL);
      allSongs = await res.json();
      renderResults(allSongs.map((s, i) => ({ s, i })));
      renderPlaylist();
    } catch (err) {
      resultsEl.innerHTML = '<p>Kunde inte ladda sånger.</p>';
      console.error(err);
    }
  }

  // renderResults expects items: [{ s: song, i: originalIndex }, ...]
  function renderResults(items) {
    if (!items || !items.length) {
      resultsEl.innerHTML = '<p>Inga sånger hittades.</p>';
      return;
    }
    resultsEl.innerHTML = items.map(({ s, i }) => `
      <div class="song-result" data-id="${i}">
        <div>
          <h4>${escapeHtml(s.title || 'Untitled')}</h4>
          <div class="small">${escapeHtml(s.author || '')}</div>
          <div class="category-tag">${escapeHtml(s.category || '')}</div>
        </div>
        <div>
          <button data-id="${i}" class="add-btn">Lägg till</button>
        </div>
      </div>
    `).join('');
    resultsEl.querySelectorAll('.add-btn').forEach(b => b.addEventListener('click', (e) => {
      const id = Number(e.currentTarget.dataset.id);
      addToPlaylist(allSongs[id]);
    }));
  }

  function addToPlaylist(song) {
    if (!song) return;
    const exists = playlist.find(s => (s.title === song.title && s.author === song.author));
    if (exists) return;
    playlist.push(song);
    renderPlaylist();
    saveLocal();
  }

  function renderPlaylist() {
    if (!playlist.length) {
      playlistEl.innerHTML = '<li>Inget i listan ännu. Lägg till sånger från vänster.</li>';
      return;
    }
    playlistEl.innerHTML = playlist.map((s, i) => `
      <li class="playlist-item" draggable="true" data-index="${i}">
        <div class="handle">≡</div>
        <div class="item-meta">
          <strong>${escapeHtml(s.title)}</strong>
          <div class="small">${escapeHtml(s.author || '')} — ${escapeHtml(s.category || '')}</div>
        </div>
        <div class="item-actions">
          <button class="up" data-i="${i}">▲</button>
          <button class="down" data-i="${i}">▼</button>
          <button class="remove" data-i="${i}">Ta bort</button>
        </div>
      </li>
    `).join('');
    attachPlaylistEvents();
  }

  function attachPlaylistEvents() {
    playlistEl.querySelectorAll('.remove').forEach(b => b.addEventListener('click', e => {
      const i = Number(e.currentTarget.dataset.i);
      playlist.splice(i, 1);
      renderPlaylist(); saveLocal();
    }));
    playlistEl.querySelectorAll('.up').forEach(b => b.addEventListener('click', e => {
      const i = Number(e.currentTarget.dataset.i);
      if (i <= 0) return;
      swap(i, i - 1); renderPlaylist(); saveLocal();
    }));
    playlistEl.querySelectorAll('.down').forEach(b => b.addEventListener('click', e => {
      const i = Number(e.currentTarget.dataset.i);
      if (i >= playlist.length - 1) return;
      swap(i, i + 1); renderPlaylist(); saveLocal();
    }));

    // Drag & drop
    let dragSrcIndex = null;
    playlistEl.querySelectorAll('.playlist-item').forEach(item => {
      item.addEventListener('dragstart', (e) => {
        dragSrcIndex = Number(item.dataset.index);
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      item.addEventListener('dragend', () => {
        playlistEl.querySelectorAll('.playlist-item').forEach(i => i.classList.remove('dragging'));
      });
      item.addEventListener('dragover', (e) => { e.preventDefault(); });
      item.addEventListener('drop', (e) => {
        e.preventDefault();
        const destIndex = Number(item.dataset.index);
        if (dragSrcIndex === null || destIndex === dragSrcIndex) return;
        const moved = playlist.splice(dragSrcIndex, 1)[0];
        playlist.splice(destIndex, 0, moved);
        renderPlaylist(); saveLocal();
      });
    });
  }

  function swap(a, b) { [playlist[a], playlist[b]] = [playlist[b], playlist[a]]; }
  function saveLocal() { localStorage.setItem('savedPlaylist', JSON.stringify(playlist)); }

  clearBtn.addEventListener('click', () => { playlist = []; renderPlaylist(); saveLocal(); });

  exportBtn.addEventListener('click', () => {
    if (!playlist.length) { alert('Inget att exportera.'); return; }
    const printable = playlist.map(s => `
      <div class="song-block">
        <h2>${escapeHtml(s.title)}</h2>
        <h4>${escapeHtml(s.melody || '')} — ${escapeHtml(s.author || '')}</h4>
        <pre>${escapeHtml(s.lyrics || '')}</pre>
      </div>
      <hr/>
    `).join('');
    const html = `
      <html><head><title>Sånghäfte</title>
      <style>body{font-family: Arial; padding:20px} pre{white-space:pre-wrap}</style>
      </head><body>
      <h1>Sånghäfte</h1>
      ${printable}
      </body></html>
    `;
    const w = window.open('', '_blank');
    w.document.open(); w.document.write(html); w.document.close(); w.print();
  });

  // Share: create URL with encoded playlist
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      if (!playlist.length) { alert('Inget att dela.'); return; }
      const encoded = encodePlaylist(playlist);
      if (!encoded) { alert('Kunde inte skapa länk.'); return; }
      const url = `${location.origin}${location.pathname}?playlist=${encodeURIComponent(encoded)}`;
      shareArea.style.display = 'block';
      shareUrlInput.value = url;
      try { navigator.clipboard.writeText(url); alert('Länk kopierad till urklipp.'); } catch (e) { /* silent fallback */ }
      history.replaceState(null, '', `?playlist=${encodeURIComponent(encoded)}`);
    });
  }
  if (copyShareBtn) {
    copyShareBtn.addEventListener('click', () => {
      if (!shareUrlInput.value) return;
      navigator.clipboard.writeText(shareUrlInput.value).then(() => alert('Länk kopierad till urklipp.'));
    });
  }

  // Search — produce items with original indices so add-btn maps correctly
  searchEl.addEventListener('input', () => {
    const q = searchEl.value.trim().toLowerCase();
    const filtered = allSongs
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => {
        return (s.title || '').toLowerCase().includes(q)
          || (s.author || '').toLowerCase().includes(q)
          || (s.lyrics || '').toLowerCase().includes(q)
          || (s.category || '').toLowerCase().includes(q);
      });
    renderResults(filtered);
  });

  function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  await loadSongs();
})();