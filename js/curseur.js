/* Flying Pearl : traînée du curseur, comme la queue d'une comète.
   Elle part toujours de la perle du curseur et s'étire exactement à l'opposé du mouvement (dans son axe),
   d'autant plus longue qu'on va vite ; quand le curseur s'arrête, elle se rétracte dans la perle et disparaît.
   Souris uniquement (rien sur écran tactile), rien si l'utilisateur a demandé moins d'animations.
   La boucle d'affichage s'arrête d'elle-même dès que la traînée a disparu. */
(function () {
  'use strict';
  var mq = window.matchMedia;
  if (!mq || !mq('(hover: hover) and (pointer: fine)').matches || mq('(prefers-reduced-motion: reduce)').matches) return;

  var cv = document.createElement('canvas');
  cv.className = 'ctrail';
  cv.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cv);
  var ctx = cv.getContext('2d');
  if (!ctx) return;

  var MAXLEN = 170;   /* longueur maximale de la queue, en px */
  var GAIN = 0.085;   /* px de queue par px/s de vitesse */
  var SMOOTH = 0.28;  /* lissage de la vitesse (direction et longueur), par image à 60 i/s */
  var STEPS = 14;     /* découpage de la queue pour le dégradé */

  var R = 1, W = 0, H = 0, raf = 0;
  var x = 0, y = 0, lx = 0, ly = 0, vx = 0, vy = 0, has = false, lastT = 0, len = 0;

  function size() {
    R = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * R); cv.height = Math.round(H * R);
  }
  size();
  window.addEventListener('resize', size);

  window.addEventListener('pointermove', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY;
    if (!has) { has = true; lx = x; ly = y; lastT = performance.now(); }
    if (!raf) raf = requestAnimationFrame(frame);
  }, { passive: true });
  document.addEventListener('mouseleave', function () { has = false; vx = vy = 0; len = 0; clear(); });

  function clear() { ctx.setTransform(R, 0, 0, R, 0, 0); ctx.clearRect(0, 0, W, H); }

  function frame(now) {
    raf = 0;
    if (!has) { clear(); return; }
    var dt = Math.min(0.05, Math.max(0.001, (now - lastT) / 1000)); lastT = now;
    /* vitesse instantanée depuis l'image précédente, lissée pour que la queue tourne en douceur */
    var ivx = (x - lx) / dt, ivy = (y - ly) / dt; lx = x; ly = y;
    var a = 1 - Math.pow(1 - SMOOTH, dt * 60);
    vx += (ivx - vx) * a; vy += (ivy - vy) * a;
    var sp = Math.sqrt(vx * vx + vy * vy);
    len = Math.min(MAXLEN, sp * GAIN);

    clear();
    if (len > 1.5) {
      var ux = -vx / sp, uy = -vy / sp;    /* direction opposée au mouvement */
      var bend = Math.min(0.18, len / MAXLEN * 0.18);
      var nx = -uy * len * bend, ny = ux * len * bend; /* très légère courbure, comme la comète du logo */
      ctx.lineCap = 'round';
      for (var pass = 0; pass < 2; pass++) {
        for (var i = 0; i < STEPS; i++) {
          var t0 = i / STEPS, t1 = (i + 1) / STEPS;
          var p0x = x + ux * len * t0 + nx * t0 * t0, p0y = y + uy * len * t0 + ny * t0 * t0;
          var p1x = x + ux * len * t1 + nx * t1 * t1, p1y = y + uy * len * t1 + ny * t1 * t1;
          var f = 1 - t0;                   /* 1 contre la perle, 0 au bout de la queue */
          ctx.beginPath(); ctx.moveTo(p0x, p0y); ctx.lineTo(p1x, p1y);
          if (pass === 0) { ctx.strokeStyle = 'rgba(255,90,31,' + (0.18 * f).toFixed(3) + ')'; ctx.lineWidth = 3 + 9 * f; }
          else { ctx.strokeStyle = 'rgba(255,90,31,' + f.toFixed(3) + ')'; ctx.lineWidth = 0.6 + 2.2 * f; }
          ctx.stroke();
        }
      }
    }
    /* on continue tant que la queue n'est pas rétractée */
    if (len > 0.5 || sp > 5) raf = requestAnimationFrame(frame);
    else { vx = vy = 0; clear(); }
  }
})();
