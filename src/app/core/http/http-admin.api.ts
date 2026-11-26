import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AdminApi } from '../api/apis';
import { IndicadoresAdmin, LojaResumo, Usuario } from '../models';
import { URLS } from './api-urls';
import { DashboardDto } from './dto';
import { paraLoja, paraUsuario } from './mappers';

/** O back-end entrega indicadores, lojas e clientes numa chamada só (GET /admin/dashboard). */
@Injectable()
export class HttpAdminApi extends AdminApi {
  private readonly http = inject(HttpClient);

  indicadores(): Observable<IndicadoresAdmin> {
    return this.painel().pipe(
      map((d) => ({
        totalLojas: d.lojas,
        totalClientes: d.clientes,
        totalProdutos: d.produtos,
        totalContas: d.contas,
      })),
    );
  }

  listarLojas(): Observable<LojaResumo[]> {
    return this.painel().pipe(map((d) => d.listaLojas.map(paraLoja)));
  }

  listarClientes(): Observable<Usuario[]> {
    return this.painel().pipe(map((d) => d.listaClientes.map(paraUsuario)));
  }

  private painel(): Observable<DashboardDto> {
    return this.http.get<DashboardDto>(URLS.dashboard());
  }
}
