import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PerfilUsuario, ROTULO_PERFIL } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { BuscaService } from '../../core/services/ui.services';

interface ItemMenu {
  rota: string;
  rotulo: string;
}

/** Menu por perfil (PDF, seção 03). O administrador não tem item de pedidos. */
const MENU: Record<PerfilUsuario, ItemMenu[]> = {
  CLIENTE: [
    { rota: '/catalogo', rotulo: 'Catálogo' },
    { rota: '/pedidos', rotulo: 'Meus pedidos' },
    { rota: '/carrinho', rotulo: 'Carrinho' },
  ],
  LOJISTA: [
    { rota: '/meus-produtos', rotulo: 'Meus produtos' },
    { rota: '/pedidos-loja', rotulo: 'Pedidos da loja' },
  ],
  ADMIN: [
    { rota: '/dashboard', rotulo: 'Dashboard' },
    { rota: '/lojas', rotulo: 'Lojas' },
    { rota: '/clientes', rotulo: 'Clientes' },
  ],
};

/**
 * Casca persistente da SPA: cabeçalho, navegação por perfil e rodapé ficam fixos;
 * só o <router-outlet> (área central) muda.
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [FormsModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <header class="top">
      <div class="wrap topin">
        <a class="logo" [routerLink]="auth.rotaInicial()" aria-label="CapShopp, ir para o início">CapShopp</a>

        @if (ehCliente()) {
          <form class="search" role="search" (ngSubmit)="buscar()">
            <label class="sr" for="busca">Buscar produtos pelo nome</label>
            <input id="busca" name="busca" type="search" placeholder="Buscar produtos pelo nome" autocomplete="off"
                   [ngModel]="busca.termo()" (ngModelChange)="busca.termo.set($event)" />
            <button type="submit" aria-label="Buscar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
                   stroke-linecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
            </button>
          </form>
        }

        <div class="hright">
          <div class="hbtn" style="cursor: default">
            <small>{{ rotuloPerfil() }}</small><b>{{ auth.usuario()?.nome }}</b>
          </div>
          @if (ehCliente()) {
            <a class="hbtn" routerLink="/carrinho" [attr.aria-label]="'Carrinho, ' + cart.quantidadeTotal() + ' itens'">
              <b>Carrinho</b><span class="badge">{{ cart.quantidadeTotal() }}</span>
            </a>
          }
          <button type="button" class="hbtn" (click)="sair()"><b>Sair</b></button>
        </div>
      </div>
    </header>

    <nav class="sub" aria-label="Navegação principal">
      <div class="wrap subin">
        @for (item of menu(); track item.rota) {
          <a [routerLink]="item.rota" routerLinkActive ariaCurrentWhenActive="page">{{ item.rotulo }}</a>
        }
      </div>
    </nav>

    <main class="wrap" id="conteudo"><router-outlet /></main>

    <footer class="ft">
      <div class="wrap ftin">
        <span>© {{ ano }} CapShopp</span>
        <span>Várias lojas. Um só carrinho.</span>
      </div>
    </footer>
  `,
})
export class ShellComponent {
  protected readonly auth = inject(AuthService);
  protected readonly cart = inject(CartService);
  protected readonly busca = inject(BuscaService);
  private readonly router = inject(Router);

  readonly ano = new Date().getFullYear();
  readonly ehCliente = computed(() => this.auth.perfil() === 'CLIENTE');
  readonly menu = computed(() => {
    const perfil = this.auth.perfil();
    return perfil ? MENU[perfil] : [];
  });
  readonly rotuloPerfil = computed(() => {
    const perfil = this.auth.perfil();
    return perfil ? ROTULO_PERFIL[perfil] : '';
  });

  buscar(): void {
    const termo = this.busca.termo().trim();
    this.router.navigate(['/catalogo'], { queryParams: termo ? { q: termo } : {} });
  }

  sair(): void {
    this.auth.logout();
    this.busca.termo.set('');
    this.router.navigateByUrl('/login');
  }
}
