import { Routes } from '@angular/router';
import { authGuard, inicioGuard, loginGuard, perfilGuard } from './core/guards';
import { ShellComponent } from './features/shell/shell.component';

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

      // ----- Cliente -----
      {
        path: '',
        canActivate: [perfilGuard(['CLIENTE'])],
        children: [
          {
            path: 'catalogo',
            loadComponent: () => import('./features/catalogo/catalogo.component').then((m) => m.CatalogoComponent),
          },
          {
            path: 'catalogo/:id',
            loadComponent: () =>
              import('./features/catalogo/produto-detalhe.component').then((m) => m.ProdutoDetalheComponent),
          },
          {
            path: 'carrinho',
            loadComponent: () => import('./features/carrinho/carrinho.component').then((m) => m.CarrinhoComponent),
          },
          {
            path: 'pedidos',
            data: { modo: 'cliente' },
            loadComponent: () => import('./features/pedidos/pedidos.component').then((m) => m.PedidosComponent),
          },
          {
            path: 'pedidos/:id',
            data: { modo: 'cliente' },
            loadComponent: () =>
              import('./features/pedidos/pedido-detalhe.component').then((m) => m.PedidoDetalheComponent),
          },
        ],
      },

      // ----- Lojista -----
      {
        path: '',
        canActivate: [perfilGuard(['LOJISTA'])],
        children: [
          {
            path: 'meus-produtos',
            loadComponent: () =>
              import('./features/lojista/meus-produtos.component').then((m) => m.MeusProdutosComponent),
          },
          {
            path: 'meus-produtos/novo',
            loadComponent: () =>
              import('./features/lojista/produto-form.component').then((m) => m.ProdutoFormComponent),
          },
          {
            path: 'meus-produtos/:id/editar',
            loadComponent: () =>
              import('./features/lojista/produto-form.component').then((m) => m.ProdutoFormComponent),
          },
          {
            path: 'pedidos-loja',
            data: { modo: 'lojista' },
            loadComponent: () => import('./features/pedidos/pedidos.component').then((m) => m.PedidosComponent),
          },
          {
            path: 'pedidos-loja/:id',
            data: { modo: 'lojista' },
            loadComponent: () =>
              import('./features/pedidos/pedido-detalhe.component').then((m) => m.PedidoDetalheComponent),
          },
        ],
      },

      // ----- Administrador -----
      {
        path: '',
        canActivate: [perfilGuard(['ADMIN'])],
        children: [
          {
            path: 'dashboard',
            loadComponent: () => import('./features/admin/admin.pages').then((m) => m.DashboardComponent),
          },
          {
            path: 'lojas',
            loadComponent: () => import('./features/admin/admin.pages').then((m) => m.LojasComponent),
          },
          {
            path: 'clientes',
            loadComponent: () => import('./features/admin/admin.pages').then((m) => m.ClientesComponent),
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
