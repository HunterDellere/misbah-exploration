// toc.js — scroll-spy for the on-page TOC + reading-progress bar
(function () {
  const tocLinks = document.querySelectorAll('.toc-list a[data-toc-target]');
  const progressBar = document.querySelector('.reading-progress-bar');

  if (tocLinks.length) {
    const targets = [...tocLinks].map(a => ({
      link: a,
      target: document.getElementById(a.dataset.tocTarget),
    })).filter(x => x.target);

    const obs = new IntersectionObserver(entries => {
      // Update active TOC link to topmost intersecting heading
      let bestY = Infinity, best = null;
      for (const { link, target } of targets) {
        const r = target.getBoundingClientRect();
        if (r.top < 120 && r.top > -window.innerHeight && r.top < bestY) {
          bestY = r.top; best = link;
        }
      }
      if (best) {
        tocLinks.forEach(a => a.classList.toggle('is-active', a === best));
      }
    }, { rootMargin: '-100px 0px -65% 0px', threshold: [0, 1] });
    targets.forEach(({ target }) => obs.observe(target));

    // initial
    setTimeout(() => {
      tocLinks.forEach((a, i) => a.classList.toggle('is-active', i === 0));
    }, 0);
  }

  if (progressBar) {
    const article = document.querySelector('.read-column');
    if (article) {
      const update = () => {
        const r = article.getBoundingClientRect();
        const total = r.height - window.innerHeight;
        const seen = Math.min(Math.max(-r.top, 0), Math.max(total, 1));
        const pct = total > 0 ? (seen / total) * 100 : 0;
        progressBar.style.transform = `scaleX(${pct / 100})`;
      };
      update();
      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
    }
  }
})();
