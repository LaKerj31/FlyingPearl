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
  lb.setAttribute('data-lenis-prevent', '');
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
  pj.setAttribute('data-lenis-prevent', '');
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
      var place = el.getAttribute('data-place') || '';
      return {
        full: el.getAttribute('data-full') || (im && im.src),
        alt: im ? im.alt : '',
        cap: (el.getAttribute('data-cap') ? el.getAttribute('data-cap') + ' · ' : '') + (place ? place + ' · ' : '') + title,
        w: im ? parseInt(im.getAttribute('width'), 10) : 0,
        h: im ? parseInt(im.getAttribute('height'), 10) : 0,
        lat: parseFloat(el.getAttribute('data-lat')), lon: parseFloat(el.getAttribute('data-lon')),
        place: place, mx: parseFloat(el.getAttribute('data-mx')), my: parseFloat(el.getAttribute('data-my')),
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
    var map = buildMap(serie, figs);
    if (map) pjContent.appendChild(map);
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

  /* ---------- carte stylisée : fond SVG auto-hébergé + épingles + vignettes placées là où les photos ont été prises ---------- */
  var mapCache = {};
  var svgNS = 'http://www.w3.org/2000/svg';
  function svgEl(name, attrs) {
    var e = document.createElementNS(svgNS, name);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]);
    return e;
  }
  function loadText(url, cb) {
    if (mapCache[url]) { cb(mapCache[url]); return; }
    if (!window.fetch) { cb(''); return; }
    fetch(url, { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.text() : ''; }).then(function (t) {
      if (t) mapCache[url] = t; cb(t);
    }).catch(function () { cb(''); });
  }
  function locatedFigs(figs) {
    return figs.filter(function (f) { return !isNaN(f.lat) && !isNaN(f.lon) && !isNaN(f.mx) && !isNaN(f.my); });
  }
  /* remplit `box` (déjà dans le DOM) avec la carte de la série ; cb(ok) une fois rendue */
  function renderMapInto(box, serie, figs, cb) {
    var url = serie.getAttribute('data-map');
    var located = locatedFigs(figs);
    if (!url || !located.length) { if (cb) cb(false); return; }
    loadText(url, function (svgText) {
      if (!svgText || svgText.indexOf('<svg') === -1) { if (cb) cb(false); return; }
      box.innerHTML = svgText;
      var svg = box.querySelector('svg'); if (!svg) { if (cb) cb(false); return; }
      var pr = (svg.getAttribute('data-proj') || '').split(',').map(Number);
      if (pr.length < 7) { if (cb) cb(false); return; }
      var minx = pr[0], miny = pr[1], cy = pr[2], sc = pr[3], pad = pr[4], W = pr[5], H = pr[6];
      box.style.setProperty('--mar', W + ' / ' + H);
      box.setAttribute('data-w', W); box.setAttribute('data-h', H);
      var pins = svg.querySelector('.map__pins') || svg;
      var leads = svgEl('g', { 'class': 'map__leads' }); svg.insertBefore(leads, pins);
      located.forEach(function (f, k) {
        var x = pad + (f.lon - minx) * cy * sc, y = H - pad - (f.lat - miny) * sc;
        var tx = f.mx / 100 * W, ty = f.my / 100 * H;
        leads.appendChild(svgEl('line', { 'class': 'map__lead', x1: x.toFixed(1), y1: y.toFixed(1), x2: tx.toFixed(1), y2: ty.toFixed(1) }));
        var ring = svgEl('circle', { 'class': 'map__ring', cx: x.toFixed(1), cy: y.toFixed(1), r: 7 });
        ring.style.setProperty('--pd', (k * 0.35) + 's');
        pins.appendChild(ring);
        pins.appendChild(svgEl('circle', { 'class': 'map__pin', cx: x.toFixed(1), cy: y.toFixed(1), r: 4.5 }));
      });
      located.forEach(function (f, k) {
        var i = figs.indexOf(f);
        var b = document.createElement('button');
        b.className = 'mapshot'; b.type = 'button';
        b.style.left = f.mx + '%'; b.style.top = f.my + '%';
        b.style.setProperty('--td', (0.15 + k * 0.09) + 's');
        b.setAttribute('data-cursor', 'Agrandir');
        b.setAttribute('aria-label', (f.place ? f.place + ', ' : '') + 'photo ' + (i + 1) + ', agrandir');
        var film = document.createElement('span'); film.className = 'mapshot__film';
        var im = document.createElement('img'); im.src = f.full; im.alt = ''; im.decoding = 'async';
        if (f.w && f.h) { im.width = f.w; im.height = f.h; }
        film.appendChild(im); b.appendChild(film);
        var cap = document.createElement('span'); cap.className = 'mapshot__cap mono';
        var num = document.createElement('b'); num.textContent = (i + 1 < 10 ? '0' : '') + (i + 1);
        cap.appendChild(num); cap.appendChild(document.createTextNode(f.place || ''));
        b.appendChild(cap);
        b.addEventListener('click', function () { lbOpenAt(figs, i); });
        box.appendChild(b);
      });
      if (cb) cb(true);
    });
  }
  function buildMap(serie, figs) {
    if (!serie.getAttribute('data-map') || !locatedFigs(figs).length) return null;
    var box = document.createElement('div');
    box.className = 'pj__map' + (serie.classList.contains('serie--land') ? ' pj__map--land' : '');
    box.setAttribute('aria-label', 'Carte des lieux de prise de vue');
    /* rendu différé : la boîte doit être dans le DOM (sinon, carte absente à la deuxième ouverture) */
    setTimeout(function () {
      if (!box.parentNode) return;
      renderMapInto(box, serie, figs, function (ok) { if (!ok && box.parentNode) box.parentNode.removeChild(box); });
    }, 0);
    return box;
  }

  /* ---------- PHOTOS : à droite de chaque couverture, un globe qui vole jusqu'au lieu puis se fond dans la carte ----------
     Projection orthographique calculée ici (contours Natural Earth 110m, media/maps/globe.json). */
  var seriesEls = Array.prototype.slice.call(document.querySelectorAll('.serie'));
  var narrowMQ = window.matchMedia ? window.matchMedia('(max-width:900px)') : null;
  var REDUCE = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;
  var globeData = null, globeWaiters = [];
  function loadGlobe(cb) {
    if (globeData) { cb(globeData); return; }
    globeWaiters.push(cb);
    if (globeWaiters.length > 1) return;
    loadText('media/maps/globe.json', function (t) {
      try { globeData = JSON.parse(t); } catch (e) { globeData = { rings: [] }; }
      globeWaiters.forEach(function (w) { w(globeData); }); globeWaiters = [];
    });
  }
  var DEG = Math.PI / 180, GR = 440, GC = 500;
  function orthoPath(rings, lon0, lat0) {
    var sinP0 = Math.sin(lat0 * DEG), cosP0 = Math.cos(lat0 * DEG);
    var out = [];
    for (var r = 0; r < rings.length; r++) {
      var ring = rings[r], was = false;
      for (var i = 0; i < ring.length; i++) {
        var lam = (ring[i][0] - lon0) * DEG, phi = ring[i][1] * DEG;
        var cosP = Math.cos(phi), sinP = Math.sin(phi), cosL = Math.cos(lam);
        var cosc = sinP0 * sinP + cosP0 * cosP * cosL;
        if (cosc < 0) { was = false; continue; }
        var x = GC + GR * cosP * Math.sin(lam), y = GC - GR * (cosP0 * sinP - sinP0 * cosP * cosL);
        out.push((was ? 'L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1));
        was = true;
      }
    }
    return out.join('');
  }
  var graticule = (function () {
    var rings = [], i, j;
    for (i = -150; i <= 180; i += 30) { var m = []; for (j = -90; j <= 90; j += 3) m.push([i, j]); rings.push(m); }
    for (i = -60; i <= 60; i += 30) { var pl = []; for (j = -180; j <= 180; j += 3) pl.push([j, i]); rings.push(pl); }
    return rings;
  })();
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function setupStage(serie) {
    var stage = serie.querySelector('.serie__stage');
    var film = serie.querySelector('.serie__film');
    if (!stage || !film || !serie.getAttribute('data-map')) return null;
    var figs = serieFigs(serie);
    var located = locatedFigs(figs);
    if (!located.length) return null;
    /* cible : barycentre des lieux */
    var tl = 0, tla = 0; located.forEach(function (f) { tl += f.lon; tla += f.lat; });
    var target = { lon: tl / located.length, lat: tla / located.length };
    stage.innerHTML = '';
    var globe = document.createElement('div'); globe.className = 'globe';
    var svg = svgEl('svg', { viewBox: '0 0 1000 1000', 'aria-hidden': 'true' });
    svg.appendChild(svgEl('circle', { 'class': 'globe__sphere', cx: GC, cy: GC, r: GR }));
    var grat = svgEl('path', { 'class': 'globe__grat', d: '' }); svg.appendChild(grat);
    var land = svgEl('path', { 'class': 'globe__land', d: '' }); svg.appendChild(land);
    var halo = svgEl('circle', { 'class': 'globe__halo', cx: GC, cy: GC, r: 14 });
    var pin = svgEl('circle', { 'class': 'globe__pin', cx: GC, cy: GC, r: 6 });
    svg.appendChild(halo); svg.appendChild(pin);
    globe.appendChild(svg);
    var map = document.createElement('div');
    map.className = 'pj__map stagemap' + (serie.classList.contains('serie--land') ? ' pj__map--land' : '');
    map.setAttribute('aria-label', 'Carte des lieux de prise de vue');
    stage.appendChild(globe); stage.appendChild(map);
    var st = { serie: serie, stage: stage, globe: globe, map: map, grat: grat, land: land, pin: pin, halo: halo, target: target,
               state: 'idle', raf: 0, mapReady: false, figs: figs };
    renderMapInto(map, serie, figs, function (ok) { st.mapReady = ok; if (!ok) map.style.display = 'none'; fitStage(st); });
    drawGlobe(st, startLon(target), 12);
    return st;
  }
  function startLon(target) { return target.lon - 95; }
  function drawGlobe(st, lon0, lat0) {
    if (!globeData) return;
    st.grat.setAttribute('d', orthoPath(graticule, lon0, lat0));
    st.land.setAttribute('d', orthoPath(globeData.rings, lon0, lat0));
    /* épingle de la cible */
    var lam = (st.target.lon - lon0) * DEG, phi = st.target.lat * DEG, p0 = lat0 * DEG;
    var cosc = Math.sin(p0) * Math.sin(phi) + Math.cos(p0) * Math.cos(phi) * Math.cos(lam);
    var vis = cosc > 0.08;
    var x = GC + GR * Math.cos(phi) * Math.sin(lam), y = GC - GR * (Math.cos(p0) * Math.sin(phi) - Math.sin(p0) * Math.cos(phi) * Math.cos(lam));
    [st.pin, st.halo].forEach(function (c) { c.setAttribute('cx', x.toFixed(1)); c.setAttribute('cy', y.toFixed(1)); c.style.opacity = vis ? '' : '0'; });
  }
  function fitStage(st) {
    var sw = st.stage.clientWidth, sh = st.stage.clientHeight;
    if (!sw || !sh) return;
    var g = Math.min(sw, sh) * 0.94;
    st.globe.style.setProperty('--gs', g + 'px');
    var W = parseFloat(st.map.getAttribute('data-w')) || 1000, H = parseFloat(st.map.getAttribute('data-h')) || 700;
    var k = Math.min(sw / W, sh / H);
    st.map.style.setProperty('--mw', (W * k) + 'px'); st.map.style.setProperty('--mh', (H * k) + 'px');
  }
  function playStage(st) {
    if (st.state !== 'idle') return;
    if (!globeData) { loadGlobe(function () { if (st.state === 'idle') playStage(st); }); return; }
    if (REDUCE) { st.state = 'map'; st.stage.classList.add('is-map'); return; }
    st.state = 'flying';
    var lonA = startLon(st.target), latA = 12, lonB = st.target.lon, latB = st.target.lat;
    var dl = ((lonB - lonA + 540) % 360) - 180;
    var t0 = null, D = 1900;
    var step = function (ts) {
      if (st.state !== 'flying') return;
      if (!t0) t0 = ts;
      var t = Math.min(1, (ts - t0) / D), e = easeInOut(t);
      drawGlobe(st, lonA + dl * e, latA + (latB - latA) * e);
      if (t < 1) { st.raf = requestAnimationFrame(step); }
      else { st.state = 'map'; setTimeout(function () { if (st.state === 'map') st.stage.classList.add('is-map'); }, 260); }
    };
    st.raf = requestAnimationFrame(step);
  }
  function resetStage(st) {
    if (st.raf) cancelAnimationFrame(st.raf);
    st.state = 'idle';
    st.stage.classList.remove('is-map');
    drawGlobe(st, startLon(st.target), 12);
  }
  var stages = [];
  function initStages() {
    if (stages.length || (narrowMQ && narrowMQ.matches)) return;
    loadGlobe(function () {
      seriesEls.forEach(function (serie) { var st = setupStage(serie); if (st) stages.push(st); });
      if (!stages.length) return;
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            var st = null; stages.forEach(function (x) { if (x.stage === en.target) st = x; });
            if (!st) return;
            if (en.isIntersecting && en.intersectionRatio >= 0.35) playStage(st);
            else if (!en.isIntersecting && st.state !== 'idle') resetStage(st);
          });
        }, { threshold: [0, 0.35] });
        stages.forEach(function (st) { io.observe(st.stage); });
      } else { stages.forEach(function (st) { playStage(st); }); }
      layoutSeries();
    });
  }

  /* mise en page de la rangée : la scène (globe/carte) prend la hauteur du cadre de couverture */
  function layoutOne(serie) {
    var film = serie.querySelector('.serie__film');
    var stage = serie.querySelector('.serie__stage');
    if (!film || !stage) return;
    if (narrowMQ && narrowMQ.matches) { stage.style.removeProperty('--sh'); return; }
    void serie.offsetHeight;
    stage.style.setProperty('--sh', film.offsetHeight + 'px');
    stages.forEach(function (st) { if (st.serie === serie) fitStage(st); });
  }
  function layoutSeries() { seriesEls.forEach(layoutOne); }
  var layoutTimers = [];
  function layoutSoon() {
    layoutTimers.forEach(clearTimeout); layoutTimers = [];
    [60, 400, 1100].forEach(function (d) { layoutTimers.push(setTimeout(layoutSeries, d)); });
  }
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

  /* ---------- pied de page : le gros FLYING PEARL ramène à l'accueil ---------- */
  var giant = document.querySelector('.foot__giant');
  if (giant) {
    var goHome = function () { if (location.hash !== '#accueil') location.hash = '#accueil'; else window.scrollTo({ top: 0, behavior: 'smooth' }); };
    giant.addEventListener('click', goHome);
    giant.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goHome(); } });
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
    if (seriesEls.length) { layoutSeries(); layoutSoon(); initStages(); }
  });
})();
