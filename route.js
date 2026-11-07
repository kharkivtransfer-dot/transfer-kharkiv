(function () {
  'use strict';
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  var API = 'https://web-production-a94ea.up.railway.app';
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var track = function () { try { if (typeof gtag === 'function') gtag.apply(null, arguments); } catch (e) {} };
  var fb = function () { try { if (typeof fbq === 'function') fbq.apply(null, arguments); } catch (e) {} };

  /* ---------- Route pages: entrance + spotlight hooks on the existing markup ---------- */
  [].forEach.call(document.querySelectorAll('.section .wrap > *, .faq-section details, .faq-title, .cta-box, .related-routes'), function (el) { if (!el.closest('.hero')) el.classList.add('reveal'); });
  [].forEach.call(document.querySelectorAll('.info-card, .hero .card'), function (el) { el.setAttribute('data-glow', ''); });
  // a stray ">" from the pages' head ("…/">>" after canonical) lands in <body> as text — the old opaque header hid it
  [].slice.call(document.body.childNodes).forEach(function (n) { if (n.nodeType === 3 && n.nodeValue.trim() === '>') n.remove(); });

  /* ---------- Header ---------- */
  var hdr = $('#hdr');
  function onScrollHdr() { hdr.classList.toggle('scrolled', scrollY > 30); }
  addEventListener('scroll', onScrollHdr, { passive: true }); onScrollHdr();

  var menu = $('#mobileMenu'), burger = $('#burger');
  function setMenu(open) {
    menu.classList.toggle('open', open); hdr.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
    $('path', burger).setAttribute('d', open ? 'M6 6l12 12M18 6L6 18' : 'M4 8h16M4 16h16');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  function closeMenu() { setMenu(false); }
  burger.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });

  /* ---------- Reveal on scroll ---------- */
  var reveals = $$('.reveal');
  var groupIdx = new Map();
  reveals.forEach(function (el) {
    var p = el.parentElement, i = groupIdx.get(p) || 0; groupIdx.set(p, i + 1);
    el.style.setProperty('--d', Math.min(i, 5) * 80 + 'ms');
  });
  if (RM || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('visible'); });
  } else {
    var observer = new IntersectionObserver(function (els) {
      els.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
    }, { threshold: .1, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { observer.observe(el); });
    setTimeout(function () { reveals.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < innerHeight) el.classList.add('visible'); }); }, 2500);
  }

  /* ---------- Card spotlight + magnetic CTA ---------- */
  document.addEventListener('pointermove', function (e) {
    var c = e.target.closest && e.target.closest('[data-glow]');
    if (!c) return;
    var r = c.getBoundingClientRect();
    c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });
  if (!RM && matchMedia('(hover: hover)').matches) {
    $$('[data-magnet]').forEach(function (el) {
      el.addEventListener('mousemove', function (e) { var r = el.getBoundingClientRect(); el.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .22).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * .3).toFixed(1) + 'px)'; });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------- Floating messenger pill ---------- */
  var pill = $('#pill'), pillT = $('#pillToggle');
  pillT.addEventListener('click', function () {
    var open = !pill.classList.contains('open'); pill.classList.toggle('open', open);
    pillT.setAttribute('aria-expanded', open ? 'true' : 'false');
    $('path', pillT).setAttribute('d', open ? 'M6 6l12 12M18 6L6 18' : 'M4 5h16v11H9l-5 4V5z');
  });

  /* ---------- Toast ---------- */
  var toastTimer;
  function showToast(msg, type) {
    type = type || 'error';
    var t = $('#toast');
    t.className = 'toast ' + type;
    t.textContent = (type === 'error' ? '❌ ' : type === 'success' ? '✅ ' : '⚠️ ') + msg;
    requestAnimationFrame(function () { t.classList.add('show'); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 4000);
  }

  /* ---------- Scroll lock (no page jump, iOS-safe) ---------- */
  var lockY = 0, locks = 0;
  function lock() {
    if (locks++) return;
    var sw = innerWidth - document.documentElement.clientWidth;
    lockY = scrollY;
    document.body.style.top = -lockY + 'px';
    if (sw > 0) { document.body.style.paddingRight = sw + 'px'; hdr.style.paddingRight = sw + 'px'; pill.style.marginRight = sw + 'px'; }
    document.body.classList.add('pf-lock');
  }
  function unlock() {
    if (!locks || --locks) return;
    document.body.classList.remove('pf-lock');
    document.body.style.top = ''; document.body.style.paddingRight = ''; hdr.style.paddingRight = ''; pill.style.marginRight = '';
    // html has scroll-behavior:smooth — restore the position without an animated jump
    try { scrollTo({ top: lockY, left: 0, behavior: 'instant' }); } catch (e) { scrollTo(0, lockY); }
  }

  /* ---------- Callback modal ---------- */
  var overlay = $('#overlay'), lastFocus = null;
  function anyModalOpen() { return overlay.classList.contains('open'); }
  function openModal(id) {
    closeMenu();
    clearTimeout(toastTimer); $('#toast').classList.remove('show');
    lastFocus = document.activeElement;
    $$('.dlg', overlay).forEach(function (d) { d.classList.toggle('open', d.id === id); });
    overlay.classList.add('open');
    lock();
    var f = $('input:not([type=hidden]), .btn, a', document.getElementById(id));
    setTimeout(function () { if (f) f.focus({ preventScroll: true }); }, 60);
  }
  function closeModal() {
    if (!anyModalOpen()) return;
    overlay.classList.remove('open');
    $$('.dlg', overlay).forEach(function (d) { d.classList.remove('open'); });
    unlock();
    var cb = $('#callbackModal');
    if (cb.classList.contains('sent')) { cb.classList.remove('sent'); $('#cb-name').value = ''; $('#cb-phone').value = '+38 '; }
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
  function openCallback() { $('#callbackModal').classList.remove('sent'); $('[data-f="cb-phone"]').classList.remove('err'); openModal('callbackModal'); }

  /* ---------- Phone guard (keeps +38 prefix) ---------- */
  function guardPhone(el) {
    el.addEventListener('input', function () {
      if (!this.value.startsWith('+38 ')) this.value = '+38 ' + this.value.replace(/^\+?3?8?\s?/, '');
      if (/^\s*\+?38\s?0/.test(this.value.slice(4))) this.value = '+38 ' + this.value.slice(4).replace(/^\s*\+?38\s?/, '');
    });
    el.addEventListener('keydown', function (e) {
      if ((e.key === 'Backspace' || e.key === 'Delete') && this.selectionStart <= 4 && this.selectionEnd <= 4) e.preventDefault();
    });
    el.addEventListener('focus', function () {
      var self = this;
      if (!self.value || self.value.trim() === '' || self.value.trim() === '+38') self.value = '+38 ';
      setTimeout(function () { if (self.selectionStart < 4) self.setSelectionRange(4, 4); }, 0);
    });
  }
  function phoneDigits(v) { return (v || '').replace(/[^\d]/g, ''); }
  function phoneValid(v) { var d = phoneDigits(v); return d.length >= 12 && d.length <= 15; }
  function setErr(key, on) { var f = $('[data-f="' + key + '"]'); if (f) f.classList.toggle('err', !!on); }
  $('#cb-phone').addEventListener('input', function () { setErr('cb-phone', false); });

  var cbSending = false;
  async function sendCallback() {
    if (cbSending) return;
    var name = ($('#cb-name').value || '').trim() || 'не вказано';
    var phoneRaw = $('#cb-phone').value || '';
    if (!phoneValid(phoneRaw)) { setErr('cb-phone', true); $('#cb-phone').focus(); return; }
    var btn = $('#cbBtn');
    cbSending = true; btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>Відправляємо...';
    try {
      var res = await fetch(API + '/callback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name, phone: phoneRaw.trim(), honeypot: '' }) });
      if (res.ok) {
        fb('track', 'Contact', { content_name: 'callback_submit' });
        $('#callbackModal').classList.add('sent');
        setTimeout(function () { if ($('#callbackModal').classList.contains('sent')) closeModal(); }, 3500);
      } else if (res.status === 429) {
        showToast('Забагато спроб. Зачекайте хвилину або зателефонуйте: +38 063 309 49 49', 'error');
      } else if (res.status === 422) {
        setErr('cb-phone', true); showToast('Перевірте номер телефону', 'warn');
      } else {
        showToast('Не вдалося відправити. Зателефонуйте нам: +38 063 309 49 49', 'error');
      }
    } catch (e) {
      showToast('Немає з\'єднання з сервером. Зателефонуйте: +38 063 309 49 49', 'error');
    } finally {
      cbSending = false; btn.disabled = false; btn.textContent = 'Відправити';
    }
  }
  $('#cbForm').addEventListener('submit', function (e) { e.preventDefault(); sendCallback(); });
  guardPhone($('#cb-phone'));

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-action]');
    if (!el) return;
    var a = el.dataset.action;
    if (a === 'openCallback') openCallback();
    else if (a === 'closeModal') closeModal();
    else if (a === 'closeMenu') closeMenu();
    else if (a === 'closeMenuOpenCallback') { closeMenu(); openCallback(); }
  });

  /* ---------- Tracking (tel:/order clicks are tracked by the page's own scripts) ---------- */
  document.addEventListener('click', function (e) {
    var tg = e.target.closest && e.target.closest('[data-tg]');
    if (tg) track('event', 'telegram_click', { method: 'bot' });
    var cb = e.target.closest && e.target.closest('[data-action="openCallback"], [data-action="closeMenuOpenCallback"]');
    if (cb) { fb('track', 'InitiateCheckout', { content_name: 'callback_open' }); if (typeof gtag_report_conversion === 'function') gtag_report_conversion(); }
  }, true);
})();
