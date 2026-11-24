/**
 * Modelos de domínio da CapShopp (PDF Revisão 3.0).
 * Estes tipos são o CONTRATO entre o front-end e o back-end: se o back-end
 * usar outros nomes de campos, ajuste aqui, em core/http/dto.ts e em core/http/mappers.ts.
 */

export type PerfilUsuario = 'ADMIN' | 'LOJISTA' | 'CLIENTE';
export type StatusPedido = 'PENDENTE' | 'CONCLUIDO' | 'CANCELADO';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
}

export interface Produto {
  id: number;
  lojaId: number;
  lojaNome: string;
  nome: string;
  descricao: string;
  preco: number;
  estoque: number;
  /** URL pública da imagem, ou null quando o produto não tem imagem. */
  imagemUrl: string | null;
  /** Produto desativado some do catálogo, mas continua ligado aos pedidos antigos. */
  ativo: boolean;
}

/** Dados enviados pelo lojista ao criar ou editar um produto. */
export interface ProdutoInput {
  nome: string;
  descricao: string;
  preco: number;
  estoque: number;
  imagemUrl: string | null;
  /** Upload local (JPG, PNG ou WebP, até 2 MB). Quando presente, substitui imagemUrl. */
  imagemArquivo?: File | null;
}

export interface ItemPedido {
  produtoId: number;
  nomeProduto: string;
  /** Preço da data da compra: não muda se o produto for editado depois. */
  precoUnitario: number;
  quantidade: number;
  imagemUrl: string | null;
}

export interface Pedido {
  id: number;
  clienteId: number;
  clienteNome: string;
  lojaId: number;
  lojaNome: string;
  status: StatusPedido;
  /** Data e hora em ISO 8601. */
  criadoEm: string;
  itens: ItemPedido[];
  total: number;
}

/** Item do carrinho, guardado no storage do navegador, um carrinho por cliente. */
export interface ItemCarrinho {
  produtoId: number;
  quantidade: number;
}

export interface IndicadoresAdmin {
  totalLojas: number;
  totalClientes: number;
  totalProdutos: number;
  totalContas: number;
}

export interface LojaResumo extends Usuario {
  /** null quando o back-end ainda não informa a quantidade. */
  quantidadeProdutos: number | null;
}

/** Erro padronizado de API. O back-end deve responder { mensagem, detalhes? }. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly detalhes: string[] = [],
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const ROTULO_PERFIL: Record<PerfilUsuario, string> = {
  ADMIN: 'Administrador',
  LOJISTA: 'Lojista',
  CLIENTE: 'Cliente',
};

export const ROTULO_STATUS: Record<StatusPedido, string> = {
  PENDENTE: 'Pendente',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
};
