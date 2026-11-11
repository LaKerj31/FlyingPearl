/* Flying Pearl : traînée du curseur.
   Une petite toile carrée (.cursor__trail), enfant du curseur perle et centrée sur lui : la traînée part donc toujours du
   centre de la perle (le point orange), sans décalage possible. On y dessine le chemin que la souris vient de parcourir :
   la traînée épouse les courbes du mouvement, s'affine et s'estompe vers sa pointe, puis s'efface doucement à l'arrêt.
   Souris uniquement (rien sur écran tactile), rien si l'utilisateur a demandé moins d'animations.
   La toile est petite (pas de dessin plein écran) et la boucle s'arrête dès que la traînée a disparu. */
(function () {
  'use strict';
  var mq = window.matchMedia;
  if (!mq || !mq('(hover: hover) and (pointer: fine)').matches || mq('(prefers-reduced-motion: reduce)').matches) return;
  var cv = document.querySelector('.cursor__trail');
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext('2d');
  if (!ctx) return;

  var MAXLEN = 460;   /* longueur maximale de la traînée, en px */
  var LIFE = 640;     /* durée de vie d'un point du chemin, en ms : c'est le temps que met la traînée à s'effacer */
  var HALF = MAXLEN + 24, SIZE = HALF * 2;   /* la toile couvre la traînée la plus longue, dans toutes les directions */
  var R = Math.min(2, window.devicePixelRatio || 1);
  cv.style.setProperty('--ts', SIZE + 'px');
  cv.width = cv.height = Math.round(SIZE * R);

  var pts = [];       /* chemin récent : { x, y, t }, du plus ancien au plus récent (coordonnées écran) */
  var x = 0, y = 0, raf = 0;

  window.addEventListener('pointermove', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY;
    var last = pts[pts.length - 1];
    if (!last || Math.abs(last.x - x) + Math.abs(last.y - y) >= 2) {
      pts.push({ x: x, y: y, t: performance.now() });
      if (pts.length > 160) pts.shift();
    }
    if (!raf) raf = requestAnimationFrame(frame);
  }, { passive: true });
  document.addEventListener('mouseleave', function () { pts.length = 0; clear(); });

  function clear() { ctx.setTransform(R, 0, 0, R, 0, 0); ctx.clearRect(0, 0, SIZE, SIZE); }

  function frame(now) {
    raf = 0;
    while (pts.length && now - pts[0].t > LIFE) pts.shift();
    clear();
    var n = pts.length;
    if (!n) return;
    /* chemin vu depuis la perle : du curseur (au centre de la toile) vers le passé, avec pour chaque point sa « force »
       f (1 près de la perle, 0 à la pointe), qui baisse avec la distance parcourue et avec l'âge du point */
    var P = [{ x: HALF, y: HALF, f: 1 }], len = 0, px = x, py = y;
    for (var i = n - 1; i >= 0 && len < MAXLEN; i--) {
      var p = pts[i], d = Math.sqrt((p.x - px) * (p.x - px) + (p.y - py) * (p.y - py));
      if (d < 0.5) continue;
      var qx = p.x, qy = p.y;
      if (len + d > MAXLEN) { var k = (MAXLEN - len) / d; qx = px + (p.x - px) * k; qy = py + (p.y - py) * k; d = MAXLEN - len; }
      len += d; px = qx; py = qy;
      var f = Math.min(1 - len / MAXLEN, 1 - (now - p.t) / LIFE);
      P.push({ x: qx - x + HALF, y: qy - y + HALF, f: f > 0 ? f : 0 });
    }
    var m = P.length;
    if (m > 1) {
      /* tracé lissé : chaque tronçon va du milieu d'un segment au milieu du suivant, en passant par le point (courbe) ;
         deux passes : un halo large et léger, puis le trait, de plus en plus fin et transparent vers la pointe */
      ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
      for (var pass = 0; pass < 2; pass++) {
        for (var j = 0; j < m - 1; j++) {
          var a = P[j], b = P[j + 1], c = P[j + 2];
          var fj = (a.f + b.f) / 2; if (fj <= 0.004) continue;
          ctx.beginPath();
          if (j === 0) ctx.moveTo(a.x, a.y); else ctx.moveTo((P[j - 1].x + a.x) / 2, (P[j - 1].y + a.y) / 2);
          if (j === 0) ctx.lineTo((a.x + b.x) / 2, (a.y + b.y) / 2);
          else ctx.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2);
          if (!c && j > 0) ctx.lineTo(b.x, b.y);
          if (pass === 0) { ctx.strokeStyle = 'rgba(255,90,31,' + (0.15 * fj).toFixed(3) + ')'; ctx.lineWidth = 3 + 12 * fj; }
          else { ctx.strokeStyle = 'rgba(255,90,31,' + (0.92 * Math.pow(fj, 1.25)).toFixed(3) + ')'; ctx.lineWidth = 0.5 + 4.7 * fj; }
          ctx.stroke();
        }
      }
    }
    raf = requestAnimationFrame(frame);
  }
})();
