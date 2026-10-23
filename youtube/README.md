# Gerenciador do canal do YouTube (Hess & Soares)

CLI em Node.js sobre a **YouTube Data API v3**: envia vídeos, edita título/descrição/tags,
troca thumbnail, agenda publicação, gerencia playlists e dados do canal.

Requer Node 20+. Instalação: `cd youtube && npm install`.

## 1. Configuração única (Google Cloud)

1. Em <https://console.cloud.google.com> crie um projeto (ex.: "Hess Soares YouTube").
2. **APIs e serviços → Biblioteca →** ative **YouTube Data API v3**.
3. **Tela de consentimento OAuth:** tipo *Externo*, preencha nome/e-mail e, em *Usuários de teste*,
   adicione o e-mail da conta Google que é dona do canal.
   - Deixe em modo *Teste* funciona, mas o token expira em 7 dias. Para token permanente,
     clique em **Publicar app** (não exige verificação para uso próprio, só mostra um aviso de "app não verificado").
4. **Credenciais → Criar credenciais → ID do cliente OAuth →** tipo **App para computador**.
5. Baixe o JSON e salve como `youtube/.credentials/client_secret.json` (a pasta está no `.gitignore`).
   Alternativa: variáveis `YT_CLIENT_ID` e `YT_CLIENT_SECRET`.

## 2. Vincular o canal

```bash
node yt.mjs auth
```

Abra o link, entre com a conta dona do canal, **escolha o canal do Hess & Soares** (se a conta tiver
vários/Brand Account) e autorize. O token fica em `.credentials/token.json`.
Se estiver em servidor sem navegador, o redirecionamento para `localhost` vai "falhar" na tela —
copie a URL inteira da barra de endereços e cole no terminal.

Confira: `node yt.mjs channel`.

## 3. Uso

```bash
# enviar vídeo (privado por padrão)
node yt.mjs upload video.mp4 --title "Título" --description @descricao.txt \
  --tags "direito,advogado" --thumbnail capa.jpg

# ou tudo por arquivo de metadados
node yt.mjs upload --meta video.json

# agendar publicação
node yt.mjs upload video.mp4 --title "Título" --publish-at 2026-11-05T09:00:00-03:00

node yt.mjs list                       # vídeos do canal
node yt.mjs get <videoId>              # detalhes
node yt.mjs update <videoId> --title "Novo título" --description @nova.txt --privacy public
node yt.mjs thumbnail <videoId> capa.jpg
node yt.mjs playlist-create --title "Dúvidas frequentes"
node yt.mjs playlist-add <playlistId> <videoId>
node yt.mjs channel-update --description @sobre.txt --keywords "advogado direito"
node yt.mjs delete <videoId> --yes
```

`--description` aceita texto direto (`\n` vira quebra de linha) ou `@arquivo.txt`.
Veja `node yt.mjs help` para todas as opções e `video.example.json` como modelo.

## Limites e cuidados

- **Cota:** 10.000 unidades/dia por projeto; cada upload custa ~1.600 (≈6 uploads/dia). Listar e editar é barato.
- **Vídeos "travados" como privados:** projetos de API criados após jul/2020 e **não auditados** têm uploads
  forçados a `private`. Para publicar, ou você troca a visibilidade manualmente no YouTube Studio, ou solicita a
  auditoria em <https://support.google.com/youtube/contact/yt_api_form>.
- **Thumbnail personalizada** exige canal verificado por telefone.
- `.credentials/` e `client_secret*.json` nunca devem ser commitados.
- Para automação (CI/n8n), use `YT_CLIENT_ID`, `YT_CLIENT_SECRET` e `YT_REFRESH_TOKEN`
  (`node yt.mjs auth --print-refresh-token`).
