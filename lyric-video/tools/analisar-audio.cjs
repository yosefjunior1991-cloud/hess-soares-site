#!/usr/bin/env node
// Analisa o áudio da música e grava, para cada quadro do vídeo, a energia total e por faixa
// (graves, médios, agudos) e os pulsos de batida. As animações usam esses números para
// "respirar" junto com a música. Tudo é calculado uma vez e lido por tempo (acesso aleatório),
// o que permite renderizar qualquer trecho do vídeo, em paralelo, com o mesmo resultado.
//
// Uso: node tools/analisar-audio.cjs <audio> <saida.json> [fps=30]
//      FFMPEG=/caminho/do/ffmpeg (opcional; senão usa "ffmpeg" do PATH)

const { spawnSync } = require('child_process');
const fs = require('fs');

const [audio, saida, fpsArg] = process.argv.slice(2);
if (!audio || !saida) {
  console.error('uso: node tools/analisar-audio.cjs <audio> <saida.json> [fps=30]');
  process.exit(1);
}
const FPS = Number(fpsArg) || 30;
const SR = 22050;
const JANELA = 2048;

// ---------------------------------------------------------------- decodificação
const ffmpeg = process.env.FFMPEG || 'ffmpeg';
const dec = spawnSync(ffmpeg, ['-v', 'error', '-i', audio, '-vn', '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'],
  { maxBuffer: 1 << 29 });
if (dec.error || dec.status !== 0) {
  console.error('ffmpeg falhou:', dec.error ? dec.error.message : String(dec.stderr),
    '\n(defina FFMPEG=/caminho/do/ffmpeg se ele não estiver no PATH)');
  process.exit(1);
}
const pcm = new Float32Array(dec.stdout.buffer, dec.stdout.byteOffset, Math.floor(dec.stdout.length / 4));
const duracao = pcm.length / SR;
const quadros = Math.ceil(duracao * FPS);

// ---------------------------------------------------------------- FFT (radix-2)
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = i + k + len / 2;
        const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti;
        re[a] += tr; im[a] += ti;
        const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
      }
    }
  }
}

const hann = Float64Array.from({ length: JANELA }, (_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (JANELA - 1)));
const hz = (f) => Math.round(f * JANELA / SR);
const FAIXAS = { graves: [hz(30), hz(150)], medios: [hz(150), hz(2000)], agudos: [hz(2000), hz(9000)] };

const rms = new Float32Array(quadros), graves = new Float32Array(quadros),
  medios = new Float32Array(quadros), agudos = new Float32Array(quadros), fluxo = new Float32Array(quadros);
const re = new Float64Array(JANELA), im = new Float64Array(JANELA);
let anterior = new Float64Array(JANELA / 2);

for (let q = 0; q < quadros; q++) {
  const centro = Math.round((q / FPS) * SR);
  const ini = centro - JANELA / 2;
  let soma = 0;
  for (let i = 0; i < JANELA; i++) {
    const v = pcm[ini + i] || 0;
    re[i] = v * hann[i]; im[i] = 0;
    soma += v * v;
  }
  rms[q] = Math.sqrt(soma / JANELA);
  fft(re, im);
  const mag = new Float64Array(JANELA / 2);
  for (let k = 0; k < JANELA / 2; k++) mag[k] = Math.log1p(60 * Math.hypot(re[k], im[k]) / JANELA);
  const energia = (a, b) => { let s = 0; for (let k = a; k < b; k++) s += mag[k]; return s / (b - a); };
  graves[q] = energia(...FAIXAS.graves);
  medios[q] = energia(...FAIXAS.medios);
  agudos[q] = energia(...FAIXAS.agudos);
  let f = 0;
  for (let k = 0; k < JANELA / 2; k++) f += Math.max(0, mag[k] - anterior[k]);
  fluxo[q] = f;
  anterior = mag;
}

