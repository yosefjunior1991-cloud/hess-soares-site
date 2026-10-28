---
name: estilo-animacao-or-israel
description: Padrões visuais dos clipes animados do canal Or Israel (canvas 2D em JavaScript, 16:9): paleta pastel, céu por hora do dia, sombras, degradês, brilhos e feixes de luz, personagens, paralaxe, movimento e cor do texto. Use ao criar ou ajustar qualquer cena, tema ou peça desenhada em código para esses clipes, para manter tudo com a mesma linguagem visual.
---

# Estilo de animação — Or Israel

Linguagem visual de todos os clipes (Salmo 91, Salmo 23, Pai Nosso, Bênção Sacerdotal, Salmo 2, Um Menino Nos Nasceu, Estrela de Jacó, Isaías 41:10). Tudo é desenhado em código no canvas 2D, sem imagens, e cada quadro é uma função pura do tempo.

## 1. Princípios

1. **Pastel sempre.** Cores mais claras e menos saturadas que o "natural". Nada de preto, branco puro em grandes áreas, nem cores saturadas.
2. **Luz em vez de contorno.** Formas sem linha de contorno escura; o volume vem de dois tons (base + sombra), de um brilho suave e de degradês longos.
3. **Deus não é retratado como pessoa.** A presença Dele é luz do alto: feixe, mão de luz, coroa, cetro, orbe, estrela. O Menino (nascimento) é uma trouxinha de luz sem rosto.
4. **Mundo largo, câmera calma.** Cenário em camadas com paralaxe lenta; nada de cortes bruscos. Movimento suave (easing), nunca linear seco.
5. **A letra manda.** Cada momento visual sai de um trecho da legenda (gatilhos em `animacao.json`, nunca no código público). Sem frases da letra em código ou comentários.
6. **Sempre 16:9** no clipe animado (o 9:16 é só o vídeo de conferência da legenda). Altura de projeto = 1080; largura `W` = 1920.
7. **Determinismo.** `desenhar(ctx, S)` depende só de `S.t`/`S.tl`; nada de `Math.random()` (usar `hash1(i)` e `mulberry32(semente)`).

## 2. Paleta (tokens)

Cores como `[r,g,b]` via `rgb('#hex')`; sempre usadas com `css(cor, alfa)`.

| Uso | Token | Hex |
|---|---|---|
| Luz branca quente | `luz` | `#fffaf0` |
| Luz dourada (brilhos) | `luzOuro` | `#ffe6a8` |
| Ouro | `ouro` / `ouroForte` | `#ffd98a` / `#f6c66a` |
| Ouro escuro (contorno, coroa) | `ouroEsc` | `#e0a950` |
| Creme | `creme` | `#fff1d6` |
| Lilás / rosa | `lilas` / `rosa` | `#e2dcf6` / `#f7c6d2` |
| Sombra no chão | `sombra` | `#8f86b8` (alfa 0,14 a 0,2) |
| Pele / sombra de pele | `pele` / `peleSombra` | `#f5d3bd` / `#e8bca4` |
| Olho, bochecha, boca | `olho`, `bochecha`, `boca` | `#54496a`, `#f4a9b8`, `#c98d8d` |
| Cabelo / barba | `cabelo`, `barba` | `#6f5868`, `#7d6470` |
| Folha / oliva / tronco | `folha`, `oliva`, `tronco` | `#a9d6bd`, `#b7cdb3`, `#c9ad9c` |
| Pedra | `pedra` / `pedraEsc` | `#efe6dc` / `#d9cdd8` |
| Madeira | `madeira` / `madeiraEsc` | `#d9b08f` / `#bf9474` |
| Papel | `papel` / `papelClaro` | `#ffe2b5` / `#fff4dc` |
| Chama / fogo | `chama`, `fogo1..3` | `#ffb46e`, `#ffb06a`, `#ffd68c`, `#fff4cf` |
| Pano claro (talit, trouxinha) | `pano` / `panoSom` | `#fff8ec` / `#ecdcc6` |
| Veludo (manto real) | `veludo` / `veludoSom` | `#e9cdf2` / `#cfa9e0` |
| Ferro (correntes, lanças) | `ferro`, `ferroSom`, `ferroLuz` | `#b3b1c9`, `#8f8dac`, `#e3e1f0` |
| Nuvem de tempestade | `nuvem`, `nuvemSom`, `nuvemLuz` | `#9d98b8`, `#837ea4`, `#c4c0d8` |
| Azul do talit | `azul` | `#9fbdf0` |

