/* Flying Pearl : bobines photo (section PHOTOS), fiches projet (section IA),
   et une visionneuse d'images commune. Autonome, sans toucher au routage par hash. */
(function () {
  'use strict';
  if (!document.body) return;

  var lastFocus = null;
  function lockScroll() {
    var on = lbOpen || pjOpen;
    try { document.documentElement.style.overflow = on ? 'hidden' : ''; } catch (e) {}
  }
  function restoreFocus() { if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} } }

  /* ---------- visionneuse d'images (commune) ---------- */
  var lbOpen = false, lbList = [], lbIdx = 0;
  var lb = document.createElement('div');
  lb.className = 'lb';
  lb.setAttribute('aria-hidden', 'true');
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-label', 'Visionneuse');
  lb.innerHTML =
    '<div class="lb__bg" data-close></div>' +
    '<figure class="lb__fig"><img class="lb__img" alt=""><figcaption class="lb__cap mono"></figcaption></figure>' +
    '<button class="lb__btn lb__prev" type="button" aria-label="Image precedente">‹</button>' +
    '<button class="lb__btn lb__next" type="button" aria-label="Image suivante">›</button>' +
    '<button class="lb__btn lb__close" type="button" aria-label="Fermer" data-close>✕</button>';
  document.body.appendChild(lb);
  var lbImg = lb.querySelector('.lb__img');
  var lbCap = lb.querySelector('.lb__cap');
  var lbClose = lb.querySelector('.lb__close');

  function lbShow(i) {
    if (!lbList.length) return;
    lbIdx = (i % lbList.length + lbList.length) % lbList.length;
    var it = lbList[lbIdx];
    lbImg.src = it.full;
    lbImg.alt = it.alt || '';
    lbCap.textContent = it.cap || '';
    lb.querySelector('.lb__prev').style.display = lbList.length > 1 ? '' : 'none';
    lb.querySelector('.lb__next').style.display = lbList.length > 1 ? '' : 'none';
  }
  function lbOpenAt(list, i) {
    lastFocus = document.activeElement;
    lbList = list; lbShow(i);
    lbOpen = true; lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false');
    lockScroll(); lbClose.focus();
  }
  function lbCloseFn() {
    lbOpen = false; lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true');
    lbImg.src = ''; lockScroll(); if (!pjOpen) restoreFocus();
  }
  lb.addEventListener('click', function (e) {
    if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-close')) lbCloseFn();
  });
  lb.querySelector('.lb__prev').addEventListener('click', function () { lbShow(lbIdx - 1); });
  lb.querySelector('.lb__next').addEventListener('click', function () { lbShow(lbIdx + 1); });

  /* ---------- bobines photo ---------- */
  var shots = Array.prototype.slice.call(document.querySelectorAll('.shot'));
  var groups = {};
  shots.forEach(function (b) {
    var g = b.getAttribute('data-group') || '_';
    (groups[g] = groups[g] || []).push(b);
  });
  shots.forEach(function (b) {
    var g = b.getAttribute('data-group') || '_';
    b.addEventListener('click', function () {
      var list = groups[g].map(function (x) {
        var im = x.querySelector('img');
        return { full: x.getAttribute('data-full') || (im && im.src), cap: x.getAttribute('data-cap') || '', alt: im ? im.alt : '' };
      });
      lbOpenAt(list, groups[g].indexOf(b));
    });
  });

  /* ---------- fiche projet (section IA) ---------- */
  var cards = Array.prototype.slice.call(document.querySelectorAll('.card__cover'));
  var pjOpen = false;
  var pj = document.createElement('div');
  pj.className = 'pj';
  pj.setAttribute('aria-hidden', 'true');
  pj.setAttribute('role', 'dialog');
  pj.setAttribute('aria-modal', 'true');
  pj.innerHTML =
    '<div class="pj__bg" data-pjclose></div>' +
    '<button class="pj__close" type="button" aria-label="Fermer" data-pjclose>✕</button>' +
    '<div class="pj__panel">' +
      '<p class="pj__eyebrow mono">Projet</p>' +
      '<h2 class="pj__title"></h2>' +
      '<dl class="pj__spec">' +
        '<div><dt>Outils</dt><dd class="pj__tools"></dd></div>' +
        '<div><dt>Date</dt><dd class="pj__date"></dd></div>' +
        '<div><dt>Description</dt><dd class="pj__desc"></dd></div>' +
      '</dl>' +
      '<div class="pj__content"></div>' +
    '</div>';
  document.body.appendChild(pj);
  var pjTitle = pj.querySelector('.pj__title');
  var pjTools = pj.querySelector('.pj__tools');
  var pjDate = pj.querySelector('.pj__date');
  var pjDesc = pj.querySelector('.pj__desc');
  var pjContent = pj.querySelector('.pj__content');
  var pjPanel = pj.querySelector('.pj__panel');

  function setTitle(title, accent) {
    pjTitle.textContent = '';
    if (accent && title.indexOf(accent) !== -1) {
      var i = title.indexOf(accent);
      pjTitle.appendChild(document.createTextNode(title.slice(0, i)));
      var sp = document.createElement('span'); sp.className = 'pj__accent'; sp.textContent = accent;
      pjTitle.appendChild(sp);
      pjTitle.appendChild(document.createTextNode(title.slice(i + accent.length)));
    } else {
      pjTitle.textContent = title;
    }
  }
  function tearsFigs() {
    return Array.prototype.slice.call(document.querySelectorAll('.tears-src img')).map(function (im) {
      return { full: im.getAttribute('data-full') || im.src, alt: im.alt || '', tag: im.getAttribute('data-tag') || '' };
    });
  }
  function buildContent(kind, card) {
    pjContent.textContent = '';
    if (kind === 'show') {
      var v = document.createElement('video');
      v.className = 'pj__video'; v.controls = true; v.playsInline = true; v.preload = 'metadata';
      var im = card.querySelector('img'); if (im) v.poster = im.src;
      var s = document.createElement('source'); s.src = card.getAttribute('data-video'); s.type = 'video/mp4';
      v.appendChild(s);
      pjContent.appendChild(v);
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    } else {
      var figs = tearsFigs();
      var grid = document.createElement('div'); grid.className = 'pj__grid';
      figs.forEach(function (f, i) {
        var btn = document.createElement('button');
        btn.className = 'pj__shot'; btn.type = 'button';
        btn.setAttribute('data-cursor', 'Agrandir');
        var im = document.createElement('img'); im.src = f.full; im.alt = f.alt; im.loading = 'lazy'; im.decoding = 'async';
        btn.appendChild(im);
        btn.addEventListener('click', function () {
          lbOpenAt(figs.map(function (x) { return { full: x.full, alt: x.alt, cap: (x.tag ? x.tag + ' · ' : '') + 'TEARS' }; }), i);
        });
        grid.appendChild(btn);
      });
      pjContent.appendChild(grid);
    }
  }
  function openProject(card) {
    lastFocus = document.activeElement;
    setTitle(card.getAttribute('data-title') || '', card.getAttribute('data-accent') || '');
    pjTools.textContent = card.getAttribute('data-tools') || '';
    pjDate.textContent = card.getAttribute('data-date') || '';
    pjDesc.textContent = card.getAttribute('data-desc') || '';
    buildContent(card.getAttribute('data-proj'), card);
    pjOpen = true; pj.classList.add('is-open'); pj.setAttribute('aria-hidden', 'false');
    lockScroll(); pj.scrollTop = 0; pjPanel.scrollTop = 0; pj.querySelector('.pj__close').focus();
  }
  function closeProject() {
    pjOpen = false; pj.classList.remove('is-open'); pj.setAttribute('aria-hidden', 'true');
    var v = pjContent.querySelector('video'); if (v) { try { v.pause(); } catch (e) {} }
    pjContent.textContent = ''; lockScroll(); restoreFocus();
  }
  pj.addEventListener('click', function (e) {
    if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-pjclose')) closeProject();
  });
  cards.forEach(function (c) { c.addEventListener('click', function () { openProject(c); }); });

  /* ---------- clavier ---------- */
  document.addEventListener('keydown', function (e) {
    if (lbOpen) {
      if (e.key === 'Escape' || e.key === 'Esc') lbCloseFn();
      else if (e.key === 'ArrowLeft') lbShow(lbIdx - 1);
      else if (e.key === 'ArrowRight') lbShow(lbIdx + 1);
    } else if (pjOpen) {
      if (e.key === 'Escape' || e.key === 'Esc') closeProject();
    }
  });

  /* ---------- chargement fiable des images quand une vue devient visible ----------
     (loading differe + scroll lisse Lenis ne declenche pas toujours le chargement) */
  function forceLoad(imgs) {
    imgs.forEach(function (im) {
      im.loading = 'eager';
      if (!im.complete || !im.naturalWidth) { var s = im.getAttribute('src'); if (s) im.setAttribute('src', s); }
    });
  }
  function watchView(sel, imgsFn) {
    var v = document.querySelector(sel);
    if (!v) { imgsFn(); return; }
    if (!v.hasAttribute('hidden')) imgsFn();
    try {
      new MutationObserver(function () { if (!v.hasAttribute('hidden')) imgsFn(); })
        .observe(v, { attributes: true, attributeFilter: ['hidden'] });
    } catch (e) { imgsFn(); }
  }
  watchView('[data-view="ia"]', function () { forceLoad(Array.prototype.slice.call(document.querySelectorAll('.card__cover img'))); });
  watchView('[data-view="photos"]', function () { forceLoad(Array.prototype.slice.call(document.querySelectorAll('.shot img'))); });
})();
