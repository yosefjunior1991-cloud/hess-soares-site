#!/usr/bin/env node
// Lê a pasta de uma (ou mais) música(s) no formato do projeto Or Israel (legenda.srt,
// alinhamento.json, config.json...) e grava data/musica.json: partes (uma por música), linhas,
// estrofes, palavras com tempo estimado e os textos da abertura de cada música. Com várias
// músicas, os tempos de cada uma são deslocados para a posição dela na sequência (como o
// legendar.py faz). A música em si NÃO é copiada para dentro deste repositório.
//
// Uso: node tools/montar-dados.cjs <pasta>[,<pasta2>...] [saida=data/musica.json] [--temas pastor,aguas]

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const flag = (nome) => { const i = args.indexOf('--' + nome); return i >= 0 ? args[i + 1] : undefined; };
const posicionais = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const pastas = (posicionais[0] || process.env.MUSICA_DIR || '').split(',').map((p) => p.trim()).filter(Boolean);
const saida = posicionais[1] || path.join(__dirname, '..', 'data', 'musica.json');
const temas = (flag('temas') || '').split(',').map((t) => t.trim());
if (!pastas.length) {
  console.error('uso: node tools/montar-dados.cjs <pasta>[,<pasta2>...] [saida.json] [--temas pastor,aguas]');
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
const DESTAQUE_HE = /אהב|עולם|חיי|אלהים|רוח|מים|קדים|שבר|עלו|מוסר|מחס|מצוד|אבטח|כנפ|אברת|מלאכ|ישוע|עליון|שדי|אדני/;
const DESTAQUE_PT = /^(amor|amou|vida|mundo|filho|deus|cre|confia|esperanca|renascer|resgatar|eterna|vivera|espirito|aguas|vento|caminho|sopro|jugo|correntes|livres|quebrado|rei|refugio|fortaleza|asas|anjos|abrigo|confi|livrar|salva|esconderijo|altissimo|todo-poder|escudo|muralha|adonai)/;
// extras: palavras de destaque próprias da música (animacao.json -> "destaques": {"pt": [...], "he": [...]}),
// somadas às de sempre sem mudar as outras músicas
const ehDestaque = (palavra, extras) => {
  const s = semNikud(palavra).replace(/[.,;:!?"“”]/g, '');
  if (eHebraico(palavra)) return DESTAQUE_HE.test(s) || !!(extras && extras.he && extras.he.test(s));
  return DESTAQUE_PT.test(s) || !!(extras && extras.pt && extras.pt.test(s));
};

// Ritmo da música: ~0,62 s por sílaba. Se a legenda dura mais que isso (nota sustentada ou
// instrumental), a última palavra fica acesa e "respira" até o fim da legenda.
const SEG_POR_SILABA = 0.62;

function palavrasDaLinha(texto, ini, fim, extras) {
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
    return { txt, ini: +a.toFixed(3), fim: +b.toFixed(3), destaque: ehDestaque(txt, extras) };
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

// ---------------------------------------------------------------- uma música -> uma parte
const DADOS = path.join(__dirname, '..', 'data');
function lerParte(pastaP, inicio, indice) {
  const nome = path.basename(pastaP);
  const cfg = { ...lerJson(path.join(pastaP, '..', 'config.json')), ...lerJson(path.join(pastaP, 'config.json')) };
  const cues = lerSrt(path.join(pastaP, 'legenda.srt'));
  const meta = lerJson(path.join(pastaP, 'alinhamento.json'));
  // animacao.json (opcional, fica junto da música, nunca neste repositório): trechos da letra que disparam
  // os momentos da animação de cada tema (ex.: a frase em que uma corrente arrebenta)
  const anim = lerJson(path.join(pastaP, 'animacao.json'));
  const dq = anim.destaques || {};
  const destaquesExtra = {
    pt: dq.pt && dq.pt.length ? new RegExp('^(' + dq.pt.map((w) => semNikud(w).toLowerCase()).join('|') + ')') : null,
    he: dq.he && dq.he.length ? new RegExp(dq.he.map((w) => semNikud(w)).join('|')) : null,
  };
  const analise = lerJson(path.join(DADOS, `audio-${nome}.json`), null) || lerJson(path.join(DADOS, 'audio.json'), { duracao: 0 });

  const linhas = cues.map((c, i) => {
    const texto = c.textos[0];
    const hebraico = eHebraico(texto);
    const extras = c.textos.slice(1);
    const translit = hebraico && extras.length >= 2 ? extras[0] : '';
    const traducao = extras.length >= 2 ? extras[1] : extras[0] || '';
    const ini = c.ini + inicio, fim = c.fim + inicio;
    return { i: 0, ini, fim, texto, hebraico, translit, traducao, palavras: palavrasDaLinha(texto, ini, fim, destaquesExtra), bloco: 0, parte: indice };
  });
  if (Array.isArray(meta.blocos) && meta.blocos.length === linhas.length) {
    linhas.forEach((l, i) => { l.bloco = meta.blocos[i]; });
  } else {
    agruparEstrofes(linhas);
  }
  linhas.forEach((l) => { l.bloco += indice * 100000; });

  const duracao = analise.duracao || Math.ceil(cues[cues.length - 1].fim + 8);
  const parte = {
    indice, nome, tema: temas[indice] || 'pastor',
    titulo: cfg.titulo || nome,
    tituloHebraico: cfg.titulo_hebraico || '',
    tituloTranslit: cfg.titulo_transliteracao || '',
    versiculos: cfg.versiculos || '',
    canal: cfg.canal || '',
    aviso: (cfg.aviso_direitos || '').split('\n').filter(Boolean),
    inicio, duracao,
    primeiraLinha: linhas[0].ini,
    bpm: analise.bpm || 100,
    primeiraBatida: analise.primeiraBatida || 0,
    gatilhos: anim.gatilhos || {},
  };
  return { parte, linhas };
}

// ---------------------------------------------------------------- montagem
const partes = [];
let linhas = [];
let inicio = 0;
pastas.forEach((p, idx) => {
  const r = lerParte(p, inicio, idx);
  partes.push(r.parte);
  linhas = linhas.concat(r.linhas);
  inicio += r.parte.duracao;
});
linhas.forEach((l, i) => { l.i = i; });

const estrofes = [];
for (const l of linhas) {
  const e = estrofes[estrofes.length - 1];
  if (e && e.bloco === l.bloco) { e.linhas.push(l.i); e.fim = Math.max(e.fim, l.fim); }
  else estrofes.push({ bloco: l.bloco, ini: l.ini, fim: l.fim, linhas: [l.i] });
}

const p0 = partes[0];
const musica = {
  nome: partes.map((p) => p.nome).join('+'),
  titulo: p0.titulo, tituloHebraico: p0.tituloHebraico, tituloTranslit: p0.tituloTranslit,
  versiculos: p0.versiculos, canal: p0.canal, aviso: p0.aviso,
  duracao: inicio,
  primeiraLinha: linhas[0].ini,
  partes, linhas, estrofes,
};

fs.mkdirSync(path.dirname(saida), { recursive: true });
fs.writeFileSync(saida, JSON.stringify(musica, null, 1));
console.log(`${partes.length} música(s): ${partes.map((p) => `${p.nome} (${p.duracao.toFixed(1)} s, tema ${p.tema})`).join(' + ')}`);
console.log(`${linhas.length} linhas em ${estrofes.length} estrofes | duração total ${musica.duracao.toFixed(2)} s -> ${saida}`);
