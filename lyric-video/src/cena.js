// Cenário: céu em degradê, estrelas, sol e lua, nuvens, colinas em paralaxe, vilarejo,
// oliveiras, flora do primeiro plano, personagens, pombas, corações, vaga-lumes e borboletas.
// Espaço de projeto: altura fixa de 1080; a largura (W) varia com o formato do vídeo.
(function (G) {
  'use strict';
  const { clamp, lerp, smooth, mod, mix, css, rgb, hash1, noise1, mulberry32 } = G.U;
  const P = G.Personagens;
  const ALT = 1080;
  const TAU = Math.PI * 2;
  const HORIZONTE = 0.66 * ALT;

  // ---------------------------------------------------------------- luz do dia sobre as cores do cenário
  function luz(cor, dia, k = 1) {
    const c = typeof cor === 'string' ? rgb(cor) : cor;
    const esc = 1 - dia.a;
    const m = mix(c, dia.amb, Math.min(0.6, esc * 0.75 * k));
    const f = 1 - esc * 0.45 * k;
    // à noite as cores ficam mais saturadas (senão o pastel vira cinza)
    const y = 0.3 * m[0] + 0.59 * m[1] + 0.11 * m[2];
    const sat = 1 + esc * 0.55 * k;
    return [(y + (m[0] - y) * sat) * f, (y + (m[1] - y) * sat) * f, (y + (m[2] - y) * sat) * f];
  }

  // ---------------------------------------------------------------- terreno
  // y(x) = soma de três senoides; "par" é o fator de paralaxe (quanto a camada anda com a câmera).
  const CAMADAS = {
    montanhas: { par: 0.04, base: 0.585, a: [56, 24, 9], per: [1500, 640, 250], p: [0.4, 2.1, 4.7], pico: true, topo: '#CDBFEA', fundo: '#BBA9E0', nevoa: 0.6 },
    colinasA:  { par: 0.10, base: 0.640, a: [34, 17, 7], per: [1150, 480, 200], p: [1.3, 0.2, 3.3], topo: '#C6D3EA', fundo: '#AFC2E0', nevoa: 0.46 },
    colinasB:  { par: 0.22, base: 0.705, a: [30, 14, 6], per: [950, 420, 170],  p: [2.2, 4.1, 0.9], topo: '#BADCCB', fundo: '#A2C8B6', nevoa: 0.3 },
    caminho:   { par: 0.60, base: 0.800, a: [24, 11, 4], per: [1400, 560, 220], p: [0.7, 3.0, 1.6], topo: '#C2E0B4', fundo: '#9FCB9E', nevoa: 0.1 },
    frente:    { par: 1.30, base: 0.945, a: [26, 12, 5], per: [1050, 440, 170], p: [3.3, 0.5, 2.4], topo: '#A9D49D', fundo: '#8DBF8B', nevoa: 0 },
  };
  function yCrista(L, x, rol) {
    const X = x + rol * L.par;
    const w0 = Math.sin((TAU * X) / L.per[0] + L.p[0]);
    const w1 = Math.sin((TAU * X) / L.per[1] + L.p[1]);
    const w2 = Math.sin((TAU * X) / L.per[2] + L.p[2]);
    const h0 = L.pico ? L.a[0] * (1.15 - 1.5 * Math.abs(w0)) : L.a[0] * w0;
    return L.base * ALT - (h0 + L.a[1] * w1 + L.a[2] * w2);
  }
  function inclinacao(L, x, rol) {
    return Math.atan2(yCrista(L, x + 6, rol) - yCrista(L, x - 6, rol), 12);
  }

  function preencherCamada(ctx, L, S) {
    const { W, dia } = S;
    // cor do terreno: névoa atmosférica + tom do momento do dia (roxo ao entardecer, verde ao meio-dia)
    const tinge = (hex, nevoa) => luz(mix(mix(rgb(hex), dia.haze, nevoa), dia.hill, dia.hillMix * (1 - 0.55 * L.nevoa)), dia, 0.55);
    const topo = tinge(L.topo, L.nevoa);
    const fundo = tinge(L.fundo, L.nevoa * 0.7);
    ctx.beginPath();
    ctx.moveTo(-14, ALT + 14);
    for (let x = -14; x <= W + 14; x += 8) ctx.lineTo(x, yCrista(L, x, S.rolagem));
    ctx.lineTo(W + 14, ALT + 14);
    ctx.closePath();
    const yTopo = L.base * ALT - (L.a[0] + L.a[1] + L.a[2]);
    const g = ctx.createLinearGradient(0, yTopo, 0, yTopo + 430);
    g.addColorStop(0, css(topo)); g.addColorStop(1, css(fundo));
    ctx.fillStyle = g; ctx.fill();
    // luz de contorno quente na crista
    if (dia.rimA > 0.05) {
      ctx.beginPath();
      for (let x = -14; x <= W + 14; x += 8) {
        const y = yCrista(L, x, S.rolagem);
        x === -14 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = css(dia.rim, 0.5 * dia.rimA * (1 - L.nevoa * 0.5));
      ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke();
    }
  }

  // ---------------------------------------------------------------- céu
  function ceuGradiente(ctx, S) {
    const { W, dia } = S;
    const g = ctx.createLinearGradient(0, 0, 0, ALT * 0.74);
    g.addColorStop(0, css(dia.top)); g.addColorStop(0.36, css(dia.mid));
    g.addColorStop(0.7, css(dia.low)); g.addColorStop(1, css(dia.hor));
    ctx.fillStyle = g;
    ctx.fillRect(-20, -20, W + 40, ALT + 40);
  }

  const rndE = mulberry32(11);
  const ESTRELAS = Array.from({ length: 280 }, () => ({
    u: rndE(), v: Math.pow(rndE(), 1.35), r: 0.6 + Math.pow(rndE(), 3) * 2.2,
    w: 0.6 + rndE() * 2.4, f: rndE() * TAU, cor: ['#FFFFFF', '#FFF2C8', '#D3E2FF'][Math.floor(rndE() * 3)],
  }));
  function brilho4(ctx, x, y, r) {
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y);
    ctx.quadraticCurveTo(x, y, x, y - r);
    ctx.closePath(); ctx.fill();
  }
  function estrelas(ctx, S) {
    const { W, dia, t } = S;
    if (dia.star < 0.02) return;
    for (const e of ESTRELAS) {
      const y = e.v * ALT * 0.62;
      const alt = y / ALT;
      const fade = clamp((0.6 - alt) / 0.22);
      const tw = 0.55 + 0.45 * Math.sin(t * e.w + e.f);
      const a = dia.star * fade * tw;
      if (a < 0.02) continue;
      const x = e.u * W;
      ctx.fillStyle = css(rgb(e.cor), a);
      if (e.r > 1.9) {
        brilho4(ctx, x, y, e.r * 3.2 * (0.7 + 0.3 * tw));
      } else {
        ctx.beginPath(); ctx.arc(x, y, e.r, 0, TAU); ctx.fill();
      }
    }
  }

  // ---------------------------------------------------------------- sol e lua (inspirados no seletor dia/noite)
  function posSol(S) {
    const ang = ((S.hora - 6) / 12) * Math.PI;
    const alt = Math.sin(ang);
    return { x: S.W * (0.5 - Math.cos(ang) * 0.34), y: HORIZONTE - alt * 0.5 * ALT, alt };
  }
  function posLua(S) {
    const ang = (mod(S.hora - 18, 24) / 12) * Math.PI;
    const alt = Math.sin(ang);
    return { x: S.W * (0.5 - Math.cos(ang) * 0.34), y: HORIZONTE - alt * 0.52 * ALT, alt, visivel: ang <= Math.PI };
  }
  function brilhoRadial(ctx, x, y, r, cor, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, css(cor, a)); g.addColorStop(0.45, css(cor, a * 0.32)); g.addColorStop(1, css(cor, 0));
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function lua(ctx, S) {
    const m = posLua(S);
    if (!m.visivel || m.alt < -0.12) return;
    const { dia } = S;
    const r = 52 * (1 + (1 - clamp(m.alt * 2)) * 0.12);
    const vis = clamp(dia.star * 1.3 + 0.1);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    brilhoRadial(ctx, m.x, m.y, r * 5.2, rgb('#B9C4FF'), 0.34 * vis * (0.85 + 0.15 * S.A.energia));
    ctx.restore();
    ctx.save(); ctx.globalAlpha = clamp(vis + 0.25);
    const g = ctx.createRadialGradient(m.x - r * 0.35, m.y - r * 0.35, r * 0.1, m.x, m.y, r);
    g.addColorStop(0, '#FBFCFF'); g.addColorStop(0.7, '#E6EAF8'); g.addColorStop(1, '#C7CEE8');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(m.x, m.y, r, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(m.x, m.y, r, 0, TAU); ctx.clip();
    for (const [dx, dy, rr] of [[-0.32, -0.28, 0.2], [0.34, 0.12, 0.15], [-0.08, 0.5, 0.11], [0.12, -0.5, 0.08]]) {
      const gg = ctx.createRadialGradient(m.x + dx * r, m.y + dy * r, 0, m.x + dx * r, m.y + dy * r, rr * r);
      gg.addColorStop(0, 'rgba(160,168,204,0.55)'); gg.addColorStop(1, 'rgba(160,168,204,0.25)');
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(m.x + dx * r, m.y + dy * r, rr * r, 0, TAU); ctx.fill();
    }
    ctx.restore(); ctx.restore();
  }
  function sol(ctx, S) {
    const s = posSol(S);
    if (s.alt < -0.2) return;
    const { dia, A } = S;
    const baixo = 1 - clamp(s.alt * 2.2);
    const r = 70 * (1 + baixo * 0.22);
    const quente = mix(rgb('#FFF3C8'), rgb('#FFB27A'), baixo);
    const forca = clamp((s.alt + 0.2) / 0.3);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    brilhoRadial(ctx, s.x, s.y, r * 9, quente, 0.30 * forca * (0.8 + 0.4 * A.energia));
    brilhoRadial(ctx, s.x, s.y, r * 4.2, quente, 0.42 * forca);
    brilhoRadial(ctx, s.x, s.y, r * 2.1, rgb('#FFFFFF'), 0.4 * forca * (0.85 + 0.3 * A.pulso));
    ctx.restore();
    // anel-aura giratório (inspirado no "loader" com brilho)
    if (forca > 0.05) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.5 * forca * (0.35 + 0.65 * A.energia);
      const cg = ctx.createConicGradient(S.t * 0.5, s.x, s.y);
      ['#FFB3C7', '#FFD9A0', '#FFF3B0', '#B9F0D0', '#B8DCFF', '#D2B9FF', '#FFB3C7'].forEach((c, i, a) => cg.addColorStop(i / (a.length - 1), c));
      ctx.strokeStyle = cg; ctx.lineWidth = 9 + 6 * A.pulso;
      ctx.beginPath(); ctx.arc(s.x, s.y, r * 1.55 + 6 * A.pulso, 0, TAU); ctx.stroke();
      ctx.restore();
    }
    const g = ctx.createRadialGradient(s.x - r * 0.3, s.y - r * 0.3, r * 0.1, s.x, s.y, r);
    g.addColorStop(0, '#FFFCE8'); g.addColorStop(0.55, css(mix(rgb('#FFEBB0'), quente, 0.5))); g.addColorStop(1, css(mix(rgb('#FFD48A'), quente, 0.7)));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, TAU); ctx.clip();
    const sh = ctx.createRadialGradient(s.x + r * 0.5, s.y + r * 0.55, r * 0.4, s.x + r * 0.5, s.y + r * 0.55, r * 1.1);
    sh.addColorStop(0, 'rgba(255,170,110,0)'); sh.addColorStop(1, 'rgba(255,150,100,0.35)');
    ctx.fillStyle = sh; ctx.fillRect(s.x - r, s.y - r, r * 2, r * 2);
    ctx.restore();
  }
  function raios(ctx, S) {
    const s = posSol(S);
    const { A, t } = S;
    const forca = clamp(1 - Math.abs(s.alt - 0.16) * 2.4) * (s.alt > -0.08 ? 1 : 0) * (0.35 + 0.65 * A.energia);
    if (forca < 0.03) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(s.x, s.y);
    const quente = mix(rgb('#FFE7B8'), rgb('#FFB48A'), 1 - clamp(s.alt * 2.2));
    // raios suaves: cada um é desenhado duas vezes (largo e fraco + estreito) para borda macia
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * TAU + t * 0.03;
      const larg = 0.045 + 0.03 * hash1(i * 3.1);
      for (const [f, alfa] of [[1, 0.05], [0.55, 0.05]]) {
        const g = ctx.createLinearGradient(0, 0, 1500, 0);
        g.addColorStop(0, css(quente, alfa * forca)); g.addColorStop(1, css(quente, 0));
        ctx.save(); ctx.rotate(a);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1500, -1500 * larg * f); ctx.lineTo(1500, 1500 * larg * f); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- nuvens de dois tons (como no seletor)
  const rndN = mulberry32(100);
  const NUVENS = Array.from({ length: 12 }, () => ({
    x0: rndN() * 2800, y: (0.07 + rndN() * 0.38) * ALT, s: 0.65 + rndN() * 1.15, v: 5 + rndN() * 11,
  }));
  function caminhoNuvem(ctx, x, y, s) {
    ctx.beginPath();
    for (const [cx, cy, r] of [[0, 0, 30], [34, -18, 40], [78, -10, 34], [112, 2, 26], [-30, 8, 24], [52, 4, 36]]) {
      ctx.moveTo(x + (cx + r) * s, y + cy * s); ctx.arc(x + cx * s, y + cy * s, r * s, 0, TAU);
    }
    ctx.roundRect(x - 52 * s, y + 4 * s, 196 * s, 32 * s, 16 * s);
  }
  function nuvens(ctx, S) {
    const { W, dia, t, rolagem } = S;
    const periodo = W + 800;
    const so = posSol(S), visSol = clamp((so.alt + 0.05) / 0.3);
    for (const n of NUVENS) {
      const x = mod(n.x0 - t * n.v - rolagem * 0.03, periodo) - 400;
      // as nuvens ficam mais transparentes na frente do sol, para ele brilhar através delas
      const d = Math.hypot(x + 60 * n.s - so.x, n.y - so.y);
      const abre = 1 - 0.5 * visSol * Math.exp(-(d * d) / (2 * 260 * 260));
      ctx.save();
      ctx.globalAlpha = clamp(0.55 + dia.a * 0.4) * abre;
      caminhoNuvem(ctx, x + 16 * n.s, n.y - 12 * n.s, n.s * 1.06);
      ctx.fillStyle = css(dia.cloudB); ctx.fill();
      caminhoNuvem(ctx, x, n.y, n.s);
      const g = ctx.createLinearGradient(0, n.y - 50 * n.s, 0, n.y + 36 * n.s);
      g.addColorStop(0, css(dia.cloud)); g.addColorStop(1, css(mix(dia.cloud, dia.cloudB, 0.42)));
      ctx.fillStyle = g; ctx.fill();
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------- vilarejo, árvores, flora
  function vilarejo(ctx, S, L, xIni, semente) {
    const { dia } = S;
    const casas = 6 + Math.floor(hash1(semente) * 4);
    const noite = clamp(dia.star * 1.15 - 0.1);
    for (let i = 0; i < casas; i++) {
      const w = 22 + hash1(semente + i * 1.7) * 22, h = 15 + hash1(semente + i * 2.3) * 20;
      const x = xIni + i * 34 + (hash1(semente + i) - 0.5) * 12;
      const sx = x - S.rolagem * L.par;
      const y = yCrista(L, sx, S.rolagem) + 3;
      ctx.fillStyle = css(luz('#F7E6D2', dia, 0.9)); ctx.fillRect(sx, y - h, w, h);
      ctx.fillStyle = css(luz('#E9CDB4', dia, 0.9)); ctx.fillRect(sx + w * 0.72, y - h, w * 0.28, h);
      ctx.fillStyle = css(luz('#FFF3E2', dia, 0.9)); ctx.fillRect(sx - 1.5, y - h - 3, w + 3, 3.5);
      if (i % 4 === 1) {                       // cúpula
        ctx.fillStyle = css(luz('#F4DCC6', dia, 0.9));
        ctx.beginPath(); ctx.arc(sx + w / 2, y - h - 3, w * 0.36, Math.PI, 0); ctx.fill();
      }
      const jan = noite > 0.05 ? css(rgb('#FFE08A'), 0.25 + 0.75 * noite) : css(luz('#C9B8DC', dia, 0.9));
      ctx.fillStyle = jan;
      ctx.beginPath(); ctx.roundRect(sx + w * 0.22, y - h * 0.62, w * 0.2, h * 0.42, 3); ctx.fill();
    }
  }

  function arvore(ctx, S, x, y, s, semente) {
    const { dia, t } = S;
    const bal = Math.sin(t * 1.1 + semente * 5) * 2 * s;
    ctx.fillStyle = 'rgba(70,60,120,0.10)';
    ctx.beginPath(); ctx.ellipse(x + 6 * s, y + 2, 34 * s, 6 * s, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = css(luz('#B99A86', dia)); ctx.lineWidth = 9 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - 4 * s, y - 24 * s, x + 2 * s + bal * 0.3, y - 46 * s); ctx.stroke();
    const cx = x + bal, cy = y - 62 * s;
    const c1 = css(luz('#9DC3A4', dia)), c2 = css(luz('#BBD9B3', dia)), c3 = css(luz('#DCEBC9', dia));
    const bolas = [[-22, 8, 22], [0, -4, 27], [24, 8, 21], [-6, 20, 19], [14, -18, 19]];
    ctx.fillStyle = c1; ctx.beginPath();
    for (const [dx, dy, r] of bolas) { ctx.moveTo(cx + (dx + r) * s, cy + dy * s); ctx.arc(cx + dx * s, cy + dy * s, r * s, 0, TAU); }
    ctx.fill();
    ctx.fillStyle = c2; ctx.beginPath();
    for (const [dx, dy, r] of bolas) { ctx.moveTo(cx + (dx - 3 + r * 0.72) * s, cy + (dy - 4) * s); ctx.arc(cx + (dx - 3) * s, cy + (dy - 4) * s, r * 0.72 * s, 0, TAU); }
    ctx.fill();
    ctx.fillStyle = c3; ctx.beginPath();
    for (const [dx, dy, r] of bolas.slice(0, 3)) { ctx.moveTo(cx + (dx - 6 + r * 0.32) * s, cy + (dy - 9) * s); ctx.arc(cx + (dx - 6) * s, cy + (dy - 9) * s, r * 0.32 * s, 0, TAU); }
    ctx.fill();
  }

  function arvores(ctx, S, L, cel, prob, escala, sem) {
    const c0 = Math.floor((S.rolagem * L.par - 120) / cel), c1 = Math.floor((S.rolagem * L.par + S.W + 120) / cel);
    for (let c = c0; c <= c1; c++) {
      if (hash1(c * 3.31 + sem) > prob) continue;
      const wx = c * cel + hash1(c * 1.7 + sem) * cel * 0.8;
      const sx = wx - S.rolagem * L.par;
      const s = escala * (0.75 + hash1(c * 5.9 + sem) * 0.55);
      arvore(ctx, S, sx, yCrista(L, sx, S.rolagem) + 2, s, c + sem);
    }
  }
  function vilarejos(ctx, S, L) {
    const CEL = 1500;
    const c0 = Math.floor((S.rolagem * L.par - 400) / CEL), c1 = Math.floor((S.rolagem * L.par + S.W + 200) / CEL);
    for (let c = c0; c <= c1; c++) {
      if (hash1(c * 3.7 + 1.1) < 0.45) continue;
      vilarejo(ctx, S, L, c * CEL + 300 + hash1(c * 9.1) * 500, c * 11.3);
    }
  }

  const CORES_FLOR = ['#FFB3C7', '#CDB8F5', '#FFE28F', '#FFFFFF', '#FFC9A3'];
  function florzinha(ctx, S, x, y, h, semente, pulso) {
    const bal = Math.sin(S.t * 1.7 + semente * 4) * 4 * (h / 60);
    ctx.strokeStyle = css(luz('#8BB98A', S.dia)); ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + bal * 0.4, y - h * 0.55, x + bal, y - h); ctx.stroke();
    const cor = CORES_FLOR[Math.floor(hash1(semente * 7.7) * CORES_FLOR.length)];
    const r = (6.5 + hash1(semente) * 2.5) * (1 + 0.16 * pulso);
    ctx.fillStyle = css(luz(cor, S.dia, 0.8));
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU + semente;
      ctx.beginPath(); ctx.arc(x + bal + Math.cos(a) * r * 0.85, y - h + Math.sin(a) * r * 0.85, r * 0.62, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = css(luz('#FFE7A0', S.dia, 0.8));
    ctx.beginPath(); ctx.arc(x + bal, y - h, r * 0.42, 0, TAU); ctx.fill();
  }
  function primeiroPlano(ctx, S) {
    const L = CAMADAS.frente;
    const CEL = 46;
    const c0 = Math.floor((S.rolagem * L.par - 60) / CEL), c1 = Math.floor((S.rolagem * L.par + S.W + 60) / CEL);
    const pulso = S.A.pulso;
    for (let c = c0; c <= c1; c++) {
      const h1 = hash1(c * 2.13 + 4), h2 = hash1(c * 7.77 + 1);
      const wx = c * CEL + h1 * CEL;
      const sx = wx - S.rolagem * L.par;
      const y = yCrista(L, sx, S.rolagem) + 4;
      if (h2 < 0.04) {                      // pedra
        ctx.fillStyle = css(luz('#DAD3E8', S.dia));
        ctx.beginPath(); ctx.ellipse(sx, y - 6, 24 + h1 * 12, 14, 0, Math.PI, TAU); ctx.fill();
        ctx.fillStyle = css(luz('#EFEAF7', S.dia)); ctx.beginPath(); ctx.ellipse(sx - 5, y - 11, 12, 6, -0.2, Math.PI, TAU); ctx.fill();
        continue;
      }
      if (h2 < 0.86) {                      // tufo de capim
        const n = 3 + Math.floor(h1 * 3);
        ctx.lineCap = 'round';
        for (let i = 0; i < n; i++) {
          const alt = 20 + hash1(c * 3.3 + i) * 34;
          const lean = (i - (n - 1) / 2) * 9 + Math.sin(S.t * 1.5 + wx * 0.02 + i) * 5 * (alt / 50);
          ctx.strokeStyle = css(luz(i % 2 ? '#8EC58F' : '#A7D79B', S.dia)); ctx.lineWidth = 3.4;
          ctx.beginPath(); ctx.moveTo(sx + (i - n / 2) * 4, y); ctx.quadraticCurveTo(sx + lean * 0.5, y - alt * 0.6, sx + lean, y - alt); ctx.stroke();
        }
      }
      if (h2 > 0.62) florzinha(ctx, S, sx + 8, y, 26 + hash1(c * 9.9) * 34, c, pulso);
    }
  }

  // ---------------------------------------------------------------- partículas
  function coracao(ctx, x, y, r) {
    ctx.beginPath();
    ctx.moveTo(x, y + r * 0.9);
    ctx.bezierCurveTo(x - r * 1.6, y - r * 0.1, x - r * 0.9, y - r * 1.5, x, y - r * 0.6);
    ctx.bezierCurveTo(x + r * 0.9, y - r * 1.5, x + r * 1.6, y - r * 0.1, x, y + r * 0.9);
    ctx.closePath();
  }
  function coracoes(ctx, S) {
    const { t } = S;
    for (const h of S.coracoes) {
      const u = (t - h.t0) / h.dur;
      if (u < 0 || u > 1) continue;
      const a = Math.sin(Math.PI * Math.min(1, u * 1.25)) * 0.85;
      const x = h.x + Math.sin(u * 5 + h.f) * 22, y = h.y - u * 260;
      const r = h.r * (0.7 + 0.5 * Math.min(1, u * 4));
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      brilhoRadial(ctx, x, y, r * 3.4, rgb(h.cor), 0.35 * a);
      ctx.restore();
      ctx.fillStyle = css(rgb(h.cor), a); coracao(ctx, x, y, r); ctx.fill();
      ctx.fillStyle = css(rgb('#FFFFFF'), a * 0.5);
      ctx.beginPath(); ctx.ellipse(x - r * 0.45, y - r * 0.4, r * 0.28, r * 0.16, -0.6, 0, TAU); ctx.fill();
    }
  }
  const rndV = mulberry32(31);
  const VAGALUMES = Array.from({ length: 46 }, () => ({ u: rndV(), v: 0.55 + rndV() * 0.4, f: rndV() * TAU, w: 1.2 + rndV() * 2 }));
  function vagalumes(ctx, S) {
    const vis = clamp((S.dia.star - 0.25) / 0.5);
    if (vis < 0.02) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    VAGALUMES.forEach((v, i) => {
      const x = v.u * S.W + 60 * noise1(S.t * 0.13 + i * 3.1), y = v.v * ALT + 34 * noise1(S.t * 0.17 + i * 5.3);
      const a = vis * (0.35 + 0.65 * Math.max(0, Math.sin(S.t * v.w + v.f)));
      if (a < 0.03) return;
      brilhoRadial(ctx, x, y, 11 + 4 * S.A.pulso, rgb('#FFF3A6'), 0.8 * a);
    });
    ctx.restore();
  }
  function borboletas(ctx, S) {
    const vis = smooth(6.6, 8.0, S.hora) * (1 - smooth(16.6, 17.8, S.hora));
    if (vis < 0.05) return;
    for (let i = 0; i < 5; i++) {
      const x = S.W * (0.15 + 0.7 * hash1(i * 4.4)) + 90 * noise1(S.t * 0.22 + i * 7.1);
      const y = ALT * (0.78 + 0.1 * hash1(i * 8.8)) + 50 * noise1(S.t * 0.27 + i * 3.7);
      const bat = Math.abs(Math.sin(S.t * 9 + i)) * 0.6 + 0.4;
      const cor = ['#FFB3C7', '#CDB8F5', '#FFD99A', '#B8DCFF', '#FFC0E0'][i];
      ctx.save(); ctx.translate(x, y); ctx.scale(1.35, 1.35); ctx.globalAlpha = vis;
      ctx.fillStyle = css(luz(cor, S.dia, 0.7));
      for (const d of [-1, 1]) {
        ctx.beginPath(); ctx.ellipse(d * 8 * bat, -4, 9 * bat, 12, d * 0.5, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.ellipse(d * 6 * bat, 7, 6 * bat, 8, -d * 0.4, 0, TAU); ctx.fill();
      }
      ctx.strokeStyle = 'rgba(80,60,110,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, 10); ctx.stroke();
      ctx.restore();
    }
  }
  function pombas(ctx, S) {
    const { t } = S;
    for (const e of S.pombas) {
      if (t < e.ini - 0.5 || t > e.fim + 0.5) continue;
      const u = (t - e.ini) / (e.fim - e.ini);
      for (let k = 0; k < e.n; k++) {
        const atraso = k * 0.035 + hash1(e.sem + k) * 0.03;
        const v = u - atraso;
        if (v < -0.05 || v > 1.05) continue;
        const x = lerp(-140, S.W + 140, clamp(v, -0.05, 1.05));
        const y = ALT * e.y + Math.sin(v * 7 + k * 1.3 + e.sem) * 46 - v * 90 + (k % 3) * 34 - 20 * k;
        const rot = Math.cos(v * 7 + k * 1.3 + e.sem) * 0.16 - 0.12;
        P.pomba(ctx, S, x, y, 0.85 - (k % 3) * 0.1, { fase: t * 9 + k * 1.7 + e.sem, rot });
      }
    }
  }

  // ---------------------------------------------------------------- personagens no "caminho"
  const REBANHO = [
    { dx: 255, fila: -1, s: 0.86, tipo: 'ovelha', semente: 0.13, off: 0.0 },
    { dx: 395, fila: 1, s: 1.0, tipo: 'ovelha', semente: 1.71, off: 2.1 },
    { dx: 545, fila: -1, s: 0.8, tipo: 'ovelha', semente: 2.44, off: 4.0 },
    { dx: -200, fila: 1, s: 0.95, tipo: 'ovelha', semente: 3.9, off: 1.2 },
    { dx: 160, fila: 1, s: 0.56, tipo: 'cordeiro', semente: 5.2, off: 0.5 },
    { dx: -340, fila: -1, s: 0.82, tipo: 'ovelha', semente: 6.6, off: 3.3 },
  ];
  function personagens(ctx, S, fila) {
    const L = CAMADAS.caminho;
    const chao = S.rolagem * L.par;               // distância percorrida no chão (px)
    const xP = S.W * (S.retrato ? 0.30 : 0.36);
    const olharCeu = clamp((1 - S.andar) * 1.1);
    if (fila === 0) {
      const y = yCrista(L, xP, S.rolagem);
      P.pastor(ctx, S, xP, y + 2, 0.98, {
        andar: S.andar, fase: (chao / P.PASSADA_PASTOR) * TAU, olhar: olharCeu * (0.6 + 0.4 * Math.sin(S.t * 0.4)),
        inclina: inclinacao(L, xP, S.rolagem) * 0.6,
      });
      return;
    }
    for (const o of REBANHO) {
      if (o.fila !== fila) continue;
      const vaga = 26 * Math.sin(S.t * 0.21 + o.semente * 3) * (1 - 0.5 * S.andar);
      const dx = S.retrato ? o.dx * 0.62 : o.dx;
      const x = xP + dx + vaga;
      if (x < -120 || x > S.W + 120) continue;
      const y = yCrista(L, x, S.rolagem) + fila * 13 + 4;
      const cord = o.tipo === 'cordeiro';
      const b = S.batida;
      const pula = cord && S.indiceBatida % 2 === 0 && S.A.energia > 0.18 ? 4 * b * (1 - b) * 15 : 0;
      P.ovelha(ctx, S, x, y, o.s * (1 + fila * 0.05), {
        andar: S.andar, fase: (chao / P.PASSADA_OVELHA) * TAU + o.off, tipo: o.tipo, semente: o.semente,
        pasto: smooth(0.25, 0.7, 0.5 + 0.5 * Math.sin(S.t * 0.4 + o.semente * 4)) * (1 - S.andar),
        pulo: pula, inclina: inclinacao(L, x, S.rolagem) * 0.6,
      });
    }
  }

  // ---------------------------------------------------------------- quadro completo
  function desenhar(ctx, S) {
    const { W, dia } = S;
    const lc = new Map();
    S.L = (hex, k) => {
      const key = hex + (k || 1);
      let v = lc.get(key);
      if (!v) { v = css(luz(hex, dia, k || 1)); lc.set(key, v); }
      return v;
    };
    ctx.save();
    const z = S.zoom;
    ctx.translate(W / 2, ALT * 0.64); ctx.scale(z, z); ctx.translate(-W / 2, -ALT * 0.64);

    ceuGradiente(ctx, S);
    estrelas(ctx, S);
    lua(ctx, S);
    sol(ctx, S);
    raios(ctx, S);
    nuvens(ctx, S);

    preencherCamada(ctx, CAMADAS.montanhas, S);
    preencherCamada(ctx, CAMADAS.colinasA, S);
    vilarejos(ctx, S, CAMADAS.colinasA);
    preencherCamada(ctx, CAMADAS.colinasB, S);
    arvores(ctx, S, CAMADAS.colinasB, 300, 0.6, 0.42, 3);
    preencherCamada(ctx, CAMADAS.caminho, S);
    arvores(ctx, S, CAMADAS.caminho, 620, 0.5, 0.95, 9);
    personagens(ctx, S, -1);
    personagens(ctx, S, 0);
    personagens(ctx, S, 1);
    preencherCamada(ctx, CAMADAS.frente, S);
    primeiroPlano(ctx, S);

    pombas(ctx, S);
    borboletas(ctx, S);
    vagalumes(ctx, S);
    coracoes(ctx, S);
    ctx.restore();
  }

  G.Cena = { desenhar, luz, ALT, HORIZONTE, posSol, CAMADAS, yCrista };
})(window);
