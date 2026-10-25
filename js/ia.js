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

  /* ---------- PHOTOS : à droite de chaque couverture, zoom continu depuis l'espace jusqu'au lieu ----------
     Une seule projection orthographique (centre de la scène, rayon R0, facteur de zoom Z). Pendant la rotation le
     globe (Natural Earth 110m) est recalculé à chaque image ; pendant le zoom, les couches région (côtes 10m) et
     ville (contour + maillage urbain) sont précalculées à leur zoom de référence et simplement mises à l'échelle,
     avec des fondus selon Z. Données auto-hébergées : media/maps/globe.json et media/maps/layers-*.json. */
  var seriesEls = Array.prototype.slice.call(document.querySelectorAll('.serie'));
  var narrowMQ = window.matchMedia ? window.matchMedia('(max-width:900px)') : null;
  var REDUCE = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;
  var jsonCache = {}, jsonWaiters = {};
  function loadJSON(url, cb) {
    if (jsonCache[url]) { cb(jsonCache[url]); return; }
    if (jsonWaiters[url]) { jsonWaiters[url].push(cb); return; }
    jsonWaiters[url] = [cb];
    loadText(url, function (t) {
      var d = null; try { d = JSON.parse(t); } catch (e) { d = null; }
      if (d) jsonCache[url] = d;
      var ws = jsonWaiters[url]; delete jsonWaiters[url];
      ws.forEach(function (w) { w(d); });
    });
  }
  function decodeLines(arrs, q) {
    var out = [];
    (arrs || []).forEach(function (a) {
      var pts = [], x = 0, y = 0;
      for (var i = 0; i < a.length; i += 2) { x += a[i]; y += a[i + 1]; pts.push([x / q, y / q]); }
      out.push(pts);
    });
    return out;
  }
  var DEG = Math.PI / 180;
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  /* chemin SVG d'un ensemble de polylignes [lon,lat] en projection orthographique (cx,cy,R), zoom Z, rotation (lon0,lat0) */
  function orthoPath(lines, cx, cy, R, Z, lon0, lat0, limit) {
    var sinP0 = Math.sin(lat0 * DEG), cosP0 = Math.cos(lat0 * DEG), k = R * Z;
    var out = [];
    for (var r = 0; r < lines.length; r++) {
      var ln = lines[r], was = false;
      for (var i = 0; i < ln.length; i++) {
        var lam = (ln[i][0] - lon0) * DEG, phi = ln[i][1] * DEG;
        var cosP = Math.cos(phi), sinP = Math.sin(phi), cosL = Math.cos(lam);
        var cosc = sinP0 * sinP + cosP0 * cosP * cosL;
        if (cosc < 0) { was = false; continue; }
        var x = cx + k * cosP * Math.sin(lam), y = cy - k * (cosP0 * sinP - sinP0 * cosP * cosL);
        if (limit && (x < -limit || x > limit || y < -limit || y > limit)) { was = false; continue; }
        out.push((was ? 'L' : 'M') + x.toFixed(2) + ',' + y.toFixed(2));
        was = true;
      }
    }
    return out.join('');
  }
  function orthoPoint(lon, lat, cx, cy, R, Z, lon0, lat0) {
    var lam = (lon - lon0) * DEG, phi = lat * DEG, p0 = lat0 * DEG;
    var cosc = Math.sin(p0) * Math.sin(phi) + Math.cos(p0) * Math.cos(phi) * Math.cos(lam);
    return { x: cx + R * Z * Math.cos(phi) * Math.sin(lam), y: cy - R * Z * (Math.cos(p0) * Math.sin(phi) - Math.sin(p0) * Math.cos(phi) * Math.cos(lam)), v: cosc > 0.02 };
  }
  var graticule = (function () {
    var rings = [], i, j;
    for (i = -150; i <= 180; i += 30) { var m = []; for (j = -90; j <= 90; j += 3) m.push([i, j]); rings.push(m); }
    for (i = -60; i <= 60; i += 30) { var pl = []; for (j = -180; j <= 180; j += 3) pl.push([j, i]); rings.push(pl); }
    return rings;
  })();
  function fadeIn(z, a, b) { var t = (Math.log(z) - Math.log(a)) / (Math.log(b) - Math.log(a)); return Math.max(0, Math.min(1, t)); }
  function stageFigs(figs) {
    return figs.filter(function (f) { return !isNaN(f.lat) && !isNaN(f.lon); }).map(function (f) {
      var el = f.el;
      f.sx = parseFloat(el.getAttribute('data-sx')); f.sy = parseFloat(el.getAttribute('data-sy'));
      f.sr = parseFloat(el.getAttribute('data-sr')) || 0; f.ss = parseFloat(el.getAttribute('data-ss')) || 1;
      return f;
    }).filter(function (f) { return !isNaN(f.sx) && !isNaN(f.sy); });
  }
  function setupStage(serie) {
    var stage = serie.querySelector('.serie__stage');
    var film = serie.querySelector('.serie__film');
    var layersUrl = serie.getAttribute('data-layers');
    if (!stage || !film || !layersUrl) return null;
    var figs = serieFigs(serie), located = stageFigs(figs);
    if (!located.length) return null;
    var c = (serie.getAttribute('data-center') || '').split(',').map(Number);
    var center = (c.length === 2 && !isNaN(c[0]) && !isNaN(c[1])) ? { lat: c[0], lon: c[1] } : (function () {
      var tl = 0, tla = 0; located.forEach(function (f) { tl += f.lon; tla += f.lat; }); return { lat: tla / located.length, lon: tl / located.length };
    })();
    var extent = parseFloat(serie.getAttribute('data-extent')) || 0.2;
    stage.innerHTML = '';
    var svg = svgEl('svg', { 'class': 'zoomer', 'aria-hidden': 'true' });
    var gG = svgEl('g', { 'class': 'zg' });
    var sphere = svgEl('circle', { 'class': 'globe__sphere' }); gG.appendChild(sphere);
    var grat = svgEl('path', { 'class': 'globe__grat', d: '' }); gG.appendChild(grat);
    var land = svgEl('path', { 'class': 'globe__land', d: '' }); gG.appendChild(land);
    var gR = svgEl('g', { 'class': 'zr' }); var rPath = svgEl('path', { 'class': 'zr__coast', d: '' }); gR.appendChild(rPath);
    var gC = svgEl('g', { 'class': 'zc' }); var cOut = svgEl('path', { 'class': 'zc__outline', d: '' }); var cLines = svgEl('path', { 'class': 'zc__lines', d: '' }); gC.appendChild(cOut); gC.appendChild(cLines);
    var gP = svgEl('g', { 'class': 'zpins' });
    /* tout ce qui est "carte" (globe, région, ville, épingles) est dans un groupe que l'on peut faire glisser au survol
       d'une photo prise hors champ (Sitges) ; les lignes de rappel restent à part, car les vignettes ne bougent pas */
    var gPan = svgEl('g', { 'class': 'zpan' });
    gPan.appendChild(gG); gPan.appendChild(gR); gPan.appendChild(gC); gPan.appendChild(gP);
    var gL = svgEl('g', { 'class': 'zpins zleads' });
    var halo = svgEl('circle', { 'class': 'globe__halo', r: 14 }); var pin = svgEl('circle', { 'class': 'globe__pin', r: 6 });
    svg.appendChild(gPan); svg.appendChild(gL); svg.appendChild(halo); svg.appendChild(pin);
    stage.appendChild(svg);
    var shots = document.createElement('div'); shots.className = 'stageshots'; stage.appendChild(shots);
    var st = { serie: serie, stage: stage, svg: svg, gG: gG, sphere: sphere, grat: grat, land: land, gR: gR, rPath: rPath, gC: gC, cOut: cOut, cLines: cLines, gP: gP, gPan: gPan, gL: gL, halo: halo, pin: pin,
               shots: shots, figs: figs, located: located, center: center, extent: extent, layers: null, state: 'idle', raf: 0, W: 0, H: 0, cx: 0, cy: 0, R0: 0, Zf: 1, Zr: 1, t0: null, ready: false,
               pinPos: [], leads: [], pinEls: [], panQ: 0, panK: -1, panRaf: 0, oRf: 1 };
    loadJSON(layersUrl, function (d) {
      if (!d) return;
      st.layers = { region: decodeLines(d.region, d.q), city: d.city ? { outline: decodeLines(d.city.outline, d.q), lines: decodeLines(d.city.lines, d.q) } : null };
      fitStage(st);
    });
    /* vignettes (créées une fois ; affichées à la fin du zoom) */
    located.forEach(function (f, k) {
      var i = figs.indexOf(f);
      var b = document.createElement('button');
      b.className = 'mapshot'; b.type = 'button';
      b.style.left = f.sx + '%'; b.style.top = f.sy + '%';
      b.style.setProperty('--rot', f.sr + 'deg'); b.style.setProperty('--sc', f.ss);
      b.style.setProperty('--td', (0.1 + k * 0.1) + 's');
      b.setAttribute('data-cursor', 'Agrandir');
      b.setAttribute('aria-label', (f.place ? f.place + ', ' : '') + 'photo ' + (i + 1) + ', agrandir');
      var film0 = document.createElement('span'); film0.className = 'mapshot__film';
      var im = document.createElement('img'); im.src = f.full; im.alt = ''; im.decoding = 'async';
      if (f.w && f.h) { im.width = f.w; im.height = f.h; }
      film0.appendChild(im); b.appendChild(film0);
      var cap = document.createElement('span'); cap.className = 'mapshot__cap mono';
      var num = document.createElement('b'); num.textContent = (i + 1 < 10 ? '0' : '') + (i + 1);
      cap.appendChild(num); cap.appendChild(document.createTextNode(f.place || ''));
      b.appendChild(cap);
      b.addEventListener('click', function () { lbOpenAt(figs, i); });
      /* photo prise hors champ : au survol, la carte glisse jusqu'au lieu ; on revient dès qu'on quitte la vignette */
      var over = function () { if (f.pan) panTo(st, k); else if (st.panK >= 0) panTo(st, -1); };
      var out = function () { if (f.pan) panTo(st, -1); };
      b.addEventListener('mouseenter', over); b.addEventListener('focus', over);
      b.addEventListener('mouseleave', out); b.addEventListener('blur', out);
      shots.appendChild(b);
    });
    return st;
  }
  /* glissement de la carte : q = 0 (carte centrée) à 1 (lieu hors champ amené au centre) */
  function applyPan(st, q) {
    var k = st.panK, v = (k >= 0 && st.located[k].pan) || { dx: 0, dy: 0 };
    var dx = v.dx * q, dy = v.dy * q;
    st.gPan.setAttribute('transform', 'translate(' + dx.toFixed(1) + ' ' + dy.toFixed(1) + ')');
    st.located.forEach(function (f, i) {
      var p = st.pinPos[i], ld = st.leads[i]; if (!p || !ld) return;
      ld.setAttribute('x1', (p.x + dx).toFixed(1)); ld.setAttribute('y1', (p.y + dy).toFixed(1));
      var o = (k < 0 || i === k) ? 1 : 1 - q;   /* les autres repères s'effacent pendant le glissement */
      ld.style.opacity = o.toFixed(3);
      st.pinEls[i].forEach(function (el) { el.style.opacity = o.toFixed(3); });
    });
    if (st.layers && st.layers.city) st.gR.style.opacity = (st.oRf + (1 - st.oRf) * q).toFixed(3);   /* les côtes reprennent de la présence hors de la ville */
  }
  function panTo(st, k) {
    if (st.state !== 'map') return;
    var target = k >= 0 ? 1 : 0;
    if (k >= 0) st.panK = k;
    if (st.panRaf) cancelAnimationFrame(st.panRaf);
    if (REDUCE) { st.panQ = target; applyPan(st, target); if (!target) st.panK = -1; return; }
    var q0 = st.panQ, t0 = null, D = Math.max(240, 1000 * Math.abs(target - q0));
    var step = function (ts) {
      if (!t0) t0 = ts;
      var t = Math.min(1, (ts - t0) / D);
      st.panQ = q0 + (target - q0) * easeInOut(t);
      applyPan(st, st.panQ);
      if (t < 1) st.panRaf = requestAnimationFrame(step);
      else { st.panRaf = 0; if (!target) st.panK = -1; }
    };
    st.panRaf = requestAnimationFrame(step);
  }
  function fitStage(st) {
    var W = st.stage.clientWidth, H = st.stage.clientHeight;
    if (!W || !H) return;
    st.W = W; st.H = H; st.cx = W / 2; st.cy = H / 2; st.R0 = Math.min(W, H) * 0.47;
    st.svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    st.sphere.setAttribute('cx', st.cx); st.sphere.setAttribute('cy', st.cy); st.sphere.setAttribute('r', st.R0);
    /* zoom final : l'étendue (degrés de latitude) occupe ~62 % de la hauteur */
    st.Zf = (0.62 * H) / (st.R0 * st.extent * DEG);
    st.Zr = st.layers && st.layers.city ? Math.min(8, st.Zf) : st.Zf;
    st.ready = !!(globeData && st.layers);
    if (!st.ready) return;
    var lon0 = st.center.lon, lat0 = st.center.lat;
    st.rPath.setAttribute('d', orthoPath(st.layers.region, st.cx, st.cy, st.R0, st.Zr, lon0, lat0, 20000));
    if (st.layers.city) {
      st.cOut.setAttribute('d', orthoPath(st.layers.city.outline, st.cx, st.cy, st.R0, st.Zf, lon0, lat0, 20000));
      st.cLines.setAttribute('d', orthoPath(st.layers.city.lines, st.cx, st.cy, st.R0, st.Zf, lon0, lat0, 20000));
    }
    /* épingles et lignes de rappel à l'état final ; un lieu hors champ (Sitges) reçoit le vecteur qui l'amène au centre */
    st.gP.textContent = ''; st.gL.textContent = ''; st.pinPos = []; st.leads = []; st.pinEls = [];
    var m = 0.03 * W;
    st.located.forEach(function (f, k) {
      var p = orthoPoint(f.lon, f.lat, st.cx, st.cy, st.R0, st.Zf, lon0, lat0);
      var tx = f.sx / 100 * W, ty = f.sy / 100 * H;
      f.pan = (p.x < -m || p.x > W + m || p.y < -m || p.y > H + m) ? { dx: W * 0.5 - p.x, dy: H * 0.5 - p.y } : null;
      var lead = svgEl('line', { 'class': 'map__lead', x1: p.x.toFixed(1), y1: p.y.toFixed(1), x2: tx.toFixed(1), y2: ty.toFixed(1) });
      st.gL.appendChild(lead);
      var ring = svgEl('circle', { 'class': 'map__ring', cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: 7 });
      ring.style.setProperty('--pd', (k * 0.35) + 's');
      var dot = svgEl('circle', { 'class': 'map__pin', cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: 4.5 });
      st.gP.appendChild(ring); st.gP.appendChild(dot);
      st.pinPos.push(p); st.leads.push(lead); st.pinEls.push([ring, dot]);
    });
    if (st.state === 'map') { renderFrame(st, lon0, lat0, st.Zf, true); applyPan(st, st.panQ); }
    else if (st.state === 'idle') renderFrame(st, startLon(st), 12, 1, false);
  }
  function startLon(st) { return st.center.lon - 95; }
  function renderFrame(st, lon0, lat0, Z, final) {
    if (!st.ready) return;
    var cx = st.cx, cy = st.cy, R0 = st.R0;
    /* globe : recalculé (la rotation peut changer), à Z = 1, puis groupe mis à l'échelle */
    var rotating = Math.abs(lon0 - st.center.lon) > 1e-6 || Math.abs(lat0 - st.center.lat) > 1e-6;
    if (rotating || !st.globeDrawnAtCenter) {
      st.grat.setAttribute('d', orthoPath(graticule, cx, cy, R0, 1, lon0, lat0, 0));
      st.land.setAttribute('d', orthoPath(globeData.rings, cx, cy, R0, 1, lon0, lat0, 0));
      st.globeDrawnAtCenter = !rotating;
    }
    var tr = function (k) { return 'translate(' + cx + ' ' + cy + ') scale(' + k + ') translate(' + (-cx) + ' ' + (-cy) + ')'; };
    st.gG.setAttribute('transform', tr(Z));
    st.gR.setAttribute('transform', tr(Z / st.Zr));
    st.gC.setAttribute('transform', tr(Z / st.Zf));
    var hasCity = !!(st.layers && st.layers.city);
    var oG = 1 - fadeIn(Z, 3, 11);
    var oR = fadeIn(Z, 2.2, 6) * (hasCity ? 1 - 0.62 * fadeIn(Z, Math.max(7, st.Zf / 6), Math.max(12, st.Zf / 2.2)) : 1);
    var oC = hasCity ? fadeIn(Z, Math.max(6, st.Zf / 7), Math.max(10, st.Zf / 2.5)) : 0;
    if (final) st.oRf = oR;
    st.gG.style.opacity = oG.toFixed(3); st.gR.style.opacity = oR.toFixed(3); st.gC.style.opacity = oC.toFixed(3);
    st.gG.style.display = oG <= 0 ? 'none' : ''; st.gR.style.display = oR <= 0 ? 'none' : ''; st.gC.style.display = oC <= 0 ? 'none' : '';
    /* épingle de cible pendant le vol, puis épingles détaillées */
    var p = orthoPoint(st.center.lon, st.center.lat, cx, cy, R0, Z, lon0, lat0);
    var showTarget = !final && Z < st.Zf * 0.5;
    [st.pin, st.halo].forEach(function (c) { c.setAttribute('cx', p.x.toFixed(1)); c.setAttribute('cy', p.y.toFixed(1)); c.style.display = (showTarget && p.v) ? '' : 'none'; });
    st.stage.classList.toggle('is-map', !!final);
  }
  function playStage(st) {
    if (st.state !== 'idle') return;
    if (!st.ready) { st.pending = true; return; }
    if (REDUCE) { st.state = 'map'; renderFrame(st, st.center.lon, st.center.lat, st.Zf, true); return; }
    st.state = 'flying';
    var lonA = startLon(st), latA = 12, lonB = st.center.lon, latB = st.center.lat;
    var dl = ((lonB - lonA + 540) % 360) - 180;
    var ROT = 1800, ZSTART = 1200, ZDUR = st.layers.city ? 3600 : 2600;
    var t0 = null;
    var step = function (ts) {
      if (st.state !== 'flying') return;
      if (!t0) t0 = ts;
      var t = ts - t0;
      var r = easeInOut(Math.min(1, t / ROT));
      var lon0 = lonA + dl * r, lat0 = latA + (latB - latA) * r;
      var zt = Math.max(0, Math.min(1, (t - ZSTART) / ZDUR));
      var Z = Math.exp(Math.log(st.Zf) * easeInOut(zt));
      var done = t >= ZSTART + ZDUR;
      if (done) { lon0 = lonB; lat0 = latB; Z = st.Zf; }
      renderFrame(st, lon0, lat0, Z, done);
      if (!done) st.raf = requestAnimationFrame(step);
      else st.state = 'map';
    };
    st.raf = requestAnimationFrame(step);
  }
  function resetStage(st) {
    if (st.raf) cancelAnimationFrame(st.raf);
    if (st.panRaf) cancelAnimationFrame(st.panRaf);
    st.panRaf = 0; st.panQ = 0; st.panK = -1; applyPan(st, 0);
    st.state = 'idle'; st.pending = false;
    st.stage.classList.remove('is-map');
    if (st.ready) renderFrame(st, startLon(st), 12, 1, false);
  }
  var stages = [];
  function initStages() {
    if (stages.length || (narrowMQ && narrowMQ.matches)) return;
    loadGlobe(function () {
      seriesEls.forEach(function (serie) { var st = setupStage(serie); if (st) stages.push(st); });
      if (!stages.length) return;
      layoutSeries();
      var tick = setInterval(function () {
        var all = true;
        stages.forEach(function (st) { if (!st.ready) { fitStage(st); if (st.ready && st.pending) { st.pending = false; playStage(st); } } if (!st.ready) all = false; });
        if (all) clearInterval(tick);
      }, 150);
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
    });
  }
  var globeData = null, globeWaiters = [];
  function loadGlobe(cb) {
    if (globeData) { cb(globeData); return; }
    globeWaiters.push(cb);
    if (globeWaiters.length > 1) return;
    loadJSON('media/maps/globe.json', function (d) {
      globeData = d || { rings: [] };
      globeWaiters.forEach(function (w) { w(globeData); }); globeWaiters = [];
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
