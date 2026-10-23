// Tema "Salmo 2", criado do zero a partir da letra inteira (a imagem da música é só um fundo preto), para o vídeo final em
// 16:9. Sião, o monte santo, com o Templo no alto e a luz do céu sobre ele. Uma coroa de ouro desce na luz e é ungida com
// óleo de luz (o Rei estabelecido); os reis e os povos da terra se levantam contra isso, com lanças, bandeiras e correntes,
// e uma tempestade se arma, mas o monte não se abala. Depois: a luz que sobe de cima para o Filho, as nações que vêm como
// herança (cidades distantes que se acendem e peregrinos a caminho), o cetro de luz que quebra a rebelião, os reis que tiram
// as coroas e se ajoelham, as correntes que se rompem, a alegria com tremor, o beijo ao Filho e, no fim, os que confiam,
// bem-aventurados, sob uma noite de estrelas e lanternas. Deus e o Ungido não são retratados como pessoas: só luz, coroa e cetro.
// Os instantes saem do texto da legenda; os trechos que os disparam ficam em `animacao.json`, na pasta da música
// (`gatilhos`), e não neste repositório público. Sem o arquivo, valem os tempos padrão abaixo.
(function (G) {
  'use strict';
  const { clamp, lerp, smooth, mod, css, rgb, hash1, mulberry32, ease } = G.U;
  const R91 = G.Seres91, PN = G.SeresPN, B = G.SeresBS, S2 = G.SeresS2, K = S2.K, ml = R91.ml, brilhoRadial = R91.brilhoRadial, brilho4 = R91.brilho4;
  const ALT = 1080, TAU = Math.PI * 2;
  const SOLO = 0.885 * ALT;
  const HORSKY = 0.74 * ALT;
  const semNikud = (s) => s.normalize('NFD').replace(/[֑-ׇ]/g, '').replace(/[̀-ͯ]/g, '');
  const H = (hex) => rgb(hex);

  const PADRAO = {
    rei: [20.39, 74.8], monte: [23.74, 82.06], palavra: [33.55], prop: [39.69], reis: [47.03], povos: [54.05], reino: [61.0], abalado: [67.94],
    filho: [88.2, 94.19, 178.08, 184.03], pede: [101.93, 191.85], nacoes: [103.76, 193.6], confins: [108.95, 198.79],
    governa: [123.31], quebraras: [126.42], reinara: [133.28], prud: [137.83], instr: [141.26], temor: [144.06, 164.24], tremor: [148.09, 169.59],
    cadeias: [150.84], posic: [157.7], beijem: [172.38], ire: [174.06], perecam: [176.29], bem: [213.29, 218.74], confiam: [226.16],
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
    const tRei = TT('rei'), tMonte = TT('monte'), tPalavra = T('palavra'), tProp = T('prop'), tReis = T('reis'), tPovos = T('povos'), tReino = T('reino'), tAbalado = T('abalado');
    const tFilho = TT('filho'), tPede = TT('pede'), tNacoes = TT('nacoes'), tConfins = TT('confins');
    const tGoverna = T('governa'), tQuebra = T('quebraras'), tReinara = T('reinara'), tPrud = T('prud'), tInstr = T('instr');
    const tTemor = TT('temor'), tTremor = TT('tremor'), tCadeias = T('cadeias'), tPosic = T('posic'), tBeijem = T('beijem'), tIre = T('ire'), tPerecam = T('perecam');
    const tBem = TT('bem'), tConfiam = T('confiam');
    const win = (a, b, c, d, t) => smooth(a, b, t) * (1 - smooth(c, d, t));
    const pulso = (t0, sobe, desce, t) => win(t0 - 0.1, t0 + sobe, t0 + sobe + 0.5, t0 + sobe + desce, t);
    const pulsos = (arr, sobe, desce, t) => arr.reduce((m, t0) => Math.max(m, pulso(t0, sobe, desce, t)), 0);

    // ---------------------------------------------------------------- horas do dia
    const HS = [
      [0, 4.5], [tRei[0] - 1, 4.9], [tRei[0] + 4, 5.9], [tMonte[0] + 8, 6.8], [tPalavra, 7.6], [tProp + 3, 8.8], [tReis, 9.8], [tPovos, 10.4], [tReino, 10.9],
      [tAbalado, 11.6], [tRei[1], 12.4], [tFilho[0], 13.0], [tPede[0], 13.6], [tGoverna, 14.4], [tPrud, 15.2], [tCadeias, 16.3], [tBeijem, 17.3],
      [tFilho[3], 17.9], [tPede[1], 18.5], [tBem[0] - 3, 19.3], [tBem[0] + 6, 20.5], [tBem[1], 21.6], [dur + 1, 22.6],
    ];
    const horaEm = (tl) => {
      let i = 0; while (i < HS.length - 2 && HS[i + 1][0] <= tl) i++;
      const [a, ha] = HS[i], [b, hb] = HS[i + 1];
      return lerp(ha, hb, clamp((tl - a) / Math.max(1e-6, b - a)));
    };
    // a tempestade que se arma contra o monte (e uma sombra curta quando a ira se anuncia)
    const tempestade = (tl) => Math.max(win(tReis - 1.2, tReis + 3.5, tReino + 1.2, tAbalado + 3.5, tl), 0.4 * pulso(tIre, 0.8, 3.2, tl));

    // ---------------------------------------------------------------- Sião
    const ZX = W * 0.70, ZY = 590, ZBASE = SOLO - 24, ZW = 720, ZPLAT = 270;
    const zy = (dx) => {
      const a = Math.abs(dx) / ZW;
      if (a >= 1) return ZBASE + 40;
      const f = Math.pow(1 - a, 1.35) / Math.pow(1 - ZPLAT / ZW, 1.35);
      return ZBASE - (ZBASE - ZY) * Math.min(1, f) + 7 * Math.sin(dx * 0.011) * (1 - Math.min(1, f));
    };
    const CX = ZX, CY0 = ZY - 262;                                       // a coroa paira acima do Templo

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
    const rT = mulberry32(33);
    const TEMP = Array.from({ length: 9 }, (_, i) => ({ x0: rT() * (W + 600), y: 90 + rT() * 250, s: 1.1 + rT() * 0.9, v: 14 + rT() * 10, sem: i }));
    const RAIOS = Array.from({ length: 5 }, (_, i) => tReis + 3.2 + i * 2.2 + hash1(i * 5.3) * 0.9);
    function tempestadeCeu(ctx, S) {
      const st = S.storm;
      if (st < 0.02) return;
      const per = S.W + 700;
      for (const c of TEMP) S2.nuvemTempestade(ctx, mod(c.x0 + S.t * c.v * 0.5, per) - 350, c.y + 20 * Math.sin(S.t * 0.2 + c.sem), c.s, st * 0.92, c.sem);
      // chuva fina e inclinada
      ctx.save(); ctx.strokeStyle = css(K.nuvemLuz, 0.32 * st); ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.beginPath();
      for (let i = 0; i < 90; i++) {
        const u = mod(hash1(i * 1.7) * 3 + S.t * (1.4 + hash1(i) * 0.6), 1), x = hash1(i * 3.9) * (S.W + 300) - 100 - 120 * u, y = u * (SOLO + 40);
        ctx.moveTo(x, y); ctx.lineTo(x - 11, y + 30);
      }
      ctx.stroke(); ctx.restore();
    }
    function relampagos(ctx, S) {
      if (S.storm < 0.3) return;
      for (let k = 0; k < RAIOS.length; k++) {
        const u = (S.tl - RAIOS[k]) / 0.55;
        if (u < 0 || u > 1) continue;
        const f = Math.max(0, 1 - u) * (u < 0.15 ? 1 : 0.6 + 0.4 * Math.sin(u * 30));
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = css(H('#e6e2ff'), 0.2 * f * S.storm); ctx.fillRect(-40, -40, S.W + 80, ALT + 80);
        ctx.strokeStyle = css(K.luz, 0.85 * f); ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.beginPath();
        let x = 260 + hash1(k * 4.1) * (S.W * 0.55), y = 120;
        ctx.moveTo(x, y);
        for (let i = 0; i < 8; i++) { x += (hash1(k * 7 + i) - 0.5) * 90; y += 82 + hash1(k * 3 + i) * 30; ctx.lineTo(x, y); }
        ctx.stroke(); ctx.restore();
      }
    }

    // ---------------------------------------------------------------- relevo longe, cidades e a terra
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
    const NCID = 9;
    const revelaCid = (i, tl) => {
      const c1 = smooth(tNacoes[0] + i * 0.8, tNacoes[0] + i * 0.8 + 1.6, tl), c2 = smooth(tNacoes[1] + i * 0.6, tNacoes[1] + i * 0.6 + 1.4, tl);
      return Math.max(c1, c2);
    };
    function cidades(ctx, S) {
      const tint = tintF(S);
      for (let i = 0; i < NCID; i++) {
        const x = 90 + i * ((S.W - 180) / (NCID - 1)) + (hash1(i * 2.3) - 0.5) * 40;
        if (Math.abs(x - ZX) < 330) continue;
        const l = revelaCid(i, S.tl);
        ctx.save(); ctx.globalAlpha *= 0.85;
        S2.cidadeLonge(ctx, x, HORSKY + 26 + hash1(i * 1.9) * 16, 0.55 + 0.3 * hash1(i * 5.1), l * (0.5 + 0.5 * S.noite), i, tint);
        ctx.restore();
      }
      const gl = Math.max(pulsos(tConfins, 1.2, 5.5, S.tl), 0.3 * win(tNacoes[0], tNacoes[0] + 3, tGoverna, tGoverna + 3, S.tl));
      if (gl > 0.02) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createLinearGradient(0, 0, S.W, 0);
        g.addColorStop(0, css(K.luzOuro, 0.5 * gl)); g.addColorStop(0.5, css(K.luzOuro, 0.15 * gl)); g.addColorStop(1, css(K.luzOuro, 0.5 * gl));
        ctx.fillStyle = g; ctx.fillRect(0, HORSKY + 14, S.W, 26);
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
      // o caminho de pedra que sobe a Sião
      ctx.fillStyle = css(luzObj(S, '#f8ecd4', 1), 0.7); ctx.beginPath();
      ctx.moveTo(-40, ALT - 70); ctx.quadraticCurveTo(W * 0.4, SOLO + 40, ZX - 190, ZBASE + 6);
      ctx.lineTo(ZX - 110, ZBASE + 6); ctx.quadraticCurveTo(W * 0.42, SOLO + 90, -40, ALT + 10); ctx.closePath(); ctx.fill();
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

    // ---------------------------------------------------------------- o monte
    function monte(ctx, S) {
      const tint = tintF(S);
      const g = ctx.createLinearGradient(0, ZY - 20, 0, ZBASE + 40);
      g.addColorStop(0, css(tint(H('#f3e2c6'), 1))); g.addColorStop(0.45, css(tint(H('#e2cbb2'), 1))); g.addColorStop(1, css(tint(H('#c2bcc9'), 1)));
      ctx.beginPath(); ctx.moveTo(ZX - ZW - 10, ZBASE + 40);
      for (let dx = -ZW - 10; dx <= ZW + 10; dx += 8) ctx.lineTo(ZX + dx, zy(dx));
      ctx.lineTo(ZX + ZW + 10, ZBASE + 40); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
      // luz do lado esquerdo e sombra do direito
      ctx.save(); ctx.clip();
      const gl = ctx.createLinearGradient(ZX - ZW, 0, ZX + ZW, 0);
      gl.addColorStop(0, css(K.luz, 0.22 * (1 - S.noite))); gl.addColorStop(0.5, css(K.luz, 0)); gl.addColorStop(1, css(K.sombra, 0.18));
      ctx.fillStyle = gl; ctx.fillRect(ZX - ZW - 10, ZY - 30, 2 * ZW + 20, ZBASE - ZY + 80);
      // terraços (muros de pedra em curva)
      ctx.strokeStyle = css(tint(H('#d9c4ae'), 1), 0.6); ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let k = 1; k <= 6; k++) {
        ctx.beginPath(); const lim = ZW * (1 - 0.1 * k);
        for (let dx = -lim; dx <= lim; dx += 10) { const y = zy(dx) + k * 34 + 5 * Math.sin(dx * 0.02 + k); dx === -lim ? ctx.moveTo(ZX + dx, y) : ctx.lineTo(ZX + dx, y); }
        ctx.stroke();
      }
      ctx.restore();
      // oliveiras e ciprestes na encosta
      const arvores = [];
      for (let i = 0; i < 30; i++) {
        const dx = (hash1(i * 3.7 + 1) - 0.5) * 2 * ZW * 0.86;
        if (Math.abs(dx) < 140 && zy(dx) < ZY + 40) continue;
        arvores.push({ dx, y: zy(dx) + 18 + hash1(i * 9.1) * 70, i });
      }
      arvores.sort((a, b) => a.y - b.y);
      for (const a of arvores) {
        const s = 0.3 + 0.22 * hash1(a.i * 2.9);
        if (a.i % 3 === 0) PN.cipreste(ctx, ZX + a.dx, a.y, s * 1.1); else PN.oliveira(ctx, ZX + a.dx, a.y, s, { t: S.t });
      }
      // a trilha de luz que sobe ao Templo
      const luz = 0.25 + 0.5 * smooth(tRei[0], tRei[0] + 4, S.tl);
      ctx.save(); ctx.strokeStyle = css(K.luzOuro, 0.55 * luz); ctx.lineWidth = 4; ctx.setLineDash([2, 12]); ctx.lineCap = 'round'; ctx.beginPath();
      const pts = [[-230, ZBASE + 2], [-60, ZBASE - 56], [-190, ZBASE - 110], [-20, ZBASE - 170], [-120, ZBASE - 220], [-14, ZBASE - 270], [-30, ZY + 12]];
      pts.forEach(([dx, y], i) => (i ? ctx.lineTo(ZX + dx, y) : ctx.moveTo(ZX + dx, y)));
      ctx.stroke(); ctx.restore();
      // o Templo, no alto
      PN.templo(ctx, ZX, ZY + 6, 0.6, { brilho: S.luzSiao, noite: S.noite, t: S.t });
    }
    function cupula(ctx, S) {
      const a = Math.max(0.5 * win(tReino, tReino + 2.5, tAbalado + 12, tAbalado + 20, S.tl), 0.22 * smooth(tAbalado + 6, tAbalado + 16, S.tl)) * (0.8 + 0.2 * Math.sin(S.t * 1.3));
      if (a < 0.02) return;
      ctx.save(); ctx.translate(ZX, ZBASE + 10); ctx.scale(1, 0.78);
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(0, 0, 200, 0, 0, 760); g.addColorStop(0, css(K.luzOuro, 0)); g.addColorStop(0.8, css(K.luzOuro, 0.08 * a)); g.addColorStop(1, css(K.luzOuro, 0.22 * a));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 760, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = css(K.luzOuro, 0.55 * a); ctx.lineWidth = 3;
      for (const r of [700, 735, 770]) { ctx.beginPath(); ctx.arc(0, 0, r, Math.PI, 0); ctx.stroke(); }
      ctx.restore();
    }
    // feixe de luz do céu (fatias que se apagam ao longo do comprimento, sem borda dura)
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
    function luzDoCeu(ctx, S) {
      const base = 0.1 * smooth(tRei[0] - 1.5, tRei[0] + 2, S.tl) * (1 - 0.5 * S.storm), p = Math.max(pulsos(tFilho, 0.9, 5.5, S.tl), 0.8 * pulsos(tRei, 1, 5, S.tl), 0.7 * pulso(tReinara, 1, 5, S.tl));
      facho(ctx, ZX + 150, -60, ZX, ZY - 110, 70, 190, base + 0.2 * p, 0.55);
      facho(ctx, ZX + 150, -60, ZX, ZY - 110, 30, 90, 0.5 * (base + 0.2 * p), 0.6);
    }

    // ---------------------------------------------------------------- a coroa, o óleo de luz, a pomba, o cetro
    const coroaY = (tl) => lerp(-80, CY0, ease.outCubic(clamp((tl - (tRei[0] - 0.6)) / 4.6))) + 5 * Math.sin(tl * 1.5);
    function coroaDeLuz(ctx, S) {
      const tl = S.tl;
      if (tl < tRei[0] - 0.8) return;
      const y = coroaY(tl), p = Math.max(pulsos(tFilho, 0.9, 5, tl), pulsos(tRei, 0.8, 4.5, tl), 0.8 * pulso(tReinara, 0.8, 5, tl));
      // óleo: gotas douradas descendo no feixe
      const unge = Math.max(win(tRei[0] - 0.4, tRei[0] + 0.3, tRei[0] + 5, tRei[0] + 7, tl), win(tRei[1] - 0.4, tRei[1] + 0.3, tRei[1] + 4, tRei[1] + 6, tl));
      if (unge > 0.02) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 26; i++) {
          const u = mod(tl * 0.35 + i * 0.173, 1), x = CX + 70 * (1 - u) * (hash1(i * 2.3) - 0.2) + Math.sin(tl * 2 + i) * 4, yy = lerp(-30, CY0 - 24, u);
          const a = unge * Math.sin(Math.PI * Math.min(1, u * 1.1));
          brilhoRadial(ctx, x, yy, 22, K.luzOuro, 0.6 * a);
          ctx.fillStyle = css(K.luz, 0.9 * a); ctx.beginPath(); ctx.ellipse(x, yy, 3.2, 5.6, 0, 0, TAU); ctx.fill();
        }
        ctx.restore();
      }
      S2.coroa(ctx, CX, y, 1.7, { brilho: 0.35 + 0.65 * p });
      // a cada vez que o Filho é declarado, a luz sobe de cima para a coroa
      if (p > 0.05) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        brilhoRadial(ctx, CX, y - 28, 380, K.luzOuro, 0.3 * p);
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * TAU + S.t * 0.08, L = 480 * (0.4 + 0.6 * p), gg = ctx.createLinearGradient(CX, y - 28, CX + Math.cos(a) * L, y - 28 + Math.sin(a) * L);
          gg.addColorStop(0, css(K.luz, 0.3 * p)); gg.addColorStop(1, css(K.luzOuro, 0));
          ctx.strokeStyle = gg; ctx.lineWidth = 6 + 4 * (i % 2); ctx.beginPath(); ctx.moveTo(CX, y - 28); ctx.lineTo(CX + Math.cos(a) * L, y - 28 + Math.sin(a) * L); ctx.stroke();
        }
        ctx.fillStyle = css(K.luz, 0.9 * p); brilho4(ctx, CX, y - 28, 60 * p);
        ctx.restore();
      }
    }
    function cetroDeLuz(ctx, S) {
      const a = smooth(tGoverna - 0.4, tGoverna + 1.6, S.tl);
      if (a < 0.02) return;
      const p = Math.max(pulso(tGoverna, 0.8, 5, S.tl), pulso(tQuebra, 0.6, 4, S.tl), pulso(tReinara, 0.8, 5, S.tl));
      const yy = lerp(ZY - 330, ZY + 8, ease.outCubic(smooth(tGoverna - 0.4, tGoverna + 1.8, S.tl)));
      S2.cetro(ctx, ZX + 175, yy, 0.82, { alfa: a, brilho: p, t: S.t });
    }
    function pomba(ctx, S, x, y, s, fase, rot, dir) {
      G.Personagens.pomba(ctx, S, x, y, s, { fase: S.t * 9 + fase, bate: Math.sin(S.t * 9 + fase), rot: rot || 0, dir: dir || 1 });
    }
    function pombas(ctx, S) {
      const tl = S.tl;
      // a pomba que desce sobre a coroa, quando o Filho é declarado
      for (const t0 of [tFilho[0], tFilho[3]]) {
        const u = (tl - t0) / 8.5;
        if (u < 0 || u > 1) continue;
        const y1 = coroaY(tl) - 70, desce = ease.outCubic(smooth(0, 0.4, u)), sobe = smooth(0.62, 1, u);
        const x = lerp(CX + 190, CX, desce) + 380 * sobe, y = lerp(-40, y1, desce) - 260 * sobe;
        ctx.save(); ctx.globalAlpha *= 1 - 0.6 * smooth(0.85, 1, u);
        brilhoRadial(ctx, x, y, 80, K.luzOuro, 0.35);
        pomba(ctx, S, x, y, 0.95, 0, -0.15 + 0.5 * sobe, 1);
        ctx.restore();
      }
      // pombas soltas quando as correntes se rompem e na bem-aventurança
      for (const [t0, n, x0] of [[tCadeias + 0.4, 6, 960], [tBem[0] + 0.5, 7, ZX - 100], [tConfiam - 1, 5, ZX]]) {
        const u = (tl - t0) / 11;
        if (u < 0 || u > 1) continue;
        for (let j = 0; j < n; j++) {
          const v = clamp(u * 1.15 - j * 0.04), x = x0 - 340 + 700 * hash1(j * 3.3 + t0) + 300 * v * (j % 2 ? 1 : -1) * 0.8, y = SOLO - 200 - 620 * ease.outCubic(v) + 20 * Math.sin(S.t * 2 + j);
          ctx.save(); ctx.globalAlpha *= Math.sin(Math.PI * Math.min(1, v)) * 1;
          pomba(ctx, S, x, y, 0.55 + 0.12 * hash1(j + t0), j * 2, -0.3, j % 2 ? 1 : -1);
          ctx.restore();
        }
      }
    }
    function ondaTerra(ctx, S) {
      const ev = [...tNacoes, tConfins[0], tConfins[1], tReino, tQuebra];
      for (const t0 of ev) {
        const u = (S.tl - t0 - 0.2) / 4.2;
        if (u < 0 || u > 1) continue;
        const forte = (t0 === tReino || t0 === tQuebra) ? 1.2 : 0.8, r = 140 + 2300 * ease.outCubic(u);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = css(K.luzOuro, 0.34 * forte * (1 - u)); ctx.lineWidth = 3 + 5 * (1 - u);
        ctx.beginPath(); ctx.ellipse(ZX, SOLO + 18, r, r * 0.1, 0, 0, TAU); ctx.stroke();
        ctx.strokeStyle = css(K.luz, 0.35 * forte * (1 - u)); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(ZX, SOLO + 18, r * 0.94, r * 0.094, 0, 0, TAU); ctx.stroke();
        ctx.restore();
      }
    }

    // ---------------------------------------------------------------- os que se levantam: reis e soldados
    const REB = [
      // reis (coroa, barba), da frente para trás
      { id: 'k1', rei: true, tipo: 'vizinho', esc: 1.12, dy: 20, x1: 700, x2: 760, te: tReis - 0.7, d: 0.0 },
      { id: 'k2', rei: true, tipo: 'aldeao', cor: H('#e8bcd8'), barba: true, esc: 1.08, dy: 34, x1: 560, x2: 900, te: tReis - 0.3, d: 0.5 },
      { id: 'k3', rei: true, tipo: 'aldeao', cor: H('#bcc7f0'), barba: true, esc: 1.1, dy: 12, x1: 430, x2: 1040, te: tReis + 0.1, d: 1.0 },
      { id: 'k4', rei: true, tipo: 'aldeao', cor: H('#cfe6c6'), barba: true, esc: 1.06, dy: 40, x1: 310, x2: 1180, te: tReis + 0.5, d: 1.5 },
      // soldados (lanças)
      { id: 's1', lanca: true, tipo: 'aldeao', cor: H('#c9c4dc'), esc: 1.0, dy: -22, x1: 640, x2: 690, te: tPovos - 0.9, d: 1.8 },
      { id: 's2', lanca: true, tipo: 'aldeao', cor: H('#d9c9c2'), esc: 0.98, dy: -30, x1: 520, x2: 830, te: tPovos - 0.5, d: 2.3 },
      { id: 's3', lanca: true, tipo: 'aldeao', cor: H('#bdcbd8'), esc: 1.0, dy: -20, x1: 390, x2: 970, te: tPovos - 0.1, d: 2.8 },
      { id: 's4', lanca: true, tipo: 'aldeao', cor: H('#cfc2d6'), esc: 0.99, dy: -28, x1: 270, x2: 1110, te: tPovos + 0.3, d: 3.3 },
    ];
    const BAND = [{ x: 600, cor: H('#e9b6c6'), lado: 1 }, { x: 460, cor: H('#bfc9ee'), lado: -1 }, { x: 330, cor: H('#f0d29a'), lado: 1 }];
    const PUSH = 95;
    const entrada = (q, tl) => lerp(-240 - (q.rei ? 0 : 60), q.x1, ease.outCubic(smooth(q.te, q.te + 6.2, tl)));
    const xReb = (q, tl) => {
      let x = entrada(q, tl);
      x -= PUSH * ease.outCubic(smooth(tReino, tReino + 2.2, tl)) * (1 - smooth(tPrud - 1, tPrud + 0.5, tl));
      return lerp(x, q.x2, ease.inOutSine(smooth(tPrud + q.d, tPrud + q.d + 5.2, tl)));
    };
    // posição da cabeça (coordenadas locais da pessoa, base nos pés), segundo o mesmo desenho da pessoa
    const cabeca = (sent, ol) => {
      const quad = lerp(-96, -30, sent), ang = -0.34 * ol;
      return [lerp(2, -4, sent) + 2 + Math.sin(ang) * 27.7, quad - 64 - 6.8 - Math.cos(ang) * 27.7 - 14];
    };
    function rebeldes(ctx, S) {
      const tl = S.tl;
      const ord = REB.map((q) => ({ q, x: xReb(q, tl) })).sort((a, b) => a.q.dy - b.q.dy);
      const pos = {};
      for (const { q, x } of ord) pos[q.id] = x;
      const kneel = (q) => smooth(tPrud + q.d + 4.5, tPrud + q.d + 6.2, tl);
      // bandeiras fincadas
      const bandA = win(tPovos + 0.5, tPovos + 2, tQuebra - 0.2, tQuebra + 0.6, tl), rasga = smooth(tQuebra, tQuebra + 2.6, tl);
      const empurra = ease.outCubic(smooth(tReino, tReino + 2.2, tl));
      const vento = Math.max(0.25 + 0.5 * S.storm, win(tReino - 0.3, tReino + 0.8, tReino + 3.5, tReino + 6, tl));
      const tudoSome = 1 - smooth(tQuebra + 2.5, tQuebra + 4.4, tl);
      if (tl > tPovos) for (const b of BAND) S2.bandeira(ctx, b.x - PUSH * empurra, SOLO - 18, 1.0, { alfa: bandA * (rasga > 0.01 ? tudoSome : 1), t: S.t, vento, rasga, cor: b.cor, lado: b.lado });
      for (const { q, x } of ord) {
        if (x < -260 || x > S.W + 200) continue;
        const sent = kneel(q), vx = (xReb(q, tl + 0.05) - xReb(q, tl - 0.05)) / 0.1, push = smooth(tReino, tReino + 0.8, tl) * (1 - smooth(tReino + 2.6, tReino + 4.6, tl));
        const andar = clamp(vx / 46) * (1 - push) * (1 - sent), y = SOLO + q.dy;
        const jab = 0.5 + 0.5 * Math.sin(S.t * 3.2 + q.d * 2);
        const bracosRebeldes = win(tReis + 3.2, tReis + 3.9, tReino - 0.2, tReino + 0.6, tl) * (0.55 + 0.45 * jab) * (q.rei ? 0.8 : 1);
        const alegria = Math.max(pulso(tTremor[0], 0.7, 3.4, tl), pulso(tTremor[1], 0.7, 3.4, tl));
        const oracao = Math.max(win(tTemor[0] - 0.3, tTemor[0] + 0.5, tTremor[0] - 0.4, tTremor[0] + 0.2, tl), win(tTemor[1] - 0.3, tTemor[1] + 0.5, tTremor[1] - 0.4, tTremor[1] + 0.2, tl));
        const beija = win(tBeijem - 0.5, tBeijem + 0.7, tBeijem + 3.3, tBeijem + 5, tl);
        const olhar = Math.max(0.35 * win(tReino, tReino + 1.5, tPrud, tPrud + 1, tl), 0.8 * pulsos(tFilho, 0.9, 4, tl) * sent, 0.5 * alegria);
        const opc = {
          tipo: q.tipo, dir: 1, andar, fase: (x / 92) * TAU, sentado: sent * 0.9, t: S.t, esc: q.esc,
          bracos: Math.max(bracosRebeldes * (1 - sent), alegria * sent), maos: Math.max(oracao * sent, 0), olhar,
          inclina: -0.22 * push + 0.42 * beija * sent,
        };
        if (q.cor) opc.cor = q.cor;
        if (q.barba) opc.barba = true;
        PN.pessoa(ctx, x, y, q.esc, opc);
        // coroa: na cabeça até os reis serem chamados à prudência; depois no chão, aos pés, brilhando
        if (q.rei) {
          const [hx, hy] = cabeca(sent * 0.9, olhar), inc = opc.inclina, cs = Math.cos(inc), sn = Math.sin(inc);
          const wx = x + (hx * cs - hy * sn) * q.esc, wy = y + (hx * sn + hy * cs) * q.esc + 10 * q.esc;
          const solta = ease.inOutSine(smooth(tPrud + q.d - 0.3, tPrud + q.d + 2.6, tl));
          const gx = x + 72 * q.esc, gy = y - 4;
          S2.coroa(ctx, lerp(wx, gx, solta), lerp(wy - 4, gy, solta) - Math.sin(Math.PI * solta) * 40, lerp(0.5, 0.42, solta), { brilho: 0.9 * solta, rot: lerp(0.0, 0, solta) });
        }
        // lança
        if (q.lanca) {
          const alta = win(tPovos + 0.5, tPovos + 1.3, tReino - 0.3, tReino + 0.6, tl);
          const qb = smooth(tQuebra, tQuebra + 1.5, tl), some = 1 - smooth(tQuebra + 2.5, tQuebra + 4.2, tl);
          if (some > 0.01) S2.lanca(ctx, x + 30 * q.esc, y - 6 + (1 - alta) * 14 + (jab * 6 * alta), 0.9, { rot: 0.06 + 0.2 * alta * jab, quebra: qb, alfa: some });
        }
      }
      // correntes que ligam os rebeldes (reis e soldados), até o momento em que as cadeias se rompem
      const cadA = smooth(tPovos + 2.5, tPovos + 4, tl) * (1 - smooth(tCadeias + 1.4, tCadeias + 2.6, tl)), qc = smooth(tCadeias, tCadeias + 1.3, tl);
      if (cadA > 0.01) {
        for (const grupo of [['k1', 'k2', 'k3', 'k4'], ['s1', 's2', 's3', 's4']]) {
          const ps = grupo.map((id) => REB.find((r) => r.id === id));
          ps.sort((a, b) => pos[a.id] - pos[b.id]);
          for (let i = 0; i < ps.length - 1; i++) {
            const a = ps[i], b = ps[i + 1];
            S2.corrente(ctx, pos[a.id] + 20 * a.esc, SOLO + a.dy - 92 * a.esc, pos[b.id] - 6 * b.esc, SOLO + b.dy - 92 * b.esc, { alfa: cadA, sag: 24 + 30 * qc, quebra: qc, elo: 8 });
          }
        }
      }
      // estilhaços de luz quando as lanças e as bandeiras se quebram, e quando as correntes se rompem
      for (const [t0, f] of [[tQuebra, 1], [tCadeias, 0.8]]) {
        const u = (tl - t0) / 2.4;
        if (u < 0 || u > 1) continue;
        const fontes = f === 1 ? [...REB.filter((r) => r.lanca).map((r) => [pos[r.id] + 30, SOLO + r.dy - 170]), ...BAND.map((b) => [b.x - PUSH * empurra, SOLO - 230])]
          : REB.filter((r) => r.rei).map((r) => [pos[r.id] + 14, SOLO + r.dy - 92]);
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        fontes.forEach(([fx, fy], i) => {
          for (let j = 0; j < 7; j++) {
            const a = (j / 7) * TAU + i, v = ease.outCubic(u), x = fx + Math.cos(a) * 110 * v, y = fy + Math.sin(a) * 90 * v + 140 * u * u;
            S2.estilhaco(ctx, x, y, 12 + 7 * hash1(i * 7 + j), a + u * 6, (1 - u) * 0.95);
          }
          brilhoRadial(ctx, fx, fy, 120 * (1 - u * 0.5), K.luzOuro, 0.5 * (1 - u));
        });
        ctx.restore();
      }
    }

    // ---------------------------------------------------------------- as nações a caminho (peregrinos)
    const rP = mulberry32(14);
    const CORES = ['#f4c8b0', '#f9e1a0', '#c8d6f6', '#c9e6d4', '#f2c6e0', '#d9ccf2', '#f7d9b0', '#bfe3ea'];
    const PIL = Array.from({ length: 26 }, (_, i) => {
      const onda = i < 15 ? 0 : 1, lado = i % 3 === 2 ? 1 : -1;
      const j = onda ? i - 15 : i;
      return {
        i, onda, lado, esc: 0.5 + rP() * 0.1, y: SOLO - 74 + rP() * 30, cor: H(CORES[i % CORES.length]), veu: i % 4 === 1,
        x0: lado < 0 ? -90 - rP() * 160 : W + 90 + rP() * 160, x1: lado < 0 ? ZX - 420 + (j % 8) * 56 : ZX + 360 + (j % 5) * 52,
        t0: (onda ? tPede[1] + 0.6 : tPede[0] + 0.6) + j * 0.6, dur: 15 + rP() * 6,
      };
    });
    function peregrinos(ctx, S) {
      const tl = S.tl, noiteL = S.noite > 0.45;
      for (const p of PIL) {
        if (tl < p.t0 - 0.2) continue;
        const v = clamp((tl - p.t0) / p.dur), x = lerp(p.x0, p.x1, ease.inOutSine(v)), vx = (lerp(p.x0, p.x1, ease.inOutSine(clamp((tl + 0.05 - p.t0) / p.dur))) - lerp(p.x0, p.x1, ease.inOutSine(clamp((tl - 0.05 - p.t0) / p.dur)))) / 0.1;
        const chegou = smooth(0.92, 1, v), senta = smooth(tBem[1] - 0.5, tBem[1] + 1.4, tl) * chegou;
        const a = smooth(p.t0 - 0.2, p.t0 + 0.8, tl);
        const dir = p.lado < 0 ? 1 : -1;
        if (x < -120 || x > S.W + 120) continue;
        const opc = { tipo: 'aldeao', cor: p.cor, dir, andar: clamp(Math.abs(vx) / 40) * (1 - chegou), fase: (x * dir / 92) * TAU, sentado: senta, olhar: 0.7 * chegou, alfa: a, t: S.t, esc: p.esc };
        if (p.veu) { opc.veu = true; opc.manto = H('#fff5e0'); }
        if (noiteL) { opc.segura = 'lanterna'; opc.acesa = clamp(S.noite * 1.4 - 0.2); }
        PN.pessoa(ctx, x, p.y, p.esc, opc);
      }
    }
    // lanternas que sobem e viram estrelas (os que confiam)
    function lanternas(ctx, S) {
      const tl = S.tl;
      if (tl < tBem[1] - 0.5) return;
      for (let i = 0; i < 22; i++) {
        const t0 = tBem[1] - 0.5 + i * 0.45, u = (tl - t0) / 12;
        if (u < 0 || u > 1) continue;
        const x = ZX - 520 + hash1(i * 3.1) * 1100 + Math.sin(tl * 0.7 + i) * 26, y = lerp(SOLO - 60, 90 + hash1(i * 5.7) * 220, ease.outCubic(u) * 0.97), a = Math.sin(Math.PI * Math.min(1, u * 1.05)) * 0.95;
        const estrela = smooth(0.72, 1, u);
        ctx.save(); ctx.globalAlpha *= a;
        if (estrela < 0.98) { ctx.globalAlpha *= 1 - estrela; PN.lanternaCeu(ctx, x, y, 0.7 * (1 - 0.4 * estrela), 1, S.t); }
        ctx.restore();
        if (estrela > 0.02) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = css(K.luz, a * estrela); brilho4(ctx, x, y, 12 * estrela); ctx.restore(); }
      }
    }
    function petalas(ctx, S) {
      const ev = [[tTremor[0], 4.5, 960], [tTremor[1], 4.5, 960], [tBem[0], 8, ZX - 300]];
      const cores = [K.rosa, K.luzOuro, K.lilas, K.luz];
      for (const [t0, d, x0] of ev) {
        const u = (S.tl - t0) / d;
        if (u < 0 || u > 1) continue;
        for (let j = 0; j < 34; j++) {
          const v = clamp(u * 1.2 - hash1(j * 2.3) * 0.2), x = x0 - 560 + hash1(j * 7.7 + t0) * 1120 + Math.sin(v * 5 + j) * 28, y = SOLO - 640 + v * 760;
          ctx.fillStyle = css(cores[j % 4], Math.sin(Math.PI * v) * 0.9); ctx.beginPath(); ctx.ellipse(x, y, 6, 3.4, S.t * 2 + j, 0, TAU); ctx.fill();
        }
      }
    }
    function vagalumes(ctx, S) {
      const f = S.noite * 0.9 * (1 - S.storm);
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
      const tl = S.tl, Wd = S.W;
      S.hora = horaEm(tl); S.storm = tempestade(tl); S.ceu = ceuEm(S.hora);
      S.ceu = { top: ml(S.ceu.top, H('#858299'), 0.62 * S.storm), mid: ml(S.ceu.mid, H('#a29fb8'), 0.58 * S.storm), hor: ml(S.ceu.hor, H('#c9bfcc'), 0.45 * S.storm) };
      S.noite = noiteF(S.hora);
      S.luzSiao = Math.max(0.25 * smooth(tRei[0], tRei[0] + 4, tl), pulsos(tFilho, 0.9, 5, tl), 0.8 * win(tReino, tReino + 2, tAbalado + 8, tAbalado + 14, tl), 0.7 * pulso(tReinara, 0.8, 5, tl));
      S.tomTexto = 1 - smooth(0.32, 0.62, Math.max(S.noite * 0.9, S.storm * 0.85));
      ceuFundo(ctx, S);
      estrelas(ctx, S);
      corpoCeleste(ctx, S);
      nuvens(ctx, S);
      tempestadeCeu(ctx, S);
      serra(ctx, S, MONT.longe);
      cidades(ctx, S);
      serra(ctx, S, MONT.meio);
      luzDoCeu(ctx, S);
      monte(ctx, S);
      cupula(ctx, S);
      chao(ctx, S);
      relva(ctx, S);
      ondaTerra(ctx, S);
      peregrinos(ctx, S);
      rebeldes(ctx, S);
      cetroDeLuz(ctx, S);
      coroaDeLuz(ctx, S);
      pombas(ctx, S);
      petalas(ctx, S);
      lanternas(ctx, S);
      relampagos(ctx, S);
      vagalumes(ctx, S);
      // a tempestade escurece o quadro todo, de leve
      if (S.storm > 0.02) { ctx.fillStyle = css(H('#6f6c8c'), 0.16 * S.storm); ctx.fillRect(-40, -40, Wd + 80, ALT + 80); }
    }

    return { espelho: false, estado: () => ({ fx: 0.5, calor: 0, peso: 0, nevoa: 0, vento: 0.2, solY: 400, solForca: 1, raios: 0, motes: 0, flash: 0 }), desenhar };
  }

  G.TemaSalmo2 = { criar };
})(window);
