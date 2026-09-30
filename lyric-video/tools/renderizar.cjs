#!/usr/bin/env node
// Renderiza o vídeo quadro a quadro: abre src/index.html num Chromium (Playwright), chama
// window.__renderizar(t) para cada instante, captura a imagem e envia ao ffmpeg. Vários
// trabalhadores renderizam trechos diferentes ao mesmo tempo; no fim os trechos são unidos e
// o áudio original é acrescentado. Como cada quadro é função pura de t, o resultado é o mesmo
// de qualquer jeito que se divida o trabalho.
//
// Vídeo:   node tools/renderizar.cjs --musica <pasta>[,<pasta2>...] --saida out/joao.mp4
//              [--formato 16:9|9:16|1:1] [--de 0] [--ate 90] [--fps 30] [--workers 4] [--crf 18] [--altura 1080]
//              [--temas pastor,aguas,correntes] [--fundo imagem.jpg] [--tune animation] [--legenda inteira|palavras] [--sem-fade-fim]
//          --conferencia  etapa 1 da regra do canal: fundo preto, só a legenda (720p, leve)
//          Com várias pastas, as músicas tocam em sequência (áudio juntado sem pausa) e cada uma tem a sua
//          abertura e o seu tema de animação (--temas). Temas de lago usam a paleta da imagem (--fundo,
//          padrão: fundo.jpg da primeira pasta) sempre em tons pastéis.
// Imagens: node tools/renderizar.cjs --musica <pasta> --still 12,30,45.5   (grava em work/stills)
//
// Requisitos: playwright (NODE_PATH=$(npm root -g) se estiver instalado globalmente) e ffmpeg
// (variável FFMPEG=/caminho/do/ffmpeg se não estiver no PATH).

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, spawnSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const { chromium } = require('playwright');

