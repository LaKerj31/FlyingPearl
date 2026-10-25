/* Flying Pearl : séries photo (section PHOTOS), fiches projet (sections IA et PHOTOS),
   et une visionneuse d'images commune. Autonome, sans toucher au routage par hash. */
(function () {
  'use strict';
  if (!document.body) return;

  var lastFocus = null, lbFocus = null, lbBy = 'pointer', pjBy = 'pointer';
  /* souris ou clavier ? Ouvert à la souris, on ne redonne pas le focus à la vignette en refermant (sinon, après Échap,
     le navigateur l'entoure d'orange comme une navigation au clavier) ; ouvert au clavier, on le lui rend */
  var lastInput = 'pointer';
  document.addEventListener('pointerdown', function () { lastInput = 'pointer'; }, true);
  document.addEventListener('keydown', function (e) { if (e.key && e.key.length && ['Shift', 'Control', 'Alt', 'Meta', 'Escape', 'Esc'].indexOf(e.key) === -1) lastInput = 'key'; }, true);
  function lockScroll() {
    var on = lbOpen || pjOpen;
    try { document.documentElement.style.overflow = on ? 'hidden' : ''; } catch (e) {}
  }
  function giveBack(el, by) {
    if (by === 'key' && el && el.focus) { try { el.focus({ preventScroll: true }); } catch (e) {} return; }
    var a = document.activeElement; if (a && a.blur && a !== document.body) { try { a.blur(); } catch (e) {} }
  }
  function restoreFocus() { giveBack(lastFocus, pjBy); }

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
    lbFocus = document.activeElement; lbBy = lastInput;
    lbList = list; lbShow(i);
    lbOpen = true; lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false');
    lockScroll(); lbClose.focus();
  }
  function lbCloseFn() {
    lbOpen = false; lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true');
    lbImg.src = ''; lockScroll(); giveBack(lbFocus, lbBy);
    if (crs) crs.sync(lbIdx);
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
    pjBy = lastInput;
    pjOpen = true; pj.classList.add('is-open'); pj.setAttribute('aria-hidden', 'false');
    lockScroll(); pj.scrollTop = 0; pjPanel.scrollTop = 0; pj.querySelector('.pj__close').focus();
  }
  function closeProject() {
    pjOpen = false; pj.classList.remove('is-open'); pj.setAttribute('aria-hidden', 'true');
    Array.prototype.slice.call(pjContent.querySelectorAll('video')).forEach(function (v) { try { v.pause(); } catch (e) {} });
    if (crs) { crs.destroy(); crs = null; }
    pj.classList.remove('pj--serie');
    pjContent.textContent = ''; lockScroll(); restoreFocus();
  }
  pj.addEventListener('click', function (e) {
    if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-pjclose')) closeProject();
  });

  /* IA : cartes "Derniers projets" */
  function openProject(card) {
    lastFocus = document.activeElement;
    pj.classList.remove('pj--serie');
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
    } else if (card.getAttribute('data-proj') === 'tears') {
      var figs = tearsFigs();
      var grid = document.createElement('div'); grid.className = 'pj__grid';
      figs.forEach(function (f, i) { grid.appendChild(shotButton(f, figs, i, false)); });
      pjContent.appendChild(grid);
    }
    /* contenu complémentaire écrit dans la page (ressources, vidéos, personnages, décors) : <template class="pj-extra"> */
    var art = card.closest ? card.closest('.card') : card.parentNode;
    var tpl = art && art.querySelector('template.pj-extra');
    if (tpl && tpl.content) {
      pjContent.appendChild(tpl.content.cloneNode(true));
      var items = Array.prototype.slice.call(pjContent.querySelectorAll('.pj__res-item'));
      var list = items.map(function (b) { var im = b.querySelector('img'); return { full: b.getAttribute('data-full'), alt: im ? im.alt : '', cap: b.getAttribute('data-cap') || '' }; });
      items.forEach(function (b, i) { b.addEventListener('click', function () { lbOpenAt(list, i); }); });
      /* une seule vidéo joue à la fois */
      var vids = Array.prototype.slice.call(pjContent.querySelectorAll('video'));
      vids.forEach(function (v) { v.addEventListener('play', function () { vids.forEach(function (o) { if (o !== v) { try { o.pause(); } catch (e) {} } }); }); });
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
    pj.classList.add('pj--serie');
    openOverlay();
    crs = makeCarousel(pjContent, figs);
  }

  /* ---------- fiche d'une série : une seule bobine de pellicule que l'on fait défiler ----------
     Toutes les photos sont des vues d'une même bande (perforations continues en haut et en bas, amorce avant la
     première vue et après la dernière) ; sous chaque vue, dans la marge, son numéro et ses réglages, comme les
     inscriptions d'un négatif. La vue au centre est éclairée, les autres restent dans l'ombre. Molette, glisser,
     flèches du clavier ou boutons pour avancer ; clic sur la vue du centre : visionneuse. */
  var crs = null;
  function makeCarousel(host, figs) {
    var n = figs.length;
    var root = document.createElement('div'); root.className = 'crs';
    root.innerHTML =
      '<div class="crs__vp" data-cursor="Glisser"><div class="crs__track"></div></div>' +
      '<div class="crs__bar">' +
        '<p class="crs__count" aria-live="polite"><span class="crs__num">01</span><small>/ ' + (n < 10 ? '0' : '') + n + '</small></p>' +
        '<div class="crs__info"><p class="crs__place"></p><p class="crs__hint mono" aria-hidden="true">Faire défiler <span>→</span></p><div class="crs__prog"><i></i></div></div>' +
        '<div class="crs__nav"><button class="crs__btn crs__prev" type="button" aria-label="Photo précédente">‹</button>' +
        '<button class="crs__btn crs__next" type="button" aria-label="Photo suivante">›</button></div>' +
      '</div>';
    host.appendChild(root);
    var vp = root.querySelector('.crs__vp'), track = root.querySelector('.crs__track');
    var numEl = root.querySelector('.crs__num'), placeEl = root.querySelector('.crs__place');
    var progEl = root.querySelector('.crs__prog i');
    var slides = figs.map(function (f, i) {
      var b = document.createElement('button');
      b.className = 'crs__slide'; b.type = 'button';
      b.style.setProperty('--i', i);
      b.setAttribute('aria-label', 'Photo ' + (i + 1) + ' sur ' + n + (f.place ? ', ' + f.place : ''));
      var pic = document.createElement('span'); pic.className = 'crs__pic';
      var im = document.createElement('img'); im.src = f.full; im.alt = f.alt || ''; im.decoding = 'async'; im.draggable = false;
      if (f.w && f.h) { im.width = f.w; im.height = f.h; }
      pic.appendChild(im); b.appendChild(pic);
      /* inscriptions de la marge, sous la vue : numéro de vue et réglages de prise de vue */
      var edge = document.createElement('span'); edge.className = 'crs__edge mono';
      var no = document.createElement('b'); no.textContent = (i + 1 < 10 ? '0' : '') + (i + 1) + ' ▸';
      var ex = document.createElement('span'); ex.textContent = (f.el && f.el.getAttribute('data-cap')) || '';
      edge.appendChild(no); edge.appendChild(ex); b.appendChild(edge);
      track.appendChild(b);
      b.addEventListener('click', function (e) {
        if (moved) { e.preventDefault(); return; }
        if (i === active) lbOpenAt(figs, i); else go(i);
      });
      return { el: b, pic: pic, img: im, f: f, c: 0, w: 0 };
    });
    var x = 0, target = 0, W = 0, active = -1, raf = 0, last = 0, snapT = 0, alive = true, touched = false;
    var dragging = false, moved = false, sx = 0, sxPos = 0, samples = [], pid = 0;
    var first = true;
    function posFor(i) { return W / 2 - slides[i].c; }
    /* géométrie de la bande, proportionnelle à sa hauteur : perforations, marges, écart entre les vues */
    function layout() {
      W = vp.clientWidth; var VH = vp.clientHeight; if (!W || !VH) return;
      var H = VH - 6;
      var hh = Math.max(7, Math.min(20, H * 0.024));            /* hauteur d'une perforation */
      var ho = hh * 0.65, band = 2 * ho + hh;                    /* bande des perforations */
      var tb = Math.max(18, Math.min(30, H * 0.036));            /* bande des inscriptions, sous la vue */
      var mt = band + tb * 0.3, mb = band + tb;
      var fg = Math.max(10, Math.min(26, H * 0.026));            /* écart entre deux vues */
      /* même hauteur d'image pour toutes les vues (une bande a une hauteur unique) */
      var ph = H - mt - mb;
      slides.forEach(function (s) {
        var ar = (s.f.w && s.f.h) ? s.f.w / s.f.h : 1.5;
        ph = Math.min(ph, W * (ar > 1 ? 0.8 : 0.6) / ar);
      });
      H = ph + mt + mb;
      var lead = W * 0.75, left = lead;
      track.style.height = Math.round(H) + 'px'; track.style.top = Math.round((VH - H) / 2) + 'px';
      track.style.paddingLeft = track.style.paddingRight = Math.round(lead) + 'px';
      track.style.columnGap = Math.round(fg) + 'px';
      var hp = hh * 2.5, hw = hh * 1.3;
      [['--hh', hh], ['--ho', ho], ['--hp', hp], ['--hg', hp - hw], ['--mt', mt], ['--tb', tb]].forEach(function (v) { track.style.setProperty(v[0], v[1].toFixed(1) + 'px'); });
      slides.forEach(function (s) {
        var ar = (s.f.w && s.f.h) ? s.f.w / s.f.h : 1.5, w = Math.round(ph * ar);
        s.el.style.width = s.pic.style.width = w + 'px'; s.pic.style.height = Math.round(ph) + 'px';
        s.w = w; s.c = left + w / 2; left += w + Math.round(fg);
      });
      var i = active < 0 ? 0 : active, t = posFor(i);
      /* à l'ouverture, la bande arrive de la droite, comme une pellicule qu'on tire */
      if (first) { first = false; target = t; x = REDUCE ? t : t + W * 0.55; kick(); }
      else if (raf) { x += t - target; target = t; }            /* mouvement en cours : on le poursuit */
      else { x = target = t; }
      render(); setActive(i, true);
    }
    function clampT(t) { return Math.max(posFor(n - 1), Math.min(posFor(0), t)); }
    function nearest(pos) {
      var best = 0, bd = 1e9;
      slides.forEach(function (s, i) { var d = Math.abs(posFor(i) - pos); if (d < bd) { bd = d; best = i; } });
      return best;
    }
    function setActive(i, force) {
      if (i === active && !force) return;
      active = i;
      slides.forEach(function (s, k) {
        s.el.classList.toggle('is-active', k === i);
        s.el.setAttribute('data-cursor', k === i ? 'Agrandir' : 'Voir');
      });
      var f = figs[i];
      numEl.textContent = (i + 1 < 10 ? '0' : '') + (i + 1);
      placeEl.textContent = f.place || '';
      root.querySelector('.crs__prev').disabled = i === 0;
      root.querySelector('.crs__next').disabled = i === n - 1;
    }
    function render() {
      track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
      var a = posFor(0), b = posFor(n - 1);
      progEl.style.width = (n > 1 ? Math.max(0, Math.min(1, (a - x) / (a - b))) * 100 : 100).toFixed(2) + '%';
      setActive(nearest(x));
    }
    function loop(ts) {
      if (!alive) return;
      var dt = last ? Math.min(64, ts - last) : 16; last = ts;
      if (!dragging) {
        var k = REDUCE ? 1 : 1 - Math.exp(-dt / 110);
        x += (target - x) * k;
        if (Math.abs(target - x) < 0.15) x = target;
      }
      render();
      if (dragging || x !== target) raf = requestAnimationFrame(loop); else { raf = 0; last = 0; }
    }
    function kick() { if (!raf) { last = 0; raf = requestAnimationFrame(loop); } }
    function touch() { if (!touched) { touched = true; root.classList.add('is-touched'); } }
    function go(i) { i = Math.max(0, Math.min(n - 1, i)); target = posFor(i); touch(); kick(); }
    /* position continue (0 = première photo, 1 = deuxième…) */
    function fracIndex(pos) {
      for (var i = 0; i < n - 1; i++) { var p = posFor(i), q = posFor(i + 1); if (pos <= p && pos >= q) return i + (p - pos) / (p - q); }
      return pos > posFor(0) ? 0 : n - 1;
    }
    /* après la molette, on se cale sur la photo suivante dans le sens du défilement (un cran suffit à changer de photo) */
    var wheelDir = 0, wheelFrom = null;
    function snapSoon(ms) {
      clearTimeout(snapT);
      snapT = setTimeout(function () {
        var f = fracIndex(target), tiny = wheelFrom !== null && Math.abs(target - wheelFrom) < 24;   /* frôlement du pavé tactile : on reste */
        var i = tiny ? Math.round(f) : wheelDir > 0 ? Math.ceil(f - 0.08) : wheelDir < 0 ? Math.floor(f + 0.08) : Math.round(f);
        target = posFor(Math.max(0, Math.min(n - 1, i))); wheelDir = 0; wheelFrom = null; kick();
      }, ms);
    }
    /* molette (et pavé tactile) : on fait défiler, puis on se cale sur la photo la plus proche */
    function onWheel(e) {
      if (lbOpen) return;
      if (!vp.contains(e.target) && pj.scrollHeight > pj.clientHeight + 2) return;   /* petite fenêtre : la fiche défile d'abord */
      var dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (e.deltaMode === 1) dx *= 32; else if (e.deltaMode === 2) dx *= W;
      if (!dx) return;
      e.preventDefault();
      if (wheelFrom === null) wheelFrom = target;
      /* un cran de molette fait avancer d'environ une demi-photo : deux crans, la photo suivante */
      var step = n > 1 ? Math.abs(posFor(0) - posFor(n - 1)) / (n - 1) : 300;
      var a = posFor(0), b = posFor(n - 1), t = target - dx * Math.max(1.4, Math.min(4, step / 220));
      if (t > a) t = a + (t - a) * 0.35; if (t < b) t = b + (t - b) * 0.35;    /* un peu d'élasticité aux extrémités */
      target = Math.max(b - 90, Math.min(a + 90, t));
      wheelDir = dx > 0 ? 1 : -1;
      touch(); kick(); snapSoon(140);
    }
    /* glisser à la souris ou au doigt, avec élan */
    function onDown(e) {
      if (e.button !== undefined && e.button !== 0) return;
      dragging = true; moved = false; sx = e.clientX; sxPos = x; samples = [[performance.now(), x]]; pid = e.pointerId;
      kick();
    }
    function onMove(e) {
      if (!dragging) return;
      var d = e.clientX - sx;
      /* on ne capture le pointeur qu'une fois le geste engagé : un simple clic reste un clic sur la photo */
      if (!moved && Math.abs(d) > 6) { moved = true; vp.classList.add('is-drag'); try { vp.setPointerCapture(pid); } catch (er) {} }
      var t = sxPos + d, a = posFor(0), b = posFor(n - 1);
      if (t > a) t = a + (t - a) * 0.35; if (t < b) t = b + (t - b) * 0.35;
      x = target = t;
      samples.push([performance.now(), x]); if (samples.length > 6) samples.shift();
      if (moved) touch();
    }
    function onUp() {
      if (!dragging) return;
      dragging = false; vp.classList.remove('is-drag');
      var v = 0;
      if (samples.length > 1) { var p = samples[0], q = samples[samples.length - 1]; if (q[0] > p[0]) v = (q[1] - p[1]) / (q[0] - p[0]); }
      target = posFor(nearest(clampT(x + v * 260)));
      kick();
      setTimeout(function () { moved = false; }, 0);
    }
    vp.addEventListener('pointerdown', onDown);
    vp.addEventListener('pointermove', onMove);
    vp.addEventListener('pointerup', onUp);
    vp.addEventListener('pointercancel', onUp);
    pj.addEventListener('wheel', onWheel, { passive: false });
    root.querySelector('.crs__prev').addEventListener('click', function () { go(active - 1); });
    root.querySelector('.crs__next').addEventListener('click', function () { go(active + 1); });
    window.addEventListener('resize', layout);
    layout(); requestAnimationFrame(layout);
    slides.forEach(function (s) { if (!s.img.complete) s.img.addEventListener('load', function () { if (alive) render(); }); });
    return {
      key: function (k) {
        if (k === 'ArrowRight') { go(active + 1); return true; }
        if (k === 'ArrowLeft') { go(active - 1); return true; }
        if (k === 'Home') { go(0); return true; }
        if (k === 'End') { go(n - 1); return true; }
        return false;
      },
      sync: function (i) { if (i !== active) { target = posFor(i); kick(); } },
      destroy: function () {
        alive = false; cancelAnimationFrame(raf); clearTimeout(snapT);
        pj.removeEventListener('wheel', onWheel); window.removeEventListener('resize', layout);
      }
    };
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

  /* ---------- outils SVG et chargement de fichiers (cartes des séries) ---------- */
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
    var gL = svgEl('g', { 'class': 'zleads' });
    var halo = svgEl('circle', { 'class': 'globe__halo', r: 14 }); var pin = svgEl('circle', { 'class': 'globe__pin', r: 6 });
    svg.appendChild(gPan); svg.appendChild(gL); svg.appendChild(halo); svg.appendChild(pin);
    stage.appendChild(svg);
    var shots = document.createElement('div'); shots.className = 'stageshots'; stage.appendChild(shots);
    var st = { serie: serie, stage: stage, svg: svg, gG: gG, sphere: sphere, grat: grat, land: land, gR: gR, rPath: rPath, gC: gC, cOut: cOut, cLines: cLines, gP: gP, gPan: gPan, gL: gL, halo: halo, pin: pin,
               shots: shots, figs: figs, located: located, center: center, extent: extent, layers: null, state: 'idle', raf: 0, W: 0, H: 0, cx: 0, cy: 0, R0: 0, Zf: 1, Zr: 1, t0: null, ready: false,
               pinPos: [], leads: [], pinEls: [], shotEls: [], leadGeo: [], leadLen: [], shotOn: [], revRaf: 0, revDone: false,
               panQ: 0, panK: -1, panRaf: 0, oRf: 1 };
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
      shots.appendChild(b); st.shotEls.push(b);
    });
    return st;
  }
  /* glissement de la carte : q = 0 (carte centrée) à 1 (lieu hors champ amené au centre) */
  function panOffset(st) {
    var k = st.panK, v = (k >= 0 && st.located[k] && st.located[k].pan) || { dx: 0, dy: 0 };
    return { dx: v.dx * st.panQ, dy: v.dy * st.panQ };
  }
  /* trace la ligne de rappel k sur une longueur len (Infinity = jusqu'à la photo), depuis l'épingle (décalée par le glissement) */
  function setLead(st, k, len) {
    var g = st.leadGeo[k], ld = st.leads[k]; if (!g || !ld) return;
    var o = panOffset(st), x1 = g.px + o.dx, y1 = g.py + o.dy, dx = g.cx - x1, dy = g.cy - y1, L = Math.hypot(dx, dy) || 1;
    var t = Math.max(0, Math.min(1, len / L));
    ld.setAttribute('x1', x1.toFixed(1)); ld.setAttribute('y1', y1.toFixed(1));
    ld.setAttribute('x2', (x1 + dx * t).toFixed(1)); ld.setAttribute('y2', (y1 + dy * t).toFixed(1));
  }
  /* glissement de la carte : q = 0 (carte centrée) à 1 (lieu hors champ amené au centre). Les autres lignes de rappel
     restent visibles : elles pointent hors de la carte, vers Barcelone, comme une direction à suivre */
  function applyPan(st, q) {
    var o = panOffset(st);
    st.gPan.setAttribute('transform', 'translate(' + o.dx.toFixed(1) + ' ' + o.dy.toFixed(1) + ')');
    st.located.forEach(function (f, i) { setLead(st, i, st.leadLen[i] || 0); });
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
  /* placement des vignettes : on part des positions voulues (data-sx / data-sy) puis on les écarte jusqu'à ce que
     chacune reste dans la carte (marge intérieure), garde un écart minimal avec ses voisines et ne cache aucune épingle */
  function placeShots(st, pins) {
    var W = st.W, H = st.H;
    var M = Math.max(16, Math.min(W, H) * 0.045), G = Math.max(14, W * 0.024), RP = 14;
    var B = st.located.map(function (f, k) {
      var el = st.shotEls[k], w = el ? el.offsetWidth : 0, h = el ? el.offsetHeight : 0;
      var a = Math.abs(f.sr) * DEG, s = f.ss * 1.04;   /* 1,04 : de quoi grandir au survol sans toucher la voisine */
      return { x: f.sx / 100 * W, y: f.sy / 100 * H,
               hw: (w * Math.cos(a) + h * Math.sin(a)) * s / 2, hh: (w * Math.sin(a) + h * Math.cos(a)) * s / 2 };
    });
    var clamp = function (b) {
      var lo = M + b.hw, hi = W - M - b.hw; b.x = lo > hi ? W / 2 : Math.min(hi, Math.max(lo, b.x));
      lo = M + b.hh; hi = H - M - b.hh; b.y = lo > hi ? H / 2 : Math.min(hi, Math.max(lo, b.y));
    };
    B.forEach(clamp);
    for (var it = 0; it < 500; it++) {
      var moved = 0, i, j;
      for (i = 0; i < B.length; i++) for (j = i + 1; j < B.length; j++) {
        var a = B[i], b = B[j], dx = b.x - a.x, dy = b.y - a.y;
        var ox = a.hw + b.hw + G - Math.abs(dx), oy = a.hh + b.hh + G - Math.abs(dy);
        if (ox <= 0.5 || oy <= 0.5) continue;
        if (ox < oy) { var px = (dx > 0 || (dx === 0 && i < j) ? 1 : -1) * ox / 2; a.x -= px; b.x += px; }
        else { var py = (dy > 0 || (dy === 0 && i < j) ? 1 : -1) * oy / 2; a.y -= py; b.y += py; }
        moved++;
      }
      pins.forEach(function (p) {
        if (!p.on) return;
        B.forEach(function (b) {
          var dx = b.x - p.x, dy = b.y - p.y, ox = b.hw + RP - Math.abs(dx), oy = b.hh + RP - Math.abs(dy);
          if (ox <= 0.5 || oy <= 0.5) return;
          if (ox < oy) b.x += (dx >= 0 ? 1 : -1) * ox; else b.y += (dy >= 0 ? 1 : -1) * oy;
          moved++;
        });
      });
      B.forEach(clamp);
      if (!moved) break;
    }
    B.forEach(function (b, k) {
      var el = st.shotEls[k]; if (!el) return;
      el.style.left = (b.x / W * 100).toFixed(3) + '%'; el.style.top = (b.y / H * 100).toFixed(3) + '%';
    });
    return B;
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
    var pins = st.located.map(function (f) {
      var p = orthoPoint(f.lon, f.lat, st.cx, st.cy, st.R0, st.Zf, lon0, lat0);
      p.on = p.v && p.x >= 0 && p.x <= W && p.y >= 0 && p.y <= H;
      f.pan = (p.x < -m || p.x > W + m || p.y < -m || p.y > H + m) ? { dx: W * 0.5 - p.x, dy: H * 0.5 - p.y } : null;
      return p;
    });
    var spots = placeShots(st, pins);
    st.leadGeo = [];
    st.located.forEach(function (f, k) {
      var p = pins[k], b = spots[k];
      var lead = svgEl('line', { 'class': 'map__lead', x1: p.x.toFixed(1), y1: p.y.toFixed(1), x2: p.x.toFixed(1), y2: p.y.toFixed(1) });
      st.gL.appendChild(lead);
      var ring = svgEl('circle', { 'class': 'map__ring', cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: 7 });
      ring.style.setProperty('--pd', (k * 0.35) + 's');
      var dot = svgEl('circle', { 'class': 'map__pin', cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: 4.5 });
      st.gP.appendChild(ring); st.gP.appendChild(dot);
      st.pinPos.push(p); st.leads.push(lead); st.pinEls.push([ring, dot]);
      /* longueur jusqu'au bord de la photo (le trait « arrive » sur elle) et point d'entrée dans la carte (épingle hors champ) */
      var dx = b.x - p.x, dy = b.y - p.y, L = Math.hypot(dx, dy) || 1;
      var inner = Math.min(dx ? (b.hw / 1.04) / Math.abs(dx) : 1e9, dy ? (b.hh / 1.04) / Math.abs(dy) : 1e9);
      var edge = Math.max(0, 1 - Math.min(1, inner)) * L;
      var t0 = 0, t1 = 1;
      [[-dx, p.x], [dx, W - p.x], [-dy, p.y], [dy, H - p.y]].forEach(function (c) {
        if (c[0] === 0) { if (c[1] < 0) t1 = -1; return; }
        var r = c[1] / c[0];
        if (c[0] < 0) t0 = Math.max(t0, r); else t1 = Math.min(t1, r);
      });
      var start = t0 <= t1 ? Math.min(edge, t0 * L) : 0;
      st.leadGeo.push({ px: p.x, py: p.y, cx: b.x, cy: b.y, L: L, edge: edge, start: start });
      if (st.leadLen[k] === undefined) st.leadLen[k] = 0;
      setLead(st, k, st.leadLen[k]);
    });
    if (st.state === 'map') { renderFrame(st, lon0, lat0, st.Zf, true); applyPan(st, st.panQ); }
    else if (st.state === 'idle') renderFrame(st, startLon(st), 12, 1, false);
    /* la scène était déjà à l'écran avant d'être prête (rafraîchissement directement sur Photos) : on lance le vol maintenant */
    if (st.pending && st.state === 'idle') { st.pending = false; playStage(st); }
  }
  /* apparition, une fois le zoom fini : toutes les épingles ensemble, puis chaque pointillé se trace à vitesse constante
     vers sa photo, qui apparaît dès que son trait l'atteint (les traits courts finissent donc les premiers) */
  function startReveal(st) {
    st.stage.classList.add('is-pins');
    var n = st.located.length, PIN = REDUCE ? 0 : 520;
    var showShot = function (k) { if (st.shotOn[k]) return; st.shotOn[k] = true; st.leadLen[k] = Infinity; setLead(st, k, Infinity); if (st.shotEls[k]) st.shotEls[k].classList.add('is-on'); };
    if (REDUCE) { for (var i = 0; i < n; i++) showShot(i); st.revDone = true; return; }
    var span = 0; st.leadGeo.forEach(function (g) { span = Math.max(span, g.edge - g.start); });
    var v = Math.max(230, span / 1.5), t0 = null;
    var step = function (ts) {
      if (st.state !== 'map') return;
      if (!t0) t0 = ts;
      var e = (ts - t0 - PIN) / 1000, left = 0;
      if (e > 0) {
        for (var k = 0; k < n; k++) {
          if (st.shotOn[k]) continue;
          var g = st.leadGeo[k]; if (!g) continue;
          var len = g.start + v * e;
          if (len >= g.edge) showShot(k); else { st.leadLen[k] = len; setLead(st, k, len); left++; }
        }
      } else left = n;
      if (left) st.revRaf = requestAnimationFrame(step); else { st.revRaf = 0; st.revDone = true; }
    };
    st.revRaf = requestAnimationFrame(step);
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
    if (REDUCE) { st.state = 'map'; renderFrame(st, st.center.lon, st.center.lat, st.Zf, true); startReveal(st); return; }
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
      else { st.state = 'map'; startReveal(st); }
    };
    st.raf = requestAnimationFrame(step);
  }
  function resetStage(st) {
    if (st.raf) cancelAnimationFrame(st.raf);
    if (st.panRaf) cancelAnimationFrame(st.panRaf);
    if (st.revRaf) cancelAnimationFrame(st.revRaf);
    st.revRaf = 0; st.revDone = false;
    st.located.forEach(function (f, k) { st.leadLen[k] = 0; st.shotOn[k] = false; if (st.shotEls[k]) st.shotEls[k].classList.remove('is-on'); });
    st.panRaf = 0; st.panQ = 0; st.panK = -1; applyPan(st, 0);
    st.state = 'idle'; st.pending = false;
    st.stage.classList.remove('is-map', 'is-pins');
    if (st.ready) renderFrame(st, startLon(st), 12, 1, false);
  }
  var stages = [];
  function initStages() {
    if (stages.length) { checkSoon(); return; }
    if (narrowMQ && narrowMQ.matches) return;
    loadGlobe(function () {
      seriesEls.forEach(function (serie) { var st = setupStage(serie); if (st) stages.push(st); });
      if (!stages.length) return;
      layoutSeries();
      var tick = setInterval(function () {
        var all = true;
        stages.forEach(function (st) { if (!st.ready) fitStage(st); if (!st.ready) all = false; });
        if (all) clearInterval(tick);
      }, 150);
      window.addEventListener('scroll', checkSoon, { passive: true });
      window.addEventListener('resize', checkSoon);
      checkStages();
    });
  }
  /* une série joue quand sa carte est assez visible ; dès qu'une autre série occupe plus de 55 % de la hauteur de l'écran
     (et plus que celle-ci), elle revient à zéro, pour rejouer quand on y revient */
  function checkStages() {
    var vh = window.innerHeight || 1;
    var vis = stages.map(function (st) {
      var r = st.serie.getBoundingClientRect(), s = st.stage.getBoundingClientRect();
      var vs = Math.max(0, Math.min(vh, r.bottom) - Math.max(0, r.top));
      var ss = s.height ? Math.max(0, Math.min(vh, s.bottom) - Math.max(0, s.top)) / s.height : 0;
      return { serie: vs / vh, stage: ss, inView: s.height > 0 && s.bottom > 0 && s.top < vh };
    });
    stages.forEach(function (st, i) {
      var v = vis[i], beaten = false;
      vis.forEach(function (w, j) { if (j !== i && w.serie >= 0.55 && w.serie > v.serie) beaten = true; });
      if (!v.inView || beaten) { if (st.state !== 'idle' || st.pending) resetStage(st); }
      else if (v.stage >= 0.35) playStage(st);
    });
  }
  var checkRaf = 0;
  function checkSoon() { if (!checkRaf) checkRaf = requestAnimationFrame(function () { checkRaf = 0; checkStages(); }); }
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
    if (narrowMQ && narrowMQ.matches) { stage.style.removeProperty('--sh'); serie.style.removeProperty('--cmax'); return; }
    /* la rangée entière (titre, description, couverture, légende) doit tenir dans 85 % de la hauteur de l'écran :
       on mesure tout ce qui n'est pas la photo, et la photo prend le reste */
    var head = serie.querySelector('.serie__head'), cover = serie.querySelector('.serie__cover'), img = serie.querySelector('.serie__cimg img');
    if (head && cover && img) {
      var headH = head.offsetHeight + (parseFloat(getComputedStyle(head).marginBottom) || 0);
      var chrome = headH + cover.offsetHeight - img.offsetHeight;
      var mh = Math.max(280, Math.min(1000, window.innerHeight * 0.85 - chrome));
      serie.style.setProperty('--cmax', Math.floor(mh) + 'px');
    }
    void serie.offsetHeight;
    stage.style.setProperty('--sh', film.offsetHeight + 'px');
    stages.forEach(function (st) { if (st.serie === serie) fitStage(st); });
  }
  function layoutSeries() { seriesEls.forEach(layoutOne); if (stages.length) checkSoon(); }
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
      else if (crs && crs.key(e.key)) e.preventDefault();
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
  /* en quittant la page Photos, les cartes reviennent à zéro (elles rejoueront au retour) */
  (function () {
    var pv = document.querySelector('[data-view="photos"]');
    if (!pv || !window.MutationObserver) return;
    new MutationObserver(function () {
      if (pv.hasAttribute('hidden')) stages.forEach(function (st) { if (st.state !== 'idle' || st.pending) resetStage(st); });
    }).observe(pv, { attributes: true, attributeFilter: ['hidden'] });
  })();
})();
