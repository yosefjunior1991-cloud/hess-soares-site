// Peças desenhadas do tema "Bênção Sacerdotal": o sacerdote (kohen) de frente, com o talit sobre a cabeça e as mãos no
// sinal da bênção (os dedos separados em V); a mão do sinal sozinha e o par de mãos no céu; o manto de luz (um talit de
// luz com listras azuis e franjas, que cobre quem caminha); a coluna de luz que guia; a fogueira, os dorminhocos sob a
// manta, a plataforma de pedra, pedras e arbustos do deserto, a aurora e a letra shin (ש). Deus não é retratado: a
// presença Dele é sempre luz. Tudo em tons pastéis, desenhado em código; cada função desenha em coordenadas locais
// (base em y = 0, salvo onde dito).
(function (G) {
  'use strict';
  const { clamp, lerp, smooth, mod, css, rgb, hash1 } = G.U;
  const R = G.Seres91, ml = R.ml, aj = R.aj, brilhoRadial = R.brilhoRadial, brilho4 = R.brilho4;
  const TAU = Math.PI * 2;
  const H = (hex) => rgb(hex);

  const K = Object.assign({}, G.SeresPN.K, {
    azul: H('#9fbdf0'), azulClaro: H('#d3e2fb'), tallit: H('#fffdf9'), tallitSom: H('#e6e1f2'),
    robe: H('#f1f3fc'), robeSom: H('#d5dbef'),
    pedraB: H('#f3e9d8'), pedraBSom: H('#decdb8'), areia: H('#f0dcc0'), areiaSom: H('#e2c9a6'), salvia: H('#b9d3b5'), salviaEsc: H('#9cbf9b'),
    fogo1: H('#ffb06a'), fogo2: H('#ffd68c'), fogo3: H('#fff4cf'), lenha: H('#b58d77'), fumaca: H('#f3eef8'),
  });
  const elipse = (ctx, x, y, rx, ry, rot, cor) => { ctx.fillStyle = cor; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, TAU); ctx.fill(); };
  const disco = (ctx, x, y, r, cor) => { ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };

  // ---------------------------------------------------------------- a mão do sinal sacerdotal (palma para a frente)
  // o: pg (+1 polegar do lado direito, -1 do esquerdo), cor, alfa
  function maoV(ctx, x, y, s, o) {
    const pg = o.pg || 1, A = o.alfa === undefined ? 1 : o.alfa, cor = o.cor || K.pele, som = o.som || K.peleSombra;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= A;
    const dedo = (x0, topo) => { ctx.beginPath(); ctx.roundRect(x0, topo, 6.2, -6 - topo + 8, 3.1); ctx.fill(); };
    ctx.fillStyle = css(cor);
    ctx.beginPath(); ctx.roundRect(-16.5, -6, 33, 29, 9); ctx.fill();                    // palma
    dedo(-16.5, -33); dedo(-9.6, -40); dedo(3.4, -40); dedo(10.3, -33);                  // dois dedos de cada lado, com o vão no meio
    ctx.save(); ctx.translate(pg * 19.5, 7); ctx.rotate(pg * 0.75); ctx.beginPath(); ctx.ellipse(0, 0, 5.4, 12.5, 0, 0, TAU); ctx.fill(); ctx.restore();   // polegar
    ctx.strokeStyle = css(som, 0.75); ctx.lineWidth = 1.2; ctx.lineCap = 'round';
    for (const xx of [-9.9, -3.4, 3.4, 9.9]) { ctx.beginPath(); ctx.moveTo(xx, -26); ctx.lineTo(xx, -3); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-8, 8); ctx.quadraticCurveTo(0, 13, 8, 8); ctx.stroke();
    ctx.restore();
  }
  // as duas mãos juntas (polegares se tocando), brilhando no céu
  function maosCeu(ctx, x, y, s, a, t) {
    if (a < 0.01) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    brilhoRadial(ctx, 0, -14, 190 * (0.9 + 0.1 * Math.sin(t * 2)), K.luzOuro, 0.6 * a);
    brilhoRadial(ctx, 0, -14, 80, K.luz, 0.75 * a);
    maoV(ctx, -22, 0, 1.55, { pg: 1, cor: ml(K.luz, K.luzOuro, 0.35), som: K.ouro, alfa: 0.9 * a });
    maoV(ctx, 22, 0, 1.55, { pg: -1, cor: ml(K.luz, K.luzOuro, 0.35), som: K.ouro, alfa: 0.9 * a });
    ctx.restore();
  }

  // ---------------------------------------------------------------- o sacerdote (kohen), de frente, base em y = 0 (~300 de altura)
  // o: bracos 0..1 (0 braços ao longo do corpo; 1 mãos erguidas no sinal), brilho 0..1, olhos 0..1 (abertos), t, alfa
  function kohen(ctx, x, y, s, o) {
    const br = clamp(o.bracos || 0), gl = clamp(o.brilho || 0), t = o.t || 0, A = o.alfa === undefined ? 1 : o.alfa;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= A;
    const cab = [0, -266], ombro = -232;
    const respira = Math.sin(t * 1.3) * 1.2;
    elipse(ctx, 0, 2, 70, 8, 0, css(K.sombra, 0.18));
    if (gl > 0.01) brilhoRadial(ctx, 0, -190, 260, K.luzOuro, 0.45 * gl);
    // túnica
    const gr = ctx.createLinearGradient(0, ombro, 0, 0);
    gr.addColorStop(0, css(K.robe)); gr.addColorStop(1, css(K.robeSom));
    ctx.fillStyle = gr; ctx.beginPath();
    ctx.moveTo(-36, ombro + 2); ctx.quadraticCurveTo(-50, -120, -60, -6); ctx.quadraticCurveTo(0, 6, 60, -6); ctx.quadraticCurveTo(50, -120, 36, ombro + 2);
    ctx.quadraticCurveTo(0, ombro - 10, -36, ombro + 2); ctx.fill();
    ctx.strokeStyle = css(K.robeSom, 0.8); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(0, ombro + 6); ctx.lineTo(0, -4); ctx.stroke();
    ctx.strokeStyle = css(K.ouro, 0.95); ctx.lineWidth = 5; ctx.lineCap = 'round';                       // faixa dourada
    ctx.beginPath(); ctx.moveTo(-43, -128); ctx.quadraticCurveTo(0, -118, 43, -128); ctx.stroke();
    for (const lado of [-1, 1]) { ctx.fillStyle = css(K.sandalia); ctx.beginPath(); ctx.ellipse(lado * 20, -1, 15, 6, 0, 0, TAU); ctx.fill(); }
    // painéis do talit caindo pelos lados (com listras azuis e franjas)
    const painel = (lado) => {
      ctx.save(); ctx.scale(lado, 1);
      const g = ctx.createLinearGradient(30, 0, 66, 0);
      g.addColorStop(0, css(K.tallit)); g.addColorStop(1, css(K.tallitSom));
      ctx.fillStyle = g; ctx.beginPath();
      ctx.moveTo(24, ombro - 4); ctx.quadraticCurveTo(62, ombro + 2, 66, ombro + 44); ctx.lineTo(60, -34 + respira * 0.3); ctx.lineTo(28, -38); ctx.quadraticCurveTo(34, -130, 24, ombro - 4); ctx.fill();
      ctx.strokeStyle = css(K.azul); ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(63, ombro + 40); ctx.lineTo(58, -34); ctx.stroke();
      ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(53, ombro + 38); ctx.lineTo(49, -36); ctx.stroke();
      ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(28, -38); ctx.lineTo(60, -34); ctx.stroke();
      ctx.strokeStyle = css(K.tallit, 0.95); ctx.lineWidth = 1.6;
      for (let k = 0; k < 7; k++) { const fx = 30 + k * 4.4; ctx.beginPath(); ctx.moveTo(fx, -36); ctx.lineTo(fx + Math.sin(t * 2 + k) * 1.2, -20 - (k % 2) * 4); ctx.stroke(); }
      ctx.restore();
    };
    painel(-1); painel(1);
    // braços (mangas do talit) e mãos
    const manga = (lado) => {
      const S = [lado * 38, ombro + 6];
      const Ed = [lado * 54, -156], Wd = [lado * 52, -100], Eu = [lado * 78, -204], Wu = [lado * 60, -246];
      const E = [lerp(Ed[0], Eu[0], br), lerp(Ed[1], Eu[1], br)], W = [lerp(Wd[0], Wu[0], br), lerp(Wd[1], Wu[1], br)];
      if (br < 0.02) return;                                                                          // em repouso o painel já cobre o braço
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = css(K.tallitSom); ctx.lineWidth = 29; ctx.beginPath(); ctx.moveTo(S[0], S[1]); ctx.lineTo(E[0], E[1]); ctx.lineTo(W[0], W[1]); ctx.stroke();
      ctx.strokeStyle = css(K.tallit); ctx.lineWidth = 25; ctx.beginPath(); ctx.moveTo(S[0], S[1]); ctx.lineTo(E[0], E[1]); ctx.lineTo(W[0], W[1]); ctx.stroke();
      ctx.strokeStyle = css(K.azul, 0.85); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(S[0] + lado * 8, S[1] + 4); ctx.lineTo(E[0] + lado * 8, E[1] + 2); ctx.lineTo(W[0] + lado * 8, W[1] + 6); ctx.stroke();
      return W;
    };
    const WL = manga(-1), WR = manga(1);
    for (const [lado, W] of [[-1, WL], [1, WR]]) {
      if (!W) continue;
      if (gl > 0.01) brilhoRadial(ctx, W[0], W[1] - 14, 70 + 40 * gl, K.luzOuro, 0.7 * gl);
      maoV(ctx, W[0], W[1] - 14, 0.95, { pg: -lado, alfa: clamp((br - 0.1) * 2.5) });
    }
    if (br < 0.5) for (const lado of [-1, 1]) disco(ctx, lado * 52, -98, 8.5, css(K.pele, 1 - br * 2));        // as mãos escondidas, de lado
    // colo do talit (com a atarah dourada) e capuz sobre a cabeça
    ctx.fillStyle = css(K.tallit); ctx.beginPath();
    ctx.moveTo(-40, ombro + 4); ctx.quadraticCurveTo(0, ombro - 20, 40, ombro + 4); ctx.lineTo(34, ombro + 28); ctx.quadraticCurveTo(0, ombro + 18, -34, ombro + 28); ctx.closePath(); ctx.fill();
    ctx.fillStyle = css(K.ouroForte); ctx.beginPath(); ctx.roundRect(-26, ombro - 6, 52, 9, 3); ctx.fill();
    ctx.fillStyle = css(K.luzOuro); ctx.fillRect(-20, ombro - 4, 40, 2.4);
    ctx.fillStyle = css(K.tallit);
    ctx.beginPath(); ctx.ellipse(cab[0], cab[1] - 2, 35, 39, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = css(K.tallitSom, 0.9); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cab[0], cab[1] - 2, 35, 39, 0, 0, TAU); ctx.stroke();
    // rosto
    disco(ctx, 0, cab[1] + 3, 20, css(K.pele));
    ctx.fillStyle = css(K.bochecha, 0.45); ctx.beginPath(); ctx.arc(-11, cab[1] + 10, 4.6, 0, TAU); ctx.arc(11, cab[1] + 10, 4.6, 0, TAU); ctx.fill();
    ctx.fillStyle = css(ml(K.barbaGrisalha, K.barba, 0.35));                                              // barba
    ctx.beginPath(); ctx.moveTo(-18, cab[1] + 8); ctx.quadraticCurveTo(-20, cab[1] + 36, 0, cab[1] + 38); ctx.quadraticCurveTo(20, cab[1] + 36, 18, cab[1] + 8);
    ctx.quadraticCurveTo(10, cab[1] + 20, 0, cab[1] + 19); ctx.quadraticCurveTo(-10, cab[1] + 20, -18, cab[1] + 8); ctx.fill();
    ctx.strokeStyle = css(K.olho); ctx.lineWidth = 1.9; ctx.lineCap = 'round';                            // olhos fechados, em oração
    const ab = clamp(o.olhos || 0);
    for (const lado of [-1, 1]) { ctx.beginPath(); if (ab < 0.5) ctx.arc(lado * 8, cab[1] - 1, 3.4, 0.25, Math.PI - 0.25); else ctx.arc(lado * 8, cab[1] - 3, 3.4, Math.PI + 0.25, TAU - 0.25); ctx.stroke(); }
    ctx.strokeStyle = css(K.boca); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-4, cab[1] + 13); ctx.quadraticCurveTo(0, cab[1] + 15.5, 4, cab[1] + 13); ctx.stroke();
    // borda do capuz sobre a testa, com a listra azul
    ctx.fillStyle = css(K.tallit); ctx.beginPath(); ctx.ellipse(cab[0], cab[1] - 17, 33, 20, 0, Math.PI, TAU); ctx.fill();
    ctx.strokeStyle = css(K.azul); ctx.lineWidth = 3.4; ctx.beginPath(); ctx.ellipse(cab[0], cab[1] - 14, 29, 17, 0, Math.PI * 1.06, Math.PI * 1.94); ctx.stroke();
    ctx.strokeStyle = css(K.tallitSom, 0.9); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(cab[0], cab[1] - 17, 33, 20, 0, Math.PI, TAU); ctx.stroke();
    ctx.restore();
  }

  // ---------------------------------------------------------------- plataforma de pedra em três degraus (base em y = 0, centro em x = 0)
  const ALT_PLAT = 118;
  function plataforma(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    elipse(ctx, 0, 4, 250, 14, 0, css(K.sombra, 0.16));
    const camadas = [[360, 44, 0], [282, 40, 44], [208, 34, 84]];
    for (const [w, h, y0] of camadas) {
      const g = ctx.createLinearGradient(0, -y0 - h, 0, -y0);
      g.addColorStop(0, css(ml(K.pedraB, K.branco, 0.45))); g.addColorStop(1, css(K.pedraB));
      ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-w / 2, -y0 - h, w, h, 5); ctx.fill();
      ctx.fillStyle = css(K.pedraBSom, 0.5); ctx.fillRect(w / 2 - w * 0.12, -y0 - h, w * 0.12, h);
      ctx.strokeStyle = css(K.pedraBSom, 0.85); ctx.lineWidth = 1.3;
      for (let c = 0; c < Math.round(w / 52); c++) { const bx = -w / 2 + c * 52 + (y0 % 2 ? 26 : 0); ctx.beginPath(); ctx.moveTo(bx, -y0 - h); ctx.lineTo(bx, -y0 - h * 0.45); ctx.moveTo(bx + 26, -y0 - h * 0.45); ctx.lineTo(bx + 26, -y0); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(-w / 2, -y0 - h * 0.45); ctx.lineTo(w / 2, -y0 - h * 0.45); ctx.stroke();
      ctx.fillStyle = css(K.branco, 0.55); ctx.fillRect(-w / 2 + 3, -y0 - h, w - 6, 3);                     // reflexo na borda de cima
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- manto de luz: um talit de luz que cobre quem caminha (cúpula com listras e franjas)
  // o: a (alfa), t, h (altura), drop 0..1 (as pontas descem até o chão, como uma tenda), estrelas 0..1, w
  function mantoLuz(ctx, cx, cy, w, o) {
    const a = clamp(o.a === undefined ? 1 : o.a), t = o.t || 0, h = o.h || 150, drop = clamp(o.drop || 0), ce = clamp(o.estrelas || 0);
    if (a < 0.01) return;
    ctx.save(); ctx.translate(cx, cy); ctx.globalAlpha *= a;
    const baixa = lerp(8, o.queda || 190, drop), onda = (x) => Math.sin(x * 0.03 + t * 1.6) * 3 + Math.sin(x * 0.011 - t * 0.9) * 4;
    const casca = () => {
      ctx.beginPath(); ctx.moveTo(-w / 2, baixa);
      ctx.bezierCurveTo(-w / 2, -h * 1.45, w / 2, -h * 1.45, w / 2, baixa);
      for (let k = 0; k <= 24; k++) { const xx = w / 2 - (k / 24) * w; ctx.lineTo(xx, baixa + onda(xx) * 0.5 + 5 * Math.sin(Math.PI * k / 24) * (1 - drop)); }
      ctx.closePath();
    };
    brilhoRadial(ctx, 0, -h * 0.35, w * 0.62, K.luzOuro, 0.35);
    const g = ctx.createLinearGradient(0, -h * 1.1, 0, baixa);
    g.addColorStop(0, css(K.luz, 0.66)); g.addColorStop(0.6, css(K.luzOuro, 0.32)); g.addColorStop(1, css(K.azulClaro, 0.16));
    ctx.fillStyle = g; casca(); ctx.fill();
    ctx.save(); casca(); ctx.clip();
    ctx.strokeStyle = css(K.azul, 0.7); ctx.lineCap = 'round';
    for (const [k, lw] of [[1, 6], [0.86, 3], [0.68, 6], [0.5, 3]]) {                                // listras do talit, acompanhando a curva
      ctx.lineWidth = lw; ctx.beginPath();
      ctx.moveTo(-w / 2 * k, baixa); ctx.bezierCurveTo(-w / 2 * k, -h * 1.3 * k, w / 2 * k, -h * 1.3 * k, w / 2 * k, baixa); ctx.stroke();
    }
    if (ce > 0.01) { ctx.fillStyle = css(K.luz, 0.95 * ce); for (let i = 0; i < 26; i++) { const ux = (hash1(i * 3.1) - 0.5) * w * 0.85, uy = -h * (0.15 + 1.0 * hash1(i * 5.7)) * (1 - Math.abs(ux) / w * 0.9); brilho4(ctx, ux, uy, (1.6 + 2.4 * hash1(i)) * (0.6 + 0.4 * Math.sin(t * 2.5 + i))); } }
    ctx.restore();
    ctx.strokeStyle = css(K.ouroForte, 0.9); ctx.lineWidth = 3;                                           // borda e franjas douradas
    ctx.beginPath(); ctx.moveTo(-w / 2, baixa); ctx.bezierCurveTo(-w / 2, -h * 1.45, w / 2, -h * 1.45, w / 2, baixa); ctx.stroke();
    ctx.strokeStyle = css(K.luzOuro, 0.9); ctx.lineWidth = 1.5;
    for (let k = 0; k <= 36; k++) { const xx = -w / 2 + (k / 36) * w, yb = baixa + onda(xx) * 0.5; ctx.beginPath(); ctx.moveTo(xx, yb); ctx.lineTo(xx + Math.sin(t * 2 + k) * 1.5, yb + 14 + (k % 3) * 3); ctx.stroke(); }
    ctx.restore();
  }

  // ---------------------------------------------------------------- coluna de luz (guia e guarda); x, yBase no chão
  function pilarLuz(ctx, x, yBase, altura, a, t) {
    if (a < 0.01) return;
    ctx.save(); ctx.translate(x, yBase); ctx.globalAlpha *= a; ctx.globalCompositeOperation = 'lighter';
    brilhoRadial(ctx, 0, -20, 190, K.luzOuro, 0.6);
    const N = 44, fatia = altura / N;
    for (const [wd, al] of [[120, 0.12], [70, 0.2], [30, 0.34]]) {
      const g = ctx.createLinearGradient(-wd, 0, wd, 0);
      g.addColorStop(0, css(K.luzOuro, 0)); g.addColorStop(0.5, css(K.luz, al)); g.addColorStop(1, css(K.luzOuro, 0));
      ctx.fillStyle = g;
      for (let i = 0; i < N; i++) {
        const u = (i + 0.5) / N, fade = Math.pow(1 - u, 1.35) * smooth(0, 0.05, u);
        ctx.save(); ctx.globalAlpha *= fade; ctx.translate(0, -i * fatia); ctx.scale(lerp(1, 0.5, u), 1); ctx.fillRect(-wd, -fatia - 1, wd * 2, fatia + 1.5); ctx.restore();
      }
    }
    ctx.fillStyle = css(K.luz, 0.95);
    for (let i = 0; i < 22; i++) { const u = mod(t * 0.12 + hash1(i * 3.7), 1); brilho4(ctx, Math.sin(t * 0.8 + i * 2.1) * 26 * (1 - u * 0.5), -u * altura * 0.8, (2 + 3.4 * Math.sin(Math.PI * u)) * (1 - u * 0.4)); }
    ctx.restore();
  }

  // ---------------------------------------------------------------- aurora pastel
  function aurora(ctx, W, a, t) {
    if (a < 0.01) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= a;
    const cores = ['#9fe8c4', '#f4a9d6', '#b7a8f6', '#ffdca0'];
    for (let k = 0; k < 4; k++) {
      const y0 = 150 + k * 62, amp = 46 + 18 * k;
      const g = ctx.createLinearGradient(0, y0 - 130, 0, y0 + 160);
      g.addColorStop(0, css(H(cores[k]), 0)); g.addColorStop(0.45, css(H(cores[k]), 0.5)); g.addColorStop(1, css(H(cores[k]), 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-40, y0 + 190);
      for (let x = -40; x <= W + 40; x += 24) ctx.lineTo(x, y0 + Math.sin(x * 0.0046 + t * 0.32 + k * 1.7) * amp + Math.sin(x * 0.012 - t * 0.5 + k) * 14);
      for (let x = W + 40; x >= -40; x -= 24) ctx.lineTo(x, y0 + 190 + Math.sin(x * 0.0036 + t * 0.25 + k * 2.3) * amp * 0.7);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- a letra shin (ש), símbolo do sinal da bênção
  function shin(ctx, x, y, s, a, t) {
    if (a < 0.01) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= a;
    brilhoRadial(ctx, 0, -10, 230, K.luzOuro, 0.6); brilhoRadial(ctx, 0, -10, 90, K.luz, 0.7);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 14; i++) {
      const an = (i / 14) * TAU + t * 0.1, L = 420, g = ctx.createLinearGradient(0, 0, Math.cos(an) * L, Math.sin(an) * L);
      g.addColorStop(0, css(K.luzOuro, 0.16)); g.addColorStop(1, css(K.luzOuro, 0));
      ctx.strokeStyle = g; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(an) * L, Math.sin(an) * L); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = css(K.ouroForte); ctx.lineWidth = 17; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-50, -64); ctx.lineTo(-44, 24); ctx.quadraticCurveTo(-42, 52, -12, 52); ctx.lineTo(18, 52); ctx.quadraticCurveTo(48, 52, 50, 24); ctx.lineTo(54, -64); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2, -64); ctx.lineTo(4, 50); ctx.stroke();
    ctx.strokeStyle = css(K.luz, 0.85); ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(-50, -64); ctx.lineTo(-44, 24); ctx.quadraticCurveTo(-42, 52, -12, 52); ctx.lineTo(18, 52); ctx.quadraticCurveTo(48, 52, 50, 24); ctx.lineTo(54, -64); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2, -64); ctx.lineTo(4, 50); ctx.stroke();
    ctx.restore();
  }

  // ---------------------------------------------------------------- fogueira (base em y = 0)
  function fogueira(ctx, x, y, s, o) {
    const f = clamp(o.forca === undefined ? 1 : o.forca), t = o.t || 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (f > 0.01) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      brilhoRadial(ctx, 0, -34, 330 * f, K.fogo1, 0.4 * f);
      ctx.fillStyle = css(K.fogo1, 0.22 * f); ctx.beginPath(); ctx.ellipse(0, 8, 260 * f, 26 * f, 0, 0, TAU); ctx.fill();
      ctx.restore();
    }
    for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI + Math.PI, px = Math.cos(a) * 42, py = 2 + Math.sin(a) * -7; elipse(ctx, px, py, 11, 7.5, 0, css(k % 2 ? K.pedra : K.pedraEsc)); }   // pedras em volta
    ctx.fillStyle = css(K.lenha); ctx.strokeStyle = css(aj(K.lenha, -0.12)); ctx.lineWidth = 1.4;
    for (const rot of [-0.35, 0.35]) { ctx.save(); ctx.translate(0, -6); ctx.rotate(rot); ctx.beginPath(); ctx.roundRect(-34, -6, 68, 12, 6); ctx.fill(); ctx.stroke(); ctx.restore(); }
    if (f > 0.01) {
      const chama = (w, h, cor, ph, al) => {
        const sw = Math.sin(t * 7 + ph) * 4 * f, hh = h * f * (0.9 + 0.1 * Math.sin(t * 11 + ph * 2));
        ctx.fillStyle = css(cor, al);
        ctx.beginPath(); ctx.moveTo(-w, -4); ctx.quadraticCurveTo(-w * 1.1, -hh * 0.5, sw, -hh); ctx.quadraticCurveTo(w * 1.1, -hh * 0.5, w, -4); ctx.quadraticCurveTo(0, 6, -w, -4); ctx.fill();
      };
      chama(24, 74, K.fogo1, 0, 0.92); chama(15, 56, K.fogo2, 1.7, 0.95); chama(8, 36, K.fogo3, 3.1, 0.98);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = css(K.fogo2, 0.9 * f);
      for (let i = 0; i < 8; i++) { const u = mod(t * 0.7 + i / 8, 1); brilho4(ctx, Math.sin(t * 2 + i * 2.3) * 22 * u, -30 - 160 * u, (1.4 + 1.6 * (1 - u))); }
      ctx.restore();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- quem dorme sob a manta (de lado; cabeça à esquerda quando dir = 1)
  // o: dir, cor (da manta), menor (criança), t, alfa, semente
  function dormindo(ctx, x, y, s, o) {
    const dir = o.dir || 1, t = o.t || 0, A = o.alfa === undefined ? 1 : o.alfa, cor = o.cor || H('#f6c8d6'), me = o.menor ? 0.78 : 1;
    if (A < 0.01) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir * me, s * me); ctx.globalAlpha *= A;
    const resp = Math.sin(t * 1.5 + (o.semente || 0)) * 1.8;
    elipse(ctx, 18, 3, 78, 8, 0, css(K.sombra, 0.2));
    elipse(ctx, -48, -9, 20, 9, 0, css(K.creme));                                                           // travesseiro
    // cabeça
    disco(ctx, -46, -22, 15.5, css(K.pele));
    ctx.fillStyle = css(o.cabelo || K.cabelo); ctx.beginPath(); ctx.arc(-49, -25, 15.5, Math.PI * 0.9, Math.PI * 1.95); ctx.fill();
    ctx.strokeStyle = css(K.olho); ctx.lineWidth = 1.7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(-40, -22, 3.2, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.fillStyle = css(K.bochecha, 0.5); ctx.beginPath(); ctx.arc(-39, -16, 3.6, 0, TAU); ctx.fill();
    // manta
    const g = ctx.createLinearGradient(0, -50, 0, 0);
    g.addColorStop(0, css(ml(cor, K.branco, 0.35))); g.addColorStop(1, css(cor));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-36, 0); ctx.quadraticCurveTo(-34, -34 - resp, -8, -40 - resp); ctx.quadraticCurveTo(40, -46 - resp, 80, -14); ctx.quadraticCurveTo(92, -2, 88, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = css(aj(cor, -0.1), 0.6); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-26, -14); ctx.quadraticCurveTo(20, -30 - resp, 78, -8); ctx.stroke();
    ctx.strokeStyle = css(K.luz, 0.8); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-30, -26 - resp * 0.5); ctx.quadraticCurveTo(-8, -38 - resp, 20, -39 - resp); ctx.stroke();
    ctx.restore();
  }

  // ---------------------------------------------------------------- pedras e arbustos do deserto
  function rocha(ctx, x, y, s, sem) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    elipse(ctx, 4, 2, 44, 6, 0, css(K.sombra, 0.14));
    const w = 30 + 24 * hash1(sem * 3.3), h = 18 + 16 * hash1(sem * 5.1);
    const g = ctx.createLinearGradient(0, -h, 0, 0); g.addColorStop(0, css(ml(K.pedraB, K.branco, 0.4))); g.addColorStop(1, css(K.areiaSom));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-w, 0); ctx.quadraticCurveTo(-w * 0.9, -h * 1.1, -w * 0.2, -h); ctx.quadraticCurveTo(w * 0.7, -h * 1.2, w, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = css(K.pedraBSom, 0.55); ctx.beginPath(); ctx.moveTo(w * 0.35, -h * 0.9); ctx.quadraticCurveTo(w * 0.9, -h * 0.5, w, 0); ctx.lineTo(w * 0.3, 0); ctx.closePath(); ctx.fill();
    if (hash1(sem * 7.7) > 0.5) { ctx.fillStyle = css(ml(K.pedraB, K.branco, 0.2)); ctx.beginPath(); ctx.ellipse(w * 1.15, -4, 11, 7, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  function arbusto(ctx, x, y, s, sem, t, tom) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const n = 5 + Math.floor(hash1(sem * 2.1) * 4), sw = Math.sin((t || 0) * 1.1 + sem) * 2.5;
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.32, L = 34 + 22 * hash1(sem * 3.7 + i);
      ctx.strokeStyle = css(i % 2 ? K.salviaEsc : K.salvia); ctx.lineWidth = 3.4;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(Math.cos(a) * L * 0.5, Math.sin(a) * L * 0.5, Math.cos(a) * L + sw, Math.sin(a) * L); ctx.stroke();
      disco(ctx, Math.cos(a) * L + sw, Math.sin(a) * L, 4.6, css(i % 2 ? K.salvia : ml(K.salvia, K.branco, 0.35)));
    }
    ctx.restore();
  }

  G.SeresBS = { K, maoV, maosCeu, kohen, plataforma, ALT_PLAT, mantoLuz, pilarLuz, aurora, shin, fogueira, dormindo, rocha, arbusto };
})(window);
