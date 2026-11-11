/* Flying Pearl : queue de comète du curseur.
   La queue (.cursor__tail) est un enfant du curseur perle, ancrée au centre de la perle (le point orange) : elle le suit
   donc exactement, sans aucun décalage possible. Ce script ne fait que l'orienter à l'opposé du mouvement et régler sa
   longueur : elle s'allonge vite avec la vitesse, puis se rétracte lentement dans la perle en s'estompant.
   Souris uniquement (rien sur écran tactile), rien si l'utilisateur a demandé moins d'animations.
   Aucun dessin plein écran : une transformation par image, et la boucle s'arrête dès que la queue a disparu. */
(function () {
  'use strict';
  var mq = window.matchMedia;
  if (!mq || !mq('(hover: hover) and (pointer: fine)').matches || mq('(prefers-reduced-motion: reduce)').matches) return;
  var tail = document.querySelector('.cursor__tail');
  if (!tail) return;

  var BASE = 120;      /* longueur de l'élément en CSS, en px (mise à l'échelle ensuite) */
  var MAXLEN = 440;    /* longueur maximale de la queue, en px */
  var GAIN = 0.21;     /* px de queue par px/s de vitesse */
  var SMOOTH = 0.26;   /* lissage de la vitesse (direction), par image à 60 i/s */
  var ATTACK = 0.2;    /* vitesse d'allongement, par image à 60 i/s */
  var RELEASE = 0.3;   /* temps de rétractation, en secondes (constante de temps : il reste 10 % après ~0,7 s) */
  var FADE = 90;       /* en dessous de cette longueur (px), la queue s'estompe au lieu de finir en moignon */

  var raf = 0, x = 0, y = 0, lx = 0, ly = 0, vx = 0, vy = 0, has = false, lastT = 0;
  var len = 0, ux = -1, uy = 0;   /* longueur affichée, et direction de la queue (opposée au mouvement) */

  window.addEventListener('pointermove', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY;
    if (!has) { has = true; lx = x; ly = y; lastT = performance.now(); }
    if (!raf) raf = requestAnimationFrame(frame);
  }, { passive: true });
  document.addEventListener('mouseleave', function () { has = false; vx = vy = 0; len = 0; hide(); });

  function hide() { tail.style.transform = 'scaleX(0)'; }

  function frame(now) {
    raf = 0;
    if (!has) { hide(); return; }
    var dt = Math.min(0.05, Math.max(0.001, (now - lastT) / 1000)); lastT = now;
    /* vitesse instantanée depuis l'image précédente, lissée pour que la queue tourne en douceur */
    var ivx = (x - lx) / dt, ivy = (y - ly) / dt; lx = x; ly = y;
    var a = 1 - Math.pow(1 - SMOOTH, dt * 60);
    vx += (ivx - vx) * a; vy += (ivy - vy) * a;
    var sp = Math.sqrt(vx * vx + vy * vy);
    if (sp > 14) {
      /* direction opposée au mouvement : la queue reste pile dans l'axe, derrière la perle. Si le mouvement tourne
         brusquement, la queue raccourcit d'autant (elle ne balaie pas l'écran) et repart dans le nouvel axe */
      var nx = -vx / sp, ny = -vy / sp, dot = nx * ux + ny * uy;
      if (dot < 1) len *= Math.max(0, dot);
      ux = nx; uy = ny;
    }
    /* à l'arrêt, on garde la dernière direction : la queue se rétracte lentement dans la perle */
    var target = Math.min(MAXLEN, sp * GAIN);
    len += (target - len) * (target > len ? 1 - Math.pow(1 - ATTACK, dt * 60) : 1 - Math.exp(-dt / RELEASE));
    if (len > 1.5) {
      tail.style.transform = 'rotate(' + Math.atan2(uy, ux).toFixed(4) + 'rad) scaleX(' + (len / BASE).toFixed(4) + ')';
      tail.style.setProperty('--to', Math.min(1, len / FADE).toFixed(3));
      raf = requestAnimationFrame(frame);
    } else if (sp > 5) { hide(); raf = requestAnimationFrame(frame); }
    else { vx = vy = 0; len = 0; hide(); }
  }
})();
