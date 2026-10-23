#!/usr/bin/env node
// CLI para gerenciar o canal do YouTube do Hess & Soares (YouTube Data API v3).
// Uso: node yt.mjs <comando> [opções]   —   veja `node yt.mjs help` ou o README.md.

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import readline from 'node:readline/promises';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { OAuth2Client } from 'google-auth-library';
import { youtube as youtubeApi } from '@googleapis/youtube';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const CRED_DIR = path.join(DIR, '.credentials');
const CLIENT_FILE = process.env.YT_CLIENT_SECRET_FILE || path.join(CRED_DIR, 'client_secret.json');
const TOKEN_FILE = process.env.YT_TOKEN_FILE || path.join(CRED_DIR, 'token.json');
const REDIRECT_PORT = Number(process.env.YT_REDIRECT_PORT || 53682);
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}`;

// "youtube" cobre upload, edição de vídeos, thumbnails, playlists e dados do canal.
// "youtube.force-ssl" é exigido para legendas e comentários.
const SCOPES = [
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.force-ssl',
];

const PRIVACY = ['private', 'unlisted', 'public'];

// ---------- autenticação ----------

function loadClientConfig() {
  if (process.env.YT_CLIENT_ID && process.env.YT_CLIENT_SECRET) {
    return { clientId: process.env.YT_CLIENT_ID, clientSecret: process.env.YT_CLIENT_SECRET };
  }
  if (!fs.existsSync(CLIENT_FILE)) {
    fail(
      `Credenciais OAuth não encontradas.\n` +
      `Baixe o JSON do cliente OAuth (tipo "App para computador") no Google Cloud Console e salve em:\n  ${CLIENT_FILE}\n` +
      `ou defina YT_CLIENT_ID e YT_CLIENT_SECRET. Veja youtube/README.md.`
    );
  }
  const raw = JSON.parse(fs.readFileSync(CLIENT_FILE, 'utf8'));
  const c = raw.installed || raw.web;
  if (!c) fail(`Formato inesperado em ${CLIENT_FILE} (esperado "installed" ou "web").`);
  return { clientId: c.client_id, clientSecret: c.client_secret };
}

function newOAuthClient() {
  const { clientId, clientSecret } = loadClientConfig();
  return new OAuth2Client({ clientId, clientSecret, redirectUri: REDIRECT_URI });
}

function saveToken(tokens) {
  fs.mkdirSync(path.dirname(TOKEN_FILE), { recursive: true, mode: 0o700 });
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2), { mode: 0o600 });
}

function getAuthorizedClient() {
  const client = newOAuthClient();
  let tokens;
  if (process.env.YT_REFRESH_TOKEN) {
    tokens = { refresh_token: process.env.YT_REFRESH_TOKEN };
  } else if (fs.existsSync(TOKEN_FILE)) {
    tokens = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
  } else {
    fail('Canal ainda não vinculado. Rode primeiro:  node yt.mjs auth');
  }
  client.setCredentials(tokens);
  // Persiste access tokens renovados (o refresh_token só vem na primeira autorização).
  client.on('tokens', (t) => {
    if (process.env.YT_REFRESH_TOKEN) return;
    saveToken({ ...tokens, ...t, refresh_token: t.refresh_token || tokens.refresh_token });
  });
  return client;
}

function yt() {
  return youtubeApi({ version: 'v3', auth: getAuthorizedClient() });
}

// Aceita o código puro ou a URL inteira de redirecionamento (http://localhost:...?code=...).
function extractCode(input) {
  const s = input.trim();
  try {
    const u = new URL(s);
    const code = u.searchParams.get('code');
    if (code) return code;
  } catch {}
  return s;
}

async function waitForLocalRedirect() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, REDIRECT_URI);
      const code = url.searchParams.get('code');
      const err = url.searchParams.get('error');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(code
        ? '<h2>Canal vinculado. Pode fechar esta aba e voltar ao terminal.</h2>'
        : `<h2>Falha na autorização: ${err || 'sem código'}</h2>`);
      server.close();
      code ? resolve(code) : reject(new Error(err || 'sem código'));
    });
    server.on('error', reject);
    server.listen(REDIRECT_PORT, '127.0.0.1');
  });
}

async function cmdAuth(opts) {
  const client = newOAuthClient();
  let code = opts.code ? extractCode(opts.code) : null;

  if (!code) {
    const url = client.generateAuthUrl({ access_type: 'offline', prompt: 'consent', scope: SCOPES });
    console.log('\n1) Abra este link no navegador e entre com a conta Google dona do canal:\n');
    console.log(url);
    console.log('\n2) Escolha o canal do Hess & Soares e autorize.');
    console.log('   Se estiver rodando nesta máquina, o terminal captura o retorno sozinho.');
    console.log('   Se o navegador mostrar "não foi possível acessar localhost", copie a URL');
    console.log('   inteira da barra de endereços e cole aqui.\n');

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ac = new AbortController();
    const fromPaste = rl.question('Cole a URL/código (ou aguarde o retorno automático): ', { signal: ac.signal })
      .then(extractCode);
    const fromServer = waitForLocalRedirect().catch(() => new Promise(() => {}));
    code = await Promise.race([fromPaste, fromServer]);
    ac.abort();
    rl.close();
  }

  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) {
    console.warn('Aviso: o Google não devolveu refresh_token. Remova o acesso em https://myaccount.google.com/permissions e rode `auth` de novo.');
  }
  saveToken(tokens);
  client.setCredentials(tokens);

  const res = await youtubeApi({ version: 'v3', auth: client }).channels.list({ part: ['snippet'], mine: true });
  const ch = res.data.items?.[0];
  console.log(`\nVinculado ao canal: ${ch ? `${ch.snippet.title} (${ch.id})` : '(nenhum canal nesta conta)'}`);
  console.log(`Token salvo em ${path.relative(process.cwd(), TOKEN_FILE)} — NÃO commite este arquivo.`);
  if (opts['print-refresh-token']) console.log(`\nYT_REFRESH_TOKEN=${tokens.refresh_token}`);
}

// ---------- canal ----------

async function cmdChannel() {
  const res = await yt().channels.list({
    part: ['snippet', 'statistics', 'contentDetails', 'brandingSettings', 'status'],
    mine: true,
  });
  const ch = res.data.items?.[0];
  if (!ch) fail('Nenhum canal encontrado para esta conta.');
  const s = ch.statistics || {};
  console.log(`Canal:        ${ch.snippet.title}`);
  console.log(`ID:           ${ch.id}`);
  console.log(`URL:          https://www.youtube.com/${ch.snippet.customUrl || `channel/${ch.id}`}`);
  console.log(`Inscritos:    ${s.hiddenSubscriberCount ? '(oculto)' : s.subscriberCount}`);
  console.log(`Vídeos:       ${s.videoCount}`);
  console.log(`Visualizações:${' '}${s.viewCount}`);
  console.log(`Uploads:      playlist ${ch.contentDetails.relatedPlaylists.uploads}`);
  console.log(`Palavras-chave: ${ch.brandingSettings?.channel?.keywords || '-'}`);
  console.log(`\nDescrição:\n${ch.snippet.description || '-'}`);
}

