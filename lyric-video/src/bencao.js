// Tema "Bênção Sacerdotal", criado do zero a partir da letra inteira (a imagem da música é só um fundo preto), para o
// vídeo final em 16:9. Uma pequena caravana (um ancião, um homem, uma mulher e um menino) recebe a bênção de um sacerdote
// (kohen) no alto de uma colina, de madrugada, e sai a caminhar. A bênção em três partes vira três imagens que voltam a cada
// vez que a letra as repete: a luz que cai como chuva; um talit de luz, com listras azuis e franjas, que cobre a caravana e, à
// noite, vira uma cúpula de estrelas; o sol que nasce (à noite, uma estrela que se acende); as flores que brotam pelo caminho;
// o rosto que se levanta e o caminho à frente que brilha; as pombas e uma onda branca de luz. Entre uma coisa e outra: o dia
// que corre, a noite que guarda, o oásis onde dormem sob a coluna de luz, a aurora, a letra shin (o sinal da bênção) e, no fim,
// a colina outra vez, agora com todos reunidos, e o sacerdote de braços erguidos sob as estrelas. O Pai não é retratado: só luz.
// Os instantes saem do texto da legenda; os trechos que os disparam ficam em `animacao.json`, na pasta da música
// (`gatilhos`), e não neste repositório público. Sem o arquivo, valem os tempos padrão abaixo.
(function (G) {
  'use strict';
  const { clamp, lerp, smooth, mod, css, rgb, hash1, noise1, mulberry32, ease } = G.U;
  const R91 = G.Seres91, PN = G.SeresPN, B = G.SeresBS, K = B.K, ml = R91.ml, brilhoRadial = R91.brilhoRadial, brilho4 = R91.brilho4;
  const ALT = 1080, TAU = Math.PI * 2;
  const SOLO = 0.885 * ALT;                   // linha dos pés
  const HORSKY = 0.74 * ALT;                  // horizonte do céu (o sol e a lua nascem aqui)
  const semNikud = (s) => s.normalize('NFD').replace(/[֑-ׇ]/g, '').replace(/[̀-ͯ]/g, '');
  const H = (hex) => rgb(hex);
  const disco = (ctx, x, y, r, cor) => { ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };

  const PADRAO = {
    ben: [17.12, 85.01, 94.1, 99.06, 103.66, 170.35, 180.05, 185.27, 189.98, 247.18, 275.67, 319.07],
    gua: [22.9, 90.08, 96.45, 101.05, 108.57, 176.01, 183.15, 187.66, 194.76, 252.53, 280.27, 324.42],
    ros: [27.36, 113.38, 161.77, 199.55, 257.06, 285.08, 329.11],
    gra: [32.4, 118.45, 166.91, 204.62, 262.18, 290.0, 334.63],
    lev: [210.88, 220.07, 229.09, 238.75, 265.53, 294.66, 338.62],
    paz: [215.51, 225.0, 233.94, 243.35, 270.68, 300.61, 343.58],
    shalom: [305.73, 311.0, 348.43, 351.5],
    caminhar: [47.89],
    mao: [51.01],
    noite: [57.54],
    guardanoite: [60.01],
    olhos: [65.62],
    pazaqui: [70.97],
    passo: [75.64],
    presente: [79.23],
    levantar: [124.91],
    luzbrilhe: [127.06],
    deitar: [134.7],
    pazenvolver: [137.16],
    rostonos: [143.18],
    resplandecer: [147.95],
    acompanhe: [152.4],
    nome: [155.51],
    voltefinal: [294.66],
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
    const T = (nome, n) => {                  // busca sem acentos nem sinais vocálicos, dos dois lados
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
    const tBen = TT('ben'), tGua = TT('gua'), tRos = TT('ros'), tGra = TT('gra'), tLev = TT('lev'), tPaz = TT('paz'), tShalom = TT('shalom');
    const tCaminhar = T('caminhar'), tMao = T('mao'), tNoite = T('noite'), tGuardaNoite = T('guardanoite'), tOlhos = T('olhos'), tPazAqui = T('pazaqui');
    const tPasso = T('passo'), tPresente = T('presente'), tLevantar = T('levantar'), tLuzBrilhe = T('luzbrilhe'), tDeitar = T('deitar'), tPazEnvolver = T('pazenvolver');
    const tRostoNos = T('rostonos'), tResplandecer = T('resplandecer'), tAcompanhe = T('acompanhe'), tNome = T('nome'), tVolteFinal = T('voltefinal');
    const win = (a, b, c, d, t) => smooth(a, b, t) * (1 - smooth(c, d, t));
    const pulso = (t0, sobe, desce, t) => win(t0 - 0.1, t0 + sobe, t0 + sobe + 0.5, t0 + sobe + desce, t);
    const pulsos = (arr, sobe, desce, t) => arr.reduce((m, t0) => Math.max(m, pulso(t0, sobe, desce, t)), 0);

    // ---------------------------------------------------------------- horas do dia (o dia corre conforme a letra; passa de 24 quando amanhece de novo)
    const HS = [
      [0, 4.7], [tBen[0], 4.9], [tRos[0], 5.5], [tRos[0] + 3.2, 6.2], [tGra[0] + 5.5, 7.0], [tCaminhar, 7.8], [tMao, 9.3], [tMao + 3.4, 13.5],
      [tNoite - 0.2, 17.2], [tNoite + 1.3, 18.8], [tGuardaNoite + 1.0, 20.6], [tOlhos, 21.6], [tBen[1], 23.2], [tBen[3], 26.0],
      [tRos[1] - 0.6, 29.1], [tRos[1] + 0.5, 29.7], [tRos[1] + 3.0, 30.3], [tLevantar, 31.5], [tLuzBrilhe, 32.2], [tLuzBrilhe + 3.4, 36.5],
      [tDeitar - 1.0, 41.0], [tDeitar + 1.0, 42.6], [tPazEnvolver, 43.3], [tRostoNos, 44.6], [tAcompanhe, 48.0],
      [tRos[2] - 3.8, 52.6], [tRos[2], 53.7], [tRos[2] + 5.1, 54.6], [tGra[2] + 3.5, 55.3], [tBen[8], 59.0], [tRos[3], 60.2],
      [tLev[0], 62.0], [tLev[2], 64.8], [tLev[3], 65.9], [tBen[9], 66.9], [tBen[9] + 8, 67.9], [tLev[4], 69.6], [tVolteFinal, 72.0], [tBen[11], 73.2], [dur + 1, 75.6],
    ];
    const horaEm = (tl) => {
      let i = 0; while (i < HS.length - 2 && HS[i + 1][0] <= tl) i++;
      const [a, ha] = HS[i], [b, hb] = HS[i + 1];
      return lerp(ha, hb, clamp((tl - a) / Math.max(1e-6, b - a)));
    };

    // ---------------------------------------------------------------- caminhada: o mundo rola, a caravana fica na tela
    const PASSO = 1 / 30, V = 96;
    const T_ARR1 = tPresente + 1.4, T_ARR2 = tDeitar - 0.2, T_ARR3 = tLev[0] - 1.2, T_W4S = tBen[9] - 1.2, T_ARR4 = tVolteFinal - 0.6;
    const JANELAS = [
      [tCaminhar - 1.2, tCaminhar + 0.6, tPresente - 0.4, T_ARR1, 1],
      [tLuzBrilhe + 0.2, tLuzBrilhe + 1.4, tDeitar - 1.8, T_ARR2, 1.9],                // o dia corre: eles andam mais depressa
      [tAcompanhe - 0.2, tAcompanhe + 1.2, tLev[0] - 2.8, T_ARR3, 1],
      [T_W4S, T_W4S + 1.6, tVolteFinal - 3.0, T_ARR4, 1],
    ];
    const velEm = (t) => { let v = 0; for (const [p, q, r, s, m] of JANELAS) v = Math.max(v, win(p, q, r, s, t) * m); return v; };
    const andarEm = (t) => Math.min(1, velEm(t));
    const nTab = Math.ceil(dur / PASSO) + 3, rolTab = new Float64Array(nTab);
    for (let i = 1; i < nTab; i++) rolTab[i] = rolTab[i - 1] + V * velEm((i - 1) * PASSO) * PASSO;
    const rolEm = (t) => { const x = clamp(t / PASSO, 0, nTab - 1.001), i = Math.floor(x); return lerp(rolTab[i], rolTab[i + 1], x - i); };
    const rolVel = (t) => V * velEm(t);

    // estações (coordenadas do mundo): a colina do sacerdote, o oásis, o bosque de oliveiras, a colina do fim
    const X_PLAT_A = 340;
    const X_FOGO1 = rolEm(T_ARR1) + 1010, X_FOGO2 = rolEm(T_ARR2) + 1010, X_PLAT_B = rolEm(T_ARR4) + 1560;
    const T_PONTE = tBen[7] - 2.4;                                    // atravessam a ponte durante a caminhada do dia
    const X_RIO = rolEm(T_PONTE) + 960, RIO_W = 215, X_OLIVA = rolEm(T_ARR3) + 1390;
    const noRio = (X) => Math.abs(X - X_RIO) < RIO_W + 16;
    const K_SAC = 1.12, ALTPLAT = B.ALT_PLAT;

    // ---------------------------------------------------------------- a caravana (posições na tela por momento)
    const QUEM = [
      { id: 'homem', tipo: 'aldeao', cor: H('#ffd5b0'), esc: 1.08, dy: 0, form: 760, open: 720, camp: 700, campDir: 1, ridge: 800, hill: 880, sem: 1 },
      { id: 'mulher', tipo: 'aldeao', cor: H('#fbe5a4'), veu: true, manto: H('#fff5e0'), esc: 1.06, dy: 12, form: 880, open: 830, camp: 850, campDir: 1, ridge: 910, hill: 990, sem: 2 },
      { id: 'anciao', tipo: 'vizinho', esc: 1.07, dy: -6, form: 1010, open: 940, camp: 1280, campDir: -1, ridge: 1020, hill: 1100, sem: 3 },
      { id: 'menino', tipo: 'menino', esc: 1.22, dy: 10, form: 1130, open: 1050, camp: 1180, campDir: -1, ridge: 1120, hill: 1215, sem: 4 },
    ];
    const T_A = tCaminhar - 1.0, T_B = tCaminhar + 1.0;
    const pesos = (tl) => ({
      open: 1 - smooth(T_A, T_B, tl),
      c1: win(T_ARR1 - 0.8, T_ARR1 + 1.2, tLuzBrilhe + 0.2, tLuzBrilhe + 1.4, tl),
      c2: win(T_ARR2 - 0.8, T_ARR2 + 1.2, tAcompanhe - 0.2, tAcompanhe + 1.2, tl),
      ri: win(T_ARR3 - 0.8, T_ARR3 + 1.2, T_W4S - 0.6, T_W4S + 0.8, tl),
      hi: smooth(T_ARR4 - 0.8, T_ARR4 + 1.6, tl),
    });
    const posQuem = (q, tl) => {
      const w = pesos(tl), c = w.c1 + w.c2;
      let x = q.form + w.open * (q.open - q.form) + c * (q.camp - q.form) + w.ri * (q.ridge - q.form) + w.hi * (q.hill - q.form);
      if (q.id === 'menino') x += 22 * Math.sin(tl * 0.8) * andarEm(tl) * (1 - c);            // o menino corre à frente e volta
      return { x, dirv: 1 - 2 * w.open + c * (q.campDir - 1) };
    };
    const T_SLEEP1 = tBen[1] + 4.0;
    const sentadoRidge = (tl) => win(tLev[1] - 0.6, tLev[1] + 0.6, T_W4S - 2.2, T_W4S - 0.8, tl);
    const sentadoEm = (tl) => Math.max(
      win(T_ARR1 + 0.6, T_ARR1 + 1.6, T_SLEEP1 - 0.2, T_SLEEP1 + 0.4, tl),
      win(tLevantar + 0.2, tLevantar + 0.9, tLuzBrilhe + 0.3, tLuzBrilhe + 1.2, tl),
      win(T_ARR2 + 0.6, T_ARR2 + 1.4, tPazEnvolver - 0.6, tPazEnvolver + 0.2, tl),
      win(tRostoNos, tRostoNos + 0.8, tAcompanhe - 0.9, tAcompanhe + 0.1, tl),
      sentadoRidge(tl));
    const dormeEm = (tl) => Math.max(
      win(T_SLEEP1, T_SLEEP1 + 0.6, tLevantar - 0.3, tLevantar + 0.4, tl),
      win(tPazEnvolver, tPazEnvolver + 0.8, tRostoNos - 0.4, tRostoNos + 0.4, tl));
    const centroGrupo = (tl) => { let s = 0; for (const q of QUEM) s += posQuem(q, tl).x; return s / QUEM.length; };

    // ---------------------------------------------------------------- terreno, camadas e cor
    const MONT = {
      longe: { par: 0.03, base: 0.665, a: [100, 40, 14], per: [900, 420, 170], p: [0.9, 2.4, 4.1], pico: true, cor: '#cdcbf0', haze: 0.45 },
      meio: { par: 0.08, base: 0.735, a: [46, 18, 7], per: [760, 340, 150], p: [2.2, 0.6, 3.1], cor: '#e0cfe8', haze: 0.32 },
      colinas: { par: 0.20, base: 0.800, a: [26, 10, 4], per: [640, 290, 120], p: [1.0, 3.0, 0.4], cor: '#f0ddc4', haze: 0.15 },
    };
    function yCrista(Lc, X) {
      const w0 = Math.sin(TAU * X / Lc.per[0] + Lc.p[0]), w1 = Math.sin(TAU * X / Lc.per[1] + Lc.p[1]), w2 = Math.sin(TAU * X / Lc.per[2] + Lc.p[2]);
      const h0 = Lc.pico ? Lc.a[0] * (1.12 - 1.5 * Math.abs(w0)) : Lc.a[0] * w0;
      return Lc.base * ALT - (h0 + Lc.a[1] * w1 + Lc.a[2] * w2);
    }
    function luzObj(S, cor, k) {
      const c = typeof cor === 'string' ? H(cor) : cor;
      return ml(ml(c, S.ceu.mid, S.noite * 0.5 * (k || 1)), S.ceu.hor, 0.1 * (k || 1) * (1 - S.noite));
    }
    const borda = (x) => 0.835 * ALT + 5 * Math.sin(x * 0.0057) + 2.5 * Math.sin(x * 0.019);

    // ---------------------------------------------------------------- céu
    function ceuFundo(ctx, S) {
      const c = S.ceu, g = ctx.createLinearGradient(0, 0, 0, HORSKY + 50);
      g.addColorStop(0, css(c.top)); g.addColorStop(0.5, css(c.mid)); g.addColorStop(1, css(c.hor));
      ctx.fillStyle = g; ctx.fillRect(-40, -40, S.W + 80, ALT + 80);
    }
    const rE = mulberry32(61);
    const ESTRELAS = Array.from({ length: Math.round(120 + W * 0.1) }, () => ({ u: rE(), v: Math.pow(rE(), 1.25), r: 0.7 + Math.pow(rE(), 3) * 2.2, w: 0.7 + rE() * 2.4, f: rE() * TAU }));
    const GRANDES = Array.from({ length: 16 }, (_, i) => ({ u: 0.06 + 0.88 * hash1(i * 7.3 + 1), v: 0.04 + 0.4 * hash1(i * 3.9 + 2) }));
    function estrelas(ctx, S) {
      if (S.noite < 0.03) return;
      const olhos = Math.max(pulso(tOlhos, 1.0, 5.0, S.tl), 0.9 * win(tShalom[0] + 4, tShalom[0] + 8, tBen[11] - 1, tBen[11] + 1, S.tl));
      for (const e of ESTRELAS) {
        const y = e.v * HORSKY * 0.95, tw = 0.55 + 0.45 * Math.sin(S.t * e.w + e.f);
        const a = Math.min(1, S.noite * tw * clamp((HORSKY - y) / 220) * (1 + 0.4 * olhos));
        if (a < 0.03) continue;
        ctx.fillStyle = css(K.luz, a);
        if (e.r > 2) brilho4(ctx, e.u * S.W, y, e.r * 3); else { ctx.beginPath(); ctx.arc(e.u * S.W, y, e.r, 0, TAU); ctx.fill(); }
      }
      if (olhos > 0.02) {                                                   // "os Seus olhos estejam sobre nós": as estrelas grandes se abrem, uma a uma
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        GRANDES.forEach((e, i) => {
          const f = Math.max(smooth(i * 0.05, i * 0.05 + 0.4, olhos), olhos * 0.55), x = e.u * S.W, y = e.v * HORSKY;
          brilhoRadial(ctx, x, y, 38 + 36 * f, K.luzOuro, 0.5 * f * S.noite);
          ctx.fillStyle = css(K.luz, 0.95 * f * S.noite); brilho4(ctx, x, y, 10 + 16 * f);
        });
        ctx.strokeStyle = css(K.luz, 0.14 * olhos * S.noite); ctx.lineWidth = 1.2; ctx.beginPath();
        GRANDES.forEach((e, i) => { const x = e.u * S.W, y = e.v * HORSKY; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
        ctx.stroke(); ctx.restore();
      }
      for (const [t0, x0, y0] of [[8.4, 0.2, 0.1], [tPazAqui + 2, 0.55, 0.08], [tPasso + 1, 0.3, 0.12], [tRostoNos + 4, 0.62, 0.1], [tShalom[1] + 3, 0.25, 0.1], [tShalom[3] + 6, 0.7, 0.13]]) {
        const u = (S.tl - t0) / 1.2;                                         // estrelas cadentes
        if (u < 0 || u > 1) continue;
        const x = S.W * x0 + 300 * u, y = ALT * y0 + 120 * u;
        const g = ctx.createLinearGradient(x - 100, y - 40, x, y);
        g.addColorStop(0, css(K.luz, 0)); g.addColorStop(1, css(K.luz, 0.9 * Math.sin(Math.PI * u) * S.noite));
        ctx.strokeStyle = g; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 100, y - 40); ctx.lineTo(x, y); ctx.stroke();
      }
    }
    function corpoCeleste(ctx, S) {
      const h = mod(S.hora, 24), Wd = S.W;
      const aS = Math.PI * (h - 6) / 12, altS = Math.sin(aS);
      S.sol = { x: Wd * (0.5 - Math.cos(aS) * 0.44), y: HORSKY - altS * 0.6 * ALT, alt: altS };
      if (altS > -0.2) {
        const baixo = 1 - clamp(altS * 2.4), r = 46 * (1 + 0.25 * baixo), quente = ml(K.creme, H('#ffb98f'), baixo * 0.9);
        const f = clamp((altS + 0.2) / 0.3), rasa = lerp(0.55, 1, smooth(0.0, 0.35, altS));
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
        const vis = S.noite * clamp((altL + 0.1) / 0.3), r = 36;
        brilhoRadial(ctx, S.lua.x, S.lua.y, 200, H('#c9d0ff'), 0.42 * vis);
        const g = ctx.createRadialGradient(S.lua.x - r * 0.3, S.lua.y - r * 0.3, r * 0.1, S.lua.x, S.lua.y, r);
        g.addColorStop(0, css(H('#fbfcff'), vis)); g.addColorStop(0.7, css(H('#e8ebfa'), vis)); g.addColorStop(1, css(H('#c9cee8'), vis));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(S.lua.x, S.lua.y, r, 0, TAU); ctx.fill();
        ctx.fillStyle = css(H('#a9b0d6'), 0.3 * vis);
        for (const [dx, dy, rr] of [[-0.32, -0.28, 0.2], [0.34, 0.12, 0.15], [-0.08, 0.5, 0.11]]) { ctx.beginPath(); ctx.arc(S.lua.x + dx * r, S.lua.y + dy * r, rr * r, 0, TAU); ctx.fill(); }
      }
    }
    const rN = mulberry32(97);
    const NUVENS = Array.from({ length: Math.round(6 + W / 220) }, () => ({ x0: rN() * (W + 800), y: (0.05 + rN() * 0.4) * ALT, w: 150 + rN() * 240, h: 0.16 + rN() * 0.14, v: 3 + rN() * 6, a: 0.28 + rN() * 0.3, tom: rN() }));
    function nuvens(ctx, S) {
      const per = S.W + 800;
      for (const n of NUVENS) {
        const x = mod(n.x0 - S.t * n.v - S.rol * 0.04, per) - 400;
        let col = ml(K.luz, S.ceu.mid, 0.25 + 0.4 * S.noite);
        col = ml(col, K.rosa, n.tom * 0.3 * (1 - S.noite));
        const a = n.a * (1 - 0.4 * S.noite);
        ctx.save(); ctx.translate(x, n.y); ctx.scale(1, n.h);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, n.w);
        g.addColorStop(0, css(col, a)); g.addColorStop(0.5, css(col, a * 0.55)); g.addColorStop(1, css(col, 0));
        ctx.fillStyle = g; ctx.fillRect(-n.w, -n.w, n.w * 2, n.w * 2);
        ctx.restore();
      }
    }
    function raios(ctx, S, extra) {
      if (!S.sol || S.sol.alt < -0.05) return;
      const f = clamp(1 - Math.abs(S.sol.alt - 0.2) * 1.6) * (0.4 + 0.6 * S.A.energia) + extra;
      if (f < 0.03) return;
      const L = 2400;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(S.sol.x, S.sol.y);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU + S.t * 0.02, larg = 0.045 + 0.03 * hash1(i * 3.1);
        const g = ctx.createLinearGradient(0, 0, L, 0); g.addColorStop(0, css(K.luzOuro, 0.075 * f)); g.addColorStop(1, css(K.luzOuro, 0));
        ctx.save(); ctx.rotate(a); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(L, -L * larg); ctx.lineTo(L, L * larg); ctx.closePath(); ctx.fill(); ctx.restore();
      }
      ctx.restore();
    }
    // o sol (ou, à noite, uma estrela) explode em luz
    const BRANCO = H('#fffdf2');
    function resplandece(ctx, S) {
      const p = pulsos(tRos, 0.9, 4.2, S.tl);
      if (p < 0.02) return;
      const dia = S.sol.alt > 0.02;
      const x = dia ? S.sol.x : S.W * 0.72, y = dia ? S.sol.y : ALT * 0.2;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      if (dia) {
        brilhoRadial(ctx, x, y, 520 * (0.6 + 0.4 * p), K.luzOuro, 0.42 * p);
        brilhoRadial(ctx, x, y, 170, K.luz, 0.85 * p);
      } else {
        // à noite o brilho cai depressa do centro (uma estrela, não um disco), para não achatar o céu escuro
        const nucleo = (r, a) => {
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, css(BRANCO, a)); g.addColorStop(0.1, css(BRANCO, a * 0.5)); g.addColorStop(0.32, css(K.luzOuro, a * 0.14)); g.addColorStop(1, css(K.luzOuro, 0));
          ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
        };
        nucleo(460 * (0.6 + 0.4 * p), 0.55 * p);
        nucleo(130, 0.7 * p);
      }
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * TAU + S.t * 0.07, L = 700 * (0.4 + 0.6 * p), g = ctx.createLinearGradient(x, y, x + Math.cos(a) * L, y + Math.sin(a) * L);
        g.addColorStop(0, css(K.luz, 0.26 * p)); g.addColorStop(1, css(K.luzOuro, 0));
        ctx.strokeStyle = g; ctx.lineWidth = 7 + 5 * (i % 2); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); ctx.stroke();
      }
      if (!dia) { ctx.fillStyle = css(BRANCO, 0.95 * p); brilho4(ctx, x, y, 70 * p); }
      ctx.fillStyle = css(K.luzOuro, 0.07 * p); ctx.fillRect(-40, -40, S.W + 80, ALT + 80);
      ctx.restore();
    }

    // ---------------------------------------------------------------- montanhas e colinas (com árvores ao longe)
    function serra(ctx, S, Lc) {
      const Wd = S.W, cam = S.rol * Lc.par;
      const topoC = luzObj(S, ml(H(Lc.cor), S.ceu.hor, Lc.haze), 1), fundoC = luzObj(S, ml(H(Lc.cor), S.ceu.mid, Lc.haze + 0.22), 1);
      ctx.beginPath(); ctx.moveTo(-20, ALT + 20);
      for (let x = -20; x <= Wd + 20; x += 6) ctx.lineTo(x, yCrista(Lc, x + cam));
      ctx.lineTo(Wd + 20, ALT + 20); ctx.closePath();
      const yTop = Lc.base * ALT - (Lc.a[0] * 1.12 + Lc.a[1] + Lc.a[2]);
      const g = ctx.createLinearGradient(0, yTop, 0, yTop + 380);
      g.addColorStop(0, css(topoC)); g.addColorStop(1, css(fundoC));
      ctx.fillStyle = g; ctx.fill();
    }
    function arvoresLonge(ctx, S, Lc, cel, prob, esc, sem) {
      const cam = S.rol * Lc.par, c0 = Math.floor((cam - 80) / cel), c1 = Math.floor((cam + S.W + 80) / cel);
      for (let c = c0; c <= c1; c++) {
        if (hash1(c * 3.31 + sem) > prob) continue;
        const sx = c * cel + hash1(c * 1.7 + sem) * cel * 0.8 - cam, s = esc * (0.75 + hash1(c * 5.9 + sem) * 0.5), y = yCrista(Lc, sx + cam) + 2;
        const cip = hash1(c * 2.2 + sem) < 0.5, f1 = luzObj(S, cip ? '#a8d0b8' : '#bcd8b4', 0.9);
        ctx.strokeStyle = css(luzObj(S, '#d4bcae', 0.8)); ctx.lineWidth = 6 * s; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx, y); ctx.lineTo(sx, y - 30 * s); ctx.stroke();
        ctx.fillStyle = css(f1); ctx.beginPath();
        if (cip) ctx.ellipse(sx, y - 62 * s, 15 * s, 46 * s, 0, 0, TAU); else { ctx.ellipse(sx, y - 52 * s, 26 * s, 20 * s, 0, 0, TAU); ctx.ellipse(sx - 14 * s, y - 44 * s, 17 * s, 14 * s, 0, 0, TAU); }
        ctx.fill();
      }
    }

    // ---------------------------------------------------------------- chão, caminho, flora (as flores brotam pelo caminho)
    function chao(ctx, S) {
      const Wd = S.W, cam = S.rol;
      const g = ctx.createLinearGradient(0, 0.83 * ALT, 0, ALT);
      g.addColorStop(0, css(luzObj(S, ml(H('#f5e6cc'), H('#e3efcf'), S.flor * 0.3), 1))); g.addColorStop(1, css(luzObj(S, ml(H('#ead3b0'), H('#cfe4b9'), S.flor * 0.3), 1)));
      ctx.beginPath(); ctx.moveTo(-20, ALT + 20);
      for (let x = -20; x <= Wd + 20; x += 8) ctx.lineTo(x, borda(x + cam));
      ctx.lineTo(Wd + 20, ALT + 20); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = css(K.luz, 0.3 * (1 - S.noite * 0.6)); ctx.lineWidth = 2.4; ctx.beginPath();
      for (let x = -20; x <= Wd + 20; x += 8) x === -20 ? ctx.moveTo(x, borda(x + cam)) : ctx.lineTo(x, borda(x + cam));
      ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-20, ALT + 20);                              // caminho de terra clara
      const yc = (x) => SOLO + 8 + Math.sin((x + cam) * 0.005) * 6;
      for (let x = -20; x <= Wd + 20; x += 8) ctx.lineTo(x, yc(x) - 24 + Math.sin((x + cam) * 0.013) * 3);
      for (let x = Wd + 20; x >= -20; x -= 8) ctx.lineTo(x, yc(x) + 34 + Math.sin((x + cam) * 0.011) * 3);
      ctx.closePath();
      const gp = ctx.createLinearGradient(0, SOLO - 20, 0, SOLO + 46);
      gp.addColorStop(0, css(luzObj(S, '#fbf1de', 0.9))); gp.addColorStop(1, css(luzObj(S, '#f1dfc3', 0.9)));
      ctx.fillStyle = gp; ctx.fill();
      ctx.fillStyle = css(luzObj(S, '#e3cfb0', 0.9), 0.7);                     // pedrinhas no caminho
      for (let c = Math.floor((cam - 40) / 46); c <= Math.floor((cam + Wd + 40) / 46); c++) { const h = hash1(c * 6.1); if (h < 0.5) continue; ctx.beginPath(); ctx.ellipse(c * 46 - cam, SOLO + 2 + 24 * hash1(c * 2.3), 4 + 3 * h, 2.2, 0, 0, TAU); ctx.fill(); }
    }
    const FLORES = ['#f7c6d2', '#fff1d6', '#e2dcf6', '#ffd9b8', '#fbe2ef', '#cfe9ff'].map(H);
    function flora(ctx, S, frente) {
      const Wd = S.W, cam = S.rol, CEL = 30, fl = S.flor;
      for (let c = Math.floor((cam - 40) / CEL); c <= Math.floor((cam + Wd + 40) / CEL); c++) {
        const h1 = hash1(c * 2.13 + (frente ? 7 : 3)), h2 = hash1(c * 7.77 + 1), h3 = hash1(c * 4.9 + 9);
        const sx = c * CEL + h1 * CEL - cam;
        if (noRio(sx + cam)) continue;
        const y0 = frente ? SOLO + 46 + h3 * 100 : lerp(borda(sx + cam) + 10, SOLO - 30, h3);
        const esc = frente ? 0.9 + 0.5 * h3 : 0.55 + 0.35 * h3;
        ctx.lineCap = 'round';
        const n = 2 + Math.floor(h1 * 3);
        for (let i = 0; i < n; i++) {
          const alt = (10 + hash1(c * 3.3 + i) * 18) * esc * (0.7 + 0.5 * fl), lean = (i - (n - 1) / 2) * 5 * esc + Math.sin(S.t * 1.3 + c * 0.7 + i) * 2.5 * (alt / 26);
          ctx.strokeStyle = css(luzObj(S, i % 2 ? ml(H('#b7ceae'), H('#8fd3ae'), fl) : ml(H('#cfd9b4'), H('#aee3c4'), fl), 0.9)); ctx.lineWidth = 2.3 * esc;
          ctx.beginPath(); ctx.moveTo(sx + (i - n / 2) * 3 * esc, y0); ctx.quadraticCurveTo(sx + lean * 0.5, y0 - alt * 0.6, sx + lean, y0 - alt); ctx.stroke();
        }
        const crescer = clamp((fl - h2 * 0.9) * 3);
        if (crescer > 0.02) {
          const hf = (14 + 16 * h1) * esc, cor = FLORES[Math.floor(h3 * FLORES.length)], bal = Math.sin(S.t * 1.6 + c * 4) * 2 * esc;
          ctx.strokeStyle = css(luzObj(S, '#8fd3ae', 0.9)); ctx.lineWidth = 1.8 * esc; ctx.beginPath(); ctx.moveTo(sx + 6, y0); ctx.quadraticCurveTo(sx + 6 + bal * 0.4, y0 - hf * crescer * 0.5, sx + 6 + bal, y0 - hf * crescer); ctx.stroke();
          ctx.fillStyle = css(luzObj(S, cor, 0.7));
          for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU + c; ctx.beginPath(); ctx.arc(sx + 6 + bal + Math.cos(a) * 4 * esc * crescer, y0 - hf * crescer + Math.sin(a) * 4 * esc * crescer, 3 * esc * crescer, 0, TAU); ctx.fill(); }
          ctx.fillStyle = css(K.ouro); ctx.beginPath(); ctx.arc(sx + 6 + bal, y0 - hf * crescer, 2 * esc * crescer, 0, TAU); ctx.fill();
        }
      }
    }
    function pedras(ctx, S, frente) {
      const cam = S.rol, CEL = 190;
      for (let c = Math.floor((cam - 120) / CEL); c <= Math.floor((cam + S.W + 120) / CEL); c++) {
        const h = hash1(c * 5.17 + (frente ? 3 : 1));
        if (h > 0.62) continue;
        const sx = c * CEL + hash1(c * 2.9) * CEL - cam;
        if (noRio(sx + cam)) continue;
        const y = frente ? SOLO + 70 + 50 * hash1(c * 8.1) : SOLO - 34 - 22 * hash1(c * 8.1);
        if (h < 0.3) B.rocha(ctx, sx, y, frente ? 1.1 : 0.7, c); else B.arbusto(ctx, sx, y, frente ? 1.0 : 0.62, c, S.t);
      }
    }

    function rio(ctx, S) {
      const x = X_RIO - S.rol;
      if (x < -RIO_W - 260 || x > S.W + RIO_W + 260) return;
      const topo = borda(X_RIO) + 4;
      ctx.save();
      ctx.beginPath(); ctx.moveTo(x - RIO_W - 10, topo + 2);
      ctx.quadraticCurveTo(x - RIO_W + 30, topo - 8, x + RIO_W - 30, topo - 8); ctx.lineTo(x + RIO_W + 10, topo + 2);
      ctx.quadraticCurveTo(x + RIO_W + 40, SOLO + 40, x + RIO_W + 90, ALT + 30); ctx.lineTo(x - RIO_W - 90, ALT + 30); ctx.quadraticCurveTo(x - RIO_W - 40, SOLO + 40, x - RIO_W - 10, topo + 2);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, topo, 0, ALT);
      g.addColorStop(0, css(ml(S.ceu.hor, H('#bfe6ee'), 0.55))); g.addColorStop(1, css(ml(S.ceu.mid, H('#8fcbdd'), 0.6)));
      ctx.fillStyle = g; ctx.fill(); ctx.clip();
      ctx.strokeStyle = css(K.luz, 0.5); ctx.lineWidth = 1.6;
      for (let i = 0; i < 9; i++) {
        const y = topo + 18 + i * (ALT - topo) / 9.5, ph = S.t * 0.9 + i * 1.9;
        ctx.beginPath(); for (let xx = x - RIO_W - 90; xx <= x + RIO_W + 90; xx += 12) { const y2 = y + Math.sin(xx * 0.03 + ph) * (1.4 + i * 0.25); xx === x - RIO_W - 90 ? ctx.moveTo(xx, y2) : ctx.lineTo(xx, y2); } ctx.stroke();
      }
      if (S.sol && S.sol.alt > -0.05) { ctx.fillStyle = css(K.luz, 0.6 * (1 - S.noite)); for (let i = 0; i < 22; i++) { const tw = Math.max(0, Math.sin(S.t * (1.4 + hash1(i) * 2) + i)); ctx.fillRect(x - RIO_W + hash1(i * 3.1) * RIO_W * 2, topo + 10 + hash1(i * 7.3) * (ALT - topo) * 0.9, 6 + 16 * tw, 1.8); } }
      ctx.restore();
      ctx.strokeStyle = css(K.luz, 0.5); ctx.lineWidth = 3;                                         // margens claras
      for (const lado of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + lado * (RIO_W + 10), topo + 2); ctx.quadraticCurveTo(x + lado * (RIO_W + 40), SOLO + 40, x + lado * (RIO_W + 90), ALT + 30); ctx.stroke(); }
      // a ponte de madeira
      const dk = SOLO + 6, L = RIO_W + 40;
      for (const px of [-0.62, 0, 0.62]) { ctx.fillStyle = css(K.madeiraEsc); ctx.fillRect(x + px * L - 7, dk + 10, 14, 120); }
      ctx.fillStyle = css(K.madeira); ctx.beginPath(); ctx.roundRect(x - L, dk, L * 2, 15, 5); ctx.fill();
      ctx.strokeStyle = css(K.madeiraEsc, 0.7); ctx.lineWidth = 1.4; for (let i = -L + 14; i < L; i += 24) { ctx.beginPath(); ctx.moveTo(x + i, dk); ctx.lineTo(x + i, dk + 15); ctx.stroke(); }
      ctx.strokeStyle = css(K.madeira); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x - L, dk - 34); ctx.lineTo(x + L, dk - 34); ctx.stroke();      // corrimão do fundo
      ctx.lineWidth = 4; for (let i = -L + 6; i <= L; i += 46) { ctx.beginPath(); ctx.moveTo(x + i, dk); ctx.lineTo(x + i, dk - 34); ctx.stroke(); }
    }
    function oliveiraGrande(ctx, S) {
      const x = X_OLIVA - S.rol;
      if (x < -300 || x > S.W + 300) return;
      PN.oliveira(ctx, x, SOLO - 14, 2.1, { t: S.t });
      B.rocha(ctx, x - 190, SOLO + 14, 0.9, 31);
    }

    // ---------------------------------------------------------------- os seis gestos da bênção
    const gx0 = (S) => S.gx, gTopo = () => SOLO - 235;
    // a luz cai como chuva sobre a caravana (no começo, escorre das mãos do sacerdote)
    function chuvaLuz(ctx, S) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      tBen.forEach((t0, i) => {
        const u = (S.tl - t0 + 0.3) / 5.2;
        if (u < 0 || u > 1) return;
        const inten = 0.7 + 0.3 * i / (tBen.length - 1);
        const hx = X_PLAT_A - S.rol, hy = SOLO - ALTPLAT - 250 * K_SAC;
        for (let j = 0; j < 38; j++) {
          const d = hash1(j * 3.1 + i) * 0.4, v = (u - d) / 0.6;
          if (v < 0 || v > 1) continue;
          let x, y;
          if (i === 0 && X_PLAT_A - S.rol > -200) {
            const tx = S.gx + (hash1(j * 7.7) - 0.5) * 300, ty = gTopo() + 40 * hash1(j * 2.3), px = hx + (hash1(j * 5.1) - 0.5) * 130, py = hy + (hash1(j * 1.7) - 0.5) * 30;
            x = lerp(px, tx, ease.inOutSine(v)); y = lerp(py, ty, ease.inOutSine(v)) - Math.sin(Math.PI * v) * 90;
          } else {
            x = S.gx + (hash1(j * 7.7 + i) - 0.5) * 600 + Math.sin(v * 6 + j) * 18; y = lerp(-40, SOLO - 190, v);
          }
          brilhoRadial(ctx, x, y, 7 + 7 * hash1(j * 4.4), K.luzOuro, 0.85 * Math.sin(Math.PI * v) * inten);
          if (j % 3 === 0) { ctx.fillStyle = css(K.luz, 0.95 * Math.sin(Math.PI * v) * inten); brilho4(ctx, x, y, 3 + 3 * hash1(j)); }
        }
      });
      ctx.restore();
    }
    // o talit de luz cobre a caravana; à noite é uma cúpula de estrelas; depois as pontas descem até o chão
    function cobertura(S) {
      const tl = S.tl;
      let base = 0;
      if (tl > tMao - 0.6) base = (0.3 + 0.42 * S.noite) * smooth(tMao - 0.6, tMao + 2.4, tl) * (1 - smooth(tVolteFinal - 1.0, tVolteFinal + 2.0, tl));
      const guarda = pulsos(tGua, 0.7, 4.6, tl);
      return clamp(Math.max(base, 0.85 * guarda));
    }
    function manto(ctx, S) {
      const a = cobertura(S);
      if (a < 0.02) return;
      const dorme = S.dorme, drop = Math.max(win(tPazEnvolver - 0.4, tPazEnvolver + 1.4, tRostoNos - 1.0, tRostoNos + 1.4, S.tl), 0.55 * dorme, 0.3 * pulsos(tGua, 0.7, 4.0, S.tl));
      const cy = SOLO - lerp(262, 160, clamp(Math.max(S.sentado, dorme)));
      B.mantoLuz(ctx, S.gx, cy, 680 + 60 * dorme, { a, t: S.t, h: lerp(150, 120, dorme), drop, queda: 175, estrelas: Math.max(S.noite, 0.4 * a) });
    }
    function anelChao(ctx, S) {
      const p = pulsos(tGua, 0.6, 4.4, S.tl);
      if (p < 0.02) return;
      ctx.save(); ctx.strokeStyle = css(K.ouroForte, 0.8 * p); ctx.lineWidth = 3;
      const u = 1 - p * 0.35;
      ctx.beginPath(); ctx.ellipse(S.gx, SOLO + 18, 420 * u, 30 * u, 0, 0, TAU); ctx.stroke();
      ctx.fillStyle = css(K.luz, 0.8 * p);
      for (let i = 0; i < 16; i++) { const an = (i / 16) * TAU + S.t * 0.4; brilho4(ctx, S.gx + Math.cos(an) * 420 * u, SOLO + 18 + Math.sin(an) * 30 * u, 3 + 2 * Math.sin(S.t * 3 + i)); }
      ctx.restore();
    }
    // "te dê graça": pétalas sobem do chão
    function petalas(ctx, S) {
      ctx.save();
      tGra.forEach((t0, i) => {
        const u = (S.tl - t0) / 5.5;
        if (u < 0 || u > 1) return;
        for (let j = 0; j < 30; j++) {
          const d = hash1(j * 2.7 + i * 5) * 0.4, v = (u - d) / 0.6;
          if (v < 0 || v > 1) continue;
          const x = S.gx + (hash1(j * 9.1 + i) - 0.5) * 760 + Math.sin(v * 5 + j) * 24, y = SOLO + 30 - v * (240 + 120 * hash1(j * 3.3));
          ctx.fillStyle = css(FLORES[j % FLORES.length], Math.sin(Math.PI * v) * 0.95); ctx.beginPath(); ctx.ellipse(x, y, 6, 3.4, S.t * 2 + j, 0, TAU); ctx.fill();
        }
        brilhoRadial(ctx, S.gx, SOLO, 340, K.rosa, 0.28 * Math.sin(Math.PI * Math.min(1, u * 1.6)));
      });
      ctx.restore();
    }
    // um facho desce sobre eles e o caminho adiante brilha
    function levanta(ctx, S) {
      const p = pulsos(tLev, 0.9, 5.0, S.tl);
      if (p < 0.02) return;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const x1 = S.gx + 40, x0 = x1 + 250;
      const ang = Math.atan2(x1 - x0, SOLO - 200 + 40), L = Math.hypot(x1 - x0, SOLO - 160) * 1.14;
      ctx.translate(x0, -40); ctx.rotate(-ang);
      // o facho é cortado em fatias que se apagam aos poucos ao longo do comprimento (sem borda dura na ponta)
      const N = 40;
      for (const [k, al] of [[1, 0.13], [0.5, 0.2]]) {
        const w0 = 90 * k, w1 = 230 * k;
        for (let i = 0; i < N; i++) {
          const u0 = i / N, u1 = (i + 1) / N, um = (u0 + u1) / 2, f = 1 - smooth(0.42, 1.0, um);
          if (f < 0.004) continue;
          const a0 = w0 + (w1 - w0) * u0, a1 = w0 + (w1 - w0) * u1, g = ctx.createLinearGradient(-a1, 0, a1, 0);
          g.addColorStop(0, css(K.luzOuro, 0)); g.addColorStop(0.5, css(K.luz, al * p * f)); g.addColorStop(1, css(K.luzOuro, 0));
          ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-a0, L * u0); ctx.lineTo(a0, L * u0); ctx.lineTo(a1, L * u1); ctx.lineTo(-a1, L * u1); ctx.closePath(); ctx.fill();
        }
      }
      ctx.restore();
      ctx.save();                                                                          // o caminho adiante, aceso
      const yc = (x) => SOLO + 8 + Math.sin((x + S.rol) * 0.005) * 6, xa = S.gx + 150;
      // faixas empilhadas, da mais larga e fraca à mais estreita e forte: bordas suaves, sem retângulo
      for (const [fw, fa] of [[1.2, 0.1], [0.88, 0.17], [0.56, 0.2], [0.26, 0.23]]) {
        const g2 = ctx.createLinearGradient(xa - 40, 0, S.W + 40, 0);
        g2.addColorStop(0, css(K.ouro, 0)); g2.addColorStop(0.14, css(K.ouro, fa * p)); g2.addColorStop(1, css(K.ouro, 0));
        ctx.fillStyle = g2; ctx.beginPath(); ctx.moveTo(xa - 40, yc(xa) + 5 - 27 * fw);
        for (let x = xa - 40; x <= S.W + 40; x += 10) ctx.lineTo(x, yc(x) + 5 - 27 * fw + Math.sin((x + S.rol) * 0.013) * 3);
        for (let x = S.W + 40; x >= xa - 40; x -= 10) ctx.lineTo(x, yc(x) + 5 + 27 * fw + Math.sin((x + S.rol) * 0.011) * 3);
        ctx.closePath(); ctx.fill();
      }
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = css(K.luz, 0.9 * p);
      for (let i = 0; i < 16; i++) { const x = xa + mod(hash1(i * 4.1) * (S.W - xa) - S.t * 20, S.W - xa), tw = Math.max(0, Math.sin(S.t * (1.5 + hash1(i) * 2) + i * 2)); brilho4(ctx, x, yc(x) + (hash1(i * 2.3) - 0.3) * 30, 2 + 4 * tw); }
      ctx.restore();
    }
    // pombas sobem do meio da caravana e uma onda branca passa pelo chão
    function paz(ctx, S) {
      const eventos = [...tPaz.map((t0, i) => [t0, 3, i]), ...tShalom.map((t0) => [t0, 7, 9])];
      for (const [t0, n, i] of eventos) {
        const u = (S.tl - t0) / 7.5;
        if (u < -0.02 || u > 1) continue;
        const onda = (S.tl - t0) / 3.2;
        if (onda > 0 && onda < 1) {
          ctx.save(); ctx.strokeStyle = css(K.luzOuro, 0.7 * (1 - onda)); ctx.lineWidth = 3;
          for (let k = 0; k < 2; k++) { const v = onda - k * 0.14; if (v <= 0) continue; ctx.beginPath(); ctx.ellipse(S.gx, SOLO + 24, 80 + 760 * v, 12 + 56 * v, 0, 0, TAU); ctx.stroke(); }
          ctx.restore();
        }
        if (u < 0) continue;
        for (let j = 0; j < n; j++) {
          const v = clamp(u * 1.2 - j * 0.04), sx = S.gx + (j - (n - 1) / 2) * 40, ex = S.gx + 520 + 300 * j + 160 * hash1(j + i * 3), ey = 120 + 120 * hash1(j * 1.7 + i);
          const x = lerp(sx, ex, v) + Math.sin(v * 5 + j) * 20, y = lerp(SOLO - 230, ey, ease.inOutSine(v)) - Math.sin(Math.PI * v) * 90;
          brilhoRadial(ctx, x, y, 44, K.luzOuro, 0.5 * Math.sin(Math.PI * clamp(v)));
          G.Personagens.pomba(ctx, S, x, y, 0.62 + 0.1 * hash1(j + i), { fase: S.t * 9 + j * 2, bate: Math.sin(S.t * 9 + j * 2), rot: -0.25 + 0.1 * Math.sin(v * 9), dir: 1 });
        }
      }
    }

    // ---------------------------------------------------------------- estações do mundo
    function colinaSacerdote(ctx, S, xw, bracos, brilho, olhos) {
      const sx = xw - S.rol;
      if (sx < -320 || sx > S.W + 320) return;
      B.plataforma(ctx, sx, SOLO + 6, 1.0);
      B.kohen(ctx, sx, SOLO + 6 - ALTPLAT, K_SAC, { bracos, brilho, olhos, t: S.t });
    }
    function oasis(ctx, S) {
      const xf = X_FOGO1 - S.rol;
      if (xf < -300 || xf > S.W + 1250) return;
      // a lagoa fica ao fundo, atrás do caminho, com palmeiras na margem de lá; o reflexo é o espelho exato (mesma camada)
      const cx = xf - 760, rx = 330, ry = 30, yc = SOLO - 52, margemY = yc - ry + 4;
      const palmas = [[xf - 1010, 0.8], [xf - 880, 0.95], [xf - 700, 0.85], [xf - 560, 1.0], [xf - 450, 0.8]];
      for (const [px, s] of palmas) PN.palmeira(ctx, px, margemY, s, { t: S.t });
      ctx.save(); ctx.beginPath(); ctx.ellipse(cx, yc, rx, ry, 0, 0, TAU); ctx.clip();
      const g = ctx.createLinearGradient(0, yc - ry, 0, yc + ry);
      g.addColorStop(0, css(ml(S.ceu.hor, H('#bfe6ee'), 0.55))); g.addColorStop(1, css(ml(S.ceu.mid, H('#9fd3e0'), 0.55)));
      ctx.fillStyle = g; ctx.fillRect(cx - rx, yc - ry, rx * 2, ry * 2);
      ctx.save(); ctx.translate(0, 2 * margemY); ctx.scale(1, -1); ctx.globalAlpha *= 0.5;
      for (const [px, s] of palmas) PN.palmeira(ctx, px, margemY, s, { t: S.t });
      ctx.restore();
      ctx.strokeStyle = css(K.luz, 0.5); ctx.lineWidth = 1.4;
      for (let i = 0; i < 4; i++) { const yy = yc - ry + 9 + i * 12; ctx.beginPath(); for (let x = cx - rx; x <= cx + rx; x += 12) { const y2 = yy + Math.sin(x * 0.035 + S.t * 0.6 + i * 1.7) * 1.3; x === cx - rx ? ctx.moveTo(x, y2) : ctx.lineTo(x, y2); } ctx.stroke(); }
      if (S.noite > 0.05) {
        ctx.fillStyle = css(K.luz, 0.7 * S.noite);
        for (let i = 0; i < 24; i++) { const tw = 0.5 + 0.5 * Math.sin(S.t * 1.7 + i); ctx.fillRect(cx - rx + hash1(i * 3.7) * rx * 2, yc - ry + hash1(i * 5.9) * ry * 2, 3 + 5 * tw, 1.4); }
      }
      ctx.restore();
      ctx.strokeStyle = css(K.luz, 0.5); ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, yc, rx, ry, 0, 0, TAU); ctx.stroke();
      B.rocha(ctx, cx - rx - 14, yc + 20, 0.7, 11); B.rocha(ctx, cx + rx + 10, yc + 22, 0.6, 12);
      R91.tenda(ctx, xf - 210, SOLO - 22, 1.08, clamp(S.noite * 0.9 + 0.2));       // a tenda atrás de quem dorme
    }
    function bosque(ctx, S) {
      const xf = X_FOGO2 - S.rol;
      if (xf < -700 || xf > S.W + 700) return;
      for (const [dx, s] of [[-400, 1.15], [-160, 0.9], [330, 1.05], [610, 0.95]]) PN.oliveira(ctx, xf + dx, SOLO - 20, s, { t: S.t });
      B.rocha(ctx, xf + 190, SOLO + 70, 1.2, 21); B.rocha(ctx, xf - 520, SOLO + 90, 1.0, 22);
    }
    function pilar(ctx, S) {
      const a = Math.max(win(tGuardaNoite - 0.4, tGuardaNoite + 2.6, tRos[1] - 0.8, tRos[1] + 2.4, S.tl), 0.9 * win(tPazEnvolver + 0.4, tPazEnvolver + 3, tRos[2] - 1.4, tRos[2] + 1.6, S.tl),
        0.9 * win(tBen[9] + 3, tBen[9] + 7, tVolteFinal - 1, tVolteFinal + 2, S.tl));
      B.pilarLuz(ctx, S.W * 0.9, 0.84 * ALT, 800, a, S.t);
    }
    function vagalumes(ctx, S) {
      const f = S.noite * 0.9;
      if (f < 0.05) return;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 44; i++) {
        const x = mod(hash1(i * 3.3) * (S.W + 100) + 30 * noise1(S.t * 0.13 + i * 3.1) - S.rol * 0.6, S.W + 100) - 50;
        const y = (0.62 + 0.34 * hash1(i * 7.1)) * ALT + 24 * noise1(S.t * 0.17 + i * 5.3);
        brilhoRadial(ctx, x, y, 8, H('#fff3a6'), 0.8 * f * (0.35 + 0.65 * Math.max(0, Math.sin(S.t * (1.2 + hash1(i) * 2) + i))));
      }
      ctx.restore();
    }

    // ---------------------------------------------------------------- gente do povo na colina do fim
    const POVO = [[-218, 0, '#f6d3e6', true, false], [-262, -22, '#d6e6c9', false, true], [214, 0, '#d9d2f3', false, true], [262, -22, '#ffe1c2', true, false], [-176, -34, '#cfe1fb', false, false], [182, -36, '#f8d9a8', true, false]];
    function povo(ctx, S) {
      const a = smooth(tVolteFinal + 0.5, tVolteFinal + 2.5, S.tl);
      if (a < 0.01) return;
      const px = X_PLAT_B - S.rol;
      POVO.forEach(([dx, dy, cor, veu, barba], i) => {
        const chega = smooth(tVolteFinal + 0.5 + i * 0.6, tVolteFinal + 5.0 + i * 0.6, S.tl), x = px + dx + (1 - chega) * (dx > 0 ? 220 : -220);
        const dir = dx > 0 ? -1 : 1, anda = chega > 0.02 && chega < 0.98 ? 1 : 0;
        PN.pessoa(ctx, x, SOLO + dy + 6, 1.0, { tipo: 'aldeao', cor: H(cor), veu, manto: H('#fdf3e3'), barba, dir: anda ? -dir : dir, andar: anda, fase: (x / 90) * TAU, olhar: 0.6 * chega, dorme: 0.55 * smooth(tBen[11] - 0.4, tBen[11] + 0.8, S.tl), alfa: a, t: S.t, semente: i + 7 });
      });
    }

    // ---------------------------------------------------------------- quadro
    function desenhar(ctx, S) {
      const tl = S.tl, Wd = S.W;
      S.hora = horaEm(tl); S.ceu = ceuEm(S.hora); S.noite = noiteF(S.hora);
      S.rol = rolEm(tl);
      S.flor = clamp(0.05 + tGra.reduce((s, t0) => s + 0.17 * smooth(t0, t0 + 2.8, tl), 0));
      S.sentado = sentadoEm(tl); S.dorme = dormeEm(tl);
      S.gx = centroGrupo(tl);
      S.fogo1 = win(T_ARR1 + 0.2, T_ARR1 + 1.6, tLuzBrilhe + 0.4, tLuzBrilhe + 1.8, tl); S.fogo2 = win(T_ARR2 + 0.2, T_ARR2 + 1.6, tAcompanhe - 0.4, tAcompanhe + 1.2, tl);
      S.tomTexto = 1 - smooth(0.32, 0.62, S.noite * 0.9);
      // céu
      ceuFundo(ctx, S);
      estrelas(ctx, S);
      corpoCeleste(ctx, S);
      const aurA = Math.max(0.9 * win(tRostoNos + 2.0, tResplandecer + 0.8, tAcompanhe + 6, tAcompanhe + 10, tl), 0.8 * win(tShalom[0] - 1.0, tShalom[0] + 3, tBen[11] - 0.5, tBen[11] + 2, tl), 0.85 * smooth(tShalom[2] - 1, tShalom[2] + 4, tl));
      B.aurora(ctx, Wd, aurA * (0.4 + 0.6 * S.noite), S.t);
      nuvens(ctx, S);
      raios(ctx, S, 0.3 * pulsos(tRos, 0.9, 4, tl));
      resplandece(ctx, S);
      pilar(ctx, S);
      // a mão do sinal sacerdotal brilha no céu ("Que Sua mão esteja sobre você")
      B.maosCeu(ctx, S.gx + 20, 540, 1.5, win(tMao - 0.3, tMao + 1.4, tMao + 4.6, tMao + 6.4, tl), S.t);
      // e o nome ("Seu nome permaneça sobre nós"), com a letra shin
      B.shin(ctx, S.gx + 30, 650, 0.62, win(tNome - 0.4, tNome + 1.8, tNome + 5.0, tNome + 7.0, tl), S.t);
      B.shin(ctx, X_PLAT_B - S.rol, 330, 0.62, 0.9 * win(tShalom[2] - 0.5, tShalom[2] + 2.5, dur - 3, dur, tl), S.t);
      // fundo com paralaxe
      serra(ctx, S, MONT.longe); serra(ctx, S, MONT.meio); serra(ctx, S, MONT.colinas);
      arvoresLonge(ctx, S, MONT.colinas, 190, 0.5, 0.42, 5);
      chao(ctx, S);
      rio(ctx, S);
      flora(ctx, S, false);
      pedras(ctx, S, false);
      // estações
      const olhosA = smooth(tBen[0] - 1.2, tBen[0] + 0.5, tl);
      colinaSacerdote(ctx, S, X_PLAT_A, win(tBen[0] - 1.8, tBen[0] - 0.2, T_A + 0.2, T_B + 0.4, tl), Math.max(pulsos(tBen, 0.6, 3.6, tl), pulsos(tGua, 0.6, 3.6, tl), 0.8 * pulsos(tRos, 0.8, 4, tl)) * win(-1, 0, T_B, T_B + 2, tl), olhosA);
      oasis(ctx, S);
      bosque(ctx, S);
      oliveiraGrande(ctx, S);
      colinaSacerdote(ctx, S, X_PLAT_B, smooth(tBen[11] - 1.6, tBen[11] - 0.2, tl), (0.3 + 0.7 * pulsos([...tBen, ...tGua, ...tRos], 0.8, 4, tl)) * smooth(tBen[11] - 1.6, tBen[11] - 0.2, tl), 0);
      // fogueiras
      const xf1 = X_FOGO1 - S.rol, xf2 = X_FOGO2 - S.rol;
      if (S.fogo1 > 0.01 && xf1 > -300 && xf1 < Wd + 300) B.fogueira(ctx, xf1, SOLO + 8, 1.1, { forca: S.fogo1, t: S.t });
      if (S.fogo2 > 0.01 && xf2 > -300 && xf2 < Wd + 300) B.fogueira(ctx, xf2, SOLO + 8, 1.1, { forca: S.fogo2, t: S.t });
      anelChao(ctx, S);
      // a caravana (ordenada por profundidade); quem dorme vira um vulto sob a manta
      const povoFoi = smooth(tVolteFinal + 0.5, tVolteFinal + 2.5, tl);
      const gente = QUEM.map((q) => {
        const p = posQuem(q, tl), p2 = posQuem(q, tl + 0.05), p1 = posQuem(q, tl - 0.05);
        return { q, x: p.x, dir: p.dirv >= 0 ? 1 : -1, vx: (p2.x - p1.x) / 0.1 };
      }).sort((a, b) => (a.q.dy - b.q.dy));
      const noiteLamp = S.noite > 0.5;
      for (const g of gente) {
        const q = g.q, gv = rolVel(tl) + g.vx * g.dir, andar = clamp(Math.abs(gv) / 46) * (1 - S.sentado) * (1 - S.dorme);
        const dorme = S.dorme, y = SOLO + q.dy;
        const opc = { tipo: q.tipo, dir: g.dir, andar, fase: ((S.rol + g.x) * g.dir / 92) * TAU, sentado: S.sentado, alfa: 1 - dorme, t: S.t, semente: q.sem, esc: q.esc };
        if (q.tipo === 'aldeao') { opc.cor = q.cor; opc.veu = q.veu; opc.manto = q.manto; }
        // o que cada um faz e leva
        const emPe = (1 - S.sentado) * (1 - dorme);
        opc.segura = null;
        const rs = sentadoRidge(tl);
        if (rs > 0.5 && dorme < 0.1) { opc.segura = q.id === 'anciao' ? null : 'pao'; opc.seguraA = 1; }
        else if (emPe > 0.5) {
          if (noiteLamp) opc.segura = q.id === 'homem' ? 'lamparina' : 'lanterna';
          else if (q.id === 'mulher') { opc.segura = 'cesto'; opc.cheio = 1; }
          opc.acesa = clamp(S.noite * 1.4 - 0.2);
        }
        if (q.id === 'homem') opc.carga = emPe;
        const lev = pulsos(tLev, 0.8, 5, tl), ben0 = win(tBen[0] - 0.4, tBen[0] + 0.6, T_A, T_A + 0.6, tl);
        opc.olhar = Math.max(0.55 * ben0, lev, 0.9 * win(tRostoNos, tRostoNos + 1, tAcompanhe - 1, tAcompanhe, tl), 0.8 * pulsos(tRos, 0.8, 3.5, tl), 0.6 * pulso(tOlhos, 1, 5, tl),
          0.7 * pulso(tPresente, 1, 4, tl), 0.8 * win(tLuzBrilhe, tLuzBrilhe + 1, tLuzBrilhe + 3, tLuzBrilhe + 4, tl));
        opc.maos = Math.max(win(tBen[0] - 0.5, tBen[0] + 0.7, T_A, T_A + 0.5, tl), 0.8 * pulsos(tGua, 0.6, 3.6, tl) * (1 - S.sentado) * (tl < tCaminhar ? 1 : 0), 0.8 * win(tBen[11] - 0.4, tBen[11] + 0.8, dur - 6, dur - 3, tl) * povoFoi);
        opc.dorme = Math.max(0.6 * win(tBen[11] - 0.2, tBen[11] + 0.9, tBen[11] + 4.5, tBen[11] + 6, tl) * povoFoi, 0.55 * win(tBen[0] - 1.5, tBen[0] - 0.6, tBen[0] + 0.2, tBen[0] + 1.0, tl) * (tl < tCaminhar ? 1 : 0));
        opc.bracos = Math.max(0.55 * pulso(tGra[1], 1, 3, tl) * emPe, 0.4 * pulsos(tPaz, 0.8, 3, tl) * emPe);
        if (g.x > -200 && g.x < Wd + 200 && dorme < 0.98) PN.pessoa(ctx, g.x, y, q.esc, opc);
        if (dorme > 0.02) B.dormindo(ctx, g.x, SOLO + 14 + q.dy * 0.5, q.id === 'menino' ? 1.0 : 1.0, { dir: q.campDir, alfa: dorme, cor: [H('#f5c9b0'), H('#fbe4a0'), H('#cfd9f6'), H('#c8e6d4')][q.sem - 1], menor: q.id === 'menino', t: S.t, semente: q.sem, cabelo: q.id === 'anciao' ? K.barbaGrisalha : K.cabelo });
      }
      povo(ctx, S);
      manto(ctx, S);
      // gestos da bênção
      chuvaLuz(ctx, S);
      levanta(ctx, S);
      pedras(ctx, S, true);
      flora(ctx, S, true);
      petalas(ctx, S);
      paz(ctx, S);
      vagalumes(ctx, S);
    }

    return { espelho: false, estado: () => ({ fx: 0.5, calor: 0, peso: 0, nevoa: 0, vento: 0.2, solY: 400, solForca: 1, raios: 0, motes: 0, flash: 0 }), desenhar };
  }

  G.TemaBencao = { criar };
})(window);
