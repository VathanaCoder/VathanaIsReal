(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Loader + page fade-in */
  var loader = $('#loader');
  var started = false;
  function start() {
    if (started) return;
    started = true;
    document.body.classList.add('ready');
    setTimeout(function () { loader.classList.add('done'); }, reduce ? 0 : 700);
  }
  window.addEventListener('load', start);
  setTimeout(start, 2500);

  /* Mobile menu */
  var burger = $('#burger'), menu = $('#menu'), nav = $('#nav');
  function setMenu(open) {
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) nav.classList.add('solid'); else onScroll();
  }
  burger.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  window.addEventListener('resize', function () { if (window.innerWidth >= 860) setMenu(false); });

  /* Scroll state: solid nav + back to top */
  var top = $('#top');
  function onScroll() {
    var y = window.scrollY;
    if (!menu.classList.contains('open')) nav.classList.toggle('solid', y > 20);
    top.classList.toggle('show', y > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

  /* Scroll reveal + active nav link */
  if ('IntersectionObserver' in window) {
    var ro = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('show'); ro.unobserve(e.target); } });
    }, { threshold: 0.12 });
    $$('.rv').forEach(function (el) { ro.observe(el); });

    var links = $$('.menu a');
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) links.forEach(function (l) { l.classList.toggle('on', l.dataset.s === e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(function (s) { so.observe(s); });
  } else {
    $$('.rv').forEach(function (el) { el.classList.add('show'); });
  }

  /* Project visuals: generated isometric tile grids (no fake screenshots) */
  $$('.vis').forEach(function (v) {
    var n = +v.dataset.n, seed = +v.dataset.seed;
    var g = document.createElement('div');
    g.className = 'grid';
    g.style.gridTemplateColumns = 'repeat(' + n + ',1fr)';
    for (var i = 0; i < n * n; i++) {
      var t = document.createElement('div');
      var r = Math.abs(Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453) % 1;
      t.className = 't';
      t.style.setProperty('--h', Math.round(r * 46) + 'px');
      t.style.setProperty('--o', (0.55 + r * 0.45).toFixed(2));
      g.appendChild(t);
    }
    v.appendChild(g);
  });

  /* Pointer tilt on project previews and hero scene (fine pointers only) */
  if (!reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('[data-tilt]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var b = el.getBoundingClientRect();
        var x = (e.clientX - b.left) / b.width - 0.5, y = (e.clientY - b.top) / b.height - 0.5;
        el.style.transform = 'perspective(1000px) rotateY(' + (x * 10) + 'deg) rotateX(' + (-y * 10) + 'deg)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
    var sc = $('#scene');
    window.addEventListener('pointermove', function (e) {
      var x = e.clientX / window.innerWidth - 0.5, y = e.clientY / window.innerHeight - 0.5;
      sc.style.transform = 'rotateY(' + (x * 12) + 'deg) rotateX(' + (-y * 12) + 'deg)';
    }, { passive: true });
  }

  /* Discord: copy username */
  var d = $('#discord'), dt = $('#dtxt');
  d.addEventListener('click', function () {
    var name = d.dataset.copy;
    function ok() { dt.textContent = 'Copied: ' + name; setTimeout(reset, 2000); }
    function fail() { dt.textContent = 'Username: ' + name; setTimeout(reset, 3000); }
    function reset() { dt.textContent = '@' + name + ' · tap to copy'; }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(name).then(ok, fail);
    } else {
      try {
        var ta = document.createElement('textarea');
        ta.value = name; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        var done = document.execCommand('copy');
        document.body.removeChild(ta);
        done ? ok() : fail();
      } catch (err) { fail(); }
    }
  });

  /* Background particles (light, pauses when tab hidden) */
  var cv = $('#fx');
  if (!reduce && cv.getContext) {
    var cx = cv.getContext('2d'), W, H, ps = [], raf;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    function size() {
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.min(44, Math.round(W * H / 22000));
      ps = [];
      for (var i = 0; i < count; i++) ps.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.6 + 0.4, v: Math.random() * 0.25 + 0.05, a: Math.random() * 0.5 + 0.2 });
    }
    function draw() {
      cx.clearRect(0, 0, W, H);
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i];
        p.y -= p.v;
        if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
        cx.beginPath();
        cx.fillStyle = 'rgba(114,212,255,' + p.a + ')';
        cx.arc(p.x, p.y, p.r, 0, 6.2832);
        cx.fill();
      }
      raf = requestAnimationFrame(draw);
    }
    size();
    draw();
    window.addEventListener('resize', size);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) cancelAnimationFrame(raf); else draw();
    });
  }
})();
