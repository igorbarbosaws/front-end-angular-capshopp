import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProdutoApi } from '../../core/api/apis';
import { ApiError, Produto } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmService, ToastService } from '../../core/services/ui.services';
import { ProdutoImagemComponent } from '../../shared/shared-components';

/** Lista dos produtos da própria loja (PDF: CRUD dos próprios produtos). */
@Component({
  selector: 'app-meus-produtos',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, ProdutoImagemComponent],
  template: `
    <div class="page-h">
      <h1>Meus produtos</h1>
      <a class="btn cta" routerLink="/meus-produtos/novo">Novo produto</a>
    </div>

    <div class="scroll">
      <table class="tbl">
        <thead>
          <tr>
            <th>Produto</th>
            <th class="num">Preço</th>
            <th class="num">Estoque</th>
            <th>Situação</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          @for (p of produtos(); track p.id) {
            <tr>
              <td>
                <div style="display: flex; gap: 12px; align-items: center">
                  <div class="thumb"><app-produto-imagem [nome]="p.nome" [url]="p.imagemUrl" /></div>
                  <b>{{ p.nome }}</b>
                </div>
              </td>
              <td class="num">{{ p.preco | currency: 'BRL' }}</td>
              <td class="num">{{ p.estoque }}</td>
              <td>
                @if (!p.ativo) {
                  <span class="chip off">Desativado</span>
                } @else if (p.estoque < 1) {
                  <span class="chip out">Sem estoque</span>
                } @else {
                  <span class="chip on">Ativo</span>
                }
              </td>
              <td>
                <div class="acts">
                  <a class="btn sm" [routerLink]="['/meus-produtos', p.id, 'editar']">Editar</a>
                  <button type="button" class="btn sm" (click)="alternar(p)">{{ p.ativo ? 'Desativar' : 'Reativar' }}</button>
                  <button type="button" class="btn sm danger" (click)="excluir(p)">Excluir</button>
                </div>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="5" class="muted">
                {{ carregando() ? 'Carregando produtos…' : 'Você ainda não tem produtos. Use “Novo produto”.' }}
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
    <p class="muted" style="font-size: 13px">
      Produtos vinculados a pedidos não são excluídos: ficam desativados e somem do catálogo.
    </p>
  `,
})
export class MeusProdutosComponent implements OnInit {
  private readonly api = inject(ProdutoApi);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  readonly produtos = signal<Produto[]>([]);
  readonly carregando = signal(true);

  ngOnInit(): void {
    this.carregar();
  }

  alternar(produto: Produto): void {
    this.api.alterarAtivo(produto.id, !produto.ativo).subscribe({
      next: (p) => {
        this.toast.ok(p.ativo ? 'Produto reativado e visível no catálogo.' : 'Produto desativado e oculto do catálogo.');
        this.carregar();
      },
      error: (e: ApiError) => this.toast.erro(e.message),
    });
  }

  async excluir(produto: Produto): Promise<void> {
    const ok = await this.confirm.perguntar({
      titulo: 'Excluir produto?',
      mensagem: `“${produto.nome}” será excluído de vez, se não tiver pedidos.`,
      confirmar: 'Excluir',
      perigo: true,
    });
    if (!ok) return;
    this.api.excluir(produto.id).subscribe({
      next: () => {
        this.toast.ok('Produto excluído.');
        this.carregar();
      },
      error: async (e: ApiError) => {
        // 409: produto vinculado a pedidos. A regra é do back-end; aqui só oferecemos desativar.
        if (e.status === 409 && produto.ativo) {
          const desativar = await this.confirm.perguntar({
            titulo: 'Este produto não pode ser excluído',
            mensagem: `${e.message} Você pode desativá-lo: ele some do catálogo e o histórico continua intacto.`,
            confirmar: 'Desativar produto',
          });
          if (desativar) this.alternar(produto);
        } else {
          this.toast.erro(e.message);
        }
      },
    });
  }

  private carregar(): void {
    const usuario = this.auth.usuario();
    if (!usuario) return;
    this.api.listarDaLoja(usuario.id).subscribe({
      next: (lista) => {
        this.produtos.set(lista);
        this.carregando.set(false);
      },
      error: (e: ApiError) => {
        this.toast.erro(e.message);
        this.carregando.set(false);
      },
    });
  }
}
