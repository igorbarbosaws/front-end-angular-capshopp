import { Injectable, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { ProdutoApi } from '../api/apis';
import { Produto, ProdutoInput } from '../models';
import { MockDatabase } from './mock-database';
import { clonar, erro, normalizar, resolverImagem } from './mock-helpers';

@Injectable()
export class MockProdutoApi extends ProdutoApi {
  private readonly db = inject(MockDatabase);

  listarAtivos(busca = ''): Observable<Produto[]> {
    const termo = normalizar(busca.trim());
    const lista = this.db.estado.produtos.filter(
      (p) => p.ativo && (!termo || normalizar(p.nome).includes(termo)),
    );
    return of(clonar(lista));
  }

  buscar(id: number): Observable<Produto> {
    const produto = this.db.estado.produtos.find((p) => p.id === id);
    return produto ? of(clonar(produto)) : erro('Produto não encontrado.', 404);
  }

  listarDaLoja(lojaId: number): Observable<Produto[]> {
    return of(clonar(this.db.estado.produtos.filter((p) => p.lojaId === lojaId)));
  }

  criar(lojaId: number, dados: ProdutoInput): Observable<Produto> {
    const loja = this.db.usuarios.find((u) => u.id === lojaId && u.perfil === 'LOJISTA');
    if (!loja) return erro('Loja não encontrada.', 403);
    return resolverImagem(dados).pipe(
      map((imagemUrl) => {
        const produto: Produto = {
          id: this.db.estado.seq.produto++,
          lojaId,
          lojaNome: loja.nome,
          nome: dados.nome,
          descricao: dados.descricao,
          preco: dados.preco,
          estoque: dados.estoque,
          imagemUrl,
          ativo: true,
        };
        this.db.estado.produtos.push(produto);
        this.db.salvar();
        return clonar(produto);
      }),
    );
  }

  atualizar(id: number, dados: ProdutoInput): Observable<Produto> {
    const produto = this.db.estado.produtos.find((p) => p.id === id);
    if (!produto) return erro('Produto não encontrado.', 404);
    return resolverImagem(dados).pipe(
      map((imagemUrl) => {
        // Pedidos antigos guardam o preço da compra e não são afetados.
        Object.assign(produto, {
          nome: dados.nome,
          descricao: dados.descricao,
          preco: dados.preco,
          estoque: dados.estoque,
          imagemUrl,
        });
        this.db.salvar();
        return clonar(produto);
      }),
    );
  }

  alterarAtivo(id: number, ativo: boolean): Observable<Produto> {
    const produto = this.db.estado.produtos.find((p) => p.id === id);
    if (!produto) return erro('Produto não encontrado.', 404);
    produto.ativo = ativo;
    this.db.salvar();
    return of(clonar(produto));
  }

  excluir(id: number): Observable<void> {
    const produto = this.db.estado.produtos.find((p) => p.id === id);
    if (!produto) return erro('Produto não encontrado.', 404);
    const vinculado = this.db.estado.pedidos.some((o) => o.itens.some((i) => i.produtoId === id));
    if (vinculado) {
      return erro('Este produto está vinculado a pedidos e não pode ser excluído.', 409);
    }
    this.db.estado.produtos = this.db.estado.produtos.filter((p) => p.id !== id);
    this.db.salvar();
    return of(void 0);
  }
}
