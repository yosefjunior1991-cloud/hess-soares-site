// Utilidades: matemática, curvas de movimento (easing/molas), aleatoriedade determinística
// e cores. Tudo é função pura do tempo: qualquer quadro pode ser desenhado isoladamente,
// na ordem que for, com resultado idêntico (requisito para renderizar em paralelo).
(function (G) {
  'use strict';

  const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  const lerp = (a, b, t) => a + (b - a) * t;
  const inv = (a, b, x) => clamp((x - a) / (b - a));
  const smooth = (a, b, x) => { const t = inv(a, b, x); return t * t * (3 - 2 * t); };
  const smoother = (a, b, x) => { const t = inv(a, b, x); return t * t * t * (t * (t * 6 - 15) + 10); };
  const mod = (x, n) => ((x % n) + n) % n;

  // curvas de movimento sobre t em [0,1]
  const ease = {
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    outQuart: (t) => 1 - Math.pow(1 - t, 4),
    inCubic: (t) => t * t * t,
    inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    outBack: (t, c = 1.70158) => 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2),
  };

  // Mola amortecida (subamortecida): sai de 0, passa um pouco de 1 e assenta.
  // t em segundos; freq em Hz; amort < 1 (menor = mais "elástica").
  function mola(t, freq = 2.2, amort = 0.6) {
    if (t <= 0) return 0;
    const w = 2 * Math.PI * freq;
    const wd = w * Math.sqrt(1 - amort * amort);
    return 1 - Math.exp(-amort * w * t) * (Math.cos(wd * t) + ((amort * w) / wd) * Math.sin(wd * t));
  }

  // "batida": sobe de repente e decai suave (t em segundos desde o gatilho)
  const pulso = (t, decaimento = 6) => (t < 0 ? 0 : Math.exp(-decaimento * t));

  // ---------------------------------------------------------------- aleatório determinístico
  function hash1(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
    return x - Math.floor(x);
  }
  function noise1(x) {
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return lerp(hash1(i), hash1(i + 1), u) * 2 - 1;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------------------------------------------------------------- cores
  const _hex = new Map();
  function rgb(hex) {
    let c = _hex.get(hex);
    if (!c) {
      let h = hex.replace('#', '');
      if (h.length === 3) h = h.split('').map((x) => x + x).join('');
      const n = parseInt(h, 16);
      c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
      _hex.set(hex, c);
    }
    return c;
  }
  const css = (c, a = 1) => {
    const r = Math.round(c[0]), g = Math.round(c[1]), b = Math.round(c[2]);
    return a >= 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${a < 0 ? 0 : a.toFixed(3)})`;
  };
  const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

  // OKLab: interpolação perceptualmente uniforme (gradientes de céu sem "lama" no meio)
  const s2l = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const l2s = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
  function toLab(c) {
    const r = s2l(c[0] / 255), g = s2l(c[1] / 255), b = s2l(c[2] / 255);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [
      0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    ];
  }
  function fromLab(o) {
    const l = Math.pow(o[0] + 0.3963377774 * o[1] + 0.2158037573 * o[2], 3);
    const m = Math.pow(o[0] - 0.1055613458 * o[1] - 0.0638541728 * o[2], 3);
    const s = Math.pow(o[0] - 0.0894841775 * o[1] - 1.291485548 * o[2], 3);
    const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    const b = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
    return [clamp(l2s(clamp(r))) * 255, clamp(l2s(clamp(g))) * 255, clamp(l2s(clamp(b))) * 255];
  }
  const _lab = new Map();
  const lab = (hex) => { let v = _lab.get(hex); if (!v) { v = toLab(rgb(hex)); _lab.set(hex, v); } return v; };
  const mixLab = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

  G.U = {
    clamp, lerp, inv, smooth, smoother, mod, ease, mola, pulso,
    hash1, noise1, mulberry32,
    rgb, css, mix, toLab, fromLab, lab, mixLab,
  };
})(window);
