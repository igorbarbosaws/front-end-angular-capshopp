import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AuthApi } from '../api/apis';
import { Usuario } from '../models';
import { URLS } from './api-urls';
import { ContaDto } from './dto';
import { paraUsuario } from './mappers';

/** Login e sessão no back-end Spring Boot (POST /auth/login, POST /auth/logout, GET /auth/me). */
@Injectable()
export class HttpAuthApi extends AuthApi {
  private readonly http = inject(HttpClient);

  login(email: string, senha: string): Observable<Usuario> {
    return this.http.post<ContaDto>(URLS.login(), { email, senha }).pipe(map(paraUsuario));
  }

  logout(): Observable<void> {
    return this.http.post<void>(URLS.logout(), null);
  }

  sessaoAtual(): Observable<Usuario> {
    return this.http.get<ContaDto>(URLS.sessaoAtual()).pipe(map(paraUsuario));
  }
}
