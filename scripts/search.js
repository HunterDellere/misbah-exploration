// search.js — Cmd-K palette over data/search.json
(function () {
  const dialog = document.getElementById('search-palette');
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  if (!dialog || !input || !results) return;

  const base = window.__MISBAH_BASE__ || '';
  let items = [];
  let active = -1;
  let lastResults = [];

  async function loadIndex() {
    if (items.length) return;
    try {
      const r = await fetch(base + 'data/search.json');
      items = await r.json();
    } catch (e) { console.warn('search index load failed', e); }
  }

  function score(item, q) {
    if (!q) return 0;
    const ql = q.toLowerCase();
    const t = (item.title || '').toLowerCase();
    const s = (item.summary || '').toLowerCase();
    const tags = (item.tags || []).join(' ').toLowerCase();
    const place = (item.place || '').toLowerCase();
    let sc = 0;
    if (t.startsWith(ql)) sc += 100;
    if (t.includes(ql)) sc += 60;
    if (s.includes(ql)) sc += 25;
    if (tags.includes(ql)) sc += 35;
    if (place.includes(ql)) sc += 20;
    // word-boundary boosts
    if (new RegExp('\\b' + escapeRegex(ql)).test(t)) sc += 15;
    return sc;
  }
  function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function fmtKind(it) {
    if (it.kind === 'pillar') return 'Pillar';
    return (it.pillar ? cap(it.pillar) : 'Topic');
  }
  function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : ''; }

  function highlight(text, q) {
    if (!q) return escapeHtml(text);
    const re = new RegExp('(' + escapeRegex(q) + ')', 'ig');
    return escapeHtml(text).replace(re, '<mark>$1</mark>');
  }
  function escapeHtml(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function render(q) {
    const matches = q
      ? items.map(it => ({ it, sc: score(it, q) })).filter(x => x.sc > 0).sort((a, b) => b.sc - a.sc).slice(0, 12)
      : items.slice(0, 8).map(it => ({ it, sc: 0 }));
    lastResults = matches.map(m => m.it);

    if (!matches.length) {
      results.innerHTML = `<div class="search-empty">No matches for <em>${escapeHtml(q)}</em>. Try a tag or place.</div>`;
      active = -1;
      return;
    }
    results.innerHTML = matches.map((m, i) => {
      const it = m.it;
      const tagsHtml = (it.tags || []).slice(0, 3).map(t => `<span class="search-tag">${escapeHtml(t)}</span>`).join('');
      return `<a class="search-result" data-i="${i}" href="${base}${it.url}" role="option" aria-selected="${i === 0 ? 'true' : 'false'}">
        <div class="search-result-main">
          <div class="search-result-title">${highlight(it.title, q)}</div>
          <div class="search-result-summary">${highlight((it.summary || '').slice(0, 140), q)}</div>
        </div>
        <div class="search-result-meta">
          <div class="search-result-kind">${fmtKind(it)}</div>
          <div class="search-result-tags">${tagsHtml}</div>
        </div>
      </a>`;
    }).join('');
    active = 0;
    setActive(0);
  }

  function setActive(i) {
    const els = results.querySelectorAll('.search-result');
    if (!els.length) return;
    if (i < 0) i = els.length - 1;
    if (i >= els.length) i = 0;
    active = i;
    els.forEach((el, idx) => {
      const sel = idx === i;
      el.setAttribute('aria-selected', sel ? 'true' : 'false');
      if (sel) el.scrollIntoView({ block: 'nearest' });
    });
  }

  function open() {
    if (typeof dialog.showModal === 'function') {
      try { dialog.showModal(); } catch (e) { dialog.setAttribute('open', ''); }
    } else { dialog.setAttribute('open', ''); }
    loadIndex().then(() => render(input.value));
    setTimeout(() => input.focus(), 0);
    document.body.style.overflow = 'hidden';
  }
  function close() {
    if (typeof dialog.close === 'function') { try { dialog.close(); } catch (e) { dialog.removeAttribute('open'); } }
    else dialog.removeAttribute('open');
    document.body.style.overflow = '';
  }

  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      dialog.hasAttribute('open') ? close() : open();
      return;
    }
    if (e.key === '/' && !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName) && !dialog.hasAttribute('open')) {
      e.preventDefault();
      open();
    }
  });

  dialog.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    if (e.key === 'Enter') {
      e.preventDefault();
      const target = lastResults[active];
      if (target) location.href = base + target.url;
    }
  });

  dialog.addEventListener('click', e => {
    if (e.target === dialog) close();
  });

  input.addEventListener('input', () => render(input.value.trim()));

  document.querySelectorAll('[data-search-trigger]').forEach(el => {
    el.addEventListener('click', e => { e.preventDefault(); open(); });
  });
})();
