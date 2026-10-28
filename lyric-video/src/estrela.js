// Tema "Estrela de Jacó" (Números 24:17), criado do zero a partir da letra inteira (a imagem da música é só um fundo preto),
// para o vídeo final em 16:9. Uma noite no deserto, no acampamento das tendas de Jacó: um vidente de pé numa rocha vê, de
// longe, uma estrela pequena que ainda não é agora. A promessa e a esperança sobem do chão; a força dos homens (lanças e
// bandeiras) se desfaz diante da Palavra; a estrela se levanta de Jacó e sobe no céu; um cetro de ouro se ergue de Israel
// e uma coroa de luz o encontra (o Rei); a luz da estrela alcança as nações, a aliança aparece como um arco de cores, e o
// dia amanhece sobre o acampamento. Deus não é retratado: só luz. Os instantes saem do texto da legenda; os trechos que os
// disparam ficam em `animacao.json`, na pasta da música (`gatilhos`), e não neste repositório público.
(function (G) {
  'use strict';
  const { clamp, lerp, smooth, mod, css, rgb, hash1, mulberry32, ease } = G.U;
  const R91 = G.Seres91, PN = G.SeresPN, B = G.SeresBS, S2 = G.SeresS2, M = G.SeresM, K = M.K, ml = R91.ml, brilhoRadial = R91.brilhoRadial, brilho4 = R91.brilho4;
  const ALT = 1080, TAU = Math.PI * 2;
  const SOLO = 0.885 * ALT;
  const HORSKY = 0.74 * ALT;
  const semNikud = (s) => s.normalize('NFD').replace(/[֑-ׇ]/g, '').replace(/[̀-ͯ]/g, '');
  const H = (hex) => rgb(hex);

  const PADRAO = {
    vejo: [11.69, 34.99, 286.48], contemplo: [17.67, 39.93, 291.68], promessa: [46.0], esperanca: [52.14], forcas: [57.13], poder: [61.8], anunciado: [65.39], palavra: [68.74],
    estrelaJ: [75.52, 87.85, 91.64, 100.09, 112.62, 154.67, 166.63, 192.57, 198.55, 231.66, 244.7, 256.48, 269.48, 299.1], cetro: [82.54, 95.23, 105.92, 161.25, 172.7, 204.22, 207.45, 221.93, 238.49, 251.77, 262.54, 306.1],
    rei: [119.32, 179.4, 225.6, 274.27], virade: [129.37], levanta: [131.53], dominio: [134.88], luzNacoes: [138.15], promessaNao: [141.02], alianca: [144.45], falou: [147.33], certamente: [150.6], estrelaVira: [216.82, 220.01],
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
    const tVejo = TT('vejo'), tContemplo = TT('contemplo'), tPromessa = T('promessa'), tEsperanca = T('esperanca'), tForcas = T('forcas'), tPoder = T('poder'), tAnunciado = T('anunciado'), tPalavra = T('palavra');
    const tEstrelaJ = TT('estrelaJ'), tCetro = TT('cetro'), tRei = TT('rei'), tVirade = T('virade'), tLevanta = T('levanta'), tDominio = T('dominio'), tLuzNacoes = T('luzNacoes');
    const tPromessaNao = T('promessaNao'), tAlianca = T('alianca'), tFalou = T('falou'), tCerto = T('certamente'), tEstrelaVira = TT('estrelaVira');
    const win = (a, b, c, d, t) => smooth(a, b, t) * (1 - smooth(c, d, t));
    const pulso = (t0, sobe, desce, t) => win(t0 - 0.1, t0 + sobe, t0 + sobe + 0.5, t0 + sobe + desce, t);
    const pulsos = (arr, sobe, desce, t) => arr.reduce((m, t0) => Math.max(m, pulso(t0, sobe, desce, t)), 0);
    const tDarach = tEstrelaJ[0];

    // ---------------------------------------------------------------- horas: noite no deserto, o amanhecer no fim
    const HS = [
      [0, 0.8], [tDarach, 1.8], [tCetro[0], 2.2], [tRei[0], 2.9], [tAlianca, 3.4], [tRei[1], 3.9], [tEstrelaVira[0] - 4, 4.3], [tRei[2] - 2, 4.7], [tRei[2] + 6, 5.2], [tRei[3], 5.6], [tVejo[2], 5.9], [dur + 1, 6.4],
    ];
    const horaEm = (tl) => {
      let i = 0; while (i < HS.length - 2 && HS[i + 1][0] <= tl) i++;
      const [a, ha] = HS[i], [b, hb] = HS[i + 1];
      return lerp(ha, hb, clamp((tl - a) / Math.max(1e-6, b - a)));
    };

    // ---------------------------------------------------------------- a estrela: longe e pequena no começo; sobe de Jacó e fica grande; volta serena no fim
    const subida = (tl) => ease.inOutSine(smooth(tDarach - 0.6, tDarach + 16, tl));
    const estrelaPos = (tl) => {
      const u = subida(tl), fim = smooth(tVejo[2] - 2, tVejo[2] + 8, tl) * 0.5;
      const x = lerp(W * 0.86, W * 0.62, u), y = lerp(HORSKY - 130, 215, u) + 30 * fim;
      const grande = Math.max(pulsos(tEstrelaJ, 1.2, 4.5, tl), pulsos(tEstrelaVira, 1, 4, tl));
      return { x, y, s: lerp(0.24, 0.7, u) * (1 - 0.3 * fim) * (1 + 0.15 * grande), br: lerp(0.3, 0.55, u) + 0.45 * grande };
    };

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
        const l = Math.max(0.2, smooth(tLuzNacoes + i * 0.5, tLuzNacoes + i * 0.5 + 2.5, S.tl));
        ctx.save(); ctx.globalAlpha *= 0.85;
        S2.cidadeLonge(ctx, x, HORSKY + 26 + hash1(i * 1.9) * 16, 0.55 + 0.3 * hash1(i * 5.1), l * (0.4 + 0.6 * S.noite), i, tint);
        ctx.restore();
      }
    }
    const borda = (x) => 0.835 * ALT + 5 * Math.sin(x * 0.0057) + 2.5 * Math.sin(x * 0.019);

    function chao(ctx, S) {
      const Wd = S.W, y0 = 0.80 * ALT;
      const c1 = luzObj(S, '#ecd9bd', 1), c2 = luzObj(S, '#e4d2b4', 1), c3 = luzObj(S, '#d9d2b8', 1);
      const g = ctx.createLinearGradient(0, y0, 0, ALT);
      g.addColorStop(0, css(c1)); g.addColorStop(0.5, css(c2)); g.addColorStop(1, css(c3));
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-20, ALT + 20);
      for (let x = -20; x <= Wd + 20; x += 12) ctx.lineTo(x, borda(x));
      ctx.lineTo(Wd + 20, ALT + 20); ctx.closePath(); ctx.fill();
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
    const CAMPX = W * 0.5, FIREY = SOLO + 22;
    function estrelaNoCeu(ctx, S) {
      const e = estrelaPos(S.tl), a = smooth(4, 9, S.tl), dia = 1 - 0.85 * smooth(4.6, 6.0, S.hora);
      M.estrela(ctx, e.x, e.y + 8 * Math.sin(S.t * 0.8), e.s, { brilho: e.br, alfa: a * dia, t: S.t });
      const u = subida(S.tl);
      facho(ctx, e.x, e.y, CAMPX + 60, SOLO - 230, 10 + 30 * u, 60 + 220 * u, (0.05 + 0.22 * u * (0.5 + e.br * 0.5)) * a * dia, 0.7);
    }

    // ---------------------------------------------------------------- a promessa e a esperança sobem do chão; a força dos homens se desfaz
    function promessa(ctx, S) {
      const tl = S.tl;
      const a = win(tPromessa - 0.4, tPromessa + 2, tPalavra + 6, tPalavra + 9, tl);
      if (a > 0.01) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 26; i++) {
          const u = mod(tl * 0.12 + i * 0.137, 1), x = CAMPX - 380 + hash1(i * 3.3) * 760 + Math.sin(tl * 0.8 + i) * 18, y = lerp(SOLO - 10, 250, ease.outCubic(u));
          const al = a * Math.sin(Math.PI * u);
          brilhoRadial(ctx, x, y, 18, K.luzOuro, 0.5 * al); ctx.fillStyle = css(K.luz, 0.8 * al); brilho4(ctx, x, y, 5 + 3 * hash1(i));
        }
        ctx.restore();
      }
    }

    function forcasDosHomens(ctx, S) {
      const tl = S.tl;
      const f = win(tForcas - 0.6, tForcas + 1.6, tAnunciado - 0.3, tAnunciado + 2.5, tl);
      if (f > 0.01) {
        const quebra = smooth(tAnunciado - 0.2, tAnunciado + 2.2, tl), tint = tintF(S);
        ctx.save(); ctx.globalAlpha *= f;
        for (let i = 0; i < 4; i++) {
          const x = 520 + i * 190, y = SOLO - 40 + (i % 2) * 18;
          S2.cidadeLonge(ctx, x - 40, y, 1.5, 0, i + 20, tint);
          S2.bandeira(ctx, x + 60, y + 6, 0.62, { t: S.t, vento: 0.4, cor: [H('#e9b6c6'), H('#bfc9ee'), H('#f0d29a'), H('#cfc2d6')][i], rasga: quebra, lado: i % 2 ? -1 : 1 });
          S2.lanca(ctx, x + 110, y + 6, 0.75, { quebra, alfa: 1 });
        }
        ctx.restore();
      }
    }

    // ---------------------------------------------------------------- o cetro de Israel e a coroa do Rei
    const SCX = W * 0.80;
    function cetroECoroa(ctx, S) {
      const tl = S.tl, a = smooth(tCetro[0] - 0.4, tCetro[0] + 2.5, tl);
      if (a < 0.01) return;
      const p = pulsos(tCetro, 1, 4.5, tl), sobe = ease.outCubic(smooth(tCetro[0] - 0.4, tCetro[0] + 4, tl));
      S2.cetro(ctx, SCX, lerp(SOLO + 230, SOLO - 14, sobe), 1.0, { alfa: a, brilho: p, t: S.t });
      const c = Math.max(win(tRei[0] - 0.3, tRei[0] + 1.8, tRei[0] + 11, tRei[0] + 13, tl), win(tRei[1] - 0.3, tRei[1] + 1.8, tRei[1] + 11, tRei[1] + 13, tl),
        win(tRei[2] - 0.3, tRei[2] + 1.8, tRei[2] + 8, tRei[2] + 10, tl), win(tRei[3] - 0.3, tRei[3] + 1.8, tRei[3] + 10, tRei[3] + 12, tl));
      if (c > 0.01) S2.coroa(ctx, SCX, lerp(-60, SOLO - 300 - 18 * Math.sin(S.t * 1.4), ease.outCubic(c)), 1.6, { alfa: c, brilho: 0.4 + 0.6 * pulsos(tRei, 1, 5, tl) });
    }
    function alianca(ctx, S) {
      const a = Math.max(win(tAlianca - 0.3, tAlianca + 2.5, tAlianca + 9, tAlianca + 12, S.tl), 0.5 * smooth(tVejo[2] + 2, tVejo[2] + 8, S.tl));
      if (a < 0.01) return;
      ctx.save(); ctx.globalAlpha *= a * 0.75;
      const cores = ['#f6b8c4', '#fbd9a6', '#fdf0b0', '#c4ebcb', '#b9d6f6', '#d3c4f2'];
      for (let i = 0; i < cores.length; i++) { ctx.strokeStyle = css(H(cores[i]), 0.55); ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(CAMPX, SOLO + 40, 620 - i * 16, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke(); }
      ctx.restore();
    }
    function ondaTerra(ctx, S) {
      for (const t0 of [tLuzNacoes, tPromessaNao, tFalou, tCerto, tRei[1], tRei[2]]) {
        const u = (S.tl - t0 - 0.2) / 4.4;
        if (u < 0 || u > 1) continue;
        const r = 140 + 2300 * ease.outCubic(u);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = css(K.luzOuro, 0.34 * (1 - u)); ctx.lineWidth = 3 + 5 * (1 - u);
        ctx.beginPath(); ctx.ellipse(CAMPX, SOLO + 18, r, r * 0.1, 0, 0, TAU); ctx.stroke(); ctx.restore();
      }
    }

    // ---------------------------------------------------------------- o acampamento
    const TENDAS = [[250, 0.62], [470, 0.86], [690, 0.74], [1230, 0.78], [1450, 0.9], [1650, 0.7], [1840, 0.6]];
    const COR = ['#f4c8b0', '#f9e1a0', '#c8d6f6', '#c9e6d4', '#f2c6e0', '#d9ccf2', '#f7d9b0'];
    const GENTE = [[880, 30, 1, 0], [940, 44, 1, 1], [1010, 30, -1, 2], [1070, 44, -1, 3], [820, 14, 1, 4], [1130, 16, -1, 5]];
    function acampamento(ctx, S) {
      const tl = S.tl, luzT = 0.35 + 0.5 * S.noite;
      TENDAS.forEach(([x, s], i) => R91.tenda(ctx, x + Math.sin(S.t * 0.3 + i) * 0, SOLO - 24 + (i % 2) * 8, s, luzT));
      B.fogueira(ctx, CAMPX + 20, FIREY, 1.1, { forca: 0.28 + 0.3 * S.noite, t: S.t });
      const olhar = Math.max(pulsos(tEstrelaJ, 1, 4, tl), pulsos(tRei, 1, 5, tl), 0.8 * smooth(tDarach, tDarach + 8, tl));
      const bracos = Math.max(pulsos(tRei, 0.8, 4, tl), pulso(tLuzNacoes, 1, 4, tl), pulso(tAlianca, 1, 4, tl)) * 0.9;
      for (const [x, dy, dir, i] of GENTE) PN.pessoa(ctx, x, SOLO + dy, 1.0, { tipo: 'aldeao', cor: H(COR[i]), dir, sentado: 0.85 * (1 - 0.7 * bracos), olhar: 0.6 * olhar, bracos, t: S.t, barba: i % 2 === 0, veu: i === 3, manto: i === 3 ? H('#fff5e0') : undefined });
      // o vidente, de pé numa rocha à esquerda, olha a estrela de longe
      B.rocha(ctx, 215, SOLO + 28, 1.7, 7);
      PN.pessoa(ctx, 215, SOLO - 36, 1.06, { tipo: 'vizinho', dir: 1, olhar: 0.75, t: S.t, maos: 0.2 });
      M.cajado(ctx, 246, SOLO - 34, 0.95, 0.05);
    }
    function pomba(ctx, S, x, y, s, fase, rot, dir) {
      G.Personagens.pomba(ctx, S, x, y, s, { fase: S.t * 9 + fase, bate: Math.sin(S.t * 9 + fase), rot: rot || 0, dir: dir || 1 });
    }
    function pombas(ctx, S) {
      const t0 = tRei[3] + 2, u = (S.tl - t0) / 12;
      if (u < 0 || u > 1) return;
      for (let j = 0; j < 6; j++) {
        const v = clamp(u * 1.15 - j * 0.04), x = CAMPX - 300 + 600 * hash1(j * 3.3) + 300 * v * (j % 2 ? 1 : -1) * 0.8, y = SOLO - 200 - 560 * ease.outCubic(v) + 20 * Math.sin(S.t * 2 + j);
        ctx.save(); ctx.globalAlpha *= Math.sin(Math.PI * Math.min(1, v)); pomba(ctx, S, x, y, 0.55, j * 2, -0.3, j % 2 ? 1 : -1); ctx.restore();
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
      S.tomTexto = 1 - smooth(0.32, 0.62, S.noite * 0.9);
      ceuFundo(ctx, S);
      estrelas(ctx, S);
      corpoCeleste(ctx, S);
      nuvens(ctx, S);
      estrelaNoCeu(ctx, S);
      serra(ctx, S, MONT.longe);
      cidades(ctx, S);
      serra(ctx, S, MONT.meio);
      promessa(ctx, S);
      alianca(ctx, S);
      chao(ctx, S);
      relva(ctx, S);
      forcasDosHomens(ctx, S);
      ondaTerra(ctx, S);
      acampamento(ctx, S);
      cetroECoroa(ctx, S);
      pombas(ctx, S);
      vagalumes(ctx, S);
    }

    return { espelho: false, estado: () => ({ fx: 0.5, calor: 0, peso: 0, nevoa: 0, vento: 0.2, solY: 400, solForca: 1, raios: 0, motes: 0, flash: 0 }), desenhar };
  }

  G.TemaEstrela = { criar };
})(window);
