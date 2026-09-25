# Painel de publicações LinkedIn

Aplicação local Next.js/React + SQLite em `http://127.0.0.1:5682`. Mostra o acervo consolidado, as capas, o texto, a fonte, o estado da publicação e os pedidos de envio. Permite publicar agora ou registrar, alterar e cancelar um horário. O servidor consulta os vencimentos a cada 15 segundos enquanto está ativo. A tarefa do Windows `Codex Publicacoes LinkedIn Dashboard` o inicia no login do usuário.

## Catálogo público

O mesmo código pode operar como catálogo público somente leitura com `PUBLIC_MODE=true`. Nesse modo, os controles de publicação são removidos da interface, os endpoints de escrita retornam `403` e nenhuma credencial do LinkedIn é usada. A imagem de produção é publicada em `ghcr.io/leandrojacome/linkedin-publicacoes-dashboard` e o stack do Swarm expõe o serviço em `https://publicacoes.leandro.inf.br` pelo Traefik.

O diretório `content/` contém a fotografia editorial incluída na imagem pública. O ambiente privado local continua usando o acervo e o estado operacional externos quando `CONTENT_ROOT` não está definido.

## Estado atual

- O prompt original para entrevistas técnicas está [no GitHub](https://github.com/leandrojacome/recruiter-ai-prompts/blob/main/prompts/structured-technical-interview.md).
- O post `recruiter-ai-structured-interview-prompt-2026-09-25` está preparado com capa PNG nova sem C2PA e tem pedido local para 25/09/2026 às 12h de São Paulo.
- A conexão de publicação do LinkedIn **não está configurada**. O pedido local não é um agendamento nativo do LinkedIn. Se chegar ao horário sem conexão, passa a `blocked_auth` e não envia. Não há retentativa automática de envios incertos.
- Os originais do Mac com C2PA foram preservados. As 12 capas editoriais novas não contêm esse bloco. As pautas importadas do Mac exigem revisão editorial e não podem ser enviadas com o Markdown de inventário como corpo do post. A duplicata Go está bloqueada.

## Conectar o envio

É necessária uma aplicação LinkedIn Developer autorizada para postagem do membro, com `w_member_social`, um access token válido e o member URN correspondente. Configure `LINKEDIN_ACCESS_TOKEN` e `LINKEDIN_MEMBER_URN` como variáveis de ambiente do processo que inicia o servidor. Não armazene credenciais no repositório ou no SQLite. O painel só habilita “Publicar agora” depois que ambas estão presentes. O backend usa o fluxo oficial de upload de imagem e `ugcPosts`; a resposta aceita fica como `submitted_unconfirmed` até conferir o perfil e o permalink.

O botão de envio e o agendamento são bloqueados para publicações já confirmadas, duplicatas, arquivos com C2PA e registros que aguardam revisão editorial. O agendador impede pedidos ativos com menos de 60 minutos entre si. A fila operacional única continua em `C:/Users/leand/Documents/Codex/2026-09-17/posts-tecnologia-linkedin/outputs/state.json`; o SQLite registra os pedidos do painel e espelha a transição nessa fila para posts dessa frente.

## Operação

Com Node 22.13+ instalado, execute `npm install`, `npm run build` e `npm run start` nesta pasta. O banco fica em `data/publicacoes.sqlite`. O servidor escuta somente em `127.0.0.1`. O processo e o computador precisam estar ativos na hora do envio. Confirme o resultado no perfil antes de tratar qualquer post como publicado.

O arquivo `../painel-publicacoes.html` é uma cópia estática de consulta; os botões de agendamento ficam nesta aplicação.
