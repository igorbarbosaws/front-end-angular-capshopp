import { CurrencyPipe } from '@angular/common';
import { Component, HostListener, computed, inject, input, output, signal } from '@angular/core';
import { Produto, ROTULO_STATUS, StatusPedido } from '../core/models';
import { ConfirmService, ToastService } from '../core/services/ui.services';
import { arteProduto } from '../core/util/product-art';

/** Imagem do produto, com ilustração padrão quando não há URL ou ela falha. */
@Component({
  selector: 'app-produto-imagem',
  standalone: true,
  template: `<img [src]="src()" [alt]="nome()" (error)="falhou()" />`,
})
export class ProdutoImagemComponent {
  readonly nome = input.required<string>();
  readonly url = input<string | null | undefined>(null);
  private readonly falha = signal(false);

  readonly src = computed(() => {
    const url = this.url();
    return !this.falha() && url ? url : arteProduto(this.nome());
  });

  falhou(): void {
    this.falha.set(true);
  }
}

@Component({
  selector: 'app-status-chip',
  standalone: true,
  template: `<span class="chip" [class]="status()">{{ rotulo() }}</span>`,
})
export class StatusChipComponent {
  readonly status = input.required<StatusPedido>();
  readonly rotulo = computed(() => ROTULO_STATUS[this.status()]);
}

/** Texto de disponibilidade: estoque zero continua visível, mas bloqueia a compra. */
@Component({
  selector: 'app-estoque',
  standalone: true,
  template: `
    @if (estoque() < 1) {
      <span class="stock out">Indisponível (sem estoque)</span>
    } @else if (estoque() <= 3) {
      <span class="stock low">Restam apenas {{ estoque() }}</span>
    } @else {
      <span class="stock ok">Em estoque ({{ estoque() }})</span>
    }
  `,
})
export class EstoqueComponent {
  readonly estoque = input.required<number>();
}

@Component({
  selector: 'app-produto-card',
  standalone: true,
  imports: [CurrencyPipe, ProdutoImagemComponent, EstoqueComponent],
  template: `
    <article class="card">
      <button type="button" class="img" (click)="abrir.emit(produto())" [attr.aria-label]="'Ver ' + produto().nome">
        <app-produto-imagem [nome]="produto().nome" [url]="produto().imagemUrl" />
      </button>
      <h3 tabindex="0" (click)="abrir.emit(produto())" (keydown.enter)="abrir.emit(produto())">
        {{ produto().nome }}
      </h3>
      <div class="meta">
        <span class="price">{{ produto().preco | currency: 'BRL' }}</span>
        <div class="seller">Vendido por {{ produto().lojaNome }}</div>
        <app-estoque [estoque]="produto().estoque" />
      </div>
      <button type="button" class="btn cta" [disabled]="produto().estoque < 1" (click)="adicionar.emit(produto())">
        {{ produto().estoque < 1 ? 'Indisponível' : 'Adicionar ao carrinho' }}
      </button>
    </article>
  `,
})
export class ProdutoCardComponent {
  readonly produto = input.required<Produto>();
  readonly adicionar = output<Produto>();
  readonly abrir = output<Produto>();
}

/** Lista de avisos rápidos, fixa no rodapé da tela. */
@Component({
  selector: 'app-toast-host',
  standalone: true,
  template: `
    <div id="toasts" aria-live="polite">
      @for (aviso of toast.avisos(); track aviso.id) {
        <div class="toast" [class]="aviso.tipo">{{ aviso.texto }}</div>
      }
    </div>
  `,
})
export class ToastHostComponent {
  readonly toast = inject(ToastService);
}

/** Janela de confirmação aberta pelo ConfirmService. */
@Component({
  selector: 'app-confirm-host',
  standalone: true,
  template: `
    @if (confirm.aberta(); as c) {
      <div class="overlay" (click)="fechar($event)">
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-titulo">
          <h2 id="confirm-titulo">{{ c.titulo }}</h2>
          <p>{{ c.mensagem }}</p>
          <div class="acts">
            <button type="button" class="btn" (click)="confirm.responder(false)">{{ c.cancelar ?? 'Cancelar' }}</button>
            <button type="button" class="btn" [class.danger]="c.perigo" [class.pri]="!c.perigo" (click)="confirm.responder(true)">
              {{ c.confirmar }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmHostComponent {
  readonly confirm = inject(ConfirmService);

  fechar(evento: MouseEvent): void {
    if ((evento.target as HTMLElement).classList.contains('overlay')) this.confirm.responder(false);
  }

  @HostListener('document:keydown.escape')
  aoApertarEsc(): void {
    if (this.confirm.aberta()) this.confirm.responder(false);
  }
}
