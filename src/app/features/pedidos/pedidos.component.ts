import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PedidoApi } from '../../core/api/apis';
import { ApiError, Pedido, ROTULO_STATUS, StatusPedido } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmService, ToastService } from '../../core/services/ui.services';
import { ProdutoImagemComponent, StatusChipComponent } from '../../shared/shared-components';

type Filtro = 'TODOS' | StatusPedido;

/**
 * Lista de pedidos, usada por dois perfis (a rota informa o modo em data.modo):
 *   cliente: seus próprios pedidos; pode cancelar os PENDENTES
 *   lojista: pedidos da sua loja; pode concluir ou cancelar os PENDENTES
 */
@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink, ProdutoImagemComponent, StatusChipComponent],
  template: `
    <div class="page-h">
      <h1>{{ ehCliente ? 'Meus pedidos' : 'Pedidos da loja' }}</h1>
      <span class="muted">{{ pedidos().length }} pedido(s)</span>
    </div>

    @if (novos.length) {
      <div class="note ok" role="status">
        <b>Compra confirmada.</b> {{ novos.length }} pedido(s) criado(s), um para cada loja, com status Pendente.
      </div>
    }

    @if (carregando()) {
      <p class="muted">Carregando pedidos…</p>
    } @else {
      @if (pedidos().length) {
        <div class="tabs" role="group" aria-label="Filtrar por status">
          @for (f of filtros; track f) {
            <button type="button" class="tab" [attr.aria-pressed]="filtro() === f" (click)="filtro.set(f)">
              {{ rotuloFiltro(f) }} ({{ contar(f) }})
            </button>
          }
        </div>
      }

      @for (o of visiveis(); track o.id) {
        <article class="order" [style.border-color]="novos.includes(o.id) ? 'var(--ok)' : null">
          <div class="order-h">
            <div>Pedido realizado<b>{{ o.criadoEm | date: 'dd/MM/yyyy HH:mm' }}</b></div>
            <div>Total<b>{{ o.total | currency: 'BRL' }}</b></div>
            <div>{{ ehCliente ? 'Loja' : 'Cliente' }}<b>{{ ehCliente ? o.lojaNome : o.clienteNome }}</b></div>
            <div class="r">Pedido nº <b>{{ o.id }}</b><app-status-chip [status]="o.status" /></div>
          </div>
          <div class="order-b">
            @for (i of o.itens; track i.produtoId) {
              <div class="row">
                <div class="thumb"><app-produto-imagem [nome]="i.nomeProduto" [url]="i.imagemUrl" /></div>
                <div>
                  <div class="nm">{{ i.nomeProduto }}</div>
                  <span class="muted">{{ i.quantidade }} × {{ i.precoUnitario | currency: 'BRL' }}</span>
                </div>
                <div class="rt"><b>{{ i.precoUnitario * i.quantidade | currency: 'BRL' }}</b></div>
              </div>
            }
            <div class="order-act">
              <a class="btn sm" [routerLink]="[rotaBase, o.id]">Ver detalhes</a>
              @if (o.status === 'PENDENTE') {
                @if (!ehCliente) {
                  <button type="button" class="btn sm pri" (click)="concluir(o)">Marcar como concluído</button>
                }
                <button type="button" class="btn sm danger" (click)="cancelar(o)">Cancelar pedido</button>
              }
            </div>
          </div>
        </article>
      } @empty {
        <div class="empty">
          <h2>{{ pedidos().length ? 'Nenhum pedido neste status' : 'Nenhum pedido ainda' }}</h2>
          <p class="muted">
            {{ ehCliente ? 'Quando você confirmar uma compra, os pedidos aparecem aqui.' : 'Os pedidos feitos para a sua loja aparecem aqui.' }}
          </p>
          @if (ehCliente) {
            <a class="btn pri" routerLink="/catalogo">Ir ao catálogo</a>
          }
        </div>
      }
    }
  `,
})
export class PedidosComponent implements OnInit {
  private readonly api = inject(PedidoApi);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly route = inject(ActivatedRoute);

  readonly ehCliente = this.route.snapshot.data['modo'] === 'cliente';
  readonly rotaBase = this.ehCliente ? '/pedidos' : '/pedidos-loja';
  /** Ids dos pedidos acabados de criar (vindos do carrinho). */
  readonly novos: number[] = (history.state?.['novos'] as number[] | undefined) ?? [];

  readonly filtros: Filtro[] = ['TODOS', 'PENDENTE', 'CONCLUIDO', 'CANCELADO'];
  readonly filtro = signal<Filtro>('TODOS');
  readonly pedidos = signal<Pedido[]>([]);
  readonly carregando = signal(true);

  readonly visiveis = computed(() =>
    this.pedidos().filter((p) => this.filtro() === 'TODOS' || p.status === this.filtro()),
  );

  ngOnInit(): void {
    this.carregar();
  }

  rotuloFiltro(f: Filtro): string {
    return f === 'TODOS' ? 'Todos' : ROTULO_STATUS[f] + 's';
  }

  contar(f: Filtro): number {
    return f === 'TODOS' ? this.pedidos().length : this.pedidos().filter((p) => p.status === f).length;
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
      next: () => {
        this.toast.ok(`Pedido ${pedido.id} cancelado. Estoque devolvido.`);
        this.carregar();
      },
      error: (e: ApiError) => this.toast.erro(e.message),
    });
  }

  concluir(pedido: Pedido): void {
    const usuario = this.auth.usuario();
    if (!usuario) return;
    this.api.concluir(pedido.id, usuario.id).subscribe({
      next: () => {
        this.toast.ok(`Pedido ${pedido.id} concluído.`);
        this.carregar();
      },
      error: (e: ApiError) => this.toast.erro(e.message),
    });
  }

  private carregar(): void {
    const usuario = this.auth.usuario();
    if (!usuario) return;
    const consulta = this.ehCliente ? this.api.listarDoCliente(usuario.id) : this.api.listarDaLoja(usuario.id);
    consulta.subscribe({
      next: (lista) => {
        this.pedidos.set(lista);
        this.carregando.set(false);
      },
      error: (e: ApiError) => {
        this.toast.erro(e.message);
        this.carregando.set(false);
      },
    });
  }
}
