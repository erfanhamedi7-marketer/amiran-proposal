/* ============================================================
   AMIRAN proposal deck — navigation & stage scaling
   ============================================================ */
(function () {
  'use strict';

  var deck = document.getElementById('deck');
  var slides = Array.prototype.slice.call(deck.querySelectorAll('.slide'));
  var total = slides.length;
  var index = 0;

  var bar = document.getElementById('bar');
  var counter = document.getElementById('counter');
  var overview = document.getElementById('overview');
  var ovGrid = document.getElementById('ovGrid');
  var hint = document.getElementById('hint');

  /* ---------- Persian numerals ---------- */
  var FA = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  function fa(n) {
    return String(n).replace(/\d/g, function (d) { return FA[+d]; });
  }
  function pad(n) { return n < 10 ? '0' + n : String(n); }

  /* ---------- Stage scaling (keeps slides pixel-perfect) ---------- */
  var BASE_W = 1280, BASE_H = 720;
  function fit() {
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var scale = Math.min(vw / BASE_W, vh / BASE_H);
    // leave a small breathing margin on large screens
    scale = scale * (vw > 900 ? 0.955 : 0.98);
    deck.style.transform = 'scale(' + scale + ')';
  }
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', fit);
  fit();

  /* ---------- Render footer slide numbers ---------- */
  slides.forEach(function (s, i) {
    var num = s.querySelector('.s-foot .num');
    if (num) num.textContent = fa(pad(i + 1)) + ' / ' + fa(total);
  });

  /* ---------- Show a slide ---------- */
  function show(i, opts) {
    opts = opts || {};
    if (i < 0) i = 0;
    if (i > total - 1) i = total - 1;
    if (i === index && !opts.force) return;

    var current = slides[index];
    index = i;

    slides.forEach(function (s) { s.classList.remove('is-active'); });

    // restart entrance animations
    var target = slides[index];
    var animated = target.querySelectorAll('[data-anim]');
    Array.prototype.forEach.call(animated, function (el) {
      el.style.animation = 'none';
      /* force reflow so the animation replays */
      void el.offsetWidth;
      el.style.animation = '';
    });

    target.classList.add('is-active');
    if (current !== target) { /* noop, kept for clarity */ }

    bar.style.width = (total > 1 ? (index / (total - 1)) * 100 : 100) + '%';
    counter.textContent = fa(pad(index + 1)) + ' / ' + fa(total);

    if (location.hash !== '#' + (index + 1)) {
      history.replaceState(null, '', '#' + (index + 1));
    }
    syncOverview();
  }

  function next() { show(index + 1); }
  function prev() { show(index - 1); }

  /* ---------- Overview grid ---------- */
  slides.forEach(function (s, i) {
    var btn = document.createElement('button');
    btn.className = 'ov-item';
    btn.innerHTML =
      '<span class="n">' + fa(pad(i + 1)) + '</span>' +
      '<span class="t">' + (s.getAttribute('data-title') || '') + '</span>';
    btn.addEventListener('click', function () {
      closeOverview();
      show(i);
    });
    ovGrid.appendChild(btn);
  });

  function syncOverview() {
    Array.prototype.forEach.call(ovGrid.children, function (el, i) {
      el.classList.toggle('current', i === index);
    });
  }

  function openOverview() { overview.classList.add('open'); syncOverview(); }
  function closeOverview() { overview.classList.remove('open'); }
  function toggleOverview() {
    overview.classList.contains('open') ? closeOverview() : openOverview();
  }

  /* ---------- Fullscreen ---------- */
  function toggleFullscreen() {
    var el = document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
    } else {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    }
  }

  /* ---------- Controls ---------- */
  document.getElementById('next').addEventListener('click', next);
  document.getElementById('prev').addEventListener('click', prev);
  document.getElementById('grid').addEventListener('click', toggleOverview);
  document.getElementById('full').addEventListener('click', toggleFullscreen);

  /* In an RTL deck, ArrowLeft moves forward (reading direction). */
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key;

    if (k === 'Escape') { closeOverview(); return; }

    if (k === 'ArrowLeft' || k === 'PageDown' || k === ' ' || k === 'Spacebar' || k === 'Enter') {
      e.preventDefault(); next();
    } else if (k === 'ArrowRight' || k === 'PageUp' || k === 'Backspace') {
      e.preventDefault(); prev();
    } else if (k === 'ArrowDown') {
      e.preventDefault(); next();
    } else if (k === 'ArrowUp') {
      e.preventDefault(); prev();
    } else if (k === 'Home') {
      e.preventDefault(); show(0);
    } else if (k === 'End') {
      e.preventDefault(); show(total - 1);
    } else if (k === 'f' || k === 'F') {
      e.preventDefault(); toggleFullscreen();
    } else if (k === 'o' || k === 'O') {
      e.preventDefault(); toggleOverview();
    } else if (k === 'p' || k === 'P') {
      e.preventDefault(); window.print();
    } else if (/^[0-9]$/.test(k)) {
      var n = k === '0' ? 10 : parseInt(k, 10);
      if (n <= total) show(n - 1);
    }
  });

  /* ---------- Touch / swipe ---------- */
  var tx = 0, ty = 0, tt = 0;
  document.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) return;
    tx = e.touches[0].clientX;
    ty = e.touches[0].clientY;
    tt = Date.now();
  }, { passive: true });

  document.addEventListener('touchend', function (e) {
    if (!e.changedTouches.length) return;
    var dx = e.changedTouches[0].clientX - tx;
    var dy = e.changedTouches[0].clientY - ty;
    if (Date.now() - tt > 700) return;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
    /* RTL: swipe right-to-left (dx < 0) = next */
    dx < 0 ? next() : prev();
  }, { passive: true });

  /* ---------- Show nav on mouse move ---------- */
  var navTimer;
  document.addEventListener('mousemove', function () {
    document.body.classList.add('nav-show');
    clearTimeout(navTimer);
    navTimer = setTimeout(function () {
      document.body.classList.remove('nav-show');
    }, 2200);
  });

  /* ---------- Deep link (#3) ---------- */
  function fromHash() {
    var n = parseInt((location.hash || '').replace('#', ''), 10);
    return isNaN(n) ? 0 : Math.min(Math.max(n - 1, 0), total - 1);
  }
  window.addEventListener('hashchange', function () { show(fromHash()); });

  /* ---------- Init ---------- */
  show(fromHash(), { force: true });
  setTimeout(function () { hint.classList.add('gone'); }, 5200);
})();
