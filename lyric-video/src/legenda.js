// Legendas dinâmicas. Regras do canal Or Israel mantidas:
//  - a estrofe inteira fica na tela e a linha cantada fica "acesa" (as outras apagadas);
//  - linhas em hebraico sempre com hebraico + transliteração + tradução em português.
// Movimento inspirado nas letras do Apple Music: a linha ativa cresce e ganha foco, as demais
// recuam (menores, mais transparentes e levemente desfocadas) e a pilha rola suavemente.
// Cada palavra acende com uma varredura (na direção da leitura), "pula" com mola ao ser
// cantada e ganha brilho que reage à energia da música. Palavras-chave ganham degradê.
(function (G) {
  'use strict';
  const { clamp, lerp, smooth, mola, ease } = G.U;

  const ESCALA_MIN = 0.70;      // tamanho das linhas inativas em relação à ativa (português)
  const ESCALA_MIN_HE = 0.58;   // idem para hebraico (cada linha leva transliteração e tradução, é mais alta)
  const OPACIDADE_MIN = 0.42;

  function criar(raiz, musica, cfg) {
    const { linhas, estrofes } = musica;
    const H = cfg.altura;

    const caixas = estrofes.map((e) => {
      const caixa = document.createElement('div');
      caixa.className = 'estrofe';
      let nPalavra = 0;
      const ls = e.linhas.map((i) => {
        const l = linhas[i];
        const div = document.createElement('div');
        div.className = 'linha ' + (l.hebraico ? 'he' : 'pt');
        const pr = document.createElement('div');
        pr.className = 'principal';
        if (l.hebraico) pr.setAttribute('dir', 'rtl');
        const pals = l.palavras.map((p) => {
          const s = document.createElement('span');
          s.className = 'pal' + (p.destaque ? ' dest' : '');
          for (const c of ['brilho', 'base', 'luz']) {
            const x = document.createElement('span');
            x.className = c; x.textContent = p.txt; s.appendChild(x);
          }
          pr.appendChild(s);
          return { el: s, luz: s.querySelector('.luz'), brilho: s.querySelector('.brilho'), p, ordem: nPalavra++ };
        });
        div.appendChild(pr);
        let tr = null, td = null;
        if (l.hebraico && l.translit) {
          tr = document.createElement('div'); tr.className = 'translit'; tr.textContent = l.translit; div.appendChild(tr);
        }
        if (l.traducao) {
          td = document.createElement('div'); td.className = 'traducao'; td.textContent = l.traducao; div.appendChild(td);
        }
        caixa.appendChild(div);
        return { el: div, l, pals, extras: [tr, td].filter(Boolean), altura: 0, act: 0 };
      });
      raiz.appendChild(caixa);
      return { el: caixa, e, ls };
    });

    // medir a altura natural de cada linha (sem transformações)
    for (const c of caixas) {
      c.el.style.visibility = 'hidden';
      for (const L of c.ls) L.altura = L.el.offsetHeight;
    }

    // ---------------------------------------------------------------- quadro
    function atualizar(t, A) {
      let visMax = 0;
      caixas.forEach((C, k) => {
        const e = C.e;
        const ant = estrofes[k - 1];
        const tEnt = Math.max(e.ini - 0.32, ant ? ant.fim + 0.02 : -1e9);
        const tSai = e.fim - 0.04;
        if (t < tEnt - 0.05 || t > tSai + 0.8) { C.el.style.visibility = 'hidden'; return; }

        // entrada e saída da estrofe inteira
        const de = clamp((t - tEnt) / 0.5);
        const ds = clamp((t - tSai) / 0.55);
        const opac = ease.outCubic(clamp((t - tEnt) / 0.32)) * (1 - ease.inOutCubic(ds));
        const desl = (1 - ease.outQuart(de)) * 30 * cfg.u - ease.inOutCubic(ds) * 56 * cfg.u;
        const desf = ((1 - de) * 12 + ds * 12) * cfg.u;
        C.el.style.visibility = 'visible';
        C.el.style.opacity = opac.toFixed(3);
        C.el.style.filter = desf > 0.2 ? `blur(${desf.toFixed(2)}px)` : 'none';
        visMax = Math.max(visMax, opac);

        // ativação de cada linha
        const n = C.ls.length;
        C.ls.forEach((L, j) => {
          const on = mola(t - (L.l.ini - 0.10), 2.8, 0.72);
          const off = j === n - 1 ? 0 : smooth(L.l.fim - 0.02, L.l.fim + 0.38, t);
          L.act = Math.max(0, on) * (1 - off);
        });

        // pilha: tamanhos, posições e "rolagem" pelo centro ponderado pela ativação
        const gap0 = 24 * cfg.u;
        const esc0 = C.ls.map((L) => lerp(L.l.hebraico ? ESCALA_MIN_HE : ESCALA_MIN, 1, clamp(L.act)) + 0.03 * Math.max(0, L.act - 1));
        // se a pilha não cabe no céu (ex.: 4 linhas em hebraico com transliteração e tradução), reduz tudo junto
        const altTotal = C.ls.reduce((s, L, j) => s + L.altura * esc0[j], 0) + gap0 * (n - 1);
        const fit = Math.min(1, ((cfg.limiteInferior - cfg.limiteSuperior) * H) / altTotal);
        const esc = esc0.map((e) => e * fit);
        const gap = gap0 * fit;
        let cur = 0, sw = 0, sc = 0;
        const meios = C.ls.map((L, j) => {
          const h = L.altura * esc[j];
          const m = cur + h / 2;
          cur += h + gap;
          const w = clamp(L.act);
          sw += w; sc += w * m;
          return m;
        });
        const centroPilha = (cur - gap) / 2;
        const centro = lerp(centroPilha, sc / Math.max(sw, 1e-6), clamp(sw));
        const yAncora = cfg.ancora * H;
        // mantém a pilha inteira dentro da área segura (não corta no topo nem cai sobre os personagens)
        const topo = yAncora + (meios[0] - (C.ls[0].altura * esc[0]) / 2 - centro);
        const base = yAncora + (meios[n - 1] + (C.ls[n - 1].altura * esc[n - 1]) / 2 - centro);
        let ajuste = 0;
        if (base > cfg.limiteInferior * H) ajuste = cfg.limiteInferior * H - base;
        if (topo + ajuste < cfg.limiteSuperior * H) ajuste = cfg.limiteSuperior * H - topo;

        C.ls.forEach((L, j) => {
          const a = clamp(L.act);
          const yc = yAncora + (meios[j] - centro) + desl + ajuste;
          L.el.style.transform = `translate(0px, ${(yc - L.altura / 2).toFixed(2)}px) scale(${esc[j].toFixed(4)})`;
          L.el.style.opacity = lerp(OPACIDADE_MIN, 1, a).toFixed(3);
          const bl = (1 - a) * 1.6 * cfg.u;
          L.el.style.filter = bl > 0.15 ? `blur(${bl.toFixed(2)}px)` : 'none';
          for (const x of L.extras) x.style.opacity = lerp(0.78, 1, a).toFixed(3);

          const rtl = L.l.hebraico;
          L.pals.forEach((W) => {
            const p = W.p;
            const prog = ease.inOutSine(clamp((t - p.ini) / Math.max(0.05, p.fim - p.ini)));
            const resto = ((1 - prog) * 100).toFixed(2);
            W.luz.style.clipPath = rtl ? `inset(-40% -40% -40% ${resto}%)` : `inset(-40% ${resto}% -40% -40%)`;
            // "pulo" de mola no instante em que a palavra é cantada
            const dt = t - p.ini;
            const pulo = dt >= 0 && dt < 1.2 ? Math.exp(-6 * dt) * Math.cos(15 * dt) : 0;
            const sc2 = 1 + (p.destaque ? 0.10 : 0.045) * pulo * a;
            // entrada das palavras em cascata
            const dEnt = t - (tEnt + W.ordem * 0.05);
            const pe = mola(dEnt, 2.6, 0.72);
            const ty = (1 - pe) * 26 * cfg.u;
            W.el.style.transform = `translateY(${ty.toFixed(2)}px) scale(${sc2.toFixed(4)})`;
            W.el.style.opacity = clamp(dEnt / 0.25).toFixed(3);
            // brilho atrás da palavra acesa, mais forte com a música
            const forca = prog * a * (0.20 + 0.55 * A.energia + (p.destaque ? 0.25 : 0) + 0.2 * A.pulso);
            W.brilho.style.opacity = clamp(forca).toFixed(3);
          });
        });
      });
      return visMax;
    }

    return { atualizar };
  }

  G.Legenda = { criar };
})(window);
