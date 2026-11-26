import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AdminApi } from '../api/apis';
import { IndicadoresAdmin, LojaResumo, Usuario } from '../models';
import { MockDatabase } from './mock-database';

@Injectable()
export class MockAdminApi extends AdminApi {
  private readonly db = inject(MockDatabase);

  indicadores(): Observable<IndicadoresAdmin> {
    const contar = (perfil: string) => this.db.usuarios.filter((u) => u.perfil === perfil).length;
    return of({
      totalLojas: contar('LOJISTA'),
      totalClientes: contar('CLIENTE'),
      totalProdutos: this.db.estado.produtos.length,
      totalContas: this.db.usuarios.length,
    });
  }

  listarLojas(): Observable<LojaResumo[]> {
    return of(
      this.db.usuarios
        .filter((u) => u.perfil === 'LOJISTA')
        .map(({ senha: _senha, ...u }) => ({
          ...u,
          quantidadeProdutos: this.db.estado.produtos.filter((p) => p.lojaId === u.id).length,
        })),
    );
  }

  listarClientes(): Observable<Usuario[]> {
    return of(
      this.db.usuarios.filter((u) => u.perfil === 'CLIENTE').map(({ senha: _senha, ...u }) => u),
    );
  }
}
