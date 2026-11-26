# Integração do front com o back-end

Este documento diz **como ligar** o front ao back-end (`EdsonAguiar888/backend-capshopp`) e **onde ajustar** cada diferença.

## Ligar em 3 passos

1. Suba o back-end (porta 8080). O código está na branch `codigoBackend`, com banco H2 em memória e os usuários do `data.sql`.
2. Em `src/app/core/config.ts`, troque `useMock: true` por `useMock: false`.
3. Rode o front com o proxy, na pasta do projeto:

   ```powershell
   ng serve --proxy-config proxy.conf.json -o
   ```

O proxy (`proxy.conf.json`) encaminha tudo que começa com `/api` para `http://localhost:8080`. Por isso o navegador enxerga uma origem só, sem CORS, e o cookie de sessão funciona. Para voltar aos dados simulados, use `useMock: true` e `ng serve -o`.

## Onde fica cada coisa

| Arquivo | O que faz | Quando mexer |
|---|---|---|
| `core/http/api-urls.ts` | Todos os caminhos da API | Um endpoint mudou de endereço |
| `core/http/dto.ts` | Formato do JSON do back-end | O back-end criou ou renomeou um campo |
| `core/http/mappers.ts` | JSON do back-end para os modelos das telas | Idem: ajuste o nome do campo aqui |
| `core/http/http-auth.api.ts` | Login, logout, sessão | Mudança na autenticação |
| `core/http/http-produto.api.ts` | Catálogo e produtos | Mudança em produtos |
| `core/http/http-pedido.api.ts` | Compra e pedidos | Mudança em pedidos |
| `core/http/http-admin.api.ts` | Dashboard, lojas e clientes | Mudança no admin |
| `core/http/credenciais.interceptor.ts` | Envia o cookie de sessão | Se trocar para token |
| `core/http/api-error.interceptor.ts` | Mensagens de erro e 401 | Mudança no formato de erro |

Telas, rotas e serviços **não** conhecem o back-end: só usam as classes abstratas de `core/api/apis.ts`.

## Endpoints que o front usa

| Ação do front | Chamada | Observação |
|---|---|---|
| Entrar | `POST /api/auth/login` `{email, senha}` | Devolve `{id, nome, email, perfil}` |
| Sair | `POST /api/auth/logout` | |
| Validar sessão ao abrir | `GET /api/auth/me` | Se não existir, ignora; se der 401, volta ao login |
| Catálogo e busca | `GET /api/catalogo?nome=` | Só produtos ativos |
| Detalhe do produto | `GET /api/produtos/{id}` | Se responder 404 ou 405, o front procura no catálogo |
| Meus produtos | `GET /api/produtos?lojistaId=` | O `lojistaId` é enviado e a sessão também vale |
| Criar e editar produto | `POST /api/produtos` e `PUT /api/produtos/{id}` | Corpo com `imagemUrl` e `imagem`, e `lojistaId` |
| Upload de imagem | `POST /api/produtos/{id}/imagem` (campo `arquivo`) | Segunda chamada, depois de salvar o produto |
| Desativar produto | `PATCH /api/produtos/{id}/desativar` | |
| Reativar produto | `PATCH /api/produtos/{id}/ativar` | **Pendente**: não existe nos documentos do back-end |
| Excluir produto | `DELETE /api/produtos/{id}` | 409 se tiver pedidos |
| Confirmar compra | `POST /api/compras` `{clienteId, itens}` | Um pedido por loja |
| Meus pedidos / pedidos da loja | `GET /api/pedidos?clienteId=` ou `?lojistaId=` | Se vier só o resumo, o front busca o detalhe de cada um |
| Detalhe do pedido | `GET /api/pedidos/{id}` | |
| Concluir / cancelar | `PATCH /api/pedidos/{id}/concluir` e `/cancelar` | Sem corpo |
| Dashboard, lojas, clientes | `GET /api/admin/dashboard` | Uma chamada serve as três telas |

## Dois documentos, dois formatos

No repositório do back-end há duas fontes que ainda não combinam entre si:

- **Swagger** (`docs/swaggercapshopp.yaml`): identifica o usuário pela **sessão** (cookie), usa `/catalogo` e `/compras` e devolve pedidos resumidos.
- **Código** (branch `codigoBackend`): os services recebem `clienteId` e `lojistaId` nas chamadas e devolvem `PedidoResponse` com `criadoEm`, `clienteId`, `lojistaId` e `itens`. Os **controllers ainda não existem**.

O front segue os **caminhos** do Swagger e aceita os **dois formatos** de resposta. Também envia `clienteId`, `lojistaId` e `imagem` nas chamadas, que o Swagger ignora e o código usa. Quando os controllers saírem, basta conferir esta lista.

## Ajustes finos ao conectar (checklist)

| Sintoma | Causa provável | Onde ajustar |
|---|---|---|
| Telas em branco ou erro de conexão | Front sem proxy ou back-end desligado | Rodar com `--proxy-config` e conferir a porta 8080 |
| 404 em tudo | Caminho diferente no controller | `api-urls.ts` |
| 401 depois do login | Back-end sem sessão ou cookie bloqueado | `credenciais.interceptor.ts`; confirmar sessão no back-end |
| "Erro inesperado" sem texto | O Spring não envia `message` por padrão | Back-end: `server.error.include-message=always` |
| Nome da loja aparece como "Loja 2" | O produto não traz o nome da loja | Back-end inclui `lojaNome` (já aceito em `mappers.ts`) |
| Coluna "Produtos" com "—" nas lojas | O dashboard não traz a quantidade | Back-end inclui `quantidadeProdutos` (já aceito) |
| Pedido sem imagem nos itens | O item não traz imagem | Back-end inclui `imagem` no item (já aceito) |
| Botão "Ativar" mostra aviso | Não há endpoint de reativar | Back-end cria `PATCH /produtos/{id}/ativar` |
| Datas em branco | Data em outro campo | `mappers.ts` (`paraPedido`) |
| Imagem do produto quebrada | Caminho de imagem diferente | `mappers.ts` (`urlImagem`) |
| Login recusado com a senha do README | Senha do `data.sql` é outra | Usar a senha do `data.sql` (hoje `12345`; o PDF diz `123456`) |

## Contas no back-end

O `data.sql` do back-end cria: `admin@teste.com`, `loja1@teste.com`, `loja2@teste.com`, `cliente1@teste.com` e `cliente2@teste.com`, todos com a senha do próprio arquivo (hoje `12345`). Os nomes de pessoas e lojas do modo simulado ficam só no front. Para os dois lados mostrarem os mesmos nomes, veja `docs/data-sql-sugerido.sql`.
