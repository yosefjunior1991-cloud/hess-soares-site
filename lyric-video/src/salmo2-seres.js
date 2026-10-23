// Peças desenhadas do tema "Salmo 2": a coroa de ouro, o cetro de luz, as correntes, as lanças e as bandeiras dos que se
// rebelam, as nuvens da tempestade, estilhaços de luz, a pequena cidade distante e a pomba que desce. Deus e o Ungido
// não são retratados como pessoas: a presença Deles é luz do alto, uma coroa e um cetro. Tudo em tons pastéis, desenhado
// em código; cada função desenha em coordenadas locais.
(function (G) {
  'use strict';
  const { clamp, lerp, smooth, mod, css, rgb, hash1 } = G.U;
  const R = G.Seres91, ml = R.ml, brilhoRadial = R.brilhoRadial, brilho4 = R.brilho4;
  const TAU = Math.PI * 2;
  const H = (hex) => rgb(hex);

  const K = Object.assign({}, G.SeresBS.K, {
    ferro: H('#b3b1c9'), ferroSom: H('#8f8dac'), ferroLuz: H('#e3e1f0'),
    nuvem: H('#9d98b8'), nuvemSom: H('#837ea4'), nuvemLuz: H('#c4c0d8'),
    ouroEsc: H('#e0a950'), joiaRosa: H('#f2a7bb'), joiaAzul: H('#9dbcf0'), joiaVerde: H('#9fdcc0'),
    cabo: H('#cdb094'),
  });

  // ---------------------------------------------------------------- coroa (base em y = 0, ~64 de largura)
  // o: brilho 0..1, alfa, rot
  function coroa(ctx, x, y, s, o) {
    o = o || {};
    const A = o.alfa === undefined ? 1 : o.alfa, br = clamp(o.brilho || 0);
    if (A < 0.01) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(o.rot || 0); ctx.globalAlpha *= A;
    if (br > 0.01) brilhoRadial(ctx, 0, -24, 120 + 40 * br, K.luzOuro, 0.6 * br);
    const g = ctx.createLinearGradient(0, -52, 0, 0);
    g.addColorStop(0, css(K.luz)); g.addColorStop(0.45, css(K.luzOuro)); g.addColorStop(1, css(K.ouroForte));
    ctx.fillStyle = g; ctx.strokeStyle = css(ml(K.ouroForte, K.ouroEsc, 0.65)); ctx.lineWidth = 2.4; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-31, 0); ctx.lineTo(-36, -40); ctx.lineTo(-17, -23); ctx.lineTo(0, -52); ctx.lineTo(17, -23); ctx.lineTo(36, -40); ctx.lineTo(31, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = css(ml(K.ouroForte, K.ouroEsc, 0.45)); ctx.beginPath(); ctx.roundRect(-32, -10, 64, 11, 3.5); ctx.fill();
    for (const [jx, jy, c, r] of [[0, -5, K.joiaRosa, 4.4], [-16, -5, K.joiaAzul, 3.4], [16, -5, K.joiaAzul, 3.4], [0, -52, K.joiaRosa, 3.2], [-36, -40, K.joiaVerde, 3], [36, -40, K.joiaVerde, 3]]) {
      ctx.fillStyle = css(c); ctx.beginPath(); ctx.arc(jx, jy, r, 0, TAU); ctx.fill();
      ctx.fillStyle = css(K.luz, 0.8); ctx.beginPath(); ctx.arc(jx - r * 0.3, jy - r * 0.3, r * 0.35, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- cetro de luz (base em y = 0, ~230 de altura)
  function cetro(ctx, x, y, s, o) {
    o = o || {};
    const A = o.alfa === undefined ? 1 : o.alfa, br = clamp(o.brilho || 0), t = o.t || 0;
    if (A < 0.01) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= A;
    brilhoRadial(ctx, 0, -120, 160 + 60 * br, K.luzOuro, 0.35 + 0.35 * br);
    const g = ctx.createLinearGradient(-6, 0, 6, 0);
    g.addColorStop(0, css(K.ouroEsc)); g.addColorStop(0.45, css(K.luz)); g.addColorStop(1, css(K.ouroForte));
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-5, -214, 10, 214, 5); ctx.fill();
    for (const yy of [-40, -100, -160]) { ctx.fillStyle = css(K.ouroForte); ctx.beginPath(); ctx.roundRect(-9, yy - 4, 18, 8, 3); ctx.fill(); }
    ctx.fillStyle = css(K.luzOuro); ctx.beginPath(); ctx.arc(0, -226, 15 + 1.5 * Math.sin(t * 2), 0, TAU); ctx.fill();
    ctx.strokeStyle = css(K.ouroEsc, 0.8); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -226, 15, 0, TAU); ctx.stroke();
    ctx.fillStyle = css(K.luz, 0.9); brilho4(ctx, 0, -226, 30 + 8 * br);
    ctx.restore();
  }

  // ---------------------------------------------------------------- corrente entre dois pontos (elos alternados, com folga)
  // o: sag (folga em px), alfa, quebra 0..1 (abre um vão no meio, as metades caem), n (tamanho do elo)
  function corrente(ctx, x1, y1, x2, y2, o) {
    o = o || {};
    const A = o.alfa === undefined ? 1 : o.alfa, sag = o.sag === undefined ? 26 : o.sag, q = clamp(o.quebra || 0), el = o.elo || 9;
    if (A < 0.01) return;
    const dist = Math.hypot(x2 - x1, y2 - y1), n = Math.max(4, Math.round(dist / (el * 1.15)));
    ctx.save(); ctx.globalAlpha *= A;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      let x = lerp(x1, x2, u), y = lerp(y1, y2, u) + sag * 4 * u * (1 - u);
      if (q > 0.01) {
        const lado = u < 0.5 ? -1 : 1, fall = q * q * (60 + 120 * hash1(i * 3.1));
        x += lado * q * 26 * (1 - Math.abs(u - 0.5) * 1.2); y += fall * (0.4 + Math.abs(u - 0.5));
        ctx.globalAlpha = A * (1 - smooth(0.55, 1, q));
      }
      const ang = Math.atan2(y2 - y1, x2 - x1) + (i % 2 ? 0 : Math.PI / 2) + (q > 0.01 ? q * (hash1(i) - 0.5) * 4 : 0);
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      ctx.strokeStyle = css(K.ferroSom); ctx.lineWidth = el * 0.34; ctx.beginPath(); ctx.ellipse(0, 0, el * 0.62, el * (i % 2 ? 0.3 : 0.44), 0, 0, TAU); ctx.stroke();
      ctx.strokeStyle = css(K.ferroLuz, 0.8); ctx.lineWidth = el * 0.12; ctx.beginPath(); ctx.ellipse(0, -0.8, el * 0.6, el * (i % 2 ? 0.28 : 0.42), 0, Math.PI * 1.1, Math.PI * 1.75); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- lança (pé em 0,0; vertical; ~200 de altura); rot em rad, quebra 0..1
  function lanca(ctx, x, y, s, o) {
    o = o || {};
    const A = o.alfa === undefined ? 1 : o.alfa, q = clamp(o.quebra || 0);
    if (A < 0.01) return;
    const haste = (y0, y1) => { ctx.strokeStyle = css(K.cabo); ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(0, y1); ctx.stroke(); };
    const ponta = () => {
      ctx.fillStyle = css(K.ferro); ctx.beginPath(); ctx.moveTo(0, -226); ctx.quadraticCurveTo(9, -204, 0, -194); ctx.quadraticCurveTo(-9, -204, 0, -226); ctx.fill();
      ctx.fillStyle = css(K.ferroLuz, 0.8); ctx.beginPath(); ctx.moveTo(-1, -222); ctx.quadraticCurveTo(4, -207, -1, -200); ctx.closePath(); ctx.fill();
    };
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(o.rot || 0); ctx.globalAlpha *= A;
    if (q < 0.01) { haste(0, -196); ponta(); }
    else {
      haste(0, -110 + 20 * q);                                                    // a metade de baixo fica
      ctx.save(); ctx.translate(q * 50, -110 + q * q * 90); ctx.rotate(q * 1.5); ctx.globalAlpha *= 1 - smooth(0.6, 1, q);
      ctx.translate(0, 110); haste(-110, -196); ponta(); ctx.restore();           // a de cima cai
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- bandeira (pé em 0,0; ~250 de altura); cor, t, vento 0..1, rasga 0..1
  function bandeira(ctx, x, y, s, o) {
    o = o || {};
    const A = o.alfa === undefined ? 1 : o.alfa, t = o.t || 0, vento = clamp(o.vento === undefined ? 0.3 : o.vento), q = clamp(o.rasga || 0), cor = o.cor || H('#e7b4c4');
    if (A < 0.01) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= A * (1 - 0.85 * smooth(0.5, 1, q));
    ctx.rotate(q * 0.9 * (o.lado || 1));
    ctx.strokeStyle = css(K.cabo); ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -250); ctx.stroke();
    ctx.fillStyle = css(K.ouroEsc); ctx.beginPath(); ctx.arc(0, -254, 5, 0, TAU); ctx.fill();
    const w = 96, h = 58, N = 12, topo = [], base = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N, onda = Math.sin(t * (3 + 4 * vento) - u * 5) * (4 + 16 * vento) * u, queda = q * q * 40 * u;
      topo.push([u * w * (1 - 0.3 * q), -246 + onda + queda]); base.push([u * w * (1 - 0.3 * q), -246 + h * (1 - 0.35 * q * u) + onda * 1.1 + queda]);
    }
    ctx.fillStyle = css(cor); ctx.beginPath(); ctx.moveTo(topo[0][0], topo[0][1]);
    for (const p of topo) ctx.lineTo(p[0], p[1]);
    for (let i = N; i >= 0; i--) ctx.lineTo(base[i][0], base[i][1]);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = css(ml(cor, K.branco, 0.45), 0.8); const m = Math.floor(N * 0.45);
    ctx.beginPath(); ctx.arc((topo[m][0] + base[m][0]) / 2, (topo[m][1] + base[m][1]) / 2, 10, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------------- nuvem de tempestade (pastel escuro, dois tons)
  function nuvemTempestade(ctx, x, y, s, a, sem) {
    if (a < 0.01) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= a;
    const blocos = [[0, 0, 150, 56], [-110, 14, 100, 42], [112, 12, 108, 44], [-40, -34, 100, 44], [60, -28, 90, 40], [-170, 30, 70, 30], [176, 28, 72, 30]];
    for (const [bx, by, rx, ry] of blocos) {
      ctx.fillStyle = css(K.nuvemSom, 0.9); ctx.beginPath(); ctx.ellipse(bx, by + 10, rx, ry * 0.9, 0, 0, TAU); ctx.fill();
    }
    for (const [bx, by, rx, ry] of blocos) {
      ctx.fillStyle = css(K.nuvem, 0.95); ctx.beginPath(); ctx.ellipse(bx, by, rx, ry, 0, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = css(K.nuvemLuz, 0.55);
    for (const [bx, by, rx, ry] of blocos) { ctx.beginPath(); ctx.ellipse(bx - rx * 0.1, by - ry * 0.35, rx * 0.7, ry * 0.5, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
  }

  // ---------------------------------------------------------------- estilhaço de luz (losango fino que gira e cai)
  function estilhaco(ctx, x, y, r, rot, a) {
    if (a < 0.01) return;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha *= a;
    ctx.fillStyle = css(K.luzOuro); ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.38, 0); ctx.lineTo(0, r * 0.7); ctx.lineTo(-r * 0.3, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = css(K.luz, 0.9); ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.12, -r * 0.1); ctx.lineTo(-r * 0.14, -r * 0.1); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------------- cidade distante (base em y = 0, ~70 de largura)
  // luz 0..1 acende as janelas e o brilho
  function cidadeLonge(ctx, x, y, s, luz, sem, tint) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const cor = tint(H('#e9dcd0'), 0.8), som = tint(H('#cfc3d3'), 0.8);
    if (luz > 0.02) brilhoRadial(ctx, 0, -26, 90, K.luzOuro, 0.5 * luz);
    const preds = [[-30, 24, 30], [-14, 34, 20], [4, 46, 24], [22, 28, 22]];
    preds.forEach(([bx, h, w], i) => {
      const hh = h * (0.8 + 0.4 * hash1(sem * 3 + i));
      ctx.fillStyle = css(i % 2 ? som : cor); ctx.beginPath(); ctx.rect(bx - w / 2, -hh, w, hh); ctx.fill();
      if (i === 2) { ctx.beginPath(); ctx.arc(bx, -hh, w / 2, Math.PI, 0); ctx.fill(); }
      if (i === 1) { ctx.beginPath(); ctx.moveTo(bx - w / 2, -hh); ctx.lineTo(bx, -hh - 12); ctx.lineTo(bx + w / 2, -hh); ctx.fill(); }
      ctx.fillStyle = css(K.luzOuro, 0.25 + 0.75 * luz); ctx.fillRect(bx - 2, -hh * 0.6, 4, 6);
    });
    ctx.restore();
  }

  G.SeresS2 = { K, coroa, cetro, corrente, lanca, bandeira, nuvemTempestade, estilhaco, cidadeLonge };
})(window);
