// Tema "Salmo 91", criado do zero a partir da letra inteira (a imagem de fundo da música é ignorada).
// Um peregrino descansa no esconderijo do Altíssimo (uma fenda na rocha, com a sua tenda) sob as grandes
// asas luminosas e a sombra do Todo-Poderoso. A cada verso o cenário conta o que a letra diz: o laço do
// caçador que se desfaz, a peste (névoa lilás) que não chega, o escudo e a muralha, o terror da noite, a
// flecha de dia, a destruição ao meio-dia, mil e dez mil caindo ao lado, os anjos que o guardam e o levam
// nas mãos, a pedra que não faz tropeçar, o leão, a serpente e o dragão pisados, o alto refúgio, o clamor
// respondido, a angústia que se desfaz, a honra, os longos dias e a salvação.
// Os instantes saem do texto da legenda: os trechos que os disparam ficam em `animacao.json`, na pasta da
// música (`gatilhos`), e não neste repositório público. Sem o arquivo, valem os tempos padrão abaixo.
(function (G) {
  'use strict';
  const { clamp, lerp, smooth, mod, css, rgb, hash1, noise1, mulberry32, mola, ease } = G.U;
  const R = G.Seres91, K = R.K, ml = R.ml, aj = R.aj;
  const ALT = 1080, TAU = Math.PI * 2;
  const SOLO = 0.885 * ALT;                 // linha dos pés (o caminho)
  const BASE = 0.905 * ALT;                 // pé da rocha
  const HORSKY = 0.74 * ALT;                // horizonte atrás das montanhas (sol e lua nascem aqui)
  const semNikud = (s) => s.normalize('NFD').replace(/[֑-ׇ]/g, '').replace(/[̀-ͯ]/g, '');
  const H = (hex) => rgb(hex);

  // tempos padrão (s) de cada momento; `gatilhos` do animacao.json substituem por busca no texto da legenda
  const PADRAO = {
    refrao: [12.49, 31.77, 77.72, 141.82, 215.38, 229.15, 267.09],
    laco: [51.34], peste1: [54.77], asas: [57.57], abrigo: [60.92], plumagem: [65.55], escudo: [71.13],
    noite: [103.43, 129.77], dia: [106.70, 133.12], trevas: [109.90, 135.52], meiodia: [112.38, 139.83],
    mil: [115.41], dezmil: [119.24], veras: [121.80], recompensa: [124.99],
    morada: [170.70], nenhum_mal: [177.49], praga: [180.44], anjos_he: [183.63], anjos_pt: [190.17],
    maos: [196.87], pedra: [199.35], leao: [203.02], pisaras: [205.81], apegou: [208.36], livrarei: [212.59],
    alto: [237.88], invocara: [242.59], angustia: [245.47], libertarei: [248.90], honrarei: [250.33],
    dias: [251.93], salvacao: [257.11],
  };

  // ---------------------------------------------------------------- céu por hora do dia
  const CEU = [
    [0, '#8189cc', '#9b9fdc', '#c2b2e2'], [4.8, '#8e96d6', '#b4aee2', '#f1c8d8'], [6.2, '#a4b4ea', '#f0c7d8', '#ffd9a6'],
    [8, '#b3d3f4', '#d8e9f8', '#ffeccd'], [12, '#a6d0f2', '#d0e9fa', '#eef7f6'], [15.5, '#b0cff0', '#e3e2f5', '#ffe6c6'],
    [18.2, '#aaa7e0', '#f2b8c4', '#ffcf9b'], [19.8, '#8f91d1', '#c3a5d9', '#f4b9bb'], [21.5, '#8189cc', '#9b9fdc', '#c2b2e2'],
    [24, '#8189cc', '#9b9fdc', '#c2b2e2'],
  ].map(([h, a, b, c]) => [h, H(a), H(b), H(c)]);
  function ceuEm(h) {
    h = mod(h, 24);
    let i = 0; while (i < CEU.length - 2 && CEU[i + 1][0] <= h) i++;
    const A = CEU[i], B = CEU[i + 1], f = clamp((h - A[0]) / (B[0] - A[0])), k = f * f * (3 - 2 * f);
    return { top: ml(A[1], B[1], k), mid: ml(A[2], B[2], k), hor: ml(A[3], B[3], k) };
  }
  const noiteF = (h) => { h = mod(h, 24); return h < 12 ? 1 - smooth(5.0, 6.6, h) : smooth(18.6, 20.4, h); };

  function criar(musica, parte, W) {
    const dur = parte.duracao;
    const gat = parte.gatilhos || {};
    const linhas = musica.linhas.filter((l) => l.parte === parte.indice)
      .map((l) => ({ a: l.ini - parte.inicio, b: l.fim - parte.inicio, txt: semNikud(l.texto) + ' ' + (l.traducao || '') }));
    const T = (nome, n) => {
      n = n || 0;
      if (gat[nome]) {
        const re = new RegExp(gat[nome], 'i');
        const r = linhas.filter((l) => re.test(l.txt)).map((l) => l.a);
        if (r[n] !== undefined) return r[n];
      }
      const p = PADRAO[nome];
      return p[Math.min(n, p.length - 1)];
    };
    const tLaco = T('laco'), tPeste1 = T('peste1'), tAsas = T('asas'), tAbrigo = T('abrigo'), tPlum = T('plumagem'), tEscudo = T('escudo');
    const tNoite = [T('noite', 0), T('noite', 1)], tDia = [T('dia', 0), T('dia', 1)], tTrevas = [T('trevas', 0), T('trevas', 1)], tMeio = [T('meiodia', 0), T('meiodia', 1)];
    const tMil = T('mil'), tDezMil = T('dezmil'), tVeras = T('veras'), tRecomp = T('recompensa');
    const tMorada = T('morada'), tNenhum = T('nenhum_mal'), tAnjosHe = T('anjos_he'), tAnjosPt = T('anjos_pt'), tMaos = T('maos'), tPedra = T('pedra');
    const tLeao = T('leao'), tPisaras = T('pisaras'), tApegou = T('apegou'), tLivrarei = T('livrarei');
    const tAlto = T('alto'), tInvoca = T('invocara'), tAngustia = T('angustia'), tLibertarei = T('libertarei'), tHonrarei = T('honrarei');
    const tDias = T('dias'), tSalv = T('salvacao');
    const REFR = PADRAO.refrao.map((_, i) => T('refrao', i));
    const tFinal = REFR[REFR.length - 1];
    const tFimSrt = linhas.length ? linhas[linhas.length - 1].b : dur;

    // ---------------------------------------------------------------- hora do dia (o dia corre conforme a letra)
    const HS = [
      [0, 5.0, 12.5, 6.2, 0], [12.5, 6.2, tNoite[0] - 3.4, 11.0, 0], [tNoite[0] - 3.4, 11.0, tNoite[0], 23.8, 1], [tNoite[0], 23.8, tDia[0] - 0.5, 23.9, 0],
      [tDia[0] - 0.5, 23.9, tDia[0] + 1.2, 33.0, 1], [tDia[0] + 1.2, 33.0, tMeio[0] - 1.0, 33.6, 0], [tMeio[0] - 1.0, 33.6, tMeio[0] + 0.6, 36.0, 1],
      [tMeio[0] + 0.6, 36.0, tNoite[1] - 1.2, 37.5, 0], [tNoite[1] - 1.2, 37.5, tNoite[1] + 1.0, 47.8, 1], [tNoite[1] + 1.0, 47.8, tDia[1] - 0.5, 47.9, 0],
      [tDia[1] - 0.5, 47.9, tDia[1] + 1.1, 57.0, 1], [tDia[1] + 1.1, 57.0, tMeio[1] - 1.0, 57.5, 0], [tMeio[1] - 1.0, 57.5, tMeio[1] + 0.8, 60.0, 1],
      [tMeio[1] + 0.8, 60.0, tNenhum, 64.0, 0], [tNenhum, 64.0, REFR[4], 66.3, 0], [REFR[4], 66.3, tAlto, 68.2, 0], [tAlto, 68.2, tInvoca, 70.0, 0],
      [tInvoca, 70.0, tDias, 71.0, 0], [tDias, 71.0, tSalv - 0.9, 102.0, 1], [tSalv - 0.9, 102.0, tFinal, 105.5, 0], [tFinal, 105.5, dur + 2, 108.8, 0],
    ];
    const horaEm = (tl) => {
      for (const [a, ha, b, hb, suave] of HS) {
        if (tl <= b) {
          const f = clamp((tl - a) / Math.max(1e-6, b - a));
          return lerp(ha, hb, suave ? ease.inOutCubic(f) : f);
        }
      }
      return HS[HS.length - 1][3];
    };

    // ---------------------------------------------------------------- envelopes narrativos
    const win = (a, b, c, d, t) => smooth(a, b, t) * (1 - smooth(c, d, t));
    const E = {
      noite: (t) => Math.max(win(tNoite[0] - 0.3, tNoite[0] + 0.3, tDia[0] - 0.3, tDia[0] + 0.3, t), win(tNoite[1] - 0.3, tNoite[1] + 0.3, tDia[1] - 0.3, tDia[1] + 0.3, t)),
      peste: (t) => Math.max(win(tPeste1 - 0.4, tPeste1 + 1.1, tAsas + 0.2, tAsas + 2.6, t), win(tTrevas[0] - 0.3, tTrevas[0] + 0.9, tMeio[0] - 0.2, tMeio[0] + 1.0, t), win(tTrevas[1] - 0.3, tTrevas[1] + 0.9, tMeio[1] - 0.2, tMeio[1] + 1.0, t)),
      calor: (t) => Math.max(win(tMeio[0] - 0.4, tMeio[0] + 0.5, tMeio[0] + 3.2, tMeio[0] + 4.6, t), win(tMeio[1] - 0.4, tMeio[1] + 0.5, tMeio[1] + 1.6, tMeio[1] + 2.4, t)),
      tempestade: (t) => win(tAngustia - 0.6, tAngustia + 0.8, tLibertarei - 0.1, tLibertarei + 1.4, t),
      ameaca: (t) => Math.max(win(tLaco - 0.5, tLaco + 0.4, tAsas + 1.0, tAsas + 2.5, t), win(tNoite[0] - 3.6, tNoite[0] - 3.0, tRecomp + 3.6, tRecomp + 4.8, t), win(tNoite[1] - 1.6, tNoite[1] - 1.2, tMeio[1] + 3.0, tMeio[1] + 4.0, t)),
      // escudo: aparece em "escudo e muralha" e fica, mais forte nas ameaças
      domo: (t) => smooth(tEscudo - 0.4, tEscudo + 1.4, t) * (1 - smooth(tAnjosHe + 1.0, tAnjosHe + 3.0, t)),
      domoForca: (t) => 0.38 + 0.62 * Math.max(win(tNoite[0] - 3.6, tNoite[0] - 3.0, tRecomp + 3.6, tRecomp + 4.8, t), win(tNoite[1] - 1.6, tNoite[1] - 1.2, tMeio[1] + 3.0, tMeio[1] + 4.0, t), win(tAsas - 0.5, tAsas + 0.5, tEscudo + 3.0, tEscudo + 5.0, t)),
    };
    const asasAbre = (t) => {
      let a = 0.42 + 0.20 * smooth(8, 18, t);
      a = Math.max(a, 1.0 * smooth(tAsas - 0.4, tAsas + 2.8, t));
      a = lerp(a, 0.78, smooth(tEscudo + 3.5, tEscudo + 9, t) * (1 - smooth(tNoite[0] - 3.8, tNoite[0] - 3.2, t)));
      a = Math.max(a, win(tNoite[0] - 3.8, tNoite[0] - 3.0, tRecomp + 4, tRecomp + 6, t) * 1.0);
      a = Math.max(a, win(tNoite[1] - 1.6, tNoite[1] - 1.2, tMeio[1] + 4, tMeio[1] + 5.5, t) * 1.0);
      a = Math.max(a, smooth(tInvoca - 1.0, tInvoca + 1.5, t));
      return clamp(a);
    };

    // ---------------------------------------------------------------- caminhada (a câmera acompanha o peregrino)
    const PASSO = 1 / 30, V = 112;
    const andarEm = (t) => smooth(tAnjosPt - 0.2, tAnjosPt + 1.2, t) * (1 - smooth(tAlto - 1.6, tAlto + 0.8, t));
    const nTab = Math.ceil(dur / PASSO) + 3;
    const rolTab = new Float64Array(nTab);
    for (let i = 1; i < nTab; i++) rolTab[i] = rolTab[i - 1] + V * andarEm((i - 1) * PASSO) * PASSO;
    const rolEm = (t) => { const x = clamp(t / PASSO, 0, nTab - 1.001), i = Math.floor(x); return lerp(rolTab[i], rolTab[i + 1], x - i); };
    const XP = 0.42 * W, XC = 0.46 * W;                                      // peregrino (tela) e centro da caverna (mundo)
    const subida = (t) => smooth(tAlto - 3.4, tAlto + 3.2, t);              // o alto refúgio: sobe nas nuvens

    // ---------------------------------------------------------------- terreno
    const MONT = {
      longe: { par: 0.03, base: 0.665, a: [150, 52, 18], per: [1900, 760, 300], p: [0.7, 2.1, 4.2], pico: true, dy: 0, neve: true, cor: '#cdc8ee', haze: 0.45 },
      meio: { par: 0.08, base: 0.725, a: [96, 40, 14], per: [1500, 600, 240], p: [2.4, 0.5, 3.3], pico: true, dy: 0, neve: false, cor: '#b3bdeb', haze: 0.3 },
      colinas: { par: 0.22, base: 0.790, a: [26, 12, 5], per: [1100, 470, 190], p: [1.1, 3.1, 0.6], dy: 0, neve: false, cor: '#bfe4d2', haze: 0.16 },
    };
    function yCrista(Lc, X) {
      const w0 = Math.sin(TAU * X / Lc.per[0] + Lc.p[0]), w1 = Math.sin(TAU * X / Lc.per[1] + Lc.p[1]), w2 = Math.sin(TAU * X / Lc.per[2] + Lc.p[2]);
      const h0 = Lc.pico ? Lc.a[0] * (1.12 - 1.5 * Math.abs(w0)) : Lc.a[0] * w0;
      return Lc.base * ALT - (h0 + Lc.a[1] * w1 + Lc.a[2] * w2);
    }

    // ---------------------------------------------------------------- mundo: flores, árvores, pedras
    const FLORES = ['#f7c6d2', '#fff1d6', '#e2dcf6', '#ffd9b8', '#fbe2ef'].map(H);
    function luzObj(S, cor, k) {                                              // cor do objeto sob a luz do momento
      const c = typeof cor === 'string' ? H(cor) : cor;
      return ml(ml(c, S.ceu.mid, S.noite * 0.52 * (k || 1)), S.ceu.hor, 0.10 * (k || 1) * (1 - S.noite));
    }

    // ---------------------------------------------------------------- partes do cenário
    function ceuFundo(ctx, S) {
      const c = S.ceu;
      const peste = S.peste;
      const g = ctx.createLinearGradient(0, 0, 0, HORSKY + 40);
      const dim = (col) => ml(col, K.sombra, 0.34 * peste + 0.12 * S.tempestade);
      g.addColorStop(0, css(dim(c.top))); g.addColorStop(0.5, css(dim(c.mid))); g.addColorStop(1, css(dim(c.hor)));
      ctx.fillStyle = g; ctx.fillRect(-40, -40, S.W + 80, ALT + 80);
    }
    const rE = mulberry32(21);
    const ESTRELAS = Array.from({ length: 260 }, () => ({ u: rE(), v: Math.pow(rE(), 1.3), r: 0.7 + Math.pow(rE(), 3) * 2.3, w: 0.7 + rE() * 2.4, f: rE() * TAU }));
    function estrelas(ctx, S) {
      if (S.noite < 0.03) return;
      for (const e of ESTRELAS) {
        const y = e.v * HORSKY * 0.95, tw = 0.55 + 0.45 * Math.sin(S.t * e.w + e.f);
        const a = S.noite * tw * clamp((HORSKY - y) / 260) * (1 - 0.6 * S.peste);
        if (a < 0.03) continue;
        ctx.fillStyle = css(K.branco, a);
        if (e.r > 2) R.brilho4(ctx, e.u * S.W, y, e.r * 3); else { ctx.beginPath(); ctx.arc(e.u * S.W, y, e.r, 0, TAU); ctx.fill(); }
      }
    }
    function corpoCeleste(ctx, S) {
      const h = mod(S.hora, 24), W = S.W;
      // sol
      const aS = Math.PI * (h - 6) / 12, altS = Math.sin(aS);
      S.sol = { x: W * (0.5 - Math.cos(aS) * 0.40), y: HORSKY - altS * 0.60 * ALT, alt: altS };
      if (altS > -0.2) {
        const baixo = 1 - clamp(altS * 2.4), r = 56 * (1 + 0.2 * baixo);
        const quente = ml(K.creme, H('#ffb98f'), baixo * 0.9);
        const forca = clamp((altS + 0.2) / 0.3) * (1 - 0.55 * S.peste) * (1 - 0.7 * S.tempestade);
        const glare = 1 + 1.2 * S.calor;
        R.brilhoRadial(ctx, S.sol.x, S.sol.y, 760 * glare, quente, 0.45 * forca);
        R.brilhoRadial(ctx, S.sol.x, S.sol.y, 330 * glare, K.creme, 0.5 * forca);
        R.brilhoRadial(ctx, S.sol.x, S.sol.y, 140 * glare, K.branco, 0.65 * forca);
        const g = ctx.createRadialGradient(S.sol.x - r * 0.25, S.sol.y - r * 0.25, r * 0.1, S.sol.x, S.sol.y, r);
        g.addColorStop(0, css(K.branco, forca)); g.addColorStop(0.7, css(K.creme, forca)); g.addColorStop(1, css(quente, 0.9 * forca));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(S.sol.x, S.sol.y, r * glare * 0.9, 0, TAU); ctx.fill();
      }
      // lua
      const aL = Math.PI * mod(h - 18, 24) / 12, altL = Math.sin(aL);
      S.lua = { x: W * (0.5 - Math.cos(aL) * 0.40), y: HORSKY - altL * 0.56 * ALT, alt: altL };
      if (altL > -0.15 && mod(h - 18, 24) < 12.4) {
        const vis = S.noite * clamp((altL + 0.15) / 0.3) * (1 - 0.7 * S.peste), r = 46;
        R.brilhoRadial(ctx, S.lua.x, S.lua.y, 240, H('#c9d0ff'), 0.4 * vis);
        const g = ctx.createRadialGradient(S.lua.x - r * 0.3, S.lua.y - r * 0.3, r * 0.1, S.lua.x, S.lua.y, r);
        g.addColorStop(0, css(H('#fbfcff'), vis)); g.addColorStop(0.7, css(H('#e8ebfa'), vis)); g.addColorStop(1, css(H('#c9cee8'), vis));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(S.lua.x, S.lua.y, r, 0, TAU); ctx.fill();
        ctx.fillStyle = css(H('#a9b0d6'), 0.32 * vis);
        for (const [dx, dy, rr] of [[-0.32, -0.28, 0.2], [0.34, 0.12, 0.15], [-0.08, 0.5, 0.11]]) { ctx.beginPath(); ctx.arc(S.lua.x + dx * r, S.lua.y + dy * r, rr * r, 0, TAU); ctx.fill(); }
      }
    }
    const rN = mulberry32(300);
    const NUVENS = Array.from({ length: 22 }, () => ({ x0: rN() * 3600, y: (0.04 + rN() * 0.46) * ALT, w: 240 + rN() * 420, h: 0.15 + rN() * 0.16, v: 3 + rN() * 8, a: 0.3 + rN() * 0.4, tom: rN() }));
    function nuvens(ctx, S) {
      const per = S.W + 1100;
      for (const n of NUVENS) {
        const x = mod(n.x0 - S.t * n.v, per) - 550;
        let col = ml(K.branco, S.ceu.mid, 0.28 + 0.4 * S.noite);
        col = ml(col, K.rosa, n.tom * 0.3 * (1 - S.noite));
        col = ml(col, K.sombra, 0.5 * S.peste + 0.22 * S.tempestade);
        const a = n.a * (1 - 0.35 * S.noite) * (1 + 0.55 * S.peste);
        ctx.save(); ctx.translate(x, n.y); ctx.scale(1, n.h);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, n.w);
        g.addColorStop(0, css(col, a)); g.addColorStop(0.5, css(col, a * 0.55)); g.addColorStop(1, css(col, 0));
        ctx.fillStyle = g; ctx.fillRect(-n.w, -n.w, n.w * 2, n.w * 2);
        ctx.restore();
      }
    }
    function raios(ctx, S) {
      if (!S.sol || S.sol.alt < -0.05) return;
      const f = clamp(1 - Math.abs(S.sol.alt - 0.2) * 1.6) * (0.4 + 0.6 * S.A.energia) * (1 - S.peste) * (1 + 0.5 * S.calor);
      if (f < 0.03) return;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(S.sol.x, S.sol.y);
      for (let i = 0; i < 13; i++) {
        const a = (i / 13) * TAU + S.t * 0.02, larg = 0.04 + 0.03 * hash1(i * 3.1);
        const g = ctx.createLinearGradient(0, 0, 1700, 0); g.addColorStop(0, css(K.ouroClaro, 0.07 * f)); g.addColorStop(1, css(K.ouroClaro, 0));
        ctx.save(); ctx.rotate(a); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1700, -1700 * larg); ctx.lineTo(1700, 1700 * larg); ctx.closePath(); ctx.fill(); ctx.restore();
      }
      ctx.restore();
    }
    function arcoIris(ctx, S) {
      const a = S.arco;
      if (a < 0.02) return;
      const cx = S.W * 0.52, cy = HORSKY + 120, R0 = S.W * 0.56;
      const cores = ['#f7b8c6', '#ffcfa6', '#fff0b8', '#c6ecc9', '#b8e0f6', '#c9c4f1', '#e4c4ee'].map(H);
      ctx.save(); ctx.lineCap = 'butt';
      cores.forEach((c, i) => { ctx.strokeStyle = css(c, 0.5 * a); ctx.lineWidth = 17; ctx.beginPath(); ctx.arc(cx, cy, R0 - i * 16, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); });
      ctx.restore();
    }
    function serra(ctx, S, Lc) {
      const W = S.W, cam = S.rol * Lc.par, dy = S.dyCam * Lc.dyK;
      const topoC = luzObj(S, ml(H(Lc.cor), S.ceu.hor, Lc.haze), 1), fundoC = luzObj(S, ml(H(Lc.cor), S.ceu.mid, Lc.haze + 0.25), 1);
      ctx.beginPath(); ctx.moveTo(-20, ALT + 20);
      for (let x = -20; x <= W + 20; x += 8) ctx.lineTo(x, yCrista(Lc, x + cam) + dy);
      ctx.lineTo(W + 20, ALT + 20); ctx.closePath();
      const yTop = Lc.base * ALT - (Lc.a[0] * 1.12 + Lc.a[1] + Lc.a[2]) + dy;
      const g = ctx.createLinearGradient(0, yTop, 0, yTop + 420);
      g.addColorStop(0, css(topoC)); g.addColorStop(1, css(fundoC));
      ctx.fillStyle = g; ctx.fill();
      if (Lc.neve) {
        ctx.save(); ctx.clip();
        const gs = ctx.createLinearGradient(0, yTop, 0, yTop + 150);
        gs.addColorStop(0, css(K.branco, 0.85 - 0.45 * S.noite)); gs.addColorStop(1, css(K.branco, 0));
        ctx.fillStyle = gs; ctx.fillRect(0, yTop, W, 150);
        ctx.restore();
      }
      if (S.sol && S.sol.alt > -0.05) {                                       // luz de contorno
        ctx.strokeStyle = css(K.creme, 0.35 * (1 - S.noite) * (1 - S.peste)); ctx.lineWidth = 2.2; ctx.beginPath();
        for (let x = -20; x <= W + 20; x += 8) { const y = yCrista(Lc, x + cam) + dy; x === -20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.stroke();
      }
    }
    function arvoresDe(ctx, S, par, cel, prob, esc, sem, yFn, dy) {
      const cam = S.rol * par, W = S.W;
      const c0 = Math.floor((cam - 100) / cel), c1 = Math.floor((cam + W + 100) / cel);
      for (let c = c0; c <= c1; c++) {
        if (hash1(c * 3.31 + sem) > prob) continue;
        const wx = c * cel + hash1(c * 1.7 + sem) * cel * 0.8, sx = wx - cam;
        const s = esc * (0.75 + hash1(c * 5.9 + sem) * 0.55), y = yFn(sx + cam) + dy;
        const sw = Math.sin(S.t * 0.9 + c) * 1.5 * s;
        const tipo = hash1(c * 2.2 + sem) < 0.4;
        const tronco = luzObj(S, '#cdb5a8', 0.8), f1 = luzObj(S, tipo ? '#a6d4bf' : '#b4dcc4', 0.9), f2 = luzObj(S, tipo ? '#c4e8d4' : '#d3eeda', 0.9);
        ctx.fillStyle = css(K.sombra, 0.1); ctx.beginPath(); ctx.ellipse(sx + 6 * s, y + 2, 30 * s, 5 * s, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = css(tronco); ctx.lineWidth = 8 * s; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx, y); ctx.lineTo(sx + sw * 0.3, y - 38 * s); ctx.stroke();
        if (tipo) {                                                           // cipreste
          ctx.fillStyle = css(f1); ctx.beginPath(); ctx.ellipse(sx + sw, y - 78 * s, 20 * s, 56 * s, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = css(f2, 0.8); ctx.beginPath(); ctx.ellipse(sx + sw - 6 * s, y - 86 * s, 9 * s, 34 * s, 0, 0, TAU); ctx.fill();
        } else {
          const cx = sx + sw, cy = y - 62 * s;
          ctx.fillStyle = css(f1); ctx.beginPath();
          for (const [dx, dy2, r] of [[-22, 8, 22], [0, -4, 27], [24, 8, 21], [-6, 20, 19], [14, -18, 19]]) { ctx.moveTo(cx + (dx + r) * s, cy + dy2 * s); ctx.arc(cx + dx * s, cy + dy2 * s, r * s, 0, TAU); }
          ctx.fill();
          ctx.fillStyle = css(f2); ctx.beginPath();
          for (const [dx, dy2, r] of [[-22, 8, 22], [0, -4, 27], [24, 8, 21]]) { ctx.moveTo(cx + (dx - 5 + r * 0.55) * s, cy + (dy2 - 6) * s); ctx.arc(cx + (dx - 5) * s, cy + (dy2 - 6) * s, r * 0.55 * s, 0, TAU); }
          ctx.fill();
        }
      }
    }

    // caverna: o esconderijo do Altíssimo (rocha com uma fenda) e a tenda lá dentro
    function caverna(ctx, S) {
      const cx = XC - S.rol, dy = S.dyCam;
      if (cx < -700 || cx > S.W + 700) return;
      const base = BASE + dy;
      const entradaE = cx - 205, entradaD = cx + 215, arcoY = 0.69 * ALT + dy;
      // interior
      const ig = ctx.createLinearGradient(0, arcoY, 0, base);
      ig.addColorStop(0, css(ml(K.sombra, K.manto, 0.35))); ig.addColorStop(1, css(ml(K.lilas, K.sombra, 0.35)));
      const arco = () => {
        ctx.beginPath(); ctx.moveTo(entradaE, base); ctx.lineTo(entradaE, 0.775 * ALT + dy);
        ctx.quadraticCurveTo(entradaE, arcoY - 14, cx, arcoY - 16); ctx.quadraticCurveTo(entradaD, arcoY - 14, entradaD, 0.775 * ALT + dy); ctx.lineTo(entradaD, base); ctx.closePath();
      };
      arco(); ctx.fillStyle = ig; ctx.fill();
      ctx.save(); arco(); ctx.clip();
      R.brilhoRadial(ctx, cx + 60, base - 60, 300, K.ouroClaro, 0.55 * (0.4 + 0.6 * Math.max(S.noite, S.peste)));
      R.tenda(ctx, cx + 92, base - 4, 0.92, 0.35 + 0.65 * Math.max(S.noite, S.peste, S.ameaca * 0.6));
      R.lanterna(ctx, cx - 124, base - 4, 1.0, 0.45 + 0.55 * Math.max(S.noite, S.peste, S.ameaca * 0.6), S.t);
      ctx.restore();
      S.pilgrimX = cx - 60;
      // rocha com o arco recortado (preenchimento par-ímpar)
      const topo = [[-440, 0], [-400, -0.13], [-310, -0.215], [-200, -0.275], [-90, -0.315], [30, -0.31], [150, -0.285], [260, -0.235], [350, -0.15], [420, -0.07], [450, 0]];
      const rochaPath = () => {
        ctx.beginPath(); ctx.moveTo(cx + topo[0][0], base + 0.0);
        topo.forEach(([dx2, dyF], i) => { const x = cx + dx2, y = base + dyF * ALT + (i && i < topo.length - 1 ? noise1(i * 1.7 + 4) * 10 : 0); if (i) ctx.lineTo(x, y); });
        ctx.lineTo(cx + 450, base); ctx.closePath();
        ctx.moveTo(entradaE, base); ctx.lineTo(entradaE, 0.775 * ALT + dy);
        ctx.quadraticCurveTo(entradaE, arcoY - 14, cx, arcoY - 16); ctx.quadraticCurveTo(entradaD, arcoY - 14, entradaD, 0.775 * ALT + dy); ctx.lineTo(entradaD, base); ctx.closePath();
      };
      const rg = ctx.createLinearGradient(0, base - 0.32 * ALT, 0, base);
      rg.addColorStop(0, css(luzObj(S, '#ede6f8', 0.7))); rg.addColorStop(0.55, css(luzObj(S, '#cfc6ea', 0.8))); rg.addColorStop(1, css(luzObj(S, '#a59dce', 0.8)));
      rochaPath(); ctx.fillStyle = rg; ctx.fill('evenodd');
      ctx.save(); rochaPath(); ctx.clip('evenodd');
      ctx.strokeStyle = css(luzObj(S, '#8f86b8', 0.8), 0.22); ctx.lineWidth = 2;
      for (let i = 0; i < 7; i++) { const y = base - 0.05 * ALT * i - 14; ctx.beginPath(); ctx.moveTo(cx - 460, y); for (let x = -460; x <= 460; x += 40) ctx.lineTo(cx + x, y + noise1(x * 0.02 + i * 3) * 9); ctx.stroke(); }
      const sombraG = ctx.createLinearGradient(cx - 440, 0, cx + 450, 0);
      sombraG.addColorStop(0, css(K.branco, 0.28 * (1 - S.noite))); sombraG.addColorStop(0.5, css(K.branco, 0)); sombraG.addColorStop(1, css(K.sombra, 0.2));
      ctx.fillStyle = sombraG; ctx.fillRect(cx - 460, base - 0.34 * ALT, 920, 0.34 * ALT);
      for (const [mx, my, mr] of [[-300, -0.16, 46], [-120, -0.285, 38], [260, -0.2, 40], [330, -0.09, 30]]) {       // musgo
        ctx.fillStyle = css(luzObj(S, '#bfe4d2', 0.9), 0.85); ctx.beginPath(); ctx.ellipse(cx + mx, base + my * ALT, mr, mr * 0.4, 0, 0, TAU); ctx.fill();
      }
      ctx.restore();
      ctx.strokeStyle = css(luzObj(S, '#7d75a8', 0.8), 0.55); ctx.lineWidth = 5; arco(); ctx.stroke();                    // sombra da borda
    }

    // caminho e relva
    function chao(ctx, S) {
      const W = S.W, dy = S.dyCam, cam = S.rol;
      const topo = luzObj(S, '#c8ecd9', 1), fundo = luzObj(S, '#a9dcc2', 1);
      const g = ctx.createLinearGradient(0, 0.79 * ALT + dy, 0, ALT + dy);
      g.addColorStop(0, css(topo)); g.addColorStop(1, css(fundo));
      ctx.beginPath(); ctx.moveTo(-20, ALT + 400);
      for (let x = -20; x <= W + 20; x += 10) ctx.lineTo(x, 0.80 * ALT + dy + Math.sin((x + cam) * 0.004) * 7 + Math.sin((x + cam) * 0.011) * 3);
      ctx.lineTo(W + 20, ALT + 400); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
      // caminho de terra clara
      ctx.beginPath(); ctx.moveTo(-20, ALT + 400);
      const yc = (x) => SOLO + 0.012 * ALT + dy + Math.sin((x + cam) * 0.0035) * 9;
      for (let x = -20; x <= W + 20; x += 10) ctx.lineTo(x, yc(x) - 34 + Math.sin((x + cam) * 0.009) * 3);
      for (let x = W + 20; x >= -20; x -= 10) ctx.lineTo(x, yc(x) + 62 + Math.sin((x + cam) * 0.007) * 4);
      ctx.closePath();
      const gp = ctx.createLinearGradient(0, SOLO - 40 + dy, 0, SOLO + 70 + dy);
      gp.addColorStop(0, css(luzObj(S, '#f6e8d6', 0.9))); gp.addColorStop(1, css(luzObj(S, '#ecd5bd', 0.9)));
      ctx.fillStyle = gp; ctx.fill();
    }
    function plantas(ctx, S, frente) {
      const W = S.W, cam = S.rol, dy = S.dyCam, CEL = 54;
      const c0 = Math.floor((cam - 60) / CEL), c1 = Math.floor((cam + W + 60) / CEL);
      for (let c = c0; c <= c1; c++) {
        const h1 = hash1(c * 2.13 + 4), h2 = hash1(c * 7.77 + 1), h3 = hash1(c * 4.9 + 9);
        const prof = 0.80 + 0.19 * h3;                                       // 0.80..0.99 da altura
        const y0 = prof * ALT + dy;
        if ((y0 > SOLO + dy) !== frente) continue;
        const wx = c * CEL + h1 * CEL, sx = wx - cam;
        const esc = 0.55 + 0.9 * (prof - 0.8) / 0.19;
        if (h2 < 0.16) {                                                      // pedrinha
          ctx.fillStyle = css(luzObj(S, '#ddd5ee', 0.9)); ctx.beginPath(); ctx.ellipse(sx, y0 - 3 * esc, 15 * esc, 8 * esc, 0, Math.PI, TAU); ctx.fill();
          ctx.fillStyle = css(K.branco, 0.5); ctx.beginPath(); ctx.ellipse(sx - 3 * esc, y0 - 6 * esc, 6 * esc, 3 * esc, 0, Math.PI, TAU); ctx.fill();
          continue;
        }
        const n = 3 + Math.floor(h1 * 3);
        ctx.lineCap = 'round';
        for (let i = 0; i < n; i++) {
          const alt = (18 + hash1(c * 3.3 + i) * 26) * esc, lean = (i - (n - 1) / 2) * 7 * esc + Math.sin(S.t * 1.4 + wx * 0.02 + i) * 4 * (alt / 40) * (1 + S.vento * 1.5);
          ctx.strokeStyle = css(luzObj(S, i % 2 ? '#8fd0b0' : '#a8dec2', 0.9)); ctx.lineWidth = 3 * esc;
          ctx.beginPath(); ctx.moveTo(sx + (i - n / 2) * 4 * esc, y0); ctx.quadraticCurveTo(sx + lean * 0.5, y0 - alt * 0.6, sx + lean, y0 - alt); ctx.stroke();
        }
        if (h2 > 0.5) {                                                       // florzinha
          const hf = (22 + 24 * h1) * esc, cor = FLORES[Math.floor(h3 * FLORES.length)];
          const bal = Math.sin(S.t * 1.7 + c * 4) * 3 * esc;
          ctx.strokeStyle = css(luzObj(S, '#8fd0b0', 0.9)); ctx.lineWidth = 2.2 * esc; ctx.beginPath(); ctx.moveTo(sx + 9, y0); ctx.quadraticCurveTo(sx + 9 + bal * 0.4, y0 - hf * 0.5, sx + 9 + bal, y0 - hf); ctx.stroke();
          ctx.fillStyle = css(luzObj(S, cor, 0.7));
          for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU + c; ctx.beginPath(); ctx.arc(sx + 9 + bal + Math.cos(a) * 5.5 * esc, y0 - hf + Math.sin(a) * 5.5 * esc, 3.8 * esc, 0, TAU); ctx.fill(); }
          ctx.fillStyle = css(K.ouro); ctx.beginPath(); ctx.arc(sx + 9 + bal, y0 - hf, 2.6 * esc, 0, TAU); ctx.fill();
        }
      }
    }

    // banco de nuvens (o alto refúgio fica acima das nuvens)
    function bancoNuvens(ctx, S, yBase, alfa, fator, claridade) {
      if (alfa < 0.02) return;
      const cl = claridade === undefined ? 1 : claridade;
      const per = S.W + 900;
      for (let i = 0; i < 34; i++) {
        const q = hash1(i * 5.3 + 1), x = mod(hash1(i * 9.1) * per - S.t * (6 + 14 * hash1(i * 2.2)), per) - 450;
        const w = (260 + 380 * hash1(i * 3.7)) * fator, y = yBase + (q - 0.3) * 190 * fator;
        let col = ml(ml(K.branco, S.ceu.hor, 0.2 + 0.4 * S.noite), ml(K.lilas, S.ceu.mid, 0.4), 1 - cl);
        col = ml(col, K.lilas, 0.35 * S.noite + (i % 3 === 0 ? 0.25 : 0));
        ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.34);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, w);
        g.addColorStop(0, css(col, 0.95 * alfa)); g.addColorStop(0.55, css(col, 0.6 * alfa)); g.addColorStop(1, css(col, 0));
        ctx.fillStyle = g; ctx.fillRect(-w, -w, w * 2, w * 2); ctx.restore();
      }
    }
    function pedestal(ctx, S) {                                                // cume: rocha, tenda e mar de nuvens
      const k = smooth(0.45, 0.8, S.sub);
      if (k < 0.01) return;
      const dy = (1 - k) * 420, cx = S.W * 0.52;
      const base = BASE + dy;
      const forma = () => {
        ctx.beginPath(); ctx.moveTo(cx - 470, ALT + 260); ctx.lineTo(cx - 420, base + 70);
        ctx.quadraticCurveTo(cx - 330, base - 30, cx - 170, base - 44); ctx.quadraticCurveTo(cx + 10, base - 56, cx + 190, base - 42); ctx.quadraticCurveTo(cx + 350, base - 30, cx + 430, base + 60); ctx.lineTo(cx + 480, ALT + 260); ctx.closePath();
      };
      const g = ctx.createLinearGradient(0, base - 60, 0, base + 220);
      g.addColorStop(0, css(luzObj(S, '#ece5f7', 0.7))); g.addColorStop(0.5, css(luzObj(S, '#cfc6ea', 0.8))); g.addColorStop(1, css(luzObj(S, '#a59dce', 0.8)));
      forma(); ctx.fillStyle = g; ctx.fill();
      ctx.save(); forma(); ctx.clip();
      ctx.strokeStyle = css(luzObj(S, '#8f86b8', 0.8), 0.25); ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) { const y = base + 18 + i * 34; ctx.beginPath(); ctx.moveTo(cx - 520, y); for (let x = -520; x <= 520; x += 40) ctx.lineTo(cx + x, y + noise1(x * 0.02 + i * 3) * 8); ctx.stroke(); }
      const sg = ctx.createLinearGradient(cx - 470, 0, cx + 480, 0); sg.addColorStop(0, css(K.branco, 0.26 * (1 - S.noite))); sg.addColorStop(0.5, css(K.branco, 0)); sg.addColorStop(1, css(K.sombra, 0.2));
      ctx.fillStyle = sg; ctx.fillRect(cx - 520, base - 80, 1040, 400);
      ctx.restore();
      ctx.fillStyle = css(luzObj(S, '#bfe4d2', 0.9), 0.95);
      ctx.beginPath(); ctx.ellipse(cx - 20, base - 46, 280, 14, 0, Math.PI, TAU); ctx.fill();
      R.tenda(ctx, cx + 170, base - 42, 0.95, 0.35 + 0.65 * Math.max(S.noite, S.peste, S.tempestade));
      R.lanterna(ctx, cx - 130, base - 44, 0.9, 0.4 + 0.6 * S.noite, S.t);
      for (let i = 0; i < 7; i++) { const fx = cx - 250 + i * 70 + hash1(i) * 20; ctx.fillStyle = css(FLORES[i % FLORES.length]); ctx.beginPath(); ctx.arc(fx, base - 52 - hash1(i * 3) * 8, 5, 0, TAU); ctx.fill(); }
      S.pilgrimX2 = cx - 40; S.pilgrimY2 = base - 46;
      // nuvens à frente, dos lados do cume
      bancoNuvens(ctx, S, ALT * 1.03 + (1 - k) * 300, k * 0.8, 1.1, 0.7);
    }

    // ---------------------------------------------------------------- grandes asas do Altíssimo (fora da tela, com transparência)
    let ofs = null;
    function asasGrandes(ctx, S) {
      const ab = S.asas, al = S.asasAlfa;
      if (al < 0.02) return;
      const cv = ctx.canvas;
      if (!ofs || ofs.width !== cv.width || ofs.height !== cv.height) { ofs = document.createElement('canvas'); ofs.width = cv.width; ofs.height = cv.height; }
      const o = ofs.getContext('2d');
      o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, ofs.width, ofs.height);
      o.setTransform(ctx.getTransform());
      const cx = S.W / 2, cy = 0.115 * ALT;
      const bate = Math.sin(S.t * 0.9) * 0.45 + Math.sin(S.t * 0.37) * 0.3;
      const respira = 1 + 0.015 * Math.sin(S.t * 0.8);
      const claro = ml(K.branco, S.ceu.hor, 0.12 * (1 - S.noite)), tom = { primarias: ml(K.lilas, S.ceu.mid, 0.2), secundarias: ml(K.creme, K.lilas, 0.15), coberteiras: claro };
      for (const lado of [-1, 1]) {
        o.save(); o.translate(cx + lado * 10, cy); o.scale(lado * respira, respira);
        R.asaPenas(o, { L: S.W * 0.45, abre: ab, bate, t: S.t, fase: lado * 1.3, tom });
        o.restore();
      }
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = al; ctx.filter = `blur(${(2.2 * (cv.width / 1920)).toFixed(2)}px)`; ctx.drawImage(ofs, 0, 0); ctx.restore();
      // presença: brilho no ombro das asas
      R.brilhoRadial(ctx, cx, cy, 260 * (0.8 + 0.2 * S.A.energia), K.ouroClaro, 0.7 * al);
      R.brilhoRadial(ctx, cx, cy, 90, K.branco, 0.9 * al);
    }

    // escudo (domo) em volta do esconderijo
    function domo(ctx, S) {
      const a = S.domo;
      if (a < 0.02) return;
      const cx = XC - S.rol - 6, cy = BASE - 40 + S.dyCam, rx = 360, ry = 380;
      ctx.save();
      ctx.beginPath(); ctx.rect(-40, -40, S.W + 80, BASE + 60 + S.dyCam); ctx.clip();
      const forca = S.domoForca * a;
      const g = ctx.createRadialGradient(cx, cy - 40, rx * 0.3, cx, cy, rx);
      g.addColorStop(0, css(K.branco, 0.0)); g.addColorStop(0.82, css(K.branco, 0.06 * forca)); g.addColorStop(1, css(K.lilas, 0.32 * forca));
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, Math.PI, TAU); ctx.fill();
      ctx.lineWidth = 3.5; ctx.strokeStyle = css(ml(K.branco, K.ouroClaro, 0.3), 0.6 * forca); ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, Math.PI, TAU); ctx.stroke();
      ctx.lineWidth = 2; ctx.strokeStyle = css(ml(K.rosa, K.lilas, 0.4), 0.45 * forca); ctx.beginPath(); ctx.ellipse(cx, cy, rx - 8, ry - 8, 0, Math.PI * 1.04, Math.PI * 1.5); ctx.stroke();
      ctx.strokeStyle = css(K.branco, 0.65 * forca); ctx.beginPath(); ctx.ellipse(cx, cy, rx - 14, ry - 14, 0, Math.PI * 1.12, Math.PI * 1.3); ctx.stroke();
      for (let i = 0; i < 12; i++) {                                           // brilhos correndo pela borda
        const an = Math.PI + mod(S.t * 0.12 + i / 12, 1) * Math.PI, tw = 0.5 + 0.5 * Math.sin(S.t * 2 + i * 2.4);
        ctx.fillStyle = css(K.branco, 0.85 * forca * tw); R.brilho4(ctx, cx + Math.cos(an) * rx, cy + Math.sin(an) * ry, 6 + 5 * tw);
      }
      ctx.restore();
      S.domoCx = cx; S.domoCy = cy; S.domoRx = rx; S.domoRy = ry;
    }

    // ---------------------------------------------------------------- ameaças
    function laco(ctx, S) {                                                    // o laço do caçador
      const t = S.tl, a = win(tLaco - 0.3, tLaco + 0.6, tLaco + 3.2, tLaco + 4.4, t);
      if (a < 0.02) return;
      const u = clamp((t - tLaco) / 1.8), cai = ease.outCubic(u);
      const cx = XC - S.rol - 20, y = lerp(-220, 0.44 * ALT, cai) + Math.sin(t * 2) * 5;
      const rasgo = smooth(tLaco + 2.1, tLaco + 3.4, t);
      ctx.strokeStyle = css(ml(K.cajado, K.sombra, 0.3), 0.8 * a); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx - 90, -40); ctx.quadraticCurveTo(cx - 70, y * 0.5, cx - 150, y - 60); ctx.moveTo(cx + 90, -40); ctx.quadraticCurveTo(cx + 70, y * 0.5, cx + 150, y - 60); ctx.stroke();
      R.rede(ctx, cx, y, 330, 250, { t, rasgo, alfa: a });
      if (u > 0.95 && rasgo < 0.4) R.brilhoRadial(ctx, cx, y, 220, K.ouroClaro, 0.7 * smooth(tLaco + 1.8, tLaco + 2.2, t));
    }
    function nevoaPeste(ctx, S) {                                              // peste: névoa lilás que não passa do escudo
      const a = S.peste;
      if (a < 0.02) return;
      const cx = S.domoCx !== undefined ? S.domoCx : XC - S.rol, cy = S.domoCy || BASE - 60;
      for (let i = 0; i < 26; i++) {
        const lado = i % 2 ? 1 : -1, q = hash1(i * 4.3 + 2), ph = mod(S.t * (0.05 + 0.04 * hash1(i)) + hash1(i * 7.1), 1);
        const dist = lerp(1400, 560, ph * a);
        const x = cx + lado * (dist + 140 * q), y = lerp(0.52, 0.93, hash1(i * 2.9)) * ALT + Math.sin(S.t * 0.5 + i) * 30;
        const w = 240 + 300 * hash1(i * 6.1);
        ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.5);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, w);
        const col = ml(K.sombra, K.ameixa, 0.4);
        g.addColorStop(0, css(col, 0.5 * a)); g.addColorStop(0.6, css(col, 0.22 * a)); g.addColorStop(1, css(col, 0));
        ctx.fillStyle = g; ctx.fillRect(-w, -w, w * 2, w * 2); ctx.restore();
      }
      ctx.fillStyle = css(K.sombra, 0.4 * a);                                  // esporos
      for (let i = 0; i < 40; i++) {
        const lado = i % 2 ? 1 : -1, ph = mod(S.t * 0.12 + hash1(i * 3.7), 1);
        const x = cx + lado * lerp(1300, 420, ph), y = (0.45 + 0.5 * hash1(i * 8.1)) * ALT + Math.sin(S.t + i) * 20;
        ctx.beginPath(); ctx.arc(x, y, 2 + 2 * hash1(i), 0, TAU); ctx.fill();
      }
    }
    // flechas: por dia (rasantes), chuva de mil e dez mil (caem dos lados do escudo)
    const FLECHAS = [];
    [[tDia[0], 3.0], [tDia[1], 2.6]].forEach(([t0, dd], k) => {
      for (let i = 0; i < 9; i++) {
        const lado = i % 2 ? 1 : -1, tt = t0 + i * (dd / 9) + 0.2;
        FLECHAS.push({ t0: tt, raso: true, lado, ang: 0.28 + 0.55 * hash1(i * 5.1 + k), y0: 0.28 + 0.26 * hash1(i * 3.3 + k), d: 0.9 });
      }
    });
    const chuva = (t0, t1, lado, dens, sem) => {
      const n = Math.round((t1 - t0) * dens);
      for (let i = 0; i < n; i++) {
        const tt = t0 + (i / n) * (t1 - t0), xf = lado < 0 ? 0.06 + 0.2 * hash1(sem + i * 1.7) : 0.66 + 0.30 * hash1(sem + i * 1.7);
        FLECHAS.push({ t0: tt, raso: false, x0: xf + (lado < 0 ? -0.05 : 0.05), y0: -0.10 - 0.1 * hash1(sem + i * 3.1), x1: xf, y1: 0.80 + 0.14 * hash1(sem + i * 2.3), d: 0.75 + 0.25 * hash1(sem + i) });
      }
    };
    chuva(tMil, tDezMil, -1, 11, 11); chuva(tDezMil, tVeras, 1, 24, 57); chuva(tVeras, tVeras + 1.5, -1, 8, 91); chuva(tVeras, tVeras + 1.5, 1, 14, 133);
    function flechas(ctx, S) {
      const dx = S.domoCx !== undefined ? S.domoCx : XC - S.rol, cy = S.domoCy !== undefined ? S.domoCy : BASE - 60, rx = 360, ry = 380;
      for (const f of FLECHAS) {
        const u = (S.tl - f.t0) / f.d;
        if (u < -0.02 || u > 1.9) continue;
        const raso = f.raso;
        let x0, y0, x1, y1;
        if (raso) {                                                           // voa de fora até bater na borda do escudo
          const a = f.lado > 0 ? -f.ang : -Math.PI + f.ang;
          x1 = dx + rx * Math.cos(a); y1 = cy + ry * Math.sin(a);
          x0 = f.lado > 0 ? S.W * 1.12 : -S.W * 0.12; y0 = f.y0 * ALT;
        } else { x0 = f.x0 * S.W; y0 = f.y0 * ALT; x1 = f.x1 * S.W; y1 = f.y1 * ALT; }
        if (u <= 1) {
          const e = raso ? ease.inOutSine(u) : u * u * 0.6 + u * 0.4;
          const x = lerp(x0, x1, e), y = lerp(y0, y1, e) - (raso ? Math.sin(Math.PI * e) * 70 : 0);
          const an = Math.atan2(lerp(y0, y1, Math.min(1, e + 0.02)) - lerp(y0, y1, e) - (raso ? (Math.sin(Math.PI * (e + 0.02)) - Math.sin(Math.PI * e)) * 70 : 0), lerp(x0, x1, Math.min(1, e + 0.02)) - lerp(x0, x1, e));
          R.flecha(ctx, x, y, an, 72, smooth(0, 0.08, u) * (raso ? 1 - smooth(0.85, 1, u) : 1));
          if (raso && u > 0.93) {                                            // bate no escudo: faísca
            const k = (u - 0.93) / 0.07; ctx.fillStyle = css(K.branco, 0.9 * (1 - k)); R.brilho4(ctx, x1, y1, 10 + 20 * k);
          }
        } else if (!raso) {                                                  // crava no chão e some em pétalas
          const k = u - 1;
          if (k < 0.55) R.flecha(ctx, x1, y1, Math.atan2(y1 - y0, x1 - x0), 72, 1 - smooth(0.3, 0.55, k));
          ctx.fillStyle = css(K.rosa, 0.8 * (1 - k / 0.9)); for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(x1 + (i - 1.5) * 12 * k * 2, y1 - 10 - 26 * k * (1 + i * 0.2), 4, 2.4, i, 0, TAU); ctx.fill(); }
        }
      }
    }
    function morcegos(ctx, S) {
      const a = Math.max(win(tNoite[0] - 0.2, tNoite[0] + 0.5, tDia[0] - 0.2, tDia[0] + 0.5, S.tl), win(tNoite[1] - 0.2, tNoite[1] + 0.5, tDia[1] - 0.2, tDia[1] + 0.5, S.tl));
      if (a < 0.02) return;
      for (let i = 0; i < 9; i++) {
        const x = mod(hash1(i * 5.1) * (S.W + 400) - S.tl * (60 + 40 * hash1(i * 2.2)) * (i % 2 ? 1 : -1), S.W + 400) - 200;
        const y = (0.14 + 0.38 * hash1(i * 7.7)) * ALT + Math.sin(S.tl * 1.6 + i * 2) * 26;
        R.morcego(ctx, x, y, 0.8 + 0.5 * hash1(i * 3.3), { t: S.tl, fase: i, alfa: a * 0.85, dir: i % 2 ? 1 : -1 });
      }
    }
    function calor(ctx, S) {                                                    // destruição ao meio-dia: clarão e ondulação do ar
      const a = S.calor;
      if (a < 0.02) return;
      ctx.fillStyle = css(H('#fff4dc'), 0.28 * a); ctx.fillRect(-40, -40, S.W + 80, ALT + 80);
      ctx.strokeStyle = css(K.branco, 0.22 * a); ctx.lineWidth = 2;
      for (let i = 0; i < 9; i++) { const y = (0.62 + 0.04 * i) * ALT; ctx.beginPath(); for (let x = -20; x <= S.W + 20; x += 14) { const yy = y + Math.sin(x * 0.02 + S.t * 3 + i) * 5; x === -20 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); } ctx.stroke(); }
    }
    function tempestade(ctx, S) {
      const a = S.tempestade;
      if (a < 0.02) return;
      ctx.fillStyle = css(K.sombra, 0.25 * a); ctx.fillRect(-40, -40, S.W + 80, ALT + 80);
      ctx.strokeStyle = css(K.branco, 0.35 * a); ctx.lineWidth = 2; ctx.lineCap = 'round';
      for (let i = 0; i < 90; i++) { const x = mod(hash1(i * 3.7) * (S.W + 300) - S.t * 160, S.W + 300) - 100, y = mod(hash1(i * 5.9) * ALT + S.t * 900 * (0.8 + 0.4 * hash1(i)), ALT + 100) - 50; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 10, y + 36); ctx.stroke(); }
      const rel = Math.max(0, Math.sin(S.t * 13)) * Math.max(0, Math.sin(S.t * 3.1)); if (rel > 0.7) { ctx.fillStyle = css(K.branco, 0.35 * a * (rel - 0.7) / 0.3); ctx.fillRect(-40, -40, S.W + 80, ALT + 80); }
    }

    // ---------------------------------------------------------------- seres
    const pomL = (hex) => (hex === '#DCD3EE' ? '#F6DCCB' : hex);
    function personagens(ctx, S) {
      const tl = S.tl, rolV = S.rol, dy = S.dyCam;
      const andar = andarEm(tl);
      const chao = rolV;                                                       // distância percorrida
      const PASSADA = 150;
      const noAlto = S.sub > 0.6;
      // estado do peregrino
      const sentadoBase = (1 - smooth(tAnjosHe + 2.4, tAnjosHe + 4.4, tl)) * (1 - noAlto) + noAlto * smooth(tFinal - 0.4, tFinal + 1.6, tl);
      let bracos = smooth(tInvoca - 0.2, tInvoca + 1.0, tl) * (1 - smooth(tLibertarei + 0.4, tLibertarei + 1.8, tl)) + 0.0;
      bracos = Math.max(bracos, 0.35 * smooth(tApegou - 0.2, tApegou + 0.8, tl) * (1 - smooth(tLivrarei + 1.0, tLivrarei + 2.2, tl)));
      const olhar = Math.max(smooth(tVeras - 0.2, tVeras + 0.8, tl) * (1 - smooth(tRecomp + 3.0, tRecomp + 4.5, tl)), smooth(tAsas, tAsas + 1, tl) * (1 - smooth(tAsas + 4, tAsas + 5, tl)) * 0.7, bracos);
      let px = XP, py = SOLO + dy;
      if (sentadoBase > 0.5 && S.sub < 0.5 && tl < tAnjosPt) { px = S.pilgrimX !== undefined ? S.pilgrimX : XP; py = BASE - 22 + dy; }
      // de pé na caverna -> caminha: o x vai do ponto da caverna ao XP enquanto se levanta
      if (tl < tAnjosPt + 1.5 && S.pilgrimX !== undefined) { const m = smooth(tAnjosHe + 2.4, tAnjosPt + 1.0, tl); px = lerp(S.pilgrimX, XP, m); py = lerp(BASE - 22, SOLO, m) + dy; }
      if (noAlto) { px = S.pilgrimX2 !== undefined ? S.pilgrimX2 : XP; py = (S.pilgrimY2 !== undefined ? S.pilgrimY2 : SOLO); const m = smooth(0.6, 0.9, S.sub); px = lerp(XP, px, m); py = lerp(SOLO + dy, py, m); }
      const pulo = Math.sin(Math.PI * clamp((tl - (tPedra + 0.55)) / 0.7)) * 24;                // a pedra não o faz tropeçar
      const mod1 = { t: tl, andar: andar * (1 - noAlto), fase: (chao / PASSADA) * TAU, sentado: sentadoBase, bracos, olhar, alfa: 1 };
      S.pilg = { x: px, y: py - pulo, sent: sentadoBase };
      // criaturas (o leão, a serpente, o dragão): ficam no mundo
      criaturas(ctx, S);
      // pedra no caminho
      const xPedra = rolEm(tPedra + 0.95) + XP + 36 - rolV;
      if (tl > tPedra - 4 && tl < tPedra + 6) {
        const sx = xPedra, sy = SOLO + 6 + dy;
        ctx.fillStyle = css(luzObj(S, '#cbc3e6', 0.9)); ctx.beginPath(); ctx.ellipse(sx, sy - 12, 40, 22, 0, Math.PI, TAU); ctx.lineTo(sx + 40, sy); ctx.quadraticCurveTo(sx, sy + 8, sx - 40, sy); ctx.fill();
        ctx.fillStyle = css(K.branco, 0.45); ctx.beginPath(); ctx.ellipse(sx - 10, sy - 22, 17, 8, -0.3, Math.PI, TAU); ctx.fill();
      }
      // anjos
      anjos(ctx, S, px, py);
      R.peregrino(ctx, px, S.pilg.y, 1.18, mod1);
      if (bracos > 0.05 || S.coroa > 0.02) efeitosPeregrino(ctx, S, px, S.pilg.y);
    }
    function criaturas(ctx, S) {
      const tl = S.tl, rolV = S.rol, dy = S.dyCam;
      if (tl < tLeao - 0.5 || tl > tLivrarei + 12) return;
      const base = rolEm(tPisaras + 1.0) + XP;                                  // onde o peregrino estará em "pisarás"
      const xs = base + 30 - rolV, xl = base + 360 - rolV, xd = base + 520 - rolV;
      const ent = smooth(tLeao - 0.3, tLeao + 1.0, tl);
      const dobra = smooth(tPisaras, tPisaras + 1.8, tl);
      const some = smooth(tLivrarei + 0.2, tLivrarei + 1.6, tl);
      const fade = ent * (1 - some);
      // leão (mais atrás), serpente (no caminho), dragão (no alto)
      R.leao(ctx, xl, SOLO - 26 + dy, 0.9, { dir: -1, abaixa: dobra, boca: (1 - dobra) * (0.5 + 0.5 * Math.sin(tl * 5)), alfa: fade, t: tl });
      R.serpente(ctx, xs, SOLO + 4 + dy, 1.05, { dir: -1, t: tl, levanta: (1 - dobra) * 0.8, alfa: fade, L: 200 });
      R.dragao(ctx, xd, SOLO - 150 + dy + dobra * 120, 0.95, { dir: -1, t: tl, levanta: 0.7 * (1 - dobra * 0.8), alfa: fade });
      if (some > 0 && some < 1) {                                                // desfazem-se em pétalas e luz
        ctx.fillStyle = css(K.rosa, 0.8 * (1 - some));
        for (let i = 0; i < 40; i++) { const px = lerp(xs, xd, hash1(i * 3.1)) + Math.sin(tl * 2 + i) * 14, py = SOLO - 160 * hash1(i * 5.7) * (1 + some) + dy; ctx.beginPath(); ctx.ellipse(px, py - some * 80, 5, 2.8, i, 0, TAU); ctx.fill(); }
        R.brilhoRadial(ctx, lerp(xs, xd, 0.5), SOLO - 80 + dy, 340, K.ouroClaro, 0.7 * Math.sin(Math.PI * some));
      }
    }
    function anjos(ctx, S, px, py) {
      const tl = S.tl;
      const a = smooth(tAnjosHe - 0.2, tAnjosHe + 1.8, tl) * (1 - smooth(tFinal - 1.0, tFinal + 1.0, tl) * 0.0);
      if (a < 0.02) return;
      const noAlto = S.sub > 0.6;
      const maos = smooth(tMaos - 0.2, tMaos + 0.8, tl) * (1 - smooth(tPedra + 2.2, tPedra + 3.4, tl));
      const subIn = noAlto ? 1 : 0;
      const pos = [[-190, -300, 0.98, 0.3], [205, -315, 1.02, 1.7], [10, -440, 0.84, 3.1]];
      pos.forEach(([dx, dyy, esc, fase], i) => {
        let x = px + dx, y = py + dyy;
        if (i === 0 && maos > 0.01) { x = lerp(x, px + 34, maos); y = lerp(y, py - 70, maos); }                 // um anjo leva o pé em suas mãos
        if (i === 1 && maos > 0.01) { x = lerp(x, px - 44, maos); y = lerp(y, py - 70, maos); }
        if (subIn) { y -= 20; }
        R.anjo(ctx, x, y + 130 * esc, esc * (1 - 0.15 * (i === 2 ? 1 : 0)), { t: tl, fase, alfa: a * (i < 2 && maos > 0.5 ? 0.9 : 1), bracos: i < 2 ? Math.max(maos, 0.3) : 0.2 });
        if (i < 2 && maos > 0.4) R.brilhoRadial(ctx, i === 0 ? px + 18 : px - 34, py + 2, 90, K.ouroClaro, 0.8 * maos);
      });
    }
    function efeitosPeregrino(ctx, S, px, py) {
      const tl = S.tl;
      // clamor: anéis que se abrem; resposta: luz que desce das asas
      const cl = win(tInvoca - 0.1, tInvoca + 0.3, tInvoca + 6.4, tInvoca + 7.4, tl);
      if (cl > 0.02) {
        for (let k = 0; k < 4; k++) { const f = mod((tl - tInvoca) * 0.5 + k / 4, 1); ctx.strokeStyle = css(ml(K.rosa, K.lilas, k / 4), 0.6 * (1 - f) * cl); ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(px, py - 190, 40 + 260 * f, 30 + 200 * f, 0, 0, TAU); ctx.stroke(); }
      }
      const feixe = win(tInvoca + 2.2, tInvoca + 3.2, tLibertarei + 2.0, tLibertarei + 3.2, tl);
      if (feixe > 0.02) {
        const ox = S.W / 2, oy = 0.12 * ALT;
        const g = ctx.createLinearGradient(ox, oy, px, py - 190);
        g.addColorStop(0, css(K.branco, 0.65 * feixe)); g.addColorStop(1, css(K.ouroClaro, 0.2 * feixe));
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(ox - 26, oy); ctx.lineTo(ox + 26, oy); ctx.lineTo(px + 70, py - 120); ctx.lineTo(px - 70, py - 120); ctx.closePath(); ctx.fill();
        R.brilhoRadial(ctx, px, py - 190, 240, K.ouroClaro, 0.5 * feixe);
      }
      // "apegou-se a Mim": um fio de luz liga a mão ao alto
      const fio = win(tApegou - 0.1, tApegou + 0.7, tLivrarei + 0.8, tLivrarei + 1.8, tl);
      if (fio > 0.02) {
        ctx.strokeStyle = css(K.ouroClaro, 0.85 * fio); ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(px + 26, py - 196); ctx.bezierCurveTo(px + 70, py - 330, S.W / 2 - 80, 0.3 * ALT, S.W / 2, 0.14 * ALT); ctx.stroke();
        ctx.strokeStyle = css(K.branco, 0.9 * fio); ctx.lineWidth = 1.6; ctx.stroke();
        R.brilhoRadial(ctx, px + 26, py - 196, 70, K.ouroClaro, 0.8 * fio);
      }
      // honra: coroa de luz e manto dourado
      const co = S.coroa;
      if (co > 0.02) {
        R.brilhoRadial(ctx, px, py - 110, 230, K.ouro, 0.45 * co);
        const cy = py - 232 - 6 * Math.sin(tl * 2);
        ctx.strokeStyle = css(K.ouro, 0.95 * co); ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(px, cy, 30, 8, 0, 0, TAU); ctx.stroke();
        ctx.fillStyle = css(K.ouro, 0.95 * co);
        for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(px + i * 12 - 6, cy - 2); ctx.lineTo(px + i * 12, cy - 22 - (2 - Math.abs(i)) * 6); ctx.lineTo(px + i * 12 + 6, cy - 2); ctx.closePath(); ctx.fill(); }
        for (let i = 0; i < 12; i++) { const an = tl * 0.8 + i * 0.52, rr = 60 + 38 * Math.sin(tl + i); ctx.fillStyle = css(K.branco, 0.9 * co * (0.4 + 0.6 * Math.max(0, Math.sin(tl * 3 + i)))); R.brilho4(ctx, px + Math.cos(an) * rr, py - 130 + Math.sin(an) * rr * 0.9, 5 + 3 * Math.max(0, Math.sin(tl * 3 + i))); }
      }
    }
    function pombas(ctx, S) {
      const a0 = smooth(tSalv - 0.4, tSalv + 0.6, S.tl);
      if (a0 < 0.02) return;
      for (let i = 0; i < 8; i++) {
        const t0 = tSalv + 0.3 + i * 0.7, u = (S.tl - t0) / 13;
        const v = mod(u, 1.4);
        if (u < 0) continue;
        const x = lerp(-120, S.W + 140, v / 1.4) + Math.sin(S.tl * 0.5 + i) * 20, y = (0.18 + 0.26 * hash1(i * 3.3)) * ALT + Math.sin(v * 6 + i) * 46 - v * 40;
        G.Personagens.pomba(ctx, S, x, y, 0.8 + 0.3 * hash1(i * 5.1), { fase: S.tl * 9 + i, bate: 0.3 + 0.7 * Math.sin(S.tl * 9 + i), rot: Math.cos(v * 6 + i) * 0.14 - 0.1 });
      }
    }
    function motes(ctx, S) {
      const f = 0.35 + 0.5 * S.noite + 0.3 * S.arco;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 46; i++) {
        const x = mod(hash1(i * 3.3) * (S.W + 200) + 28 * Math.sin(S.t * 0.4 + i) - S.t * (8 + 14 * hash1(i * 2.9)), S.W + 200) - 100;
        const y = mod(hash1(i * 7.1 + 5) * ALT * 0.9 - S.t * (5 + 9 * hash1(i * 4.4)), ALT * 0.9) + ALT * 0.06;
        const tw = 0.3 + 0.7 * Math.max(0, Math.sin(S.t * (0.8 + hash1(i) * 2) + i * 2.3));
        R.brilhoRadial(ctx, x, y, 6 + 9 * hash1(i * 1.9 + 3), K.ouroClaro, 0.5 * tw * f);
      }
      ctx.restore();
    }

    // ---------------------------------------------------------------- quadro
    function estadoDe(tl) {
      const hora = horaEm(tl);
      const ceu = ceuEm(hora), noite = noiteF(hora);
      const sub = subida(tl);
      return {
        hora, ceu, noite, sub,
        peste: E.peste(tl), calor: E.calor(tl), tempestade: E.tempestade(tl), ameaca: E.ameaca(tl),
        domo: E.domo(tl), domoForca: E.domoForca(tl),
        asas: asasAbre(tl), asasAlfa: 0.22 + 0.4 * smooth(6, 16, tl) + 0.12 * smooth(tAsas, tAsas + 2, tl) - 0.0,
        arco: smooth(tSalv - 0.2, tSalv + 5, tl) * 0.95, coroa: win(tHonrarei - 0.2, tHonrarei + 0.8, tDias + 4.5, tDias + 6, tl),
        vento: 0.2 + 0.6 * Math.max(E.tempestade(tl), win(tNoite[0] - 3, tNoite[0], tDia[0], tDia[0] + 1, tl) * 0.4),
        fx: 0.5, solForca: 1, rol: rolEm(tl), dyCam: 0,
      };
    }
    function desenhar(ctx, S) {
      Object.assign(S, estadoDe(S.tl));
      S.dyCam = S.sub * 380 * (1 - smooth(0.7, 0.95, S.sub) * 0);          // o mundo desce quando subimos
      const W = S.W, dyK = S.dyCam;
      const z = 1 + 0.03 * clamp(S.tl / dur);
      ctx.save();
      ctx.translate(W / 2, ALT * 0.7); ctx.scale(z, z); ctx.translate(-W / 2, -ALT * 0.7);
      ceuFundo(ctx, S);
      estrelas(ctx, S);
      corpoCeleste(ctx, S);
      nuvens(ctx, S);
      raios(ctx, S);
      arcoIris(ctx, S);
      // montanhas e colinas (descem com a câmera quando subimos ao alto refúgio)
      MONT.longe.dyK = 0.10; MONT.meio.dyK = 0.20; MONT.colinas.dyK = 0.45;
      serra(ctx, S, MONT.longe); serra(ctx, S, MONT.meio); serra(ctx, S, MONT.colinas);
      arvoresDe(ctx, S, 0.22, 240, 0.55, 0.38, 3, (X) => yCrista(MONT.colinas, X), S.dyCam * 0.45);
      if (S.sub < 0.55) {
        const k = 1 - smooth(0.35, 0.55, S.sub);
        ctx.save(); ctx.globalAlpha = k;
        chao(ctx, S);
        plantas(ctx, S, false);
        caverna(ctx, S);
        ctx.restore();
      }
      asasGrandes(ctx, S);
      domo(ctx, S);
      laco(ctx, S);
      // chão e pedestal do cume
      bancoNuvens(ctx, S, 0.90 * ALT + (1 - smooth(0.4, 0.8, S.sub)) * 300, smooth(0.45, 0.8, S.sub) * 0.75, 1, 0.9);
      pedestal(ctx, S);
      personagens(ctx, S);
      if (S.sub < 0.55) { ctx.save(); ctx.globalAlpha = 1 - smooth(0.35, 0.55, S.sub); plantas(ctx, S, true); ctx.restore(); }
      // cobertura de nuvens durante a subida
      const cob = Math.sin(Math.PI * clamp((S.sub - 0.18) / 0.64));
      if (cob > 0.01) bancoNuvens(ctx, S, ALT * (1.05 - 0.55 * cob), cob, 1.6);
      nevoaPeste(ctx, S);
      flechas(ctx, S);
      morcegos(ctx, S);
      calor(ctx, S);
      tempestade(ctx, S);
      pombas(ctx, S);
      motes(ctx, S);
      ctx.restore();
    }

    return { espelho: false, estado: (tl) => ({ fx: 0.5, calor: 0, peso: 0, nevoa: 0, vento: 0.2, solY: 400, solForca: 1, raios: 0, motes: 0, flash: 0 }), desenhar };
  }

  G.TemaSalmo91 = { criar };
})(window);
