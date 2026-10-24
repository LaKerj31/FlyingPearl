/* Flying Pearl : séries photo (section PHOTOS), fiches projet (sections IA et PHOTOS),
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

  /* ---------- fiche projet (IA et séries photo) ---------- */
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
      '<p class="pj__desc"></p>' +
      '<dl class="pj__meta"></dl>' +
      '<div class="pj__content"></div>' +
    '</div>';
  document.body.appendChild(pj);
  var pjEyebrow = pj.querySelector('.pj__eyebrow');
  var pjTitle = pj.querySelector('.pj__title');
  var pjDesc = pj.querySelector('.pj__desc');
  var pjMeta = pj.querySelector('.pj__meta');
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
  function setMeta(rows) {
    pjMeta.textContent = '';
    rows.forEach(function (r) {
      if (!r[1]) return;
      var d = document.createElement('div');
      var dt = document.createElement('dt'); dt.textContent = r[0];
      var dd = document.createElement('dd'); dd.textContent = r[1];
      d.appendChild(dt); d.appendChild(dd); pjMeta.appendChild(d);
    });
    pjMeta.style.display = pjMeta.children.length ? '' : 'none';
  }
  function setDesc(txt) {
    pjDesc.textContent = txt || '';
    pjDesc.style.display = txt ? '' : 'none';
  }
  function shotButton(f, list, i, nat) {
    var btn = document.createElement('button');
    btn.className = 'pj__shot' + (nat ? ' pj__shot--nat' : ''); btn.type = 'button';
    btn.setAttribute('data-cursor', 'Agrandir');
    var im = document.createElement('img'); im.src = f.full; im.alt = f.alt || ''; im.decoding = 'async';
    if (f.w && f.h) { im.width = f.w; im.height = f.h; }
    btn.appendChild(im);
    if (nat && f.cap) { var c = document.createElement('span'); c.className = 'pj__shot__cap mono'; c.textContent = f.cap; btn.appendChild(c); }
    btn.addEventListener('click', function () { lbOpenAt(list, i); });
    return btn;
  }
  function tearsFigs() {
    return Array.prototype.slice.call(document.querySelectorAll('.tears-src img')).map(function (im) {
      return { full: im.getAttribute('data-full') || im.src, alt: im.alt || '', cap: (im.getAttribute('data-tag') ? im.getAttribute('data-tag') + ' · ' : '') + 'TEARS' };
    });
  }
  function openOverlay() {
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

  /* IA : cartes "Derniers projets" */
  function openProject(card) {
    lastFocus = document.activeElement;
    pjEyebrow.textContent = 'Projet';
    setTitle(card.getAttribute('data-title') || '', card.getAttribute('data-accent') || '');
    setDesc(card.getAttribute('data-desc') || '');
    setMeta([['Outils', card.getAttribute('data-tools') || ''], ['Date', card.getAttribute('data-date') || '']]);
    pjContent.textContent = '';
    if (card.getAttribute('data-proj') === 'show') {
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
      figs.forEach(function (f, i) { grid.appendChild(shotButton(f, figs, i, false)); });
      pjContent.appendChild(grid);
    }
    openOverlay();
  }
  Array.prototype.slice.call(document.querySelectorAll('.card__cover')).forEach(function (c) {
    c.addEventListener('click', function () { openProject(c); });
  });

  /* PHOTOS : séries (couverture = entrer dans la série, pellicules = agrandir) */
  function serieFigs(serie) {
    var title = serie.getAttribute('data-title') || '';
    var cover = serie.querySelector('.serie__cover');
    var els = cover ? [cover] : [];
    els = els.concat(Array.prototype.slice.call(serie.querySelectorAll('.pframe')));
    return els.map(function (el) {
      var im = el.querySelector('img');
      return {
        full: el.getAttribute('data-full') || (im && im.src),
        alt: im ? im.alt : '',
        cap: (el.getAttribute('data-cap') ? el.getAttribute('data-cap') + ' · ' : '') + title,
        w: im ? parseInt(im.getAttribute('width'), 10) : 0,
        h: im ? parseInt(im.getAttribute('height'), 10) : 0,
        el: el
      };
    });
  }
  function openSerie(serie) {
    lastFocus = document.activeElement;
    var figs = serieFigs(serie);
    pjEyebrow.textContent = 'Série photo · ' + figs.length + ' photos';
    setTitle(serie.getAttribute('data-title') || '', '');
    setDesc(serie.getAttribute('data-desc') || '');
    setMeta([
      [serie.getAttribute('data-k1') || 'Appareil', serie.getAttribute('data-v1') || ''],
      [serie.getAttribute('data-k2') || 'Date', serie.getAttribute('data-v2') || ''],
      [serie.getAttribute('data-k3') || '', serie.getAttribute('data-v3') || '']
    ]);
    pjContent.textContent = '';
    var grid = document.createElement('div'); grid.className = 'pj__grid pj__grid--serie';
    figs.forEach(function (f, i) { grid.appendChild(shotButton(f, figs, i, true)); });
    pjContent.appendChild(grid);
    openOverlay();
  }
  Array.prototype.slice.call(document.querySelectorAll('.serie')).forEach(function (serie) {
    var cover = serie.querySelector('.serie__cover');
    if (cover) cover.addEventListener('click', function () { openSerie(serie); });
    Array.prototype.slice.call(serie.querySelectorAll('.pframe')).forEach(function (fr) {
      fr.addEventListener('click', function () {
        var figs = serieFigs(serie);
        var idx = 0;
        figs.forEach(function (f, i) { if (f.el === fr) idx = i; });
        lbOpenAt(figs, idx);
      });
    });
  });

  /* ---------- PHOTOS : pellicules contenues entre le haut et le bas de la couverture ----------
     La taille des pellicules (--fh) et la marge de décalage (--slack) sont calculées pour que
     deux rangées, décalages compris, tiennent exactement dans la hauteur du cadre de couverture. */
  var seriesEls = Array.prototype.slice.call(document.querySelectorAll('.serie'));
  var narrowMQ = window.matchMedia ? window.matchMedia('(max-width:900px)') : null;
  function layoutSeries() {
    seriesEls.forEach(function (serie) {
      var film = serie.querySelector('.serie__film');
      var frames = serie.querySelector('.serie__frames');
      var fr = frames ? Array.prototype.slice.call(frames.querySelectorAll('.pframe')) : [];
      if (!film || !frames || !fr.length) return;
      if (narrowMQ && narrowMQ.matches) {
        frames.style.removeProperty('--fh'); frames.style.removeProperty('--slack'); frames.style.removeProperty('--cols');
        return;
      }
      var cols = serie.classList.contains('serie--land') ? 2 : 3;
      var rows = Math.ceil(fr.length / cols);
      frames.style.setProperty('--cols', cols);
      var G = 28, rowGap = 20;
      frames.style.setProperty('--g', G + 'px'); frames.style.setProperty('--rg', rowGap + 'px');
      var Hc = film.offsetHeight;
      var W = frames.clientWidth;
      var f0 = fr[0], film0 = f0.querySelector('.pframe__film'), img0 = f0.querySelector('img');
      var extraFilm = Math.max(0, film0.offsetHeight - img0.offsetHeight);
      var exifH = Math.max(0, f0.offsetHeight - film0.offsetHeight);
      var S = Math.round(Hc * 0.10);
      var R = (Hc - (rows - 1) * (exifH + rowGap) - S) / rows;
      var imgH = R - extraFilm;
      var ratio = 0;
      fr.forEach(function (b) {
        var im = b.querySelector('img');
        var r = (parseInt(im.getAttribute('width'), 10) || 2) / (parseInt(im.getAttribute('height'), 10) || 3);
        if (r > ratio) ratio = r;
      });
      var maxW = (W - (cols - 1) * G) / cols - 14;
      if (maxW > 0 && ratio > 0) imgH = Math.min(imgH, maxW / ratio);
      imgH = Math.max(80, Math.floor(imgH));
      frames.style.setProperty('--fh', imgH + 'px');
      frames.style.setProperty('--slack', S + 'px');
    });
  }
  var layoutT = null;
  function layoutSoon() { clearTimeout(layoutT); layoutT = setTimeout(layoutSeries, 60); }
  if (seriesEls.length) {
    layoutSeries();
    window.addEventListener('resize', layoutSoon);
    window.addEventListener('load', layoutSoon);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutSoon);
    seriesEls.forEach(function (serie) {
      var ci = serie.querySelector('.serie__cimg img');
      if (ci) ci.addEventListener('load', layoutSoon);
    });
  }

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
  watchView('[data-view="photos"]', function () {
    forceLoad(Array.prototype.slice.call(document.querySelectorAll('.serie img')));
    if (seriesEls.length) { layoutSeries(); layoutSoon(); }
  });
})();
