import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { ProdutoApi } from '../../core/api/apis';
import { ApiError, Produto } from '../../core/models';
import { CartService } from '../../core/services/cart.service';
import { BuscaService, ToastService } from '../../core/services/ui.services';
import { ProdutoCardComponent } from '../../shared/shared-components';

/** Catálogo do cliente. Busca somente por nome, sem filtro por loja nem ordenação por preço. */
@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [RouterLink, ProdutoCardComponent],
  template: `
    <div class="page-h">
      <h1>{{ busca.termo() ? 'Resultados para “' + busca.termo() + '”' : 'Catálogo' }}</h1>
      <span class="muted">
        {{ produtos().length }} produto(s)
        @if (busca.termo()) {
          · <a class="btn link" routerLink="/catalogo">Limpar busca</a>
        }
      </span>
    </div>

    @if (!busca.termo()) {
      <p class="intro">
        Compre de várias lojas em um só carrinho. Cada loja gera um pedido separado na confirmação.
        Produtos sem estoque continuam visíveis, mas não podem ser comprados.
      </p>
    }

    @if (carregando()) {
      <p class="muted">Carregando produtos…</p>
    } @else if (produtos().length) {
      <div class="grid">
        @for (p of produtos(); track p.id) {
          <app-produto-card [produto]="p" (adicionar)="adicionar($event)" (abrir)="abrir($event)" />
        }
      </div>
    } @else {
      <div class="empty">
        <h2>Nenhum produto encontrado</h2>
        <p class="muted">A busca considera apenas o nome do produto.</p>
        <a class="btn pri" routerLink="/catalogo">Ver todos os produtos</a>
      </div>
    }
  `,
})
export class CatalogoComponent implements OnInit {
  private readonly api = inject(ProdutoApi);
  private readonly cart = inject(CartService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly busca = inject(BuscaService);

  readonly produtos = signal<Produto[]>([]);
  readonly carregando = signal(true);

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(
        map((params) => params.get('q') ?? ''),
        tap((termo) => {
          this.busca.termo.set(termo);
          this.carregando.set(true);
        }),
        switchMap((termo) =>
          this.api.listarAtivos(termo).pipe(
            catchError((e: ApiError) => {
              this.toast.erro(e.message);
              return of<Produto[]>([]);
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((lista) => {
        this.produtos.set(lista);
        this.carregando.set(false);
      });
  }

  adicionar(produto: Produto): void {
    const r = this.cart.adicionar(produto, 1);
    this.toast.mostrar(r.mensagem, r.ok ? 'ok' : 'warn');
  }

  abrir(produto: Produto): void {
    this.router.navigate(['/catalogo', produto.id]);
  }
}
