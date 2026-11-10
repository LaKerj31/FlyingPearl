/* Flying Pearl : traînée orange qui suit le curseur puis s'efface.
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

  var LIFE = 520;   /* durée de vie d'un point de la traînée, en ms */
  var MAX = 60;     /* nombre de points gardés au maximum */
  var R = 1, W = 0, H = 0, pts = [], raf = 0;

  function size() {
    R = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * R); cv.height = Math.round(H * R);
  }
  size();
  window.addEventListener('resize', size);

  function add(e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    var last = pts[pts.length - 1];
    if (last && Math.abs(last.x - e.clientX) + Math.abs(last.y - e.clientY) < 2) return;
    pts.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    if (pts.length > MAX) pts.shift();
    if (!raf) raf = requestAnimationFrame(draw);
  }
  window.addEventListener('pointermove', add, { passive: true });
  document.addEventListener('mouseleave', function () { pts.length = 0; });

  function seg(a, b, c, alpha, k, glow) {
    /* courbe lissée : du milieu (a,b) au milieu (b,c), en passant par b */
    ctx.beginPath();
    ctx.moveTo((a.x + b.x) / 2, (a.y + b.y) / 2);
    ctx.quadraticCurveTo(b.x, b.y, (b.x + c.x) / 2, (b.y + c.y) / 2);
    if (glow) { ctx.strokeStyle = 'rgba(255,90,31,' + (0.16 * alpha).toFixed(3) + ')'; ctx.lineWidth = 10 * (0.35 + 0.65 * k); }
    else { ctx.strokeStyle = 'rgba(255,90,31,' + alpha.toFixed(3) + ')'; ctx.lineWidth = 2 * (0.45 + 0.55 * k); }
    ctx.stroke();
  }

  function draw(now) {
    raf = 0;
    while (pts.length && now - pts[0].t > LIFE) pts.shift();
    ctx.setTransform(R, 0, 0, R, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var n = pts.length;
    if (n > 2) {
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (var pass = 0; pass < 2; pass++) {
        for (var i = 1; i < n - 1; i++) {
          var life = 1 - (now - pts[i].t) / LIFE;
          if (life <= 0) continue;
          var k = i / (n - 1); /* 0 = queue, 1 = tête */
          seg(pts[i - 1], pts[i], pts[i + 1], life * k, k, pass === 0);
        }
      }
      /* dernier bout, jusqu'à la position exacte du curseur */
      var p = pts[n - 2], q = pts[n - 1], lq = 1 - (now - q.t) / LIFE;
      if (lq > 0) {
        ctx.beginPath(); ctx.moveTo((p.x + q.x) / 2, (p.y + q.y) / 2); ctx.lineTo(q.x, q.y);
        ctx.strokeStyle = 'rgba(255,90,31,' + lq.toFixed(3) + ')'; ctx.lineWidth = 2; ctx.stroke();
      }
    }
    if (pts.length) raf = requestAnimationFrame(draw);
  }
})();