// ---------------------------------------------------------------- argumentos
const arg = (nome, padrao) => {
  const i = process.argv.indexOf('--' + nome);
  return i > 0 && i + 1 < process.argv.length ? process.argv[i + 1] : padrao;
};
const musicaDirs = String(arg('musica', process.env.MUSICA_DIR) || '').split(',').map((p) => p.trim()).filter(Boolean).map((p) => path.resolve(p));
const temasArg = arg('temas', '');
const LAGO = temasArg.split(',').some((t) => t && t !== 'pastor');
const formato = arg('formato', '16:9');
const conferencia = process.argv.includes('--conferencia');   // etapa 1: fundo preto, só a legenda (720p por padrão)
const [W0, H0] = { '16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080] }[formato] || [1920, 1080];
const altura = Number(arg('altura', conferencia ? 720 : H0));
const W = 2 * Math.round((W0 * altura / H0) / 2), H = 2 * Math.round(altura / 2);
const fps = Number(arg('fps', 30));
const de = Number(arg('de', 0));
let ate = Number(arg('ate', 0));
const nTrab = Math.max(1, Number(arg('workers', Math.min(4, os.cpus().length))));
const crf = String(arg('crf', conferencia ? 27 : 18));
const preset = String(arg('preset', conferencia ? 'veryfast' : 'medium'));
const legendaModo = arg('legenda', '');        // inteira | palavras (padrão: inteira nos temas de lago, palavras no do pastor)
const semFadeFim = process.argv.includes('--sem-fade-fim');   // trecho que será emendado em outro vídeo: não some no fim do trecho
const tune = arg('tune', '');                  // ex.: animation (bom para cenas de desenho com áreas lisas)
const imagem = arg('imagem', 'jpeg');
const stills = arg('still', '');
const saida = path.resolve(arg('saida', path.join(RAIZ, 'out', `${conferencia ? 'conferencia' : 'video'}-${formato.replace(':', 'x')}.mp4`)));
const WORK = path.join(RAIZ, 'work');

if (!musicaDirs.length) {
  console.error('informe --musica <pasta da música> (ou defina MUSICA_DIR)');
  process.exit(1);
}

// ---------------------------------------------------------------- preparação dos dados
const EXT_AUDIO = ['.m4a', '.mp3', '.wav', '.flac', '.ogg', '.aac', '.opus'];
const audioDe = (dir) => {
  const a = fs.readdirSync(dir).filter((f) => EXT_AUDIO.includes(path.extname(f).toLowerCase())).sort().map((f) => path.join(dir, f))[0];
  if (!a) { console.error('nenhum áudio em', dir); process.exit(1); }
  return a;
};
const audios = musicaDirs.map(audioDe);
const DADOS = path.join(RAIZ, 'data');
const ALVO_JUNTO = path.join(DADOS, 'audio-juntado.wav');
let audioArq = audios[0];                      // o que vai para o vídeo (com várias músicas: o áudio juntado)

function rodar(script, args) {
  const r = spawnSync(process.execPath, [path.join(__dirname, script), ...args], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(1);
}
function preparar() {
  fs.mkdirSync(DADOS, { recursive: true });
  const mt = (f) => fs.statSync(f).mtimeMs;
  const antigo = (arq, fontes) => !fs.existsSync(arq) || fontes.some((f) => mt(f) > mt(arq));
  const reanalisar = process.argv.includes('--reanalisar');
  const alvoAudio = path.join(DADOS, 'audio.json');
  if (audios.length === 1) {
    if (antigo(alvoAudio, [audios[0]]) || reanalisar) rodar('analisar-audio.cjs', [audios[0], alvoAudio, String(fps)]);
  } else {
    // uma análise por música (duração, BPM, primeira batida) + o áudio juntado, sem pausa, e a análise dele
    audios.forEach((a, i) => {
      const alvo = path.join(DADOS, `audio-${path.basename(musicaDirs[i])}.json`);
      if (antigo(alvo, [a]) || reanalisar) rodar('analisar-audio.cjs', [a, alvo, String(fps)]);
    });
    if (antigo(ALVO_JUNTO, audios)) {
      const ent = audios.flatMap((a) => ['-i', a]);
      const filtro = audios.map((_, i) => `[${i}:a]aresample=48000,aformat=channel_layouts=stereo[a${i}]`).join(';')
        + `;${audios.map((_, i) => `[a${i}]`).join('')}concat=n=${audios.length}:v=0:a=1[fora]`;
      const r = spawnSync(FFMPEG, ['-y', '-loglevel', 'error', ...ent, '-filter_complex', filtro, '-map', '[fora]', '-c:a', 'pcm_s16le', ALVO_JUNTO], { stdio: 'inherit' });
      if (r.status !== 0) { console.error('falha ao juntar os áudios'); process.exit(1); }
    }
    if (antigo(alvoAudio, [ALVO_JUNTO]) || reanalisar) rodar('analisar-audio.cjs', [ALVO_JUNTO, alvoAudio, String(fps)]);
    audioArq = ALVO_JUNTO;
  }
  if (LAGO) {
    const fundo = path.resolve(arg('fundo', path.join(musicaDirs[0], 'fundo.jpg')));
    if (!fs.existsSync(fundo)) { console.error('imagem não encontrada:', fundo); process.exit(1); }
    rodar('paleta-da-imagem.cjs', [fundo, path.join(DADOS, 'paleta.json')]);
  }
  rodar('montar-dados.cjs', [musicaDirs.join(','), path.join(DADOS, 'musica.json'), ...(temasArg ? ['--temas', temasArg] : [])]);
}

// ---------------------------------------------------------------- servidor estático local
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.css': 'text/css',
};
function servir() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const arq = path.join(RAIZ, decodeURIComponent(req.url.split('?')[0]));
      if (!arq.startsWith(RAIZ) || !fs.existsSync(arq) || fs.statSync(arq).isDirectory()) { res.writeHead(404); return res.end('404'); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(arq)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(arq).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

async function abrirPagina(porta, fimT) {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-gpu', '--force-color-profile=srgb', '--font-render-hinting=none',
      '--disable-lcd-text', '--hide-scrollbars', '--disable-dev-shm-usage'],
  });
  const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on('pageerror', (e) => console.error('[página] erro:', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.error('[página]', m.text()); });
  await page.goto(`http://127.0.0.1:${porta}/src/index.html?w=${W}&h=${H}${fimT ? `&fim=${fimT}` : ''}${conferencia ? '&modo=conferencia' : ''}${legendaModo ? `&legenda=${legendaModo}` : ''}`);
  await page.waitForFunction('window.__pronto === true || window.__erro', null, { timeout: 120000 });
  const erro = await page.evaluate('window.__erro || null');
  if (erro) { console.error('falha ao iniciar a página:\n' + erro); process.exit(1); }
  return { browser, page };
}

