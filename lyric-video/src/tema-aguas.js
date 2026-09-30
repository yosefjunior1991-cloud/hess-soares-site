// Tema "Sobre as Águas" (Gênesis 1:2 · Êxodo 14:21): o Espírito pairando sobre as águas (a pomba,
// que paira durante a música inteira), o vento oriental que se levanta e as fitas de vento, o mar se
// abrindo em um caminho seco entre paredes de água, o povo atravessando e o mar se acalmando de novo.
// Os momentos vêm do texto da própria legenda: os trechos que os disparam ficam em `animacao.json`, na
// pasta da música (`gatilhos.vento`, `mar_abre`, `mar_recua`, `sopros`), e não neste repositório público.
(function (G) {
  'use strict';
  const { clamp, lerp, smooth, mod, css, hash1, noise1, ease } = G.U;
  const L = G.Lago, ALT = L.ALT, HOR = L.HOR, TAU = L.TAU;
  const semNikud = (s) => s.normalize('NFD').replace(/[֑-ׇ]/g, '').replace(/[̀-ͯ]/g, '');

  function brilho4(ctx, x, y, r) {
    ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r);
    ctx.closePath(); ctx.fill();
  }

  // ---------------------------------------------------------------- peregrinos (o povo que atravessa)
  function peregrino(ctx, P, x, y, h, cor, fase, cajado, alfa) {
    const w = h * 0.42;
    const bob = Math.abs(Math.sin(fase)) * h * 0.02, sway = Math.sin(fase) * h * 0.022;
    ctx.save(); ctx.translate(x + sway, y - bob);
    ctx.fillStyle = css(P.acoSombra, 0.16 * alfa);
    ctx.beginPath(); ctx.ellipse(0, bob, w * 0.6, h * 0.05, 0, 0, TAU); ctx.fill();
    const claro = cor, escuro = L.aj(cor, -0.11);
    if (cajado) {
      ctx.strokeStyle = css(L.aj(P.junco, -0.2), alfa); ctx.lineWidth = Math.max(1.2, h * 0.024); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(w * 0.52, -h * 0.02); ctx.lineTo(w * 0.56, -h * 1.0); ctx.quadraticCurveTo(w * 0.56, -h * 1.1, w * 0.4, -h * 1.06); ctx.stroke();
    }
    const manto = () => {
      ctx.beginPath();
      ctx.moveTo(-w * 0.3, -h * 0.66);
      ctx.quadraticCurveTo(-w * 0.56, -h * 0.25, -w * 0.5, 0);
      ctx.quadraticCurveTo(0, h * 0.035 + Math.sin(fase * 2) * h * 0.012, w * 0.5, 0);
      ctx.quadraticCurveTo(w * 0.56, -h * 0.25, w * 0.3, -h * 0.66);
      ctx.quadraticCurveTo(0, -h * 0.73, -w * 0.3, -h * 0.66);
      ctx.closePath();
    };
    ctx.fillStyle = css(claro, alfa); manto(); ctx.fill();
    ctx.save(); manto(); ctx.clip();
    ctx.fillStyle = css(escuro, 0.5 * alfa); ctx.fillRect(w * 0.04, -h, w, h * 1.1);
    ctx.restore();
    ctx.fillStyle = css(L.aj(cor, -0.06), alfa);                       // capuz / manto da cabeça
    ctx.beginPath(); ctx.ellipse(0, -h * 0.79, h * 0.105, h * 0.115, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = css(escuro, 0.45 * alfa);
    ctx.beginPath(); ctx.ellipse(h * 0.03, -h * 0.79, h * 0.06, h * 0.105, 0, -Math.PI / 2, Math.PI / 2); ctx.fill();
    ctx.restore();
  }

  function criar(musica, parte, W) {
    const P = G.LagoPaleta;
    const dur = parte.duracao;
    const linhas = musica.linhas.filter((l) => l.parte === parte.indice)
      .map((l) => ({ a: l.ini - parte.inicio, b: l.fim - parte.inicio, txt: semNikud(l.texto) + ' ' + (l.traducao || '') }));
    const gat = parte.gatilhos || {};
    const rx = (k, extra) => { const src = [extra, gat[k]].filter(Boolean).join('|'); return src ? new RegExp(src, 'i') : null; };
    const achar = (re, n, padrao) => { if (!re) return padrao; const r = linhas.filter((l) => re.test(l.txt)); return r[n || 0] ? r[n || 0].a : padrao; };
    const tVento = achar(rx('vento'), 0, 131);
    const tMar = achar(rx('mar_abre'), 0, 141.6);
    const tRecuar = achar(rx('mar_recua'), 0, 180.7);
    const tFecha = dur - 46;
    const tPovo0 = tRecuar + 6, tPovo1 = tFecha - 2;
    const rxSopro = rx('sopros', 'קדים');                       // "קדים" = vento oriental (Êxodo 14:21)
    const sopros = linhas.filter((l) => rxSopro.test(l.txt));

    const ventoEm = (tl) => {
      const base = (0.10 + 0.36 * smooth(tVento - 4, tVento + 6, tl) + 0.40 * smooth(tRecuar - 2, tRecuar + 12, tl)) * (1 - 0.8 * smooth(tFecha, tFecha + 25, tl));
      let b = 0;
      for (const l of sopros) b = Math.max(b, 0.45 * smooth(l.a - 0.5, l.a + 0.7, tl) * (1 - smooth(l.b, l.b + 1.6, tl)));
      return clamp(base + b);
    };
    const progEm = (tl) => {
      const abre = 0.55 * smooth(tMar - 0.5, tMar + 15, tl) + 0.45 * smooth(tRecuar, tRecuar + 19, tl);
      return abre * (1 - smooth(tFecha, tFecha + 28, tl));
    };

    function estado(tl) {
      return {
        fx: 0.68,
        calor: 0.04 + 0.80 * smooth(6, 215, tl),
        peso: 0.30 * (1 - smooth(15, 110, tl)),
        nevoa: 0.92 - 0.50 * smooth(30, 200, tl) + 0.06 * Math.sin(tl * 0.05),
        vento: ventoEm(tl),
        solY: lerp(HOR + 44, 0.41 * ALT, ease.inOutSine(smooth(8, 190, tl))) - 0.06 * ALT * smooth(200, dur, tl),
        solForca: 0.45 + 0.55 * smooth(0, 55, tl),
        raios: 0.12 + 0.75 * smooth(130, 235, tl),
        motes: 0.45 + 0.3 * smooth(130, 200, tl),
        prog: progEm(tl),
        pomba: smooth(8, 14, tl) * (1 - smooth(dur - 15, dur - 6, tl)),
        subida: smooth(dur - 18, dur - 4, tl),
        flash: 0,
      };
    }

    // ---------------------------------------------------------------- mar aberto: caminho seco entre paredes de água
    const PESSOAS = [
      { d: -0.46, o: 0.070, cor: P.rosa, c: 0 }, { d: -0.14, o: 0.0, cor: L.ml(P.teal, P.branco, 0.15), c: 1 }, { d: 0.22, o: 0.028, cor: P.nuvP, c: 0 },
      { d: 0.50, o: 0.058, cor: P.creme, c: 0 }, { d: -0.32, o: 0.092, cor: L.ml(P.teal, P.nuvP, 0.4), c: 0 }, { d: 0.05, o: 0.11, cor: P.rosa, c: 0 },
      { d: 0.34, o: 0.128, cor: L.ml(P.teal, P.branco, 0.3), c: 0 },
    ];
    function trincheira(ctx, S) {
      const pr = S.prog;
      if (pr < 0.004) return;
      const Vx = S.solX;
      const e = ease.inOutCubic(pr);
      const sF = 1.32 * e;
      const HW = 0.25 * S.W;
      const HT = 400 * smooth(0.02, 0.6, pr);
      const n = 40;
      const ys = (s) => HOR + s * (ALT - HOR);
      const prof = (s) => HT * Math.pow(clamp((sF - s) / 0.30), 0.6);
      const S_ = [], yf = [];
      for (let i = 0; i <= n; i++) { const s = sF * i / n; S_.push(s); yf.push(ys(s) + s * prof(s)); }
      const sol = S.solForca;
      ctx.save();
      ctx.globalAlpha = smooth(0.004, 0.10, pr);

      // leito seco (areia pastel iluminada pelo sol)
      ctx.save();
      ctx.beginPath(); ctx.moveTo(Vx, HOR);
      for (let i = 1; i <= n; i++) ctx.lineTo(Vx - S_[i] * HW, yf[i]);
      const xl = Vx - sF * HW, xr = Vx + sF * HW, yfn = yf[n];
      ctx.bezierCurveTo(xl + (xr - xl) * 0.25, yfn + 28, xl + (xr - xl) * 0.75, yfn + 28, xr, yfn);
      for (let i = n; i >= 1; i--) ctx.lineTo(Vx + S_[i] * HW, yf[i]);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, HOR, 0, ALT);
      g.addColorStop(0, css(L.ml(P.ouro, P.branco, 0.4))); g.addColorStop(0.32, css(L.ml(P.margem, P.ouro, 0.4))); g.addColorStop(1, css(L.ml(P.margem, P.junco, 0.45)));
      ctx.fillStyle = g; ctx.fill();
      ctx.clip();
      L.brilhoRadial(ctx, Vx, HOR + 14, 420, P.branco, 0.55 * sol);
      ctx.strokeStyle = css(P.creme, 0.42); ctx.lineWidth = 1.6;
      for (let j = 0; j < 16; j++) {                                      // marcas de ondulação na areia molhada
        const s = 0.05 + sF * 0.95 * Math.pow(hash1(j * 3.7), 0.8);
        const hw = s * HW * 0.78, y = ys(s) + s * prof(s) * 0.92;
        ctx.beginPath();
        for (let k = 0; k <= 12; k++) { const u = k / 12; const x = Vx + (u * 2 - 1) * hw; const yy = y + Math.sin(u * 14 + j) * 2 * s; k ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); }
        ctx.stroke();
      }
      ctx.restore();

      // paredes de água (faces internas, vistas em perspectiva)
      const fundoP = L.aj(P.aguaP, -0.05), topoP = L.ml(P.teal, P.branco, 0.52);
      for (const lado of [-1, 1]) {
        for (let i = 0; i < n; i++) {
          const s0 = S_[i], s1 = Math.min(sF, S_[i + 1] + 0.004);
          const x0 = Vx + lado * s0 * HW, x1 = Vx + lado * s1 * HW;
          const ya = ys(s0), yb = yf[i], yc = ys(s1), yd = yf[Math.min(n, i + 1)];
          const gg = ctx.createLinearGradient(0, ya, 0, yb + 1);
          gg.addColorStop(0, css(topoP)); gg.addColorStop(0.35, css(L.ml(topoP, fundoP, 0.5))); gg.addColorStop(1, css(fundoP));
          ctx.fillStyle = gg;
          ctx.beginPath(); ctx.moveTo(x0, ya); ctx.lineTo(x1, yc); ctx.lineTo(x1, yd); ctx.lineTo(x0, yb); ctx.closePath(); ctx.fill();
        }
        // correntes de luz descendo pela parede
        ctx.lineCap = 'round';
        for (let k = 0; k < 30; k++) {
          const s = sF * (0.04 + 0.92 * hash1(k * 5.3 + lado));
          if (s > sF - 0.02) continue;
          const x = Vx + lado * s * HW, pf = prof(s) * s;
          const ph = mod(S.t * (0.25 + 0.3 * hash1(k * 1.3)) + hash1(k * 8.1), 1);
          const y0 = ys(s) + pf * ph * 0.8, y1 = y0 + pf * 0.2;
          ctx.strokeStyle = css(P.branco, 0.42 * Math.sin(ph * Math.PI)); ctx.lineWidth = 0.8 + 2.4 * s;
          ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();
        }
        // espuma na borda superior
        for (let k = 0; k < 52; k++) {
          const s = sF * ((k + hash1(k * 2.2 + lado * 3)) / 52);
          if (s < 0.01) continue;
          const x = Vx + lado * s * HW, y = ys(s) - 1;
          const r = (2.2 + 7.5 * s) * (0.65 + 0.35 * Math.sin(S.t * 1.6 + k * 1.9));
          ctx.fillStyle = css(P.branco, 0.86); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
        }
      }
      // espuma na frente (onde o mar ainda se abre)
      ctx.strokeStyle = css(P.branco, 0.8); ctx.lineWidth = 3.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(xl, yfn);
      ctx.bezierCurveTo(xl + (xr - xl) * 0.25, yfn + 28, xl + (xr - xl) * 0.75, yfn + 28, xr, yfn); ctx.stroke();
      ctx.restore();
    }

    function povo(ctx, S) {
      const tl = S.tl;
      const g = clamp((tl - tPovo0) / (tPovo1 - tPovo0));
      if (g <= 0 || g >= 1 || S.prog < 0.5) return;
      const sLead = lerp(0.72, 0.065, ease.inOutSine(g));
      const Vx = S.solX, HW = 0.25 * S.W, HT = 400 * smooth(0.02, 0.6, S.prog);
      const lista = PESSOAS.map((p, i) => ({ p, i, s: sLead + p.o })).sort((a, b) => a.s - b.s);
      for (const { p, i, s } of lista) {
        const y = HOR + s * (ALT - HOR) + s * HT;
        if (y > ALT + 120) continue;
        const x = Vx + p.d * s * HW * 0.9;
        const alfa = smooth(0.05, 0.13, s);
        peregrino(ctx, P, x, y, 172 * s, p.cor, tl * 5.2 + i * 1.7, p.c === 1, alfa);
      }
    }

    // ---------------------------------------------------------------- pomba (o Espírito) e vento
    function pomba(ctx, S) {
      const a = S.pomba;
      if (a < 0.01) return;
      const { tl, W } = S;
      const u = ease.inOutCubic(S.subida);
      let x = W * 0.30 + 44 * Math.sin(tl * 0.23), y = 0.685 * ALT + 10 * Math.sin(tl * 0.61) + 6 * Math.sin(tl * 1.3);
      x = lerp(x, S.solX, u * 0.85); y = lerp(y, S.solY - 30, u);
      const esc = 1.7 * (1 - 0.45 * u) * (0.85 + 0.15 * a);
      // reflexo de luz na água embaixo (anéis que se abrem)
      const yAgua = 0.775 * ALT;
      for (let k = 0; k < 3; k++) {
        const f = mod(tl * 0.28 + k / 3, 1);
        ctx.strokeStyle = css(P.creme, 0.55 * (1 - f) * a * (1 - u)); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(x, yAgua, 30 + 250 * f, 5 + 38 * f, 0, 0, TAU); ctx.stroke();
      }
      L.brilhoRadial(ctx, x, y - 4, 230 * (1 - 0.3 * u), P.creme, 0.5 * a * (0.75 + 0.25 * S.A.energia));
      ctx.save();
      ctx.shadowColor = css(L.aj(P.margem, -0.25), 0.42 * a); ctx.shadowBlur = 14; ctx.shadowOffsetY = 5;
      G.Personagens.pomba(ctx, S, x, y, esc * a, { fase: tl * 4.6, bate: 0.5 + 0.5 * Math.sin(tl * 4.6), rot: -0.05 + 0.04 * Math.sin(tl * 0.7) - 0.25 * u });
      ctx.restore();
      ctx.fillStyle = css(P.branco, 0.9 * a);
      for (let i = 0; i < 9; i++) {                                     // faíscas de luz em volta
        const an = tl * 0.55 + (i / 9) * TAU, r = 88 + 26 * Math.sin(tl * 0.9 + i * 2);
        const tw = 0.4 + 0.6 * Math.max(0, Math.sin(tl * 2.1 + i * 3.3));
        ctx.globalAlpha = tw; brilho4(ctx, x + Math.cos(an) * r * 1.5, y + Math.sin(an) * r * 0.6, 5 + 5 * tw); ctx.globalAlpha = 1;
      }
    }
    function fitas(ctx, S) {
      const v = S.vento;
      if (v < 0.06) return;
      const Wd = S.W;
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (let i = 0; i < 11; i++) {
        const per = 3.0 + 3.6 * hash1(i * 4.1) - 1.2 * v;
        const u = mod(S.t / per + hash1(i * 9.3), 1);
        const y0 = ALT * (0.20 + 0.68 * hash1(i * 2.7 + 1));
        const amp = 14 + 34 * hash1(i * 5.5);
        const comp = 280 + 420 * hash1(i * 7.7);
        const xh = lerp(Wd + comp * 0.3, -comp * 1.1, u);
        const ap = v * 0.8 * smooth(0, 0.12, u) * (1 - smooth(0.85, 1, u));
        if (ap < 0.02) continue;
        const gr = ctx.createLinearGradient(xh, 0, xh + comp, 0);
        gr.addColorStop(0, css(P.branco, ap)); gr.addColorStop(0.55, css(P.branco, ap * 0.4)); gr.addColorStop(1, css(P.branco, 0));
        ctx.strokeStyle = gr;
        for (const [lw, dy] of [[5, 0], [2, 0]]) {
          ctx.lineWidth = lw * (0.7 + 0.6 * v);
          ctx.beginPath();
          for (let k = 0; k <= 30; k++) {
            const f = k / 30;
            const x = xh + f * comp, y = y0 + dy + amp * Math.sin(f * 5.5 + i * 2 + S.t * 1.1) * (0.25 + f) + (f < 0.14 ? -16 * Math.sin(f / 0.14 * Math.PI) * (1 - f / 0.14) : 0);
            k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
          }
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    return {
      espelho: false,
      estado,
      agua(ctx, S) { trincheira(ctx, S); povo(ctx, S); },
      frente(ctx, S) { fitas(ctx, S); pomba(ctx, S); },
    };
  }

  G.TemaAguas = { criar };
})(window);
