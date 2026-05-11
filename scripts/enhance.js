// enhance.js — theme toggle, reveal-on-scroll, drop-cap on first paragraph
(function () {
  const KEY = 'mis-theme';
  const html = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      try {
        localStorage.setItem(KEY, next);
      } catch {}
    });
  }

  // Reveal on scroll — reveals elements as they approach the viewport.
  // Anything already in (or near) the viewport on first paint reveals
  // immediately so we never ship a fold full of invisible content.
  const all = document.querySelectorAll('.reveal');
  const reveal = (el) => el.classList.add('in');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            reveal(e.target);
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px 25% 0px', threshold: 0 },
    );
    const vh = window.innerHeight || 800;
    all.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < vh * 1.1) reveal(el);
      else io.observe(el);
    });
  } else {
    all.forEach(reveal);
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
  document
    .querySelectorAll('.read-column a[href^="http"], .topic-body a[href^="http"]')
    .forEach((a) => {
      try {
        const u = new URL(a.href);
        if (u.origin !== location.origin) {
          a.classList.add('ext-link');
          a.setAttribute('rel', 'noopener noreferrer');
          if (!a.querySelector('.ext-arrow')) {
            a.insertAdjacentHTML(
              'beforeend',
              '<span class="ext-arrow" aria-hidden="true">↗</span>',
            );
          }
        }
      } catch {}
    });

  // Anchor-link copy on heading click
  document.querySelectorAll('.anchor-link').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const id = a.getAttribute('href');
      const target = document.querySelector(id);
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth' });
      try {
        history.replaceState(null, '', id);
      } catch {}
    });
  });

  // Timeline enhancements — spine progress, active anchor, card reveal.
  const tlPage = document.querySelector('.tl-page--vertical');
  if (tlPage) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Card reveal-on-scroll
    const cards = tlPage.querySelectorAll('.tl-card--reveal');
    if ('IntersectionObserver' in window && !reduceMotion) {
      const cardIO = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              e.target.classList.add('is-in');
              cardIO.unobserve(e.target);
            }
          }
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
      );
      const vh = window.innerHeight || 800;
      cards.forEach((c) => {
        const r = c.getBoundingClientRect();
        if (r.top < vh * 1.05) c.classList.add('is-in');
        else cardIO.observe(c);
      });
    } else {
      cards.forEach((c) => c.classList.add('is-in'));
    }

    // Active anchor — highlight the era currently in view
    const eras = Array.from(tlPage.querySelectorAll('.tl-era[data-era]'));
    const anchors = new Map(
      Array.from(tlPage.querySelectorAll('.tl-anchor[data-era]')).map((a) => [
        a.getAttribute('data-era'),
        a,
      ]),
    );
    if ('IntersectionObserver' in window && eras.length > 0) {
      const visible = new Set();
      const setActive = (id) => {
        anchors.forEach((a, key) => a.classList.toggle('is-active', key === id));
      };
      const eraIO = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            const id = e.target.getAttribute('data-era');
            if (e.isIntersecting) visible.add(id);
            else visible.delete(id);
          }
          // Pick the deepest visible era (largest index in original order)
          // so the active marker reflects how far the reader has traveled.
          let bestId = null;
          let bestIdx = -1;
          for (const id of visible) {
            const idx = eras.findIndex((s) => s.getAttribute('data-era') === id);
            if (idx > bestIdx) {
              bestIdx = idx;
              bestId = id;
            }
          }
          if (bestId) setActive(bestId);
        },
        {
          rootMargin: `-${(parseInt(getComputedStyle(document.documentElement).getPropertyValue('--topnav-h')) || 64) + 24}px 0px -55% 0px`,
          threshold: 0,
        },
      );
      eras.forEach((s) => eraIO.observe(s));
      const initial = tlPage.getAttribute('data-first-era');
      if (initial) setActive(initial);
    }

    // Spine progress — fills as the user scrolls through the river
    const spineFill = tlPage.querySelector('.tl-spine-fill');
    const river = tlPage.querySelector('.tl-river');
    if (spineFill && river && !reduceMotion) {
      let raf = 0;
      const update = () => {
        raf = 0;
        const rect = river.getBoundingClientRect();
        const vh = window.innerHeight || 800;
        const total = rect.height;
        if (total <= 0) {
          spineFill.style.setProperty('--tl-progress', '0%');
          return;
        }
        // Progress = how far the viewport midpoint has traveled through the river
        const mid = vh * 0.5;
        const traveled = mid - rect.top;
        const pct = Math.max(0, Math.min(100, (traveled / total) * 100));
        spineFill.style.setProperty('--tl-progress', pct.toFixed(2) + '%');
      };
      const onScroll = () => {
        if (raf) return;
        raf = requestAnimationFrame(update);
      };
      update();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
    }
  }
})();
