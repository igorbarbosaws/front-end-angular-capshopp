import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import localePt from '@angular/common/locales/pt';
import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { AuthApi, PedidoApi, ProdutoApi } from './core/api/apis';
import { APP_CONFIG } from './core/config';
import { apiErrorInterceptor } from './core/http/api-error.interceptor';
import { credenciaisInterceptor } from './core/http/credenciais.interceptor';
import { HttpAuthApi } from './core/http/http-auth.api';
import { HttpPedidoApi } from './core/http/http-pedido.api';
import { HttpProdutoApi } from './core/http/http-produto.api';
import { MockAuthApi } from './core/mock/mock-auth.api';
import { MockPedidoApi } from './core/mock/mock-pedido.api';
import { MockProdutoApi } from './core/mock/mock-produto.api';
import { routes } from './app.routes';

registerLocaleData(localePt);

const mock = APP_CONFIG.useMock;

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([credenciaisInterceptor, apiErrorInterceptor])),
    { provide: LOCALE_ID, useValue: 'pt-BR' },

    // Único ponto que escolhe entre dados simulados e back-end real (APP_CONFIG.useMock).
    { provide: AuthApi, useClass: mock ? MockAuthApi : HttpAuthApi },
    { provide: ProdutoApi, useClass: mock ? MockProdutoApi : HttpProdutoApi },
    { provide: PedidoApi, useClass: mock ? MockPedidoApi : HttpPedidoApi },
  ],
};
