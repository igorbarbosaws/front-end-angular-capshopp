# Pedidos do front para o back-end

Para Edson e Paulo. Está em ordem de importância. O front já funciona sem os itens 3 a 7, com os avisos descritos em `INTEGRACAO-BACKEND.md`.

## Segurança (urgente)

1. **A senha do banco no Aiven está em texto no `application.properties` da branch `main`, e o repositório é público.** Troque a senha no painel do Aiven e passe a ler de variável de ambiente (`${DB_PASSWORD}`). Trocar só o arquivo não basta: o valor antigo continua no histórico do Git.

## Para a conexão funcionar

2. **Controllers.** O código (`codigoBackend`) tem services e DTOs, mas não tem controllers. O front espera os caminhos do Swagger (`docs/swaggercapshopp.yaml`).
3. **Decidir um só modelo de identificação.** O Swagger usa a sessão (cookie); os services recebem `clienteId` e `lojistaId`. O front envia os dois e funciona com qualquer um. Confirmem qual valerá e atualizem o Swagger.
4. **Mensagens de erro.** O Spring não envia `message` por padrão. Em `application.properties`, coloque `server.error.include-message=always` para o usuário ver "estoque insuficiente" em vez de "Erro 409".
5. **Dados que faltam nas respostas:**
   - `lojaNome` em cada produto (hoje só vem `lojistaId`);
   - `loja` e `cliente` (nomes) em cada pedido, e `imagem` em cada item;
   - `quantidadeProdutos` em cada loja do `/admin/dashboard`.
6. **Endpoints que faltam:** `GET /api/produtos/{id}` (já existe `buscar` no service) e `PATCH /api/produtos/{id}/ativar` para reativar produto.
7. **Combinar `GET /api/pedidos`:** se vier completo (com itens e nomes), o front não precisa buscar o detalhe de cada pedido.

## Alinhar com o PDF (Revisão 3.0)

8. A senha das contas deve ser `123456` (o `data.sql` usa `12345`).
9. O PDF diz que não há cadastro público de usuários, mas `UsuarioService` tem criar, atualizar e excluir. Se forem expostos, restrinjam ao ADMIN (ou deixem de fora).
10. Spring Boot: o PDF fala em 3.5 e o `pom.xml` usa 4.1.2. Confirmem a versão do grupo.
11. A branch `main` ainda usa PostgreSQL do Aiven; a `codigoBackend` usa H2 em memória. Definam qual será usada nos testes do grupo.