// ---------------------------------------------------------------- normalização e suavização
function percentil(arr, p) {
  const c = Float32Array.from(arr).sort();
  return c[Math.min(c.length - 1, Math.floor(p * c.length))] || 1e-9;
}
function normalizar(arr) {
  const teto = percentil(arr, 0.97);
  return Float32Array.from(arr, (v) => Math.min(1, v / teto));
}
// "seguidor de envelope": sobe rápido, desce devagar (cada um em segundos)
function envelope(arr, subida, descida) {
  const out = new Float32Array(arr.length);
  const as = 1 - Math.exp(-1 / (FPS * subida)), ds = 1 - Math.exp(-1 / (FPS * descida));
  let y = 0;
  for (let i = 0; i < arr.length; i++) {
    y += (arr[i] > y ? as : ds) * (arr[i] - y);
    out[i] = y;
  }
  return out;
}
const energia = envelope(normalizar(rms), 0.06, 0.35);
const g = envelope(normalizar(graves), 0.03, 0.22);
const m = envelope(normalizar(medios), 0.05, 0.3);
const a = envelope(normalizar(agudos), 0.03, 0.18);
const pulso = envelope(normalizar(fluxo), 0.015, 0.16);

// ---------------------------------------------------------------- andamento (BPM) e grade de batidas
const fl = Float32Array.from(fluxo);
const media = fl.reduce((s, v) => s + v, 0) / fl.length;
const onset = Float32Array.from(fl, (v) => Math.max(0, v - media));
let melhor = { bpm: 100, pontos: -1 };
for (let bpm = 60; bpm <= 180; bpm += 0.5) {
  const lag = (60 / bpm) * FPS;
  let pontos = 0;
  for (let i = 0; i + lag < onset.length; i++) {
    const j = i + lag, j0 = Math.floor(j), fr = j - j0;
    pontos += onset[i] * (onset[j0] * (1 - fr) + (onset[j0 + 1] || 0) * fr);
  }
  // prefere andamentos próximos de 90-120 (evita "meio tempo" e "dobro")
  pontos *= 1 - Math.abs(Math.log2(bpm / 105)) * 0.08;
  if (pontos > melhor.pontos) melhor = { bpm, pontos };
}
const passo = (60 / melhor.bpm) * FPS;
let fase = { off: 0, pontos: -1 };
for (let off = 0; off < passo; off += 0.25) {
  let pontos = 0;
  for (let t = off; t < onset.length - 1; t += passo) {
    const t0 = Math.floor(t);
    pontos += onset[t0] * (1 - (t - t0)) + onset[t0 + 1] * (t - t0);
  }
  if (pontos > fase.pontos) fase = { off, pontos };
}

const arred = (arr, d = 3) => Array.from(arr, (v) => Number(v.toFixed(d)));
const resultado = {
  fps: FPS,
  duracao: Number(duracao.toFixed(3)),
  bpm: Number(melhor.bpm.toFixed(1)),
  primeiraBatida: Number((fase.off / FPS).toFixed(3)),
  energia: arred(energia), graves: arred(g), medios: arred(m), agudos: arred(a), pulso: arred(pulso),
};
fs.mkdirSync(require('path').dirname(saida), { recursive: true });
fs.writeFileSync(saida, JSON.stringify(resultado));

// ---------------------------------------------------------------- resumo legível
console.log(`duração ${duracao.toFixed(2)} s | ${quadros} quadros a ${FPS} fps | andamento ~${resultado.bpm} BPM (1ª batida em ${resultado.primeiraBatida}s)`);
console.log('energia por trecho de 10 s (0-9):');
let linha = '';
for (let s = 0; s < duracao; s += 10) {
  const ini = Math.floor(s * FPS), fim = Math.min(quadros, Math.floor((s + 10) * FPS));
  let soma = 0; for (let i = ini; i < fim; i++) soma += energia[i];
  const v = Math.round((soma / Math.max(1, fim - ini)) * 9);
  linha += `${String(Math.floor(s / 60)).padStart(1, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')} ${'█'.repeat(v)}${'·'.repeat(9 - v)}  `;
  if ((s / 10) % 3 === 2) { console.log('  ' + linha); linha = ''; }
}
if (linha) console.log('  ' + linha);
console.log('gravado em', saida);
