import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { PedidoApi } from '../api/apis';
import { ItemCarrinho, ItemPedido, Pedido } from '../models';
import { MockDatabase, PedidoRegistro } from './mock-database';
import { erro, publico } from './mock-helpers';

@Injectable()
export class MockPedidoApi extends PedidoApi {
  private readonly db = inject(MockDatabase);

  confirmarCompra(clienteId: number, itens: ItemCarrinho[]): Observable<Pedido[]> {
    const cliente = this.db.usuarios.find((u) => u.id === clienteId && u.perfil === 'CLIENTE');
    if (!cliente) return erro('Cliente inválido.', 403);
    if (!itens.length) return erro('O carrinho está vazio.', 422);

    // 1) Valida TODOS os itens antes de mexer em qualquer estoque (sem compra parcial).
    const problemas: string[] = [];
    for (const item of itens) {
      const produto = this.db.estado.produtos.find((p) => p.id === item.produtoId);
      if (!produto || !produto.ativo) {
        problemas.push(`${produto?.nome ?? 'Produto ' + item.produtoId}: não está mais disponível.`);
      } else if (produto.estoque < item.quantidade) {
        problemas.push(`${produto.nome}: você pediu ${item.quantidade}, mas há ${produto.estoque} em estoque.`);
      }
    }
    if (problemas.length) {
      return erro('Estoque insuficiente. Nenhum pedido foi criado.', 409, problemas);
    }

    // 2) Agrupa por loja: um pedido por lojista.
    const porLoja = new Map<number, ItemCarrinho[]>();
    for (const item of itens) {
      const produto = this.db.estado.produtos.find((p) => p.id === item.produtoId)!;
      porLoja.set(produto.lojaId, [...(porLoja.get(produto.lojaId) ?? []), item]);
    }

    // 3) Desconta o estoque uma única vez e grava os pedidos com o preço da data da compra.
    const criados: PedidoRegistro[] = [];
    for (const [lojaId, itensLoja] of porLoja) {
      const loja = this.db.usuarios.find((u) => u.id === lojaId)!;
      const itensPedido: ItemPedido[] = itensLoja.map((item) => {
        const produto = this.db.estado.produtos.find((p) => p.id === item.produtoId)!;
        produto.estoque -= item.quantidade;
        return {
          produtoId: produto.id,
          nomeProduto: produto.nome,
          precoUnitario: produto.preco,
          quantidade: item.quantidade,
          imagemUrl: produto.imagemUrl,
        };
      });
      criados.push({
        id: this.db.estado.seq.pedido++,
        clienteId: cliente.id,
        clienteNome: cliente.nome,
        lojaId,
        lojaNome: loja.nome,
        status: 'PENDENTE',
        criadoEm: new Date().toISOString(),
        itens: itensPedido,
        total: itensPedido.reduce((s, i) => s + i.precoUnitario * i.quantidade, 0),
        estoqueReposto: false,
      });
    }
    this.db.estado.pedidos.push(...criados);
    this.db.salvar();
    return of(criados.map(publico));
  }

  listarDoCliente(clienteId: number): Observable<Pedido[]> {
    return of(this.ordenar(this.db.estado.pedidos.filter((o) => o.clienteId === clienteId)));
  }

  listarDaLoja(lojaId: number): Observable<Pedido[]> {
    return of(this.ordenar(this.db.estado.pedidos.filter((o) => o.lojaId === lojaId)));
  }

  buscar(id: number): Observable<Pedido> {
    const pedido = this.db.estado.pedidos.find((o) => o.id === id);
    return pedido ? of(publico(pedido)) : erro('Pedido não encontrado.', 404);
  }

  concluir(id: number, lojaId: number): Observable<Pedido> {
    const pedido = this.db.estado.pedidos.find((o) => o.id === id);
    if (!pedido) return erro('Pedido não encontrado.', 404);
    if (pedido.lojaId !== lojaId) return erro('Este pedido pertence a outra loja.', 403);
    if (pedido.status !== 'PENDENTE') return erro('Só é possível concluir pedidos pendentes.', 409);
    pedido.status = 'CONCLUIDO'; // sem novo desconto de estoque
    this.db.salvar();
    return of(publico(pedido));
  }

  cancelar(id: number, usuarioId: number): Observable<Pedido> {
    const pedido = this.db.estado.pedidos.find((o) => o.id === id);
    if (!pedido) return erro('Pedido não encontrado.', 404);
    if (pedido.clienteId !== usuarioId && pedido.lojaId !== usuarioId) {
      return erro('Você não pode cancelar este pedido.', 403);
    }
    if (pedido.status !== 'PENDENTE') return erro('Só é possível cancelar pedidos pendentes.', 409);
    pedido.status = 'CANCELADO';
    if (!pedido.estoqueReposto) {
      for (const item of pedido.itens) {
        const produto = this.db.estado.produtos.find((p) => p.id === item.produtoId);
        if (produto) produto.estoque += item.quantidade;
      }
      pedido.estoqueReposto = true; // reposição exatamente uma vez
    }
    this.db.salvar();
    return of(publico(pedido));
  }

  private ordenar(lista: PedidoRegistro[]): Pedido[] {
    return lista.map(publico).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  }
}
