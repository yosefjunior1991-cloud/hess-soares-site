# lyric-video — vídeo de letra animado, feito em JavaScript

Gera um vídeo de letra sincronizada com **cenário animado em tom pastel (estilo Apple)**, personagens
(pastor, ovelhas, cordeirinho, pombas) e **legendas dinâmicas**, a partir de uma pasta de música no
formato do projeto **Or Israel** (`musica.m4a`, `legenda.srt`, `alinhamento.json`, `config.json`).

Tudo é desenhado em código (canvas 2D + DOM/CSS) e renderizado **quadro a quadro** num Chromium
headless; o ffmpeg junta os quadros e o áudio original. Nenhuma imagem ou vídeo é usado como base.

> **A música, a letra e os vídeos NÃO ficam neste repositório** (ele é público; a música tem direitos
> autorais reservados). O projeto lê a pasta da música de fora, por `--musica <pasta>` ou `MUSICA_DIR`.
> `data/`, `out/` e `work/` estão no `.gitignore`.

## Fluxo em duas etapas (regra do canal Or Israel)

Para cada música nova (áudio + legenda + imagem):

1. **Conferência da legenda** — vídeo de **fundo preto**, só com a legenda sincronizada ao áudio, com o
   mesmo layout, cores e abertura do vídeo final e, no canto, o tempo e o número da linha
   (ex.: `CONFERÊNCIA · 0:20.0 · linha 3/71`). A linha acende de uma vez, sem efeitos, para conferir
   texto e tempos. É leve (720p, ~12 MB para 5 min) e rápida de gerar (~2,5 min):

   ```bash
   node tools/renderizar.cjs --musica "$MUSICA_DIR" --conferencia --saida out/conferencia.mp4
   ```

2. **Clipe animado** — só depois do OK do autor. É **inspirado na imagem enviada com o áudio**, seguindo a
   paleta de cores dela, mas **sempre em tons mais pastéis** (mais claros e menos saturados). Cenário,
   personagens e elementos são desenhados para cada música. Exemplos prontos: o dia inteiro do João 3:16
   (`src/paleta.js`, `src/cena.js`, `src/personagens.js`) e os dois temas de lago de "Sobre as Águas" e
   "Correntes Cairão" (`src/lago.js`, `src/tema-aguas.js`, `src/tema-correntes.js`, veja abaixo).

Correções pedidas na conferência refazem a etapa 1 antes de seguir para a 2.

## Como usar

