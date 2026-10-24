/* IA — collection TEARS : chargement fiable des images + lightbox (autonome, sans toucher au routage par hash) */
(function () {
  'use strict';
  var items = Array.prototype.slice.call(document.querySelectorAll('.tears'));
  if (!items.length || !document.body) return;

  /* --- chargement des images quand la vue IA est visible ---
     loading="lazy" ne se déclenche pas sous le scroll lissé Lenis (défilement par transform),
     donc on force le chargement dès que la vue IA n'est plus masquée. */
  function loadGallery() {
    items.forEach(function (b) {
      var im = b.querySelector('img');
      if (!im) return;
      im.loading = 'eager';
      if (!im.complete || !im.naturalWidth) {
        var s = im.getAttribute('src');
        if (s) im.setAttribute('src', s);
      }
    });
    var poster = document.querySelector('.show__video');
    if (poster) { var p = poster.getAttribute('poster'); if (p) poster.setAttribute('poster', p); }
  }
  var iaView = document.querySelector('[data-view="ia"]');
  if (iaView) {
    if (!iaView.hasAttribute('hidden')) loadGallery();
    try {
      new MutationObserver(function () { if (!iaView.hasAttribute('hidden')) loadGallery(); })
        .observe(iaView, { attributes: true, attributeFilter: ['hidden'] });
    } catch (e) { loadGallery(); }
  } else {
    loadGallery();
  }

  /* --- lightbox --- */
  var figs = items.map(function (b) {
    var im = b.querySelector('img');
    return { full: b.getAttribute('data-full') || (im && im.src) || '', alt: (im && im.alt) || '', tag: b.getAttribute('data-tag') || '' };
  });

  var idx = 0, isOpen = false, lastFocus = null;

  var ov = document.createElement('div');
  ov.className = 'lb';
  ov.setAttribute('aria-hidden', 'true');
  ov.setAttribute('role', 'dialog');
  ov.setAttribute('aria-modal', 'true');
  ov.setAttribute('aria-label', 'Collection TEARS, visionneuse');
  ov.innerHTML =
    '<div class="lb__bg" data-close></div>' +
    '<figure class="lb__fig">' +
      '<img class="lb__img" alt="">' +
      '<figcaption class="lb__cap mono"></figcaption>' +
    '</figure>' +
    '<button class="lb__btn lb__prev" type="button" aria-label="Image precedente">‹</button>' +
    '<button class="lb__btn lb__next" type="button" aria-label="Image suivante">›</button>' +
    '<button class="lb__btn lb__close" type="button" aria-label="Fermer" data-close>✕</button>';
  document.body.appendChild(ov);

  var img = ov.querySelector('.lb__img');
  var cap = ov.querySelector('.lb__cap');
  var btnClose = ov.querySelector('.lb__close');

  function show(i) {
    idx = (i % figs.length + figs.length) % figs.length;
    var f = figs[idx];
    img.src = f.full;
    img.alt = f.alt;
    cap.textContent = (f.tag ? f.tag + ' · ' : '') + 'TEARS — ' + (idx + 1) + '/' + figs.length;
  }
  function openLb(i) {
    lastFocus = document.activeElement;
    show(i);
    isOpen = true;
    ov.classList.add('is-open');
    ov.setAttribute('aria-hidden', 'false');
    try { document.documentElement.style.overflow = 'hidden'; } catch (e) {}
    btnClose.focus();
  }
  function closeLb() {
    isOpen = false;
    ov.classList.remove('is-open');
    ov.setAttribute('aria-hidden', 'true');
    try { document.documentElement.style.overflow = ''; } catch (e) {}
    img.src = '';
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
  }

  items.forEach(function (b, i) {
    b.addEventListener('click', function () { openLb(i); });
  });
  ov.addEventListener('click', function (e) {
    if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-close')) closeLb();
  });
  ov.querySelector('.lb__prev').addEventListener('click', function () { show(idx - 1); });
  ov.querySelector('.lb__next').addEventListener('click', function () { show(idx + 1); });
  document.addEventListener('keydown', function (e) {
    if (!isOpen) return;
    if (e.key === 'Escape' || e.key === 'Esc') closeLb();
    else if (e.key === 'ArrowLeft') show(idx - 1);
    else if (e.key === 'ArrowRight') show(idx + 1);
  });
})();
