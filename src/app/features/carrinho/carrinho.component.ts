import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { PedidoApi, ProdutoApi } from '../../core/api/apis';
import { ApiError, Produto } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/ui.services';
import { EstoqueComponent, ProdutoImagemComponent } from '../../shared/shared-components';

interface Linha {
  produto: Produto;
  quantidade: number;
  /** Quantidade no carrinho acima do estoque atual, ou produto desativado. */
  problema: string | null;
}

interface GrupoLoja {
  lojaId: number;
  lojaNome: string;
  linhas: Linha[];
}

/**
 * Carrinho do cliente. Os dados do produto (preço, estoque) são sempre relidos
 * da API; só produtoId e quantidade vêm do storage. A validação definitiva de
 * estoque é feita pelo back-end na confirmação.
 */
@Component({
  selector: 'app-carrinho',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, ProdutoImagemComponent, EstoqueComponent],
  template: `
    <div class="page-h">
      <h1>Carrinho</h1>
      <span class="muted">{{ cart.quantidadeTotal() }} item(ns)</span>
    </div>

    @if (carregando()) {
      <p class="muted">Carregando carrinho…</p>
    } @else if (!linhas().length) {
      <div class="empty">
        <h2>Seu carrinho está vazio</h2>
        <p class="muted">O carrinho é individual e fica salvo neste navegador, mesmo depois de sair.</p>
        <a class="btn pri" routerLink="/catalogo">Continuar comprando</a>
      </div>
    } @else {
      <div class="two">
        <section class="panel">
          @for (grupo of grupos(); track grupo.lojaId) {
            <div class="group">
              <div class="group-h">Enviado por <b>{{ grupo.lojaNome }}</b> · gera um pedido</div>
              @for (l of grupo.linhas; track l.produto.id) {
                <div class="row">
                  <div class="thumb"><app-produto-imagem [nome]="l.produto.nome" [url]="l.produto.imagemUrl" /></div>
                  <div>
                    <div class="nm">{{ l.produto.nome }}</div>
                    <span class="price">{{ l.produto.preco | currency: 'BRL' }}</span>
                    @if (l.problema) {
                      <div class="note warn" style="margin: 6px 0 0">{{ l.problema }}</div>
                    } @else {
                      <div><app-estoque [estoque]="l.produto.estoque" /></div>
                    }
                    <div class="qty" role="group" [attr.aria-label]="'Quantidade de ' + l.produto.nome">
                      <button type="button" aria-label="Diminuir" (click)="alterar(l, -1)">−</button>
                      <span>{{ l.quantidade }}</span>
                      <button type="button" aria-label="Aumentar" (click)="alterar(l, 1)">+</button>
                    </div>
                    <button type="button" class="btn link" style="margin-left: 12px" (click)="remover(l)">Remover</button>
                  </div>
                  <div class="rt">
                    <b>{{ l.produto.preco * l.quantidade | currency: 'BRL' }}</b>
                  </div>
                </div>
              }
            </div>
          }
        </section>

        <aside class="panel" aria-label="Resumo da compra">
          <h2>Resumo da compra</h2>
          <div class="sum-line"><span>Itens ({{ cart.quantidadeTotal() }})</span><span>{{ total() | currency: 'BRL' }}</span></div>
          <div class="note info">
            Esta compra vai gerar <b>{{ grupos().length }} pedido(s)</b>, um para cada loja. O estoque só é descontado
            na confirmação.
          </div>
          <div class="sum-line sum-total"><span>Total</span><span>{{ total() | currency: 'BRL' }}</span></div>

          @if (errosCompra().length) {
            <div class="note bad" role="alert">
              <b>Compra não realizada.</b> Nenhum pedido foi criado e nenhum estoque foi descontado.
              <ul>
                @for (e of errosCompra(); track e) {
                  <li>{{ e }}</li>
                }
              </ul>
            </div>
          }

          <button type="button" class="btn cta block" [disabled]="enviando()" (click)="confirmar()">
            {{ enviando() ? 'Confirmando…' : 'Confirmar compra' }}
          </button>
          <a class="btn block" style="margin-top: 8px; text-align: center" routerLink="/catalogo">Continuar comprando</a>
          <p class="muted" style="font-size: 12.5px; margin: 10px 0 0">
            O preço é registrado no momento da compra.
          </p>
        </aside>
      </div>
    }
  `,
})
export class CarrinhoComponent implements OnInit {
  private readonly produtoApi = inject(ProdutoApi);
  private readonly pedidoApi = inject(PedidoApi);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  protected readonly cart = inject(CartService);

