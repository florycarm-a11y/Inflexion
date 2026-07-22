/* ==========================================================================
   INFLEXION — LE DELTA · assets/tree.js
   --------------------------------------------------------------------------
   L'arborescence n'est plus un dessin en dur : les chemins SVG sont générés
   à partir des positions réelles du contenu, via les ancres [data-delta] :

     data-delta="2"  → cartes d'analyses   (génération 2, #C42300, 2.5px)
     data-delta="3"  → dépêches            (génération 3, #8A1800, 1.5px)
     data-delta="4"  → dossiers d'archives (génération 4, #3E5C3A, 0.75px)

   Chaque branche est greffée sur le parent le plus proche en abscisse et
   passe derrière sa carte (les cartes ont un fond papier, z-index 2).
   La page survit donc à des contenus de longueur variable : ajouter,
   retirer ou allonger une carte redessine le delta.

   ≤ 800px : rivière verticale unique dans la marge gauche (--river),
   avec une bifurcation locale par carte.

   API publique : window.InflexionDelta.rebuild() — à appeler après toute
   injection dynamique de contenu (CMS).
   ========================================================================== */

(() => {
  "use strict";

  const svg = document.querySelector(".delta-tree");
  const main = document.querySelector("main");
  if (!svg || !main) return;

  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)");
  const MOBILE = window.matchMedia("(max-width: 800px)");

  const q = (s) => document.querySelector(s);
  const qa = (s) => Array.from(document.querySelectorAll(s));
  const deltaAnchors = (generation) =>
    qa(`[data-delta="${generation}"]`).filter((el) => !el.hidden);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const r1 = (n) => Math.round(n * 10) / 10;

  let branches = [];
  let frame = 0;
  let lastHeight = 0;

  /* ---------------------------------------------------------------- mesure */

  // Coordonnées d'un élément dans le repère de <main> (= repère du SVG).
  const measure = (el, ref) => {
    const r = el.getBoundingClientRect();
    return {
      x: r.left + r.width / 2 - ref.left,
      left: r.left - ref.left,
      top: r.top - ref.top,
      bottom: r.bottom - ref.top,
    };
  };

  /* ------------------------------------------------------------- géométrie */

  // Doucine : verticale, courbe en S vers l'axe de l'enfant, puis verticale
  // jusqu'au point de bifurcation suivant. Même vocabulaire de courbe que
  // le dessin original.
  const ogee = (px, py, cx, ey, settleY) => {
    if (Math.abs(px - cx) < 1) {
      return `M ${r1(px)} ${r1(py)} L ${r1(px)} ${r1(ey)}`;
    }
    const cy = py + (settleY - py) * 0.52;
    return (
      `M ${r1(px)} ${r1(py)} ` +
      `C ${r1(px)} ${r1(cy)}, ${r1(cx)} ${r1(cy)}, ${r1(cx)} ${r1(settleY)} ` +
      `L ${r1(cx)} ${r1(ey)}`
    );
  };

  // Ordonnée où la branche rejoint l'axe de sa carte : avant la carte,
  // jamais trop raide, jamais au-delà de la fin de branche.
  const settle = (startY, endY, cardTop) => {
    const s = Math.min(cardTop - 60, startY + 520);
    return clamp(s, Math.min(startY + 200, endY - 40), endY - 40);
  };

  const nearest = (x, nodes) =>
    nodes.reduce((best, n) =>
      Math.abs(n.x - x) < Math.abs(best.x - x) ? n : best
    );

  /* -------------------------------------------------- topologie bureau */

  const buildDesktop = (ref) => {
    const wordmark = q(".wordmark");
    const analyses = q("#analyses");
    const depeches = q("#depeches");
    const archives = q("#archives");
    const index = q(".archive-index");
    if (!wordmark || !analyses || !depeches || !archives || !index) return [];

    const g2 = deltaAnchors(2).map((el) => measure(el, ref));
    const g3 = deltaAnchors(3).map((el) => measure(el, ref));
    const g4 = deltaAnchors(4).map((el) => measure(el, ref));
    if (!g2.length || !g4.length) return [];

    // Points de bifurcation : frontières réelles entre générations.
    const y0 = measure(wordmark, ref).bottom + 18; // source, sous le logotype
    const y1 = measure(analyses, ref).top + 24;    // fin du tronc
    const y2 = measure(depeches, ref).top - 48;    // fin des analyses
    const y3 = measure(archives, ref).top + 4;     // fin des dépêches
    const y4 = measure(index, ref).top + 28;       // embouchure (archives)
    if (!(y0 < y1 && y1 < y2 && y2 < y3 && y3 < y4)) return [];

    const rootX = ref.width / 2;
    const specs = [];

    // Génération 1 — le fleuve source.
    specs.push({ gen: 1, from: y0, to: y1, d: ogee(rootX, y0, rootX, y1, y1) });

    // Génération 2 — une branche par analyse.
    const nodes2 = g2.map((c) => {
      specs.push({ gen: 2, from: y1, to: y2, d: ogee(rootX, y1, c.x, y2, settle(y1, y2, c.top)) });
      return { x: c.x };
    });

    // Génération 3 — une branche par dépêche, greffée sur l'analyse la plus
    // proche en abscisse.
    const nodes3 = g3.map((c) => {
      const p = nearest(c.x, nodes2);
      specs.push({ gen: 3, from: y2, to: y3, d: ogee(p.x, y2, c.x, y3, settle(y2, y3, c.top)) });
      return { x: c.x };
    });

    // Génération 4 — archives (vert), greffées sur la dépêche la plus proche.
    g4.forEach((c) => {
      const p = nearest(c.x, nodes3.length ? nodes3 : nodes2);
      specs.push({ gen: 4, from: y3, to: y4, d: ogee(p.x, y3, c.x, y4, settle(y3, y4, c.top)) });
    });

    return specs;
  };

  /* -------------------------------------------------- topologie mobile */

  const buildMobile = (ref) => {
    const header = q(".site-header");
    const analyses = q("#analyses");
    const depeches = q("#depeches");
    const archives = q("#archives");
    const index = q(".archive-index");
    if (!header || !analyses || !depeches || !archives || !index) return [];

    const tx = 22; // lit de la rivière, dans la marge --river
    const y0 = measure(header, ref).bottom + 12;
    const y1 = measure(analyses, ref).top + 16;
    const y2 = measure(depeches, ref).top + 16;
    const y3 = measure(archives, ref).top + 16;
    const y4 = measure(index, ref).top + 24;
    if (!(y0 < y1 && y1 < y2 && y2 < y3 && y3 < y4)) return [];

    const specs = [];

    // Rivière : un segment continu par génération (échelle et teinte exactes).
    const seg = (gen, a, b) =>
      specs.push({ gen, from: a, to: b, d: `M ${tx} ${r1(a)} L ${tx} ${r1(b)}` });
    seg(1, y0, y1);
    seg(2, y1, y2);
    seg(3, y2, y3);
    seg(4, y3, y4);

    // Bifurcations locales : une par carte, de la rivière vers la carte.
    const spur = (c, gen) => {
      const y = c.top + 18;
      const ex = Math.max(tx + 14, c.left - 10);
      specs.push({
        gen,
        from: y - 72,
        to: y,
        d:
          `M ${tx} ${r1(y - 72)} ` +
          `C ${tx} ${r1(y - 26)}, ${r1(tx + (ex - tx) * 0.4)} ${r1(y)}, ${r1(ex)} ${r1(y)}`,
      });
    };
    deltaAnchors(2).forEach((el) => spur(measure(el, ref), 2));
    deltaAnchors(3).forEach((el) => spur(measure(el, ref), 3));
    deltaAnchors(4).forEach((el) => spur(measure(el, ref), 4));

    return specs;
  };

  /* ---------------------------------------------------------- (re)dessin */

  // Fenêtre de tracé : une branche commence à se dessiner quand son origine
  // franchit 78 % de la hauteur de fenêtre, et s'achève quand son embouchure
  // la franchit — avec un léger tuilage parent/enfant, comme l'original.
  const rebuild = () => {
    const ref = main.getBoundingClientRect();
    const W = Math.max(1, Math.round(ref.width));
    const H = Math.max(1, Math.round(ref.height));
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("preserveAspectRatio", "none");

    const specs = MOBILE.matches ? buildMobile(ref) : buildDesktop(ref);

    const vh = window.innerHeight;
    const scrollable = Math.max(1, document.documentElement.scrollHeight - vh);
    const reveal = (y) => clamp((y - vh * 0.78) / scrollable, 0, 1);

    const groups = { 1: [], 2: [], 3: [], 4: [] };
    for (const s of specs) {
      const a = clamp(reveal(s.from) - 0.015, 0, 0.985);
      const b = Math.max(a + 0.02, reveal(s.to));
      groups[s.gen].push(
        `<path class="delta-branch" pathLength="1" data-start="${a.toFixed(4)}" data-end="${b.toFixed(4)}" d="${s.d}"></path>`
      );
    }

    svg.innerHTML = [1, 2, 3, 4]
      .map(
        (g) =>
          `<g class="generation generation-${g}${g === 4 ? " archive-branches" : ""}">${groups[g].join("")}</g>`
      )
      .join("");

    branches = qa(".delta-branch");
    lastHeight = H;
    draw();
  };

  const draw = () => {
    frame = 0;

    if (REDUCED.matches) {
      branches.forEach((p) => (p.style.strokeDashoffset = "0"));
      return;
    }

    const scrollable =
      document.documentElement.scrollHeight - window.innerHeight;
    const progress =
      scrollable > 0 ? clamp(window.scrollY / scrollable, 0, 1) : 1;

    for (const p of branches) {
      const start = Number(p.dataset.start ?? 0);
      const end = Number(p.dataset.end ?? 1);
      const local = clamp((progress - start) / (end - start), 0, 1);
      p.style.strokeDashoffset = String(1 - local);
    }
  };

  const requestDraw = () => {
    if (!frame) frame = requestAnimationFrame(draw);
  };

  let resizeTimer = 0;
  const requestRebuild = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(rebuild, 120);
  };

  /* ------------------------------------------------------------- écouteurs */

  window.addEventListener("scroll", requestDraw, { passive: true });
  window.addEventListener("resize", requestRebuild);
  MOBILE.addEventListener("change", rebuild);
  REDUCED.addEventListener("change", rebuild);

  // Reflow des polices ou variation de hauteur du contenu → régénération.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(rebuild);
  }
  new ResizeObserver(() => {
    const h = Math.round(main.getBoundingClientRect().height);
    if (Math.abs(h - lastHeight) > 4) requestRebuild();
  }).observe(main);

  window.InflexionDelta = { rebuild };

  rebuild();
})();
