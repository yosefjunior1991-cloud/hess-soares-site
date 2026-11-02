// Tema "Seja Forte e Corajoso" (Josué 1:9), criado do zero a partir da letra inteira (a imagem da música é só um fundo preto),
// para o vídeo final em 16:9. Um líder com um cajado conduz o povo (com bandeiras das tribos) pela madrugada: a névoa e o
// medo cobrem o caminho até que uma voz de luz o faz prosseguir; uma orbe de presença o acompanha. No refrão o rio se abre e
// o povo atravessa a seco; no meio do leito sobem as doze pedras do memorial. À noite, um acampamento com o fogo e a
// Palavra; depois a marcha até a muralha, o som do shofar, e a muralha cai em poeira e luz. O povo entra na cidade ao
// amanhecer e o dia se levanta em festa. Deus não é retratado: só luz. Os instantes saem do texto da legenda; os trechos
// que os disparam ficam em `animacao.json`, na pasta da música (`gatilhos`), e não neste repositório público.
(function (G) {
  'use strict';
  const { clamp, lerp, smooth, mod, css, rgb, hash1, mulberry32, ease } = G.U;
  const R91 = G.Seres91, PN = G.SeresPN, B = G.SeresBS, S2 = G.SeresS2, M = G.SeresM, I = G.SeresI, J = G.SeresJ, K = J.K, ml = R91.ml, brilhoRadial = R91.brilhoRadial, brilho4 = R91.brilho4;
  const ALT = 1080, TAU = Math.PI * 2;
  const SOLO = 0.885 * ALT;
  const HORSKY = 0.74 * ALT;
  const semNikud = (s) => s.normalize('NFD').replace(/[֑-ׇ]/g, '').replace(/[̀-ͯ]/g, '');
  const H = (hex) => rgb(hex);

  const PADRAO = {
    olhar: [13.28], caminho: [16.64], medo: [20.15], voz: [22.94], comigo: [27.25], presenca: [30.32], amanha: [34.11], guiara: [37.38],
    chazak: [40.73, 56.77, 70.57, 112.46, 156.5, 170.31, 173.74, 184.27], naotemas: [43.05, 59.96, 72.81, 114.77, 160.09], adonai: [47.99, 64.11, 119.77, 163.76, 177.33, 191.53],
    onde: [52.06, 67.46, 80.15, 123.95, 167.19], naotemerei: [77.03, 128.98, 141.98], noite: [86.05], naosouber: [89.24], palavra: [92.56], ensina: [95.47],
    naovoltar: [98.74], promessa: [102.25], deus: [105.52], vencer: [109.35], tuestas: [132.41, 144.61], naorecuarei: [135.68, 148.76], conduz: [138.55, 151.12], final: [208.23],
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
    const tOlhar = T('olhar'), tCaminho = T('caminho'), tMedo = T('medo'), tVoz = T('voz'), tComigo = T('comigo'), tPresenca = T('presenca'), tAmanha = T('amanha'), tGuiara = T('guiara');
    const tChazak = TT('chazak'), tNaoTemas = TT('naotemas'), tAdonai = TT('adonai'), tOnde = TT('onde'), tNaoTemerei = TT('naotemerei');
    const tNoite = T('noite'), tNaoSouber = T('naosouber'), tPalavra = T('palavra'), tEnsina = T('ensina'), tNaoVoltar = T('naovoltar'), tPromessa = T('promessa'), tDeus = T('deus'), tVencer = T('vencer');
    const tTuEstas = TT('tuestas'), tNaoRecuarei = TT('naorecuarei'), tConduz = TT('conduz'), tFinal = T('final');
    const win = (a, b, c, d, t) => smooth(a, b, t) * (1 - smooth(c, d, t));
    const pulso = (t0, sobe, desce, t) => win(t0 - 0.1, t0 + sobe, t0 + sobe + 0.5, t0 + sobe + desce, t);
    const pulsos = (arr, sobe, desce, t) => arr.reduce((m, t0) => Math.max(m, pulso(t0, sobe, desce, t)), 0);
    const tAbre = tNaoTemas[0], tPedras = tChazak[1], tFecha = tChazak[2] + 7, tCai = tVencer - 0.2;

    // ---------------------------------------------------------------- horas: madrugada, dia da travessia, noite do acampamento, o amanhecer da cidade e o dia em festa
    const HS = [
      [0, 5.0], [tOlhar, 5.3], [tVoz, 6.0], [tChazak[0], 7.0], [tPedras, 9.5], [tChazak[2], 12.5], [tNoite - 2, 17.2], [tNoite, 18.8], [tPalavra, 20.4], [tNaoVoltar, 22.0],
      [tDeus, 26.5], [tVencer, 28.6], [tChazak[3], 29.8], [tNaoTemerei[1], 31.5], [tChazak[4], 33.5], [tChazak[7] - 4, 35.5], [dur + 1, 38.0],
    ];
    const horaEm = (tl) => {
      let i = 0; while (i < HS.length - 2 && HS[i + 1][0] <= tl) i++;
      const [a, ha] = HS[i], [b, hb] = HS[i + 1];
      return lerp(ha, hb, clamp((tl - a) / Math.max(1e-6, b - a)));
    };
    const medoEm = (tl) => win(tMedo - 0.6, tMedo + 1.6, tVoz - 0.2, tVoz + 2.2, tl);                       // as nuvens do medo
    const nevoaEm = (tl) => win(tOlhar - 0.8, tOlhar + 1.5, tMedo + 1, tVoz + 3, tl);                       // a névoa de "não puder ver"
    const abreEm = (tl) => ease.inOutSine(smooth(tAbre, tAbre + 4.5, tl)) * (1 - ease.inOutSine(smooth(tFecha, tFecha + 4, tl)));

    // ---------------------------------------------------------------- a marcha: o mundo rola e o líder fica na tela
    const PASSO = 1 / 30, V = 105, TX = 640;
    const JAN = [
      [tOlhar - 1, tOlhar + 1, tChazak[0] - 0.8, tChazak[0] + 0.4, 0.5],
      [tAbre + 3.5, tAbre + 4.5, tPedras - 1, tPedras, 0.42],
      [tChazak[1] + 8, tChazak[1] + 9.5, tNoite - 1.5, tNoite, 0.9],
      [tNaoVoltar - 0.2, tNaoVoltar + 1.4, tDeus + 2.2, tDeus + 3.4, 0.9],
      [tChazak[3] - 0.8, tChazak[3] + 0.8, tTuEstas[0] - 2, tTuEstas[0] - 0.4, 0.85],
    ];
    const velEm = (t) => { let v = 0; for (const [a, b, c, d, m] of JAN) v = Math.max(v, win(a, b, c, d, t) * m); return v; };
    const nTab = Math.ceil(dur / PASSO) + 3, rolTab = new Float64Array(nTab);
    for (let i = 1; i < nTab; i++) rolTab[i] = rolTab[i - 1] + V * velEm((i - 1) * PASSO) * PASSO;
    const rolEm = (t) => { const x = clamp(t / PASSO, 0, nTab - 1.001), i = Math.floor(x); return lerp(rolTab[i], rolTab[i + 1], x - i); };
    const X_RIO = rolEm(tChazak[0]) + TX + 400, RIO_W = 280;
    const X_ACAMP = rolEm(tNoite) + TX + 300, X_JER = rolEm(tDeus + 1) + TX + 560;

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
      const c1 = luzObj(S, '#eadfc4', 1), c2 = luzObj(S, '#e2d8bb', 1), c3 = luzObj(S, '#cfd5b6', 1);
      const g = ctx.createLinearGradient(0, y0, 0, ALT);
      g.addColorStop(0, css(c1)); g.addColorStop(0.5, css(c2)); g.addColorStop(1, css(c3));
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-20, ALT + 20);
      for (let x = -20; x <= Wd + 20; x += 12) ctx.lineTo(x, borda(x));
      ctx.lineTo(Wd + 20, ALT + 20); ctx.closePath(); ctx.fill();
      ctx.fillStyle = css(luzObj(S, '#f3e8d2', 1), 0.7); ctx.fillRect(-40, SOLO + 6, Wd + 80, 58);
    }
    function relvaR(ctx, S) {
      const Wd = S.W, cam = S.rol, CEL = 34, c0 = Math.floor((cam - 40) / CEL), c1 = Math.floor((cam + Wd + 40) / CEL);
      for (let c = c0; c <= c1; c++) {
        const h1 = hash1(c * 2.13 + 3), h2 = hash1(c * 7.77 + 1), h3 = hash1(c * 4.9 + 9);
        const sx = c * CEL + h1 * CEL - cam, y0 = lerp(borda(sx) + 12, ALT - 12, h3 * h3);
        if (y0 > SOLO - 6 && y0 < SOLO + 70) continue;
        if (Math.abs(sx + cam - X_RIO) < RIO_W + 20) continue;
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
        if (hash1(c * 3.31 + 5) > 0.6) continue;
        const sx = c * CEL + hash1(c * 1.7) * CEL * 0.7 - cam, y = borda(sx) + 24 + hash1(c * 2.9) * 20;
        const r = hash1(c * 4.4);
        if (r < 0.4) PN.palmeira(ctx, sx, y, 0.5 + 0.2 * hash1(c), { t: S.t }); else if (r < 0.7) PN.cipreste(ctx, sx, y, 0.55 + 0.2 * hash1(c)); else PN.oliveira(ctx, sx, y, 0.5 + 0.25 * hash1(c), { t: S.t });
      }
    }

    // ---------------------------------------------------------------- o rio que se abre
    function rio(ctx, S) {
      const xc = X_RIO - S.rol;
      if (xc + RIO_W < -60 || xc - RIO_W > S.W + 60) return;
      const p = abreEm(S.tl), g = 215 * p, tint = tintF(S);
      const topo = (x) => borda(x) + 4;
      const seg = (a, b) => {
        if (b - a < 2) return;
        const gr = ctx.createLinearGradient(0, borda(a), 0, ALT);
        gr.addColorStop(0, css(tint(H('#bfe6ef'), 1))); gr.addColorStop(0.5, css(tint(H('#9fd3e0'), 1))); gr.addColorStop(1, css(tint(H('#8cc6d8'), 1)));
        ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(a, ALT + 20);
        for (let x = a; x <= b; x += 8) ctx.lineTo(x, topo(x));
        ctx.lineTo(b, ALT + 20); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = css(K.aguaClara, 0.55); ctx.lineWidth = 2; ctx.lineCap = 'round';
        for (let k = 0; k < 16; k++) {
          const lx = a + mod(hash1(k * 3.7) * (b - a) + S.t * (10 + 14 * hash1(k)), b - a), ly = lerp(topo(lx) + 18, ALT - 30, hash1(k * 5.9)), w = 18 + 26 * hash1(k * 2.1);
          if (lx + w > b) continue;
          ctx.beginPath(); ctx.moveTo(lx, ly); ctx.quadraticCurveTo(lx + w / 2, ly - 4, lx + w, ly); ctx.stroke();
        }
      };
      seg(xc - RIO_W, xc - g); seg(xc + g, xc + RIO_W);
      if (p > 0.02) {                                                              // o leito seco e as paredes de água
        const gr = ctx.createLinearGradient(0, borda(xc), 0, ALT);
        gr.addColorStop(0, css(tint(K.areiaRio, 1))); gr.addColorStop(1, css(tint(K.areiaRioEsc, 1)));
        ctx.fillStyle = gr; ctx.fillRect(xc - g, topo(xc) - 2, 2 * g, ALT - topo(xc) + 20);
        for (const lado of [-1, 1]) {
          const wx = xc + lado * g, h = 400 * p, w = 84, y0 = topo(wx) - h;
          const gw = ctx.createLinearGradient(0, y0, 0, topo(wx) + 14);
          gw.addColorStop(0, css(tint(H('#cdeef4'), 1), 0.3)); gw.addColorStop(0.4, css(tint(H('#aedbe6'), 1), 0.72)); gw.addColorStop(1, css(tint(H('#8cc6d8'), 1), 0.9));
          ctx.fillStyle = gw; ctx.beginPath(); ctx.moveTo(wx - lado * w, topo(wx) + 14);
          for (let k = 0; k <= 12; k++) { const u = k / 12; ctx.lineTo(wx - lado * w + lado * w * u, y0 + Math.sin(S.t * 2 + u * 7 + lado) * 9 * p + (1 - Math.sin(Math.PI * u * 0.5)) * 46); }
          ctx.lineTo(wx, topo(wx) + 14); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = css(K.luz, 0.4 * p); ctx.lineWidth = 2.4; ctx.lineCap = 'round';
          for (let k = 0; k < 7; k++) { const yy = y0 + 70 + k * (h - 90) / 6, xx = wx - lado * (w * 0.2 + (k % 3) * 18); ctx.beginPath(); ctx.moveTo(xx, yy); ctx.quadraticCurveTo(xx + lado * 14, yy + 18, xx, yy + 36); ctx.stroke(); }
          ctx.fillStyle = css(K.luz, 0.55 * p);
          for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(wx - lado * (8 + 10 * k), y0 + 34 + 10 * Math.sin(S.t * 2 + k), 6 + 2 * hash1(k), 0, TAU); ctx.fill(); }
        }
      }
    }
    function pedrasDoMemorial(ctx, S) {
      const x = X_RIO - S.rol;
      if (x < -200 || x > S.W + 200) return;
      const n = clamp((S.tl - tPedras) / 1.15, 0, 12);
      J.pedras12(ctx, x, SOLO + 40, 1.0, n, S.t);
    }

    // ---------------------------------------------------------------- feixe do céu, nuvens do medo, névoa
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
    const rT = mulberry32(51);
    const TEMP = Array.from({ length: 8 }, (_, i) => ({ x0: rT() * (W + 600), y: 80 + rT() * 260, s: 1.2 + rT() * 0.9, v: 8 + rT() * 8, sem: i }));
    function medo(ctx, S) {
      const m = medoEm(S.tl);
      if (m < 0.02) return;
      const per = S.W + 700;
      for (const c of TEMP) S2.nuvemTempestade(ctx, mod(c.x0 + S.t * c.v, per) - 350, c.y + 18 * Math.sin(S.t * 0.2 + c.sem), c.s, m * 0.85, c.sem);
    }
    function gloom(ctx, S) {
      const m = medoEm(S.tl);
      if (m > 0.02) { ctx.fillStyle = css(H('#4f4c70'), 0.22 * m); ctx.fillRect(-40, -40, S.W + 80, ALT + 80); }
    }
    function nevoa(ctx, S) {
      const n = nevoaEm(S.tl);
      if (n < 0.02) return;
      ctx.save();
      for (let i = 0; i < 7; i++) {
        const x = mod(hash1(i * 3.7) * (S.W + 600) + S.t * (5 + 3 * hash1(i)), S.W + 600) - 300, y = SOLO - 40 - 150 * hash1(i * 5.1), g = ctx.createRadialGradient(x, y, 0, x, y, 420);
        g.addColorStop(0, css(K.luz, 0.5 * n)); g.addColorStop(1, css(K.luz, 0));
        ctx.fillStyle = g; ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.38); ctx.translate(-x, -y); ctx.fillRect(x - 420, y - 420, 840, 840); ctx.restore();
      }
      ctx.restore();
    }
    function voz(ctx, S) {
      const u = (S.tl - tVoz) / 5, ev = [tVoz, tAmanha];
      for (const t0 of ev) {
        const v = (S.tl - t0) / 4.5;
        if (v < 0 || v > 1) continue;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 3; k++) { const w = clamp(v - k * 0.12); if (w <= 0) continue; ctx.strokeStyle = css(K.luzOuro, 0.4 * (1 - w)); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(TX + 120, 70, 60 + 700 * w, 0.25, Math.PI - 0.25); ctx.stroke(); }
        ctx.restore();
      }
      return u;
    }

    // ---------------------------------------------------------------- acampamento, muralha, cidade
    function acampamento(ctx, S) {
      const x = X_ACAMP - S.rol;
      if (x < -500 || x > S.W + 500) return;
      for (const [dx, sc] of [[-260, 0.8], [260, 0.9], [420, 0.7]]) R91.tenda(ctx, x + dx, SOLO - 22, sc, 0.5 + 0.4 * S.noite);
      B.fogueira(ctx, x, SOLO + 20, 1.15, { forca: 0.4 * smooth(tNoite - 3, tNoite, S.tl) * (1 - smooth(tNaoVoltar - 1, tNaoVoltar + 1.5, S.tl)), t: S.t });
      const p = win(tPalavra - 0.5, tPalavra + 1.8, tEnsina + 4.5, tEnsina + 7, S.tl);
      if (p > 0.02) M.emblema(ctx, 0, x + 20, SOLO - 250 + 8 * Math.sin(S.t * 1.3), 1.1, p, S.t);
    }
    function cidade(ctx, S) {
      const x = X_JER - S.rol;
      if (x < -900 || x > S.W + 900) return;
      const tint = tintF(S);
      for (const [dx, w, h] of [[420, 190, 150], [640, 170, 190], [850, 200, 160], [1070, 180, 175]]) PN.casa(ctx, x + dx, SOLO - 6, 0.9, { w, h, cor: H('#f6e8d4'), luz: S.noite * 0.8, t: S.t });
      const q = ease.inOutSine(smooth(tCai, tCai + 2.6, S.tl));
      J.muralha(ctx, x, SOLO + 2, 1.0, { queda: q, tint, t: S.t });
    }

    // ---------------------------------------------------------------- o povo
    const COR = ['#f4c8b0', '#f9e1a0', '#c9e6d4', '#f2c6e0', '#d9ccf2', '#f7d9b0', '#bfe3ea'];
    const BANDS = ['#e9b6c6', '#bfc9ee', '#f0d29a', '#c4ebcb', '#d3c4f2', '#f6b8c4'];
    const CY = SOLO + 12;
    function povo(ctx, S) {
      const tl = S.tl, andar = clamp(velEm(tl));
      const sent = win(tNoite - 0.3, tNoite + 1.8, tNaoVoltar - 0.6, tNaoVoltar + 0.8, tl) * 0.9;
      const alegria = Math.max(win(tChazak[3] - 0.3, tChazak[3] + 1.2, tTuEstas[0] - 2.5, tTuEstas[0] - 1, tl), win(tChazak[4] - 0.3, tChazak[4] + 1.2, dur, dur + 1, tl)) * 0.9;
      const noiteL = S.noite > 0.45, fear = medoEm(tl);
      const sopra = win(tDeus - 4.4, tDeus - 3.2, tVencer - 0.4, tVencer + 0.4, tl);
      // seguidores, de trás para a frente
      for (let i = 6; i >= 0; i--) {
        const x = TX - 88 * (i + 1) - (i % 2) * 8, y = CY + (i % 3) * 6 - 6;
        const opc = { tipo: 'aldeao', cor: H(COR[i % COR.length]), dir: 1, andar: andar * (1 - sent), fase: ((S.rol + 17 * i) / 92) * TAU, sentado: sent, t: S.t, olhar: 0.25 + 0.5 * alegria + 0.5 * pulsos(tChazak, 1, 4, tl), bracos: alegria * (0.5 + 0.5 * Math.sin(S.t * 3 + i)), inclina: 0.1 * fear * (1 - sent), barba: i % 2 === 0 };
        if (i % 3 === 1) { opc.veu = true; opc.manto = H('#fff5e0'); }
        if (noiteL || fear > 0.3) { opc.segura = 'lanterna'; opc.acesa = clamp(S.noite * 1.4 - 0.1 + fear); }
        PN.pessoa(ctx, x, y, 1.0, opc);
        if (i === 2 && sopra > 0.05) J.shofar(ctx, x + 18, y - 160, 0.55, { alfa: sopra, som: sopra * (0.6 + 0.4 * Math.sin(S.t * 3)), t: S.t, rot: -0.5 });
        if (i === 5 && sopra > 0.05) J.shofar(ctx, x + 18, y - 160, 0.55, { alfa: sopra, som: sopra * (0.6 + 0.4 * Math.sin(S.t * 3 + 1)), t: S.t, rot: -0.5 });
        if (i % 2 === 1) {                                                        // as bandeiras das tribos
          const ba = smooth(tChazak[0] - 0.5, tChazak[0] + 1.2, tl) * (1 - sent * 0.8);
          if (ba > 0.02) S2.bandeira(ctx, x + 26, y + 2, 0.62, { alfa: ba, t: S.t, vento: 0.3 + 0.2 * alegria, cor: H(BANDS[i % BANDS.length]) });
        }
      }
      // o líder, com o cajado erguido no refrão
      const ergue = Math.max(pulsos(tChazak, 0.8, 3.5, tl), 0.5 * alegria);
      const olhar = Math.max(0.45 * smooth(tVoz, tVoz + 2, tl), pulsos(tChazak, 1, 4, tl), 0.6 * pulso(tVencer, 1, 4, tl), alegria);
      const opcL = {
        tipo: 'aldeao', cor: H('#c8d6f6'), barba: true, dir: 1, andar: andar * (1 - sent), fase: (S.rol / 92) * TAU, sentado: sent, t: S.t, olhar, bracos: ergue * 0.75 * (1 - sent),
        inclina: 0.12 * fear * (1 - sent) + 0.06 * nevoaEm(tl) - 0.02, segura: noiteL ? 'lanterna' : null, acesa: clamp(S.noite * 1.3),
      };
      PN.pessoa(ctx, TX, CY, 1.12, opcL);
      const cx = TX + 36, cy = CY - 4 - 36 * ergue;
      M.cajado(ctx, cx, cy, 1.1, 0.04 - 0.1 * ergue);
      if (ergue > 0.05) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; brilhoRadial(ctx, cx - 18, cy - 190, 70, K.luzOuro, 0.6 * ergue); ctx.restore(); }
      // a orbe de presença e o feixe sobre o líder
      const aO = smooth(tComigo - 0.4, tComigo + 2, tl);
      if (aO > 0.01) {
        const ox = TX + 120 + 10 * Math.sin(S.t * 1.1), oy = CY - 260 + 12 * Math.sin(S.t * 1.7);
        I.orbe(ctx, ox, oy, 1.0, { alfa: aO, brilho: Math.max(pulso(tComigo, 1, 4, tl), pulso(tPresenca, 1, 4, tl), pulsos(tTuEstas, 1, 4, tl)), t: S.t });
        facho(ctx, ox, oy, TX + 6, CY - 150, 6, 24, 0.12 * aO, 0.8);
      }
      const af = Math.max(pulsos(tAdonai, 1, 5, tl), pulso(tFinal, 1, 8, tl), pulso(tChazak[7], 1, 6, tl));
      if (af > 0.02) facho(ctx, TX + 160, -60, TX, CY - 200, 40, 150, 0.22 * af, 0.7);
    }
    function ondaTerra(ctx, S) {
      for (const t0 of [...tChazak, ...tAdonai.slice(1), ...tNaoRecuarei, tVencer]) {
        const u = (S.tl - t0 - 0.2) / 4.4;
        if (u < 0 || u > 1) continue;
        const r = 140 + 2300 * ease.outCubic(u);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = css(K.luzOuro, 0.3 * (1 - u)); ctx.lineWidth = 3 + 5 * (1 - u);
        ctx.beginPath(); ctx.ellipse(TX, SOLO + 22, r, r * 0.1, 0, 0, TAU); ctx.stroke(); ctx.restore();
      }
    }
    function amanhecer(ctx, S) {
      const p = Math.max(pulso(tVencer, 1.5, 6, S.tl), 0.5 * win(tChazak[3], tChazak[3] + 3, tTuEstas[0], tTuEstas[0] + 2, S.tl), 0.5 * smooth(tChazak[7] - 3, tChazak[7] + 3, S.tl));
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
    function pombasEPetalas(ctx, S) {
      const t0 = tChazak[7] - 1, u = (S.tl - t0) / 12;
      if (u >= 0 && u <= 1) {
        for (let j = 0; j < 7; j++) {
          const v = clamp(u * 1.15 - j * 0.04), x = TX - 300 + 700 * hash1(j * 3.3) + 300 * v * (j % 2 ? 1 : -1) * 0.8, y = SOLO - 200 - 560 * ease.outCubic(v) + 20 * Math.sin(S.t * 2 + j);
          ctx.save(); ctx.globalAlpha *= Math.sin(Math.PI * Math.min(1, v)); pomba(ctx, S, x, y, 0.55 + 0.1 * hash1(j), j * 2, -0.3, j % 2 ? 1 : -1); ctx.restore();
        }
      }
      const cores = [K.rosa, K.luzOuro, K.lilas, K.luz];
      for (const [tp, d] of [[tChazak[4], 7], [tChazak[7], 9]]) {
        const v = (S.tl - tp) / d;
        if (v < 0 || v > 1) continue;
        for (let j = 0; j < 34; j++) {
          const w = clamp(v * 1.2 - hash1(j * 2.3) * 0.2), x = TX - 500 + hash1(j * 7.7 + tp) * 1240 + Math.sin(w * 5 + j) * 28, y = SOLO - 640 + w * 760;
          ctx.fillStyle = css(cores[j % 4], Math.sin(Math.PI * w) * 0.9); ctx.beginPath(); ctx.ellipse(x, y, 6, 3.4, S.t * 2 + j, 0, TAU); ctx.fill();
        }
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
      amanhecer(ctx, S);
      serraR(ctx, S, MONT.longe);
      serraR(ctx, S, MONT.meio);
      arvoresR(ctx, S);
      chao(ctx, S);
      relvaR(ctx, S);
      rio(ctx, S);
      cidade(ctx, S);
      acampamento(ctx, S);
      pedrasDoMemorial(ctx, S);
      ondaTerra(ctx, S);
      voz(ctx, S);
      nevoa(ctx, S);
      gloom(ctx, S);
      povo(ctx, S);
      pombasEPetalas(ctx, S);
      vagalumes(ctx, S);
    }

    return { espelho: false, estado: () => ({ fx: 0.5, calor: 0, peso: 0, nevoa: 0, vento: 0.2, solY: 400, solForca: 1, raios: 0, motes: 0, flash: 0 }), desenhar };
  }

  G.TemaJosue = { criar };
})(window);
