// Peças desenhadas do tema "Isaías 41:10" (Não temas): a mão de luz que desce do alto (a destra da justiça; Deus não é
// retratado como pessoa) e a orbe de presença que acompanha quem caminha. Tudo em tons pastéis, desenhado em código; cada
// função desenha em coordenadas locais.
(function (G) {
  'use strict';
  const { clamp, lerp, css, rgb } = G.U;
  const R = G.Seres91, ml = R.ml, brilhoRadial = R.brilhoRadial, brilho4 = R.brilho4;
  const K = G.SeresM.K;
  const TAU = Math.PI * 2;

  // ---------------------------------------------------------------- mão de luz, com a palma para baixo e os dedos apontando para baixo
  // (x, y) = centro da palma; o: alfa, brilho 0..1, rot, antebraco (comprimento do braço de luz que sobe, 0 = sem)
  function maoLuz(ctx, x, y, s, o) {
    o = o || {};
    const A = o.alfa === undefined ? 1 : o.alfa, br = clamp(o.brilho || 0), ante = o.antebraco === undefined ? 520 : o.antebraco;
    if (A < 0.01) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(o.rot || 0); ctx.globalAlpha *= A;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; brilhoRadial(ctx, 0, 30, 220 + 80 * br, K.luzOuro, 0.35 + 0.3 * br); ctx.restore();
    if (ante > 0) {                                                                     // o braço de luz: bordas macias dos lados e some para cima
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const N = 24;
      for (let i = 0; i < N; i++) {
        const u0 = i / N, u1 = (i + 1) / N, y0 = lerp(-ante, -6, u0), y1 = lerp(-ante, -6, u1), f = u0 * u0, w = lerp(24, 36, u0);
        const g = ctx.createLinearGradient(-w, 0, w, 0);
        g.addColorStop(0, css(K.luzOuro, 0)); g.addColorStop(0.5, css(K.luz, 0.55 * f)); g.addColorStop(1, css(K.luzOuro, 0));
        ctx.fillStyle = g; ctx.fillRect(-w, y0, 2 * w, y1 - y0 + 1);
      }
      ctx.restore();
    }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const cor = css(K.luz, 0.8), som = css(K.ouroForte, 0.9);
    ctx.fillStyle = cor; ctx.strokeStyle = som; ctx.lineWidth = 3; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.roundRect(-34, -8, 68, 72, 22); ctx.fill(); ctx.stroke();                          // palma
    for (const [dx, len] of [[-26, 56], [-9, 70], [9, 66], [26, 52]]) {                                    // dedos para baixo
      ctx.beginPath(); ctx.roundRect(dx - 8, 52, 16, len, 8); ctx.fill(); ctx.stroke();
    }
    ctx.save(); ctx.translate(-38, 18); ctx.rotate(0.9); ctx.beginPath(); ctx.roundRect(-8, -4, 16, 46, 8); ctx.fill(); ctx.stroke(); ctx.restore();   // polegar
    ctx.restore();
    ctx.restore();
  }

  // ---------------------------------------------------------------- orbe de presença (centro em 0,0); brilho 0..1
  function orbe(ctx, x, y, s, o) {
    o = o || {};
    const A = o.alfa === undefined ? 1 : o.alfa, br = clamp(o.brilho || 0), t = o.t || 0;
    if (A < 0.01) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= A; ctx.globalCompositeOperation = 'lighter';
    brilhoRadial(ctx, 0, 0, 150 + 70 * br, K.luzOuro, 0.4 + 0.3 * br);
    brilhoRadial(ctx, 0, 0, 52, K.luz, 0.85);
    ctx.fillStyle = css(K.luz, 0.95); brilho4(ctx, 0, 0, 26 + 12 * br);
    for (let i = 0; i < 6; i++) {
      const a = t * 0.9 + (i / 6) * TAU, r = 48 + 8 * Math.sin(t * 2 + i);
      ctx.fillStyle = css(K.luz, 0.8); brilho4(ctx, Math.cos(a) * r, Math.sin(a) * r * 0.7, 6 + 2 * Math.sin(t * 3 + i));
    }
    ctx.restore();
  }

  G.SeresI = { maoLuz, orbe };
})(window);
