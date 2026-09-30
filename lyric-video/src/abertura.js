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

  G.Abertura = { criar, DUR };
})(window);
