// Tema "Correntes Cairão" (Jeremias 30:8-9): um jugo de madeira preso por correntes de aço pastel no
// lago pesado e nublado. A cada refrão (a frase bíblica do jugo quebrado, em hebraico, e o verso das
// correntes) uma corrente arrebenta, cai na água com respingos e pombas sobem; no fim o próprio jugo se
// parte em uma luz dourada, peixes saltam e lírios florescem. A composição é o espelho da outra música
// (sol à esquerda). Os instantes saem do texto da legenda: os trechos em português que os disparam ficam
// em `animacao.json`, na pasta da música (`gatilhos.primeiro_elo`, `correntes_caem`, `livres`), e não
// neste repositório público; o hebraico é o versículo de Jeremias 30:8.
(function (G) {
  'use strict';
  const { clamp, lerp, smooth, mod, css, hash1, ease, mola } = G.U;
  const L = G.Lago, ALT = L.ALT, HOR = L.HOR, TAU = L.TAU;
  const semNikud = (s) => s.normalize('NFD').replace(/[֑-ׇ]/g, '').replace(/[̀-ͯ]/g, '');

  function brilho4(ctx, x, y, r) {
    ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r);
    ctx.closePath(); ctx.fill();
  }
  const bez = (p0, c, p1, u) => {
    const a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, d = u * u;
    return [a * p0[0] + b * c[0] + d * p1[0], a * p0[1] + b * c[1] + d * p1[1]];
  };

  function criar(musica, parte, W) {
    const P = G.LagoPaleta;
    const dur = parte.duracao;
    const linhas = musica.linhas.filter((l) => l.parte === parte.indice)
      .map((l) => ({ a: l.ini - parte.inicio, b: l.fim - parte.inicio, txt: semNikud(l.texto) + ' ' + (l.traducao || '') }));
    const gat = parte.gatilhos || {};
    const rx = (k) => (gat[k] ? new RegExp(gat[k], 'i') : null);
    const todos = (re) => (re ? linhas.filter((l) => re.test(l.txt)).map((l) => l.a) : []);
    const v = todos(/ועלו ישבר מעל צוארנו/), c = todos(rx('correntes_caem')), lv = todos(rx('livres'));
    const tPrim = todos(rx('primeiro_elo'))[0] || 44.3;
    const tV = [v[0] || 71.3, v[1] || 125.0, v[2] || 179.0];
    const tC = [c[0] || 88.9, c[1] || 142.6, c[2] || 195.8];
    const tLivres = [lv[0] || 90.6, lv[1] || 144.2, lv[2] || 197.5];
    const tJugo = tV[2];

    // ---------------------------------------------------------------- clima: a cada quebra o céu se abre um pouco mais
    const PESOS = [[tPrim, 0.06], [tV[0], 0.14], [tC[0], 0.14], [tV[1], 0.15], [tC[1], 0.15], [tJugo, 0.26], [tC[2], 0.10]];
    const liberdade = (tl) => clamp(PESOS.reduce((a, [t, w]) => a + w * smooth(t, t + 7, tl), 0));
    function estado(tl) {
      const Lb = liberdade(tl);
      const flash = smooth(tJugo - 0.05, tJugo + 0.25, tl) * (1 - smooth(tJugo + 0.25, tJugo + 3.2, tl));
      return {
        fx: 0.68,
        calor: 0.40 + 0.60 * Lb,
        peso: 0.85 * (1 - Lb),
        nevoa: 0.86 - 0.44 * Lb + 0.05 * Math.sin(tl * 0.06),
        vento: 0.12 + 0.10 * Lb + 0.12 * flash,
        solY: lerp(0.495 * ALT, 0.31 * ALT, ease.inOutSine(Lb)),
        solForca: 0.55 + 0.45 * Lb,
        raios: 0.04 + 0.96 * Lb,
        motes: 0.25 + 0.75 * Lb,
        flash,
        lib: Lb,
      };
    }

    // ---------------------------------------------------------------- jugo
    const JX = 0.5, JY = 0.875, JS = 1.25, LB = 150 * JS;
    const CORRENTES = [
      { A: [0.24, 0.693], lado: -1, sag: 0.05, tb: tV[0], ub: 0.5, agua: 0.745 },
      { A: [0.76, 0.693], lado: 1, sag: 0.05, tb: tC[0], ub: 0.5, agua: 0.745 },
      { A: [-0.04, 1.03], lado: -1, sag: 0.02, tb: tV[1], ub: 0.55, agua: 9 },
      { A: [1.04, 1.03], lado: 1, sag: 0.02, tb: tC[1], ub: 0.55, agua: 9 },
    ];
    const tC1 = tC[1];
    function pose(tl) {
      const livre = smooth(tC1, tC1 + 4, tl);
      let rot = 0.012 * Math.sin(tl * 0.6) * (0.3 + livre);
      for (const d of CORRENTES) rot += 0.045 * d.lado * mola(tl - d.tb, 2.4, 0.3) * (1 - 0.7 * livre);
      return {
        x: JX * W + 7 * livre * Math.sin(tl * 0.35),
        y: JY * ALT + (1.4 + 4.5 * livre) * Math.sin(tl * 0.9) - 26 * mola(tl - tC1 - 0.4, 1.0, 0.45) - 4 * smooth(tPrim, tPrim + 6, tl) * 0,
        rot,
        treme: (1 - livre) * 0.9 * Math.sin(tl * 13),
      };
    }
    const anel = (po, lado) => [po.x + lado * (LB - 6 * JS) * Math.cos(po.rot), po.y - 2 + lado * (LB - 6 * JS) * Math.sin(po.rot)];

    // pré-cálculo: onde e quando cada metade cai na água
    function quedaMeia(F, B0, v0, yAgua, tau) {
      const g = 1500, r0 = Math.hypot(B0[0] - F[0], B0[1] - F[1]);
      let q = [B0[0] + v0[0] * tau, B0[1] + v0[1] * tau + 0.5 * g * tau * tau];
      const dx = q[0] - F[0], dy = q[1] - F[1], d = Math.hypot(dx, dy);
      if (d > r0) q = [F[0] + dx * r0 / d, F[1] + dy * r0 / d];
      q[0] += Math.sin(tau * 7) * Math.exp(-tau * 1.7) * 0.06 * r0 * (v0[0] >= 0 ? 1 : -1);
      return { q, r0 };
    }

    function esfera(ctx, x, y, r, a) {
      ctx.fillStyle = css(P.branco, a); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
    function respingo(ctx, x, y, u, forca) {
      if (u < 0 || u > 2.2) return;
      for (let k = 0; k < 3; k++) {
        const tk = u - k * 0.16;
        if (tk <= 0) continue;
        const f = tk / 1.5;
        if (f >= 1) continue;
        ctx.strokeStyle = css(P.branco, 0.85 * (1 - f)); ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.ellipse(x, y, 16 + 100 * f * forca, (16 + 100 * f * forca) * 0.22, 0, 0, TAU); ctx.stroke();
      }
      if (u < 0.6) {
        const h = 70 * forca * Math.sin(Math.PI * u / 0.6);
        const g = ctx.createLinearGradient(0, y - h, 0, y);
        g.addColorStop(0, css(P.branco, 0)); g.addColorStop(1, css(P.branco, 0.85));
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y - h / 2, 12 * forca * (1 - u), h / 2, 0, 0, TAU); ctx.fill();
      }
      for (let i = 0; i < 12; i++) {
        const vx = (hash1(i * 3.3 + x) - 0.5) * 260 * forca, vy = (200 + 260 * hash1(i * 7.1)) * forca;
        const px = x + vx * u, py = y - vy * u + 560 * u * u;
        if (py > y + 2) continue;
        esfera(ctx, px, py, 2.6 * (1 - u / 2.2), 0.9 * (1 - u / 2.2));
      }
    }

    // ---------------------------------------------------------------- corrente de aço (elos alternados)
    function desenharElos(ctx, pts, esp, escala, alfa) {
      let acc = 0, prox = 0, idx = 0;
      const lens = [0];
      for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      const total = lens[lens.length - 1];
      const aco = P.aco, sombra = P.acoSombra, brilhoC = L.ml(P.aco, P.branco, 0.65);
      for (let d = esp * 0.5, n = 0; d < total; d += esp, n++) {
        while (idx < lens.length - 2 && lens[idx + 1] < d) idx++;
        const f = (d - lens[idx]) / Math.max(1e-6, lens[idx + 1] - lens[idx]);
        const x = lerp(pts[idx][0], pts[idx + 1][0], f), y = lerp(pts[idx][1], pts[idx + 1][1], f);
        const ang = Math.atan2(pts[idx + 1][1] - pts[idx][1], pts[idx + 1][0] - pts[idx][0]);
        ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
        const rx = 11.5 * escala, ry = (n % 2 ? 2.4 : 6.6) * escala;
        ctx.lineWidth = 6 * escala; ctx.strokeStyle = css(sombra, alfa);
        ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.stroke();
        ctx.lineWidth = 3.2 * escala; ctx.strokeStyle = css(aco, alfa);
        ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.stroke();
        ctx.lineWidth = 1.1 * escala; ctx.strokeStyle = css(brilhoC, alfa * 0.9);
        ctx.beginPath(); ctx.ellipse(0, -0.4 * escala, rx - 1, Math.max(0.6, ry - 1.4), 0, Math.PI * 1.1, Math.PI * 1.75); ctx.stroke();
        ctx.restore();
      }
    }
    function curva(p0, ct, p1, n = 44) { const r = []; for (let i = 0; i <= n; i++) r.push(bez(p0, ct, p1, i / n)); return r; }

    function cadeia(ctx, S, d, po) {
      const tl = S.tl, Wd = S.W;
      const A = [d.A[0] * Wd, d.A[1] * ALT], Y = anel(po, d.lado);
      const len = Math.hypot(Y[0] - A[0], Y[1] - A[1]);
      const mid = [(A[0] + Y[0]) / 2, (A[1] + Y[1]) / 2];
      const fr = smooth(d.tb - 6, d.tb, tl);                                   // antes de arrebentar, a corrente estica (menos folga)
      const perp = [-(Y[1] - A[1]) / len, (Y[0] - A[0]) / len];
      const tre = (2.4 * smooth(d.tb - 5, d.tb - 0.1, tl) + 0.6) * Math.sin(tl * 37 + d.lado) * (tl < d.tb ? 1 : 0);
      const ct = [mid[0] + perp[0] * tre, mid[1] + d.sag * len * (1 - 0.65 * fr) + perp[1] * tre];
      if (tl < d.tb) {
        desenharElos(ctx, curva(A, ct, Y), 16, 1, 1);
        const br = smooth(d.tb - 3.2, d.tb, tl);                              // brilho de tensão no elo que vai ceder
        if (br > 0.02) {
          const B = bez(A, ct, Y, d.ub);
          L.brilhoRadial(ctx, B[0], B[1], 34 + 26 * br, P.branco, 0.65 * br * (0.6 + 0.4 * Math.sin(tl * 21)));
        }
        return;
      }
      const tau = tl - d.tb;
      if (tau > 8) return;
      const ctr = [mid[0], mid[1] + d.sag * len];
      const B0 = bez(A, ctr, Y, d.ub);
      // estouro no elo: clarão e faíscas
      if (tau < 0.9) {
        const f = tau / 0.9;
        L.brilhoRadial(ctx, B0[0], B0[1], 40 + 150 * f, P.branco, 0.9 * (1 - f));
        ctx.fillStyle = css(P.branco, 0.95 * (1 - f));
        for (let i = 0; i < 10; i++) { const an = (i / 10) * TAU + d.tb, r = 14 + 95 * f * (0.5 + hash1(i * 2.1 + d.tb)); brilho4(ctx, B0[0] + Math.cos(an) * r, B0[1] + Math.sin(an) * r + 40 * f * f, 6 * (1 - f) + 1.5); }
      }
      // as duas metades caem (a do lado do jugo cai na água; a da ponta presa balança)
      const ag = d.agua * ALT, agY = po.y + 5;
      const metade = (F, v0, yAgua, alfa) => {
        const { q, r0 } = quedaMeia(F, B0, v0, yAgua, tau);
        const dist = Math.hypot(q[0] - F[0], q[1] - F[1]);
        const ctm = [(F[0] + q[0]) / 2, (F[1] + q[1]) / 2 + Math.max(0, r0 - dist) * 0.9 + 6];
        ctx.save();
        ctx.beginPath(); ctx.rect(-50, -50, Wd + 100, yAgua + 50); ctx.clip();
        desenharElos(ctx, curva(F, ctm, q, 32), 16, 1, alfa);
        ctx.restore();
        return q;
      };
      const sinA = d.lado, toA = [(A[0] - B0[0]) * 0.5, (A[1] - B0[1]) * 0.5], toY = [(Y[0] - B0[0]) * 0.6, (Y[1] - B0[1]) * 0.6 - 60];
      metade(A, toA, ag > 5 ? ag : 4000, 1);
      const qy = metade(Y, toY, agY, 1);
      // respingos: no jugo (metade que cai) e junto à estaca
      const Ys = quedaMeia(Y, B0, toY, agY, 0.35).q;
      respingo(ctx, Ys[0] + sinA * 0, agY + 2, tau - 0.3, 1.0);
      if (ag < 5000) { const As = quedaMeia(A, B0, toA, ag, 0.5).q; respingo(ctx, As[0], ag + 2, tau - 0.45, 0.9); }
    }

    // ---------------------------------------------------------------- estacas de pedra (onde as correntes estão presas)
    function estaca(ctx, S, x, yb, h, rompida, tl, tb) {
      const w = 40;
      for (let k = 0; k < 2; k++) {
        const u = mod(S.t * 0.25 + k * 0.5 + x * 0.003, 1);
        ctx.strokeStyle = css(P.creme, 0.5 * (1 - u)); ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.ellipse(x, yb + 2, w * (0.7 + 1.1 * u), 6 + 7 * u, 0, 0, TAU); ctx.stroke();
      }
      const claro = L.ml(P.pedra, P.creme, 0.42), escuro = L.aj(P.pedra, -0.11, 0.95);
      const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
      g.addColorStop(0, css(claro)); g.addColorStop(0.55, css(L.ml(claro, escuro, 0.45))); g.addColorStop(1, css(escuro));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(x - w / 2, yb); ctx.lineTo(x - w * 0.44, yb - h + 10); ctx.quadraticCurveTo(x, yb - h - 10, x + w * 0.44, yb - h + 10); ctx.lineTo(x + w / 2, yb); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = css(P.acoSombra, 1); ctx.lineWidth = 5;
      ctx.beginPath(); ctx.ellipse(x, yb - h + 18, 13, 8, 0, 0, TAU); ctx.stroke();
      ctx.strokeStyle = css(P.aco, 1); ctx.lineWidth = 2.6; ctx.stroke();
    }

    // ---------------------------------------------------------------- o jugo
    function jugoCorpo(ctx, S, alfa, dentro) {
      const s = JS, Lb = 150 * s, hb = 17 * s;
      const claro = L.ml(P.margem, P.ouro, 0.25), meio = L.aj(P.junco, -0.05), escuro = L.aj(P.junco, -0.22);
      // arcos (colares) que ficam submersos: aparecem esmaecidos pela água
      ctx.lineCap = 'round';
      for (const xb of [-0.46 * Lb, 0.46 * Lb]) {
        ctx.strokeStyle = css(escuro, 0.55 * alfa); ctx.lineWidth = 11 * s;
        ctx.beginPath(); ctx.moveTo(xb - 27 * s, hb * 0.6); ctx.lineTo(xb - 27 * s, hb + 30 * s); ctx.arc(xb, hb + 30 * s, 27 * s, Math.PI, 0, true); ctx.lineTo(xb + 27 * s, hb * 0.6); ctx.stroke();
        ctx.strokeStyle = css(meio, 0.45 * alfa); ctx.lineWidth = 5 * s;
        ctx.beginPath(); ctx.moveTo(xb - 27 * s, hb * 0.6); ctx.lineTo(xb - 27 * s, hb + 30 * s); ctx.arc(xb, hb + 30 * s, 27 * s, Math.PI, 0, true); ctx.lineTo(xb + 27 * s, hb * 0.6); ctx.stroke();
      }
      // viga
      const g = ctx.createLinearGradient(0, -hb, 0, hb);
      g.addColorStop(0, css(claro, alfa)); g.addColorStop(0.45, css(meio, alfa)); g.addColorStop(1, css(escuro, alfa));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.roundRect(-Lb, -hb, 2 * Lb, 2 * hb, hb * 0.85); ctx.fill();
      ctx.strokeStyle = css(escuro, 0.35 * alfa); ctx.lineWidth = 1.4;
      for (const [y, a, b] of [[-0.35, -0.85, 0.7], [0.15, -0.6, 0.9], [0.55, -0.9, 0.3]]) {
        ctx.beginPath(); ctx.moveTo(a * Lb, y * hb); ctx.quadraticCurveTo((a + b) / 2 * Lb, (y - 0.2) * hb, b * Lb, y * hb); ctx.stroke();
      }
      ctx.fillStyle = css(P.creme, 0.5 * alfa);
      ctx.beginPath(); ctx.roundRect(-Lb * 0.88, -hb * 0.78, Lb * 1.3, hb * 0.3, hb * 0.15); ctx.fill();
      // argolas de aço nas pontas
      for (const sd of [-1, 1]) {
        const x = sd * (Lb - 6 * s);
        ctx.lineWidth = 6.5 * s; ctx.strokeStyle = css(P.acoSombra, alfa); ctx.beginPath(); ctx.arc(x, -2, 10 * s, 0, TAU); ctx.stroke();
        ctx.lineWidth = 3.4 * s; ctx.strokeStyle = css(P.aco, alfa); ctx.stroke();
      }
    }
    function jugo(ctx, S, po) {
      const tl = S.tl;
      const rachar = clamp((tl - tJugo) / 2.6), e = ease.outCubic(rachar);
      const jx = po.x + po.treme, jy = po.y;
      // marola em volta (o jugo flutua)
      for (let k = 0; k < 3; k++) {
        const u = mod(tl * 0.3 + k / 3, 1);
        ctx.strokeStyle = css(P.creme, 0.5 * (1 - u)); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(jx, jy + 16, LB * (0.85 + 0.45 * u), 10 + 12 * u, 0, 0, TAU); ctx.stroke();
      }
      ctx.save(); ctx.translate(jx, jy); ctx.rotate(po.rot);
      if (rachar <= 0) jugoCorpo(ctx, S, 1);
      else {
        const hb = 17 * JS, ja = [[0, -hb - 10], [8, -hb * 0.5], [-7, -hb * 0.1], [7, hb * 0.4], [-6, hb * 0.8], [2, hb + 12], [0, 160]];
        const afunda = 70 * ease.inOutCubic(clamp((tl - tJugo - 1.0) / 6));
        const alfa = 1 - smooth(tJugo + 2.5, tJugo + 7.5, tl);
        for (const sd of [-1, 1]) {
          ctx.save();
          ctx.translate(sd * 62 * e, afunda * sd * 0 + afunda + 24 * e * e);
          ctx.rotate(sd * -0.34 * e);
          ctx.beginPath(); ctx.moveTo(sd * 400, -200); ctx.lineTo(sd * 400, 200);
          for (let i = ja.length - 1; i >= 0; i--) ctx.lineTo(sd * 0 + ja[i][0] * 1, ja[i][1]);
          ctx.closePath(); ctx.clip();
          jugoCorpo(ctx, S, Math.max(0, alfa));
          ctx.restore();
        }
      }
      ctx.restore();
    }

    // ---------------------------------------------------------------- pombas que sobem a cada quebra
    const VOOS = [];
    const bando = (t0, n, xf, yf, sem) => {
      for (let i = 0; i < n; i++) {
        VOOS.push({ t0: t0 + 0.15 + i * 0.16, x0: xf + (hash1(sem + i * 1.3) - 0.5) * 80, y0: yf + hash1(sem + i * 2.9) * 20, x1: 0.06 + 0.66 * hash1(sem + i * 5.7),
          y1: -0.10 - 0.06 * hash1(sem + i * 4.1), cur: (hash1(sem + i * 8.3) - 0.5) * 0.4, dur: 5.6 + 2.4 * hash1(sem + i * 6.1), esc: 0.85 + 0.45 * hash1(sem + i * 3.7), w: 8.5 + 3.5 * hash1(sem + i) });
      }
    };
    CORRENTES.forEach((d, i) => bando(d.tb, [2, 3, 3, 4][i], 0.5 * W + d.lado * 0.2 * W, 0.80 * ALT, 10 * (i + 1)));
    bando(tJugo, 10, 0.5 * W, 0.84 * ALT, 77);
    bando(tC[2], 6, 0.5 * W, 0.80 * ALT, 99);
    bando(tC[2] + 14, 4, 0.4 * W, 0.80 * ALT, 123);
    function pombas(ctx, S) {
      const tl = S.tl;
      for (const o of VOOS) {
        const u = (tl - o.t0) / o.dur;
        if (u < 0 || u > 1) continue;
        const p0 = [o.x0, o.y0], p1 = [o.x1 * S.W, o.y1 * ALT];
        const ct = [lerp(p0[0], p1[0], 0.35) + o.cur * S.W, lerp(p0[1], p1[1], 0.55)];
        const e = ease.inOutSine(clamp(u * 1.0));
        const pos = bez(p0, ct, p1, e), pos2 = bez(p0, ct, p1, Math.min(1, e + 0.02));
        const dx = pos2[0] - pos[0], dy = pos2[1] - pos[1];
        const dir = dx >= 0 ? 1 : -1;
        const rot = Math.atan2(dy, Math.abs(dx) + 1e-3);
        const alfa = smooth(0, 0.06, u) * (1 - smooth(0.78, 1, u));
        ctx.save();
        ctx.shadowColor = css(L.aj(P.margem, -0.25), 0.35 * alfa); ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
        G.Personagens.pomba(ctx, S, pos[0], pos[1], o.esc * (0.6 + 0.4 * smooth(0, 0.15, u)) * (alfa > 0 ? 1 : 0), { fase: tl * o.w + o.x0, bate: 0.3 + 0.7 * Math.sin(tl * o.w + o.x0), rot: rot * 0.8, dir });
        ctx.restore();
      }
    }

    // ---------------------------------------------------------------- peixes que saltam
    const PEIXES = [];
    const salto = (t0, n, sem) => {
      for (let i = 0; i < n; i++) {
        const yw = (0.69 + 0.11 * hash1(sem + i * 3.1)) * ALT;
        PEIXES.push({ t0: t0 + i * 0.55 + hash1(sem + i) * 0.3, x: (0.18 + 0.64 * hash1(sem + i * 5.3)) * W, yw, dx: (hash1(sem + i * 9.1) - 0.5) * 220, h: 70 + 70 * hash1(sem + i * 2.3), T: 1.05 + 0.3 * hash1(sem + i * 6.7) });
      }
    };
    tLivres.forEach((t, i) => salto(t, [2, 3, 4][i], 200 + i * 31));
    salto(tJugo + 3, 3, 400); salto(tC[2] + 18, 3, 500);
    function peixes(ctx, S) {
      const tl = S.tl;
      for (const f of PEIXES) {
        const tau = tl - f.t0;
        if (tau < -0.1 || tau > f.T + 2.2) continue;
        const sc = 0.6 + 1.3 * clamp((f.yw - HOR) / (ALT - HOR));
        if (tau >= 0 && tau <= f.T) {
          const u = tau / f.T;
          const x = f.x + f.dx * u, y = f.yw - 4 * f.h * sc * u * (1 - u);
          const dir = f.dx >= 0 ? 1 : -1;
          ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1); ctx.rotate(Math.atan2(4 * f.h * sc * (2 * u - 1), Math.abs(f.dx) + 40));
          const cor = P.rosa, barriga = P.creme;
          const rx = 25 * sc, ry = 9.5 * sc;
          ctx.fillStyle = css(L.aj(cor, -0.04));
          ctx.beginPath(); ctx.moveTo(-rx * 0.9, 0); ctx.lineTo(-rx * 1.55, -ry * 1.1); ctx.quadraticCurveTo(-rx * 1.25, 0, -rx * 1.55, ry * 1.1); ctx.closePath(); ctx.fill();
          ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = css(barriga, 0.9);
          ctx.beginPath(); ctx.ellipse(rx * 0.05, ry * 0.42, rx * 0.85, ry * 0.5, 0, 0, Math.PI); ctx.fill();
          ctx.fillStyle = css(P.branco, 0.65);
          ctx.beginPath(); ctx.ellipse(rx * 0.1, -ry * 0.45, rx * 0.5, ry * 0.2, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = css(L.aj(P.pedra, -0.25)); ctx.beginPath(); ctx.arc(rx * 0.62, -ry * 0.15, 1.9 * sc, 0, TAU); ctx.fill();
          ctx.restore();
        }
        respingo(ctx, f.x, f.yw + 3, tau + 0.05, 0.55 * sc);
        respingo(ctx, f.x + f.dx, f.yw + 3, tau - f.T, 0.55 * sc);
      }
    }

    // ---------------------------------------------------------------- lírios que desabrocham
    const LIRIOS = [[0.27, 0.725], [0.37, 0.80], [0.63, 0.745], [0.73, 0.815], [0.86, 0.93], [0.24, 0.92], [0.46, 0.74], [0.80, 0.72]]
      .map(([x, y], i) => ({ x: x * W, y: y * ALT, t0: tJugo + 0.6 + i * 3.1, sem: i }));
    function lirio(ctx, S, o) {
      const tl = S.tl, pad = mola(tl - o.t0, 1.6, 0.55), aberta = mola(tl - o.t0 - 1.6, 1.4, 0.5);
      if (pad <= 0.01) return;
      const sc = 0.55 + 0.9 * clamp((o.y - HOR) / (ALT - HOR));
      const R = 46 * sc * pad, bal = Math.sin(tl * 0.8 + o.sem) * 1.6;
      const folha = L.ml(P.aguaP, P.teal, 0.5), fo = L.aj(folha, -0.09);
      ctx.save(); ctx.translate(o.x, o.y + bal);
      ctx.fillStyle = css(fo, 0.9); ctx.beginPath(); ctx.ellipse(0, 3, R * 1.04, R * 0.32, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = css(folha); ctx.beginPath(); ctx.moveTo(0, 0); ctx.ellipse(0, 0, R, R * 0.3, 0, 0.35, TAU - 0.12); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = css(L.ml(folha, P.branco, 0.4), 0.6); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(0, -1, R * 0.92, R * 0.26, 0, 0.4, TAU - 0.2); ctx.stroke();
      if (aberta > 0.02) {
        const Rf = 34 * sc * aberta;
        ctx.translate(0, -5 * sc);
        ctx.scale(1, 0.46);
        for (const [n, r, rot, cor] of [[8, 1.0, 0.2, P.rosa], [6, 0.78, 0.6, L.ml(P.rosa, P.branco, 0.45)], [5, 0.5, 0.1, P.creme]]) {
          for (let k = 0; k < n; k++) {
            const a = (k / n) * TAU + rot;
            ctx.save(); ctx.rotate(a);
            const g = ctx.createLinearGradient(0, 0, 0, -Rf * r * 1.9);
            g.addColorStop(0, css(L.ml(cor, P.ouro, 0.35))); g.addColorStop(0.6, css(cor)); g.addColorStop(1, css(L.ml(cor, P.branco, 0.6)));
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(Rf * r * 0.62, -Rf * r * 0.8, 0, -Rf * r * 1.9); ctx.quadraticCurveTo(-Rf * r * 0.62, -Rf * r * 0.8, 0, 0); ctx.fill();
            ctx.restore();
          }
        }
        ctx.fillStyle = css(P.ouro); ctx.beginPath(); ctx.arc(0, 0, Rf * 0.22, 0, TAU); ctx.fill();
        ctx.fillStyle = css(P.branco, 0.85);
        for (let k = 0; k < 6; k++) { const a = k * 1.05 + tl * 0.2; ctx.beginPath(); ctx.arc(Math.cos(a) * Rf * 0.14, Math.sin(a) * Rf * 0.14, Rf * 0.045, 0, TAU); ctx.fill(); }
      }
      ctx.restore();
    }

    // ---------------------------------------------------------------- composição
    function agua(ctx, S) {
      const tl = S.tl, po = pose(tl);
      for (const d of CORRENTES.slice(0, 2)) {
        const x = d.A[0] * S.W, yb = d.agua * ALT;
        estaca(ctx, S, x, yb, 78, tl >= d.tb, tl, d.tb);
      }
      // o primeiro elo a ceder (antes das quebras grandes)
      for (const d of CORRENTES) cadeia(ctx, S, d, po);
      // elo solto que cai no primeiro gatilho (primeiro_elo)
      const tau1 = tl - tPrim;
      if (tau1 > 0 && tau1 < 3.0) {
        const x0 = 0.64 * S.W, y0 = 0.775 * ALT, yw = 0.845 * ALT;
        const y = Math.min(yw, y0 + 700 * tau1 * tau1), tq = Math.sqrt((yw - y0) / 700);
        if (tau1 < tq) { ctx.save(); ctx.translate(x0 + 10 * tau1, y); ctx.rotate(tau1 * 4); ctx.lineWidth = 6; ctx.strokeStyle = css(P.acoSombra); ctx.beginPath(); ctx.ellipse(0, 0, 11.5, 6.6, 0, 0, TAU); ctx.stroke(); ctx.lineWidth = 3.2; ctx.strokeStyle = css(P.aco); ctx.stroke(); ctx.restore(); }
        if (tau1 < 0.5) L.brilhoRadial(ctx, x0, y0, 40 * (1 - tau1 / 0.5) + 10, P.branco, 0.8 * (1 - tau1 / 0.5));
        respingo(ctx, x0 + 10 * tq, yw + 2, tau1 - tq, 0.6);
      }
      jugo(ctx, S, po);
      if (S.flash > 0.01) L.brilhoRadial(ctx, po.x, po.y, 620 * (0.5 + S.flash), P.branco, 0.85 * S.flash);
      for (const o of LIRIOS) lirio(ctx, S, o);
      peixes(ctx, S);
    }
    function frente(ctx, S) {
      pombas(ctx, S);
      if (S.flash > 0.01) { ctx.fillStyle = css(P.branco, 0.3 * S.flash); ctx.fillRect(-40, -40, S.W + 80, ALT + 80); }
    }

    return { espelho: true, estado, agua, frente };
  }

  G.TemaCorrentes = { criar };
})(window);