async function cmdChannelUpdate(opts) {
  const api = yt();
  const res = await api.channels.list({ part: ['brandingSettings'], mine: true });
  const ch = res.data.items?.[0];
  if (!ch) fail('Nenhum canal encontrado para esta conta.');
  const branding = ch.brandingSettings || {};
  branding.channel = { ...(branding.channel || {}) };
  if (opts.description != null) branding.channel.description = readTextOpt(opts.description);
  if (opts.keywords != null) branding.channel.keywords = opts.keywords;
  if (opts.country != null) branding.channel.country = opts.country;
  if (opts.title != null) branding.channel.title = opts.title;
  await api.channels.update({ part: ['brandingSettings'], requestBody: { id: ch.id, brandingSettings: branding } });
  console.log('Canal atualizado.');
}

// ---------- vídeos ----------

async function cmdList(opts) {
  const api = yt();
  const ch = (await api.channels.list({ part: ['contentDetails'], mine: true })).data.items?.[0];
  if (!ch) fail('Nenhum canal encontrado para esta conta.');
  const max = Number(opts.max || 25);
  const items = [];
  let pageToken;
  do {
    const r = await api.playlistItems.list({
      part: ['contentDetails'],
      playlistId: ch.contentDetails.relatedPlaylists.uploads,
      maxResults: Math.min(50, max - items.length),
      pageToken,
    });
    items.push(...r.data.items);
    pageToken = r.data.nextPageToken;
  } while (pageToken && items.length < max);

  if (!items.length) return console.log('Nenhum vídeo no canal.');
  const ids = items.map((i) => i.contentDetails.videoId);
  const vids = (await api.videos.list({ part: ['snippet', 'status', 'statistics'], id: ids })).data.items;
  for (const v of vids) {
    console.log(`${v.id}  [${v.status.privacyStatus}]  ${v.snippet.publishedAt.slice(0, 10)}  ${v.statistics?.viewCount ?? 0} views  ${v.snippet.title}`);
  }
}

