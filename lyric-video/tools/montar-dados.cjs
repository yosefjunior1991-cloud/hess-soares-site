#!/usr/bin/env node
// Lê a pasta de uma música no formato do projeto Or Israel (legenda.srt, alinhamento.json,
// config.json...) e grava data/musica.json: linhas, estrofes, palavras com tempo estimado e
// os textos da abertura. A música em si NÃO é copiada para dentro deste repositório.
//
// Uso: node tools/montar-dados.cjs <pasta-da-musica> [saida=data/musica.json]

const fs = require('fs');
const path = require('path');

const pasta = process.argv[2] || process.env.MUSICA_DIR;
const saida = process.argv[3] || path.join(__dirname, '..', 'data', 'musica.json');
if (!pasta) {
  console.error('uso: node tools/montar-dados.cjs <pasta-da-musica> [saida.json]');
  process.exit(1);
}

const lerJson = (arq, padrao = {}) => (fs.existsSync(arq) ? JSON.parse(fs.readFileSync(arq, 'utf8')) : padrao);
const eHebraico = (s) => /[֐-׿]/.test(s);

// ---------------------------------------------------------------- SRT (mesma leitura do legendar.py)
function lerSrt(arq) {
  const conteudo = fs.readFileSync(arq, 'utf8').replace(/^﻿/, '');
  const re = /(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)/;
  const cues = [];
  for (const bloco of conteudo.trim().split(/\n\s*\n/)) {
    const partes = bloco.trim().split(/\r?\n/);
    for (let i = 0; i < partes.length; i++) {
      const m = re.exec(partes[i]);
      if (!m) continue;
      const g = m.slice(1).map(Number);
      const textos = partes.slice(i + 1).map((p) => p.trim()).filter(Boolean);
      if (textos.length) {
        cues.push({
          ini: g[0] * 3600 + g[1] * 60 + g[2] + g[3] / 1000,
          fim: g[4] * 3600 + g[5] * 60 + g[6] + g[7] / 1000,
          textos,
        });
      }
      break;
    }
  }
  return cues.sort((a, b) => a.ini - b.ini);
}

// ---------------------------------------------------------------- sílabas (estimativa)
// Hebraico: cada vogal (nikud) é uma sílaba; a sheva (ְ) e o dagesh não contam.
const silabasHebraico = (p) => (p.match(/[ֱ-ׇֻ]/g) || []).length || 1;
// Português: grupos de vogais (ditongos contam como um).
const silabasPt = (p) => (p.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().match(/[aeiouy]+/g) || []).length || 1;

// palavras que ganham destaque (cor em degradê e "pulo" ao serem cantadas)
const semNikud = (s) => s.normalize('NFD').replace(/[֑-ׇ]/g, '').replace(/[̀-ͯ]/g, '').toLowerCase();
const DESTAQUE_HE = /אהב|עולם|חיי|אלהים/;
const DESTAQUE_PT = /^(amor|amou|vida|mundo|filho|deus|cre|confia|esperanca|renascer|resgatar|eterna|vivera)/;
const ehDestaque = (palavra) => {
  const s = semNikud(palavra).replace(/[.,;:!?"“”]/g, '');
  return eHebraico(palavra) ? DESTAQUE_HE.test(s) : DESTAQUE_PT.test(s);
};

// Ritmo da música: ~0,62 s por sílaba. Se a legenda dura mais que isso (nota sustentada ou
// instrumental), a última palavra fica acesa e "respira" até o fim da legenda.
const SEG_POR_SILABA = 0.62;

function palavrasDaLinha(texto, ini, fim) {
  const hebraico = eHebraico(texto);
  const toks = texto.split(/\s+/).filter(Boolean);
  const sil = toks.map((p) => (hebraico ? silabasHebraico(p) : silabasPt(p)));
  const total = sil.reduce((a, b) => a + b, 0);
  const dur = fim - ini;
  const vao = Math.min(dur - 0.05, Math.max(Math.min(dur, 1.0), total * SEG_POR_SILABA));
  let acumulado = 0;
  return toks.map((txt, k) => {
    const a = ini + (acumulado / total) * vao;
    acumulado += sil[k];
    const b = ini + (acumulado / total) * vao;
    return { txt, ini: +a.toFixed(3), fim: +b.toFixed(3), destaque: ehDestaque(txt) };
  });
}

// ---------------------------------------------------------------- estrofes
function agruparEstrofes(linhas) {
  let bloco = 0, tamanho = 0;
  linhas.forEach((l, i) => {
    if (i) {
      const a = linhas[i - 1];
      if (a.hebraico !== l.hebraico || l.ini - a.fim > 4.0 || tamanho >= 4) { bloco++; tamanho = 0; }
    }
    l.bloco = bloco;
    tamanho++;
  });
}

// ---------------------------------------------------------------- montagem
const cfgMusica = lerJson(path.join(pasta, 'config.json'));
const cfgGeral = lerJson(path.join(pasta, '..', 'config.json'));
const cfg = { ...cfgGeral, ...cfgMusica };

const cues = lerSrt(path.join(pasta, 'legenda.srt'));
const linhas = cues.map((c, i) => {
  const texto = c.textos[0];
  const hebraico = eHebraico(texto);
  const extras = c.textos.slice(1);
  const translit = hebraico && extras.length >= 2 ? extras[0] : '';
  const traducao = extras.length >= 2 ? extras[1] : extras[0] || '';
  return {
    i, ini: c.ini, fim: c.fim, texto, hebraico, translit, traducao,
    palavras: palavrasDaLinha(texto, c.ini, c.fim),
    bloco: 0,
  };
});

const meta = lerJson(path.join(pasta, 'alinhamento.json'));
if (Array.isArray(meta.blocos) && meta.blocos.length === linhas.length) {
  linhas.forEach((l, i) => { l.bloco = meta.blocos[i]; });
} else {
  agruparEstrofes(linhas);
}

const estrofes = [];
for (const l of linhas) {
  const e = estrofes[estrofes.length - 1];
  if (e && e.bloco === l.bloco) { e.linhas.push(l.i); e.fim = Math.max(e.fim, l.fim); }
  else estrofes.push({ bloco: l.bloco, ini: l.ini, fim: l.fim, linhas: [l.i] });
}

const audio = lerJson(path.join(__dirname, '..', 'data', 'audio.json'), { duracao: 0 });
const musica = {
  nome: path.basename(pasta),
  titulo: cfg.titulo || path.basename(pasta),
  tituloHebraico: cfg.titulo_hebraico || '',
  tituloTranslit: cfg.titulo_transliteracao || '',
  versiculos: cfg.versiculos || '',
  canal: cfg.canal || '',
  aviso: (cfg.aviso_direitos || '').split('\n').filter(Boolean),
  duracao: audio.duracao || Math.ceil(linhas[linhas.length - 1].fim + 8),
  primeiraLinha: linhas[0].ini,
  linhas,
  estrofes,
};

fs.mkdirSync(path.dirname(saida), { recursive: true });
fs.writeFileSync(saida, JSON.stringify(musica, null, 1));
console.log(`${linhas.length} linhas em ${estrofes.length} estrofes | 1ª linha em ${musica.primeiraLinha.toFixed(2)} s | duração ${musica.duracao} s -> ${saida}`);