Túnicas de pessoas (pastéis): pêssego `#f4c8b0`, amarelo `#f9e1a0`, azul `#c8d6f6`, verde `#c9e6d4`, rosa `#f2c6e0`, lilás `#d9ccf2`, areia `#f7d9b0`, água `#bfe3ea`; véus/mantos `#fff5e0`.

## 3. Mistura de cor e ajuste

- `ml(a, b, t)`: mistura em **OKLab** (nunca em RGB). Para clarear, misturar com `luz`/`branco`; para esfriar à noite, misturar com a cor do céu.
- `aj(cor, delta)`: ajusta luminosidade (ex.: `aj(tunica, -0.08)` para a dobra de sombra).
- **Tom por ambiente** (`luzObj`): objeto = cor base misturada com `ceu.mid` em `noite*0.5` e com `ceu.hor` em `0.1*(1-noite)`. Tudo que está no mundo passa por isso, para a noite/tempestade tingir cenário e personagens juntos.

## 4. Céu e hora do dia

O dia/noite é uma tabela de 3 cores (topo, meio, horizonte), interpolada com smoothstep; uma lista `HS = [[tempo, hora], ...]` por tema faz a hora acompanhar a letra (pode passar de 24).

```
hora : topo / meio / horizonte
0    #737cc4 #8f96d6 #b3a9dc   (noite)
4.4  #7f88cb #a9a3dc #d9bfdc
5.6  #99a8e6 #e6c3dc #ffd4b8   (alvorada)
6.6  #a8c6f0 #f6d6dc #ffe2b8
8    #aed9f5 #d6efff #fff0d2
12   #9fd3f3 #cdeefe #eefaf6   (meio-dia)
15.5 #acd2f2 #e3eaf8 #ffe8c9
17.4 #b6c3ee #f7d2c4 #ffd49e
18.3 #aaa6e0 #f2b8c4 #ffc79b   (pôr do sol)
19.4 #8f91d1 #c3a5d9 #f4b9bb
20.6 #7f88cb #9aa0dc #c0b4e3
24   #737cc4 #8f96d6 #b3a9dc
```

- `noiteF(h)`: 1 de 18,6 a 4,6 e 0 de 6,4 a 18,6, com smoothstep nas pontas.
- Sol: `x = W*(0.5 - cos(π(h-6)/12)*0.44)`, `y = HORSKY - sin*0.6*ALT`; disco com degradê radial (luz → creme → cor quente `#ffb98f` perto do horizonte); no horizonte o brilho é achatado verticalmente (`scale(1, 0.55..1)`) para não virar uma bola branca.
- Lua: `x = W*(0.5 - cos(π(h-18.5)/12)*0.42)`, disco `#fbfcff → #e8ebfa → #c9cee8`, crateras `#a9b0d6` alfa 0,3, brilho `#c9d0ff`.
- Estrelas: `luz` com cintilação `0.55+0.45*sin(t*w+f)`, as maiores em losango de 4 pontas (`brilho4`); só aparecem com `noite` e desaparecem perto do horizonte.
- Tempestade: misturar o céu com `#858299` (topo), `#a29fb8` (meio), `#c9bfcc` (horizonte) e cobrir o quadro com `#6f6c8c` em alfa ≤ 0,16–0,28; texto passa a claro.
- Linhas do horizonte: `HORSKY = 0.74*ALT` (céu), `SOLO = 0.885*ALT` (pés dos personagens).

## 5. Sombras

- **No chão**: elipse achatada sob cada coisa, `sombra` `#8f86b8` em alfa **0,14–0,2** (ex.: `ellipse(0, 3, 34, 5.5)` para pessoa; `w*0.62 × 10` para casa).
- **Em volume**: a face voltada à sombra usa o token `...Som`/`...Esc` (um passo mais escuro e mais frio, nunca preto); dobras de roupa = `aj(cor, -0.08)` em alfa 0,5.
- **Luz do lado esquerdo, sombra no direito** em montes: degradê horizontal de `luz` alfa 0,22 (esquerda) a `sombra` alfa 0,18 (direita), recortado pela silhueta.
- Sem sombras duras, sem desfoque de canvas (`shadowBlur`): usar degradês.

## 6. Degradês (receitas)

