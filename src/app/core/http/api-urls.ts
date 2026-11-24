import { APP_CONFIG } from '../config';

/**
 * TODOS os endereços do back-end ficam aqui. Para trocar um caminho, mude só
 * este arquivo. Os caminhos seguem o Swagger do back-end (docs/swaggercapshopp.yaml
 * no repositório backend-capshopp). Os marcados PENDENTE ainda não existem lá.
 */
const base = () => APP_CONFIG.apiBaseUrl;

export const URLS = {
  // Autenticação
  login: () => `${base()}/auth/login`,
  logout: () => `${base()}/auth/logout`,
  sessaoAtual: () => `${base()}/auth/me`,

  // Administração
  dashboard: () => `${base()}/admin/dashboard`,

  // Produtos
  catalogo: () => `${base()}/catalogo`, // GET ?nome=
  produtos: () => `${base()}/produtos`, // GET (da loja), POST
  produto: (id: number) => `${base()}/produtos/${id}`, // PUT, DELETE (GET: PENDENTE no Swagger)
  produtoImagem: (id: number) => `${base()}/produtos/${id}/imagem`, // POST multipart, campo "arquivo"
  produtoDesativar: (id: number) => `${base()}/produtos/${id}/desativar`, // PATCH
  produtoAtivar: (id: number) => `${base()}/produtos/${id}/ativar`, // PATCH (PENDENTE)

  // Pedidos
  compras: () => `${base()}/compras`, // POST
  pedidos: () => `${base()}/pedidos`, // GET
  pedido: (id: number) => `${base()}/pedidos/${id}`, // GET
  pedidoConcluir: (id: number) => `${base()}/pedidos/${id}/concluir`, // PATCH
  pedidoCancelar: (id: number) => `${base()}/pedidos/${id}/cancelar`, // PATCH
};
