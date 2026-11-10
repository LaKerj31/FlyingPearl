/* Flying Pearl : queue de comète du curseur.
   La queue (.cursor__tail) est un enfant du curseur perle, ancrée au centre de la perle (le point orange) : elle le suit
   donc exactement, sans aucun décalage possible. Ce script ne fait que deux choses : l'orienter à l'opposé du mouvement
   et l'allonger selon la vitesse ; à l'arrêt, elle se rétracte dans la perle.
   Souris uniquement (rien sur écran tactile), rien si l'utilisateur a demandé moins d'animations.
   Aucun dessin plein écran : une seule transformation par image, et la boucle s'arrête dès que la queue a disparu. */
(function () {
  'use strict';
  var mq = window.matchMedia;
  if (!mq || !mq('(hover: hover) and (pointer: fine)').matches || mq('(prefers-reduced-motion: reduce)').matches) return;
  var tail = document.querySelector('.cursor__tail');
  if (!tail) return;

  var BASE = 120;     /* longueur de l'élément en CSS, en px (mise à l'échelle ensuite) */
  var MAXLEN = 150;   /* longueur maximale de la queue, en px */
  var GAIN = 0.075;   /* px de queue par px/s de vitesse */
  var SMOOTH = 0.3;   /* lissage de la vitesse (direction et longueur), par image à 60 i/s */

  var raf = 0, x = 0, y = 0, lx = 0, ly = 0, vx = 0, vy = 0, has = false, lastT = 0;

  window.addEventListener('pointermove', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY;
    if (!has) { has = true; lx = x; ly = y; lastT = performance.now(); }
    if (!raf) raf = requestAnimationFrame(frame);
  }, { passive: true });
  document.addEventListener('mouseleave', function () { has = false; vx = vy = 0; hide(); });

  function hide() { tail.style.transform = 'scaleX(0)'; }

  function frame(now) {
    raf = 0;
    if (!has) { hide(); return; }
    var dt = Math.min(0.05, Math.max(0.001, (now - lastT) / 1000)); lastT = now;
    /* vitesse instantanée depuis l'image précédente, lissée pour que la queue tourne en douceur */
    var ivx = (x - lx) / dt, ivy = (y - ly) / dt; lx = x; ly = y;
    var a = 1 - Math.pow(1 - SMOOTH, dt * 60);
    vx += (ivx - vx) * a; vy += (ivy - vy) * a;
    var sp = Math.sqrt(vx * vx + vy * vy), len = Math.min(MAXLEN, sp * GAIN);
    if (len > 1) {
      /* direction opposée au mouvement : la queue reste pile dans l'axe, derrière la perle */
      tail.style.transform = 'rotate(' + Math.atan2(-vy, -vx).toFixed(4) + 'rad) scaleX(' + (len / BASE).toFixed(4) + ')';
      raf = requestAnimationFrame(frame);
    } else if (sp > 5) { hide(); raf = requestAnimationFrame(frame); }
    else { vx = vy = 0; hide(); }
  }
})();