- **Corpo de montanha/terra**: linear vertical, topo claro (`#f3e2c6`, `#efdcc6`) → meio (`#e2cbb2`) → base cinza-lilás (`#c2bcc9`, `#d3c5cf`); passar cada cor por `luzObj`.
- **Montanhas ao longe** (3 camadas): `longe` `#cdcbf0` (haze 0,45), `meio` `#e0cfe8` (0,32), `colinas` `#f0ddc4` (0,15). Cor = mistura com `ceu.mid` por `haze` (mais névoa = mais longe); fundo da camada com `haze + 0.22`. Cristas = soma de 3 senos (picos na mais distante).
- **Chão**: vertical `#f1e3cb → #e8dfc3 → #d6dfc2` (areia → verde seco), com contorno ondulado `0.835*ALT + 5*sin(x*0.0057) + 2.5*sin(x*0.019)`.
- **Manto/veludo**: vertical `veludo → veludoSom`.
- **Coroa e ouro**: vertical `luz → luzOuro → ouroForte`.
- **Interior de gruta/casa acesa**: radial `luzOuro+luz (0) → fogo2 (0,55) → bege (1)`.

## 7. Brilho e luz

- **`brilhoRadial(ctx, x, y, r, cor, a)`**: radial com 3 paradas — alfa `a` no centro, `a*0.36` em 40 % e 0 na borda. É o brilho padrão de tudo que emite luz (sol 600 e 240 px, lua 200, olho de estrela 38–74, vagalume 9).
- **`brilho4(ctx, x, y, r)`**: estrela de 4 pontas (4 curvas quadráticas que passam pelo centro) para centelhas, estrelas, brilho de joias.
- **Luz aditiva**: tudo que brilha usa `globalCompositeOperation = 'lighter'` (feixes, raios, anéis, brilhos, fogo). Voltar para `'source-over'` ao desenhar formas sólidas.
- **Cuidado com saturar**: em `'lighter'` sobre fundo claro o centro vira bola branca/cinza. À noite, usar um núcleo de queda rápida (paradas 0 → 0,1 → 0,32 → 1 com alfas `a, a*0.5, a*0.14, 0`) e `luz` quente `#fffdf2` no miolo, em vez de um disco chapado.
- **Raios de sol/estrela**: 12–18 linhas finas com degradê no comprimento (`luz` alfa 0,22–0,3 → `luzOuro` 0), espessura 6–14 px alternada, girando devagar (`t*0.07`).
- **Feixe do céu (sem borda dura)**: nunca um trapézio com degradê só na largura (a ponta fica cortada). Cortar o feixe em ~36 fatias ao longo do comprimento, cada uma com degradê horizontal `luzOuro(0) → luz(α·f) → luzOuro(0)` e `f = 1 - smooth(fim, 1, u)` para apagar suavemente; alfa total 0,1–0,3; larguras de 12–70 px no topo a 90–230 px embaixo.
- **Faixa de luz no chão**: empilhar 3–4 faixas, da mais larga e fraca à mais estreita e forte (alfa somando ~0,7), com entrada gradual no começo; evitar retângulo com borda reta.
- **Ondas de luz sobre a terra**: elipse achatada (`ry = r*0.1`) a partir do centro da cena, raio `140 → 2300` com `outCubic`, traço `luzOuro` alfa 0,34×(1−u), espessura 3 + 5×(1−u).
- **Cúpula / aliança**: arcos concêntricos finos (3 px, alfa 0,55) com preenchimento radial `luzOuro` de 0,08 a 0,22; arco de cores pastel (`#f6b8c4 #fbd9a6 #fdf0b0 #c4ebcb #b9d6f6 #d3c4f2`, traço 16 px, alfa 0,55).
- **Gotas / pétalas / lanternas**: pétalas = elipses 6×3,4 girando, cores `rosa/luzOuro/lilas/luz`; lanternas sobem com `outCubic` e, no topo, viram estrelas (`brilho4`).

## 8. Formas e personagens

