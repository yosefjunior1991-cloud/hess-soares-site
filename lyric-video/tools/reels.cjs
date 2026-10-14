#!/usr/bin/env node
// Gera os Reels/Shorts (9:16, 10 s) a partir de um plano JSON. Cada item do plano é um recorte de uma música
// (de/ate em segundos) renderizado no tema da música, sem abertura e com o selo "Completo no YouTube - Or Israel".
//
//   node tools/reels.cjs --plano /caminho/para/or-israel/musicas/reels.json --musicas /caminho/para/or-israel/musicas \
//        --saida out/reels [--so id1,id2] [--crf 20]
//
// Formato do plano: { "selo": "Completo no YouTube - Or Israel", "reels": [ { "id", "musica", "temas", "de", "ate", "legenda"? } ] }
// (o plano e as músicas ficam no repositório privado; este script não leva letra nem áudio.)
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const arg = (n, p) => { const i = process.argv.indexOf('--' + n); return i > 0 && i + 1 < process.argv.length ? process.argv[i + 1] : p; };
const plano = JSON.parse(fs.readFileSync(path.resolve(arg('plano', '')), 'utf8'));
const musicas = path.resolve(arg('musicas', path.dirname(path.resolve(arg('plano', '')))));
const saida = path.resolve(arg('saida', path.join(__dirname, '..', 'out', 'reels')));
const so = arg('so', '') ? arg('so', '').split(',') : null;
const crf = arg('crf', '20');
fs.mkdirSync(saida, { recursive: true });

for (const r of plano.reels) {
  if (so && !so.includes(r.id)) continue;
  const arq = path.join(saida, `${r.id}_9x16.mp4`);
  const args = [path.join(__dirname, 'renderizar.cjs'), '--musica', path.join(musicas, r.musica), '--formato', '9:16', '--reels',
    '--selo', plano.selo || 'Completo no YouTube - Or Israel', '--de', String(r.de), '--ate', String(r.ate),
    '--crf', crf, '--tune', 'animation', '--saida', arq];
  if (r.temas) args.push('--temas', r.temas);
  if (r.legenda) args.push('--legenda', r.legenda);
  console.log(`\n== ${r.id}: ${r.musica} ${r.de}s-${r.ate}s`);
  const x = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (x.status !== 0) { console.error('falhou:', r.id); process.exit(1); }
}
