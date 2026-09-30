// Abertura (durante a introdução instrumental) e assinatura final. Conteúdo exigido pelas regras
// do canal: título em português e em hebraico, transliteração, versículo(s), canal e aviso de
// direitos autorais. As letras do título entram uma a uma, com mola e desfoque (estilo keynote).
(function (G) {
  'use strict';
  const { clamp, mola, ease } = G.U;

  const T0 = 0.3;                                   // início da abertura (s)
  const INI = { titulo: 0.5, he: 1.7, tr: 2.2, vers: 2.7, linha: 3.8, canal: 4.2, aviso: 4.9 };
  const SAIDA = 11.6;                               // começa a sair (s, relativo a T0)
  const DUR = 12.6;

  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  function criar(raiz, musica, cfg) {
    const letras = [...musica.titulo.toUpperCase()].map((c) => `<span class="ab-l">${c === ' ' ? '&nbsp;' : esc(c)}</span>`).join('');
    raiz.innerHTML = `
      <div class="ab-bloco">
        <div class="ab-titulo">${letras}</div>
        ${musica.tituloHebraico ? `<div class="ab-he" dir="rtl"><span>${esc(musica.tituloHebraico)}</span></div>` : ''}
        ${musica.tituloTranslit ? `<div class="ab-tr">${esc(musica.tituloTranslit)}</div>` : ''}
        ${musica.versiculos ? `<div class="ab-vers"><span>${esc(musica.versiculos)}</span></div>` : ''}
        ${musica.canal ? `<div class="ab-linha"></div><div class="ab-canal">${esc(musica.canal)}</div>` : ''}
        <div class="ab-aviso">${musica.aviso.map((a) => `<div>${esc(a)}</div>`).join('')}</div>
      </div>`;
    const q = (s) => raiz.querySelector(s);
    const ls = [...raiz.querySelectorAll('.ab-l')];
    const itens = [
      ...ls.map((el, i) => ({ el, ini: INI.titulo + i * 0.06, ordem: i * 0.02, dy: 60, blur: 18, escala: true })),
      { el: q('.ab-he'), ini: INI.he, ordem: 0.3, dy: 36, blur: 14 },
      { el: q('.ab-tr'), ini: INI.tr, ordem: 0.36, dy: 30, blur: 12 },
      { el: q('.ab-vers'), ini: INI.vers, ordem: 0.42, dy: 30, blur: 12 },
      { el: q('.ab-linha'), ini: INI.linha, ordem: 0.48, dy: 0, blur: 0, linha: true },
      { el: q('.ab-canal'), ini: INI.canal, ordem: 0.52, dy: 26, blur: 10 },
      { el: q('.ab-aviso'), ini: INI.aviso, ordem: 0.58, dy: 20, blur: 8 },
    ].filter((i) => i.el);

    function atualizar(t) {
      if (t > DUR) { raiz.style.visibility = 'hidden'; return; }
      raiz.style.visibility = 'visible';
      const r = t - T0;
      for (const it of itens) {
        const d = r - it.ini;
        const p = mola(d, 2.3, 0.68);
        const a = clamp(d / 0.4);
        const x = clamp((r - SAIDA - it.ordem) / 0.6);
        const op = ease.outCubic(a) * (1 - ease.inOutCubic(x));
        const ty = (1 - p) * it.dy * cfg.u - ease.inOutCubic(x) * 40 * cfg.u;
        const bl = ((1 - clamp(d / 0.55)) * it.blur + x * 14) * cfg.u;
        if (it.linha) {
          it.el.style.opacity = op.toFixed(3);
          it.el.style.transform = `scaleX(${clamp(p).toFixed(3)})`;
          continue;
        }
        it.el.style.opacity = op.toFixed(3);
        it.el.style.transform = `translateY(${ty.toFixed(2)}px)${it.escala ? ` scale(${(0.9 + 0.1 * p).toFixed(4)})` : ''}`;
        it.el.style.filter = bl > 0.2 ? `blur(${bl.toFixed(2)}px)` : 'none';
      }
    }
    return { atualizar };
  }

  // Contorno de "ingresso": cantos arredondados, bordas de cima e de baixo picotadas e um
  // entalhe semicircular em cada lado (semicírculos côncavos = arcos com sweep 0).
  function caminhoTicket(w, h, r, canto, entalheY) {
    const n = Math.floor((w - 2 * canto) / (2 * r));
    const folga = (w - 2 * canto - n * 2 * r) / 2;
    let x = canto + folga;
    let d = `M ${canto} 0 L ${x} 0`;
    for (let i = 0; i < n; i++) { d += ` A ${r} ${r} 0 0 0 ${x + 2 * r} 0`; x += 2 * r; }
    d += ` L ${w - canto} 0 Q ${w} 0 ${w} ${canto} L ${w} ${entalheY - r} A ${r} ${r} 0 0 0 ${w} ${entalheY + r}`;
    d += ` L ${w} ${h - canto} Q ${w} ${h} ${w - canto} ${h}`;
    x = w - canto - folga;
    d += ` L ${x} ${h}`;
    for (let i = 0; i < n; i++) { d += ` A ${r} ${r} 0 0 0 ${x - 2 * r} ${h}`; x -= 2 * r; }
    d += ` L ${canto} ${h} Q 0 ${h} 0 ${h - canto} L 0 ${entalheY + r} A ${r} ${r} 0 0 0 0 ${entalheY - r} L 0 ${canto} Q 0 0 ${canto} 0 Z`;
    return d;
  }

  // Encerramento: cartão holográfico pastel (inspirado no ingresso perfurado do Uiverse) que
  // flutua com o título, o hebraico, a tradução e o canal, nos segundos finais.
  function criarTicket(raiz, musica, cfg) {
    const u = cfg.u;
    const w = 340 * u, h = 500 * u;
    let barras = '';
    for (let i = 0; i < 34; i++) barras += `<i style="width:${(1 + Math.floor(G.U.hash1(i * 4.7) * 3.4)) * u}px"></i>`;
    const traducao = musica.linhas.length ? musica.linhas[0].traducao : '';
    raiz.innerHTML = `
      <div class="tk-corpo">
        <div class="tk-holo"></div><div class="tk-brilho"></div>
        <div class="tk-cont">
          <div class="tk-titulo">${esc(musica.titulo.toUpperCase())}</div>
          <div class="tk-fio"></div>
          ${musica.tituloHebraico ? `<div class="tk-he" dir="rtl"><span>${esc(musica.tituloHebraico)}</span></div>` : ''}
          ${musica.tituloTranslit ? `<div class="tk-tr">${esc(musica.tituloTranslit)}</div>` : ''}
          ${traducao ? `<div class="tk-tx">${esc(traducao)}</div>` : ''}
          <div class="tk-rodape"><div class="tk-canal">${esc(musica.canal || '')}</div><div class="tk-barras">${barras}</div></div>
        </div>
      </div>`;
    const corpo = raiz.querySelector('.tk-corpo');
    const brilho = raiz.querySelector('.tk-brilho');
    corpo.style.width = w + 'px'; corpo.style.height = h + 'px';
    corpo.style.clipPath = `path('${caminhoTicket(w, h, 11 * u, 28 * u, h * 0.7)}')`;

    function atualizar(t, duracao) {
      const ini = duracao - 8.5;
      const d = t - ini;
      if (d < -0.1) { raiz.style.opacity = '0'; return; }
      const a = ease.outCubic(clamp(d / 0.9));
      const p = mola(d, 1.7, 0.6);
      // "hover" de 3 s (como no exemplo original): sobe 7 px, cresce 2% e a sombra fica mais suave
      const f = 0.5 - 0.5 * Math.cos((Math.PI * 2 * Math.max(0, d)) / 3);
      const ty = (1 - p) * 170 * u - 7 * u * f;
      const sc = 0.86 + 0.14 * p + 0.02 * f;
      raiz.style.opacity = a.toFixed(3);
      raiz.style.transform = `translate(-50%, -50%) translateY(${ty.toFixed(2)}px) rotate(${((1 - p) * -7).toFixed(2)}deg) scale(${sc.toFixed(4)})`;
      const s1 = (0.18 - 0.07 * f).toFixed(3), s2 = (0.2 - 0.08 * f).toFixed(3);
      raiz.style.filter = `drop-shadow(0 ${(2 * u).toFixed(1)}px ${(1 * u).toFixed(1)}px rgba(60,40,120,${s1})) drop-shadow(0 ${(10 * u + 6 * u * f).toFixed(1)}px ${(9 * u).toFixed(1)}px rgba(60,40,120,${s1})) drop-shadow(0 ${(30 * u + 14 * u * f).toFixed(1)}px ${(30 * u).toFixed(1)}px rgba(60,40,120,${s2}))`;
      corpo.style.setProperty('--ang', `${((t * 38) % 360).toFixed(1)}deg`);
      brilho.style.backgroundPosition = `${(-120 + 330 * ((d * 0.16) % 1)).toFixed(1)}% 0`;
    }
    return { atualizar };
  }

  G.Abertura = { criar, criarTicket, DUR };
})(window);