async function cmdGet(opts, [videoId]) {
  if (!videoId) fail('Informe o ID do vídeo:  node yt.mjs get <videoId>');
  const v = (await yt().videos.list({ part: ['snippet', 'status', 'statistics'], id: [videoId] })).data.items?.[0];
  if (!v) fail(`Vídeo ${videoId} não encontrado.`);
  console.log(JSON.stringify({
    id: v.id,
    url: `https://youtu.be/${v.id}`,
    title: v.snippet.title,
    description: v.snippet.description,
    tags: v.snippet.tags || [],
    categoryId: v.snippet.categoryId,
    privacyStatus: v.status.privacyStatus,
    publishAt: v.status.publishAt,
    madeForKids: v.status.madeForKids,
    statistics: v.statistics,
  }, null, 2));
}

async function cmdUpload(opts, [file]) {
  const meta = loadMeta(opts);
  file = file || meta.file;
  if (!file) fail('Informe o arquivo de vídeo:  node yt.mjs upload video.mp4 --title "..."');
  if (!fs.existsSync(file)) fail(`Arquivo não encontrado: ${file}`);
  if (!meta.title) fail('Título obrigatório (--title ou "title" no --meta).');

  const privacyStatus = meta.privacy || 'private';
  if (!PRIVACY.includes(privacyStatus)) fail(`--privacy deve ser um de: ${PRIVACY.join(', ')}`);

  const status = {
    privacyStatus: meta.publishAt ? 'private' : privacyStatus, // agendamento exige "private"
    selfDeclaredMadeForKids: Boolean(meta.madeForKids),
    embeddable: true,
  };
  if (meta.publishAt) status.publishAt = new Date(meta.publishAt).toISOString();

  const api = yt();
  const size = fs.statSync(file).size;
  console.log(`Enviando ${path.basename(file)} (${(size / 1024 / 1024).toFixed(1)} MB)...`);

  const res = await api.videos.insert(
    {
      part: ['snippet', 'status'],
      notifySubscribers: meta.notify !== false,
      requestBody: {
        snippet: {
          title: meta.title,
          description: meta.description || '',
          tags: meta.tags,
          categoryId: String(meta.category || 27), // 27 = Educação
          defaultLanguage: meta.language || 'pt-BR',
          defaultAudioLanguage: meta.language || 'pt-BR',
        },
        status,
      },
      media: { body: fs.createReadStream(file) },
    },
    {
      onUploadProgress: (e) => {
        process.stdout.write(`\r  ${Math.round((e.bytesRead / size) * 100)}%`);
      },
    }
  );
  process.stdout.write('\n');
  const id = res.data.id;
  console.log(`Vídeo enviado: https://youtu.be/${id}  (${res.data.status.privacyStatus})`);

  if (meta.thumbnail) await setThumbnail(api, id, meta.thumbnail);
  if (meta.playlist) await addToPlaylist(api, meta.playlist, id);
  if (res.data.status.uploadStatus === 'rejected' || res.data.status.privacyStatus !== status.privacyStatus) {
    console.warn('Atenção: o status final difere do pedido. Projetos da API não auditados pelo Google só podem publicar como "private" — veja o README.');
  }
}

