// Tema "Um Menino Nos Nasceu", criado do zero a partir da letra inteira (a imagem da música é só um fundo preto), para o
// vídeo final em 16:9. Uma noite nas colinas de Belém: uma estrela, uma gruta e uma manjedoura onde o Menino é uma trouxinha
// de luz (sem rosto); o manto e a coroa do governo; os nomes (conselheiro, poderoso, eternidade, paz) como emblemas de luz;
// pastores que chegam; o povo que caminhava nas trevas e vê uma grande luz ao amanhecer; a alegria que se multiplica e o
// jugo que se parte; o trono de Davi com a lira; a cidade do Rei; e o Reino sem fim, em ondas de luz que cobrem a terra, até
// a noite de estrelas e lanternas do fim. Os instantes saem do texto da legenda; os trechos que os disparam ficam em
// `animacao.json`, na pasta da música (`gatilhos`), e não neste repositório público. Sem o arquivo, valem os tempos padrão.
(function (G) {
  'use strict';
  const { clamp, lerp, smooth, mod, css, rgb, hash1, mulberry32, ease } = G.U;
  const R91 = G.Seres91, PN = G.SeresPN, S2 = G.SeresS2, M = G.SeresM, K = M.K, ml = R91.ml, brilhoRadial = R91.brilhoRadial, brilho4 = R91.brilho4;
  const ALT = 1080, TAU = Math.PI * 2;
  const SOLO = 0.885 * ALT;
  const HORSKY = 0.74 * ALT;
  const semNikud = (s) => s.normalize('NFD').replace(/[֑-ׇ]/g, '').replace(/[̀-ͯ]/g, '');
  const H = (hex) => rgb(hex);

  const PADRAO = {
    ki: [9.29, 22.54, 63.0, 75.84, 106.48, 155.09, 160.0, 175.09, 185.41, 199.35, 208.43], ven: [14.03, 25.33, 67.0, 73.28, 78.0, 110.09, 116.85, 158.32, 163.02, 167.67, 178.0, 187.52, 203.59],
    ombros: [28.12], reinoEst: [32.72], chamado: [37.14], consel: [39.45], poderoso: [42.09], eternidade: [44.16], paz: [47.27], ombros2: [51.9], nome: [57.01],
    semfim: [80.31, 82.7, 123.71, 126.18, 172.54, 189.45], luz: [87.33], trevas: [89.48], escuridao: [91.72], grandeluz: [94.19],
    alegria: [97.14], presenca: [99.61], jugo: [102.17], opressao: [104.32],
    aumento: [134.75], paz2: [137.65], trono: [140.01, 145.65], reino2: [147.41], governopaz: [150.44], nao: [153.71], rei: [170.15],
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
    const tKi = TT('ki'), tVen = TT('ven'), tOmbros = T('ombros'), tReinoEst = T('reinoEst'), tChamado = T('chamado'), tConsel = T('consel'), tPoderoso = T('poderoso');
    const tEterno = T('eternidade'), tPaz = T('paz'), tOmbros2 = T('ombros2'), tNome = T('nome'), tSemFim = TT('semfim');
    const tLuz = T('luz'), tTrevas = T('trevas'), tEscuro = T('escuridao'), tGrande = T('grandeluz'), tAlegria = T('alegria'), tPresenca = T('presenca'), tJugo = T('jugo'), tOpressao = T('opressao');
    const tAumento = T('aumento'), tPaz2 = T('paz2'), tTrono = TT('trono'), tReino2 = T('reino2'), tGovPaz = T('governopaz'), tNao = T('nao'), tRei = T('rei');
    const win = (a, b, c, d, t) => smooth(a, b, t) * (1 - smooth(c, d, t));
    const pulso = (t0, sobe, desce, t) => win(t0 - 0.1, t0 + sobe, t0 + sobe + 0.5, t0 + sobe + desce, t);
    const pulsos = (arr, sobe, desce, t) => arr.reduce((m, t0) => Math.max(m, pulso(t0, sobe, desce, t)), 0);
    const tFinal = tKi[tKi.length - 3];

    // ---------------------------------------------------------------- horas do dia: uma noite em Belém, o amanhecer da grande luz, o dia, o fim da tarde e a noite de novo
    const HS = [
      [0, 1.6], [tKi[0], 2.3], [tOmbros, 3.0], [tChamado, 3.6], [tPaz, 4.1], [tNome, 4.4], [tSemFim[0], 4.5], [tLuz, 4.7], [tGrande - 0.4, 5.1], [tGrande + 1.5, 6.1],
      [tAlegria, 7.0], [tJugo, 8.2], [tKi[4], 9.6], [tSemFim[2], 11.0], [tAumento, 12.4], [tTrono[0] + 2, 13.4], [tReino2, 14.6], [tKi[5], 15.5], [tRei, 16.8],
      [tKi[7], 17.6], [tKi[8], 18.4], [tKi[9] - 2, 19.4], [tKi[10], 20.6], [dur + 1, 22.0],
    ];
    const horaEm = (tl) => {
      let i = 0; while (i < HS.length - 2 && HS[i + 1][0] <= tl) i++;
      const [a, ha] = HS[i], [b, hb] = HS[i + 1];
      return lerp(ha, hb, clamp((tl - a) / Math.max(1e-6, b - a)));
    };

    // ---------------------------------------------------------------- a gruta
    const SX = W * 0.56, SB = SOLO - 34;
    const luzGruta = (tl) => Math.max(0.5 * smooth(tKi[0] - 0.2, tKi[0] + 3, tl), pulsos(tKi, 0.8, 4.5, tl), 0.8 * pulsos(tVen, 0.8, 4, tl));
    const presencaMenino = (tl) => smooth(tKi[0] + 0.2, tKi[0] + 3.2, tl);

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

    function cidades(ctx, S) {
      const tint = tintF(S);
      for (let i = 0; i < 9; i++) {
        const x = 90 + i * ((S.W - 180) / 8) + (hash1(i * 2.3) - 0.5) * 40;
        if (Math.abs(x - SX) < 360) continue;
        const l = Math.max(0.35, smooth(tReinoEst + i * 0.5, tReinoEst + i * 0.5 + 2.5, S.tl), smooth(tSemFim[0] + i * 0.3, tSemFim[0] + i * 0.3 + 2, S.tl));
        ctx.save(); ctx.globalAlpha *= 0.85;
        S2.cidadeLonge(ctx, x, HORSKY + 26 + hash1(i * 1.9) * 16, 0.55 + 0.3 * hash1(i * 5.1), l * (0.4 + 0.6 * S.noite), i, tint);
        ctx.restore();
      }
    }
    const borda = (x) => 0.835 * ALT + 5 * Math.sin(x * 0.0057) + 2.5 * Math.sin(x * 0.019);

    function chao(ctx, S) {
      const Wd = S.W, y0 = 0.80 * ALT;
      const c1 = luzObj(S, '#f1e3cb', 1), c2 = luzObj(S, '#e8dfc3', 1), c3 = luzObj(S, '#d6dfc2', 1);
      const g = ctx.createLinearGradient(0, y0, 0, ALT);
      g.addColorStop(0, css(c1)); g.addColorStop(0.5, css(c2)); g.addColorStop(1, css(c3));
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-20, ALT + 20);
      for (let x = -20; x <= Wd + 20; x += 12) ctx.lineTo(x, borda(x));
      ctx.lineTo(Wd + 20, ALT + 20); ctx.closePath(); ctx.fill();
      // o caminho de terra até a gruta
      ctx.fillStyle = css(luzObj(S, '#f8ecd4', 1), 0.7); ctx.beginPath();
      ctx.moveTo(-40, ALT - 60); ctx.quadraticCurveTo(W * 0.3, SOLO + 30, SX - 70, SB + 10);
      ctx.lineTo(SX + 70, SB + 10); ctx.quadraticCurveTo(W * 0.32, SOLO + 80, -40, ALT + 10); ctx.closePath(); ctx.fill();
    }
    function relva(ctx, S) {
      const Wd = S.W, vento = 0.4 + 1.2 * S.storm;
      for (let c = -1; c <= Wd / 34 + 1; c++) {
        const h1 = hash1(c * 2.13 + 3), h2 = hash1(c * 7.77 + 1), h3 = hash1(c * 4.9 + 9);
        const sx = c * 34 + h1 * 34, y0 = lerp(borda(sx) + 12, ALT - 12, h3 * h3);
        const n = 2 + Math.floor(h1 * 3), esc = 0.55 + 0.9 * h3;
        ctx.lineCap = 'round';
        for (let i = 0; i < n; i++) {
          const alt = (10 + hash1(c * 3.3 + i) * 18) * esc, lean = (i - (n - 1) / 2) * 5 * esc + Math.sin(S.t * 1.3 * vento + c * 0.7 + i) * 3 * vento * (alt / 26);
          ctx.strokeStyle = css(luzObj(S, i % 2 ? '#b7ceae' : '#cfd9b4', 0.9)); ctx.lineWidth = 2.3 * esc;
          ctx.beginPath(); ctx.moveTo(sx + (i - n / 2) * 3 * esc, y0); ctx.quadraticCurveTo(sx + lean * 0.5, y0 - alt * 0.6, sx + lean, y0 - alt); ctx.stroke();
        }
        if (h2 > 0.82) {
          ctx.fillStyle = css(luzObj(S, ['#f6c6d2', '#fff0b8', '#cfd8f8'][Math.floor(h1 * 3)], 0.8)); ctx.beginPath(); ctx.arc(sx + 5, y0 - 16 * esc, 3 * esc, 0, TAU); ctx.fill();
        }
      }
    }


    // a colina da gruta e a gruta
    function colinaGruta(ctx, S) {
      const tint = tintF(S);
      const g = ctx.createLinearGradient(0, SB - 360, 0, SB + 30);
      g.addColorStop(0, css(tint(H('#efdcc6'), 1))); g.addColorStop(1, css(tint(H('#d3c5cf'), 1)));
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(SX - 620, SB + 40);
      for (let dx = -620; dx <= 620; dx += 10) { const a = Math.abs(dx) / 620, h = 340 * Math.pow(Math.max(0, 1 - a), 1.25) + 8 * Math.sin(dx * 0.02); ctx.lineTo(SX + dx, SB + 20 - h); }
      ctx.lineTo(SX + 620, SB + 40); ctx.closePath(); ctx.fill();
      for (const [dx, sc] of [[-470, 0.5], [-390, 0.42], [430, 0.5], [510, 0.42], [-250, 0.36]]) PN.oliveira(ctx, SX + dx, SB + 30 - 90 * Math.max(0, 1 - Math.abs(dx) / 620), sc, { t: S.t });
      M.gruta(ctx, SX, SB + 6, 0.95, { luz: S.luzGruta, tint });
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
    const STAR = [SX + 90, 215];
    function estrelaEFacho(ctx, S) {
      const tl = S.tl, a = smooth(tKi[0] - 2.2, tKi[0] - 0.2, tl);
      if (a < 0.01) return;
      const p = Math.max(pulsos(tKi, 0.9, 4.5, tl), 0.8 * pulsos(tVen, 0.9, 4, tl));
      const dia = 1 - 0.75 * smooth(5.4, 7.4, S.hora) * (1 - smooth(18.4, 19.6, S.hora));
      facho(ctx, STAR[0], STAR[1], SX, SB - 160, 12, 150, (0.1 + 0.2 * p) * a * dia, 0.7);
      M.estrela(ctx, STAR[0], STAR[1] + 14 * Math.sin(S.t * 0.8), 0.55 + 0.35 * p, { brilho: 0.4 + 0.6 * p, alfa: a * dia, t: S.t });
    }

    // ---------------------------------------------------------------- o manto, a coroa, os nomes
    function governo(ctx, S) {
      const tl = S.tl;
      const m = Math.max(win(tOmbros - 0.4, tOmbros + 1.6, tOmbros + 7.5, tOmbros + 10, tl), win(tOmbros2 - 0.4, tOmbros2 + 1.4, tOmbros2 + 6, tOmbros2 + 8, tl));
      const pm = Math.max(pulso(tOmbros, 1, 5, tl), pulso(tOmbros2, 1, 5, tl));
      if (m > 0.01) M.manto(ctx, SX, 520 + 14 * Math.sin(tl * 1.2) - 30 * (1 - m), 1.3, { alfa: m, brilho: pm, t: S.t });
      const c = Math.max(win(tReinoEst - 0.3, tReinoEst + 1.6, tReinoEst + 7, tReinoEst + 9, tl), win(tNome - 0.2, tNome + 1.5, tNome + 5, tNome + 7, tl));
      if (c > 0.01) S2.coroa(ctx, SX, 470 + 6 * Math.sin(tl * 1.5), 1.5, { alfa: c, brilho: 0.4 + 0.6 * Math.max(pulso(tReinoEst, 1, 4, tl), pulso(tNome, 1, 4, tl)) });
    }
    function nomes(ctx, S) {
      const tl = S.tl, t0s = [tConsel, tPoderoso, tEterno, tPaz], t1s = [tPoderoso, tEterno, tPaz, tOmbros2 + 0.5];
      for (let k = 0; k < 4; k++) {
        const a = win(t0s[k] - 0.2, t0s[k] + 0.9, t1s[k] - 0.3, t1s[k] + 0.7, tl);
        if (a < 0.01) continue;
        M.emblema(ctx, k, SX, 585 + 8 * Math.sin(S.t + k), 1.0, a, S.t);
        if (k === 3) { ctx.save(); ctx.globalAlpha *= a; pomba(ctx, S, SX + 150 * Math.sin(tl * 0.9), 520 + 20 * Math.sin(tl * 1.6), 0.9, 0, 0, Math.cos(tl * 0.9) > 0 ? 1 : -1); ctx.restore(); }
      }
    }
    function pomba(ctx, S, x, y, s, fase, rot, dir) {
      G.Personagens.pomba(ctx, S, x, y, s, { fase: S.t * 9 + fase, bate: Math.sin(S.t * 9 + fase), rot: rot || 0, dir: dir || 1 });
    }
    function amanhecer(ctx, S) {
      const p = pulso(tGrande, 1.2, 5, S.tl);
      if (p < 0.02 || !S.sol || S.sol.alt < -0.2) return;
      const x = S.sol.x, y = S.sol.y;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      brilhoRadial(ctx, x, y, 700 * (0.6 + 0.4 * p), K.luzOuro, 0.5 * p);
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * TAU, L = 900 * (0.4 + 0.6 * p), g = ctx.createLinearGradient(x, y, x + Math.cos(a) * L, y + Math.sin(a) * L);
        g.addColorStop(0, css(K.luz, 0.3 * p)); g.addColorStop(1, css(K.luzOuro, 0));
        ctx.strokeStyle = g; ctx.lineWidth = 8 + 6 * (i % 2); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); ctx.stroke();
      }
      ctx.restore();
    }
    function ondaTerra(ctx, S) {
      for (const t0 of [...tSemFim, tPresenca, tOpressao, tReino2, tGovPaz, tNao]) {
        const u = (S.tl - t0 - 0.2) / 4.4;
        if (u < 0 || u > 1) continue;
        const r = 140 + 2300 * ease.outCubic(u);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = css(K.luzOuro, 0.34 * (1 - u)); ctx.lineWidth = 3 + 5 * (1 - u);
        ctx.beginPath(); ctx.ellipse(SX, SOLO + 18, r, r * 0.1, 0, 0, TAU); ctx.stroke(); ctx.restore();
      }
    }

    // ---------------------------------------------------------------- o trono de Davi, a cidade do Rei
    const TRX = W - 215, TRY = SOLO - 170;
    function tronoEcidade(ctx, S) {
      const tl = S.tl;
      const a = smooth(tTrono[0] - 0.4, tTrono[0] + 2.2, tl);
      if (a > 0.01) {
        const luz = Math.max(pulsos(tTrono, 1, 5, tl), pulso(tRei, 1, 6, tl));
        { const tint = tintF(S), gm = ctx.createLinearGradient(0, TRY - 40, 0, SOLO + 40); gm.addColorStop(0, css(tint(H('#efdcc6'), 1), a)); gm.addColorStop(1, css(tint(H('#d9cdb8'), 1), a));
          ctx.fillStyle = gm; ctx.beginPath(); ctx.ellipse(TRX - 40, TRY + 6, 330, 110, 0, Math.PI, 0); ctx.lineTo(TRX + 290, SOLO + 40); ctx.lineTo(TRX - 370, SOLO + 40); ctx.closePath(); ctx.fill(); }
        M.trono(ctx, TRX, TRY, 0.78, { alfa: a, luz, t: S.t });
        G.Seres23.lira(ctx, TRX - 135, TRY + 8, 0.42, { t: S.t, alfa: a });
        facho(ctx, TRX + 120, -60, TRX, TRY - 260, 40, 130, 0.14 * a * (0.5 + 0.5 * luz), 0.7);
        const c = smooth(tRei - 0.8, tRei + 5.5, tl);                                 // a coroa desce sobre o trono, "o Rei virá"
        if (c > 0.01) S2.coroa(ctx, TRX, lerp(-60, TRY - 0.78 * 335 - 26, ease.outCubic(c)), 1.3, { brilho: 0.4 + 0.6 * pulso(tRei, 1, 6, tl) });
      }
      const b = smooth(tReino2 - 0.4, tReino2 + 2.4, tl);
      if (b > 0.01) {
        ctx.save(); ctx.globalAlpha *= b;
        PN.templo(ctx, W * 0.17, HORSKY - 24, 0.55, { brilho: 0.4 + 0.5 * Math.max(pulso(tReino2, 1, 5, tl), pulso(tGovPaz, 1, 5, tl)), noite: S.noite, t: S.t });
        ctx.restore();
      }
    }

    // ---------------------------------------------------------------- as pessoas
    const COR = ['#f4c8b0', '#f9e1a0', '#c8d6f6', '#c9e6d4', '#f2c6e0', '#d9ccf2', '#f7d9b0', '#bfe3ea'];
    const PAST = [
      { x1: SX - 330, dy: 22, cor: COR[0], barba: true }, { x1: SX - 425, dy: 36, cor: COR[2], barba: true },
      { x1: SX - 520, dy: 16, cor: COR[3], barba: true }, { x1: SX - 610, dy: 40, cor: COR[1], barba: true },
    ].map((p, i) => Object.assign(p, { id: 'p' + i, te: T('ki', 2) - 0.2 + i * 0.5 }));
    const POVO = Array.from({ length: 6 }, (_, i) => ({ id: 'v' + i, x1: 110 + i * 96 + (i % 2) * 20, dy: 14 + (i % 3) * 14, cor: COR[(i + 4) % 8], veu: i % 3 === 1, te: tLuz - 3.6 + i * 0.6 }));
    const FEST = Array.from({ length: 6 }, (_, i) => ({ id: 'f' + i, x1: SX + 360 + i * 66 + (i % 2) * 14, dy: 10 + (i % 3) * 16, cor: COR[(i + 1) % 8], veu: i % 3 === 2, te: tKi[4] + 0.4 + i * 0.5 }));
    function pessoas(ctx, S) {
      const tl = S.tl, noiteL = S.noite > 0.4;
      const luzAcesa = smooth(tGrande, tGrande + 1.2, tl);
      const alegria = win(tAlegria - 0.2, tAlegria + 0.8, tNao - 1, tNao, tl);
      const cresce = (alvo) => lerp(0, 1, alvo);
      const lista = [];
      for (const p of PAST) lista.push({ k: 'past', p, x: lerp(-240, p.x1, ease.outCubic(smooth(p.te, p.te + 7.5, tl))), dir: 1 });
      for (const p of POVO) lista.push({ k: 'povo', p, x: lerp(-260, p.x1, ease.inOutSine(smooth(p.te, p.te + 11, tl))), dir: 1 });
      for (const p of FEST) lista.push({ k: 'fest', p, x: lerp(W + 260, p.x1, ease.outCubic(smooth(p.te, p.te + 7, tl))), dir: -1 });
      lista.sort((a, b) => a.p.dy - b.p.dy);
      // os pais ficam junto da manjedoura
      const pais = smooth(tKi[0] - 0.4, tKi[0] + 1.2, tl);
      if (pais > 0.01) {
        PN.pessoa(ctx, SX - 235, SB + 18, 1.02, { tipo: 'mae', dir: 1, sentado: 0.9, olhar: 0, alfa: pais, t: S.t, maos: 0.4 });
        M.cajado(ctx, SX + 330, SB + 24, 0.95, 0.06);
        PN.pessoa(ctx, SX + 285, SB + 24, 1.05, { tipo: 'pai', dir: -1, sentado: 0, maos: 0.5, olhar: 0.2, alfa: pais, t: S.t });
      }
      for (const q of lista) {
        const x = q.x, p = q.p, vx = (q.k === 'past' ? lerp(-240, p.x1, ease.outCubic(smooth(p.te, p.te + 7.5, tl + 0.05))) - lerp(-240, p.x1, ease.outCubic(smooth(p.te, p.te + 7.5, tl - 0.05)))
          : q.k === 'povo' ? lerp(-260, p.x1, ease.inOutSine(smooth(p.te, p.te + 11, tl + 0.05))) - lerp(-260, p.x1, ease.inOutSine(smooth(p.te, p.te + 11, tl - 0.05)))
            : lerp(W + 260, p.x1, ease.outCubic(smooth(p.te, p.te + 7, tl + 0.05))) - lerp(W + 260, p.x1, ease.outCubic(smooth(p.te, p.te + 7, tl - 0.05)))) / 0.1;
        const andar = clamp(Math.abs(vx) / 40);
        if (x < -280 || x > S.W + 280) continue;
        const ajoelha = q.k === 'past' ? Math.max(win(tKi[2] + 6, tKi[2] + 8, tAlegria - 1, tAlegria + 0.5, tl), smooth(tRei + 5, tRei + 7, tl)) * 0.9 : 0;
        const jab = 0.5 + 0.5 * Math.sin(S.t * 3 + p.dy);
        const opc = {
          tipo: 'aldeao', cor: H(p.cor), dir: q.dir, andar: andar * (1 - ajoelha), fase: (x * q.dir / 92) * TAU, sentado: ajoelha, t: S.t,
          bracos: alegria * (0.4 + 0.6 * jab) * (q.k === 'past' ? 1 : 0.9) * (1 - ajoelha), olhar: Math.max(0.5 * ajoelha, pulso(tGrande, 1, 6, tl), 0.6 * alegria), maos: 0.3 * ajoelha,
        };
        if (p.veu) { opc.veu = true; opc.manto = H('#fff5e0'); }
        if (p.barba) opc.barba = true;
        if (q.k === 'past') { opc.segura = 'lanterna'; opc.acesa = 1; }
        else if (q.k === 'povo') { opc.segura = 'lanterna'; opc.acesa = luzAcesa * clamp(S.noite * 1.2 + 0.4) + 0 * cresce(1); }
        PN.pessoa(ctx, x, SOLO + p.dy, 1.0, opc);
        if (q.k === 'past') M.cajado(ctx, x + 24, SOLO + p.dy - 2, 0.9, 0.08);
      }
    }
    function jugoQuebrado(ctx, S) {
      const a = smooth(tAlegria + 0.4, tAlegria + 2, S.tl), q = smooth(tJugo, tJugo + 1.6, S.tl), some = 1 - smooth(tJugo + 3, tJugo + 4.4, S.tl);
      if (a < 0.01 || some < 0.01) return;
      M.jugo(ctx, SX + 520, SOLO + 14, 1.0, { alfa: a * some, quebra: q });
      const u = (S.tl - tJugo) / 2.4;
      if (u > 0 && u < 1) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let j = 0; j < 10; j++) { const an = (j / 10) * TAU, v = ease.outCubic(u); S2.estilhaco(ctx, SX + 520 + Math.cos(an) * 130 * v, SOLO - 10 + Math.sin(an) * 90 * v + 120 * u * u, 12 + 6 * hash1(j), an + u * 6, (1 - u)); }
        ctx.restore();
      }
    }
    function petalas(ctx, S) {
      const ev = [[tAlegria, 6, SX], [tKi[4] + 12, 7, SX], [tKi[5], 7, SX + 200], [tKi[9], 9, SX]];
      const cores = [K.rosa, K.luzOuro, K.lilas, K.luz];
      for (const [t0, d, x0] of ev) {
        const u = (S.tl - t0) / d;
        if (u < 0 || u > 1) continue;
        for (let j = 0; j < 34; j++) {
          const v = clamp(u * 1.2 - hash1(j * 2.3) * 0.2), x = x0 - 620 + hash1(j * 7.7 + t0) * 1240 + Math.sin(v * 5 + j) * 28, y = SOLO - 640 + v * 760;
          ctx.fillStyle = css(cores[j % 4], Math.sin(Math.PI * v) * 0.9); ctx.beginPath(); ctx.ellipse(x, y, 6, 3.4, S.t * 2 + j, 0, TAU); ctx.fill();
        }
      }
    }
    function lanternas(ctx, S) {
      const tl = S.tl, t0b = tKi[9] - 0.5;
      if (tl < t0b) return;
      for (let i = 0; i < 22; i++) {
        const t0 = t0b + i * 0.45, u = (tl - t0) / 12;
        if (u < 0 || u > 1) continue;
        const x = SX - 560 + hash1(i * 3.1) * 1200 + Math.sin(tl * 0.7 + i) * 26, y = lerp(SOLO - 60, 90 + hash1(i * 5.7) * 220, ease.outCubic(u) * 0.97), a = Math.sin(Math.PI * Math.min(1, u * 1.05)) * 0.95;
        const estrela = smooth(0.72, 1, u);
        ctx.save(); ctx.globalAlpha *= a;
        if (estrela < 0.98) { ctx.globalAlpha *= 1 - estrela; PN.lanternaCeu(ctx, x, y, 0.7 * (1 - 0.4 * estrela), 1, S.t); }
        ctx.restore();
        if (estrela > 0.02) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = css(K.luz, a * estrela); brilho4(ctx, x, y, 12 * estrela); ctx.restore(); }
      }
    }
    function vagalumes(ctx, S) {
      const f = S.noite * 0.9;
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
      S.hora = horaEm(tl); S.storm = 0; S.ceu = ceuEm(S.hora); S.noite = noiteF(S.hora);
      S.luzGruta = luzGruta(tl);
      S.tomTexto = 1 - smooth(0.32, 0.62, S.noite * 0.9);
      ceuFundo(ctx, S);
      estrelas(ctx, S);
      corpoCeleste(ctx, S);
      nuvens(ctx, S);
      amanhecer(ctx, S);
      serra(ctx, S, MONT.longe);
      cidades(ctx, S);
      serra(ctx, S, MONT.meio);
      tronoEcidade(ctx, S);
      estrelaEFacho(ctx, S);
      colinaGruta(ctx, S);
      chao(ctx, S);
      relva(ctx, S);
      ondaTerra(ctx, S);
      M.manjedoura(ctx, SX, SB - 4, 1.0, { luz: S.luzGruta, presenca: presencaMenino(tl), t: S.t });
      pessoas(ctx, S);
      jugoQuebrado(ctx, S);
      governo(ctx, S);
      nomes(ctx, S);
      petalas(ctx, S);
      lanternas(ctx, S);
      vagalumes(ctx, S);
    }

    return { espelho: false, estado: () => ({ fx: 0.5, calor: 0, peso: 0, nevoa: 0, vento: 0.2, solY: 400, solForca: 1, raios: 0, motes: 0, flash: 0 }), desenhar };
  }

  G.TemaMenino = { criar };
})(window);