// ---------------------------------------------------------------- imagens de revisão
async function modoStills(porta) {
  const { browser, page } = await abrirPagina(porta, 0);
  const dir = path.join(WORK, 'stills');
  fs.mkdirSync(dir, { recursive: true });
  for (const s of stills.split(',').map(Number)) {
    await page.evaluate((t) => window.__renderizar(t), s);
    const arq = path.join(dir, `t${String(s).replace('.', '_')}-${formato.replace(':', 'x')}.png`);
    await page.screenshot({ path: arq, type: 'png' });
    const info = await page.evaluate((t) => ({ hora: window.__info.hora(t), lum: window.__info.lum(t) }), s);
    console.log(`gravado ${path.relative(RAIZ, arq)}  (hora do dia ${info.hora.toFixed(1)}, luminosidade do céu ${info.lum.toFixed(2)})`);
  }
  await browser.close();
}

// ---------------------------------------------------------------- vídeo
async function trabalhador(id, porta, f0, f1, fimT, progresso) {
  const { browser, page } = await abrirPagina(porta, fimT);
  const parte = path.join(WORK, `parte-${String(id).padStart(2, '0')}.mp4`);
  const ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', imagem === 'png' ? 'png' : 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', preset, ...(tune ? ['-tune', tune] : []), '-crf', crf, '-pix_fmt', 'yuv420p', '-profile:v', 'high',
    '-x264-params', 'aq-mode=3:aq-strength=0.9', '-g', String(fps * 2), parte], { stdio: ['pipe', 'ignore', 'inherit'] });
  const fechou = new Promise((res, rej) => { ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg saiu com código ' + c)))); });
  ff.stdin.on('error', () => {});
  for (let f = f0; f < f1; f++) {
    await page.evaluate((t) => window.__renderizar(t), f / fps);
    const buf = await page.screenshot(imagem === 'png' ? { type: 'png' } : { type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    progresso.feitos++;
  }
  ff.stdin.end();
  await fechou;
  await browser.close();
  return parte;
}

async function modoVideo(porta, duracao) {
  if (!ate || ate > duracao) ate = duracao;
  const fimT = semFadeFim ? 0 : ate;
  const f0 = Math.round(de * fps), f1 = Math.round(ate * fps);
  const total = f1 - f0;
  fs.rmSync(WORK, { recursive: true, force: true });
  fs.mkdirSync(WORK, { recursive: true });
  fs.mkdirSync(path.dirname(saida), { recursive: true });

  const n = Math.min(nTrab, total);
  const tam = Math.ceil(total / n);
  const progresso = { feitos: 0 };
  const inicio = Date.now();
  const timer = setInterval(() => {
    const s = (Date.now() - inicio) / 1000, r = progresso.feitos / s;
    const falta = r > 0 ? (total - progresso.feitos) / r : 0;
    console.log(`  ${progresso.feitos}/${total} quadros (${(100 * progresso.feitos / total).toFixed(0)}%) | ${r.toFixed(1)} quadros/s | faltam ~${Math.round(falta)} s`);
  }, 15000);

  console.log(`renderizando ${total} quadros (${de}s a ${ate}s, ${W}x${H}, ${fps} fps) com ${n} trabalhador(es)`);
  const partes = await Promise.all(Array.from({ length: n }, (_, i) =>
    trabalhador(i, porta, f0 + i * tam, Math.min(f1, f0 + (i + 1) * tam), fimT, progresso)));
  clearInterval(timer);
  console.log(`quadros prontos em ${((Date.now() - inicio) / 1000).toFixed(0)} s; unindo e adicionando o áudio...`);

  const lista = path.join(WORK, 'lista.txt');
  fs.writeFileSync(lista, partes.map((p) => `file '${p}'`).join('\n'));
  const dur = ate - de;
  const r = spawnSync(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lista,
    '-ss', String(de), '-t', String(dur), '-i', audioArq, '-map', '0:v:0', '-map', '1:a:0',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
    '-af', `afade=t=in:st=0:d=0.6,afade=t=out:st=${Math.max(0, dur - 1.4).toFixed(2)}:d=1.2`,
    '-movflags', '+faststart', '-shortest', saida], { stdio: 'inherit' });
  if (r.status !== 0) { console.error('falha ao unir/adicionar áudio'); process.exit(1); }
  const mb = fs.statSync(saida).size / 1048576;
  console.log(`pronto: ${saida} (${mb.toFixed(1)} MB, ${dur.toFixed(1)} s)`);
}

(async () => {
  preparar();
  const duracao = JSON.parse(fs.readFileSync(path.join(RAIZ, 'data', 'musica.json'), 'utf8')).duracao;
  const srv = await servir();
  const porta = srv.address().port;
  try {
    if (stills) await modoStills(porta);
    else await modoVideo(porta, duracao);
  } finally {
    srv.close();
  }
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
