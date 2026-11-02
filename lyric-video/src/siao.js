// Tema "De Sião Sairá a Torá" (Isaías 2:2-4), criado do zero a partir da letra inteira (a imagem da música é só um fundo preto),
// para o vídeo final em 16:9. Um líder conduz um povo que cresce com os que chegam de todas as nações, caminhando rumo ao monte
// da Casa de Adonai, que se ergue acima dos montes; a subida termina no templo, com o rolo de luz da Torá no céu. Depois, no vale,
// as espadas viram arados e as lanças viram podões, a paz se espalha sobre a terra e, ao entardecer e à noite, a luz da Palavra
// ilumina as aldeias. Deus não é retratado: só luz. Os instantes saem do texto da legenda; os trechos que os disparam ficam em
// `animacao.json`, na pasta da música (`gatilhos`), e não neste repositório público.
(function (G) {
  'use strict';
  const { clamp, lerp, smooth, mod, css, rgb, hash1, mulberry32, ease } = G.U;
  const R91 = G.Seres91, PN = G.SeresPN, B = G.SeresBS, S2 = G.SeresS2, M = G.SeresM, I = G.SeresI, J = G.SeresJ, Z = G.SeresZ, K = J.K, ml = R91.ml, brilhoRadial = R91.brilhoRadial, brilho4 = R91.brilho4;
  const ALT = 1080, TAU = Math.PI * 2;
  const SOLO = 0.885 * ALT;
  const HORSKY = 0.74 * ALT;
  const semNikud = (s) => s.normalize('NFD').replace(/[֑-ׇ]/g, '').replace(/[̀-ͯ]/g, '');
  const H = (hex) => rgb(hex);

  const PADRAO = {
    sion: [13.88, 84.97, 88.56, 155.9, 159.41, 213.11, 216.78, 245.11], udevar: [17.63, 91.44, 94.95, 162.29, 165.88, 219.41, 223.25],
    ultimos: [29.36], monte: [34.63], acima: [41.65], povos: [45.08], nacoes: [47.63], subir: [52.82], deusjaco: [56.73], ensina: [59.6],
    vemsubir: [63.59], vemaprender: [67.18], vida: [69.73], palavra: [72.45], veyorenu: [76.12], venelcha: [79.15],
    desiao: [98.86, 102.37, 168.99, 173.46, 227.23, 229.63], palavrade: [105.88, 176.97, 234.25], jer: [108.91, 180.08, 237.45],
    julgara: [127.1], decidira: [130.61], espadas: [134.12], lancas: [137.71], nacao: [140.98], guerra: [145.05], paz: [148.16], estab: [151.44],
    loyisa: [185.9], velo: [189.25], havera: [193.25, 196.75, 199.07], entre: [203.94],
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
    const tSion = TT('sion'), tJer = TT('jer'), tHavera = TT('havera');
    const tUlt = T('ultimos'), tMonte = T('monte'), tAcima = T('acima'), tPovos = T('povos'), tNacoes = T('nacoes'), tSubir = T('subir'), tVemSubir = T('vemsubir'), tVey = T('veyorenu');
    const tJulga = T('julgara'), tDecide = T('decidira'), tEspadas = T('espadas'), tLancas = T('lancas'), tNacao = T('nacao'), tPaz = T('paz'), tLo = T('loyisa'), tEntre = T('entre');
    const tChor1 = tSion[1], tFim1 = tJer[0] + 10, tChor2 = tSion[3], tChor3 = tSion[5], tFinal = tSion[7];
    const win = (a, b, c, d, t) => smooth(a, b, t) * (1 - smooth(c, d, t));
    const pulso = (t0, sobe, desce, t) => win(t0 - 0.1, t0 + sobe, t0 + sobe + 0.5, t0 + sobe + desce, t);
    const pulsos = (arr, sobe, desce, t) => arr.reduce((m, t0) => Math.max(m, pulso(t0, sobe, desce, t)), 0);

    // ---------------------------------------------------------------- horas: madrugada, manhã, meio-dia no templo, tarde na paz, pôr do sol e noite de luzes
    const HS = [
      [0, 5.0], [tSion[0], 5.4], [tUlt, 6.3], [tAcima, 7.6], [tSubir, 9.0], [tChor1, 11.0], [tJer[0], 12.6], [tJulga, 14.0], [tEspadas, 15.0], [tPaz, 16.0],
      [tChor2, 16.8], [tLo, 17.7], [tEntre, 18.5], [tChor3, 19.1], [tFinal - 8, 20.5], [dur + 1, 21.3],
    ];
    const horaEm = (tl) => {
      let i = 0; while (i < HS.length - 2 && HS[i + 1][0] <= tl) i++;
      const [a, ha] = HS[i], [b, hb] = HS[i + 1];
      return lerp(ha, hb, clamp((tl - a) / Math.max(1e-6, b - a)));
    };

    // ---------------------------------------------------------------- a marcha: o mundo rola sempre (nunca parado) e o povo cresce
    const PASSO = 1 / 30, V = 105, TX = 640;
    const KN = [[0, 0.3], [tSion[0] - 2, 0.3], [tSion[0] + 4, 0.38], [tPovos - 1, 0.45], [tNacoes + 3, 0.8], [tVemSubir, 0.62], [tChor1 - 6, 0.55], [tChor1, 0.4],
      [tJer[0] - 6, 0.35], [tJer[0] + 10, 0.45], [tJulga, 0.5], [tEspadas - 4, 0.3], [tLancas + 3, 0.28], [tNacao + 2, 0.5], [tPaz, 0.5], [tChor2, 0.45],
      [tLo, 0.4], [tHavera[0], 0.3], [tEntre, 0.3], [tChor3, 0.42], [dur + 2, 0.38]].filter((k, i, a) => i === 0 || k[0] > a[i - 1][0]);
    const velEm = (t) => {
      if (t <= KN[0][0]) return KN[0][1];
      for (let i = 0; i < KN.length - 1; i++) if (t < KN[i + 1][0]) return lerp(KN[i][1], KN[i + 1][1], smooth(KN[i][0], KN[i + 1][0], t));
      return KN[KN.length - 1][1];
    };
    const nTab = Math.ceil(dur / PASSO) + 3, rolTab = new Float64Array(nTab);
    for (let i = 1; i < nTab; i++) rolTab[i] = rolTab[i - 1] + V * velEm((i - 1) * PASSO) * PASSO;
    const rolEm = (t) => { const x = clamp(t / PASSO, 0, nTab - 1.001), i = Math.floor(x); return lerp(rolTab[i], rolTab[i + 1], x - i); };
    // a subida do monte (inclinação do chão) e a descida suave depois do templo
    const ANG = [[0, 0], [tSubir - 3, 0], [tSubir + 5, 0.12], [tChor1 - 7, 0.12], [tChor1 - 1, 0], [tFim1, 0], [tFim1 + 5, -0.04], [tJulga + 2, 0]].filter((k, i, a) => i === 0 || k[0] > a[i - 1][0]);
    const angEm = (t) => {
      if (t <= ANG[0][0]) return ANG[0][1];
      for (let i = 0; i < ANG.length - 1; i++) if (t < ANG[i + 1][0]) return lerp(ANG[i][1], ANG[i + 1][1], smooth(ANG[i][0], ANG[i + 1][0], t));
      return ANG[ANG.length - 1][1];
    };
    const TXK = [[0, 640], [tLo, 640], [tLo + 8, 540], [tChor3 - 4, 780], [tChor3 + 16, 1000], [dur - 16, 1040], [dur + 1, 1500]].filter((k, i, a) => i === 0 || k[0] > a[i - 1][0]);
    const txEm = (t) => {
      if (t <= TXK[0][0]) return TXK[0][1];
      for (let i = 0; i < TXK.length - 1; i++) if (t < TXK[i + 1][0]) return lerp(TXK[i][1], TXK[i + 1][1], smooth(TXK[i][0], TXK[i + 1][0], t));
      return TXK[TXK.length - 1][1];
    };
    const X_TEMPLO = rolEm(tJer[0] - 2) + TX, X_FORJA = rolEm(tEspadas + 1.5) + TX + 880;

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

    // ---------------------------------------------------------------- feixe de luz em fatias que se apagam (sem borda dura)
    function facho(ctx, x0, y0, x1, y1, w0, w1, al, fim) {
      if (al < 0.003) return;
      const ang = Math.atan2(x1 - x0, y1 - y0), L = Math.hypot(x1 - x0, y1 - y0), N = 28;
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
    const tUdevar = TT('udevar');
    const brilhoSion = (tl) => Math.max(pulsos(tSion, 1, 4, tl), 0.7 * pulsos(tUdevar, 1, 4, tl));

    // ---------------------------------------------------------------- o monte de Sião ao longe: ergue-se, cresce com a aproximação, e fica para trás
    const ZK = [[0, 0.74, 0.55, 0.35, 1], [tMonte - 1, 0.74, 0.55, 0.35, 1], [tAcima, 0.72, 0.62, 1, 1], [tPovos + 10, 0.68, 0.75, 1, 1], [tSubir + 14, 0.64, 0.95, 1, 1],
      [tVey - 6, 0.6, 1.15, 1, 1], [tVey + 2, 0.58, 1.25, 1, 0], [tFim1, 0.16, 0.5, 1, 0], [tFim1 + 6, 0.14, 0.5, 1, 1], [tChor3, 0.07, 0.34, 1, 1], [dur + 2, 0.05, 0.3, 1, 1]]
      .filter((k, i, a) => i === 0 || k[0] > a[i - 1][0]);
    const zkEm = (t) => {
      let i = 0; while (i < ZK.length - 2 && ZK[i + 1][0] <= t) i++;
      const a = ZK[i], b = ZK[i + 1], f = smooth(a[0], b[0], t);
      return { px: lerp(a[1], b[1], f), sc: lerp(a[2], b[2], f), hz: lerp(a[3], b[3], ease.inOutSine(clamp((t - a[0]) / Math.max(1e-6, b[0] - a[0])))), a: lerp(a[4], b[4], f) };
    };
    function zion(ctx, S) {
      const k = zkEm(S.tl);
      if (k.a < 0.02) return;
      const Hm = 330 * k.hz, br = brilhoSion(S.tl);
      ctx.save(); ctx.globalAlpha *= k.a; ctx.translate(k.px * S.W, HORSKY + 40); ctx.scale(k.sc, k.sc);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; brilhoRadial(ctx, 0, -Hm - 60, 520, K.luzOuro, 0.2 + 0.3 * br + 0.2 * S.noite); ctx.restore();
      const g = ctx.createLinearGradient(0, -Hm, 0, 10);
      g.addColorStop(0, css(luzObj(S, '#e4def4', 0.7))); g.addColorStop(0.6, css(luzObj(S, '#cfc8ea', 0.75))); g.addColorStop(1, css(luzObj(S, '#bdb6df', 0.8), 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-780, 10); ctx.bezierCurveTo(-560, -Hm * 0.2, -420, -Hm * 0.75, -300, -Hm); ctx.lineTo(300, -Hm * 0.97);
      ctx.bezierCurveTo(430, -Hm * 0.7, 600, -Hm * 0.2, 800, 10); ctx.closePath(); ctx.fill();
      const gs = ctx.createLinearGradient(0, -Hm, 0, 10); gs.addColorStop(0, css(luzObj(S, '#8f86b8', 0.6), 0.2)); gs.addColorStop(1, css(luzObj(S, '#8f86b8', 0.6), 0));
      ctx.fillStyle = gs; ctx.beginPath(); ctx.moveTo(60, -Hm * 0.97); ctx.lineTo(300, -Hm * 0.97); ctx.bezierCurveTo(430, -Hm * 0.7, 600, -Hm * 0.2, 800, 10); ctx.lineTo(120, 10); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = css(luzObj(S, '#cfc7ea', 0.6), 0.7); ctx.lineWidth = 3;
      for (const f of [0.3, 0.52, 0.74]) { ctx.beginPath(); ctx.moveTo(-460 * (1.2 - f), -Hm * f); ctx.quadraticCurveTo(0, -Hm * f - 16, 470 * (1.2 - f), -Hm * f); ctx.stroke(); }
      const wall = luzObj(S, '#f4e8d6', 0.5);                                    // a cidade no alto: muralha, casas e o templo
      ctx.fillStyle = css(wall); ctx.fillRect(-300, -Hm - 30, 600, 34);
      for (let x = -280; x < 300; x += 46) { ctx.fillStyle = css(luzObj(S, '#f9eedc', 0.5)); ctx.fillRect(x, -Hm - 46, 22, 18); }
      for (const [hx, hw, hh] of [[-230, 70, 48], [-150, 60, 64], [170, 70, 52], [250, 50, 42]]) { ctx.fillStyle = css(luzObj(S, '#f6ead8', 0.5)); ctx.fillRect(hx - hw / 2, -Hm - 30 - hh, hw, hh); ctx.fillStyle = css(luzObj(S, '#e3cde9', 0.5)); ctx.fillRect(hx - hw / 2 - 3, -Hm - 34 - hh, hw + 6, 6); }
      PN.templo(ctx, 10, -Hm - 24, 0.4, { t: S.t, brilho: br, noite: S.noite });
      for (const [tx, ty, th] of [[-480, -Hm * 0.32, 34], [-410, -Hm * 0.5, 40], [420, -Hm * 0.38, 36], [500, -Hm * 0.2, 30]]) { ctx.fillStyle = css(luzObj(S, '#b9dccb', 0.7)); ctx.beginPath(); ctx.ellipse(tx, ty - th / 2, 7, th / 2, 0, 0, TAU); ctx.fill(); }
      ctx.restore();
    }

    // ---------------------------------------------------------------- o rolo de luz da Torá e os raios que descem sobre a terra
    const RW = [[tSion[0] - 0.6, tUlt + 0.8, 'z'], [tChor1, tFim1, 't'], [tChor2, tLo + 0.5, 'c'], [tChor3, dur - 1.5, 'f']];
    function rolos(ctx, S) {
      for (const [t0, t1, modo] of RW) {
        const a = win(t0, t0 + 1.8, t1 - 2, t1, S.tl);
        if (a < 0.02) continue;
        const br = brilhoSion(S.tl), ab = smooth(t0, t0 + 3, S.tl);
        let x, y = 570, s = 0.8;
        if (modo === 'z') x = zkEm(S.tl).px * S.W;
        else if (modo === 't') { x = S.W * 0.82; s = 0.95; }
        else if (modo === 'c') { x = S.W * 0.8; s = 0.85; }
        else { x = S.W * 0.8; s = 1.0; }
        const nR = modo === 'f' ? 9 : 5;
        for (let i = 0; i < nR; i++) facho(ctx, x, y + 70, x + (i - (nR - 1) / 2) * (modo === 'z' ? 120 : 230), SOLO + 30, 5, 34, (0.1 + 0.1 * br) * a * (modo === 'z' ? 0.8 : 1), 0.6);
        Z.rolo(ctx, x, y, s, { alfa: a, abre: ab, brilho: br * 0.8 + (modo === 'f' ? 0.4 : 0), t: S.t });
      }
    }

    // ---------------------------------------------------------------- chão (inclinado na subida), relva, árvores, casas
    function chao(ctx, S) {
      const Wd = S.W, y0 = 0.80 * ALT;
      const c1 = luzObj(S, '#eadfc4', 1), c2 = luzObj(S, '#e2d8bb', 1), c3 = luzObj(S, '#cfd5b6', 1);
      const g = ctx.createLinearGradient(0, y0, 0, ALT);
      g.addColorStop(0, css(c1)); g.addColorStop(0.5, css(c2)); g.addColorStop(1, css(c3));
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-800, ALT + 800);
      for (let x = -800; x <= Wd + 800; x += 16) ctx.lineTo(x, borda(x));
      ctx.lineTo(Wd + 800, ALT + 800); ctx.closePath(); ctx.fill();
      ctx.fillStyle = css(luzObj(S, '#f3e8d2', 1), 0.7); ctx.fillRect(-800, SOLO + 6, Wd + 1600, 58);
      const st = smooth(0.02, 0.1, Math.abs(S.ang));                              // degraus na subida
      if (st > 0.01) {
        ctx.fillStyle = css(luzObj(S, '#d9ccb2', 1), 0.55 * st);
        for (let sx = -800 - mod(S.rol, 60); sx < Wd + 800; sx += 60) ctx.fillRect(sx, SOLO + 6, 5, 58);
      }
    }
    function relvaR(ctx, S) {
      const Wd = S.W, cam = S.rol, CEL = 34, c0 = Math.floor((cam - 700) / CEL), c1 = Math.floor((cam + Wd + 700) / CEL);
      const paz = smooth(tPaz, tPaz + 8, S.tl), flores = [K.rosa, K.luzOuro, K.lilas, K.luz];
      for (let c = c0; c <= c1; c++) {
        const h1 = hash1(c * 2.13 + 3), h2 = hash1(c * 7.77 + 1), h3 = hash1(c * 4.9 + 9);
        const sx = c * CEL + h1 * CEL - cam, y0 = lerp(borda(sx) + 12, ALT - 12, h3 * h3);
        if (y0 > SOLO - 6 && y0 < SOLO + 70) continue;
        const n = 2 + Math.floor(h1 * 3), esc = (0.55 + 0.9 * h3) * (1 + 0.5 * paz);
        ctx.lineCap = 'round';
        for (let i = 0; i < n; i++) {
          const alt = (10 + hash1(c * 3.3 + i) * 18) * esc, lean = (i - (n - 1) / 2) * 5 * esc + Math.sin(S.t * 1.3 + c * 0.7 + i) * 2.5 * (alt / 26);
          ctx.strokeStyle = css(luzObj(S, i % 2 ? '#b7ceae' : '#cfd9b4', 0.9)); ctx.lineWidth = 2.3 * esc;
          ctx.beginPath(); ctx.moveTo(sx + (i - n / 2) * 3 * esc, y0); ctx.quadraticCurveTo(sx + lean * 0.5, y0 - alt * 0.6, sx + lean, y0 - alt); ctx.stroke();
        }
        if (paz > 0.03 && h2 < 0.55) { ctx.fillStyle = css(flores[c & 3], 0.9 * paz); ctx.beginPath(); ctx.arc(sx + 4, y0 - 16 * esc, 3.2, 0, TAU); ctx.fill(); }
        if (h2 > 0.93) B.rocha(ctx, sx, y0 + 10, 0.8 + h3, c);
      }
    }
    function arvoresR(ctx, S) {
      const Wd = S.W, cam = S.rol * 0.5, CEL = 260;
      for (let c = Math.floor((cam - 700) / CEL); c <= Math.floor((cam + Wd + 700) / CEL); c++) {
        if (hash1(c * 3.31 + 5) > 0.6) continue;
        const sx = c * CEL + hash1(c * 1.7) * CEL * 0.7 - cam, y = borda(sx) + 24 + hash1(c * 2.9) * 20;
        const r = hash1(c * 4.4);
        if (r < 0.35) PN.palmeira(ctx, sx, y, 0.5 + 0.2 * hash1(c), { t: S.t }); else if (r < 0.6) PN.cipreste(ctx, sx, y, 0.55 + 0.2 * hash1(c)); else PN.oliveira(ctx, sx, y, 0.5 + 0.25 * hash1(c), { t: S.t });
      }
    }
    const CASAS = ['#fbefe0', '#f6e8d4', '#efe3f2', '#e9f1e0'];
    function casasR(ctx, S) {
      const CEL = 760, Wd = S.W, cam = S.rol;
      for (let c = Math.floor((cam - 700) / CEL); c <= Math.floor((cam + Wd + 700) / CEL); c++) {
        if (hash1(c * 5.7 + 2) > 0.62) continue;
        const wx = c * CEL + hash1(c * 1.3) * CEL * 0.6;
        if (Math.abs(wx - X_TEMPLO) < 760 || Math.abs(wx - X_FORJA) < 520) continue;
        const sx = wx - cam, h = hash1(c * 8.1);
        PN.casa(ctx, sx, borda(sx) + 36, 0.55 + 0.2 * h, { w: 170 + 50 * h, h: 130 + 40 * h, cor: H(CASAS[c & 3 & 3] || CASAS[0]), luz: S.noite * 0.9, t: S.t });
      }
    }
    function temploR(ctx, S) {
      const x = X_TEMPLO - S.rol;
      if (x < -700 || x > S.W + 700) return;
      PN.templo(ctx, x, SOLO + 2, 1.15, { t: S.t, brilho: brilhoSion(S.tl), noite: S.noite });
    }
    function forjaR(ctx, S) {
      const x = X_FORJA - S.rol;
      if (x < -700 || x > S.W + 700) return;
      PN.casa(ctx, x - 70, SOLO - 14, 1.0, { w: 300, h: 190, cor: H('#f1e4d6'), luz: S.noite * 0.8, t: S.t });
      Z.forja(ctx, x, SOLO + 4, 1.15, { u: smooth(tEspadas, tLancas + 3.5, S.tl), t: S.t });
      B.fogueira(ctx, x + 215, SOLO + 14, 0.7, { forca: 0.5, t: S.t });
    }
    function camposR(ctx, S) {
      const a = smooth(tNacao - 2, tNacao + 3, S.tl);
      if (a < 0.02) return;
      const paz = smooth(tPaz, tPaz + 8, S.tl), x0 = X_FORJA + 380 - S.rol;
      for (let k = 0; k < 70; k++) {
        const x = x0 + k * 130;
        if (x < -220 || x > S.W + 220) continue;
        const yb = borda(x) + 12;
        ctx.strokeStyle = css(luzObj(S, '#cfb995', 1), 0.5 * a); ctx.lineWidth = 3; ctx.lineCap = 'round';
        for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.moveTo(x - 60 + j * 4, yb + 8 + j * 9); ctx.lineTo(x + 60 + j * 4, yb + 2 + j * 9); ctx.stroke(); }
        if (paz > 0.03) { ctx.strokeStyle = css(luzObj(S, '#a9d0a0', 1), 0.8 * paz); ctx.lineWidth = 2.2; for (let j = 0; j < 7; j++) { const sx = x - 56 + j * 18, sy = yb + 6 + (j % 4) * 9; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 2, sy - 8 * paz); ctx.stroke(); } }
        if (k % 3 === 1) {
          const fx = x + 20 + 30 * Math.sin(S.t * 0.2 + k);
          PN.pessoa(ctx, fx, yb + 40, 0.3, { tipo: 'aldeao', cor: H(COR[k % 7]), dir: 1, andar: 0.8, fase: S.t * 3 + k, t: S.t, alfa: a });
          Z.espadaArado(ctx, fx - 26, yb + 40, 0.2, 1, { alfa: a, rot: 1.25 });
        }
      }
    }
    function ondaPaz(ctx, S) {
      const u = (S.tl - tPaz) / 9;
      if (u < 0 || u > 1) return;
      const x = X_FORJA - S.rol, r = 200 + 2800 * ease.outCubic(u);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(x, SOLO - 10); ctx.scale(1, 0.1);
      brilhoRadial(ctx, 0, 0, r, ml(K.luzOuro, H('#bfeacb'), 0.6), 0.3 * Math.sin(Math.PI * Math.min(1, u * 1.05))); ctx.restore();
    }

    // ---------------------------------------------------------------- o povo: o grupo cresce com os que chegam das nações
    const COR = ['#f4c8b0', '#f9e1a0', '#c9e6d4', '#f2c6e0', '#d9ccf2', '#f7d9b0', '#bfe3ea'];
    const BANDS = ['#e9b6c6', '#bfc9ee', '#f0d29a', '#c4ebcb', '#d3c4f2', '#f6b8c4', '#bfe3ea', '#f7d9b0'];
    const CY = SOLO + 12;
    const MEMBROS = [];
    for (let i = 0; i < 6; i++) MEMBROS.push({ slot: -88 * (i + 1) - (i % 2) * 8, y: -6 + (i % 3) * 6, tipo: 'aldeao', cor: COR[i % 7], veu: i % 3 === 1, barba: i % 2 === 0, t0: -99, band: i % 2 === 1 ? BANDS[i] : null });
    [[110, tPovos - 1, 'aldeao', false, 5], [205, tPovos + 1.5, 'aldeao', false, 0], [300, tNacoes + 0.5, 'mae', true, 6], [385, tNacoes + 2.8, 'menino', false, 2],
      [-88 * 7, tSubir + 1, 'aldeao', false, 7], [-88 * 8 + 10, tSubir + 4, 'menina', false, 3], [-88 * 9, tVemSubir + 1, 'mae', true, 4], [470, tVemSubir + 3, 'aldeao', false, 1]]
      .forEach(([slot, t0, tipo, veu, b], k) => MEMBROS.push({ slot, y: -6 + (k % 3) * 6, tipo, cor: COR[(k + 3) % 7], veu, barba: k % 2 === 0, t0, band: tipo === 'menino' || tipo === 'menina' ? null : BANDS[b] }));
    MEMBROS.sort((a, b) => a.y - b.y);
    function povo(ctx, S) {
      const tl = S.tl, andar = clamp(0.55 + velEm(tl)), tx = txEm(tl);
      const alegria = Math.max(win(tChor1 - 0.5, tChor1 + 1.5, tFim1 - 1, tFim1 + 1.5, tl), win(tChor2 - 0.5, tChor2 + 1.5, tLo - 1, tLo + 1, tl), win(tChor3 - 0.5, tChor3 + 1.5, dur, dur + 1, tl)) * 0.9;
      const noiteL = S.noite > 0.45;
      MEMBROS.forEach((m, i) => {
        const e = ease.inOutSine(smooth(m.t0, m.t0 + 9, tl));
        if (tl < m.t0) return;
        const xFim = tx + m.slot, x = lerp(-260, xFim, e), y = CY + m.y;
        const opc = { tipo: m.tipo, cor: H(m.cor), dir: 1, andar, fase: ((S.rol + x + 17 * i) / 92) * TAU, t: S.t, olhar: 0.25 + 0.5 * alegria, bracos: alegria * (0.5 + 0.5 * Math.sin(S.t * 3 + i)), barba: m.barba };
        if (m.veu) { opc.veu = true; opc.manto = H('#fff5e0'); }
        if (noiteL) { opc.segura = 'lanterna'; opc.acesa = clamp(S.noite * 1.4 - 0.1); }
        PN.pessoa(ctx, x, y, 1.0, opc);
        if (m.band) S2.bandeira(ctx, x + 26, y + 2, 0.62, { alfa: smooth(m.t0 + 4, m.t0 + 8, tl), t: S.t, vento: 0.3 + 0.2 * alegria, cor: H(m.band) });
      });
      const ergue = Math.max(pulsos(tSion, 0.8, 3.5, tl), 0.5 * alegria);
      const opcL = { tipo: 'aldeao', cor: H('#c8d6f6'), barba: true, dir: 1, andar, fase: ((S.rol + tx) / 92) * TAU, t: S.t, olhar: Math.max(0.3, ergue, alegria), bracos: ergue * 0.75, inclina: -0.02 + 0.03 * Math.min(1, Math.abs(S.ang) * 8), segura: noiteL ? 'lanterna' : null, acesa: clamp(S.noite * 1.3) };
      PN.pessoa(ctx, tx, CY, 1.12, opcL);
      const cx = tx + 36, cy = CY - 4 - 36 * ergue;
      M.cajado(ctx, cx, cy, 1.1, 0.04 - 0.1 * ergue);
      if (ergue > 0.05) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; brilhoRadial(ctx, cx - 18, cy - 190, 70, K.luzOuro, 0.6 * ergue); ctx.restore(); }
      const aJ = win(tJulga - 0.2, tJulga + 1.5, tDecide + 3, tDecide + 5.5, tl);
      if (aJ > 0.02) facho(ctx, tx + 160, -60, tx, CY - 200, 40, 150, 0.2 * aJ, 0.7);
    }

    // ---------------------------------------------------------------- pombas, pétalas e as lanternas da noite
    function pomba(ctx, S, x, y, s, fase, rot, dir) {
      G.Personagens.pomba(ctx, S, x, y, s, { fase: S.t * 9 + fase, bate: Math.sin(S.t * 9 + fase), rot: rot || 0, dir: dir || 1 });
    }
    const BANDOS = [[tChor1 + 4, 15, 6], [tJer[0], 13, 5], [tPaz, 13, 6], [tChor2 + 2, 17, 7], [tHavera[0] - 1, 20, 8], [tChor3 + 4, 20, 8], [tFinal + 3, 13, 6]];
    function pombas(ctx, S) {
      for (const [t0, d, n] of BANDOS) {
        for (let j = 0; j < n; j++) {
          const u = (S.tl - t0 - j * 0.45) / d;
          if (u < 0 || u > 1) continue;
          const x = -150 + (S.W + 300) * u, y = 400 + 280 * hash1(j * 3.3 + t0) + 30 * Math.sin(S.t * 1.7 + j * 2) - 60 * u;
          pomba(ctx, S, x, y, 0.5 + 0.12 * hash1(j + 5), j * 2, -0.1, 1);
        }
      }
    }
    function petalas(ctx, S) {
      const cores = [K.rosa, K.luzOuro, K.lilas, K.luz];
      for (const [tp, d] of [[tChor1 + 2, 9], [tJer[0], 10], [tPaz, 9], [tChor3 + 6, 10]]) {
        const v = (S.tl - tp) / d;
        if (v < 0 || v > 1) continue;
        for (let j = 0; j < 30; j++) {
          const w = clamp(v * 1.2 - hash1(j * 2.3) * 0.2), x = hash1(j * 7.7 + tp) * S.W + Math.sin(w * 5 + j) * 28, y = -40 + w * (SOLO + 80);
          ctx.fillStyle = css(cores[j % 4], Math.sin(Math.PI * w) * 0.9); ctx.beginPath(); ctx.ellipse(x, y, 6, 3.4, S.t * 2 + j, 0, TAU); ctx.fill();
        }
      }
    }
    function lanternas(ctx, S) {
      const f = smooth(tChor3 + 3, tChor3 + 8, S.tl);
      if (f < 0.02) return;
      for (let i = 0; i < 16; i++) {
        const per = 34, u = mod((S.tl - tChor3) / per + hash1(i * 4.1), 1), x = 1120 + hash1(i * 3.9) * 760 + 30 * Math.sin(S.t * 0.5 + i), y = borda(x) + 6 - u * (borda(x) + 120);
        ctx.save(); ctx.globalAlpha *= f * Math.sin(Math.PI * Math.min(1, u * 1.05)); PN.lanternaCeu(ctx, x, y, (0.45 + 0.45 * u) * (0.8 + 0.4 * hash1(i)), 1, S.t); ctx.restore();
      }
    }

    // ---------------------------------------------------------------- quadro
    function desenhar(ctx, S) {
      const tl = S.tl;
      S.hora = horaEm(tl); S.storm = 0; S.ceu = ceuEm(S.hora); S.noite = noiteF(S.hora); S.rol = rolEm(tl); S.ang = angEm(tl);
      S.tomTexto = 1 - smooth(0.32, 0.62, S.noite * 0.9);
      ceuFundo(ctx, S);
      estrelas(ctx, S);
      corpoCeleste(ctx, S);
      nuvens(ctx, S);
      serraR(ctx, S, MONT.longe);
      serraR(ctx, S, MONT.meio);
      zion(ctx, S);
      rolos(ctx, S);
      ctx.save(); ctx.translate(TX, SOLO); ctx.rotate(-S.ang); ctx.translate(-TX, -SOLO);
      arvoresR(ctx, S);
      casasR(ctx, S);
      chao(ctx, S);
      relvaR(ctx, S);
      temploR(ctx, S);
      forjaR(ctx, S);
      camposR(ctx, S);
      ondaPaz(ctx, S);
      ctx.restore();
      povo(ctx, S);
      pombas(ctx, S);
      petalas(ctx, S);
      lanternas(ctx, S);
    }

    return { espelho: false, estado: () => ({ fx: 0.5, calor: 0, peso: 0, nevoa: 0, vento: 0.2, solY: 400, solForca: 1, raios: 0, motes: 0, flash: 0 }), desenhar };
  }

  G.TemaSiao = { criar };
})(window);
