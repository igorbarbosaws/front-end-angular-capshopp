export interface AppConfig {
  /**
   * true  = usa dados simulados no navegador (core/mock).
   * false = chama o back-end Spring Boot (core/http).
   * Troque para false quando o back-end estiver disponível.
   */
  useMock: boolean;
  /**
   * Endereço base da API do back-end. Com "/api" o Angular encaminha as chamadas
   * ao Spring Boot pelo proxy de desenvolvimento (proxy.conf.json), sem CORS:
   *   ng serve --proxy-config proxy.conf.json -o
   * Em produção, use o endereço completo (ex.: "https://api.capshopp.com/api").
   */
  apiBaseUrl: string;
}

export const APP_CONFIG: AppConfig = {
  useMock: true,
  apiBaseUrl: '/api',
};
