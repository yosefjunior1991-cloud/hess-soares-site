// Tema "Pai Nosso em Aramaico", criado do zero a partir da letra inteira (a imagem da música é só um fundo preto), para o
// vídeo final em 16:9. Uma aldeia da Galileia à beira do lago: uma menina e o pai rezam no terraço sob as estrelas; no alto,
// no horizonte, aparece o Templo de Jerusalém (o Reino), e o lago o reflete: a terra espelha o céu. O dia nasce, o pão
// sai do forno, o fardo das dívidas se desfaz em luz e o vizinho é perdoado; todos repartem o pão. No campo, cada vinda do
// Reino é um feixe de luz que doura o trigo. Na bifurcação do caminho vem a tempestade e o brilho falso da tentação; a luz
// livra, os passos se acendem, o coração brilha e o caminho leva ao alto do monte: coroa de luz, rajada de raios, chuva dourada.
// Ao anoitecer, a aldeia acende lanternas de papel que sobem no final (gatilho `amen`) e viram estrelas; a menina adormece no colo do pai.
// O Pai não é retratado: a presença Dele é sempre luz que vem do céu.
// Os instantes saem do texto da legenda; os trechos que os disparam ficam em `animacao.json`, na pasta da música
// (`gatilhos`), e não neste repositório público. Sem o arquivo, valem os tempos padrão abaixo.
(function (G) {
  'use strict';
  const { clamp, lerp, smooth, mod, css, rgb, hash1, noise1, mulberry32, ease } = G.U;
  const R91 = G.Seres91, R = G.SeresPN, K = R.K, ml = R91.ml, aj = R91.aj, brilhoRadial = R91.brilhoRadial, brilho4 = R91.brilho4;
  const ALT = 1080, TAU = Math.PI * 2;
  const HORSKY = 0.62 * ALT;                     // horizonte do sol e da lua (atrás das montanhas)
  const semNikud = (s) => s.normalize('NFD').replace(/[֑-ׇ]/g, '').replace(/[̀-ͯ]/g, '');
  const H = (hex) => rgb(hex);

  const PADRAO = {
    abuna: [11.77, 89.00, 166.05, 240.84, 277.78, 314.00], shemach: [15.12, 92.67, 169.35, 245.15, 280.97, 317.03],
    teitei: [17.83, 95.31, 98.34, 171.98, 175.01, 247.70, 250.73, 283.60, 319.91], yitaved: [20.86], kedi: [23.42],
    pai_pt: [31.87], santo: [35.39], venha: [37.62, 101.77, 104.80, 178.69, 181.64, 254.08, 257.03], vontade: [41.05, 107.11, 183.87, 259.27],
    terra: [43.84, 110.55, 187.30, 262.70], comoceus: [120.22], pao: [56.50], pao2: [59.96], perdoa: [62.43], perdoamos: [65.94], devem: [68.66],
    lachma: [75.20], yomana: [79.43], shevok: [81.34], kediaf: [82.94], shevakna: [84.53],
    tentacao: [133.60], livra: [136.64], passos: [139.35], coracao: [140.94], conduz: [142.78],
    reino: [145.17, 215.78, 227.83], poder: [149.00, 218.74, 230.78], gloria: [150.68, 221.77, 233.82], sempre: [152.11, 224.40, 236.45],
    nisyona: [157.22], bisha: [160.49], dilach: [204.10], chayla: [207.01], lealam: [210.12, 287.27, 324.37],
    amen: [290.70, 293.74, 296.69, 302.90, 305.90, 308.90, 329.87],
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
    const A = CEU[i], B = CEU[i + 1], f = clamp((h - A[0]) / (B[0] - A[0])), k = f * f * (3 - 2 * f);
    return { top: ml(A[1], B[1], k), mid: ml(A[2], B[2], k), hor: ml(A[3], B[3], k) };
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
    const tAbuna = TT('abuna'), tShemach = TT('shemach'), tTeitei = TT('teitei'), tYitaved = T('yitaved'), tKedi = T('kedi');
    const tPaiPt = T('pai_pt'), tVenha = TT('venha'), tVontade = TT('vontade'), tTerra = TT('terra'), tComoCeus = T('comoceus');
    const tPao = T('pao'), tPao2 = T('pao2'), tPerdoa = T('perdoa'), tPerdoamos = T('perdoamos'), tDevem = T('devem');
    const tLachma = T('lachma'), tYomana = T('yomana'), tShevakna = T('shevakna');
    const tTent = T('tentacao'), tLivra = T('livra'), tPassos = T('passos'), tCoracao = T('coracao'), tConduz = T('conduz');
    const tReino = TT('reino'), tPoder = TT('poder'), tGloria = TT('gloria'), tSempre = TT('sempre');
    const tNisyona = T('nisyona'), tBisha = T('bisha'), tDilach = T('dilach'), tChayla = T('chayla'), tLealam = TT('lealam'), tAmen = TT('amen');
    const win = (a, b, c, d, t) => smooth(a, b, t) * (1 - smooth(c, d, t));
    const pulso = (t0, sobe, desce, t) => win(t0 - 0.1, t0 + sobe, t0 + sobe + 0.6, t0 + sobe + desce, t);

    // ---------------------------------------------------------------- terreno do mundo (x de 0 a ~4300)
    const morro = (x) => smooth(3100, 3420, x) * (1 - smooth(3820, 4200, x));
    const solo = (x) => 905 + 4 * Math.sin(x * 0.004) - 75 * smooth(2750, 3150, x) - 70 * smooth(3150, 3450, x) + 45 * smooth(3820, 4200, x);
    const borda = (x) => solo(x) - lerp(140, 70, morro(x)) + 6 * Math.sin(x * 0.011) + 3 * Math.sin(x * 0.031);
    const BASE = (x) => solo(x) - 25;                                   // as casas ficam um pouco atrás do caminho
    const TETO = BASE(760) - 190;                                       // terraço da casa da família

    // ---------------------------------------------------------------- câmera (centro no mundo + zoom)
    const foco = (fx, fy, z, sx, sy) => [fx - (sx - W / 2) / z, fy - (sy - ALT / 2) / z, z];
    const ROOF = foco(775, TETO, 1.75, 0.40 * W, 0.83 * ALT), ROOF2 = foco(775, TETO, 1.83, 0.40 * W, 0.83 * ALT);
    const ROOF_CEU = foco(770, TETO, 1.18, 0.33 * W, 0.86 * ALT);
    const ALDEIA = foco(1000, 905, 1.0, 0.5 * W, 0.84 * ALT), FORNO = foco(1160, 905, 1.55, 0.47 * W, 0.87 * ALT);
    const POCO = foco(1545, 905, 1.6, 0.5 * W, 0.87 * ALT), PATIO = foco(1305, 905, 1.42, 0.5 * W, 0.87 * ALT);
    const CAMPO = foco(2450, 905, 1.02, 0.5 * W, 0.85 * ALT), CAMPO2 = foco(2480, 905, 0.88, 0.5 * W, 0.86 * ALT);
    const TRILHA = foco(2780, solo(2780), 1.08, 0.5 * W, 0.85 * ALT), BIFURCA = foco(3070, solo(3070), 1.45, 0.45 * W, 0.87 * ALT);
    const MONTE = foco(3590, solo(3590), 1.25, 0.47 * W, 0.86 * ALT), MONTE2 = foco(3420, solo(3420), 0.86, 0.5 * W, 0.84 * ALT);
    const PORDOSOL = foco(3530, solo(3530), 1.2, 0.42 * W, 0.87 * ALT);
    const VOO = foco(2400, 905, 1.2, 0.5 * W, 0.86 * ALT);           // no meio do voo, nem o monte nem a margem aparecem
    const MARGEM = foco(1175, 905, 1.12, 0.5 * W, 0.86 * ALT), SOBE = foco(1175, 905, 1.05, 0.5 * W, 1.04 * ALT);
    const COLO = foco(1140, 905, 1.65, 0.42 * W, 0.87 * ALT), FIM = foco(1150, 905, 0.9, 0.5 * W, 0.80 * ALT);
    const CAM = [
      [0, ROOF], [tTeitei[0] - 0.3, ROOF2], [tKedi + 0.4, ROOF_CEU], [tPaiPt - 0.4, ROOF_CEU], [tPaiPt + 4.3, ALDEIA], [tPao - 1.5, ALDEIA], [tPao + 0.8, FORNO],
      [tPao2 + 0.5, FORNO], [tPerdoa + 0.2, POCO], [tDevem + 5.3, POCO], [tLachma + 1.3, PATIO], [tAbuna[1] - 2.0, PATIO], [tTeitei[1] - 0.3, CAMPO],
      [tTerra[1] - 0.8, CAMPO], [tTerra[1] + 3.0, CAMPO2], [tComoCeus + 6.3, CAMPO2], [tTent - 3.0, TRILHA], [tTent - 0.2, BIFURCA], [tConduz + 0.6, BIFURCA],
      [tGloria[0] - 0.8, MONTE], [tAbuna[2] - 0.5, MONTE], [tAbuna[2] + 4.0, MONTE2], [tDilach - 4.5, MONTE2], [tDilach - 0.2, PORDOSOL], [tAbuna[3] - 1.3, PORDOSOL],
      [tAbuna[3] + 2.2, VOO], [tShemach[3] + 1.8, MARGEM], [tAmen[0] - 1.0, MARGEM], [tAmen[2] + 3.0, SOBE], [tAmen[5] + 3.5, SOBE], [tAbuna[5] + 2.5, COLO],
      [tAmen[6] + 0.2, COLO], [tAmen[6] + 20, FIM],
    ];
    const camEm = (t) => {
      let i = 0; while (i < CAM.length - 2 && CAM[i + 1][0] <= t) i++;
      const [t0, a] = CAM[i], [t1, b] = CAM[i + 1];
      const f = ease.inOutSine(clamp((t - t0) / Math.max(1e-6, t1 - t0)));
      return { x: lerp(a[0], b[0], f), y: lerp(a[1], b[1], f), z: Math.exp(lerp(Math.log(a[2]), Math.log(b[2]), f)) };
    };

    // ---------------------------------------------------------------- hora do dia
    const HS = [
      [0, 3.4], [tAbuna[0], 3.9], [tTeitei[0], 4.4], [tKedi + 3, 6.3], [tPaiPt, 6.7], [tPao, 8.4], [tLachma, 10.6], [tYomana, 12.0], [tAbuna[1], 12.6],
      [tTent - 6, 14.6], [tReino[0], 15.4], [tAbuna[2], 16.2], [tDilach - 4.6, 17.2], [tDilach, 17.6], [tAbuna[3], 18.9], [tTerra[3], 20.2],
      [tAbuna[4], 21.4], [dur + 1, 23.4],
    ];
    const horaEm = (t) => {
      let i = 0; while (i < HS.length - 2 && HS[i + 1][0] <= t) i++;
      const [a, ha] = HS[i], [b, hb] = HS[i + 1];
      return lerp(ha, hb, ease.inOutSine(clamp((t - a) / Math.max(1e-6, b - a))));
    };

    // ---------------------------------------------------------------- o Reino que vem: feixes de luz e o nível do Reino na terra
    const FEIXES = [
      [tTeitei[0], () => [770, TETO]], [tVenha[0], () => [980, 905]], [tTerra[0], () => [1150, 905]],
      [tTeitei[1], () => [2300, 905]], [tTeitei[2], () => [2620, 905]], [tVenha[1], () => [2420, 905]], [tVenha[2], () => [2560, 905]],
      [tTeitei[3], () => [3300, solo(3300)]], [tTeitei[4], () => [3700, solo(3700)]], [tVenha[3], () => [3480, solo(3480)]], [tVenha[4], () => [3580, solo(3580)]],
    ];
    const ONDAS = FEIXES.slice(1).map(([t0, alvo]) => [t0 + 0.6, alvo]).concat([[tTerra[1], () => [2480, 905]], [tTerra[2], () => [3500, solo(3500)]]]);
    const reinoEm = (t) => { let r = 0; for (const [t0] of FEIXES) r += 0.1 * smooth(t0, t0 + 1.6, t); return clamp(r); };

    // ---------------------------------------------------------------- personagens: trilhas (tempo, x, y opcional; 'salto' = troca fora de cena)
    function trilha(keys) {
      const ks = keys.map((k) => ({ t: k[0], x: k[1], y: k[2] === undefined ? null : k[2], salto: k[3] === 'salto' }));
      return (t) => {
        if (t <= ks[0].t) return { x: ks[0].x, y: ks[0].y === null ? solo(ks[0].x) : ks[0].y, v: 0 };
        let i = 0; while (i < ks.length - 2 && ks[i + 1].t <= t) i++;
        const a = ks[i], b = ks[i + 1];
        if (t >= b.t) return { x: b.x, y: b.y === null ? solo(b.x) : b.y, v: 0 };
        if (b.salto) return { x: a.x, y: a.y === null ? solo(a.x) : a.y, v: 0 };
        const span = b.t - a.t, u = (t - a.t) / span, e = u * u * (3 - 2 * u), x = lerp(a.x, b.x, e);
        const y = (a.y === null && b.y === null) ? solo(x) : lerp(a.y === null ? solo(a.x) : a.y, b.y === null ? solo(b.x) : b.y, e);
        return { x, y, v: (b.x - a.x) * 6 * u * (1 - u) / span };
      };
    }
    const tC = () => tAbuna[3] + 2.2;                                               // troca para a margem (fora de cena, no meio do voo da câmera)
    const SALTO1 = tReino[0] + 7;                                                     // mãe e vizinhos vão para o pé do monte (fora de cena)
    const PAI = trilha([[0, 735, TETO], [tPaiPt + 1.7, 735, TETO], [tPaiPt + 3.3, 860, TETO], [tPaiPt + 6.3, 1034, BASE(1034)], [tPaiPt + 7.5, 1100], [tVontade[0] + 0.2, 1240],
      [tPao2 + 0.6, 1240], [tPerdoa - 0.1, 1505], [tDevem - 0.3, 1505], [tDevem + 0.4, 1534], [tDevem + 3.9, 1534], [tLachma + 1.3, 1215],
      [tAbuna[1] - 2.4, 1215], [tAbuna[1] + 11.5, 2280], [tComoCeus + 6.4, 2280], [tTent - 0.3, 2990], [tConduz - 0.2, 2990], [tGloria[0] - 0.6, 3560],
      [tC(), 3560], [tC() + 0.01, 1110, null, 'salto'], [dur + 5, 1110]]);
    const MENINA = trilha([[0, 792, TETO], [tPaiPt + 1.9, 792, TETO], [tPaiPt + 3.1, 868, TETO], [tPaiPt + 5.9, 1034, BASE(1034)], [tPaiPt + 6.9, 1090], [tVontade[0] - 0.5, 1182],
      [tPao2 + 0.4, 1182], [tPerdoa - 0.5, 1300], [tLachma - 1.2, 1300], [tLachma + 0.4, 1265], [tAbuna[1] - 2.2, 1265], [tAbuna[1] + 6.0, 2320],
      [tVenha[1] - 2.8, 2480], [tVenha[1] + 0.6, 2380], [tVenha[2] + 1.2, 2520], [tTerra[1] - 0.4, 2450], [tComoCeus + 4.0, 2450], [tComoCeus + 6.4, 2335],
      [tTent - 0.3, 3045], [tTent + 0.9, 3045], [tTent + 1.8, 3080], [tLivra - 0.4, 3080], [tLivra + 0.7, 3045], [tConduz - 0.2, 3045], [tGloria[0] - 0.6, 3615],
      [tC(), 3615], [tC() + 0.01, 1165, null, 'salto'], [dur + 5, 1165]]);
    const MAE = trilha([[0, 719, BASE(719)], [tPaiPt + 4.2, 719, BASE(719)], [tPaiPt + 6.2, 790], [tVontade[0] + 0.6, 1066], [tLachma - 1.2, 1066], [tLachma + 0.3, 1150],
      [SALTO1, 1150], [SALTO1 + 0.01, 2600, null, 'salto'], [tAbuna[2] - 0.5, 2600], [tAbuna[2] + 12.5, 3470], [tC(), 3470], [tC() + 0.01, 1040, null, 'salto'], [dur + 5, 1040]]);
    const VIZINHO = trilha([[0, 1802, BASE(1802)], [tPerdoamos - 1.8, 1802, BASE(1802)], [tPerdoamos - 0.8, 1700], [tPerdoamos + 0.2, 1590], [tDevem - 0.3, 1590], [tDevem + 0.4, 1574],
      [tDevem + 4.4, 1574], [tLachma + 0.3, 1440], [SALTO1, 1440], [SALTO1 + 0.01, 2520, null, 'salto'], [tAbuna[2] + 0.5, 2520], [tAbuna[2] + 13.5, 3380],
      [tC(), 3380], [tC() + 0.01, 1262, null, 'salto'], [dur + 5, 1262]]);
    const MENINO = trilha([[0, 1802, BASE(1802)], [tDevem + 1.8, 1802, BASE(1802)], [tDevem + 2.8, 1740], [tLachma + 0.3, 1382], [tAbuna[1] - 2.2, 1382], [tAbuna[1] + 6.4, 2420],
      [tVenha[1] - 2.4, 2300], [tVenha[1] + 1.0, 2560], [tVenha[2] + 1.6, 2400], [tTerra[1] - 0.2, 2560], [tComoCeus + 4.5, 2560], [tTent - 0.5, 1900], [SALTO1, 1900], [SALTO1 + 0.01, 2460, null, 'salto'],
      [tAbuna[2] + 1.0, 2460], [tAbuna[2] + 13.0, 3330], [tC(), 3330], [tC() + 0.01, 1318, null, 'salto'], [dur + 5, 1318]]);
    const mov = (p, padrao) => (p.v > 6 ? 1 : p.v < -6 ? -1 : padrao);

    // aldeões: de manhã passando, no campo colhendo, e à noite na margem com lanternas
    const ALDEOES_MANHA = [
      { tr: trilha([[0, 1290], [tVenha[0] + 1, 1290], [tPao - 2, 1900]]), cor: H('#f6d3e6'), veu: true, manto: H('#e6dcf6'), dy: -46, s: 0.6, seg: 'cesto', ap: [tPaiPt + 3, tPerdoa - 1] },
      { tr: trilha([[0, 1960], [tVontade[0], 1960], [tPao - 1, 1660]]), cor: H('#d6e6c9'), barba: true, dy: -40, s: 0.6, ap: [tPaiPt + 4, tPao2 + 1] },
    ];
    const ALDEOES_CAMPO = [[2180, -46, H('#f3d9c4'), true], [2700, -52, H('#d9d2f3'), false], [2820, -40, H('#cfe9dc'), true]];
    const ALDEOES_NOITE = Array.from({ length: 10 }, (_, i) => {
      const r = mulberry32(700 + i);
      const fila = i % 2, x = 880 + i * 62 + (r() - 0.5) * 18;
      return { x, dy: fila ? -44 : -18, s: fila ? 0.58 : 0.64, cor: ml(H(['#f6d3e6', '#d6e6c9', '#d9d2f3', '#ffe1c2', '#cfe1fb'][i % 5]), H('#ffffff'), r() * 0.2),
        veu: r() < 0.5, barba: r() < 0.5, dir: r() < 0.5 ? 1 : -1, grupo: i < 3 ? 0 : i < 6 ? 1 : i < 8 ? 2 : 3, sem: i };
    });

    // ---------------------------------------------------------------- casas, árvores e objetos do mundo
    const CASAS = [
      { x: 190, w: 180, h: 150, cor: H('#e9e3f7'), janelas: 2 }, { x: 440, w: 200, h: 172, cor: H('#fff1e2'), cupula: true, vasos: true },
      { x: 760, w: 230, h: 190, cor: H('#fbe9dc'), escada: 1, vasos: true }, { x: 1840, w: 210, h: 168, cor: H('#e3f1ea'), porta: 'madeira', vasos: true },
    ];
    const ARVORES = [[300, 'cipreste', 1.0, -40], [610, 'oliveira', 0.9, -50], [990, 'cipreste', 0.9, -48], [1290, 'oliveira', 1.15, -54], [1985, 'palmeira', 0.95, -34],
      [2040, 'cipreste', 0.85, -50], [2930, 'cipreste', 1.0, -52], [2985, 'cipreste', 0.8, -48], [3740, 'oliveira', 1.25, -40], [4050, 'cipreste', 0.9, -40]];
    const XFORNO = 1120, XMESA = 1322, XPOCO = 1560, XMATA = [3090, 3290];

    // ---------------------------------------------------------------- céu
    function ceuFundo(ctx, S) {
      const c = S.ceu, g = ctx.createLinearGradient(0, 0, 0, ALT * 0.72);
      g.addColorStop(0, css(c.top)); g.addColorStop(0.55, css(c.mid)); g.addColorStop(1, css(c.hor));
      ctx.fillStyle = g; ctx.fillRect(-40, -40, S.W + 80, ALT + 80);
    }
    const rE = mulberry32(57);
    const ESTRELAS = Array.from({ length: Math.round(110 + W * 0.12) }, () => ({ u: rE(), v: Math.pow(rE(), 1.2), r: 0.7 + Math.pow(rE(), 3) * 2.2, w: 0.7 + rE() * 2.4, f: rE() * TAU }));
    function estrelas(ctx, S) {
      const n = Math.max(S.noite, 0.9 * win(tLealam[0] - 0.5, tLealam[0] + 2, tAbuna[3], tAbuna[3] + 3, S.tl) * 0.6);
      if (n < 0.03) return;
      const brilhoAbuna = 1 + 0.5 * pulso(tAbuna[0], 0.8, 3, S.tl);
      for (const e of ESTRELAS) {
        const y = e.v * HORSKY * 0.92, tw = 0.55 + 0.45 * Math.sin(S.t * e.w + e.f);
        const a = Math.min(1, n * tw * clamp((HORSKY - y) / 200) * brilhoAbuna);
        if (a < 0.03) continue;
        ctx.fillStyle = css(K.luz, a);
        if (e.r > 2) brilho4(ctx, e.u * S.W, y, e.r * 3); else { ctx.beginPath(); ctx.arc(e.u * S.W, y, e.r, 0, TAU); ctx.fill(); }
      }
      // estrelas cadentes no começo e no fim
      for (const [t0, x0, y0] of [[5.5, 0.18, 0.12], [13.6, 0.64, 0.08], [tAmen[6] + 7, 0.3, 0.1], [tAmen[6] + 11.5, 0.7, 0.14]]) {
        const u = (S.tl - t0) / 1.2;
        if (u < 0 || u > 1) continue;
        const x = S.W * x0 + 300 * u, y = ALT * y0 + 120 * u;
        const g = ctx.createLinearGradient(x - 100, y - 40, x, y);
        g.addColorStop(0, css(K.luz, 0)); g.addColorStop(1, css(K.luz, 0.9 * Math.sin(Math.PI * u) * n));
        ctx.strokeStyle = g; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 100, y - 40); ctx.lineTo(x, y); ctx.stroke();
      }
    }
    function corpoCeleste(ctx, S) {
      const h = mod(S.hora, 24), W = S.W;
      const aS = Math.PI * (h - 6) / 12, altS = Math.sin(aS);
      S.sol = { x: W * (0.5 - Math.cos(aS) * 0.44), y: HORSKY - altS * 0.6 * ALT, alt: altS };
      if (altS > -0.2) {
        const baixo = 1 - clamp(altS * 2.4), r = 46 * (1 + 0.25 * baixo), quente = ml(K.creme, H('#ffb98f'), baixo * 0.9);
        const f = clamp((altS + 0.2) / 0.3) * (1 - 0.8 * S.tempestade);
        brilhoRadial(ctx, S.sol.x, S.sol.y, 600, quente, 0.42 * f);
        brilhoRadial(ctx, S.sol.x, S.sol.y, 240, K.creme, 0.5 * f);
        const g = ctx.createRadialGradient(S.sol.x - r * 0.25, S.sol.y - r * 0.25, r * 0.1, S.sol.x, S.sol.y, r);
        g.addColorStop(0, css(K.luz, f)); g.addColorStop(0.7, css(K.creme, f)); g.addColorStop(1, css(quente, 0.9 * f));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(S.sol.x, S.sol.y, r, 0, TAU); ctx.fill();
      }
      const aL = Math.PI * mod(h - 18.5, 24) / 12, altL = Math.sin(aL);
      S.lua = { x: W * (0.5 - Math.cos(aL) * 0.42), y: HORSKY - altL * 0.55 * ALT, alt: altL };
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
    const rN = mulberry32(91);
    const NUVENS = Array.from({ length: Math.round(8 + W / 180) }, () => ({ x0: rN() * (W + 800), y: (0.04 + rN() * 0.42) * ALT, w: 150 + rN() * 240, h: 0.18 + rN() * 0.16, v: 3 + rN() * 7, a: 0.3 + rN() * 0.36, tom: rN() }));
    function nuvens(ctx, S) {
      const per = S.W + 800;
      for (const n of NUVENS) {
        const x = mod(n.x0 - S.t * n.v - S.cam.x * 0.03, per) - 400;
        let col = ml(K.luz, S.ceu.mid, 0.25 + 0.4 * S.noite);
        col = ml(col, K.rosa, n.tom * 0.3 * (1 - S.noite));
        col = ml(col, H('#8f8ab4'), 0.6 * S.tempestade);
        const a = n.a * (1 - 0.4 * S.noite) * (1 + S.tempestade);
        ctx.save(); ctx.translate(x, n.y); ctx.scale(1, n.h);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, n.w);
        g.addColorStop(0, css(col, Math.min(1, a))); g.addColorStop(0.5, css(col, Math.min(1, a) * 0.55)); g.addColorStop(1, css(col, 0));
        ctx.fillStyle = g; ctx.fillRect(-n.w, -n.w, n.w * 2, n.w * 2);
        ctx.restore();
      }
    }
    function raios(ctx, S, extra) {
      if (!S.sol || S.sol.alt < -0.05) return;
      const f = (clamp(1 - Math.abs(S.sol.alt - 0.2) * 1.6) * (0.4 + 0.6 * S.A.energia) + extra) * (1 - S.tempestade);
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
    // tempestade (tentação): nuvens escuras, chuva e relâmpagos suaves
    function tempestade(ctx, S) {
      const e = S.tempestade;
      if (e < 0.01) return;
      const cor = H('#7d7aa6');
      for (let i = 0; i < 16; i++) {
        const x = mod(hash1(i * 5.3) * (S.W + 600) - S.t * (8 + 6 * hash1(i)), S.W + 600) - 300, y = (0.02 + 0.3 * hash1(i * 2.7)) * ALT - (1 - e) * 260;
        const r = 160 + 140 * hash1(i * 9.1);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, css(ml(cor, H('#5f5c88'), hash1(i)), 0.85 * e)); g.addColorStop(1, css(cor, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, r * 1.5, r * 0.75, 0, 0, TAU); ctx.fill();
      }
      const chuva = e * (1 - smooth(tLivra, tLivra + 2, S.tl));
      if (chuva > 0.02) {
        ctx.strokeStyle = css(H('#e6e8ff'), 0.35 * chuva); ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (let i = 0; i < 160; i++) {
          const x = mod(hash1(i * 3.7) * (S.W + 200) + S.t * 120, S.W + 200) - 100, y = mod(hash1(i * 7.9) * ALT + S.t * 900, ALT + 60) - 40;
          ctx.moveTo(x, y); ctx.lineTo(x - 8, y + 26);
        }
        ctx.stroke();
      }
    }
    function relampago(S) {
      let f = 0;
      for (const t0 of [tTent + 1.1, tTent + 2.4, tNisyona + 1.0]) { const u = S.tl - t0; if (u > 0 && u < 0.5) f = Math.max(f, (u < 0.08 ? u / 0.08 : 1 - (u - 0.08) / 0.42) * (t0 > tNisyona ? 0.25 : 0.5)); }
      return f;
    }
    // arco-íris depois da tempestade
    function arcoIris(ctx, S) {
      const a = win(tBisha + 0.3, tBisha + 3, tAbuna[2] + 14, tAbuna[2] + 20, S.tl);
      if (a < 0.01) return;
      const cx = S.W * 0.62, cy = ALT * 0.78, r0 = 620;
      const cores = ['#f7b8c8', '#ffd4a8', '#fff1b0', '#c9efd2', '#bfe1ff', '#d7cdf7'];
      ctx.save(); ctx.globalAlpha *= 0.55 * a; ctx.lineWidth = 16;
      cores.forEach((c, i) => { ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(cx, cy, r0 - i * 15, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke(); });
      ctx.restore();
    }

    // ---------------------------------------------------------------- camadas de fundo (paralaxe): montanhas, o Templo e o lago
    // o Templo fica na mesma camada do lago (mesma paralaxe e mesmo zoom), para o reflexo acompanhá-lo em qualquer movimento de câmera
    const P_LAGO = 0.05;                                                       // o Templo fica longe: anda pouco com a câmera
    const telaFundo = (S, p, X, Y) => {                                        // de coordenadas de uma camada de fundo para a tela
      const c = S.cam, zb = 1 + (c.z - 1) * p, ox = (c.x - S.W / 2) * p, oy = (c.y - ALT / 2) * p;
      return [(X - S.W / 2 - ox) * zb + S.W / 2, (Y - ALT / 2 - oy) * zb + ALT / 2, zb];
    };
    function fundo(ctx, S, p, desenha) {
      const c = S.cam, zb = 1 + (c.z - 1) * p, ox = (c.x - S.W / 2) * p, oy = (c.y - ALT / 2) * p;
      ctx.save(); ctx.translate(S.W / 2, ALT / 2); ctx.scale(zb, zb); ctx.translate(-S.W / 2 - ox, -ALT / 2 - oy);
      desenha(ox + S.W / 2 - S.W / (2 * zb) - 20, ox + S.W / 2 + S.W / (2 * zb) + 20, zb, ox, oy);
      ctx.restore();
    }
    function luzObj(S, cor, k) {
      const c = typeof cor === 'string' ? H(cor) : cor;
      return ml(ml(c, S.ceu.mid, S.noite * 0.5 * (k || 1)), S.ceu.hor, 0.1 * (k || 1) * (1 - S.noite));
    }
    const yMont = (X) => 652 - (34 + 26 * Math.sin(X * 0.0021 + 1.3) + 14 * Math.sin(X * 0.0057 + 0.4) + 6 * Math.sin(X * 0.017));
    function montanhas(ctx, S, x0, x1) {
      const topo = luzObj(S, ml(H('#c7c3ee'), S.ceu.hor, 0.35), 1), pe = luzObj(S, ml(H('#b7c9ec'), S.ceu.mid, 0.4), 1);
      ctx.beginPath(); ctx.moveTo(x0, 700);
      for (let X = x0; X <= x1; X += 8) ctx.lineTo(X, yMont(X));
      ctx.lineTo(x1, 700); ctx.closePath();
      const g = ctx.createLinearGradient(0, 560, 0, 660); g.addColorStop(0, css(topo)); g.addColorStop(1, css(pe));
      ctx.fillStyle = g; ctx.fill();
      // aldeias da outra margem: luzinhas à noite
      if (S.noite > 0.05) for (let i = 0; i < 26; i++) {
        const X = x0 + mod(hash1(i * 4.1) * 3000, x1 - x0), Y = 640 + hash1(i * 2.2) * 10;
        brilhoRadial(ctx, X, Y, 6, K.luzOuro, 0.8 * S.noite * (0.6 + 0.4 * Math.sin(S.t * 2 + i)));
      }
    }
    const TEMPLO_X = () => W * 0.78, TEMPLO_Y = 652, TEMPLO_S = 0.6;            // base do Templo na linha d'água do lago
    function temploAlfa(S) {
      const a = smooth(tTeitei[0] - 0.4, tTeitei[0] + 2.2, S.tl) * (1 - 0.85 * S.tempestade);
      return a * (0.9 + 0.1 * S.reino) * (1 - 0.2 * S.noite);
    }
    function temploBrilho(S) {
      let b = 0.2 * S.reino;
      for (const [t0] of FEIXES) b = Math.max(b, pulso(t0, 0.5, 2.6, S.tl));
      for (const t0 of [...tReino, tDilach]) b = Math.max(b, pulso(t0, 0.6, 3, S.tl));
      return clamp(b);
    }
    function lago(ctx, S, x0, x1) {
      const yA = 652, c = S.ceu;
      const g = ctx.createLinearGradient(0, yA, 0, yA + 110);
      g.addColorStop(0, css(ml(ml(c.hor, H('#bfe6ee'), 0.45), K.luz, 0.1))); g.addColorStop(0.5, css(ml(c.mid, H('#a9dbe6'), 0.5))); g.addColorStop(1, css(ml(c.top, H('#9fcfe0'), 0.55)));
      ctx.fillStyle = g; ctx.fillRect(x0, yA, x1 - x0, 1000);
      ctx.save(); ctx.beginPath(); ctx.rect(x0, yA, x1 - x0, 1000); ctx.clip();
      // reflexo do Templo, espelhado exatamente na linha d'água (mais forte nos gatilhos `kedi`, `terra` e `comoceus`)
      const ca = temploAlfa(S);
      if (ca > 0.02) {
        const refl = 0.3 + 0.45 * Math.max(pulso(tKedi, 1, 6, S.tl), ...tTerra.map((t0) => pulso(t0, 1.2, 7, S.tl)), pulso(tComoCeus, 1, 6, S.tl));
        ctx.save(); ctx.translate(0, 2 * yA); ctx.scale(1, -1); ctx.globalAlpha *= refl;
        R.templo(ctx, TEMPLO_X(), TEMPLO_Y, TEMPLO_S, { t: S.t, brilho: temploBrilho(S), noite: S.noite, alfa: ca });
        ctx.restore();
      }
      // reflexos do sol, da lua e das estrelas
      if (S.sol && S.sol.alt > -0.05) {
        ctx.fillStyle = css(K.luz, 0.65 * (1 - S.noite) * (1 - S.tempestade));
        for (let i = 0; i < 26; i++) { const tw = Math.max(0, Math.sin(S.t * (1.4 + hash1(i) * 2) + i)); ctx.fillRect(S.sol.x + (hash1(i * 3.1) - 0.5) * (120 + 140 * hash1(i * 1.3)), yA + 6 + hash1(i * 7.3) * 90, 6 + 18 * tw, 1.8); }
      }
      if (S.noite > 0.05) {
        ctx.fillStyle = css(H('#eef0ff'), 0.6 * S.noite);
        if (S.lua && S.lua.alt > -0.05) for (let i = 0; i < 18; i++) { const tw = Math.max(0, Math.sin(S.t * (1.2 + hash1(i) * 2) + i)); ctx.fillRect(S.lua.x + (hash1(i * 3.1) - 0.5) * 80, yA + 6 + hash1(i * 7.3) * 80, 4 + 12 * tw, 1.6); }
        for (let i = 0; i < 70; i++) {
          const e = ESTRELAS[i], y = yA + (HORSKY * 0.92 * e.v) * 0.18 + 4;
          ctx.fillStyle = css(K.luz, 0.4 * S.noite * (0.5 + 0.5 * Math.sin(S.t * e.w + e.f)));
          ctx.fillRect(e.u * S.W - 2, y, 4, 1.2);
        }
      }
      ctx.strokeStyle = css(K.luz, 0.35); ctx.lineWidth = 1.4;                           // marolas
      for (let i = 0; i < 7; i++) {
        const y = yA + 10 + i * 14 + i * i, ph = S.t * 0.5 + i * 1.7;
        ctx.beginPath(); for (let X = x0; X <= x1; X += 14) { const yy = y + Math.sin(X * 0.025 + ph) * 1.4; X === x0 ? ctx.moveTo(X, yy) : ctx.lineTo(X, yy); } ctx.stroke();
      }
      ctx.restore();
    }

    // ---------------------------------------------------------------- feixes de luz do Reino, do alto até a terra (em coordenadas da tela)
    const paraTela = (S, x, y) => [(x - S.cam.x) * S.cam.z + S.W / 2, (y - S.cam.y) * S.cam.z + ALT / 2];
    function feixes(ctx, S) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const [t0, alvo] of FEIXES) {
        const a = win(t0 - 0.2, t0 + 0.5, t0 + 1.8, t0 + 3.4, S.tl) * (1 - S.tempestade);
        if (a < 0.01) continue;
        const [wx, wy] = alvo(), [tx, ty] = paraTela(S, wx, wy);
        feixe(ctx, tx + 70, -60, tx, ty, 120, a * smooth(t0 - 0.2, t0 + 0.6, S.tl));
        ctx.fillStyle = css(K.luz, 0.9 * a);
        for (let i = 0; i < 14; i++) { const u = mod(S.t * 0.35 + i / 14, 1); brilho4(ctx, lerp(tx + 70, tx, u) + Math.sin(i * 2.1 + S.t) * 50 * u, lerp(-60, ty, u), 2 + 3 * Math.sin(Math.PI * u)); }
      }
      ctx.restore();
    }
    // um feixe de luz de bordas suaves, do alto (x0, y0) até o chão (x1, y1)
    function feixe(ctx, x0, y0, x1, y1, larg, a, halo) {
      if (a < 0.01) return;
      const ang = Math.atan2(x1 - x0, y1 - y0), L = Math.hypot(x1 - x0, y1 - y0);
      ctx.save(); ctx.translate(x0, y0); ctx.rotate(-ang);
      for (const [k, al] of [[1, 0.16], [0.5, 0.2]]) {
        const w0 = larg * 0.35 * k, w1 = larg * k;
        const g = ctx.createLinearGradient(-w1, 0, w1, 0);
        g.addColorStop(0, css(K.luzOuro, 0)); g.addColorStop(0.5, css(K.luz, al * a)); g.addColorStop(1, css(K.luzOuro, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-w0, 0); ctx.lineTo(w0, 0); ctx.lineTo(w1, L); ctx.lineTo(-w1, L); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      brilhoRadial(ctx, x1, y1 - 30, larg * 1.1, K.luzOuro, (halo === undefined ? 0.3 : halo) * a);
    }
    // coroa de luz, rajada de raios, anel que se abre e chuva dourada (tela)
    function gloria(ctx, S) {
      const tl = S.tl;
      const [cx, base, zb] = telaFundo(S, P_LAGO, TEMPLO_X(), TEMPLO_Y), alto = 284 * TEMPLO_S * zb;   // topo do Santuário na tela
      const cy = base - alto - 46 * zb;
      let coroa = 0;
      for (const t0 of [tReino[0], tDilach, tReino[1], tReino[2]]) coroa = Math.max(coroa, win(t0 - 0.2, t0 + 1.0, t0 + 5.5, t0 + 7.5, tl));
      coroa = Math.max(coroa, 0.85 * win(tDilach - 0.2, tDilach + 1, tAbuna[3] - 2, tAbuna[3] + 1, tl));
      if (coroa > 0.01) {
        ctx.save(); ctx.translate(cx, cy + 20 * (1 - coroa)); ctx.scale(0.6 * zb, 0.6 * zb); ctx.globalAlpha *= coroa;
        brilhoRadial(ctx, 0, 0, 260, K.luzOuro, 0.55);
        ctx.strokeStyle = css(K.ouroForte); ctx.fillStyle = css(K.luzOuro, 0.55); ctx.lineWidth = 5; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(-90, 40);
        const picos = [[-90, -30], [-60, 10], [-30, -50], [0, 0], [30, -50], [60, 10], [90, -30]];
        for (const [px, py] of picos) ctx.lineTo(px, py);
        ctx.lineTo(90, 40); ctx.closePath(); ctx.fill(); ctx.stroke();
        for (const [px, py] of [[-90, -30], [-30, -50], [30, -50], [90, -30]]) { ctx.fillStyle = css(K.luz); ctx.beginPath(); ctx.arc(px, py - 6, 7, 0, TAU); ctx.fill(); }
        ctx.fillStyle = css(K.rosa); ctx.beginPath(); ctx.arc(0, 20, 9, 0, TAU); ctx.fill();
        ctx.fillStyle = css(H('#bfe1ff')); ctx.beginPath(); ctx.arc(-46, 22, 6, 0, TAU); ctx.arc(46, 22, 6, 0, TAU); ctx.fill();
        ctx.restore();
      }
      // poder: rajada de raios a partir do Santuário
      let poder = 0;
      for (const t0 of [...tPoder, tChayla]) poder = Math.max(poder, win(t0 - 0.1, t0 + 0.5, t0 + 2.0, t0 + 3.6, tl));
      if (poder > 0.01) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(cx, base - alto * 0.6);
        for (let i = 0; i < 18; i++) {
          const a = (i / 18) * TAU + tl * 0.05, L = 900 * (0.6 + 0.4 * poder);
          const g = ctx.createLinearGradient(0, 0, L, 0); g.addColorStop(0, css(K.luzOuro, 0.22 * poder)); g.addColorStop(1, css(K.luzOuro, 0));
          ctx.save(); ctx.rotate(a); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(L, -L * 0.035); ctx.lineTo(L, L * 0.035); ctx.closePath(); ctx.fill(); ctx.restore();
        }
        ctx.restore();
      }
      // glória: chuva de luz dourada
      let gl = 0;
      for (const t0 of tGloria) gl = Math.max(gl, win(t0 - 0.1, t0 + 0.6, t0 + 3.0, t0 + 5.0, tl));
      gl = Math.max(gl, 0.6 * win(tChayla - 0.1, tChayla + 0.8, tChayla + 2.6, tChayla + 4, tl));
      if (gl > 0.01) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 70; i++) {
          const x = hash1(i * 3.3) * S.W + Math.sin(tl + i) * 20, y = mod(hash1(i * 7.1) * ALT + tl * (40 + 50 * hash1(i * 2.2)), ALT);
          brilhoRadial(ctx, x, y, 5 + 6 * hash1(i * 1.7), K.luzOuro, 0.8 * gl * (0.5 + 0.5 * Math.sin(tl * 4 + i)));
        }
        ctx.restore();
      }
      // para sempre: anel que se abre
      for (const t0 of [...tSempre, tLealam[0]]) {
        const u = (tl - t0) / 4.5;
        if (u < 0 || u > 1) continue;
        ctx.strokeStyle = css(K.luzOuro, 0.7 * (1 - u)); ctx.lineWidth = 4;
        for (let k = 0; k < 3; k++) { const v = u - k * 0.1; if (v <= 0) continue; ctx.beginPath(); ctx.ellipse(cx, base - alto * 0.6, 80 + 1200 * v, 30 + 420 * v, 0, 0, TAU); ctx.stroke(); }
      }
    }

    // ---------------------------------------------------------------- chão do mundo, caminho, relva, trigo
    function chao(ctx, S, x0, x1) {
      const g = ctx.createLinearGradient(0, 760, 0, 1000);
      g.addColorStop(0, css(luzObj(S, ml(H('#c6edd7'), K.luzOuro, 0.15 * S.reino), 1))); g.addColorStop(1, css(luzObj(S, '#a8dcc0', 1)));
      ctx.beginPath(); ctx.moveTo(x0, 1700);
      for (let x = x0; x <= x1; x += 8) ctx.lineTo(x, borda(x));
      ctx.lineTo(x1, 1700); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = css(K.luz, 0.35 * (1 - S.noite * 0.6)); ctx.lineWidth = 2.5; ctx.beginPath();
      for (let x = x0; x <= x1; x += 8) x === x0 ? ctx.moveTo(x, borda(x)) : ctx.lineTo(x, borda(x));
      ctx.stroke();
      // caminho de terra clara
      ctx.beginPath();
      for (let x = x0; x <= x1; x += 8) { const y = solo(x) - 14 + Math.sin(x * 0.013) * 2; x === x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      for (let x = x1; x >= x0; x -= 8) ctx.lineTo(x, solo(x) + 30 + Math.sin(x * 0.011) * 3);
      ctx.closePath();
      const gp = ctx.createLinearGradient(0, 880, 0, 940);
      gp.addColorStop(0, css(luzObj(S, '#f6eadb', 0.9))); gp.addColorStop(1, css(luzObj(S, '#ecd8c3', 0.9)));
      ctx.fillStyle = gp; ctx.fill();
    }
    const FLORES = ['#f7c6d2', '#fff1d6', '#e2dcf6', '#ffd9b8', '#fbe2ef', '#cfe9ff'].map(H);
    function relva(ctx, S, x0, x1, frente) {
      const CEL = 30, reino = S.reino;
      for (let c = Math.floor(x0 / CEL); c <= Math.floor(x1 / CEL); c++) {
        const h1 = hash1(c * 2.13 + (frente ? 7 : 3)), h2 = hash1(c * 7.77 + 1), h3 = hash1(c * 4.9 + 9);
        const sx = c * CEL + h1 * CEL;
        if (!frente && sx > 2040 && sx < 2880) continue;                                          // no campo, o trigo
        const y0 = frente ? solo(sx) + 40 + h3 * 110 : lerp(borda(sx) + 8, solo(sx) - 20, h3);
        const esc = frente ? 0.9 + 0.5 * h3 : 0.6 + 0.3 * h3;
        ctx.lineCap = 'round';
        const n = 3 + Math.floor(h1 * 3);
        for (let i = 0; i < n; i++) {
          const alt = (12 + hash1(c * 3.3 + i) * 18) * esc, lean = (i - (n - 1) / 2) * 5 * esc + Math.sin(S.t * 1.3 + c * 0.7 + i) * 2.5 * (alt / 26) + S.vento * 6;
          ctx.strokeStyle = css(luzObj(S, i % 2 ? '#8fd3ae' : '#aee3c4', 0.9)); ctx.lineWidth = 2.4 * esc;
          ctx.beginPath(); ctx.moveTo(sx + (i - n / 2) * 3 * esc, y0); ctx.quadraticCurveTo(sx + lean * 0.5, y0 - alt * 0.6, sx + lean, y0 - alt); ctx.stroke();
        }
        if (h2 > 0.78 - 0.4 * reino) {                                                            // flores: mais flores conforme o Reino vem
          const hf = (16 + 16 * h1) * esc, cor = FLORES[Math.floor(h3 * FLORES.length)], bal = Math.sin(S.t * 1.6 + c * 4) * 2 * esc + S.vento * 5;
          ctx.strokeStyle = css(luzObj(S, '#8fd3ae', 0.9)); ctx.lineWidth = 1.8 * esc; ctx.beginPath(); ctx.moveTo(sx + 6, y0); ctx.quadraticCurveTo(sx + 6 + bal * 0.4, y0 - hf * 0.5, sx + 6 + bal, y0 - hf); ctx.stroke();
          ctx.fillStyle = css(luzObj(S, cor, 0.7));
          for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU + c; ctx.beginPath(); ctx.arc(sx + 6 + bal + Math.cos(a) * 4 * esc, y0 - hf + Math.sin(a) * 4 * esc, 3 * esc, 0, TAU); ctx.fill(); }
          ctx.fillStyle = css(K.ouro); ctx.beginPath(); ctx.arc(sx + 6 + bal, y0 - hf, 2 * esc, 0, TAU); ctx.fill();
        }
      }
    }
    function trigo(ctx, S, x0, x1, frente) {
      const a0 = Math.max(x0, 2050), a1 = Math.min(x1, 2870);
      if (a1 <= a0) return;
      const cresce = 0.45 + 0.55 * smooth(tTeitei[1] - 0.2, tVenha[2] + 2, S.tl), dour = smooth(tTeitei[1], tTerra[1], S.tl);
      const verde = luzObj(S, '#b9dfa6', 0.9), ouro = luzObj(S, '#f6d48e', 0.9), espiga = ml(verde, luzObj(S, '#f0c46c', 0.9), dour);
      const filas = frente ? [[solo(0) + 34, 1.15]] : [[0.15, 0.62], [0.4, 0.75], [0.66, 0.88], [0.9, 1.0]];
      ctx.lineCap = 'round';
      for (const [fy, esc] of filas) {
        for (let x = Math.floor(a0 / 9) * 9; x <= a1; x += 9) {
          const h = hash1(x * 0.37 + fy * 11);
          if (frente && h < 0.45) continue;
          const xx = x + h * 6, y0 = frente ? fy + h * 8 : lerp(borda(xx) + 6, solo(xx) - 16, fy);
          const ondas = ONDAS.reduce((m, [t0, alvo]) => { const d = Math.abs(xx - alvo()[0]), u = (S.tl - t0) * 420 - d; return u > 0 && u < 260 ? Math.max(m, Math.sin(Math.PI * u / 260)) : m; }, 0);
          const alt = (40 + 22 * h) * esc * cresce, bal = Math.sin(S.t * 1.6 + xx * 0.03) * 4 * esc + S.vento * 9 * esc + ondas * 8;
          ctx.strokeStyle = css(ml(verde, ouro, dour * 0.8)); ctx.lineWidth = 2 * esc;
          ctx.beginPath(); ctx.moveTo(xx, y0); ctx.quadraticCurveTo(xx + bal * 0.3, y0 - alt * 0.6, xx + bal, y0 - alt); ctx.stroke();
          ctx.fillStyle = css(ml(espiga, K.luz, ondas * 0.6));
          ctx.beginPath(); ctx.ellipse(xx + bal, y0 - alt - 6 * esc, 3 * esc, 8 * esc, bal * 0.03, 0, TAU); ctx.fill();
        }
      }
    }
    // ondas de luz pelo chão quando o Reino vem
    function ondasChao(ctx, S) {
      for (const [t0, alvo] of ONDAS) {
        const u = (S.tl - t0) / 3.0;
        if (u < 0 || u > 1) continue;
        const [x, y] = alvo();
        ctx.strokeStyle = css(K.luzOuro, 0.75 * (1 - u)); ctx.lineWidth = 4;
        for (let k = 0; k < 2; k++) { const v = u - k * 0.12; if (v <= 0) continue; ctx.beginPath(); ctx.ellipse(x, y + 10, 60 + 1300 * v, 14 + 120 * v, 0, 0, TAU); ctx.stroke(); }
      }
    }
    // a mata escura da tentação, com brilhos falsos
    function mata(ctx, S) {
      const a = win(tTent - 1.5, tTent + 0.6, tLivra + 0.3, tLivra + 3.0, S.tl);
      if (a < 0.01) return;
      const [m0, m1] = XMATA;
      ctx.fillStyle = css(H('#6d6795'), 0.5 * a);                                              // trilha lateral escura
      ctx.beginPath(); ctx.moveTo(3010, solo(3010) - 10); ctx.quadraticCurveTo(3080, solo(3080) - 30, m0 + 40, lerp(borda(m0 + 40), solo(m0 + 40), 0.42)); ctx.lineTo(m0 + 90, lerp(borda(m0 + 90), solo(m0 + 90), 0.42) + 4);
      ctx.quadraticCurveTo(3110, solo(3110) - 22, 3060, solo(3060) - 6); ctx.closePath(); ctx.fill();
      for (let i = 0; i < 9; i++) {
        const x = lerp(m0, m1, i / 8) + Math.sin(i * 3.1) * 10, y = lerp(borda(x), solo(x), 0.42) + (i % 3) * 10, r = 40 + 18 * hash1(i * 2.3);
        ctx.fillStyle = css(ml(H('#5d5884'), H('#4b4672'), hash1(i)), 0.92 * a);
        ctx.beginPath(); ctx.ellipse(x, y - r * 0.5, r, r * 0.8, 0, 0, TAU); ctx.fill();
      }
      for (let i = 0; i < 14; i++) {                                                             // brilhos falsos que atraem
        const x = lerp(m0 + 10, m1 - 10, hash1(i * 5.1)) + Math.sin(S.t * 1.3 + i) * 10, y = lerp(borda(x), solo(x), 0.42) - 50 + hash1(i * 3.7) * 46 + Math.cos(S.t * 1.7 + i) * 6;
        brilhoRadial(ctx, x, y, 14, H('#d9b8ff'), 0.9 * a * (0.5 + 0.5 * Math.sin(S.t * 3 + i)));
      }
      const olhos = a * (1 - smooth(tLivra, tLivra + 1.2, S.tl));
      if (olhos > 0.01) for (const [x, f] of [[3150, 0], [3230, 1.7]]) {
        const pis = mod(S.t + f, 3.3) < 0.15 ? 0.1 : 1, y = lerp(borda(x), solo(x), 0.42) - 26;
        for (const dx of [-6, 6]) { brilhoRadial(ctx, x + dx, y, 12, H('#fff1b0'), 0.8 * olhos * pis); disco(ctx, x + dx, y, 2.2, css(H('#fff1b0'), olhos * pis)); }
      }
    }
    const disco = (ctx, x, y, r, cor) => { ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
    // pegadas de luz no caminho (gatilho `passos`)
    function pegadas(ctx, S) {
      const fim = 1 - smooth(tGloria[0] + 2, tGloria[0] + 5, S.tl);
      if (S.tl < tPassos - 0.2 || fim < 0.01) return;
      for (let k = 0; k < 22; k++) {
        const x = 3070 + k * 24, y = solo(x) + 8 + (k % 2 ? 6 : -4), t0 = tPassos + k * 0.12;
        const a = smooth(t0, t0 + 0.4, S.tl) * fim;
        if (a < 0.01) continue;
        brilhoRadial(ctx, x, y, 16, K.luzOuro, 0.6 * a);
        ctx.fillStyle = css(K.luz, 0.9 * a); ctx.beginPath(); ctx.ellipse(x, y, 6, 3, 0, 0, TAU); ctx.fill();
      }
    }
    // muro de pedra baixo na margem (onde pai e filha se sentam no fim)
    function muro(ctx, S) {
      for (let i = 0; i < 9; i++) {
        const x = 1040 + i * 24, y = solo(x) + 6;
        ctx.fillStyle = css(luzObj(S, i % 2 ? '#efe6dc' : '#e6dbe6', 0.9)); ctx.beginPath(); ctx.roundRect(x - 13, y - 22 - (i % 2) * 3, 26, 24, 7); ctx.fill();
      }
    }

    // ---------------------------------------------------------------- efeitos: o fardo que vira luz, pétalas do perdão, borboletas
    function fardoEmLuz(ctx, S, pai) {
      const u = (S.tl - (tPerdoa + 0.6)) / 3.0;
      if (u < 0 || u > 1) return;
      const x = pai.x - 26 * pai.o.dir, y = pai.y - 150;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 16; i++) {
        const a = hash1(i * 3.3) * TAU, r = 30 + 160 * u * (0.5 + hash1(i * 7.1)), yy = y - 140 * u * hash1(i * 2.9);
        brilho4(ctx, x + Math.cos(a) * r * 0.6, yy + Math.sin(a) * r * 0.3, (4 + 4 * hash1(i)) * (1 - u));
        brilhoRadial(ctx, x + Math.cos(a) * r * 0.6, yy + Math.sin(a) * r * 0.3, 14, K.luzOuro, 0.7 * (1 - u));
      }
      ctx.restore();
      for (let i = 0; i < 6; i++) borboleta(ctx, x + Math.sin(S.t * 1.3 + i * 2) * 40 * u + (hash1(i) - 0.5) * 90 * u, y - 40 - 220 * u * (0.6 + 0.4 * hash1(i * 3.1)), S.t * 12 + i, 1 - smooth(0.7, 1, u), FLORES[i % FLORES.length]);
    }
    function borboleta(ctx, x, y, f, a, cor) {
      if (a < 0.02) return;
      const b = Math.abs(Math.sin(f));
      ctx.fillStyle = css(cor, a);
      ctx.beginPath(); ctx.ellipse(x - 5 * b, y, 6 * b + 1, 4, -0.4, 0, TAU); ctx.ellipse(x + 5 * b, y, 6 * b + 1, 4, 0.4, 0, TAU); ctx.fill();
      ctx.fillStyle = css(H('#7d6f8e'), a); ctx.fillRect(x - 0.8, y - 4, 1.6, 8);
    }
    function petalas(ctx, S, x, y) {
      const u = (S.tl - (tPerdoamos + 1.3)) / 4.0;
      if (u < 0 || u > 1) return;
      for (let i = 0; i < 26; i++) {
        const a = hash1(i * 5.7) * Math.PI - Math.PI, r = 260 * u * (0.4 + 0.6 * hash1(i * 2.1));
        const px = x + Math.cos(a) * r + Math.sin(S.t * 2 + i) * 10, py = y + Math.sin(a) * r * 0.8 + 90 * u * u;
        ctx.fillStyle = css(FLORES[i % 4], 1 - u); ctx.beginPath(); ctx.ellipse(px, py, 5, 3, S.t * 2 + i, 0, TAU); ctx.fill();
      }
      brilhoRadial(ctx, x, y, 80, K.luzOuro, 0.7 * (1 - u));
    }
    // lanternas de papel soltas: sobem devagar, um grupo a cada gatilho `amen`
    const SOLTURA = [0, 1, 2, 3, 4, 5].map((k) => tAmen[k]);
    function lanternaSolta(ctx, S, x, y, tr, sem) {
      const dt = S.tl - tr;
      if (dt < 0) return;
      const sobe = 46 * dt - 24 * (1 - Math.exp(-dt / 1.2));
      const lx = x + Math.sin(dt * 0.5 + sem) * 26 + dt * 5, ly = y - sobe, s = 1.05 * (1 - 0.45 * clamp(dt / 40));
      R.lanternaCeu(ctx, lx, ly, s, 1, S.t + sem);
    }
    // lanternas distantes (do outro lado do lago) e as que viraram estrelas
    function lanternasCeu(ctx, S) {
      const a = smooth(tAmen[0] - 1, tAmen[2] + 4, S.tl);
      if (a < 0.01) return;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 150; i++) {
        const t0 = tAmen[0] + hash1(i * 3.1) * 30, dt = S.tl - t0;
        if (dt < 0) continue;
        const x = hash1(i * 7.7) * S.W + Math.sin(dt * 0.3 + i) * 12, y0 = 620 + hash1(i * 2.2) * 30;
        const y = Math.max(30 + hash1(i * 9.9) * 330, y0 - dt * (12 + 9 * hash1(i * 4.4)));
        brilhoRadial(ctx, x, y, 9 + 6 * hash1(i), K.chama || K.luzOuro, 0.85 * a * (0.7 + 0.3 * Math.sin(S.t * 2 + i)));
        disco(ctx, x, y, 1.6, css(K.luz, a));
      }
      ctx.restore();
    }
    function vagalumes(ctx, S, x0, x1) {
      const f = S.noite;
      if (f < 0.05) return;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 40; i++) {
        const x = x0 + mod(hash1(i * 3.3) * 2600 + 30 * noise1(S.t * 0.13 + i * 3.1), x1 - x0), yb = solo(x);
        const y = yb - 20 - 160 * hash1(i * 7.1) + 20 * noise1(S.t * 0.17 + i * 5.3);
        brilhoRadial(ctx, x, y, 8, H('#fff3a6'), 0.8 * f * (0.35 + 0.65 * Math.max(0, Math.sin(S.t * (1.2 + hash1(i) * 2) + i))));
      }
      ctx.restore();
    }
    function pombas(ctx, S) {
      const a = win(tPaiPt - 0.5, tPaiPt + 1, tPao - 4, tPao - 1, S.tl);
      if (a < 0.01) return;
      for (let i = 0; i < 3; i++) {
        const u = (S.tl - tPaiPt - i * 1.4) / 16;
        const x = lerp(-120, S.W + 160, u), y = ALT * (0.5 + 0.04 * i) + Math.sin(u * 9 + i) * 16;
        G.Personagens.pomba(ctx, S, x, y, 0.55, { fase: S.t * 9 + i * 2, bate: Math.sin(S.t * 9 + i * 2), dir: 1 });
      }
    }

    // ---------------------------------------------------------------- poses de cada personagem no tempo
    function posesPessoas(S) {
      const tl = S.tl, P = [];
      const pP = PAI(tl), pM = MENINA(tl), maosDadas = tl > tTent - 1 && tl < tConduz + 4;
      const M = [lerp(pP.x, pM.x, 0.55), (pP.y + pM.y) / 2 - 50];
      const fasePasso = (x, dir, passo) => (x * dir / passo) * TAU;
      // --- pai
      {
        const p = PAI(tl), dir = mov(p, 1);
        const o = { tipo: 'pai', dir, andar: clamp(Math.abs(p.v) / 45), t: tl, semente: 1 };
        o.fase = fasePasso(p.x, dir, 95);
        o.sentado = Math.max(1 - smooth(tPaiPt + 0.6, tPaiPt + 1.6, tl), win(tLachma + 1.2, tLachma + 2.0, tAbuna[1] - 3.2, tAbuna[1] - 2.5, tl), smooth(tAmen[5] + 2.5, tAmen[5] + 3.5, tl));
        o.olhar = Math.max(win(tAbuna[0] - 0.3, tAbuna[0] + 0.8, tPaiPt - 1, tPaiPt + 0.6, tl), win(tTerra[0] - 0.2, tTerra[0] + 0.8, tTerra[0] + 5, tTerra[0] + 6.5, tl),
          win(tReino[0] - 0.4, tReino[0] + 0.6, tAbuna[2] - 1, tAbuna[2] + 1, tl) * 0.8, win(tDilach - 2, tDilach, tAbuna[3], tAbuna[3] + 1.5, tl) * 0.7,
          win(tAbuna[4] - 0.5, tAbuna[4] + 1, tAmen[5] + 2, tAmen[5] + 3.5, tl) * 0.8, win(tAmen[6] - 1, tAmen[6] + 1, dur, dur + 1, tl) * 0.5);
        o.maos = win(tAbuna[0] - 0.4, tAbuna[0] + 0.6, tTeitei[0] - 0.4, tTeitei[0] + 0.6, tl);
        o.bracos = Math.max(win(tGloria[0] - 0.3, tGloria[0] + 0.6, tSempre[0] + 2, tSempre[0] + 3.5, tl), win(tTerra[2] - 0.3, tTerra[2] + 0.8, tTerra[2] + 6, tTerra[2] + 7.5, tl) * 0.9,
          win(tLealam[1] - 0.3, tLealam[1] + 0.7, tAmen[5] + 0.2, tAmen[5] + 1.2, tl) * 0.75);
        o.carga = win(tPao2 + 0.6, tPao2 + 1.4, tPerdoa + 0.5, tPerdoa + 1.2, tl);
        o.estende = Math.max(win(tPerdoamos - 0.2, tPerdoamos + 0.4, tPerdoamos + 1.1, tPerdoamos + 1.6, tl), win(tLachma - 0.1, tLachma + 0.6, tYomana - 0.6, tYomana, tl));
        o.abraco = win(tDevem - 0.1, tDevem + 0.6, tDevem + 3.4, tDevem + 4.0, tl);
        o.coracao = win(tCoracao - 0.2, tCoracao + 0.6, tGloria[0], tGloria[0] + 2, tl);
        o.segura = tl > tAbuna[4] - 1 && tl < tAmen[5] + 0.2 ? 'lanterna' : (tl > tLachma - 0.5 && tl < tYomana ? 'pao' : null);
        o.acesa = smooth(tAbuna[4] - 0.5, tAbuna[4] + 1.5, tl);
        if (maosDadas) o.maoAlvo = [(M[0] - p.x) * dir / 0.68, (M[1] - p.y) / 0.68];        // dá a mão à filha no caminho
        if (tl > tAmen[5] + 2.5) o.abraco = 0.6 * smooth(tAmen[6], tAmen[6] + 3, tl);
        P.push({ ...p, o, s: 0.68, quem: 'pai' });
      }
      // --- menina
      {
        const p = MENINA(tl);
        let padrao = 1;
        if (tl > tVontade[0] && tl < tPao2 + 0.4) padrao = -1;
        if (tl > tLachma + 0.4 && tl < tAbuna[1] - 2.2) padrao = 1;
        const dir = mov(p, padrao), o = { tipo: 'menina', dir, andar: clamp(Math.abs(p.v) / 40), t: tl, semente: 2 };
        o.fase = fasePasso(p.x, dir, 66);
        let y = p.y;
        const correndo = (tl > tAbuna[1] - 2.2 && tl < tTerra[1]) ? 1 : 0;
        if (correndo) { o.andar = clamp(Math.abs(p.v) / 30); y -= Math.abs(Math.sin(o.fase)) * 6 * o.andar; }
        for (const t0 of [tVenha[1], tVenha[2], tVontade[1], tVenha[3], tVenha[4]]) { const u = (tl - t0) / 0.45; if (u > 0 && u < 2) y -= Math.max(0, Math.sin(Math.PI * mod(u, 1))) * 22; }
        o.sentado = Math.max(1 - smooth(tPaiPt + 0.8, tPaiPt + 1.8, tl), win(tLachma + 0.4, tLachma + 1.2, tAbuna[1] - 3.0, tAbuna[1] - 2.3, tl), smooth(tAmen[5] + 3.0, tAmen[5] + 4.0, tl));
        o.olhar = Math.max(win(tAbuna[0] - 0.3, tAbuna[0] + 0.8, tPaiPt - 1, tPaiPt + 0.6, tl), win(tTerra[0] - 0.2, tTerra[0] + 0.8, tTerra[0] + 5, tTerra[0] + 6.5, tl),
          win(tTent + 0.6, tTent + 1.4, tLivra - 0.3, tLivra + 0.4, tl) * 0.3, win(tReino[0] - 0.4, tReino[0] + 0.6, tAbuna[2] - 1, tAbuna[2] + 1, tl),
          win(tDilach - 2, tDilach, tAbuna[3], tAbuna[3] + 1.5, tl) * 0.8, win(tAbuna[4] - 0.5, tAbuna[4] + 1, tAmen[5] + 2, tAmen[5] + 3.5, tl));
        o.bracos = Math.max(win(tShemach[0] - 0.2, tShemach[0] + 0.7, tTeitei[0] + 2, tTeitei[0] + 3, tl), win(tVenha[1] - 0.2, tVenha[1] + 0.5, tVontade[1] + 1, tVontade[1] + 2, tl),
          win(tGloria[0] - 0.3, tGloria[0] + 0.6, tSempre[0] + 2, tSempre[0] + 3.5, tl), win(tVenha[3] - 0.3, tVenha[3] + 0.5, tVontade[2] + 2, tVontade[2] + 3, tl),
          win(tTerra[2] - 0.3, tTerra[2] + 0.8, tTerra[2] + 6, tTerra[2] + 7.5, tl), win(tLealam[1] - 0.3, tLealam[1] + 0.7, tAmen[5] + 0.2, tAmen[5] + 1.2, tl));
        o.maos = win(tAbuna[0] - 0.4, tAbuna[0] + 0.6, tShemach[0] - 0.3, tShemach[0] + 0.3, tl);
        o.estende = Math.max(win(tYitaved - 0.2, tYitaved + 0.5, tKedi + 2, tKedi + 3, tl) * 0.8, win(tLachma + 1.6, tLachma + 2.2, tYomana + 1, tYomana + 1.6, tl));
        o.segura = (tl > tPao - 0.5 && tl < tPerdoa + 0.2) ? 'cesto' : (tl > tLachma + 1.2 && tl < tYomana + 1.6) ? 'pao' : (tl > tAbuna[4] - 1 && tl < tAmen[5] + 0.2 ? 'lanterna' : null);
        o.cheio = clamp((tl - tPao - 0.6) / 3.2);
        o.acesa = smooth(tAbuna[4] - 0.2, tAbuna[4] + 1.8, tl);
        o.coracao = win(tCoracao - 0.2, tCoracao + 0.6, tGloria[0], tGloria[0] + 2, tl);
        o.dorme = smooth(tLealam[2] - 1, tAmen[6] + 2, tl);
        if (maosDadas) o.maoAlvoTras = [(M[0] - p.x) * dir / 0.68, (M[1] - p.y) / 0.68];
        if (tl > tAmen[5] + 3) o.inclina = -0.22 * o.dorme;
        P.push({ ...p, y, o, s: 0.68, quem: 'menina' });
      }
      // --- mãe
      {
        const p = MAE(tl), dir = mov(p, 1), o = { tipo: 'mae', dir, andar: clamp(Math.abs(p.v) / 45), t: tl, semente: 3 };
        o.fase = fasePasso(p.x, dir, 92);
        o.alfa = smooth(tPaiPt + 3.6, tPaiPt + 4.4, tl) * (1 - smooth(tAmen[5] + 2.2, tAbuna[5] - 0.6, tl));
        o.segura = (tl > tPao - 0.4 && tl < tPao2 + 1.5) ? 'pao' : (tl > tAbuna[4] - 1 && tl < tAmen[4] + 0.2 ? 'lanterna' : null);
        o.seguraA = tl < tPao2 + 1.5 ? 0.5 + 0.5 * Math.cos((tl - tPao) * 2.0) : 1;
        o.estende = tl > tPao - 0.4 && tl < tPao2 + 1.5 ? 0.6 + 0.4 * Math.sin((tl - tPao) * 2.0) : 0;
        o.acesa = smooth(tAbuna[4] + 0.3, tAbuna[4] + 2.2, tl);
        o.sentado = win(tLachma + 0.3, tLachma + 1.1, SALTO1 - 1, SALTO1, tl);
        o.olhar = Math.max(win(tTerra[0] - 0.2, tTerra[0] + 0.8, tTerra[0] + 5, tTerra[0] + 6.5, tl), win(tDilach - 2, tDilach, tAbuna[3], tAbuna[3] + 1.5, tl) * 0.7,
          win(tAbuna[4] - 0.5, tAbuna[4] + 1, tAmen[5] + 2, tAmen[5] + 3.5, tl) * 0.8);
        o.bracos = Math.max(win(tTerra[2] - 0.3, tTerra[2] + 0.8, tTerra[2] + 6, tTerra[2] + 7.5, tl) * 0.9, win(tLealam[1] - 0.3, tLealam[1] + 0.7, tAmen[4] + 0.2, tAmen[4] + 1.2, tl) * 0.75);
        P.push({ ...p, o, s: 0.66, quem: 'mae' });
      }
      // --- vizinho e o filho dele
      {
        const p = VIZINHO(tl), dir = mov(p, tl < tLachma + 0.3 ? -1 : (tl < SALTO1 ? -1 : 1));
        const o = { tipo: 'vizinho', dir, andar: clamp(Math.abs(p.v) / 45), t: tl, semente: 4 };
        o.fase = fasePasso(p.x, dir, 95);
        o.alfa = smooth(tPerdoamos - 1.9, tPerdoamos - 1.3, tl) * (1 - smooth(tAmen[5] + 2.2, tAbuna[5] - 0.6, tl));
        o.segura = (tl < tPerdoamos + 1.3) ? 'pergaminho' : (tl > tAbuna[4] - 1 && tl < tAmen[3] + 0.2 ? 'lanterna' : null);
        o.seguraA = tl < tPerdoamos + 1.3 ? 1 - smooth(tPerdoamos + 1.0, tPerdoamos + 1.3, tl) : 1;
        o.estende = win(tPerdoamos - 0.2, tPerdoamos + 0.4, tPerdoamos + 1.1, tPerdoamos + 1.6, tl);
        o.olhar = -0.3 * win(tPerdoamos - 1.8, tPerdoamos - 1, tDevem - 0.5, tDevem, tl);
        o.abraco = win(tDevem - 0.1, tDevem + 0.6, tDevem + 3.4, tDevem + 4.0, tl);
        o.sentado = win(tLachma + 0.3, tLachma + 1.1, SALTO1 - 1, SALTO1, tl);
        o.acesa = smooth(tAbuna[4] + 0.6, tAbuna[4] + 2.5, tl);
        o.bracos = win(tTerra[2] - 0.3, tTerra[2] + 0.8, tTerra[2] + 6, tTerra[2] + 7.5, tl) * 0.8;
        P.push({ ...p, o, s: 0.68, quem: 'vizinho' });
        const q = MENINO(tl), dq = mov(q, tl < tAbuna[1] - 2.2 ? -1 : 1);
        const oq = { tipo: 'menino', dir: dq, andar: clamp(Math.abs(q.v) / (tl > tAbuna[1] - 2.2 && tl < tTerra[1] ? 30 : 40)), t: tl, semente: 5 };
        oq.fase = fasePasso(q.x, dq, 66);
        oq.alfa = smooth(tDevem + 1.6, tDevem + 2.2, tl) * (1 - smooth(tAmen[5] + 2.2, tAbuna[5] - 0.6, tl));
        oq.sentado = win(tLachma + 0.3, tLachma + 1.1, tAbuna[1] - 3.0, tAbuna[1] - 2.3, tl);
        oq.segura = (tl > tLachma + 2.2 && tl < tYomana + 2) ? 'pao' : (tl > tAbuna[4] - 1 && tl < tAmen[2] + 0.2 ? 'lanterna' : null);
        oq.acesa = smooth(tAbuna[4] + 0.8, tAbuna[4] + 2.6, tl);
        oq.bracos = Math.max(win(tVenha[1] - 0.2, tVenha[1] + 0.5, tVontade[1] + 1, tVontade[1] + 2, tl), win(tVenha[3] - 0.3, tVenha[3] + 0.5, tVontade[2] + 2, tVontade[2] + 3, tl));
        let qy = q.y;
        for (const t0 of [tVenha[1] + 0.2, tVenha[2] + 0.2, tVenha[3] + 0.2, tVenha[4] + 0.2]) { const u = (tl - t0) / 0.45; if (u > 0 && u < 2) qy -= Math.max(0, Math.sin(Math.PI * mod(u, 1))) * 20; }
        P.push({ ...q, y: qy, o: oq, s: 0.68, quem: 'menino' });
      }
      return P;
    }

    // ---------------------------------------------------------------- quadro
    function desenhar(ctx, S) {
      const tl = S.tl, W = S.W;
      S.hora = horaEm(tl); S.ceu = ceuEm(S.hora); S.noite = noiteF(S.hora);
      S.tempestade = Math.max(win(tTent - 2.0, tTent + 0.8, tReino[0] - 1.0, tReino[0] + 2.0, tl) * (1 - 0.45 * smooth(tLivra, tLivra + 1.5, tl)), 0.35 * win(tNisyona - 0.5, tNisyona + 1, tBisha, tBisha + 2.5, tl));
      S.reino = reinoEm(tl);
      S.vento = 0.3 * Math.sin(tl * 0.4) + 0.8 * S.tempestade + 0.5 * win(tPoder[0] - 0.1, tPoder[0] + 0.5, tPoder[0] + 2, tPoder[0] + 3.5, tl);
      S.cam = camEm(tl);
      const flash = relampago(S);
      S.tomTexto = 1 - smooth(0.32, 0.62, Math.max(S.noite * 0.9, S.tempestade * 0.75));
      // céu (tela)
      ceuFundo(ctx, S);
      estrelas(ctx, S);
      corpoCeleste(ctx, S);
      arcoIris(ctx, S);
      nuvens(ctx, S);
      raios(ctx, S, 0.3 * Math.max(...tReino.map((t0) => pulso(t0, 0.6, 4, tl)), pulso(tYomana, 0.6, 4, tl)));
      tempestade(ctx, S);
      lanternasCeu(ctx, S);
      // fundo com paralaxe: montanhas; o Templo e o lago na mesma camada
      fundo(ctx, S, 0.035, (x0, x1) => montanhas(ctx, S, x0, x1));
      fundo(ctx, S, P_LAGO, () => { const a = temploAlfa(S); if (a > 0.01) R.templo(ctx, TEMPLO_X(), TEMPLO_Y, TEMPLO_S, { t: S.t, brilho: temploBrilho(S), noite: S.noite, alfa: a }); });
      gloria(ctx, S);
      fundo(ctx, S, P_LAGO, (x0, x1) => lago(ctx, S, x0, x1));
      // mundo
      const c = S.cam, x0 = c.x - W / (2 * c.z) - 60, x1 = c.x + W / (2 * c.z) + 60;
      ctx.save(); ctx.translate(W / 2, ALT / 2); ctx.scale(c.z, c.z); ctx.translate(-c.x, -c.y);
      chao(ctx, S, x0, x1);
      for (const [x, tipo, s, dy] of ARVORES) {
        if (x < x0 - 200 || x > x1 + 200) continue;
        const y = solo(x) + dy;
        if (tipo === 'oliveira') R.oliveira(ctx, x, y, s, { t: S.t }); else if (tipo === 'palmeira') R.palmeira(ctx, x, y, s, { t: S.t }); else R.cipreste(ctx, x, y, s);
      }
      trigo(ctx, S, x0, x1, false);
      relva(ctx, S, x0, x1, false);
      mata(ctx, S);
      const luzJanela = clamp(S.noite * 1.2) * (1 - 0.3 * smooth(tAmen[6] + 4, dur, tl));
      for (const k of CASAS) if (k.x > x0 - 300 && k.x < x1 + 300) R.casa(ctx, k.x, BASE(k.x), 1, { ...k, luz: luzJanela, t: S.t });
      R.forno(ctx, XFORNO, BASE(XFORNO) + 6, 1, { t: S.t, fogo: smooth(tPaiPt + 4, tPaiPt + 6, tl) * (1 - smooth(tAbuna[1], tAbuna[1] + 3, tl)) + 0.4 * S.noite });
      R.poco(ctx, XPOCO, BASE(XPOCO) + 4, 0.95);
      R.mesaBaixa(ctx, XMESA, solo(XMESA) - 6, 1.25, { paes: smooth(tPerdoa, tPerdoa + 2, tl) * (1 - 0.6 * smooth(tYomana, tShevakna, tl)) + 0.4 });
      muro(ctx, S);
      ondasChao(ctx, S);
      // aldeões
      const tl2 = tl;
      for (const a of ALDEOES_MANHA) {
        const alfa = win(a.ap[0], a.ap[0] + 1, a.ap[1] - 1, a.ap[1], tl2);
        if (alfa < 0.01) continue;
        const p = a.tr(tl2), dir = p.v < -3 ? -1 : 1;
        R.pessoa(ctx, p.x, solo(p.x) + a.dy, a.s, { tipo: 'aldeao', cor: a.cor, veu: a.veu, manto: a.manto, barba: a.barba, dir, andar: clamp(Math.abs(p.v) / 40), fase: (p.x * dir / 90) * TAU, alfa, t: tl2, segura: a.seg, cheio: 1, semente: a.dy });
      }
      const campo = win(tAbuna[1] - 6, tAbuna[1] - 2, tTent - 2, tTent, tl2);
      if (campo > 0.01) ALDEOES_CAMPO.forEach(([x, dy, cor, veu], i) => R.pessoa(ctx, x, solo(x) + dy, 0.56, { tipo: 'aldeao', cor, veu, dir: i % 2 ? -1 : 1, estende: 0.5 + 0.5 * Math.sin(tl2 * 1.5 + i), alfa: campo, t: tl2, segura: i === 1 ? 'cesto' : null, cheio: 1, semente: i + 7 }));
      const noiteA = smooth(tAbuna[3] + 1.5, tAbuna[3] + 2.0, tl2) * (1 - smooth(tAmen[5] + 2.2, tAbuna[5] - 0.6, tl2));
      if (noiteA > 0.01) ALDEOES_NOITE.forEach((a) => {
        const tr = SOLTURA[a.grupo], sol = tl2 > tr;
        R.pessoa(ctx, a.x, solo(a.x) + a.dy, a.s, { tipo: 'aldeao', cor: a.cor, veu: a.veu, barba: a.barba, dir: a.dir, t: tl2, semente: a.sem, alfa: noiteA,
          segura: sol || tl2 < tAbuna[4] - 1 ? null : 'lanterna', acesa: smooth(tAbuna[4] + a.sem * 0.5, tAbuna[4] + 1.5 + a.sem * 0.5, tl2),
          olhar: smooth(tAbuna[4], tAbuna[4] + 2, tl2) * 0.8, bracos: win(tLealam[1] - 0.3, tLealam[1] + 0.7, tr - 0.2, tr + 1.0, tl2) * 0.8 + (sol ? 0.3 * win(tr, tr + 0.5, tr + 3, tr + 4, tl2) : 0) });
      });
      // personagens principais (por profundidade)
      const P = posesPessoas(S).sort((a, b) => a.y - b.y);
      for (const p of P) if ((p.o.alfa === undefined || p.o.alfa > 0.01) && p.x > x0 - 100 && p.x < x1 + 100) R.pessoa(ctx, p.x, p.y, p.s, p.o);
      const pai = P.find((p) => p.quem === 'pai'), viz = P.find((p) => p.quem === 'vizinho');
      fardoEmLuz(ctx, S, pai);
      if (viz) petalas(ctx, S, (pai.x + viz.x) / 2, viz.y - 100);
      pegadas(ctx, S);
      trigo(ctx, S, x0, x1, true);
      relva(ctx, S, x0, x1, true);
      // lanternas soltas (quem segurava solta a sua)
      if (tl2 > tAmen[0] - 0.1) {
        ALDEOES_NOITE.forEach((a) => { const tr = SOLTURA[a.grupo]; lanternaSolta(ctx, S, a.x + 32 * a.s * a.dir, solo(a.x) + a.dy - 212 * a.s, tr, a.sem); });
        for (const p of P) {
          const tr = { menino: SOLTURA[2], vizinho: SOLTURA[3], mae: SOLTURA[4], menina: SOLTURA[5], pai: SOLTURA[5] + 0.3 }[p.quem];
          const crianca = p.quem === 'menino' || p.quem === 'menina';
          lanternaSolta(ctx, S, p.x + 32 * p.s * p.o.dir, p.y - (crianca ? 130 : 212) * p.s, tr, p.quem.length);
        }
      }
      vagalumes(ctx, S, x0, x1);
      ctx.restore();
      feixes(ctx, S);
      pombas(ctx, S);
      // escurecer na tempestade, e o relâmpago
      if (S.tempestade > 0.01) { ctx.fillStyle = css(H('#4c4878'), 0.32 * S.tempestade * (1 - 0.5 * smooth(tLivra, tLivra + 1.5, tl))); ctx.fillRect(-40, -40, W + 80, ALT + 80); }
      if (flash > 0.01) { ctx.fillStyle = css(K.luz, flash); ctx.fillRect(-40, -40, W + 80, ALT + 80); }
      // gatilho `livra`: um raio de sol rompe as nuvens sobre os dois
      const rompe = win(tLivra - 0.2, tLivra + 0.6, tConduz, tConduz + 2, tl);
      if (rompe > 0.01) {
        const pp = PAI(tl), [tx, ty] = paraTela(S, pp.x + 30, pp.y);
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        feixe(ctx, tx + 220, -60, tx, ty + 10, 150, 0.9 * rompe, 0.12);
        ctx.restore();
      }
    }

    return { espelho: false, estado: () => ({ fx: 0.5, calor: 0, peso: 0, nevoa: 0, vento: 0.2, solY: 400, solForca: 1, raios: 0, motes: 0, flash: 0 }), desenhar };
  }

  G.TemaPaiNosso = { criar };
})(window);
