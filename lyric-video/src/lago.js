// Cenário-base dos temas de lago: céu de nascer do sol, sol velado por nuvens macias, margem distante
// com pinheiros, água em faixas com brilho do sol, névoa, pedras e juncos no primeiro plano.
// Todas as cores vêm da paleta da imagem da música (data/paleta.json, já em tons pastéis) e são
// misturadas em OKLab conforme o "clima" do momento (calor, peso, névoa, vento).
// Espaço de projeto: altura 1080; a largura W varia com o formato. Com `S.espelho` a composição
// inteira (sol, margem, pedras) fica espelhada, o que dá a cada música um enquadramento próprio.
(function (G) {
  'use strict';
  const { clamp, lerp, smooth, mod, css, rgb, toLab, fromLab, mixLab, hash1, noise1, mulberry32 } = G.U;
  const ALT = 1080, TAU = Math.PI * 2;
  const HOR = 0.60 * ALT;                               // linha do horizonte
  let P = null;                                         // paleta (arrays RGB)

  const ml = (a, b, t) => fromLab(mixLab(toLab(a), toLab(b), t));
  const aj = (c, dL, fC = 1) => { const [L, a, b] = toLab(c); return fromLab([clamp(L + dL, 0, 1), a * fC, b * fC]); };

  function iniciar(pa) {
    const c = (h) => rgb(h);
    P = {
      teal: c(pa.ceuTopo), peach: c(pa.ceuMeio), nuvP: c(pa.nuvemPessego), nuvR: c(pa.nuvemRosa), ouro: c(pa.brilho),
      nevoa: c(pa.nevoa), aguaL: c(pa.aguaLonge), aguaP: c(pa.aguaPerto), margem: c(pa.margem), pedra: c(pa.pedra),
      junco: c(pa.junco), branco: [255, 250, 244],
    };
    P.creme = ml(P.ouro, P.branco, 0.55);
    P.rosa = ml(P.nuvR, [255, 196, 214], 0.45);
    P.cinza = ml(P.nevoa, P.teal, 0.5);
    P.aco = ml(P.pedra, P.branco, 0.38);                // metal pastel (correntes)
    P.acoSombra = aj(P.pedra, -0.10, 0.9);
    G.LagoPaleta = P;
    return P;
  }

  // ---------------------------------------------------------------- céu
  function coresCeu(S) {
    const c = S.calor, pe = S.peso;
    const pesar = (col) => ml(col, P.cinza, pe * 0.22);
    return {
      top: pesar(ml(P.teal, P.peach, 0.04 + 0.40 * c)),
      mid: pesar(ml(P.teal, P.peach, 0.34 + 0.50 * c)),
      low: pesar(ml(P.peach, P.nuvP, 0.35 + 0.2 * c)),
      hor: pesar(ml(ml(P.peach, P.nevoa, 0.5), P.ouro, 0.25 * c)),
    };
  }
  function ceu(ctx, S) {
    const k = S.cores = coresCeu(S);
    const g = ctx.createLinearGradient(0, 0, 0, HOR + 10);
    g.addColorStop(0, css(k.top)); g.addColorStop(0.42, css(k.mid)); g.addColorStop(0.78, css(k.low)); g.addColorStop(1, css(k.hor));
    ctx.fillStyle = g; ctx.fillRect(-40, -40, S.W + 80, HOR + 60);
  }

  function brilhoRadial(ctx, x, y, r, cor, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, css(cor, a)); g.addColorStop(0.4, css(cor, a * 0.36)); g.addColorStop(1, css(cor, 0));
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function sol(ctx, S) {
    const { solX: x, solY: y, solForca: f, A, flash } = S;
    if (f < 0.02) return;
    ctx.save();
    ctx.beginPath(); ctx.rect(-40, -40, S.W + 80, HOR + 6); ctx.clip();
    const respira = 0.85 + 0.25 * A.energia;
    const k = 1 + 0.6 * (flash || 0);
    brilhoRadial(ctx, x, y, 720 * k, P.ouro, 0.55 * f * respira);
    brilhoRadial(ctx, x, y, 330 * k, P.creme, 0.62 * f);
    brilhoRadial(ctx, x, y, 150 * k, P.branco, 0.7 * f);
    const r = 50;
    const g = ctx.createRadialGradient(x - r * 0.25, y - r * 0.25, r * 0.1, x, y, r);
    g.addColorStop(0, css(P.branco, 0.98 * f)); g.addColorStop(0.7, css(P.creme, 0.95 * f)); g.addColorStop(1, css(P.ouro, 0.85 * f));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function raios(ctx, S) {
    const f = S.raios * S.solForca * (0.55 + 0.45 * S.A.energia);
    if (f < 0.03) return;
    ctx.save();
    ctx.beginPath(); ctx.rect(-40, -40, S.W + 80, HOR + 6); ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(S.solX, S.solY);
    for (let i = 0; i < 13; i++) {
      const a = (i / 13) * TAU + S.t * 0.025;
      const larg = 0.04 + 0.03 * hash1(i * 3.1);
      const g = ctx.createLinearGradient(0, 0, 1700, 0);
      g.addColorStop(0, css(P.ouro, 0.075 * f)); g.addColorStop(1, css(P.ouro, 0));
      ctx.save(); ctx.rotate(a); ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1700, -1700 * larg); ctx.lineTo(1700, 1700 * larg); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- nuvens macias (faixas rosadas e pêssego)
  const rn = mulberry32(77);
  const NUVENS = Array.from({ length: 30 }, () => ({
    x0: rn() * 3400, y: (0.03 + rn() * 0.50) * ALT, w: 260 + rn() * 460, h: 0.15 + rn() * 0.17, v: 3 + rn() * 9, tom: rn(), a: 0.34 + rn() * 0.42,
  }));
  function nuvens(ctx, S) {
    const { W, t } = S;
    const periodo = W + 1100;
    for (const n of NUVENS) {
      const x = mod(n.x0 - t * n.v - (S.t0 || 0) * 0, periodo) - 550;
      const aq = clamp((n.y / ALT - 0.05) / 0.44);                   // mais quentes perto do horizonte
      let col = ml(ml(P.teal, P.branco, 0.55), P.nuvP, aq);
      col = ml(col, P.rosa, n.tom * 0.4 * aq);
      const d = Math.hypot(x - S.solX, n.y - S.solY);
      const perto = Math.exp(-(d * d) / (2 * 320 * 320)) * S.solForca;
      col = ml(col, P.ouro, perto * 0.6);
      const a = n.a * (0.5 + 0.8 * S.peso) * (1 - 0.5 * perto);
      ctx.save();
      ctx.translate(x, n.y); ctx.scale(1, n.h);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, n.w);
      g.addColorStop(0, css(col, a)); g.addColorStop(0.5, css(col, a * 0.55)); g.addColorStop(1, css(col, 0));
      ctx.fillStyle = g; ctx.fillRect(-n.w, -n.w, n.w * 2, n.w * 2);
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------- margem distante
  const rp = mulberry32(5);
  const PINHOS = Array.from({ length: 52 }, () => {
    const grupo = rp() < 0.62;
    return { x: grupo ? rp() * 0.27 : 0.30 + rp() * 0.14, h: 24 + rp() * (grupo ? 62 : 44), dy: rp() * 7 - 2, f: rp() * TAU, perto: rp() };
  }).sort((a, b) => a.h - b.h);
  function pinhos(ctx, S, lista, cor) {
    ctx.fillStyle = css(cor);
    ctx.beginPath();
    for (const p of lista) {
      const x = S.X(p.x * S.W), yb = HOR + p.dy, h = p.h, w = h * 0.34;
      const sw = Math.sin(S.t * 1.1 + p.f) * (1 + 3.2 * S.vento) * (h / 60);
      for (let i = 0; i < 4; i++) {
        const f = i / 4;
        const ya = yb - h + f * h * 0.78, hb = h * 0.30 + f * h * 0.04;
        const xa = x + sw * (1 - f), wb = w * (0.45 + 0.52 * f + 0.1 * i / 4);
        ctx.moveTo(xa, ya); ctx.lineTo(xa + wb, ya + hb); ctx.lineTo(xa - wb, ya + hb); ctx.closePath();
      }
      ctx.rect(x - 1.6, yb - h * 0.12, 3.2, h * 0.14 + 4);
    }
    ctx.fill();
  }
  function margem(ctx, S) {
    const { W } = S;
    const longe = ml(ml(P.pedra, P.nevoa, 0.66), P.cinza, 0.1), perto = ml(P.pedra, P.nevoa, 0.44);
    // colina baixa e enevoada à esquerda (ilha de pinheiros)
    ctx.fillStyle = css(longe, 0.9);
    ctx.beginPath(); ctx.moveTo(S.X(-30), HOR + 3);
    for (let x = -30; x <= 0.50 * W; x += 14) {
      const f = x / (0.5 * W), alto = Math.sin(clamp(f, 0, 1) * Math.PI) * 13 + 7 * noise1(x * 0.011 + 3);
      ctx.lineTo(S.X(x), HOR - 10 - alto * (1 - 0.3 * f));
    }
    ctx.lineTo(S.X(0.5 * W), HOR + 3); ctx.closePath(); ctx.fill();
    pinhos(ctx, S, PINHOS.filter((p) => p.perto < 0.5), ml(longe, perto, 0.4));
    pinhos(ctx, S, PINHOS.filter((p) => p.perto >= 0.5), perto);
    // floresta distante à direita, bem esmaecida
    ctx.fillStyle = css(ml(P.pedra, P.nevoa, 0.78), 0.62);
    ctx.beginPath(); ctx.moveTo(S.X(0.76 * W), HOR + 2);
    for (let x = 0.76 * W; x <= W + 30; x += 10) {
      const f = clamp((x - 0.76 * W) / (0.26 * W));
      ctx.lineTo(S.X(x), HOR - 150 * Math.pow(f, 1.6) - 10 * f - 5 * noise1(x * 0.05));
    }
    ctx.lineTo(S.X(W + 30), HOR + 2); ctx.closePath(); ctx.fill();
    // ilhota
    ctx.fillStyle = css(ml(P.nevoa, P.pedra, 0.25), 0.6);
    ctx.beginPath(); ctx.ellipse(S.X(0.57 * W), HOR, 110, 9, 0, Math.PI, TAU); ctx.fill();
  }
  function neblinaHorizonte(ctx, S, fator) {
    const a = clamp(0.25 + 0.6 * S.nevoa) * fator;
    const g = ctx.createLinearGradient(0, HOR - 130, 0, HOR + 60);
    const col = ml(P.nevoa, P.creme, 0.3);
    g.addColorStop(0, css(col, 0)); g.addColorStop(0.62, css(col, a)); g.addColorStop(0.82, css(col, a * 0.7)); g.addColorStop(1, css(col, 0));
    ctx.fillStyle = g; ctx.fillRect(-40, HOR - 130, S.W + 80, 190);
  }

  // ---------------------------------------------------------------- água
  function agua(ctx, S) {
    const { W, t, vento } = S;
    const N = 20, C = S.calor;
    const longe = ml(ml(P.aguaL, P.teal, (1 - C) * 0.45), P.nevoa, 0.22);
    const perto = ml(P.aguaP, P.teal, (1 - C) * 0.15);
    const crista = ml(P.creme, P.branco, 0.4);
    const yAt = (q) => HOR + (ALT + 50 - HOR) * Math.pow(q, 1.75);
    for (let r = 0; r < N; r++) {
      const q = r / (N - 1), q1 = (r + 1) / (N - 1);
      const y0 = yAt(q), y1 = yAt(Math.min(1, q1));
      const amp = (0.5 + 12 * Math.pow(q, 1.5)) * (0.65 + 1.1 * vento);
      const lam = 46 + 380 * Math.pow(q, 1.3);
      const v = (6 + 40 * q) * (1 + 1.8 * vento);
      const fase = r * 1.93;
      const curva = new Path2D();
      for (let x = -24, i = 0; x <= W + 24; x += 8, i++) {
        const yy = y0 + amp * (0.65 * Math.sin(x / lam * TAU + fase + t * v / lam * TAU) + 0.35 * Math.sin(x / (lam * 0.47) * TAU + fase * 1.7 - t * v * 1.3 / lam * TAU));
        i ? curva.lineTo(x, yy) : curva.moveTo(x, yy);
      }
      const area = new Path2D(curva);
      area.lineTo(W + 24, ALT + 60); area.lineTo(-24, ALT + 60); area.closePath();
      const c0 = aj(ml(longe, perto, smooth(0, 0.9, q)), 0.03 * Math.sin(r * 2.1 + t * 0.3));
      const c1 = ml(longe, perto, smooth(0, 0.9, q1));
      const g = ctx.createLinearGradient(0, y0 - amp, 0, y1 + amp + 4);
      g.addColorStop(0, css(c0)); g.addColorStop(1, css(c1));
      ctx.fillStyle = g; ctx.fill(area);
      ctx.strokeStyle = css(crista, (0.10 + 0.26 * (1 - 0.6 * q)) * (0.6 + 0.6 * vento) * (0.7 + 0.3 * S.solForca));
      ctx.lineWidth = 1 + 2.2 * q; ctx.stroke(curva);
    }
  }
  function brilhoAgua(ctx, S) {
    const { t } = S, f = S.solForca * clamp(1.15 - (S.solY - 0.25 * ALT) / (0.8 * ALT));
    if (f < 0.03) return;
    const x0 = S.solX, altAgua = ALT - HOR;
    ctx.save();
    for (const [rx, alfa] of [[430, 0.22], [230, 0.26], [95, 0.30]]) {
      ctx.save();
      ctx.translate(x0, HOR + altAgua * 0.36); ctx.scale(1, (altAgua * 0.62) / rx);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      g.addColorStop(0, css(P.ouro, alfa * f)); g.addColorStop(1, css(P.ouro, 0));
      ctx.fillStyle = g; ctx.fillRect(-rx, -rx, rx * 2, rx * 2);
      ctx.restore();
    }
    for (let i = 0; i < 190; i++) {
      const q = Math.pow(hash1(i * 3.7), 1.5);
      const y = HOR + 3 + altAgua * Math.pow(q, 1.75) * 0.97;
      const sp = 28 + 340 * Math.pow(q, 1.15);
      const gx = (hash1(i * 5.1 + 1) + hash1(i * 9.7 + 2) + hash1(i * 2.3 + 3) - 1.5) * 1.6 * sp;
      const x = x0 + gx + 12 * Math.sin(t * 0.8 + i);
      const tw = Math.max(0, Math.sin(t * (1.4 + hash1(i) * 3) + i * 4.1));
      const len = (5 + 36 * q) * (0.5 + 0.8 * tw);
      const a = 0.9 * tw * f * (1 - q * 0.3);
      if (a < 0.03) continue;
      ctx.fillStyle = css(P.branco, a); ctx.fillRect(x - len / 2, y, len, 1.3 + 2.3 * q);
    }
    ctx.restore();
  }
  function neblinaAgua(ctx, S) {
    const { W, t } = S;
    const dens = S.nevoa;
    if (dens < 0.03) return;
    const col = ml(P.nevoa, P.creme, 0.35);
    for (let i = 0; i < 14; i++) {
      const q = Math.pow(hash1(i * 7.3 + 1), 1.2);
      const y = HOR + (ALT - HOR) * Math.pow(q, 1.75) - 4;
      const w = (380 + 820 * hash1(i * 3.1 + 2)) * (0.55 + 0.7 * q);
      const x = mod(hash1(i * 9.9) * (W + 1400) + t * (6 + 16 * hash1(i * 1.7)) * (0.5 + 1.5 * S.vento) * (S.espelho ? -1 : 1), W + 1400) - 700;
      const a = dens * 0.34 * (1 - 0.45 * q);
      ctx.save();
      ctx.translate(x, y); ctx.scale(1, (18 + 60 * q) / w);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, w);
      g.addColorStop(0, css(col, a)); g.addColorStop(0.55, css(col, a * 0.4)); g.addColorStop(1, css(col, 0));
      ctx.fillStyle = g; ctx.fillRect(-w, -w, w * 2, w * 2);
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------- primeiro plano: pedras e juncos
  const PEDRAS = [{ x: 0.985, y: 0.80, w: 92, h: 66 }, { x: 0.925, y: 0.915, w: 76, h: 40 }, { x: 0.845, y: 0.865, w: 46, h: 22 }, { x: 0.972, y: 0.965, w: 132, h: 62 }, { x: 0.80, y: 0.975, w: 58, h: 24 }];
  function pedra(ctx, S, p) {
    const x = S.X(p.x * S.W), y = p.y * ALT;
    // marolas em volta
    for (let k = 0; k < 2; k++) {
      const u = mod(S.t * 0.22 + k * 0.5 + p.x * 3, 1);
      ctx.strokeStyle = css(P.creme, 0.5 * (1 - u)); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.ellipse(x, y + 3, p.w * (1.05 + 0.45 * u), p.h * (0.16 + 0.1 * u), 0, 0, TAU); ctx.stroke();
    }
    const alta = ml(P.pedra, P.creme, 0.42), baixa = aj(P.pedra, -0.10, 0.95);
    const g = ctx.createLinearGradient(0, y - p.h, 0, y + 4);
    g.addColorStop(0, css(alta)); g.addColorStop(0.6, css(ml(alta, baixa, 0.55))); g.addColorStop(1, css(baixa));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(x, y, p.w, p.h, 0, Math.PI, TAU); ctx.quadraticCurveTo(x + p.w * 0.4, y + 7, x, y + 6); ctx.quadraticCurveTo(x - p.w * 0.4, y + 7, x - p.w, y); ctx.fill();
    ctx.fillStyle = css(P.creme, 0.5);
    ctx.beginPath(); ctx.ellipse(x - p.w * 0.25 * (S.espelho ? -1 : 1), y - p.h * 0.62, p.w * 0.36, p.h * 0.16, -0.25 * (S.espelho ? -1 : 1), 0, TAU); ctx.fill();
  }
  const JUNCOS = [{ x: 0.80, y: 0.735, h: 70, n: 16 }, { x: 0.905, y: 0.775, h: 96, n: 22 }, { x: 0.865, y: 0.905, h: 150, n: 15 }];
  function juncos(ctx, S) {
    const c1 = ml(P.junco, P.creme, 0.15), c2 = aj(P.junco, -0.12, 0.9), c3 = ml(P.pedra, P.nevoa, 0.25);
    ctx.lineCap = 'round';
    JUNCOS.forEach((g, gi) => {
      for (let i = 0; i < g.n; i++) {
        const h = g.h * (0.55 + 0.6 * hash1(gi * 17 + i * 3.3));
        const bx = S.X(g.x * S.W + (hash1(gi * 9 + i * 7.1) - 0.5) * g.h * 1.2), by = g.y * ALT + hash1(i * 2.2 + gi) * 10;
        const tip = (hash1(i * 5.7 + gi * 3) - 0.5) * 0.55 * h + Math.sin(S.t * 1.8 + i + gi * 2) * (3 + 14 * S.vento) * (h / 100) * (S.espelho ? 1 : -1) * 0.6;
        ctx.strokeStyle = css(i % 3 === 0 ? c3 : i % 2 ? c1 : c2);
        ctx.lineWidth = 1.5 + h / 75;
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx + tip * 0.35, by - h * 0.6, bx + tip, by - h); ctx.stroke();
      }
    });
  }
  function primeiroPlano(ctx, S) {
    juncos(ctx, S);
    for (const p of PEDRAS) pedra(ctx, S, p);
  }

  // ---------------------------------------------------------------- partículas de luz
  function particulas(ctx, S) {
    const f = S.motes;
    if (f < 0.03) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 52; i++) {
      const u = hash1(i * 3.3), v = hash1(i * 7.1 + 5);
      const vel = 10 + 26 * hash1(i * 2.9);
      const x = mod(u * (S.W + 200) - S.t * vel * (0.4 + 1.4 * S.vento) * (S.espelho ? -1 : 1) + 30 * Math.sin(S.t * 0.4 + i), S.W + 200) - 100;
      const y = mod(v * ALT * 0.95 - S.t * (6 + 10 * hash1(i * 4.4)), ALT * 0.95) + ALT * 0.04;
      const tw = 0.3 + 0.7 * Math.max(0, Math.sin(S.t * (0.8 + hash1(i) * 2) + i * 2.3));
      brilhoRadial(ctx, x, y, 6 + 10 * hash1(i * 1.9 + 3) + 3 * S.A.pulso, P.ouro, 0.55 * tw * f);
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- quadro
  function desenhar(ctx, S, tema) {
    const { W } = S;
    S.X = S.espelho ? (x) => W - x : (x) => x;
    ctx.save();
    const z = S.zoom || 1;
    ctx.translate(W / 2, HOR); ctx.scale(z, z); ctx.translate(-W / 2, -HOR);
    ceu(ctx, S);
    sol(ctx, S);
    nuvens(ctx, S);
    raios(ctx, S);
    margem(ctx, S);
    neblinaHorizonte(ctx, S, 1);
    agua(ctx, S);
    brilhoAgua(ctx, S);
    neblinaHorizonte(ctx, S, 0.55);
    if (tema && tema.agua) tema.agua(ctx, S);
    neblinaAgua(ctx, S);
    primeiroPlano(ctx, S);
    if (tema && tema.frente) tema.frente(ctx, S);
    particulas(ctx, S);
    ctx.restore();
  }

  G.Lago = { iniciar, desenhar, ml, aj, brilhoRadial, ALT, HOR, TAU, pal: () => P };
})(window);
