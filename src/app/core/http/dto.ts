import { PerfilUsuario, StatusPedido } from '../models';

/**
 * Formato das respostas do back-end (JSON). Existem dois documentos de
 * referência: o Swagger e os DTOs do código (branch codigoBackend). Quando um
 * campo muda de nome entre os dois, os dois aparecem aqui como opcionais e
 * mappers.ts escolhe o que vier. Campos marcados "pendente" ainda não existem.
 */

export interface ContaDto {
  id: number;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
}

export interface LojaDto extends ContaDto {
  /** pendente: o back-end ainda não informa. */
  quantidadeProdutos?: number | null;
}

export interface ProdutoDto {
  id: number;
  lojistaId: number;
  nome: string;
  descricao?: string | null;
  preco: number;
  estoque: number;
  /** URL externa, caminho "/api/imagens/..." ou só o nome do arquivo. */
  imagem?: string | null;
  ativo: boolean;
  /** pendente: nome da loja. Aceitamos estes nomes quando o back-end incluir. */
  lojaNome?: string | null;
  nomeLoja?: string | null;
  loja?: string | null;
}

export interface ItemPedidoDto {
  id?: number;
  produtoId: number;
  /** DTO do código: nomeProduto. Swagger: nome. */
  nomeProduto?: string;
  nome?: string;
  quantidade: number;
  precoUnitario: number;
  subtotal?: number;
  /** pendente: imagem do item. */
  imagem?: string | null;
}

export interface PedidoDto {
  id: number;
  status: StatusPedido;
  total: number;
  /** DTO do código: criadoEm. Swagger: data. */
  criadoEm?: string | number;
  data?: string | number;
  clienteId?: number;
  lojistaId?: number;
  /** Nomes (Swagger: cliente e loja). Pendentes no DTO do código. */
  cliente?: string;
  clienteNome?: string;
  loja?: string;
  lojaNome?: string;
  /** Ausente nas listas do Swagger (resumo): nesse caso o detalhe é buscado à parte. */
  itens?: ItemPedidoDto[];
}

export interface DashboardDto {
  lojas: number;
  clientes: number;
  produtos: number;
  contas: number;
  listaLojas: LojaDto[];
  listaClientes: ContaDto[];
}
