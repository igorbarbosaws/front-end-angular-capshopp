import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AuthApi } from '../api/apis';
import { Usuario } from '../models';
import { MockDatabase } from './mock-database';
import { erro } from './mock-helpers';

@Injectable()
export class MockAuthApi extends AuthApi {
  private readonly db = inject(MockDatabase);

  login(email: string, senha: string): Observable<Usuario> {
    const registro = this.db.usuarios.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.senha === senha,
    );
    if (!registro) return erro('E-mail ou senha incorretos.', 401);
    const { senha: _senha, ...usuario } = registro;
    return of(usuario);
  }

  /** No modo simulado não há sessão no servidor. */
  logout(): Observable<void> {
    return of(undefined);
  }

  sessaoAtual(): Observable<Usuario> {
    return erro('Não há sessão no modo simulado.', 401);
  }
}
