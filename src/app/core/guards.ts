import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PerfilUsuario } from './models';
import { AuthService } from './services/auth.service';

/** Exige usuário logado; senão vai para o login. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.usuario() ? true : inject(Router).createUrlTree(['/login']);
};

/** Quem já está logado não volta para a tela de login. */
export const loginGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.usuario() ? inject(Router).createUrlTree([auth.rotaInicial()]) : true;
};

/**
 * Restringe uma área a certos perfis (ex.: o administrador não acessa pedidos).
 * Atenção: guard de rota só organiza a navegação. A permissão real
 * é validada pelo back-end em cada requisição.
 */
export const perfilGuard =
  (permitidos: PerfilUsuario[]): CanActivateFn =>
  () => {
    const auth = inject(AuthService);
    const perfil = auth.perfil();
    return perfil && permitidos.includes(perfil) ? true : inject(Router).createUrlTree([auth.rotaInicial()]);
  };

/** Rota raiz: leva cada perfil à sua tela inicial. */
export const inicioGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return inject(Router).createUrlTree([auth.rotaInicial()]);
};
