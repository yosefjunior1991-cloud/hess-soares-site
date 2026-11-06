// Tema "Adon Olam" (Senhor do mundo), criado do zero a partir da letra inteira (a imagem da música é só um fundo preto), para o
// vídeo final em 16:9. Antes da criação só há o vazio e a coroa de luz do Rei (Deus não é retratado: só luz e coroa); a criação
// nasce em estrelas, galáxia e planetas que giram, e tudo se encerra enquanto o reino permanece. Amanhece sobre a terra e o povo
// das nações caminha e se reúne em adoração sob a coroa de luz; no refúgio da rocha, em meio à tempestade, a mão de luz sustenta e
// o coração descansa; a noite de sono do acampamento sob as estrelas e o amanhecer; o povo caminha de novo ao sol e o clipe volta
// ao cosmos. Os instantes saem do texto da legenda; os trechos que os disparam ficam em `animacao.json`, na pasta da música
// (`gatilhos`), e não neste repositório público.
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
    reinou: [10.97], criada: [17.43, 262.86, 288.71], tempo: [28.7], criacao: [35.62], reinavas: [42.17], nada: [47.35], encerrar: [51.34, 55.09], perm: [61.4],
    rei: [66.18], gloria: [73.36], depois: [78.95], soele: [85.73, 275.38, 301.24], coro: [91.87, 104.64, 168.55, 180.49, 255.52, 268.44, 281.71, 294.37],
    reinasempre: [98.98, 175.73], universo: [112.22, 188.98], redentor: [130.17], rocha: [136.48], meudeus: [142.94], rochaaf: [149.8], maos: [156.02], descansa: [162.33],
    entrego: [202.54, 229.75], dormir: [208.68], corpo: [215.15], adonai: [220.17], adormecer: [236.37], pertencem: [242.67], contigo: [249.77], solo: [314.16, 321.02], naotemerei: [335.75],
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
    const tReinou = T('reinou'), tCriada = T('criada'), tTempo = T('tempo'), tCria = T('criacao'), tReinavas = T('reinavas'), tNada = T('nada'), tEnc = TT('encerrar'), tPerm = T('perm');
    const tRei = T('rei'), tGloria = T('gloria'), tDepois = T('depois'), tSoEle = TT('soele'), tCoro = TT('coro'), tUniv = TT('universo');
    const tRedentor = T('redentor'), tRocha = T('rocha'), tMeuDeus = T('meudeus'), tRochaAf = T('rochaaf'), tMaos = T('maos'), tDescansa = T('descansa');
    const tEntrego = TT('entrego'), tDormir = T('dormir'), tCorpo = T('corpo'), tAdonai = T('adonai'), tAdorm = T('adormecer'), tPert = T('pertencem'), tContigo = T('contigo');
    const tSolo = TT('solo'), tPaz = tUniv[0];
    const win = (a, b, c, d, t) => smooth(a, b, t) * (1 - smooth(c, d, t));
    const pulso = (t0, sobe, desce, t) => win(t0 - 0.1, t0 + sobe, t0 + sobe + 0.5, t0 + sobe + desce, t);
    const pulsos = (arr, sobe, desce, t) => arr.reduce((m, t0) => Math.max(m, pulso(t0, sobe, desce, t)), 0);
    const tSit = tRochaAf - 1.5, tIni2 = tDescansa + 2, tAcorda = tPert + 1;
    // fase da paisagem: 1 = o povo se reúne; 2 = depois do refúgio; 3 = depois da noite
    const faseEm = (tl) => (tl < tRedentor ? 1 : tl < tEntrego[0] - 1 ? 2 : 3);

    // ---------------------------------------------------------------- horas: noite do vazio, aurora da terra, dia, tempestade, entardecer, noite de sono, amanhecer, dia
    const HS = [
      [0, 4.0], [tPerm, 4.6], [tPerm + 8, 5.6], [tGloria, 7.0], [tUniv[0], 10.0], [tUniv[0] + 10, 11.4], [tRedentor - 4, 12.4], [tRochaAf, 13.2], [tMaos, 14.6], [tCoro[2] - 1, 16.6],
      [tCoro[3], 18.0], [tUniv[1], 19.4], [tEntrego[0], 21.5], [tCorpo, 23.5], [tAdonai + 6, 26.0], [tAdorm, 27.2], [tPert, 29.0], [tCoro[4] + 3, 30.8], [tCoro[5], 32.0],
      [tSoEle[2] - 10, 35.0], [tSolo[0], 37.0], [dur + 1, 38.5],
    ].filter((k, i, a) => i === 0 || k[0] > a[i - 1][0]);
    const horaEm = (tl) => {
      let i = 0; while (i < HS.length - 2 && HS[i + 1][0] <= tl) i++;
      const [a, ha] = HS[i], [b, hb] = HS[i + 1];
      return lerp(ha, hb, clamp((tl - a) / Math.max(1e-6, b - a)));
    };
    const stormEm = (tl) => win(tRedentor - 4, tRedentor, tRochaAf, tRochaAf + 4, tl) * 0.85;
    const cA = (tl) => Math.max(1 - smooth(tPerm + 0.8, tPerm + 7, tl), smooth(tSolo[0] + 4, tSolo[0] + 18, tl));       // o cosmos cobre o começo e o fim

    // ---------------------------------------------------------------- a marcha: o mundo rola sempre, só desacelera no refúgio e no acampamento
    const PASSO = 1 / 30, V = 105, TX = 640;
    const KN = [[0, 0.3], [tPerm + 4, 0.3], [tGloria, 0.45], [tUniv[0], 0.45], [tRedentor - 4, 0.5], [tSit - 3, 0.5], [tSit + 3, 0.1], [tDescansa + 2, 0.1], [tIni2 + 3, 0.45], [tCoro[3], 0.4],
      [tEntrego[0] - 5, 0.3], [tEntrego[0] + 2, 0.3], [tPert, 0.3], [tContigo + 1, 0.4], [tCoro[5], 0.5], [tSoEle[2], 0.45], [dur + 2, 0.4]].filter((k, i, a) => i === 0 || k[0] > a[i - 1][0]);
    const velEm = (t) => {
      if (t <= KN[0][0]) return KN[0][1];
      for (let i = 0; i < KN.length - 1; i++) if (t < KN[i + 1][0]) return lerp(KN[i][1], KN[i + 1][1], smooth(KN[i][0], KN[i + 1][0], t));
      return KN[KN.length - 1][1];
    };
    const nTab = Math.ceil(dur / PASSO) + 3, rolTab = new Float64Array(nTab);
    for (let i = 1; i < nTab; i++) rolTab[i] = rolTab[i - 1] + V * velEm((i - 1) * PASSO) * PASSO;
    const rolEm = (t) => { const x = clamp(t / PASSO, 0, nTab - 1.001), i = Math.floor(x); return lerp(rolTab[i], rolTab[i + 1], x - i); };
    const TXK = [[0, 640], [tContigo + 8, 640], [tSoEle[0], 760], [tSoEle[1], 950], [tSolo[0], 1150]].filter((k, i, a) => i === 0 || k[0] > a[i - 1][0]);
    const txEm = (t) => {
      if (t <= TXK[0][0]) return TXK[0][1];
      for (let i = 0; i < TXK.length - 1; i++) if (t < TXK[i + 1][0]) return lerp(TXK[i][1], TXK[i + 1][1], smooth(TXK[i][0], TXK[i + 1][0], t));
      return TXK[TXK.length - 1][1];
    };
    const X_ROCHA = rolEm(tSit + 2) + TX + 270, X_CAMP = rolEm(tEntrego[0] + 6) + TX;
    const zoomEm = (t) => 1 + 0.1 * smooth(tSit, tDescansa + 4, t) + 0.1 * smooth(tEntrego[0], tPert, t) * (1 - smooth(tPert, tPert + 4, t));
    const tZ = [];  // (reservado)
    const ANG = 0;

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
        if (Math.abs(wx - X_CAMP) < 1300 || Math.abs(wx - X_ROCHA) < 520) continue;
        const sx = wx - cam, h = hash1(c * 8.1);
        PN.casa(ctx, sx, borda(sx) + 36, 0.55 + 0.2 * h, { w: 170 + 50 * h, h: 130 + 40 * h, cor: H(CASAS[c & 3 & 3] || CASAS[0]), luz: S.noite * 0.9, t: S.t });
      }
    }
    // ---------------------------------------------------------------- o cosmos: o vazio com a coroa de luz, a criação que nasce e se encerra, e a volta no final
    const vivo = (tl) => (tl < 150 ? smooth(tCria, tCria + 7, tl) * (1 - smooth(tEnc[0] + 1, tPerm - 1, tl)) : smooth(tSolo[0] + 6, tSolo[0] + 22, tl));
    const coroaA = (tl) => (tl < 150 ? smooth(tReinou - 1.5, tReinou + 2.5, tl) : 1);
    const ANEIS = [tReinou, tCriada, tTempo, tCria, tReinavas, tNada, tPerm, ...tSoEle.slice(1), tSolo[0], tSolo[1]];
    const rS = mulberry32(17);
    const FUNDO = Array.from({ length: 170 }, () => ({ u: rS(), v: rS() * 0.92, r: 0.7 + Math.pow(rS(), 3) * 2.4, w: 0.6 + rS() * 2, f: rS() * TAU }));
    const PLAN = [[250, 38, 22, '#f4c8b0', 0.4], [380, 52, 31, '#cde6f2', 2.1], [520, 70, 38, '#e9c6f0', 3.7], [680, 96, 26, '#f9e1a0', 5.0], [830, 130, 44, '#bfe3d4', 1.2]];
    function esfera(ctx, x, y, r, cor, terra) {
      const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
      g.addColorStop(0, css(ml(H(cor), K.branco, 0.55))); g.addColorStop(0.65, css(H(cor))); g.addColorStop(1, css(ml(H(cor), H('#6d6a9c'), 0.5)));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      if (terra) { ctx.fillStyle = css(H('#bfe3c4'), 0.8); ctx.beginPath(); ctx.ellipse(x - r * 0.2, y - r * 0.1, r * 0.34, r * 0.22, 0.5, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + r * 0.3, y + r * 0.3, r * 0.22, r * 0.15, -0.3, 0, TAU); ctx.fill(); }
    }
    function cosmos(ctx, S) {
      const a = cA(S.tl);
      if (a < 0.01) return;
      const tl = S.tl, Wd = S.W, cx = Wd / 2, cy = 780, v = vivo(tl), ca = coroaA(tl);
      ctx.save(); ctx.globalAlpha *= a;
      const g = ctx.createLinearGradient(0, 0, 0, ALT);
      g.addColorStop(0, css(H('#2f3470'))); g.addColorStop(0.55, css(H('#4b4d92'))); g.addColorStop(1, css(H('#6a5fa3')));
      ctx.fillStyle = g; ctx.fillRect(-40, -40, Wd + 80, ALT + 80);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; brilhoRadial(ctx, cx, cy, 760, K.luzOuro, 0.16 * ca + 0.1 * v); ctx.restore();
      for (let i = 0; i < 60; i++) {                                                  // poeira de luz à deriva
        const x = mod(hash1(i * 3.1) * Wd + 14 * Math.sin(tl * 0.3 + i), Wd), y = mod(hash1(i * 5.7) * ALT - tl * (4 + 6 * hash1(i)), ALT);
        ctx.fillStyle = css(K.luz, 0.22 * (0.4 + 0.6 * Math.sin(tl * 0.8 + i)) * (0.5 + ca * 0.5)); ctx.beginPath(); ctx.arc(x, y, 1.6, 0, TAU); ctx.fill();
      }
      if (v > 0.02) {
        for (const e of FUNDO) {                                                       // as estrelas nascem
          const ba = clamp(v * 1.5 - e.v * 0.5), tw = 0.55 + 0.45 * Math.sin(tl * e.w + e.f);
          if (ba < 0.02) continue;
          ctx.fillStyle = css(K.luz, ba * tw * 0.9); if (e.r > 2) brilho4(ctx, e.u * Wd, e.v * ALT, e.r * 3.4); else { ctx.beginPath(); ctx.arc(e.u * Wd, e.v * ALT, e.r, 0, TAU); ctx.fill(); }
        }
        ctx.save(); ctx.globalCompositeOperation = 'lighter';                          // a galáxia em espiral
        const cores = [K.luz, K.rosa, K.lilas, K.luzOuro];
        for (let i = 0; i < 260; i++) {
          const f = i / 260, r = 50 + 470 * Math.pow(f, 0.8), ang = (i % 2) * Math.PI + r * 0.011 + tl * 0.05 + hash1(i * 2.3) * 0.5;
          const ba = clamp(v * 1.4 - hash1(i * 4.1) * 0.4);
          ctx.fillStyle = css(cores[i % 4], ba * (0.25 + 0.5 * hash1(i * 7.3))); ctx.beginPath(); ctx.arc(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r * 0.32, 1.4 + 2.2 * hash1(i * 9.1), 0, TAU); ctx.fill();
        }
        ctx.restore();
      }
      const planetas = (fundo) => {
        if (v < 0.02) return;
        for (const [rx, per, tam, cor, ph] of PLAN) {
          const ang = ph + tl * TAU / per, sy = Math.sin(ang), x = cx + Math.cos(ang) * rx, y = cy + sy * rx * 0.28;
          if ((sy < 0) !== fundo) continue;
          ctx.save(); ctx.globalAlpha *= v * (0.55 + 0.45 * smooth(-1, 1, sy)); esfera(ctx, x, y, tam * (0.85 + 0.2 * sy), cor, rx === 380); ctx.restore();
        }
      };
      if (v > 0.02) { ctx.strokeStyle = css(K.luz, 0.1 * v); ctx.lineWidth = 1.6; for (const p of PLAN) { ctx.beginPath(); ctx.ellipse(cx, cy, p[0], p[0] * 0.28, 0, 0, TAU); ctx.stroke(); } }
      planetas(true);
      const mt = win(tTempo - 0.3, tTempo + 1.2, tCria - 0.8, tCria + 0.3, tl);         // o tempo: o sol e a lua que giram
      if (mt > 0.02) {
        ctx.save(); ctx.globalAlpha *= mt; ctx.strokeStyle = css(K.luz, 0.35); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, cy, 300, 84, 0, 0, TAU); ctx.stroke();
        const ang = (tl - tTempo) * 0.9;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; brilhoRadial(ctx, cx + Math.cos(ang) * 300, cy + Math.sin(ang) * 84, 70, K.luzOuro, 0.7); ctx.restore();
        ctx.fillStyle = css(K.creme); ctx.beginPath(); ctx.arc(cx + Math.cos(ang) * 300, cy + Math.sin(ang) * 84, 15, 0, TAU); ctx.fill();
        ctx.fillStyle = css(H('#dfe3fb')); ctx.beginPath(); ctx.arc(cx - Math.cos(ang) * 300, cy - Math.sin(ang) * 84, 11, 0, TAU); ctx.fill();
        ctx.restore();
      }
      const br = Math.max(pulsos(ANEIS, 1, 4, tl), 0.35);
      if (ca > 0.01) {                                                                 // raios lentos e a coroa de luz
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(cx, cy + 40);
        for (let i = 0; i < 14; i++) {
          const ang = (i / 14) * TAU + tl * 0.04, L = 560 * (0.7 + 0.3 * Math.sin(tl * 0.6 + i * 2)), gg = ctx.createLinearGradient(0, 0, Math.cos(ang) * L, Math.sin(ang) * L);
          gg.addColorStop(0, css(K.luz, 0.2 * ca * br)); gg.addColorStop(1, css(K.luzOuro, 0));
          ctx.strokeStyle = gg; ctx.lineWidth = 10 + 8 * (i % 2); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ang) * L, Math.sin(ang) * L); ctx.stroke();
        }
        ctx.restore();
        S2.coroa(ctx, cx, cy + 82 + 6 * Math.sin(tl * 1.1), 3.2, { alfa: ca, brilho: Math.min(1, br + 0.2) });
      }
      planetas(false);
      for (const t0 of ANEIS) {                                                        // anéis de luz que se expandem
        const u = (tl - t0) / 4.5;
        if (u < 0 || u > 1) continue;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = css(K.luzOuro, 0.32 * (1 - u)); ctx.lineWidth = 3 + 5 * (1 - u);
        ctx.beginPath(); ctx.ellipse(cx, cy + 20, 90 + 1000 * ease.outCubic(u), (90 + 1000 * ease.outCubic(u)) * 0.34, 0, 0, TAU); ctx.stroke(); ctx.restore();
      }
      ctx.restore();
    }

    // ---------------------------------------------------------------- a coroa de luz no céu da terra e os raios que descem sobre o povo
    const CW = [[tCoro[0] - 0.5, tUniv[0] + 12.5], [tCoro[2] - 0.5, tUniv[1] + 13], [tCoro[4] - 0.5, tSolo[0] + 7]];
    function coroaCeu(ctx, S) {
      for (const [t0, t1] of CW) {
        const a = win(t0, t0 + 1.8, t1 - 2, t1, S.tl);
        if (a < 0.02) continue;
        const br = Math.max(pulsos([...tCoro, ...tUniv, ...tSoEle], 1, 4, S.tl), 0.25), x = S.W * 0.8, y = 560;
        for (let i = 0; i < 6; i++) facho(ctx, x, y + 40, x + (i - 2.5) * 260, SOLO + 30, 5, 34, (0.1 + 0.1 * br) * a, 0.6);
        S2.coroa(ctx, x, y + 30, 2.4, { alfa: a, brilho: br });
      }
    }

    // ---------------------------------------------------------------- o povo das nações (reúne-se, entra de novo depois do refúgio e depois da noite)
    const COR = ['#f4c8b0', '#f9e1a0', '#c9e6d4', '#f2c6e0', '#d9ccf2', '#f7d9b0', '#bfe3ea'];
    const BANDS = ['#e9b6c6', '#bfc9ee', '#f0d29a', '#c4ebcb', '#d3c4f2', '#f6b8c4', '#bfe3ea', '#f7d9b0'];
    const CY = SOLO + 12;
    const MEMBROS = [];
    for (let i = 0; i < 6; i++) MEMBROS.push({ slot: -88 * (i + 1) - (i % 2) * 8, y: -6 + (i % 3) * 6, tipo: 'aldeao', cor: COR[i % 7], veu: i % 3 === 1, barba: i % 2 === 0, t0: -99, band: i % 2 === 1 ? BANDS[i] : null });
    [[110, tPerm + 8, 'aldeao', false, 5], [205, tPerm + 12, 'mae', true, 0], [300, tGloria, 'aldeao', false, 6], [385, tDepois, 'menino', false, 2], [-88 * 7, tSoEle[0], 'aldeao', false, 7],
      [-88 * 8 + 10, tCoro[1], 'menina', false, 3], [-88 * 9, tUniv[0], 'mae', true, 4], [470, tUniv[0] + 6, 'aldeao', false, 1]]
      .forEach(([slot, t0, tipo, veu, b], k) => MEMBROS.push({ slot, y: -6 + (k % 3) * 6, tipo, cor: COR[(k + 3) % 7], veu, barba: k % 2 === 0, t0, band: tipo === 'menino' || tipo === 'menina' ? null : BANDS[b] }));
    MEMBROS.sort((a, b) => a.y - b.y);
    function povo(ctx, S) {
      const tl = S.tl, fase = faseEm(tl), tx = txEm(tl), vel = velEm(tl);
      const sentL = smooth(tSit, tSit + 2.5, tl) * (1 - smooth(tIni2 + 4, tIni2 + 6.5, tl)) + smooth(tEntrego[0] - 4, tEntrego[0] - 1.5, tl) * (1 - smooth(tAcorda, tAcorda + 3, tl));
      const andar = clamp(0.55 + vel), alegria = Math.max(win(tCoro[0] - 0.5, tCoro[0] + 1.5, tUniv[0] + 12, tUniv[0] + 14, tl), win(tCoro[2] - 0.5, tCoro[2] + 1.5, tUniv[1] + 12, tUniv[1] + 14, tl), win(tCoro[4] - 0.5, tCoro[4] + 1.5, tSolo[0] + 6, tSolo[0] + 8, tl)) * 0.9;
      const noiteL = S.noite > 0.45, tempestade = S.storm > 0.3;
      const gA = fase === 1 ? smooth(tPerm + 1.5, tPerm + 5, tl) * (1 - smooth(tRedentor - 5, tRedentor - 2.5, tl)) : fase === 2 ? 1 - smooth(tEntrego[0] - 6, tEntrego[0] - 3, tl) : 1;
      if (gA > 0.01) {
        MEMBROS.forEach((m, i) => {
          const te = fase === 1 ? m.t0 : fase === 2 ? tIni2 + 0.35 * i : tContigo - 0.5 + 0.35 * i;
          if (tl < te) return;
          const e = ease.inOutSine(smooth(te, te + 8, tl)), x = lerp(-260, tx + m.slot, e), y = CY + m.y;
          const opc = { tipo: m.tipo, cor: H(m.cor), dir: 1, andar, fase: ((S.rol + x + 17 * i) / 92) * TAU, t: S.t, olhar: 0.25 + 0.5 * alegria, bracos: alegria * (0.5 + 0.5 * Math.sin(S.t * 3 + i)), barba: m.barba, alfa: gA };
          if (m.veu) { opc.veu = true; opc.manto = H('#fff5e0'); }
          if (noiteL || tempestade) { opc.segura = 'lanterna'; opc.acesa = clamp(S.noite * 1.4 - 0.1 + S.storm); }
          PN.pessoa(ctx, x, y, 1.0, opc);
          if (m.band) S2.bandeira(ctx, x + 26, y + 2, 0.62, { alfa: gA * smooth(te + 4, te + 8, tl), t: S.t, vento: 0.3 + 0.2 * alegria, cor: H(m.band) });
        });
      }
      // o líder: caminha, abriga-se na rocha, descansa, dorme (peça própria) e acorda
      const dorme = smooth(tEntrego[0] - 1.5, tEntrego[0] + 0.5, tl) * (1 - smooth(tAcorda, tAcorda + 2, tl));
      const lA = 1 - dorme;
      if (lA > 0.01) {
        const ergue = Math.max(pulsos(tCoro, 0.8, 3.5, tl), 0.5 * alegria) * (1 - sentL);
        const opcL = { tipo: 'aldeao', cor: H('#c8d6f6'), barba: true, dir: 1, andar: andar * (1 - sentL), sentado: sentL, fase: ((S.rol + tx) / 92) * TAU, t: S.t, olhar: Math.max(0.3, ergue, alegria), bracos: ergue * 0.75, inclina: tempestade ? 0.1 * S.storm : 0, segura: noiteL ? 'lanterna' : null, acesa: clamp(S.noite * 1.3), alfa: lA };
        if (S.storm > 0.15) { opcL.veu = true; opcL.manto = H('#e8dff3'); }
        PN.pessoa(ctx, tx, CY, 1.12, opcL);
        if (sentL < 0.5) { const cx = tx + 36, cy = CY - 4 - 36 * ergue; ctx.save(); ctx.globalAlpha *= lA; M.cajado(ctx, cx, cy, 1.1, 0.04 - 0.1 * ergue); ctx.restore(); if (ergue > 0.05) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; brilhoRadial(ctx, cx - 18, cy - 190, 70, K.luzOuro, 0.6 * ergue); ctx.restore(); } }
        const hAm = win(tMaos - 0.5, tMaos + 2, tIni2 + 3, tIni2 + 6, tl);                      // a mão de luz que sustenta
        if (hAm > 0.02) I.maoLuz(ctx, tx + 16, CY - 300 + 8 * Math.sin(S.t * 1.2), 0.9, { alfa: hAm * 0.75, brilho: 0.05 * pulso(tMaos, 1, 4, tl), antebraco: 420 });
        const cA2 = win(tDescansa - 0.3, tDescansa + 1.8, tIni2 + 3, tIni2 + 6, tl);               // o coração que descansa
        if (cA2 > 0.02) PN.coracao(ctx, tx + 4, CY - 78, 13, cA2, S.t);
      }
    }

    // ---------------------------------------------------------------- tempestade, rocha de refúgio, acampamento, estrelas cadentes
    function chuva(ctx, S) {
      const st = S.storm;
      if (st < 0.03) return;
      ctx.strokeStyle = css(H('#f4f8ff'), 0.6 * st); ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      for (let i = 0; i < 170; i++) {
        const x = mod(hash1(i * 3.7) * (S.W + 300) - S.t * 150, S.W + 300) - 100, y = mod(hash1(i * 5.9) * (ALT + 200) + S.t * 900 * (0.8 + 0.4 * hash1(i)), ALT + 200) - 100;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 9, y + 28); ctx.stroke();
      }
      ctx.fillStyle = css(H('#6d6c8e'), 0.2 * st); ctx.fillRect(0, 0, S.W, ALT);
    }
    function relampago(ctx, S) {
      let f = 0;
      for (const t0 of [tRocha + 1.2, tRocha + 4.6, tMeuDeus - 0.6]) f = Math.max(f, win(t0, t0 + 0.06, t0 + 0.1, t0 + 0.55, S.tl), 0.7 * win(t0 + 0.28, t0 + 0.32, t0 + 0.34, t0 + 0.6, S.tl));
      if (f < 0.01) return;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = css(K.luz, 0.28 * f); ctx.fillRect(0, 0, S.W, ALT); ctx.restore();
    }
    function rochaR(ctx, S) {
      const x = X_ROCHA - S.rol;
      if (x < -600 || x > S.W + 600) return;
      ctx.save(); ctx.translate(x, SOLO + 12);
      ctx.fillStyle = css(H('#8f86b8'), 0.18); ctx.beginPath(); ctx.ellipse(10, 4, 270, 16, 0, 0, TAU); ctx.fill();
      const g = ctx.createLinearGradient(0, -270, 0, 0);
      g.addColorStop(0, css(luzObj(S, '#e6dcec', 0.7))); g.addColorStop(1, css(luzObj(S, '#bfb2cf', 0.8)));
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-250, 0); ctx.bezierCurveTo(-262, -120, -160, -254, -20, -266); ctx.bezierCurveTo(130, -274, 252, -170, 262, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = css(luzObj(S, '#8f86b8', 0.7), 0.3); ctx.beginPath(); ctx.moveTo(60, -250); ctx.bezierCurveTo(200, -230, 258, -120, 262, 0); ctx.lineTo(80, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = css(luzObj(S, '#8f86b8', 0.7), 0.35); ctx.beginPath(); ctx.ellipse(-150, -50, 70, 56, 0, 0, TAU); ctx.fill();              // o vão do abrigo
      ctx.fillStyle = css(K.luz, 0.4); ctx.beginPath(); ctx.ellipse(-100, -200, 90, 30, -0.4, 0, TAU); ctx.fill();
      ctx.fillStyle = css(luzObj(S, '#b7ceae', 0.9), 0.8); for (const [mx, my, mr] of [[30, -250, 30], [-190, -120, 22], [150, -190, 24]]) { ctx.beginPath(); ctx.ellipse(mx, my, mr, mr * 0.4, 0.2, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = css(luzObj(S, '#9d90b6', 0.8), 0.5); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-30, -250); ctx.quadraticCurveTo(-60, -170, -40, -90); ctx.stroke();
      ctx.restore();
    }
    const SONO = [['#c8d6f6', -1], ['#f4c8b0', 1], ['#c9e6d4', -1], ['#f2c6e0', 1], ['#f9e1a0', -1], ['#d9ccf2', 1]];
    function acampamentoR(ctx, S) {
      const a = win(tEntrego[0] - 3, tEntrego[0] - 0.5, tAcorda + 3, tAcorda + 9, S.tl);
      if (a < 0.02) return;
      for (let k = 0; k < 6; k++) {
        const x = X_CAMP - 600 + k * 520 - S.rol;
        if (x < -400 || x > S.W + 400) continue;
        ctx.save(); ctx.globalAlpha *= a;
        R91.tenda(ctx, x, SOLO - 22, 0.95 + 0.1 * (k % 2), 0.5 + 0.4 * S.noite);
        B.dormindo(ctx, x + 150, CY + 10, 1.05, { dir: SONO[k][1], t: S.t, cor: H(SONO[k][0]) });
        if (k % 2 === 0) B.dormindo(ctx, x + 235, CY + 14, 0.8, { dir: -SONO[k][1], t: S.t, cor: H(SONO[(k + 3) % 6][0]), menor: true });
        PN.lamparina(ctx, x - 130, CY - 4, 1.0, S.t);
        ctx.restore();
      }
      const hA = Math.max(win(tEntrego[0] - 0.3, tEntrego[0] + 2, tDormir - 2, tDormir + 1, S.tl), win(tEntrego[1] - 0.3, tEntrego[1] + 2, tAdorm - 2, tAdorm + 1, S.tl)) * a;
      if (hA > 0.02) I.maoLuz(ctx, S.W * 0.5 + 40 * Math.sin(S.t * 0.4), 330 + 10 * Math.sin(S.t * 1.1), 1.0, { alfa: hA, brilho: 0.7, antebraco: 380 });
    }
    function cadentes(ctx, S) {
      const a = S.noite * win(tEntrego[0], tEntrego[0] + 2, tPert, tPert + 2, S.tl);
      if (a < 0.05) return;
      for (const t0 of [tEntrego[0] + 3, tEntrego[0] + 11, tCorpo + 2, tAdonai + 3, tAdonai + 12, tEntrego[1] + 4, tAdorm + 3]) {
        const u = (S.tl - t0) / 1.4;
        if (u < 0 || u > 1) continue;
        const x = 300 + hash1(t0) * 1300 - 520 * u, y = 120 + hash1(t0 * 2) * 260 + 300 * u;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(x, y, x + 150, y - 100); g.addColorStop(0, css(K.luz, 0.9 * a * (1 - u))); g.addColorStop(1, css(K.luz, 0));
        ctx.strokeStyle = g; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 150, y - 100); ctx.stroke(); ctx.restore();
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
    function raiosDoSol(ctx, S) {
      const p = win(tRochaAf, tRochaAf + 3, tMaos + 4, tMaos + 8, S.tl) * 0.5 + 0.35 * smooth(tPert + 1, tPert + 6, S.tl) * (1 - smooth(tContigo + 6, tContigo + 10, S.tl));
      if (p < 0.02) return;
      const tx = txEm(S.tl);
      facho(ctx, tx + 260, -80, tx, CY - 140, 40, 170, 0.28 * p, 0.7);
    }

    // ---------------------------------------------------------------- pombas e pétalas
    function pomba(ctx, S, x, y, s, fase, rot, dir) {
      G.Personagens.pomba(ctx, S, x, y, s, { fase: S.t * 9 + fase, bate: Math.sin(S.t * 9 + fase), rot: rot || 0, dir: dir || 1 });
    }
    const BANDOS = [[tCoro[0] + 4, 15, 6], [tUniv[0], 14, 6], [tCoro[2] + 2, 16, 7], [tUniv[1], 16, 7], [tContigo + 6, 18, 8], [tCoro[5], 18, 8], [tSoEle[2] - 4, 16, 7]];
    function pombas(ctx, S) {
      for (const [t0, d, n] of BANDOS) {
        for (let j = 0; j < n; j++) {
          const u = (S.tl - t0 - j * 0.45) / d;
          if (u < 0 || u > 1) continue;
          pomba(ctx, S, -150 + (S.W + 300) * u, 400 + 280 * hash1(j * 3.3 + t0) + 30 * Math.sin(S.t * 1.7 + j * 2) - 60 * u, 0.5 + 0.12 * hash1(j + 5), j * 2, -0.1, 1);
        }
      }
    }
    function petalas(ctx, S) {
      const cores = [K.rosa, K.luzOuro, K.lilas, K.luz];
      for (const [tp, d] of [[tUniv[0] + 2, 9], [tUniv[1] + 2, 9], [tCoro[5] + 2, 10], [tSoEle[1], 10]]) {
        const v = (S.tl - tp) / d;
        if (v < 0 || v > 1) continue;
        for (let j = 0; j < 30; j++) {
          const w = clamp(v * 1.2 - hash1(j * 2.3) * 0.2), x = hash1(j * 7.7 + tp) * S.W + Math.sin(w * 5 + j) * 28, y = -40 + w * (SOLO + 80);
          ctx.fillStyle = css(cores[j % 4], Math.sin(Math.PI * w) * 0.9); ctx.beginPath(); ctx.ellipse(x, y, 6, 3.4, S.t * 2 + j, 0, TAU); ctx.fill();
        }
      }
    }

    // ---------------------------------------------------------------- quadro
    function paisagem(ctx, S) {
      const tl = S.tl, z = zoomEm(tl), tx = txEm(tl);
      ctx.save(); ctx.translate(tx, CY - 120); ctx.scale(z, z); ctx.translate(-tx, -(CY - 120));
      ceuFundo(ctx, S);
      estrelas(ctx, S);
      corpoCeleste(ctx, S);
      nuvens(ctx, S);
      serraR(ctx, S, MONT.longe);
      serraR(ctx, S, MONT.meio);
      arvoresR(ctx, S);
      casasR(ctx, S);
      chao(ctx, S);
      relvaR(ctx, S);
      rochaR(ctx, S);
      acampamentoR(ctx, S);
      coroaCeu(ctx, S);
      raiosDoSol(ctx, S);
      povo(ctx, S);
      chuva(ctx, S);
      pombas(ctx, S);
      petalas(ctx, S);
      vagalumes(ctx, S);
      cadentes(ctx, S);
      relampago(ctx, S);
      const fl = win(tPert - 0.5, tPert + 0.8, tPert + 1.2, tPert + 3.5, tl) * 0.3;
      if (fl > 0.01) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = css(K.luzOuro, fl); ctx.fillRect(0, 0, S.W, ALT); ctx.restore(); }
      ctx.restore();
    }
    function desenhar(ctx, S) {
      const tl = S.tl, ca = cA(tl);
      S.hora = horaEm(tl); S.storm = stormEm(tl); S.ceu = ceuEm(S.hora); S.noite = noiteF(S.hora); S.rol = rolEm(tl); S.ang = 0;
      S.ceu = { top: ml(S.ceu.top, H('#858299'), 0.5 * S.storm), mid: ml(S.ceu.mid, H('#a29fb8'), 0.46 * S.storm), hor: ml(S.ceu.hor, H('#c9bfcc'), 0.36 * S.storm) };
      S.tomTexto = 1 - smooth(0.32, 0.62, Math.max(S.noite * 0.9, S.storm * 0.85, ca * 0.95));
      if (ca < 0.999) paisagem(ctx, S);
      cosmos(ctx, S);
    }

    return { espelho: false, estado: () => ({ fx: 0.5, calor: 0, peso: 0, nevoa: 0, vento: 0.2, solY: 400, solForca: 1, raios: 0, motes: 0, flash: 0 }), desenhar };
  }

  G.TemaAdonOlam = { criar };
})(window);
