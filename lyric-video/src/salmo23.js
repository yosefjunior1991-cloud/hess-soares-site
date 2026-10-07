// Tema "Salmo 23", criado do zero a partir da letra inteira (a imagem da música é só um fundo preto), para o vídeo
// final em 16:9 (o vertical serve só à conferência da legenda). O cordeirinho é quem fala no salmo; Adonai, o Pastor,
// aparece como uma figura de luz, sem rosto. A jornada segue os versos: a lira de Davi; o Pastor que nasce da luz da
// canção; o rebanho; o pasto que cresce e o cordeiro que se deita; a lagoa tranquila onde ele bebe; a alma restaurada
// (uma flor murcha que revive); o caminho que fica dourado; a luz do Nome no alto; o vale da sombra (paredes de rocha
// que se erguem, escuridão, lobos de sombra que recuam diante da luz do Pastor); a vara e o cajado; a mesa preparada
// diante dos inimigos, com o Pastor como anfitrião; a unção com óleo; o cálice que transborda; bondade e misericórdia
// (duas pombas que passam a segui-lo); a noite no vale, quando o Pastor volta, se ajoelha e o carrega nos ombros sob as
// estrelas; o amanhecer e a casa de Adonai, cuja porta se abre; e o descanso final com o rebanho, ao entardecer.
// Os instantes saem do texto da legenda; os trechos que os disparam ficam em `animacao.json`, na pasta da música
// (`gatilhos`), e não neste repositório público. Sem o arquivo, valem os tempos padrão abaixo.
(function (G) {
  'use strict';
  const { clamp, lerp, smooth, mod, css, rgb, hash1, noise1, mulberry32, ease } = G.U;
  const R91 = G.Seres91, R = G.Seres23, K = R.K, ml = R91.ml, brilhoRadial = R91.brilhoRadial, brilho4 = R91.brilho4;
  const ALT = 1080, TAU = Math.PI * 2;
  const SOLO = 0.885 * ALT;                   // linha dos pés no caminho
  const HORSKY = 0.72 * ALT;                  // horizonte do céu (sol e lua nascem aqui, atrás das montanhas)
  const semNikud = (s) => s.normalize('NFD').replace(/[֑-ׇ]/g, '').replace(/[̀-ͯ]/g, '');
  const H = (hex) => rgb(hex);

  // tempos padrão (s) de cada momento; os `gatilhos` do animacao.json substituem por busca no texto da legenda
  const PADRAO = {
    mizmor: [8.02], roi: [11.61, 19.61, 79.99, 87.33, 106.01, 165.12, 172.54, 239.01, 246.52, 261.08, 298.52], echsar: [16.51],
    pastor_pt: [33.31], pastos: [40.57], aguas: [43.84], restaura: [48.87], justica: [51.42], nome: [54.93, 58.76, 70.33],
    nafshi: [62.83], yancheni: [66.18], andar: [94.11], vale: [95.70, 152.35], temerei: [99.14, 155.23],
    comigo: [101.69, 157.70, 179.00, 182.67, 187.70, 253.06, 256.92],
    vara: [119.88], consolam: [123.55], mesa: [126.58], inimigos: [129.77], unges: [133.52], calice: [138.32],
    bondade: [140.94, 288.12], dias: [144.13, 226.16], gam: [149.00], shivti: [207.65, 215.15, 222.73, 230.23],
    longos: [213.47, 220.89], sempre: [236.13], yirdefuni: [291.34], kol: [294.53],
  };

  // ---------------------------------------------------------------- céu por hora do dia (primavera: azul, menta, ouro)
  const CEU = [
    [0, '#7f88cb', '#9aa0dc', '#c0b4e3'], [4.8, '#8d97d7', '#b9b1e3', '#f3cad6'], [6.2, '#a6bdee', '#f3cbd7', '#ffdcae'],
    [8, '#aed9f5', '#d6efff', '#fff0d2'], [12, '#9fd3f3', '#cdeefe', '#eefaf6'], [15.5, '#acd2f2', '#e3eaf8', '#ffe8c9'],
    [17.6, '#b6c3ee', '#f7d2c4', '#ffd49e'], [18.4, '#aaa6e0', '#f2b8c4', '#ffcf9b'], [19.8, '#8f91d1', '#c3a5d9', '#f4b9bb'],
    [21.5, '#7f88cb', '#9aa0dc', '#c0b4e3'], [24, '#7f88cb', '#9aa0dc', '#c0b4e3'],
  ].map(([h, a, b, c]) => [h, H(a), H(b), H(c)]);
  function ceuEm(h) {
    h = mod(h, 24);
    let i = 0; while (i < CEU.length - 2 && CEU[i + 1][0] <= h) i++;
    const A = CEU[i], B = CEU[i + 1], f = clamp((h - A[0]) / (B[0] - A[0])), k = f * f * (3 - 2 * f);
    return { top: ml(A[1], B[1], k), mid: ml(A[2], B[2], k), hor: ml(A[3], B[3], k) };
  }
  const noiteF = (h) => { h = mod(h, 24); return h < 12 ? 1 - smooth(5.0, 6.6, h) : smooth(18.6, 20.4, h); };

  // nota musical (cabeça, haste e bandeira) que sobe da lira
  function nota(ctx, x, y, s, a) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(-0.25);
    ctx.fillStyle = css(K.ouroForte, a); ctx.strokeStyle = css(K.ouroForte, a); ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.ellipse(0, 0, 7, 5, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(6, -1); ctx.lineTo(6, -28); ctx.quadraticCurveTo(14, -22, 16, -12); ctx.stroke();
    ctx.restore();
  }

  function criar(musica, parte, W) {
    const dur = parte.duracao;
    const gat = parte.gatilhos || {};
    const linhas = musica.linhas.filter((l) => l.parte === parte.indice)
      .map((l) => ({ a: l.ini - parte.inicio, b: l.fim - parte.inicio, txt: semNikud(l.texto + ' ' + (l.traducao || '')) }));
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
    const tMizmor = T('mizmor'), tRoi = TT('roi'), tEchsar = T('echsar'), tPastos = T('pastos'), tAguas = T('aguas'), tRestaura = T('restaura');
    const tJustica = T('justica'), tNome = TT('nome'), tNafshi = T('nafshi'), tYancheni = T('yancheni'), tAndar = T('andar');
    const tVale = TT('vale'), tTemerei = TT('temerei'), tComigo = TT('comigo');
    const tVara = T('vara'), tConsolam = T('consolam'), tMesa = T('mesa'), tInimigos = T('inimigos'), tUnges = T('unges'), tCalice = T('calice');
    const tBondade = TT('bondade'), tDias = TT('dias'), tGam = T('gam'), tShivti = TT('shivti'), tLongos = TT('longos'), tSempre = T('sempre'), tKol = T('kol');
    const tC1 = tComigo[1];                   // gatilho `comigo` no vale à noite: o Pastor pega o cordeiro
    const T_CASA = tShivti[1] + 0.4;          // chegam à casa de Adonai
    const win = (a, b, c, d, t) => smooth(a, b, t) * (1 - smooth(c, d, t));

    // ---------------------------------------------------------------- posições na tela (16:9)
    const CX = W / 2;
    const EL = 1.2, EP = 1.18;                                     // escala do cordeiro e do Pastor
    const XL = CX - 290, XP = CX - 40;                              // ao caminhar: o cordeiro atrás, o Pastor à frente, guiando
    const XBEBE = XL + 50, XFLOR = XL - 110;                        // beira da lagoa e a flor murcha
    const XMESA = CX + 40, XHOST = CX + 60, XUNGE = XL + 147;       // a mesa, o Pastor atrás dela (anfitrião) e junto ao cordeiro
    const XLPEGA = XL + 90, XPEGA = XL + 185, XCARREGA = CX - 60;   // no vale à noite: onde o Pastor o pega e por onde o carrega
    const XCASA = CX + 470, XPORTA = XCASA - 46, XPASCASA = XCASA - 245, ECASA = 1.3;

    // ---------------------------------------------------------------- hora do dia (o dia corre conforme a letra)
    const HS = [
      [0, 6.25, tRoi[0], 6.6, 0], [tRoi[0], 6.6, tPastos, 7.6, 0], [tPastos, 7.6, tAndar, 11.5, 0], [tAndar, 11.5, tVara - 2, 16.9, 1],
      [tVara - 2, 16.9, tDias[0], 17.6, 0], [tDias[0], 17.6, tGam, 22.2, 1], [tGam, 22.2, tComigo[4], 24.0, 0],
      [tComigo[4], 24.0, tComigo[4] + 11.5, 24.8, 0], [tComigo[4] + 11.5, 24.8, tShivti[0], 29.6, 1], [tShivti[0], 29.6, tSempre, 31.2, 0],
      [tSempre, 31.2, tBondade[1], 39.6, 0], [tBondade[1], 39.6, tKol, 40.4, 0], [tKol, 40.4, tKol + 4.0, 65.6, 1], [tKol + 4.0, 65.6, dur + 2, 67.7, 0],
    ];
    const horaEm = (tl) => {
      for (const [a, ha, b, hb, suave] of HS) if (tl <= b) { const f = clamp((tl - a) / Math.max(1e-6, b - a)); return lerp(ha, hb, suave ? ease.inOutCubic(f) : f); }
      return HS[HS.length - 1][3];
    };

    // ---------------------------------------------------------------- caminhada (o mundo rola; os dois ficam na tela)
    const PASSO = 1 / 30, V = 100;
    const JANELAS = [
      [tJustica - 0.3, tJustica + 1.3, tVara - 3.0, tVara - 0.8],            // caminhos de justiça e o vale
      [tGam - 0.3, tGam + 1.0, tC1 - 1.0, tC1 - 0.2],                        // o vale à noite
      [tC1 + 3.4, tC1 + 4.4, tComigo[4] - 1.6, tComigo[4] + 0.4],           // carregado nos ombros
      [tComigo[4] + 13.5, tComigo[4] + 15.0, T_CASA - 1.8, T_CASA],         // até a casa de Adonai
    ];
    const andarEm = (t) => { let a = 0; for (const [p, q, r, s] of JANELAS) a = Math.max(a, win(p, q, r, s, t)); return a; };
    const nTab = Math.ceil(dur / PASSO) + 3, rolTab = new Float64Array(nTab);
    for (let i = 1; i < nTab; i++) rolTab[i] = rolTab[i - 1] + V * andarEm((i - 1) * PASSO) * PASSO;
    const rolEm = (t) => { const x = clamp(t / PASSO, 0, nTab - 1.001), i = Math.floor(x); return lerp(rolTab[i], rolTab[i + 1], x - i); };
    const rolCasa = rolEm(T_CASA + 0.5), rolMesa = rolEm(tVara);
    const vale = [
      { esc: (t) => smooth(tAndar - 0.6, tAndar + 1.8, t) * (1 - smooth(tRoi[4] + 4.0, tRoi[4] + 8.5, t)), forca: 0.64 },
      { esc: (t) => smooth(tGam + 0.4, tGam + 3.0, t) * (1 - smooth(tRoi[5] + 1.0, tRoi[5] + 6.0, t)), forca: 0.55 },
    ];

    // ---------------------------------------------------------------- terreno e mundo
    const MONT = {
      longe: { par: 0.03, base: 0.665, a: [120, 44, 15], per: [900, 420, 170], p: [0.5, 2.0, 4.1], pico: true, neve: true, cor: '#c9cdf0', haze: 0.42 },
      meio: { par: 0.08, base: 0.735, a: [44, 18, 7], per: [760, 340, 150], p: [2.2, 0.6, 3.1], cor: '#b9dcef', haze: 0.3 },
      colinas: { par: 0.20, base: 0.800, a: [24, 10, 4], per: [640, 290, 120], p: [1.0, 3.0, 0.4], cor: '#bfe8cf', haze: 0.12 },
    };
    function yCrista(Lc, X) {
      const w0 = Math.sin(TAU * X / Lc.per[0] + Lc.p[0]), w1 = Math.sin(TAU * X / Lc.per[1] + Lc.p[1]), w2 = Math.sin(TAU * X / Lc.per[2] + Lc.p[2]);
      const h0 = Lc.pico ? Lc.a[0] * (1.12 - 1.5 * Math.abs(w0)) : Lc.a[0] * w0;
      return Lc.base * ALT - (h0 + Lc.a[1] * w1 + Lc.a[2] * w2);
    }
    function luzObj(S, cor, k) {
      const c = typeof cor === 'string' ? H(cor) : cor;
      return ml(ml(c, S.ceu.mid, S.noite * 0.5 * (k || 1)), S.ceu.hor, 0.10 * (k || 1) * (1 - S.noite));
    }
    const FLORES = ['#f7c6d2', '#fff1d6', '#e2dcf6', '#ffd9b8', '#fbe2ef', '#cfe9ff'].map(H);

    // ---------------------------------------------------------------- céu
    function ceuFundo(ctx, S) {
      const c = S.ceu, g = ctx.createLinearGradient(0, 0, 0, HORSKY + 40);
      g.addColorStop(0, css(c.top)); g.addColorStop(0.5, css(c.mid)); g.addColorStop(1, css(c.hor));
      ctx.fillStyle = g; ctx.fillRect(-40, -40, S.W + 80, ALT + 80);
    }
    const rE = mulberry32(23);
    const ESTRELAS = Array.from({ length: Math.round(110 + W * 0.1) }, () => ({ u: rE(), v: Math.pow(rE(), 1.25), r: 0.7 + Math.pow(rE(), 3) * 2.2, w: 0.7 + rE() * 2.4, f: rE() * TAU }));
    function estrelas(ctx, S) {
      if (S.noite < 0.03) return;
      for (const e of ESTRELAS) {
        const y = e.v * HORSKY * 0.95, tw = 0.55 + 0.45 * Math.sin(S.t * e.w + e.f);
        const a = S.noite * tw * clamp((HORSKY - y) / 240);
        if (a < 0.03) continue;
        ctx.fillStyle = css(K.luz, a);
        if (e.r > 2) brilho4(ctx, e.u * S.W, y, e.r * 3); else { ctx.beginPath(); ctx.arc(e.u * S.W, y, e.r, 0, TAU); ctx.fill(); }
      }
      // estrelas cadentes enquanto o Pastor para sob o céu
      const est = win(tComigo[4] - 0.5, tComigo[4] + 1, tComigo[4] + 12, tComigo[4] + 13.5, S.tl);
      if (est > 0.02) for (let i = 0; i < 4; i++) {
        const t0 = tComigo[4] + 1.5 + i * 3.1, u = (S.tl - t0) / 1.2;
        if (u < 0 || u > 1) continue;
        const x0 = S.W * (0.12 + 0.62 * hash1(i * 3.3)), y0 = ALT * (0.05 + 0.15 * hash1(i * 5.5));
        const x = x0 + 280 * u, y = y0 + 120 * u;
        const g = ctx.createLinearGradient(x - 96, y - 42, x, y);
        g.addColorStop(0, css(K.luz, 0)); g.addColorStop(1, css(K.luz, 0.9 * Math.sin(Math.PI * u) * est));
        ctx.strokeStyle = g; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 96, y - 42); ctx.lineTo(x, y); ctx.stroke();
      }
    }
    function corpoCeleste(ctx, S) {
      const h = mod(S.hora, 24), W = S.W;
      const aS = Math.PI * (h - 6) / 12, altS = Math.sin(aS);
      S.sol = { x: W * (0.5 - Math.cos(aS) * 0.42), y: HORSKY - altS * 0.62 * ALT, alt: altS };
      if (altS > -0.2) {
        const baixo = 1 - clamp(altS * 2.4), r = 46 * (1 + 0.2 * baixo), quente = ml(K.creme, H('#ffb98f'), baixo * 0.9);
        const f = clamp((altS + 0.2) / 0.3) * (1 - 0.6 * S.escuro);
        brilhoRadial(ctx, S.sol.x, S.sol.y, 560, quente, 0.42 * f);
        brilhoRadial(ctx, S.sol.x, S.sol.y, 240, K.creme, 0.5 * f);
        brilhoRadial(ctx, S.sol.x, S.sol.y, 110, K.luz, 0.65 * f);
        const g = ctx.createRadialGradient(S.sol.x - r * 0.25, S.sol.y - r * 0.25, r * 0.1, S.sol.x, S.sol.y, r);
        g.addColorStop(0, css(K.luz, f)); g.addColorStop(0.7, css(K.creme, f)); g.addColorStop(1, css(quente, 0.9 * f));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(S.sol.x, S.sol.y, r, 0, TAU); ctx.fill();
      }
      const aL = Math.PI * mod(h - 18, 24) / 12, altL = Math.sin(aL);
      S.lua = { x: W * (0.5 - Math.cos(aL) * 0.42), y: HORSKY - altL * 0.58 * ALT, alt: altL };
      if (altL > -0.15 && mod(h - 18, 24) < 12.4) {
        const vis = S.noite * clamp((altL + 0.15) / 0.3), r = 38;
        brilhoRadial(ctx, S.lua.x, S.lua.y, 200, H('#c9d0ff'), 0.42 * vis);
        const g = ctx.createRadialGradient(S.lua.x - r * 0.3, S.lua.y - r * 0.3, r * 0.1, S.lua.x, S.lua.y, r);
        g.addColorStop(0, css(H('#fbfcff'), vis)); g.addColorStop(0.7, css(H('#e8ebfa'), vis)); g.addColorStop(1, css(H('#c9cee8'), vis));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(S.lua.x, S.lua.y, r, 0, TAU); ctx.fill();
        ctx.fillStyle = css(H('#a9b0d6'), 0.3 * vis);
        for (const [dx, dy, rr] of [[-0.32, -0.28, 0.2], [0.34, 0.12, 0.15], [-0.08, 0.5, 0.11]]) { ctx.beginPath(); ctx.arc(S.lua.x + dx * r, S.lua.y + dy * r, rr * r, 0, TAU); ctx.fill(); }
      }
    }
    const rN = mulberry32(232);
    const NUVENS = Array.from({ length: Math.round(8 + W / 190) }, () => ({ x0: rN() * (W + 700), y: (0.04 + rN() * 0.5) * ALT, w: 150 + rN() * 230, h: 0.18 + rN() * 0.16, v: 3 + rN() * 7, a: 0.32 + rN() * 0.36, tom: rN() }));
    function nuvens(ctx, S) {
      const per = S.W + 700;
      for (const n of NUVENS) {
        const x = mod(n.x0 - S.t * n.v - S.rol * 0.05, per) - 350;
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
    function raios(ctx, S, forcaExtra) {
      if (!S.sol || S.sol.alt < -0.05) return;
      const f = (clamp(1 - Math.abs(S.sol.alt - 0.2) * 1.6) * (0.4 + 0.6 * S.A.energia) + (forcaExtra || 0)) * (1 - S.escuro);
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
    // gatilho `nome`: uma luz no alto (à direita do texto) que pulsa em anéis
    function luzNome(ctx, S) {
      const tl = S.tl, cx = CX + 0.29 * S.W, cy = 0.17 * ALT;
      const longo = win(tNome[2] - 0.2, tNome[2] + 1.0, tNome[2] + 9.0, tNome[2] + 10.5, tl);
      let pulso = longo * 0.8;
      for (const t0 of tNome) {
        const u = (tl - t0) / 2.6;
        if (u < 0 || u > 1) continue;
        pulso = Math.max(pulso, Math.sin(Math.PI * Math.min(1, u * 2)) * 0.9);
        for (let k = 0; k < 3; k++) {
          const v = u - k * 0.12; if (v <= 0) continue;
          ctx.strokeStyle = css(K.luzOuro, 0.7 * (1 - v)); ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(cx, cy, 24 + 230 * v, 0, TAU); ctx.stroke();
        }
      }
      if (longo > 0.02) for (let k = 0; k < 3; k++) {
        const v = mod((tl - tNome[2]) * 0.4 + k / 3, 1);
        ctx.strokeStyle = css(K.luzOuro, 0.55 * (1 - v) * longo); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(cx, cy, 24 + 230 * v, 0, TAU); ctx.stroke();
      }
      if (pulso < 0.02) return;
      brilhoRadial(ctx, cx, cy, 200, K.luzOuro, 0.55 * pulso);
      brilhoRadial(ctx, cx, cy, 60, K.luz, 0.9 * pulso);
      ctx.fillStyle = css(K.luz, 0.95 * pulso);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(S.t * 0.2);
      brilho4(ctx, 0, 0, 34 * (0.8 + 0.2 * Math.sin(S.t * 3))); ctx.rotate(Math.PI / 4); ctx.fillStyle = css(K.luz, 0.6 * pulso); brilho4(ctx, 0, 0, 22);
      ctx.restore();
    }

    function serra(ctx, S, Lc) {
      const W = S.W, cam = S.rol * Lc.par;
      const topoC = luzObj(S, ml(H(Lc.cor), S.ceu.hor, Lc.haze), 1), fundoC = luzObj(S, ml(H(Lc.cor), S.ceu.mid, Lc.haze + 0.22), 1);
      ctx.beginPath(); ctx.moveTo(-20, ALT + 20);
      for (let x = -20; x <= W + 20; x += 6) ctx.lineTo(x, yCrista(Lc, x + cam));
      ctx.lineTo(W + 20, ALT + 20); ctx.closePath();
      const yTop = Lc.base * ALT - (Lc.a[0] * 1.12 + Lc.a[1] + Lc.a[2]);
      const g = ctx.createLinearGradient(0, yTop, 0, yTop + 380);
      g.addColorStop(0, css(topoC)); g.addColorStop(1, css(fundoC));
      ctx.fillStyle = g; ctx.fill();
      if (Lc.neve) {
        ctx.save(); ctx.clip();
        const gs = ctx.createLinearGradient(0, yTop, 0, yTop + 120);
        gs.addColorStop(0, css(K.luz, 0.85 - 0.45 * S.noite)); gs.addColorStop(1, css(K.luz, 0));
        ctx.fillStyle = gs; ctx.fillRect(0, yTop, W, 120);
        ctx.restore();
      }
    }
    function arvores(ctx, S, Lc, cel, prob, esc, sem) {
      const cam = S.rol * Lc.par, W = S.W;
      const c0 = Math.floor((cam - 80) / cel), c1 = Math.floor((cam + W + 80) / cel);
      for (let c = c0; c <= c1; c++) {
        if (hash1(c * 3.31 + sem) > prob) continue;
        const wx = c * cel + hash1(c * 1.7 + sem) * cel * 0.8, sx = wx - cam;
        const s = esc * (0.75 + hash1(c * 5.9 + sem) * 0.5), y = yCrista(Lc, sx + cam) + 2;
        const sw = Math.sin(S.t * 0.9 + c) * 1.4 * s, cip = hash1(c * 2.2 + sem) < 0.35;
        const tronco = luzObj(S, '#d4bcae', 0.8), f1 = luzObj(S, cip ? '#9fd6bf' : '#ade0c4', 0.9), f2 = luzObj(S, cip ? '#c4ebd6' : '#d0f0dc', 0.9);
        ctx.strokeStyle = css(tronco); ctx.lineWidth = 7 * s; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx, y); ctx.lineTo(sx + sw * 0.3, y - 34 * s); ctx.stroke();
        if (cip) {
          ctx.fillStyle = css(f1); ctx.beginPath(); ctx.ellipse(sx + sw, y - 70 * s, 17 * s, 50 * s, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = css(f2, 0.8); ctx.beginPath(); ctx.ellipse(sx + sw - 5 * s, y - 78 * s, 7 * s, 30 * s, 0, 0, TAU); ctx.fill();
        } else {
          const cx = sx + sw, cy = y - 56 * s;
          ctx.fillStyle = css(f1); ctx.beginPath();
          for (const [dx, dy, r] of [[-20, 7, 20], [0, -4, 24], [21, 7, 19], [-5, 18, 17], [12, -16, 17]]) { ctx.moveTo(cx + (dx + r) * s, cy + dy * s); ctx.arc(cx + dx * s, cy + dy * s, r * s, 0, TAU); }
          ctx.fill();
          ctx.fillStyle = css(f2); ctx.beginPath();
          for (const [dx, dy, r] of [[-20, 7, 20], [0, -4, 24], [21, 7, 19]]) { ctx.moveTo(cx + (dx - 5 + r * 0.55) * s, cy + (dy - 6) * s); ctx.arc(cx + (dx - 5) * s, cy + (dy - 6) * s, r * 0.55 * s, 0, TAU); }
          ctx.fill();
        }
      }
    }

    // ---------------------------------------------------------------- o vale da sombra: paredes de rocha que se erguem do chão
    // ao fundo, uma crista baixa (onde ficam os lobos); dos lados, paredes altas que fecham o céu; na frente, rochas nos cantos
    const CAMADAS_VALE = [
      { par: 0.35, ini: 0, fim: 0.6, base: 0.875 * ALT, g0: 0.55 * ALT, perfil: () => 1, cor: '#a69fd3', claro: '#c0b9e4',
        topo: (X) => 0.625 * ALT - 40 * noise1(X * 0.0035) - 18 * noise1(X * 0.014) - 6 * noise1(X * 0.06) },
      { par: 0.8, ini: 0.15, fim: 0.8, base: SOLO - 20, g0: 0, perfil: (x) => Math.max(1 - smooth(0.05 * W, 0.37 * W, x), smooth(0.63 * W, 0.95 * W, x)),
        cor: '#8a83bd', claro: '#a8a1d4', estrias: true, topo: (X) => 0.03 * ALT + 46 * noise1(X * 0.004) + 16 * noise1(X * 0.03) },
    ];
    const FRENTE_VALE = { par: 1.3, ini: 0.4, fim: 1, base: ALT + 30, g0: 0.8 * ALT, perfil: (x) => Math.max(1 - smooth(0, 0.2 * W, x), smooth(0.8 * W, W, x)),
      cor: '#6e679f', claro: '#867fb5', topo: (X) => 0.84 * ALT - 26 * noise1(X * 0.012) - 12 * noise1(X * 0.05) };
    const yParede = (c, S, x) => lerp(c.base, c.topo(x + S.rol * c.par), smooth(c.ini, c.fim, S.vale) * c.perfil(x));
    function camadaVale(ctx, S, c) {
      const kc = smooth(c.ini, c.fim, S.vale);
      if (kc < 0.004) return;
      const pts = [];
      for (let x = -20; x <= S.W + 26; x += 6) pts.push([x, yParede(c, S, x)]);
      ctx.beginPath(); ctx.moveTo(-20, ALT + 40);
      for (const [x, y] of pts) ctx.lineTo(x, y);
      ctx.lineTo(S.W + 26, ALT + 40); ctx.closePath();
      const g = ctx.createLinearGradient(0, c.g0, 0, c.base);
      g.addColorStop(0, css(luzObj(S, c.claro, 0.6))); g.addColorStop(1, css(luzObj(S, c.cor, 0.6)));
      ctx.fillStyle = g; ctx.fill();
      if (c.estrias) {                                                     // fendas e estrias na rocha
        ctx.save(); ctx.clip();
        ctx.strokeStyle = css(luzObj(S, '#6e679f', 0.6), 0.28); ctx.lineWidth = 2;
        const cam = S.rol * c.par, per = S.W + 300;
        for (let i = 0; i < 14; i++) { const xx = mod(i * 167 - cam, per) - 150; ctx.beginPath(); ctx.moveTo(xx, SOLO); ctx.bezierCurveTo(xx + 24, ALT * 0.62, xx - 30, ALT * 0.34, xx + 12, 0); ctx.stroke(); }
        ctx.restore();
      }
      ctx.strokeStyle = css(K.luz, 0.22 * (1 - 0.5 * S.noite) * clamp(kc * 2)); ctx.lineWidth = 2.5; ctx.lineJoin = 'round';   // borda iluminada
      ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
    }
    // lobos de sombra na crista do vale (de dia) e só os olhos nas paredes (à noite)
    function lobosVale(ctx, S) {
      const tl = S.tl, a = win(tVale[0] + 0.4, tVale[0] + 1.6, tComigo[0] + 0.4, tComigo[0] + 2.4, tl), rec = smooth(tComigo[0], tComigo[0] + 2.2, tl);
      if (a < 0.01) return;
      const c = CAMADAS_VALE[0], ref = rolEm(tVale[0] + 2.5) * c.par;
      [[0.41, 1], [0.60, 2], [0.69, 3]].forEach(([fx, sem]) => {
        const x0 = ref + fx * S.W - S.rol * c.par, lado = x0 < CX ? 1 : -1, x = x0 - lado * 60 * rec;
        R.lobo(ctx, x, yParede(c, S, x) + 5 + 18 * rec, 0.72, { dir: rec > 0.3 ? -lado : lado, t: tl + sem, alfa: a * 0.95, olhos: 1 - 0.5 * rec });
      });
    }
    function olhosNoite(ctx, S) {
      const tl = S.tl, b = win(tVale[1] - 0.2, tVale[1] + 1.2, tC1 - 0.2, tC1 + 1.6, tl);
      if (b < 0.01) return;
      for (const [fx, fy, f] of [[0.09, 0.50, 0], [0.15, 0.66, 1.3], [0.86, 0.46, 2.1], [0.92, 0.62, 3.4]]) {
        const pisca = mod(tl + f * 1.7, 3.8) < 0.14 ? 0.15 : 1, x = fx * S.W, y = fy * ALT;
        for (const dx of [-6, 6]) { brilhoRadial(ctx, x + dx, y, 14, K.loboOlho, 0.9 * b * pisca); ctx.fillStyle = css(K.loboOlho, b * pisca); ctx.beginPath(); ctx.arc(x + dx, y, 2.4, 0, TAU); ctx.fill(); }
      }
    }
    function escuridao(ctx, S, cx, cy) {
      const e = S.escuro;
      if (e < 0.02) return;
      const raio = 220 + 300 * S.luzPastor;
      const g = ctx.createRadialGradient(cx, cy, raio * 0.25, cx, cy, raio * 2.4);
      const cor = H('#3f3a6e');
      g.addColorStop(0, css(cor, 0)); g.addColorStop(0.35, css(cor, 0.25 * e)); g.addColorStop(1, css(cor, e));
      ctx.fillStyle = g; ctx.fillRect(-40, -40, S.W + 80, ALT + 80);
    }

    // ---------------------------------------------------------------- chão, caminho, relva e flores
    function chao(ctx, S) {
      const W = S.W, cam = S.rol;
      const g = ctx.createLinearGradient(0, 0.83 * ALT, 0, ALT);
      g.addColorStop(0, css(luzObj(S, '#c6edd7', 1))); g.addColorStop(1, css(luzObj(S, '#a8dcc0', 1)));
      ctx.beginPath(); ctx.moveTo(-20, ALT + 20);
      for (let x = -20; x <= W + 20; x += 8) ctx.lineTo(x, 0.835 * ALT + Math.sin((x + cam) * 0.006) * 6 + Math.sin((x + cam) * 0.017) * 2.5);
      ctx.lineTo(W + 20, ALT + 20); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
      // caminho: areia clara; fica dourado no gatilho `justica`
      const ouro = S.caminhoOuro;
      ctx.beginPath(); ctx.moveTo(-20, ALT + 20);
      const yc = (x) => SOLO + 10 + Math.sin((x + cam) * 0.005) * 7;
      for (let x = -20; x <= W + 20; x += 8) ctx.lineTo(x, yc(x) - 26 + Math.sin((x + cam) * 0.013) * 3);
      for (let x = W + 20; x >= -20; x -= 8) ctx.lineTo(x, yc(x) + 34 + Math.sin((x + cam) * 0.011) * 3);
      ctx.closePath();
      const gp = ctx.createLinearGradient(0, SOLO - 20, 0, SOLO + 46);
      gp.addColorStop(0, css(ml(luzObj(S, '#f6eadb', 0.9), K.luzOuro, ouro * 0.8))); gp.addColorStop(1, css(ml(luzObj(S, '#ecd8c3', 0.9), K.ouro, ouro * 0.7)));
      ctx.fillStyle = gp; ctx.fill();
      if (ouro > 0.02) {                                                      // brilhos no caminho
        ctx.fillStyle = css(K.luz, 0.9 * ouro);
        for (let i = 0; i < 30; i++) {
          const x = mod(hash1(i * 4.7) * (W + 200) - cam * 1.0, W + 200) - 100, y = yc(x) + (hash1(i * 2.3) - 0.3) * 40;
          const tw = Math.max(0, Math.sin(S.t * (1.6 + hash1(i) * 2) + i * 2.1));
          if (tw > 0.1) brilho4(ctx, x, y, 3 + 5 * tw);
        }
      }
    }
    function relva(ctx, S, frente) {
      const W = S.W, cam = S.rol, CEL = 34, verde = S.verde;
      const c0 = Math.floor((cam - 40) / CEL), c1 = Math.floor((cam + W + 40) / CEL);
      for (let c = c0; c <= c1; c++) {
        const h1 = hash1(c * 2.13 + 4), h2 = hash1(c * 7.77 + 1), h3 = hash1(c * 4.9 + 9);
        const prof = 0.845 + 0.15 * h3, y0 = prof * ALT;
        if ((y0 > SOLO + 4) !== frente) continue;
        if (y0 > SOLO - 26 && y0 < SOLO + 40) continue;                       // não nasce no meio do caminho
        if (S.lagoaY && y0 > S.lagoaY - 6 && S.lagoaAt(c * CEL - cam)) continue;
        const sx = c * CEL + h1 * CEL - cam, esc = (0.55 + 0.9 * (prof - 0.845) / 0.15) * (0.7 + 0.45 * verde);
        const n = 3 + Math.floor(h1 * 3);
        ctx.lineCap = 'round';
        for (let i = 0; i < n; i++) {
          const alt = (14 + hash1(c * 3.3 + i) * 22) * esc, lean = (i - (n - 1) / 2) * 6 * esc + Math.sin(S.t * 1.3 + c * 0.7 + i) * 3 * (alt / 30);
          ctx.strokeStyle = css(luzObj(S, i % 2 ? '#8fd3ae' : '#aee3c4', 0.9)); ctx.lineWidth = 2.6 * esc;
          ctx.beginPath(); ctx.moveTo(sx + (i - n / 2) * 3.5 * esc, y0); ctx.quadraticCurveTo(sx + lean * 0.5, y0 - alt * 0.6, sx + lean, y0 - alt); ctx.stroke();
        }
        if (h2 > 0.62 - 0.32 * verde) {                                      // flores (mais flores quando o pasto fica verde)
          const hf = (18 + 20 * h1) * esc, cor = FLORES[Math.floor(h3 * FLORES.length)], bal = Math.sin(S.t * 1.6 + c * 4) * 2.4 * esc;
          const abre = clamp(0.4 + verde * 0.6 + (h2 - 0.5));
          ctx.strokeStyle = css(luzObj(S, '#8fd3ae', 0.9)); ctx.lineWidth = 2 * esc; ctx.beginPath(); ctx.moveTo(sx + 7, y0); ctx.quadraticCurveTo(sx + 7 + bal * 0.4, y0 - hf * 0.5, sx + 7 + bal, y0 - hf); ctx.stroke();
          ctx.fillStyle = css(luzObj(S, cor, 0.7));
          for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU + c; ctx.beginPath(); ctx.arc(sx + 7 + bal + Math.cos(a) * 4.6 * esc * abre, y0 - hf + Math.sin(a) * 4.6 * esc * abre, 3.3 * esc * (0.5 + 0.5 * abre), 0, TAU); ctx.fill(); }
          ctx.fillStyle = css(K.ouro); ctx.beginPath(); ctx.arc(sx + 7 + bal, y0 - hf, 2.2 * esc, 0, TAU); ctx.fill();
        }
      }
    }
    // águas tranquilas: uma lagoa no primeiro plano (no pasto do começo e junto à casa)
    const LAGOAS = [
      { x0: XL - 330, x1: XL + 450, ap: (t) => smooth(tAguas - 0.2, tAguas + 1.6, t) },
      { x0: rolCasa + CX - 900, x1: rolCasa + CX - 200, ap: (t) => smooth(tRoi[7] + 0.5, tRoi[7] + 3.5, t) },
    ];
    function lagoas(ctx, S) {
      const yTop = 0.928 * ALT;
      S.lagoaY = null;
      for (const L of LAGOAS) {
        const a = L.ap(S.tl);
        if (a < 0.01) continue;
        const xa = L.x0 - S.rol, xb = L.x1 - S.rol;
        if (xb < -20 || xa > S.W + 20) continue;
        S.lagoaY = yTop; S.lagoaAt = (x) => x > xa + 20 && x < xb - 20;
        const subir = (1 - a) * 46;
        ctx.save();
        ctx.beginPath(); ctx.moveTo(xa, ALT + 20); ctx.lineTo(xa, yTop + 30 + subir);
        ctx.bezierCurveTo(xa + 20, yTop + subir, xa + 60, yTop + subir, xa + 110, yTop + subir);
        ctx.lineTo(xb - 110, yTop + subir); ctx.bezierCurveTo(xb - 60, yTop + subir, xb - 20, yTop + subir, xb, yTop + 30 + subir);
        ctx.lineTo(xb, ALT + 20); ctx.closePath();
        const g = ctx.createLinearGradient(0, yTop, 0, ALT);
        g.addColorStop(0, css(ml(luzObj(S, '#bfeaf0', 0.8), S.ceu.hor, 0.25), a)); g.addColorStop(1, css(luzObj(S, '#93cfd9', 0.8), a));
        ctx.fillStyle = g; ctx.fill();
        ctx.clip();
        ctx.strokeStyle = css(K.luz, 0.5 * a); ctx.lineWidth = 1.6;                 // marolas suaves
        for (let i = 0; i < 6; i++) {
          const y = yTop + 14 + subir + i * 13, ph = S.t * 0.6 + i * 1.7;
          ctx.beginPath(); for (let x = xa; x <= xb; x += 10) { const yy = y + Math.sin(x * 0.03 + ph) * 1.6; x === xa ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); } ctx.stroke();
        }
        if (S.sol && S.sol.alt > -0.05) {                                       // reflexo do sol
          ctx.fillStyle = css(K.luz, 0.6 * a * (1 - S.noite));
          for (let i = 0; i < 18; i++) { const tw = Math.max(0, Math.sin(S.t * (1.4 + hash1(i) * 2) + i)); ctx.fillRect(S.sol.x + (hash1(i * 3.1) - 0.5) * 160, yTop + 10 + subir + hash1(i * 7.3) * 60, 6 + 16 * tw, 1.6); }
        }
        for (let i = 0; i < 4; i++) {                                           // vitórias-régias
          const lx = xa + (0.14 + 0.24 * i) * (xb - xa), ly = yTop + 26 + subir + (i % 2) * 18;
          if (lx < -30 || lx > S.W + 30) continue;
          ctx.fillStyle = css(luzObj(S, '#a9dcc3', 0.9), a); ctx.beginPath(); ctx.ellipse(lx, ly, 20, 6, 0, 0.3, TAU - 0.1); ctx.lineTo(lx, ly); ctx.fill();
          ctx.fillStyle = css(K.rosa, a); for (let k = 0; k < 6; k++) { const an = (k / 6) * TAU; ctx.beginPath(); ctx.ellipse(lx + Math.cos(an) * 4, ly - 4 + Math.sin(an) * 1.6, 4, 2, an, 0, TAU); ctx.fill(); }
        }
        ctx.restore();
      }
    }
    // a flor murcha que revive no gatilho `restaura`
    const disco2 = (ctx, x, y, r, cor) => { ctx.fillStyle = css(cor); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
    function florRestaurada(ctx, S) {
      const x = XFLOR - S.rol, y = 0.918 * ALT;
      if (x < -40 || x > S.W + 40) return;
      const r = smooth(tRestaura - 0.1, tRestaura + 1.8, S.tl);
      const caule = lerp(1.15, 0, ease.outCubic(r));
      ctx.save(); ctx.translate(x, y); ctx.scale(1.25, 1.25);
      ctx.strokeStyle = css(ml(H('#b9c9a8'), H('#8fd3ae'), r)); ctx.lineWidth = 3; ctx.lineCap = 'round';
      const topo = [Math.sin(caule) * 34, -Math.cos(caule) * 34];
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(2, -20, topo[0], topo[1]); ctx.stroke();
      const cor = ml(H('#d8c9c0'), K.rosa, r), raio = 4 + 4 * r;
      ctx.fillStyle = css(cor);
      for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU + caule; ctx.beginPath(); ctx.arc(topo[0] + Math.cos(a) * raio * (0.5 + 0.5 * r), topo[1] + Math.sin(a) * raio * (0.5 + 0.5 * r), 3 + 2.5 * r, 0, TAU); ctx.fill(); }
      disco2(ctx, topo[0], topo[1], 2.5 + r, K.ouro);
      if (r > 0.02 && r < 0.999) brilhoRadial(ctx, topo[0], topo[1], 60, K.luzOuro, 0.7 * Math.sin(Math.PI * r));
      ctx.restore();
    }

    // ---------------------------------------------------------------- personagens: posições e poses ao longo da letra
    // o passo das pernas segue a distância andada sobre o chão (mundo que rola + deslocamento na tela), sem saltos
    function poses(S) {
      const tl = S.tl, andar = S.andar;
      const lam = { x: XL, y: SOLO, dir: 1, deita: 0, dorme: 0, bebe: 0, olha: 0, brilho: 0, unge: 0, alfa: 1, andarL: andar };
      const pas = { x: XP, y: SOLO, dir: 1, ajoelha: 0, estende: 0, ergue: 0, oleo: 0, derrama: 0, carrega: 0, lanterna: 0, vara: 0, alfa: 1, andarP: andar };
      const passoLocal = (a, b) => win(a - 0.05, a + 0.25, b - 0.25, b + 0.05, tl);
      // --- pasto (antes de caminhar)
      if (tl < tJustica + 1.5) {
        lam.dorme = 1 - smooth(tRoi[0] + 0.6, tRoi[0] + 1.3, tl);
        lam.deita = Math.max(1 - smooth(tRoi[0] + 2.0, tRoi[0] + 3.4, tl), smooth(tPastos, tPastos + 1.6, tl) * (1 - smooth(tAguas + 1.0, tAguas + 2.0, tl)));
        lam.olha = win(tRoi[0] + 2.8, tRoi[0] + 3.8, tEchsar + 9, tEchsar + 11, tl) * 0.9;
        const m = smooth(tAguas + 2.0, tAguas + 3.4, tl) * (1 - smooth(tJustica - 0.6, tJustica + 1.2, tl));
        lam.x = lerp(XL, XBEBE, m); lam.y = lerp(SOLO, SOLO + 44, m);
        lam.andarL = Math.max(andar, passoLocal(tAguas + 2.0, tAguas + 3.4), passoLocal(tJustica - 0.6, tJustica + 1.2));
        lam.bebe = win(tAguas + 3.4, tAguas + 4.1, tJustica - 0.9, tJustica - 0.3, tl);
        // pulinhos de alegria (gatilho `echsar`)
        for (const t0 of [tEchsar, tRoi[1] + 3.9]) { const u = (tl - t0) / 0.5; if (u > 0 && u < 2) lam.y -= Math.max(0, Math.sin(Math.PI * mod(u, 1))) * 18; }
        pas.alfa = smooth(tRoi[0] - 0.4, tRoi[0] + 1.6, tl);
        pas.dir = tl < tJustica - 0.2 ? -1 : 1;
        pas.estende = win(tAguas + 0.2, tAguas + 1.0, tAguas + 2.4, tAguas + 3.2, tl);
      }
      lam.brilho = Math.max(win(tRestaura - 0.2, tRestaura + 0.6, tJustica, tJustica + 1.2, tl), win(tNafshi - 0.2, tNafshi + 0.6, tNafshi + 3.0, tNafshi + 4.2, tl));
      // --- vale: o cordeiro chega perto do Pastor e olha para Ele
      const perto = win(tTemerei[0] - 0.3, tTemerei[0] + 1.2, tRoi[4] + 2.5, tRoi[4] + 5.5, tl);
      lam.x += 100 * perto; lam.olha = Math.max(lam.olha, perto * 0.7);
      pas.lanterna = Math.max(vale[0].esc(tl), vale[1].esc(tl)) * (1 - S.carrega);
      // --- a mesa (parados): o Pastor ergue a vara e o cajado, vai para trás da mesa como anfitrião e depois unge o cordeiro
      if (tl > tVara - 1.5 && tl < tGam + 1.2) {
        const vira = smooth(tVara - 0.9, tVara - 0.6, tl) * (1 - smooth(tGam - 0.95, tGam - 0.75, tl));
        pas.dir = vira > 0.5 ? -1 : 1;
        const recua = smooth(tMesa - 1.3, tMesa - 0.2, tl), ungir = smooth(tUnges - 0.4, tUnges + 1.1, tl), volta = smooth(tGam - 0.6, tGam + 0.7, tl);
        pas.x = lerp(lerp(lerp(XP, XHOST, recua), XUNGE, ungir), XP, volta);
        pas.andarP = Math.max(andar, 0.6 * passoLocal(tMesa - 1.3, tMesa - 0.2), passoLocal(tUnges - 0.4, tUnges + 1.1), passoLocal(tGam - 0.6, tGam + 0.7));
        pas.ergue = win(tVara - 0.1, tVara + 0.9, tConsolam - 0.4, tConsolam + 0.6, tl);
        pas.vara = win(tVara - 0.4, tVara + 0.4, tConsolam + 2.6, tConsolam + 3.6, tl);
        pas.estende = win(tMesa + 0.1, tMesa + 0.7, tMesa + 2.2, tMesa + 3.0, tl);
        pas.ajoelha = 0.95 * win(tUnges + 0.9, tUnges + 1.5, tCalice - 0.4, tCalice + 0.4, tl);
        pas.oleo = win(tUnges + 1.0, tUnges + 1.6, tCalice - 0.6, tCalice + 0.2, tl);
        pas.derrama = win(tUnges + 1.7, tUnges + 2.1, tCalice - 1.3, tCalice - 0.7, tl);
        lam.unge = win(tUnges + 2.0, tUnges + 2.7, tCalice + 2.5, tCalice + 4.0, tl);
        lam.olha = Math.max(lam.olha, 0.5 * win(tVara, tVara + 1, tMesa + 1, tMesa + 2, tl), 0.6 * win(tUnges + 1.4, tUnges + 2, tCalice - 0.4, tCalice + 0.4, tl));
      }
      // --- no vale à noite: o Pastor volta, se ajoelha e põe o cordeiro nos ombros
      if (tl > tC1 - 1.0 && tl < tC1 + 4.5) {
        const vira = smooth(tC1 - 0.1, tC1 + 0.1, tl) * (1 - smooth(tC1 + 3.0, tC1 + 3.2, tl));
        pas.dir = vira > 0.5 ? -1 : 1;
        pas.x = lerp(XP, XPEGA, smooth(tC1 + 0.1, tC1 + 0.9, tl));
        pas.andarP = Math.max(andar, passoLocal(tC1 + 0.1, tC1 + 0.9));
        pas.ajoelha = win(tC1 + 0.9, tC1 + 1.5, tC1 + 2.6, tC1 + 3.2, tl);
        pas.estende = win(tC1 + 1.2, tC1 + 1.7, tC1 + 1.9, tC1 + 2.5, tl);
        lam.x = lerp(XL, XLPEGA, smooth(tC1 - 0.1, tC1 + 0.9, tl));
        lam.andarL = Math.max(lam.andarL, passoLocal(tC1 - 0.1, tC1 + 0.9));
        lam.olha = Math.max(lam.olha, 0.8 * win(tC1 + 0.4, tC1 + 0.9, tC1 + 1.6, tC1 + 2.0, tl));
      }
      pas.carrega = S.carrega;
      if (tl > tC1 + 1.8 && tl < T_CASA + 0.9) {
        const sobe = smooth(tC1 + 1.8, tC1 + 2.5, tl);
        lam.x = XLPEGA; lam.alfa = 1 - sobe; lam.y = SOLO - 70 * sobe;
        if (tl > tC1 + 3.0) pas.x = lerp(XPEGA, XCARREGA, smooth(tC1 + 3.3, tC1 + 4.3, tl));
      }
      // --- a casa de Adonai
      if (tl > T_CASA - 2.0) {
        pas.dir = 1;
        pas.ajoelha = win(T_CASA + 0.4, T_CASA + 1.0, T_CASA + 2.2, T_CASA + 2.8, tl);
        const desce = smooth(T_CASA + 0.9, T_CASA + 1.8, tl);
        lam.alfa = desce; lam.y = SOLO - 60 * (1 - desce);
        const vaiPorta = smooth(tLongos[1] - 0.3, tLongos[1] + 1.9, tl);
        lam.x = lerp(XCARREGA + 145, XPORTA, vaiPorta);
        lam.andarL = passoLocal(tLongos[1] - 0.3, tLongos[1] + 1.9);
        { const u = (tl - tSempre - 0.7) / 0.5; if (u > 0 && u < 2) lam.y -= Math.max(0, Math.sin(Math.PI * mod(u, 1))) * 18; }   // pulinhos quando a porta se abre
        lam.deita = smooth(tRoi[7] + 5.2, tRoi[7] + 6.6, tl) * (1 - win(tBondade[1] - 0.4, tBondade[1] + 0.4, tBondade[1] + 6.0, tBondade[1] + 7.2, tl));
        lam.olha = Math.max(0.8 * win(tShivti[2] - 0.2, tShivti[2] + 0.8, tShivti[2] + 3.2, tShivti[2] + 4.0, tl), win(tSempre - 0.2, tSempre + 0.8, tSempre + 4, tSempre + 5, tl),
          win(tBondade[1] - 0.2, tBondade[1] + 0.8, tBondade[1] + 6, tBondade[1] + 7, tl));
        lam.dorme = smooth(dur - 16, dur - 12, tl);
        const vaiPortaP = smooth(tDias[1] - 0.1, tDias[1] + 2.6, tl);
        pas.x = lerp(XCARREGA, XPASCASA, vaiPortaP);
        pas.andarP = Math.max(tl < T_CASA ? andar : 0, passoLocal(tDias[1] - 0.1, tDias[1] + 2.6));
        // recebe o rebanho que chega (vira para a esquerda e estende a mão), depois volta a olhar o cordeiro
        const recebe = smooth(tRoi[7] + 0.1, tRoi[7] + 0.3, tl) * (1 - smooth(tRoi[7] + 8.0, tRoi[7] + 8.2, tl));
        if (recebe > 0.5) pas.dir = -1;
        pas.estende = Math.max(win(tShivti[3] + 0.2, tShivti[3] + 0.9, tShivti[3] + 3.0, tShivti[3] + 3.8, tl) * 0.6, win(tRoi[7] + 0.8, tRoi[7] + 1.6, tRoi[7] + 6.4, tRoi[7] + 7.4, tl));
        pas.lanterna = smooth(dur - 24, dur - 16, tl);
      }
      lam.fase = ((S.rol + lam.x * lam.dir) / 86) * TAU;
      pas.fase = ((S.rol + pas.x * pas.dir) / 157) * TAU;
      return { lam, pas };
    }

    // rebanho (mundo) e os inimigos diante da mesa
    const REBANHO_A = [
      { x: CX - 810, dy: -10, s: 0.84, sem: 1, dir: 1 }, { x: CX - 630, dy: -46, s: 0.62, sem: 2, dir: 1, deita: 1 },
      { x: CX + 340, dy: -24, s: 0.78, sem: 3, dir: -1 }, { x: CX + 580, dy: -50, s: 0.6, sem: 4, dir: -1, deita: 1 }, { x: CX + 800, dy: 6, s: 0.9, sem: 5, dir: -1 },
    ];
    const REBANHO_G = [
      { x: CX - 740, dy: 20, s: 0.8, sem: 6, t0: 4.8, d: 4.4 }, { x: CX - 540, dy: -18, s: 0.66, sem: 7, t0: 3.6, d: 5.2 },
      { x: CX - 350, dy: 30, s: 0.86, sem: 8, t0: 2.4, d: 6.0 }, { x: CX - 160, dy: -34, s: 0.6, sem: 9, t0: 1.2, d: 6.8 }, { x: CX + 20, dy: 12, s: 0.74, sem: 10, t0: 0.2, d: 7.5 },
    ];
    function rebanho(ctx, S) {
      const tl = S.tl, ent = smooth(tEchsar - 0.5, tEchsar + 1.6, tl);
      if (ent > 0.01) for (const o of REBANHO_A) {
        const x = o.x - S.rol + (1 - ent) * 70 * -o.dir;                 // entram andando, vindos das bordas
        if (x < -120 || x > S.W + 120) continue;
        const anda = Math.sin(Math.PI * ent), pasta = smooth(0.2, 0.7, 0.5 + 0.5 * Math.sin(tl * 0.5 + o.sem * 2)) * (1 - anda);
        R.ovelha(ctx, x, SOLO + o.dy, o.s, { dir: o.dir, t: tl, andar: anda * 0.8, fase: ((S.rol + x * o.dir) / (82 * o.s)) * TAU, bebe: pasta * 0.85, alfa: ent, adulto: true, semente: o.sem, deita: smooth(tPastos, tPastos + 2, tl) * (o.deita || 0) });
      }
      for (const o of REBANHO_G) {                                         // o rebanho que chega à casa
        const a0 = tRoi[7] + o.t0, u = smooth(a0, a0 + o.d, tl);
        if (u <= 0) continue;
        const x = lerp(-110, rolCasa + o.x - S.rol, u), anda = Math.sin(Math.PI * clamp((tl - a0) / o.d));
        if (x < -120 || x > S.W + 120) continue;
        const pasta = smooth(0.2, 0.7, 0.5 + 0.5 * Math.sin(tl * 0.45 + o.sem * 2)) * (1 - anda);
        R.ovelha(ctx, x, SOLO + o.dy, o.s, { dir: 1, t: tl, andar: anda, fase: (x / (82 * o.s)) * TAU, bebe: pasta * 0.8, adulto: true, semente: o.sem, deita: smooth(dur - 20, dur - 14, tl) * (o.sem % 2) });
      }
    }
    function inimigos(ctx, S) {
      const tl = S.tl, c = win(tInimigos - 0.3, tInimigos + 0.9, tGam - 1.5, tGam, tl);
      if (c < 0.01) return;
      const deita = smooth(tUnges - 1.6, tUnges, tl);
      R.lobo(ctx, 0.07 * S.W, 0.845 * ALT, 0.7, { dir: 1, t: tl, alfa: c * 0.85, deita, olhos: 1 });
      R.lobo(ctx, 0.93 * S.W, 0.842 * ALT, 0.7, { dir: -1, t: tl + 1, alfa: c * 0.85, deita, olhos: 1 });
      const cx = CX - 90, cy = SOLO + 12, rx = 500, ry = 52;                   // não passam do círculo de luz
      ctx.strokeStyle = css(K.luzOuro, 0.8 * c); ctx.lineWidth = 4.5;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); ctx.stroke();
      ctx.fillStyle = css(K.luz, 0.8 * c);
      for (let i = 0; i < 14; i++) { const an = (i / 14) * TAU + tl * 0.3; brilho4(ctx, cx + Math.cos(an) * rx, cy + Math.sin(an) * ry, 4 + 2 * Math.sin(tl * 3 + i)); }
    }
    // mesa, cálice e o abraço do cajado
    function mesaCena(ctx, S) {
      const tl = S.tl, nasce = smooth(tMesa - 0.2, tMesa + 1.1, tl), ap = nasce * (1 - smooth(tGam - 0.4, tGam + 1.4, tl));
      if (ap < 0.01) return;
      const x = rolMesa + XMESA - S.rol;
      if (x < -200 || x > S.W + 200) return;
      const s = 1.25 * (0.8 + 0.2 * ease.outBack(nasce));
      R.mesa(ctx, x, SOLO + 8, s, { alfa: ap, t: tl });
      R.calice(ctx, x - 78 * s, SOLO + 8 - 66 * s, 1.25, { alfa: ap, t: tl, transborda: smooth(tCalice - 0.2, tCalice + 1.0, tl) });
      const brota = Math.max(Math.sin(Math.PI * nasce), Math.sin(Math.PI * smooth(tGam - 0.4, tGam + 1.4, tl)));
      if (brota > 0.01) { ctx.fillStyle = css(K.luz, 0.9 * brota); for (let i = 0; i < 14; i++) { const an = (i / 14) * TAU + tl; brilho4(ctx, x + Math.cos(an) * 150, SOLO - 50 + Math.sin(an) * 60, 6); } }
    }
    function abracoCajado(ctx, S, lam) {
      const a = win(tConsolam - 0.1, tConsolam + 0.8, tMesa - 0.8, tMesa + 0.3, S.tl);
      if (a < 0.02) return;
      ctx.strokeStyle = css(K.luzOuro, 0.85 * a); ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.ellipse(lam.x + 6, lam.y - 42, 80, 60, 0, Math.PI * 0.9, Math.PI * 0.9 + TAU * 0.85 * a); ctx.stroke();
      brilhoRadial(ctx, lam.x + 6, lam.y - 42, 150, K.luzOuro, 0.45 * a);
    }
    // lira de Davi (gatilho `mizmor`): toca, solta notas, e a luz dela forma o Pastor
    function liraCena(ctx, S, pas) {
      const tl = S.tl, a = win(tMizmor - 0.5, tMizmor + 0.6, tRoi[0] - 0.4, tRoi[0] + 0.8, tl);
      const lx = XP + 330, ly = 0.67 * ALT + 6 * Math.sin(tl * 1.4);
      if (a > 0.01) {
        R.lira(ctx, lx, ly, 1.0, { alfa: a, t: tl, toca: 1 });
        for (let i = 0; i < 6; i++) {
          const u = mod(tl * 0.45 + i / 6, 1), x = lx + (hash1(i * 7.1) - 0.5) * 120 + Math.sin(tl * 2 + i) * 14, y = ly - 110 - 110 * u;
          nota(ctx, x, y, 0.9 + 0.3 * hash1(i), a * Math.sin(Math.PI * u));
        }
      }
      const fluxo = win(tRoi[0] - 0.8, tRoi[0] - 0.2, tRoi[0] + 1.2, tRoi[0] + 2.0, tl);
      if (fluxo > 0.01) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 30; i++) {
          const u = mod(tl * 0.8 + hash1(i * 3.3), 1);
          const x = lerp(lx, pas.x + (hash1(i * 5.1) - 0.5) * 80, ease.inOutSine(u)), y = lerp(ly - 60, SOLO - 40 - hash1(i * 7.7) * 220, ease.inOutSine(u)) - Math.sin(Math.PI * u) * 60;
          brilhoRadial(ctx, x, y, 12, K.luzOuro, 0.8 * fluxo * Math.sin(Math.PI * u));
        }
        ctx.restore();
      }
    }
    // gatilho `yancheni`: anéis no chão que se acendem à frente
    function veredas(ctx, S) {
      const tl = S.tl;
      if (tl < tYancheni - 0.5 || tl > tYancheni + 9) return;
      for (let k = 0; k < 7; k++) {
        const x = rolEm(tYancheni) + XP + 70 + k * 90 - S.rol, t0 = tYancheni + k * 0.45;
        const a = win(t0, t0 + 0.4, t0 + 2.2, t0 + 3.4, tl);
        if (a < 0.02 || x < -60 || x > S.W + 60) continue;
        ctx.strokeStyle = css(K.luzOuro, 0.8 * a); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(x, SOLO + 14, 34, 10, 0, 0, TAU); ctx.stroke();
        brilhoRadial(ctx, x, SOLO + 10, 52, K.luzOuro, 0.4 * a);
      }
    }
    // bondade e misericórdia: duas pombas que seguem o cordeiro (e, no fim, dão uma volta sobre a casa)
    function pombas(ctx, S, alvo) {
      const tl = S.tl, a = smooth(tBondade[0] - 0.3, tBondade[0] + 1.2, tl);
      if (a < 0.01) return;
      const laco = win(tBondade[1] - 0.2, tBondade[1] + 1, tBondade[1] + 6.5, tBondade[1] + 8, tl);
      const xc = rolCasa + XCASA - S.rol;
      [[0, K.luzOuro], [Math.PI, K.rosa]].forEach(([ph, cor], i) => {
        let x = alvo.x + Math.cos(tl * 0.9 + ph) * 54, y = alvo.y - 140 + Math.sin(tl * 1.3 + ph) * 16 - i * 14;
        if (laco > 0.01) { x = lerp(x, xc + Math.cos(tl * 1.4 + ph) * 330, laco); y = lerp(y, 0.63 * ALT + Math.sin(tl * 1.4 + ph) * 40, laco); }
        const entra = (1 - a) * 200;
        brilhoRadial(ctx, x, y - entra, 56, cor, 0.6 * a);
        G.Personagens.pomba(ctx, S, x + (i ? 1 : -1) * entra * 0.5, y - entra, 0.8, { fase: tl * 9 + i * 2, bate: 0.3 + 0.7 * Math.sin(tl * 9 + i * 2), rot: Math.cos(tl * 0.9 + ph) * 0.12, dir: Math.sin(tl * 0.9 + ph) > 0 ? -1 : 1 });
      });
    }
    function vagalumes(ctx, S) {
      const f = S.noite * (1 - 0.5 * S.escuro) + 0.25 * S.escuro;
      if (f < 0.03) return;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 50; i++) {
        const x = mod(hash1(i * 3.3) * (S.W + 100) + 30 * noise1(S.t * 0.13 + i * 3.1) - S.rol * 0.5, S.W + 100) - 50;
        const y = (0.55 + 0.4 * hash1(i * 7.1)) * ALT + 26 * noise1(S.t * 0.17 + i * 5.3);
        const a = f * (0.35 + 0.65 * Math.max(0, Math.sin(S.t * (1.2 + hash1(i) * 2) + i)));
        brilhoRadial(ctx, x, y, 9, H('#fff3a6'), 0.8 * a);
      }
      ctx.restore();
    }
    function particulas(ctx, S) {
      const f = 0.3 * (1 - S.noite) * (1 - S.escuro);
      if (f < 0.03) return;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 44; i++) {
        const x = mod(hash1(i * 3.3) * (S.W + 100) + 20 * Math.sin(S.t * 0.4 + i) - S.t * (6 + 9 * hash1(i * 2.9)), S.W + 100) - 50;
        const y = mod(hash1(i * 7.1 + 5) * ALT * 0.9 - S.t * (4 + 7 * hash1(i * 4.4)), ALT * 0.9) + ALT * 0.05;
        const tw = 0.3 + 0.7 * Math.max(0, Math.sin(S.t * (0.8 + hash1(i) * 2) + i * 2.3));
        brilhoRadial(ctx, x, y, 5 + 7 * hash1(i * 1.9 + 3), K.luzOuro, 0.6 * tw * f);
      }
      ctx.restore();
    }

    // ---------------------------------------------------------------- quadro
    function desenhar(ctx, S) {
      const tl = S.tl;
      S.hora = horaEm(tl); S.ceu = ceuEm(S.hora); S.noite = noiteF(S.hora);
      S.rol = rolEm(tl); S.andar = andarEm(tl);
      S.verde = smooth(tPastos - 0.2, tPastos + 1.8, tl);
      S.caminhoOuro = smooth(tJustica - 0.2, tJustica + 1.6, tl) * (1 - smooth(tAndar - 1.2, tAndar + 0.6, tl));
      S.vale = Math.max(vale[0].esc(tl), vale[1].esc(tl));
      const ev = Math.max(vale[0].esc(tl) * vale[0].forca, vale[1].esc(tl) * vale[1].forca);
      S.escuro = ev;
      S.luzPastor = win(tComigo[0] - 0.2, tComigo[0] + 1.2, tRoi[4] + 2, tRoi[4] + 5, tl) * 0.9 + win(tC1 - 0.2, tC1 + 1.2, tRoi[5] + 1, tRoi[5] + 5, tl) * 0.8 + 0.25;
      S.carrega = smooth(tC1 + 1.8, tC1 + 2.6, tl) * (1 - smooth(T_CASA + 0.9, T_CASA + 1.8, tl));
      S.tomTexto = 1 - smooth(0.32, 0.62, Math.max(ev * 1.15, S.noite * 0.9));
      const P = poses(S), lam = P.lam, pas = P.pas;
      const W = S.W;
      // zoom suave quando o Pastor para sob as estrelas
      const zz = win(tComigo[4] - 0.5, tComigo[4] + 4.5, tComigo[4] + 11.0, tComigo[4] + 14.5, tl);
      const z = 1 + 0.10 * zz + 0.02 * clamp(tl / dur);
      const fx = lerp(W * 0.5, pas.x, zz), fy = lerp(ALT * 0.7, SOLO - 150, zz);
      ctx.save();
      ctx.translate(fx, fy); ctx.scale(z, z); ctx.translate(-fx, -fy);
      ceuFundo(ctx, S);
      estrelas(ctx, S);
      corpoCeleste(ctx, S);
      nuvens(ctx, S);
      raios(ctx, S, 0.35 * win(tSempre - 0.3, tSempre + 1, tSempre + 6, tSempre + 9, tl));
      luzNome(ctx, S);
      serra(ctx, S, MONT.longe); serra(ctx, S, MONT.meio); serra(ctx, S, MONT.colinas);
      arvores(ctx, S, MONT.colinas, 170, 0.55, 0.42, 7);
      if (S.vale > 0.004) {
        camadaVale(ctx, S, CAMADAS_VALE[0]);
        lobosVale(ctx, S);
        camadaVale(ctx, S, CAMADAS_VALE[1]);
        olhosNoite(ctx, S);
      }
      chao(ctx, S);
      relva(ctx, S, false);
      // a casa de Adonai
      const xc = rolCasa + XCASA - S.rol;
      if (xc > -320 && xc < W + 320) R.casa(ctx, xc, SOLO - 4, ECASA, { t: tl, luz: 0.35 + 0.65 * smooth(tShivti[0], tShivti[0] + 2, tl), aberta: smooth(tSempre - 0.1, tSempre + 1.6, tl) });
      rebanho(ctx, S);
      inimigos(ctx, S);
      liraCena(ctx, S, pas);
      veredas(ctx, S);
      // ordem: o cordeiro, o Pastor e, na frente dele, a mesa (Ele fica atrás dela, como anfitrião)
      if (lam.alfa > 0.01) R.ovelha(ctx, lam.x, lam.y, EL, { dir: lam.dir, fase: lam.fase, andar: lam.andarL, deita: lam.deita, bebe: lam.bebe, olha: lam.olha, dorme: lam.dorme, brilho: lam.brilho, unge: lam.unge, alfa: lam.alfa, t: tl, semente: 9 });
      if (pas.alfa > 0.01) R.pastorLuz(ctx, pas.x, pas.y, EP, { dir: pas.dir, fase: pas.fase, andar: pas.andarP, ajoelha: pas.ajoelha, estende: pas.estende, ergue: pas.ergue, oleo: pas.oleo, derrama: pas.derrama, carrega: pas.carrega, lanterna: pas.lanterna, vara: pas.vara, alfa: pas.alfa, t: tl, brilho: 0.8 + 0.4 * S.escuro, dormeCordeiro: smooth(tComigo[4] + 2, tComigo[4] + 4, tl) * (1 - smooth(tComigo[4] + 13, tComigo[4] + 14.5, tl)) });
      mesaCena(ctx, S);
      abracoCajado(ctx, S, lam);
      lagoas(ctx, S);
      florRestaurada(ctx, S);
      relva(ctx, S, true);
      camadaVale(ctx, S, FRENTE_VALE);
      pombas(ctx, S, pas.carrega > 0.5 ? { x: pas.x - 150, y: pas.y - 40 } : { x: lam.x, y: lam.y });
      escuridao(ctx, S, pas.x + 40 * pas.dir, pas.y - 130);
      vagalumes(ctx, S);
      particulas(ctx, S);
      ctx.restore();
    }

    return { espelho: false, estado: () => ({ fx: 0.5, calor: 0, peso: 0, nevoa: 0, vento: 0.2, solY: 400, solForca: 1, raios: 0, motes: 0, flash: 0 }), desenhar };
  }

  G.TemaSalmo23 = { criar };
})(window);