- Estilo **cartoon suave**: corpo em cápsula/túnica longa, cabeça redonda com 2 olhos pequenos (`#54496a`), bochecha rosa, sorriso fino; sem nariz marcado; mãos simples.
- Proporção (altura de adulto ≈ 195 px de base ao topo da cabeça, criança ≈ 130); escala de cena 1,0–1,12; figuras mais ao fundo 0,5–0,6.
- Pessoa de lado, olhando para +x (espelhar com `dir`); opções: `andar`, `sentado` (ajoelhado), `bracos`, `maos` (oração), `olhar` (para cima), `inclina`, `segura` (lamparina, lanterna, pão, cesto, pergaminho).
- **Sincronia de passo**: a fase do passo é ligada ao deslocamento do mundo (`fase = rol/92*2π`) para os pés não deslizarem.
- Cores diferentes por pessoa (paleta de túnicas acima); barba `#7d6470`; véu/manto `#fff5e0`.
- Objetos: madeira em dois tons com tábuas em linhas finas; pedra em blocos `pedra/pedraEsc`; coroa de ouro com 5 pontas e joias (`joiaRosa #f2a7bb`, `joiaAzul #9dbcf0`, `joiaVerde #9fdcc0`) com reflexo `luz`; cetro dourado com esfera luminosa; correntes de elos alternados (`ferro`, realce `ferroLuz`).
- **Luz como personagem**: mão de luz (palma, 4 dedos, polegar em `'lighter'`, braço que some para cima), orbe (brilho radial + 6 centelhas orbitando), estrela de Belém (`brilho4` grande + diagonal menor), coroa/cetro pairando com brilho.

## 9. Movimento

- Easing: `outCubic` para entradas, `inOutSine` para deslocamentos, `smooth(a,b,t)` (smoothstep) para janelas. Janelas de tempo: `win(a,b,c,d,t) = smooth(a,b,t)*(1-smooth(c,d,t))`; pulso = `win(t0-0.1, t0+sobe, t0+sobe+0.5, t0+sobe+desce)`, com `sobe` 0,8–1,4 s e `desce` 4–6 s.
- Respiração: oscilações pequenas (`sin(t*1.2..2)` com 2–6 px) em coroas, orbes, mantos, plantas; nunca parado.
- Caminhada: o mundo rola (tabela integrada de velocidade, `V` ≈ 96–105 px/s) e o personagem fica na tela; trocar de velocidade com janelas suavizadas (0,55 hesitante; 0,9–1,0 firme).
- Paralaxe: fator de rolagem por camada (montanhas longe 0,03, meio 0,08, colinas 0,2, árvores ao longe 0,5, chão 1,0).
- Cena estática: câmera parada com deriva mínima (`sin(t*0.05)*pequeno`) e zoom total de ~3,5 % ao longo da música.
- Transições entre estados com 0,6–2,5 s; nunca trocar de cena de uma vez (alfa e posição interpolados).
- Partículas determinísticas: posição = função de `hash1(i)` e do tempo (`mod(tl*v + i*0.137, 1)`).

## 10. Composição e legendas

- Texto centralizado no topo/meio (≈ y 40–520 em 1080); **o que importa na cena fica abaixo de y ≈ 520** (personagens em y 700–1000), com efeitos de luz podendo subir por trás do texto, sempre suaves.
- Cor do texto pelo fundo: `tomTexto = 1 - smooth(0.32, 0.62, max(noite*0.9, tempestade*0.85))` (0 = texto claro, 1 = texto escuro `#3a3442`). Destaques em rosa/laranja (`#de5c7a`, `#ec8c34`) no claro e rosa-claro/creme no escuro.
- A **frase inteira acende de uma vez** na cor final (sem varredura palavra por palavra); frases vizinhas ficam esmaecidas.
- Hebraico em Noto Sans Hebrew (500–800) acima, transliteração em itálico e tradução abaixo; letras hebraicas desenhadas em canvas usam a mesma fonte (ex.: shin `ש`, peso 500, 250 px, contorno `ouroForte` 5 px e preenchimento em degradê `luz → ouro`).
- Abertura (título, hebraico, transliteração, versículo, canal, direitos) fica sobre o cenário da introdução; o cenário precisa estar legível por trás.

## 11. Checklist antes de renderizar

1. Está pastel (nada saturado nem preto)? Sombras de chão em 0,14–0,2?
2. Brilhos em `'lighter'` sem estourar em bola branca? Feixes sem borda dura?
3. Tudo passa por `luzObj` (noite/tempestade tingem o mundo)?
4. Deus só como luz/coroa/cetro/mão de luz/estrela? Sem rosto no Menino?
5. Nada de frases da letra no código; tempos vêm dos gatilhos.
6. Elementos importantes abaixo do texto; texto legível nos momentos claros e escuros.
7. Renderizar quadros de revisão (`--still t1,t2,...`) de todos os momentos-chave antes do vídeo completo; usar `--reanalisar` ao trocar de música.
