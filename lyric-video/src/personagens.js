// Personagens desenhados em código (canvas 2D): o pastor, as ovelhas, o cordeirinho e as pombas.
// Estilo: formas simples e arredondadas, pastel, sombreado suave e luz de contorno quente.
// Cada função recebe o estado do quadro (S), a posição (x, y = pés no chão), a escala e as
// opções de animação (fase da caminhada, quanto está andando, etc.).
(function (G) {
  'use strict';
  const { clamp, lerp, noise1 } = G.U;

  const TAU = Math.PI * 2;
  function capsula(ctx, x1, y1, x2, y2, w, cor) {
    ctx.strokeStyle = cor; ctx.lineWidth = w; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  function elipse(ctx, x, y, rx, ry, rot, cor) {
    ctx.fillStyle = cor; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, TAU); ctx.fill();
  }
  function disco(ctx, x, y, r, cor) {
    ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }

  // ------------------------------------------------------------------------ pastor
  // Comprimento de coxa = canela = 34 -> passada de ~80 px por ciclo (usada para travar os pés no chão).
  const PERNA = 34;
  const PASSADA_PASTOR = 4 * (2 * PERNA) * Math.sin(0.30);   // ≈ 80 px de chão por ciclo completo

  function pastor(ctx, S, x, y, s, o) {
    const L = S.L, t = S.t, w = o.andar, ph = o.fase;
    const sn = Math.sin(ph), cs = Math.cos(ph);
    const vento = Math.sin(t * 1.3 + 1) * 2.2 + noise1(t * 0.6) * 1.2;

    // pernas: quadril balança, joelho dobra na fase de balanço
    const TH = 0.30 * w;
    const angA = sn * TH, kbA = 0.6 * w * Math.max(0, cs);
    const angB = -sn * TH, kbB = 0.6 * w * Math.max(0, -cs);
    const ext = (a, k) => PERNA * Math.cos(a) + PERNA * Math.cos(a - k);
    const hipY = -Math.max(ext(angA, kbA), ext(angB, kbB)) - 4;
    const dy = hipY + 2 * PERNA + 4;                 // quanto o tronco sobe/desce
    const respira = Math.sin(t * 1.9) * 1.1 * (1 - w * 0.5);

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    if (o.inclina) ctx.rotate(o.inclina);

    elipse(ctx, 2, 2, 52, 8, 0, 'rgba(70,50,120,0.16)');

    const perna = (hx, ang, kb, cor) => {
      const kx = hx + Math.sin(ang) * PERNA, ky = hipY + Math.cos(ang) * PERNA;
      const a2 = ang - kb;
      const ax = kx + Math.sin(a2) * PERNA, ay = ky + Math.cos(a2) * PERNA;
      capsula(ctx, hx, hipY, kx, ky, 15, cor);
      capsula(ctx, kx, ky, ax, ay, 12, cor);
      elipse(ctx, ax + 7, ay + 1, 12, 5.5, 0, L('#B98D72'));
    };
    perna(-5, angB, kbB, L('#E5B08D'));
    perna(6, angA, kbA, L('#F3C6A4'));

    ctx.save();
    ctx.translate(0, dy + respira);

    // manto (atrás do corpo), com listras de tallit
    const balanco = sn * 3 * w + vento;
    ctx.fillStyle = L('#C9BCEB');
    ctx.beginPath();
    ctx.moveTo(-12, -152);
    ctx.bezierCurveTo(-42 + balanco * 0.3, -140, -50 + balanco, -100, -44 + balanco, -50);
    ctx.lineTo(-12, -54);
    ctx.bezierCurveTo(-8, -90, -6, -120, -7, -150);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = L('#9B90DD'); ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (const k of [0, 1]) {
      ctx.beginPath();
      ctx.moveTo(-45 + balanco + k * 7 + 3, -60 + k * 2);
      ctx.lineTo(-14 + k * 1.5, -57 + k * 2);
      ctx.stroke();
    }

    // braço de trás
    const bA = -0.35 + sn * 0.5 * w;
    capsula(ctx, -8, -146, -8 + Math.sin(bA) * 30, -146 + Math.cos(bA) * 30, 12, L('#EBD3BC'));
    capsula(ctx, -8 + Math.sin(bA) * 30, -146 + Math.cos(bA) * 30, -8 + Math.sin(bA + 0.25) * 58, -146 + Math.cos(bA + 0.25) * 58, 10, L('#EBD3BC'));
    disco(ctx, -8 + Math.sin(bA + 0.25) * 60, -146 + Math.cos(bA + 0.25) * 60, 6.5, L('#E5B08D'));

    // túnica
    const hemL = -38 + balanco * 0.5 - sn * 2 * w, hemR = 40 + balanco * 0.3 + sn * 2 * w;
    const gT = ctx.createLinearGradient(-38, 0, 40, 0);
    gT.addColorStop(0, L('#FFF6E8')); gT.addColorStop(0.65, L('#FBE6D0')); gT.addColorStop(1, L('#EFCFB4'));
    ctx.fillStyle = gT;
    ctx.beginPath();
    ctx.moveTo(-23, -153);
    ctx.bezierCurveTo(-30, -122, -34, -88, hemL, -50);
    ctx.quadraticCurveTo(0, -40 + sn * 1.5, hemR, -50);
    ctx.bezierCurveTo(34, -88, 30, -122, 23, -153);
    ctx.quadraticCurveTo(0, -166, -23, -153);
    ctx.closePath(); ctx.fill();

    // faixa na cintura + nó
    ctx.fillStyle = L('#E9A4B8');
    ctx.beginPath();
    ctx.moveTo(-31, -112); ctx.quadraticCurveTo(0, -104, 32, -112);
    ctx.lineTo(33, -99); ctx.quadraticCurveTo(0, -91, -32, -99);
    ctx.closePath(); ctx.fill();
    disco(ctx, 15, -100, 6, L('#D98CA3'));
    capsula(ctx, 15, -98, 11, -80 + sn * 2 * w, 5, L('#E9A4B8'));

    // braço da frente + cajado
    const fA = 0.55 - sn * 0.22 * w;
    const sx = 10, sy = -146;
    const ex = sx + Math.sin(fA) * 30, ey = sy + Math.cos(fA) * 30;
    const hxx = ex + Math.sin(fA + 0.75) * 28, hyy = ey + Math.cos(fA + 0.75) * 28;
    const incl = 0.05 + sn * 0.09 * w;
    ctx.save();
    ctx.translate(hxx, hyy);
    ctx.rotate(incl);
    const cj = L('#C99B6D');
    ctx.strokeStyle = cj; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-1, 120); ctx.lineTo(0, -128); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -128); ctx.bezierCurveTo(0, -152, 34, -152, 34, -128); ctx.stroke();
    ctx.strokeStyle = L('#E7C79E'); ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(-2, 112); ctx.lineTo(-1.5, -122); ctx.stroke();
    ctx.restore();
    capsula(ctx, sx, sy, ex, ey, 13, L('#F6E2CD'));
    capsula(ctx, ex, ey, hxx, hyy, 11, L('#F6E2CD'));
    disco(ctx, hxx, hyy, 7.2, L('#F3C6A4'));

    // cabeça
    const nod = Math.sin(t * 0.9) * 1.2 + (o.olhar || 0) * -3;
    ctx.save();
    ctx.translate(4, -188 + nod * 0.4);
    ctx.rotate((o.olhar || 0) * -0.16);
    // pano de cabeça: caimento atrás
    ctx.fillStyle = L('#FFF8EE');
    ctx.beginPath();
    ctx.moveTo(-22, -12);
    ctx.bezierCurveTo(-38 + vento * 0.5, 4, -42 + vento, 24, -34 + vento, 40);
    ctx.lineTo(-12, 36); ctx.lineTo(-6, 8);
    ctx.closePath(); ctx.fill();
    disco(ctx, 0, 0, 27, L('#F6CDAA'));
    // barba curta
    ctx.fillStyle = L('#B99B88');
    ctx.beginPath();
    ctx.moveTo(6, 12); ctx.bezierCurveTo(22, 12, 30, 6, 30, 2);
    ctx.bezierCurveTo(31, 18, 22, 27, 8, 26); ctx.bezierCurveTo(-2, 25, -4, 16, 6, 12);
    ctx.closePath(); ctx.fill();
    // pano por cima
    ctx.fillStyle = L('#FFF8EE');
    ctx.beginPath();
    ctx.ellipse(1, -6, 30, 24, -0.1, Math.PI * 1.02, Math.PI * 1.98);
    ctx.lineTo(28, -8); ctx.quadraticCurveTo(2, -16, -28, -8); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = L('#DE9AAE'); ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-27, -9); ctx.quadraticCurveTo(2, -18, 29, -9); ctx.stroke();
    // rosto
    const piscar = (t % 4.3) < 0.11 ? 0.15 : 1;
    ctx.fillStyle = L('#4B3F5C');
    ctx.beginPath(); ctx.ellipse(15, 1, 3.1, 3.5 * piscar, 0, 0, TAU); ctx.fill();
    disco(ctx, 33, 2, 4.4, L('#EDB995'));
    ctx.fillStyle = 'rgba(255,140,160,0.35)';
    ctx.beginPath(); ctx.ellipse(14, 10, 6.5, 4.5, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = L('#7B5A5A'); ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(22, 9, 5.5, 0.15 * Math.PI, 0.7 * Math.PI); ctx.stroke();
    ctx.restore();

    // luz de contorno (lado do sol)
    if (S.dia.rimA > 0.05) {
      ctx.strokeStyle = G.U.css(S.dia.rim, 0.55 * S.dia.rimA);
      ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-23, -152); ctx.bezierCurveTo(-30, -122, -34, -88, hemL, -52); ctx.stroke();
    }
    ctx.restore(); // dy
    ctx.restore(); // escala/posição
  }

  // ------------------------------------------------------------------------ ovelha / cordeirinho
  const PASSADA_OVELHA = 4 * 26 * Math.sin(0.55);            // ≈ 54 px de chão por ciclo completo

  function ovelha(ctx, S, x, y, s, o) {
    const L = S.L, t = S.t, w = o.andar, ph = o.fase, pasto = o.pasto || 0;
    const cordeiro = o.tipo === 'cordeiro';
    const nodd = Math.sin(ph * 2 + o.semente) * 1.5 * w;
    ctx.save();
    ctx.translate(x, y - (o.pulo || 0));
    ctx.scale(s, s);
    if (o.inclina) ctx.rotate(o.inclina);

    elipse(ctx, 0, 2 + (o.pulo || 0), 46, 6.5, 0, 'rgba(70,50,120,0.15)');

    // pernas (diagonais em oposição)
    const corPerna = L('#8E7C98');
    const passo = (dx, off, tom) => {
      const a = Math.sin(ph + off) * 0.55 * w;
      const alt = Math.max(0, Math.cos(ph + off)) * 5 * w;
      const fx = dx + Math.sin(a) * 26, fy = -28 + Math.cos(a) * 26 - alt;
      capsula(ctx, dx, -30, fx, fy, 8, tom || corPerna);
      disco(ctx, fx, fy + 1, 4.4, L('#5F5068'));
    };
    // pernas do lado de lá (escuras) primeiro; andar em diagonal: traseira-perto + dianteira-longe juntas
    passo(-11, Math.PI, L('#7D6C88')); passo(15, 0, L('#7D6C88'));
    passo(-23, 0); passo(27, Math.PI);

    // lã: nuvem de círculos numa única união
    const cx = 0, cy = -50 + Math.sin(t * 2.2 + o.semente) * 0.7, rx = 38, ry = 23;
    ctx.beginPath();
    const n = 11;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + 0.3;
      const px = cx + Math.cos(a) * rx * 0.86, py = cy + Math.sin(a) * ry * 0.8;
      const r = 15.5 + ((i * 7) % 3) * 2.3;
      ctx.moveTo(px + r, py); ctx.arc(px, py, r, 0, TAU);
    }
    ctx.moveTo(cx + rx * 0.8, cy); ctx.ellipse(cx, cy, rx * 0.8, ry * 0.9, 0, 0, TAU);
    const gL = ctx.createLinearGradient(0, cy - ry - 12, 0, cy + ry + 14);
    gL.addColorStop(0, L('#FFFFFF')); gL.addColorStop(0.55, L('#FFF7EE')); gL.addColorStop(1, L('#E3DAF1'));
    ctx.fillStyle = gL; ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = 'rgba(160,140,205,0.22)';
    ctx.beginPath(); ctx.ellipse(cx + 8, cy + 20, rx * 0.95, ry * 0.7, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(190,175,225,0.55)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const a = -0.6 + i * 0.7;
      ctx.beginPath(); ctx.arc(cx - 26 + i * 15, cy + 2 + (i % 2) * 6, 7, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke();
    }
    ctx.restore();
    if (S.dia.rimA > 0.05) {
      ctx.strokeStyle = G.U.css(S.dia.rim, 0.3 * S.dia.rimA);
      ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.ellipse(cx - 2, cy - 2, rx * 0.9, ry * 0.94, 0, Math.PI * 1.1, Math.PI * 1.7); ctx.stroke();
    }
    // rabinho
    disco(ctx, -40, -52 + Math.sin(t * 6 + o.semente * 3) * 1.4, 7.5, L('#FFF8F0'));

    // cabeça
    const cabDy = 22 * pasto + nodd;
    ctx.save();
    ctx.translate(48, -52 + cabDy);
    ctx.rotate(0.12 + 0.6 * pasto);
    const mastiga = pasto > 0.4 ? Math.sin(t * 9 + o.semente * 5) * 0.8 : 0;
    elipse(ctx, -12, -13, 5.5, 11, -0.7 + Math.sin(t * 0.7 + o.semente) * 0.05, L('#E3AE9C'));
    elipse(ctx, 0, 0, 15, 18, 0, L('#F5D6C2'));
    elipse(ctx, 8, 8 + mastiga, 9, 8, 0, L('#EBBBA6'));
    disco(ctx, 13.5, 8.5 + mastiga, 2.2, L('#B9827C'));
    const pisca = ((t + o.semente * 3.1) % 5.3) < 0.1 ? 0.2 : 1;
    ctx.fillStyle = L('#3E3350');
    ctx.beginPath(); ctx.ellipse(5.5, -3.5, 3, 3.3 * pisca, 0, 0, TAU); ctx.fill();
    disco(ctx, 6.4, -4.7, 1, 'rgba(255,255,255,0.9)');
    elipse(ctx, -5, -14, 5, 10, -0.5, L('#EBBAA8'));
    disco(ctx, -3, -19, 7, L('#FFFFFF'));
    disco(ctx, 5, -19, 6, L('#FFF7EE'));
    ctx.restore();

    ctx.restore();
  }

  // ------------------------------------------------------------------------ pomba
  function asa(ctx, cor, ang) {
    ctx.save();
    ctx.rotate(ang);
    ctx.fillStyle = cor;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-8, -26, 22, -50, 52, -42);
    ctx.bezierCurveTo(40, -28, 24, -10, 10, 4);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function pomba(ctx, S, x, y, s, o) {
    const L = S.L;
    const bate = Math.sin(o.fase);
    ctx.save();
    ctx.translate(x, y + bate * 3);
    ctx.scale(s * (o.dir || 1), s);
    ctx.rotate(o.rot || 0);
    const branco = L('#FFFFFF'), sombra = L('#DCD3EE');
    ctx.save(); ctx.translate(-3, -5); asa(ctx, sombra, -0.25 - bate * 0.75); ctx.restore();
    ctx.fillStyle = branco;
    ctx.beginPath(); ctx.moveTo(-16, -1); ctx.lineTo(-44, -9); ctx.lineTo(-46, 5); ctx.closePath(); ctx.fill();
    elipse(ctx, 0, 0, 23, 10.5, -0.08, branco);
    disco(ctx, 21, -6, 7.5, branco);
    disco(ctx, 24, -7.3, 1.6, L('#4B3F5C'));
    ctx.fillStyle = L('#F5B88E');
    ctx.beginPath(); ctx.moveTo(27, -5.6); ctx.lineTo(35, -3.6); ctx.lineTo(27, -2.4); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.translate(3, -6); asa(ctx, branco, 0.05 - bate * 0.8); ctx.restore();
    ctx.restore();
  }

  G.Personagens = { pastor, ovelha, pomba, PASSADA_PASTOR, PASSADA_OVELHA };
})(window);
