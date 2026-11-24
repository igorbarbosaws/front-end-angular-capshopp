import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiError } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';

/** Login (PDF, seção 02). Não há cadastro público de usuários. */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login">
      <div class="login-brand">
        <div class="wm">CapShopp</div>
        <p>Várias lojas. Um só carrinho.</p>
      </div>

      <section class="panel" aria-labelledby="titulo-login">
        <h2 id="titulo-login">Entrar</h2>
        <form class="f" style="gap: 12px" (ngSubmit)="entrar()">
          <div class="fld">
            <label for="email">E-mail</label>
            <input id="email" name="email" type="email" autocomplete="username" placeholder="seu@email.com"
                   [(ngModel)]="email" required />
          </div>
          <div class="fld">
            <label for="senha">Senha</label>
            <input id="senha" name="senha" type="password" autocomplete="current-password" placeholder="••••••"
                   [(ngModel)]="senha" required />
          </div>
          @if (erro()) {
            <div class="note bad" role="alert">{{ erro() }}</div>
          }
          <button class="btn cta block" type="submit" [disabled]="carregando()">
            {{ carregando() ? 'Entrando…' : 'Entrar' }}
          </button>
        </form>
      </section>
    </div>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  senha = '';
  readonly erro = signal<string | null>(null);
  readonly carregando = signal(false);

  entrar(): void {
    this.erro.set(null);
    this.carregando.set(true);
    this.auth.login(this.email, this.senha).subscribe({
      next: () => this.router.navigateByUrl(this.auth.rotaInicial()),
      error: (e: ApiError) => {
        this.erro.set(e.message);
        this.carregando.set(false);
      },
    });
  }
}