async function cmdUpdate(opts, [videoId]) {
  if (!videoId) fail('Informe o ID do vídeo:  node yt.mjs update <videoId> --title "..."');
  const meta = loadMeta(opts);
  const api = yt();
  const v = (await api.videos.list({ part: ['snippet', 'status'], id: [videoId] })).data.items?.[0];
  if (!v) fail(`Vídeo ${videoId} não encontrado.`);

  // videos.update substitui o snippet inteiro: partimos do atual e trocamos só o que foi pedido.
  const snippet = {
    title: v.snippet.title,
    description: v.snippet.description,
    tags: v.snippet.tags,
    categoryId: v.snippet.categoryId,
    defaultLanguage: v.snippet.defaultLanguage,
    defaultAudioLanguage: v.snippet.defaultAudioLanguage,
  };
  if (meta.title != null) snippet.title = meta.title;
  if (meta.description != null) snippet.description = meta.description;
  if (meta.tags != null) snippet.tags = meta.tags;
  if (meta.category != null) snippet.categoryId = String(meta.category);
  if (meta.language != null) snippet.defaultLanguage = snippet.defaultAudioLanguage = meta.language;

  const status = {
    privacyStatus: v.status.privacyStatus,
    embeddable: v.status.embeddable,
    publicStatsViewable: v.status.publicStatsViewable,
    selfDeclaredMadeForKids: v.status.madeForKids,
    license: v.status.license,
  };
  if (meta.privacy != null) {
    if (!PRIVACY.includes(meta.privacy)) fail(`--privacy deve ser um de: ${PRIVACY.join(', ')}`);
    status.privacyStatus = meta.privacy;
  }
  if (meta.publishAt != null) {
    status.privacyStatus = 'private';
    status.publishAt = new Date(meta.publishAt).toISOString();
  }

  await api.videos.update({ part: ['snippet', 'status'], requestBody: { id: videoId, snippet, status } });
  console.log(`Vídeo atualizado: https://youtu.be/${videoId}`);
  if (meta.thumbnail) await setThumbnail(api, videoId, meta.thumbnail);
  if (meta.playlist) await addToPlaylist(api, meta.playlist, videoId);
}

async function cmdThumbnail(opts, [videoId, image]) {
  if (!videoId || !image) fail('Uso: node yt.mjs thumbnail <videoId> <imagem.jpg|png>');
  await setThumbnail(yt(), videoId, image);
}

async function cmdDelete(opts, [videoId]) {
  if (!videoId) fail('Uso: node yt.mjs delete <videoId> --yes');
  if (!opts.yes) fail('Exclusão é permanente. Repita com --yes para confirmar.');
  await yt().videos.delete({ id: videoId });
  console.log(`Vídeo ${videoId} excluído.`);
}

async function setThumbnail(api, videoId, image) {
  if (!fs.existsSync(image)) fail(`Imagem não encontrada: ${image}`);
  const ext = path.extname(image).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
  await api.thumbnails.set({ videoId, media: { mimeType, body: fs.createReadStream(image) } });
  console.log(`Thumbnail definida para ${videoId}. (Exige canal com verificação por telefone.)`);
}

// ---------- playlists ----------

async function cmdPlaylists() {
  const r = await yt().playlists.list({ part: ['snippet', 'status', 'contentDetails'], mine: true, maxResults: 50 });
  if (!r.data.items.length) return console.log('Nenhuma playlist.');
  for (const p of r.data.items) {
    console.log(`${p.id}  [${p.status.privacyStatus}]  ${p.contentDetails.itemCount} vídeos  ${p.snippet.title}`);
  }
}

async function cmdPlaylistCreate(opts) {
  if (!opts.title) fail('Uso: node yt.mjs playlist-create --title "..." [--description "..."] [--privacy public]');
  const r = await yt().playlists.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: { title: opts.title, description: readTextOpt(opts.description) || '', defaultLanguage: 'pt-BR' },
      status: { privacyStatus: opts.privacy || 'public' },
    },
  });
  console.log(`Playlist criada: ${r.data.id}  https://www.youtube.com/playlist?list=${r.data.id}`);
}

async function cmdPlaylistAdd(opts, [playlistId, videoId]) {
  if (!playlistId || !videoId) fail('Uso: node yt.mjs playlist-add <playlistId> <videoId>');
  await addToPlaylist(yt(), playlistId, videoId);
}

async function addToPlaylist(api, playlistId, videoId) {
  await api.playlistItems.insert({
    part: ['snippet'],
    requestBody: { snippet: { playlistId, resourceId: { kind: 'youtube#video', videoId } } },
  });
  console.log(`Vídeo ${videoId} adicionado à playlist ${playlistId}.`);
}

// ---------- utilitários ----------

