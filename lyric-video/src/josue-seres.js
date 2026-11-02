// Peças desenhadas do tema "Seja Forte e Corajoso" (Josué 1:9): o shofar com as ondas do som, a muralha da cidade que cai em
// poeira e luz, a pilha das doze pedras e o rio que se abre. Tudo em tons pastéis, desenhado em código; cada função desenha
// em coordenadas locais (base em y = 0, salvo onde dito).
(function (G) {
  'use strict';
  const { clamp, lerp, smooth, css, rgb, hash1 } = G.U;
  const R = G.Seres91, ml = R.ml, brilhoRadial = R.brilhoRadial, brilho4 = R.brilho4;
  const K = Object.assign({}, G.SeresM.K, {
    muro: rgb('#efe0cf'), muroSom: rgb('#d8c6b8'), muroLuz: rgb('#fff4e4'), poeira: rgb('#f1e4d6'),
    agua: rgb('#a9dbe6'), aguaClara: rgb('#d3f0f5'), aguaEsc: rgb('#8cc6d8'), areiaRio: rgb('#ecdcbc'), areiaRioEsc: rgb('#d8c6a2'),
  });
  const TAU = Math.PI * 2;

  // ---------------------------------------------------------------- shofar (a boca em 0,0, a curva sobe para a direita); som 0..1 solta ondas
  function shofar(ctx, x, y, s, o) {
    o = o || {};
    const A = o.alfa === undefined ? 1 : o.alfa, som = clamp(o.som || 0), t = o.t || 0;
    if (A < 0.01) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.dir || 1), s); ctx.rotate(o.rot || 0); ctx.globalAlpha *= A;
    const g = ctx.createLinearGradient(0, 0, 80, -60);
    g.addColorStop(0, css(K.luzOuro)); g.addColorStop(0.6, css(K.ouroForte)); g.addColorStop(1, css(K.ouroEsc));
    ctx.fillStyle = g; ctx.strokeStyle = css(K.ouroEsc, 0.9); ctx.lineWidth = 1.6; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(0, -5); ctx.quadraticCurveTo(46, -10, 70, -46); ctx.quadraticCurveTo(78, -62, 92, -64); ctx.lineTo(96, -52);
    ctx.quadraticCurveTo(84, -50, 78, -34); ctx.quadraticCurveTo(54, 6, 0, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = css(K.luz, 0.8); ctx.beginPath(); ctx.ellipse(-1, 0, 3, 6, 0, 0, TAU); ctx.fill();
    if (som > 0.02) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) {
        const u = ((t * 1.1 + i / 3) % 1), r = 30 + 150 * u;
        ctx.strokeStyle = css(K.luzOuro, 0.55 * som * (1 - u)); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(94, -58, r, -1.1, 0.55); ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- muralha da cidade, com a torre de cada ponta e o portão (base em y = 0, 640 de largura)
  // o: queda 0..1 (as colunas afundam em poeira e luz), luz 0..1, tint (função de cor), alfa
  function muralha(ctx, x, y, s, o) {
    o = o || {};
    const q = clamp(o.queda || 0), A = o.alfa === undefined ? 1 : o.alfa, tint = o.tint || ((c) => c), t = o.t || 0;
    if (A < 0.01) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= A;
    const N = 16, W = 40, H0 = 190;
    const cor = tint(K.muro, 0.9), som = tint(K.muroSom, 0.9);
    for (let i = 0; i < N; i++) {
      const x0 = -320 + i * W, d = hash1(i * 3.7) * 0.45, u = clamp((q - d) / 0.55);
      const torre = i === 0 || i === N - 1, h = (torre ? 270 : H0) * (1 - 0.8 * u * u), dx = (hash1(i * 7.3) - 0.5) * 30 * u, rot = (hash1(i * 5.1) - 0.5) * 0.25 * u;
      ctx.save(); ctx.translate(x0 + W / 2 + dx, 0); ctx.rotate(rot); ctx.globalAlpha *= 1 - 0.25 * u;
      const g = ctx.createLinearGradient(-W / 2, 0, W / 2, 0);
      g.addColorStop(0, css(cor)); g.addColorStop(1, css(som));
      ctx.fillStyle = g; ctx.fillRect(-W / 2, -h, W + 1, h);
      if (u < 0.3) { ctx.fillStyle = css(cor); for (const bx of [-W / 2, W / 6]) ctx.fillRect(bx, -h - 18, W / 3, 18); }   // ameias
      ctx.strokeStyle = css(som, 0.55); ctx.lineWidth = 2;
      for (let r = 1; r * 38 < h; r++) { ctx.beginPath(); ctx.moveTo(-W / 2, -r * 38); ctx.lineTo(W / 2, -r * 38); ctx.stroke(); }
      ctx.restore();
    }
    if (q < 0.4) {                                                                       // o portão
      ctx.fillStyle = css(tint(K.madeiraMEsc, 0.8), 1 - q * 2.2); ctx.beginPath(); ctx.moveTo(-44, 0); ctx.lineTo(-44, -96); ctx.quadraticCurveTo(0, -140, 44, -96); ctx.lineTo(44, 0); ctx.closePath(); ctx.fill();
    }
    if (q > 0.02) {                                                                      // poeira e luz que sobem
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      brilhoRadial(ctx, 0, -60, 420 * (0.4 + 0.6 * q), K.luzOuro, 0.55 * Math.sin(Math.PI * Math.min(1, q * 0.9 + 0.1)));
      ctx.restore();
      for (let i = 0; i < 18; i++) {
        const u = clamp(q * 1.1 - hash1(i * 2.9) * 0.3), px = -300 + hash1(i * 3.3) * 600, py = -40 - 160 * u * (0.5 + hash1(i)), r = 26 + 40 * u;
        ctx.fillStyle = css(K.poeira, 0.4 * Math.sin(Math.PI * Math.min(1, u))); ctx.beginPath(); ctx.arc(px + Math.sin(t + i) * 6, py, r, 0, TAU); ctx.fill();
      }
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- as doze pedras do memorial (base em y = 0); n 0..12 (fração conta a pedra que está subindo)
  function pedras12(ctx, x, y, s, n, t) {
    if (n < 0.01) return;
    const linhas = [[-66, 0], [-22, 0], [22, 0], [66, 0], [-44, -30], [0, -30], [44, -30], [-22, -60], [22, -60], [0, -88], [-66, -30], [66, -30]];
    const cores = [K.pedra, K.pedraEsc, K.areia, K.pedraB];
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = css(rgb('#8f86b8'), 0.16); ctx.beginPath(); ctx.ellipse(0, 6, 110, 11, 0, 0, TAU); ctx.fill();
    for (let i = 0; i < 12; i++) {
      const a = clamp(n - i);
      if (a <= 0) continue;
      const [px, py] = linhas[i], sobe = (1 - a) * 90;
      ctx.save(); ctx.globalAlpha *= clamp(a * 2.2);
      if (a < 1) { ctx.globalCompositeOperation = 'lighter'; brilhoRadial(ctx, px, py - 14 - sobe, 50, K.luzOuro, 0.5 * (1 - a)); ctx.globalCompositeOperation = 'source-over'; }
      ctx.fillStyle = css(cores[i % 4]); ctx.beginPath(); ctx.ellipse(px, py - 14 - sobe, 25, 16, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = css(K.luz, 0.45); ctx.beginPath(); ctx.ellipse(px - 7, py - 20 - sobe, 11, 6, -0.2, 0, TAU); ctx.fill();
      ctx.restore();
    }
    if (n >= 11.5) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; brilhoRadial(ctx, 0, -60, 150, K.luzOuro, 0.3 * clamp(n - 11.5, 0, 1) * (0.85 + 0.15 * Math.sin(t * 2))); ctx.restore(); }
    ctx.restore();
  }

  G.SeresJ = { K, shofar, muralha, pedras12 };
})(window);
