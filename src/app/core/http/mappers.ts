import { APP_CONFIG } from '../config';
import { ItemPedido, LojaResumo, Pedido, Produto, Usuario } from '../models';
import { ContaDto, ItemPedidoDto, LojaDto, PedidoDto, ProdutoDto } from './dto';

/**
 * Converte o JSON do back-end (dto.ts) nos modelos usados pelas telas
 * (core/models.ts). Se o back-end mudar um nome de campo, o ajuste é aqui.
 */

function origemDaApi(): string {
  try {
    return new URL(APP_CONFIG.apiBaseUrl, window.location.origin).origin;
  } catch {
    return '';
  }
}

/** Imagem pode vir como URL completa, caminho "/api/imagens/x.png" ou só "x.png". */
export function urlImagem(imagem: string | null | undefined): string | null {
  const valor = imagem?.trim();
  if (!valor) return null;
  if (/^(https?:|data:)/i.test(valor)) return valor;
  if (valor.startsWith('/')) return `${origemDaApi()}${valor}`;
  return `${APP_CONFIG.apiBaseUrl}/imagens/${valor}`;
}

function paraIso(valor: string | number | undefined): string {
  if (valor === undefined) return '';
  return typeof valor === 'number' ? new Date(valor).toISOString() : valor;
}

export function paraUsuario(dto: ContaDto): Usuario {
  return { id: dto.id, nome: dto.nome, email: dto.email, perfil: dto.perfil };
}

export function paraLoja(dto: LojaDto): LojaResumo {
  return { ...paraUsuario(dto), quantidadeProdutos: dto.quantidadeProdutos ?? null };
}

export function paraProduto(dto: ProdutoDto): Produto {
  return {
    id: dto.id,
    lojaId: dto.lojistaId,
    // Enquanto o back-end não envia o nome da loja, mostramos "Loja <número>".
    lojaNome: dto.lojaNome ?? dto.nomeLoja ?? dto.loja ?? `Loja ${dto.lojistaId}`,
    nome: dto.nome,
    descricao: dto.descricao ?? '',
    preco: Number(dto.preco),
    estoque: dto.estoque,
    imagemUrl: urlImagem(dto.imagem),
    ativo: dto.ativo,
  };
}

function paraItem(dto: ItemPedidoDto): ItemPedido {
  return {
    produtoId: dto.produtoId,
    nomeProduto: dto.nomeProduto ?? dto.nome ?? `Produto ${dto.produtoId}`,
    precoUnitario: Number(dto.precoUnitario),
    quantidade: dto.quantidade,
    imagemUrl: urlImagem(dto.imagem),
  };
}

export function paraPedido(dto: PedidoDto): Pedido {
  const clienteId = dto.clienteId ?? 0;
  const lojaId = dto.lojistaId ?? 0;
  return {
    id: dto.id,
    clienteId,
    clienteNome: dto.clienteNome ?? dto.cliente ?? `Cliente ${clienteId}`,
    lojaId,
    lojaNome: dto.lojaNome ?? dto.loja ?? `Loja ${lojaId}`,
    status: dto.status,
    criadoEm: paraIso(dto.criadoEm ?? dto.data),
    itens: (dto.itens ?? []).map(paraItem),
    total: Number(dto.total),
  };
}