// Junta --meta arquivo.json com as flags da linha de comando (as flags têm prioridade).
function loadMeta(opts) {
  let meta = {};
  if (opts.meta) {
    if (!fs.existsSync(opts.meta)) fail(`Arquivo de metadados não encontrado: ${opts.meta}`);
    meta = JSON.parse(fs.readFileSync(opts.meta, 'utf8'));
    const base = path.dirname(path.resolve(opts.meta));
    for (const k of ['file', 'thumbnail', 'descriptionFile']) {
      if (meta[k] && !path.isAbsolute(meta[k])) meta[k] = path.join(base, meta[k]);
    }
    if (meta.descriptionFile) meta.description = fs.readFileSync(meta.descriptionFile, 'utf8');
  }
  if (opts.title != null) meta.title = opts.title;
  if (opts.description != null) meta.description = readTextOpt(opts.description);
  if (opts.tags != null) meta.tags = opts.tags.split(',').map((t) => t.trim()).filter(Boolean);
  if (opts.category != null) meta.category = opts.category;
  if (opts.privacy != null) meta.privacy = opts.privacy;
  if (opts['publish-at'] != null) meta.publishAt = opts['publish-at'];
  if (opts.thumbnail != null) meta.thumbnail = opts.thumbnail;
  if (opts.playlist != null) meta.playlist = opts.playlist;
  if (opts.language != null) meta.language = opts.language;
  if (opts['made-for-kids']) meta.madeForKids = true;
  if (opts['no-notify']) meta.notify = false;
  if (typeof meta.tags === 'string') meta.tags = meta.tags.split(',').map((t) => t.trim()).filter(Boolean);
  return meta;
}

// "@arquivo.txt" lê o texto de um arquivo; qualquer outro valor é usado literalmente.
function readTextOpt(v) {
  if (v == null) return v;
  if (v.startsWith('@')) {
    const f = v.slice(1);
    if (!fs.existsSync(f)) fail(`Arquivo não encontrado: ${f}`);
    return fs.readFileSync(f, 'utf8');
  }
  return v.replace(/\\n/g, '\n');
}

function fail(msg) {
  console.error(`Erro: ${msg}`);
  process.exit(1);
}

const HELP = `
Gerenciador do canal do YouTube — Hess & Soares

  node yt.mjs auth [--code <url|código>] [--print-refresh-token]
      Vincula a conta/canal (OAuth). Salva o token em .credentials/token.json.

  node yt.mjs channel
      Mostra dados do canal (ID, URL, inscritos, descrição...).
  node yt.mjs channel-update [--description "...|@arquivo.txt"] [--keywords "a b c"] [--country BR]

  node yt.mjs list [--max 25]                 Lista os vídeos do canal
  node yt.mjs get <videoId>                   Detalhes de um vídeo (JSON)

  node yt.mjs upload <video.mp4> --title "..." [--description "...|@desc.txt"]
        [--tags "a,b,c"] [--privacy private|unlisted|public] [--publish-at 2026-11-01T12:00:00-03:00]
        [--category 27] [--thumbnail capa.jpg] [--playlist <id>] [--language pt-BR]
        [--made-for-kids] [--no-notify] [--meta video.json]

  node yt.mjs update <videoId> [mesmas opções de metadados do upload]
  node yt.mjs thumbnail <videoId> <imagem.jpg>
  node yt.mjs delete <videoId> --yes

  node yt.mjs playlists
  node yt.mjs playlist-create --title "..." [--description "..."] [--privacy public]
  node yt.mjs playlist-add <playlistId> <videoId>
`;

const COMMANDS = {
  auth: cmdAuth,
  channel: cmdChannel,
  'channel-update': cmdChannelUpdate,
  list: cmdList,
  get: cmdGet,
  upload: cmdUpload,
  update: cmdUpdate,
  thumbnail: cmdThumbnail,
  delete: cmdDelete,
  playlists: cmdPlaylists,
  'playlist-create': cmdPlaylistCreate,
  'playlist-add': cmdPlaylistAdd,
};

const { values: opts, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    code: { type: 'string' },
    'print-refresh-token': { type: 'boolean' },
    title: { type: 'string' },
    description: { type: 'string' },
    tags: { type: 'string' },
    keywords: { type: 'string' },
    country: { type: 'string' },
    category: { type: 'string' },
    privacy: { type: 'string' },
    'publish-at': { type: 'string' },
    thumbnail: { type: 'string' },
    playlist: { type: 'string' },
    language: { type: 'string' },
    'made-for-kids': { type: 'boolean' },
    'no-notify': { type: 'boolean' },
    meta: { type: 'string' },
    max: { type: 'string' },
    yes: { type: 'boolean' },
    help: { type: 'boolean', short: 'h' },
  },
});

const [cmd, ...args] = positionals;
if (!cmd || opts.help || cmd === 'help' || !COMMANDS[cmd]) {
  console.log(HELP);
  process.exit(cmd && cmd !== 'help' && !COMMANDS[cmd] ? 1 : 0);
}

try {
  await COMMANDS[cmd](opts, args);
  process.exit(0);
} catch (e) {
  const apiErr = e?.response?.data?.error;
  fail(apiErr ? `${apiErr.code} ${apiErr.message}` : e?.message || String(e));
}
