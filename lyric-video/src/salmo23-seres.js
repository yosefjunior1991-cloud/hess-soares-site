// Peças desenhadas do tema "Salmo 23": o cordeirinho (quem fala no salmo) e as ovelhas do rebanho, o Pastor de
// luz (Adonai, mostrado como uma figura de luz, sem rosto, para não retratar o Altíssimo), os lobos de sombra
// (os inimigos), a mesa preparada, o cálice que transborda, o chifre de óleo, a lira de Davi e a casa de Adonai.
// Tudo em tons pastéis, desenhado em código. Cada função desenha em coordenadas locais (base em y = 0).
(function (G) {
  'use strict';
  const { clamp, lerp, smooth, mod, css, rgb, hash1 } = G.U;
  const R = G.Seres91, ml = R.ml, aj = R.aj, brilhoRadial = R.brilhoRadial, brilho4 = R.brilho4;
  const TAU = Math.PI * 2;
  const H = (hex) => rgb(hex);

  const K = {
    la: H('#fffaf2'), laSombra: H('#e9e1f4'), laBrilho: H('#ffffff'), rosto: H('#f6ddd0'), orelha: H('#f4c3c8'), perna: H('#dccbc6'), casco: H('#b8a3ad'),
    olho: H('#4f4866'), bochecha: H('#f7b9c8'),
    luz: H('#fffaf0'), luzOuro: H('#ffe6a8'), ouro: H('#ffd98a'), ouroForte: H('#f6c66a'), creme: H('#fff1d6'), lilas: H('#e2dcf6'), rosa: H('#f7c6d2'),
    lobo: H('#6f699f'), loboClaro: H('#8f88bd'), loboOlho: H('#fff1b0'),
    madeira: H('#e1b896'), madeiraEsc: H('#c79a7b'), toalha: H('#fffdf8'), renda: H('#e4dcf5'), pao: H('#f2c58f'), uva: H('#c9b5ea'), roma: H('#f3a9b6'),
    vinho: H('#f2a6b8'), pedra: H('#f3eee8'), pedraSombra: H('#ddd3ea'), telhado: H('#d9c6ee'), porta: H('#ffe2a0'), sombra: H('#8f86b8'),
  };
  const elipse = (ctx, x, y, rx, ry, rot, cor) => { ctx.fillStyle = cor; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, TAU); ctx.fill(); };
  const disco = (ctx, x, y, r, cor) => { ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };

  // ---------------------------------------------------------------- ovelha / cordeirinho (de lado, olhando para +x)
  // o: dir, fase, andar 0..1, deita 0..1, bebe 0..1 (cabeça na água), olha 0..1 (cabeça para cima), dorme 0..1,
  //    brilho 0..1 (aura de restauração), unge 0..1 (óleo dourado na cabeça), pendura 0..1 (carregado nos ombros),
  //    adulto (ovelha grande, lã mais cheia), tom (mistura de cor da lã), t
  const LA = [[-26, 0, 15], [-12, -9, 17], [6, -10, 17], [22, -3, 15], [-21, 10, 13], [-1, 9, 15], [17, 9, 13], [31, 3, 11], [-33, -6, 10], [10, 0, 16], [-6, -2, 16]];
  function ovelha(ctx, x, y, s, o) {
    const dir = o.dir || 1, fase = o.fase || 0, andar = o.andar || 0, de = clamp(o.deita || 0), be = clamp(o.bebe || 0), ol = clamp(o.olha || 0);
    const pe = clamp(o.pendura || 0), t = o.t || 0, A = o.alfa === undefined ? 1 : o.alfa, adulto = o.adulto ? 1 : 0;
    const la = o.tom ? ml(K.la, o.tom, 0.25) : K.la, laS = o.tom ? ml(K.laSombra, o.tom, 0.25) : K.laSombra;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s); ctx.globalAlpha *= A;
    const bob = andar * Math.abs(Math.sin(fase)) * 2.2;
    const corpoY = lerp(-44, -21, de) - bob + pe * 6;
    if (pe < 0.5) elipse(ctx, 2, 1, 44 * (1 - 0.1 * de), 6, 0, css(K.sombra, 0.16));
    if (o.brilho > 0.01) brilhoRadial(ctx, 0, corpoY - 6, 120, K.luzOuro, 0.75 * o.brilho);
    // pernas
    const PERNAS = [[-24, 0.0, 1], [-13, Math.PI, 0], [17, Math.PI, 1], [27, 0.0, 0]];
    for (const [lx, ph, tras] of PERNAS) {
      const f = fase + ph;
      const passo = Math.sin(f) * 9 * andar, lift = Math.max(0, Math.cos(f)) * 5 * andar;
      const alto = corpoY + 12;
      let px = lx + passo, py = -lift;
      if (de > 0) { px = lerp(px, lx + 6, de); py = lerp(py, corpoY + 14, de); }
      if (pe > 0) { px = lerp(px, lx + 2, pe); py = lerp(py, corpoY + 30, pe); }
      ctx.strokeStyle = css(tras ? aj(K.perna, -0.05) : K.perna); ctx.lineWidth = 6.2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(lx, alto); ctx.lineTo(px, py - 3); ctx.stroke();
      elipse(ctx, px + 0.5, py - 2, 4, 2.6, 0, css(K.casco));
    }
    // rabinho
    disco(ctx, -38, corpoY - 4, 7, css(laS)); disco(ctx, -38, corpoY - 6, 5.5, css(la));
    // lã: camada de sombra e camada clara
    const esc = 1 + adulto * 0.08;
    ctx.fillStyle = css(laS); ctx.beginPath();
    for (const [cx, cy, r] of LA) { ctx.moveTo(cx * esc + r * esc + 1, cy + corpoY + 3); ctx.arc(cx * esc + 1, cy + corpoY + 3, r * esc, 0, TAU); }
    ctx.fill();
    ctx.fillStyle = css(la); ctx.beginPath();
    for (const [cx, cy, r] of LA) { ctx.moveTo(cx * esc + r * esc * 0.92, cy + corpoY - 1); ctx.arc(cx * esc, cy + corpoY - 1, r * esc * 0.92, 0, TAU); }
    ctx.fill();
    ctx.fillStyle = css(K.laBrilho, 0.8);
    for (const [cx, cy, r] of LA.slice(0, 4)) { ctx.beginPath(); ctx.arc(cx * esc - 3, cy + corpoY - 6, r * 0.38, 0, TAU); ctx.fill(); }
    // cabeça (gira no pescoço)
    const ang = -0.38 * ol + 1.05 * be + (pe > 0 ? 0.25 * pe : 0) + Math.sin(t * 0.9) * 0.03;
    ctx.save(); ctx.translate(26 * esc, corpoY - 8); ctx.rotate(ang);
    const hx = 14, hy = -10;
    // orelhas
    for (const [ex, ey, rot, cor] of [[hx - 8, hy - 9, -0.9, aj(K.orelha, -0.04)], [hx - 3, hy - 11, -0.5, K.orelha]]) {
      ctx.save(); ctx.translate(ex, ey); ctx.rotate(rot + Math.sin(t * 1.3 + ex) * 0.06);
      elipse(ctx, -9, 0, 10, 4.6, 0, css(K.rosto)); elipse(ctx, -9, 0, 6.5, 2.4, 0, css(cor));
      ctx.restore();
    }
    elipse(ctx, hx, hy, 14.5, 12.5, 0.15, css(K.rosto));
    elipse(ctx, hx + 9, hy + 4, 7.5, 6.2, 0.1, css(aj(K.rosto, 0.03)));
    disco(ctx, hx - 6, hy - 11, 6, css(la)); disco(ctx, hx + 1, hy - 13, 6.5, css(la)); disco(ctx, hx + 7, hy - 10, 5, css(la));      // topete de lã
    const fecha = Math.max(clamp(o.dorme || 0), mod(t + (o.semente || 0) * 3.3, 4.6) < 0.12 ? 0.85 : 0);
    if (fecha > 0.5) { ctx.strokeStyle = css(K.olho); ctx.lineWidth = 1.8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(hx + 5, hy - 2, 3, 0.2, Math.PI - 0.2); ctx.stroke(); }
    else { disco(ctx, hx + 5, hy - 2, 2.6, css(K.olho)); disco(ctx, hx + 5.9, hy - 3, 0.9, css(K.laBrilho)); }
    disco(ctx, hx + 3, hy + 5, 3.6, css(K.bochecha, 0.6));
    elipse(ctx, hx + 15, hy + 3, 1.8, 1.4, 0, css(aj(K.orelha, -0.12)));
    if (o.unge > 0.01) {                                                     // óleo: brilho dourado escorrendo na cabeça
      brilhoRadial(ctx, hx, hy - 10, 40, K.ouro, 0.8 * o.unge);
      ctx.fillStyle = css(K.ouroForte, 0.85 * o.unge);
      for (let i = 0; i < 3; i++) { const yy = hy - 14 + mod(t * 18 + i * 9, 26); ctx.beginPath(); ctx.ellipse(hx - 4 + i * 5, yy, 1.8, 2.8, 0, 0, TAU); ctx.fill(); }
      ctx.fillStyle = css(K.luz, 0.9 * o.unge);
      for (let i = 0; i < 4; i++) { const a = t * 1.5 + i * 1.6; brilho4(ctx, hx + Math.cos(a) * 18, hy - 8 + Math.sin(a) * 12, 3 + 2 * Math.max(0, Math.sin(t * 4 + i))); }
    }
    ctx.restore();
    ctx.restore();
  }

  // ---------------------------------------------------------------- o Pastor de luz (de lado, olhando para +x)
  // o: dir, fase, andar, ajoelha 0..1, estende 0..1 (braço da frente descendo até o cordeiro), ergue 0..1 (vara e cajado
  //    erguidos), oleo 0..1 (chifre de óleo erguido), carrega 0..1 (cordeiro nos ombros), lanterna 0..1, brilho, alfa, t
  function pastorLuz(ctx, x, y, s, o) {
    const dir = o.dir || 1, fase = o.fase || 0, andar = o.andar || 0, aj1 = clamp(o.ajoelha || 0), est = clamp(o.estende || 0);
    const er = clamp(o.ergue || 0), ole = clamp(o.oleo || 0), car = clamp(o.carrega || 0), lan = clamp(o.lanterna || 0);
    const t = o.t || 0, A = o.alfa === undefined ? 1 : o.alfa, br = o.brilho === undefined ? 1 : o.brilho;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s); ctx.globalAlpha *= A;
    const bob = andar * Math.abs(Math.sin(fase)) * 2.5;
    const baixa = aj1 * 62;                                                   // ajoelhar baixa o corpo
    const ombro = [2, -206 + baixa - bob], quad = [0, -112 + baixa * 0.75 - bob];
    const cab = [ombro[0] + 4, ombro[1] - 30];
    // aura
    brilhoRadial(ctx, 0, -120 + baixa * 0.5, 260, K.luzOuro, 0.42 * br * (0.9 + 0.1 * Math.sin(t * 1.7)));
    brilhoRadial(ctx, cab[0], cab[1], 70, K.luz, 0.6 * br);
    // vara (bastão curto) na mão de trás
    const sw = Math.sin(fase) * andar;
    const maoT = [lerp(ombro[0] - 14 - sw * 16, ombro[0] - 30, er), lerp(ombro[1] + 92, ombro[1] - 40, er)];
    if (o.vara > 0.01) {
      ctx.save(); ctx.globalAlpha *= clamp(o.vara);
      ctx.strokeStyle = css(K.ouroForte); ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(maoT[0] - 2, maoT[1] + 26); ctx.lineTo(maoT[0] + 4, maoT[1] - 44); ctx.stroke();
      disco(ctx, maoT[0] + 5, maoT[1] - 48, 7.5, css(K.ouroForte));
      ctx.restore();
    }
    // braço de trás
    ctx.strokeStyle = css(ml(K.creme, K.lilas, 0.35), 0.95); ctx.lineWidth = 15; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(ombro[0] - 6, ombro[1] + 10); ctx.quadraticCurveTo(ombro[0] - 16, (ombro[1] + maoT[1]) / 2, maoT[0], maoT[1]); ctx.stroke();
    disco(ctx, maoT[0], maoT[1], 7.5, css(K.luzOuro));
    // túnica
    const hemY = lerp(0, -10, aj1), bal = Math.sin(fase) * 7 * andar;
    const g = ctx.createLinearGradient(0, ombro[1], 0, hemY);
    g.addColorStop(0, css(K.luz)); g.addColorStop(0.65, css(ml(K.luz, K.luzOuro, 0.4))); g.addColorStop(1, css(K.luzOuro));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(ombro[0] - 20, ombro[1] + 4);
    ctx.quadraticCurveTo(quad[0] - 38, quad[1] + 20, -46 - bal + aj1 * 30, hemY);
    ctx.quadraticCurveTo(0, hemY + 10 + bal * 0.4, 44 + bal * 0.6 + aj1 * 34, hemY - aj1 * 20);
    ctx.quadraticCurveTo(quad[0] + 34, quad[1] + 10, ombro[0] + 22, ombro[1] + 8);
    ctx.quadraticCurveTo(ombro[0] + 2, ombro[1] - 6, ombro[0] - 20, ombro[1] + 4);
    ctx.fill();
    ctx.fillStyle = css(ml(K.lilas, K.luzOuro, 0.3), 0.45);                    // dobra de sombra
    ctx.beginPath(); ctx.moveTo(ombro[0] - 14, ombro[1] + 14); ctx.quadraticCurveTo(quad[0] - 26, quad[1] + 30, -46 - bal + aj1 * 30, hemY); ctx.quadraticCurveTo(-26, hemY + 6, -14, hemY - 6); ctx.quadraticCurveTo(-20, quad[1] + 20, ombro[0] - 14, ombro[1] + 14); ctx.fill();
    ctx.strokeStyle = css(K.ouro, 0.9); ctx.lineWidth = 5;                       // faixa
    ctx.beginPath(); ctx.moveTo(quad[0] - 26, quad[1] - 6); ctx.quadraticCurveTo(quad[0], quad[1] + 2, quad[0] + 24, quad[1] - 8); ctx.stroke();
    // manto sobre a cabeça e os ombros
    ctx.fillStyle = css(ml(K.creme, K.lilas, 0.25));
    ctx.beginPath(); ctx.moveTo(cab[0] - 22, cab[1] + 4); ctx.quadraticCurveTo(cab[0] - 28, cab[1] - 30, cab[0] + 2, cab[1] - 30); ctx.quadraticCurveTo(cab[0] + 26, cab[1] - 28, cab[0] + 20, cab[1] + 2);
    ctx.quadraticCurveTo(ombro[0] + 30, ombro[1] + 26, ombro[0] + 8, ombro[1] + 40); ctx.quadraticCurveTo(ombro[0] - 34, ombro[1] + 34, cab[0] - 22, cab[1] + 4); ctx.fill();
    // rosto de luz (sem traços)
    const gr = ctx.createRadialGradient(cab[0] + 6, cab[1] - 2, 2, cab[0] + 6, cab[1] - 2, 19);
    gr.addColorStop(0, css(K.luz)); gr.addColorStop(1, css(K.luzOuro));
    ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(cab[0] + 6, cab[1] - 1, 15, 18, 0.08, 0, TAU); ctx.fill();
    // cordeiro nos ombros
    if (car > 0.01) ovelha(ctx, ombro[0] - 6, ombro[1] + 18 - car * 4, 0.82, { pendura: car, t, olha: 0.3, alfa: 1, dorme: o.dormeCordeiro || 0, unge: o.ungeCordeiro || 0 });
    // braço da frente: cajado, estender, óleo, lanterna, segurar o cordeiro
    const maoBase = [ombro[0] + 22 + sw * 12, ombro[1] + 88 - aj1 * 18];
    const maoEst = [ombro[0] + 70, ombro[1] + 120 - aj1 * 30];
    const maoOleo = [ombro[0] + 46, ombro[1] - 18];
    const maoCar = [ombro[0] + 28, ombro[1] + 14];
    const maoEr = [ombro[0] + 30, ombro[1] - 46];
    let mao = maoBase;
    const mix2 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
    mao = mix2(mao, maoEst, est); mao = mix2(mao, maoOleo, ole); mao = mix2(mao, maoCar, car); mao = mix2(mao, maoEr, er);
    const cajA = (1 - est * 0.9) * (1 - ole) * (1 - car * 0.7);
    if (cajA > 0.02) {                                                          // cajado de pastor (ouro)
      ctx.save(); ctx.globalAlpha *= cajA;
      const topo = [mao[0] + 8, mao[1] - 70 - er * 10];
      const gc = ctx.createLinearGradient(0, topo[1], 0, mao[1] + 80);
      gc.addColorStop(0, css(K.luzOuro)); gc.addColorStop(1, css(K.ouroForte));
      ctx.strokeStyle = gc; ctx.lineWidth = 6.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(mao[0] + 4, lerp(-andar * Math.max(0, Math.cos(fase + 1.2)) * 8, mao[1] + 60, er)); ctx.lineTo(topo[0], topo[1]); ctx.stroke();
      ctx.beginPath(); ctx.arc(topo[0] + 15, topo[1], 15, Math.PI, Math.PI * 2.35); ctx.stroke();
      brilhoRadial(ctx, topo[0] + 15, topo[1] - 6, 44, K.luzOuro, 0.5 * (0.6 + 0.4 * er));
      ctx.restore();
    }
    if (ole > 0.01) chifre(ctx, mao[0] + 6, mao[1] - 6, 1, { inclina: ole, t, derrama: o.derrama || 0 });
    if (lan > 0.01) lampiao(ctx, mao[0] + 2, mao[1] + 2, 1.0, lan, t + andar * fase * 0.2);
    ctx.strokeStyle = css(K.creme); ctx.lineWidth = 15; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(ombro[0] + 8, ombro[1] + 8); ctx.quadraticCurveTo(ombro[0] + 30, (ombro[1] + mao[1]) / 2 + 6, mao[0], mao[1]); ctx.stroke();
    disco(ctx, mao[0], mao[1], 7.5, css(K.luzOuro));
    ctx.restore();
  }

  // ---------------------------------------------------------------- lampião dourado pendurado na mão (x, y = mão)
  function lampiao(ctx, x, y, s, luz, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(Math.sin(t * 1.7) * 0.08); ctx.globalAlpha *= clamp(luz * 1.5);
    brilhoRadial(ctx, 0, 34, 170 * (0.5 + 0.5 * luz), K.luzOuro, 0.75 * luz * (0.92 + 0.08 * Math.sin(t * 7)));
    brilhoRadial(ctx, 0, 34, 50, K.luz, 0.9 * luz);
    ctx.strokeStyle = css(K.ouroForte); ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, 8, 8, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();                         // alça
    ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(0, 14); ctx.stroke();
    ctx.fillStyle = css(K.ouroForte); ctx.beginPath(); ctx.moveTo(-10, 22); ctx.quadraticCurveTo(0, 10, 10, 22); ctx.closePath(); ctx.fill();   // tampa
    const g = ctx.createLinearGradient(0, 22, 0, 48);
    g.addColorStop(0, css(K.luz)); g.addColorStop(1, css(K.luzOuro));
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-9, 22, 18, 26, 5); ctx.fill();                      // vidro aceso
    ctx.fillStyle = css(K.ouro); ctx.beginPath(); ctx.ellipse(0, 36, 3.6, 6.5 + Math.sin(t * 9) * 0.8, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = css(K.ouroForte, 0.8); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-9, 35); ctx.lineTo(9, 35); ctx.stroke();
    ctx.fillStyle = css(K.ouroForte); ctx.beginPath(); ctx.roundRect(-11, 47, 22, 5, 2); ctx.fill();         // base
    ctx.restore();
  }

  // ---------------------------------------------------------------- chifre de óleo (inclina 0..1, derrama 0..1)
  function chifre(ctx, x, y, s, o) {
    const t = o.t || 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(-0.4 + 1.25 * clamp(o.inclina || 0));
    const g = ctx.createLinearGradient(-30, 0, 34, 0);
    g.addColorStop(0, css(K.creme)); g.addColorStop(1, css(K.ouroForte));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(-26, 6); ctx.quadraticCurveTo(-10, -20, 30, -14); ctx.lineTo(32, -2); ctx.quadraticCurveTo(-4, -4, -20, 12); ctx.closePath(); ctx.fill();
    elipse(ctx, 31, -8, 3.5, 7, 0, css(aj(K.ouroForte, -0.12)));
    ctx.strokeStyle = css(K.ouroForte, 0.6); ctx.lineWidth = 1.4;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-14 + i * 10, 4 - i * 4); ctx.lineTo(-10 + i * 10, -10 - i * 2); ctx.stroke(); }
    ctx.restore();
    const d = clamp(o.derrama || 0);
    if (d > 0.01) {                                                            // fio de óleo dourado caindo
      const bx = x + 30 * s, by = y + 18 * s;
      ctx.strokeStyle = css(K.ouroForte, 0.85 * d); ctx.lineWidth = 3.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx + 4, by + 36, bx + 2, by + 78 * d); ctx.stroke();
      ctx.fillStyle = css(K.ouro, 0.9 * d);
      for (let i = 0; i < 4; i++) { const yy = by + mod(t * 70 + i * 21, 84); ctx.beginPath(); ctx.ellipse(bx + 2, yy, 2.4, 3.4, 0, 0, TAU); ctx.fill(); }
      brilhoRadial(ctx, bx, by + 66, 40, K.ouro, 0.6 * d);
    }
  }

  // ---------------------------------------------------------------- lobo de sombra (de lado, olhando para +x)
  function lobo(ctx, x, y, s, o) {
    const dir = o.dir || 1, t = o.t || 0, A = o.alfa === undefined ? 1 : o.alfa, deita = clamp(o.deita || 0), fase = o.fase || 0, andar = o.andar || 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s); ctx.globalAlpha *= A;
    const cor = K.lobo, claro = K.loboClaro, corpoY = -44 + deita * 18;
    elipse(ctx, 0, 1, 52, 6, 0, css(K.sombra, 0.14));
    for (const [lx, ph] of [[-30, 0], [-20, Math.PI], [24, Math.PI], [34, 0]]) {
      const passo = Math.sin(fase + ph) * 8 * andar;
      ctx.strokeStyle = css(cor); ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(lx, corpoY + 10); ctx.lineTo(lx + passo + deita * 10, lerp(0, corpoY + 18, deita) - 2); ctx.stroke();
    }
    ctx.fillStyle = css(cor);                                                  // cauda
    ctx.beginPath(); ctx.moveTo(-40, corpoY - 4); ctx.quadraticCurveTo(-70, corpoY + 4 + Math.sin(t * 2) * 4, -66, corpoY + 26); ctx.quadraticCurveTo(-56, corpoY + 10, -38, corpoY + 6); ctx.fill();
    elipse(ctx, -2, corpoY, 44, 17, 0, css(cor));
    elipse(ctx, 6, corpoY - 6, 30, 8, 0, css(claro, 0.5));
    // cabeça
    ctx.save(); ctx.translate(38, corpoY - 12 + deita * 8); ctx.rotate(deita * 0.25);
    ctx.fillStyle = css(cor);
    ctx.beginPath(); ctx.moveTo(-10, 8); ctx.quadraticCurveTo(-6, -14, 10, -12); ctx.lineTo(32, -2); ctx.quadraticCurveTo(34, 4, 28, 6); ctx.quadraticCurveTo(10, 14, -10, 8); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-2, -10); ctx.lineTo(2, -28); ctx.lineTo(10, -12); ctx.fill();
    ctx.beginPath(); ctx.moveTo(6, -12); ctx.lineTo(12, -27); ctx.lineTo(16, -10); ctx.fill();
    const olho = (o.olhos === undefined ? 1 : o.olhos) * (deita > 0.7 ? 0.25 : 1);
    brilhoRadial(ctx, 12, -4, 12, K.loboOlho, 0.9 * olho);
    disco(ctx, 12, -4, 2.2, css(K.loboOlho, olho));
    ctx.restore();
    ctx.restore();
  }

  // ---------------------------------------------------------------- lira de Davi
  function lira(ctx, x, y, s, o) {
    const t = o.t || 0, A = o.alfa === undefined ? 1 : o.alfa;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= A;
    brilhoRadial(ctx, 0, -60, 140, K.luzOuro, 0.5);
    ctx.strokeStyle = css(K.ouroForte); ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-14, 0); ctx.bezierCurveTo(-60, -30, -70, -100, -38, -128); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(14, 0); ctx.bezierCurveTo(60, -30, 70, -100, 38, -128); ctx.stroke();
    ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-46, -118); ctx.quadraticCurveTo(0, -132, 46, -118); ctx.stroke();
    ctx.fillStyle = css(K.ouroForte); ctx.beginPath(); ctx.roundRect(-26, -10, 52, 16, 6); ctx.fill();
    for (let i = 0; i < 6; i++) {                                              // cordas vibrando
      const xs = -20 + i * 8, vib = Math.sin(t * 22 + i * 1.7) * 1.4 * (o.toca || 0);
      ctx.strokeStyle = css(K.luz, 0.9); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(xs, -6); ctx.quadraticCurveTo(xs + vib, -60, xs * 1.25, -121 + Math.abs(xs) * 0.12); ctx.stroke();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- mesa preparada (frente; y = chão)
  function mesa(ctx, x, y, s, o) {
    const A = o.alfa === undefined ? 1 : o.alfa, t = o.t || 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= A;
    elipse(ctx, 0, 2, 120, 9, 0, css(K.sombra, 0.16));
    ctx.fillStyle = css(K.madeiraEsc);
    for (const lx of [-88, 80]) { ctx.beginPath(); ctx.roundRect(lx, -58, 9, 58, 3); ctx.fill(); }
    ctx.fillStyle = css(K.madeira); ctx.beginPath(); ctx.roundRect(-104, -66, 208, 12, 5); ctx.fill();
    // toalha com renda
    ctx.fillStyle = css(K.toalha);
    ctx.beginPath(); ctx.moveTo(-108, -66); ctx.lineTo(108, -66); ctx.lineTo(112, -36);
    for (let i = 0; i <= 14; i++) { const xx = 112 - i * 16; ctx.quadraticCurveTo(xx - 8, -28, xx - 16, -36); }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = css(K.renda); ctx.lineWidth = 2.2; ctx.beginPath();
    for (let i = 0; i <= 14; i++) { const xx = 112 - i * 16; ctx.moveTo(xx, -40); ctx.quadraticCurveTo(xx - 8, -32, xx - 16, -40); }
    ctx.stroke();
    // pão, uvas, romã
    // (o lado esquerdo fica livre para o cálice)
    elipse(ctx, -24, -76, 28, 13, 0, css(K.pao)); elipse(ctx, -24, -80, 22, 7, 0, css(ml(K.pao, K.creme, 0.5)));
    ctx.strokeStyle = css(aj(K.pao, -0.12)); ctx.lineWidth = 2; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-24 + i * 10 - 4, -86); ctx.lineTo(-24 + i * 10 + 4, -74); ctx.stroke(); }
    for (let i = 0; i < 9; i++) { const gx = 20 + (i % 3) * 8 - Math.floor(i / 3) * 2, gy = -74 - Math.floor(i / 3) * -6 - 6; disco(ctx, gx, gy - 6 + Math.floor(i / 3) * 6, 5.2, css(i % 2 ? K.uva : aj(K.uva, -0.05))); }
    disco(ctx, 62, -78, 12, css(K.roma)); elipse(ctx, 62, -90, 4, 3, 0, css(aj(K.roma, -0.1)));
    ctx.restore();
  }
  // cálice (pousado na mesa; transborda 0..1)
  function calice(ctx, x, y, s, o) {
    const t = o.t || 0, tr = clamp(o.transborda || 0), A = o.alfa === undefined ? 1 : o.alfa;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= A;
    if (tr > 0.01) brilhoRadial(ctx, 0, -30, 110, K.luzOuro, 0.6 * tr);
    const g = ctx.createLinearGradient(-18, 0, 18, 0);
    g.addColorStop(0, css(K.ouroForte)); g.addColorStop(0.5, css(K.luzOuro)); g.addColorStop(1, css(K.ouroForte));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, -2, 14, 4, 0, 0, TAU); ctx.fill();                                    // pé
    ctx.fillRect(-3, -24, 6, 22);
    ctx.beginPath(); ctx.moveTo(-17, -50); ctx.quadraticCurveTo(-16, -24, 0, -24); ctx.quadraticCurveTo(16, -24, 17, -50); ctx.closePath(); ctx.fill();
    elipse(ctx, 0, -50, 17, 4.5, 0, css(K.vinho));
    if (tr > 0.01) {                                                          // transborda: escorre pelos lados e cai em brilhos
      ctx.fillStyle = css(K.vinho, 0.9);
      for (const lado of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(lado * 15, -50); ctx.quadraticCurveTo(lado * 20, -36, lado * 18 + Math.sin(t * 3) * 1, -50 + 52 * tr); ctx.lineTo(lado * 13, -50 + 46 * tr); ctx.quadraticCurveTo(lado * 15, -40, lado * 11, -50); ctx.fill();
      }
      for (let i = 0; i < 10; i++) {
        const u = mod(t * 0.9 + i / 10, 1), lado = i % 2 ? 1 : -1;
        const px = lado * (16 + 26 * u + 6 * hash1(i)), py = -50 + 70 * u * u - 18 * Math.sin(Math.PI * u);
        ctx.fillStyle = css(i % 3 ? K.vinho : K.luzOuro, 0.85 * tr * (1 - u)); ctx.beginPath(); ctx.arc(px, py, 2.6, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = css(K.luz, 0.9 * tr);
      for (let i = 0; i < 5; i++) { const a = t * 1.2 + i * 1.25; brilho4(ctx, Math.cos(a) * 30, -56 + Math.sin(a * 1.3) * 12 - 10, 3 + 3 * Math.max(0, Math.sin(t * 3 + i))); }
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- a casa de Adonai (frente; y = chão)
  function casa(ctx, x, y, s, o) {
    const t = o.t || 0, luz = clamp(o.luz === undefined ? 0.5 : o.luz), aberta = clamp(o.aberta || 0), A = o.alfa === undefined ? 1 : o.alfa;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= A;
    brilhoRadial(ctx, 0, -120, 380, K.luzOuro, 0.35 + 0.35 * luz);
    elipse(ctx, 0, 4, 170, 12, 0, css(K.sombra, 0.16));
    // degraus
    ctx.fillStyle = css(aj(K.pedra, -0.03)); ctx.beginPath(); ctx.roundRect(-70, -10, 140, 12, 4); ctx.fill();
    ctx.fillStyle = css(K.pedra); ctx.beginPath(); ctx.roundRect(-56, -20, 112, 12, 4); ctx.fill();
    // paredes
    const gp = ctx.createLinearGradient(0, -220, 0, 0);
    gp.addColorStop(0, css(K.luz)); gp.addColorStop(1, css(K.pedra));
    ctx.fillStyle = gp; ctx.beginPath(); ctx.roundRect(-150, -210, 300, 192, 8); ctx.fill();
    ctx.fillStyle = css(K.pedraSombra, 0.6); ctx.fillRect(90, -210, 60, 192);
    ctx.strokeStyle = css(K.pedraSombra, 0.7); ctx.lineWidth = 1.4;
    for (let r = 0; r < 6; r++) { const yy = -36 - r * 30; ctx.beginPath(); ctx.moveTo(-150, yy); ctx.lineTo(150, yy); ctx.stroke(); }
    // telhado
    ctx.fillStyle = css(K.telhado);
    ctx.beginPath(); ctx.moveTo(-172, -206); ctx.lineTo(0, -300); ctx.lineTo(172, -206); ctx.closePath(); ctx.fill();
    ctx.fillStyle = css(ml(K.telhado, K.luz, 0.4)); ctx.beginPath(); ctx.moveTo(-172, -206); ctx.lineTo(0, -300); ctx.lineTo(-20, -206); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = css(K.luz); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-176, -204); ctx.lineTo(0, -302); ctx.lineTo(176, -204); ctx.stroke();
    // janelas em arco
    for (const wx of [-100, 100]) {
      const gj = ctx.createLinearGradient(0, -170, 0, -110); gj.addColorStop(0, css(K.porta, 0.6 + 0.4 * luz)); gj.addColorStop(1, css(K.luzOuro, 0.6 + 0.4 * luz));
      ctx.fillStyle = gj; ctx.beginPath(); ctx.moveTo(wx - 18, -110); ctx.lineTo(wx - 18, -150); ctx.arc(wx, -150, 18, Math.PI, 0); ctx.lineTo(wx + 18, -110); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = css(K.luz); ctx.lineWidth = 3; ctx.stroke();
    }
    // porta em arco (abre e solta luz)
    const gd = ctx.createLinearGradient(0, -150, 0, -20);
    gd.addColorStop(0, css(ml(K.porta, K.luz, aberta * 0.6))); gd.addColorStop(1, css(K.luzOuro));
    ctx.fillStyle = gd; ctx.beginPath(); ctx.moveTo(-36, -20); ctx.lineTo(-36, -110); ctx.arc(0, -110, 36, Math.PI, 0); ctx.lineTo(36, -20); ctx.closePath(); ctx.fill();
    if (aberta < 0.98) {
      ctx.fillStyle = css(K.madeira);
      const w = 36 * (1 - aberta);
      ctx.beginPath(); ctx.moveTo(-36, -20); ctx.lineTo(-36, -110); ctx.arc(0, -110, 36, Math.PI, Math.PI * 1.5); ctx.lineTo(-36 + w, -146); ctx.lineTo(-36 + w, -20); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(36, -20); ctx.lineTo(36, -110); ctx.arc(0, -110, 36, 0, -Math.PI * 0.5, true); ctx.lineTo(36 - w, -146); ctx.lineTo(36 - w, -20); ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = css(K.luz); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-36, -20); ctx.lineTo(-36, -110); ctx.arc(0, -110, 36, Math.PI, 0); ctx.lineTo(36, -20); ctx.stroke();
    if (aberta > 0.01) {                                                        // luz que sai da porta e se derrama no chão
      brilhoRadial(ctx, 0, -70, 120, K.luz, 0.75 * aberta);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const gl = ctx.createLinearGradient(0, -20, 0, 52);
      gl.addColorStop(0, css(K.luzOuro, 0.32 * aberta)); gl.addColorStop(1, css(K.luzOuro, 0));
      ctx.fillStyle = gl; ctx.beginPath(); ctx.moveTo(-34, -20); ctx.lineTo(34, -20); ctx.lineTo(105, 52); ctx.lineTo(-105, 52); ctx.closePath(); ctx.fill();
      ctx.fillStyle = css(K.luz, 0.85 * aberta);
      for (let i = 0; i < 7; i++) { const u = mod(t * 0.35 + i / 7, 1); brilho4(ctx, (hash1(i * 3.7) - 0.5) * 70, -40 - 150 * u, (3 + 3 * hash1(i)) * Math.sin(Math.PI * u)); }
      ctx.restore();
    }
    ctx.restore();
  }

  G.Seres23 = { K, ovelha, pastorLuz, chifre, lobo, lira, mesa, calice, casa };
})(window);