Requisitos: Node 20+, [Playwright](https://playwright.dev) com Chromium e ffmpeg (com libx264 e AAC).

```bash
cd lyric-video
npm install                       # instala o playwright (ou use o global: NODE_PATH=$(npm root -g))
export FFMPEG=/caminho/do/ffmpeg  # se o ffmpeg não estiver no PATH
export MUSICA_DIR=/caminho/para/or-israel/musicas/joao-3-16

# 1) quadros de revisão (rápido): grava PNGs em work/stills/
node tools/renderizar.cjs --musica "$MUSICA_DIR" --still 6,20,110,232,285

# 2) trecho de teste (0 a 90 s), 16:9
node tools/renderizar.cjs --musica "$MUSICA_DIR" --de 0 --ate 90 --crf 23 --saida out/teste.mp4

# 3) música inteira, 16:9 e 9:16
node tools/renderizar.cjs --musica "$MUSICA_DIR" --crf 23 --saida out/joao-3-16_16x9.mp4
node tools/renderizar.cjs --musica "$MUSICA_DIR" --formato 9:16 --crf 23 --saida out/joao-3-16_9x16.mp4
```

Opções: `--formato 16:9|9:16|1:1`, `--de/--ate` (segundos), `--fps` (30), `--workers` (4),
`--crf` (18 = quase sem perdas; 23 = bom e leve), `--preset`, `--tune animation`, `--imagem jpeg|png`,
`--temas`, `--fundo` (imagem da paleta), `--legenda inteira|palavras`.
Velocidade de referência (4 núcleos): ~12 quadros/s em 1080p, ou seja, ~15 min para 5 min de música.
**Não use `work/` como destino** — ele é apagado a cada execução.

### Várias músicas em sequência, cada uma com a sua animação (temas de lago)

O canal junta músicas com `juntar_com` no `config.json` (ex.: "Sobre as Águas" + "Correntes Cairão"). Aqui
isso vira **um vídeo só, com abertura própria e animação própria para cada música**, usando a **mesma imagem**
(`fundo.jpg`) como referência de cor:

```bash
MUS=/caminho/para/or-israel/musicas
node tools/renderizar.cjs --musica $MUS/sobre-as-aguas,$MUS/correntes-cairao --temas aguas,correntes \
  --crf 27 --tune animation --saida out/sobre-as-aguas_correntes-cairao_16x9.mp4
```

- As músicas tocam sem pausa (`data/audio-juntado.wav`) e os tempos de cada legenda são deslocados para a
  posição da música na sequência (`tools/montar-dados.cjs`). Há uma análise de áudio por música e a do áudio juntado.
- `tools/paleta-da-imagem.cjs` amostra regiões da imagem (céu, nuvens, sol, água, pedras...) e converte cada cor
  para **pastel** (mais clara e menos saturada, mantendo o matiz). `src/lago.js` desenha o cenário-base com essas cores.
- **Sobre as Águas** (`src/tema-aguas.js`): a pomba (o Espírito) pairando sobre as águas, o vento oriental em fitas, o mar
  se abrindo em um caminho seco entre paredes de água, o povo atravessando e o mar se acalmando.
- **Correntes Cairão** (`src/tema-correntes.js`, composição espelhada): um jugo de madeira preso por correntes; a cada
  refrão uma corrente arrebenta (respingos, pombas), o jugo se parte em luz, peixes saltam e lírios florescem.
- Os momentos de cada animação saem do **texto da legenda**, então sobrevivem a ajustes de tempo dela. Os trechos da
  letra que disparam cada momento ficam num `animacao.json` **na pasta da música** (nunca neste repositório público),
  no formato `{"gatilhos": {"chave": "trecho|outro trecho"}}` (expressões regulares sem distinção de maiúsculas). Chaves:
  `vento`, `mar_abre`, `mar_recua`, `sopros` (tema `aguas`) e `primeiro_elo`, `correntes_caem`, `livres` (tema `correntes`).
  Sem o arquivo, valem tempos padrão.
- `--temas` aceita `pastor` (o dia do João 3:16), `aguas` e `correntes`; novos temas seguem o mesmo molde
  (`estado(tl)`, `agua(ctx,S)`, `frente(ctx,S)` em `src/tema-*.js`).
- Tamanho: 1080p com `--crf 27 --tune animation` rende ~1,5 Mb/s (≈95 MB para 8,5 min). O GitHub não aceita arquivo
  acima de 100 MB; se passar, suba o `--crf`.

### Tema criado do zero a partir da letra: Salmo 91 (`--temas salmo91`)

Para o Salmo 91 a imagem de fundo da música é **ignorada**: o cenário é desenhado do zero (`src/salmo91.js` e `src/salmo91-seres.js`),
guiado pela letra inteira. Um peregrino descansa no esconderijo do Altíssimo (uma fenda na rocha, com a sua tenda) sob as grandes
asas luminosas, e o dia corre conforme os versos:

- o laço do caçador cai e se desfaz; a peste (névoa lilás) não passa do escudo; as asas se abrem e o escudo e a muralha aparecem;
- terror da noite (noite estrelada e morcegos), flecha de dia, peste nas trevas e destruição ao meio-dia (um ciclo rápido de céu);
- mil e dez mil flechas caindo dos lados do escudo; o peregrino vê a recompensa dos ímpios;
- anjos o guardam, o levam nas mãos e a pedra não o faz tropeçar; ele pisa o leão, a serpente e o dragão;
- o alto refúgio (a subida entre nuvens), o clamor respondido, a angústia que passa, a coroa de luz;
- longos dias (o sol corre) e a salvação (amanhecer, arco-íris, pombas), e o refrão final de volta ao abrigo.

Os instantes saem do **texto da legenda**; os trechos que os disparam ficam em `animacao.json` na pasta da música (chaves como `laco`, `asas`,
`noite`, `dia`, `trevas`, `meiodia`, `mil`, `dezmil`, `anjos_he`, `anjos_pt`, `maos`, `pedra`, `leao`, `pisaras`, `apegou`, `livrarei`, `alto`,
`invocara`, `angustia`, `libertarei`, `honrarei`, `dias`, `salvacao`...). Sem o arquivo valem os tempos padrão de `PADRAO` em `salmo91.js`.

```bash
node tools/renderizar.cjs --musica $MUS/salmo-91 --temas salmo91 --crf 25 --tune animation --saida out/salmo-91_16x9.mp4
```

### Cópia leve para compartilhar (limite de ~30 MB)

O master 1080p de 5min20s com `--crf 23` fica em ~84 MB. Para mandar por chat/e-mail, gere uma cópia 720p
com dois passes e taxa-alvo (uns 27 MB para 5min20s):

```bash
M=out/joao-3-16_16x9_completo.mp4
ffmpeg -y -i $M -vf scale=1280:720:flags=lanczos -c:v libx264 -preset medium -tune animation \
  -b:v 610k -maxrate 1100k -bufsize 1800k -pass 1 -passlogfile work/pl -an -f null /dev/null
ffmpeg -y -i $M -vf scale=1280:720:flags=lanczos -c:v libx264 -preset medium -tune animation \
  -b:v 610k -maxrate 1100k -bufsize 1800k -pass 2 -passlogfile work/pl \
  -c:a aac -b:a 96k -movflags +faststart out/joao-3-16_16x9_completo_leve-720p.mp4
```

## Como funciona

| Arquivo | O que faz |
|---|---|
| `tools/paleta-da-imagem.cjs` | Extrai a paleta da imagem da música e a converte para tons pastéis (`data/paleta.json`). |
| `tools/analisar-audio.cjs` | Decodifica o áudio e calcula, por quadro, energia total, graves/médios/agudos, pulsos de batida e BPM. As animações "respiram" com esses números. |
| `tools/montar-dados.cjs` | Lê `legenda.srt` + `alinhamento.json` + `config.json` e gera linhas, estrofes e tempo de cada palavra (estimado por sílabas dentro do tempo da legenda). |
| `tools/renderizar.cjs` | Servidor local + Chromium (Playwright) + ffmpeg. Vários trabalhadores renderizam trechos em paralelo; depois une tudo e coloca o áudio. |
| `src/paleta.js` | Relógio do dia: a música percorre **um dia inteiro** (madrugada → nascer do sol → dia → pôr do sol → noite estrelada → novo amanhecer). Degradês interpolados em OKLab. |
| `src/cena.js` | Céu, estrelas, sol e lua (inspirados no seletor dia/noite), nuvens de dois tons, colinas em paralaxe, vilarejo, oliveiras, flores, raios de sol, pombas, corações, vaga-lumes e borboletas. |
| `src/personagens.js` | Pastor, ovelhas, cordeirinho e pombas. A caminhada é travada ao deslocamento do cenário (os pés não "patinam") e o cordeirinho pula no compasso. |
| `src/legenda.js` | Legendas dinâmicas (veja abaixo). |
| `src/abertura.js` | Abertura durante a introdução (título em português e hebraico, transliteração, versículo, canal e aviso de direitos); uma por música quando há várias. |
| `src/lago.js`, `src/tema-aguas.js`, `src/tema-correntes.js` | Cenário de lago (paleta da imagem) e os dois temas de animação descritos acima. |
| `src/salmo91.js`, `src/salmo91-seres.js` | Tema do Salmo 91, desenhado do zero a partir da letra (cenário, ciclo dia/noite, asas, escudo, peregrino, anjos, leão, serpente, dragão...). |
| `src/main.js` | Junta tudo: `window.__renderizar(t)` desenha o quadro do instante `t`. |

**Determinismo:** cada quadro é uma função pura de `t` (sem `Math.random`, sem estado entre quadros),
então qualquer trecho pode ser renderizado isoladamente e em paralelo com o mesmo resultado.

### Legendas dinâmicas

> **Modo da legenda.** Nos temas de lago a frase **inteira acende de uma vez, com a cor final, na sua vez** (`--legenda inteira`, o padrão
> deles): o `legenda.srt` só tem tempo por frase, então a varredura palavra por palavra descrita abaixo ficava à frente ou atrás
> do canto. O modo `palavras` (varredura, pulo e brilho por palavra) continua disponível e é o padrão do tema do pastor.
> Palavras-chave mantêm a cor diferente nos dois modos.

Segue as regras do canal: a **estrofe inteira** fica na tela com a **linha cantada acesa**, e linhas em
hebraico aparecem sempre com **hebraico + transliteração + tradução em português**.

- A linha ativa cresce e ganha foco; as demais recuam (menores, transparentes e levemente desfocadas) e
  a pilha rola suavemente, como nas letras do Apple Music.
- Cada palavra acende com uma varredura na direção da leitura (direita→esquerda no hebraico), "pula" com
  mola ao ser cantada e ganha um brilho que reage à energia da música.
- Palavras-chave (amou, mundo, vida, Filho, `אהב`, `עולם`, `חיי`...) ganham degradê.
- A cor do texto alterna entre escuro (dia) e claro (noite) conforme o céu; se a pilha não cabe (4 linhas
  em hebraico), ela é reduzida por inteiro.

### Limitações conhecidas

- O `legenda.srt` só tem tempo por **linha**. O tempo de cada **palavra** é estimado (proporcional às
  sílabas, ~0,62 s por sílaba; em notas longas a última palavra fica acesa e "respira" até o fim da
  legenda). Para precisão por palavra seria preciso um alinhamento real (Whisper/stable-ts, como o
  `legendar.py` do Or Israel já faz para outros casos).
- O formato 9:16 funciona, mas ainda não foi refinado (ajustes finos de tamanho de texto e composição).
- Não há mixagem/edição de áudio: o áudio original é apenas recodificado para AAC.

## Personalizando

- **Cores e horários:** `src/paleta.js` (quadros-chave de cada hora e `MARCOS`, que ligam tempo da música à hora do dia).
- **Cenário:** `CAMADAS` em `src/cena.js` (colinas e paralaxe); `REBANHO` (posição e tamanho das ovelhas).
- **Quando o pastor para e as pombas voam:** trechos com "vida eterna" (`חַיֵּי`) e "não perecerá" (`main.js`).
- **Tipografia:** `src/index.html` (Inter para latim, Noto Sans Hebrew para hebraico com nikud; ambas SIL OFL, em `assets/fonts/`).

## Referências e skills consultadas

- [Remotion — agent skills](https://www.remotion.dev/skills) (legendas estilo TikTok, molas, transições): a ideia de renderização quadro a quadro e legendas paginadas.
- [HyperFrames](https://github.com/heygen-com/hyperframes) (HTML/CSS/GSAP → MP4 determinístico): o modelo "Chromium + relógio controlado + ffmpeg".
- [GSAP skills](https://github.com/greensock/gsap-skills) e a skill `ui-ux-pro-max`: presets de movimento (stagger, molas, "saída mais rápida que a entrada").
- Letras do Apple Music (linha ativa maior, demais desfocadas) e Liquid Glass (pílula translúcida).
- Uiverse.io (MIT): inspiração para o seletor sol/lua, o anel de brilho giratório e a caminhada por quadros-chave.
