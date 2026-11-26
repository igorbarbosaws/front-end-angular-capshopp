import { Component, OnInit, inject, signal } from '@angular/core';
import { AdminApi } from '../../core/api/apis';
import { APP_CONFIG } from '../../core/config';
import { MockDatabase } from '../../core/mock/mock-database';
import { ApiError, IndicadoresAdmin, LojaResumo, Usuario } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmService, ToastService } from '../../core/services/ui.services';

/**
 * Telas do administrador (PDF, seção 03): consulta SOMENTE dashboard, lojas e
 * clientes. O administrador não vê pedidos, e não há tela de cadastro de usuário.
 */

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div class="page-h"><h1>Dashboard</h1></div>
    @if (dados(); as d) {
      <div class="kpis">
        <div class="kpi"><b>{{ d.totalLojas }}</b><span>Total de lojas</span></div>
        <div class="kpi"><b>{{ d.totalClientes }}</b><span>Total de clientes</span></div>
        <div class="kpi"><b>{{ d.totalProdutos }}</b><span>Total de produtos</span></div>
        <div class="kpi"><b>{{ d.totalContas }}</b><span>Total de contas</span></div>
      </div>
    } @else {
      <p class="muted">Carregando indicadores…</p>
    }
    @if (mock) {
      <section class="panel" style="margin-top: 20px">
        <h2>Dados do sistema</h2>
        <p class="muted" style="margin: 0 0 12px; font-size: 13.5px">
          Volta ao estado inicial: produtos de exemplo restaurados, pedidos e carrinhos apagados.
        </p>
        <button type="button" class="btn" (click)="restaurar()">Restaurar dados iniciais</button>
      </section>
    }
  `,
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(AdminApi);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly db = inject(MockDatabase);
  private readonly auth = inject(AuthService);
  /** Só existe com dados simulados; com o back-end real a restauração não se aplica. */
  readonly mock = APP_CONFIG.useMock;
  readonly dados = signal<IndicadoresAdmin | null>(null);

  ngOnInit(): void {
    this.api.indicadores().subscribe({
      next: (d) => this.dados.set(d),
      error: (e: ApiError) => this.toast.erro(e.message),
    });
  }

  async restaurar(): Promise<void> {
    const ok = await this.confirm.perguntar({
      titulo: 'Restaurar dados iniciais?',
      mensagem: 'Os produtos de exemplo voltam e todos os pedidos e carrinhos são apagados.',
      confirmar: 'Restaurar',
      perigo: true,
    });
    if (!ok) return;
    this.db.restaurar();
    this.auth.logout();
    window.location.href = '/login';
  }
}

@Component({
  selector: 'app-lojas',
  standalone: true,
  template: `
    <div class="page-h"><h1>Lojas</h1></div>
    <div class="scroll">
      <table class="tbl">
        <thead>
          <tr><th>Loja</th><th>E-mail</th><th class="num">Produtos</th></tr>
        </thead>
        <tbody>
          @for (l of lojas(); track l.id) {
            <tr>
              <td><b>{{ l.nome }}</b></td>
              <td>{{ l.email }}</td>
              <td class="num">{{ l.quantidadeProdutos ?? '—' }}</td>
            </tr>
          } @empty {
            <tr><td colspan="3" class="muted">Nenhuma loja encontrada.</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class LojasComponent implements OnInit {
  private readonly api = inject(AdminApi);
  private readonly toast = inject(ToastService);
  readonly lojas = signal<LojaResumo[]>([]);

  ngOnInit(): void {
    this.api.listarLojas().subscribe({
      next: (l) => this.lojas.set(l),
      error: (e: ApiError) => this.toast.erro(e.message),
    });
  }
}

@Component({
  selector: 'app-clientes',
  standalone: true,
  template: `
    <div class="page-h"><h1>Clientes</h1></div>
    <div class="scroll">
      <table class="tbl">
        <thead>
          <tr><th>Cliente</th><th>E-mail</th></tr>
        </thead>
        <tbody>
          @for (c of clientes(); track c.id) {
            <tr>
              <td><b>{{ c.nome }}</b></td>
              <td>{{ c.email }}</td>
            </tr>
          } @empty {
            <tr><td colspan="2" class="muted">Nenhum cliente encontrado.</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class ClientesComponent implements OnInit {
  private readonly api = inject(AdminApi);
  private readonly toast = inject(ToastService);
  readonly clientes = signal<Usuario[]>([]);

  ngOnInit(): void {
    this.api.listarClientes().subscribe({
      next: (c) => this.clientes.set(c),
      error: (e: ApiError) => this.toast.erro(e.message),
    });
  }
}
