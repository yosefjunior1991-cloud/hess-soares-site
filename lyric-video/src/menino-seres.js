// Peças desenhadas do tema "Um Menino Nos Nasceu": a estrela, a gruta com a manjedoura (o Menino é uma trouxinha de luz,
// sem rosto), o manto do governo, os quatro emblemas dos nomes (a lâmpada e o pergaminho, a luz poderosa, o laço da
// eternidade, o ramo de oliveira), o jugo que se parte e o trono de Davi com a lira. Tudo em tons pastéis, desenhado em
// código; cada função desenha em coordenadas locais (base em y = 0, salvo onde dito).
(function (G) {
  'use strict';
  const { clamp, lerp, smooth, css, rgb, hash1 } = G.U;
  const R = G.Seres91, ml = R.ml, brilhoRadial = R.brilhoRadial, brilho4 = R.brilho4;
  const S2 = G.SeresS2, K = Object.assign({}, S2.K, {
    pano: rgb('#fff8ec'), panoSom: rgb('#ecdcc6'), feno: rgb('#f0d49a'), fenoEsc: rgb('#dcb878'), pedraG: rgb('#e6d6e0'), pedraGSom: rgb('#c8b8cc'),
    veludo: rgb('#e9cdf2'), veludoSom: rgb('#cfa9e0'), madeiraM: rgb('#dcb890'), madeiraMEsc: rgb('#c09a72'), folhaO: rgb('#a9d6bd'),
  });
  const TAU = Math.PI * 2;

  // ---------------------------------------------------------------- estrela de Belém (centro em 0,0); luz 0..1
  function estrela(ctx, x, y, s, o) {
    o = o || {};
    const A = o.alfa === undefined ? 1 : o.alfa, br = clamp(o.brilho === undefined ? 1 : o.brilho), t = o.t || 0;
    if (A < 0.01) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= A; ctx.globalCompositeOperation = 'lighter';
    brilhoRadial(ctx, 0, 0, 260 + 80 * br, K.luzOuro, 0.45 * (0.5 + 0.5 * br));
    brilhoRadial(ctx, 0, 0, 90, K.luz, 0.7);
    ctx.rotate(Math.sin(t * 0.6) * 0.04);
    ctx.fillStyle = css(K.luz, 0.95); brilho4(ctx, 0, 0, 110 + 40 * br);
    ctx.save(); ctx.rotate(Math.PI / 4); ctx.fillStyle = css(K.luzOuro, 0.8); brilho4(ctx, 0, 0, 62 + 20 * br); ctx.restore();
    ctx.restore();
  }

  // ---------------------------------------------------------------- a manjedoura com o Menino (trouxinha de luz); luz 0..1
  function manjedoura(ctx, x, y, s, o) {
    o = o || {};
    const luz = clamp(o.luz || 0), A = o.alfa === undefined ? 1 : o.alfa, t = o.t || 0, pres = clamp(o.presenca === undefined ? 1 : o.presenca);
    if (A < 0.01) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= A;
    ctx.fillStyle = css(rgb('#8f86b8'), 0.16); ctx.beginPath(); ctx.ellipse(0, 4, 120, 10, 0, 0, TAU); ctx.fill();
    // pernas em X
    ctx.strokeStyle = css(K.madeiraMEsc); ctx.lineWidth = 9; ctx.lineCap = 'round';
    for (const dx of [-52, 52]) { ctx.beginPath(); ctx.moveTo(dx - 26, 0); ctx.lineTo(dx + 26, -48); ctx.moveTo(dx + 26, 0); ctx.lineTo(dx - 26, -48); ctx.stroke(); }
    // o Menino: uma trouxinha de pano com luz dentro
    if (pres > 0.01) {
      ctx.save(); ctx.globalAlpha *= pres;
      brilhoRadial(ctx, 0, -70, 150 + 70 * luz, K.luzOuro, 0.45 + 0.4 * luz);
      brilhoRadial(ctx, 0, -66, 60, K.luz, 0.7);
      const respira = 1 + 0.015 * Math.sin(t * 1.6);
      ctx.save(); ctx.translate(0, -62); ctx.scale(respira, respira);
      ctx.fillStyle = css(K.panoSom); ctx.beginPath(); ctx.ellipse(2, 4, 62, 22, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = css(K.pano); ctx.beginPath(); ctx.ellipse(0, 0, 60, 21, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = css(K.luz); ctx.beginPath(); ctx.arc(-34, -8, 17, 0, TAU); ctx.fill();            // a cabecinha, coberta de luz
      ctx.strokeStyle = css(K.panoSom, 0.9); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-14, -14); ctx.quadraticCurveTo(10, 4, 44, -6); ctx.moveTo(-10, 6); ctx.quadraticCurveTo(14, 14, 46, 6); ctx.stroke();
      ctx.restore(); ctx.restore();
    }
    // a cocho, com feno
    ctx.fillStyle = css(K.feno); ctx.beginPath(); ctx.ellipse(0, -56, 92, 14, 0, 0, TAU); ctx.fill();
    if (pres < 0.99) { ctx.fillStyle = css(K.fenoEsc); ctx.beginPath(); ctx.ellipse(0, -54, 84, 11, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = css(K.madeiraM); ctx.beginPath(); ctx.moveTo(-100, -56); ctx.lineTo(100, -56); ctx.lineTo(80, -20); ctx.lineTo(-80, -20); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = css(K.madeiraMEsc, 0.8); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-96, -46); ctx.lineTo(96, -46); ctx.moveTo(-90, -34); ctx.lineTo(90, -34); ctx.stroke();
    ctx.fillStyle = css(K.feno); ctx.beginPath(); ctx.ellipse(0, -57, 98, 9, 0, Math.PI, 0); ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------------- a gruta (arco de pedra e telhado de madeira), com a luz de dentro; luz 0..1
  function gruta(ctx, x, y, s, o) {
    o = o || {};
    const luz = clamp(o.luz || 0), A = o.alfa === undefined ? 1 : o.alfa, tint = o.tint || ((c) => c);
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= A;
    // pedra do arco
    ctx.fillStyle = css(tint(K.pedraGSom, 1)); ctx.beginPath(); ctx.moveTo(-250, 0); ctx.quadraticCurveTo(-262, -230, -120, -300); ctx.quadraticCurveTo(0, -350, 120, -300); ctx.quadraticCurveTo(262, -230, 250, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = css(tint(K.pedraG, 1)); ctx.beginPath(); ctx.moveTo(-230, 0); ctx.quadraticCurveTo(-244, -218, -110, -284); ctx.quadraticCurveTo(0, -330, 110, -284); ctx.quadraticCurveTo(244, -218, 230, 0); ctx.closePath(); ctx.fill();
    // o interior aceso
    const g = ctx.createRadialGradient(0, -80, 10, 0, -80, 240);
    g.addColorStop(0, css(ml(K.luzOuro, K.luz, 0.4), 0.95)); g.addColorStop(0.55, css(K.fogo2, 0.9)); g.addColorStop(1, css(rgb('#d9b890'), 0.95));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-170, 0); ctx.quadraticCurveTo(-176, -170, -78, -214); ctx.quadraticCurveTo(0, -246, 78, -214); ctx.quadraticCurveTo(176, -170, 170, 0); ctx.closePath(); ctx.fill();
    if (luz > 0.01) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; brilhoRadial(ctx, 0, -90, 260 + 120 * luz, K.luzOuro, 0.4 * luz); ctx.restore(); }
    // viga e palha do telhado
    ctx.strokeStyle = css(K.madeiraMEsc); ctx.lineWidth = 10; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-210, -10); ctx.lineTo(-210, -190); ctx.moveTo(210, -10); ctx.lineTo(210, -190); ctx.stroke();
    ctx.fillStyle = css(tint(K.feno, 0.8)); ctx.beginPath(); ctx.moveTo(-250, -176); ctx.lineTo(0, -270); ctx.lineTo(250, -176); ctx.lineTo(230, -160); ctx.lineTo(0, -246); ctx.lineTo(-230, -160); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------------- o manto do governo: um manto de luz que paira (centro em 0,0, ~200 de largura)
  function manto(ctx, x, y, s, o) {
    o = o || {};
    const A = o.alfa === undefined ? 1 : o.alfa, br = clamp(o.brilho || 0), t = o.t || 0;
    if (A < 0.01) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= A;
    brilhoRadial(ctx, 0, 30, 230, K.luzOuro, 0.3 + 0.3 * br);
    const sw = Math.sin(t * 1.4) * 5;
    const g = ctx.createLinearGradient(0, -40, 0, 170);
    g.addColorStop(0, css(K.veludo)); g.addColorStop(1, css(K.veludoSom));
    ctx.fillStyle = g; ctx.beginPath();
    ctx.moveTo(-72, -34); ctx.quadraticCurveTo(0, -62, 72, -34); ctx.quadraticCurveTo(110 + sw, 60, 96 + sw, 170);
    ctx.quadraticCurveTo(48, 150 + sw, 0, 172); ctx.quadraticCurveTo(-48, 150 - sw, -96 - sw, 170); ctx.quadraticCurveTo(-110 - sw, 60, -72, -34); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = css(K.veludoSom, 0.7); ctx.lineWidth = 3;
    for (const dx of [-48, -16, 16, 48]) { ctx.beginPath(); ctx.moveTo(dx * 0.8, -30); ctx.quadraticCurveTo(dx * 1.2, 70, dx * 1.35, 160); ctx.stroke(); }
    ctx.fillStyle = css(K.luz, 0.85); ctx.beginPath(); ctx.ellipse(0, -44, 70, 12, 0, Math.PI, 0); ctx.fill();            // gola de pele clara
    ctx.fillStyle = css(K.ouroForte); ctx.beginPath(); ctx.arc(0, -36, 10, 0, TAU); ctx.fill(); ctx.fillStyle = css(K.luz, 0.9); ctx.beginPath(); ctx.arc(-3, -39, 3.5, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------------- emblemas dos nomes: 0 conselheiro (pergaminho e lâmpada), 1 poderoso (sol de luz),
  // 2 eternidade (laço), 3 paz (ramo de oliveira). Centro em 0,0.
  function emblema(ctx, k, x, y, s, a, t) {
    if (a < 0.01) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= a;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; brilhoRadial(ctx, 0, 0, 240, K.luzOuro, 0.5); brilhoRadial(ctx, 0, 0, 90, K.luz, 0.5); ctx.restore();
    if (k === 0) {
      ctx.fillStyle = css(K.papelClaro); ctx.beginPath(); ctx.roundRect(-70, -10, 140, 76, 8); ctx.fill();
      ctx.strokeStyle = css(K.cestoEsc, 0.7); ctx.lineWidth = 3;
      for (const yy of [8, 26, 44]) { ctx.beginPath(); ctx.moveTo(-52, yy); ctx.lineTo(52, yy); ctx.stroke(); }
      for (const dx of [-74, 74]) { ctx.fillStyle = css(K.madeiraM); ctx.beginPath(); ctx.roundRect(dx - 7, -18, 14, 92, 7); ctx.fill(); }
      ctx.fillStyle = css(K.luzOuro); ctx.beginPath(); ctx.moveTo(0, -78); ctx.quadraticCurveTo(24, -44, 0, -22); ctx.quadraticCurveTo(-24, -44, 0, -78); ctx.fill();
      ctx.fillStyle = css(K.luz); ctx.beginPath(); ctx.moveTo(0, -62); ctx.quadraticCurveTo(10, -46, 0, -34); ctx.quadraticCurveTo(-10, -46, 0, -62); ctx.fill();
    } else if (k === 1) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 12; i++) {
        const an = (i / 12) * TAU + t * 0.2, L = i % 2 ? 130 : 170, g = ctx.createLinearGradient(0, 0, Math.cos(an) * L, Math.sin(an) * L);
        g.addColorStop(0, css(K.luz, 0.8)); g.addColorStop(1, css(K.luzOuro, 0)); ctx.strokeStyle = g; ctx.lineWidth = i % 2 ? 9 : 14; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(Math.cos(an) * 36, Math.sin(an) * 36); ctx.lineTo(Math.cos(an) * L, Math.sin(an) * L); ctx.stroke();
      }
      ctx.restore();
      ctx.fillStyle = css(K.luzOuro); ctx.beginPath(); ctx.arc(0, 0, 44, 0, TAU); ctx.fill(); ctx.fillStyle = css(K.luz); ctx.beginPath(); ctx.arc(-6, -6, 30, 0, TAU); ctx.fill();
    } else if (k === 2) {
      ctx.strokeStyle = css(K.ouroForte); ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath();
      for (let i = 0; i <= 80; i++) { const u = (i / 80) * TAU, d = 1 + Math.sin(u) * Math.sin(u), px = 120 * Math.cos(u) / d, py = 120 * Math.sin(u) * Math.cos(u) / d * 1.5; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.stroke(); ctx.strokeStyle = css(K.luz, 0.9); ctx.lineWidth = 5; ctx.stroke();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = css(K.luz);
      for (let j = 0; j < 3; j++) { const u = t * 0.8 + j * 2.1, d = 1 + Math.sin(u) * Math.sin(u); brilho4(ctx, 120 * Math.cos(u) / d, 180 * Math.sin(u) * Math.cos(u) / d, 14); }
      ctx.restore();
    } else {
      ctx.strokeStyle = css(rgb('#a58e6a')); ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-100, 40); ctx.quadraticCurveTo(0, 70, 104, -10); ctx.stroke();
      for (let i = 0; i < 9; i++) {
        const u = (i + 0.5) / 9, bx = lerp(-100, 104, u), by = lerp(40, -10, u) + 28 * Math.sin(Math.PI * u) * 0.9, lado = i % 2 ? -1 : 1;
        ctx.save(); ctx.translate(bx, by); ctx.rotate(lado * 0.9 - 0.2); ctx.fillStyle = css(i % 2 ? K.folhaO : K.folha); ctx.beginPath(); ctx.ellipse(0, -16, 8, 20, 0, 0, TAU); ctx.fill(); ctx.restore();
      }
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- jugo de madeira (centro em 0,0); quebra 0..1
  function jugo(ctx, x, y, s, o) {
    o = o || {};
    const A = o.alfa === undefined ? 1 : o.alfa, q = clamp(o.quebra || 0);
    if (A < 0.01) return;
    const metade = (lado) => {
      ctx.save(); ctx.translate(lado * q * 36, q * q * 70); ctx.rotate(lado * q * 0.9); ctx.globalAlpha *= 1 - smooth(0.55, 1, q);
      ctx.fillStyle = css(K.madeiraM); ctx.beginPath(); ctx.moveTo(0, -12); ctx.quadraticCurveTo(lado * 56, -34, lado * 104, -18); ctx.lineTo(lado * 104, 0); ctx.quadraticCurveTo(lado * 56, -16, 0, 4); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = css(K.madeiraMEsc); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(lado * 72, -10); ctx.lineTo(lado * 72, 38); ctx.quadraticCurveTo(lado * 72, 58, lado * 50, 58); ctx.stroke();
      ctx.restore();
    };
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= A;
    if (q > 0.01 && q < 0.7) brilhoRadial(ctx, 0, -8, 160, K.luzOuro, 0.6 * Math.sin(Math.PI * q / 0.7));
    metade(-1); metade(1);
    ctx.restore();
  }

  // ---------------------------------------------------------------- trono de Davi com a lira (base em y = 0); luz 0..1
  function trono(ctx, x, y, s, o) {
    o = o || {};
    const A = o.alfa === undefined ? 1 : o.alfa, luz = clamp(o.luz || 0), t = o.t || 0;
    if (A < 0.01) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= A;
    brilhoRadial(ctx, 0, -150, 300 + 100 * luz, K.luzOuro, 0.35 + 0.35 * luz);
    ctx.fillStyle = css(rgb('#8f86b8'), 0.16); ctx.beginPath(); ctx.ellipse(0, 4, 150, 12, 0, 0, TAU); ctx.fill();
    const ouro = css(K.ouroForte), ouroC = css(K.luzOuro);
    ctx.fillStyle = css(K.pedraG); ctx.beginPath(); ctx.roundRect(-130, -20, 260, 20, 4); ctx.fill(); ctx.beginPath(); ctx.roundRect(-104, -42, 208, 22, 4); ctx.fill();
    ctx.fillStyle = ouro; ctx.beginPath(); ctx.roundRect(-70, -170, 140, 128, 10); ctx.fill();                 // assento e braços
    ctx.fillStyle = ouroC; ctx.beginPath(); ctx.roundRect(-58, -160, 116, 82, 8); ctx.fill();
    ctx.fillStyle = css(K.veludo); ctx.beginPath(); ctx.roundRect(-52, -100, 104, 40, 8); ctx.fill();
    ctx.fillStyle = ouro; ctx.beginPath(); ctx.moveTo(-76, -170); ctx.lineTo(-76, -270); ctx.quadraticCurveTo(0, -340, 76, -270); ctx.lineTo(76, -170); ctx.lineTo(60, -176); ctx.lineTo(60, -262); ctx.quadraticCurveTo(0, -310, -60, -262); ctx.lineTo(-60, -176); ctx.closePath(); ctx.fill();
    ctx.fillStyle = css(K.joiaRosa); ctx.beginPath(); ctx.arc(0, -290, 9, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------------- cajado de pastor (pé em 0,0), rot em rad
  function cajado(ctx, x, y, s, rot) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(rot || 0);
    ctx.strokeStyle = css(K.madeiraMEsc); ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -190); ctx.arc(-16, -190, 16, 0, -Math.PI * 1.1, true); ctx.stroke();
    ctx.restore();
  }

  G.SeresM = { K, estrela, manjedoura, gruta, manto, emblema, jugo, trono, cajado };
})(window);
