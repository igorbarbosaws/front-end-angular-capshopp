# CapShopp: front-end Angular

SPA em Angular (componentes standalone, signals e RxJS) baseada no **PDF "Resumo Estilizado do Projeto, Revisão 3.0"** e no protótipo HTML aprovado.
Hoje roda com **dados simulados no navegador**. Quando o back-end Spring Boot estiver pronto, troque uma flag e o mesmo código passa a chamar a API.

## Como rodar

Use o Angular CLI atual (Node.js compatível com a versão do CLI).

1. **Crie o projeto** (se ainda não criou; se já criou, pule este passo):

   ```powershell
   ng new frontend-capshopp --routing --style=scss
   cd frontend-capshopp
   ```

2. **Apague os arquivos gerados** dentro de `src/app/` (todos: `app.ts`, `app.html`, `app.css`/`app.scss`, `app.spec.ts`, `app.component.*`, `app.config.ts`, `app.routes.ts`) e o `src/styles.scss`, `src/index.html` e `src/main.ts` gerados.

3. **Copie a pasta `src/` deste pacote por cima** da pasta `src/` do projeto.

4. **Execute:**

   ```powershell
   ng serve -o
   ```

   Abre em `http://localhost:4200`, com dados simulados.

> Este pacote foi escrito sem acesso a um ambiente Angular para compilar. Se `ng serve` mostrar algum erro, copie a mensagem completa: costuma ser um ajuste pequeno de versão.

## Contas de demonstração (PDF, seção 02)

Para testar o sistema **no modo simulado** (`useMock: true`). Elas **não aparecem na tela de login**: digite o e-mail e a senha. Com o back-end ligado, valem as contas do `data.sql` dele (veja `docs/INTEGRACAO-BACKEND.md`).

Senha de todas: `123456`.

| Perfil | Nome | E-mail |
|---|---|---|
| ADMIN | Renata Figueiredo | renata.figueiredo@teste.com |
| LOJISTA | TechNova Eletrônicos | technova@teste.com |
| LOJISTA | Arena Gamer | arenagamer@teste.com |
| CLIENTE | Ana Beatriz Souza | ana.souza@teste.com |
| CLIENTE | Carlos Eduardo Lima | carlos.lima@teste.com |

Produtos de exemplo: a TechNova vende o smartphone e o notebook; a Arena Gamer vende o headset e o teclado (este sem estoque, para testar o bloqueio).

Para voltar aos dados iniciais, entre como ADMIN: o botão *Restaurar dados iniciais* fica no Dashboard (só com dados simulados).

Os nomes ficam em `src/app/core/mock/mock-database.ts` (dados simulados). No back-end real, entram por INSERT SQL.

Não há cadastro público de usuários, nem telas de cadastro ou edição de usuário.

## Estrutura

```
src/app/
├── app.component.ts      raiz: router-outlet + avisos + janela de confirmação
├── app.config.ts         providers; escolhe MOCK ou HTTP (única decisão)
├── app.routes.ts         rotas por perfil, com lazy loading
├── core/
│   ├── models.ts         tipos do domínio (CONTRATO com o back-end)
│   ├── config.ts         APP_CONFIG { useMock, apiBaseUrl }
│   ├── guards.ts         authGuard, loginGuard, perfilGuard, inicioGuard
│   ├── api/apis.ts       classes abstratas: AuthApi, ProdutoApi, PedidoApi, AdminApi
│   ├── mock/             dados simulados (localStorage) com as regras do PDF
│   ├── http/             back-end: api-urls, dto, mappers, http-*.api.ts e interceptores
│   ├── services/         AuthService, CartService, ToastService, ConfirmService, BuscaService
│   └── util/product-art.ts   ilustração padrão quando o produto não tem imagem
├── shared/               ProdutoCard, ProdutoImagem, StatusChip, Estoque, ToastHost, ConfirmHost
└── features/
    ├── login/            login
    ├── shell/            cabeçalho + navegação por perfil + rodapé (a "casca" da SPA)
    ├── catalogo/         catálogo (busca por nome) e detalhe do produto
    ├── carrinho/         carrinho individual e confirmação da compra
    ├── pedidos/          lista e detalhe (serve cliente e lojista, pelo data.modo da rota)
    ├── lojista/          meus produtos (CRUD) e formulário com upload
    └── admin/            dashboard, lojas e clientes
```

### Mapa protótipo HTML para Angular

| Protótipo | Angular |
|---|---|
| Tela de login | `LoginComponent` |
| Cabeçalho + abas + rodapé | `ShellComponent` |
| Catálogo / cartão de produto | `CatalogoComponent` / `ProdutoCardComponent` |
| Página do produto | `ProdutoDetalheComponent` |
| Carrinho e resumo | `CarrinhoComponent` |
| Meus pedidos / Pedidos da loja / detalhe | `PedidosComponent` / `PedidoDetalheComponent` |
| Meus produtos e formulário | `MeusProdutosComponent` / `ProdutoFormComponent` |
| Dashboard, lojas, clientes | `admin.pages.ts` |
| Modal de confirmação / avisos | `ConfirmService` + `ConfirmHostComponent` / `ToastService` + `ToastHostComponent` |

## Ligar ao back-end

Passo a passo e tabela de ajustes em **`docs/INTEGRACAO-BACKEND.md`**. Em resumo:

1. Suba o back-end (porta 8080).
2. Em `src/app/core/config.ts`, troque `useMock: false`.
3. Rode `ng serve --proxy-config proxy.conf.json -o`. O proxy encaminha `/api` ao Spring Boot, sem CORS.

Os caminhos ficam em `core/http/api-urls.ts` e os nomes de campo em `core/http/mappers.ts`. Telas, serviços e rotas não mudam: dependem apenas das classes abstratas de `core/api/apis.ts`. O que o front precisa do back-end está em `docs/PEDIDOS-AO-BACKEND.md`.

## Onde cada regra do PDF vive

| Regra | Front (Angular) | Back-end (obrigatório) |
|---|---|---|
| Perfil vem do banco, não do e-mail enviado | exibe o `perfil` devolvido | sim |
| Admin só vê dashboard, lojas e clientes | menu e rotas sem pedidos | sim (negar pedidos ao ADMIN) |
| Busca só por nome; sem filtro por loja nem ordenação por preço | campo de busca por nome | sim |
| Estoque zero visível, mas não comprável | botão bloqueado | sim |
| Carrinho individual, no storage, mesmo após logout | `CartService` (localStorage por e-mail) | n/a |
| Um pedido por loja na confirmação | exibe o resultado | **sim** |
| Falta de estoque em qualquer item derruba a compra inteira | mostra os motivos (`detalhes`) | **sim, em transação** |
| Estoque descontado uma única vez; cancelar repõe uma vez | n/a | **sim** |
| Só PENDENTE pode ser cancelado ou concluído | esconde os botões | **sim** |
| Preço do item = preço na data da compra | exibe `precoUnitario` | **sim** |
| Produto com pedidos não é excluído, só desativado | oferece desativar após um 409 | **sim** |
| Upload JPG, PNG ou WebP até 2 MB | valida no formulário | também validar |

Os mocks em `core/mock/mock-*.api.ts` implementam todas essas regras e servem de **referência executável** para o back-end.

## Pendências (do próprio PDF, seção 06)

Liberar ou restringir os endpoints CRUD de usuário; como guardar a senha fictícia; recriação dos 4 produtos a cada inicialização sem duplicar; estratégia de deploy segura (login mockado não protege API publicada).
