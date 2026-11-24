import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthApi } from '../api/apis';
import { APP_CONFIG } from '../config';
import { Usuario } from '../models';

const CHAVE = 'capshopp-sessao-v2';

/**
 * Sessão do usuário. O PDF define login DIDÁTICO (sem Spring Security):
 * guardamos o usuário devolvido pelo back-end. Se o back-end usar sessão HTTP
 * (cookie JSESSIONID), o navegador cuida do cookie (veja credenciais.interceptor.ts)
 * e aqui só validamos a sessão ao abrir o sistema e no logout.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AuthApi);
  private readonly router = inject(Router);

  private readonly _usuario = signal<Usuario | null>(this.restaurar());
  readonly usuario = this._usuario.asReadonly();
  readonly perfil = computed(() => this._usuario()?.perfil ?? null);

  login(email: string, senha: string): Observable<Usuario> {
    return this.api.login(email, senha).pipe(
      tap((usuario) => this.guardar(usuario)),
    );
  }

  logout(): void {
    if (!APP_CONFIG.useMock) {
      // Avisa o back-end; se falhar, o usuário sai do mesmo jeito.
      this.api.logout().subscribe({ error: () => undefined });
    }
    this.limpar();
  }

  /** Ao abrir o sistema com back-end real: confirma que a sessão guardada ainda vale. */
  validarSessao(): void {
    if (APP_CONFIG.useMock || !this._usuario()) return;
    this.api.sessaoAtual().subscribe({
      next: (usuario) => this.guardar(usuario),
      error: () => undefined, // 401 é tratado em api-error.interceptor.ts
    });
  }

  /** Chamado quando o back-end responde 401 fora do login: a sessão acabou. */
  sessaoExpirada(): void {
    if (!this._usuario()) return;
    this.limpar();
    this.router.navigateByUrl('/login');
  }

  /** Tela inicial de cada perfil. */
  rotaInicial(): string {
    switch (this._usuario()?.perfil) {
      case 'CLIENTE':
        return '/catalogo';
      case 'LOJISTA':
        return '/meus-produtos';
      case 'ADMIN':
        return '/dashboard';
      default:
        return '/login';
    }
  }

  private guardar(usuario: Usuario): void {
    this._usuario.set(usuario);
    try {
      sessionStorage.setItem(CHAVE, JSON.stringify(usuario));
    } catch {
      // sessão só em memória
    }
  }

  private limpar(): void {
    this._usuario.set(null);
    try {
      sessionStorage.removeItem(CHAVE);
    } catch {
      // ignorado
    }
  }

  private restaurar(): Usuario | null {
    try {
      const bruto = sessionStorage.getItem(CHAVE);
      return bruto ? (JSON.parse(bruto) as Usuario) : null;
    } catch {
      return null;
    }
  }
}
