#!/usr/bin/env node
// Extrai a paleta da imagem da música e a converte para tons PASTEIS (regra do canal Or Israel:
// seguir as cores da imagem, mas sempre mais claras e menos saturadas).
//
// Amostra regiões fixas da imagem (céu, nuvens, brilho do sol, horizonte, água, margem, pedras...),
// calcula a cor média de cada uma e aplica o "pastel": clareia em direção ao branco e reduz o croma,
// preservando o matiz. Saída: JSON com as cores originais e as pastéis.
//
// Uso: node tools/paleta-da-imagem.cjs <imagem> <saida.json>
//      FFMPEG=/caminho/do/ffmpeg (opcional)

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const [imagem, saida] = process.argv.slice(2);
if (!imagem || !saida) { console.error('uso: node tools/paleta-da-imagem.cjs <imagem> <saida.json>'); process.exit(1); }

const LARG = 141, ALT = 77;
const r = spawnSync(process.env.FFMPEG || 'ffmpeg', ['-v', 'error', '-i', imagem, '-vf', `scale=${LARG}:${ALT}:flags=area`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 24 });
if (r.error || r.status !== 0) { console.error('ffmpeg falhou:', r.error ? r.error.message : String(r.stderr)); process.exit(1); }
const px = r.stdout;

// regiões (frações da imagem) -> papel na cena; "claro": quão claro o pastel precisa ser (L mínimo)
const REGIOES = {
  ceuTopo:      { r: [0.04, 0.02, 0.45, 0.10], Lmin: 0.88 },
  ceuMeio:      { r: [0.30, 0.12, 0.56, 0.22], Lmin: 0.88 },
  nuvemPessego: { r: [0.60, 0.08, 0.86, 0.22], Lmin: 0.90 },
  nuvemRosa:    { r: [0.00, 0.22, 0.25, 0.34], Lmin: 0.84 },
  brilho:       { r: [0.66, 0.33, 0.78, 0.41], Lmin: 0.93 },
  nevoa:        { r: [0.35, 0.44, 0.60, 0.52], Lmin: 0.88 },
  aguaLonge:    { r: [0.30, 0.53, 0.70, 0.60], Lmin: 0.74 },
  aguaPerto:    { r: [0.25, 0.88, 0.75, 0.98], Lmin: 0.56 },
  pinheiro:     { r: [0.03, 0.38, 0.30, 0.49], Lmin: 0.66 },
  margem:       { r: [0.88, 0.33, 1.00, 0.48], Lmin: 0.72 },
  pedra:        { r: [0.93, 0.80, 1.00, 0.95], Lmin: 0.60 },
  junco:        { r: [0.76, 0.66, 0.90, 0.74], Lmin: 0.62 },
};

function media([x0, y0, x1, y1]) {
  // média dos ~35% de pixels mais cromáticos da região (mantém o matiz real: turquesa, pêssego, dourado)
  const lista = [];
  for (let y = Math.floor(y0 * ALT); y < Math.ceil(y1 * ALT); y++) {
    for (let x = Math.floor(x0 * LARG); x < Math.ceil(x1 * LARG); x++) {
      const i = (y * LARG + x) * 3;
      const c = [px[i], px[i + 1], px[i + 2]];
      const [, A, B] = toLab(c);
      lista.push({ c, croma: Math.hypot(A, B) });
    }
  }
  lista.sort((p, q) => q.croma - p.croma);
  const top = lista.slice(0, Math.max(1, Math.round(lista.length * 0.35)));
  return [0, 1, 2].map((k) => top.reduce((s, e) => s + e.c[k], 0) / top.length);
}

// --- OKLab
const s2l = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const l2s = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
function toLab(c) {
  const R = s2l(c[0] / 255), G = s2l(c[1] / 255), B = s2l(c[2] / 255);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
function fromLab(o) {
  const l = Math.pow(o[0] + 0.3963377774 * o[1] + 0.2158037573 * o[2], 3);
  const m = Math.pow(o[0] - 0.1055613458 * o[1] - 0.0638541728 * o[2], 3);
  const s = Math.pow(o[0] - 0.0894841775 * o[1] - 1.291485548 * o[2], 3);
  const c = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  return c.map((v) => Math.round(Math.min(1, Math.max(0, l2s(Math.min(1, Math.max(0, v))))) * 255));
}
const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');

// PASTEL: clareia rumo ao branco, reduz o croma (preserva o matiz) e respeita um L mínimo por papel
function pastel(c, Lmin, matizDe) {
  const [L, a, b] = toLab(c);
  const C = Math.hypot(a, b);
  let h = Math.atan2(b, a);
  if (C < 0.035 && matizDe) { const [, a2, b2] = toLab(matizDe); h = Math.atan2(b2, a2); }   // amostra quase neutra: herda o matiz do céu
  const L2 = Math.max(Lmin, L + (1 - L) * 0.55);
  const C2 = Math.min(0.085, Math.max(0.05, C * 1.5));   // pastel = claro, suave, mas com matiz visível
  return fromLab([L2, C2 * Math.cos(h), C2 * Math.sin(h)]);
}

const amostras = {}, pastéis = {};
for (const [nome, { r: reg, Lmin }] of Object.entries(REGIOES)) {
  const c = media(reg);
  amostras[nome] = c.map(Math.round);
  const ref = ['aguaPerto', 'pedra', 'pinheiro', 'margem', 'junco'].includes(nome) && amostras.ceuTopo ? amostras.ceuTopo : null;
  pastéis[nome] = hex(pastel(c, Lmin, ref));
}
fs.mkdirSync(path.dirname(saida), { recursive: true });
fs.writeFileSync(saida, JSON.stringify({ imagem: path.basename(imagem), amostras: Object.fromEntries(Object.entries(amostras).map(([k, v]) => [k, hex(v)])), pastel: pastéis }, null, 1));
console.log('papel          original   ->  pastel');
for (const k of Object.keys(REGIOES)) console.log(k.padEnd(14), hex(amostras[k]), ' -> ', pastéis[k]);
console.log('gravado em', saida);
