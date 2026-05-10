// enhance.js — theme toggle, reveal-on-scroll, drop-cap on first paragraph
(function () {
  const KEY = 'mis-theme';
  const html = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      try { localStorage.setItem(KEY, next); } catch (e) {}
    });
  }

  // Reveal on scroll
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
  }

  // Drop-cap on first body paragraph of topic pages
  const article = document.querySelector('.read-column');
  if (article) {
    const firstP = article.querySelector(':scope > p');
    if (firstP && firstP.textContent.length > 40 && !firstP.classList.contains('read-meta')) {
      firstP.classList.add('drop-cap');
    }
  }

  // External link affordance — add ↗ to body links pointing off-domain
  document.querySelectorAll('.read-column a[href^="http"], .topic-body a[href^="http"]').forEach(a => {
    try {
      const u = new URL(a.href);
      if (u.origin !== location.origin) {
        a.classList.add('ext-link');
        a.setAttribute('rel', 'noopener noreferrer');
        if (!a.querySelector('.ext-arrow')) {
          a.insertAdjacentHTML('beforeend', '<span class="ext-arrow" aria-hidden="true">↗</span>');
        }
      }
    } catch (e) {}
  });

  // Anchor-link copy on heading click
  document.querySelectorAll('.anchor-link').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const id = a.getAttribute('href');
      const target = document.querySelector(id);
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth' });
      try { history.replaceState(null, '', id); } catch (e) {}
    });
  });
})();
