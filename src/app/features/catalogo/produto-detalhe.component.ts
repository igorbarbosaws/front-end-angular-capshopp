import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { ProdutoApi } from '../../core/api/apis';
import { ApiError, Produto } from '../../core/models';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/ui.services';
import { EstoqueComponent, ProdutoImagemComponent } from '../../shared/shared-components';

@Component({
  selector: 'app-produto-detalhe',
  standalone: true,
  imports: [CurrencyPipe, FormsModule, RouterLink, ProdutoImagemComponent, EstoqueComponent],
  template: `
    <a class="crumb" routerLink="/catalogo">‹ Voltar ao catálogo</a>

    @if (erro()) {
      <div class="empty">
        <h2>Produto indisponível</h2>
        <p class="muted">{{ erro() }}</p>
        <a class="btn pri" routerLink="/catalogo">Voltar ao catálogo</a>
      </div>
    } @else if (produto(); as p) {
      <section class="pd">
        <div class="big"><app-produto-imagem [nome]="p.nome" [url]="p.imagemUrl" /></div>
        <div>
          <h1>{{ p.nome }}</h1>
          <div class="seller">Vendido por {{ p.lojaNome }}</div>
          <span class="price">{{ p.preco | currency: 'BRL' }}</span>
          <app-estoque [estoque]="p.estoque" />
          <p>{{ p.descricao }}</p>

          <div class="buy">
            @if (p.estoque > 0) {
              <div>
                <label for="quantidade" style="font-weight: 600; font-size: 14px">Quantidade</label><br />
                <select id="quantidade" name="quantidade" [(ngModel)]="quantidade">
                  @for (n of opcoes(p); track n) {
                    <option [ngValue]="n">{{ n }}</option>
                  }
                </select>
              </div>
            }
            <button type="button" class="btn cta block" [disabled]="p.estoque < 1" (click)="adicionar(p)">
              Adicionar ao carrinho
            </button>
            <a class="btn block" style="text-align: center" routerLink="/carrinho">Ver carrinho ({{ cart.quantidadeTotal() }})</a>
          </div>
        </div>
      </section>
    } @else {
      <p class="muted">Carregando produto…</p>
    }
  `,
})
export class ProdutoDetalheComponent implements OnInit {
  private readonly api = inject(ProdutoApi);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly cart = inject(CartService);

  readonly produto = signal<Produto | null>(null);
  readonly erro = signal<string | null>(null);
  quantidade = 1;

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => Number(params.get('id'))),
        switchMap((id) => this.api.buscar(id)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (p) => (p.ativo ? this.produto.set(p) : this.erro.set('Este produto foi desativado.')),
        error: (e: ApiError) => this.erro.set(e.message),
      });
  }

  opcoes(p: Produto): number[] {
    return Array.from({ length: Math.min(p.estoque, 10) }, (_, i) => i + 1);
  }

  adicionar(p: Produto): void {
    const r = this.cart.adicionar(p, this.quantidade);
    this.toast.mostrar(r.mensagem, r.ok ? 'ok' : 'warn');
  }
}
