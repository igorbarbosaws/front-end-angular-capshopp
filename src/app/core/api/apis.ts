import { Observable } from 'rxjs';
import {
  IndicadoresAdmin,
  ItemCarrinho,
  LojaResumo,
  Pedido,
  Produto,
  ProdutoInput,
  Usuario,
} from '../models';

/**
 * Contratos de acesso a dados. Os componentes e serviços dependem SÓ destas
 * classes abstratas. Existem duas implementações:
 *   - core/mock/mock-*.api.ts  (dados simulados, regras do PDF aplicadas no navegador)
 *   - core/http/http-*.api.ts  (chamadas ao back-end Spring Boot)
 * A escolha é feita em app.config.ts, pela flag APP_CONFIG.useMock.
 *
 * As regras de negócio (estoque, pedidos por loja, cancelamento) são do BACK-END.
 * O front só exibe o resultado e as mensagens de erro.
 */

export abstract class AuthApi {
  /** O perfil vem do registro no banco, nunca do e-mail enviado. */
  abstract login(email: string, senha: string): Observable<Usuario>;
  /** Encerra a sessão no back-end (cookie de sessão). */
  abstract logout(): Observable<void>;
  /** Conta da sessão atual; 401 quando a sessão expirou. */
  abstract sessaoAtual(): Observable<Usuario>;
}

export abstract class ProdutoApi {
  /** Catálogo: só produtos ativos; busca apenas por nome. Estoque zero continua visível. */
  abstract listarAtivos(busca?: string): Observable<Produto[]>;
  abstract buscar(id: number): Observable<Produto>;
  /** Produtos da loja, ativos e desativados. */
  abstract listarDaLoja(lojaId: number): Observable<Produto[]>;
  abstract criar(lojaId: number, dados: ProdutoInput): Observable<Produto>;
  abstract atualizar(id: number, dados: ProdutoInput): Observable<Produto>;
  abstract alterarAtivo(id: number, ativo: boolean): Observable<Produto>;
  /** Produto ligado a pedidos não é excluído: o back-end responde 409. */
  abstract excluir(id: number): Observable<void>;
}

export abstract class PedidoApi {
  /**
   * Confirma a compra: gera UM pedido por loja, desconta o estoque uma única vez e
   * inicia cada pedido como PENDENTE. Se faltar estoque em qualquer item, a compra
   * inteira falha (409) com a lista de problemas em `detalhes`.
   */
  abstract confirmarCompra(clienteId: number, itens: ItemCarrinho[]): Observable<Pedido[]>;
  abstract listarDoCliente(clienteId: number): Observable<Pedido[]>;
  abstract listarDaLoja(lojaId: number): Observable<Pedido[]>;
  abstract buscar(id: number): Observable<Pedido>;
  /** Só o lojista dono, e só de PENDENTE para CONCLUIDO, sem novo desconto de estoque. */
  abstract concluir(id: number, lojaId: number): Observable<Pedido>;
  /** Cliente dono ou lojista dono, só se PENDENTE. Repõe o estoque exatamente uma vez. */
  abstract cancelar(id: number, usuarioId: number): Observable<Pedido>;
}

export abstract class AdminApi {
  abstract indicadores(): Observable<IndicadoresAdmin>;
  abstract listarLojas(): Observable<LojaResumo[]>;
  abstract listarClientes(): Observable<Usuario[]>;
}
