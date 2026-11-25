import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { PedidoApi } from '../api/apis';
import { ItemCarrinho, Pedido } from '../models';
import { URLS } from './api-urls';
import { PedidoDto } from './dto';
import { paraPedido } from './mappers';

/**
 * Pedidos no back-end Spring Boot. O Swagger devolve só um resumo nas listas
 * (sem itens nem nomes); nesse caso o detalhe de cada pedido é buscado em
 * seguida. Se o back-end passar a enviar os itens na lista, essas chamadas
 * extras deixam de acontecer sozinhas.
 */
@Injectable()
export class HttpPedidoApi extends PedidoApi {
  private readonly http = inject(HttpClient);

  confirmarCompra(clienteId: number, itens: ItemCarrinho[]): Observable<Pedido[]> {
    // clienteId vai junto porque o código do back-end o exige; o Swagger o ignora.
    return this.http
      .post<PedidoDto[]>(URLS.compras(), { clienteId, itens })
      .pipe(switchMap((lista) => this.completar(lista)));
  }

  listarDoCliente(clienteId: number): Observable<Pedido[]> {
    const params = new HttpParams().set('clienteId', clienteId);
    return this.http.get<PedidoDto[]>(URLS.pedidos(), { params }).pipe(switchMap((lista) => this.completar(lista)));
  }

  listarDaLoja(lojaId: number): Observable<Pedido[]> {
    const params = new HttpParams().set('lojistaId', lojaId);
    return this.http.get<PedidoDto[]>(URLS.pedidos(), { params }).pipe(switchMap((lista) => this.completar(lista)));
  }

  buscar(id: number): Observable<Pedido> {
    return this.http.get<PedidoDto>(URLS.pedido(id)).pipe(map(paraPedido));
  }

  /** O lojista é identificado pela sessão; nada vai no corpo. */
  concluir(id: number): Observable<Pedido> {
    return this.http.patch<PedidoDto | null>(URLS.pedidoConcluir(id), null).pipe(switchMap((dto) => this.aposAcao(id, dto)));
  }

  cancelar(id: number): Observable<Pedido> {
    return this.http.patch<PedidoDto | null>(URLS.pedidoCancelar(id), null).pipe(switchMap((dto) => this.aposAcao(id, dto)));
  }

  /** Lista resumida vira lista completa: pedidos sem itens têm o detalhe buscado. */
  private completar(lista: PedidoDto[]): Observable<Pedido[]> {
    if (!lista.length) return of([]);
    return forkJoin(lista.map((dto) => (Array.isArray(dto.itens) ? of(paraPedido(dto)) : this.buscar(dto.id))));
  }

  private aposAcao(id: number, dto: PedidoDto | null): Observable<Pedido> {
    return dto && Array.isArray(dto.itens) ? of(paraPedido(dto)) : this.buscar(id);
  }
}