  private readonly produtos = signal<Record<number, Produto>>({});
  readonly carregando = signal(true);
  readonly enviando = signal(false);
  readonly errosCompra = signal<string[]>([]);

  readonly linhas = computed<Linha[]>(() => {
    const catalogo = this.produtos();
    const resultado: Linha[] = [];
    for (const item of this.cart.itens()) {
      const produto = catalogo[item.produtoId];
      if (!produto) continue;
      let problema: string | null = null;
      if (!produto.ativo) problema = 'Produto desativado. Remova do carrinho.';
      else if (item.quantidade > produto.estoque) problema = `Estoque atual: ${produto.estoque}. Ajuste a quantidade.`;
      resultado.push({ produto, quantidade: item.quantidade, problema });
    }
    return resultado;
  });

  readonly grupos = computed<GrupoLoja[]>(() => {
    const mapa = new Map<number, GrupoLoja>();
    for (const linha of this.linhas()) {
      const { lojaId, lojaNome } = linha.produto;
      if (!mapa.has(lojaId)) mapa.set(lojaId, { lojaId, lojaNome, linhas: [] });
      mapa.get(lojaId)!.linhas.push(linha);
    }
    return [...mapa.values()];
  });

  readonly total = computed(() => this.linhas().reduce((s, l) => s + l.produto.preco * l.quantidade, 0));

  ngOnInit(): void {
    this.carregar();
  }

  alterar(linha: Linha, delta: number): void {
    const r = this.cart.alterar(linha.produto.id, delta, linha.produto.estoque);
    if (!r.ok) this.toast.mostrar(r.mensagem, 'warn');
    this.errosCompra.set([]);
  }

  remover(linha: Linha): void {
    this.cart.remover(linha.produto.id);
    this.errosCompra.set([]);
  }

  confirmar(): void {
    const usuario = this.auth.usuario();
    if (!usuario || this.enviando()) return;
    this.enviando.set(true);
    this.errosCompra.set([]);
    this.pedidoApi.confirmarCompra(usuario.id, this.cart.itens()).subscribe({
      next: (pedidos) => {
        this.cart.limpar();
        this.toast.ok(`Compra confirmada: ${pedidos.length} pedido(s) criado(s).`);
        this.router.navigate(['/pedidos'], { state: { novos: pedidos.map((p) => p.id) } });
      },
      error: (e: ApiError) => {
        // Falha total: nada foi criado nem descontado. Mostra os motivos e atualiza o estoque exibido.
        this.errosCompra.set(e.detalhes.length ? e.detalhes : [e.message]);
        this.enviando.set(false);
        this.carregar();
      },
    });
  }

  private carregar(): void {
    const itens = this.cart.itens();
    if (!itens.length) {
      this.produtos.set({});
      this.carregando.set(false);
      return;
    }
    forkJoin(itens.map((i) => this.produtoApi.buscar(i.produtoId).pipe(catchError(() => of(null))))).subscribe(
      (lista) => {
        const mapa: Record<number, Produto> = {};
        lista.forEach((p) => {
          if (p) mapa[p.id] = p;
        });
        this.produtos.set(mapa);
        this.carregando.set(false);
      },
    );
  }
}
