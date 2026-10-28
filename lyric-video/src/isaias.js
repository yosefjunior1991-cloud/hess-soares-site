// Tema "Isaías 41:10" (Não temas), criado do zero a partir da letra inteira (a imagem da música é só um fundo preto), para o
// vídeo final em 16:9. Um caminhante com uma lamparina atravessa a noite: o medo vem como nuvens escuras que cobrem o céu, a
// estrada se divide e ele não sabe qual seguir; ele levanta os olhos, as estrelas se abrem e a lamparina se acende com força.
// Uma mão de luz desce do alto (a destra da justiça; Deus não é retratado como pessoa) e uma orbe de presença o acompanha.
// Quando as mãos tremem ele cai de joelhos, e a mão de luz o levanta e o segura; uma árvore forte cresce ao seu lado; outros
// viajantes se juntam com lanternas; amanhece, e todos chegam a um monte com o sol nascendo. Os instantes saem do texto da
// legenda; os trechos que os disparam ficam em `animacao.json`, na pasta da música (`gatilhos`), e não neste repositório público.
(function (G) {
  'use strict';
  const { clamp, lerp, smooth, mod, css, rgb, hash1, mulberry32, ease } = G.U;
  const R91 = G.Seres91, PN = G.SeresPN, B = G.SeresBS, S2 = G.SeresS2, M = G.SeresM, I = G.SeresI, K = M.K, ml = R91.ml, brilhoRadial = R91.brilhoRadial, brilho4 = R91.brilho4;
  const ALT = 1080, TAU = Math.PI * 2;
  const SOLO = 0.885 * ALT;
  const HORSKY = 0.74 * ALT;
  const semNikud = (s) => s.normalize('NFD').replace(/[֑-ׇ]/g, '').replace(/[̀-ͯ]/g, '');
  const H = (hex) => rgb(hex);

  const PADRAO = {
    altira: [11.77, 18.71, 88.82, 103.68, 110.35, 131.12, 176.37, 190.33, 197.67, 218.9, 233.01, 240.28, 254.82, 290.23, 297.33, 304.83, 308.66, 334.43, 349.93],
    imcha: [24.77, 31.8, 91.94, 105.09, 112.79, 115.91, 119.89, 136.87, 179.83, 193.28, 200.31, 203.82, 207.69, 225.14, 293.33, 300.85, 311.37, 341.63],
    medo: [39.22], noite: [45.44], naosouber: [53.1], caminho: [59.96], olhos: [66.58], quemtu: [70.49], forca: [73.6], esperanca: [80.39], naoassustes: [95.81],
    forta: [122.91, 187.38, 210.92, 272.77, 274.83, 319.27], ajuda: [126.34, 214.43, 278.58, 322.78], tremer: [147.07], sustentaras: [150.6], acabarem: [153.55], levantaras: [157.46],
    maodireita: [160.33], justica: [164.24], sozinho: [167.51], comigo: [171.02], eusou: [95.81, 183.36, 247.58, 268.59], sustentarei: [282.09, 326.13], commao: [286.95], destra: [329.9],
  };

  // ---------------------------------------------------------------- céu por hora do dia
  const CEU = [
    [0, '#737cc4', '#8f96d6', '#b3a9dc'], [4.4, '#7f88cb', '#a9a3dc', '#d9bfdc'], [5.6, '#99a8e6', '#e6c3dc', '#ffd4b8'], [6.6, '#a8c6f0', '#f6d6dc', '#ffe2b8'],
    [8, '#aed9f5', '#d6efff', '#fff0d2'], [12, '#9fd3f3', '#cdeefe', '#eefaf6'], [15.5, '#acd2f2', '#e3eaf8', '#ffe8c9'],
    [17.4, '#b6c3ee', '#f7d2c4', '#ffd49e'], [18.3, '#aaa6e0', '#f2b8c4', '#ffc79b'], [19.4, '#8f91d1', '#c3a5d9', '#f4b9bb'],
    [20.6, '#7f88cb', '#9aa0dc', '#c0b4e3'], [24, '#737cc4', '#8f96d6', '#b3a9dc'],
  ].map(([h, a, b, c]) => [h, H(a), H(b), H(c)]);
  function ceuEm(h) {
    h = mod(h, 24);
    let i = 0; while (i < CEU.length - 2 && CEU[i + 1][0] <= h) i++;
    const A = CEU[i], Bk = CEU[i + 1], f = clamp((h - A[0]) / (Bk[0] - A[0])), k = f * f * (3 - 2 * f);
    return { top: ml(A[1], Bk[1], k), mid: ml(A[2], Bk[2], k), hor: ml(A[3], Bk[3], k) };
  }
  const noiteF = (h) => { h = mod(h, 24); return h < 12 ? 1 - smooth(4.6, 6.4, h) : smooth(18.6, 20.4, h); };


  function criar(musica, parte, W) {
    const dur = parte.duracao;
    const gat = parte.gatilhos || {};
    const linhas = musica.linhas.filter((l) => l.parte === parte.indice)
      .map((l) => ({ a: l.ini - parte.inicio, txt: semNikud(l.texto + ' ' + (l.traducao || '')) }));
    const T = (nome, n) => {
      n = n || 0;
      if (gat[nome]) {
        const re = new RegExp(semNikud(gat[nome]), 'i');
        const r = linhas.filter((l) => re.test(l.txt)).map((l) => l.a);
        if (r[n] !== undefined) return r[n];
      }
      const p = PADRAO[nome];
      return p[Math.min(n, p.length - 1)];
    };
    const TT = (nome) => PADRAO[nome].map((_, i) => T(nome, i));
    const tAlTira = TT('altira'), tImcha = TT('imcha'), tMedo = T('medo'), tNoite = T('noite'), tNaoSouber = T('naosouber'), tCaminho = T('caminho'), tOlhos = T('olhos'), tQuemTu = T('quemtu');
    const tForca = T('forca'), tEsperanca = T('esperanca'), tNaoAssustes = T('naoassustes'), tForta = TT('forta'), tAjuda = TT('ajuda'), tTremer = T('tremer'), tSustentaras = T('sustentaras');
    const tAcabarem = T('acabarem'), tLevantaras = T('levantaras'), tMaoDir = T('maodireita'), tJustica = T('justica'), tSozinho = T('sozinho'), tComigo = T('comigo');
    const tEuSou = TT('eusou'), tSustentarei = TT('sustentarei'), tComMao = T('commao'), tDestra = T('destra');
    const win = (a, b, c, d, t) => smooth(a, b, t) * (1 - smooth(c, d, t));
    const pulso = (t0, sobe, desce, t) => win(t0 - 0.1, t0 + sobe, t0 + sobe + 0.5, t0 + sobe + desce, t);
    const pulsos = (arr, sobe, desce, t) => arr.reduce((m, t0) => Math.max(m, pulso(t0, sobe, desce, t)), 0);
    const tChega = 302.0, tArvore = tForta[1], tJuntam = tForta[2];

    // ---------------------------------------------------------------- horas: uma noite longa; o amanhecer começa quando outros se juntam
    const HS = [
      [0, 0.6], [tMedo, 1.2], [tOlhos, 1.8], [tForca, 2.2], [tMaoDir, 3.0], [tArvore, 3.5], [tJuntam, 4.0], [tJuntam + 12, 4.7], [tComMao, 5.5], [tChega, 6.3], [tDestra, 6.9], [dur + 1, 7.6],
    ];
    const horaEm = (tl) => {
      let i = 0; while (i < HS.length - 2 && HS[i + 1][0] <= tl) i++;
      const [a, ha] = HS[i], [b, hb] = HS[i + 1];
      return lerp(ha, hb, clamp((tl - a) / Math.max(1e-6, b - a)));
    };
    const medoEm = (tl) => win(tMedo - 1, tMedo + 4, tOlhos - 0.4, tOlhos + 3.5, tl);          // as nuvens do medo

    // ---------------------------------------------------------------- a caminhada: o mundo rola e o caminhante fica na tela
    const PASSO = 1 / 30, V = 105, TX = 700;
    const JAN = [
      [tMedo - 3, tMedo - 1, tNaoSouber - 0.6, tNaoSouber + 0.6, 0.55],
      [tForca - 0.4, tForca + 1.6, tTremer - 1.4, tTremer - 0.2, 1.0],
      [tMaoDir + 1.6, tMaoDir + 3.4, tChega - 3, tChega - 0.2, 0.9],
    ];
    const velEm = (t) => { let v = 0; for (const [a, b, c, d, m] of JAN) v = Math.max(v, win(a, b, c, d, t) * m); return v; };
    const nTab = Math.ceil(dur / PASSO) + 3, rolTab = new Float64Array(nTab);
    for (let i = 1; i < nTab; i++) rolTab[i] = rolTab[i - 1] + V * velEm((i - 1) * PASSO) * PASSO;
    const rolEm = (t) => { const x = clamp(t / PASSO, 0, nTab - 1.001), i = Math.floor(x); return lerp(rolTab[i], rolTab[i + 1], x - i); };
    const X_FORK = rolEm(tNaoSouber) + TX + 520, X_ARV = rolEm(tArvore) + TX + 360, X_MONTE = rolEm(tChega) + TX + 120;

    function luzObj(S, cor, k) {
      const c = typeof cor === 'string' ? H(cor) : cor;
      return ml(ml(c, S.ceu.mid, S.noite * 0.5 * (k || 1) + S.storm * 0.35 * (k || 1)), S.ceu.hor, 0.1 * (k || 1) * (1 - S.noite));
    }
    const tintF = (S) => (c, k) => luzObj(S, c, k);

    // ---------------------------------------------------------------- céu
    function ceuFundo(ctx, S) {
      const c = S.ceu, g = ctx.createLinearGradient(0, 0, 0, HORSKY + 50);
      g.addColorStop(0, css(c.top)); g.addColorStop(0.5, css(c.mid)); g.addColorStop(1, css(c.hor));
      ctx.fillStyle = g; ctx.fillRect(-40, -40, S.W + 80, ALT + 80);
    }
    const rE = mulberry32(61);
    const ESTRELAS = Array.from({ length: Math.round(120 + W * 0.1) }, () => ({ u: rE(), v: Math.pow(rE(), 1.25), r: 0.7 + Math.pow(rE(), 3) * 2.2, w: 0.7 + rE() * 2.4, f: rE() * TAU }));
    function estrelas(ctx, S) {
      if (S.noite < 0.03) return;
      for (const e of ESTRELAS) {
        const y = e.v * HORSKY * 0.95, tw = 0.55 + 0.45 * Math.sin(S.t * e.w + e.f);
        const a = Math.min(1, S.noite * tw * clamp((HORSKY - y) / 220) * (1 - 0.8 * S.storm));
        if (a < 0.03) continue;
        ctx.fillStyle = css(K.luz, a);
        if (e.r > 2) brilho4(ctx, e.u * S.W, y, e.r * 3); else { ctx.beginPath(); ctx.arc(e.u * S.W, y, e.r, 0, TAU); ctx.fill(); }
      }
    }
    function corpoCeleste(ctx, S) {
      const h = mod(S.hora, 24), Wd = S.W;
      const aS = Math.PI * (h - 6) / 12, altS = Math.sin(aS);
      S.sol = { x: Wd * (0.5 - Math.cos(aS) * 0.44), y: HORSKY - altS * 0.6 * ALT, alt: altS };
      const vis = 1 - 0.8 * S.storm;
      if (altS > -0.2) {
        const baixo = 1 - clamp(altS * 2.4), r = 46 * (1 + 0.25 * baixo), quente = ml(K.creme, H('#ffb98f'), baixo * 0.9);
        const f = clamp((altS + 0.2) / 0.3) * vis, rasa = lerp(0.55, 1, smooth(0.0, 0.35, altS));
        ctx.save(); ctx.translate(S.sol.x, S.sol.y); ctx.scale(1, rasa); ctx.translate(-S.sol.x, -S.sol.y);
        brilhoRadial(ctx, S.sol.x, S.sol.y, 600, quente, 0.36 * f);
        brilhoRadial(ctx, S.sol.x, S.sol.y, 240, K.creme, 0.42 * f);
        ctx.restore();
        const g = ctx.createRadialGradient(S.sol.x - r * 0.25, S.sol.y - r * 0.25, r * 0.1, S.sol.x, S.sol.y, r);
        g.addColorStop(0, css(K.luz, f)); g.addColorStop(0.7, css(K.creme, f)); g.addColorStop(1, css(quente, 0.9 * f));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(S.sol.x, S.sol.y, r, 0, TAU); ctx.fill();
      }
      const aL = Math.PI * mod(h - 18.5, 24) / 12, altL = Math.sin(aL);
      S.lua = { x: Wd * (0.5 - Math.cos(aL) * 0.42), y: HORSKY - altL * 0.55 * ALT, alt: altL };
      if (altL > -0.1 && mod(h - 18.5, 24) < 12.4) {
        const v = S.noite * clamp((altL + 0.1) / 0.3) * vis, r = 36;
        brilhoRadial(ctx, S.lua.x, S.lua.y, 200, H('#c9d0ff'), 0.42 * v);
        const g = ctx.createRadialGradient(S.lua.x - r * 0.3, S.lua.y - r * 0.3, r * 0.1, S.lua.x, S.lua.y, r);
        g.addColorStop(0, css(H('#fbfcff'), v)); g.addColorStop(0.7, css(H('#e8ebfa'), v)); g.addColorStop(1, css(H('#c9cee8'), v));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(S.lua.x, S.lua.y, r, 0, TAU); ctx.fill();
      }
    }
    const rN = mulberry32(97);
    const NUVENS = Array.from({ length: Math.round(6 + W / 220) }, () => ({ x0: rN() * (W + 800), y: (0.05 + rN() * 0.4) * ALT, w: 150 + rN() * 240, h: 0.16 + rN() * 0.14, v: 3 + rN() * 6, a: 0.28 + rN() * 0.3, tom: rN() }));
    function nuvens(ctx, S) {
      const per = S.W + 800;
      for (const n of NUVENS) {
        const x = mod(n.x0 - S.t * n.v, per) - 400;
        let col = ml(K.luz, S.ceu.mid, 0.25 + 0.4 * S.noite);
        col = ml(col, K.rosa, n.tom * 0.3 * (1 - S.noite));
        const a = n.a * (1 - 0.4 * S.noite) * (1 - 0.6 * S.storm);
        ctx.save(); ctx.translate(x, n.y); ctx.scale(1, n.h);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, n.w);
        g.addColorStop(0, css(col, a)); g.addColorStop(0.5, css(col, a * 0.55)); g.addColorStop(1, css(col, 0));
        ctx.fillStyle = g; ctx.fillRect(-n.w, -n.w, n.w * 2, n.w * 2);
        ctx.restore();
      }
    }

    function serraR(ctx, S, Lc) {
      const Wd = S.W, cam = S.rol * Lc.par;
      const topoC = luzObj(S, ml(H(Lc.cor), S.ceu.mid, Lc.haze), 1), fundoC = luzObj(S, ml(H(Lc.cor), S.ceu.mid, Lc.haze + 0.22), 1);
      ctx.beginPath(); ctx.moveTo(-20, ALT + 20);
      for (let x = -20; x <= Wd + 20; x += 6) ctx.lineTo(x, yCrista(Lc, x + cam + 300));
      ctx.lineTo(Wd + 20, ALT + 20); ctx.closePath();
      const yTop = Lc.base * ALT - (Lc.a[0] * 1.12 + Lc.a[1] + Lc.a[2]);
      const g = ctx.createLinearGradient(0, yTop, 0, yTop + 380);
      g.addColorStop(0, css(topoC)); g.addColorStop(1, css(fundoC));
      ctx.fillStyle = g; ctx.fill();
    }
    const MONT = {
      longe: { par: 0.03, base: 0.665, a: [100, 40, 14], per: [900, 420, 170], p: [0.9, 2.4, 4.1], pico: true, cor: '#cdcbf0', haze: 0.45 },
      meio: { par: 0.08, base: 0.735, a: [46, 18, 7], per: [760, 340, 150], p: [2.2, 0.6, 3.1], cor: '#e0cfe8', haze: 0.32 },
    };
    function yCrista(Lc, X) {
      const w0 = Math.sin(TAU * X / Lc.per[0] + Lc.p[0]), w1 = Math.sin(TAU * X / Lc.per[1] + Lc.p[1]), w2 = Math.sin(TAU * X / Lc.per[2] + Lc.p[2]);
      const h0 = Lc.pico ? Lc.a[0] * (1.12 - 1.5 * Math.abs(w0)) : Lc.a[0] * w0;
      return Lc.base * ALT - (h0 + Lc.a[1] * w1 + Lc.a[2] * w2);
    }
    function serra(ctx, S, Lc) {
      const Wd = S.W, cam = Math.sin(S.t * 0.05) * 14 * Lc.par * 8;
      const topoC = luzObj(S, ml(H(Lc.cor), S.ceu.mid, Lc.haze), 1), fundoC = luzObj(S, ml(H(Lc.cor), S.ceu.mid, Lc.haze + 0.22), 1);
      ctx.beginPath(); ctx.moveTo(-20, ALT + 20);
      for (let x = -20; x <= Wd + 20; x += 6) ctx.lineTo(x, yCrista(Lc, x + cam + 300));
      ctx.lineTo(Wd + 20, ALT + 20); ctx.closePath();
      const yTop = Lc.base * ALT - (Lc.a[0] * 1.12 + Lc.a[1] + Lc.a[2]);
      const g = ctx.createLinearGradient(0, yTop, 0, yTop + 380);
      g.addColorStop(0, css(topoC)); g.addColorStop(1, css(fundoC));
      ctx.fillStyle = g; ctx.fill();
    }

    const borda = (x) => 0.835 * ALT + 5 * Math.sin(x * 0.0057) + 2.5 * Math.sin(x * 0.019);

    function chao(ctx, S) {
      const Wd = S.W, y0 = 0.80 * ALT;
      const c1 = luzObj(S, '#e6dcc6', 1), c2 = luzObj(S, '#ddd5bd', 1), c3 = luzObj(S, '#cdd3b9', 1);
      const g = ctx.createLinearGradient(0, y0, 0, ALT);
      g.addColorStop(0, css(c1)); g.addColorStop(0.5, css(c2)); g.addColorStop(1, css(c3));
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-20, ALT + 20);
      for (let x = -20; x <= Wd + 20; x += 12) ctx.lineTo(x, borda(x));
      ctx.lineTo(Wd + 20, ALT + 20); ctx.closePath(); ctx.fill();
      // a estrada de terra, que se divide no cruzamento
      const cam = S.rol, fx = X_FORK - cam;
      ctx.fillStyle = css(luzObj(S, '#f3e8d2', 1), 0.75); ctx.beginPath();
      ctx.moveTo(-40, SOLO + 6); ctx.lineTo(Wd + 40, SOLO + 6); ctx.lineTo(Wd + 40, SOLO + 64); ctx.lineTo(-40, SOLO + 64); ctx.closePath(); ctx.fill();
      if (fx > -600 && fx < Wd + 600) {
        for (const [dy, dyEnd] of [[-1, -70], [1, 90]]) {
          ctx.beginPath(); ctx.moveTo(fx - 120, SOLO + 14); ctx.quadraticCurveTo(fx + 40, SOLO + 14 + dy * 8, fx + 320, SOLO + 28 + dyEnd * 0.6);
          ctx.lineTo(fx + 320, SOLO + 68 + dyEnd * 0.6); ctx.quadraticCurveTo(fx + 40, SOLO + 60 + dy * 8, fx - 120, SOLO + 60); ctx.closePath(); ctx.fill();
        }
      }
    }
    // relva e pedras que rolam com o mundo
    function relvaR(ctx, S) {
      const Wd = S.W, cam = S.rol, CEL = 34, c0 = Math.floor((cam - 40) / CEL), c1 = Math.floor((cam + Wd + 40) / CEL);
      for (let c = c0; c <= c1; c++) {
        const h1 = hash1(c * 2.13 + 3), h2 = hash1(c * 7.77 + 1), h3 = hash1(c * 4.9 + 9);
        const sx = c * CEL + h1 * CEL - cam, y0 = lerp(borda(sx) + 12, ALT - 12, h3 * h3);
        if (y0 > SOLO - 6 && y0 < SOLO + 70) continue;
        const n = 2 + Math.floor(h1 * 3), esc = 0.55 + 0.9 * h3;
        ctx.lineCap = 'round';
        for (let i = 0; i < n; i++) {
          const alt = (10 + hash1(c * 3.3 + i) * 18) * esc, lean = (i - (n - 1) / 2) * 5 * esc + Math.sin(S.t * 1.3 + c * 0.7 + i) * 2.5 * (alt / 26);
          ctx.strokeStyle = css(luzObj(S, i % 2 ? '#b7ceae' : '#cfd9b4', 0.9)); ctx.lineWidth = 2.3 * esc;
          ctx.beginPath(); ctx.moveTo(sx + (i - n / 2) * 3 * esc, y0); ctx.quadraticCurveTo(sx + lean * 0.5, y0 - alt * 0.6, sx + lean, y0 - alt); ctx.stroke();
        }
        if (h2 > 0.9) B.rocha(ctx, sx, y0 + 10, 0.8 + h3, c);
      }
    }
    function arvoresR(ctx, S) {
      const Wd = S.W, cam = S.rol * 0.5, CEL = 260;
      for (let c = Math.floor((cam - 200) / CEL); c <= Math.floor((cam + Wd + 200) / CEL); c++) {
        if (hash1(c * 3.31 + 5) > 0.55) continue;
        const sx = c * CEL + hash1(c * 1.7) * CEL * 0.7 - cam, y = borda(sx) + 24 + hash1(c * 2.9) * 20;
        if (hash1(c * 4.4) < 0.5) PN.cipreste(ctx, sx, y, 0.55 + 0.2 * hash1(c)); else PN.oliveira(ctx, sx, y, 0.5 + 0.25 * hash1(c), { t: S.t });
      }
    }

    // ---------------------------------------------------------------- feixe do céu
    function facho(ctx, x0, y0, x1, y1, w0, w1, al, fim) {
      if (al < 0.003) return;
      const ang = Math.atan2(x1 - x0, y1 - y0), L = Math.hypot(x1 - x0, y1 - y0), N = 36;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(x0, y0); ctx.rotate(-ang);
      for (let i = 0; i < N; i++) {
        const u0 = i / N, u1 = (i + 1) / N, um = (u0 + u1) / 2, f = 1 - smooth(fim, 1.0, um);
        if (f < 0.004) continue;
        const a0 = w0 + (w1 - w0) * u0, a1 = w0 + (w1 - w0) * u1, g = ctx.createLinearGradient(-a1, 0, a1, 0);
        g.addColorStop(0, css(K.luzOuro, 0)); g.addColorStop(0.5, css(K.luz, al * f)); g.addColorStop(1, css(K.luzOuro, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-a0, L * u0); ctx.lineTo(a0, L * u0); ctx.lineTo(a1, L * u1); ctx.lineTo(-a1, L * u1); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }

    // ---------------------------------------------------------------- o medo: nuvens escuras e uma névoa; as estrelas se abrem quando ele levanta os olhos
    const rT = mulberry32(51);
    const TEMP = Array.from({ length: 8 }, (_, i) => ({ x0: rT() * (W + 600), y: 80 + rT() * 260, s: 1.2 + rT() * 0.9, v: 8 + rT() * 8, sem: i }));
    function medo(ctx, S) {
      const m = medoEm(S.tl);
      if (m < 0.02) return;
      const per = S.W + 700;
      for (const c of TEMP) S2.nuvemTempestade(ctx, mod(c.x0 + S.t * c.v, per) - 350, c.y + 18 * Math.sin(S.t * 0.2 + c.sem), c.s, m * 0.88, c.sem);
    }
    function gloom(ctx, S) {
      const m = medoEm(S.tl);
      if (m > 0.02) { ctx.fillStyle = css(H('#4f4c70'), 0.26 * m); ctx.fillRect(-40, -40, S.W + 80, ALT + 80); }
    }
    function estrelasAbertas(ctx, S) {
      const a = Math.max(pulso(tOlhos, 1.4, 6, S.tl), 0.5 * win(tOlhos, tOlhos + 5, tChega - 8, tChega, S.tl));
      if (a < 0.02) return;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 16; i++) {
        const f = Math.max(smooth(i * 0.06, i * 0.06 + 0.5, a), a * 0.55), x = (0.06 + 0.88 * hash1(i * 7.3 + 1)) * S.W, y = (0.04 + 0.4 * hash1(i * 3.9 + 2)) * HORSKY;
        brilhoRadial(ctx, x, y, 38 + 36 * f, K.luzOuro, 0.5 * f * S.noite);
        ctx.fillStyle = css(K.luz, 0.95 * f * S.noite); brilho4(ctx, x, y, 10 + 16 * f);
      }
      ctx.restore();
    }

    // ---------------------------------------------------------------- objetos do mundo: placa no cruzamento, a árvore forte, o monte da chegada
    function cruzamento(ctx, S) {
      const x = X_FORK - S.rol;
      if (x < -300 || x > S.W + 300) return;
      const a = 1;
      ctx.save(); ctx.globalAlpha *= a;
      ctx.strokeStyle = css(K.madeiraMEsc); ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + 140, SOLO + 28); ctx.lineTo(x + 140, SOLO - 150); ctx.stroke();
      for (const [dy, lado] of [[-148, 1], [-112, -1]]) {
        ctx.fillStyle = css(K.madeiraM); ctx.beginPath(); ctx.moveTo(x + 140 - lado * 66, SOLO + dy - 15); ctx.lineTo(x + 140 + lado * 56, SOLO + dy - 15); ctx.lineTo(x + 140 + lado * 80, SOLO + dy); ctx.lineTo(x + 140 + lado * 56, SOLO + dy + 15); ctx.lineTo(x + 140 - lado * 66, SOLO + dy + 15); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    function arvoreForte(ctx, S) {
      const g = ease.outCubic(smooth(tArvore - 0.6, tArvore + 5, S.tl));
      if (g < 0.01) return;
      const x = X_ARV - S.rol;
      if (x < -400 || x > S.W + 400) return;
      ctx.save(); ctx.globalAlpha *= clamp(g * 1.6);
      brilhoRadial(ctx, x, SOLO - 150 * g, 260 * g, K.luzOuro, 0.3);
      PN.oliveira(ctx, x, SOLO + 20, 0.4 + 1.55 * g, { t: S.t });
      ctx.restore();
    }
    function montes(ctx, S) {
      const x = X_MONTE - S.rol;
      if (x > S.W + 700) return;
      const tint = tintF(S), g = ctx.createLinearGradient(0, SOLO - 330, 0, SOLO + 60);
      g.addColorStop(0, css(tint(H('#efdcc6'), 1))); g.addColorStop(1, css(tint(H('#d3c5cf'), 1)));
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 800, SOLO + 70);
      for (let dx = -800; dx <= 900; dx += 12) { const a = Math.abs(dx - 40) / 840, h = 300 * Math.pow(Math.max(0, 1 - a), 1.2) + 8 * Math.sin(dx * 0.02); ctx.lineTo(x + dx, SOLO + 40 - h); }
      ctx.lineTo(x + 900, SOLO + 70); ctx.closePath(); ctx.fill();
    }

    // ---------------------------------------------------------------- a mão de luz, a orbe e os que se juntam
    const COMP = [{ dx: -110, cor: '#f4c8b0' }, { dx: -200, cor: '#f9e1a0', veu: true }, { dx: -290, cor: '#c9e6d4' }, { dx: -380, cor: '#f2c6e0', veu: true }];
    const CY = SOLO + 12;
    function maoEOrbe(ctx, S) {
      const tl = S.tl, tx = TX + 30 * Math.sin(S.t * 0.4);
      // a mão de luz: desce no alto ("Não temas"), segura a mão dele em "Tua mão direita me segura"
      const a = Math.max(win(tAlTira[2] - 0.5, tAlTira[2] + 2.5, tSozinho - 1, tSozinho + 2, tl), win(tForta[1] - 0.5, tForta[1] + 2.5, tJuntam - 1, tJuntam + 2, tl), win(tForta[4] - 0.8, tForta[4] + 2.5, dur, dur + 1, tl));
      const pul = Math.max(pulsos(tAlTira, 0.8, 4, tl), pulsos(tForta, 0.8, 4, tl), pulsos(tAjuda, 0.8, 4, tl), pulsos(tSustentarei, 0.8, 4, tl), pulso(tComMao, 1, 5, tl));
      const baixa = ease.inOutSine(smooth(tSustentaras - 0.4, tSustentaras + 3, tl)) * (1 - ease.inOutSine(smooth(tSozinho, tSozinho + 3, tl)));
      const alta = ease.inOutSine(smooth(tAcabarem - 0.4, tAcabarem + 3, tl));
      const perto = Math.max(baixa, alta * (1 - smooth(tSozinho, tSozinho + 3, tl)));
      const alvoY = lerp(330, CY - 205, perto), alvoX = tx + lerp(250, 70, perto), esc = lerp(1.5, 0.85, perto);
      if (a > 0.01) I.maoLuz(ctx, alvoX, alvoY, esc, { alfa: a * lerp(1, 0.6, perto), brilho: pul * (1 - 0.6 * perto), antebraco: lerp(900, 380, perto) });
      const aOrbe = smooth(tImcha[5] - 0.5, tImcha[5] + 2, tl);
      if (aOrbe > 0.01) {
        const oy = CY - 255 + 12 * Math.sin(S.t * 1.7), ox = tx + 120 + 10 * Math.sin(S.t * 1.1);
        I.orbe(ctx, ox, oy, 1.0, { alfa: aOrbe, brilho: Math.max(pulsos(tImcha, 0.8, 4, tl), pulsos(tAjuda, 0.8, 4, tl)), t: S.t });
        facho(ctx, ox, oy, tx + 6, CY - 150, 6, 24, 0.12 * aOrbe, 0.8);
      }
    }
    function viajante(ctx, S) {
      const tl = S.tl, fear = medoEm(tl);
      const vx = velEm(tl), andar = clamp(vx);
      const ajoelha = smooth(tTremer + 0.3, tTremer + 1.8, tl) * (1 - smooth(tLevantaras - 0.8, tLevantaras + 2.4, tl)) * 0.92;
      const olhar = Math.max(pulso(tOlhos, 1.2, 6, tl), 0.45 * win(tOlhos, tOlhos + 3, tChega - 6, tChega, tl), 0.7 * pulsos(tAlTira, 1, 4, tl), 0.8 * pulso(tMaoDir, 1, 4, tl), 0.7 * smooth(tChega - 2, tChega + 2, tl));
      const maos = Math.max(0.7 * win(tOlhos - 0.2, tOlhos + 1.2, tForca + 2, tForca + 3.5, tl), 0.4 * ajoelha);
      const bracos = Math.max(win(tComMao, tComMao + 1.5, tComMao + 9, tComMao + 11, tl) * 0.8, win(tChega + 2, tChega + 4, dur, dur + 1, tl) * 0.9);
      const dir = (tl > tCaminho - 0.2 && tl < tCaminho + 1.5) ? -1 : 1;
      const acesa = Math.max(0.35 * (1 - fear), smooth(tForca, tForca + 1.5, tl), pulso(tMaoDir, 1, 5, tl)) * (1 - 0.7 * ajoelha);
      const opc = {
        tipo: 'aldeao', cor: H('#c8d6f6'), barba: true, dir, andar: andar * (1 - ajoelha), fase: (S.rol / 92) * TAU, sentado: ajoelha, t: S.t, olhar, maos, bracos: bracos * (1 - ajoelha),
        inclina: 0.13 * fear * (1 - smooth(tOlhos, tOlhos + 1.5, tl)) - 0.03, segura: bracos > 0.4 ? 'lanterna' : 'lamparina', acesa,
      };
      PN.pessoa(ctx, TX, CY, 1.12, opc);
      // os que se juntam, com lanternas
      const s = smooth(tJuntam, tJuntam + 9, tl), todos = [];
      COMP.forEach((c, i) => {
        const e = ease.outCubic(smooth(tJuntam + i * 1.2, tJuntam + 8 + i * 1.2, tl)), x = lerp(-180, TX + c.dx, e);
        if (e < 0.01) return;
        const andarC = clamp(Math.abs(velEm(tl)) + (1 - e) * 1.0);
        const oc = { tipo: 'aldeao', cor: H(c.cor), dir: 1, andar: andarC, fase: ((S.rol + x) / 92) * TAU, t: S.t, segura: 'lanterna', acesa: 1, olhar: 0.3 + 0.5 * bracos, bracos: bracos * 0.9, sentado: 0 };
        if (c.veu) { oc.veu = true; oc.manto = H('#fff5e0'); }
        todos.push([x, oc, i]);
      });
      for (const [x, oc, i] of todos) PN.pessoa(ctx, x, CY + (i % 2) * 14 - 6, 1.0, oc);
      return s;
    }
    function ondaTerra(ctx, S) {
      for (const t0 of [tComigo, tForta[4], tJuntam, tComMao, tDestra]) {
        const u = (S.tl - t0 - 0.2) / 4.4;
        if (u < 0 || u > 1) continue;
        const r = 140 + 2300 * ease.outCubic(u);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = css(K.luzOuro, 0.3 * (1 - u)); ctx.lineWidth = 3 + 5 * (1 - u);
        ctx.beginPath(); ctx.ellipse(TX, SOLO + 22, r, r * 0.1, 0, 0, TAU); ctx.stroke(); ctx.restore();
      }
    }
    function amanhecer(ctx, S) {
      const p = Math.max(smooth(tJuntam + 8, tJuntam + 20, S.tl) * 0.5, pulso(tChega, 1.5, 6, S.tl), 0.6 * win(tComMao, tComMao + 2, dur, dur + 1, S.tl));
      if (p < 0.02 || !S.sol || S.sol.alt < -0.2) return;
      const x = S.sol.x, y = S.sol.y;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      brilhoRadial(ctx, x, y, 700 * (0.6 + 0.4 * p), K.luzOuro, 0.4 * p);
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * TAU, L = 900 * (0.4 + 0.6 * p), g = ctx.createLinearGradient(x, y, x + Math.cos(a) * L, y + Math.sin(a) * L);
        g.addColorStop(0, css(K.luz, 0.22 * p)); g.addColorStop(1, css(K.luzOuro, 0));
        ctx.strokeStyle = g; ctx.lineWidth = 8 + 6 * (i % 2); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); ctx.stroke();
      }
      ctx.restore();
    }
    function pomba(ctx, S, x, y, s, fase, rot, dir) {
      G.Personagens.pomba(ctx, S, x, y, s, { fase: S.t * 9 + fase, bate: Math.sin(S.t * 9 + fase), rot: rot || 0, dir: dir || 1 });
    }
    function pombas(ctx, S) {
      const t0 = tAlTira[17], u = (S.tl - t0) / 12;
      if (u < 0 || u > 1) return;
      for (let j = 0; j < 7; j++) {
        const v = clamp(u * 1.15 - j * 0.04), x = TX - 300 + 700 * hash1(j * 3.3) + 300 * v * (j % 2 ? 1 : -1) * 0.8, y = SOLO - 200 - 560 * ease.outCubic(v) + 20 * Math.sin(S.t * 2 + j);
        ctx.save(); ctx.globalAlpha *= Math.sin(Math.PI * Math.min(1, v)); pomba(ctx, S, x, y, 0.55 + 0.1 * hash1(j), j * 2, -0.3, j % 2 ? 1 : -1); ctx.restore();
      }
    }
    function vagalumes(ctx, S) {
      const f = S.noite * 0.9 * (1 - medoEm(S.tl));
      if (f < 0.05) return;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 34; i++) {
        const x = mod(hash1(i * 3.1) * S.W + Math.sin(S.t * 0.4 + i) * 40, S.W), y = SOLO - 20 - hash1(i * 5.3) * 360 + Math.sin(S.t * 0.8 + i * 2) * 18, tw = 0.5 + 0.5 * Math.sin(S.t * 1.8 + i * 3);
        brilhoRadial(ctx, x, y, 9, K.luzOuro, 0.5 * tw * f);
      }
      ctx.restore();
    }

    // ---------------------------------------------------------------- quadro
    function desenhar(ctx, S) {
      const tl = S.tl;
      S.hora = horaEm(tl); S.storm = medoEm(tl) * 0.8; S.ceu = ceuEm(S.hora); S.noite = noiteF(S.hora); S.rol = rolEm(tl);
      S.ceu = { top: ml(S.ceu.top, H('#858299'), 0.5 * S.storm), mid: ml(S.ceu.mid, H('#a29fb8'), 0.46 * S.storm), hor: ml(S.ceu.hor, H('#c9bfcc'), 0.36 * S.storm) };
      S.tomTexto = 1 - smooth(0.32, 0.62, Math.max(S.noite * 0.9, S.storm * 0.85));
      ceuFundo(ctx, S);
      estrelas(ctx, S);
      corpoCeleste(ctx, S);
      nuvens(ctx, S);
      medo(ctx, S);
      estrelasAbertas(ctx, S);
      amanhecer(ctx, S);
      serraR(ctx, S, MONT.longe);
      serraR(ctx, S, MONT.meio);
      montes(ctx, S);
      arvoresR(ctx, S);
      chao(ctx, S);
      relvaR(ctx, S);
      ondaTerra(ctx, S);
      cruzamento(ctx, S);
      arvoreForte(ctx, S);
      gloom(ctx, S);
      viajante(ctx, S);
      maoEOrbe(ctx, S);
      pombas(ctx, S);
      vagalumes(ctx, S);
    }

    return { espelho: false, estado: () => ({ fx: 0.5, calor: 0, peso: 0, nevoa: 0, vento: 0.2, solY: 400, solForca: 1, raios: 0, motes: 0, flash: 0 }), desenhar };
  }

  G.TemaIsaias = { criar };
})(window);
