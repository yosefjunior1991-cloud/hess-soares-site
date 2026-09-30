// Orquestra o vídeo. Expõe window.__renderizar(t): desenha o quadro do instante t (segundos).
// Nada aqui guarda estado entre quadros: tudo é calculado a partir de t e de tabelas
// pré-computadas, então qualquer quadro pode ser renderizado em qualquer ordem.
(async function () {
  'use strict';
  const { clamp, lerp, smooth, mix, css, rgb, ease, mulberry32 } = window.U;
  const q = new URLSearchParams(location.search);
  const Wpx = +q.get('w') || 1920, Hpx = +q.get('h') || 1080;
  const retrato = Hpx > Wpx;
  const k = Hpx / 1080;                       // espaço de projeto (altura 1080) -> pixels
  const Wd = Wpx / k;
  const u = (Wpx / 1920) * (retrato ? 1.45 : 1);   // escala dos textos
  const fimT = q.get('fim') ? +q.get('fim') : null;  // fim do trecho renderizado (para o fade final)

  const [musica, audio] = await Promise.all([
    fetch('../data/musica.json').then((r) => r.json()),
    fetch('../data/audio.json').then((r) => r.json()),
  ]);
  const dur = musica.duracao;
  const quadro = document.getElementById('quadro');
  quadro.style.width = Wpx + 'px'; quadro.style.height = Hpx + 'px';
  quadro.style.setProperty('--u', u);
  document.body.style.width = Wpx + 'px'; document.body.style.height = Hpx + 'px';
  const canvas = document.getElementById('cena');
  canvas.width = Wpx; canvas.height = Hpx;
  const ctx = canvas.getContext('2d');

  await Promise.all([
    document.fonts.load('700 100px Inter'), document.fonts.load('italic 500 40px Inter'),
    document.fonts.load('600 40px Inter'), document.fonts.load('800 100px Inter'),
    ...[500, 600, 700, 800].map((w) => document.fonts.load(`${w} 100px "Noto Sans Hebrew"`, 'כִּי')),
  ]);
  await document.fonts.ready;

  // ---------------------------------------------------------------- tabelas dependentes do tempo
  const tabHora = Paleta.tabelaHora(dur + 2);
  const PASSO = 1 / 30;

  // estrofes com "vida eterna": o pastor para, olha para o céu e as pombas voam
  const descansos = [];
  const pombas = [];
  musica.estrofes.forEach((e, idx) => {
    const txt = e.linhas.map((i) => musica.linhas[i].texto).join(' ');
    if (/חַיֵּי/.test(txt)) {
      descansos.push([e.ini, e.fim]);
      pombas.push({ ini: e.ini + 1, fim: e.fim - 1, n: 6, y: 0.30, sem: idx * 7.3 });
    } else if (/לֹא יֹאבַד/.test(txt)) {
      pombas.push({ ini: e.ini, fim: e.fim, n: 4, y: 0.34, sem: idx * 3.1 });
    }
  });
  pombas.push({ ini: 24, fim: 36, n: 2, y: 0.38, sem: 1.7 });                     // nascer do sol
  pombas.push({ ini: dur - 21, fim: dur - 3, n: 5, y: 0.30, sem: 9.1 });          // novo dia
  const descanso = (t) => {
    let r = 0;
    for (const [a, b] of descansos) r = Math.max(r, smooth(a - 1.6, a + 0.4, t) * (1 - smooth(b - 0.4, b + 1.8, t)));
    return r;
  };
  const andarEm = (t) => (1 - descanso(t)) * smooth(11.5, 16.5, t) * (1 - smooth(dur - 24, dur - 14, t));

  const V = 76;                                // px/s de rolagem (camada de paralaxe 1.0) enquanto anda
  const nTab = Math.ceil(dur / PASSO) + 3;
  const rolTab = new Float64Array(nTab);
  for (let i = 1; i < nTab; i++) rolTab[i] = rolTab[i - 1] + V * andarEm((i - 1) * PASSO) * PASSO;
  const rolagemEm = (t) => {
    const x = clamp(t / PASSO, 0, nTab - 1.001), i = Math.floor(x);
    return lerp(rolTab[i], rolTab[i + 1], x - i);
  };

  // corações sobem quando se canta "amou"/"amor"
  const coracoes = [];
  const rr = mulberry32(5);
  const CORES_C = ['#FF9CC0', '#FFB58A', '#D9B8FF', '#FFC6DA'];
  musica.linhas.forEach((l) => l.palavras.forEach((p) => {
    if (!/אָהַב|amor|amou/i.test(p.txt)) return;
    for (let i = 0; i < 3; i++) {
      coracoes.push({ t0: p.ini + i * 0.22, x: Wd * (0.10 + 0.80 * rr()), y: 1080 * (0.66 + 0.10 * rr()), dur: 3.6 + rr(), r: 11 + rr() * 11, f: rr() * 6.28, cor: CORES_C[Math.floor(rr() * 4)] });
    }
  }));

  // ---------------------------------------------------------------- áudio -> números por instante
  const A_em = (t) => {
    const x = clamp(t * audio.fps, 0, audio.energia.length - 1.001), i = Math.floor(x), f = x - i;
    const g = (a) => lerp(a[i], a[i + 1], f);
    return { energia: g(audio.energia), graves: g(audio.graves), medios: g(audio.medios), agudos: g(audio.agudos), pulso: g(audio.pulso) };
  };

  // ---------------------------------------------------------------- interface (legenda, abertura, acabamento)
  // a legenda vive no céu: âncora do centro da linha ativa e limites da pilha (frações da altura)
  const cfgUI = { u, altura: Hpx, ancora: retrato ? 0.38 : 0.335, limiteSuperior: 0.06, limiteInferior: 0.57 };
  const legenda = Legenda.criar(document.getElementById('legenda'), musica, cfgUI);
  const abertura = Abertura.criar(document.getElementById('abertura'), musica, cfgUI);
  const veu = document.getElementById('veu');
  const fade = document.getElementById('fade');
  const grao = document.getElementById('grao');
  {
    // ruído fino e determinístico contra "faixas" (banding) nos degradês do céu
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d'), d = x.createImageData(256, 256), r = mulberry32(99);
    for (let i = 0; i < d.data.length; i += 4) { const v = 96 + Math.floor(r() * 64); d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    x.putImageData(d, 0, 0);
    grao.style.backgroundImage = `url(${c.toDataURL()})`;
  }

  // texto claro (noite) <-> escuro (dia), decidido pela luminosidade do céu atrás da legenda
  const CLARO = { ink: [255, 255, 255, 1], dim: [255, 255, 255, 0.34], translit: [207, 227, 255, 1], traducao: [255, 231, 163, 1], glow: [255, 214, 240, 0.95], k1: [255, 196, 225, 1], k2: [255, 233, 173, 1], veu: [24, 20, 84, 0.38] };
  const ESCURO = { ink: [37, 35, 91, 1], dim: [37, 35, 91, 0.40], translit: [70, 87, 214, 1], traducao: [169, 102, 11, 1], glow: [255, 255, 255, 0.95], k1: [229, 72, 138, 1], k2: [242, 138, 46, 1], veu: [255, 255, 255, 0.42] };
  function aplicarCores(tom) {
    for (const nome of Object.keys(CLARO)) {
      const a = CLARO[nome], b = ESCURO[nome];
      const c = a.map((v, i) => lerp(v, b[i], tom));
      quadro.style.setProperty('--' + nome, `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${c[3].toFixed(3)})`);
    }
  }

  // ---------------------------------------------------------------- o quadro
  function renderizar(t) {
    const A = A_em(t);
    const hora = Paleta.horaEm(tabHora, t);
    const dia = Paleta.ceu(hora);
    const bx = (t - audio.primeiraBatida) * audio.bpm / 60;
    const S = {
      t, W: Wd, dia, hora, A, retrato,
      rolagem: rolagemEm(t), andar: andarEm(t),
      batida: bx - Math.floor(bx), indiceBatida: Math.floor(bx),
      zoom: 1 + 0.045 * (t / dur) + 0.02 * descanso(t),
      coracoes, pombas,
    };
    ctx.setTransform(k, 0, 0, k, 0, 0);
    Cena.desenhar(ctx, S);
    // vinheta suave
    const g = ctx.createRadialGradient(Wd / 2, 540, 380, Wd / 2, 540, Math.max(Wd, 1080) * 0.72);
    g.addColorStop(0, 'rgba(20,14,70,0)'); g.addColorStop(1, `rgba(20,14,70,${(0.16 + 0.14 * (1 - dia.a)).toFixed(3)})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, Wd, 1080);

    // durante a abertura o texto é sempre claro (véu escuro atrás do bloco de título)
    const abPeso = smooth(0.6, 2.5, t) * (1 - smooth(11.6, 12.4, t));
    const tom = smooth(0.62, 0.70, dia.lumTexto) * (1 - abPeso);
    aplicarCores(tom);
    const vis = legenda.atualizar(t, A);
    abertura.atualizar(t);
    const centroVeu = lerp(cfgUI.ancora, retrato ? 0.17 : 0.33, abPeso) * 100;
    veu.style.background = `radial-gradient(ellipse 62% 44% at 50% ${centroVeu.toFixed(1)}%, var(--veu) 0%, rgba(0,0,0,0) 100%)`;
    veu.style.opacity = clamp(Math.max(vis, abPeso)).toFixed(3);

    const fimFade = fimT || dur;
    fade.style.opacity = clamp((1 - smooth(0, 1.1, t)) + smooth(fimFade - 1.5, fimFade - 0.05, t)).toFixed(3);
    // (o ruído fica parado: quadro a quadro ele custaria muito bitrate sem ganho visível)
  }

  window.__info = { duracao: dur, hora: (t) => Paleta.horaEm(tabHora, t), lum: (t) => Paleta.ceu(Paleta.horaEm(tabHora, t)).lumTexto };
  window.__renderizar = renderizar;
  renderizar(0);
  window.__pronto = true;
})().catch((e) => { window.__erro = String(e && e.stack || e); console.error(e); });
