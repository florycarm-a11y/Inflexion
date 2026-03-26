/**
 * Scroll Reveal — Fade-in au scroll via Intersection Observer
 * Auto-initialisé, injecte son propre CSS
 * Supporte le rendu React (MutationObserver + polling)
 */
(function () {
  if (typeof IntersectionObserver === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var style = document.createElement('style');
  style.textContent =
    '.sr-hidden{opacity:0;transform:translateY(20px);transition:none}' +
    '.sr-visible{animation:sr-fade-up .6s ease-out forwards}' +
    '@keyframes sr-fade-up{to{opacity:1;transform:translateY(0)}}';
  document.head.appendChild(style);

  var SELECTORS = 'section,.sidebar-card,.sidebar-block,.featured-analysis-card,' +
    '.rubrique-featured-analysis,.article-du-jour-section,[role="tabpanel"],.footer-section';

  var scrollObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.remove('sr-hidden');
        entry.target.classList.add('sr-visible');
        scrollObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  function scan() {
    document.querySelectorAll(SELECTORS).forEach(function (el) {
      if (el.classList.contains('sr-hidden') || el.classList.contains('sr-visible')) return;
      if (el.closest('nav, header, .bronze-bar')) return;
      if (el.classList.contains('hero-dark') || el.classList.contains('hero-section')) return;
      var rect = el.getBoundingClientRect();
      if (rect.height === 0) return;
      if (rect.top >= 0 && rect.top < window.innerHeight) return;
      el.classList.add('sr-hidden');
      scrollObserver.observe(el);
    });
  }

  function init() {
    // Polling pour attendre le rendu React
    var attempts = 0;
    var timer = setInterval(function () {
      scan();
      if (++attempts >= 15) clearInterval(timer);
    }, 150);

    new MutationObserver(function () {
      requestAnimationFrame(scan);
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
