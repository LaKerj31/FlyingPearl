/* IA : Derniers projets. Clic sur une couverture = entrer dans le projet
   (visionneuse d'images pour TEARS, lecteur vidéo pour le SHOW).
   Autonome, sans toucher au routage par hash. */
(function () {
  'use strict';
  var cards = Array.prototype.slice.call(document.querySelectorAll('.card__cover'));
  if (!cards.length || !document.body) return;

  /* --- chargement fiable des couvertures quand la vue IA est visible ---
     (loading differe + scroll lisse Lenis ne declenche pas toujours le chargement) */
  function loadCovers() {
    cards.forEach(function (c) {
      var im = c.querySelector('img');
      if (!im) return;
      im.loading = 'eager';
      if (!im.complete || !im.naturalWidth) {
        var s = im.getAttribute('src');
        if (s) im.setAttribute('src', s);
      }
    });
  }
  var iaView = document.querySelector('[data-view="ia"]');
  if (iaView) {
    if (!iaView.hasAttribute('hidden')) loadCovers();
    try {
      new MutationObserver(function () { if (!iaView.hasAttribute('hidden')) loadCovers(); })
        .observe(iaView, { attributes: true, attributeFilter: ['hidden'] });
    } catch (e) { loadCovers(); }
  } else {
    loadCovers();
  }

  /* --- données de la collection TEARS (pour la visionneuse) --- */
  var figs = Array.prototype.slice.call(document.querySelectorAll('.tears-src img')).map(function (im) {
    return { full: im.getAttribute('data-full') || im.src || '', alt: im.alt || '', tag: im.getAttribute('data-tag') || '' };
  });

  /* --- visionneuse d'images --- */
  var idx = 0, imgOpen = false, lastFocus = null;
  var lb = document.createElement('div');
  lb.className = 'lb';
  lb.setAttribute('aria-hidden', 'true');
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-label', 'Collection TEARS, visionneuse');
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

  function showImg(i) {
    if (!figs.length) return;
    idx = (i % figs.length + figs.length) % figs.length;
    var f = figs[idx];
    lbImg.src = f.full;
    lbImg.alt = f.alt;
    lbCap.textContent = (f.tag ? f.tag + ' · ' : '') + 'TEARS · ' + (idx + 1) + '/' + figs.length;
  }
  function openImg(i) {
    lastFocus = document.activeElement;
    showImg(i);
    imgOpen = true;
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    lockScroll(true);
    lbClose.focus();
  }
  function closeImg() {
    imgOpen = false;
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    lockScroll(false);
    lbImg.src = '';
    restoreFocus();
  }
  lb.addEventListener('click', function (e) {
    if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-close')) closeImg();
  });
  lb.querySelector('.lb__prev').addEventListener('click', function () { showImg(idx - 1); });
  lb.querySelector('.lb__next').addEventListener('click', function () { showImg(idx + 1); });

  /* --- lecteur video --- */
  var vidOpen = false;
  var vb = document.createElement('div');
  vb.className = 'vb';
  vb.setAttribute('aria-hidden', 'true');
  vb.setAttribute('role', 'dialog');
  vb.setAttribute('aria-modal', 'true');
  vb.setAttribute('aria-label', 'Lecteur video');
  vb.innerHTML =
    '<div class="vb__bg" data-vclose></div>' +
    '<div class="vb__wrap"><video class="vb__video" controls playsinline preload="metadata"></video></div>' +
    '<button class="vb__close" type="button" aria-label="Fermer" data-vclose>✕</button>';
  document.body.appendChild(vb);
  var vbVideo = vb.querySelector('.vb__video');
  var vbClose = vb.querySelector('.vb__close');

  function openVid(src, poster) {
    lastFocus = document.activeElement;
    if (poster) vbVideo.setAttribute('poster', poster);
    vbVideo.src = src;
    vidOpen = true;
    vb.classList.add('is-open');
    vb.setAttribute('aria-hidden', 'false');
    lockScroll(true);
    var p = vbVideo.play();
    if (p && p.catch) p.catch(function () {});
    vbClose.focus();
  }
  function closeVid() {
    vidOpen = false;
    vb.classList.remove('is-open');
    vb.setAttribute('aria-hidden', 'true');
    lockScroll(false);
    try { vbVideo.pause(); } catch (e) {}
    vbVideo.removeAttribute('src');
    try { vbVideo.load(); } catch (e) {}
    restoreFocus();
  }
  vb.addEventListener('click', function (e) {
    if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-vclose')) closeVid();
  });

  /* --- helpers --- */
  function lockScroll(on) { try { document.documentElement.style.overflow = on ? 'hidden' : ''; } catch (e) {} }
  function restoreFocus() { if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} } }

  /* --- liaisons cartes --- */
  cards.forEach(function (c) {
    var kind = c.getAttribute('data-proj');
    c.addEventListener('click', function () {
      if (kind === 'show') openVid(c.getAttribute('data-video'), c.querySelector('img') ? c.querySelector('img').src : '');
      else openImg(0);
    });
  });

  document.addEventListener('keydown', function (e) {
    if (imgOpen) {
      if (e.key === 'Escape' || e.key === 'Esc') closeImg();
      else if (e.key === 'ArrowLeft') showImg(idx - 1);
      else if (e.key === 'ArrowRight') showImg(idx + 1);
    } else if (vidOpen) {
      if (e.key === 'Escape' || e.key === 'Esc') closeVid();
    }
  });
})();
