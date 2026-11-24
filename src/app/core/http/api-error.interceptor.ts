import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ApiError } from '../models';
import { AuthService } from '../services/auth.service';
import { URLS } from './api-urls';

/** Corpo de erro: formato do projeto ({mensagem}) ou o padrão do Spring ({message}, {detail}). */
interface CorpoErro {
  mensagem?: string;
  message?: string;
  detail?: string;
  detalhes?: string[];
}

/** Usado quando o back-end não manda texto (o Spring não envia "message" por padrão). */
function mensagemPadrao(status: number): string {
  switch (status) {
    case 0:
      return 'Não foi possível conectar ao servidor. Verifique se o back-end está em execução.';
    case 400:
      return 'Os dados enviados não são válidos.';
    case 401:
      return 'Sua sessão expirou ou os dados de acesso estão incorretos.';
    case 403:
      return 'Você não tem permissão para esta ação.';
    case 404:
      return 'Não encontrado.';
    case 409:
      return 'A operação não pôde ser concluída (por exemplo, estoque insuficiente ou pedido que não está pendente).';
    default:
      return `Erro inesperado (${status}).`;
  }
}

/**
 * Converte qualquer erro HTTP em ApiError, para as telas mostrarem mensagens
 * claras. Em 401 fora do login, encerra a sessão e volta ao login.
 */
export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(Injector);
  return next(req).pipe(
    catchError((erro: unknown) => {
      if (erro instanceof HttpErrorResponse) {
        if (erro.status === 401 && req.url !== URLS.login()) {
          injector.get(AuthService).sessaoExpirada();
        }
        const corpo = (typeof erro.error === 'object' ? erro.error : null) as CorpoErro | null;
        const texto = corpo?.mensagem || corpo?.message || corpo?.detail || '';
        const detalhes = Array.isArray(corpo?.detalhes) ? corpo.detalhes : [];
        return throwError(() => new ApiError(texto || mensagemPadrao(erro.status), detalhes, erro.status));
      }
      return throwError(() => erro);
    }),
  );
};
