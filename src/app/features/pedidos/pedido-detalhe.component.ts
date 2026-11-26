import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { PedidoApi } from '../../core/api/apis';
import { ApiError, Pedido } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmService, ToastService } from '../../core/services/ui.services';
import { StatusChipComponent } from '../../shared/shared-components';

/** Detalhe de um pedido (cliente ou lojista, conforme data.modo da rota). */
@Component({
  selector: 'app-pedido-detalhe',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink, StatusChipComponent],
  template: `
    <a class="crumb" [routerLink]="rotaLista">‹ Voltar para {{ ehCliente ? 'meus pedidos' : 'pedidos da loja' }}</a>

    @if (erro()) {
      <div class="empty">
        <h2>Pedido não encontrado</h2>
        <p class="muted">{{ erro() }}</p>
        <a class="btn pri" [routerLink]="rotaLista">Voltar</a>
      </div>
    } @else if (pedido(); as o) {
      <div class="page-h">
        <h1>Pedido nº {{ o.id }}</h1>
        <app-status-chip [status]="o.status" />
      </div>

      <div class="two">
        <section class="panel">
          <h2>Itens</h2>
          <div class="scroll" style="border: 0">
            <table class="tbl">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th class="num">Preço na compra</th>
                  <th class="num">Qtd</th>
                  <th class="num">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                @for (i of o.itens; track i.produtoId) {
                  <tr>
                    <td>{{ i.nomeProduto }}</td>
                    <td class="num">{{ i.precoUnitario | currency: 'BRL' }}</td>
                    <td class="num">{{ i.quantidade }}</td>
                    <td class="num">{{ i.precoUnitario * i.quantidade | currency: 'BRL' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <p class="muted" style="font-size: 13px">
            Os preços acima foram registrados na data da compra e não mudam se o produto for editado.
          </p>
        </section>

        <aside class="panel">
          <h2>Resumo</h2>
          <div class="sum-line"><span>Realizado em</span><span>{{ o.criadoEm | date: 'dd/MM/yyyy HH:mm' }}</span></div>
          <div class="sum-line"><span>{{ ehCliente ? 'Loja' : 'Cliente' }}</span><span>{{ ehCliente ? o.lojaNome : o.clienteNome }}</span></div>
          <div class="sum-line sum-total"><span>Total</span><span>{{ o.total | currency: 'BRL' }}</span></div>

          @if (o.status === 'CANCELADO') {
            <div class="note info">Pedido cancelado. O estoque dos itens foi devolvido uma única vez.</div>
          }
          @if (o.status === 'CONCLUIDO') {
            <div class="note ok">Pedido concluído. Não pode mais ser cancelado.</div>
          }
          @if (o.status === 'PENDENTE') {
            <div class="order-act">
              @if (!ehCliente) {
                <button type="button" class="btn sm pri" (click)="concluir(o)">Marcar como concluído</button>
              }
              <button type="button" class="btn sm danger" (click)="cancelar(o)">Cancelar pedido</button>
            </div>
          }
        </aside>
      </div>
    } @else {
      <p class="muted">Carregando pedido…</p>
    }
  `,
})
export class PedidoDetalheComponent implements OnInit {
  private readonly api = inject(PedidoApi);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly ehCliente = this.route.snapshot.data['modo'] === 'cliente';
  readonly rotaLista = this.ehCliente ? '/pedidos' : '/pedidos-loja';
  readonly pedido = signal<Pedido | null>(null);
  readonly erro = signal<string | null>(null);

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => Number(params.get('id'))),
        switchMap((id) => this.api.buscar(id)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (o) => {
          const usuario = this.auth.usuario();
          // O back-end deve negar o acesso a pedido de outra pessoa; aqui só evitamos exibir.
          const dono = this.ehCliente ? o.clienteId === usuario?.id : o.lojaId === usuario?.id;
          if (dono) this.pedido.set(o);
          else this.erro.set('Este pedido não pertence à sua conta.');
        },
        error: (e: ApiError) => this.erro.set(e.message),
      });
  }

  async cancelar(pedido: Pedido): Promise<void> {
    const usuario = this.auth.usuario();
    if (!usuario) return;
    const ok = await this.confirm.perguntar({
      titulo: 'Cancelar este pedido?',
      mensagem: `O pedido nº ${pedido.id} será cancelado e o estoque dos itens volta para a loja. Esta ação não pode ser desfeita.`,
      confirmar: 'Cancelar pedido',
      cancelar: 'Manter pedido',
      perigo: true,
    });
    if (!ok) return;
    this.api.cancelar(pedido.id, usuario.id).subscribe({
      next: (atualizado) => {
        this.pedido.set(atualizado);
        this.toast.ok(`Pedido ${pedido.id} cancelado. Estoque devolvido.`);
      },
      error: (e: ApiError) => this.toast.erro(e.message),
    });
  }

  concluir(pedido: Pedido): void {
    const usuario = this.auth.usuario();
    if (!usuario) return;
    this.api.concluir(pedido.id, usuario.id).subscribe({
      next: (atualizado) => {
        this.pedido.set(atualizado);
        this.toast.ok(`Pedido ${pedido.id} concluído.`);
      },
      error: (e: ApiError) => this.toast.erro(e.message),
    });
  }
}
