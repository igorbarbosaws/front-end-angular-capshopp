import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Faz o navegador enviar e guardar o cookie de sessão (JSESSIONID) em toda
 * chamada à API. Sem isso, o back-end com sessão HTTP responderia 401.
 */
export const credenciaisInterceptor: HttpInterceptorFn = (req, next) =>
  next(req.clone({ withCredentials: true }));
