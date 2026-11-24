import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { authGuard, inicioGuard, loginGuard } from './core/guards';
import { ShellComponent } from './features/shell/shell.component';

/** Provisório: as telas de cada perfil entram nos próximos Pull Requests. */
@Component({
  standalone: true,
  template: `
    <h1>Em construção</h1>
    <p class="muted">As telas deste perfil entram nos próximos Pull Requests.</p>
  `,
})
class EmConstrucaoComponent {}

/**
 * SPA única: o ShellComponent (cabeçalho + navegação + rodapé) fica fixo e só a
 * área central troca. Cada perfil enxerga apenas as suas rotas (PDF, seção 03):
 *   CLIENTE: catálogo, carrinho, pedidos   LOJISTA: produtos e pedidos da loja
 *   ADMIN:   dashboard, lojas e clientes (nunca pedidos)
 */
export const routes: Routes = [
  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', canActivate: [inicioGuard], children: [] },

      { path: '**', component: EmConstrucaoComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
