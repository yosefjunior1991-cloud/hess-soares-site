// Peças desenhadas do tema "Salmo 91": peregrino, anjo, leão, serpente, dragão, morcego, flecha, tenda,
// lanterna, rede (o laço do caçador) e asas de penas (usadas pelo anjo e pelas grandes asas do Altíssimo).
// Tudo em tons pastéis, desenhado em código (canvas 2D), sem imagens. Cada função desenha em coordenadas
// locais (pés/base em y = 0) e é pura em relação ao tempo que recebe.
(function (G) {
  'use strict';
  const { clamp, lerp, smooth, mod, css, hash1, toLab, fromLab, mixLab, rgb } = G.U;
  const TAU = Math.PI * 2;
  const ml = (a, b, t) => fromLab(mixLab(toLab(a), toLab(b), t));
  const aj = (c, dL, fC = 1) => { const [L, a, b] = toLab(c); return fromLab([clamp(L + dL, 0, 1), a * fC, b * fC]); };
  const H = (hex) => rgb(hex);

  // paleta das peças (RGB)
  const K = {
    manto: H('#aeb8ee'), mantoClaro: H('#d4daf8'), mantoEscuro: H('#8d96d6'), pele: H('#f7d6c1'), bota: H('#b88f94'), cajado: H('#cfa77f'), mochila: H('#e6c39c'),
    branco: H('#fffaf4'), creme: H('#fff1d6'), ouro: H('#ffd98a'), ouroClaro: H('#ffeab8'), lilas: H('#e2dcf6'), rosa: H('#f7c6d2'),
    mel: H('#f3c98f'), crina: H('#e2a86c'), crinaClara: H('#efc592'), focinho: H('#fae7c8'),
    verde: H('#a9d6bd'), verdeEscuro: H('#78b59b'), ameixa: H('#bba6dd'), ameixaClara: H('#e3d3f3'), sombra: H('#8f86b8'),
  };

  const elipse = (ctx, x, y, rx, ry, rot, cor) => { ctx.fillStyle = cor; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, TAU); ctx.fill(); };
  const disco = (ctx, x, y, r, cor) => { ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
  function brilhoRadial(ctx, x, y, r, cor, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, css(cor, a)); g.addColorStop(0.4, css(cor, a * 0.36)); g.addColorStop(1, css(cor, 0));
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function brilho4(ctx, x, y, r) {
    ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r);
    ctx.closePath(); ctx.fill();
  }

  // ---------------------------------------------------------------- asa de penas (lado +x a partir do ombro em 0,0)
  // o.L comprimento, o.abre 0..1 (fechada -> aberta), o.bate -1..1, o.t tempo, o.tom: {claro, medio, sombra}
  function asaPenas(ctx, o) {
    const L = o.L, ab = clamp(o.abre), t = o.t || 0, bate = o.bate || 0;
    const tom = o.tom || { primarias: K.lilas, secundarias: K.creme, coberteiras: K.branco };
    const elev = lerp(-1.3, 0.12, ab) + bate * 0.09;
    const alcance = L * (0.55 + 0.45 * ab);
    const T = [Math.cos(elev) * alcance, Math.sin(elev) * alcance];
    const C = [T[0] * 0.5, T[1] * 0.5 - L * 0.20 * ab];
    const braco = (u) => { const a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, d = u * u; return [b * C[0] + d * T[0], b * C[1] + d * T[1]]; };
    const tang = (u) => { const dx = 2 * (1 - u) * C[0] + 2 * u * (T[0] - C[0]), dy = 2 * (1 - u) * C[1] + 2 * u * (T[1] - C[1]); return Math.atan2(dy, dx); };
    const FILEIRAS = [
      { n: 11, l0: 0.50, l1: 1.00, w: 0.082, cor: tom.primarias, de: 0 },
      { n: 11, l0: 0.40, l1: 0.78, w: 0.090, cor: tom.secundarias, de: 0.02 },
      { n: 10, l0: 0.26, l1: 0.46, w: 0.100, cor: tom.coberteiras, de: 0.04 },
    ];
    for (const f of FILEIRAS) {
      for (let i = 0; i < f.n; i++) {
        const u = clamp((i + 0.5) / f.n * 0.97 + f.de);
        const P = braco(u);
        const spread = lerp(1.55, 0.62, u) * lerp(0.55, 1, ab);
        const psi = tang(u) + spread + Math.sin(t * 1.3 - u * 2.2 + (o.fase || 0)) * 0.035 * (0.4 + ab) + bate * 0.05 * u;
        const l = L * lerp(f.l0, f.l1, u) * (0.45 + 0.55 * ab);
        const w = f.w * L;
        const dx = Math.cos(psi), dy = Math.sin(psi), nx = -dy, ny = dx;
        const at = (a, b2) => [P[0] + dx * l * a + nx * w * b2, P[1] + dy * l * a + ny * w * b2];   // ponto em coordenadas da pena
        const g = ctx.createLinearGradient(P[0], P[1], P[0] + dx * l, P[1] + dy * l);
        g.addColorStop(0, css(ml(f.cor, K.ouroClaro, 0.25))); g.addColorStop(0.55, css(f.cor)); g.addColorStop(1, css(ml(f.cor, K.branco, 0.6)));
        ctx.fillStyle = g;
        ctx.beginPath();
        let q = at(0, 0.28); ctx.moveTo(q[0], q[1]);
        let c1 = at(0.30, 0.62), c2 = at(0.78, 0.60), e = at(0.94, 0.34); ctx.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], e[0], e[1]);
        c1 = at(1.07, 0); e = at(0.94, -0.34); ctx.quadraticCurveTo(c1[0], c1[1], e[0], e[1]);
        c1 = at(0.78, -0.60); c2 = at(0.30, -0.62); e = at(0, -0.28); ctx.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], e[0], e[1]);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = css(K.branco, 0.5); ctx.lineWidth = Math.max(0.8, w * 0.05);
        ctx.beginPath(); ctx.moveTo(P[0], P[1]); ctx.lineTo(P[0] + dx * l * 0.88, P[1] + dy * l * 0.88); ctx.stroke();
      }
    }
    // borda de ataque macia
    ctx.strokeStyle = css(K.branco, 0.9); ctx.lineWidth = Math.max(2, L * 0.012); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(C[0], C[1], T[0], T[1]); ctx.stroke();
  }

  // ---------------------------------------------------------------- peregrino (de lado, olhando para +x)
  // o: dir, fase (marcha), andar 0..1, sentado 0..1, bracos 0..1 (erguidos), olhar 0..1 (cabeça para cima), alfa, manto (cor)
  function peregrino(ctx, x, y, s, o) {
    const dir = o.dir || 1, fase = o.fase || 0, andar = o.andar || 0, sent = o.sentado || 0, br = o.bracos || 0, ol = o.olhar || 0;
    const A = o.alfa === undefined ? 1 : o.alfa;
    const manto = o.manto || K.manto, claro = ml(manto, K.branco, 0.4), escuro = aj(manto, -0.10);
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    ctx.globalAlpha *= A;
    const bob = andar * Math.abs(Math.sin(fase)) * 3.2;
    const quad = [0, lerp(-92, -34, sent) - bob];
    const ombro = [lerp(2, -3, sent), lerp(-152, -98, sent) - bob * 0.8];
    const cab = [ombro[0] + 3 + ol * 4, ombro[1] - 22 - ol * 1.5];
    elipse(ctx, 6, 2, 46 - 6 * sent, 7, 0, css(K.sombra, 0.16));
    if (sent > 0.15) {                                                     // um tronco serve de banco
      ctx.globalAlpha *= 1; ctx.fillStyle = css(aj(K.cajado, -0.04), clamp(sent * 1.4)); ctx.beginPath(); ctx.roundRect(-30, -26, 64, 26, 10); ctx.fill();
      ctx.fillStyle = css(aj(K.cajado, 0.08), clamp(sent * 1.4)); ctx.beginPath(); ctx.ellipse(34, -13, 6, 13, 0, 0, TAU); ctx.fill();
    }
    // mochila
    ctx.fillStyle = css(K.mochila); ctx.beginPath(); ctx.roundRect(ombro[0] - 32, ombro[1] + 4, 22, 40, 8); ctx.fill();
    ctx.fillStyle = css(aj(K.mochila, -0.1)); ctx.beginPath(); ctx.roundRect(ombro[0] - 32, ombro[1] + 30, 22, 14, 6); ctx.fill();
    // braço de trás
    const bracoPara = (alvo, sh, esp, cor) => {
      ctx.strokeStyle = css(cor); ctx.lineWidth = esp; ctx.lineCap = 'round';
      const mx = (sh[0] + alvo[0]) / 2 + 3, my = (sh[1] + alvo[1]) / 2 + 3;
      ctx.beginPath(); ctx.moveTo(sh[0], sh[1]); ctx.quadraticCurveTo(mx, my, alvo[0], alvo[1]); ctx.stroke();
      disco(ctx, alvo[0], alvo[1], esp * 0.52, css(K.pele));
    };
    const swing = Math.sin(fase) * andar;
    const reposoT = [ombro[0] - 6 - swing * 20, ombro[1] + 46 - sent * 8];
    const ergueT = [ombro[0] - 14, ombro[1] - 54];
    bracoPara([lerp(reposoT[0], ergueT[0], br), lerp(reposoT[1], ergueT[1], br)], [ombro[0] - 4, ombro[1] + 6], 11, escuro);
    // pernas
    const perna = (sinal) => {
      const ph = Math.sin(fase + (sinal > 0 ? 0 : Math.PI));
      const lift = Math.max(0, Math.cos(fase + (sinal > 0 ? 0 : Math.PI))) * 12 * andar;
      const pe0 = [quad[0] + ph * 30 * andar + sinal * 3, -lift];
      const joelho0 = [quad[0] + ph * 15 * andar + 8 * andar, (quad[1] + 0) * 0.5 - lift * 0.3];
      const pe1 = [quad[0] + 44 + sinal * 6, 0], joelho1 = [quad[0] + 40, quad[1] + 2];
      const pe = [lerp(pe0[0], pe1[0], sent), lerp(pe0[1], pe1[1], sent)];
      const jo = [lerp(joelho0[0], joelho1[0], sent), lerp(joelho0[1], joelho1[1], sent)];
      ctx.strokeStyle = css(sinal > 0 ? aj(manto, -0.2) : aj(manto, -0.26)); ctx.lineWidth = 15; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(quad[0], quad[1]); ctx.lineTo(jo[0], jo[1]); ctx.lineTo(pe[0], pe[1] - 6); ctx.stroke();
      elipse(ctx, pe[0] + 6, pe[1] - 4, 14, 7, 0, css(K.bota));
    };
    perna(-1); perna(1);
    // manto
    const hemY = lerp(-46, -20, sent), balanca = Math.sin(fase) * 5 * andar;
    const mc = ctx.createLinearGradient(ombro[0] - 20, ombro[1], ombro[0] + 30, hemY);
    mc.addColorStop(0, css(claro)); mc.addColorStop(1, css(manto));
    ctx.fillStyle = mc;
    ctx.beginPath();
    ctx.moveTo(ombro[0] + 4, ombro[1] - 2);
    ctx.quadraticCurveTo(ombro[0] - 24, ombro[1] + 10, quad[0] - 34 - balanca, hemY);
    ctx.quadraticCurveTo(quad[0] - 2, hemY + 9 + balanca, quad[0] + 32 + balanca * 0.5, hemY + 2);
    ctx.quadraticCurveTo(ombro[0] + 22, ombro[1] + 20, ombro[0] + 4, ombro[1] - 2);
    ctx.fill();
    ctx.fillStyle = css(escuro, 0.38);
    ctx.beginPath(); ctx.moveTo(ombro[0] - 8, ombro[1] + 6); ctx.quadraticCurveTo(quad[0] - 26, quad[1] - 10, quad[0] - 34 - balanca, hemY); ctx.quadraticCurveTo(quad[0] - 10, hemY + 5, quad[0] - 4, hemY - 2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = css(K.ouro, 0.9); ctx.lineWidth = 4; ctx.lineCap = 'round';        // cinto
    ctx.beginPath(); ctx.moveTo(quad[0] - 22, quad[1] - 18); ctx.quadraticCurveTo(quad[0] + 2, quad[1] - 12, quad[0] + 20, quad[1] - 20); ctx.stroke();
    // capuz e rosto
    elipse(ctx, cab[0] - 5, cab[1] + 1, 23, 24, 0, css(claro));
    disco(ctx, cab[0] + 3, cab[1] + 1, 16.5, css(K.pele));
    ctx.strokeStyle = css(escuro, 0.7); ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cab[0] - 5, cab[1] + 1, 22, -1.9, 1.35); ctx.stroke();                  // aba do capuz
    const piscar = (o.t !== undefined && mod(o.t + 1.3, 4.7) < 0.12) ? 0.15 : 1;
    ctx.fillStyle = css(H('#5b5470')); ctx.beginPath(); ctx.ellipse(cab[0] + 10, cab[1] - 1 - ol * 2, 2.1, 2.6 * piscar, 0, 0, TAU); ctx.fill();
    disco(ctx, cab[0] + 9, cab[1] + 6, 4.5, css(K.rosa, 0.55));
    ctx.strokeStyle = css(H('#c98d8d')); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(cab[0] + 12, cab[1] + 8); ctx.quadraticCurveTo(cab[0] + 15, cab[1] + 10, cab[0] + 17, cab[1] + 8); ctx.stroke();
    // braço da frente + cajado
    const hF = [ombro[0] + 14 + swing * 12, ombro[1] + 50 - sent * 10];
    const sobe = [ombro[0] + 24, ombro[1] - 48];
    const mao = [lerp(hF[0], sobe[0], br), lerp(hF[1], sobe[1], br)];
    const cajA = 1 - br;
    if (cajA > 0.02) {
      const sx = hF[0] + 22 - sent * 6;
      ctx.strokeStyle = css(K.cajado, cajA); ctx.lineWidth = 6; ctx.lineCap = 'round';
      const ponta = -Math.max(0, Math.cos(fase + 1.2)) * 12 * andar;                     // o cajado sai do chão a cada passo
      ctx.beginPath(); ctx.moveTo(sx + 2, ponta); ctx.lineTo(sx, hF[1] - lerp(46, 30, sent)); ctx.stroke();
      ctx.strokeStyle = css(aj(K.cajado, -0.16), cajA); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(sx - 5, hF[1] - lerp(50, 34, sent), 7, 0.4, 3.9); ctx.stroke();
    }
    bracoPara(mao, [ombro[0] + 6, ombro[1] + 6], 12, claro);
    ctx.restore();
  }

  // ---------------------------------------------------------------- anjo (de frente, flutuando; y = barra da túnica)
  function anjo(ctx, x, y, s, o) {
    const t = o.t || 0, A = o.alfa === undefined ? 1 : o.alfa, br = o.bracos || 0, fase = o.fase || 0;
    const bate = Math.sin(t * 2.3 + fase);
    ctx.save(); ctx.translate(x, y + Math.sin(t * 1.4 + fase) * 6 * s); ctx.scale(s, s);
    ctx.globalAlpha *= A;
    brilhoRadial(ctx, 0, -110, 190, K.ouroClaro, 0.55);
    ctx.shadowColor = css(K.sombra, 0.4); ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
    // asas
    for (const lado of [-1, 1]) {
      ctx.save(); ctx.translate(lado * 10, -118); ctx.scale(lado, 1);
      asaPenas(ctx, { L: 118, abre: 0.62 + 0.14 * bate, bate, t, fase: fase + lado, tom: { primarias: K.lilas, secundarias: K.creme, coberteiras: K.branco } });
      ctx.restore();
    }
    // túnica
    const g = ctx.createLinearGradient(0, -150, 0, 0);
    g.addColorStop(0, css(K.branco)); g.addColorStop(1, css(ml(K.lilas, K.rosa, 0.5)));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-17, -140);
    ctx.quadraticCurveTo(-46, -60, -42 + Math.sin(t * 1.6 + fase) * 4, 0);
    ctx.quadraticCurveTo(0, 12 + Math.sin(t * 2 + fase) * 3, 42 + Math.sin(t * 1.6 + fase + 1) * 4, 0);
    ctx.quadraticCurveTo(46, -60, 17, -140);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = css(ml(K.lilas, K.sombra, 0.25), 0.4);
    ctx.beginPath(); ctx.moveTo(4, -138); ctx.quadraticCurveTo(26, -60, 40, -2); ctx.quadraticCurveTo(10, 8, 0, 4); ctx.quadraticCurveTo(14, -70, 4, -138); ctx.fill();
    ctx.strokeStyle = css(K.ouro, 0.95); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-17, -118); ctx.quadraticCurveTo(0, -110, 17, -118); ctx.stroke();
    // braços (erguidos em concha quando bracos = 1)
    for (const lado of [-1, 1]) {
      const rep = [lado * 30, -76], alvo = [lado * 22, -102 - br * 6], ponta = [lerp(rep[0], lado * 12, br), lerp(rep[1], -118, br)];
      ctx.strokeStyle = css(K.branco); ctx.lineWidth = 11; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(lado * 14, -134); ctx.quadraticCurveTo(lado * 36, -110, ponta[0], ponta[1]); ctx.stroke();
      disco(ctx, ponta[0], ponta[1], 6.5, css(K.pele));
    }
    if (br > 0.05) brilhoRadial(ctx, 0, -122, 46, K.ouroClaro, 0.7 * br);
    // cabeça
    disco(ctx, 0, -158, 18, css(K.pele));
    ctx.fillStyle = css(K.ouro);
    ctx.beginPath(); ctx.arc(0, -162, 20, Math.PI * 1.02, Math.PI * 1.98); ctx.quadraticCurveTo(14, -150, 20, -138); ctx.lineTo(16, -150); ctx.lineTo(-16, -150); ctx.lineTo(-20, -138); ctx.quadraticCurveTo(-14, -150, -20, -162); ctx.fill();
    disco(ctx, -6.5, -156, 1.9, css(H('#5b5470'))); disco(ctx, 6.5, -156, 1.9, css(H('#5b5470')));
    ctx.strokeStyle = css(H('#c98d8d')); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(0, -150, 5, 0.25, 2.9); ctx.stroke();
    disco(ctx, -11, -150, 3.4, css(K.rosa, 0.5)); disco(ctx, 11, -150, 3.4, css(K.rosa, 0.5));
    ctx.strokeStyle = css(K.ouro, 0.95); ctx.lineWidth = 3.4;                                           // auréola
    ctx.beginPath(); ctx.ellipse(0, -186, 17, 5, 0, 0, TAU); ctx.stroke();
    ctx.restore();
  }

  // ---------------------------------------------------------------- leão (olhando para +x)
  // o: abaixa 0..1 (cabeça e patas), boca 0..1, alfa, t
  function leao(ctx, x, y, s, o) {
    const dir = o.dir || 1, ab = o.abaixa || 0, boca = o.boca || 0, A = o.alfa === undefined ? 1 : o.alfa, t = o.t || 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s); ctx.globalAlpha *= A;
    elipse(ctx, 0, 2, 100, 9, 0, css(K.sombra, 0.16));
    const corpoY = -62 + ab * 20;
    const pata = (px, alt, escuro) => {
      const h = alt * (1 - 0.45 * ab);
      ctx.fillStyle = css(escuro ? aj(K.mel, -0.06) : K.mel);
      ctx.beginPath(); ctx.roundRect(px - 10, -h, 20, h, 9); ctx.fill();
      elipse(ctx, px + 4, -2, 15, 7, 0, css(escuro ? aj(K.mel, -0.06) : K.mel));
    };
    pata(-52, 62, true); pata(46, 62, true);
    // rabo
    const bal = Math.sin(t * 1.6) * 6;
    ctx.strokeStyle = css(K.mel); ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-76, corpoY - 6); ctx.quadraticCurveTo(-112, corpoY - 18 + bal, -104 + bal, corpoY - 58); ctx.stroke();
    elipse(ctx, -104 + bal, corpoY - 62, 11, 15, 0.2, css(K.crina));
    // corpo
    const g = ctx.createLinearGradient(0, corpoY - 40, 0, corpoY + 40);
    g.addColorStop(0, css(ml(K.mel, K.branco, 0.18))); g.addColorStop(1, css(K.mel));
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(-4, corpoY, 82, 40, 0, 0, TAU); ctx.fill();
    elipse(ctx, 0, corpoY + 22, 60, 14, 0, css(K.focinho, 0.7));
    pata(-30, 62, false); pata(66, 62, false);
    // juba e cabeça
    const hx = 92, hy = -100 + ab * 36;
    const nJ = 16;
    for (let r = 0; r < 2; r++) {
      for (let i = 0; i < nJ; i++) {
        const a = (i / nJ) * TAU + r * 0.2 + Math.sin(t * 1.2 + i) * 0.04;
        const rad = 38 - r * 12;
        disco(ctx, hx - 6 + Math.cos(a) * rad, hy + Math.sin(a) * rad, 21 - r * 3, css(r ? K.crinaClara : K.crina));
      }
    }
    disco(ctx, hx - 6, hy, 38, css(K.crinaClara));
    disco(ctx, hx + 4, hy + 2, 30, css(K.mel));
    elipse(ctx, hx + 22, hy + 10, 18, 14 + boca * 5, 0, css(K.focinho));
    elipse(ctx, hx + 33, hy + 3, 7, 5, 0, css(K.rosa));
    ctx.strokeStyle = css(H('#c98d8d')); ctx.lineWidth = 2.2; ctx.beginPath();
    ctx.moveTo(hx + 33, hy + 8); ctx.lineTo(hx + 31, hy + 15 + boca * 6); ctx.quadraticCurveTo(hx + 22, hy + 21 + boca * 7, hx + 12, hy + 15 + boca * 4); ctx.stroke();
    const olho = ab > 0.6 ? 0.2 : 1;
    ctx.fillStyle = css(H('#5b5470')); ctx.beginPath(); ctx.ellipse(hx + 17, hy - 7, 3, 3.8 * olho, 0, 0, TAU); ctx.fill();
    disco(ctx, hx - 14, hy - 30, 9, css(K.mel)); disco(ctx, hx - 14, hy - 30, 4.5, css(K.rosa, 0.7));
    ctx.restore();
  }

  // ---------------------------------------------------------------- serpente (cabeça em +x)
  function serpente(ctx, x, y, s, o) {
    const dir = o.dir || 1, t = o.t || 0, A = o.alfa === undefined ? 1 : o.alfa, lev = o.levanta || 0, L = o.L || 190, esp = o.esp || 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s); ctx.globalAlpha *= A;
    elipse(ctx, 0, 2, L * 0.55, 6, 0, css(K.sombra, 0.14));
    const N = 46, pts = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;                                   // 0 = cauda, 1 = cabeça
      const onda = Math.sin(u * 11 - t * 3.2) * (10 + 10 * (1 - u)) * (1 - lev * 0.6);
      const px = lerp(-L, 0, u) + Math.cos(u * 11 - t * 3.2) * 3;
      const levY = -Math.pow(u, 2.4) * lev * 120;
      pts.push([px + lev * Math.pow(u, 3) * -20, -9 + onda * 0.6 + levY]);
    }
    const largura = (u) => esp * (2 + 13 * Math.sin(Math.min(1, u * 1.15) * Math.PI * 0.82 + 0.15));
    for (let i = 0; i < N; i++) {
      const u = i / N;
      disco(ctx, pts[i][0], pts[i][1], largura(u), css(i % 6 < 3 ? K.verde : ml(K.verde, K.verdeEscuro, 0.5)));
    }
    for (let i = 3; i < N; i += 4) {
      const u = i / N;
      ctx.fillStyle = css(K.verdeEscuro, 0.75); ctx.beginPath(); ctx.ellipse(pts[i][0], pts[i][1] - largura(u) * 0.3, largura(u) * 0.45, largura(u) * 0.28, 0, 0, TAU); ctx.fill();
    }
    const hd = pts[N], an = Math.atan2(pts[N][1] - pts[N - 3][1], pts[N][0] - pts[N - 3][0]);
    ctx.save(); ctx.translate(hd[0], hd[1]); ctx.rotate(an * 0.8);
    elipse(ctx, 8, 0, 20 * esp, 12 * esp, 0, css(K.verde));
    elipse(ctx, 10, 4, 15 * esp, 6 * esp, 0, css(K.focinho, 0.8));
    disco(ctx, 12, -4, 2.8, css(H('#5b5470')));
    const lingua = Math.max(0, Math.sin(t * 7)) * 14 * esp;
    ctx.strokeStyle = css(K.rosa); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(26 * esp, 2); ctx.lineTo(26 * esp + lingua, 2); ctx.moveTo(26 * esp + lingua, 2); ctx.lineTo(26 * esp + lingua + 5, -2); ctx.moveTo(26 * esp + lingua, 2); ctx.lineTo(26 * esp + lingua + 5, 6); ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  // ---------------------------------------------------------------- dragão pastel (cabeça em +x)
  function dragao(ctx, x, y, s, o) {
    const dir = o.dir || 1, t = o.t || 0, A = o.alfa === undefined ? 1 : o.alfa, lev = o.levanta === undefined ? 0.6 : o.levanta;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s); ctx.globalAlpha *= A;
    const corpo = K.ameixa, barriga = ml(K.ameixaClara, K.rosa, 0.3), asa = ml(K.ameixaClara, K.branco, 0.2);
    const N = 40, pts = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      pts.push([lerp(-170, 0, u) + Math.sin(u * 7 - t * 2.4) * 8, -20 - Math.pow(u, 2.2) * lev * 150 + Math.sin(u * 7 - t * 2.4) * 18 * (1 - u * lev)]);
    }
    const lar = (u) => 3 + 22 * Math.sin(Math.min(1, u * 1.1) * Math.PI * 0.85 + 0.12);
    // asas (atrás)
    const bate = Math.sin(t * 3.2);
    const base = pts[Math.floor(N * 0.62)];
    for (const lado of [0, 1]) {
      ctx.save(); ctx.translate(base[0] - lado * 14, base[1] - 14);
      ctx.rotate(lerp(-0.5, 0.15, 0.5 + 0.5 * bate) - lado * 0.35);
      ctx.fillStyle = css(asa, lado ? 0.55 : 0.85);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(10, -70, 62, -118); ctx.quadraticCurveTo(52, -78, 78, -62); ctx.quadraticCurveTo(54, -52, 66, -26); ctx.quadraticCurveTo(38, -34, 40, -2); ctx.quadraticCurveTo(20, -14, 0, 0); ctx.fill();
      ctx.strokeStyle = css(corpo, 0.8); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(62, -118); ctx.moveTo(0, 0); ctx.lineTo(78, -62); ctx.moveTo(0, 0); ctx.lineTo(66, -26); ctx.stroke();
      ctx.restore();
    }
    for (let i = 0; i < N; i++) {
      const u = i / N;
      disco(ctx, pts[i][0], pts[i][1], lar(u), css(corpo));
      if (i % 3 === 0 && u > 0.06 && u < 0.93) {                                                        // espinhos nas costas
        ctx.fillStyle = css(K.rosa); ctx.beginPath(); ctx.moveTo(pts[i][0] - 5, pts[i][1] - lar(u) + 3); ctx.lineTo(pts[i][0], pts[i][1] - lar(u) - 12); ctx.lineTo(pts[i][0] + 5, pts[i][1] - lar(u) + 3); ctx.fill();
      }
    }
    for (let i = 4; i < N - 3; i += 2) elipse(ctx, pts[i][0] + 1, pts[i][1] + lar(i / N) * 0.45, lar(i / N) * 0.8, lar(i / N) * 0.35, 0, css(barriga, 0.9));
    const hd = pts[N], an = Math.atan2(pts[N][1] - pts[N - 3][1], pts[N][0] - pts[N - 3][0]);
    ctx.save(); ctx.translate(hd[0], hd[1]); ctx.rotate(an * 0.7);
    elipse(ctx, 12, 0, 30, 20, 0, css(corpo));
    elipse(ctx, 30, 5, 22, 11, 0, css(barriga));
    disco(ctx, 18, -7, 4.4, css(H('#5b5470'))); disco(ctx, 19.2, -8.2, 1.4, css(K.branco));
    ctx.fillStyle = css(K.rosa); ctx.beginPath(); ctx.moveTo(-2, -16); ctx.lineTo(-14, -42); ctx.lineTo(8, -22); ctx.fill(); ctx.beginPath(); ctx.moveTo(10, -18); ctx.lineTo(6, -44); ctx.lineTo(22, -20); ctx.fill();
    disco(ctx, 44, 0, 2.2, css(sombraNariz()));
    ctx.restore();
    ctx.restore();
  }
  function sombraNariz() { return K.sombra; }

  // ---------------------------------------------------------------- morcego (silhueta lilás)
  function morcego(ctx, x, y, s, o) {
    const t = o.t || 0, A = o.alfa === undefined ? 1 : o.alfa, bate = Math.sin(t * 9 + (o.fase || 0));
    ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.dir || 1), s); ctx.globalAlpha *= A;
    const cor = css(ml(K.sombra, K.ameixa, 0.4));
    ctx.fillStyle = cor;
    for (const lado of [-1, 1]) {
      ctx.save(); ctx.scale(lado, 1); ctx.rotate(-bate * 0.45);
      ctx.beginPath(); ctx.moveTo(4, 0); ctx.quadraticCurveTo(22, -26, 56, -18); ctx.quadraticCurveTo(46, -10, 50, -2); ctx.quadraticCurveTo(38, -6, 34, 6); ctx.quadraticCurveTo(24, -2, 14, 8); ctx.quadraticCurveTo(10, 4, 4, 8); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    elipse(ctx, 0, 2, 7, 11, 0, cor);
    ctx.beginPath(); ctx.moveTo(-5, -8); ctx.lineTo(-4, -17); ctx.lineTo(0, -10); ctx.lineTo(4, -17); ctx.lineTo(5, -8); ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------------- flecha (ponta em +x do ângulo)
  function flecha(ctx, x, y, ang, len, alfa, cor) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalAlpha *= alfa;
    const c = cor || ml(K.cajado, K.sombra, 0.35);
    ctx.strokeStyle = css(c); ctx.lineWidth = 4.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(0, 0); ctx.stroke();
    ctx.fillStyle = css(aj(c, -0.1)); ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(-9, -5.5); ctx.lineTo(-9, 5.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = css(K.rosa);
    ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(-len - 9, -6); ctx.lineTo(-len + 8, -1); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(-len - 9, 6); ctx.lineTo(-len + 8, 1); ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------------- tenda e lanterna
  function tenda(ctx, x, y, s, luz) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    elipse(ctx, 0, 3, 120, 11, 0, css(K.sombra, 0.2));
    const lona = ml(K.rosa, K.branco, 0.35), lonaB = ml(K.lilas, K.branco, 0.2), lonaS = ml(K.manto, K.lilas, 0.4);
    ctx.fillStyle = css(lonaS); ctx.beginPath(); ctx.moveTo(-108, 0); ctx.lineTo(-6, -148); ctx.lineTo(96, 0); ctx.closePath(); ctx.fill();   // lado de trás
    const g = ctx.createLinearGradient(-100, -148, 100, 0);
    g.addColorStop(0, css(lonaB)); g.addColorStop(1, css(lona));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-96, 0); ctx.lineTo(-6, -148); ctx.lineTo(60, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = css(K.ouro, 0.5); ctx.beginPath(); ctx.moveTo(-48, -74); ctx.lineTo(-6, -148); ctx.lineTo(18, -112); ctx.closePath(); ctx.fill();
    // porta aberta com luz quente
    ctx.fillStyle = css(ml(K.sombra, K.manto, 0.3)); ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(-6, -92); ctx.lineTo(22, 0); ctx.closePath(); ctx.fill();
    if (luz > 0.01) { const gg = ctx.createRadialGradient(-2, -26, 2, -2, -26, 62); gg.addColorStop(0, css(K.ouroClaro, 0.95 * luz)); gg.addColorStop(1, css(K.ouro, 0)); ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(-6, -92); ctx.lineTo(22, 0); ctx.closePath(); ctx.fill(); }
    ctx.strokeStyle = css(aj(lona, -0.1), 0.9); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-96, 0); ctx.lineTo(-6, -148); ctx.lineTo(60, 0); ctx.stroke();
    ctx.strokeStyle = css(K.cajado); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-6, -148); ctx.lineTo(-6, -170); ctx.stroke();
    ctx.fillStyle = css(K.ouro); ctx.beginPath(); ctx.moveTo(-6, -170); ctx.lineTo(18, -162); ctx.lineTo(-6, -154); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function lanterna(ctx, x, y, s, luz, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    brilhoRadial(ctx, 0, -26, 110 * (0.6 + 0.6 * luz), K.ouroClaro, 0.7 * luz * (0.9 + 0.1 * Math.sin(t * 7)));
    ctx.strokeStyle = css(K.cajado); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -60); ctx.quadraticCurveTo(0, -78, 14, -78); ctx.stroke();
    ctx.fillStyle = css(aj(K.cajado, -0.12)); ctx.beginPath(); ctx.roundRect(-8, -58, 16, 5, 2); ctx.fill();
    ctx.fillStyle = css(ml(K.ouroClaro, K.branco, 0.3), 0.55 + 0.4 * luz); ctx.beginPath(); ctx.roundRect(-9, -50, 18, 24, 5); ctx.fill();
    ctx.fillStyle = css(K.ouro, luz); ctx.beginPath(); ctx.ellipse(0, -38, 4, 7 + Math.sin(t * 9) * 0.8, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = css(aj(K.cajado, -0.12)); ctx.beginPath(); ctx.roundRect(-9, -27, 18, 4, 2); ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------------- rede: o laço do caçador (centro x,y; w x h)
  // o: rasgo 0..1 (fios se partindo), t
  function rede(ctx, x, y, w, h, o) {
    const t = o.t || 0, rasgo = o.rasgo || 0, A = o.alfa === undefined ? 1 : o.alfa;
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha *= A;
    const nx = 11, ny = 8;
    const P = (i, j) => {
      const u = i / nx - 0.5, v = j / ny - 0.5;
      const r = Math.hypot(u * 1.0, v * 1.1);
      const sag = (1 - Math.min(1, r * 1.9)) * h * 0.2;
      const ond = Math.sin(t * 2 + i * 0.7 + j * 0.5) * 4;
      let px = u * w, py = v * h + sag + ond;
      const fuga = rasgo * (hash1(i * 3.1 + j * 7.7) - 0.5) * 220;
      return [px + fuga, py + rasgo * Math.abs(fuga) * 0.8 + rasgo * rasgo * 200 * hash1(i + j * 9)];
    };
    ctx.strokeStyle = css(ml(K.cajado, K.sombra, 0.3), 0.95 - rasgo * 0.5); ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    for (let j = 0; j <= ny; j++) { ctx.beginPath(); for (let i = 0; i <= nx; i++) { const p = P(i, j); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); } ctx.stroke(); }
    for (let i = 0; i <= nx; i++) { ctx.beginPath(); for (let j = 0; j <= ny; j++) { const p = P(i, j); j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); } ctx.stroke(); }
    for (let i = 0; i <= nx; i += 2) for (let j = 0; j <= ny; j += 2) { const p = P(i, j); disco(ctx, p[0], p[1], 3.2, css(aj(K.cajado, -0.14))); }
    ctx.restore();
  }

  G.Seres91 = { K, ml, aj, asaPenas, peregrino, anjo, leao, serpente, dragao, morcego, flecha, tenda, lanterna, rede, brilhoRadial, brilho4, elipse, disco };
})(window);
