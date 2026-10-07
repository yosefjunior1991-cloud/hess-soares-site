// Peças desenhadas do tema "Pai Nosso em Aramaico": a menina, o pai, a mãe, o vizinho e os aldeões (de lado, com
// rostos simples); as casas de teto plano de uma aldeia da Galileia, o forno de barro, a esteira com a mesa baixa, o poço,
// oliveiras, palmeiras e ciprestes; a lanterna de papel que sobe no céu e o Templo de Jerusalém no horizonte.
// Deus não é retratado: a presença do Pai é sempre luz que vem do céu. Tudo em tons pastéis, desenhado em código;
// cada função desenha em coordenadas locais (base em y = 0).
(function (G) {
  'use strict';
  const { clamp, lerp, mod, css, rgb, hash1 } = G.U;
  const R = G.Seres91, ml = R.ml, aj = R.aj, brilhoRadial = R.brilhoRadial, brilho4 = R.brilho4;
  const TAU = Math.PI * 2;
  const H = (hex) => rgb(hex);

  const K = {
    pele: H('#f5d3bd'), peleSombra: H('#e8bca4'), olho: H('#54496a'), bochecha: H('#f4a9b8'), boca: H('#c98d8d'),
    cabelo: H('#6f5868'), cabeloClaro: H('#8d7176'), barba: H('#7d6470'), barbaGrisalha: H('#a99aa3'),
    sandalia: H('#c39c86'), sombra: H('#8f86b8'), branco: H('#ffffff'),
    luz: H('#fffaf0'), luzOuro: H('#ffe6a8'), ouro: H('#ffd98a'), ouroForte: H('#f6c66a'), creme: H('#fff1d6'), lilas: H('#e2dcf6'), rosa: H('#f7c6d2'),
    pao: H('#efc58f'), paoEsc: H('#d9a56c'), cesto: H('#d7b08a'), cestoEsc: H('#bf946f'), argila: H('#e8b99b'), argilaEsc: H('#d39d82'),
    madeira: H('#d9b08f'), madeiraEsc: H('#bf9474'), pedra: H('#efe6dc'), pedraEsc: H('#d9cdd8'), agua: H('#a9dbe6'),
    folha: H('#a9d6bd'), folhaClara: H('#cdebd9'), oliva: H('#b7cdb3'), olivaClara: H('#dbe8d4'), tronco: H('#c9ad9c'),
    papel: H('#ffe2b5'), papelClaro: H('#fff4dc'), chama: H('#ffb46e'),
  };
  // roupas de cada pessoa (túnica, faixa, manto/véu)
  const ROUPA = {
    pai: { tunica: H('#b9c4ee'), faixa: H('#f2c48a'), manto: H('#efe3cf'), banda: H('#c9a27e') },
    mae: { tunica: H('#f3c6cf'), faixa: H('#ffe1a8'), manto: H('#d9cdf2') },
    menina: { tunica: H('#ffd9b8'), faixa: H('#f5a9b8'), fita: H('#f58fa8') },
    vizinho: { tunica: H('#bfe3cf'), faixa: H('#e8c9a0'), manto: H('#dccab4') },
    menino: { tunica: H('#cfe1fb'), faixa: H('#f2c48a') },
  };
  const elipse = (ctx, x, y, rx, ry, rot, cor) => { ctx.fillStyle = cor; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, TAU); ctx.fill(); };
  const disco = (ctx, x, y, r, cor) => { ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
  const mix = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];

  // ---------------------------------------------------------------- coração de luz
  function coracao(ctx, x, y, r, a, t) {
    if (a < 0.01) return;
    const p = 1 + 0.08 * Math.sin((t || 0) * 5);
    brilhoRadial(ctx, x, y, r * 4.5, K.luzOuro, 0.7 * a);
    ctx.save(); ctx.translate(x, y); ctx.scale(r * p / 10, r * p / 10);
    const g = ctx.createLinearGradient(0, -8, 0, 10);
    g.addColorStop(0, css(K.luz, a)); g.addColorStop(1, css(ml(K.rosa, K.ouro, 0.4), a));
    ctx.fillStyle = g; ctx.beginPath();
    ctx.moveTo(0, 9); ctx.bezierCurveTo(-12, 1, -10, -9, -4.5, -9); ctx.bezierCurveTo(-1.5, -9, 0, -6.5, 0, -5);
    ctx.bezierCurveTo(0, -6.5, 1.5, -9, 4.5, -9); ctx.bezierCurveTo(10, -9, 12, 1, 0, 9); ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------------- objetos que as pessoas seguram
  function pao(ctx, x, y, s, a) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= a === undefined ? 1 : a;
    elipse(ctx, 0, 0, 15, 6.5, 0, css(K.pao)); elipse(ctx, 0, -1.6, 12, 4, 0, css(ml(K.pao, K.creme, 0.45)));
    for (const [dx, dy] of [[-6, -1], [2, -2], [6, 0], [-1, 1]]) disco(ctx, dx, dy, 1.3, css(K.paoEsc));
    ctx.restore();
  }
  function cesto(ctx, x, y, s, cheio) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const n = Math.round(clamp(cheio === undefined ? 1 : cheio) * 4);
    for (let i = 0; i < n; i++) pao(ctx, -10 + i * 7, -14 - (i % 2) * 4, 0.75);
    ctx.fillStyle = css(K.cesto); ctx.beginPath(); ctx.moveTo(-22, -12); ctx.quadraticCurveTo(-20, 6, 0, 6); ctx.quadraticCurveTo(20, 6, 22, -12); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = css(K.cestoEsc); ctx.lineWidth = 1.6;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-20 + i, -7 + i * 4); ctx.quadraticCurveTo(0, -3 + i * 5, 20 - i, -7 + i * 4); ctx.stroke(); }
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-22, -12); ctx.lineTo(22, -12); ctx.stroke();
    ctx.restore();
  }
  function pergaminho(ctx, x, y, s, a) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= a === undefined ? 1 : a;
    ctx.fillStyle = css(K.papelClaro); ctx.beginPath(); ctx.roundRect(-11, -14, 22, 24, 2); ctx.fill();
    ctx.strokeStyle = css(K.cestoEsc, 0.55); ctx.lineWidth = 1.2;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-7, -9 + i * 5); ctx.lineTo(7 - (i % 2) * 4, -9 + i * 5); ctx.stroke(); }
    elipse(ctx, 0, -14, 13, 3.4, 0, css(K.papel)); elipse(ctx, 0, 10, 13, 3.4, 0, css(K.papel));
    ctx.restore();
  }
  // lanterna de papel que sobe no céu (x, y = base; acesa 0..1)
  function lanternaCeu(ctx, x, y, s, acesa, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(Math.sin((t || 0) * 1.3 + x * 0.01) * 0.05);
    const a = clamp(acesa === undefined ? 1 : acesa);
    brilhoRadial(ctx, 0, -18, 70, K.luzOuro, 0.55 * a);
    const g = ctx.createLinearGradient(0, -38, 0, 0);
    g.addColorStop(0, css(ml(K.papel, K.luz, 0.3 + 0.5 * a))); g.addColorStop(1, css(ml(K.papel, K.chama, 0.35 * a)));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-13, -38); ctx.quadraticCurveTo(0, -42, 13, -38); ctx.lineTo(9, 0); ctx.quadraticCurveTo(0, 2, -9, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = css(ml(K.papel, K.cestoEsc, 0.4), 0.5); ctx.lineWidth = 1;
    for (const xx of [-5, 0, 5]) { ctx.beginPath(); ctx.moveTo(xx * 1.4, -39); ctx.lineTo(xx, 0); ctx.stroke(); }
    if (a > 0.05) { brilhoRadial(ctx, 0, -4, 14, K.chama, 0.9 * a); disco(ctx, 0, -3, 2.6, css(K.luz, a)); }
    ctx.restore();
  }
  // lamparina de barro (acesa)
  function lamparina(ctx, x, y, s, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    brilhoRadial(ctx, 6, -10, 46, K.luzOuro, 0.7);
    elipse(ctx, 0, 0, 11, 5, 0, css(K.argila)); elipse(ctx, 0, -2, 8, 3, 0, css(ml(K.argila, K.creme, 0.3)));
    ctx.fillStyle = css(K.chama); ctx.beginPath(); ctx.ellipse(10, -7 - Math.sin((t || 0) * 9), 2.6, 5.5, 0.2, 0, TAU); ctx.fill();
    disco(ctx, 10, -6, 1.6, css(K.luz));
    ctx.restore();
  }

  // ---------------------------------------------------------------- pessoa (de lado, olhando para +x)
  // o: tipo ('pai' | 'mae' | 'menina' | 'vizinho' | 'menino' | 'aldeao'), cor (túnica, para aldeões), veu (aldeã),
  //    dir, fase, andar, sentado, bracos (erguidos), maos (juntas, em oração), olhar (para cima), estende (braço da frente),
  //    abraco, dorme, segura ('pao' | 'cesto' | 'lanterna' | 'lamparina' | 'pergaminho'), seguraA (alfa do objeto),
  //    cheio (cesto), acesa (lanterna), maoAlvo / maoAlvoTras ([x, y] locais, para dar a mão), carga (fardo nas costas),
  //    coracao (coração de luz no peito), inclina (corpo, rad), alfa, t
  function pessoa(ctx, x, y, s, o) {
    const tipo = o.tipo || 'pai', crianca = tipo === 'menina' || tipo === 'menino';
    const roupa = ROUPA[tipo] || { tunica: o.cor || H('#d6d0ee'), faixa: H('#f2c48a'), manto: o.veu ? (o.manto || H('#efe3cf')) : null };
    const tun = o.cor && !ROUPA[tipo] ? o.cor : roupa.tunica;
    const dir = o.dir || 1, fase = o.fase || 0, andar = clamp(o.andar || 0), sent = clamp(o.sentado || 0);
    const br = clamp(o.bracos || 0), mj = clamp(o.maos || 0), ol = clamp(o.olhar || 0), est = clamp(o.estende || 0), abr = clamp(o.abraco || 0);
    const dorme = clamp(o.dorme || 0), t = o.t || 0, A = o.alfa === undefined ? 1 : o.alfa;
    const Gm = crianca ? { quad: -58, ombro: -94, cab: 17, pesc: 12, hem: -7, braco: 36, coxa: 30 } : { quad: -96, ombro: -160, cab: 17.5, pesc: 17, hem: -9, braco: 54, coxa: 48 };
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s); ctx.rotate(o.inclina || 0); ctx.globalAlpha *= A;
    const bob = andar * Math.abs(Math.sin(fase)) * (crianca ? 2.2 : 3);
    const quadY = lerp(Gm.quad, crianca ? -20 : -30, sent) - bob;
    const ombro = [lerp(2, -4, sent), quadY + (Gm.ombro - Gm.quad)];
    const ang = -0.34 * ol + 0.42 * dorme + Math.sin(t * 0.8 + x * 0.01) * 0.02;
    const pesc = [ombro[0] + 2, ombro[1] - Gm.pesc * 0.4];
    const cab = [pesc[0] + Math.sin(ang) * (Gm.pesc * 0.6 + Gm.cab) + 2, pesc[1] - Math.cos(ang) * (Gm.pesc * 0.6 + Gm.cab)];
    const joelho = [Gm.coxa + 4, quadY - 4];
    elipse(ctx, 4, 2, crianca ? 24 : 34, 5.5, 0, css(K.sombra, 0.16));
    // fardo nas costas (as dívidas)
    if (o.carga > 0.01) {
      ctx.save(); ctx.globalAlpha *= clamp(o.carga);
      ctx.fillStyle = css(H('#b4adc4')); ctx.beginPath(); ctx.roundRect(ombro[0] - 44, ombro[1] + 2, 34, 46, 12); ctx.fill();
      ctx.strokeStyle = css(H('#958ca8')); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ombro[0] - 40, ombro[1] + 22); ctx.lineTo(ombro[0] - 12, ombro[1] + 18); ctx.stroke();
      ctx.restore();
    }
    // manto/véu caindo pelas costas
    if (roupa.manto) {
      ctx.fillStyle = css(roupa.manto);
      ctx.beginPath(); ctx.moveTo(cab[0] - 12, cab[1] - 14); ctx.quadraticCurveTo(cab[0] - 30, cab[1] + 10, ombro[0] - 22, lerp(ombro[1] + 70, quadY - 6, sent * 0.6));
      ctx.lineTo(ombro[0] - 6, ombro[1] + 10); ctx.closePath(); ctx.fill();
    }
    // braço de trás
    const swing = Math.sin(fase) * andar;
    const L = Gm.braco;
    const maoTras = (() => {
      let p = [ombro[0] - 6 - swing * 16, ombro[1] + L * 0.92];
      p = mix(p, [joelho[0] - 10, joelho[1] - 6], sent);
      p = mix(p, [ombro[0] - 14, ombro[1] - L * 0.95], br);
      p = mix(p, [ombro[0] + 17, ombro[1] + L * 0.38], mj);
      p = mix(p, [ombro[0] + L * 0.72, ombro[1] + L * 0.18], abr);
      if (o.maoAlvoTras) p = o.maoAlvoTras;
      return p;
    })();
    const braco = (de, para, cor, esp) => {
      ctx.strokeStyle = css(cor); ctx.lineWidth = esp; ctx.lineCap = 'round';
      const mx = (de[0] + para[0]) / 2 + 2, my = (de[1] + para[1]) / 2 + 3;
      ctx.beginPath(); ctx.moveTo(de[0], de[1]); ctx.quadraticCurveTo(mx, my, para[0], para[1]); ctx.stroke();
      disco(ctx, para[0], para[1], esp * 0.48, css(K.pele));
    };
    braco([ombro[0] - 4, ombro[1] + 6], maoTras, aj(tun, -0.09), crianca ? 9 : 12);
    // pernas e pés
    const pe = (sinal) => {
      const ph = fase + (sinal > 0 ? 0 : Math.PI);
      const lift = Math.max(0, Math.cos(ph)) * 8 * andar;
      const pp = [Math.sin(ph) * (crianca ? 14 : 22) * andar + sinal * 3, -lift];
      const ps = [joelho[0] + 4 + sinal * 4, 0];
      const p = mix(pp, ps, sent);
      ctx.strokeStyle = css(K.peleSombra); ctx.lineWidth = crianca ? 6 : 8; ctx.lineCap = 'round';
      if (sent > 0.3) { ctx.beginPath(); ctx.moveTo(joelho[0], joelho[1] + 6); ctx.lineTo(p[0], p[1] - 4); ctx.stroke(); }
      else if (andar > 0.05) { ctx.beginPath(); ctx.moveTo(p[0] * 0.5, Gm.hem + 2); ctx.lineTo(p[0], p[1] - 4); ctx.stroke(); }
      elipse(ctx, p[0] + 4, p[1] - 2.5, crianca ? 8 : 10, 4, 0, css(K.sandalia));
    };
    pe(-1); pe(1);
    // túnica (de pé -> sentado)
    const bal = Math.sin(fase) * 5 * andar;
    const pts = [
      [[ombro[0] - 14, ombro[1] + 4], [ombro[0] - 14, ombro[1] + 4]],
      [[-20, quadY + 6], [-18, quadY - 2]],
      [[-25 - bal, Gm.hem], [-20, quadY + 14]],
      [[2, Gm.hem + 3], [joelho[0] - 6, Gm.hem + 1]],
      [[26 + bal, Gm.hem], [joelho[0] + 12, Gm.hem]],
      [[22, quadY + 10], [joelho[0] + 13, joelho[1] - 10]],
      [[ombro[0] + 15, ombro[1] + 8], [ombro[0] + 15, ombro[1] + 8]],
    ].map(([a, b]) => mix(a, b, sent));
    const gt = ctx.createLinearGradient(0, ombro[1], 0, Gm.hem);
    gt.addColorStop(0, css(ml(tun, K.branco, 0.28))); gt.addColorStop(1, css(tun));
    ctx.fillStyle = gt; ctx.strokeStyle = gt; ctx.lineWidth = 6; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
    ctx.lineTo(pts[6][0], pts[6][1]); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = css(aj(tun, -0.08), 0.5);                                                 // dobra de sombra
    ctx.beginPath(); ctx.moveTo(ombro[0] - 10, ombro[1] + 10); ctx.quadraticCurveTo(-18, quadY + 10, pts[2][0] + 4, pts[2][1] - 2); ctx.lineTo(pts[2][0] + 14, pts[2][1] - 4); ctx.quadraticCurveTo(-8, quadY + 4, ombro[0] - 4, ombro[1] + 12); ctx.fill();
    ctx.strokeStyle = css(roupa.faixa, 0.95); ctx.lineWidth = crianca ? 4 : 5; ctx.lineCap = 'round';  // faixa
    ctx.beginPath(); ctx.moveTo(-17, quadY - 6); ctx.quadraticCurveTo(2, quadY - 1, 20, quadY - 8); ctx.stroke();
    if (o.coracao > 0.01) coracao(ctx, ombro[0] + 8, ombro[1] + (crianca ? 18 : 26), crianca ? 7 : 9, clamp(o.coracao), t);
    // cabeça
    ctx.save(); ctx.translate(cab[0], cab[1]);
    const r = Gm.cab;
    if (tipo === 'pai' || (tipo === 'aldeao' && !o.veu && !o.semPano)) {               // pano na cabeça com faixa
      const pano = tipo === 'pai' ? roupa.manto : ml(tun, K.creme, 0.5);
      elipse(ctx, -5, 2, r + 6, r + 5, 0, css(pano));
    } else if (tipo === 'mae' || o.veu) {
      elipse(ctx, -4, 1, r + 5, r + 5, 0, css(roupa.manto || o.manto || H('#e9dcf3')));
    } else if (tipo === 'menina') {
      ctx.fillStyle = css(K.cabelo); ctx.beginPath(); ctx.ellipse(-4, -1, r + 2.5, r + 2, 0, 0, TAU); ctx.fill();
      // trança caindo atrás, com fita
      ctx.strokeStyle = css(K.cabelo); ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-r, 2); ctx.quadraticCurveTo(-r - 8, 14 + Math.sin(t * 2 + fase) * 2, -r - 4, 26); ctx.stroke();
      disco(ctx, -r - 4, 26, 4.5, css(K.cabelo)); elipse(ctx, -r - 3, 22, 5, 3, 0.5, css(roupa.fita));
    } else {
      ctx.fillStyle = css(tipo === 'vizinho' ? K.cabelo : K.cabeloClaro); ctx.beginPath(); ctx.ellipse(-3, -2, r + 1.5, r + 1, 0, 0, TAU); ctx.fill();
    }
    disco(ctx, 3, 1, r - 1, css(K.pele));                                                    // rosto
    if (tipo === 'menina') {                                                                   // franja e florzinha
      ctx.fillStyle = css(K.cabelo); ctx.beginPath(); ctx.ellipse(1, -r + 6, r - 2, 7, -0.15, Math.PI, TAU); ctx.fill();
      for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU; disco(ctx, -9 + Math.cos(a) * 3.2, -r + 3 + Math.sin(a) * 3.2, 2.4, css(roupa.fita)); }
      disco(ctx, -9, -r + 3, 1.6, css(K.ouro));
    } else if (tipo === 'pai') {
      ctx.fillStyle = css(roupa.manto); ctx.beginPath(); ctx.ellipse(-2, -r + 4, r + 3, 9, 0, Math.PI, TAU); ctx.fill();
      ctx.strokeStyle = css(roupa.banda); ctx.lineWidth = 3.4; ctx.beginPath(); ctx.ellipse(-2, -r + 5, r + 2, 4, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    } else if (tipo === 'mae' || o.veu) {
      ctx.fillStyle = css(roupa.manto || o.manto || H('#e9dcf3')); ctx.beginPath(); ctx.ellipse(-1, -r + 5, r + 3, 9, 0, Math.PI, TAU); ctx.fill();
      ctx.strokeStyle = css(K.cabelo); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(3, 1, r - 1.5, -2.3, -1.6); ctx.stroke();
    } else if (tipo === 'aldeao' && !o.semPano) {
      ctx.fillStyle = css(ml(tun, K.creme, 0.5)); ctx.beginPath(); ctx.ellipse(-2, -r + 4, r + 3, 9, 0, Math.PI, TAU); ctx.fill();
    }
    if (tipo === 'pai' || tipo === 'vizinho' || (tipo === 'aldeao' && o.barba)) {          // barba
      ctx.fillStyle = css(tipo === 'vizinho' ? K.barbaGrisalha : K.barba);
      ctx.beginPath(); ctx.moveTo(-6, 4); ctx.quadraticCurveTo(-4, r + 6, 8, r + 3); ctx.quadraticCurveTo(r + 2, r - 2, r + 1, 7); ctx.quadraticCurveTo(10, 11, 4, 9); ctx.quadraticCurveTo(-1, 9, -6, 4); ctx.fill();
    }
    const fecha = Math.max(dorme, mod(t + (o.semente || 0) * 1.7, 4.3) < 0.12 ? 1 : 0);
    if (fecha > 0.5) { ctx.strokeStyle = css(K.olho); ctx.lineWidth = 1.8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(10, -1, 3, 0.25, Math.PI - 0.25); ctx.stroke(); }
    else { elipse(ctx, 10, -2, crianca ? 2.6 : 2.2, crianca ? 3.2 : 2.7, 0, css(K.olho)); disco(ctx, 10.8, -3, 0.9, css(K.branco)); }
    if (tipo !== 'pai' && tipo !== 'vizinho' && !(tipo === 'aldeao' && o.barba)) {
      disco(ctx, 9, 6, crianca ? 4.6 : 4, css(K.bochecha, 0.55));
      ctx.strokeStyle = css(K.boca); ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(12, 9); ctx.quadraticCurveTo(15, 11, 17, 8.5); ctx.stroke();
    } else disco(ctx, 8, 4, 3.6, css(K.bochecha, 0.4));
    ctx.restore();
    // braço da frente e o que a mão segura
    let maoF = [ombro[0] + 12 + swing * 12, ombro[1] + L * 0.92];
    maoF = mix(maoF, [joelho[0] + 2, joelho[1] - 8], sent);
    const seg = o.segura;
    if (seg) maoF = mix(maoF, seg === 'lanterna' ? [ombro[0] + L * 0.7, ombro[1] + L * 0.1] : [ombro[0] + L * 0.58, ombro[1] + L * 0.42], clamp(o.seguraA === undefined ? 1 : o.seguraA));
    maoF = mix(maoF, [ombro[0] + 22, ombro[1] - L * 0.92], br);
    maoF = mix(maoF, [ombro[0] + 19, ombro[1] + L * 0.36], mj);
    maoF = mix(maoF, [ombro[0] + L * 0.95, ombro[1] + L * 0.3], est);
    maoF = mix(maoF, [ombro[0] + L * 0.82, ombro[1] + L * 0.05], abr);
    if (o.maoAlvo) maoF = o.maoAlvo;
    if (seg) {
      const a = clamp(o.seguraA === undefined ? 1 : o.seguraA);
      if (seg === 'pao') pao(ctx, maoF[0] + 6, maoF[1] - 2, crianca ? 0.9 : 1, a);
      else if (seg === 'cesto' && a > 0.01) { ctx.save(); ctx.globalAlpha *= a; cesto(ctx, maoF[0] + 10, maoF[1] + 12, crianca ? 0.8 : 1, o.cheio); ctx.restore(); }
      else if (seg === 'pergaminho') pergaminho(ctx, maoF[0] + 6, maoF[1] - 2, 1, a);
      else if (seg === 'lamparina' && a > 0.01) { ctx.save(); ctx.globalAlpha *= a; lamparina(ctx, maoF[0] + 4, maoF[1] - 2, 1, t); ctx.restore(); }
      else if (seg === 'lanterna' && a > 0.01) { ctx.save(); ctx.globalAlpha *= a; lanternaCeu(ctx, maoF[0] + 8, maoF[1] - 2, crianca ? 0.9 : 1, o.acesa, t); ctx.restore(); }
    }
    braco([ombro[0] + 6, ombro[1] + 6], maoF, ml(tun, K.branco, 0.12), crianca ? 9 : 12);
    ctx.restore();
  }

  // ---------------------------------------------------------------- casa de teto plano (y = chão)
  // o: w, h, cor, porta ('azul' | 'madeira'), janelas, escada (1 = à direita), cupula, luz (janelas à noite), vasos, t
  function casa(ctx, x, y, s, o) {
    const w = o.w || 200, h = o.h || 170, cor = o.cor || H('#fbefe0'), luz = clamp(o.luz || 0), t = o.t || 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    elipse(ctx, 6, 3, w * 0.62, 10, 0, css(K.sombra, 0.14));
    if (o.escada) {                                                             // escada externa até o terraço
      const ex0 = w / 2 - 4, ex1 = w / 2 + h * 0.86;
      ctx.fillStyle = css(aj(cor, -0.05)); ctx.beginPath(); ctx.moveTo(ex0, -h + 6); ctx.lineTo(ex0 + 14, -h + 6); ctx.lineTo(ex1, 0); ctx.lineTo(ex0, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = css(ml(cor, K.branco, 0.35));
      const n = 9;
      for (let i = 0; i < n; i++) { const u = i / n, sx = lerp(ex0 + 14, ex1, u), sy = lerp(-h + 6, 0, u); ctx.fillRect(sx - 2, sy - 2, (ex1 - ex0 - 14) / n + 3, 4); }
    }
    const gw = ctx.createLinearGradient(0, -h, 0, 0);
    gw.addColorStop(0, css(ml(cor, K.branco, 0.45))); gw.addColorStop(1, css(cor));
    ctx.fillStyle = gw; ctx.beginPath(); ctx.roundRect(-w / 2, -h, w, h, 6); ctx.fill();
    ctx.fillStyle = css(aj(cor, -0.06), 0.55); ctx.fillRect(w / 2 - w * 0.16, -h, w * 0.16, h);           // lado em sombra
    ctx.fillStyle = css(ml(cor, K.branco, 0.6)); ctx.beginPath(); ctx.roundRect(-w / 2 - 5, -h - 9, w + 10, 12, 4); ctx.fill();   // beiral / parapeito
    ctx.strokeStyle = css(aj(cor, -0.08), 0.35); ctx.lineWidth = 1.2;                                    // pedras
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const px = -w / 2 + 14 + c * w / 4 + (r % 2) * 18, py = -h + 30 + r * h / 4.5; if (px < w / 2 - 20) { ctx.beginPath(); ctx.roundRect(px, py, 18, 9, 3); ctx.stroke(); } }
    if (o.cupula) {
      const gc = ctx.createLinearGradient(0, -h - 60, 0, -h);
      gc.addColorStop(0, css(H('#e6f1ff'))); gc.addColorStop(1, css(H('#b9d3f3')));
      ctx.fillStyle = gc; ctx.beginPath(); ctx.arc(-w * 0.12, -h - 6, w * 0.22, Math.PI, TAU); ctx.fill();
      ctx.strokeStyle = css(K.ouroForte); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-w * 0.12, -h - 6 - w * 0.22); ctx.lineTo(-w * 0.12, -h - 18 - w * 0.22); ctx.stroke();
    }
    // porta em arco
    const pw = Math.min(46, w * 0.24), px = o.portaX !== undefined ? o.portaX : -w * 0.18;
    ctx.fillStyle = css(o.porta === 'madeira' ? K.madeira : H('#aac2ea'));
    ctx.beginPath(); ctx.moveTo(px - pw / 2, 0); ctx.lineTo(px - pw / 2, -h * 0.42); ctx.arc(px, -h * 0.42, pw / 2, Math.PI, 0); ctx.lineTo(px + pw / 2, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = css(ml(cor, K.branco, 0.5)); ctx.lineWidth = 4; ctx.stroke();
    if (luz > 0.01) { ctx.fillStyle = css(K.luzOuro, 0.5 * luz); ctx.fill(); }
    // janelas
    const nj = o.janelas === undefined ? 2 : o.janelas;
    for (let i = 0; i < nj; i++) {
      const jx = px + pw / 2 + 26 + i * 44, jy = -h * 0.62;
      if (jx > w / 2 - 22) break;
      ctx.fillStyle = css(ml(H('#a9bde6'), K.luzOuro, luz));
      ctx.beginPath(); ctx.moveTo(jx - 9, jy + 14); ctx.lineTo(jx - 9, jy - 2); ctx.arc(jx, jy - 2, 9, Math.PI, 0); ctx.lineTo(jx + 9, jy + 14); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = css(ml(cor, K.branco, 0.5)); ctx.lineWidth = 3; ctx.stroke();
      if (luz > 0.02) brilhoRadial(ctx, jx, jy + 4, 36, K.luzOuro, 0.5 * luz);
    }
    if (o.vasos) for (const [vx, cor2] of [[px + pw / 2 + 10, K.rosa], [w / 2 - 30, H('#e2c6f2')]]) {      // vasos de flores
      ctx.fillStyle = css(K.argila); ctx.beginPath(); ctx.moveTo(vx - 7, -h - 9); ctx.lineTo(vx + 7, -h - 9); ctx.lineTo(vx + 5, -h - 22); ctx.lineTo(vx - 5, -h - 22); ctx.closePath(); ctx.fill();
      for (let k = 0; k < 4; k++) disco(ctx, vx - 6 + k * 4, -h - 26 - (k % 2) * 3 + Math.sin(t * 1.4 + k) * 0.6, 3.4, css(cor2));
      ctx.strokeStyle = css(K.folha); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(vx, -h - 22); ctx.lineTo(vx - 3, -h - 28); ctx.stroke();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- forno de barro (tabun), y = chão
  function forno(ctx, x, y, s, o) {
    const t = o.t || 0, fogo = clamp(o.fogo === undefined ? 1 : o.fogo);
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    for (let i = 0; i < 4; i++) {                                                // fumaça
      const u = mod(t * 0.22 + i / 4, 1);
      elipse(ctx, 6 + Math.sin(t + i * 2) * 8 + u * 16, -64 - u * 120, 9 + u * 18, 7 + u * 14, 0, css(K.branco, 0.32 * fogo * (1 - u)));
    }
    elipse(ctx, 0, 2, 44, 7, 0, css(K.sombra, 0.16));
    const g = ctx.createLinearGradient(0, -56, 0, 0);
    g.addColorStop(0, css(ml(K.argila, K.creme, 0.35))); g.addColorStop(1, css(K.argila));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-38, 0); ctx.quadraticCurveTo(-40, -50, 0, -56); ctx.quadraticCurveTo(40, -50, 38, 0); ctx.closePath(); ctx.fill();
    elipse(ctx, 0, -55, 12, 4, 0, css(K.argilaEsc));
    ctx.fillStyle = css(H('#7e5f5f')); ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-14, -16); ctx.arc(0, -16, 14, Math.PI, 0); ctx.lineTo(14, 0); ctx.closePath(); ctx.fill();
    if (fogo > 0.01) {
      brilhoRadial(ctx, 0, -10, 70, K.chama, 0.6 * fogo);
      for (let i = 0; i < 3; i++) { const f = 0.7 + 0.3 * Math.sin(t * 8 + i * 2); ctx.fillStyle = css(i ? K.ouro : K.chama, 0.9 * fogo); ctx.beginPath(); ctx.ellipse(-6 + i * 6, -8, 4, 9 * f, 0, 0, TAU); ctx.fill(); }
    }
    ctx.restore();
  }
  // esteira com mesa baixa: pães, figos, uvas e jarro (y = chão)
  function mesaBaixa(ctx, x, y, s, o) {
    const paes = clamp(o.paes === undefined ? 1 : o.paes);
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    elipse(ctx, 0, 0, 120, 16, 0, css(H('#e9d2b8')));
    ctx.strokeStyle = css(H('#d9bc9c')); ctx.lineWidth = 2; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.ellipse(0, 0, 116 - Math.abs(i) * 10, 14 - Math.abs(i) * 1.5, 0, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = css(K.madeiraEsc); ctx.fillRect(-56, -16, 8, 14); ctx.fillRect(48, -16, 8, 14);
    ctx.fillStyle = css(K.madeira); ctx.beginPath(); ctx.roundRect(-64, -24, 128, 10, 4); ctx.fill();
    const n = Math.round(paes * 3);
    for (let i = 0; i < n; i++) pao(ctx, -40 + i * 16, -28 - (i % 2) * 3, 0.9);
    disco(ctx, 18, -30, 6, css(H('#c9b5ea'))); disco(ctx, 25, -31, 5, css(H('#b7a2e0'))); disco(ctx, 22, -36, 5, css(H('#c9b5ea')));
    ctx.fillStyle = css(K.argila); ctx.beginPath(); ctx.moveTo(42, -24); ctx.quadraticCurveTo(34, -40, 46, -48); ctx.lineTo(50, -48); ctx.quadraticCurveTo(62, -40, 54, -24); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // poço de pedra com a armação (y = chão)
  function poco(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    elipse(ctx, 0, 2, 52, 8, 0, css(K.sombra, 0.16));
    ctx.fillStyle = css(K.madeiraEsc); ctx.fillRect(-40, -110, 7, 100); ctx.fillRect(33, -110, 7, 100);
    ctx.fillStyle = css(K.madeira); ctx.beginPath(); ctx.roundRect(-46, -116, 92, 9, 3); ctx.fill();
    ctx.strokeStyle = css(K.cestoEsc); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(0, -107); ctx.lineTo(0, -66); ctx.stroke();
    ctx.fillStyle = css(K.madeira); ctx.beginPath(); ctx.moveTo(-9, -66); ctx.lineTo(9, -66); ctx.lineTo(7, -50); ctx.lineTo(-7, -50); ctx.closePath(); ctx.fill();
    const g = ctx.createLinearGradient(0, -46, 0, 0);
    g.addColorStop(0, css(ml(K.pedra, K.branco, 0.3))); g.addColorStop(1, css(K.pedra));
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-44, -44, 88, 44, 8); ctx.fill();
    ctx.strokeStyle = css(K.pedraEsc, 0.8); ctx.lineWidth = 1.4;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { ctx.beginPath(); ctx.roundRect(-40 + c * 21 + (r % 2) * 9, -40 + r * 13, 18, 10, 3); ctx.stroke(); }
    elipse(ctx, 0, -44, 46, 7, 0, css(ml(K.pedra, K.branco, 0.4))); elipse(ctx, 0, -44, 36, 4.5, 0, css(H('#9ec9d6')));
    ctx.restore();
  }
  // oliveira (y = chão)
  function oliveira(ctx, x, y, s, o) {
    const t = (o && o.t) || 0, sw = Math.sin(t * 0.7 + x * 0.01) * 2, cor = (o && o.cor) || K.oliva, claro = (o && o.claro) || K.olivaClara;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    elipse(ctx, 0, 2, 56, 8, 0, css(K.sombra, 0.14));
    ctx.strokeStyle = css(K.tronco); ctx.lineCap = 'round';
    ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-10, -30, 14, -50, 4, -80); ctx.stroke();
    ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(4, -62); ctx.quadraticCurveTo(26, -80, 30, -96); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2, -70); ctx.quadraticCurveTo(-22, -84, -30, -98); ctx.stroke();
    const blobs = [[-34, -104, 30, 20], [0, -122, 38, 24], [34, -106, 30, 19], [-14, -94, 26, 16], [18, -92, 24, 15], [0, -100, 34, 18]];
    ctx.fillStyle = css(cor);
    for (const [bx, by, rx, ry] of blobs) { ctx.beginPath(); ctx.ellipse(bx + sw, by, rx, ry, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = css(claro, 0.85);
    for (const [bx, by, rx, ry] of blobs.slice(0, 3)) { ctx.beginPath(); ctx.ellipse(bx - 6 + sw, by - 6, rx * 0.55, ry * 0.45, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  function palmeira(ctx, x, y, s, o) {
    const t = (o && o.t) || 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = css(K.tronco); ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(14, -80, 6, -160); ctx.stroke();
    ctx.strokeStyle = css(aj(K.tronco, -0.06)); ctx.lineWidth = 2;
    for (let i = 1; i < 10; i++) { const yy = -i * 16; ctx.beginPath(); ctx.moveTo(-3 + i * 0.6, yy); ctx.lineTo(9 + i * 0.4, yy - 3); ctx.stroke(); }
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i - 3) * 0.45 + Math.sin(t * 0.9 + i) * 0.04, L2 = 70 + 10 * (i % 2);
      ctx.strokeStyle = css(i % 2 ? K.folha : K.folhaClara); ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(6, -160); ctx.quadraticCurveTo(6 + Math.cos(a) * L2 * 0.6, -160 + Math.sin(a) * L2 * 0.6 - 18, 6 + Math.cos(a) * L2, -160 + Math.sin(a) * L2 + 26); ctx.stroke();
    }
    ctx.restore();
  }
  function cipreste(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = css(K.tronco); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -20); ctx.stroke();
    elipse(ctx, 0, -78, 20, 64, 0, css(H('#9fd3bf'))); elipse(ctx, -5, -88, 8, 40, 0, css(H('#c4ebd9'), 0.8));
    ctx.restore();
  }

  // ---------------------------------------------------------------- o Templo de Jerusalém (o Segundo Templo, como na maquete clássica),
  // visto do leste, no horizonte: a muralha do Monte do Templo em pedras herodianas, o Pórtico Real à esquerda, os pórticos
  // à direita, os pátios com seus portões, o Santuário de fachada branca e dourada no centro e a Fortaleza Antônia na ponta.
  // x, y = centro da base; o: brilho 0..1 (luz dourada), noite 0..1 (portões acesos), alfa, t
  function templo(ctx, x, y, s, o) {
    const t = o.t || 0, br = clamp(o.brilho || 0), noite = clamp(o.noite || 0), A = o.alfa === undefined ? 1 : o.alfa;
    if (A < 0.01) return;
    const pedra = H('#f4e8d9'), pedraSom = H('#d9cbe2'), pedraClara = H('#fffaf2'), telha = H('#e3cde9'), antonia = H('#ecdccd');
    const ouro = K.ouroForte, ouroClaro = K.ouro, porta = ml(H('#e9c27a'), K.luzOuro, 0.4 * noite);
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= A;
    brilhoRadial(ctx, 0, -190, 520, K.luzOuro, 0.22 + 0.4 * br);
    const bloco = (x0, y0, x1, y1, cor, sombra) => {
      const g = ctx.createLinearGradient(0, y0, 0, y1);
      g.addColorStop(0, css(ml(cor, K.branco, 0.35))); g.addColorStop(1, css(sombra || cor));
      ctx.fillStyle = g; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    };
    const arco = (cx, base, l, h, cor) => {
      ctx.fillStyle = css(cor); ctx.beginPath(); ctx.moveTo(cx - l / 2, base); ctx.lineTo(cx - l / 2, base - h + l / 2); ctx.arc(cx, base - h + l / 2, l / 2, Math.PI, 0); ctx.lineTo(cx + l / 2, base); ctx.closePath(); ctx.fill();
    };
    const colunas = (x0, x1, y0, y1, passo) => {
      ctx.strokeStyle = css(pedraClara); ctx.lineWidth = 3.2;
      for (let cx = x0 + passo / 2; cx < x1; cx += passo) { ctx.beginPath(); ctx.moveTo(cx, y0); ctx.lineTo(cx, y1); ctx.stroke(); }
      ctx.fillStyle = css(pedraSom, 0.55);
      for (let cx = x0 + passo; cx < x1 - 2; cx += passo) ctx.fillRect(cx - passo / 2 + 2.5, y0 + 2, passo - 5, y1 - y0 - 2);
    };
    // o monte sob a muralha, com algumas árvores
    ctx.fillStyle = css(H('#d6d2ee'));
    ctx.beginPath(); ctx.moveTo(-430, 6); ctx.quadraticCurveTo(-360, -22, -300, -14); ctx.lineTo(380, -14); ctx.quadraticCurveTo(430, -20, 470, 6); ctx.closePath(); ctx.fill();
    for (const [tx, h] of [[-372, 30], [-352, 22], [404, 26], [424, 34]]) { ctx.fillStyle = css(H('#b9dccb')); ctx.beginPath(); ctx.ellipse(tx, -10 - h / 2, 6, h / 2, 0, 0, TAU); ctx.fill(); }
    // muralha do Monte do Templo (pedras herodianas com a margem clara)
    bloco(-320, -98, 320, -10, pedra, pedraSom);
    ctx.strokeStyle = css(pedraSom, 0.8); ctx.lineWidth = 1.3;
    for (let r = 0; r < 8; r++) {
      const yy = -98 + 11 * r;
      ctx.beginPath(); ctx.moveTo(-320, yy); ctx.lineTo(320, yy); ctx.stroke();
      for (let cx = -320 + (r % 2) * 17; cx < 320; cx += 34) { ctx.beginPath(); ctx.moveTo(cx, yy); ctx.lineTo(cx, yy + 11); ctx.stroke(); }
    }
    ctx.strokeStyle = css(pedraClara, 0.7); ctx.lineWidth = 1;
    for (let r = 0; r < 8; r++) { const yy = -96 + 11 * r; ctx.beginPath(); ctx.moveTo(-318, yy); ctx.lineTo(318, yy); ctx.stroke(); }
    bloco(298, -112, 322, -98, pedra, pedraSom);                                        // pináculo do canto
    // Pórtico Real (à esquerda): colunata longa, telhado e a nave central mais alta
    bloco(-316, -140, -122, -98, pedra, pedraSom);
    colunas(-316, -122, -138, -98, 13);
    ctx.fillStyle = css(telha); ctx.beginPath(); ctx.moveTo(-322, -140); ctx.lineTo(-116, -140); ctx.lineTo(-124, -150); ctx.lineTo(-314, -150); ctx.closePath(); ctx.fill();
    bloco(-262, -170, -176, -150, pedra, pedraSom);
    for (let k = 0; k < 5; k++) arco(-252 + k * 17, -155, 7, 11, ml(pedraSom, porta, noite));
    ctx.fillStyle = css(telha); ctx.beginPath(); ctx.moveTo(-266, -170); ctx.lineTo(-219, -182); ctx.lineTo(-172, -170); ctx.closePath(); ctx.fill();
    // pórticos à direita (o Pórtico de Salomão)
    bloco(126, -128, 298, -98, pedra, pedraSom);
    colunas(126, 298, -126, -98, 12);
    ctx.fillStyle = css(telha); ctx.fillRect(122, -134, 180, 7);
    // Fortaleza Antônia, na ponta direita, com suas torres
    bloco(322, -150, 380, -14, antonia, pedraSom);
    for (const [tx, h] of [[326, 196], [368, 214]]) {
      bloco(tx - 12, -h, tx + 12, -150, antonia, pedraSom);
      ctx.fillStyle = css(ml(antonia, K.branco, 0.3));
      for (let k = 0; k < 3; k++) ctx.fillRect(tx - 12 + k * 9, -h - 6, 6, 6);
      arco(tx, -h + 34, 6, 12, ml(pedraSom, porta, noite));
    }
    // pátio das mulheres e o Portão Formoso
    bloco(-112, -134, 116, -98, pedra, pedraSom);
    ctx.fillStyle = css(pedraClara); ctx.fillRect(-114, -138, 232, 5);
    for (const [gx, l, h] of [[-70, 14, 24], [0, 22, 32], [74, 14, 24]]) arco(gx, -98, l, h, porta);
    // pátio de Israel, mais alto, com o Portão de Nicanor
    bloco(-84, -156, 88, -134, pedra, pedraSom);
    ctx.fillStyle = css(pedraClara); ctx.fillRect(-86, -160, 176, 5);
    arco(2, -134, 16, 21, ml(porta, H('#e6b98f'), 0.3));
    // fumaça suave do altar (à frente do Santuário)
    for (let i = 0; i < 4; i++) {
      const u = mod(t * 0.07 + i / 4, 1);
      ctx.fillStyle = css(K.branco, 0.22 * (1 - u)); ctx.beginPath(); ctx.ellipse(-34 + Math.sin(t * 0.4 + i) * 6 - u * 30, -160 - u * 120, 8 + 16 * u, 6 + 10 * u, 0, 0, TAU); ctx.fill();
    }
    // o Santuário: fachada larga e alta, branca, com ouro; a grande entrada do pórtico e a videira de ouro
    bloco(-50, -272, 50, -156, pedraClara, pedra);
    ctx.fillStyle = css(pedraSom, 0.45); ctx.fillRect(34, -272, 16, 116);
    ctx.strokeStyle = css(ouro, 0.85); ctx.lineWidth = 2.4; ctx.strokeRect(-50, -272, 100, 116);
    const ge = ctx.createLinearGradient(0, -250, 0, -156);
    ge.addColorStop(0, css(ml(ouro, K.luz, 0.25 + 0.4 * br))); ge.addColorStop(1, css(ml(H('#d9a85c'), K.luzOuro, 0.5 * noite)));
    ctx.fillStyle = ge; ctx.fillRect(-15, -250, 30, 94);
    ctx.strokeStyle = css(ouroClaro); ctx.lineWidth = 2; ctx.strokeRect(-15, -250, 30, 94);
    ctx.fillStyle = css(H('#c9a24f'), 0.5); ctx.fillRect(-7, -222, 14, 66);                   // a porta de ouro lá dentro
    ctx.strokeStyle = css(ouroClaro); ctx.lineWidth = 2.2;                                       // videira de ouro sobre a entrada
    ctx.beginPath(); for (let k = 0; k <= 12; k++) { const vx = -26 + k * 4.4, vy = -256 + Math.sin(k * 1.3) * 2.4; k ? ctx.lineTo(vx, vy) : ctx.moveTo(vx, vy); } ctx.stroke();
    for (let k = 0; k < 6; k++) { ctx.fillStyle = css(ouro); ctx.beginPath(); ctx.arc(-22 + k * 9, -252, 2.3, 0, TAU); ctx.fill(); }
    ctx.fillStyle = css(ouro); ctx.fillRect(-52, -276, 104, 5);                                  // cornija dourada
    for (let k = 0; k <= 13; k++) { const px = -49 + k * 7.5; ctx.beginPath(); ctx.moveTo(px - 1.6, -276); ctx.lineTo(px, -284); ctx.lineTo(px + 1.6, -276); ctx.closePath(); ctx.fill(); }
    if (br > 0.01) {                                                                              // brilho do Reino
      ctx.fillStyle = css(K.luz, 0.9 * br);
      for (let i = 0; i < 6; i++) { const a = t * 0.8 + i * 1.05; brilho4(ctx, Math.cos(a) * 70, -214 + Math.sin(a * 1.3) * 50, 3 + 3 * Math.max(0, Math.sin(t * 3 + i))); }
    }
    if (noite > 0.01) for (const [gx, gy] of [[-70, -108], [0, -112], [74, -108], [2, -142], [0, -200]]) brilhoRadial(ctx, gx, gy, 26, K.luzOuro, 0.6 * noite);
    // névoa clara na base (o templo "pousa" no horizonte)
    const gn = ctx.createLinearGradient(0, -40, 0, 12);
    gn.addColorStop(0, css(K.branco, 0)); gn.addColorStop(1, css(ml(K.lilas, K.branco, 0.5), 0.75));
    ctx.fillStyle = gn; ctx.fillRect(-460, -40, 940, 52);
    ctx.restore();
  }

  G.SeresPN = { K, ROUPA, pessoa, pao, cesto, pergaminho, lanternaCeu, lamparina, coracao, casa, forno, mesaBaixa, poco, oliveira, palmeira, cipreste, templo };
})(window);
