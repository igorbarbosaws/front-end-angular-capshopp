import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, switchMap, throwError } from 'rxjs';
import { ProdutoApi } from '../api/apis';
import { ApiError, Produto, ProdutoInput } from '../models';
import { AuthService } from '../services/auth.service';
import { URLS } from './api-urls';
import { ProdutoDto } from './dto';
import { paraProduto } from './mappers';

/**
 * Produtos no back-end Spring Boot. Diferenças já tratadas aqui:
 *  - o lojista vem da sessão; também enviamos lojistaId, que o código do back-end exige;
 *  - imagem por upload é uma segunda chamada (POST /produtos/{id}/imagem);
 *  - GET de um produto e "reativar" ainda não estão no Swagger (veja docs/INTEGRACAO-BACKEND.md).
 */
@Injectable()
export class HttpProdutoApi extends ProdutoApi {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  listarAtivos(busca = ''): Observable<Produto[]> {
    let params = new HttpParams();
    if (busca.trim()) params = params.set('nome', busca.trim());
    return this.http.get<ProdutoDto[]>(URLS.catalogo(), { params }).pipe(map((lista) => lista.map(paraProduto)));
  }

  /** Tenta GET /produtos/{id}; se o back-end não tiver, procura no catálogo (só produtos ativos). */
  buscar(id: number): Observable<Produto> {
    return this.http.get<ProdutoDto>(URLS.produto(id)).pipe(
      map(paraProduto),
      catchError((erro: unknown) =>
        erro instanceof ApiError && (erro.status === 404 || erro.status === 405)
          ? this.buscarNoCatalogo(id)
          : throwError(() => erro),
      ),
    );
  }

  /** Produtos do lojista logado, ativos e desativados. */
  listarDaLoja(lojaId: number): Observable<Produto[]> {
    const params = new HttpParams().set('lojistaId', lojaId);
    return this.http.get<ProdutoDto[]>(URLS.produtos(), { params }).pipe(map((lista) => lista.map(paraProduto)));
  }

  criar(lojaId: number, dados: ProdutoInput): Observable<Produto> {
    return this.http.post<ProdutoDto>(URLS.produtos(), this.corpo(dados, lojaId)).pipe(
      switchMap((criado) => this.enviarImagem(criado, dados)),
      map(paraProduto),
    );
  }

  atualizar(id: number, dados: ProdutoInput): Observable<Produto> {
    return this.http.put<ProdutoDto>(URLS.produto(id), this.corpo(dados, this.auth.usuario()?.id)).pipe(
      switchMap((atualizado) => this.enviarImagem(atualizado, dados)),
      map(paraProduto),
    );
  }

  alterarAtivo(id: number, ativo: boolean): Observable<Produto> {
    const url = ativo ? URLS.produtoAtivar(id) : URLS.produtoDesativar(id);
    return this.http.patch<ProdutoDto | null>(url, null).pipe(
      // O Swagger responde 204 (sem corpo); o código do back-end devolve o produto.
      switchMap((corpo) => (corpo ? of(paraProduto(corpo)) : this.buscarDaLoja(id))),
      catchError((erro: unknown) =>
        ativo && erro instanceof ApiError && (erro.status === 404 || erro.status === 405)
          ? throwError(() => new ApiError('A reativação de produtos ainda não está disponível no back-end.'))
          : throwError(() => erro),
      ),
    );
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(URLS.produto(id));
  }

  /** Corpo aceito pelo Swagger (imagemUrl) e pelo código do back-end (imagem, lojistaId). */
  private corpo(dados: ProdutoInput, lojistaId: number | undefined): object {
    // Com upload, a imagem vai na chamada seguinte; aqui segue sem URL.
    const imagem = dados.imagemArquivo ? null : dados.imagemUrl;
    return {
      lojistaId,
      nome: dados.nome,
      descricao: dados.descricao,
      preco: dados.preco,
      estoque: dados.estoque,
      imagemUrl: imagem,
      imagem,
    };
  }

  private enviarImagem(produto: ProdutoDto, dados: ProdutoInput): Observable<ProdutoDto> {
    if (!dados.imagemArquivo) return of(produto);
    const form = new FormData();
    form.append('arquivo', dados.imagemArquivo);
    return this.http.post<ProdutoDto>(URLS.produtoImagem(produto.id), form);
  }

  private buscarNoCatalogo(id: number): Observable<Produto> {
    return this.listarAtivos().pipe(
      map((lista) => {
        const achado = lista.find((p) => p.id === id);
        if (!achado) throw new ApiError('Produto não encontrado.', [], 404);
        return achado;
      }),
    );
  }

  private buscarDaLoja(id: number): Observable<Produto> {
    return this.listarDaLoja(this.auth.usuario()?.id ?? 0).pipe(
      map((lista) => {
        const achado = lista.find((p) => p.id === id);
        if (!achado) throw new ApiError('Produto não encontrado.', [], 404);
        return achado;
      }),
    );
  }
}
