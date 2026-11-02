// Peças desenhadas do tema "De Sião Sairá a Torá" (Isaías 2:2-4): o rolo de luz da Torá, a espada que vira arado, a lança que
// vira podão e a forja com o fogo. Tudo em tons pastéis, desenhado em código; cada função desenha em coordenadas locais
// (base em y = 0, salvo onde dito).
(function (G) {
  'use strict';
  const { clamp, lerp, smooth, css, rgb } = G.U;
  const R = G.Seres91, ml = R.ml, brilhoRadial = R.brilhoRadial;
  const K = Object.assign({}, G.SeresJ.K, {
    ferro: rgb('#b9bdd6'), ferroEsc: rgb('#8f93b4'), ferroLuz: rgb('#eef0fb'), cabo: rgb('#c49a72'), caboEsc: rgb('#a07a58'),
    pergaminho: rgb('#fff3d8'), pergaminhoSom: rgb('#ecd9b4'), tinta: rgb('#c9a679'),
  });
  const TAU = Math.PI * 2;

  // ---------------------------------------------------------------- o rolo da Torá, feito de luz (centro em 0,0); abre 0..1 estende o pergaminho; brilho 0..1
  function rolo(ctx, x, y, s, o) {
    o = o || {};
    const A = o.alfa === undefined ? 1 : o.alfa, ab = clamp(o.abre === undefined ? 1 : o.abre), br = clamp(o.brilho || 0), t = o.t || 0;
    if (A < 0.01) return;
    ctx.save(); ctx.translate(x, y + Math.sin(t * 1.3) * 5); ctx.scale(s, s); ctx.globalAlpha *= A;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    brilhoRadial(ctx, 0, 0, 360, K.luzOuro, 0.28 + 0.4 * br);
    brilhoRadial(ctx, 0, 0, 150, K.luz, 0.3 + 0.3 * br);
    ctx.restore();
    const w = 58 * ab + 6, h = 150;
    const g = ctx.createLinearGradient(-w, 0, w, 0);
    g.addColorStop(0, css(K.pergaminhoSom)); g.addColorStop(0.5, css(K.pergaminho)); g.addColorStop(1, css(K.pergaminhoSom));
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-w, -h / 2, 2 * w, h, 4); ctx.fill();
    ctx.strokeStyle = css(K.tinta, 0.8 * ab); ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < 9; i++) {                                                  // linhas de escrita, sem letras
      const yy = -h / 2 + 18 + i * 14, len = (0.5 + 0.5 * ((i * 37) % 7) / 7) * (w - 12);
      ctx.beginPath(); ctx.moveTo(-len, yy); ctx.lineTo(len, yy); ctx.stroke();
    }
    for (const lado of [-1, 1]) {                                                  // as duas hastes com as pontas de ouro
      const hx = lado * (w + 6);
      ctx.fillStyle = css(K.cabo); ctx.beginPath(); ctx.roundRect(hx - 5, -h / 2 - 14, 10, h + 28, 5); ctx.fill();
      ctx.fillStyle = css(K.caboEsc, 0.5); ctx.fillRect(hx + 1, -h / 2 - 12, 4, h + 24);
      for (const sy of [-1, 1]) { ctx.fillStyle = css(K.ouroForte); ctx.beginPath(); ctx.arc(hx, sy * (h / 2 + 18), 8, 0, TAU); ctx.fill(); ctx.fillStyle = css(K.luzOuro, 0.8); ctx.beginPath(); ctx.arc(hx - 2, sy * (h / 2 + 16), 3.2, 0, TAU); ctx.fill(); }
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- a espada que vira arado (u 0..1); haste em pé, base em 0,0
  function espadaArado(ctx, x, y, s, u, o) {
    o = o || {};
    const A = o.alfa === undefined ? 1 : o.alfa;
    if (A < 0.01) return;
    u = clamp(u);
    const brilho = Math.sin(Math.PI * clamp(u * 1.15)) * (u > 0 && u < 1 ? 1 : 0);
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(o.rot || 0); ctx.globalAlpha *= A;
    const P = [[[0, -196], [7, -168], [8, -62], [-8, -62], [-7, -168]], [[0, -84], [34, -52], [27, -6], [-27, -6], [-34, -52]]];   // lâmina -> relha do arado
    const pts = P[0].map((p, i) => [lerp(p[0], P[1][i][0], smooth(0.1, 0.9, u)), lerp(p[1], P[1][i][1], smooth(0.1, 0.9, u))]);
    const mad = smooth(0.35, 0.95, u);
    if (mad > 0.01) {                                                              // viga e rabiça de madeira
      ctx.strokeStyle = css(K.cabo, mad); ctx.lineCap = 'round'; ctx.lineWidth = 9;
      ctx.beginPath(); ctx.moveTo(0, -76); ctx.quadraticCurveTo(-8, -130, -40, -170); ctx.stroke();
      ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-22, -128); ctx.quadraticCurveTo(10, -150, 24, -196); ctx.stroke();
    }
    const gl = ctx.createLinearGradient(-30, 0, 30, 0);
    gl.addColorStop(0, css(K.ferro)); gl.addColorStop(0.5, css(K.ferroLuz)); gl.addColorStop(1, css(K.ferroEsc));
    ctx.fillStyle = gl; ctx.strokeStyle = css(K.ferroEsc, 0.8); ctx.lineWidth = 1.6; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); ctx.fill(); ctx.stroke();
    const gd = 1 - smooth(0.05, 0.5, u);                                           // guarda e cabo somem enquanto vira madeira
    if (gd > 0.01) {
      ctx.globalAlpha *= gd; ctx.fillStyle = css(K.ouroForte); ctx.beginPath(); ctx.roundRect(-30, -66, 60, 9, 4); ctx.fill();
      ctx.fillStyle = css(K.cabo); ctx.fillRect(-4, -57, 8, 40); ctx.fillStyle = css(K.ouroForte); ctx.beginPath(); ctx.arc(0, -14, 7, 0, TAU); ctx.fill();
    }
    if (brilho > 0.01) { ctx.globalAlpha = A; ctx.globalCompositeOperation = 'lighter'; brilhoRadial(ctx, 0, -100, 150, K.luzOuro, 0.6 * brilho); }
    ctx.restore();
  }

  // ---------------------------------------------------------------- a lança que vira podão (u 0..1)
  function lancaPodao(ctx, x, y, s, u, o) {
    o = o || {};
    const A = o.alfa === undefined ? 1 : o.alfa;
    if (A < 0.01) return;
    u = clamp(u);
    const brilho = Math.sin(Math.PI * clamp(u * 1.15)) * (u > 0 && u < 1 ? 1 : 0);
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(o.rot || 0); ctx.globalAlpha *= A;
    ctx.strokeStyle = css(K.cabo); ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -204); ctx.stroke();
    const k = smooth(0.15, 0.85, u);
    ctx.globalAlpha = A * (1 - k);                                                 // ponta de lança
    ctx.fillStyle = css(K.ferro); ctx.beginPath(); ctx.moveTo(0, -250); ctx.quadraticCurveTo(10, -226, 0, -204); ctx.quadraticCurveTo(-10, -226, 0, -250); ctx.fill();
    ctx.globalAlpha = A * k;                                                       // lâmina curva do podão
    ctx.fillStyle = css(K.ferro); ctx.strokeStyle = css(K.ferroEsc, 0.8); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(0, -210); ctx.quadraticCurveTo(34, -230, 32, -192); ctx.quadraticCurveTo(26, -172, 12, -176); ctx.quadraticCurveTo(24, -190, 18, -204); ctx.quadraticCurveTo(10, -214, 0, -204); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (brilho > 0.01) { ctx.globalAlpha = A; ctx.globalCompositeOperation = 'lighter'; brilhoRadial(ctx, 0, -210, 120, K.luzOuro, 0.6 * brilho); }
    ctx.restore();
  }

  // ---------------------------------------------------------------- a forja: bigorna, braseiro e o suporte com as armas que viram ferramentas (u 0..1)
  function forja(ctx, x, y, s, o) {
    o = o || {};
    const A = o.alfa === undefined ? 1 : o.alfa, u = clamp(o.u || 0), t = o.t || 0;
    if (A < 0.01) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= A;
    ctx.fillStyle = css(rgb('#8f86b8'), 0.16); ctx.beginPath(); ctx.ellipse(10, 6, 190, 14, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = css(K.caboEsc);                                                // suporte de madeira
    ctx.fillRect(-170, -150, 10, 150); ctx.fillRect(10, -150, 10, 150); ctx.fillRect(-176, -156, 202, 10);
    for (const [px, tipo] of [[-140, 0], [-110, 1], [-80, 0], [-50, 1], [-20, 0]]) {
      const uu = clamp(u * 1.6 - (px + 140) / 160 * 0.6);
      if (tipo === 0) espadaArado(ctx, px, 0, 0.62, uu, { rot: 0 }); else lancaPodao(ctx, px, 0, 0.5, uu, { rot: 0 });
    }
    const bx = 120;                                                                 // bigorna
    const g = ctx.createLinearGradient(0, -66, 0, 0);
    g.addColorStop(0, css(K.ferroLuz)); g.addColorStop(1, css(K.ferroEsc));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(bx - 56, -66); ctx.lineTo(bx + 70, -66); ctx.quadraticCurveTo(bx + 40, -52, bx + 24, -46); ctx.lineTo(bx + 30, -14); ctx.lineTo(bx + 46, 0); ctx.lineTo(bx - 34, 0); ctx.lineTo(bx - 18, -14); ctx.lineTo(bx - 14, -46); ctx.quadraticCurveTo(bx - 40, -54, bx - 56, -66); ctx.closePath(); ctx.fill();
    const f = 0.55 + 0.45 * Math.sin(t * 7) * Math.sin(t * 3.1);                    // o brilho do ferro quente sobre a bigorna
    const quente = Math.sin(Math.PI * clamp(u * 1.1)) * (u > 0 && u < 1 ? 1 : 0.15);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; brilhoRadial(ctx, bx + 6, -72, 120, K.luzOuro, (0.25 + 0.45 * quente) * f); ctx.restore();
    ctx.restore();
  }

  G.SeresZ = { K, rolo, espadaArado, lancaPodao, forja };
})(window);
