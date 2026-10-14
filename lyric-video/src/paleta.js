// Paleta e "relógio do dia". A história do vídeo é um dia inteiro: madrugada, nascer do sol
// (primeiro refrão), manhã, meio-dia, tarde, pôr do sol (ponte), anoitecer, noite estrelada e,
// no fim, o começo de um novo dia ("vida eterna"). Tudo em tons pastel.
(function (G) {
  'use strict';
  const { clamp, lerp, smoother, mod, rgb, lab, mixLab, fromLab } = G.U;

  // Um quadro-chave por hora. Campos:
  //  top/mid/low/hor: degradê do céu (topo -> horizonte)    amb: cor da luz ambiente, a: brilho geral
  //  star: visibilidade das estrelas   cloud/cloudB: nuvem da frente/de trás   haze: névoa nas colinas
  //  rim: cor da luz de contorno   rimA: força dela
  //  hill/hillMix: tom que o terreno recebe naquele momento (evita o "cinza" de misturar verde com rosa)
  const K = [
    { h: 0,    top: '#1B1F4D', mid: '#2A2F76', low: '#43449A', hor: '#5E56AE', amb: '#8A92EA', a: 0.62, star: 1.0,  cloud: '#8E93E2', cloudB: '#5E63B8', haze: '#6B63BA', rim: '#AEB8FF', rimA: 0.22, hill: '#5D5AC4', hillMix: 0.48 },
    { h: 4.4,  top: '#262A69', mid: '#43479A', low: '#8467B6', hor: '#D98DB8', amb: '#A79FE2', a: 0.68, star: 0.9,  cloud: '#B9A0DE', cloudB: '#7F72BE', haze: '#9284C6', rim: '#FFB2C8', rimA: 0.32, hill: '#7E70CC', hillMix: 0.46 },
    { h: 5.4,  top: '#6A6CC2', mid: '#AE86D2', low: '#F4A6C4', hor: '#FFD0A6', amb: '#E4B5D8', a: 0.76, star: 0.35, cloud: '#FFC8D0', cloudB: '#D6A6DA', haze: '#E2B4D8', rim: '#FFC6A2', rimA: 0.55, hill: '#C0A0DC', hillMix: 0.40 },
    { h: 6.4,  top: '#8FB0EE', mid: '#C8B2EE', low: '#FFC2CA', hor: '#FFE1A6', amb: '#FFE0D0', a: 0.90, star: 0.0,  cloud: '#FFE3D4', cloudB: '#F0C6DC', haze: '#F1D2E4', rim: '#FFDCA6', rimA: 0.72, hill: '#EBC4DA', hillMix: 0.22 },
    { h: 8.5,  top: '#8CC4FF', mid: '#B8DBFF', low: '#DCEEFF', hor: '#FFF0D6', amb: '#FFFFFF', a: 1.00, star: 0.0,  cloud: '#FFFFFF', cloudB: '#DCEAFA', haze: '#DCE8F6', rim: '#FFF0C8', rimA: 0.42, hill: '#FFFFFF', hillMix: 0.0 },
    { h: 12.5, top: '#7AB9FF', mid: '#A4D4FF', low: '#D2EBFF', hor: '#F0F8FF', amb: '#FFFFFF', a: 1.00, star: 0.0,  cloud: '#FFFFFF', cloudB: '#D2E5FA', haze: '#D4E4F4', rim: '#FFFFFF', rimA: 0.25, hill: '#FFFFFF', hillMix: 0.0 },
    { h: 16.4, top: '#8ABEFF', mid: '#B4D4FA', low: '#E4E2F4', hor: '#FFEBCB', amb: '#FFF6E8', a: 0.98, star: 0.0,  cloud: '#FFF6EC', cloudB: '#E2DBF2', haze: '#E6DEEE', rim: '#FFE4B5', rimA: 0.50, hill: '#FFE2B8', hillMix: 0.08 },
    { h: 17.7, top: '#A6B2F0', mid: '#D8B8E8', low: '#FFC0B8', hor: '#FFDDA0', amb: '#FFE0C0', a: 0.92, star: 0.0,  cloud: '#FFE8D0', cloudB: '#F0C2D0', haze: '#F2CED0', rim: '#FFD08A', rimA: 0.82, hill: '#F6B9A6', hillMix: 0.20 },
    { h: 18.6, top: '#8C88E0', mid: '#C696DE', low: '#FF9EB4', hor: '#FFC08A', amb: '#FFC0B0', a: 0.80, star: 0.05, cloud: '#FFC6B8', cloudB: '#D69FCC', haze: '#E6A8C4', rim: '#FFB27A', rimA: 0.90, hill: '#C49AE0', hillMix: 0.46 },
    { h: 19.6, top: '#585AB8', mid: '#8A6CC4', low: '#DA84B4', hor: '#FFA88F', amb: '#C89AD0', a: 0.66, star: 0.5,  cloud: '#E8A6C8', cloudB: '#A68AD0', haze: '#B48ACC', rim: '#FF9AA8', rimA: 0.60, hill: '#9088DC', hillMix: 0.52 },
    { h: 20.8, top: '#33369A', mid: '#5A54B0', low: '#9872BC', hor: '#D88AB8', amb: '#A99CE2', a: 0.62, star: 0.92, cloud: '#B49AD8', cloudB: '#7A6CBC', haze: '#8878C0', rim: '#D6A8F0', rimA: 0.40, hill: '#6D68CE', hillMix: 0.52 },
    { h: 24,   top: '#1B1F4D', mid: '#2A2F76', low: '#43449A', hor: '#5E56AE', amb: '#8A92EA', a: 0.62, star: 1.0,  cloud: '#8E93E2', cloudB: '#5E63B8', haze: '#6B63BA', rim: '#AEB8FF', rimA: 0.22, hill: '#5D5AC4', hillMix: 0.48 },
  ];
  const CORES = ['top', 'mid', 'low', 'hor', 'amb', 'cloud', 'cloudB', 'haze', 'rim', 'hill'];
  const NUM = ['a', 'star', 'rimA', 'hillMix'];
  // converte as cores dos quadros-chave para OKLab uma única vez
  K.forEach((k) => CORES.forEach((c) => { k['_' + c] = lab(k[c]); }));

  // Estado do céu numa hora do dia (0-24, com volta). Cores saem como [r,g,b].
  function ceu(hora) {
    const h = mod(hora, 24);
    let i = 0;
    while (i < K.length - 2 && h >= K[i + 1].h) i++;
    const A = K[i], B = K[i + 1];
    const t = smoother(A.h, B.h, h);
    const o = { hora: h };
    CORES.forEach((c) => { o[c] = fromLab(mixLab(A['_' + c], B['_' + c], t)); });
    NUM.forEach((n) => { o[n] = lerp(A[n], B[n], t); });
    // luminosidade perceptual do céu atrás da legenda (decide se o texto é escuro ou claro)
    o.lumTexto = lerp(mixLab(A._mid, B._mid, t)[0], mixLab(A._low, B._low, t)[0], 0.35);
    return o;
  }

  // Curva "tempo da música -> hora do dia": linear entre marcos, depois suavizada.
  // Marcos: [segundos, hora]. Horas > 24 dão a volta (o vídeo termina num novo amanhecer).
  const MARCOS = [
    [0, 4.6], [13, 5.5], [26, 6.2], [45, 7.0], [75, 9.3], [110, 12.0], [150, 14.2],
    [200, 17.3], [232, 18.5], [252, 19.5], [276, 21.2], [300, 24.0], [320, 29.2],
  ];
  function tabelaHora(duracao, passo = 1 / 30) {
    const n = Math.ceil(duracao / passo) + 1;
    const bruto = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const t = i * passo;
      let k = 0;
      while (k < MARCOS.length - 2 && t >= MARCOS[k + 1][0]) k++;
      const [t0, h0] = MARCOS[k], [t1, h1] = MARCOS[k + 1];
      bruto[i] = lerp(h0, h1, clamp((t - t0) / (t1 - t0)));
    }
    // média móvel (janela ~ 12 s) para suavizar as quinas entre marcos
    const j = Math.round(6 / passo);
    const soma = new Float64Array(n + 1);
    for (let i = 0; i < n; i++) soma[i + 1] = soma[i] + bruto[i];
    const suave = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const a = Math.max(0, i - j), b = Math.min(n - 1, i + j);
      suave[i] = (soma[b + 1] - soma[a]) / (b - a + 1);
    }
    return { passo, valores: suave };
  }
  const horaEm = (tab, t) => {
    const x = clamp(t / tab.passo, 0, tab.valores.length - 1.001);
    const i = Math.floor(x);
    return lerp(tab.valores[i], tab.valores[i + 1], x - i);
  };

  G.Paleta = { ceu, tabelaHora, horaEm, MARCOS };
})(window);
