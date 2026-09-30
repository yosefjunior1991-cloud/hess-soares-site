# lyric-video — vídeo de letra animado, feito em JavaScript

Gera um vídeo de letra sincronizada com **cenário animado em tom pastel (estilo Apple)**, personagens
(pastor, ovelhas, cordeirinho, pombas) e **legendas dinâmicas**, a partir de uma pasta de música no
formato do projeto **Or Israel** (`musica.m4a`, `legenda.srt`, `alinhamento.json`, `config.json`).

Tudo é desenhado em código (canvas 2D + DOM/CSS) e renderizado **quadro a quadro** num Chromium
headless; o ffmpeg junta os quadros e o áudio original. Nenhuma imagem ou vídeo é usado como base.

> **A música, a letra e os vídeos NÃO ficam neste repositório** (ele é público; a música tem direitos
> autorais reservados). O projeto lê a pasta da música de fora, por `--musica <pasta>` ou `MUSICA_DIR`.
> `data/`, `out/` e `work/` estão no `.gitignore`.

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
`--crf` (18 = quase sem perdas; 23 = bom e leve), `--preset`, `--imagem jpeg|png`.
Velocidade de referência (4 núcleos): ~12 quadros/s em 1080p, ou seja, ~15 min para 5 min de música.
**Não use `work/` como destino** — ele é apagado a cada execução.

## Como funciona

| Arquivo | O que faz |
|---|---|
| `tools/analisar-audio.cjs` | Decodifica o áudio e calcula, por quadro, energia total, graves/médios/agudos, pulsos de batida e BPM. As animações "respiram" com esses números. |
| `tools/montar-dados.cjs` | Lê `legenda.srt` + `alinhamento.json` + `config.json` e gera linhas, estrofes e tempo de cada palavra (estimado por sílabas dentro do tempo da legenda). |
| `tools/renderizar.cjs` | Servidor local + Chromium (Playwright) + ffmpeg. Vários trabalhadores renderizam trechos em paralelo; depois une tudo e coloca o áudio. |
| `src/paleta.js` | Relógio do dia: a música percorre **um dia inteiro** (madrugada → nascer do sol → dia → pôr do sol → noite estrelada → novo amanhecer). Degradês interpolados em OKLab. |
| `src/cena.js` | Céu, estrelas, sol e lua (inspirados no seletor dia/noite), nuvens de dois tons, colinas em paralaxe, vilarejo, oliveiras, flores, raios de sol, pombas, corações, vaga-lumes e borboletas. |
| `src/personagens.js` | Pastor, ovelhas, cordeirinho e pombas. A caminhada é travada ao deslocamento do cenário (os pés não "patinam") e o cordeirinho pula no compasso. |
| `src/legenda.js` | Legendas dinâmicas (veja abaixo). |
| `src/abertura.js` | Abertura durante a introdução (título em português e hebraico, transliteração, versículo, canal e aviso de direitos) e encerramento com um **cartão holográfico picotado** que flutua (inspirado no ingresso do Uiverse). |
| `src/main.js` | Junta tudo: `window.__renderizar(t)` desenha o quadro do instante `t`. |

**Determinismo:** cada quadro é uma função pura de `t` (sem `Math.random`, sem estado entre quadros),
então qualquer trecho pode ser renderizado isoladamente e em paralelo com o mesmo resultado.

### Legendas dinâmicas

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
- Uiverse.io (MIT): inspiração para o seletor sol/lua, o anel de brilho giratório, o holograma e a caminhada por quadros-chave.
