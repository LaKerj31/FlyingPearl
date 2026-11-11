/* Flying Pearl : traînée du curseur.
   Une toile fixe (.ctrail) couvre l'écran, juste sous le curseur perle. On y dessine le chemin que la souris vient de
   parcourir : la traînée part du centre de la perle (le point orange), épouse les courbes du mouvement, s'affine et
   s'estompe vers sa pointe, puis s'efface à l'arrêt.
   Sa longueur n'est pas bornée : chaque point du chemin vit un temps donné (LIFE). Un geste rapide laisse donc une
   traînée longue, un geste lent une traînée courte.
   Souris uniquement (rien sur écran tactile), rien si l'utilisateur a demandé moins d'animations.
   La toile est dimensionnée sur sa taille réelle à l'écran (clientWidth, sans la barre de défilement) : ses coordonnées
   sont alors exactement celles de la souris. On n'efface que la zone dessinée ; dès que la traînée a disparu, la boucle
   s'arrête et la toile est masquée. */
(function () {
  'use strict';
  var mq = window.matchMedia;
  if (!mq || !mq('(hover: hover) and (pointer: fine)').matches || mq('(prefers-reduced-motion: reduce)').matches) return;
  var cv = document.querySelector('.ctrail');
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext('2d');
  if (!ctx) return;

  var LIFE = 620;     /* durée de vie d'un point du chemin, en ms : c'est le temps que met la traînée à s'effacer */
  var RING = 44;      /* rayon de l'anneau du curseur (état « mot »), en px */
  var cur = document.querySelector('.cursor');
  var R = 1, W = 0, H = 0;
  var pts = [];       /* chemin récent : { x, y, t }, du plus ancien au plus récent (coordonnées écran) */
  var x = 0, y = 0, raf = 0;
  var dirty = null;   /* zone dessinée à l'image précédente : [x0, y0, x1, y1] */

  function size() {
    R = Math.min(2, window.devicePixelRatio || 1);
    W = cv.clientWidth || window.innerWidth; H = cv.clientHeight || window.innerHeight;
    cv.width = Math.round(W * R); cv.height = Math.round(H * R);
    dirty = null;
  }
  size();
  window.addEventListener('resize', size);
  /* la toile n'est affichée que le temps de la traînée : au repos, aucun calque plein écran au-dessus de la page */
  var shown = true;
  function show(v) { if (v !== shown) { shown = v; cv.style.visibility = v ? '' : 'hidden'; } }
  show(false);

  window.addEventListener('pointermove', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY;
    var last = pts[pts.length - 1];
    if (!last || Math.abs(last.x - x) + Math.abs(last.y - y) >= 2) {
      pts.push({ x: x, y: y, t: performance.now() });
      if (pts.length > 400) pts.shift();
    }
    if (!raf) { show(true); raf = requestAnimationFrame(frame); }
  }, { passive: true });
  document.addEventListener('mouseleave', function () { pts.length = 0; clear(); show(false); });

  function clear() {
    ctx.setTransform(R, 0, 0, R, 0, 0);
    if (dirty) ctx.clearRect(dirty[0], dirty[1], dirty[2] - dirty[0], dirty[3] - dirty[1]);
    dirty = null;
  }

  function frame(now) {
    raf = 0;
    while (pts.length && now - pts[0].t > LIFE) pts.shift();
    clear();
    var n = pts.length;
    if (!n) { show(false); return; }
    /* chemin vu depuis la perle : du curseur vers le passé, avec pour chaque point sa « force » f (1 à la perle, 0 à la
       pointe), qui ne dépend que de son âge */
    /* quand le curseur est un grand anneau avec un mot (« Entrer », « Lecture »…), la traînée part du bord de l'anneau
       et non de son centre : le mot reste lisible */
    var lab = !!cur && cur.classList.contains('is-label');
    var P = [{ x: x, y: y, f: lab ? 0 : 1 }], px = x, py = y;
    var x0 = x, y0 = y, x1 = x, y1 = y;
    for (var i = n - 1; i >= 0; i--) {
      var p = pts[i];
      if (Math.abs(p.x - px) + Math.abs(p.y - py) < 0.5) continue;
      var f = 1 - (now - p.t) / LIFE;
      if (lab) { var dd = Math.sqrt((p.x - x) * (p.x - x) + (p.y - y) * (p.y - y)); f *= dd <= RING ? 0 : Math.min(1, (dd - RING) / 26); }
      P.push({ x: p.x, y: p.y, f: f > 0 ? f : 0 });
      px = p.x; py = p.y;
      if (p.x < x0) x0 = p.x; else if (p.x > x1) x1 = p.x;
      if (p.y < y0) y0 = p.y; else if (p.y > y1) y1 = p.y;
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
      dirty = [Math.max(0, x0 - 12), Math.max(0, y0 - 12), Math.min(W, x1 + 12), Math.min(H, y1 + 12)];
    }
    raf = requestAnimationFrame(frame);
  }
})();
