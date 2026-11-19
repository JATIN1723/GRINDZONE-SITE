/* The Grindzone Fitness - site behaviour */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var WA_NUMBER = '917499060307';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Year */
  var yr = $('#year');
  if (yr) yr.textContent = new Date().getFullYear();

  /* Loading screen: hide on load, with a safety timeout */
  var loader = $('#loader');
  var loaderDone = false;
  function hideLoader() {
    if (loaderDone) return;
    loaderDone = true;
    loader.classList.add('is-done');
    document.documentElement.classList.add('js-ready');
    setTimeout(function () { loader.style.display = 'none'; }, 600);
  }
  if (document.readyState === 'complete') { setTimeout(hideLoader, 400); }
  else { window.addEventListener('load', function () { setTimeout(hideLoader, 500); }); }
  setTimeout(hideLoader, 3500);

  /* Hero video: pause when motion is reduced or the tab is hidden */
  var heroVideo = $('.hero__video');
  if (heroVideo) {
    if (reduceMotion) { heroVideo.removeAttribute('autoplay'); heroVideo.pause(); }
    document.addEventListener('visibilitychange', function () {
      if (reduceMotion) return;
      if (document.hidden) heroVideo.pause(); else heroVideo.play().catch(function () {});
    });
  }

  /* Sticky nav + scroll-to-top */
  var nav = $('#nav');
  var toTop = $('#toTop');
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    nav.classList.toggle('is-solid', y > 40);
    toTop.classList.toggle('is-on', y > 700);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  /* Mobile menu */
  var burger = $('#burger');
  var menu = $('#menu');
  function setMenu(open) {
    menu.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', function () { setMenu(!menu.classList.contains('is-open')); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  window.matchMedia('(min-width: 960px)').addEventListener('change', function (m) { if (m.matches) setMenu(false); });

  /* Scroll reveal */
  var revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 70 + 'ms';
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* Plan buttons pre-fill the contact message */
  var msg = $('#f-msg');
  $$('[data-plan]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (msg) msg.value = 'I am interested in: ' + b.getAttribute('data-plan') + '.';
    });
  });

  /* Gallery lightbox */
  var shots = $$('.shot');
  var lb = $('#lb');
  var lbImg = $('#lbImg');
  var idx = 0;
  var lastFocus = null;
  function show(i) {
    idx = (i + shots.length) % shots.length;
    lbImg.src = shots[idx].getAttribute('data-full');
    lbImg.alt = shots[idx].getAttribute('data-alt') || '';
  }
  function openLb(i) {
    lastFocus = document.activeElement;
    show(i);
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    $('#lbClose').focus();
  }
  function closeLb() {
    lb.hidden = true;
    lbImg.removeAttribute('src');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  shots.forEach(function (s, i) { s.addEventListener('click', function () { openLb(i); }); });
  $('#lbClose').addEventListener('click', closeLb);
  $('#lbPrev').addEventListener('click', function () { show(idx - 1); });
  $('#lbNext').addEventListener('click', function () { show(idx + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    else if (e.key === 'ArrowLeft') show(idx - 1);
    else if (e.key === 'ArrowRight') show(idx + 1);
  });
  var tx = null;
  lb.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (tx === null) return;
    var dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    tx = null;
  });

  /* Virtual tour tabs */
  var tour = $('#tourVideo');
  $$('.tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      $$('.tab').forEach(function (t) { t.classList.remove('is-on'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('is-on');
      tab.setAttribute('aria-selected', 'true');
      tour.pause();
      tour.poster = tab.getAttribute('data-poster');
      tour.src = tab.getAttribute('data-src');
      tour.load();
      tour.play().catch(function () {});
    });
  });

  /* Contact form: opens WhatsApp with the details filled in */
  var form = $('#leadForm');
  var formMsg = $('#formMsg');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = form.name.value.trim();
    var phone = form.phone.value.trim();
    var goal = form.goal.value;
    var note = form.message.value.trim();
    var bad = [];
    [['name', name], ['phone', phone.replace(/\D/g, '').length >= 10 ? phone : ''], ['goal', goal]].forEach(function (p) {
      var el = form[p[0]];
      var ok = !!p[1];
      el.classList.toggle('is-bad', !ok);
      if (!ok) bad.push(el);
    });
    if (bad.length) {
      formMsg.textContent = 'Please enter your name, a valid 10-digit phone number and your goal.';
      bad[0].focus();
      return;
    }
    formMsg.textContent = '';
    var text = 'Hi Grindzone Fitness,\nName: ' + name + '\nPhone: ' + phone + '\nGoal: ' + goal + (note ? '\nMessage: ' + note : '');
    window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
    formMsg.style.color = '#0a7a2f';
    formMsg.textContent = 'Opening WhatsApp with your details.';
    form.reset();
  });
})();
